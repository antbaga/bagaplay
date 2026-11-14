// Fuis l'URSSAF : course sans fin façon Temple Run, en miniature sur un bureau.
// Intro animée (les agents arrivent, on file), 3 couloirs sur des ramettes de papier, virages au bout des feuilles,
// fournitures de bureau en obstacles, bonus « paradis fiscal », vies = subventions de l'État.
import * as U from './urssaf-engine.js';
import {createGL,M4,project,hex} from './urssaf-gl.js';
import {makeHero,makeAgent,drawRig,makeItems,trackMesh,deskMesh,makeDecor,DECOR_SIZE,DECOR_KINDS} from './urssaf-models.js';

const FOG=hex('#eee1cb'),STORE='bagaplay-urssaf';
const POWER_INFO={magnet:['🌴','Îles Caïmans'],mult:['🪙','Lingot suisse ×2'],shield:['🖥️','Société écran'],jet:['✈️','Jet privé']};
const POWER_MSG={magnet:'Îles Caïmans : les pièces viennent toutes seules',mult:'Lingot suisse : points ×2',shield:'Société écran : le prochain choc ne compte pas',jet:'Jet privé : cap sur Monaco !',cash:'Valise de billets : +25 pièces'};
const CRASH_MSG={stapler:'Coup d’agrafeuse !',gum:'Collé au paquet de chewing-gum…',mug:'Le café, c’est sacré.',pencil:'Bonne mine…',calc:'Erreur de calcul !',sharpener:'Taillé en pièces !',stamp:'Tamponné : REFUSÉ !',postits:'Pense-bête !',clips:'Trombonné !',bridge:'Ça coince…',ruler:'Remis à la règle !'};
const SHOUTS=['Vos justificatifs, s’il vous plaît !','On a juste quelques questions !','Le formulaire Cerfa, vite !','Vous avez oublié une case !','Revenez, c’est pour un rappel !','Une petite régularisation !','On a votre adresse, vous savez !','Le chewing-gum, c’est déductible ?','Pas si vite, on n’a pas fini !'];
const yawOf=d=>Math.atan2(-U.DIRS[d][0],-U.DIRS[d][1]);
const fwdOf=a=>[-Math.sin(a),-Math.cos(a)],rightOfYaw=a=>[Math.cos(a),-Math.sin(a)];
const angLerp=(a,b,k)=>{let d=b-a;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return a+d*k};
const lerp=(a,b,k)=>a+(b-a)*k,lerp3=(a,b,k)=>[lerp(a[0],b[0],k),lerp(a[1],b[1],k),lerp(a[2],b[2],k)];
function loadPrefs(){try{return JSON.parse(localStorage.getItem(STORE)||'{}')||{}}catch{return {}}}
function savePrefs(p){try{localStorage.setItem(STORE,JSON.stringify(p))}catch{}}

export function urssaf(c){
 const prefs=loadPrefs();prefs.runs=(prefs.runs||0);const tuto=prefs.runs<3;
 const wrap=document.createElement('div');wrap.className='ur-wrap';c.board.append(wrap);
 const cv=document.createElement('canvas');cv.className='ur-canvas';cv.setAttribute('aria-label','Fuis l’URSSAF : course en 3D');wrap.append(cv);
 const hud=document.createElement('div');hud.className='ur-hud intro';hud.innerHTML=`
  <div class="ur-tilt top"></div><div class="ur-tilt bottom"></div><div class="ur-flash"></div>
  <div class="ur-top"><div class="ur-dist"><b class="ur-m">0 m</b><span class="ur-pts">0 pts</span></div><div class="ur-right"><div class="ur-coins">● 0</div><div class="ur-lives" aria-label="Subventions"></div></div></div>
  <div class="ur-powers"></div><div class="ur-bubbles"></div><div class="ur-banner" role="status"></div>
  <div class="ur-stamp" hidden></div><div class="ur-tuto" hidden></div>
  <div class="ur-title"><div class="ur-logo"><span>FUIS</span><span>L’URSSAF</span></div><p>Le contrôle, c’est maintenant.</p></div>
  <button class="ur-skip" aria-label="Passer l’intro">Passer ›</button>`;
 wrap.append(hud);const $=s=>hud.querySelector(s);
 const R=createGL(cv);
 if(!R){hud.innerHTML='<div class="ur-nogl">Ton appareil ne permet pas d’afficher ce jeu en 3D (WebGL indisponible).</div>';return {}}
 const hero=makeHero(R),agent=makeAgent(R),IT=makeItems(R),DEC=makeDecor(R),desk=deskMesh(R);
 let G=U.newRun((Math.random()*2**31)|0);
 const S={t:0,intro:0,introOn:true,started:false,camEye:null,camTgt:null,camYaw:0,heroYaw:Math.PI,phase:0,bubbles:[],parts:[],shoutT:3,milestone:500,overT:-1,banner:0,hint:{},stampT:0,fps:60,scale:1,lastShake:0,shake:0};
 const fast=sessionStorage.getItem('ur-intro')==='1';if(fast)S.intro=4.4;try{sessionStorage.setItem('ur-intro','1')}catch{}

 // ---- son : petites synthèses
 const au=()=>{const v=c.volume('sfx');if(!v)return null;const A=c.audio();return A?{A,v}:null};
 function tone(f0,f1,dur,type='sine',g=.06,delay=0){const a=au();if(!a)return;const {A,v}=a,t=A.currentTime+delay,o=A.createOscillator(),gn=A.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+dur);gn.gain.setValueAtTime(g*v,t);gn.gain.exponentialRampToValueAtTime(.0008,t+dur);o.connect(gn);gn.connect(A.destination);o.start(t);o.stop(t+dur+.02)}
 let noiseBuf=null;function noise(dur,g=.08,freq=800,delay=0){const a=au();if(!a)return;const {A,v}=a;if(!noiseBuf){noiseBuf=A.createBuffer(1,A.sampleRate*.5,A.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
  const t=A.currentTime+delay,s=A.createBufferSource(),f=A.createBiquadFilter(),gn=A.createGain();s.buffer=noiseBuf;f.type='lowpass';f.frequency.value=freq;gn.gain.setValueAtTime(g*v,t);gn.gain.exponentialRampToValueAtTime(.0008,t+dur);s.connect(f);f.connect(gn);gn.connect(A.destination);s.start(t);s.stop(t+dur+.02)}
 const SFX={coin:n=>{const f=880*Math.pow(1.06,Math.min(12,n||0));tone(f,f*1.5,.09,'square',.035)},jump:()=>tone(300,640,.15,'triangle',.06),slide:()=>noise(.2,.07,1100),land:()=>noise(.06,.05,500),lane:()=>tone(520,600,.05,'sine',.025),
  turn:()=>{tone(420,720,.1,'triangle',.05);noise(.1,.04,1500)},stumble:()=>{tone(240,140,.22,'sawtooth',.05);noise(.12,.06,600)},crash:()=>{noise(.35,.16,350);tone(200,70,.45,'square',.06)},
  power:()=>[523,659,784,1046].forEach((f,i)=>tone(f,f*1.01,.12,'triangle',.05,i*.07)),life:()=>[659,880,1318].forEach((f,i)=>tone(f,f,.22,'sine',.06,i*.09)),
  shield:()=>{tone(1200,300,.25,'square',.04);noise(.2,.08,2500)},stamp:()=>noise(.09,.08,240),over:()=>[392,330,262,196].forEach((f,i)=>tone(f,f*.98,.3,'triangle',.06,i*.16)),whoosh:()=>noise(.5,.06,700),gasp:()=>tone(500,900,.18,'sine',.05)};

 // ---- interface
 const livesEl=$('.ur-lives');let shownLives=-1;
 function lives(){if(shownLives===G.lives)return;const lost=shownLives>G.lives;shownLives=G.lives;livesEl.innerHTML=Array.from({length:Math.max(G.lives,0)},()=>'<i class="ur-life"><b></b><b></b><b></b></i>').join('');if(lost){livesEl.classList.remove('hit');void livesEl.offsetWidth;livesEl.classList.add('hit')}}
 function banner(text,kind=''){const b=$('.ur-banner');b.textContent=text;b.className='ur-banner show '+kind;void b.offsetWidth;S.banner=2.2}
 function flash(col='rgba(229,72,59,.35)'){const f=$('.ur-flash');f.style.background=col;f.classList.remove('on');void f.offsetWidth;f.classList.add('on')}
 function stamp(text){const s=$('.ur-stamp');s.textContent=text;s.hidden=false;s.classList.remove('slam');void s.offsetWidth;s.classList.add('slam')}
 function bubble(text,who,dur=2.4){S.bubbles=S.bubbles.filter(b=>{if(b.who===who){b.el.remove();return false}return true});const el=document.createElement('div');el.className='ur-bubble '+(who==='hero'?'me':'them');el.textContent=text;$('.ur-bubbles').append(el);S.bubbles.push({el,who,t:dur})}
 function powers(){const box=$('.ur-powers');const act=Object.entries(G.power).filter(([k,v])=>v>0&&POWER_INFO[k]);const key=act.map(([k])=>k).join();if(box.dataset.k!==key){box.dataset.k=key;box.innerHTML=act.map(([k])=>`<div class="ur-pw" data-k="${k}"><span>${POWER_INFO[k][0]}</span><em>${POWER_INFO[k][1]}</em><i><b></b></i></div>`).join('')}
  for(const [k,v] of act){const el=box.querySelector(`[data-k="${k}"] b`);if(el)el.style.width=Math.max(0,Math.min(100,v/U.POWERS[k]*100))+'%'}}
 let lastTxt='';function stats(){const t=`${Math.floor(G.dist)} m|${G.score}|${G.coins}`;if(t===lastTxt)return;lastTxt=t;$('.ur-m').textContent=Math.floor(G.dist)+' m';$('.ur-pts').textContent=G.score+' pts';$('.ur-coins').textContent='● '+G.coins}
 function hint(id,text){if(!tuto||S.hint[id])return;S.hint[id]=1;const h=$('.ur-tuto');h.textContent=text;h.hidden=false;h.classList.remove('show');void h.offsetWidth;h.classList.add('show');S.hintT=2.2}
 lives();stats();

 // ---- entrées : un geste par appui (on relève le doigt pour enchaîner), flèches du clavier
 const queue=[];let start=null,moved=false;
 c.listen(wrap,'pointerdown',e=>{if(e.target.closest('button'))return;start=[e.clientX,e.clientY];moved=false;wrap.setPointerCapture?.(e.pointerId)});
 c.listen(wrap,'pointermove',e=>{if(!start||moved)return;const dx=e.clientX-start[0],dy=e.clientY-start[1];if(Math.max(Math.abs(dx),Math.abs(dy))<36)return;moved=true;
  queue.push(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up')});
 c.listen(wrap,'pointerup',()=>{if(start&&!moved&&S.introOn)skip();start=null;moved=false});c.listen(wrap,'pointercancel',()=>start=null);
 c.listen($('.ur-skip'),'click',skip);
 function skip(){if(S.introOn&&S.intro<5.35){S.intro=5.35}}
 function begin(){S.introOn=false;hud.classList.remove('intro');S.started=true;U.start(G);$('.ur-title').classList.add('gone');$('.ur-skip').hidden=true;SFX.whoosh();
  if(tuto)setTimeout(()=>hint('lane','Glisse ← → pour changer de couloir'),600)}

 // ---- particules
 function burst(x,y,z,col,n=8,pw=3,size=.09){for(let i=0;i<n;i++)S.parts.push({x,y,z,vx:(Math.random()-.5)*pw,vy:Math.random()*pw*.9+.5,vz:(Math.random()-.5)*pw,life:1,col:hex(col),size:size*(.6+Math.random()*.8)})}

 // ---- décor du bureau autour des segments (ne déborde jamais sur la piste suivante, qui part toujours du carrefour)
 function decorFor(seg){if(seg._decor)return seg._decor;let s=seg.id*7919+13;const r=()=>(s=(s*16807)%2147483647)/2147483647;const out=[];
  for(let q=12+r()*8;q<U.junction(seg)-16;q+=9+r()*10){const side=r()<.5?-1:1,k=DECOR_KINDS[Math.floor(r()*DECOR_KINDS.length)],size=DECOR_SIZE[k],off=U.TW/2+2.2+size+r()*5;
   const [x,z]=U.worldOf(seg,q,side*off);out.push({k,x,z,yaw:Math.floor(r()*4)*Math.PI/2+(r()-.5)*.5})}
  if(seg.start<-10){const [x,z]=U.worldOf(seg,-6.5,-.4);out.push({k:'envelope',x,z,yaw:yawOf(seg.d)+.25,onPaper:true})}
  return seg._decor=out}

 // ---- rendu
 const meshes=new Map();
 function segsLive(){const l=[];if(G.prev)l.push(G.prev);for(const s of G.segs){l.push(s);if(s.branches)l.push(s.branches.L,s.branches.R)}return l}
 function segM(seg){return M4.trs(seg.o[0],0,seg.o[1],yawOf(seg.d))}
 function heroPose(){const p=G.p,ph=S.phase;
  if(S.introOn){const run=S.intro>5.6;if(!run)return {legL:0,legR:0,armL:S.intro>2.6&&S.intro<5.3?.0:-.9,armR:-.9,head:S.intro>3.6?.15:.35,bob:0};}
  if(p.state==='down'||p.state==='over'){if(p.why==='fall'||p.why==='hole')return {legL:Math.sin(S.t*20)*.8,legR:-Math.sin(S.t*20)*.8,armUp:1,armL:0,armR:0,bob:0};
   if(p.why==='crash')return {legL:.3,legR:-.2,armL:-1.2,armR:1,roll:Math.sin(S.t*6)*.25,lean:.3,bob:0};return {armUp:1,legL:0,legR:0,bob:0}}
  if(G.power.jet>0)return {legL:-1.4,legR:-1.4,armL:-.4,armR:-.4,bob:0};
  if(p.slide>0)return {legL:1.2,legR:1.2,armL:-2.6,armR:-2.6,lean:-1.25,bob:-.2};
  if(p.y>.01)return {legL:.9,legR:-.5,armL:-2.2,armR:-2.2,bob:0};
  const s=Math.sin(ph);return {legL:s*.95,legR:-s*.95,armL:-s*.85,armR:s*.85,bob:Math.abs(Math.cos(ph))*.06,lean:-.12}}
 function camera(){
  const p=G.p,seg=G.segs[0],hw=U.heroWorld(G),hy=Math.max(-U.REAM,p.y),HW=[hw[0],hy,hw[1]];
  // caméra
  const segYaw=yawOf(seg.d);S.camYaw=angLerp(S.camYaw,segYaw,Math.min(1,S.dt*8));const f=fwdOf(S.camYaw),r=rightOfYaw(S.camYaw);
  let eye,tgt,k=Math.min(1,S.dt*7);
  if(S.introOn){const H0=U.worldOf(G.segs[0],3,0),t=S.intro;
   if(t<2.6){const a=-1.15+t*.28,rr=6.4;eye=[H0[0]-f[0]*Math.cos(a)*rr+r[0]*Math.sin(a)*rr,3.2-t*.15,H0[1]-f[1]*Math.cos(a)*rr+r[1]*Math.sin(a)*rr];tgt=[H0[0],.55,H0[1]];k=S.camEye?Math.min(1,S.dt*2.5):1}
   else if(t<4.4){const m=U.worldOf(G.segs[0],-3.5,0);eye=[H0[0]+f[0]*4.2+r[0]*1.4,2.7,H0[1]+f[1]*4.2+r[1]*1.4];tgt=[m[0],.6,m[1]];k=Math.min(1,S.dt*2.2)}
   else if(t<5.35){const m=U.worldOf(G.segs[0],-4.8,-1.1);eye=[m[0],2.3,m[1]];tgt=[H0[0],.8,H0[1]];k=Math.min(1,S.dt*3)}
   else{eye=[HW[0]-f[0]*4.6,2.9,HW[2]-f[1]*4.6];tgt=[HW[0]+f[0]*3.5,.5,HW[2]+f[1]*3.5];k=Math.min(1,S.dt*3)}}
  else if(p.state==='down'||p.state==='over'){const sy=yawOf(seg.d),ff=fwdOf(sy),rr=rightOfYaw(sy);const fall=p.why==='fall'||p.why==='hole';
   eye=fall?[HW[0]-ff[0]*3+rr[0]*1.5,1.6,HW[2]-ff[1]*3+rr[1]*1.5]:[HW[0]+ff[0]*3.3+rr[0]*1.6,2.1,HW[2]+ff[1]*3.3+rr[1]*1.6];tgt=[HW[0]-ff[0]*.6,fall?hy+.2:.55,HW[2]-ff[1]*.6];k=Math.min(1,S.dt*2.6)}
  else{const jet=G.power.jet>0,lat=p.x*.45,back=jet?6:4.6,up=jet?4.8:2.9;eye=[HW[0]-f[0]*back-r[0]*lat,up+Math.max(0,hy)*.45,HW[2]-f[1]*back-r[1]*lat];tgt=[HW[0]+f[0]*3.6-r[0]*lat*.4,.5+Math.max(0,hy)*.6,HW[2]+f[1]*3.6-r[1]*lat*.4]}
  S.camEye=S.camEye?lerp3(S.camEye,eye,k):eye;S.camTgt=S.camTgt?lerp3(S.camTgt,tgt,k):tgt;
  S.heroYaw=S.introOn&&S.intro<5.45?S.heroYaw:angLerp(S.heroYaw,segYaw,Math.min(1,S.dt*14))}
 function render(){
  const w=Math.max(1,Math.round(wrap.clientWidth*S.dpr)),h=Math.max(1,Math.round(wrap.clientHeight*S.dpr));if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h}
  const p=G.p,seg=G.segs[0],hw=U.heroWorld(G),hy=Math.max(-U.REAM,p.y),HW=[hw[0],hy,hw[1]],segYaw=yawOf(seg.d);
  let E=S.camEye;if(S.shake>0){const a=S.shake*.18;E=[E[0]+(Math.random()-.5)*a,E[1]+(Math.random()-.5)*a,E[2]+(Math.random()-.5)*a]}
  const VP=M4.mul(M4.persp(1.12,w/h,.3,140),M4.look(E,S.camTgt));S.VP=VP;
  R.frame(w,h,VP,E,FOG,[26,72]);
  // bureau (lattes calées sur une grille pour ne pas « glisser »)
  R.draw(desk,M4.t(Math.round(E[0]/4)*4,0,Math.round(E[2]/34)*34));
  // piste, décor, objets
  const live=segsLive(),ids=new Set(live.map(s=>s.id));for(const [id,m] of meshes)if(!ids.has(id)){R.free(m);meshes.delete(id)}
  const cx=HW[0],cz=HW[2],near=(x,z,d=82)=>(x-cx)**2+(z-cz)**2<d*d;
  for(const sg of live){if(!meshes.has(sg.id))meshes.set(sg.id,trackMesh(R,sg));R.draw(meshes.get(sg.id),segM(sg));
   for(const d of decorFor(sg))if(near(d.x,d.z,95)){const m=d.k==='envelope'?IT.envelope:DEC[d.k];R.draw(m,M4.trs(d.x,d.onPaper?0:-U.REAM,d.z,d.yaw))}}
  const shadows=[];
  for(const sg of live){const SM=segM(sg),cur=sg===seg;for(const it of sg.items){if(it.gone||it.k==='gap')continue;if(cur&&(it.s<p.s-6||it.s>p.s+80))continue;
    const [wx,wz]=U.worldOf(sg,it.s,it.x);if(!cur&&!near(wx,wz))continue;
    if(it.k==='coin'){if(it.taken)continue;let x=wx,y=it.y,z=wz;if(it.pull){const q=Math.min(1,it.pull*it.pull);x=lerp(x,HW[0],q);y=lerp(y,hy+.5,q);z=lerp(z,HW[2],q)}R.draw(IT.coin,M4.trs(x,y+Math.sin(S.t*3+it.id)*.04,z,S.t*3.2+it.id));continue}
    if(it.k==='power'||it.k==='life'){if(it.taken)continue;const bob=.4+Math.sin(S.t*2.6+it.id)*.1;R.draw(IT[it.k==='life'?'life':it.pw],M4.trs(wx,bob,wz,S.t*1.8,it.k==='life'?1.2:1.15));shadows.push([wx,wz,.55]);continue}
    if(it.k==='stamp'){const yb=U.stampBottom(it,G.t);R.draw(IT.stampMark,M4.mul(SM,M4.t(it.x,0,-it.s)));R.draw(IT.stampHead,M4.mul(SM,M4.t(it.x,yb,-it.s)));shadows.push([wx,wz,.75*(1-yb/2)]);
     if(cur&&yb===0&&S.lastStamp!==Math.floor((G.t+it.phase)/U.STAMP_PERIOD)&&Math.abs(it.s-p.s)<12){S.lastStamp=Math.floor((G.t+it.phase)/U.STAMP_PERIOD);SFX.stamp()}continue}
    const m=IT[it.k];if(!m)continue;R.draw(m,M4.mul(SM,M4.trs(it.x,0,-it.s,(it.rot===1?Math.PI:0)+(typeof it.rot==='number'&&it.rot!==1?it.rot:0))))}}
  // héros
  const blink=p.inv>0&&p.state!=='down'&&Math.floor(S.t*10)%2===0;
  const root=M4.trs(HW[0],hy+(G.power.jet>0?.25:0),HW[2],S.heroYaw);
  if(G.power.jet>0)R.draw(IT.jet,M4.mul(root,M4.trs(0,-.55,.15,0,2.4)));
  if(!blink)drawRig(R,M4,hero,root,heroPose());
  if(G.power.shield>0)R.draw(IT.cube,M4.mul(root,M4.mul(M4.t(0,.55,0),M4.sc(.95,1.25,.95))),[.4,.75,1,.6],.28);
  if(p.y>-.3)shadows.push([HW[0],HW[2],.62*(1-Math.min(.6,Math.max(0,hy)/3))]);
  // agents de l'URSSAF
  let ag=[];if(S.introOn){const t=S.intro,sA=Math.min(-.2,-14+Math.max(0,t-2.1)*4.2);for(let i=0;i<3;i++){const off=i===0?0:i===1?-.75:.75,[x,z]=U.worldOf(G.segs[0],sA-i*.9-(i?.3:0),off);ag.push({x,z,yaw:yawOf(0),walk:t>2.1&&sA<-.25})}}
  else if(G.chase.d<13||p.state==='down'||p.state==='over'){for(const a of U.agentsWorld(G,3))ag.push({x:a.x,z:a.z,yaw:yawOf(a.d),walk:p.state!=='over'})}
  ag.forEach((a,i)=>{const ph=S.t*(S.introOn?7:11)+i*1.7,s=a.walk?Math.sin(ph):0,pose=a.walk?{legL:s*.9,legR:-s*.9,armL:-s*.6,armR:s*.4,bob:Math.abs(Math.cos(ph))*.05,lean:S.introOn?0:-.12}:{legL:0,legR:0,armL:-.3,armR:.1,bob:0};
   drawRig(R,M4,agent,M4.trs(a.x,0,a.z,a.yaw,1.12),pose);shadows.push([a.x,a.z,.62]);a.head=[a.x,1.55,a.z]});S.agentHeads=ag.map(a=>a.head);
  // ombres douces
  for(const [x,z,s] of shadows)R.draw(IT.shadow,M4.trs(x,.02,z,0,s*1.7),null,.15);
  // particules
  for(const q of S.parts)R.draw(IT.cube,M4.mul(M4.t(q.x,q.y,q.z),M4.sc(q.size,q.size,q.size)),[q.col[0],q.col[1],q.col[2],1]);
  S.heroHead=[HW[0],hy+1.45,HW[2]];S.w=w;S.h=h}

 // ---- bulles (projection 3D → écran)
 function placeBubbles(){const cw=wrap.clientWidth,ch=wrap.clientHeight;
  for(const b of S.bubbles){const at=b.who==='hero'?S.heroHead:(S.agentHeads||[])[0];const pt=at&&S.VP?project(S.VP,cw,ch,at[0],at[1],at[2]):null;
   let x,y;if(!pt||pt[0]<20||pt[0]>cw-20||pt[1]<40||pt[1]>ch){if(b.who==='hero'){b.el.style.opacity=0;continue}x=cw/2;y=ch-56;b.el.classList.add('behind')}else{x=pt[0];y=pt[1];b.el.classList.remove('behind')}
   b.el.style.opacity=Math.min(1,b.t*3);b.el.style.transform=`translate(${Math.round(x)}px,${Math.round(y)}px) translate(-50%,-100%)`}}

 // ---- événements du moteur
 function events(){for(const e of G.events){const hw=U.heroWorld(G);
  switch(e.t){
   case 'coin':SFX.coin(e.n);if(Math.random()<.5)burst(hw[0],G.p.y+.6,hw[1],'#f3c33a',3,2,.06);break;
   case 'jump':SFX.jump();break;case 'slide':SFX.slide();break;case 'land':SFX.land();burst(hw[0],.05,hw[1],'#e9e2d2',4,1.5,.06);break;case 'lane':SFX.lane();break;
   case 'turn':SFX.turn();break;
   case 'stumble':SFX.stumble();S.shake=.5;flash('rgba(255,180,60,.28)');banner('Ouille ! Ils se rapprochent…','warn');bubble(SHOUTS[Math.floor(Math.random()*SHOUTS.length)],'agent',2.2);break;
   case 'power':SFX.power();banner(POWER_MSG[e.pw],'good');burst(hw[0],.8,hw[1],'#ffe48a',14,4,.08);if(e.pw==='jet')bubble('Direction Monaco !','hero',1.6);break;
   case 'life':SFX.life();banner('Subvention de l’État : +1 vie','good');flash('rgba(80,140,255,.25)');burst(hw[0],.8,hw[1],'#3557a6',8,3,.08);burst(hw[0],.8,hw[1],'#e1453c',8,3,.08);break;
   case 'shield':SFX.shield();banner('La société écran a tout pris !','good');burst(hw[0],.6,hw[1],'#5fa8e8',16,5,.1);S.shake=.6;break;
   case 'crashInto':banner(CRASH_MSG[e.k]||'Aïe !','bad');break;
   case 'crash':case 'caught':case 'fall':case 'hole':SFX.crash();S.shake=1;flash();stamp(e.t==='caught'?'CONTRÔLE !':e.t==='fall'||e.t==='hole'?'CHUTE !':'REDRESSEMENT !');
    if(e.t==='caught')banner('Contrôle URSSAF !','bad');if(e.t==='fall')banner('Chute libre sur le bureau !','bad');if(e.t==='hole')banner('Perforé !','bad');
    burst(hw[0],.5,hw[1],'#e5574a',12,4,.1);setTimeout(()=>bubble(G.lives>0?'On vous tient !':'Vous allez devoir nous suivre.','agent',1.6),400);if(G.lives>0)setTimeout(()=>bubble('Minute, j’ai une subvention !','hero',1.4),1100);break;
   case 'respawn':$('.ur-stamp').hidden=true;banner(G.lives>1?`Subvention utilisée : il en reste ${G.lives}`:'Subvention utilisée : c’est la dernière !','warn');SFX.whoosh();break;
   case 'over':SFX.over();S.overT=1.6;break}}
  G.events.length=0}

 function tutoHints(){if(!tuto||!S.started)return;const seg=G.segs[0],p=G.p,v=G.speed;
  if(p.s>U.junction(seg)-10)hint('turn_'+seg.id,seg.turn==='L'?'Fin de la feuille : glisse ← pour tourner':seg.turn==='R'?'Fin de la feuille : glisse → pour tourner':'Fin de la feuille : glisse ← ou → pour tourner');
  for(const it of seg.items){const d=it.s-p.s;if(d<0||d>v*1.3)continue;const K=U.KINDS[it.k];
   if(it.k==='gap'||K?.hole||(K?.solid&&K.across))hint('jump','Glisse ↑ pour sauter');else if(it.k==='bridge')hint('slide','Glisse ↓ pour passer dessous');else if(it.k==='power')hint('power','Attrape les bonus « paradis fiscal » !');else if(it.k==='life')hint('life','Une subvention de l’État = une vie en plus');break}}

 function tick(dt,draw=true){S.dt=dt;S.t+=dt;
   // résolution adaptative : on baisse un peu la définition si l'appareil peine
   S.fps=lerp(S.fps,1/Math.max(dt,.001),.05);if(S.fps<38&&S.scale>.6)S.scale-=.004;else if(S.fps>55&&S.scale<1)S.scale+=.002;S.dpr=Math.min(window.devicePixelRatio||1,2)*S.scale;
   if(S.introOn){S.intro+=dt;const t=S.intro;
    if(t>2.9&&!S.said1){S.said1=1;bubble('Bonjour ! Contrôle URSSAF.','agent',1.9)}
    if(t>4.0&&!S.said2){S.said2=1;bubble('Vous avez cinq minutes ?','agent',1.5)}
    if(t>4.7&&!S.said3){S.said3=1;bubble('Euh… j’ai un truc sur le feu !','hero',1.3);SFX.gasp()}
    if(t>2.4)$('.ur-title').classList.add('gone');
    if(t>5.45&&S.heroYaw!==0){S.heroYaw=angLerp(S.heroYaw,0,Math.min(1,dt*12))}
    if(t>5.6&&!S.ran){S.ran=1;begin()}
    if(S.introOn){camera();if(draw){render();placeBubbles()}bubbleTick(dt);return}}
   const input=queue.splice(0);if(G.p.state==='over')input.length=0;
   U.step(G,dt,input);
   if(G.p.state==='run'||G.p.state==='air'){S.phase+=dt*G.speed*1.35}
   events();lives();stats();powers();tutoHints();
   if(S.banner>0){S.banner-=dt;if(S.banner<=0)$('.ur-banner').classList.remove('show')}
   if(S.hintT>0){S.hintT-=dt;if(S.hintT<=0)$('.ur-tuto').classList.remove('show')}
   if(G.dist>=S.milestone){banner(S.milestone+' m de cavale !','good');S.milestone+=500;SFX.life()}
   if(G.chase.d<4&&(G.p.state==='run'||G.p.state==='air')){S.shoutT-=dt;if(S.shoutT<=0){S.shoutT=2.6+Math.random()*2;bubble(SHOUTS[Math.floor(Math.random()*SHOUTS.length)],'agent',2)}}
   for(const q of S.parts){q.vy-=9*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.z+=q.vz*dt;q.life-=dt*1.6;if(q.y<.03&&q.vy<0){q.y=.03;q.vy*=-.3;q.vx*=.6;q.vz*=.6}}S.parts=S.parts.filter(q=>q.life>0);if(S.parts.length>120)S.parts.splice(0,S.parts.length-120);
   S.shake=Math.max(0,S.shake-dt*2.2);
   camera();if(draw){render();placeBubbles()}bubbleTick(dt);
   if(S.overT>0){S.overT-=dt;if(S.overT<=0){S.overT=-9;prefs.runs++;prefs.best=Math.max(prefs.best||0,Math.floor(G.dist));savePrefs(prefs);if(G.coins)c.collect(Math.min(300,G.coins));
     c.finish(false,G.score,`L’URSSAF a eu le dernier mot.\n${Math.floor(G.dist)} m de cavale · ${G.coins} pièces mises à l’abri.`)}}}
 // accroche pour les tests automatiques (avance le jeu sans attendre l'affichage)
 if(window.__urTest)window.__ur={tick,get G(){return G},S,U,queue,render:()=>{render();placeBubbles()}};
 return {
  update:dt=>{if(!S.hold)tick(dt)},
  key(k){if(S.introOn&&(k===' '||k==='Enter')){skip();return}const m={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',' ':'up'}[k];if(m)queue.push(m)}};
 function bubbleTick(dt){for(const b of S.bubbles)b.t-=dt;S.bubbles=S.bubbles.filter(b=>{if(b.t>0)return true;b.el.remove();return false})}
}
