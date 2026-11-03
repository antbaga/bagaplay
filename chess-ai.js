// Adversaire « ordinateur » pour les échecs : négamax alpha-bêta + recherche de calme sur les prises.
// Évaluation : matériel + position des pièces (tables simples). Niveaux 0 facile, 1 normal, 2 difficile.
import {legalMoves,playLegal,inCheck} from './chess-engine.js';

const VAL={P:100,N:310,B:325,R:500,Q:900,K:0};
// tables vues côté blanc (ligne 0 = 8e rangée)
const PST={
 P:[0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 12,12,20,30,30,20,12,12, 6,6,10,25,25,10,6,6, 0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5, 5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0],
 N:[-50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40, -30,0,10,15,15,10,0,-30, -30,5,15,20,20,15,5,-30, -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30, -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50],
 B:[-20,-10,-10,-10,-10,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,10,10,5,0,-10, -10,5,5,10,10,5,5,-10, -10,0,10,10,10,10,0,-10, -10,10,10,10,10,10,10,-10, -10,5,0,0,0,0,5,-10, -20,-10,-10,-10,-10,-10,-10,-20],
 R:[0,0,0,0,0,0,0,0, 5,10,10,10,10,10,10,5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, 0,0,0,5,5,0,0,0],
 Q:[-20,-10,-10,-5,-5,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,5,5,5,0,-10, -5,0,5,5,5,5,0,-5, 0,0,5,5,5,5,0,-5, -10,5,5,5,5,5,0,-10, -10,0,5,0,0,0,0,-10, -20,-10,-10,-5,-5,-10,-10,-20],
 K:[-30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -20,-30,-30,-40,-40,-30,-30,-20, -10,-20,-20,-20,-20,-20,-20,-10, 20,20,0,0,0,0,20,20, 20,30,10,0,0,10,30,20]};
export function evaluate(b){let s=0;for(let i=0;i<64;i++){const p=b[i];if(!p)continue;const t=p.toUpperCase(),w=p===t;s+=(VAL[t]+PST[t][w?i:(7-(i>>3))*8+(i&7)])*(w?1:-1)}return s}
const score=(st)=>(st.turn==='w'?1:-1)*evaluate(st.board);
const order=(s,moves)=>moves.map(m=>({m,k:(s.board[m.to]?10*VAL[s.board[m.to].toUpperCase()]-VAL[s.board[m.from].toUpperCase()]/10:0)+(m.promo?800:0)})).sort((a,b)=>b.k-a.k).map(x=>x.m);
let nodes=0;
function quiesce(s,alpha,beta,depth){nodes++;const stand=score(s);if(stand>=beta)return stand;if(stand>alpha)alpha=stand;if(depth<=0)return alpha;
 const caps=order(s,legalMoves(s).filter(m=>s.board[m.to]||m.promo));for(const m of caps){const v=-quiesce(playLegal(s,m),-beta,-alpha,depth-1);if(v>=beta)return v;if(v>alpha)alpha=v}return alpha}
let deadline=Infinity,qDepth=3;
function negamax(s,depth,alpha,beta,ply){nodes++;const moves=legalMoves(s);
 if(!moves.length)return inCheck(s)?-100000+ply:0;   // mat (le plus vite possible) ou pat
 if(depth===0||Date.now()>deadline)return quiesce(s,alpha,beta,qDepth);
 let best=-Infinity;for(const m of order(s,moves)){const v=-negamax(playLegal(s,m),depth-1,-beta,-alpha,ply+1);if(v>best)best=v;if(v>alpha)alpha=v;if(alpha>=beta)break}return best}
// Facile : 1 coup d'avance, beaucoup de hasard. Normal : 2 coups. Difficile : 2 coups + prises étudiées plus loin, sans hasard.
// Une limite de temps garde le téléphone réactif (au-delà, la recherche s'arrête sur une évaluation des prises).
export function bestMove(s,level=1){const L=[[1,1,160,400],[2,2,35,900],[2,4,6,1500]][level]??[2,2,35,900],moves=legalMoves(s);nodes=0;if(moves.length===1)return moves[0];
 qDepth=L[1];deadline=Date.now()+L[3];
 const scored=order(s,moves).map(m=>({m,v:-negamax(playLegal(s,m),L[0]-1,-Infinity,Infinity,1)}));deadline=Infinity;
 const top=Math.max(...scored.map(x=>x.v)),good=scored.filter(x=>x.v>=top-L[2]);
 return good[Math.floor(Math.random()*good.length)].m}
export const lastNodes=()=>nodes;
