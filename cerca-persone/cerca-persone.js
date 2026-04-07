// Recupera le istanze già inizializzate da firebase-config.js
const auth = firebase.auth();
const db = window.db; 

// PULIZIA: Rimuove i vecchi dati locali
localStorage.removeItem('users'); 

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const searchResultsContainer = document.getElementById('search-results-container');
    let allUsers = []; 
    let currentUserIsAdmin = false; 

    /**
     * 1. CONTROLLO RUOLO ADMIN
     * Poiché i documenti in 'users' non usano l'UID come nome, 
     * cerchiamo il profilo tramite l'email dell'utente loggato.
     */
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                // Cerchiamo il documento nella collezione 'users' che ha l'email corrispondente
                const userQuery = await db.collection("users").where("email", "==", user.email).get();
                
                if (!userQuery.empty) {
                    const userData = userQuery.docs[0].data();
                    console.log("Dati utente loggato:", userData);
                    
                    // Verifica se il campo isAdmin è true nel database
                    if (userData.isAdmin === true) {
                        currentUserIsAdmin = true;
                        console.log("Accesso confermato come ADMIN");
                    } else {
                        console.log("Accesso come UTENTE STANDARD");
                    }
                } else {
                    console.warn("Nessun profilo trovato per l'email:", user.email);
                }
            } catch (error) {
                console.error("Errore nel controllo permessi:", error);
            }
        }
        // Avvia il caricamento della lista utenti
        listenToUsers();
    });

    /**
     * 2. ASCOLTO UTENTI IN TEMPO REALE
     */
    function listenToUsers() {
        searchResultsContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                <p class="text-gray-500 text-lg">Caricamento...</p>
            </div>
        `;

        db.collection("users").onSnapshot((querySnapshot) => {
            allUsers = [];
            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                allUsers.push({ 
                    id: doc.id, // L'ID del documento (es. "Christofer")
                    ...userData 
                });
            });
            
            // Aggiorna la vista
            if (searchInput.value.trim() === '') {
                displayResults(allUsers);
            } else {
                performSearch(searchInput.value);
            }
        }, (error) => {
            console.error("Errore Firestore:", error);
        });
    }

    /**
     * 3. VISUALIZZAZIONE RISULTATI
     */
    function displayResults(users) {
        searchResultsContainer.innerHTML = ''; 

        if (users.length === 0) {
            searchResultsContainer.innerHTML = `<p class="text-gray-500 text-center py-4">Nessun utente trovato.</p>`;
            return;
        }

        users.forEach(user => {
            const nameToDisplay = user.username || "Utente senza nome";
            const isVerified = user.isVerified === true;

            const userCard = document.createElement('div');
            userCard.className = 'flex items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition duration-200 border border-gray-100 mb-3';
            
            userCard.innerHTML = `
                <div class="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4 shrink-0 cursor-pointer">
                    ${nameToDisplay.charAt(0).toUpperCase()}
                </div>
                <div class="flex-grow cursor-pointer flex items-center gap-2">
                    <h3 class="font-semibold text-gray-900 text-lg">${nameToDisplay}</h3>
                    ${isVerified ? `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-blue-500">
                            <path fill-rule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307a4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397a4.491 4.491 0 01-1.307 3.497a4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549a4.49 4.49 0 01-3.498-1.306a4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497a4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
                        </svg>
                    ` : ''}
                </div>
                
                ${currentUserIsAdmin ? `
                    <button class="admin-verify-btn ml-2 p-2 bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600 rounded-lg transition-colors text-xs font-bold uppercase">
                        ${isVerified ? 'Togli Verifica' : 'Verifica'}
                    </button>
                ` : `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                `}
            `;

            // Click card -> Profilo
            userCard.addEventListener('click', (e) => {
                if (!e.target.closest('.admin-verify-btn')) {
                    localStorage.setItem('currentUserProfile', nameToDisplay);
                    localStorage.setItem('currentUserProfileId', user.id); 
                    window.location.href = 'utente.html';
                }
            });

            // Azione Admin
            if (currentUserIsAdmin) {
                const verifyBtn = userCard.querySelector('.admin-verify-btn');
                verifyBtn.addEventListener('click', async () => {
                    try {
                        await db.collection("users").doc(user.id).update({
                            isVerified: !isVerified
                        });
                    } catch (error) {
                        console.error("Errore aggiornamento:", error);
                    }
                });
            }
            
            searchResultsContainer.appendChild(userCard);
        });
    }

    /**
     * 4. RICERCA
     */
    function performSearch(term) {
        const searchTerm = term.toLowerCase().trim();
        if (searchTerm === '') {
            displayResults(allUsers);
            return;
        }
        const filtered = allUsers.filter(u => (u.username || "").toLowerCase().includes(searchTerm));
        displayResults(filtered);
    }

    searchInput.addEventListener('input', (e) => performSearch(e.target.value));
});