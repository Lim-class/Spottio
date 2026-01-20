// Riferimento al database (inizializzato nell'HTML)
let postsCollection;

function initializeFirestore() {
    if (typeof db !== 'undefined') {
        postsCollection = db.collection("posts");
    } else {
        console.error("Errore: la variabile 'db' non è definita. Controlla l'ordine degli script in HTML.");
    }
}

// Funzione che emula listenToFirestorePosts() del codice Java
function listenToFirestorePosts() {
    initializeFirestore(); // <--- Aggiungi questo
    if (!postsCollection) return;

    const postsContainer = document.getElementById('posts-container');

    // Recupera l'utente attivo da localStorage (coerente con SpottioPrefs in Java)
    const currentUser = localStorage.getItem('currentUser') || "Guest";
    // In Java usi un prefisso per isAdmin, qui semplifichiamo controllando se è 'admin'
    const isAdmin = currentUser === 'admin';

    // Query identica a Java: ordinata per timestamp decrescente
    postsCollection.orderBy("timestamp", "desc").onSnapshot((snapshot) => {
        postsContainer.innerHTML = ''; // Svuota il contenitore (cloudPostList.clear())

        snapshot.forEach((doc) => {
            const postData = doc.data();
            const postId = doc.id; // Corrisponde a p.setPostId(doc.getId())

            // Creazione dell'elemento post (simile al PostAdapter)
            renderPost(postId, postData, currentUser, isAdmin);
        });
    }, (error) => {
        console.error("Errore durante l'ascolto dei post:", error);
    });
}

// Funzione per visualizzare il post (Equivalente al metodo onBindViewHolder dell'Adapter Java)
function renderPost(postId, post, currentUser, isAdmin) {
    const postsContainer = document.getElementById('posts-container');
    const postElement = document.createElement('div');
    postElement.className = 'bg-white p-6 rounded-2xl shadow-md post mb-6';

    // Gestione Immagine (se presente nel database)
    let mediaHtml = post.image ? `<img src="${post.image}" class="w-full h-auto rounded-lg mb-4">` : '';

    // Logica Like
    const likes = post.likes || [];
    const hasLiked = likes.includes(currentUser);
    const likeColor = hasLiked ? 'text-red-500' : 'text-gray-500';

    // Logica eliminazione (Uguale a Java: autore o admin)
    let deleteBtn = '';
    if (currentUser === post.username || isAdmin) {
        deleteBtn = `<button onclick="deletePost('${postId}')" class="text-red-500 hover:text-red-700 text-sm">Elimina</button>`;
    }

    postElement.innerHTML = `
        <div class="flex items-center mb-4">
            <img src="https://placehold.co/40x40/cccccc/000000?text=${post.username ? post.username[0].toUpperCase() : '?'}" class="w-10 h-10 rounded-full mr-3">
            <div>
                <span class="font-semibold text-gray-800">${post.username}</span>
                <p class="text-xs text-gray-500">${post.timestamp ? new Date(post.timestamp.toDate()).toLocaleString() : 'In caricamento...'}</p>
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
                ${deleteBtn}
            </div>
        </div>
    `;
    postsContainer.appendChild(postElement);
}

// --- AZIONI SUL DATABASE ---

function toggleLike(postId) {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return;

    const postRef = postsCollection.doc(postId);
    
    // In Firestore Web usiamo una transazione o un update semplice
    postRef.get().then((doc) => {
        const data = doc.data();
        let likes = data.likes || [];
        if (likes.includes(currentUser)) {
            likes = likes.filter(u => u !== currentUser);
        } else {
            likes.push(currentUser);
        }
        postRef.update({ likes: likes });
    });
}

function deletePost(postId) {
    if (confirm("Vuoi eliminare definitivamente questo post?")) {
        postsCollection.doc(postId).delete()
            .then(() => console.log("Post rimosso dal Cloud"))
            .catch(err => alert("Errore: " + err));
    }
}

// Avvio al caricamento della pagina
document.addEventListener('DOMContentLoaded', listenToFirestorePosts);

