// BagaWorld : le monde (sans DOM). Un seul grand terrain en cases, généré à l'identique pour tout le monde (graine fixe) :
// Bagatown au centre, la Prairie des Moutoufous au sud (et le trône du Mouton Royal tout au fond), la Plage de Baga à l'ouest,
// le Bois des Champis à l'est, les Collines Boudeuses au nord. On s'y déplace en continu ; un combat se joue sur la grille
// découpée autour de l'endroit où il commence.
import {SPAWNS,MOBS,DUNGEON,HARVEST} from './bagaworld-data.js';
import {rng} from './bagaworld-fight.js';

export const WS=112,SEED=20261116;
export const T={grass:0,dark:1,sand:2,water:3,path:4,stone:5,flowers:6,wood:7,moss:8};
export const P={none:0,tree:1,pine:2,palm:3,rock:4,bush:5,shroom:6,fence:7,wall:8,lamp:9,deco:10,barrel:11,throne:12,fountain:13,statue:14,sign:15,stump:16,cave:17};
const WALK_PROPS=new Set([P.none,P.deco]);

function noise(seed){const h=(x,z)=>{let n=(x*374761393+z*668265263+seed*1442695041)|0;n=(n^(n>>>13))*1274126177|0;return((n^(n>>>16))>>>0)/4294967296};
 const s=t=>t*t*(3-2*t);return (x,z)=>{const x0=Math.floor(x),z0=Math.floor(z),fx=s(x-x0),fz=s(z-z0);
  const a=h(x0,z0),b=h(x0+1,z0),c=h(x0,z0+1),d=h(x0+1,z0+1);return a+(b-a)*fx+(c-a)*fz+(a-b-c+d)*fx*fz}}

export function zoneAt(x,z){const cx=WS/2,cz=WS/2,dx=x-cx,dz=z-cz;
 if(Math.abs(dx)<=15&&Math.abs(dz)<=15)return 'town';
 if(z>WS-14&&Math.abs(dx)<12)return 'throne';
 if(x<34&&Math.abs(dz)<44)return 'beach';
 if(x>WS-34&&Math.abs(dz)<44)return 'woods';
 if(z<cz)return 'hills';return 'meadow'}

export function genWorld(seed=SEED){const N=WS,h=new Uint8Array(N*N),type=new Uint8Array(N*N),prop=new Uint8Array(N*N),r=rng(seed),n1=noise(seed),n2=noise(seed+7);
 const I=(x,z)=>z*N+x,cx=N/2|0,cz=N/2|0;const W={N,h,type,prop,buildings:[],npcs:[],zaaps:[],spawns:[],signs:[]};
 // relief et sols par zone
 for(let z=0;z<N;z++)for(let x=0;x<N;x++){const zn=zoneAt(x,z),k=I(x,z),nv=n1(x/9,z/9)*.7+n2(x/4,z/4)*.3;let hh=1,ty=T.grass;
  if(zn==='hills'){hh=1+Math.floor(Math.max(0,(cz-15-z))/9)+Math.floor(nv*2.2);ty=nv>.62?T.moss:T.grass}
  else if(zn==='woods'){hh=1+Math.floor(nv*1.6);ty=T.dark}
  else if(zn==='beach'){const sea=x<9+Math.floor(n2(0,z/7)*5);hh=sea?0:1;ty=sea?T.water:(x<22?T.sand:T.grass)}
  else if(zn==='meadow'||zn==='throne'){hh=1+(nv>.72?1:0);ty=nv<.25?T.flowers:T.grass}
  h[k]=hh;type[k]=ty}
 // relief adouci : jamais plus d'une marche entre deux cases voisines (tout reste accessible à pied)
 for(let pass=0;pass<8;pass++)for(let z=0;z<N;z++)for(let x=0;x<N;x++){const k=I(x,z);let m=99;for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,zz=z+dz;if(xx<0||zz<0||xx>=N||zz>=N)continue;const hk=h[I(xx,zz)];if(type[I(xx,zz)]!==T.water)m=Math.min(m,hk)}if(h[k]>m+1)h[k]=m+1}
 // rivière : traverse la prairie d'est en ouest jusqu'à la mer (deux ponts)
 for(let x=0;x<N;x++){const z=Math.round(cz+26+Math.sin(x/9)*3);for(let d=0;d<2;d++){const k=I(x,z+d);if(zoneAt(x,z)!=='town'){h[k]=0;type[k]=T.water}}}
 // Bagatown : place pavée, chemins, bâtiments, PNJ
 for(let z=cz-15;z<=cz+15;z++)for(let x=cx-15;x<=cx+15;x++){const k=I(x,z);h[k]=1;type[k]=Math.abs(x-cx)<=5&&Math.abs(z-cz)<=5?T.stone:T.grass}
 const road=(x0,z0,x1,z1,w=1)=>{const sx=Math.sign(x1-x0),sz=Math.sign(z1-z0);let x=x0,z=z0;for(let i=0;i<400;i++){for(let a=-w;a<=w;a++)for(let b=-w;b<=w;b++){const xx=x+a,zz=z+b;if(xx<0||zz<0||xx>=N||zz>=N)continue;const k=I(xx,zz);if(type[k]===T.water&&h[k]===0){type[k]=T.wood;h[k]=1}else if(type[k]!==T.stone)type[k]=T.path;prop[k]=P.none}
   if(x===x1&&z===z1)break;if(x!==x1&&(z===z1||r()<.5))x+=sx;else z+=sz}};
 road(cx,cz,cx,N-6);road(cx,cz,cx,4);road(cx,cz,5,cz);road(cx,cz,N-5,cz);road(cx,cz+30,20,cz+34);road(cx,cz-24,N-20,cz-30);
 const building=(kind,x0,z0,w,d,hgt,roof,wallc,npc,sign)=>{for(let z=z0;z<z0+d;z++)for(let x=x0;x<x0+w;x++){const k=I(x,z);prop[k]=P.wall;type[k]=T.stone}
  const door={x:x0+(w>>1),z:z0+d};W.buildings.push({kind,x0,z0,w,d,h:hgt,roof,wall:wallc,door,sign});if(npc)W.npcs.push({id:npc,x:door.x+.5,z:door.z+1.5,yaw:0});
  for(let x=x0-1;x<=x0+w;x++){const k=I(x,z0+d);if(prop[k]!==P.wall)type[k]=T.stone}};
 building('mairie',cx-4,cz-14,8,6,4,'#3b4a7a','#efe3c8','maire',['Mairie','Town Hall']);
 building('taverne',cx+8,cz-4,6,5,3,'#b5482f','#e9d2a8','gege',['Taverne du Mouton Ivre','Drunken Sheep Inn']);
 building('forge',cx-14,cz-4,6,5,3,'#4a4a52','#cfc2ad','momo',['Forge de Momo','Momo’s Forge']);
 building('boutique',cx-12,cz+6,6,5,3,'#a86fb5','#f2e4d0','mamie',['Potions de Mamie','Granny’s Potions']);
 building('ecole',cx+7,cz+6,7,5,3,'#2f6b4a','#e6e0cf','prof',['École des Classes','Class School']);
 building('maison',cx+7,cz-14,5,4,3,'#7a5236','#e9dcc4',null,null);building('maison',cx-12,cz-14,5,4,3,'#8a3b3b','#efe2c9',null,null);
 // garde à l'entrée sud, fontaine Bagaap au centre, statue du Bagaphénix (on y revient après une défaite)
 W.npcs.push({id:'robert',x:cx+2.5,z:cz+15.5,yaw:0});
 for(const [dx,dz] of [[0,0],[1,0],[0,1],[1,1]])prop[I(cx+dx-1,cz+dz-1)]=P.fountain;W.zaaps.push({id:'town',x:cx,z:cz+1.6});
 prop[I(cx+4,cz+4)]=P.statue;W.phoenix={x:cx+4.5,z:cz+5.8};
 for(const [x,z] of [[cx-5,cz-5],[cx+5,cz-5],[cx-5,cz+5],[cx+5,cz+5],[cx-2,cz+12],[cx+2,cz-9]])prop[I(x,z)]=P.lamp;
 for(const [x,z] of [[cx+14,cz-1],[cx+14,cz+2],[cx-15,cz+1],[cx-9,cz+11]])prop[I(x,z)]=P.barrel;
 // palissade autour de la ville, ouverte aux quatre portes
 for(let i=-15;i<=15;i++)for(const [x,z] of [[cx+i,cz-15],[cx+i,cz+15],[cx-15,cz+i],[cx+15,cz+i]]){const k=I(x,z);if(Math.abs(i)>2&&prop[k]===P.none&&type[k]!==T.path)prop[k]=P.fence}
 // végétation et rochers selon la zone (jamais sur les chemins)
 for(let z=1;z<N-1;z++)for(let x=1;x<N-1;x++){const k=I(x,z),zn=zoneAt(x,z);if(prop[k]||type[k]===T.path||type[k]===T.stone||type[k]===T.water||type[k]===T.wood)continue;const v=r();
  if(zn==='town'){if(v<.02&&type[k]===T.grass)prop[k]=P.bush;continue}
  if(zn==='woods')prop[k]=v<.16?P.tree:v<.21?P.shroom:v<.24?P.bush:v<.25?P.stump:P.none;
  else if(zn==='hills')prop[k]=v<.08?P.pine:v<.13?P.rock:v<.15?P.bush:P.none;
  else if(zn==='beach')prop[k]=type[k]===T.sand?(v<.03?P.palm:v<.045?P.rock:P.none):(v<.05?P.tree:v<.07?P.bush:P.none);
  else prop[k]=v<.035?P.tree:v<.06?P.bush:v<.08?P.deco:v<.09?P.rock:P.none}
 // trône du Mouton Royal
 const tz=N-7;for(let z=tz-4;z<=tz+3;z++)for(let x=cx-5;x<=cx+5;x++){const k=I(x,z);type[k]=T.stone;prop[k]=P.none;h[k]=1}prop[I(cx,tz-3)]=P.throne;W.throne={x:cx+.5,z:tz-1.5};
 // Bagaaps (téléporteurs) dans chaque zone, et points d'apparition des monstres
 W.zaaps.push({id:'meadow',x:cx+3.5,z:cz+34.5},{id:'beach',x:24.5,z:cz+.5},{id:'woods',x:N-24.5,z:cz+.5},{id:'hills',x:cx+3.5,z:20.5});
 for(const zp of W.zaaps.slice(1)){const fx=Math.floor(zp.x),fz=Math.floor(zp.z);for(let dz=-2;dz<=3;dz++)for(let dx=-2;dx<=2;dx++){const kk=I(fx+dx,fz+dz);if(prop[kk]!==P.wall)prop[kk]=P.none;if(type[kk]===T.water){type[kk]=T.wood;h[kk]=1}}
  const k=I(fx,fz);prop[k]=P.fountain;h[k]=h[k]||1;zp.z+=1.2}
 // maîtres de métier à côté du Bagaap de leur zone
 for(const [zid,npc] of [['meadow','tata'],['beach','marcel'],['woods','josette'],['hills','leon']]){const zp=W.zaaps.find(q=>q.id===zid),fx=Math.floor(zp.x),fz=Math.floor(zp.z-1.2);W.npcs.push({id:npc,x:fx+2.5,z:fz-1.5,yaw:0})}
 // entrée de la Grotte du Champidou, au fond du bois (gardée par Bernard)
 {const gx=N-11,gz=cz+14;for(let dz=-3;dz<=4;dz++)for(let dx=-3;dx<=3;dx++){const k=I(gx+dx,gz+dz);prop[k]=P.none;if(type[k]===T.water){type[k]=T.dark}h[k]=h[I(gx,gz)]}
  road(gx,gz+2,N-24,cz);prop[I(gx,gz)]=P.cave;for(const dx of [-1,1])prop[I(gx+dx,gz)]=P.rock;W.cave={x:gx+.5,z:gz+1.6};W.npcs.push({id:'bernard',x:gx+2.5,z:gz+2.5,yaw:0})}
 const want={meadow:16,beach:9,woods:12,hills:12};for(const zn in want){let tries=0,got=0;while(got<want[zn]&&tries++<4000){const x=2+Math.floor(r()*(N-4)),z=2+Math.floor(r()*(N-4));
  if(zoneAt(x,z)!==zn||!walkable(W,x,z)||W.spawns.some(s=>Math.hypot(s.x-x,s.z-z)<7)||W.zaaps.some(s=>Math.hypot(s.x-x,s.z-z)<6))continue;W.spawns.push({zone:zn,x:x+.5,z:z+.5});got++}}
 W.spawns.push({zone:'throne',x:cx+.5,z:tz+.5});
 W.start={x:cx+.5,z:cz+8.5};return W}

export const tileH=(W,x,z)=>{x=Math.floor(x);z=Math.floor(z);return x<0||z<0||x>=W.N||z>=W.N?0:W.h[z*W.N+x]};
export function walkable(W,x,z){x=Math.floor(x);z=Math.floor(z);if(x<0||z<0||x>=W.N||z>=W.N)return false;const k=z*W.N+x;return W.type[k]!==T.water&&WALK_PROPS.has(W.prop[k])}
// passage d'une case à une voisine : marche d'une hauteur au plus
export const canStep=(W,x0,z0,x1,z1)=>walkable(W,x1,z1)&&Math.abs(tileH(W,x0,z0)-tileH(W,x1,z1))<=1;

// chemin (A*) entre deux cases, en 8 directions sans couper les coins
export function findPath(W,sx,sz,tx,tz,max=4000){sx=Math.floor(sx);sz=Math.floor(sz);tx=Math.floor(tx);tz=Math.floor(tz);if(!walkable(W,tx,tz))return null;
 const N=W.N,key=(x,z)=>z*N+x,open=[[sx,sz]],g=new Map([[key(sx,sz),0]]),prev=new Map(),hh=(x,z)=>Math.hypot(tx-x,tz-z);const f=new Map([[key(sx,sz),hh(sx,sz)]]);const closed=new Set();let n=0;
 while(open.length&&n++<max){let bi=0;for(let i=1;i<open.length;i++)if(f.get(key(...open[i]))<f.get(key(...open[bi])))bi=i;const [x,z]=open.splice(bi,1)[0],kk=key(x,z);if(closed.has(kk))continue;closed.add(kk);
  if(x===tx&&z===tz){const out=[];let k=kk;while(k!==key(sx,sz)){out.unshift([k%N,Math.floor(k/N)]);k=prev.get(k)}return out}
  for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dz)continue;const nx=x+dx,nz=z+dz;if(!canStep(W,x,z,nx,nz))continue;if(dx&&dz&&(!canStep(W,x,z,x+dx,z)||!canStep(W,x,z,x,z+dz)))continue;
   const ng=g.get(kk)+(dx&&dz?1.414:1),k2=key(nx,nz);if(ng<(g.get(k2)??Infinity)){g.set(k2,ng);f.set(k2,ng+hh(nx,nz));prev.set(k2,kk);open.push([nx,nz])}}}
 return null}

// ---- groupes de monstres qui se promènent autour de leur point d'apparition
export function spawnGroups(W,seed=SEED){const r=rng(seed+3);return W.spawns.map((s,i)=>makeGroup(s,i,r))}
export function makeGroup(s,i,r){const pool=SPAWNS[s.zone],boss=s.zone==='throne';const n=boss?1:1+Math.floor(r()*Math.min(4,1+i%4));const members=[];
 for(let k=0;k<n;k++){const id=pool[Math.floor(r()*pool.length)],[a,b]=MOBS[id].lvl;members.push([id,a+Math.floor(r()*(b-a+1))])}
 if(boss){members.push(['moutoufou',6],['moutoufou',6])}
 return {gid:'g'+i,spawn:i,zone:s.zone,home:{x:s.x,z:s.z},x:s.x,z:s.z,tx:s.x,tz:s.z,wait:r()*4,members,dead:0,yaw:0,aggro:members.some(([m])=>MOBS[m].aggro)}}
export function groupLevel(g){return g.members.reduce((s,[,l])=>s+l,0)}
export function tickGroups(W,groups,dt,r){for(const g of groups){if(g.dead>0){g.dead-=dt;if(g.dead<=0){Object.assign(g,makeGroup(W.spawns[g.spawn],g.spawn,r),{gid:g.gid})}continue}if(g.busy)continue;
  g.wait-=dt;if(g.wait<=0){g.wait=3+r()*5;for(let t=0;t<8;t++){const x=g.home.x+(r()-.5)*8,z=g.home.z+(r()-.5)*8;if(walkable(W,x,z)&&zoneAt(Math.floor(x),Math.floor(z))===g.zone){g.tx=x;g.tz=z;break}}}
  const dx=g.tx-g.x,dz=g.tz-g.z,d=Math.hypot(dx,dz);if(d>.05){const s=Math.min(d,dt*1.1),nx=g.x+dx/d*s,nz=g.z+dz/d*s;if(canStep(W,g.x,g.z,nx,nz)){g.x=nx;g.z=nz;g.yaw=Math.atan2(-dx,-dz)}else{g.tx=g.x;g.tz=g.z}}}}

// ---- grille de combat découpée autour du lieu de la rencontre
export const AW=13,AH=13;
export function arenaAt(W,px,pz,gx,gz){const ox=Math.round((px+gx)/2-AW/2),oz=Math.round((pz+gz)/2-AH/2),h0=tileH(W,(px+gx)/2,(pz+gz)/2);
 const grid=new Array(AW*AH).fill(2),hs=new Array(AW*AH).fill(0);
 for(let y=0;y<AH;y++)for(let x=0;x<AW;x++){const wx=ox+x,wz=oz+y,i=y*AW+x;if(wx<0||wz<0||wx>=W.N||wz>=W.N)continue;const k=wz*W.N+wx,hh=W.h[k];hs[i]=hh;
  if(W.type[k]===T.water&&hh===0)grid[i]=2;else if(Math.abs(hh-h0)>=2)grid[i]=2;else grid[i]=WALK_PROPS.has(W.prop[k])?0:1}
 // on garde la partie reliée au joueur ; le reste devient du vide
 const ip=[Math.max(0,Math.min(AW-1,Math.floor(px)-ox)),Math.max(0,Math.min(AH-1,Math.floor(pz)-oz))];grid[ip[1]*AW+ip[0]]=0;
 const seen=new Set([ip[0]+ip[1]*AW]),q=[ip];while(q.length){const [x,y]=q.pop();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+ny*AW;if(nx<0||ny<0||nx>=AW||ny>=AH||seen.has(k)||grid[k]!==0)continue;seen.add(k);q.push([nx,ny])}}
 for(let i=0;i<grid.length;i++)if(grid[i]===0&&!seen.has(i))grid[i]=2;
 const freeCells=[...seen].map(k=>[k%AW,Math.floor(k/AW)]);
 // trop peu de place (forêt dense, falaise) : arène dégagée
 if(freeCells.length<36){for(let i=0;i<grid.length;i++)grid[i]=(i%AW===0||i%AW===AW-1||i<AW||i>=AW*(AH-1))?2:0;return arenaStarts({w:AW,h:AH,grid,hs:hs.map(()=>h0),ox,oz,h0},[AW>>1,AH-3],[AW>>1,2])}
 const ig=[Math.max(0,Math.min(AW-1,Math.floor(gx)-ox)),Math.max(0,Math.min(AH-1,Math.floor(gz)-oz))];
 return arenaStarts({w:AW,h:AH,grid,hs,ox,oz,h0},ip,ig)}
function arenaStarts(A,ip,ig){const free=[];for(let i=0;i<A.grid.length;i++)if(A.grid[i]===0)free.push([i%A.w,Math.floor(i/A.w)]);
 const d=(c,p)=>Math.abs(c[0]-p[0])+Math.abs(c[1]-p[1]);
 // si les deux camps sont trop près, on écarte le point des monstres
 let g=ig;if(d(ip,g)<5)g=free.slice().sort((a,b)=>d(b,ip)-d(a,ip))[0];
 const mine=free.filter(c=>d(c,ip)<d(c,g)-2).sort((a,b)=>d(a,ip)-d(b,ip)).slice(0,6),theirs=free.filter(c=>d(c,g)<d(c,ip)-2&&!mine.some(m=>m[0]===c[0]&&m[1]===c[1])).sort((a,b)=>d(a,g)-d(b,g)).slice(0,8);
 A.start=[mine.length?mine:[ip],theirs.length?theirs:[g]];return A}

// ---- donjon : arène d'une salle, posée hors du monde (le rendu dessine la grotte à la place du terrain)
export function dungeonArena(room){const R=DUNGEON.rooms[room],grid=[],start=[[],[]];
 R.map.forEach((line,y)=>[...line].forEach((ch,x)=>{grid.push(ch==='#'?1:ch==='~'?2:0);if(ch==='A')start[0].push([x,y]);if(ch==='B')start[1].push([x,y])}));
 // assez de cases de départ pour 4 joueurs et tous les monstres
 for(const [t,y0] of [[0,10],[1,1]])for(let y=y0;start[t].length<6&&y<y0+3;y++)for(let x=1;x<12&&start[t].length<6;x++)if(grid[y*13+x]===0&&!start[t].some(c=>c[0]===x&&c[1]===y))start[t].push([x,y]);
 return {w:13,h:13,grid,hs:grid.map(()=>0),ox:400+room*30,oz:400,h0:0,start,dungeon:true,room}}
// ce que donne une case touchée (décor récoltable ou eau de pêche), sinon null
export function harvestAt(W,x,z){x=Math.floor(x);z=Math.floor(z);if(x<0||z<0||x>=W.N||z>=W.N)return null;const k=z*W.N+x,pr=W.prop[k],zn=zoneAt(x,z);
 if(W.type[k]===T.water&&W.h[k]===0)return {...HARVEST[zn==='beach'?'sea':'river'],k,x,z,fish:true};
 const name=pr===P.tree?'tree':pr===P.pine?'pine':pr===P.palm?'palm':pr===P.rock?(zn==='hills'?'rock_hills':'rock'):pr===P.bush?'bush':pr===P.deco?'deco':pr===P.shroom?'shroom':null;
 return name&&zn!=='town'?{...HARVEST[name],k,x,z,prop:pr}:null}
