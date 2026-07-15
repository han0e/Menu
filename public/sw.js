const CACHE_NAME = "menu-cache-v8";
const urlsToCache = [
  "./",
  "./index.html",
  "./logo2.png",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
];

// 설치 시 캐시 저장
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)),
  );
});

// 오프라인 상태일 때 캐시된 파일 제공 및 새로운 요청 동적 캐싱
self.addEventListener("fetch", (event) => {
  // HTTP(S) 요청만 캐싱 시도 (chrome-extension 등 제외)
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        // 유효한 응답만 캐시
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          if (event.request.method === "GET") {
            cache.put(event.request, responseToCache);
          }
        });
        return response;
      });
    })
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
    }).then(() => self.clients.claim())
  );
});
