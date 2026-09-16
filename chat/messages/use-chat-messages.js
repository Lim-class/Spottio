// chat/messages/use-chat-messages.js
function useChatMessages(getCurrentUid, getCurrentUsername, activeChat, formatMessageContent, formatDateLabel) {
    const messages = Vue.ref([]);
    const newMessage = Vue.ref('');
    const messagesContainer = Vue.ref(null);
    const messageInputRef = Vue.ref(null);

    const openDropdownId = Vue.ref(null);
    const editingMsgId = Vue.ref(null);
    const editMsgText = Vue.ref('');
    const isUploadingMedia = Vue.ref(false);

    const mentionResults = Vue.ref([]);
    let currentMentionMatch = null;
    let chatUnsubscribe = null;
    let chatSettingsUnsubscribe = null;

    const PAGE_SIZE = 5;
    let oldestDocSnapshot = null;
    const hasMoreMessages = Vue.ref(true);
    const isLoadingMore = Vue.ref(false);

    const replyingTo = Vue.ref(null);
    const showMsgInfoModal = Vue.ref(false);
    const selectedMsgInfo = Vue.ref(null);

    const ephemeral = window.useEphemeralTimer();
    const audio = window.useAudioRecorder();

    const {
        ephemeralDuration,
        showCustomEphemeralModal,
        customEphemeralValue,
        customEphemeralUnit,
        getEphemeralLabel
    } = ephemeral;

    const {
        isRecordingAudio,
        audioRecordingSeconds,
        isUploadingAudio
    } = audio;

    const getChatDocRef = () => {
        if (!activeChat.value.id) return null;
        const currentUid = getCurrentUid();
        return activeChat.value.isGroup 
            ? window.db.collection("groups").doc(activeChat.value.id)
            : window.db.collection("chats").doc(window.Spottio.getConversationId(currentUid, activeChat.value.id));
    };

    const openCustomEphemeralModal = ephemeral.openCustomEphemeralModal;
    const closeCustomEphemeralModal = ephemeral.closeCustomEphemeralModal;

    const confirmCustomEphemeral = () => {
        ephemeral.confirmCustomEphemeral(async (totalSeconds) => {
            const docRef = getChatDocRef();
            if (docRef) {
                try {
                    await docRef.set({ ephemeralDuration: totalSeconds }, { merge: true });
                } catch (err) {
                    console.error("Errore salvataggio timer personalizzato:", err);
                }
            }
        });
    };

    const updateEphemeralDuration = async (e) => {
        const duration = Number(e.target.value);
        ephemeral.ephemeralDuration.value = duration;

        const docRef = getChatDocRef();
        if (docRef) {
            try {
                await docRef.set({ ephemeralDuration: duration }, { merge: true });
            } catch (err) {
                console.error("Errore salvataggio modalità effimera:", err);
            }
        }
    };

    const onEphemeralSelectChange = (e) => {
        if (e.target.value === 'custom') {
            openCustomEphemeralModal();
        } else {
            updateEphemeralDuration(e);
        }
    };

    const getTargetCollection = (targetId, isGroup) => {
        if (isGroup) {
            return window.db.collection("groups").doc(targetId).collection("chats");
        }
        const currentUid = getCurrentUid();
        const convId = window.Spottio.getConversationId(currentUid, targetId);
        return window.db.collection("chats").doc(convId).collection("messages");
    };

    const listenChatSettings = (targetId, isGroup) => {
        if (chatSettingsUnsubscribe) chatSettingsUnsubscribe();

        const docRef = getChatDocRef();
        if (!docRef) return;

        chatSettingsUnsubscribe = docRef.onSnapshot(doc => {
            if (doc.exists && doc.data().ephemeralDuration !== undefined) {
                ephemeral.ephemeralDuration.value = Number(doc.data().ephemeralDuration);
            } else {
                ephemeral.ephemeralDuration.value = 0;
            }
        });
    };

    const processDocSnapshot = (doc, targetChatId, isGroup, currentUid, currentUsername) => {
        const data = doc.data();
        if (!data.timestamp) return null;

        const deletedFor = data.deletedFor || [];
        if (deletedFor.includes(currentUid)) return null;

        if (data.expiresAt) {
            const expireDate = data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
            if (new Date() > expireDate) {
                doc.ref.delete().catch(() => {});
                return null;
            }
        }

        const date = data.timestamp.toDate ? data.timestamp.toDate() : new Date();
        const isMe = data.sender === currentUid;
        let senderName = "Sistema";
        if (data.sender !== "Sistema") {
            if (isMe) senderName = currentUsername;
            else if (isGroup && window.userCache[data.sender]) senderName = window.userCache[data.sender].username;
            else senderName = activeChat.value.displayName;
        }

        const decryptedText = window.Spottio.decryptMessage(data.text, targetChatId);

        let replyPreview = null;
        if (data.replyTo) {
            replyPreview = {
                id: data.replyTo.id,
                senderName: data.replyTo.senderName,
                text: window.Spottio.decryptMessage(data.replyTo.text, targetChatId)
            };
        }

        const readReceipts = data.readReceipts || {};
        const readUids = Object.keys(readReceipts);
        const isDelivered = readUids.length > 0;
        let isRead = false;
        let readDetails = [];

        if (isGroup) {
            const memberCount = (activeChat.value.participants || []).length || 2;
            isRead = readUids.length >= (memberCount - 1);
            readDetails = readUids.map(uid => ({
                uid,
                username: window.userCache[uid]?.username || uid,
                time: readReceipts[uid]?.toDate ? readReceipts[uid].toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recente"
            }));
        } else {
            isRead = !!readReceipts[activeChat.value.id];
            if (isRead && readReceipts[activeChat.value.id]) {
                const readDate = readReceipts[activeChat.value.id].toDate ? readReceipts[activeChat.value.id].toDate() : new Date();
                readDetails.push({
                    uid: activeChat.value.id,
                    username: activeChat.value.displayName,
                    time: `${readDate.toLocaleDateString([], { day: '2-digit', month: '2-digit' })} alle ${readDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                });
            }
        }

        return {
            id: doc.id,
            docRef: doc.ref,
            rawText: decryptedText,
            contentHtml: formatMessageContent(decryptedText, data.deleted, isGroup, isMe),
            senderId: data.sender,
            senderName,
            isMe,
            isDeleted: data.deleted || false,
            isEdited: data.edited || false,
            timestamp: date,
            timeStr: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            fullDateStr: date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            senderAvatar: window.userCache[data.sender] ? window.userCache[data.sender].userPfUri : "",
            isSenderVerified: window.userCache[data.sender] ? window.userCache[data.sender].isVerified : false,
            reactions: data.reactions || {},
            replyTo: replyPreview,
            readReceipts,
            readDetails,
            isRead,
            isDelivered,
            isEphemeral: !!data.expiresAt
        };
    };

    const markMessagesAsRead = async (unreadList) => {
        if (!unreadList || unreadList.length === 0) return;
        const currentUid = getCurrentUid();
        const batch = window.db.batch();
        let needsCommit = false;

        unreadList.forEach(m => {
            if (!m.isMe && (!m.readReceipts || !m.readReceipts[currentUid])) {
                const docRef = getTargetCollection(activeChat.value.id, activeChat.value.isGroup).doc(m.id);
                batch.update(docRef, {
                    [`readReceipts.${currentUid}`]: firebase.firestore.FieldValue.serverTimestamp()
                });
                needsCommit = true;
            }
        });

        if (needsCommit) {
            try { 
                await batch.commit(); 
            } catch (e) { 
                console.error("Errore salvataggio ricevute di lettura:", e); 
            }
        }
    };

    const startMessagesStream = (targetId, isGroup) => {
        if (chatUnsubscribe) chatUnsubscribe();
        messages.value = [];
        oldestDocSnapshot = null;
        hasMoreMessages.value = true;
        replyingTo.value = null;

        listenChatSettings(targetId, isGroup);

        const currentUid = getCurrentUid();
        const currentUsername = getCurrentUsername();
        const targetChatId = isGroup ? targetId : window.Spottio.getConversationId(currentUid, targetId);
        const colRef = getTargetCollection(targetId, isGroup);

        chatUnsubscribe = colRef.orderBy("timestamp", "desc").limit(PAGE_SIZE).onSnapshot(async snapshot => {
            if (snapshot.empty) {
                messages.value = [];
                hasMoreMessages.value = false;
                return;
            }

            const sendersToResolve = [];
            snapshot.forEach(doc => {
                const d = doc.data();
                sendersToResolve.push(d.sender);
                if (d.readReceipts) {
                    sendersToResolve.push(...Object.keys(d.readReceipts));
                }
            });
            await window.resolveUids(sendersToResolve);

            const fetched = [];
            snapshot.forEach(doc => {
                const parsed = processDocSnapshot(doc, targetChatId, isGroup, currentUid, currentUsername);
                if (parsed) fetched.push(parsed);
            });

            oldestDocSnapshot = snapshot.docs[snapshot.docs.length - 1];
            if (snapshot.docs.length < PAGE_SIZE) hasMoreMessages.value = false;

            fetched.reverse();

            let lastDateLabel = "";
            fetched.forEach(m => {
                const dateLabel = formatDateLabel(m.timestamp);
                m.showDateSeparator = (dateLabel !== lastDateLabel);
                m.dateLabel = dateLabel;
                lastDateLabel = dateLabel;
            });

            const isAtBottom = messagesContainer.value 
                ? (messagesContainer.value.scrollHeight - messagesContainer.value.scrollTop <= messagesContainer.value.clientHeight + 120)
                : true;

            messages.value = fetched;
            markMessagesAsRead(fetched);

            Vue.nextTick(() => { 
                if (isAtBottom && messagesContainer.value) {
                    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight; 
                }
            });
        });
    };

    const loadOlderMessages = async () => {
        if (!hasMoreMessages.value || isLoadingMore.value || !oldestDocSnapshot) return;
        isLoadingMore.value = true;

        const currentUid = getCurrentUid();
        const currentUsername = getCurrentUsername();
        const targetChatId = activeChat.value.isGroup ? activeChat.value.id : window.Spottio.getConversationId(currentUid, activeChat.value.id);
        const colRef = getTargetCollection(activeChat.value.id, activeChat.value.isGroup);

        try {
            const snap = await colRef.orderBy("timestamp", "desc")
                .startAfter(oldestDocSnapshot)
                .limit(PAGE_SIZE)
                .get();

            if (snap.empty) {
                hasMoreMessages.value = false;
                isLoadingMore.value = false;
                return;
            }

            if (snap.docs.length < PAGE_SIZE) hasMoreMessages.value = false;
            oldestDocSnapshot = snap.docs[snap.docs.length - 1];

            const sendersToResolve = [];
            snap.forEach(doc => sendersToResolve.push(doc.data().sender));
            await window.resolveUids(sendersToResolve);

            const olderMessages = [];
            snap.forEach(doc => {
                const parsed = processDocSnapshot(doc, targetChatId, activeChat.value.isGroup, currentUid, currentUsername);
                if (parsed) olderMessages.push(parsed);
            });
            olderMessages.reverse();

            const combined = [...olderMessages, ...messages.value];
            let lastDateLabel = "";
            combined.forEach(m => {
                const dateLabel = formatDateLabel(m.timestamp);
                m.showDateSeparator = (dateLabel !== lastDateLabel);
                m.dateLabel = dateLabel;
                lastDateLabel = dateLabel;
            });

            const container = messagesContainer.value;
            const previousScrollHeight = container ? container.scrollHeight : 0;

            messages.value = combined;
            markMessagesAsRead(olderMessages);

            Vue.nextTick(() => {
                if (container) container.scrollTop = container.scrollHeight - previousScrollHeight;
            });
        } catch (e) {
            console.error("Errore caricamento precedenti:", e);
        } finally {
            isLoadingMore.value = false;
        }
    };

    const handleMessagesScroll = (e) => {
        if (e.target.scrollTop === 0 && hasMoreMessages.value && !isLoadingMore.value) {
            loadOlderMessages();
        }
    };

    const stopMessagesStream = () => {
        if (chatUnsubscribe) {
            chatUnsubscribe();
            chatUnsubscribe = null;
        }
        if (chatSettingsUnsubscribe) {
            chatSettingsUnsubscribe();
            chatSettingsUnsubscribe = null;
        }
        messages.value = [];
        oldestDocSnapshot = null;
        replyingTo.value = null;
    };

    const persistChatMessage = async (encryptedPayload, targetChatId, extraData = {}) => {
        const currentUid = getCurrentUid();
        const timestamp = firebase.firestore.FieldValue.serverTimestamp();
        const expiresAt = ephemeral.calculateExpirationTimestamp(ephemeral.ephemeralDuration.value);

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
        const rawText = newMessage.value.trim();
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

        newMessage.value = '';
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

    const deleteMessageForMe = async (id) => {
        try {
            const currentUid = getCurrentUid();
            const docRef = getTargetCollection(activeChat.value.id, activeChat.value.isGroup).doc(id);
            await docRef.update({
                deletedFor: firebase.firestore.FieldValue.arrayUnion(currentUid)
            });
            messages.value = messages.value.filter(m => m.id !== id);
            openDropdownId.value = null;
        } catch (e) {
            alert("Errore durante l'eliminazione.");
        }
    };

    const deleteMessageForEveryone = async (id) => {
        if (!confirm("Eliminare questo messaggio per tutti?")) return;
        try {
            const currentUid = getCurrentUid();
            const targetChatId = activeChat.value.isGroup ? activeChat.value.id : window.Spottio.getConversationId(currentUid, activeChat.value.id);
            const encryptedText = window.Spottio.encryptMessage("Questo messaggio è stato eliminato", targetChatId);
            const docRef = getTargetCollection(activeChat.value.id, activeChat.value.isGroup).doc(id);
            await docRef.update({ text: encryptedText, deleted: true });
            openDropdownId.value = null;
        } catch (e) { 
            console.error(e);
            alert("Errore durante l'eliminazione.");
        }
    };

    const viewMessageInfo = (msg) => {
        selectedMsgInfo.value = msg;
        showMsgInfoModal.value = true;
        openDropdownId.value = null;
    };

    const closeMsgInfoModal = () => {
        showMsgInfoModal.value = false;
        selectedMsgInfo.value = null;
    };

    const startAudioRecording = () => {
        audio.startAudioRecording(async (audioUrl) => {
            const currentUid = getCurrentUid();
            const targetChatId = activeChat.value.isGroup 
                ? activeChat.value.id 
                : window.Spottio.getConversationId(currentUid, activeChat.value.id);
            const encryptedPayload = window.Spottio.encryptMessage(`audio:${audioUrl}`, targetChatId);
            await persistChatMessage(encryptedPayload, targetChatId);
        });
    };

    const stopAudioRecording = audio.stopAudioRecording;
    const cancelAudioRecording = audio.cancelAudioRecording;

    const toggleReaction = async (msg, emoji) => {
        const currentUid = getCurrentUid();
        const docRef = getTargetCollection(activeChat.value.id, activeChat.value.isGroup).doc(msg.id);
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
        } catch (e) { console.error(e); }
    };

    const startReply = (msg) => {
        replyingTo.value = msg;
        openDropdownId.value = null;
        Vue.nextTick(() => { if (messageInputRef.value) messageInputRef.value.focus(); });
    };

    const cancelReply = () => { replyingTo.value = null; };

    const scrollToMessage = (msgId) => {
        const el = document.getElementById(`msg-${msgId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-2', 'ring-blue-400');
            setTimeout(() => el.classList.remove('ring-2', 'ring-blue-400'), 1500);
        }
    };

    const toggleMsgDropdown = (id) => { openDropdownId.value = openDropdownId.value === id ? null : id; };
    const startEdit = (msg) => { editingMsgId.value = msg.id; editMsgText.value = msg.rawText; openDropdownId.value = null; };
    const cancelEdit = () => { editingMsgId.value = null; editMsgText.value = ''; };

    const saveEdit = async (id) => {
        if (!editMsgText.value.trim()) return;
        try {
            const currentUid = getCurrentUid();
            let targetChatId = activeChat.value.isGroup ? activeChat.value.id : window.Spottio.getConversationId(currentUid, activeChat.value.id);
            const encryptedText = window.Spottio.encryptMessage(editMsgText.value.trim(), targetChatId);
            const docRef = getTargetCollection(activeChat.value.id, activeChat.value.isGroup).doc(id);
            await docRef.update({ text: encryptedText, edited: true });
            cancelEdit();
        } catch (e) { alert("Errore salvataggio modifica."); }
    };

    const handleMentionInput = async (e) => {
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
        const val = newMessage.value;
        newMessage.value = val.substring(0, currentMentionMatch.index) + `@${username} ` + val.substring(messageInputRef.value.selectionStart);
        mentionResults.value = [];
        Vue.nextTick(() => messageInputRef.value.focus());
    };

    Vue.onUnmounted(() => {
        stopMessagesStream();
    });

    return {
        messages, newMessage, messagesContainer, messageInputRef, openDropdownId, editingMsgId, editMsgText, mentionResults,
        hasMoreMessages, isLoadingMore, replyingTo, isRecordingAudio, audioRecordingSeconds, isUploadingMedia, isUploadingAudio,
        showMsgInfoModal, selectedMsgInfo, ephemeralDuration, updateEphemeralDuration,
        showCustomEphemeralModal, customEphemeralValue, customEphemeralUnit,
        openCustomEphemeralModal, closeCustomEphemeralModal, confirmCustomEphemeral,
        getEphemeralLabel, onEphemeralSelectChange,
        startMessagesStream, stopMessagesStream, loadOlderMessages, handleMessagesScroll,
        sendMessage, sendMediaMessage, toggleMsgDropdown, startEdit, cancelEdit, saveEdit,
        deleteMessageForMe, deleteMessageForEveryone, viewMessageInfo, closeMsgInfoModal,
        handleMentionInput, insertMention, startReply, cancelReply, scrollToMessage, toggleReaction,
        startAudioRecording, stopAudioRecording, cancelAudioRecording
    };
}