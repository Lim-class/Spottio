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
// Simile al blocco "if (mAuth.getCurrentUser() != null)" in Java
auth.onAuthStateChanged((user) => {
    if (user) {
        // L'utente è loggato in Firebase. 
        // Verifichiamo se c'è uno username salvato localmente
        const usernameSalvato = localStorage.getItem("currentUser");
        
        if (usernameSalvato && usernameSalvato !== "Guest") {
            window.location.href = 'pubblici.html';
        }
    }
});

// --- 2. LOGICA LOGIN (Speculare a handleLogin) ---
document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const lang = localStorage.getItem('language') || 'it';

    if (!username || password.length < 6) {
        alert("Inserisci username valido e password (min 6 caratteri)");
        return;
    }

    try {
        // A. Cerchiamo lo username nel database (Firestore)
        const doc = await db.collection("users").doc(username).get();
        
        if (doc.exists) {
            // B. Recuperiamo l'email reale associata
            const email = doc.data().email;
            
            // C. Eseguiamo il login con email e password
            await auth.signInWithEmailAndPassword(email, password);
            
            // D. Successo -> Salviamo username e reindirizziamo
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

// --- 3. LOGICA REGISTRAZIONE (Speculare a handleRegister) ---
document.getElementById('signupForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const lang = localStorage.getItem('language') || 'it';

    // Validazione
    if (!email.includes('@')) {
        alert("Inserisci un'email valida");
        return;
    }
    if (password.length < 6) {
        alert("La password deve essere di almeno 6 caratteri");
        return;
    }

    try {
        // A. CONTROLLO UNICITÀ USERNAME
        const userDoc = await db.collection("users").doc(username).get();
        
        if (userDoc.exists) {
            // Username già preso
            throw new Error("username_preso");
        }

        // B. USERNAME DISPONIBILE -> CREO UTENTE AUTH
        await auth.createUserWithEmailAndPassword(email, password);

        // C. SALVO I DATI SU FIRESTORE
        // Usiamo lo username come ID del documento, esattamente come in Java
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

        // D. Successo
        if (typeof showMessage === 'function') {
            showMessage(translations[lang]?.signupSuccess || "Registrazione completata!", false);
        }
        
        // Switch automatico al form di login compilato
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

// --- 4. LOGICA PASSWORD DIMENTICATA (Speculare a showResetPasswordDialog) ---
document.getElementById('tvForgotPassword').addEventListener('click', async function() {
    // Usiamo prompt() come sostituto semplice dell'AlertDialog
    const input = prompt("Inserisci il tuo Username o la tua Email per ricevere il link di reset:");
    
    if (!input || input.trim() === "") return; // Utente ha annullato o lasciato vuoto
    
    const val = input.trim();

    try {
        if (val.includes("@")) {
            // È una mail, invia direttamente
            inviaEmailReset(val);
        } else {
            // È uno username, cerca l'email nel DB
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

// --- 5. GESTIONE UI (Switch Login/Signup e Lingue) ---

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

// Gestione Dropdown Lingua
document.getElementById('language-dropdown-button').addEventListener('click', () => {
    document.getElementById('language-dropdown-menu').classList.toggle('hidden');
});

// Gestione Click Opzione Lingua
document.querySelectorAll('.lang-option').forEach(button => {
    button.addEventListener('click', (event) => {
        const selectedLang = event.currentTarget.dataset.lang;
        const selectedText = event.currentTarget.dataset.text;
        const selectedFlagSrc = event.currentTarget.querySelector('img').src;

        document.getElementById('language-dropdown-menu').classList.add('hidden');
        document.getElementById('selected-lang-text').textContent = selectedText;
        document.getElementById('selected-lang-flag').src = selectedFlagSrc;

        // Salva lingua e aggiorna traduzioni se la funzione esiste
        localStorage.setItem('language', selectedLang);
        if (typeof setLanguage === 'function') {
            setLanguage(selectedLang);
        }
    });
});

// Inizializzazione Lingua al caricamento pagina
window.onload = function() {
    const savedLang = localStorage.getItem('language') || 'it';
    // Imposta visivamente il dropdown se necessario (opzionale) o chiama la funzione di traduzione
    if (typeof setLanguage === 'function') {
        setLanguage(savedLang);
    }
};
