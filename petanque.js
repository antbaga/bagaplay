// Pétanque en vraie 3D « papercraft » : polygones plats éclairés, caméra libre autour du cochonnet.
// En ligne (2 à 6 joueurs), sur un téléphone ou contre l'ordinateur.
import * as P from './petanque-engine.js';
import * as online from './online.js';

export const PETANQUE_RULES='Pétanque : 2 à 6 joueurs, 2 équipes tirées au sort. Glisse sur le terrain pour tourner la vue (deux doigts pour zoomer). Pour lancer : fais glisser la boule vers le haut d’un geste et relâche ; la direction du geste donne la direction, sa vitesse la force. Choisis avant la hauteur du lancer. L’équipe qui n’a pas le point joue. Première équipe à 13 points.';
const TEAMS=[{name:'bleue',metal:'#aebfd2'},{name:'corail',metal:'#d4ae92'}];
const W=360,F=680,NEAR=.08,POLL=1500,RETURN_MS=3000,VS=1; // dessin à la taille physique (voir R_BALL)
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
const LIGHT=(()=>{const v=[-.45,.82,-.36],l=Math.hypot(...v);return v.map(x=>x/l)})();

// ---- couleurs « papier » : ombrage plat selon l'orientation de la face
function hex(c){const n=parseInt(c.slice(1),16);return [n>>16&255,n>>8&255,n&255]}
function shade(c,n,amb=.6){const [r,g,b]=hex(c),k=amb+(1-amb)*Math.max(0,n[0]*LIGHT[0]+n[1]*LIGHT[1]+n[2]*LIGHT[2]);return `rgb(${r*k|0},${g*k|0},${b*k|0})`}
function normal(p){const a=p[0],b=p[1],c=p[2],u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],v=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],l=Math.hypot(...n)||1;return n.map(x=>x/l)}
function face(pts,color,amb){const n=normal(pts);return {pts,n,c:[pts.reduce((s,p)=>s+p[0],0)/pts.length,pts.reduce((s,p)=>s+p[1],0)/pts.length,pts.reduce((s,p)=>s+p[2],0)/pts.length],fill:shade(color,n,amb)}}
// face tournée vers l'extérieur d'un volume de centre o
function faceOut(pts,color,o,amb){let f=face(pts,color,amb);if((f.c[0]-o[0])*f.n[0]+(f.c[1]-o[1])*f.n[1]+(f.c[2]-o[2])*f.n[2]<0)f=face(pts.slice().reverse(),color,amb);return f}
// boîte (x0..x1, y0..y1, z0..z1) ; faces orientées vers l'extérieur
function box(x0,y0,z0,x1,y1,z1,color,amb){const v=(x,y,z)=>[x,y,z];return [
 face([v(x0,y1,z0),v(x0,y1,z1),v(x1,y1,z1),v(x1,y1,z0)],color,amb),face([v(x0,y0,z0),v(x1,y0,z0),v(x1,y0,z1),v(x0,y0,z1)],color,amb),
 face([v(x0,y0,z0),v(x0,y1,z0),v(x1,y1,z0),v(x1,y0,z0)],color,amb),face([v(x1,y0,z1),v(x1,y1,z1),v(x0,y1,z1),v(x0,y0,z1)],color,amb),
 face([v(x0,y0,z1),v(x0,y1,z1),v(x0,y1,z0),v(x0,y0,z0)],color,amb),face([v(x1,y0,z0),v(x1,y1,z0),v(x1,y1,z1),v(x1,y0,z1)],color,amb)]}
// icosaèdre (subdiv 0) et icosphère (subdiv 1), rayon 1
function ico(sub){const t=(1+Math.sqrt(5))/2;let V=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]].map(v=>{const l=Math.hypot(...v);return v.map(x=>x/l)});
 let Fc=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
 for(let s=0;s<sub;s++){const mid={},m=(a,b)=>{const k=a<b?a+'_'+b:b+'_'+a;if(mid[k]!=null)return mid[k];const p=V[a].map((x,i)=>(x+V[b][i])/2),l=Math.hypot(...p);V.push(p.map(x=>x/l));return mid[k]=V.length-1};
  const nf=[];for(const [a,b,c] of Fc){const ab=m(a,b),bc=m(b,c),ca=m(c,a);nf.push([a,ab,ca],[b,bc,ab],[c,ca,bc],[ab,bc,ca])}Fc=nf}
 return Fc.map(f=>{let pts=f.map(i=>V[i]);let n=normal(pts);const c=pts.reduce((a,p)=>a.map((x,i)=>x+p[i]),[0,0,0]);if(n[0]*c[0]+n[1]*c[1]+n[2]*c[2]<0){pts=pts.slice().reverse();n=normal(pts)}return {v:pts,n}})}
const SPHERE_LO=ico(0);
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

// ---- décor (construit une fois)
function buildScene(){const rnd=mulberry(11),solids=[],far=[],tiles=[];
 const greens=['#c4d596','#bccf8c','#cbdba2','#b6ca86'];
 for(let i=-6;i<6;i++)for(let j=-5;j<7;j++){const x=i*10,z=j*10,c=greens[Math.floor(rnd()*4)];tiles.push({pts:[[x,0,z],[x+10,0,z],[x+10,0,z+10],[x,0,z+10]],fill:shade(c,[0,1,0],.75)})}
 // collines au loin
 const hc=['#a9c58a','#9dbd84','#b4cd95','#93b37f'];for(let k=0;k<28;k++){const a0=k/28*Math.PI*2,a1=(k+1)/28*Math.PI*2,am=(a0+a1)/2,R=88,h=7+rnd()*12;
  const p0=[Math.sin(a0)*R,0,7.5+Math.cos(a0)*R],p1=[Math.sin(a1)*R,0,7.5+Math.cos(a1)*R],pk=[Math.sin(am)*(R+6),h,7.5+Math.cos(am)*(R+6)];far.push(face([p0,pk,p1],hc[k%4],.7),face([p1,pk,p0],hc[(k+1)%4],.7))}
 // bordures en bois du terrain
 solids.push(...box(-2.12,0,-.1,-2,.1,15.12,'#c49a68'),...box(2,0,-.1,2.12,.1,15.12,'#c49a68'),...box(-2.12,0,15,2.12,.1,15.12,'#b88d5c'));
 // platanes : tronc + feuillage en icosaèdre
 const tree=(x,z,h)=>{const t=.16,n0=solids.length;solids.push(...box(x-t,0,z-t,x+t,h*.62,z+t,'#a98a66'));const R=h*.32,cols=['#8fb46e','#7fa862','#9cc27a'];
  for(const [dx,dy,dz,r] of [[0,h*.78,0,R],[R*.55,h*.66,R*.2,R*.7],[-R*.5,h*.68,-R*.25,R*.72]]){const col=cols[Math.floor(rnd()*3)];for(const f of SPHERE_LO)solids.push(face(f.v.map(v=>[x+dx+v[0]*r,dy+v[1]*r*.9,z+dz+v[2]*r]),col,.55))}for(let i=n0;i<solids.length;i++)solids[i].tree=[x,z]};
 for(let i=0;i<8;i++){tree(-4.8-rnd()*2.4,2+i*2.7+rnd(),3.6+rnd()*1.3);tree(4.8+rnd()*2.4,2.6+i*2.7+rnd(),3.6+rnd()*1.3)}
 for(let i=0;i<7;i++)tree(-8+i*2.6+rnd(),19.5+rnd()*2.5,4+rnd()*1.5);
 // petites maisons du village
 const house=(x,z,w,d,h,wall,roof)=>{solids.push(...box(x,0,z,x+w,h,z+d,wall));const r0=[x-.2,h,z-.2],r1=[x+w+.2,h,z-.2],r2=[x+w+.2,h,z+d+.2],r3=[x-.2,h,z+d+.2],t0=[x-.2,h+w*.45,z+d/2],t1=[x+w+.2,h+w*.45,z+d/2];
  const o=[x+w/2,h,z+d/2];solids.push(faceOut([r0,t0,t1,r1],roof,o),faceOut([r2,t1,t0,r3],roof,o),faceOut([r1,t1,r2],wall,o),faceOut([r3,t0,r0],wall,o))};
 house(-15,26,5,4,3.2,'#f3e3c3','#d98c5f');house(8,28,4,5,3,'#f6ead2','#c97b56');house(-4,33,6,4,3.6,'#efe0c0','#d6905f');
 // banc
 solids.push(...box(3,0,5,3.3,.42,7,'#b88d5c'),...box(3.25,.42,5,3.35,.85,7,'#a77d50'));
 const gravel=Array.from({length:800},()=>({x:(rnd()-.5)*3.9,z:rnd()*15,c:['#d4bb8f','#c6aa7c','#efe0bf','#b99f77'][Math.floor(rnd()*4)]}));
 return {solids,far,tiles,gravel}}

export function petanque(c){
 const opts=c.duel||{mode:'local',players:2},isOnline=!!opts.party,vsAI=opts.mode==='ai',aiLevel=opts.level??1;
 let view=isOnline?opts.party:null,state,me;
 if(isOnline){state=view.state;me=view.my_id}
 else if(vsAI){state=P.initial([{id:'me',name:'Toi'},{id:'cpu',name:'Ordinateur'}]);me='me'}
 else{const n=clamp(opts.players||2,2,6);state=P.initial(Array.from({length:n},(_,i)=>({id:'L'+i,name:'Joueur '+(i+1)})))}
 let shownN=state.last?.n||0,lastBy=null,ended=false,busy=false,errorText='';
 let thrower=currentThrower();

 // ---- canvas et interface posée dessus
 let H;{const bw=c.board.clientWidth||360,bh=c.board.clientHeight||640;H=clamp(Math.round(W*bh/bw),480,860)}
 const cv=document.createElement('canvas');cv.width=W*2;cv.height=H*2;cv.dataset.w=W;cv.dataset.h=H;cv.className='pq-canvas';cv.setAttribute('aria-label','Pétanque : terrain en 3D');
 c.board.append(cv);const g=cv.getContext('2d');
 const hud=document.createElement('div');hud.className='pq-hud';hud.innerHTML=`
  <div class="pq-top"><div class="pq-team t0"><b class="pq-score"></b><span class="pq-names"></span></div><div class="pq-mene"></div><div class="pq-team t1"><span class="pq-names"></span><b class="pq-score"></b></div></div>
  <div class="pq-tools"><button class="pq-icon" data-act="view" aria-label="Vue de dessus">⊞</button><button class="pq-icon" data-act="home" aria-label="Vue du lanceur">◉</button></div>
  <div class="pq-banner" hidden></div>
  <div class="pq-bottom"><div class="pq-prompt" role="status"></div><div class="pq-actions"></div></div>
  <div class="pq-throw" hidden><div class="pq-lofts" role="group" aria-label="Hauteur du lancer"><button data-loft="0.1" aria-label="Lancer bas (roulette)">⌒</button><button data-loft="0.55" aria-label="Lancer moyen (demi-portée)">◠</button><button data-loft="0.95" aria-label="Lancer haut (plombée)">∩</button></div><div class="pq-hand" aria-label="Boule à lancer : fais glisser vers le haut et relâche"><b></b></div></div>`;
 c.board.append(hud);const $h=s=>hud.querySelector(s);
 function placeHud(){const r=cv.getBoundingClientRect(),b=c.board.getBoundingClientRect();Object.assign(hud.style,{left:(r.left-b.left)+'px',top:(r.top-b.top)+'px',width:r.width+'px',height:r.height+'px'})}
 c.listen(window,'resize',()=>setTimeout(placeHud,0));setTimeout(placeHud,0);
 const scene=buildScene(),sfx=makeAudio(c);

 // ---- caméra : orbite autour du cochonnet (centre), retour à la vue du lanceur 3 s après le dernier geste
 const cam={x:0,y:0,z:0,fx:0,fy:0,fz:1,rx:1,ry:0,rz:0,ux:0,uy:1,uz:0};
 const center=()=>state.jack?{x:state.jack.x,z:state.jack.z}:{x:0,z:8.5};
 function homeOrbit(){const C=center(),vx=P.CIRCLE.x-C.x,vy=1.6,vz=P.CIRCLE.z-1.15-C.z,d=Math.hypot(vx,vy,vz);return {cx:C.x,cz:C.z,yaw:Math.atan2(vx,-vz),pitch:Math.asin(vy/d),dist:d}}
 function topOrbit(){const C=center();return {cx:C.x,cz:state.jack?C.z:7.5,yaw:0,pitch:1.5,dist:state.jack?6.5:17}}
 let orb=homeOrbit(),lastTouch=0,topLock=false,pointers=new Map(),pinch0=null;
 function setCam(o){const cp=Math.cos(o.pitch),sp=Math.sin(o.pitch),sy=Math.sin(o.yaw),cy=Math.cos(o.yaw);
  cam.x=o.cx+o.dist*sy*cp;cam.y=o.dist*sp;cam.z=o.cz-o.dist*cy*cp;cam.fx=-sy*cp;cam.fy=-sp;cam.fz=cy*cp;cam.rx=cy;cam.ry=0;cam.rz=sy;
  cam.ux=cam.fy*cam.rz-cam.fz*cam.ry;cam.uy=cam.fz*cam.rx-cam.fx*cam.rz;cam.uz=cam.fx*cam.ry-cam.fy*cam.rx}
 const toView=(x,y,z)=>{const dx=x-cam.x,dy=y-cam.y,dz=z-cam.z;return [dx*cam.rx+dy*cam.ry+dz*cam.rz,dx*cam.ux+dy*cam.uy+dz*cam.uz,dx*cam.fx+dy*cam.fy+dz*cam.fz]};
 const scr=v=>[W/2+F*v[0]/v[2],H/2-F*v[1]/v[2]];
 const proj=(x,y,z)=>{const v=toView(x,y,z);return v[2]<NEAR?null:[...scr(v),v[2]]};
 function clipPoly(pts){const vs=pts.map(p=>toView(p[0],p[1],p[2]));if(vs.every(v=>v[2]>=NEAR))return vs.map(scr);const out=[];
  for(let i=0;i<vs.length;i++){const a=vs[i],b=vs[(i+1)%vs.length],ia=a[2]>=NEAR,ib=b[2]>=NEAR;if(ia)out.push(a);if(ia!==ib){const t=(NEAR-a[2])/(b[2]-a[2]);out.push([lerp(a[0],b[0],t),lerp(a[1],b[1],t),NEAR])}}
  return out.length>2?out.map(scr):null}
 function fillPts(s,fill,stroke){g.beginPath();s.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=.5;g.stroke()}}

 // gestes sur le terrain : un doigt = tourner, deux doigts (ou molette) = zoomer
 c.listen(cv,'pointerdown',e=>{sfx?.wake();cv.setPointerCapture?.(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);lastTouch=performance.now();
  if(pointers.size===2){const [a,b]=[...pointers.values()];pinch0={d:Math.hypot(a[0]-b[0],a[1]-b[1]),dist:orb.dist}}});
 c.listen(cv,'pointermove',e=>{const p=pointers.get(e.pointerId);if(!p)return;lastTouch=performance.now();
  if(pointers.size>=2&&pinch0){pointers.set(e.pointerId,[e.clientX,e.clientY]);const [a,b]=[...pointers.values()];orb.dist=clamp(pinch0.dist*pinch0.d/Math.max(20,Math.hypot(a[0]-b[0],a[1]-b[1])),1.2,24);return}
  const k=W/cv.getBoundingClientRect().width;orb.yaw-=(e.clientX-p[0])*k*.011;orb.pitch=clamp(orb.pitch+(e.clientY-p[1])*k*.008,.06,1.52);pointers.set(e.pointerId,[e.clientX,e.clientY])});
 const up=e=>{pointers.delete(e.pointerId);if(pointers.size<2)pinch0=null;lastTouch=performance.now()};
 c.listen(cv,'pointerup',up);c.listen(cv,'pointercancel',up);
 c.listen(cv,'wheel',e=>{e.preventDefault();orb.dist=clamp(orb.dist*(e.deltaY>0?1.12:.89),1.2,24);lastTouch=performance.now()},{passive:false});
 $h('[data-act=view]').onclick=()=>{topLock=!topLock;lastTouch=performance.now();refreshHud()};
 $h('[data-act=home]').onclick=()=>{topLock=false;lastTouch=0;refreshHud()};

 // ---- tour de jeu
 function currentThrower(){if(state.phase==='over')return null;if(isOnline)return view.thrower||null;return P.localThrower(state,lastBy)}
 const human=id=>!vsAI||id==='me';
 const canThrow=()=>!ended&&!anim&&!busy&&state.phase!=='over'&&thrower&&(isOnline?thrower===me:human(thrower));
 const pName=id=>P.playerById(state,id)?.name||'?',pTeam=id=>P.playerById(state,id)?.team;

 // ---- tir au geste : on « lance » la boule du doigt. Direction du geste = direction du tir, vitesse du doigt = force.
 // La hauteur du lancer (bas / moyen / haut) se choisit avant avec les petits boutons.
 const throwBox=$h('.pq-throw'),hand=$h('.pq-hand');
 let angle=0,loft=.55,flick=null,lastPower=0,powerFlash=0;
 const baseAngle=()=>state.jack?Math.atan2(state.jack.x-P.CIRCLE.x,state.jack.z-P.CIRCLE.z):0;
 for(const b of throwBox.querySelectorAll('[data-loft]'))b.onclick=e=>{e.stopPropagation();loft=+b.dataset.loft;refreshHud()};
 hand.addEventListener('pointerdown',e=>{if(!canThrow()||c.isPaused())return;e.stopPropagation();e.preventDefault();sfx?.wake();hand.setPointerCapture?.(e.pointerId);topLock=false;lastTouch=0;
  flick={x0:e.clientX,y0:e.clientY,pts:[[e.clientX,e.clientY,e.timeStamp]],aim:false};angle=baseAngle();hand.classList.add('held')});
 hand.addEventListener('pointermove',e=>{if(!flick)return;flick.pts.push([e.clientX,e.clientY,e.timeStamp]);if(flick.pts.length>40)flick.pts.shift();
  const dx=e.clientX-flick.x0,dy=e.clientY-flick.y0;hand.firstChild.style.transform=`translate(${dx}px,${dy}px)`;
  // la direction suit le doigt pendant tout le geste (du point de départ au doigt)
  flick.aim=-dy>8;angle=clamp(baseAngle()+(flick.aim?Math.atan2(dx,-dy):0)*.5,-.75,.75)});
 hand.addEventListener('pointerup',e=>{if(!flick)return;flick.pts.push([e.clientX,e.clientY,e.timeStamp]);const flick0=flick,pts=flick.pts,end=pts[pts.length-1];flick=null;hand.classList.remove('held');hand.firstChild.style.transform='';
  // vitesse sur les ~90 dernières ms, en unités du terrain (360 de large)
  let i=pts.length-1;while(i>0&&end[2]-pts[i-1][2]<90)i--;const st=pts[Math.max(0,i-1)],dt=Math.max(16,end[2]-st[2]),k=W/cv.getBoundingClientRect().width;
  const vx=(end[0]-st[0])*k/dt*1000,vy=(end[1]-st[1])*k/dt*1000,up=-vy;
  if(up<150||end[1]>=flick0.y0-12){banner('Lance la boule vers le haut, d’un geste vif');return}
  const L=Math.atan2(end[0]-flick0.x0,flick0.y0-end[1]),speed=vx*Math.sin(L)+up*Math.cos(L);/* direction : du début à la fin du geste ; force : vitesse du doigt au lâcher */
  angle=clamp(baseAngle()+L*.5,-.75,.75);const power=clamp((speed-150)/2600,0,1);/* ~1600 px/s : cochonnet à 8 m ; ~2750 px/s : force maximale */lastPower=power;powerFlash=1.2;doThrow(power)});
 hand.addEventListener('pointercancel',()=>{flick=null;hand.classList.remove('held');hand.firstChild.style.transform=''});

 // ---- animation d'un lancer
 let anim=null;
 function startAnim(s0,by,tp,res,after){anim={s0,by,tp,res,t:0,ev:0,after};sfx?.whoosh(tp.kind==='jack'?.3:tp.loft<.25?1:.6);refreshHud()}
 function animObjs(){const a=anim,tp=a.tp;if(a.t<tp.T){const u=a.t/tp.T,objs=sceneObjs(a.s0);objs.push({kind:tp.kind,team:pTeam(a.by),x:tp.start.x+tp.dir[0]*tp.L*u,z:tp.start.z+tp.dir[1]*tp.L*u,y:.6*(1-u)+4*tp.H*u*(1-u)});return objs}
  const f=a.res.frames[Math.min(a.res.frames.length-1,Math.floor((a.t-tp.T)*60))];return a.res.objs.map((o,i)=>f[i]&&{kind:o.kind,team:o.team,x:f[i][0],z:f[i][1]}).filter(Boolean)}
 function stepAnim(dt){const a=anim;a.t+=dt;const evs=a.res.events;while(a.ev<evs.length&&evs[a.ev].t<=a.t){const e=evs[a.ev++];if(e.type==='land')sfx?.land(e.kind,e.mode);else if(e.type==='hit')sfx?.hit(e.power,e.jack);else if(e.type==='out')sfx?.out()}
  if(a.t>=a.tp.T){const i=Math.floor((a.t-a.tp.T)*60),fr=a.res.frames,f0=fr[Math.max(0,Math.min(fr.length-1,i-3))],f1=fr[Math.min(fr.length-1,i)];let sp=0;f1.forEach((p,k)=>{if(p&&f0[k])sp=Math.max(sp,Math.hypot(p[0]-f0[k][0],p[1]-f0[k][1])*20)});sfx?.roll(sp)}
  if(a.t>=a.res.duration+.35){anim=null;sfx?.roll(0);a.after()}}
 function doThrow(power){if(!canThrow())return;const by=thrower,kind=state.phase==='jack'?'jack':'ball',tp=P.throwParams(kind,angle,power,kind==='jack'?.55:loft);
  const res=P.simulate(state,tp,by),s0=state,next=P.applyThrow(state,by,tp,res);busy=isOnline;lastBy=by;
  startAnim(s0,by,tp,res,()=>{if(isOnline)send(next);else settle(next)})}
 async function send(next){const end=next.phase==='over'?{winner:next.winner}:null;
  try{view=await online.partyThrow(view.id,view.ply,next,end);busy=false;errorText='';settle(view.state)}
  catch(e){busy=false;errorText='Lancer non envoyé : '+e.message;try{view=await online.getParty(view.id)}catch{}settle(view.state)}}
 function settle(s){state=s;shownN=state.last?.n||shownN;if(state.msg)banner(state.msg);thrower=currentThrower();refreshHud();
  if(state.phase==='over')return gameOver();if(!isOnline&&vsAI&&thrower==='cpu')setTimeout(aiPlay,1000)}

 // ---- ordinateur
 function aiPlay(){if(ended||anim||thrower!=='cpu')return;if(c.isPaused())return void setTimeout(aiPlay,500);const a=P.aiThrow(state,aiLevel);
  const tp=P.throwParams(state.phase==='jack'?'jack':'ball',a.angle,a.power,a.loft),res=P.simulate(state,tp,'cpu'),s0=state,next=P.applyThrow(state,'cpu',tp,res);lastBy='cpu';startAnim(s0,'cpu',tp,res,()=>settle(next))}

 // ---- en ligne
 async function poll(){if(!isOnline||busy||anim||ended)return;let v;try{v=await online.getParty(view.id)}catch{errorText='Connexion perdue…';refreshHud();return}
  if(errorText.startsWith('Connexion'))errorText='';const changed=v.ply!==view.ply;view=v;
  if(changed&&v.state?.last&&v.state.last.n>shownN){const L=v.state.last,s0={...v.state,jack:L.before.jack,balls:L.before.balls};startAnim(s0,L.by,L.tp,P.simulate(s0,L.tp,L.by),()=>settle(v.state));return}
  if(changed)settle(v.state);else{thrower=currentThrower();refreshHud()}}
 if(isOnline)c.every(poll,POLL);
 async function act(fn){busy=true;try{view=await fn();errorText=''}catch(e){errorText=e.message}busy=false;thrower=currentThrower();refreshHud()}

 // ---- interface
 let bannerT=0;function banner(t){const b=$h('.pq-banner');b.textContent=t;b.hidden=false;b.classList.remove('show');void b.offsetWidth;b.classList.add('show');bannerT=3.2}
 const esc=s=>String(s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[ch]);
 function refreshHud(){
  const sc=state.score,teamNames=t=>state.players.filter(p=>p.team===t).map(p=>`<span class="${p.id===thrower?'pq-cur':''}">${esc(p.name)}<i>${'●'.repeat(state.left[p.id]||0)}${'○'.repeat(Math.max(0,p.boules-(state.left[p.id]||0)))}</i></span>`).join('');
  for(const t of [0,1]){const el=$h('.pq-team.t'+t);el.querySelector('.pq-score').textContent=sc[t];el.querySelector('.pq-names').innerHTML=teamNames(t);el.classList.toggle('turn',state.turnTeam===t&&state.phase!=='over');el.classList.toggle('mine',isOnline&&view.my_team===t)}
  $h('.pq-mene').textContent=state.phase==='over'?'Fin':'Mène '+state.mene;
  $h('[data-act=view]').classList.toggle('on',topLock);$h('[data-act=view]').setAttribute('aria-label',topLock?'Quitter la vue de dessus':'Vue de dessus');
  const mine=canThrow();throwBox.hidden=!mine||topLock;throwBox.querySelector('.pq-lofts').hidden=state.phase==='jack';for(const b of throwBox.querySelectorAll('[data-loft]'))b.classList.toggle('on',Math.abs(+b.dataset.loft-loft)<.01);
  const acts=$h('.pq-actions');acts.replaceChildren();const btn=(label,aria,fn,cls='')=>{const b=document.createElement('button');b.className='pq-icon '+cls;b.textContent=label;b.setAttribute('aria-label',aria);b.onclick=fn;acts.append(b);return b};
  let text='';const who=thrower?pName(thrower):'';
  if(state.phase==='over')text='Partie terminée';
  else if(anim)text=anim.by===me?'Tu lances…':pName(anim.by)+' lance…';
  else if(mine){const pre=isOnline||vsAI?'À toi':`${who} (${TEAMS[pTeam(thrower)].name})`;
   if(topLock)text=pre+' : quitte la vue de dessus pour lancer';
   else text=pre+(state.phase==='jack'?' : lance le cochonnet (6 à 10 m) : glisse la boule vers le haut et relâche':' : lance la boule d’un geste, la vitesse donne la force')}
  else if(isOnline){
   if(view.need_vote){text=`${view.ask_name} veut lancer`;btn('✕','Refuser',()=>act(()=>online.partyVote(view.id,false)),'no');btn('✓','Accepter',()=>act(()=>online.partyVote(view.id,true)),'yes')}
   else if(view.ask_by===me){text='Demande envoyée à ton équipe…';btn('✕','Annuler la demande',()=>act(()=>online.partyVote(view.id,false)),'no')}
   else if(view.ask_by)text=`${view.ask_name} demande à lancer`;
   else if(view.can_ask){text='À ton équipe : demande à lancer';btn('✋','Demander à lancer',()=>act(()=>online.partyAsk(view.id)),'yes')}
   else if(view.thrower)text='Au tour de '+view.thrower_name;
   else text=String(state.turnTeam)===String(view.my_team)?'Ton équipe choisit qui lance…':'L’équipe adverse joue…'}
  else if(vsAI&&thrower==='cpu')text='L’ordinateur réfléchit…';
  $h('.pq-prompt').textContent=errorText||text;hud.classList.toggle('with-pad',!throwBox.hidden)}

 function gameOver(){if(ended)return;ended=true;sfx?.cheer();refreshHud();const w=state.winner,mineT=isOnline?view.my_team:vsAI?pTeam('me'):w,win=mineT===w;
  const names=state.players.filter(p=>p.team===w).map(p=>p.name).join(', '),score=`${state.score[w]} à ${state.score[1-w]}`;
  const text=isOnline||vsAI?(win?`Victoire ${score} !`:`Défaite ${state.score[mineT]} à ${state.score[w]}.`)+`\nÉquipe ${TEAMS[w].name} : ${names}.`:`L’équipe ${TEAMS[w].name} gagne ${score} !\n${names}.`;
  setTimeout(()=>c.finish(win,state.score[mineT]||0,text,{reward:isOnline?(win?400:120):vsAI?(win?250:60):40,once:isOnline?'petanque:'+view.id:null,noRecord:true,title:win?'Victoire !':'Partie terminée'}),900)}

 // ---- dessin
 function sceneObjs(s=state){const out=[];if(s.jack)out.push({kind:'jack',x:s.jack.x,z:s.jack.z});for(const b of s.balls)out.push({kind:'ball',x:b.x,z:b.z,team:b.team});return out}
 function draw(objs){g.setTransform(2,0,0,2,0,0);setCam(orb);
  const hz=H/2-F*Math.tan(orb.pitch);const sky=g.createLinearGradient(0,Math.min(hz,H)-260,0,Math.min(hz,H));sky.addColorStop(0,'#a9d6ec');sky.addColorStop(1,'#fbf0d6');g.fillStyle=sky;g.fillRect(0,0,W,H);
  if(hz<H){g.fillStyle='#bfd18f';g.fillRect(0,Math.max(0,hz),W,H)}
  const farItems=[];for(const f of scene.far){if((cam.x-f.c[0])*f.n[0]+(cam.y-f.c[1])*f.n[1]+(cam.z-f.c[2])*f.n[2]<=0)continue;const s=clipPoly(f.pts);if(s)farItems.push({d:toView(...f.c)[2],s,fill:f.fill})}
  farItems.sort((a,b)=>b.d-a.d).forEach(i=>fillPts(i.s,i.fill));
  for(const t of scene.tiles){const s=clipPoly(t.pts);if(s)fillPts(s,t.fill)}
  const terr=clipPoly([[-2,.003,0],[2,.003,0],[2,.003,15],[-2,.003,15]]);if(terr)fillPts(terr,'#e8d4a8');
  for(const q of scene.gravel){const v=toView(q.x,.004,q.z);if(v[2]<NEAR||v[2]>30)continue;const [x,y]=scr(v),s=Math.max(.5,.022*F/v[2]);if(x<-2||x>W+2||y<-2||y>H+2)continue;g.fillStyle=q.c;g.fillRect(x,y,s,s*.6)}
  const ring=[];for(let i=0;i<24;i++){const a=i/24*Math.PI*2;ring.push([P.CIRCLE.x+Math.cos(a)*.35,.005,P.CIRCLE.z+Math.sin(a)*.35])}const rs=clipPoly(ring);if(rs){g.strokeStyle='#fffaf0';g.lineWidth=1.6;g.beginPath();rs.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.stroke()}
  // ombres
  for(const o of objs){const r=(o.kind==='jack'?P.R_JACK:P.R_BALL)*VS*1.1,pts=[];for(let i=0;i<10;i++){const a=i/10*Math.PI*2;pts.push([o.x+.012+Math.cos(a)*r,.006,o.z+Math.sin(a)*r])}const s=clipPoly(pts);if(s)fillPts(s,`rgba(70,55,30,${o.y>0?.16:.3})`)}
  if(canThrow()&&!anim&&!topLock&&flick?.aim)drawAim();
  // objets pleins triés par profondeur
  const items=[];
  for(const f of scene.solids){if(f.tree&&Math.hypot(cam.x-f.tree[0],cam.z-f.tree[1])<3.5)continue;if((cam.x-f.c[0])*f.n[0]+(cam.y-f.c[1])*f.n[1]+(cam.z-f.c[2])*f.n[2]<=0)continue;const d=toView(...f.c)[2];if(d<1.6)continue;/* la caméra traverse un arbre : on ne dessine pas ce qui la touche */const s=clipPoly(f.pts);if(s)items.push({d,s,fill:f.fill,st:'rgba(60,45,30,.16)'})}
  for(const o of objs){const jack=o.kind==='jack',r=(jack?P.R_JACK:P.R_BALL)*VS,cy=r+(o.y||0),cv0=toView(o.x,cy,o.z);if(cv0[2]<NEAR)continue;const px=F*r/cv0[2];
   const col=jack?'#ef6a3c':TEAMS[o.team??0].metal;
   if(px<1.4){items.push({d:cv0[2],s:null,dot:[...scr(cv0),Math.max(.8,px)],fill:col});continue}
   const [X,Y]=scr(cv0);items.push({d:cv0[2],ball:{o,X,Y,R:px,r,cy,col,jack}})}
  items.sort((a,b)=>b.d-a.d);for(const i of items){if(i.ball){drawBall(i.ball);continue}if(i.dot){g.fillStyle=i.fill;g.beginPath();g.arc(i.dot[0],i.dot[1],i.dot[2],0,7);g.fill()}else fillPts(i.s,i.fill,i.st)}
  if(powerFlash>0)drawGauge(lastPower)}
 // boule lisse éclairée + stries : l'orientation suit la position (roulement sans glisser)
 function drawBall(b){const {o,X,Y,R,r,cy,col,jack}=b;const gr=g.createRadialGradient(X-R*.38,Y-R*.42,R*.08,X,Y,R*1.05);
  gr.addColorStop(0,'#ffffff');gr.addColorStop(.25,col);gr.addColorStop(1,jack?'#8f3216':'#4f5a64');g.fillStyle=gr;g.beginPath();g.arc(X,Y,R,0,7);g.fill();
  if(R>3.5){const ax=o.z/r,az=-o.x/r,ca=Math.cos(ax),sa=Math.sin(ax),cb=Math.cos(az),sb=Math.sin(az);
   const rot=(x,y,z)=>{const y1=y*ca-z*sa,z1=y*sa+z*ca;return [x*cb-y1*sb,x*sb+y1*cb,z1]};
   const toCam=[cam.x-o.x,cam.y-cy,cam.z-o.z],tl=Math.hypot(...toCam);g.strokeStyle=jack?'rgba(120,40,20,.45)':o.team===1?'rgba(170,60,35,.75)':'rgba(40,80,150,.75)';g.lineWidth=Math.max(.6,R*.07);
   for(const h of jack?[0]:[-.42,0,.42]){const rho=Math.sqrt(1-h*h);g.beginPath();let on=false;for(let k=0;k<=36;k++){const t=k/36*Math.PI*2,[px,py,pz]=rot(Math.cos(t)*rho,h,Math.sin(t)*rho);
     if((px*toCam[0]+py*toCam[1]+pz*toCam[2])/tl<.05){on=false;continue}const q=proj(o.x+px*r,cy+py*r,o.z+pz*r);if(!q){on=false;continue}if(on)g.lineTo(q[0],q[1]);else{g.moveTo(q[0],q[1]);on=true}}g.stroke()}}
  g.strokeStyle='rgba(40,40,40,.35)';g.lineWidth=.6;g.beginPath();g.arc(X,Y,R,0,7);g.stroke()}
 // pendant le geste : direction au sol
 function drawAim(){const dx=Math.sin(angle),dz=Math.cos(angle),pts=[];for(let d=.4;d<=6;d+=.2)pts.push([P.CIRCLE.x+dx*d,.01,P.CIRCLE.z+dz*d]);
  g.strokeStyle='rgba(255,250,235,.95)';g.lineWidth=2.4;g.setLineDash([6,5]);g.beginPath();let on=false;for(const p of pts){const q=proj(...p);if(!q){on=false;continue}if(on)g.lineTo(q[0],q[1]);else{g.moveTo(q[0],q[1]);on=true}}g.stroke();g.setLineDash([])}
 function drawGauge(v){const x=W-30,y0=130,h=Math.min(300,H-300);g.fillStyle='rgba(255,250,240,.85)';round(x-3,y0-3,22,h+6,11);g.fill();
  const gr=g.createLinearGradient(0,y0+h,0,y0);gr.addColorStop(0,'#86c06c');gr.addColorStop(.6,'#f3c34e');gr.addColorStop(1,'#e2603f');g.fillStyle=gr;round(x,y0+h*(1-v),16,h*v,8);g.fill();
  g.fillStyle='#5b6b50';g.font='bold 9px ui-rounded,Arial';g.textAlign='center';g.fillText('FORCE',x+8,y0+h+16)}
 function round(x,y,w,h,r){g.beginPath();g.roundRect?g.roundRect(x,y,w,Math.max(0,h),Math.min(r,Math.max(0,h)/2)):g.rect(x,y,w,h)}

 // ---- boucle
 refreshHud();if(state.phase==='over')setTimeout(gameOver,300);
 if(!isOnline&&vsAI&&thrower==='cpu')setTimeout(aiPlay,1200);
 c.every(()=>sfx?.sync(c.isPaused()),300);
 let hudW=0;
 return {
  update(dt){const now=performance.now(),k=1-Math.exp(-dt*3);
   const target=topLock?topOrbit():!pointers.size&&now-lastTouch>RETURN_MS?homeOrbit():null;
   if(target){let dy=target.yaw-orb.yaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));orb.yaw+=dy*k;for(const key of ['cx','cz','pitch','dist'])orb[key]=lerp(orb[key],target[key],k)}
   else{const C=center();orb.cx=lerp(orb.cx,C.x,k);orb.cz=lerp(orb.cz,state.jack?C.z:orb.cz,k)}
   if(anim)stepAnim(dt);if(bannerT>0){bannerT-=dt;if(bannerT<=0)$h('.pq-banner').hidden=true}
   draw(anim?animObjs():sceneObjs());
   if(powerFlash>0)powerFlash-=dt;
   const r=cv.getBoundingClientRect().width;if(r!==hudW){hudW=r;placeHud()}},
  destroy(){sfx?.stop();if(isOnline&&(ended||state.phase==='over'))online.hideParty(view.id).catch(()=>{})}
 };
}

// ---- sons synthétisés : lancer, atterrissage dans le gravier, roulement, choc de boules
function makeAudio(c){let A;try{A=c.audio()}catch{}if(!A)return null;
 const out=A.createGain();out.connect(A.destination);
 const buf=A.createBuffer(1,A.sampleRate*2,A.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
 const vol=()=>c.volume('sfx')*2;out.gain.value=vol();
 function noise({type='bandpass',freq=1000,q=1,dur=.2,gain=.2,to,delay=0,attack=.005}){const t=A.currentTime+delay,s=A.createBufferSource(),f=A.createBiquadFilter(),gn=A.createGain();
  s.buffer=buf;f.type=type;f.frequency.setValueAtTime(freq,t);if(to)f.frequency.exponentialRampToValueAtTime(to,t+dur);f.Q.value=q;gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(gain,t+attack);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);
  s.connect(f);f.connect(gn);gn.connect(out);s.start(t,Math.random());s.stop(t+dur+.05)}
 function tone(freq,dur,gain,type='sine',delay=0,to){const t=A.currentTime+delay,o=A.createOscillator(),gn=A.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(to)o.frequency.exponentialRampToValueAtTime(to,t+dur);
  gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(gain,t+.004);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(gn);gn.connect(out);o.start(t);o.stop(t+dur+.05)}
 const rs=A.createBufferSource(),rf=A.createBiquadFilter(),rg=A.createGain();rs.buffer=buf;rs.loop=true;rf.type='bandpass';rf.frequency.value=1700;rf.Q.value=.7;rg.gain.value=0;rs.connect(rf);rf.connect(rg);rg.connect(out);rs.start();
 return {
  wake(){if(A.state==='suspended')A.resume()},
  whoosh(p){noise({freq:420,to:1500+900*p,q:.9,dur:.38,gain:.07+.08*p,attack:.08})},
  land(kind,mode){if(kind==='jack'){noise({type:'highpass',freq:2600,dur:.09,gain:.08});tone(320,.08,.06,'triangle');return}
   tone(95,.18,.28,'sine',0,55);noise({type:'lowpass',freq:500,dur:.16,gain:.22});noise({type:'highpass',freq:2800,dur:mode==='shoot'?.22:.14,gain:.12})},
  // boules d'acier pleines : « clac » court et mat (pas de résonance) ; cochonnet en bois : « toc »
  hit(power,jack){const k=Math.min(1,power/3+.3);if(jack){noise({freq:950,q:3,dur:.05,gain:.22*k});tone(620,.045,.08*k,'triangle',0,480);return}
   noise({freq:2100,q:1.6,dur:.045,gain:.45*k,attack:.001});noise({freq:5200,q:2.5,dur:.02,gain:.12*k,attack:.001});tone(1180,.04,.09*k,'triangle',0,880);tone(260,.05,.12*k,'sine',0,180)},
  out(){tone(130,.12,.12,'sine',0,80);noise({type:'lowpass',freq:300,dur:.12,gain:.1})},
  roll(sp){rg.gain.setTargetAtTime(Math.min(.09,sp*.035),A.currentTime,.05)},
  cheer(){[523,659,784,1047].forEach((f,i)=>tone(f,.35,.1,'triangle',i*.11))},
  sync(paused){out.gain.setTargetAtTime(paused?0:vol(),A.currentTime,.05)},
  stop(){try{rg.gain.value=0;rs.stop()}catch{}setTimeout(()=>{try{out.disconnect()}catch{}},200)}
 }}
