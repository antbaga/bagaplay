// BagaStore : routes en lignes.
// Une ligne = une voie à sens unique de 2 cases de large, tracée sur les coins de cases (segments droits ou à 45°, angles arrondis).
// Le sens de circulation est celui du tracé ; un double sens, ce sont deux lignes côte à côte.
// Une ligne dont un bout touche une autre ligne s'y raccorde (insertion ou sortie) ; deux lignes qui se croisent font un carrefour.
// Les véhicules roulent sur ces lignes (position = distance le long de la ligne), jamais sur une grille.
import * as D from './store-data.js';
const W=D.LOT_W,H=D.LOT_H,N=W*H;
const idx=(x,y)=>y*W+x,inLot=(x,y)=>x>=0&&y>=0&&x<W&&y<H;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const LANE_COST=100;             // € par mètre de voie
export const RING_R=[3,4,5];             // rayons de rond-point (axe de la voie)
export const EXT=12;                     // prolongement hors du terrain des lignes qui en sortent
export const STEP=.2;                    // pas d'échantillonnage le long des lignes
const SNAP=.75;                          // tolérance de raccordement d'un bout de ligne sur une autre
const FIL=1.6;                           // longueur des raccords arrondis
const NEAR=1.9;                          // deux voies plus proches que ça : zone de conflit
export const VDIM={car:[1.3,.58,0],truck:[3.75,.95,-.5],bus:[5.6,1.02,0]};

// ---------------------------------------------------------------- géométrie
const len2=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1]);
const unit=(a,b)=>{const l=len2(a,b)||1;return [(b[0]-a[0])/l,(b[1]-a[1])/l]};
export const onBorder=([x,y])=>x<=0||y<=0||x>=W||y>=H;
const outside=([x,y])=>x<0||y<0||x>W||y>H;
// sens d'un segment arrondi à 8 directions
export const DIR8=[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
export function dir8(a,b){const dx=b[0]-a[0],dy=b[1]-a[1];if(!dx&&!dy)return -1;const k=Math.round(Math.atan2(dy,dx)/(Math.PI/4));return (k+8)%8}
// point de la grille le plus proche de b dans l'une des 8 directions depuis a
export function snapSeg(a,b){const k=dir8(a,b);if(k<0)return [a[0],a[1]];const [dx,dy]=DIR8[k],L=dx&&dy?2:1;
 const t=Math.max(0,Math.round(((b[0]-a[0])*dx+(b[1]-a[1])*dy)/L));return [a[0]+dx*t,a[1]+dy*t]}
function ringPts(r){const o=[],n=Math.max(36,Math.round(r.r*14));for(let k=0;k<n;k++){const t=2*Math.PI*k/n;o.push([r.cx+r.r*Math.cos(t),r.cy-r.r*Math.sin(t)])}return o}
// ligne de base : points + prolongements hors du terrain
function basePoly(l){if(l.ring)return {pts:ringPts(l.ring),closed:true};
 const p=l.pts.map(q=>[q[0],q[1]]);let pre=0,post=0;
 if(p.length>=2&&onBorder(p[0])){const d=unit(p[0],p[1]),q=[p[0][0]-d[0]*.5,p[0][1]-d[1]*.5];if(outside(q)){p.unshift([p[0][0]-d[0]*EXT,p[0][1]-d[1]*EXT]);pre=EXT}}
 const n=p.length;if(n>=2&&onBorder(p[n-1])){const d=unit(p[n-2],p[n-1]),q=[p[n-1][0]+d[0]*.5,p[n-1][1]+d[1]*.5];if(outside(q)){p.push([p[n-1][0]+d[0]*EXT,p[n-1][1]+d[1]*EXT]);post=EXT}}
 return {pts:p,closed:false,pre,post}}
// polyligne dense aux angles arrondis
function smooth(p,closed){const n=p.length;if(n<2)return p.slice();const o=[];
 const corner=(a,b,c,first,last)=>{const l1=len2(a,b),l2=len2(b,c),cut=Math.min(FIL,l1*(first?.9:.5),l2*(last?.9:.5));
  const d1=unit(a,b),d2=unit(b,c);if(d1[0]*d2[0]+d1[1]*d2[1]>.999){o.push(b);return}
  const P=[b[0]-d1[0]*cut,b[1]-d1[1]*cut],Q=[b[0]+d2[0]*cut,b[1]+d2[1]*cut];for(let k=0;k<=8;k++){const t=k/8,u=1-t;o.push([u*u*P[0]+2*u*t*b[0]+t*t*Q[0],u*u*P[1]+2*u*t*b[1]+t*t*Q[1]])}};
 if(closed){for(let i=0;i<n;i++)o.push(p[i]);o.push(p[0]);return o}
 o.push(p[0]);for(let i=1;i<n-1;i++)corner(p[i-1],p[i],p[i+1],i===1,i===n-2);o.push(p[n-1]);return o}
// rééchantillonnage régulier
function resample(dense){const xs=[],zs=[];let acc=0,next=0;xs.push(dense[0][0]);zs.push(dense[0][1]);
 for(let i=1;i<dense.length;i++){const a=dense[i-1],b=dense[i],l=len2(a,b);if(l<1e-6)continue;
  while(next+STEP<=acc+l+1e-9){next+=STEP;const t=(next-acc)/l;xs.push(a[0]+(b[0]-a[0])*t);zs.push(a[1]+(b[1]-a[1])*t)}acc+=l}
 const n=xs.length,as=new Float32Array(n);for(let i=0;i<n;i++){const j=Math.min(n-1,i+1),k=Math.max(0,i-1);as[i]=Math.atan2(xs[j]-xs[k],zs[j]-zs[k])}
 return {xs:Float32Array.from(xs),zs:Float32Array.from(zs),as,n,len:(n-1)*STEP}}
// position sur une ligne (s en mètres)
export function pos(g,s){if(g.closed)s=((s%g.len)+g.len)%g.len;else s=clamp(s,0,g.len);const f=s/STEP,i=Math.min(g.n-2,Math.floor(f)),t=f-i;
 const x=g.xs[i]+(g.xs[i+1]-g.xs[i])*t,z=g.zs[i]+(g.zs[i+1]-g.zs[i])*t;let a0=g.as[i],a1=g.as[i+1],da=a1-a0;while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;return {x,z,ang:a0+da*t}}
// point le plus proche sur une ligne
export function proj(g,x,z,s0=0,s1=g.len){let best=1e9,bs=0;const i0=Math.max(0,Math.floor(s0/STEP)),i1=Math.min(g.n-1,Math.ceil(s1/STEP));
 for(let i=i0;i<=i1;i++){const d=(g.xs[i]-x)**2+(g.zs[i]-z)**2;if(d<best){best=d;bs=i*STEP}}return {s:bs,d:Math.sqrt(best)}}
// distance vers l'avant de a à b sur une ligne (boucle : modulo)
const fwd=(g,a,b)=>g.closed?((b-a)%g.len+g.len)%g.len:b-a;

// ---------------------------------------------------------------- réseau (géométrie finale, raccords, carrefours, raster)
export const roadsChanged=S=>{S._RN=null};
export function net(S){if(S._RN)return S._RN;const lanes=S.lanes||[],base=new Map();
 for(const l of lanes){const b=basePoly(l);b.dense=smooth(b.pts,b.closed);b.g=resample(b.dense);b.g.closed=b.closed;base.set(l.id,b)}
 // raccords : un bout de ligne posé sur une autre ligne
 const att=[];const onLane=(p,self,end)=>{let best=null;for(const l of lanes){const g=base.get(l.id).g;let q;if(l.id===self){q=end==='end'?proj(g,p[0],p[1],0,g.len-4):proj(g,p[0],p[1],4,g.len);if(g.len<10)continue}else q=proj(g,p[0],p[1]);if(q.d<=SNAP&&(!best||q.d<best.d))best={id:l.id,s:q.s,d:q.d}}return best};
 for(const l of lanes){if(l.ring)continue;const p=l.pts;const a=onLane(p[0],l.id,'start'),b=onLane(p[p.length-1],l.id,'end');
  // bout à bout dans le même sens : simple continuation (pas d'arrondi), on garde le raccord
  if(a)att.push({lane:l.id,end:'start',to:a.id,s:a.s});if(b)att.push({lane:l.id,end:'end',to:b.id,s:b.s})}
 // géométrie finale : les bouts raccordés s'arrondissent vers la ligne d'accueil
 const geo=new Map();
 for(const l of lanes){const b=base.get(l.id);if(l.ring){geo.set(l.id,b.g);continue}let d=b.dense.slice();
  for(const a of att.filter(q=>q.lane===l.id)){const tg=base.get(a.to).g,P=pos(tg,a.s),t=[Math.sin(P.ang),Math.cos(P.ang)];
   if(a.end==='end'){const n=d.length,dl=unit(d[n-2],d[n-1]);if(dl[0]*t[0]+dl[1]*t[1]>.97)continue;const c=Math.min(FIL,lenOf(d)*.45),cut=cutEnd(d,c),Q=cut[cut.length-1],R=[P.x+t[0]*c,P.z+t[1]*c];
    d=cut.concat(bez2(Q,[P.x,P.z],R))}
   else{const dl=unit(d[0],d[1]);if(dl[0]*t[0]+dl[1]*t[1]>.97)continue;const c=Math.min(FIL,lenOf(d)*.45),cut=cutStart(d,c),Q=cut[0],R0=[P.x-t[0]*c,P.z-t[1]*c];
    d=bez2(R0,[P.x,P.z],Q).concat(cut.slice(1))}}
  const g=resample(d);g.closed=false;geo.set(l.id,g)}
 for(const l of lanes){const g=geo.get(l.id),b=base.get(l.id);g.id=l.id;g.ring=!!l.ring;g.pre=b.pre||0;g.post=b.post||0}
 // passages d'une ligne à l'autre
 const trans=[];
 for(const a of att){const g=geo.get(a.lane),tg=geo.get(a.to);
  if(a.end==='end'){const P=pos(g,g.len),q=proj(tg,P.x,P.z);trans.push({from:a.lane,sf:g.len,to:a.to,st:q.s,kind:'merge'})}
  else{const P=pos(g,0),q=proj(tg,P.x,P.z);trans.push({from:a.to,sf:q.s,to:a.lane,st:0,kind:'split'})}}
 // entrées et sorties du terrain
 const entries=[],exits=[];for(const l of lanes){const g=geo.get(l.id);if(g.pre)entries.push({lane:l.id,s:0});if(g.post)exits.push({lane:l.id,s:g.len})}
 // cédez-le-passage : posés sur une ligne
 const yields=new Map();for(const y of S.yields||[]){const g=geo.get(y.lane);if(!g)continue;const q=proj(g,y.x,y.y);if(q.d>1.2)continue;(yields.get(y.lane)||yields.set(y.lane,[]).get(y.lane)).push(q.s)}
 // raster : cases couvertes par une voie (2 de large)
 const raster=new Uint8Array(N),owner=new Int32Array(N);
 for(const g of geo.values())for(let i=0;i<g.n;i++){const x=g.xs[i],z=g.zs[i];for(let cy=Math.floor(z-1.1);cy<=Math.floor(z+1.1);cy++)for(let cx=Math.floor(x-1.1);cx<=Math.floor(x+1.1);cx++){
  if(!inLot(cx,cy))continue;const dx=cx+.5-x,dz=cy+.5-z;if(dx*dx+dz*dz<=1.06*1.06){raster[idx(cx,cy)]=1;if(!owner[idx(cx,cy)])owner[idx(cx,cy)]=g.id}}}
 const NT={geo,trans,entries,exits,yields,raster,owner,att};NT.zones=zones(NT);NT.adj=adjacency(NT);S._RN=NT;return NT}
const lenOf=d=>{let l=0;for(let i=1;i<d.length;i++)l+=len2(d[i-1],d[i]);return l};
function cutEnd(d,c){let l=0;for(let i=d.length-1;i>0;i--){const s=len2(d[i-1],d[i]);if(l+s>=c){const t=(c-l)/s;return d.slice(0,i).concat([[d[i][0]+(d[i-1][0]-d[i][0])*t,d[i][1]+(d[i-1][1]-d[i][1])*t]])}l+=s}return [d[0]]}
function cutStart(d,c){let l=0;for(let i=1;i<d.length;i++){const s=len2(d[i-1],d[i]);if(l+s>=c){const t=(c-l)/s;return [[d[i-1][0]+(d[i][0]-d[i-1][0])*t,d[i-1][1]+(d[i][1]-d[i-1][1])*t]].concat(d.slice(i))}l+=s}return [d[d.length-1]]}
function bez2(a,c,b){const o=[];for(let k=0;k<=10;k++){const t=k/10,u=1-t;o.push([u*u*a[0]+2*u*t*c[0]+t*t*b[0],u*u*a[1]+2*u*t*c[1]+t*t*b[1]])}return o}

// zones de conflit : deux voies qui se touchent (insertion, sortie, croisement)
function zones(NT){const out=[],gs=[...NT.geo.values()],K=2;
 const bucket=new Map(),key=(x,z)=>(Math.floor(x/2)+100)*1000+Math.floor(z/2)+100;
 for(const g of gs)for(let i=0;i<g.n;i+=K){const k=key(g.xs[i],g.zs[i]);(bucket.get(k)||bucket.set(k,[]).get(k)).push([g.id,i])}
 const pairs=new Map();
 for(const g of gs)for(let i=0;i<g.n;i+=K){const x=g.xs[i],z=g.zs[i],bx=Math.floor(x/2),bz=Math.floor(z/2);
  for(let ox=-1;ox<=1;ox++)for(let oz=-1;oz<=1;oz++){const L=bucket.get((bx+ox+100)*1000+bz+oz+100);if(!L)continue;
   for(const [id,j] of L){if(id<g.id||(id===g.id&&(j<=i||(j-i)*STEP<5)))continue;const h=NT.geo.get(id),d=Math.hypot(h.xs[j]-x,h.zs[j]-z);if(d>=NEAR)continue;const pk=g.id+':'+id;(pairs.get(pk)||pairs.set(pk,[]).get(pk)).push([i*STEP,j*STEP])}}}
 for(const [pk,ps] of pairs){const [A,B]=pk.split(':').map(Number),ga=NT.geo.get(A),gb=NT.geo.get(B);ps.sort((p,q)=>p[0]-q[0]);
  const cl=[];for(const p of ps){const c=cl.find(c=>p[0]>=c.a0-1.01&&p[0]<=c.a1+1.01&&p[1]>=c.b0-1.01&&p[1]<=c.b1+1.01);
   if(c){c.a0=Math.min(c.a0,p[0]);c.a1=Math.max(c.a1,p[0]);c.b0=Math.min(c.b0,p[1]);c.b1=Math.max(c.b1,p[1])}else cl.push({a0:p[0],a1:p[0],b0:p[1],b1:p[1]})}
  for(const c of cl){const z={a:A,a0:c.a0,a1:c.a1,b:B,b0:c.b0,b1:c.b1,type:'cross',yside:null};
   const inA=v=>v>=c.a0-3&&v<=c.a1+3,inB=v=>v>=c.b0-3&&v<=c.b1+3;
   // raccords : celui qui s'insère cède ; à une sortie, personne ne cède (on suit ceux qui sortent)
   for(const t of NT.trans){
    if(t.kind==='merge'){if(t.from===B&&t.to===A&&inA(t.st)&&inB(t.sf)){z.type='merge';z.yside='b';break}if(t.from===A&&t.to===B&&inB(t.st)&&inA(t.sf)){z.type='merge';z.yside='a';break}}
    if(t.kind==='split'){if(t.from===A&&t.to===B&&inA(t.sf)&&inB(t.st)){z.type='split';break}if(t.from===B&&t.to===A&&inB(t.sf)&&inA(t.st)){z.type='split';break}}}
   if(z.type==='cross'){const ya=hasYield(NT,A,c.a0),yb=hasYield(NT,B,c.b0);
    if(ya!==yb)z.yside=ya?'a':'b';
    else{// priorité à droite
     const pa=pos(ga,(c.a0+c.a1)/2),pb=pos(gb,(c.b0+c.b1)/2),ta=[Math.sin(pa.ang),Math.cos(pa.ang)],tb=[Math.sin(pb.ang),Math.cos(pb.ang)],ra=[-ta[1],ta[0]];
     z.yside=tb[0]*ra[0]+tb[1]*ra[1]<0?'a':'b'}}
   z.yield=z.yside==='a'?A:z.yside==='b'?B:null;
   out.push(z)}}
 return out}
const hasYield=(NT,lane,s)=>(NT.yields.get(lane)||[]).some(y=>{const d=fwd(NT.geo.get(lane),y,s);return d>=-1&&d<=7});

// ---------------------------------------------------------------- itinéraires
// nœuds : (ligne, s) aux points de passage ; arêtes : avancer sur une ligne, ou passer sur une autre
function adjacency(NT){const pts=new Map();const add=(l,s)=>{(pts.get(l)||pts.set(l,[]).get(l)).push(s)};
 for(const [id,g] of NT.geo){add(id,0);if(!g.closed)add(id,g.len)}for(const t of NT.trans){add(t.from,t.sf);add(t.to,t.st)}
 for(const [l,a] of pts){a.sort((p,q)=>p-q);pts.set(l,[...new Set(a.map(v=>Math.round(v*100)/100))])}return pts}
// plus court chemin de (ligne, s) vers l'une des cibles [{lane,s}] ; renvoie les tronçons [{lane,from,len}] (mémorisé par réseau)
const atPt=(g,a,b)=>g.closed?Math.min(fwd(g,a,b),fwd(g,b,a))<.02:Math.abs(a-b)<.02;
export function route(NT,src,targets){const mk=src.lane+'@'+src.s.toFixed(2)+'>'+targets.map(t=>t.lane+'@'+t.s.toFixed(2)).join(',');NT.rc=NT.rc||new Map();
 if(NT.rc.has(mk)){const r=NT.rc.get(mk);return r&&r.map(x=>({...x}))}const r=route0(NT,src,targets);if(NT.rc.size>4000)NT.rc.clear();NT.rc.set(mk,r);return r&&r.map(x=>({...x}))}
function route0(NT,src,targets){const key=(l,s)=>l+'@'+(Math.round(s*100)/100);const tg=new Map();for(const t of targets)tg.set(t.lane,(tg.get(t.lane)||[]).concat([t.s]));
 const dist=new Map(),prev=new Map(),open=[];const push=(l,s,d,p)=>{const k=key(l,s);if(dist.has(k)&&dist.get(k)<=d)return;dist.set(k,d);prev.set(k,p);open.push([d,l,s])};
 if(!NT.geo.get(src.lane))return null;push(src.lane,src.s,0,null);let best=null;
 while(open.length){let bi=0;for(let i=1;i<open.length;i++)if(open[i][0]<open[bi][0])bi=i;const [d,l,s]=open.splice(bi,1)[0];if(dist.get(key(l,s))<d-1e-9)continue;
  if(best&&d>=best.d)break;const g=NT.geo.get(l);
  for(const ts of tg.get(l)||[]){const f=fwd(g,s,ts);if(f>=-1e-6&&(!best||d+f<best.d))best={d:d+Math.max(0,f),l,s,ts}}
  for(const p of NT.adj.get(l)||[]){const f=fwd(g,s,p);if(f<=1e-6)continue;push(l,p,d+f,{l,s,move:true})}
  for(const t of NT.trans)if(t.from===l&&atPt(g,s,t.sf))push(t.to,t.st,d+.01,{l,s,move:false})}
 if(!best)return null;
 const chain=[{l:best.l,s:best.s,how:null}];let k=key(best.l,best.s);
 while(true){const p=prev.get(k);if(!p)break;chain[0].how=p.move?'move':'jump';chain.unshift({l:p.l,s:p.s,how:null});k=key(p.l,p.s)}
 const out=[];let seg={lane:chain[0].l,from:chain[0].s};
 for(let i=1;i<chain.length;i++){if(chain[i].how!=='jump')continue;const g=NT.geo.get(seg.lane);seg.len=Math.max(0,fwd(g,seg.from,chain[i-1].s));out.push(seg);seg={lane:chain[i].l,from:chain[i].s}}
 seg.len=Math.max(0,fwd(NT.geo.get(seg.lane),seg.from,best.ts));out.push(seg);
 return out.filter((x,i)=>x.len>1e-6||i===out.length-1)}
export const routeLen=r=>r.reduce((t,s)=>t+s.len,0);

// ---------------------------------------------------------------- accès des places, du quai, de l'arrêt de bus
// point de voie au bord duquel donne un objet : F = milieu du bord (monde), f = direction vers la voie
export function access(S,F,f){const NT=net(S);let best=null;for(const g of NT.geo.values()){const q=proj(g,F[0]+f[0]*.3,F[1]+f[1]*.3);if(q.d>1.5)continue;const P=pos(g,q.s);
  if(Math.abs(Math.sin(P.ang)*f[0]+Math.cos(P.ang)*f[1])>.6)continue;if(!best||q.d<best.d)best={lane:g.id,s:q.s,d:q.d}}
 return best}
export function reachFrom(S,src){const NT=net(S);return !!route(NT,src,NT.exits)}
export function reachTo(S,dst){const NT=net(S);return NT.entries.some(e=>route(NT,e,[dst]))}

// ---------------------------------------------------------------- édition
const ptsCost=pts=>{let l=0;for(let i=1;i<pts.length;i++)l+=len2(pts[i-1],pts[i]);return Math.round(l*LANE_COST)};
export const laneCost=l=>l.ring?Math.round(2*Math.PI*l.ring.r*LANE_COST*1.3):ptsCost(l.pts);
const same=(a,b)=>a[0]===b[0]&&a[1]===b[1];
function cleanPts(p){const o=[];for(const q of p){if(o.length&&same(o[o.length-1],q))continue;o.push([q[0],q[1]])}
 for(let i=o.length-2;i>=1;i--){if(dir8(o[i-1],o[i])===dir8(o[i],o[i+1]))o.splice(i,1)}return o}
// cases de la grille couvertes par des points denses (pour vérifier la place)
function cellsOf(dense){const g=resample(dense),set=new Set();for(let i=0;i<g.n;i++){const x=g.xs[i],z=g.zs[i];for(let cy=Math.floor(z-1.1);cy<=Math.floor(z+1.1);cy++)for(let cx=Math.floor(x-1.1);cx<=Math.floor(x+1.1);cx++){
  if(!inLot(cx,cy))continue;const dx=cx+.5-x,dz=cy+.5-z;if(dx*dx+dz*dz<=1.06*1.06)set.add(idx(cx,cy))}}return [...set]}
// tracé d'une nouvelle ligne (points sur la grille) ; raccord automatique aux bouts d'autres lignes (prolongement)
export function lanePlan(S,pts,blocked){pts=cleanPts(pts);if(pts.length<2)return {why:'Trace une ligne plus longue.'};
 for(let i=1;i<pts.length;i++){const k=dir8(pts[i-1],pts[i]);if(k<0)return {why:'Trace une ligne plus longue.'};if(i>1){const k0=dir8(pts[i-2],pts[i-1]),dk=Math.min((k-k0+8)%8,(k0-k+8)%8);if(dk>2)return {why:'Virage trop serré : fais-le en deux fois.'}}}
 for(const p of pts)if(p[0]<0||p[1]<0||p[0]>W||p[1]>H)return {why:'Le terrain s’arrête ici.'};
 const lanes=S.lanes||[];let app=null,pre=null;
 for(const l of lanes){if(l.ring)continue;if(same(l.pts[l.pts.length-1],pts[0])&&!lanes.some(o=>o!==l&&!o.ring&&same(o.pts[0],pts[0])))app=l;if(same(l.pts[0],pts[pts.length-1])&&!lanes.some(o=>o!==l&&!o.ring&&same(o.pts[o.pts.length-1],pts[pts.length-1])))pre=l}
 if(app&&pre&&app===pre)pre=null;
 const cost=ptsCost(pts),cells=cellsOf(smooth(pts,false)),bad=blocked?cells.filter(blocked):[];
 if(bad.length)return {why:'Il y a quelque chose sur le passage (magasin, meuble ou arbre à couper).',cells,bad,cost,pts};
 return {pts,cells,cost,app:app&&app.id,pre:pre&&pre.id,why:null}}
export function addLane(S,p){const lanes=S.lanes||(S.lanes=[]);let pts=p.pts;
 const a=p.app!=null&&lanes.find(l=>l.id===p.app),b=p.pre!=null&&lanes.find(l=>l.id===p.pre);
 if(a){pts=a.pts.concat(pts.slice(1));lanes.splice(lanes.indexOf(a),1)}
 if(b){pts=pts.concat(b.pts.slice(1));lanes.splice(lanes.indexOf(b),1)}
 const id=S.laneNext=(S.laneNext||0)+1;const l={id,pts:cleanPts(pts)};lanes.push(l);
 // les cédez-le-passage des lignes fusionnées passent sur la nouvelle
 for(const y of S.yields||[])if((a&&y.lane===a.id)||(b&&y.lane===b.id))y.lane=id;
 roadsChanged(S);return l}
// rond-point : voie circulaire (sens inverse des aiguilles d'une montre, vu du ciel)
export function ringPlan(S,cx,cy,r,blocked){const ring={cx,cy,r};const cells=cellsOf(smooth(ringPts(ring),true)),isl=[];
 for(let y=Math.floor(cy-r);y<=cy+r;y++)for(let x=Math.floor(cx-r);x<=cx+r;x++){if(!inLot(x,y))continue;if(Math.hypot(x+.5-cx,y+.5-cy)<r-1.05)isl.push(idx(x,y))}
 if(cx-r-1<0||cy-r-1<0||cx+r+1>W||cy+r+1>H)return {why:'Le terrain s’arrête ici.',cells};
 const bad=blocked?cells.concat(isl).filter(blocked):[];if(bad.length)return {why:'Il y a quelque chose sur le passage (magasin, meuble ou arbre à couper).',cells,bad};
 return {ring,cells,island:isl,cost:laneCost({ring}),why:null}}
export function addRing(S,p){const lanes=S.lanes||(S.lanes=[]);const id=S.laneNext=(S.laneNext||0)+1;const l={id,ring:p.ring};lanes.push(l);roadsChanged(S);return l}
// raccourcir une ligne par un bout : nouveau bout = point de la ligne le plus proche de (x,y)
export function trimPlan(S,id,end,x,y){const l=(S.lanes||[]).find(o=>o.id===id);if(!l||l.ring)return {why:'Introuvable.'};
 // points de la grille le long de la ligne
 const seq=[];for(let i=0;i<l.pts.length-1;i++){const a=l.pts[i],b=l.pts[i+1],k=dir8(a,b),[dx,dy]=DIR8[k],n=Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]));for(let t=0;t<n;t++)seq.push({p:[a[0]+dx*t,a[1]+dy*t],seg:i})}
 seq.push({p:l.pts[l.pts.length-1],seg:l.pts.length-2});
 let bi=0,bd=1e9;seq.forEach((q,i)=>{const d=Math.hypot(q.p[0]-x,q.p[1]-y);if(d<bd){bd=d;bi=i}});
 let pts;if(end==='end'){if(bi<1)return {why:'Une ligne fait au moins 1 case.'};const q=seq[bi];pts=l.pts.slice(0,q.seg+1).concat([q.p])}
 else{if(bi>seq.length-2)return {why:'Une ligne fait au moins 1 case.'};const q=seq[bi];pts=[q.p].concat(l.pts.slice(q.seg+1))}
 pts=cleanPts(pts);if(pts.length<2)return {why:'Une ligne fait au moins 1 case.'};
 const refund=Math.round((ptsCost(l.pts)-ptsCost(pts))*D.REFUND);return {pts,refund,why:refund>0?null:'Rien à raccourcir.'}}
export function trimLane(S,id,p){const l=S.lanes.find(o=>o.id===id);l.pts=p.pts;roadsChanged(S)}
export function removeLane(S,id){const k=(S.lanes||[]).findIndex(o=>o.id===id);if(k<0)return 0;const l=S.lanes[k];S.lanes.splice(k,1);S.yields=(S.yields||[]).filter(y=>y.lane!==id);roadsChanged(S);return Math.round(laneCost(l)*D.REFUND)}
export function reverseLane(S,id){const l=(S.lanes||[]).find(o=>o.id===id);if(!l||l.ring)return 'Un rond-point tourne toujours dans le même sens.';l.pts.reverse();roadsChanged(S);return null}
// ligne la plus proche d'un point (x,z en mètres), et bout éventuel
export function laneAt(S,x,z,max=1.15){const NT=net(S);let best=null;for(const g of NT.geo.values()){const q=proj(g,x,z);if(q.d<=max&&(!best||q.d<best.d))best={id:g.id,s:q.s,d:q.d}}
 if(!best)return null;const l=S.lanes.find(o=>o.id===best.id);best.ring=!!l.ring;
 if(!l.ring){const a=l.pts[0],b=l.pts[l.pts.length-1];if(Math.hypot(a[0]-x,a[1]-z)<=1.1)best.end='start';else if(Math.hypot(b[0]-x,b[1]-z)<=1.1)best.end='end'}return best}
export const laneCells=(S,id)=>{const NT=net(S),g=NT.geo.get(id);if(!g)return [];const set=new Set();for(let i=0;i<g.n;i+=2){const x=g.xs[i],z=g.zs[i];for(let cy=Math.floor(z-1.1);cy<=Math.floor(z+1.1);cy++)for(let cx=Math.floor(x-1.1);cx<=Math.floor(x+1.1);cx++){if(!inLot(cx,cy))continue;const dx=cx+.5-x,dz=cy+.5-z;if(dx*dx+dz*dz<=1.06*1.06)set.add(idx(cx,cy))}}return [...set]};
// cédez-le-passage : posé sur une ligne, juste avant un carrefour
export function yieldAt(S,x,z){const q=laneAt(S,x,z);if(!q)return {why:'Pose le cédez-le-passage sur une ligne.'};if(q.ring)return {why:'Sur un rond-point, ce sont les voies qui arrivent qui cèdent déjà.'};
 const ex=(S.yields||[]).findIndex(y=>y.lane===q.id&&Math.hypot(y.x-x,y.y-z)<1.5);return {lane:q.id,s:q.s,remove:ex,why:null}}
export function setYield(S,x,z){const p=yieldAt(S,x,z);if(p.why)return p.why;const ys=S.yields||(S.yields=[]);if(p.remove>=0)ys.splice(p.remove,1);else{const P=pos(net(S).geo.get(p.lane),p.s);ys.push({lane:p.lane,x:+P.x.toFixed(2),y:+P.z.toFixed(2)})}roadsChanged(S);return null}

// ---------------------------------------------------------------- véhicules
// v : {id,kind,route:[{lane,from,len}],ri,u (distance parcourue dans le tronçon),sp (vitesse),lane,s,x,z,ang,…}
// b (bloc) : {lane,s,h} obstacle fixe sur une voie (voiture qui se gare ou sort de sa place)
export const half=v=>v.h!=null?v.h:(VDIM[v.kind]||VDIM.car)[0];
export function placeOn(NT,v){const sg=v.route[v.ri],g=NT.geo.get(sg.lane);if(!g)return;const P=pos(g,sg.from+v.u);v.lane=sg.lane;v.s=g.closed?((sg.from+v.u)%g.len+g.len)%g.len:sg.from+v.u;
 const off=(VDIM[v.kind]||VDIM.car)[2];v.x=P.x+Math.sin(P.ang)*off;v.z=P.z+Math.cos(P.ang)*off;v.ang=P.ang}
// distance le long de l'itinéraire de v jusqu'au point (lane, s) ; négative s'il est juste derrière ; null si pas sur son chemin
export function distTo(NT,v,lane,s,max=30){if(!v.route){if(v.lane!==lane)return null;const g=NT.geo.get(lane);if(!g)return null;let d=s-v.s;if(g.closed){d=fwd(g,v.s,s);if(d>g.len/2)d-=g.len}return d}
 let off=-v.u;for(let k=v.ri;k<v.route.length;k++){const sg=v.route[k],g=NT.geo.get(sg.lane);if(!g)return null;
  if(sg.lane===lane){let u=fwd(g,sg.from,s);const last=k===v.route.length-1,lim=last?sg.len+8:sg.len;if(g.closed&&u>lim+1e-6&&k===v.ri)u-=g.len;if(u<=lim+1e-6&&(u>=0||k===v.ri)){const d=off+u;if(d>=-14)return d}}
  off+=sg.len;if(off>max)return null}return null}
// un pas pour tous les véhicules qui roulent ; renvoie ceux qui sont au bout de leur itinéraire
export function drive(S,R,list,dt,agents){const NT=net(S),arrived=[],blocks=R.blocks||[],all=list.concat(blocks);
 for(const v of list){if(!v.route)continue;const my=half(v);let lim=v.vmax||5;v.why='';
  for(const o of all){if(o===v||o.lane==null)continue;const d=distTo(NT,v,o.lane,o.s,20);if(d==null||d<=0)continue;if(o.h===0&&d<my+.3)continue;const gap=d-my-half(o);if(gap<12){lim=Math.min(lim,Math.max(0,(gap-.7)*2.2));if(gap<.75){lim=0;v.why='suit '+o.id}}}
  const z=zoneCheck(NT,v,list,blocks);if(z!=null){const g=z-my-.4;lim=Math.min(lim,Math.max(0,g*2.2));if(g<.05){lim=0;v.why=v.why||'carrefour'}}
  if(agents&&lim>0)for(const a of agents){const q=aheadPt(NT,v,my+1);if(!q)break;if(Math.abs(a.x-q.x)<3.5&&Math.abs(a.y-q.z)<3.5&&pedBlocks(NT,v,a,my)){lim=0;v.why='piéton';break}}
  {const q0=aheadPt(NT,v,0),q=aheadPt(NT,v,3.2);if(q0&&q){let da=Math.abs(q.ang-q0.ang);while(da>Math.PI)da=Math.abs(da-2*Math.PI);if(da>.5)lim=Math.min(lim,2.6)}}
  v.sp=v.sp==null?lim:(lim<v.sp?lim:Math.min(lim,v.sp+6*dt));
  if(v.sp<.05)v.stopT=(v.stopT||0)+dt;else v.stopT=0;
  let b=v.sp*dt;while(b>0){const sg=v.route[v.ri],rest=sg.len-v.u;if(b<rest){v.u+=b;b=0}else{b-=rest;v.u=sg.len;if(v.ri<v.route.length-1){v.ri++;v.u=0}else b=0}}
  placeOn(NT,v);if(v.ri===v.route.length-1&&v.u>=v.route[v.ri].len-1e-6)arrived.push(v)}
 return arrived}
export function aheadPt(NT,v,d0){let k=v.ri,u=v.u+d0;while(k<v.route.length&&u>v.route[k].len){u-=v.route[k].len;k++}if(k>=v.route.length)return null;const sg=v.route[k];return pos(NT.geo.get(sg.lane),sg.from+u)}
function pedBlocks(NT,v,a,my){for(let d=my+.2;d<=my+2.2;d+=.5){const q=aheadPt(NT,v,d);if(!q)return false;if(Math.hypot(a.x-q.x,a.y-q.z)<1.05)return true}return false}
// carrefours à venir : distance jusqu'au début de la zone où il faut s'arrêter, sinon null
function zoneCheck(NT,v,list,blocks){let stop=null;const my=half(v);let off=-v.u;
 for(let k=v.ri;k<v.route.length&&off<16;k++){const sg=v.route[k],g=NT.geo.get(sg.lane);
  for(const z of NT.zones)for(const side of ['a','b']){const mine=side==='a'?z.a:z.b;if(mine!==sg.lane)continue;
   const a0=side==='a'?z.a0:z.b0,a1=side==='a'?z.a1:z.b1,other=side==='a'?z.b:z.a,o0=side==='a'?z.b0:z.a0,o1=side==='a'?z.b1:z.a1;
   let ua=fwd(g,sg.from,a0);if(g.closed&&ua>sg.len)ua-=g.len;const ub=ua+Math.max(0,a1-a0);if(ub<-1e-6||ua>sg.len+1e-6)continue;
   const dz=off+ua;if(dz-my<.3||dz-my>9)continue;// déjà engagé, ou encore loin
   const nx=v.route[k+1],onPath=other===mine?!!nx:((nx&&nx.lane===other)||(k>0&&v.route[k-1]&&v.route[k-1].lane===other));
   const iYield=z.yside===side;let wait=false;
   if(z.type==='split'){if(!onPath||other===mine)wait=occupied(NT,v,list,blocks,other,o0,Math.min(o1,o0+4),true)}
   else if(z.type==='merge'){if(iYield){if(onPath)wait=occupied(NT,v,list,blocks,other,o0-1,o1+1,false)||approaching(NT,v,list,other,o0)||!spaceAfter(NT,v,list,other,o1)}
    else wait=occupied(NT,v,list,blocks,other,o0,o1,true)}
   else{wait=occupied(NT,v,list,blocks,other,o0,o1,false)||(iYield?approaching(NT,v,list,other,o0):entering(NT,v,list,other,o0))||!spaceAfterOwn(NT,v,list,blocks,off+ub)}
   if(wait&&(stop==null||dz<stop))stop=dz}
  off+=sg.len}
 return stop}
// quelqu'un (corps) sur l'autre voie dans [s0,s1]
function occupied(NT,me,list,blocks,lane,s0,s1,notOnMyPath){const g=NT.geo.get(lane);if(!g)return false;const L=Math.max(0,s1-s0);
 for(const o of list.concat(blocks)){if(o===me||o.lane==null)continue;const d=distTo(NT,o,lane,s0,40);if(d==null)continue;const h=half(o);
  if(d<h&&d>-L-h){if(notOnMyPath&&o.route){const dm=distTo(NT,me,o.lane,o.s,20);if(dm!=null&&dm>0)continue}return true}}return false}
// quelqu'un arrive sur l'autre voie (atteindra s0 bientôt)
function approaching(NT,me,list,lane,s0){for(const o of list){if(o===me||!o.route)continue;const d=distTo(NT,o,lane,s0,24);if(d==null)continue;const h=half(o);if(d>=h&&d<h+3.5+(o.sp||0)*1.6)return true}return false}
// quelqu'un, sur la voie qui cède, est déjà en train d'entrer (avance, à moins de 1,5 m) : la voie prioritaire le laisse finir
function entering(NT,me,list,lane,s0){for(const o of list){if(o===me||!o.route||(o.sp||0)<1)continue;const d=distTo(NT,o,lane,s0,6);if(d==null)continue;const h=half(o);if(d>=h&&d<h+1.5)return true}return false}
// place libre juste après l'insertion, pour ne pas bloquer le carrefour
function spaceAfter(NT,me,list,lane,s1){const need=half(me)*2+.8;for(const o of list){if(o===me||!o.route)continue;const d=distTo(NT,o,lane,s1,need+14);if(d==null)continue;const x=-d,h=half(o);if(x>-h&&x-h<need)return false}return true}
function spaceAfterOwn(NT,me,list,blocks,end){const need=half(me)*2+.8;for(const o of list.concat(blocks)){if(o===me||o.lane==null)continue;const d=distTo(NT,me,o.lane,o.s,end+need+8);if(d==null||d<=end-.5)continue;if(d-half(o)-end<need)return false}return true}
