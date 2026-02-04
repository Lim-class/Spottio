// post.js - Gestione ESCLUSIVA per la creazione dei post (posta.html)

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

    // Se mancano elementi essenziali (es. siamo sulla pagina sbagliata), esci
    if (!textInput || !submitBtn) return; 

    // 3. Verifica Login
    if (!currentUser || currentUser === "null") {
        alert("Errore: Utente non identificato. Effettua il login.");
        return;
    }

    const postText = textInput.value.trim();
    const file = fileInput && fileInput.files[0] ? fileInput.files[0] : null;

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
            timestamp: Date.now(),
            category: "Generale",
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

                // Ripristino bottone dopo breve attesa
                setTimeout(() => {
                    if(statusMsg) statusMsg.style.display = 'none';
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                    // Opzionale: reindirizza alla bacheca
                    // window.location.href = 'pubblici.html';
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