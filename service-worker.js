const CACHE = 'docentcat-v12-exercise-bank';
const ASSETS = [
  './styles.css','./app.js','./manifest.webmanifest','./curriculum-data.js','./data/curriculum-data.js','./exercise-bank.js','./data/exercise-bank.js','./icons/icon-192.png','./icons/icon-512.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('docentcat-') && k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;
  const req = event.request;
  const accept = req.headers.get('accept') || '';
  if(accept.includes('text/html')){
    event.respondWith(fetch(req).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(res => {
    const copy = res.clone();
    caches.open(CACHE).then(cache => cache.put(req, copy));
    return res;
  })));
});

// DocentCat v12 exercise bank + cache cleanup
