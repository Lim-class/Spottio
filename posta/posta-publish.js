// posta-publish.js - Gestione UI (Spot / Spotino / Flashspot) e Pubblicazione Centralizzata

window.currentCreationType = 'post'; 
window.selectedCoAuthors = []; // Array di { uid, username, avatarUrl, isVerified }
const MAX_COAUTHORS = 3;

// --- Gestione Ricerca e Rendering Co-Autori con Avatar ---
function setupCoAuthorsHandler() {
    const searchInput = document.getElementById('coauthor-search');
    const dropdown = document.getElementById('coauthor-dropdown');
    const countLabel = document.getElementById('coauthors-count');
    const container = document.getElementById('selected-coauthors-container');
    let debounceTimer = null;

    if (!searchInput || !dropdown) return;

    window.renderSelectedCoAuthors = function() {
        if (!container) return;
        container.innerHTML = '';
        if (countLabel) countLabel.innerText = `${window.selectedCoAuthors.length}/${MAX_COAUTHORS}`;

        window.selectedCoAuthors.forEach((user, index) => {
            const chip = document.createElement('div');
            chip.className = "bg-white border border-gray-200 hover:border-purple-300 rounded-2xl pl-1.5 pr-2.5 py-1 text-xs font-semibold flex items-center gap-2 shadow-sm transition";
            
            const avatarHtml = window.Spottio && typeof window.Spottio.getAvatarHtml === 'function'
                ? window.Spottio.getAvatarHtml(user.avatarUrl, user.username, "w-6 h-6 text-[10px]")
                : `<div class="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-[10px]">${(user.username || 'U').charAt(0).toUpperCase()}</div>`;

            const verifiedBadge = user.isVerified 
                ? (window.Spottio?.getVerifiedBadge ? window.Spottio.getVerifiedBadge(true, "w-3 h-3 text-blue-500 ml-0.5 inline-block") : '<span class="text-blue-500 font-bold ml-0.5">✓</span>')
                : '';

            chip.innerHTML = `
                <div class="shrink-0 flex items-center justify-center">${avatarHtml}</div>
                <div class="flex items-center gap-0.5 max-w-[120px] truncate">
                    <span class="text-gray-800 font-bold truncate">@${user.username}</span>
                    ${verifiedBadge}
                </div>
                <button type="button" class="text-gray-400 hover:text-red-500 font-bold text-sm leading-none ml-1 cursor-pointer">&times;</button>
            `;
            
            chip.querySelector('button').onclick = () => {
                window.selectedCoAuthors.splice(index, 1);
                window.renderSelectedCoAuthors();
            };
            container.appendChild(chip);
        });
    };

    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const term = e.target.value.trim().toLowerCase();
        if (term.length < 2) {
            dropdown.classList.add('hidden');
            dropdown.innerHTML = '';
            return;
        }

        debounceTimer = setTimeout(async () => {
            try {
                const currentUid = window.Spottio?.getCurrentUid ? window.Spottio.getCurrentUid() : localStorage.getItem('currentUid');
                let snap = await window.db.collection("users")
                    .where("username_lower", ">=", term)
                    .where("username_lower", "<=", term + '\uf8ff')
                    .limit(6)
                    .get();

                if (snap.empty) {
                    snap = await window.db.collection("users")
                        .where("username", ">=", term)
                        .where("username", "<=", term + '\uf8ff')
                        .limit(6)
                        .get();
                }

                dropdown.innerHTML = '';
                const results = [];
                snap.forEach(doc => {
                    if (doc.id !== currentUid && !window.selectedCoAuthors.some(c => c.uid === doc.id)) {
                        results.push({ uid: doc.id, ...doc.data() });
                    }
                });

                if (results.length === 0) {
                    dropdown.innerHTML = `<div class="p-3 text-xs text-gray-400 italic text-center">Nessun utente trovato</div>`;
                } else {
                    results.forEach(u => {
                        const item = document.createElement('div');
                        item.className = "p-2.5 hover:bg-purple-50 cursor-pointer flex items-center justify-between transition text-xs";
                        
                        const uAvatar = u.userPfUri || u.profileImage || '';
                        const uName = u.username || 'Utente';
                        const avatarHtml = window.Spottio && typeof window.Spottio.getAvatarHtml === 'function'
                            ? window.Spottio.getAvatarHtml(uAvatar, uName, "w-8 h-8 text-xs")
                            : `<div class="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs">${uName.charAt(0).toUpperCase()}</div>`;

                        const verifiedBadge = u.isVerified === true 
                            ? (window.Spottio?.getVerifiedBadge ? window.Spottio.getVerifiedBadge(true, "w-3.5 h-3.5 text-blue-500 ml-1 inline-block") : '<span class="text-blue-500 font-bold ml-1">✓</span>')
                            : '';

                        item.innerHTML = `
                            <div class="flex items-center gap-2.5 min-w-0">
                                <div class="shrink-0">${avatarHtml}</div>
                                <div class="flex items-center gap-0.5 truncate">
                                    <span class="font-bold text-gray-800 truncate">@${uName}</span>
                                    ${verifiedBadge}
                                </div>
                            </div>
                            <span class="text-purple-600 font-bold text-[11px] bg-purple-100 hover:bg-purple-200 px-2 py-1 rounded-lg shrink-0 transition">+ Aggiungi</span>
                        `;

                        item.onclick = () => {
                            if (window.selectedCoAuthors.length >= MAX_COAUTHORS) {
                                alert(`Puoi aggiungere massimo ${MAX_COAUTHORS} co-autori.`);
                                return;
                            }
                            window.selectedCoAuthors.push({
                                uid: u.uid,
                                username: uName,
                                avatarUrl: uAvatar,
                                isVerified: u.isVerified === true
                            });
                            searchInput.value = '';
                            dropdown.classList.add('hidden');
                            window.renderSelectedCoAuthors();
                        };
                        dropdown.appendChild(item);
                    });
                }
                dropdown.classList.remove('hidden');
            } catch (err) {
                console.error("Errore ricerca co-autori:", err);
            }
        }, 300);
    });

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });
}

// --- Gestione Toggle Spot / Spotini / Flashspot ---
window.toggleCreationType = function(type) {
    window.currentCreationType = type;
    
    const btnPost = document.getElementById('btn-type-post');
    const btnSpotino = document.getElementById('btn-type-spotino');
    const btnStory = document.getElementById('btn-type-story');

    const categorySection = document.getElementById('category-section');
    const coauthorsSection = document.getElementById('coauthors-section');
    const storySettingsPanel = document.getElementById('story-settings-panel');
    const postDurationSection = document.getElementById('post-duration-section');
    const spotinoInfoPanel = document.getElementById('spotino-info-panel');
    const submitBtn = document.getElementById('submit-btn');

    const fileInput = document.getElementById('file-upload');

    // Reset classi base bottoni
    [btnPost, btnSpotino, btnStory].forEach(b => {
        if (b) b.className = "w-1/3 py-2 rounded-lg text-sm font-bold text-gray-500 hover:text-gray-800 transition";
    });

    if (submitBtn) {
        submitBtn.className = "w-full text-white font-bold py-4 px-6 rounded-2xl transition-all hover:shadow-lg";
    }

    if (type === 'flashspot') {
        if (btnStory) btnStory.className = "w-1/3 py-2 rounded-lg bg-white shadow text-sm font-bold text-gray-800 transition";
        
        if (storySettingsPanel) storySettingsPanel.classList.remove('hidden');
        if (spotinoInfoPanel) spotinoInfoPanel.classList.add('hidden');
        if (categorySection) categorySection.classList.add('hidden');
        if (coauthorsSection) coauthorsSection.classList.remove('hidden'); // Disponibile anche per Flashspot
        if (postDurationSection) postDurationSection.classList.add('hidden');
        
        if (submitBtn) {
            submitBtn.innerText = "Pubblica Flashspot";
            submitBtn.classList.add('bg-gradient-to-r', 'from-purple-600', 'to-pink-500', 'hover:from-purple-700', 'hover:to-pink-600');
        }

        if (fileInput) fileInput.accept = "image/*,video/*";

    } else if (type === 'spotino') {
        if (btnSpotino) btnSpotino.className = "w-1/3 py-2 rounded-lg bg-white shadow text-sm font-bold text-gray-800 transition";
        
        if (storySettingsPanel) storySettingsPanel.classList.add('hidden');
        if (spotinoInfoPanel) spotinoInfoPanel.classList.remove('hidden');
        if (categorySection) categorySection.classList.remove('hidden');
        if (coauthorsSection) coauthorsSection.classList.remove('hidden');
        if (postDurationSection) postDurationSection.classList.remove('hidden');
        
        if (submitBtn) {
            submitBtn.innerText = "Pubblica Spotino";
            submitBtn.classList.add('bg-gradient-to-r', 'from-red-600', 'to-orange-500', 'hover:from-red-700', 'hover:to-orange-600');
        }

        if (fileInput) fileInput.accept = "video/*";

    } else { // Post Standard
        if (btnPost) btnPost.className = "w-1/3 py-2 rounded-lg bg-white shadow text-sm font-bold text-gray-800 transition";
        
        if (storySettingsPanel) storySettingsPanel.classList.add('hidden');
        if (spotinoInfoPanel) spotinoInfoPanel.classList.add('hidden');
        if (categorySection) categorySection.classList.remove('hidden');
        if (coauthorsSection) coauthorsSection.classList.remove('hidden');
        if (postDurationSection) postDurationSection.classList.remove('hidden');
        
        if (submitBtn) {
            submitBtn.innerText = "Spotta";
            submitBtn.classList.add('bg-[#212121]', 'hover:bg-black');
        }

        if (fileInput) fileInput.accept = "image/*,video/*";
    }
};

// --- Pubblicazione ---
window.publishPost = async function() {
    const currentUid = window.Spottio?.getCurrentUid ? window.Spottio.getCurrentUid() : localStorage.getItem('currentUid'); 
    
    const textInput = document.getElementById('post-text');
    const statusMsg = document.getElementById('status-message');
    const submitBtn = document.getElementById('submit-btn');
    const hiddenCategoryInput = document.getElementById('post-category');

    if (!currentUid || currentUid === "null") return alert("Effettua nuovamente il login.");

    const postText = textInput ? textInput.value.trim() : "";
    
    if (window.currentCreationType === 'spotino') {
        if (!window.selectedFilesArray || window.selectedFilesArray.length === 0) {
            return alert("Devi allegare un video per pubblicare uno Spotino!");
        }
        const hasVideo = window.selectedFilesArray.some(f => f.type.startsWith('video/'));
        if (!hasVideo) {
            return alert("Gli Spotini devono essere contenuti video!");
        }
    } else {
        if (!postText && (!window.selectedFilesArray || window.selectedFilesArray.length === 0)) {
            return alert("Inserisci un testo o allega almeno un file!");
        }
    }

    if (submitBtn) submitBtn.disabled = true;
    const originalBtnText = submitBtn ? submitBtn.innerHTML : "Spotta";
    if (submitBtn) submitBtn.innerHTML = '<span class="animate-pulse">Pubblicazione in corso...</span>';
    
    if (statusMsg) {
        statusMsg.style.display = 'block';
        statusMsg.className = "mt-4 text-center text-sm font-medium text-blue-600";
        statusMsg.innerText = "Preparazione media...";
    }

    try {
        let uploadedMediaList = [];

        if (window.selectedFilesArray && window.selectedFilesArray.length > 0) {
            let uploadedCount = 0;
            const uploadPromises = window.selectedFilesArray.map(async (file) => {
                const res = await window.Spottio.uploadToCloudinary(file);
                uploadedCount++;
                if (statusMsg) statusMsg.innerText = `Caricamento file (${uploadedCount}/${window.selectedFilesArray.length})...`;
                return res;
            });
            uploadedMediaList = await Promise.all(uploadPromises);
        }

        if (statusMsg) statusMsg.innerText = "Salvataggio in corso...";

        const coAuthorUids = (window.selectedCoAuthors || []).map(c => c.uid);

        let newContent = {
            user: currentUid,
            coAuthors: coAuthorUids,
            allAuthors: [currentUid, ...coAuthorUids],
            text: postText,
            mediaList: uploadedMediaList,           
            timestamp: firebase.firestore.FieldValue.serverTimestamp(), 
            type: window.currentCreationType, 
            likes: [],
            comments: []
        };

        if (window.currentCreationType === 'post' || window.currentCreationType === 'spotino') {
            let selectedCategories = ["Generale"];
            if (hiddenCategoryInput && hiddenCategoryInput.value) {
                try { selectedCategories = JSON.parse(hiddenCategoryInput.value); } 
                catch(e) { selectedCategories = ["Generale"]; }
            }
            newContent.categories = selectedCategories.slice(0, 5);

            const postDurationVal = document.getElementById('post-duration')?.value || 'permanent';
            newContent.duration = postDurationVal;
            if (postDurationVal !== 'permanent') {
                const durationHours = parseInt(postDurationVal, 10);
                newContent.expiresAt = firebase.firestore.Timestamp.fromDate(new Date(Date.now() + durationHours * 3600 * 1000));
            } else {
                newContent.expiresAt = null;
            }

        } else if (window.currentCreationType === 'flashspot') {
            const storyDuration = document.getElementById('story-duration')?.value || "24";
            const storyFolder = document.getElementById('story-folder')?.value.trim() || null;
            
            newContent.duration = storyDuration; 
            newContent.folder = storyFolder;     
            newContent.categories = ["Flashspot"]; 
            
            if (storyDuration !== 'permanent') {
                const durHours = parseInt(storyDuration, 10) || 24;
                newContent.expiresAt = firebase.firestore.Timestamp.fromDate(new Date(Date.now() + durHours * 3600 * 1000));
            } else {
                newContent.expiresAt = null;
            }
        }

        const dbInstance = window.db || firebase.firestore();
        await dbInstance.collection("posts").add(newContent);

        if (statusMsg) {
            statusMsg.className = "mt-4 text-center text-sm font-bold text-green-600";
            if (window.currentCreationType === 'flashspot') statusMsg.innerText = "Flashspot pubblicato con successo! ⚡";
            else if (window.currentCreationType === 'spotino') statusMsg.innerText = "Spotino pubblicato con successo! 🎬";
            else statusMsg.innerText = "Spot pubblicato con successo! 🎉";
        }

        // Reset UI
        if (textInput) textInput.value = '';
        window.selectedFilesArray = [];
        window.selectedCoAuthors = [];
        if (typeof window.renderSelectedCoAuthors === 'function') window.renderSelectedCoAuthors();

        const folderInput = document.getElementById('story-folder');
        if (folderInput) folderInput.value = '';
        
        if (typeof selectedCategoriesList !== 'undefined') {
            selectedCategoriesList = ["Generale"];
            if (typeof renderSelectedCategories === 'function') renderSelectedCategories();
        }
        if (typeof window.renderPreviews === 'function') window.renderPreviews();
        
        setTimeout(() => {
            if (statusMsg) statusMsg.style.display = 'none';
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        }, 2000);

    } catch (error) {
        console.error(error);
        if (statusMsg) {
            statusMsg.className = "mt-4 text-center text-sm font-medium text-red-600";
            statusMsg.innerText = "Errore: " + error.message;
        }
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
};

document.addEventListener('DOMContentLoaded', async function() {
    const postForm = document.getElementById('public-post-form');

    const btnPost = document.getElementById('btn-type-post');
    const btnSpotino = document.getElementById('btn-type-spotino');
    const btnStory = document.getElementById('btn-type-story');

    if (btnPost) btnPost.addEventListener('click', () => window.toggleCreationType('post'));
    if (btnSpotino) btnSpotino.addEventListener('click', () => window.toggleCreationType('spotino'));
    if (btnStory) btnStory.addEventListener('click', () => window.toggleCreationType('flashspot'));

    setupCoAuthorsHandler();

    if (typeof fetchCategories === 'function') await fetchCategories();
    if (typeof setupCategoryAutocomplete === 'function') setupCategoryAutocomplete();

    if (postForm) {
        postForm.addEventListener('submit', function(e) {
            e.preventDefault();
            window.publishPost();
        });
    }
});