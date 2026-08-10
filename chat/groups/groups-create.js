// ==========================================
// FILE: groups-create.js
// Logica di Creazione e Ricerca Membri per i Gruppi
// ==========================================

function setupGroupEventListeners() {
    if (!btnOpenGroupModal) return;

    btnOpenGroupModal.addEventListener('click', () => {
        groupModal.classList.remove('hidden');
        selectedGroupMembers = [];
        if(typeof renderSelectedMembers === 'function') renderSelectedMembers();
    });

    btnCloseGroupModal.addEventListener('click', () => {
        groupModal.classList.add('hidden');
        groupNameInput.value = '';
        groupUserSearch.value = '';
        groupSearchResults.classList.add('hidden');
    });

    groupUserSearch.addEventListener('input', async (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        if (searchTerm.length === 0) { groupSearchResults.classList.add('hidden'); return; }
        
        try {
            const snapshot = await db.collection("users").get();
            groupSearchResults.innerHTML = '';
            let count = 0;

            snapshot.forEach(doc => {
                const uid = doc.id;
                const username = doc.data().username || "";
                
                // ✨ Esclude l'utente corrente usando currentUid
                if (username.toLowerCase().includes(searchTerm) && uid !== currentUid && !selectedGroupMembers.some(m => m.uid === uid)) {
                    count++;
                    const div = document.createElement('div');
                    div.className = 'p-2 hover:bg-green-50 cursor-pointer border-b border-gray-100 text-sm';
                    div.textContent = username;
                    div.onclick = () => {
                        selectedGroupMembers.push({ uid: uid, username: username });
                        if(typeof renderSelectedMembers === 'function') renderSelectedMembers();
                        groupUserSearch.value = '';
                        groupSearchResults.classList.add('hidden');
                    };
                    groupSearchResults.appendChild(div);
                }
            });

            if (count > 0) groupSearchResults.classList.remove('hidden');
            else groupSearchResults.classList.add('hidden');
            
        } catch (err) { console.error("Errore ricerca gruppo:", err); }
    });

    btnConfirmGroup.addEventListener('click', async () => {
        const groupName = groupNameInput.value.trim();
        if (!groupName) return alert("Inserisci un nome per il gruppo");
        if (selectedGroupMembers.length === 0) return alert("Aggiungi almeno un membro");

        // ✨ Salvataggio sicuro nel Database tramite gli UID
        const allMembersUids = [...selectedGroupMembers.map(m => m.uid), currentUid];
        const memberNamesMap = { [currentUid]: currentUsername };
        selectedGroupMembers.forEach(m => memberNamesMap[m.uid] = m.username);

        try {
            const groupRef = await db.collection("groups").add({
                name: groupName,
                members: allMembersUids,
                memberNames: memberNamesMap, 
                createdBy: currentUid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            await db.collection("chat_previews").doc(groupRef.id).set({
                groupName: groupName,
                isGroup: true,
                groupId: groupRef.id,
                participants: allMembersUids,
                lastMessage: "Gruppo creato",
                lastSender: "Sistema",
                lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
            });

            groupModal.classList.add('hidden');
            groupNameInput.value = '';
            selectedGroupMembers = [];
            alert("Gruppo creato!");
        } catch (err) { console.error("Errore invio:", err); }
    });

    const btnCloseGroupInfo = document.getElementById('btn-close-group-info');
    if(btnCloseGroupInfo) {
        btnCloseGroupInfo.addEventListener('click', () => {
            document.getElementById('group-info-modal').classList.add('hidden');
        });
    }
}