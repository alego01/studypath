const CACHE = 'studypath-v1';
const STATIC = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/config.js',
  './js/env.js',
  './js/core/quiz.js',
  './js/core/profile.js',
  './js/core/plan.js',
  './js/adapters/ai/GroqAdapter.js',
  './js/adapters/ai/GeminiAdapter.js',
  './js/adapters/ai/OpenAIAdapter.js',
  './js/adapters/ai/PlanValidator.js',
  './js/adapters/storage/DriveAdapter.js',
  './js/adapters/utils/jsonUtils.js',
  './js/ports/IAIPort.js',
  './js/ports/IStoragePort.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(STATIC))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Solo cachear requests GET del mismo origen
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      });
      return cached || network;
    })
  );
});
