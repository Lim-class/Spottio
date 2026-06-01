// ==========================================
// FILE: chat-settings.js
// Gestione Preferenze, Sfondi e Impostazioni Utente
// ==========================================

function setupBackgroundUI() {
    const bgSelector = document.getElementById('bg-selector');
    const bgUpload = document.getElementById('bg-upload');

    bgSelector.addEventListener('change', async (e) => {
        const val = e.target.value;
        
        // 1. Applica il colore/sfondo nell'interfaccia
        if (val === 'custom') {
            bgUpload.click();
            bgSelector.value = 'default'; 
            return; // Non salviamo 'custom' nel DB per ora
        } else if (val === 'default') {
            messagesContainer.style.backgroundColor = '#f9fafb';
            messagesContainer.style.backgroundImage = 'none';
        } else {
            messagesContainer.style.backgroundColor = val;
            messagesContainer.style.backgroundImage = 'none';
        }

        // 2. SALVATAGGIO NEL DATABASE
        try {
            if (currentUser && currentUser.username) {
                await db.collection('users').doc(currentUser.username).set({
                    chatBackgroundColor: val
                }, { merge: true }); // merge: true è fondamentale per non sovrascrivere l'utente
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

/**
 * Popola dinamicamente il selettore di sfondo della chat con i colori della collezione 'ColoriSfondo'
 */
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
        console.log("Colori della chat caricati con successo da ColoriSfondo!");
    } catch (error) {
        console.error("Errore nel popolamento della tendina colori chat:", error);
    }
}

// Resa globale per permettere a messages-init.js di richiamarla al caricamento
window.loadChatColorsIntoSelector = loadChatColorsIntoSelector;