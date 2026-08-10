// ==========================================
// FILE: chat-settings.js
// Gestione Preferenze, Sfondi e Impostazioni Utente
// ==========================================

function setupBackgroundUI() {
    const bgSelector = document.getElementById('bg-selector');
    const bgUpload = document.getElementById('bg-upload');

    bgSelector.addEventListener('change', async (e) => {
        const val = e.target.value;
        
        if (val === 'custom') {
            bgUpload.click();
            bgSelector.value = 'default'; 
            return; 
        } else if (val === 'default') {
            messagesContainer.style.backgroundColor = '#f9fafb';
            messagesContainer.style.backgroundImage = 'none';
        } else {
            messagesContainer.style.backgroundColor = val;
            messagesContainer.style.backgroundImage = 'none';
        }

        try {
            // Salva il colore selezionato su Firestore
            if (currentUid) {
                await db.collection('users').doc(currentUid).set({
                    chatBackgroundColor: val
                }, { merge: true }); 
                console.log("Colore di sfondo salvato nel DB!");
            }
        } catch (error) {
            console.error("Errore nel salvataggio dello sfondo:", error);
        }
    });

    // Upload dell'immagine personalizzata su Cloudinary
    bgUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Feedback visivo temporaneo durante l'upload
        const previousBg = messagesContainer.style.backgroundImage;
        
        try {
            // Verifica che la funzione di upload da posta.js sia disponibile
            if (typeof uploadMediaToCloudinary !== 'function') {
                throw new Error("Funzione uploadMediaToCloudinary non disponibile.");
            }

            // 1. Upload su Cloudinary tramite preset/cloudName condivisi
            const mediaResult = await uploadMediaToCloudinary(file);
            
            if (mediaResult && mediaResult.url) {
                const imageUrl = mediaResult.url;

                // 2. Applicazione immediata all'interfaccia
                messagesContainer.style.backgroundImage = `url('${imageUrl}')`;
                messagesContainer.style.backgroundSize = 'cover';
                messagesContainer.style.backgroundPosition = 'center';
                messagesContainer.style.backgroundColor = 'transparent';

                // 3. Salvataggio della URL di Cloudinary su Firestore
                if (currentUid) {
                    await db.collection('users').doc(currentUid).set({
                        chatBackgroundColor: imageUrl
                    }, { merge: true });
                    console.log("URL immagine di sfondo salvata su Cloudinary e Firestore!");
                }
            }
        } catch (error) {
            console.error("Errore durante l'upload dello sfondo su Cloudinary:", error);
            alert("Errore caricamento immagine: " + error.message);
            messagesContainer.style.backgroundImage = previousBg;
        } finally {
            bgUpload.value = ''; // Reset dell'input file
        }
    });
}

async function loadChatColorsIntoSelector() {
    const bgSelector = document.getElementById('bg-selector');
    if (!bgSelector) return;

    try {
        const querySnapshot = await window.db.collection('ColoriSfondo').get();
        querySnapshot.forEach((doc) => {
            const colorData = doc.data();
            const option = document.createElement('option');
            option.value = colorData.hex; 
            option.textContent = colorData.nome || doc.id; 
            bgSelector.insertBefore(option, bgSelector.lastElementChild);
        });
    } catch (error) {
        console.error("Errore nel popolamento della tendina colori:", error);
    }
}
window.loadChatColorsIntoSelector = loadChatColorsIntoSelector;
