// =========================================================================
// FILE: shared/js/shared-post-utils.js
// Entry point modulare per le utilità dei Post, Fetch condiviso e Componenti UI
// =========================================================================

window.SpottioComposables = window.SpottioComposables || {};

const REPORT_REASON_SCORES = {
    harassment: 8,
    spam: 4,
    inappropriate: 10,
    copyright: 6,
    gdpr: 6,
    other: 2
};

// Modale di segnalazione condivisa
window.SpottioComposables.useReportModal = function({ session }) {
    const { ref } = Vue;
    const reportModal = ref({ 
        show: false, 
        postId: '', 
        reason: '', 
        desc: '', 
        description: '', 
        author: '', 
        authorUid: '', 
        isSubmitting: false 
    });

    const openReportModal = (post, authorName = '') => {
        const pData = post.data || post;
        const targetPostId = post.id || pData.id || '';
        const targetAuthorUid = pData.user || post.user || '';
        const targetAuthorName = authorName || post.authorProfile?.username || pData.username || targetAuthorUid;

        reportModal.value = {
            show: true,
            postId: targetPostId,
            reason: '',
            desc: '',
            description: '',
            author: targetAuthorName,
            authorUid: targetAuthorUid,
            isSubmitting: false
        };
    };

    const submitReport = async () => {
        const r = reportModal.value;
        if (!r.reason) {
            alert("Seleziona un motivo per la segnalazione.");
            return;
        }

        r.isSubmitting = true;
        try {
            const finalDesc = r.description || r.desc || '';
            const dbInstance = window.db || firebase.firestore();
            const currentUid = session.value?.uid || (window.Spottio ? window.Spottio.getCurrentUid() : '') || localStorage.getItem('currentUid') || '';
            const currentUsername = session.value?.username || localStorage.getItem('currentUser') || 'Anonimo';
            const penaltyPoints = REPORT_REASON_SCORES[r.reason] || 4;

            await dbInstance.collection("reports").add({
                postId: r.postId || 'profilo_utente',
                reason: r.reason,
                description: finalDesc,
                reportedBy: currentUid,
                reportedUsername: currentUsername,
                author: r.author || '',
                authorUid: r.authorUid || '',
                postAuthor: r.author || '',
                reporterUid: currentUid,
                reporterUser: currentUsername,
                authorScore: penaltyPoints,
                riskScore: penaltyPoints,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            r.show = false;
            alert("Segnalazione inviata con successo. La esamineremo al più presto.");
        } catch (e) {
            console.error("Errore invio segnalazione:", e);
            alert("Errore durante l'invio della segnalazione. Riprova più tardi.");
        } finally {
            r.isSubmitting = false;
        }
    };

    return { reportModal, openReportModal, submitReport };
};

// Query Post Utente Centralizzata (Inclusi i post in cui si è Co-Autori)
window.SpottioComposables.fetchUserPosts = async function(targetUid, viewerUsername, viewerUid = null) {
    if (!targetUid || !window.db) return [];
    try {
        const now = Date.now();
        const loadedPostsMap = new Map();

        const ownPostsPromise = window.db.collection('posts')
            .where('user', '==', targetUid)
            .get();

        const coAuthoredPromise = window.db.collection('posts')
            .where('coAuthors', 'array-contains', targetUid)
            .get();

        const [ownSnap, coSnap] = await Promise.all([ownPostsPromise, coAuthoredPromise]);

        const processDoc = (doc) => {
            if (loadedPostsMap.has(doc.id)) return;
            const d = doc.data();
            if (d.type !== 'flashspot' && d.type !== 'story') {
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
                    loadedPostsMap.set(doc.id, { id: doc.id, data: d });
                }
            }
        };

        ownSnap.forEach(processDoc);
        coSnap.forEach(processDoc);

        const loadedPosts = Array.from(loadedPostsMap.values());
        
        loadedPosts.sort((a, b) => {
            const timeA = a.data.timestamp?.toMillis ? a.data.timestamp.toMillis() : (a.data.timestamp ? new Date(a.data.timestamp).getTime() : 0);
            const timeB = b.data.timestamp?.toMillis ? b.data.timestamp.toMillis() : (b.data.timestamp ? new Date(b.data.timestamp).getTime() : 0);
            return timeB - timeA;
        });

        return await window.SpottioComposables.parsePostList(loadedPosts, viewerUsername, viewerUid);
    } catch (err) {
        console.error("Errore fetchUserPosts:", err);
        return [];
    }
};

// 1. Componente Singola Card Spot
window.SpottioComposables.SpotCardComponent = {
    props: {
        post: { type: Object, required: true },
        session: { type: Object, required: true },
        sharedPostId: { type: String, default: null },
        t: { type: Function, default: (k, d) => d },
        formatTime: { type: Function, default: (ts) => window.Spottio?.formatTimestamp(ts) || '' },
        getUserAvatarHtml: { type: Function, default: (u, n, c, g, s) => window.Spottio?.getAvatarHtml(u, n, c, g, s) || '' },
        getVerifiedBadge: { type: Function, default: () => window.Spottio?.getVerifiedBadge(true, "w-4 h-4 text-blue-500 ml-0.5 inline-block") || '' }
    },
    emits: [
        'toggle-like', 'open-likes', 'share-post', 'edit-post', 'delete-post', 
        'report-post', 'add-comment', 'save-comment-edit', 'delete-comment', 'scroll-carousel', 'open-media', 'open-author-story'
    ],
    setup(props) {
        const isMenuOpen = Vue.ref(false);
        const currentSlide = Vue.ref(0);

        const toggleMenu = (e) => {
            e.stopPropagation();
            isMenuOpen.value = !isMenuOpen.value;
        };

        const closeMenu = () => {
            isMenuOpen.value = false;
        };

        const onCarouselScroll = (e) => {
            const el = e.target;
            if (!el || !el.clientWidth) return;
            const newIndex = Math.round(el.scrollLeft / el.clientWidth);
            if (newIndex !== currentSlide.value) {
                currentSlide.value = newIndex;
            }
        };

        const goToSlide = (postId, targetIdx) => {
            const el = document.getElementById(`carousel-${postId}`);
            if (el) {
                el.scrollTo({ left: targetIdx * el.clientWidth, behavior: 'smooth' });
                currentSlide.value = targetIdx;
            }
        };

        const nextSlide = (postId) => {
            const total = props.post.data?.mediaList?.length || 1;
            if (currentSlide.value < total - 1) {
                goToSlide(postId, currentSlide.value + 1);
            }
        };

        const prevSlide = (postId) => {
            if (currentSlide.value > 0) {
                goToSlide(postId, currentSlide.value - 1);
            }
        };

        Vue.onMounted(() => {
            document.addEventListener('click', closeMenu);
        });

        Vue.onUnmounted(() => {
            document.removeEventListener('click', closeMenu);
        });

        return { 
            isMenuOpen, toggleMenu, closeMenu, 
            currentSlide, onCarouselScroll, goToSlide, nextSlide, prevSlide 
        };
    },
    computed: {
        isAuthorOrCoAuthor() {
            const myUid = this.session?.uid;
            if (!myUid) return false;
            if (this.post.data?.user === myUid) return true;
            if (this.post.data?.coAuthors && this.post.data.coAuthors.includes(myUid)) return true;
            return false;
        }
    },
    methods: {
        handleAvatarClick(userUid, hasStories, profile) {
            if (hasStories) {
                this.$emit('open-author-story', { data: { user: userUid }, authorProfile: profile });
            } else if (window.Spottio?.navigateToUserProfile && userUid) {
                window.Spottio.navigateToUserProfile(userUid);
            }
        },
        goToProfile(uid) {
            if (window.Spottio?.navigateToUserProfile && uid) {
                window.Spottio.navigateToUserProfile(uid);
            }
        }
    },
    template: `
    <div :class="['bg-white p-5 sm:p-6 rounded-3xl shadow-md border border-gray-100 transition duration-300 hover:shadow-lg w-full', sharedPostId === post.id ? 'ring-2 ring-blue-500' : '']">
        
        <!-- HEADER AUTORI CON AVATAR E MENU A 3 PUNTINI -->
        <div class="flex items-center justify-between mb-3.5">
            
            <div class="flex items-center min-w-0 pr-2">
                <!-- Gruppo Avatar: Autore Principale e Co-Autori -->
                <div class="flex items-center -space-x-3 mr-3 shrink-0">
                    <div @click="handleAvatarClick(post.data?.user, post.hasActiveStories, post.authorProfile)" 
                         class="cursor-pointer shrink-0 z-10 transition transform hover:scale-105" 
                         :title="post.authorProfile?.username">
                        <div v-html="getUserAvatarHtml(post.authorProfile?.userPfUri, post.authorProfile?.username, 'w-10 h-10', false, post.hasActiveStories)"></div>
                    </div>

                    <template v-if="post.coAuthorProfiles && post.coAuthorProfiles.length > 0">
                        <div v-for="(co, idx) in post.coAuthorProfiles" :key="co.uid" 
                             @click="handleAvatarClick(co.uid, co.hasActiveStories, co)"
                             class="cursor-pointer shrink-0 transition transform hover:scale-105"
                             :style="{ zIndex: 9 - idx }"
                             :title="co.username">
                            <div v-html="getUserAvatarHtml(co.userPfUri, co.username, 'w-10 h-10 border-2 border-white shadow-sm', false, co.hasActiveStories)"></div>
                        </div>
                    </template>
                </div>

                <!-- Testi Nomi Autori e Co-Autori (NON IN GRASSETTO ESTREMO: font-semibold normale) -->
                <div class="min-w-0">
                    <div class="flex items-center gap-1 flex-wrap">
                        <span @click="goToProfile(post.data?.user)" class="font-semibold text-gray-800 cursor-pointer hover:underline text-sm sm:text-base truncate">
                            {{ post.authorProfile?.username || t('anonymousUser', 'Anonimo') }}
                        </span>
                        <span v-if="post.authorProfile?.isVerified" v-html="getVerifiedBadge()"></span>

                        <template v-if="post.coAuthorProfiles && post.coAuthorProfiles.length > 0">
                            <span class="text-xs text-gray-400 font-normal">&</span>
                            <span v-for="(co, cIdx) in post.coAuthorProfiles" :key="co.uid" class="inline-flex items-center text-xs font-semibold text-gray-700">
                                <span @click="goToProfile(co.uid)" class="hover:underline cursor-pointer text-purple-700">@{{ co.username }}</span>
                                <span v-if="co.isVerified" v-html="getVerifiedBadge()"></span>
                                <span v-if="cIdx < post.coAuthorProfiles.length - 1" class="mr-1">,</span>
                            </span>
                        </template>
                    </div>
                    <p class="text-xs text-gray-400">{{ formatTime(post.data?.timestamp) }}</p>
                </div>
            </div>
            
            <!-- MENU A 3 PUNTINI -->
            <div class="relative shrink-0" @click.stop>
                <button @click="toggleMenu" class="text-gray-400 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition focus:outline-none cursor-pointer" title="Opzioni post">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 10a2 2 0 100 4 2 2 0 000-4zM12 4a2 2 0 100 4 2 2 0 000-4zM12 16a2 2 0 100 4 2 2 0 000-4z"/>
                    </svg>
                </button>

                <div v-if="isMenuOpen" class="absolute right-0 mt-1 w-44 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden text-xs py-1.5 animate-in fade-in duration-100">
                    <button v-if="session.uid" @click="closeMenu(); $emit('report-post', post)" class="w-full text-left px-3.5 py-2 hover:bg-yellow-50 text-gray-700 hover:text-yellow-700 flex items-center gap-2 font-medium transition cursor-pointer">
                        <svg class="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.332 16c-.77 1.333.192 3 1.732 3z"/></svg>
                        <span>{{ t('reportBtn', 'Segnala') }}</span>
                    </button>

                    <button v-if="isAuthorOrCoAuthor" @click="closeMenu(); $emit('edit-post', post)" class="w-full text-left px-3.5 py-2 hover:bg-blue-50 text-gray-700 hover:text-blue-600 flex items-center gap-2 font-medium transition cursor-pointer">
                        <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        <span>{{ t('editPostBtn', 'Modifica') }}</span>
                    </button>

                    <button v-if="isAuthorOrCoAuthor || session.isAdmin" @click="closeMenu(); $emit('delete-post', post.id)" class="w-full text-left px-3.5 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 font-medium transition border-t border-gray-100 cursor-pointer">
                        <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        <span>{{ t('deletePostBtn', 'Elimina') }}</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- AREA MEDIA: Singolo File -->
        <div v-if="post.data?.mediaList && post.data.mediaList.length === 1" class="mb-3 rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-gray-100">
            <video v-if="post.data.mediaList[0].isVideo" :src="post.data.mediaList[0].url" controls class="w-full h-auto max-h-[460px] object-contain"></video>
            <img v-else :src="post.data.mediaList[0].url" class="w-full h-auto max-h-[460px] object-contain cursor-pointer" @click="$emit('open-media', post.data.mediaList[0].url)">
        </div>

        <!-- AREA MEDIA: CAROSELLO STILE INSTAGRAM -->
        <div v-else-if="post.data?.mediaList && post.data.mediaList.length > 1" class="relative w-full mb-3 select-none group">
            
            <div :id="'carousel-' + post.id" 
                 @scroll="onCarouselScroll"
                 class="flex overflow-x-auto snap-x snap-mandatory scroll-smooth w-full no-scrollbar rounded-2xl bg-black border border-gray-100 aspect-square sm:aspect-[4/5] max-h-[480px]">
                
                <div v-for="item in post.data.mediaList" :key="item.url" 
                     class="w-full flex-shrink-0 snap-center h-full flex items-center justify-center bg-black relative">
                    <video v-if="item.isVideo" :src="item.url" controls playsinline class="w-full h-full object-contain"></video>
                    <img v-else :src="item.url" class="w-full h-full object-contain cursor-pointer" @click="$emit('open-media', item.url)">
                </div>
            </div>

            <!-- Badge Contatore Slide (es. "1/3") -->
            <div class="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full pointer-events-none shadow-md">
                {{ currentSlide + 1 }}/{{ post.data.mediaList.length }}
            </div>

            <!-- Frecce Navigazione Carosello -->
            <button v-show="currentSlide > 0" 
                    @click="prevSlide(post.id)" 
                    class="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white text-gray-800 rounded-full flex items-center justify-center shadow-lg transition opacity-0 group-hover:opacity-100 z-20 cursor-pointer">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
            </button>

            <button v-show="currentSlide < post.data.mediaList.length - 1" 
                    @click="nextSlide(post.id)" 
                    class="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white text-gray-800 rounded-full flex items-center justify-center shadow-lg transition opacity-0 group-hover:opacity-100 z-20 cursor-pointer">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
            </button>

            <!-- Puntini Paginazione (Dots) -->
            <div class="flex justify-center items-center gap-1.5 pt-2">
                <div v-for="(_, dIdx) in post.data.mediaList" :key="dIdx" 
                     @click="goToSlide(post.id, dIdx)"
                     :class="['h-1.5 rounded-full transition-all duration-300 cursor-pointer', 
                              currentSlide === dIdx ? 'w-4 bg-blue-600' : 'w-1.5 bg-gray-300 hover:bg-gray-400']">
                </div>
            </div>

        </div>

        <!-- TESTO DELLO SPOT SOTTO IL MEDIA -->
        <p v-if="post.data?.text" class="text-gray-800 mb-3 whitespace-pre-wrap leading-relaxed break-words text-sm sm:text-base font-normal">{{ post.data?.text }}</p>

        <!-- BARRA INTERAZIONI IN BASSO -->
        <div class="flex items-center space-x-6 border-t py-3 mt-2">
            <div class="flex items-center space-x-1">
                <button @click="$emit('toggle-like', post)" :class="['flex items-center transition hover:scale-105 p-1 rounded-full hover:bg-gray-50', post.hasLiked ? 'text-red-500' : 'text-gray-500']">
                    <svg class="w-6 h-6" :fill="post.hasLiked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                </button>
                <button @click="$emit('open-likes', post.data?.likes)" class="text-gray-500 font-semibold text-sm hover:underline">{{ post.data?.likes?.length || 0 }}</button>
            </div>
            <button @click="post.showComments = !post.showComments" class="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition hover:scale-105">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                <span>{{ post.data?.comments?.length || 0 }}</span>
            </button>
            <button @click="$emit('share-post', post.id, post.data?.text)" class="flex items-center space-x-1 text-gray-500 hover:text-green-600 transition hover:scale-105 p-1 rounded-full hover:bg-gray-50">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            </button>
        </div>

        <!-- Sezione Commenti Espandibile (Con Modifica ed Eliminazione Commenti) -->
        <div v-show="post.showComments" class="border-t border-gray-100 pt-4 mt-2">
            <div class="max-h-60 overflow-y-auto custom-scrollbar mb-3 pr-1 space-y-1">
                <div v-if="!post.data?.comments || post.data.comments.length === 0" class="text-center py-4 text-xs italic text-gray-400">
                    {{ t('firstCommentPrompt', 'Nessun commento. Sii il primo a commentare!') }}
                </div>
                
                <div v-for="(comment, cIdx) in post.data?.comments" :key="cIdx" class="bg-gray-50 p-2.5 rounded-xl mb-2 text-sm border border-gray-100 flex items-start space-x-2.5 transition hover:bg-gray-100/60 group">
                    <div v-html="getUserAvatarHtml(comment.authorProfile?.userPfUri, comment.authorProfile?.username, 'w-6 h-6 text-[10px]')"></div>
                    <div class="flex-grow min-w-0">
                        <div class="flex justify-between items-center mb-0.5">
                            <div class="flex items-center gap-2 min-w-0">
                                <span class="font-semibold text-xs text-gray-800">{{ comment.authorProfile?.username || t('anonymousUser', 'Anonimo') }}</span>
                                
                                <!-- Azioni Commento: Modifica ed Elimina -->
                                <div v-if="comment.user === session.uid || post.data?.user === session.uid || session.isAdmin" class="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 transition-opacity">
                                    <button v-if="comment.user === session.uid" @click="comment.isEditing = true; comment.editText = comment.text" class="text-gray-400 hover:text-blue-500 transition" title="Modifica commento">
                                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                                    </button>
                                    <button @click="$emit('delete-comment', post, cIdx)" class="text-gray-400 hover:text-red-500 transition" title="Elimina commento">
                                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                    </button>
                                </div>
                            </div>
                            <span class="text-[10px] text-gray-400 shrink-0 ml-2">{{ formatTime(comment.timestamp) }}</span>
                        </div>
                        
                        <p v-if="!comment.isEditing" class="text-gray-700 text-xs leading-relaxed whitespace-pre-wrap break-words">{{ comment.text }}</p>
                        
                        <div v-else class="flex flex-col gap-1.5 mt-1">
                            <input type="text" v-model="comment.editText" class="w-full bg-white border border-blue-300 rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-500 text-gray-800">
                            <div class="flex justify-end gap-1.5">
                                <button @click="comment.isEditing = false" class="px-2 py-0.5 text-[10px] text-gray-500 hover:bg-gray-200 rounded cursor-pointer">{{ t('cancelBtn', 'Annulla') }}</button>
                                <button @click="$emit('save-comment-edit', post, comment, cIdx)" class="px-2 py-0.5 text-[10px] bg-blue-600 text-white font-semibold rounded cursor-pointer hover:bg-blue-700">{{ t('saveBtn', 'Salva') }}</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex bg-gray-100 rounded-xl p-1.5 items-center border border-transparent focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <input type="text" v-model="post.newComment" @keyup.enter="$emit('add-comment', post)" :placeholder="t('writeCommentPlaceholder', 'Scrivi un commento...')" class="flex-grow bg-transparent border-none px-2 py-1 text-sm outline-none placeholder-gray-400 text-gray-800">
                <button @click="$emit('add-comment', post)" :disabled="post.isCommenting" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm flex shrink-0 disabled:opacity-50 cursor-pointer">
                    <span v-if="post.isCommenting" class="animate-spin h-3.5 w-3.5 border-b-2 border-white rounded-full"></span>
                    <span v-else>{{ t('sendCommentBtn', 'Invia') }}</span>
                </button>
            </div>
        </div>
    </div>
    `
};

// 2. Modale Modifica Spot con Aggiunta, Ricerca Live e Rimozione Co-Autori
window.SpottioComposables.SpotEditModalComponent = {
    props: ['modal', 'categoriesList'],
    emits: ['close', 'save', 'toggle-category', 'search-coauthors', 'add-coauthor', 'remove-coauthor', 'remove-media', 'files-selected'],
    methods: {
        renderAvatar(url, name) {
            if (window.Spottio && typeof window.Spottio.getAvatarHtml === 'function') {
                return window.Spottio.getAvatarHtml(url, name, 'w-6 h-6 text-[10px]');
            }
            return `<div class="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-[10px]">${(name || 'U').charAt(0).toUpperCase()}</div>`;
        },
        renderLargeAvatar(url, name) {
            if (window.Spottio && typeof window.Spottio.getAvatarHtml === 'function') {
                return window.Spottio.getAvatarHtml(url, name, 'w-8 h-8 text-xs');
            }
            return `<div class="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs">${(name || 'U').charAt(0).toUpperCase()}</div>`;
        }
    },
    template: `
    <div v-if="modal && modal.show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" @click.self="$emit('close')">
        <div class="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col text-gray-800">
            <h3 class="font-bold text-gray-800 text-lg mb-3">Modifica Spot</h3>
            <div class="overflow-y-auto custom-scrollbar flex-grow space-y-4 pr-1">
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Testo dello Spot</label>
                    <textarea v-model="modal.text" class="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm text-gray-800" rows="3"></textarea>
                </div>

                <!-- SEZIONE CO-AUTORI -->
                <div class="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-2.5">
                    <div class="flex justify-between items-center">
                        <label class="block text-xs font-bold text-gray-600 uppercase">Co-Autori / Collaboratori</label>
                        <span class="text-[10px] text-gray-400 font-bold">{{ modal.coAuthors?.length || 0 }}/3</span>
                    </div>

                    <!-- Co-Autori già associati -->
                    <div v-if="modal.coAuthorProfiles && modal.coAuthorProfiles.length > 0" class="flex flex-wrap gap-2">
                        <div v-for="co in modal.coAuthorProfiles" :key="co.uid" class="bg-white border border-gray-200 hover:border-purple-300 rounded-2xl pl-1.5 pr-2.5 py-1 text-xs flex items-center gap-2 shadow-sm transition">
                            <div v-html="renderAvatar(co.userPfUri, co.username)"></div>
                            <span class="font-semibold text-gray-800">@{{ co.username }}</span>
                            <button type="button" @click="$emit('remove-coauthor', co.uid)" class="text-gray-400 hover:text-red-500 font-bold ml-1 text-sm leading-none cursor-pointer" title="Rimuovi">&times;</button>
                        </div>
                    </div>
                    <div v-else class="text-xs text-gray-400 italic">Nessun co-autore associato a questo post.</div>

                    <!-- Input ricerca per nuovi co-autori -->
                    <div v-if="(modal.coAuthors?.length || 0) < 3" class="relative pt-1">
                        <input type="text" 
                               v-model="modal.coAuthorSearchTerm" 
                               @input="$emit('search-coauthors')" 
                               placeholder="Cerca username da aggiungere come co-autore..." 
                               class="w-full p-2 bg-white rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                               autocomplete="off">
                        
                        <div v-if="modal.coAuthorSearchResults && modal.coAuthorSearchResults.length > 0" 
                             class="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-40 overflow-y-auto divide-y divide-gray-100">
                            <div v-for="user in modal.coAuthorSearchResults" :key="user.uid" 
                                 @click="$emit('add-coauthor', user)" 
                                 class="p-2 hover:bg-purple-50 cursor-pointer flex items-center justify-between text-xs transition">
                                <div class="flex items-center gap-2 min-w-0">
                                    <div v-html="renderLargeAvatar(user.userPfUri, user.username)"></div>
                                    <div class="flex items-center gap-0.5 truncate">
                                        <span class="font-semibold text-gray-800 truncate">@{{ user.username }}</span>
                                        <span v-if="user.isVerified" class="text-blue-500 font-bold ml-0.5">✓</span>
                                    </div>
                                </div>
                                <span class="text-purple-600 font-bold text-[11px] bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-lg shrink-0 transition">+ Aggiungi</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div>
                    <div class="flex justify-between items-center mb-1.5">
                        <label class="block text-xs font-bold text-gray-500 uppercase">Categorie (Max 5)</label>
                        <span class="text-[10px] text-gray-400 font-bold">{{ modal.categories?.length || 0 }}/5</span>
                    </div>
                    <div class="flex flex-wrap gap-1.5">
                        <button v-for="cat in categoriesList" :key="cat" type="button" @click="$emit('toggle-category', cat)"
                            :class="['text-xs font-bold px-3 py-1 rounded-full border transition', modal.categories?.includes(cat) ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200']">
                            {{ cat }}
                        </button>
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1.5">Media Esistenti ({{ modal.mediaList ? modal.mediaList.length : 0 }})</label>
                    <div v-if="!modal.mediaList?.length" class="text-xs text-gray-400 italic">Nessun media allegato.</div>
                    <div v-else class="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                        <div v-for="(media, mIdx) in modal.mediaList" :key="mIdx" class="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-black border border-gray-200">
                            <video v-if="media.isVideo" :src="media.url" class="w-full h-full object-cover"></video>
                            <img v-else :src="media.url" class="w-full h-full object-cover">
                            <button @click="$emit('remove-media', mIdx)" type="button" class="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-md hover:bg-red-700">✕</button>
                        </div>
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Aggiungi Media</label>
                    <input type="file" @change="$emit('files-selected', $event)" multiple accept="image/*,video/*" class="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
                    <div v-if="modal.newFiles?.length" class="text-[11px] text-blue-600 mt-1 font-medium">{{ modal.newFiles.length }} file selezionato/i.</div>
                </div>
            </div>
            <div class="flex gap-3 pt-4 border-t border-gray-100 mt-3 shrink-0">
                <button @click="$emit('close')" class="w-1/2 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition text-sm cursor-pointer">Annulla</button>
                <button @click="$emit('save')" :disabled="modal.loading" class="w-1/2 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50 text-sm cursor-pointer">
                    {{ modal.loading ? 'Salvataggio...' : 'Salva' }}
                </button>
            </div>
        </div>
    </div>
    `
};

// 3. Modale Likes Post
window.SpottioComposables.SpotLikesModalComponent = {
    props: {
        modal: { type: Object, required: true },
        t: { type: Function, default: (k, d) => d },
        getUserAvatarHtml: { type: Function, default: (u, n, c) => window.Spottio?.getAvatarHtml(u, n, c) || '' }
    },
    emits: ['close'],
    methods: {
        goToUser(uid) {
            if (window.Spottio?.navigateToUserProfile && uid) {
                window.Spottio.navigateToUserProfile(uid);
            }
        },
        getVerifiedBadge() {
            return window.Spottio?.getVerifiedBadge ? window.Spottio.getVerifiedBadge(true, 'w-4 h-4 text-blue-500 shrink-0') : '';
        }
    },
    template: `
    <div v-if="modal && modal.show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" @click.self="$emit('close')">
        <div class="bg-white rounded-3xl shadow-xl w-full max-w-sm flex flex-col max-h-[80vh]">
            <div class="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-3xl">
                <h3 class="font-bold text-gray-800">{{ t('likesModalTitle', 'Mi piace') }}</h3>
                <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 font-bold p-1 cursor-pointer">✕</button>
            </div>
            <div class="p-4 overflow-y-auto space-y-2 custom-scrollbar">
                <div v-if="modal.loading" class="text-center py-6 text-blue-600 font-semibold animate-pulse">{{ t('loading', 'Caricamento...') }}</div>
                <div v-else-if="!modal.list || modal.list.length === 0" class="text-center text-gray-500 py-6">{{ t('noLikesYet', 'Nessun mi piace ancora.') }}</div>
                <div v-else v-for="user in modal.list" :key="user.uid" @click="goToUser(user.uid)" class="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition cursor-pointer">
                    <div v-html="getUserAvatarHtml(user.userPfUri, user.username, 'w-8 h-8')"></div>
                    <div class="flex items-center gap-1 min-w-0">
                        <span class="font-semibold text-gray-800 text-sm truncate">{{ user.username }}</span>
                        <span v-if="user.isVerified" v-html="getVerifiedBadge()"></span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `
};

// 4. Modale Segnalazione
window.SpottioComposables.SpotReportModalComponent = {
    props: {
        modal: { type: Object, required: true },
        t: { type: Function, default: (k, d) => d }
    },
    emits: ['close', 'submit'],
    template: `
    <div v-if="modal && modal.show" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" @click.self="$emit('close')">
        <div class="bg-white text-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <div class="flex items-center space-x-3 mb-4">
                <div class="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div class="min-w-0">
                    <h3 class="text-lg font-bold text-gray-900 truncate">Segnala {{ modal.author ? '@' + modal.author : 'Contenuto' }}</h3>
                    <p class="text-xs text-gray-500">Aiutaci a comprendere il problema con questo contenuto o profilo.</p>
                </div>
            </div>

            <form @submit.prevent="$emit('submit')" class="space-y-4">
                <div>
                    <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Motivo</label>
                    <select v-model="modal.reason" class="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium text-gray-800" required>
                        <option value="" disabled selected>Seleziona una categoria...</option>
                        <option value="harassment">Molestie, Minacce o Odio</option>
                        <option value="spam">Spam, Truffa o Account Falso</option>
                        <option value="inappropriate">Contenuto Inappropriato o Nudità</option>
                        <option value="copyright">Violazione Copyright / Diritto d'autore</option>
                        <option value="gdpr">Violazione Privacy / GDPR</option>
                        <option value="other">Altro motivo</option>
                    </select>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Dettagli aggiuntivi (Opzionale)</label>
                    <textarea 
                        v-model="modal.description" 
                        rows="3" 
                        class="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm resize-none text-gray-800" 
                        placeholder="Fornisci ulteriori informazioni su questa segnalazione..."></textarea>
                </div>

                <div class="flex space-x-3 pt-2">
                    <button type="button" @click="$emit('close')" class="w-1/2 py-2.5 px-4 bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-300 transition cursor-pointer">Annulla</button>
                    <button type="submit" :disabled="modal.isSubmitting" class="w-1/2 py-2.5 px-4 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition shadow-md disabled:opacity-50 cursor-pointer">
                        {{ modal.isSubmitting ? 'Invio...' : 'Invia Segnalazione' }}
                    </button>
                </div>
            </form>
        </div>
    </div>
    `
};

// 5. Componente Modale Lista Utenti
window.SpottioComposables.UserListModalComponent = {
    props: {
        show: { type: Boolean, default: false },
        title: { type: String, default: '' },
        users: { type: Array, default: () => [] },
        loading: { type: Boolean, default: false },
        isSelf: { type: Boolean, default: false },
        isFollowersModal: { type: Boolean, default: false },
        t: { type: Function, default: (k, d) => d },
        getUserAvatarHtml: { type: Function, default: (u, n, c, g, s) => window.Spottio?.getAvatarHtml(u, n, c, g, s) || '' }
    },
    emits: ['close', 'go-user', 'remove-follower', 'unfollow-user'],
    template: `
    <div v-if="show" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" @click.self="$emit('close')">
        <div class="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh]">
            <div class="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                <h3 class="text-lg font-bold text-gray-800">{{ title }}</h3>
                <button @click="$emit('close')" class="text-gray-400 hover:text-red-500 font-bold p-1 cursor-pointer">✕</button>
            </div>
            <div class="p-4 overflow-y-auto flex-grow flex flex-col gap-2 custom-scrollbar">
                <div v-if="loading" class="text-center text-blue-600 font-semibold py-6 animate-pulse">{{ t('loading', 'Caricamento...') }}</div>
                <div v-else-if="users.length === 0" class="text-center text-gray-500 py-6 text-sm">{{ t('noUsers', 'Nessun utente presente.') }}</div>
                
                <div v-else v-for="u in users" :key="u.uid" class="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition border border-transparent hover:border-gray-100">
                    <div class="flex items-center gap-3 cursor-pointer min-w-0" @click="$emit('go-user', u.uid)">
                        <div v-html="getUserAvatarHtml(u.avatar || u.userPfUri, u.username, 'w-10 h-10', false, u.hasStories)"></div>
                        <span class="font-semibold text-gray-800 text-sm truncate">{{ u.username }}</span>
                    </div>
                    
                    <template v-if="isSelf">
                        <button v-if="isFollowersModal" @click="$emit('remove-follower', u.uid)" class="shrink-0 text-[11px] text-gray-600 bg-gray-200 hover:bg-gray-300 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer">
                            {{ t('removeFollowerBtn', 'Rimuovi') }}
                        </button>
                        <button v-else @click="$emit('unfollow-user', u.uid)" class="shrink-0 text-[11px] text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer">
                            {{ t('unfollowBtn', 'Non seguire più') }}
                        </button>
                    </template>
                </div>
            </div>
        </div>
    </div>
    `
};

// 6. Componente Statistiche Profilo
window.SpottioComposables.ProfileStatsBarComponent = {
    props: {
        postsCount: { type: Number, default: 0 },
        followersCount: { type: Number, default: 0 },
        followingCount: { type: Number, default: 0 },
        likedCount: { type: Number, default: 0 },
        isPrivateLocked: { type: Boolean, default: false },
        t: { type: Function, default: (k, d) => d }
    },
    emits: ['open-followers', 'open-following', 'open-liked'],
    template: `
    <div class="grid grid-cols-4 gap-1 mb-4 py-2 border-t border-b border-gray-50 text-center">
        <div class="p-1 rounded-xl">
            <span class="block text-lg sm:text-xl font-bold text-gray-800">{{ postsCount }}</span>
            <span class="text-[10px] sm:text-xs text-gray-500 font-semibold uppercase">{{ t('postWord', 'Spot') }}</span>
        </div>
        <div 
            @click="!isPrivateLocked && $emit('open-followers')" 
            :class="['p-1 rounded-xl transition duration-200', !isPrivateLocked ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default opacity-80']">
            <span class="block text-lg sm:text-xl font-bold text-gray-800">{{ followersCount }}</span>
            <span class="text-[10px] sm:text-xs text-gray-500 font-semibold uppercase">{{ t('followersText', 'Follower') }}</span>
        </div>
        <div 
            @click="!isPrivateLocked && $emit('open-following')" 
            :class="['p-1 rounded-xl transition duration-200', !isPrivateLocked ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default opacity-80']">
            <span class="block text-lg sm:text-xl font-bold text-gray-800">{{ followingCount }}</span>
            <span class="text-[10px] sm:text-xs text-gray-500 font-semibold uppercase">{{ t('followingText', 'Seguiti') }}</span>
        </div>
        <div 
            @click="!isPrivateLocked && $emit('open-liked')" 
            :class="['p-1 rounded-xl transition duration-200', !isPrivateLocked ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default opacity-80']">
            <span class="block text-lg sm:text-xl font-bold text-gray-800">{{ likedCount }}</span>
            <span class="text-[10px] sm:text-xs text-gray-500 font-semibold uppercase">{{ t('likesWord', 'Like') }}</span>
        </div>
    </div>
    `
};

// 7. Componente Evidenze
window.SpottioComposables.HighlightFoldersBarComponent = {
    props: {
        folderKeys: { type: Array, default: () => [] },
        getCover: { type: Function, required: true },
        t: { type: Function, default: (k, d) => d }
    },
    emits: ['open-folder'],
    template: `
    <div v-if="folderKeys && folderKeys.length > 0" class="mt-6 pt-4 border-t border-gray-100">
        <p class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{{ t('highlightTitle', 'Flashspot in evidenza') }}</p>
        <div class="flex gap-4 overflow-x-auto custom-scrollbar pb-2 snap-x">
            <div v-for="folderName in folderKeys" :key="folderName" @click="$emit('open-folder', folderName)" class="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 snap-start hover:opacity-85 transition">
                <div class="w-16 h-16 rounded-full p-[2px] border-2 border-gray-300 flex items-center justify-center bg-white shadow-sm overflow-hidden">
                    <img :src="getCover(folderName)" class="w-full h-full rounded-full object-cover" alt="Folder Cover">
                </div>
                <span class="text-[11px] font-semibold text-gray-700 truncate w-16 text-center">{{ folderName }}</span>
            </div>
        </div>
    </div>
    `
};

// REGISTRAZIONE COMPONENTI
window.SpottioComposables.registerComponents = function(vueApp) {
    if (!vueApp) return;
    if (window.SpottioComposables.SpotCardComponent) {
        vueApp.component('spot-card', window.SpottioComposables.SpotCardComponent);
    }
    if (window.SpottioComposables.SpotEditModalComponent) {
        vueApp.component('spot-edit-modal', window.SpottioComposables.SpotEditModalComponent);
    }
    if (window.SpottioComposables.FlashspotViewerComponent) {
        vueApp.component('flashspot-viewer', window.SpottioComposables.FlashspotViewerComponent);
    }
    if (window.SpottioComposables.LikedSpotsModalComponent) {
        vueApp.component('liked-spots-modal', window.SpottioComposables.LikedSpotsModalComponent);
    }
    if (window.SpottioComposables.SpotLikesModalComponent) {
        vueApp.component('spot-likes-modal', window.SpottioComposables.SpotLikesModalComponent);
    }
    if (window.SpottioComposables.SpotReportModalComponent) {
        vueApp.component('spot-report-modal', window.SpottioComposables.SpotReportModalComponent);
    }
    if (window.SpottioComposables.UserListModalComponent) {
        vueApp.component('user-list-modal', window.SpottioComposables.UserListModalComponent);
    }
    if (window.SpottioComposables.ProfileStatsBarComponent) {
        vueApp.component('profile-stats-bar', window.SpottioComposables.ProfileStatsBarComponent);
    }
    if (window.SpottioComposables.HighlightFoldersBarComponent) {
        vueApp.component('highlight-folders-bar', window.SpottioComposables.HighlightFoldersBarComponent);
    }
};