// Binero : toucher une case la fait passer de vide à 0, puis à 1, puis de nouveau vide.
// Les erreurs (trois identiques, ligne trop chargée, lignes identiques) s'affichent en rouge. Partie sauvegardée en continu.
import {makeBinero,conflicts} from './binero-engine.js';
import {savedRun,saveRun,clearRun} from './runs.js';
import {formatDuration} from './engines.js';

export const BINERO_SIZES=[6,8,10,12];
export function binero(c){
 const run=c.duel?.resume?savedRun('binero'):null,level=run?.level??c.difficulty,n=run?.n??BINERO_SIZES[level]??8;
 const made=run?{puzzle:run.puzzle,solution:run.solution}:makeBinero(n);
 const given=made.puzzle.map(v=>v>=0),board=run?run.board.slice():made.puzzle.slice(),solution=made.solution;
 let elapsed=run?.elapsed||0,hints=run?.hints??3,usedHint=!!run?.usedHint,history=[],finished=false,saveT=0;
 const save=()=>{if(!finished)saveRun('binero',{level,n,puzzle:made.puzzle,solution,board,elapsed,hints,usedHint})};
 c.listen(document,'visibilitychange',()=>{if(document.hidden)save()});c.listen(window,'pagehide',save);
 const grid=c.grid(n,'binero n'+n);
 const cells=board.map((_,i)=>c.cell(grid,'',()=>tap(i)));
 const undo=c.button('↶',()=>{const h=history.pop();if(h){board[h.i]=h.v;render();save()}},'tool','Annuler');
 const help=c.button('',hint,'tool','Indice');help.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="badge"></span>';
 function tap(i){if(given[i]||finished)return;history.push({i,v:board[i]});board[i]=board[i]<0?0:board[i]===0?1:-1;render();const el=cells[i];el.classList.add('fill');setTimeout(()=>el.classList.remove('fill'),220);save();check()}
 function hint(){if(!hints||finished)return;const wrong=board.findIndex((v,i)=>!given[i]&&v>=0&&v!==solution[i]),empty=board.findIndex(v=>v<0),i=wrong>=0?wrong:empty;if(i<0)return;
  history.push({i,v:board[i]});board[i]=solution[i];hints--;usedHint=true;render();save();check()}
 function render(){const bad=conflicts(board,n);
  cells.forEach((b,i)=>{const v=board[i];b.textContent=v<0?'':String(v);b.className='cell'+(given[i]?' given':'')+(v===0?' zero':v===1?' one':'')+(bad.has(i)?' error':'');
   b.setAttribute('aria-label',`Ligne ${Math.floor(i/n)+1}, colonne ${i%n+1}, ${v<0?'vide':v}${given[i]?', fixe':''}`)});
  help.querySelector('.badge').textContent=hints;help.disabled=!hints;undo.disabled=!history.length}
 function check(){if(board.every((v,i)=>v===solution[i])){finished=true;clearRun('binero');const t=Math.max(1,Math.floor(elapsed));
  c.finish(true,t,`Grille ${n}×${n} terminée en ${formatDuration(t)}`+(usedHint?' avec un peu d’aide.':' !'))}}
 c.hint('Touche une case : vide → 0 → 1. Pas trois pareils à la suite, autant de 0 que de 1, pas deux lignes identiques.');
 render();save();
 return {destroy:save,update(dt){if(finished)return;elapsed+=dt;c.score(Math.floor(elapsed),false);if((saveT+=dt)>5){saveT=0;save()}}};
}
