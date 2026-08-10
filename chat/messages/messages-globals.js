// ==========================================
// FILE: messages-globals.js
// Stato Globale e Costanti DOM
// ==========================================

const auth = window.auth || (typeof firebase !== 'undefined' ? firebase.auth() : null);
const db = window.db; 

// ✨ RECUPERO UID CENTRALIZZATO TRAMITE UTILITY
let currentUid = window.Spottio ? window.Spottio.getCurrentUid() : localStorage.getItem('currentUid');
let currentUsername = localStorage.getItem('currentUser');

if (auth) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUid = user.uid;
            localStorage.setItem('currentUid', currentUid);
        } else {
            window.location.href = 'login.html';
        }
    });
}

let activeChat = { id: null, isGroup: false, name: '', members: [] };
let chatUnsubscribe = null;
let previewsUnsubscribe = null;

window.userCache = window.userCache || {};

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

const btnBackToList = document.getElementById('btn-back-to-list');
const containerChatList = document.getElementById('chat-list-container');
const containerChatContent = document.getElementById('chat-content-container');

window.resolveUids = async function(uidArray) {
    const missingUids = uidArray.filter(uid => uid && !window.userCache[uid]);
    if (missingUids.length === 0) return;
    
    const promises = missingUids.map(uid => db.collection("users").doc(uid).get().then(doc => {
        if (doc.exists) window.userCache[uid] = doc.data();
    }));
    await Promise.all(promises);
};