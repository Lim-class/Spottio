// chat/groups/use-chat-groups.js
function useChatGroups(getCurrentUid, getCurrentUsername, activeChat, goBackToList) {
    const showGroupModal = Vue.ref(false);
    const newGroupName = Vue.ref('');
    const newGroupAvatarUrl = Vue.ref('');
    const isUploadingGroupAvatar = Vue.ref(false);
    const groupSearchQuery = Vue.ref('');
    const groupSearchResults = Vue.ref([]);
    const selectedGroupMembers = Vue.ref([]);

    const showGroupInfoModal = Vue.ref(false);
    const groupInfo = Vue.ref(null);
    const newMemberUsername = Vue.ref('');
    const adminSearchResults = Vue.ref([]);
    let adminSearchTimeout = null;

    let activeBlobUrl = null;

    const revokeLocalBlob = () => {
        if (activeBlobUrl) {
            URL.revokeObjectURL(activeBlobUrl);
            activeBlobUrl = null;
        }
    };

    const searchGroupMembers = async () => {
        const term = groupSearchQuery.value.toLowerCase().trim();
        if (!term || term.length < 2) { 
            groupSearchResults.value = []; 
            return; 
        }
        try {
            let snap = await window.db.collection("users")
                .where("username_lower", ">=", term)
                .where("username_lower", "<=", term + '\uf8ff')
                .limit(10)
                .get();

            if (snap.empty) {
                snap = await window.db.collection("users")
                    .where("username", ">=", term)
                    .where("username", "<=", term + '\uf8ff')
                    .limit(10)
                    .get();
            }

            const currentViewerUid = getCurrentUid();
            const results = [];

            for (const doc of snap.docs) {
                const data = doc.data();
                const username = data.username || "";
                if (doc.id !== currentViewerUid && !selectedGroupMembers.value.some(m => m.uid === doc.id)) {
                    const hasStories = window.Spottio?.hasActiveFlashspot 
                        ? await window.Spottio.hasActiveFlashspot(doc.id, currentViewerUid)
                        : false;

                    results.push({ 
                        uid: doc.id, 
                        username, 
                        avatarUrl: data.userPfUri || data.profileImage || "",
                        isVerified: data.isVerified === true,
                        hasStories: hasStories
                    });
                }
            }
            groupSearchResults.value = results;
        } catch (e) { 
            console.error("Errore ricerca membri gruppo:", e); 
        }
    };

    const searchAdminMembers = () => {
        clearTimeout(adminSearchTimeout);
        const term = newMemberUsername.value.toLowerCase().trim();
        if (!term || term.length < 2 || !groupInfo.value) {
            adminSearchResults.value = [];
            return;
        }

        adminSearchTimeout = setTimeout(async () => {
            try {
                let snap = await window.db.collection("users")
                    .where("username_lower", ">=", term)
                    .where("username_lower", "<=", term + '\uf8ff')
                    .limit(10)
                    .get();

                if (snap.empty) {
                    snap = await window.db.collection("users")
                        .where("username", ">=", term)
                        .where("username", "<=", term + '\uf8ff')
                        .limit(10)
                        .get();
                }

                const currentGroupMembers = groupInfo.value.rawData?.members || [];
                const currentViewerUid = getCurrentUid();
                const results = [];

                for (const doc of snap.docs) {
                    const data = doc.data();
                    if (!currentGroupMembers.includes(doc.id)) {
                        const hasStories = window.Spottio?.hasActiveFlashspot 
                            ? await window.Spottio.hasActiveFlashspot(doc.id, currentViewerUid)
                            : false;

                        results.push({
                            uid: doc.id,
                            username: data.username || "Utente",
                            avatarUrl: data.userPfUri || data.profileImage || "",
                            isVerified: data.isVerified === true,
                            hasStories: hasStories
                        });
                    }
                }
                adminSearchResults.value = results;
            } catch (err) {
                console.error("Errore ricerca admin membri:", err); 
            }
        }, 300);
    };

    const addGroupMember = (user) => { 
        selectedGroupMembers.value.push(user); 
        groupSearchQuery.value = ''; 
        groupSearchResults.value = []; 
    };

    const removeGroupMember = (uid) => { 
        selectedGroupMembers.value = selectedGroupMembers.value.filter(m => m.uid !== uid); 
    };

    const closeGroupModal = () => { 
        revokeLocalBlob();
        showGroupModal.value = false; 
        newGroupName.value = ''; 
        newGroupAvatarUrl.value = ''; 
        isUploadingGroupAvatar.value = false;
        groupSearchQuery.value = '';
        groupSearchResults.value = [];
        selectedGroupMembers.value = []; 
    };

    const uploadNewGroupAvatar = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        revokeLocalBlob();
        activeBlobUrl = URL.createObjectURL(file);
        newGroupAvatarUrl.value = activeBlobUrl;
        isUploadingGroupAvatar.value = true;

        try {
            const res = await window.SpottioMediaService.upload(file);
            revokeLocalBlob();
            newGroupAvatarUrl.value = res.url;
        } catch (err) {
            alert(err.message || "Errore durante il caricamento della foto.");
            revokeLocalBlob();
            newGroupAvatarUrl.value = '';
        } finally {
            isUploadingGroupAvatar.value = false;
            e.target.value = '';
        }
    };

    const confirmCreateGroup = async () => {
        const cleanName = newGroupName.value.trim();
        if (!cleanName || selectedGroupMembers.value.length === 0) {
            return alert("Assegna un nome e seleziona almeno un partecipante.");
        }
        if (isUploadingGroupAvatar.value) {
            return alert("Attendi il completamento del caricamento foto...");
        }

        const currentUid = getCurrentUid();
        const allMembersUids = [...selectedGroupMembers.value.map(m => m.uid), currentUid];
        const memberNamesMap = { [currentUid]: getCurrentUsername() };
        selectedGroupMembers.value.forEach(m => memberNamesMap[m.uid] = m.username);

        try {
            const groupRef = await window.db.collection("groups").add({
                name: cleanName,
                avatarUrl: newGroupAvatarUrl.value,
                members: allMembersUids,
                memberNames: memberNamesMap,
                createdBy: currentUid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            await window.db.collection("chat_previews").doc(groupRef.id).set({
                groupName: cleanName,
                groupAvatarUrl: newGroupAvatarUrl.value,
                isGroup: true,
                groupId: groupRef.id,
                participants: allMembersUids,
                lastMessage: "Gruppo creato",
                lastSender: "Sistema",
                lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
            });

            closeGroupModal();
        } catch (e) {
            console.error("Errore creazione gruppo:", e);
            alert("Impossibile creare il gruppo.");
        }
    };

    const handleGroupInfoClick = () => {
        if (activeChat.value.isGroup && activeChat.value.id) {
            openGroupInfo();
        }
    };

    const openGroupInfo = async () => {
        if (!activeChat.value.id) return;
        try {
            const doc = await window.db.collection("groups").doc(activeChat.value.id).get();
            if (!doc.exists) return alert("Informazioni gruppo non trovate.");

            const data = doc.data();
            const membersList = data.members || [];
            const memberNamesMap = data.memberNames || {};
            await window.resolveUids(membersList);

            const currentUid = getCurrentUid();
            const isAdmin = data.createdBy === currentUid;

            const participants = [];
            for (const uid of membersList) {
                const userObj = window.userCache[uid] || {};
                const hasStories = window.Spottio?.hasActiveFlashspot 
                    ? await window.Spottio.hasActiveFlashspot(uid, currentUid)
                    : false;

                participants.push({
                    uid,
                    name: memberNamesMap[uid] || userObj.username || uid,
                    avatarUrl: userObj.userPfUri || userObj.profileImage || "",
                    isVerified: userObj.isVerified === true,
                    hasStories: hasStories,
                    isMe: uid === currentUid,
                    isAdmin: uid === data.createdBy
                });
            }

            const adminObj = window.userCache[data.createdBy] || {};
            const adminName = memberNamesMap[data.createdBy] || adminObj.username || "Admin";
            const adminAvatar = adminObj.userPfUri || adminObj.profileImage || "";
            const adminIsVerified = adminObj.isVerified === true;

            groupInfo.value = {
                id: activeChat.value.id,
                name: data.name || activeChat.value.displayName,
                avatarUrl: data.avatarUrl || activeChat.value.avatarUrl || "",
                isAdmin,
                adminName,
                adminAvatar,
                adminIsVerified,
                participants,
                pinnedMessage: data.pinnedMessage || null,
                createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toLocaleDateString('it-IT') : new Date(data.createdAt).toLocaleDateString('it-IT')) : '',
                rawData: data
            };
            adminSearchResults.value = [];
            newMemberUsername.value = '';
            showGroupInfoModal.value = true;
        } catch (e) {
            console.error(e);
            alert("Errore caricamento info gruppo.");
        }
    };

    // Generazione e copia link invito gruppo
    const copyGroupInviteLink = async () => {
        if (!groupInfo.value?.id) return;
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('joinGroup', groupInfo.value.id);
        const inviteLink = currentUrl.toString();

        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(inviteLink);
            } else {
                const ta = document.createElement("textarea");
                ta.value = inviteLink;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            }
            alert("Link di invito al gruppo copiato negli appunti! Invialo a chi vuoi far entrare.");
        } catch (err) {
            prompt("Copia manualmente il link di invito:", inviteLink);
        }
    };

    const editGroupName = async () => {
        const newName = prompt("Nuovo nome gruppo:", groupInfo.value.name);
        if (newName && newName.trim() && newName.trim() !== groupInfo.value.name) {
            const cleanName = newName.trim();
            await window.db.collection("groups").doc(groupInfo.value.id).update({ name: cleanName });
            await window.db.collection("chat_previews").doc(groupInfo.value.id).update({ groupName: cleanName });
            activeChat.value.displayName = cleanName;
            openGroupInfo();
        }
    };

    const changeGroupAvatar = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const res = await window.SpottioMediaService.upload(file);
            await window.db.collection("groups").doc(groupInfo.value.id).update({ avatarUrl: res.url });
            await window.db.collection("chat_previews").doc(groupInfo.value.id).update({ groupAvatarUrl: res.url });
            activeChat.value.avatarUrl = res.url;
            openGroupInfo();
        } catch (err) {
            alert(err.message || "Errore aggiornamento avatar gruppo.");
        }
        e.target.value = '';
    };

    const kickGroupMember = async (uid, name) => {
        if (!confirm(`Espellere ${name} dal gruppo?`)) return;
        const updated = groupInfo.value.rawData.members.filter(m => m !== uid);
        await window.db.collection("groups").doc(groupInfo.value.id).update({ members: updated });
        await window.db.collection("chat_previews").doc(groupInfo.value.id).update({ participants: updated });
        openGroupInfo();
    };

    const addNewGroupMember = async (selectedUser = null) => {
        let targetUid = selectedUser?.uid;
        let targetUsername = selectedUser?.username;

        if (!targetUid) {
            targetUsername = newMemberUsername.value.trim();
            if (!targetUsername) return;
            const snap = await window.db.collection("users").where("username", "==", targetUsername).limit(1).get();
            if (snap.empty) return alert("Utente non trovato.");
            targetUid = snap.docs[0].id;
        }

        if (groupInfo.value.rawData.members.includes(targetUid)) return alert("L'utente è già nel gruppo.");
        
        const updated = [...groupInfo.value.rawData.members, targetUid];
        await window.db.collection("groups").doc(groupInfo.value.id).update({ 
            members: updated, 
            [`memberNames.${targetUid}`]: targetUsername 
        });
        await window.db.collection("chat_previews").doc(groupInfo.value.id).update({ participants: updated });
        newMemberUsername.value = '';
        adminSearchResults.value = [];
        openGroupInfo();
    };

    const removePinnedMessageFromInfo = async () => {
        if (!groupInfo.value || !groupInfo.value.isAdmin) return;
        await window.db.collection("groups").doc(groupInfo.value.id).update({
            pinnedMessage: firebase.firestore.FieldValue.delete()
        });
        groupInfo.value.pinnedMessage = null;
    };

    const leaveGroup = async () => {
        if (!confirm("Vuoi davvero abbandonare questo gruppo?")) return;
        const currentUid = getCurrentUid();
        const updated = groupInfo.value.rawData.members.filter(m => m !== currentUid);
        await window.db.collection("groups").doc(groupInfo.value.id).update({ members: updated });
        await window.db.collection("chat_previews").doc(groupInfo.value.id).update({ participants: updated });
        showGroupInfoModal.value = false;
        goBackToList();
    };

    return {
        showGroupModal, newGroupName, newGroupAvatarUrl, isUploadingGroupAvatar, groupSearchQuery, groupSearchResults, selectedGroupMembers,
        showGroupInfoModal, groupInfo, newMemberUsername, adminSearchResults,
        searchGroupMembers, searchAdminMembers, addGroupMember, removeGroupMember, closeGroupModal, uploadNewGroupAvatar, confirmCreateGroup,
        handleGroupInfoClick, openGroupInfo, copyGroupInviteLink, editGroupName, changeGroupAvatar, kickGroupMember, addNewGroupMember, 
        removePinnedMessageFromInfo, leaveGroup
    };
}