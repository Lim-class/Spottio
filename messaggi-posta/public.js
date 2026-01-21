// public.js - Gestione unificata per posta.html e pubblici.html

// --- FUNZIONI DI VISUALIZZAZIONE (per pubblici.html) ---

function listenToFirestorePosts() {
    // Controlliamo se siamo nella pagina che ha il container dei post
    const postsContainer = document.getElementById('posts-container');
    if (!postsContainer) return; // Se non c'è, siamo su posta.html o altrove, quindi usciamo.

    if (!window.db) {
        // Se Firebase non è ancora pronto, riproviamo tra poco
        setTimeout(listenToFirestorePosts, 500);
        return;
    }

    const currentUser = localStorage.getItem('currentUser') || "Guest";
    const isAdmin = currentUser === 'admin';

    // Ascolto in tempo reale
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

    // --- FIX 1: Gestione Nome Utente (Fallback se manca) ---
    // Se post.user esiste lo usa, altrimenti scrive "Utente Sconosciuto"
    const authorName = post.user || "Utente Sconosciuto";
    const authorInitial = authorName[0] ? authorName[0].toUpperCase() : '?';

    // Gestione Data
    let dateDisplay = "Data non disponibile";
    if (post.timestamp) {
        // Supporto sia per Timestamp di Firestore che per millisecondi numerici
        const dateObj = typeof post.timestamp === 'number' ? new Date(post.timestamp) : post.timestamp.toDate();
        dateDisplay = dateObj.toLocaleString();
    }

    // Gestione Media (Foto/Video)
    let mediaHtml = '';
    if (post.mediaUri) {
        if (post.isVideo) {
            mediaHtml = `<video src="${post.mediaUri}" controls class="w-full h-auto rounded-lg mb-4 bg-black max-h-96 object-contain"></video>`;
        } else {
            mediaHtml = `<img src="${post.mediaUri}" class="w-full h-auto rounded-lg mb-4 shadow-sm max-h-96 object-cover cursor-pointer" onclick="window.open(this.src)">`;
        }
    }

    // Gestione Like
    const likes = post.likes || [];
    const hasLiked = likes.includes(currentUser);
    const likeColor = hasLiked ? 'text-red-500' : 'text-gray-500';
    const likeIconFill = hasLiked ? 'currentColor' : 'none';

    // --- FIX 2: Gestione Commenti (Fallback anche qui) ---
    const comments = post.comments || [];
    let commentsHtml = comments.map(c => {
        const commentUser = c.user || "Anonimo"; // Protezione per i commenti
        return `
        <div class="bg-gray-50 p-3 rounded-xl mb-2 text-sm border border-gray-200">
            <span class="font-bold text-blue-600">${commentUser}:</span> 
            <span class="text-gray-700">${c.text}</span>
        </div>
    `}).join('');

    // Bottone Elimina (Solo Admin o Autore)
    // Nota: usiamo authorName (o post.user) per il controllo
    let deleteBtn = '';
    if (currentUser === post.user || isAdmin) {
        deleteBtn = `<button onclick="window.confirmDeletePost('${postId}')" class="text-red-400 hover:text-red-600 transition p-2 rounded-full hover:bg-red-50">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>`;
    }

    // Bottone Report (Per tutti tranne l'autore)
    let reportBtn = '';
    if (currentUser !== post.user) {
         reportBtn = `<button onclick="openReportModal('${postId}')" class="text-gray-400 hover:text-yellow-500 transition ml-2" title="Segnala">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.332 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        </button>`;
    }

    // HTML del post
    postElement.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
                <div class="w-10 h-10 bg-gradient-to-tr from-blue-500 to-blue-300 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                    ${authorInitial}
                </div>
                <div class="ml-3">
                    <span class="font-semibold text-gray-800">${authorName}</span> <p class="text-xs text-gray-400">${dateDisplay}</p>
                </div>
            </div>
            <div class="flex items-center">
                ${reportBtn}
                ${deleteBtn}
            </div>
        </div>

        <p class="text-gray-700 mb-4 leading-relaxed whitespace-pre-wrap">${post.text}</p>
        ${mediaHtml}

        <div class="flex items-center space-x-6 border-t py-3 mb-2 mt-4">
            <button onclick="toggleLike('${postId}')" class="flex items-center space-x-2 ${likeColor} hover:scale-110 transition-transform focus:outline-none">
                <svg class="w-6 h-6" fill="${likeIconFill}" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                <span class="font-medium">${likes.length}</span>
            </button>
            
            <button onclick="toggleComments('${postId}')" class="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition focus:outline-none">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                <span class="font-medium">${comments.length}</span>
            </button>
        </div>

        <div id="comment-section-${postId}" style="display: none;" class="border-t pt-4 mt-2 transition-all duration-300">
            <div id="comments-list-${postId}" class="max-h-60 overflow-y-auto custom-scrollbar mb-4">
                ${commentsHtml.length > 0 ? commentsHtml : '<p class="text-xs text-gray-400 italic">Nessun commento ancora.</p>'}
            </div>
            
            <div class="flex mt-2 bg-gray-100 rounded-xl p-1 items-center">
                <input type="text" id="comment-input-${postId}" 
                       placeholder="Scrivi un commento..." 
                       onkeypress="if(event.key === 'Enter') addComment('${postId}')"
                       class="flex-grow bg-transparent border-none p-2 text-sm focus:ring-0 outline-none text-gray-700 placeholder-gray-400">
                <button onclick="addComment('${postId}')" 
                        class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition ml-2">
                    Invia
                </button>
            </div>
        </div>
    `;
    postsContainer.appendChild(postElement);
}

// --- FUNZIONI DI INTERAZIONE (Like, Commenti, Delete) ---

window.toggleComments = function(postId) {
    const section = document.getElementById(`comment-section-${postId}`);
    if (section) section.style.display = (section.style.display === "block") ? "none" : "block";
};

window.addComment = function(postId) {
    const currentUser = localStorage.getItem('currentUser') || "Guest";
    const inputField = document.getElementById(`comment-input-${postId}`);
    if (!inputField || !inputField.value.trim()) return;

    const newComment = {
        user: currentUser,
        text: inputField.value.trim(),
        timestamp: Date.now()
    };

    window.db.collection("posts").doc(postId).update({
        comments: firebase.firestore.FieldValue.arrayUnion(newComment)
    }).then(() => { inputField.value = ''; });
};

window.toggleLike = function(postId) {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return alert("Devi accedere per mettere like!");

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
             window.db.collection("posts").doc(postId).delete().then(() => modal.classList.add('hidden'));
        });
        document.getElementById('cancel-delete').onclick = () => modal.classList.add('hidden');
    } else if (confirm("Eliminare il post?")) {
        window.db.collection("posts").doc(postId).delete();
    }
};

// --- FUNZIONI DI CREAZIONE POST (per posta.html) ---

window.publishPost = function() {
    // 1. Setup Variabili da posta.html
    const currentUser = localStorage.getItem('currentUser');
    const textInput = document.getElementById('post-text');
    const fileInput = document.getElementById('file-upload');
    const statusMsg = document.getElementById('status-message');
    const submitBtn = document.getElementById('submit-btn');

    // Se mancano gli elementi fondamentali (siamo in pubblici.html), usciamo
    if (!textInput || !submitBtn) return; 

    if (!currentUser) {
        alert("Devi accedere per pubblicare!");
        return;
    }

    const postText = textInput.value.trim();
    const file = fileInput && fileInput.files[0] ? fileInput.files[0] : null;

    if (!postText && !file) {
        alert("Inserisci un testo o un file!");
        return;
    }

    // 2. Feedback UI (Loader)
    submitBtn.disabled = true;
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<div class="loader"></div>';
    
    if (statusMsg) {
        statusMsg.style.display = 'block';
        statusMsg.className = "mt-4 text-center text-sm font-medium text-blue-600";
        statusMsg.innerText = "Pubblicazione in corso...";
    }

    // 3. Funzione di salvataggio DB
    const saveToFirestore = (mediaUrl, isVideo) => {
        const newPost = {
            user: currentUser,
            text: postText,
            mediaUri: mediaUrl || null,
            isVideo: isVideo,
            timestamp: Date.now(),
            category: "Generale",
            likes: [],
            comments: []
        };

        window.db.collection("posts").add(newPost)
            .then(() => {
                if(statusMsg) {
                    statusMsg.className = "mt-4 text-center text-sm font-medium text-green-600";
                    statusMsg.innerText = "Post pubblicato con successo!";
                }
                textInput.value = '';
                if(fileInput) fileInput.value = '';
                const fileNameSpan = document.getElementById('file-name');
                if(fileNameSpan) fileNameSpan.textContent = '';

                setTimeout(() => {
                    if(statusMsg) statusMsg.style.display = 'none';
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                    // Opzionale: rimanda a pubblici.html dopo il post
                    // window.location.href = 'pubblici.html';
                }, 2000);
            })
            .catch((error) => {
                console.error("Errore salvataggio:", error);
                if(statusMsg) {
                    statusMsg.className = "mt-4 text-center text-sm font-medium text-red-600";
                    statusMsg.innerText = "Errore: " + error.message;
                }
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            });
    };

    // 4. Gestione Upload
    if (file) {
        const isVideo = file.type.startsWith('video/');
        const storageRef = window.storage.ref();
        const fileRef = storageRef.child(`posts_media/${Date.now()}_${file.name}`);

        fileRef.put(file).then((snapshot) => {
            return snapshot.ref.getDownloadURL();
        }).then((url) => {
            saveToFirestore(url, isVideo);
        }).catch((error) => {
            if(statusMsg) {
                statusMsg.className = "mt-4 text-center text-sm font-medium text-red-600";
                statusMsg.innerText = "Errore upload: " + error.message;
            }
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        });
    } else {
        saveToFirestore("", false);
    }
};

// Inizializza l'ascoltatore solo se siamo nella pagina di visualizzazione
document.addEventListener('DOMContentLoaded', listenToFirestorePosts);

