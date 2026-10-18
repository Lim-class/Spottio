// =========================================================================
// FILE: pwa-init.js - Gestione Aggiornamento Automatico PWA / Service Worker
// =========================================================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Parametro timestamp per impedire al browser di conservare sw.js nella cache HTTP
        navigator.serviceWorker.register('/sw.js?v=' + Date.now()).then((registration) => {
            // Verifica subito aggiornamenti sul server
            registration.update();

            registration.onupdatefound = () => {
                const installingWorker = registration.installing;
                if (!installingWorker) return;

                installingWorker.onstatechange = () => {
                    if (installingWorker.state === 'installed') {
                        if (navigator.serviceWorker.controller) {
                            console.log('[PWA] Nuova versione rilevata. Aggiornamento in corso...');
                            installingWorker.postMessage({ action: 'skipWaiting' });
                        }
                    }
                };
            };
        }).catch((err) => {
            console.warn('[PWA] Registrazione Service Worker non riuscita:', err);
        });

        // Quando il nuovo worker subentra, esegue un refresh controllato
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
                refreshing = true;
                window.location.reload();
            }
        });
    });
}
