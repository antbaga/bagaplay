import {cookie} from './cookie.js';
import {breakout as breakoutNew} from './breakout.js';
import {celebrate,music,PANDA} from './rewards.js';
import * as online from './online.js';
import {puzzles} from './puzzles.js';
import {arcade} from './arcade.js';
import {duel,DUEL_RULES,initialState,AI_GAMES} from './duel.js';
import {formatDuration} from './engines.js';
const $=s=>document.querySelector(s);
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e};
const games=[
 {id:'cookie',title:'Cookie Curling',desc:'',cat:'arcade',color:'#f8deb9',tag:'',hint:'Glisse le cookie vers le haut. Deux pâtisseries identiques fusionnent.',art:'cookie'},
 {id:'chess',title:'Échecs',desc:'',cat:'duel',color:'#eadfca',tag:'',hint:'',art:'chess'},
 {id:'draughts',title:'Dames',desc:'',cat:'duel',color:'#e0ebd1',tag:'',hint:'',art:'draughts'},
 {id:'connect4',title:'Puissance 4',desc:'',cat:'duel',color:'#d9e6f7',tag:'',hint:'',art:'connect4'},
 {id:'2048',title:'2048',desc:'Fusionne, encore et encore.',cat:'puzzle',color:'#f3e2c0',tag:'LES CHIFFRES S’ALIGNENT',hint:'Glisse pour fusionner les nombres identiques.',art:'numbers'},
 {id:'snake',title:'Snake',desc:'Un petit creux sans fin.',cat:'arcade',color:'#dceeca',tag:'LE GRAND CLASSIQUE',hint:'Glisse pour diriger le serpent. Évite les murs et ta queue.',art:'snake'},
 {id:'blocks',title:'Blocs pastel',desc:'Tout finit par s’emboîter.',cat:'arcade',color:'#ded6f6',tag:'UNE LIGNE À LA FOIS',hint:'Glisse à gauche ou à droite. Touche pour tourner, glisse vers le bas pour poser.',art:'blocks'},
 {id:'memory',title:'Memory',desc:'Les jolies paires font la paire.',cat:'puzzle',color:'#f9d2c6',tag:'UN PEU DE MÉMOIRE',hint:'Retrouve toutes les paires en un minimum de coups.',art:'memory',lower:true},
 {id:'breakout',title:'Casse-briques',desc:'Rebondis de plus belle.',cat:'arcade',color:'#d2e7f2',tag:'LE BON REBOND',hint:'Fais glisser la raquette. Touche le plateau pour lancer la balle. 3 vies.',art:'breakout'},
 {id:'mines',title:'Démineur',desc:'Un petit air de mystère.',cat:'puzzle',color:'#eaefca',tag:'CHAQUE CASE COMPTE',hint:'Dévoile les cases sans mine. Les chiffres comptent les mines voisines.',art:'mines',lower:true},
 {id:'ttt',title:'Morpion',desc:'À toi de faire la ligne.',cat:'puzzle',color:'#f0d2de',tag:'À DEUX OU EN SOLO',hint:'Aligne 3 symboles. Tu joues les croix, à toi de commencer !',art:'ttt'},
 {id:'sudoku',title:'Sudoku',desc:'Un chiffre, une petite victoire.',cat:'puzzle',color:'#d4e8d5',tag:'L’ESPRIT AU CALME',hint:'Chaque ligne, colonne et carré doit contenir les chiffres 1 à 9.',art:'sudoku',lower:true},
 {id:'bird',title:'Petit envol',desc:'Un battement de plus.',cat:'arcade',color:'#f5e6b1',tag:'JUSTE UN PETIT TAP',hint:'Touche pour voler. Attrape les pièces entre les obstacles.',art:'bird'},
 {id:'slide',title:'Le taquin',desc:'Chaque pièce à sa place.',cat:'puzzle',color:'#e2d6f5',tag:'TOUT DANS L’ORDRE',hint:'Touche une case voisine du vide. Remets les nombres de 1 à 15 dans l’ordre.',art:'slide',lower:true}
];
let saved={};try{saved=JSON.parse(localStorage.getItem('bagaplay-v1')||'{}')}catch{};
for(const id of ['memory','snake','sudoku','mines'])if(saved[id]!=null){if(saved[id+':1']==null)saved[id+':1']=saved[id];delete saved[id]}
let turns={};let difficulty=1,collected=0;let sound=!!saved.sound,current=null,runtime=null,paused=false,ended=false,cleanups=[],tasks=[],time=0,raf=0;
function persist(){try{localStorage.setItem('bagaplay-v1',JSON.stringify(saved))}catch{}}
let audio;
function tone(win=false){if(!sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(win?660:430,audio.currentTime);o.frequency.exponentialRampToValueAtTime(win?880:540,audio.currentTime+.1);g.gain.setValueAtTime(.055,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.18);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.2)}catch{}}
function icon(type){let s='';const rect=(x,y,w,h,c,rx=5)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${c}"/>`;const txt=(x,y,t,c='#4c6640',z=20)=>`<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial" font-size="${z}" font-weight="bold" fill="${c}">${t}</text>`;
 if(type==='numbers')s=`<g transform="rotate(-9 60 50)">${rect(25,17,40,40,'#fff9e9')+rect(66,44,39,39,'#fdc363')+txt(45,44,'2')+txt(85,71,'4')}</g>`;
 if(type==='snake'){for(const [x,y] of [[28,65],[28,46],[47,46],[66,46],[66,27]])s+=rect(x,y,21,21,'#70ac62',7);s+='<circle cx="80" cy="33" r="2" fill="#25462e"/><circle cx="72" cy="33" r="2" fill="#25462e"/>'+rect(91,62,16,17,'#ec8062',6)+'<path d="M99 60l4-6" stroke="#6b964f" stroke-width="3"/>'}
 if(type==='blocks'){for(const [x,y,c] of [[21,65,'#a980d1'],[43,65,'#a980d1'],[65,65,'#a980d1'],[43,43,'#a980d1'],[87,65,'#ffd877'],[87,43,'#ffd877'],[24,16,'#87be9b'],[46,16,'#87be9b']])s+=rect(x,y,20,20,c,3)}
 if(type==='memory')s=`<g transform="rotate(-13 44 52)">${rect(20,22,43,58,'#fff8ee')+txt(41,61,'✿','#da7b65',33)}</g><g transform="rotate(13 80 52)">${rect(66,20,43,58,'#fff8ee')+txt(88,59,'✿','#da7b65',33)}</g>`;
 if(type==='breakout'){for(let j=0;j<2;j++)for(let i=0;i<3;i++)s+=rect(17+i*33,19+j*16,30,12,j?'#7cb5d2':'#fff8da',3);s+=rect(45,80,43,8,'#589eba')+'<circle cx="76" cy="64" r="6" fill="#fffaf0"/><path d="M65 69l-8 5" stroke="#fffaf0" stroke-width="2"/>'}
 if(type==='mines'){for(let j=0;j<3;j++)for(let i=0;i<3;i++)s+=rect(26+i*25,16+j*25,22,22,i===1&&j===1?'#fbf9e5':'#b5d38a',4);s+=txt(62,58,'1','#649e76',20)+'<path d="M87 77V61l13 5-13 5" fill="#dd8462" stroke="#648453" stroke-width="2"/>'}
 if(type==='ttt'){s='<path d="M49 18v66M77 18v66M20 40h87M20 65h87" stroke="#ba95a8" stroke-width="3" stroke-linecap="round"/><path d="M27 20l14 14m0-14L27 34M55 45l15 15m0-15L55 60" stroke="#7da167" stroke-width="5" stroke-linecap="round"/><circle cx="91" cy="27" r="8" stroke="#e47e65" stroke-width="5" fill="none"/><circle cx="34" cy="77" r="8" stroke="#e47e65" stroke-width="5" fill="none"/>'}
 if(type==='sudoku'||type==='slide'){s=rect(26,12,77,78,'#fff9ec',7);for(let y=0;y<3;y++)for(let x=0;x<3;x++)if(x!==2||y!==2)s+=rect(30+x*24,16+y*24,21,21,type==='slide'?'#bda2e0':'#e4eed4',3)+txt(40+x*24,32+y*24,type==='slide'?y*3+x+1:[3,1,7,8,2,9,4,6][y*3+x],'#628257',13)}
 if(type==='bird')s='<path d="M20 48Q49 20 80 49L100 53 82 60Q55 88 30 64Z" fill="#fff8da"/><path d="M40 49l29 9-23 14z" fill="#e5bb68"/><path d="M83 48l19 7-20 6z" fill="#e3894e"/><circle cx="77" cy="48" r="3" fill="#547148"/><path d="M17 37l-9-3M17 59H5" stroke="#c6b870" stroke-width="3" stroke-linecap="round"/>';
 if(type==='cookie')s='<circle cx="48" cy="57" r="29" fill="#fb9a2a"/><path d="M32 42l9-3 4 9-8 5ZM54 54l10-4 5 10-10 5ZM34 64l8-3 3 10-9 4Z" fill="#7b412d"/><circle cx="85" cy="35" r="24" fill="#f4a73a"/><circle cx="85" cy="35" r="18" fill="#e24750"/><path d="M72 25l26 20M77 20l25 20M70 37l23-18M77 49l23-18" stroke="#ffc86d" stroke-width="4"/>';
 if(type==='chess'){for(let y=0;y<4;y++)for(let x=0;x<4;x++)s+=rect(29+x*17,18+y*17,17,17,(x+y)%2?'#aed090':'#fff8e4',0);s+=txt(54,60,'♞\uFE0E','#314438',34)+txt(83,82,'♛\uFE0E','#fffdf6',26).replace('<text','<text stroke="#364d3f" stroke-width="1"')}
 if(type==='draughts'){for(let y=0;y<4;y++)for(let x=0;x<4;x++)s+=rect(29+x*17,18+y*17,17,17,(x+y)%2?'#aed090':'#fff8e4',0);for(const [x,y,c] of [[46,26,'#3c5543'],[80,26,'#3c5543'],[63,77,'#fffaf0'],[97,77,'#fffaf0']])s+=`<circle cx="${x-8}" cy="${y+1}" r="7" fill="${c}" stroke="#5e7854" stroke-width="1.5"/>`}
 if(type==='connect4'){s=rect(26,14,74,66,'#3d7fd1',8);for(let y=0;y<4;y++)for(let x=0;x<5;x++){const col=y===3&&x<3?'#e5483b':y===2&&x===1?'#f5c430':y===3&&x===3?'#f5c430':y===2&&x===2?'#e5483b':'#eaf3ff';s+=`<circle cx="${36+x*13.5}" cy="${27+y*14}" r="5.2" fill="${col}"/>`}}
 return `<svg viewBox="0 0 126 102" aria-hidden="true">${s}</svg>`;
}
const isDuel=id=>games.find(g=>g.id===id)?.cat==='duel';
const TIMED=['mines','sudoku'];
// Records séparés par difficulté (clé « jeu:niveau »).
const DIFF={memory:4,snake:3,sudoku:3,mines:4},LEVELS=['Facile','Normal','Difficile','Extrême'],levelName=(id,d)=>id==='mines'&&d===3?'Expert':LEVELS[d],LEVEL_SHORT=['F','N','D','X'];
const base=k=>String(k).split(':')[0];
const recordKey=id=>DIFF[id]?`${id}:${difficulty}`:id;
// tous les tableaux de records : [{key, id, label}]
function recordBoards(){const out=[];for(const g of games){if(DIFF[g.id])for(let d=0;d<DIFF[g.id];d++)out.push({key:`${g.id}:${d}`,id:g.id,label:`${g.title} · ${levelName(g.id,d)}`});else out.push({key:g.id,id:g.id,label:g.title})}return out}
// Valeur affichée d'un record : durée lisible pour les jeux chronométrés, sinon nombre + unité.
const fmt=(id,v)=>TIMED.includes(base(id))?formatDuration(v):v+unit(base(id),v);
const unit=(id,v=2)=>isDuel(id)?(v>1?' victoires':' victoire'):['mines','sudoku'].includes(id)?' s':games.find(g=>g.id===id)?.lower?' coups':'';
function renderCards(filter='all'){const selected=games.filter(g=>filter==='all'||g.cat===filter);$('#game-count').textContent=selected.length+' jeux';{const w=$('#wallet'),t='● '+(saved.coins||0)+' ›';if(w.textContent&&w.textContent!==t){w.classList.remove('bump');void w.offsetWidth;w.classList.add('bump')}w.textContent=t}$('#cards').innerHTML=selected.map(g=>`<button class="game-card" data-game="${g.id}" aria-label="Jouer à ${g.title}"><div class="card-art" style="--tint:${g.color}"><span class="card-tag">${g.tag}</span>${icon(g.art)}</div><h3>${g.title}</h3><p>${g.desc}</p><span class="card-arrow">↗</span>${turns[g.id]?`<div class="card-turn">● À toi de jouer${turns[g.id]>1?' ('+turns[g.id]+')':''}</div>`:''}${DIFF[g.id]?(()=>{const parts=[];for(let d=0;d<DIFF[g.id];d++){const v=saved[g.id+':'+d];if(v!=null)parts.push(LEVEL_SHORT[d]+' '+fmt(g.id,v))}return parts.length?`<div class="card-record">✦ ${parts.join(' · ')}</div>`:''})():saved[g.id]!=null?`<div class="card-record">${isDuel(g.id)?'✦ ':'✦ Record : '}${fmt(g.id,saved[g.id])}${isDuel(g.id)?' en ligne':''}</div>`:''}</button>`).join('');document.querySelectorAll('[data-game]').forEach(b=>b.onclick=()=>{const id=b.dataset.game;if(isDuel(id))return openLobby(id);if(DIFF[id]){dialog('Difficulté','','Jouer',()=>{difficulty=+document.querySelector('#difficulty').value;launch(id)},'Annuler',()=>{});$('#dialog-text').innerHTML='<select id="difficulty" aria-label="Difficulté"><option value="0">Facile</option><option value="1" selected>Normal</option><option value="2">Difficile</option>'+(DIFF[id]>3?'<option value="3">'+(id==='mines'?'Expert':'Extrême')+'</option>':'')+'</select>'}else launch(id)})}
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));renderCards(b.dataset.filter)});
const VERSION='1.6.2';
function setSound(on){sound=on;music(sound);saved.sound=sound;persist();tone()}
function updateSound(){$('#footer-version').textContent=`BagaPlay ${VERSION} · Sans pub, sans compte.`}
// Réglages : son, langue, version.
function openSettings(){dialog('Réglages','','Fermer',()=>{},'',null);const t=$('#dialog-text');t.textContent='';
 const row=(label,control)=>{const r=el('div','setting-row');r.append(el('span','setting-label',label),control);t.append(r)};
 const sw=el('button','switch'+(sound?' on':''));sw.setAttribute('role','switch');sw.setAttribute('aria-checked',String(sound));sw.setAttribute('aria-label','Son');sw.append(el('span','knob'));
 sw.onclick=()=>{setSound(!sound);sw.classList.toggle('on',sound);sw.setAttribute('aria-checked',String(sound))};row('Son',sw);
 const seg=el('div','segmented');for(const [code,label] of [['fr','Français'],['en','English']]){const b=el('button',window.bagaLang===code?'active':'',label);b.lang=code;b.onclick=()=>{if(window.bagaLang===code)return;saved.lang=code;persist();location.reload()};seg.append(b)}row('Langue',seg);
 if(online.enabled()){const b=el('button','setting-link','Autre appareil ›');b.onclick=openLink;row('Mon profil',b)}
 const v=el('span','setting-value','BagaPlay '+VERSION);row('Version',v);
}
// Même profil sur un autre appareil (Android, iPhone…) : code court valable 10 minutes.
function openLink(){dialog('Mon profil sur un autre appareil','','Fermer',()=>{},'',null);const t=$('#dialog-text');t.textContent='';
 const p=online.player();
 if(online.registered()){t.append(el('span','dialog-help',`Pour jouer en tant que ${p.name} sur un autre téléphone, crée un code ici puis tape-le là-bas (Réglages › Mon profil).`));
  const show=el('button','link-btn','Créer un code'),code=el('div','link-code');show.onclick=async()=>{show.disabled=true;try{code.textContent=await online.linkCode();code.after(el('span','dialog-help','Valable 10 minutes, une seule fois.'));show.remove()}catch(e){show.disabled=false;toast(e.message)}};t.append(show,code)}
 t.append(el('span','dialog-help link-sep','J’ai un code venant de mon autre appareil :'));
 const input=el('input');input.className='dialog-input';input.maxLength=8;input.placeholder='Ex. K7P2QX';input.autocapitalize='characters';input.autocomplete='off';input.spellcheck=false;
 const use=el('button','link-btn','Utiliser ce code'),err=el('span','dialog-error','');t.append(input,use,err);
 use.onclick=()=>{const c=input.value.trim();if(!c)return;const go=async()=>{try{const np=await online.redeemLink(c);closeDialog();toast('Profil '+np.name+' activé.');setTimeout(()=>location.reload(),900)}catch(e){openLink();toast(e.message)}};
  if(online.registered())dialog('Changer de profil ?',`Cet appareil n’utilisera plus le profil ${p.name}. Tes records enregistrés sur ce téléphone sont conservés.`,'Changer',go,'Annuler',()=>{});else go()};
 input.addEventListener('keydown',e=>{if(e.key==='Enter')use.click()})}
$('#settings').onclick=openSettings;
function closeDialog(){$('#overlay').hidden=true;document.querySelector('#reward')?.remove();document.querySelector('#record-line')?.remove()}
function dialog(title,desc,primary,onPrimary,secondary,onSecondary){$('#dialog-secondary').hidden=!secondary;$('#dialog-title').textContent=title;$('#dialog-text').textContent=desc;$('#dialog-primary').textContent=primary;$('#dialog-primary').onclick=()=>{closeDialog();onPrimary()};$('#dialog-secondary').textContent=secondary;$('#dialog-secondary').onclick=()=>{closeDialog();onSecondary()};$('#overlay').hidden=false;$('#dialog-primary').focus()}
function stop(){cancelAnimationFrame(raf);runtime?.destroy?.();cleanups.forEach(f=>f());cleanups=[];tasks=[];runtime=null}
function goHome(){stop();const wasPaused=paused;current=null;paused=false;closeDialog();if(wasPaused)music(sound);$('#play').hidden=true;$('#scores').hidden=true;$('#lobby').hidden=true;clearInterval(lobbyTimer);$('#home').hidden=false;renderCards(document.querySelector('[data-filter].active').dataset.filter);homeSig='';if(online.enabled())refreshTurns();window.scrollTo(0,0)}
function pause(){if(!current||ended||paused)return;paused=true;runtime?.pause?.();music(false);dialog('Pause','','Reprendre',()=>{paused=false;music(sound)},'Retour aux jeux',leave)}
window.bagaPause=pause;window.bagaBack=()=>{if(!$('#scores').hidden||!$('#lobby').hidden){goHome();return true}if(!current)return false;if(ended){goHome();return true}if(paused){closeDialog();paused=false;music(sound);return true}pause();return true};
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else if(sound&&!paused)music(true)});$('#pause').onclick=pause;$('#back').onclick=()=>{if(ended||onlineDuel)leave();else{paused=true;dialog('Retour aux jeux ?',current.id==='cookie'?'Ta partie sera sauvegardée.':isDuel(current.id)?'La partie en cours sera perdue.':'La partie en cours sera terminée. Ton record est conservé.','Quitter la partie',leave,'Continuer',()=>paused=false)}};$('#restart').onclick=()=>{paused=true;dialog('On recommence ?','Une nouvelle partie, une nouvelle chance.','Recommencer',()=>launch(current.id,true),'Continuer',()=>paused=false)};
function leave(){const d=current&&isDuel(current.id)?current.id:null;goHome();if(d)openLobby(d)}
let onlineDuel=false;
function launch(id,fresh=false,duelOpts=null){stop();onlineDuel=!!duelOpts?.match;$('#restart').hidden=onlineDuel;document.querySelectorAll('.scorebar>div').forEach(d=>d.classList.remove('turn'));collected=0;$('#run-coins').textContent='● 0';current=games.find(g=>g.id===id);ended=false;paused=false;time=0;closeDialog();$('#home').hidden=true;$('#play').hidden=false;$('#game-title').textContent=current.title;$('#lobby').hidden=true;clearInterval(lobbyTimer);$('#game-category').textContent=current.cat==='arcade'?'PETITE DOSE D’ARCADE':'PAUSE RÉFLEXION';$('#hint').textContent=current.hint;$('#score').textContent='0';$('#score-label').textContent=TIMED.includes(id)?'TEMPS':current.lower?'COUPS':id==='ttt'?'VICTOIRES':'SCORE';$('#best-label').textContent='RECORD';const key=recordKey(id);$('#best').textContent=saved[key]==null?'—':TIMED.includes(id)?formatDuration(saved[key]):saved[key];$('#board').innerHTML='';$('#controls').innerHTML='';window.scrollTo(0,0);
 const ctx={difficulty,fresh,duel:duelOpts,dialog,closeDialog,leave,
  every:(fn,ms)=>{const t=setInterval(()=>{if(!document.hidden)fn()},ms);cleanups.push(()=>clearInterval(t))},
  setBar:(l,lv,r,rv,turn)=>{$('#score-label').textContent=l;$('#score').textContent=lv;$('#best-label').textContent=r;$('#best').textContent=rv;const d=document.querySelectorAll('.scorebar>div');d[0].classList.toggle('turn',turn==='l');d[1].classList.toggle('turn',turn==='r')},
 collect:n=>{collected+=n;const rc=$('#run-coins');rc.textContent='● '+collected;rc.classList.remove('bump');void rc.offsetWidth;rc.classList.add('bump');tone(true)},board:$('#board'),controls:$('#controls'),hint:s=>$('#hint').textContent=s,score:(s,save=true)=>{const sc=$('#score'),txt=String(TIMED.includes(id)?formatDuration(s):s);if(sc.textContent!==txt&&!TIMED.includes(id)){sc.classList.remove('bump');void sc.offsetWidth;sc.classList.add('bump')}sc.textContent=txt;if(save&&!current.lower&&s>0)record(s)},label:s=>$('#score-label').textContent=s,tone,
  later:(fn,delay)=>tasks.push({fn,at:time+delay}),
  listen:(el,event,fn,options)=>{const handler=e=>{if(!paused&&!ended)fn(e)};el.addEventListener(event,handler,options);cleanups.push(()=>el.removeEventListener(event,handler,options))},
  button:(label,fn,cls='',aria=label)=>{const b=document.createElement('button');b.textContent=label;b.className=cls;b.setAttribute('aria-label',aria);$('#controls').append(b);ctx.listen(b,'click',fn);return b},
  finish:(win,score,text,o={})=>{if(ended)return;ended=true;const before=saved[key];if(!o.noRecord)record(score,current.lower?win:true);const best=saved[key],isNew=best!=null&&best!==before&&(current.lower||best>0);tone(win);
   let reward=o.reward??(100+(win?400:0)+Math.min(500,Math.floor(Math.max(0,score)/5))+collected);
   if(o.once){const done=saved.rewarded||[];if(done.includes(o.once))reward=0;else{saved.rewarded=done.concat(o.once).slice(-300);if(o.duelWin)saved[id]=(saved[id]||0)+1}}
   saved.coins=(saved.coins||0)+reward;persist();
   if(onlineDuel)dialog(o.title||'Partie terminée',text,'Retour au salon',leave,'Voir le plateau',()=>{});
   else if(isDuel(id))dialog(o.title||'Partie terminée',text,'Rejouer',()=>launch(id,true,ctx.duel?.mode==='ai'?ctx.duel:null),'Retour',leave);
   else if(o.viewBoard)dialog(win?'Bien joué !':'Partie terminée',text,'Rejouer',()=>launch(id,true),'Voir la grille',()=>{});
   else dialog(win?'Bien joué !':'Partie terminée',text,'Rejouer',()=>launch(id,true),'Tous les jeux',goHome);
   if(reward)celebrate(reward,saved.coins);
   if(!o.noRecord){const line=document.createElement('p');line.id='record-line';line.className='record-line'+(isNew?' new':'');line.textContent=best==null?'Pas encore de record':(isNew?'Nouveau record ! ':'Record : ')+fmt(id,best);$('#dialog-text').after(line)}
   online.syncAll(saved,recordBoards().map(b=>b.key))},
  grid:(n,cls='')=>{const grid=document.createElement('div');grid.className='grid '+cls;grid.style.gridTemplateColumns=`repeat(${n},1fr)`;$('#board').append(grid);return grid},
  cell:(grid,label,fn,cls='')=>{const b=document.createElement('button');b.className='cell '+cls;b.textContent=label;grid.append(b);if(fn)ctx.listen(b,'click',fn);return b},
  canvas:(height=450)=>{const c=document.createElement('canvas');c.width=360;c.height=height;c.dataset.w=360;c.dataset.h=height;c.setAttribute('aria-label',current.title+' : plateau tactile');$('#board').append(c);return [c,c.getContext('2d')]},
  swipe:fn=>{let start=null;ctx.listen($('#board'),'pointerdown',e=>{start=[e.clientX,e.clientY];e.currentTarget.setPointerCapture?.(e.pointerId)});ctx.listen($('#board'),'pointerup',e=>{if(!start)return;const x=e.clientX-start[0],y=e.clientY-start[1];start=null;if(Math.max(Math.abs(x),Math.abs(y))>18)fn(Math.abs(x)>Math.abs(y)?x>0?'right':'left':y>0?'down':'up')})}
 };
 function record(s,allow=true){if(!allow||!Number.isFinite(s))return;const old=saved[key];if(old==null||(current.lower?s<old:s>old)){saved[key]=s;$('#best').textContent=TIMED.includes(id)?formatDuration(s):s;persist()}}
 runtime=(isDuel(id)?duel(id):id==='cookie'?cookie:id==='breakout'?breakoutNew:(puzzles[id]||arcade[id]))(ctx);fitBoard();let last=performance.now();function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;if(!paused&&!ended){time+=dt*1000;const due=tasks.filter(t=>t.at<=time);tasks=tasks.filter(t=>t.at>time);due.forEach(t=>t.fn());if(!ended)runtime?.update?.(dt)}raf=requestAnimationFrame(frame)}raf=requestAnimationFrame(frame);
 ctx.listen(document,'keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();runtime?.key?.(e.key)});
}
renderCards();updateSound();document.addEventListener('pointerdown',()=>{if(sound)music(true)},{once:true});

// Agrandit le plateau au maximum de l'espace libre, en gardant les proportions du jeu.
function fitBoard(){const b=$('#board');if($('#play').hidden)return;const W=b.clientWidth,H=b.clientHeight;if(!W||!H)return;let changed=false;
 for(const el of b.children){if(el.tagName==='CANVAS'&&el.dataset.w){const w=+el.dataset.w,h=+el.dataset.h,s=Math.min(W/w,H/h),cw=Math.floor(w*s)+'px',ch=Math.floor(h*s)+'px';if(el.style.width!==cw||el.style.height!==ch){el.style.width=cw;el.style.height=ch;changed=true}}
  else if(el.classList.contains('grid')){const ar=+el.dataset.aspect||1,w=Math.floor(Math.min(W,H*ar));el.style.width=w+'px';el.style.height=Math.floor(w/ar)+'px'}}
 if(changed)window.dispatchEvent(new Event('resize'))}
if(window.ResizeObserver)new ResizeObserver(()=>fitBoard()).observe($('#board'));else window.addEventListener('resize',fitBoard);

// ---------------------------------------------------------------- profil, recherche de joueurs
const recordText=(id,v)=>v!=null&&v!==0?fmt(id,v):'—';
// Boîte de recherche : propositions dès la première lettre, joueurs récents si vide.
function playerSearch(box,placeholder,onPick){box.innerHTML='';const input=el('input');input.placeholder=placeholder;input.setAttribute('aria-label',placeholder);input.autocomplete='off';input.spellcheck=false;input.maxLength=16;
 const list=el('div','search-results');box.append(input,list);let timer=0,seq=0;
 async function run(){const q=input.value,my=++seq;list.replaceChildren(el('div','muted-note','Recherche…'));let rows;
  try{rows=await online.search(q)}catch(e){if(my===seq)list.replaceChildren(el('div','muted-note',e.message));return}
  if(my!==seq)return;
  if(!rows.length){list.replaceChildren(el('div','muted-note',q.trim()?'Aucun joueur ne commence par « '+q.trim()+' ».':'Aucun autre joueur pour l’instant.'));return}
  list.replaceChildren(...(q.trim()?[]:[el('div','search-caption','Joueurs récents')]),...rows.map(r=>{const b=el('button','player-row');b.append(el('span','avatar',r.name.slice(0,1).toUpperCase()),el('span','score-name',r.name),el('span','card-arrow-inline','›'));b.onclick=()=>onPick(r);return b}))}
 input.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(run,200)});input.addEventListener('focus',()=>{if(!list.children.length)run()});
 return {input,refresh:run,clear(){input.value='';list.replaceChildren()}};
}
// Demande un pseudo (unique sur le serveur). then() est appelé une fois le pseudo accepté.
function askPseudo(then,message=''){
 dialog('Ton pseudo','','Valider',async()=>{const v=document.querySelector('#pseudo-dialog')?.value??'';try{await online.setName(v);online.askNotifications();then?.()}catch(e){askPseudo(then,e.message)}},'Plus tard',()=>{});
 const t=$('#dialog-text');t.textContent='';const input=el('input');input.id='pseudo-dialog';input.className='dialog-input';input.maxLength=16;input.placeholder='Ex. Kiara';input.value=online.player().name||'';
 t.append(el('span','dialog-help','C’est le nom que les autres joueurs verront et chercheront.'),input);if(message)t.append(el('span','dialog-error',message));
 input.addEventListener('keydown',e=>{if(e.key==='Enter')$('#dialog-primary').click()});setTimeout(()=>input.focus(),50);
}
function needPseudo(then){if(online.registered())then();else askPseudo(then)}

// Défi : confirmation puis ouverture de la partie.
function offerChallenge(r,game){const g=games.find(x=>x.id===game);
 dialog('Défier '+r.name+' ?',`Une partie de ${g.title.toLowerCase()} commence. ${r.name} reçoit une notification et joue quand il veut.`,'Défier',()=>needPseudo(async()=>{try{lobbyStatus('Envoi du défi…');const v=await online.challenge(r.id,game,initialState(game));online.askNotifications();lobbyStatus('');launch(v.game,false,{mode:'online',match:v})}catch(e){lobbyStatus(e.message);toast(e.message)}}),'Annuler',()=>{})}
function toast(msg){const t=el('div','toast',msg);document.body.append(t);setTimeout(()=>t.remove(),2600)}

// ---------------------------------------------------------------- page des scores
$('#scores-panda').innerHTML=PANDA;
let scoresSearch=null;
function showScores(){pseudoEditing=false;$('#home').hidden=true;$('#scores').hidden=false;$('#profile').hidden=true;window.scrollTo(0,0);renderScores()}
function recordsHtml(values){return recordBoards().map(b=>{const g=games.find(x=>x.id===b.id);return `<div class="score-row"><span class="score-art" style="--tint:${g.color}">${icon(g.art)}</span><span class="score-name">${b.label}</span><strong>${recordText(b.key,values[b.key])}</strong></div>`}).join('')}
let pseudoEditing=false;
function pseudoMode(){const p=online.player(),locked=!!p.name&&(!online.enabled()||online.registered())&&!pseudoEditing;$('#pseudo').disabled=locked;$('#pseudo').value=p.name;const b=$('#pseudo-save');b.textContent=locked?'✎':'OK';b.setAttribute('aria-label',locked?'Modifier le pseudo':'Valider');b.classList.toggle('edit',locked)}
function renderScores(){const p=online.player(),on=online.enabled();$('#scores-coins').textContent=(saved.coins||0).toLocaleString(window.bagaLang==='en'?'en-GB':'fr-FR');pseudoMode();
 $('#score-list').innerHTML=recordsHtml(saved);
 $('#ranking').hidden=!on;$('#scores-find').hidden=!on;
 $('#online-status').textContent=on?(online.registered()?'Les autres joueurs peuvent te trouver et te défier avec ce pseudo.':'Choisis un pseudo pour apparaître dans les classements et être trouvé.'):(globalThis.bagaWebNeedsInstall?'Installe BagaPlay sur ton écran d’accueil pour avoir un profil en ligne.':'Ton pseudo est enregistré sur ce téléphone.');
 if(on){scoresSearch??=playerSearch($('#scores-search'),'Chercher un joueur…',showProfile);
  const sel=$('#ranking-board');if(!sel.options.length)sel.innerHTML='<option value="coins">Pièces</option>'+recordBoards().map(b=>`<option value="${b.key}">${b.label}</option>`).join('');online.syncAll(saved,recordBoards().map(b=>b.key)).finally(loadRanking)}}
async function showProfile(r){const box=$('#profile');box.hidden=false;box.replaceChildren(el('div','muted-note','Chargement du profil…'));box.scrollIntoView({block:'start',behavior:'smooth'});
 let pr;try{pr=await online.profile(r.id)}catch(e){box.replaceChildren(el('div','muted-note',e.message));return}
 if(!pr){box.replaceChildren(el('div','muted-note','Joueur introuvable.'));return}
 const head=el('div','profile-head');head.append(el('span','avatar big',pr.name.slice(0,1).toUpperCase()),el('h2',null,pr.name));const close=el('button','text-btn','Fermer');close.onclick=()=>{box.hidden=true;scoresSearch?.clear()};head.append(close);
 const coins=el('div','profile-coins');coins.append(el('strong',null,(pr.scores.coins||0).toLocaleString('fr-FR')),el('small',null,' PIÈCES'));
 const values={...pr.scores,...pr.wins};const list=el('div','score-list');list.innerHTML=recordsHtml(values);
 const actions=el('div','profile-actions');if(!pr.me)for(const g of games.filter(x=>x.cat==='duel')){const b=el('button','primary',({chess:'Défier aux échecs',draughts:'Défier aux dames',connect4:'Défier au puissance 4'})[g.id]);b.onclick=()=>offerChallenge(pr,g.id);actions.append(b)}
 box.replaceChildren(head,coins,actions,list)}
async function loadRanking(){const board=$('#ranking-board').value,list=$('#ranking-list');list.innerHTML='<li class="muted">Chargement…</li>';const rows=await online.top(board);if(board!==$('#ranking-board').value)return;
 if(!rows){list.innerHTML='<li class="muted">Classement indisponible (connexion ?).</li>';return}
 if(!rows.length){list.innerHTML='<li class="muted">Personne pour l’instant. À toi !</li>';return}
 const u=v=>board==='coins'?String(v):fmt(board,v);list.replaceChildren(...rows.map((r,i)=>{const li=document.createElement('li');if(r.me)li.className='me';const rank=document.createElement('span');rank.textContent=i+1;const name=document.createElement('span');name.textContent=r.name;const sc=document.createElement('strong');sc.textContent=u(r.score);li.append(rank,name,sc);return li}))}
$('#ranking-board').onchange=loadRanking;
$('#wallet').onclick=showScores;$('#scores-back').onclick=goHome;
async function savePseudo(){if($('#pseudo').disabled){pseudoEditing=true;pseudoMode();$('#pseudo').focus();$('#pseudo').select();return}
 $('#pseudo-save').disabled=true;try{await online.setName($('#pseudo').value);online.askNotifications();pseudoEditing=false;$('#pseudo').blur()}catch(e){toast(e.message)}finally{$('#pseudo-save').disabled=false;renderScores()}}
$('#pseudo-save').onclick=savePseudo;$('#pseudo').addEventListener('keydown',e=>{if(e.key==='Enter')savePseudo()});

// ---------------------------------------------------------------- salon des jeux à deux
let lobbyGame=null,lobbyTimer=0,lobbySearch=null;
function openLobby(id){lobbyGame=id;const g=games.find(x=>x.id===id);$('#lobby-title').textContent=g.title;$('#lobby-rules').textContent=DUEL_RULES[id];$('#home').hidden=true;$('#scores').hidden=true;$('#lobby').hidden=false;lobbyStatus('');
 $('#lobby-ai').hidden=!AI_GAMES.includes(id);const on=online.enabled();$('#lobby-on').hidden=!on;$('#lobby-off').hidden=on;if(!on&&globalThis.bagaWebNeedsInstall)$('#lobby-off').textContent='Pour jouer en ligne, installe BagaPlay sur ton écran d’accueil : touche Partager puis « Sur l’écran d’accueil ».';
 if(on){lobbySearch??=playerSearch($('#lobby-search'),'Chercher un adversaire…',r=>offerChallenge(r,lobbyGame));lobbySearch.clear();
  if(!online.registered())lobbyStatus('Choisis un pseudo pour jouer en ligne.');loadMatches(true)}
 clearInterval(lobbyTimer);lobbyTimer=setInterval(()=>{if(!$('#lobby').hidden&&!document.hidden&&online.registered())loadMatches(false)},5000);window.scrollTo(0,0)}
function lobbyStatus(t){$('#lobby-status').textContent=t}
function matchStatus(m){if(m.status==='declined')return 'Refusé';if(m.status==='finished')return !m.winner?'Nulle':m.winner===m.my_color?'Gagné':'Perdu';if(!m.my_turn)return 'Son tour';return !m.from_me&&m.ply<=1?'Nouveau défi':'À toi !'}
async function loadMatches(loading){const box=$('#lobby-matches'),game=lobbyGame;if(!online.registered()){box.replaceChildren(el('div','muted-note','Tes parties apparaîtront ici.'));return}
 if(loading)box.replaceChildren(el('div','muted-note','Chargement…'));let list;
 try{list=online.visibleMatches(await online.myMatches()).filter(m=>m.game===game)}catch(e){if(loading||!box.children.length)box.replaceChildren(el('div','muted-note',e.message));return}
 if(game!==lobbyGame||$('#lobby').hidden)return;
 if(!list.length){box.replaceChildren(el('div','muted-note','Aucune partie. Cherche un adversaire ci-dessus.'));return}
 box.replaceChildren(...list.map(m=>matchRow(m,false)))}
// Ligne d'une partie. withGame : nom du jeu sous l'adversaire (accueil).
function matchRow(m,withGame){const st=matchStatus(m),b=el('button','score-row match-row'+(m.my_turn?' my-turn':'')+(m.status!=='active'?' match-over':''));const opp=m.my_color==='w'?m.black_name:m.white_name;
 const who=el('span','score-name',opp||'…');if(withGame){who.append(el('small','match-game',games.find(g=>g.id===m.game)?.title||''))}
 b.append(el('span','avatar',(opp||'?').slice(0,1).toUpperCase()),who,el('strong',null,st));b.onclick=()=>openMatch(m.id);return b}
async function openMatch(id){lobbyStatus('Ouverture de la partie…');try{const v=await online.getMatch(id);lobbyStatus('');launch(v.game,false,{mode:'online',match:v})}catch(e){lobbyStatus(e.message);toast(e.message)}}
$('#lobby-back').onclick=goHome;$('#lobby-local').onclick=()=>launch(lobbyGame,true);
$('#lobby-ai').onclick=()=>{dialog('Contre l’ordinateur','','Jouer',()=>launch(lobbyGame,true,{mode:'ai',level:+document.querySelector('#ai-level').value}),'Annuler',()=>{});$('#dialog-text').innerHTML='<select id="ai-level" aria-label="Difficulté"><option value="0">Facile</option><option value="1" selected>Normal</option><option value="2">Difficile</option></select>'};$('#lobby-refresh').onclick=()=>loadMatches(true);

// ---------------------------------------------------------------- démarrage en ligne, badges, notifications
// Accueil : parties en cours de tous les jeux (défis reçus compris) + résultats pas encore vus.
let homeSig='';
async function refreshTurns(){if(!online.registered()){$('#home-matches').hidden=true;return}let list;try{list=await online.myMatches()}catch{return}
 const t={};for(const m of list)if(m.my_turn)t[m.game]=(t[m.game]||0)+1;
 if(JSON.stringify(t)!==JSON.stringify(turns)){turns=t;if(!$('#home').hidden)renderCards(document.querySelector('[data-filter].active').dataset.filter)}
 const shown=online.visibleMatches(list),sig=JSON.stringify(shown.map(m=>[m.id,m.status,m.ply,m.my_turn,m.winner]));
 $('#home-matches').hidden=!shown.length;if(sig===homeSig)return;homeSig=sig;
 const mine=shown.filter(m=>m.my_turn).length;$('#home-matches-count').textContent=mine?(mine>1?mine+' à toi de jouer':'1 à toi de jouer'):shown.length+(shown.length>1?' parties':' partie');
 $('#home-matches-list').replaceChildren(...shown.map(m=>matchRow(m,true)))}
window.bagaResume=()=>{if(!online.enabled())return;if(!$('#home').hidden)refreshTurns();else if(!$('#lobby').hidden&&online.registered())loadMatches(false)};
window.bagaOpenMatch=id=>{if(!online.enabled()||!id)return;closeDialog();if(current){stop();current=null;paused=false}openMatch(id)};
try{window.BagaNative?.setLanguage?.(window.bagaLang)}catch{}
if(online.enabled()){online.hello().then(()=>{if(!online.registered())askPseudo(()=>refreshTurns());else refreshTurns();
  let pending='';try{pending=window.BagaNative?.takePendingMatch?.()||''}catch{}if(pending)window.bagaOpenMatch(pending)});
 setInterval(()=>{if(!document.hidden&&!$('#home').hidden)refreshTurns()},8000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)window.bagaResume()})}
