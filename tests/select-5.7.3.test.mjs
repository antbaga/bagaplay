import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../store-engine.js';
// magasin de départ, deux abris à caddies accessibles et éloignés
function store(){const S=E.starter(E.withDirt(E.newGame()));S.cash=1e7;S.rep=95;for(const r of ['caissier','caissier','rayon','menage'])E.hire(S,r,1);
 const R0=E.runtime(1);E.step(S,R0,.05);const st=R0.agents.find(a=>a.role==='menage').c;const ok=[];
 for(let y=50;y<90&&ok.length<2;y+=2)for(let x=40;x<120&&ok.length<2;x+=2){if(typeof E.place(S,'corral',x,y,0)==='string')continue;const it=S.items.at(-1);
  if(E.field(S,'item:'+it.id,'s')[st]<0||(ok.length&&Math.hypot(ok[0][0]-x,ok[0][1]-y)<12)){E.removeItem(S,it.id);continue}ok.push([x,y])}
 return S}
test('cart balancing: no endless back-and-forth when customers keep taking and returning carts',()=>{
 for(const seed of [1,2,3]){const S=store(),R=E.runtime(seed),C=S.items.filter(o=>o.t==='corral');assert.equal(C.length,2);C[0].carts=4;C[1].carts=12;
  let rnd=seed*99991;const rn=()=>((rnd=(rnd*16807)%2147483647)/2147483647);let starts=0,wasted=0;const had=new Set();
  for(let k=0;k<12000;k++){if(rn()<.03){const c=C[rn()<.5?0:1];if(rn()<.5&&c.carts>0)c.carts--;else if(c.carts<25)c.carts++}
   S.dirt.fill(0);const before=new Map(R.agents.map(a=>[a.id,a.cartJob]));E.step(S,R,.05);
   for(const a of R.agents){const b=before.get(a.id);if(!b&&a.cartJob)starts++;if(a.cartLoad)had.add(a.id);if(b&&!a.cartJob&&!a.cartLoad){if(!had.has(a.id))wasted++;had.delete(a.id)}}}
  assert.ok(starts<=8,`seed ${seed} : ${starts} trajets en 10 min`);assert.ok(wasted<=1,`seed ${seed} : ${wasted} trajets abandonnés en route`)}});
test('select a customer, a car or a truck and remove it cleanly',()=>{
 const S=store();S.open=true;const R=E.runtime(4);let cust=null,car=null,truck=null;
 for(let k=0;k<40000&&!(cust&&car);k++){E.step(S,R,.05);cust=cust||R.agents.find(a=>a.k==='c'&&!a.hidden&&a.basket?.units>0&&!a.basket.paid);car=car||R.cars.find(c=>c.st==='parked')}
 assert.ok(cust&&car,'un client avec des articles et une voiture garée');
 const e=E.entityAt(S,R,cust.x,cust.y);assert.equal(e.kind,'customer');assert.ok(E.entityPos(S,R,e));
 const res=Object.values(S.reserve).reduce((a,b)=>a+b,0),units=cust.basket.units;
 assert.ok(E.removeEntity(S,R,e));assert.ok(!R.agents.includes(cust));assert.equal(Object.values(S.reserve).reduce((a,b)=>a+b,0),res+units,'articles non payés rendus');
 assert.equal(E.entityInfo(S,R,e),null);
 const ec=E.entityAt(S,R,car.x,car.z);assert.equal(ec?.kind,'car');const spot=car.spot;assert.ok(E.removeEntity(S,R,ec));assert.ok(!R.cars.includes(car));assert.ok(!R.spotTaken.has(spot));
 for(let k=0;k<200;k++)E.step(S,R,.05);   // le client de la voiture repart à pied, rien ne plante
 E.expressCat(S,Object.keys(S.reserve)[0],R);for(let k=0;k<20000&&!truck;k++){E.step(S,R,.05);truck=(R.trucks||[]).find(t=>t.x!=null)}
 assert.ok(truck,'un camion arrive');const et=E.entityAt(S,R,truck.x,truck.z);assert.equal(et?.kind,'truck');
 const cash=S.cash,q=R.deliv.length;assert.ok(E.removeEntity(S,R,et));assert.ok(!R.trucks.includes(truck));
 assert.ok(truck.paid?S.cash>=cash:R.deliv.length===q+1,'commande remise en file ou remboursée');
 for(let k=0;k<200;k++)E.step(S,R,.05)});
