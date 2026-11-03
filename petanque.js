// Pétanque 3D « papercraft » : vue du lanceur, vue de dessus, en ligne (2 à 6 joueurs), sur un téléphone ou contre l'ordinateur.
import * as P from './petanque-engine.js';
import * as online from './online.js';

export const PETANQUE_RULES='Pétanque : 2 à 6 joueurs, 2 équipes tirées au sort. Glisse pour viser puis relâche ; appuie, maintiens et relâche pour la force. L’équipe qui n’a pas le point joue. Première équipe à 13 points.';
const TEAMS=[{name:'bleue',chip:'#4f86c6',metal:'#b8c3cb',dark:'#7f8d97',band:'#3f74b5'},{name:'corail',chip:'#e0674b',metal:'#cfae86',dark:'#9b7a56',band:'#d65a3e'}];
const W=360,F=600,VS_BALL=2.3,VS_JACK=3.2,POLL=1500;let H=640;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;

export function petanque(c){
 const opts=c.duel||{mode:'local',players:2},isOnline=!!opts.party,vsAI=opts.mode==='ai',aiLevel=opts.level??1;
 let view=isOnline?opts.party:null,state,me;
 if(isOnline){state=view.state;me=view.my_id}
 else if(vsAI){state=P.initial([{id:'me',name:'Toi'},{id:'cpu',name:'Ordinateur'}]);me='me'}
 else{const n=clamp(opts.players||2,2,6);state=P.initial(Array.from({length:n},(_,i)=>({id:'L'+i,name:'Joueur '+(i+1)})))}
 let shownN=state.last?.n||0,lastBy=null,ended=false,busy=false,errorText='';
 let thrower=currentThrower();

 // ---- canvas + interface en surimpression
 // le terrain prend toute la hauteur disponible
 {const bw=c.board.clientWidth||360,bh=c.board.clientHeight||640;H=clamp(Math.round(W*bh/bw),480,860)}
 const cv=document.createElement('canvas');cv.width=W*2;cv.height=H*2;cv.dataset.w=W;cv.dataset.h=H;cv.className='pq-canvas';cv.setAttribute('aria-label','Pétanque : terrain en 3D');
 c.board.append(cv);const g=cv.getContext('2d');
 const hud=document.createElement('div');hud.className='pq-hud';hud.innerHTML=`
  <div class="pq-top"><div class="pq-team t0"><b class="pq-score"></b><span class="pq-names"></span></div><div class="pq-mene"></div><div class="pq-team t1"><span class="pq-names"></span><b class="pq-score"></b></div></div>
  <div class="pq-tools"><button class="pq-icon" data-act="view" aria-label="Vue de dessus">⊞</button><button class="pq-icon" data-act="mode" aria-label="Pointer ou tirer">◎</button></div>
  <div class="pq-banner" hidden></div>
  <div class="pq-bottom"><div class="pq-prompt" role="status"></div><div class="pq-actions"></div></div>`;
 c.board.append(hud);const $h=s=>hud.querySelector(s);
 let topView=false,mode='point';
 $h('[data-act=view]').onclick=()=>{topView=!topView;$h('[data-act=view]').classList.toggle('on',topView);$h('[data-act=view]').setAttribute('aria-label',topView?'Vue du lanceur':'Vue de dessus');refreshHud()};
 $h('[data-act=mode]').onclick=()=>{mode=mode==='point'?'shoot':'point';refreshHud()};
 function placeHud(){const r=cv.getBoundingClientRect(),b=c.board.getBoundingClientRect();Object.assign(hud.style,{left:(r.left-b.left)+'px',top:(r.top-b.top)+'px',width:r.width+'px',height:r.height+'px'})}
 c.listen(window,'resize',()=>setTimeout(placeHud,0));setTimeout(placeHud,0);

 // ---- sons (tous synthétisés)
 const sfx=makeAudio(c);

 // ---- caméra
 const cam={x:0,y:1.6,z:-.6,p:-.21},want={...cam};
 function aimCam(){Object.assign(want,{x:0,y:1.6,z:-.6,p:-.21})}
 function focusCam(t){if(!t){aimCam();return}Object.assign(want,{x:t.x*.6,y:1.15,z:Math.max(-.6,t.z-3.2),p:-.3})}
 function proj(x,y,z){const sp=Math.sin(cam.p),cp=Math.cos(cam.p),rx=x-cam.x,ry=y-cam.y,rz=z-cam.z;const d=ry*sp+rz*cp;if(d<.15)return null;const up=ry*cp-rz*sp;return {x:W/2+F*rx/d,y:H*.45-F*up/d,s:F/d,d}}
 // découpe un polygone au plan proche (en coordonnées monde au sol)
 function polyGround(pts,y=0){const sp=Math.sin(cam.p),cp=Math.cos(cam.p),near=.2;const depth=p=>(y-cam.y)*sp+(p[1]-cam.z)*cp;const out=[];
  for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length],da=depth(a),db=depth(b);if(da>=near)out.push(a);if((da>=near)!==(db>=near)){const t=(near-da)/(db-da);out.push([lerp(a[0],b[0],t),lerp(a[1],b[1],t)])}}
  return out.map(p=>proj(p[0],y,p[1])).filter(Boolean)}

 // décor fixe : graviers, platanes
 const rnd=mulberry(7);const gravel=Array.from({length:900},()=>({x:(rnd()-.5)*3.9,z:rnd()*15,c:['#d7bf93','#c9ae80','#efe0bf','#bca27a'][Math.floor(rnd()*4)]}));
 const trees=[];for(let i=0;i<8;i++){trees.push({x:-4.6-rnd()*2,z:3+i*2.6+rnd(),h:3.6+rnd()*1.2},{x:4.6+rnd()*2,z:3.6+i*2.6+rnd(),h:3.6+rnd()*1.2})}for(let i=0;i<7;i++)trees.push({x:-7+i*2.3+rnd(),z:19+rnd()*2,h:4+rnd()*1.5});

 // ---- dessin
 function draw(objs,extra){g.setTransform(2,0,0,2,0,0);if(topView)drawTop(objs);else drawPersp(objs,extra);}
 function drawPersp(objs,extra){
  const hz=proj(cam.x,0,400)?.y??H*.3;
  const sky=g.createLinearGradient(0,0,0,hz);sky.addColorStop(0,'#b9dfee');sky.addColorStop(1,'#fbf0d6');g.fillStyle=sky;g.fillRect(0,0,W,hz+1);
  g.fillStyle='#fff6dc';g.beginPath();g.arc(286-cam.x*6,hz*.38,20,0,7);g.fill();
  hills(hz,'#c5d8a2',.55,38,1);hills(hz,'#a9c789',.8,22,2.3);
  const gr=g.createLinearGradient(0,hz,0,H);gr.addColorStop(0,'#c9d79a');gr.addColorStop(1,'#b5c784');g.fillStyle=gr;g.fillRect(0,hz,W,H-hz);
  const far=trees.filter(t=>t.z>15.5).map(t=>({t,p:proj(t.x,0,t.z)})).filter(o=>o.p).sort((a,b)=>b.p.d-a.p.d);for(const o of far)tree(o.t,o.p);
  // terrain
  fillPoly(polyGround([[-2,0],[2,0],[2,15],[-2,15]]),'#e6d2a7');
  for(const q of gravel){const p=proj(q.x,0,q.z);if(!p||p.y<hz)continue;const s=Math.max(.5,.016*p.s);g.fillStyle=q.c;g.fillRect(p.x,p.y,s,s*.6)}
  // bordures en bois
  for(const side of [[-2.1,-2],[2,2.1]]){fillPoly(polyGround([[side[0],0],[side[1],0],[side[1],15.1],[side[0],15.1]],.09),'#c49a68');}
  fillPoly(polyGround([[-2.1,15],[2.1,15],[2.1,15.1],[-2.1,15.1]],.09),'#b88d5c');
  for(const x of [-2,2]){const a=polyGround([[x,0],[x,15]],.09),b=polyGround([[x,15],[x,0]],0);if(a.length===2&&b.length===2)fillPoly([...a,...b],'#9c7448')}
  // cercle de lancer
  const ring=[];for(let i=0;i<=28;i++){const a=i/28*Math.PI*2,p=proj(P.CIRCLE.x+Math.cos(a)*.35,0,P.CIRCLE.z+Math.sin(a)*.35);if(p)ring.push(p)}
  if(ring.length>3){g.strokeStyle='#fffaf0';g.lineWidth=2;g.beginPath();ring.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.stroke()}
  const near=trees.filter(t=>t.z<=15.5).map(t=>({t,p:proj(t.x,0,t.z)})).filter(o=>o.p);
  // objets triés du plus loin au plus proche (arbres compris)
  const items=[...near.map(o=>({d:o.p.d,f:()=>tree(o.t,o.p)})),...objs.map(o=>{const p=proj(o.x,0,o.z);return p&&{d:p.d,f:()=>sphere(o,p)}}).filter(Boolean)];
  items.sort((a,b)=>b.d-a.d).forEach(i=>i.f());
  if(extra)extra();
 }
 function hills(hz,color,amp,h,seed){g.fillStyle=color;g.beginPath();g.moveTo(0,hz+1);for(let x=0;x<=W;x+=12){const X=x+cam.x*seed*4;g.lineTo(x,hz-h*(.5+.5*Math.sin(X*.021*seed+seed)*amp+.25*Math.sin(X*.05+seed*3)))}g.lineTo(W,hz+1);g.closePath();g.fill()}
 function fillPoly(pts,color){if(pts.length<3)return;g.fillStyle=color;g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath();g.fill()}
 function tree(t,p){const top=proj(t.x,t.h,t.z);if(!top)return;const w=.28*p.s,cw=1.7*p.s;g.fillStyle='#a88c6a';g.fillRect(p.x-w/2,top.y+cw*.5,w,p.y-top.y-cw*.5);
  for(const [dx,dy,r,col] of [[-.45,.35,.75,'#8fb46e'],[.45,.3,.7,'#7fa862'],[0,0,.85,'#9cc27a'],[0,.6,.6,'#86ad68']]){g.fillStyle=col;g.beginPath();const cx=top.x+dx*cw,cy=top.y+dy*cw,R=r*cw;for(let k=0;k<7;k++){const a=k/7*Math.PI*2+.3;g.lineTo(cx+Math.cos(a)*R,cy+Math.sin(a)*R*.85)}g.closePath();g.fill()}}
 function sphere(o,p){const jack=o.kind==='jack',r=(jack?P.R_JACK*VS_JACK:P.R_BALL*VS_BALL),R=r*p.s;if(R<.6)return;const y=o.y||0;
  // ombre au sol
  const sh=proj(o.x,0,o.z);if(sh){g.fillStyle=`rgba(80,60,30,${y>0?.18:.28})`;g.beginPath();g.ellipse(sh.x+R*.25,sh.y,R*1.05,R*.38,0,0,7);g.fill()}
  const c2=proj(o.x,y+r,o.z);if(!c2)return;const X=c2.x,Y=c2.y,t=jack?null:TEAMS[o.team??0];
  const base=jack?'#ef6a3c':t.metal,dark=jack?'#b9442a':t.dark;
  g.save();g.beginPath();g.arc(X,Y,R,0,7);g.fillStyle=base;g.fill();g.clip();
  // facette sombre en bas à droite (pliage papier)
  g.fillStyle=dark;g.beginPath();g.moveTo(X-R*1.2,Y+R*.35);g.lineTo(X+R*.5,Y-R*1.2);g.lineTo(X+R*1.4,Y+R*1.4);g.lineTo(X-R*1.4,Y+R*1.4);g.closePath();g.globalAlpha=.55;g.fill();g.globalAlpha=1;
  if(!jack&&R>2.2){g.strokeStyle=t.band;g.lineWidth=Math.max(1,R*.16);g.beginPath();g.arc(X,Y+R*1.3,R*1.25,-2.4,-.75);g.stroke();g.beginPath();g.arc(X,Y-R*1.3,R*1.25,.75,2.4);g.stroke()}
  g.fillStyle='rgba(255,255,255,.75)';g.beginPath();g.arc(X-R*.35,Y-R*.38,R*.24,0,7);g.fill();g.restore();
  g.strokeStyle='rgba(60,50,40,.45)';g.lineWidth=Math.max(.6,R*.08);g.beginPath();g.arc(X,Y,R,0,7);g.stroke();
  if(o.mark){g.fillStyle='#fffaf0';g.font=`bold ${Math.max(9,R*1.1)}px ui-rounded,Arial`;g.textAlign='center';g.fillText(o.mark,X,Y-R-4)}}
 // vue de dessus : zoom autour du cochonnet, classement des boules
 function drawTop(objs){g.fillStyle='#c4d495';g.fillRect(0,0,W,H);const jack=objs.find(o=>o.kind==='jack');
  const k=jack?82:36,cz=jack?jack.z:7.5,ox=W/2,oy=H/2;const T=(x,z)=>[ox+x*k,oy-(z-cz)*k];
  const [x0,y0]=T(-2,15),[x1,y1]=T(2,0);g.fillStyle='#b88d5c';g.fillRect(x0-6,y0-6,x1-x0+12,y1-y0+12);g.fillStyle='#e6d2a7';g.fillRect(x0,y0,x1-x0,y1-y0);
  g.save();g.beginPath();g.rect(x0,y0,x1-x0,y1-y0);g.clip();for(const q of gravel){const [x,y]=T(q.x,q.z);g.fillStyle=q.c;g.fillRect(x,y,1.2,1.2)}g.restore();
  const [cx,cy]=T(P.CIRCLE.x,P.CIRCLE.z);g.strokeStyle='#fffaf0';g.lineWidth=2;g.beginPath();g.arc(cx,cy,.35*k,0,7);g.stroke();
  if(jack){g.setLineDash([3,4]);g.strokeStyle='rgba(120,90,50,.35)';for(const r of [.5,1]){g.beginPath();g.arc(...T(jack.x,jack.z),r*k,0,7);g.stroke()}g.setLineDash([])}
  const balls=objs.filter(o=>o.kind==='ball');const ranked=jack?balls.slice().sort((a,b)=>P.dist(a,jack)-P.dist(b,jack)):[];
  for(const o of objs){const [x,y]=T(o.x,o.z),R=(o.kind==='jack'?P.R_JACK*2:P.R_BALL*1.6)*k;g.fillStyle='rgba(80,60,30,.25)';g.beginPath();g.arc(x+1.5,y+1.5,R,0,7);g.fill();
   g.fillStyle=o.kind==='jack'?'#ef6a3c':TEAMS[o.team].metal;g.beginPath();g.arc(x,y,R,0,7);g.fill();if(o.kind!=='jack'){g.strokeStyle=TEAMS[o.team].band;g.lineWidth=2;g.stroke()}
   const i=ranked.indexOf(o);if(i>=0&&i<4){g.fillStyle=TEAMS[o.team].band;g.font='bold 11px ui-rounded,Arial';g.textAlign='center';g.fillText(String(i+1),x,y-R-4)}}
  if(jack&&ranked[0]){g.strokeStyle=TEAMS[ranked[0].team].band;g.lineWidth=1.5;g.beginPath();g.moveTo(...T(jack.x,jack.z));g.lineTo(...T(ranked[0].x,ranked[0].z));g.stroke()}}

 // ---- objets à l'écran
 function sceneObjs(s=state){const out=[];if(s.jack)out.push({kind:'jack',x:s.jack.x,z:s.jack.z});for(const b of s.balls)out.push({kind:'ball',x:b.x,z:b.z,team:b.team});return out}

 // ---- tour de jeu
 function currentThrower(){if(state.phase==='over')return null;if(isOnline)return view.thrower||null;return P.localThrower(state,lastBy)}
 const human=id=>!vsAI||id==='me';
 const canThrow=()=>!ended&&!anim&&!busy&&state.phase!=='over'&&thrower&&(isOnline?thrower===me:human(thrower));
 const pName=id=>P.playerById(state,id)?.name||'?',pTeam=id=>P.playerById(state,id)?.team;

 // ---- visée : glisser = direction, relâcher ; puis appui + maintien + relâcher = force
 let stage='aim',angle=0,aimStart=null,charge=null;
 c.listen(cv,'pointerdown',e=>{sfx?.wake();if(topView||!canThrow())return;cv.setPointerCapture?.(e.pointerId);
  if(stage==='aim')aimStart={x:e.clientX,a:angle};else{charge={t:performance.now()}}});
 c.listen(cv,'pointermove',e=>{if(!aimStart||stage!=='aim')return;const w=cv.getBoundingClientRect().width;angle=clamp(aimStart.a+(e.clientX-aimStart.x)/w*1.1,-.7,.7)});
 c.listen(cv,'pointerup',()=>{if(stage==='aim'&&aimStart){aimStart=null;stage='power';refreshHud();return}if(stage==='power'&&charge){const p=gauge();charge=null;doThrow(p)}});
 c.listen(cv,'pointercancel',()=>{aimStart=null;charge=null});
 const gauge=()=>{if(!charge)return 0;const t=(performance.now()-charge.t)/1300;const u=t%2;return u<1?u:2-u};
 function resetAim(){stage='aim';aimStart=null;charge=null}

 // ---- animation d'un lancer (le mien, celui de l'ordinateur ou d'un autre joueur)
 let anim=null;
 function startAnim(s0,by,tp,res,after){anim={s0,by,tp,res,t:0,ev:0,after};sfx?.whoosh(tp.kind==='jack'?.3:tp.mode==='shoot'?1:.6);focusCam({x:tp.start.x+tp.dir[0]*tp.L,z:tp.start.z+tp.dir[1]*tp.L});refreshHud()}
 function animObjs(){const a=anim,tp=a.tp;if(a.t<tp.T){const u=a.t/tp.T,objs=sceneObjs(a.s0);objs.push({kind:tp.kind,team:pTeam(a.by),x:tp.start.x+tp.dir[0]*tp.L*u,z:tp.start.z+tp.dir[1]*tp.L*u,y:.6*(1-u)+4*tp.H*u*(1-u)});return objs}
  const f=a.res.frames[Math.min(a.res.frames.length-1,Math.floor((a.t-tp.T)*60))];return a.res.objs.map((o,i)=>f[i]&&{kind:o.kind,team:o.team,x:f[i][0],z:f[i][1]}).filter(Boolean)}
 function stepAnim(dt){const a=anim;a.t+=dt;const evs=a.res.events;while(a.ev<evs.length&&evs[a.ev].t<=a.t){const e=evs[a.ev++];if(e.type==='land')sfx?.land(e.kind,e.mode);else if(e.type==='hit')sfx?.hit(e.power,e.jack);else if(e.type==='out')sfx?.out()}
  if(a.t>=a.tp.T){const i=Math.floor((a.t-a.tp.T)*60),fr=a.res.frames,f0=fr[Math.max(0,Math.min(fr.length-1,i-3))],f1=fr[Math.min(fr.length-1,i)];let sp=0;f1.forEach((p,k)=>{if(p&&f0[k])sp=Math.max(sp,Math.hypot(p[0]-f0[k][0],p[1]-f0[k][1])*20)});sfx?.roll(sp)}
  if(a.t>=a.res.duration+.35){anim=null;sfx?.roll(0);a.after()}}

 function doThrow(power){if(!canThrow())return;const by=thrower,kind=state.phase==='jack'?'jack':'ball',tp=P.throwParams(kind,angle,power,kind==='ball'?mode:'point');
  const res=P.simulate(state,tp,by),s0=state,next=P.applyThrow(state,by,tp,res);resetAim();busy=isOnline;lastBy=by;
  startAnim(s0,by,tp,res,()=>{if(isOnline)send(next);else settle(next)})}
 async function send(next){const end=next.phase==='over'?{winner:next.winner}:null;
  try{view=await online.partyThrow(view.id,view.ply,next,end);busy=false;errorText='';settle(view.state)}
  catch(e){busy=false;errorText='Lancer non envoyé : '+e.message;try{view=await online.getParty(view.id)}catch{}settle(view.state)}}
 // applique un nouvel état (après animation)
 function settle(s){state=s;shownN=state.last?.n||shownN;if(state.msg)banner(state.msg);thrower=currentThrower();focusCam(state.jack);if(!state.jack)aimCam();refreshHud();
  if(state.phase==='over')return gameOver();if(!isOnline&&vsAI&&thrower==='cpu')setTimeout(aiPlay,900)}

 // ---- ordinateur
 function aiPlay(){if(ended||anim||thrower!=='cpu'||c.isPaused())return void(thrower==='cpu'&&!ended&&setTimeout(aiPlay,500));const a=P.aiThrow(state,aiLevel);angle=a.angle;
  const tp=P.throwParams(state.phase==='jack'?'jack':'ball',a.angle,a.power,a.mode),res=P.simulate(state,tp,'cpu'),s0=state,next=P.applyThrow(state,'cpu',tp,res);lastBy='cpu';angle=0;startAnim(s0,'cpu',tp,res,()=>settle(next))}

 // ---- en ligne : suivi de la partie
 async function poll(){if(!isOnline||busy||anim||ended)return;let v;try{v=await online.getParty(view.id)}catch(e){errorText='Connexion perdue…';refreshHud();return}
  if(errorText.startsWith('Connexion'))errorText='';const changed=v.ply!==view.ply;view=v;
  if(changed&&v.state?.last&&v.state.last.n>shownN){const L=v.state.last,s0={...v.state,jack:L.before.jack,balls:L.before.balls};
   const res=P.simulate(s0,L.tp,L.by);startAnim(s0,L.by,L.tp,res,()=>settle(v.state));return}
  if(changed)settle(v.state);else{thrower=currentThrower();refreshHud()}}
 if(isOnline)c.every(poll,POLL);
 async function act(fn){busy=true;try{view=await fn();errorText=''}catch(e){errorText=e.message}busy=false;thrower=currentThrower();refreshHud()}

 // ---- interface
 let bannerT=0;function banner(t){const b=$h('.pq-banner');b.textContent=t;b.hidden=false;b.classList.remove('show');void b.offsetWidth;b.classList.add('show');bannerT=3.2}
 function refreshHud(){
  const sc=state.score,teamNames=t=>state.players.filter(p=>p.team===t).map(p=>`<span class="${p.id===thrower?'pq-cur':''}">${esc(p.name)}<i>${'●'.repeat(state.left[p.id]||0)}${'○'.repeat(Math.max(0,p.boules-(state.left[p.id]||0)))}</i></span>`).join('');
  for(const t of [0,1]){const el=$h('.pq-team.t'+t);el.querySelector('.pq-score').textContent=sc[t];el.querySelector('.pq-names').innerHTML=teamNames(t);el.classList.toggle('turn',state.turnTeam===t&&state.phase!=='over');el.classList.toggle('mine',isOnline&&view.my_team===t)}
  $h('.pq-mene').textContent=state.phase==='over'?'Fin':'Mène '+state.mene;
  const modeBtn=$h('[data-act=mode]');modeBtn.hidden=!(canThrow()&&state.phase==='boules');modeBtn.textContent=mode==='point'?'◎':'✸';modeBtn.setAttribute('aria-label',mode==='point'?'Pointer (toucher pour tirer)':'Tirer (toucher pour pointer)');modeBtn.classList.toggle('on',mode==='shoot');
  const acts=$h('.pq-actions');acts.replaceChildren();const btn=(label,aria,fn,cls='')=>{const b=document.createElement('button');b.className='pq-icon '+cls;b.textContent=label;b.setAttribute('aria-label',aria);b.onclick=fn;acts.append(b);return b};
  let text='';const who=thrower?pName(thrower):'';
  if(state.phase==='over')text='Partie terminée';
  else if(anim)text=anim.by===me?'Tu lances…':pName(anim.by)+' lance…';
  else if(canThrow()){const pre=isOnline||vsAI?'À toi':`${who} (${TEAMS[pTeam(thrower)].name})`;
   if(topView)text=pre+' : reviens en vue lanceur pour lancer';
   else if(stage==='aim')text=pre+(state.phase==='jack'?' : vise le cochonnet (6 à 10 m), glisse puis relâche':' : glisse pour viser, puis relâche');
   else{text='Appuie, maintiens, relâche pour la force';btn('↺','Viser à nouveau',()=>{resetAim();refreshHud()})}}
  else if(isOnline){
   if(view.need_vote){text=`${view.ask_name} veut lancer`;btn('✕','Refuser',()=>act(()=>online.partyVote(view.id,false)),'no');btn('✓','Accepter',()=>act(()=>online.partyVote(view.id,true)),'yes')}
   else if(view.ask_by===me){text='Demande envoyée à ton équipe…';btn('✕','Annuler la demande',()=>act(()=>online.partyVote(view.id,false)),'no')}
   else if(view.ask_by)text=`${view.ask_name} demande à lancer`;
   else if(view.can_ask){text='À ton équipe : demande à lancer';btn('✋','Demander à lancer',()=>act(()=>online.partyAsk(view.id)),'yes')}
   else if(view.thrower)text='Au tour de '+view.thrower_name;
   else text=String(state.turnTeam)===String(view.my_team)?'Ton équipe choisit qui lance…':'L’équipe adverse joue…'}
  else if(vsAI&&thrower==='cpu')text='L’ordinateur réfléchit…';
  $h('.pq-prompt').textContent=errorText||text}
 const esc=s=>String(s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[ch]);

 function gameOver(){if(ended)return;ended=true;sfx?.cheer();refreshHud();const w=state.winner,mineT=isOnline?view.my_team:vsAI?pTeam('me'):w,win=mineT===w;
  const names=state.players.filter(p=>p.team===w).map(p=>p.name).join(', '),score=`${state.score[w]} à ${state.score[1-w]}`;
  const text=isOnline||vsAI?(win?`Victoire ${score} !`:`Défaite ${state.score[mineT]} à ${state.score[w]}.`)+`\nÉquipe ${TEAMS[w].name} : ${names}.`:`L’équipe ${TEAMS[w].name} gagne ${score} !\n${names}.`;
  setTimeout(()=>c.finish(win,state.score[mineT]||0,text,{reward:isOnline?(win?400:120):vsAI?(win?250:60):40,once:isOnline?'petanque:'+view.id:null,noRecord:true,title:win?'Victoire !':'Partie terminée'}),900)}

 // ---- boucle
 aimCam();focusCam(state.jack);refreshHud();if(state.phase==='over')setTimeout(gameOver,300);
 if(!isOnline&&vsAI&&thrower==='cpu')setTimeout(aiPlay,1200);
 sfx?.cicadas(true);
 c.every(()=>sfx?.sync(c.isPaused()),300);
 let hudW=0;
 return {
  update(dt){const k=1-Math.exp(-dt*3.2);for(const key of ['x','y','z','p'])cam[key]=lerp(cam[key],want[key],k);
   if(canThrow()&&!anim&&(stage==='aim'||stage==='power')&&cam.z>-.6&&want.z!==-.7)aimCam();
   if(anim)stepAnim(dt);if(bannerT>0){bannerT-=dt;if(bannerT<=0)$h('.pq-banner').hidden=true}
   const objs=anim?animObjs():sceneObjs();
   draw(objs,()=>{if(canThrow()&&!anim){drawAim();if(stage==='power')drawGauge()}});
   const r=cv.getBoundingClientRect().width;if(r!==hudW){hudW=r;placeHud()}},
  destroy(){sfx?.stop();if(isOnline&&(ended||state.phase==='over'))online.hideParty(view.id).catch(()=>{})}
 };
 function drawAim(){const dx=Math.sin(angle),dz=Math.cos(angle);g.strokeStyle='rgba(255,250,235,.9)';g.lineWidth=3;g.setLineDash([7,6]);g.beginPath();let first=true;
  for(let d=.5;d<=4.5;d+=.25){const p=proj(P.CIRCLE.x+dx*d,0,P.CIRCLE.z+dz*d);if(!p)continue;if(first){g.moveTo(p.x,p.y);first=false}else g.lineTo(p.x,p.y)}g.stroke();g.setLineDash([]);
  const tip=proj(P.CIRCLE.x+dx*4.6,0,P.CIRCLE.z+dz*4.6);if(tip){g.fillStyle='#fffaf0';g.beginPath();g.arc(tip.x,tip.y,4,0,7);g.fill()}}
 function drawGauge(){const v=gauge(),x=W-34,y0=150,h=300;g.fillStyle='rgba(255,250,240,.85)';round(x-3,y0-3,24,h+6,12);g.fill();
  const gr=g.createLinearGradient(0,y0+h,0,y0);gr.addColorStop(0,'#86c06c');gr.addColorStop(.6,'#f3c34e');gr.addColorStop(1,'#e2603f');g.fillStyle=gr;round(x,y0+h*(1-v),18,h*v,9);g.fill();
  g.fillStyle='#5b6b50';g.font='bold 10px ui-rounded,Arial';g.textAlign='center';g.fillText('FORCE',x+9,y0+h+18)}
 function round(x,y,w,h,r){g.beginPath();g.roundRect?g.roundRect(x,y,w,Math.max(0,h),Math.min(r,h/2)):g.rect(x,y,w,h)}
}

function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

// ---- sons synthétisés : lancer, atterrissage dans le gravier, roulement, choc de boules, cigales
function makeAudio(c){let A;try{A=c.audio()}catch{}if(!A)return null;
 const sfxOut=A.createGain(),musOut=A.createGain();sfxOut.connect(A.destination);musOut.connect(A.destination);musOut.gain.value=0;
 const buf=A.createBuffer(1,A.sampleRate*2,A.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
 const vol=()=>c.volume('sfx')*2;sfxOut.gain.value=vol();
 const nodes=[];
 function noise({type='bandpass',freq=1000,q=1,dur=.2,gain=.2,to,delay=0,attack=.005}){const t=A.currentTime+delay,s=A.createBufferSource(),f=A.createBiquadFilter(),gn=A.createGain();
  s.buffer=buf;f.type=type;f.frequency.setValueAtTime(freq,t);if(to)f.frequency.exponentialRampToValueAtTime(to,t+dur);f.Q.value=q;gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(gain,t+attack);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);
  s.connect(f);f.connect(gn);gn.connect(sfxOut);s.start(t,Math.random());s.stop(t+dur+.05)}
 function tone(freq,dur,gain,type='sine',delay=0,to){const t=A.currentTime+delay,o=A.createOscillator(),gn=A.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(to)o.frequency.exponentialRampToValueAtTime(to,t+dur);
  gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(gain,t+.004);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(gn);gn.connect(sfxOut);o.start(t);o.stop(t+dur+.05)}
 // roulement continu (gain piloté par la vitesse)
 const rs=A.createBufferSource(),rf=A.createBiquadFilter(),rg=A.createGain();rs.buffer=buf;rs.loop=true;rf.type='bandpass';rf.frequency.value=1700;rf.Q.value=.7;rg.gain.value=0;rs.connect(rf);rf.connect(rg);rg.connect(sfxOut);rs.start();nodes.push(rs);
 // cigales : bruit filtré aigu, modulé très vite, avec des vagues lentes
 const cs=A.createBufferSource(),cf=A.createBiquadFilter(),am=A.createGain(),swell=A.createGain(),lfo=A.createOscillator(),lfoG=A.createGain();
 cs.buffer=buf;cs.loop=true;cf.type='bandpass';cf.frequency.value=5200;cf.Q.value=5;am.gain.value=.5;lfo.type='square';lfo.frequency.value=42;lfoG.gain.value=.5;lfo.connect(lfoG);lfoG.connect(am.gain);
 swell.gain.value=.5;cs.connect(cf);cf.connect(am);am.connect(swell);swell.connect(musOut);cs.start();lfo.start();nodes.push(cs,lfo);
 const cf2=A.createBiquadFilter(),am2=A.createGain(),lfo2=A.createOscillator(),lfoG2=A.createGain();cf2.type='bandpass';cf2.frequency.value=6400;cf2.Q.value=7;am2.gain.value=.5;lfo2.type='square';lfo2.frequency.value=57;lfoG2.gain.value=.5;lfo2.connect(lfoG2);lfoG2.connect(am2.gain);cs.connect(cf2);cf2.connect(am2);am2.connect(swell);lfo2.start();nodes.push(lfo2);
 let cicOn=false,swellTimer=setInterval(()=>{const t=A.currentTime;swell.gain.setTargetAtTime(.25+Math.random()*.75,t,1.2);lfo.frequency.setTargetAtTime(38+Math.random()*8,t,.8)},2600);
 return {
  wake(){if(A.state==='suspended')A.resume()},
  whoosh(p){noise({freq:420,to:1500+900*p,q:.9,dur:.38,gain:.07+.08*p,attack:.08})},
  land(kind,mode){if(kind==='jack'){noise({type:'highpass',freq:2600,dur:.09,gain:.08});tone(320,.08,.06,'triangle');return}
   tone(95,.18,.28,'sine',0,55);noise({type:'lowpass',freq:500,dur:.16,gain:.22});noise({type:'highpass',freq:2800,dur:mode==='shoot'?.22:.14,gain:.12})},
  hit(power,jack){const k=Math.min(1,power/3+.25);if(jack){tone(1650,.07,.12*k,'triangle');tone(2480,.05,.06*k,'triangle');return}
   tone(2330,.16,.16*k);tone(3490,.12,.09*k);tone(5200,.07,.05*k);noise({type:'highpass',freq:4000,dur:.03,gain:.15*k})},
  out(){tone(130,.12,.12,'sine',0,80);noise({type:'lowpass',freq:300,dur:.12,gain:.1})},
  roll(sp){rg.gain.setTargetAtTime(Math.min(.09,sp*.035),A.currentTime,.05)},
  cheer(){[523,659,784,1047].forEach((f,i)=>tone(f,.35,.1,'triangle',i*.11))},
  cicadas(on){cicOn=on;this.sync(false)},
  sync(paused){sfxOut.gain.setTargetAtTime(paused?0:vol(),A.currentTime,.05);musOut.gain.setTargetAtTime(cicOn&&!paused?c.volume('music')*.06:0,A.currentTime,.4)},
  stop(){clearInterval(swellTimer);try{musOut.gain.setTargetAtTime(0,A.currentTime,.05);rg.gain.value=0}catch{}setTimeout(()=>{for(const n of nodes){try{n.stop()}catch{}}sfxOut.disconnect();musOut.disconnect()},200)}
 }}
