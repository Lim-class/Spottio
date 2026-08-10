// posta-publish.js - Upload Cloudinary e Pubblicazione Post

// 3. Upload su Cloudinary
async function uploadMediaToCloudinary(file) {
    if (!file) return null;
    const cloudName = "c32kn8tz";
    const uploadPreset = "spottio_preset";

    const isVideo = file.type.startsWith('video/');
    const mediaType = isVideo ? "video" : "image";
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${mediaType}/upload`, {
        method: "POST",
        body: formData
    });

    if (!response.ok) throw new Error("Errore durante l'upload del media.");

    const data = await response.json();
    const optimizedUrl = data.secure_url.replace('/upload/', '/upload/f_auto,q_auto/');
    return { url: optimizedUrl, isVideo: isVideo };
}

// 4. Pubblicazione
window.publishPost = async function() {
    const currentUid = window.Spottio ? window.Spottio.getCurrentUid() : null; 
    
    const textInput = document.getElementById('post-text');
    const statusMsg = document.getElementById('status-message');
    const submitBtn = document.getElementById('submit-btn');
    const hiddenCategoryInput = document.getElementById('post-category');

    if (!currentUid || currentUid === "null") return alert("Effettua nuovamente il login.");

    const postText = textInput.value.trim();
    
    let selectedCategories = ["Generale"];
    if (hiddenCategoryInput && hiddenCategoryInput.value) {
        try {
            selectedCategories = JSON.parse(hiddenCategoryInput.value);
        } catch(e) {
            selectedCategories = ["Generale"];
        }
    }

    if (!postText && window.selectedFilesArray.length === 0) {
        return alert("Inserisci un testo o allega almeno un file!");
    }

    submitBtn.disabled = true;
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="animate-pulse">Pubblicazione in corso...</span>';
    
    if (statusMsg) {
        statusMsg.style.display = 'block';
        statusMsg.className = "mt-4 text-center text-sm font-medium text-blue-600";
        statusMsg.innerText = "Preparazione media...";
    }

    try {
        let uploadedMediaList = [];

        if (window.selectedFilesArray.length > 0) {
            let uploadedCount = 0;
            const uploadPromises = window.selectedFilesArray.map(async (file) => {
                const res = await uploadMediaToCloudinary(file);
                uploadedCount++;
                if (statusMsg) statusMsg.innerText = `Caricamento file (${uploadedCount}/${window.selectedFilesArray.length})...`;
                return res;
            });
            uploadedMediaList = await Promise.all(uploadPromises);
        }

        if (statusMsg) statusMsg.innerText = "Salvataggio post in corso...";

        const newPost = {
            user: currentUid,            
            text: postText,
            mediaList: uploadedMediaList,           
            timestamp: firebase.firestore.FieldValue.serverTimestamp(), 
            categories: selectedCategories,
            likes: [],
            comments: []
        };

        await window.db.collection("posts").add(newPost);

        if (statusMsg) {
            statusMsg.className = "mt-4 text-center text-sm font-bold text-green-600";
            statusMsg.innerText = "Post pubblicato con successo! 🎉";
        }

        // Reset dei campi e dell'array globale
        textInput.value = '';
        window.selectedFilesArray = [];
        
        if (typeof selectedCategoriesList !== 'undefined') {
            selectedCategoriesList = ["Generale"];
            if (typeof renderSelectedCategories === 'function') renderSelectedCategories();
        }
        if (typeof window.renderPreviews === 'function') window.renderPreviews();
        
        setTimeout(() => {
            if (statusMsg) statusMsg.style.display = 'none';
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }, 2000);

    } catch (error) {
        console.error(error);
        if (statusMsg) {
            statusMsg.className = "mt-4 text-center text-sm font-medium text-red-600";
            statusMsg.innerText = "Errore: " + error.message;
        }
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
};

// Inizializzazione Eventi DOM per Categorie e Modulo
document.addEventListener('DOMContentLoaded', async function() {
    const postForm = document.getElementById('public-post-form');

    // Avvia funzioni da posta-categories.js
    if (typeof fetchCategories === 'function') await fetchCategories();
    if (typeof setupCategoryAutocomplete === 'function') setupCategoryAutocomplete();

    // Sottomissione modulo
    if (postForm) {
        postForm.addEventListener('submit', function(e) {
            e.preventDefault();
            window.publishPost();
        });
    }
});