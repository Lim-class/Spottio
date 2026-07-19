// ==========================================
// FILE: messages-actions.js
// Modifica ed Eliminazione In-linea dei messaggi
// ==========================================

window.inlineEditInit = function(docId, currentText) {
    const textContainer = document.getElementById(`text-container-${docId}`);
    const editorContainer = document.getElementById(`editor-container-${docId}`);
    const textarea = document.getElementById(`input-${docId}`);
    
    if (textContainer && editorContainer && textarea) {
        textContainer.classList.add('hidden');
        editorContainer.classList.remove('hidden');
        textarea.value = currentText;
        textarea.focus();
    }
};

window.inlineEditCancel = function(docId) {
    const textContainer = document.getElementById(`text-container-${docId}`);
    const editorContainer = document.getElementById(`editor-container-${docId}`);
    
    if (textContainer && editorContainer) {
        editorContainer.classList.add('hidden');
        textContainer.classList.remove('hidden');
    }
};

window.inlineEditSave = async function(docId) {
    const textarea = document.getElementById(`input-${docId}`);
    if (!textarea) return;
    
    const newText = textarea.value.trim();
    if (newText === "") return;

    try {
        let docRef;
        if (activeChat.isGroup) {
            docRef = db.collection("groups").doc(activeChat.id).collection("chats").doc(docId);
        } else {
            // MODIFICA: Usiamo il currentUid per recuperare l'id composto corretto
            const conversationId = window.Spottio.getConversationId(currentUid, activeChat.id);
            docRef = db.collection("chats").doc(conversationId).collection("messages").doc(docId);
        }
        
        await docRef.update({ text: newText, edited: true });
        window.inlineEditCancel(docId);
        
    } catch(e) { 
        console.error("Errore critico durante l'aggiornamento su Firestore:", e); 
        alert("Errore nel salvataggio. Verifica la connessione o i permessi di scrittura.");
    }
};

window.inlineDeleteInit = async function(docId) {
    if(confirm("Vuoi eliminare questo messaggio per tutti?")) {
        try {
            let docRef;
            if (activeChat.isGroup) {
                docRef = db.collection("groups").doc(activeChat.id).collection("chats").doc(docId);
            } else {
                // MODIFICA: Stessa logica di risoluzione UID
                const conversationId = [currentUid, activeChat.id].sort().join('_');
                docRef = db.collection("chats").doc(conversationId).collection("messages").doc(docId);
            }

            await docRef.update({ deleted: true, text: "Questo messaggio è stato eliminato" });
        } catch(e) { console.error("Errore nell'eliminazione:", e); }
    }
};

window.editMessage = window.inlineEditInit;
window.deleteMessage = window.inlineDeleteInit;