// ==========================================
// FILE: cerca-persone.js
// Ricerca Utenti con Ottimizzazione dei Costi (Minimo 4 caratteri + Debounce)
// Compatibile con le regole basate su UID
// ==========================================

const auth = firebase.auth();
const db = window.db; 

// PULIZIA: Rimuove i vecchi dati locali inutilizzati
localStorage.removeItem('users'); 

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const searchResultsContainer = document.getElementById('search-results-container');
    let currentUserIsAdmin = false; 

    // Messaggio informativo iniziale all'avvio della pagina
    if (searchResultsContainer) {
        searchResultsContainer.innerHTML = `<p class="text-gray-500 text-center py-6 italic">Digita almeno 4 caratteri per iniziare la ricerca...</p>`;
    }

    /**
     * 1. CONTROLLO RUOLO ADMIN (Compatibile con la nuova struttura UID)
     */
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                // MODIFICA: Ora cerchiamo il documento utente usando direttamente il suo UID (ID del documento)
                const userDoc = await db.collection("users").doc(user.uid).get();
                
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    console.log("Dati utente loggato:", userData);
                    
                    if (userData.isAdmin === true) {
                        currentUserIsAdmin = true;
                        console.log("Accesso confermato come ADMIN");
                    }
                }
            } catch (error) {
                console.error("Errore nel controllo permessi admin:", error);
            }
        }
    });

    /**
     * 2. LOGICA DI ASCOLTO INPUT ED EVITAMENTO SPRECO LETTURE FIRESTORE
     */
    let searchTimeout = null;

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.trim();

        // Cancella il timer precedente ogni volta che l'utente preme un tasto
        clearTimeout(searchTimeout);

        // Se ha scritto meno di 4 lettere, svuota la UI e NON interroga il database
        if (searchTerm.length < 4) {
            searchResultsContainer.innerHTML = `<p class="text-gray-500 text-center py-6 italic">Digita almeno 4 caratteri per iniziare la ricerca...</p>`;
            return;
        }

        // DEBOUNCE: Aspetta 400 millisecondi di inattività prima di avviare la query a Firebase
        searchTimeout = setTimeout(() => {
            performFirestoreSearch(searchTerm);
        }, 400);
    });

    /**
     * 3. QUERY SU FIRESTORE ON-DEMAND (Niente onSnapshot continuo per risparmiare risorse)
     */
    async function performFirestoreSearch(term) {
        searchResultsContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                <p class="text-gray-500 text-sm animate-pulse">Ricerca nel database...</p>
            </div>
        `;

        try {
            const searchTermLower = term.toLowerCase();
            // Effettuiamo un singolo get() spot sulla collezione users
            const querySnapshot = await db.collection("users").get();
            const filteredUsers = [];

            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                const username = userData.username || "";
                
                // Filtriamo localmente i risultati in base all'username salvato nel documento
                if (username.toLowerCase().includes(searchTermLower)) {
                    filteredUsers.push({ 
                        id: doc.id, // Questo è l'UID dell'utente trovato
                        ...userData 
                    });
                }
            });
            
            // Renderizziamo i risultati filtrati
            displayResults(filteredUsers);

        } catch (error) {
            console.error("Errore durante la ricerca su Firestore:", error);
            searchResultsContainer.innerHTML = `<p class="text-red-500 text-center py-4">Errore nel caricamento degli utenti.</p>`;
        }
    }

    /**
     * 4. VISUALIZZAZIONE RISULTATI (Nome, Foto Profilo, Verificato e Gestione Admin)
     */
    function displayResults(users) {
        searchResultsContainer.innerHTML = ''; 

        if (users.length === 0) {
            searchResultsContainer.innerHTML = `<p class="text-gray-500 text-center py-4">Nessun utente trovato corrispondente alla ricerca.</p>`;
            return;
        }

        users.forEach(user => {
            const nameToDisplay = user.username || "Utente senza nome";
            const isVerified = user.isVerified === true;
            const avatarUrl = user.userPfUri || user.profileImage || ""; 

            const userCard = document.createElement('div');
            userCard.className = 'flex items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition duration-200 border border-gray-100 mb-3';
            
            // ✨ MAGIA CODICE PULITO
            const verifiedBadge = window.Spottio.getVerifiedBadge(isVerified, "w-5 h-5 text-blue-500 shrink-0");
            
            const avatarHtml = window.Spottio.getAvatarHtml(avatarUrl, nameToDisplay, "w-12 h-12 mr-4 text-xl");

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
                ${avatarHtml}
                <div class="flex-grow cursor-pointer flex items-center gap-2 min-w-0">
                    <h3 class="font-semibold text-gray-900 text-lg truncate">${nameToDisplay}</h3>
                    ${verifiedBadge}
                </div>
                ${actionButtonHtml}
            `;

            // Click sulla card -> Vai alla pagina del profilo selezionato
            userCard.addEventListener('click', (e) => {
                if (!e.target.closest('.admin-verify-btn')) {
                    localStorage.setItem('currentUserProfile', nameToDisplay);
                    localStorage.setItem('currentUserProfileId', user.id); // 'user.id' è l'UID corretto
                    window.location.href = '../utente/utente.html';
                }
            });

            // Azione Esclusiva per l'Admin: Cliccando sul pulsante cambia lo stato del verificato
            if (currentUserIsAdmin) {
                const verifyBtn = userCard.querySelector('.admin-verify-btn');
                verifyBtn.addEventListener('click', async (e) => {
                    e.stopPropagation(); // Impedisce il reindirizzamento alla pagina del profilo sul click del bottone
                    try {
                        // Aggiorna lo stato di verifica su Firestore puntando al documento con l'UID dell'utente (user.id)
                        await db.collection("users").doc(user.id).update({
                            isVerified: !isVerified
                        });
                        // riesegue immediatamente la ricerca corrente per aggiornare visivamente la spunta blu senza ricaricare la pagina
                        performFirestoreSearch(searchInput.value);
                    } catch (error) {
                        console.error("Errore durante l'aggiornamento del flag isVerified:", error);
                    }
                });
            }
            
            searchResultsContainer.appendChild(userCard);
        });
    }
});