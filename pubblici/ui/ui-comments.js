// ui-comments.js - Gestione COMMENTI basata esclusivamente su UID e Timestamp (Con Modifica Commenti)

window.addComment = async function(postId) {
    const currentUser = localStorage.getItem('currentUser') || "Guest";
    const currentUid = window.Spottio.getCurrentUid() || currentUser;
    const inputField = document.getElementById(`comment-input-${postId}`);
    const submitBtn = document.getElementById(`comment-btn-${postId}`);
    
    if (!inputField || !inputField.value.trim()) return;

    const textValue = inputField.value.trim();
    const now = new Date();
    
    const authorProfile = await window.Spottio.getUserProfile(currentUid);
    const displayUsername = authorProfile.username;

    const newComment = { 
        user: currentUid, 
        text: textValue, 
        timestamp: firebase.firestore.Timestamp.fromDate(now)
    };

    inputField.disabled = true;
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<div class="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>`;
    }

    window.db.collection("posts").doc(postId).update({
        comments: firebase.firestore.FieldValue.arrayUnion(newComment)
    }).then(() => { 
        if (currentUser !== "Guest" && window.FeedAlgorithm) {
            window.db.collection("posts").doc(postId).get().then((doc) => {
                if(doc.exists) {
                    const postData = doc.data();
                    const postCategories = window.Spottio.getPostCategories(postData);
                    postCategories.forEach(cat => window.FeedAlgorithm.updateScore(cat, 2));
                }
            });
        }

        // Ricarichiamo dinamicamente la sezione del post per applicare il nuovo rendering con pulsanti azione
        window.db.collection("posts").doc(postId).get().then(updatedDoc => {
            if (updatedDoc.exists) {
                const isAdmin = localStorage.getItem('isAdmin') === 'true';
                window.renderPost(postId, updatedDoc.data(), currentUser, isAdmin);
                // Mantiene aperta la sezione commenti
                const section = document.getElementById(`comment-section-${postId}`);
                if (section) section.style.display = "block";
            }
        });

        inputField.value = ''; 
    }).catch(error => {
        console.error("Errore nell'aggiunta del commento:", error);
        alert("Impossibile inviare il commento. Riprova.");
    }).finally(() => {
        inputField.disabled = false;
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = "Invia";
        }
        inputField.focus();
    });
};

// Funzione per abilitare l'inline editing di un commento
window.editComment = function(postId, commentIndex) {
    const textEl = document.getElementById(`comment-text-${postId}-${commentIndex}`);
    const editFormEl = document.getElementById(`comment-edit-form-${postId}-${commentIndex}`);
    
    if (textEl && editFormEl) {
        textEl.classList.add('hidden');
        editFormEl.classList.remove('hidden');
        editFormEl.classList.add('flex');
    }
};

window.cancelEditComment = function(postId, commentIndex) {
    const textEl = document.getElementById(`comment-text-${postId}-${commentIndex}`);
    const editFormEl = document.getElementById(`comment-edit-form-${postId}-${commentIndex}`);
    
    if (textEl && editFormEl) {
        textEl.classList.remove('hidden');
        editFormEl.classList.add('hidden');
        editFormEl.classList.remove('flex');
    }
};

// Salvataggio della modifica su Firestore
window.saveEditedComment = async function(postId, commentIndex) {
    const inputEl = document.getElementById(`comment-edit-input-${postId}-${commentIndex}`);
    if (!inputEl) return;
    
    const newText = inputEl.value.trim();
    if (!newText) {
        alert("Il commento non può essere vuoto.");
        return;
    }

    try {
        const postRef = window.db.collection("posts").doc(postId);
        const doc = await postRef.get();
        if (!doc.exists) return;

        const postData = doc.data();
        let comments = postData.comments || [];

        if (comments[commentIndex]) {
            comments[commentIndex].text = newText;
            
            await postRef.update({ comments: comments });

            // Aggiorna la UI del post
            const currentUser = localStorage.getItem('currentUser') || "Guest";
            const isAdmin = localStorage.getItem('isAdmin') === 'true';
            await window.renderPost(postId, (await postRef.get()).data(), currentUser, isAdmin);
            
            const section = document.getElementById(`comment-section-${postId}`);
            if (section) section.style.display = "block";
        }
    } catch (err) {
        console.error("Errore modifica commento:", err);
        alert("Impossibile salvare la modifica del commento.");
    }
};

window.toggleComments = function(postId) {
    const section = document.getElementById(`comment-section-${postId}`);
    if (section) section.style.display = (section.style.display === "block") ? "none" : "block";
};