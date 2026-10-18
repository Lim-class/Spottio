// spot/feed.js - Motore Feed & Flashspot Centralizzato Vue 3
import { initSpotTranslations } from './lingue/spot-i18n.js';

const { createApp, ref, onMounted } = Vue;

// Pull-to-Refresh non invasivo (solo touch su mobile, non altera il Flexbox)
function setupPullToRefresh(scrollContainer, onRefreshCallback) {
    if (!scrollContainer || !('ontouchstart' in window)) return;

    let startY = 0;
    let currentY = 0;
    let isPulling = false;
    const THRESHOLD = 70;

    // Crea l'indicatore come elemento flottante dentro il contenitore
    const indicator = document.createElement('div');
    indicator.className = 'w-full flex justify-center py-2 overflow-hidden transition-all duration-200 pointer-events-none';
    indicator.style.height = '0px';
    indicator.innerHTML = `
        <div id="ptr-icon" class="w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-blue-500 text-sm transform transition-transform">
            ↓
        </div>
    `;

    // Lo inserisce all'inizio del contenitore interno dei post, non nel body
    const innerContent = scrollContainer.firstElementChild;
    if (innerContent) {
        innerContent.insertBefore(indicator, innerContent.firstChild);
    }

    scrollContainer.addEventListener('touchstart', (e) => {
        if (scrollContainer.scrollTop <= 0) {
            startY = e.touches[0].pageY;
            isPulling = true;
        }
    }, { passive: true });

    scrollContainer.addEventListener('touchmove', (e) => {
        if (!isPulling) return;
        currentY = e.touches[0].pageY;
        const diff = currentY - startY;

        if (diff > 0 && scrollContainer.scrollTop <= 0) {
            const height = Math.min(diff * 0.4, THRESHOLD + 15);
            indicator.style.height = `${height}px`;

            const icon = document.getElementById('ptr-icon');
            if (icon) {
                icon.style.transform = height >= THRESHOLD ? 'rotate(180deg)' : 'rotate(0deg)';
            }
        }
    }, { passive: true });

    scrollContainer.addEventListener('touchend', async () => {
        if (!isPulling) return;
        isPulling = false;

        const diff = currentY - startY;
        const icon = document.getElementById('ptr-icon');

        if (diff * 0.4 >= THRESHOLD) {
            indicator.style.height = `${THRESHOLD}px`;
            if (icon) icon.innerHTML = '<div class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>';

            try {
                if (typeof onRefreshCallback === 'function') {
                    await onRefreshCallback();
                }
            } finally {
                setTimeout(() => {
                    indicator.style.height = '0px';
                    if (icon) {
                        icon.innerHTML = '↓';
                        icon.style.transform = 'rotate(0deg)';
                    }
                }, 300);
            }
        } else {
            indicator.style.height = '0px';
        }
        startY = 0;
        currentY = 0;
    });
}

const app = createApp({
    setup() {
        const currentFeedMode = ref('explore');
        const isLoading = ref(false);
        const activeStories = ref([]);
        const emptyMessage = ref('');
        const sentinelRef = ref(null);
        const sharedPostId = ref(null);

        const { currentLang, translateText } = window.Spottio.useLanguageSync(async () => {
            await initSpotTranslations();
        });
        
        let lastVisiblePost = null;
        let observer = null;
        const POSTS_PER_PAGE = 10;
        
        const session = ref({ username: 'Guest', uid: '', isAdmin: false });
        const posts = ref([]);

        const { likesModal, openLikesModal } = window.SpottioComposables.useLikesModal();
        const { reportModal, openReportModal, submitReport } = window.SpottioComposables.useReportModal({ session });
        const postActions = window.SpottioComposables.usePostInteractions({ session, posts, refreshAlgorithm: true });
        const editManager = window.SpottioComposables.useEditPostModal({ posts });

        const modals = ref({
            report: reportModal,
            likes: likesModal,
            flashspot: { 
                show: false, userIndex: 0, stories: [], author: null, 
                currentIndex: 0, progress: 0, timer: null, progressInterval: null 
            }
        });

        // Caricamento Flashspot con auto-eliminazione dei Flashspot scaduti da Firestore
        const loadStories = async () => {
            try {
                const snapshot = await window.db.collection("posts")
                    .where("type", "in", ["flashspot", "story"])
                    .limit(100)
                    .get();

                const map = {};
                const docsArray = [];
                snapshot.forEach(doc => docsArray.push(doc));
                docsArray.sort((a, b) => (b.data().timestamp?.toMillis() || 0) - (a.data().timestamp?.toMillis() || 0));

                docsArray.forEach(d => {
                    const data = d.data();
                    const isActive = window.Spottio && window.Spottio.isFlashspotActive 
                        ? window.Spottio.isFlashspotActive(data.timestamp, data.duration) 
                        : true;

                    if (isActive) {
                        if (!map[data.user]) map[data.user] = [];
                        map[data.user].push({ id: d.id, data });
                    } else if (data.duration !== 'permanent') {
                        window.db.collection("posts").doc(d.id).delete().catch(() => {});
                    }
                });

                const followingList = window.FeedAlgorithm?.followingList || [];
                const loaded = [];
                for (const [uid, stories] of Object.entries(map)) {
                    stories.reverse();
                    const profile = await window.Spottio.getUserProfile(uid);
                    const isFollowing = followingList.includes(uid) || uid === session.value.uid;

                    if (currentFeedMode.value === 'explore' && profile.isPrivate && !isFollowing) {
                        continue;
                    }
                    if (uid === session.value.uid) loaded.unshift({ uid, profile, stories });
                    else loaded.push({ uid, profile, stories });
                }
                activeStories.value = loaded;
            } catch (err) {
                console.error("Errore caricamento Flashspot:", err);
            }
        };

        const flashspotViewer = window.SpottioComposables.useFlashspotViewer({ 
            modals, activeStories, session, onStoryDeleted: loadStories 
        });

        const openAuthorFlashspot = (post) => {
            const authorUid = post.data?.user;
            const authorIdx = activeStories.value.findIndex(u => u.uid === authorUid);
            if (authorIdx !== -1) {
                flashspotViewer.openFlashspotViewer(authorIdx);
            } else {
                window.db.collection("posts")
                    .where("user", "==", authorUid)
                    .limit(20)
                    .get()
                    .then(snap => {
                        const stories = [];
                        snap.forEach(d => {
                            const data = d.data();
                            const isActive = window.Spottio && window.Spottio.isFlashspotActive 
                                ? window.Spottio.isFlashspotActive(data.timestamp, data.duration) 
                                : true;

                            if ((data.type === 'flashspot' || data.type === 'story') && isActive) {
                                stories.push({ id: d.id, data });
                            } else if ((data.type === 'flashspot' || data.type === 'story') && !isActive && data.duration !== 'permanent') {
                                window.db.collection("posts").doc(d.id).delete().catch(() => {});
                            }
                        });
                        if (stories.length > 0) {
                            flashspotViewer.openFlashspotViewer(0, stories, { profile: post.authorProfile, uid: authorUid });
                        } else {
                            window.Spottio.navigateToUserProfile(authorUid);
                        }
                    });
            }
        };

        const formatTime = (ts) => window.Spottio?.formatTimestamp(ts) || '';
        const getUserAvatarHtml = (uri, name, cls, isGrp, hasSt) => window.Spottio?.getAvatarHtml(uri, name, cls, isGrp, hasSt) || '';
        const getVerifiedBadge = () => window.Spottio?.getVerifiedBadge(true, "w-4 h-4 text-blue-500 ml-1 inline-block") || '';

        const setupInfiniteScroll = () => {
            if (observer) observer.disconnect();
            if (!sentinelRef.value) return;
            observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && !isLoading.value) fetchPosts();
            }, { root: null, rootMargin: '100px', threshold: 0.1 });
            observer.observe(sentinelRef.value);
        };

        const fetchPosts = async () => {
            if (isLoading.value) return;
            isLoading.value = true;
            emptyMessage.value = '';

            try {
                let validPosts = [];
                let fetchedCount = 0;

                if (sharedPostId.value && lastVisiblePost === null) {
                    try {
                        const singleDoc = await window.db.collection("posts").doc(sharedPostId.value).get();
                        if (singleDoc.exists) {
                            const postData = { id: singleDoc.id, data: singleDoc.data() };
                            const d = postData.data;
                            let isExpired = false;
                            const now = Date.now();
                            if (d.expiresAt) {
                                const expMs = d.expiresAt.toDate ? d.expiresAt.toDate().getTime() : new Date(d.expiresAt).getTime();
                                if (now >= expMs) isExpired = true;
                            } else if (d.duration && d.duration !== 'permanent') {
                                const postTime = d.timestamp?.toDate ? d.timestamp.toDate().getTime() : new Date(d.timestamp).getTime();
                                if (now >= (postTime + parseInt(d.duration, 10) * 3600 * 1000)) isExpired = true;
                            }

                            if (isExpired) {
                                window.db.collection("posts").doc(singleDoc.id).delete().catch(() => {});
                            } else {
                                let canView = true;
                                if (window.FeedAlgorithm) {
                                    canView = await window.FeedAlgorithm.canViewPost(postData.data.user, session.value.uid, currentFeedMode.value);
                                }
                                if (canView) validPosts.push(postData);
                            }
                        }
                    } catch (e) { console.error("Errore recupero spot condiviso:", e); }
                }

                while (validPosts.length < POSTS_PER_PAGE) {
                    let query = window.db.collection("posts").orderBy("timestamp", "desc");

                    if (currentFeedMode.value === 'explore') {
                        query = query.limit(POSTS_PER_PAGE);
                    } else {
                        const following = window.FeedAlgorithm?.followingList || [];
                        if (following.length === 0) {
                            if (lastVisiblePost === null && validPosts.length === 0) {
                                emptyMessage.value = translateText('noFollowingSpots', 'Non segui ancora nessuno. Vai su Esplora per scoprire nuovi contenuti!');
                            }
                            break;
                        }
                        query = query.where("user", "in", following.slice(0, 30)).limit(POSTS_PER_PAGE);
                    }

                    if (lastVisiblePost) query = query.startAfter(lastVisiblePost);
                    const snapshot = await query.get();

                    if (snapshot.empty) {
                        if (posts.value.length === 0 && validPosts.length === 0) {
                            emptyMessage.value = translateText('noSpotsAvailable', 'Nessuno spot disponibile.');
                        }
                        if (observer) observer.disconnect();
                        break;
                    }

                    lastVisiblePost = snapshot.docs[snapshot.docs.length - 1];
                    fetchedCount += snapshot.docs.length;

                    let rawPosts = [];
                    const now = Date.now();

                    snapshot.forEach(doc => {
                        const d = doc.data();
                        if (doc.id !== sharedPostId.value && d.type !== 'flashspot' && d.type !== 'story') {
                            let isExpired = false;
                            if (d.expiresAt) {
                                const expMs = d.expiresAt.toDate ? d.expiresAt.toDate().getTime() : new Date(d.expiresAt).getTime();
                                if (now >= expMs) isExpired = true;
                            } else if (d.duration && d.duration !== 'permanent') {
                                const postTime = d.timestamp?.toDate ? d.timestamp.toDate().getTime() : new Date(d.timestamp).getTime();
                                if (now >= (postTime + parseInt(d.duration, 10) * 3600 * 1000)) isExpired = true;
                            }

                            if (isExpired) {
                                window.db.collection("posts").doc(doc.id).delete().catch(() => {});
                            } else {
                                rawPosts.push({ id: doc.id, data: d });
                            }
                        }
                    });

                    if (window.FeedAlgorithm) {
                        const filtered = await window.FeedAlgorithm.filterPosts(rawPosts, session.value.uid, currentFeedMode.value);
                        validPosts.push(...filtered);
                    } else {
                        validPosts.push(...rawPosts);
                    }

                    if (currentFeedMode.value === 'following' || fetchedCount >= 60) break;
                }

                if (validPosts.length === 0) {
                    isLoading.value = false;
                    return;
                }

                let postsToSort = [...validPosts];
                let priorityPost = null;

                if (sharedPostId.value && posts.value.length === 0 && validPosts.length > 0 && validPosts[0].id === sharedPostId.value) {
                    priorityPost = postsToSort.shift();
                }

                if (window.FeedAlgorithm) postsToSort = window.FeedAlgorithm.sortPosts(postsToSort);
                if (priorityPost) postsToSort.unshift(priorityPost);

                const formatted = await window.SpottioComposables.parsePostList(postsToSort, session.value.username, session.value.uid);
                posts.value.push(...formatted);

            } catch (err) {
                console.error("Errore fetch posts:", err);
            } finally {
                isLoading.value = false;
            }
        };

        const switchTab = async (mode) => {
            if (currentFeedMode.value === mode || isLoading.value) return;
            currentFeedMode.value = mode;
            window.currentFeedMode = mode;
            sharedPostId.value = null;
            lastVisiblePost = null;
            posts.value = [];
            if (observer) observer.disconnect();
            await loadStories();
            await fetchPosts();
            setupInfiniteScroll();
        };

        onMounted(async () => {
            const checkDb = setInterval(async () => {
                if (window.db && window.Spottio) {
                    clearInterval(checkDb);
                    const urlParams = new URLSearchParams(window.location.search);
                    sharedPostId.value = urlParams.get('post');

                    session.value = window.Spottio.getSession();
                    if (window.FeedAlgorithm) await window.FeedAlgorithm.loadPreferences();
                    await loadStories();
                    await fetchPosts();
                    setupInfiniteScroll();

                    // Aggancia il pull-to-refresh al contenitore scrollabile
                    const feedAppContainer = document.getElementById('vue-feed-app');
                    if (feedAppContainer) {
                        setupPullToRefresh(feedAppContainer, async () => {
                            lastVisiblePost = null;
                            posts.value = [];
                            if (observer) observer.disconnect();
                            await loadStories();
                            await fetchPosts();
                            setupInfiniteScroll();
                        });
                    }
                }
            }, 200);
        });

        return {
            session, currentFeedMode, currentLang, isLoading, posts, activeStories, emptyMessage, 
            sentinelRef, modals, sharedPostId, switchTab, formatTime, getUserAvatarHtml, 
            getVerifiedBadge, openReportModal, submitReport, openLikesModal, 
            editManager, openEditModal: editManager.openEditModal, translateText,
            openAuthorFlashspot,
            ...postActions, ...flashspotViewer
        };
    }
});

window.SpottioComposables.registerComponents(app);

initSpotTranslations().finally(() => {
    app.mount('#vue-feed-app');
});