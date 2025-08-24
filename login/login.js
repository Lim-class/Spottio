// Questo file contiene la logica principale di login e registrazione.
// Si basa su funzioni e variabili definite in Lingue_login.js.

// Inizializza gli account nel localStorage
(function initializeUsers() {
    if (!localStorage.getItem('users')) {
        const initialUsers = [
            // L'utente 'admin' deve avere una proprietà `isAdmin` impostata su true
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
    setLanguage(savedLang);
};

// Logica per il pulsante "Accedi"
document.getElementById('loginForm').addEventListener('submit', function(event) {
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
document.getElementById('show-signup').addEventListener('click', function(event) {
    event.preventDefault();
    toggleForms(false);
});

// Logica per il pulsante "Accedi" (nel form di registrazione)
document.getElementById('show-login').addEventListener('click', function(event) {
    event.preventDefault();
    toggleForms(true);
});

// Logica per il pulsante "Registrati" (nel form di registrazione)
document.getElementById('signupForm').addEventListener('submit', function(event) {
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
    users.push({ username, password });
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

// Logica per mostrare/nascondere il menu a tendina delle lingue
document.getElementById('language-dropdown-button').addEventListener('click', () => {
    document.getElementById('language-dropdown-menu').classList.toggle('hidden');
});

// Logica per la selezione di una lingua dal menu a tendina
document.querySelectorAll('.lang-option').forEach(button => {
    button.addEventListener('click', (event) => {
        const selectedLang = event.currentTarget.dataset.lang;
        const selectedText = event.currentTarget.dataset.text;
        const selectedFlagSrc = event.currentTarget.querySelector('img').src;

        // Nasconde il menu a tendina
        document.getElementById('language-dropdown-menu').classList.add('hidden');
        
        // Aggiorna il testo e la bandiera del pulsante principale
        document.getElementById('selected-lang-text').textContent = selectedText;
        document.getElementById('selected-lang-flag').src = selectedFlagSrc;

        // Imposta la lingua
        setLanguage(selectedLang);
    });
});
