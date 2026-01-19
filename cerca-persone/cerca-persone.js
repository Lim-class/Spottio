// Configurazione Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAx_wHQ_K_B0lUSLUQLNupdX8krn0iiHtA",
    authDomain: "spottio-1419e.firebaseapp.com",
    projectId: "spottio-1419e",
    storageBucket: "spottio-1419e.firebasestorage.app"
};

// Inizializza Firebase se non già inizializzato
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// PULIZIA: Rimuove i vecchi dati locali che creano confusione
localStorage.removeItem('users'); 

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const searchResultsContainer = document.getElementById('search-results-container');
    let allUsers = []; // Variabile per memorizzare tutti gli utenti scaricati

    /**
     * 1. Ascolta gli utenti dalla collezione "users" in TEMPO REALE.
     * Usiamo onSnapshot invece di get() per vedere i cambiamenti immediati.
     */
    function listenToUsers() {
        // Mostra un messaggio di caricamento iniziale
        searchResultsContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                <p class="text-gray-500 text-lg">Sincronizzazione con il database...</p>
            </div>
        `;

        db.collection("users").onSnapshot((querySnapshot) => {
            allUsers = [];
            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                allUsers.push({ 
                    id: doc.id, 
                    username: userData.username || "", 
                    ...userData 
                });
            });
            
            console.log("Utenti trovati in Firebase:", allUsers.length);

            // Mostra SUBITO tutti gli utenti, senza aspettare la ricerca
            if (searchInput.value.trim() === '') {
                displayResults(allUsers);
            } else {
                performSearch(searchInput.value);
            }

        }, (error) => {
            console.error("Errore Firebase Firestore:", error);
            searchResultsContainer.innerHTML = `
                <div class="p-4 bg-red-100 text-red-700 rounded-lg text-center">
                    <p class="font-bold">Errore di connessione</p>
                    <p>Impossibile caricare gli utenti. Verifica la tua connessione o le regole di Firebase.</p>
                </div>
            `;
        });
    }

    /**
     * 2. Funzione per visualizzare i risultati
     */
    function displayResults(users) {
        searchResultsContainer.innerHTML = ''; 

        if (users.length === 0) {
            searchResultsContainer.innerHTML = `
                <p class="text-gray-500 text-center text-lg py-4">Nessun utente trovato nel database.</p>
            `;
            return;
        }

        // Creiamo la griglia/lista degli utenti
        users.forEach(user => {
            const nameToDisplay = user.username || "Utente senza nome";
            
            const userCard = document.createElement('div');
            userCard.className = 'flex items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition duration-200 cursor-pointer border border-gray-100 hover:border-blue-300 mb-3';
            userCard.innerHTML = `
                <div class="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4 shadow-sm shrink-0">
                    ${nameToDisplay.charAt(0).toUpperCase()}
                </div>
                <div class="flex-grow">
                    <h3 class="font-semibold text-gray-900 text-lg">${nameToDisplay}</h3>
                    <p class="text-xs text-gray-400">Utente verificato</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
            `;
            
            userCard.addEventListener('click', () => {
                // Salva dati per la pagina profilo
                localStorage.setItem('currentUserProfile', nameToDisplay);
                localStorage.setItem('currentUserProfileId', user.id); 
                window.location.href = 'utente.html';
            });
            
            searchResultsContainer.appendChild(userCard);
        });
    }

    /**
     * 3. Logica di filtraggio
     */
    function performSearch(term) {
        const searchTerm = term.toLowerCase().trim();
        
        if (searchTerm === '') {
            // Se cancelli la ricerca, rimostra tutti
            displayResults(allUsers);
            return;
        }

        const filteredUsers = allUsers.filter(user => {
            const username = (user.username || "").toLowerCase();
            return username.includes(searchTerm);
        });

        displayResults(filteredUsers);
    }

    // Listener per l'input di ricerca
    searchInput.addEventListener('input', (event) => {
        performSearch(event.target.value);
    });

    // Avvia l'ascolto in tempo reale
    listenToUsers();
});
