// utente.js - Versione ottimizzata per Firebase Firestore
document.addEventListener('DOMContentLoaded', () => {
    const db = window.db; // Istanza inizializzata in firebase-config.js

    // 1. IDENTIFICAZIONE UTENTI
    // Il profilo che stiamo visualizzando (salvato quando clicchi su un utente nella ricerca/home)
    const profileUsername = localStorage.getItem('currentUserProfile');
    // L'utente che sta usando l'app (dovrebbe provenire dal tuo sistema di login)
    const loggedInUser = localStorage.getItem('currentUsername') || 'utente_anonimo';

    // Riferimenti agli elementi HTML
    const UI = {
        name: document.getElementById('user-profile-name'),
        bio: document.getElementById('user-profile-bio'),
        imgContainer: document.getElementById('profile-image-container'),
        followBtn: document.getElementById('follow-button'),
        followers: document.getElementById('followers-count'),
        following: document.getElementById('following-count'),
        posts: document.getElementById('user-posts-container'),
        noPosts: document.getElementById('no-posts-message')
    };

    if (!profileUsername) {
        UI.name.textContent = "Utente non trovato";
        return;
    }

    // --- 2. CARICAMENTO DATI PROFILO E STATISTICHE (FOLLOW) ---
    // Usiamo onSnapshot per aggiornare i numeri appena cambiano nel database
    db.collection('users').doc(profileUsername).onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            
            // Aggiorna Bio e Nome
            UI.name.textContent = profileUsername;
            UI.bio.textContent = data.bio || "Nessuna biografia disponibile.";

            // Aggiorna Immagine Profilo
            UI.imgContainer.innerHTML = '';
            const img = document.createElement('img');
            img.src = data.profileImage || "https://placehold.co/128x128/EBF8FF/4A90E2?text=" + profileUsername[0];
            img.className = "w-full h-full object-cover rounded-full shadow-lg";
            UI.imgContainer.appendChild(img);

            // GESTIONE FOLLOWERS / SEGUITI (basata sui tuoi array nel DB)
            const followersList = data.followers || [];
            const followingList = data.following || [];

            UI.followers.textContent = followersList.length;
            UI.following.textContent = followingList.length;

            // Logica del tasto Segui
            if (loggedInUser === profileUsername) {
                UI.followBtn.style.display = 'none'; // Non puoi seguirti da solo
            } else {
                UI.followBtn.style.display = 'block';
                const isFollowing = followersList.includes(loggedInUser);
                updateFollowButtonUI(isFollowing);
            }
        }
    });

    // --- 3. CARICAMENTO POST DALL'UTENTE ---
    db.collection('posts')
        .where('username', '==', profileUsername)
        .orderBy('timestamp', 'desc')
        .onSnapshot((snapshot) => {
            UI.posts.innerHTML = '';
            if (snapshot.empty) {
                UI.noPosts.style.display = 'block';
                return;
            }

            UI.noPosts.style.display = 'none';
            snapshot.forEach(doc => {
                const post = doc.data();
                const postElement = document.createElement('div');
                postElement.className = 'bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-4';
                
                let content = `<div class="text-gray-700">${post.text || ''}</div>`;
                if (post.image) {
                    content += `<img src="${post.image}" class="mt-4 rounded-lg max-w-full h-auto shadow-sm">`;
                }
                
                postElement.innerHTML = content;
                UI.posts.appendChild(postElement);
            });
        }, (error) => {
            console.error("Errore caricamento post:", error);
            // Se vedi questo errore, clicca il link nella console per creare l'indice!
        });

    // --- 4. FUNZIONE PER SEGUIRE / SMETTERE DI SEGUIRE (CORRETTA) ---
UI.followBtn.onclick = async () => {
    const userRef = db.collection('users').doc(profileUsername); // Profilo visitato
    const loggedRef = db.collection('users').doc(loggedInUser);    // Tuo profilo

    const docSnap = await userRef.get();
    if (!docSnap.exists) return; // Sicurezza: se il profilo visitato non esiste, non fare nulla

    const followers = docSnap.data().followers || [];

    if (followers.includes(loggedInUser)) {
        // UNFOLLOW
        await userRef.update({
            followers: firebase.firestore.FieldValue.arrayRemove(loggedInUser)
        });
        await loggedRef.set({
            following: firebase.firestore.FieldValue.arrayRemove(profileUsername)
        }, { merge: true }); // .set con merge non fallisce se il documento manca
    } else {
        // FOLLOW
        await userRef.update({
            followers: firebase.firestore.FieldValue.arrayUnion(loggedInUser)
        });
        await loggedRef.set({
            following: firebase.firestore.FieldValue.arrayUnion(profileUsername)
        }, { merge: true }); // Crea il documento se utenteLoggato non esiste
    }
};

    // Utility per l'estetica del pulsante
    function updateFollowButtonUI(isFollowing) {
        if (isFollowing) {
            UI.followBtn.textContent = 'Seguito';
            UI.followBtn.className = "mt-4 px-6 py-2 rounded-full font-bold text-white bg-gray-400 hover:bg-gray-500 transition-all";
        } else {
            UI.followBtn.textContent = 'Segui';
            UI.followBtn.className = "mt-4 px-6 py-2 rounded-full font-bold text-white bg-blue-500 hover:bg-blue-600 shadow-md transition-all";
        }
    }
});