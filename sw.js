// BagaPlay (version web) : fonctionne hors ligne, et prend la dernière version dès qu'il y a du réseau.
const CACHE='bagaplay-5.15.0-20261116';
const FILES=["./","app.js","arcade.js","bagastore.js","battleship-engine.js","battleship.js","binero-engine.js","binero.js","breakout.js","urssaf.js","bubble.js","massilia.js","massilia-engine.js","massilia-data.js","bubble-engine.js","geo.js","cooker.js","cooker-engine.js","cooker-models.js","bagaworld.js","bagaworld-data.js","bagaworld-fight.js","bagaworld-char.js","bagaworld-world.js","bagaworld-models.js","leaflet.js","leaflet.css","urssaf-engine.js","urssaf-gl.js","urssaf-models.js","chess-ai.js","chess-engine.js","connect4-engine.js","cookie-engine.js","cookie-render.js","cookie.js","draughts-ai.js","draughts-engine.js","duel.js","engines.js","i18n.js","icon-180.png","icon-192.png","icon-512.png","icon.svg","index.html","manifest.webmanifest","online.js","petanque-engine.js","petanque.js","puzzles.js","pwa.js","rewards.js","runs.js","store-data.js","store-engine.js","store-gl.js","store-mall-models.js","store-models.js","store-roads.js","style.css","words-engine.js","words-fr.js","words.js"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 const url=new URL(e.request.url);
 if(e.request.method!=='GET'||url.origin!==location.origin)return; // le serveur de jeu en ligne n'est jamais mis en cache
 e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return r})
  .catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match('./index.html'))));
});
// Notifications : défi reçu, défi accepté, à toi de jouer. Toucher la notification ouvre la partie.
self.addEventListener('push',e=>{let d={};try{d=e.data?e.data.json():{}}catch{d={title:'BagaPlay',body:e.data?.text()||''}}
 e.waitUntil(self.registration.showNotification(d.title||'BagaPlay',{body:d.body||'',tag:d.tag||undefined,renotify:!!d.tag,icon:'icon-192.png',badge:'icon-192.png',data:{url:d.url||'./'}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const url=new URL(e.notification.data?.url||'./',self.registration.scope).href,q=new URL(url).searchParams,open=q.get('open'),play=q.get('play');
 e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{for(const c of list){if(c.url.startsWith(self.registration.scope)){c.focus();if(open)c.postMessage({open});else if(play)c.postMessage({play});return}}return self.clients.openWindow(url)}))});
