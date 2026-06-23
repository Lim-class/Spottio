(function() {
    // 1. Avvolgiamo tutto in un listener 'load' per assicurarci che 
    // firebase-config.js abbia già creato window.auth e window.db
    window.addEventListener('load', () => {
        
        const auth = window.auth;
        const db = window.db;

        // Controllo critico: se Firebase non è caricato, fermiamo l'esecuzione
        if (!auth || !db) {
            console.error("Errore: Firebase non è stato inizializzato. Controlla l'ordine dei file in login.html");
            return;
        }

        // --- 1. GESTIONE STATO AUTENTICAZIONE (Auto-login) ---
        auth.onAuthStateChanged((user) => {
            if (user) {
                const usernameSalvato = localStorage.getItem("currentUser");
                const isSigningUp = sessionStorage.getItem("isSigningUp");
                
                // Reindirizza SOLO se abbiamo un utente salvato e NON stiamo facendo una registrazione
                if (usernameSalvato && usernameSalvato !== "Guest" && !isSigningUp) {
                    window.location.href = '../pubblici/pubblici.html';
                }
            }
        });

        // --- 2. LOGICA LOGIN ---
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async function(event) {
                event.preventDefault();
                
                // Prendiamo l'input dell'email invece che dell'username
                const emailInput = document.getElementById('login-email');
                const passwordInput = document.getElementById('login-password');
                
                const email = emailInput.value.trim();
                const password = passwordInput.value;
                const lang = localStorage.getItem('selectedLanguage') || 'it';

                if (!email || password.length < 6) {
                    alert("Inserisci un'email valida e una password (min 6 caratteri)");
                    return;
                }

                try {
                    // 1. EFFETTUA IL LOGIN DIRETTAMENTE (Sicuro, non tocca il database da non autenticato)
                    const userCredential = await auth.signInWithEmailAndPassword(email, password);
                    const user = userCredential.user;
                    
                    // 2. ORA CHE SIAMO AUTENTICATI, recuperiamo i dati dell'utente (username, ecc.) tramite il suo UID
                    const userDoc = await db.collection("users").doc(user.uid).get();
                    
                    let username = "Utente";
                    let isAdmin = false;

                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        username = userData.username || "Utente";
                        isAdmin = userData.isAdmin || false;
                    }

                    // 3. Salva i dati in locale
                    localStorage.setItem('currentUser', username);
                    localStorage.setItem('isAdmin', isAdmin); 
                    localStorage.setItem('currentUid', user.uid); // Consigliato per query future e sicurezza
                    
                    // 4. Mostriamo il messaggio di successo se la funzione esiste
                    if (typeof showMessage === 'function') {
                        const successMsg = (typeof translations !== 'undefined') 
                            ? translations[lang]?.loginSuccess 
                            : "Accesso riuscito!";
                        showMessage(successMsg, false);
                    }
                    
                    // 5. Reindirizzamento dopo un breve delay
                    setTimeout(() => {
                        window.location.href = '../pubblici/pubblici.html';
                    }, 1000);

                } catch (error) {
                    console.error("Errore login:", error);
                    let userMsg = "Errore durante il login.";
                    
                    // Gestione specifica dei messaggi di errore di Firebase Auth
                    if (error.code === 'auth/user-not-found') {
                        userMsg = "Nessun account trovato con questa email.";
                    } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                        userMsg = "Password errata o credenziali non valide.";
                    } else if (error.code === 'auth/invalid-email') {
                        userMsg = "Il formato dell'email non è valido.";
                    } else if (error.code === 'auth/too-many-requests') {
                        userMsg = "Troppi tentativi. Riprova più tardi.";
                    }

                    if (typeof showMessage === 'function') {
                        showMessage(userMsg, true);
                    } else {
                        alert(userMsg);
                    }
                }
            });
        }
    });
})();