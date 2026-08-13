// ==========================================
// FILE: impostazioni/accesso e sicurezzza/gestione-datanascita.js
// Logica per visualizzare e modificare la data di nascita (Rispetto età minima 14 anni)
// ==========================================

(function() {
    window.addEventListener('load', () => {
        const auth = window.auth;
        const db = window.db;

        if (!auth || !db) {
            console.error("Firebase non inizializzato per gestione-datanascita.");
            return;
        }

        const currentDobDisplay = document.getElementById('current-dob-display');
        const enableEditBtn = document.getElementById('enable-dob-edit');
        const editForm = document.getElementById('edit-dob-form');
        const newDobInput = document.getElementById('new-dob');
        const updateBtn = document.getElementById('update-dob-btn');

        if (!currentDobDisplay) return;

        // --- FUNZIONI DI UTILITÀ ---
        
        // Calcola l'età da una stringa formato YYYY-MM-DD
        function calcolaEta(dataNascitaStringa) {
            const oggi = new Date();
            const dataNascita = new Date(dataNascitaStringa);
            let eta = oggi.getFullYear() - dataNascita.getFullYear();
            const m = oggi.getMonth() - dataNascita.getMonth();
            if (m < 0 || (m === 0 && oggi.getDate() < dataNascita.getDate())) {
                eta--;
            }
            return eta;
        }

        // --- CARICAMENTO DATA ATTUALE ---
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const doc = await db.collection("users").doc(user.uid).get();
                    if (doc.exists) {
                        const userData = doc.data();
                        if (userData.birthDate) {
                            // Assumendo che sia salvata in formato italiano GG/MM/AAAA
                            currentDobDisplay.textContent = userData.birthDate;
                        } else {
                            currentDobDisplay.textContent = "Nessuna data impostata";
                            currentDobDisplay.classList.add("text-gray-400", "italic");
                        }
                    }
                } catch (error) {
                    console.error("Errore caricamento data di nascita:", error);
                    currentDobDisplay.textContent = "Errore di caricamento";
                }
            }
        });

        // --- GESTIONE INTERFACCIA ---
        enableEditBtn.addEventListener('click', () => {
            editForm.classList.toggle('hidden');
        });

        // --- SALVATAGGIO NUOVA DATA ---
        updateBtn.addEventListener('click', async () => {
            const dobVal = newDobInput.value;
            
            if (!dobVal) {
                alert("Seleziona una data di nascita valida.");
                return;
            }

            // Controllo Età Minima (14 anni)
            const ETA_MINIMA = 14;
            if (calcolaEta(dobVal) < ETA_MINIMA) {
                alert(`Devi avere almeno ${ETA_MINIMA} anni. Aggiornamento bloccato.`);
                return;
            }

            const lang = localStorage.getItem('selectedLanguage') || 'it';
            const user = auth.currentUser;
            if (!user) return;

            // Formattazione in italiano GG/MM/AAAA
            const [anno, mese, giorno] = dobVal.split('-');
            const birthDateIT = `${giorno}/${mese}/${anno}`;

            try {
                updateBtn.textContent = window.translations[lang]?.processingBtn || "Elaborazione...";
                updateBtn.disabled = true;

                await db.collection("users").doc(user.uid).update({
                    birthDate: birthDateIT
                });

                // Aggiornamento UI
                currentDobDisplay.textContent = birthDateIT;
                currentDobDisplay.classList.remove("text-gray-400", "italic");
                editForm.classList.add('hidden');
                newDobInput.value = '';

                alert(window.translations[lang]?.successDob || "Data di nascita aggiornata con successo!");

            } catch (error) {
                console.error("Errore salvataggio data:", error);
                alert("Errore durante l'aggiornamento. Riprova.");
            } finally {
                updateBtn.textContent = window.translations[lang]?.updateDobBtn || "Aggiorna Data";
                updateBtn.disabled = false;
            }
        });
    });
})();