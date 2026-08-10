// pubblici/feed.js - Gestione CARICAMENTO INFINITO, FETCH DATI, TABS e CONDIVISIONE ESTERNA

let lastVisiblePost = null; 
let isLoading = false;      
const POSTS_PER_PAGE = 10;
let observer;
let currentFeedMode = 'explore'; 
let sharedPostId = null; 

async function loadInitialPosts() {
    const postsContainer = document.getElementById('posts-container');
    if (!postsContainer || !window.db) return;

    postsContainer.innerHTML = ''; 
    lastVisiblePost = null;
    
    const urlParams = new URLSearchParams(window.location.search);
    sharedPostId = urlParams.get('post');

    if (window.FeedAlgorithm) {
        await window.FeedAlgorithm.loadPreferences();
    }
    
    await fetchPosts();
    setupInfiniteScroll();
}

function switchTab(mode) {
    if (currentFeedMode === mode || isLoading) return;
    currentFeedMode = mode;
    sharedPostId = null; 

    const btnExplore = document.getElementById('tab-explore');
    const btnFollowing = document.getElementById('tab-following');

    if (mode === 'explore') {
        btnExplore.className = "px-6 py-3 font-bold text-blue-600 border-b-2 border-blue-600 focus:outline-none transition";
        btnFollowing.className = "px-6 py-3 font-bold text-gray-400 border-b-2 border-transparent hover:text-gray-600 focus:outline-none transition";
    } else {
        btnFollowing.className = "px-6 py-3 font-bold text-blue-600 border-b-2 border-blue-600 focus:outline-none transition";
        btnExplore.className = "px-6 py-3 font-bold text-gray-400 border-b-2 border-transparent hover:text-gray-600 focus:outline-none transition";
    }

    document.getElementById('posts-container').innerHTML = '<div class="flex justify-center py-10"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>';
    lastVisiblePost = null;
    if (observer) observer.disconnect();
    
    fetchPosts().then(() => setupInfiniteScroll());
}

async function fetchPosts() {
    if (isLoading) return;
    isLoading = true;

    const postsContainer = document.getElementById('posts-container');
    if (lastVisiblePost === null) postsContainer.innerHTML = '';

    const currentUser = localStorage.getItem('currentUser') || "Guest";
    const currentUid = localStorage.getItem('currentUid') || currentUser;
    const isAdmin = localStorage.getItem('isAdmin') === 'true';

    try {
        let validPosts = [];
        let fetchedCount = 0; 
        
        if (sharedPostId && lastVisiblePost === null) {
            try {
                const singleDoc = await window.db.collection("posts").doc(sharedPostId).get();
                if (singleDoc.exists) {
                    const postData = { id: singleDoc.id, data: singleDoc.data() };
                    
                    let canView = true;
                    if (window.FeedAlgorithm) {
                        // Pulito da author
                        const authorId = postData.data.user;
                        if (authorId) {
                            await window.Spottio.getUserProfile(authorId);
                            const isPrivate = window.userCache[authorId]?.isPrivate === true;
                            
                            if (currentFeedMode === 'explore' && isPrivate) {
                                canView = false;
                            }
                        }
                    }
                    
                    if (canView) validPosts.push(postData);
                }
            } catch (err) {
                console.error("Errore recupero post condiviso:", err);
            }
        }

        while (validPosts.length < POSTS_PER_PAGE) {
            let query = window.db.collection("posts").orderBy("timestamp", "desc");

            if (currentFeedMode === 'explore') {
                query = query.limit(POSTS_PER_PAGE);
            } else {
                const following = window.FeedAlgorithm.followingList || [];
                if (following.length === 0) {
                    if (lastVisiblePost === null && validPosts.length === 0) {
                        postsContainer.innerHTML = '<p class="text-center text-gray-500 mt-10">Non segui ancora nessuno. Vai su Esplora per scoprire nuovi contenuti!</p>';
                    }
                    break;
                }
                const chunks = following.slice(0, 30);
                query = query.where("user", "in", chunks).limit(POSTS_PER_PAGE);
            }

            if (lastVisiblePost) query = query.startAfter(lastVisiblePost);

            const snapshot = await query.get();

            if (snapshot.empty) {
                if (!lastVisiblePost && validPosts.length === 0 && currentFeedMode === 'explore') {
                    postsContainer.innerHTML = '<p class="text-center text-gray-500 mt-10">Nessun post disponibile.</p>';
                }
                if (observer) observer.disconnect(); 
                break;
            }

            lastVisiblePost = snapshot.docs[snapshot.docs.length - 1];
            fetchedCount += snapshot.docs.length;

            let rawPosts = [];
            snapshot.forEach((doc) => {
                if (doc.id !== sharedPostId) {
                    rawPosts.push({ id: doc.id, data: doc.data() });
                }
            });

            if (window.FeedAlgorithm) {
                const filtered = await window.FeedAlgorithm.filterPosts(rawPosts, currentUid, currentFeedMode);
                validPosts.push(...filtered);
            } else {
                validPosts.push(...rawPosts);
            }

            if (currentFeedMode === 'following') break; 
            if (fetchedCount >= 60) break; 
        }

        if (validPosts.length === 0) {
            isLoading = false;
            return;
        }

        let postsToSort = [...validPosts];
        let priorityPost = null;
        
        if (sharedPostId && lastVisiblePost === null && validPosts.length > 0 && validPosts[0].id === sharedPostId) {
            priorityPost = postsToSort.shift(); 
        }

        if (window.FeedAlgorithm) {
            postsToSort = window.FeedAlgorithm.sortPosts(postsToSort);
        }
        
        if (priorityPost) {
            postsToSort.unshift(priorityPost); 
        }

        postsToSort.forEach((post) => {
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
    document.getElementById('tab-explore')?.addEventListener('click', () => switchTab('explore'));
    document.getElementById('tab-following')?.addEventListener('click', () => switchTab('following'));

    const checkDb = setInterval(() => {
        if (window.db) {
            clearInterval(checkDb);
            loadInitialPosts();
        }
    }, 500);
});