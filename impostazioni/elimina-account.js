// Questo file gestisce la logica per l'eliminazione dell'account utente.
document.addEventListener('DOMContentLoaded', () => {

    const deleteAccountBtn = document.getElementById('delete-account-btn');
    const deleteAccountModal = document.getElementById('delete-account-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

    // Funzione per mostrare il modale di conferma
    function showModal() {
        deleteAccountModal.classList.remove('hidden');
    }

    // Funzione per nascondere il modale di conferma
    function hideModal() {
        deleteAccountModal.classList.add('hidden');
    }

    // Aggiungi un gestore di eventi per il clic sul pulsante "Elimina il mio account"
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', (event) => {
            event.preventDefault();
            // Ottieni l'utente corrente dal localStorage
            const currentUser = localStorage.getItem('currentUser');
            if (currentUser === 'admin') {
                // Se l'utente è "admin", disabilita il pulsante e mostra un messaggio
                // Questo è già gestito dal CSS 'disabled' ma lo confermiamo qui
                alert('L\'account admin non può essere eliminato.');
                return;
            }
            showModal();
        });
    }

    // Aggiungi un gestore di eventi per il clic sul pulsante "Conferma Eliminazione"
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', () => {
            const currentUser = localStorage.getItem('currentUser');
            if (currentUser) {
                // Leggi tutti gli utenti dal localStorage
                const user = firebase.auth().currentUser;
if (user) {
    // 1. Elimina il documento da Firestore
    window.db.collection("users").doc(user.uid).delete().then(() => {
        // 2. Elimina l'utente da Firebase Auth
        return user.delete();
    }).then(() => {
        // 3. Pulisci il LocalStorage locale e reindirizza
        localStorage.clear();
        window.location.href = '../login/login.html';
    }).catch((error) => {
        console.error("Errore durante l'eliminazione:", error);
        alert("Per eliminare l'account devi aver effettuato l'accesso di recente. Prova a disconnetterti e accedere di nuovo.");
    });
}
            }
        });
    }

    // Aggiungi un gestore di eventi per il clic sul pulsante "Annulla"
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            hideModal();
        });
    }

    // Logica per disabilitare il pulsante "Elimina account" per l'admin
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser === 'admin') {
        deleteAccountBtn.disabled = true;
        deleteAccountBtn.classList.add('opacity-50', 'cursor-not-allowed');
        deleteAccountBtn.title = 'L\'account admin non può essere eliminato';
    }
});
