// posta.js - Gestione ESCLUSIVA per la creazione dei post (posta.html)

async function fetchCategories() {
    const categorySelect = document.getElementById('post-category');
    if (!categorySelect) return;

    try {
        categorySelect.innerHTML = '<option value="Generale">Generale</option>';

        const snapshot = await window.db.collection('categories').get();
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.name && data.name !== "Generale") {
                const option = document.createElement('option');
                option.value = data.name;
                option.textContent = data.name;
                categorySelect.appendChild(option);
            }
        });
    } catch (error) {
        console.error("Errore nel caricamento delle categorie:", error);
    }
}

window.publishPost = function() {
    // 1. Recupero dati utente tramite utility centralizzata
    const currentUid = window.Spottio.getCurrentUid(); 
    const currentUsername = localStorage.getItem('currentUser'); 
    
    // 2. Recupero elementi DOM
    const textInput = document.getElementById('post-text');
    const fileInput = document.getElementById('file-upload');
    const statusMsg = document.getElementById('status-message');
    const submitBtn = document.getElementById('submit-btn');
    const fileNameSpan = document.getElementById('file-name');
    const categorySelect = document.getElementById('post-category');

    if (!textInput || !submitBtn) return; 

    // 3. Verifica Login
    if (!currentUid || currentUid === "null") {
        alert("Errore: Utente non identificato. Effettua nuovamente il login.");
        return;
    }

    const postText = textInput.value.trim();
    const file = fileInput && fileInput.files[0] ? fileInput.files[0] : null;
    const selectedCategory = categorySelect ? categorySelect.value : "Generale";

    if (!postText && !file) {
        alert("Inserisci un testo o allega un file!");
        return;
    }

    // 4. Feedback visivo
    submitBtn.disabled = true;
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="animate-pulse">Pubblicazione...</span>';
    
    if (statusMsg) {
        statusMsg.style.display = 'block';
        statusMsg.className = "mt-4 text-center text-sm font-medium text-blue-600";
        statusMsg.innerText = "Caricamento in corso...";
    }

    const saveToFirestore = (mediaUrl, isVideoFile) => {
        const newPost = {
            user: currentUid,            
            author: currentUsername,     
            text: postText,
            mediaUri: mediaUrl || null,
            video: isVideoFile,           
            timestamp: firebase.firestore.FieldValue.serverTimestamp(), 
            category: selectedCategory,
            likes: [],
            comments: []
        };

        window.db.collection("posts").add(newPost)
            .then(() => {
                if(statusMsg) {
                    statusMsg.className = "mt-4 text-center text-sm font-medium text-green-600";
                    statusMsg.innerText = "Post pubblicato con successo!";
                }
                textInput.value = '';
                if(fileInput) fileInput.value = '';
                if(fileNameSpan) fileNameSpan.textContent = '';
                if(categorySelect) categorySelect.value = 'Generale';

                setTimeout(() => {
                    if(statusMsg) statusMsg.style.display = 'none';
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }, 2000);
            })
            .catch((error) => {
                console.error("Errore salvataggio:", error);
                if(statusMsg) {
                    statusMsg.className = "mt-4 text-center text-sm font-medium text-red-600";
                    statusMsg.innerText = "Errore: " + error.message;
                }
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            });
    };

    if (file) {
        const isVideoFile = file.type.startsWith('video/');
        const storageRef = window.storage.ref();
        const fileRef = storageRef.child(`posts_media/${Date.now()}_${currentUid}_${file.name}`);

        fileRef.put(file).then((snapshot) => {
            return snapshot.ref.getDownloadURL();
        }).then((url) => {
            saveToFirestore(url, isVideoFile);
        }).catch((error) => {
            if(statusMsg) {
                statusMsg.className = "mt-4 text-center text-sm font-medium text-red-600";
                statusMsg.innerText = "Errore upload: " + error.message;
            }
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        });
    } else {
        saveToFirestore("", false);
    }
};

document.addEventListener('DOMContentLoaded', function() {
    const fileUpload = document.getElementById('file-upload');
    const fileNameSpan = document.getElementById('file-name');
    const postForm = document.getElementById('public-post-form');

    fetchCategories();

    if (fileUpload && fileNameSpan) {
        fileUpload.addEventListener('change', function(e) {
            const fileName = e.target.files[0] ? e.target.files[0].name : '';
            fileNameSpan.textContent = fileName ? 'File selezionato: ' + fileName : '';
        });
    }

    if (postForm) {
        postForm.addEventListener('submit', function(e) {
            e.preventDefault();
            window.publishPost();
        });
    }
});