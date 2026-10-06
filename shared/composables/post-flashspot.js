// shared/composables/post-flashspot.js
window.SpottioComposables = window.SpottioComposables || {};

window.SpottioComposables.useFlashspotViewer = function({ modals, activeStories, session, onStoryDeleted = null }) {
    const { computed } = Vue;

    const currentStoryMedia = computed(() => {
        const s = modals.value.flashspot.stories[modals.value.flashspot.currentIndex];
        return s?.data?.mediaList?.[0] || s?.mediaList?.[0] || null;
    });

    const currentStoryText = computed(() => {
        const s = modals.value.flashspot.stories[modals.value.flashspot.currentIndex];
        return s?.data?.text || s?.text || '';
    });

    const currentStoryTime = computed(() => {
        const s = modals.value.flashspot.stories[modals.value.flashspot.currentIndex];
        const ts = s?.data?.timestamp || s?.timestamp;
        if (!ts) return "Flashspot";
        const date = ts.toDate ? ts.toDate() : new Date(ts);
        const diffHours = Math.floor(Math.abs(new Date() - date) / (1000 * 60 * 60));
        return diffHours === 0 ? "Ora" : `${diffHours}h fa`;
    });

    const canDeleteCurrentStory = computed(() => {
        const s = modals.value.flashspot.stories[modals.value.flashspot.currentIndex];
        const authorUid = s?.data?.user || s?.user || modals.value.flashspot.author?.uid;
        return authorUid === session.value.uid || session.value.isAdmin;
    });

    const openFlashspotViewer = (userIndex = 0, customStories = null, customAuthor = null) => {
        const user = activeStories ? activeStories.value[userIndex] : null;
        const stories = customStories || user?.stories;
        if (!stories || stories.length === 0) return;
        
        document.body.style.overflow = 'hidden';
        modals.value.flashspot = { 
            show: true, userIndex, stories, 
            author: customAuthor || user, currentIndex: 0, progress: 0, timer: null, progressInterval: null 
        };
        startFlashspotTimer(5000);
    };

    const closeFlashspotViewer = () => {
        modals.value.flashspot.show = false;
        clearTimeout(modals.value.flashspot.timer);
        clearInterval(modals.value.flashspot.progressInterval);
        document.body.style.overflow = 'auto';
    };

    const startFlashspotTimer = (duration = 5000) => {
        clearTimeout(modals.value.flashspot.timer);
        clearInterval(modals.value.flashspot.progressInterval);
        modals.value.flashspot.progress = 0;
        
        const step = 50;
        const increment = (step / duration) * 100;
        modals.value.flashspot.progressInterval = setInterval(() => {
            modals.value.flashspot.progress = Math.min(100, modals.value.flashspot.progress + increment);
        }, step);

        modals.value.flashspot.timer = setTimeout(nextFlashspot, duration);
    };

    const nextFlashspot = () => {
        clearTimeout(modals.value.flashspot.timer);
        clearInterval(modals.value.flashspot.progressInterval);

        if (modals.value.flashspot.currentIndex < modals.value.flashspot.stories.length - 1) {
            modals.value.flashspot.currentIndex++;
            if (!currentStoryMedia.value || !currentStoryMedia.value.isVideo) startFlashspotTimer(5000);
        } else {
            if (activeStories && modals.value.flashspot.userIndex + 1 < activeStories.value.length) {
                openFlashspotViewer(modals.value.flashspot.userIndex + 1);
            } else {
                closeFlashspotViewer();
            }
        }
    };

    const prevFlashspot = () => {
        clearTimeout(modals.value.flashspot.timer);
        clearInterval(modals.value.flashspot.progressInterval);

        if (modals.value.flashspot.currentIndex > 0) {
            modals.value.flashspot.currentIndex--;
            if (!currentStoryMedia.value || !currentStoryMedia.value.isVideo) startFlashspotTimer(5000);
        } else if (activeStories && modals.value.flashspot.userIndex - 1 >= 0) {
            const prevUserIdx = modals.value.flashspot.userIndex - 1;
            const prevUser = activeStories.value[prevUserIdx];
            openFlashspotViewer(prevUserIdx);
            modals.value.flashspot.currentIndex = prevUser.stories.length - 1;
        }
    };

    const deleteCurrentFlashspot = async () => {
        clearTimeout(modals.value.flashspot.timer);
        clearInterval(modals.value.flashspot.progressInterval);

        if (!confirm("Sei sicuro di voler eliminare questo Flashspot? L'azione è irreversibile.")) {
            startFlashspotTimer(5000);
            return;
        }

        const currentStory = modals.value.flashspot.stories[modals.value.flashspot.currentIndex];
        try {
            await window.db.collection("posts").doc(currentStory.id).delete();
            modals.value.flashspot.stories.splice(modals.value.flashspot.currentIndex, 1);
            if (onStoryDeleted) await onStoryDeleted();

            if (modals.value.flashspot.stories.length === 0) {
                closeFlashspotViewer();
                return;
            }
            if (modals.value.flashspot.currentIndex >= modals.value.flashspot.stories.length) {
                modals.value.flashspot.currentIndex = modals.value.flashspot.stories.length - 1;
            }
            startFlashspotTimer(5000);
        } catch (err) {
            alert("Impossibile eliminare il Flashspot.");
        }
    };

    return {
        currentStoryMedia, currentStoryText, currentStoryTime, canDeleteCurrentStory,
        openFlashspotViewer, closeFlashspotViewer, startFlashspotTimer, nextFlashspot, prevFlashspot, deleteCurrentFlashspot
    };
};

// Composable Unificato Flashspot in Evidenza (Cartelle Highlight) con auto-pulizia
window.SpottioComposables.useHighlightFolders = function({ flashspotViewer }) {
    const { ref, computed } = Vue;
    const activeStories = ref([]);
    const highlightFolders = ref({});
    const highlightFolderKeys = computed(() => Object.keys(highlightFolders.value));

    const loadHighlightStories = async (uid) => {
        if (!uid || !window.db) return;
        try {
            const snapshot = await window.db.collection("posts")
                .where("user", "==", uid)
                .get();

            const stories = [];
            const folders = {};
            
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.type === 'flashspot' || data.type === 'story') {
                    const isActive = window.Spottio && window.Spottio.isFlashspotActive 
                        ? window.Spottio.isFlashspotActive(data.timestamp, data.duration) 
                        : true;

                    // Se scaduto e non permanente, auto-elimina dal database
                    if (!isActive && data.duration !== 'permanent') {
                        window.db.collection("posts").doc(doc.id).delete().catch(() => {});
                    } else {
                        stories.push({ id: doc.id, ...data });
                    }
                }
            });

            stories.sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));

            const active = [];
            stories.forEach(story => {
                if (window.Spottio && window.Spottio.isFlashspotActive && window.Spottio.isFlashspotActive(story.timestamp, story.duration)) {
                    active.push(story);
                }
                if (story.folder && story.folder.trim() !== '') {
                    const folderName = story.folder.trim();
                    if (!folders[folderName]) folders[folderName] = [];
                    folders[folderName].push(story);
                }
            });

            activeStories.value = active;
            highlightFolders.value = folders;
        } catch (e) {
            console.error("Errore recupero storie ed evidenze:", e);
        }
    };

    const getFolderCover = (folderName) => {
        const list = highlightFolders.value[folderName];
        if (list && list.length > 0) {
            const last = list[list.length - 1];
            if (last.mediaList && last.mediaList.length > 0) return last.mediaList[0].url;
        }
        return window.Spottio?.DEFAULT_APP_LOGO || "https://i.ibb.co/b5HgvzCB/Spottio-Logo-2.png";
    };

    const openHighlightViewer = (folderName, authorProfile) => {
        const stories = highlightFolders.value[folderName];
        if (!stories || stories.length === 0) return;
        flashspotViewer.openFlashspotViewer(0, stories, { profile: authorProfile });
    };

    const resetHighlights = () => {
        activeStories.value = [];
        highlightFolders.value = {};
    };

    return {
        activeStories,
        highlightFolders,
        highlightFolderKeys,
        loadHighlightStories,
        getFolderCover,
        openHighlightViewer,
        resetHighlights
    };
};

window.SpottioComposables.FlashspotViewerComponent = {
    props: ['modals', 'currentStoryTime', 'currentStoryMedia', 'currentStoryText', 'canDeleteCurrentStory', 'getUserAvatarHtml'],
    template: `
    <div v-if="modals.flashspot.show" class="fixed inset-0 z-[60] bg-black flex flex-col">
        <div class="w-full px-2 pt-4 flex gap-1 z-40 absolute top-0">
            <div v-for="(story, idx) in modals.flashspot.stories" :key="idx" class="h-1 flex-1 rounded-full bg-white/30 overflow-hidden">
                <div :class="['h-full bg-white', idx < modals.flashspot.currentIndex ? 'w-full' : (idx === modals.flashspot.currentIndex ? 'transition-all ease-linear' : 'w-0')]" :style="idx === modals.flashspot.currentIndex ? { width: modals.flashspot.progress + '%' } : {}"></div>
            </div>
        </div>
        
        <div class="absolute top-8 left-4 right-4 flex justify-between items-center z-40">
            <div class="flex items-center gap-3">
                <div v-html="getUserAvatarHtml(modals.flashspot.author?.profile?.userPfUri || modals.flashspot.author?.userPfUri, modals.flashspot.author?.profile?.username || modals.flashspot.author?.username, 'w-10 h-10 border border-white/20')"></div>
                <div class="flex flex-col drop-shadow-md">
                    <span class="text-white font-bold text-sm leading-tight">{{ modals.flashspot.author?.profile?.username || modals.flashspot.author?.username }}</span>
                    <span class="text-white/80 text-[11px] leading-tight">{{ currentStoryTime }}</span>
                </div>
            </div>
            <div class="flex items-center gap-1 pointer-events-auto">
                <button v-if="canDeleteCurrentStory" @click="$emit('delete')" class="text-white/80 hover:text-red-500 transition drop-shadow-md p-2" title="Elimina Flashspot">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <button @click="$emit('close')" class="text-white text-4xl font-bold drop-shadow-md pb-1 px-2">&times;</button>
            </div>
        </div>

        <div class="flex-grow flex flex-col items-center justify-center relative w-full h-full bg-black">
            <div class="absolute inset-y-0 left-0 w-[40%] z-30 cursor-pointer" @click="$emit('prev')"></div>
            <div class="absolute inset-y-0 right-0 w-[60%] z-30 cursor-pointer" @click="$emit('next')"></div>
            <div class="w-full h-full flex items-center justify-center object-contain relative bg-black">
                <template v-if="currentStoryMedia">
                    <video v-if="currentStoryMedia.isVideo" :src="currentStoryMedia.url" autoplay playsinline class="w-full h-full object-contain pointer-events-auto" @loadedmetadata="$emit('start-timer', $event.target.duration * 1000)" @ended="$emit('next')"></video>
                    <img v-else :src="currentStoryMedia.url" class="w-full h-full object-contain" @load="$emit('start-timer', 5000)">
                </template>
                <div v-else class="w-full h-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center p-8">
                    <p class="text-center text-white text-3xl md:text-4xl font-extrabold break-words drop-shadow-lg leading-tight">{{ currentStoryText }}</p>
                </div>
            </div>
            <div v-if="currentStoryMedia && currentStoryText" class="absolute bottom-16 px-4 text-white text-center text-lg font-bold drop-shadow-lg z-20 pointer-events-none">
                <div class="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl inline-block max-w-sm text-sm">{{ currentStoryText }}</div>
            </div>
        </div>
    </div>
    `
};