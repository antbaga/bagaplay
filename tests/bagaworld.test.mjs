import test from 'node:test';
import assert from 'node:assert/strict';
import * as F from '../bagaworld-fight.js';
import * as C from '../bagaworld-char.js';
import * as D from '../bagaworld-data.js';

const open=(w=10,h=10,obst=[])=>{const grid=new Array(w*h).fill(0);for(const [x,y] of obst)grid[y*w+x]=1;return {w,h,grid,start:[[[1,5],[1,4],[1,6]],[[8,5],[8,4],[8,6]]]}};
const hero=(cls='bourrin',lvl=1,extra={})=>{const ch=C.newChar('Kiara',cls);ch.xp=D.xpFor(lvl);Object.assign(ch.base,extra);return ch};
const fight=(chars,mobs,arena=open(),seed=7)=>{const S=F.newFight(arena,[chars.map((c,i)=>C.fighterOf(c,'p'+i)),mobs.map(([m,l],i)=>C.mobFighter(m,l,'m'+i))],seed);return S};
const goFight=S=>{for(const f of S.f.filter(f=>f.kind==='player'))F.act(S,{a:'ready',id:f.id})};
// fait jouer les monstres jusqu'au tour d'un joueur
function mobsPlay(S,max=200){for(let i=0;i<max;i++){const c=F.current(S);if(!c||S.phase!=='fight'||c.kind==='player')return;const a=F.aiAction(S);assert.ok(F.act(S,a)||F.act(S,{a:'end'}),'action IA refusée '+JSON.stringify(a))}}

test('data: every class has spells at level 1, every spell and drop refers to real data',()=>{
 for(const k in D.CLASSES){const sp=D.classSpells(k);assert.ok(sp.length>=6,k);assert.ok(sp.filter(id=>D.SPELLS[id].lvl===1).length>=2)}
 for(const [id,m] of Object.entries(D.MOBS)){for(const s of m.spells)assert.ok(D.SPELLS[s],id+' '+s);for(const d of m.drops)assert.ok(D.ITEMS[d.i],id+' '+d.i)}
 for(const [id,q] of Object.entries(D.QUESTS)){assert.ok(D.NPCS[q.giver],id);for(const m in q.kill)assert.ok(D.MOBS[m]);if(q.reward.item)assert.ok(D.ITEMS[q.reward.item])}
 for(const n of Object.values(D.NPCS))for(const i of n.shop||[])assert.ok(D.ITEMS[i],i);
 assert.equal(D.levelOf(0),1);assert.equal(D.levelOf(D.xpFor(10)),10);assert.ok(D.xpFor(50)>D.xpFor(49))});

test('character: levels give points and spells, wisdom costs 3, equipment adds stats',()=>{const ch=C.newChar('Kiara','viseur');assert.equal(C.level(ch),1);assert.deepEqual(C.spellsOf(ch),['fleche','recul']);
 const r=C.gainXp(ch,D.xpFor(6));assert.equal(r.after,6);assert.equal(ch.points,25);assert.ok(r.newSpells.includes('enflammee')&&r.newSpells.includes('eloigne'));
 assert.ok(C.spend(ch,'agi',10));assert.ok(C.spend(ch,'wis',3));assert.equal(ch.points,6);assert.equal(C.derived(ch).stats.agi,10);
 C.addItem(ch,'bottes_arak');assert.equal(C.canEquip(ch,'bottes_arak'),false,'niveau 14 requis');C.addItem(ch,'anneau_poultoss');assert.ok(C.equip(ch,'anneau_poultoss'));assert.equal(C.derived(ch).stats.agi,18);
 assert.ok(C.unequip(ch,'ring'));assert.equal(ch.inv.anneau_poultoss,1);assert.equal(C.resetStats(ch),19);assert.equal(ch.points,25);
 ch.hp=10;assert.equal(C.useItem(ch,'potion'),40);assert.equal(ch.inv.potion,1);assert.ok(C.buy(ch,'pain',2));assert.equal(ch.kamas,30-12)});

test('fight: placement, initiative order, moving costs MP, casting costs AP and respects range and line of sight',()=>{
 const S=fight([hero('viseur',1)],[['moutoufou',1]],open(10,10,[[5,5]]));assert.equal(S.phase,'place');
 assert.ok(F.act(S,{a:'place',id:'p0',x:1,y:4}));goFight(S);assert.equal(S.phase,'fight');assert.equal(S.order.length,2);
 const me=S.f[0];if(F.current(S)!==me)mobsPlay(S);assert.equal(F.current(S),me);
 const m=S.f[1];m.x=7;m.y=4;me.x=1;me.y=4;
 assert.equal(F.canCast(S,me,'fleche',7,4),null,'flèche à 6 cases');const hp=m.hp;assert.ok(F.act(S,{a:'cast',spell:'fleche',x:7,y:4}));assert.ok(m.hp<hp);assert.equal(me.pa,3);
 m.x=8;m.y=5;me.x=2;me.y=5;assert.equal(F.canCast(S,me,'fleche',8,5),'vue','le rocher bloque la vue');
 assert.equal(F.canCast(S,me,'recul',4,7),'ligne','en ligne seulement');assert.equal(F.canCast(S,me,'fleche',2,4),'portee','portée minimale 2');const pm=me.pm;assert.ok(F.act(S,{a:'move',path:[[2,4],[3,4]]}));assert.equal(me.pm,pm-2);
 assert.equal(F.act(S,{a:'move',path:[[5,5]]}),false,'pas de saut ni d’obstacle')});

test('fight: tackle, push into a wall, traps, poison, invisibility, buffs',()=>{
 const S=fight([hero('fourbe',15,{agi:0})],[['sanglier',16]]);goFight(S);const me=S.f[0],m=S.f[1];if(F.current(S)!==me)mobsPlay(S);
 me.x=4;me.y=4;m.x=5;m.y=4;me.pa=6;me.pm=3;const keep=F.escape(S,me);assert.ok(keep<1,'tacle par le sanglier');F.act(S,{a:'move',path:[[3,4]]});assert.ok(me.pm<2||me.pa<6,'perd des PM/PA');
 // piège : déclenché quand le monstre marche dessus
 me.pa=10;me.x=2;me.y=2;m.x=6;m.y=2;assert.ok(F.act(S,{a:'cast',spell:'piege',x:4,y:2}));assert.equal(S.traps.length,1);
 me.pa=10;assert.ok(F.act(S,{a:'cast',spell:'invisibilite',x:2,y:2}));assert.ok(me.invis>0);
 me.pa=10;me.x=3;me.y=2;assert.ok(F.act(S,{a:'cast',spell:'poison',x:6,y:2}));assert.ok(m.buffs.some(b=>b.dot));
 F.act(S,{a:'end'});const hp=m.hp;assert.ok(S.ev.some(e=>e.t==='dmg'&&e.dot)||m.hp<hp,'le poison frappe au début de son tour');
 // l'IA ignore un ennemi invisible qui n'est pas collé à elle
 const a=F.aiAction(S);assert.ok(!(a.a==='cast'&&a.x===me.x&&a.y===me.y));
 const S2=fight([hero('bourrin',3)],[['moutoufou',1]],open(10,10,[[7,4]]));goFight(S2);const b=S2.f[0],t=S2.f[1];if(F.current(S2)!==b)mobsPlay(S2);
 b.x=5;b.y=4;t.x=6;t.y=4;b.pa=6;const hp2=t.hp;assert.ok(F.act(S2,{a:'cast',spell:'intimidation',x:6,y:4}));assert.equal(t.x,6,'bloqué par le rocher');assert.ok(S2.ev.some(e=>e.t==='dmg'&&e.push),'dégâts de poussée');assert.ok(t.hp<hp2)});

test('fight: monsters play a whole fight with their AI, it always ends, rewards and quests follow',()=>{
 for(const [cls,mobs] of [['bourrin',[['moutoufou',2],['poultoss',2]]],['viseur',[['vermichelle',3],['crabouillon',4]]],['bisou',[['champi',6],['moustikouille',6]]],['fourbe',[['sanglier',10]]]]){
  const ch=hero(cls,8),S=fight([ch],mobs,open(),11);goFight(S);let guard=0;
  while(S.phase==='fight'&&guard++<600){const c=F.current(S);if(c.kind==='mob'){F.act(S,F.aiAction(S))||F.act(S,{a:'end'})}
   else{// joueur automatique : premier sort utilisable sur un ennemi, sinon s'approcher, sinon fin
    const sp=c.spells.find(id=>S.f.some(o=>o.alive&&o.team===1&&!F.canCast(S,c,id,o.x,o.y)));if(sp){const o=S.f.find(o=>o.alive&&o.team===1&&!F.canCast(S,c,sp,o.x,o.y));F.act(S,{a:'cast',spell:sp,x:o.x,y:o.y});continue}
    const tgt=S.f.find(o=>o.alive&&o.team===1);const P=F.paths(S,c);let best=null;for(const [k,d] of P.D){const [x,y]=k.split(',').map(Number);const dd=Math.abs(tgt.x-x)+Math.abs(tgt.y-y);if(!best||dd<best.dd)best={x,y,dd}}
    if(best&&(best.x!==c.x||best.y!==c.y)&&c.pm>0){F.act(S,{a:'move',path:P.path(best.x,best.y)});if(c.pm>0)continue}F.act(S,{a:'end'})}}
  assert.equal(S.phase,'over',cls+' : le combat se termine');
  const [r]=C.rewards(S,[{ch}],F.rng(3));if(S.winner===0){assert.ok(r.xp>0&&r.kamas>0);ch.quests.q_moutons={};const xp=ch.xp;C.applyRewards(ch,r,S);assert.ok(ch.xp>xp)}else assert.equal(r.xp,0)}});

test('fight: same seed and same actions give the same result (needed for group fights online)',()=>{
 const run=()=>{const S=fight([hero('bisou',5)],[['champi',6],['vermichelle',3]],open(),99);goFight(S);const log=[];let g=0;
  while(S.phase==='fight'&&g++<300){const c=F.current(S);const a=c.kind==='mob'?F.aiAction(S):(c.pa>=3&&S.f.some(o=>o.alive&&o.team===1&&!F.canCast(S,c,'blessant',o.x,o.y))?(()=>{const o=S.f.find(o=>o.alive&&o.team===1&&!F.canCast(S,c,'blessant',o.x,o.y));return {a:'cast',spell:'blessant',x:o.x,y:o.y}})():{a:'end'});
   F.act(S,a)||F.act(S,{a:'end'});log.push(JSON.stringify(a))}return {log,hp:S.f.map(f=>f.hp).join(),snap:F.snapshot(S)}};
 const a=run(),b=run();assert.deepEqual(a.log,b.log);assert.equal(a.hp,b.hp);
 const S=F.restore(a.snap);assert.equal(S.f.map(f=>f.hp).join(),a.hp)});

test('quests: accept, progress on kills, hand in for rewards; locked quest needs the previous one',()=>{const ch=hero('bourrin',2);
 assert.equal(C.questState(ch,'q_royal'),'locked');assert.ok(C.acceptQuest(ch,'q_moutons'));for(let i=0;i<5;i++)C.recordKill(ch,'moutoufou');assert.equal(C.questState(ch,'q_moutons'),'ready');
 const k=ch.kamas,r=C.finishQuest(ch,'q_moutons');assert.ok(r);assert.equal(ch.kamas,k+40);assert.equal(ch.inv.coiffe_paille,1);assert.equal(C.questState(ch,'q_royal'),'available')});

import * as W from '../bagaworld-world.js';
test('world: same world for everyone, town reachable from every zaap and spawn, arenas are playable',()=>{const A=W.genWorld(),B=W.genWorld();
 assert.deepEqual([...A.prop.slice(0,3000)],[...B.prop.slice(0,3000)]);assert.ok(W.walkable(A,A.start.x,A.start.z));
 for(const n of A.npcs)assert.ok(W.walkable(A,n.x,n.z),'PNJ '+n.id);
 for(const z of A.zaaps)assert.ok(W.findPath(A,A.start.x,A.start.z,z.x,z.z,60000),'Bagaap '+z.id);
 let bad=0;for(const s of A.spawns)if(!W.findPath(A,A.start.x,A.start.z,s.x,s.z,60000))bad++;assert.equal(bad,0,'points d’apparition inaccessibles');
 assert.ok(['town','meadow','beach','woods','hills','throne'].every(z=>A.spawns.some(s=>s.zone===z)||z==='town'));
 const groups=W.spawnGroups(A);assert.equal(groups.length,A.spawns.length);const r=F.rng(5);for(let i=0;i<200;i++)W.tickGroups(A,groups,.1,r);assert.ok(groups.every(g=>W.walkable(A,g.x,g.z)));
 for(const g of groups.slice(0,12)){const ar=W.arenaAt(A,g.x-2,g.z,g.x,g.z);assert.ok(ar.start[0].length>=1&&ar.start[1].length>=1);assert.ok(ar.grid.filter(c=>c===0).length>=30,'arène trop petite');
  const S=F.newFight(ar,[[C.fighterOf(C.newChar('K','bourrin'),'p0')],g.members.map(([m,l],i)=>C.mobFighter(m,l,'m'+i))],1);const p=S.f[0];assert.ok(F.walkable(S,p.x,p.y));
  for(const m of S.f.slice(1))assert.ok(F.walkable(S,m.x,m.y),'monstre placé sur une case libre')}});

test('en ligne : rejoindre, forcer le départ, abandonner, rejouer le journal à l’identique', async()=>{
 const F=await import('../bagaworld-fight.js'),C=await import('../bagaworld-char.js'),WW=await import('../bagaworld-world.js');
 const W=WW.genWorld(),g=WW.spawnGroups(W).find(g=>g.zone==='meadow');const A=WW.arenaAt(W,g.x+1,g.z,g.x,g.z);
 const a=C.newChar('A','bourrin'),b=C.newChar('B','bisou');const fa=C.fighterOf(a,'pa'),fb=C.fighterOf(b,'pb');
 const init=()=>F.newFight(A,[[fa],g.members.map(([m,l],i)=>C.mobFighter(m,l,'m'+i))],777);
 const S=init(),log=[];const play=(S,x)=>{const ok=F.act(S,x);return ok};
 const push=x=>{assert.ok(play(S,x),JSON.stringify(x));log.push(x)};
 push({a:'join',f:fb});assert.equal(S.f.filter(f=>f.kind==='player').length,2);
 assert.equal(F.act(S,{a:'join',f:fb}),false,'pas deux fois');
 push({a:'ready',id:'pa'});assert.equal(S.phase,'place');push({a:'go'});assert.equal(S.phase,'fight');
 // une action au nom d'un autre que celui qui joue est refusée
 const cur=F.current(S),other=S.f.find(f=>f.kind==='player'&&f!==cur);if(other)assert.equal(F.act(S,{a:'end',id:other.id}),false);
 // dérouler : IA locale entre les actions humaines du journal
 const drain=S=>{let n=0;while(S.phase==='fight'&&F.current(S)?.kind==='mob'&&n++<200){const x=F.aiAction(S)||{a:'end'};if(!F.act(S,x))F.act(S,{a:'end'})}};
 for(let k=0;k<30&&S.phase==='fight';k++){drain(S);if(S.phase!=='fight')break;const c=F.current(S);push(k===6&&c.id==='pb'?{a:'quit',id:'pb'}:{a:'end',id:c.id})}
 // un second client rejoue le même journal et arrive au même état
 const S2=init();for(const x of log){drain(S2);assert.ok(F.act(S2,x))}drain(S2);drain(S);
 assert.deepEqual(S2.f.map(f=>[f.id,f.hp,f.x,f.y,f.alive]),S.f.map(f=>[f.id,f.hp,f.x,f.y,f.alive]));assert.equal(S2.phase,S.phase);
});

test('donjon : les salles s’enchaînent dans le même combat, à l’identique chez tous les clients', async()=>{
 const F=await import('../bagaworld-fight.js'),C=await import('../bagaworld-char.js'),WW=await import('../bagaworld-world.js'),D=await import('../bagaworld-data.js');
 const hero=C.newChar('H','bourrin');hero.xp=D.xpFor(40);hero.base.vit=400;hero.base.str=300;const me=C.fighterOf(hero,'me');me.ai='melee';
 const rooms=D.DUNGEON.rooms.map((r,i)=>({arena:WW.dungeonArena(i),mobs:r.mobs.map(([m,l],j)=>C.mobFighter(m,l,'r'+i+'m'+j))}));
 const make=()=>F.newFight(rooms[0].arena,[[me],rooms[0].mobs],99,{waves:rooms.slice(1)});
 const S=make(),log=[],waves=[];const drain=S=>{let n=0;while(S.phase==='fight'&&F.current(S)?.kind==='mob'&&n++<300){const a=F.aiAction(S)||{a:'end'};if(!F.act(S,a))F.act(S,{a:'end'})}};
 const push=a=>{assert.ok(F.act(S,a),JSON.stringify(a));log.push(a)};
 push({a:'ready',id:'me'});
 for(let k=0;k<600&&S.phase!=='over';k++){drain(S);if(S.phase==='over')break;if(S.phase==='place'){push({a:'ready',id:'me'});continue}
  // le héros joue comme une IA (actions passées par le journal)
  const a=F.aiAction(S)||{a:'end',id:'me'};const x={...a,id:'me'};if(!F.act(S,x)){F.act(S,{a:'end',id:'me'});log.push({a:'end',id:'me'})}else log.push(x);
  for(const e of S.ev.splice(0))if(e.t==='wave')waves.push(e.n)}
 assert.equal(S.phase,'over');assert.equal(S.winner,0,'le héros surpuissant gagne');assert.deepEqual(waves,[2,3,4]);
 assert.equal(S.f.filter(f=>f.kind==='mob').length,D.DUNGEON.rooms.reduce((n,r)=>n+r.mobs.length,0),'tous les monstres comptent pour les récompenses');
 const S2=make();for(const a of log){drain(S2);F.act(S2,a)}drain(S2);assert.equal(S2.phase,'over');assert.deepEqual(S2.f.map(f=>[f.id,f.hp]),S.f.map(f=>[f.id,f.hp]));
});

test('métiers : récolte, niveaux, fabrication, panoplies, quêtes à rapporter', async()=>{
 const C=await import('../bagaworld-char.js'),D=await import('../bagaworld-data.js'),WW=await import('../bagaworld-world.js');
 const ch=C.newChar('M','bisou');assert.equal(C.harvest(ch,D.HARVEST.tree).err,'job');C.learnJob(ch,'bucheron');assert.equal(C.harvest(ch,D.HARVEST.pine).err,'lvl');
 for(let i=0;i<50;i++)C.harvest(ch,D.HARVEST.tree,()=>.9);assert.ok(C.jobLevel(ch,'bucheron')>=5);assert.ok(!C.harvest(ch,D.HARVEST.pine).err);
 assert.equal(C.canCraft(ch,'arc_palmier'),'niveau');const n=C.maxCraft(ch,'planche');assert.ok(n>=6);C.craft(ch,'planche',n);assert.equal(ch.inv.planche,n);
 for(const [id,r] of Object.entries(D.RECIPES)){assert.ok(D.ITEMS[id],id);assert.ok(D.JOBS[r.job]);for(const i in r.in)assert.ok(D.ITEMS[i],i)}
 for(const h of Object.values(D.HARVEST))assert.ok(D.ITEMS[h.item]&&D.JOBS[h.job]);
 ch.xp=D.xpFor(20);for(const i of ['coiffe_champidou','cape_champidou','anneau_champidou']){ch.inv[i]=1}const pm=C.derived(ch).pm;
 C.equip(ch,'coiffe_champidou');C.equip(ch,'cape_champidou');assert.equal(C.derived(ch).pm,pm);C.equip(ch,'anneau_champidou');assert.equal(C.derived(ch).pm,pm+1,'3 pièces : +1 PM');
 C.acceptQuest(ch,'q_bois');assert.equal(C.questState(ch,'q_bois'),'active');ch.inv.frene=10;assert.equal(C.questState(ch,'q_bois'),'ready');C.finishQuest(ch,'q_bois');assert.equal(ch.inv.frene,2);
 const W=WW.genWorld();for(const j of Object.values(D.JOBS))assert.ok(W.npcs.some(n=>n.id===j.master),j.master);
 const items=new Set();for(let z=0;z<W.N;z++)for(let x=0;x<W.N;x++){const h=WW.harvestAt(W,x,z);if(h)items.add(h.item)}for(const h of Object.values(D.HARVEST))assert.ok(items.has(h.item),'récoltable quelque part : '+h.item);
});
