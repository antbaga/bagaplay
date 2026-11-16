import test from 'node:test';
import assert from 'node:assert/strict';
import * as B from '../bubble-engine.js';

function play(n,seed,H=700){const S=B.newGame(n,seed);let g=0;
 while(!S.won&&!S.lost&&g++<400){const v=B.view(S,H);S.deadY=v.deadY;const m=B.bot(S,v.sx,v.sy);if(m.swap){const t=S.cur;S.cur=S.next;S.next=t}const ball=S.cur;B.shoot(S,ball,B.trace(S,v.sx,v.sy,m.a))}
 return S}
const bub=(id,x,y,c,t='n')=>({id,x,y,c,t});
function game(bubbles){const S=B.newGame(1,1);S.bubbles=bubbles;S.goal='clear';S.chicks=0;S.freed=0;return S}

test('150 levels: everything hangs from the ceiling, palettes and goals are consistent, calibration present',()=>{
 assert.equal(B.CALIB.length,B.LEVELS);
 for(let n=1;n<=B.LEVELS;n++){const lv=B.makeLevel(n);assert.ok(lv.count>=28,`niveau ${n} : ${lv.count} bulles`);assert.ok(lv.every>=4);assert.ok(lv.stars[1]<lv.stars[0]);
  for(const b of lv.bubbles)if(b.c!=null)assert.ok(b.c>=0&&b.c<lv.colors);
  const S=B.newGame(n,1);const ev=B.apply(S,{t:'fire'},{hits:[]});assert.equal(ev.dropped.length,0,`bulles qui pendent dans le vide au niveau ${n}`);
  if(lv.goal==='chicks')assert.ok(lv.chicks>=2)}});

test('no snapping: the ball freezes exactly where it first touches another bubble',()=>{
 const S=game([bub(1,200,18,0)]);const res=B.trace(S,200,500,Math.PI/2-.04);const hit=S.bubbles[0];
 assert.equal(res.hit,1);const d=Math.hypot(res.end[0]-hit.x,res.end[1]-hit.y);assert.ok(Math.abs(d-B.D)<.5,`distance ${d}`);
 B.apply(S,{t:'c',c:1},res);const placed=S.bubbles.find(b=>b.id!==1);assert.ok(Math.abs(placed.x-res.end[0])<1e-9&&Math.abs(placed.y-res.end[1])<1e-9,'posée exactement au point de contact');
 // et la position ne tombe pas sur une case de grille
 assert.ok(Math.abs(((placed.x-20)/18)-Math.round((placed.x-20)/18))>.05)});

test('three touching bubbles of a colour pop, what hangs from them drops, chicks are freed',()=>{
 const S=game([bub(1,100,18,0),bub(2,136,18,0),bub(3,118,18+B.RH,2,'chick')]);S.goal='chicks';S.chicks=1;
 const ev=B.apply(S,{t:'c',c:0},{end:[172,18]});assert.equal(ev.popped.length,3);assert.equal(ev.dropped.length,1);assert.equal(ev.freed,1);assert.ok(B.goalDone(S))});

test('every few shots the ceiling comes down with everything hanging from it, no new bubbles; crossing the line loses',()=>{
 const S=B.newGame(40,3);const v=B.view(S,700);S.deadY=v.deadY;const y0=S.bubbles.map(b=>b.y),n0=S.bubbles.length;
 const ev=B.descend(S);assert.equal(S.bubbles.length,n0,'aucune bulle ne doit apparaître');assert.ok(S.bubbles.every((b,i)=>Math.abs(b.y-y0[i]-B.RH)<1e-9));assert.ok(Math.abs(ev.top-B.RH)<1e-9);
 assert.equal(B.apply(S,{t:'fire'},{hits:[]}).dropped.length,0,'rien ne tombe à cause de la descente');
 // un tir vers le haut s'arrête contre le plafond descendu, et la bulle y reste accrochée
 const C=game([]);C.top=B.RH*2;const r=B.trace(C,200,600,Math.PI/2);assert.ok(r.ceiling);assert.ok(Math.abs(r.end[1]-(C.top+B.R))<1e-6);
 const e2=B.apply(C,{t:'c',c:0},r);assert.equal(e2.dropped.length,0);assert.equal(C.bubbles.length,1);
 const T=B.newGame(40,3);T.deadY=B.view(T,700).deadY;let k=0;while(!T.lost&&!T.won&&k++<200){const vv=B.view(T,700);B.shoot(T,T.cur,B.trace(T,vv.sx,vv.sy,.25))}
 assert.equal(T.lost,'line')});

test('special bubbles: bombs and lightning chain, ice thaws, fire goes straight through',()=>{
 const S=game([bub(1,100,18,0),bub(2,136,18,null,'bomb'),bub(3,208,18,3),bub(4,82,18+B.RH,null,'bolt'),bub(5,300,18+B.RH,4),bub(6,64,18,1,'ice')]);
 const ev=B.apply(S,{t:'c',c:0},{end:[118,18+B.RH]});
 // la bulle posée + la rouge ne font que 2, mais la bombe voisine ne part pas sans éclatement : rien ne saute
 assert.equal(ev.popped.length,0);
 const T=game([bub(1,100,18,0),bub(2,136,18,0),bub(3,172,18,null,'bomb'),bub(4,208,18,3),bub(5,64,18,1,'ice'),bub(6,350,18+B.RH,2,'bolt')]);
 const e2=B.apply(T,{t:'c',c:0},{end:[118,18+B.RH]});assert.ok(e2.popped.some(b=>b.t==='bomb'),'la bombe voisine explose');assert.ok(e2.blasts.length>=1);assert.ok(e2.thawed.length===1||e2.popped.some(b=>b.id===5));
 const F=B.newGame(30,1),v=B.view(F,700),before=F.bubbles.length,res=B.trace(F,v.sx,v.sy,Math.PI/2,true);assert.ok(res.hits.length>2);B.apply(F,{t:'fire'},res);assert.ok(F.bubbles.length<before-2)});

test('a simple bot wins most sampled levels with the calibrated descent speed',()=>{
 let wins=0,tries=0;const failed=[];for(let n=1;n<=B.LEVELS;n+=9)for(const seed of [21,22]){tries++;const S=play(n,seed);if(S.won)wins++;else failed.push(n)}
 assert.ok(wins/tries>=.75,`${wins}/${tries} victoires, échecs ${failed.join(' ')}`)});
