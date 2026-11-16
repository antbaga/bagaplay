// BagaWorld : moteur de combat tactique au tour par tour (sans DOM, déterministe : graine + liste d'actions).
// Grille de cases (0 sol, 1 obstacle qui bloque la vue, 2 trou), deux équipes, phase de placement puis tours dans
// l'ordre d'initiative (équipes alternées). Chaque tour : PA pour les sorts, PM pour bouger ; tacle quand on quitte
// le contact d'un ennemi ; ligne de vue ; portées en losange ; zones ; poussées ; poisons, soins sur la durée, pièges,
// invisibilité, bonus et malus. Les monstres jouent avec une petite IA. Tous les clients d'un combat de groupe
// rejouent les mêmes actions et obtiennent le même résultat (étape 2 : en ligne).
import {SPELLS,EL} from './bagaworld-data.js';

export function rng(seed){let a=seed>>>0||1;const f=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};f.state=()=>a;f.set=v=>{a=v};return f}
const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
export const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);

// ---- création. arena : {w,h,grid,start:[[cells équipe 0],[cells équipe 1]]}
export function newFight(arena,teams,seed=1){const S={w:arena.w,h:arena.h,grid:arena.grid.slice(),start:arena.start,f:[],order:[],turn:0,round:1,phase:'place',traps:[],rnd:rng(seed),ev:[],winner:null,nextId:1,log:[]};
 teams.forEach((list,team)=>list.forEach(src=>S.f.push(fighter(S,src,team))));
 // placement par défaut : les cases de départ de chaque équipe dans l'ordre
 for(const team of [0,1]){const cells=S.start[team].slice();S.f.filter(f=>f.team===team).forEach((f,i)=>{const c=cells[i%cells.length];f.x=c[0];f.y=c[1]})}
 return S}
function fighter(S,src,team){const st=src.stats||{};return {id:src.id??('f'+S.nextId++),name:src.name,team,kind:src.kind||'mob',cls:src.cls,mob:src.mob,lvl:src.lvl||1,
 maxHp:src.maxHp,hp:src.hp??src.maxHp,pa0:src.pa||6,pm0:src.pm||3,pa:0,pm:0,stats:{str:st.str||0,int:st.int||0,cha:st.cha||0,agi:st.agi||0,wis:st.wis||0},
 power:src.power||0,res:{...(src.res||{})},range:src.range||0,crit:src.crit||0,heal:src.heal||0,init:src.init||0,spells:src.spells||[],weapon:src.weapon||null,
 ai:src.ai||null,x:0,y:0,alive:true,buffs:[],cds:{},uses:{},invis:0,look:src.look||null,boss:!!src.boss,ready:false}}

// ---- grille
export const inside=(S,x,y)=>x>=0&&y>=0&&x<S.w&&y<S.h;
export const cell=(S,x,y)=>inside(S,x,y)?S.grid[y*S.w+x]:1;
export const at=(S,x,y)=>S.f.find(f=>f.alive&&f.x===x&&f.y===y);
export const walkable=(S,x,y)=>cell(S,x,y)===0;
export const free=(S,x,y)=>walkable(S,x,y)&&!at(S,x,y);
export const enemiesOf=(S,f)=>S.f.filter(o=>o.alive&&o.team!==f.team);
export const alliesOf=(S,f)=>S.f.filter(o=>o.alive&&o.team===f.team);
export const current=S=>S.phase==='fight'?S.f.find(f=>f.id===S.order[S.turn]):null;
// ligne de vue : la droite entre les deux centres ne traverse ni obstacle ni combattant (les extrémités ne comptent pas)
export function los(S,x0,y0,x1,y1){const dx=x1-x0,dy=y1-y0,n=Math.max(Math.abs(dx),Math.abs(dy))*6;if(!n)return true;const seen=new Set();
 for(let i=1;i<n;i++){const t=i/n,cx=x0+dx*t,cy=y0+dy*t;
  // on teste la case sous le point, et les deux voisines quand on frôle un coin (évite de voir « entre » deux obstacles)
  const cand=[[Math.round(cx),Math.round(cy)]];const fx=cx-Math.floor(cx),fy=cy-Math.floor(cy);if(Math.abs(fx-.5)<.02&&Math.abs(fy-.5)<.02)cand.push([Math.floor(cx),Math.floor(cy)],[Math.ceil(cx),Math.ceil(cy)]);
  let blocked=0;for(const [x,y] of cand){const k=x+y*S.w;if((x===x0&&y===y0)||(x===x1&&y===y1))continue;if(!seen.has(k)){seen.add(k)}if(cell(S,x,y)===1||at(S,x,y))blocked++}
  if(blocked&&blocked>=cand.filter(([x,y])=>!((x===x0&&y===y0)||(x===x1&&y===y1))).length)return false}
 return true}
// cases touchées par une zone autour de (x,y) ; pour les lignes, direction depuis le lanceur
export function zone(S,aoe,x,y,from){const out=[];const r=aoe?.r||0,s=aoe?.s||'cell';
 if(s==='line'){const dx=Math.sign(x-from.x),dy=Math.sign(y-from.y);for(let k=0;k<=r;k++){const cx=x+dx*k,cy=y+dy*k;if(inside(S,cx,cy))out.push([cx,cy])}return out}
 for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++){const d=Math.abs(i)+Math.abs(j);if(d>r)continue;if(s==='cross'&&i&&j)continue;if(s==='ring'&&d!==r)continue;if(s==='cell'&&d)continue;const cx=x+i,cy=y+j;if(inside(S,cx,cy))out.push([cx,cy])}
 return out}

// ---- caractéristiques du moment (bonus / malus actifs)
export const buffSum=(f,stat)=>f.buffs.reduce((s,b)=>s+(b.stat===stat?b.v:0),0);
export function spellRange(f,sp){const [a,b]=sp.range;return [a,b>1?Math.max(a,b+f.range+buffSum(f,'range')):b]}
export function spellOf(f,id){if(id==='weapon'){const w=f.weapon;return w?{fr:'Arme',en:'Weapon',ic:'⚔️',pa:w.pa,range:w.range,los:true,target:'enemy',perTurn:2,fx:[{t:'dmg',el:w.el,min:w.min,max:w.max}]}:null}return SPELLS[id]||null}
// peut-on lancer ce sort sur cette case ? renvoie null si oui, sinon la raison
export function canCast(S,f,id,x,y){const sp=spellOf(f,id);if(!sp)return 'sort';if(S.phase!=='fight'||current(S)!==f)return 'tour';
 if(f.pa<sp.pa)return 'pa';if((f.cds[id]||0)>0)return 'cd';if(sp.perTurn&&(f.uses[id]||0)>=sp.perTurn)return 'relance';
 if(!inside(S,x,y))return 'portee';const d=Math.abs(x-f.x)+Math.abs(y-f.y),[a,b]=spellRange(f,sp);if(d<a||d>b)return 'portee';
 if(sp.line&&x!==f.x&&y!==f.y)return 'ligne';if(sp.los&&d>0&&!los(S,f.x,f.y,x,y))return 'vue';
 const o=at(S,x,y),c=cell(S,x,y);
 switch(sp.target){case 'self':if(d)return 'cible';break;case 'enemy':if(!o||o.team===f.team)return 'cible';break;case 'ally':if(!o||o.team!==f.team)return 'cible';break;
  case 'empty':if(o||c!==0)return 'cible';break;case 'any':if(c===1)return 'cible';break}
 return null}
export function castCells(S,f,id){const out=[];for(let y=0;y<S.h;y++)for(let x=0;x<S.w;x++)if(!canCast(S,f,id,x,y))out.push([x,y]);return out}
// cases à portée (pour l'affichage, sans tenir compte de la cible), et celles bloquées par la vue
export function rangeCells(S,f,id){const sp=spellOf(f,id);if(!sp)return {ok:[],blocked:[]};const [a,b]=spellRange(f,sp),ok=[],blocked=[];
 for(let y=0;y<S.h;y++)for(let x=0;x<S.w;x++){const d=Math.abs(x-f.x)+Math.abs(y-f.y);if(d<a||d>b||cell(S,x,y)===1)continue;if(sp.line&&x!==f.x&&y!==f.y)continue;
  (sp.los&&d>0&&!los(S,f.x,f.y,x,y)?blocked:ok).push([x,y])}return {ok,blocked}}

// ---- déplacement : chemin le plus court sur les cases libres
export function paths(S,f,max=f.pm){const D=new Map(),prev=new Map(),k=(x,y)=>x+','+y,q=[[f.x,f.y]];D.set(k(f.x,f.y),0);
 while(q.length){const [x,y]=q.shift(),d=D.get(k(x,y));if(d>=max)continue;for(const [dx,dy] of DIRS){const nx=x+dx,ny=y+dy,kk=k(nx,ny);if(D.has(kk)||!free(S,nx,ny))continue;D.set(kk,d+1);prev.set(kk,[x,y]);q.push([nx,ny])}}
 return {D,prev,path(x,y){const out=[];let c=[x,y];if(!D.has(k(x,y)))return null;while(!(c[0]===f.x&&c[1]===f.y)){out.unshift(c);c=prev.get(k(c[0],c[1]))}return out}}}
export const contact=(S,f,x=f.x,y=f.y)=>enemiesOf(S,f).filter(o=>!o.invis&&Math.abs(o.x-x)+Math.abs(o.y-y)===1);
const tackleOf=o=>Math.floor(o.stats.agi/10)+(o.kind==='mob'?Math.floor(o.lvl/4):0)+buffSum(o,'tackle');
const fleeOf=f=>Math.floor(f.stats.agi/10)+buffSum(f,'flee');
// part de PA/PM gardée en quittant le contact (formule à la Dofus 2)
export function escape(S,f,x=f.x,y=f.y){const c=contact(S,f,x,y);if(!c.length)return 1;const t=c.reduce((s,o)=>s+tackleOf(o),0);return Math.max(0,Math.min(1,(fleeOf(f)+2)/(2*(t+2))))}

// ---- jouer une action. Renvoie true si l'action est valide (et l'applique), false sinon.
export function act(S,a){if(S.phase==='over')return false;const ev=e=>S.ev.push(e);
 if(a.a==='place'){if(S.phase!=='place')return false;const f=S.f.find(o=>o.id===a.id);if(!f||!S.start[f.team].some(c=>c[0]===a.x&&c[1]===a.y))return false;
  const o=at(S,a.x,a.y);if(o){o.x=f.x;o.y=f.y}f.x=a.x;f.y=a.y;ev({t:'place',id:f.id});return true}
 if(a.a==='ready'){if(S.phase!=='place')return false;const f=a.id?S.f.find(o=>o.id===a.id):null;if(f)f.ready=true;
  if(a.id&&S.f.some(o=>o.kind==='player'&&!o.ready))return true;start(S);return true}
 // en ligne : un joueur rejoint pendant le placement, le placement est forcé à la fin du délai, un joueur abandonne
 if(a.a==='join'){if(S.phase!=='place'||!a.f||S.f.some(o=>o.id===a.f.id))return false;const team=a.team??0;
  if(S.f.filter(o=>o.team===team&&o.kind==='player').length>=4)return false;const nf=fighter(S,{...a.f,kind:'player'},team);
  const c=S.start[team].find(([x,y])=>!S.f.some(o=>o.alive&&o.x===x&&o.y===y));if(!c)return false;nf.x=c[0];nf.y=c[1];S.f.push(nf);ev({t:'join',id:nf.id});return true}
 if(a.a==='go'){if(S.phase!=='place')return false;start(S);return true}
 if(a.a==='quit'){const q=S.f.find(o=>o.id===a.id&&o.alive);if(!q)return false;
  if(S.phase==='place'){S.f=S.f.filter(o=>o!==q);ev({t:'quit',id:q.id});if(S.f.filter(o=>o.kind==='player').length&&S.f.filter(o=>o.kind==='player').every(o=>o.ready))start(S);return true}
  ev({t:'quit',id:q.id});kill(S,q);return true}
 const f=current(S);if(!f)return false;if(a.id&&a.id!==f.id)return false;
 if(a.a==='end'){endTurn(S);return true}
 if(a.a==='move'){let ok=false;for(const [x,y] of a.path){if(f.pm<1||!free(S,x,y)||Math.abs(x-f.x)+Math.abs(y-f.y)!==1)break;
   // tacle : on perd une partie de ses PA/PM en quittant le contact
   const keep=escape(S,f);if(keep<1){const lpm=Math.ceil(f.pm*(1-keep)),lpa=Math.ceil(f.pa*(1-keep)*.5);f.pm-=lpm;f.pa-=lpa;ev({t:'tackle',id:f.id,pm:lpm,pa:lpa});if(f.pm<1)break}
   f.x=x;f.y=y;f.pm--;ok=true;ev({t:'step',id:f.id,x,y});
   const tr=S.traps.find(t=>t.x===x&&t.y===y&&t.team!==f.team);if(tr){triggerTrap(S,tr);if(!f.alive||S.phase==='over')break;break}}
  return ok}
 if(a.a==='cast'){const why=canCast(S,f,a.spell,a.x,a.y);if(why)return false;cast(S,f,a.spell,a.x,a.y);return true}
 return false}

function start(S){S.phase='fight';const t0=S.f.filter(f=>f.team===0).sort((a,b)=>b.init-a.init),t1=S.f.filter(f=>f.team===1).sort((a,b)=>b.init-a.init);
 const first=(t0[0]?.init||0)>=(t1[0]?.init||0)?[t0,t1]:[t1,t0];S.order=[];for(let i=0;i<Math.max(t0.length,t1.length);i++){if(first[0][i])S.order.push(first[0][i].id);if(first[1][i])S.order.push(first[1][i].id)}
 S.turn=0;S.ev.push({t:'start'});beginTurn(S)}
function beginTurn(S){const f=current(S);if(!f)return;if(!f.alive)return nextTurn(S);
 // effets sur la durée au début du tour de la cible
 for(const b of f.buffs.filter(b=>b.dot||b.hot)){if(b.dot)hurt(S,null,f,b.v,b.el,{dot:true});else heal(S,null,f,b.v,{hot:true});if(!f.alive){if(!S.winner)nextTurn(S);return}}
 f.pa=Math.max(0,f.pa0+buffSum(f,'pa'));f.pm=Math.max(0,f.pm0+buffSum(f,'pm'));f.uses={};
 for(const k in f.cds)if(f.cds[k]>0)f.cds[k]--;
 for(const b of f.buffs)b.dur--;f.buffs=f.buffs.filter(b=>b.dur>0);if(f.invis>0)f.invis--;
 S.ev.push({t:'turn',id:f.id,round:S.round})}
function endTurn(S){const f=current(S);S.ev.push({t:'endturn',id:f?.id});nextTurn(S)}
function nextTurn(S){if(S.phase==='over')return;for(let k=0;k<S.order.length;k++){S.turn++;if(S.turn>=S.order.length){S.turn=0;S.round++}const f=current(S);if(f&&f.alive)return beginTurn(S)}}

// ---- sorts
function roll(S,min,max){return min+Math.floor(S.rnd()*(max-min+1))}
// les sorts des personnages montent en puissance avec le niveau (comme les rangs de sorts)
export const rank=f=>f.kind==='player'?1+.035*(f.lvl-1):1;
function cast(S,f,id,x,y){const sp=spellOf(f,id);f.pa-=sp.pa;f.uses[id]=(f.uses[id]||0)+1;if(sp.cd)f.cds[id]=sp.cd+1;
 const crit=S.rnd()<Math.min(.5,.03+f.crit/100+f.stats.agi/2000);S.ev.push({t:'cast',id:f.id,spell:id,x,y,crit});
 const cells=zone(S,sp.aoe,x,y,f);let dealt=0;
 for(const e of sp.fx){
  if(e.t==='dmg'){for(const [cx,cy] of cells){const o=at(S,cx,cy);if(!o||(e.enemiesOnly&&o.team===f.team))continue;let mult=crit?1.25:1;if(e.invisBonus&&f.invis>0)mult*=1+e.invisBonus/100;dealt+=hurt(S,f,o,roll(S,e.min,e.max)*rank(f),e.el,{mult,crit})}}
  else if(e.t==='heal'){for(const [cx,cy] of cells){const o=at(S,cx,cy);if(!o||(e.alliesOnly&&o.team!==f.team))continue;heal(S,f,o,roll(S,e.min,e.max)*rank(f),{crit})}}
  else if(e.t==='push'||e.t==='pull'){for(const [cx,cy] of cells){const o=at(S,cx,cy);if(o&&o!==f)push(S,f,o,e.t==='push'?e.n:-e.n)}}
  else if(e.t==='tp'){if(free(S,x,y)){f.x=x;f.y=y;S.ev.push({t:'tp',id:f.id,x,y});const tr=S.traps.find(t=>t.x===x&&t.y===y&&t.team!==f.team);if(tr)triggerTrap(S,tr)}}
  else if(e.t==='dmgAround'){for(const [dx,dy] of DIRS){const o=at(S,f.x+dx,f.y+dy);if(o&&o.team!==f.team)dealt+=hurt(S,f,o,roll(S,e.min,e.max)*rank(f),e.el,{crit})}}
  else if(e.t==='dash'){const dx=Math.sign(x-f.x),dy=Math.sign(y-f.y);while(Math.abs(x-f.x)+Math.abs(y-f.y)>1&&free(S,f.x+dx,f.y+dy)){f.x+=dx;f.y+=dy}S.ev.push({t:'dash',id:f.id,x:f.x,y:f.y})}
  else if(e.t==='drain'){if(dealt>0)heal(S,f,f,Math.ceil(dealt/2),{})}
  else if(e.t==='buff'||e.t==='debuff'){for(const [cx,cy] of cells){const o=at(S,cx,cy);if(!o)continue;o.buffs.push({stat:e.stat,v:e.t==='debuff'?-e.v:e.v,dur:e.dur+(o===f?1:0),src:f.id});
    // un malus de PA/PM sur le combattant en train de jouer s'applique tout de suite
    if(o===current(S)&&e.t==='debuff'){if(e.stat==='pa')o.pa=Math.max(0,o.pa-e.v);if(e.stat==='pm')o.pm=Math.max(0,o.pm-e.v)}
    if(o===current(S)&&e.t==='buff'){if(e.stat==='pa')o.pa+=e.v;if(e.stat==='pm')o.pm+=e.v}
    S.ev.push({t:e.t,id:o.id,stat:e.stat,v:e.v,dur:e.dur})}}
  else if(e.t==='poison'||e.t==='hot'){for(const [cx,cy] of cells){const o=at(S,cx,cy);if(!o)continue;const v=e.t==='poison'?Math.round(e.v*(100+Math.max(0,f.stats[EL[e.el].stat])+f.power)/100):Math.round(e.v*(100+f.stats.int+f.heal)/100);
    o.buffs.push(e.t==='poison'?{dot:1,v,el:e.el,dur:e.dur+1,src:f.id}:{hot:1,v,dur:e.dur+1,src:f.id});S.ev.push({t:e.t,id:o.id,v,dur:e.dur})}}
  else if(e.t==='invis'){f.invis=e.dur+1;S.ev.push({t:'invis',id:f.id})}
  else if(e.t==='trap'){S.traps.push({x,y,team:f.team,owner:f.id,aoe:e.aoe,fx:e.fx,src:f.id});S.ev.push({t:'trap',id:f.id,x,y})}}
 check(S)}
function triggerTrap(S,tr){S.traps.splice(S.traps.indexOf(tr),1);S.ev.push({t:'boom',x:tr.x,y:tr.y,team:tr.team});const src=S.f.find(o=>o.id===tr.src);
 for(const [cx,cy] of zone(S,tr.aoe,tr.x,tr.y,{x:tr.x,y:tr.y})){const o=at(S,cx,cy);if(!o||o.team===tr.team)continue;for(const e of tr.fx)if(e.t==='dmg')hurt(S,src,o,roll(S,e.min,e.max),e.el,{})}
 check(S)}
// dégâts : base × (100 + caractéristique de l'élément + puissance) / 100, moins les résistances en %
export function hurt(S,src,o,base,el,{mult=1,crit=false,dot=false}={}){if(!o.alive)return 0;const sf=typeof src==='object'?src:S.f.find(f=>f.id===src);
 const stat=sf&&!dot?Math.max(0,sf.stats[EL[el].stat])+sf.power+buffSum(sf,'power'):0;let d=Math.floor(base*(100+stat)/100*mult);
 const res=Math.min(80,(o.res[el]||0)+buffSum(o,'res'));d=Math.max(0,Math.round(d*(1-res/100)));o.hp=Math.max(0,o.hp-d);
 S.ev.push({t:'dmg',id:o.id,v:d,el,crit,dot});if(o.hp<=0)kill(S,o);return d}
export function heal(S,src,o,base,{crit=false,hot=false}={}){if(!o.alive)return 0;const sf=typeof src==='object'?src:S.f.find(f=>f.id===src);
 const v=hot?base:Math.floor(base*(100+(sf?sf.stats.int+sf.heal:0))/100*(crit?1.25:1));const got=Math.min(v,o.maxHp-o.hp);o.hp+=got;S.ev.push({t:'heal',id:o.id,v:got,crit,hot});return got}
function push(S,f,o,n){const dx=Math.sign(o.x-f.x),dy=Math.sign(o.y-f.y);const sx=n>0?dx:-dx,sy=n>0?dy:-dy;let left=Math.abs(n);
 while(left>0){const nx=o.x+sx,ny=o.y+sy;if(!free(S,nx,ny)||(n<0&&nx===f.x&&ny===f.y))break;o.x=nx;o.y=ny;left--}
 S.ev.push({t:'push',id:o.id,x:o.x,y:o.y});
 // contre un obstacle : dégâts de poussée
 if(n>0&&left>0){const d=left*(4+Math.floor(f.lvl/10));o.hp=Math.max(0,o.hp-d);S.ev.push({t:'dmg',id:o.id,v:d,el:'neutral',push:true});if(o.hp<=0)kill(S,o)}
 const tr=S.traps.find(t=>t.x===o.x&&t.y===o.y&&t.team!==o.team);if(tr)triggerTrap(S,tr)}
function kill(S,o){o.alive=false;o.hp=0;S.ev.push({t:'die',id:o.id});check(S)}
function check(S){if(S.phase==='over')return;for(const team of [0,1])if(!S.f.some(f=>f.team===team&&f.alive)){S.phase='over';S.winner=1-team;S.ev.push({t:'over',winner:1-team});return}
 const c=current(S);if(c&&!c.alive&&S.phase==='fight')nextTurn(S)}

// ---- IA des monstres : renvoie les actions de son tour (une par une, pour pouvoir les animer)
export function aiAction(S){const f=current(S);if(!f||S.phase!=='fight')return null;
 // un ennemi invisible n'est visé que s'il est collé au monstre (il le « sent »)
 const targets=enemiesOf(S,f).filter(o=>!o.invis||Math.abs(o.x-f.x)+Math.abs(o.y-f.y)===1),allies=alliesOf(S,f);
 const castable=[...f.spells,...(f.weapon?['weapon']:[])].map(id=>[id,spellOf(f,id)]).filter(([id,sp])=>sp&&sp.pa<=f.pa&&!(f.cds[id]>0)&&!(sp.perTurn&&(f.uses[id]||0)>=sp.perTurn));
 // 1) soigner un allié en difficulté, se protéger
 for(const [id,sp] of castable){if(sp.fx.some(e=>e.t==='heal')){const hurtA=allies.filter(o=>o.hp<o.maxHp*.65).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp);for(const o of hurtA)if(!canCast(S,f,id,o.x,o.y))return {a:'cast',spell:id,x:o.x,y:o.y}}
  if(sp.target==='self'&&sp.fx.some(e=>e.t==='buff')&&f.hp<f.maxHp*.75&&!canCast(S,f,id,f.x,f.y))return {a:'cast',spell:id,x:f.x,y:f.y}}
 // 2) attaquer d'ici si possible (la cible la plus faible)
 const attack=()=>{let best=null;for(const [id,sp] of castable){if(!sp.fx.some(e=>e.t==='dmg'||e.t==='poison'))continue;
   for(const o of targets){const cand=sp.aoe&&sp.target==='any'?[[o.x,o.y]]:[[o.x,o.y]];for(const [x,y] of cand){if(canCast(S,f,id,x,y))continue;
     if(sp.aoe&&zone(S,sp.aoe,x,y,f).some(([cx,cy])=>{const a=at(S,cx,cy);return a&&a.team===f.team&&!sp.fx.every(e=>e.enemiesOnly||e.t!=='dmg')}))continue;
     const avg=sp.fx.filter(e=>e.t==='dmg').reduce((s,e)=>s+(e.min+e.max)/2,0)+sp.fx.filter(e=>e.t==='poison').reduce((s,e)=>s+e.v*e.dur,0);
     const score=avg*(o.hp<=avg*1.5?2:1)-o.hp/100;if(!best||score>best.score)best={score,a:{a:'cast',spell:id,x,y}}}}}return best?.a};
 const now=attack();if(now)return now;
 // 3) se déplacer vers une case d'où une attaque est possible (ou se rapprocher / s'éloigner)
 if(f.pm>0&&targets.length){const P=paths(S,f);let best=null;
  const dmgSpells=castable.filter(([,sp])=>sp.fx.some(e=>e.t==='dmg'||e.t==='poison'));
  const struck=Object.keys(f.uses).length>0;
  for(const [k,d] of P.D){const [x,y]=k.split(',').map(Number);const near=Math.min(...targets.map(o=>Math.abs(o.x-x)+Math.abs(o.y-y)));
   let can=false;for(const [id,sp] of dmgSpells){const [a,b]=spellRange(f,sp);for(const o of targets){const dd=Math.abs(o.x-x)+Math.abs(o.y-y);if(dd<a||dd>b)continue;if(sp.line&&o.x!==x&&o.y!==y)continue;
     if(sp.los&&dd>0){const ox=f.x,oy=f.y;f.x=x;f.y=y;const ok=los(S,x,y,o.x,o.y);f.x=ox;f.y=oy;if(!ok)continue}can=true;break}if(can)break}
   // peureux : s'approche pour taper, puis s'enfuit une fois qu'il a tapé ; à distance : garde 3-4 cases
   let score=(can?100:0)-d*.5;if(f.ai==='melee')score-=near*3;else if(f.ai==='ranged'||f.ai==='healer')score+=!dmgSpells.length?Math.min(near,7)*3:can?Math.min(near,5)*2:-near*2;else if(f.ai==='coward')score+=struck?near*4:can?near:-near*3;
   if(!best||score>best.score+1e-9)best={score,x,y,d}}
  if(best&&best.d>0){const path=P.path(best.x,best.y);if(path&&path.length)return {a:'move',path}}}
 // 4) les peureux s'éloignent après avoir tapé
 return {a:'end'}}

// ---- résumé pour l'interface et la synchronisation
export function snapshot(S){const {rnd,ev,...rest}=S;return JSON.parse(JSON.stringify({...rest,rng:rnd.state()}))}
export function restore(snap){const S={...JSON.parse(JSON.stringify(snap)),ev:[]};S.rnd=rng(1);S.rnd.set(snap.rng);delete S.rng;return S}
