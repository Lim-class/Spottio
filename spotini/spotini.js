// spotini.js - Controller Vue 3 per Shorts & Reels
import { initSpotiniTranslations } from './lingue/spotini-i18n.js';

const { createApp, ref, onMounted, onUnmounted, nextTick } = Vue;

const spotiniApp = createApp({
    setup() {
        const feedMode = ref('explore');
        const isInitialLoading = ref(true);
        const isLoadingMore = ref(false);
        const spotiniList = ref([]);
        const emptyMessage = ref('');
        const sentinelRef = ref(null);
        const containerRef = ref(null);
        const isMuted = ref(false);
        const currentIndex = ref(0);
        const activeOptionsSpotId = ref(null);

        const currentLang = ref(localStorage.getItem('selectedLanguage') || 'it');

        let lastDoc = null;
        let scrollObserver = null;
        let cardObserver = null;
        let tapTimeout = null;
        let isFetching = false;

        const session = ref({ username: 'Guest', uid: '', isAdmin: false });

        const drawerComments = ref({
            show: false,
            currentSpot: null,
            newCommentText: '',
            isSubmitting: false
        });

        const translateText = (key, defaultText) => {
            const lang = currentLang.value;
            const dictKey = (typeof window.getDictionaryKey === 'function') ? window.getDictionaryKey(lang) : lang;
            
            if (window.translations && window.translations[dictKey] && window.translations[dictKey][key]) {
                return window.translations[dictKey][key];
            }
            if (window.t && typeof window.t === 'function') {
                const res = window.t(key);
                if (res && res !== key) return res;
            }
            return defaultText;
        };

        // Composables Condivisi
        const { likesModal, openLikesModal } = window.SpottioComposables.useLikesModal();
        const { reportModal, openReportModal, submitReport } = window.SpottioComposables.useReportModal({ session });
        const editManager = window.SpottioComposables.useEditPostModal({ posts: spotiniList });

        const modals = ref({
            likes: likesModal,
            report: reportModal
        });

        const postActions = window.SpottioComposables?.usePostInteractions({
            session,
            posts: spotiniList,
            refreshAlgorithm: true
        }) || {};

        const formatCounter = (num) => {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
            return num || 0;
        };

        const toggleGlobalMute = () => {
            isMuted.value = !isMuted.value;
            document.querySelectorAll('video').forEach(v => v.muted = isMuted.value);
        };

        const hasSpotiniTag = (postData) => {
            const categories = window.Spottio?.getPostCategories ? window.Spottio.getPostCategories(postData) : [];
            const text = (postData.text || '').toLowerCase();
            const type = (postData.type || '').toLowerCase();

            const matchesCategory = categories.some(c => {
                const str = String(c).toLowerCase().replace('#', '').trim();
                return str === 'spotini' || str === 'spotino';
            });

            const matchesText = text.includes('#spotini') || text.includes('#spotino');
            const matchesType = type === 'spotini' || type === 'spotino' || type === 'short';

            return matchesCategory || matchesText || matchesType;
        };

        const canManageSpot = (spot) => {
            if (session.value?.isAdmin) return true;
            const spotUser = spot?.data?.user || spot?.user;
            const myUid = session.value?.uid;
            if (!spotUser || !myUid) return false;
            if (spotUser === myUid || spotUser === session.value.username) return true;
            if (spot?.data?.coAuthors && spot.data.coAuthors.includes(myUid)) return true;
            return false;
        };

        const toggleOptions = (id, e) => {
            if (e) e.stopPropagation();
            activeOptionsSpotId.value = activeOptionsSpotId.value === id ? null : id;
        };

        const closeOptions = () => {
            activeOptionsSpotId.value = null;
        };

        const fetchSpotini = async () => {
            if (isFetching) return;
            isFetching = true;

            if (spotiniList.value.length === 0) {
                isInitialLoading.value = true;
            } else {
                isLoadingMore.value = true;
            }
            emptyMessage.value = '';

            try {
                const TARGET_BATCH = 8;
                let validSpotini = [];
                let attempts = 0;

                while (validSpotini.length < TARGET_BATCH && attempts < 4) {
                    attempts++;
                    let query = window.db.collection("posts").orderBy("timestamp", "desc");
                    
                    if (feedMode.value === 'following') {
                        const following = window.FeedAlgorithm?.followingList || [];
                        if (following.length === 0) {
                            if (lastDoc === null && spotiniList.value.length === 0) {
                                emptyMessage.value = translateText('noFollowingSpotini', "Non segui ancora nessuno. Passa ad 'Esplora' per guardare nuovi Spotini!");
                            }
                            break;
                        }
                        query = query.where("user", "in", following.slice(0, 30)).limit(20);
                    } else {
                        query = query.limit(20);
                    }

                    if (lastDoc) query = query.startAfter(lastDoc);

                    const snapshot = await query.get();
                    if (snapshot.empty) {
                        if (scrollObserver) scrollObserver.disconnect();
                        break;
                    }

                    lastDoc = snapshot.docs[snapshot.docs.length - 1];

                    let batchRaw = [];
                    snapshot.forEach(doc => {
                        const d = doc.data();
                        if (hasSpotiniTag(d)) {
                            const mediaList = d.mediaList || [];
                            const firstMedia = mediaList[0] || null;
                            const isVid = firstMedia?.isVideo || d.isVideo || d.type === 'short' || d.type === 'spotino' || d.type === 'spotini';

                            batchRaw.push({
                                id: doc.id,
                                data: d,
                                mediaItem: firstMedia,
                                isVideo: isVid,
                                isPaused: false,
                                showHeartAnim: false,
                                isExpandedText: false,
                                progress: 0,
                                isScrubbing: false,
                                seekFeedback: null
                            });
                        }
                    });

                    if (window.FeedAlgorithm && batchRaw.length > 0) {
                        batchRaw = await window.FeedAlgorithm.filterPosts(batchRaw, session.value.uid, feedMode.value);
                    }

                    validSpotini.push(...batchRaw);
                }

                if (validSpotini.length === 0) {
                    if (spotiniList.value.length === 0 && !emptyMessage.value) {
                        emptyMessage.value = translateText('noSpotiniTag', "Non ci sono contenuti con il tag #spotini.");
                    }
                    return;
                }

                if (window.FeedAlgorithm) {
                    validSpotini = window.FeedAlgorithm.sortPosts(validSpotini);
                }

                const parsed = await window.SpottioComposables.parsePostList(validSpotini, session.value.username, session.value.uid);                
                
                parsed.forEach((p, i) => {
                    p.mediaItem = validSpotini[i]?.mediaItem;
                    p.isVideo = validSpotini[i]?.isVideo;
                    p.isPaused = false;
                    p.showHeartAnim = false;
                    p.isExpandedText = false;
                    p.progress = 0;
                    p.isScrubbing = false;
                    p.seekFeedback = null;
                    p.isFollowing = (window.FeedAlgorithm?.followingList || []).includes(p.data.user);
                });

                spotiniList.value.push(...parsed);

                await nextTick();
                setupCardIntersectionObserver();

            } catch (err) {
                console.error("Errore recupero Spotini:", err);
            } finally {
                isInitialLoading.value = false;
                isLoadingMore.value = false;
                isFetching = false;
            }
        };

        const switchFeedMode = async (mode) => {
            if (feedMode.value === mode || isFetching) return;
            feedMode.value = mode;
            spotiniList.value = [];
            lastDoc = null;
            if (scrollObserver) scrollObserver.disconnect();
            if (cardObserver) cardObserver.disconnect();
            await fetchSpotini();
            setupInfiniteScroll();
        };

        const setupCardIntersectionObserver = () => {
            if (cardObserver) cardObserver.disconnect();

            cardObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const idx = parseInt(entry.target.getAttribute('data-index'), 10);
                        if (!isNaN(idx)) {
                            currentIndex.value = idx;
                            playVideoAtIndex(idx);
                        }
                    }
                });
            }, {
                root: containerRef.value,
                threshold: 0.65
            });

            const cards = document.querySelectorAll('.spotino-card');
            cards.forEach(card => cardObserver.observe(card));
        };

        // Gestione sicura del Play/Pause per evitare AbortError
        const safePlayVideo = (videoEl) => {
            if (!videoEl) return;
            const playPromise = videoEl.play();
            if (playPromise !== undefined) {
                videoEl._playPromise = playPromise;
                playPromise.catch(err => {
                    if (err.name !== 'AbortError') {
                        console.warn("Riproduzione video interrotta:", err);
                    }
                }).finally(() => {
                    videoEl._playPromise = null;
                });
            }
        };

        const safePauseVideo = (videoEl) => {
            if (!videoEl) return;
            if (videoEl._playPromise) {
                videoEl._playPromise.then(() => {
                    videoEl.pause();
                    videoEl.currentTime = 0;
                }).catch(() => {});
            } else {
                videoEl.pause();
                videoEl.currentTime = 0;
            }
        };

        const playVideoAtIndex = (targetIdx) => {
            const cards = document.querySelectorAll('.spotino-card');
            cards.forEach((card, idx) => {
                const vid = card.querySelector('video');
                if (!vid) return;

                if (idx === targetIdx) {
                    safePlayVideo(vid);
                    if (spotiniList.value[idx]) spotiniList.value[idx].isPaused = false;
                } else {
                    safePauseVideo(vid);
                    if (spotiniList.value[idx]) spotiniList.value[idx].isPaused = true;
                }
            });
        };

        const handleScreenTap = (spot, event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            const width = rect.width;

            if (tapTimeout) {
                clearTimeout(tapTimeout);
                tapTimeout = null;

                const idx = spotiniList.value.indexOf(spot);
                const video = document.getElementById('spotino-video-' + idx);

                if (clickX < width * 0.3 && video) {
                    video.currentTime = Math.max(0, video.currentTime - 5);
                    triggerSeekFeedback(spot, 'backward');
                } else if (clickX > width * 0.7 && video) {
                    video.currentTime = Math.min(video.duration || 0, video.currentTime + 5);
                    triggerSeekFeedback(spot, 'forward');
                } else {
                    if (!spot.hasLiked) {
                        postActions.toggleLike(spot);
                    }
                    spot.showHeartAnim = true;
                    setTimeout(() => { spot.showHeartAnim = false; }, 800);
                }
            } else {
                tapTimeout = setTimeout(() => {
                    tapTimeout = null;
                    togglePlayPause(spot);
                }, 260);
            }
        };

        const triggerSeekFeedback = (spot, direction) => {
            spot.seekFeedback = direction;
            setTimeout(() => {
                if (spot.seekFeedback === direction) spot.seekFeedback = null;
            }, 600);
        };

        const togglePlayPause = (spot) => {
            const idx = spotiniList.value.indexOf(spot);
            const video = document.getElementById('spotino-video-' + idx);
            if (video) {
                if (video.paused) {
                    safePlayVideo(video);
                    spot.isPaused = false;
                } else {
                    video.pause();
                    spot.isPaused = true;
                }
            }
        };

        const updateVideoProgress = (e, spot) => {
            if (spot.isScrubbing) return;
            const v = e.target;
            if (v.duration) {
                spot.progress = (v.currentTime / v.duration) * 100;
            }
        };

        const startScrub = (event, spot) => {
            const idx = spotiniList.value.indexOf(spot);
            const video = document.getElementById('spotino-video-' + idx);
            if (!video || !video.duration) return;

            spot.isScrubbing = true;
            seekToPosition(event, spot, video);

            const onMove = (e) => seekToPosition(e, spot, video);
            const onEnd = () => {
                spot.isScrubbing = false;
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onEnd);
                window.removeEventListener('touchmove', onMove);
                window.removeEventListener('touchend', onEnd);
            };

            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onEnd);
            window.addEventListener('touchmove', onMove, { passive: false });
            window.addEventListener('touchend', onEnd);
        };

        const seekToPosition = (event, spot, video) => {
            const track = document.getElementById('scrubber-' + spot.id);
            if (!track) return;

            const rect = track.getBoundingClientRect();
            const clientX = event.touches ? event.touches[0].clientX : event.clientX;
            let pos = (clientX - rect.left) / rect.width;
            pos = Math.max(0, Math.min(1, pos));

            spot.progress = pos * 100;
            video.currentTime = pos * video.duration;
        };

        const openCommentsDrawer = (spot) => {
            drawerComments.value.currentSpot = spot;
            drawerComments.value.newCommentText = '';
            drawerComments.value.isSubmitting = false;
            drawerComments.value.show = true;
        };

        const submitDrawerComment = async () => {
            const spot = drawerComments.value.currentSpot;
            const text = (drawerComments.value.newCommentText || '').trim();
            if (!spot || !text) return;

            drawerComments.value.isSubmitting = true;
            spot.newComment = text;

            try {
                await postActions.addComment(spot);
                drawerComments.value.newCommentText = '';
            } catch (err) {
                console.error("Errore invio commento Spotino:", err);
            } finally {
                drawerComments.value.isSubmitting = false;
            }
        };

        const handleSaveCommentEdit = async (spot, comment, cIdx) => {
            await postActions.saveCommentEdit(spot, comment, cIdx);
        };

        const handleDeleteComment = async (spot, cIdx) => {
            await postActions.deleteComment(spot, cIdx);
        };

        const quickFollow = async (spot) => {
            const targetUid = spot.data.user;
            if (!session.value.uid || targetUid === session.value.uid) return;
            try {
                await window.db.collection("users").doc(session.value.uid).update({
                    following: firebase.firestore.FieldValue.arrayUnion(targetUid)
                });
                spot.isFollowing = true;
                if (window.FeedAlgorithm?.followingList) {
                    window.FeedAlgorithm.followingList.push(targetUid);
                }
            } catch (e) {
                console.error("Errore segui rapido:", e);
            }
        };

        const triggerReportFromOptions = (targetSpot) => {
            if (targetSpot) {
                openReportModal(targetSpot, targetSpot.authorProfile?.username || '');
            }
        };

        const triggerEditFromOptions = (targetSpot) => {
            if (targetSpot) {
                editManager.openEditModal(targetSpot);
            }
        };

        const deleteSpotino = async (spot) => {
            await postActions.confirmDelete(spot.id);
        };

        const setupInfiniteScroll = () => {
            if (scrollObserver) scrollObserver.disconnect();
            if (!sentinelRef.value) return;
            
            scrollObserver = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && !isFetching && !isInitialLoading.value) {
                    fetchSpotini();
                }
            }, { 
                root: containerRef.value, 
                rootMargin: '250px', 
                threshold: 0.1 
            });
            
            scrollObserver.observe(sentinelRef.value);
        };

        onMounted(() => {
            const handleLanguageSwitch = async (event) => {
                const newLang = event?.detail?.lang || localStorage.getItem('selectedLanguage') || 'it';
                currentLang.value = newLang;
                await initSpotiniTranslations();
            };

            window.addEventListener('languageChanged', handleLanguageSwitch);
            window.addEventListener('storage', (e) => {
                if (e.key === 'selectedLanguage') handleLanguageSwitch();
            });

            document.addEventListener('click', closeOptions);

            const checkInit = setInterval(async () => {
                if (window.db && window.Spottio) {
                    clearInterval(checkInit);
                    session.value = window.Spottio.getSession();
                    if (window.FeedAlgorithm) await window.FeedAlgorithm.loadPreferences();
                    await fetchSpotini();
                    setupInfiniteScroll();
                }
            }, 150);
        });

        onUnmounted(() => {
            document.removeEventListener('click', closeOptions);
            if (scrollObserver) scrollObserver.disconnect();
            if (cardObserver) cardObserver.disconnect();
        });

        return {
            feedMode, isInitialLoading, isLoadingMore, spotiniList, emptyMessage, sentinelRef, containerRef,
            isMuted, currentIndex, session, drawerComments, modals, activeOptionsSpotId,
            formatCounter, toggleGlobalMute, switchFeedMode, handleScreenTap, 
            startScrub, updateVideoProgress, openLikesModal, openCommentsDrawer, 
            submitDrawerComment, handleSaveCommentEdit, handleDeleteComment, quickFollow,
            toggleOptions, closeOptions, triggerReportFromOptions, 
            triggerEditFromOptions, canManageSpot, deleteSpotino, 
            reportModal, openReportModal, submitReport,
            editManager, openEditModal: editManager.openEditModal, translateText,
            sharePost: postActions.sharePost, toggleLike: postActions.toggleLike,
            getUserAvatarHtml: (uri, name, cls, isGrp, hasSt) => window.Spottio?.getAvatarHtml(uri, name, cls, isGrp, hasSt) || '',
            getVerifiedBadge: () => window.Spottio?.getVerifiedBadge(true, "w-3.5 h-3.5 text-blue-500 inline-block align-middle") || '',
            formatTime: (ts) => window.Spottio?.formatTimestamp(ts) || ''
        };
    }
});

window.SpottioComposables.registerComponents(spotiniApp);

initSpotiniTranslations().finally(() => {
    spotiniApp.mount('#vue-spotini-app');
});