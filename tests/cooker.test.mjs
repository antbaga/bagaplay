import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../cooker-engine.js';

// place le chef sur la case de sol (x,z), tourné vers (dx,dz)
const at=(S,x,z,dx,dz)=>{Object.assign(S.p,{x:x+.5,z:z+.5,dx,dz})};
const find=(S,ch)=>S.tiles.flat().find(t=>t.ch===ch);
// une case de sol voisine d'une station, et la direction pour la regarder
function beside(S,t){for(const [dx,dz] of [[0,1],[0,-1],[1,0],[-1,0]]){const f=C.tileAt(S,t.x+dx,t.z+dz);if(f&&C.isFloor(f.ch))return [f.x,f.z,-dx,-dz]}return null}
const face=(S,ch)=>{const t=find(S,ch);const b=beside(S,t);at(S,...b);return t};
const A=S=>C.step(S,0,{a:true});

test('levels: same width, one start, every station reachable from the start',()=>{
 for(const L of C.LEVELS){const W=L.map[0].length;assert.ok(L.map.every(r=>r.length===W),'largeur '+L.id);assert.equal(L.map.join('').split('@').length-1,1);
  const S=C.newGame(L.id,1),seen=new Set(),q=[[Math.floor(S.p.x),Math.floor(S.p.z)]];
  while(q.length){const [x,z]=q.pop(),k=x+','+z;if(seen.has(k))continue;seen.add(k);for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const t=C.tileAt(S,x+dx,z+dz);if(t&&C.isFloor(t.ch))q.push([x+dx,z+dz])}}
  const need=new Set(L.recipes.flatMap(r=>C.RECIPES[r].parts));
  for(const t of S.tiles.flat()){if(C.isFloor(t.ch)||t.ch==='#')continue;const ok=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dz])=>seen.has((t.x+dx)+','+(t.z+dz)));assert.ok(ok,`niveau ${L.id} : ${t.ch} en ${t.x},${t.z} inaccessible`)}
  for(const k of need)assert.ok(S.tiles.flat().some(t=>C.CRATE[t.ch]===k),`niveau ${L.id} : caisse ${k}`);
  for(const ch of ['D','O','X'])assert.ok(find(S,ch),`niveau ${L.id} : ${ch}`);
  if(L.wash)assert.ok(find(S,'W'),'évier '+L.id);if(need.has('lettuce')||need.has('potato'))assert.ok(find(S,'K'));if(need.has('steak'))assert.ok(find(S,'S'));if(need.has('potato'))assert.ok(find(S,'F'))}});

test('walls block the chef, the joystick moves him',()=>{const S=C.newGame(1,1);const x0=S.p.x;for(let i=0;i<5;i++)C.step(S,.05,{mx:1,mz:0});assert.ok(S.p.x>x0);
 for(let i=0;i<60;i++)C.step(S,.05,{mx:0,mz:1});assert.ok(S.p.z<=S.H-1-C.RAD+1e-6,'bloqué par le plan de travail du bas')});

test('salad: chop lettuce and tomato, plate them, serve the matching order',()=>{const S=C.newGame(1,1);S.orders=[{id:1,r:'salade',life:70,left:60,who:'Test'}];S.orderT=999;
 const crate=face(S,'l');A(S);assert.equal(S.p.hold.k,'lettuce');
 const K=S.tiles.flat().filter(t=>t.ch==='K');const b0=beside(S,K[0]);at(S,...b0);A(S);assert.equal(K[0].item.k,'lettuce');
 for(let i=0;i<20;i++)C.step(S,.1,{b:true});assert.equal(K[0].item.st,'chop');
 face(S,'t');A(S);at(S,...beside(S,K[1]));A(S);for(let i=0;i<20;i++)C.step(S,.1,{b:true});assert.equal(K[1].item.st,'chop');
 face(S,'D');A(S);assert.equal(S.p.hold.k,'plate');at(S,...b0);A(S);assert.deepEqual(S.p.hold.parts,['lettuce']);at(S,...beside(S,K[1]));A(S);
 const before=S.score;face(S,'O');A(S);assert.equal(S.p.hold,null);assert.ok(S.score>before+30,'points + pourboire');assert.equal(S.orders.length,0);
 assert.ok(S.ev.some(e=>e.t==='serve'));for(let i=0;i<80;i++)C.step(S,.1,{});assert.equal(find(S,'D').clean,3,'assiette revenue propre (pas de plonge au niveau 1)')});

test('steak cooks on the stove then burns; wrong dish is refused; trash empties a plate',()=>{const S=C.newGame(2,1);S.orders=[{id:1,r:'burger',life:75,left:70,who:'T'}];S.orderT=999;
 face(S,'m');A(S);const st=face(S,'S');A(S);assert.equal(st.item.st,'raw');
 C.step(S,C.COOK+.1,{});assert.equal(st.item.st,'cook');assert.ok(S.ev.some(e=>e.t==='cooked'));
 const g=C.gauge(st);assert.equal(g[1],'burn');C.step(S,C.BURN+.1,{});assert.equal(st.item.st,'burnt');
 face(S,'D');A(S);at(S,...beside(S,st));A(S);assert.deepEqual(S.p.hold.parts,[],'un steak brûlé ne va pas dans l’assiette');
 face(S,'b');S.p.hold=null;A(S);const counter=S.tiles.flat().find(t=>t.ch==='#'&&beside(S,t));at(S,...beside(S,counter));A(S);assert.equal(counter.item.k,'bun');
 S.p.hold=C.plate(S);A(S);assert.deepEqual(S.p.hold.parts,['bun']);
 face(S,'O');A(S);assert.ok(S.ev.some(e=>e.t==='wrong'),'un pain seul n’est pas commandé');assert.ok(S.p.hold);
 face(S,'X');A(S);assert.deepEqual(S.p.hold.parts,[])});

test('orders expire with a penalty; washing turns dirty plates into clean ones',()=>{const S=C.newGame(3,2);C.step(S,2,{});assert.equal(S.orders.length,1);
 S.score=50;S.orderT=999;C.step(S,S.orders[0].left+.1,{});assert.equal(S.lost,1);assert.equal(S.score,40);
 const W=find(S,'W');face(S,'W');S.p.hold=C.plate(S,true);A(S);assert.equal(W.dirty,1);
 for(let i=0;i<30;i++)C.step(S,.1,{b:true});assert.equal(W.dirty,0);assert.equal(W.clean,1);A(S);assert.equal(S.p.hold.k,'plate');assert.equal(S.p.hold.dirty,false)});

test('fries: chop the potato before frying; time runs out and the level ends with stars',()=>{const S=C.newGame(4,1);
 face(S,'p');A(S);const F=face(S,'F');A(S);assert.ok(S.ev.some(e=>e.t==='chopFirst'));assert.ok(S.p.hold);
 const K=face(S,'K');A(S);for(let i=0;i<20;i++)C.step(S,.1,{b:true});A(S);assert.equal(S.p.hold.st,'chop');at(S,...beside(S,F));A(S);C.step(S,C.FRY+.1,{});assert.equal(F.item.st,'fry');
 S.score=S.L.stars[1];C.step(S,S.left+1,{});assert.ok(S.over);assert.equal(C.starsFor(S),2)});
