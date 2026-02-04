"use strict";

// messages.js
// Variabili globali per l'applicazione
var currentUser = null;
var currentChatId = null; // DOM Elements

var userSearchInput = document.getElementById('user-search');
var searchResultsContainer = document.getElementById('search-results');
var chatsListContainer = document.getElementById('chats-list');
var chatHeader = document.getElementById('chat-header');
var chatRecipientName = document.getElementById('chat-recipient-name');
var messagesContainer = document.getElementById('messages-container');
var messageForm = document.getElementById('message-form');
var messageInput = document.getElementById('message-input');
var noChatMessage = document.getElementById('no-chat-message'); // Funzione per inizializzare gli utenti nel localStorage

function initializeUsers() {
  try {
    var users = JSON.parse(localStorage.getItem('users'));

    if (!users || !Array.isArray(users)) {
      // Se i dati sono mancanti o corrotti, li reinizializza
      var initialUsers = [{
        username: 'admin',
        password: 'adminpass'
      }, {
        username: 'Utente1',
        password: 'Utente1'
      }, {
        username: 'Utente2',
        password: 'Utente2'
      }, {
        username: 'Pippo',
        password: 'Pippo'
      }, {
        username: 'Pluto',
        password: 'Pluto'
      }];
      localStorage.setItem('users', JSON.stringify(initialUsers));
      return initialUsers;
    }

    return users;
  } catch (e) {
    console.error("Errore nel parsing dei dati utenti. Reinizializzo i dati.");
    localStorage.removeItem('users');
    return initializeUsers();
  }
} // Funzione per salvare tutti i messaggi nel localStorage per una chat specifica


function saveChatMessages(chatId, messages) {
  localStorage.setItem("chat_".concat(chatId), JSON.stringify(messages));
} // Funzione per caricare tutti i messaggi dal localStorage per una chat specifica


function loadChatMessages(chatId) {
  return JSON.parse(localStorage.getItem("chat_".concat(chatId))) || [];
} // Funzione per salvare le chat nel localStorage (lista di chat a sinistra)


function saveChats(chats) {
  localStorage.setItem('chats', JSON.stringify(chats));
} // Funzione per caricare le chat dal localStorage


function loadChatsFromLocalStorage() {
  return JSON.parse(localStorage.getItem('chats')) || [];
} // Funzione per generare un ID chat univoco per una coppia di utenti


function getChatId(user1, user2) {
  // Ordina i nomi utente alfabeticamente per garantire un ID coerente indipendentemente dall'ordine
  var participants = [user1.username, user2.username].sort();
  return participants.join('_');
} // Inizializza l'applicazione dopo che il DOM è stato completamente caricato


document.addEventListener('DOMContentLoaded', function () {
  var users = initializeUsers(); // Imposta l'utente corrente come Utente1 e carica l'interfaccia della chat

  var loggedInUsername = localStorage.getItem('currentUser');

  if (loggedInUsername) {
    currentUser = users.find(function (user) {
      return user.username === loggedInUsername;
    });

    if (currentUser) {
      console.log("Utente selezionato automaticamente:", currentUser.username);
      loadChatsDisplay();
    }
  } else {
    // Se non c'è un utente loggato, reindirizza alla pagina di login
    window.location.href = 'login.html';
  }

  setupEventListeners();
}); // Funzione per impostare gli event listener

function setupEventListeners() {
  // Funzionalità di ricerca utenti
  userSearchInput.addEventListener('input', function (e) {
    var searchTerm = e.target.value.toLowerCase();
    searchResultsContainer.innerHTML = '';
    if (!currentUser) return;

    if (searchTerm.length > 0) {
      var users = initializeUsers();
      var filteredUsers = users.filter(function (user) {
        return user.username.toLowerCase().includes(searchTerm) && user.username !== currentUser.username && user.username !== 'admin';
      });

      if (filteredUsers.length > 0) {
        filteredUsers.forEach(function (user) {
          var resultItem = document.createElement('div');
          resultItem.className = 'p-2 hover:bg-gray-100 cursor-pointer rounded-lg';
          resultItem.textContent = user.username;
          resultItem.addEventListener('click', function () {
            startNewChat(user);
            userSearchInput.value = '';
            searchResultsContainer.classList.add('hidden');
          });
          searchResultsContainer.appendChild(resultItem);
        });
        searchResultsContainer.classList.remove('hidden');
      } else {
        searchResultsContainer.innerHTML = '<div class="p-2 text-gray-500">Nessun utente trovato.</div>';
        searchResultsContainer.classList.remove('hidden');
      }
    } else {
      searchResultsContainer.classList.add('hidden');
    }
  }); // Gestisci l'invio del messaggio

  messageForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var text = messageInput.value.trim();
    if (text.length === 0 || !currentChatId || !currentUser) return;
    var chatMessages = loadChatMessages(currentChatId);
    chatMessages.push({
      sender: currentUser.username,
      text: text,
      timestamp: new Date().toISOString()
    });
    saveChatMessages(currentChatId, chatMessages); // Aggiorna l'ultimo messaggio nella lista delle chat

    var chats = loadChatsFromLocalStorage();
    var chatToUpdate = chats.find(function (c) {
      return c.id === currentChatId;
    });

    if (chatToUpdate) {
      chatToUpdate.lastMessage = text;
      saveChats(chats);
      loadChatsDisplay(); // Ricarica le chat per aggiornare la visualizzazione
    } // Visualizza immediatamente il nuovo messaggio


    renderChatMessages();
    messageInput.value = '';
  }); // Listener per l'evento 'storage' per sincronizzare le schede

  window.addEventListener('storage', function (e) {
    // Controlla se la modifica è avvenuta nella chiave della chat corrente
    if (e.key === "chat_".concat(currentChatId) && currentChatId && currentUser) {
      // Ricarica solo i messaggi della chat attiva
      renderChatMessages();
    } // Ricarica la lista delle chat per aggiornare i messaggi di anteprima


    if (e.key === 'chats' && currentUser) {
      loadChatsDisplay();
    }
  });
} // Funzione per caricare le chat da visualizzare a sinistra


function loadChatsDisplay() {
  if (!currentUser) return;
  var chats = loadChatsFromLocalStorage();
  chatsListContainer.innerHTML = ''; // Filtra solo le chat in cui l'utente corrente è un partecipante

  var userChats = chats.filter(function (chat) {
    return chat.participants.includes(currentUser.username);
  });

  if (userChats.length === 0) {
    chatsListContainer.innerHTML = "\n            <p class=\"text-gray-500 text-center mt-4\">Nessuna chat attiva.</p>\n        ";
  }

  userChats.forEach(function (chat) {
    var recipientUsername = chat.participants.find(function (p) {
      return p !== currentUser.username;
    });

    if (recipientUsername) {
      var chatItem = document.createElement('div');
      chatItem.className = 'chat-item flex items-center p-3 hover:bg-gray-100 cursor-pointer rounded-lg transition duration-200';
      chatItem.innerHTML = "\n                <div class=\"w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold mr-3\">".concat(recipientUsername.charAt(0).toUpperCase(), "</div>\n                <div>\n                    <h4 class=\"font-semibold text-gray-800\">").concat(recipientUsername, "</h4>\n                    <p class=\"text-sm text-gray-500 truncate\">").concat(chat.lastMessage || '', "</p>\n                </div>\n            ");
      chatItem.addEventListener('click', function () {
        return selectChat(chat);
      });
      chatsListContainer.appendChild(chatItem);
    }
  });
} // Funzione per visualizzare i messaggi della chat selezionata


function renderChatMessages() {
  if (!currentChatId) return;
  var chatMessages = loadChatMessages(currentChatId);
  messagesContainer.innerHTML = '';
  noChatMessage.classList.add('hidden'); // Nasconde il messaggio "seleziona una chat"

  chatMessages.forEach(function (message, index) {
    var isCurrentUser = message.sender === currentUser.username;
    var messageAlignment = isCurrentUser ? 'justify-end' : 'justify-start';
    var messageColor = isCurrentUser ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800';
    var messageElement = document.createElement('div');
    messageElement.className = "flex ".concat(messageAlignment, " mb-2");
    messageElement.innerHTML = "\n            <div class=\"message p-3 rounded-lg max-w-sm ".concat(messageColor, " relative group\">\n                <span class=\"block\">").concat(message.text, "</span>\n            </div>\n        ");
    messagesContainer.appendChild(messageElement);
  });
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
} // Funzione per selezionare una chat esistente


function selectChat(chat) {
  currentChatId = chat.id;
  chatRecipientName.textContent = chat.participants.find(function (p) {
    return p !== currentUser.username;
  });
  chatHeader.classList.remove('hidden');
  messageForm.classList.remove('hidden');
  renderChatMessages();
} // Funzione per avviare una nuova chat


function startNewChat(recipientUser) {
  var newChatId = getChatId(currentUser, recipientUser);
  var chats = loadChatsFromLocalStorage(); // Cerca una chat esistente con lo stesso ID

  var existingChat = chats.find(function (c) {
    return c.id === newChatId;
  });

  if (!existingChat) {
    // Se non esiste, crea una nuova chat
    var newChat = {
      id: newChatId,
      participants: [currentUser.username, recipientUser.username],
      lastMessage: null
    };
    chats.unshift(newChat); // Aggiungi all'inizio per la visualizzazione

    saveChats(chats);
    existingChat = newChat;
  } // Seleziona la chat (esistente o nuova)


  selectChat(existingChat);
  loadChatsDisplay(); // Ricarica la lista per mostrare la nuova chat
}