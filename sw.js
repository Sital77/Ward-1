/**
 * sw.js — Gauradaha Ward 1 Offline Service Worker (PWA)
 * Enables complete offline operation when ward internet is disconnected.
 */

const CACHE_NAME = 'gauradaha-ward1-v2.5';

const STATIC_ASSETS = [
    './',
    './index.html',
    './citizen-search.html',
    './recycle-bin.html',
    './login.html',
    './yojana-bank-sifarish.html',
    './charkilla.css',
    './gharbato.css',
    './style.css',
    './admin-dashboard.css',
    './auth.js?v=2.5',
    './backup-manager.js',
    './assets/emblem_of_nepal.svg',
    './manifest.json'
];

// Install: pre-cache critical shell assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[SW] Pre-caching static assets for offline use...');
            return cache.addAll(STATIC_ASSETS).catch(err => {
                console.warn('[SW] Pre-cache warning:', err);
            });
        }).then(() => self.skipWaiting())
    );
});

// Activate: clean up older caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: Stale-while-revalidate / Cache-first with Network Fallback
self.addEventListener('fetch', event => {
    const request = event.request;

    // Do not cache Firestore / Firebase Auth / external Google API calls directly via SW (handled by Firebase Persistence)
    if (request.url.includes('firestore.googleapis.com') ||
        request.url.includes('firebaseinstallations.googleapis.com') ||
        request.url.includes('identitytoolkit.googleapis.com') ||
        request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
                // Fetch updated version in background to update cache (Stale-while-revalidate)
                fetch(request).then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, networkResponse.clone());
                        });
                    }
                }).catch(() => {});
                return cachedResponse;
            }

            // If not in cache, fetch from network and store in cache
            return fetch(request).then(networkResponse => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(request, responseToCache);
                });
                return networkResponse;
            }).catch(() => {
                // If offline and request is for HTML page, fallback to index.html
                if (request.headers.get('accept') && request.headers.get('accept').includes('text/html')) {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
