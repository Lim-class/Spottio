// utente.js - Versione ottimizzata per Firebase Firestore (con supporto Privacy)
document.addEventListener('DOMContentLoaded', () => {
    const db = window.db; 

    const profileUsername = localStorage.getItem('currentUserProfile');
    const loggedInUser = localStorage.getItem('currentUser') || 'Guest';

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

    // --- 1. CARICAMENTO DATI PROFILO E STATISTICHE ---
    db.collection('users').doc(profileUsername).onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            
            UI.name.textContent = profileUsername;
            UI.bio.textContent = data.bio || "Nessuna biografia disponibile.";

            UI.imgContainer.innerHTML = '';
            const img = document.createElement('img');
            img.src = data.profileImage || "https://placehold.co/128x128/EBF8FF/4A90E2?text=" + profileUsername[0];
            img.className = "w-full h-full object-cover rounded-full shadow-lg";
            UI.imgContainer.appendChild(img);

            const followersList = data.followers || [];
            const followingList = data.following || [];
            const pendingList = data.pending_follows || [];

            UI.followers.textContent = followersList.length;
            UI.following.textContent = followingList.length;

            if (loggedInUser === profileUsername || loggedInUser === 'Guest') {
                UI.followBtn.style.display = 'none'; 
            } else {
                UI.followBtn.style.display = 'block';
                const isFollowing = followersList.includes(loggedInUser);
                const isPending = pendingList.includes(loggedInUser);
                updateFollowButtonUI(isFollowing, isPending);
            }
        }
    });

    // --- 2. CARICAMENTO POST (Con controllo Privacy Base lato UI) ---
    db.collection('users').doc(profileUsername).get().then(userDoc => {
        if (!userDoc.exists) return;
        const isPrivate = userDoc.data().isPrivate || false;
        const followers = userDoc.data().followers || [];

        // Se è privato e NON sei un follower (e non sei tu stesso), nascondi i post
        if (isPrivate && !followers.includes(loggedInUser) && loggedInUser !== profileUsername) {
            UI.posts.innerHTML = '';
            UI.noPosts.innerHTML = `
                <div class="text-center p-8 bg-gray-50 rounded-xl border border-gray-200">
                    <svg class="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    <p class="text-gray-600 font-semibold">Questo account è privato</p>
                    <p class="text-sm text-gray-500 mt-1">Segui questo account per vedere le sue foto e i suoi video.</p>
                </div>
            `;
            UI.noPosts.style.display = 'block';
            return;
        }

        // Se pubblico o sei follower, carica i post
        db.collection('posts')
            .where('user', '==', profileUsername)
            .orderBy('timestamp', 'desc')
            .onSnapshot((snapshot) => {
                UI.posts.innerHTML = '';
                if (snapshot.empty) {
                    UI.noPosts.innerHTML = '<p class="text-center text-gray-500">Nessun post disponibile.</p>';
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
                    if (post.mediaUri) { // Aggiunto fallback per il tuo renderer
                        content += `<img src="${post.mediaUri}" class="mt-4 rounded-lg max-w-full h-auto shadow-sm">`;
                    }
                    
                    postElement.innerHTML = content;
                    UI.posts.appendChild(postElement);
                });
            }, (error) => console.error("Errore caricamento post:", error));
    });

    // --- 3. LOGICA SEGUI / SMETTI DI SEGUIRE (con Pending) ---
    UI.followBtn.onclick = async () => {
        const userRef = db.collection('users').doc(profileUsername); 
        const loggedRef = db.collection('users').doc(loggedInUser);  

        const docSnap = await userRef.get();
        if (!docSnap.exists) return; 

        const userData = docSnap.data();
        const followers = userData.followers || [];
        const pendingFollows = userData.pending_follows || []; 
        const isPrivate = userData.isPrivate || false;         

        // Evita click multipli rapidi
        UI.followBtn.disabled = true;

        try {
            if (followers.includes(loggedInUser)) {
                // UNFOLLOW
                await userRef.update({
                    followers: firebase.firestore.FieldValue.arrayRemove(loggedInUser)
                });
                await loggedRef.set({
                    following: firebase.firestore.FieldValue.arrayRemove(profileUsername)
                }, { merge: true });
                updateFollowButtonUI(false, false);
            } 
            else if (pendingFollows.includes(loggedInUser)) {
                // ANNULLA RICHIESTA
                await userRef.update({
                    pending_follows: firebase.firestore.FieldValue.arrayRemove(loggedInUser)
                });
                updateFollowButtonUI(false, false);
            } 
            else {
                // FOLLOW / INVIA RICHIESTA
                if (isPrivate) {
                    await userRef.update({
                        pending_follows: firebase.firestore.FieldValue.arrayUnion(loggedInUser)
                    });
                    updateFollowButtonUI(false, true); 
                } else {
                    await userRef.update({
                        followers: firebase.firestore.FieldValue.arrayUnion(loggedInUser)
                    });
                    await loggedRef.set({
                        following: firebase.firestore.FieldValue.arrayUnion(profileUsername)
                    }, { merge: true });
                    updateFollowButtonUI(true, false);
                }
            }
        } catch (error) {
            console.error("Errore operazione follow:", error);
        } finally {
            UI.followBtn.disabled = false;
        }
    };

    function updateFollowButtonUI(isFollowing, isPending = false) {
        if (isFollowing) {
            UI.followBtn.textContent = 'Seguito';
            UI.followBtn.className = "mt-4 w-full sm:w-auto px-6 py-2 rounded-full font-bold text-white bg-gray-400 hover:bg-gray-500 transition-all cursor-pointer";
        } else if (isPending) {
            UI.followBtn.textContent = 'In attesa...';
            UI.followBtn.className = "mt-4 w-full sm:w-auto px-6 py-2 rounded-full font-bold text-gray-700 bg-yellow-300 hover:bg-yellow-400 transition-all cursor-pointer";
        } else {
            UI.followBtn.textContent = 'Segui';
            UI.followBtn.className = "mt-4 w-full sm:w-auto px-6 py-2 rounded-full font-bold text-white bg-blue-500 hover:bg-blue-600 shadow-md transition-all cursor-pointer";
        }
    }
});