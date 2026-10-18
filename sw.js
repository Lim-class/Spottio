// =========================================================================
// FILE: sw.js - Service Worker Spottio
// Cache-First per asset locali statici con bypass per API e CDN esterne
// =========================================================================

const CACHE_NAME = 'spottio-cache-v15';

// Risorse statiche core locali da pre-caricare
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/pwa-init.js',
    '/impostazioni/body.css',
    '/chat/chat.css',
    '/Logo main-site/Logo_bis_me.jpg'
];

// Installazione: scarica gli asset essenziali
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS).catch((err) => {
                console.warn('[SW] Pre-caching parziale fallito:', err);
            });
        }).then(() => self.skipWaiting())
    );
});

// Attivazione: elimina tutte le versioni di cache obsolete e prende il controllo
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Ascolto messaggi inviati da pwa-init.js per forzare l'aggiornamento
self.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});

// Fetch: gestione mirata del traffico di rete
self.addEventListener('fetch', (event) => {
    const request = event.request;

    // 1. Non intercettare metodi diversi da GET (es. POST per /api/crypto, Firebase, ecc.)
    if (request.method !== 'GET') {
        return;
    }

    const url = new URL(request.url);

    // 2. Bypass totale per Serverless Function e rotte /api/
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // 3. Bypass totale per domini esterni (Firebase SDK, Firestore WebSockets, Google Fonts, FlagCDN, Cloudinary)
    // Permette al browser di contattare la rete direttamente prevenendo risposte 503 fittizie
    if (url.origin !== self.location.origin) {
        return;
    }

    // 4. File statici dello stesso dominio: Network First con fallback a Cache
    event.respondWith(
        fetch(request)
            .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                return caches.match(request);
            })
    );
});
