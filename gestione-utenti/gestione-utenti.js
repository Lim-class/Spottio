// Questo file contiene la logica principale di login e registrazione,
// e ora anche la gestione degli utenti e la loro eliminazione.
// Si basa su funzioni e variabili definite in Lingue_login.js.

// Inizializza gli account nel localStorage
(function initializeUsers() {
    if (!localStorage.getItem('users')) {
        const initialUsers = [
            { username: 'admin', password: 'adminpass', isAdmin: true },
            { username: 'Utente1', password: 'Utente1' },
            { username: 'Utente2', password: 'Utente2'}
        ];
        localStorage.setItem('users', JSON.stringify(initialUsers));
    }
})();

// Inizializza la lingua all'avvio
window.onload = function() {
    const savedLang = localStorage.getItem('language') || 'it'; // Default italiano
    if (typeof setLanguage !== 'undefined') {
        setLanguage(savedLang);
    }
    // Popola la lista utenti se siamo sulla pagina di gestione utenti
    if (document.getElementById('users-list')) {
        renderUsers();
    }
};

// Funzione per mostrare un messaggio di stato
function showMessage(message, isError = false) {
    const messageContainer = document.getElementById('message-container');
    if (messageContainer) {
        messageContainer.innerHTML = `<p class="p-3 mb-4 rounded-lg font-medium text-sm ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}">${message}</p>`;
    }
}

// Logica per il pulsante "Accedi"
document.getElementById('loginForm')?.addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    // Legge gli utenti dal localStorage
    const users = JSON.parse(localStorage.getItem('users'));
    
    // Controlla se le credenziali corrispondono
    const userFound = users.find(user => user.username === username && user.password === password);
    const lang = localStorage.getItem('language') || 'it';

    if (userFound) {
        showMessage(translations[lang].loginSuccess);
        // Salva il nome utente nel localStorage
        localStorage.setItem('currentUser', username);
        // Reindirizza alla pagina di benvenuto
        window.location.href = 'pubblici.html';
    } else {
        showMessage(translations[lang].loginError, true);
    }
});

// Logica per il pulsante "Registrati" (nel form di login)
document.getElementById('show-signup')?.addEventListener('click', function(event) {
    event.preventDefault();
    toggleForms(false);
});

// Logica per il pulsante "Accedi" (nel form di registrazione)
document.getElementById('show-login')?.addEventListener('click', function(event) {
    event.preventDefault();
    toggleForms(true);
});

// Logica per il pulsante "Registrati" (nel form di registrazione)
document.getElementById('signupForm')?.addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;

    // Legge gli utenti dal localStorage
    const users = JSON.parse(localStorage.getItem('users'));

    // Controlla se l'username esiste già
    const userExists = users.some(user => user.username === username);
    const lang = localStorage.getItem('language') || 'it';
    
    if (userExists) {
        showMessage(translations[lang].signupUsernameExists, true);
        return;
    }

    // Aggiunge il nuovo utente
    users.push({ username, password, isAdmin: false }); // Aggiungi la proprietà isAdmin
    localStorage.setItem('users', JSON.stringify(users));
    
    showMessage(translations[lang].signupSuccess, false);
    
    // Dopo la registrazione, torna al modulo di login
    setTimeout(() => {
        toggleForms(true);
        document.getElementById('login-username').value = username;
        document.getElementById('signup-username').value = '';
        document.getElementById('signup-password').value = '';
    }, 1000);
});

// Funzione per il rendering della lista utenti
function renderUsers() {
    const usersList = document.getElementById('users-list');
    const users = JSON.parse(localStorage.getItem('users')) || [];
    usersList.innerHTML = ''; // Pulisce la lista

    // Trova l'indice dell'amministratore e filtra l'array per la visualizzazione
    const adminIndex = users.findIndex(user => user.username === 'admin');
    const filteredUsers = users.filter(user => user.username !== 'admin');

    filteredUsers.forEach((user) => {
        const userRow = document.createElement('div');
        userRow.className = 'user-row flex items-center justify-between p-4';
        
        // Cerca l'indice effettivo dell'utente nell'array originale
        const userIndex = users.findIndex(u => u.username === user.username);

        userRow.innerHTML = `
            <div class="text-gray-800">${user.username}</div>
            <button onclick="confirmDeleteUser('${user.username}', ${userIndex})" class="delete-user-btn bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600 transition duration-200">
                Elimina
            </button>
        `;
        usersList.appendChild(userRow);
    });
}

// Funzione per mostrare il modale di conferma eliminazione
window.confirmDeleteUser = function(username, index) {
    const modal = document.getElementById('confirmation-modal');
    const userToDeleteSpan = document.getElementById('user-to-delete');
    
    // Controlla se gli elementi esistono prima di modificarli
    if (userToDeleteSpan) {
        userToDeleteSpan.textContent = username;
    }
    if (modal) {
        modal.classList.remove('hidden');

        const confirmBtn = document.getElementById('confirm-delete');
        const cancelBtn = document.getElementById('cancel-delete');

        if (confirmBtn) {
            confirmBtn.onclick = () => {
                deleteUser(index);
                if (modal) {
                    modal.classList.add('hidden');
                }
            };
        }
        
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                if (modal) {
                    modal.classList.add('hidden');
                }
            };
        }
    }
};

// Funzione per eliminare l'utente
function deleteUser(index) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (index >= 0 && index < users.length) {
        users.splice(index, 1);
        localStorage.setItem('users', JSON.stringify(users));
        renderUsers(); // Ricarica la lista utenti
        showMessage(`Utente eliminato con successo.`, false);
    }
}

// Funzione per aggiungere un nuovo utente (gestione utenti)
document.getElementById('addUserForm')?.addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('new-username').value;
    const password = document.getElementById('new-password').value;

    const users = JSON.parse(localStorage.getItem('users'));
    const userExists = users.some(user => user.username === username);

    if (userExists) {
        showMessage(`L'utente ${username} esiste già.`, true);
        return;
    }

    users.push({ username, password, isAdmin: false });
    localStorage.setItem('users', JSON.stringify(users));
    renderUsers(); // Aggiorna la lista
    showMessage(`Utente ${username} aggiunto con successo!`, false);
    document.getElementById('addUserForm').reset();
});

// Aggiungo questa chiamata per assicurarmi che la lista venga renderizzata all'inizio
renderUsers();
