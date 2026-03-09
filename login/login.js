// --- CONFIGURAZIONE FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyAx_wHQ_K_B0lUSLUQLNupdX8krn0iiHtA",
    authDomain: "spottio-1419e.firebaseapp.com",
    projectId: "spottio-1419e",
    storageBucket: "spottio-1419e.firebasestorage.app"
};

// Inizializza Firebase solo se non è già stato fatto
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// --- 1. GESTIONE STATO AUTENTICAZIONE (Auto-login) ---
auth.onAuthStateChanged((user) => {
    if (user) {
        const usernameSalvato = localStorage.getItem("currentUser");
        
        if (usernameSalvato && usernameSalvato !== "Guest") {
            window.location.href = 'pubblici.html';
        }
    }
});

// --- 2. LOGICA LOGIN ---
document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const lang = localStorage.getItem('selectedLanguage') || 'it';

    if (!username || password.length < 6) {
        alert("Inserisci username valido e password (min 6 caratteri)");
        return;
    }

    try {
        const doc = await db.collection("users").doc(username).get();
        
        if (doc.exists) {
            const email = doc.data().email;
            await auth.signInWithEmailAndPassword(email, password);
            
            if (typeof showMessage === 'function') {
                showMessage(translations[lang]?.loginSuccess || "Accesso riuscito!");
            }
            
            localStorage.setItem('currentUser', username);
            setTimeout(() => {
                window.location.href = 'pubblici.html';
            }, 1000);

        } else {
            throw new Error("Username non trovato");
        }
    } catch (error) {
        console.error("Errore login:", error);
        let userMsg = "Errore durante il login.";
        
        if (error.message === "Username non trovato") {
            userMsg = "Username inesistente.";
        } else if (error.code === 'auth/wrong-password') {
            userMsg = "Password errata.";
        } else if (error.code === 'auth/too-many-requests') {
            userMsg = "Troppi tentativi. Riprova più tardi.";
        }

        if (typeof showMessage === 'function') {
            showMessage(translations[lang]?.loginError || userMsg, true);
        } else {
            alert(userMsg);
        }
    }
});

// --- 3. LOGICA REGISTRAZIONE ---
document.getElementById('signupForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    
    // NUOVO: Recupero lo stato della checkbox privacy
    const privacyAccepted = document.getElementById('signup-privacy').checked;
    const lang = localStorage.getItem('selectedLanguage') || 'it';

    // Validazione
    if (!email.includes('@')) {
        alert("Inserisci un'email valida");
        return;
    }
    if (password.length < 6) {
        alert("La password deve essere di almeno 6 caratteri");
        return;
    }
    
    // NUOVO: Validazione Privacy
    if (!privacyAccepted) {
        alert("Devi accettare Privacy e Policy per continuare.");
        return;
    }

    try {
        const userDoc = await db.collection("users").doc(username).get();
        
        if (userDoc.exists) {
            throw new Error("username_preso");
        }

        await auth.createUserWithEmailAndPassword(email, password);

        await db.collection("users").doc(username).set({
            username: username,
            email: email,
            bio: "Ciao, sono nuovo su Spottio!",
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            isAdmin: false,
            isSuspended: false,
            followers: [],
            following: []
        });

        if (typeof showMessage === 'function') {
            showMessage(translations[lang]?.signupSuccess || "Registrazione completata!", false);
        }
        
        setTimeout(() => {
            toggleForms(true);
            document.getElementById('login-username').value = username;
        }, 1500);

    } catch (error) {
        console.error("Errore registrazione:", error);
        let errorMsg = error.message;

        if (error.message === "username_preso") {
            errorMsg = "Questo username è già stato scelto da un altro utente";
        } else if (error.code === 'auth/email-already-in-use') {
            errorMsg = "Questa email è già registrata";
        }

        if (typeof showMessage === 'function') {
            showMessage(errorMsg, true);
        } else {
            alert(errorMsg);
        }
    }
});

// --- 4. LOGICA PASSWORD DIMENTICATA ---
document.getElementById('tvForgotPassword').addEventListener('click', async function() {
    const input = prompt("Inserisci il tuo Username o la tua Email per ricevere il link di reset:");
    
    if (!input || input.trim() === "") return; 
    
    const val = input.trim();

    try {
        if (val.includes("@")) {
            inviaEmailReset(val);
        } else {
            const doc = await db.collection("users").doc(val).get();
            if (doc.exists && doc.data().email) {
                inviaEmailReset(doc.data().email);
            } else {
                alert("Nessun utente trovato con questo username.");
            }
        }
    } catch (error) {
        alert("Errore durante la ricerca: " + error.message);
    }
});

function inviaEmailReset(email) {
    auth.sendPasswordResetEmail(email)
        .then(() => {
            alert("Link di reset inviato a: " + email + "\nControlla la tua casella di posta.");
        })
        .catch((error) => {
            alert("Errore invio mail: " + error.message);
        });
}

// --- 5. GESTIONE UI ---
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

        localStorage.setItem('selectedLanguage', selectedLang);
        if (typeof setLanguage === 'function') {
            setLanguage(selectedLang);
        }
    });
});

window.onload = function() {
    const savedLang = localStorage.getItem('selectedLanguage') || 'it';
    
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