// chat/messages/use-chat-stream.js
function useChatStream(getCurrentUid, getCurrentUsername, activeChat, formatMessageContent, formatDateLabel, restoreDraft) {
    const messages = Vue.ref([]);
    const messagesContainer = Vue.ref(null);
    const PAGE_SIZE = 5;
    let oldestDocSnapshot = null;
    const hasMoreMessages = Vue.ref(true);
    const isLoadingMore = Vue.ref(false);

    const pinnedMessage = Vue.ref(null);
    let chatUnsubscribe = null;
    let chatSettingsUnsubscribe = null;
    let countdownInterval = null;

    const ephemeral = window.useEphemeralTimer();

    const getChatDocRef = () => {
        if (!activeChat.value.id) return null;
        const currentUid = getCurrentUid();
        return activeChat.value.isGroup 
            ? window.db.collection("groups").doc(activeChat.value.id)
            : window.db.collection("chats").doc(window.Spottio.getConversationId(currentUid, activeChat.value.id));
    };

    const getTargetCollection = (targetId, isGroup) => {
        if (isGroup) {
            return window.db.collection("groups").doc(targetId).collection("chats");
        }
        const currentUid = getCurrentUid();
        const convId = window.Spottio.getConversationId(currentUid, targetId);
        return window.db.collection("chats").doc(convId).collection("messages");
    };

    const computeExpirationDiff = (expDate) => {
        if (!expDate) return { text: '', isSoon: false, isExpired: false };
        const now = new Date();
        const diffSeconds = Math.floor((expDate.getTime() - now.getTime()) / 1000);

        if (diffSeconds <= 0) return { text: 'In eliminazione...', isSoon: true, isExpired: true };

        const isSoon = diffSeconds <= 300;
        if (diffSeconds < 60) return { text: `${diffSeconds}s`, isSoon, isExpired: false };
        if (diffSeconds < 3600) return { text: `${Math.floor(diffSeconds / 60)}m`, isSoon, isExpired: false };
        if (diffSeconds < 86400) return { text: `${Math.floor(diffSeconds / 3600)}h ${Math.floor((diffSeconds % 3600) / 60)}m`, isSoon, isExpired: false };
        return { text: `${Math.floor(diffSeconds / 86400)}g ${Math.floor((diffSeconds % 86400) / 3600)}h`, isSoon, isExpired: false };
    };

    const updateAllCountdowns = () => {
        messages.value.forEach(msg => {
            if (msg.expiresAtDate) {
                const res = computeExpirationDiff(msg.expiresAtDate);
                msg.expiresInText = res.text;
                msg.isExpiringSoon = res.isSoon;
            }
        });
    };

    const processDocSnapshot = (doc, targetChatId, isGroup, currentUid, currentUsername) => {
        const data = doc.data();
        if (!data.timestamp) return null;

        if (data.scheduledAt) {
            const schedDate = data.scheduledAt.toDate ? data.scheduledAt.toDate() : new Date(data.scheduledAt);
            if (new Date() < schedDate && data.sender !== currentUid) return null;
        }

        const deletedFor = data.deletedFor || [];
        if (deletedFor.includes(currentUid)) return null;

        let expireDate = null;
        if (data.expiresAt) {
            expireDate = data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
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

        const isViewOnce = data.isViewOnce === true || decryptedText.startsWith('audio_once:');
        const countdown = expireDate ? computeExpirationDiff(expireDate) : { text: '', isSoon: false };

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
            isEphemeral: !!data.expiresAt,
            expiresAtDate: expireDate,
            expiresInText: countdown.text,
            isExpiringSoon: countdown.isSoon,
            isViewOnce: isViewOnce,
            isListened: data.isListened === true,
            isScheduled: !!data.scheduledAt
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
            try { await batch.commit(); } catch (e) {}
        }
    };

    const listenChatSettings = (targetId, isGroup) => {
        if (chatSettingsUnsubscribe) chatSettingsUnsubscribe();
        const docRef = getChatDocRef();
        if (!docRef) return;

        chatSettingsUnsubscribe = docRef.onSnapshot(doc => {
            if (doc.exists) {
                const d = doc.data();
                ephemeral.ephemeralDuration.value = d.ephemeralDuration !== undefined ? Number(d.ephemeralDuration) : 0;
                pinnedMessage.value = d.pinnedMessage || null;
            } else {
                ephemeral.ephemeralDuration.value = 0;
                pinnedMessage.value = null;
            }
        });
    };

    const startMessagesStream = (targetId, isGroup) => {
        if (chatUnsubscribe) chatUnsubscribe();
        if (countdownInterval) clearInterval(countdownInterval);

        messages.value = [];
        oldestDocSnapshot = null;
        hasMoreMessages.value = true;

        restoreDraft(targetId);
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
                if (d.readReceipts) sendersToResolve.push(...Object.keys(d.readReceipts));
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

        countdownInterval = setInterval(updateAllCountdowns, 10000);
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
            console.error("Errore precedenti:", e);
        } finally {
            isLoadingMore.value = false;
        }
    };

    const stopMessagesStream = () => {
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
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
        pinnedMessage.value = null;
    };

    return {
        messages,
        messagesContainer,
        hasMoreMessages,
        isLoadingMore,
        pinnedMessage,
        ephemeral,
        getChatDocRef,
        getTargetCollection,
        startMessagesStream,
        loadOlderMessages,
        stopMessagesStream
    };
}