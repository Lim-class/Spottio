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
    // Ricerca utenti su FIREBASE (stessa logica del Cerca Persone)
    userSearchInput.addEventListener('input', async (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        searchResultsContainer.innerHTML = '';
        
        if (searchTerm.length > 0) {
            try {
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
                            startNewChat(user.username);
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
            timestamp: Date.now() // Usiamo timestamp numerico come in Java
        };

        try {
            // Invio alla collezione globale "chats" come in Java
            await db.collection("chats").add(messageData);
            
            // Opzionale: aggiorniamo anche un'anteprima per la lista chat
            const chatId = [currentUser.username, targetUser].sort().join('_');
            await db.collection("chat_previews").doc(chatId).set({
                lastMessage: text,
                lastUpdate: Date.now(),
                participants: [currentUser.username, targetUser]
            }, { merge: true });

            messageInput.value = '';
        } catch (err) {
            console.error("Errore invio:", err);
        }
    });
}

// Ascolta le conversazioni attive (basato su una collezione di anteprime)
function listenToMyChats() {
    db.collection("chat_previews")
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
                const isSelected = targetUser === recipient;
                chatItem.className = `flex items-center p-3 mb-2 rounded-xl cursor-pointer transition ${isSelected ? 'bg-blue-100' : 'hover:bg-gray-100'}`;
                chatItem.innerHTML = `
                    <div class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-3">
                        ${recipient ? recipient.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div class="flex-grow overflow-hidden">
                        <h4 class="font-semibold text-gray-800">${recipient}</h4>
                        <p class="text-xs text-gray-500 truncate">${data.lastMessage || 'Invia un messaggio...'}</p>
                    </div>
                `;
                chatItem.onclick = () => startNewChat(recipient);
                chatsListContainer.appendChild(chatItem);
            });
        });
}

// Seleziona una chat e attiva l'ascolto con lo stesso filtro del file Java
function startNewChat(recipientName) {
    if (chatUnsubscribe) chatUnsubscribe();
    
    targetUser = recipientName;
    chatRecipientName.textContent = recipientName;
    chatHeader.classList.remove('hidden');
    messageForm.classList.remove('hidden');
    noChatMessage.classList.add('hidden');
    messagesContainer.innerHTML = '';

    // LOGICA DI FILTRAGGIO IDENTICA AL JAVA ChatFragment.java
    chatUnsubscribe = db.collection("chats")
        .orderBy("timestamp", "asc")
        .onSnapshot((snapshot) => {
            messagesContainer.innerHTML = '';
            snapshot.forEach(doc => {
                const msg = doc.data();
                
                // Filtro: solo messaggi tra ME e LUI o LUI e ME
                const isMyMsg = msg.sender === currentUser.username && msg.receiver === targetUser;
                const isHisMsg = msg.sender === targetUser && msg.receiver === currentUser.username;

                if (isMyMsg || isHisMsg) {
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
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
}
