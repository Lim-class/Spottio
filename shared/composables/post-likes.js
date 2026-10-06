// shared/composables/post-likes.js
window.SpottioComposables = window.SpottioComposables || {};

// 1. Modale chi ha messo like a un post (Risoluzione tramite UID)
window.SpottioComposables.useLikesModal = function() {
    const { ref } = Vue;
    const likesModal = ref({ show: false, loading: false, list: [] });

    const openLikesModal = async (likesArr) => {
        likesModal.value.show = true;
        likesModal.value.loading = true;
        likesModal.value.list = [];

        const uniqueLikes = Array.from(new Set(likesArr || []));
        const resolvedList = [];

        for (let identifier of uniqueLikes) {
            if (!identifier) continue;
            let userUid = String(identifier).trim();
            let username = userUid;
            let avatarUrl = '';
            let isVerified = false;

            try {
                // 1. Risoluzione diretta per UID
                let prof = window.Spottio?.getUserProfile ? await window.Spottio.getUserProfile(userUid) : null;
                
                if (prof && prof.username && prof.username !== userUid) {
                    username = prof.username.replace(/^@/, '');
                    avatarUrl = prof.userPfUri || '';
                    isVerified = prof.isVerified || false;
                } else if (window.db) {
                    // Controllo diretto su Firestore documento utente per ID
                    let docSnap = await window.db.collection("users").doc(userUid).get();
                    
                    if (docSnap.exists) {
                        const data = docSnap.data();
                        username = (data.username || userUid).replace(/^@/, '');
                        avatarUrl = data.userPfUri || data.profileImage || '';
                        isVerified = data.isVerified === true;
                    } else {
                        // Fallback per vecchi like memorizzati con l'username invece dell'UID
                        const cleanName = userUid.replace(/^@/, '');
                        const qSnap = await window.db.collection("users").where("username", "==", cleanName).limit(1).get();
                        if (!qSnap.empty) {
                            const dSnap = qSnap.docs[0];
                            const dData = dSnap.data();
                            userUid = dSnap.id;
                            username = (dData.username || cleanName).replace(/^@/, '');
                            avatarUrl = dData.userPfUri || dData.profileImage || '';
                            isVerified = dData.isVerified === true;
                        }
                    }
                }
            } catch (err) {
                console.error("Errore risoluzione utente like:", err);
            }

            resolvedList.push({ uid: userUid, username, userPfUri: avatarUrl, isVerified });
        }

        likesModal.value.list = resolvedList;
        likesModal.value.loading = false;
    };

    return { likesModal, openLikesModal };
};

// 2. Modale e contatore post piaciuti dall'utente (Sotto-raccolta liked_posts)
window.SpottioComposables.useLikedSpotsModal = function({ targetUid, isLocked = null }) {
    const { ref } = Vue;
    const likedCount = ref(0);
    const likedModal = ref({ show: false, loading: false, list: [] });
    let unsubscribe = null;

    const initListener = (uidParam) => {
        const uid = uidParam || (targetUid?.value || targetUid);
        if (!uid || !window.db) return;
        if (unsubscribe) unsubscribe();

        unsubscribe = window.db.collection("users").doc(uid).collection("liked_posts")
            .onSnapshot((snap) => {
                likedCount.value = snap.size;
            }, () => {
                likedCount.value = 0;
            });
    };

    const openLikedModal = async (uidParam) => {
        if (isLocked && isLocked.value) return;
        const uid = uidParam || (targetUid?.value || targetUid);
        if (!uid || !window.db) return;

        likedModal.value.show = true;
        likedModal.value.loading = true;
        likedModal.value.list = [];

        try {
            const subSnap = await window.db.collection("users").doc(uid).collection("liked_posts")
                .orderBy("likedAt", "desc")
                .get();

            const postIds = [];
            subSnap.forEach(d => postIds.push(d.id));

            if (!postIds.length) {
                likedModal.value.loading = false;
                return;
            }

            const postDocs = await Promise.all(postIds.map(id => window.db.collection("posts").doc(id).get()));
            const list = [];
            for (let pDoc of postDocs) {
                if (pDoc.exists) {
                    const pData = pDoc.data();
                    const authorProfile = await window.Spottio?.getUserProfile(pData.user);
                    list.push({ id: pDoc.id, data: pData, authorProfile, hasLiked: true });
                }
            }
            likedModal.value.list = list;
        } catch (e) {
            console.error("Errore recupero post piaciuti:", e);
        } finally {
            likedModal.value.loading = false;
        }
    };

    return { likedCount, likedModal, initLikedListener: initListener, openLikedModal };
};

// 3. Componente Modale Post Piaciuti
window.SpottioComposables.LikedSpotsModalComponent = {
    props: ['modal', 'isSelf', 'title'],
    emits: ['close', 'toggle-like', 'go-user'],
    methods: {
        formatTime: (ts) => window.Spottio?.formatTimestamp(ts) || '',
        getUserAvatarHtml: (uri, name) => window.Spottio?.getAvatarHtml(uri, name, 'w-8 h-8'),
        openMedia: (url) => { if (url) window.open(url, '_blank'); }
    },
    template: `
    <div v-if="modal.show" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" @click.self="$emit('close')">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            <div class="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                <div class="flex items-center gap-2">
                    <svg class="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                    <h3 class="text-lg font-bold text-gray-800">{{ title || 'Spot piaciuti' }} ({{ modal.list.length }})</h3>
                </div>
                <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 font-bold p-1">✕</button>
            </div>
            
            <div class="p-4 overflow-y-auto flex-grow flex flex-col gap-4 custom-scrollbar bg-gray-50/50">
                <div v-if="modal.loading" class="text-center text-gray-500 py-8 animate-pulse font-semibold text-sm">Caricamento post piaciuti...</div>
                <div v-else-if="!modal.list.length" class="text-center text-gray-500 py-8 text-sm">Nessun post piaciuto registrato.</div>
                
                <div v-else v-for="lp in modal.list" :key="lp.id" class="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-2">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2 cursor-pointer" @click="$emit('go-user', lp.data?.user)">
                            <div v-html="getUserAvatarHtml(lp.authorProfile?.userPfUri, lp.authorProfile?.username)"></div>
                            <div>
                                <span class="font-bold text-xs text-gray-800 block leading-tight hover:underline">{{ lp.authorProfile?.username || 'Utente' }}</span>
                                <span class="text-[10px] text-gray-400">{{ formatTime(lp.data?.timestamp) }}</span>
                            </div>
                        </div>
                        <button v-if="isSelf" @click="$emit('toggle-like', lp)" class="text-red-500 hover:text-gray-400 transition p-1" title="Rimuovi dai preferiti">
                            <svg class="w-5 h-5" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                        </button>
                    </div>
                    <p class="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{{ lp.data?.text }}</p>
                    <div v-if="lp.data?.mediaList?.length" class="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                        <template v-for="media in lp.data.mediaList" :key="media.url">
                            <video v-if="media.isVideo" :src="media.url" controls class="max-h-36 rounded-lg bg-black object-contain"></video>
                            <img v-else :src="media.url" @click="openMedia(media.url)" class="max-h-36 rounded-lg object-contain bg-black cursor-pointer">
                        </template>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `
};