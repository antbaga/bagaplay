// Éclate-Bulles : jeu de tir de bulles avec carte de 150 niveaux (6 mondes), étoiles, boosters et bulles spéciales.
import * as B from './bubble-engine.js';
import {setMusicTheme} from './rewards.js';

const STORE='bagaplay-bubble';
const PAL=[['#ff5d5d','#c42a35'],['#ffd23f','#d99a0b'],['#5fd068','#239a3b'],['#4cc3ff','#1a7fd0'],['#b67cff','#7339cf'],['#ff9a3c','#d4620e']];
const WORLDS=[
 {name:'Forêt de nuit',sky:['#1a2140','#2c3d6b'],hill:'#141a33',deco:'trees'},
 {name:'Lagon',sky:['#0c4a5e','#1f8ea3'],hill:'#0a3a4a',deco:'waves'},
 {name:'Cimes enneigées',sky:['#2b3a62','#6f8fc4'],hill:'#e9f0fb',deco:'peaks'},
 {name:'Désert doré',sky:['#6b3a1f','#e2954a'],hill:'#8a5426',deco:'dunes'},
 {name:'Fête foraine',sky:['#3c1747','#a03f86'],hill:'#2a0f33',deco:'tents'},
 {name:'Espace',sky:['#06081c','#1d1f4f'],hill:'#0d1030',deco:'planets'}];
const GOAL_TXT={clear:'Éclate toutes les bulles',chicks:'Libère toutes les étoiles',top:'Dégage la rangée du haut'};
const BOOSTS=[['rainbow','🌈','Arc-en-ciel'],['bomb','💣','Bombe'],['fire','🔥','Boule de feu'],['slow','⏳','Retarder la descente (+5 tirs)']];
function load(){try{const o=JSON.parse(localStorage.getItem(STORE)||'{}');return {stars:o.stars||{},best:o.best||{},boost:migrate(Object.assign({rainbow:3,bomb:3,fire:3,slow:2},o.boost||{}))}}catch{return {stars:{},best:{},boost:{rainbow:3,bomb:3,fire:3,slow:2}}}}
function migrate(b){if(b.plus5!=null){b.slow=(b.slow||0)+b.plus5;delete b.plus5}return b}
function save(p){try{localStorage.setItem(STORE,JSON.stringify(p))}catch{}}
export const totalStars=p=>Object.values(p.stars).reduce((a,b)=>a+b,0);
const unlocked=p=>{let n=1;while(n<B.LEVELS&&p.stars[n])n++;return n};

const CHORDS=[[57,60,64,69],[53,57,60,65],[48,55,60,64],[55,59,62,67]],ARP=[0,2,1,3,2,1,3,2,0,3,1,2,3,1,2,3];
const galaxy={period:150,play(A,step,vol){const t=A.currentTime,bar=Math.floor(step/16)%4,k=step%16,ch=CHORDS[bar];
 if(!A._gx){const d=A.createDelay(1),fb=A.createGain(),f=A.createBiquadFilter();d.delayTime.value=.45;fb.gain.value=.42;f.type='lowpass';f.frequency.value=2400;d.connect(f);f.connect(fb);fb.connect(d);f.connect(A.destination);A._gx=d}
 const out=A._gx,hz=m=>440*2**((m-69)/12);
 const voice=(m,dur,type,g,att=.01,send=.6,det=0)=>{const o=A.createOscillator(),gn=A.createGain();o.type=type;o.frequency.value=hz(m);o.detune.value=det;gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(g*vol,t+att);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(gn);gn.connect(A.destination);if(send){const sg=A.createGain();sg.gain.value=send;gn.connect(sg);sg.connect(out)}o.start(t);o.stop(t+dur+.05)};
 if(k===0){for(const m of ch.slice(0,3))for(const det of [-9,9]){const o=A.createOscillator(),f=A.createBiquadFilter(),gn=A.createGain();o.type='sawtooth';o.frequency.value=hz(m);o.detune.value=det;f.type='lowpass';f.frequency.setValueAtTime(500,t);f.frequency.linearRampToValueAtTime(1300,t+1.2);f.frequency.linearRampToValueAtTime(600,t+2.4);
   gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(.012*vol,t+.7);gn.gain.linearRampToValueAtTime(.009*vol,t+1.8);gn.gain.exponentialRampToValueAtTime(.0001,t+2.5);o.connect(f);f.connect(gn);gn.connect(A.destination);const sg=A.createGain();sg.gain.value=.5;gn.connect(sg);sg.connect(out);o.start(t);o.stop(t+2.6)}}
 voice(ch[ARP[k]]+12+(k%8===7?12:0),.32,'sine',.028,.008,.7);
 if(k===0||k===8||k===11)voice(ch[0]-24,.5,'sine',.06,.01,0);
 if(k===4||k===12){const b=A.createBufferSource(),f=A.createBiquadFilter(),g=A.createGain();if(!A._gn){A._gn=A.createBuffer(1,A.sampleRate*.1,A.sampleRate);const d=A._gn.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}b.buffer=A._gn;f.type='highpass';f.frequency.value=6000;g.gain.setValueAtTime(.02*vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+.08);b.connect(f);f.connect(g);g.connect(A.destination);b.start(t);b.stop(t+.1)}
 if(k===14&&bar%2===1)voice(ch[3]+24,.9,'triangle',.018,.02,.9)}};
export function bubble(c){
 const P=load();const wrap=document.createElement('div');wrap.className='bb-wrap';c.board.append(wrap);
 const opts=c.duel||{};let level=opts.level&&opts.level<=unlocked(P)?opts.level:null;
 let G=null,run=null;   // partie en cours et état d'affichage
 // ---- sons
 const au=()=>{const v=c.volume('sfx');if(!v)return null;const A=c.audio();return A?{A,v}:null};
 function tone(f0,f1,dur,type='sine',g=.06,delay=0){const a=au();if(!a)return;const {A,v}=a,t=A.currentTime+delay,o=A.createOscillator(),gn=A.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+dur);gn.gain.setValueAtTime(g*v,t);gn.gain.exponentialRampToValueAtTime(.0008,t+dur);o.connect(gn);gn.connect(A.destination);o.start(t);o.stop(t+dur+.02)}
 let nb=null;function noise(dur,g,freq,delay=0){const a=au();if(!a)return;const {A,v}=a;if(!nb){nb=A.createBuffer(1,A.sampleRate*.6,A.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}const t=A.currentTime+delay,s=A.createBufferSource(),f=A.createBiquadFilter(),gn=A.createGain();s.buffer=nb;f.type='lowpass';f.frequency.value=freq;gn.gain.setValueAtTime(g*v,t);gn.gain.exponentialRampToValueAtTime(.0008,t+dur);s.connect(f);f.connect(gn);gn.connect(A.destination);s.start(t);s.stop(t+dur+.02)}
 // vibrations (si le téléphone sait faire) : courtes au contact, plus fortes quand ça éclate
 const buzz=p=>{try{navigator.vibrate?.(p)}catch{}};
 const SFX={shoot:()=>{tone(260,520,.12,'triangle',.05);noise(.1,.04,2000)},wall:()=>tone(900,700,.04,'square',.02),stick:()=>{tone(200,90,.09,'sine',.09);noise(.05,.05,900)},
  pop:i=>{const f=520*Math.pow(1.07,Math.min(16,i));tone(f,f*1.8,.07,'sine',.06);noise(.04,.05,3000)},thump:n=>{tone(120,45,.22,'sine',Math.min(.16,.06+n*.008));noise(.12,.06,500)},drop:()=>tone(700,200,.35,'triangle',.04),chick:()=>[1400,1800,1500].forEach((f,i)=>tone(f,f*1.2,.06,'sine',.04,i*.07)),
  boom:()=>{noise(.45,.2,300);tone(140,50,.4,'square',.05)},zap:()=>{noise(.25,.1,4000);tone(1200,300,.25,'sawtooth',.03)},arm:()=>tone(600,900,.1,'triangle',.05),
  win:()=>[523,659,784,1046,1318].forEach((f,i)=>tone(f,f,.2,'triangle',.06,i*.11)),lose:()=>[392,330,262].forEach((f,i)=>tone(f,f*.97,.3,'triangle',.06,i*.18)),star:i=>tone(880+i*220,1200+i*300,.2,'sine',.06),descend:()=>{tone(220,110,.45,'sawtooth',.04);noise(.4,.08,400)},bonus:()=>tone(700,1400,.08,'square',.03)};

 // ---- musique sur mesure : ambiance galaxie (nappes, arpèges qui scintillent, écho spatial), 100 BPM
 setMusicTheme(galaxy);
 // ---- carte des niveaux
 function showMap(){wrap.innerHTML='';G=null;run=null;const n0=unlocked(P);
  const map=document.createElement('div');map.className='bb-map';
  const head=document.createElement('div');head.className='bb-maphead';head.innerHTML=`<b>★ ${totalStars(P)} / ${B.LEVELS*3}</b><span>${BOOSTS.map(([k,i])=>`<i>${i} ${P.boost[k]}</i>`).join('')}</span>`;
  const path=document.createElement('div');path.className='bb-path';
  for(let w=WORLDS.length-1;w>=0;w--){const W=WORLDS[w],sec=document.createElement('section');sec.className='bb-world';sec.style.background=`linear-gradient(${W.sky[0]},${W.sky[1]})`;
   const nodes=[];for(let i=24;i>=0;i--){const n=w*25+i+1,st=P.stars[n]||0,lock=n>n0,b=document.createElement('button');b.className='bb-node'+(lock?' lock':'')+(n===n0?' cur':'')+(st?' done':'');
    b.style.marginLeft=`calc(50% - 30px + ${Math.round(Math.sin(n*.9)*28)}%)`;b.innerHTML=`<span>${lock?'🔒':n}</span><em>${'★'.repeat(st)}${'☆'.repeat(lock?0:3-st)}</em>`;b.setAttribute('aria-label',lock?`Niveau ${n}, verrouillé`:`Niveau ${n}, ${st} étoile${st>1?'s':''}`);
    if(!lock)c.listen(b,'click',()=>intro(n));nodes.push(b)}
   const title=document.createElement('h3');title.textContent=`${w+1}. ${W.name}`;sec.append(...nodes,title);path.append(sec)}
  map.append(head,path);wrap.append(map);
  requestAnimationFrame(()=>{const cur=map.querySelector('.bb-node.cur')||map.querySelector('.bb-node:not(.lock)');if(cur)map.scrollTop+=cur.getBoundingClientRect().top-map.getBoundingClientRect().top-map.clientHeight/2})}
 function intro(n){const lv=B.makeLevel(n),W=WORLDS[lv.ep],m=document.createElement('div');m.className='bb-modal';
  m.innerHTML=`<div class="bb-card"><small>${W.name}</small><h2>Niveau ${n}</h2><p class="bb-goal">${goalIcon(lv.goal)} ${GOAL_TXT[lv.goal]}${lv.goal==='chicks'?` (${lv.chicks})`:''}</p>
   <p class="bb-info">${lv.colors} couleurs · le plafond descend tous les ${lv.every} tirs</p><p class="bb-info">★★★ en ${lv.stars[1]} tirs max · ★★ en ${lv.stars[0]}</p><p class="bb-stars">${'★'.repeat(P.stars[n]||0)}${'☆'.repeat(3-(P.stars[n]||0))}</p>
   <button class="bb-play">Jouer</button><button class="bb-back">Carte</button></div>`;wrap.append(m);
  c.listen(m.querySelector('.bb-play'),'click',()=>{m.remove();start(n)});c.listen(m.querySelector('.bb-back'),'click',()=>{m.remove();if(!wrap.querySelector('.bb-map'))showMap()})}
 const goalIcon=g=>g==='chicks'?'🌟':g==='top'?'⬆️':'🫧';

 // ---- partie
 function start(n){wrap.innerHTML='';level=n;G=B.newGame(n,(Math.random()*2**31)|0);
  const cv=document.createElement('canvas');cv.className='bb-canvas';cv.setAttribute('aria-label',`Éclate-Bulles, niveau ${n}`);
  const hud=document.createElement('div');hud.className='bb-hud';hud.innerHTML=`<div class="bb-top"><div class="bb-lvl">Niv. ${n}</div><div class="bb-score"><b>0</b><i></i></div><div class="bb-goalc"></div></div>
   <div class="bb-banner"></div><div class="bb-boosts">${BOOSTS.map(([k,i,t])=>`<button data-k="${k}" aria-label="${t}"><span>${i}</span><em></em></button>`).join('')}</div>`;
  wrap.append(cv,hud);const g=cv.getContext('2d');
  run={cv,g,hud,n,lw:400,lh:700,k:1,dpr:1,scroll:null,aim:null,fly:null,parts:[],falls:[],texts:[],chicks:[],armed:null,state:'aim',t:0,sprites:null,bg:null,shake:0,rings:[],flash:0,descOff:0};

  for(const b of hud.querySelectorAll('.bb-boosts button'))c.listen(b,'click',e=>{e.stopPropagation();boost(b.dataset.k)});
  c.listen(cv,'pointerdown',e=>{if(run.state!=='aim')return;cv.setPointerCapture?.(e.pointerId);point(e,true)});
  c.listen(cv,'pointermove',e=>{if(run.state!=='aim'||!run.down)return;point(e,false)});
  c.listen(cv,'pointerup',e=>{if(!run.down)return;run.down=false;const p=local(e);if(run.state==='aim'&&run.aim!=null&&p[1]<shooterY()-22)fire();else run.aim=null});
  boosts();goalHud();banner(`${goalIcon(G.goal)} ${GOAL_TXT[G.goal]}`,2.2)}
 function local(e){const r=run.cv.getBoundingClientRect();return [(e.clientX-r.left)/run.k,(e.clientY-r.top)/run.k]}
 const shooterY=()=>run.lh-B.FOOT;
 function point(e,down){const [x,y]=local(e);if(down){run.down=true;
   // toucher la bulle suivante (ou celle du lanceur) : échange
   if(Math.hypot(x-(B.W/2-74),y-(shooterY()+22))<30||Math.hypot(x-B.W/2,y-shooterY())<26){swap();run.down=false;return}}
  if(y>shooterY()-22){run.aim=null;return}const a=Math.atan2(shooterY()-y,x-B.W/2);run.aim=Math.max(.12,Math.min(Math.PI-.12,a))}
 function swap(){if(run.armed)return;const t=G.cur;G.cur=G.next;G.next=t;SFX.arm();run.swapT=.25}
 function boost(k){if(run.state!=='aim'||!P.boost[k])return;
  if(k==='slow'){P.boost.slow--;save(P);G.since-=5;banner('La descente attendra 5 tirs de plus',1.4);SFX.arm();boosts();return}
  run.armed=run.armed===k?null:k;SFX.arm();boosts()}
 function boosts(){for(const b of run.hud.querySelectorAll('.bb-boosts button')){const k=b.dataset.k;b.querySelector('em').textContent=P.boost[k];b.classList.toggle('on',run.armed===k);b.disabled=!P.boost[k]}}
 function goalHud(){const el=run.hud.querySelector('.bb-goalc');el.textContent=`${goalIcon(G.goal)} ${Math.max(0,B.goalLeft(G))}`}
 function banner(t,dur=1.6){const b=run.hud.querySelector('.bb-banner');b.textContent=t;b.classList.remove('show');void b.offsetWidth;b.classList.add('show');run.bannerT=dur}
 function ball(){return run.armed?{t:run.armed}:G.cur}
 function fire(){const b=ball(),v=B.view(G,run.lh);G.deadY=v.deadY;const res=B.trace(G,v.sx,v.sy,run.aim,b.t==='fire');
  if(run.armed){P.boost[run.armed]--;save(P);run.armed=null;boosts()}
  run.fly={b,res,pts:res.pts,seg:0,u:0,x:v.sx,y:v.sy};run.state='fly';run.aim=null;SFX.shoot()}
 // ---- résultat d'un tir : animations, score, fin de niveau
 function land(){const {b,res}=run.fly;run.fly=null;const before=G.score;const ev=B.shoot(G,b,res);
  const np=ev.popped.length;
  if(ev.placed){SFX.stick();if(!np){buzz(18);run.shake=Math.max(run.shake,.12)}jiggle(ev.placed)}
  ev.popped.forEach((b,i)=>{setTimeout(()=>{SFX.pop(i);run.rings.push({x:b.x,y:b.y,t:0,col:b.c!=null&&b.c>=0?PAL[b.c][0]:'#fff'})},i*28);burst(b.x,b.y,b,14);if(b.t==='chick')freeChick(b.x,b.y)});
  if(np){SFX.thump(np);buzz(np>=6?[40+np*4,30,60+np*4]:Math.min(120,35+np*8));run.shake=Math.max(run.shake,Math.min(1,.3+np*.06));run.flash=Math.min(.35,.1+np*.02)}
  if(ev.blasts.length){SFX.boom();buzz([70,30,110]);run.shake=1.3;run.flash=.5;for(const bl of ev.blasts)if(bl.x>=0)burst(bl.x,bl.y,{t:'n',c:5},22);else{SFX.zap();for(let x=20;x<400;x+=24)burst(x,bl.y,{t:'n',c:1},2)}}
  if(ev.star){SFX.zap();banner('Étoile ! Toutes les bulles de cette couleur éclatent',1.6)}
  for(const b of ev.dropped){run.falls.push({x:b.x,y:b.y,vx:(Math.random()-.5)*90,vy:-Math.random()*120,cell:b,life:1.6});if(b.t==='chick')freeChick(b.x,b.y)}
  if(ev.dropped.length){setTimeout(SFX.drop,120);if(ev.dropped.length>=8){banner(`Avalanche ! +${ev.dropped.length*40}`,1.3);setTimeout(()=>buzz([30,40,30,40,80]),160)}}
  const gain=G.score-before;if(gain>0&&res.end){run.texts.push({x:res.end[0],y:res.end[1],t:'+'+gain,life:1})}
  if(ev.descend){SFX.descend();buzz([50,40,90]);run.shake=.8;run.descOff=B.RH;banner('Le plafond descend !',1.1)}
  goalHud();
  if(G.won){run.state='bonus';run.bonusT=1.1;banner('Bravo !',1.4);SFX.win();setTimeout(()=>buzz([20,50,20,50,60]),200);return}
  if(G.lost){run.state='lost';run.lostT=.9;SFX.lose();buzz([120,60,220]);banner('Les bulles ont atteint la ligne !',2);return}
  run.state='aim'}
 // la bulle qui se colle bouscule un peu ses voisines
 function jiggle(nb){for(const o of B.neighborsOf(G,nb)){const d=Math.hypot(o.x-nb.x,o.y-nb.y)||1;o.jig=run.t;o.jx=(o.x-nb.x)/d;o.jy=(o.y-nb.y)/d}nb.jig=run.t;nb.jx=0;nb.jy=0;nb.born=run.t}
 function freeChick(x,y){SFX.chick();run.chicks.push({x,y,t:0})}
 function burst(x,y,cell,n){const col=cell.c!=null&&cell.c>=0?PAL[cell.c][0]:cell.t==='stone'?'#8a8f99':cell.t==='bomb'?'#ff9a3c':'#ffffff';for(let i=0;i<n;i++){const a=Math.random()*6.28,s=60+Math.random()*180;run.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.6+Math.random()*.4,col,r:2+Math.random()*3})}}
 function endLevel(win){const n=run.n,stars=B.starsFor(G),prev=P.stars[n]||0;
  if(win){P.stars[n]=Math.max(prev,stars);P.best[n]=Math.max(P.best[n]||0,G.score);let gift=null;
   if(stars===3&&prev<3||Math.random()<.25){gift=BOOSTS[Math.floor(Math.random()*BOOSTS.length)][0];P.boost[gift]++}save(P);
   const reward=40+40*Math.max(0,stars-prev)+(prev?0:40);
   const txt=`Niveau ${n} réussi : ${'★'.repeat(stars)}${'☆'.repeat(3-stars)}\n${G.shotsUsed} tirs · ${G.score} points${gift?` · booster offert : ${BOOSTS.find(b=>b[0]===gift)[1]}`:''}`;
   c.finish(true,totalStars(P),txt,{reward,title:stars===3?'Parfait !':'Niveau réussi !',actions:n<B.LEVELS?[['Niveau suivant',()=>c.relaunch({level:n+1})],['Carte',()=>c.relaunch({map:1})]]:[['Carte',()=>c.relaunch({map:1})],['Tous les jeux',null]]})}
  else{save(P);c.finish(false,totalStars(P),`Niveau ${n} raté. ${GOAL_TXT[G.goal]} : il en restait ${Math.max(0,B.goalLeft(G))}.`,{reward:15,title:'Raté !',actions:[['Réessayer',()=>c.relaunch({level:n})],['Carte',()=>c.relaunch({map:1})]]})}}

 // ---- dessin
 function sprites(){const s=Math.ceil((B.R*2+6)*run.k*run.dpr),mk=fn=>{const o=document.createElement('canvas');o.width=o.height=s;const x=o.getContext('2d');x.scale(s/(B.R*2+6),s/(B.R*2+6));x.translate(B.R+3,B.R+3);fn(x);return o};
  const ballSp=(c0,c1)=>mk(x=>{const gr=x.createRadialGradient(-6,-7,2,0,0,B.R);gr.addColorStop(0,'#ffffff');gr.addColorStop(.18,c0);gr.addColorStop(1,c1);x.fillStyle=gr;x.beginPath();x.arc(0,0,B.R-.5,0,7);x.fill();x.fillStyle='rgba(255,255,255,.55)';x.beginPath();x.ellipse(-6,-8,5,3,-.6,0,7);x.fill();x.strokeStyle='rgba(0,0,0,.18)';x.lineWidth=1;x.stroke()});
  const sp={c:PAL.map(([a,b])=>ballSp(a,b))};
  sp.stone=mk(x=>{const gr=x.createRadialGradient(-5,-6,2,0,0,B.R);gr.addColorStop(0,'#c9ccd3');gr.addColorStop(1,'#5d626c');x.fillStyle=gr;x.beginPath();x.arc(0,0,B.R-.5,0,7);x.fill();x.strokeStyle='#4a4e57';x.lineWidth=1.6;x.beginPath();x.moveTo(-8,-4);x.lineTo(-1,1);x.lineTo(-3,8);x.moveTo(-1,1);x.lineTo(7,-2);x.stroke()});
  sp.bomb=mk(x=>{const gr=x.createRadialGradient(-5,-6,2,0,0,B.R);gr.addColorStop(0,'#6b6f7a');gr.addColorStop(1,'#15171c');x.fillStyle=gr;x.beginPath();x.arc(0,3,B.R-4,0,7);x.fill();x.fillStyle='#8a5a34';x.fillRect(-2,-B.R+1,4,7);x.fillStyle='#ffcf3a';x.beginPath();x.arc(1,-B.R+1,3.4,0,7);x.fill();x.fillStyle='rgba(255,255,255,.4)';x.beginPath();x.ellipse(-6,-2,4,2.5,-.6,0,7);x.fill()});
  sp.bolt=mk(x=>{const gr=x.createRadialGradient(-5,-6,2,0,0,B.R);gr.addColorStop(0,'#fff6c2');gr.addColorStop(1,'#e2a50f');x.fillStyle=gr;x.beginPath();x.arc(0,0,B.R-.5,0,7);x.fill();x.fillStyle='#fff';x.beginPath();x.moveTo(3,-12);x.lineTo(-7,2);x.lineTo(0,2);x.lineTo(-3,12);x.lineTo(7,-2);x.lineTo(0,-2);x.closePath();x.fill()});
  sp.star=mk(x=>{const gr=x.createLinearGradient(-B.R,-B.R,B.R,B.R);['#ff5d5d','#ffd23f','#5fd068','#4cc3ff','#b67cff'].forEach((c0,i)=>gr.addColorStop(i/4,c0));x.fillStyle=gr;x.beginPath();x.arc(0,0,B.R-.5,0,7);x.fill();x.fillStyle='#fff';x.beginPath();for(let i=0;i<10;i++){const r=i%2?4.5:11,a=i*Math.PI/5-Math.PI/2;x.lineTo(Math.cos(a)*r,Math.sin(a)*r)}x.closePath();x.fill()});
  sp.rainbow=sp.star;
  sp.ice=mk(x=>{x.fillStyle='rgba(225,245,255,.62)';x.beginPath();x.arc(0,0,B.R-.5,0,7);x.fill();x.strokeStyle='rgba(255,255,255,.95)';x.lineWidth=2;x.stroke();x.lineWidth=1.2;x.beginPath();x.moveTo(-9,-9);x.lineTo(-3,-3);x.moveTo(6,-10);x.lineTo(3,-2);x.moveTo(9,6);x.lineTo(2,2);x.stroke()});
  // petite étoile mignonne (prisonnière de la bulle) : visage, joues roses, reflet
  sp.chick=mk(x=>{const st=(r1,r2)=>{x.beginPath();for(let i=0;i<10;i++){const r=i%2?r2:r1,a=-Math.PI/2+i*Math.PI/5;x.lineTo(Math.cos(a)*r,Math.sin(a)*r+1)}x.closePath()};
   x.fillStyle='#ffb72b';st(11,5.4);x.fill();x.fillStyle='#ffe066';st(9.6,4.7);x.fill();x.fillStyle='rgba(255,255,255,.7)';x.beginPath();x.ellipse(-3.2,-3.4,1.6,2.4,-.5,0,7);x.fill();
   x.fillStyle='#2b2622';x.beginPath();x.arc(-2.3,.6,1.15,0,7);x.arc(2.3,.6,1.15,0,7);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(-1.9,.2,.4,0,7);x.arc(2.7,.2,.4,0,7);x.fill();
   x.fillStyle='#ff8fa3';x.beginPath();x.ellipse(-4,2.6,1.4,.9,0,0,7);x.ellipse(4,2.6,1.4,.9,0,0,7);x.fill();x.strokeStyle='#2b2622';x.lineWidth=.9;x.beginPath();x.arc(0,2.2,1.3,.2,Math.PI-.2);x.stroke()});
  sp.fire=mk(x=>{const gr=x.createRadialGradient(0,2,2,0,0,B.R);gr.addColorStop(0,'#fff3b0');gr.addColorStop(.4,'#ffb02e');gr.addColorStop(1,'#e2431f');x.fillStyle=gr;x.beginPath();x.arc(0,0,B.R-.5,0,7);x.fill();x.fillStyle='rgba(255,255,255,.5)';x.beginPath();x.ellipse(-5,-7,4,2.5,-.6,0,7);x.fill()});
  sp.bombBall=sp.bomb;return sp}
 function background(){const o=document.createElement('canvas');o.width=Math.ceil(run.lw*run.k*run.dpr);o.height=Math.ceil(run.lh*run.k*run.dpr);const x=o.getContext('2d');x.scale(run.k*run.dpr,run.k*run.dpr);
  const W0=WORLDS[G.lv.ep],gr=x.createLinearGradient(0,0,0,run.lh);gr.addColorStop(0,W0.sky[0]);gr.addColorStop(1,W0.sky[1]);x.fillStyle=gr;x.fillRect(0,0,run.lw,run.lh);
  let s=G.n*97+3;const r=()=>(s=(s*16807)%2147483647)/2147483647;const base=run.lh-B.FOOT+40;x.fillStyle=W0.hill;
  if(W0.deco==='planets'){for(let i=0;i<60;i++){x.fillStyle=`rgba(255,255,255,${.3+r()*.6})`;x.fillRect(r()*400,r()*run.lh,1.5,1.5)}x.fillStyle='#e07a5f';x.beginPath();x.arc(330,base-120,38,0,7);x.fill();x.strokeStyle='rgba(255,220,190,.6)';x.lineWidth=4;x.beginPath();x.ellipse(330,base-120,60,12,-.3,0,7);x.stroke();x.fillStyle='#81b29a';x.beginPath();x.arc(60,base-60,20,0,7);x.fill()}
  else if(W0.deco==='trees'){x.globalAlpha=.75;for(let i=0;i<14;i++){const tx=i*31+r()*10,h=60+r()*70;x.beginPath();x.moveTo(tx-18,base);x.lineTo(tx,base-h);x.lineTo(tx+18,base);x.fill()}x.globalAlpha=1;for(let i=0;i<30;i++){x.fillStyle=`rgba(255,255,255,${.2+r()*.4})`;x.fillRect(r()*400,r()*run.lh*.5,1.5,1.5)}}
  else if(W0.deco==='waves'){x.globalAlpha=.5;for(let j=0;j<3;j++){x.beginPath();x.moveTo(0,base);for(let px=0;px<=400;px+=10)x.lineTo(px,base-30-j*26+Math.sin(px/40+j)*8);x.lineTo(400,run.lh);x.lineTo(0,run.lh);x.fill()}x.globalAlpha=1}
  else if(W0.deco==='peaks'){x.fillStyle='rgba(30,40,70,.45)';x.beginPath();x.moveTo(0,base);for(let i=0;i<=8;i++)x.lineTo(i*50,base-(i%2?110+r()*40:40));x.lineTo(400,base);x.fill();x.fillStyle='rgba(240,246,255,.5)';for(let i=0;i<40;i++)x.fillRect(r()*400,r()*run.lh,2,2)}
  else if(W0.deco==='dunes'){x.globalAlpha=.6;for(let j=0;j<2;j++){x.beginPath();x.moveTo(0,base);for(let px=0;px<=400;px+=10)x.lineTo(px,base-40-j*40+Math.sin(px/70+j*2)*22);x.lineTo(400,run.lh);x.lineTo(0,run.lh);x.fill()}x.globalAlpha=1;x.fillStyle='rgba(255,230,160,.8)';x.beginPath();x.arc(320,140,30,0,7);x.fill()}
  else if(W0.deco==='tents'){x.globalAlpha=.6;for(let i=0;i<5;i++){const tx=i*90+20;x.fillStyle=i%2?'#c0396b':'#2a0f33';x.beginPath();x.moveTo(tx-34,base);x.lineTo(tx,base-80);x.lineTo(tx+34,base);x.fill()}x.globalAlpha=1;for(let i=0;i<24;i++){x.fillStyle=['#ffd23f','#ff5d5d','#4cc3ff'][i%3];x.beginPath();x.arc(r()*400,r()*run.lh*.6,2,0,7);x.fill()}}
  return o}
 function drawCell(x,y,cell,sc=1){const g=run.g,sp=run.sprites,s=B.R*2+6;const img=cell.t==='n'||cell.t==='chick'?sp.c[cell.c]:cell.t==='ice'?sp.c[cell.c]:sp[cell.t];if(!img)return;
  g.drawImage(img,x-s/2*sc,y-s/2*sc,s*sc,s*sc);if(cell.t==='ice')g.drawImage(sp.ice,x-s/2*sc,y-s/2*sc,s*sc,s*sc);if(cell.t==='chick')g.drawImage(sp.chick,x-s/2*sc,y-s/2*sc,s*sc,s*sc)}
 function drawBall(b,x,y,sc=1){if(b.t==='c')drawCell(x,y,{t:'n',c:b.c},sc);else if(b.t==='rainbow')drawCell(x,y,{t:'star'},sc);else if(b.t==='bomb')drawCell(x,y,{t:'bomb'},sc);else if(b.t==='fire')drawCell(x,y,{t:'fire'},sc)}
 function draw(){const r=run,g=r.g,cssW=wrap.clientWidth,cssH=wrap.clientHeight;if(!cssW||!cssH)return;
  const dpr=Math.min(window.devicePixelRatio||1,2),k=cssW/400;if(r.cssW!==cssW||r.cssH!==cssH||r.dpr!==dpr){r.cssW=cssW;r.cssH=cssH;r.dpr=dpr;r.k=k;r.lw=400;r.lh=cssH/k;r.cv.width=Math.round(cssW*dpr);r.cv.height=Math.round(cssH*dpr);r.sprites=sprites();r.bg=background()}
  const v=B.view(G,r.lh);if(r.scroll==null)r.scroll=v.scroll;r.scroll+=(v.scroll-r.scroll)*Math.min(1,r.dt*6);if(Math.abs(v.scroll-r.scroll)<.5)r.scroll=v.scroll;
  g.setTransform(1,0,0,1,0,0);g.drawImage(r.bg,0,0);g.setTransform(k*dpr,0,0,k*dpr,0,0);
  let sx=0,sy=0;if(r.shake>0){sx=(Math.random()-.5)*12*r.shake;sy=(Math.random()-.5)*12*r.shake}g.translate(sx,sy);
  const Y=wy=>B.HUD+wy-r.scroll,off=r.descOff;
  // plafond (descend tous les X tirs) et ligne à ne pas franchir
  {const cb=Y(G.top-off);g.fillStyle='rgba(0,0,0,.25)';g.fillRect(0,0,400,B.HUD);
   if(cb>B.HUD){const gr=g.createLinearGradient(0,B.HUD,0,cb);gr.addColorStop(0,'#2b2f45');gr.addColorStop(1,'#4b5172');g.fillStyle=gr;g.fillRect(0,B.HUD,400,cb-B.HUD);
    g.fillStyle='rgba(255,255,255,.08)';for(let yy=B.HUD+B.RH/2;yy<cb-4;yy+=B.RH)for(let xx=14;xx<400;xx+=40){g.beginPath();g.arc(xx,yy,2.2,0,7);g.fill()}}
   g.fillStyle='rgba(255,210,90,.85)';for(let xx=-20;xx<420;xx+=20){g.beginPath();g.moveTo(xx,cb-5);g.lineTo(xx+10,cb-5);g.lineTo(xx+4,cb);g.lineTo(xx-6,cb);g.fill()}
   g.fillStyle='rgba(255,255,255,.35)';g.fillRect(0,cb-6,400,1.5)}
  {const dy=Y(v.deadY),left=G.every-G.since,danger=left<=1;g.strokeStyle=danger?'rgba(255,90,90,.95)':'rgba(255,120,120,.6)';g.setLineDash([8,6]);g.lineWidth=2;g.beginPath();g.moveTo(0,dy);g.lineTo(400,dy);g.stroke();g.setLineDash([]);
   g.fillStyle=danger?'#ffb3a8':'rgba(255,255,255,.8)';g.font='700 11px system-ui';g.textAlign='right';g.fillText(`⬇ dans ${left} tir${left>1?'s':''}`,394,dy-6);g.textAlign='left'}
  // bulles : celle qui vient de se coller s'écrase un peu, ses voisines sont bousculées
  for(const bb of G.bubbles){let x=bb.x,y=Y(bb.y-off),sc=1;if(y<-B.R||y>r.lh)continue;
   if(bb.jig!=null){const e=r.t-bb.jig;if(e<.4){const a=Math.sin(e*28)*(1-e/.4);x+=bb.jx*a*4;y+=bb.jy*a*4;if(!bb.jx&&!bb.jy)sc=1+a*.12}else bb.jig=null}
   drawCell(x,y,bb,sc)}
  // ondes de choc des bulles qui éclatent
  for(const q of r.rings){const u=q.t/.35;g.globalAlpha=Math.max(0,1-u);g.strokeStyle=q.col;g.lineWidth=3*(1-u)+1;g.beginPath();g.arc(q.x,Y(q.y),B.R*(.6+u*1.4),0,7);g.stroke()}g.globalAlpha=1;
  // visée : pointillés qui rebondissent (longue amorce, sans point d'arrivée)
  const b=ball(),shY=shooterY();
  if(r.state==='aim'&&r.aim!=null){const res=B.trace(G,v.sx,v.sy,r.aim,b.t==='fire');const pts=res.pts;let acc=0;const spacing=15,phase=(r.t*40)%spacing,MAX=440;g.fillStyle=b.t==='fire'?'#ffb02e':b.t==='c'?PAL[b.c][0]:'#ffffff';
   // juste une amorce de visée : pas de point d'arrivée
   for(let i=0;i<pts.length-1&&acc<MAX;i++){const [x0,y0]=pts[i],[x1,y1]=pts[i+1],L=Math.hypot(x1-x0,y1-y0);for(let d=spacing-((acc+phase)%spacing);d<L&&acc+d<MAX;d+=spacing){const t=d/L,px=x0+(x1-x0)*t,py=Y(y0+(y1-y0)*t);g.globalAlpha=Math.max(0,1-(acc+d)/MAX);g.beginPath();g.arc(px,py,3.2,0,7);g.fill()}acc+=L}g.globalAlpha=1}
  // bulle en vol
  if(r.fly){drawBall(r.fly.b,r.fly.x,Y(r.fly.y));if(r.fly.b.t==='fire'){for(let i=0;i<3;i++){r.parts.push({x:r.fly.x+(Math.random()-.5)*10,y:r.fly.y+(Math.random()-.5)*10,vx:0,vy:30,life:.35,col:'#ffb02e',r:3})}}}
  // chutes, particules, textes, étoiles libérées
  for(const f of r.falls){g.globalAlpha=Math.min(1,f.life);drawCell(f.x,Y(f.y),f.cell,.95)}g.globalAlpha=1;
  for(const p of r.parts){g.globalAlpha=Math.max(0,Math.min(1,p.life*1.6));g.fillStyle=p.col;g.beginPath();g.arc(p.x,Y(p.y),p.r,0,7);g.fill()}g.globalAlpha=1;
  g.textAlign='center';for(const t of r.texts){g.globalAlpha=Math.min(1,t.life*2);g.font='800 16px system-ui';g.lineWidth=3;g.strokeStyle='rgba(0,0,0,.45)';g.strokeText(t.t,t.x,Y(t.y));g.fillStyle='#fff';g.fillText(t.t,t.x,Y(t.y))}g.globalAlpha=1;
  for(const ch of r.chicks){const u=Math.min(1,ch.t/.9),x=ch.x+(360-ch.x)*u*u,y=Y(ch.y)+(36-Y(ch.y))*u-Math.sin(u*Math.PI)*60;g.drawImage(r.sprites.chick,x-21,y-21,42,42)}
  g.translate(-sx,-sy);
  if(r.flash>0){g.fillStyle=`rgba(255,255,255,${r.flash*.5})`;g.fillRect(0,0,400,r.lh)}
  // lanceur : bulle chargée, compteur, bulle suivante
  g.fillStyle='rgba(0,0,0,.28)';g.beginPath();g.arc(200,shY,30,0,7);g.fill();g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=3;g.beginPath();g.arc(200,shY,30,Math.PI*.15,Math.PI*.85,true);g.stroke();
  if(r.state!=='fly'&&r.state!=='bonus'){const sw=r.swapT>0?1-r.swapT*2:1;drawBall(b,200,shY,Math.max(.4,sw))}
  g.fillStyle='#fff';g.font='800 13px system-ui';g.textAlign='center';g.fillText(`${G.shotsUsed} tir${G.shotsUsed>1?'s':''}`,200,shY+48);
  if(!r.armed&&G.next){g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.arc(126,shY+22,20,0,7);g.fill();drawBall(G.next,126,shY+22,.7);g.fillStyle='rgba(255,255,255,.7)';g.font='700 11px system-ui';g.fillText('⇄',148,shY+40)}
  // aide : glisser pour viser
  if(r.state==='aim'&&r.aim==null&&G.shotsUsed===0&&run.n<=3){g.fillStyle='rgba(255,255,255,.85)';g.font='700 14px system-ui';g.fillText('Glisse vers le haut pour viser, relâche pour tirer',200,shY-60)}}

 function tick(dt){const r=run;r.dt=dt;r.t+=dt;r.shake=Math.max(0,r.shake-dt*2.8);r.flash=Math.max(0,r.flash-dt*2.2);r.descOff=Math.max(0,r.descOff-Math.max(30,r.descOff*7)*dt);for(const q of r.rings)q.t+=dt;r.rings=r.rings.filter(q=>q.t<.35);r.swapT=Math.max(0,(r.swapT||0)-dt);
  if(r.bannerT>0){r.bannerT-=dt;if(r.bannerT<=0)r.hud.querySelector('.bb-banner').classList.remove('show')}
  if(r.fly){let move=1500*dt;const f=r.fly;while(move>0&&f.seg<f.pts.length-1){const [x0,y0]=f.pts[f.seg],[x1,y1]=f.pts[f.seg+1],L=Math.hypot(x1-x0,y1-y0)||1e-6,rest=L*(1-f.u);if(move>=rest){move-=rest;f.seg++;f.u=0;if(f.seg<f.pts.length-1&&f.b.t!=='fire')SFX.wall()}else{f.u+=move/L;move=0}}
   const i=Math.min(f.seg,f.pts.length-2),[x0,y0]=f.pts[i],[x1,y1]=f.pts[i+1];f.x=x0+(x1-x0)*f.u;f.y=y0+(y1-y0)*f.u;if(f.seg>=f.pts.length-1){f.x=f.pts.at(-1)[0];f.y=f.pts.at(-1)[1];land()}}
  for(const p of r.parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=380*dt;p.life-=dt}r.parts=r.parts.filter(p=>p.life>0);if(r.parts.length>400)r.parts.splice(0,r.parts.length-400);
  for(const f of r.falls){f.vy+=900*dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.life-=dt;const by=B.view(G,r.lh).sy+r.scroll*0+30;if(f.y>by&&f.vy>0){f.vy*=-.35;f.y=by;if(!f.bounced){f.bounced=1;burst(f.x,f.y,f.cell,3)}}}r.falls=r.falls.filter(f=>f.life>0);
  for(const t of r.texts){t.y-=40*dt;t.life-=dt}r.texts=r.texts.filter(t=>t.life>0);
  for(const ch of r.chicks)ch.t+=dt;r.chicks=r.chicks.filter(ch=>ch.t<.95);
  if(r.state==='bonus'){r.bonusT-=dt;if(r.bonusT<=0&&!r.falls.length){r.state='done';stars()}}
  if(r.state==='lost'){r.lostT-=dt;if(r.lostT<=0){r.state='done';endLevel(false)}}
  const sc=r.hud.querySelector('.bb-score b');if(sc.textContent!==String(G.score))sc.textContent=G.score;
  {const st=G.shotsUsed<=G.lv.stars[1]?3:G.shotsUsed<=G.lv.stars[0]?2:1,el=r.hud.querySelector('.bb-score i');if(el.dataset.s!==String(st)){el.dataset.s=st;el.textContent='★'.repeat(st)+'☆'.repeat(3-st)}}
  draw()}
 function stars(){const n=B.starsFor(G),m=document.createElement('div');m.className='bb-starshow';m.innerHTML=`<div>${[0,1,2].map(i=>`<b class="${i<n?'on':''}" style="animation-delay:${.15+i*.3}s">★</b>`).join('')}</div><p>${G.score} points</p>`;wrap.append(m);for(let i=0;i<n;i++)setTimeout(()=>SFX.star(i),150+i*300);setTimeout(()=>endLevel(true),1500)}

 // accroche pour les tests automatiques
 if(window.__bbTest)window.__bb={get G(){return G},get run(){return run},B,P,shootAt:a=>{if(run&&run.state==='aim'){run.aim=a;fire()}},tick:dt=>{if(run&&G)tick(dt)}};
 showMap();if(level)intro(level);
 return {update(dt){if(run&&G)tick(dt)},destroy(){setMusicTheme(null)},
  key(k){if(!run||run.state!=='aim')return;if(k==='ArrowLeft'){run.aim=Math.min(Math.PI-.12,(run.aim??Math.PI/2)+.04)}else if(k==='ArrowRight'){run.aim=Math.max(.12,(run.aim??Math.PI/2)-.04)}else if((k===' '||k==='ArrowUp')&&run.aim!=null)fire();else if(k==='s'||k==='S')swap()}};
}
