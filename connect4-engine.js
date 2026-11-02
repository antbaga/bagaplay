// Puissance 4 : grille 7 colonnes × 6 rangées, index = rangée*7 + colonne, rangée 0 en haut.
// 'w' = rouges (commencent), 'b' = jaunes. Même interface que les autres moteurs (initial, legalMoves, apply, status).
export const COLS=7,ROWS=6;
const DIRS=[[0,1],[1,0],[1,1],[1,-1]];
export function initial(){return {board:Array(42).fill(''),turn:'w',last:null,winner:null,line:null,moves:0}}
export function legalMoves(s){if(s.winner)return [];const m=[];for(let c=0;c<COLS;c++)if(!s.board[c])m.push({col:c});return m}
function lineAt(b,i){const p=b[i],r=Math.floor(i/COLS),c=i%COLS;
 for(const [dr,dc] of DIRS){const cells=[i];
  for(const sgn of [1,-1]){let rr=r+dr*sgn,cc=c+dc*sgn;while(rr>=0&&rr<ROWS&&cc>=0&&cc<COLS&&b[rr*COLS+cc]===p){cells.push(rr*COLS+cc);rr+=dr*sgn;cc+=dc*sgn}}
  if(cells.length>=4)return cells}
 return null}
export function apply(s,m){const c=m.col;if(!(c>=0&&c<COLS)||s.board[c]||s.winner)throw new Error('coup illégal');
 let r=ROWS-1;while(s.board[r*COLS+c])r--;const i=r*COLS+c,b=s.board.slice();b[i]=s.turn;
 const line=lineAt(b,i);return {board:b,turn:s.turn==='w'?'b':'w',last:{index:i,col:c},winner:line?s.turn:null,line,moves:s.moves+1}}
export function status(s){if(s.winner)return {over:true,winner:s.winner,reason:'4 alignés'};if(s.moves>=42)return {over:true,winner:null,reason:'grille pleine'};return {over:false,winner:null,reason:''}}
export function count(s,color){return s.board.filter(p=>p===color).length}

// --- ordinateur : négamax alpha-bêta, colonnes centrales d'abord, évaluation par fenêtres de 4 cases
const ORDER=[3,2,4,1,5,0,6];
function windowScore(a,me){const mine=a.filter(x=>x===me).length,theirs=a.filter(x=>x&&x!==me).length,empty=4-mine-theirs;
 if(mine&&theirs)return 0;if(mine===3&&empty===1)return 5;if(mine===2&&empty===2)return 2;if(theirs===3&&empty===1)return -4;if(theirs===2&&empty===2)return -1;return 0}
function evaluate(b,me){let s=0;for(let r=0;r<ROWS;r++)if(b[r*COLS+3]===me)s+=3;else if(b[r*COLS+3])s-=3;
 for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)for(const [dr,dc] of DIRS){const er=r+dr*3,ec=c+dc*3;if(er<0||er>=ROWS||ec<0||ec>=COLS)continue;
  s+=windowScore([0,1,2,3].map(k=>b[(r+dr*k)*COLS+c+dc*k]),me)}return s}
function negamax(s,depth,alpha,beta){if(s.winner)return -100000-depth;if(s.moves>=42)return 0;if(!depth)return evaluate(s.board,s.turn);
 let best=-Infinity;for(const c of ORDER){if(s.board[c])continue;const v=-negamax(apply(s,{col:c}),depth-1,-beta,-alpha);if(v>best)best=v;if(v>alpha)alpha=v;if(alpha>=beta)break}return best}
export function bestMove(s,level=1){const depth=[2,5,7][level]??5,moves=legalMoves(s);
 // victoire immédiate / parade immédiate d'abord (même en facile)
 for(const m of moves)if(apply(s,m).winner)return m;
 const scored=moves.map(m=>({m,v:-negamax(apply(s,m),depth-1,-Infinity,Infinity)}));const top=Math.max(...scored.map(x=>x.v)),margin=[40,3,0][level]??3;
 const good=scored.filter(x=>x.v>=top-margin);return good[Math.floor(Math.random()*good.length)].m}
