// =========================================================================
// FILE: chat/core/chat-main.js
// Controller Vue 3 Chat Standard con Stato Utente Centralizzato e Cifratura Serverless
// =========================================================================

const { createApp, ref, onMounted } = Vue;

const app = createApp({
    setup() {
        const { getCurrentUid, getCurrentUsername, onAuthReady } = window.useAuthUser();

        const chatList = ref([]);
        const searchQuery = ref('');
        const searchResults = ref([]);
        const activeChatId = ref(null);
        const activeChat = ref({ id: null, isGroup: false, displayName: '', avatarUrl: '', isVerified: false });
        const isChatActiveMobile = ref(false);

        let previewsUnsubscribe = null;

        const helpers = useChatHelpers();
        const theme = useChatTheme(getCurrentUid);

        const goBackToList = () => {
            isChatActiveMobile.value = false;
            activeChatId.value = null;
            activeChat.value = { id: null, isGroup: false, displayName: '' };
            chatMessages.stopMessagesStream();
        };

        const chatMessages = useChatMessages(getCurrentUid, getCurrentUsername, activeChat, helpers.formatMessageContent, helpers.formatDateLabel);
        const chatGroups = useChatGroups(getCurrentUid, getCurrentUsername, activeChat, goBackToList);

        const checkJoinGroupFromUrl = async (uid, username) => {
            const urlParams = new URLSearchParams(window.location.search);
            const targetGroupId = urlParams.get('joinGroup');
            if (!targetGroupId) return;

            try {
                const groupRef = window.db.collection("groups").doc(targetGroupId);
                const gDoc = await groupRef.get();
                if (!gDoc.exists) return;

                const gData = gDoc.data();
                const members = gData.members || [];

                if (!members.includes(uid)) {
                    const updatedMembers = [...members, uid];
                    await groupRef.update({
                        members: updatedMembers,
                        [`memberNames.${uid}`]: username
                    });
                    await window.db.collection("chat_previews").doc(targetGroupId).update({
                        participants: updatedMembers
                    });
                    alert(`Ti sei unito con successo al gruppo "${gData.name}"!`);
                }

                startChat(targetGroupId, gData.name, true, gData.avatarUrl || '', false);

                const cleanUrl = window.location.pathname;
                window.history.replaceState({}, document.title, cleanUrl);
            } catch (err) {
                console.error("Errore ingresso gruppo tramite link:", err);
            }
        };

        const listenToMyChats = () => {
            const currentUid = getCurrentUid();
            if (!currentUid) return;

            if (previewsUnsubscribe) previewsUnsubscribe();
            previewsUnsubscribe = window.db.collection("chat_previews")
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
                        if (data.lastSender && data.lastSender !== "Sistema") uidsToResolve.push(data.lastSender);
                    });

                    await window.resolveUids(uidsToResolve);

                    const newChatList = [];
                    for (const doc of snapshot.docs) {
                        const data = doc.data();
                        const isGroup = data.isGroup || false;
                        let otherUid = null;
                        let displayName = isGroup ? (data.groupName || "Gruppo") : "Utente Sconosciuto";
                        let avatarUrl = isGroup ? (data.groupAvatarUrl || "") : "";
                        let isVerified = false;

                        if (!isGroup) {
                            otherUid = data.participants.find(p => p !== currentUid) || currentUid;
                            if (window.userCache[otherUid]) {
                                displayName = window.userCache[otherUid].username || displayName;
                                avatarUrl = window.userCache[otherUid].userPfUri || window.userCache[otherUid].profileImageUrl || "";
                                isVerified = window.userCache[otherUid].isVerified === true;
                            }
                        }

                        let rawPreview = data.lastMessage || 'Nessun messaggio';
                        let targetId = isGroup ? doc.id : window.Spottio.getConversationId(currentUid, otherUid);
                        let msgPreview = rawPreview;
                        
                        if (window.Spottio && typeof window.Spottio.decryptMessage === 'function') {
                            msgPreview = await window.Spottio.decryptMessage(rawPreview, targetId);
                        }

                        if (msgPreview.startsWith('image:')) msgPreview = "📷 Immagine";
                        else if (msgPreview.startsWith('video:')) msgPreview = "🎥 Video";
                        else if (msgPreview.startsWith('audio:') || msgPreview.startsWith('audio_once:')) msgPreview = "🎤 Nota Vocale";

                        if (data.lastSender && data.lastSender !== currentUid && isGroup && data.lastSender !== "Sistema") {
                            const senderName = window.userCache[data.lastSender] ? window.userCache[data.lastSender].username : "Utente";
                            msgPreview = `${senderName}: ${msgPreview}`;
                        }

                        newChatList.push({ id: isGroup ? doc.id : otherUid, displayName, lastMessage: msgPreview, isGroup, avatarUrl, isVerified });
                    }
                    chatList.value = newChatList;
                });
        };

        const startChat = (id, displayName, isGroup, avatarUrl, isVerified) => {
            activeChatId.value = id;
            activeChat.value = { id, isGroup, displayName, avatarUrl, isVerified };
            isChatActiveMobile.value = window.innerWidth < 1024;
            chatMessages.startMessagesStream(id, isGroup);
        };

        const selectExistingChat = (chat) => {
            startChat(chat.id, chat.displayName, chat.isGroup, chat.avatarUrl, chat.isVerified);
        };

        const searchUsers = async () => {
            const term = searchQuery.value.toLowerCase().trim();
            if (!term || term.length < 2) { 
                searchResults.value = []; 
                return; 
            }
            try {
                searchResults.value = await window.searchUsersFirestore(term, {
                    limit: 10,
                    excludeUids: [getCurrentUid()]
                });
            } catch (err) { 
                console.error("Errore ricerca utenti chat:", err); 
            }
        };

        const selectChatFromSearch = (user) => {
            startChat(user.id, user.username, false, user.avatarUrl, user.isVerified);
            searchQuery.value = '';
            searchResults.value = [];
        };

        const triggerBgUpload = () => {
            const input = document.getElementById('bg-upload-input');
            if (input) input.click();
        };

        const onBackgroundChange = () => {
            if (theme.selectedBg.value === 'custom') {
                triggerBgUpload();
                theme.selectedBg.value = 'default';
                return;
            }
            theme.changeBackground();
        };

        onMounted(() => {
            onAuthReady(async (authUser) => {
                if (authUser && authUser.uid) {
                    listenToMyChats();
                    theme.loadBgOptions();
                    theme.loadUserBackground(authUser.uid);
                    await checkJoinGroupFromUrl(authUser.uid, authUser.username);
                } else {
                    window.location.href = '../index.html';
                }
            });

            document.addEventListener('click', () => {
                chatMessages.openDropdownId.value = null;
                chatMessages.mentionResults.value = [];
            });
        });

        return {
            getCurrentUid,
            getCurrentUsername,
            chatList, 
            searchQuery, 
            searchResults, 
            activeChatId, 
            activeChat, 
            isChatActiveMobile,
            goBackToList, 
            selectExistingChat, 
            searchUsers, 
            selectChatFromSearch,
            onBackgroundChange,
            ...helpers,
            ...theme,
            ...chatGroups,
            ...chatMessages
        };
    }
});

app.component('chat-sidebar', window.ChatSidebarComponent);
app.component('chat-messages', window.ChatMessagesComponent);
app.component('message-info-modal', window.MessageInfoModalComponent);
app.component('group-create-modal', window.GroupCreateModalComponent);
app.component('group-info-modal', window.GroupInfoModalComponent);
app.component('ephemeral-modal', window.EphemeralModalComponent);

app.mount('#vue-chat-app');