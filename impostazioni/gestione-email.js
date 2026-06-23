document.getElementById('update-email-btn').addEventListener('click', async () => {
    const currentPass = document.getElementById('email-current-pass').value;
    const newEmail = document.getElementById('new-email').value.trim();
    
    const auth = window.auth;
    const db = window.db;
    const user = auth ? auth.currentUser : null;

    if (!user || !db) {
        alert("Errore: Servizi Firebase non disponibili.");
        return;
    }

    if (!currentPass || !newEmail) {
        alert("Per favore, inserisci sia la password attuale che la nuova e-mail.");
        return;
    }

    // 1. Re-autenticazione di sicurezza (Obbligatoria in Firebase prima di cambiare email)
    const cred = firebase.auth.EmailAuthProvider.credential(user.email, currentPass);
    
    try {
        console.log("⏳ Ri-autenticazione in corso...");
        await user.reauthenticateWithCredential(cred);
        
        console.log("⏳ Aggiornamento e-mail su Firebase Auth...");
        // 2. Aggiorna l'email nei servizi di Autenticazione di Firebase
        await user.updateEmail(newEmail);
        
        console.log("⏳ Aggiornamento e-mail sul database utenti di Firestore...");
        // 3. Aggiorna l'email all'interno della collezione "users" su Firestore
        await db.collection("users").doc(user.uid).update({
            email: newEmail
        });

        alert("E-mail aggiornata con successo ovunque!");
        
        // Svuota i campi di testo per sicurezza
        document.getElementById('email-current-pass').value = "";
        document.getElementById('new-email').value = "";
        
    } catch (error) {
        console.error("Errore durante il cambio email:", error);
        
        let erroreTradotto = error.message;
        if (error.code === 'auth/wrong-password') {
            erroreTradotto = "La password attuale inserita non è corretta.";
        } else if (error.code === 'auth/email-already-in-use') {
            erroreTradotto = "Questo indirizzo e-mail è già associato a un altro account.";
        } else if (error.code === 'auth/invalid-email') {
            erroreTradotto = "Il formato della nuova e-mail non è valido.";
        }
        
        alert("Errore: " + erroreTradotto);
    }
});