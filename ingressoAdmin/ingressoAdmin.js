// ingressoAdmin.js - Verifica dinamica e sicura dei privilegi Admin

async function gestisciAccessoAdmin() {
    const currentUid = localStorage.getItem('currentUid');
    const currentPath = window.location.pathname;

    // Se l'utente non è loggato, non può essere admin
    if (!currentUid || currentUid === "null") {
        localStorage.setItem('isAdmin', 'false');
        eseguiControlliNavigazione(false, currentPath);
        return;
    }

    // Attendi che l'istanza del database di Firebase sia pronta a schermo
    if (!window.db) {
        setTimeout(gestisciAccessoAdmin, 100);
        return;
    }

    try {
        // Interroga direttamente Firestore per leggere il valore REALE e aggiornato
        const userDoc = await window.db.collection("users").doc(currentUid).get();
        let dbIsAdmin = false;

        if (userDoc.exists) {
            const userData = userDoc.data();
            // Verifica lo stato admin (gestisce sia booleani che stringhe per sicurezza)
            dbIsAdmin = userData.isAdmin === true;
        }

        // Allinea istantaneamente la memoria locale con il Database reale
        localStorage.setItem('isAdmin', dbIsAdmin ? 'true' : 'false');
        console.log("Verifica Admin (DB Reale) - Valore sincronizzato:", dbIsAdmin);

        // Applica le restrizioni di sicurezza sulla UI
        eseguiControlliNavigazione(dbIsAdmin, currentPath);

    } catch (error) {
        console.error("Errore durante la verifica dei privilegi Admin dal DB:", error);
        // In caso di errore di rete, per sicurezza reindirizza l'utente se si trova in una pagina sensibile
        if (currentPath.includes('segnalazioni.html')) {
            window.location.href = 'pubblici.html';
        }
    }
}

// Gestione delle restrizioni visive e dei reindirizzamenti di sicurezza
function eseguiControlliNavigazione(isAdmin, currentPath) {
    // 1. Logica per la pagina Profilo (Mostra/Nasconde il pannello)
    if (currentPath.includes('profilo.html')) {
        const container = document.getElementById('admin-actions-container');
        if (container) {
            if (isAdmin) {
                container.classList.remove('hidden');
            } else {
                container.classList.add('hidden'); // Nasconde se il database è stato impostato su false
            }
        }
    }

    // 2. Logica di blocco per la pagina Segnalazioni
    if (currentPath.includes('segnalazioni.html')) {
        if (!isAdmin) {
            alert("Accesso negato: devi essere un Amministratore.");
            window.location.href = 'pubblici.html';
        }
    }
}

// Esegue al caricamento del DOM
document.addEventListener('DOMContentLoaded', gestisciAccessoAdmin);