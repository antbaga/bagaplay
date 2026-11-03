// Mots croisés et mots fléchés : même interface. Touche une case (deux fois pour changer de sens),
// tape avec le clavier en bas. Un mot juste passe au vert. Partie sauvegardée en continu.
import {makeWordGrid,wordCells} from './words-engine.js';
import {savedRun,saveRun,clearRun} from './runs.js';
import {formatDuration} from './engines.js';

const KEYS=['AZERTYUIOP','QSDFGHJKLM','WXCVBN'];
export function wordGame(kind){return c=>{
 const id=kind==='arrow'?'arrowword':'crossword',run=c.duel?.resume?savedRun(id):null,level=run?.level??c.difficulty;
 const g=run?.grid??makeWordGrid(kind,level),S=g.size,N=S*S;
 const typed=run?.typed??new Array(N).fill('');let elapsed=run?.elapsed||0,hints=run?.hints??3,usedHint=!!run?.usedHint,finished=false,saveT=0;
 const owner=new Array(N).fill(null).map(()=>[]);g.words.forEach((w,k)=>wordCells(g,w).forEach(i=>owner[i].push(k)));
 let cur=run?.cur??0,sel=run?.sel??wordCells(g,g.words[0])[0];
 const save=()=>{if(!finished)saveRun(id,{level,grid:g,typed,elapsed,hints,usedHint,cur,sel})};
 c.listen(document,'visibilitychange',()=>{if(document.hidden)save()});c.listen(window,'pagehide',save);

 const grid=c.grid(S,'words '+kind+' s'+S);grid.setAttribute('translate','no');
 const cells=[];for(let i=0;i<N;i++){const isLetter=!!g.letters[i];let b;
  if(isLetter){b=c.cell(grid,'',()=>tap(i),'letter')}
  else{b=document.createElement('div');b.className='cell '+(kind==='arrow'&&g.clues[i]?'clue':'void');grid.append(b);
   if(kind==='arrow'&&g.clues[i]){for(const cl of g.clues[i]){const s=document.createElement('span');s.className='clue-text '+cl.dir;s.textContent=cl.text;s.onclick=()=>{cur=cl.word;sel=wordCells(g,g.words[cur])[0];render()};b.append(s)}}}
  cells.push(b)}
 // définition du mot en cours + clavier
 const bar=document.createElement('div');bar.className='word-clue';bar.setAttribute('translate','no');c.controls.append(bar);
 const kb=document.createElement('div');kb.className='word-keys';c.controls.append(kb);
 for(const row of KEYS){const r=document.createElement('div');r.className='word-row';for(const ch of row){const k=c.button(ch,()=>type(ch),'key',ch);r.append(k)}
  if(row==='WXCVBN'){r.append(c.button('⌫',()=>erase(),'key wide-key','Effacer'));const h=c.button('',hint,'key wide-key hint-key','Indice');h.innerHTML='💡<span class="badge"></span>';r.append(h)}kb.append(r)}
 const hintBtn=kb.querySelector('.hint-key');

 function tap(i){if(finished)return;const ws=owner[i];if(sel===i&&ws.length>1)cur=ws.find(k=>k!==cur)??ws[0];else if(!ws.includes(cur))cur=ws.find(k=>g.words[k].dir===g.words[cur]?.dir)??ws[0];sel=i;render();save()}
 function step(d){const cs=wordCells(g,g.words[cur]),k=cs.indexOf(sel);const nk=k+d;if(nk>=0&&nk<cs.length)sel=cs[nk]}
 function type(ch){if(finished)return;typed[sel]=ch;const cs=wordCells(g,g.words[cur]);if(sel!==cs[cs.length-1])step(1);else{const next=g.words.findIndex((w,k)=>k!==cur&&wordCells(g,w).some(i=>!typed[i]));if(next>=0&&wordCells(g,g.words[cur]).every(i=>typed[i])){cur=next;sel=wordCells(g,g.words[cur]).find(i=>!typed[i])}}
  render();save();check()}
 function erase(){if(finished)return;if(!typed[sel])step(-1);typed[sel]='';render();save()}
 function hint(){if(!hints||finished)return;const cs=wordCells(g,g.words[cur]),i=cs.find(i=>typed[i]!==g.letters[i]);if(i==null)return;typed[i]=g.letters[i];hints--;usedHint=true;render();save();check()}
 const done=k=>wordCells(g,g.words[k]).every(i=>typed[i]===g.letters[i]);
 function render(){const cs=new Set(wordCells(g,g.words[cur]));const ok=new Set();g.words.forEach((w,k)=>{if(done(k))wordCells(g,w).forEach(i=>ok.add(i))});
  for(let i=0;i<N;i++){if(!g.letters[i])continue;const b=cells[i];b.textContent=typed[i]||'';if(kind==='cross'&&g.numbers[i]){const n=document.createElement('small');n.className='num';n.textContent=g.numbers[i];b.prepend(n)}
   b.className='cell letter'+(cs.has(i)?' inword':'')+(i===sel?' selected':'')+(ok.has(i)?' ok':'');b.setAttribute('aria-label',`Case ${Math.floor(i/S)+1}-${i%S+1}${typed[i]?', '+typed[i]:''}`)}
  if(kind==='arrow')cells.forEach((b,i)=>{if(g.clues[i])b.querySelectorAll('.clue-text').forEach((s,k)=>s.classList.toggle('on',g.clues[i][k].word===cur))});
  const w=g.words[cur];bar.innerHTML='';const tag=document.createElement('b');tag.textContent=(kind==='cross'?w.n+' ':'')+(w.dir==='h'?'▸':'▾');const t=document.createElement('span');t.textContent=w.c;const len=document.createElement('small');len.textContent=` (${w.w.length})`;bar.append(tag,t,len);
  hintBtn.querySelector('.badge').textContent=hints;hintBtn.disabled=!hints}
 function check(){if(g.letters.every((ch,i)=>!ch||typed[i]===ch)){finished=true;clearRun(id);const t=Math.max(1,Math.floor(elapsed));
  c.finish(true,t,`${g.words.length} mots trouvés en ${formatDuration(t)}`+(usedHint?' avec un peu d’aide.':' !'))}}
 c.hint(kind==='arrow'?'Touche une case, tape le mot. Les définitions sont dans les cases fléchées.':'Touche une case (deux fois pour changer de sens) et tape le mot.');
 render();save();
 return {destroy:save,update(dt){if(finished)return;elapsed+=dt;c.score(Math.floor(elapsed),false);if((saveT+=dt)>5){saveT=0;save()}},
  key(k){if(/^[a-zA-Z]$/.test(k))type(k.toUpperCase());else if(k==='Backspace')erase();else if(k===' '){tap(sel)}}};
}}
export const crossword=wordGame('cross'),arrowword=wordGame('arrow');
