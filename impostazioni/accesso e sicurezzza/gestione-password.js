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
        
        // Pesca la traduzione
        const lang = localStorage.getItem('selectedLanguage') || 'it';
        const t = window.translations[lang] || window.translations['it'];
        alert(t.successPassword);
        
    } catch (error) {
        alert("Errore: " + error.message);
    }
});