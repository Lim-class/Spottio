// reports.js

// Funzione per salvare le segnalazioni nel localStorage
function saveReport(report) {
    const reports = JSON.parse(localStorage.getItem('reports')) || [];
    reports.unshift(report);
    localStorage.setItem('reports', JSON.stringify(reports));
}

// Funzione per mostrare un messaggio personalizzato
function displayMessage(message, type) {
    const statusMessage = document.getElementById('status-message');
    if (statusMessage) {
        statusMessage.textContent = message;
        if (type === 'success') {
            statusMessage.className = 'mt-4 text-green-600 font-medium';
        } else if (type === 'error') {
            statusMessage.className = 'mt-4 text-red-600 font-medium';
        } else {
            statusMessage.className = 'mt-4 text-gray-600 font-medium';
        }
        statusMessage.style.display = 'block';
    }
}

// Funzione per gestire la segnalazione di un post
function reportPost(postIndex) {
    const posts = JSON.parse(localStorage.getItem('publicPosts')) || [];
    const reportedPost = posts[postIndex];

    if (!reportedPost) {
        displayMessage('Errore: Post non trovato.', 'error');
        return;
    }

    const reportModal = document.getElementById('report-modal');
    const reportForm = document.getElementById('report-form');
    const reportedPostIndexInput = document.getElementById('reported-post-index');
    
    // Imposta l'indice del post da segnalare nel campo nascosto del form
    reportedPostIndexInput.value = postIndex;

    // Mostra il modale
    reportModal.classList.add('open');

    // Gestione del submit del form
    reportForm.onsubmit = (event) => {
        event.preventDefault();
        
        const reportReason = document.getElementById('report-reason').value;
        const reportDescription = document.getElementById('report-description').value.trim();
        const currentUser = localStorage.getItem('currentUser') || 'Ospite';

        const report = {
            reporter: currentUser,
            reportedUser: reportedPost.username,
            postText: reportedPost.text,
            reason: reportReason,
            description: reportDescription,
            timestamp: new Date().toISOString()
        };

        saveReport(report);
        
        // Chiudi il modale e mostra un messaggio di successo
        reportModal.classList.remove('open');
        displayMessage('Segnalazione inviata con successo. Grazie per il tuo contributo!', 'success');
        
        // Resetta il form per la prossima segnalazione
        reportForm.reset();
    };

    // Gestione del pulsante di annullamento
    document.getElementById('cancel-report').onclick = () => {
        reportModal.classList.remove('open');
        reportForm.reset();
    };
}
