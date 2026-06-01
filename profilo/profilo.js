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
    const btnModificaBio = document.getElementById('edit-bio-btn'); 
    const profileImageInput = document.getElementById('profile-image');
    const profileImgPreview = document.getElementById('profile-img-display'); 

    // Elementi UI - Modale Follower/Seguiti
    const btnShowFollowers = document.getElementById('btn-show-followers');
    const btnShowFollowing = document.getElementById('btn-show-following');
    const usersModal = document.getElementById('users-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalUserList = document.getElementById('modal-user-list');
    const closeModalBtn = document.getElementById('close-modal-btn');

    const currentUser = localStorage.getItem('currentUser');
    let currentUserData = null; 

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
                currentUserData = data; 

                displayUsername.textContent = `${data.username}`;
                followerCountEl.textContent = data.followers ? data.followers.length : 0;
                followingCountEl.textContent = data.following ? data.following.length : 0;
                
                // Imposta la bio con traduzione dinamica
                const userBio = data.bio || null;
                if (userBio) {
                    displayBio.removeAttribute('data-translate');
                    displayBio.textContent = userBio;
                } else {
                    displayBio.setAttribute('data-translate', 'noBio');
                    displayBio.textContent = window.t ? window.t('noBio') : "Nessuna bio impostata";
                }
                
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
                if (newBio) {
                    displayBio.removeAttribute('data-translate');
                    displayBio.textContent = newBio;
                } else {
                    displayBio.setAttribute('data-translate', 'noBio');
                    displayBio.textContent = window.t ? window.t('noBio') : "Nessuna bio impostata";
                }
                profileForm.classList.add('hidden'); 
                mostraSuccesso(window.t ? window.t('bioUpdated') : 'Bio aggiornata!');
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
                        await db.collection("users").doc(currentUser).update({ profileImage: base64Image });
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
            const userPromises = usersArray.map(username => db.collection("users").doc(username).get());
            const userDocs = await Promise.all(userPromises);

            modalUserList.innerHTML = ''; 

            userDocs.forEach(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    const username = userData.username;
                    const profileImg = userData.profileImage || "https://i.ibb.co/b5HgvzCB/Spottio-Logo-2.png"; 

                    const userItem = document.createElement('div');
                    userItem.className = 'flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition cursor-pointer border border-transparent hover:border-gray-100';
                    
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

    loadUserData();
});