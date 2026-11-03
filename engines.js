export const rand = n => Math.floor(Math.random()*n);
export function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=rand(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
export function move2048(board,dir){
 const next=board.slice();let score=0;
 for(let l=0;l<4;l++){
  const ids=Array.from({length:4},(_,k)=>dir==='left'?l*4+k:dir==='right'?l*4+3-k:dir==='up'?k*4+l:(3-k)*4+l);
  const values=ids.map(i=>board[i]).filter(Boolean),out=[];
  for(let k=0;k<values.length;k++){if(values[k]===values[k+1]){out.push(values[k]*2);score+=values[k]*2;k++}else out.push(values[k])}
  while(out.length<4)out.push(0);ids.forEach((id,k)=>next[id]=out[k]);
 }return {board:next,score,changed:next.some((v,i)=>v!==board[i])};
}
export function add2048(board){const empty=board.map((v,i)=>v?null:i).filter(i=>i!==null);if(empty.length)board[empty[rand(empty.length)]]=Math.random()<.9?2:4;return board}
export const can2048 = b=>['left','right','up','down'].some(d=>move2048(b,d).changed);
export function mineNeighbors(i,w=8,h=8){const out=[];for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++){const c=i%w+x,r=Math.floor(i/w)+y;if((x||y)&&c>=0&&c<w&&r>=0&&r<h)out.push(r*w+c)}return out}
export function makeMines(first,w=8,h=8,count=10){const safe=new Set([first,...mineNeighbors(first,w,h)]);const candidates=shuffle(Array.from({length:w*h},(_,i)=>i).filter(i=>!safe.has(i)));const mines=new Set(candidates.slice(0,count));return Array.from({length:w*h},(_,i)=>mines.has(i)?-1:mineNeighbors(i,w,h).filter(j=>mines.has(j)).length)}
export function revealMines(board,shown,flags,start,w=8,h=8){const queue=[start];while(queue.length){const i=queue.pop();if(shown.has(i)||flags.has(i))continue;shown.add(i);if(board[i]===0)queue.push(...mineNeighbors(i,w,h))}return shown}
export function winnerTTT(b){for(const [a,c,d] of [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]])if(b[a]&&b[a]===b[c]&&b[c]===b[d])return b[a];return b.every(Boolean)?'draw':null}
export function bestTTT(b){function solve(turn){const win=winnerTTT(b);if(win)return win==='O'?10:win==='X'?-10:0;let best=turn==='O'?-99:99;for(let i=0;i<9;i++)if(!b[i]){b[i]=turn;const s=solve(turn==='O'?'X':'O');b[i]='';best=turn==='O'?Math.max(best,s):Math.min(best,s)}return best}let options=[],best=-100;for(let i=0;i<9;i++)if(!b[i]){b[i]='O';const s=solve('X');b[i]='';if(s>best){best=s;options=[i]}else if(s===best)options.push(i)}return options[rand(options.length)]}
export const shapes=[[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[0,1,1],[1,1,0]],[[1,1,0],[0,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]]];
export const rotate = m=>m[0].map((_,i)=>m.map(r=>r[i]).reverse());
export function blockFits(board,shape,x,y){return shape.every((row,j)=>row.every((v,i)=>!v||(x+i>=0&&x+i<10&&y+j<18&&(y+j<0||!board[y+j][x+i]))))}
export function clearLines(board){const rows=board.filter(r=>r.some(v=>!v)),count=18-rows.length;while(rows.length<18)rows.unshift(Array(10).fill(0));return {board:rows,count}}
export function slideMove(board,index){const empty=board.indexOf(0);if(Math.abs(empty%4-index%4)+Math.abs(Math.floor(empty/4)-Math.floor(index/4))!==1)return false;[board[empty],board[index]]=[board[index],board[empty]];return true}
export const slideSolved=b=>b.every((v,i)=>v===(i+1)%16);
export function makeSlide(){const b=Array.from({length:16},(_,i)=>(i+1)%16);let prev=-1;for(let n=0;n<180;n++){const e=b.indexOf(0),moves=[e-4,e+4,e-1,e+1].filter(i=>i>=0&&i<16&&i!==prev&&Math.abs(e%4-i%4)+Math.abs(Math.floor(e/4)-Math.floor(i/4))===1);const i=moves[rand(moves.length)];slideMove(b,i);prev=e}if(slideSolved(b))slideMove(b,14);return b}
export function sudokuCandidates(b,i){const seen=new Set();const r=Math.floor(i/9),c=i%9;for(let k=0;k<9;k++){seen.add(b[r*9+k]);seen.add(b[k*9+c]);seen.add(b[(Math.floor(r/3)*3+Math.floor(k/3))*9+Math.floor(c/3)*3+k%3])}return [1,2,3,4,5,6,7,8,9].filter(v=>!seen.has(v))}
export function countSudoku(b,limit=2){let ix=-1,opts=[];for(let i=0;i<81;i++)if(!b[i]){const choices=sudokuCandidates(b,i);if(!choices.length)return 0;if(ix<0||choices.length<opts.length){ix=i;opts=choices;if(opts.length===1)break}}if(ix<0)return 1;let count=0;for(const v of opts){b[ix]=v;count+=countSudoku(b,limit-count);b[ix]=0;if(count>=limit)break}return count}
// ---- Sudoku : génération notée par un solveur « humain »
const SU_UNITS=(()=>{const u=[];for(let k=0;k<9;k++){u.push(Array.from({length:9},(_,j)=>k*9+j));u.push(Array.from({length:9},(_,j)=>j*9+k));u.push(Array.from({length:9},(_,j)=>(Math.floor(k/3)*3+Math.floor(j/3))*9+(k%3)*3+j%3))}return u})();
const SU_PEERS=Array.from({length:81},(_,i)=>{const s=new Set();for(const u of SU_UNITS)if(u.includes(i))for(const j of u)if(j!==i)s.add(j);return [...s]});
const bits=m=>{let n=0;while(m){m&=m-1;n++}return n},digitOf=m=>31-Math.clz32(m);
// Difficulté d'une grille selon les techniques nécessaires :
// 0 singletons nus, 1 singletons cachés, 2 paires/triplets nus, pointage, boîte-ligne, 3 au-delà (X-wing, chaînes, essais).
export function rateSudoku(b0){const b=[...b0],cand=new Array(81).fill(0);
 for(let i=0;i<81;i++)if(!b[i])for(const v of sudokuCandidates(b,i))cand[i]|=1<<v;
 const place=(i,v)=>{b[i]=v;cand[i]=0;for(const j of SU_PEERS[i])cand[j]&=~(1<<v)};
 let level=0;
 for(let guard=0;guard<400;guard++){
  if(b.every(Boolean))return level;
  if(b.some((v,i)=>!v&&!cand[i]))return 3;
  let i=cand.findIndex((m,k)=>!b[k]&&bits(m)===1);if(i>=0){place(i,digitOf(cand[i]));continue}
  let done=false;
  for(const u of SU_UNITS){for(let v=1;v<=9&&!done;v++){const spots=u.filter(k=>!b[k]&&cand[k]&1<<v);if(spots.length===1){place(spots[0],v);done=true}}if(done)break}
  if(done){level=Math.max(level,1);continue}
  let changed=false;
  // paires et triplets nus
  for(const u of SU_UNITS){const empty=u.filter(k=>!b[k]);for(const size of [2,3]){const pick=(start,chosen,mask)=>{if(changed)return;if(chosen.length===size){if(bits(mask)===size)for(const k of empty)if(!chosen.includes(k)&&cand[k]&mask){cand[k]&=~mask;changed=true}return}
    for(let x=start;x<empty.length;x++){const m=cand[empty[x]];if(bits(m)>size)continue;pick(x+1,[...chosen,empty[x]],mask|m)}};pick(0,[],0)}}
  // pointage (chiffre d'un carré limité à une ligne/colonne) et boîte-ligne (chiffre d'une ligne/colonne limité à un carré)
  if(!changed)for(let ui=0;ui<27&&!changed;ui++){const u=SU_UNITS[ui];for(let v=1;v<=9;v++){const spots=u.filter(k=>!b[k]&&cand[k]&1<<v);if(spots.length<2)continue;
   for(const w of SU_UNITS){if(w===u)continue;if(spots.every(k=>w.includes(k))){for(const k of w)if(!spots.includes(k)&&!b[k]&&cand[k]&1<<v){cand[k]&=~(1<<v);changed=true}}}}}
  if(changed){level=Math.max(level,2);continue}
  return 3}
 return 3}
function sudokuSolution(){const digits=shuffle([1,2,3,4,5,6,7,8,9]);const rows=shuffle([0,1,2]).flatMap(g=>shuffle([0,1,2]).map(r=>g*3+r));const cols=shuffle([0,1,2]).flatMap(g=>shuffle([0,1,2]).map(c=>g*3+c));
 const flip=Math.random()<.5;return Array.from({length:81},(_,i)=>{let r=Math.floor(i/9),c=i%9;if(flip)[r,c]=[c,r];const R=rows[r],C=cols[c];return digits[(R*3+Math.floor(R/3)+C)%9]})}
function carve(solution,removals){const board=[...solution];let removed=0;for(const i of shuffle(Array.from({length:81},(_,i)=>i))){if(removed>=removals)break;const v=board[i];board[i]=0;if(countSudoku([...board])!==1)board[i]=v;else removed++}return board}
// Niveaux : 0 facile (~38 indices, singletons nus), 1 normal (~30, singletons cachés),
// 2 difficile (grille minimale, demande paires / pointage), 3 expert (grille minimale, au-delà).
export function makeSudoku(level=1,budgetMs=2500){const want=[0,1,2,3][level]??1,removals=[43,51,81,81][want],t0=Date.now();let best=null;
 do{const solution=sudokuSolution(),board=carve(solution,removals),rating=rateSudoku(board);
  const score=rating===want?100:rating<want?rating:want-(rating-want)*2;
  if(!best||score>best.score)best={board,solution,rating,score};if(rating===want)break}while(Date.now()-t0<budgetMs);
 return {board:best.board,solution:best.solution,rating:best.rating}}

// Durée lisible : 45 s, 1 min 50 s, 2 min, 1 h 05 min.
export function formatDuration(total){const s=Math.max(0,Math.round(total));if(s<60)return s+' s';const h=Math.floor(s/3600),m=Math.floor(s%3600/60),r=s%60;
 if(h)return h+' h '+String(m).padStart(2,'0')+' min';return m+' min'+(r?' '+r+' s':'')}
