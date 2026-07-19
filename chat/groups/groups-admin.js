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
            
            // ✨ CONTROLLO ADMIN BASATO SULL'UID SICURO
            const isAdmin = data.createdBy === currentUid;
            
            const adminName = data.memberNames && data.memberNames[data.createdBy] ? data.memberNames[data.createdBy] : "Utente sconosciuto";

            title.textContent = data.name;
            adminLabel.textContent = `Gruppo creato da: @${adminName}`;
            list.innerHTML = '';
            
            if (isAdmin) {
                btnEditName.classList.remove('hidden');
                adminAddSection.classList.remove('hidden');
                
                btnEditName.onclick = () => window.editGroupName(groupId, data.name);
                btnAddMember.onclick = () => window.addGroupMember(groupId, data);
            } else {
                btnEditName.classList.add('hidden');
                adminAddSection.classList.add('hidden');
            }

            data.members.forEach(memberUid => {
                const isMe = memberUid === currentUid;
                const isMemberAdmin = memberUid === data.createdBy;
                const memberName = data.memberNames && data.memberNames[memberUid] ? data.memberNames[memberUid] : memberUid;
                
                const div = document.createElement('div');
                div.className = 'flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200';
                
                let kickButton = '';
                if (isAdmin && !isMe) {
                    kickButton = `
                        <button onclick="window.kickGroupMember('${groupId}', '${memberUid}', '${window.Spottio.escape(memberName)}', ${JSON.stringify(data.members)})" 
                                class="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded border border-red-200 font-bold transition-colors">
                            Espelli
                        </button>
                    `;
                }

                div.innerHTML = `
                    <div class="flex flex-col">
                        <span class="text-sm font-medium text-gray-800">${window.Spottio.escape(memberName)} ${isMe ? '<span class="text-xs text-blue-500 ml-1">(Tu)</span>' : ''}</span>
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

window.kickGroupMember = async function(groupId, uidToKick, nameToKick, currentMembers) {
    if (!confirm(`Sei sicuro di voler espellere @${nameToKick} da questo gruppo?`)) return;
    
    const updatedMembers = currentMembers.filter(m => m !== uidToKick);
    try {
        await db.collection("groups").doc(groupId).update({ members: updatedMembers });
        await db.collection("chat_previews").doc(groupId).update({ participants: updatedMembers });
        
        await db.collection("groups").doc(groupId).collection("chats").add({
            groupId: groupId,
            text: `@${nameToKick} è stato rimosso dal gruppo dall'amministratore.`,
            sender: "Sistema",
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        window.openGroupInfo(groupId);
    } catch(e) { console.error("Errore durante l'espulsione:", e); }
}

window.addGroupMember = async function(groupId, groupData) {
    const inputElement = document.getElementById('input-add-group-member');
    const usernameToAdd = inputElement.value.trim();
    
    if (!usernameToAdd) return alert("Inserisci un nome utente valido.");
    
    try {
        const snapshot = await db.collection("users").where("username", "==", usernameToAdd).get();
        if (snapshot.empty) {
            return alert("L'utente inserito non esiste nell'applicazione.");
        }
        
        const uidToAdd = snapshot.docs[0].id;
        if (groupData.members.includes(uidToAdd)) return alert("Questo utente è già presente nel gruppo.");
        
        const updatedMembers = [...groupData.members, uidToAdd];
        
        await db.collection("groups").doc(groupId).update({ 
            members: updatedMembers,
            [`memberNames.${uidToAdd}`]: usernameToAdd
        });
        
        await db.collection("chat_previews").doc(groupId).update({ participants: updatedMembers });
        
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
    
    // ✨ Aggiornamento filtro array usando l'UID sicuro
    const updatedMembers = currentMembers.filter(m => m !== currentUid);
    
    try {
        await db.collection("groups").doc(groupId).update({ members: updatedMembers });
        await db.collection("chat_previews").doc(groupId).update({ participants: updatedMembers });
        
        await db.collection("groups").doc(groupId).collection("chats").add({
            groupId: groupId,
            text: `${currentUsername} ha abbandonato il gruppo.`,
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