// Grilles de mots : mots croisés (définitions numérotées) et mots fléchés (définitions dans des cases, avec flèche).
// Les mots se croisent sans se toucher côte à côte. En mots fléchés, chaque mot a une case de définition juste
// avant sa première lettre (à gauche : flèche ▸ ; au-dessus : flèche ▾). Une case peut porter deux définitions.
import {WORDS} from './words-fr.js';

const rnd=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};

function attempt(size,target,arrows,dict){
 const L=new Array(size*size).fill(null),clue=new Array(size*size).fill(null),placed=[],used=new Set();
 const at=(r,c)=>r>=0&&c>=0&&r<size&&c<size?r*size+c:-1;
 function fits(w,r,c,dir){const dr=dir==='v'?1:0,dc=dir==='h'?1:0,n=w.length;let cross=0;
  const er=r+dr*(n-1),ec=c+dc*(n-1);if(at(r,c)<0||at(er,ec)<0)return -1;
  const before=at(r-dr,c-dc),after=at(er+dr,ec+dc);
  if(after>=0&&L[after])return -1;
  if(arrows){if(before<0||L[before])return -1;const cl=clue[before];if(cl&&(cl.length>=2||cl.some(x=>x.dir===dir)))return -1}
  else if(before>=0&&L[before])return -1;
  for(let k=0;k<n;k++){const rr=r+dr*k,cc=c+dc*k,i=at(rr,cc);if(arrows&&clue[i])return -1;
   if(L[i]){if(L[i]!==w[k])return -1;cross++;continue}
   // case libre : pas de lettre collée sur les côtés (sinon un faux mot apparaît)
   const s1=at(rr+dc,cc+dr),s2=at(rr-dc,cc-dr);if(s1>=0&&L[s1]||s2>=0&&L[s2])return -1}
  if(cross===n)return -1;return cross}
 function put(e,r,c,dir){const dr=dir==='v'?1:0,dc=dir==='h'?1:0;for(let k=0;k<e.w.length;k++)L[at(r+dr*k,c+dc*k)]=e.w[k];
  if(arrows){const b=at(r-dr,c-dc);(clue[b]??=[]).push({dir,text:e.c,word:placed.length})}placed.push({w:e.w,c:e.c,r,col:c,dir});used.add(e.w)}
 // premier mot : un mot long au milieu
 const first=dict.filter(e=>e.w.length>=Math.min(size-2,7)&&e.w.length<=size-(arrows?1:0))[0];if(!first)return null;
 const fr=Math.floor(size/2)-(arrows?1:0),fc=arrows?1:Math.floor((size-first.w.length)/2);if(fits(first.w,fr,fc,'h')<0)return null;put(first,fr,fc,'h');
 for(let round=0;round<3&&placed.length<target;round++)for(const e of dict){if(placed.length>=target)break;if(used.has(e.w)||e.w.length<3||e.w.length>size)continue;
  if([...used].some(u=>u.startsWith(e.w)||e.w.startsWith(u)))continue;
  let best=null;for(let r=0;r<size;r++)for(let c=0;c<size;c++)for(const dir of ['h','v']){const x=fits(e.w,r,c,dir);if(x>0&&(!best||x>best.x||x===best.x&&Math.random()<.3))best={x,r,c,dir}}
  if(best)put(e,best.r,best.c,best.dir)}
 return {size,letters:L,clues:clue,words:placed}}

// level : 0 facile, 1 normal, 2 difficile. Plusieurs essais, on garde la grille la plus remplie.
export function makeWordGrid(kind='cross',level=1){const arrows=kind==='arrow';
 const size=arrows?[8,9,10][level]:[9,11,13][level],target=arrows?[9,12,16][level]:[10,15,22][level];
 let best=null;for(let k=0;k<14;k++){const g=attempt(size,target,arrows,rnd(WORDS.slice()));if(!g)continue;const fill=g.letters.filter(Boolean).length;if(!best||g.words.length>best.words.length||g.words.length===best.words.length&&fill>best.fill)best={...g,fill};if(g.words.length>=target)break}
 const g=best;
 // numéros des mots croisés (dans l'ordre de lecture)
 let num=0;const numbers={};for(let i=0;i<g.size*g.size;i++){const starts=g.words.filter(w=>w.r*g.size+w.col===i);if(starts.length){num++;numbers[i]=num;for(const w of starts)w.n=num}}
 return {kind,size:g.size,letters:g.letters,clues:g.clues,words:g.words,numbers}}

// cases d'un mot
export const wordCells=(g,w)=>Array.from({length:w.w.length},(_,k)=>(w.r+(w.dir==='v'?k:0))*g.size+w.col+(w.dir==='h'?k:0));
// vérifie qu'aucun mot non voulu n'apparaît (suites de 2 lettres ou plus qui ne sont pas des mots placés)
export function strayWords(g){const out=[];const S=g.size;for(const dir of ['h','v'])for(let a=0;a<S;a++){let run='',start=0;
 for(let b=0;b<=S;b++){const i=dir==='h'?a*S+b:b*S+a,ch=b<S?g.letters[i]:null;if(ch){if(!run)start=b;run+=ch}else{if(run.length>=2){const r=dir==='h'?a:start,c=dir==='h'?start:a;if(!g.words.some(w=>w.dir===dir&&w.r===r&&w.col===c&&w.w===run))out.push(run)}run=''}}}return out}
