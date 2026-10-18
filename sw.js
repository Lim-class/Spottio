// =========================================================================
// FILE: sw.js - Service Worker Spottio
// Cache-First per asset locali statici con bypass per API e CDN esterne
// =========================================================================

const CACHE_NAME = 'spottio-cache-v14';

// Risorse statiche core dello stesso dominio da pre-caricare
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/pwa-init.js',
    '/impostazioni/body.css',
    '/chat/chat.css',
    '/Logo main-site/Logo_bis_me.jpg'
];

// Installazione: memorizza nella cache gli asset essenziali locali
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS).catch((err) => {
                console.warn('[SW] Pre-caching parziale fallito:', err);
            });
        }).then(() => self.skipWaiting())
    );
});

// Attivazione: elimina le vecchie cache non più allineate
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

// Fetch: gestione mirata del traffico di rete
self.addEventListener('fetch', (event) => {
    const request = event.request;

    // 1. Ignora qualsiasi metodo diverso da GET (POST per /api/crypto, Firestore, ecc.)
    if (request.method !== 'GET') {
        return;
    }

    const url = new URL(request.url);

    // 2. Bypass totale per la Serverless Function e le chiamate API interne
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // 3. Bypass totale per domini esterni (Firebase SDK, Firestore WebSockets, Google Fonts, Cloudinary, FlagCDN)
    // Lascia che il browser contatti direttamente la rete senza rischiare 503 fittizi
    if (url.origin !== self.location.origin) {
        return;
    }

    // 4. Per i file statici dello stesso dominio: Network First con fallback a Cache
    event.respondWith(
        fetch(request)
            .then((networkResponse) => {
                // Se la risposta è valida, aggiorna la cache in background
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // In assenza di connessione usa la copia salvata in cache
                return caches.match(request);
            })
    );
});
