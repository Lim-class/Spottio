// reports-page.js

// Lista di parole offensive in varie lingue
const badWords = [
    'cazzo', 'merda', 'vaffanculo', 'puttana', 'stronzo', 'deficiente', 'idiota',
    'fuck', 'shit', 'asshole', 'bitch', 'damn', 'bastard', 'cunt',
    'putain', 'merde', 'connard', 'salope', 'bâtard',
    'joder', 'puta', 'cabrón', 'gilipollas',
    'scheiße', 'arschloch', 'hure', 'verdammt'
];

// Funzione per controllare se un testo contiene parolacce
function containsBadWords(text) {
    if (!text) return false;
    const lowerCaseText = text.toLowerCase();
    return badWords.some(word => lowerCaseText.includes(word));
}

// Funzione per caricare e visualizzare le segnalazioni
function loadReports() {
    const reportsContainer = document.getElementById('reports-container');
    const reportsCountElement = document.getElementById('reports-count');
    const deleteAllButton = document.getElementById('delete-all-reports');
    
    if (!reportsContainer) return; // Esce se non siamo sulla pagina corretta

    const reports = JSON.parse(localStorage.getItem('reports')) || [];
    reportsContainer.innerHTML = '';
    
    // Aggiorna il contatore
    reportsCountElement.textContent = reports.length;

    // Mostra il pulsante di eliminazione totale solo se l'utente è admin
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser === 'admin' && reports.length > 0) {
        deleteAllButton.classList.remove('hidden');
    } else {
        deleteAllButton.classList.add('hidden');
    }
    
    if (reports.length === 0) {
        reportsContainer.innerHTML = `
            <p class="text-gray-500 text-center text-lg">Nessuna segnalazione trovata.</p>
        `;
        return;
    }

    reports.forEach((report, index) => {
        const reportElement = document.createElement('div');
        reportElement.className = 'bg-white p-6 rounded-xl shadow-md border border-red-200';
        reportElement.innerHTML = `
            <h4 class="font-bold text-lg text-gray-800">Segnalazione #${reports.length - index}</h4>
            <p class="text-sm text-gray-500 mt-1">Data: ${new Date(report.timestamp).toLocaleString('it-IT')}</p>
            <div class="text-gray-700 mt-4">
                <strong>Autore della segnalazione:</strong> ${report.reporter}<br>
                <strong>Utente segnalato:</strong> ${report.reportedUser}<br>
                <strong>Motivo:</strong> ${report.reason.replace(/-/g, ' ')}<br>
                <strong>Contenuto del post:</strong> "${report.postText}"
            </div>
            ${report.description ? `<p class="text-gray-700 mt-2"><strong>Descrizione:</strong> ${report.description}</p>` : ''}
            <div class="mt-4 flex justify-end space-x-2">
                ${currentUser === 'admin' ? `
                    <button onclick="deletePostFromPublics('${report.reportedUser}', '${report.postText}')" class="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition duration-200">Elimina Post</button>
                    <button onclick="deleteReport(${index})" class="bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition duration-200">Rimuovi Segnalazione</button>
                ` : ''}
            </div>
        `;
        reportsContainer.appendChild(reportElement);
    });
}

// Funzione per eliminare una singola segnalazione
function deleteReport(index) {
    let reports = JSON.parse(localStorage.getItem('reports')) || [];
    reports.splice(index, 1);
    localStorage.setItem('reports', JSON.stringify(reports));
    loadReports(); // Ricarica la lista
}

// Funzione per eliminare tutte le segnalazioni (solo per admin)
function deleteAllReports() {
    localStorage.removeItem('reports');
    loadReports();
}

// Funzione per eliminare il post da pubblici.html
function deletePostFromPublics(username, postText) {
    let publicPosts = JSON.parse(localStorage.getItem('publicPosts')) || [];
    const initialLength = publicPosts.length;
    
    // Filtra i post, mantenendo solo quelli che non corrispondono al post da eliminare
    publicPosts = publicPosts.filter(post => post.username !== username || post.text !== postText);

    if (publicPosts.length < initialLength) {
        localStorage.setItem('publicPosts', JSON.stringify(publicPosts));
        // Non usare alert(), mostra un messaggio in un altro modo
        console.log('Post eliminato con successo da Pubblici.html!');
    } else {
        console.log('Post non trovato o già eliminato.');
    }
}

// Aggiungi un event listener per il pulsante di eliminazione totale
document.addEventListener('DOMContentLoaded', () => {
    const deleteAllButton = document.getElementById('delete-all-reports');
    if (deleteAllButton) {
        deleteAllButton.addEventListener('click', () => {
            if (confirm("Sei sicuro di voler eliminare tutte le segnalazioni? Questa azione è irreversibile.")) {
                deleteAllReports();
            }
        });
    }

    // Carica le segnalazioni quando la pagina è pronta
    loadReports();
});
