// Version web (iPhone, navigateur) : installation sur l'écran d'accueil et mode hors ligne.
// Sans effet dans l'APK Android (window.BagaNative présent).
(function(){
 if(window.BagaNative)return;
 var ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 var installed=navigator.standalone===true||(window.matchMedia&&matchMedia('(display-mode: standalone)').matches);
 // Sur iPhone, Safari et l'app ajoutée à l'écran d'accueil ont des données séparées :
 // le profil en ligne n'est créé que dans l'app installée, pour ne pas « gaspiller » le pseudo dans Safari.
 window.bagaWebNeedsInstall=ios&&!installed;
 if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})});
 if(!window.bagaWebNeedsInstall)return;
 addEventListener('DOMContentLoaded',function(){
  var b=document.createElement('div');b.className='install-banner';b.setAttribute('role','note');
  b.innerHTML=window.bagaLang==='en'
   ?'<strong>Install BagaPlay</strong><span>Tap <b>Share</b> <span class="share-glyph" aria-hidden="true">⬆︎</span> then <b>“Add to Home Screen”</b>. Online play (profile, challenges, leaderboards) works in the installed app.</span>'
   :'<strong>Installe BagaPlay</strong><span>Touche <b>Partager</b> <span class="share-glyph" aria-hidden="true">⬆︎</span> puis <b>« Sur l’écran d’accueil »</b>. Le jeu en ligne (profil, défis, classements) marche dans l’app installée.</span>';
  document.body.append(b);
 });
})();
