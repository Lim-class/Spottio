// pubblici/feed.js - Gestione CARICAMENTO INFINITO, FETCH DATI e ALGORITMO PREFERENZE

let lastVisiblePost = null; 
let isLoading = false;      
const POSTS_PER_PAGE = 10; // Post per volta caricati in ogni pagina di scroll
let observer; // Osservatore per lo scroll infinito
let cachedPreferences = {}; // Cache locale per memorizzare i punti algoritmo dell'utente

async function loadInitialPosts() {
    const postsContainer = document.getElementById('posts-container');
    if (!postsContainer || !window.db) return;

    postsContainer.innerHTML = ''; 
    lastVisiblePost = null;
    cachedPreferences = {}; // Reset delle preferenze ad ogni ricaricamento
    
    const currentUser = localStorage.getItem('currentUser') || "Guest";
    
    // FASE 1 ALGORITMO: Recupera i punti e applica il decadimento temporale (Time-Decay)
    if (currentUser !== "Guest" && currentUser !== "null") {
        try {
            const userDoc = await window.db.collection("users").doc(currentUser).get();
            if (userDoc.exists && userDoc.data().preferences) {
                const rawPrefs = userDoc.data().preferences;
                const now = new Date();
                
                for (const [category, data] of Object.entries(rawPrefs)) {
                    // Retrocompatibilità: se il dato vecchio è solo un numero
                    if (typeof data === 'number') {
                        cachedPreferences[category] = data;
                        continue;
                    }
                    
                    let currentScore = data.score || 0;
                    
                    // Calcolo della perdita di interesse
                    if (data.lastUpdate) {
                        // Supporta sia l'oggetto Timestamp di Firestore che date generiche
                        const lastUpdateDate = typeof data.lastUpdate.toDate === 'function' ? data.lastUpdate.toDate() : new Date(data.lastUpdate);
                        const diffTime = Math.abs(now - lastUpdateDate);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        // Se sono passati 30+ giorni, applichiamo il decadimento esponenziale
                        if (diffDays >= 30) {
                            const decayCycles = Math.floor(diffDays / 30);
                            // Il punteggio si dimezza per ogni mese trascorso
                            currentScore = currentScore / Math.pow(2, decayCycles);
                        }
                    }
                    
                    cachedPreferences[category] = currentScore;
                }
            }
        } catch (err) {
            console.error("Errore nel recupero dei dati dell'algoritmo:", err);
        }
    }
    
    // FASE 2: Carica i primi post (che verranno ordinati dall'algoritmo)
    await fetchPosts();
    
    // FASE 3: Inizializza l'osservatore per lo scroll infinito
    setupInfiniteScroll();
}

async function fetchPosts() {
    if (isLoading) return;
    isLoading = true;

    const postsContainer = document.getElementById('posts-container');
    const currentUser = localStorage.getItem('currentUser') || "Guest";
    const isAdmin = currentUser === 'admin';

    try {
        // Prendiamo i post ordinati per data per garantire freschezza dei contenuti
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
            if (observer) observer.disconnect(); 
            isLoading = false;
            return;
        }

        // FONDAMENTALE PER FIRESTORE: salviamo l'ultimo documento REALE del database 
        // per mantenere la paginazione stabile durante lo scroll infinito.
        lastVisiblePost = snapshot.docs[snapshot.docs.length - 1];

        // Creiamo un array temporaneo per i 10 post appena scaricati
        let postsArray = [];
        snapshot.forEach((doc) => {
            postsArray.push({ id: doc.id, data: doc.data() });
        });

        // FASE 3 ALGORITMO: Ordiniamo i 10 post in base ai gusti dell'utente loggato
        postsArray.sort((a, b) => {
            const catA = a.data.category || "Generale";
            const catB = b.data.category || "Generale";
            
            // Estrae i punti associati a questa categoria (se non ci sono, il punteggio è 0)
            const puntiA = cachedPreferences[catA] || 0;
            const puntiB = cachedPreferences[catB] || 0;
            
            // Se le categorie hanno lo stesso punteggio (o se l'utente è Guest), ordina per data (più recente prima)
            if (puntiB === puntiA) {
                const timeA = a.data.timestamp ? (typeof a.data.timestamp === 'number' ? a.data.timestamp : (typeof a.data.timestamp.toDate === 'function' ? a.data.timestamp.toDate().getTime() : 0)) : 0;
                const timeB = b.data.timestamp ? (typeof b.data.timestamp === 'number' ? b.data.timestamp : (typeof b.data.timestamp.toDate === 'function' ? b.data.timestamp.toDate().getTime() : 0)) : 0;
                return timeB - timeA;
            }
            
            // Altrimenti metti prima il post con la categoria che ha più punti
            return puntiB - puntiA;
        });

        // FASE 4: Inviamo al renderer grafico i post nell'ordine stabilito dall'algoritmo
        postsArray.forEach((post) => {
            if (typeof window.renderPost === 'function') {
                window.renderPost(post.id, post.data, currentUser, isAdmin);
            }
        });

    } catch (error) {
        console.error("Errore caricamento post:", error);
    } finally {
        isLoading = false;
    }
}

function setupInfiniteScroll() {
    const existingSentinel = document.getElementById('infinite-scroll-sentinel');
    if (existingSentinel) existingSentinel.remove();

    const sentinel = document.createElement('div');
    sentinel.id = 'infinite-scroll-sentinel';
    sentinel.className = 'h-10 w-full flex justify-center items-center';
    sentinel.innerHTML = '<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>';
    
    document.getElementById('posts-container').after(sentinel);

    observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isLoading) {
            fetchPosts();
        }
    }, {
        root: null,
        rootMargin: '50px',
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