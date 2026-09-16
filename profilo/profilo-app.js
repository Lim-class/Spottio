// profilo/profilo-app.js
import { initProfileTranslations } from './lingue/profilo-i18n.js';

const { createApp, ref, computed, onMounted, nextTick } = Vue;

const app = createApp({
    setup() {
        const currentUid = ref(window.Spottio.getCurrentUid() || '');
        const session = ref(window.Spottio.getSession());
        const currentUsername = computed(() => session.value.username);
        
        const { currentLang, translateText } = window.Spottio.useLanguageSync(async () => {
            await initProfileTranslations();
        });

        const userData = ref({
            username: '', bio: '', userPfUri: '', profileImage: '', isVerified: false, 
            followers: [], following: [], pending_follows: []
        });

        const editMode = ref('');
        const formUsername = ref('');
        const formBio = ref('');
        const usernameInputRef = ref(null);
        const bioInputRef = ref(null);
        const statusMessage = ref({ text: '', className: '' });
        const fileInputRef = ref(null);

        const showAvatarActionModal = ref(false);

        const showUsersModal = ref(false);
        const modalTitle = ref('');
        const modalUsersList = ref([]);
        const loadingUsersModal = ref(false);

        const showFollowRequestsModal = ref(false);
        const pendingRequestsList = ref([]);
        const loadingRequests = ref(false);
        const pendingRequestsCount = computed(() => (userData.value.pending_follows ? userData.value.pending_follows.length : 0));

        // Condivisione Profilo & QR Code
        const showShareModal = ref(false);
        const qrContainerRef = ref(null);
        const linkCopied = ref(false);

        // Post
        const posts = ref([]);
        const postsLoading = ref(false);
        const postsCount = ref(0);

        // Composables
        const { likesModal, openLikesModal } = window.SpottioComposables.useLikesModal();
        const { reportModal, openReportModal, submitReport } = window.SpottioComposables.useReportModal({ session });
        const { likedCount: likedPostsCount, likedModal, initLikedListener, openLikedModal } = window.SpottioComposables.useLikedSpotsModal({
            targetUid: currentUid
        });

        const postActions = window.SpottioComposables.usePostInteractions({
            session, posts, refreshAlgorithm: false, 
            onDeleteCallback: () => { postsCount.value = posts.value.length; }
        });
        
        const editManager = window.SpottioComposables.useEditPostModal({ posts });

        const modals = ref({
            report: reportModal,
            likes: likesModal,
            flashspot: { show: false, userIndex: 0, stories: [], author: null, currentIndex: 0, progress: 0, timer: null, progressInterval: null }
        });

        const flashspotViewer = window.SpottioComposables.useFlashspotViewer({ 
            modals, activeStories: null, session, onStoryDeleted: () => loadHighlightStories(currentUid.value)
        });

        const {
            activeStories,
            highlightFolders,
            highlightFolderKeys,
            loadHighlightStories,
            getFolderCover,
            openHighlightViewer
        } = window.SpottioComposables.useHighlightFolders({ flashspotViewer });

        const onOpenHighlightFolder = (folderName) => {
            openHighlightViewer(folderName, userData.value);
        };

        // Apertura diretta del Flashspot al click sull'avatar del post
        const openAuthorFlashspot = (post) => {
            if (activeStories.value.length > 0) {
                flashspotViewer.openFlashspotViewer(0, activeStories.value, { profile: userData.value });
            } else {
                handleAvatarClick();
            }
        };

        const formatTime = (ts) => window.Spottio?.formatTimestamp(ts) || '';
        const getUserAvatarHtml = (uri, name, cls, isGrp, hasSt) => window.Spottio?.getAvatarHtml(uri, name, cls, isGrp, hasSt) || '';

        const getProfileUrl = () => {
            const url = new URL('../utente/utente.html', window.location.href);
            url.searchParams.set('uid', currentUid.value);
            return url.href;
        };

        const renderQRCode = async () => {
            await nextTick();
            if (!qrContainerRef.value) return;
            qrContainerRef.value.innerHTML = '';

            const profileUrl = getProfileUrl();

            if (typeof QRCode === 'undefined') {
                console.error("Libreria QRCode non caricata.");
                return;
            }

            new QRCode(qrContainerRef.value, {
                text: profileUrl,
                width: 192,
                height: 192,
                colorDark: "#1e293b",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });

            setTimeout(() => {
                if (!qrContainerRef.value) return;
                const canvas = qrContainerRef.value.querySelector('canvas');
                if (!canvas) return;

                const ctx = canvas.getContext('2d');
                const logo = new Image();
                logo.crossOrigin = 'anonymous';
                logo.src = window.Spottio.DEFAULT_APP_LOGO;

                logo.onload = () => {
                    const logoSize = canvas.width * 0.24;
                    const x = (canvas.width - logoSize) / 2;
                    const y = (canvas.height - logoSize) / 2;

                    ctx.beginPath();
                    ctx.arc(canvas.width / 2, canvas.height / 2, (logoSize / 2) + 3, 0, 2 * Math.PI);
                    ctx.fillStyle = '#ffffff';
                    ctx.fill();

                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 2, 0, 2 * Math.PI);
                    ctx.clip();
                    ctx.drawImage(logo, x, y, logoSize, logoSize);
                    ctx.restore();

                    const imgElem = qrContainerRef.value.querySelector('img');
                    if (imgElem) {
                        imgElem.src = canvas.toDataURL("image/png");
                    }
                };
            }, 150);
        };

        const openShareModal = () => {
            linkCopied.value = false;
            showShareModal.value = true;
            renderQRCode();
        };

        const copyProfileLink = async () => {
            try {
                await navigator.clipboard.writeText(getProfileUrl());
                linkCopied.value = true;
                setTimeout(() => { linkCopied.value = false; }, 2500);
            } catch (e) {
                alert("Impossibile copiare il link negli appunti.");
            }
        };

        const shareProfileNative = async () => {
            if (!qrContainerRef.value) return;
            const canvas = qrContainerRef.value.querySelector('canvas');
            if (!canvas) return;

            canvas.toBlob(async (blob) => {
                if (!blob) return;
                const fileName = `${userData.value.username || 'profilo'}-spottio-qr.png`;
                const file = new File([blob], fileName, { type: 'image/png' });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            title: `Profilo Spottio di @${userData.value.username}`,
                            text: `Scansiona il QR Code o visita il profilo: ${getProfileUrl()}`,
                            files: [file]
                        });
                    } catch (err) {
                        if (err.name !== 'AbortError') console.error("Errore condivisione:", err);
                    }
                } else {
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = fileName;
                    a.click();
                    URL.revokeObjectURL(a.href);
                }
            }, 'image/png');
        };

        const toggleLikeFromLikedModal = async (lp) => {
            await postActions.toggleLike(lp);
            likedModal.value.list = likedModal.value.list.filter(p => p.id !== lp.id);
            const match = posts.value.find(p => p.id === lp.id);
            if (match) match.hasLiked = false;
        };

        const loadUserData = () => {
            window.Spottio.listenToUserProfile(currentUid.value, currentUsername.value, (data, exists) => {
                if (exists) {
                    userData.value = data;
                    if (!editMode.value) {
                        formUsername.value = data.username;
                        formBio.value = data.bio;
                    }
                }
            });
        };

        const loadUserPostsVue = async () => {
            postsLoading.value = true;
            posts.value = await window.SpottioComposables.fetchUserPosts(currentUid.value, session.value.username, session.value.uid);
            postsCount.value = posts.value.length;
            postsLoading.value = false;
        };

        const openFollowRequestsModal = async () => {
            showFollowRequestsModal.value = true;
            loadingRequests.value = true;
            pendingRequestsList.value = [];

            const reqUids = userData.value.pending_follows || [];
            if (reqUids.length === 0) {
                loadingRequests.value = false;
                return;
            }

            pendingRequestsList.value = await window.Spottio.resolveUsersList(reqUids, session.value.uid);
            loadingRequests.value = false;
        };

        const acceptFollowRequest = async (reqUser) => {
            try {
                await window.Spottio.relationships.acceptFollowRequest(currentUid.value, reqUser.uid);
                pendingRequestsList.value = pendingRequestsList.value.filter(u => u.uid !== reqUser.uid);
            } catch (err) { alert("Impossibile accettare la richiesta."); }
        };

        const rejectFollowRequest = async (reqUser) => {
            try {
                await window.Spottio.relationships.rejectFollowRequest(currentUid.value, reqUser.uid);
                pendingRequestsList.value = pendingRequestsList.value.filter(u => u.uid !== reqUser.uid);
            } catch (err) { alert("Impossibile rifiutare la richiesta."); }
        };

        const userAvatarUrl = computed(() => userData.value.userPfUri || userData.value.profileImage || "");
        const avatarClasses = computed(() => window.Spottio.getAvatarClasses(activeStories.value.length > 0, false));

        const handleAvatarClick = () => {
            if (activeStories.value.length > 0) showAvatarActionModal.value = true;
            else if (fileInputRef.value) fileInputRef.value.click();
        };

        const handleAvatarChoice = (action) => {
            showAvatarActionModal.value = false;
            if (action === 'view') flashspotViewer.openFlashspotViewer(0, activeStories.value, { profile: userData.value });
            else if (action === 'change' && fileInputRef.value) fileInputRef.value.click();
        };

        const onAvatarFileSelected = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const res = await window.Spottio.uploadToCloudinary(file, 'w_300,h_300,c_fill,f_auto,q_auto');
                await window.db.collection("users").doc(currentUid.value).update({ userPfUri: res.url });
                userData.value.userPfUri = res.url;
            } catch (err) { alert("Errore caricamento immagine"); }
        };

        // Gestione modifiche inline
        const startEdit = async (mode) => {
            editMode.value = mode;
            if (mode === 'username') formUsername.value = userData.value.username || '';
            if (mode === 'bio') formBio.value = userData.value.bio || '';

            await nextTick();
            if (mode === 'username' && usernameInputRef.value) {
                usernameInputRef.value.focus();
                usernameInputRef.value.select();
            } else if (mode === 'bio' && bioInputRef.value) {
                bioInputRef.value.focus();
            }
        };

        const cancelEdit = () => {
            editMode.value = '';
        };

        const saveProfileChanges = async () => {
            if (editMode.value === 'bio') {
                const newBio = formBio.value.trim();
                await window.db.collection("users").doc(currentUid.value).update({ bio: newBio });
                userData.value.bio = newBio;
                editMode.value = '';
            } else if (editMode.value === 'username') {
                const newU = formUsername.value.trim();
                if (!newU) return;
                await window.db.collection("users").doc(currentUid.value).update({ username: newU });
                localStorage.setItem('currentUser', newU);
                userData.value.username = newU;
                editMode.value = '';
                await loadUserPostsVue();
            }
        };

        const openUsersModal = async (type) => {
            modalTitle.value = type === 'followers' 
                ? translateText('yourFollowersTitle', 'I tuoi Follower') 
                : translateText('followingUsersTitle', 'Utenti Seguiti');
            showUsersModal.value = true; 
            loadingUsersModal.value = true; 
            modalUsersList.value = [];
            
            const arr = type === 'followers' ? userData.value.followers : userData.value.following;
            modalUsersList.value = await window.Spottio.resolveUsersList(arr, session.value.uid); 
            loadingUsersModal.value = false;
        };

        const goToUserProfile = (uid) => window.Spottio.navigateToUserProfile(uid);

        const unfollowUserFromModal = async (targetUid) => {
            if (!confirm(translateText('confirmUnfollow', 'Vuoi smettere di seguire questo utente?'))) return;
            try {
                await window.Spottio.relationships.unfollow(currentUid.value, targetUid);
                userData.value.following = userData.value.following.filter(id => id !== targetUid);
                modalUsersList.value = modalUsersList.value.filter(u => u.uid !== targetUid);
            } catch (e) { console.error("Errore unfollow:", e); }
        };

        const removeFollowerFromModal = async (followerUid) => {
            if (!confirm(translateText('confirmRemoveFollower', 'Vuoi rimuovere questo follower? Non riceverà alcuna notifica.'))) return;
            try {
                await window.Spottio.relationships.removeFollower(currentUid.value, followerUid);
                userData.value.followers = userData.value.followers.filter(id => id !== followerUid);
                modalUsersList.value = modalUsersList.value.filter(u => u.uid !== followerUid);
            } catch (e) { console.error("Errore rimozione follower:", e); }
        };

        const { verifiedBadgeIcon, verifiedBadgeIconSmall } = window.Spottio.useVerifiedBadges();

        onMounted(() => {
            window.Spottio.onAuthReady(async (user) => {
                if (user) {
                    currentUid.value = user.uid;
                    session.value = window.Spottio.getSession();
                    
                    loadUserData();
                    await loadHighlightStories(user.uid);
                    await loadUserPostsVue();
                    initLikedListener(user.uid);
                } else {
                    window.location.href = "../index.html";
                }
            });
        });

        return {
            session, currentLang,
            userData, editMode, formUsername, formBio, usernameInputRef, bioInputRef, statusMessage, fileInputRef,
            userAvatarUrl, avatarClasses, handleAvatarClick,
            showAvatarActionModal, handleAvatarChoice, onAvatarFileSelected,
            startEdit, cancelEdit, saveProfileChanges, translateText,
            highlightFolderKeys, getFolderCover, onOpenHighlightFolder,
            posts, postsLoading, postsCount, formatTime, getUserAvatarHtml,
            openLikesModal, modals,
            openReportModal, submitReport,
            showUsersModal, modalTitle, modalUsersList, loadingUsersModal, openUsersModal,
            goToUserProfile, unfollowUserFromModal, removeFollowerFromModal,
            showFollowRequestsModal, pendingRequestsList, loadingRequests, pendingRequestsCount,
            openFollowRequestsModal, acceptFollowRequest, rejectFollowRequest,
            showShareModal, qrContainerRef, linkCopied,
            openShareModal, copyProfileLink, shareProfileNative,
            verifiedBadgeIcon, verifiedBadgeIconSmall,
            likedPostsCount, likedModal, openLikedModal, toggleLikeFromLikedModal,
            editManager, openEditModal: editManager.openEditModal,
            openAuthorFlashspot,
            ...postActions, ...flashspotViewer
        };
    }
});

window.SpottioComposables.registerComponents(app);

initProfileTranslations().finally(() => {
    app.mount('#vue-profile-app');
});