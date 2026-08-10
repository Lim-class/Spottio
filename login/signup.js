(function() {
    window.addEventListener('load', () => {
        
        if (!window.checkFirebase()) return;
        const auth = window.auth;
        const db = window.db;

        // Funzione per calcolare l'età dall'input "YYYY-MM-DD"
        function calcolaEta(dataNascitaStringa) {
            const oggi = new Date();
            const dataNascita = new Date(dataNascitaStringa);
            let eta = oggi.getFullYear() - dataNascita.getFullYear();
            const m = oggi.getMonth() - dataNascita.getMonth();
            if (m < 0 || (m === 0 && oggi.getDate() < dataNascita.getDate())) {
                eta--;
            }
            return eta;
        }

        // --- 1. LOGICA REGISTRAZIONE ---
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', async function(event) {
                event.preventDefault();

                const username = document.getElementById('signup-username').value.trim();
                const email = document.getElementById('signup-email').value.trim();
                const dobInput = document.getElementById('signup-dob').value;
                const password = document.getElementById('signup-password').value;
                const privacyAccepted = document.getElementById('signup-privacy').checked;
                const lang = window.getCurrentLanguage(); // Utilizza helper da ui.js

                if (!email.includes('@')) {
                    alert("Inserisci un'email valida");
                    return;
                }

                if (!dobInput) {
                    alert("Inserisci la tua data di nascita.");
                    return;
                }

                // Controllo Età Minima (14 anni)
                const ETA_MINIMA = 14;
                if (calcolaEta(dobInput) < ETA_MINIMA) {
                    alert(`Spiacenti, devi avere almeno ${ETA_MINIMA} anni per registrarti.`);
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

                // Conversione data da YYYY-MM-DD a formato italiano GG/MM/AAAA 
                const [anno, mese, giorno] = dobInput.split('-');
                const birthDateIT = `${giorno}/${mese}/${anno}`;

                try {
                    sessionStorage.setItem("isSigningUp", "true");

                    // Controllo disponibilità username
                    const usersRef = db.collection("users");
                    const snapshot = await usersRef.where("username", "==", username).get();
                    
                    if (!snapshot.empty) {
                        throw new Error("username_preso");
                    }

                    // Creazione account Firebase Auth
                    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                    const user = userCredential.user;

                    // Scrittura profilo utente su Firestore
                    await db.collection("users").doc(user.uid).set({
                        username: username,
                        email: email,
                        birthDate: birthDateIT, 
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
                        const loginUserField = document.getElementById('login-email');
                        if (loginUserField) loginUserField.value = email;
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