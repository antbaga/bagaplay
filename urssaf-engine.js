// Fuis l'URSSAF : moteur du jeu (sans DOM ni WebGL, testable sous Node).
// Une piste de ramettes de papier posées sur un bureau, 3 couloirs, des virages à 90° (on ne repart jamais
// vers l'arrière, donc la piste ne se recoupe pas), des fournitures de bureau en obstacles, des agents qui suivent.
// Unités : 1 = la taille du petit personnage. s = distance le long du segment, x = décalage latéral (droite > 0).
export const LW=1.25,TW=4.2,REAM=2.4,JUMP_V=7.6,GRAV=25,SLIDE_T=.8,HERO_H=1,SLIDE_H=.45,START_LIVES=3,MAX_LIVES=5;
export const DIRS=[[0,-1],[1,0],[0,1],[-1,0]];
export const rightOf=d=>[-DIRS[d][1],DIRS[d][0]];
export function rng(seed){let a=seed>>>0||1;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
export const speedAt=d=>Math.min(16,7.5+d*.0042);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// obstacles : solid (on percute si on est plus bas que h), bridge (on passe dessous en glissant, ou dessus si c'est bas),
// stamp (tampon qui tape : on passe quand il est en haut), sticky (on trébuche), hole (trou de perforatrice : on tombe)
export const KINDS={
 pencil:{solid:1,h:.36,len:.42,across:1},
 clips:{solid:1,h:.3,len:.8,across:1},
 ruler:{bridge:1,low:.6,top:.8,len:.55,across:1},
 bridge:{bridge:1,low:.55,top:1.55,len:1.1,across:1},
 stapler:{solid:1,h:.95,len:2.1,w:.95},
 gum:{solid:1,h:1.3,len:.85,w:1.0},
 sharpener:{solid:1,h:.55,len:.75,w:.8},
 postits:{solid:1,h:.62,len:.95,w:.95},
 calc:{solid:1,h:.32,len:1.7,w:2.2},
 mug:{solid:1,h:3.2,len:2.3,w:2.3},
 stamp:{stamp:1,len:1.0,w:1.0},
 postit:{sticky:1,len:1.05,w:1.05},
 gumblob:{sticky:1,len:.75,w:.75},
 ink:{sticky:1,len:1.9,w:2.2},
 hole:{hole:1,len:.95,w:.95}
};
export const POWERS={magnet:10,mult:12,shield:30,jet:5,cash:0};
export const STAMP_PERIOD=1.5;
// tampon : hauteur du bas de la tête (0 = posé sur le papier). Descend vite, reste, remonte, attend en haut.
export function stampBottom(it,t){const u=((t+it.phase)%STAMP_PERIOD+STAMP_PERIOD)%STAMP_PERIOD;
 if(u<.12)return 1.45*(1-u/.12);if(u<.5)return 0;if(u<1)return 1.45*(u-.5)/.5;return 1.45}

export function worldOf(seg,s,x){const [dx,dz]=DIRS[seg.d],[rx,rz]=rightOf(seg.d);return [seg.o[0]+dx*s+rx*x,seg.o[1]+dz*s+rz*x]}
export const junction=seg=>seg.L-TW/2;
const allowed=(seg,dir)=>seg.turn==='T'||seg.turn===dir;
const turnDir=(d,dir)=>dir==='L'?(d+3)%4:(d+1)%4;

// ---- génération
function newSeg(G,o,d,d0,first){const r=G.rnd,L=first?92:Math.round(46+r()*54+Math.min(30,d0/120));
 const turn=d===0?(r()<.32?'T':r()<.5?'L':'R'):d===1?'L':'R';
 const seg={id:G.nextId++,o,d,L,turn,d0,start:first?-14:-TW/2,draw:first?-14:TW/2,gaps:[],items:[],branches:null,seams:[]};
 fill(G,seg,first);return seg}
function lanesFree(blocked){return [-1,0,1].filter(l=>!blocked.includes(l))}
function add(G,seg,k,s,x,extra={}){const K=KINDS[k]||{};const it={id:G.nextId++,k,s,x,len:K.len||.8,w:K.across?TW:(K.w||.9),...extra};if(K.stamp)it.phase=G.rnd()*STAMP_PERIOD;seg.items.push(it);return it}
function coin(G,seg,s,lane,y=.55){seg.items.push({id:G.nextId++,k:'coin',s,x:lane*LW,y,len:.6,w:.6})}
const pick=(r,a)=>a[Math.floor(r()*a.length)];
function wpick(r,w){let t=0;for(const k in w)t+=w[k];let u=r()*t;for(const k in w){u-=w[k];if(u<=0)return k}return Object.keys(w)[0]}
// une rangée : renvoie les couloirs qu'on peut garder sans rien faire (pour les pièces) et ce qu'il faut faire
function row(G,seg,s,f){const r=G.rnd,w={block1:3,block2:1.2+2*f,jump:2,slide:1.4,sticky:1.1,gap:.7+f,hole:.8,combo:2*f,stamp:f>.1?1.3*f:0,mug:.9};
 if(s>seg.L-TW-12)w.gap=0;
 const p=wpick(r,w),lane=()=>pick(r,[-1,0,1]);
 if(p==='block1'){const l=lane();add(G,seg,pick(r,['stapler','gum','sharpener','postits','gum']),s,l*LW);return {free:lanesFree([l]),len:2.2}}
 if(p==='block2'){const free=lane();for(const l of [-1,0,1])if(l!==free)add(G,seg,pick(r,['gum','stapler','postits','gum']),s+(r()-.5)*.6,l*LW);return {free:[free],len:2.4}}
 if(p==='jump'){const k=pick(r,['pencil','pencil','clips','ruler']);add(G,seg,k,s,0,{rot:r()<.5?0:1});if(k==='pencil'||k==='clips')return {free:[],arc:true,len:1};return {free:[],arc:true,len:1}}
 if(p==='slide'){add(G,seg,'bridge',s,0);return {free:[],len:1.2}}
 if(p==='sticky'){const l=lane();if(r()<.4&&f>.2){const x=l===1?.625:-.625;add(G,seg,'ink',s,x);return {free:[x>0?-1:1],len:2}}add(G,seg,pick(r,['postit','gumblob','postit']),s,l*LW,{rot:r()*.5-.25});return {free:lanesFree([l]),len:1.2}}
 if(p==='gap'){const len=clamp(1.5+f*1.2+r()*.3,1.5,2.8);seg.gaps.push([s-len/2,s+len/2]);seg.items.push({id:G.nextId++,k:'gap',s,x:0,len,w:TW});return {free:[],arc:true,len:len+1}}
 if(p==='hole'){const l=lane();add(G,seg,'hole',s,l*LW);if(f>.3&&r()<.5){const l2=l===0?pick(r,[-1,1]):0;add(G,seg,'hole',s,l2*LW);return {free:lanesFree([l,l2]),len:1.2}}return {free:lanesFree([l]),len:1.2}}
 if(p==='combo'){const l=lane();add(G,seg,pick(r,['gum','stapler']),s,l*LW);for(const o of [-1,0,1])if(o!==l)add(G,seg,pick(r,['sharpener','postits']),s,o*LW);return {free:[],len:2.2,jumpLanes:lanesFree([l])}}
 if(p==='stamp'){const l=lane();add(G,seg,'stamp',s,l*LW);if(r()<.5){const l2=l===0?pick(r,[-1,1]):0;add(G,seg,'stamp',s+1.8,l2*LW);return {free:lanesFree([l,l2]),len:3}}return {free:lanesFree([l]),len:1.2}}
 if(p==='mug'){const side=r()<.5?-1:1;add(G,seg,'mug',s,side*.625);return {free:[side>0?-1:1],len:2.4}}
 return {free:[-1,0,1],len:1}}
function fill(G,seg,first){const r=G.rnd;let s=first?32:TW/2+6;const end=seg.L-TW-6;let prevFree=[-1,0,1];
 while(true){const f=clamp((seg.d0+s)/2600,0,1),v=speedAt(seg.d0+s),gap=Math.max(7,v*(1.05+r()*.65-.25*f));
  if(s+3>end)break;
  const res=row(G,seg,s,f);
  // pièces : en ligne dans un couloir libre avant la rangée, ou en arc au-dessus d'un saut
  if(r()<.55){const both=res.free.filter(l=>prevFree.includes(l)),lane=both.length?pick(r,both):null;
   if(lane!=null){const a=s-gap+2.2,b=s-2.2;for(let q=a;q<=b;q+=1.25)coin(G,seg,q,lane)}}
  if(res.arc&&r()<.6){const lane=pick(r,[-1,0,1]);for(let q=-2.5;q<=2.5;q+=1.25)coin(G,seg,s+q,lane,.55+1.05*(1-(q/2.9)**2))}
  // bonus et subventions, dans un couloir libre, entre deux rangées
  if(res.free.length&&r()<.05+.02*f&&s+gap/2<end){add(G,seg,'power',s+gap/2,pick(r,res.free)*LW,{pw:pick(r,['magnet','magnet','mult','mult','shield','jet','cash'])})}
  else if(res.free.length&&seg.d0+s-G.lastLife>650&&r()<.08&&s+gap/2<end){G.lastLife=seg.d0+s;add(G,seg,'life',s+gap/2,pick(r,res.free)*LW)}
  prevFree=res.free.length?res.free:[-1,0,1];s+=gap+res.len*.5}
 seg.items.sort((a,b)=>a.s-b.s);
 // jointures entre ramettes (décor), hors des trous
 for(let q=seg.draw+8+r()*5;q<seg.L-2;q+=8+r()*7)if(!seg.gaps.some(([a,b])=>q>a-.5&&q<b+.5))seg.seams.push(q)}
function nextOrigin(seg){return worldOf(seg,junction(seg),0)}
function extend(G){let guard=0;
 while(guard++<6){const last=G.segs[G.segs.length-1];
  if(last.turn==='T'){if(!last.branches){const o=nextOrigin(last),d0=last.d0+junction(last);last.branches={L:newSeg(G,o,turnDir(last.d,'L'),d0),R:newSeg(G,o,turnDir(last.d,'R'),d0)}}break}
  const ahead=G.segs.reduce((a,sg,i)=>a+(i===0?sg.L-G.p.s:sg.L),0);if(ahead>170)break;
  G.segs.push(newSeg(G,nextOrigin(last),turnDir(last.d,last.turn),last.d0+junction(last)))}}

export function newRun(seed=Date.now()){const G={seed,rnd:rng(seed),t:0,dist:0,coins:0,score:0,lives:START_LIVES,nextId:1,lastLife:300,
  segs:[],prev:null,speed:0,speedK:1,started:false,
  p:{s:3,x:0,lane:0,fromLane:0,y:0,vy:0,slide:0,state:'idle',inv:0,safe:0,slowT:0,downT:0,why:null,jumpBuf:0,yaw:0},
  chase:{d:5,close:0},power:{magnet:0,mult:0,shield:0,jet:0},turnQ:null,events:[],trail:[],travelled:0,streak:0,streakT:0,dodged:0};
 G.segs.push(newSeg(G,[0,0],0,0,true));extend(G);G.p.yaw=0;return G}
export function start(G){G.started=true;G.p.state='run';G.speedK=.45;G.chase.d=3.2;G.chase.close=0}

// position et cap du héros dans le monde
export function heroWorld(G){const seg=G.segs[0];return worldOf(seg,G.p.s,G.p.x)}
export function laneOk(l){return l>=-1&&l<=1}

function inWindow(G){const seg=G.segs[0],J=junction(seg);return G.p.s>=J-9}
export function act(G,a){const p=G.p;if(p.state!=='run'&&p.state!=='air')return;const seg=G.segs[0];
 if(a==='left'||a==='right'){const dir=a==='left'?'L':'R';
  if(G.power.jet>0)return;
  if(inWindow(G)&&allowed(seg,dir)){G.turnQ=dir;return}
  const nl=p.lane+(a==='left'?-1:1);if(laneOk(nl)){p.fromLane=p.lane;p.lane=nl;G.events.push({t:'lane'})}return}
 if(a==='up'){if(p.y<=.001&&p.vy<=0){p.vy=JUMP_V;p.slide=0;G.events.push({t:'jump'})}else p.jumpBuf=.18;return}
 if(a==='down'){if(p.y>.001){p.vy=Math.min(p.vy,-13);p.slideBuf=.35}else{p.slide=SLIDE_T;G.events.push({t:'slide'})}}}

function doTurn(G,dir){const seg=G.segs[0],p=G.p,next=seg.turn==='T'?seg.branches[dir]:G.segs[1];if(!next)return false;
 const P=worldOf(seg,p.s,p.x),[dx,dz]=DIRS[next.d],[rx,rz]=rightOf(next.d),vx=P[0]-next.o[0],vz=P[1]-next.o[1];
 p.s=vx*dx+vz*dz;p.x=vx*rx+vz*rz;p.lane=clamp(Math.round(p.x/LW),-1,1);p.fromLane=p.lane;
 G.prev=seg;G.segs=seg.turn==='T'?[next]:G.segs.slice(1);G.turnQ=null;G.events.push({t:'turn',dir});extend(G);return true}

function loseLife(G,why){const p=G.p;if(p.state==='down'||p.state==='over')return;G.lives--;p.state='down';p.downT=0;p.why=why;G.chase.close=0;G.turnQ=null;G.events.push({t:why});G.streak=0}
function respawn(G){const p=G.p,seg=G.segs[0];
 if(p.why==='fall'){const g=seg.gaps.find(([a,b])=>p.s>a-1&&p.s<b+1);if(g)p.s=g[1]+.8;else if(p.s>seg.L-.5){const dir=seg.turn==='T'?'L':seg.turn;p.s=junction(seg);p.x=0;doTurn(G,dir);p.s=TW/2+.5;p.x=p.lane*LW}}
 if(p.why==='hole'){const h=G.segs[0].items.find(it=>it.k==='hole'&&Math.abs(it.s-p.s)<1.5);p.s=(h?h.s:p.s)+.9}
 const s0=G.segs[0];for(const it of s0.items)if(it.k!=='coin'&&it.k!=='power'&&it.k!=='life'&&it.k!=='gap'&&it.s>p.s-1.5&&it.s<p.s+14)it.gone=true;
 p.x=p.lane*LW;p.y=0;p.vy=0;p.slide=0;p.inv=2.6;p.state='run';p.why=null;G.chase.d=2.2;G.chase.close=0;G.speedK=.6;G.events.push({t:'respawn'})}

function onPaper(seg,s){if(s<seg.start-.2||s>seg.L+.05)return false;return !seg.gaps.some(([a,b])=>s>a+.15&&s<b-.15)}
function stumble(G,it){const p=G.p;if(p.inv>0)return;if(G.chase.close>0){loseLife(G,'caught');return}G.chase.close=7;p.slowT=.6;G.events.push({t:'stumble',k:it?.k})}

export function step(G,dt,input=[]){G.t+=dt;const p=G.p,ev=G.events;
 for(const a of input)act(G,a);
 if(p.state==='idle')return;
 if(p.state==='down'){p.downT+=dt;if(p.why==='fall'){p.vy-=GRAV*dt;p.y=Math.max(-REAM+.2,p.y+p.vy*dt);if(p.downT<.5)p.s+=G.speed*dt*.6}
  G.chase.d+=(.9-G.chase.d)*Math.min(1,dt*3);
  if(p.downT>1.8){if(G.lives>0)respawn(G);else{p.state='over';ev.push({t:'over'})}}return}
 if(p.state==='over')return;
 const seg=G.segs[0];
 // vitesse
 G.speedK=Math.min(1,G.speedK+dt*.35);p.slowT=Math.max(0,p.slowT-dt);
 G.speed=speedAt(G.dist)*G.speedK*(p.slowT>0?.72:1)*(G.power.jet>0?1.25:1);
 const ds=G.speed*dt;p.s+=ds;G.dist+=ds;G.travelled+=ds;
 for(const k in G.power)if(G.power[k]>0){G.power[k]=Math.max(0,G.power[k]-dt);if(!G.power[k]){ev.push({t:'powerEnd',pw:k});if(k==='jet'){p.safe=1.4;p.vy=0}}}
 p.inv=Math.max(0,p.inv-dt);p.safe=Math.max(0,p.safe-dt);p.jumpBuf=Math.max(0,p.jumpBuf-dt);p.slideBuf=Math.max(0,(p.slideBuf||0)-dt);
 G.streakT=Math.max(0,G.streakT-dt);if(!G.streakT)G.streak=0;
 // latéral
 p.x+=(p.lane*LW-p.x)*Math.min(1,dt*15);
 // vertical
 const ground=p.safe>0||G.power.jet>0||onPaper(seg,p.s)&&!holeUnder(G,seg);
 if(G.power.jet>0){p.y+=(2.9-p.y)*Math.min(1,dt*3);p.vy=0}
 else{p.vy-=GRAV*dt;p.y+=p.vy*dt;
  if(p.y<=0&&ground&&p.y>-.35){if(p.vy<-1)ev.push({t:'land'});p.y=0;p.vy=0;if(p.jumpBuf>0){p.vy=JUMP_V;p.jumpBuf=0;ev.push({t:'jump'})}else if(p.slideBuf>0){p.slide=SLIDE_T;p.slideBuf=0;ev.push({t:'slide'})}}
  if(p.y<-.35){loseLife(G,holeUnder(G,seg)?'hole':'fall');return}}
 p.state=p.y>.001?'air':'run';p.slide=Math.max(0,p.slide-dt);
 // virages : le geste est retenu en approche, le virage se fait au centre du carrefour
 const J=junction(seg);
 if(G.power.jet>0&&p.s>=J-.3&&!G.turnQ)G.turnQ=seg.turn==='T'?(G.rnd()<.5?'L':'R'):seg.turn;
 if(G.turnQ&&p.s>=J-.3){doTurn(G,G.turnQ);return}
 if(p.s>seg.L-.05){p.vy=Math.min(p.vy,0);loseLife(G,'fall');return}
 if(G.turnQ&&p.s<J-9)G.turnQ=null;
 collide(G,seg);
 // poursuite : les agents se rapprochent après un faux pas, puis se laissent distancer
 G.chase.close=Math.max(0,G.chase.close-dt);const target=G.chase.close>0?1.9:16;G.chase.d+=(target-G.chase.d)*Math.min(1,dt*(target<G.chase.d?4:.45));
 // traînée pour placer les agents derrière
 const last=G.trail[G.trail.length-1];if(!last||G.travelled-last.tr>.15){const w=heroWorld(G);G.trail.push({x:w[0],z:w[1],d:seg.d,tr:G.travelled});if(G.trail.length>160)G.trail.shift()}
 G.score=Math.floor(G.scoreF=(G.scoreF||0)+ds*(G.power.mult>0?2:1));
 if(G.prev&&p.s>45)G.prev=null}
function holeUnder(G,seg){const p=G.p;return seg.items.some(it=>it.k==='hole'&&!it.gone&&Math.abs(it.s-p.s)<it.len/2-.12&&Math.abs(it.x-p.x)<it.w/2-.12)}
function collide(G,seg){const p=G.p,jet=G.power.jet>0,hh=p.slide>0?SLIDE_H:HERO_H;
 for(const it of seg.items){if(it.gone||it.taken)continue;const dsn=it.s-p.s;if(dsn>3.5)break;if(dsn<-3)continue;
  const K=KINDS[it.k];
  if(it.k==='coin'){const mag=G.power.magnet>0||jet;
   if(mag&&Math.abs(dsn)<4.5&&Math.abs(it.x-p.x)<4)it.pull=Math.min(1,(it.pull||0)+.08);
   if(Math.abs(dsn)<.6+(it.pull?.6:0)&&(Math.abs(it.x-p.x)<.6||it.pull>.5)&&(Math.abs(it.y-(p.y+.5))<.85||it.pull>.5||jet)){it.taken=true;G.streak++;G.streakT=1.2;const m=G.power.mult>0?2:1;G.coins++;G.scoreF=(G.scoreF||0)+5*m;G.events.push({t:'coin',n:G.streak})}continue}
  if(it.k==='power'||it.k==='life'){if(Math.abs(dsn)<.8&&Math.abs(it.x-p.x)<.75&&p.y<1.6){it.taken=true;
    if(it.k==='life'){G.lives=Math.min(MAX_LIVES,G.lives+1);G.events.push({t:'life'})}
    else if(it.pw==='cash'){G.coins+=25;G.scoreF=(G.scoreF||0)+125;G.events.push({t:'power',pw:'cash'})}
    else{G.power[it.pw]=POWERS[it.pw];if(it.pw==='jet'){addAirCoins(G,seg)}G.events.push({t:'power',pw:it.pw})}}continue}
  if(!K||jet||it.k==='gap')continue;
  if(Math.abs(dsn)>it.len/2+.28||Math.abs(it.x-p.x)>it.w/2+.26)continue;
  if(K.hole)continue;
  if(K.sticky){if(p.y<.05&&!it.hit){it.hit=true;stumble(G,it)}continue}
  if(p.inv>0)continue;
  let hit=false;
  if(K.solid)hit=p.y<K.h-.03;
  else if(K.bridge)hit=p.y<K.top&&p.y+hh>K.low;
  else if(K.stamp)hit=p.y+hh>stampBottom(it,G.t)&&p.y<2.6;
  if(!hit){if(!it.passed&&dsn<-it.len/2){it.passed=true}continue}
  // choc de côté en changeant de couloir : on rebondit et on trébuche
  if(K.solid&&!K.across&&Math.abs(p.x-p.lane*LW)>.3&&p.lane!==p.fromLane&&Math.abs(it.x-p.lane*LW)<it.w/2+.1){p.lane=p.fromLane;stumble(G,it);continue}
  if(G.power.shield>0){G.power.shield=0;it.gone=true;p.inv=.8;G.events.push({t:'shield',k:it.k});continue}
  loseLife(G,'crash');G.events.push({t:'crashInto',k:it.k});return}}
function addAirCoins(G,seg){const p=G.p,end=Math.min(seg.L-TW-1,p.s+G.speed*1.25*POWERS.jet);for(let q=p.s+5;q<end;q+=1.4)seg.items.push({id:G.nextId++,k:'coin',s:q,x:0,y:2.9+.3,len:.6,w:.6,air:true});seg.items.sort((a,b)=>a.s-b.s)}

// position des agents : sur la traînée du héros, à distance d derrière
export function agentsWorld(G,n=3){const out=[],tr=G.trail;if(!tr.length)return out;
 for(let i=0;i<n;i++){const want=G.travelled-G.chase.d-i*1.0;let k=tr.length-1;while(k>0&&tr[k].tr>want)k--;const a=tr[k],b=tr[Math.min(tr.length-1,k+1)];
  const u=b.tr>a.tr?clamp((want-a.tr)/(b.tr-a.tr),0,1):0;const dir=b.d;const [rx,rz]=rightOf(dir);const off=(i===0?0:i===1?-.7:.7);
  let x=a.x+(b.x-a.x)*u,z=a.z+(b.z-a.z)*u;if(want<tr[0].tr){const back=tr[0].tr-want,[dx,dz]=DIRS[tr[0].d];x=tr[0].x-dx*back;z=tr[0].z-dz*back}
  out.push({x:x+rx*off,z:z+rz*off,d:dir})}
 return out}

// ---- bot (tests) : regarde devant, change de couloir, saute, glisse, tourne
export function bot(G){const p=G.p,seg=G.segs[0];if(p.state!=='run'&&p.state!=='air')return [];
 const out=[],J=junction(seg);
 if(p.s>J-8&&!G.turnQ&&G.power.jet<=0){return [seg.turn==='R'?'right':'left']}
 const v=G.speed,H=v*1.15+2.5;
 const threat=(lane,from,to)=>{let first=null;for(const it of seg.items){if(it.gone||it.taken)continue;const K=KINDS[it.k];const ds=it.s-p.s;if(ds<from||ds>to)continue;
   if(it.k==='gap'){if(!first)first={it,ds,act:'up'};continue}
   if(!K)continue;if(Math.abs(it.x-lane*LW)>it.w/2+.27)continue;
   let need=null;if(K.hole)need='up';else if(K.sticky)need='sticky';else if(K.solid)need=K.h<.8?'up':'block';else if(K.bridge)need='down';else if(K.stamp)need='block';
   if(need&&(!first||ds<first.ds))first={it,ds,act:need}}return first};
 const cost=l=>{const t=threat(l,-.6,H);if(!t)return 0;if(t.act==='block')return 100-t.ds;if(t.act==='sticky')return 30;return 1};
 const cur=cost(p.lane);
 if(cur>=1){let best=p.lane,bc=cur;for(const l of [-1,0,1])if(l!==p.lane){const c=Math.max(cost(l),Math.abs(l-p.lane)>1?cost(p.lane+Math.sign(l-p.lane))*.3:0)+Math.abs(l-p.lane)*.5;if(c<bc&&!sideBlocked(G,seg,p.lane+Math.sign(l-p.lane))){bc=c;best=l}}
  if(best!==p.lane&&bc<cur-.4&&Math.abs(p.x-p.lane*LW)<.25)return [best<p.lane?'left':'right']}
 const t=threat(p.lane,-.3,v*.5+1.6);
 if(t){const lead=t.act==='up'||t.act==='sticky'?(t.it.k==='gap'?v*.17+t.it.len/2:v*.2+t.it.len/2-.2):v*.12+.6;
  if((t.act==='up'||t.act==='sticky')&&t.ds<lead&&p.y<=.001)out.push('up');
  if(t.act==='down'&&t.ds<lead&&p.slide<=.15)out.push('down')}
 return out}
function sideBlocked(G,seg,l){const p=G.p;return seg.items.some(it=>!it.gone&&KINDS[it.k]?.solid&&!KINDS[it.k].across&&Math.abs(it.s-p.s)<it.len/2+.6&&Math.abs(it.x-l*LW)<it.w/2+.3)}
