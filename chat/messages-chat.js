// ==========================================
// FILE: messages-chat.js
// Core Database Queries & Listeners
// ==========================================

function listenToMyChats() {
    if (previewsUnsubscribe) previewsUnsubscribe();

    previewsUnsubscribe = db.collection("chat_previews")
        .where("participants", "array-contains", currentUid)
        .orderBy("lastUpdate", "desc")
        .onSnapshot(async snapshot => {
            
            const uidsToResolve = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if (!data.isGroup) {
                    const otherUid = data.participants.find(p => p !== currentUid) || currentUid;
                    uidsToResolve.push(otherUid);
                }
                if (data.lastSender && data.lastSender !== "Sistema") {
                    uidsToResolve.push(data.lastSender);
                }
            });
            await window.resolveUids(uidsToResolve);

            chatsListContainer.innerHTML = '';
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const isGroup = data.isGroup || false;
                
                let otherParticipantUid = null;
                let displayName = "Utente Sconosciuto";
                let avatarUrl = "";
                let isVerified = false;

                if (isGroup) {
                    displayName = data.groupName || "Gruppo senza nome";
                } else {
                    otherParticipantUid = data.participants.find(p => p !== currentUid) || currentUid;
                    if (window.userCache[otherParticipantUid]) {
                        const cachedUser = window.userCache[otherParticipantUid];
                        displayName = cachedUser.username || displayName;
                        avatarUrl = cachedUser.userPfUri || cachedUser.profileImageUrl || "";
                        isVerified = cachedUser.isVerified === true;
                    }
                }

                const chatId = isGroup ? doc.id : otherParticipantUid;
                
                let msgPreview = data.lastMessage || 'Nessun messaggio';
                if (data.lastSender && data.lastSender !== currentUid && isGroup && data.lastSender !== "Sistema") {
                    const senderName = window.userCache[data.lastSender] ? window.userCache[data.lastSender].username : "Utente";
                    msgPreview = `${senderName}: ${msgPreview}`;
                }

                // MODIFICA: Ora passiamo anche avatarUrl e isVerified al costruttore grafico della sidebar
                renderChatListItem(chatId, displayName, msgPreview, activeChat.id === chatId, isGroup, avatarUrl, isVerified);
            });
        }, error => {
            console.error("Errore lettura anteprime:", error);
        });
}

function startNewChat(chatId, displayName, isGroup) {
    activeChat = { id: chatId, isGroup: isGroup, name: displayName };
    
    const domChatList = document.getElementById('chat-list-container');
    const domChatContent = document.getElementById('chat-content-container');
    
    if (window.innerWidth < 1024) {
        if(domChatList) domChatList.classList.add('hidden-mobile');
        if(domChatContent) domChatContent.classList.remove('hidden-mobile');
    }

    // MODIFICA: Rendering dinamico dell'intestazione (Header superiore) con Foto e Verifica
    let headerAvatarHtml = displayName.charAt(0).toUpperCase();
    let isChatVerified = false;

    if (!isGroup && window.userCache[chatId]) {
        const userData = window.userCache[chatId];
        isChatVerified = userData.isVerified === true;
        if (userData.userPfUri && userData.userPfUri.trim() !== "") {
            headerAvatarHtml = `<img src="${userData.userPfUri}" class="w-full h-full rounded-full object-cover border border-gray-100">`;
        }
    }

    const verifiedBadgeHtml = isChatVerified ? `
        <svg class="w-5 h-5 text-blue-500 ml-1 inline-block align-middle" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" title="Profilo Verificato">
            <path fill-rule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497a4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 11.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
        </svg>
    ` : '';

    if (isGroup) {
        recipientAvatar.innerHTML = displayName.charAt(0).toUpperCase();
        recipientAvatar.className = `w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4 bg-green-500 shadow-sm`;
        chatRecipientName.innerHTML = displayName;
    } else {
        recipientAvatar.innerHTML = headerAvatarHtml;
        recipientAvatar.className = `w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4 bg-blue-500 overflow-hidden shadow-sm border border-gray-100`;
        chatRecipientName.innerHTML = `<span class="align-middle">${displayName}</span>${verifiedBadgeHtml}`;
    }
    
    const headerInfo = document.getElementById('chat-header-info');
    
    if (isGroup) {
        chatSubtitle.textContent = "Clicca per info gruppo";
        chatSubtitle.classList.remove('hidden');
        headerInfo.classList.add('cursor-pointer', 'hover:bg-gray-100');
        headerInfo.onclick = () => typeof openGroupInfo === 'function' && openGroupInfo(chatId);
    } else {
        chatSubtitle.classList.add('hidden');
        headerInfo.classList.remove('cursor-pointer', 'hover:bg-gray-100');
        headerInfo.onclick = null;
    }

    chatHeader.classList.remove('hidden');
    messageForm.classList.remove('hidden');
    noChatMessage.classList.add('hidden');
    
    listenToMessages();
}

function listenToMessages() {
    if (chatUnsubscribe) chatUnsubscribe();
    messagesContainer.innerHTML = '';

    let query;

    if (activeChat.isGroup) {
        query = db.collection("groups").doc(activeChat.id).collection("chats");
    } else {
        const conversationId = window.Spottio.getConversationId(currentUid, activeChat.id);
        query = db.collection("chats").doc(conversationId).collection("messages");
    }

    chatUnsubscribe = query.orderBy("timestamp", "asc")
        .onSnapshot(async snapshot => {
            
            // Scarichiamo in blocco i profili di tutti i mittenti della conversazione (fondamentale nei gruppi)
            const sendersToResolve = [];
            snapshot.forEach(doc => sendersToResolve.push(doc.data().sender));
            await window.resolveUids(sendersToResolve);

            messagesContainer.innerHTML = '';
            let lastDateLabel = ""; 

            snapshot.forEach(doc => {
                const data = doc.data();
                if (!data.timestamp) return;

                const date = data.timestamp.toDate();
                const currentDateLabel = formatDateLabel(date); 

                if (currentDateLabel !== lastDateLabel) {
                    renderDateSeparator(currentDateLabel);
                    lastDateLabel = currentDateLabel;
                }

                const isMe = data.sender === currentUid;
                const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                // MODIFICA: Recupero dati multimediali e verifica del mittente per stamparli di fianco alla nuvoletta
                let senderAvatar = "";
                let isSenderVerified = false;

                if (window.userCache[data.sender]) {
                    senderAvatar = window.userCache[data.sender].userPfUri || "";
                    isSenderVerified = window.userCache[data.sender].isVerified === true;
                }

                let senderDisplayName = "Sistema";
                if (data.sender !== "Sistema") {
                    if (isMe) senderDisplayName = currentUsername;
                    else if (activeChat.isGroup && window.userCache[data.sender]) senderDisplayName = window.userCache[data.sender].username;
                    else senderDisplayName = activeChat.name; 
                }

                const isDeleted = data.deleted || false;
                const isEdited = data.edited || false;

                // Passiamo l'avatar e lo stato di verifica finale al renderer dei messaggi
                renderSingleMessage(doc.id, data.text, senderDisplayName, isMe, timeStr, activeChat.isGroup, isDeleted, isEdited, senderAvatar, isSenderVerified);
            });

            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, error => {
            console.error("Errore lettura messaggi:", error);
        });
}

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