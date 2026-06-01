// logout.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Logica originaria di logout.js ---
    const logoutLink = document.getElementById('logout-link');

    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault(); // Impedisce il caricamento immediato della pagina

            // Verifica che Firebase Auth sia disponibile
            if (typeof firebase !== 'undefined' && firebase.auth) {
                firebase.auth().signOut().then(() => {
                    console.log('Utente disconnesso con successo');
                    // Reindirizza al login dopo il logout
                    window.location.href = 'index.html';
                }).catch((error) => {
                    console.error('Errore durante il logout:', error);
                    alert('Errore: ' + error.message);
                });
            } else {
                console.warn("Modulo Firebase Auth non trovato. Forzo il reindirizzamento.");
                // Se Firebase non risponde, rimanda comunque al login per sicurezza
                window.location.href = 'index.html';
            }
        });
    }

    // --- Logica integrata da footer-nav.js ---
    const sidebar = document.getElementById('sidebar-container');
    if (sidebar) {
        // Notifica agli altri script che il footer/sidebar è pronto
        document.dispatchEvent(new Event('footer-loaded'));
    }
});