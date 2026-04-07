// ingressoAdmin.js

function gestisciAccessoAdmin() {
    const isAdmin = localStorage.getItem('isAdmin');
    const currentPath = window.location.pathname;

    console.log("Verifica Admin - Valore trovato:", isAdmin);

    // 1. Logica per la pagina Profilo
    if (currentPath.includes('profilo.html')) {
        const container = document.getElementById('admin-actions-container');
        if ((isAdmin === 'true') && container) {
            container.classList.remove('hidden');
        }
    }

    // 2. Logica per la pagina Segnalazioni
    if (currentPath.includes('segnalazioni.html')) {
        // Rimuoviamo il controllo document.referrer perché troppo instabile.
        // Ci fidiamo del flag isAdmin (la sicurezza vera sarà su Firestore Rules).
        
        if (isAdmin !== 'true') {
            alert("Accesso negato: devi essere un Amministratore.");
            window.location.href = 'pubblici.html';
        }
    }
}

// Esegue al caricamento del DOM
document.addEventListener('DOMContentLoaded', gestisciAccessoAdmin);