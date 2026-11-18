// Network first, cache as fallback, for same-origin GET requests.
// shortcut: no precache list, so the app works offline only after one online visit;
// upgrade to a build-time precache manifest (roadmap) if first-visit offline matters.
const CACHE = "store-walk-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(async () => {
        const hit = (await caches.match(req)) ?? (req.mode === "navigate" ? await caches.match("/") : undefined);
        return hit ?? Response.error();
      }),
  );
});
