// Setrise NSE service worker: app shell works offline. Data is cached by the app itself.
const VERSION = 'sn-v18';
const SHELL = ['./', 'index.html', 'app.css', 'app.js', 'i18n.js', 'legal.js', 'config.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/favicon.png', 'icons/splash-arrow.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Never cache the data feed (it carries the access key); the app keeps its own last copy.
  if (url.origin !== self.location.origin) {
    if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {       // fonts: stale-while-revalidate
      e.respondWith(caches.open(VERSION).then(function (c) {
        return c.match(req).then(function (hit) {
          const net = fetch(req).then(function (r) { c.put(req, r.clone()); return r; }).catch(function () { return hit; });
          return hit || net;
        });
      }));
    }
    return;
  }
  // Same-origin: network first (so updates arrive), fall back to cache offline.
  e.respondWith(fetch(req).then(function (r) {
    const copy = r.clone();
    caches.open(VERSION).then(function (c) { c.put(req, copy); });
    return r;
  }).catch(function () {
    return caches.match(req).then(function (hit) { return hit || caches.match('index.html'); });
  }));
});
