// ==========================================
// FILE: messages-send.js
// Logica di Invio Messaggi e Navigazione Mobile
// ==========================================

function setupSendListeners() {
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

    if (messageForm) {
        messageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = messageInput.value.trim();
            if (!text || !activeChat.id) return;

            // ✨ USO DELL'UID COME MITTENTE
            const messageData = {
                sender: currentUid, 
                text: text,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            let previewId = '';
            
            if (activeChat.isGroup) {
                messageData.groupId = activeChat.id;
                previewId = activeChat.id;
            } else {
                messageData.receiver = activeChat.id;
                messageData.conversationId = window.Spottio.getConversationId(currentUid, activeChat.id);
                previewId = messageData.conversationId;
            }

            try {
                messageInput.value = '';
                
                if (activeChat.isGroup) {
                    await db.collection("groups").doc(activeChat.id).collection("chats").add(messageData);
                } else {
                    await db.collection("chats").doc(messageData.conversationId).collection("messages").add(messageData);
                }
                
                const previewData = {
                    lastMessage: text,
                    lastSender: currentUid, // ✨ Anteprima salvata col tuo UID
                    lastUpdate: firebase.firestore.FieldValue.serverTimestamp(),
                };

                if (!activeChat.isGroup) {
                    previewData.participants = [currentUid, activeChat.id];
                    previewData.isGroup = false;
                }

                await db.collection("chat_previews").doc(previewId).set(previewData, { merge: true });

            } catch (err) {
                console.error("Errore invio messaggio:", err);
            }
        });
    }
}