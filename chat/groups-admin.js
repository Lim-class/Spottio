// ==========================================
// FILE: groups-admin.js
// Gestione Avanzata (Info, Ruoli, Modifica, Espulsione)
// ==========================================

window.openGroupInfo = async function(groupId) {
    const modal = document.getElementById('group-info-modal');
    const list = document.getElementById('group-participants-list');
    const title = document.getElementById('group-info-title');
    const btnLeave = document.getElementById('btn-leave-group');
    const adminLabel = document.getElementById('group-info-admin-label');
    
    const btnEditName = document.getElementById('btn-edit-group-name');
    const adminAddSection = document.getElementById('admin-add-member-section');
    const btnAddMember = document.getElementById('btn-add-group-member');

    try {
        const groupDoc = await db.collection("groups").doc(groupId).get();
        if (groupDoc.exists) {
            const data = groupDoc.data();
            const isAdmin = data.createdBy === currentUser.username;

            title.textContent = data.name;
            adminLabel.textContent = `Gruppo creato da: @${data.createdBy}`;
            list.innerHTML = '';
            
            if (isAdmin) {
                btnEditName.classList.remove('hidden');
                adminAddSection.classList.remove('hidden');
                
                btnEditName.onclick = () => window.editGroupName(groupId, data.name);
                btnAddMember.onclick = () => window.addGroupMember(groupId, data.members);
            } else {
                btnEditName.classList.add('hidden');
                adminAddSection.classList.add('hidden');
            }

            data.members.forEach(member => {
                const isMe = member === currentUser.username;
                const isMemberAdmin = member === data.createdBy;
                
                const div = document.createElement('div');
                div.className = 'flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200';
                
                let kickButton = '';
                if (isAdmin && !isMe) {
                    kickButton = `
                        <button onclick="window.kickGroupMember('${groupId}', '${member}', ${JSON.stringify(data.members)})" 
                                class="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded border border-red-200 font-bold transition-colors">
                            Espelli
                        </button>
                    `;
                }

                div.innerHTML = `
                    <div class="flex flex-col">
                        <span class="text-sm font-medium text-gray-800">${member} ${isMe ? '<span class="text-xs text-blue-500 ml-1">(Tu)</span>' : ''}</span>
                        ${isMemberAdmin ? '<span class="text-[10px] text-green-600 font-bold">Amministratore</span>' : ''}
                    </div>
                    ${kickButton}
                `;
                list.appendChild(div);
            });

            btnLeave.onclick = () => window.leaveGroup(groupId, data.members);

            modal.classList.remove('hidden');
        }
    } catch(e) { console.error("Errore recupero info gruppo:", e); }
}

window.editGroupName = async function(groupId, currentName) {
    const newName = prompt("Modifica il nome del gruppo:", currentName);
    if (!newName || newName.trim() === "" || newName.trim() === currentName) return;
    
    const trimmedName = newName.trim();
    try {
        await db.collection("groups").doc(groupId).update({ name: trimmedName });
        await db.collection("chat_previews").doc(groupId).update({ groupName: trimmedName });
        
        // --- NUOVO RIFERIMENTO SUBCOLLECTION ---
        await db.collection("groups").doc(groupId).collection("chats").add({
            groupId: groupId,
            text: `L'amministratore ha cambiato il nome del gruppo in "${trimmedName}"`,
            sender: "Sistema",
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        if (activeChat && activeChat.id === groupId) {
            document.getElementById('chat-recipient-name').textContent = trimmedName;
            activeChat.name = trimmedName;
        }
        
        window.openGroupInfo(groupId);
    } catch(e) { console.error("Errore modifica nome gruppo:", e); }
}

window.kickGroupMember = async function(groupId, memberToKick, currentMembers) {
    if (!confirm(`Sei sicuro di voler espellere @${memberToKick} da questo gruppo?`)) return;
    
    const updatedMembers = currentMembers.filter(m => m !== memberToKick);
    try {
        await db.collection("groups").doc(groupId).update({ members: updatedMembers });
        await db.collection("chat_previews").doc(groupId).update({ participants: updatedMembers });
        
        // --- NUOVO RIFERIMENTO SUBCOLLECTION ---
        await db.collection("groups").doc(groupId).collection("chats").add({
            groupId: groupId,
            text: `@${memberToKick} è stato rimosso dal gruppo dall'amministratore.`,
            sender: "Sistema",
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        window.openGroupInfo(groupId);
    } catch(e) { console.error("Errore durante l'espulsione:", e); }
}

window.addGroupMember = async function(groupId, currentMembers) {
    const inputElement = document.getElementById('input-add-group-member');
    const usernameToAdd = inputElement.value.trim();
    
    if (!usernameToAdd) return alert("Inserisci un nome utente valido.");
    if (currentMembers.includes(usernameToAdd)) return alert("Questo utente è già presente nel gruppo.");
    
    try {
        const userCheck = await db.collection("users").doc(usernameToAdd).get();
        if (!userCheck.exists) {
            return alert("L'utente inserito non esiste nell'applicazione.");
        }
        
        const updatedMembers = [...currentMembers, usernameToAdd];
        
        await db.collection("groups").doc(groupId).update({ members: updatedMembers });
        await db.collection("chat_previews").doc(groupId).update({ participants: updatedMembers });
        
        // --- NUOVO RIFERIMENTO SUBCOLLECTION ---
        await db.collection("groups").doc(groupId).collection("chats").add({
            groupId: groupId,
            text: `L'amministratore ha aggiunto @${usernameToAdd} al gruppo.`,
            sender: "Sistema",
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        inputElement.value = ''; 
        window.openGroupInfo(groupId); 
    } catch(e) { console.error("Errore inserimento nuovo membro:", e); }
}

window.leaveGroup = async function(groupId, currentMembers) {
    if(!confirm("Sei sicuro di voler abbandonare questo gruppo?")) return;
    
    const updatedMembers = currentMembers.filter(m => m !== currentUser.username);
    
    try {
        await db.collection("groups").doc(groupId).update({ members: updatedMembers });
        await db.collection("chat_previews").doc(groupId).update({ participants: updatedMembers });
        
        // --- NUOVO RIFERIMENTO SUBCOLLECTION ---
        await db.collection("groups").doc(groupId).collection("chats").add({
            groupId: groupId,
            text: `${currentUser.username} ha abbandonato il gruppo.`,
            sender: "Sistema",
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        document.getElementById('group-info-modal').classList.add('hidden');
        document.getElementById('chat-header').classList.add('hidden');
        document.getElementById('message-form').classList.add('hidden');
        document.getElementById('no-chat-message').classList.remove('hidden');
        document.getElementById('messages-container').innerHTML = '';
        activeChat = { id: null, isGroup: false, name: '', members: [] };

        if (window.innerWidth < 1024) {
            document.getElementById('chat-list-container').classList.remove('hidden-mobile');
            document.getElementById('chat-content-container').classList.add('hidden-mobile');
        }

    } catch(e) { console.error("Errore nell'abbandono del gruppo:", e); }
}