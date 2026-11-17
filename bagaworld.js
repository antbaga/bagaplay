// BagaWorld : petit MMO tactique à la Dofus, en 3D voxel. Exploration en continu (toucher le sol pour marcher,
// toucher un groupe de monstres pour l'attaquer, un PNJ pour lui parler), combats au tour par tour sur la grille
// découpée autour de la rencontre. Étape 1 : solo (le monde, les combats, la progression). Étape 2 : en ligne.
import * as D from './bagaworld-data.js';
import * as F from './bagaworld-fight.js';
import * as C from './bagaworld-char.js';
import * as WW from './bagaworld-world.js';
import * as MD from './bagaworld-models.js';
import {createGL,M4,project,hex} from './urssaf-gl.js';
import {setMusicTheme} from './rewards.js';
import * as online_ from './online.js';

const SAVE='bagaplay-bagaworld',BH=MD.BH;
const load=()=>{try{return JSON.parse(localStorage.getItem(SAVE))||null}catch{return null}};
// inverse d'une matrice 4 × 4 (pour retrouver le point du sol sous le doigt)
function inv(m){const o=new Array(16),a=m;const b00=a[0]*a[5]-a[1]*a[4],b01=a[0]*a[6]-a[2]*a[4],b02=a[0]*a[7]-a[3]*a[4],b03=a[1]*a[6]-a[2]*a[5],b04=a[1]*a[7]-a[3]*a[5],b05=a[2]*a[7]-a[3]*a[6],
 b06=a[8]*a[13]-a[9]*a[12],b07=a[8]*a[14]-a[10]*a[12],b08=a[8]*a[15]-a[11]*a[12],b09=a[9]*a[14]-a[10]*a[13],b10=a[9]*a[15]-a[11]*a[13],b11=a[10]*a[15]-a[11]*a[14];
 let det=b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06;if(!det)return null;det=1/det;
 o[0]=(a[5]*b11-a[6]*b10+a[7]*b09)*det;o[1]=(a[2]*b10-a[1]*b11-a[3]*b09)*det;o[2]=(a[13]*b05-a[14]*b04+a[15]*b03)*det;o[3]=(a[10]*b04-a[9]*b05-a[11]*b03)*det;
 o[4]=(a[6]*b08-a[4]*b11-a[7]*b07)*det;o[5]=(a[0]*b11-a[2]*b08+a[3]*b07)*det;o[6]=(a[14]*b02-a[12]*b05-a[15]*b01)*det;o[7]=(a[8]*b05-a[10]*b02+a[11]*b01)*det;
 o[8]=(a[4]*b10-a[5]*b08+a[7]*b06)*det;o[9]=(a[1]*b08-a[0]*b10-a[3]*b06)*det;o[10]=(a[12]*b04-a[13]*b02+a[15]*b00)*det;o[11]=(a[9]*b02-a[8]*b04-a[11]*b00)*det;
 o[12]=(a[5]*b07-a[4]*b09-a[6]*b06)*det;o[13]=(a[0]*b09-a[1]*b07+a[2]*b06)*det;o[14]=(a[13]*b01-a[12]*b03-a[14]*b00)*det;o[15]=(a[8]*b03-a[9]*b01+a[10]*b00)*det;return o}

export function bagaworld(c){
 const EN=window.bagaLang==='en',T=(fr,en)=>EN?en:fr,X=a=>Array.isArray(a)?a[EN?1:0]:a,nm=o=>EN?o.en:o.fr;
 const esc=s=>String(s??'').replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[ch]);
 const wrap=document.createElement('div');wrap.className='bw-wrap';c.board.append(wrap);
 const cv=document.createElement('canvas');cv.className='bw-canvas';wrap.append(cv);
 const ui=document.createElement('div');ui.className='bw-ui';wrap.append(ui);
 const R=createGL(cv);if(!R){ui.innerHTML=`<div class="bw-nogl">${T('Ton appareil ne permet pas d’afficher BagaWorld en 3D (WebGL indisponible).','Your device can’t display BagaWorld in 3D (WebGL unavailable).')}</div>`;return {destroy(){}}}
 const W=WW.genWorld(),groups=WW.spawnGroups(W),wr=F.rng(Date.now()&0xffff);
 const save0=load();let ch=save0?.char||null;if(ch)ch.jobs??={};let disc=new Set(save0?.zaaps||['town']);
 let mode=ch?'world':'create',alive=true,t=0,dt=.016,lastSave=0;
 const P={x:W.start.x,z:W.start.z,y:BH,yaw:0,path:[],walk:0,sit:false,goal:null};if(save0?.pos&&WW.walkable(W,save0.pos.x,save0.pos.z)){P.x=save0.pos.x;P.z=save0.pos.z}
 const cam={yaw:0,dist:12,el:.92,x:P.x,z:P.z,shake:0},view={VP:null,eye:null,w:1,h:1};
 const M={chunks:new Map(),dung:[],water:null,cube:MD.cubeMesh(R),tile:MD.tileMesh(R),mobs:{},chars:new Map(),npcs:{}};
 const NET={on:false,pub:null,others:new Map(),chat:[],lastChat:0,group:[],fights:[],inv:[],shown:new Set(),ignore:new Set(),t:0,busy:false,err:0,now:false,grp:false,leader:false,first:true,scope:'local',myBubble:null};
 try{NET.on=online_.enabled()&&online_.registered()}catch{}
 const fx=[],floats=[];let fight=null,zoneNow=null,dialogOpen=false,panelOpen=null,regenT=0;
 const buzz=p=>{try{navigator.vibrate?.(p)}catch{}};
 const store=()=>{if(!ch)return;try{localStorage.setItem(SAVE,JSON.stringify({char:ch,zaaps:[...disc],pos:{x:P.x,z:P.z}}))}catch{}};

 // ---- sons et musiques
 const au=()=>{const v=c.volume('sfx');if(!v)return null;const A=c.audio();return A?{A,v}:null};
 function tone(f0,f1,dur,type='sine',g=.06,delay=0){const a=au();if(!a)return;const {A,v}=a,s=A.currentTime+delay,o=A.createOscillator(),gn=A.createGain();o.type=type;o.frequency.setValueAtTime(f0,s);o.frequency.exponentialRampToValueAtTime(Math.max(30,f1),s+dur);gn.gain.setValueAtTime(g*v,s);gn.gain.exponentialRampToValueAtTime(.0008,s+dur);o.connect(gn);gn.connect(A.destination);o.start(s);o.stop(s+dur+.02)}
 let nb=null;function noise(dur,g,freq,delay=0,type='lowpass'){const a=au();if(!a)return;const {A,v}=a;if(!nb){nb=A.createBuffer(1,A.sampleRate*.6,A.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
  const s=A.currentTime+delay,src=A.createBufferSource(),f=A.createBiquadFilter(),gn=A.createGain();src.buffer=nb;f.type=type;f.frequency.value=freq;gn.gain.setValueAtTime(g*v,s);gn.gain.exponentialRampToValueAtTime(.0008,s+dur);src.connect(f);f.connect(gn);gn.connect(A.destination);src.start(s);src.stop(s+dur+.02)}
 const SFX={click:()=>tone(700,900,.04,'triangle',.03),step:()=>noise(.04,.02,600),hit:()=>{noise(.08,.09,900);tone(200,90,.12,'square',.04)},crit:()=>{noise(.12,.1,1500);tone(900,300,.2,'sawtooth',.05)},
  heal:()=>[660,880,1100].forEach((f,i)=>tone(f,f*1.05,.12,'sine',.04,i*.06)),arrow:()=>noise(.15,.06,3000,0,'bandpass'),fire:()=>noise(.3,.08,700),boom:()=>{noise(.4,.15,300);tone(120,40,.4,'sine',.08)},
  buff:()=>[523,784,1046].forEach((f,i)=>tone(f,f,.1,'triangle',.04,i*.05)),die:()=>{tone(400,80,.5,'sawtooth',.05)},turn:()=>tone(880,880,.08,'sine',.04),
  win:()=>[523,659,784,1046,1318].forEach((f,i)=>tone(f,f,.18,'triangle',.06,i*.11)),lose:()=>[392,330,262,196].forEach((f,i)=>tone(f,f,.25,'sawtooth',.04,i*.18)),
  level:()=>[523,659,784,1046,784,1046,1318].forEach((f,i)=>tone(f,f,.16,'square',.04,i*.09)),coin:()=>[1318,1760].forEach((f,i)=>tone(f,f,.08,'square',.03,i*.06)),
  zap:()=>{tone(300,1500,.5,'sine',.05);noise(.5,.04,2500,0,'bandpass')},bleat:()=>{for(let i=0;i<4;i++)tone(330+i%2*30,320,.08,'sawtooth',.03,i*.07)}};
 const THEMES={
  town:{period:200,bass:[48,55,52,55,50,57,53,57],mel:[72,74,76,0,79,76,74,72,74,0,71,72,74,76,72,0]},
  field:{period:240,bass:[45,52,48,52,43,50,47,50],mel:[69,0,72,74,76,0,74,72,69,0,67,69,72,0,0,0]},
  woods:{period:260,bass:[41,48,44,48,39,46,43,46],mel:[65,0,68,0,70,72,70,68,65,0,63,0,65,0,0,0]},
  fight:{period:150,bass:[40,40,47,40,43,43,50,43],mel:[64,0,67,64,71,0,69,67,64,0,62,64,67,0,64,0],drum:1}};
 function theme(name){const th=THEMES[name];return {period:th.period,play(A,step,vol){const s=A.currentTime,note=(m,dur,type,g)=>{const o=A.createOscillator(),gn=A.createGain();o.type=type;o.frequency.value=440*2**((m-69)/12);gn.gain.setValueAtTime(0,s);gn.gain.linearRampToValueAtTime(g*vol,s+.01);gn.gain.exponentialRampToValueAtTime(.0001,s+dur);o.connect(gn);gn.connect(A.destination);o.start(s);o.stop(s+dur+.02)};
   if(step%2===0)note(th.bass[(step/2)%th.bass.length]-12,.35,'triangle',.07);const m=th.mel[step%th.mel.length];if(m)note(m,.25,name==='fight'?'square':'triangle',name==='fight'?.014:.03);
   if(th.drum&&step%2===0){const b=A.createBufferSource(),g=A.createGain();if(!A._bwn){A._bwn=A.createBuffer(1,A.sampleRate*.2,A.sampleRate);const d=A._bwn.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/600)}b.buffer=A._bwn;g.gain.value=(step%8===0?.12:.05)*vol;b.connect(g);g.connect(A.destination);b.start(s)}}}}
 let musicNow='';const music=name=>{if(name===musicNow)return;musicNow=name;setMusicTheme(theme(name))};

 // ---- maillages (mis en cache)
 function chunk(cx,cz){const k=cx+','+cz;let m=M.chunks.get(k);if(!m){m=MD.chunkMesh(R,W,cx,cz);M.chunks.set(k,m)}return m}
 const mobMesh=id=>M.mobs[id]||(M.mobs[id]=MD.mobMesh(R,id));
 function charParts(look){const key=JSON.stringify(look);let p=M.chars.get(key);if(!p){p=MD.charParts(R,look);M.chars.set(key,p);if(M.chars.size>24){const [k0,v0]=M.chars.entries().next().value;for(const m of Object.values(v0))R.free(m);M.chars.delete(k0)}}return p}
 const npcParts=id=>M.npcs[id]||(M.npcs[id]=MD.npcParts(R,D.NPCS[id]));
 const myLook=()=>({cls:ch.cls,...ch.look,eq:{hat:ch.eq.hat,cape:ch.eq.cape,belt:ch.eq.belt,boots:ch.eq.boots,amulet:ch.eq.amulet,weapon:ch.eq.weapon}});

 // ---- caméra et sélection au doigt
 function camera(){const w=wrap.clientWidth,h=wrap.clientHeight,tx=cam.x,tz=cam.z,ty=WW.tileH(W,tx,tz)*BH+.6+(cam.oy||0);let sx=0,sz=0;if(cam.shake>0){sx=(Math.random()-.5)*cam.shake*.3;sz=(Math.random()-.5)*cam.shake*.3}
  const e=[tx+sx+Math.sin(cam.yaw)*Math.cos(cam.el)*cam.dist,ty+Math.sin(cam.el)*cam.dist,tz+sz+Math.cos(cam.yaw)*Math.cos(cam.el)*cam.dist];
  view.VP=M4.mul(M4.persp(.8,w/h,.3,120),M4.look(e,[tx+sx,ty,tz+sz]));view.eye=e;view.w=w;view.h=h;if(mode==='fight'&&fight)fightCamera(w,h,sx,sz)}
 // combat : on cherche la distance qui fait tenir tout le plateau dans la zone libre de l'écran, puis on le centre dans cette zone
 function fightCamera(w,h,sx,sz){const A=fight.A,cx=A.ox+A.w/2+(cam.fpx||0),cz=A.oz+A.h/2+(cam.fpz||0),el=A.board?.98:1.02,P0=M4.persp(.8,w/h,.3,160);
  const tl=ui.querySelector('.bw-timeline'),fb=ui.querySelector('.bw-fbot'),wr=wrap.getBoundingClientRect();
  const top=Math.max(64,tl?tl.getBoundingClientRect().bottom-wr.top+6:110),bot=Math.max(120,fb?wr.bottom-fb.getBoundingClientRect().top+6:170);
  const aT=1-2*top/h,aB=-1+2*bot/h,aW=2-2*16/w,pts=[[A.ox,0,A.oz],[A.ox+A.w,0,A.oz],[A.ox,0,A.oz+A.h],[A.ox+A.w,0,A.oz+A.h],[A.ox,1.4,A.oz],[A.ox+A.w,1.4,A.oz]];
  let dist=cam.fd||24,VP,bb;
  for(let it=0;it<5;it++){const e=[cx+sx,Math.sin(el)*dist,cz+sz+Math.cos(el)*dist];VP=M4.mul(P0,M4.look(e,[cx+sx,0,cz+sz]));view.eye=e;
   bb=[9,9,-9,-9];for(const [x,y,z] of pts){const X=VP[0]*x+VP[4]*y+VP[8]*z+VP[12],Y=VP[1]*x+VP[5]*y+VP[9]*z+VP[13],Wc=VP[3]*x+VP[7]*y+VP[11]*z+VP[15];bb[0]=Math.min(bb[0],X/Wc);bb[1]=Math.min(bb[1],Y/Wc);bb[2]=Math.max(bb[2],X/Wc);bb[3]=Math.max(bb[3],Y/Wc)}
   if(it===4)break;const k=Math.min(aW/(bb[2]-bb[0]),(aT-aB)/(bb[3]-bb[1]));dist=Math.max(6,Math.min(80,dist/Math.pow(k,.9)))}
  if(!cam.fzoom||cam.fzoom<=1.001)cam.fd=dist;
  const z=Math.max(1,cam.fzoom||1);if(z>1){const e=[cx+sx,Math.sin(el)*dist/z,cz+sz+Math.cos(el)*dist/z];VP=M4.mul(P0,M4.look(e,[cx+sx,0,cz+sz]));view.eye=e}
  const tx=z>1?0:-(bb[0]+bb[2])/2,ty=z>1?(aT+aB)/2:(aT+aB)/2-(bb[1]+bb[3])/2;view.VP=M4.mul([1,0,0,0,0,1,0,0,0,0,1,0,tx,ty,0,1],VP)}
 function ray(px,py){const I=inv(view.VP);if(!I)return null;const nx=px/view.w*2-1,ny=1-py/view.h*2,un=(x,y,z)=>{const X=I[0]*x+I[4]*y+I[8]*z+I[12],Y=I[1]*x+I[5]*y+I[9]*z+I[13],Z=I[2]*x+I[6]*y+I[10]*z+I[14],Wd=I[3]*x+I[7]*y+I[11]*z+I[15];return [X/Wd,Y/Wd,Z/Wd]};
  const a=un(nx,ny,-1),b=un(nx,ny,1);return {o:a,d:[b[0]-a[0],b[1]-a[1],b[2]-a[2]]}}
 // point du sol (ou de la grille de combat) sous le doigt : on avance le long du rayon jusqu'à passer sous le terrain
 function groundAt(px,py,hf=(x,z)=>WW.tileH(W,x,z)*BH){const r=ray(px,py);if(!r)return null;const L=Math.hypot(...r.d),d=r.d.map(v=>v/L);
  for(let s=0;s<120;s+=.08){const x=r.o[0]+d[0]*s,y=r.o[1]+d[1]*s,z=r.o[2]+d[2]*s;if(y<=hf(x,z))return {x,z}}return null}
 const scr=(x,y,z)=>view.VP?project(view.VP,view.w,view.h,x,y,z):null;

 // ---- entrées : toucher = aller / attaquer / parler ; glisser = tourner la caméra ; pincer = zoomer
 const pts=new Map();let tap=null,pinch=null;
 c.listen(cv,'pointerdown',e=>{pts.set(e.pointerId,{x:e.clientX,y:e.clientY});cv.setPointerCapture?.(e.pointerId);if(pts.size===1)tap={x:e.clientX,y:e.clientY,t:performance.now(),moved:0};if(pts.size===2){const [a,b]=[...pts.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),dist:cam.dist,z:cam.fzoom||1};tap=null}});
 c.listen(cv,'pointermove',e=>{const p=pts.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x;p.x=e.clientX;p.y=e.clientY;
  if(pts.size===2&&pinch){const [a,b]=[...pts.values()],dd=Math.hypot(a.x-b.x,a.y-b.y);if(mode==='fight'){cam.fzoom=Math.max(1,Math.min(2.4,pinch.z*dd/Math.max(20,pinch.d)));if(cam.fzoom<=1.001){cam.fpx=cam.fpz=0}}else cam.dist=Math.max(6,Math.min(24,pinch.dist*pinch.d/Math.max(20,dd)));return}
  if(tap){const dy=e.clientY-(tap.ly??e.clientY);tap.ly=e.clientY;tap.moved+=Math.abs(dx)+Math.abs(dy);if(tap.moved>10){if(mode==='fight'){if((cam.fzoom||1)>1.001&&fight){const k=(cam.fd||20)/(cam.fzoom*wrap.clientHeight)*1.1;cam.fpx=Math.max(-fight.A.w/2,Math.min(fight.A.w/2,(cam.fpx||0)-dx*k));cam.fpz=Math.max(-fight.A.h/2,Math.min(fight.A.h/2,(cam.fpz||0)-dy*k))}}else cam.yaw-=dx*.008}}});
 const up=e=>{pts.delete(e.pointerId);if(pts.size<2)pinch=null;if(tap&&tap.moved<10&&performance.now()-tap.t<600){const r=cv.getBoundingClientRect();onTap(e.clientX-r.left,e.clientY-r.top)}tap=null};
 c.listen(cv,'pointerup',up);c.listen(cv,'pointercancel',e=>{pts.delete(e.pointerId);tap=null});
 c.listen(cv,'wheel',e=>{cam.dist=Math.max(6,Math.min(mode==='fight'?36:24,cam.dist*(e.deltaY>0?1.1:.9)));e.preventDefault()});
 const keys=new Set();c.listen(window,'keydown',e=>{const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright','z','q','s','d','w','a'].includes(k)&&mode==='world'&&!panelOpen){keys.add(k);e.preventDefault()}if(k==='escape')closePanel()});
 c.listen(window,'keyup',e=>keys.delete(e.key.toLowerCase()));
 function onTap(x,y){if(mode==='world')worldTap(x,y);else if(mode==='fight')fightTap(x,y)}

 // ================= EXPLORATION =================
 function worldTap(x,y){if(panelOpen||dialogOpen)return;P.sit=false;
  // un groupe de monstres, un PNJ ou un Bagaap sous le doigt ? (au plus près à l'écran)
  let best=null;const cand=[];
  for(const g of groups)if(g.dead<=0&&!g.busy&&!g.remote)cand.push({k:'mob',o:g,x:g.x,z:g.z,y:WW.tileH(W,g.x,g.z)*BH+.5});
  for(const n of W.npcs)cand.push({k:'npc',o:n,x:n.x,z:n.z,y:WW.tileH(W,n.x,n.z)*BH+.8});
  for(const o of NET.others.values())if(o.d.state!=='fight')cand.push({k:'player',o,x:o.x,z:o.z,y:WW.tileH(W,o.x,o.z)*BH+.8});
  for(const f2 of NET.fights)cand.push({k:'fightm',o:f2,x:f2.x,z:f2.z,y:WW.tileH(W,f2.x,f2.z)*BH+.8});
  cand.push({k:'cave',o:W.cave,x:W.cave.x,z:W.cave.z-1.4,y:WW.tileH(W,W.cave.x,W.cave.z)*BH+1});
  for(const zp of W.zaaps)cand.push({k:'zaap',o:zp,x:zp.x,z:zp.z-1.2,y:WW.tileH(W,zp.x,zp.z)*BH+.8});
  for(const q of cand){const s=scr(q.x,q.y,q.z);if(!s)continue;const d=Math.hypot(s[0]-x,s[1]-y);if(d<46&&(!best||d<best.d))best={...q,d}}
  if(best){SFX.click();if(best.k==='player'){playerCard(best.o);return}if(best.k==='fightm'){fightCard(best.o);return}if(best.k==='mob'){groupCard(best.o);return}goTo(best.x,best.z,best);return}
  const g=groundAt(x,y);if(!g)return;if(harvestTap(g))return;goTo(g.x,g.z,null)}
 function goTo(x,z,goal){let tx=x,tz=z;if(!WW.walkable(W,tx,tz)){const near=[];for(let r=1;r<=2;r++)for(let dz=-r;dz<=r;dz++)for(let dx=-r;dx<=r;dx++){const xx=Math.floor(x)+dx+.5,zz=Math.floor(z)+dz+.5;if(WW.walkable(W,xx,zz))near.push([xx,zz,Math.hypot(xx-P.x,zz-P.z)])}
   near.sort((a,b)=>a[2]-b[2]);if(!near.length)return;[tx,tz]=near[0]}
  const path=WW.findPath(W,P.x,P.z,tx,tz,40000);if(!path){toastMsg(T('Je ne peux pas aller là-bas.','I can’t get there.'));return}
  P.path=path.map(([a,b])=>[a+.5,b+.5]);if(!goal&&P.path.length)P.path[P.path.length-1]=[tx,tz];P.goal=goal;marker={x:tx,z:tz,t:0}}
 let marker=null;
 function worldTick(){
  // déplacement : clavier, sinon chemin
  let kx=0,kz=0;if(keys.has('arrowleft')||keys.has('q')||keys.has('a'))kx--;if(keys.has('arrowright')||keys.has('d'))kx++;if(keys.has('arrowup')||keys.has('z')||keys.has('w'))kz--;if(keys.has('arrowdown')||keys.has('s'))kz++;
  if(kx||kz){P.path=[];P.goal=null;P.sit=false;const cs=Math.cos(cam.yaw),sn=Math.sin(cam.yaw),mx=kx*cs+kz*sn,mz=-kx*sn+kz*cs,l=Math.hypot(mx,mz),sp=3.4*dt,nx=P.x+mx/l*sp,nz=P.z+mz/l*sp;
   if(WW.canStep(W,P.x,P.z,nx,P.z))P.x=nx;if(WW.canStep(W,P.x,P.z,P.x,nz))P.z=nz;P.yaw=Math.atan2(-mx,-mz);P.walk+=dt*8}
  else if(P.path.length){const [tx,tz]=P.path[0],dx=tx-P.x,dz=tz-P.z,d=Math.hypot(dx,dz),sp=3.4*dt;if(d<=sp){P.x=tx;P.z=tz;P.path.shift()}else{P.x+=dx/d*sp;P.z+=dz/d*sp}P.yaw=Math.atan2(-dx,-dz);P.walk+=dt*8;if(Math.random()<dt*3)SFX.step()}
  P.y+=(WW.tileH(W,P.x,P.z)*BH-P.y)*Math.min(1,dt*12);
  // arrivée près d'une cible
  if(P.goal){const g=P.goal,d=Math.hypot(g.x-P.x,g.z-P.z);
   if(g.k==='mob'&&g.o.dead<=0&&!g.o.busy&&!g.o.remote){if(d<1.4){P.path=[];P.goal=null;startFight(g.o)}else if(!P.path.length||Math.hypot(P.path.at(-1)[0]-g.o.x,P.path.at(-1)[1]-g.o.z)>1.5)goTo(g.o.x,g.o.z,g)}
   else if(g.k==='npc'&&d<1.8){P.path=[];P.goal=null;talk(g.o.id)}else if(g.k==='zaap'&&d<2.2){P.path=[];P.goal=null;zaapPanel(g.o)}
   else if(g.k==='cave'&&d<2.4){P.path=[];P.goal=null;dungeonPanel()}else if(g.k==='harvest'&&!P.path.length){P.goal=null;startHarvest(g.h)}
   else if(!P.path.length)P.goal=null}
  harvestTick();regrowTick();
  // groupes agressifs
  for(const g of groups)if(g.aggro&&g.dead<=0&&!g.busy&&!g.remote&&!starting&&Math.hypot(g.x-P.x,g.z-P.z)<2.2&&WW.zoneAt(Math.floor(P.x),Math.floor(P.z))!=='town'){toastMsg(T('Tu t’es fait agresser !','You got ambushed!'));startFight(g);return}
  WW.tickGroups(W,groups,dt,wr);
  // Bagaaps découverts, zone courante
  for(const zp of W.zaaps)if(!disc.has(zp.id)&&Math.hypot(zp.x-P.x,zp.z-P.z)<4){disc.add(zp.id);toastMsg(T('Nouveau Bagaap découvert : ','New Bagaap found: ')+nm(D.ZONES[zp.id]),'good');SFX.zap();store()}
  const zn=WW.zoneAt(Math.floor(P.x),Math.floor(P.z));if(zn!==zoneNow){zoneNow=zn;banner(nm(D.ZONES[zn]),D.ZONES[zn].lvl!=='—'?T('Niveau ','Level ')+D.ZONES[zn].lvl:T('Ville sûre','Safe town'));music(D.ZONES[zn].music)}
  // récupération des PV hors combat (plus vite assis)
  const mx=C.derived(ch).maxHp;regenT+=dt;if(regenT>(P.sit?.4:1.5)){regenT=0;if((ch.hp??mx)<mx)ch.hp=Math.min(mx,(ch.hp??mx)+Math.max(1,Math.round(mx/60)))}
  cam.x+=(P.x-cam.x)*Math.min(1,dt*5);cam.z+=(P.z-cam.z)*Math.min(1,dt*5);
  if(t-lastSave>8){lastSave=t;store()}hud()}

 function drawWorld(skipEntities=false){const ccx=Math.floor(cam.x/MD.CH),ccz=Math.floor(cam.z/MD.CH),n=Math.ceil(W.N/MD.CH);let built=0;
  for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){const cx=ccx+dx,cz=ccz+dz;if(cx<0||cz<0||cx>=n||cz>=n)continue;const k=cx+','+cz;if(!M.chunks.has(k)){if(built>=1&&Math.abs(dx)+Math.abs(dz)>1)continue;built++}R.draw(chunk(cx,cz),M4.id())}
  if(skipEntities)return;
  // PNJ
  for(const n of W.npcs){if(Math.hypot(n.x-cam.x,n.z-cam.z)>26)continue;const y=WW.tileH(W,n.x,n.z)*BH,yaw=Math.atan2(-(P.x-n.x),-(P.z-n.z));MD.drawChar(R,M4,npcParts(n.id),M4.trs(n.x,y,n.z,Math.hypot(P.x-n.x,P.z-n.z)<5?yaw:n.yaw,1.4),{bob:Math.sin(t*2+n.x)*.01,armR:Math.sin(t*1.5+n.z)*.2})}
  // groupes de monstres : le chef au centre, les autres autour
  drawNet();
  for(const g of groups){if(g.dead>0||g.remote||Math.hypot(g.x-cam.x,g.z-cam.z)>26)continue;const y=WW.tileH(W,g.x,g.z)*BH;
   g.members.forEach(([id],i)=>{const a=i*2.1,r=i?.75:0,x=g.x+Math.cos(a)*r,z=g.z+Math.sin(a)*r,hop=Math.abs(Math.sin(t*3+i+g.home.x))*.08;drawMob(id,x,y+hop,z,g.yaw,1)})}
  // Bagaaps : étincelles
  for(const zp of W.zaaps)if(Math.random()<dt*6&&Math.hypot(zp.x-cam.x,zp.z-cam.z)<20)fx.push({x:zp.x+(Math.random()-.5)*.6,y:WW.tileH(W,zp.x,zp.z-1.2)*BH+.6,z:zp.z-1.2+(Math.random()-.5)*.6,vx:0,vy:.8,vz:0,life:1,col:hex('#c9b8ff'),s:.06,g:-.3})
  // le joueur
  const pose=P.harv?(P.harv.h.fish?{armR:1.3,armL:1.1,bob:Math.sin(t*3)*.01}:{armR:.7+Math.sin(t*11)*.9,armL:.5+Math.sin(t*11)*.7,lean:-.12-Math.max(0,Math.sin(t*11))*.1}):P.sit?{legL:-1.5,legR:-1.5,bob:-.2,armL:.3,armR:.3}:P.path.length||keys.size?{legL:Math.sin(P.walk)*.7,legR:-Math.sin(P.walk)*.7,armL:-Math.sin(P.walk)*.6,armR:Math.sin(P.walk)*.6,bob:Math.abs(Math.sin(P.walk))*.05}:{bob:Math.sin(t*2)*.01,armR:Math.sin(t*1.3)*.05};
  shadow(P.x,P.y,P.z,.5);MD.drawChar(R,M4,charParts(myLook()),M4.trs(P.x,P.y,P.z,P.yaw,1.4),pose);
  if(marker){marker.t+=dt;if(marker.t>1.2||!P.path.length)marker=null;else{const s=.5+Math.sin(marker.t*8)*.1;R.draw(M.tile,M4.mul(M4.t(marker.x-s/2/.92,WW.tileH(W,marker.x,marker.z)*BH+.03,marker.z-s/2/.92),M4.sc(s,1,s)),[1,.85,.2,1],.7)}}}
 function drawMob(id,x,y,z,yaw,a=1,tint=null){const s=MD.MOB_SCALE[id]||1,sq=1+Math.sin(t*6+x*3)*.04;shadow(x,y,z,.45*s);R.draw(mobMesh(id),M4.mul(M4.trs(x,y,z,yaw,s),M4.sc(1/sq,sq,1/sq)),tint,a)}
 function shadow(x,y,z,r){R.draw(M.cube,M4.mul(M4.t(x,y+.012,z),M4.sc(r*2,.01,r*2)),[0,0,0,1],.2)}
 function drawFx(){for(const q of fx){q.vy-=q.g*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.z+=q.vz*dt;q.life-=dt;R.draw(M.cube,M4.mul(M4.t(q.x,q.y,q.z),M4.sc(q.s,q.s,q.s)),[q.col[0],q.col[1],q.col[2],1],Math.min(1,q.life*2))}
  for(let i=fx.length-1;i>=0;i--)if(fx[i].life<=0)fx.splice(i,1);if(fx.length>300)fx.splice(0,fx.length-300)}
 function burst(x,y,z,col,n=10,sp=2,up=2.5){const c3=hex(col);for(let i=0;i<n;i++){const a=Math.random()*6.28;fx.push({x,y,z,vx:Math.cos(a)*sp*Math.random(),vy:up*(.4+Math.random()),vz:Math.sin(a)*sp*Math.random(),life:.5+Math.random()*.5,col:c3,s:.06+Math.random()*.06,g:7})}}

 // ================= COMBAT =================
 // Solo : tout est local. En ligne : la description de départ (arène, graine, combattants) et le journal des actions
 // des joueurs sont sur le serveur ; chaque client rejoue ce journal, les tours des monstres étant recalculés à l'identique.
 // Règle d'or : une action du journal ne s'applique qu'entre deux tours de monstres (jamais au milieu), partout pareil.
 let F_=null,starting=false;
 const myFid=()=>NET.on&&NET.pub?NET.pub:'me';
 const meF=()=>fight?fight.S.f.find(f=>f.id===fight.me):null;
 const myTeam=()=>meF()?.team??0;
 function buildFight(init,meId,g,online){const S=F.newFight(init.arena,init.teams,init.seed,{waves:init.waves||[]});
  fight={S,A:S.arena,g,seed:init.seed,me:meId,kind:init.kind||'pve',online,init};
  F_={sel:null,disp:new Map(),aiT:0,busy:0,over:false,timer:60,hover:null,queue:[],posting:false,t0:t,went:false};return S}
 function dispAll(){for(const f of fight.S.f)if(!F_.disp.has(f.id))F_.disp.set(f.id,{x:f.x,y:f.y,path:[],yaw:f.team?0:Math.PI,hit:0})}
 function enterFight(){cam.fzoom=1;cam.fpx=cam.fpz=0;cam.fd=0;mode='fight';music('fight');SFX.bleat();buzz([40,40,40]);const A=fight.A;cam.x=A.ox+A.w/2;cam.z=A.oz+A.h/2;cam.dist=fitDist();P.path=[];P.goal=null;P.sit=false;closePanel();
  dispAll();if(fight.S.phase==='place')banner(fight.kind==='pvp'?T('Duel !','Duel!'):T('Combat !','Fight!'),T('Place-toi sur une case bleue, puis « Prêt »','Pick a blue cell, then “Ready”'));fightUI()}
 // les tours des monstres d'un coup, sans animation (pour rattraper un combat en cours)
 function drainAI(S){let n=0;while(S.phase==='fight'&&F.current(S)?.kind==='mob'&&n++<300){const a=F.aiAction(S)||{a:'end'};if(!F.act(S,a))F.act(S,{a:'end'})}}
 function replay(list){const S=fight.S;for(const a of list){drainAI(S);F.act(S,a);fight.online.applied++}S.ev.length=0;fight.online.recv=fight.online.applied;fight.A=S.arena}
 async function startFight(g){if(fight||starting)return;g.busy=true;P.path=[];P.goal=null;
  let meId=myFid();const seed=(Math.random()*2**31)|0,A=WW.fieldArena(WW.zoneAt(Math.floor(g.x),Math.floor(g.z)),seed),
   init={kind:'pve',arena:A,seed,teams:[[C.fighterOf(ch,meId)],g.members.map(([m,l],i)=>C.mobFighter(m,l,'m'+i))],gid:g.gid};
  let on=null;if(NET.on&&NET.pub){starting=true;try{const id=await online_.bwFightCreate('pve',init,g.x,g.z,g.gid);on={id,applied:0,recv:0}}catch(e){toastMsg(T('Combat hors ligne : ','Offline fight: ')+e.message)}starting=false;if(!alive)return}
  if(!on&&meId!=='me'){meId='me';init.teams[0][0]={...init.teams[0][0],id:'me'}}
  buildFight(init,meId,g,on);enterFight();
  if(on&&NET.group.some(m=>m.online&&m.id!==NET.pub))toastMsg(T('Ton groupe a 30 s pour te rejoindre.','Your group has 30 s to join you.'),'good')}
 // rejoindre un combat (resume : on y était déjà, après une coupure ou une invitation en duel acceptée par l'autre)
 async function joinFight(id,resume=false){if(fight||starting)return;starting=true;
  try{for(let k=0;k<4;k++){const r=await online_.bwSync(netState(),NET.lastChat,id,0);const fd=r.fight;if(!fd||!fd.init)throw new Error(T('Combat introuvable.','Fight not found.'));
    if(fd.status!=='active')throw new Error(T('Combat terminé.','Fight over.'));
    let log=fd.log;const pub=r.me.id;NET.pub=pub;
    if(!resume&&fd.init.dungeon&&!ch.inv[D.DUNGEON.key])throw new Error(T('Il te faut une Clé moisie pour entrer dans la grotte.','You need a Mouldy Key to enter the cave.'));
    if(!resume){const me=C.fighterOf(ch,pub);try{await online_.bwFightAct(id,fd.n,{a:'join',f:me});log=[...log,{a:'join',f:{...me,id:pub}}]}catch(e){if(/conflit/.test(e.message))continue;throw e}}
    if(!alive)return;const g=groups.find(q=>q.gid===fd.init.gid)||null;if(g)g.busy=true;
    buildFight(fd.init,pub,g,{id,applied:0,recv:0});replay(log);
    if(fight.S.phase==='over'){online_.bwFightDone(id).catch(()=>{});NET.ignore.add(id);fight=null;F_=null;return}
    if(!meF()){const why=T('Trop tard, le combat a commencé.','Too late, the fight has started.');online_.bwFightDone(id).catch(()=>{});fight=null;F_=null;throw new Error(why)}
    if(fight.init.dungeon){if(!resume){C.takeItem(ch,D.DUNGEON.key);store()}}else{P.x=fight.A.ox+meF().x+.5;P.z=fight.A.oz+meF().y+.5}enterFight();if(!resume)toastMsg(T('Tu rejoins le combat !','You join the fight!'),'good');return}
   throw new Error(T('Trop de monde en même temps, réessaie.','Too busy, try again.'))}
  catch(e){NET.ignore.add(id);toastMsg(e.message)}finally{starting=false}}
 // duel accepté : celui qui accepte prépare l'arène entre les deux joueurs et crée le combat
 async function createDuel(r){if(fight||starting)return;starting=true;try{const meId=NET.pub,mine=C.fighterOf(ch,meId),theirs={...r.data,id:r.from};mine.hp=mine.maxHp;theirs.hp=theirs.maxHp;
   const seed=(Math.random()*2**31)|0,A=WW.fieldArena(WW.zoneAt(Math.floor(P.x),Math.floor(P.z)),seed),init={kind:'pvp',arena:A,seed,teams:[[theirs],[mine]]};
   const id=await online_.bwFightCreate('pvp',init,P.x,P.z,null,r.from);if(!alive)return;buildFight(init,meId,null,{id,applied:0,recv:0});enterFight()}
  catch(e){toastMsg(e.message)}finally{starting=false}}
 // une action du joueur : directe en solo, envoyée puis appliquée en ligne (le serveur garde l'ordre)
 function doAct(a){if(!fight)return;const S=fight.S,o=fight.online;
  if(!o){if(F.act(S,a))afterAct();return}
  if(F_.posting)return;if(a.a!=='quit'&&(F_.queue.length||o.recv!==o.applied))return;
  const sent=a.a==='go'?{a:'go'}:{...a,id:a.id||fight.me},seq=o.recv;F_.posting=true;
  online_.bwFightAct(o.id,seq,sent).then(()=>{F_&&(F_.posting=false);if(!fight||fight.online!==o)return;
   if(o.recv>seq)return;   // déjà reçue par la synchro : elle sera appliquée depuis la file, pas deux fois
   drainAI(S);afterAct();F.act(S,sent);o.applied++;o.recv=o.applied;dispAll();afterAct()})
   .catch(e=>{if(F_)F_.posting=false;if(/conflit/.test(e.message)){NET.now=true;if(F_&&(sent.a==='ready'||sent.a==='place'))F_.retry=sent}else toastMsg(e.message)})}
 const worldDist=()=>{const asp=Math.max(.3,wrap.clientWidth/Math.max(1,wrap.clientHeight));return Math.max(11,Math.min(22,4.6/(Math.tan(.4)*Math.min(1.3,asp))))};
 function fitDist(){const asp=Math.max(.3,wrap.clientWidth/Math.max(1,wrap.clientHeight));return Math.max(11,Math.min(30,3.7/(Math.tan(.4)*Math.min(1.3,asp))))}
 const cellY=(x,y)=>(fight.A.hs[y*fight.A.w+x]??fight.A.h0)*BH;
 const cw=(x,y)=>[fight.A.ox+x+.5,cellY(x,y),fight.A.oz+y+.5];
 const myTurnNow=()=>{const S=fight.S,me=meF();return !!me&&S.phase==='fight'&&F.current(S)===me&&!F_.busy&&!F_.queue.length&&!F_.posting};
 function fightTap(px,py){if(panelOpen)return;const S=fight.S,A=fight.A;const g=groundAt(px,py,(x,z)=>{const cx=Math.floor(x-A.ox),cz=Math.floor(z-A.oz);return cx>=0&&cz>=0&&cx<A.w&&cz<A.h?cellY(cx,cz):WW.tileH(W,x,z)*BH});if(!g)return;
  const x=Math.floor(g.x-A.ox),y=Math.floor(g.z-A.oz);if(!F.inside(S,x,y))return;const me=meF();if(!me)return;
  if(S.phase==='place'){if(!me.ready&&S.start[me.team].some(q=>q[0]===x&&q[1]===y)){SFX.click();doAct({a:'place',id:me.id,x,y});if(!fight.online)syncDisp()}else{const o=F.at(S,x,y);if(o)showFighter(o)}return}
  const o=F.at(S,x,y);
  if(F_.sel){const rc=F.rangeCells(S,me,F_.sel),inRange=rc.ok.some(c=>c[0]===x&&c[1]===y);
   if(!inRange){F_.sel=null;fightUI();if(o&&o!==me&&!rc.blocked.some(c=>c[0]===x&&c[1]===y))showFighter(o);else SFX.click();return}
   if(!myTurnNow())return;const why=F.canCast(S,me,F_.sel,x,y);if(why){toastMsg(whyText(why));SFX.click();return}const sp=F_.sel;F_.sel=null;doAct({a:'cast',spell:sp,x,y});return}
  if(o){showFighter(o);return}
  if(!myTurnNow())return;const P2=F.paths(S,me),path=P2.path(x,y);if(path&&path.length)doAct({a:'move',path})}
 const whyText=w=>({pa:T('Pas assez de PA','Not enough AP'),cd:T('Sort en recharge','Spell on cooldown'),relance:T('Plus de relance ce tour','No more casts this turn'),portee:T('Hors de portée','Out of range'),
  ligne:T('En ligne droite seulement','Straight line only'),vue:T('Pas de ligne de vue','No line of sight'),cible:T('Cible invalide','Invalid target'),tour:T('Ce n’est pas ton tour','Not your turn')})[w]||w;
 function syncDisp(){for(const f of fight.S.f){const d=F_.disp.get(f.id);if(d&&!d.path.length){d.x=f.x;d.y=f.y}}}
 const fname=f=>f.kind==='mob'?nm(D.MOBS[f.mob]):f.name;
 // les événements du moteur deviennent des animations
 function afterAct(){if(!fight)return;const S=fight.S;dispAll();for(const e of S.ev.splice(0)){const f=S.f.find(o=>o.id===e.id),d=f&&F_.disp.get(f.id);
  if(e.id&&!d&&e.t!=='quit')continue;
  switch(e.t){
   case 'place':syncDisp();break;
   case 'join':toastMsg(`${f.name} ${T('rejoint le combat !','joins the fight!')}`,'good');SFX.buff();break;
   case 'quit':toastMsg(T('Un joueur a quitté le combat.','A player left the fight.'));break;
   case 'start':syncDisp();break;
   case 'wave':{fight.A=S.arena;for(const f2 of S.f){const d2=F_.disp.get(f2.id);if(d2){d2.x=f2.x;d2.y=f2.y;d2.path=[];d2.tx=null}}F_.t0=t;F_.went=false;F_.sel=null;
    const room=D.DUNGEON.rooms[e.n-1];banner(`${T('Salle','Room')} ${e.n}/${e.of}`,room?nm(room):'',3);SFX.zap();buzz([30,60,30]);cam.x=fight.A.ox+fight.A.w/2;cam.z=fight.A.oz+fight.A.h/2;break}
   case 'step':d.path.push([e.x,e.y]);break;
   case 'tp':case 'dash':case 'push':d.path=[];d.tx=e.x;d.ty=e.y;d.slide=0;d.fx=d.x;d.fy=d.y;if(e.t==='push')cam.shake=.3;break;
   case 'cast':{const sp=F.spellOf(f,e.spell),from=cw(f.x,f.y),to=cw(e.x,e.y);d.cast=.35;d.yaw=Math.atan2(-(e.x-f.x),-(e.y-f.y));F_.busy+=.45;
    const el=sp.fx.find(q=>q.el)?.el,col=el?D.EL[el].col:sp.fx.some(q=>q.t==='heal'||q.t==='hot')?'#5fdc7a':'#ffd23f';
    if(Math.abs(e.x-f.x)+Math.abs(e.y-f.y)>1)fx.push({x:from[0],y:from[1]+1,z:from[2],vx:(to[0]-from[0])/.3,vy:0,vz:(to[2]-from[2])/.3,life:.3,col:hex(col),s:.16,g:0});
    for(const [cx,cy] of F.zone(S,sp.aoe,e.x,e.y,f)){const p=cw(cx,cy);setTimeout(()=>burst(p[0],p[1]+.3,p[2],col,6,1.4,2),300)}
    (el==='fire'?SFX.fire:el==='air'&&f.cls==='viseur'?SFX.arrow:sp.fx.some(q=>q.t==='heal'||q.t==='hot')?SFX.heal:sp.fx.some(q=>q.t==='buff'||q.t==='invis')?SFX.buff:SFX.hit)();
    if(e.crit){floatAt(e.x,e.y,T('Critique !','Critical!'),'crit');SFX.crit()}break}
   case 'dmg':setTimeout(()=>{if(!fight)return;floatAt(f.x,f.y,'−'+e.v,e.el,e.push?T(' (poussée)',' (push)'):'');d.hit=.3;if(f.id===fight.me)buzz(30)},280);break;
   case 'heal':if(e.v>0)setTimeout(()=>fight&&floatAt(f.x,f.y,'+'+e.v,'heal'),280);break;
   case 'tackle':floatAt(f.x,f.y,`−${e.pm} PM${e.pa?` −${e.pa} PA`:''}`,'pm',T(' tacle !',' tackled!'));break;
   case 'buff':case 'debuff':floatAt(f.x,f.y,`${e.t==='debuff'?'−':'+'}${e.v} ${nm(D.STATS[e.stat])}`,e.t==='debuff'?'pm':'buff');break;
   case 'poison':floatAt(f.x,f.y,'☠️','pm');break;case 'hot':floatAt(f.x,f.y,'🌿','heal');break;
   case 'invis':floatAt(f.x,f.y,'👻','buff');break;case 'trap':SFX.click();break;
   case 'boom':{const p=cw(e.x,e.y);burst(p[0],p[1]+.3,p[2],'#ff8a3a',20,3,3);SFX.boom();cam.shake=.5;break}
   case 'die':setTimeout(()=>{if(!fight)return;const p=cw(f.x,f.y);burst(p[0],p[1]+.4,p[2],f.kind==='mob'?'#ffffff':'#e2453c',18,2,3);SFX.die()},350);F_.busy+=.3;break;
   case 'turn':if(f.id===fight.me){SFX.turn();buzz(20);F_.timer=60;F_.sel=null;banner(T('À toi !','Your turn!'),'',1)}else if(f.kind==='player')banner(`${T('Au tour de','Turn:')} ${f.name}`,'',1);F_.aiT=.5;break;
   case 'over':if(!F_.over){F_.over=true;setTimeout(endFight,1300)}break}}
  fightUI()}
 function floatAt(x,y,text,kind,extra=''){const p=cw(x,y);floats.push({x:p[0],y:p[1]+1.7,z:p[2],text:text+extra,kind,t:1.3})}
 function fightTick(){const S=fight.S,o=fight.online;F_.busy=Math.max(0,F_.busy-dt);
  // animation des déplacements (case par case, glissades pour les poussées et bonds)
  let moving=false;for(const f of S.f){const d=F_.disp.get(f.id);if(!d)continue;d.hit=Math.max(0,d.hit-dt);d.cast=Math.max(0,(d.cast||0)-dt);
   if(d.tx!=null){d.slide+=dt*5;const u=Math.min(1,d.slide);d.x=d.fx+(d.tx-d.fx)*u;d.y=d.fy+(d.ty-d.fy)*u;if(u>=1){d.tx=null}moving=true}
   else if(d.path.length){const [tx,ty]=d.path[0],dx=tx-d.x,dy=ty-d.y,dd=Math.hypot(dx,dy),sp=dt*4.2;d.yaw=Math.atan2(-dx,-dy);d.walk=(d.walk||0)+dt*10;if(dd<=sp){d.x=tx;d.y=ty;d.path.shift();SFX.step()}else{d.x+=dx/dd*sp;d.y+=dy/dd*sp}moving=true}}
  if(!F_.over&&!moving&&F_.busy<=0&&!F_.posting){const c=F.current(S);
   if(S.phase==='fight'&&c?.kind==='mob'){F_.aiT-=dt;if(F_.aiT<=0){F_.aiT=.35;const a=F.aiAction(S)||{a:'end'};if(!F.act(S,a))F.act(S,{a:'end'});afterAct()}}
   else if(F_.queue.length){F.act(S,F_.queue.shift());o.applied++;afterAct()}
   else if(F_.retry&&o&&o.recv===o.applied){const a=F_.retry;F_.retry=null;const me=meF();if(S.phase==='place'&&me&&!(a.a==='ready'&&me.ready))doAct(a)}   // envoi perdu dans un conflit : on renvoie
   else if(S.phase==='fight'&&c&&c.id===fight.me){F_.timer-=dt;if(F_.timer<=0){F_.timer=60;doAct({a:'end',id:c.id})}}
   else if(o&&S.phase==='fight'&&c?.kind==='player'&&(o.quiet||0)>65&&o.recv===o.applied){o.quiet=0;doAct({a:'end',id:c.id})}   // joueur absent
   else if(o&&S.phase==='place'&&fight.kind==='pve'&&!F_.went&&t-F_.t0>32&&fight.S.f[0]?.id===fight.me){F_.went=true;doAct({a:'go'})}}
  const ready=myTurnNow();if(ready!==F_.wasReady){F_.wasReady=ready;fightUI()}
  hud();fightHud()}
 function drawFight(){const S=fight.S,A=fight.A;if(A.dungeon)R.draw(M.dung[A.room]||(M.dung[A.room]=MD.dungeonMesh(R,A)),M4.id());else if(A.board){if(!fight.mesh)fight.mesh=MD.arenaMesh(R,A);R.draw(fight.mesh,M4.id())}else drawWorld(true);
  const me=meF(),mt=myTeam(),myTurn=myTurnNow();
  // grille : cases de placement, de déplacement, de portée et de zone
  const marks=new Map();const mark=(x,y,col,a)=>marks.set(x+','+y,[x,y,col,a]);
  for(let y=0;y<A.h;y++)for(let x=0;x<A.w;x++)if(S.grid[y*A.w+x]===0)mark(x,y,[1,1,1,1],.3);
  if(S.phase==='place'){for(const [x,y] of S.start[mt])mark(x,y,[.25,.55,1,1],.55);for(const [x,y] of S.start[1-mt])mark(x,y,[1,.3,.25,1],.45)}
  else if(myTurn&&F_.sel){const rc=F.rangeCells(S,me,F_.sel);for(const [x,y] of rc.blocked)mark(x,y,[.5,.5,.55,1],.4);for(const [x,y] of rc.ok)mark(x,y,[.3,.55,1,1],.45);
   if(F_.hover&&!F.canCast(S,me,F_.sel,F_.hover[0],F_.hover[1]))for(const [x,y] of F.zone(S,F.spellOf(me,F_.sel).aoe,F_.hover[0],F_.hover[1],me))mark(x,y,[1,.35,.2,1],.6)}
  else if(myTurn&&me.pm>0){const P2=F.paths(S,me);for(const [k,d] of P2.D)if(d>0){const [x,y]=k.split(',').map(Number);mark(x,y,[.3,.85,.35,1],.45)}}
  for(const tr of S.traps)if(tr.team===mt)mark(tr.x,tr.y,[.7,.3,.9,1],.6);
  for(const [x,y,col,a] of marks.values())R.draw(M.tile,M4.t(A.ox+x,cellY(x,y)+.02,A.oz+y),col,a);
  // combattants (case de couleur d'équipe, celui qui joue est surligné)
  const cur=F.current(S);for(const f of S.f){const d=F_.disp.get(f.id);if(!d||f.x<0)continue;if(!f.alive&&!d.dying){d.dying=1}if(d.dying){d.dying-=dt*1.2;if(d.dying<=0)continue}
   const ally=f.team===mt,x=A.ox+d.x+.5,z=A.oz+d.y+.5,y=cellY(Math.round(d.x),Math.round(d.y)),a=(f.invis&&!ally?0:f.invis?.45:1)*(d.dying?Math.max(0,d.dying):1),tint=d.hit>0?[1,1,1,d.hit*2]:null;
   R.draw(M.tile,M4.mul(M4.t(x-.45,y+.025,z-.45),M4.sc(.98,1,.98)),ally?[.25,.55,1,1]:[1,.3,.25,1],f===cur?.85:.45);if(a<=0)continue;
   if(f.kind==='mob')drawMob(f.mob,x,y+(d.cast?Math.sin(d.cast*9)*.15:0),z,d.yaw??0,a,tint);
   else{const w=d.path.length||d.tx!=null;MD.drawChar(R,M4,charParts(f.look||myLook()),M4.trs(x,y,z,d.yaw??(f.team?0:Math.PI),1.4),w?{legL:Math.sin(d.walk)*.7,legR:-Math.sin(d.walk)*.7,armL:-Math.sin(d.walk)*.5,armR:Math.sin(d.walk)*.5,bob:Math.abs(Math.sin(d.walk))*.05}:d.cast?{armR:1.6,armL:.4,lean:-.15}:{bob:Math.sin(t*2)*.01},tint&&[1,.4,.4,tint[3]],a)}}}

 // combattant fictif pour calculer la part d'XP des autres joueurs du groupe
 const pseudoChar=f=>({cls:f.cls,xp:D.xpFor(f.lvl),base:{wis:f.stats?.wis||0},eq:{}});
 const hashId=s=>{let h=0;for(const ch2 of String(s))h=(h*31+ch2.charCodeAt(0))|0;return h};
 function endFight(){if(!fight)return;if(fight.mesh){R.free(fight.mesh);fight.mesh=null}const S=fight.S,g=fight.g,me=meF(),mt=me?.team??0,won=S.winner===mt,pvp=fight.kind==='pvp';
  if(fight.online){NET.ignore.add(fight.online.id);online_.bwFightDone(fight.online.id).catch(()=>{})}
  if(pvp){const foe=S.f.find(f=>f.team!==mt);panel(`<div class="bw-result ${won?'win':'lose'}"><h2>${won?T('Duel gagné !','Duel won!'):T('Duel perdu…','Duel lost…')}</h2>
    <p>${won?T(`${esc(foe?.name)} mord la poussière. Tu peux frimer à Bagatown.`,`${esc(foe?.name)} bites the dust. You may now show off in Bagatown.`):T(`${esc(foe?.name)} t’a eu. Revanche ?`,`${esc(foe?.name)} got you. Rematch?`)}</p>
    <p class="bw-small">${T('Un duel ne fait rien perdre : tes PV reviennent comme avant.','A duel costs nothing: your HP is back to what it was.')}</p><button class="bw-b primary" data-close>${T('Continuer','Continue')}</button></div>`,'result');
   (won?SFX.win:SFX.lose)();fight=null;F_=null;mode='world';cam.x=P.x;cam.z=P.z;cam.dist=worldDist();zoneNow=null;fightUI();return}
  const humans=S.f.filter(f=>f.kind==='player'&&f.team===0),idx=Math.max(0,humans.findIndex(f=>f.id===fight.me));
  const r=C.rewards(S,humans.map(f=>({ch:f.id===fight.me?ch:pseudoChar(f)})),F.rng((fight.seed^0x5bd1^hashId(fight.me))>>>0))[idx]||{xp:0,kamas:0,drops:[]};
  ch.hp=won?Math.max(1,me?.hp||1):null;const dg=!!fight.init?.dungeon;if(dg&&won)ch.dungeons=(ch.dungeons||0)+1;
  let lv=null;if(won){lv=C.applyRewards(ch,r,S);if(g){g.dead=40;g.busy=false}SFX.win()}else{if(g)g.busy=false;SFX.lose()}
  if(!won){const ph=W.phoenix;P.x=ph.x;P.z=ph.z;ch.hp=Math.round(C.derived(ch).maxHp*.15)}
  store();const items=r.drops.reduce((m,i)=>(m[i]=(m[i]||0)+1,m),{});
  panel(`<div class="bw-result ${won?'win':'lose'}"><h2>${won?(dg?T('Grotte terminée !','Cave cleared!'):T('Victoire !','Victory!')):T('Défaite…','Defeat…')}</h2>
   ${won?`<p>${humans.length>1?T('Vous avez battu','You beat'):T('Tu as battu','You beat')} ${S.f.filter(f=>f.kind==='mob').map(f=>`${esc(nm(D.MOBS[f.mob]))} (${f.lvl})`).join(', ')}.</p>${humans.length>1?`<p class="bw-small">${T('Avec','With')} ${humans.filter(f=>f.id!==fight.me).map(f=>esc(f.name)).join(', ')}</p>`:''}
   <div class="bw-gains"><span>✨ +${r.xp} XP</span><span>🪙 +${r.kamas} kamas</span></div>
   ${Object.keys(items).length?`<div class="bw-drops">${Object.entries(items).map(([i,n])=>`<span title="${esc(nm(D.ITEMS[i]))}">${D.ITEMS[i].ic}<b>×${n}</b><small>${esc(nm(D.ITEMS[i]))}</small></span>`).join('')}</div>`:''}
   ${lv&&lv.after>lv.before?`<div class="bw-lvup">🎉 ${T('Niveau','Level')} ${lv.after} ! +${(lv.after-lv.before)*C.POINTS_PER_LVL} ${T('points de caractéristiques','characteristic points')}${lv.newSpells.length?`<br>${T('Nouveaux sorts','New spells')} : ${lv.newSpells.map(id=>D.SPELLS[id].ic+' '+nm(D.SPELLS[id])).join(', ')}`:''}</div>`:''}`
   :`<p>${T('Tu te réveilles près de la statue du Bagaphénix, un peu froissé·e.','You wake up by the Bagaphoenix statue, a little crumpled.')}</p>`}
   <button class="bw-b primary" data-close>${T('Continuer','Continue')}</button></div>`,'result');
  if(lv&&lv.after>lv.before){setTimeout(SFX.level,600);burst(P.x,P.y+1,P.z,'#ffd23f',30,2.5,4)}
  fight=null;F_=null;mode='world';cam.x=P.x;cam.z=P.z;cam.dist=worldDist();zoneNow=null;fightUI();
  c.collect?.(won?Math.round(r.kamas/4):0)}

 // ================= INTERFACE =================
 function toastMsg(s,kind=''){const el=ui.querySelector('.bw-toast');if(!el)return;el.textContent=s;el.className='bw-toast show '+kind;clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),2400)}
 function banner(a,b='',dur=2.2){const el=ui.querySelector('.bw-banner');if(!el)return;el.innerHTML=`<b>${esc(a)}</b>${b?`<small>${esc(b)}</small>`:''}`;el.classList.remove('show');void el.offsetWidth;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),dur*1000)}
 function frame(){ui.innerHTML=`<div class="bw-top"><button class="bw-me"><span class="bw-ic">${D.CLASSES[ch.cls].ic}</span><span class="bw-nm"><b>${esc(ch.name)}</b><small></small></span></button>
   <div class="bw-bars"><div class="bw-hp"><i></i><span></span></div><div class="bw-xp"><i></i></div></div><div class="bw-kamas">🪙 <b></b></div></div>
   <div class="bw-zone"></div><div class="bw-net-ic" hidden></div><div class="bw-labels"></div><div class="bw-floats"></div><div class="bw-banner"></div><div class="bw-toast"></div>
   <div class="bw-fight" hidden><div class="bw-timeline"></div><div class="bw-fbot"><div class="bw-turn"><span class="bw-pa"></span><span class="bw-pm"></span><span class="bw-timer"></span></div><div class="bw-spells"></div><button class="bw-end">${T('Fin du tour','End turn')}</button><button class="bw-ready">${T('Prêt !','Ready!')}</button></div></div>
   <div class="bw-menu"><button data-p="bag">🎒<em>${T('Sac','Bag')}</em></button><button data-p="stats">⭐<em>${T('Carac.','Stats')}</em></button><button data-p="spells">✨<em>${T('Sorts','Spells')}</em></button><button data-p="quests">📜<em>${T('Quêtes','Quests')}</em></button><button data-p="map">🗺️<em>${T('Carte','Map')}</em></button><button data-p="chat" class="bw-net">💬<em>${T('Chat','Chat')}</em></button><button data-p="group" class="bw-net">👥<em>${T('Groupe','Group')}</em></button><button data-p="online" class="bw-off">🌐<em>${T('En ligne','Online')}</em></button><button data-p="sit">🪑<em>${T('Assis','Sit')}</em></button></div>
   <div class="bw-feed"></div><div class="bw-joinbar" hidden></div>
   <div class="bw-panel" hidden></div>`;
  ui.querySelectorAll('.bw-menu [data-p]').forEach(b=>c.listen(b,'click',()=>{SFX.click();const p=b.dataset.p;if(p==='sit'){if(mode==='world'){P.sit=!P.sit;P.path=[];toastMsg(P.sit?T('Tu t’assois. Les PV remontent plus vite.','You sit down. HP regenerates faster.'):T('Debout !','Up!'))}return}
   if(p==='online'){goOnline();return}openPanel(p)}));netMenu();
  c.listen(ui.querySelector('.bw-me'),'click',()=>openPanel('stats'));
  c.listen(ui.querySelector('.bw-end'),'click',()=>{if(fight&&myTurnNow()){F_.sel=null;doAct({a:'end',id:fight.me})}});
  c.listen(ui.querySelector('.bw-ready'),'click',()=>{const me=meF();if(fight&&fight.S.phase==='place'&&me&&!me.ready){doAct({a:'ready',id:me.id});SFX.click()}})}
 function hud(){if(!ch)return;const d=C.derived(ch),hp=mode==='fight'&&fight&&meF()?meF().hp:(ch.hp??d.maxHp),mx=d.maxHp;
  const q=s=>ui.querySelector(s);if(!q('.bw-hp'))return;q('.bw-hp i').style.width=(100*hp/mx).toFixed(1)+'%';q('.bw-hp span').textContent=`${hp} / ${mx}`;
  const L=d.lvl,x0=D.xpFor(L),x1=D.xpFor(L+1);q('.bw-xp i').style.width=L>=D.MAX_LVL?'100%':(100*(ch.xp-x0)/Math.max(1,x1-x0)).toFixed(1)+'%';
  q('.bw-nm small').textContent=`${nm(D.CLASSES[ch.cls])} · ${T('niv.','lvl')} ${L}${ch.points?` · ⭐${ch.points}`:''}`;q('.bw-kamas b').textContent=ch.kamas;
  q('.bw-zone').textContent=zoneNow?`${nm(D.ZONES[zoneNow])}${D.ZONES[zoneNow].lvl!=='—'?` · ${D.ZONES[zoneNow].lvl}`:''}`:'';
  q('.bw-menu').hidden=mode==='fight';
  // étiquettes au-dessus des groupes de monstres proches et des PNJ, textes flottants
  if(mode==='world'){let html='';for(const g of groups){if(g.dead>0||g.busy||g.remote)continue;const dd=Math.hypot(g.x-P.x,g.z-P.z);if(dd>11)continue;const s=scr(g.x,WW.tileH(W,g.x,g.z)*BH+1.5,g.z);if(!s)continue;
     const lvl=WW.groupLevel(g),danger=lvl>L*1.8?'hard':lvl>L*1.1?'mid':'easy';html+=`<span class="bw-lab ${danger}" style="transform:translate(${s[0].toFixed(0)}px,${s[1].toFixed(0)}px)">${g.aggro?'😡 ':''}${esc(nm(D.MOBS[g.members[0][0]]))}${g.members.length>1?` +${g.members.length-1}`:''} · ${lvl}</span>`}
    html+=netLabels(L);
    for(const n of W.npcs){if(Math.hypot(n.x-P.x,n.z-P.z)>9)continue;const s=scr(n.x,WW.tileH(W,n.x,n.z)*BH+2.1,n.z);if(!s)continue;const qm=questMark(n.id);html+=`<span class="bw-lab npc" style="transform:translate(${s[0].toFixed(0)}px,${s[1].toFixed(0)}px)">${qm}${esc(nm(D.NPCS[n.id]))}</span>`}
    q('.bw-labels').innerHTML=html}else if(mode==='fight'&&fight&&F_){let html='';for(const f of fight.S.f){if(!f.alive||(f.invis&&f.team!==myTeam()))continue;const d=F_.disp.get(f.id);if(!d)continue;const p=cw(Math.round(d.x),Math.round(d.y)),s=scr(fight.A.ox+d.x+.5,p[1]+(f.kind==='mob'?1.1*(MD.MOB_SCALE[f.mob]||1):1.45),fight.A.oz+d.y+.5);if(!s)continue;
     html+=`<span class="bw-lab hpb ${f.team!==myTeam()?'red':'blue'}${f.id===fight.me?' me':''}" style="transform:translate(${s[0].toFixed(0)}px,${s[1].toFixed(0)}px)"><i style="width:${(100*f.hp/f.maxHp).toFixed(0)}%"></i>${f.kind==='player'&&f.id!==fight.me?esc(f.name)+' · ':''}${f.hp}</span>`}q('.bw-labels').innerHTML=html}else q('.bw-labels').innerHTML='';
  let fh='';for(const f of floats){f.t-=dt;const s=scr(f.x,f.y+(1.3-f.t)*.8,f.z);if(!s||f.t<=0)continue;fh+=`<span class="bw-float ${f.kind}" style="transform:translate(${s[0].toFixed(0)}px,${s[1].toFixed(0)}px);opacity:${Math.min(1,f.t*2).toFixed(2)}">${esc(f.text)}</span>`}
  for(let i=floats.length-1;i>=0;i--)if(floats[i].t<=0)floats.splice(i,1);q('.bw-floats').innerHTML=fh}
 const questMark=npc=>{for(const qid in D.QUESTS){if(D.QUESTS[qid].giver!==npc)continue;const s=C.questState(ch,qid);if(s==='ready')return '❓ ';if(s==='available')return '❗ '}return ''};
 function fightUI(){const box=ui.querySelector('.bw-fight');if(!box)return;box.hidden=!fight;if(!fight)return;const S=fight.S,me=meF();if(!me)return;const mt=me.team;
  box.querySelector('.bw-ready').hidden=S.phase!=='place';box.querySelector('.bw-ready').disabled=!!me.ready;box.querySelector('.bw-ready').textContent=me.ready?T('En attente…','Waiting…'):T('Prêt !','Ready!');box.querySelector('.bw-end').hidden=S.phase!=='fight';
  box.querySelector('.bw-timeline').innerHTML=(S.phase==='place'?S.f.filter(f=>f.alive):S.order.map(id=>S.f.find(f=>f.id===id))).map(f=>`<span class="bw-tl ${f.team!==mt?'red':'blue'}${f===F.current(S)?' cur':''}${f.alive?'':' dead'}" data-id="${f.id}">${f.kind==='mob'?mobIcon(f.mob):D.CLASSES[f.cls].ic}${f.kind==='player'&&f.ready&&S.phase==='place'?'<u>✓</u>':''}<i style="width:${(100*f.hp/f.maxHp).toFixed(0)}%"></i></span>`).join('');
  box.querySelectorAll('.bw-tl').forEach(el=>c.listen(el,'click',()=>showFighter(S.f.find(f=>f.id===el.dataset.id))));
  const list=[...me.spells,...(me.weapon?['weapon']:[])];
  box.querySelector('.bw-spells').innerHTML=list.map(id=>{const sp=F.spellOf(me,id),cd=me.cds[id]||0,used=sp.perTurn&&(me.uses[id]||0)>=sp.perTurn,off=S.phase!=='fight'||F.current(S)!==me||sp.pa>me.pa||cd>0||used;
   return `<button class="bw-sp${F_.sel===id?' on':''}${off?' off':''}" data-s="${id}"><span>${sp.ic}</span><b>${sp.pa}</b>${cd>0?`<i>${cd}</i>`:sp.perTurn>1?`<em>${Math.max(0,sp.perTurn-(me.uses[id]||0))}</em>`:''}</button>`}).join('');
  box.querySelectorAll('.bw-sp').forEach(b=>{let lp=null;c.listen(b,'pointerdown',()=>{lp=setTimeout(()=>{lp=null;spellInfo(b.dataset.s,me)},500)});
   c.listen(b,'pointerup',()=>{if(!lp)return;clearTimeout(lp);lp=null;const id=b.dataset.s;if(b.classList.contains('off')){spellInfo(id,me);return}F_.sel=F_.sel===id?null:id;SFX.click();fightUI()})})}
 const mobIcon=id=>({moutoufou:'🐑',poultoss:'🐤',vermichelle:'🐛',crabouillon:'🦀',champi:'🍄',moustikouille:'🦟',sanglier:'🐗',araknee:'🕷️',moutonroyal:'👑'})[id]||'👾';
 function fightHud(){const box=ui.querySelector('.bw-fight');if(!box||!fight)return;const S=fight.S,me=meF();if(!me)return;
  box.querySelector('.bw-pa').textContent=`⭐ ${me.pa} ${T('PA','AP')}`;const minPa=Math.min(99,...[...me.spells,...(me.weapon?['weapon']:[])].map(id=>{const sp=F.spellOf(me,id);return sp&&!(me.cds[id]>0)&&!(sp.perTurn&&(me.uses[id]||0)>=sp.perTurn)?sp.pa:99}));box.querySelector('.bw-end').classList.toggle('pulse',myTurnNow()&&me.pm===0&&me.pa<minPa);box.querySelector('.bw-pm').textContent=`👟 ${me.pm} ${T('PM','MP')}`;
  const c2=F.current(S);box.querySelector('.bw-timer').textContent=S.phase==='place'?(fight.online&&fight.kind==='pve'?`${T('Placement','Placement')} · ${Math.max(0,Math.ceil(32-(t-F_.t0)))}`:T('Placement','Placement')):c2===me?`⏱ ${Math.ceil(F_.timer)}`:`${T('Tour de','Turn:')} ${esc(c2?fname(c2):'')}`;
  if(!fightHud.n||fightHud.n++%10===0){fightHud.n=1;const tl=[...box.querySelectorAll('.bw-tl')];tl.forEach(el=>{const f=S.f.find(o=>o.id===el.dataset.id);if(!f)return;el.querySelector('i').style.width=(100*f.hp/f.maxHp).toFixed(0)+'%';el.classList.toggle('cur',f===c2);el.classList.toggle('dead',!f.alive)})}}
 function showFighter(f){if(!f)return;const isMob=f.kind==='mob',M2=isMob?D.MOBS[f.mob]:null,ally=fight&&f.team===myTeam();
  const list=[...f.spells,...(f.weapon?['weapon']:[])].map(id=>[id,F.spellOf(f,id)]).filter(([,sp])=>sp);
  const card=panel(`<h3>${isMob?mobIcon(f.mob):D.CLASSES[f.cls].ic} ${esc(isMob?nm(M2):f.name)} <small>${isMob?'':nm(D.CLASSES[f.cls])+' · '}${T('niv.','lvl')} ${f.lvl}${f.boss?' · 👑 boss':''}</small></h3>
   <div class="bw-fhp ${ally?'ally':'foe'}"><i style="width:${(100*f.hp/f.maxHp).toFixed(0)}%"></i><span>❤️ ${f.hp} / ${f.maxHp}</span></div>${isMob?`<p class="bw-flav">${esc(X(M2.d))}</p>`:''}
   <div class="bw-kv"><span>⭐ ${f.pa0} PA</span><span>👟 ${f.pm0} PM</span><span>⚡ ${f.init} init.</span>${Object.entries(f.res).filter(([,v])=>v).map(([e,v])=>`<span class="${v>0?'':'bw-red'}">${D.EL[e].ic} ${v>0?'+':''}${v}%</span>`).join('')}</div>
   ${f.buffs.length?`<p class="bw-small">${T('Effets','Effects')} : ${f.buffs.map(b=>b.dot?`☠️ ${b.v}/${T('tour','turn')} (${b.dur})`:b.hot?`🌿 +${b.v}/${T('tour','turn')} (${b.dur})`:`${b.v>0?'+':''}${b.v} ${nm(D.STATS[b.stat])} (${b.dur})`).join(' · ')}</p>`:''}${f.invis?`<p class="bw-small">👻 ${T('Invisible','Invisible')} (${f.invis})</p>`:''}
   <div class="bw-fsp">${list.map(([id,sp])=>{const [a,b]=F.spellRange(f,sp);return `<button data-s="${id}"><span>${sp.ic}</span><b>${esc(nm(sp))}</b><small>${sp.pa} PA · 🎯 ${a}-${b}${sp.perTurn?` · ${sp.perTurn}/${T('tour','turn')}`:''}</small><em>${sp.fx.map(e=>fxText(e,f)).filter(Boolean).join(' · ')}</em></button>`}).join('')}</div>
   <button class="bw-b" data-close>${T('Fermer','Close')}</button>`,'fighter');
  card.querySelectorAll('[data-s]').forEach(b=>c.listen(b,'click',()=>spellInfo(b.dataset.s,f,()=>showFighter(f))))}
 function spellInfo(id,f,back){const sp=F.spellOf(f,id),[a,b]=F.spellRange(f,sp);
  panel(`<h3>${sp.ic} ${esc(nm(sp))}</h3>${sp.d?`<p class="bw-flav">${esc(X(sp.d))}</p>`:''}<div class="bw-kv"><span>⭐ ${sp.pa} PA</span><span>🎯 ${a}-${b}</span>${sp.line?`<span>➖ ${T('en ligne','in line')}</span>`:''}${sp.los?`<span>👁️ ${T('ligne de vue','line of sight')}</span>`:''}${sp.cd?`<span>⏳ ${sp.cd} ${T('tours','turns')}</span>`:''}${sp.perTurn?`<span>🔁 ${sp.perTurn}/${T('tour','turn')}</span>`:''}</div>
   <ul class="bw-fx">${sp.fx.map(e=>fxText(e,f)).filter(Boolean).map(s=>`<li>${s}</li>`).join('')}</ul>${sp.aoe?`<p class="bw-small">💥 ${T('Zone','Area')} : ${({cross:T('croix','cross'),circle:T('cercle','circle'),line:T('ligne','line'),ring:T('anneau','ring'),cell:T('case','cell')})[sp.aoe.s]||sp.aoe.s} ${sp.aoe.r||''}</p>`:''}
   ${sp.lvl&&ch&&!sp.mob&&C.level(ch)<sp.lvl?`<p class="bw-small bw-red">🔒 ${T('Débloqué au niveau','Unlocked at level')} ${sp.lvl}</p>`:''}<div class="bw-btns">${back?`<button class="bw-b" data-back>${T('Retour','Back')}</button>`:''}<button class="bw-b" data-close>${T('Fermer','Close')}</button></div>`,'spell');
  if(back)c.listen(ui.querySelector('.bw-panel [data-back]'),'click',back)}
 function fxText(e,f){const k=f?F.rank(f):1,r=(a,b)=>`${Math.round(a*k)}-${Math.round(b*k)}`;switch(e.t){case 'dmg':return `${D.EL[e.el].ic} ${r(e.min,e.max)} ${T('dégâts','damage')} ${nm(D.EL[e.el])}`;case 'heal':return `💚 ${T('soigne','heals')} ${r(e.min,e.max)}`;
  case 'push':return `💨 ${T('repousse de','pushes')} ${e.n}`;case 'tp':return `🦘 ${T('téléporte sur la case','teleports to the cell')}`;case 'dmgAround':return `${D.EL[e.el].ic} ${r(e.min,e.max)} ${T('autour de l’arrivée','around landing')}`;
  case 'buff':return `⬆️ +${e.v} ${nm(D.STATS[e.stat])} (${e.dur} ${T('tours','turns')})`;case 'debuff':return `⬇️ −${e.v} ${nm(D.STATS[e.stat])} (${e.dur} ${T('tour(s)','turn(s)')})`;
  case 'poison':return `☠️ ${e.v} × ${e.dur} ${T('tours','turns')}`;case 'hot':return `🌿 +${e.v} × ${e.dur} ${T('tours','turns')}`;case 'invis':return `👻 ${T('invisible','invisible')} ${e.dur} ${T('tours','turns')}`;
  case 'trap':return `🪤 ${T('piège','trap')} : ${e.fx.map(q=>fxText(q,f)).join(', ')}`;default:return ''}}

 // ---- panneaux
 const FULL=new Set(['bag','stats','jobs','spells','quests','map','craft','fighter','spell']);
 function panel(html,cls=''){const el=ui.querySelector('.bw-panel');el.className='bw-panel '+cls+(FULL.has(cls)?' full':'');el.innerHTML=`<div class="bw-card">${html}</div>`;el.hidden=false;panelOpen=cls||'panel';
  el.querySelectorAll('[data-close]').forEach(b=>c.listen(b,'click',closePanel));c.listen(el,'click',e=>{if(e.target===el)closePanel()});return el.querySelector('.bw-card')}
 function closePanel(){const el=ui.querySelector('.bw-panel');if(el){el.hidden=true;el.innerHTML=''}panelOpen=null;dialogOpen=false;hud();setTimeout(nextInvite,50)}
 function openPanel(p){({bag,stats,spells,quests,map,chat:chatPanel,group:groupPanel})[p]?.()}
 function itemLine(id,n){const it=D.ITEMS[id];return `<button class="bw-it" data-i="${id}"><span>${it.ic}</span><b>${esc(nm(it))}</b>${n>1?`<i>×${n}</i>`:''}</button>`}
 function bag(){const eqHtml=D.SLOTS.map(s=>{const id=ch.eq[s];return `<button class="bw-slot" data-s="${s}">${id?D.ITEMS[id].ic:'·'}<small>${X(D.SLOT_FR[s])}</small></button>`}).join('');
  const inv=Object.entries(ch.inv).sort(([a],[b])=>(D.ITEMS[a].slot?0:D.ITEMS[a].use?1:2)-(D.ITEMS[b].slot?0:D.ITEMS[b].use?1:2));
  const card=panel(`<h3>🎒 ${T('Sac','Bag')} <small>🪙 ${ch.kamas}</small></h3><div class="bw-eq">${eqHtml}</div><div class="bw-inv">${inv.length?inv.map(([id,n])=>itemLine(id,n)).join(''):`<p>${T('Ton sac est vide.','Your bag is empty.')}</p>`}</div><button class="bw-b" data-close>${T('Fermer','Close')}</button>`,'bag');
  card.querySelectorAll('.bw-it').forEach(b=>c.listen(b,'click',()=>itemPanel(b.dataset.i)));card.querySelectorAll('.bw-slot').forEach(b=>c.listen(b,'click',()=>{const id=ch.eq[b.dataset.s];if(id)itemPanel(id,true)}))}
 function statLines(st){return Object.entries(st||{}).map(([k,v])=>`<span>${D.STATS[k].ic} ${v>0?'+':''}${v} ${nm(D.STATS[k])}</span>`).join('')}
 function itemPanel(id,worn=false){const it=D.ITEMS[id],L=C.level(ch);
  const card=panel(`<h3>${it.ic} ${esc(nm(it))}</h3><p class="bw-flav">${esc(X(it.d))}</p>${it.slot?`<p>${X(D.SLOT_FR[it.slot])} · ${T('niveau','level')} ${it.lvl}${it.lvl>L?` <b class="bw-red">(${T('trop haut','too high')})</b>`:''}</p><div class="bw-kv">${statLines(it.stats)}</div>${it.weapon?`<p>⚔️ ${it.weapon.pa} PA · ${D.EL[it.weapon.el].ic} ${it.weapon.min}-${it.weapon.max} · 🎯 ${it.weapon.range.join('-')}</p>`:''}`:''}
   ${it.use?`<p>💚 ${T('Rend','Restores')} ${it.use.heal} PV</p>`:''}${setInfo(it)}<p class="bw-small">${T('Revente','Sells for')} : 🪙 ${Math.max(1,Math.floor(it.price*.4))}</p>
   <div class="bw-btns">${worn?`<button class="bw-b" data-a="unequip">${T('Retirer','Unequip')}</button>`:it.slot?`<button class="bw-b primary" data-a="equip" ${C.canEquip(ch,id)?'':'disabled'}>${T('Équiper','Equip')}</button>`:''}${it.use&&!worn?`<button class="bw-b primary" data-a="use">${T('Utiliser','Use')}</button>`:''}<button class="bw-b" data-a="back">${T('Retour','Back')}</button></div>`);
  card.querySelectorAll('[data-a]').forEach(b=>c.listen(b,'click',()=>{const a=b.dataset.a;if(a==='equip'&&C.equip(ch,id)){SFX.buff();toastMsg(T('Équipé !','Equipped!'),'good')}if(a==='unequip')C.unequip(ch,it.slot);
   if(a==='use'){const got=C.useItem(ch,id);SFX.heal();toastMsg(`+${got} PV`,'good')}store();bag()}))}
 function stats(){const d=C.derived(ch);
  const card=panel(`<h3>⭐ ${esc(ch.name)} <small>${nm(D.CLASSES[ch.cls])} · ${T('niveau','level')} ${d.lvl}</small></h3><div class="bw-tabs"><button class="on">${T('Caractéristiques','Characteristics')}</button><button data-tab="jobs">${T('Métiers','Jobs')}</button></div><p class="bw-small">${T('Points à répartir','Points to spend')} : <b>${ch.points}</b> · ${T('la Sagesse coûte 3 points','Wisdom costs 3 points')}</p>
   <div class="bw-stats">${['vit','wis','str','int','cha','agi'].map(k=>`<div><span>${D.STATS[k].ic} ${nm(D.STATS[k])}</span><b>${d.stats[k]??d.vit}</b><small>${ch.base[k]?`(${ch.base[k]} ${T('investis','spent')})`:''}</small><button data-k="${k}" ${ch.points>=C.COST[k]?'':'disabled'}>+</button><button data-k10="${k}" ${ch.points>=C.COST[k]*10?'':'disabled'}>+10</button></div>`).join('')}</div>
   <div class="bw-kv"><span>❤️ ${d.maxHp} PV</span><span>⭐ ${d.pa} PA</span><span>👟 ${d.pm} PM</span><span>⚡ ${d.init} init.</span>${d.range?`<span>🎯 +${d.range}</span>`:''}</div>
   <p class="bw-small">${T('Force : Terre · Intelligence : Feu et soins · Chance : Eau · Agilité : Air, fuite et tacle · Sagesse : XP et butin.','Strength: Earth · Intelligence: Fire and heals · Chance: Water · Agility: Air, escape and tackle · Wisdom: XP and drops.')}</p>
   <button class="bw-b" data-close>${T('Fermer','Close')}</button>`,'stats');
  card.querySelectorAll('[data-k],[data-k10]').forEach(b=>c.listen(b,'click',()=>{const k=b.dataset.k||b.dataset.k10;if(C.spend(ch,k,b.dataset.k10?10:1)){SFX.click();store();stats()}}));c.listen(card.querySelector('[data-tab]'),'click',jobsPanel)}
 function spells(){const L=C.level(ch);const card=panel(`<h3>✨ ${T('Sorts','Spells')} <small>${nm(D.CLASSES[ch.cls])}</small></h3><div class="bw-splist">${D.classSpells(ch.cls).map(id=>{const sp=D.SPELLS[id],ok=sp.lvl<=L;
   return `<button class="bw-spl${ok?'':' lock'}" data-s="${id}"><span>${sp.ic}</span><b>${esc(nm(sp))}</b><small>${ok?`${sp.pa} PA · ${sp.range.join('-')} ${T('PO','range')}`:`${T('niveau','level')} ${sp.lvl}`}</small></button>`}).join('')}</div><button class="bw-b" data-close>${T('Fermer','Close')}</button>`,'spells');
  card.querySelectorAll('.bw-spl').forEach(b=>c.listen(b,'click',()=>spellInfo(b.dataset.s,C.fighterOf(ch,'x'),spells)))}
 function quests(){const rows=Object.entries(D.QUESTS).map(([id,q])=>{const s=C.questState(ch,id);if(s==='locked')return '';const prog=ch.quests[id];
   return `<div class="bw-q ${s}"><b>${s==='done'?'✅':s==='ready'?'❓':s==='active'?'📜':'❗'} ${esc(nm(q))}</b><small>${esc(nm(D.NPCS[q.giver]))}</small>${s==='active'||s==='ready'?`<p>${[...Object.entries(q.kill||{}).map(([m,n])=>`${mobIcon(m)} ${esc(nm(D.MOBS[m]))} ${Math.min(n,prog[m]||0)}/${n}`),...Object.entries(q.bring||{}).map(([i,n])=>`${D.ITEMS[i].ic} ${esc(nm(D.ITEMS[i]))} ${Math.min(n,ch.inv[i]||0)}/${n}`)].join(' · ')}</p>`:s==='available'?`<p class="bw-small">${T('À demander à','Ask')} ${esc(nm(D.NPCS[q.giver]))}</p>`:''}</div>`}).join('');
  panel(`<h3>📜 ${T('Quêtes','Quests')}</h3><div class="bw-qs">${rows}</div><button class="bw-b" data-close>${T('Fermer','Close')}</button>`,'quests')}
 // carte du monde : points d'intérêt ; toucher = nom, toucher deux fois = y aller à pied
 function pois(){const out=[],npcIc=id=>{const n=D.NPCS[id];const m=questMark(id).trim();return m||(n.job?D.JOBS[n.job].ic:n.shop?'🛒':n.reset?'🎓':'💬')};
  for(const zp of W.zaaps)out.push({x:zp.x,z:zp.z,ic:disc.has(zp.id)?'🌀':'🔒',label:'Bagaap · '+nm(D.ZONES[zp.id]),goal:{k:'zaap',o:zp,x:zp.x,z:zp.z}});
  for(const n of W.npcs){const N=D.NPCS[n.id];out.push({x:n.x,z:n.z,ic:npcIc(n.id),label:nm(N)+(N.job?` · ${nm(D.JOBS[N.job])}`:N.shop?` · ${T('boutique','shop')}`:''),goal:{k:'npc',o:n,x:n.x,z:n.z},quest:/[❗❓]/.test(npcIc(n.id))})}
  out.push({x:W.cave.x,z:W.cave.z,ic:'🍄',label:`${T('Donjon','Dungeon')} · ${nm(D.DUNGEON)} (${D.DUNGEON.lvl})`,goal:{k:'cave',o:W.cave,x:W.cave.x,z:W.cave.z-1.4}});
  out.push({x:W.throne.x,z:W.throne.z,ic:'👑',label:T('Trône du Mouton Royal (boss 20)','Royal Sheep’s Throne (boss 20)'),goal:null});
  out.push({x:W.phoenix.x,z:W.phoenix.z,ic:'🔥',label:T('Statue du Bagaphénix (réveil après une défaite)','Bagaphoenix statue (respawn)'),goal:null});
  for(const m of NET.group)if(m.id!==NET.pub&&m.online)out.push({x:m.x,z:m.z,ic:'👥',label:m.cname||m.name,goal:null});
  return out}
 function map(){const card=panel(`<h3>🗺️ ${T('Carte du monde','World map')}</h3><div class="bw-mapwrap"><canvas class="bw-map" width="448" height="448"></canvas></div>
   <div class="bw-mapinfo">${T('Touche un lieu pour son nom, touche deux fois pour y aller à pied.','Tap a place for its name, double-tap to walk there.')}</div>
   <div class="bw-legend">${Object.entries(D.ZONES).map(([k,z])=>`<span>${esc(nm(z))}${z.lvl!=='—'?` <b>${z.lvl}</b>`:''}</span>`).join('')}</div>
   <div class="bw-legend">❗ ${T('quête à prendre','quest to take')} · ❓ ${T('quête à rendre','quest to hand in')} · 🌀 Bagaap · 🍄 ${T('donjon','dungeon')} · 🛒 ${T('boutique','shop')} · 🪓⛏️🌿🎣 ${T('métiers','jobs')}</div>
   <button class="bw-b" data-close>${T('Fermer','Close')}</button>`,'map');
  const cvm=card.querySelector('canvas'),x=cvm.getContext('2d'),N=W.N,s=448/N,col={0:'#7cc45a',1:'#4f8f45',2:'#ecd9a0',3:'#3f97d8',4:'#c9a36a',5:'#c9c3b6',6:'#8fd06a',7:'#9a6b3e',8:'#8ab069'};
  const list=pois();let sel=null,lastTap=0;
  const draw=()=>{for(let z=0;z<N;z++)for(let xx=0;xx<N;xx++){const k=z*N+xx,pr=W.prop[k];x.fillStyle=pr===WW.P.wall?'#8a5e35':[WW.P.tree,WW.P.pine,WW.P.palm,WW.P.shroom].includes(pr)?'#3b7a35':pr===WW.P.rock?'#9a9a9a':col[W.type[k]];x.fillRect(xx*s,z*s,s+.5,s+.5)}
   x.font='15px sans-serif';x.textAlign='center';x.textBaseline='middle';
   for(const o of NET.others.values()){x.fillStyle=o.d.mate?'#3fdc6a':'#ffffff';x.beginPath();x.arc(o.x*s,o.z*s,4,0,7);x.fill()}
   for(const p of list){x.fillStyle='rgba(255,255,255,.85)';x.beginPath();x.arc(p.x*s,p.z*s,p===sel?13:10,0,7);x.fill();if(p===sel){x.strokeStyle='#e2453c';x.lineWidth=2.5;x.stroke()}x.fillText(p.ic,p.x*s,p.z*s+1)}
   x.fillStyle='#e2453c';x.beginPath();x.arc(P.x*s,P.z*s,6,0,7);x.fill();x.strokeStyle='#fff';x.lineWidth=2.5;x.stroke();
   if(P.path.length){x.strokeStyle='rgba(226,69,60,.8)';x.setLineDash([4,4]);x.beginPath();x.moveTo(P.x*s,P.z*s);for(const [a,b2] of P.path)x.lineTo(a*s,b2*s);x.stroke();x.setLineDash([])}};
  draw();const info=card.querySelector('.bw-mapinfo');
  c.listen(cvm,'click',e=>{const r=cvm.getBoundingClientRect(),mx=(e.clientX-r.left)/r.width*N,mz=(e.clientY-r.top)/r.height*N;let best=null;for(const p of list){const d=Math.hypot(p.x-mx,p.z-mz);if(d<4.5&&(!best||d<best.d))best={p,d}}
   const now=performance.now(),dbl=now-lastTap<380;lastTap=now;sel=best?.p||null;draw();
   if(dbl){const tgt=sel?(sel.goal||{x:sel.x,z:sel.z}):{x:mx,z:mz};closePanel();if(mode!=='world')return;P.sit=false;goTo(tgt.x,tgt.z,sel?.goal||null);if(P.path.length){toastMsg(T('En route !','On my way!'),'good');SFX.click()}return}
   info.textContent=sel?sel.label:T('Touche deux fois pour aller ici.','Double-tap to walk here.')})}
 function groupCard(g){const L=C.level(ch),lvl=WW.groupLevel(g),danger=lvl>L*1.8?'hard':lvl>L*1.1?'mid':'easy';
  const card=panel(`<h3>${g.aggro?'😡 ':''}${T('Groupe de monstres','Monster group')} <small>${T('niveau total','total level')} <b class="bw-${danger}">${lvl}</b></small></h3>
   <div class="bw-glist">${g.members.map(([id,l])=>{const M2=D.MOBS[id];return `<div><span>${mobIcon(id)}</span><b>${esc(nm(M2))}</b><small>${T('niv.','lvl')} ${l} · ❤️ ${M2.hp0+M2.hp*l} · ⭐ ${M2.pa} · 👟 ${M2.pm}${Object.entries(M2.res).filter(([,v])=>v).map(([e,v])=>` · ${D.EL[e].ic}${v>0?'+':''}${v}%`).join('')}</small></div>`}).join('')}</div>
   <p class="bw-small">${danger==='hard'?T('Très dangereux pour ton niveau. Viens en groupe.','Very dangerous for your level. Bring a group.'):danger==='mid'?T('Costaud. Prépare des potions.','Tough. Bring potions.'):T('Ça devrait aller.','Should be fine.')}</p>
   <div class="bw-btns"><button class="bw-b primary" data-atk>⚔️ ${T('Attaquer','Attack')}</button><button class="bw-b" data-close>${T('Fermer','Close')}</button></div>`,'group-mob');
  c.listen(card.querySelector('[data-atk]'),'click',()=>{closePanel();goTo(g.x,g.z,{k:'mob',o:g,x:g.x,z:g.z})})}
 function zaapPanel(zp){const list=W.zaaps.filter(z=>z.id!==zp.id);const card=panel(`<h3>🌀 Bagaap · ${esc(nm(D.ZONES[zp.id]))}</h3><p class="bw-small">${T('Voyage instantané vers un Bagaap déjà découvert. 10 kamas (gratuit vers Bagatown).','Instant travel to a Bagaap you already found. 10 kamas (free to Bagatown).')}</p>
   <div class="bw-zlist">${list.map(z=>`<button class="bw-b" data-z="${z.id}" ${disc.has(z.id)?'':'disabled'}>${disc.has(z.id)?'🌀':'🔒'} ${esc(nm(D.ZONES[z.id]))} <small>${D.ZONES[z.id].lvl}</small></button>`).join('')}</div><button class="bw-b" data-close>${T('Fermer','Close')}</button>`);
  card.querySelectorAll('[data-z]').forEach(b=>c.listen(b,'click',()=>{const z=W.zaaps.find(q=>q.id===b.dataset.z),cost=z.id==='town'?0:10;if(ch.kamas<cost){toastMsg(T('Pas assez de kamas','Not enough kamas'));return}
   ch.kamas-=cost;P.x=z.x;P.z=z.z+.6;P.path=[];cam.x=P.x;cam.z=P.z;SFX.zap();burst(P.x,P.y+1,P.z,'#c9b8ff',30,2,3);closePanel();store()}))}
 // ---- PNJ : dialogue, boutique, quêtes
 function talk(id){const n=D.NPCS[id];dialogOpen=true;const line=X(n.lines[Math.floor(Math.random()*n.lines.length)]);
  const qs=Object.entries(D.QUESTS).filter(([,q])=>q.giver===id).map(([qid,q])=>({qid,q,s:C.questState(ch,qid)})).filter(o=>o.s!=='locked'&&o.s!=='done');
  const card=panel(`<h3>${esc(nm(n))}</h3><p class="bw-say">« ${esc(line)} »</p>${qs.map(({qid,q,s})=>`<div class="bw-qoffer"><b>${s==='ready'?'❓':'❗'} ${esc(nm(q))}</b><p>${esc(X(q.d))}</p><small>${T('Récompense','Reward')} : ✨ ${q.reward.xp} XP · 🪙 ${q.reward.kamas}${q.reward.item?` · ${D.ITEMS[q.reward.item].ic} ${esc(nm(D.ITEMS[q.reward.item]))}`:''}</small>
    ${s==='available'?`<button class="bw-b primary" data-acc="${qid}">${T('Accepter','Accept')}</button>`:s==='ready'?`<button class="bw-b primary" data-fin="${qid}">${T('Rendre la quête','Hand in')}</button>`:`<small>${T('En cours…','In progress…')}</small>`}</div>`).join('')}
   ${n.job?jobBlock(n.job):''}<div class="bw-btns">${n.shop?`<button class="bw-b primary" data-shop>🛒 ${T('Boutique','Shop')}</button><button class="bw-b" data-sell>💰 ${T('Vendre','Sell')}</button>`:''}${n.reset?`<button class="bw-b" data-reset>🔄 ${T('Réinitialiser mes caractéristiques','Reset my characteristics')}</button>`:''}<button class="bw-b" data-close>${T('Au revoir','Bye')}</button></div>`,'talk');
  card.querySelectorAll('[data-learn]').forEach(b=>c.listen(b,'click',()=>{if(C.learnJob(ch,b.dataset.learn)){SFX.level();banner(`${D.JOBS[b.dataset.learn].ic} ${nm(D.JOBS[b.dataset.learn])}`,T('Métier appris ! Touche les ressources dans le monde pour récolter.','Job learned! Tap resources in the world to harvest.'),3.5);store()}talk(id)}));
  card.querySelectorAll('[data-craft]').forEach(b=>c.listen(b,'click',()=>craftPanel(b.dataset.craft,id)));
  card.querySelectorAll('[data-acc]').forEach(b=>c.listen(b,'click',()=>{C.acceptQuest(ch,b.dataset.acc);SFX.buff();toastMsg(T('Quête acceptée !','Quest accepted!'),'good');store();talk(id)}));
  card.querySelectorAll('[data-fin]').forEach(b=>c.listen(b,'click',()=>{const r=C.finishQuest(ch,b.dataset.fin);if(r){SFX.win();toastMsg(`✨ +${r.xp} XP · 🪙 +${r.kamas}`,'good');if(r.lv.after>r.lv.before){setTimeout(SFX.level,500);banner(T('Niveau ','Level ')+r.lv.after+' !',T('Nouveaux points à répartir','New points to spend'))}}store();talk(id)}));
  card.querySelector('[data-shop]')&&c.listen(card.querySelector('[data-shop]'),'click',()=>shop(id));card.querySelector('[data-sell]')&&c.listen(card.querySelector('[data-sell]'),'click',()=>sellPanel(id));
  card.querySelector('[data-reset]')&&c.listen(card.querySelector('[data-reset]'),'click',()=>{const n2=C.resetStats(ch);store();toastMsg(T(`${n2} points rendus`,`${n2} points refunded`),'good');SFX.buff()})}
 function shop(id){const n=D.NPCS[id];const card=panel(`<h3>🛒 ${esc(nm(n))} <small>🪙 ${ch.kamas}</small></h3><div class="bw-shop">${n.shop.map(i=>{const it=D.ITEMS[i];return `<div class="bw-si"><span>${it.ic}</span><b>${esc(nm(it))}${it.slot?`<small>${X(D.SLOT_FR[it.slot])} · ${T('niv.','lvl')} ${it.lvl} · ${Object.entries(it.stats||{}).map(([k,v])=>`+${v} ${D.STATS[k].ic}`).join(' ')}</small>`:it.use?`<small>💚 +${it.use.heal} PV</small>`:''}</b><button class="bw-b primary" data-buy="${i}" ${ch.kamas>=it.price?'':'disabled'}>🪙 ${it.price}</button></div>`}).join('')}</div><button class="bw-b" data-back>${T('Retour','Back')}</button>`);
  card.querySelectorAll('[data-buy]').forEach(b=>c.listen(b,'click',()=>{if(C.buy(ch,b.dataset.buy)){SFX.coin();toastMsg(T('Acheté !','Bought!'),'good');store();shop(id)}}));c.listen(card.querySelector('[data-back]'),'click',()=>talk(id))}
 function sellPanel(id){const inv=Object.entries(ch.inv);const card=panel(`<h3>💰 ${T('Vendre','Sell')} <small>🪙 ${ch.kamas}</small></h3><div class="bw-shop">${inv.length?inv.map(([i,nn])=>{const it=D.ITEMS[i];return `<div class="bw-si"><span>${it.ic}</span><b>${esc(nm(it))} <i>×${nn}</i></b><button class="bw-b" data-sell="${i}">🪙 ${Math.max(1,Math.floor(it.price*.4))}</button></div>`}).join(''):`<p>${T('Rien à vendre.','Nothing to sell.')}</p>`}</div><button class="bw-b" data-back>${T('Retour','Back')}</button>`);
  card.querySelectorAll('[data-sell]').forEach(b=>c.listen(b,'click',()=>{if(C.sell(ch,b.dataset.sell)){SFX.coin();store();sellPanel(id)}}));c.listen(card.querySelector('[data-back]'),'click',()=>talk(id))}

 // ================= CRÉATION DU PERSONNAGE =================
 const create={cls:'bourrin',name:'',skin:'#f2c493',hair:'#5a3a24',sex:'m'};
 function createUI(){const SK=['#f8d6b4','#f2c493','#d9a066','#a86b3c','#6b4226'],HA=['#5a3a24','#1d1a18','#d9a441','#c0392b','#e8e2d6','#6b4ad9'];
  ui.innerHTML=`<div class="bw-create"><div class="bw-logo"><h1>Baga<b>World</b></h1><p>${T('Bienvenue à Bagatown. Choisis ta classe, ton look, et va taper des moutons.','Welcome to Bagatown. Pick your class, your look, and go whack some sheep.')}</p></div>
   <div class="bw-classes">${Object.entries(D.CLASSES).map(([k,cl])=>`<button data-c="${k}" class="${create.cls===k?'on':''}" style="--c:${cl.col}"><span>${cl.ic}</span><b>${esc(nm(cl))}</b></button>`).join('')}</div>
   <p class="bw-cdesc">${esc(X(D.CLASSES[create.cls].desc))}</p>
   <div class="bw-look"><div>${SK.map(s=>`<button class="sw${create.skin===s?' on':''}" data-skin="${s}" style="background:${s}"></button>`).join('')}</div><div>${HA.map(s=>`<button class="sw${create.hair===s?' on':''}" data-hair="${s}" style="background:${s}"></button>`).join('')}</div>
    <div><button class="bw-chip${create.sex==='m'?' on':''}" data-sex="m">♂</button><button class="bw-chip${create.sex==='f'?' on':''}" data-sex="f">♀</button></div></div>
   <input class="bw-name" maxlength="16" placeholder="${T('Nom du personnage','Character name')}" value="${esc(create.name)}"><button class="bw-b primary bw-go">${T('Entrer dans BagaWorld','Enter BagaWorld')}</button></div>`;
  ui.querySelectorAll('[data-c]').forEach(b=>c.listen(b,'click',()=>{create.cls=b.dataset.c;SFX.click();createUI()}));
  ui.querySelectorAll('[data-skin]').forEach(b=>c.listen(b,'click',()=>{create.skin=b.dataset.skin;createUI()}));ui.querySelectorAll('[data-hair]').forEach(b=>c.listen(b,'click',()=>{create.hair=b.dataset.hair;createUI()}));
  ui.querySelectorAll('[data-sex]').forEach(b=>c.listen(b,'click',()=>{create.sex=b.dataset.sex;createUI()}));
  const inp=ui.querySelector('.bw-name');c.listen(inp,'input',()=>{create.name=inp.value});
  c.listen(ui.querySelector('.bw-go'),'click',()=>{const name=(create.name||'').trim()||(EN?'Hero':'Héros');ch=C.newChar(name,create.cls,create);ch.inv.potion=3;
   mode='world';cam.dist=worldDist();cam.oy=0;cam.yaw=0;store();frame();music('town');banner('BagaWorld',T('Va voir le Maire Bagatelle, au nord de la place','Go see Mayor Bagatelle, north of the square'),3.5);SFX.win()})}
 function drawCreate(){cam.x=W.start.x;cam.z=W.start.z-1;cam.yaw=t*.25;cam.dist=6.2;cam.el=.3;cam.oy=-1.25;camera();R.frame(cv.width,cv.height,view.VP,view.eye,[.62,.82,.95],[30,70]);drawWorld(true);
  MD.drawChar(R,M4,charParts({cls:create.cls,skin:create.skin,hair:create.hair,sex:create.sex,eq:{weapon:{bourrin:'epee_rouillee',viseur:'arc_bois',bisou:'baguette',fourbe:'dague'}[create.cls]}}),M4.trs(W.start.x,WW.tileH(W,W.start.x,W.start.z)*BH,W.start.z-1,0,1.4),{bob:Math.sin(t*2)*.02,armR:Math.sin(t*1.5)*.3+.3,armL:-.1})}

 // ================= MÉTIERS ET DONJON =================
 const dep=new Map();   // décors récoltés qui repoussent : case → {t, prop}
 function rebuildAt(x,z){const key=Math.floor(x/MD.CH)+','+Math.floor(z/MD.CH),m=M.chunks.get(key);if(m){R.free(m);M.chunks.delete(key)}}
 // toucher un décor récoltable (ou l'eau) : y aller, puis récolter
 function harvestTap(g){let best=null;
  for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const h=WW.harvestAt(W,g.x+dx,g.z+dz);if(!h)continue;const d=Math.hypot(h.x+.5-g.x,h.z+.5-g.z);if(d<(dx||dz?.95:1.3)&&(!best||d<best.d))best={...h,d}}
  if(!best)return false;const L=C.jobLevel(ch,best.job),J=D.JOBS[best.job];
  if(!L){if(best.prop===WW.P.deco||best.fish)return false;toastMsg(T(`Pour récolter ça, apprends le métier de ${J.fr} auprès de ${D.NPCS[J.master].fr}.`,`To harvest this, learn the ${J.en} job from ${D.NPCS[J.master].en}.`));return true}
  if(L<best.lvl){toastMsg(T(`${nm(D.ITEMS[best.item])} : ${J.fr} niveau ${best.lvl} requis.`,`${nm(D.ITEMS[best.item])}: ${J.en} level ${best.lvl} needed.`));return true}
  if(dep.has(best.k)){toastMsg(T('Déjà récolté. Ça repousse, patience.','Already harvested. It grows back, be patient.'));return true}
  const spots=[];for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dz&&best.prop!==WW.P.deco)continue;const xx=best.x+dx+.5,zz=best.z+dz+.5;if(WW.walkable(W,xx,zz))spots.push([xx,zz,Math.hypot(xx-P.x,zz-P.z)])}
  spots.sort((a,b)=>a[2]-b[2]);if(!spots.length)return false;
  if(spots[0][2]<.3){startHarvest(best);return true}
  goTo(spots[0][0],spots[0][1],{k:'harvest',h:best,x:spots[0][0],z:spots[0][1]});SFX.click();return true}
 function startHarvest(h){P.path=[];P.goal=null;P.sit=false;P.harv={h,t:0,dur:h.fish?2.6:1.7};P.yaw=Math.atan2(-(h.x+.5-P.x),-(h.z+.5-P.z))}
 function harvestTick(){const H=P.harv;if(!H)return;if(keys.size||P.path.length){P.harv=null;return}H.t+=dt;
  if(Math.floor(H.t/.42)!==Math.floor((H.t-dt)/.42))(H.h.fish?()=>noise(.12,.03,1800,0,'bandpass'):H.h.job==='mineur'?()=>{tone(1200,900,.06,'square',.03);noise(.05,.05,3000)}:()=>noise(.08,.07,900))();
  if(H.t<H.dur)return;P.harv=null;const h=H.h,r=C.harvest(ch,h);if(r.err){toastMsg(r.err);return}
  floats.push({x:P.x,y:P.y+2,z:P.z,text:`+${r.n} ${D.ITEMS[r.item].ic}`,kind:'heal',t:1.3});toastMsg(`+${r.n} ${nm(D.ITEMS[r.item])}`,'good');SFX.coin();
  if(r.lv&&r.lv.after>r.lv.before){banner(`${D.JOBS[h.job].ic} ${nm(D.JOBS[h.job])} ${T('niveau','level')} ${r.lv.after} !`,'',2.5);setTimeout(SFX.level,200)}
  if(!h.fish){const pr=W.prop[h.k];dep.set(h.k,{t:60+Math.random()*60,prop:pr,x:h.x,z:h.z});W.prop[h.k]=[WW.P.tree,WW.P.pine,WW.P.palm].includes(pr)?WW.P.stump:WW.P.none;rebuildAt(h.x,h.z)}
  store()}
 function regrowTick(){for(const [k,v] of dep){v.t-=dt;if(v.t>0)continue;if(Math.hypot(v.x+.5-P.x,v.z+.5-P.z)<1)continue;W.prop[k]=v.prop;dep.delete(k);rebuildAt(v.x,v.z)}}
 // maître de métier : apprendre, atelier
 function jobBlock(job){const J=D.JOBS[job],L=C.jobLevel(ch,job);
  return `<div class="bw-qoffer"><b>${J.ic} ${nm(J)}${L?` · ${T('niveau','level')} ${L}`:''}</b><p>${esc(X(J.d))}</p>${L?`<button class="bw-b primary" data-craft="${job}">🛠️ ${T('Atelier','Workshop')} · ${X(J.shop)}</button>`:`<button class="bw-b primary" data-learn="${job}">${T('Apprendre le métier (gratuit)','Learn the job (free)')}</button>`}</div>`}
 function craftPanel(job,npc){const J=D.JOBS[job],L=C.jobLevel(ch,job),list=Object.entries(D.RECIPES).filter(([,r])=>r.job===job).sort((a,b)=>a[1].lvl-b[1].lvl);
  const card=panel(`<h3>🛠️ ${X(J.shop)} <small>${J.ic} ${nm(J)} · ${T('niv.','lvl')} ${L}</small></h3><div class="bw-craft">${list.map(([id,r])=>{const it=D.ITEMS[id],mx=C.maxCraft(ch,id),lock=L<r.lvl;
    return `<div class="bw-rc${lock?' lock':''}"><span class="ic">${it.ic}</span><div><b>${esc(nm(it))}</b><small>${lock?`🔒 ${T('niveau','level')} ${r.lvl} · `:''}${Object.entries(r.in).map(([i,q])=>`<i class="${(ch.inv[i]||0)>=q?'ok':'no'}">${D.ITEMS[i].ic} ${ch.inv[i]||0}/${q}</i>`).join(' ')}</small></div>
     <button class="bw-b primary" data-c="${id}" data-n="1" ${mx>=1?'':'disabled'}>×1</button>${mx>1?`<button class="bw-b" data-c="${id}" data-n="${mx}">×${mx}</button>`:''}</div>`}).join('')}</div>
   <p class="bw-small">${T('Touche une ligne pour voir l’objet.','Tap a line to see the item.')}</p><div class="bw-btns"><button class="bw-b" data-back>${T('Retour','Back')}</button></div>`,'craft');
  card.querySelectorAll('[data-c]').forEach(b=>c.listen(b,'click',e=>{e.stopPropagation();const id=b.dataset.c,n=+b.dataset.n,r=C.craft(ch,id,n);if(!r)return;SFX.coin();burst(P.x,P.y+1.2,P.z,'#ffd23f',10,1.5,2);
   toastMsg(`+${n} ${nm(D.ITEMS[id])}`,'good');if(r.lv.after>r.lv.before){banner(`${J.ic} ${nm(J)} ${T('niveau','level')} ${r.lv.after} !`,'',2.5);setTimeout(SFX.level,200)}store();craftPanel(job,npc)}));
  card.querySelectorAll('.bw-rc').forEach(row=>c.listen(row,'click',()=>itemInfo(row.querySelector('[data-c]').dataset.c,()=>craftPanel(job,npc))));
  c.listen(card.querySelector('[data-back]'),'click',()=>npc?talk(npc):closePanel())}
 function itemInfo(id,back){const it=D.ITEMS[id];const card=panel(`<h3>${it.ic} ${esc(nm(it))}</h3><p class="bw-flav">${esc(X(it.d))}</p>${it.slot?`<p>${X(D.SLOT_FR[it.slot])} · ${T('niveau','level')} ${it.lvl}</p><div class="bw-kv">${statLines(it.stats)}</div>`:''}${it.weapon?`<p>⚔️ ${it.weapon.pa} PA · ${D.EL[it.weapon.el].ic} ${it.weapon.min}-${it.weapon.max} · 🎯 ${it.weapon.range.join('-')}</p>`:''}${it.use?`<p>💚 ${T('Rend','Restores')} ${it.use.heal} PV</p>`:''}${setInfo(it)}<div class="bw-btns"><button class="bw-b" data-back>${T('Retour','Back')}</button></div>`);
  c.listen(card.querySelector('[data-back]'),'click',back)}
 function setInfo(it){if(!it.set)return '';const S=D.SETS[it.set];return `<p class="bw-small">🧩 <b>${esc(nm(S))}</b></p><div class="bw-kv">${Object.entries(S.bonus).map(([n,b])=>`<span>${n} ${T('pièces','items')} :</span>${statLines(b)}`).join('')}</div>`}
 function jobsPanel(){const sets=C.setBonuses(ch);
  const card=panel(`<h3>⭐ ${esc(ch.name)}</h3><div class="bw-tabs"><button data-tab="stats">${T('Caractéristiques','Characteristics')}</button><button class="on">${T('Métiers','Jobs')}</button></div>
   <div class="bw-jobs">${Object.entries(D.JOBS).map(([id,J])=>{const L=C.jobLevel(ch,id),xp=ch.jobs?.[id]?.xp||0,x0=D.jobXpFor(L),x1=D.jobXpFor(L+1);
    const hv=Object.values(D.HARVEST).filter(h=>h.job===id);
    return `<div class="${L?'':'off'}"><b>${J.ic} ${nm(J)}</b>${L?`<small>${T('niveau','level')} ${L}</small><div class="bw-xp jx"><i style="width:${L>=D.JOB_MAX?100:(100*(xp-x0)/Math.max(1,x1-x0)).toFixed(0)}%"></i></div>`:`<small>${T('Pas appris','Not learned')}</small>`}
     <p>${hv.map(h=>`<span class="${L>=h.lvl?'':'lk'}">${D.ITEMS[h.item].ic} ${esc(nm(D.ITEMS[h.item]))}${L>=h.lvl?'':` (${h.lvl})`}</span>`).join(' ')}</p><p class="bw-small">${L?T(`Atelier : ${D.NPCS[J.master].fr}`,`Workshop: ${D.NPCS[J.master].en}`):T(`À apprendre auprès de ${D.NPCS[J.master].fr}`,`Learn it from ${D.NPCS[J.master].en}`)}</p></div>`}).join('')}</div>
   ${sets.length?`<p class="bw-small">🧩 ${sets.map(s=>`<b>${esc(nm(D.SETS[s.id]))}</b> (${s.count})`).join(' · ')}</p>`:''}<button class="bw-b" data-close>${T('Fermer','Close')}</button>`,'jobs');
  c.listen(card.querySelector('[data-tab]'),'click',stats)}
 // la grotte
 function dungeonPanel(){const key=ch.inv[D.DUNGEON.key]||0,L=C.level(ch),mates=NET.group.filter(m=>m.online&&m.id!==NET.pub);
  const card=panel(`<h3>🍄 ${esc(nm(D.DUNGEON))} <small>${T('niveau','level')} ${D.DUNGEON.lvl}</small></h3><p>${T('Quatre salles à la suite, sans pause, et le Grand Champidou au bout. Les PV ne remontent pas entre les salles.','Four rooms in a row, no break, and the Great Shroomdaddy at the end. HP doesn’t come back between rooms.')}</p>
   <ol class="bw-rooms">${D.DUNGEON.rooms.map(r=>`<li>${esc(nm(r))} <small>${r.mobs.map(([m,l])=>mobIcon(m)).join(' ')}</small></li>`).join('')}</ol>
   <p>${D.ITEMS.cle_grotte.ic} ${T('Clé moisie','Mouldy Key')} : <b>${key}</b>${key?'':T(' · à fabriquer (Herboriste niv. 8) ou à demander à Bernard.',' · craft one (Herbalist lvl 8) or ask Bernard.')}</p>
   ${L<14?`<p class="bw-small bw-red">${T('Bernard te conseille de revenir niveau 14 au moins, et pas tout seul.','Bernard suggests you come back at level 14 at least, and not alone.')}</p>`:''}
   ${NET.on&&mates.length?`<p class="bw-small">${T('Ton groupe aura 30 s pour te rejoindre (chacun avec sa clé).','Your group will have 30 s to join you (each with their own key).')}</p>`:''}
   <div class="bw-btns"><button class="bw-b primary" data-go ${key?'':'disabled'}>🗝️ ${T('Entrer dans la grotte','Enter the cave')}</button><button class="bw-b" data-close>${T('Plus tard','Later')}</button></div>`,'dungeon');
  c.listen(card.querySelector('[data-go]'),'click',()=>{closePanel();startDungeon()})}
 async function startDungeon(){if(fight||starting||!ch.inv[D.DUNGEON.key])return;
  const rooms=D.DUNGEON.rooms.map((r,i)=>({arena:WW.dungeonArena(i),mobs:r.mobs.map(([m,l],j)=>C.mobFighter(m,l,'r'+i+'m'+j))}));let meId=myFid();
  const init={kind:'pve',dungeon:true,arena:rooms[0].arena,seed:(Math.random()*2**31)|0,teams:[[C.fighterOf(ch,meId)],rooms[0].mobs],waves:rooms.slice(1),gid:null};
  let on=null;if(NET.on&&NET.pub){starting=true;try{const id=await online_.bwFightCreate('pve',init,W.cave.x,W.cave.z);on={id,applied:0,recv:0}}catch(e){toastMsg(T('Donjon hors ligne : ','Offline dungeon: ')+e.message)}starting=false;if(!alive)return}
  if(!on&&meId!=='me'){meId='me';init.teams[0][0]={...init.teams[0][0],id:'me'}}
  C.takeItem(ch,D.DUNGEON.key);store();buildFight(init,meId,null,on);enterFight();setTimeout(()=>fight&&banner(`${T('Salle','Room')} 1/${D.DUNGEON.rooms.length}`,nm(D.DUNGEON.rooms[0]),3),2300);
  if(on&&NET.group.some(m=>m.online&&m.id!==NET.pub))toastMsg(T('Ton groupe a 30 s pour te rejoindre.','Your group has 30 s to join you.'),'good')}

 // ================= EN LIGNE =================
 // Toutes les ~1 s : on envoie sa position, on reçoit les joueurs proches, le chat, le groupe, les invitations et les combats
 // autour. Sans pseudo enregistré (ou hors ligne), on joue en solo ; le bouton 🌐 permet de passer en ligne.
 function netState(){return {x:+P.x.toFixed(2),z:+P.z.toFixed(2),yaw:+P.yaw.toFixed(2),zone:zoneNow,state:mode==='fight'?'fight':P.sit?'sit':'walk',look:ch?myLook():null,lvl:ch?C.level(ch):1,cname:ch?.name||''}}
 function netTick(){if(!NET.on||!ch||mode==='create')return;NET.t-=dt;if((NET.t>0&&!NET.now)||NET.busy)return;
  const fo=fight?.online||null,since=fo?fo.recv:0;NET.t=fo?.75:1.1;NET.now=false;NET.busy=true;
  online_.bwSync(netState(),NET.lastChat,fo?.id||null,since).then(r=>{NET.busy=false;if(NET.err>=3)toastMsg(T('Connexion retrouvée.','Back online.'),'good');NET.err=0;if(alive)netApply(r,fo,since)})
   .catch(e=>{NET.busy=false;NET.err++;NET.t=Math.min(8,1.5*NET.err);if(NET.err===3)toastMsg(T('Connexion perdue, je réessaie…','Connection lost, retrying…'));if(/pseudo|pris/.test(e.message)){NET.on=false;netMenu()}})}
 function netApply(r,fo,since){NET.pub=r.me.id;NET.grp=r.me.grp;NET.leader=r.me.leader;
  // joueurs proches (positions lissées à l'affichage)
  const seen=new Set();for(const p of r.players){seen.add(p.id);let o=NET.others.get(p.id);if(!o){o={x:p.x,z:p.z,yaw:p.yaw,walk:0,bubble:null};NET.others.set(p.id,o)}o.d=p;o.tx=p.x;o.tz=p.z;o.tyaw=p.yaw;o.seen=t}
  for(const [id,o] of NET.others)if(!seen.has(id)&&t-o.seen>3)NET.others.delete(id);
  // chat (au premier passage : l'historique récent, sans bulles)
  for(const m of r.chat){if(m.id<=NET.lastChat)continue;NET.lastChat=m.id;NET.chat.push({...m,t});if(NET.chat.length>80)NET.chat.shift();
   if(!NET.first){if(m.from===NET.pub)NET.myBubble={text:m.text,t:6};else{const o=NET.others.get(m.from);if(o)o.bubble={text:m.text,t:6};if(m.scope==='group')SFX.click()}}}
  if(NET.first&&!r.chat.length)NET.lastChat=Math.max(NET.lastChat,r.chatTop||0);
  NET.first=false;if(panelOpen==='chat')chatLog();feed();
  // groupe
  const before=new Set(NET.group.map(m=>m.id));NET.group=r.group;
  for(const m of r.group)if(!before.has(m.id)&&before.size&&m.id!==NET.pub)toastMsg(`${m.cname||m.name} ${T('rejoint le groupe !','joins the group!')}`,'good');
  if(before.size>1&&r.group.length<=1&&before.has(NET.pub))toastMsg(T('Le groupe est dissous.','The group was disbanded.'));
  if(panelOpen==='group')groupPanel();
  // combats autour : le groupe de monstres attaqué disparaît chez tout le monde ; prévenir si un membre du groupe se bat
  NET.fights=r.fights;const busyG=new Set(r.fights.filter(f=>f.kind==='pve').map(f=>f.gid));for(const g of groups)g.remote=busyG.has(g.gid);
  const mate=!fight&&r.fights.find(f=>f.mate&&f.joinable);const jb=ui.querySelector('.bw-joinbar');
  if(jb){if(mate){if(jb.dataset.id!==mate.id){jb.dataset.id=mate.id;jb.innerHTML=`<button class="bw-b primary">⚔️ ${esc(mate.by)} ${T('se bat · Rejoindre','is fighting · Join')}</button>`;c.listen(jb.firstChild,'click',()=>joinFight(mate.id));SFX.bleat()}jb.hidden=false}else{jb.hidden=true;jb.dataset.id=''}}
  // invitations
  for(const inv of r.invites)if(!NET.shown.has(inv.id)){NET.shown.add(inv.id);NET.inv.push(inv);SFX.buff();buzz([30,30,30])}nextInvite();
  // combat à reprendre (coupure, duel accepté par l'autre)
  if(r.myFight&&!fight&&!starting&&!NET.ignore.has(r.myFight))joinFight(r.myFight,true);
  // actions des autres joueurs dans mon combat
  if(r.fight&&fight&&fight.online&&fight.online===fo&&r.fight.id===fo.id){fo.quiet=r.fight.quiet;if(r.fight.since===since&&since===fo.recv){F_.queue.push(...r.fight.log);fo.recv+=r.fight.log.length}}
  netIc()}
 function netIc(){const el=ui.querySelector('.bw-net-ic');if(!el)return;el.hidden=!NET.on;el.textContent=`🌐 ${NET.others.size+1}${NET.group.length>1?` · 👥 ${NET.group.length}`:''}`}
 function netMenu(){ui.querySelectorAll('.bw-net').forEach(b=>b.hidden=!NET.on);ui.querySelectorAll('.bw-off').forEach(b=>b.hidden=NET.on||!online_.enabled());netIc()}
 function goOnline(){if(!online_.enabled())return;c.needPseudo(()=>{NET.on=true;NET.first=true;NET.now=true;netMenu();toastMsg(T('Tu es en ligne ! Les autres joueurs apparaissent autour de toi.','You’re online! Other players show up around you.'),'good')})}
 // rendu des autres joueurs et des combats en cours
 function drawNet(){for(const o of NET.others.values()){const k=Math.min(1,dt*6),dx=o.tx-o.x,dz=o.tz-o.z,dd=Math.hypot(dx,dz);
   if(dd>12){o.x=o.tx;o.z=o.tz}else{o.x+=dx*k;o.z+=dz*k}const moving=dd>.06;if(moving){o.yaw=Math.atan2(-dx,-dz);o.walk+=dt*8}else o.yaw+=(((o.tyaw-o.yaw+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI)*k;
   if(o.bubble){o.bubble.t-=dt;if(o.bubble.t<=0)o.bubble=null}
   if(o.d.state==='fight'||!o.d.look||Math.hypot(o.x-cam.x,o.z-cam.z)>26)continue;const y=WW.tileH(W,o.x,o.z)*BH,sit=o.d.state==='sit'&&!moving;
   shadow(o.x,y,o.z,.5);MD.drawChar(R,M4,charParts(o.d.look),M4.trs(o.x,y,o.z,o.yaw,1.4),sit?{legL:-1.5,legR:-1.5,bob:-.2,armL:.3,armR:.3}:moving?{legL:Math.sin(o.walk)*.7,legR:-Math.sin(o.walk)*.7,armL:-Math.sin(o.walk)*.6,armR:Math.sin(o.walk)*.6,bob:Math.abs(Math.sin(o.walk))*.05}:{bob:Math.sin(t*2+o.x)*.01})}
  if(NET.myBubble){NET.myBubble.t-=dt;if(NET.myBubble.t<=0)NET.myBubble=null}
  for(const f2 of NET.fights){if(Math.hypot(f2.x-cam.x,f2.z-cam.z)>26)continue;const y=WW.tileH(W,f2.x,f2.z)*BH+.9+Math.sin(t*3)*.08,M0=M4.trs(f2.x,y,f2.z,t*1.2,1);
   for(const s2 of [1,-1]){const Mb=M4.mul(M0,M4.rz(s2*.7));R.draw(M.cube,M4.mul(Mb,M4.sc(.07,.7,.07)),[.85,.88,.92,1]);R.draw(M.cube,M4.mul(Mb,M4.mul(M4.t(0,-.24,0),M4.sc(.26,.06,.08))),[.6,.42,.2,1])}}}
 function netLabels(L){let html='';const at=(x,y,z)=>{const s=scr(x,y,z);return s?`transform:translate(${s[0].toFixed(0)}px,${s[1].toFixed(0)}px)`:null};
  for(const o of NET.others.values()){if(o.d.state==='fight'||Math.hypot(o.x-P.x,o.z-P.z)>14)continue;const y=WW.tileH(W,o.x,o.z)*BH,st=at(o.x,y+2.05,o.z);if(!st)continue;
   html+=`<span class="bw-lab pl${o.d.mate?' mate':''}" style="${st}">${o.d.mate?'👥 ':''}${esc(o.d.cname||o.d.name)} · ${o.d.lvl}</span>`;
   if(o.bubble){const sb=at(o.x,y+2.5,o.z);if(sb)html+=`<span class="bw-lab bubble" style="${sb}">${esc(o.bubble.text)}</span>`}}
  if(NET.myBubble){const sb=at(P.x,P.y+2.3,P.z);if(sb)html+=`<span class="bw-lab bubble" style="${sb}">${esc(NET.myBubble.text)}</span>`}
  for(const f2 of NET.fights){if(Math.hypot(f2.x-P.x,f2.z-P.z)>16)continue;const st=at(f2.x,WW.tileH(W,f2.x,f2.z)*BH+1.9,f2.z);if(st)html+=`<span class="bw-lab fightm${f2.mate?' mate':''}" style="${st}">⚔️ ${esc(f2.by||'')}${f2.kind==='pvp'?' · '+T('duel','duel'):` · ${f2.n}/4`}</span>`}
  return html}
 function feed(){const el=ui.querySelector('.bw-feed');if(!el)return;const now=NET.chat.filter(m=>t-m.t<10).slice(-4);
  el.innerHTML=now.map(m=>`<p class="${m.scope}"><b>${esc(m.name)}</b> ${esc(m.text)}</p>`).join('');clearTimeout(el._t);el._t=setTimeout(feed,10500)}
 // fiches : un joueur, un combat en cours
 function playerCard(o){const p=o.d,mate=p.mate,full=NET.group.length>=4;
  const card=panel(`<h3>${D.CLASSES[p.look?.cls]?.ic||'🙂'} ${esc(p.cname||p.name)} <small>${T('niv.','lvl')} ${p.lvl} · ${esc(p.name)}</small></h3><p class="bw-small">${p.look?.cls?nm(D.CLASSES[p.look.cls]):''}${mate?' · '+T('dans ton groupe','in your group'):''}</p>
   <div class="bw-btns">${!mate?`<button class="bw-b primary" data-a="group" ${full?'disabled':''}>👥 ${T('Inviter dans le groupe','Invite to group')}</button>`:''}<button class="bw-b" data-a="duel">⚔️ ${T('Défier en duel','Challenge to a duel')}</button>
   ${mate&&NET.leader?`<button class="bw-b" data-a="kick">🚪 ${T('Exclure du groupe','Remove from group')}</button>`:''}<button class="bw-b" data-close>${T('Fermer','Close')}</button></div>`);
  card.querySelectorAll('[data-a]').forEach(b=>c.listen(b,'click',async()=>{const a=b.dataset.a;b.disabled=true;
   try{if(a==='group'){await online_.bwInvite(p.id,'group');toastMsg(T('Invitation envoyée.','Invite sent.'),'good')}
    else if(a==='duel'){const mf=C.fighterOf(ch,NET.pub);await online_.bwInvite(p.id,'duel',mf);toastMsg(T('Défi envoyé !','Challenge sent!'),'good')}
    else if(a==='kick'){await online_.bwLeave(p.id);NET.now=true}closePanel()}catch(e){toastMsg(e.message);b.disabled=false}}))}
 function fightCard(f2){const near=Math.hypot(f2.x-P.x,f2.z-P.z)<30;
  const card=panel(`<h3>⚔️ ${f2.kind==='pvp'?T('Duel en cours','Duel in progress'):T('Combat en cours','Fight in progress')}</h3><p>${T('Lancé par','Started by')} <b>${esc(f2.by||'?')}</b>${f2.kind==='pve'?` · ${f2.n}/4 ${T('joueurs','players')}`:''}</p>
   ${f2.joinable?(near?'':`<p class="bw-small">${T('Approche-toi pour le rejoindre.','Get closer to join.')}</p>`):`<p class="bw-small">${f2.kind==='pvp'?T('Les duels se regardent de loin.','Duels are watched from afar.'):T('Trop tard pour rejoindre.','Too late to join.')}</p>`}
   <div class="bw-btns">${f2.joinable&&near?`<button class="bw-b primary" data-j>⚔️ ${T('Rejoindre','Join')}</button>`:''}<button class="bw-b" data-close>${T('Fermer','Close')}</button></div>`);
  const j=card.querySelector('[data-j]');if(j)c.listen(j,'click',()=>{closePanel();joinFight(f2.id)})}
 function nextInvite(){if(panelOpen||mode!=='world'||fight||starting)return;const inv=NET.inv.shift();if(!inv)return;
  const card=panel(`<h3>${inv.kind==='group'?'👥':'⚔️'} ${inv.kind==='group'?T('Invitation','Invite'):T('Défi !','Challenge!')}</h3><p>${inv.kind==='group'?T(`<b>${esc(inv.name)}</b> t’invite dans son groupe.`,`<b>${esc(inv.name)}</b> invites you to their group.`):T(`<b>${esc(inv.name)}</b> te défie en duel. Ça ne coûte rien, à part ta fierté.`,`<b>${esc(inv.name)}</b> challenges you to a duel. It costs nothing but your pride.`)}</p>
   <div class="bw-btns"><button class="bw-b primary" data-y>${T('Accepter','Accept')}</button><button class="bw-b" data-n>${T('Refuser','Decline')}</button></div>`,'invite');
  c.listen(card.querySelector('[data-y]'),'click',async()=>{try{const r=await online_.bwAnswer(inv.id,true);closePanel();if(r.kind==='group'){toastMsg(T('Tu rejoins le groupe !','You join the group!'),'good');NET.now=true}else if(r.kind==='duel')createDuel(r)}catch(e){toastMsg(e.message);closePanel()}});
  c.listen(card.querySelector('[data-n]'),'click',()=>{online_.bwAnswer(inv.id,false).catch(()=>{});closePanel()})}
 // chat : local (autour de soi) ou groupe
 function chatPanel(){if(!NET.scope||(NET.scope==='group'&&!NET.grp))NET.scope='local';
  const card=panel(`<h3>💬 Chat</h3><div class="bw-tabs"><button data-sc="local" class="${NET.scope==='local'?'on':''}">${T('Autour de moi','Nearby')}</button><button data-sc="group" class="${NET.scope==='group'?'on':''}" ${NET.grp?'':'disabled'}>${T('Groupe','Group')}</button></div>
   <div class="bw-chatlog"></div><form class="bw-chatform"><input maxlength="140" placeholder="${T('Écris un message…','Type a message…')}" enterkeyhint="send"><button class="bw-b primary">➤</button></form><button class="bw-b" data-close>${T('Fermer','Close')}</button>`,'chat');
  card.querySelectorAll('[data-sc]').forEach(b=>c.listen(b,'click',()=>{NET.scope=b.dataset.sc;chatPanel()}));
  const form=card.querySelector('form'),inp=form.querySelector('input');
  c.listen(form,'submit',async e=>{e.preventDefault();const txt=inp.value.trim();if(!txt)return;inp.value='';try{await online_.bwSay(txt,NET.scope);NET.now=true;SFX.click()}catch(err){toastMsg(err.message);inp.value=txt}});chatLog()}
 function chatLog(){const el=ui.querySelector('.bw-chatlog');if(!el)return;const list=NET.chat.filter(m=>m.scope===NET.scope).slice(-40);
  el.innerHTML=list.length?list.map(m=>`<p class="${m.from===NET.pub?'mine':''}"><b>${esc(m.name)}</b> ${esc(m.text)}</p>`).join(''):`<p class="bw-small">${NET.scope==='group'?T('Rien pour l’instant dans le groupe.','Nothing in the group yet.'):T('Personne n’a encore parlé par ici. Lance-toi !','Nobody has talked around here yet. Go ahead!')}</p>`;el.scrollTop=el.scrollHeight}
 function groupPanel(){const g=NET.group;
  const card=panel(`<h3>👥 ${T('Groupe','Group')} <small>${g.length?`${g.length}/4`:''}</small></h3>${g.length?`<div class="bw-glist">${g.map(m=>`<div class="${m.online?'':'off'}"><span>${m.leader?'👑':'·'}</span><b>${esc(m.cname||m.name)}${m.id===NET.pub?` (${T('toi','you')})`:''}</b><small>${T('niv.','lvl')} ${m.lvl} · ${m.zone?esc(nm(D.ZONES[m.zone]||{fr:m.zone,en:m.zone})):'—'}${m.state==='fight'?' · ⚔️':''}${m.online?'':' · '+T('absent','away')}</small>${NET.leader&&m.id!==NET.pub?`<button class="bw-b" data-k="${m.id}">🚪</button>`:''}</div>`).join('')}</div>
   <p class="bw-small">${T('Quand un membre attaque des monstres, les autres ont 30 s pour le rejoindre. L’XP est partagée (avec un bonus de groupe).','When a member attacks monsters, the others have 30 s to join. XP is shared (with a group bonus).')}</p>
   <div class="bw-btns"><button class="bw-b" data-leave>${T('Quitter le groupe','Leave the group')}</button><button class="bw-b" data-close>${T('Fermer','Close')}</button></div>`
   :`<p>${T('Tu n’as pas de groupe.','You have no group.')}</p><p class="bw-small">${T('Touche un joueur dans le monde pour l’inviter (4 au maximum). En groupe, vous combattez ensemble et vous avez un chat rien qu’à vous.','Tap a player in the world to invite them (4 max). In a group, you fight together and get your own chat.')}</p><button class="bw-b" data-close>${T('Fermer','Close')}</button>`}`,'group');
  card.querySelectorAll('[data-k]').forEach(b=>c.listen(b,'click',async()=>{try{await online_.bwLeave(b.dataset.k);NET.now=true}catch(e){toastMsg(e.message)}}));
  const lv=card.querySelector('[data-leave]');if(lv)c.listen(lv,'click',async()=>{try{await online_.bwLeave();NET.group=[];NET.grp=false;NET.now=true;closePanel();toastMsg(T('Tu as quitté le groupe.','You left the group.'))}catch(e){toastMsg(e.message)}})}

 // ================= BOUCLE =================
 function frameDraw(){const w=wrap.clientWidth,h=wrap.clientHeight,dpr=Math.min(window.devicePixelRatio||1,1.75);const W2=Math.round(w*dpr),H2=Math.round(h*dpr);if(cv.width!==W2||cv.height!==H2){cv.width=W2;cv.height=H2}
  if(mode==='create'){drawCreate();return}
  cam.el+=((mode==='fight'?1.0:.74)-cam.el)*Math.min(1,dt*3);camera();const cave=mode==='fight'&&fight?.A.dungeon,board=mode==='fight'&&fight?.A.board,sky=cave?[.05,.04,.07]:board?({woods:[.42,.58,.48],hills:[.66,.78,.9],beach:[.6,.82,.95]}[fight.A.theme]||[.6,.8,.93]):zoneNow==='woods'?[.55,.72,.62]:zoneNow==='hills'?[.7,.8,.92]:[.62,.82,.95];R.frame(cv.width,cv.height,view.VP,view.eye,sky,cave?[(cam.fd||20)/(cam.fzoom||1)+4,(cam.fd||20)/(cam.fzoom||1)+22]:board?[60,140]:[cam.dist+10,cam.dist+26]);
  if(mode==='fight'&&fight)drawFight();else drawWorld();
  M.water??=MD.waterMesh(R,W);if(!cave&&!board)R.draw(M.water,M4.t(0,Math.sin(t*1.2)*.02,0),null,.82);drawFx();cam.shake=Math.max(0,cam.shake-dt*2)}
 function tick(d){dt=Math.min(d,.05);t+=dt;if(!alive)return;
  if(mode==='world'&&ch)worldTick();else if(mode==='fight'&&fight)fightTick();netTick();frameDraw()}
 // test automatique
 if(window.__bwTest)window.__bw={get ch(){return ch},get fight(){return fight},get F_(){return F_},get mode(){return mode},P,W,groups,startFight,talk,openPanel,tick,F,C,D,WW,worldTap,fightTap,view,cam,store,NET,joinFight,netApply,scr,myTurnNow,doAct,craftPanel,dungeonPanel,jobsPanel,dep,playerCardTest(){playerCard([...NET.others.values()][0])},fightTapCell(x,y){const p=cw(x,y),q=scr(p[0],p[1],p[2]);if(q)fightTap(q[0],q[1]);return q}};
 if(mode==='create')createUI();else{frame();music('town');requestAnimationFrame(()=>{cam.dist=worldDist()})}
 return {update(d){tick(d)},destroy(){alive=false;store();if(NET.on){try{if(fight?.online&&!F_?.over)online_.bwFightAct(fight.online.id,fight.online.recv,{a:'quit',id:fight.me}).catch(()=>{});online_.bwBye().catch(()=>{})}catch{}}setMusicTheme(null);for(const m of M.chunks.values())R.free(m);R.free(M.water)}};
}
