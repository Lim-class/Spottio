document.addEventListener('DOMContentLoaded', () => {
    const db = window.db; 
    const auth = window.auth; 

    // Elementi UI - Profilo
    const displayUsername = document.getElementById('display-username');
    const displayBio = document.getElementById('display-bio');
    const followerCountEl = document.getElementById('follower-count');
    const followingCountEl = document.getElementById('following-count');
    
    // Elementi Form e Input Nuovi
    const profileForm = document.getElementById('profile-form');
    const usernameInputContainer = document.getElementById('username-input-container');
    const bioInputContainer = document.getElementById('bio-input-container');
    const imageUsernameInput = document.getElementById('image-username');
    const imageCaptionTextarea = document.getElementById('image-caption');
    
    const statusMessage = document.getElementById('status-message');
    const btnModificaBio = document.getElementById('edit-bio-pencil');
    const btnModificaUsername = document.getElementById('edit-username-pencil'); // Nuovo
    const profileImageInput = document.getElementById('profile-image');
    const profileImgPreview = document.getElementById('profile-img-display'); 
    const adminActionsContainer = document.getElementById('admin-actions-container'); 

    // Elementi UI - Modale Follower/Seguiti
    const btnShowFollowers = document.getElementById('btn-show-followers');
    const btnShowFollowing = document.getElementById('btn-show-following');
    const usersModal = document.getElementById('users-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalUserList = document.getElementById('modal-user-list');
    const closeModalBtn = document.getElementById('close-modal-btn');

    let currentUid = localStorage.getItem('currentUid');
    let currentUser = localStorage.getItem('currentUser'); 
    let currentUserData = null; 
    let modoModifica = ''; // Può essere 'username' o 'bio'

    // Assicurati che il pulsante sia prima della spunta blu
    if (btnModificaUsername && displayUsername) {
        displayUsername.parentNode.appendChild(btnModificaUsername);
    }

    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUid = user.uid;
            localStorage.setItem('currentUid', currentUid);
            loadUserData();
        } else {
            window.location.href = "login.html";
        }
    });

    // 1. Carica dati utente
    async function loadUserData() {
        try {
            const userDoc = await db.collection("users").doc(currentUid).get();
            if (userDoc.exists) {
                const data = userDoc.data();
                currentUserData = data; 

                // Aggiorna interfaccia Username e Spunta Blu
                const verifiedBadge = window.Spottio.getVerifiedBadge(data.isVerified, "w-5 h-5 text-blue-500 ml-1 inline-block align-middle");
                displayUsername.innerHTML = `${window.Spottio.escape(data.username || currentUser)} ${verifiedBadge}`;
                
                // Inserisci il valore corrente negli input del form
                imageUsernameInput.value = data.username || currentUser;

                followerCountEl.textContent = data.followers ? data.followers.length : 0;
                followingCountEl.textContent = data.following ? data.following.length : 0;
                
                if (data.isAdmin && adminActionsContainer) {
                    adminActionsContainer.classList.remove('hidden');
                }

                const userBio = data.bio || null;
                if (userBio) {
                    displayBio.removeAttribute('data-translate');
                    displayBio.textContent = userBio;
                } else {
                    displayBio.setAttribute('data-translate', 'noBio');
                    displayBio.textContent = window.t ? window.t('noBio') : "Nessuna bio impostata";
                }
                
                imageCaptionTextarea.value = userBio || "";

                const avatarUrl = data.userPfUri || data.profileImage;
                if (avatarUrl) {
                    profileImgPreview.src = avatarUrl;
                }
            }
        } catch (error) {
            console.error("Errore nel caricamento dati:", error);
        }
    }

    // 2. Mostra/Nascondi form modifica BIO
    if (btnModificaBio) {
        btnModificaBio.addEventListener('click', () => {
            modoModifica = 'bio';
            usernameInputContainer.classList.add('hidden');
            bioInputContainer.classList.remove('hidden');
            profileForm.classList.toggle('hidden');
        });
    }

    // 2b. Mostra/Nascondi form modifica USERNAME (Nuovo)
    if (btnModificaUsername) {
        btnModificaUsername.addEventListener('click', () => {
            modoModifica = 'username';
            bioInputContainer.classList.add('hidden');
            usernameInputContainer.classList.remove('hidden');
            profileForm.classList.toggle('hidden');
        });
    }

    // 3. Salvataggio Form (Bio o Username)
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                if (modoModifica === 'bio') {
                    const newBio = imageCaptionTextarea.value.trim();
                    await db.collection("users").doc(currentUid).update({ bio: newBio });
                    
                    if (newBio) {
                        displayBio.removeAttribute('data-translate');
                        displayBio.textContent = newBio;
                    } else {
                        displayBio.setAttribute('data-translate', 'noBio');
                        displayBio.textContent = window.t ? window.t('noBio') : "Nessuna bio impostata";
                    }
                    mostraSuccesso(window.t ? window.t('bioUpdated') : 'Bio aggiornata!');

                } else if (modoModifica === 'username') {
                    const newUsername = imageUsernameInput.value.trim();
                    if (!newUsername) return alert("L'username non può essere vuoto");

                    // Opzionale: Controllo se l'username è già preso
                    const checkUsername = await db.collection("users").where("username", "==", newUsername).get();
                    if (!checkUsername.empty && newUsername !== currentUserData.username) {
                        alert("Questo username è già registrato da un altro utente.");
                        return;
                    }

                    await db.collection("users").doc(currentUid).update({ username: newUsername });
                    
                    // Aggiorna local storage e variabili locali
                    localStorage.setItem('currentUser', newUsername);
                    currentUser = newUsername;
                    if (currentUserData) currentUserData.username = newUsername;

                    // Renderizza di nuovo il nome con il badge
                    const verifiedBadge = window.Spottio.getVerifiedBadge(currentUserData.isVerified, "w-5 h-5 text-blue-500 ml-1 inline-block align-middle");
                    displayUsername.innerHTML = `${window.Spottio.escape(newUsername)} ${verifiedBadge}`;
                    
                    mostraSuccesso('Username aggiornato!');
                    
                    // Ricarica i post del profilo per mostrare il nuovo username nel messaggio "Nessun post trovato"
                    if (typeof loadUserPosts === 'function') loadUserPosts();
                }

                profileForm.classList.add('hidden'); 
            } catch (error) {
                console.error("Errore salvataggio:", error);
                alert(window.t ? window.t('saveError') : "Errore durante il salvataggio.");
            }
        });
    }

    // 4. Cambia immagine profilo
    if (profileImageInput) {
        profileImgPreview.addEventListener('click', () => profileImageInput.click());

        profileImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    const base64Image = event.target.result;
                    profileImgPreview.src = base64Image; 
                    
                    try {
                        await db.collection("users").doc(currentUid).update({ userPfUri: base64Image });
                        mostraSuccesso(window.t ? window.t('imgUpdated') : 'Immagine aggiornata!');
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

        const loadingText = window.t ? window.t('loading') : 'Caricamento...';
        modalUserList.innerHTML = `<div class="text-center text-[#6a5cb3] py-6 font-semibold animate-pulse">${loadingText}</div>`;
        
        modalTitle.textContent = type === 'followers' 
            ? (window.t ? window.t('yourFollowers') : 'I tuoi Follower') 
            : (window.t ? window.t('followedUsers') : 'Utenti Seguiti');
        
        usersModal.classList.remove('hidden');

        const usersArray = type === 'followers' ? (currentUserData.followers || []) : (currentUserData.following || []);

        if (usersArray.length === 0) {
            const emptyText = window.t ? window.t('noUsers') : 'Nessun utente in questa lista.';
            modalUserList.innerHTML = `<div class="text-center text-gray-500 py-6">${emptyText}</div>`;
            return;
        }

        try {
            const userPromises = usersArray.map(username => 
                db.collection("users").where("username", "==", username).get()
            );
            const userSnapshots = await Promise.all(userPromises);

            modalUserList.innerHTML = ''; 

            userSnapshots.forEach(snap => {
                if (!snap.empty) {
                    const userData = snap.docs[0].data();
                    const username = userData.username;
                    const profileImg = userData.userPfUri || userData.profileImage || ""; 
                    const avatarHtml = window.Spottio.getAvatarHtml(profileImg, username, "w-12 h-12 text-lg");

                    const userItem = document.createElement('div');
                    userItem.className = 'flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition cursor-pointer border border-transparent hover:border-gray-100';
                    
                    userItem.innerHTML = `
                        <div class="flex items-center gap-3">
                            ${avatarHtml}
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
            const errorText = window.t ? window.t('loadingError') : 'Errore nel caricamento.';
            modalUserList.innerHTML = `<div class="text-center text-red-500 py-6">${errorText}</div>`;
        }
    }

    if (btnShowFollowers) btnShowFollowers.addEventListener('click', () => openUsersModal('followers'));
    if (btnShowFollowing) btnShowFollowing.addEventListener('click', () => openUsersModal('following'));
    
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => usersModal.classList.add('hidden'));
    if (usersModal) {
        usersModal.addEventListener('click', (e) => {
            if (e.target === usersModal) usersModal.classList.add('hidden');
        });
    }

    function mostraSuccesso(msg) {
        statusMessage.textContent = msg;
        statusMessage.className = 'mt-4 text-green-600 font-bold bg-green-50 p-2 rounded-lg';
        statusMessage.style.display = 'block';
        setTimeout(() => statusMessage.style.display = 'none', 3000);
    }
});