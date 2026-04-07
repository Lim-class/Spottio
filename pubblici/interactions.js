// interactions.js - Gestione LIKE, COMMENTI e ELIMINAZIONI

window.addComment = function(postId) {
    const currentUser = localStorage.getItem('currentUser') || "Guest";
    const inputField = document.getElementById(`comment-input-${postId}`);
    if (!inputField || !inputField.value.trim()) return;

    const now = new Date();
    const formattedDateString = now.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const newComment = { user: currentUser, text: inputField.value.trim(), timestamp: now.getTime(), formattedDate: formattedDateString };

    window.db.collection("posts").doc(postId).update({
        comments: firebase.firestore.FieldValue.arrayUnion(newComment)
    }).then(() => { 
        const commentsList = document.getElementById(`comments-list-${postId}`);
        const noCommentsText = document.getElementById(`no-comments-${postId}`);
        if(noCommentsText) noCommentsText.remove();
        
        const commentHtml = `<div class="bg-gray-50 p-3 rounded-xl mb-2 text-sm border border-gray-200"><div class="flex justify-between items-start mb-1"><span class="font-bold text-blue-600">${newComment.user}</span><span class="text-[10px] text-gray-400">${newComment.formattedDate}</span></div><p class="text-gray-700 leading-snug">${newComment.text}</p></div>`;
        commentsList.insertAdjacentHTML('beforeend', commentHtml);
        
        const countSpan = document.getElementById(`comment-count-${postId}`);
        countSpan.textContent = parseInt(countSpan.textContent) + 1;
        inputField.value = ''; 
    }).catch(error => {
        console.error("Errore nell'aggiunta del commento:", error);
    });
};

window.toggleComments = function(postId) {
    const section = document.getElementById(`comment-section-${postId}`);
    if (section) section.style.display = (section.style.display === "block") ? "none" : "block";
};

window.toggleLike = function(postId) {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser || currentUser === "null" || currentUser === "Guest") return alert("Devi accedere per mettere like!");
    
    const postRef = window.db.collection("posts").doc(postId);
    const likeBtn = document.getElementById(`like-btn-${postId}`);
    const likeIcon = document.getElementById(`like-icon-${postId}`);
    const countSpan = document.getElementById(`like-count-${postId}`);
    
    postRef.get().then((doc) => {
        if (!doc.exists) return;
        const likes = doc.data().likes || [];
        const hasLiked = likes.includes(currentUser);
        
        if (hasLiked) {
            postRef.update({ likes: firebase.firestore.FieldValue.arrayRemove(currentUser) });
            likeBtn.classList.replace('text-red-500', 'text-gray-500');
            likeIcon.setAttribute('fill', 'none');
            countSpan.textContent = Math.max(0, parseInt(countSpan.textContent) - 1);
        } else {
            postRef.update({ likes: firebase.firestore.FieldValue.arrayUnion(currentUser) });
            likeBtn.classList.replace('text-gray-500', 'text-red-500');
            likeIcon.setAttribute('fill', 'currentColor');
            countSpan.textContent = parseInt(countSpan.textContent) + 1;
        }
    }).catch(error => {
        console.error("Errore nell'aggiornamento del like:", error);
    });
};

window.confirmDeletePost = function(postId) {
    const modal = document.getElementById('confirmation-modal');
    if (modal) {
        modal.classList.remove('hidden');
        const confirmBtn = document.getElementById('confirm-delete');
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
        
        document.getElementById('cancel-delete').onclick = () => modal.classList.add('hidden');
    }
};