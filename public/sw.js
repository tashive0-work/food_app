// 이 파일은 이전에 등록된 Service Worker 를 제거하기 위한 것입니다.
// 캐시를 모두 비우고 자기 자신의 등록을 해제한 뒤,
// 열려 있는 모든 탭을 새로고침합니다.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((c) => c.navigate(c.url));
    })()
  );
});

// fetch 를 가로채지 않고 항상 네트워크로 통과시킵니다.
self.addEventListener("fetch", () => {});
