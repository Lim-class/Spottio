// Configurazione Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAx_wHQ_K_B0lUSLUQLNupdX8krn0iiHtA",
    authDomain: "spottio-1419e.firebaseapp.com",
    projectId: "spottio-1419e",
    storageBucket: "spottio-1419e.firebasestorage.app",
};

// Inizializza solo se non esiste già
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Esponi le istanze globalmente per gli altri script
window.db = firebase.firestore();
window.storage = firebase.storage();