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
// gabarits [demi-longueur, demi-largeur, décalage du centre par rapport au point de la voie] (le camion : de l'avant du tracteur à l'arrière de la remorque)
export const VDIM={car:[1.3,.58,0],truck:[3.4,.85,-2.1],bus:[4.2,.92,0]};
// semi-remorque : tracteur (demi-longueur), sellette derrière le centre du tracteur, avant de la remorque devant la sellette,
// sellette → essieu de la remorque, demi-longueur de la remorque (la remorque suit la sellette et pivote dans les virages)
export const SEMI={cab:1.3,hitch:.9,nose:.6,axle:3.6,half:2.6};

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
 // feux piétons : points où les voies croisent la ligne du feu, et cases de route qu'il protège
 const lights=[],lightCell=new Int32Array(N);
 for(const L of S.lights||[]){const xs=[],[ax,ay]=L.a,[bx,by]=L.b;
  xs.push(...crossings(geo,L.a,L.b));
  for(let cy=Math.floor(Math.min(ay,by)-2);cy<=Math.max(ay,by)+2;cy++)for(let cx=Math.floor(Math.min(ax,bx)-2);cx<=Math.max(ax,bx)+2;cx++){if(!inLot(cx,cy)||!raster[idx(cx,cy)])continue;if(segDist([cx+.5,cy+.5],L.a,L.b)<=1.25)lightCell[idx(cx,cy)]=L.id}
  lights.push({id:L.id,a:L.a,b:L.b,xs})}
 const NT={geo,trans,entries,exits,yields,raster,owner,att,lights,lightCell};NT.zones=zones(NT);NT.adj=adjacency(NT);S._RN=NT;return NT}
// ---------------------------------------------------------------- feux piétons
function crossings(geo,[ax,ay],[bx,by]){const xs=[];
 for(const g of geo.values())for(let i=1;i<g.n;i++){const px=g.xs[i-1],pz=g.zs[i-1],qx=g.xs[i],qz=g.zs[i],d=(qx-px)*(by-ay)-(qz-pz)*(bx-ax);if(Math.abs(d)<1e-9)continue;
  const t=((ax-px)*(by-ay)-(ay-pz)*(bx-ax))/d,u=((ax-px)*(qz-pz)-(ay-pz)*(qx-px))/d;if(t>=0&&t<1&&u>=-.05&&u<=1.05){xs.push({lane:g.id,s:(i-1+t)*STEP});break}}return xs}
// cycle (secondes de jeu réelles × vitesse) : vert voitures, orange, rouge voitures = vert piétons
export const LIGHT={green:11,amber:2.5,walk:8,cost:2500,max:14};
export function lightPhase(R,id){const T=LIGHT.green+LIGHT.amber+LIGHT.walk,t=(((R.lt||0)+id*5.3)%T+T)%T;return t<LIGHT.green?'car':t<LIGHT.green+LIGHT.amber?'amber':'walk'}
// ligne du feu : droite ou à 45°, en travers d'au moins une voie
export function lightPlan(S,a,b){if(!a||!b||(a[0]===b[0]&&a[1]===b[1]))return {why:'Glisse le doigt en travers des voies.'};
 if(!aligned(a,b))b=snapSeg(a,b);const L=len2(a,b);if(L>LIGHT.max)return {why:'Feu trop long : 14 m au plus.',a,b};
 const xs=crossings(net(S).geo,a,b).length;
 if(!xs)return {why:'Le feu se trace en travers d’une voie.',a,b};
 const mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];if((S.lights||[]).some(o=>segDist(mid,o.a,o.b)<3))return {why:'Il y a déjà un feu ici.',a,b};
 return {a,b,lanes:xs,cost:LIGHT.cost,why:null}}
export function addLight(S,p){const ls=S.lights||(S.lights=[]);const id=S.lightNext=(S.lightNext||0)+1;ls.push({id,a:p.a,b:p.b});roadsChanged(S);return id}
export function lightAt(S,x,z){let best=null;for(const o of S.lights||[]){const d=segDist([x,z],o.a,o.b);if(d<1.3&&(!best||d<best.d))best={id:o.id,d}}return best}
export function removeLight(S,id){S.lights=(S.lights||[]).filter(o=>o.id!==id);roadsChanged(S)}
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
   for(const [id,j] of L){if(id<g.id||(id===g.id&&(j<=i||(j-i)*STEP<5||(g.closed&&g.len-(j-i)*STEP<5))))continue;const h=NT.geo.get(id),d=Math.hypot(h.xs[j]-x,h.zs[j]-z);if(d>=NEAR)continue;const pk=g.id+':'+id;(pairs.get(pk)||pairs.set(pk,[]).get(pk)).push([i*STEP,j*STEP,d])}}}
 for(const [pk,ps] of pairs){const [A,B]=pk.split(':').map(Number),ga=NT.geo.get(A),gb=NT.geo.get(B);ps.sort((p,q)=>p[0]-q[0]);
  const cl=[];for(const p of ps){const c=cl.find(c=>p[0]>=c.a0-1.01&&p[0]<=c.a1+1.01&&p[1]>=c.b0-1.01&&p[1]<=c.b1+1.01);
   if(c){c.a0=Math.min(c.a0,p[0]);c.a1=Math.max(c.a1,p[0]);c.b0=Math.min(c.b0,p[1]);c.b1=Math.max(c.b1,p[1]);c.md=Math.min(c.md,p[2])}else cl.push({a0:p[0],a1:p[0],b0:p[1],b1:p[1],md:p[2]})}
  // sur un rond-point, une zone peut passer par le point 0 de la boucle : on recolle les deux morceaux
  for(const [g,lo,hi,olo,ohi] of [[gb,'b0','b1','a0','a1'],[ga,'a0','a1','b0','b1']]){if(!g.closed)continue;
   for(let i=0;i<cl.length;i++)for(let j=0;j<cl.length;j++){const c1=cl[i],c2=cl[j];if(i===j||!c1||!c2)continue;
    if(c1[hi]>g.len-1.3&&c2[lo]<1.3&&c1[olo]<=c2[ohi]+1.01&&c2[olo]<=c1[ohi]+1.01){c1[hi]=c2[hi]+g.len;c1.md=Math.min(c1.md,c2.md);c1[olo]=Math.min(c1[olo],c2[olo]);c1[ohi]=Math.max(c1[ohi],c2[ohi]);cl[j]=null}}
   for(let i=cl.length-1;i>=0;i--)if(!cl[i])cl.splice(i,1)}
  for(const c of cl){const z={a:A,a0:c.a0,a1:c.a1,b:B,b0:c.b0,b1:c.b1,type:'cross',yside:null};
   const within=(v,lo,hi,g)=>[0,g.closed?g.len:0,g.closed?-g.len:0].some(k=>v+k>=lo-3&&v+k<=hi+3),inA=v=>within(v,c.a0,c.a1,ga),inB=v=>within(v,c.b0,c.b1,gb);
   // raccords : celui qui s'insère cède ; à une sortie, personne ne cède (on suit ceux qui sortent)
   for(const t of NT.trans){
    if(t.kind==='merge'){if(t.from===B&&t.to===A&&inA(t.st)&&inB(t.sf)){z.type='merge';z.yside='b';break}if(t.from===A&&t.to===B&&inB(t.st)&&inA(t.sf)){z.type='merge';z.yside='a';break}}
    if(t.kind==='split'){if(t.from===A&&t.to===B&&inA(t.sf)&&inB(t.st)){z.type='split';break}if(t.from===B&&t.to===A&&inB(t.sf)&&inA(t.st)){z.type='split';break}}}
   // deux voies qui se longent (entrée et sortie d'une même branche, par exemple) ne se croisent pas : pas de conflit
   if(z.type==='cross'){const pa=pos(ga,(c.a0+c.a1)/2),pb=pos(gb,(c.b0+c.b1)/2),dt=Math.sin(pa.ang)*Math.sin(pb.ang)+Math.cos(pa.ang)*Math.cos(pb.ang);if(Math.abs(dt)>.8||c.md>1.4)continue}
   if(z.type==='cross'){const ya=hasYield(NT,A,c.a0),yb=hasYield(NT,B,c.b0);
    if(ya!==yb)z.yside=ya?'a':'b';
    else{// priorité à droite
     const pa=pos(ga,(c.a0+c.a1)/2),pb=pos(gb,(c.b0+c.b1)/2),ta=[Math.sin(pa.ang),Math.cos(pa.ang)],tb=[Math.sin(pb.ang),Math.cos(pb.ang)],ra=[-ta[1],ta[0]];
     z.yside=tb[0]*ra[0]+tb[1]*ra[1]<0?'a':'b'}}
   // Un entrant cède aussi aux véhicules qui quittent le même rond-point.
   const enters=(lane,ring)=>NT.trans.some(t=>t.from===lane&&t.to===ring&&t.kind==='merge'),exits=(lane,ring)=>NT.trans.some(t=>t.from===ring&&t.to===lane&&t.kind==='split');
   for(const ring of gs.filter(g=>g.ring)){if(enters(A,ring.id)&&exits(B,ring.id))z.yside='a';else if(enters(B,ring.id)&&exits(A,ring.id))z.yside='b'}
   const signA=hasYield(NT,A,c.a0),signB=hasYield(NT,B,c.b0);if(signA!==signB)z.yside=signA?'a':'b';
   if(ga.ring!==gb.ring)z.yside=ga.ring?'b':'a';
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
function ptsWhy(pts){if(pts.length<2)return 'Trace une ligne plus longue.';
 for(let i=1;i<pts.length;i++){const k=dir8(pts[i-1],pts[i]);if(k<0)return 'Trace une ligne plus longue.';if(i>1){const k0=dir8(pts[i-2],pts[i-1]),dk=Math.min((k-k0+8)%8,(k0-k+8)%8);if(dk>2)return 'Virage trop serré : fais-le en deux fois.'}}
 for(const p of pts)if(p[0]<0||p[1]<0||p[0]>W||p[1]>H)return 'Le terrain s’arrête ici.';return null}
const aligned=(a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1];return !!(dx||dy)&&(dx===0||dy===0||Math.abs(dx)===Math.abs(dy))};
// distance d'un point aux autres lignes (géométrie actuelle)
function nearLane(S,p,skip){const NT=net(S);let best=1e9;for(const g of NT.geo.values()){if(g.id===skip)continue;const q=proj(g,p[0],p[1]);if(q.d<best)best=q.d}return best}
// raccord par proximité : un bout posé à moins de 1,6 m d'une autre ligne est avancé ou reculé d'un ou deux pas pour s'y poser
function nudgeEnds(S,pts,skip){const o=pts.map(q=>[q[0],q[1]]);
 for(const end of ['start','end']){const n=o.length,i=end==='start'?0:n-1,j=end==='start'?1:n-2,P=o[i],d0=nearLane(S,P,skip);if(d0<=SNAP||d0>1.6)continue;
  const k=dir8(o[j],P),[dx,dy]=DIR8[k],segLen=Math.max(Math.abs(P[0]-o[j][0]),Math.abs(P[1]-o[j][1]));let best=null;
  for(const t of [1,-1,2,-2]){if(-t>=segLen)continue;const Q=[P[0]+dx*t,P[1]+dy*t];if(Q[0]<0||Q[1]<0||Q[0]>W||Q[1]>H)continue;const d=nearLane(S,Q,skip);if(d<=SNAP-.05){best=Q;break}}
  if(best)o[i]=best}
 return o}
export function lanePlan(S,pts,blocked){pts=cleanPts(pts);{const w=ptsWhy(pts);if(w)return {why:w}}
 const lanes=S.lanes||[];let app=null,pre=null;
 for(const l of lanes){if(l.ring)continue;if(same(l.pts[l.pts.length-1],pts[0])&&!lanes.some(o=>o!==l&&!o.ring&&same(o.pts[0],pts[0])))app=l;if(same(l.pts[0],pts[pts.length-1])&&!lanes.some(o=>o!==l&&!o.ring&&same(o.pts[o.pts.length-1],pts[pts.length-1])))pre=l}
 if(app&&pre&&app===pre)pre=null;
 if(!app&&!pre){const q=cleanPts(nudgeEnds(S,pts));if(!ptsWhy(q))pts=q}
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
 if((S.lanes||[]).some(l=>l.ring&&Math.hypot(l.ring.cx-cx,l.ring.cy-cy)<l.ring.r+r+2))return {why:'Trop près d’un autre rond-point.',cells};
 const bad=blocked?cells.concat(isl).filter(blocked):[];if(bad.length)return {why:'Il y a quelque chose sur le passage (magasin, meuble ou arbre à couper).',cells,bad};
 const cut=ringCut(S,ring),base=laneCost({ring});
 return {ring,cells,island:isl,cut:cut.changes,refund:cut.refund,extra:cut.extra,cost:base+cut.extra-cut.refund,why:null}}
// suite de points de la grille le long d'une ligne (pas de 1 case, ou 1 diagonale)
function gridSeq(pts){const seq=[];for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],k=dir8(a,b),[dx,dy]=DIR8[k],n=Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]));for(let t=0;t<n;t++)seq.push({p:[a[0]+dx*t,a[1]+dy*t],seg:i})}
 seq.push({p:pts[pts.length-1].slice(),seg:pts.length-2});return seq}
function subPts(pts,seq,i,j){const o=[seq[i].p];for(let s=seq[i].seg+1;s<=seq[j].seg;s++)o.push(pts[s]);o.push(seq[j].p);return cleanPts(o)}
// voies coupées par un nouveau rond-point : la partie dans le cercle disparaît, les morceaux s'arrêtent sur l'anneau (et s'y raccordent) ;
// les bouts de voie qui s'arrêtent à moins de 2,5 m de l'anneau y sont prolongés
function ringCut(S,ring){const {cx,cy,r}=ring,band=.75,dd=p=>Math.hypot(p[0]-cx,p[1]-cy)-r,changes=[];let removed=0,added=0;
 for(const l of S.lanes||[]){if(l.ring)continue;const seq=gridSeq(l.pts),deep=seq.map(q=>dd(q.p)<-band);let pieces;
  if(deep.some(Boolean)){pieces=[];let i=0;
   while(i<seq.length){if(deep[i]){i++;continue}let j=i;while(j+1<seq.length&&!deep[j+1])j++;let a=i,b=j;
    if(i>0){let best=-1;for(let k=i;k<=j&&dd(seq[k].p)<=band;k++)if(best<0||Math.abs(dd(seq[k].p))<Math.abs(dd(seq[best].p)))best=k;if(best>=0)a=best}
    if(j<seq.length-1){let best=-1;for(let k=j;k>=a&&dd(seq[k].p)<=band;k--)if(best<0||Math.abs(dd(seq[k].p))<Math.abs(dd(seq[best].p)))best=k;if(best>=0)b=best}
    if(b>a){const q=subPts(l.pts,seq,a,b);if(q.length>=2&&ptsCost(q)>=LANE_COST)pieces.push(q)}i=j+1}}
  else pieces=[l.pts.map(q=>[q[0],q[1]])];
  // prolongement des bouts proches de l'anneau
  for(const q of pieces){const n=q.length;
   for(const end of ['start','end']){const i=end==='start'?0:n-1,j=end==='start'?1:n-2,P=q[i],d=dd(P);if(Math.abs(d)<=band||d<0||d>2.5)continue;
    const k=dir8(q[j],P),[dx,dy]=DIR8[k];for(let t=1;t<=3;t++){const Q=[P[0]+dx*t,P[1]+dy*t];if(dd(Q)<-band)break;if(Math.abs(dd(Q))<=band){q[i]=Q;break}}}}
  const before=JSON.stringify(l.pts),after=pieces.map(q=>JSON.stringify(q));if(pieces.length===1&&after[0]===before)continue;
  const lo=ptsCost(l.pts),ln=pieces.reduce((t,q)=>t+ptsCost(q),0);if(ln<lo)removed+=lo-ln;else added+=ln-lo;changes.push({id:l.id,pieces})}
 return {changes,refund:Math.round(removed*D.REFUND),extra:added}}
const segDist=(p,a,b)=>{const vx=b[0]-a[0],vy=b[1]-a[1],L=vx*vx+vy*vy||1,t=clamp(((p[0]-a[0])*vx+(p[1]-a[1])*vy)/L,0,1);return Math.hypot(a[0]+vx*t-p[0],a[1]+vy*t-p[1])};
const polyDist=(p,pts)=>{let d=1e9;for(let i=1;i<pts.length;i++)d=Math.min(d,segDist(p,pts[i-1],pts[i]));return d};
export function addRing(S,p){const lanes=S.lanes||(S.lanes=[]);
 for(const c of p.cut||[]){const k=lanes.findIndex(o=>o.id===c.id);if(k<0)continue;lanes.splice(k,1);const made=[];
  for(const q of c.pieces){const id=S.laneNext=(S.laneNext||0)+1;const nl={id,pts:q};lanes.push(nl);made.push(nl)}
  S.yields=(S.yields||[]).filter(y=>{if(y.lane!==c.id)return true;let best=null,bd=1.5;for(const nl of made){const d=polyDist([y.x,y.y],nl.pts);if(d<bd){bd=d;best=nl}}if(!best)return false;y.lane=best.id;return true})}
 const id=S.laneNext=(S.laneNext||0)+1;const l={id,ring:p.ring};lanes.push(l);roadsChanged(S);return l}
// déplacer un sommet d'une ligne (ins : on crée un nouveau virage au milieu du segment i-1 → i) ; les deux segments voisins restent droits ou à 45°
export function vertexPlan(S,id,i,x,z,ins,blocked){const l=(S.lanes||[]).find(o=>o.id===id);if(!l||l.ring)return {why:'Introuvable.'};
 const old=l.pts;let pts=old.map(q=>[q[0],q[1]]);
 // bout de la ligne (début ou fin) : il va là où on tire ; un coude raccorde le segment voisin si besoin ; accroché à une voie toute proche
 if(!ins&&(i===0||i===pts.length-1)){const n=pts.length,j=i===0?1:n-2,P=pts[j],Q=[Math.round(x),Math.round(z)];if(Q[0]===P[0]&&Q[1]===P[1])return {why:'Bout trop court.',pts:old};
  const dx=Q[0]-P[0],dy=Q[1]-P[1],k=Math.min(Math.abs(dx),Math.abs(dy)),diag=[Math.sign(dx)*k,Math.sign(dy)*k];let best=null;
  for(const el of (!k||Math.abs(dx)===Math.abs(dy))?[[]]:[[[P[0]+diag[0],P[1]+diag[1]]],[[Q[0]-diag[0],Q[1]-diag[1]]]]){
   let c=i===0?[Q].concat(el.slice().reverse(),pts.slice(1)):pts.slice(0,n-1).concat(el,[Q]);c=cleanPts(nudgeEnds(S,cleanPts(c),id));if(c.length<2||ptsWhy(c))continue;const L=ptsCost(c);if(!best||L<best.L)best={c,L}}
  if(!best)return {why:'Pas de tracé possible jusque-là.',pts:old};pts=best.c}
 else{
 const a0=pts[i-1],b0=pts[i];
 if(ins&&a0&&b0&&(a0[0]===b0[0]||a0[1]===b0[1])){
  // segment droit : on crée une bosse (deux biais à 45° et un plateau) à l'endroit tiré, décalée de h cases
  const L=Math.max(Math.abs(b0[0]-a0[0]),Math.abs(b0[1]-a0[1])),u=[Math.sign(b0[0]-a0[0]),Math.sign(b0[1]-a0[1])],n=[-u[1],u[0]];
  const t=Math.round((x-a0[0])*u[0]+(z-a0[1])*u[1]),h=clamp(Math.round((x-a0[0])*n[0]+(z-a0[1])*n[1]),-4,4),H=Math.abs(h),w=1;
  if(!h)return {why:'Tire le + sur le côté pour faire un virage.',pts:old};
  const t0=clamp(t,w+H,L-w-H);if(L<2*(w+H))return {why:'Segment trop court pour ce virage.',pts:old};
  const P=k=>[a0[0]+u[0]*k,a0[1]+u[1]*k];const A=P(t0-w-H),Q1=[P(t0-w)[0]+n[0]*h,P(t0-w)[1]+n[1]*h],Q2=[P(t0+w)[0]+n[0]*h,P(t0+w)[1]+n[1]*h],B=P(t0+w+H);
  pts.splice(i,0,A,Q1,Q2,B)}
 else{if(ins)pts.splice(i,0,null);const a=pts[i-1],b=pts[i+1];if(!a||!b)return {why:'Introuvable.'};
  // le virage va là où on tire ; si les segments voisins ne sont plus droits ou à 45°, un coude de plus les raccorde
  const Q=[Math.round(x),Math.round(z)],elbow=(p,q,m)=>{const dx=q[0]-p[0],dy=q[1]-p[1],k=Math.min(Math.abs(dx),Math.abs(dy));if(!k||Math.abs(dx)===Math.abs(dy))return [];
   const d=[Math.sign(dx)*k,Math.sign(dy)*k];return [m?[q[0]-d[0],q[1]-d[1]]:[p[0]+d[0],p[1]+d[1]]]};
  let best=null;for(const m1 of [1,0])for(const m2 of [0,1]){const c=cleanPts(pts.slice(0,i).concat(elbow(a,Q,m1),[Q],elbow(Q,b,m2),pts.slice(i+1)));if(ptsWhy(c))continue;const L=ptsCost(c);if(!best||L<best.L)best={c,L}}
  if(!best)return {why:'Pas de virage possible ici.',pts:old};pts=best.c}}
 const np=cleanPts(pts);const w=ptsWhy(np);if(w)return {why:w,pts:np};
 const cells=cellsOf(smooth(np,false)),bad=blocked?cells.filter(blocked):[];
 const d=ptsCost(np)-ptsCost(old),cost=Math.max(0,d),refund=d<0?Math.round(-d*D.REFUND):0;
 if(bad.length)return {why:'Il y a quelque chose sur le passage (magasin, meuble ou arbre à couper).',pts:np,cells,bad,cost};
 return {pts:np,cells,cost,refund,len:Math.abs(d)/LANE_COST,why:JSON.stringify(np)===JSON.stringify(old)?'Rien à changer.':null}}
// couper une ligne en deux au point de la grille le plus proche (les deux morceaux restent bout à bout, la circulation continue)
export function cutPlan(S,id,x,y){const l=(S.lanes||[]).find(o=>o.id===id);if(!l)return {why:'Introuvable.'};if(l.ring)return {why:'Un rond-point ne se coupe pas.'};
 const seq=[];for(let i=0;i<l.pts.length-1;i++){const a=l.pts[i],b=l.pts[i+1],k=dir8(a,b),[dx,dy]=DIR8[k],n=Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]));for(let t=(i?0:1);t<n;t++)seq.push({p:[a[0]+dx*t,a[1]+dy*t],seg:i,t})}
 let best=null;for(const q of seq){const d=Math.hypot(q.p[0]-x,q.p[1]-y);if(!best||d<best.d)best={...q,d}}
 if(!best||best.d>1.6)return {why:'Touche la voie à l’endroit où la couper.'};
 const A=cleanPts(l.pts.slice(0,best.seg+1).concat([best.p])),B=cleanPts([best.p].concat(l.pts.slice(best.seg+1)));
 if(A.length<2||B.length<2||ptsWhy(A)||ptsWhy(B))return {why:'Trop près du bout de la voie.'};
 return {id,p:best.p,a:A,b:B,why:null}}
export function cutLane(S,p){const lanes=S.lanes||[],k=lanes.findIndex(o=>o.id===p.id);if(k<0)return null;const old=lanes[k];lanes.splice(k,1);
 const mk=pts=>{const id=S.laneNext=(S.laneNext||0)+1;const l={id,pts};lanes.push(l);return l},A=mk(p.a),B=mk(p.b);
 for(const y of S.yields||[])if(y.lane===old.id)y.lane=polyDist([y.x,y.y],A.pts)<=polyDist([y.x,y.y],B.pts)?A.id:B.id;
 roadsChanged(S);return [A.id,B.id]}
export function moveVertex(S,id,p){const l=S.lanes.find(o=>o.id===id);l.pts=p.pts;roadsChanged(S)}
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
// étendue devant / derrière le point de la voie
export const front=v=>{if(v.h!=null)return v.h;const d=VDIM[v.kind]||VDIM.car;return d[0]+d[2]};
export const back=v=>{if(v.h!=null)return v.h;const d=VDIM[v.kind]||VDIM.car;return d[0]-d[2]};
// remorque : la sellette tire l'essieu de la remorque à distance fixe (vraie articulation, y compris en manœuvre)
export function trailer(v){const ux=Math.sin(v.ang),uz=Math.cos(v.ang),hx=v.x-ux*SEMI.hitch,hz=v.z-uz*SEMI.hitch;
 let ax,az;if(v.tr&&Math.hypot(hx-v.tr.x,hz-v.tr.z)>1e-6){const dx=hx-v.tr.x,dz=hz-v.tr.z,d=Math.hypot(dx,dz);ax=hx-dx/d*SEMI.axle;az=hz-dz/d*SEMI.axle}else{ax=hx-ux*SEMI.axle;az=hz-uz*SEMI.axle}
 v.tr={x:ax,z:az}}
// rectangles d'un véhicule : un seul, ou tracteur + remorque
export function parts(v){const d=VDIM[v.kind]||VDIM.car;if(v.kind!=='truck')return [{x:v.x,z:v.z,ang:v.ang,hl:d[0],hw:d[1]}];
 const ux=Math.sin(v.ang),uz=Math.cos(v.ang),hx=v.x-ux*SEMI.hitch,hz=v.z-uz*SEMI.hitch,A=v.tr||{x:hx-ux*SEMI.axle,z:hz-uz*SEMI.axle};let dx=hx-A.x,dz=hz-A.z;const L=Math.hypot(dx,dz)||1;dx/=L;dz/=L;
 const fx=hx+dx*SEMI.nose,fz=hz+dz*SEMI.nose;return [{x:v.x,z:v.z,ang:v.ang,hl:SEMI.cab,hw:d[1]},{x:fx-dx*SEMI.half,z:fz-dz*SEMI.half,ang:Math.atan2(dx,dz),hl:SEMI.half,hw:d[1]}]}
export function placeOn(NT,v){const sg=v.route[v.ri],g=NT.geo.get(sg.lane);if(!g)return;const P=pos(g,sg.from+v.u);v.lane=sg.lane;v.s=g.closed?((sg.from+v.u)%g.len+g.len)%g.len:sg.from+v.u;
 const off=v.kind==='truck'?0:(VDIM[v.kind]||VDIM.car)[2];v.x=P.x+Math.sin(P.ang)*off;v.z=P.z+Math.cos(P.ang)*off;v.ang=P.ang;if(v.kind==='truck')trailer(v)}
// distance le long de l'itinéraire de v jusqu'au point (lane, s) ; négative s'il est juste derrière ; null si pas sur son chemin
export function distTo(NT,v,lane,s,max=30){if(!v.route){if(v.lane!==lane)return null;const g=NT.geo.get(lane);if(!g)return null;let d=s-v.s;if(g.closed){d=fwd(g,v.s,s);if(d>g.len/2)d-=g.len}return d}
 let off=-v.u;for(let k=v.ri;k<v.route.length;k++){const sg=v.route[k],g=NT.geo.get(sg.lane);if(!g)return null;
  if(sg.lane===lane){let u=fwd(g,sg.from,s);const last=k===v.route.length-1,lim=last?sg.len+8:sg.len;if(g.closed&&u>lim+1e-6&&k===v.ri)u-=g.len;if(u<=lim+1e-6&&(u>=0||k===v.ri)){const d=off+u;if(d>=-14)return d}}
  off+=sg.len;if(off>max)return null}return null}
// un pas pour tous les véhicules qui roulent ; renvoie ceux qui sont au bout de leur itinéraire
export function drive(S,R,list,dt,agents){const NT=net(S),arrived=[],blocks=R.blocks||[],all=list.concat(blocks),gates=junctionGates(NT,list,dt);
 for(const v of list){if(!v.route)continue;const my=front(v);let lim=v.vmax||5;v.why='';
  const gate=gates.get(v.id);v.gate=gate;
  if(gate!=null){lim=Math.min(lim,Math.max(0,gate*2.2));if(gate<.05)v.why=v.why||'cède le passage'}
  for(const o of all){if(o===v||o.lane==null)continue;const d=distTo(NT,v,o.lane,o.s,20);if(d==null||d<=0)continue;if(o.h===0&&d<my+.3)continue;const gap=d-my-back(o);if(gap<12){lim=Math.min(lim,Math.max(0,(gap-.7)*2.2));if(gap<.75){lim=0;v.why='suit '+o.id}}}
  if(NT.lights.length)for(const L of NT.lights){const ph=lightPhase(R,L.id);if(ph==='car')continue;for(const x of L.xs){const d=distTo(NT,v,x.lane,x.s,30);if(d==null||d<my+.2)continue;const g=d-my-1.6;if(ph==='amber'&&g<2.5)continue;lim=Math.min(lim,Math.max(0,g*2.2));if(g<.05){lim=0;v.why=v.why||'feu'}}}
  if(agents&&lim>0)for(const a of agents){const q=aheadPt(NT,v,my+1);if(!q)break;if(Math.abs(a.x-q.x)<3.5&&Math.abs(a.y-q.z)<3.5&&pedBlocks(NT,v,a,my)){lim=0;v.why='piéton';break}}
  {const q0=aheadPt(NT,v,0),q=aheadPt(NT,v,3.2);if(q0&&q){let da=Math.abs(q.ang-q0.ang);while(da>Math.PI)da=Math.abs(da-2*Math.PI);if(da>.5)lim=Math.min(lim,2.6)}}
  v.sp=v.sp==null?lim:(lim<v.sp?lim:Math.min(lim,v.sp+ACC*dt));
  // dernier garde-fou : on n'avance pas dans une autre carrosserie (sauf pour s'en écarter, ou si l'autre nous cède le passage)
  let b=v.sp*dt;
  // coincé par une carrosserie depuis longtemps (nœud de plusieurs véhicules) : on se dégage au pas, même en frôlant l'autre
  if(v.stopT>6&&v.why0==='distance de sécurité')v.ghost=2.5;if(v.ghost>0){v.ghost-=dt;if(b>0){b=Math.min(b,1.5*dt);v.sp=Math.min(v.sp,1.5)}}
  if(b>0&&!(v.ghost>0)){const next=projectVehicle(NT,v,b),obstacle=list.find(o=>o!==v&&!yieldsTo(o,v)&&!beats(NT,v,o)&&!(v.ignoreT>0&&v.ignore===o.id)&&ahead(v,o)&&overlap(next,o)>.001&&overlap(next,o)>overlap(v,o)+.0001);if(obstacle){v.blockedBy=obstacle.id;v.sp=0;b=0;v.why='distance de sécurité'}else v.blockedBy=null}
  if(v.sp<.05)v.stopT=(v.stopT||0)+dt;else v.stopT=0;v.why0=v.why;
  while(b>0){const sg=v.route[v.ri],rest=sg.len-v.u;if(b<rest){v.u+=b;b=0}else{b-=rest;v.u=sg.len;if(v.ri<v.route.length-1){v.ri++;v.u=0}else b=0}}
  placeOn(NT,v);if(v.ri===v.route.length-1&&v.u>=v.route[v.ri].len-1e-6)arrived.push(v)}
 return arrived}
const ACC=6;
// o est devant la cabine de v (sinon c'est à o de s'écarter : une remorque qui balaie un voisin arrêté ne bloque pas le camion)
function ahead(v,o){const ux=Math.sin(v.ang),uz=Math.cos(v.ang);return parts(o).some(q=>(q.x-v.x)*ux+(q.z-v.z)*uz>-.2)}
// o est arrêté pour laisser passer v (la carrosserie de v peut frôler la sienne sans qu'on bloque v)
const yieldsTo=(o,v)=>o.waitOn&&o.waitOn.includes(v.id)&&(o.sp||0)<.05;
// deux carrosseries qui se gênent mutuellement : celle qui a la priorité avance (rond-point, puis priorité de la zone, puis la plus ancienne)
function beats(NT,v,o){if(o.blockedBy!==v.id)return false;const rv=!!NT.geo.get(v.lane)?.ring,ro=!!NT.geo.get(o.lane)?.ring;if(rv!==ro)return rv;
 const pv=v.prio&&v.prio.includes(o.id),po=o.prio&&o.prio.includes(v.id);if(pv!==po)return pv;return v.id<o.id}
// Collision entre les rectangles orientés réellement dessinés, y compris dans les virages.
export function overlap(a,b){if(a.x==null||b.x==null)return 0;let m=0;for(const p of parts(a))for(const q of parts(b))m=Math.max(m,boxPen(p,q));return m}
function boxPen(a,b){const A=[[Math.sin(a.ang),Math.cos(a.ang)],[Math.cos(a.ang),-Math.sin(a.ang)]],B=[[Math.sin(b.ang),Math.cos(b.ang)],[Math.cos(b.ang),-Math.sin(b.ang)]];let penetration=Infinity;
 for(const axis of A.concat(B)){const dot=(u,v)=>u[0]*v[0]+u[1]*v[1],r=a.hl*Math.abs(dot(A[0],axis))+a.hw*Math.abs(dot(A[1],axis))+b.hl*Math.abs(dot(B[0],axis))+b.hw*Math.abs(dot(B[1],axis)),dist=Math.abs((a.x-b.x)*axis[0]+(a.z-b.z)*axis[1]);if(dist>=r)return 0;penetration=Math.min(penetration,r-dist)}return penetration}
function projectVehicle(NT,v,b){const next={...v};while(b>0){const seg=next.route[next.ri],rest=seg.len-next.u;if(b<rest){next.u+=b;break}b-=rest;next.u=seg.len;if(next.ri===next.route.length-1)break;next.ri++;next.u=0}placeOn(NT,next);return next}

// ---------------------------------------------------------------- priorités aux zones de conflit
// Chaque zone (croisement, insertion) relie deux intervalles de voies. Règles :
//  - un véhicule déjà engagé dans la zone finit de passer ; les autres l'attendent avant la zone ;
//  - celui qui doit céder (priorité à droite, cédez-le-passage, entrée de rond-point, insertion) passe dès que le véhicule
//    prioritaire n'arrivera pas avant qu'il ait dégagé la zone (pour une insertion : dès qu'il y a juste la place de sa carrosserie) ;
//  - on ne s'engage pas si on ne peut pas ressortir de la zone (place libre derrière le véhicule qui précède) ;
//  - un prioritaire arrêté (il attend lui-même quelqu'un) ne bloque pas ; si tout le monde s'attend, celui qui attend depuis le plus longtemps passe.
const LOOK=26,MARGIN=.6;
// interblocage en boucle (A attend B qui attend C… qui attend A, par priorité, carrosserie ou file) : on le détecte et
// celui qui attend depuis le plus longtemps, parmi ceux qui ne sont pas simplement derrière un autre, passe en priorité un court instant
function breakCycles(list,gates,dt){const by=new Map(list.map(v=>[v.id,v]));const edges=v=>{const o=[];if(v.blockedBy!=null)o.push([v.blockedBy,'b']);
  for(const id of v.waitOn||[])o.push([id,'w']);const m=/^suit (\d+)/.exec(v.why||'');if(m)o.push([+m[1],'f']);return o};
 const stuck=v=>(v.stopT||0)>2.5;const done=new Set();
 for(const v0 of list){if(!stuck(v0)||done.has(v0.id))continue;const path=[],pos=new Map();let v=v0;
  while(v&&stuck(v)&&!pos.has(v.id)&&!done.has(v.id)){pos.set(v.id,path.length);const es=edges(v);const nx=es.map(([id,k])=>({o:by.get(id),k})).find(e=>e.o&&stuck(e.o));path.push({v,e:nx});v=nx&&nx.o}
  for(const p of path)done.add(p.v.id);
  if(!v||!pos.has(v.id))continue;const cyc=path.slice(pos.get(v.id));
  const cand=cyc.filter(p=>p.e&&p.e.k!=='f').sort((a,b)=>(b.v.stopT||0)-(a.v.stopT||0)||a.v.id-b.v.id)[0];if(!cand)continue;
  cand.v.force=Math.max(cand.v.force||0,1.5);cand.v.ignore=cand.e.o.id;cand.v.ignoreT=1.5;gates.delete(cand.v.id);if(cand.v.full!=null)gates.set(cand.v.id,cand.v.full)}}
function zonesByLane(NT){if(NT.zl)return NT.zl;const m=new Map();for(const z of NT.zones){if(z.type==='split')continue;for(const side of ['a','b']){const l=side==='a'?z.a:z.b;(m.get(l)||m.set(l,[]).get(l)).push({z,side})}}return NT.zl=m}
// passages de v dans les zones : distances (centre du véhicule) au début et à la fin de l'intervalle, le long de son itinéraire
function zoneHits(NT,v){const out=new Map();if(!v.route)return out;const ZL=zonesByLane(NT),k0=Math.max(0,v.ri-2);let off=-v.u;for(let k=v.ri-1;k>=k0;k--)off-=v.route[k].len;
 for(let k=k0;k<v.route.length&&off<LOOK+8;k++){const sg=v.route[k],g=NT.geo.get(sg.lane);if(!g){off+=sg.len;continue}
  for(const {z,side} of ZL.get(sg.lane)||[]){const a=side==='a'?z.a0:z.b0,b=side==='a'?z.a1:z.b1;let s0=g.closed?fwd(g,sg.from,a):a-sg.from;if(g.closed&&s0>sg.len+.01)s0-=g.len;const s1=s0+(b-a);if(s1<0||s0>sg.len+.01)continue;
   const din=off+(k>k0?Math.max(s0,0):s0),dout=off+Math.min(s1,sg.len);if(dout+back(v)<=0||din-front(v)>LOOK)continue;const key=z.id;const h=out.get(key);
   if(!h||din<h.din)out.set(key,{z,side,din,dout,exitS:s1>sg.len+.01&&k<v.route.length-1?(sg.from+sg.len)%(g.closed?g.len:Infinity):null})}
  off+=sg.len}
 return out}
// temps pour que l'arrière de v sorte de la zone (accélération depuis la vitesse actuelle)
function clearTime(v,h){const D=h.dout+back(v);if(D<=0)return 0;const v0=v.sp||0,vm=Math.max(1,v.vmax||5),a=3,ta=Math.max(0,(vm-v0)/a),da=(v0+vm)/2*ta;return D<=da?(-v0+Math.sqrt(v0*v0+2*a*D))/a:ta+(D-da)/vm}
function junctionGates(NT,list,dt){const gates=new Map(),hits=new Map(),byZone=new Map();
 NT.zones.forEach((z,i)=>{if(z.id==null)z.id=i});
 for(const v of list){if(!v.route)continue;const H=zoneHits(NT,v);hits.set(v.id,H);for(const h of H.values())(byZone.get(h.z.id)||byZone.set(h.z.id,[]).get(h.z.id)).push({v,...h})}
 const put=(v,d,o,tag)=>{if(d<(gates.get(v.id)??Infinity)){gates.set(v.id,d);v.gtag=tag}if(o){(v._wait||(v._wait=[])).push(o.id)}};
 const inside=e=>e.din-front(e.v)<.05&&e.dout+back(e.v)>0;
 // on s'arrête avant la première zone d'un même carrefour (pas au milieu d'un croisement voisin)
 const stopAt=e=>{let d=e.din;const H=hits.get(e.v.id);if(H)for(const h of H.values())if(h.din<d&&h.dout>=d-1.5&&h.din-front(e.v)>-.05)d=h.din;return d-front(e.v)-MARGIN};
 for(const v of list){v._wait=null;v._prio=null;v.full=null}
 for(const [zid,es] of byZone){const z=es[0].z;
  // un véhicule présent des deux côtés (il s'insère) compte du côté qui cède
  const twice=new Set();for(const e of es)if(es.some(f=>f!==e&&f.v===e.v))twice.add(e.v.id);
  const E=es.filter(e=>!twice.has(e.v.id)||e.side===(z.yside||'b'));
  const ys=z.yside||'b',Y=E.filter(e=>e.side===ys),P=E.filter(e=>e.side!==ys);
  for(const o of P)for(const e of Y)if(o.v!==e.v&&o.din<LOOK&&e.din<LOOK)(o.v._prio||(o.v._prio=[])).push(e.v.id);
  if(z.type==='merge'){
   // insertion : les deux voies n'en font plus qu'une à la fin de la zone. Celui qui est derrière suit l'autre (comme sur la même voie) ;
   // celui qui s'insère attend avant la zone tant qu'il n'y a pas, devant le prioritaire qui arrive, juste la place de sa carrosserie.
   const follow=(b,f)=>put(b.v,(b.dout-f.dout)-front(b.v)-back(f.v)-.7,f.v,'m-follow');
   const tr=NT.trans.find(t=>t.kind==='merge'&&t.from===(ys==='a'?z.a:z.b)&&t.to===(ys==='a'?z.b:z.a)),gm=tr&&NT.geo.get(tr.to);
   // un véhicule de l'anneau qui sort avant le point d'insertion ne gêne pas l'insertion (le croisement sortie / entrée est traité à part)
   const exitsBefore=o=>tr&&o.exitS!=null&&fwd(gm,o.exitS,tr.st)<(gm.closed?gm.len/2:Infinity)&&fwd(gm,o.exitS,tr.st)>-.01;
   for(const e of Y)for(const o of P){if(o.v===e.v||exitsBefore(o))continue;
    // le prioritaire est déjà dans la zone : s'il est assez loin devant, on s'insère derrière lui, sinon on attend
    if(inside(o)&&!inside(e)){if(o.dout<e.dout-(back(o.v)+front(e.v)+.9))follow(e,o);else if(stopAt(e)<=LOOK)put(e.v,stopAt(e),o.v,'m-pin');continue}
    if(inside(e)){if(e.dout>=o.dout)follow(e,o);else follow(o,e);continue}
    if(stopAt(e)>LOOK)continue;
    const vo=o.v.held?(o.v.sp||0):Math.max(o.v.sp||0,Math.min(o.v.vmax||5,3)),tc=clearTime(e.v,e);
    // l'arrière de celui qui s'insère doit être sorti de la zone avant que le prioritaire y arrive (avec la marge pour freiner)
    // juste la place de la carrosserie devant le prioritaire, plus de quoi qu'il freine en douceur derrière nous
    const need=front(o.v)+back(e.v)+.9+Math.max(vo*Math.min(tc,1.6)*.45,(o.v.sp||0)**2/(2*4));
    if(o.dout-e.dout<need)put(e.v,stopAt(e),o.v,'m-gap')}}
  else{
   for(const e of Y){if(inside(e)||stopAt(e)>LOOK)continue;const tc=clearTime(e.v,e);
    for(const o of P){if(o.v===e.v)continue;if(inside(o)){put(e.v,stopAt(e),o.v,'x-pin');continue}
     const vo=o.v.held?(o.v.sp||0):Math.max(o.v.sp||0,Math.min(o.v.vmax||5,3));
     if(o.din-front(o.v)-vo*tc<1.1){
      // attente trop longue (flot continu à droite) : on passe dès que le prioritaire peut encore s'arrêter avant le croisement
      if((e.v.waitT||0)>8&&o.din-front(o.v)>(o.v.sp||0)**2/8+1.5){if(!P.some(q=>q.v!==e.v&&inside(q)))e.v.force=Math.max(e.v.force||0,1.2);continue}
      put(e.v,stopAt(e),o.v,'x-gap')}}}
   // le prioritaire attend celui qui est déjà engagé dans le croisement
   for(const e of P){if(inside(e)||stopAt(e)>LOOK)continue;for(const o of Y){if(o.v===e.v)continue;if(inside(o)&&!o.v.held)put(e.v,stopAt(e),o.v,'x-yin');
     // celui d'en face attend depuis longtemps : on s'arrête (si on peut encore freiner) pour lui laisser le passage
     else if(!inside(o)&&(o.v.waitT||0)>8&&o.v.gate<.3&&stopAt(e)>(e.v.sp||0)**2/8&&!NT.geo.get(e.side==='a'?z.a:z.b)?.ring&&!NT.geo.get(e.v.lane)?.ring)put(e.v,stopAt(e),o.v,'x-courtesy')}}}
 }
 // rond-point : on n'entre que s'il reste du jeu sur l'anneau (sinon la file fait le tour complet et plus personne n'avance)
 const ringLoad=new Map(),addLoad=(id,v)=>ringLoad.set(id,(ringLoad.get(id)||0)+front(v)+back(v)+.9),pend=[];
 for(const v of list){const g=NT.geo.get(v.lane);if(g&&g.ring){addLoad(g.id,v);continue}const nx=v.route&&v.route[v.ri+1],gr=nx&&NT.geo.get(nx.lane);if(!gr||!gr.ring)continue;const H=hits.get(v.id);let e=null;
  for(const h of H?H.values():[])if(h.z.type==='merge'&&(h.z.a===gr.id||h.z.b===gr.id)&&h.side===h.z.yside)e={v,...h};if(!e)continue;
  // déjà engagé dans l'entrée : compte comme sur l'anneau
  if(inside(e))addLoad(gr.id,v);else pend.push([v,gr,e])}
 pend.sort((p,q)=>(q[0].waitT||0)-(p[0].waitT||0)||stopAt(p[2])-stopAt(q[2]));
 for(const [v,g,e] of pend){
  if((ringLoad.get(g.id)||0)+front(v)+back(v)+.9>g.len*.7){put(v,stopAt(e),null,'ringfull');v.full=stopAt(e);continue}
  // chacun son tour : si une autre entrée attend depuis bien plus longtemps, on la laisse passer
  for(const u of list){if(u===v||!(u.waitT>6)||u.waitT<=(v.waitT||0)+1||(u.waitOn&&u.waitOn.includes(v.id))||!(u.gate<.3))continue;const un=u.route&&u.route[u.ri+1];if(!un||un.lane!==g.id||NT.geo.get(u.lane)?.ring)continue;put(v,stopAt(e),u,'tour');break}
  // s'il va s'engager maintenant, il occupe déjà sa place sur l'anneau pour les suivants
  if(!gates.has(v.id)&&stopAt(e)<2.5)addLoad(g.id,v)}
 // pas de blocage de carrefour : on ne s'engage que s'il y a la place de ressortir derrière le véhicule qui précède
 for(const v of list){const H=hits.get(v.id);if(!H||!H.size)continue;let lead=null,ld=Infinity;
  for(const o of list){if(o===v||o.lane==null)continue;const d=distTo(NT,v,o.lane,o.s,LOOK+12);if(d!=null&&d>0&&d<ld){ld=d;lead=o}}
  if(!lead)continue;
  if(NT.geo.get(v.lane)?.ring)continue;// sur l'anneau, on suit simplement celui de devant
  for(const h of H.values()){const e={v,...h};if(inside(e)||stopAt(e)>12||NT.geo.get(h.side==='a'?h.z.a:h.z.b)?.ring)continue;const intoRing=h.z.type==='merge'&&NT.geo.get(h.side==='a'?h.z.b:h.z.a)?.ring;
   if((lead.sp||0)>1.5&&!intoRing)continue;if(ld-back(lead)<h.dout+front(v)+back(v)+.8)put(v,stopAt(e),null,'box')}}
 // interblocage : si tous ceux qu'on attend sont eux-mêmes à l'arrêt, celui qui attend depuis le plus longtemps passe
 for(const v of list){if(gates.has(v.id)&&gates.get(v.id)<1.5&&(v.sp||0)<1){v.waitT=(v.waitT||0)+dt}else if(!gates.has(v.id))v.waitT=0;v.waitOn=v._wait}
 for(const v of list){if(!gates.has(v.id)||!v.waitOn||!v.waitOn.length||(v.waitT||0)<3||!/^x/.test(v.gtag||''))continue;
  const others=v.waitOn.map(id=>list.find(o=>o.id===id)).filter(Boolean);
  if(others.every(o=>(o.sp||0)<.05&&((o.waitT||0)<v.waitT||((o.waitT||0)===v.waitT&&o.id>v.id)))){gates.delete(v.id);v.waitOn=null;v.force=1.5}}
 breakCycles(list,gates,dt);
 for(const v of list){if(v.force>0){v.force-=dt;gates.delete(v.id)}if(v.full!=null)gates.set(v.id,Math.min(gates.get(v.id)??Infinity,v.full));if(v.ignoreT>0)v.ignoreT-=dt;v.held=gates.has(v.id)&&gates.get(v.id)<2;v.prio=v._prio}
 return gates}
export function aheadPt(NT,v,d0){let k=v.ri,u=v.u+d0;while(k<v.route.length&&u>v.route[k].len){u-=v.route[k].len;k++}if(k>=v.route.length)return null;const sg=v.route[k];return pos(NT.geo.get(sg.lane),sg.from+u)}
function pedBlocks(NT,v,a,my){for(let d=my+.2;d<=my+2.2;d+=.5){const q=aheadPt(NT,v,d);if(!q)return false;if(Math.hypot(a.x-q.x,a.y-q.z)<1.05)return true}return false}
