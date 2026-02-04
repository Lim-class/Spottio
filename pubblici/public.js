// public.js - Gestione ESCLUSIVA visualizzazione e interazione (pubblici.html)

// --- 1. FUNZIONI DI VISUALIZZAZIONE ---

function listenToFirestorePosts() {
    const postsContainer = document.getElementById('posts-container');
    // Se non esiste il container (es. siamo su un'altra pagina), non fare nulla
    if (!postsContainer) return;

    if (!window.db) {
        setTimeout(listenToFirestorePosts, 500);
        return;
    }

    const currentUser = localStorage.getItem('currentUser') || "Guest";
    const isAdmin = currentUser === 'admin';

    window.db.collection("posts").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
        postsContainer.innerHTML = ''; 

        if (snapshot.empty) {
             postsContainer.innerHTML = '<p class="text-center text-gray-500 mt-10">Nessun post disponibile.</p>';
             return;
        }

        snapshot.forEach((doc) => {
            const postData = doc.data();
            const postId = doc.id;
            renderPost(postId, postData, currentUser, isAdmin);
        });
    }, (error) => {
        console.error("Errore Firestore:", error);
        postsContainer.innerHTML = `<p class="text-center text-red-500 mt-10">Errore caricamento: ${error.message}</p>`;
    });
}

function renderPost(postId, post, currentUser, isAdmin) {
    const postsContainer = document.getElementById('posts-container');
    const postElement = document.createElement('div');
    postElement.className = 'bg-white p-6 rounded-2xl shadow-md post mb-6 border border-gray-100 transition duration-300 hover:shadow-lg';

    // Nome utente
    const authorName = (post.user && post.user !== "") ? post.user : 
                       (post.author && post.author !== "") ? post.author : 
                       "Utente Anonimo";
    
    const authorInitial = authorName[0] ? authorName[0].toUpperCase() : '?';

    // Foto profilo
    const avatarHtml = post.userPfUri 
        ? `<img src="${post.userPfUri}" class="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-200" alt="${authorName}">`
        : `<div class="w-10 h-10 bg-gradient-to-tr from-blue-500 to-blue-300 rounded-full flex items-center justify-center text-white font-bold shadow-sm">${authorInitial}</div>`;

    // Data
    let dateDisplay = "Data non disponibile";
    if (post.timestamp) {
        const dateObj = typeof post.timestamp === 'number' ? new Date(post.timestamp) : post.timestamp.toDate();
        dateDisplay = dateObj.toLocaleString();
    }

    // Media (Immagini/Video)
    let mediaHtml = '';
    if (post.mediaUri) {
        const isVideoContent = (post.video !== undefined) ? post.video : post.isVideo;

        if (isVideoContent) {
            mediaHtml = `<video src="${post.mediaUri}" controls class="w-full h-auto rounded-lg mb-4 bg-black max-h-96 object-contain"></video>`;
        } else {
            mediaHtml = `<img src="${post.mediaUri}" class="w-full h-auto rounded-lg mb-4 shadow-sm max-h-96 object-cover cursor-pointer" onclick="window.open(this.src)">`;
        }
    }

    // Like
    const likes = post.likes || [];
    const hasLiked = likes.includes(currentUser);
    const likeColor = hasLiked ? 'text-red-500' : 'text-gray-500';
    const likeIconFill = hasLiked ? 'currentColor' : 'none';

    // Commenti
    const comments = post.comments || [];
    let commentsHtml = comments.map(c => `
        <div class="bg-gray-50 p-3 rounded-xl mb-2 text-sm border border-gray-200">
            <div class="flex justify-between items-start mb-1">
                <span class="font-bold text-blue-600">${c.user || c.author || "Anonimo"}</span>
                <span class="text-[10px] text-gray-400">${c.formattedDate || ""}</span>
            </div>
            <p class="text-gray-700 leading-snug">${c.text}</p>
        </div>
    `).join('');

    // Bottone Elimina
    let deleteBtn = '';
    const postOwner = post.user || post.author; 
    if (currentUser === postOwner || isAdmin) {
        deleteBtn = `<button onclick="window.confirmDeletePost('${postId}')" class="text-red-400 hover:text-red-600 transition p-2 rounded-full hover:bg-red-50" title="Elimina post">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>`;
    }

    // HTML Post
    postElement.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
                ${avatarHtml}
                <div class="ml-3">
                    <span class="font-semibold text-gray-800">${authorName}</span>
                    <p class="text-xs text-gray-400">${dateDisplay}</p>
                </div>
            </div>
            <div class="flex items-center">${deleteBtn}</div>
        </div>
        
        <p class="text-gray-700 mb-4 whitespace-pre-wrap leading-relaxed">${post.text}</p>
        
        ${mediaHtml}
        
        <div class="flex items-center space-x-6 border-t py-3 mt-4">
            <button onclick="toggleLike('${postId}')" class="flex items-center space-x-2 ${likeColor} transition hover:scale-105">
                <svg class="w-6 h-6" fill="${likeIconFill}" stroke="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                <span>${likes.length}</span>
            </button>
            <button onclick="toggleComments('${postId}')" class="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition hover:scale-105">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                <span>${comments.length}</span>
            </button>
        </div>
        
        <div id="comment-section-${postId}" style="display: none;" class="border-t pt-4 mt-2 animate-fade-in">
            <div id="comments-list-${postId}" class="max-h-60 overflow-y-auto custom-scrollbar mb-3 pr-1">
                ${commentsHtml || '<p class="text-xs italic text-gray-400">Nessun commento.</p>'}
            </div>
            <div class="flex mt-2 bg-gray-100 rounded-xl p-1 items-center">
                <input type="text" id="comment-input-${postId}" placeholder="Scrivi un commento..." class="flex-grow bg-transparent border-none p-2 text-sm outline-none placeholder-gray-500 text-gray-800">
                <button onclick="addComment('${postId}')" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm">Invia</button>
            </div>
        </div>
    `;
    postsContainer.appendChild(postElement);
}

// --- 2. FUNZIONI DI INTERAZIONE ---

window.addComment = function(postId) {
    const currentUser = localStorage.getItem('currentUser') || "Guest";
    const inputField = document.getElementById(`comment-input-${postId}`);
    
    if (!inputField || !inputField.value.trim()) return;

    const now = new Date();
    const formattedDateString = now.toLocaleString('it-IT', { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
    });

    const newComment = {
        user: currentUser,
        text: inputField.value.trim(),
        timestamp: now.getTime(),
        formattedDate: formattedDateString
    };

    window.db.collection("posts").doc(postId).update({
        comments: firebase.firestore.FieldValue.arrayUnion(newComment)
    }).then(() => { 
        inputField.value = ''; 
    }).catch((error) => {
        console.error("Errore commento:", error);
        alert("Impossibile inviare il commento.");
    });
};

window.toggleComments = function(postId) {
    const section = document.getElementById(`comment-section-${postId}`);
    if (section) {
        section.style.display = (section.style.display === "block") ? "none" : "block";
    }
};

window.toggleLike = function(postId) {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser || currentUser === "null") return alert("Devi accedere per mettere like!");

    const postRef = window.db.collection("posts").doc(postId);
    
    postRef.get().then((doc) => {
        if (!doc.exists) return;
        const likes = doc.data().likes || [];
        
        if (likes.includes(currentUser)) {
            postRef.update({ likes: firebase.firestore.FieldValue.arrayRemove(currentUser) });
        } else {
            postRef.update({ likes: firebase.firestore.FieldValue.arrayUnion(currentUser) });
        }
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
             window.db.collection("posts").doc(postId).delete()
                 .then(() => modal.classList.add('hidden'))
                 .catch((err) => alert("Errore eliminazione: " + err.message));
        });
        
        const cancelBtn = document.getElementById('cancel-delete');
        if(cancelBtn) cancelBtn.onclick = () => modal.classList.add('hidden');
        
    } else if (confirm("Sei sicuro di voler eliminare questo post?")) {
        window.db.collection("posts").doc(postId).delete();
    }
};

// --- 3. INIZIALIZZAZIONE ---
document.addEventListener('DOMContentLoaded', listenToFirestorePosts);