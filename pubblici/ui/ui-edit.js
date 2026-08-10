// ui-edit.js - Gestione MODIFICHE POST (Incluso Carosello)

let currentEditMediaItems = []; 

async function fetchCategoriesForEdit(selectedCategoriesArray) {
    const categorySelect = document.getElementById('edit-category');
    if (!categorySelect || !window.db) return;

    try {
        categorySelect.innerHTML = '<option value="Generale">Generale</option>';
        
        const categoryList = await window.Spottio.getCategoriesList();
        
        categoryList.forEach(catName => {
            if (catName !== "Generale") {
                const option = document.createElement('option');
                option.value = catName;
                option.textContent = catName;
                
                if (selectedCategoriesArray.includes(catName)) {
                    option.selected = true;
                }
                categorySelect.appendChild(option);
            }
        });
        
        if (selectedCategoriesArray.includes("Generale")) {
            const genOption = Array.from(categorySelect.options).find(opt => opt.value === "Generale");
            if (genOption) genOption.selected = true;
        }

    } catch (error) {
        console.error("Errore caricamento categorie nel modale:", error);
    }
}

function renderEditMediaPreview() {
    const container = document.getElementById('edit-media-preview-container');
    if (!container) return;

    container.innerHTML = '';

    if (currentEditMediaItems.length === 0) {
        container.innerHTML = '<p class="text-xs text-gray-400 italic">Nessun media allegato.</p>';
        return;
    }

    currentEditMediaItems.forEach((item, index) => {
        const itemWrapper = document.createElement('div');
        itemWrapper.className = 'relative group w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-black flex items-center justify-center shrink-0';

        let mediaElement = '';
        if (item.isVideo) {
            mediaElement = `<video src="${item.url}" class="w-full h-full object-cover"></video>`;
        } else {
            mediaElement = `<img src="${item.url}" class="w-full h-full object-cover">`;
        }

        itemWrapper.innerHTML = `
            ${mediaElement}
            <button type="button" onclick="window.removeMediaFromEdit(${index})" class="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700 transition">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        `;
        container.appendChild(itemWrapper);
    });
}

window.removeMediaFromEdit = function(index) {
    currentEditMediaItems.splice(index, 1);
    renderEditMediaPreview();
};

window.openEditModal = function(postId, text, categoriesStrOrArray) {
    const modal = document.getElementById('edit-modal');
    if (!modal) return;

    document.getElementById('edit-post-id').value = postId;
    document.getElementById('edit-text').value = text;
    
    currentEditMediaItems = [];
    if (window.postEditCache && window.postEditCache[postId]) {
        currentEditMediaItems = [...window.postEditCache[postId]];
    }

    renderEditMediaPreview();
    
    let parsedCategories = ["Generale"];
    if (Array.isArray(categoriesStrOrArray)) {
        parsedCategories = categoriesStrOrArray;
    } else if (typeof categoriesStrOrArray === 'string') {
        try {
            const cleanStr = categoriesStrOrArray.replace(/&quot;/g, '"');
            parsedCategories = JSON.parse(cleanStr);
        } catch(e) {
            parsedCategories = [categoriesStrOrArray];
        }
    }
    
    fetchCategoriesForEdit(parsedCategories); 

    modal.classList.remove('hidden');
    modal.classList.add('flex'); 
};

window.closeEditModal = function() {
    const modal = document.getElementById('edit-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const cancelBtn = document.getElementById('cancel-edit');
    const saveBtn = document.getElementById('save-edit');
    const newFileInput = document.getElementById('edit-media-file-input');

    if (cancelBtn) cancelBtn.addEventListener('click', window.closeEditModal);

    if (newFileInput) {
        newFileInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            if (!files.length) return;

            for (const file of files) {
                const isVideo = file.type.startsWith('video/');
                const tempUrl = URL.createObjectURL(file);
                
                currentEditMediaItems.push({
                    url: tempUrl,
                    fileObj: file,
                    isVideo: isVideo
                });
            }
            renderEditMediaPreview();
            newFileInput.value = ''; 
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const postId = document.getElementById('edit-post-id').value;
            const newText = document.getElementById('edit-text').value.trim();
            const selectElement = document.getElementById('edit-category');
            
            let newCategories = Array.from(selectElement.selectedOptions).map(opt => opt.value);
            if (newCategories.length === 0) newCategories.push("Generale");

            if (!newText) {
                alert("Il testo del post non può essere vuoto.");
                return;
            }

            saveBtn.disabled = true;
            saveBtn.innerText = "Salvataggio in corso...";

            try {
                const finalMediaList = [];
                for (const item of currentEditMediaItems) {
                    if (item.fileObj) {
                        const storageRef = firebase.storage().ref(`posts_media/${Date.now()}_${item.fileObj.name}`);
                        const snapshot = await storageRef.put(item.fileObj);
                        const downloadURL = await snapshot.ref.getDownloadURL();
                        finalMediaList.push({ url: downloadURL, isVideo: item.isVideo });
                    } else {
                        finalMediaList.push({ url: item.url, isVideo: item.isVideo });
                    }
                }

                // Costruisci il payload cancellando attivamente i vecchi campi obsoleti per pulire il DB
                const updatePayload = {
                    text: newText,
                    categories: newCategories,
                    category: firebase.firestore.FieldValue.delete(),
                    mediaList: finalMediaList,
                    
                    // Auto-pulizia DB dai campi dismessi
                    mediaUri: firebase.firestore.FieldValue.delete(),
                    isVideo: firebase.firestore.FieldValue.delete(),
                    author: firebase.firestore.FieldValue.delete()
                };

                await window.db.collection('posts').doc(postId).update(updatePayload);
                
                // Aggiornamento DOM senza reload
                const updatedDoc = await window.db.collection('posts').doc(postId).get();
                if (updatedDoc.exists) {
                    const currentUser = localStorage.getItem('currentUser') || "Guest";
                    const isAdmin = localStorage.getItem('isAdmin') === 'true';
                    await window.renderPost(postId, updatedDoc.data(), currentUser, isAdmin);
                }
                
            } catch (error) {
                console.error("Errore durante la modifica del post:", error);
                alert("Impossibile salvare le modifiche. Riprova.");
            } finally {
                saveBtn.disabled = false;
                saveBtn.innerText = "Salva";
                window.closeEditModal();
            }
        });
    }
});