// public.js - Gestione CARICAMENTO INFINITO e INTERAZIONI

let lastVisiblePost = null; 
let isLoading = false;      
const POSTS_PER_PAGE = 10; // Post per volta caricati
let observer; // Osservatore per lo scroll infinito

// --- 1. FUNZIONI DI VISUALIZZAZIONE ---

async function loadInitialPosts() {
    const postsContainer = document.getElementById('posts-container');
    if (!postsContainer || !window.db) return;

    postsContainer.innerHTML = ''; 
    lastVisiblePost = null;
    
    // Carica i primi post
    await fetchPosts();
    
    // Inizializza l'osservatore per il caricamento automatico
    setupInfiniteScroll();
}

async function fetchPosts() {
    if (isLoading) return;
    isLoading = true;

    const postsContainer = document.getElementById('posts-container');
    const currentUser = localStorage.getItem('currentUser') || "Guest";
    const isAdmin = currentUser === 'admin';

    try {
        let query = window.db.collection("posts")
            .orderBy("timestamp", "desc")
            .limit(POSTS_PER_PAGE);

        if (lastVisiblePost) {
            query = query.startAfter(lastVisiblePost);
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
            if (!lastVisiblePost) {
                postsContainer.innerHTML = '<p class="text-center text-gray-500 mt-10">Nessun post disponibile.</p>';
            }
            // Se non ci sono più post, smettiamo di osservare il fondo
            if (observer) observer.disconnect(); // Gestione Fine Post: Quando Firestore restituisce un risultato vuoto, l'osservatore viene scollegato (observer.disconnect()) per evitare chiamate inutili al database.
            isLoading = false;
            return;
        }

        lastVisiblePost = snapshot.docs[snapshot.docs.length - 1];

        snapshot.forEach((doc) => {
            renderPost(doc.id, doc.data(), currentUser, isAdmin);
        });

    } catch (error) {
        console.error("Errore caricamento post:", error);
    } finally {
        isLoading = false;
    }
}

// Nuova funzione per gestire lo scroll automatico
function setupInfiniteScroll() {
    // Rimuoviamo eventuali sentinel precedenti
    const existingSentinel = document.getElementById('infinite-scroll-sentinel');
    if (existingSentinel) existingSentinel.remove();

    // Creiamo un elemento "sentinella" alla fine del container
    const sentinel = document.createElement('div');
    sentinel.id = 'infinite-scroll-sentinel';
    sentinel.className = 'h-10 w-full flex justify-center items-center';
    sentinel.innerHTML = '<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>';
    
    document.getElementById('posts-container').after(sentinel);

    // Configuriamo l'observer
    observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isLoading) {
            fetchPosts();
        }
    }, {
        root: null, // usa il viewport
        rootMargin: '50px', // carica i post quando mancano 50px alla fine
        threshold: 0.1
    });

    observer.observe(sentinel);
}

function renderPost(postId, post, currentUser, isAdmin) {
    const postsContainer = document.getElementById('posts-container');
    const postElement = document.createElement('div');
    postElement.id = `post-${postId}`;
    postElement.className = 'bg-white p-6 rounded-2xl shadow-md post mb-6 border border-gray-100 transition duration-300 hover:shadow-lg w-full';

    const authorName = (post.user && post.user !== "") ? post.user : 
                       (post.author && post.author !== "") ? post.author : 
                       "Utente Anonimo";
    
    const authorInitial = authorName[0] ? authorName[0].toUpperCase() : '?';

    const avatarHtml = post.userPfUri 
        ? `<img src="${post.userPfUri}" class="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-200" alt="${authorName}">`
        : `<div class="w-10 h-10 bg-gradient-to-tr from-blue-500 to-blue-300 rounded-full flex items-center justify-center text-white font-bold shadow-sm">${authorInitial}</div>`;

    let dateDisplay = "Data non disponibile";
    if (post.timestamp) {
        const dateObj = typeof post.timestamp === 'number' ? new Date(post.timestamp) : post.timestamp.toDate();
        dateDisplay = dateObj.toLocaleString('it-IT');
    }

    let mediaHtml = '';
    if (post.mediaUri) {
        const isVideoContent = (post.video !== undefined) ? post.video : post.isVideo;
        if (isVideoContent) {
            mediaHtml = `<video src="${post.mediaUri}" controls class="w-full h-auto rounded-lg mb-4 bg-black max-h-96 object-contain"></video>`;
        } else {
            mediaHtml = `<img src="${post.mediaUri}" class="w-full h-auto rounded-lg mb-4 shadow-sm max-h-96 object-cover cursor-pointer" onclick="window.open(this.src)">`;
        }
    }

    const likes = post.likes || [];
    const hasLiked = likes.includes(currentUser);
    const likeColor = hasLiked ? 'text-red-500' : 'text-gray-500';
    const likeIconFill = hasLiked ? 'currentColor' : 'none';

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

    let deleteBtn = '';
    const postOwner = post.user || post.author; 
    if (currentUser === postOwner || isAdmin) {
        deleteBtn = `<button onclick="window.confirmDeletePost('${postId}')" class="text-red-400 hover:text-red-600 transition p-2 rounded-full hover:bg-red-50" title="Elimina post">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>`;
    }

    const reportBtn = currentUser !== postOwner && currentUser !== "Guest" ? `
        <button onclick="reportPost('${postId}', '${authorName}', \`${post.text.replace(/`/g, "'")}\`)" class="text-gray-400 hover:text-yellow-600 transition p-2 rounded-full hover:bg-yellow-50" title="Segnala post">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.332 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </button>
    ` : '';

    postElement.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
                ${avatarHtml}
                <div class="ml-3">
                    <span class="font-semibold text-gray-800">${authorName}</span>
                    <p class="text-xs text-gray-400">${dateDisplay}</p>
                </div>
            </div>
            <div class="flex items-center">
                ${reportBtn}
                ${deleteBtn}
            </div>
        </div>
        
        <p class="text-gray-700 mb-4 whitespace-pre-wrap leading-relaxed">${post.text}</p>
        
        ${mediaHtml}
        
        <div class="flex items-center space-x-6 border-t py-3 mt-4">
            <button id="like-btn-${postId}" onclick="toggleLike('${postId}')" class="flex items-center space-x-2 ${likeColor} transition hover:scale-105">
                <svg id="like-icon-${postId}" class="w-6 h-6" fill="${likeIconFill}" stroke="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                <span id="like-count-${postId}">${likes.length}</span>
            </button>
            <button onclick="toggleComments('${postId}')" class="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition hover:scale-105">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                <span id="comment-count-${postId}">${comments.length}</span>
            </button>
        </div>
        
        <div id="comment-section-${postId}" style="display: none;" class="border-t pt-4 mt-2 animate-fade-in">
            <div id="comments-list-${postId}" class="max-h-60 overflow-y-auto custom-scrollbar mb-3 pr-1">
                ${commentsHtml || '<p id="no-comments-${postId}" class="text-xs italic text-gray-400">Nessun commento.</p>'}
            </div>
            <div class="flex mt-2 bg-gray-100 rounded-xl p-1 items-center">
                <input type="text" id="comment-input-${postId}" placeholder="Scrivi un commento..." class="flex-grow bg-transparent border-none p-2 text-sm outline-none placeholder-gray-500 text-gray-800">
                <button onclick="addComment('${postId}')" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm">Invia</button>
            </div>
        </div>
    `;
    postsContainer.appendChild(postElement);
}

// --- 2. FUNZIONI DI INTERAZIONE (Invariate) ---
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
             });
        });
        document.getElementById('cancel-delete').onclick = () => modal.classList.add('hidden');
    }
};

// --- 3. INIZIALIZZAZIONE ---
document.addEventListener('DOMContentLoaded', () => {
    const checkDb = setInterval(() => {
        if (window.db) {
            clearInterval(checkDb);
            loadInitialPosts();
        }
    }, 500);
});