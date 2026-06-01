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
                    window.location.href = 'pubblici.html';
                }
            }
        });

        // --- 2. LOGICA LOGIN ---
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async function(event) {
                event.preventDefault();
                
                const usernameInput = document.getElementById('login-username');
                const passwordInput = document.getElementById('login-password');
                
                const username = usernameInput.value.trim();
                const password = passwordInput.value;
                const lang = localStorage.getItem('selectedLanguage') || 'it';

                if (!username || password.length < 6) {
                    alert("Inserisci username valido e password (min 6 caratteri)");
                    return;
                }

                try {
                    // Cerchiamo l'utente nel database tramite lo username (Document ID)
                    const doc = await db.collection("users").doc(username).get();
                    
                    if (doc.exists) {
                        const userData = doc.data();
                        const email = userData.email;
                        const isAdmin = userData.isAdmin || false; // Recupera il flag
                        // Eseguiamo l'accesso con l'email recuperata
                        await auth.signInWithEmailAndPassword(email, password);
                        
                        // Mostriamo il messaggio di successo se la funzione esiste
                        if (typeof showMessage === 'function') {
                            const successMsg = (typeof translations !== 'undefined') 
                                ? translations[lang]?.loginSuccess 
                                : "Accesso riuscito!";
                            showMessage(successMsg, false);
                        }
                        
                        localStorage.setItem('currentUser', username);
                        localStorage.setItem('isAdmin', isAdmin); // SALVA IL VALORE QUI
                        
                        // Reindirizzamento dopo un breve delay
                        setTimeout(() => {
                            window.location.href = 'pubblici.html';
                        }, 1000);

                    } else {
                        throw new Error("Username non trovato");
                    }
                } catch (error) {
                    console.error("Errore login:", error);
                    let userMsg = "Errore durante il login.";
                    
                    // Gestione specifica dei messaggi di errore
                    if (error.message === "Username non trovato") {
                        userMsg = "Username inesistente.";
                    } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                        userMsg = "Password errata o credenziali non valide.";
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