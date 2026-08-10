// ==========================================
// FILE: messages-active.js
// Gestione Chat Attiva, Apertura e Cronologia Messaggi
// ==========================================

function startNewChat(chatId, displayName, isGroup, avatarUrl = "", isVerified = false) {
    activeChat = { id: chatId, isGroup: isGroup, name: displayName };
    
    const domChatList = document.getElementById('chat-list-container');
    const domChatContent = document.getElementById('chat-content-container');
    
    if (window.innerWidth < 1024) {
        if(domChatList) domChatList.classList.add('hidden-mobile');
        if(domChatContent) domChatContent.classList.remove('hidden-mobile');
    }

    let headerAvatarHtml = displayName.charAt(0).toUpperCase();
    let isChatVerified = isVerified;
    let finalAvatarUrl = avatarUrl;

    if (!isGroup && window.userCache[chatId]) {
        const userData = window.userCache[chatId];
        isChatVerified = isVerified || userData.isVerified === true;
        finalAvatarUrl = finalAvatarUrl || userData.userPfUri || userData.profileImageUrl || "";
    }

    if (!isGroup && finalAvatarUrl && finalAvatarUrl.trim() !== "") {
        headerAvatarHtml = `<img src="${finalAvatarUrl}" class="w-full h-full rounded-full object-cover border border-gray-100">`;
    }

    const verifiedBadgeHtml = isChatVerified ? `
        <svg class="w-5 h-5 text-blue-500 ml-1 inline-block align-middle" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" title="Profilo Verificato">
            <path fill-rule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307a4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.397a4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549a4.49 4.49 0 01-3.498-1.306a4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497a4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 11.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
        </svg>
    ` : '';

    if (isGroup) {
        if (finalAvatarUrl && finalAvatarUrl.trim() !== "") {
            recipientAvatar.innerHTML = `<img src="${finalAvatarUrl}" class="w-full h-full object-cover">`;
        } else {
            recipientAvatar.innerHTML = displayName.charAt(0).toUpperCase();
        }
        
        recipientAvatar.className = `w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4 bg-green-500 shadow-sm overflow-hidden border border-gray-100`;
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
    let targetChatId = activeChat.id;

    if (activeChat.isGroup) {
        query = db.collection("groups").doc(activeChat.id).collection("chats");
    } else {
        targetChatId = (window.Spottio && window.Spottio.getConversationId) 
            ? window.Spottio.getConversationId(currentUid, activeChat.id) 
            : [currentUid, activeChat.id].sort().join('_');

        query = db.collection("chats").doc(targetChatId).collection("messages");
    }

    chatUnsubscribe = query.orderBy("timestamp", "asc")
        .onSnapshot(async snapshot => {
            
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

                // 🔓 DECIFRAZIONE DEL MESSAGGIO
                const decryptedText = (window.Spottio && window.Spottio.decryptMessage) 
                    ? window.Spottio.decryptMessage(data.text, targetChatId) 
                    : data.text;

                renderSingleMessage(doc.id, decryptedText, senderDisplayName, isMe, timeStr, activeChat.isGroup, isDeleted, isEdited, senderAvatar, isSenderVerified);
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