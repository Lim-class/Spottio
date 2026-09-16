// sw.js - Service Worker completo per Spottio PWA
const CACHE_NAME = 'spottio-v2';

// 1. Risorse statiche essenziali dell'applicazione (App Shell)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/spot/spot.html',
  '/spot/spot.css',
  '/impostazioni/body.css',
  '/pwa-init.js',
  '/manifest.json'
];

// 2. Installazione: memorizza nella cache i file statici di base
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
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

  // Esclusioni critiche: solo richieste HTTP GET locali
  // Ignora Firebase Firestore, Auth, Cloudinary e CDN terze per evitare blocchi CORS o dati non aggiornati
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

  // Strategia Network-First con fallback protetto su cache e Response fittizia
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Se la rete risponde correttamente, aggiorna la cache in background
        if (networkResponse && networkResponse.status === 200) {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        }
        return networkResponse;
      })
      .catch(async () => {
        // Se la rete fallisce (es. utente offline o connessione instabile), cerca nella cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // Se la risorsa non esiste nemmeno in cache, restituisce una Response valida per non rompere il browser
        return new Response('', { 
          status: 503, 
          statusText: 'Service Unavailable (Offline)' 
        });
      })
  );
});