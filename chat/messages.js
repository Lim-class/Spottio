// Configurazione Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAx_wHQ_K_B0lUSLUQLNupdX8krn0iiHtA",
    authDomain: "spottio-1419e.firebaseapp.com",
    projectId: "spottio-1419e",
    storageBucket: "spottio-1419e.firebasestorage.app"
};

// Inizializza Firebase solo se non è già stato inizializzato
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Variabili di stato globale
let currentUser = null;
let targetUser = null; 
let chatUnsubscribe = null;
let previewsUnsubscribe = null;

// Elementi del DOM
const userSearchInput = document.getElementById('user-search');
const searchResultsContainer = document.getElementById('search-results');
const chatsListContainer = document.getElementById('chats-list');
const chatHeader = document.getElementById('chat-header');
const chatRecipientName = document.getElementById('chat-recipient-name');
const messagesContainer = document.getElementById('messages-container');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const noChatMessage = document.getElementById('no-chat-message');
const recipientAvatar = document.getElementById('recipient-avatar');

document.addEventListener('DOMContentLoaded', () => {
    // 1. Recupero utente loggato dal localStorage
    const loggedInUsername = localStorage.getItem('currentUser');
    
    if (loggedInUsername) {
        currentUser = { username: loggedInUsername };
        console.log("Sistema messaggi avviato per:", currentUser.username);
        
        // 2. Avvia l'ascolto delle anteprime chat (lista a sinistra)
        listenToMyChats();
    } else {
        // Se non c'è sessione, torna al login
        window.location.href = 'index.html';
    }

    setupEventListeners();
});

/**
 * Configura gli eventi di interazione dell'utente
 */
function setupEventListeners() {
    // Ricerca Utenti dinamica
    userSearchInput.addEventListener('input', async (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (searchTerm.length === 0) {
            hideSearchResults();
            return;
        }
        
        try {
            const snapshot = await db.collection("users").get();
            const filteredUsers = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const docId = doc.id;
                const usernameField = data.username || "";
                
                const matchesUsername = usernameField.toString().toLowerCase().includes(searchTerm);
                const matchesDocId = docId.toLowerCase().includes(searchTerm);
                
                const displayName = usernameField || docId;

                if ((matchesUsername || matchesDocId) && displayName !== currentUser.username) {
                    filteredUsers.push({ id: docId, username: displayName });
                }
            });

            renderSearchResults(filteredUsers);
        } catch (err) {
            console.error("Errore ricerca utenti:", err);
        }
    });

    // Supporto per invio con tasto INVIO (WhatsApp style)
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            messageForm.dispatchEvent(new Event('submit'));
        }
    });

    // Chiusura automatica dei risultati della ricerca al click esterno
    document.addEventListener('click', (e) => {
        if (!userSearchInput.contains(e.target) && !searchResultsContainer.contains(e.target)) {
            hideSearchResults();
        }
    });

    // Invio del messaggio
    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = messageInput.value.trim();
        
        if (!text || !targetUser) return;

        const timestamp = Date.now(); 
        const messageData = {
            sender: currentUser.username,
            receiver: targetUser,
            text: text,
            timestamp: timestamp
        };

        try {
            messageInput.value = '';

            // 1. Aggiungi il messaggio alla collezione globale 'chats'
            await db.collection("chats").add(messageData);
            
            // 2. Aggiorna l'anteprima (per la lista a sinistra)
            const previewId = [currentUser.username, targetUser].sort().join('_');
            await db.collection("chat_previews").doc(previewId).set({
                lastMessage: text,
                lastUpdate: timestamp,
                participants: [currentUser.username, targetUser]
            }, { merge: true });

        } catch (err) {
            console.error("Errore nell'invio del messaggio:", err);
        }
    });
}

/**
 * Ascolta i cambiamenti nella lista delle conversazioni
 */
function listenToMyChats() {
    if (previewsUnsubscribe) previewsUnsubscribe();

    previewsUnsubscribe = db.collection("chat_previews")
        .where("participants", "array-contains", currentUser.username)
        .onSnapshot((snapshot) => {
            chatsListContainer.innerHTML = '';
            
            if (snapshot.empty) {
                chatsListContainer.innerHTML = '<p class="text-gray-400 text-center mt-6 text-sm italic">Nessuna conversazione trovata</p>';
                return;
            }

            const sortedDocs = snapshot.docs.sort((a, b) => {
                return (b.data().lastUpdate || 0) - (a.data().lastUpdate || 0);
            });

            sortedDocs.forEach(doc => {
                const data = doc.data();
                const recipient = data.participants.find(p => p !== currentUser.username);
                
                if (!recipient) return;

                const isSelected = targetUser === recipient;
                const chatDiv = document.createElement('div');
                chatDiv.className = `flex items-center p-3 mb-2 rounded-xl cursor-pointer transition-all duration-200 ${isSelected ? 'bg-blue-100 shadow-sm' : 'hover:bg-gray-100'}`;
                
                chatDiv.innerHTML = `
                    <div class="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-3 shrink-0 shadow-sm">
                        ${recipient.charAt(0).toUpperCase()}
                    </div>
                    <div class="flex-grow overflow-hidden">
                        <h4 class="font-semibold text-gray-800 truncate">${recipient}</h4>
                        <p class="text-xs text-gray-500 truncate">${data.lastMessage || 'Nessun messaggio'}</p>
                    </div>
                `;
                
                chatDiv.onclick = () => startNewChat(recipient);
                chatsListContainer.appendChild(chatDiv);
            });
        }, (err) => {
            console.error("Errore listener anteprime:", err);
        });
}

/**
 * Carica una conversazione specifica e attiva il listener dei messaggi
 */
function startNewChat(recipientName) {
    if (chatUnsubscribe) chatUnsubscribe();
    
    targetUser = recipientName;
    chatRecipientName.textContent = recipientName;
    
    if (recipientAvatar) {
        recipientAvatar.textContent = recipientName.charAt(0).toUpperCase();
    }
    
    chatHeader.classList.remove('hidden');
    messageForm.classList.remove('hidden');
    noChatMessage.classList.add('hidden');
    messagesContainer.innerHTML = '<div class="text-center my-auto text-gray-400 italic">Caricamento messaggi...</div>';

    chatUnsubscribe = db.collection("chats")
        .orderBy("timestamp", "asc")
        .onSnapshot((snapshot) => {
            messagesContainer.innerHTML = '';
            let messagesFound = false;

            snapshot.forEach(doc => {
                const msg = doc.data();
                const isFromMeToHim = msg.sender === currentUser.username && msg.receiver === targetUser;
                const isFromHimToMe = msg.sender === targetUser && msg.receiver === currentUser.username;

                if (isFromMeToHim || isFromHimToMe) {
                    messagesFound = true;
                    const isMe = msg.sender === currentUser.username;
                    renderSingleMessage(msg.text, isMe);
                }
            });

            if (!messagesFound) {
                messagesContainer.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-full text-gray-400 my-auto">
                        <p class="text-sm text-center">Inizia la tua conversazione con <strong>${targetUser}</strong>!</p>
                    </div>`;
            } else {
                // SCROLL AUTOMATICO AL FONDO
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }, (err) => {
            console.error("Errore listener messaggi:", err);
        });
}

/**
 * Disegna un singolo messaggio nel container
 */
function renderSingleMessage(text, isMe) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`;
    msgDiv.innerHTML = `
        <div class="max-w-[75%] p-3 rounded-2xl shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-200 text-gray-800 rounded-tl-none'}">
            <p class="text-sm leading-relaxed whitespace-pre-wrap">${text}</p>
        </div>
    `;
    messagesContainer.appendChild(msgDiv);
}

/**
 * Gestione UI ricerca
 */
function renderSearchResults(users) {
    searchResultsContainer.innerHTML = '';
    if (users.length > 0) {
        users.forEach(user => {
            const div = document.createElement('div');
            div.className = 'p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0 text-gray-700 font-medium transition-colors';
            div.textContent = user.username;
            div.onclick = () => {
                startNewChat(user.username);
                userSearchInput.value = '';
                hideSearchResults();
            };
            searchResultsContainer.appendChild(div);
        });
        searchResultsContainer.classList.remove('hidden');
    } else {
        searchResultsContainer.innerHTML = '<div class="p-3 text-gray-400 italic text-sm text-center">Nessun utente trovato</div>';
        searchResultsContainer.classList.remove('hidden');
    }
}

function hideSearchResults() {
    searchResultsContainer.innerHTML = '';
    searchResultsContainer.classList.add('hidden');
}
