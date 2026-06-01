// ==========================================
// FILE: messages-init.js
// Avvio, Setup Stato e Inizializzazione Applicazione
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    const loggedInUsername = localStorage.getItem('currentUser');
    
    // Inizializzazione stato mobile (Nasconde la chat all'avvio)
    if (window.innerWidth < 1024) {
        if(containerChatContent) containerChatContent.classList.add('hidden-mobile');
    }

    if (loggedInUsername) {
        // Assegna alla variabile globale definita in messages-globals.js
        currentUser = { username: loggedInUsername };
        
        // 1. Avvia i listener esterni di lettura da Firebase (messages-chat.js)
        if (typeof listenToMyChats === 'function') listenToMyChats();
        
        // 2. Carica la tendina con i colori di ColoriSfondo (messages-ui.js)
        if (typeof window.loadChatColorsIntoSelector === 'function') {
            await window.loadChatColorsIntoSelector();
        }

        // 3. CARICAMENTO DEL COLORE DI SFONDO DAL DATABASE
        try {
            const userDoc = await db.collection('users').doc(currentUser.username).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                if (userData.chatBackgroundColor) {
                    const savedColor = userData.chatBackgroundColor;
                    const bgSelector = document.getElementById('bg-selector');
                    
                    if (bgSelector) bgSelector.value = savedColor;
                    
                    if (savedColor === 'default') {
                        messagesContainer.style.backgroundColor = '#f9fafb';
                    } else {
                        messagesContainer.style.backgroundColor = savedColor;
                    }
                    messagesContainer.style.backgroundImage = 'none';
                }
            }
        } catch (err) {
            console.error("Errore nel recupero del colore di sfondo:", err);
        }

    } else {
        window.location.href = 'index.html';
    }

    // 4. Inizializzazione Event Listener incrociati dai Moduli
    if (typeof setupSendListeners === 'function') setupSendListeners();
    if (typeof setupSearchListeners === 'function') setupSearchListeners();
    if (typeof setupGroupEventListeners === 'function') setupGroupEventListeners();
    if (typeof setupBackgroundUI === 'function') setupBackgroundUI();
});