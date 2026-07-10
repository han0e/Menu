const CACHE_NAME = "menu-cache-v2";
const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./logo2.png",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
];

// 설치 시 캐시 저장
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)),
  );
});

// 오프라인 상태일 때 캐시된 파일 제공 (Cache-First)
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request)),
  );
});

// 캐시 버전 변경 시 이전 캐시 삭제
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        }),
      );
    }),
  );
});
