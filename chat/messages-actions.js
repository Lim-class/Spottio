// ==========================================
// FILE: messages-actions.js
// Modifica ed Eliminazione In-linea dei messaggi
// ==========================================

/**
 * Inizializza l'interfaccia di modifica scambiando il testo con la textarea
 */
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

/**
 * Annulla l'operazione di modifica e ripristina la visualizzazione del messaggio originale
 */
window.inlineEditCancel = function(docId) {
    const textContainer = document.getElementById(`text-container-${docId}`);
    const editorContainer = document.getElementById(`editor-container-${docId}`);
    
    if (textContainer && editorContainer) {
        editorContainer.classList.add('hidden');
        textContainer.classList.remove('hidden');
    }
};

/**
 * Salva il nuovo testo del messaggio modificato direttamente su Firestore
 * Forza la scrittura dei campi per garantire la sincronizzazione in tempo reale
 */
window.inlineEditSave = async function(docId) {
    const textarea = document.getElementById(`input-${docId}`);
    if (!textarea) return;
    
    const newText = textarea.value.trim();
    if (newText === "") return;

    try {
        console.log(`Tentativo di modifica del documento: ${docId}`);
        
        // --- NUOVA LOGICA DI RIFERIMENTO ---
        let docRef;
        if (activeChat.isGroup) {
            docRef = db.collection("groups").doc(activeChat.id).collection("chats").doc(docId);
        } else {
            // Ricalcoliamo il conversation ID per la chat privata
            const conversationId = [currentUser.username, activeChat.id].sort().join('_');
            // Puntiamo al percorso nidificato corretto
            docRef = db.collection("chats").doc(conversationId).collection("messages").doc(docId);
        }
        
        // Aggiornamento atomico su Firestore
        await docRef.update({
            text: newText,
            edited: true
        });
        
        console.log("Database aggiornato con successo: il messaggio è ora contrassegnato come modificato.");
        
        // Chiude l'editor visivamente
        window.inlineEditCancel(docId);
        
    } catch(e) { 
        console.error("Errore critico durante l'aggiornamento su Firestore:", e); 
        alert("Errore nel salvataggio. Verifica la connessione o i permessi di scrittura.");
    }
};

/**
 * Gestisce l'eliminazione logica del messaggio per tutti gli utenti
 */
window.inlineDeleteInit = async function(docId) {
    if(confirm("Vuoi eliminare questo messaggio per tutti?")) {
        try {
            // --- NUOVA LOGICA DI RIFERIMENTO ---
            let docRef;
            if (activeChat.isGroup) {
                docRef = db.collection("groups").doc(activeChat.id).collection("chats").doc(docId);
            } else {
                // Ricalcoliamo il conversation ID per la chat privata
                const conversationId = [currentUser.username, activeChat.id].sort().join('_');
                // Puntiamo al percorso nidificato corretto
                docRef = db.collection("chats").doc(conversationId).collection("messages").doc(docId);
            }

            await docRef.update({
                deleted: true,
                text: "Questo messaggio è stato eliminato"
            });
            console.log("Messaggio eliminato con successo nel database.");
        } catch(e) { console.error("Errore nell'eliminazione:", e); }
    }
};

// Mappatura delle vecchie funzioni per mantenere la piena compatibilità con l'applicazione
window.editMessage = window.inlineEditInit;
window.deleteMessage = window.inlineDeleteInit;