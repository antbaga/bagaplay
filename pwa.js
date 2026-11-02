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
  var en=window.bagaLang==='en';
  try{if(sessionStorage.getItem('bagaplay-banner-closed'))return}catch(e){}
  var b=document.createElement('div');b.className='install-banner';b.setAttribute('role','button');b.tabIndex=0;
  b.innerHTML=(en?'<strong>Install BagaPlay</strong><span>Tap here to see how (2 steps).</span>':'<strong>Installe BagaPlay</strong><span>Touche ici pour voir comment (2 étapes).</span>')+'<button class="banner-close" aria-label="'+(en?'Close':'Fermer')+'">×</button>';
  document.body.append(b);
  b.querySelector('.banner-close').addEventListener('click',function(e){e.stopPropagation();b.remove();try{sessionStorage.setItem('bagaplay-banner-closed','1')}catch(x){}});
  // Safari ne permet pas d'installer par programme : on montre où toucher, avec une flèche vers le bouton Partager
  b.addEventListener('click',function(){
   var g=document.createElement('div');g.className='install-guide';
   g.innerHTML='<div class="install-card"><h2>'+(en?'Add BagaPlay to your Home Screen':'Ajoute BagaPlay à ton écran d’accueil')+'</h2>'+
    '<ol><li><span class="step">1</span>'+(en?'Tap <b>Share</b> <span class="share-glyph">⬆︎</span> in Safari’s toolbar (at the bottom, or at the top on iPad).':'Touche <b>Partager</b> <span class="share-glyph">⬆︎</span> dans la barre de Safari (en bas, ou en haut sur iPad).')+'</li>'+
    '<li><span class="step">2</span>'+(en?'Scroll down and choose <b>“Add to Home Screen”</b>, then <b>Add</b>.':'Fais défiler et choisis <b>« Sur l’écran d’accueil »</b>, puis <b>Ajouter</b>.')+'</li></ol>'+
    '<p>'+(en?'Then open BagaPlay from its icon: online play works there.':'Ouvre ensuite BagaPlay depuis son icône : le jeu en ligne marche là.')+'</p>'+
    '<button class="primary">'+(en?'Got it':'Compris')+'</button></div><div class="install-arrow">⬇︎</div>';
   document.body.append(g);g.addEventListener('click',function(e){if(e.target===g||e.target.tagName==='BUTTON')g.remove()});
  });
 });
})();
