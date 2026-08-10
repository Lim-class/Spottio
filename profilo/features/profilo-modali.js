// profilo-modali.js
window.AppProfilo = window.AppProfilo || {};

window.AppProfilo.initModali = function() {
    const p = window.AppProfilo;
    const { elementi, db, stato } = p;

    async function openUsersModal(type) {
        if (!stato.currentUserData || !elementi.modalUserList) return;

        const loadingText = window.t ? window.t('loading') : 'Caricamento...';
        elementi.modalUserList.innerHTML = `<div class="text-center text-[#6a5cb3] py-6 font-semibold animate-pulse">${loadingText}</div>`;
        
        if (elementi.modalTitle) {
            elementi.modalTitle.textContent = type === 'followers' 
                ? (window.t ? window.t('yourFollowers') : 'I tuoi Follower') 
                : (window.t ? window.t('followedUsers') : 'Utenti Seguiti');
        }
        
        if (elementi.usersModal) elementi.usersModal.classList.remove('hidden');

        const usersArray = type === 'followers' ? (stato.currentUserData.followers || []) : (stato.currentUserData.following || []);

        if (usersArray.length === 0) {
            const emptyText = window.t ? window.t('noUsers') : 'Nessun utente in questa lista.';
            elementi.modalUserList.innerHTML = `<div class="text-center text-gray-500 py-6">${emptyText}</div>`;
            return;
        }

        try {
            const userPromises = usersArray.map(uid => db.collection("users").doc(uid).get());
            const userSnapshots = await Promise.all(userPromises);

            elementi.modalUserList.innerHTML = ''; 

            userSnapshots.forEach(docSnap => {
                if (docSnap.exists) {
                    const userData = docSnap.data();
                    const username = userData.username || "Utente";
                    const profileImg = userData.userPfUri || userData.profileImage || ""; 
                    const isVerified = userData.isVerified === true;

                    // Semplificati check Spottio globali
                    const avatarHtml = window.Spottio.getAvatarHtml(profileImg, username, "w-12 h-12 text-lg");
                    const verifiedBadge = window.Spottio.getVerifiedBadge(isVerified, "w-4 h-4 text-blue-500 ml-1 inline-block align-middle");

                    const userItem = document.createElement('div');
                    userItem.className = 'flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition cursor-pointer border border-transparent hover:border-gray-100';
                    
                    userItem.innerHTML = `
                        <div class="flex items-center gap-3">
                            ${avatarHtml}
                            <div>
                                <p class="font-bold text-gray-800 text-sm flex items-center">
                                    ${window.Spottio.escape(username)} ${verifiedBadge}
                                </p>
                            </div>
                        </div>
                    `;
                    elementi.modalUserList.appendChild(userItem);
                }
            });

        } catch (error) {
            console.error("Errore nel caricamento lista utenti:", error);
            const errorText = window.t ? window.t('loadingError') : 'Errore nel caricamento.';
            elementi.modalUserList.innerHTML = `<div class="text-center text-red-500 py-6">${errorText}</div>`;
        }
    }

    if (elementi.btnShowFollowers) elementi.btnShowFollowers.addEventListener('click', () => openUsersModal('followers'));
    if (elementi.btnShowFollowing) elementi.btnShowFollowing.addEventListener('click', () => openUsersModal('following'));
    
    if (elementi.closeModalBtn && elementi.usersModal) {
        elementi.closeModalBtn.addEventListener('click', () => elementi.usersModal.classList.add('hidden'));
    }
    
    if (elementi.usersModal) {
        elementi.usersModal.addEventListener('click', (e) => {
            if (e.target === elementi.usersModal) elementi.usersModal.classList.add('hidden');
        });
    }
};
