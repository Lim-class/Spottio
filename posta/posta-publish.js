// posta-publish.js - Gestione UI (Spot / Spotino / Flashspot) e Pubblicazione Centralizzata

window.currentCreationType = 'post'; 

// --- Gestione Toggle Spot / Spotini / Flashspot ---
window.toggleCreationType = function(type) {
    window.currentCreationType = type;
    
    const btnPost = document.getElementById('btn-type-post');
    const btnSpotino = document.getElementById('btn-type-spotino');
    const btnStory = document.getElementById('btn-type-story');

    const categorySection = document.getElementById('category-section');
    const storySettingsPanel = document.getElementById('story-settings-panel');
    const postDurationSection = document.getElementById('post-duration-section');
    const spotinoInfoPanel = document.getElementById('spotino-info-panel');
    const submitBtn = document.getElementById('submit-btn');

    const fileInput = document.getElementById('file-upload');

    // Reset classi base bottoni
    [btnPost, btnSpotino, btnStory].forEach(b => {
        if (b) b.className = "w-1/3 py-2 rounded-lg text-sm font-bold text-gray-500 hover:text-gray-800 transition";
    });

    // Reset stili pulsante submit
    if (submitBtn) {
        submitBtn.className = "w-full text-white font-bold py-4 px-6 rounded-2xl transition-all hover:shadow-lg";
    }

    if (type === 'flashspot') {
        if (btnStory) btnStory.className = "w-1/3 py-2 rounded-lg bg-white shadow text-sm font-bold text-gray-800 transition";
        
        if (storySettingsPanel) storySettingsPanel.classList.remove('hidden');
        if (spotinoInfoPanel) spotinoInfoPanel.classList.add('hidden');
        if (categorySection) categorySection.classList.add('hidden');
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
    
    // Validazione specifica per Spotino: obbligo di almeno un video
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

        let newContent = {
            user: currentUid,            
            text: postText,
            mediaList: uploadedMediaList,           
            timestamp: firebase.firestore.FieldValue.serverTimestamp(), 
            type: window.currentCreationType, 
            likes: [],
            comments: []
        };

        // Gestione categorie e durata effimera per Spot e Spotini
        if (window.currentCreationType === 'post' || window.currentCreationType === 'spotino') {
            let selectedCategories = ["Generale"];
            if (hiddenCategoryInput && hiddenCategoryInput.value) {
                try { selectedCategories = JSON.parse(hiddenCategoryInput.value); } 
                catch(e) { selectedCategories = ["Generale"]; }
            }
            newContent.categories = selectedCategories.slice(0, 5);

            // Calcolo durata e scadenza esatta
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
            
            // Calcolo scadenza esatta anche per i Flashspot
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

    if (typeof fetchCategories === 'function') await fetchCategories();
    if (typeof setupCategoryAutocomplete === 'function') setupCategoryAutocomplete();

    if (postForm) {
        postForm.addEventListener('submit', function(e) {
            e.preventDefault();
            window.publishPost();
        });
    }
});