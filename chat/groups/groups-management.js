// ==========================================
// FILE: groups-management.js
// Amministrazione e Modifica Profilo Gruppo
// ==========================================

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
            text: window.Spottio.encryptMessage(`@${nameToKick} è stato rimosso dal gruppo dall'amministratore.`, groupId),
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