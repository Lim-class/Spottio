// chat/messages/use-chat-actions.js
function useChatActions(getCurrentUid, activeChat, chatStream, draftsSchedule) {
    const isUploadingMedia = Vue.ref(false);
    const openDropdownId = Vue.ref(null);
    const editingMsgId = Vue.ref(null);
    const editMsgText = Vue.ref('');
    const replyingTo = Vue.ref(null);
    const showMsgInfoModal = Vue.ref(false);
    const selectedMsgInfo = Vue.ref(null);
    const mentionResults = Vue.ref([]);
    let currentMentionMatch = null;

    const audio = window.useAudioRecorder();

    const persistChatMessage = async (encryptedPayload, targetChatId, extraData = {}) => {
        const currentUid = getCurrentUid();
        const timestamp = firebase.firestore.FieldValue.serverTimestamp();
        const expiresAt = chatStream.ephemeral.calculateExpirationTimestamp(chatStream.ephemeral.ephemeralDuration.value);

        const messageData = { 
            sender: currentUid, 
            text: encryptedPayload, 
            timestamp,
            readReceipts: {},
            deletedFor: [],
            expiresAt,
            ...extraData
        };
        const previewData = { lastMessage: encryptedPayload, lastSender: currentUid, lastUpdate: timestamp };

        if (activeChat.value.isGroup) {
            messageData.groupId = activeChat.value.id;
            await window.db.collection("groups").doc(activeChat.value.id).collection("chats").add(messageData);
            await window.db.collection("chat_previews").doc(activeChat.value.id).set(previewData, { merge: true });
        } else {
            messageData.receiver = activeChat.value.id;
            messageData.conversationId = targetChatId;
            previewData.participants = [currentUid, activeChat.value.id];
            previewData.isGroup = false;
            await window.db.collection("chats").doc(targetChatId).collection("messages").add(messageData);
            await window.db.collection("chat_previews").doc(targetChatId).set(previewData, { merge: true });
        }
    };

    const sendMessage = async () => {
        const rawText = draftsSchedule.newMessage.value.trim();
        if (!rawText || !activeChat.value.id || isUploadingMedia.value) return;

        const currentUid = getCurrentUid();
        const targetChatId = activeChat.value.isGroup ? activeChat.value.id : window.Spottio.getConversationId(currentUid, activeChat.value.id);
        const encryptedText = window.Spottio.encryptMessage(rawText, targetChatId);

        const extraData = {};
        if (replyingTo.value) {
            extraData.replyTo = {
                id: replyingTo.value.id,
                senderName: replyingTo.value.senderName,
                text: window.Spottio.encryptMessage(replyingTo.value.rawText, targetChatId)
            };
        }

        draftsSchedule.newMessage.value = '';
        draftsSchedule.clearCurrentDraft();
        replyingTo.value = null;
        mentionResults.value = [];

        try {
            await persistChatMessage(encryptedText, targetChatId, extraData);
        } catch (err) {
            console.error("Errore invio messaggio:", err);
        }
    };

    const sendMediaMessage = async (e) => {
        const file = e.target.files[0];
        if (!file || !activeChat.value.id) return;

        isUploadingMedia.value = true;
        const currentUid = getCurrentUid();
        const targetChatId = activeChat.value.isGroup ? activeChat.value.id : window.Spottio.getConversationId(currentUid, activeChat.value.id);

        try {
            const mediaResult = await window.SpottioMediaService.upload(file);
            const fileType = file.type.startsWith('video/') ? 'video' : (file.type.startsWith('audio/') ? 'audio' : 'image');
            const encryptedPayload = window.Spottio.encryptMessage(`${fileType}:${mediaResult.url}`, targetChatId);
            await persistChatMessage(encryptedPayload, targetChatId);
        } catch (err) {
            alert(err.message || "Errore durante l'invio del media.");
        } finally {
            isUploadingMedia.value = false;
            e.target.value = '';
        }
    };

    const handlePlayViewOnceAudio = async (msg) => {
        if (!msg.isViewOnce || msg.isListened) return;
        const docRef = chatStream.getTargetCollection(activeChat.value.id, activeChat.value.isGroup).doc(msg.id);
        try {
            await docRef.update({
                isListened: true,
                deleted: true,
                text: window.Spottio.encryptMessage("[Vocale monouso ascoltato]", activeChat.value.isGroup ? activeChat.value.id : window.Spottio.getConversationId(getCurrentUid(), activeChat.value.id))
            });
        } catch (e) {
            console.error("Errore rimozione vocale monouso:", e);
        }
    };

    const togglePinMessage = async (msg) => {
        if (!activeChat.value.isGroup) return;
        const groupRef = window.db.collection("groups").doc(activeChat.value.id);
        try {
            if (chatStream.pinnedMessage.value && chatStream.pinnedMessage.value.id === msg.id) {
                await groupRef.update({ pinnedMessage: firebase.firestore.FieldValue.delete() });
            } else {
                await groupRef.update({
                    pinnedMessage: {
                        id: msg.id,
                        senderName: msg.senderName,
                        textSnippet: msg.rawText.substring(0, 70),
                        pinnedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }
                });
            }
            openDropdownId.value = null;
        } catch (err) {
            alert("Solo gli amministratori possono fissare messaggi.");
        }
    };

    const deleteMessageForMe = async (id) => {
        try {
            const currentUid = getCurrentUid();
            const docRef = chatStream.getTargetCollection(activeChat.value.id, activeChat.value.isGroup).doc(id);
            await docRef.update({
                deletedFor: firebase.firestore.FieldValue.arrayUnion(currentUid)
            });
            chatStream.messages.value = chatStream.messages.value.filter(m => m.id !== id);
            openDropdownId.value = null;
        } catch (e) {
            alert("Errore eliminazione.");
        }
    };

    const deleteMessageForEveryone = async (id) => {
        if (!confirm("Eliminare questo messaggio per tutti?")) return;
        try {
            const currentUid = getCurrentUid();
            const targetChatId = activeChat.value.isGroup ? activeChat.value.id : window.Spottio.getConversationId(currentUid, activeChat.value.id);
            const encryptedText = window.Spottio.encryptMessage("Questo messaggio è stato eliminato", targetChatId);
            const docRef = chatStream.getTargetCollection(activeChat.value.id, activeChat.value.isGroup).doc(id);
            await docRef.update({ text: encryptedText, deleted: true });
            openDropdownId.value = null;
        } catch (e) {
            alert("Errore eliminazione.");
        }
    };

    const toggleReaction = async (msg, emoji) => {
        const currentUid = getCurrentUid();
        const docRef = chatStream.getTargetCollection(activeChat.value.id, activeChat.value.isGroup).doc(msg.id);
        const currentReactions = msg.reactions || {};
        const userList = currentReactions[emoji] || [];

        const hasReacted = userList.includes(currentUid);
        const updatedList = hasReacted ? userList.filter(u => u !== currentUid) : [...userList, currentUid];

        try {
            if (updatedList.length > 0) {
                await docRef.update({ [`reactions.${emoji}`]: updatedList });
            } else {
                await docRef.update({ [`reactions.${emoji}`]: firebase.firestore.FieldValue.delete() });
            }
        } catch (e) {}
    };

    const startAudioRecording = () => {
        audio.startAudioRecording(async (audioUrl, isViewOnce) => {
            const currentUid = getCurrentUid();
            const targetChatId = activeChat.value.isGroup 
                ? activeChat.value.id 
                : window.Spottio.getConversationId(currentUid, activeChat.value.id);
            
            const prefix = isViewOnce ? 'audio_once:' : 'audio:';
            const encryptedPayload = window.Spottio.encryptMessage(`${prefix}${audioUrl}`, targetChatId);
            await persistChatMessage(encryptedPayload, targetChatId, { isViewOnce: !!isViewOnce, isListened: false });
        });
    };

    const handleMentionInput = async (e) => {
        draftsSchedule.saveCurrentDraft();
        if (!activeChat.value.isGroup) return;
        const text = e.target.value;
        const match = text.slice(0, e.target.selectionStart).match(/@(\w*)$/);
        if (match) {
            currentMentionMatch = match;
            try {
                const groupDoc = await window.db.collection("groups").doc(activeChat.value.id).get();
                if (groupDoc.exists) {
                    const membersUids = groupDoc.data().members || [];
                    await window.resolveUids(membersUids);
                    mentionResults.value = membersUids.map(uid => window.userCache[uid]).filter(m => m && m.username.toLowerCase().includes(match[1].toLowerCase()));
                }
            } catch(e) {}
        } else { mentionResults.value = []; }
    };

    const insertMention = (username) => {
        if (!currentMentionMatch) return;
        const val = draftsSchedule.newMessage.value;
        draftsSchedule.newMessage.value = val.substring(0, currentMentionMatch.index) + `@${username} ` + val.substring(document.getElementById('chat-message-input')?.selectionStart || 0);
        mentionResults.value = [];
        draftsSchedule.saveCurrentDraft();
    };

    return {
        isUploadingMedia,
        openDropdownId,
        editingMsgId,
        editMsgText,
        replyingTo,
        showMsgInfoModal,
        selectedMsgInfo,
        mentionResults,
        audio,
        persistChatMessage,
        sendMessage,
        sendMediaMessage,
        handlePlayViewOnceAudio,
        togglePinMessage,
        deleteMessageForMe,
        deleteMessageForEveryone,
        toggleReaction,
        startAudioRecording,
        handleMentionInput,
        insertMention
    };
}