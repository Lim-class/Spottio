// Funzione per mostrare i link admin
function mostraElementiAdmin() {
    const currentUser = localStorage.getItem('currentUser');
    
    if (currentUser === 'admin') {
        const adminLink = document.getElementById('admin-link');
        const adminSegnalazioni = document.getElementById('admin-link-segnalazioni');

        if (adminLink) {
            adminLink.classList.remove('hidden');
        }
        if (adminSegnalazioni) {
            adminSegnalazioni.classList.remove('hidden');
        }
    } else {
        // Opzionale: Protezione della pagina segnalazioni.html
        // Se l'utente non è admin e si trova sulla pagina segnalazioni, lo espelle.
        if (window.location.pathname.includes('segnalazioni.html')) {
            window.location.href = 'pubblici.html'; 
        }
    }
}

// Utilizziamo addEventListener per evitare conflitti con altri script
window.addEventListener('load', mostraElementiAdmin);

// Se il menu viene caricato dinamicamente via AJAX o dopo il load, 
// potresti voler chiamare la funzione anche dopo un piccolo delay
setTimeout(mostraElementiAdmin, 500);