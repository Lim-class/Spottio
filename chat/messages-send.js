// ==========================================
// FILE: messages-send.js
// Logica di Invio Messaggi e Navigazione Mobile
// ==========================================

function setupSendListeners() {
    
    // 0. Gestione tasto indietro su Mobile
    if (btnBackToList) {
        btnBackToList.addEventListener('click', () => {
            containerChatList.classList.remove('hidden-mobile');
            containerChatContent.classList.add('hidden-mobile');
            
            chatHeader.classList.add('hidden');
            messageForm.classList.add('hidden');
            noChatMessage.classList.remove('hidden');
            messagesContainer.innerHTML = '';
            activeChat = { id: null, isGroup: false, name: '', members: [] };
        });
    }

    // 1. Invio del messaggio (Gestisce sia DM che Gruppi)
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
                
                // --- NUOVA LOGICA DI SALVATAGGIO ---
                if (activeChat.isGroup) {
                    await db.collection("groups").doc(activeChat.id).collection("chats").add(messageData);
                } else {
                    // NUOVO RIFERIMENTO: usiamo conversationId come ID del documento e "messages" come subcollection
                    await db.collection("chats").doc(messageData.conversationId).collection("messages").add(messageData);
                }
                
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
}