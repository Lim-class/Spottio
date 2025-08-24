// cerca-persone.js

document.addEventListener('DOMContentLoaded', () => {
    // Recupera la lista degli utenti registrati dal localStorage.
    const registeredUsers = JSON.parse(localStorage.getItem('users')) || [];

    const searchInput = document.getElementById('search-input');
    const searchResultsContainer = document.getElementById('search-results-container');

    // Funzione per visualizzare i risultati della ricerca
    function displayResults(users) {
        searchResultsContainer.innerHTML = ''; // Pulisce i risultati precedenti

        if (users.length === 0) {
            searchResultsContainer.innerHTML = `
                <p class="text-gray-500 text-center text-lg">Nessun utente trovato.</p>
            `;
            return;
        }

        users.forEach(user => {
            const userCard = document.createElement('div');
            userCard.className = 'flex items-center p-4 bg-gray-50 rounded-lg shadow-sm hover:bg-gray-100 transition duration-200 cursor-pointer';
            userCard.innerHTML = `
                <div class="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl mr-4">
                    ${user.username.charAt(0).toUpperCase()}
                </div>
                <h3 class="font-semibold text-gray-900 text-lg">${user.username}</h3>
            `;
            
            // Aggiungi un listener di evento click per ogni card utente
            userCard.addEventListener('click', () => {
                // Salva il nome utente nel localStorage
                localStorage.setItem('currentUserProfile', user.username);
                // Reindirizza alla pagina utente.html
                window.location.href = 'utente.html';
            });
            
            searchResultsContainer.appendChild(userCard);
        });
    }

    // Gestisce l'evento di input nel campo di ricerca
    searchInput.addEventListener('input', (event) => {
        const searchTerm = event.target.value.toLowerCase();
        
        // Se il campo di ricerca è vuoto, mostra un messaggio iniziale
        if (searchTerm.trim() === '') {
            searchResultsContainer.innerHTML = `
                <p class="text-gray-500 text-center text-lg">Inizia a digitare per cercare gli utenti.</p>
            `;
            return;
        }

        // Filtra gli utenti in base al termine di ricerca
        const filteredUsers = registeredUsers.filter(user => 
            user.username.toLowerCase().includes(searchTerm)
        );

        // Visualizza i risultati
        displayResults(filteredUsers);
    });

    // Messaggio iniziale quando la pagina viene caricata
    searchResultsContainer.innerHTML = `
        <p class="text-gray-500 text-center text-lg">Inizia a digitare per cercare gli utenti.</p>
    `;
});

