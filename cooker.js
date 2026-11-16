// BagaCooker : on tient un petit resto. Vue 3/4 en 3D (WebGL voxel), joystick au pouce gauche, deux boutons au pouce droit :
// ✋ prendre / poser / servir, 🔪 couper / laver (maintenu) ou sprint (appui). Six restaurants, trois étoiles chacun.
import * as K from './cooker-engine.js';
import {createGL,M4,project,hex} from './urssaf-gl.js';
import {drawRig} from './urssaf-models.js';
import {kitchenMesh,makeItems,makeChef,platedLayers,CT} from './cooker-models.js';
import {setMusicTheme} from './rewards.js';

const SAVE='bagaplay-cooker';
const EMO={bun:'🍞',cheese:'🧀',lettuce:'🥬',tomato:'🍅',potato:'🍟',steak:'🥩'};
const DISH={salade:'🥗',burger:'🍔',cheese:'🍔',frites:'🍟',steakfrites:'🥩',complet:'🍔',royal:'👑'};
const load=()=>{try{return JSON.parse(localStorage.getItem(SAVE))||{}}catch{return {}}};
const store=P=>{try{localStorage.setItem(SAVE,JSON.stringify(P))}catch{}};
const BG=[.17,.14,.22];

export function cooker(c){
 const EN=window.bagaLang==='en',T=(fr,en)=>EN?en:fr,X=a=>a[EN?1:0],pick=a=>X(a[Math.floor(Math.random()*a.length)]);
 const wrap=document.createElement('div');wrap.className='ck-wrap';c.board.append(wrap);
 const P=Object.assign({stars:{},best:{}},load());
 let G=null,run=null,R=null,meshes=null,alive=true;
 const buzz=p=>{try{navigator.vibrate?.(p)}catch{}};
 const name=L=>EN?L.en:L.fr,rname=r=>EN?K.RECIPES[r].en:K.RECIPES[r].fr;
 const unlocked=n=>n===1||(P.stars[n-1]||0)>0;

 // ---- sons
 const au=()=>{const v=c.volume('sfx');if(!v)return null;const A=c.audio();return A?{A,v}:null};
 function tone(f0,f1,dur,type='sine',g=.06,delay=0){const a=au();if(!a)return;const {A,v}=a,t=A.currentTime+delay,o=A.createOscillator(),gn=A.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+dur);gn.gain.setValueAtTime(g*v,t);gn.gain.exponentialRampToValueAtTime(.0008,t+dur);o.connect(gn);gn.connect(A.destination);o.start(t);o.stop(t+dur+.02)}
 let nb=null;function noise(dur,g,freq,delay=0,type='lowpass'){const a=au();if(!a)return;const {A,v}=a;if(!nb){nb=A.createBuffer(1,A.sampleRate*.6,A.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
  const t=A.currentTime+delay,s=A.createBufferSource(),f=A.createBiquadFilter(),gn=A.createGain();s.buffer=nb;f.type=type;f.frequency.value=freq;gn.gain.setValueAtTime(g*v,t);gn.gain.exponentialRampToValueAtTime(.0008,t+dur);s.connect(f);f.connect(gn);gn.connect(A.destination);s.start(t);s.stop(t+dur+.02)}
 const SFX={pick:()=>tone(520,780,.06,'triangle',.05),put:()=>{tone(300,200,.06,'square',.03);noise(.04,.05,1200)},plate:()=>[880,1320].forEach((f,i)=>tone(f,f,.07,'triangle',.04,i*.05)),
  chop:()=>{noise(.035,.09,3500,0,'highpass');tone(1400,900,.03,'square',.015)},done:()=>[660,990].forEach((f,i)=>tone(f,f,.09,'triangle',.05,i*.06)),
  splash:()=>noise(.18,.06,2200,0,'bandpass'),ding:()=>{tone(1568,1568,.35,'sine',.05);tone(2093,2093,.25,'sine',.03,.02)},
  alarm:()=>{for(let i=0;i<3;i++)tone(980,980,.08,'square',.035,i*.14)},service:()=>{tone(2093,2093,.5,'sine',.06);tone(2637,2637,.4,'sine',.04,.03);[1046,1318,1568].forEach((f,i)=>tone(f,f,.09,'square',.03,.18+i*.06))},
  nope:()=>{tone(240,180,.15,'sawtooth',.04);tone(200,150,.2,'sawtooth',.04,.12)},angry:()=>{tone(180,90,.4,'sawtooth',.05);noise(.25,.06,500)},
  ticket:()=>{for(let i=0;i<6;i++)noise(.03,.04,2500,i*.035,'bandpass')},trash:()=>{noise(.18,.1,700);tone(160,80,.18,'square',.03)},dash:()=>noise(.18,.07,1600,0,'bandpass'),
  clink:()=>[1760,2200].forEach((f,i)=>tone(f,f,.06,'sine',.03,i*.05)),bonk:()=>tone(160,120,.06,'triangle',.04),go:()=>[523,659,784,1046].forEach((f,i)=>tone(f,f,.14,'triangle',.06,i*.09)),
  tick:()=>tone(1200,1200,.03,'square',.02),end:()=>[784,659,523,659,784,1046].forEach((f,i)=>tone(f,f,.16,'triangle',.06,i*.12)),star:i=>tone(880+i*220,1200+i*300,.2,'sine',.06)};
 // musique : swing de bistrot (contrebasse qui marche, accordéon, balais)
 const BASS=[48,52,55,57,53,57,60,57,55,59,62,59,48,52,55,52],MEL=[72,0,76,79,0,77,76,74,72,0,69,72,74,0,0,0,72,0,76,79,81,79,77,76,74,0,77,74,72,0,0,0];
 const theme=(fast)=>({period:fast?150:185,play(A,step,vol){const t=A.currentTime,note=(m,dur,type,g)=>{const o=A.createOscillator(),gn=A.createGain();o.type=type;o.frequency.value=440*2**((m-69)/12);gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(g*vol,t+.01);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(gn);gn.connect(A.destination);o.start(t);o.stop(t+dur+.02)};
  if(step%2===0)note(BASS[(step/2)%BASS.length]-12,.3,'triangle',.07);const m=MEL[step%MEL.length];if(m){note(m,.22,'square',.012);note(m+.1,.22,'square',.01)}
  if(step%4===2){const b=A.createBufferSource(),f=A.createBiquadFilter(),g=A.createGain();if(!A._ckn){A._ckn=A.createBuffer(1,A.sampleRate*.15,A.sampleRate);const d=A._ckn.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}b.buffer=A._ckn;f.type='highpass';f.frequency.value=3000;g.gain.setValueAtTime(.03*vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+.1);b.connect(f);f.connect(g);g.connect(A.destination);b.start(t);b.stop(t+.12)}}});

 // ---- carte des restaurants
 function menu(){stop();wrap.innerHTML=`<div class="ck-menu"><div class="ck-logo"><span class="ck-hat">👨‍🍳</span><h2>Baga<b>Cooker</b></h2><p>${T('Le resto le plus chaud de la ville. Littéralement.','The hottest restaurant in town. Literally.')}</p></div>
  <div class="ck-levels">${K.LEVELS.map(L=>{const n=L.id,ok=unlocked(n),st=P.stars[n]||0;return `<button class="ck-lv${ok?'':' lock'}" data-n="${n}" ${ok?'':'disabled'}><span class="ck-num">${ok?n:'🔒'}</span><span class="ck-lvt"><b>${name(L)}</b><small>${[...new Set(L.recipes.map(r=>DISH[r]))].join(' ')}${L.wash?' · 🧽':''}</small></span><span class="ck-st">${'★'.repeat(st)}<i>${'★'.repeat(3-st)}</i></span></button>`}).join('')}</div>
  <button class="ck-tutobtn">🎓 ${T('Refaire le tuto','Replay the tutorial')}</button>
  <p class="ck-help">${T('Joystick à gauche · ✋ prendre, poser, servir · 🔪 couper, laver, ou sprinter','Joystick on the left · ✋ pick up, put down, serve · 🔪 chop, wash, or sprint')}</p></div>`;
  wrap.querySelectorAll('.ck-lv:not(.lock)').forEach(b=>c.listen(b,'click',()=>{SFX.pick();intro(+b.dataset.n)}));c.listen(wrap.querySelector('.ck-tutobtn'),'click',()=>{SFX.pick();play(1,true)})}
 const TIPS={1:[['🥬 🍅 : pose-les sur la planche et maintiens 🔪 pour couper.','🥬 🍅: put them on the board and hold 🔪 to chop.'],['Prends une assiette, mets-y les ingrédients coupés, sers au passe 🛎️.','Grab a plate, add the chopped ingredients, serve at the pass 🛎️.']],
  2:[['🥩 : pose-le sur la poêle, il cuit tout seul… et brûle si tu traînes !','🥩: put it in the pan, it cooks by itself… and burns if you dawdle!']],
  3:[['Les assiettes reviennent sales : lave-les à l’évier (maintiens 🧽).','Plates come back dirty: wash them at the sink (hold 🧽).']],
  4:[['🥔 : coupe-la sur la planche, puis plonge-la dans la friteuse.','🥔: chop it on the board, then drop it in the fryer.']],
  5:[['Ça va vite : prépare à l’avance, garde des assiettes propres.','It gets busy: prep ahead and keep clean plates ready.']],6:[['Le Royal Baga : cinq ingrédients, zéro pitié.','The Royal Baga: five ingredients, zero mercy.']]};
 function intro(n){const L=K.LEVELS[n-1],m=document.createElement('div');m.className='ck-modal';
  m.innerHTML=`<div class="ck-card"><small>${T('Restaurant','Restaurant')} ${n}</small><h3>${name(L)}</h3><div class="ck-recipes">${L.recipes.map(r=>`<div><span>${DISH[r]}</span><b>${rname(r)}</b><em>${K.RECIPES[r].parts.map(k=>EMO[k]).join(' + ')}</em></div>`).join('')}</div>
   <ul>${(TIPS[n]||[]).map(t=>`<li>${X(t)}</li>`).join('')}</ul><p class="ck-goal">⏱ ${Math.floor(L.time/60)}:${String(L.time%60).padStart(2,'0')} · ★ ${L.stars.join(' / ')} pts</p>
   ${n===1&&!P.tuto?`<p class="ck-first">👋 ${T('Première fois ? On prépare d’abord une commande ensemble, sans chrono.','First time? Let’s make one order together first, no clock.')}</p>`:''}
   <button class="ck-go">${n===1&&!P.tuto?T('Commencer le tuto','Start the tutorial'):T('C’est parti !','Let’s cook!')}</button>${n===1&&!P.tuto?`<button class="ck-back ck-skip">${T('Passer le tuto','Skip the tutorial')}</button>`:''}<button class="ck-back">${T('Retour','Back')}</button></div>`;wrap.append(m);
  c.listen(m.querySelector('.ck-go'),'click',()=>{m.remove();play(n,n===1&&!P.tuto)});m.querySelector('.ck-skip')&&c.listen(m.querySelector('.ck-skip'),'click',()=>{m.remove();P.tuto=1;store(P);play(1)});c.listen(m.querySelector('.ck-back:not(.ck-skip)'),'click',()=>m.remove())}

 // ---- partie
 function play(n,tuto=false){stop();G=tuto?K.tutorial((Math.random()*2**31)|0):K.newGame(n,(Math.random()*2**31)|0);wrap.innerHTML='';
  const cv=document.createElement('canvas');cv.className='ck-canvas';cv.setAttribute('aria-label',`BagaCooker, ${name(G.L)}`);
  const hud=document.createElement('div');hud.className='ck-hud';hud.innerHTML=`<div class="ck-top"><div class="ck-tickets"></div><div class="ck-side"><div class="ck-clock">0:00</div><div class="ck-score"><b>0</b><i></i></div></div></div>
   <div class="ck-over"></div><div class="ck-tuto" hidden><b></b><i></i></div><div class="ck-toast"></div><div class="ck-banner"></div>
   <div class="ck-pad"><div class="ck-base"><div class="ck-knob"></div></div></div>
   <div class="ck-btns"><button class="ck-b"><span>🔪</span><em>${T('Sprint','Sprint')}</em></button><button class="ck-a"><span>✋</span><em>${T('Prendre','Pick up')}</em></button></div>`;
  wrap.append(cv,hud);
  R=createGL(cv);if(!R){hud.innerHTML=`<div class="ck-nogl">${T('Ton appareil ne permet pas d’afficher ce jeu en 3D (WebGL indisponible).','Your device can’t display this 3D game (WebGL unavailable).')}</div>`;return}
  meshes={kitchen:null,side:null,it:makeItems(R),chef:makeChef(R)};
  run={cv,hud,t:0,start:3.2,inp:{mx:0,mz:0,a:false,b:false,bTap:false},keys:new Set(),parts:[],floats:[],gauges:{},bubble:null,shake:0,chopT:0,yaw:0,endT:-1,shownTickets:'',hurry:false,dpr:1,scale:1,fps:60,squash:0,lastA:'',pops:new Map(),crate:{},flyers:[],badges:null};
  run.tuto=tuto;if(tuto){run.start=0;run.went=true;hud.querySelector('.ck-tuto').hidden=false;banner(T('Le tuto','Tutorial'),1.6,'title')}else banner(name(G.L),2.2,'title');
  setMusicTheme(theme(false));controls();makeBadges()}
 function stop(){if(R){try{for(const m of Object.values(meshes?.it||{}))R.free(m);if(meshes?.kitchen)R.free(meshes.kitchen);if(meshes?.side)R.free(meshes.side)}catch{}}R=null;meshes=null;run=null;G=null;setMusicTheme(null)}

 // ---- commandes tactiles et clavier
 function controls(){const hud=run.hud,pad=hud.querySelector('.ck-pad'),base=hud.querySelector('.ck-base'),knob=hud.querySelector('.ck-knob');let id=null,cx=0,cy=0;const MAX=46;
  c.listen(pad,'pointerdown',e=>{if(id!=null)return;id=e.pointerId;pad.setPointerCapture?.(e.pointerId);const r=pad.getBoundingClientRect();cx=e.clientX;cy=e.clientY;base.style.left=(cx-r.left)+'px';base.style.top=(cy-r.top)+'px';base.classList.add('on');knob.style.transform='translate(-50%,-50%)'});
  c.listen(pad,'pointermove',e=>{if(e.pointerId!==id)return;let dx=e.clientX-cx,dy=e.clientY-cy;const d=Math.hypot(dx,dy);if(d>MAX){dx*=MAX/d;dy*=MAX/d}knob.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;run.inp.mx=dx/MAX;run.inp.mz=dy/MAX});
  const end=e=>{if(e.pointerId!==id)return;id=null;run.inp.mx=0;run.inp.mz=0;knob.style.transform='translate(-50%,-50%)';base.classList.remove('on')};c.listen(pad,'pointerup',end);c.listen(pad,'pointercancel',end);
  const A=hud.querySelector('.ck-a'),B=hud.querySelector('.ck-b');
  c.listen(A,'pointerdown',e=>{e.preventDefault();run.inp.a=true;A.classList.add('down')});c.listen(A,'pointerup',()=>A.classList.remove('down'));c.listen(A,'pointercancel',()=>A.classList.remove('down'));
  c.listen(B,'pointerdown',e=>{e.preventDefault();B.setPointerCapture?.(e.pointerId);run.inp.b=true;run.inp.bTap=true;B.classList.add('down')});
  const bu=()=>{if(run){run.inp.b=false}B.classList.remove('down')};c.listen(B,'pointerup',bu);c.listen(B,'pointercancel',bu);
  c.listen(window,'keydown',e=>{if(!run)return;const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright','z','q','s','d','w','a'].includes(k)){run.keys.add(k);e.preventDefault()}
   if(k===' '||k==='enter'){if(!e.repeat)run.inp.a=true;e.preventDefault()}if(k==='shift'||k==='e'||k==='x'){if(!e.repeat){run.inp.bTap=true}run.inp.b=true}});
  c.listen(window,'keyup',e=>{if(!run)return;const k=e.key.toLowerCase();run.keys.delete(k);if(k==='shift'||k==='e'||k==='x')run.inp.b=false})}
 function keyMove(){const k=run.keys;if(!k.size)return null;let x=0,z=0;if(k.has('arrowleft')||k.has('q')||k.has('a'))x--;if(k.has('arrowright')||k.has('d'))x++;if(k.has('arrowup')||k.has('z')||k.has('w'))z--;if(k.has('arrowdown')||k.has('s'))z++;const m=Math.hypot(x,z)||1;return [x/m,z/m]}

 // ---- petites interfaces
 function banner(text,dur=1.4,kind=''){const b=run.hud.querySelector('.ck-banner');b.textContent=text;b.className='ck-banner show '+kind;clearTimeout(b._t);b._t=setTimeout(()=>b.classList.remove('show'),dur*1000)}
 function toast(text,kind=''){const t=run.hud.querySelector('.ck-toast');t.textContent=text;t.className='ck-toast show '+kind;clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2600)}
 function say(text,dur=1.8){run.bubble={text,t:dur,el:null}}
 function float(x,y,z,text,kind=''){run.floats.push({x,y,z,text,kind,t:1.2})}
 function burst(x,y,z,col,n=8,sp=1.6,up=2){const c3=typeof col==='string'?hex(col):col;for(let i=0;i<n;i++){const a=Math.random()*6.28;run.parts.push({x,y,z,vx:Math.cos(a)*sp*Math.random(),vy:up*(.5+Math.random()),vz:Math.sin(a)*sp*Math.random(),life:.6+Math.random()*.5,col:c3,s:.05+Math.random()*.05,g:9})}}
 function puff(x,y,z,col,n=3){const c3=hex(col);for(let i=0;i<n;i++)run.parts.push({x:x+(Math.random()-.5)*.3,y,z:z+(Math.random()-.5)*.3,vx:0,vy:.6+Math.random()*.4,vz:0,life:1+Math.random()*.6,col:c3,s:.07+Math.random()*.06,g:-.2,grow:1})}
 const SERVE=[['« Enfin ! »','“Finally!”'],['« Pas cuit, pas cru… parfait ! »','“Not raw, not burnt… perfect!”'],['« Mes compliments au chef ! »','“My compliments to the chef!”'],['« Je reviendrai. Avec ma belle-mère. »','“I’ll be back. With my mother-in-law.”'],['« 5 étoiles sur BagaAdvisor ! »','“5 stars on BagaAdvisor!”'],['« Ça, c’est du service ! »','“Now that’s service!”'],['« Meilleur que chez ma mère. Chut. »','“Better than my mum’s. Shh.”']];
 const BURNT=[['Ça sent le cramé !','Something’s burning!'],['Oups… « bien cuit » ?','Oops… “well done”?'],['Au feu les pompiers !','Call the fire brigade!']];
 const TRASH=[['On n’a rien vu…','Nobody saw that…'],['Poubelle !','Bin it!'],['Même le chat n’en veut pas','Not even the cat wants it']];

 // ---- événements du moteur → sons, effets, bulles
 function events(){for(const e of G.ev.splice(0)){const wx=e.x+.5,wz=e.z+.5;
  switch(e.t){
   case 'pick':SFX.pick();buzz(8);run.squash=.15;if(e.crate)run.crate[e.x+','+e.z]=run.t+.25;break;
   case 'put':SFX.put();run.squash=.12;if(e.on==='S'){puff(wx,CT+.1,wz,'#ffffff',4)}break;
   case 'plated':SFX.plate();burst(wx,CT+.2,wz,'#ffd23f',6,1,1.5);break;
   case 'chopped':SFX.done();buzz(20);float(wx,CT+.5,wz,'✔');break;
   case 'washed':SFX.done();float(wx,CT+.5,wz,'✨');break;
   case 'cooked':SFX.ding();puff(wx,CT+.15,wz,'#ffffff',6);float(wx,CT+.6,wz,e.k==='steak'?T('Cuit !','Cooked!'):T('Frit !','Fried!'),'good');break;
   case 'burnt':SFX.alarm();buzz([60,40,60,40,60]);puff(wx,CT+.15,wz,'#3a3a3a',10);say(pick(BURNT),2);run.shake=.4;break;
   case 'serve':{run.flyers.push({it:e.plate||{id:-1,k:'plate',dirty:false,parts:K.RECIPES[e.r].parts.slice()},x:wx,z:wz,t:0});SFX.service();buzz([20,30,20,30,50]);run.shake=.25;burst(wx,CT+.4,wz,'#ffd23f',16,2.2,3);burst(wx,CT+.4,wz,'#e2453c',8,2,3);
    float(wx,CT+.8,wz,`+${e.pts+e.tip+e.bonus}`,'big');toast(`${e.who} : ${pick(SERVE)}`,'good');if(e.bonus)banner(T('Combo ! +10','Combo! +10'),1.1,'good');break}
   case 'wrong':SFX.nope();buzz(40);say(T('Personne n’a commandé ça !','Nobody ordered that!'));break;
   case 'needPlate':SFX.nope();say(T('Dans une assiette, chef !','On a plate, chef!'));break;
   case 'chopFirst':SFX.nope();say(T('Coupe-la d’abord !','Chop it first!'));break;
   case 'angry':SFX.angry();buzz([100,50,100]);toast(pick([[`${e.who} est parti manger un kebab 😡`,`${e.who} left for a kebab 😡`],[`${e.who} laisse un avis 1 étoile 😤`,`${e.who} leaves a 1-star review 😤`],[`${e.who} en a eu marre d’attendre 🙄`,`${e.who} got tired of waiting 🙄`]]),'bad');run.shake=.3;break;
   case 'order':SFX.ticket();break;
   case 'trash':SFX.trash();if(Math.random()<.5)say(pick(TRASH));break;
   case 'dash':SFX.dash();puff(G.p.x,.05,G.p.z,'#e8e2d6',4);break;
   case 'return':SFX.clink();break;
   case 'full':case 'nothing':SFX.bonk();break;
   case 'over':SFX.end();banner(T('Fin du service !','Service over!'),2,'title');run.endT=2.2;break}}}

 // ---- HUD : tickets, horloge, score, boutons contextuels
 function hudTick(){const h=run.hud;
  const key=G.orders.map(o=>o.id).join(',');const box=h.querySelector('.ck-tickets');
  if(key!==run.shownTickets){const old=new Set(run.shownTickets.split(','));run.shownTickets=key;
   box.innerHTML=G.orders.map(o=>`<div class="ck-ticket${old.has(String(o.id))?'':' new'}" data-id="${o.id}"><span>${DISH[o.r]}</span><b>${rname(o.r)}</b><em>${K.RECIPES[o.r].parts.map(k=>EMO[k]).join('')}</em><small>${o.who}</small><i><u></u></i></div>`).join('')}
  for(const o of G.orders){const el=box.querySelector(`[data-id="${o.id}"]`);if(!el)continue;const f=o.left/o.life;const u=el.querySelector('u');u.style.width=(f*100).toFixed(1)+'%';u.style.background=f>.5?'#5fb04a':f>.25?'#f3c33a':'#e2453c';el.classList.toggle('late',f<.25)}
  const s=Math.ceil(G.left),clock=h.querySelector('.ck-clock');clock.textContent=G.tut?'🎓':`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;clock.classList.toggle('hurry',s<=30);
  if(s<=30&&!run.hurry){run.hurry=true;setMusicTheme(theme(true));banner(T('Dernier rush !','Final rush!'),1.4,'bad')}
  if(s<=10&&s!==run.lastSec){run.lastSec=s;SFX.tick()}
  const sc=h.querySelector('.ck-score b');if(sc.textContent!==String(G.score)){sc.textContent=G.score;sc.classList.remove('bump');void sc.offsetWidth;sc.classList.add('bump')}
  const st=K.starsFor(G),si=h.querySelector('.ck-score i');if(si.dataset.s!==String(st)){si.dataset.s=st;si.innerHTML='★'.repeat(st)+`<span>${'★'.repeat(3-st)}</span>`}
  // boutons qui disent ce qu'ils vont faire
  const t=K.front(G),hd=G.p.hold;let a=T('Prendre','Pick up');
  if(hd){a=t?.ch==='O'?T('Servir','Serve'):t?.ch==='X'?T('Jeter','Bin'):t?.item&&(hd.k==='plate'||t.item.k==='plate')?T('Dresser','Plate'):T('Poser','Put down')}
  const w=K.workable(G),b=w==='chop'?['🔪',T('Couper','Chop')]:w==='wash'?['🧽',T('Laver','Wash')]:['💨',T('Sprint','Sprint')];const lab=a+'|'+b.join();
  if(lab!==run.lastA){run.lastA=lab;h.querySelector('.ck-a em').textContent=a;h.querySelector('.ck-b span').textContent=b[0];h.querySelector('.ck-b em').textContent=b[1];h.querySelector('.ck-b').classList.toggle('work',!!w)}}

 // ---- rendu 3D
 // en portrait, la cuisine (plus large que profonde) est vue de côté : son petit côté prend la largeur de l'écran, tout est plus gros
 function camera(w,h){const asp=w/h,vf=.62,hf=2*Math.atan(Math.tan(vf/2)*asp),el=.9,side=asp<.85&&G.W>G.H;run.az=side?Math.PI/2:0;
  const ext=side?G.H:G.W,dep=side?G.W:G.H;
  const dw=(ext/2+.25)/Math.tan(hf/2),dh=(dep/2+.9)/Math.tan(vf/2)*.9,d=Math.max(dw,dh)+1.5;
  const cx=G.W/2+(side?.15:(G.p.x-G.W/2)*.05),cz=G.H/2+(side?(G.p.z-G.H/2)*.05:.15);let sx=0,sz=0;if(run.shake>0){sx=(Math.random()-.5)*run.shake*.25;sz=(Math.random()-.5)*run.shake*.25}
  const ox=Math.sin(run.az)*Math.cos(el),oz=Math.cos(run.az)*Math.cos(el);
  const eye=[cx+sx+d*ox,d*Math.sin(el),cz+sz+d*oz],tgt=[cx+sx,.25,cz+sz];
  const ty=run.az>0?.07:asp<.8?.13:.04,shift=[1,0,0,0,0,1,0,0,0,0,1,0,0,ty,0,1];
  return {VP:M4.mul(shift,M4.mul(M4.persp(vf,asp,.5,80),M4.look(eye,tgt))),eye}}
 function itemMesh(it){if(it.k==='plate')return it.dirty?'plate_dirty':'plate';const st=it.st==='raw'&&!meshes.it[it.k+'_raw']?'raw':it.st;return meshes.it[it.k+'_'+st]?it.k+'_'+st:it.k+'_raw'}
 // un objet qui apparaît (posé, pris, coupé, cuit) fait un petit « pop »
 function popScale(it){const r=run,key=it.id+':'+it.st+':'+(it.parts?it.parts.length:0);let t0=r.pops.get(key);if(t0==null){t0=r.t;r.pops.set(key,t0);if(r.pops.size>300)r.pops.clear()}const e=r.t-t0;return e<.35?1+Math.sin(e/.35*Math.PI)*.28:1}
 function drawItem(it,x,y,z,yaw=0,s=1){const I=meshes.it;s*=popScale(it);R.draw(I[itemMesh(it)],M4.trs(x,y,z,yaw,s));
  if(it.k==='plate'&&it.parts.length){const L=platedLayers(it.parts);let h=y+.04*s;for(const [m,dh] of L.stack){R.draw(I[m],M4.trs(x,h,z,yaw,s));h+=dh*s}
   for(const [m,ox,oz,oy=0] of L.side)R.draw(I[m],M4.trs(x+ox*s,y+(.04+oy)*s,z+oz*s,yaw,s*.8))}}
 function render(){const r=run,cv=r.cv,cssW=wrap.clientWidth,cssH=wrap.clientHeight;if(!cssW||!cssH)return;
  r.fps=r.fps*.95+.05/Math.max(r.dt||.016,.001);if(r.fps<38&&r.scale>.6)r.scale-=.004;else if(r.fps>55&&r.scale<1)r.scale+=.002;
  const dpr=Math.min(window.devicePixelRatio||1,2)*r.scale,W=Math.round(cssW*dpr),H=Math.round(cssH*dpr);if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H}
  const {VP,eye}=camera(cssW,cssH);r.VP=VP;r.cssW=cssW;r.cssH=cssH;R.frame(W,H,VP,eye,BG,[60,120]);
  const sideView=r.az>0;if(sideView){meshes.side??=kitchenMesh(R,G,{side:true});R.draw(meshes.side,M4.id())}else{meshes.kitchen??=kitchenMesh(R,G);R.draw(meshes.kitchen,M4.id())}const I=meshes.it,tt=r.t;
  // objets sur les meubles
  for(const row of G.tiles)for(const t of row){const x=t.x+.5,z=t.z+.5;
   if(K.CRATE[t.ch]){const k=K.CRATE[t.ch],m=I[k+'_raw'],bump=r.crate[t.x+','+t.z]>r.t?1+Math.sin((r.crate[t.x+','+t.z]-r.t)/.25*Math.PI)*.2:1;
    // une petite pile d'ingrédients sur chaque caisse
    R.draw(m,M4.trs(x-.2,CT+.02,z+.12,.4,1.5*bump));R.draw(m,M4.trs(x+.2,CT+.02,z+.1,-.6,1.5*bump));R.draw(m,M4.trs(x,CT+.02+(k==='cheese'||k==='steak'?.09:.12),z-.12,1.2,1.65*bump));continue}
   if(t.ch==='D'){for(let i=0;i<t.clean;i++)R.draw(I.plate,M4.trs(x,CT+.01+i*.06,z,0,1.5));for(let i=0;i<t.dirty;i++)R.draw(I.plate_dirty,M4.trs(x,CT+.01+(t.clean+i)*.06,z,0,1.5))}
   if(t.ch==='W'){for(let i=0;i<t.dirty;i++)R.draw(I.plate_dirty,M4.trs(x,CT-.1+i*.05,z,.4,1.3));for(let i=0;i<t.clean;i++)R.draw(I.plate,M4.trs(x+.24,CT+.01+i*.05,z+.26,0,.8))}
   if(!t.item)continue;const it=t.item;let y=CT+.01,j=0;
   if(t.ch==='S'){y=CT+.05;if(it.st!=='burnt')j=Math.sin(tt*30+t.x)*.008;if(it.st!=='burnt'&&Math.random()<.08)puff(x,CT+.12,z,'#ffffff',1);if(it.st==='burnt'&&Math.random()<.15)puff(x,CT+.12,z,'#3a3a3a',1)}
   if(t.ch==='F'){y=CT-.03;if(Math.random()<.1)run.parts.push({x:x+(Math.random()-.5)*.5,y:CT+.02,z:z+(Math.random()-.5)*.5,vx:0,vy:.4,vz:0,life:.3,col:hex('#fff2b0'),s:.03,g:0})}
   if(t.ch==='K'&&G.p.work==='chop'&&K.front(G)===t)j+=Math.abs(Math.sin(tt*28))*.03;
   drawItem(it,x,y+j,z,t.ch==='K'?0:.2,1.75)}
  // assiettes servies qui s'envolent par le passe
  for(const f of r.flyers){const u=f.t/.7;drawItem(f.it,f.x,CT+.05+u*u*1.6,f.z-u*.6,u*6,1.75*(1-u*.6))}
  // le chef
  const p=G.p,yaw=Math.atan2(-p.dx,-p.dz);let dy=yaw-r.yaw;while(dy>Math.PI)dy-=2*Math.PI;while(dy<-Math.PI)dy+=2*Math.PI;r.yaw+=dy*Math.min(1,r.dt*16);
  const sw=p.moving?Math.sin(p.walk*1.9):0,carry=!!p.hold,work=p.work;
  // bras : rotation positive = vers l'avant (le chef regarde vers -z dans son repère)
  const pose={legL:sw*.75,legR:-sw*.75,armL:carry?1.45:-sw*.65,armR:carry?1.45:sw*.65,bob:p.moving?Math.abs(Math.sin(p.walk*1.9))*.06:Math.sin(tt*2.2)*.01,lean:p.dash>0?-.35:p.moving?-.08:0};
  if(work==='chop'){pose.armR=1.2+Math.sin(tt*28)*.6;pose.armL=.9;pose.lean=-.12}if(work==='wash'){pose.armL=1.1+Math.sin(tt*14)*.3;pose.armR=1.1+Math.cos(tt*14)*.3;pose.lean=-.15}
  const sq=r.squash>0?1+Math.sin(r.squash/.15*Math.PI)*.08:1;
  R.draw(I.cube,M4.mul(M4.t(p.x,.005,p.z),M4.sc(.62,.01,.62)),[0,0,0,1],.22);
  drawRig(R,M4,meshes.chef,M4.mul(M4.trs(p.x,0,p.z,r.yaw,1.45),M4.sc(1/sq,sq,1/sq)),pose);
  if(p.hold){const fx=-Math.sin(r.yaw),fz=-Math.cos(r.yaw);drawItem(p.hold,p.x+fx*.46,.82+pose.bob*1.45+(p.moving?Math.sin(p.walk*3.8)*.015:0),p.z+fz*.46,r.yaw,1.55)}
  // case visée : cadre jaune qui pulse
  const ft=K.front(G);if(ft&&!K.isFloor(ft.ch)){const a=.35+.25*Math.sin(tt*6),x=ft.x,z=ft.z,yy=CT+.012,col=[1,.85,.2,1];
   for(const [cx,cz,sx,sz] of [[x+.5,z+.03,1,.06],[x+.5,z+.97,1,.06],[x+.03,z+.5,.06,1],[x+.97,z+.5,.06,1]])R.draw(I.cube,M4.mul(M4.t(cx,yy,cz),M4.sc(sx,.02,sz)),col,a)}
  // particules
  for(const q of r.parts){const s=q.s*(q.grow?1+(1.4-q.life)*1.2:1);R.draw(I.cube,M4.mul(M4.t(q.x,q.y,q.z),M4.sc(s,s,s)),[q.col[0],q.col[1],q.col[2],1],Math.min(1,q.life*1.5))}
  overlay()}
 // jauges, alertes, textes et bulle du chef, en HTML au-dessus de la 3D
 function overlay(){const r=run,ov=r.hud.querySelector('.ck-over'),seen=new Set(),pr=(x,y,z)=>project(r.VP,r.cssW,r.cssH,x,y,z);
  for(const row of G.tiles)for(const t of row){const g=K.gauge(t);if(!g)continue;const id=t.x+','+t.z;seen.add(id);let el=r.gauges[id];
   if(!el){el=document.createElement('div');el.className='ck-gauge';el.innerHTML='<i></i><b></b>';ov.append(el);r.gauges[id]=el}
   const s=pr(t.x+.5,CT+.75,t.z+.5);if(!s)continue;el.style.transform=`translate(${s[0]}px,${s[1]}px)`;const [f,kind]=g;
   el.className='ck-gauge '+kind+(kind==='burn'&&f>.55?' warn':'');el.querySelector('i').style.width=Math.min(100,f*100).toFixed(0)+'%';el.querySelector('b').textContent=kind==='burn'&&f>.55?'⚠️':''}
  for(const id in r.gauges)if(!seen.has(id)){r.gauges[id].remove();delete r.gauges[id]}
  for(const f of r.floats){if(!f.el){f.el=document.createElement('div');f.el.className='ck-float '+f.kind;f.el.textContent=f.text;ov.append(f.el)}const s=pr(f.x,f.y+(1.2-f.t)*.6,f.z);if(s){f.el.style.transform=`translate(${s[0]}px,${s[1]}px)`;f.el.style.opacity=Math.min(1,f.t*2)}}
  const b=r.bubble;if(b){if(!b.el){b.el=document.createElement('div');b.el.className='ck-bubble';b.el.textContent=b.text;ov.append(b.el)}const s=pr(G.p.x,1.75,G.p.z);if(s)b.el.style.transform=`translate(${s[0]}px,${s[1]}px)`}}

 function tick(dt){const r=run;if(!r||!G)return;r.dt=dt;r.t+=dt;
  if(r.start>0){const before=Math.ceil(r.start-.2);r.start-=dt;const now=Math.ceil(r.start-.2);if(now!==before&&now>0&&now<=3){banner(String(now),.8,'count');SFX.tick()}if(r.start<=.2&&!r.went){r.went=true;banner(T('Service !','Service!'),1,'go');SFX.go()}}
  else if(!G.over){const km=keyMove(),jx=km?km[0]:r.inp.mx,jz=km?km[1]:r.inp.mz,ca=Math.cos(r.az||0),sa=Math.sin(r.az||0);
   // le joystick suit l'écran, quelle que soit l'orientation de la caméra
   const inp={mx:jx*ca+jz*sa,mz:-jx*sa+jz*ca,a:r.inp.a,b:r.inp.b,bTap:r.inp.bTap};K.step(G,dt,inp);
   if(G.p.work){r.chopT-=dt;if(r.chopT<=0){r.chopT=G.p.work==='chop'?.16:.3;const t=K.front(G);if(G.p.work==='chop'){SFX.chop();buzz(5);if(t?.item)burst(t.x+.5,CT+.1,t.z+.5,t.item.k==='tomato'?'#e8473a':t.item.k==='potato'?'#f3dfa8':'#7ccb55',3,.8,1.4)}else{SFX.splash();if(t)burst(t.x+.5,CT,t.z+.5,'#9fdcff',4,.7,1.6)}}}}
  r.inp.a=false;r.inp.bTap=false;events();hudTick();if(r.tuto)tutoTick(dt);
  for(const q of r.parts){q.vy-=q.g*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.z+=q.vz*dt;q.life-=dt;if(q.g>0&&q.y<.02){q.y=.02;q.vy*=-.3;q.vx*=.5;q.vz*=.5}}r.parts=r.parts.filter(q=>q.life>0);if(r.parts.length>220)r.parts.splice(0,r.parts.length-220);
  for(const f of r.flyers)f.t+=dt;r.flyers=r.flyers.filter(f=>f.t<.7);
  for(const f of r.floats)f.t-=dt;r.floats=r.floats.filter(f=>{if(f.t>0)return true;f.el?.remove();return false});
  if(r.bubble){r.bubble.t-=dt;if(r.bubble.t<=0){r.bubble.el?.remove();r.bubble=null}}
  r.shake=Math.max(0,r.shake-dt*2);r.squash=Math.max(0,r.squash-dt);
  render();badgesTick();
  if(r.endT>0){r.endT-=dt;if(r.endT<=0)finish()}}
 function finish(){const n=G.n,st=K.starsFor(G),prev=P.stars[n]||0,score=G.score,served=G.served,lost=G.lost;P.stars[n]=Math.max(prev,st);P.best[n]=Math.max(P.best[n]||0,score);store(P);
  for(let i=0;i<st;i++)setTimeout(()=>SFX.star(i),300+i*300);setMusicTheme(null);
  const total=Object.values(P.stars).reduce((a,b)=>a+b,0),reward=30+Math.round(score/8)+40*Math.max(0,st-prev);
  const text=`${name(G.L)} : ${'★'.repeat(st)}${'☆'.repeat(3-st)}\n${T(`${served} plat${served>1?'s':''} servi${served>1?'s':''} · ${lost} client${lost>1?'s':''} parti${lost>1?'s':''} fâché${lost>1?'s':''}`,`${served} dish${served===1?'':'es'} served · ${lost} angry customer${lost===1?'':'s'} left`)}\n${score} points`;
  const next=n<K.LEVELS.length&&unlocked(n+1);
  c.finish(st>0,score,text,{reward,title:st===3?T('Chef étoilé !','Michelin chef!'):st>0?T('Service réussi !','Great service!'):T('Le resto a fermé…','The restaurant closed…'),
   actions:st>0&&next?[[T('Resto suivant','Next restaurant'),()=>c.relaunch({level:n+1})],[T('Les restos','Restaurants'),()=>c.relaunch({map:1})]]:[[T('Réessayer','Try again'),()=>c.relaunch({level:n})],[T('Les restos','Restaurants'),()=>c.relaunch({map:1})]]})}

 // ---- étiquettes au-dessus des postes, et ceux où l'on peut poser ce qu'on tient qui s'animent
 const BADGE={K:'🔪',S:'🍳',F:'🍟',W:'🧽',D:'🍽️',X:'🗑️',O:'🛎️'},CEMO={bun:'🍞',cheese:'🧀',lettuce:'🥬',tomato:'🍅',potato:'🥔',steak:'🥩'};
 function makeBadges(){const ov=run.hud.querySelector('.ck-over');run.badges=[];for(const row of G.tiles)for(const t of row){const k=K.CRATE[t.ch],e=k?CEMO[k]:BADGE[t.ch];if(!e)continue;
   const el=document.createElement('div');el.className='ck-badge'+(t.ch==='O'?' pass':'')+(k?' crate':'');el.innerHTML=t.ch==='O'?`${e}<b>${T('Service','Serve')}</b>`:e;ov.prepend(el);run.badges.push({t,el})}
  const ar=document.createElement('div');ar.className='ck-arrow';ar.textContent='⬇';ar.hidden=true;ov.append(ar);run.arrow=ar}
 const matches=parts=>parts.length&&G.orders.some(o=>{const r=K.RECIPES[o.r].parts;return r.length===parts.length&&r.every(k=>parts.includes(k))});
 function hintTargets(){const h=G.p.hold,out=new Set(),tiles=G.tiles.flat();if(!h)return out;
  if(h.k==='plate'){if(h.dirty){tiles.filter(t=>t.ch==='W').forEach(t=>out.add(t));return out}
   for(const t of tiles)if(t.item&&K.ready(t.item)&&!h.parts.includes(t.item.k))out.add(t);if(matches(h.parts))tiles.filter(t=>t.ch==='O').forEach(t=>out.add(t));return out}
  if(h.st==='burnt'){tiles.filter(t=>t.ch==='X').forEach(t=>out.add(t));return out}
  if(K.ready(h)){for(const t of tiles)if(t.item?.k==='plate'&&!t.item.dirty&&!t.item.parts.includes(h.k))out.add(t);return out}
  const want=h.k==='steak'?'S':h.k==='potato'&&h.st==='chop'?'F':K.ING[h.k]?.chop&&h.st==='raw'?'K':null;
  for(const t of tiles)if(t.ch===want&&!t.item)out.add(t);return out}
 function badgesTick(){const r=run;if(!r.badges||!r.VP)return;const tg=hintTargets(),go=G.p.hold?.k==='plate'&&matches(G.p.hold.parts);
  for(const b of r.badges){const t=b.t,sc=project(r.VP,r.cssW,r.cssH,t.x+.5,CT+(t.ch==='O'?1.15:1),t.z+.5);if(!sc)continue;const bx=Math.max(t.ch==='O'?44:18,Math.min(r.cssW-(t.ch==='O'?44:18),sc[0]));b.el.style.transform=`translate(${bx.toFixed(1)}px,${sc[1].toFixed(1)}px)`;
   b.el.classList.toggle('hint',tg.has(t));b.el.classList.toggle('go',t.ch==='O'&&go);b.el.classList.toggle('tuto',t===r.tutoTarget)}
  // les assiettes et ingrédients posés qui peuvent aller ensemble : petit cercle au sol
  const ar=r.arrow;if(ar){const tt=r.tutoTarget;ar.hidden=!tt;if(tt){const sc=project(r.VP,r.cssW,r.cssH,tt.x+.5,CT+1.7,tt.z+.5);if(sc)ar.style.transform=`translate(${sc[0].toFixed(1)}px,${sc[1].toFixed(1)}px)`}}}

 // ---- tuto : une salade guidée pas à pas
 const TUTO={takeLettuce:['Bouge avec le joystick et va à la caisse de salade 🥬, puis appuie sur ✋','Move with the joystick to the lettuce crate 🥬, then press ✋'],
  boardLettuce:['Pose-la sur une planche à découper 🔪 : appuie sur ✋ devant','Put it on a chopping board 🔪: press ✋ in front of it'],
  chopLettuce:['Reste devant la planche et maintiens le bouton 🔪 Couper','Stay at the board and hold the 🔪 Chop button'],
  takeTomato:['Bravo ! Maintenant une tomate 🍅','Nice! Now grab a tomato 🍅'],boardTomato:['Pose-la sur l’autre planche 🔪','Put it on the other board 🔪'],chopTomato:['Et coupe-la (maintiens 🔪)','And chop it (hold 🔪)'],
  plate:['Prends une assiette 🍽️ (✋)','Grab a plate 🍽️ (✋)'],addLettuce:['Mets la salade dans l’assiette : ✋ devant la planche','Put the lettuce on the plate: ✋ in front of the board'],
  addTomato:['Puis la tomate !','Then the tomato!'],pickPlate:['Reprends l’assiette (✋)','Pick the plate back up (✋)'],
  serve:['Apporte-la au passe 🛎️ et appuie sur ✋ Servir','Take it to the pass 🛎️ and press ✋ Serve'],done:['Bravo, chef ! Tatie Josette est ravie 🎉','Well done, chef! Auntie Josette is delighted 🎉']};
 const STEPS=Object.keys(TUTO);
 function tutoTarget(st){const tiles=G.tiles.flat(),find=f=>tiles.find(f),boards=tiles.filter(t=>t.ch==='K'),held=G.p.hold;
  const withItem=(k,st2)=>find(t=>t.item&&t.item.k===k&&(!st2||t.item.st===st2));
  switch(st){case 'takeLettuce':return find(t=>t.ch==='l');case 'boardLettuce':case 'boardTomato':return boards.find(t=>!t.item);case 'chopLettuce':return withItem('lettuce');
   case 'takeTomato':return find(t=>t.ch==='t');case 'chopTomato':return withItem('tomato');case 'plate':return find(t=>t.ch==='D');
   case 'addLettuce':return held?.k==='plate'?withItem('lettuce','chop'):find(t=>t.item?.k==='plate');case 'addTomato':return held?.k==='plate'?withItem('tomato','chop'):find(t=>t.item?.k==='plate');
   case 'pickPlate':return find(t=>t.item?.k==='plate');case 'serve':return find(t=>t.ch==='O');default:return null}}
 function tutoTick(dt){const r=run,st=K.tutoStep(G);r.tutoTarget=tutoTarget(st);const box=r.hud.querySelector('.ck-tuto');
  if(st!==r.tutoStep){if(r.tutoStep&&st!=='done')SFX.done();r.tutoStep=st;box.querySelector('b').textContent=X(TUTO[st]);const k=STEPS.indexOf(st);
   box.querySelector('i').innerHTML=STEPS.slice(0,-1).map((_,i)=>`<u class="${i<k?'ok':i===k?'on':''}"></u>`).join('');box.classList.remove('pop');void box.offsetWidth;box.classList.add('pop');
   if(st==='done'){r.tutoTarget=null;P.tuto=1;store(P);banner(T('Bravo, chef !','Well done, chef!'),2,'good');setTimeout(()=>{if(alive&&run===r){banner(T('Le vrai service commence !','Now for the real service!'),1.6,'title');setTimeout(()=>{if(alive&&run===r)play(1)},1700)}},2200)}}}

 // accroche pour les tests automatiques
 if(window.__ckTest)window.__ck={get G(){return G},get run(){return run},K,tick,play,P};
 if(c.duel?.level&&unlocked(c.duel.level))play(c.duel.level);else menu();
 return {update(dt){if(alive&&run)tick(Math.min(dt,.05))},destroy(){alive=false;stop()},
  key(k){if(!run&&k==='Enter'){const b=wrap.querySelector('.ck-go');if(b)b.click()}}};
}
