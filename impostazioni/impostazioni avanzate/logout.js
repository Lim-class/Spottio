// logout.js - Gestione esclusiva del logout dalla pagina profilo
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-link');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();

            if (window.auth) {
                window.auth.signOut().then(() => {
                    // Reindirizza al login dopo il logout
                    window.location.href = '../index.html';
                }).catch((error) => {
                    console.error('Errore durante il logout:', error);
                    alert('Errore: ' + error.message);
                });
            } else if (typeof firebase !== 'undefined' && firebase.auth) {
                firebase.auth().signOut().then(() => {
                    window.location.href = '../index.html';
                });
            } else {
                window.location.href = '../index.html';
            }
        });
    }
});