// public.js

// Usiamo var per evitare errori di doppia dichiarazione
var postsCollection;

function initializeFirestore() {
    if (window.db) {
        postsCollection = window.db.collection("posts");
        return true;
    }
    return false;
}

function listenToFirestorePosts() {
    if (!initializeFirestore()) {
        console.error("Database non ancora pronto, riprovo...");
        setTimeout(listenToFirestorePosts, 500);
        return;
    }

    const postsContainer = document.getElementById('posts-container');
    if (!postsContainer) return;

    const currentUser = localStorage.getItem('currentUser') || "Guest";
    const isAdmin = currentUser === 'admin';

    // Ascolto in tempo reale (come addSnapshotListener in Java)
    postsCollection.orderBy("timestamp", "desc").onSnapshot((snapshot) => {
        postsContainer.innerHTML = ''; 

        snapshot.forEach((doc) => {
            const postData = doc.data();
            const postId = doc.id;
            renderPost(postId, postData, currentUser, isAdmin);
        });
    }, (error) => {
        console.error("Errore nell'ascolto dei post:", error);
    });
}

function renderPost(postId, post, currentUser, isAdmin) {
    const postsContainer = document.getElementById('posts-container');
    const postElement = document.createElement('div');
    postElement.className = 'bg-white p-6 rounded-2xl shadow-md post mb-6';

    // --- GESTIONE SICURA DELLA DATA (Fix per l'errore toDate) ---
    let dateDisplay = "Inviando...";
    if (post.timestamp) {
        try {
            if (typeof post.timestamp.toDate === 'function') {
                dateDisplay = post.timestamp.toDate().toLocaleString();
            } else {
                dateDisplay = new Date(post.timestamp).toLocaleString();
            }
        } catch (e) {
            dateDisplay = "Data non valida";
        }
    }

    let mediaHtml = post.image ? `<img src="${post.image}" class="w-full h-auto rounded-lg mb-4">` : '';

    const likes = post.likes || [];
    const hasLiked = likes.includes(currentUser);
    const likeColor = hasLiked ? 'text-red-500' : 'text-gray-500';

    let deleteBtn = '';
    if (currentUser === post.username || isAdmin) {
        deleteBtn = `<button onclick="deletePost('${postId}')" class="text-red-500 hover:text-red-700 text-sm">Elimina</button>`;
    }

    postElement.innerHTML = `
        <div class="flex items-center mb-4">
            <img src="https://placehold.co/40x40/cccccc/000000?text=${post.username ? post.username[0].toUpperCase() : '?'}" class="w-10 h-10 rounded-full mr-3">
            <div>
                <span class="font-semibold text-gray-800">${post.username || 'Anonimo'}</span>
                <p class="text-xs text-gray-500">${dateDisplay}</p>
            </div>
        </div>
        <p class="text-gray-700 mb-4">${post.text || ''}</p>
        ${mediaHtml}
        <div class="flex items-center justify-between border-t pt-4">
            <div class="flex items-center space-x-4">
                <button onclick="toggleLike('${postId}')" class="flex items-center space-x-1 ${likeColor}">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    <span>${likes.length}</span>
                </button>
                ${deleteBtn}
            </div>
        </div>
    `;
    postsContainer.appendChild(postElement);
}

// Funzione per i Like
function toggleLike(postId) {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return alert("Esegui il login per mettere mi piace!");

    const postRef = postsCollection.doc(postId);
    postRef.get().then((doc) => {
        if (!doc.exists) return;
        let likes = doc.data().likes || [];
        if (likes.includes(currentUser)) {
            likes = likes.filter(u => u !== currentUser);
        } else {
            likes.push(currentUser);
        }
        postRef.update({ likes: likes });
    });
}

// Funzione per eliminare
function deletePost(postId) {
    if (confirm("Sei sicuro di voler eliminare questo post?")) {
        postsCollection.doc(postId).delete().catch(err => console.error("Errore: ", err));
    }
}

// Avvio
document.addEventListener('DOMContentLoaded', listenToFirestorePosts);
