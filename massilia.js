// Massilia Biz : jeu de plateau immobilier à Marseille, contre l'ordinateur, à plusieurs sur le même téléphone ou en ligne.
// En ligne : chaque joueur joue son tour sur son téléphone ; après chaque action, l'état complet de la partie part au serveur
// (party_throw) avec les derniers événements, que les autres rejouent (dés, pions, loyers) en relevant la partie toutes les 2 s.
// Plateau en 3D (CSS) avec caméra qui suit les pions, dés 3D, cartes « Coup de Mistral » et « Tchatche », musique provençale.
import * as M from './massilia-engine.js';
import {SQUARES,GROUPS,DECKS,TOKENS,CHARACTERS,QUIPS,HUMAN_LINES,JAIL,JAIL_FINE,GO_SALARY} from './massilia-data.js';
import {savedRun,saveRun,clearRun} from './runs.js';
import {setMusicTheme} from './rewards.js';
import * as online from './online.js';
const onlinePlayer=online.player;

const SIZE=1220,CORNER=160,CELL=100,DEPTH=160;
const TOKEN_SVG={
 sardine:'<svg viewBox="0 0 48 48"><path d="M6 24c8-10 24-11 34-2l6-6v16l-6-6c-10 9-26 8-34-2z" fill="#7fb6e0"/><path d="M6 24c8-10 24-11 34-2-10 4-24 5-34 2z" fill="#c9e3f5"/><circle cx="13" cy="22" r="2" fill="#1d2a3a"/><path d="M20 19c2 3 2 7 0 10" stroke="#4d86b6" stroke-width="1.6" fill="none"/></svg>',
 pastis:'<svg viewBox="0 0 48 48"><path d="M13 8h22l-3 34H16z" fill="#e8f4fb" stroke="#9cc3d8" stroke-width="2"/><path d="M15 20h18l-2 20H17z" fill="#f4cf2d"/><circle cx="21" cy="27" r="2.5" fill="#fff3a8"/><circle cx="27" cy="33" r="2" fill="#fff3a8"/><path d="M31 6l6-4" stroke="#36a35e" stroke-width="3"/></svg>',
 boule:'<svg viewBox="0 0 48 48"><circle cx="24" cy="26" r="17" fill="#a7b0ba"/><circle cx="24" cy="26" r="17" fill="url(#g)" opacity=".6"/><path d="M9 21c10 4 20 4 30 0M9 31c10-4 20-4 30 0" stroke="#6b7480" stroke-width="2" fill="none"/><circle cx="18" cy="19" r="4" fill="#fff" opacity=".6"/></svg>',
 scooter:'<svg viewBox="0 0 48 48"><circle cx="12" cy="36" r="6" fill="#2b2b30"/><circle cx="36" cy="36" r="6" fill="#2b2b30"/><path d="M10 30h20l6-12h4" stroke="#e2453c" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M14 26h14v-6H16z" fill="#e2453c"/><path d="M36 12l6-2" stroke="#2b2b30" stroke-width="3"/></svg>',
 pointu:'<svg viewBox="0 0 48 48"><path d="M4 28h40l-6 10H10z" fill="#36a35e"/><path d="M4 28h40l-1 3H5z" fill="#e2453c"/><path d="M24 6v22" stroke="#7a4b2a" stroke-width="2.5"/><path d="M25 8l12 16H25z" fill="#fff"/><path d="M8 40c6 3 26 3 32 0" stroke="#5aa9e6" stroke-width="2" fill="none"/></svg>',
 savon:'<svg viewBox="0 0 48 48"><path d="M8 18l16-8 16 8v16l-16 8-16-8z" fill="#cfe5a8"/><path d="M8 18l16 8 16-8M24 26v16" stroke="#9cbf6b" stroke-width="2" fill="none"/><text x="14" y="33" font-size="7" font-weight="700" fill="#5d7c34" transform="rotate(-25 16 30)">72%</text></svg>'};
const BONNE_MERE='<svg viewBox="0 0 220 120" class="mb-bm"><circle cx="176" cy="30" r="16" fill="#ffd56b"/><path d="M0 120V92c30-10 50-30 80-34s50 8 70 0 40-20 70-10v72z" fill="#c9a26b"/><path d="M82 58h56v30H82z" fill="#f2e6cf"/><path d="M100 58V40h20v18" fill="#f2e6cf"/><path d="M104 40V22h12v18" fill="#e9d9b8"/><path d="M110 22V8" stroke="#e8b84a" stroke-width="4"/><circle cx="110" cy="6" r="4" fill="#f3c33a"/><path d="M86 70h8v18h-8zM126 70h8v18h-8zM104 66a6 6 0 0112 0v22h-12z" fill="#c4532f" opacity=".55"/><path d="M0 104c20-6 40 6 60 0s40-6 60 0 40 6 60 0 30-4 40 0v16H0z" fill="#3d8fd0"/><path d="M0 112c20-5 40 5 60 0s40-5 60 0 40 5 60 0 30-3 40 0v8H0z" fill="#2f6fb0"/></svg>';
const DICE_PIPS={1:[5],2:[1,9],3:[1,5,9],4:[1,3,7,9],5:[1,3,5,7,9],6:[1,3,4,6,7,9]};
const FACE_ROT={1:[0,0],2:[0,-90],3:[-90,0],4:[90,0],5:[0,90],6:[0,180]};

export function massilia(c){
 const EN=window.bagaLang==='en',T=(fr,en)=>EN?en:fr,X=a=>Array.isArray(a)?a[EN?1:0]:a,fmt=n=>(Math.round(n)).toLocaleString(EN?'en-GB':'fr-FR')+' €';
 const wrap=document.createElement('div');wrap.className='mb-wrap';c.board.append(wrap);
 const el=(tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e};
 let S=null,G=null,tasks=[],fast=false,over=false,lastAsk={},camMode='follow',focus=null,busyModal=false,thinkT=0;
 const SPEED=()=>fast?2.4:1;
 // ---- en ligne
 const opts=c.duel||{},ON=!!opts.party;let view=opts.party||null,knownPly=view?.ply??0,inflight=0,polling=false,left=false,sending=Promise.resolve();
 const myId=view?.my_id,mine=P=>!ON||(P&&P.pid===myId),local=P=>!!(P&&P.human&&mine(P));
 const buzz=p=>{try{navigator.vibrate?.(p)}catch{}};

 // ---- sons
 const au=()=>{const v=c.volume('sfx');if(!v)return null;const A=c.audio();return A?{A,v}:null};
 function tone(f0,f1,dur,type='sine',g=.06,delay=0){const a=au();if(!a)return;const {A,v}=a,t=A.currentTime+delay,o=A.createOscillator(),gn=A.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+dur);gn.gain.setValueAtTime(g*v,t);gn.gain.exponentialRampToValueAtTime(.0008,t+dur);o.connect(gn);gn.connect(A.destination);o.start(t);o.stop(t+dur+.02)}
 let nb=null;function noise(dur,g,freq,delay=0,type='lowpass'){const a=au();if(!a)return;const {A,v}=a;if(!nb){nb=A.createBuffer(1,A.sampleRate,A.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}const t=A.currentTime+delay,s=A.createBufferSource(),f=A.createBiquadFilter(),gn=A.createGain();s.buffer=nb;f.type=type;f.frequency.value=freq;gn.gain.setValueAtTime(g*v,t);gn.gain.exponentialRampToValueAtTime(.0008,t+dur);s.connect(f);f.connect(gn);gn.connect(A.destination);s.start(t,Math.random()*.4);s.stop(t+dur+.02)}
 const SFX={dice:()=>{for(let i=0;i<7;i++)noise(.05,.12,2500+Math.random()*2000,i*.07+Math.random()*.03,'bandpass')},hop:()=>tone(520,380,.06,'triangle',.05),
  cash:()=>{noise(.06,.1,4000,0,'highpass');tone(1320,1320,.12,'square',.04,.05);tone(1760,1760,.25,'square',.04,.14)},coins:()=>{for(let i=0;i<4;i++)tone(1500-i*120,1400-i*120,.08,'triangle',.04,i*.06)},
  card:()=>noise(.22,.08,3000,0,'bandpass'),mistral:()=>{noise(1.2,.09,500);noise(1,.05,900,.2)},gossip:()=>{for(let i=0;i<8;i++)tone(300+Math.random()*500,300+Math.random()*500,.05,'square',.02,i*.06)},
  jail:()=>{tone(180,120,.5,'square',.05);noise(.3,.12,800);tone(240,160,.4,'sawtooth',.03,.15)},build:()=>{for(let i=0;i<3;i++){noise(.04,.15,1800,i*.12);tone(700,500,.05,'square',.03,i*.12)}},
  go:()=>[523,659,784,1046].forEach((f,i)=>tone(f,f,.14,'triangle',.05,i*.08)),broke:()=>{tone(392,370,.35,'sawtooth',.05);tone(370,350,.35,'sawtooth',.05,.35);tone(350,260,.9,'sawtooth',.05,.7)},
  win:()=>[523,659,784,1046,784,1046,1318].forEach((f,i)=>tone(f,f,.22,'triangle',.06,i*.13)),double:()=>{tone(660,990,.15,'triangle',.05);tone(880,1320,.2,'triangle',.05,.12)},click:()=>tone(800,900,.04,'sine',.03),
  build2:()=>tone(400,800,.25,'triangle',.05),pay:()=>tone(700,420,.18,'triangle',.05)};
 // musique : tambourin et galoubet, un air de fête provençale (6/8)
 const MEL=[67,0,71,74,0,72,71,0,69,67,0,69,71,0,72,74,76,74,72,0,71,69,0,0, 67,0,71,74,0,76,79,0,76,74,0,72,71,0,69,67,69,71,69,0,66,67,0,0];
 const BASS=[43,50,47,50,45,50,43,50,47,50,42,50];
 setMusicTheme({period:190,play(A,step,vol){const t=A.currentTime,n=MEL[step%MEL.length],k=step%6;
  const note=(m,dur,type,g)=>{const o=A.createOscillator(),gn=A.createGain();o.type=type;o.frequency.value=440*2**((m-69)/12);gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(g*vol,t+.015);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);
   if(type==='triangle'){const lfo=A.createOscillator(),lg=A.createGain();lfo.frequency.value=6;lg.gain.value=5;lfo.connect(lg);lg.connect(o.frequency);lfo.start(t);lfo.stop(t+dur)}o.connect(gn);gn.connect(A.destination);o.start(t);o.stop(t+dur+.02)};
  if(n)note(n+12,.32,'triangle',.035);if(k===0||k===3)note(BASS[Math.floor(step/3)%BASS.length],.3,'sine',.05);
  if(k===0||k===3||k===5){const b=A.createBufferSource(),f=A.createBiquadFilter(),g=A.createGain();if(!A._nb){A._nb=A.createBuffer(1,A.sampleRate*.2,A.sampleRate);const d=A._nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
   b.buffer=A._nb;f.type='bandpass';f.frequency.value=k===0?220:900;g.gain.setValueAtTime((k===0?.07:.03)*vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+.12);b.connect(f);f.connect(g);g.connect(A.destination);b.start(t);b.stop(t+.13)}}});

 // ---- écran de départ
 function setup(){wrap.innerHTML='';const me=(onlinePlayer().name||T('Toi','You')).slice(0,14);
  const cfg={mode:opts.mode==='local'?'local':'ai',quick:true,opp:3,token:'sardine',name:me,local:[{name:me,token:'sardine',human:true},{name:T('Joueur 2','Player 2'),token:'pastis',human:true}]};
  const box=el('div','mb-setup');wrap.append(box);
  const draw=()=>{box.innerHTML=`<div class="mb-logo">${BONNE_MERE}<h1><span>MASSILIA</span><b>BIZ</b></h1><p>${T('Le jeu de l’immobilier où tout le monde connaît quelqu’un.','The property game where everybody knows a guy.')}</p></div>
   <div class="mb-tabs"><button data-m="ai" class="${cfg.mode==='ai'?'on':''}">${T('Contre l’ordinateur','Against the computer')}</button><button data-m="local" class="${cfg.mode==='local'?'on':''}">${T('À plusieurs','Pass and play')}</button></div>
   ${cfg.mode==='ai'?`<label class="mb-f">${T('Ton nom','Your name')}<input class="mb-name" maxlength="14" value="${esc(cfg.name)}"></label>
    <div class="mb-f">${T('Ton pion','Your token')}<div class="mb-toks">${TOKENS.map(t=>`<button data-t="${t.id}" class="${cfg.token===t.id?'on':''}" aria-label="${X(t.name)}">${TOKEN_SVG[t.id]}</button>`).join('')}</div></div>
    <div class="mb-f">${T('Adversaires','Opponents')}<div class="mb-chips">${[1,2,3,4,5].map(n=>`<button data-o="${n}" class="${cfg.opp===n?'on':''}">${n}</button>`).join('')}</div><small>${CHARACTERS.slice(0,cfg.opp).map(ch=>ch.name).join(' · ')}</small></div>`
   :`<div class="mb-f">${T('Joueurs (le même téléphone passe de main en main)','Players (pass the phone around)')}<div class="mb-rows">${cfg.local.map((p,i)=>`<div class="mb-row"><button class="mb-rt" data-i="${i}">${TOKEN_SVG[p.token]}</button><input data-i="${i}" maxlength="14" value="${esc(p.name)}"><button class="mb-rh" data-i="${i}">${p.human?T('👤 Humain','👤 Human'):T('🤖 Ordi','🤖 CPU')}</button>${cfg.local.length>2?`<button class="mb-rx" data-i="${i}" aria-label="${T('Retirer','Remove')}">✕</button>`:''}</div>`).join('')}</div>${cfg.local.length<6?`<button class="mb-add">+ ${T('Ajouter un joueur','Add a player')}</button>`:''}</div>`}
   <div class="mb-f">${T('Durée','Length')}<div class="mb-chips wide"><button data-q="1" class="${cfg.quick?'on':''}">${T('Rapide · 20 tours','Quick · 20 rounds')}</button><button data-q="0" class="${cfg.quick?'':'on'}">${T('Classique · jusqu’à la faillite','Classic · until bankruptcy')}</button></div></div>
   <button class="mb-go">${T('C’est parti, fada !','Let’s go!')}</button>`;
   box.querySelectorAll('[data-m]').forEach(b=>c.listen(b,'click',()=>{cfg.mode=b.dataset.m;SFX.click();draw()}));
   box.querySelectorAll('[data-t]').forEach(b=>c.listen(b,'click',()=>{cfg.token=b.dataset.t;SFX.click();draw()}));
   box.querySelectorAll('[data-o]').forEach(b=>c.listen(b,'click',()=>{cfg.opp=+b.dataset.o;SFX.click();draw()}));
   box.querySelectorAll('[data-q]').forEach(b=>c.listen(b,'click',()=>{cfg.quick=b.dataset.q==='1';SFX.click();draw()}));
   const nm=box.querySelector('.mb-name');if(nm)c.listen(nm,'input',()=>cfg.name=nm.value);
   box.querySelectorAll('.mb-row input').forEach(i=>c.listen(i,'input',()=>cfg.local[+i.dataset.i].name=i.value));
   box.querySelectorAll('.mb-rt').forEach(b=>c.listen(b,'click',()=>{const p=cfg.local[+b.dataset.i],used=cfg.local.map(q=>q.token);let k=TOKENS.findIndex(t=>t.id===p.token);for(let n=0;n<6;n++){k=(k+1)%6;if(!used.includes(TOKENS[k].id))break}p.token=TOKENS[k].id;SFX.click();draw()}));
   box.querySelectorAll('.mb-rh').forEach(b=>c.listen(b,'click',()=>{const p=cfg.local[+b.dataset.i];p.human=!p.human;if(!p.human&&/^(Joueur|Player) /.test(p.name))p.name=CHARACTERS[+b.dataset.i%5].name;SFX.click();draw()}));
   box.querySelectorAll('.mb-rx').forEach(b=>c.listen(b,'click',()=>{cfg.local.splice(+b.dataset.i,1);draw()}));
   const add=box.querySelector('.mb-add');if(add)c.listen(add,'click',()=>{const used=cfg.local.map(q=>q.token),t=TOKENS.find(t=>!used.includes(t.id));cfg.local.push({name:T('Joueur ','Player ')+(cfg.local.length+1),token:t.id,human:true});draw()});
   c.listen(box.querySelector('.mb-go'),'click',()=>{let players;
    if(cfg.mode==='ai'){const others=TOKENS.filter(t=>t.id!==cfg.token);players=[{name:(cfg.name||T('Toi','You')).trim().slice(0,14),token:cfg.token,human:true},...CHARACTERS.slice(0,cfg.opp).map((ch,i)=>({name:ch.name,token:others[i].id,human:false,char:CHARACTERS.indexOf(ch)}))]}
    else players=cfg.local.map((p,i)=>({name:(p.name||T('Joueur ','Player ')+(i+1)).trim().slice(0,14),token:p.token,human:p.human,char:p.human?null:i%5}));
    const seed=(Math.random()*2**31)|0;start(M.newGame({players,quick:cfg.quick,seed}),true)})};
  draw()}
 const esc=s=>String(s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[ch]);

 // ---- plateau
 function rectOf(i){const side=Math.floor(i/10),k=i%10;
  if(k===0){const pos=[[SIZE-CORNER/2,SIZE-CORNER/2],[CORNER/2,SIZE-CORNER/2],[CORNER/2,CORNER/2],[SIZE-CORNER/2,CORNER/2]][side];return {x:pos[0],y:pos[1],w:CORNER,h:CORNER,rot:side*90,corner:true}}
  const off=CORNER+(k-.5)*CELL;
  if(side===0)return {x:SIZE-off,y:SIZE-DEPTH/2,w:CELL,h:DEPTH,rot:0};if(side===1)return {x:DEPTH/2,y:SIZE-off,w:CELL,h:DEPTH,rot:90};
  if(side===2)return {x:off,y:DEPTH/2,w:CELL,h:DEPTH,rot:180};return {x:SIZE-DEPTH/2,y:off,w:CELL,h:DEPTH,rot:270}}
 // emplacement d'un pion sur sa case (décalé pour que plusieurs pions tiennent)
 function spot(i,slot,inJail=false){const r=rectOf(i),a=r.rot*Math.PI/180,ox=((slot%3)-1)*26,oy=(Math.floor(slot/3)-.5)*30+(r.corner?0:24);
  let lx=ox,ly=oy;if(r.corner&&i===JAIL){if(inJail){lx=ox*.8+28;ly=oy*.8-30}else{lx=ox-30;ly=oy+34}}
  return [r.x+lx*Math.cos(a)-ly*Math.sin(a),r.y+lx*Math.sin(a)+ly*Math.cos(a)]}
 function squareHTML(i){const s=SQUARES[i],r=rectOf(i),grp=s.g?GROUPS[s.g]:null;
  const price=s.price?`<em>${fmt(s.price)}</em>`:s.t==='tax'?`<em>${fmt(s.amount)}</em>`:'';
  const inner=r.corner?`<div class="mb-corner c${i}"><i>${s.icon}</i><b>${X(s.name)}</b>${i===0?`<small>+${GO_SALARY} €</small>`:''}</div>`:
   `${grp?`<div class="mb-band" style="background:${grp.color}"><div class="mb-houses"></div></div>`:''}<div class="mb-sqbody ${s.t}"><b>${X(s.name)}</b><i>${s.icon}</i>${price}</div><div class="mb-own"></div>`;
  return `<div class="mb-sq${r.corner?' corner':''}" data-i="${i}" style="left:${r.x-r.w/2}px;top:${r.y-r.h/2}px;width:${r.w}px;height:${r.h}px;transform:rotate(${r.rot}deg)">${inner}</div>`}
 function start(state,isNew){S=state;S.ev=S.ev||[];over=false;wrap.innerHTML='';
  G={root:el('div','mb-game')};wrap.append(G.root);
  G.root.innerHTML=`<div class="mb-view"><div class="mb-board"><div class="mb-center"><div class="mb-sea"></div>${BONNE_MERE}<h2><span>MASSILIA</span><b>BIZ</b></h2>
    <div class="mb-deck mistral"><i>🌬️</i><b>${X(SQUARES[7].name)}</b></div><div class="mb-deck tchatche"><i>💬</i><b>${X(SQUARES[2].name)}</b></div></div>${SQUARES.map((_,i)=>squareHTML(i)).join('')}<div class="mb-tokens"></div></div></div>
   <div class="mb-players"></div><div class="mb-toast"></div><div class="mb-dice"><div class="mb-die"></div><div class="mb-die"></div></div>
   <div class="mb-tools"><button class="mb-cam" aria-label="${T('Vue d’ensemble','Overview')}">🗺️</button><button class="mb-fast" aria-label="${T('Accélérer','Speed up')}">⏩</button>${ON?`<button class="mb-quit" aria-label="${T('Quitter la partie','Leave the game')}">🏳️</button>`:''}</div>
   <div class="mb-panel"></div><div class="mb-modal" hidden></div>`;
  G.view=G.root.querySelector('.mb-view');G.board=G.root.querySelector('.mb-board');G.tokens=G.root.querySelector('.mb-tokens');G.dice=[...G.root.querySelectorAll('.mb-die')];G.panel=G.root.querySelector('.mb-panel');G.modal=G.root.querySelector('.mb-modal');
  G.dice.forEach(d=>{d.innerHTML=[1,2,3,4,5,6].map(f=>`<div class="mb-face f${f}">${[1,2,3,4,5,6,7,8,9].map(k=>`<i class="${DICE_PIPS[f].includes(k)?'on':''}"></i>`).join('')}</div>`).join('');d.dataset.v='1'});
  G.toks=S.players.map(p=>{const t=el('div','mb-tok',`<div class="mb-tokin" style="--c:${TOKENS.find(x=>x.id===p.token).color}">${TOKEN_SVG[p.token]}</div><div class="mb-tokshadow"></div>`);G.tokens.append(t);return {el:t,pos:p.pos,x:0,y:0,z:0,hop:null}});
  G.cam={x:SIZE/2,y:SIZE/2,rz:0,tilt:42,z:.3};G.money=S.players.map(p=>p.money);
  c.listen(G.root.querySelector('.mb-cam'),'click',()=>{camMode=camMode==='follow'?'overview':'follow';SFX.click();G.root.querySelector('.mb-cam').classList.toggle('on',camMode==='overview')});
  c.listen(G.root.querySelector('.mb-fast'),'click',()=>{fast=!fast;SFX.click();G.root.querySelector('.mb-fast').classList.toggle('on',fast)});
  if(ON)c.listen(G.root.querySelector('.mb-quit'),'click',leaveParty);
  G.board.querySelectorAll('.mb-sq').forEach(sq=>c.listen(sq,'click',()=>{if(!busyModal&&!tasks.length)propCard(+sq.dataset.i)}));
  players();refreshBoard();placeTokens(true);
  if(isNew){run(introSeq())}else{run(function*(){toast(T('Reprise de la partie','Game resumed'));yield .8}())}
  cameraTo(cur().pos)}
 const cur=()=>M.cur(S);
 function players(){const box=G.root.querySelector('.mb-players');box.innerHTML=S.players.map((p,i)=>`<button class="mb-pl${p.out?' out':''}${i===S.turn?' on':''}" data-i="${i}" style="--c:${TOKENS.find(t=>t.id===p.token).color}"><span class="mb-plt">${TOKEN_SVG[p.token]}</span><span class="mb-pln">${esc(p.name)}</span><b class="mb-plm">${p.out?T('Faillite','Bankrupt'):fmt(G.money[i])}</b>${p.jail?'<i class="mb-pljail">🚔</i>':''}${p.cards.length?'<i class="mb-plcard">🎟️</i>':''}<span class="mb-bubble"></span></button>`).join('');
  box.querySelectorAll('.mb-pl').forEach(b=>c.listen(b,'click',()=>{if(!busyModal&&!tasks.length)assets(+b.dataset.i,true)}))}
 function refreshBoard(){for(let i=0;i<SQUARES.length;i++){const sq=G.board.querySelector(`.mb-sq[data-i="${i}"]`);if(!sq)continue;const o=S.own[i];
  sq.classList.toggle('mort',!!S.mort[i]);const own=sq.querySelector('.mb-own');if(own){own.style.background=o!=null?TOKENS.find(t=>t.id===S.players[o].token).color:'transparent';own.classList.toggle('on',o!=null)}
  const hs=sq.querySelector('.mb-houses');if(hs){const h=S.houses[i]||0,want=h===5?'villa':String(h);if(hs.dataset.h!==want){hs.dataset.h=want;hs.innerHTML=h===5?cube('villa'):Array.from({length:h},()=>cube('cab')).join('')}}}}
 const cube=k=>`<div class="mb-cube ${k}"><i class="ft"></i><i class="bk"></i><i class="lt"></i><i class="rt"></i><i class="tp"></i></div>`;

 // ---- caméra : suit le pion (côté du plateau tourné vers soi), ou vue d'ensemble
 function cameraTo(i){focus=i}
 function camTarget(){const vw=G.view.clientWidth,vh=G.view.clientHeight;const fit=Math.min(vw/SIZE,vh/SIZE*1.25)*.98;
  if(camMode==='overview'||focus==null)return {x:SIZE/2,y:SIZE/2,rz:G.cam.rz-((G.cam.rz%360)+360)%360,tilt:36,z:fit*1.0};
  const side=Math.floor(focus/10)%4,[x,y]=spot(focus,1);let rz=-side*90;while(rz-G.cam.rz>180)rz-=360;while(rz-G.cam.rz<-180)rz+=360;
  const ix=SIZE/2+(x-SIZE/2)*.9,iy=SIZE/2+(y-SIZE/2)*.9;return {x:ix,y:iy,rz,tilt:55,z:fit*2.05}}
 function applyCam(dt){const t=camTarget(),k=Math.min(1,dt*3.2*SPEED());for(const key of ['x','y','rz','tilt','z'])G.cam[key]+=(t[key]-G.cam[key])*k;
  const vw=G.view.clientWidth,vh=G.view.clientHeight,cm=G.cam;
  G.board.style.transform=`translate(${vw/2}px,${vh*(camMode==='overview'||focus==null?.52:.64)}px) rotateX(${cm.tilt}deg) rotateZ(${cm.rz}deg) scale(${cm.z}) translate(${-cm.x}px,${-cm.y}px)`;
  G.board.style.setProperty('--rz',`${-cm.rz}deg`);G.board.style.setProperty('--tilt',`${-cm.tilt}deg`)}
 // ---- pions
 function slotOf(pi){const p=S.players[pi];let k=0;for(let j=0;j<pi;j++){const q=S.players[j];if(!q.out&&G.toks[j].pos===G.toks[pi].pos)k++}return k}
 function placeTokens(snap){S.players.forEach((p,i)=>{const tk=G.toks[i];if(tk.hop)return;const [x,y]=spot(tk.pos,slotOf(i),p.jail>0&&tk.pos===JAIL);if(snap){tk.x=x;tk.y=y}tk.tx=x;tk.ty=y;tk.el.classList.toggle('out',p.out)})}
 function drawTokens(dt){G.toks.forEach((tk,i)=>{if(tk.hop){const h=tk.hop;h.t+=dt*SPEED();const u=Math.min(1,h.t/h.d);tk.x=h.x0+(h.x1-h.x0)*u;tk.y=h.y0+(h.y1-h.y0)*u;tk.z=Math.sin(u*Math.PI)*(h.high||34);if(u>=1){tk.hop=null;tk.z=0}}
   else{tk.x+=(tk.tx-tk.x)*Math.min(1,dt*8);tk.y+=(tk.ty-tk.y)*Math.min(1,dt*8)}
   tk.el.style.transform=`translate(${tk.x}px,${tk.y}px)`;tk.el.firstChild.style.transform=`translateZ(${4+tk.z}px) rotateZ(var(--rz)) rotateX(var(--tilt))`;tk.el.classList.toggle('cur',i===S.turn)})}
 function hop(pi,to,d=.22,high){const tk=G.toks[pi],[x0,y0]=[tk.x,tk.y];tk.pos=to;const [x1,y1]=spot(to,slotOf(pi),false);tk.hop={x0,y0,x1,y1,t:0,d,high};tk.tx=x1;tk.ty=y1}

 // ---- dés 3D
 function rollDice(d){const box=G.root.querySelector('.mb-dice');box.classList.add('show');SFX.dice();
  G.dice.forEach((die,k)=>{const [rx,ry]=FACE_ROT[d[k]],sx=360*(2+Math.floor(Math.random()*2)),sy=360*(2+Math.floor(Math.random()*2));die.style.transition='none';die.style.transform=`rotateX(${Math.random()*360}deg) rotateY(${Math.random()*360}deg)`;void die.offsetWidth;
   die.style.transition=`transform ${.9/SPEED()}s cubic-bezier(.2,.9,.3,1.05)`;die.style.transform=`rotateX(${rx+sx}deg) rotateY(${ry+sy}deg)`})}
 const hideDice=()=>G.root.querySelector('.mb-dice').classList.remove('show');

 // ---- petites interfaces : toast, bulles, argent qui vole
 function toast(text,kind=''){const t=G.root.querySelector('.mb-toast');t.textContent=text;t.className='mb-toast show '+kind;clearTimeout(G.toastT);G.toastT=setTimeout(()=>t.classList.remove('show'),2200/SPEED())}
 function say(pi,key){const p=S.players[pi];let line=null;if(p.char!=null){const L=CHARACTERS[p.char].lines[key];if(L)line=L[Math.floor(Math.random()*L.length)]}else if(HUMAN_LINES[key])line=HUMAN_LINES[key][0];if(!line)return;
  const b=G.root.querySelector(`.mb-pl[data-i="${pi}"] .mb-bubble`);if(!b)return;b.textContent=X(line);b.classList.remove('show');void b.offsetWidth;b.classList.add('show');clearTimeout(b._t);b._t=setTimeout(()=>b.classList.remove('show'),2600/SPEED())}
 function floatMoney(pi,amount){const chip=G.root.querySelector(`.mb-pl[data-i="${pi}"]`);if(!chip)return;const f=el('div','mb-float '+(amount>0?'plus':'minus'),(amount>0?'+':'−')+fmt(Math.abs(amount)));chip.append(f);setTimeout(()=>f.remove(),1400)}
 function syncMoney(){S.players.forEach((p,i)=>{G.money[i]=p.money});players()}

 // ---- modales
 function modal(html,cls=''){G.modal.innerHTML=`<div class="mb-card ${cls}">${html}</div>`;G.modal.hidden=false;busyModal=true;return G.modal.firstChild}
 function closeModal(){G.modal.hidden=true;G.modal.innerHTML='';busyModal=false}
 function rentRows(i){const s=SQUARES[i];if(s.t==='station')return [1,2,3,4].map(n=>`<tr><td>${n} ${T(n>1?'lignes':'ligne',n>1?'lines':'line')}</td><td>${fmt(25*2**(n-1))}</td></tr>`).join('');
  if(s.t==='util')return `<tr><td>${T('Une possédée','One owned')}</td><td>4 × ${T('les dés','dice')}</td></tr><tr><td>${T('Les deux','Both')}</td><td>10 × ${T('les dés','dice')}</td></tr>`;
  const r=M.rentTable(i);return `<tr><td>${T('Loyer','Rent')}</td><td>${fmt(r[0])}</td></tr><tr><td>${T('Quartier complet','Full set')}</td><td>${fmt(r[0]*2)}</td></tr>${[1,2,3,4].map(h=>`<tr><td>${'🏠'.repeat(h)} ${h} ${T(h>1?'cabanons':'cabanon',h>1?'huts':'hut')}</td><td>${fmt(r[h])}</td></tr>`).join('')}<tr><td>🏰 ${T('Villa','Villa')}</td><td>${fmt(r[5])}</td></tr>`}
 function propCard(i,mode=null){const s=SQUARES[i];if(!s.price&&!s.tag)return;const o=S.own[i],grp=s.g?GROUPS[s.g]:null,p=cur();
  const head=grp?`<div class="mb-ph" style="background:${grp.color}"><small>${T('Titre de propriété','Title deed')}</small><h3>${X(s.name)}</h3></div>`:`<div class="mb-ph plain"><i>${s.icon}</i><h3>${X(s.name)}</h3></div>`;
  let body=`<p class="mb-tag">${X(s.tag||['',''])}</p>`;
  if(s.price)body+=`<table class="mb-rents">${rentRows(i)}</table><p class="mb-small">${s.t==='prop'?`${T('Cabanon','Hut')} : ${fmt(M.houseCost(i))} · `:''}${T('Hypothèque','Mortgage')} : ${fmt(M.mortgageValue(i))}</p>
   <p class="mb-ownl">${o==null?`${T('À vendre','For sale')} : <b>${fmt(s.price)}</b>`:`${T('Propriétaire','Owner')} : <b>${esc(S.players[o].name)}</b>${S.mort[i]?` · ${T('hypothéquée','mortgaged')}`:''}`}</p>`;
  let btns='';
  if(mode==='buy')btns=`<button class="mb-b primary" data-a="buy" ${p.money<s.price?'disabled':''}>${T('Acheter','Buy')} · ${fmt(s.price)}</button><button class="mb-b" data-a="decline">${T('Non merci','No thanks')}</button>`;
  else{if(local(p)&&o===p.id&&S.phase!=='over'){if(M.canBuild(S,i))btns+=`<button class="mb-b primary" data-a="build">🏠 ${T('Construire','Build')} · ${fmt(M.houseCost(i))}</button>`;if(M.canSell(S,i))btns+=`<button class="mb-b" data-a="sell">${T('Vendre un cabanon','Sell a hut')} · +${fmt(M.houseCost(i)/2)}</button>`;
    if(M.canMortgage(S,i))btns+=`<button class="mb-b" data-a="mortgage">${T('Hypothéquer','Mortgage')} · +${fmt(M.mortgageValue(i))}</button>`;if(M.canUnmortgage(S,i))btns+=`<button class="mb-b" data-a="unmortgage">${T('Lever l’hypothèque','Pay off mortgage')} · ${fmt(M.unmortgageCost(i))}</button>`}
   btns+=`<button class="mb-b" data-a="close">${T('Fermer','Close')}</button>`}
  const card=modal(head+body+`<div class="mb-btns">${btns}</div>`,'prop');
  card.querySelectorAll('[data-a]').forEach(b=>c.listen(b,'click',()=>{const a=b.dataset.a;closeModal();if(a==='close')return panel();human({a,i})}))}
 function assets(pi,readOnly=false){const p=S.players[pi],mine=M.propsOf(S,pi),me=!readOnly&&local(p)&&pi===S.turn;
  const groups=[...new Set(mine.map(i=>SQUARES[i].g||SQUARES[i].t))];
  const rows=groups.map(g=>`<div class="mb-ag">${mine.filter(i=>(SQUARES[i].g||SQUARES[i].t)===g).map(i=>{const s=SQUARES[i],h=S.houses[i]||0;return `<div class="mb-ar${S.mort[i]?' mort':''}"><span class="mb-dot" style="background:${s.g?GROUPS[s.g].color:'#c9c2b0'}"></span><b>${X(s.name)}</b><em>${h===5?'🏰':'🏠'.repeat(h)}${S.mort[i]?'⛔':''}</em>
   ${me?`${M.canBuild(S,i)?`<button data-a="build" data-i="${i}" aria-label="${T('Construire','Build')}">＋🏠</button>`:''}${M.canSell(S,i)?`<button data-a="sell" data-i="${i}" aria-label="${T('Vendre','Sell')}">－🏠</button>`:''}${M.canMortgage(S,i)?`<button data-a="mortgage" data-i="${i}">${T('Hypo','Mortg.')}</button>`:''}${M.canUnmortgage(S,i)?`<button data-a="unmortgage" data-i="${i}">${T('Lever','Repay')}</button>`:''}`:''}</div>`}).join('')}</div>`).join('');
  const card=modal(`<h3>${esc(p.name)} · ${fmt(p.money)}</h3><p class="mb-small">${T('Fortune','Net worth')} : ${fmt(M.netWorth(S,p))}${p.cards.length?` · 🎟️ ${T('carte de sortie','get-out card')}`:''}</p><div class="mb-assets">${rows||`<p class="mb-small">${T('Aucune propriété pour l’instant.','No property yet.')}</p>`}</div><div class="mb-btns"><button class="mb-b" data-x="1">${T('Fermer','Close')}</button></div>`,'assets');
  card.querySelectorAll('[data-a]').forEach(b=>c.listen(b,'click',()=>{if(M.act(S,{a:b.dataset.a,i:+b.dataset.i})){const evs=S.ev.splice(0);quickEvents(evs);assets(pi)}}));
  c.listen(card.querySelector('[data-x]'),'click',()=>{closeModal();panel()})}
 // effets immédiats (construction depuis la fiche) sans bloquer
 function quickEvents(evs){push(evs);for(const e of evs){if(e.t==='build'){SFX.build()}if(e.t==='sell'||e.t==='mortgage')SFX.coins();if(e.t==='unmortgage')SFX.pay()}refreshBoard();syncMoney();panel();save()}

 // ---- échanges
 function tradeDialog(){const p=cur(),others=M.active(S).filter(o=>o!==p);let to=others[0].id,give=new Set(),get=new Set(),money=0;
  const tradable=(i,pid)=>S.own[i]===pid&&(SQUARES[i].t!=='prop'||M.GROUP_IDX[SQUARES[i].g].every(j=>!S.houses[j]));
  const draw=()=>{const o=S.players[to],mine=M.propsOf(S,p.id).filter(i=>tradable(i,p.id)),theirs=M.propsOf(S,to).filter(i=>tradable(i,to));
   const list=(arr,set,side)=>arr.length?arr.map(i=>`<button class="mb-ti${set.has(i)?' on':''}" data-s="${side}" data-i="${i}"><span class="mb-dot" style="background:${SQUARES[i].g?GROUPS[SQUARES[i].g].color:'#c9c2b0'}"></span>${X(SQUARES[i].name)}</button>`).join(''):`<p class="mb-small">${T('Rien à échanger','Nothing to trade')}</p>`;
   const card=modal(`<h3>🤝 ${T('Proposer un échange','Propose a trade')}</h3><div class="mb-chips">${others.map(q=>`<button data-to="${q.id}" class="${q.id===to?'on':''}">${esc(q.name)}</button>`).join('')}</div>
    <div class="mb-tcols"><div><h4>${T('Tu donnes','You give')}</h4>${list(mine,give,'g')}</div><div><h4>${T('Tu reçois','You get')}</h4>${list(theirs,get,'r')}</div></div>
    <div class="mb-money"><button data-m="-50">−50</button><button data-m="-10">−10</button><b>${money>=0?`${T('Tu paies','You pay')} ${fmt(money)}`:`${esc(o.name)} ${T('paie','pays')} ${fmt(-money)}`}</b><button data-m="10">+10</button><button data-m="50">+50</button></div>
    <div class="mb-btns"><button class="mb-b primary" data-go="1" ${M.tradeOk(S,{from:p.id,to,give:[...give],get:[...get],money})?'':'disabled'}>${T('Proposer','Propose')}</button><button class="mb-b" data-x="1">${T('Annuler','Cancel')}</button></div>`,'trade');
   card.querySelectorAll('[data-to]').forEach(b=>c.listen(b,'click',()=>{to=+b.dataset.to;give.clear();get.clear();money=0;draw()}));
   card.querySelectorAll('.mb-ti').forEach(b=>c.listen(b,'click',()=>{const set=b.dataset.s==='g'?give:get,i=+b.dataset.i;set.has(i)?set.delete(i):set.add(i);draw()}));
   card.querySelectorAll('[data-m]').forEach(b=>c.listen(b,'click',()=>{money=Math.max(-o.money,Math.min(p.money,money+ +b.dataset.m));draw()}));
   c.listen(card.querySelector('[data-x]'),'click',()=>{closeModal();panel()});
   c.listen(card.querySelector('[data-go]'),'click',()=>{const t={from:p.id,to,give:[...give],get:[...get],money};closeModal();if(o.human)askHuman(t,()=>panel());else{const ok=M.aiAccepts(S,t);if(ok){M.doTrade(S,t);S.ev.length=0;SFX.cash();say(to,'buy');toast(T(`${o.name} accepte l’échange !`,`${o.name} accepts the trade!`),'good');refreshBoard();syncMoney();save()}else{say(to,'pay');toast(T(`${o.name} refuse : « Tu me prends pour un pigeon ? »`,`${o.name} refuses: “Do you take me for a fool?”`),'bad')}panel()}})};
  draw()}
 function tradeText(t){const A=S.players[t.from],B=S.players[t.to],names=a=>a.map(i=>X(SQUARES[i].name)).join(', ');const parts=[];
  if(t.give.length)parts.push(`${esc(A.name)} ${T('donne','gives')} <b>${names(t.give)}</b>`);if(t.get.length)parts.push(`${T('contre','for')} <b>${names(t.get)}</b>`);
  if(t.money>0)parts.push(`${T('et paie','and pays')} <b>${fmt(t.money)}</b>`);if(t.money<0)parts.push(`${T('et reçoit','and receives')} <b>${fmt(-t.money)}</b>`);
  if(!t.give.length)parts.unshift(`${esc(A.name)} ${T('propose','offers')} <b>${fmt(Math.abs(t.money))}</b>`);return parts.join(' ')}
 function askHuman(t,done){const B=S.players[t.to];const card=modal(`<h3>📩 ${T('Proposition pour','Offer for')} ${esc(B.name)}</h3><p>${tradeText(t)}</p>${S.players.filter(p=>p.human).length>1?`<p class="mb-small">${T('Passe le téléphone à','Hand the phone to')} ${esc(B.name)}.</p>`:''}
   <div class="mb-btns"><button class="mb-b primary" data-y="1">${T('Accepter','Accept')}</button><button class="mb-b" data-n="1">${T('Refuser','Decline')}</button></div>`,'trade');
  c.listen(card.querySelector('[data-y]'),'click',()=>{closeModal();if(M.doTrade(S,t)){S.ev.length=0;SFX.cash();toast(T('Marché conclu !','Deal!'),'good');say(t.from,'buy');refreshBoard();syncMoney();save()}done()});
  c.listen(card.querySelector('[data-n]'),'click',()=>{closeModal();say(t.from,'pay');done()})}

 // ---- panneau d'actions du joueur humain
 function panel(){if(!G)return;const p=cur(),pn=G.panel;players();
  if(over||S.phase==='over'){pn.innerHTML='';return}
  if(!local(p)||tasks.length||busyModal){pn.innerHTML=`<div class="mb-status"><span class="mb-ptok">${TOKEN_SVG[p.token]}</span><b>${esc(p.name)}</b> ${!p.human?T('réfléchit…','is thinking…'):!mine(p)?T('joue…','is playing…'):''}</div>`;return}
  const btn=(a,label,cls='',dis=false)=>`<button class="mb-b ${cls}" data-a="${a}" ${dis?'disabled':''}>${label}</button>`;let main='',side='';
  const pass=ON||S.players.filter(q=>q.human&&!q.out).length>1;
  if(S.phase==='roll')main=btn('roll',`🎲 ${T('Lancer les dés','Roll the dice')}`,'primary big');
  else if(S.phase==='jail')main=`${p.cards.length?btn('jailCard',`🎟️ ${T('Utiliser la carte','Use the card')}`,'primary'):''}${btn('jailPay',`${T('Payer','Pay')} ${fmt(JAIL_FINE)}`,'',p.money<JAIL_FINE)}${btn('jailRoll',`🎲 ${T('Tenter un double','Try for doubles')}`,p.cards.length?'':'primary')}`;
  else if(S.phase==='end')main=btn('endTurn',`${T('Fin du tour','End turn')} ›`,'primary big');
  else if(S.phase==='buy'){propCard(S.pending.i,'buy');return}
  else if(S.phase==='debt'){debt();return}
  side=`${btn('assets',`🏠 ${T('Mes biens','My properties')}`)}${!ON&&M.active(S).length>1?btn('trade',`🤝 ${T('Échanger','Trade')}`):''}`;
  pn.innerHTML=`<div class="mb-status"><span class="mb-ptok">${TOKEN_SVG[p.token]}</span><b>${esc(p.name)}</b>${pass?` · ${T('à toi !','your turn!')}`:''}${p.jail?` · 🚔 ${T('aux Baumettes','in Les Baumettes')}`:''}</div><div class="mb-acts">${main}</div><div class="mb-side">${side}</div>`;
  pn.querySelectorAll('[data-a]').forEach(b=>c.listen(b,'click',()=>{const a=b.dataset.a;SFX.click();if(a==='assets')return assets(S.turn);if(a==='trade')return tradeDialog();human({a})}))}
 function debt(){const p=cur(),d=S.pending,to=typeof d.to==='number'?S.players[d.to].name:T('la banque','the bank');const can=p.money>=d.amount,liq=M.liquidity(S,p.id);
  const card=modal(`<h3>💸 ${T('Aïe, il faut payer','Ouch, time to pay')}</h3><p>${T('Tu dois','You owe')} <b>${fmt(d.amount)}</b> ${T('à','to')} <b>${esc(to)}</b>. ${T('Tu as','You have')} ${fmt(p.money)}.</p>
   <p class="mb-small">${can?T('Tu as assez, tu peux payer.','You have enough, you can pay.'):liq+p.money>=d.amount?T('Vends des cabanons ou hypothèque des propriétés pour réunir la somme.','Sell huts or mortgage properties to raise the money.'):T('Même en vendant tout, ça ne suffira pas…','Even selling everything won’t be enough…')}</p>
   <div class="mb-btns"><button class="mb-b primary" data-a="payDebt" ${can?'':'disabled'}>${T('Payer','Pay')} ${fmt(d.amount)}</button>${!can&&liq?`<button class="mb-b" data-a="assets">🏠 ${T('Vendre / hypothéquer','Sell / mortgage')}</button>`:''}${can?'':`<button class="mb-b danger" data-a="bankrupt">${T('Faire faillite','Declare bankruptcy')}</button>`}</div>`,'debt');
  card.querySelectorAll('[data-a]').forEach(b=>c.listen(b,'click',()=>{closeModal();const a=b.dataset.a;if(a==='assets'){assets(S.turn);const x=G.modal.querySelector('[data-x]');if(x){x.onclick=null;c.listen(x,'click',()=>{closeModal();debt()})}return}human({a})}))}
 function human(x){if(tasks.length||left)return;const ok=M.act(S,x);if(!ok){panel();return}const evs=S.ev.splice(0);push(evs);play(evs)}

 // ---- lecture des événements (animations dans l'ordre)
 function run(gen){tasks.push({gen,wait:0});panel()}
 function play(evs){run(seq(evs))}
 function* seq(evs){for(const e of evs)yield* show(e)}
 function* show(e){const P=e.p!=null?S.players[e.p]:null;
  switch(e.t){
   case 'turn':cameraTo(G.toks[e.p].pos);players();if(ON){if(mine(P)){toast(T('À toi de jouer !','Your turn!'),'good');buzz([30,60,30])}else toast(T(`Au tour de ${P.name}`,`${P.name}’s turn`))}else if(S.players.filter(q=>q.human).length>1||!P.human)toast(P.human?T(`À toi, ${P.name} !`,`Your turn, ${P.name}!`):T(`Au tour de ${P.name}`,`${P.name}’s turn`));yield .7;break;
   case 'dice':cameraTo(G.toks[e.p].pos);rollDice(e.d);yield 1.05;if(e.d[0]===e.d[1]&&!e.jail){SFX.double();say(e.p,'double');toast(T('Double !','Doubles!'),'good')}yield .25;break;
   case 'move':{hideDice();const n=Math.abs(e.steps),dir=Math.sign(e.steps)||1;if(n>12&&e.steps<0){hop(e.p,e.to,.6,90);SFX.hop();yield .6;break}
    for(let k=1;k<=n;k++){const to=((e.from+dir*k)%40+40)%40;hop(e.p,to,.2);cameraTo(to);SFX.hop();yield .2}placeTokens();yield .15;break}
   case 'go':floatMoney(e.p,e.amount);SFX.go();syncMoney();toast(X(QUIPS.go[0]),'good');say(e.p,'go');yield .5;break;
   case 'land':pulse(e.i);yield .25;break;
   case 'buy':SFX.cash();refreshBoard();floatMoney(e.p,-e.price);syncMoney();say(e.p,'buy');if(!local(P))toast(T(`${P.name} achète ${X(SQUARES[e.i].name)}`,`${P.name} buys ${X(SQUARES[e.i].name)}`));yield .9;break;
   case 'pass':if(!local(P))toast(T(`${P.name} passe son tour sur ${X(SQUARES[e.i].name)}`,`${P.name} skips ${X(SQUARES[e.i].name)}`));yield .4;break;
   case 'pay':{if(e.from!=null)floatMoney(e.from,-e.amount);if(e.to!=null)floatMoney(e.to,e.amount);syncMoney();
    if(e.reason==='rent'){SFX.coins();say(e.from,'pay');setTimeout(()=>say(e.to,'rent'),700/SPEED());toast(T(`Loyer : ${fmt(e.amount)} pour ${S.players[e.to].name}`,`Rent: ${fmt(e.amount)} to ${S.players[e.to].name}`))}
    else if(e.reason==='tax'){SFX.pay();toast(`${X(SQUARES[e.i].name)} : −${fmt(e.amount)}`,'bad')}else SFX.coins();yield .8;break}
   case 'debt':yield .2;break;
   case 'card':{const card=DECKS[e.deck][e.idx];(e.deck==='mistral'?SFX.mistral:SFX.gossip)();SFX.card();showCard(e.deck,card,P);yield local(P)?'modal':2.6;if(!local(P))closeModal();yield .2;break}
   case 'jail':SFX.jail();say(e.p,'jail');if(e.why==='three')toast(X(QUIPS.three[0]),'bad');else toast(T(`${P.name} part en garde à vue !`,`${P.name} is off to Les Baumettes!`),'bad');hop(e.p,JAIL,.7,140);cameraTo(JAIL);yield .8;placeTokens();players();yield .3;break;
   case 'free':if(e.how==='double')toast(T('Double : libéré !','Doubles: free!'),'good');else if(e.how==='card')toast(T('« Je connais quelqu’un » : libéré !','“I know someone”: free!'),'good');else toast(T('Amende payée : libéré.','Fine paid: free.'));SFX.pay();syncMoney();placeTokens();yield .5;break;
   case 'build':SFX.build();refreshBoard();syncMoney();if(!local(P))toast(T(`${P.name} construit sur ${X(SQUARES[e.i].name)}`,`${P.name} builds on ${X(SQUARES[e.i].name)}`));pulse(e.i);yield .6;break;
   case 'sell':case 'mortgage':case 'unmortgage':SFX.coins();refreshBoard();syncMoney();yield .4;break;
   case 'broke':SFX.broke();say(e.p,'broke');toast(T(`${P.name} fait faillite. Peuchère…`,`${P.name} goes bankrupt. Oh dear…`),'bad');refreshBoard();syncMoney();placeTokens();yield 1.8;break;
   case 'trade':SFX.cash();refreshBoard();syncMoney();yield .5;break;
   case 'quip':toast(X(QUIPS[e.k][0]));yield .6;break;
   case 'over':over=true;yield* ending();break}}
 function pulse(i){const sq=G.board.querySelector(`.mb-sq[data-i="${i}"]`);if(!sq)return;sq.classList.remove('pulse');void sq.offsetWidth;sq.classList.add('pulse')}
 function showCard(deck,card,P){const card2=modal(`<div class="mb-flip ${deck}"><div class="mb-cardin"><div class="mb-cfront"><i>${deck==='mistral'?'🌬️':'💬'}</i><b>${X(SQUARES[deck==='mistral'?7:2].name)}</b></div><div class="mb-cback"><small>${X(SQUARES[deck==='mistral'?7:2].name)}</small><p>${X(card.text)}</p>${local(P)?`<button class="mb-b primary">OK</button>`:`<span class="mb-small">${esc(P.name)}</span>`}</div></div></div>`,'cardm');
  requestAnimationFrame(()=>card2.querySelector('.mb-flip').classList.add('turn'));const ok=card2.querySelector('button');if(ok)c.listen(ok,'click',()=>closeModal())}
 function* ending(){if(!ON)clearRun('massilia');const w=S.winner!=null?S.players[S.winner]:null;SFX.win();
  const rank=[...S.players].sort((a,b)=>(a.out?-1:0)-(b.out?-1:0)||M.netWorth(S,b)-M.netWorth(S,a));
  modal(`<div class="mb-win"><div class="mb-confetti">${'🎉🥖🐟⚽🌞🥃'.repeat(4).match(/./gu).map((e,i)=>`<i style="left:${(i*37)%100}%;animation-delay:${(i%7)*.2}s">${e}</i>`).join('')}</div><h3>${w?`${TOKEN_SVG[w.token]} ${esc(w.name)}`:''}</h3><p>${w?(local(w)?T('Tu es le roi du Vieux-Port !','You are the king of the Old Port!'):ON?T('remporte la partie. Le Vieux-Port a un nouveau patron.','wins the game. The Old Port has a new boss.'):T('remporte la partie. On dira que tu as laissé gagner.','wins the game. Let’s say you let them win.')):''}</p>
   <ol>${rank.map(p=>`<li>${esc(p.name)} <b>${p.out?T('faillite','bankrupt'):fmt(M.netWorth(S,p))}</b></li>`).join('')}</ol></div>`,'win');yield 3.2;closeModal();
  const humans=S.players.filter(local),best=humans.sort((a,b)=>M.netWorth(S,b)-M.netWorth(S,a))[0],won=!!(w&&local(w));
  const text=w?T(`${w.name} gagne la partie !`,`${w.name} wins the game!`)+(best?`\n${T('Ta fortune','Your fortune')} : ${fmt(best.out?0:M.netWorth(S,best))}`:''):'';
  c.finish(won,best&&!best.out?Math.round(M.netWorth(S,best)):0,text,{reward:won?450:150,title:won?T('Bravo, roi du Vieux-Port !','Well done, king of the Old Port!'):T('Partie terminée','Game over'),actions:[[T('Nouvelle partie','New game'),()=>c.relaunch(null)],[T('Tous les jeux','All games'),null]]})}
 function* introSeq(){camMode='overview';toast(T('Bienvenue à Marseille ! Ici, tout le monde a un cousin dans l’immobilier.','Welcome to Marseille! Here, everyone has a cousin in real estate.'));yield 2.4;camMode='follow';yield .4}
 function save(){if(ON||!S||over||S.phase==='over')return;saveRun('massilia',{level:0,round:S.round,state:M.snapshot(S)})}

 // ---- boucle : animations, puis tour de l'ordinateur
 function aiStep(){const p=cur();if(p.human||S.phase==='over')return;
  if(S.phase==='end'&&Math.random()<.3){const t=M.aiTradeIdea(S,p.id);if(t){const B=S.players[t.to];
   if(B.human){if((lastAsk[B.id]||-9)<S.turnCount-6){lastAsk[B.id]=S.turnCount;S.ev.length=0;askHuman(t,()=>{panel()});return}}
   else if(M.aiAccepts(S,t)){M.doTrade(S,t);toast(T(`${p.name} et ${B.name} font affaire`,`${p.name} and ${B.name} make a deal`));play(S.ev.splice(0));return}}}
  const a=M.aiAction(S);if(!a)return;M.act(S,a);play(S.ev.splice(0))}
 // ---- en ligne : envoi après chaque action, relevé régulier, départ d'un joueur
 // tous les téléphones partent du même tirage (graine + ordre des joueurs donnés par le serveur)
 function engineFrom(st){if(st.engine){const E=JSON.parse(JSON.stringify(st.engine));E.ev=[];return E}
  const E=M.newGame({players:st.players.map((p,i)=>({name:String(p.name||'?').slice(0,14),token:TOKENS[i%TOKENS.length].id,human:true})),quick:st.quick!==false,seed:st.seed|0});
  E.players.forEach((p,i)=>p.pid=st.players[i].id);E.ev=[];return E}
 const trimHist=h=>{h=h.slice(-8);while(h.length>1&&JSON.stringify(h).length>14000)h.shift();return h};
 function push(evs){if(!ON||left)return;const snap=M.snapshot(S),end=S.phase==='over',next=end?null:cur().pid;inflight++;
  sending=sending.then(async()=>{const st={kind:'massilia',v:1,players:view.state.players,seed:view.state.seed,quick:view.state.quick,engine:snap,nextThrower:next,hist:trimHist([...(view.state.hist||[]),{n:knownPly+1,ev:evs}])};
   try{view=await online.partyThrow(view.id,knownPly,st,end?{winner:null}:null);knownPly=view.ply}
   catch(e){toast(T('Action non envoyée : ','Move not sent: ')+e.message,'bad');await resync()}
   finally{inflight--}})}
 async function resync(){let v;try{v=await online.getParty(view.id)}catch{return}view=v;knownPly=v.ply;if(v.status!=='active'&&v.state?.engine?.phase!=='over')return abandoned(v.state?.msg);tasks=[];closeModal();start(engineFrom(v.state),false)}
 async function poll(){if(!ON||polling||inflight||left||over&&S?.phase==='over')return;polling=true;let v;try{v=await online.getParty(view.id)}catch{polling=false;return}polling=false;
  if(inflight||tasks.length||left)return;
  if(v.status!=='active'&&v.state?.engine?.phase!=='over'&&!over){view=v;return abandoned(v.state?.msg)}
  if(v.ply<=knownPly)return;
  const batches=(v.state?.hist||[]).filter(h=>h.n>knownPly),gap=!batches.length||batches[0].n!==knownPly+1;view=v;knownPly=v.ply;
  closeModal();S=engineFrom(v.state);
  if(gap){refreshBoard();syncMoney();placeTokens(true);players();panel();if(S.phase==='over')run(ending());return}
  play(batches.flatMap(h=>h.ev))}
 if(ON)c.every(poll,2000);
 function abandoned(msg){if(over)return;over=true;closeModal();tasks=[];if(G)panel();
  c.finish(false,0,msg||T('La partie a été arrêtée.','The game was stopped.'),{reward:50,noRecord:true,title:T('Partie terminée','Game over'),actions:[[T('Tous les jeux','All games'),null],[T('Tous les jeux','All games'),null]]})}
 function leaveParty(){c.dialog(T('Quitter la partie ?','Leave the game?'),T('La partie s’arrête pour tout le monde.','The game ends for everyone.'),T('Quitter','Leave'),async()=>{left=true;try{await sending;await online.partyLeave(view.id)}catch(e){left=false;toast(e.message,'bad');return}
   over=true;c.finish(false,0,T('Tu as quitté la partie.','You left the game.'),{reward:0,noRecord:true,title:T('Partie quittée','Game left')})},T('Rester','Stay'),()=>{})}

 if(window.__mbTest)window.__mb={get S(){return S},get tasks(){return tasks.length},get ply(){return knownPly},M};
 if(ON){const st=view.state||{};if(view.status!=='active'&&st.engine?.phase!=='over'){S=null;setTimeout(()=>abandoned(st.msg),0)}else{start(engineFrom(st),!st.engine);if(S.phase==='over'){tasks=[];run(ending())}}}
 else if(c.duel?.resume&&savedRun('massilia')?.state)start(savedRun('massilia').state,false);else setup();
 return {update(dt){if(!G)return;dt=Math.min(dt,.05);applyCam(dt);drawTokens(dt);
   const t=tasks[0];if(t){if(t.wait==='modal'){if(!busyModal)t.wait=0}else if(t.wait>0)t.wait-=dt*SPEED();
    if(t.wait!=='modal'&&t.wait<=0){const r=t.gen.next();if(r.done){tasks.shift();if(!tasks.length){placeTokens();save();panel()}}else t.wait=r.value}return}
   if(over||busyModal||S.phase==='over')return;
   if(!cur().human){thinkT+=dt*SPEED();if(thinkT>.55){thinkT=0;aiStep()}}},
  destroy(){setMusicTheme(null);if(ON&&(over||S?.phase==='over'))online.hideParty(view.id).catch(()=>{})},
  key(k){if(k===' '||k==='Enter'){const b=G?.panel.querySelector('.mb-b.primary:not([disabled])');if(b&&!busyModal)b.click()}}};
}
