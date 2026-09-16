// pwa-init.js - Configurazione globale PWA e Service Worker
(function() {
    // 1. Inietta Manifest e Meta Tag PWA se non presenti
    if (!document.querySelector('link[rel="manifest"]')) {
        const manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        manifestLink.href = '/manifest.json';
        document.head.appendChild(manifestLink);

        const themeColor = document.createElement('meta');
        themeColor.name = 'theme-color';
        themeColor.content = '#ffffff';
        document.head.appendChild(themeColor);

        const appleMobile = document.createElement('meta');
        appleMobile.name = 'apple-mobile-web-app-capable';
        appleMobile.content = 'yes';
        document.head.appendChild(appleMobile);

        const appleStatus = document.createElement('meta');
        appleStatus.name = 'apple-mobile-web-app-status-bar-style';
        appleStatus.content = 'default';
        document.head.appendChild(appleStatus);

        const appleTouchIcon = document.createElement('link');
        appleTouchIcon.rel = 'apple-touch-icon';
        appleTouchIcon.href = 'https://i.ibb.co/b5HgvzCB/Spottio-Logo-2.png';
        document.head.appendChild(appleTouchIcon);
    }

    // 2. Registra il Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then((reg) => console.log('Spottio PWA pronta su:', reg.scope))
                .catch((err) => console.warn('Errore registrazione PWA:', err));
        });
    }
})();