
const CACHE_NAME = "smart-donation-connect-v1";

const FILES_TO_CACHE = [
    "/",
    "/static/css/style.css",
    "/static/css/auth.css",
    "/static/manifest.json"
];

self.addEventListener("install", function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(FILES_TO_CACHE).catch(function (error) {
                console.warn("Some files could not be cached:", error);
            });
        })
    );

    self.skipWaiting();
});

self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.map(function (cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );

    self.clients.claim();
});

self.addEventListener("fetch", function (event) {
    if (event.request.method !== "GET") {
        return;
    }

    const url = new URL(event.request.url);

    // Do not cache login, registration, or other dynamic requests.
    if (url.origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        fetch(event.request).catch(function () {
            return caches.match(event.request);
        })
    );
});

