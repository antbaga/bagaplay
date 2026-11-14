// Massilia Biz : règles du jeu (sans DOM), testables sous Node. L'état est un objet JSON (sauvegardable tel quel) ;
// chaque action ajoute des événements dans S.ev que l'interface joue ensuite (déplacements, paiements, cartes…).
import {SQUARES,GROUPS,DECKS,START_MONEY,GO_SALARY,JAIL_FINE,JAIL,GOTO_JAIL} from './massilia-data.js';
export const N=SQUARES.length;
const BUYABLE=new Set(['prop','station','util']);
export const isBuyable=i=>BUYABLE.has(SQUARES[i].t);
export const GROUP_IDX={};SQUARES.forEach((s,i)=>{if(s.t==='prop')(GROUP_IDX[s.g]=GROUP_IDX[s.g]||[]).push(i)});
const MULT=[1,5,15,40,52,65];
export const baseRent=i=>Math.max(2,Math.round(SQUARES[i].price*.075/2)*2);
export const rentTable=i=>MULT.map(m=>baseRent(i)*m);
export const houseCost=i=>GROUPS[SQUARES[i].g].house;
export const mortgageValue=i=>SQUARES[i].price/2;
export const unmortgageCost=i=>Math.ceil(SQUARES[i].price*.55);

function rnd(S){let a=S.rs=(S.rs+0x6D2B79F5)|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}
const die=S=>1+Math.floor(rnd(S)*6);
function shuffled(S,n){const a=[...Array(n).keys()];for(let i=n-1;i>0;i--){const j=Math.floor(rnd(S)*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

export function newGame({players,quick=false,seed=Date.now()}){
 const S={v:1,rs:seed|0,players:players.map((p,i)=>({id:i,name:p.name,token:p.token,human:!!p.human,char:p.char??null,level:p.level??1,money:START_MONEY,pos:0,jail:0,cards:[],out:false})),
  own:{},houses:{},mort:{},turn:0,phase:'roll',dice:null,doubles:0,again:false,round:1,maxRounds:quick?20:0,pending:null,winner:null,
  decks:{mistral:null,tchatche:null},deckPos:{mistral:0,tchatche:0},held:{mistral:[],tchatche:[]},ev:[],turnCount:0};
 S.decks.mistral=shuffled(S,DECKS.mistral.length);S.decks.tchatche=shuffled(S,DECKS.tchatche.length);startTurn(S);return S}
export const cur=S=>S.players[S.turn];
export const active=S=>S.players.filter(p=>!p.out);
const ev=(S,e)=>S.ev.push(e);
export const ownerOf=(S,i)=>S.own[i]??null;
export const housesOn=(S,i)=>S.houses[i]||0;
export function ownsGroup(S,pid,g){return GROUP_IDX[g].every(i=>S.own[i]===pid)}
const groupClean=(S,g)=>GROUP_IDX[g].every(i=>!S.mort[i]);
export function countOwned(S,pid,t){return SQUARES.reduce((a,s,i)=>a+(s.t===t&&S.own[i]===pid?1:0),0)}
export function rentOf(S,i,dice=7,special=null){const s=SQUARES[i],o=S.own[i];if(o==null||S.mort[i])return 0;
 if(s.t==='station'){const n=countOwned(S,o,'station');return 25*2**(n-1)*(special==='station'?2:1)}
 if(s.t==='util'){const n=countOwned(S,o,'util');return dice*(special==='util'||n===2?10:4)}
 const h=housesOn(S,i);if(h)return rentTable(i)[h];return baseRent(i)*(ownsGroup(S,o,s.g)?2:1)}
export function netWorth(S,p){let v=p.money;for(const k in S.own)if(S.own[k]===p.id){const i=+k;v+=S.mort[i]?SQUARES[i].price/2:SQUARES[i].price;if(SQUARES[i].t==='prop')v+=housesOn(S,i)*houseCost(i)}return v}
export const propsOf=(S,pid)=>Object.keys(S.own).map(Number).filter(i=>S.own[i]===pid).sort((a,b)=>a-b);

// ---- tour
function startTurn(S){const p=cur(S);S.doubles=0;S.again=false;S.dice=null;S.pending=null;S.phase=p.jail>0?'jail':'roll';ev(S,{t:'turn',p:p.id})}
export function roll(S,forced){if(S.phase!=='roll')return false;const p=cur(S);const d=forced||[die(S),die(S)];S.dice=d;const dbl=d[0]===d[1];ev(S,{t:'dice',p:p.id,d});
 if(dbl){S.doubles++;if(S.doubles>=3){ev(S,{t:'quip',k:'three'});sendJail(S,p,'three');return true}}
 S.again=dbl;moveBy(S,p,d[0]+d[1]);land(S,p,d[0]+d[1]);after(S);return true}
function moveBy(S,p,steps){const from=p.pos,to=((from+steps)%N+N)%N;p.pos=to;ev(S,{t:'move',p:p.id,from,to,steps});if(steps>0&&to<from){p.money+=GO_SALARY;ev(S,{t:'go',p:p.id,amount:GO_SALARY})}}
function moveTo(S,p,to,back=false){if(back){ev(S,{t:'move',p:p.id,from:p.pos,to,steps:-(((p.pos-to)%N)+N)%N});p.pos=to;return}moveBy(S,p,((to-p.pos)%N+N)%N)}
function after(S){if(S.phase==='buy'||S.phase==='debt'||S.phase==='over')return;const p=cur(S);if(p.out)return;S.phase=S.again&&!p.jail?'roll':'end'}
function land(S,p,dice,special=null){const i=p.pos,s=SQUARES[i];ev(S,{t:'land',p:p.id,i});
 if(BUYABLE.has(s.t)){const o=S.own[i];if(o==null){S.phase='buy';S.pending={type:'buy',i};return}
  if(o!==p.id&&!S.mort[i]){const owner=S.players[o];if(owner.out)return;charge(S,p,o,rentOf(S,i,dice,special),{reason:'rent',i})}return}
 if(s.t==='tax')return charge(S,p,null,s.amount,{reason:'tax',i});
 if(s.t==='card')return draw(S,p,s.deck,dice);
 if(s.t==='gotojail')return sendJail(S,p,'square');
 if(s.t==='park')ev(S,{t:'quip',k:'park'});else if(s.t==='jail')ev(S,{t:'quip',k:'visit'})}
function charge(S,p,to,amount,info={}){if(amount<=0)return;if(p.money>=amount){pay(S,p,to,amount,info);return}
 S.phase='debt';S.pending={type:'debt',to,amount,...info};ev(S,{t:'debt',p:p.id,amount,to})}
function pay(S,p,to,amount,info={}){p.money-=amount;if(to==='each'){const others=active(S).filter(o=>o!==p),per=amount/others.length;for(const o of others){o.money+=per;ev(S,{t:'pay',from:p.id,to:o.id,amount:per,reason:info.reason})}return}
 if(to!=null)S.players[to].money+=amount;ev(S,{t:'pay',from:p.id,to,amount,reason:info.reason,i:info.i})}
function sendJail(S,p,why){p.pos=JAIL;p.jail=1;S.again=false;S.doubles=0;ev(S,{t:'jail',p:p.id,why});S.phase='end'}
function draw(S,p,deck,dice){const D=DECKS[deck];let idx,guard=0;do{idx=S.decks[deck][S.deckPos[deck]++%D.length]}while(S.held[deck].includes(idx)&&guard++<D.length);
 const card=D[idx],a=card.act;ev(S,{t:'card',p:p.id,deck,idx});
 if(a.money>0){p.money+=a.money;ev(S,{t:'pay',from:null,to:p.id,amount:a.money,reason:'card'})}
 else if(a.money<0)charge(S,p,null,-a.money,{reason:'card'});
 else if(a.move!=null){moveTo(S,p,a.move,a.back);land(S,p,dice)}
 else if(a.rel){moveTo(S,p,((p.pos+a.rel)%N+N)%N,true);land(S,p,dice)}
 else if(a.nearest){let j=p.pos;do{j=(j+1)%N}while(SQUARES[j].t!==a.nearest);moveTo(S,p,j);land(S,p,dice,a.nearest)}
 else if(a.jail)sendJail(S,p,'card');
 else if(a.jailCard){p.cards.push({deck,idx});S.held[deck].push(idx)}
 else if(a.repairs){let n=0;for(const i of propsOf(S,p.id)){const h=housesOn(S,i);n+=h===5?a.repairs[1]:h*a.repairs[0]}if(n)charge(S,p,null,n,{reason:'repairs'})}
 else if(a.each>0){for(const o of active(S))if(o!==p){const v=Math.min(o.money,a.each);o.money-=v;p.money+=v;if(v)ev(S,{t:'pay',from:o.id,to:p.id,amount:v,reason:'card'})}}
 else if(a.each<0){const others=active(S).filter(o=>o!==p);charge(S,p,'each',-a.each*others.length,{reason:'card'})}}
export function buy(S){if(S.phase!=='buy')return false;const p=cur(S),i=S.pending.i,price=SQUARES[i].price;if(p.money<price)return false;
 p.money-=price;S.own[i]=p.id;S.pending=null;ev(S,{t:'buy',p:p.id,i,price});S.phase='landed';after(S);return true}
export function decline(S){if(S.phase!=='buy')return false;ev(S,{t:'pass',p:cur(S).id,i:S.pending.i});S.pending=null;S.phase='landed';after(S);return true}
export function payDebt(S){if(S.phase!=='debt')return false;const p=cur(S),d=S.pending;if(p.money<d.amount)return false;pay(S,p,d.to,d.amount,d);S.pending=null;S.phase='landed';after(S);return true}
export function bankrupt(S){const p=cur(S);if(S.phase!=='debt'&&S.phase!=='end'&&S.phase!=='roll')return false;const d=S.pending,to=d&&typeof d.to==='number'?S.players[d.to]:null;
 for(const i of propsOf(S,p.id)){const h=housesOn(S,i);if(h){p.money+=h*houseCost(i)/2;delete S.houses[i]}if(to){S.own[i]=to.id}else{delete S.own[i];delete S.mort[i]}}
 if(to){to.money+=Math.max(0,p.money);for(const c of p.cards)to.cards.push(c)}else{for(const c of p.cards)S.held[c.deck]=S.held[c.deck].filter(x=>x!==c.idx)}
 p.money=0;p.cards=[];p.out=true;S.pending=null;ev(S,{t:'broke',p:p.id,to:to?to.id:null});
 if(active(S).length<=1){finish(S,active(S)[0]);return true}S.phase='end';endTurn(S);return true}
function finish(S,w){S.winner=w?w.id:null;S.phase='over';ev(S,{t:'over',winner:S.winner})}
export function endTurn(S){if(S.phase!=='end')return false;const n=S.players.length;let i=S.turn,wrapped=false;
 do{i=(i+1)%n;if(i<=S.turn)wrapped=true}while(S.players[i].out&&i!==S.turn);
 S.turnCount++;if(wrapped){S.round++;if(S.maxRounds&&S.round>S.maxRounds){const best=active(S).sort((a,b)=>netWorth(S,b)-netWorth(S,a))[0];finish(S,best);return true}}
 S.turn=i;startTurn(S);return true}
// prison
export function jailPay(S){if(S.phase!=='jail')return false;const p=cur(S);if(p.money<JAIL_FINE)return false;pay(S,p,null,JAIL_FINE,{reason:'jail'});p.jail=0;S.phase='roll';ev(S,{t:'free',p:p.id,how:'pay'});return true}
export function jailCard(S){if(S.phase!=='jail')return false;const p=cur(S);const c=p.cards.shift();if(!c)return false;S.held[c.deck]=S.held[c.deck].filter(x=>x!==c.idx);p.jail=0;S.phase='roll';ev(S,{t:'free',p:p.id,how:'card'});return true}
export function jailRoll(S,forced){if(S.phase!=='jail')return false;const p=cur(S),d=forced||[die(S),die(S)];S.dice=d;ev(S,{t:'dice',p:p.id,d,jail:true});
 if(d[0]===d[1]){p.jail=0;ev(S,{t:'free',p:p.id,how:'double'});S.again=false;moveBy(S,p,d[0]+d[1]);land(S,p,d[0]+d[1]);after(S);return true}
 p.jail++;if(p.jail<=3){S.phase='end';return true}
 // troisième échec : on paie l'amende et on sort
 p.jail=0;ev(S,{t:'free',p:p.id,how:'forced'});S.again=false;if(p.money>=JAIL_FINE){pay(S,p,null,JAIL_FINE,{reason:'jail'});moveBy(S,p,d[0]+d[1]);land(S,p,d[0]+d[1]);after(S)}else{S.phase='debt';S.pending={type:'debt',to:null,amount:JAIL_FINE,reason:'jail',thenMove:d[0]+d[1]}}return true}
// constructions et hypothèques (pendant son tour)
const mine=(S,i)=>S.own[i]===cur(S).id&&S.phase!=='over';
export function canBuild(S,i){if(!mine(S,i)||S.phase==='debt'||SQUARES[i].t!=='prop')return false;const g=SQUARES[i].g,h=housesOn(S,i);
 return ownsGroup(S,cur(S).id,g)&&groupClean(S,g)&&h<5&&h<=Math.min(...GROUP_IDX[g].map(j=>housesOn(S,j)))&&cur(S).money>=houseCost(i)}
export function build(S,i){if(!canBuild(S,i))return false;cur(S).money-=houseCost(i);S.houses[i]=housesOn(S,i)+1;ev(S,{t:'build',p:cur(S).id,i,h:S.houses[i]});return true}
export function canSell(S,i){if(!mine(S,i))return false;const h=housesOn(S,i);return h>0&&h>=Math.max(...GROUP_IDX[SQUARES[i].g].map(j=>housesOn(S,j)))}
export function sell(S,i){if(!canSell(S,i))return false;cur(S).money+=houseCost(i)/2;S.houses[i]--;if(!S.houses[i])delete S.houses[i];ev(S,{t:'sell',p:cur(S).id,i});return true}
export function canMortgage(S,i){if(!mine(S,i)||S.mort[i])return false;const s=SQUARES[i];return s.t!=='prop'||GROUP_IDX[s.g].every(j=>!housesOn(S,j))}
export function mortgage(S,i){if(!canMortgage(S,i))return false;S.mort[i]=true;cur(S).money+=mortgageValue(i);ev(S,{t:'mortgage',p:cur(S).id,i});return true}
export function canUnmortgage(S,i){return mine(S,i)&&S.mort[i]&&S.phase!=='debt'&&cur(S).money>=unmortgageCost(i)}
export function unmortgage(S,i){if(!canUnmortgage(S,i))return false;cur(S).money-=unmortgageCost(i);delete S.mort[i];ev(S,{t:'unmortgage',p:cur(S).id,i});return true}
// tout ce qu'on peut encore récupérer en vendant et en hypothéquant
export function liquidity(S,pid){let v=0;for(const i of propsOf(S,pid)){if(SQUARES[i].t==='prop')v+=housesOn(S,i)*houseCost(i)/2;if(!S.mort[i])v+=mortgageValue(i)}return v}
// la dette de prison payée, on avance
export function settleDebt(S){const d=S.pending;if(!payDebt(S))return false;if(d&&d.thenMove){const p=cur(S);moveBy(S,p,d.thenMove);land(S,p,d.thenMove);after(S)}return true}

// ---- échanges : propriétés (sans maisons dans leur groupe) et argent
export function tradeOk(S,t){const A=S.players[t.from],B=S.players[t.to];if(!A||!B||A.out||B.out||A===B)return false;
 const free=(i,pid)=>S.own[i]===pid&&(SQUARES[i].t!=='prop'||GROUP_IDX[SQUARES[i].g].every(j=>!housesOn(S,j)));
 return t.give.every(i=>free(i,A.id))&&t.get.every(i=>free(i,B.id))&&(t.money>=0?A.money>=t.money:B.money>=-t.money)&&(t.give.length||t.get.length)}
export function doTrade(S,t){if(!tradeOk(S,t))return false;for(const i of t.give)S.own[i]=t.to;for(const i of t.get)S.own[i]=t.from;S.players[t.from].money-=t.money;S.players[t.to].money+=t.money;ev(S,{t:'trade',from:t.from,to:t.to,give:t.give,get:t.get,money:t.money});return true}
// valeur d'une propriété pour un joueur : prix, + beaucoup si elle complète un groupe
export function valueFor(S,pid,i,without=[]){const s=SQUARES[i];let v=s.price;
 if(s.t==='prop'){const grp=GROUP_IDX[s.g],mineN=grp.filter(j=>j!==i&&S.own[j]===pid&&!without.includes(j)).length;if(mineN===grp.length-1)v*=2.6;else if(mineN)v*=1.35}
 else if(s.t==='station')v*=1+.25*countOwned(S,pid,'station');return v}
export function aiAccepts(S,t){const B=S.players[t.to];let gain=t.money;for(const i of t.give)gain+=valueFor(S,B.id,i);for(const i of t.get){gain-=valueFor(S,B.id,i)*1.15;if(SQUARES[i].t==='prop'&&ownsGroup(S,B.id,SQUARES[i].g))gain-=400}
 // ne jamais offrir un groupe complet à l'autre pour une bouchée de pain
 for(const i of t.get){const s=SQUARES[i];if(s.t==='prop'){const grp=GROUP_IDX[s.g];if(grp.every(j=>j===i||S.own[j]===t.from))gain-=s.price*1.2}}
 return gain>0&&B.money+t.money>=0}
// idée d'échange de l'ordinateur : une case contre de l'argent, ou un troc qui arrange les deux (chacun complète un groupe)
export function aiTradeIdea(S,pid){const p=S.players[pid];if(p.out)return null;const tradable=(i,o)=>S.own[i]===o&&(SQUARES[i].t!=='prop'||GROUP_IDX[SQUARES[i].g].every(j=>!housesOn(S,j)));
 let best=null;
 for(const o of active(S)){if(o===p)continue;const theirs=propsOf(S,o.id).filter(i=>tradable(i,o.id)),mine=[null,...propsOf(S,pid).filter(i=>tradable(i,pid))];
  for(const x of theirs){const want=valueFor(S,pid,x);if(want<SQUARES[x].price*1.3)continue;
   for(const y of mine){const lose=y==null?0:valueFor(S,pid,y)*1.1;
    for(const m of [0,50,100,200,300,-50,-100]){if(m>p.money-120)continue;const t={from:pid,to:o.id,give:y==null?[]:[y],get:[x],money:y==null?Math.max(m,Math.round(SQUARES[x].price*1.6/10)*10):m};
     if(t.money>p.money-120)continue;const gain=want-lose-t.money;if(gain<60)continue;if(!tradeOk(S,t)||!aiAccepts(S,t))continue;if(!best||gain>best.gain)best={...t,gain}}}}}
 if(!best)return null;const {gain,...t}=best;return t}
// ---- ordinateur : renvoie la prochaine action à faire
const reserve=S=>150+Math.min(250,S.round*8);
export function aiAction(S){const p=cur(S);if(p.out||S.phase==='over')return null;const lvl=p.level??1;
 if(S.phase==='jail'){if(p.cards.length)return {a:'jailCard'};const free=SQUARES.filter((s,i)=>isBuyable(i)&&S.own[i]==null).length;return free>8&&p.money>350?{a:'jailPay'}:{a:'jailRoll'}}
 if(S.phase==='debt'){const d=S.pending;if(p.money>=d.amount)return {a:'payDebt'};
  const props=propsOf(S,p.id);const sellable=props.filter(i=>canSell(S,i)).sort((a,b)=>houseCost(a)-houseCost(b));if(sellable.length)return {a:'sell',i:sellable[0]};
  const morts=props.filter(i=>canMortgage(S,i)).sort((a,b)=>(SQUARES[a].t==='prop'&&ownsGroup(S,p.id,SQUARES[a].g)?1:0)-(SQUARES[b].t==='prop'&&ownsGroup(S,p.id,SQUARES[b].g)?1:0)||SQUARES[a].price-SQUARES[b].price);
  if(morts.length)return {a:'mortgage',i:morts[0]};return {a:'bankrupt'}}
 if(S.phase==='buy'){const i=S.pending.i,s=SQUARES[i],price=s.price;const completes=s.t==='prop'&&GROUP_IDX[s.g].every(j=>j===i||S.own[j]===p.id);
  const blocks=s.t==='prop'&&active(S).some(o=>o!==p&&GROUP_IDX[s.g].filter(j=>S.own[j]===o.id).length===GROUP_IDX[s.g].length-1);
  const keep=lvl===0?250:80;if(p.money-price>=keep||(completes||blocks)&&p.money>=price+20)return {a:'buy'};return {a:'decline'}}
 if(S.phase==='roll'||S.phase==='end'){
  // dégager les hypothèques quand on a de quoi
  if(p.money>700){const m=propsOf(S,p.id).find(i=>canUnmortgage(S,i));if(m!=null)return {a:'unmortgage',i:m}}
  // construire : d'abord jusqu'à 3 cabanons, puis plus si on est riche
  const cand=propsOf(S,p.id).filter(i=>canBuild(S,i)&&p.money-houseCost(i)>=reserve(S)&&(housesOn(S,i)<3||p.money>900));
  if(cand.length){cand.sort((a,b)=>housesOn(S,a)-housesOn(S,b)||houseCost(b)-houseCost(a));return {a:'build',i:cand[0]}}
  return S.phase==='roll'?{a:'roll'}:{a:'endTurn'}}
 return null}
export function act(S,x){switch(x?.a){case 'roll':return roll(S,x.d);case 'buy':return buy(S);case 'decline':return decline(S);case 'payDebt':return settleDebt(S);case 'bankrupt':return bankrupt(S);
 case 'endTurn':return endTurn(S);case 'jailPay':return jailPay(S);case 'jailCard':return jailCard(S);case 'jailRoll':return jailRoll(S,x.d);
 case 'build':return build(S,x.i);case 'sell':return sell(S,x.i);case 'mortgage':return mortgage(S,x.i);case 'unmortgage':return unmortgage(S,x.i);case 'trade':return doTrade(S,x.t)}return false}
// état sauvegardable (sans la file d'événements)
export const snapshot=S=>JSON.parse(JSON.stringify({...S,ev:[]}));
