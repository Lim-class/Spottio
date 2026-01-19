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
            <p class="text-gray-500 text-center text-lg">Caricamento database utenti...</p>
        `;

        db.collection("users").onSnapshot((querySnapshot) => {
            allUsers = [];
            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                // Assicuriamoci di catturare l'ID e i dati
                allUsers.push({ 
                    id: doc.id, 
                    username: userData.username || "", 
                    ...userData 
                });
            });
            
            console.log("Utenti totali caricati:", allUsers.length);

            // Se l'utente non sta scrivendo nulla, mostra il messaggio di invito alla ricerca
            if (searchInput.value.trim() === '') {
                searchResultsContainer.innerHTML = `
                    <p class="text-gray-500 text-center text-lg">Inizia a digitare per cercare tra i ${allUsers.length} utenti.</p>
                `;
            } else {
                // Se c'è già del testo (es. aggiornamento dati durante ricerca), rifiltra
                performSearch(searchInput.value);
            }
        }, (error) => {
            console.error("Errore Firebase Firestore:", error);
            searchResultsContainer.innerHTML = `
                <p class="text-red-500 text-center text-lg">Errore: assicurati che le regole di lettura su Firebase siano pubbliche.</p>
            `;
        });
    }

    /**
     * 2. Funzione per visualizzare i risultati della ricerca
     */
    function displayResults(users) {
        searchResultsContainer.innerHTML = ''; 

        if (users.length === 0) {
            searchResultsContainer.innerHTML = `
                <p class="text-gray-500 text-center text-lg">Nessun utente trovato con questo nome.</p>
            `;
            return;
        }

        users.forEach(user => {
            const nameToDisplay = user.username || "Utente senza nome";
            
            const userCard = document.createElement('div');
            userCard.className = 'flex items-center p-4 bg-gray-50 rounded-lg shadow-sm hover:bg-gray-100 transition duration-200 cursor-pointer border border-transparent hover:border-blue-300';
            userCard.innerHTML = `
                <div class="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4 shadow-sm">
                    ${nameToDisplay.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h3 class="font-semibold text-gray-900 text-lg">${nameToDisplay}</h3>
                    <p class="text-xs text-gray-400">ID: ${user.id.substring(0, 8)}...</p>
                </div>
            `;
            
            userCard.addEventListener('click', () => {
                // Salva lo username e l'ID profilo nel localStorage per la pagina utente.html
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
            searchResultsContainer.innerHTML = `
                <p class="text-gray-500 text-center text-lg">Inizia a digitare per cercare tra i ${allUsers.length} utenti.</p>
            `;
            return;
        }

        // Filtra la lista locale
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
