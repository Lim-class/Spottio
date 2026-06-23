// pubblici/algorithm-interactions.js - Gestione LIKE e ALGORITMO PREFERENZE

window.toggleLike = function(postId) {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser || currentUser === "null" || currentUser === "Guest") {
        return alert("Devi accedere per mettere like!");
    }
    
    const postRef = window.db.collection("posts").doc(postId);
    const userRef = window.db.collection("users").doc(currentUser); 
    
    const likeBtn = document.getElementById(`like-btn-${postId}`);
    const likeIcon = document.getElementById(`like-icon-${postId}`);
    const countSpan = document.getElementById(`like-count-${postId}`);
    
    if (!likeBtn || !likeIcon || !countSpan) return;

    postRef.get().then((doc) => {
        if (!doc.exists) return;
        
        const postData = doc.data();
        const likes = postData.likes || [];
        const hasLiked = likes.includes(currentUser);
        
        const postCategory = postData.category || "Generale"; 
        
        if (hasLiked) {
            // Rimuovi Like
            postRef.update({ likes: firebase.firestore.FieldValue.arrayRemove(currentUser) });
            
            // Riduciamo il punteggio, ma aggiorniamo il timestamp per l'algoritmo
            userRef.set({
                preferences: {
                    [postCategory]: {
                        score: firebase.firestore.FieldValue.increment(-1),
                        lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
                    }
                }
            }, { merge: true }).catch(err => console.warn("Errore aggiornamento punti:", err));

            // Aggiornamento visivo UI
            likeBtn.classList.replace('text-red-500', 'text-gray-500');
            likeIcon.setAttribute('fill', 'none');
            countSpan.textContent = Math.max(0, parseInt(countSpan.textContent || 0) - 1);
            
        } else {
            // Aggiungi Like
            postRef.update({ likes: firebase.firestore.FieldValue.arrayUnion(currentUser) });
            
            // Aumentiamo il punteggio e registriamo l'interazione per l'algoritmo
            userRef.set({
                preferences: {
                    [postCategory]: {
                        score: firebase.firestore.FieldValue.increment(1),
                        lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
                    }
                }
            }, { merge: true }).catch(err => console.warn("Errore aggiornamento punti:", err));

            // Aggiornamento visivo UI
            likeBtn.classList.replace('text-gray-500', 'text-red-500');
            likeIcon.setAttribute('fill', 'currentColor');
            countSpan.textContent = parseInt(countSpan.textContent || 0) + 1;
        }
    }).catch(error => {
        console.error("Errore nell'aggiornamento del like:", error);
    });
};