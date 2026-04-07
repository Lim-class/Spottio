// FILE: messages-main.js
// Stato Globale, Inizializzazione ed Eventi

const auth = firebase.auth();
const db = window.db; 

// Variabili globali
let currentUser = null;
let activeChat = { id: null, isGroup: false, name: '', members: [] };
let chatUnsubscribe = null;
let previewsUnsubscribe = null;

// Elementi DOM globali chat base
const userSearchInput = document.getElementById('user-search');
const searchResultsContainer = document.getElementById('search-results');
const chatsListContainer = document.getElementById('chats-list');
const chatHeader = document.getElementById('chat-header');
const chatRecipientName = document.getElementById('chat-recipient-name');
const chatSubtitle = document.getElementById('chat-subtitle');
const messagesContainer = document.getElementById('messages-container');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const noChatMessage = document.getElementById('no-chat-message');
const recipientAvatar = document.getElementById('recipient-avatar');

// Nuovi elementi DOM per layout Mobile
const btnBackToList = document.getElementById('btn-back-to-list');
const containerChatList = document.getElementById('chat-list-container');
const containerChatContent = document.getElementById('chat-content-container');

document.addEventListener('DOMContentLoaded', async () => {
    const loggedInUsername = localStorage.getItem('currentUser');
    
    // Inizializzazione stato mobile (Nasconde la chat all'avvio)
    if (window.innerWidth < 1024) {
        if(containerChatContent) containerChatContent.classList.add('hidden-mobile');
    }

    if (loggedInUsername) {
        currentUser = { username: loggedInUsername };
        
        // Avvia i listener esterni se esistono
        if (typeof listenToMyChats === 'function') listenToMyChats();
        
        // CARICAMENTO DEL COLORE DI SFONDO DAL DATABASE
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

    setupEventListeners();
    
    if (typeof setupBackgroundUI === 'function') setupBackgroundUI();
});

function setupEventListeners() {
    
    // 0. Gestione tasto indietro su Mobile
    if (btnBackToList) {
        btnBackToList.addEventListener('click', () => {
            containerChatList.classList.remove('hidden-mobile');
            containerChatContent.classList.add('hidden-mobile');
            
            // Opzionale: Resetta l'interfaccia quando si torna indietro
            chatHeader.classList.add('hidden');
            messageForm.classList.add('hidden');
            noChatMessage.classList.remove('hidden');
            messagesContainer.innerHTML = '';
            activeChat = { id: null, isGroup: false, name: '', members: [] };
        });
    }

    // 1. Ricerca Utenti Generale (Sidebar)
    if (userSearchInput) {
        userSearchInput.addEventListener('input', async (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            if (searchTerm.length === 0) { 
                if (typeof hideSearchResults === 'function') hideSearchResults(); 
                return; 
            }
            
            try {
                const snapshot = await db.collection("users").get();
                const filteredUsers = [];
                snapshot.forEach(doc => {
                    const docId = doc.id;
                    if (docId.toLowerCase().includes(searchTerm) && docId !== currentUser.username) {
                        filteredUsers.push({ id: docId, username: docId });
                    }
                });
                if (typeof renderSearchResults === 'function') renderSearchResults(filteredUsers);
            } catch (err) { console.error("Errore ricerca:", err); }
        });
    }

    // Gestione chiusure modali/risultati cliccando fuori
    document.addEventListener('click', (e) => {
        if (userSearchInput && searchResultsContainer && !userSearchInput.contains(e.target) && !searchResultsContainer.contains(e.target)) {
            if (typeof hideSearchResults === 'function') hideSearchResults();
        }
        
        // Assicura che la chiusura funzioni anche per gli elementi del gruppo
        const groupUserSearch = document.getElementById('group-user-search');
        const groupSearchResults = document.getElementById('group-search-results');
        if (groupUserSearch && groupSearchResults && !groupUserSearch.contains(e.target) && !groupSearchResults.contains(e.target)) {
            groupSearchResults.classList.add('hidden');
        }
    });

    // 2. Invio del messaggio (Gestisce sia DM che Gruppi)
    if (messageForm) {
        messageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = messageInput.value.trim();
            if (!text || !activeChat.id) return;

            const messageData = {
                sender: currentUser.username,
                text: text,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            let previewId = '';
            
            if (activeChat.isGroup) {
                messageData.groupId = activeChat.id;
                previewId = activeChat.id;
            } else {
                messageData.receiver = activeChat.id;
                messageData.conversationId = [currentUser.username, activeChat.id].sort().join('_'); 
                previewId = messageData.conversationId;
            }

            try {
                messageInput.value = '';
                await db.collection("chats").add(messageData);
                
                const previewData = {
                    lastMessage: text,
                    lastSender: currentUser.username,
                    lastUpdate: firebase.firestore.FieldValue.serverTimestamp(),
                };

                if (!activeChat.isGroup) {
                    previewData.participants = [currentUser.username, activeChat.id];
                    previewData.isGroup = false;
                }

                await db.collection("chat_previews").doc(previewId).set(previewData, { merge: true });

            } catch (err) {
                console.error("Errore invio messaggio:", err);
            }
        });
    }

    // 3. Avvia i listener per il modulo dei gruppi
    if (typeof setupGroupEventListeners === 'function') {
        setupGroupEventListeners();
    }
}