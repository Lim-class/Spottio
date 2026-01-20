// public.js

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
        setTimeout(listenToFirestorePosts, 500);
        return;
    }

    const postsContainer = document.getElementById('posts-container');
    if (!postsContainer) return;

    // Recupera lo username come fa HomeFragment.java
    const currentUser = localStorage.getItem('currentUser') || "Guest";
    const isAdmin = currentUser === 'admin';

    // Query identica a HomeFragment.java
    postsCollection.orderBy("timestamp", "desc").onSnapshot((snapshot) => {
        postsContainer.innerHTML = ''; 

        snapshot.forEach((doc) => {
            const postData = doc.data();
            const postId = doc.id;
            renderPost(postId, postData, currentUser, isAdmin);
        });
    }, (error) => {
        console.error("Errore Firestore:", error);
    });
}

function renderPost(postId, post, currentUser, isAdmin) {
    const postsContainer = document.getElementById('posts-container');
    const postElement = document.createElement('div');
    postElement.className = 'bg-white p-6 rounded-2xl shadow-md post mb-6';

    // Gestione della data (in Java usi long timestamp)
    let dateDisplay = "Data non disponibile";
    if (post.timestamp) {
        // Se il timestamp è un numero (come in Post.java) lo convertiamo
        const dateObj = typeof post.timestamp === 'number' ? new Date(post.timestamp) : post.timestamp.toDate();
        dateDisplay = dateObj.toLocaleString();
    }

    // Usiamo 'mediaUri' come definito in Post.java
    let mediaHtml = '';
    if (post.mediaUri) {
        if (post.isVideo) {
            mediaHtml = `<video src="${post.mediaUri}" controls class="w-full h-auto rounded-lg mb-4"></video>`;
        } else {
            mediaHtml = `<img src="${post.mediaUri}" class="w-full h-auto rounded-lg mb-4">`;
        }
    }

    // Logica Like (il campo si chiama 'likes' ed è una List)
    const likes = post.likes || [];
    const hasLiked = likes.includes(currentUser);
    const likeColor = hasLiked ? 'text-red-500' : 'text-gray-500';

    // Logica eliminazione (confronto con campo 'user')
    let deleteBtn = '';
    if (currentUser === post.user || isAdmin) {
        deleteBtn = `<button onclick="deletePost('${postId}')" class="text-red-500 hover:text-red-700 text-sm">Elimina</button>`;
    }

    postElement.innerHTML = `
        <div class="flex items-center mb-4">
            <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                ${post.user ? post.user[0].toUpperCase() : '?'}
            </div>
            <div class="ml-3">
                <span class="font-semibold text-gray-800">${post.user}</span>
                <p class="text-xs text-gray-500">${dateDisplay}</p>
            </div>
        </div>
        <p class="text-gray-700 mb-4">${post.text}</p>
        ${mediaHtml}
        <div class="flex items-center justify-between border-t pt-4">
            <div class="flex items-center space-x-4">
                <button onclick="toggleLike('${postId}')" class="flex items-center space-x-1 ${likeColor}">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    <span>${likes.length}</span>
                </button>
                <span class="text-gray-500 text-sm">💬 ${post.comments ? post.comments.length : 0}</span>
                ${deleteBtn}
            </div>
        </div>
    `;
    postsContainer.appendChild(postElement);
}

// Funzione Like che aggiorna l'array 'likes'
function toggleLike(postId) {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return;

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

// Funzione Elimina
function deletePost(postId) {
    if (confirm("Eliminare definitivamente questo post?")) {
        postsCollection.doc(postId).delete();
    }
}

document.addEventListener('DOMContentLoaded', listenToFirestorePosts);
