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
let chatUnsubscribe = null; // Per pulire il listener quando si cambia chat

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
    // 1. Recupera l'utente loggato (salvato durante il login)
    const loggedInUsername = localStorage.getItem('currentUser');
    
    if (loggedInUsername) {
        currentUser = { username: loggedInUsername };
        console.log("Messaggi attivi per:", currentUser.username);
        
        // 2. Carica la lista delle chat esistenti
        listenToMyChats();
    } else {
        window.location.href = 'index.html';
    }

    setupEventListeners();
});

function setupEventListeners() {
    // Ricerca utenti su FIREBASE
    userSearchInput.addEventListener('input', async (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        searchResultsContainer.innerHTML = '';
        
        if (searchTerm.length > 0) {
            try {
                // Cerchiamo nella collezione "users" di Firebase
                const snapshot = await db.collection("users").get();
                const filteredUsers = [];
                
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const uname = data.username || "";
                    if (uname.toLowerCase().includes(searchTerm) && uname !== currentUser.username) {
                        filteredUsers.push({ id: doc.id, username: uname });
                    }
                });

                if (filteredUsers.length > 0) {
                    filteredUsers.forEach(user => {
                        const div = document.createElement('div');
                        div.className = 'p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0';
                        div.textContent = user.username;
                        div.onclick = () => {
                            startNewChat(user);
                            userSearchInput.value = '';
                            searchResultsContainer.classList.add('hidden');
                        };
                        searchResultsContainer.appendChild(div);
                    });
                    searchResultsContainer.classList.remove('hidden');
                } else {
                    searchResultsContainer.innerHTML = '<div class="p-3 text-gray-500 italic">Nessun utente trovato</div>';
                    searchResultsContainer.classList.remove('hidden');
                }
            } catch (err) {
                console.error("Errore ricerca:", err);
            }
        } else {
            searchResultsContainer.classList.add('hidden');
        }
    });

    // Invio Messaggio su FIREBASE
    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = messageInput.value.trim();
        if (!text || !currentChatId) return;

        const messageData = {
            sender: currentUser.username,
            text: text,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            // Aggiunge il messaggio alla sottocollezione della chat
            await db.collection("chats").doc(currentChatId).collection("messages").add(messageData);
            
            // Aggiorna l'anteprima della chat principale
            await db.collection("chats").doc(currentChatId).set({
                lastMessage: text,
                lastUpdate: firebase.firestore.FieldValue.serverTimestamp(),
                participants: currentChatId.split('_')
            }, { merge: true });

            messageInput.value = '';
        } catch (err) {
            console.error("Errore invio:", err);
        }
    });
}

// Ascolta le chat in cui l'utente è coinvolto
function listenToMyChats() {
    db.collection("chats")
        .where("participants", "array-contains", currentUser.username)
        .onSnapshot((snapshot) => {
            chatsListContainer.innerHTML = '';
            if (snapshot.empty) {
                chatsListContainer.innerHTML = '<p class="text-gray-400 text-center mt-4">Nessuna conversazione</p>';
                return;
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                const recipient = data.participants.find(p => p !== currentUser.username);
                
                const chatItem = document.createElement('div');
                chatItem.className = `flex items-center p-3 mb-2 rounded-xl cursor-pointer transition ${currentChatId === doc.id ? 'bg-blue-100' : 'hover:bg-gray-100'}`;
                chatItem.innerHTML = `
                    <div class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-3">
                        ${recipient ? recipient.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div class="flex-grow overflow-hidden">
                        <h4 class="font-semibold text-gray-800">${recipient}</h4>
                        <p class="text-xs text-gray-500 truncate">${data.lastMessage || 'Invia un messaggio...'}</p>
                    </div>
                `;
                chatItem.onclick = () => selectChat(doc.id, recipient);
                chatsListContainer.appendChild(chatItem);
            });
        });
}

// Seleziona una chat e attiva l'ascolto dei messaggi
function selectChat(chatId, recipientName) {
    if (chatUnsubscribe) chatUnsubscribe(); // Stop precedente listener
    
    currentChatId = chatId;
    chatRecipientName.textContent = recipientName;
    chatHeader.classList.remove('hidden');
    messageForm.classList.remove('hidden');
    noChatMessage.classList.add('hidden');
    messagesContainer.innerHTML = '';

    // Listener messaggi in tempo reale
    chatUnsubscribe = db.collection("chats").doc(chatId).collection("messages")
        .orderBy("timestamp", "asc")
        .onSnapshot((snapshot) => {
            messagesContainer.innerHTML = '';
            snapshot.forEach(doc => {
                const msg = doc.data();
                const isMe = msg.sender === currentUser.username;
                
                const msgDiv = document.createElement('div');
                msgDiv.className = `flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`;
                msgDiv.innerHTML = `
                    <div class="max-w-[80%] p-3 rounded-2xl shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-200 text-gray-800 rounded-tl-none'}">
                        <p class="text-sm">${msg.text}</p>
                    </div>
                `;
                messagesContainer.appendChild(msgDiv);
            });
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
}

// Inizia una nuova chat (o apre quella esistente)
function startNewChat(targetUser) {
    const participants = [currentUser.username, targetUser.username].sort();
    const chatId = participants.join('_');
    selectChat(chatId, targetUser.username);
}
