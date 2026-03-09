// load-firebase.js

// Caricamento sincrono degli SDK di Firebase (Versione 10.7.1 Compat)
document.write('<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"><\/script>');
document.write('<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"><\/script>');
document.write('<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"><\/script>');
document.write('<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-storage-compat.js"><\/script>');

// Opzionale: Se il file firebase-config.js è lo stesso per tutte le pagine, 
// puoi decommentare la riga qui sotto per includere anche la configurazione.
// document.write('<script src="firebase-config.js"><\/script>');