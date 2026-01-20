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
    postElement.className = 'bg-white p-6 rounded-2xl shadow-md post mb-6 border border-gray-100';

    // Gestione della data
    let dateDisplay = "Data non disponibile";
    if (post.timestamp) {
        const dateObj = typeof post.timestamp === 'number' ? new Date(post.timestamp) : post.timestamp.toDate();
        dateDisplay = dateObj.toLocaleString();
    }

    // Gestione Media (Immagini/Video)
    let mediaHtml = '';
    if (post.mediaUri) {
        if (post.isVideo) {
            mediaHtml = `<video src="${post.mediaUri}" controls class="w-full h-auto rounded-lg mb-4"></video>`;
        } else {
            mediaHtml = `<img src="${post.mediaUri}" class="w-full h-auto rounded-lg mb-4 shadow-sm">`;
        }
    }

    // Logica Like
    const likes = post.likes || [];
    const hasLiked = likes.includes(currentUser);
    const likeColor = hasLiked ? 'text-red-500' : 'text-gray-500';

    // Logica Commenti
    const comments = post.comments || [];
    let commentsHtml = comments.map(c => `
        <div class="bg-gray-50 p-3 rounded-xl mb-2 text-sm border border-gray-200">
            <span class="font-bold text-blue-600">${c.user}:</span> 
            <span class="text-gray-700">${c.text}</span>
        </div>
    `).join('');

    // Bottone elimina (Solo se proprietario o admin)
    let deleteBtn = '';
    if (currentUser === post.user || isAdmin) {
        deleteBtn = `<button onclick="deletePost('${postId}')" class="text-red-400 hover:text-red-600 transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>`;
    }

    postElement.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
                <div class="w-10 h-10 bg-gradient-to-tr from-blue-500 to-blue-300 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                    ${post.user ? post.user[0].toUpperCase() : '?'}
                </div>
                <div class="ml-3">
                    <span class="font-semibold text-gray-800">${post.user}</span>
                    <p class="text-xs text-gray-400">${dateDisplay}</p>
                </div>
            </div>
            ${deleteBtn}
        </div>

        <p class="text-gray-700 mb-4 leading-relaxed">${post.text}</p>
        
        ${mediaHtml}

        <div class="flex items-center space-x-6 border-t border-b py-3 mb-4">
            <button onclick="toggleLike('${postId}')" class="flex items-center space-x-2 ${likeColor} hover:scale-110 transition-transform">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                <span class="font-medium">${likes.length}</span>
            </button>
            <div class="flex items-center space-x-2 text-gray-500">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                <span class="font-medium">${comments.length}</span>
            </div>
        </div>

        <div class="space-y-2">
            <div id="comments-list-${postId}" class="max-h-60 overflow-y-auto custom-scrollbar">
                ${commentsHtml}
            </div>
            
            <div class="flex mt-4 bg-gray-100 rounded-xl p-1">
                <input type="text" id="comment-input-${postId}" 
                       placeholder="Aggiungi un commento..." 
                       onkeypress="if(event.key === 'Enter') addComment('${postId}')"
                       class="flex-grow bg-transparent border-none p-2 text-sm focus:ring-0 outline-none text-gray-700">
                <button onclick="addComment('${postId}')" 
                        class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
                    Invia
                </button>
            </div>
        </div>
    `;
    postsContainer.appendChild(postElement);
}

// Funzione per aggiungere un commento
function addComment(postId) {
    const currentUser = localStorage.getItem('currentUser') || "Guest";
    const inputField = document.getElementById(`comment-input-${postId}`);
    const commentText = inputField.value.trim();

    if (!commentText) return;

    // Crea l'oggetto commento
    const newComment = {
        user: currentUser,
        text: commentText,
        timestamp: Date.now()
    };

    const postRef = window.db.collection("posts").doc(postId);

    // Aggiorna Firestore usando arrayUnion
    postRef.update({
        comments: firebase.firestore.FieldValue.arrayUnion(newComment)
    })
    .then(() => {
        inputField.value = ''; // Reset input
    })
    .catch((error) => {
        console.error("Errore salvataggio commento:", error);
        alert("Errore nell'invio del commento.");
    });
}

// Funzione Like
function toggleLike(postId) {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        alert("Devi aver effettuato l'accesso per mettere like.");
        return;
    }

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
        postsCollection.doc(postId).delete()
            .then(() => console.log("Post eliminato"))
            .catch(err => console.error("Errore eliminazione:", err));
    }
}

document.addEventListener('DOMContentLoaded', listenToFirestorePosts);
