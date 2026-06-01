(function() {
    // Attendiamo che la pagina e gli script (Firebase compreso) siano pronti
    window.addEventListener('load', () => {
        const auth = window.auth;
        const db = window.db;

        // Controllo di sicurezza
        if (!auth || !db) {
            console.error("Errore: Firebase non inizializzato in signup.js. Controlla l'ordine degli script.");
            return;
        }

        // --- 1. LOGICA REGISTRAZIONE ---
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', async function(event) {
                event.preventDefault();

                const username = document.getElementById('signup-username').value.trim();
                const email = document.getElementById('signup-email').value.trim();
                const password = document.getElementById('signup-password').value;
                const privacyAccepted = document.getElementById('signup-privacy').checked;
                const lang = localStorage.getItem('selectedLanguage') || 'it';

                if (!email.includes('@')) {
                    alert("Inserisci un'email valida");
                    return;
                }
                if (password.length < 6) {
                    alert("La password deve essere di almeno 6 caratteri");
                    return;
                }
                if (!privacyAccepted) {
                    alert("Devi accettare Privacy e Policy per continuare.");
                    return;
                }

                const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
                if (!usernameRegex.test(username)) {
                    alert("L'username contiene caratteri non validi.");
                    return;
                }

                try {
                    sessionStorage.setItem("isSigningUp", "true");

                    const userDoc = await db.collection("users").doc(username).get();
                    if (userDoc.exists) {
                        throw new Error("username_preso");
                    }

                    // Creazione account
                    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                    const user = userCredential.user;

                    // Scrittura nel database
                    await db.collection("users").doc(username).set({
                        username: username,
                        email: email,
                        uid: user.uid,
                        bio: "Ciao, sono nuovo su Spottio!",
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        isAdmin: false,
                        isSuspended: false,
                        followers: [],
                        following: []
                    });

                    localStorage.setItem('currentUser', username);
                    sessionStorage.removeItem("isSigningUp");

                    if (typeof showMessage === 'function') {
                        const successMsg = typeof translations !== 'undefined' ? translations[lang]?.signupSuccess : "Registrazione completata!";
                        showMessage(successMsg, false);
                    }
                    
                    setTimeout(() => {
                        if (typeof toggleForms === 'function') {
                            toggleForms(true);
                        }
                        const loginUserField = document.getElementById('login-username');
                        if (loginUserField) loginUserField.value = username;
                    }, 1500);

                } catch (error) {
                    sessionStorage.removeItem("isSigningUp");
                    console.error("Errore registrazione:", error);
                    let errorMsg = error.message;

                    if (error.message === "username_preso") {
                        errorMsg = "Questo username è già stato scelto.";
                    } else if (error.code === 'auth/email-already-in-use') {
                        errorMsg = "Questa email è già registrata.";
                    }

                    if (typeof showMessage === 'function') {
                        showMessage(errorMsg, true);
                    } else {
                        alert(errorMsg);
                    }
                }
            });
        }

        // --- 2. LOGICA PASSWORD DIMENTICATA ---
        const btnForgot = document.getElementById('tvForgotPassword');
        if (btnForgot) {
            btnForgot.addEventListener('click', async function() {
                const input = prompt("Inserisci Username o Email:");
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
                            alert("Nessun utente trovato.");
                        }
                    }
                } catch (error) {
                    alert("Errore: " + error.message);
                }
            });
        }

        function inviaEmailReset(email) {
            auth.sendPasswordResetEmail(email)
                .then(() => alert("Link inviato a: " + email))
                .catch((error) => alert("Errore: " + error.message));
        }
    });
})();