document.getElementById('update-pass-btn').addEventListener('click', async () => {
    const oldPass = document.getElementById('old-pass').value;
    const newPass = document.getElementById('new-pass').value;
    const user = window.auth.currentUser;

    // 1. Re-autenticazione
    const cred = firebase.auth.EmailAuthProvider.credential(user.email, oldPass);
    
    try {
        await user.reauthenticateWithCredential(cred);
        // 2. Aggiornamento
        await user.updatePassword(newPass);
        alert("Password aggiornata con successo!");
    } catch (error) {
        alert("Errore: " + error.message);
    }
});