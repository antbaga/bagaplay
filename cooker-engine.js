// BagaCooker : moteur du restaurant (sans DOM), testable sous Node.
// Une cuisine en grille ; le chef se déplace librement (cercle contre les plans de travail), regarde dans une direction
// et agit sur la case devant lui : prendre / poser (A), couper / laver / sprint (B maintenu ou appuyé).
// Ingrédients : crus → coupés (planche) → cuits (poêle) ou frits (friteuse) → brûlés si on traîne. On monte les assiettes,
// on les sert au passe ; les assiettes sales reviennent et se lavent à l'évier.

export const SPEED=3.4,DASH=2.1,RAD=.3,CHOP=1.6,WASH=2.2,COOK=7,BURN=7,FRY=5,FRY_BURN=7,RETURN=6;
// ingrédients : état prêt à dresser
export const ING={bun:{ready:'raw'},cheese:{ready:'raw'},lettuce:{ready:'chop',chop:1},tomato:{ready:'chop',chop:1},potato:{ready:'fry',chop:1},steak:{ready:'cook'}};
export const CRATE={b:'bun',c:'cheese',l:'lettuce',t:'tomato',p:'potato',m:'steak'};
export const RECIPES={
 salade:{parts:['lettuce','tomato'],pts:30,life:70,fr:'Salade du chef',en:'Chef’s salad'},
 burger:{parts:['bun','steak'],pts:40,life:75,fr:'Burger',en:'Burger'},
 cheese:{parts:['bun','steak','cheese'],pts:50,life:80,fr:'Cheeseburger',en:'Cheeseburger'},
 frites:{parts:['potato'],pts:30,life:65,fr:'Cornet de frites',en:'Fries'},
 steakfrites:{parts:['steak','potato'],pts:55,life:85,fr:'Steak-frites',en:'Steak and fries'},
 complet:{parts:['bun','steak','lettuce','tomato'],pts:70,life:95,fr:'Burger complet',en:'Deluxe burger'},
 royal:{parts:['bun','steak','cheese','lettuce','tomato'],pts:90,life:105,fr:'Le Royal Baga',en:'The Royal Baga'}};
// cases : '.' sol, '@' départ, '#' plan de travail, caisses b c l t p m, K planche, S poêle, F friteuse, W évier, D assiettes, X poubelle, O passe
export const LEVELS=[
 {id:1,fr:'Le food truck',en:'The food truck',time:150,recipes:['salade'],wash:false,plates:3,every:16,stars:[90,180,260],
  map:['##lK#Kt##',
       '#.......#',
       'D.......O',
       '#..###..#',
       '#.......#',
       '#...@...X',
       '#########']},
 {id:2,fr:'Le Bistrot du Port',en:'The Harbour Bistro',time:165,recipes:['burger','salade'],wash:false,plates:4,every:18,stars:[110,230,330],
  map:['#bmSS#lt#',
       '#.......K',
       'D...#...#',
       '#...#...O',
       'X.......K',
       '#...@...#',
       '#########']},
 {id:3,fr:'Chez Momo',en:'Momo’s Diner',time:180,recipes:['burger','cheese'],wash:true,plates:3,every:19,stars:[140,280,400],
  map:['#bcmSS#K#',
       '#.......#',
       'D...##..O',
       '#.......#',
       'W..@....X',
       '#.......#',
       '##K###S##']},
 {id:4,fr:'La Friterie de Noailles',en:'The Noailles Chip Shop',time:180,recipes:['frites','steakfrites'],wash:true,plates:3,every:18,stars:[150,300,430],
  map:['#pKK#FF##',
       '#.......#',
       'W..#.#..O',
       '#..#.#..#',
       'D.......X',
       '#...@...S',
       '##m##S###']},
 {id:5,fr:'Le Grand Rush',en:'The Big Rush',time:200,recipes:['complet','cheese','salade','steakfrites'],wash:true,plates:4,every:17,stars:[200,400,580],
  map:['#lt#bc#m#',
       'K.......S',
       'K..##...S',
       'D..##...O',
       'W.......F',
       '#..@....F',
       '#X##p####']},
 {id:6,fr:'Le Palace de la Corniche',en:'The Corniche Palace',time:220,recipes:['royal','complet','steakfrites','cheese'],wash:true,plates:4,every:17,stars:[240,480,700],
  map:['#bcm#ltp#',
       'K.......S',
       'K.#...#.S',
       'D.#...#.O',
       'W...@...F',
       'W.......F',
       '##X###KK#']}];

export const isFloor=ch=>ch==='.'||ch==='@';
export const ready=it=>it&&ING[it.k]&&it.st===ING[it.k].ready;
const key=parts=>[...parts].sort().join('+');
export function rng(seed){let a=seed>>>0||1;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

export function newGame(n,seed=Date.now()){const L=LEVELS[n-1],H=L.map.length,W=L.map[0].length;let id=1;
 const tiles=L.map.map((row,z)=>[...row].map((ch,x)=>({ch,x,z,item:null,prog:0,clean:ch==='D'?L.plates:0,dirty:0})));
 let sx=1,sz=1;tiles.forEach(r=>r.forEach(t=>{if(t.ch==='@'){sx=t.x;sz=t.z}}));
 const S={n,L,W,H,tiles,t:0,left:L.time,score:0,served:0,lost:0,combo:0,rnd:rng(seed),nextId:()=>id++,
  p:{x:sx+.5,z:sz+.5,dx:0,dz:-1,hold:null,dash:0,dashCd:0,work:null,walk:0,moving:false},
  orders:[],orderT:2,returns:[],ev:[],over:false,warned:{}};
 return S}
export const tileAt=(S,x,z)=>x>=0&&z>=0&&x<S.W&&z<S.H?S.tiles[z][x]:null;
export const solid=(S,x,z)=>{const t=tileAt(S,x,z);return !t||!isFloor(t.ch)};
// case devant le chef (direction ramenée à l'axe dominant)
export function front(S){const p=S.p,ax=Math.abs(p.dx)>=Math.abs(p.dz);const sx=ax?Math.sign(p.dx):0,sz=ax?0:Math.sign(p.dz);
 return tileAt(S,Math.floor(p.x+sx*.75),Math.floor(p.z+sz*.75))}

// ---- déplacement avec collisions (cercle contre cases pleines), axe par axe
function collide(S,x,z){for(let tz=Math.floor(z-RAD);tz<=Math.floor(z+RAD);tz++)for(let tx=Math.floor(x-RAD);tx<=Math.floor(x+RAD);tx++){if(!solid(S,tx,tz))continue;
  const cx=Math.max(tx,Math.min(x,tx+1)),cz=Math.max(tz,Math.min(z,tz+1));if((x-cx)**2+(z-cz)**2<RAD*RAD-1e-6)return true}return false}
function move(S,vx,vz,dt){const p=S.p;const nx=p.x+vx*dt;if(!collide(S,nx,p.z))p.x=nx;const nz=p.z+vz*dt;if(!collide(S,p.x,nz))p.z=nz}

// ---- prendre / poser
function newItem(S,k,st='raw'){return {id:S.nextId(),k,st,heat:0}}
export const plate=(S,dirty=false)=>({id:S.nextId(),k:'plate',dirty,parts:[]});
function addTo(pl,it){if(!pl||pl.k!=='plate'||pl.dirty||!ready(it)||pl.parts.includes(it.k))return false;pl.parts.push(it.k);return true}
export function interact(S){const p=S.p,t=front(S);if(!t)return;const h=p.hold,ev=e=>S.ev.push({...e,x:t.x,z:t.z});
 if(!h){
  if(CRATE[t.ch]){p.hold=newItem(S,CRATE[t.ch]);return ev({t:'pick',k:p.hold.k,crate:1})}
  if(t.ch==='D'){if(t.clean>0){t.clean--;p.hold=plate(S)}else if(t.dirty>0){t.dirty--;p.hold=plate(S,true)}else return ev({t:'nothing'});return ev({t:'pick',k:'plate'})}
  if(t.ch==='W'&&t.clean>0){t.clean--;p.hold=plate(S);return ev({t:'pick',k:'plate'})}
  if(t.item){p.hold=t.item;t.item=null;t.prog=0;return ev({t:'pick',k:p.hold.k})}
  return ev({t:'nothing'})}
 // poubelle : on vide l'assiette, on jette le reste
 if(t.ch==='X'){if(h.k==='plate'){if(!h.parts.length)return ev({t:'nothing'});h.parts=[]}else p.hold=null;return ev({t:'trash'})}
 if(t.ch==='O'){if(h.k!=='plate'||h.dirty||!h.parts.length)return ev({t:'needPlate'});return serve(S,t)}
 if(t.ch==='W'){if(h.k==='plate'&&h.dirty){t.dirty++;p.hold=null;return ev({t:'put',k:'dirty'})}return ev({t:'nothing'})}
 if(t.ch==='D'){if(h.k==='plate'&&!h.parts.length){h.dirty?t.dirty++:t.clean++;p.hold=null;return ev({t:'put',k:'plate'})}return ev({t:'nothing'})}
 if(t.item){
  if(h.k==='plate'&&addTo(h,t.item)){t.item=null;t.prog=0;return ev({t:'plated',k:h.parts.at(-1)})}
  if(t.item.k==='plate'&&addTo(t.item,h)){p.hold=null;return ev({t:'plated',k:t.item.parts.at(-1)})}
  return ev({t:'full'})}
 const ok=t.ch==='#'||t.ch==='K'||(t.ch==='S'&&h.k==='steak')||(t.ch==='F'&&h.k==='potato'&&h.st!=='raw');
 if(!ok)return ev({t:t.ch==='F'&&h.k==='potato'?'chopFirst':'nothing'});
 t.item=h;t.prog=0;p.hold=null;return ev({t:'put',k:h.k,on:t.ch})}
function serve(S,t){const h=S.p.hold,k=key(h.parts);let best=-1;
 S.orders.forEach((o,i)=>{if(key(RECIPES[o.r].parts)===k&&(best<0||o.left<S.orders[best].left))best=i});
 if(best<0){S.ev.push({t:'wrong',x:t.x,z:t.z});return}
 const o=S.orders[best],R=RECIPES[o.r],tip=Math.round(R.pts*.6*Math.max(0,o.left/o.life));S.combo++;const bonus=S.combo>=3?10:0;
 S.score+=R.pts+tip+bonus;S.served++;S.orders.splice(best,1);S.p.hold=null;S.returns.push({t:RETURN});
 S.ev.push({t:'serve',r:o.r,pts:R.pts,tip,bonus,who:o.who,x:t.x,z:t.z})}

// ---- action maintenue (couper, laver) ; appuyée sans rien à faire : sprint
export function workable(S){const t=front(S),h=S.p.hold;if(!t||h)return null;
 if(t.ch==='K'&&t.item&&ING[t.item.k]?.chop&&t.item.st==='raw')return 'chop';
 if(t.ch==='W'&&t.dirty>0)return 'wash';return null}

// ---- commandes
const WHO=['Gérard','Josiane','Kevin','Fanny','Momo','Tatie Josette','Jean-Mi','Nabil','Sandrine','Le Grand Robert','Mamie Lou','Enzo'];
function spawnOrder(S){const r=S.L.recipes[Math.floor(S.rnd()*S.L.recipes.length)],R=RECIPES[r];
 const o={id:S.nextId(),r,life:R.life,left:R.life,who:WHO[Math.floor(S.rnd()*WHO.length)]};S.orders.push(o);S.ev.push({t:'order',r,who:o.who})}

// input : {mx,mz} joystick (-1..1), a : appui prendre/poser, b : bouton action maintenu, bTap : appui action
export function step(S,dt,inp={}){if(S.over)return;S.t+=dt;S.left-=dt;const p=S.p;
 if(S.left<=0){S.left=0;S.over=true;S.ev.push({t:'over'});return}
 // déplacement
 const mx=inp.mx||0,mz=inp.mz||0,m=Math.hypot(mx,mz);p.dashCd=Math.max(0,p.dashCd-dt);p.dash=Math.max(0,p.dash-dt);
 const w=workable(S);
 if(inp.bTap&&!w&&p.dashCd<=0){p.dash=.22;p.dashCd=.8;S.ev.push({t:'dash'})}
 const working=inp.b&&w&&m<.25;p.work=working?w:null;
 if(m>.15&&!working){const k=Math.min(1,m),sp=SPEED*(p.dash>0?DASH:1);p.dx=mx/m;p.dz=mz/m;move(S,p.dx*k*sp,p.dz*k*sp,dt);p.moving=true;p.walk+=dt*sp*k*2.4}
 else if(p.dash>0){move(S,p.dx*SPEED*DASH,p.dz*SPEED*DASH,dt);p.moving=true;p.walk+=dt*8}else p.moving=false;
 if(inp.a)interact(S);
 // couper / laver
 if(working){const t=front(S);
  if(w==='chop'){t.prog+=dt/CHOP;if(t.prog>=1){t.item.st='chop';t.prog=0;S.ev.push({t:'chopped',k:t.item.k,x:t.x,z:t.z})}}
  else{t.prog+=dt/WASH;if(t.prog>=1){t.dirty--;t.clean++;t.prog=0;S.ev.push({t:'washed',x:t.x,z:t.z})}}}
 // cuisson automatique (poêle, friteuse)
 for(const row of S.tiles)for(const t of row){const it=t.item;if(!it)continue;
  if(t.ch==='S'&&it.k==='steak'&&it.st!=='burnt'){it.heat+=dt;if(it.st==='raw'&&it.heat>=COOK){it.st='cook';it.heat=0;S.ev.push({t:'cooked',k:'steak',x:t.x,z:t.z})}else if(it.st==='cook'&&it.heat>=BURN){it.st='burnt';S.ev.push({t:'burnt',k:'steak',x:t.x,z:t.z})}}
  if(t.ch==='F'&&it.k==='potato'&&it.st!=='burnt'&&it.st!=='raw'){it.heat+=dt;if(it.st==='chop'&&it.heat>=FRY){it.st='fry';it.heat=0;S.ev.push({t:'cooked',k:'potato',x:t.x,z:t.z})}else if(it.st==='fry'&&it.heat>=FRY_BURN){it.st='burnt';S.ev.push({t:'burnt',k:'potato',x:t.x,z:t.z})}}}
 // commandes : une nouvelle régulièrement (4 au plus), tout de suite s'il n'y en a plus
 S.orderT-=dt;if(!S.orders.length)S.orderT=Math.min(S.orderT,1.5);if(S.orders.length<4&&S.orderT<=0){spawnOrder(S);S.orderT=S.L.every}
 for(const o of S.orders)o.left-=dt;
 for(const o of S.orders.filter(o=>o.left<=0)){S.lost++;S.combo=0;S.score=Math.max(0,S.score-10);S.ev.push({t:'angry',r:o.r,who:o.who})}
 S.orders=S.orders.filter(o=>o.left>0);
 // assiettes qui reviennent (sales, ou propres tant qu'on n'apprend pas la plonge)
 for(const r of S.returns)r.t-=dt;
 for(const r of S.returns.filter(r=>r.t<=0)){const d=S.tiles.flat().find(t=>t.ch==='D');if(d){S.L.wash?d.dirty++:d.clean++;S.ev.push({t:'return',x:d.x,z:d.z,dirty:S.L.wash})}}
 S.returns=S.returns.filter(r=>r.t>0)}

export const starsFor=S=>S.L.stars.filter(s=>S.score>=s).length;
// progression affichée au-dessus d'une case : [part, type]
export function gauge(t){const it=t.item;
 if(t.ch==='K'&&t.prog>0)return [t.prog,'chop'];if(t.ch==='W'&&t.prog>0)return [t.prog,'wash'];
 if(it&&t.ch==='S'&&it.k==='steak'){if(it.st==='raw')return [it.heat/COOK,'cook'];if(it.st==='cook')return [it.heat/BURN,'burn']}
 if(it&&t.ch==='F'&&it.k==='potato'){if(it.st==='chop')return [it.heat/FRY,'cook'];if(it.st==='fry')return [it.heat/FRY_BURN,'burn']}
 return null}
