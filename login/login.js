// Configurazione Firebase dal tuo google-services.json
const firebaseConfig = {
    apiKey: "AIzaSyAx_wHQ_K_B0lUSLUQLNupdX8krn0iiHtA",
    authDomain: "spottio-1419e.firebaseapp.com",
    projectId: "spottio-1419e",
    storageBucket: "spottio-1419e.firebasestorage.app"
};

// Inizializza Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// Helper per convertire username in finta email (uguale alla MainActivity.java)
function usernameToEmail(username) {
    return username.toLowerCase().trim() + "@spottio.it";
}

// Inizializza lingua all'avvio (Logica originale mantenuta)
window.onload = function() {
    const savedLang = localStorage.getItem('language') || 'it';
    if (typeof setLanguage === 'function') {
        setLanguage(savedLang);
    }
};

// --- LOGICA LOGIN ---
document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const fakeEmail = usernameToEmail(username);
    const lang = localStorage.getItem('language') || 'it';

    auth.signInWithEmailAndPassword(fakeEmail, password)
        .then((userCredential) => {
            // Successo
            if (typeof showMessage === 'function') {
                showMessage(translations[lang].loginSuccess);
            }
            localStorage.setItem('currentUser', username);
            setTimeout(() => {
                window.location.href = 'pubblici.html';
            }, 1000);
        })
        .catch((error) => {
            // Errore
            console.error("Errore login:", error.code);
            if (typeof showMessage === 'function') {
                showMessage(translations[lang].loginError, true);
            } else {
                const msgCont = document.getElementById('message-container');
                msgCont.innerText = "Credenziali errate o utente inesistente.";
                msgCont.style.color = "red";
            }
        });
});

// --- LOGICA REGISTRAZIONE ---
document.getElementById('signupForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
    const fakeEmail = usernameToEmail(username);
    const lang = localStorage.getItem('language') || 'it';

    auth.createUserWithEmailAndPassword(fakeEmail, password)
        .then((userCredential) => {
            const user = userCredential.user;
            // Salva profilo su Firestore (collezione 'users')
            return db.collection("users").doc(user.uid).set({
                username: username,
                email: fakeEmail,
                bio: "Ciao, sono nuovo su Spottio!",
                isAdmin: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            if (typeof showMessage === 'function') {
                showMessage(translations[lang].signupSuccess, false);
            }
            setTimeout(() => {
                toggleForms(true);
                document.getElementById('login-username').value = username;
            }, 1500);
        })
        .catch((error) => {
            console.error("Errore registrazione:", error);
            let errorMsg = error.message;
            if (error.code === 'auth/email-already-in-use') {
                errorMsg = translations[lang].signupUsernameExists;
            }
            if (typeof showMessage === 'function') {
                showMessage(errorMsg, true);
            } else {
                alert(errorMsg);
            }
        });
});

// --- LOGICA UI (Originale Spottio) ---

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

// Selettore Lingua
document.getElementById('language-dropdown-button').addEventListener('click', () => {
    document.getElementById('language-dropdown-menu').classList.toggle('hidden');
});

document.querySelectorAll('.lang-option').forEach(button => {
    button.addEventListener('click', (event) => {
        const selectedLang = event.currentTarget.dataset.lang;
        const selectedText = event.currentTarget.dataset.text;
        const selectedFlagSrc = event.currentTarget.querySelector('img').src;

        document.getElementById('language-dropdown-menu').classList.add('hidden');
        document.getElementById('selected-lang-text').textContent = selectedText;
        document.getElementById('selected-lang-flag').src = selectedFlagSrc;

        if (typeof setLanguage === 'function') {
            setLanguage(selectedLang);
        }
    });
});
