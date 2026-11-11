import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../store-engine.js';
import * as RD from '../store-roads.js';
function crossroads(radius){const S={lanes:[{id:1,pts:[[0,49],[160,49]]},{id:2,pts:[[160,51],[0,51]]},{id:3,pts:[[49,152],[49,0]]},{id:4,pts:[[51,0],[51,152]]}],laneNext:4,yields:[],lights:[]};if(radius)RD.addRing(S,RD.ringPlan(S,50,50,radius));return S}
// flux continus depuis chaque entrée, sorties au hasard
function flow(S,secs,rate,mixed,seed=7){const NT=RD.net(S),R={blocks:[]},list=[];let id=1,acc={},arrived=0,maxStop=0,maxRing=0;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
 for(let k=0;k<secs/.05;k++){for(const e of NT.entries){acc[e.lane]=(acc[e.lane]||0)+.05*rate/10;if(acc[e.lane]<1||list.some(v=>v.lane===e.lane&&v.s<9))continue;acc[e.lane]=0;
   const ex0=NT.exits.filter(x=>RD.route(NT,e,[x])),ex=ex0.filter(x=>x.lane!==e.lane).length?ex0.filter(x=>x.lane!==e.lane):ex0;const r=RD.route(NT,e,[ex[Math.floor(rnd()*ex.length)]]);
   const kind=mixed&&rnd()<.25?(rnd()<.5?'bus':'truck'):'car',v={id:id++,kind,route:r,ri:0,u:0,vmax:kind==='car'?5:4};RD.placeOn(NT,v);list.push(v)}
  for(const v of RD.drive(S,R,list,.05,[])){arrived++;list.splice(list.indexOf(v),1)}
  for(const v of list)maxStop=Math.max(maxStop,v.stopT||0);maxRing=Math.max(maxRing,list.filter(v=>NT.geo.get(v.lane)?.ring).length)}
 return {arrived,maxStop,maxRing,left:list.length}}
test('roundabouts: several vehicles circulate, entries never stay blocked (cars, buses, semi-trailers)',()=>{
 for(const r of [3,4,5])for(const mixed of [false,true]){const o=flow(crossroads(r),300,1.2,mixed);
  assert.ok(o.maxStop<60,`r${r} ${mixed?'mixte':'voitures'} : arrêt max ${o.maxStop.toFixed(1)} s`);assert.ok(o.arrived>50,`r${r} : ${o.arrived} arrivés`);assert.ok(o.maxRing>=2,`r${r} : ${o.maxRing} sur l'anneau`)}});
test('crossroads: right hand priority without gridlock or starvation, even with heavy traffic',()=>{
 for(const rate of [1.2,3]){const o=flow(crossroads(0),300,rate,true);assert.ok(o.maxStop<30,`débit ${rate} : arrêt max ${o.maxStop.toFixed(1)} s`);assert.ok(o.arrived>100)}});
test('semi-trailer articulates in turns; city bus and truck are shorter than before',()=>{
 assert.ok(RD.front({kind:'truck'})+RD.back({kind:'truck'})<7);assert.ok(RD.half({kind:'bus'})*2<9);
 const S=crossroads(0);S.lanes.push({id:5,pts:[[0,30],[20,30],[20,10]]});RD.roadsChanged?.(S);delete S._RN;const NT=RD.net(S),route=RD.route(NT,{lane:5,s:0},[{lane:5,s:NT.geo.get(5).len}]);
 const v={id:1,kind:'truck',route,ri:0,u:0,vmax:4};RD.placeOn(NT,v);let maxArt=0;for(let k=0;k<400;k++){RD.drive(S,{blocks:[]},[v],.05,[]);const [cab,tr]=RD.parts(v);let d=Math.abs(cab.ang-tr.ang);if(d>Math.PI)d=2*Math.PI-d;maxArt=Math.max(maxArt,d)}
 assert.ok(maxArt>.3&&maxArt<1.6,'angle entre tracteur et remorque dans le virage : '+maxArt.toFixed(2));
 const [cab,tr]=RD.parts(v);assert.ok(Math.abs(cab.ang-tr.ang)<.05,'remorque réalignée en ligne droite')});
test('lanes: tap cuts a lane in two (traffic continues), lane ends can be moved',()=>{
 const S=E.starter(E.withDirt(E.newGame()));S.cash=1e6;const l=S.lanes.at(-1),n=S.lanes.length;
 assert.equal(E.cutLane(S,l.id,66,55),null);assert.equal(S.lanes.length,n+1);const [a,b]=S.lanes.slice(-2);assert.deepEqual(a.pts.at(-1),b.pts[0]);
 const NT=RD.net(S);assert.ok(RD.route(NT,NT.entries[0],[{lane:b.id,s:3}]),'on passe toujours d’un morceau à l’autre');
 assert.match(E.cutPlan(S,a.id,20,20).why||'',/Touche/);
 assert.equal(E.moveVertex(S,b.id,b.pts.length-1,90,70,false),null);assert.deepEqual(S.lanes.find(o=>o.id===b.id).pts.at(-1),[90,70]);
 assert.equal(E.moveVertex(S,a.id,0,40,80,false),null);assert.deepEqual(S.lanes.find(o=>o.id===a.id).pts[0],[40,80]);
 assert.equal(E.undo(S),null);assert.deepEqual(S.lanes.find(o=>o.id===a.id).pts[0],[46,85])});
test('editing roads under parked cars and trucks never stops the game',()=>{
 for(const seed of [1,2,3]){const S=E.starter(E.withDirt(E.newGame()));S.cash=1e7;S.rep=90;for(const r of ['caissier','caissier','rayon','rayon'])E.hire(S,r,1);
  E.paintGround(S,[45,80],[47,80],'cross');const R=E.runtime(seed);S.open=true;let sd=seed;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
  for(let k=0;k<24000;k++){E.step(S,R,.05);
   if(k%400===380&&S._fz&&E.canUndo(S)){S._fz=0;E.undo(S)}
   if(k%400===200){const vs=E.vehicles(R).filter(v=>v.lane!=null),v=vs[Math.floor(rnd()*vs.length)],l=v&&S.lanes.find(o=>o.id===v.lane&&!o.ring&&o.pts);if(!l)continue;S._fz=1;
    const op=Math.floor(rnd()*3),i=Math.floor(rnd()*l.pts.length);if(op===0)E.eraseAt(S,Math.floor(v.x),Math.floor(v.z));else if(op===1)E.moveVertex(S,l.id,i,l.pts[i][0]+2,l.pts[i][1]-2,false);else E.cutLane(S,l.id,v.x,v.z)}}
  assert.ok(S.d>=4,'la partie avance (jour '+S.d+')')}
 // une voiture garée dont la place n'a plus d'accès à la route ne fait plus planter la circulation
 const S=E.starter(E.withDirt(E.newGame())),R=E.runtime(1);S.open=true;for(let k=0;k<2000&&!R.cars.some(c=>c.st==='parked');k++)E.step(S,R,.05);
 const car=R.cars.find(c=>c.st==='parked');assert.ok(car);car.acc=null;car.leaving=true;car.exitWait=5;assert.doesNotThrow(()=>{for(let k=0;k<200;k++)E.step(S,R,.05)})});
