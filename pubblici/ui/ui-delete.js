// ui-delete.js - Gestione ELIMINAZIONI

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