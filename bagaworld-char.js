// BagaWorld : personnage (création, niveaux, caractéristiques, équipement, inventaire, quêtes, récompenses de combat).
import {CLASSES,SPELLS,MOBS,ITEMS,QUESTS,SLOTS,classSpells,levelOf,xpFor,MAX_LVL,JOBS,RECIPES,SETS,jobLevelOf,jobXpFor,JOB_MAX} from './bagaworld-data.js';

export const POINTS_PER_LVL=5;
export function newChar(name,cls,look={}){return {v:1,name:String(name).slice(0,16),cls,look:{skin:look.skin||'#f2c493',hair:look.hair||'#5a3a24',sex:look.sex||'m'},
 xp:0,kamas:30,points:0,base:{vit:0,wis:0,str:0,int:0,cha:0,agi:0},eq:{weapon:'baton'},inv:{potion:2,pain:3},quests:{},done:{},kills:{},jobs:{},pos:null,hp:null,created:Date.now()}}
export const level=ch=>levelOf(ch.xp);
export const spellsOf=ch=>classSpells(ch.cls).filter(id=>SPELLS[id].lvl<=level(ch));
// caractéristiques totales (base + points + équipement)
export function derived(ch){const C=CLASSES[ch.cls],L=level(ch),st={vit:0,wis:0,str:0,int:0,cha:0,agi:0,pa:0,pm:0,range:0,power:0,init:0,crit:0,heal:0};
 for(const k in ch.base)st[k]+=ch.base[k];
 for(const slot of SLOTS){const it=ITEMS[ch.eq[slot]];if(it?.stats)for(const k in it.stats)st[k]=(st[k]||0)+it.stats[k]}
 for(const b of setBonuses(ch))for(const k in b.stats)st[k]=(st[k]||0)+b.stats[k];
 const maxHp=C.hp+8*(L-1)+st.vit;
 return {lvl:L,maxHp,pa:6+st.pa+(L>=20?1:0),pm:3+st.pm,stats:{str:st.str,int:st.int,cha:st.cha,agi:st.agi,wis:st.wis},power:st.power,range:st.range,crit:st.crit,heal:st.heal,
  init:st.str+st.int+st.cha+st.agi+st.init+L*2,vit:st.vit,res:{},weapon:ITEMS[ch.eq.weapon]?.weapon||null}}
export function fighterOf(ch,id){const d=derived(ch);return {id,name:ch.name,kind:'player',cls:ch.cls,lvl:d.lvl,maxHp:d.maxHp,hp:Math.max(1,Math.min(d.maxHp,ch.hp??d.maxHp)),pa:d.pa,pm:d.pm,
 stats:d.stats,power:d.power,range:d.range,crit:d.crit,heal:d.heal,init:d.init,res:d.res,spells:spellsOf(ch),weapon:d.weapon,look:{cls:ch.cls,...ch.look,eq:{...ch.eq}}}}
export function mobFighter(id,lvl,uid){const m=MOBS[id],s=m.stat+lvl*2;return {id:uid,name:m.fr,kind:'mob',mob:id,lvl,maxHp:m.hp0+m.hp*lvl,pa:m.pa,pm:m.pm,init:m.init+lvl*2,
 stats:{str:s,int:s,cha:s,agi:Math.round(m.stat/2+lvl*1.5),wis:0},res:{...m.res},spells:m.spells.slice(),ai:m.ai,boss:!!m.boss}}

// ---- points de caractéristiques (1 point = 1, sauf la sagesse : 3 points)
export const COST={vit:1,wis:3,str:1,int:1,cha:1,agi:1};
export function spend(ch,stat,n=1){const c=COST[stat]*n;if(!COST[stat]||ch.points<c)return false;ch.points-=c;ch.base[stat]+=n;return true}
export function resetStats(ch){let back=0;for(const k in ch.base){back+=ch.base[k]*COST[k];ch.base[k]=0}ch.points+=back;return back}

// ---- inventaire et équipement
export const addItem=(ch,id,n=1)=>{ch.inv[id]=(ch.inv[id]||0)+n};
export function takeItem(ch,id,n=1){if((ch.inv[id]||0)<n)return false;ch.inv[id]-=n;if(!ch.inv[id])delete ch.inv[id];return true}
export function canEquip(ch,id){const it=ITEMS[id];return !!(it&&it.slot&&level(ch)>=(it.lvl||1)&&(ch.inv[id]||0)>0)}
export function equip(ch,id){if(!canEquip(ch,id))return false;const it=ITEMS[id],old=ch.eq[it.slot];takeItem(ch,id);if(old)addItem(ch,old);ch.eq[it.slot]=id;clampHp(ch);return true}
export function unequip(ch,slot){const id=ch.eq[slot];if(!id)return false;delete ch.eq[slot];addItem(ch,id);clampHp(ch);return true}
export function clampHp(ch){const m=derived(ch).maxHp;if(ch.hp!=null)ch.hp=Math.min(ch.hp,m)}
export function useItem(ch,id){const it=ITEMS[id];if(!it?.use||!takeItem(ch,id))return 0;const m=derived(ch).maxHp,hp=ch.hp??m,got=Math.min(it.use.heal||0,m-hp);ch.hp=hp+got;return got}
export function buy(ch,id,n=1){const it=ITEMS[id];if(!it)return false;const p=it.price*n;if(ch.kamas<p)return false;ch.kamas-=p;addItem(ch,id,n);return true}
export function sell(ch,id,n=1){const it=ITEMS[id];if(!it||!takeItem(ch,id,n))return false;const p=Math.max(1,Math.floor(it.price*.4))*n;ch.kamas+=p;return p}

// ---- expérience, niveaux, quêtes
export function gainXp(ch,xp){const before=level(ch);ch.xp=Math.min(ch.xp+xp,xpFor(MAX_LVL));const after=level(ch);if(after>before){ch.points+=POINTS_PER_LVL*(after-before);ch.hp=derived(ch).maxHp}
 return {before,after,newSpells:classSpells(ch.cls).filter(id=>SPELLS[id].lvl>before&&SPELLS[id].lvl<=after)}}
export function questState(ch,qid){if(ch.done[qid])return 'done';const Q=QUESTS[qid];if(ch.quests[qid])return Object.entries(Q.kill||{}).every(([m,n])=>(ch.quests[qid][m]||0)>=n)&&Object.entries(Q.bring||{}).every(([i,n])=>(ch.inv[i]||0)>=n)?'ready':'active';
 const need=QUESTS[qid].need;return need&&!ch.done[need]?'locked':'available'}
export function acceptQuest(ch,qid){if(questState(ch,qid)!=='available')return false;ch.quests[qid]={};return true}
export function finishQuest(ch,qid){if(questState(ch,qid)!=='ready')return null;const r=QUESTS[qid].reward;for(const [i,n] of Object.entries(QUESTS[qid].bring||{}))takeItem(ch,i,n);delete ch.quests[qid];ch.done[qid]=Date.now();ch.kamas+=r.kamas||0;if(r.item)addItem(ch,r.item);const lv=gainXp(ch,r.xp||0);return {...r,lv}}
export function recordKill(ch,mob){ch.kills[mob]=(ch.kills[mob]||0)+1;for(const q in ch.quests){const k=QUESTS[q].kill;if(k&&k[mob]&&(ch.quests[q][mob]||0)<k[mob])ch.quests[q][mob]=(ch.quests[q][mob]||0)+1}}

// ---- récompenses de fin de combat : xp selon les niveaux (bonus sagesse, partage en groupe), kamas, butin
export function rewards(fight,players,rnd){const mobs=fight.f.filter(f=>f.kind==='mob'),won=fight.winner===0;if(!won)return players.map(()=>({xp:0,kamas:0,drops:[]}));
 const groupLvl=players.reduce((s,p)=>s+level(p.ch),0);
 return players.map(p=>{const L=level(p.ch),wis=derived(p.ch).stats.wis;let xp=0,kamas=0;const drops=[];
  for(const m of mobs){const M=MOBS[m.mob],ratio=Math.min(1.5,Math.max(.25,m.lvl/Math.max(1,L)));xp+=M.xp*m.lvl*.5*ratio;
   const [k0,k1]=M.kamas;kamas+=k0+Math.floor(rnd()*(k1-k0+1));for(const d of M.drops)if(rnd()<d.p*(1+wis/200))drops.push(d.i)}
  xp=Math.round(xp*(1+wis/100)*(L/Math.max(1,groupLvl))*(players.length>1?1.2:1));kamas=Math.round(kamas/players.length);return {xp,kamas,drops}})}
export function applyRewards(ch,r,fight){const lv=gainXp(ch,r.xp);ch.kamas+=r.kamas;for(const d of r.drops)addItem(ch,d);if(fight&&fight.winner===0)for(const m of fight.f.filter(f=>f.kind==='mob'))recordKill(ch,m.mob);return lv}

// ---- panoplies : bonus actifs selon le nombre de pièces portées
export function setBonuses(ch){const n={};for(const slot of SLOTS){const it=ITEMS[ch.eq?.[slot]];if(it?.set)n[it.set]=(n[it.set]||0)+1}
 const out=[];for(const [id,c] of Object.entries(n)){const S=SETS[id];if(!S)continue;let best=null;for(const k of Object.keys(S.bonus).map(Number).sort((a,b)=>a-b))if(c>=k)best=S.bonus[k];out.push({id,count:c,stats:best||{}})}return out}

// ---- métiers
export const jobLevel=(ch,job)=>ch.jobs?.[job]?jobLevelOf(ch.jobs[job].xp):0;
export function learnJob(ch,job){if(!JOBS[job])return false;ch.jobs??={};if(ch.jobs[job])return false;ch.jobs[job]={xp:0};return true}
export function jobXp(ch,job,xp){const j=ch.jobs?.[job];if(!j)return null;const before=jobLevelOf(j.xp);j.xp=Math.min(j.xp+xp,jobXpFor(JOB_MAX));return {before,after:jobLevelOf(j.xp)}}
// récolte : quantité selon le niveau de métier ; rnd() dans [0, 1)
export function harvest(ch,h,rnd=Math.random){const L=jobLevel(ch,h.job);if(!L)return {err:'job'};if(L<h.lvl)return {err:'lvl'};
 const n=1+Math.floor(L/10)+(rnd()<.25?1:0);addItem(ch,h.item,n);return {item:h.item,n,lv:jobXp(ch,h.job,h.xp)}}
export function canCraft(ch,id,n=1){const r=RECIPES[id];if(!r)return 'recette';if(jobLevel(ch,r.job)<r.lvl)return 'niveau';for(const [i,q] of Object.entries(r.in))if((ch.inv[i]||0)<q*n)return 'ingredients';return null}
export const maxCraft=(ch,id)=>{const r=RECIPES[id];if(!r||jobLevel(ch,r.job)<r.lvl)return 0;return Math.min(...Object.entries(r.in).map(([i,q])=>Math.floor((ch.inv[i]||0)/q)))};
export function craft(ch,id,n=1){if(canCraft(ch,id,n))return null;const r=RECIPES[id];for(const [i,q] of Object.entries(r.in))takeItem(ch,i,q*n);addItem(ch,id,n);return {n,lv:jobXp(ch,r.job,r.xp*n)}}
