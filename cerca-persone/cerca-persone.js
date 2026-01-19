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

    // 1. Scarica gli utenti dalla collezione "users" di Firestore
    function fetchUsers() {
        db.collection("users").get().then((querySnapshot) => {
            allUsers = [];
            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                // Aggiungiamo l'ID del documento per riferimento
                allUsers.push({ id: doc.id, ...userData });
            });
            
            // Messaggio iniziale dopo il caricamento
            searchResultsContainer.innerHTML = `
                <p class="text-gray-500 text-center text-lg">Inizia a digitare per cercare gli utenti.</p>
            `;
        }).catch((error) => {
            console.error("Errore nel caricamento utenti:", error);
            searchResultsContainer.innerHTML = `
                <p class="text-red-500 text-center text-lg">Errore nel caricamento dei dati.</p>
            `;
        });
    }

    // 2. Funzione per visualizzare i risultati
    function displayResults(users) {
        searchResultsContainer.innerHTML = ''; 

        if (users.length === 0) {
            searchResultsContainer.innerHTML = `
                <p class="text-gray-500 text-center text-lg">Nessun utente trovato.</p>
            `;
            return;
        }

        users.forEach(user => {
            // Se lo username non esiste (magari l'utente ha solo email), usa un fallback
            const nameToDisplay = user.username || "Utente Anonimo";
            
            const userCard = document.createElement('div');
            userCard.className = 'flex items-center p-4 bg-gray-50 rounded-lg shadow-sm hover:bg-gray-100 transition duration-200 cursor-pointer';
            userCard.innerHTML = `
                <div class="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl mr-4">
                    ${nameToDisplay.charAt(0).toUpperCase()}
                </div>
                <h3 class="font-semibold text-gray-900 text-lg">${nameToDisplay}</h3>
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

    // 3. Gestione input di ricerca
    searchInput.addEventListener('input', (event) => {
        const searchTerm = event.target.value.toLowerCase().trim();
        
        if (searchTerm === '') {
            searchResultsContainer.innerHTML = `
                <p class="text-gray-500 text-center text-lg">Inizia a digitare per cercare gli utenti.</p>
            `;
            return;
        }

        // Filtra sulla lista locale scaricata da Firestore
        const filteredUsers = allUsers.filter(user => {
            const username = (user.username || "").toLowerCase();
            return username.includes(searchTerm);
        });

        displayResults(filteredUsers);
    });

    // Avvia il caricamento
    fetchUsers();
});
