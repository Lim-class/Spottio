// pwa-init.js - Configurazione globale PWA e Service Worker
(function() {
    // Calcola il percorso base della cartella radice del progetto
    const scripts = Array.from(document.querySelectorAll('script'));
    const currentScript = document.currentScript || scripts.find(s => s.src && s.src.includes('pwa-init.js'));
    const basePath = currentScript ? new URL('.', currentScript.src).href : new URL('.', window.location.href).href;

    // 1. Inietta Manifest e Meta Tag PWA se non presenti
    if (!document.querySelector('link[rel="manifest"]')) {
        const manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        manifestLink.href = new URL('manifest.json', basePath).href;
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

    // 2. Registrazione Service Worker con URL assoluto calcolato sulla root
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
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
