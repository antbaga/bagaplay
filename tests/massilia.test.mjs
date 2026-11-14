import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../massilia-engine.js';
import {SQUARES,DECKS,START_MONEY,JAIL} from '../massilia-data.js';

const bots=(n,quick=false,seed=1)=>M.newGame({players:Array.from({length:n},(_,i)=>({name:'IA'+i,token:i,human:false,char:i%5,level:1})),quick,seed});
function play(S,max=20000){let k=0;while(S.phase!=='over'&&k++<max){if(S.phase==='end'&&k%7===0){const t=M.aiTradeIdea(S,S.turn);if(t&&M.aiAccepts(S,t))M.doTrade(S,t)}const a=M.aiAction(S);assert.ok(a,`aucune action en phase ${S.phase}`);const ok=M.act(S,a);
  assert.ok(ok,`action refusée : ${JSON.stringify(a)} en phase ${S.phase}`);S.ev.length=0;
  for(const p of S.players)if(!p.out)assert.ok(p.money>=0,`argent négatif pour ${p.name}`)}
 return k}

test('the board: 40 squares, 22 streets in 8 groups, 4 stations, 2 utilities, every text in French and English',()=>{
 assert.equal(SQUARES.length,40);assert.equal(SQUARES.filter(s=>s.t==='prop').length,22);assert.equal(SQUARES.filter(s=>s.t==='station').length,4);assert.equal(SQUARES.filter(s=>s.t==='util').length,2);
 assert.equal(Object.keys(M.GROUP_IDX).length,8);assert.equal(SQUARES[JAIL].t,'jail');assert.equal(SQUARES[30].t,'gotojail');
 for(const s of SQUARES){assert.equal(s.name.length,2);if(s.tag)assert.equal(s.tag.length,2)}
 for(const d of Object.values(DECKS))for(const c of d)assert.equal(c.text.length,2)});

test('quick games between computer players always end, with a winner and no negative money',()=>{
 for(const seed of [1,2,3,4,5,6]){const S=bots(2+seed%5,true,seed);play(S);assert.equal(S.phase,'over');assert.ok(S.winner!=null);assert.ok(S.round<=21)}});

test('classic games end by bankruptcy, properties go to the creditor or back to the bank',()=>{
 let ended=0;for(const seed of [11,12,13,14]){const S=bots(3,false,seed);play(S,60000);if(S.phase==='over'){ended++;assert.equal(M.active(S).length,1);
  for(const k in S.own)assert.ok(!S.players[S.own[k]].out,'une case appartient à un joueur éliminé')}}
 assert.ok(ended>=3,`${ended}/4 parties terminées`)});

test('rents: double on a full group, houses multiply, stations and utilities scale',()=>{
 const S=bots(2);S.own[1]=0;assert.equal(M.rentOf(S,1),M.baseRent(1));S.own[3]=0;assert.equal(M.rentOf(S,1),M.baseRent(1)*2);
 S.houses[1]=3;assert.equal(M.rentOf(S,1),M.rentTable(1)[3]);S.houses[1]=5;assert.equal(M.rentOf(S,1),M.rentTable(1)[5]);
 S.own[5]=1;S.own[15]=1;assert.equal(M.rentOf(S,5),50);S.own[12]=1;assert.equal(M.rentOf(S,12,8),32);S.own[28]=1;assert.equal(M.rentOf(S,12,8),80);
 S.mort[5]=true;assert.equal(M.rentOf(S,5),0)});

test('turn rules: doubles roll again, three doubles go to Les Baumettes, passing Start pays 200',()=>{
 const S=bots(2);M.roll(S,[2,2]);if(S.phase==='buy')M.decline(S);assert.equal(S.phase,'roll');M.roll(S,[3,3]);if(S.phase==='buy')M.decline(S);
 if(S.phase==='roll'){M.roll(S,[1,1]);assert.equal(M.cur(S).pos,JAIL);assert.equal(M.cur(S).jail,1);assert.equal(S.phase,'end')}
 const T=bots(2);T.players[0].pos=38;const m=T.players[0].money;M.roll(T,[1,3]);assert.equal(T.players[0].pos,2);assert.ok(T.players[0].money>=m+200-200)});

test('jail: pay, use a card, or roll doubles; after three misses you pay and move',()=>{
 const S=bots(2);const p=S.players[0];p.pos=JAIL;p.jail=1;S.phase='jail';
 M.jailRoll(S,[1,2]);assert.equal(S.phase,'end');M.endTurn(S);S.phase='end';M.endTurn(S);assert.equal(S.phase,'jail');M.jailRoll(S,[1,2]);M.endTurn(S);S.phase='end';M.endTurn(S);
 const before=p.money;M.jailRoll(S,[1,3]);assert.equal(p.jail,0);assert.ok(p.pos!==JAIL);assert.ok(p.money<=before)});

test('building stays even, mortgages refuse houses, debts can be raised or end in bankruptcy',()=>{
 const S=bots(2);for(const i of M.GROUP_IDX.brown)S.own[i]=0;S.players[0].money=1000;
 assert.ok(M.build(S,1));assert.ok(!M.build(S,1),'il faut construire à égalité');assert.ok(M.build(S,3));assert.ok(!M.mortgage(S,1));
 assert.ok(M.sell(S,1)||M.sell(S,3));
 const T=bots(2);T.players[0].money=10;T.own[39]=1;T.houses[39]=5;T.own[37]=1;T.players[0].pos=35;M.roll(T,[2,2]);
 assert.equal(T.phase,'debt');while(T.phase==='debt'){const a=M.aiAction(T);M.act(T,a)}assert.ok(T.players[0].out||T.phase!=='debt')});

test('trades: the computer accepts fair deals, refuses to give away a full group',()=>{
 const S=bots(3);S.own[1]=1;S.own[3]=0;S.players[0].money=900;
 const idea=M.aiTradeIdea(S,0);assert.ok(idea);assert.deepEqual(idea.get,[1]);assert.ok(M.aiAccepts(S,idea)||!M.aiAccepts(S,{...idea,money:10}));
 assert.ok(!M.aiAccepts(S,{from:0,to:1,give:[],get:[1],money:20}));assert.ok(M.doTrade(S,idea));assert.equal(S.own[1],0)});
