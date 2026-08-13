// background-color.js
// Questo script gestisce l'applicazione del colore di sfondo in tutte le pagine
// che lo includono, ad eccezione della pagina di login.

document.addEventListener('DOMContentLoaded', () => {
    // 1. CARICAMENTO IMMEDIATO (Evita il flash dello schermo)
    const savedColor = localStorage.getItem('user-background-color');
    const body = document.body;
    const defaultColor = '#f3f4f6';

    if (savedColor) {
        body.style.backgroundColor = savedColor;
    } else {
        body.style.backgroundColor = defaultColor;
        localStorage.setItem('user-background-color', defaultColor);
    }

    // 2. SINCRONIZZAZIONE CON FIRESTORE (In background)
    if (window.auth && window.db) {
        window.auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    let userDoc = null;
                    const username = localStorage.getItem('username');

                    if (username) {
                        // Tenta il recupero diretto tramite l'ID documento (username)
                        userDoc = await window.db.collection('users').doc(username).get();
                    } else {
                        // Fallback tramite query email
                        const snapshot = await window.db.collection('users').where('email', '==', user.email).get();
                        if (!snapshot.empty) {
                            userDoc = snapshot.docs[0];
                        }
                    }

                    // Se il documento esiste ed ha un colore salvato, sincronizza
                    if (userDoc && userDoc.exists) {
                        const userData = userDoc.data();
                        const dbColor = userData.bodyBackgroundColor;

                        if (dbColor && dbColor !== savedColor) {
                            localStorage.setItem('user-background-color', dbColor);
                            body.style.backgroundColor = dbColor;
                            console.log("Sfondo sincronizzato con il cloud:", dbColor);
                        }
                    }
                } catch (error) {
                    console.error("Errore nel recupero del colore di sfondo da Firestore:", error);
                }
            }
        });
    }
});