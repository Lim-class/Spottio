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

    if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Calcola il percorso base determinando dove si trova pwa-init.js o la root del progetto
        const currentScript = document.currentScript || Array.from(document.querySelectorAll('script')).find(s => s.src && s.src.includes('pwa-init.js'));
        const basePath = currentScript ? new URL('.', currentScript.src).href : '/';
        const swUrl = new URL('sw.js', basePath).href;

        navigator.serviceWorker.register(swUrl)
            .then(reg => {
                console.log('Service Worker registrato con successo:', reg.scope);
            })
            .catch(err => {
                console.warn('Registrazione Service Worker fallita:', err);
            });
    });
}
})();