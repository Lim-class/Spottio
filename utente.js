// profilo-utente.js
document.addEventListener('DOMContentLoaded', () => {
    // --- TEMPORARY FIX: Questo simula un utente loggato per testare la funzionalità.
    // --- DEVE essere rimosso e sostituito con la logica di login reale che salva l'username.
    localStorage.setItem('currentUsername', 'utenteLoggato');
    // --- FINE FIX TEMPORANEO ---

    const username = localStorage.getItem('currentUserProfile');
    const profileName = document.getElementById('user-profile-name');
    const pageTitle = document.getElementById('user-profile-title');
    const profileImageContainer = document.getElementById('profile-image-container');
    const profileBio = document.getElementById('user-profile-bio');
    const userPostsContainer = document.getElementById('user-posts-container');
    const noPostsMessage = document.getElementById('no-posts-message');
    const followButton = document.getElementById('follow-button');
    const followersCount = document.getElementById('followers-count');
    const followingCount = document.getElementById('following-count');

    // Funzione per aggiornare il pulsante "Segui"
    function updateFollowButton(isFollowing) {
        if (isFollowing) {
            followButton.textContent = 'Seguito';
            followButton.classList.remove('bg-blue-500', 'hover:bg-blue-600');
            followButton.classList.add('bg-gray-400', 'hover:bg-gray-500');
        } else {
            followButton.textContent = 'Segui';
            followButton.classList.remove('bg-gray-400', 'hover:bg-gray-500');
            followButton.classList.add('bg-blue-500', 'hover:bg-blue-600');
        }
    }

    // Funzione per simulare la logica di follow/unfollow
    function toggleFollow() {
        const loggedInUser = localStorage.getItem('currentUsername');
        if (!loggedInUser) {
            console.error("Errore: Utente non loggato. Non è possibile seguire.");
            return;
        }

        // Recupera i dati di following e followers
        let followingData = JSON.parse(localStorage.getItem('following')) || {};
        let followersData = JSON.parse(localStorage.getItem('followers')) || {};

        // Controlla se l'utente sta già seguendo il profilo
        let isFollowing = followingData[loggedInUser] && followingData[loggedInUser].includes(username);
        
        if (isFollowing) {
            // Rimuovi l'utente seguito
            followingData[loggedInUser] = followingData[loggedInUser].filter(user => user !== username);
            // Rimuovi il follower
            if (followersData[username]) {
                followersData[username] = followersData[username].filter(user => user !== loggedInUser);
            }
            console.log(`Hai smesso di seguire ${username}.`);
        } else {
            // Aggiungi l'utente seguito
            if (!followingData[loggedInUser]) {
                followingData[loggedInUser] = [];
            }
            followingData[loggedInUser].push(username);
            // Aggiungi il follower
            if (!followersData[username]) {
                followersData[username] = [];
            }
            followersData[username].push(loggedInUser);
            console.log(`Ora segui ${username}.`);
        }
        
        // Salva i dati aggiornati nel localStorage
        localStorage.setItem('following', JSON.stringify(followingData));
        localStorage.setItem('followers', JSON.stringify(followersData));
        
        updateFollowCounts();
    }

    // Funzione per aggiornare i conteggi dei follower e seguiti
    function updateFollowCounts() {
        const loggedInUser = localStorage.getItem('currentUsername');
        let followersData = JSON.parse(localStorage.getItem('followers')) || {};
        let followingData = JSON.parse(localStorage.getItem('following')) || {};
        
        // Conteggio dei follower del profilo visualizzato
        let currentProfileFollowers = followersData[username] ? followersData[username].length : 0;
        followersCount.textContent = currentProfileFollowers;

        // Il conteggio dei seguiti deve essere quello dell'utente loggato, non del profilo visualizzato
        let loggedInUserFollowing = followingData[loggedInUser] ? followingData[loggedInUser].length : 0;
        
        // Se il profilo visualizzato è l'utente loggato, aggiorna anche il conteggio dei seguiti
        // del profilo visualizzato.
        if (username === loggedInUser) {
            followingCount.textContent = loggedInUserFollowing;
        } else {
            // Se non è il profilo loggato, il conteggio dei seguiti è un valore fittizio o basato su una logica diversa.
            // In questo caso, lo lasciamo a 0 o a un valore che non cambia.
            followingCount.textContent = 0; // Per coerenza
        }

        // Aggiorna il pulsante "Segui" basandosi sullo stato attuale
        let isFollowing = followingData[loggedInUser] && followingData[loggedInUser].includes(username);
        updateFollowButton(isFollowing);
    }
    
    if (username) {
        profileName.textContent = username;
        pageTitle.textContent = "Profilo di " + username;
        
        // Controlla se l'utente del profilo è l'utente corrente
        const loggedInUser = localStorage.getItem('currentUsername');
        if (username === loggedInUser) {
            followButton.style.display = 'none'; // Nascondi il pulsante "Segui" per il proprio profilo
        } else {
            followButton.style.display = 'block';
            followButton.addEventListener('click', toggleFollow);
        }

        // Carica i dati del profilo dalla cache locale
        const profile = JSON.parse(localStorage.getItem('userProfile'));

        if (profile && profile.image) {
            // Crea e aggiunge l'elemento img se l'immagine è disponibile
            const img = document.createElement('img');
            img.src = profile.image;
            img.alt = "Immagine del profilo";
            img.className = "w-full h-full object-cover rounded-full";
            profileImageContainer.appendChild(img);
        } else {
            // Mostra un'immagine segnaposto
            const placeholder = document.createElement('img');
            placeholder.src = "https://placehold.co/128x128/EBF8FF/4A90E2?text=P";
            placeholder.alt = "Placeholder per l'immagine del profilo";
            placeholder.className = "w-full h-full object-cover rounded-full";
            profileImageContainer.appendChild(placeholder);
        }

        if (profile && profile.caption) {
            profileBio.textContent = profile.caption;
        } else {
            profileBio.textContent = "Nessuna biografia disponibile.";
        }

        // Carica e filtra i post dell'utente
        const posts = JSON.parse(localStorage.getItem('publicPosts')) || [];
        const userPosts = posts.filter(post => post.username === username);

        if (userPosts.length > 0) {
            noPostsMessage.style.display = 'none'; // Nasconde il messaggio di "nessun post"
            userPostsContainer.innerHTML = ''; // Pulisce il contenitore prima di aggiungere i post

            userPosts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.className = 'bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200';

                let postContentHtml = `<div class="post-content mb-4 text-gray-700">`;
                if (post.text) {
                    postContentHtml += `<p class="mb-4">${post.text}</p>`;
                }

                if (post.image) {
                    postContentHtml += `
                        <img src="${post.image}" alt="Immagine post" class="mt-2 rounded-lg max-w-full h-auto">
                    `;
                } else if (post.file) {
                    postContentHtml += `
                        <div class="flex items-center p-3 mt-2 bg-gray-100 rounded-lg">
                            <svg class="w-6 h-6 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10l-2 2m0 0l-2-2m2 2v4m7-2A9 9 0 111 12a9 9 0 0118 0z"></path></svg>
                            <a href="${post.file}" download="${post.fileName}" class="text-blue-500 hover:underline">${post.fileName}</a>
                        </div>
                    `;
                }

                postContentHtml += `</div>`;
                postElement.innerHTML = postContentHtml;
                userPostsContainer.appendChild(postElement);
            });
        } else {
            noPostsMessage.style.display = 'block'; // Mostra il messaggio se non ci sono post
        }

        updateFollowCounts();

    } else {
        profileName.textContent = "Utente non trovato";
        profileBio.textContent = "";
        noPostsMessage.textContent = "Nessun utente selezionato.";
        noPostsMessage.style.display = 'block';
    }
});