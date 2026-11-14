// BagaGuesser : une galerie de photos à localiser, ouverte en permanence (pas de parties à lancer).
// Ajouter : photo prise avec la caméra de l'app (pas de photo de la galerie du téléphone) + position GPS + indice facultatif.
// Localiser : on ouvre une photo (réservée tant qu'on cherche), on pose un point sur la carte du monde, on valide.
// Le serveur garde la vraie position (arrondie à ~1 km) et ne la renvoie qu'après la réponse ; une photo devinée sort de la galerie,
// tout est supprimé après 48 h. Carte : Leaflet (fourni avec l'app) + tuiles OpenStreetMap.
import * as online from './online.js';

const TILES='https://tile.openstreetmap.org/{z}/{x}/{y}.png';
let leafletP=null;
export function loadLeaflet(){if(window.L)return Promise.resolve(window.L);
 return leafletP??=new Promise((res,rej)=>{const l=document.createElement('link');l.rel='stylesheet';l.href='leaflet.css';document.head.append(l);
  const s=document.createElement('script');s.src='leaflet.js';s.onload=()=>res(window.L);s.onerror=()=>{leafletP=null;rej(new Error('carte'))};document.head.append(s)})}

// ---- outils (testés sous Node)
const rad=d=>d*Math.PI/180;
export function haversine(a,b){const dl=rad(b[0]-a[0]),dg=rad(b[1]-a[1]),h=Math.sin(dl/2)**2+Math.cos(rad(a[0]))*Math.cos(rad(b[0]))*Math.sin(dg/2)**2;return 2*6371*Math.asin(Math.min(1,Math.sqrt(h)))}
export const pointsFor=km=>Math.round(5000*Math.exp(-km/1500));   // même formule que le serveur
export const wrapLng=x=>x>=-180&&x<180?x:((x+180)%360+360)%360-180;
export function fmtDist(km,en=false){const loc=en?'en-GB':'fr-FR';if(km<1)return Math.max(1,Math.round(km*1000))+' m';if(km<10)return km.toLocaleString(loc,{maximumFractionDigits:1})+' km';return Math.round(km).toLocaleString(loc)+' km'}
export function fitSize(w,h,max){const k=Math.min(1,max/Math.max(w,h));return [Math.max(1,Math.round(w*k)),Math.max(1,Math.round(h*k))]}
export function since(iso,now=Date.now(),en=false){const m=Math.max(0,Math.round((now-new Date(iso).getTime())/60000));
 if(m<1)return en?'just now':'à l’instant';if(m<60)return en?`${m} min ago`:`il y a ${m} min`;const h=Math.round(m/60);return en?`${h} h ago`:`il y a ${h} h`}
export const hoursLeft=(iso,now=Date.now())=>Math.max(0,Math.ceil((new Date(iso).getTime()+48*3600e3-now)/3600e3));
// copie de la longitude la plus proche de la référence (trait qui ne fait pas le tour du monde)
export const nearLng=(lng,ref)=>lng+360*Math.round((ref-lng)/360);

const GLOBE='<svg viewBox="0 0 120 120" class="gg-globe" aria-hidden="true"><circle cx="60" cy="60" r="44" fill="#4fa3e0"/><path d="M34 40c8-4 14 2 20-2s10-10 18-6 4 12-4 14-6 10-14 10-14-6-18-4-8-6-2-12zM70 70c6-2 14 0 16 6s-4 14-12 14-10-6-8-12 0-6 4-8zM28 70c4 0 8 4 8 8s-4 6-8 4-4-12 0-12z" fill="#7fcf7a"/><path d="M16 60h88M60 16v88M24 38c24 8 48 8 72 0M24 82c24-8 48-8 72 0" stroke="rgba(255,255,255,.35)" stroke-width="1.5" fill="none"/><path d="M84 18c-9 0-16 7-16 16 0 12 16 28 16 28s16-16 16-28c0-9-7-16-16-16z" fill="#e2453c" stroke="#fff" stroke-width="3"/><circle cx="84" cy="34" r="6" fill="#fff"/></svg>';

export function bagaguesser(c){
 const EN=window.bagaLang==='en',T=(fr,en)=>EN?en:fr,esc=s=>String(s??'').replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[ch]);
 const wrap=document.createElement('div');wrap.className='gg-wrap';c.board.append(wrap);
 let stream=null,watch=null,map=null,fix=null,alive=true,cur=null;
 const $=s=>wrap.querySelector(s),on=(el,fn)=>el&&c.listen(el,'click',fn);
 const buzz=p=>{try{navigator.vibrate?.(p)}catch{}};
 // sons
 function tone(f0,f1,dur,type='sine',g=.06,delay=0){const v=c.volume('sfx'),A=v&&c.audio();if(!A)return;const t=A.currentTime+delay,o=A.createOscillator(),gn=A.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+dur);gn.gain.setValueAtTime(g*v,t);gn.gain.exponentialRampToValueAtTime(.0008,t+dur);o.connect(gn);gn.connect(A.destination);o.start(t);o.stop(t+dur+.02)}
 const SFX={click:()=>tone(800,900,.04,'sine',.03),shutter:()=>{tone(1800,600,.05,'square',.04);tone(900,300,.08,'square',.03,.06)},pin:()=>tone(500,900,.08,'triangle',.05),
  send:()=>[660,880,1320].forEach((f,i)=>tone(f,f,.12,'triangle',.05,i*.08)),reveal:p=>{const n=p>=4000?5:p>=2500?4:p>=1000?3:2;for(let i=0;i<n;i++)tone(523*2**(i/4),523*2**(i/4),.18,'triangle',.06,i*.1)}};

 function stopCam(){if(stream){for(const t of stream.getTracks())t.stop();stream=null}if(watch!=null){try{navigator.geolocation.clearWatch(watch)}catch{}watch=null}}
 function killMap(){if(map){map.remove();map=null}}
 function screen(html){stopCam();killMap();wrap.innerHTML=html;wrap.scrollTop=0}
 const needOnline=()=>{if(online.enabled())return true;c.toast(globalThis.bagaWebNeedsInstall?T('Installe BagaPlay sur ton écran d’accueil pour jouer à BagaGuesser.','Install BagaPlay on your home screen to play BagaGuesser.'):T('BagaGuesser a besoin d’internet.','BagaGuesser needs the internet.'));return false};
 const withPseudo=fn=>{if(needOnline())c.needPseudo(fn)};
 const noFlag=m=>{m.attributionControl?.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');return m};
 function tileLayer(L){return L.tileLayer(TILES,{maxZoom:18,minZoom:1,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'})}
 const pin=(L,kind)=>L.divIcon({className:'gg-pin '+kind,html:'<i></i>',iconSize:[30,40],iconAnchor:[15,38]});

 // ---- accueil : deux gros boutons, puis mes photos
 function home(){screen(`<div class="gg-home"><div class="gg-hero">${GLOBE}<h2>BagaGuesser</h2><p>${T('Les photos des joueurs, du monde entier. Devine où elles ont été prises !','Photos from players all over the world. Guess where they were taken!')}</p></div>
   <button class="gg-big guess"><i>📍</i><span><b>${T('Localiser une photo','Locate a photo')}</b><small>${T('Choisis une photo dans la galerie','Pick a photo from the gallery')}</small></span></button>
   <button class="gg-big shoot"><i>📸</i><span><b>${T('Ajouter une photo','Add a photo')}</b><small>${T('Prends un paysage, les autres devinent','Shoot a view, the others guess')}</small></span></button>
   <h3>${T('Mes photos','My photos')}</h3><div class="gg-mine"><p class="gg-note">${online.registered()?T('Chargement…','Loading…'):T('Tes photos apparaîtront ici.','Your photos will appear here.')}</p></div>
   <p class="gg-foot">${T('Les photos restent 48 h. Une photo devinée sort de la galerie.','Photos stay for 48 hours. A guessed photo leaves the gallery.')}</p></div>`);
  on($('.gg-big.guess'),()=>{SFX.click();withPseudo(gallery)});on($('.gg-big.shoot'),()=>{SFX.click();withPseudo(camera)});
  if(online.enabled()&&online.registered())mine()}
 async function mine(){let d;try{d=await online.geoGallery()}catch(e){const b=$('.gg-mine');if(b)b.innerHTML=`<p class="gg-note">${esc(e.message)}</p>`;return}
  const box=$('.gg-mine');if(!box||!alive)return;
  if(!d.mine.length){box.innerHTML=`<p class="gg-note">${T('Aucune photo pour l’instant. Ajoute la première !','No photos yet. Add your first one!')}</p>`;return}
  box.innerHTML=d.mine.map((p,i)=>{const st=p.status==='done'?`<b>${esc(p.taker_name||'?')}</b> · ${fmtDist(p.distance_km,EN)} · ${p.points} pts`:p.status==='playing'?T('Quelqu’un la cherche…','Someone is looking…'):p.status==='hidden'?T('Retirée (signalée)','Removed (reported)'):T(`En attente · encore ${hoursLeft(p.created_at)} h`,`Waiting · ${hoursLeft(p.created_at)} h left`);
   return `<div class="gg-mrow${p.status==='done'?' done':''}" data-i="${i}"><img src="${p.thumb}" alt=""><span><em>${p.hint?'“'+esc(p.hint)+'”':T('Sans indice','No hint')}</em><small>${st}</small></span>${p.status==='done'?'<i class="gg-see">🗺️</i>':''}<button class="gg-del" data-i="${i}" aria-label="${T('Supprimer','Delete')}">✕</button></div>`}).join('');
  box.querySelectorAll('.gg-mrow.done').forEach(r=>on(r,e=>{if(e.target.closest('.gg-del'))return;const p=d.mine[+r.dataset.i];resultOverlay(p)}));
  box.querySelectorAll('.gg-del').forEach(b=>on(b,()=>{const p=d.mine[+b.dataset.i];c.dialog(T('Supprimer cette photo ?','Delete this photo?'),T('Elle disparaît de la galerie.','It disappears from the gallery.'),T('Supprimer','Delete'),async()=>{try{await online.geoDelete(p.id)}catch(e){c.toast(e.message)}mine()},T('Garder','Keep'),()=>{})}))}
 // résultat d'une de mes photos : vraie position et réponse du joueur
 async function resultOverlay(p){let L;try{L=await loadLeaflet()}catch{c.toast(T('Carte indisponible.','Map unavailable.'));return}
  const o=document.createElement('div');o.className='gg-over';o.innerHTML=`<div class="gg-overcard"><div class="gg-omap"></div><p><b>${esc(p.taker_name||'?')}</b> : ${fmtDist(p.distance_km,EN)} · ${p.points} pts</p><button class="gg-b primary">${T('Fermer','Close')}</button></div>`;wrap.append(o);
  const m=noFlag(L.map(o.querySelector('.gg-omap'),{zoomControl:false,attributionControl:true}));tileLayer(L).addTo(m);
  const A=[p.lat,p.lng],G=[p.guess_lat,nearLng(p.guess_lng,p.lng)];L.marker(A,{icon:pin(L,'real')}).addTo(m);L.marker(G,{icon:pin(L,'me')}).addTo(m);L.polyline([A,G],{color:'#1d2a3a',weight:2,dashArray:'6 6'}).addTo(m);
  m.fitBounds(L.latLngBounds([A,G]).pad(.4),{maxZoom:13});
  on(o.querySelector('button'),()=>{m.remove();o.remove()})}

 // ---- galerie
 async function gallery(){screen(`<div class="gg-page"><div class="gg-top"><button class="gg-back" aria-label="${T('Retour','Back')}">‹</button><h3>${T('Galerie','Gallery')}</h3><button class="gg-refresh" aria-label="${T('Actualiser','Refresh')}">↻</button></div><div class="gg-grid"><p class="gg-note">${T('Chargement…','Loading…')}</p></div></div>`);
  on($('.gg-back'),()=>{SFX.click();home()});on($('.gg-refresh'),()=>{SFX.click();gallery()});
  let d;try{d=await online.geoGallery()}catch(e){const g=$('.gg-grid');if(g)g.innerHTML=`<p class="gg-note">${esc(e.message)}</p>`;return}
  const g=$('.gg-grid');if(!g||!alive)return;
  if(!d.open.length){g.innerHTML=`<div class="gg-empty"><p>${T('Aucune photo à localiser pour l’instant.','No photos to locate right now.')}</p><button class="gg-b primary">📸 ${T('Ajouter la première','Add the first one')}</button></div>`;on(g.querySelector('button'),camera);return}
  const now=Date.now();
  g.innerHTML=d.open.map(p=>`<button class="gg-card" data-id="${p.id}"><img src="${p.thumb}" alt="" loading="lazy">${p.taken?`<b class="gg-resume">${T('Reprendre','Resume')}</b>`:''}<span class="gg-cap">${p.hint?`<em>“${esc(p.hint)}”</em>`:''}<small>${esc(p.name)} · ${since(p.created_at,now,EN)}</small></span></button>`).join('');
  g.querySelectorAll('.gg-card').forEach(b=>on(b,()=>{SFX.click();take(b.dataset.id)}))}

 // ---- localiser une photo
 async function take(id){let p;try{p=await online.geoTake(id)}catch(e){c.toast(e.message);return gallery()}cur=p;
  screen(`<div class="gg-play"><div class="gg-photo"><div class="gg-scroll"><img src="${p.image}" alt="${T('Photo à localiser','Photo to locate')}"></div>${p.hint?`<div class="gg-hint">💬 ${esc(p.hint)}</div>`:''}
    <button class="gg-zoom" aria-label="${T('Agrandir la photo','Enlarge the photo')}">⤢</button><button class="gg-more" aria-label="${T('Options','Options')}">⋯</button><small class="gg-by">${T('par','by')} ${esc(p.name)}</small></div>
   <div class="gg-map"></div><div class="gg-bar"><span class="gg-tip">${T('Touche la carte pour placer ton point','Tap the map to drop your pin')}</span><button class="gg-b primary gg-go" disabled>${T('Valider','Confirm')}</button></div></div>`);
  const photo=$('.gg-photo');
  const toggle=()=>{photo.classList.toggle('full');photo.classList.remove('z2');setTimeout(()=>map?.invalidateSize(),260)};
  on($('.gg-zoom'),toggle);on($('.gg-scroll img'),()=>{if(photo.classList.contains('full'))photo.classList.toggle('z2');else toggle()});
  on($('.gg-more'),()=>c.dialog(T('Cette photo','This photo'),T('Abandonner : elle retourne dans la galerie, mais plus pour toi. Signaler : elle est retirée si elle pose problème.','Give up: it goes back to the gallery, but not for you. Report: it gets removed if it’s a problem.'),T('Abandonner','Give up'),async()=>{try{await online.geoRelease(p.id)}catch{}gallery()},T('Signaler','Report'),async()=>{try{await online.geoReport(p.id);c.toast(T('Merci, photo signalée.','Thanks, photo reported.'))}catch(e){c.toast(e.message)}gallery()}));
  let L;try{L=await loadLeaflet()}catch{$('.gg-tip').textContent=T('Carte indisponible : vérifie ta connexion.','Map unavailable: check your connection.');return}
  if(!alive||cur!==p)return;
  map=noFlag(L.map($('.gg-map'),{worldCopyJump:true,zoomControl:false,attributionControl:true,minZoom:1})).setView([25,10],1.6);tileLayer(L).addTo(map);
  let mk=null;const go=$('.gg-go');
  map.on('click',e=>{if(!mk){mk=L.marker(e.latlng,{icon:pin(L,'me'),draggable:true}).addTo(map)}else mk.setLatLng(e.latlng);SFX.pin();buzz(10);go.disabled=false;$('.gg-tip').textContent=T('Tu peux encore déplacer ton point.','You can still move your pin.')});
  on(go,async()=>{if(!mk)return;go.disabled=true;go.textContent='…';const ll=mk.getLatLng();let r;
   try{r=await online.geoGuess(p.id,ll.lat,wrapLng(ll.lng))}catch(e){c.toast(e.message);go.disabled=false;go.textContent=T('Valider','Confirm');return}
   reveal(L,r,mk)})}
 function reveal(L,r,mk){const A=[r.lat,r.lng],G=[r.guess_lat,nearLng(r.guess_lng,r.lng)];mk.dragging?.disable();mk.setLatLng(G);
  L.marker(A,{icon:pin(L,'real')}).addTo(map);const line=L.polyline([G,G],{color:'#1d2a3a',weight:3,dashArray:'8 8'}).addTo(map);
  map.flyToBounds(L.latLngBounds([A,G]).pad(.35),{maxZoom:13,duration:1.1});
  // le trait se dessine de ma réponse vers la vraie position
  const t0=performance.now();const step=now=>{if(!map)return;const u=Math.min(1,(now-t0)/900);line.setLatLngs([G,[G[0]+(A[0]-G[0])*u,G[1]+(A[1]-G[1])*u]]);if(u<1)requestAnimationFrame(step)};requestAnimationFrame(step);
  SFX.reveal(r.points);buzz(r.points>=4000?[40,60,40,60,120]:[60]);
  const d=fmtDist(r.distance_km,EN),pts=r.points;
  const bar=$('.gg-bar');bar.innerHTML=`<span class="gg-res"><b>${d}</b><small>${pts.toLocaleString(EN?'en-GB':'fr-FR')} pts</small></span>`;
  const title=pts>=4500?T('Dans le mille !','Spot on!'):pts>=3000?T('Bien vu !','Nice one!'):pts>=1000?T('Pas mal !','Not bad!'):T('Raté de loin…','Way off…');
  setTimeout(()=>{if(!alive)return;c.finish(true,pts,T(`Tu étais à ${d} de la photo de ${r.name}.\n${pts} points.`,`You were ${d} from ${r.name}’s photo.\n${pts} points.`),
   {reward:20+Math.round(pts/50),title,actions:[[T('Autre photo','Another photo'),()=>c.relaunch({tab:'gallery'})],[T('Voir la carte','See the map'),()=>{}]]})},1900)}

 // ---- ajouter une photo : caméra de l'app uniquement, position GPS au moment de la photo
 async function camera(){screen(`<div class="gg-cam"><video playsinline muted autoplay></video><div class="gg-flash"></div>
   <div class="gg-gps">📍 ${T('Recherche de la position…','Finding your location…')}</div><p class="gg-camtip">${T('Cadre un paysage, une rue, un monument… Évite les panneaux qui donnent la réponse.','Frame a view, a street, a landmark… Avoid signs that give it away.')}</p>
   <div class="gg-shutterbar"><button class="gg-x" aria-label="${T('Annuler','Cancel')}">✕</button><button class="gg-shutter" aria-label="${T('Prendre la photo','Take the photo')}"></button><span></span></div></div>`);
  on($('.gg-x'),()=>{SFX.click();home()});
  const fail=msg=>{stopCam();wrap.innerHTML=`<div class="gg-page"><div class="gg-top"><button class="gg-back">‹</button><h3>${T('Ajouter une photo','Add a photo')}</h3><span></span></div><div class="gg-empty"><p>${msg}</p><button class="gg-b primary">${T('Réessayer','Try again')}</button></div></div>`;on($('.gg-back'),home);on($('.gg-empty button'),camera)};
  if(!navigator.mediaDevices?.getUserMedia)return fail(T('La caméra n’est pas disponible sur cet appareil.','The camera isn’t available on this device.'));
  fix=null;const gps=$('.gg-gps');
  if(navigator.geolocation){try{watch=navigator.geolocation.watchPosition(pos=>{fix={lat:pos.coords.latitude,lng:pos.coords.longitude,acc:pos.coords.accuracy};if(gps){gps.textContent=T(`📍 Position trouvée (±${Math.round(fix.acc)} m)`,`📍 Location found (±${Math.round(fix.acc)} m)`);gps.classList.add('ok')}},
   ()=>{if(gps){gps.textContent=T('📍 Position introuvable : active la localisation','📍 No location: turn on location services');gps.classList.add('bad')}},{enableHighAccuracy:true,maximumAge:20000,timeout:30000})}catch{}}
  else if(gps){gps.textContent=T('📍 Localisation indisponible','📍 Location unavailable');gps.classList.add('bad')}
  let s;try{s=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1440}},audio:false})}
  catch(e){return fail(T('Accès à la caméra refusé. Autorise la caméra pour BagaPlay dans les réglages du téléphone.','Camera access denied. Allow the camera for BagaPlay in your phone settings.'))}
  if(!alive||!$('.gg-cam')){for(const t of s.getTracks())t.stop();return}
  stream=s;const v=$('.gg-cam video');v.srcObject=s;try{await v.play()}catch{}
  on($('.gg-shutter'),()=>{if(!v.videoWidth)return;if(!fix){c.toast(T('Attends que la position soit trouvée…','Wait for your location…'));buzz(30);return}
   SFX.shutter();buzz(25);const fl=$('.gg-flash');fl.classList.remove('go');void fl.offsetWidth;fl.classList.add('go');
   const shot=capture(v);const at={...fix};stopCam();setTimeout(()=>preview({...shot,...at}),180)})}
 function capture(v){const draw=(max,q,minQ)=>{const [w,h]=fitSize(v.videoWidth,v.videoHeight,max),cv=document.createElement('canvas');cv.width=w;cv.height=h;cv.getContext('2d').drawImage(v,0,0,w,h);
   let url=cv.toDataURL('image/jpeg',q);while(url.length>(max>500?440000:58000)&&q>minQ){q-=.08;url=cv.toDataURL('image/jpeg',q)}return url};
  return {image:draw(1024,.74,.4),thumb:draw(280,.6,.3)}}
 function preview(shot){screen(`<div class="gg-page gg-prev"><div class="gg-top"><button class="gg-back" aria-label="${T('Retour','Back')}">‹</button><h3>${T('Ta photo','Your photo')}</h3><span></span></div>
   <img class="gg-shot" src="${shot.image}" alt=""><label class="gg-field">${T('Indice (facultatif)','Hint (optional)')}<input maxlength="60" placeholder="${T('Ex. : pas loin de la mer','E.g. not far from the sea')}"></label>
   <p class="gg-priv">🔒 ${T('La position est enregistrée à environ 1 km près et montrée au joueur qui devine. Évite de photographier chez toi.','The location is saved to within about 1 km and shown to the player who guesses. Avoid taking photos at home.')}</p>
   <div class="gg-row"><button class="gg-b retake">${T('Reprendre','Retake')}</button><button class="gg-b primary send">${T('Envoyer','Send')}</button></div></div>`);
  on($('.gg-back'),home);on($('.retake'),camera);
  const send=$('.send');on(send,async()=>{send.disabled=true;send.textContent=T('Envoi…','Sending…');
   try{await online.geoPost(shot.lat,shot.lng,$('.gg-field input').value.trim(),shot.image,shot.thumb)}catch(e){c.toast(e.message);send.disabled=false;send.textContent=T('Envoyer','Send');return}
   SFX.send();buzz([20,40,20]);c.toast(T('Photo envoyée ! Elle reste 48 h dans la galerie.','Photo sent! It stays in the gallery for 48 hours.'));home()})}

 if(c.duel?.tab==='gallery'&&online.enabled()&&online.registered())gallery();else home();
 return {destroy(){alive=false;stopCam();killMap()}};
}
