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
            // MODIFICA: Aggiorniamo le impostazioni dell'utente usando il suo UID
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

    bgUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                messagesContainer.style.backgroundImage = `url('${event.target.result}')`;
                messagesContainer.style.backgroundSize = 'cover';
                messagesContainer.style.backgroundPosition = 'center';
                messagesContainer.style.backgroundColor = 'transparent'; 
            };
            reader.readAsDataURL(file);
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