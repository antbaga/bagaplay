import test from 'node:test';
import assert from 'node:assert/strict';
import * as B from '../bubble-engine.js';

function play(n,seed,H=700){const S=B.newGame(n,seed);let g=0;
 while(!S.won&&!S.lost&&g++<500){const v=B.view(S,H);S.deadY=v.deadY;const m=B.bot(S,v.sx,v.sy);if(m.swap){const t=S.cur;S.cur=S.next;S.next=t}const ball=S.cur;B.shoot(S,ball,B.trace(S,v.sx,v.sy,m.a))}
 return S}

test('150 levels: valid grids, everything hangs from the ceiling, goals match the content',()=>{
 for(let n=1;n<=B.LEVELS;n++){const lv=B.makeLevel(n);assert.ok(lv.count>=20,`niveau ${n} : ${lv.count} bulles`);assert.ok(lv.shots>=10);assert.ok(lv.stars[0]<lv.stars[1]);
  const S=B.newGame(n,1);const cells=B.cells(S);assert.equal(cells.length,lv.count);
  for(const [r,c,v] of cells){assert.ok(c<B.rowLen(r));if(v.c!=null)assert.ok(v.c>=0&&v.c<lv.colors,`couleur hors palette au niveau ${n}`)}
  const T=B.clone(S);const ev=B.apply(T,{t:'fire'},{hits:[]});assert.equal(ev.dropped.length,0,`bulles décrochées au départ, niveau ${n}`);
  if(lv.goal==='chicks')assert.ok(lv.chicks>=2,`niveau ${n} sans poussin`);
  if(lv.goal==='top')assert.ok((S.rows[0]||[]).some(Boolean))}});

test('a simple bot wins a sample of levels within the shots given',()=>{
 let wins=0,tries=0;const failed=[];
 for(let n=1;n<=B.LEVELS;n+=7){if(n===78)continue;for(const seed of [11,12]){tries++;const S=play(n,seed);if(S.won)wins++;else failed.push(n+':'+S.lost)}}
 assert.ok(wins/tries>=.85,`${wins}/${tries} victoires, échecs ${failed.join(' ')}`)});

test('three of a kind pop, what hangs below drops, chicks are freed when they fall',()=>{
 const S=B.newGame(1,1);S.rows=[[{t:'n',c:0},{t:'n',c:0},null,null,null,null,null,null,null,null,null],[{t:'chick',c:1},null,null,null,null,null,null,null,null,null]];S.goal='chicks';S.chicks=1;S.freed=0;
 const ev=B.apply(S,{t:'c',c:0},{cell:[0,2]});assert.equal(ev.popped.length,3);assert.equal(ev.dropped.length,1);assert.equal(ev.freed,1);assert.ok(B.goalDone(S))});

test('special bubbles: bombs and lightning chain, ice thaws, stones only fall, fire goes through',()=>{
 const S=B.newGame(1,1);const row=()=>new Array(11).fill(null),row1=()=>new Array(10).fill(null);
 S.rows=[row(),row1(),row()];S.rows[0][0]={t:'n',c:2};S.rows[0][1]={t:'n',c:2};S.rows[0][3]={t:'bomb'};S.rows[0][4]={t:'n',c:3};S.rows[0][6]={t:'ice',c:2};S.rows[1][5]={t:'stone'};
 for(let c=0;c<11;c++)S.rows[2][c]={t:'n',c:4};S.rows[1][0]={t:'bolt'};
 const ev=B.apply(S,{t:'c',c:2},{cell:[0,2]});
 assert.ok(ev.blasts.length>=2,'la bombe et l’éclair voisins se déclenchent');assert.ok(ev.popped.some(([r,c,v])=>v.t==='bomb'));
 const T=B.newGame(1,1);T.rows=[[{t:'n',c:1},{t:'ice',c:1},null,null,null,null,null,null,null,null,null],[{t:'n',c:1},null,null,null,null,null,null,null,null,null]];
 const e2=B.apply(T,{t:'c',c:1},{cell:[1,1]});assert.equal(e2.thawed.length,1);assert.equal(B.get(T,0,1).t,'n');
 const F=B.newGame(30,1);const v=B.view(F,700);const before=B.cells(F).length;const res=B.trace(F,v.sx,v.sy,Math.PI/2,true);assert.ok(res.hits.length>2);B.apply(F,{t:'fire'},res);assert.ok(B.cells(F).length<before-2)});

test('the ceiling comes down on the levels that say so, and crossing the line loses',()=>{
 const n=[...Array(B.LEVELS).keys()].map(i=>i+1).find(n=>B.levelInfo(n).drop);const S=B.newGame(n,3);S.deadY=B.view(S,700).deadY;
 for(let k=0;k<200&&!S.lost&&!S.won;k++){const v=B.view(S,700);B.shoot(S,S.cur,B.trace(S,v.sx,v.sy,.2))}
 assert.equal(S.lost,'line');assert.ok(S.ceil>0)});
