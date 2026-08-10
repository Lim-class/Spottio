// profilo-core.js
window.AppProfilo = {
    elementi: {},
    stato: {
        currentUid: localStorage.getItem('currentUid'),
        currentUser: localStorage.getItem('currentUser'),
        currentUserData: null,
        modoModifica: ''
    },
    init: function() {
        this.db = window.db; 
        this.auth = window.auth; 
        this.caricaElementiBase();
        this.impostaAuth();
        
        // Inizializza i moduli separati
        if (this.initAzioni) this.initAzioni();
        if (this.initModali) this.initModali();
    },
    caricaElementiBase: function() {
        this.elementi = {
            displayUsername: document.getElementById('display-username'),
            displayBio: document.getElementById('display-bio'),
            followerCountEl: document.getElementById('follower-count'),
            followingCountEl: document.getElementById('following-count'),
            profileForm: document.getElementById('profile-form'),
            usernameInputContainer: document.getElementById('username-input-container'),
            bioInputContainer: document.getElementById('bio-input-container'),
            imageUsernameInput: document.getElementById('image-username'),
            imageCaptionTextarea: document.getElementById('image-caption'),
            statusMessage: document.getElementById('status-message'),
            btnModificaBio: document.getElementById('edit-bio-pencil'),
            btnModificaUsername: document.getElementById('edit-username-pencil'),
            profileImageInput: document.getElementById('profile-image'),
            profileImgPreview: document.getElementById('profile-img-display'),
            btnShowFollowers: document.getElementById('btn-show-followers'),
            btnShowFollowing: document.getElementById('btn-show-following'),
            usersModal: document.getElementById('users-modal'),
            modalTitle: document.getElementById('modal-title'),
            modalUserList: document.getElementById('modal-user-list'),
            closeModalBtn: document.getElementById('close-modal-btn')
        };

        const { btnModificaUsername, displayUsername } = this.elementi;
        if (btnModificaUsername && displayUsername) {
            displayUsername.parentNode.appendChild(btnModificaUsername);
        }
    },
    impostaAuth: function() {
        if (this.auth) {
            this.auth.onAuthStateChanged((user) => {
                if (user) {
                    this.stato.currentUid = user.uid;
                    localStorage.setItem('currentUid', user.uid);
                    this.loadUserData();
                } else {
                    window.location.href = "login.html";
                }
            });
        }
    },
    loadUserData: async function() {
        try {
            if (!this.stato.currentUid || !this.db) return;
            const userDoc = await this.db.collection("users").doc(this.stato.currentUid).get();
            
            if (userDoc.exists) {
                const data = userDoc.data();
                this.stato.currentUserData = data; 
                this.aggiornaUI(data);
            }
        } catch (error) {
            console.error("Errore nel caricamento dati:", error);
        }
    },
    
    // Funzione centralizzata per applicare la traduzione o il testo alla bio
    setBioUI: function(bioText) {
        if (!this.elementi.displayBio) return;
        if (bioText) {
            this.elementi.displayBio.removeAttribute('data-translate');
            this.elementi.displayBio.textContent = bioText;
        } else {
            this.elementi.displayBio.setAttribute('data-translate', 'noBio');
            this.elementi.displayBio.textContent = window.t ? window.t('noBio') : "Nessuna bio impostata";
        }
    },

    aggiornaUI: function(data) {
        const { elementi, stato } = this;
        
        // Semplificazione: diamo per scontato che spottio-utils.js sia caricato correttamente
        const verifiedBadge = window.Spottio.getVerifiedBadge(data.isVerified, "w-5 h-5 text-blue-500 ml-1 inline-block align-middle");
        
        if (elementi.displayUsername) {
            elementi.displayUsername.innerHTML = `${window.Spottio.escape(data.username || stato.currentUser)} ${verifiedBadge}`;
        }
        if (elementi.imageUsernameInput) {
            elementi.imageUsernameInput.value = data.username || stato.currentUser;
        }
        if (elementi.followerCountEl) {
            elementi.followerCountEl.textContent = data.followers ? data.followers.length : 0;
        }
        if (elementi.followingCountEl) {
            elementi.followingCountEl.textContent = data.following ? data.following.length : 0;
        }

        const userBio = data.bio || null;
        
        // Uso helper per evitare duplicazioni
        this.setBioUI(userBio);

        if (elementi.imageCaptionTextarea) {
            elementi.imageCaptionTextarea.value = userBio || "";
        }

        const avatarUrl = data.userPfUri || data.profileImage;
        if (avatarUrl && elementi.profileImgPreview) {
            elementi.profileImgPreview.src = avatarUrl;
        }
    },
    mostraSuccesso: function(msg) {
        const { statusMessage } = this.elementi;
        if (!statusMessage) return;
        statusMessage.textContent = msg;
        statusMessage.className = 'mt-4 text-green-600 font-bold bg-green-50 p-2 rounded-lg';
        statusMessage.style.display = 'block';
        setTimeout(() => statusMessage.style.display = 'none', 3000);
    }
};

// Avvio principale
document.addEventListener('DOMContentLoaded', () => {
    window.AppProfilo.init();
});
