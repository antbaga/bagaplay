// Adversaire « ordinateur » pour les dames : recherche négamax avec élagage alpha-bêta.
import {legalMoves,apply,colorOf,isKing} from './draughts-engine.js';

function evaluate(s,me){let score=0;
 for(let i=0;i<100;i++){const p=s.board[i];if(!p)continue;const r=Math.floor(i/10),c=i%10;
  let v=isKing(p)?3.2:1;
  if(!isKing(p))v+=(colorOf(p)==='w'?(9-r):r)*.035;   // pion avancé
  v+=(4.5-Math.abs(c-4.5))*.012;                    // centre
  if(!isKing(p)&&(colorOf(p)==='w'?r===9:r===0))v+=.08; // garde la dernière rangée
  score+=colorOf(p)===me?v:-v}
 return score}

function negamax(s,depth,alpha,beta,me){
 const moves=legalMoves(s);
 if(!moves.length)return -1000-depth;          // plus de coup : perdu (le plus tard possible)
 if(depth===0)return (s.turn===me?1:-1)*evaluate(s,me);
 moves.sort((a,b)=>b.captures.length-a.captures.length);
 let best=-Infinity;
 for(const m of moves){const v=-negamax(apply(s,m),depth-1,-beta,-alpha,me);if(v>best)best=v;if(v>alpha)alpha=v;if(alpha>=beta)break}
 return best}

// level : 0 facile, 1 normal, 2 difficile. Un peu de hasard entre coups presque équivalents.
export function bestMove(s,level=1){
 const depth=[2,4,5][level]??4,moves=legalMoves(s),me=s.turn;
 if(moves.length===1)return moves[0];
 const scored=moves.map(m=>({m,v:-negamax(apply(s,m),depth-1,-Infinity,Infinity,me)}));
 const top=Math.max(...scored.map(x=>x.v)),margin=[1.2,.25,.05][level]??.25;
 const good=scored.filter(x=>x.v>=top-margin);
 return good[Math.floor(Math.random()*good.length)].m;
}
