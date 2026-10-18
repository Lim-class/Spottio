// utente/utente.js - Profilo Pubblico Utente
import { initUserTranslations } from './lingue/utente-i18n.js';

const { createApp, ref, computed, onMounted } = Vue;

const app = createApp({
    setup() {
        const urlParams = new URLSearchParams(window.location.search);
        const queryUid = urlParams.get('uid');
        if (queryUid) {
            localStorage.setItem('currentUserProfileId', queryUid);
        }

        const profileUid = ref(queryUid || localStorage.getItem('currentUserProfileId') || '');
        const session = ref(window.Spottio.getSession());

        const { currentLang, translateText } = window.Spottio.useLanguageSync(async () => {
            await initUserTranslations();
        });

        const userData = ref({
            username: '', bio: '', userPfUri: '', profileImage: '',
            isVerified: false, isPrivate: false,
            followers: [], following: [], pending_follows: []
        });

        const isFollowLoading = ref(false);
        const postsLoading = ref(false);
        const postsCount = ref(0);

        const showUsersModal = ref(false);
        const modalTitle = ref('');
        const modalUsersList = ref([]);
        const loadingUsersModal = ref(false);

        const posts = ref([]);

        const isPrivateLocked = computed(() => {
            if (!userData.value.isPrivate) return false;
            if (session.value.uid === profileUid.value) return false;
            return !(userData.value.followers || []).includes(session.value.uid);
        });

        const { likesModal, openLikesModal } = window.SpottioComposables.useLikesModal();
        const { reportModal, openReportModal, submitReport } = window.SpottioComposables.useReportModal({ session });
        const { likedCount: likedPostsCount, likedModal, initLikedListener, openLikedModal } = window.SpottioComposables.useLikedSpotsModal({
            targetUid: profileUid,
            isLocked: isPrivateLocked
        });

        const postActions = window.SpottioComposables.usePostInteractions({
            session, posts, refreshAlgorithm: true, onDeleteCallback: () => { postsCount.value = posts.value.length; }
        });
        const editManager = window.SpottioComposables.useEditPostModal({ posts });

        const modals = ref({
            likes: likesModal,
            report: reportModal,
            flashspot: { show: false, stories: [], currentIndex: 0, progress: 0, timer: null, progressInterval: null }
        });

        const flashspotViewer = window.SpottioComposables.useFlashspotViewer({ 
            modals, activeStories: null, session, onStoryDeleted: () => loadHighlightStories(profileUid.value)
        });

        const {
            activeStories,
            highlightFolders,
            highlightFolderKeys,
            loadHighlightStories,
            getFolderCover,
            openHighlightViewer,
            resetHighlights
        } = window.SpottioComposables.useHighlightFolders({ flashspotViewer });

        const onOpenHighlightFolder = (folderName) => {
            if (isPrivateLocked.value) return;
            openHighlightViewer(folderName, userData.value);
        };

        // Click sull'avatar dell'autore del post: se ha storie attive le mostra nel viewer
        const openAuthorFlashspot = (post) => {
            if (isPrivateLocked.value) return;
            if (activeStories.value.length > 0) {
                flashspotViewer.openFlashspotViewer(0, activeStories.value, { profile: userData.value });
            }
        };

        const formatTime = (ts) => window.Spottio?.formatTimestamp(ts) || '';
        const getUserAvatarHtml = (uri, name, cls, isGrp, hasSt) => window.Spottio?.getAvatarHtml(uri, name, cls, isGrp, hasSt) || '';

        onMounted(() => {
            const checkDb = setInterval(async () => {
                if (window.db && window.Spottio) {
                    clearInterval(checkDb);
                    session.value = window.Spottio.getSession();
                    if (!profileUid.value) return;
                    listenUserData();
                    initLikedListener(profileUid.value);
                }
            }, 200);
        });

        const listenUserData = () => {
            window.Spottio.listenToUserProfile(profileUid.value, 'Utente Sconosciuto', async (data, exists) => {
                if (!exists) return;
                userData.value = data;

                if (!isPrivateLocked.value) {
                    await loadUserPosts();
                    await loadHighlightStories(profileUid.value);
                } else {
                    posts.value = [];
                    postsCount.value = 0;
                    likedPostsCount.value = 0;
                    resetHighlights();
                }
            });
        };

        const showFollowBtn = computed(() => {
            return session.value.uid && session.value.uid !== profileUid.value && session.value.uid !== 'null';
        });

        const isFollowing = computed(() => (userData.value.followers || []).includes(session.value.uid));
        const isPending = computed(() => (userData.value.pending_follows || []).includes(session.value.uid));

        const followBtnText = computed(() => {
            if (isFollowing.value) return translateText('followingBtn', 'Seguito');
            if (isPending.value) return translateText('pendingBtn', 'In attesa');
            return translateText('followBtn', 'Segui');
        });

        const followBtnClass = computed(() => {
            if (isFollowing.value) {
                return "px-4 py-1.5 rounded-full text-xs font-bold text-gray-700 bg-gray-100 hover:bg-red-50 hover:text-red-600 transition shadow-sm cursor-pointer shrink-0";
            }
            if (isPending.value) {
                return "px-4 py-1.5 rounded-full text-xs font-bold text-gray-900 bg-yellow-300 hover:bg-yellow-400 transition shadow-sm cursor-pointer shrink-0";
            }
            return "px-4 py-1.5 rounded-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm cursor-pointer shrink-0";
        });

        const toggleFollow = async () => {
            if (!session.value.uid || session.value.uid === 'null') {
                return alert(translateText('loginToFollow', "Effettua il login per seguire l'utente."));
            }
            isFollowLoading.value = true;

            try {
                await window.Spottio.relationships.toggleFollow(
                    session.value.uid,
                    profileUid.value,
                    isFollowing.value,
                    isPending.value,
                    userData.value.isPrivate
                );
            } catch (err) {
                console.error("Errore update follow:", err);
            } finally {
                isFollowLoading.value = false;
            }
        };

        const loadUserPosts = async () => {
            postsLoading.value = true;
            // Passa session.value.uid per garantire la verifica della privacy
            posts.value = await window.SpottioComposables.fetchUserPosts(profileUid.value, session.value.username, session.value.uid);
            postsCount.value = posts.value.length;
            postsLoading.value = false;
        };

        const handleAvatarClick = () => {
            if (isPrivateLocked.value) return;
            if (activeStories.value.length > 0) {
                flashspotViewer.openFlashspotViewer(0, activeStories.value, { profile: userData.value });
            }
        };

        const userAvatarUrl = computed(() => {
            if (isPrivateLocked.value) {
                return "";
            }
            return userData.value.userPfUri || userData.value.profileImage || "";
        });
        
        const avatarClasses = computed(() => window.Spottio.getAvatarClasses(activeStories.value.length > 0, isPrivateLocked.value));

        const openUsersModal = async (type) => {
            if (isPrivateLocked.value) return;

            modalTitle.value = type === 'followers' 
                ? translateText('yourFollowersTitle', 'Follower') 
                : translateText('followingUsersTitle', 'Seguiti');
            showUsersModal.value = true;
            loadingUsersModal.value = true;
            modalUsersList.value = [];

            const userUids = type === 'followers' ? (userData.value.followers || []) : (userData.value.following || []);
            if (userUids.length === 0) {
                loadingUsersModal.value = false;
                return;
            }

            modalUsersList.value = await window.Spottio.resolveUsersList(userUids, session.value.uid);
            loadingUsersModal.value = false;
        };

        const goToUserProfile = (uid) => window.Spottio.navigateToUserProfile(uid);

        const { verifiedBadgeIcon, verifiedBadgeIconSmall } = window.Spottio.useVerifiedBadges();

        return {
            profileUid, session, currentLang, userData, isPrivateLocked, showFollowBtn,
            isFollowLoading, followBtnText, followBtnClass, toggleFollow,
            posts, postsLoading, postsCount, formatTime, getUserAvatarHtml,
            openReportModal, submitReport, openLikesModal, modals,
            highlightFolderKeys, getFolderCover, onOpenHighlightFolder, handleAvatarClick,
            userAvatarUrl, avatarClasses, showUsersModal,
            modalTitle, modalUsersList, loadingUsersModal, openUsersModal, goToUserProfile,
            verifiedBadgeIcon, verifiedBadgeIconSmall,
            translateText,
            likedPostsCount, likedModal, openLikedModal,
            editManager, openEditModal: editManager.openEditModal,
            openAuthorFlashspot,
            ...postActions, ...flashspotViewer
        };
    }
});

window.SpottioComposables.registerComponents(app);

initUserTranslations().finally(() => {
    app.mount('#vue-user-app');
});