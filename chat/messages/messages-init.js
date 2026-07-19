// ==========================================
// FILE: messages-init.js
// Avvio, Setup Stato e Inizializzazione Applicazione
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    
    // Inizializzazione stato mobile (Nasconde la chat all'avvio)
    if (window.innerWidth < 1024) {
        if(containerChatContent) containerChatContent.classList.add('hidden-mobile');
    }

    const authInstance = window.auth || firebase.auth();
    const dbInstance = window.db || firebase.firestore();

    // Aspettiamo che Firebase confermi in modo sicuro chi siamo
    authInstance.onAuthStateChanged(async (user) => {
        if (user) {
            
            // Popoliamo la variabile globale ereditata per retrocompatibilità
            const loggedInUsername = localStorage.getItem('currentUser') || "Utente";
            window.currentUser = { username: loggedInUsername };
            
            // 1. Avvia i listener esterni di lettura da Firebase (messages-chat.js)
            if (typeof listenToMyChats === 'function') listenToMyChats();
            
            // 2. Carica la tendina con i colori di ColoriSfondo (chat-settings.js)
            if (typeof window.loadChatColorsIntoSelector === 'function') {
                await window.loadChatColorsIntoSelector();
            }

            // 3. CARICAMENTO DEL COLORE DI SFONDO DAL DATABASE (Tramite UID!)
            try {
                const userDoc = await dbInstance.collection('users').doc(user.uid).get();
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

            // 4. Inizializzazione Event Listener incrociati dai Moduli
            if (typeof setupSendListeners === 'function') setupSendListeners();
            if (typeof setupSearchListeners === 'function') setupSearchListeners();
            if (typeof setupGroupEventListeners === 'function') setupGroupEventListeners();
            if (typeof setupBackgroundUI === 'function') setupBackgroundUI();
            
        } else {
            // Se non sei loggato, vieni reindirizzato subito
            window.location.href = 'login.html';
        }
    });
});