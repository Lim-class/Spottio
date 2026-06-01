// reports-page.js - Lettura e gestione segnalazioni da Firestore (Sincronizzato con App Mobile)

function loadReports() {
    const reportsContainer = document.getElementById('reports-container');
    const reportsCountElement = document.getElementById('reports-count');
    const deleteAllButton = document.getElementById('delete-all-reports');
    
    if (!reportsContainer || !window.db) return;

    const currentUser = localStorage.getItem('currentUser');
    if (currentUser !== 'admin') {
        reportsContainer.innerHTML = '<p class="text-red-500 text-center text-lg font-bold mt-10">Accesso negato. Solo gli amministratorori possono vedere questa pagina.</p>';
        if(deleteAllButton) deleteAllButton.classList.add('hidden');
        return;
    }

    // Caricamento live delle segnalazioni da Firestore
    window.db.collection("reports").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
        reportsContainer.innerHTML = '';
        
        if(reportsCountElement) reportsCountElement.textContent = snapshot.size;

        if (snapshot.empty) {
            reportsContainer.innerHTML = '<p class="text-gray-500 text-center text-lg mt-10">Nessuna segnalazione trovata.</p>';
            if(deleteAllButton) deleteAllButton.classList.add('hidden');
            return;
        }

        if(deleteAllButton) deleteAllButton.classList.remove('hidden');

        snapshot.forEach((doc) => {
            const report = doc.data();
            const reportId = doc.id;
            
            // Gestione data: il timestamp dall'app mobile è un numero in millisecondi
            let dateObj = new Date();
            if (report.timestamp) {
                dateObj = typeof report.timestamp === 'number' ? new Date(report.timestamp) : report.timestamp.toDate();
            }
            
            const reportElement = document.createElement('div');
            reportElement.className = 'bg-white p-6 rounded-xl shadow-md border border-red-200 mb-4';
            // Dentro reports-page.js, modifica il reportElement.innerHTML:
reportElement.innerHTML = `
    <div class="flex justify-between items-start">
        <h4 class="font-bold text-lg text-gray-800">Segnalazione</h4>
        <span class="text-xs font-semibold bg-red-100 text-red-800 px-2 py-1 rounded">${(report.reason || 'Sconosciuto').toUpperCase()}</span>
    </div>
    <p class="text-sm text-gray-500 mt-1">Data: ${dateObj.toLocaleString('it-IT')}</p>
    
    <div class="bg-gray-50 p-4 rounded-lg mt-4 text-sm border border-gray-100">
        <p class="mb-2"><strong>Segnalato da:</strong> <span class="text-blue-600">${report.reporterUser || 'Sconosciuto'}</span></p>
        <p class="mb-2"><strong>Autore del Post:</strong> <span class="text-red-600">${report.postAuthor || 'Sconosciuto'}</span></p>
        <div class="mt-2 p-2 bg-white border rounded italic text-gray-600">
            "${report.postText || 'Testo non disponibile'}"
        </div>
        <p class="mt-3 text-gray-500 font-mono text-[10px] border-t border-gray-200 pt-2">ID Post: ${report.postId}</p>
    </div>
    
    <div class="mt-5 flex flex-wrap gap-2 justify-end">
        <button onclick="deletePostFromFirestore('${report.postId}', '${reportId}')" class="bg-red-500 text-white text-sm font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition shadow-sm">Elimina Post</button>
        <button onclick="deleteReportFromFirestore('${reportId}')" class="bg-gray-500 text-white text-sm font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition shadow-sm">Scarta</button>
    </div>
`;
            reportsContainer.appendChild(reportElement);
        });
    });
}

// Elimina solo la segnalazione
window.deleteReportFromFirestore = function(reportId) {
    if(confirm("Vuoi scartare e rimuovere questa segnalazione?")) {
        window.db.collection("reports").doc(reportId).delete().catch(err => alert("Errore: " + err.message));
    }
};

// Elimina sia il post che la segnalazione associata
window.deletePostFromFirestore = function(postId, reportId) {
    if(confirm("Sei sicuro di voler ELIMINARE DEFINITIVAMENTE il post segnalato? L'azione non è reversibile.")) {
        // 1. Elimina il post originale
        window.db.collection("posts").doc(postId).delete().then(() => {
            // 2. Elimina la segnalazione
            window.db.collection("reports").doc(reportId).delete();
            alert("Post e segnalazione eliminati con successo.");
        }).catch(err => {
            console.error("Errore eliminazione:", err);
            alert("Impossibile eliminare il post. Potrebbe essere già stato eliminato.");
        });
    }
};

// Elimina in blocco
window.deleteAllReports = async function() {
    if(!confirm("Sei sicuro di voler eliminare TUTTE le segnalazioni in blocco? (I post originali NON verranno toccati).")) return;
    
    try {
        const snapshot = await window.db.collection("reports").get();
        const batch = window.db.batch();
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        alert("Tutte le segnalazioni sono state eliminate.");
    } catch(err) {
        alert("Errore durante l'eliminazione di massa: " + err.message);
    }
};

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    const deleteAllButton = document.getElementById('delete-all-reports');
    if (deleteAllButton) {
        deleteAllButton.addEventListener('click', window.deleteAllReports);
    }

    // Aspetta che db sia inizializzato prima di caricare
    const checkDb = setInterval(() => {
        if (window.db) {
            clearInterval(checkDb);
            loadReports();
        }
    }, 500);
});