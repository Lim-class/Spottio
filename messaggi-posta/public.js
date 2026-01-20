// public.js

var postsCollection;

// Funzioni Globali
window.toggleComments = function(postId) {
    const section = document.getElementById(`comment-section-${postId}`);
    if (!section) return;
    section.style.display = (section.style.display === "block") ? "none" : "block";
};

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
    if (!postsContainer) return; // Se siamo nella pagina 'posta.html' e non 'pubblici.html', usciamo.

    const currentUser = localStorage.getItem('currentUser') || "Guest";
    const isAdmin = currentUser === 'admin';

    // Ordina per timestamp decrescente (dal più recente)
    postsCollection.orderBy("timestamp", "desc").onSnapshot((snapshot) => {
        postsContainer.innerHTML = ''; 

        snapshot.forEach((doc) => {
            const postData = doc.data();
            const postId = doc.id;
            renderPost(postId, postData, currentUser, isAdmin);
        });
        
        // Rimuove lo spinner di caricamento se non ci sono post
        if(snapshot.empty) {
             postsContainer.innerHTML = '<p class="text-center text-gray-500 mt-10">Nessun post disponibile.</p>';
        }
    }, (error) => {
        console.error("Errore Firestore:", error);
    });
}

function renderPost(postId, post, currentUser, isAdmin) {
    const postsContainer = document.getElementById('posts-container');
    const postElement = document.createElement('div');
    postElement.className = 'bg-white p-6 rounded-2xl shadow-md post mb-6 border border-gray-100 transition duration-300 hover:shadow-lg';

    let dateDisplay = "Data non disponibile";
    if (post.timestamp) {
        // Gestione compatibilità: se è un numero (Java System.currentTimeMillis) o Timestamp Firestore
        const dateObj = typeof post.timestamp === 'number' ? new Date(post.timestamp) : post.timestamp.toDate();
        dateDisplay = dateObj.toLocaleString();
    }

    let mediaHtml = '';
    if (post.mediaUri) {
        if (post.isVideo) {
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
    // Nota: post.comments è una lista di oggetti. Assicuriamoci che campi 'user' e 'text' esistano.
    // Se l'app Java usa 'author', qui potrebbe servire un check. Assumo 'user' come nel JS precedente.
    let commentsHtml = comments.map(c => `
        <div class="bg-gray-50 p-3 rounded-xl mb-2 text-sm border border-gray-200">
            <span class="font-bold text-blue-600">${c.user || c.author || 'Utente'}:</span> 
            <span class="text-gray-700">${c.text}</span>
        </div>
    `).join('');

    let deleteBtn = '';
    if (currentUser === post.user || isAdmin) {
        // Usa la modale custom se esiste, altrimenti confirm standard
        deleteBtn = `<button onclick="window.confirmDeletePost('${postId}')" class="text-red-400 hover:text-red-600 transition p-2 rounded-full hover:bg-red-50">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>`;
    }

    // Aggiungi pulsante segnalazione per tutti tranne l'autore
    let reportBtn = '';
    if (currentUser !== post.user) {
         reportBtn = `<button onclick="openReportModal('${postId}')" class="text-gray-400 hover:text-yellow-500 transition ml-2" title="Segnala">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.332 16c-.77 1.333.192 3 1.732 3z"></path></svg>
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
                       placeholder="Aggiungi un commento..." 
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

// Funzione Aggiungi Commento
window.addComment = function(postId) {
    const currentUser = localStorage.getItem('currentUser') || "Guest";
    const inputField = document.getElementById(`comment-input-${postId}`);
    if (!inputField) return;
    const commentText = inputField.value.trim();

    if (!commentText) return;

    // Struttura commento compatibile con l'app
    const newComment = {
        user: currentUser,
        text: commentText,
        timestamp: Date.now() // Uso un numero per compatibilità con long Java
    };

    window.db.collection("posts").doc(postId).update({
        comments: firebase.firestore.FieldValue.arrayUnion(newComment)
    })
    .then(() => {
        inputField.value = '';
    })
    .catch((error) => console.error("Errore:", error));
};

// Funzione Like
window.toggleLike = function(postId) {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return alert("Esegui l'accesso!");

    const postRef = window.db.collection("posts").doc(postId);
    postRef.get().then((doc) => {
        if (!doc.exists) return;
        let likes = doc.data().likes || [];
        
        if (likes.includes(currentUser)) {
            // Rimuovi like
            postRef.update({
                likes: firebase.firestore.FieldValue.arrayRemove(currentUser)
            });
        } else {
            // Aggiungi like
            postRef.update({
                likes: firebase.firestore.FieldValue.arrayUnion(currentUser)
            });
        }
    });
};

// Funzione Conferma Cancellazione (Wrapper per modale o confirm standard)
window.confirmDeletePost = function(postId) {
    const modal = document.getElementById('confirmation-modal');
    if (modal) {
        // Se siamo in pubblici.html e c'è la modale custom
        modal.classList.remove('hidden');
        // Rimuovi vecchi listener per evitare duplicazioni
        const confirmBtn = document.getElementById('confirm-delete');
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.addEventListener('click', () => {
             window.deletePost(postId);
             modal.classList.add('hidden');
        });
        
        document.getElementById('cancel-delete').onclick = () => {
            modal.classList.add('hidden');
        };
    } else {
        // Fallback standard
        if (confirm("Eliminare definitivamente questo post?")) {
            window.deletePost(postId);
        }
    }
};

window.deletePost = function(postId) {
    window.db.collection("posts").doc(postId).delete()
        .then(() => console.log("Post eliminato"))
        .catch(err => console.error("Errore eliminazione:", err));
};

// --- LOGICA DI PUBBLICAZIONE (UPLOAD STORAGE + FIRESTORE) ---
window.publishPost = function() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        alert("Devi aver effettuato l'accesso per pubblicare!");
        return;
    }

    const postText = document.getElementById('post-text').value.trim();
    const fileInput = document.getElementById('file-upload');
    const file = fileInput ? fileInput.files[0] : null;
    
    if (!postText && !file) {
        alert("Scrivi qualcosa o inserisci un'immagine/video!");
        return;
    }

    const btn = document.querySelector('button[type="submit"]');
    const statusMsg = document.getElementById('status-message');
    
    // UI Loading state
    if(btn) {
        btn.disabled = true;
        btn.innerHTML = '<div class="loader"></div>'; 
    }
    if(statusMsg) {
        statusMsg.style.display = 'block';
        statusMsg.className = 'mt-4 text-center text-sm font-medium text-blue-600';
        statusMsg.innerText = "Pubblicazione in corso...";
    }

    // Funzione interna per salvare il documento
    const saveToFirestore = (mediaUrl, isVideo) => {
        const newPost = {
            user: currentUser, // String
            text: postText,    // String
            mediaUri: mediaUrl, // String (URL)
            isVideo: isVideo,  // Boolean
            category: "Generale", // String (Default per compatibilità Java)
            timestamp: Date.now(), // Number (compatibile con long Java)
            likes: [],         // List
            comments: []       // List
        };

        window.db.collection("posts").add(newPost)
            .then(() => {
                if(statusMsg) {
                    statusMsg.className = 'mt-4 text-center text-sm font-medium text-green-600';
                    statusMsg.innerText = "Post pubblicato con successo!";
                }
                // Reset form
                document.getElementById('post-text').value = '';
                if(fileInput) fileInput.value = '';
                if(document.getElementById('file-name')) document.getElementById('file-name').textContent = '';
                
                setTimeout(() => {
                    if(statusMsg) statusMsg.style.display = 'none';
                    if(btn) {
                        btn.disabled = false;
                        btn.innerHTML = 'Pubblica post';
                    }
                }, 2000);
            })
            .catch((error) => {
                console.error("Errore salvataggio DB:", error);
                if(statusMsg) {
                    statusMsg.className = 'mt-4 text-center text-sm font-medium text-red-600';
                    statusMsg.innerText = "Errore durante il salvataggio.";
                }
                if(btn) {
                    btn.disabled = false;
                    btn.innerHTML = 'Pubblica post';
                }
            });
    };

    // Logica Upload
    if (file) {
        const isVideo = file.type.startsWith('video/');
        const storageRef = window.storage.ref();
        const fileRef = storageRef.child(`posts_media/${Date.now()}_${file.name}`);
        
        if(statusMsg) statusMsg.innerText = "Caricamento media in corso...";

        fileRef.put(file).then((snapshot) => {
            return snapshot.ref.getDownloadURL();
        }).then((downloadURL) => {
            saveToFirestore(downloadURL, isVideo);
        }).catch((error) => {
            console.error("Errore upload file:", error);
            if(statusMsg) {
                statusMsg.className = 'mt-4 text-center text-sm font-medium text-red-600';
                statusMsg.innerText = "Errore durante il caricamento del file.";
            }
            if(btn) {
                btn.disabled = false;
                btn.innerHTML = 'Pubblica post';
            }
        });
    } else {
        // Nessun file, salva direttamente (mediaUrl vuoto o null)
        saveToFirestore("", false);
    }
};

// Inizializza l'ascoltatore al caricamento
document.addEventListener('DOMContentLoaded', listenToFirestorePosts);
