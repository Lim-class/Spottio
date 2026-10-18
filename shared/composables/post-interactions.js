// shared/composables/post-interactions.js
window.SpottioComposables = window.SpottioComposables || {};

// Parser comune post e commenti con verifica di privacy, Flashspot e Co-Autori
window.SpottioComposables.parsePostList = async function(rawDocs, currentUsername, viewerUid = null) {
    const formatted = [];
    const currentViewer = viewerUid || (window.Spottio?.getCurrentUid ? window.Spottio.getCurrentUid() : localStorage.getItem('currentUid'));

    for (let p of rawDocs) {
        const authorProfile = await window.Spottio.getUserProfile(p.data.user);
        
        // Risolve tutti i co-autori e controlla se hanno storie attive
        const coAuthorProfiles = [];
        if (p.data.coAuthors && Array.isArray(p.data.coAuthors)) {
            for (let cUid of p.data.coAuthors) {
                const cProf = await window.Spottio.getUserProfile(cUid);
                const hasSt = window.Spottio?.hasActiveFlashspot 
                    ? await window.Spottio.hasActiveFlashspot(cUid, currentViewer)
                    : false;
                if (cProf) {
                    coAuthorProfiles.push({ ...cProf, hasActiveStories: hasSt });
                }
            }
        }

        const hasActiveStories = window.Spottio?.hasActiveFlashspot 
            ? await window.Spottio.hasActiveFlashspot(p.data.user, currentViewer) 
            : false;

        const parsedComments = (p.data.comments || []).map(c => ({
            ...c, isEditing: false, editText: c.text
        }));
        for (let c of parsedComments) c.authorProfile = await window.Spottio.getUserProfile(c.user);

        const likesArr = p.data.likes || [];
        const hasLiked = currentViewer ? (likesArr.includes(currentViewer) || (currentUsername && likesArr.includes(currentUsername))) : false;

        formatted.push({
            ...p,
            authorProfile,
            coAuthorProfiles,
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

// Interazioni utente sui post basate su UID
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
                await ref.update({ 
                    likes: firebase.firestore.FieldValue.arrayRemove(uid) 
                });
                if (username) {
                    await ref.update({ likes: firebase.firestore.FieldValue.arrayRemove(username) }).catch(() => {});
                }
                await userLikedRef.delete();

                post.data.likes = (post.data.likes || []).filter(u => u !== uid && u !== username);
                post.hasLiked = false;

                if (refreshAlgorithm && window.FeedAlgorithm) post.categories?.forEach(c => window.FeedAlgorithm.updateScore(c, -1));
                if (onLikeToggledCallback) onLikeToggledCallback(post.id, false);
            } else {
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

                if (refreshAlgorithm && window.FeedAlgorithm) post.categories?.forEach(c => window.FeedAlgorithm.updateScore(c, 1));
                if (onLikeToggledCallback) onLikeToggledCallback(post.id, true);
            }
        } catch (err) {
            console.error("Errore like:", err);
        }
    };

    const addComment = async (post) => {
        const text = post.newComment?.trim();
        const userUid = session.value?.uid;
        if (!text || !userUid || userUid === 'null' || userUid === 'Guest') return;
        post.isCommenting = true;

        const timestamp = firebase.firestore.Timestamp.fromDate(new Date());
        const newC = { user: userUid, text, timestamp };

        try {
            const batch = window.db.batch();
            const postRef = window.db.collection("posts").doc(post.id);
            const userCommentedRef = window.db.collection("users").doc(userUid).collection("commented_posts").doc(post.id);

            batch.update(postRef, {
                comments: firebase.firestore.FieldValue.arrayUnion(newC)
            });

            batch.set(userCommentedRef, {
                postId: post.id,
                lastCommentedAt: firebase.firestore.FieldValue.serverTimestamp(),
                commentCount: firebase.firestore.FieldValue.increment(1)
            }, { merge: true });

            await batch.commit();

            const profile = await window.Spottio.getUserProfile(userUid);
            post.data.comments.push({ ...newC, authorProfile: profile, isEditing: false, editText: text });
            post.newComment = '';
            if (refreshAlgorithm && window.FeedAlgorithm) post.categories?.forEach(c => window.FeedAlgorithm.updateScore(c, 2));
        } catch (err) {
            console.error("Errore invio commento:", err);
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

    const deleteComment = async (post, idx) => {
        if (!confirm("Vuoi davvero eliminare questo commento?")) return;
        try {
            const docRef = window.db.collection("posts").doc(post.id);
            const freshDoc = await docRef.get();
            let freshComments = freshDoc.data().comments || [];
            if (freshComments[idx]) {
                freshComments.splice(idx, 1);
                await docRef.update({ comments: freshComments });
                post.data.comments.splice(idx, 1);
            }
        } catch (e) {
            console.error("Errore eliminazione commento:", e);
            alert("Errore durante l'eliminazione del commento");
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

    return { toggleLike, addComment, saveCommentEdit, deleteComment, confirmDelete, scrollCarousel, sharePost, openMedia };
};

// Modale di modifica spot con ricerca, aggiunta e rimozione interattiva dei Co-Autori
window.SpottioComposables.useEditPostModal = function({ posts }) {
    const { reactive } = Vue;
    const MAX_CATEGORIES = 5;
    const MAX_COAUTHORS = 3;
    let coAuthorSearchTimeout = null;

    const editModal = reactive({ 
        show: false, 
        postId: '', 
        text: '', 
        categories: [], 
        coAuthors: [], 
        coAuthorProfiles: [], 
        coAuthorSearchTerm: '',
        coAuthorSearchResults: [],
        mediaList: [], 
        newFiles: [], 
        loading: false 
    });

    const categoriesList = reactive(['Generale', 'Sport', 'Tecnologia', 'Musica', 'Arte', 'Viaggi', 'Cibo', 'Studio']);

    if (window.Spottio?.getCategoriesList) {
        window.Spottio.getCategoriesList().then(cats => {
            if (cats?.length) categoriesList.splice(0, categoriesList.length, ...cats);
        }).catch(() => {});
    }

    const openEditModal = async (post) => {
        if (!post) return;
        const pData = post.data || post;
        editModal.show = true;
        editModal.postId = post.id || pData.id || '';
        editModal.text = pData.text || post.text || '';
        editModal.categories = Array.isArray(post.categories) ? [...post.categories].slice(0, MAX_CATEGORIES) : (pData.categories ? pData.categories.slice(0, MAX_CATEGORIES) : ['Generale']);
        editModal.coAuthors = pData.coAuthors ? [...pData.coAuthors] : [];
        editModal.coAuthorSearchTerm = '';
        editModal.coAuthorSearchResults = [];
        editModal.mediaList = Array.isArray(pData.mediaList) ? [...pData.mediaList] : (post.mediaList || []);
        editModal.newFiles = [];
        editModal.loading = false;

        editModal.coAuthorProfiles = [];
        for (let uid of editModal.coAuthors) {
            const prof = await window.Spottio.getUserProfile(uid);
            if (prof) editModal.coAuthorProfiles.push(prof);
        }
    };

    const searchCoAuthors = () => {
        clearTimeout(coAuthorSearchTimeout);
        const term = (editModal.coAuthorSearchTerm || '').trim().toLowerCase();
        if (term.length < 2) {
            editModal.coAuthorSearchResults = [];
            return;
        }

        coAuthorSearchTimeout = setTimeout(async () => {
            try {
                const targetPost = posts?.value?.find(p => p.id === editModal.postId);
                const postOwnerUid = targetPost?.data?.user;

                let snap = await window.db.collection("users")
                    .where("username_lower", ">=", term)
                    .where("username_lower", "<=", term + '\uf8ff')
                    .limit(5)
                    .get();

                if (snap.empty) {
                    snap = await window.db.collection("users")
                        .where("username", ">=", term)
                        .where("username", "<=", term + '\uf8ff')
                        .limit(5)
                        .get();
                }

                const results = [];
                snap.forEach(doc => {
                    const u = doc.data();
                    if (doc.id !== postOwnerUid && !editModal.coAuthors.includes(doc.id)) {
                        results.push({
                            uid: doc.id,
                            username: u.username || 'Utente',
                            userPfUri: u.userPfUri || u.profileImage || '',
                            isVerified: u.isVerified === true
                        });
                    }
                });
                editModal.coAuthorSearchResults = results;
            } catch (err) {
                console.error("Errore ricerca co-autori in modifica:", err);
            }
        }, 300);
    };

    const addCoAuthor = (user) => {
        if (editModal.coAuthors.length >= MAX_COAUTHORS) {
            alert(`Puoi aggiungere al massimo ${MAX_COAUTHORS} co-autori.`);
            return;
        }
        if (!editModal.coAuthors.includes(user.uid)) {
            editModal.coAuthors.push(user.uid);
            editModal.coAuthorProfiles.push(user);
        }
        editModal.coAuthorSearchTerm = '';
        editModal.coAuthorSearchResults = [];
    };

    const removeCoAuthor = (uid) => {
        editModal.coAuthors = editModal.coAuthors.filter(id => id !== uid);
        editModal.coAuthorProfiles = editModal.coAuthorProfiles.filter(p => p.uid !== uid);
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

            const targetPost = posts?.value?.find(p => p.id === editModal.postId);
            const mainAuthorUid = targetPost?.data?.user || (window.Spottio ? window.Spottio.getCurrentUid() : '');

            const updatePayload = {
                text: (editModal.text || '').trim(),
                categories: editModal.categories.length ? editModal.categories.slice(0, MAX_CATEGORIES) : ['Generale'],
                coAuthors: editModal.coAuthors || [],
                allAuthors: [mainAuthorUid, ...(editModal.coAuthors || [])],
                mediaList: updatedMediaList
            };

            await window.db.collection("posts").doc(editModal.postId).update(updatePayload);
            
            if (targetPost) {
                if (targetPost.data) Object.assign(targetPost.data, updatePayload);
                targetPost.coAuthorProfiles = [...editModal.coAuthorProfiles];
                Object.assign(targetPost, updatePayload);
            }
            editModal.show = false;
        } catch (err) {
            console.error("Errore aggiornamento:", err);
            alert("Impossibile aggiornare lo spot.");
        } finally {
            editModal.loading = false;
        }
    };

    return { 
        editModal, categoriesList, openEditModal, searchCoAuthors, addCoAuthor,
        removeCoAuthor, toggleCategory, removeMedia, onFilesSelected, saveEdit 
    };
};