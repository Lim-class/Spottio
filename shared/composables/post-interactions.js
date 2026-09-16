// shared/composables/post-interactions.js
window.SpottioComposables = window.SpottioComposables || {};

// Parser comune post e commenti con verifica di privacy e Flashspot attivi
window.SpottioComposables.parsePostList = async function(rawDocs, currentUsername, viewerUid = null) {
    const formatted = [];
    const currentViewer = viewerUid || (window.Spottio?.getCurrentUid ? window.Spottio.getCurrentUid() : localStorage.getItem('currentUid'));

    for (let p of rawDocs) {
        const authorProfile = await window.Spottio.getUserProfile(p.data.user);
        
        // Verifica con privacy: se privato e non seguito, restituisce false
        const hasActiveStories = window.Spottio?.hasActiveFlashspot 
            ? await window.Spottio.hasActiveFlashspot(p.data.user, currentViewer) 
            : false;

        const parsedComments = (p.data.comments || []).map(c => ({
            ...c, isEditing: false, editText: c.text
        }));
        for (let c of parsedComments) c.authorProfile = await window.Spottio.getUserProfile(c.user);

        // Controllo Like basato su UID (con fallback username per retrocompatibilità)
        const likesArr = p.data.likes || [];
        const hasLiked = currentViewer ? (likesArr.includes(currentViewer) || (currentUsername && likesArr.includes(currentUsername))) : false;

        formatted.push({
            ...p,
            authorProfile,
            hasActiveStories,
            categories: window.Spottio.getPostCategories(p.data),
            hasLiked: hasLiked,
            showComments: false,
            newComment: '',
            isCommenting: false,
            data: { ...p.data, comments: parsedComments }
        });
    }
    return formatted;
};

// Interazioni utente sui post basate su UID (con calcolo categorie su database attivo)
window.SpottioComposables.usePostInteractions = function({ session, posts, refreshAlgorithm = true, onDeleteCallback = null, onLikeToggledCallback = null }) {
    const toggleLike = async (post) => {
        const uid = session.value?.uid || (window.Spottio?.getCurrentUid ? window.Spottio.getCurrentUid() : localStorage.getItem('currentUid'));
        if (!uid || uid === 'null' || uid === 'Guest') {
            return alert("Accedi per mettere like!");
        }

        const ref = window.db.collection("posts").doc(post.id);
        const userLikedRef = window.db.collection("users").doc(uid).collection("liked_posts").doc(post.id);
        const username = session.value?.username || '';
        
        try {
            if (post.hasLiked) {
                // Rimuove l'UID da Firestore
                await ref.update({ 
                    likes: firebase.firestore.FieldValue.arrayRemove(uid) 
                });
                if (username) {
                    await ref.update({ likes: firebase.firestore.FieldValue.arrayRemove(username) }).catch(() => {});
                }
                await userLikedRef.delete();

                post.data.likes = (post.data.likes || []).filter(u => u !== uid && u !== username);
                post.hasLiked = false;

                // Decrementa il punteggio preferenze su Firestore
                if (refreshAlgorithm && window.FeedAlgorithm) post.categories?.forEach(c => window.FeedAlgorithm.updateScore(c, -1));
                if (onLikeToggledCallback) onLikeToggledCallback(post.id, false);
            } else {
                // Aggiunge l'UID dell'utente
                await ref.update({ 
                    likes: firebase.firestore.FieldValue.arrayUnion(uid) 
                });
                await userLikedRef.set({ 
                    postId: post.id, 
                    likedAt: firebase.firestore.FieldValue.serverTimestamp() 
                });

                post.data.likes = post.data.likes || [];
                if (!post.data.likes.includes(uid)) {
                    post.data.likes.push(uid);
                }
                post.hasLiked = true;

                // Incrementa il punteggio preferenze su Firestore
                if (refreshAlgorithm && window.FeedAlgorithm) post.categories?.forEach(c => window.FeedAlgorithm.updateScore(c, 1));
                if (onLikeToggledCallback) onLikeToggledCallback(post.id, true);
            }
        } catch (err) {
            console.error("Errore like:", err);
        }
    };

    const addComment = async (post) => {
        const text = post.newComment?.trim();
        if (!text || !session.value.uid || session.value.uid === 'null') return;
        post.isCommenting = true;
        const newC = { user: session.value.uid, text, timestamp: firebase.firestore.Timestamp.fromDate(new Date()) };

        try {
            await window.db.collection("posts").doc(post.id).update({ comments: firebase.firestore.FieldValue.arrayUnion(newC) });
            const profile = await window.Spottio.getUserProfile(session.value.uid);
            post.data.comments.push({ ...newC, authorProfile: profile, isEditing: false, editText: text });
            post.newComment = '';
            if (refreshAlgorithm && window.FeedAlgorithm) post.categories?.forEach(c => window.FeedAlgorithm.updateScore(c, 2));
        } catch (err) {
            alert("Errore nell'invio del commento");
        } finally {
            post.isCommenting = false;
        }
    };

    const saveCommentEdit = async (post, comment, idx) => {
        const newText = comment.editText?.trim();
        if (!newText) return;
        try {
            const docRef = window.db.collection("posts").doc(post.id);
            const freshDoc = await docRef.get();
            let freshComments = freshDoc.data().comments || [];
            if (freshComments[idx]) {
                freshComments[idx].text = newText;
                await docRef.update({ comments: freshComments });
                comment.text = newText;
                comment.isEditing = false;
            }
        } catch (e) {
            alert("Errore modifica commento");
        }
    };

    const confirmDelete = async (postId) => {
        if (confirm("Sei sicuro di voler eliminare definitivamente questo post? L'azione è irreversibile.")) {
            try {
                await window.db.collection("posts").doc(postId).delete();
                posts.value = posts.value.filter(p => p.id !== postId);
                if (onDeleteCallback) onDeleteCallback(postId);
            } catch (err) {
                console.error("Errore eliminazione post:", err);
            }
        }
    };

    const scrollCarousel = (postId, direction) => {
        const el = document.getElementById(`carousel-${postId}`);
        if (el) el.scrollBy({ left: direction * el.clientWidth, behavior: 'smooth' });
    };

    const sharePost = (postId, text) => window.Spottio?.sharePost(postId, text);
    const openMedia = (url) => { if (url) window.open(url, '_blank'); };

    return { toggleLike, addComment, saveCommentEdit, confirmDelete, scrollCarousel, sharePost, openMedia };
};

// Modale di modifica spot
window.SpottioComposables.useEditPostModal = function({ posts }) {
    const { reactive } = Vue;
    const MAX_CATEGORIES = 5;
    const editModal = reactive({ show: false, postId: '', text: '', categories: [], mediaList: [], newFiles: [], loading: false });
    const categoriesList = reactive(['Generale', 'Sport', 'Tecnologia', 'Musica', 'Arte', 'Viaggi', 'Cibo', 'Studio']);

    if (window.Spottio?.getCategoriesList) {
        window.Spottio.getCategoriesList().then(cats => {
            if (cats?.length) categoriesList.splice(0, categoriesList.length, ...cats);
        }).catch(() => {});
    }

    const openEditModal = (post) => {
        if (!post) return;
        const pData = post.data || post;
        editModal.show = true;
        editModal.postId = post.id || pData.id || '';
        editModal.text = pData.text || post.text || '';
        editModal.categories = Array.isArray(post.categories) ? [...post.categories].slice(0, MAX_CATEGORIES) : (pData.categories ? pData.categories.slice(0, MAX_CATEGORIES) : ['Generale']);
        editModal.mediaList = Array.isArray(pData.mediaList) ? [...pData.mediaList] : (post.mediaList || []);
        editModal.newFiles = [];
        editModal.loading = false;
    };

    const toggleCategory = (cat) => {
        const idx = editModal.categories.indexOf(cat);
        if (idx > -1) { 
            if (editModal.categories.length > 1) editModal.categories.splice(idx, 1); 
        } else { 
            if (editModal.categories.length >= MAX_CATEGORIES) {
                alert(`Puoi associare al massimo ${MAX_CATEGORIES} categorie a questo spot.`);
                return;
            }
            editModal.categories.push(cat); 
        }
    };

    const removeMedia = (idx) => editModal.mediaList.splice(idx, 1);
    const onFilesSelected = (e) => { editModal.newFiles = e.target?.files ? Array.from(e.target.files) : []; };

    const saveEdit = async () => {
        if (!editModal.postId) return;
        editModal.loading = true;
        try {
            const updatedMediaList = [...editModal.mediaList];
            if (editModal.newFiles.length && window.Spottio?.uploadToCloudinary) {
                for (const file of editModal.newFiles) {
                    const uploaded = await window.Spottio.uploadToCloudinary(file, 'w_1080,c_limit,f_auto,q_auto');
                    if (uploaded?.url) updatedMediaList.push(uploaded);
                }
            }
            const updatePayload = {
                text: (editModal.text || '').trim(),
                categories: editModal.categories.length ? editModal.categories.slice(0, MAX_CATEGORIES) : ['Generale'],
                mediaList: updatedMediaList
            };
            await window.db.collection("posts").doc(editModal.postId).update(updatePayload);
            const target = posts?.value?.find(p => p.id === editModal.postId);
            if (target) {
                if (target.data) Object.assign(target.data, updatePayload);
                Object.assign(target, updatePayload);
            }
            editModal.show = false;
        } catch (err) {
            alert("Impossibile aggiornare lo spot.");
        } finally {
            editModal.loading = false;
        }
    };

    return { editModal, categoriesList, openEditModal, toggleCategory, removeMedia, onFilesSelected, saveEdit };
};

// Componente Globale Modale Modifica Spot
window.SpottioComposables.SpotEditModalComponent = {
    props: ['modal', 'categoriesList'],
    emits: ['close', 'save', 'toggle-category', 'remove-media', 'files-selected'],
    template: `
    <div v-if="modal && modal.show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" @click.self="$emit('close')">
        <div class="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col text-gray-800">
            <h3 class="font-bold text-gray-800 text-lg mb-3">Modifica Spot</h3>
            <div class="overflow-y-auto custom-scrollbar flex-grow space-y-4 pr-1">
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Testo dello Spot</label>
                    <textarea v-model="modal.text" class="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm text-gray-800" rows="3"></textarea>
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
                <button @click="$emit('close')" class="w-1/2 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition text-sm">Annulla</button>
                <button @click="$emit('save')" :disabled="modal.loading" class="w-1/2 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50 text-sm">
                    {{ modal.loading ? 'Salvataggio...' : 'Salva' }}
                </button>
            </div>
        </div>
    </div>
    `
};