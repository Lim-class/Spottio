// posta.js - Gestione ESCLUSIVA per la creazione dei post (posta.html)

// Funzione per caricare dinamicamente le categorie da Firestore
async function fetchCategories() {
    const categorySelect = document.getElementById('post-category');
    if (!categorySelect) return;

    try {
        // Ripulisci le opzioni statiche mantenendo solo quella di default se necessario
        categorySelect.innerHTML = '<option value="Generale">Generale</option>';

        const snapshot = await window.db.collection('categories').get();
        snapshot.forEach(doc => {
            const data = doc.data();
            // Evita di duplicare "Generale" se è già presente nel database
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
    // 1. Recupero dati utente
    const currentUser = localStorage.getItem('currentUser');
    const userPfUri = localStorage.getItem('userPfUri'); // Recupero foto profilo
    
    // 2. Recupero elementi DOM
    const textInput = document.getElementById('post-text');
    const fileInput = document.getElementById('file-upload');
    const statusMsg = document.getElementById('status-message');
    const submitBtn = document.getElementById('submit-btn');
    const fileNameSpan = document.getElementById('file-name');
    const categorySelect = document.getElementById('post-category');

    // Se mancano elementi essenziali (es. siamo sulla pagina sbagliata), esci
    if (!textInput || !submitBtn) return; 

    // 3. Verifica Login
    if (!currentUser || currentUser === "null") {
        alert("Errore: Utente non identificato. Effettua il login.");
        return;
    }

    const postText = textInput.value.trim();
    const file = fileInput && fileInput.files[0] ? fileInput.files[0] : null;
    const selectedCategory = categorySelect ? categorySelect.value : "Generale";

    if (!postText && !file) {
        alert("Inserisci un testo o allega un file!");
        return;
    }

    // 4. Feedback visivo (Loading)
    submitBtn.disabled = true;
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="animate-pulse">Pubblicazione...</span>';
    
    if (statusMsg) {
        statusMsg.style.display = 'block';
        statusMsg.className = "mt-4 text-center text-sm font-medium text-blue-600";
        statusMsg.innerText = "Caricamento in corso...";
    }

    // Funzione interna per salvare su Firestore
    const saveToFirestore = (mediaUrl, isVideoFile) => {
        const newPost = {
            user: currentUser,            
            userPfUri: userPfUri || null, 
            text: postText,
            mediaUri: mediaUrl || null,
            video: isVideoFile,           
            timestamp: firebase.firestore.FieldValue.serverTimestamp(), // <-- NUOVO CODICE (Timestamp)
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
                // Reset Form
                textInput.value = '';
                if(fileInput) fileInput.value = '';
                if(fileNameSpan) fileNameSpan.textContent = '';
                if(categorySelect) categorySelect.value = 'Generale';

                // Ripristino bottone dopo breve attesa
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

    // 5. Gestione Upload File (se presente)
    if (file) {
        const isVideoFile = file.type.startsWith('video/');
        const storageRef = window.storage.ref();
        // Nome file unico con timestamp
        const fileRef = storageRef.child(`posts_media/${Date.now()}_${file.name}`);

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
        // Nessun file, salva solo testo
        saveToFirestore("", false);
    }
};

// Inizializzazione degli eventi al caricamento del DOM
document.addEventListener('DOMContentLoaded', function() {
    const fileUpload = document.getElementById('file-upload');
    const fileNameSpan = document.getElementById('file-name');
    const postForm = document.getElementById('public-post-form');

    // Carica le categorie da Firestore all'avvio della pagina
    fetchCategories();

    // 1. Gestione visualizzazione nome file selezionato
    if (fileUpload && fileNameSpan) {
        fileUpload.addEventListener('change', function(e) {
            const fileName = e.target.files[0] ? e.target.files[0].name : '';
            fileNameSpan.textContent = fileName ? 'File selezionato: ' + fileName : '';
        });
    }

    // 2. Gestione invio form
    if (postForm) {
        postForm.addEventListener('submit', function(e) {
            e.preventDefault();
            window.publishPost();
        });
    }
});