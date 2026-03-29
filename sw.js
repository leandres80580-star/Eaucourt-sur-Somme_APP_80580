// ── Service Worker — Eaucourt Connect PWA ──
// Cache l'app pour une utilisation hors ligne partielle

const CACHE_NAME = 'eaucourt-v1';
const BASE = '/Eaucourt-sur-Somme_APP_80580';

// Fichiers à mettre en cache immédiatement
const PRECACHE = [
  BASE + '/',
  BASE + '/index.html',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap',
];

// ── Installation : mise en cache initiale
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ── Activation : nettoyage des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Stratégie : Network First (données toujours fraîches)
//    Si pas de réseau → cache (affiche l'app même hors ligne)
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Ignorer les requêtes Supabase (toujours en ligne)
  if (url.hostname.includes('supabase.co')) return;

  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Mettre en cache la réponse fraîche
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Pas de réseau → servir depuis le cache
        return caches.match(event.request)
          .then(cached => cached || caches.match(BASE + '/index.html'));
      })
  );
});
