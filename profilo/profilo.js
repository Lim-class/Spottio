document.addEventListener('DOMContentLoaded', () => {
    const db = window.db; 

    // Elementi UI - Profilo
    const displayUsername = document.getElementById('display-username');
    const displayBio = document.getElementById('display-bio');
    const followerCountEl = document.getElementById('follower-count');
    const followingCountEl = document.getElementById('following-count');
    const imageCaptionTextarea = document.getElementById('image-caption');
    const profileForm = document.getElementById('profile-form');
    const statusMessage = document.getElementById('status-message');
    const btnModificaBio = document.getElementById('edit-bio-btn'); // Corretto ID in base al tuo HTML
    const profileImageInput = document.getElementById('profile-image');
    const profileImgPreview = document.getElementById('profile-img-display'); // Corretto ID in base al tuo HTML

    // Elementi UI - Modale Follower/Seguiti
    const btnShowFollowers = document.getElementById('btn-show-followers');
    const btnShowFollowing = document.getElementById('btn-show-following');
    const usersModal = document.getElementById('users-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalUserList = document.getElementById('modal-user-list');
    const closeModalBtn = document.getElementById('close-modal-btn');

    const currentUser = localStorage.getItem('currentUser');
    let currentUserData = null; // Salviamo i dati dell'utente qui per usarli nella modale

    if (!currentUser || currentUser === "Guest") {
        window.location.href = "login.html";
        return;
    }

    // 1. Carica dati utente
    async function loadUserData() {
        try {
            const userDoc = await db.collection("users").doc(currentUser).get();
            if (userDoc.exists) {
                const data = userDoc.data();
                currentUserData = data; // <--- SALVIAMO I DATI

                displayUsername.textContent = `${data.username}`;
                followerCountEl.textContent = data.followers ? data.followers.length : 0;
                followingCountEl.textContent = data.following ? data.following.length : 0;
                
                // Imposta la bio testo e il valore della textarea
                const userBio = data.bio || "Nessuna bio impostata";
                displayBio.textContent = userBio;
                imageCaptionTextarea.value = data.bio || "";

                if (data.profileImage) {
                    profileImgPreview.src = data.profileImage;
                }
            }
        } catch (error) {
            console.error("Errore nel caricamento dati:", error);
        }
    }

    // 2. Mostra/Nascondi form modifica bio
    if (btnModificaBio) {
        btnModificaBio.addEventListener('click', () => {
            profileForm.classList.toggle('hidden');
        });
    }

    // 3. Salva la nuova Bio
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newBio = imageCaptionTextarea.value.trim();
            try {
                await db.collection("users").doc(currentUser).update({ bio: newBio });
                displayBio.textContent = newBio || "Nessuna bio impostata"; 
                profileForm.classList.add('hidden'); 
                mostraSuccesso('Bio aggiornata!');
            } catch (error) {
                console.error("Errore salvataggio:", error);
                alert("Errore durante il salvataggio.");
            }
        });
    }

    // 4. Cambia immagine profilo in tempo reale
    if (profileImageInput) {
        // Rendi l'immagine cliccabile per aprire il file picker
        profileImgPreview.addEventListener('click', () => profileImageInput.click());

        profileImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    const base64Image = event.target.result;
                    profileImgPreview.src = base64Image; // Anteprima immediata
                    
                    try {
                        await db.collection("users").doc(currentUser).update({ profileImage: base64Image });
                        mostraSuccesso('Immagine aggiornata!');
                    } catch (error) {
                        console.error("Errore aggiornamento immagine:", error);
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // 5. Gestione Modale Follower / Seguiti
    async function openUsersModal(type) {
        if (!currentUserData) return;

        // Resetta UI Modale
        modalUserList.innerHTML = '<div class="text-center text-[#6a5cb3] py-6 font-semibold animate-pulse">Caricamento...</div>';
        modalTitle.textContent = type === 'followers' ? 'I tuoi Follower' : 'Utenti Seguiti';
        usersModal.classList.remove('hidden');

        // Prendi l'array corretto (evita errori se non esiste ancora)
        const usersArray = type === 'followers' ? (currentUserData.followers || []) : (currentUserData.following || []);

        if (usersArray.length === 0) {
            modalUserList.innerHTML = `<div class="text-center text-gray-500 py-6">Nessun utente in questa lista.</div>`;
            return;
        }

        try {
            // Usa Promise.all per scaricare velocemente tutti i profili contemporaneamente
            const userPromises = usersArray.map(username => db.collection("users").doc(username).get());
            const userDocs = await Promise.all(userPromises);

            modalUserList.innerHTML = ''; // Svuota "Caricamento"

            userDocs.forEach(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    const username = userData.username;
                    const profileImg = userData.profileImage || "https://i.ibb.co/b5HgvzCB/Spottio-Logo-2.png"; // Immagine default

                    const userItem = document.createElement('div');
                    userItem.className = 'flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition cursor-pointer border border-transparent hover:border-gray-100';
                    
                    // Se vuoi rendere cliccabile l'utente per andare al suo profilo:
                    // userItem.onclick = () => window.location.href = `altro_profilo.html?user=${username}`;

                    userItem.innerHTML = `
                        <div class="flex items-center gap-3">
                            <img src="${profileImg}" class="w-12 h-12 rounded-full object-cover border border-gray-200 shadow-sm">
                            <div>
                                <p class="font-bold text-gray-800 text-sm">${username}</p>
                            </div>
                        </div>
                    `;
                    modalUserList.appendChild(userItem);
                }
            });

        } catch (error) {
            console.error("Errore nel caricamento lista utenti:", error);
            modalUserList.innerHTML = '<div class="text-center text-red-500 py-6">Errore nel caricamento.</div>';
        }
    }

    // Event Listener per Modale
    if (btnShowFollowers) btnShowFollowers.addEventListener('click', () => openUsersModal('followers'));
    if (btnShowFollowing) btnShowFollowing.addEventListener('click', () => openUsersModal('following'));
    
    // Chiusura Modale (tramite bottone o cliccando fuori)
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => usersModal.classList.add('hidden'));
    if (usersModal) {
        usersModal.addEventListener('click', (e) => {
            if (e.target === usersModal) usersModal.classList.add('hidden');
        });
    }

    // Funzione utility
    function mostraSuccesso(msg) {
        statusMessage.textContent = msg;
        statusMessage.className = 'mt-4 text-green-600 font-bold bg-green-50 p-2 rounded-lg';
        statusMessage.style.display = 'block';
        setTimeout(() => statusMessage.style.display = 'none', 3000);
    }

    loadUserData();
});