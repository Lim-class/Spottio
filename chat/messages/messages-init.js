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

            // 3. CARICAMENTO DEL COLORE O IMMAGINE DI SFONDO DAL DATABASE (Tramite UID!)
            try {
                const userDoc = await dbInstance.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    if (userData.chatBackgroundColor) {
                        const savedBg = userData.chatBackgroundColor;
                        const bgSelector = document.getElementById('bg-selector');
                        
                        // Se il valore è una URL (caricata da Cloudinary)
                        if (savedBg.startsWith('http://') || savedBg.startsWith('https://')) {
                            messagesContainer.style.backgroundImage = `url('${savedBg}')`;
                            messagesContainer.style.backgroundSize = 'cover';
                            messagesContainer.style.backgroundPosition = 'center';
                            messagesContainer.style.backgroundColor = 'transparent';
                        } else if (savedBg === 'default') {
                            messagesContainer.style.backgroundColor = '#f9fafb';
                            messagesContainer.style.backgroundImage = 'none';
                            if (bgSelector) bgSelector.value = 'default';
                        } else {
                            // È un colore esadecimale o standard
                            messagesContainer.style.backgroundColor = savedBg;
                            messagesContainer.style.backgroundImage = 'none';
                            if (bgSelector) bgSelector.value = savedBg;
                        }
                    }
                }
            } catch (err) {
                console.error("Errore nel recupero dello sfondo:", err);
            }

            // 4. Inizializzazione Event Listener incrociati dai Moduli
            if (typeof setupSendListeners === 'function') setupSendListeners();
            if (typeof setupMediaListeners === 'function') setupMediaListeners(); // <-- AGGIUNGI QUESTA RIGA
            if (typeof setupSearchListeners === 'function') setupSearchListeners();
            if (typeof setupGroupEventListeners === 'function') setupGroupEventListeners();
            if (typeof setupBackgroundUI === 'function') setupBackgroundUI();
            
        } else {
            // Se non sei loggato, vieni reindirizzato subito
            window.location.href = 'login.html';
        }
    });
});
