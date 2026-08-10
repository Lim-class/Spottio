// utente.js - Rifattorizzato per delegare il rendering a ui-renderer.js
document.addEventListener('DOMContentLoaded', () => {
    const db = window.db; 

    const profileUid = localStorage.getItem('currentUserProfileId');
    const currentUid = window.Spottio.getCurrentUid();
    const currentUser = localStorage.getItem('currentUser') || "Guest";
    const isAdmin = localStorage.getItem('isAdmin') === 'true';

    const UI = {
        name: document.getElementById('user-profile-name'),
        bio: document.getElementById('user-profile-bio'),
        imgContainer: document.getElementById('profile-image-container'),
        followBtn: document.getElementById('follow-button'),
        followers: document.getElementById('followers-count'),
        following: document.getElementById('following-count'),
        posts: document.getElementById('posts-container'), // ID aggiornato
        noPosts: document.getElementById('no-posts-message')
    };

    if (!profileUid) {
        UI.name.textContent = "Utente non trovato";
        UI.noPosts.textContent = "Nessun post da visualizzare.";
        return;
    }

    db.collection('users').doc(profileUid).onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            const displayUsername = data.username || "Utente Sconosciuto";
            const isVerified = data.isVerified === true;
            
            // Rimossi controlli superflui per Spottio (ora obbligatorio da DOM)
            const verifiedBadge = window.Spottio.getVerifiedBadge(isVerified, "w-8 h-8 text-blue-500 ml-2 inline-block align-middle");

            const safeUsername = window.Spottio.escape(displayUsername);
            UI.name.innerHTML = `${safeUsername}${verifiedBadge}`;
            
            UI.bio.textContent = data.bio || "Nessuna biografia disponibile.";

            UI.imgContainer.innerHTML = '';
            const imgUrl = data.userPfUri || data.profileImageUrl || data.profileImage || "";
            
            const avatarHtml = window.Spottio.getAvatarHtml(imgUrl, displayUsername, "w-full h-full object-cover rounded-full shadow-lg text-4xl");
            UI.imgContainer.innerHTML = avatarHtml;

            const followersList = data.followers || [];
            const followingList = data.following || [];
            const pendingList = data.pending_follows || [];

            UI.followers.textContent = followersList.length;
            UI.following.textContent = followingList.length;

            if (!currentUid || currentUid === profileUid || currentUid === "null") {
                UI.followBtn.style.display = 'none'; 
            } else {
                UI.followBtn.style.display = 'block';
                const isFollowing = followersList.includes(currentUid);
                const isPending = pendingList.includes(currentUid);
                updateFollowButtonUI(isFollowing, isPending);
            }
        }
    });

    db.collection('users').doc(profileUid).get().then(userDoc => {
        if (!userDoc.exists) return;
        const isPrivate = userDoc.data().isPrivate || false;
        const followers = userDoc.data().followers || [];

        if (isPrivate && !followers.includes(currentUid) && currentUid !== profileUid) {
            UI.posts.innerHTML = '';
            UI.noPosts.innerHTML = `
                <div class="text-center p-8 bg-gray-50 rounded-xl border border-gray-200 shadow-sm">
                    <svg class="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    <p class="text-gray-600 font-bold text-lg">Questo account è privato</p>
                    <p class="text-sm text-gray-500 mt-1">Segui questo account per vedere le sue foto e i suoi video.</p>
                </div>
            `;
            UI.noPosts.style.display = 'block';
            return;
        }

        db.collection('posts')
            .where('user', '==', profileUid)
            .orderBy('timestamp', 'desc')
            .onSnapshot((snapshot) => {
                UI.posts.innerHTML = '';
                if (snapshot.empty) {
                    UI.noPosts.innerHTML = '<p class="text-center text-gray-500 italic">Nessun post pubblicato.</p>';
                    UI.noPosts.style.display = 'block';
                    return;
                }

                UI.noPosts.style.display = 'none';
                snapshot.forEach(doc => {
                    const postData = doc.data();
                    const postId = doc.id;
                    
                    // Deleghiamo il rendering a ui-renderer.js (evita duplicazioni di codice)
                    if (typeof window.renderPost === 'function') {
                        window.renderPost(postId, postData, currentUser, isAdmin);
                    }
                });
            }, (error) => console.error("Errore caricamento post:", error));
    });

    UI.followBtn.onclick = async () => {
        if (!currentUid || currentUid === "null") {
            alert("Devi effettuare l'accesso per poter seguire gli utenti.");
            return;
        }

        const userRef = db.collection('users').doc(profileUid); 
        const loggedRef = db.collection('users').doc(currentUid);  

        UI.followBtn.disabled = true;

        try {
            const docSnap = await userRef.get();
            if (!docSnap.exists) return; 

            const userData = docSnap.data();
            const followers = userData.followers || [];
            const pendingFollows = userData.pending_follows || []; 
            const isPrivate = userData.isPrivate || false;         

            if (followers.includes(currentUid)) {
                await userRef.update({
                    followers: firebase.firestore.FieldValue.arrayRemove(currentUid)
                });
                await loggedRef.set({
                    following: firebase.firestore.FieldValue.arrayRemove(profileUid)
                }, { merge: true });
                updateFollowButtonUI(false, false);
            } 
            else if (pendingFollows.includes(currentUid)) {
                await userRef.update({
                    pending_follows: firebase.firestore.FieldValue.arrayRemove(currentUid)
                });
                updateFollowButtonUI(false, false);
            } 
            else {
                if (isPrivate) {
                    await userRef.update({
                        pending_follows: firebase.firestore.FieldValue.arrayUnion(currentUid)
                    });
                    updateFollowButtonUI(false, true); 
                } else {
                    await userRef.update({
                        followers: firebase.firestore.FieldValue.arrayUnion(currentUid)
                    });
                    await loggedRef.set({
                        following: firebase.firestore.FieldValue.arrayUnion(profileUid)
                    }, { merge: true });
                    updateFollowButtonUI(true, false);
                }
            }
        } catch (error) {
            console.error("Errore operazione follow:", error);
            alert("Impossibile aggiornare i follower. Controlla i permessi o la connessione.");
        } finally {
            UI.followBtn.disabled = false;
        }
    };

    function updateFollowButtonUI(isFollowing, isPending = false) {
        if (isFollowing) {
            UI.followBtn.textContent = 'Seguito';
            UI.followBtn.className = "mt-4 w-full sm:w-auto px-8 py-2.5 rounded-full font-bold text-gray-700 bg-gray-200 hover:bg-red-100 hover:text-red-600 transition-all cursor-pointer shadow-sm";
        } else if (isPending) {
            UI.followBtn.textContent = 'In attesa...';
            UI.followBtn.className = "mt-4 w-full sm:w-auto px-8 py-2.5 rounded-full font-bold text-gray-800 bg-yellow-300 hover:bg-yellow-400 transition-all cursor-pointer shadow-sm";
        } else {
            UI.followBtn.textContent = 'Segui';
            UI.followBtn.className = "mt-4 w-full sm:w-auto px-8 py-2.5 rounded-full font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all cursor-pointer";
        }
    }
});
