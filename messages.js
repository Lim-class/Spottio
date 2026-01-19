// Configurazione Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAx_wHQ_K_B0lUSLUQLNupdX8krn0iiHtA",
    authDomain: "spottio-1419e.firebaseapp.com",
    projectId: "spottio-1419e",
    storageBucket: "spottio-1419e.firebasestorage.app"
};

// Inizializza Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Variabili di stato
let currentUser = null;
let currentChatId = null;
let targetUser = null; // Nome dell'utente con cui sto parlando
let chatUnsubscribe = null;

// DOM Elements
const userSearchInput = document.getElementById('user-search');
const searchResultsContainer = document.getElementById('search-results');
const chatsListContainer = document.getElementById('chats-list');
const chatHeader = document.getElementById('chat-header');
const chatRecipientName = document.getElementById('chat-recipient-name');
const messagesContainer = document.getElementById('messages-container');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const noChatMessage = document.getElementById('no-chat-message');

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Recupera l'utente loggato dalle SharedPreferences del browser (localStorage)
    const loggedInUsername = localStorage.getItem('currentUser');
    
    if (loggedInUsername) {
        currentUser = { username: loggedInUsername };
        console.log("Messaggi attivi per:", currentUser.username);
        
        // 2. Carica la lista delle conversazioni esistenti
        listenToMyChats();
    } else {
        window.location.href = 'index.html';
    }

    setupEventListeners();
});

function setupEventListeners() {
    // Ricerca utenti su FIREBASE migliorata
    userSearchInput.addEventListener('input', async (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        // Se la barra è vuota, nascondi i risultati
        if (searchTerm.length === 0) {
            searchResultsContainer.innerHTML = '';
            searchResultsContainer.classList.add('hidden');
            return;
        }
        
        try {
            // Recuperiamo tutti gli utenti (per piccoli database) o filtriamo
            // Nota: Firestore non supporta bene la ricerca partial string case-insensitive 
            // nativamente, quindi filtriamo i risultati scaricati per semplicità
            const snapshot = await db.collection("users").get();
            const filteredUsers = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const uname = data.username || "";
                // Filtriamo escludendo noi stessi e controllando se contiene il termine
                if (uname.toLowerCase().includes(searchTerm) && uname !== currentUser.username) {
                    filteredUsers.push({ id: doc.id, username: uname });
                }
            });

            searchResultsContainer.innerHTML = '';

            if (filteredUsers.length > 0) {
                filteredUsers.forEach(user => {
                    const div = document.createElement('div');
                    div.className = 'p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0 text-gray-700';
                    div.textContent = user.username;
                    div.onclick = () => {
                        console.log("Inizio chat con:", user.username);
                        startNewChat(user.username);
                        userSearchInput.value = '';
                        searchResultsContainer.innerHTML = '';
                        searchResultsContainer.classList.add('hidden');
                    };
                    searchResultsContainer.appendChild(div);
                });
                searchResultsContainer.classList.remove('hidden');
            } else {
                searchResultsContainer.innerHTML = '<div class="p-3 text-gray-400 italic">Nessun utente trovato</div>';
                searchResultsContainer.classList.remove('hidden');
            }
        } catch (err) {
            console.error("Errore durante la ricerca utenti:", err);
        }
    });

    // Chiudi la ricerca se si clicca fuori
    document.addEventListener('click', (e) => {
        if (!userSearchInput.contains(e.target) && !searchResultsContainer.contains(e.target)) {
            searchResultsContainer.classList.add('hidden');
        }
    });

    // Invio Messaggio su FIREBASE (Coerente con ChatFragment.java)
    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = messageInput.value.trim();
        if (!text || !targetUser) return;

        // Struttura dati identica a quella usata nel file Java
        const messageData = {
            sender: currentUser.username,
            receiver: targetUser,
            text: text,
            timestamp: Date.now() 
        };

        try {
            // Invio alla collezione globale "chats"
            await db.collection("chats").add(messageData);
            
            // Aggiorniamo anche un'anteprima per la lista chat a sinistra
            const chatId = [currentUser.username, targetUser].sort().join('_');
            await db.collection("chat_previews").doc(chatId).set({
                lastMessage: text,
                lastUpdate: Date.now(),
                participants: [currentUser.username, targetUser]
            }, { merge: true });

            messageInput.value = '';
        } catch (err) {
            console.error("Errore nell'invio del messaggio:", err);
        }
    });
}

// Ascolta le conversazioni attive
function listenToMyChats() {
    db.collection("chat_previews")
        .where("participants", "array-contains", currentUser.username)
        .onSnapshot((snapshot) => {
            chatsListContainer.innerHTML = '';
            if (snapshot.empty) {
                chatsListContainer.innerHTML = '<p class="text-gray-400 text-center mt-4 text-sm italic">Nessuna conversazione attiva</p>';
                return;
            }

            // Ordiniamo le chat per data di ultimo aggiornamento (lato client)
            const sortedDocs = snapshot.docs.sort((a, b) => b.data().lastUpdate - a.data().lastUpdate);

            sortedDocs.forEach(doc => {
                const data = doc.data();
                const recipient = data.participants.find(p => p !== currentUser.username);
                
                const chatItem = document.createElement('div');
                const isSelected = targetUser === recipient;
                chatItem.className = `flex items-center p-3 mb-2 rounded-xl cursor-pointer transition ${isSelected ? 'bg-blue-100' : 'hover:bg-gray-100'}`;
                chatItem.innerHTML = `
                    <div class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-3 shrink-0">
                        ${recipient ? recipient.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div class="flex-grow overflow-hidden">
                        <div class="flex justify-between items-baseline">
                            <h4 class="font-semibold text-gray-800 truncate">${recipient}</h4>
                        </div>
                        <p class="text-xs text-gray-500 truncate">${data.lastMessage || '...'}</p>
                    </div>
                `;
                chatItem.onclick = () => startNewChat(recipient);
                chatsListContainer.appendChild(chatItem);
            });
        }, (error) => {
            console.error("Errore nelle chat_previews:", error);
        });
}

// Seleziona una chat e attiva l'ascolto (Filtro incrociato come Java)
function startNewChat(recipientName) {
    if (chatUnsubscribe) chatUnsubscribe();
    
    targetUser = recipientName;
    chatRecipientName.textContent = recipientName;
    chatHeader.classList.remove('hidden');
    messageForm.classList.remove('hidden');
    noChatMessage.classList.add('hidden');
    messagesContainer.innerHTML = '<div class="text-center p-4 text-gray-400 italic">Caricamento messaggi...</div>';

    // Listener messaggi (Filtro identico a ChatFragment.java)
    chatUnsubscribe = db.collection("chats")
        .orderBy("timestamp", "asc")
        .onSnapshot((snapshot) => {
            messagesContainer.innerHTML = '';
            let hasMessages = false;

            snapshot.forEach(doc => {
                const msg = doc.data();
                const isMyMsg = msg.sender === currentUser.username && msg.receiver === targetUser;
                const isHisMsg = msg.sender === targetUser && msg.receiver === currentUser.username;

                if (isMyMsg || isHisMsg) {
                    hasMessages = true;
                    const isMe = msg.sender === currentUser.username;
                    const msgDiv = document.createElement('div');
                    msgDiv.className = `flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`;
                    msgDiv.innerHTML = `
                        <div class="max-w-[80%] p-3 rounded-2xl shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-200 text-gray-800 rounded-tl-none'}">
                            <p class="text-sm">${msg.text}</p>
                        </div>
                    `;
                    messagesContainer.appendChild(msgDiv);
                }
            });

            if (!hasMessages) {
                messagesContainer.innerHTML = '<p class="text-center text-gray-400 mt-10">Nessun messaggio. Inizia tu la conversazione!</p>';
            }
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, (error) => {
            console.error("Errore nel caricamento messaggi:", error);
        });
}
