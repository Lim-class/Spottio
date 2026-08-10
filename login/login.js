(function() {
    window.addEventListener('load', () => {
        
        if (!window.checkFirebase()) return;
        const auth = window.auth;
        const db = window.db;

        // --- Funzione per richiedere e salvare la geolocalizzazione ---
        function richiediESalvaPosizione(uid) {
            return new Promise((resolve) => {
                if (!("geolocation" in navigator)) {
                    console.warn("Geolocalizzazione non supportata da questo browser.");
                    resolve();
                    return;
                }

                // Chiede la posizione all'utente
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        try {
                            const lat = position.coords.latitude;
                            const lng = position.coords.longitude;

                            await db.collection("users").doc(uid).set({
                                location: {
                                    latitude: lat,
                                    longitude: lng,
                                    last_coordinates_update: firebase.firestore.FieldValue.serverTimestamp()
                                }
                            }, { merge: true });

                            console.log("Posizione salvata su Firestore:", lat, lng);
                        } catch (err) {
                            console.error("Errore durante la scrittura su Firestore:", err);
                        } finally {
                            resolve();
                        }
                    },
                    (error) => {
                        console.warn("Impossibile ottenere la posizione (Permesso negato o errore):", error.message);
                        resolve(); 
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 8000,
                        maximumAge: 0
                    }
                );
            });
        }

        // --- 1. GESTIONE STATO AUTENTICAZIONE (Auto-login) ---
        auth.onAuthStateChanged((user) => {
            if (user) {
                const usernameSalvato = localStorage.getItem("currentUser");
                const isSigningUp = sessionStorage.getItem("isSigningUp");
                
                if (usernameSalvato && usernameSalvato !== "Guest" && !isSigningUp && !sessionStorage.getItem("isLoggingIn")) {
                    window.location.href = '../pubblici/pubblici.html';
                }
            }
        });

        // --- 2. LOGICA LOGIN ---
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async function(event) {
                event.preventDefault();
                
                const emailInput = document.getElementById('login-email');
                const passwordInput = document.getElementById('login-password');
                
                const email = emailInput.value.trim();
                const password = passwordInput.value;
                const lang = window.getCurrentLanguage(); // Utilizza helper da ui.js

                if (!email || password.length < 6) {
                    alert("Inserisci un'email valida e una password (min 6 caratteri)");
                    return;
                }

                try {
                    sessionStorage.setItem("isLoggingIn", "true");

                    // 1. EFFETTUA IL LOGIN
                    const userCredential = await auth.signInWithEmailAndPassword(email, password);
                    const user = userCredential.user;

                    // 2. RICHIEDE LA POSIZIONE E LA SALVA SU FIRESTORE
                    if (typeof showMessage === 'function') {
                        showMessage("Rilevamento posizione in corso...", false);
                    }
                    await richiediESalvaPosizione(user.uid);

                    // 3. RECUPERA I DATI UTENTE
                    const userDoc = await db.collection("users").doc(user.uid).get();
                    
                    let username = "Utente";
                    let isAdmin = false;

                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        username = userData.username || "Utente";
                        isAdmin = userData.isAdmin || false;
                    }

                    // 4. SALVA IN LOCALSTORAGE
                    localStorage.setItem('currentUser', username);
                    localStorage.setItem('isAdmin', isAdmin); 
                    localStorage.setItem('currentUid', user.uid);
                    
                    sessionStorage.removeItem("isLoggingIn");

                    // 5. MESSAGGIO DI SUCCESSO
                    if (typeof showMessage === 'function') {
                        const successMsg = (typeof translations !== 'undefined') 
                            ? translations[lang]?.loginSuccess 
                            : "Accesso riuscito!";
                        showMessage(successMsg, false);
                    }
                    
                    // 6. REINDIRIZZAMENTO
                    setTimeout(() => {
                        window.location.href = '../pubblici/pubblici.html';
                    }, 500);

                } catch (error) {
                    sessionStorage.removeItem("isLoggingIn");
                    console.error("Errore login:", error);
                    let userMsg = "Errore durante il login.";
                    
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