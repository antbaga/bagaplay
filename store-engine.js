// BagaStore : moteur de simulation (sans DOM, testable dans Node).
// S : état sauvegardé (magasin, argent, stocks). R : état d'exécution (clients, employés, files d'attente).
import * as D from './store-data.js';
const W=D.LOT_W,H=D.LOT_H,N=W*H,RY=D.ROAD.y,RE=D.ROAD.y+D.ROAD.h;
// route principale : rangs RY..RE-1. Vers l'ouest sur la moitié nord (voie RY+1), vers l'est sur la moitié sud (voie RE-2).
const LANE_W=RY+1,LANE_E=RE-2;
export const DIRS=[[0,1],[-1,0],[0,-1],[1,0]];   // devant d'un meuble selon sa rotation (0 : vers le sud)
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const idx=(x,y)=>y*W+x;
export function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

// ---------------------------------------------------------------- nouvelle partie
export function newGame(){
 const s=D.START,S={v:1,d:1,hour:D.HOURS.open,open:false,cash:s.cash,loan:{left:s.loan,monthly:s.loanMonthly},rep:s.rep,
  b:{x0:s.x0,y0:s.y0,x1:s.x1,y1:s.y1},fy:s.y1-1,ent:s.entrance,built:new Array(N).fill(0),wall:new Array(N).fill(0),zone:new Array(N).fill(0),items:[],nid:1,
  reserve:{},staff:{},staffDays:{},budget:5200,eco:31,alloc:{},margin:{},ads:{until:0,boost:0},extraLoans:0,
  month:blankMonth(),dayStats:blankDay(),last:null,history:[],sold:{},over:false};
 for(const c of D.CATS){S.reserve[c.id]=0;S.margin[c.id]=c.ref;S.sold[c.id]=0}
 S.alloc=defaultAlloc();
 for(const r of D.ROLES){S.staff[r.id]=0;S.staffDays[r.id]=0}
 for(let y=s.y0;y<s.y1;y++)for(let x=s.x0;x<s.x1;x++)S.built[idx(x,y)]=1;S.monthCat={};S.catHist=[];
 // réserve au nord, séparée par un mur avec une porte au milieu
 for(let y=s.y0;y<s.y0+s.reserveRows;y++)for(let x=s.x0;x<s.x1;x++)S.zone[idx(x,y)]=1;
 const wy=s.y0+s.reserveRows;for(let x=s.x0;x<s.x1;x++)S.wall[idx(x,wy)]=1;
 S.wall[idx((s.x0+s.x1>>1)-1,wy)]=2;
 S.ground=defaultGround(S);S.trees=genTrees(S);S.lw=W;S.lh=H;
 defaultParking(S);
 return S;
}
// sol : 0 herbe, 1 goudron, 2 route. La route principale (3 rangs du bas) ne se modifie pas.
export const isMainRoad=(x,y)=>y>=RY&&y<RE;
export const isRoad=g=>g===2||g===4||g===5;
// devant le magasin : trottoir le long de la façade, places de parking, allée de 2 voies qui donne sur la route principale,
// trottoirs sur les côtés (vers celui de la route) et une allée piétonne devant l'entrée
function defaultGround(S){const g=new Array(N).fill(0),set=(x,y,t)=>{if(inLot(x,y)&&!inside(S,x,y))g[idx(x,y)]=t};
 for(let y=RY;y<RE;y++)for(let x=0;x<W;x++)g[idx(x,y)]=2;
 const x0=S.b.x0-4,x1=S.b.x1+3,y0=S.fy+1;
 for(let x=x0+2;x<=x1-2;x++)for(let y=RY-2;y<RY;y++)set(x,y,2);
 for(let x=x0;x<=x1;x++)set(x,y0,3);for(let y=y0;y<RY;y++)for(const x of [x0,x0+1,x1-1,x1])set(x,y,3);
 for(let y=y0+1;y<RY-2;y++)for(let x=S.ent;x<=S.ent+1;x++)set(x,y,3);
 addSidewalks(S,g);S.gv=2;return g}
// anciennes sauvegardes : le goudron n'est plus carrossable. Il devient route, trottoir le long du magasin, et reste sous les places.
function migrateGround(S){const g=S.ground,under=new Set(),dock=new Set();
 for(const it of S.items){if(it.t==='spot')for(const c of cells(it))under.add(c);if(it.t==='dock')for(const [x,y] of back(it))if(inLot(x,y))dock.add(idx(x,y))}
 for(let i=0;i<N;i++){if(g[i]!==1||under.has(i))continue;const x=i%W,y=i/W|0;
  g[i]=!dock.has(i)&&DIRS.some(([dx,dy])=>inside(S,x+dx,y+dy))?3:2}
 S.gv=2}
// trottoirs : le long de la route principale et tout autour du magasin
function addSidewalks(S,g){for(let x=0;x<W;x++)for(const y of [RY-1,RE])if(!g[idx(x,y)]&&!S.built[idx(x,y)])g[idx(x,y)]=3;
 for(let y=0;y<RY;y++)for(let x=0;x<W;x++){const i=idx(x,y);if(g[i]||S.built[i])continue;let near=false;for(let dy=-1;dy<=1&&!near;dy++)for(let dx=-1;dx<=1;dx++)if(inside(S,x+dx,y+dy)){near=true;break}if(near)g[i]=3}}
function genTrees(S){const o=[],used=new Set();let s=11;const r=()=>(s=(s*16807)%2147483647)/2147483647;
 const want=Math.round(N/40);for(let k=0;k<want*2&&o.length<want;k++){const x=Math.floor(r()*W),y=Math.floor(r()*H),i=idx(x,y);
  if(used.has(i)||S.ground[i]||(y>=RY-1&&y<=RE)||x>=S.b.x0-2&&x<S.b.x1+2&&y>=S.b.y0-2&&y<=S.fy+1)continue;let near=false;for(const j of used){const dx=j%W-x,dy=(j/W|0)-y;if(dx*dx+dy*dy<5){near=true;break}}if(near)continue;
  used.add(i);o.push([x,y,+(.7+r()*.6).toFixed(2)])}return o}
export function treeAt(S,x,y){return (S.trees||[]).findIndex(t=>t[0]===x&&t[1]===y)}
export function clearTrees(S,cellsIdx){const set=new Set(cellsIdx);const n=(S.trees||[]).length;S.trees=(S.trees||[]).filter(t=>!set.has(idx(t[0],t[1])));return n-S.trees.length}
// magasin de départ : trottoirs, accès camion, quai, racks, rayons d'épicerie et caisses (sans frais ni coupe)
export function starter(S){const g=S.ground,G=(x,y,t)=>{if(inLot(x,y)&&!inside(S,x,y)&&!isMainRoad(x,y))g[idx(x,y)]=t};
 for(let y=10;y<RY;y++)for(let x=10;x<=12;x++)G(x,y,2);for(let y=10;y<=12;y++)for(let x=13;x<=18;x++)G(x,y,2);
 for(let y=10;y<=17;y++)for(let x=19;x<=24;x++)G(x,y,2);
 S.trees=(S.trees||[]).filter(t=>!g[idx(t[0],t[1])]);dirty(S);
 const P=(t,x,y,r,cat)=>{const why=canPlace(S,t,x,y,r);if(why)throw new Error('starter '+t+' '+x+','+y+': '+why);S.items.push({id:S.nid++,t,x,y,r,cat:cat||null,stock:0});dirty(S)};
 P('dock',20,18,0);for(const x of [24,26,30,32])P('rack',x,18,0);
 const am=['epicerie','boissons','sucre','epicerie','petitdej','hygiene','boissons','epicerie','sucre','alcool','entretien','petitdej'];let k=0;
 for(const [y,r] of [[26,2],[27,0]])for(const x of [21,23,25,32,34,36])P('shelf',x,y,r,am[k++]);
 for(const x of [25,32])P('checkout',x,36,0);
 for(const it of S.items)if(def(it.t).kind==='sale')it.stock=def(it.t).cap;
 S.cash=D.START.starterCash;applyPlan(S);return S}
// % d'achat par défaut : seulement les rayons présents dans le magasin
export function allocFor(S){const o=new Set();for(const it of S.items)if(it.cat)o.add(it.cat);if(!o.size)return defaultAlloc();
 const w={};for(const c of D.CATS)w[c.id]=o.has(c.id)?c.demand:0;return defaultAlloc(w)}
function defaultParking(S){for(const x of [20,22,24,26,32,34,36,38]){if(!canPlace(S,'spot',x,S.fy+2,0)){const it={id:S.nid++,t:'spot',x,y:S.fy+2,r:0,cat:null,stock:0};S.items.push(it);for(const c of cells(it))S.ground[c]=1}dirty(S)}}
// répartition du budget d'achat en valeur : demande × prix d'achat (total 100 %)
export function defaultAlloc(weights){const w={};let t=0;for(const c of D.CATS){w[c.id]=weights?weights[c.id]||0:c.demand;t+=w[c.id]}
 const o={};if(!t){for(const c of D.CATS)o[c.id]=0;return o}let sum=0;for(const c of D.CATS){o[c.id]=Math.round(w[c.id]/t*100);sum+=o[c.id]}
 const top=D.CATS.reduce((p,c)=>w[c.id]>w[p.id]?c:p);o[top.id]+=100-sum;return o}
// répartition selon les ventes (en valeur d'achat) depuis le début du mois
export function allocFromSales(S){const w={};for(const c of D.CATS)w[c.id]=(S.sold[c.id]||0)*c.cost;return defaultAlloc(Object.values(w).some(v=>v>0)?w:null)}
function blankMonth(){return {rev:0,cogs:0,buy:0,build:0,ads:0,loss:0,theft:0,customers:0,sat:0,salaries:0,elec:0,loan:0,interest:0}}
function blankDay(){return {th:{},cats:{},ads:0,build:0,waitPen:0,dirtPen:0,rev:0,cogs:0,customers:0,sat:0,rupture:0,notSold:0,expensive:0,angry:0,theft:0,loss:0,buy:0,units:0}}

// ---------------------------------------------------------------- géométrie
export const inside=(S,x,y)=>x>=0&&y>=0&&x<W&&y<H&&S.built[y*W+x]===1;
export function bounds(S){let x0=W,y0=H,x1=0,y1=0;for(let i=0;i<N;i++)if(S.built[i]){const x=i%W,y=i/W|0;if(x<x0)x0=x;if(y<y0)y0=y;if(x+1>x1)x1=x+1;if(y+1>y1)y1=y+1}S.b={x0,y0,x1,y1};return S.b}
export const inLot=(x,y)=>x>=0&&y>=0&&x<W&&y<H;
export const def=t=>D.ITEM[t];
export function size(it){const d=def(it.t);return it.r%2?[d.d,d.w]:[d.w,d.d]}
export function cells(it){const [w,d]=size(it),out=[];for(let j=0;j<d;j++)for(let i=0;i<w;i++)out.push(idx(it.x+i,it.y+j));return out}
// cases devant le meuble (là où l'on se tient pour se servir)
export function front(it){const [w,d]=size(it),o=[];
 if(it.r===0)for(let i=0;i<w;i++)o.push([it.x+i,it.y+d]);
 if(it.r===2)for(let i=0;i<w;i++)o.push([it.x+i,it.y-1]);
 if(it.r===1)for(let j=0;j<d;j++)o.push([it.x-1,it.y+j]);
 if(it.r===3)for(let j=0;j<d;j++)o.push([it.x+w,it.y+j]);
 return o}
// cases derrière (quai : contre le mur extérieur)
function back(it){const [w,d]=size(it),o=[];
 if(it.r===0)for(let i=0;i<w;i++)o.push([it.x+i,it.y-1]);
 if(it.r===2)for(let i=0;i<w;i++)o.push([it.x+i,it.y+d]);
 if(it.r===1)for(let j=0;j<d;j++)o.push([it.x+w,it.y+j]);
 if(it.r===3)for(let j=0;j<d;j++)o.push([it.x-1,it.y+j]);
 return o}
export function area(S){let n=0;for(let i=0;i<N;i++)n+=S.built[i];return n}
export function salesArea(S){let n=0;for(let i=0;i<N;i++)if(S.built[i]&&!S.zone[i]&&!S.wall[i])n++;return n}
// entrées : la porte principale (façade sud) et celles ajoutées (S.doors : {x,y,dx,dy}, 2 cases le long du mur, (dx,dy) vers l'extérieur)
export function entrances(S){const o=[{cells:[[S.ent,S.fy],[S.ent+1,S.fy]],d:[0,1],main:true}];
 for(const e of S.doors||[]){const ax=e.dy?1:0,ay=e.dy?0:1,c=[[e.x,e.y],[e.x+ax,e.y+ay]];
  if(c.every(([x,y])=>inside(S,x,y)&&!inside(S,x+e.dx,y+e.dy)))o.push({cells:c,d:[e.dx,e.dy],door:e})}
 return o}
const entCells=S=>entrances(S).flatMap(e=>e.cells);
const entAt=(S,x,y)=>entrances(S).find(e=>e.cells.some(([a,b])=>a===x&&b===y));
const isEntrance=(S,x,y)=>!!entAt(S,x,y);
const nearEntrance=(S,x,y)=>entrances(S).some(e=>e.cells.some(([a,b])=>(a===x&&b===y)||(a-e.d[0]===x&&b-e.d[1]===y)));
// devant une entrée, dehors (2 cases de profondeur, une de plus sur les côtés) : on laisse le passage
const entApron=(S,x,y)=>entrances(S).some(e=>e.cells.some(([a,b])=>{for(let k=1;k<=2;k++)for(let l=-1;l<=1;l++){const px=a+e.d[0]*k+e.d[1]*l,py=b+e.d[1]*k+e.d[0]*l;if(px===x&&py===y)return true}return false}));
export function entrancePlan(S,x,y){if(!inside(S,x,y))return {why:'Touche le bord du magasin, côté intérieur.'};
 const L=layout(S),opts=[];for(const [dx,dy] of DIRS){if(inside(S,x+dx,y+dy))continue;const ax=dy?1:0,ay=dy?0:1;for(const s of [0,-1])opts.push({x:x+ax*s,y:y+ay*s,dx,dy})}
 if(!opts.length)return {why:'Touche le bord du magasin, côté intérieur.'};let why='Pas de place pour une entrée ici.';
 for(const e of opts){const ax=e.dy?1:0,ay=e.dy?0:1,c=[[e.x,e.y],[e.x+ax,e.y+ay]];
  if(!c.every(([cx,cy])=>inside(S,cx,cy)&&!inside(S,cx+e.dx,cy+e.dy)))continue;
  if(c.some(([cx,cy])=>isEntrance(S,cx,cy))){why='Il y a déjà une entrée ici.';continue}
  if(c.some(([cx,cy])=>S.zone[idx(cx,cy)])){why='Une entrée donne sur le magasin, pas sur la réserve.';continue}
  if(c.some(([cx,cy])=>L.occ[idx(cx,cy)]||S.wall[idx(cx,cy)]||L.occ[idx(cx-e.dx,cy-e.dy)]||S.wall[idx(cx-e.dx,cy-e.dy)])){why='Libère la place derrière la porte (meuble ou mur).';continue}
  const out=c.map(([cx,cy])=>[cx+e.dx,cy+e.dy]);if(out.some(([ox,oy])=>!inLot(ox,oy)||isMainRoad(ox,oy))){why='Il faut de la place dehors.';continue}
  if(out.some(([ox,oy])=>L.occ[idx(ox,oy)])){why='Libère la place devant la porte, dehors.';continue}
  const pave=out.filter(([ox,oy])=>!S.ground[idx(ox,oy)]).length;return {door:e,cells:c,out,why:null,cost:D.ENTRANCE_COST+pave*GROUND_COST[3]}}
 return {why}}
export function addEntrance(S,x,y){const p=entrancePlan(S,x,y);if(p.why)return p.why;if(S.cash<p.cost)return 'Pas assez d’argent.';
 // dehors, devant la porte : un bout de trottoir si c'est de l'herbe
 for(const [ox,oy] of p.out){const i=idx(ox,oy);if(!S.ground[i])S.ground[i]=3}
 (S.doors||(S.doors=[])).push(p.door);pay(S,p.cost,'build');dirty(S);return null}

// ---------------------------------------------------------------- grille de passage et champs de distance
// mode 'c' : clients (pas la réserve), 's' : employés.
export function layout(S){if(S._L)return S._L;
 const occ=new Int32Array(N);for(const it of S.items)for(const c of cells(it))occ[c]=it.id;
 const pc=new Uint8Array(N),ps=new Uint8Array(N);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=idx(x,y);
  if(!inside(S,x,y)){const o=occ[i]&&S.items.find(it=>it.id===occ[i]);if(o&&o.t==='corral')continue;if(!S.ground||S.ground[i]||(o&&o.t==='busstop')){pc[i]=ps[i]=1}continue}
  if(occ[i]||S.wall[i]===1)continue;ps[i]=1;if(!S.zone[i])pc[i]=1}
 for(const [tx,ty] of S.trees||[]){const i=idx(tx,ty);pc[i]=ps[i]=0}
 // coût de marche : trottoir, passage piéton et intérieur 1, goudron 2, place de parking 6, bord de route 4, milieu de la route 14
 // (on sort de la voiture vers le trottoir le plus proche, sinon on longe le bord de la route ; on ne traverse que si besoin)
 const wc=new Uint8Array(N).fill(1),G=S.ground;
 if(G)for(let i=0;i<N;i++){if(S.built[i])continue;const g=G[i];if(g===1)wc[i]=occ[i]&&S.items.find(it=>it.id===occ[i])?.t==='spot'?6:2;
  else if(g===4)wc[i]=1;else if(g===2||g===5){const x=i%W,y=i/W|0;wc[i]=DIRS.some(([dx,dy])=>inLot(x+dx,y+dy)&&!isRoad(G[idx(x+dx,y+dy)]))?4:14}}
 S._L={occ,pc,ps,wc,fields:new Map()};assign(S);return S._L}
export const dirty=S=>{S._L=null};
function canStep(S,P,x,y,nx,ny){if(!inLot(nx,ny)||!P[idx(nx,ny)])return false;
 const a=inside(S,x,y),b=inside(S,nx,ny);if(a===b)return true;
 // on n'entre et ne sort que par une entrée
 const [ix,iy,ox,oy]=a?[x,y,nx,ny]:[nx,ny,x,y],e=entAt(S,ix,iy);return !!e&&ix+e.d[0]===ox&&iy+e.d[1]===oy}
export function field(S,key,mode){const L=layout(S),k=mode+key;let f=L.fields.get(k);if(f)return f;
 // distances pondérées (Dijkstra par seaux) : trottoir et intérieur 1, chaussée et parking 3
 const P=mode==='c'?L.pc:L.ps;f=new Int16Array(N).fill(-1);const cost=i=>L.wc[i],B=[[]];let nb=0;
 for(const [x,y] of targets(S,key))if(inLot(x,y)&&P[idx(x,y)]&&f[idx(x,y)]<0){f[idx(x,y)]=0;B[0].push(idx(x,y));nb++}
 for(let d=0;nb>0;d++){const bk=B[d];if(!bk)continue;for(let h=0;h<bk.length;h++){const i=bk[h];nb--;if(f[i]!==d)continue;const x=i%W,y=i/W|0;
  for(const [dx,dy] of DIRS){const nx=x+dx,ny=y+dy;if(!canStep(S,P,x,y,nx,ny))continue;const j=idx(nx,ny),nd=d+cost(j);if(f[j]<0||nd<f[j]){f[j]=nd;(B[nd]||(B[nd]=[])).push(j);nb++}}}B[d]=null}
 L.fields.set(k,f);return f}
function targets(S,key){
 if(key==='street'){const o=[];for(let y=0;y<H;y++)if(!isMainRoad(0,y))o.push([0,y],[W-1,y]);return o}
 if(key.startsWith('item:')){const it=S.items.find(o=>o.id===+key.slice(5));if(it&&it.t==='busstop')return cells(it).map(c=>[c%W,c/W|0])}
 if(key==='ent')return entCells(S);
 if(key.startsWith('cell:')){const i=+key.slice(5);return [[i%W,i/W|0]]}
 if(key.startsWith('item:')){const it=S.items.find(o=>o.id===+key.slice(5));return it?front(it):[]}
 return []}

// ---------------------------------------------------------------- placement
export function canPlace(S,t,x,y,r){const d=def(t),it={t,x,y,r},L=layout(S);
 if(d.zone===2){for(const c of cells(it)){const cx=c%W,cy=c/W|0;
   if(!inLot(cx,cy)||inside(S,cx,cy))return 'Dehors, sur le parking.';
   if(isMainRoad(cx,cy)||isRoad(S.ground[c]))return 'Pas sur la route.';
   if(L.occ[c])return 'Place déjà prise.';
   if((cx>=S.ent-1&&cx<=S.ent+2&&cy<=S.fy+2)||entApron(S,cx,cy))return 'Laisse l’accès à l’entrée.';
   if(d.kind==='bus'&&cy!==RY-1&&cy!==RE)return 'L’arrêt de bus se place au bord de la route.'}
  if(d.kind==='spot'&&!front(it).every(([fx,fy])=>inLot(fx,fy)&&isRoad(S.ground[idx(fx,fy)])&&!inside(S,fx,fy)))return 'L’entrée de la place doit donner sur une route.';
  return null}
 for(const c of cells(it)){const cx=c%W,cy=c/W|0;
  if(!inside(S,cx,cy))return 'Hors du magasin.';
  if(S.wall[c])return 'Il y a un mur.';
  if(L.occ[c])return 'Place déjà prise.';
  if(S.zone[c]!==d.zone)return d.zone?'À placer dans la réserve.':'À placer dans le magasin, pas dans la réserve.';
  if(nearEntrance(S,cx,cy))return 'Laisse l’entrée libre.'}
 if(d.kind==='dock'){if(!back(it).every(([bx,by])=>inLot(bx,by)&&!inside(S,bx,by)&&!isMainRoad(bx,by)))return 'Le quai se place contre un mur extérieur.'}
 if(d.kind!=='decor'){const f=front(it);
  if(!f.some(([fx,fy])=>inside(S,fx,fy)&&!S.wall[idx(fx,fy)]&&!L.occ[idx(fx,fy)]&&(d.zone||!S.zone[idx(fx,fy)])))return 'Il faut une case libre devant.'}
 // ne pas couper l'accès aux autres meubles
 S.items.push({...it,id:-1,cat:null,stock:0});dirty(S);const bad=reachProblem(S);S.items.pop();dirty(S);
 return bad}
// vérifie que chaque meuble reste accessible depuis l'entrée
export function reachProblem(S){const fc=field(S,'ent','c'),fs=field(S,'ent','s');
 for(const it of S.items){const d=def(it.t);if(d.kind==='decor'||d.zone===2)continue;
  const f=d.zone||d.kind==='dock'?fs:fc;if(!front(it).some(([x,y])=>inLot(x,y)&&f[idx(x,y)]>=0))return 'Cela bloquerait l’accès à un meuble.'}
 return null}
export function placeCost(S,t,x,y,r){const d=def(t);if(d.kind!=='spot')return d.price;return d.price+cells({t,x,y,r}).filter(c=>S.ground[c]!==1).length*GROUND_COST[1]}
export function place(S,t,x,y,r,cat){const why=canPlace(S,t,x,y,r);if(why)return why;const d=def(t),price=placeCost(S,t,x,y,r);
 if(S.cash<price)return 'Pas assez d’argent.';if(d.kind==='spot')for(const c of cells({t,x,y,r}))S.ground[c]=1;
 const it={id:S.nid++,t,x,y,r,cat:d.cats?(cat&&d.cats.includes(cat)?cat:bestCat(S,d)):null,stock:0};clearTrees(S,cells(it));
 S.items.push(it);pay(S,price,'build');dirty(S);remember(S,{type:'item',id:it.id,cost:price});return it}
// rayon le moins couvert (pondéré par la demande)
export function bestCat(S,d){let best=d.cats[0],bv=-1;for(const c of d.cats){const n=S.items.filter(o=>o.cat===c).length;const v=D.CAT[c].demand/(1+n*2);if(v>bv){bv=v;best=c}}return best}
export function setCat(S,id,cat){const it=S.items.find(o=>o.id===id);if(!it||!def(it.t).cats?.includes(cat)||it.cat===cat)return;S.reserve[it.cat]+=it.stock;it.stock=0;it.cat=cat}
export function reserveLoss(S,id){const it=S.items.find(o=>o.id===id);if(!it||def(it.t).kind!=='reserve')return 0;const st=def(it.t).store,c=capacity(S);return Math.max(0,c.used[st]-(c.cap[st]-def(it.t).cap))}
export function removeItem(S,id){const k=S.items.findIndex(o=>o.id===id);if(k<0)return;const it=S.items[k],lost=reserveLoss(S,id);
 if(lost){const st=def(it.t).store,cats=D.CATS.filter(c=>c.store===st),tot=cats.reduce((t,c)=>t+S.reserve[c.id],0);let v=0;
  for(const c of cats){const u=Math.min(S.reserve[c.id],Math.ceil(lost*S.reserve[c.id]/tot));S.reserve[c.id]-=u;v+=u*c.cost}S.month.loss+=v;S.dayStats.loss+=v}
 if(it.cat&&it.stock)S.reserve[it.cat]+=it.stock;S.items.splice(k,1);S.cash+=Math.round(def(it.t).price*D.REFUND);S.month.build-=Math.round(def(it.t).price*D.REFUND);dirty(S)}
export function canMove(S,id,x,y,r){const k=S.items.findIndex(o=>o.id===id);if(k<0)return 'Introuvable.';const it=S.items[k];S.items.splice(k,1);dirty(S);const why=canPlace(S,it.t,x,y,r);S.items.splice(k,0,it);dirty(S);return why}
export function moveItem(S,id,x,y,r){const why=canMove(S,id,x,y,r);if(why)return why;const it=S.items.find(o=>o.id===id);Object.assign(it,{x,y,r});dirty(S);return null}
export function rotateItem(S,id){const it=S.items.find(o=>o.id===id);if(!it)return 'Introuvable.';const k=S.items.indexOf(it);S.items.splice(k,1);dirty(S);
 const r=(it.r+1)%4,why=canPlace(S,it.t,it.x,it.y,r);S.items.splice(k,0,why?it:Object.assign(it,{r}));dirty(S);return why}
export const UNDO_MS=20000;
const remember=(S,u)=>{S._undo={...u,at:Date.now()}};
export function canUndo(S){return !!S._undo&&Date.now()-S._undo.at<UNDO_MS}
export function undo(S){const u=S._undo;S._undo=null;if(!u||Date.now()-u.at>UNDO_MS)return 'Trop tard pour annuler.';
 if(u.type==='item'){const k=S.items.findIndex(o=>o.id===u.id);if(k<0)return 'Déjà retiré.';const it=S.items[k];if(it.cat&&it.stock)S.reserve[it.cat]+=it.stock;S.items.splice(k,1)}
 if(u.type==='wall')for(const i of u.cells)S.wall[i]=0;
 if(u.type==='ground')u.cells.forEach((i,k)=>S.ground[i]=u.prev[k]);
 if(u.type==='oneway')u.cells.forEach((i,k)=>{S.oneway[i]=u.prev[k];if(S.owid&&u.pid)S.owid[i]=u.pid[k]});
 if(u.type==='extend'){const L=layout(S);if(u.cells.some(i=>L.occ[i]||S.wall[i]))return 'Des objets sont posés sur l’extension.';for(const i of u.cells)S.built[i]=0;bounds(S)}
 S.cash+=u.cost;S.month.build-=u.cost;dirty(S);return null}
function pay(S,v,k){S.cash-=v;S.month[k]+=v;if(S.dayStats&&k in S.dayStats)S.dayStats[k]+=v}

// murs : ligne droite entre deux cases
export function lineCells(a,b){const o=[];if(Math.abs(a[0]-b[0])>=Math.abs(a[1]-b[1])){const y=a[1],s=Math.sign(b[0]-a[0])||1;for(let x=a[0];x!==b[0]+s;x+=s)o.push([x,y])}else{const x=a[0],s=Math.sign(b[1]-a[1])||1;for(let y=a[1];y!==b[1]+s;y+=s)o.push([x,y])}return o}
export function wallPlan(S,a,b){const L=layout(S);return lineCells(a,b).filter(([x,y])=>inside(S,x,y)&&!S.wall[idx(x,y)]&&!L.occ[idx(x,y)]&&!nearEntrance(S,x,y))}
export function buildWall(S,a,b){const c=wallPlan(S,a,b);if(!c.length)return 'Rien à construire ici.';const cost=c.length*D.WALL_COST;if(S.cash<cost)return 'Pas assez d’argent.';
 for(const [x,y] of c)S.wall[idx(x,y)]=1;dirty(S);const bad=reachProblem(S);if(bad){for(const [x,y] of c)S.wall[idx(x,y)]=0;dirty(S);return bad}
 pay(S,cost,'build');remember(S,{type:'wall',cells:c.map(([x,y])=>idx(x,y)),cost});return null}
export function makeDoor(S,x,y){const i=idx(x,y);if(S.wall[i]!==1)return 'Touche un mur.';if(S.cash<D.DOOR_COST)return 'Pas assez d’argent.';S.wall[i]=2;dirty(S);pay(S,D.DOOR_COST,'build');return null}
// ensembles démolis d'un coup : un bloc de sens unique (ou, pour un ancien tracé, les cases voisines de même sens) ; une ligne de passage piéton ou de cédez-le-passage
export function owGroup(S,i){const id=S.owid?.[i];if(id){const o=[];for(let k=0;k<N;k++)if(S.owid[k]===id&&S.oneway[k]>=0)o.push(k);return o}
 const d=S.oneway[i];return flood(i,k=>S.oneway[k]===d&&!(S.owid?.[k]))}
export function groundGroup(S,i){const g=S.ground[i];return flood(i,k=>S.ground[k]===g&&!inside(S,k%W,k/W|0))}
function flood(i,ok){const seen=new Set([i]),st=[i];while(st.length){const c=st.pop(),x=c%W,y=c/W|0;for(const [dx,dy] of DIRS){const nx=x+dx,ny=y+dy;if(!inLot(nx,ny))continue;const j=idx(nx,ny);if(!seen.has(j)&&ok(j)){seen.add(j);st.push(j)}}}return [...seen]}
export function eraseAt(S,x,y){if(!inLot(x,y))return 'Rien à démolir ici.';const i=idx(x,y),L=layout(S);
 if(L.occ[i]){removeItem(S,L.occ[i]);return null}
 {const e=entAt(S,x,y);if(e&&e.door){S.doors.splice(S.doors.indexOf(e.door),1);S.cash+=Math.round(D.ENTRANCE_COST*D.REFUND);dirty(S);return null}}
 if(S.wall[i]){S.cash+=Math.round((S.wall[i]===2?D.DOOR_COST:D.WALL_COST)*D.REFUND);S.wall[i]=0;dirty(S);return null}
 const t=treeAt(S,x,y);if(t>=0){S.trees.splice(t,1);dirty(S);return null}
 if(S.oneway&&S.oneway[i]>=0){for(const c of owGroup(S,i)){S.oneway[c]=-1;if(S.owid)S.owid[c]=0}dirty(S);return null}
 if(S.ground[i]===4||S.ground[i]===5){for(const c of groundGroup(S,i))S.ground[c]=2;dirty(S);return null}
 if(!inside(S,x,y)&&S.ground[i]&&!isMainRoad(x,y)){S.ground[i]=0;if(S.oneway)S.oneway[i]=-1;if(S.owid)S.owid[i]=0;dirty(S);return null}
 return 'Rien à démolir ici.'}
export function eraseInfo(S,x,y){if(!inLot(x,y))return null;const i=idx(x,y),L=layout(S);
 if(L.occ[i]){const it=S.items.find(o=>o.id===L.occ[i]);return {label:def(it.t).name,refund:Math.round(def(it.t).price*D.REFUND),cells:cells(it),lost:reserveLoss(S,it.id)}}
 {const e=entAt(S,x,y);if(e&&e.door)return {label:'Entrée',refund:Math.round(D.ENTRANCE_COST*D.REFUND),cells:e.cells.map(([a,b])=>idx(a,b))}}
 if(S.wall[i])return {label:S.wall[i]===2?'Porte':'Mur',refund:Math.round((S.wall[i]===2?D.DOOR_COST:D.WALL_COST)*D.REFUND),cells:[i]};
 if(treeAt(S,x,y)>=0)return {label:'Arbre',refund:0,cells:[i]};
 if(S.oneway&&S.oneway[i]>=0)return {label:'Sens unique',refund:0,cells:owGroup(S,i)};
 if(S.ground[i]===4||S.ground[i]===5)return {label:S.ground[i]===4?'Passage piéton':'Cédez le passage',refund:0,cells:groundGroup(S,i)};
 if(!inside(S,x,y)&&S.ground[i]&&!isMainRoad(x,y))return {label:['','Goudron','Route','Trottoir'][S.ground[i]],refund:0,cells:[i]};
 return null}
// goudron (rectangle), route (3 cases de large), trottoir (1 case), passage piéton (2 cases, sur une route)
export const GROUND_COST={1:40,2:60,3:30,4:20,5:10,6:5};
// tracés en ligne droite : on garde l'axe dominant (horizontal ou vertical)
export function straight(a,b){return Math.abs(b[0]-a[0])>=Math.abs(b[1]-a[1])?[b[0],a[1]]:[a[0],b[1]]}
const ONEWAY_ROAD=g=>g===2||g===4||g===5;
export function groundPlan(S,a,b,type){const L=layout(S),set=new Set();if(type!==1)b=straight(a,b);
 if(type===1){for(let y=Math.min(a[1],b[1]);y<=Math.max(a[1],b[1]);y++)for(let x=Math.min(a[0],b[0]);x<=Math.max(a[0],b[0]);x++)set.add(idx(x,y))}
 else{const ks=type===2||type===6?[-1,0,1]:[0];for(const [x,y] of lineCells(a,b)){const hor=Math.abs(a[0]-b[0])>=Math.abs(a[1]-b[1]);for(const k of ks){const cx=hor?x:x+k,cy=hor?y+k:y;if(inLot(cx,cy))set.add(idx(cx,cy))}}}
 if(type===6){const dir=dirOf(a,b),cl=[...set].filter(i=>!isMainRoad(i%W,i/W|0)&&ONEWAY_ROAD(S.ground[i])&&S.oneway?.[i]!==dir);
  return {cells:cl,dir,cost:cl.length*GROUND_COST[6],why:dir<0?'Trace le sens unique dans le sens de circulation.':cl.length?null:'Le sens unique se trace sur une route.'}}
 const cl=[];for(const i of set){const x=i%W,y=i/W|0;if(!inLot(x,y)||inside(S,x,y)||S.ground[i]===type)continue;
  if(type===4||type===5?S.ground[i]!==2:isMainRoad(x,y))continue;const o=L.occ[i]&&S.items.find(it=>it.id===L.occ[i]);if(o&&o.t!=='spot')continue;cl.push(i)}
 return {cells:cl,cost:cl.length*GROUND_COST[type],why:cl.length?null:type===4?'Le passage piéton se trace sur une route.':type===5?'Le cédez-le-passage se trace sur une route.':'Rien à construire ici.'}}
// sens unique : un bloc de 3 × 3 posé d'un toucher, centré sur la case touchée ; r = sens (index de DIRS)
export function onewayPlan(S,x,y,r){const cl=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const cx=x+dx,cy=y+dy;if(!inLot(cx,cy)||isMainRoad(cx,cy))continue;const i=idx(cx,cy);if(ONEWAY_ROAD(S.ground[i])&&S.oneway?.[i]!==r)cl.push(i)}
 const any=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(inLot(x+dx,y+dy)&&ONEWAY_ROAD(S.ground[idx(x+dx,y+dy)]))any.push(1);
 return {cells:cl,dir:r,cost:cl.length*GROUND_COST[6],why:cl.length?null:isMainRoad(x,y)?'La route principale a déjà son sens.':any.length?'Ce sens unique est déjà posé ici.':'Le sens unique se pose sur une route.'}}
export function placeOneway(S,x,y,r){const p=onewayPlan(S,x,y,r);if(p.why)return p.why;if(S.cash<p.cost)return 'Pas assez d’argent.';
 if(!S.oneway)S.oneway=new Array(N).fill(-1);if(!S.owid)S.owid=new Array(N).fill(0);const prev=p.cells.map(i=>S.oneway[i]),pid=p.cells.map(i=>S.owid[i]),id=S.owNext=(S.owNext||0)+1;
 for(const i of p.cells){S.oneway[i]=r;S.owid[i]=id}pay(S,p.cost,'build');dirty(S);remember(S,{type:'oneway',cells:p.cells,prev,pid,cost:p.cost});return null}
const dirOf=(a,b)=>{const dx=Math.sign(b[0]-a[0]),dy=Math.sign(b[1]-a[1]);return dx||dy?DIRS.findIndex(([x,y])=>x===dx&&y===dy):-1};
export function paintGround(S,a,b,type){const p=groundPlan(S,a,b,type);if(p.why)return p.why;if(S.cash<p.cost)return 'Pas assez d’argent.';
 if(type===6){if(!S.oneway)S.oneway=new Array(N).fill(-1);const prev=p.cells.map(i=>S.oneway[i]);for(const i of p.cells)S.oneway[i]=p.dir;pay(S,p.cost,'build');dirty(S);remember(S,{type:'oneway',cells:p.cells,prev,cost:p.cost});return null}
 const prev=p.cells.map(i=>S.ground[i]);for(const i of p.cells)S.ground[i]=type;clearTrees(S,p.cells);pay(S,p.cost,'build');dirty(S);remember(S,{type:'ground',cells:p.cells,prev,cost:p.cost});return null}
export function paintZone(S,a,b,z){const L=layout(S);let n=0;
 for(let y=Math.min(a[1],b[1]);y<=Math.max(a[1],b[1]);y++)for(let x=Math.min(a[0],b[0]);x<=Math.max(a[0],b[0]);x++){const i=idx(x,y);
  if(!inside(S,x,y)||nearEntrance(S,x,y)||S.zone[i]===z)continue;
  if(L.occ[i]&&def(S.items.find(o=>o.id===L.occ[i]).t).zone!==z)continue;S.zone[i]=z;n++}
 dirty(S);const bad=reachProblem(S);if(bad){return bad}return n?null:'Rien à changer ici.'}

// agrandissement : rectangle tracé hors du bâtiment, collé à lui, jamais devant la façade. Prix au m².
export function extendPlan(S,a,b){const m=D.EXTEND.margin,cells=[];let why=null,touch=false;
 for(let y=Math.min(a[1],b[1]);y<=Math.max(a[1],b[1]);y++)for(let x=Math.min(a[0],b[0]);x<=Math.max(a[0],b[0]);x++){
  if(inside(S,x,y))continue;
  if(x<m||y<m||x>=W-m||y>=H-m||isMainRoad(x,y))why='Le terrain s’arrête ici.';else if((x>=S.ent-1&&x<=S.ent+2&&y>S.fy&&y<=S.fy+3)||entApron(S,x,y))why='Laisse l’accès à l’entrée.';
  else{const o=layout(S).occ[idx(x,y)];if(o)why='Il y a un objet sur la zone.'}
  cells.push([x,y]);for(const [dx,dy] of DIRS)if(inside(S,x+dx,y+dy))touch=true}
 if(!cells.length)why=why||'Trace la zone hors du magasin.';else if(!touch&&!why)why='La zone doit toucher le magasin.';
 return {cells,m2:cells.length,cost:cells.length*D.EXTEND.perM2,why}}
export function extendRect(S,a,b){const p=extendPlan(S,a,b);if(p.why)return p.why;if(S.cash<p.cost)return 'Pas assez d’argent.';
 // la nouvelle surface prend la zone (magasin ou réserve) de la case voisine
 const set=new Set(p.cells.map(([x,y])=>idx(x,y))),q=[];
 for(const i of set){const x=i%W,y=i/W|0;for(const [dx,dy] of DIRS)if(inside(S,x+dx,y+dy)){S.zone[i]=S.zone[idx(x+dx,y+dy)];q.push(i);break}}
 const seen=new Set(q);for(let h=0;h<q.length;h++){const i=q[h],x=i%W,y=i/W|0;for(const [dx,dy] of DIRS){const j=idx(x+dx,y+dy);if(set.has(j)&&!seen.has(j)){seen.add(j);S.zone[j]=S.zone[i];q.push(j)}}}
 for(const i of set){S.built[i]=1;S.ground[i]=0}clearTrees(S,[...set]);
 bounds(S);pay(S,p.cost,'build');dirty(S);remember(S,{type:'extend',cells:[...set],cost:p.cost});return null}

// ---------------------------------------------------------------- personnel, prêts, publicité
export function hire(S,role,delta){const r=D.ROLE[role];if(!r)return 'Poste inconnu.';
 if(delta>0&&r.needs&&S.staff[role]>=S.items.filter(o=>o.t===r.needs).length)return `Il faut d’abord un ${def(r.needs).name.toLowerCase()} pour chaque ${r.name.toLowerCase()}.`;
 S.staff[role]=Math.max(0,S.staff[role]+delta);dirty(S);return null}
// emprunt : montant au choix (par 10 000 €), mensualité sur 10 ans ; remboursement anticipé : la durée restante ne change pas, la mensualité baisse d'autant
export const LOAN={step:10000,maxLeft:1000000,rate:D.EXTRA_LOAN.monthly/D.EXTRA_LOAN.amount};
export const loanRoom=S=>Math.max(0,Math.floor((LOAN.maxLeft-S.loan.left)/LOAN.step)*LOAN.step);
export const loanMonthly=a=>Math.round(a*LOAN.rate);
export function borrow(S,amount=D.EXTRA_LOAN.amount){amount=Math.min(Math.round(amount/LOAN.step)*LOAN.step,loanRoom(S));if(amount<=0)return 'Plafond d’emprunt atteint.';
 if(S.loan.left<=0)S.loan.monthly=0;S.cash+=amount;S.loan.left+=amount;S.loan.monthly+=loanMonthly(amount);S.extraLoans=(S.extraLoans||0)+1;return null}
export function repay(S,amount){amount=Math.min(Math.round(amount),S.loan.left,Math.floor(Math.max(0,S.cash)));if(amount<=0)return S.loan.left?'Pas assez d’argent.':'Aucun crédit à rembourser.';
 const old=S.loan.left;S.cash-=amount;S.loan.left=old-amount;S.loan.monthly=S.loan.left>0?Math.max(1,Math.round(S.loan.monthly*S.loan.left/old)):0;return null}
export function advertise(S,id){const a=D.ADS.find(x=>x.id===id);if(!a)return;pay(S,a.price,'ads');S.ads={until:S.d+a.days,boost:Math.max(a.boost,S.ads.until>S.d?S.ads.boost:0)}}

// postes tenus : caisses avec caissier, comptoirs avec leur artisan
function assign(S){const L=S._L;L.manned=new Set();
 let n=S.staff.caissier||0;for(const it of S.items)if(it.t==='checkout'&&n>0){L.manned.add(it.id);n--}
 for(const r of D.ROLES)if(r.needs){let k=S.staff[r.id]||0;for(const it of S.items)if(it.t===r.needs&&k>0){L.manned.add(it.id);k--}}}
export const manned=(S,it)=>layout(S).manned.has(it.id);
// meuble utilisable par les clients pour un rayon
const sells=(S,it,cat)=>it.cat===cat&&(def(it.t).kind==='sale'||(def(it.t).kind==='counter'&&manned(S,it)));
export function offered(S){const o=new Set();for(const it of S.items){const k=def(it.t).kind;if(it.cat&&(k==='sale'||(k==='counter'&&manned(S,it))))o.add(it.cat)}return o}
export function capacity(S){const c={ambiant:0,frais:0,surgele:0},u={ambiant:0,frais:0,surgele:0};
 for(const it of S.items){const d=def(it.t);if(d.kind==='reserve')c[d.store]+=d.cap}
 for(const k of D.CATS)u[k.store]+=S.reserve[k.id];return {cap:c,used:u}}
export const price=(S,cat)=>D.CAT[cat].cost*(1+S.margin[cat]/100);

// ---------------------------------------------------------------- affluence
export function attraction(S){const sa=salesArea(S),off=offered(S),variety=off.size/D.CATS.length;
 let ex=0,n=0;for(const c of off){ex+=(S.margin[c]-D.CAT[c].ref)/100;n++}
 const priceF=clamp(1-1.6*(n?ex/n:0),.55,1.2);
 let decor=0,counters=0;for(const it of S.items){const d=def(it.t);decor+=d.attract||0;if(d.kind==='counter'&&manned(S,it))counters++}
 const decorF=Math.min(.12,decor/Math.max(1,sa)*2.2),ad=S.ads.until>=S.d?S.ads.boost:0;
 const base=82+.48*sa,repF=.45+S.rep/90;
 const spots=S.items.filter(o=>o.t==='spot').length,bus=S.items.some(o=>o.t==='busstop'),transportF=.8+Math.min(.35,spots*.025)+(bus?.12:0);
 const n0=base*repF*(.55+.45*variety)*priceF*(1+.05*Math.min(4,counters)+decorF)*(1+ad)*transportF;
 return {perDay:Math.round(n0),spots,bus,transportF,sa,variety:off.size,priceF,decorF,counters,ad}}
export function security(S){let s=0;for(const it of S.items)s+=def(it.t).security||0;
 const staffOnFloor=(S.staff.rayon||0)+(S.staff.menage||0);return Math.min(.8,s+.015*staffOnFloor)}
export function electricity(S){let p=250+1.6*area(S);for(const it of S.items)p+=def(it.t).power||0;return Math.round(p)}
export function salaries(S){let s=0;for(const r of D.ROLES)s+=r.salary*(S.staff[r.id]||0);return s}

// ce qui manque pour bien tourner (affiché en bas de l'écran)
export function problems(S){const p=[],has=k=>S.items.some(o=>def(o.t).kind===k);
 if(!has('sale'))p.push('Ajoute des rayons (menu Construire).');
 if(!has('checkout')&&!has('self'))p.push('Il faut au moins une caisse.');
 else if(!S.staff.caissier&&!has('self'))p.push('Embauche un·e caissier·ère.');
 if(!has('reserve'))p.push('Installe des racks dans la réserve.');
 if(!has('dock'))p.push('Il faut un quai de livraison dans la réserve.');
 {const dock=S.items.find(o=>o.t==='dock');if(dock&&!dockReady(S,dock))p.push('Il faut une route jusqu’au quai, avec 7 m de route en face pour manœuvrer.')}
 if(!S.staff.rayon)p.push('Embauche un·e employé·e de rayon.');
 {const al=Object.values(stockAlerts(S)).filter(v=>v==='low').length;if(al)p.push(`Stock bas sur ${al} rayon${al>1?'s':''} (voir Stock).`)}
 if(!S.budget)p.push('Budget d’achat à 0 : aucune livraison.');
 const cap=capacity(S).cap;for(const c of offered(S)){const st=D.CAT[c].store;if(!cap[st]&&st!=='ambiant'){p.push(`Rayon ${D.CAT[c].name.toLowerCase()} : il faut une ${st==='frais'?'chambre froide':'chambre froide négative'} en réserve.`);break}}
 if(!S.open&&!p.length)p.push('Tout est prêt : ouvre le magasin !');
 return p}

// ---------------------------------------------------------------- exécution
export function runtime(seed=Date.now()){return {truck:null,truckDay:-1,cars:[],spotTaken:new Map(),bus:null,busT:0,busWaiting:0,agents:[],queues:new Map(),acc:0,nid:1,events:[],rnd:mulberry(seed),closing:false,staffDay:-1}}
const ev=(R,e)=>{R.events.push(e);if(R.events.length>200)R.events.shift()};
export function hourLabel(S){const h=Math.floor(S.hour),m=Math.floor((S.hour-h)*60/15)*15;return `${h} h ${String(m).padStart(2,'0')}`}
export const monthOf=S=>Math.floor((S.d-1)/D.DAYS_PER_MONTH)+1,dayOfMonth=S=>(S.d-1)%D.DAYS_PER_MONTH+1;

// dt : secondes réelles × vitesse
export function step(S,R,dt){if(S.over)return;layout(S);
 if(R.staffDay!==S.d)spawnStaff(S,R);
 const h0=Math.floor(S.hour);S.hour+=dt/D.HOURS.realSecPerHour;if(Math.floor(S.hour)!==h0)startDay(S,R);// mise en rayon de la nuit à l'ouverture, une fois la livraison du matin rangée (au plus tard à 10 h)
 if(S.hour>=D.HOURS.open&&R.restockDay!==S.d&&(!(R.dawn||R.truck&&R.truck.dawn&&R.truck.st!=='out')||S.hour>=D.HOURS.open+2)){R.restockDay=S.d;morningRestock(S)}
 const isOpen=S.open&&S.hour>=D.HOURS.open&&S.hour<D.HOURS.close;
 if(isOpen){const h=clamp(Math.floor(S.hour-D.HOURS.open),0,11),avg=D.HOUR_CURVE.reduce((a,b)=>a+b)/12;
  R.acc+=R.perDay/12*D.HOUR_CURVE[h]/avg/D.HOURS.realSecPerHour*dt;
  while(R.acc>=1){R.acc--;spawnCustomer(S,R)}}
 traffic(S,R,dt);
 for(const a of R.agents.slice())a.k==='c'?customer(S,R,a,dt):a.role==='rayon'?stocker(S,R,a,dt):cleaner(S,R,a,dt);
 // fermeture : on laisse finir les clients, puis la nuit passe
 if(S.hour>=D.HOURS.close){const left=R.agents.some(a=>a.k==='c'&&a.st!=='waitBus')||R.cars.some(c=>c.st!=='parked');
  if(!left||S.hour>=D.HOURS.close+.75){for(const a of R.agents.filter(a=>a.k==='c'))finishCustomer(S,R,a,true);night(S,R)}}
}
export function startDay(S,R){R.perDay=attraction(S).perDay}

function spawnCustomer(S,R){const r=R.rnd,T=D.TRAFFIC,stop=S.items.find(o=>o.t==='busstop'),spots=S.items.filter(o=>o.t==='spot');
 const free=spots.filter(o=>!R.spotTaken.has(o.id)&&reachable(S,'vspot:'+o.id)),u=r();
 if(stop&&u<T.busShare){R.busWaiting++;return}
 if(u<T.busShare+T.carShare){if(free.length){if(spawnCar(S,R,free[Math.floor(r()*free.length)])!==false)return}else{th(S,'noparking');if(r()<.25)return}}
 const L=layout(S),side=r()<.5?0:W-1;let y=r()<.5?RY-1:RE;if(!L.pc[idx(side,y)])y=y===RE?RY-1:RE;makeCustomer(S,R,side,y,0)}
export function makeCustomer(S,R,x,y,extra){const r=R.rnd;
 const want=[],n=3+extra+Math.floor(Math.pow(r(),1.3)*14),tot=D.CATS.reduce((a,c)=>a+c.demand,0);
 for(let k=0;k<n;k++){let v=r()*tot;for(const c of D.CATS){v-=c.demand;if(v<=0){if(!want.some(w=>w.cat===c.id))want.push({cat:c.id,q:1+(r()<.35)+(r()<.1)});break}}}
 const pal=[[.85,.35,.35],[.35,.55,.85],[.95,.75,.3],[.45,.7,.45],[.7,.45,.75],[.95,.55,.3],[.3,.3,.35],[.9,.9,.85],[.25,.45,.6],[.6,.3,.25]];
 const big=want.length>=7,hasCorral=S.items.some(o=>o.t==='corral');
 if(big&&!hasCorral){want.length=Math.min(want.length,8);th(S,'nocart')}
 const a={id:R.nid++,k:'c',x:x+.5,y:y+.5,c:idx(x,y),nx:-1,st:big&&hasCorral?'cart':'in',goal:'ent',want,cart:big&&hasCorral,hasCart:false,basket:{units:0,value:0,cost:0,cats:{}},sat:72,t:0,wait:0,
  shirt:pal[Math.floor(r()*pal.length)],pants:pal[Math.floor(r()*pal.length)],skin:[[.98,.84,.7],[.85,.65,.5],[.6,.42,.3],[.45,.3,.22]][Math.floor(r()*4)],
  hair:[[.23,.16,.11],[.12,.1,.09],[.85,.69,.36],[.55,.3,.15],[.7,.7,.72]][Math.floor(r()*5)],style:Math.floor(r()*5),scale:.92+r()*.16,retry:0,dirt:0,steps:0};
 R.agents.push(a);return a}
// véhicules : ne roulent que sur les routes (et dans leur place), en serrant la droite, case par case (champ de distance)
function drivable(S,i,own){if(S.built[i])return false;const o=S._L.occ[i];if(o)return o===own&&S.items.find(x=>x.id===o)?.t==='spot';return isRoad(S.ground[i])}
function vTargets(S,key){if(key.startsWith('vstage:')){const it=S.items.find(o=>o.id===+key.slice(7));const g=it&&dockGeo(S,it);return g&&g.ok?[g.stage]:[]}
 if(key==='vroad'||key.startsWith('vleave:'))return [idx(0,LANE_W),idx(W-1,LANE_E)]
 const it=S.items.find(o=>o.id===+key.slice(key.indexOf(':')+1));if(!it)return [];
 if(key.startsWith('vspot:'))return cells(it);
 if(key.startsWith('vfront:'))return front(it).filter(([x,y])=>inLot(x,y)).map(([x,y])=>idx(x,y));
 if(key.startsWith('vdock:'))return back(it).filter(([x,y])=>inLot(x,y)).map(([x,y])=>idx(x,y));return []}
export function vfield(S,key){const L=layout(S),k='v'+key;let f=L.fields.get(k);if(f)return f;f=new Int16Array(N).fill(-1);const q=[];
 const own=key.startsWith('vspot:')?+key.slice(key.indexOf(':')+1):-1;
 for(const i of vTargets(S,key))if(drivable(S,i,own)&&f[i]<0){f[i]=0;q.push(i)}
 // route principale : sens unique par moitié (ouest au nord, est au sud). On remonte le champ depuis la cible : le véhicule va de j vers i.
 for(let h=0;h<q.length;h++){const i=q[h],x=i%W,y=i/W|0;for(const [dx,dy] of DIRS){const nx=x+dx,ny=y+dy;if(!inLot(nx,ny))continue;const j=idx(nx,ny);
  if(dy===0&&isMainRoad(x,y)&&(y<RY+3?dx<0:dx>0))continue;
  if(S.oneway&&((S.oneway[j]>=0&&DIRS[S.oneway[j]][0]===dx&&DIRS[S.oneway[j]][1]===dy)||(S.oneway[i]>=0&&DIRS[S.oneway[i]][0]===dx&&DIRS[S.oneway[i]][1]===dy)))continue;
  if(f[j]<0&&drivable(S,j,own)){f[j]=f[i]+1;q.push(j)}}}
 L.fields.set(k,f);return f}
const ENTRY_L=()=>idx(0,LANE_E),IN_L=()=>idx(0,LANE_E),IN_R=()=>idx(W-1,LANE_W);
export function reachable(S,key){const f=vfield(S,key);return f[ENTRY_L()]>=0}
function vehicle(R,c,extra){const v={id:R.nid++,c,x:c%W+.5,z:(c/W|0)+.5,nx:-1,ang:Math.PI/2,...extra};return v}
// ---- gabarits : chaque véhicule est une boîte orientée [demi-longueur, demi-largeur, décalage du centre le long de l'axe].
// Un véhicule n'avance jamais si sa boîte (avec 6 cm de marge) touche celle d'un autre : ils ne se chevauchent plus.
const VDIM={car:[1.3,.58,0],truck:[3.75,.95,-.5],bus:[5.6,1.02,0]};
const vkind=v=>v.big?'truck':v.kind||'car';
function vbox(v,x=v.x,z=v.z,ang=v.ang,grow=0,ahead=0){const [hl,hw,off]=VDIM[vkind(v)],ux=Math.sin(ang),uz=Math.cos(ang);
 if(ahead)return {x:x+ux*(off+hl+ahead/2),z:z+uz*(off+hl+ahead/2),ux,uz,hl:ahead/2,hw:hw*.9};
 return {x:x+ux*off,z:z+uz*off,ux,uz,hl:hl+grow,hw:hw+grow}}
// séparation des axes (deux rectangles orientés se touchent-ils ?)
export function boxHit(a,b){for(const [ax,az] of [[a.ux,a.uz],[-a.uz,a.ux],[b.ux,b.uz],[-b.uz,b.ux]]){
  const pa=Math.abs(a.hl*(a.ux*ax+a.uz*az))+Math.abs(a.hw*(-a.uz*ax+a.ux*az)),pb=Math.abs(b.hl*(b.ux*ax+b.uz*az))+Math.abs(b.hw*(-b.uz*ax+b.ux*az));
  if(Math.abs((b.x-a.x)*ax+(b.z-a.z)*az)>pa+pb)return false}return true}
export const vehicles=R=>R.cars.concat(R.truck?[R.truck]:[],R.bus?[R.bus]:[]);
export {vbox};
// qui gêne cette nouvelle position ? (si on chevauche déjà quelqu'un, on a le droit de s'en éloigner)
function blocker(R,v,x,z,ang){const me=vbox(v,x,z,ang,.06);for(const o of vehicles(R)){if(o===v)continue;const ob=vbox(o);if(!boxHit(me,ob))continue;
  if(boxHit(vbox(v,v.x,v.z,v.ang,.06),ob)&&Math.hypot(x-o.x,z-o.z)>Math.hypot(v.x-o.x,v.z-o.z))continue;return o}return null}
const cellAt=(x,z)=>idx(clamp(Math.floor(x),0,W-1),clamp(Math.floor(z),0,H-1));
// doit céder le passage : sur un marquage « cédez le passage », ou en entrant sur la route principale
function yields(S,v){if(v.kind==='bus')return false;const c=cellAt(v.x,v.z),n=v.nx>=0?v.nx:c;
 return S.ground[c]===5||S.ground[n]===5||(!isMainRoad(c%W,c/W|0)&&isMainRoad(n%W,n/W|0))}
const prio=(S,v)=>(yields(S,v)?0:2)+(v.big||v.kind==='bus'?1:0);
// faut-il s'arrêter ? quelqu'un dans la zone devant soi (on le suit, ou il traverse), conflit réglé par la priorité, cédez-le-passage
function mustWait(S,R,v,dx,dz){const ang=Math.atan2(dx,dz),pr=vbox(v,v.x,v.z,ang,0,1.5),me=vbox(v,v.x,v.z,ang);
 // zones réservées : manœuvre en cours, ou manœuvre qui attend de pouvoir commencer
 for(const o of vehicles(R)){if(o===v)continue;const zs=o.man?o.man.zone:(o.wait||0)>6?o.want:null;if(!zs||zs.some(z=>boxHit(me,z)))continue;// déjà dedans : on avance pour la libérer
  for(const z of zs)if(boxHit(pr,z))return o}
 for(const o of vehicles(R)){if(o===v||o.st==='parked'||o.man)continue;const ob=vbox(o);if(!boxHit(pr,ob))continue;
  // en face, sur l'autre voie : on se croise, on ne le suit pas (la boîte de collision empêche quand même tout contact)
  {const ux=Math.sin(ang),uz=Math.cos(ang);if(Math.sin(o.ang)*ux+Math.cos(o.ang)*uz<-.6&&Math.abs((o.x-v.x)*uz-(o.z-v.z)*ux)>.9)continue}
  if(!boxHit(vbox(o,o.x,o.z,o.ang,0,1.5),me))return o;// il ne nous voit pas devant lui : on attend derrière lui
  const pv=prio(S,v),po=prio(S,o);if(pv!==po){if(pv<po)return o;continue}
  // à égalité : priorité à droite
  if((o.x-v.x)*-Math.cos(ang)+(o.z-v.z)*Math.sin(ang)>0)return o;if((v.id||0)>(o.id||0)&&(v.x-o.x)*-Math.cos(o.ang)+(v.z-o.z)*Math.sin(o.ang)>0)return o}
 // piétons : priorité absolue, on s'arrête devant eux
 const pp=vbox(v,v.x,v.z,ang,0,1.6);pp.hw+=.35;for(const a of R.agents){if(a.st==='waitBus'||inside(S,a.x|0,a.y|0))continue;if(Math.abs(a.x-pp.x)>4||Math.abs(a.y-pp.z)>4)continue;
  if(boxHit(pp,{x:a.x,z:a.y,ux:1,uz:0,hl:.25,hw:.25}))return {id:'piéton',ped:1}}
 // cédez le passage : on attend qu'aucun véhicule prioritaire n'approche (sauf après 12 s d'attente)
 // (seulement ceux qui roulent sur la voie prioritaire et viennent vers nous, pas ceux qui nous suivent)
 if(yields(S,v)&&!((v.wait||0)>12)){const c=cellAt(v.x,v.z),toMain=S.ground[c]!==5&&!isMainRoad(c%W,c/W|0);
  for(const o of vehicles(R)){if(o===v||o.st==='parked'||o.man||(o.wait||0)>2||yields(S,o))continue;const oc=cellAt(o.x,o.z);if(toMain&&!isMainRoad(oc%W,oc/W|0))continue;
   const ex=v.x-o.x,ez=v.z-o.z,dd=Math.hypot(ex,ez);if(dd>9)continue;if(dx*-ex+dz*-ez<0&&Math.cos(o.ang-ang)>.5)continue;
   if(Math.sin(o.ang)*ex+Math.cos(o.ang)*ez>dd*.3)return o}}
 return null}
// attente en boucle (A attend B qui attend… A) : on ignore les règles de politesse pour en sortir (jamais les collisions)
// (un seul membre de la boucle passe : celui qui roule sur la voie prioritaire, sinon le plus ancien)
function inCycle(R,v){const all=vehicles(R),m=[v];let o=v;for(let k=0;k<12;k++){const n=o.wf!=null&&all.find(q=>q.id===o.wf);if(!n)return false;if(n===v)break;m.push(n);o=n;if(k===11)return false}
 const S2=RS,rank=q=>(String(q.why||'').startsWith('bloqué')||q.st==='parked'?-1e9:0)+(S2?prio(S2,q):0)*1e6-(q.id||0);return m.reduce((a,q)=>rank(q)>rank(a)?q:a)===v}
// bloqué pour de bon (attente en boucle depuis 20 s, ou plus d'une minute) : la voiture renonce et disparaît
let RT=null,RS=null;function hold(v,dt){v.wait=(v.wait||0)+dt;const gone=!v.big&&v.kind!=='bus'&&(v.wait>60||(v.wait>20&&RT&&inCycle(RT,v)));if(gone&&RS)th(RS,'jam');if(v.wait>15&&RT)RT.jamT=RS?.hour;return gone?null:false}
// prochaine case sur le champ de distance : on serre la droite, puis on va tout droit
function nextCell(S,f,c,pd,own){const x=c%W,y=c/W|0,cand=[];for(const [dx,dy] of DIRS){const nx=x+dx,ny=y+dy;if(inLot(nx,ny)&&f[idx(nx,ny)]>=0&&f[idx(nx,ny)]===f[c]-1)cand.push(idx(nx,ny))}if(!cand.length)return -1;
 const main=isMainRoad(x,y),sc=k=>{const cx=k%W,cy=k/W|0,dx=cx-x,dy=cy-y,rx=cx-dy,ry=cy+dx;return (!inLot(rx,ry)||!drivable(S,idx(rx,ry),own)?2:0)+(DIRS.findIndex(([a,b])=>a===dx&&b===dy)===pd?1:0)};
 if(cand.length>1)cand.sort((a,b)=>sc(b)-sc(a));return cand[0]}
// point visé dans une case : le long du bord droit, décalé d'un quart de case vers le milieu (deux voitures se croisent sur 3 cases)
// on roule à 0,75 m du bord droit de la chaussée (au milieu de sa moitié sur la route principale)
function lanePt(S,from,to,own){const x=from%W,y=from/W|0,mx=to%W-x,my=(to/W|0)-y,tx=to%W,ty=to/W|0,pd=DIRS.findIndex(([a,b])=>a===mx&&b===my);
 // route principale : milieu de la case, décalé de 30 cm vers l'intérieur sur la voie du bord (on ne mord pas le trottoir)
 if(isMainRoad(tx,ty)){const rx=tx-my,ry=ty+mx,a=pd>=0&&!isMainRoad(rx,ry)&&!(inLot(rx,ry)&&drivable(S,idx(rx,ry),own))?-.3:0;return [tx+.5-my*a,ty+.5+mx*a,pd]}
 let k=0;while(k<3){const cx=tx-my*(k+1),cy=ty+mx*(k+1);if(!inLot(cx,cy)||isMainRoad(cx,cy)||!drivable(S,idx(cx,cy),own))break;k++}
 const a=k===0?-.25:k===1?.75:1.5;return [tx+.5-my*a,ty+.5+mx*a,pd]}
// case de virage : on vise le croisement des deux voies (voie d'arrivée × voie de sortie), pas le centre de la case :
// on reste sur sa voie au lieu de couper vers l'intérieur ou de déborder à l'extérieur
function corner(v,q,nx,nz,d2){const i=v.path.indexOf(q),pv=i>0?v.path[i-1]:{x:v.x,z:v.z},[ax,ay]=DIRS[q.pd]||[0,0],[bx,by]=DIRS[d2];
 if(ax*bx+ay*by!==0||(!ax&&!ay)){q.x=q.c%W+.5;q.z=(q.c/W|0)+.5;return}
 const cx=ax?nx:pv.x,cz=ax?pv.z:nz,x0=q.c%W,y0=q.c/W|0;q.x=clamp(cx,x0+.2,x0+.8);q.z=clamp(cz,y0+.2,y0+.8)}
// conduite : on suit les cases à venir en visant un point un peu plus loin sur le chemin (virages arrondis, pas de pivot sur place)
function moveV(S,v,key,speed,dt,R){const f=vfield(S,key),own=key.startsWith('vspot:')?v.spot:-1;if(f[v.c]<0)return null;
 // coincé contre une voiture garée : petite marche arrière, puis on reprend le virage plus serré (manœuvre en deux temps)
 if(v.backup>0&&R){const st=Math.min(v.backup,speed*.4*dt),bx=v.x-Math.sin(v.ang)*st,bz=v.z-Math.cos(v.ang)*st;if(blocker(R,v,bx,bz,v.ang)){v.backup=0}else{v.x=bx;v.z=bz;v.backup-=st;return false}}
 if(v.tight>0)v.tight-=dt;
 if(!v.path||v.pkey!==key||v.path.some(p=>f[p.c]<0)){v.path=[];v.pkey=key}
 let last=v.path.length?v.path[v.path.length-1].c:v.c,pd=v.path.length?v.path[v.path.length-1].pd:v.pd||0;
 while(v.path.length<5&&f[last]>0){const n=nextCell(S,f,last,pd,own);if(n<0)break;const [px,pz,d2]=lanePt(S,last,n,own);const q=v.path[v.path.length-1];if(q&&q.pd!==d2&&!isMainRoad(q.c%W,q.c/W|0))corner(v,q,px,pz,d2);v.path.push({c:n,x:px,z:pz,pd:d2});pd=d2;last=n}
 // point dépassé : trop près, ou déjà plus près du suivant que lui (virage coupé)
 const passed=()=>{const p=v.path[0],q=v.path[1];if(Math.hypot(p.x-v.x,p.z-v.z)<.4)return true;return q&&Math.hypot(q.x-v.x,q.z-v.z)<Math.hypot(q.x-p.x,q.z-p.z)};
 while(v.path.length&&passed()){const p=v.path.shift();v.c=p.c;v.pd=p.pd;if(!v.path.length){let l=v.c,d0=v.pd;while(v.path.length<5&&f[l]>0){const n=nextCell(S,f,l,d0,own);if(n<0)break;const [px,pz,d2]=lanePt(S,l,n,own);v.path.push({c:n,x:px,z:pz,pd:d2});d0=d2;l=n}}}
 if(!v.path.length)return f[v.c]===0?true:null;
 v.nx=v.path[0].c;
 const look=v.tight>0?.3:v.big?2.6:v.kind==='bus'?3:2;let L=look,px=v.x,pz=v.z,tx=v.path[0].x,tz=v.path[0].z;
 for(const p of v.path){const d=Math.hypot(p.x-px,p.z-pz);if(d>=L){tx=px+(p.x-px)/d*L;tz=pz+(p.z-pz)/d*L;break}L-=d;px=p.x;pz=p.z;tx=p.x;tz=p.z}
 const dx=tx-v.x,dz=tz-v.z,d=Math.hypot(dx,dz);if(d<1e-3){const p=v.path.shift();v.c=p.c;return false}
 {const w=R&&!inCycle(R,v)&&mustWait(S,R,v,dx/d,dz/d);if(w){v.why='suit '+w.id;v.wf=w.ped?null:w.id;if(w.ped){v.wait=(v.wait||0)+dt;return false}return hold(v,dt)}}
 const s=Math.min(speed*dt,d);let da=Math.atan2(dx,dz)-v.ang;while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;
 const na=v.ang+da*Math.min(1,dt*9),nx2=v.x+dx/d*s,nz2=v.z+dz/d*s;
 {const b2=R&&blocker(R,v,nx2,nz2,na);if(b2){v.why='bloqué '+b2.id;v.wf=b2.id;if((b2.st==='parked'||(b2.wf===v.id&&(b2.want||(RS&&prio(RS,v)*1e6-(v.id||0)<prio(RS,b2)*1e6-(b2.id||0)))))&&(v.wait||0)>2&&!(v.tight>0)){v.backup=1.6;v.tight=5}return hold(v,dt)}}
 v.ang=na;v.wait=0;v.wf=null;v.x=nx2;v.z=nz2;return false}
// manœuvres de parking : courbe (entrée en marche avant, sortie en marche arrière), suivie pas à pas sans toucher personne
function bez(p0,p1,p2,p3,n=26){const o=[];for(let i=1;i<=n;i++){const t=i/n,u=1-t;o.push([u*u*u*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t*t*t*p3[0],u*u*u*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t*t*t*p3[1]])}return o}
// zone balayée par une manœuvre (boîtes le long de la courbe, un peu élargies)
function sweep(v,pts,rev){const z=[];let px=v.x,pz=v.z;for(let i=0;i<pts.length;i+=2){const [x,y]=pts[i],a=rev?Math.atan2(px-x,pz-y):Math.atan2(x-px,y-pz);z.push(vbox(v,x,y,a,.15));px=x;pz=y}return z}
// la manœuvre peut-elle commencer ? personne dans la zone ni juste devant elle
function sweepFree(R,v,zone){const cyc=inCycle(R,v);for(const o of vehicles(R)){if(o===v||o.st==='parked')continue;const ob=vbox(o),op=(o.wait||0)>.3||cyc?null:vbox(o,o.x,o.z,o.ang,0,2.5);
  for(const z of zone)if(boxHit(z,ob)||(op&&boxHit(z,op))){v.why='zone '+o.id;v.wf=o.id;return false}const zs=o.man?o.man.zone:o.want&&o.id<v.id&&!cyc?o.want:null;if(zs)for(const z2 of zs)for(const z of zone)if(boxHit(z,z2)){v.why='zone* '+o.id;v.wf=o.id;return false}}v.wf=null;return true}
function follow(R,v,speed,dt){const m=v.man;let b=speed*dt;
 while(b>1e-4&&m.i<m.pts.length){const [tx,tz]=m.pts[m.i],dx=tx-v.x,dz=tz-v.z,d=Math.hypot(dx,dz);if(d<1e-4){m.i++;continue}
  const s=Math.min(b,d),na=m.rev?Math.atan2(-dx,-dz):Math.atan2(dx,dz),nx=v.x+dx/d*s,nz=v.z+dz/d*s;
  {const b2=blocker(R,v,nx,nz,na);if(b2){v.wf=b2.id;return hold(v,dt)}}
  {const me=vbox(v,nx,nz,na,.3);if(RT&&RT.agents.some(a=>a.st!=='waitBus'&&Math.abs(a.x-nx)<3&&Math.abs(a.y-nz)<3&&boxHit(me,{x:a.x,z:a.y,ux:1,uz:0,hl:.2,hw:.2}))){v.wait=(v.wait||0)+dt;return false}}
  v.wait=0;v.wf=null;v.x=nx;v.z=nz;v.ang=na;b-=s;if(s>=d-1e-6)m.i++}
 return m.i>=m.pts.length}
// quai : cases derrière, sens vers l'extérieur, aire de manœuvre 7 m plus loin, position garée (arrière contre le mur)
export function dockGeo(S,it){layout(S);const bk=back(it).filter(([x,y])=>inLot(x,y));if(!bk.length)return null;const [fx,fy2]=DIRS[it.r],nx=-fx,ny=-fy2;
 const cx=bk.reduce((a,[x])=>a+x+.5,0)/bk.length,cz=bk.reduce((a,[,y])=>a+y+.5,0)/bk.length,sx=Math.floor(cx+nx*7),sy=Math.floor(cz+ny*7);
 let ok=inLot(sx,sy);if(ok)for(let k=0;k<=7;k++){const x=Math.floor(cx+nx*k),y=Math.floor(cz+ny*k);if(!inLot(x,y)||!drivable(S,idx(x,y),-1)){ok=false;break}}
 return {ok,stage:ok?idx(sx,sy):-1,park:[cx+nx*3.4,cz+ny*3.4],ang:Math.atan2(nx,ny)}}
export function dockReady(S,it){const g=dockGeo(S,it);return !!(g&&g.ok&&reachable(S,'vstage:'+it.id))}
function refundRest(S,t){if(!t.order||!t.paid)return;let v=0;for(const c in t.order.u){v+=t.order.u[c]*D.CAT[c].cost*(t.order.factor||1);t.order.u[c]=0}v=Math.round(v);if(v){S.cash+=v;S.month.buy-=v;S.dayStats.buy-=v}}
// l'équipe vide le camion : une palette (jusqu'à 120 articles) d'un rayon qui a de la place en réserve
export const PALLET=500;
export function truckPallet(S,R){const t=R.truck;if(!t||t.st!=='unload')return null;const {cap,used}=capacity(S);
 // une palette regroupe plusieurs rayons du même type de réserve (ambiant, frais ou surgelé)
 for(const st of ['ambiant','frais','surgele']){let free=cap[st]-used[st]-(R.carrying?.[st]||0),room=Math.min(PALLET,free);if(room<=0)continue;const items=[];
  for(const c of D.CATS){if(c.store!==st||room<=0)continue;const n=t.order.u[c.id]||0;if(!n)continue;const u=Math.min(n,room);t.order.u[c.id]-=u;room-=u;items.push({cat:c.id,n:u})}
  if(items.length)return {store:st,items,n:items.reduce((a,b)=>a+b.n,0)}}
 // plus de place pour ce qui reste : rendu au fournisseur
 for(const c in t.order.u)if(t.order.u[c]>0){t.total-=t.order.u[c]}refundRest(S,t);return null}
function spotGeo(it){const [w,d]=size(it),f=front(it),fx=f.reduce((a,[x])=>a+x,0)/f.length,fy=f.reduce((a,[,y])=>a+y,0)/f.length;
 let exit=-1,bd=-1;for(const c of cells(it)){const dd=Math.abs(c%W-fx)+Math.abs((c/W|0)-fy);if(dd>bd){bd=dd;exit=c}}
 const [ox,oz]=DIRS[it.r];// vers la route
 return {cx:it.x+w/2,cz:it.y+d/2,exit,vert:w<d,ox,oz,ang:Math.atan2(-ox,-oz)}}
function spawnCar(S,R,it){const g=spotGeo(it);let left=R.rnd()<.5;
 // entrée encombrée : on arrive par l'autre côté, sinon à pied
 const busy=c=>{const x=c%W+.5,z=(c/W|0)+.5,b=vbox({kind:'car'},x,z,c%W?-Math.PI/2:Math.PI/2,1.5);return vehicles(R).some(o=>boxHit(b,vbox(o))||(o.man&&o.man.zone.some(q=>boxHit(b,q))))};
 if(busy(left?IN_L():IN_R()))left=!left;if(busy(left?IN_L():IN_R()))return false;
 const car=vehicle(R,left?IN_L():IN_R(),{pd:left?3:1,spot:it.id,st:'in',key:'vfront:'+it.id,exit:g.exit,cx:g.cx,cz:g.cz,vert:g.vert,pang:g.ang,ang:left?Math.PI/2:-Math.PI/2,col:[[.85,.2,.2],[.2,.4,.8],[.95,.95,.95],[.2,.2,.22],[.95,.75,.2],[.35,.65,.4],[.6,.6,.65]][Math.floor(R.rnd()*7)]});
 R.spotTaken.set(it.id,car.id);R.cars.push(car)}
// entrer dans la place : courbe depuis la voie jusqu'au centre, nez dedans
function pullIn(S,car,R){const it=S.items.find(o=>o.id===car.spot);if(!it)return false;const g=spotGeo(it),ux=Math.sin(car.ang),uz=Math.cos(car.ang),p2=[g.cx+g.ox*3.2,g.cz+g.oz*3.2];
 const a=Math.max(.8,Math.hypot(p2[0]-car.x,p2[1]-car.z)*.5),pts=bez([car.x,car.z],[car.x+ux*a,car.z+uz*a],p2,[g.cx,g.cz]),zone=sweep(car,pts,false);
 if(R&&!sweepFree(R,car,zone)){car.want=zone;return false}car.want=null;car.man={pts,i:0,rev:false,end:'park',zone};return true}
// sortir : marche arrière en tournant, vers le côté qui mène le plus vite à la sortie
function pullOut(S,car,R){const it=S.items.find(o=>o.id===car.spot);if(!it)return false;const g=spotGeo(it),f=vfield(S,'vleave:'+car.spot);let best=null;
 for(const k of [1,-1]){const ex=-g.oz*k,ez=g.ox*k,X=[g.cx+g.ox*3-ex*2,g.cz+g.oz*3-ez*2],A=cellAt(X[0]+ex*4,X[1]+ez*4),c=cellAt(X[0],X[1]);
  if(!drivable(S,c,-1)||f[c]<0)continue;const sc=f[A]>=0?f[A]:f[c]+6;if(!best||sc<best.s)best={s:sc,ex,ez,X,c}}
 if(!best)return false;const {ex,ez,X}=best;
 const pts=bez([g.cx,g.cz],[g.cx+g.ox*2.4,g.cz+g.oz*2.4],[X[0]+ex*1.6,X[1]+ez*1.6],X),zone=sweep(car,pts,true);if(R&&!sweepFree(R,car,zone)){car.want=zone;return false}car.want=null;
 car.man={pts,i:0,rev:true,end:'road',zone,c:best.c,pd:DIRS.findIndex(([a,b])=>a===Math.round(ex)&&b===Math.round(ez))};return true}
function carLeave(S,R,car){if(car.leaving||car.st==='out')return;car.leaving=true}
// bus : trajet en ligne droite sur la route principale ; il s'arrête derrière les autres et ne touche personne
function moveVehicle(S,R,v,speed,dt){let b=speed*dt;while(b>0&&v.i<v.path.length){const [tx,tz]=v.path[v.i],dx=tx-v.x,dz=tz-v.z,d=Math.hypot(dx,dz);if(d>.01)v.ang=Math.atan2(dx,dz);
  const inLotNow=v.x>-8&&v.x<W+8;if(d>.01&&((inLotNow&&!inCycle(R,v)&&mustWait(S,R,v,dx/d,dz/d))||blocker(R,v,v.x+dx/d*Math.min(b,d),v.z+dz/d*Math.min(b,d),v.ang))){hold(v,dt);return false}
  if(d<=b){v.x=tx;v.z=tz;b-=d;v.i++}else{v.x+=dx/d*b;v.z+=dz/d*b;b=0}}return v.i>=v.path.length}
function traffic(S,R,dt){const T=D.TRAFFIC;RT=R;RS=S;
 const gone=car=>{R.cars.splice(R.cars.indexOf(car),1);R.spotTaken.delete(car.spot)};
 for(const car of R.cars.slice()){
  if(car.st==='parked'){if(car.leaving&&pullOut(S,car,R)){car.st='out';car.leaving=false;car.key='vleave:'+car.spot;car.nx=-1}else{if(car.leaving)car.wait=(car.wait||0)+dt;continue}}
  // manœuvre de parking en cours
  if(car.man){const r=follow(R,car,T.carSpeed*.55,dt);if(r===null){gone(car);continue}if(!r)continue;const m=car.man;car.man=null;
   if(m.end==='park'){car.st='parked';car.x=car.cx;car.z=car.cz;car.ang=car.pang;const a=makeCustomer(S,R,car.exit%W,car.exit/W|0,T.carExtra);a.car=car.id}
   else{car.c=m.c;car.nx=-1;car.pd=m.pd;car.path=null;const a=Math.atan2(DIRS[m.pd][0],DIRS[m.pd][1]);if(!blocker(R,car,car.x,car.z,a))car.ang=a}continue}
  // presque devant sa place : on commence à se garer
  if(car.st==='in'){const it=S.items.find(o=>o.id===car.spot);if(it){const g=spotGeo(it);const rx=car.x-g.cx,rz=car.z-g.cz,along=rx*g.ox+rz*g.oz-2,lat=Math.abs(-rx*g.oz+rz*g.ox);if(along>=0&&along<=2.4&&lat<=2.6){if(!pullIn(S,car,R)&&hold(car,dt)===null)gone(car);continue}}}
  const done=moveV(S,car,car.key,car.st==='in'?T.carSpeed:T.carSpeed*1.2,dt,R);
  if(done===null){if(car.st==='in')th(S,'noparking');gone(car);continue}
  if(done&&car.st==='in'){if(!pullIn(S,car,R)&&hold(car,dt)===null)gone(car);continue}
  if(done&&car.st==='out')gone(car)}
 // camion de livraison : route → aire de manœuvre → marche arrière jusqu'au quai → déchargé par l'équipe → repart
 const dock=S.items.find(o=>o.t==='dock');
 // livraison du matin : le camion part à 6 h et arrive au quai vers 7 h, une heure avant l'ouverture
 if(!R.truck&&(R.dawn||S.pending&&R.truckDay!==S.d)&&S.hour>=D.HOURS.start&&S.hour<D.HOURS.close){const o=R.dawn?R.dawnOrder:S.pending;R.truckDay=S.d;
  if(dock&&dockReady(S,dock)){R.truck=vehicle(R,IN_L(),{pd:3,st:'in',key:'vstage:'+dock.id,dock:dock.id,big:true,dawn:!!R.dawn,order:o,total:Object.values(o.u).reduce((a,b)=>a+b,0),done:0,paid:false});if(R.dawn){R.dawn=false;R.dawnOrder=null}else S.pending=null}
  else{ev(R,{t:'noroad'});if(R.dawn){R.dawn=false;R.dawnOrder=null}else S.pending=null}}
 if(R.truck){const t=R.truck,it=S.items.find(o=>o.id===t.dock),g=it&&dockGeo(S,it);
  if(!g||!g.ok){if(t.st!=='out'){t.st='out';t.nx=-1}}
  if(t.st==='in'){const d=moveV(S,t,t.key,T.carSpeed*.8,dt,R);if(d===null){t.st='out'}else if(d){t.st='turn';t.ang0=t.ang;t.k=0}}
  else if(t.st==='turn'){const k=Math.min(1,t.k+dt*.8);let da=g.ang-t.ang0;while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;const na=t.ang0+da*k;if(!blocker(R,t,t.x,t.z,na)){t.k=k;t.ang=na}if(t.k>=1){t.st='back';t.ang=g.ang}}
  else if(t.st==='back'){const dx=g.park[0]-t.x,dz=g.park[1]-t.z,d=Math.hypot(dx,dz),st=1.6*dt;if(d>st&&blocker(R,t,t.x+dx/d*st,t.z+dz/d*st,t.ang)){}else if(d<=st){t.x=g.park[0];t.z=g.park[1];t.st='unload';ev(R,{t:'truck'});
    if(!t.paid){t.paid=true;const cost=orderCost(t.order);pay(S,cost,'buy');t.cost=cost}}else{t.x+=dx/d*st;t.z+=dz/d*st}}
  else if(t.st==='unload'){if(t.done>=t.total||!Object.values(t.order.u).some(n=>n>0)){refundRest(S,t);ev(R,{t:'delivery',cost:t.cost||0});t.st='out';t.c=cellAt(t.x,t.z);t.nx=-1;t.path=null;t.key='vroad'}}
  else if(t.st==='out'){if(t.order&&t.paid&&t.done<t.total)refundRest(S,t);const d=moveV(S,t,'vroad',T.carSpeed,dt,R);if(d||d===null)R.truck=null}}
 // bus : passe toutes les demi-heures s'il y a du monde à déposer ou à prendre
 const stop=S.items.find(o=>o.t==='busstop');R.busT+=dt/D.HOURS.realSecPerHour;
 const waiting=R.agents.filter(a=>a.st==='waitBus');
 if(!R.bus&&stop&&R.busT>=T.busEvery&&(R.busWaiting>0||waiting.length)){R.busT=0;const sx=stop.x+(stop.r%2?.5:1.5),north=stop.y<RY,bz=north?RY+1.5:RE-1.5;R.bus={id:R.nid++,kind:'bus',x:north?W+14:-14,z:bz,ang:north?-Math.PI/2:Math.PI/2,st:'in',path:[[sx,bz]],i:0,t:0,stop:stop.id,north}}
 const bus=R.bus;if(bus){
  if(bus.st==='in'&&moveVehicle(S,R,bus,T.busSpeed,dt)){bus.st='stop';bus.t=3;const st2=S.items.find(o=>o.id===bus.stop);
   if(st2){const n=Math.min(T.busMax,R.busWaiting);R.busWaiting-=n;for(let k=0;k<n;k++){const a=makeCustomer(S,R,Math.max(0,Math.min(W-1,st2.x+(k%3))),bus.north===false?RE-1:RY,0);a.bus=true;a.x+=R.rnd()*.4-.2}
    for(const a of waiting)R.agents.splice(R.agents.indexOf(a),1);ev(R,{t:'bus',n})}}
  if(bus.st==='stop'){bus.t-=dt;if(bus.t<=0){bus.st='out';bus.path=[[bus.north===false?W+14:-14,bus.z]];bus.i=0}}
  if(bus.st==='out'&&moveVehicle(S,R,bus,T.busSpeed*1.2,dt))R.bus=null}}

function spawnStaff(S,R){R.staffDay=S.d;R.agents=R.agents.filter(a=>a.k==='c');
 for(const it of S.items)it.inc=0;
 const e=entCells(S);let k=0;
 for(const role of ['rayon','menage'])for(let n=0;n<(S.staff[role]||0);n++){const [x,y]=e[k++%2];
  R.agents.push({id:R.nid++,k:'s',role,x:x+.5,y:y-.5,c:idx(x,y-1),nx:-1,st:'idle',t:R.rnd()*1.5,carry:null})}
 startDay(S,R)}
export function syncStaff(S,R){// après une embauche ou un licenciement en journée
 for(const role of ['rayon','menage']){const have=R.agents.filter(a=>a.role===role),want=S.staff[role]||0;
  for(let n=have.length;n<want;n++){const [x,y]=entCells(S)[n%2];R.agents.push({id:R.nid++,k:'s',role,x:x+.5,y:y-.5,c:idx(x,y-1),nx:-1,st:'idle',t:0,carry:null})}
  for(const a of have.slice(want)){if(a.carry){if(a.carry.pallet){for(const q of a.carry.items)S.reserve[q.cat]+=q.n;R.carrying[a.carry.store]-=a.carry.n;if(R.truck)R.truck.done+=a.carry.n}else S.reserve[a.carry.cat]+=a.carry.n}dropTask(S,a);R.agents.splice(R.agents.indexOf(a),1)}}}

// déplacement d'une case à l'autre en suivant le champ de distance ; renvoie true à l'arrivée
function move(S,a,key,mode,speed,dt){const f=field(S,key,mode);let budget=speed*dt;
 for(let guard=0;guard<6&&budget>0;guard++){
  if(a.nx<0){if(f[a.c]===0)return true;
   if(f[a.c]<0){const j=rescue(S,a,f);if(j<0)return null;a.c=j;a.x=j%W+.5;a.y=(j/W|0)+.5;continue}
   const x=a.c%W,y=a.c/W|0,d=f[a.c];let best=-1,bd=d;
   for(const [dx,dy] of DIRS){const nx=x+dx,ny=y+dy;if(inLot(nx,ny)){const v=f[idx(nx,ny)];if(v>=0&&v<bd&&canStep(S,mode==='c'?S._L.pc:S._L.ps,x,y,nx,ny)){bd=v;best=idx(nx,ny)}}}
   // raccourci en diagonale quand les deux côtés sont libres (même revêtement)
   if(best>=0&&bd>=1)for(const [dx,dy] of [[1,1],[1,-1],[-1,1],[-1,-1]]){const nx=x+dx,ny=y+dy;if(!inLot(nx,ny))continue;const v=f[idx(nx,ny)],a1=f[idx(x+dx,y)],a2=f[idx(x,y+dy)];if(v>=0&&v<bd&&v<d-1&&inside(S,x,y)===inside(S,nx,ny)&&a1>=0&&a2>=0&&a1<d&&a2<d){best=idx(nx,ny);break}}
   if(best<0)return null;a.nx=best}
  const tx=a.nx%W+.5,ty=(a.nx/W|0)+.5,dx=tx-a.x,dy=ty-a.y,dist=Math.hypot(dx,dy);
  a.dir=Math.atan2(dx,dy);
  if(dist<=budget){a.x=tx;a.y=ty;a.c=a.nx;a.nx=-1;budget-=dist;a.steps=(a.steps||0)+1;if(a.k==='c'&&inside(S,a.c%W,a.c/W|0)){S.dirt&&(S.dirt[a.c]=Math.min(1,(S.dirt[a.c]||0)+.01));a.dirt+=S.dirt?Math.max(0,(S.dirt[a.c]||0)-.2):0}}
  else{a.x+=dx/dist*budget;a.y+=dy/dist*budget;budget=0}}
 return false}
function rescue(S,a,f){const x=a.c%W,y=a.c/W|0;for(let r=1;r<5;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const nx=x+dx,ny=y+dy;if(inLot(nx,ny)&&f[idx(nx,ny)]>=0)return idx(nx,ny)}return -1}

function customer(S,R,a,dt){const sp=D.CUSTOMER.speed;
 if(a.st==='cart'){const co=S.items.find(o=>o.t==='corral');if(!co){a.st='in';return}const r=move(S,a,'item:'+co.id,'c',sp,dt);if(r===null){a.st='in';return}
  if(r){if((R.cartsOut||0)<cartCap(S)){a.hasCart=true;R.cartsOut=(R.cartsOut||0)+1}else{a.want.length=Math.min(a.want.length,8);th(S,'nocart')}a.st='in'}return}
 if(a.st==='retcart'){const co=S.items.find(o=>o.t==='corral');const r=co?move(S,a,'item:'+co.id,'c',sp,dt):true;if(r||r===null){if(a.hasCart){a.hasCart=false;R.cartsOut=Math.max(0,(R.cartsOut||0)-1)}a.st='leave'}return}
 if(a.st==='in'){const r=move(S,a,'ent','c',sp,dt);if(r===null)return leaveNow(S,R,a);if(r){a.st='shop'}return}
 if(a.st==='waitBus')return;
 if(a.st==='shop')return nextWant(S,R,a);
 if(a.st==='goto'){const r=move(S,a,'item:'+a.item,'c',sp,dt);if(r===null){a.st='shop';return}if(r){const it=S.items.find(o=>o.id===a.item);a.st='pick';a.t=it&&def(it.t).kind==='counter'?2.2:D.CUSTOMER.pick}return}
 if(a.st==='pick'){a.t-=dt;if(a.t<=0)pick(S,R,a);return}
 if(a.st==='checkout')return chooseCheckout(S,R,a);
 if(a.st==='queue'){const it=S.items.find(o=>o.id===a.item);if(!it||!usable(S,it)){unqueue(R,a);a.st='checkout';return}
  a.wait+=dt;if(a.wait>D.CUSTOMER.patience){unqueue(R,a);a.sat-=25;bubble(R,a,'⌛');S.dayStats.angry++;th(S,'queue');returnGoods(S,a);a.st='leave';return}
  const q=R.queues.get(it.id)||[];const r=move(S,a,'item:'+it.id,'c',sp,dt);if(r&&q[0]===a){a.st='pay';a.t=(D.CUSTOMER.serviceBase+D.CUSTOMER.servicePerUnit*a.basket.units)*(it.t==='self'?D.CUSTOMER.selfFactor:1)}return}
 if(a.st==='pay'){a.t-=dt;if(a.t<=0){const it=S.items.find(o=>o.id===a.item);unqueue(R,a);payAt(S,R,a,it);a.st=a.hasCart?'retcart':'leave'}return}
 if(a.st==='leave'){const car=a.car&&R.cars.find(c=>c.id===a.car),stop=a.bus&&S.items.find(o=>o.t==='busstop');
  const goal=car?'cell:'+car.exit:stop?'item:'+stop.id:'street',r=move(S,a,goal,'c',sp,dt);
  if(r||r===null){if(stop&&r){finishCustomer(S,R,a,false,true);a.st='waitBus';a.dir=Math.PI}else finishCustomer(S,R,a,false)}}}
function nextWant(S,R,a){
 while(a.want.length){const w=a.want[0],x=a.c%W,y=a.c/W|0;
  const all=S.items.filter(it=>sells(S,it,w.cat)),ok=all.filter(it=>it.stock>0);
  if(!all.length){th(S,'notsold:'+w.cat);a.want.shift();a.sat-=1.5;S.dayStats.notSold++;continue}
  if(!ok.length){th(S,'rupture:'+w.cat);a.want.shift();a.sat-=12;S.dayStats.rupture++;bubble(R,a,'!');continue}
  let best=ok[0],bd=1e9;for(const it of ok){const d=Math.abs(it.x-x)+Math.abs(it.y-y);if(d<bd){bd=d;best=it}}
  a.item=best.id;a.st='goto';return}
 a.st='checkout'}
function pick(S,R,a){const w=a.want[0],it=S.items.find(o=>o.id===a.item);
 if(!it||it.stock<=0||!sells(S,it,w.cat)){if(a.retry++<1){a.st='shop';return}th(S,'rupture:'+w.cat);a.want.shift();a.sat-=12;S.dayStats.rupture++;bubble(R,a,'!');a.st='shop';return}
 const c=D.CAT[w.cat],m=S.margin[w.cat],ref=c.ref+(def(it.t).kind==='counter'?12:0);
 const p=m<=ref?1:Math.max(.05,1-(m-ref)*.022);
 if(R.rnd()<p){const u=Math.min(w.q,it.stock),pr=price(S,w.cat);it.stock-=u;a.basket.units+=u;a.basket.value+=u*pr;a.basket.cost+=u*c.cost;a.basket.cats[w.cat]=(a.basket.cats[w.cat]||0)+u;
  if(m<ref)a.sat+=Math.min(2,(ref-m)*.15);if(m<ref-5&&R.rnd()<.3)th(S,'cheap:'+w.cat);if(def(it.t).kind==='counter'&&R.rnd()<.3)th(S,'counter:'+w.cat)}
 else{a.sat-=7;S.dayStats.expensive++;th(S,'cher:'+w.cat);bubble(R,a,'€')}
 a.want.shift();a.retry=0;a.st='shop'}
function usable(S,it){const k=def(it.t).kind;return k==='self'||(k==='checkout'&&manned(S,it))}
function chooseCheckout(S,R,a){if(!a.basket.units){a.st='leave';return}
 const list=S.items.filter(it=>usable(S,it));
 if(!list.length){a.sat-=30;S.dayStats.angry++;th(S,'nocheckout');bubble(R,a,'✕');returnGoods(S,a);a.st='leave';return}
 const x=a.c%W,y=a.c/W|0;let best=null,bv=1e9;for(const it of list){const q=(R.queues.get(it.id)||[]).length;const v=q*4+(Math.abs(it.x-x)+Math.abs(it.y-y))/3+(it.t==='self'?2:0);if(v<bv){bv=v;best=it}}
 const q=R.queues.get(best.id)||[];q.push(a);R.queues.set(best.id,q);a.item=best.id;a.st='queue';a.wait=0}
function unqueue(R,a){const q=R.queues.get(a.item);if(q){const k=q.indexOf(a);if(k>=0)q.splice(k,1)}}
export const queueIndex=(R,a)=>{const q=R.queues.get(a.item);return q?q.indexOf(a):-1};
function payAt(S,R,a,it){const b=a.basket,wp=Math.min(30,Math.max(0,a.wait-8)*1.2);a.sat-=wp;S.dayStats.waitPen+=wp;if(wp>8)th(S,'queue');
 let theft=D.CUSTOMER.theft*(1-security(S))*(it&&it.t==='self'?2:1);let f=0,u=0;for(const c in b.cats){f+=(D.CAT[c].theft||1)*b.cats[c];u+=b.cats[c]}theft*=u?f/u:1;
 if(R.rnd()<theft){S.dayStats.theft+=b.cost;S.month.theft+=b.cost}
 else{S.cash+=b.value;S.dayStats.rev+=b.value;S.month.rev+=b.value;ev(R,{t:'pay',x:a.x,y:a.y,v:b.value})}
 S.dayStats.cogs+=b.cost;S.month.cogs+=b.cost;S.dayStats.units+=b.units;
 for(const c in b.cats){S.sold[c]=(S.sold[c]||0)+b.cats[c];S.dayStats.cats[c]=(S.dayStats.cats[c]||0)+b.cats[c];S.monthCat=S.monthCat||{};S.monthCat[c]=(S.monthCat[c]||0)+b.cats[c]*price(S,c)}b.paid=true}
function returnGoods(S,a){for(const c in a.basket.cats)S.reserve[c]+=a.basket.cats[c];a.basket={units:0,value:0,cost:0,cats:{}}}
function leaveNow(S,R,a){finishCustomer(S,R,a,false)}
function finishCustomer(S,R,a,forced,keep){if(!a.done){a.done=true;if(forced&&a.basket.units&&!a.basket.paid){unqueue(R,a);payAt(S,R,a,null)}else unqueue(R,a);
 const dp=Math.min(16,a.dirt/Math.max(1,a.steps)*60);S.dayStats.dirtPen+=dp;const db=decorBonus(S),sat=clamp(a.sat-dp+db,0,100);
 if(dp>8)th(S,'dirt');if(sat>=85)th(S,'happy');if(db>5&&R.rnd()<.15)th(S,'decor');
 S.dayStats.customers++;S.dayStats.sat+=sat;S.month.customers++;S.month.sat+=sat}
 if(a.car){const car=R.cars.find(c=>c.id===a.car);if(car)carLeave(S,R,car)}
 if(!keep){const k=R.agents.indexOf(a);if(k>=0)R.agents.splice(k,1)}}
function decorBonus(S){let d=0;for(const it of S.items)d+=def(it.t).attract||0;return Math.min(8,d/Math.max(1,salesArea(S))*60)}
function bubble(R,a,txt){ev(R,{t:'bubble',id:a.id,txt})}
export const cartCap=S=>S.items.filter(o=>o.t==='corral').length*def('corral').cap;
function th(S,k){const t=S.dayStats.th;t[k]=(t[k]||0)+1}

// ---- employé·e de rayon
function stocker(S,R,a,dt){const sp=D.STAFF.speed;
 // décharger le camion : prendre une palette au quai, la ranger en réserve
 if(a.st==='toTruck'){const dock=R.truck&&S.items.find(o=>o.id===R.truck.dock);if(!dock||R.truck.st!=='unload'){a.st='idle';return}const r=move(S,a,'item:'+dock.id,'s',sp,dt);if(r===null){a.st='idle';return}if(r){a.st='lift';a.t=1.4}return}
 if(a.st==='lift'){a.t-=dt;if(a.t>0)return;const p=truckPallet(S,R);if(!p){a.st='idle';return}a.carry={...p,pallet:true};R.carrying=R.carrying||{};const st=p.store;R.carrying[st]=(R.carrying[st]||0)+p.n;
  const res=S.items.filter(o=>def(o.t).kind==='reserve'&&def(o.t).store===st),x=a.c%W,y=a.c/W|0;const dst=res.length?res.reduce((q,o)=>Math.abs(o.x-x)+Math.abs(o.y-y)<Math.abs(q.x-x)+Math.abs(q.y-y)?o:q):null;a.goal=dst?'item:'+dst.id:'ent';a.st='toStore';return}
 if(a.st==='toStore'){const r=move(S,a,a.goal,'s',sp*.8,dt);if(r||r===null){a.st='drop';a.t=1.2}return}
 if(a.st==='drop'){a.t-=dt;if(a.t>0)return;const p=a.carry;if(p){for(const q of p.items)S.reserve[q.cat]+=q.n;R.carrying[p.store]-=p.n;if(R.truck)R.truck.done+=p.n}a.carry=null;a.st='idle';a.t=.2;return}
 if(a.st==='idle'&&R.truck&&R.truck.st==='unload'&&R.truck.done<R.truck.total&&Object.values(R.truck.order.u).some(n=>n>0)){a.st='toTruck';return}
 if(a.st==='idle'){a.t-=dt;if(a.t>0)return;a.t=.8;
  let best=null,bv=2;for(const it of S.items){const d=def(it.t);if(!it.cat||!S.reserve[it.cat]||!(d.kind==='sale'||(d.kind==='counter'&&manned(S,it))))continue;const v=(it.stock+(it.inc||0))/d.cap-(it.urgent?2:0);if((v<.75||it.urgent&&it.stock+(it.inc||0)<d.cap)&&v<bv){bv=v;best=it}}
  if(!best){if(R.rnd()<.3){a.st='wander';a.goal='cell:'+randomFloor(S,R,1)}return}
  const store=D.CAT[best.cat].store,res=S.items.filter(o=>def(o.t).kind==='reserve'&&def(o.t).store===store);
  const n=Math.min(D.STAFF.carton,def(best.t).cap-best.stock-(best.inc||0),S.reserve[best.cat]);if(n<=0)return;
  let src=null;if(res.length){const x=a.c%W,y=a.c/W|0;src=res.reduce((p,o)=>Math.abs(o.x-x)+Math.abs(o.y-y)<Math.abs(p.x-x)+Math.abs(p.y-y)?o:p)}
  best.inc=(best.inc||0)+n;a.task={f:best.id,cat:best.cat,n};a.goal=src?'item:'+src.id:'ent';a.st='toRes';return}
 if(a.st==='wander'){const r=move(S,a,a.goal,'s',sp*.6,dt);if(r||r===null){a.st='idle';a.t=1.5}return}
 if(a.st==='toRes'){const r=move(S,a,a.goal,'s',sp,dt);if(r===null){dropTask(S,a);a.st='idle';return}if(r){a.st='take';a.t=D.STAFF.handle}return}
 if(a.st==='take'){a.t-=dt;if(a.t>0)return;const f=S.items.find(o=>o.id===a.task.f);const n=Math.min(a.task.n,S.reserve[a.task.cat]);
  if(!f||f.cat!==a.task.cat||n<=0){dropTask(S,a);a.st='idle';return}S.reserve[a.task.cat]-=n;a.carry={cat:a.task.cat,n};a.st='toShelf';return}
 if(a.st==='toShelf'){const r=move(S,a,'item:'+a.task.f,'s',sp,dt);if(r===null){S.reserve[a.carry.cat]+=a.carry.n;a.carry=null;dropTask(S,a);a.st='idle';return}if(r){a.st='put';a.t=D.STAFF.handle}return}
 if(a.st==='put'){a.t-=dt;if(a.t>0)return;const f=S.items.find(o=>o.id===a.task.f);
  if(f&&f.cat===a.carry.cat){const room=def(f.t).cap-f.stock,n=Math.min(room,a.carry.n);f.stock+=n;S.reserve[a.carry.cat]+=a.carry.n-n}else S.reserve[a.carry.cat]+=a.carry.n;
  if(f&&f.urgent&&f.stock>=def(f.t).cap)f.urgent=false;a.carry=null;dropTask(S,a);a.st='idle';a.t=.3}}
function dropTask(S,a){if(!a.task)return;const f=S.items.find(o=>o.id===a.task.f);if(f)f.inc=Math.max(0,(f.inc||0)-a.task.n);a.task=null}
function randomFloor(S,R,zoneOk){for(let k=0;k<60;k++){const x=S.b.x0+Math.floor(R.rnd()*(S.b.x1-S.b.x0)),y=S.b.y0+Math.floor(R.rnd()*(S.b.y1-S.b.y0)),i=idx(x,y);if(S.built[i]&&layout(S).ps[i]&&(zoneOk||!S.zone[i]))return i}return idx(S.ent,S.b.y1-1)}

// ---- agent d'entretien
function cleaner(S,R,a,dt){const sp=D.STAFF.speed*.9;if(!S.dirt)return;
 if(a.st==='idle'){a.t-=dt;if(a.t>0)return;a.t=1;let best=-1,bv=.3;
  for(let y=S.b.y0;y<S.b.y1;y++)for(let x=S.b.x0;x<S.b.x1;x++){const i=idx(x,y);if(S.dirt[i]>bv&&!R.agents.some(o=>o!==a&&o.goal==='cell:'+i)){bv=S.dirt[i];best=i}}
  if(best<0){if(R.rnd()<.4){a.goal='cell:'+randomFloor(S,R,0);a.st='wander'}return}a.goal='cell:'+best;a.st='go';return}
 if(a.st==='wander'){const r=move(S,a,a.goal,'s',sp*.6,dt);if(r||r===null){a.st='idle';a.t=1}return}
 if(a.st==='go'){const r=move(S,a,a.goal,'s',sp,dt);if(r===null){a.st='idle';return}if(r){a.st='clean';a.t=1.6}return}
 if(a.st==='clean'){a.t-=dt;if(a.t>0)return;const x=a.c%W,y=a.c/W|0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(inLot(x+dx,y+dy))S.dirt[idx(x+dx,y+dy)]=0;a.st='idle';a.t=.4}}

// objectif de réserve par produit : sa part (%) du volume de réserve de son type (ambiant, frais, surgelé), × le niveau de remplissage choisi
export function stockTargets(S){const {cap}=capacity(S),tot={},o={},fill=S.fill??1;for(const c of D.CATS)tot[c.store]=(tot[c.store]||0)+(S.alloc[c.id]||0);
 for(const c of D.CATS)o[c.id]=tot[c.store]?Math.floor(cap[c.store]*fill*(S.alloc[c.id]||0)/tot[c.store]):0;return o}
// commande : on ne livre que ce qui manque pour revenir à l'objectif de chaque produit, dans la limite du budget. factor : surcoût (express)
export function makeOrder(S,budget,factor,only){const {cap,used}=capacity(S),want={},byStore={ambiant:0,frais:0,surgele:0},tg=stockTargets(S),pend=S.pending?.u||{};
 let cost=0;for(const c of D.CATS){want[c.id]=only?(only[c.id]||0):Math.max(0,tg[c.id]-S.reserve[c.id]-(pend[c.id]||0));cost+=want[c.id]*c.cost*factor}
 const k=!only&&budget>=0&&cost>budget?budget/cost:1;for(const c of D.CATS){want[c.id]=Math.floor(want[c.id]*k);byStore[c.store]+=want[c.id]}
 const o={u:{},factor};for(const c of D.CATS){const free=Math.max(0,cap[c.store]-used[c.store]),f=byStore[c.store]>free?free/byStore[c.store]:1;const u=Math.floor(want[c.id]*f);if(u)o.u[c.id]=u}return o}
export const orderCost=o=>o?Math.round(Object.entries(o.u).reduce((t,[c,u])=>t+u*D.CAT[c].cost*(o.factor||1),0)):0;
function mergeOrder(a,b){if(!a)return b;const o={u:{...a.u},factor:Math.max(a.factor,b.factor)};for(const c in b.u)o.u[c]=(o.u[c]||0)+b.u[c];return o}
// déchargement au quai : la marchandise entre en réserve (dans la limite de la place) et se paie
export function applyOrder(S,o){if(!o)return 0;const {cap,used}=capacity(S);let cost=0;
 for(const c of D.CATS){const u0=o.u[c.id]||0;if(!u0)continue;const free=Math.max(0,cap[c.store]-used[c.store]),u=Math.min(u0,free);used[c.store]+=u;S.reserve[c.id]+=u;cost+=u*c.cost*(o.factor||1)}
 cost=Math.round(cost);pay(S,cost,'buy');return cost}
export function deliver(S,budget,factor){return applyOrder(S,makeOrder(S,budget,factor))}
export const EXPRESS=1.15;
// livraison express : le camion part tout de suite (sans R : livraison immédiate, pour les tests)
export function express(S,budget,R,only){const dock=S.items.find(o=>o.t==='dock');if(!dock)return 'Il faut un quai de livraison.';
 const c=capacity(S).cap;if(!c.ambiant&&!c.frais&&!c.surgele)return 'Il faut de la place en réserve.';
 const o=makeOrder(S,budget,EXPRESS,only),cost=orderCost(o);if(!cost)return 'La réserve est pleine.';if(S.cash<cost)return 'Pas assez d’argent.';
 if(!R)return {cost:applyOrder(S,o)};if(!dockReady(S,dock))return 'Il faut une route jusqu’au quai.';
 S.pending=mergeOrder(S.pending,o);if(!R.truck)R.truckDay=-1;return {cost,truck:true}}
// commander un rayon précis : de quoi remplir ses meubles, plus une réserve
export function expressCat(S,cat,R){let need=0;for(const it of S.items)if(it.cat===cat)need+=def(it.t).cap-it.stock;need=Math.ceil(need*1.4)+20;return express(S,0,R,{[cat]:need})}
export function urgent(S,id,on){const it=S.items.find(o=>o.id===id);if(it)it.urgent=!!on}

// ---------------------------------------------------------------- nuit
// mise en place avant l'ouverture : les employés remplissent les rayons depuis la réserve (après la livraison du matin)
export function morningRestock(S){
 let cap=(S.staff.rayon||0)*D.STAFF.nightPerStocker;
 const sale=S.items.filter(it=>it.cat&&def(it.t).kind==='sale').sort((p,q)=>p.stock/def(p.t).cap-q.stock/def(q.t).cap);
 sale.sort((p,q)=>(q.urgent?1:0)-(p.urgent?1:0));
 for(let pass=0;pass<3&&cap>0;pass++)for(const it of sale){if(cap<=0)break;const want=Math.ceil((def(it.t).cap-it.stock)/(3-pass));const n=Math.min(want,S.reserve[it.cat],cap);if(n>0){it.stock+=n;S.reserve[it.cat]-=n;cap-=n}}
 for(const it of S.items)if(def(it.t).kind==='counter'&&manned(S,it)){const n=Math.min(def(it.t).cap-it.stock,S.reserve[it.cat]);it.stock+=n;S.reserve[it.cat]-=n}
}
export function night(S,R){const ds=S.dayStats,r=R.rnd;
 // 1. invendus périmés
 for(const c of D.CATS){if(!c.loss)continue;const lose=n=>Math.min(n,Math.floor(n*c.loss+r()));
  let u=lose(S.reserve[c.id]);S.reserve[c.id]-=u;for(const it of S.items)if(it.cat===c.id){const k=lose(it.stock);it.stock-=k;u+=k}
  ds.loss+=u*c.cost}
 S.month.loss+=ds.loss;
 // 2. livraison
 const hasDock=S.items.some(o=>o.t==='dock');let delivered=0;
 // la commande du lendemain : préparée maintenant, livrée le matin par camion
 // le camion de nuit livre avant l'ouverture (on le voit repartir le matin) ; sans route jusqu'au quai, pas de livraison
 const dock=S.items.find(o=>o.t==='dock'),road=dock&&dockReady(S,dock);
 if(hasDock&&S.budget>0&&road){const o=makeOrder(S,S.budget,1);delivered=orderCost(o);if(delivered){R.dawn=true;R.dawnOrder=o}}
 else if(hasDock&&S.budget>0)ev(R,{t:'noroad'});
 // 3. mise en rayon de nuit, comptoirs remplis par leur artisan
 // 4. ménage de fin de journée
 if(S.dirt){const k=(S.staff.menage||0)?.15:.92;for(let i=0;i<N;i++)if(S.dirt[i])S.dirt[i]*=k}
 // 5. réputation
 const avg=ds.customers?ds.sat/ds.customers:null;S.lastSat=avg;
 if(avg!=null)S.rep=clamp(S.rep+(avg-S.rep)*.25,0,100);else S.rep=clamp(S.rep+(40-S.rep)*.05,0,100);
 for(const role in S.staff)S.staffDays[role]=(S.staffDays[role]||0)+S.staff[role];
 const fixed=(salaries(S)+electricity(S)+(S.loan.left>0?S.loan.monthly:0))/D.DAYS_PER_MONTH;
 S.last={d:S.d,...ds,avgSat:avg};
 S.history.push({d:S.d,rev:Math.round(ds.rev),cogs:Math.round(ds.cogs),buy:Math.round(ds.buy),fixed:Math.round(fixed),ads:Math.round(ds.ads),build:Math.round(ds.build),profit:Math.round(ds.rev-ds.buy-fixed-ds.ads),cash:Math.round(S.cash),
  customers:ds.customers,sat:avg==null?null:Math.round(avg),units:ds.units,rupture:ds.rupture,expensive:ds.expensive,angry:ds.angry,notSold:ds.notSold,waitPen:Math.round(ds.waitPen),dirtPen:Math.round(ds.dirtPen),loss:Math.round(ds.loss),theft:Math.round(ds.theft)});
 if(S.history.length>60)S.history.shift();
 // journal long de la trésorerie : [jour, bénéfice, trésorerie] (jusqu'à 2 ans)
 S.plog=(S.plog||[]).concat([[S.d,Math.round(ds.rev-ds.buy-fixed-ds.ads),Math.round(S.cash)]]).slice(-730);
 S.catHist=(S.catHist||[]).concat([ds.cats]).slice(-14);
 ev(R,{t:'night',day:S.last,delivered,dock:hasDock});
 S.thoughts=(S.thoughts||[]).concat([ds.th]).slice(-7);
 if(R.truck){if(R.truck.st!=='in'&&R.truck.paid)refundRest(S,R.truck);R.truck=null}
 S.dayStats=blankDay();S.d++;S.hour=D.HOURS.start;R.agents=[];R.queues.clear();R.acc=0;R.cars=[];R.spotTaken.clear();R.bus=null;R.truckDay=-1;R.cartsOut=0;R.busWaiting=0;R.busT=0;
 if((S.d-1)%D.DAYS_PER_MONTH===0)monthEnd(S,R);
 R.staffDay=-1}
export function monthEnd(S,R){const m=S.month;
 for(const r of D.ROLES)m.salaries+=Math.round(r.salary*(S.staffDays[r.id]||0)/D.DAYS_PER_MONTH);
 m.elec=electricity(S);m.loan=S.loan.left>0?Math.min(S.loan.monthly,Math.round(S.loan.left*1.004)):0;S.loan.left=Math.max(0,Math.round(S.loan.left*1.004-m.loan));
 m.interest=S.cash<0?Math.round(-S.cash*.015):0;
 S.cash-=m.salaries+m.elec+m.loan+m.interest;
 const op=m.rev-m.buy-m.salaries-m.elec-m.loan-m.interest-m.ads;
 const rep={month:monthOf(S)-1,...m,result:Math.round(op),cash:Math.round(S.cash),avgSat:m.customers?m.sat/m.customers:null};
 S.reports=(S.reports||[]).concat([rep]).slice(-12);
 for(const r in S.staffDays)S.staffDays[r]=0;S.month=blankMonth();S.monthCat={};
 if(S.cash<D.BANKRUPTCY)S.over=true;
 ev(R,{t:'month',report:rep,over:S.over})}

// ---------------------------------------------------------------- sauvegarde
const pack=a=>{let s='';for(const v of a)s+=v;return s};
// R (facultatif) : la partie en cours (clients, voitures, camion, employés…) est sauvegardée telle quelle
export function serialize(S,R){const o={};for(const k in S)if(!k.startsWith('_')&&k!=='dirt')o[k]=S[k];
 o.level=1;o.ground=pack(S.ground);o.built=pack(S.built);o.wall=pack(S.wall);if(S.oneway)o.oneway=S.oneway.map(v=>v<0?'x':v).join('');if(S.owid){const q=[];S.owid.forEach((v,k)=>{if(v)q.push(k,v)});o.owid=q}o.zone=pack(S.zone);o.items=S.items.map(({inc,...it})=>it);
 if(R){const inc={};for(const it of S.items)if(it.inc)inc[it.id]=it.inc;const dirt=[];if(S.dirt)for(let i=0;i<N;i++)if(S.dirt[i]>.005)dirt.push(i,Math.round(S.dirt[i]*100));
  o.rt={truck:R.truck,truckDay:R.truckDay,cars:R.cars,spotTaken:[...R.spotTaken],bus:R.bus,busT:R.busT,busWaiting:R.busWaiting,agents:R.agents,
   queues:[...R.queues].map(([k,q])=>[k,q.map(a=>a.id)]),acc:R.acc,nid:R.nid,closing:R.closing,staffDay:R.staffDay,perDay:R.perDay,restockDay:R.restockDay,
   carrying:R.carrying,dawn:R.dawn,dawnOrder:R.dawnOrder,cartsOut:R.cartsOut,inc,dirt}}
 return o}
// reprend la partie là où on l'a laissée (o : objet sauvegardé, S : résultat de load)
export function restore(S,o){const t=o&&o.rt;if(!t||!S)return null;const R=runtime();
 for(const k of ['truck','truckDay','cars','bus','busT','busWaiting','agents','acc','nid','closing','staffDay','perDay','restockDay','carrying','dawn','dawnOrder','cartsOut'])if(t[k]!==undefined)R[k]=t[k];
 R.cars=(R.cars||[]).map(c=>c.key?.startsWith('vspot:')?{...c,key:'vfront:'+c.spot,path:null}:c);R.agents=R.agents||[];R.spotTaken=new Map(t.spotTaken||[]);
 const byId=new Map(R.agents.map(a=>[a.id,a]));R.queues=new Map((t.queues||[]).map(([k,ids])=>[k,ids.map(i=>byId.get(i)).filter(Boolean)]));
 for(const it of S.items)it.inc=(t.inc&&t.inc[it.id])||0;
 if(t.dirt&&S.dirt)for(let k=0;k<t.dirt.length;k+=2)S.dirt[t.dirt[k]]=t.dirt[k+1]/100;
 return R}
export function load(o){if(!o||o.v!==1)return null;const S={...o,wall:[...o.wall].map(Number),zone:[...o.zone].map(Number),items:o.items.map(it=>({...it,inc:0}))};
 // terrain d'une ancienne version (60 × 48) : on recopie case par case dans le nouveau, plus grand
 const w0=o.lw||60,h0=o.lh||48,grown=w0!==W||h0!==H,fit=a=>{if(!grown)return a;const n=new Array(N).fill(0);for(let y=0;y<Math.min(h0,H);y++)for(let x=0;x<Math.min(w0,W);x++)n[idx(x,y)]=a[y*w0+x]||0;return n};
 S.wall=fit(S.wall);S.zone=fit(S.zone);if(o.oneway)S.oneway=[...o.oneway].map(c=>c==='x'?-1:+c);if(Array.isArray(o.owid)&&o.owid.length!==N){const a=new Array(N).fill(0);for(let k=0;k<o.owid.length;k+=2)a[o.owid[k]]=o.owid[k+1];S.owid=a}S.lw=W;S.lh=H;if(grown)delete o.rt;
 if(o.built)S.built=fit([...o.built].map(Number));else{S.built=new Array(N).fill(0);for(let y=o.b.y0;y<o.b.y1;y++)for(let x=o.b.x0;x<o.b.x1;x++)S.built[idx(x,y)]=1}
 if(S.fy==null)S.fy=o.b.y1-1;
 // 3.1 : les articles coûtent 30 % de plus (paniers plus gros) : le budget d'achat suit
 if(!S.eco){S.budget=Math.round((S.budget||0)*1.3/50)*50;S.eco=31}
 S.monthCat=S.monthCat||{};S.catHist=S.catHist||[];bounds(S);S.ground=o.ground?fit([...o.ground].map(Number)):defaultGround(S);if(!S.ground.includes(3))addSidewalks(S,S.ground);if(!S.trees)S.trees=genTrees(S);
 if(grown){const g=S.ground;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=idx(x,y);if(isMainRoad(x,y))g[i]=g[i]===4?4:2;else if(x>=w0||y>=h0){if((y===RY-1||y===RE)&&!g[i])g[i]=3}}
  for(let x=0;x<W;x++)if(!g[idx(x,RE)])g[idx(x,RE)]=3;const old=new Set(S.trees.map(t=>idx(t[0],t[1])));
  S.trees=S.trees.concat(genTrees(S).filter(t=>(t[0]>=w0||t[1]>=h0)&&!old.has(idx(t[0],t[1]))))}if(!S.gv)migrateGround(S);if(!S.plog)S.plog=(S.history||[]).map(h=>[h.d,h.profit,h.cash]);if(!S.items.some(it=>def(it.t).zone===2))defaultParking(S);
 // sans la partie en cours sauvegardée (anciennes versions), on reprend au début de la journée
 if(!o.rt){if(S.hour>D.HOURS.open)S.hour=D.HOURS.start;S.dayStats=blankDay()}delete S.rt;S.dirt=new Float32Array(N);return S}
export function withDirt(S){S.dirt=S.dirt||new Float32Array(N);return S}

// ---------------------------------------------------------------- statistiques
// popularité sur les 7 derniers jours : ventes comparées à la demande attendue
export function popularity(S){const off=offered(S),h=(S.catHist||[]).slice(-7),sold={};let tot=0,dem=0;
 for(const d of h)for(const c in d){sold[c]=(sold[c]||0)+d[c]}
 for(const c of off){tot+=sold[c]||0;dem+=D.CAT[c].demand}
 const o={};for(const c of D.CATS){const shelf=S.items.reduce((t,it)=>t+(it.cat===c.id?it.stock:0),0);
  const r={perDay:h.length?(sold[c.id]||0)/h.length:0,shelf,reserve:S.reserve[c.id],tag:null};
  if(off.has(c.id)){if(!shelf&&!S.reserve[c.id])r.tag='empty';else if(tot>50&&h.length>=2){const ratio=((sold[c.id]||0)/tot)/(c.demand/dem);r.tag=ratio>1.25?'hot':ratio<.6?'cold':null}}
  o[c.id]=r}return o}
// moyennes sur les n derniers jours de l'historique
export function stats(S,n=7){const h=S.history.slice(-n).filter(d=>d.customers>0),k=h.length||1,sum=f=>h.reduce((t,d)=>t+(d[f]||0),0),c=sum('customers')||1;
 const cap=capacity(S);let shelf=0,shelfCap=0;for(const it of S.items){const d=def(it.t);if(d.cap&&d.kind!=='reserve'){shelf+=it.stock;shelfCap+=d.cap}}
 return {days:h.length,customers:sum('customers')/k,sat:h.length?h.reduce((t,d)=>t+(d.sat||0)*d.customers,0)/c:null,basket:sum('rev')/c,items:sum('units')/c,units:sum('units')/k,
  rupture:sum('rupture')/c*100,expensive:sum('expensive')/c*100,angry:sum('angry')/c*100,notSold:sum('notSold')/c*100,wait:sum('waitPen')/c,dirt:sum('dirtPen')/c,loss:sum('loss')/k,theft:sum('theft')/k,
  shelf,shelfCap,cap}}

// remarques des clients (7 derniers jours + aujourd'hui), les plus fréquentes d'abord
export function thoughts(S){const t={};for(const d of (S.thoughts||[]).concat([S.dayStats.th||{}]))for(const k in d)t[k]=(t[k]||0)+d[k];
 return Object.entries(t).sort((a,b)=>b[1]-a[1])}

// plan de stock par rayon : ventes par jour (moyenne 7 j, ou estimation avant la 1re journée), stock disponible
// (rayon + réserve + commande en attente), jours de stock, achat quotidien actuel et conseillé (ventes + 5 %).
// Les ventes d'un rayon vide sont faibles : on ne descend pas sous 80 % de la demande estimée.
// état : 'missing' (moins d'un jour de stock), 'short' (achat < ventes), 'over' (plus de 5 jours, ou achat bien au-dessus des ventes), 'ok'
export const STOCK_DAYS=2;
export function stockPlan(S){const pop=popularity(S),off=offered(S),tg=stockTargets(S),h=(S.catHist||[]).slice(-7),est=!h.length;
 const dem=D.CATS.reduce((t,c)=>t+c.demand,0),cust=attraction(S).perDay,pend=S.pending?.u||{},rows={},rush={};let budget=0,rushCost=0;
 for(const c of D.CATS){if(!off.has(c.id))continue;const p=pop[c.id];
  const guess=cust*(1-Math.pow(1-c.demand/dem,8))*1.45*.85,perDay=est?guess:Math.max(p.perDay,guess*.8),have=p.shelf+p.reserve+(pend[c.id]||0),days=perDay>.5?have/perDay:99,
   target=tg[c.id],rec=Math.round(perDay*1.05);
  // objectif de réserve trop petit pour une journée de ventes : « part trop faible » ; plus de 6 jours : « trop »
  const st=perDay>2&&have<perDay*.8?'missing':perDay>2&&target<perDay*1.1?'short':days>6||target>perDay*7?'over':'ok';
  rows[c.id]={perDay,have,days,target,rec,st,est,tag:p.tag};budget+=rec*c.cost;
  if(st==='missing'){const u=Math.ceil(perDay*1.5-have);if(u>0){rush[c.id]=u;rushCost+=u*c.cost*EXPRESS}}}
 // ce que les clients demandent et qu'on ne vend pas (7 derniers jours)
 const wanted=thoughts(S).filter(([k])=>k.startsWith('notsold:')).map(([k,n])=>[k.slice(8),n]).filter(([c])=>!off.has(c));
 // budget : ce que coûte le réassort d'une journée de ventes (+15 %)
 return {rows,est,budget:Math.ceil(budget*1.1/50)*50,rush,rushCost:Math.round(rushCost),wanted,low:S.budget<budget}}
// applique le conseil : budget quotidien, et parts de réserve selon les ventes (en volume)
export function applyPlan(S){const p=stockPlan(S),w={};for(const c of D.CATS)w[c.id]=p.rows[c.id]?p.rows[c.id].rec:0;
 if(!Object.values(w).some(v=>v>0))return 'Rien à commander pour l’instant.';S.alloc=defaultAlloc(w);S.budget=Math.max(250,p.budget);return null}
// alertes (barre de conseils, étiquettes) : 'low' = il en manque, 'short' = achat insuffisant
export function stockAlerts(S){const p=stockPlan(S),o={};for(const c in p.rows){const st=p.rows[c].st;if(st==='missing')o[c]='low';else if(st==='short')o[c]='short'}return o}

// trésorerie sur une période (n derniers jours ; 0 = tout) : jours rentables, moyenne, meilleur et pire jour, série en cours
export function cashStats(S,n=0){const all=S.plog||[],l=n?all.slice(-n):all,p=l.map(r=>r[1]);
 const fixed=(salaries(S)+electricity(S)+(S.loan.left>0?S.loan.monthly:0))/D.DAYS_PER_MONTH,ds=S.dayStats;
 let streak=0;for(let i=p.length-1;i>=0;i--){if(!streak)streak=p[i]>=0?1:-1;else if((p[i]>=0)===(streak>0))streak+=streak>0?1:-1;else break}
 const sum=p.reduce((a,b)=>a+b,0);
 return {days:l.map(r=>r[0]),profit:p,cash:l.map(r=>r[2]),good:p.filter(v=>v>=0).length,n:p.length,sum,avg:p.length?sum/p.length:0,
  best:p.length?Math.max(...p):0,worst:p.length?Math.min(...p):0,bestDay:p.length?l[p.indexOf(Math.max(...p))][0]:null,worstDay:p.length?l[p.indexOf(Math.min(...p))][0]:null,
  streak,today:Math.round(ds.rev-ds.buy-ds.ads-fixed*clamp((S.hour-D.HOURS.start)/(D.HOURS.close+.75-D.HOURS.start),0,1))}}

// conseils pour gagner de l'argent (7 derniers jours), du plus utile au moins utile : [{ico,t}]
const eurTxt=v=>(v<0?'−':'')+Math.round(Math.abs(v)).toLocaleString('fr-FR').replace(/ | /g,' ')+' €';
export function advice(S){const s=stats(S,7),out=[];if(!s.days)return out;
 const T=Object.fromEntries(thoughts(S)),days=Math.max(1,Math.min(7,s.days)),cust=s.customers,add=(p,ico,t)=>out.push({p,ico,t});
 const top=(pre,min)=>Object.entries(T).filter(([k,n])=>k.startsWith(pre)&&n>=min&&D.CAT[k.slice(pre.length)]).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k])=>D.CAT[k.slice(pre.length)].name.toLowerCase()).join(', ');
 const cs=cashStats(S,7),fixed=(salaries(S)+electricity(S)+(S.loan.left>0?S.loan.monthly:0))/D.DAYS_PER_MONTH;
 const checkouts=S.items.filter(o=>def(o.t).kind==='checkout').length,cashiers=S.staff.caissier||0,sal=id=>D.ROLES.find(r=>r.id===id).salary;
 if(cs.n&&cs.avg<0){const h=S.history.slice(-7).filter(d=>d.cogs!=null),gm=h.length?h.reduce((t,d)=>t+d.rev-d.cogs-d.ads,0)/h.length:cs.avg+fixed;
  if(gm>=fixed)add(100,'📦','Tu perds de l’argent surtout parce que tu achètes plus de stock que tu n’en vends. C’est normal au début ; sinon, baisse le remplissage de la réserve (Stock).');else add(100,'📉',`Le magasin coûte ${eurTxt(fixed)} par jour (salaires, électricité, prêt) et tes ventes ne rapportent que ${eurTxt(Math.max(0,gm))} de marge par jour. Il faut plus de clients ou moins de charges.`)}
 if(s.wait>4||s.angry>3)add(90,'🧾',cashiers<checkouts?'Les files d’attente font fuir des clients : embauche un·e caissier·ère.':'Les files d’attente font fuir des clients : ajoute une caisse et un·e caissier·ère.');
 else if(cashiers>1&&s.wait<.5&&cust/(cashiers-1)<160)add(70,'🧾',`Tes caisses sont calmes (${Math.round(cust)} clients par jour) : un·e caissier·ère de moins suffit, soit ${eurTxt(sal('caissier'))} économisés par mois.`);
 const plan=stockPlan(S),want=plan.wanted.filter(([,n])=>n>=cust*days*.04).slice(0,2).map(([c])=>D.CAT[c]?.name.toLowerCase()).filter(Boolean);
 if(want.length){const cap=capacity(S).cap,cold=plan.wanted.slice(0,2).some(([c])=>D.CAT[c]&&D.CAT[c].store!=='ambiant'&&!cap[D.CAT[c].store]);
  add(80,'🛒',`Les clients demandent : ${want.join(', ')}. Ajoute ces rayons pour vendre plus.`+(cold?' Il faut d’abord une chambre froide en réserve.':''))}
 if(s.rupture>4){let resv=0,emp=0;for(const c of offered(S)){const r=plan.rows[c];if(!r)continue;const shelf=S.items.some(o=>sells(S,o,c)&&o.stock>0);if(!shelf){emp++;if(S.reserve[c]>0)resv++}}
  add(85,'📦',resv&&resv>=emp/2?'Des rayons restent vides alors que la réserve a du stock : embauche un·e employé·e de rayon.':'Des rayons sont en rupture : ouvre Stock et appuie sur « Commander le manquant ».')}
 if(plan.low&&S.budget>0)add(75,'💶',`Budget d’achat trop bas : mets au moins ${eurTxt(plan.budget)} par jour.`);
 if(s.expensive>6){const c=top('cher:',3);if(c)add(72,'€',`Trop cher pour les clients : ${c}. Baisse un peu la marge.`)}
 else if(s.expensive<2){const c=top('cheap:',3);if(c)add(55,'💰',`Les clients trouvent ces rayons bon marché : ${c}. Monte la marge de quelques %.`)}
 if((T.jam||0)>=Math.max(3,cust*days*.01))add(78,'🚗',S.oneway?.some(v=>v>=0)?'Bouchons au parking : évite les allées à double sens qui se croisent, ou ajoute une deuxième sortie.':'Bouchons au parking : trace des sens uniques pour faire une boucle (on entre d’un côté, on sort de l’autre).');
 if((T.noparking||0)>=cust*days*.05)add(65,'🅿️','Des clients repartent faute de place : ajoute des places de parking.');
 if((T.nocart||0)>=cust*days*.05)add(50,'🛒','Les gros paniers manquent de caddies : ajoute un abri à caddies.');
 if(s.dirt>8&&cust>=180&&!(S.staff.menage>0))add(60,'🧹','Le magasin est sale et les clients le remarquent : embauche un·e agent d’entretien.');
 if(s.theft>Math.max(40,cust*.25))add(58,'📹',`Les vols coûtent ${eurTxt(s.theft)} par jour : ajoute des caméras ou un portique antivol.`);
 if(cs.n>=3&&cs.avg>0&&s.wait<2&&!(S.ads.until>=S.d)&&S.cash>20000)add(30,'📣','Ça tourne bien : une campagne de pub amènera plus de clients.');
 return out.sort((a,b)=>b.p-a.p).slice(0,5).map(({ico,t})=>({ico,t}))}
