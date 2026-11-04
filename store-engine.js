// BagaStore : moteur de simulation (sans DOM, testable dans Node).
// S : état sauvegardé (magasin, argent, stocks). R : état d'exécution (clients, employés, files d'attente).
import * as D from './store-data.js';
const W=D.LOT_W,H=D.LOT_H,N=W*H;
export const DIRS=[[0,1],[-1,0],[0,-1],[1,0]];   // devant d'un meuble selon sa rotation (0 : vers le sud)
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const idx=(x,y)=>y*W+x;
export function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

// ---------------------------------------------------------------- nouvelle partie
export function newGame(){
 const s=D.START,S={v:1,d:1,hour:D.HOURS.open,open:false,cash:s.cash,loan:{left:s.loan,monthly:s.loanMonthly},rep:s.rep,
  b:{x0:s.x0,y0:s.y0,x1:s.x1,y1:s.y1},fy:s.y1-1,ent:s.entrance,built:new Array(N).fill(0),wall:new Array(N).fill(0),zone:new Array(N).fill(0),items:[],nid:1,
  reserve:{},staff:{},staffDays:{},budget:4000,alloc:{},margin:{},ads:{until:0,boost:0},extraLoans:0,
  month:blankMonth(),dayStats:blankDay(),last:null,history:[],sold:{},over:false};
 for(const c of D.CATS){S.reserve[c.id]=0;S.margin[c.id]=c.ref;S.sold[c.id]=0}
 S.alloc=defaultAlloc();
 for(const r of D.ROLES){S.staff[r.id]=0;S.staffDays[r.id]=0}
 for(let y=s.y0;y<s.y1;y++)for(let x=s.x0;x<s.x1;x++)S.built[idx(x,y)]=1;S.monthCat={};S.catHist=[];
 // réserve au nord, séparée par un mur avec une porte au milieu
 for(let y=s.y0;y<s.y0+s.reserveRows;y++)for(let x=s.x0;x<s.x1;x++)S.zone[idx(x,y)]=1;
 const wy=s.y0+s.reserveRows;for(let x=s.x0;x<s.x1;x++)S.wall[idx(x,wy)]=1;
 S.wall[idx((s.x0+s.x1>>1)-1,wy)]=2;
 S.ground=defaultGround(S);S.trees=genTrees(S);
 defaultParking(S);
 return S;
}
// sol : 0 herbe, 1 goudron, 2 route. La route principale (3 rangs du bas) ne se modifie pas.
export const isMainRoad=(x,y)=>y>=H-3;
function defaultGround(S){const g=new Array(N).fill(0);for(let y=H-3;y<H;y++)for(let x=0;x<W;x++)g[idx(x,y)]=2;
 for(let y=S.fy+1;y<H-3;y++)for(let x=S.b.x0-2;x<S.b.x1+2;x++)if(inLot(x,y))g[idx(x,y)]=1;return g}
function genTrees(S){const o=[],used=new Set();let s=11;const r=()=>(s=(s*16807)%2147483647)/2147483647;
 for(let k=0;k<140&&o.length<70;k++){const x=Math.floor(r()*W),y=Math.floor(r()*(H-4)),i=idx(x,y);
  if(used.has(i)||S.ground[i]||x>=S.b.x0-2&&x<S.b.x1+2&&y>=S.b.y0-2&&y<=S.fy+1)continue;let near=false;for(const j of used){const dx=j%W-x,dy=(j/W|0)-y;if(dx*dx+dy*dy<5){near=true;break}}if(near)continue;
  used.add(i);o.push([x,y,+(.7+r()*.6).toFixed(2)])}return o}
export function treeAt(S,x,y){return (S.trees||[]).findIndex(t=>t[0]===x&&t[1]===y)}
export function clearTrees(S,cellsIdx){const set=new Set(cellsIdx);const n=(S.trees||[]).length;S.trees=(S.trees||[]).filter(t=>!set.has(idx(t[0],t[1])));return n-S.trees.length}
function defaultParking(S){for(const x of [20,22,24,26,32,34,36,38]){if(!canPlace(S,'spot',x,S.fy+2,0))S.items.push({id:S.nid++,t:'spot',x,y:S.fy+2,r:0,cat:null,stock:0});dirty(S)}}
// répartition du budget d'achat en valeur : demande × prix d'achat (total 100 %)
export function defaultAlloc(weights){const w={};let t=0;for(const c of D.CATS){w[c.id]=weights?weights[c.id]||0:c.demand*c.cost;t+=w[c.id]}
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
const entCells=S=>[[S.ent,S.fy],[S.ent+1,S.fy]];
const isEntrance=(S,x,y)=>y===S.fy&&(x===S.ent||x===S.ent+1);
const nearEntrance=(S,x,y)=>isEntrance(S,x,y)||(y===S.fy-1&&(x===S.ent||x===S.ent+1));

// ---------------------------------------------------------------- grille de passage et champs de distance
// mode 'c' : clients (pas la réserve), 's' : employés.
export function layout(S){if(S._L)return S._L;
 const occ=new Int32Array(N);for(const it of S.items)for(const c of cells(it))occ[c]=it.id;
 const pc=new Uint8Array(N),ps=new Uint8Array(N);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=idx(x,y);
  if(!inside(S,x,y)){const o=occ[i]&&S.items.find(it=>it.id===occ[i]);if(o&&o.t==='corral')continue;pc[i]=ps[i]=1;continue}
  if(occ[i]||S.wall[i]===1)continue;ps[i]=1;if(!S.zone[i])pc[i]=1}
 for(const [tx,ty] of S.trees||[]){const i=idx(tx,ty);pc[i]=ps[i]=0}
 S._L={occ,pc,ps,fields:new Map()};assign(S);return S._L}
export const dirty=S=>{S._L=null};
function canStep(S,P,x,y,nx,ny){if(!inLot(nx,ny)||!P[idx(nx,ny)])return false;
 const a=inside(S,x,y),b=inside(S,nx,ny);if(a===b)return true;
 // on n'entre et ne sort que par la porte d'entrée (façade sud)
 return nx===x&&(x===S.ent||x===S.ent+1)&&Math.max(y,ny)===S.fy+1&&Math.min(y,ny)===S.fy}
export function field(S,key,mode){const L=layout(S),k=mode+key;let f=L.fields.get(k);if(f)return f;
 const P=mode==='c'?L.pc:L.ps;f=new Int16Array(N).fill(-1);const q=[];
 for(const [x,y] of targets(S,key))if(inLot(x,y)&&P[idx(x,y)]&&f[idx(x,y)]<0){f[idx(x,y)]=0;q.push(idx(x,y))}
 for(let h=0;h<q.length;h++){const i=q[h],x=i%W,y=i/W|0;for(const [dx,dy] of DIRS){const nx=x+dx,ny=y+dy;if(canStep(S,P,x,y,nx,ny)&&f[idx(nx,ny)]<0){f[idx(nx,ny)]=f[i]+1;q.push(idx(nx,ny))}}}
 L.fields.set(k,f);return f}
function targets(S,key){
 if(key==='street'){const o=[];for(let y=0;y<H-3;y++)o.push([0,y],[W-1,y]);return o}
 if(key.startsWith('item:')){const it=S.items.find(o=>o.id===+key.slice(5));if(it&&it.t==='busstop')return cells(it).map(c=>[c%W,c/W|0])}
 if(key==='ent')return entCells(S);
 if(key.startsWith('cell:')){const i=+key.slice(5);return [[i%W,i/W|0]]}
 if(key.startsWith('item:')){const it=S.items.find(o=>o.id===+key.slice(5));return it?front(it):[]}
 return []}

// ---------------------------------------------------------------- placement
export function canPlace(S,t,x,y,r){const d=def(t),it={t,x,y,r},L=layout(S);
 if(d.zone===2){for(const c of cells(it)){const cx=c%W,cy=c/W|0;
   if(!inLot(cx,cy)||inside(S,cx,cy))return 'Dehors, sur le parking.';
   if(isMainRoad(cx,cy))return 'Pas sur la route.';
   if(L.occ[c])return 'Place déjà prise.';
   if(d.kind==='spot'&&!S.ground[c])return 'Goudronne d’abord (outil Goudron).';
   if(cx>=S.ent-1&&cx<=S.ent+2&&cy<=S.fy+2)return 'Laisse l’accès à l’entrée.';
   if(d.kind==='bus'&&cy!==H-4)return 'L’arrêt de bus se place au bord de la route.'}
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
export function place(S,t,x,y,r,cat){const why=canPlace(S,t,x,y,r);if(why)return why;const d=def(t);
 if(S.cash<d.price)return 'Pas assez d’argent.';
 const it={id:S.nid++,t,x,y,r,cat:d.cats?(cat&&d.cats.includes(cat)?cat:bestCat(S,d)):null,stock:0};clearTrees(S,cells(it));
 S.items.push(it);pay(S,d.price,'build');dirty(S);remember(S,{type:'item',id:it.id,cost:d.price});return it}
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
export function eraseAt(S,x,y){if(!inLot(x,y))return 'Rien à démolir ici.';const i=idx(x,y),L=layout(S);
 if(L.occ[i]){removeItem(S,L.occ[i]);return null}
 if(S.wall[i]){S.cash+=Math.round((S.wall[i]===2?D.DOOR_COST:D.WALL_COST)*D.REFUND);S.wall[i]=0;dirty(S);return null}
 const t=treeAt(S,x,y);if(t>=0){S.trees.splice(t,1);dirty(S);return null}
 if(!inside(S,x,y)&&S.ground[i]&&!isMainRoad(x,y)){S.ground[i]=0;dirty(S);return null}
 return 'Rien à démolir ici.'}
export function eraseInfo(S,x,y){if(!inLot(x,y))return null;const i=idx(x,y),L=layout(S);
 if(L.occ[i]){const it=S.items.find(o=>o.id===L.occ[i]);return {label:def(it.t).name,refund:Math.round(def(it.t).price*D.REFUND),cells:cells(it),lost:reserveLoss(S,it.id)}}
 if(S.wall[i])return {label:S.wall[i]===2?'Porte':'Mur',refund:Math.round((S.wall[i]===2?D.DOOR_COST:D.WALL_COST)*D.REFUND),cells:[i]};
 if(treeAt(S,x,y)>=0)return {label:'Arbre',refund:0,cells:[i]};
 if(!inside(S,x,y)&&S.ground[i]&&!isMainRoad(x,y))return {label:S.ground[i]===2?'Route':'Goudron',refund:0,cells:[i]};
 return null}
// goudron (rectangle) et route (ligne de 3 cases de large)
export const GROUND_COST={1:40,2:60};
export function groundPlan(S,a,b,type){const L=layout(S),set=new Set();
 if(type===1){for(let y=Math.min(a[1],b[1]);y<=Math.max(a[1],b[1]);y++)for(let x=Math.min(a[0],b[0]);x<=Math.max(a[0],b[0]);x++)set.add(idx(x,y))}
 else for(const [x,y] of lineCells(a,b)){const hor=Math.abs(a[0]-b[0])>=Math.abs(a[1]-b[1]);for(let k=-1;k<=1;k++){const cx=hor?x:x+k,cy=hor?y+k:y;if(inLot(cx,cy))set.add(idx(cx,cy))}}
 const cl=[];for(const i of set){const x=i%W,y=i/W|0;if(!inLot(x,y)||inside(S,x,y)||isMainRoad(x,y)||S.ground[i]===type)continue;const o=L.occ[i]&&S.items.find(it=>it.id===L.occ[i]);if(o&&o.t!=='spot')continue;cl.push(i)}
 return {cells:cl,cost:cl.length*GROUND_COST[type],why:cl.length?null:'Rien à construire ici.'}}
export function paintGround(S,a,b,type){const p=groundPlan(S,a,b,type);if(p.why)return p.why;if(S.cash<p.cost)return 'Pas assez d’argent.';
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
  if(x<m||y<m||x>=W-m||isMainRoad(x,y))why='Le terrain s’arrête ici.';else if(x>=S.ent-1&&x<=S.ent+2&&y>S.fy&&y<=S.fy+3)why='Laisse l’accès à l’entrée.';
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
export function borrow(S){S.cash+=D.EXTRA_LOAN.amount;S.loan.left+=D.EXTRA_LOAN.amount;S.loan.monthly+=D.EXTRA_LOAN.monthly;S.extraLoans++}
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
 const base=60+.45*sa,repF=.45+S.rep/90;
 const spots=S.items.filter(o=>o.t==='spot').length,bus=S.items.some(o=>o.t==='busstop'),transportF=.8+Math.min(.35,spots*.025)+(bus?.12:0);
 const n0=base*repF*(.45+.55*variety)*priceF*(1+.05*Math.min(4,counters)+decorF)*(1+ad)*transportF;
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
 {const dock=S.items.find(o=>o.t==='dock');if(dock&&!reachable(S,'vdock:'+dock.id))p.push('Construis une route jusqu’au quai pour les camions.')}
 if(!S.staff.rayon)p.push('Embauche un·e employé·e de rayon.');
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
 const h0=Math.floor(S.hour);S.hour+=dt/D.HOURS.realSecPerHour;if(Math.floor(S.hour)!==h0)startDay(S,R);
 const isOpen=S.open&&S.hour<D.HOURS.close;
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
 if(u<T.busShare+T.carShare){if(free.length)return spawnCar(S,R,free[Math.floor(r()*free.length)]);th(S,'noparking');if(r()<.25)return}
 const L=layout(S),side=r()<.5?0:W-1;let y=H-4;while(y>0&&!L.pc[idx(side,y)])y--;makeCustomer(S,R,side,y,0)}
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
// véhicules : ne roulent que sur le goudron et les routes, case par case (champ de distance)
function drivable(S,i,own){if(S.built[i]||!S.ground[i])return false;const o=S._L.occ[i];if(!o)return true;const it=S.items.find(x=>x.id===o);return !!it&&it.t==='spot'&&it.id===own}
function vTargets(S,key){if(key==='vroad'||key.startsWith('vleave:')){const o=[];for(let y=H-3;y<H;y++)o.push(idx(0,y),idx(W-1,y));return o}
 const it=S.items.find(o=>o.id===+key.slice(key.indexOf(':')+1));if(!it)return [];
 if(key.startsWith('vspot:'))return cells(it);
 if(key.startsWith('vdock:'))return back(it).filter(([x,y])=>inLot(x,y)).map(([x,y])=>idx(x,y));return []}
export function vfield(S,key){const L=layout(S),k='v'+key;let f=L.fields.get(k);if(f)return f;f=new Int16Array(N).fill(-1);const q=[];
 const own=key.startsWith('vspot:')||key.startsWith('vleave:')?+key.slice(key.indexOf(':')+1):-1;
 for(const i of vTargets(S,key))if(drivable(S,i,own)&&f[i]<0){f[i]=0;q.push(i)}
 for(let h=0;h<q.length;h++){const i=q[h],x=i%W,y=i/W|0;for(const [dx,dy] of DIRS){const nx=x+dx,ny=y+dy;if(!inLot(nx,ny))continue;const j=idx(nx,ny);if(f[j]<0&&drivable(S,j,own)){f[j]=f[i]+1;q.push(j)}}}
 L.fields.set(k,f);return f}
const ENTRY_L=()=>idx(0,H-2),ENTRY_R=()=>idx(W-1,H-2);
export function reachable(S,key){const f=vfield(S,key);return f[ENTRY_L()]>=0}
function vehicle(R,c,extra){const v={id:R.nid++,c,x:c%W+.5,z:(c/W|0)+.5,nx:-1,ang:Math.PI/2,...extra};return v}
// case tenue par un autre véhicule (sa case, celle où il va, et la case derrière lui pour les longs)
function vBusy(R,v,cell){for(const o of R.cars.concat(R.truck?[R.truck]:[])){if(o===v)continue;if(o.c===cell||o.nx===cell||o.prev===cell)return true}return false}
function moveV(S,v,key,speed,dt,R){const f=vfield(S,key);let b=speed*dt;
 for(let g=0;g<8&&b>0;g++){if(v.nx<0){if(f[v.c]===0)return true;if(f[v.c]<0)return null;const x=v.c%W,y=v.c/W|0;let best=-1;
   for(const [dx,dy] of DIRS){const nx=x+dx,ny=y+dy;if(inLot(nx,ny)&&f[idx(nx,ny)]===f[v.c]-1){best=idx(nx,ny);break}}if(best<0)return null;
   // on attend que la voie se libère (au bout de 3 s on passe, pour ne jamais rester bloqué)
   if(R&&vBusy(R,v,best)&&(v.wait=(v.wait||0)+dt)<3)return false;v.wait=0;v.nx=best}
  const tx=v.nx%W+.5,tz=(v.nx/W|0)+.5,dx=tx-v.x,dz=tz-v.z,d=Math.hypot(dx,dz);if(d>.01){const a=Math.atan2(dx,dz);let da=a-v.ang;while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;v.ang+=da*Math.min(1,dt*10)}
  if(d<=b){v.x=tx;v.z=tz;v.prev=v.c;v.c=v.nx;v.nx=-1;b-=d}else{v.x+=dx/d*b;v.z+=dz/d*b;b=0}}return false}
function spotGeo(it){const [w,d]=size(it);let ex=Math.floor(it.x+w/2),ey=it.y+d;if(!inLot(ex,ey))ey=it.y;return {cx:it.x+w/2,cz:it.y+d/2,exit:idx(ex,Math.min(H-1,ey)),vert:w<d}}
function spawnCar(S,R,it){const g=spotGeo(it),left=R.rnd()<.5;
 const car=vehicle(R,left?ENTRY_L():ENTRY_R(),{spot:it.id,st:'in',key:'vspot:'+it.id,exit:g.exit,cx:g.cx,cz:g.cz,vert:g.vert,ang:left?Math.PI/2:-Math.PI/2,col:[[.85,.2,.2],[.2,.4,.8],[.95,.95,.95],[.2,.2,.22],[.95,.75,.2],[.35,.65,.4],[.6,.6,.65]][Math.floor(R.rnd()*7)]});
 R.spotTaken.set(it.id,car.id);R.cars.push(car)}
function carLeave(S,R,car){if(car.st==='out')return;car.st='out';car.key='vleave:'+car.spot;car.nx=-1}
function moveVehicle(v,speed,dt){let b=speed*dt;while(b>0&&v.i<v.path.length){const [tx,tz]=v.path[v.i],dx=tx-v.x,dz=tz-v.z,d=Math.hypot(dx,dz);if(d>.01)v.ang=Math.atan2(dx,dz);if(d<=b){v.x=tx;v.z=tz;b-=d;v.i++}else{v.x+=dx/d*b;v.z+=dz/d*b;b=0}}return v.i>=v.path.length}
function traffic(S,R,dt){const T=D.TRAFFIC;
 for(const car of R.cars.slice()){if(car.st==='parked')continue;const done=moveV(S,car,car.key,car.st==='in'?T.carSpeed:T.carSpeed*1.2,dt,R);
  if(done===null){R.cars.splice(R.cars.indexOf(car),1);R.spotTaken.delete(car.spot);continue}
  if(done&&car.st==='in'){car.st='parked';car.x=car.cx;car.z=car.cz;car.ang=car.vert?Math.PI:Math.PI/2;const ex=car.exit%W,ey=car.exit/W|0;const a=makeCustomer(S,R,ex,ey,T.carExtra);a.car=car.id}
  if(done&&car.st==='out'){R.cars.splice(R.cars.indexOf(car),1);R.spotTaken.delete(car.spot)}}
 // camion de livraison : de la route principale jusqu'au quai
 const tr=R.truck;
 if(!tr&&R.dawn){R.dawn=false;const dock=S.items.find(o=>o.t==='dock');if(dock&&reachable(S,'vdock:'+dock.id))R.truck=vehicle(R,ENTRY_L(),{st:'in',key:'vdock:'+dock.id,dawn:true})}
 if(!R.truck&&S.pending&&R.truckDay!==S.d&&S.hour>=D.HOURS.open){R.truckDay=S.d;const dock=S.items.find(o=>o.t==='dock');
  if(dock&&reachable(S,'vdock:'+dock.id))R.truck=vehicle(R,ENTRY_L(),{st:'in',key:'vdock:'+dock.id,dock:dock.id});
  else{ev(R,{t:'noroad'});S.pending=null}}
 if(R.truck){const t=R.truck;
  if(t.st==='in'){const d=moveV(S,t,t.key,T.carSpeed*.8,dt,R);if(d===null){if(!t.dawn)S.pending=null;R.truck=null}else if(d){t.st='unload';t.t=4;ev(R,{t:'truck'})}}
  else if(t.st==='unload'){t.t-=dt;if(t.t<=0){if(!t.dawn){const cost=applyOrder(S,S.pending);S.pending=null;ev(R,{t:'delivery',cost})}t.st='out';t.key='vroad';t.nx=-1}}
  else if(t.st==='out'){const d=moveV(S,t,'vroad',T.carSpeed,dt,R);if(d||d===null){R.truck=null;if(S.pending)R.truckDay=-1}}}
 // bus : passe toutes les demi-heures s'il y a du monde à déposer ou à prendre
 const stop=S.items.find(o=>o.t==='busstop');R.busT+=dt/D.HOURS.realSecPerHour;
 const waiting=R.agents.filter(a=>a.st==='waitBus');
 if(!R.bus&&stop&&R.busT>=T.busEvery&&(R.busWaiting>0||waiting.length)){R.busT=0;const sx=stop.x+(stop.r%2?.5:1.5);R.bus={x:-14,z:H-2.25,ang:Math.PI/2,st:'in',path:[[sx,H-2.25]],i:0,t:0,stop:stop.id}}
 const bus=R.bus;if(bus){
  if(bus.st==='in'&&moveVehicle(bus,T.busSpeed,dt)){bus.st='stop';bus.t=3;const st2=S.items.find(o=>o.id===bus.stop);
   if(st2){const n=Math.min(T.busMax,R.busWaiting);R.busWaiting-=n;for(let k=0;k<n;k++){const a=makeCustomer(S,R,Math.max(0,Math.min(W-1,st2.x+(k%3))),H-3,0);a.bus=true;a.x+=R.rnd()*.4-.2}
    for(const a of waiting)R.agents.splice(R.agents.indexOf(a),1);ev(R,{t:'bus',n})}}
  if(bus.st==='stop'){bus.t-=dt;if(bus.t<=0){bus.st='out';bus.path=[[W+14,H-2.25]];bus.i=0}}
  if(bus.st==='out'&&moveVehicle(bus,T.busSpeed*1.2,dt))R.bus=null}}

function spawnStaff(S,R){R.staffDay=S.d;R.agents=R.agents.filter(a=>a.k==='c');
 for(const it of S.items)it.inc=0;
 const e=entCells(S);let k=0;
 for(const role of ['rayon','menage'])for(let n=0;n<(S.staff[role]||0);n++){const [x,y]=e[k++%2];
  R.agents.push({id:R.nid++,k:'s',role,x:x+.5,y:y-.5,c:idx(x,y-1),nx:-1,st:'idle',t:R.rnd()*1.5,carry:null})}
 startDay(S,R)}
export function syncStaff(S,R){// après une embauche ou un licenciement en journée
 for(const role of ['rayon','menage']){const have=R.agents.filter(a=>a.role===role),want=S.staff[role]||0;
  for(let n=have.length;n<want;n++){const [x,y]=entCells(S)[n%2];R.agents.push({id:R.nid++,k:'s',role,x:x+.5,y:y-.5,c:idx(x,y-1),nx:-1,st:'idle',t:0,carry:null})}
  for(const a of have.slice(want)){if(a.carry)S.reserve[a.carry.cat]+=a.carry.n;dropTask(S,a);R.agents.splice(R.agents.indexOf(a),1)}}}

// déplacement d'une case à l'autre en suivant le champ de distance ; renvoie true à l'arrivée
function move(S,a,key,mode,speed,dt){const f=field(S,key,mode);let budget=speed*dt;
 for(let guard=0;guard<6&&budget>0;guard++){
  if(a.nx<0){if(f[a.c]===0)return true;
   if(f[a.c]<0){const j=rescue(S,a,f);if(j<0)return null;a.c=j;a.x=j%W+.5;a.y=(j/W|0)+.5;continue}
   const x=a.c%W,y=a.c/W|0,d=f[a.c];let best=-1;
   for(const [dx,dy] of DIRS){const nx=x+dx,ny=y+dy;if(inLot(nx,ny)&&f[idx(nx,ny)]===d-1&&canStep(S,mode==='c'?S._L.pc:S._L.ps,x,y,nx,ny)){best=idx(nx,ny);break}}
   // raccourci en diagonale quand les deux côtés sont libres
   if(best>=0&&d>=2)for(const [dx,dy] of [[1,1],[1,-1],[-1,1],[-1,-1]]){const nx=x+dx,ny=y+dy;if(inLot(nx,ny)&&f[idx(nx,ny)]===d-2&&inside(S,x,y)===inside(S,nx,ny)&&f[idx(x+dx,y)]===d-1&&f[idx(x,y+dy)]===d-1){best=idx(nx,ny);break}}
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
  if(!all.length){th(S,'notsold:'+w.cat);a.want.shift();a.sat-=3;S.dayStats.notSold++;continue}
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
 const dp=Math.min(22,a.dirt/Math.max(1,a.steps)*90);S.dayStats.dirtPen+=dp;const db=decorBonus(S),sat=clamp(a.sat-dp+db,0,100);
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
 if(a.st==='idle'){a.t-=dt;if(a.t>0)return;a.t=.8;
  let best=null,bv=2;for(const it of S.items){const d=def(it.t);if(d.kind!=='sale'||!it.cat||!S.reserve[it.cat])continue;const v=(it.stock+(it.inc||0))/d.cap-(it.urgent?2:0);if((v<.6||it.urgent&&it.stock+(it.inc||0)<d.cap)&&v<bv){bv=v;best=it}}
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

// commande selon la répartition, limitée par la place en réserve. factor : surcoût (express)
export function makeOrder(S,budget,factor,only){const {cap,used}=capacity(S),want={},byStore={ambiant:0,frais:0,surgele:0};
 const tot=D.CATS.reduce((t,c)=>t+(S.alloc[c.id]||0),0)||1;
 for(const c of D.CATS){want[c.id]=only?(only[c.id]||0):Math.floor(budget*(S.alloc[c.id]||0)/tot/(c.cost*factor));byStore[c.store]+=want[c.id]}
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
 if(!R)return {cost:applyOrder(S,o)};if(!reachable(S,'vdock:'+dock.id))return 'Il faut une route jusqu’au quai.';
 S.pending=mergeOrder(S.pending,o);if(!R.truck)R.truckDay=-1;return {cost,truck:true}}
// commander un rayon précis : de quoi remplir ses meubles, plus une réserve
export function expressCat(S,cat,R){let need=0;for(const it of S.items)if(it.cat===cat)need+=def(it.t).cap-it.stock;need=Math.ceil(need*1.4)+20;return express(S,0,R,{[cat]:need})}
export function urgent(S,id,on){const it=S.items.find(o=>o.id===id);if(it)it.urgent=!!on}

// ---------------------------------------------------------------- nuit
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
 const dock=S.items.find(o=>o.t==='dock'),road=dock&&reachable(S,'vdock:'+dock.id);
 if(hasDock&&S.budget>0&&road){delivered=applyOrder(S,makeOrder(S,S.budget,1));ds.buy=delivered;R.dawn=true}
 else if(hasDock&&S.budget>0)ev(R,{t:'noroad'});
 // 3. mise en rayon de nuit, comptoirs remplis par leur artisan
 let cap=(S.staff.rayon||0)*D.STAFF.nightPerStocker;
 const sale=S.items.filter(it=>it.cat&&def(it.t).kind==='sale').sort((p,q)=>p.stock/def(p.t).cap-q.stock/def(q.t).cap);
 sale.sort((p,q)=>(q.urgent?1:0)-(p.urgent?1:0));
 for(let pass=0;pass<3&&cap>0;pass++)for(const it of sale){if(cap<=0)break;const want=Math.ceil((def(it.t).cap-it.stock)/(3-pass));const n=Math.min(want,S.reserve[it.cat],cap);if(n>0){it.stock+=n;S.reserve[it.cat]-=n;cap-=n}}
 for(const it of S.items)if(def(it.t).kind==='counter'&&manned(S,it)){const n=Math.min(def(it.t).cap-it.stock,S.reserve[it.cat]);it.stock+=n;S.reserve[it.cat]-=n}
 // 4. ménage de fin de journée
 if(S.dirt){const k=(S.staff.menage||0)?.15:.92;for(let i=0;i<N;i++)if(S.dirt[i])S.dirt[i]*=k}
 // 5. réputation
 const avg=ds.customers?ds.sat/ds.customers:null;S.lastSat=avg;
 if(avg!=null)S.rep=clamp(S.rep+(avg-S.rep)*.25,0,100);else S.rep=clamp(S.rep+(40-S.rep)*.05,0,100);
 for(const role in S.staff)S.staffDays[role]=(S.staffDays[role]||0)+S.staff[role];
 const fixed=(salaries(S)+electricity(S)+(S.loan.left>0?S.loan.monthly:0))/D.DAYS_PER_MONTH;
 S.last={d:S.d,...ds,avgSat:avg};
 S.history.push({d:S.d,rev:Math.round(ds.rev),buy:Math.round(ds.buy),fixed:Math.round(fixed),ads:Math.round(ds.ads),build:Math.round(ds.build),profit:Math.round(ds.rev-ds.buy-fixed-ds.ads),cash:Math.round(S.cash),
  customers:ds.customers,sat:avg==null?null:Math.round(avg),units:ds.units,rupture:ds.rupture,expensive:ds.expensive,angry:ds.angry,notSold:ds.notSold,waitPen:Math.round(ds.waitPen),dirtPen:Math.round(ds.dirtPen),loss:Math.round(ds.loss),theft:Math.round(ds.theft)});
 if(S.history.length>60)S.history.shift();
 S.catHist=(S.catHist||[]).concat([ds.cats]).slice(-14);
 ev(R,{t:'night',day:S.last,delivered,dock:hasDock});
 S.thoughts=(S.thoughts||[]).concat([ds.th]).slice(-7);
 S.dayStats=blankDay();S.d++;S.hour=D.HOURS.open;R.agents=[];R.queues.clear();R.acc=0;R.cars=[];R.spotTaken.clear();R.bus=null;R.truck=null;R.truckDay=-1;R.cartsOut=0;R.busWaiting=0;R.busT=0;
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
export function serialize(S){const o={};for(const k in S)if(!k.startsWith('_')&&k!=='dirt')o[k]=S[k];
 o.level=1;o.ground=pack(S.ground);o.built=pack(S.built);o.wall=pack(S.wall);o.zone=pack(S.zone);o.items=S.items.map(({inc,...it})=>it);return o}
export function load(o){if(!o||o.v!==1)return null;const S={...o,wall:[...o.wall].map(Number),zone:[...o.zone].map(Number),items:o.items.map(it=>({...it,inc:0}))};
 if(o.built)S.built=[...o.built].map(Number);else{S.built=new Array(N).fill(0);for(let y=o.b.y0;y<o.b.y1;y++)for(let x=o.b.x0;x<o.b.x1;x++)S.built[idx(x,y)]=1}
 if(S.fy==null)S.fy=o.b.y1-1;S.monthCat=S.monthCat||{};S.catHist=S.catHist||[];bounds(S);S.ground=o.ground?[...o.ground].map(Number):defaultGround(S);if(!S.trees)S.trees=genTrees(S);if(!S.items.some(it=>def(it.t).zone===2))defaultParking(S);
 if(S.hour>D.HOURS.open)S.hour=D.HOURS.open;S.dayStats=blankDay();S.dirt=new Float32Array(N);return S}
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
