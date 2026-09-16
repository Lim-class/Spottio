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
            const snap = await window.db.collection("users")
                .where("username", ">=", term)
                .where("username", "<=", term + '\uf8ff')
                .limit(15)
                .get();

            const results = [];
            snap.forEach(doc => {
                const username = doc.data().username || "";
                if (doc.id !== getCurrentUid() && !selectedGroupMembers.value.some(m => m.uid === doc.id)) {
                    results.push({ uid: doc.id, username });
                }
            });
            groupSearchResults.value = results;
        } catch (e) { 
            console.error("Errore ricerca membri gruppo:", e); 
        }
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
            const participants = membersList.map(uid => ({
                uid,
                name: memberNamesMap[uid] || (window.userCache[uid] ? window.userCache[uid].username : uid),
                isMe: uid === currentUid,
                isAdmin: uid === data.createdBy
            }));

            const adminName = memberNamesMap[data.createdBy] || 
                              (window.userCache[data.createdBy] ? window.userCache[data.createdBy].username : "Admin");

            groupInfo.value = {
                id: activeChat.value.id,
                name: data.name || activeChat.value.displayName,
                avatarUrl: data.avatarUrl || activeChat.value.avatarUrl || "",
                isAdmin,
                adminName,
                participants,
                rawData: data
            };
            showGroupInfoModal.value = true;
        } catch (e) {
            console.error(e);
            alert("Errore caricamento info gruppo.");
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
        if (!confirm(`Espellere ${name}?`)) return;
        const updated = groupInfo.value.rawData.members.filter(m => m !== uid);
        await window.db.collection("groups").doc(groupInfo.value.id).update({ members: updated });
        await window.db.collection("chat_previews").doc(groupInfo.value.id).update({ participants: updated });
        openGroupInfo();
    };

    const addNewGroupMember = async () => {
        const targetUsername = newMemberUsername.value.trim();
        if (!targetUsername) return;
        const snap = await window.db.collection("users").where("username", "==", targetUsername).limit(1).get();
        if (snap.empty) return alert("Utente non trovato.");
        const newUid = snap.docs[0].id;
        if (groupInfo.value.rawData.members.includes(newUid)) return alert("L'utente è già nel gruppo.");
        
        const updated = [...groupInfo.value.rawData.members, newUid];
        await window.db.collection("groups").doc(groupInfo.value.id).update({ 
            members: updated, 
            [`memberNames.${newUid}`]: targetUsername 
        });
        await window.db.collection("chat_previews").doc(groupInfo.value.id).update({ participants: updated });
        newMemberUsername.value = '';
        openGroupInfo();
    };

    const leaveGroup = async () => {
        if (!confirm("Vuoi abbandonare il gruppo?")) return;
        const currentUid = getCurrentUid();
        const updated = groupInfo.value.rawData.members.filter(m => m !== currentUid);
        await window.db.collection("groups").doc(groupInfo.value.id).update({ members: updated });
        await window.db.collection("chat_previews").doc(groupInfo.value.id).update({ participants: updated });
        showGroupInfoModal.value = false;
        goBackToList();
    };

    return {
        showGroupModal, newGroupName, newGroupAvatarUrl, isUploadingGroupAvatar, groupSearchQuery, groupSearchResults, selectedGroupMembers,
        showGroupInfoModal, groupInfo, newMemberUsername,
        searchGroupMembers, addGroupMember, removeGroupMember, closeGroupModal, uploadNewGroupAvatar, confirmCreateGroup,
        handleGroupInfoClick, openGroupInfo, editGroupName, changeGroupAvatar, kickGroupMember, addNewGroupMember, leaveGroup
    };
}