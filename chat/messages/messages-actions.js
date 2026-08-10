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
        let targetChatId = activeChat.id;

        if (activeChat.isGroup) {
            docRef = db.collection("groups").doc(activeChat.id).collection("chats").doc(docId);
        } else {
            targetChatId = window.Spottio.getConversationId(currentUid, activeChat.id);
            docRef = db.collection("chats").doc(targetChatId).collection("messages").doc(docId);
        }
        
        // 🔐 CIFRATURA DEL NUOVO TESTO
        const encryptedNewText = window.Spottio.encryptMessage(newText, targetChatId);

        await docRef.update({ text: encryptedNewText, edited: true });
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
            let targetChatId = activeChat.id;
            
            if (activeChat.isGroup) {
                docRef = db.collection("groups").doc(activeChat.id).collection("chats").doc(docId);
            } else {
                targetChatId = window.Spottio.getConversationId(currentUid, activeChat.id);
                docRef = db.collection("chats").doc(targetChatId).collection("messages").doc(docId);
            }

            // 🔐 CIFRATURA DEL MESSAGGIO DI SISTEMA DI ELIMINAZIONE
            const deletedSystemText = window.Spottio.encryptMessage("Questo messaggio è stato eliminato", targetChatId);

            await docRef.update({ deleted: true, text: deletedSystemText });
        } catch(e) { console.error("Errore nell'eliminazione:", e); }
    }
};

window.editMessage = window.inlineEditInit;
window.deleteMessage = window.inlineDeleteInit;