// anonimo/anonimo-main.js
const { createApp, ref, computed, onMounted, onUnmounted, nextTick } = Vue;

const app = createApp({
    setup() {
        let currentUid = (window.Spottio && typeof window.Spottio.getCurrentUid === 'function') 
            ? window.Spottio.getCurrentUid() 
            : localStorage.getItem('currentUid');
        let currentUsername = localStorage.getItem('currentUser');

        const getCurrentUid = () => currentUid;
        const getCurrentUsername = () => currentUsername;

        const theme = useChatTheme(getCurrentUid);
        const helpers = useChatHelpers();

        const allThreads = ref([]);
        const activeTab = ref('received');
        const activeThread = ref(null);
        const isChatActiveMobile = ref(false);
        const searchQuery = ref('');

        const messages = ref([]);
        const newMessage = ref('');
        const messagesContainer = ref(null);
        const messageInputRef = ref(null);
        const PAGE_SIZE = 5;
        let oldestDocSnapshot = null;
        const hasMoreMessages = ref(true);
        const isLoadingMore = ref(false);
        const isUploadingMedia = ref(false);

        let messagesUnsubscribe = null;
        let threadsUnsubscribe = null;
        let chatSettingsUnsubscribe = null;

        const openDropdownId = ref(null);
        const editingMsgId = ref(null);
        const editMsgText = ref('');

        const showMsgInfoModal = ref(false);
        const selectedMsgInfo = ref(null);
        const replyingTo = ref(null);

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

        const showNewAnonModal = ref(false);
        const targetUserSearch = ref('');
        const targetSearchResults = ref([]);
        const selectedTargetUser = ref(null);
        const initialMessageText = ref('');
        const isSending = ref(false);
        let searchDebounceTimeout = null;

        const isReceiver = computed(() => {
            return activeThread.value && activeThread.value.targetUid === currentUid;
        });

        const consecutiveAnonMessagesCount = computed(() => {
            if (!activeThread.value) return 0;
            let count = 0;
            for (let i = messages.value.length - 1; i >= 0; i--) {
                const msg = messages.value[i];
                if (msg.isFromAnonymous) {
                    count++;
                } else {
                    break;
                }
            }
            return count;
        });

        const isAnonWaitingForReply = computed(() => {
            return !isReceiver.value && consecutiveAnonMessagesCount.value >= 2;
        });

        const receivedThreads = computed(() => allThreads.value.filter(t => t.targetUid === currentUid));
        const sentThreads = computed(() => allThreads.value.filter(t => t.authorUid === currentUid));

        const filteredThreads = computed(() => {
            const list = activeTab.value === 'received' ? receivedThreads.value : sentThreads.value;
            const q = searchQuery.value.toLowerCase().trim();
            if (!q) return list;
            return list.filter(t => t.displayTitle.toLowerCase().includes(q) || (t.lastMessage && t.lastMessage.toLowerCase().includes(q)));
        });

        const listenChatSettings = (threadId) => {
            if (chatSettingsUnsubscribe) chatSettingsUnsubscribe();
            chatSettingsUnsubscribe = window.db.collection("anon_threads").doc(threadId).onSnapshot(doc => {
                if (doc.exists && doc.data().ephemeralDuration !== undefined) {
                    ephemeral.ephemeralDuration.value = Number(doc.data().ephemeralDuration);
                } else {
                    ephemeral.ephemeralDuration.value = 0;
                }
            });
        };

        const updateEphemeralDuration = async (e) => {
            const duration = Number(e.target.value);
            ephemeral.ephemeralDuration.value = duration;
            if (!activeThread.value) return;

            try {
                await window.db.collection("anon_threads").doc(activeThread.value.id).set({
                    ephemeralDuration: duration
                }, { merge: true });
            } catch (err) {
                console.error("Errore salvataggio timer effimero:", err);
            }
        };

        const openCustomEphemeralModal = ephemeral.openCustomEphemeralModal;
        const closeCustomEphemeralModal = ephemeral.closeCustomEphemeralModal;

        const confirmCustomEphemeral = () => {
            ephemeral.confirmCustomEphemeral(async (totalSeconds) => {
                if (activeThread.value) {
                    try {
                        await window.db.collection("anon_threads").doc(activeThread.value.id).set({
                            ephemeralDuration: totalSeconds
                        }, { merge: true });
                    } catch (err) {
                        console.error("Errore salvataggio durata:", err);
                    }
                }
            });
        };

        const onEphemeralSelectChange = (e) => {
            if (e.target.value === 'custom') openCustomEphemeralModal();
            else updateEphemeralDuration(e);
        };

        const processDocSnapshot = (doc, threadId) => {
            const data = doc.data();
            if (!data.timestamp) return null;

            const deletedFor = data.deletedFor || [];
            if (deletedFor.includes(currentUid)) return null;

            if (data.expiresAt) {
                const expDate = data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
                if (new Date() > expDate) {
                    doc.ref.delete().catch(() => {});
                    return null;
                }
            }

            const date = data.timestamp.toDate ? data.timestamp.toDate() : new Date();
            const isFromAnonymous = data.senderRole === 'anonymous';
            const isMe = (isFromAnonymous && activeThread.value.authorUid === currentUid) ||
                         (!isFromAnonymous && activeThread.value.targetUid === currentUid);

            const decryptedText = window.Spottio.decryptMessage(data.text, threadId);

            let replyPreview = null;
            if (data.replyTo) {
                replyPreview = {
                    id: data.replyTo.id,
                    senderName: data.replyTo.senderName,
                    text: window.Spottio.decryptMessage(data.replyTo.text, threadId)
                };
            }

            const readReceipts = data.readReceipts || {};
            const readUids = Object.keys(readReceipts);
            const otherUid = isReceiver.value ? activeThread.value.authorUid : activeThread.value.targetUid;
            const isDelivered = readUids.length > 0;
            const isRead = readUids.includes(otherUid);

            const readDetails = [];
            if (isRead && readReceipts[otherUid]) {
                const rDate = readReceipts[otherUid].toDate ? readReceipts[otherUid].toDate() : new Date();
                readDetails.push({
                    uid: otherUid,
                    username: isReceiver.value ? 'Anonimo' : (activeThread.value.displayTitle || 'Destinatario'),
                    time: `${rDate.toLocaleDateString([], { day: '2-digit', month: '2-digit' })} alle ${rDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                });
            }

            return {
                id: doc.id,
                docRef: doc.ref,
                isMe,
                isFromAnonymous,
                rawText: decryptedText,
                contentHtml: helpers.formatMessageContent(decryptedText, data.deleted, false, isMe),
                isDeleted: data.deleted || false,
                isEdited: data.edited || false,
                timestamp: date,
                timeStr: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                fullDateStr: date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                reactions: data.reactions || {},
                replyTo: replyPreview,
                readReceipts,
                readDetails,
                isRead,
                isDelivered,
                isEphemeral: !!data.expiresAt
            };
        };

        const markMessagesAsRead = async (list) => {
            if (!list || list.length === 0 || !activeThread.value) return;
            const batch = window.db.batch();
            let needsCommit = false;

            list.forEach(m => {
                if (!m.isMe && (!m.readReceipts || !m.readReceipts[currentUid])) {
                    const docRef = window.db.collection("anon_threads").doc(activeThread.value.id).collection("messages").doc(m.id);
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

        const listenToAnonThreads = () => {
            if (threadsUnsubscribe) threadsUnsubscribe();
            
            threadsUnsubscribe = window.db.collection("anon_threads")
                .where("participants", "array-contains", currentUid)
                .orderBy("lastUpdate", "desc")
                .onSnapshot(async snapshot => {
                    const uidsToResolve = [];
                    snapshot.forEach(doc => {
                        const d = doc.data();
                        if (d.targetUid) uidsToResolve.push(d.targetUid);
                    });
                    await window.resolveUids(uidsToResolve);

                    const list = [];
                    snapshot.forEach(doc => {
                        const d = doc.data();
                        const isMeAuthor = d.authorUid === currentUid;
                        
                        let displayTitle = d.displayName || "Messaggio Anonimo";
                        let targetAvatarUrl = "";
                        let targetIsVerified = false;

                        if (isMeAuthor && window.userCache[d.targetUid]) {
                            displayTitle = window.userCache[d.targetUid].username || displayTitle;
                            targetAvatarUrl = window.userCache[d.targetUid].userPfUri || window.userCache[d.targetUid].profileImageUrl || "";
                            targetIsVerified = window.userCache[d.targetUid].isVerified === true;
                        }

                        const decryptedLast = window.Spottio.decryptMessage(d.lastMessage || '', doc.id);

                        list.push({
                            id: doc.id,
                            authorUid: d.authorUid,
                            targetUid: d.targetUid,
                            displayTitle,
                            targetAvatarUrl,
                            targetIsVerified,
                            isBlocked: d.isBlocked || false,
                            lastMessage: decryptedLast,
                            lastUpdate: d.lastUpdate
                        });
                    });

                    allThreads.value = list;

                    if (activeThread.value) {
                        const updated = list.find(t => t.id === activeThread.value.id);
                        if (updated) activeThread.value = updated;
                    }
                });
        };

        const startMessagesStream = (threadId) => {
            if (messagesUnsubscribe) messagesUnsubscribe();
            messages.value = [];
            oldestDocSnapshot = null;
            hasMoreMessages.value = true;
            replyingTo.value = null;

            listenChatSettings(threadId);

            const colRef = window.db.collection("anon_threads").doc(threadId).collection("messages");

            messagesUnsubscribe = colRef.orderBy("timestamp", "desc").limit(PAGE_SIZE).onSnapshot(snapshot => {
                if (snapshot.empty) {
                    messages.value = [];
                    hasMoreMessages.value = false;
                    return;
                }

                const fetched = [];
                snapshot.forEach(doc => {
                    const parsed = processDocSnapshot(doc, threadId);
                    if (parsed) fetched.push(parsed);
                });

                oldestDocSnapshot = snapshot.docs[snapshot.docs.length - 1];
                if (snapshot.docs.length < PAGE_SIZE) hasMoreMessages.value = false;

                fetched.reverse();

                let lastDateLabel = "";
                fetched.forEach(m => {
                    const dateLabel = helpers.formatDateLabel(m.timestamp);
                    m.showDateSeparator = (dateLabel !== lastDateLabel);
                    m.dateLabel = dateLabel;
                    lastDateLabel = dateLabel;
                });

                const isAtBottom = messagesContainer.value 
                    ? (messagesContainer.value.scrollHeight - messagesContainer.value.scrollTop <= messagesContainer.value.clientHeight + 120)
                    : true;

                messages.value = fetched;
                markMessagesAsRead(fetched);

                nextTick(() => {
                    if (isAtBottom && messagesContainer.value) {
                        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
                    }
                });
            });
        };

        const loadOlderMessages = async () => {
            if (!hasMoreMessages.value || isLoadingMore.value || !oldestDocSnapshot || !activeThread.value) return;
            isLoadingMore.value = true;
            const threadId = activeThread.value.id;

            try {
                const snap = await window.db.collection("anon_threads").doc(threadId).collection("messages")
                    .orderBy("timestamp", "desc")
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

                const olderMessages = [];
                snap.forEach(doc => {
                    const parsed = processDocSnapshot(doc, threadId);
                    if (parsed) olderMessages.push(parsed);
                });
                olderMessages.reverse();

                const combined = [...olderMessages, ...messages.value];
                let lastDateLabel = "";
                combined.forEach(m => {
                    const dateLabel = helpers.formatDateLabel(m.timestamp);
                    m.showDateSeparator = (dateLabel !== lastDateLabel);
                    m.dateLabel = dateLabel;
                    lastDateLabel = dateLabel;
                });

                const container = messagesContainer.value;
                const previousScrollHeight = container ? container.scrollHeight : 0;

                messages.value = combined;
                markMessagesAsRead(olderMessages);

                nextTick(() => {
                    if (container) container.scrollTop = container.scrollHeight - previousScrollHeight;
                });
            } catch (e) {
                console.error("Errore recupero cronologia:", e);
            } finally {
                isLoadingMore.value = false;
            }
        };

        const handleMessagesScroll = (e) => {
            if (e.target.scrollTop === 0 && hasMoreMessages.value && !isLoadingMore.value) {
                loadOlderMessages();
            }
        };

        const selectThread = (thread) => {
            activeThread.value = thread;
            isChatActiveMobile.value = window.innerWidth < 1024;
            startMessagesStream(thread.id);
        };

        const goBackToList = () => {
            isChatActiveMobile.value = false;
            activeThread.value = null;
            if (messagesUnsubscribe) messagesUnsubscribe();
            if (chatSettingsUnsubscribe) chatSettingsUnsubscribe();
            messages.value = [];
        };

        const persistAnonMessage = async (encryptedPayload, extraData = {}) => {
            if (!activeThread.value) return;

            if (isAnonWaitingForReply.value) {
                alert("Hai già inviato 2 messaggi senza ricevere risposta. Attendi che il destinatario risponda prima di inviarne altri.");
                return;
            }

            const threadId = activeThread.value.id;
            const timestamp = firebase.firestore.FieldValue.serverTimestamp();
            const senderRole = (activeThread.value.authorUid === currentUid) ? 'anonymous' : 'target';
            const expiresAt = ephemeral.calculateExpirationTimestamp(ephemeral.ephemeralDuration.value);

            const messageData = {
                senderRole,
                text: encryptedPayload,
                timestamp,
                readReceipts: {},
                deletedFor: [],
                expiresAt,
                ...extraData
            };

            await window.db.collection("anon_threads").doc(threadId).collection("messages").add(messageData);
            await window.db.collection("anon_threads").doc(threadId).set({
                lastMessage: encryptedPayload,
                lastSenderRole: senderRole,
                lastUpdate: timestamp
            }, { merge: true });
        };

        const sendMessage = async () => {
            const rawText = newMessage.value.trim();
            if (!rawText || !activeThread.value || isUploadingMedia.value) return;

            if (isAnonWaitingForReply.value) {
                alert("Hai già inviato 2 messaggi senza risposta. Attendi la risposta dell'utente prima di inviarne altri.");
                return;
            }

            const threadId = activeThread.value.id;
            const encryptedText = window.Spottio.encryptMessage(rawText, threadId);

            const extraData = {};
            if (replyingTo.value) {
                extraData.replyTo = {
                    id: replyingTo.value.id,
                    senderName: replyingTo.value.isMe ? 'Tu' : (isReceiver.value ? 'Anonimo' : activeThread.value.displayTitle),
                    text: window.Spottio.encryptMessage(replyingTo.value.rawText, threadId)
                };
            }

            newMessage.value = '';
            replyingTo.value = null;

            try {
                await persistAnonMessage(encryptedText, extraData);
            } catch (err) {
                console.error("Errore invio messaggio anonimo:", err);
            }
        };

        const sendMediaMessage = async (e) => {
            const file = e.target.files[0];
            if (!file || !activeThread.value) return;

            if (isAnonWaitingForReply.value) {
                alert("Hai già inviato 2 messaggi senza risposta. Attendi che l'altro utente ti risponda.");
                return;
            }

            isUploadingMedia.value = true;
            const threadId = activeThread.value.id;
            try {
                const mediaResult = await window.SpottioMediaService.upload(file);
                const fileType = file.type.startsWith('video/') ? 'video' : (file.type.startsWith('audio/') ? 'audio' : 'image');
                const encryptedPayload = window.Spottio.encryptMessage(`${fileType}:${mediaResult.url}`, threadId);
                await persistAnonMessage(encryptedPayload);
            } catch (err) {
                alert(err.message || "Errore upload file");
            } finally {
                isUploadingMedia.value = false;
                e.target.value = '';
            }
        };

        const startAudioRecording = () => {
            audio.startAudioRecording(
                async (audioUrl) => {
                    const threadId = activeThread.value.id;
                    const encryptedPayload = window.Spottio.encryptMessage(`audio:${audioUrl}`, threadId);
                    await persistAnonMessage(encryptedPayload);
                },
                () => {
                    if (isAnonWaitingForReply.value) {
                        alert("Non puoi inviare altre note vocali prima di aver ricevuto una risposta (limite di 2 messaggi).");
                        return false;
                    }
                    return true;
                }
            );
        };

        const stopAudioRecording = audio.stopAudioRecording;
        const cancelAudioRecording = audio.cancelAudioRecording;

        const toggleReaction = async (msg, emoji) => {
            if (!activeThread.value) return;
            const docRef = window.db.collection("anon_threads").doc(activeThread.value.id).collection("messages").doc(msg.id);
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

        const startReply = (msg) => {
            replyingTo.value = msg;
            openDropdownId.value = null;
            nextTick(() => { if (messageInputRef.value) messageInputRef.value.focus(); });
        };

        const cancelReply = () => { replyingTo.value = null; };

        const scrollToMessage = (msgId) => {
            const el = document.getElementById(`msg-${msgId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('ring-2', 'ring-purple-400');
                setTimeout(() => el.classList.remove('ring-2', 'ring-purple-400'), 1500);
            }
        };

        const toggleMsgDropdown = (id) => { openDropdownId.value = openDropdownId.value === id ? null : id; };
        const startEdit = (msg) => { editingMsgId.value = msg.id; editMsgText.value = msg.rawText; openDropdownId.value = null; };
        const cancelEdit = () => { editingMsgId.value = null; editMsgText.value = ''; };

        const saveEdit = async (id) => {
            if (!editMsgText.value.trim() || !activeThread.value) return;
            try {
                const threadId = activeThread.value.id;
                const encryptedText = window.Spottio.encryptMessage(editMsgText.value.trim(), threadId);
                const docRef = window.db.collection("anon_threads").doc(threadId).collection("messages").doc(id);
                await docRef.update({ text: encryptedText, edited: true });
                cancelEdit();
            } catch (e) { alert("Errore salvataggio modifica."); }
        };

        const deleteMessageForMe = async (id) => {
            if (!activeThread.value) return;
            try {
                const docRef = window.db.collection("anon_threads").doc(activeThread.value.id).collection("messages").doc(id);
                await docRef.update({
                    deletedFor: firebase.firestore.FieldValue.arrayUnion(currentUid)
                });
                messages.value = messages.value.filter(m => m.id !== id);
                openDropdownId.value = null;
            } catch (e) { alert("Errore eliminazione"); }
        };

        const deleteMessageForEveryone = async (id) => {
            if (!confirm("Eliminare per tutti?") || !activeThread.value) return;
            try {
                const threadId = activeThread.value.id;
                const encryptedText = window.Spottio.encryptMessage("Questo messaggio è stato eliminato", threadId);
                const docRef = window.db.collection("anon_threads").doc(threadId).collection("messages").doc(id);
                await docRef.update({ text: encryptedText, deleted: true });
                openDropdownId.value = null;
            } catch (e) { alert("Errore eliminazione"); }
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

        const blockThread = async () => {
            if (!confirm("Vuoi bloccare questa conversazione anonima? L'utente non potrà più inviarti messaggi.")) return;
            try {
                const threadId = activeThread.value.id;
                await window.db.collection("anon_threads").doc(threadId).update({
                    isBlocked: true
                });

                activeThread.value.isBlocked = true;
                alert("Conversazione bloccata con successo.");
            } catch (e) {
                console.error("Errore durante il blocco:", e);
                alert("Errore durante il blocco.");
            }
        };

        const openNewAnonModal = () => {
            showNewAnonModal.value = true;
            targetUserSearch.value = '';
            targetSearchResults.value = [];
            selectedTargetUser.value = null;
            initialMessageText.value = '';
        };

        const closeNewAnonModal = () => { showNewAnonModal.value = false; };

        const searchRecipient = () => {
            clearTimeout(searchDebounceTimeout);
            const term = targetUserSearch.value.toLowerCase().trim();
            if (!term || term.length < 3) { 
                targetSearchResults.value = []; 
                return; 
            }

            searchDebounceTimeout = setTimeout(async () => {
                try {
                    const snap = await window.db.collection("users")
                        .where("username", ">=", term)
                        .where("username", "<=", term + '\uf8ff')
                        .limit(10)
                        .get();

                    const results = [];
                    snap.forEach(doc => {
                        const data = doc.data();
                        if (doc.id !== currentUid) {
                            results.push({ 
                                id: doc.id, 
                                username: data.username,
                                avatarUrl: data.userPfUri || data.profileImageUrl || "",
                                isVerified: data.isVerified === true
                            });
                        }
                    });
                    targetSearchResults.value = results;
                } catch (e) {
                    console.error("Errore ricerca destinatario:", e);
                }
            }, 350);
        };

        const selectRecipient = (user) => {
            selectedTargetUser.value = user;
            targetUserSearch.value = '';
            targetSearchResults.value = [];
        };

        const confirmSendNewAnon = async () => {
            if (!selectedTargetUser.value) return alert("Seleziona un destinatario.");
            if (!initialMessageText.value.trim()) return alert("Scrivi un messaggio iniziale.");

            isSending.value = true;
            const targetUid = selectedTargetUser.value.id;
            const targetUsername = selectedTargetUser.value.username;
            const targetAvatarUrl = selectedTargetUser.value.avatarUrl;
            const targetIsVerified = selectedTargetUser.value.isVerified;

            try {
                const existingBlockedSnap = await window.db.collection("anon_threads")
                    .where("participants", "array-contains", currentUid)
                    .where("isBlocked", "==", true)
                    .get();

                const isBlockedByTarget = existingBlockedSnap.docs.some(doc => {
                    const data = doc.data();
                    return data.targetUid === targetUid && data.authorUid === currentUid;
                });

                if (isBlockedByTarget) {
                    alert("Non puoi inviare messaggi anonimi a questo utente perché la conversazione è bloccata.");
                    isSending.value = false;
                    return;
                }

                const threadRef = window.db.collection("anon_threads").doc();
                const threadId = threadRef.id;

                const pseudonumber = Math.floor(100 + Math.random() * 900);
                const displayName = `Anonimo #${pseudonumber}`;
                const encryptedText = window.Spottio.encryptMessage(initialMessageText.value.trim(), threadId);
                const timestamp = firebase.firestore.FieldValue.serverTimestamp();

                await threadRef.set({
                    id: threadId,
                    authorUid: currentUid,
                    targetUid: targetUid,
                    participants: [currentUid, targetUid],
                    displayName,
                    isBlocked: false,
                    lastMessage: encryptedText,
                    lastSenderRole: 'anonymous',
                    createdAt: timestamp,
                    lastUpdate: timestamp
                });

                await threadRef.collection("messages").add({
                    senderRole: 'anonymous',
                    text: encryptedText,
                    timestamp,
                    readReceipts: {},
                    deletedFor: []
                });

                closeNewAnonModal();
                activeTab.value = 'sent';

                selectThread({
                    id: threadId,
                    authorUid: currentUid,
                    targetUid: targetUid,
                    displayTitle: targetUsername,
                    targetAvatarUrl,
                    targetIsVerified,
                    isBlocked: false,
                    lastMessage: initialMessageText.value.trim(),
                    lastUpdate: new Date()
                });
            } catch (e) {
                console.error("Errore invio anonimo:", e);
                alert("Errore durante l'invio del messaggio anonimo");
            } finally {
                isSending.value = false;
            }
        };

        const handleDocumentClick = () => {
            openDropdownId.value = null;
        };

        onMounted(() => {
            const authInstance = window.auth || firebase.auth();
            authInstance.onAuthStateChanged(user => {
                if (user) {
                    currentUid = user.uid;
                    listenToAnonThreads();
                    theme.loadBgOptions();
                    theme.loadUserBackground(user.uid);
                } else {
                    window.location.href = '../index.html';
                }
            });

            document.addEventListener('click', handleDocumentClick);
        });

        onUnmounted(() => {
            document.removeEventListener('click', handleDocumentClick);
            if (messagesUnsubscribe) messagesUnsubscribe();
            if (threadsUnsubscribe) threadsUnsubscribe();
            if (chatSettingsUnsubscribe) chatSettingsUnsubscribe();
        });

        return {
            getCurrentUid,
            getCurrentUsername,
            ...theme,
            ...helpers,
            allThreads,
            activeTab,
            activeThread,
            receivedThreads,
            sentThreads,
            filteredThreads,
            isChatActiveMobile,
            isReceiver,
            consecutiveAnonMessagesCount,
            isAnonWaitingForReply,
            searchQuery,
            messages,
            newMessage,
            messagesContainer,
            messageInputRef,
            hasMoreMessages,
            isLoadingMore,
            isUploadingMedia,
            openDropdownId,
            editingMsgId,
            editMsgText,
            replyingTo,
            isRecordingAudio,
            audioRecordingSeconds,
            isUploadingAudio,
            showMsgInfoModal,
            selectedMsgInfo,
            ephemeralDuration,
            showCustomEphemeralModal,
            customEphemeralValue,
            customEphemeralUnit,
            getEphemeralLabel,
            showNewAnonModal,
            targetUserSearch,
            targetSearchResults,
            selectedTargetUser,
            initialMessageText,
            isSending,
            selectThread,
            goBackToList,
            sendMessage,
            sendMediaMessage,
            startAudioRecording,
            stopAudioRecording,
            cancelAudioRecording,
            toggleReaction,
            startReply,
            cancelReply,
            scrollToMessage,
            toggleMsgDropdown,
            startEdit,
            cancelEdit,
            saveEdit,
            deleteMessageForMe,
            deleteMessageForEveryone,
            viewMessageInfo,
            closeMsgInfoModal,
            blockThread,
            loadOlderMessages,
            handleMessagesScroll,
            onEphemeralSelectChange,
            openCustomEphemeralModal,
            closeCustomEphemeralModal,
            confirmCustomEphemeral,
            openNewAnonModal,
            closeNewAnonModal,
            searchRecipient,
            selectRecipient,
            confirmSendNewAnon
        };
    }
});

app.component('message-info-modal', window.MessageInfoModalComponent);
app.component('ephemeral-modal', window.EphemeralModalComponent);

app.mount('#vue-anon-app');