// pubblici/algoritmoFeed/algorithm-interactions.js - Gestione LIKE e ALGORITMO PREFERENZE

window.toggleLike = function(postId) {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser || currentUser === "null" || currentUser === "Guest") {
        return alert("Devi accedere per mettere like!");
    }
    
    const postRef = window.db.collection("posts").doc(postId);
    const likeBtn = document.getElementById(`like-btn-${postId}`);
    const likeIcon = document.getElementById(`like-icon-${postId}`);
    const countSpan = document.getElementById(`like-count-${postId}`);
    
    if (!likeBtn || !likeIcon || !countSpan) return;

    postRef.get().then((doc) => {
        if (!doc.exists) return;
        
        const postData = doc.data();
        const likes = postData.likes || [];
        const hasLiked = likes.includes(currentUser);
        
        // RIMOZIONE DUPLICATO: Usa l'helper globale Spottio
        const postCategories = window.Spottio.getPostCategories(postData);
        
        if (hasLiked) {
            postRef.update({ likes: firebase.firestore.FieldValue.arrayRemove(currentUser) });
            if (window.FeedAlgorithm) postCategories.forEach(cat => window.FeedAlgorithm.updateScore(cat, -1));
            likeBtn.classList.replace('text-red-500', 'text-gray-500');
            likeIcon.setAttribute('fill', 'none');
            countSpan.textContent = Math.max(0, parseInt(countSpan.textContent || 0) - 1);
        } else {
            postRef.update({ likes: firebase.firestore.FieldValue.arrayUnion(currentUser) });
            if (window.FeedAlgorithm) postCategories.forEach(cat => window.FeedAlgorithm.updateScore(cat, 1));
            likeBtn.classList.replace('text-gray-500', 'text-red-500');
            likeIcon.setAttribute('fill', 'currentColor');
            countSpan.textContent = parseInt(countSpan.textContent || 0) + 1;
        }
    }).catch(error => {
        console.error("Errore nell'aggiornamento del like:", error);
    });
};

window.showLikesModal = async function(postId) {
    const modal = document.getElementById('likes-modal');
    const listContainer = document.getElementById('likes-modal-list');
    
    if (!modal || !listContainer) return;

    // RIMOZIONE DUPLICATO: Sfrutta Tailwind nativo
    listContainer.innerHTML = '<div class="flex justify-center py-6"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>';
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    try {
        const doc = await window.db.collection("posts").doc(postId).get();
        if (!doc.exists) {
            listContainer.innerHTML = '<p class="text-center text-gray-500">Post non trovato.</p>';
            return;
        }

        const likes = doc.data().likes || [];
        if (likes.length === 0) {
            listContainer.innerHTML = '<p class="text-center text-gray-500 py-4 text-sm">Nessun "mi piace" ancora.</p>';
            return;
        }

        listContainer.innerHTML = ''; 

        for (const userEntry of likes) {
            let username = userEntry;
            let avatarUri = "";
            let isVerified = false;

            if (userEntry.length > 10) {
                // RIMOZIONE DUPLICATO: Helper per recuperare utente
                const profile = await window.Spottio.getUserProfile(userEntry);
                username = profile.username;
                avatarUri = profile.userPfUri;
                isVerified = profile.isVerified;
            }

            const avatarHtml = window.Spottio.getAvatarHtml(avatarUri, username, "w-8 h-8");
            const verifiedBadge = window.Spottio.getVerifiedBadge(isVerified, "w-3.5 h-3.5 text-blue-500 inline-block ml-1");

            const userRow = document.createElement('div');
            userRow.className = 'flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-xl transition cursor-pointer';
            userRow.innerHTML = `
                ${avatarHtml}
                <div class="flex items-center">
                    <span class="font-semibold text-sm text-gray-800">${window.Spottio.escape(username)}</span>
                    ${verifiedBadge}
                </div>
            `;
            listContainer.appendChild(userRow);
        }

    } catch (err) {
        console.error("Errore caricamento lista likes:", err);
        listContainer.innerHTML = '<p class="text-center text-red-500 text-sm">Si è verificato un errore.</p>';
    }
};

window.closeLikesModal = function() {
    const modal = document.getElementById('likes-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};