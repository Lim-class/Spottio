// =========================================================================
// FILE: core/load-firebase.js
// Caricamento sincrono garantito di Vue 3, PWA e Firebase SDK compat
// =========================================================================

// Protezione immediata anti-ispezione e DevTools
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    document.write('<script src="../shared/js/spottio-anti-inspect.js"><\/script>');
}
// 1. Core Runtime: Vue 3 (Production Build per evitare il warning in console) e PWA
document.write('<script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"><\/script>');
document.write('<script src="../pwa-init.js"><\/script>');

// 2. Firebase SDK compat
document.write('<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"><\/script>');
document.write('<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"><\/script>');
document.write('<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"><\/script>');
document.write('<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-storage-compat.js"><\/script>');

// 3. Configurazione e inizializzazione immediata dell'app Firebase
document.write('<script src="../core/firebase-config.js"><\/script>');

// 4. Standardizzazione istanze globali
document.write(`
<script>
    (function() {
        var setupInstances = function() {
            if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
                window.db = window.db || firebase.firestore();
                window.auth = window.auth || firebase.auth();
                window.storage = window.storage || firebase.storage();
            }
        };
        setupInstances();
        window.addEventListener('DOMContentLoaded', setupInstances);
    })();
<\/script>
`);