import test from 'node:test';
import assert from 'node:assert/strict';
import * as U from '../urssaf-engine.js';

const dt=1/60;
function run(seed,{bot=true,max=600}={}){const G=U.newRun(seed);U.start(G);const segs=new Map();let t=0;const ev={};
 while(G.p.state!=='over'&&t<max){for(const s of G.segs)segs.set(s.id,s);U.step(G,dt,bot?U.bot(G):[]);t+=dt;for(const e of G.events)ev[e.t]=(ev[e.t]||0)+1;G.events.length=0}
 return {G,segs:[...segs.values()],ev,t}}
const rect=s=>{const a=U.worldOf(s,s.start,0),b=U.worldOf(s,s.L,0),h=U.TW/2;return [Math.min(a[0],b[0])-h,Math.min(a[1],b[1])-h,Math.max(a[0],b[0])+h,Math.max(a[1],b[1])+h]};

test('every generated pattern can be passed: a simple bot runs 3 km on several seeds',()=>{
 for(const seed of [1,2,4,5,6,7]){const {G}=run(seed,{max:400});assert.ok(G.dist>3000,`seed ${seed} : ${Math.round(G.dist)} m`)}});

test('the track never crosses itself and turns never point backwards',()=>{
 for(const seed of [3,9]){const {segs}=run(seed,{max:300});segs.sort((a,b)=>a.d0-b.d0);assert.ok(segs.length>20);
  for(const s of segs)assert.notEqual(s.d,2,'jamais vers le sud');
  for(let i=0;i<segs.length;i++)for(let j=i+2;j<segs.length;j++){const a=rect(segs[i]),b=rect(segs[j]);const overlap=a[0]<b[2]-.01&&b[0]<a[2]-.01&&a[1]<b[3]-.01&&b[1]<a[3]-.01;assert.ok(!overlap,`segments ${segs[i].id} et ${segs[j].id} se chevauchent`)}}});

test('the junction approach stays clear of obstacles, and gaps are always jumpable',()=>{
 const G=U.newRun(11);U.start(G);let checked=0;
 for(let k=0;k<4000;k++){U.step(G,dt,U.bot(G));G.events.length=0;if(G.p.state==='over')break;
  for(const s of G.segs){if(s._ok)continue;s._ok=1;checked++;const J=U.junction(s);
   for(const it of s.items)if(it.k!=='coin')assert.ok(it.s<J-9,`objet ${it.k} trop près du virage`);
   for(const [a,b] of s.gaps){assert.ok(b-a<=2.85);assert.ok(a>s.start+5)}}}
 assert.ok(checked>3)});

test('missing a turn makes you fall off the sheet, a grant brings you back on the next sheet',()=>{
 const G=U.newRun(5);U.start(G);let fell=false,respawned=false,seg0=G.segs[0].id;
 for(let k=0;k<60*40&&!respawned;k++){const inp=G.p.s>U.junction(G.segs[0])-10?[]:U.bot(G);U.step(G,dt,inp);for(const e of G.events){if(e.t==='fall')fell=true;if(e.t==='respawn')respawned=true}G.events.length=0}
 assert.ok(fell&&respawned);assert.equal(G.lives,U.START_LIVES-1);assert.notEqual(G.segs[0].id,seg0,'on repart sur la feuille suivante');assert.equal(G.p.state,'run')});

test('doing nothing ends the run after the last grant, with score and coins kept',()=>{
 const {G,ev}=run(8,{bot:false,max:200});assert.equal(G.p.state,'over');assert.equal(G.lives,0);assert.equal(ev.over,1);assert.ok(G.score>0)});

test('bonuses: grants are capped, the shell company absorbs one hit, the jet flies over everything',()=>{
 const G=U.newRun(2);U.start(G);G.lives=U.MAX_LIVES;const seg=G.segs[0];
 seg.items.push({id:9001,k:'life',s:G.p.s+1,x:0,len:.8,w:.8});seg.items.sort((a,b)=>a.s-b.s);for(let k=0;k<30;k++)U.step(G,dt);assert.equal(G.lives,U.MAX_LIVES);
 G.power.shield=30;seg.items.push({id:9002,k:'gum',s:G.p.s+1.2,x:G.p.lane*U.LW,len:.85,w:1});seg.items.sort((a,b)=>a.s-b.s);let shield=false;
 for(let k=0;k<40;k++){U.step(G,dt);if(G.events.some(e=>e.t==='shield'))shield=true;G.events.length=0}
 assert.ok(shield);assert.equal(G.power.shield,0);assert.equal(G.lives,U.MAX_LIVES);
 G.power.jet=5;const lives=G.lives;for(let k=0;k<60*4;k++){U.step(G,dt);G.events.length=0}assert.equal(G.lives,lives);assert.ok(G.p.y>2)});
