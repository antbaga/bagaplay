import {cookie} from './cookie.js';
import {breakout as breakoutNew} from './breakout.js';
import {celebrate,music,setMusicVolume,PANDA} from './rewards.js';
import {petanque,PETANQUE_RULES} from './petanque.js';
import * as online from './online.js';
import {puzzles,savedSudoku} from './puzzles.js';
import {savedRun} from './runs.js';
import {arcade} from './arcade.js';
import {duel,DUEL_RULES,initialState,AI_GAMES} from './duel.js';
import {formatDuration} from './engines.js';
import {binero} from './binero.js';
import {crossword,arrowword} from './words.js';
import {battleship} from './battleship.js';
import {bagastore} from './bagastore.js';
const $=s=>document.querySelector(s);
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e};
const games=[
 {id:'bagastore',title:'BagaStore',desc:'Ton supermarché, à ta façon.',cat:'puzzle',color:'#cfe8d6',tag:'JEU DE GESTION',hint:'',art:'store'},
 {id:'cookie',title:'Cookie Curling',desc:'',cat:'arcade',color:'#f8deb9',tag:'',hint:'Glisse le cookie vers le haut. Deux pâtisseries identiques fusionnent.',art:'cookie'},
 {id:'chess',title:'Échecs',desc:'',cat:'duel',color:'#eadfca',tag:'',hint:'',art:'chess'},
 {id:'draughts',title:'Dames',desc:'',cat:'duel',color:'#e0ebd1',tag:'',hint:'',art:'draughts'},
 {id:'connect4',title:'Puissance 4',desc:'',cat:'duel',color:'#d9e6f7',tag:'',hint:'',art:'connect4'},
 {id:'petanque',title:'Pétanque',desc:'',cat:'duel',color:'#f3e1c4',tag:'',hint:'',art:'petanque'},
 {id:'battleship',title:'Bataille navale',desc:'',cat:'duel',color:'#cfe5f3',tag:'',hint:'',art:'battleship'},
 {id:'2048',title:'2048',desc:'Fusionne, encore et encore.',cat:'puzzle',color:'#f3e2c0',tag:'LES CHIFFRES S’ALIGNENT',hint:'Glisse pour fusionner les nombres identiques.',art:'numbers'},
 {id:'snake',title:'Snake',desc:'Un petit creux sans fin.',cat:'arcade',color:'#dceeca',tag:'LE GRAND CLASSIQUE',hint:'Glisse pour diriger le serpent. Évite les murs et ta queue.',art:'snake'},
 {id:'blocks',title:'Blocs pastel',desc:'Tout finit par s’emboîter.',cat:'arcade',color:'#ded6f6',tag:'UNE LIGNE À LA FOIS',hint:'Glisse à gauche ou à droite. Touche pour tourner, glisse vers le bas pour poser.',art:'blocks'},
 {id:'memory',title:'Memory',desc:'Les jolies paires font la paire.',cat:'puzzle',color:'#f9d2c6',tag:'UN PEU DE MÉMOIRE',hint:'Retrouve toutes les paires en un minimum de coups.',art:'memory',lower:true},
 {id:'breakout',title:'Casse-briques',desc:'Rebondis de plus belle.',cat:'arcade',color:'#d2e7f2',tag:'LE BON REBOND',hint:'Fais glisser la raquette. Touche le plateau pour lancer la balle. 3 vies.',art:'breakout'},
 {id:'mines',title:'Démineur',desc:'Un petit air de mystère.',cat:'puzzle',color:'#eaefca',tag:'CHAQUE CASE COMPTE',hint:'Dévoile les cases sans mine. Les chiffres comptent les mines voisines.',art:'mines',lower:true},
 {id:'ttt',title:'Morpion',desc:'À toi de faire la ligne.',cat:'puzzle',color:'#f0d2de',tag:'À DEUX OU EN SOLO',hint:'Aligne 3 symboles. Tu joues les croix, à toi de commencer !',art:'ttt'},
 {id:'sudoku',title:'Sudoku',desc:'Un chiffre, une petite victoire.',cat:'puzzle',color:'#d4e8d5',tag:'L’ESPRIT AU CALME',hint:'Chaque ligne, colonne et carré doit contenir les chiffres 1 à 9.',art:'sudoku',lower:true},
 {id:'bird',title:'Petit envol',desc:'Un battement de plus.',cat:'arcade',color:'#f5e6b1',tag:'JUSTE UN PETIT TAP',hint:'Touche pour voler. Attrape les pièces entre les obstacles.',art:'bird'},
 {id:'slide',title:'Le taquin',desc:'Chaque pièce à sa place.',cat:'puzzle',color:'#e2d6f5',tag:'TOUT DANS L’ORDRE',hint:'Touche une case voisine du vide. Remets les nombres de 1 à 15 dans l’ordre.',art:'slide',lower:true},
 {id:'binero',title:'Binero',desc:'Des 0, des 1, de la logique.',cat:'puzzle',color:'#f7dccb',tag:'ZÉRO OU UN',hint:'',art:'binero',lower:true},
 {id:'crossword',title:'Mots croisés',desc:'Une définition, un mot.',cat:'puzzle',color:'#e6e0cf',tag:'LE PLAISIR DES MOTS',hint:'',art:'crossword',lower:true},
 {id:'arrowword',title:'Mots fléchés',desc:'Suis les flèches.',cat:'puzzle',color:'#d8e9e4',tag:'À LA FLÈCHE',hint:'',art:'arrowword',lower:true}
];
let saved={};try{saved=JSON.parse(localStorage.getItem('bagaplay-v1')||'{}')}catch{};
for(const id of ['memory','snake','sudoku','mines'])if(saved[id]!=null){if(saved[id+':1']==null)saved[id+':1']=saved[id];delete saved[id]}
// Volumes de 0 à 1 (0,5 = volume d'origine). Ancien réglage son marche/arrêt repris tel quel.
const vol=saved.vol||{music:saved.sound?.5:0,sfx:saved.sound?.5:0};setMusicVolume(vol.music);
let turns={};let difficulty=1,collected=0;let sound=vol.music>0,current=null,runtime=null,paused=false,ended=false,cleanups=[],tasks=[],time=0,raf=0;
function persist(){try{localStorage.setItem('bagaplay-v1',JSON.stringify(saved))}catch{}}
let audio;
function audioCtx(){try{audio??=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume()}catch{}return audio}
function tone(win=false){if(!vol.sfx)return;try{audioCtx();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(win?660:430,audio.currentTime);o.frequency.exponentialRampToValueAtTime(win?880:540,audio.currentTime+.1);g.gain.setValueAtTime(.11*vol.sfx,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.18);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.2)}catch{}}
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
 if(type==='petanque')s='<ellipse cx="63" cy="80" rx="52" ry="11" fill="#e2c99c"/><circle cx="44" cy="58" r="17" fill="#9aa7ad"/><path d="M31 52q13-9 27 0M30 63q14 8 28 0" stroke="#7c888e" stroke-width="2" fill="none"/><circle cx="39" cy="52" r="4" fill="#d9e1e4"/><circle cx="84" cy="62" r="14" fill="#b8a089"/><path d="M73 57q11-7 22 0M73 67q11 6 22 0" stroke="#96806b" stroke-width="2" fill="none"/><circle cx="80" cy="57" r="3" fill="#e6d8c8"/><circle cx="66" cy="79" r="5" fill="#e5603f"/>';
 if(type==='store'){s='<path d="M18 50 63 26l45 24-45 24Z" fill="#e8dcc6"/><path d="M18 50v12l45 24V74Z" fill="#c9b79c"/><path d="M108 50v12L63 86V74Z" fill="#b9a789"/><path d="M30 48l20-10v14l-20 10Z" fill="#f2e6d2"/><path d="M42 54 66 42l8 4-24 12Z" fill="#5b6470"/><path d="M62 64l24-12 8 4-24 12Z" fill="#5b6470"/><path d="M46 50l22-11" stroke="#e5603f" stroke-width="4"/><path d="M66 60l22-11" stroke="#7cb069" stroke-width="4"/><path d="M76 34l18 9-10 5-18-9Z" fill="#3f7fcf"/><rect x="52" y="10" width="30" height="12" rx="3" fill="#3f7a4f"/><rect x="56" y="13" width="22" height="6" rx="2" fill="#f5c542"/>'}
 if(type==='battleship'){s=rect(22,12,82,78,'#8fc3e3',8);for(let y=0;y<5;y++)for(let x=0;x<5;x++)s+=rect(26+x*15.5,16+y*14.5,13,12.5,'#c7e3f3',2);s+=rect(42,31,43,12,'#5f7d8c',6)+rect(26,60,13,28,'#5f7d8c',6)+txt(73,82,'✕','#e5603f',17)+'<circle cx="64" cy="66" r="3" fill="#fffaf0"/><circle cx="96" cy="23" r="3" fill="#fffaf0"/>'}
 if(type==='binero'){s=rect(26,12,77,78,'#fff9ec',7);const v=[1,0,0,1,0,1,1,0,0];for(let y=0;y<3;y++)for(let x=0;x<3;x++)s+=rect(30+x*24,16+y*24,21,21,v[y*3+x]?'#f2a98d':'#cfe3c3',3)+txt(40+x*24,32+y*24,v[y*3+x],v[y*3+x]?'#fffaf0':'#557a4b',14)}
 if(type==='crossword'){s=rect(26,12,77,78,'#3e5a49',5);const L=['M','O','T','','I','','L','E','S'];for(let y=0;y<3;y++)for(let x=0;x<3;x++)if(L[y*3+x])s+=rect(29+x*25,15+y*25,23,23,'#fffaf0',2)+txt(40+x*25,32+y*25,L[y*3+x],'#3e5a49',15)}
 if(type==='arrowword'){s=rect(24,12,80,78,'#fff9ec',6)+rect(28,16,23,23,'#9fd0bd',3)+'<path d="M39 31v10m-3-3 3 3 3-3M44 27h10m-3-3 3 3-3 3" stroke="#386655" stroke-width="2" fill="none" stroke-linecap="round"/>';for(const [x,y,ch] of [[53,16,'J'],[78,16,'E'],[28,41,'U'],[53,41,'']])s+=rect(x,y,23,23,ch?'#fffaf0':'#f6e6b8',2)+(ch?txt(x+11.5,y+17,ch,'#386655',14):'');s+=rect(78,41,23,23,'#fffaf0',2)+rect(28,66,73,20,'#f6e6b8',3)}
 return `<svg viewBox="0 0 126 102" aria-hidden="true">${s}</svg>`;
}
const isDuel=id=>games.find(g=>g.id===id)?.cat==='duel';
const TIMED=['mines','sudoku','binero','crossword','arrowword'];
// Records séparés par difficulté (clé « jeu:niveau »).
const DIFF={memory:4,snake:3,sudoku:4,mines:4,binero:4,crossword:3,arrowword:3},EXPERT=['mines','sudoku','binero'],LEVELS=['Facile','Normal','Difficile','Extrême'],levelName=(id,d)=>EXPERT.includes(id)&&d===3?'Expert':LEVELS[d],LEVEL_SHORT=['F','N','D','X'];
const base=k=>String(k).split(':')[0];
const recordKey=id=>DIFF[id]?`${id}:${difficulty}`:id;
// tous les tableaux de records : [{key, id, label}]
function recordBoards(){const out=[];for(const g of games){if(DIFF[g.id])for(let d=0;d<DIFF[g.id];d++)out.push({key:`${g.id}:${d}`,id:g.id,label:`${g.title} · ${levelName(g.id,d)}`});else out.push({key:g.id,id:g.id,label:g.title})}return out}
// Valeur affichée d'un record : durée lisible pour les jeux chronométrés, sinon nombre + unité.
const fmt=(id,v)=>TIMED.includes(base(id))?formatDuration(v):v+unit(base(id),v);
const unit=(id,v=2)=>isDuel(id)?(v>1?' victoires':' victoire'):TIMED.includes(id)?' s':games.find(g=>g.id===id)?.lower?' coups':'';
function renderCards(filter='all'){const selected=games.filter(g=>filter==='all'||g.cat===filter);$('#game-count').textContent=selected.length+' jeux';{const w=$('#wallet'),t='● '+(saved.coins||0)+' ›';if(w.textContent&&w.textContent!==t){w.classList.remove('bump');void w.offsetWidth;w.classList.add('bump')}w.textContent=t}$('#cards').innerHTML=selected.map(g=>`<button class="game-card" data-game="${g.id}" aria-label="Jouer à ${g.title}"><div class="card-art" style="--tint:${g.color}"><span class="card-tag">${g.tag}</span>${icon(g.art)}</div><h3>${g.title}</h3><p>${g.desc}</p><span class="card-arrow">↗</span>${turns[g.id]?`<span class="card-dot" aria-label="À toi de jouer">${turns[g.id]>1?turns[g.id]:''}</span>`:''}${DIFF[g.id]?(()=>{const parts=[];for(let d=0;d<DIFF[g.id];d++){const v=saved[g.id+':'+d];if(v!=null)parts.push(LEVEL_SHORT[d]+' '+fmt(g.id,v))}return parts.length?`<div class="card-record">✦ ${parts.join(' · ')}</div>`:''})():saved[g.id]!=null?`<div class="card-record">${isDuel(g.id)?'✦ ':'✦ Record : '}${fmt(g.id,saved[g.id])}${isDuel(g.id)?' en ligne':''}</div>`:''}</button>`).join('');document.querySelectorAll('[data-game]').forEach(b=>b.onclick=()=>{const id=b.dataset.game;if(isDuel(id))return openLobby(id);if(id==='bagastore')return launch(id);if(RESUME[id]?.()){const run=RESUME[id]();dialog('Grille en cours',`Tu as une grille ${levelName(id,run.level??1).toLowerCase()} commencée.`,'Reprendre',()=>resumeGame(id),'Nouvelle grille',()=>chooseDifficulty(id));return}if(DIFF[id])chooseDifficulty(id);else launch(id)})}
function chooseDifficulty(id){dialog('Difficulté','','Jouer',()=>{difficulty=+document.querySelector('#difficulty').value;launch(id)},'Annuler',()=>{});$('#dialog-text').innerHTML='<select id="difficulty" aria-label="Difficulté"><option value="0">Facile</option><option value="1" selected>Normal</option><option value="2">Difficile</option>'+(DIFF[id]>3?'<option value="3">'+(EXPERT.includes(id)?'Expert':'Extrême')+'</option>':'')+'</select>'}
// Sudoku : reprend la grille sauvegardée (après une sortie de l'app ou une mise en veille).
const RESUME={bagastore:()=>savedRun('bagastore'),sudoku:savedSudoku,binero:()=>savedRun('binero'),crossword:()=>savedRun('crossword'),arrowword:()=>savedRun('arrowword')};
function resumeGame(id){const run=RESUME[id]?.();if(!run)return;difficulty=run.level??1;launch(id,false,{resume:true})}
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));renderCards(b.dataset.filter)});
const VERSION='5.0.0';
function setVolume(kind,v){vol[kind]=Math.max(0,Math.min(1,v));saved.vol=vol;persist();if(kind==='music'){setMusicVolume(vol.music);sound=vol.music>0;if(!paused)music(sound)}}
function updateSound(){$('#footer-version').textContent=`BagaPlay ${VERSION} · Sans pub, sans compte.`}
// Réglages : son, langue, version.
function openSettings(){dialog('Réglages','','Fermer',()=>{},'',null);const t=$('#dialog-text');t.textContent='';
 const row=(label,control)=>{const r=el('div','setting-row');r.append(el('span','setting-label',label),control);t.append(r)};
 const slider=(kind,label)=>{const w=el('div','volume');const r=el('input');r.type='range';r.min=0;r.max=100;r.step=5;r.value=Math.round(vol[kind]*100);r.setAttribute('aria-label',label);const ic=el('span','vol-icon');
  const show=()=>{ic.textContent=vol[kind]===0?'🔇':vol[kind]<.35?'🔈':vol[kind]<.7?'🔉':'🔊'};show();r.oninput=()=>{setVolume(kind,r.value/100);show()};r.onchange=()=>{if(kind==='sfx')tone(true)};w.append(ic,r);row(label,w)};
 slider('music','Musique');slider('sfx','Bruitages');
 const nb=el('button','setting-link','…');row('Notifications',nb);(async()=>{const st=await online.pushState();const L={on:'Activées ✓',off:'Activer ›',denied:'Bloquées par le téléphone',unsupported:globalThis.bagaWebNeedsInstall?'Installe l’app d’abord':'Non disponibles ici',native:'Autoriser ›'};nb.textContent=L[st];nb.disabled=st==='denied'||st==='unsupported';
  nb.onclick=async()=>{try{if(st==='on'){await online.disablePush();nb.textContent=L.off;toast('Notifications désactivées')}else{const r=await online.enablePush();nb.textContent=r==='native'?'Autorisées ✓':L.on;toast('Notifications activées')}}catch(e){toast(e.message)}}})();
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
function goHome(){stop();if(saved.openGame){delete saved.openGame;persist()}const wasPaused=paused;current=null;paused=false;closeDialog();if(wasPaused)music(sound);$('#play').hidden=true;$('#scores').hidden=true;$('#lobby').hidden=true;clearInterval(lobbyTimer);$('#home').hidden=false;renderCards(document.querySelector('[data-filter].active').dataset.filter);homeSig='';if(online.enabled())refreshTurns();window.scrollTo(0,0)}
function pause(){if(!current||ended||paused)return;paused=true;runtime?.pause?.();music(false);dialog('Pause','','Reprendre',()=>{paused=false;music(sound)},'Retour aux jeux',leave)}
window.bagaPause=pause;window.bagaBack=()=>{if(!$('#scores').hidden||!$('#lobby').hidden){goHome();return true}if(!current)return false;if(ended){goHome();return true}if(paused){closeDialog();paused=false;music(sound);return true}pause();return true};
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else if(sound&&!paused)music(true)});$('#pause').onclick=pause;$('#back').onclick=()=>{if(ended||onlineDuel)leave();else{paused=true;dialog('Retour aux jeux ?',current.id==='cookie'?'Ta partie sera sauvegardée.':current.id==='bagastore'?'Ton magasin est sauvegardé, tu le retrouveras ici.':RESUME[current.id]?'Ta grille est sauvegardée, tu la retrouveras ici.':isDuel(current.id)?'La partie en cours sera perdue.':'La partie en cours sera terminée. Ton record est conservé.','Quitter la partie',leave,'Continuer',()=>paused=false)}};$('#restart').onclick=()=>{paused=true;dialog('On recommence ?',current?.id==='bagastore'?'Ton magasin actuel sera effacé et tu repartiras de zéro.':'Une nouvelle partie, une nouvelle chance.','Recommencer',()=>launch(current.id,true),'Continuer',()=>paused=false)};
function leave(){const d=current&&isDuel(current.id)?current.id:null;goHome();if(d)openLobby(d)}
let onlineDuel=false;
function launch(id,fresh=false,duelOpts=null){stop();if(RESUME[id]){saved.openGame=id;persist()}onlineDuel=!!(duelOpts?.match||duelOpts?.party);$('#play').classList.toggle('immersive',id==='petanque');$('#restart').hidden=onlineDuel;document.querySelectorAll('.scorebar>div').forEach(d=>d.classList.remove('turn'));collected=0;$('#run-coins').textContent='● 0';current=games.find(g=>g.id===id);ended=false;paused=false;time=0;closeDialog();$('#home').hidden=true;$('#play').hidden=false;$('#game-title').textContent=current.title;$('#lobby').hidden=true;clearInterval(lobbyTimer);$('#game-category').textContent=current.cat==='arcade'?'PETITE DOSE D’ARCADE':'PAUSE RÉFLEXION';$('#hint').textContent=current.hint;$('#score').textContent='0';$('#score-label').textContent=TIMED.includes(id)?'TEMPS':current.lower?'COUPS':id==='ttt'?'VICTOIRES':'SCORE';$('#best-label').textContent='RECORD';const key=recordKey(id);$('#best').textContent=saved[key]==null?'—':TIMED.includes(id)?formatDuration(saved[key]):saved[key];$('#board').innerHTML='';$('#controls').innerHTML='';window.scrollTo(0,0);
 const ctx={difficulty,fresh,duel:duelOpts,dialog,closeDialog,leave,toast,audio:audioCtx,volume:k=>vol[k],isPaused:()=>paused,
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
   else if(isDuel(id))dialog(o.title||'Partie terminée',text,'Rejouer',()=>launch(id,true,ctx.duel?.mode==='ai'||id==='petanque'?ctx.duel:null),'Retour',leave);
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
 runtime=(id==='bagastore'?bagastore:id==='petanque'?petanque:id==='battleship'?battleship:isDuel(id)?duel(id):id==='binero'?binero:id==='crossword'?crossword:id==='arrowword'?arrowword:id==='cookie'?cookie:id==='breakout'?breakoutNew:(puzzles[id]||arcade[id]))(ctx);fitBoard();let last=performance.now();function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;if(!paused&&!ended){time+=dt*1000;const due=tasks.filter(t=>t.at<=time);tasks=tasks.filter(t=>t.at>time);due.forEach(t=>t.fn());if(!ended)runtime?.update?.(dt)}raf=requestAnimationFrame(frame)}raf=requestAnimationFrame(frame);
 ctx.listen(document,'keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();runtime?.key?.(e.key)});
}
renderCards();updateSound();if(RESUME[saved.openGame]?.())setTimeout(()=>resumeGame(saved.openGame),50);document.addEventListener('pointerdown',()=>{if(sound)music(true)},{once:true});

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
 const actions=el('div','profile-actions');if(!pr.me)for(const g of games.filter(x=>x.cat==='duel'&&!isParty(x.id))){const b=el('button','primary',({chess:'Défier aux échecs',draughts:'Défier aux dames',connect4:'Défier au puissance 4'})[g.id]);b.onclick=()=>offerChallenge(pr,g.id);actions.append(b)}
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

// ---------------------------------------------------------------- salon (jeux à deux, pétanque à plusieurs)
let lobbyGame=null,lobbyTimer=0,lobbySearch=null,partyPick=[];
const PARTY_GAMES=['petanque'],isParty=id=>PARTY_GAMES.includes(id);
function openLobby(id){lobbyGame=id;const g=games.find(x=>x.id===id),party=isParty(id);$('#lobby-title').textContent=g.title;$('#lobby-rules').textContent=party?PETANQUE_RULES:DUEL_RULES[id];$('#home').hidden=true;$('#scores').hidden=true;$('#lobby').hidden=false;lobbyStatus('');
 $('#lobby-ai').hidden=!(AI_GAMES.includes(id)||party);$('#lobby-local').textContent=party?'Jouer à plusieurs sur ce téléphone':'Jouer à deux sur ce téléphone';
 const on=online.enabled();$('#lobby-on').hidden=!on;$('#lobby-off').hidden=on;if(!on&&globalThis.bagaWebNeedsInstall)$('#lobby-off').textContent='Pour jouer en ligne, installe BagaPlay sur ton écran d’accueil : touche Partager puis « Sur l’écran d’accueil ».';
 partyPick=[];renderPick();
 if(on){lobbySearch??=playerSearch($('#lobby-search'),'Chercher un joueur…',r=>isParty(lobbyGame)?addPick(r):offerChallenge(r,lobbyGame));lobbySearch.clear();lobbySearch.input.placeholder=party?'Inviter jusqu’à 5 joueurs…':'Défier un joueur…';
  if(!online.registered())lobbyStatus('Choisis un pseudo pour jouer en ligne.');loadMatches(true)}
 clearInterval(lobbyTimer);lobbyTimer=setInterval(()=>{if(!$('#lobby').hidden&&!document.hidden&&online.registered())loadMatches(false)},5000);window.scrollTo(0,0)}
function lobbyStatus(t){$('#lobby-status').textContent=t}
// Pétanque : choix des invités (puces), puis « Inviter ».
function addPick(r){if(partyPick.some(p=>p.id===r.id))return;if(partyPick.length>=5){toast('6 joueurs au maximum.');return}partyPick.push(r);renderPick();lobbySearch.clear()}
function renderPick(){const box=$('#lobby-pick');box.hidden=!isParty(lobbyGame)||!partyPick.length;const chips=$('#lobby-pick-list');chips.replaceChildren(...partyPick.map(r=>{const b=el('button','pick-chip',r.name+' ✕');b.setAttribute('aria-label','Retirer '+r.name);b.onclick=()=>{partyPick=partyPick.filter(p=>p!==r);renderPick()};return b}));$('#lobby-invite').textContent='Inviter ('+(partyPick.length+1)+' joueurs)'}
$('#lobby-invite').onclick=()=>needPseudo(async()=>{const picks=partyPick.slice();if(!picks.length)return;$('#lobby-invite').disabled=true;try{await online.createParty(lobbyGame,picks.map(r=>r.id));partyPick=[];renderPick();toast('Invitations envoyées');loadMatches(true);askPushOnce()}catch(e){toast(e.message)}finally{$('#lobby-invite').disabled=false}});
// Défi : il part dans « Mes parties » en attente, l'adversaire accepte ou refuse.
function offerChallenge(r,game){const g=games.find(x=>x.id===game);
 dialog('Défier '+r.name+' ?',`Défi ${GAME_PREP[game]}. ${r.name} l’accepte ou le refuse.`,'Défier',()=>needPseudo(async()=>{try{lobbyStatus('Envoi du défi…');await online.challenge(r.id,game,initialState(game));lobbyStatus('');toast('Défi envoyé à '+r.name);loadMatches(true);askPushOnce()}catch(e){lobbyStatus(e.message);toast(e.message)}}),'Annuler',()=>{})}
const GAME_PREP={chess:'aux échecs',draughts:'aux dames',connect4:'au puissance 4',petanque:'à la pétanque',battleship:'à la bataille navale'};
const gameTitle=id=>games.find(g=>g.id===id)?.title||'';
function others(g){return g.kind==='party'?(g.players||[]).filter(p=>!p.me).map(p=>p.name):[g.my_color==='w'?g.black_name:g.white_name]}
function inviteText(g){return g.kind==='party'?`${g.creator_name} t’invite ${GAME_PREP[g.game]}`:`${g.creator_name} te défie ${GAME_PREP[g.game]}`}
function gameStatus(g){
 if(g.kind==='party'){const pl=g.players||[];
  if(g.status==='pending')return g.invite?'Invitation':`En attente ${pl.filter(p=>p.accepted).length}/${pl.length}`;
  if(g.status==='cancelled')return 'Annulée';if(g.status==='finished')return g.winner===g.my_team?'Gagné':'Perdu';
  if(g.my_turn)return 'À toi de lancer';if(g.need_vote)return g.ask_name+' veut lancer';if(g.can_ask)return 'À ton équipe';
  if(g.ask_by)return g.ask_name+' demande';if(g.thrower_name)return 'Au tour de '+g.thrower_name;return String(g.turn_team)===String(g.my_team)?'Ton équipe':'Équipe adverse'}
 if(g.status==='pending')return g.invite?'Nouveau défi':'En attente';if(g.status==='declined')return 'Refusé';
 if(g.status==='finished')return !g.winner?'Nulle':g.winner===g.my_color?'Gagné':'Perdu';
 return g.my_turn?'À toi':'Au tour de '+others(g)[0]}
function gameSub(g,withGame){const parts=[];if(withGame)parts.push(gameTitle(g.game));
 if(g.kind==='party'){if(g.status==='pending')parts.push((g.players||[]).map(p=>p.name+(p.accepted?' ✓':p.accepted===false?' ✕':' ⏳')).join(' · '));else if(g.score)parts.push((String(g.my_team)==='1'?g.score[1]+' – '+g.score[0]:g.score[0]+' – '+g.score[1]))}
 return parts.join(' · ')}
// Ligne d'une partie (accueil et salon). Pastille rouge : c'est à moi d'agir.
function matchRow(g,withGame){const over=!['active','pending'].includes(g.status),b=el('button','score-row match-row'+(online.needsMe(g)?' my-turn':'')+(over?' match-over':''));const names=others(g);
 const who=el('span','score-name',names.length>2?names.slice(0,2).join(', ')+' +'+(names.length-2):names.join(', ')||'…');const sub=gameSub(g,withGame);if(sub)who.append(el('small','match-game',sub));
 const st=el('strong',null,gameStatus(g));if(online.needsMe(g))st.prepend(el('i','red-dot'));
 b.append(el('span','avatar'+(g.kind==='party'?' avatar-party':''),g.kind==='party'?'●':(names[0]||'?').slice(0,1).toUpperCase()),who,st);b.onclick=()=>gameAction(g);return b}
function gameAction(g){
 if(g.invite)return respondDialog(g);
 if(g.kind==='party'){
  if(g.status==='pending'){const cancel=()=>dialog('Annuler la partie ?','Les invitations seront retirées.','Annuler la partie',async()=>{try{await online.respondParty(g.id,false);refreshAll()}catch(e){toast(e.message)}},'Garder',()=>{});
   if(!g.from_me){toast('En attente des autres joueurs.');return}
   const pl=g.players||[],ok=pl.filter(p=>p.accepted).length;
   // au moins un invité a accepté : on peut lancer sans attendre les autres
   if(ok>=2)dialog('Lancer la partie ?',`${ok} joueurs sur ${pl.length} ont accepté. Ceux qui n’ont pas répondu ne joueront pas.`,'Lancer',async()=>{try{const v=await online.partyGo(g.id);refreshAll();launch(v.game,false,{mode:'online',party:v})}catch(e){toast(e.message)}},'Annuler la partie',()=>setTimeout(cancel,0));else cancel();return}
  if(g.status==='cancelled'){online.hideParty(g.id).catch(()=>{}).then(refreshAll);return}
  return openParty(g.id)}
 if(g.status==='pending'){dialog('Annuler le défi ?',others(g)[0]+' n’a pas encore répondu.','Annuler le défi',async()=>{try{await online.declineMatch(g.id);refreshAll()}catch(e){toast(e.message)}},'Garder',()=>{});return}
 if(g.status==='declined'){online.hideMatch(g.id).catch(()=>{}).then(refreshAll);return}
 openMatch(g.id)}
async function respond(g,yes){try{if(g.kind==='party')await online.respondParty(g.id,yes);else if(yes)await online.acceptMatch(g.id);else await online.declineMatch(g.id);toast(yes?'Défi accepté':'Défi refusé');if(yes)askPushOnce()}catch(e){toast(e.message)}refreshAll()}
function respondDialog(g){dialog(g.kind==='party'?'Invitation':'Nouveau défi',inviteText(g)+'.','Accepter',()=>respond(g,true),'Refuser',()=>respond(g,false))}
async function loadMatches(loading){const box=$('#lobby-matches'),game=lobbyGame;if(!online.registered()){box.replaceChildren(el('div','muted-note','Tes parties apparaîtront ici.'));return}
 if(loading)box.replaceChildren(el('div','muted-note','Chargement…'));let list;
 try{list=(await online.allGames()).filter(m=>m.game===game)}catch(e){if(loading||!box.children.length)box.replaceChildren(el('div','muted-note',e.message));return}
 if(game!==lobbyGame||$('#lobby').hidden)return;
 if(!list.length){box.replaceChildren(el('div','muted-note',isParty(game)?'Aucune partie. Invite des joueurs ci-dessus.':'Aucune partie. Défie un joueur ci-dessus.'));return}
 box.replaceChildren(...list.map(m=>matchRow(m,false)))}
async function openMatch(id){lobbyStatus('Ouverture de la partie…');try{const v=await online.getMatch(id);lobbyStatus('');if(v.status==='pending'){refreshAll();return gameAction({...v,kind:'match'})}launch(v.game,false,{mode:'online',match:v})}catch(e){lobbyStatus(e.message);toast(e.message)}}
async function openParty(id){lobbyStatus('Ouverture de la partie…');try{const v=await online.getParty(id);lobbyStatus('');if(v.status==='pending'){refreshAll();return gameAction(v)}launch(v.game,false,{mode:'online',party:v})}catch(e){lobbyStatus(e.message);toast(e.message)}}
$('#lobby-back').onclick=goHome;$('#lobby-local').onclick=()=>isParty(lobbyGame)?partyLocalDialog():launch(lobbyGame,true);
$('#lobby-ai').onclick=()=>{dialog('Contre l’ordinateur','','Jouer',()=>launch(lobbyGame,true,{mode:'ai',level:+document.querySelector('#ai-level').value}),'Annuler',()=>{});$('#dialog-text').innerHTML='<select id="ai-level" aria-label="Difficulté"><option value="0">Facile</option><option value="1" selected>Normal</option><option value="2">Difficile</option></select>'};$('#lobby-refresh').onclick=()=>loadMatches(true);
function partyLocalDialog(){dialog('Sur ce téléphone','Combien de joueurs ? Les équipes sont tirées au sort, on se passe le téléphone.','Jouer',()=>launch(lobbyGame,true,{mode:'local',players:+document.querySelector('#party-n').value}),'Annuler',()=>{});
 const sel=el('select');sel.id='party-n';sel.setAttribute('aria-label','Nombre de joueurs');for(let n=2;n<=6;n++){const o=el('option',null,n+' joueurs');o.value=n;if(n===2)o.selected=true;sel.append(o)}$('#dialog-text').append(sel)}

// ---------------------------------------------------------------- accueil : invitations, mes parties, pastilles
let homeSig='';
async function refreshTurns(){if(!online.registered()){$('#home-matches').hidden=true;$('#home-invites').hidden=true;return}let list;try{list=await online.allGames()}catch{return}
 const t={};for(const g of list)if(online.needsMe(g))t[g.game]=(t[g.game]||0)+1;
 if(JSON.stringify(t)!==JSON.stringify(turns)){turns=t;if(!$('#home').hidden)renderCards(document.querySelector('[data-filter].active').dataset.filter)}
 const invites=list.filter(g=>g.invite),mine=list.filter(g=>!g.invite);
 const sig=JSON.stringify(list.map(g=>[g.id,g.status,g.ply,online.needsMe(g),g.winner,g.ask_by,g.thrower,(g.players||[]).map(p=>p.accepted)]));
 $('#home-invites').hidden=!invites.length;$('#home-matches').hidden=!mine.length;if(sig===homeSig)return;homeSig=sig;
 $('#home-invites').replaceChildren(...invites.map(g=>{const r=el('div','invite-row');r.append(el('span','avatar'+(g.kind==='party'?' avatar-party':''),(g.creator_name||'?').slice(0,1).toUpperCase()),el('span','invite-text',inviteText(g)));
  const no=el('button','invite-btn no','✕'),yes=el('button','invite-btn yes','✓');no.setAttribute('aria-label','Refuser');yes.setAttribute('aria-label','Accepter');no.onclick=()=>respond(g,false);yes.onclick=()=>respond(g,true);r.append(no,yes);return r}));
 const act=mine.filter(online.needsMe).length;$('#home-matches-count').textContent=act?(act>1?act+' à toi de jouer':'1 à toi de jouer'):mine.length+(mine.length>1?' parties':' partie');
 $('#home-matches-list').replaceChildren(...mine.map(g=>matchRow(g,true)))}
function refreshAll(){homeSig='';if(!$('#home').hidden)refreshTurns();if(!$('#lobby').hidden)loadMatches(false)}
window.bagaResume=()=>{if(!online.enabled())return;if(!$('#home').hidden)refreshTurns();else if(!$('#lobby').hidden&&online.registered())loadMatches(false)};
// Ouvre une partie depuis une notification (duel ou pétanque).
window.bagaOpenMatch=async id=>{if(!online.enabled()||!id)return;closeDialog();if(current){stop();current=null;paused=false}
 try{const v=await online.getMatch(id);if(v.status==='pending')return gameAction({...v,kind:'match'});launch(v.game,false,{mode:'online',match:v})}catch{openParty(id)}};
// Propose une fois d'activer les notifications (après un premier défi envoyé ou accepté).
async function askPushOnce(){if(saved.pushAsked)return;const st=await online.pushState();if(st!=='off'&&st!=='native')return;saved.pushAsked=true;persist();
 if(st==='native'){online.askNotifications();return}
 dialog('Activer les notifications ?','Pour savoir quand on te défie, quand on accepte ton défi et quand c’est ton tour.','Activer',async()=>{try{await online.enablePush();toast('Notifications activées')}catch(e){toast(e.message)}},'Plus tard',()=>{})}
try{window.BagaNative?.setLanguage?.(window.bagaLang)}catch{}
if(online.enabled()){online.hello().then(()=>{if(!online.registered())askPseudo(()=>refreshTurns());else{refreshTurns();online.refreshPush()}
  let pending='';try{pending=window.BagaNative?.takePendingMatch?.()||''}catch{}if(!pending)pending=new URLSearchParams(location.search).get('open')||'';if(pending){history.replaceState(null,'',location.pathname);window.bagaOpenMatch(pending)}});
 navigator.serviceWorker?.addEventListener?.('message',e=>{if(e.data?.open)window.bagaOpenMatch(e.data.open)});
 setInterval(()=>{if(!document.hidden&&!$('#home').hidden)refreshTurns()},8000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)window.bagaResume()})}
