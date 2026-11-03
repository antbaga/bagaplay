// Bataille navale : grille 10×10, flotte de 5 bateaux (5, 4, 3, 3, 2 cases), tirs à tour de rôle.
// Un bateau : {len, r, c, dir:'h'|'v'}. Les bateaux ne se chevauchent pas (ils peuvent se toucher).
export const SIZE=10,FLEET=[5,4,3,3,2];
export const SHIP_NAMES={5:'Porte-avions',4:'Croiseur',3:'Contre-torpilleur',2:'Torpilleur'};
export const shipCells=s=>Array.from({length:s.len},(_,k)=>(s.r+(s.dir==='v'?k:0))*SIZE+s.c+(s.dir==='h'?k:0));
export const inBounds=s=>s.r>=0&&s.c>=0&&(s.dir==='h'?s.c+s.len<=SIZE&&s.r<SIZE:s.r+s.len<=SIZE&&s.c<SIZE);
export function validFleet(f){if(!Array.isArray(f)||f.length!==FLEET.length)return false;
 if(f.map(s=>s.len).sort().join()!==FLEET.slice().sort().join())return false;const used=new Set();
 for(const s of f){if(!['h','v'].includes(s.dir)||!Number.isInteger(s.r)||!Number.isInteger(s.c)||!inBounds(s))return false;for(const i of shipCells(s)){if(used.has(i))return false;used.add(i)}}return true}
export function randomFleet(rand=Math.random){for(;;){const f=[],used=new Set();let ok=true;
 for(const len of FLEET){let placed=false;for(let t=0;t<200&&!placed;t++){const s={len,dir:rand()<.5?'h':'v',r:Math.floor(rand()*SIZE),c:Math.floor(rand()*SIZE)};if(!inBounds(s))continue;const cs=shipCells(s);if(cs.some(i=>used.has(i)))continue;cs.forEach(i=>used.add(i));f.push(s);placed=true}if(!placed){ok=false;break}}
 if(ok)return f}}
// Résultat d'un tir sur une flotte, connaissant les tirs déjà faits : {hit, sunk (bateau coulé ou null), won}
export function fire(fleet,shots,i){const all=shots.concat(i);const ship=fleet.find(s=>shipCells(s).includes(i));
 if(!ship)return {hit:false,sunk:null,won:false};const sunk=shipCells(ship).every(x=>all.includes(x))?ship:null;
 const won=fleet.every(s=>shipCells(s).every(x=>all.includes(x)));return {hit:true,sunk,won}}
// État local (contre l'ordinateur ou sur le même téléphone)
export const initial=()=>({phase:'place',placed:{},shots:{w:[],b:[]},turn:'w'});

// ---- ordinateur. shots : [{i,hit,sunk}] déjà tirés sur la flotte adverse.
// 0 : au hasard ; 1 : chasse puis vise autour des touches ; 2 : carte de probabilités (où peuvent encore être les bateaux).
export function aiShot(shots,level=1,rand=Math.random){
 const shot=new Map(shots.map(s=>[s.i,s]));const free=[...Array(SIZE*SIZE).keys()].filter(i=>!shot.has(i));
 const pick=a=>a[Math.floor(rand()*a.length)];
 if(level===0)return pick(free);
 // touches pas encore coulées
 const sunkCells=new Set(shots.filter(s=>s.sunk).flatMap(s=>shipCells(s.sunk)));
 const open=shots.filter(s=>s.hit&&!sunkCells.has(s.i)).map(s=>s.i);
 const nb=i=>{const r=Math.floor(i/SIZE),c=i%SIZE;return [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].filter(([a,b])=>a>=0&&b>=0&&a<SIZE&&b<SIZE).map(([a,b])=>a*SIZE+b)};
 if(level===1){if(open.length){
   if(open.length>=2){const rs=new Set(open.map(i=>Math.floor(i/SIZE))),line=rs.size===1?'h':'v';const ends=open.flatMap(nb).filter(i=>!shot.has(i)&&(line==='h'?Math.floor(i/SIZE)===Math.floor(open[0]/SIZE):i%SIZE===open[0]%SIZE));if(ends.length)return pick(ends)}
   const around=[...new Set(open.flatMap(nb))].filter(i=>!shot.has(i));if(around.length)return pick(around)}
  const parity=free.filter(i=>(Math.floor(i/SIZE)+i%SIZE)%2===0);return pick(parity.length?parity:free)}
 // niveau 2 : densité de probabilité
 const left=FLEET.slice();for(const s of shots.filter(s=>s.sunk)){const k=left.indexOf(s.sunk.len);if(k>=0)left.splice(k,1)}
 const score=new Array(SIZE*SIZE).fill(0),openSet=new Set(open);
 for(const len of left)for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)for(const dir of ['h','v']){const s={len,r,c,dir};if(!inBounds(s))continue;const cs=shipCells(s);
  if(cs.some(i=>shot.has(i)&&(!shot.get(i).hit||sunkCells.has(i))))continue;const hits=cs.filter(i=>openSet.has(i)).length;for(const i of cs)if(!shot.has(i))score[i]+=1+hits*20}
 let best=-1,list=[];for(const i of free){if(score[i]>best){best=score[i];list=[i]}else if(score[i]===best)list.push(i)}return pick(list.length?list:free)}
