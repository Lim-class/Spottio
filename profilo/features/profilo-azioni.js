// profilo-azioni.js
window.AppProfilo = window.AppProfilo || {};

window.AppProfilo.initAzioni = function() {
    const p = window.AppProfilo;
    const { elementi, db, stato } = p;

    if (elementi.btnModificaBio) {
        elementi.btnModificaBio.addEventListener('click', () => {
            stato.modoModifica = 'bio';
            if (elementi.usernameInputContainer) elementi.usernameInputContainer.classList.add('hidden');
            if (elementi.bioInputContainer) elementi.bioInputContainer.classList.remove('hidden');
            if (elementi.profileForm) elementi.profileForm.classList.toggle('hidden');
        });
    }

    if (elementi.btnModificaUsername) {
        elementi.btnModificaUsername.addEventListener('click', () => {
            stato.modoModifica = 'username';
            if (elementi.bioInputContainer) elementi.bioInputContainer.classList.add('hidden');
            if (elementi.usernameInputContainer) elementi.usernameInputContainer.classList.remove('hidden');
            if (elementi.profileForm) elementi.profileForm.classList.toggle('hidden');
        });
    }

    if (elementi.profileForm) {
        elementi.profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                if (stato.modoModifica === 'bio') {
                    const newBio = elementi.imageCaptionTextarea ? elementi.imageCaptionTextarea.value.trim() : '';
                    await db.collection("users").doc(stato.currentUid).update({ bio: newBio });
                    
                    // Riutilizzo della funzione centralizzata
                    p.setBioUI(newBio);
                    
                    p.mostraSuccesso(window.t ? window.t('bioUpdated') : 'Bio aggiornata!');

                } else if (stato.modoModifica === 'username') {
                    const newUsername = elementi.imageUsernameInput ? elementi.imageUsernameInput.value.trim() : '';
                    if (!newUsername) return alert("L'username non può essere vuoto");

                    const checkUsername = await db.collection("users").where("username", "==", newUsername).get();
                    if (!checkUsername.empty && newUsername !== stato.currentUserData.username) {
                        alert("Questo username è già registrato da un altro utente.");
                        return;
                    }

                    await db.collection("users").doc(stato.currentUid).update({ username: newUsername });
                    
                    localStorage.setItem('currentUser', newUsername);
                    stato.currentUser = newUsername;
                    if (stato.currentUserData) stato.currentUserData.username = newUsername;

                    if (elementi.displayUsername) {
                        // Semplificato controllo Spottio
                        const verifiedBadge = window.Spottio.getVerifiedBadge(stato.currentUserData.isVerified, "w-5 h-5 text-blue-500 ml-1 inline-block align-middle");
                        elementi.displayUsername.innerHTML = `${window.Spottio.escape(newUsername)} ${verifiedBadge}`;
                    }
                    
                    p.mostraSuccesso('Username aggiornato!');
                    if (typeof loadUserPosts === 'function') loadUserPosts();
                }

                if (elementi.profileForm) elementi.profileForm.classList.add('hidden'); 
            } catch (error) {
                console.error("Errore salvataggio:", error);
                alert(window.t ? window.t('saveError') : "Errore durante il salvataggio.");
            }
        });
    }

    if (elementi.profileImageInput && elementi.profileImgPreview) {
        elementi.profileImgPreview.addEventListener('click', () => elementi.profileImageInput.click());

        elementi.profileImageInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                alert("Seleziona un file immagine valido.");
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert("L'immagine è troppo grande! Il limite è di 5 MB.");
                return;
            }

            const originalSrc = elementi.profileImgPreview.src;
            elementi.profileImgPreview.style.opacity = '0.5';
            p.mostraSuccesso('Caricamento immagine in corso...');

            try {
                const cloudName = "c32kn8tz";
                const uploadPreset = "spottio_preset";
                const formData = new FormData();
                formData.append("file", file);
                formData.append("upload_preset", uploadPreset);

                const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                    method: "POST",
                    body: formData
                });

                if (!response.ok) {
                    throw new Error("Impossibile caricare l'immagine su Cloudinary.");
                }

                const data = await response.json();
                const optimizedAvatarUrl = data.secure_url.replace('/upload/', '/upload/w_300,h_300,c_fill,f_auto,q_auto/');

                await db.collection("users").doc(stato.currentUid).update({ 
                    userPfUri: optimizedAvatarUrl 
                });

                elementi.profileImgPreview.src = optimizedAvatarUrl;
                elementi.profileImgPreview.style.opacity = '1';
                p.mostraSuccesso(window.t ? window.t('imgUpdated') : 'Immagine profilo aggiornata!');

            } catch (error) {
                console.error("Errore aggiornamento immagine profilo:", error);
                elementi.profileImgPreview.src = originalSrc;
                elementi.profileImgPreview.style.opacity = '1';
                alert("Errore durante il caricamento dell'immagine. Riprova.");
            }
        });
    }
};
