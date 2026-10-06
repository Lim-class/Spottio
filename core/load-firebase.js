// load-firebase.js - Caricamento e Standardizzazione SDK Firebase compat, Vue 3 e PWA

// 1. Core Runtime: Vue 3 e Inizializzazione PWA
document.write('<script src="https://unpkg.com/vue@3/dist/vue.global.js"><\/script>');
document.write('<script src="../pwa-init.js"><\/script>');

// 2. Firebase SDK compat
document.write('<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"><\/script>');
document.write('<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"><\/script>');
document.write('<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"><\/script>');
document.write('<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-storage-compat.js"><\/script>');

// File di configurazione dell'app
document.write('<script src="../core/firebase-config.js"><\/script>');

// Inizializzazione e standardizzazione istanze globali Firebase
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