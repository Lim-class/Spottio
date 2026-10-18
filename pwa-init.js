// =========================================================================
// FILE: pwa-init.js - Gestione Aggiornamento PWA senza Loop
// =========================================================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Registrazione su URL fisso: Vercel gestisce l'aggiornamento tramite "no-cache"
        navigator.serviceWorker.register('/sw.js').then((registration) => {
            // Controlla se sul server è presente una nuova versione
            registration.update();

            registration.onupdatefound = () => {
                const installingWorker = registration.installing;
                if (!installingWorker) return;

                installingWorker.onstatechange = () => {
                    // Si attiva solo quando un nuovo worker sostituisce uno già esistente
                    if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        installingWorker.postMessage({ action: 'skipWaiting' });
                    }
                };
            };
        }).catch((err) => {
            console.warn('[PWA] Registrazione Service Worker non riuscita:', err);
        });

        // Esegue il refresh una sola volta per sessione quando cambia la versione
        let isRefreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!isRefreshing && !sessionStorage.getItem('pwa_refreshed')) {
                isRefreshing = true;
                sessionStorage.setItem('pwa_refreshed', 'true');
                window.location.reload();
            }
        });

        // Resetta il flag di sessione se la pagina è già stabile
        window.addEventListener('pageshow', () => {
            sessionStorage.removeItem('pwa_refreshed');
        });
    });
}
