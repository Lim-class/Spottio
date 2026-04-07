// Oggetto per le traduzioni
// Oggetto principale che unisce tutte le traduzioni dai file esterni
const translations = {
    it: it_translations,
    en: en_translations,
    es: es_translations,
    fr: fr_translations,
    de: de_translations,
    ar: ar_translations,
    ru: ru_translations,
    ja: ja_translations,
    nl: nl_translations
};

// Funzione per mostrare un messaggio di stato
function showMessage(message, isError = false) {
    const messageElement = document.getElementById('message-container');
    messageElement.textContent = message;
    messageElement.className = `mt-4 text-center text-sm font-medium ${isError ? 'text-red-600' : 'text-green-600'}`;
}

// Funzione per mostrare un form e nascondere l'altro
function toggleForms(showLogin) {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    if (showLogin) {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
    } else {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
    }
    showMessage(''); 
}

// Funzione per impostare la lingua
function setLanguage(lang) {
    const currentLang = translations[lang];
    if (!currentLang) return;

    document.documentElement.lang = lang;

    document.getElementById('page-title').textContent = currentLang.pageTitle;
    document.getElementById('welcome-title').textContent = currentLang.welcomeTitle;
    document.getElementById('login-username').placeholder = currentLang.loginUsernamePlaceholder;
    document.getElementById('login-password').placeholder = currentLang.loginPasswordPlaceholder;
    document.getElementById('login-button').textContent = currentLang.loginButton;
    document.getElementById('show-signup').textContent = currentLang.showSignupButton;
    document.getElementById('signup-username').placeholder = currentLang.signupUsernamePlaceholder;
    document.getElementById('signup-password').placeholder = currentLang.signupPasswordPlaceholder;
    document.getElementById('show-login').textContent = currentLang.showLoginButton;
    document.getElementById('signup-button').textContent = currentLang.signupButton;
    
    // Testo privacy con link
    const privacyLabel = document.getElementById('label-privacy');
    if (privacyLabel && currentLang.labelPrivacy) {
        privacyLabel.innerHTML = currentLang.labelPrivacy;
    }

    localStorage.setItem('selectedLanguage', lang);
}