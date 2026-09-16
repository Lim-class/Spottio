// loginApp.js - Motore centralizzato per il Login e Signup con Vue 3
const { createApp, ref, computed, onMounted } = Vue;

const app = createApp({
    setup() {
        // --- STATO GENERALE ---
        const currentMode = ref('login'); // 'login' | 'signup'
        const isLoading = ref(false);
        const message = ref({ text: '', isError: false });
        
        // --- DATI FORM ---
        const loginData = ref({ email: '', password: '' });
        const signupData = ref({ username: '', email: '', dob: '', password: '', privacy: false });
        
        // --- TOGGLE PASSWORD ---
        const showLoginPassword = ref(false);
        const showSignupPassword = ref(false);

        // --- GESTIONE LINGUE & BANDIERE (da language-menu.js) ---
        const availableLanguages = ref(window.APP_LANGUAGES || [
            { code: 'it', text: 'Italiano', flag: 'it.svg', alt: 'Bandiera Italiana' }
        ]);

        const selectedLangCode = ref(localStorage.getItem('selectedLanguage') || 'it');
        const showLanguageMenu = ref(false);

        const dictionaryKey = computed(() => {
            if (typeof window.getDictionaryKey === 'function') {
                return window.getDictionaryKey(selectedLangCode.value);
            }
            return selectedLangCode.value;
        });

        // Oggetto traduzioni attivo
        const t = computed(() => {
            if (typeof translations === 'undefined') return {};
            return translations[dictionaryKey.value] || translations[selectedLangCode.value] || {};
        });

        // Oggetto lingua e bandiera attiva
        const currentLangObj = computed(() => {
            return availableLanguages.value.find(l => l.code === selectedLangCode.value) || 
                   availableLanguages.value.find(l => l.code === 'it') || 
                   availableLanguages.value[0];
        });

        const changeLanguage = (code) => {
            selectedLangCode.value = code;
            localStorage.setItem('selectedLanguage', code);
            showLanguageMenu.value = false;
        };

        // --- STATO MODALE BAN ---
        const modals = ref({
            ban: { 
                show: false, 
                uid: '', 
                email: '', 
                username: '', 
                reason: '', 
                duration: '', 
                appealText: '', 
                statusMsg: '', 
                isError: false, 
                isSubmitting: false 
            }
        });

        // --- UTILITY ---
        const showMessage = (text, isError = false) => {
            message.value = { text, isError };
        };

        const clearMessage = () => {
            message.value = { text: '', isError: false };
        };

        // Helper autonomo per il calcolo dell'età
        const getAge = (dobString) => {
            if (window.Spottio && typeof window.Spottio.calculateAge === 'function') {
                return window.Spottio.calculateAge(dobString);
            }
            if (!dobString) return 0;
            const birthDate = new Date(dobString);
            if (isNaN(birthDate.getTime())) return 0;

            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age;
        };

        // --- LOGICA BAN ---
        const verificaStatoBan = async (userData, uid) => {
            if (!userData) return { isBanned: false };
            const banned = userData.banned;
            
            if (userData.isSuspended && !banned) {
                return { isBanned: true, reason: "Account sospeso da un amministratore", duration: "Permanente" };
            }
            if (!banned || banned.status !== true) {
                return { isBanned: false };
            }

            if (banned.bannedUntil) {
                const now = new Date();
                const expiryDate = banned.bannedUntil.toDate ? banned.bannedUntil.toDate() : new Date(banned.bannedUntil);

                if (now >= expiryDate) {
                    try {
                        await window.db.collection("users").doc(uid).update({
                            "banned": { status: false, reason: "", bannedAt: null, bannedUntil: null, bannedBy: null }
                        });
                        return { isBanned: false };
                    } catch (e) {
                        return { isBanned: false };
                    }
                } else {
                    const dataFormattata = expiryDate.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                    return { isBanned: true, reason: banned.reason || "Violazione delle linee guida", duration: `Fino al ${dataFormattata}` };
                }
            }
            return { isBanned: true, reason: banned.reason || "Violazione grave delle linee guida", duration: "Permanente" };
        };

        const eseguiEspulsioneBan = async (user, userData, banInfo) => {
            await window.auth.signOut();
            localStorage.removeItem('currentUser');
            localStorage.removeItem('isAdmin');
            localStorage.removeItem('currentUid');
            sessionStorage.removeItem("isLoggingIn");
            
            modals.value.ban = {
                show: true,
                uid: user.uid,
                email: user.email,
                username: userData.username || "Utente",
                reason: banInfo.reason || "Violazione delle linee guida",
                duration: banInfo.duration || "Permanente",
                appealText: '',
                statusMsg: '',
                isError: false,
                isSubmitting: false
            };
        };

        // --- GEOLOCALIZZAZIONE ---
        const richiediESalvaPosizione = (uid) => {
            return new Promise((resolve) => {
                if (!("geolocation" in navigator)) return resolve();
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        try {
                            await window.db.collection("users").doc(uid).set({
                                location: {
                                    latitude: position.coords.latitude,
                                    longitude: position.coords.longitude,
                                    last_coordinates_update: firebase.firestore.FieldValue.serverTimestamp()
                                }
                            }, { merge: true });
                        } catch (err) {} finally { resolve(); }
                    },
                    (error) => resolve(),
                    { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
                );
            });
        };

        // --- LIFECYCLE ---
        onMounted(() => {
            if (window.APP_LANGUAGES) {
                availableLanguages.value = window.APP_LANGUAGES;
            }

            const checkDb = setInterval(() => {
                if (window.auth && window.db) {
                    clearInterval(checkDb);

                    const urlParams = new URLSearchParams(window.location.search);
                    if (urlParams.get('banned') === 'true') {
                        const reason = urlParams.get('reason') || "Il tuo account è stato sospeso.";
                        showMessage(`Accesso negato: ${decodeURIComponent(reason)}`, true);
                    }

                    window.auth.onAuthStateChanged(async (user) => {
                        if (user) {
                            const usernameSalvato = localStorage.getItem("currentUser");
                            const isSigningUp = sessionStorage.getItem("isSigningUp");
                            
                            if (usernameSalvato && usernameSalvato !== "Guest" && !isSigningUp && !sessionStorage.getItem("isLoggingIn")) {
                                try {
                                    const userDoc = await window.db.collection("users").doc(user.uid).get();
                                    if (userDoc.exists) {
                                        const userData = userDoc.data();
                                        const banInfo = await verificaStatoBan(userData, user.uid);
                                        if (banInfo.isBanned) {
                                            await eseguiEspulsioneBan(user, userData, banInfo);
                                            return;
                                        }
                                    }
                                } catch (err) { console.error(err); }
                                window.location.href = '../spot/spot.html';
                            }
                        }
                    });
                }
            }, 200);
        });

        // --- ACTIONS: LOGIN ---
        const handleLogin = async () => {
            if (loginData.value.password.length < 6) {
                showMessage("La password deve avere almeno 6 caratteri", true);
                return;
            }

            isLoading.value = true;
            clearMessage();
            sessionStorage.setItem("isLoggingIn", "true");

            try {
                const userCredential = await window.auth.signInWithEmailAndPassword(loginData.value.email, loginData.value.password);
                const user = userCredential.user;
                const userDoc = await window.db.collection("users").doc(user.uid).get();
                
                if (!userDoc.exists) throw new Error("auth/user-not-found");

                const userData = userDoc.data();
                const banInfo = await verificaStatoBan(userData, user.uid);
                
                if (banInfo.isBanned) {
                    await eseguiEspulsioneBan(user, userData, banInfo);
                    isLoading.value = false;
                    return;
                }

                showMessage("Rilevamento posizione in corso...", false);
                await richiediESalvaPosizione(user.uid);

                // Rileva e salva subito anche l'IP se disponibile
                if (window.Spottio && typeof window.Spottio.trackUserIp === 'function') {
                    try {
                        await window.Spottio.trackUserIp(user.uid);
                    } catch (e) {
                        console.warn("Tracking IP non riuscito:", e);
                    }
                }

                localStorage.setItem('currentUser', userData.username || "Utente");
                localStorage.setItem('isAdmin', userData.isAdmin || false); 
                localStorage.setItem('currentUid', user.uid);
                sessionStorage.removeItem("isLoggingIn");

                showMessage(t.value.loginSuccess || "Accesso riuscito!", false);
                setTimeout(() => window.location.href = '../spot/spot.html', 500);

            } catch (error) {
                sessionStorage.removeItem("isLoggingIn");
                let msg = t.value.errorGenericLogin || "Errore durante il login.";
                if (error.code === 'auth/user-not-found') msg = t.value.errorUserNotFound || "Nessun account trovato con questa email.";
                else if (['auth/wrong-password', 'auth/invalid-credential', 'auth/invalid-login-credentials'].includes(error.code)) {
                    msg = t.value.errorWrongCredentials || "Password o email errati.";
                }
                else if (error.code === 'auth/invalid-email') msg = t.value.errorInvalidEmail || "Il formato dell'email non è valido.";
                else if (error.code === 'auth/too-many-requests') msg = t.value.errorTooManyRequests || "Troppi tentativi. Riprova più tardi.";
                
                showMessage(msg, true);
            } finally {
                isLoading.value = false;
            }
        };

        // --- ACTIONS: SIGNUP ---
        const handleSignup = async () => {
            const dob = signupData.value.dob;
            const ETA_MINIMA = 14;

            // Calcolo sicuro dell'età senza dipendenze obbligatorie
            if (getAge(dob) < ETA_MINIMA) {
                showMessage(`Spiacenti, devi avere almeno ${ETA_MINIMA} anni per registrarti.`, true);
                return;
            }
            if (signupData.value.password.length < 6) {
                showMessage("La password deve essere di almeno 6 caratteri", true);
                return;
            }
            if (!/^[a-zA-Z0-9_.-]+$/.test(signupData.value.username)) {
                showMessage("L'username contiene caratteri non validi.", true);
                return;
            }

            isLoading.value = true;
            clearMessage();
            sessionStorage.setItem("isSigningUp", "true");

            const [anno, mese, giorno] = dob.split('-');
            const birthDateIT = `${giorno}/${mese}/${anno}`;

            try {
                const snapshot = await window.db.collection("users").where("username", "==", signupData.value.username).get();
                if (!snapshot.empty) throw new Error("username_preso");

                const userCredential = await window.auth.createUserWithEmailAndPassword(signupData.value.email, signupData.value.password);
                const user = userCredential.user;

                await window.db.collection("users").doc(user.uid).set({
                    username: signupData.value.username,
                    email: signupData.value.email,
                    birthDate: birthDateIT, 
                    uid: user.uid,
                    bio: "Ciao, sono nuovo su Spottio!",
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    isAdmin: false,
                    banned: { status: false, reason: "", bannedAt: null, bannedUntil: null, bannedBy: null },
                    followers: [],
                    following: []
                });

                localStorage.setItem('currentUser', signupData.value.username);
                sessionStorage.removeItem("isSigningUp");

                showMessage(t.value.signupSuccess || "Registrazione completata!", false);
                
                setTimeout(() => {
                    loginData.value.email = signupData.value.email;
                    currentMode.value = 'login';
                    clearMessage();
                }, 1500);

            } catch (error) {
                sessionStorage.removeItem("isSigningUp");
                let msg = error.message;
                if (error.message === "username_preso") msg = t.value.errorUsernameTaken || "Questo username è già stato scelto.";
                else if (error.code === 'auth/email-already-in-use') msg = t.value.errorEmailInUse || "Questa email è già registrata.";
                else if (error.code === 'auth/invalid-email') msg = t.value.errorInvalidEmail || "Inserisci un'email valida.";
                showMessage(msg, true);
            } finally {
                isLoading.value = false;
            }
        };

        // --- ACTIONS: PASSWORD DIMENTICATA ---
        const handleForgotPassword = async () => {
            const input = prompt("Inserisci Username o Email:");
            if (!input || input.trim() === "") return; 
            const val = input.trim();

            try {
                if (val.includes("@")) {
                    await window.auth.sendPasswordResetEmail(val);
                    alert("Link inviato a: " + val);
                } else {
                    const doc = await window.db.collection("users").doc(val).get();
                    if (doc.exists && doc.data().email) {
                        await window.auth.sendPasswordResetEmail(doc.data().email);
                        alert("Link inviato all'email associata.");
                    } else {
                        alert("Nessun utente trovato.");
                    }
                }
            } catch (error) {
                alert("Errore: " + error.message);
            }
        };

        // --- ACTIONS: RICORSO BAN ---
        const submitAppeal = async () => {
            const banState = modals.value.ban;
            if (!banState.appealText.trim() || !window.db) return;

            banState.isSubmitting = true;
            try {
                await window.db.collection("appeals").add({
                    uid: banState.uid,
                    username: banState.username,
                    email: banState.email,
                    banReason: banState.reason || "Non specificata",
                    appealText: banState.appealText.trim(),
                    status: "pending",
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                banState.statusMsg = "Ricorso inviato con successo! Un amministratore lo esaminerà.";
                banState.isError = false;
                banState.appealText = '';
            } catch (error) {
                banState.statusMsg = "Errore nell'invio del ricorso. Riprova più tardi.";
                banState.isError = true;
            } finally {
                banState.isSubmitting = false;
            }
        };

        return {
            currentMode, isLoading, message,
            loginData, signupData, 
            showLoginPassword, showSignupPassword,
            selectedLangCode, showLanguageMenu, availableLanguages, currentLangObj, t,
            modals,
            handleLogin, handleSignup, handleForgotPassword,
            changeLanguage, clearMessage, submitAppeal
        };
    }
});

app.mount('#vue-login-app');