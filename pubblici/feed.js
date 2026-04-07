// feed.js - Gestione CARICAMENTO INFINITO e FETCH DATI

let lastVisiblePost = null; 
let isLoading = false;      
const POSTS_PER_PAGE = 10; // Post per volta caricati
let observer; // Osservatore per lo scroll infinito

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
            // Gestione Fine Post: Quando Firestore restituisce un risultato vuoto, 
            // l'osservatore viene scollegato per evitare chiamate inutili al database.
            if (observer) observer.disconnect(); 
            isLoading = false;
            return;
        }

        lastVisiblePost = snapshot.docs[snapshot.docs.length - 1];

        snapshot.forEach((doc) => {
            // Chiama la funzione renderPost definita in ui-renderer.js
            if (typeof window.renderPost === 'function') {
                window.renderPost(doc.id, doc.data(), currentUser, isAdmin);
            }
        });

    } catch (error) {
        console.error("Errore caricamento post:", error);
    } finally {
        isLoading = false;
    }
}

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

// INIZIALIZZAZIONE
document.addEventListener('DOMContentLoaded', () => {
    const checkDb = setInterval(() => {
        if (window.db) {
            clearInterval(checkDb);
            loadInitialPosts();
        }
    }, 500);
});