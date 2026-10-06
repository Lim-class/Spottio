// sw.js - Service Worker completo per Spottio PWA
const CACHE_NAME = 'spottio-v3';

// 1. Risorse statiche essenziali con percorsi relativi (compatibili con GitHub Pages e localhost)
const STATIC_ASSETS = [
  './',
  './index.html',
  './spot/spot.html',
  './spot/spot.css',
  './impostazioni/body.css',
  './pwa-init.js',
  './manifest.json'
];

// 2. Installazione: memorizza nella cache i file statici di base in modo sicuro
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Salva ogni risorsa singolarmente per evitare che un singolo 404 rompa tutta l'installazione
      for (const asset of STATIC_ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn(`[ServiceWorker] Impossibile mettere in cache: ${asset}`, err);
        }
      }
    })
  );
  self.skipWaiting();
});

// 3. Attivazione: elimina le versioni obsolete della cache quando il file cambia
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
    )
  );
  self.clients.claim();
});

// 4. Intercettazione richieste di rete (Fetch)
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Esclusioni critiche: solo richieste HTTP GET
  // Ignora Firebase Firestore, Auth, Cloudinary e CDN esterne
  if (
    event.request.method !== 'GET' ||
    !url.startsWith('http') ||
    url.includes('cdn.tailwindcss.com') ||
    url.includes('unpkg.com') ||
    url.includes('firestore.googleapis.com') ||
    url.includes('identitytoolkit') ||
    url.includes('securetoken.googleapis.com') ||
    url.includes('cloudinary')
  ) {
    return;
  }

  // Strategia Network-First con fallback su cache
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        return new Response('', { 
          status: 503, 
          statusText: 'Service Unavailable (Offline)' 
        });
      })
  );
});
