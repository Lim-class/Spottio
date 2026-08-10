// ==========================================
// FILE: messages-previews.js
// Gestione Anteprime Sidebar e Lista Chat
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
                    avatarUrl = data.groupAvatarUrl || "";
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
                
                // 🔓 DECIFRAZIONE DELL'ANTEPRIMA
                let rawPreview = data.lastMessage || 'Nessun messaggio';
                let previewTargetId = isGroup 
                    ? doc.id 
                    : (window.Spottio && window.Spottio.getConversationId ? window.Spottio.getConversationId(currentUid, otherParticipantUid) : [currentUid, otherParticipantUid].sort().join('_'));

                let msgPreview = (window.Spottio && window.Spottio.decryptMessage) 
                    ? window.Spottio.decryptMessage(rawPreview, previewTargetId) 
                    : rawPreview;

                // ✨ Traduzione dell'anteprima se è un file multimediale
                if (msgPreview.startsWith('image:')) {
                    msgPreview = "📷 Immagine";
                } else if (msgPreview.startsWith('video:')) {
                    msgPreview = "🎥 Video";
                } else if (msgPreview.startsWith('audio:')) {
                    msgPreview = "🎤 Audio";
                }

                if (data.lastSender && data.lastSender !== currentUid && isGroup && data.lastSender !== "Sistema") {
                    const senderName = window.userCache[data.lastSender] ? window.userCache[data.lastSender].username : "Utente";
                    msgPreview = `${senderName}: ${msgPreview}`;
                }

                renderChatListItem(chatId, displayName, msgPreview, activeChat.id === chatId, isGroup, avatarUrl, isVerified);
            });
        }, error => {
            console.error("Errore lettura anteprime:", error);
        });
}