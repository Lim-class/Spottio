// ==========================================
// FILE: cerca-persone.js
// Ricerca Utenti con Ottimizzazione dei Costi (Minimo 4 caratteri + Debounce)
// Compatibile con le regole basate su UID
// ==========================================

const auth = firebase.auth();
const db = window.db || firebase.firestore(); 

localStorage.removeItem('users'); 

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const searchResultsContainer = document.getElementById('search-results-container');
    let currentUserIsAdmin = false; 

    if (searchResultsContainer) {
        searchResultsContainer.innerHTML = `<p class="text-gray-500 text-center py-6 italic">Digita almeno 4 caratteri per iniziare la ricerca...</p>`;
    }

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                const userDoc = await db.collection("users").doc(user.uid).get();
                if (userDoc.exists && userDoc.data().isAdmin === true) {
                    currentUserIsAdmin = true;
                }
            } catch (error) {
                console.error("Errore nel controllo permessi admin:", error);
            }
        }
    });

    let searchTimeout = null;

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.trim();
            clearTimeout(searchTimeout);

            if (searchTerm.length < 4) {
                searchResultsContainer.innerHTML = `<p class="text-gray-500 text-center py-6 italic">Digita almeno 4 caratteri per iniziare la ricerca...</p>`;
                return;
            }

            searchTimeout = setTimeout(() => {
                performFirestoreSearch(searchTerm);
            }, 400);
        });
    }

    async function performFirestoreSearch(term) {
        searchResultsContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                <p class="text-gray-500 text-sm animate-pulse">Ricerca nel database...</p>
            </div>
        `;

        try {
            const searchTermLower = term.toLowerCase();
            const querySnapshot = await db.collection("users").get();
            const filteredUsers = [];

            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                const username = userData.username || "";
                
                if (username.toLowerCase().includes(searchTermLower)) {
                    filteredUsers.push({ id: doc.id, ...userData });
                }
            });
            
            await displayResults(filteredUsers);

        } catch (error) {
            console.error("Errore durante la ricerca su Firestore:", error);
            searchResultsContainer.innerHTML = `<p class="text-red-500 text-center py-4">Errore nel caricamento degli utenti.</p>`;
        }
    }

    async function displayResults(users) {
        searchResultsContainer.innerHTML = ''; 

        if (users.length === 0) {
            searchResultsContainer.innerHTML = `<p class="text-gray-500 text-center py-4">Nessun utente trovato corrispondente alla ricerca.</p>`;
            return;
        }

        const currentViewerUid = window.Spottio?.getCurrentUid ? window.Spottio.getCurrentUid() : localStorage.getItem('currentUid');

        for (const user of users) {
            const nameToDisplay = user.username || "Utente senza nome";
            const isVerified = user.isVerified === true;
            const avatarUrl = user.userPfUri || user.profileImage || ""; 

            // Controllo presenza storie con rispetto della privacy (se privato e non seguito, restituisce false)
            const hasStories = window.Spottio?.hasActiveFlashspot 
                ? await window.Spottio.hasActiveFlashspot(user.id, currentViewerUid) 
                : false;

            const userCard = document.createElement('div');
            userCard.className = 'flex items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition duration-200 border border-gray-100 mb-3';
            
            const verifiedBadge = window.Spottio?.getVerifiedBadge 
                ? window.Spottio.getVerifiedBadge(isVerified, "w-5 h-5 text-blue-500 shrink-0")
                : (isVerified ? `<span class="text-blue-500 font-bold ml-1">✓</span>` : '');
            
            const avatarHtml = window.Spottio?.getAvatarHtml
                ? window.Spottio.getAvatarHtml(avatarUrl, nameToDisplay, "w-12 h-12 text-xl", false, hasStories)
                : `<div class="w-12 h-12 mr-4 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg">${nameToDisplay.charAt(0).toUpperCase()}</div>`;

            let actionButtonHtml = '';
            if (currentUserIsAdmin) {
                actionButtonHtml = `
                    <button class="admin-verify-btn ml-2 p-2 bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600 rounded-lg transition-colors text-xs font-bold uppercase shrink-0">
                        ${isVerified ? 'Togli Verifica' : 'Verifica'}
                    </button>
                `;
            } else {
                actionButtonHtml = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>`;
            }
            
            userCard.innerHTML = `
                <div class="mr-4 shrink-0 flex items-center justify-center">
                    ${avatarHtml}
                </div>
                <div class="flex-grow cursor-pointer flex items-center gap-2 min-w-0">
                    <h3 class="font-semibold text-gray-900 text-lg truncate">${nameToDisplay}</h3>
                    ${verifiedBadge}
                </div>
                ${actionButtonHtml}
            `;

            userCard.addEventListener('click', (e) => {
                if (!e.target.closest('.admin-verify-btn')) {
                    localStorage.setItem('currentUserProfile', nameToDisplay);
                    if (window.Spottio?.navigateToUserProfile) {
                        window.Spottio.navigateToUserProfile(user.id);
                    } else {
                        localStorage.setItem('currentUserProfileId', user.id);
                        window.location.href = '../utente/utente.html';
                    }
                }
            });

            if (currentUserIsAdmin) {
                const verifyBtn = userCard.querySelector('.admin-verify-btn');
                verifyBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    try {
                        await db.collection("users").doc(user.id).update({ isVerified: !isVerified });
                        performFirestoreSearch(searchInput.value);
                    } catch (error) {
                        console.error("Errore aggiornamento isVerified:", error);
                    }
                });
            }
            
            searchResultsContainer.appendChild(userCard);
        }
    }
});