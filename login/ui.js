// --- UTILITY GLOBALI ---
window.getCurrentLanguage = function() {
    return localStorage.getItem('selectedLanguage') || 'it';
};

window.checkFirebase = function() {
    if (!window.auth || !window.db) {
        console.error("Errore: Firebase non è stato inizializzato. Controlla l'ordine dei file in login.html");
        return false;
    }
    return true;
};

// --- GESTIONE UI E DOM ---

// Gestione scambio form Login/Registrazione
function toggleForms(showLogin) {
    if (showLogin) {
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('signup-form').classList.add('hidden');
    } else {
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('signup-form').classList.remove('hidden');
    }
}

document.getElementById('show-signup').addEventListener('click', (e) => {
    e.preventDefault();
    toggleForms(false);
});

document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    toggleForms(true);
});

// Genera e inietta il menu a tendina per il Login
const langContainer = document.getElementById('language-dropdown-container');
if(langContainer) {
    langContainer.innerHTML = getLanguageDropdownHTML();
}

// Gestione Lingua
document.getElementById('language-dropdown-button').addEventListener('click', () => {
    document.getElementById('language-dropdown-menu').classList.toggle('hidden');
})

document.querySelectorAll('.lang-option').forEach(button => {
    button.addEventListener('click', (event) => {
        const selectedLang = event.currentTarget.dataset.lang;
        const selectedText = event.currentTarget.dataset.text;
        const selectedFlagSrc = event.currentTarget.querySelector('img').src;

        document.getElementById('language-dropdown-menu').classList.add('hidden');
        document.getElementById('selected-lang-text').textContent = selectedText;
        document.getElementById('selected-lang-flag').src = selectedFlagSrc;

        localStorage.setItem('selectedLanguage', selectedLang);
        if (typeof setLanguage === 'function') {
            setLanguage(selectedLang);
        }
    });
});

window.onload = function() {
    const savedLang = window.getCurrentLanguage();
    
    if (typeof setLanguage === 'function') {
        setLanguage(savedLang);
    }

    const savedOption = document.querySelector(`.lang-option[data-lang="${savedLang}"]`);
    if (savedOption) {
        const selectedText = savedOption.dataset.text;
        const selectedFlagSrc = savedOption.querySelector('img').src;

        document.getElementById('selected-lang-text').textContent = selectedText;
        document.getElementById('selected-lang-flag').src = selectedFlagSrc;
    }
};

// --- GESTIONE VISIBILITÀ PASSWORD ---

function getEyeIconPath(type) {
    if (type === 'text') {
        return `
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
        `;
    } else {
        return `
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        `;
    }
}

// Funzione universale per mostrare/nascondere password
function setupPasswordToggle(buttonId, inputId, iconId) {
    const toggleButton = document.getElementById(buttonId);
    const passwordInput = document.getElementById(inputId);
    const eyeIcon = document.getElementById(iconId);

    if (eyeIcon) {
        // Imposta l'icona iniziale
        eyeIcon.innerHTML = getEyeIconPath('password');
    }

    if (toggleButton && passwordInput && eyeIcon) {
        toggleButton.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            eyeIcon.innerHTML = getEyeIconPath(type);
        });
    }
}

// Inizializza per entrambi i form
setupPasswordToggle('toggleLoginPassword', 'login-password', 'eyeIconLogin');
setupPasswordToggle('toggleSignupPassword', 'signup-password', 'eyeIconSignup');