// Carnet de salle : fonctionne hors ligne à la salle, et récupère les mises à jour dès qu'il y a du réseau.
const CACHE = "carnet-salle-v1";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // La page : réseau d'abord (pour avoir la dernière version du programme), cache si pas de réseau
  if (req.mode === "navigate" || (url.origin === location.origin && url.pathname.endsWith("/index.html"))) {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put("./index.html", cp)); return r; })
      .catch(() => caches.match("./index.html")));
    return;
  }
  // Le reste (icônes, polices) : cache d'abord
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok && (url.origin === location.origin || /(^|\.)(gstatic|googleapis)\.com$/.test(url.hostname))) {
      const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp));
    }
    return r;
  })));
});
