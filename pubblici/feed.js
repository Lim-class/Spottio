// pubblici/feed.js - Gestione CARICAMENTO INFINITO, FETCH DATI e ALGORITMO PREFERENZE

let lastVisiblePost = null; 
let isLoading = false;      
const POSTS_PER_PAGE = 10;
let observer;
let cachedPreferences = {}; 

async function loadInitialPosts() {
    const postsContainer = document.getElementById('posts-container');
    if (!postsContainer || !window.db) return;

    postsContainer.innerHTML = ''; 
    lastVisiblePost = null;
    cachedPreferences = {}; 
    
    const currentUser = localStorage.getItem('currentUser') || "Guest";
    
    if (currentUser !== "Guest" && currentUser !== "null") {
        try {
            // Per l'algoritmo dobbiamo recuperare l'UID salvato in sessione (se presente) o cercare l'utente
            const currentUid = localStorage.getItem('currentUid');
            if(currentUid) {
                const userDoc = await window.db.collection("users").doc(currentUid).get();
                if (userDoc.exists && userDoc.data().preferences) {
                    const rawPrefs = userDoc.data().preferences;
                    const now = new Date();
                    
                    for (const [category, data] of Object.entries(rawPrefs)) {
                        if (typeof data === 'number') {
                            cachedPreferences[category] = data;
                            continue;
                        }
                        let currentScore = data.score || 0;
                        currentScore = window.Spottio.calculatePreferenceDecay(currentScore, data.lastUpdate);
                        cachedPreferences[category] = currentScore;
                    }
                }
            }
        } catch (err) {
            console.error("Errore nel recupero dei dati dell'algoritmo:", err);
        }
    }
    
    await fetchPosts();
    setupInfiniteScroll();
}

async function fetchPosts() {
    if (isLoading) return;
    isLoading = true;

    const postsContainer = document.getElementById('posts-container');
    const currentUser = localStorage.getItem('currentUser') || "Guest";
    const isAdmin = localStorage.getItem('isAdmin') === 'true';

    try {
        let query = window.db.collection("posts")
            .orderBy("timestamp", "desc")
            .limit(POSTS_PER_PAGE);

        if (lastVisiblePost) query = query.startAfter(lastVisiblePost);

        const snapshot = await query.get();

        if (snapshot.empty) {
            if (!lastVisiblePost) {
                postsContainer.innerHTML = '<p class="text-center text-gray-500 mt-10">Nessun post disponibile.</p>';
            }
            if (observer) observer.disconnect(); 
            isLoading = false;
            return;
        }

        lastVisiblePost = snapshot.docs[snapshot.docs.length - 1];

        let postsArray = [];
        snapshot.forEach((doc) => postsArray.push({ id: doc.id, data: doc.data() }));

        postsArray.sort((a, b) => {
            const catA = a.data.category || "Generale";
            const catB = b.data.category || "Generale";
            const puntiA = cachedPreferences[catA] || 0;
            const puntiB = cachedPreferences[catB] || 0;
            
            if (puntiB === puntiA) {
                const timeA = a.data.timestamp ? (typeof a.data.timestamp === 'number' ? a.data.timestamp : (typeof a.data.timestamp.toDate === 'function' ? a.data.timestamp.toDate().getTime() : 0)) : 0;
                const timeB = b.data.timestamp ? (typeof b.data.timestamp === 'number' ? b.data.timestamp : (typeof b.data.timestamp.toDate === 'function' ? b.data.timestamp.toDate().getTime() : 0)) : 0;
                return timeB - timeA;
            }
            return puntiB - puntiA;
        });

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
        if (entries[0].isIntersecting && !isLoading) fetchPosts();
    }, { root: null, rootMargin: '50px', threshold: 0.1 });

    observer.observe(sentinel);
}

document.addEventListener('DOMContentLoaded', () => {
    const checkDb = setInterval(() => {
        if (window.db) {
            clearInterval(checkDb);
            loadInitialPosts();
        }
    }, 500);
});