// =========================================================================
// FILE: sw.js - Service Worker completo e sicuro per Spottio PWA
// =========================================================================

const CACHE_NAME = 'spottio-v4';

// 1. Risorse statiche essenziali (relative per GitHub Pages e localhost)
const STATIC_ASSETS = [
    './',
    './index.html',
    './spot/spot.html',
    './spot/spot.css',
    './impostazioni/body.css',
    './pwa-init.js',
    './manifest.json'
];

// 2. Installazione: memorizza nella cache i file statici in modo sicuro
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            for (const asset of STATIC_ASSETS) {
                try {
                    await cache.add(asset);
                } catch (err) {
                    console.warn(`[ServiceWorker] Cache opzionale saltata per: ${asset}`);
                }
            }
        })
    );
});

// 3. Attivazione: elimina le versioni obsolete e prende il controllo immediato
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            )
        ).then(() => self.clients.claim())
    );
});

// 4. Intercettazione richieste di rete (Fetch)
self.addEventListener('fetch', (event) => {
    // Ignora sempre chiamate POST e chiamate alle API serverless
    if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
        return;
    }
    
    const req = event.request;
    const url = req.url;

    // REGOLA FONDAMENTALE 1: Solo ed esclusivamente richieste GET
    if (req.method !== 'GET') {
        return; // Lascia passare la richiesta direttamente alla rete senza intercettarla
    }

    // REGOLA FONDAMENTALE 2: Ignora schemi non HTTP/HTTPS (chrome-extension, blob, data)
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return;
    }

    // REGOLA FONDAMENTALE 3: Esclusioni critiche (Firebase, Firestore, Auth, Cloudinary, CDN pesanti)
    if (
        url.includes('firestore.googleapis.com') ||
        url.includes('identitytoolkit') ||
        url.includes('securetoken.googleapis.com') ||
        url.includes('google.firestore') ||
        url.includes('cloudinary') ||
        url.includes('cdn.tailwindcss.com') ||
        url.includes('unpkg.com')
    ) {
        return;
    }

    // Su localhost/sviluppo: Network-First trasparente (mai bloccare con 503)
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
        event.respondWith(
            fetch(req)
                .then((networkResponse) => {
                    // Mette in cache SOLO se la richiesta è ancora GET e la risposta è uno status 200 standard
                    if (req.method === 'GET' && networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                        const resClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(req, resClone).catch(() => {});
                        });
                    }
                    return networkResponse;
                })
                .catch(() => caches.match(req))
        );
        return;
    }

    // Strategia per Produzione: Network-First con fallback su Cache
    event.respondWith(
        fetch(req)
            .then((networkResponse) => {
                if (req.method === 'GET' && networkResponse && networkResponse.status === 200) {
                    const resClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(req, resClone).catch(() => {});
                    });
                }
                return networkResponse;
            })
            .catch(async () => {
                const cachedResponse = await caches.match(req);
                if (cachedResponse) {
                    return cachedResponse;
                }
                // Fallback sicuro su index.html per le navigazioni SPA, altrimenti risposta offline
                if (req.mode === 'navigate') {
                    return caches.match('./index.html') || caches.match('/');
                }
                return new Response('Offline', { 
                    status: 503, 
                    statusText: 'Service Unavailable (Offline)',
                    headers: { 'Content-Type': 'text/plain' }
                });
            })
    );
});