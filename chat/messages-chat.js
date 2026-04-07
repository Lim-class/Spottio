// ==========================================
// FILE: messages-chat.js
// Core Database Queries & Listeners
// ==========================================

/**
 * Ascolta tutte le chat (singole o di gruppo) a cui l'utente partecipa
 * controllando l'array "participants" nella collection chat_previews
 */
function listenToMyChats() {
    if (previewsUnsubscribe) previewsUnsubscribe();

    previewsUnsubscribe = db.collection("chat_previews")
        .where("participants", "array-contains", currentUser.username)
        .orderBy("lastUpdate", "desc")
        .onSnapshot(snapshot => {
            chatsListContainer.innerHTML = '';
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const isGroup = data.isGroup || false;
                
                // Ricerca case-insensitive dell'altro partecipante
                let otherParticipant = "Utente Sconosciuto";
                if (data.participants && Array.isArray(data.participants)) {
                    // Cerca chi NON è l'utente corrente (ignorando maiuscole/minuscole)
                    const found = data.participants.find(p => 
                        p.toLowerCase() !== currentUser.username.toLowerCase()
                    );
                    
                    // Fallback se per caso sei l'unico partecipante
                    otherParticipant = found || currentUser.username; 
                }

                // ID e Nome da mostrare
                const chatId = isGroup ? doc.id : otherParticipant;
                const displayName = isGroup ? (data.groupName || "Gruppo senza nome") : otherParticipant;
                
                let msgPreview = data.lastMessage || 'Nessun messaggio';
                if (data.lastSender && data.lastSender !== currentUser.username && isGroup) {
                    msgPreview = `${data.lastSender}: ${msgPreview}`;
                }

                renderChatListItem(chatId, displayName, msgPreview, activeChat.id === chatId, isGroup);
            });
        }, error => {
            console.error("Errore lettura anteprime:", error);
        });
}

/**
 * Prepara l'interfaccia e avvia l'ascolto dei messaggi per la chat selezionata
 */
function startNewChat(chatId, displayName, isGroup) {
    activeChat = { id: chatId, isGroup: isGroup, name: displayName };
    
    // --- LOGICA MOBILE FIRST ---
    const domChatList = document.getElementById('chat-list-container');
    const domChatContent = document.getElementById('chat-content-container');
    
    // Se lo schermo è stretto (tablet verticale o smartphone), nascondi la lista e mostra la chat
    if (window.innerWidth < 1024) {
        if(domChatList) domChatList.classList.add('hidden-mobile');
        if(domChatContent) domChatContent.classList.remove('hidden-mobile');
    }
    // ---------------------------

    // Update Header UI
    chatRecipientName.textContent = displayName;
    recipientAvatar.className = `w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4 ${isGroup ? 'bg-green-500' : 'bg-blue-500'}`;
    recipientAvatar.textContent = displayName.charAt(0).toUpperCase();
    
    if (isGroup) {
        chatSubtitle.textContent = "Gruppo";
        chatSubtitle.classList.remove('hidden');
    } else {
        chatSubtitle.classList.add('hidden');
    }

    chatHeader.classList.remove('hidden');
    messageForm.classList.remove('hidden');
    noChatMessage.classList.add('hidden');
    
    listenToMessages();
}

/**
 * Ascolta i messaggi della chat attiva e inserisce i divisori temporali
 */
function listenToMessages() {
    if (chatUnsubscribe) chatUnsubscribe();
    messagesContainer.innerHTML = '';

    let query = db.collection("chats");

    if (activeChat.isGroup) {
        query = query.where("groupId", "==", activeChat.id);
    } else {
        const conversationId = [currentUser.username, activeChat.id].sort().join('_');
        query = query.where("conversationId", "==", conversationId);
    }

    chatUnsubscribe = query.orderBy("timestamp", "asc")
        .onSnapshot(snapshot => {
            messagesContainer.innerHTML = '';
            let lastDateLabel = ""; // Per memorizzare l'ultimo giorno inserito

            snapshot.forEach(doc => {
                const data = doc.data();
                if (!data.timestamp) return;

                const date = data.timestamp.toDate();
                const currentDateLabel = formatDateLabel(date); // Funzione che crea la stringa "Oggi", "Ieri", ecc.

                // Se il giorno è cambiato, aggiungiamo la barra separatrice
                if (currentDateLabel !== lastDateLabel) {
                    renderDateSeparator(currentDateLabel);
                    lastDateLabel = currentDateLabel;
                }

                const isMe = data.sender === currentUser.username;
                const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                renderSingleMessage(data.text, data.sender, isMe, timeStr, activeChat.isGroup);
            });

            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, error => {
            console.error("Errore lettura messaggi:", error);
        });
}

/**
 * Funzione di utilità per formattare la data del divisore
 */
function formatDateLabel(date) {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return "Oggi";
    } else if (date.toDateString() === yesterday.toDateString()) {
        return "Ieri";
    } else {
        return date.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
    }
}