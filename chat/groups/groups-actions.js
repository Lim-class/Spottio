// ==========================================
// FILE: groups-actions.js
// Azioni Utente / Lifecycle della Chat del Gruppo
// ==========================================

window.leaveGroup = async function(groupId, currentMembers) {
    if(!confirm("Sei sicuro di voler abbandonare questo gruppo?")) return;
    
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