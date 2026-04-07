// FILE: messages-groups.js

// Elementi DOM specifici del gruppo (Dichiarati solo qui)
const groupModal = document.getElementById('group-modal');
const btnOpenGroupModal = document.getElementById('btn-open-group-modal');
const btnCloseGroupModal = document.getElementById('btn-close-group-modal');
const btnConfirmGroup = document.getElementById('btn-confirm-group');
const groupNameInput = document.getElementById('group-name-input');
const groupUserSearch = document.getElementById('group-user-search');
const groupSearchResults = document.getElementById('group-search-results');
const selectedMembersList = document.getElementById('selected-members-list');

let selectedGroupMembers = []; 

function renderSelectedMembers() {
    if (!selectedMembersList) return;
    selectedMembersList.innerHTML = '';
    selectedGroupMembers.forEach(member => {
        const div = document.createElement('div');
        div.className = 'inline-flex items-center bg-green-100 text-green-800 px-2 py-1 rounded text-xs mr-2 mb-2 cursor-pointer hover:bg-green-200';
        div.innerHTML = `${member} <span class="ml-1 font-bold">×</span>`;
        div.onclick = () => {
            selectedGroupMembers = selectedGroupMembers.filter(m => m !== member);
            renderSelectedMembers();
        };
        selectedMembersList.appendChild(div);
    });
}

function setupGroupEventListeners() {
    if (!btnOpenGroupModal) return;

    btnOpenGroupModal.addEventListener('click', () => {
        groupModal.classList.remove('hidden');
        selectedGroupMembers = [];
        renderSelectedMembers();
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
            // Nota: db e currentUser vengono dal contesto globale di messages-main.js
            const snapshot = await db.collection("users").get();
            groupSearchResults.innerHTML = '';
            let count = 0;

            snapshot.forEach(doc => {
                const docId = doc.id;
                if (docId.toLowerCase().includes(searchTerm) && docId !== currentUser.username && !selectedGroupMembers.includes(docId)) {
                    count++;
                    const div = document.createElement('div');
                    div.className = 'p-2 hover:bg-green-50 cursor-pointer border-b border-gray-100 text-sm';
                    div.textContent = docId;
                    div.onclick = () => {
                        selectedGroupMembers.push(docId);
                        renderSelectedMembers();
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

        const allMembers = [...selectedGroupMembers, currentUser.username];

        try {
            const groupRef = await db.collection("groups").add({
                name: groupName,
                members: allMembers,
                createdBy: currentUser.username,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            await db.collection("chat_previews").doc(groupRef.id).set({
                groupName: groupName,
                isGroup: true,
                groupId: groupRef.id,
                participants: allMembers,
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
}