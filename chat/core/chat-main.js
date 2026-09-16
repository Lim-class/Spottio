const { createApp, ref, onMounted } = Vue;

const app = createApp({
    setup() {
        let currentUid = window.Spottio ? window.Spottio.getCurrentUid() : localStorage.getItem('currentUid');
        let currentUsername = localStorage.getItem('currentUser');

        const getCurrentUid = () => currentUid;
        const getCurrentUsername = () => currentUsername;

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

        const listenToMyChats = () => {
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
                    snapshot.forEach(doc => {
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
                        let msgPreview = window.Spottio.decryptMessage ? window.Spottio.decryptMessage(rawPreview, targetId) : rawPreview;

                        if (msgPreview.startsWith('image:')) msgPreview = "📷 Immagine";
                        else if (msgPreview.startsWith('video:')) msgPreview = "🎥 Video";
                        else if (msgPreview.startsWith('audio:')) msgPreview = "🎤 Audio";

                        if (data.lastSender && data.lastSender !== currentUid && isGroup && data.lastSender !== "Sistema") {
                            const senderName = window.userCache[data.lastSender] ? window.userCache[data.lastSender].username : "Utente";
                            msgPreview = `${senderName}: ${msgPreview}`;
                        }

                        newChatList.push({ id: isGroup ? doc.id : otherUid, displayName, lastMessage: msgPreview, isGroup, avatarUrl, isVerified });
                    });
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
            if (!term) { searchResults.value = []; return; }
            try {
                const snapshot = await window.db.collection("users").get();
                const results = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.username && data.username.toLowerCase().includes(term) && doc.id !== currentUid) {
                        results.push({ id: doc.id, username: data.username, avatarUrl: data.userPfUri || "", isVerified: data.isVerified === true });
                    }
                });
                searchResults.value = results;
            } catch (err) { console.error(err); }
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
            const authInstance = window.auth || firebase.auth();
            authInstance.onAuthStateChanged(async (user) => {
                if (user) {
                    currentUid = user.uid;
                    listenToMyChats();
                    theme.loadBgOptions();
                    theme.loadUserBackground(user.uid);
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

// Registrazione Componenti
app.component('chat-sidebar', window.ChatSidebarComponent);
app.component('chat-messages', window.ChatMessagesComponent);
app.component('message-info-modal', window.MessageInfoModalComponent);
app.component('group-create-modal', window.GroupCreateModalComponent);
app.component('group-info-modal', window.GroupInfoModalComponent);
app.component('ephemeral-modal', window.EphemeralModalComponent);

app.mount('#vue-chat-app');