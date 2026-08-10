// carica-post-profilo.js - Centralizzato usando ui-renderer.js

async function loadUserPosts() {
    const dbInstance = window.db || firebase.firestore();
    // Usa 'posts-container' per compatibilità con window.renderPost
    const container = document.getElementById('posts-container'); 
    if (!container) return;

    const tx = (key, defaultTesto) => window.t ? window.t(key) : defaultTesto;
    container.innerHTML = `<p class="text-gray-500 italic col-span-full text-center py-6 animate-pulse">${tx('loadingPosts', 'Caricamento dei tuoi post...')}</p>`;

    const currentUid = window.Spottio.getCurrentUid();
    const currentUsername = localStorage.getItem('currentUser') || "Guest";
    const isAdmin = localStorage.getItem('isAdmin') === 'true';

    if (!currentUid) {
        container.innerHTML = `<p class="text-red-500 col-span-full text-center">${tx('userNotFound', 'Errore: utente non identificato per il caricamento post.')}</p>`;
        return;
    }

    try {
        const postsRef = dbInstance.collection('posts')
                                   .where('user', '==', currentUid)
                                   .orderBy('timestamp', 'desc');

        const snapshot = await postsRef.get();
        
        const numberElement = document.getElementById('post-count-number');
        if (numberElement) {
            numberElement.textContent = snapshot.size;
        }

        container.innerHTML = ''; // Pulisce il loader

        if (snapshot.empty) {
            container.innerHTML = `<p class="text-gray-400 italic col-span-full text-center py-4">${tx('noPostsFound', "Nessun post trovato per l'utente")} <b>${window.Spottio.escape(currentUsername)}</b>.</p>`;
            return;
        }

        // Deleghiamo il rendering alla funzione centralizzata ui-renderer.js
        snapshot.forEach(doc => {
            const postId = doc.id;
            const post = doc.data();
            
            if (typeof window.renderPost === 'function') {
                window.renderPost(postId, post, currentUsername, isAdmin);
            } else {
                console.error("window.renderPost non è definito. Manca ui-renderer.js?");
            }
        });

    } catch (error) {
        console.error("❌ ERRORE CARICAMENTO POST PROFILO:", error);
        container.innerHTML = `<p class="text-red-500 col-span-full text-center">${tx('cannotLoadPosts', 'Impossibile caricare i post.')}</p>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const checkDbInterval = setInterval(() => {
        if ((window.db || (typeof firebase !== 'undefined' && firebase.firestore)) && localStorage.getItem('currentUid')) {
            clearInterval(checkDbInterval);
            loadUserPosts();
        }
    }, 100);
});