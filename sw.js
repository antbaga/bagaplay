// BagaPlay (version web) : fonctionne hors ligne, et prend la dernière version dès qu'il y a du réseau.
const CACHE='bagaplay-202611021809';
const FILES=["./","app.js","arcade.js","breakout.js","chess-engine.js","cookie-engine.js","cookie-render.js","cookie.js","draughts-ai.js","draughts-engine.js","duel.js","engines.js","i18n.js","icon-180.png","icon-192.png","icon-512.png","icon.svg","index.html","manifest.webmanifest","online.js","puzzles.js","pwa.js","rewards.js","style.css"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 const url=new URL(e.request.url);
 if(e.request.method!=='GET'||url.origin!==location.origin)return; // le serveur de jeu en ligne n'est jamais mis en cache
 e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return r})
  .catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match('./index.html'))));
});
