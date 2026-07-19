// reports.js - Gestione invio segnalazioni a Firestore

function displayMessage(message, type) {
    let statusMessage = document.getElementById('status-message');
    // Crea il div del messaggio se non esiste nel modale
    if (!statusMessage) {
        const form = document.getElementById('report-form');
        statusMessage = document.createElement('div');
        statusMessage.id = 'status-message';
        form.prepend(statusMessage);
    }

    statusMessage.textContent = message;
    if (type === 'success') {
        statusMessage.className = 'mb-4 p-3 bg-green-100 text-green-700 rounded-lg font-medium text-sm';
    } else if (type === 'error') {
        statusMessage.className = 'mb-4 p-3 bg-red-100 text-red-700 rounded-lg font-medium text-sm';
    } else {
        statusMessage.className = 'mb-4 p-3 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm';
    }
    statusMessage.style.display = 'block';
    
    // Nascondi dopo 4 secondi
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 4000);
}

// Funzione globale chiamata dal pulsante sul singolo post
window.reportPost = function(postId, authorName, postText) {
    const reportModal = document.getElementById('report-modal');
    const reportForm = document.getElementById('report-form');
    
    // Mostra il modale
    reportModal.classList.add('open');
    reportModal.classList.remove('hidden');

    // Gestione del submit
    reportForm.onsubmit = async (event) => {
        event.preventDefault();
        
        // Disabilita il pulsante durante il caricamento per evitare doppi click
        const submitBtn = reportForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        const reportReason = document.getElementById('report-reason').value;
        const reportDescription = document.getElementById('report-description').value.trim();
        
        // --- FIX: Recuperiamo il VERO nome utente dal Database tramite UID ---
        const currentUid = localStorage.getItem('currentUid');
        let reporterUsername = 'Ospite';

        if (currentUid && currentUid !== "null" && window.db) {
            try {
                const userDoc = await window.db.collection("users").doc(currentUid).get();
                if (userDoc.exists && userDoc.data().username) {
                    reporterUsername = userDoc.data().username; // VERO nome sincronizzato
                }
            } catch (err) {
                console.error("Errore recupero nome utente per segnalazione:", err);
            }
        }

        const report = {
            postId: postId,
            reporterUser: reporterUsername, // Usiamo il nome garantito dal DB
            reporterUid: currentUid || "guest", // Novità: Salviamo anche l'UID per sicurezza estrema
            postAuthor: authorName,   
            postText: postText,
            reason: reportReason,
            description: reportDescription,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await window.db.collection("reports").add(report);
            
            reportModal.classList.remove('open');
            reportModal.classList.add('hidden');
            alert('Segnalazione inviata con successo. Grazie per il tuo contributo!');
            reportForm.reset();
        } catch (error) {
            console.error("Errore invio segnalazione: ", error);
            alert('Errore durante l\'invio della segnalazione.');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    };

    // Annullamento
    document.getElementById('cancel-report').onclick = () => {
        reportModal.classList.remove('open');
        reportModal.classList.add('hidden');
        reportForm.reset();
    };
};