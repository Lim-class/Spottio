// pubblici/ui-actions.js - Gestione COMMENTI, ELIMINAZIONI, MODIFICHE e UTILITY

// Funzione di sicurezza globale per evitare che i caratteri speciali nei commenti rompano l'HTML dinamico
window.escapeHTMLGlobal = function(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag]));
};

window.addComment = function(postId) {
    const currentUser = localStorage.getItem('currentUser') || "Guest";
    const inputField = document.getElementById(`comment-input-${postId}`);
    if (!inputField || !inputField.value.trim()) return;

    const now = new Date();
    const formattedDateString = now.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const textValue = inputField.value.trim();
    
    const newComment = { 
        user: currentUser, 
        text: textValue, 
        timestamp: firebase.firestore.Timestamp.fromDate(now),
        formattedDate: formattedDateString 
    };
    
    window.db.collection("posts").doc(postId).update({
        comments: firebase.firestore.FieldValue.arrayUnion(newComment)
    }).then(() => { 
        // --- NUOVA LOGICA ALGORITMO COMMENTI CENTRALIZZATA ---
        if (currentUser !== "Guest" && window.FeedAlgorithm) {
            window.db.collection("posts").doc(postId).get().then((doc) => {
                if(doc.exists) {
                    const category = doc.data().category || "Generale";
                    window.FeedAlgorithm.updateScore(category, 2); // Il commento vale 2 punti
                }
            });
        }
        // --- FINE LOGICA ALGORITMO ---

        const commentsList = document.getElementById(`comments-list-${postId}`);
        const noCommentsText = document.getElementById(`no-comments-${postId}`);
        if(noCommentsText) noCommentsText.remove();
        
        // Sanificazione sicura dei testi prima di fare l'append nell'HTML
        const safeText = window.escapeHTMLGlobal(newComment.text);
        const safeUser = window.escapeHTMLGlobal(newComment.user);
        
        const commentHtml = `
            <div class="bg-gray-50 p-3 rounded-xl mb-2 text-sm border border-gray-200">
                <div class="flex justify-between items-start mb-1">
                    <span class="font-bold text-blue-600">${safeUser}</span>
                    <span class="text-[10px] text-gray-400">${newComment.formattedDate}</span>
                </div>
                <p class="text-gray-700 leading-snug whitespace-pre-wrap break-words">${safeText}</p>
            </div>
        `;
        commentsList.insertAdjacentHTML('beforeend', commentHtml);
        
        const countSpan = document.getElementById(`comment-count-${postId}`);
        if (countSpan) {
            countSpan.textContent = parseInt(countSpan.textContent || 0) + 1;
        }
        inputField.value = ''; 
    }).catch(error => {
        console.error("Errore nell'aggiunta del commento:", error);
    });
};

window.toggleComments = function(postId) {
    const section = document.getElementById(`comment-section-${postId}`);
    if (section) {
        section.style.display = (section.style.display === "block") ? "none" : "block";
    }
};

window.confirmDeletePost = function(postId) {
    const modal = document.getElementById('confirmation-modal');
    
    if (!modal) {
        if(confirm("Sei sicuro di voler eliminare questo post?")) {
            window.db.collection("posts").doc(postId).delete().then(() => {
                const postEl = document.getElementById(`post-${postId}`);
                if(postEl) postEl.remove();
            }).catch(err => console.error(err));
        }
        return;
    }

    modal.classList.remove('hidden');
    const confirmBtn = document.getElementById('confirm-delete');
    const cancelBtn = document.getElementById('cancel-delete');
    
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    newConfirmBtn.addEventListener('click', () => {
         window.db.collection("posts").doc(postId).delete().then(() => {
             modal.classList.add('hidden');
             const postEl = document.getElementById(`post-${postId}`);
             if(postEl) postEl.remove();
         }).catch(error => {
             console.error("Errore nell'eliminazione del post:", error);
         });
    });
    
    if (cancelBtn) {
        cancelBtn.onclick = () => modal.classList.add('hidden');
    }
};

// --- GESTIONE MODIFICA POST ---

async function fetchCategoriesForEdit(selectedCategory) {
    const categorySelect = document.getElementById('edit-category');
    if (!categorySelect || !window.db) return;

    try {
        categorySelect.innerHTML = '<option value="Generale">Generale</option>';
        const snapshot = await window.db.collection('categories').get();
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.name && data.name !== "Generale") {
                const option = document.createElement('option');
                option.value = data.name;
                option.textContent = data.name;
                categorySelect.appendChild(option);
            }
        });
        categorySelect.value = selectedCategory || "Generale";
    } catch (error) {
        console.error("Errore caricamento categorie nel modale:", error);
    }
}

window.openEditModal = function(postId, text, category) {
    const modal = document.getElementById('edit-modal');
    if (!modal) return;

    document.getElementById('edit-post-id').value = postId;
    document.getElementById('edit-text').value = text;
    
    fetchCategoriesForEdit(category); 

    modal.classList.remove('hidden');
    modal.classList.add('flex'); 
};

window.closeEditModal = function() {
    const modal = document.getElementById('edit-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const cancelBtn = document.getElementById('cancel-edit');
    const saveBtn = document.getElementById('save-edit');

    if (cancelBtn) {
        cancelBtn.addEventListener('click', window.closeEditModal);
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const postId = document.getElementById('edit-post-id').value;
            const newText = document.getElementById('edit-text').value.trim();
            const newCategory = document.getElementById('edit-category').value;

            if (!newText) {
                alert("Il testo del post non può essere vuoto.");
                return;
            }

            saveBtn.disabled = true;
            saveBtn.innerText = "Salvataggio in corso...";

            try {
                await window.db.collection('posts').doc(postId).update({
                    text: newText,
                    category: newCategory
                });
                
                window.location.reload(); 
            } catch (error) {
                console.error("Errore durante la modifica del post:", error);
                alert("Impossibile salvare le modifiche. Riprova.");
            } finally {
                saveBtn.disabled = false;
                saveBtn.innerText = "Salva";
                window.closeEditModal();
            }
        });
    }
});