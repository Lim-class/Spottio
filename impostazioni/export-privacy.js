document.addEventListener('DOMContentLoaded', () => {
    
    const checkDb = setInterval(() => {
        if (window.db) {
            clearInterval(checkDb);
            initPrivacySettings();
            initDataExport();
        }
    }, 500);

    // ==========================================
    // 1. LOGICA: ACCOUNT PRIVATO / PUBBLICO
    // ==========================================
    async function initPrivacySettings() {
        const togglePrivacy = document.getElementById('toggle-privacy');
        const statusMsg = document.getElementById('privacy-status-msg');
        const currentUser = localStorage.getItem('currentUser');

        if (!currentUser || currentUser === 'Guest') return;

        try {
            const userDoc = await window.db.collection('users').doc(currentUser).get();
            if (userDoc.exists) {
                const isPrivate = userDoc.data().isPrivate || false;
                togglePrivacy.checked = isPrivate;
            }
        } catch (error) {
            console.error("Errore lettura stato privacy:", error);
        }

        togglePrivacy.addEventListener('change', async (e) => {
            const isPrivate = e.target.checked;
            
            try {
                await window.db.collection('users').doc(currentUser).update({
                    isPrivate: isPrivate
                });

                statusMsg.textContent = isPrivate ? "Il tuo account è ora Privato." : "Il tuo account è ora Pubblico.";
                statusMsg.className = `text-sm font-medium mt-3 ${isPrivate ? 'text-green-600' : 'text-blue-600'}`;
                statusMsg.classList.remove('hidden');

                setTimeout(() => {
                    statusMsg.classList.add('hidden');
                }, 3000);

            } catch (error) {
                console.error("Errore aggiornamento stato privacy:", error);
                togglePrivacy.checked = !isPrivate; 
                alert("Errore durante l'aggiornamento. Riprova.");
            }
        });
    }

    // ==========================================
    // 2. LOGICA: ESPORTAZIONE DATI (JSON & HTML)
    // ==========================================
    function initDataExport() {
        const btnExportJson = document.getElementById('btn-export-json');
        const btnExportHtml = document.getElementById('btn-export-html');
        const currentUser = localStorage.getItem('currentUser');

        if (!btnExportJson || !btnExportHtml) return;

        // Funzione per raccogliere i dati da Firebase
        async function fetchUserData() {
            const userDoc = await window.db.collection('users').doc(currentUser).get();
            const userData = userDoc.exists ? userDoc.data() : {};

            // --- INIZIO GESTIONE DATI ALGORITMO ---
            // Formattiamo le preferenze in modo che i timestamp siano leggibili nell'esportazione
            let preferenze_algoritmo = {};
            if (userData.preferences) {
                for (const [category, data] of Object.entries(userData.preferences)) {
                    if (typeof data === 'object' && data !== null) {
                        preferenze_algoritmo[category] = {
                            punteggio: data.score || 0,
                            ultimo_aggiornamento: data.lastUpdate && typeof data.lastUpdate.toDate === 'function'
                                ? data.lastUpdate.toDate().toISOString()
                                : (data.lastUpdate ? new Date(data.lastUpdate).toISOString() : "Sconosciuto")
                        };
                    } else if (typeof data === 'number') {
                        // Compatibilità con dati non ancora migrati
                        preferenze_algoritmo[category] = {
                            punteggio: data,
                            ultimo_aggiornamento: "Sconosciuto (Formato vecchio)"
                        };
                    }
                }
                userData.preferenze_algoritmo = preferenze_algoritmo;
                delete userData.preferences; // Rimuoviamo il campo raw di Firestore
            }
            // --- FINE GESTIONE DATI ALGORITMO ---

            const postsQuery = await window.db.collection('posts')
                .where('user', '==', currentUser) 
                .get();
            
            const userPosts = [];
            const categoriesSet = new Set(); 

            postsQuery.forEach(doc => {
                const post = doc.data();
                if (post.timestamp && post.timestamp.toDate) {
                    post.timestamp = post.timestamp.toDate().toISOString();
                }
                
                if (post.category) {
                    categoriesSet.add(post.category);
                } else {
                    categoriesSet.add("Generale");
                }

                userPosts.push({ id: doc.id, ...post });
            });

            return {
                metadata: {
                    utente: currentUser,
                    dataRichiesta: new Date().toISOString(),
                    app: "Spottio"
                },
                profilo: userData,
                statistiche_post: {
                    numero_post_pubblicati: userPosts.length,
                    categorie_utilizzate: Array.from(categoriesSet)
                },
                post_pubblicati: userPosts
            };
        }

        // Funzione per avviare il download del file
        function downloadFile(content, fileName, mimeType) {
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        // --- GESTIONE BOTTONE JSON ---
        btnExportJson.addEventListener('click', async () => {
            if (!currentUser || currentUser === 'Guest') return alert("Devi essere loggato.");
            const originalHTML = btnExportJson.innerHTML;
            btnExportJson.innerHTML = `Elaborazione...`;
            btnExportJson.disabled = true;

            try {
                const exportData = await fetchUserData();
                const jsonString = JSON.stringify(exportData, null, 2);
                downloadFile(jsonString, `Spottio_Dati_${currentUser}.json`, "application/json");
            } catch (error) {
                console.error("Errore esportazione JSON:", error);
                alert("Errore durante l'estrazione. Riprova più tardi.");
            } finally {
                btnExportJson.innerHTML = originalHTML;
                btnExportJson.disabled = false;
            }
        });

        // --- GESTIONE BOTTONE HTML ---
        btnExportHtml.addEventListener('click', async () => {
            if (!currentUser || currentUser === 'Guest') return alert("Devi essere loggato.");
            const originalHTML = btnExportHtml.innerHTML;
            btnExportHtml.innerHTML = `Elaborazione...`;
            btnExportHtml.disabled = true;

            try {
                const exportData = await fetchUserData();
                
                // Generazione della lista HTML per i dati dell'algoritmo
                let htmlAlgoritmo = '';
                if (exportData.profilo.preferenze_algoritmo && Object.keys(exportData.profilo.preferenze_algoritmo).length > 0) {
                    htmlAlgoritmo += `<ul style="line-height: 1.8;">`;
                    for (const [cat, dati] of Object.entries(exportData.profilo.preferenze_algoritmo)) {
                        const dataLeggibile = (dati.ultimo_aggiornamento.includes('T')) 
                            ? new Date(dati.ultimo_aggiornamento).toLocaleString('it-IT') 
                            : dati.ultimo_aggiornamento;
                        
                        htmlAlgoritmo += `<li>
                            <strong>${cat}</strong>: Punteggio <span class="badge" style="margin-top: 0;">${dati.punteggio}</span> 
                            <span class="date" style="float: none; margin-left: 10px;">(Ultima interazione: ${dataLeggibile})</span>
                        </li>`;
                    }
                    htmlAlgoritmo += `</ul>`;
                } else {
                    htmlAlgoritmo = `<p>L'algoritmo non ha ancora registrato preferenze sufficienti.</p>`;
                }

                // Generazione della pagina HTML
                let htmlContent = `
                <!DOCTYPE html>
                <html lang="it">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Archivio Dati - ${exportData.metadata.utente}</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; color: #1f2937; padding: 20px; max-width: 800px; margin: auto; }
                        h1, h2 { border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
                        .card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-bottom: 20px; }
                        .post { border-left: 4px solid #3b82f6; background: white; padding: 15px 20px; margin-bottom: 15px; border-radius: 0 8px 8px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                        .badge { display: inline-block; background-color: #dbeafe; color: #1e40af; font-size: 12px; padding: 4px 8px; border-radius: 999px; font-weight: bold; margin-top: 10px; }
                        .date { font-size: 12px; color: #6b7280; float: right; margin-top: 12px; }
                    </style>
                </head>
                <body>
                    <h1>📦 Archivio Dati Spottio</h1>
                    
                    <div class="card">
                        <h2>Informazioni Generali</h2>
                        <p><strong>Utente:</strong> ${exportData.metadata.utente}</p>
                        <p><strong>Data di richiesta:</strong> ${new Date(exportData.metadata.dataRichiesta).toLocaleString('it-IT')}</p>
                    </div>

                    <div class="card">
                        <h2>🧠 Profilo Algoritmo (Interessi)</h2>
                        <p style="font-size: 14px; color: #6b7280; margin-bottom: 15px;">
                            Questi sono i dati utilizzati dall'algoritmo di Spottio per personalizzare il tuo feed. Il punteggio decresce automaticamente dopo 30 giorni di inattività.
                        </p>
                        ${htmlAlgoritmo}
                    </div>

                    <div class="card">
                        <h2>Statistiche</h2>
                        <p><strong>Post Pubblicati totali:</strong> ${exportData.statistiche_post.numero_post_pubblicati}</p>
                        <p><strong>Categorie utilizzate:</strong> ${exportData.statistiche_post.categorie_utilizzate.join(', ')}</p>
                    </div>

                    <h2>I Tuoi Post</h2>
                `;

                if (exportData.post_pubblicati.length === 0) {
                    htmlContent += `<p>Non hai ancora pubblicato nessun post.</p>`;
                } else {
                    exportData.post_pubblicati.forEach(post => {
                        const dateString = post.timestamp ? new Date(post.timestamp).toLocaleString('it-IT') : 'Data sconosciuta';
                        const postText = post.text ? post.text.replace(/</g, "&lt;").replace(/>/g, "&gt;") : 'Contenuto multimediale';
                        const postCat = post.category || 'Generale';

                        htmlContent += `
                        <div class="post">
                            <p>${postText}</p>
                            <span class="badge">${postCat}</span>
                            <span class="date">${dateString}</span>
                            <div style="clear: both;"></div>
                        </div>`;
                    });
                }

                htmlContent += `
                </body>
                </html>`;

                downloadFile(htmlContent, `Spottio_Dati_${currentUser}.html`, "text/html");
            } catch (error) {
                console.error("Errore esportazione HTML:", error);
                alert("Errore durante l'estrazione. Riprova più tardi.");
            } finally {
                btnExportHtml.innerHTML = originalHTML;
                btnExportHtml.disabled = false;
            }
        });
    }
});