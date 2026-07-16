const CACHE_NAME = "menu-cache-v9";
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
        // 구글 폰트 요청 여부 확인
        const isGoogleFont = event.request.url.includes('fonts.googleapis.com') || event.request.url.includes('fonts.gstatic.com');
        
        // 유효한 응답 판별 (구글 폰트는 opaque의 경우 status가 0으로 옴)
        const isValid = response && (response.status === 200 || (isGoogleFont && response.status === 0));
        if (!isValid) {
          return response;
        }

        // 캐시 가능한 타입 확인 (동일오리진: basic, 구글폰트 CDN: cors/opaque)
        const isAllowedType = response.type === 'basic' || response.type === 'cors' || (isGoogleFont && response.type === 'opaque');
        if (!isAllowedType) {
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
