// ==========================================
// FILE: messages-globals.js
// Stato Globale e Costanti DOM
// ==========================================

const auth = firebase.auth();
const db = window.db; 

// Variabili globali di stato
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