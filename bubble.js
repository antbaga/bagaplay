// Éclate-Bulles : jeu de tir de bulles avec carte de 150 niveaux (6 mondes), étoiles, boosters et bulles spéciales.
import * as B from './bubble-engine.js';

const STORE='bagaplay-bubble';
const PAL=[['#ff5d5d','#c42a35'],['#ffd23f','#d99a0b'],['#5fd068','#239a3b'],['#4cc3ff','#1a7fd0'],['#b67cff','#7339cf'],['#ff9a3c','#d4620e']];
const WORLDS=[
 {name:'Forêt de nuit',sky:['#1a2140','#2c3d6b'],hill:'#141a33',deco:'trees'},
 {name:'Lagon',sky:['#0c4a5e','#1f8ea3'],hill:'#0a3a4a',deco:'waves'},
 {name:'Cimes enneigées',sky:['#2b3a62','#6f8fc4'],hill:'#e9f0fb',deco:'peaks'},
 {name:'Désert doré',sky:['#6b3a1f','#e2954a'],hill:'#8a5426',deco:'dunes'},
 {name:'Fête foraine',sky:['#3c1747','#a03f86'],hill:'#2a0f33',deco:'tents'},
 {name:'Espace',sky:['#06081c','#1d1f4f'],hill:'#0d1030',deco:'planets'}];
const GOAL_TXT={clear:'Éclate toutes les bulles',chicks:'Libère tous les poussins',top:'Dégage la rangée du haut'};
const BOOSTS=[['rainbow','🌈','Arc-en-ciel'],['bomb','💣','Bombe'],['fire','🔥','Boule de feu'],['plus5','+5','5 bulles de plus']];
function load(){try{const o=JSON.parse(localStorage.getItem(STORE)||'{}');return {stars:o.stars||{},best:o.best||{},boost:Object.assign({rainbow:3,bomb:3,fire:3,plus5:2},o.boost||{})}}catch{return {stars:{},best:{},boost:{rainbow:3,bomb:3,fire:3,plus5:2}}}}
function save(p){try{localStorage.setItem(STORE,JSON.stringify(p))}catch{}}
export const totalStars=p=>Object.values(p.stars).reduce((a,b)=>a+b,0);
const unlocked=p=>{let n=1;while(n<B.LEVELS&&p.stars[n])n++;return n};

export function bubble(c){
 const P=load();const wrap=document.createElement('div');wrap.className='bb-wrap';c.board.append(wrap);
 const opts=c.duel||{};let level=opts.level&&opts.level<=unlocked(P)?opts.level:null;
 let G=null,run=null;   // partie en cours et état d'affichage
 // ---- sons
 const au=()=>{const v=c.volume('sfx');if(!v)return null;const A=c.audio();return A?{A,v}:null};
 function tone(f0,f1,dur,type='sine',g=.06,delay=0){const a=au();if(!a)return;const {A,v}=a,t=A.currentTime+delay,o=A.createOscillator(),gn=A.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+dur);gn.gain.setValueAtTime(g*v,t);gn.gain.exponentialRampToValueAtTime(.0008,t+dur);o.connect(gn);gn.connect(A.destination);o.start(t);o.stop(t+dur+.02)}
 let nb=null;function noise(dur,g,freq,delay=0){const a=au();if(!a)return;const {A,v}=a;if(!nb){nb=A.createBuffer(1,A.sampleRate*.6,A.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}const t=A.currentTime+delay,s=A.createBufferSource(),f=A.createBiquadFilter(),gn=A.createGain();s.buffer=nb;f.type='lowpass';f.frequency.value=freq;gn.gain.setValueAtTime(g*v,t);gn.gain.exponentialRampToValueAtTime(.0008,t+dur);s.connect(f);f.connect(gn);gn.connect(A.destination);s.start(t);s.stop(t+dur+.02)}
 const SFX={shoot:()=>{tone(260,520,.12,'triangle',.05);noise(.1,.04,2000)},wall:()=>tone(900,700,.04,'square',.02),stick:()=>tone(180,120,.07,'sine',.07),
  pop:i=>{const f=520*Math.pow(1.07,Math.min(16,i));tone(f,f*1.8,.07,'sine',.05)},drop:()=>tone(700,200,.35,'triangle',.04),chick:()=>[1400,1800,1500].forEach((f,i)=>tone(f,f*1.2,.06,'sine',.04,i*.07)),
  boom:()=>{noise(.45,.2,300);tone(140,50,.4,'square',.05)},zap:()=>{noise(.25,.1,4000);tone(1200,300,.25,'sawtooth',.03)},arm:()=>tone(600,900,.1,'triangle',.05),
  win:()=>[523,659,784,1046,1318].forEach((f,i)=>tone(f,f,.2,'triangle',.06,i*.11)),lose:()=>[392,330,262].forEach((f,i)=>tone(f,f*.97,.3,'triangle',.06,i*.18)),star:i=>tone(880+i*220,1200+i*300,.2,'sine',.06),bonus:()=>tone(700,1400,.08,'square',.03)};

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
   <p class="bb-info">${lv.shots} bulles · ${lv.colors} couleurs${lv.drop?` · le plafond descend tous les ${lv.drop} tirs`:''}</p><p class="bb-stars">${'★'.repeat(P.stars[n]||0)}${'☆'.repeat(3-(P.stars[n]||0))}</p>
   <button class="bb-play">Jouer</button><button class="bb-back">Carte</button></div>`;wrap.append(m);
  c.listen(m.querySelector('.bb-play'),'click',()=>{m.remove();start(n)});c.listen(m.querySelector('.bb-back'),'click',()=>{m.remove();if(!wrap.querySelector('.bb-map'))showMap()})}
 const goalIcon=g=>g==='chicks'?'🐥':g==='top'?'⬆️':'🫧';

 // ---- partie
 function start(n){wrap.innerHTML='';level=n;G=B.newGame(n,(Math.random()*2**31)|0);
  const cv=document.createElement('canvas');cv.className='bb-canvas';cv.setAttribute('aria-label',`Éclate-Bulles, niveau ${n}`);
  const hud=document.createElement('div');hud.className='bb-hud';hud.innerHTML=`<div class="bb-top"><div class="bb-lvl">Niv. ${n}</div><div class="bb-score"><b>0</b><i><u></u><s style="left:${0}%"></s><s></s><s></s></i></div><div class="bb-goalc"></div></div>
   <div class="bb-banner"></div><div class="bb-boosts">${BOOSTS.map(([k,i,t])=>`<button data-k="${k}" aria-label="${t}"><span>${i}</span><em></em></button>`).join('')}</div>`;
  wrap.append(cv,hud);const g=cv.getContext('2d');
  run={cv,g,hud,n,lw:400,lh:700,k:1,dpr:1,scroll:null,aim:null,fly:null,parts:[],falls:[],texts:[],chicks:[],armed:null,state:'aim',t:0,bonus:0,bonusT:0,sprites:null,bg:null,shake:0};
  const lv=G.lv,[s2,s3]=lv.stars;run.s3=s3;run.s2=s2;
  hud.querySelector('.bb-score i').innerHTML=`<u></u><s style="left:${Math.round(s2/s3*100)}%"></s><s style="left:99%"></s>`;
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
  if(k==='plus5'){P.boost.plus5--;save(P);G.shots+=5;banner('+5 bulles !',1.4);SFX.arm();boosts();return}
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
  if(ev.placed)SFX.stick();
  ev.popped.forEach(([r,cc,cell],i)=>{const x=B.cx(r,cc),y=B.cy(G,r);setTimeout(()=>SFX.pop(i),i*28);burst(x,y,cell,8);if(cell.t==='chick')freeChick(x,y)});
  if(ev.blasts.length){SFX.boom();run.shake=1;for(const [r,cc] of ev.blasts)if(cc>=0)burst(B.cx(r,cc),B.cy(G,r),{t:'n',c:5},22);else{SFX.zap();for(let x=20;x<400;x+=24)burst(x,B.cy(G,r),{t:'n',c:1},2)}}
  if(ev.star){SFX.zap();banner('Étoile ! Toutes les bulles de cette couleur éclatent',1.6)}
  for(const [r,cc,cell] of ev.dropped){run.falls.push({x:B.cx(r,cc),y:B.cy(G,r),vx:(Math.random()-.5)*90,vy:-Math.random()*120,cell,life:1.6});if(cell.t==='chick')freeChick(B.cx(r,cc),B.cy(G,r))}
  if(ev.dropped.length){setTimeout(SFX.drop,120);if(ev.dropped.length>=8)banner(`Avalanche ! +${ev.dropped.length*40}`,1.3)}
  const gain=G.score-before;if(gain>0&&res.cell){run.texts.push({x:B.cx(...res.cell),y:B.cy(G,res.cell[0]),t:'+'+gain,life:1})}
  if(ev.ceil){banner('Le plafond descend !',1.2);run.shake=.6}
  goalHud();
  if(G.won){run.state='bonus';run.bonus=G.shots;run.bonusT=.6;banner(G.shots?`Bravo ! Bonus : ${G.shots} bulles restantes`:'Bravo !',1.8);SFX.win();return}
  if(G.lost){run.state='lost';run.lostT=.9;SFX.lose();banner(G.lost==='line'?'Les bulles ont atteint la ligne !':'Plus de bulles !',2);return}
  run.state='aim'}
 function freeChick(x,y){SFX.chick();run.chicks.push({x,y,t:0})}
 function burst(x,y,cell,n){const col=cell.c!=null&&cell.c>=0?PAL[cell.c][0]:cell.t==='stone'?'#8a8f99':cell.t==='bomb'?'#ff9a3c':'#ffffff';for(let i=0;i<n;i++){const a=Math.random()*6.28,s=60+Math.random()*180;run.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.6+Math.random()*.4,col,r:2+Math.random()*3})}}
 function endLevel(win){const n=run.n,stars=B.starsFor(G),prev=P.stars[n]||0;
  if(win){P.stars[n]=Math.max(prev,stars);P.best[n]=Math.max(P.best[n]||0,G.score);let gift=null;
   if(stars===3&&prev<3||Math.random()<.25){gift=BOOSTS[Math.floor(Math.random()*BOOSTS.length)][0];P.boost[gift]++}save(P);
   const reward=40+40*Math.max(0,stars-prev)+(prev?0:40);
   const txt=`Niveau ${n} réussi : ${'★'.repeat(stars)}${'☆'.repeat(3-stars)}\n${G.score} points${gift?` · booster offert : ${BOOSTS.find(b=>b[0]===gift)[1]}`:''}`;
   c.finish(true,totalStars(P),txt,{reward,title:stars===3?'Parfait !':'Niveau réussi !',actions:n<B.LEVELS?[['Niveau suivant',()=>c.relaunch({level:n+1})],['Carte',()=>c.relaunch({map:1})]]:[['Carte',()=>c.relaunch({map:1})],['Tous les jeux',null]]})}
  else{save(P);c.finish(false,totalStars(P),`Niveau ${n} raté. ${GOAL_TXT[G.goal]} : il en restait ${Math.max(0,B.goalLeft(G))}.`,{reward:15,title:'Raté !',actions:[['Réessayer',()=>c.relaunch({level:n})],['Carte',()=>c.relaunch({map:1})]]})}}
 function offerMore(){const m=document.createElement('div');m.className='bb-modal';m.innerHTML=`<div class="bb-card"><h2>Plus de bulles !</h2><p class="bb-info">Utiliser un booster « +5 bulles » ? (il t’en reste ${P.boost.plus5})</p><button class="bb-play">+5 bulles</button><button class="bb-back">Abandonner</button></div>`;wrap.append(m);
  c.listen(m.querySelector('.bb-play'),'click',()=>{m.remove();P.boost.plus5--;save(P);G.shots=5;G.lost=null;boosts();run.state='aim';banner('+5 bulles !',1.2)});c.listen(m.querySelector('.bb-back'),'click',()=>{m.remove();endLevel(false)})}

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
  sp.chick=mk(x=>{x.fillStyle='#ffe066';x.beginPath();x.arc(0,2,9,0,7);x.fill();x.fillStyle='#ffd23f';x.beginPath();x.arc(0,-6,6.5,0,7);x.fill();x.fillStyle='#2b2622';x.beginPath();x.arc(-2.4,-7,1.3,0,7);x.arc(2.4,-7,1.3,0,7);x.fill();x.fillStyle='#ff8a2a';x.beginPath();x.moveTo(-2,-4.6);x.lineTo(2,-4.6);x.lineTo(0,-2.4);x.fill()});
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
  let sx=0,sy=0;if(r.shake>0){sx=(Math.random()-.5)*8*r.shake;sy=(Math.random()-.5)*8*r.shake}g.translate(sx,sy);
  const Y=wy=>B.HUD+wy-r.scroll;
  // plafond
  const top=Y(G.ceil*B.RH);g.fillStyle='rgba(0,0,0,.25)';g.fillRect(0,0,400,Math.max(B.HUD,top));g.fillStyle='rgba(255,255,255,.18)';g.fillRect(0,top-3,400,3);
  // ligne à ne pas franchir (plafond qui descend)
  if(G.dropEvery){const dy=Y(v.deadY);g.strokeStyle='rgba(255,90,90,.75)';g.setLineDash([8,6]);g.lineWidth=2;g.beginPath();g.moveTo(0,dy);g.lineTo(400,dy);g.stroke();g.setLineDash([]);
   const left=G.dropEvery-G.since;g.fillStyle='rgba(255,255,255,.8)';g.font='700 11px system-ui';g.textAlign='right';g.fillText(`⬇ dans ${left} tir${left>1?'s':''}`,394,dy-6)}
  // bulles
  G.rows.forEach((row,rr)=>{const y=Y(B.cy(G,rr));if(y<-B.R||y>r.lh)return;row.forEach((cell,cc)=>{if(cell)drawCell(B.cx(rr,cc),y,cell)})});
  // visée : pointillés qui rebondissent, bulle fantôme à l'arrivée
  const b=ball(),shY=shooterY();
  if(r.state==='aim'&&r.aim!=null){const res=B.trace(G,v.sx,v.sy,r.aim,b.t==='fire');const pts=res.pts;let acc=0,spacing=15,phase=(r.t*40)%spacing;g.fillStyle=b.t==='fire'?'#ffb02e':b.t==='c'?PAL[b.c][0]:'#ffffff';
   for(let i=0;i<pts.length-1;i++){const [x0,y0]=pts[i],[x1,y1]=pts[i+1],L=Math.hypot(x1-x0,y1-y0);for(let d=spacing-((acc+phase)%spacing);d<L;d+=spacing){const t=d/L,px=x0+(x1-x0)*t,py=Y(y0+(y1-y0)*t);const fade=Math.max(.25,1-(acc+d)/700);g.globalAlpha=fade;g.beginPath();g.arc(px,py,3.2,0,7);g.fill()}acc+=L}g.globalAlpha=1;
   if(res.cell){const [cr,cc]=res.cell;g.strokeStyle='rgba(255,255,255,.7)';g.lineWidth=2;g.setLineDash([4,4]);g.beginPath();g.arc(B.cx(cr,cc),Y(B.cy(G,cr)),B.R-2,0,7);g.stroke();g.setLineDash([])}}
  // bulle en vol
  if(r.fly){drawBall(r.fly.b,r.fly.x,Y(r.fly.y));if(r.fly.b.t==='fire'){for(let i=0;i<3;i++){r.parts.push({x:r.fly.x+(Math.random()-.5)*10,y:r.fly.y+(Math.random()-.5)*10,vx:0,vy:30,life:.35,col:'#ffb02e',r:3})}}}
  // chutes, particules, textes, poussins libérés
  for(const f of r.falls){g.globalAlpha=Math.min(1,f.life);drawCell(f.x,Y(f.y),f.cell,.95)}g.globalAlpha=1;
  for(const p of r.parts){g.globalAlpha=Math.max(0,Math.min(1,p.life*1.6));g.fillStyle=p.col;g.beginPath();g.arc(p.x,Y(p.y),p.r,0,7);g.fill()}g.globalAlpha=1;
  g.textAlign='center';for(const t of r.texts){g.globalAlpha=Math.min(1,t.life*2);g.font='800 16px system-ui';g.lineWidth=3;g.strokeStyle='rgba(0,0,0,.45)';g.strokeText(t.t,t.x,Y(t.y));g.fillStyle='#fff';g.fillText(t.t,t.x,Y(t.y))}g.globalAlpha=1;
  for(const ch of r.chicks){const u=Math.min(1,ch.t/.9),x=ch.x+(360-ch.x)*u*u,y=Y(ch.y)+(36-Y(ch.y))*u-Math.sin(u*Math.PI)*60;g.drawImage(r.sprites.chick,x-21,y-21,42,42)}
  // lanceur : bulle chargée, compteur, bulle suivante
  g.translate(-sx,-sy);
  g.fillStyle='rgba(0,0,0,.28)';g.beginPath();g.arc(200,shY,30,0,7);g.fill();g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=3;g.beginPath();g.arc(200,shY,30,Math.PI*.15,Math.PI*.85,true);g.stroke();
  if(r.state!=='fly'&&r.state!=='bonus'){const sw=r.swapT>0?1-r.swapT*2:1;drawBall(b,200,shY,Math.max(.4,sw))}
  g.fillStyle='#fff';g.font='800 15px system-ui';g.textAlign='center';g.fillText(G.shots,200,shY+48);
  if(!r.armed&&G.next){g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.arc(126,shY+22,20,0,7);g.fill();drawBall(G.next,126,shY+22,.7);g.fillStyle='rgba(255,255,255,.7)';g.font='700 11px system-ui';g.fillText('⇄',148,shY+40)}
  // aide : glisser pour viser
  if(r.state==='aim'&&r.aim==null&&G.shotsUsed===0&&run.n<=3){g.fillStyle='rgba(255,255,255,.85)';g.font='700 14px system-ui';g.fillText('Glisse vers le haut pour viser, relâche pour tirer',200,shY-60)}}

 function tick(dt){const r=run;r.dt=dt;r.t+=dt;r.shake=Math.max(0,r.shake-dt*2.5);r.swapT=Math.max(0,(r.swapT||0)-dt);
  if(r.bannerT>0){r.bannerT-=dt;if(r.bannerT<=0)r.hud.querySelector('.bb-banner').classList.remove('show')}
  if(r.fly){let move=1500*dt;const f=r.fly;while(move>0&&f.seg<f.pts.length-1){const [x0,y0]=f.pts[f.seg],[x1,y1]=f.pts[f.seg+1],L=Math.hypot(x1-x0,y1-y0)||1e-6,rest=L*(1-f.u);if(move>=rest){move-=rest;f.seg++;f.u=0;if(f.seg<f.pts.length-1&&f.b.t!=='fire')SFX.wall()}else{f.u+=move/L;move=0}}
   const i=Math.min(f.seg,f.pts.length-2),[x0,y0]=f.pts[i],[x1,y1]=f.pts[i+1];f.x=x0+(x1-x0)*f.u;f.y=y0+(y1-y0)*f.u;if(f.seg>=f.pts.length-1){f.x=f.pts.at(-1)[0];f.y=f.pts.at(-1)[1];land()}}
  for(const p of r.parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=380*dt;p.life-=dt}r.parts=r.parts.filter(p=>p.life>0);if(r.parts.length>400)r.parts.splice(0,r.parts.length-400);
  for(const f of r.falls){f.vy+=900*dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.life-=dt;const by=B.view(G,r.lh).sy+r.scroll*0+30;if(f.y>by&&f.vy>0){f.vy*=-.35;f.y=by;if(!f.bounced){f.bounced=1;burst(f.x,f.y,f.cell,3)}}}r.falls=r.falls.filter(f=>f.life>0);
  for(const t of r.texts){t.y-=40*dt;t.life-=dt}r.texts=r.texts.filter(t=>t.life>0);
  for(const ch of r.chicks)ch.t+=dt;r.chicks=r.chicks.filter(ch=>ch.t<.95);
  if(r.state==='bonus'){r.bonusT-=dt;if(r.bonusT<=0){if(G.shots>0){G.shots--;G.score+=B.LEFT_BONUS;const x=60+Math.random()*280,y=B.view(G,r.lh).sy-120-Math.random()*200;burst(x,y,{t:'n',c:Math.floor(Math.random()*6)},14);r.texts.push({x,y,t:'+'+B.LEFT_BONUS,life:.9});SFX.bonus();r.bonusT=.14}
    else if(!r.falls.length&&!r.parts.length){r.state='done';stars()}}}
  if(r.state==='lost'){r.lostT-=dt;if(r.lostT<=0){r.state='done';if(G.lost==='shots'&&P.boost.plus5>0)offerMore();else endLevel(false)}}
  const sc=r.hud.querySelector('.bb-score b');if(sc.textContent!==String(G.score)){sc.textContent=G.score;r.hud.querySelector('.bb-score u').style.width=Math.min(100,G.score/r.s3*100)+'%'}
  draw()}
 function stars(){const n=B.starsFor(G),m=document.createElement('div');m.className='bb-starshow';m.innerHTML=`<div>${[0,1,2].map(i=>`<b class="${i<n?'on':''}" style="animation-delay:${.15+i*.3}s">★</b>`).join('')}</div><p>${G.score} points</p>`;wrap.append(m);for(let i=0;i<n;i++)setTimeout(()=>SFX.star(i),150+i*300);setTimeout(()=>endLevel(true),1500)}

 // accroche pour les tests automatiques
 if(window.__bbTest)window.__bb={get G(){return G},get run(){return run},B,P,shootAt:a=>{if(run&&run.state==='aim'){run.aim=a;fire()}},tick:dt=>{if(run&&G)tick(dt)}};
 showMap();if(level)intro(level);
 return {update(dt){if(run&&G)tick(dt)},
  key(k){if(!run||run.state!=='aim')return;if(k==='ArrowLeft'){run.aim=Math.min(Math.PI-.12,(run.aim??Math.PI/2)+.04)}else if(k==='ArrowRight'){run.aim=Math.max(.12,(run.aim??Math.PI/2)-.04)}else if((k===' '||k==='ArrowUp')&&run.aim!=null)fire();else if(k==='s'||k==='S')swap()}};
}
