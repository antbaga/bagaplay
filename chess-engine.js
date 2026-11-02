// Échecs : règles complètes (roque, prise en passant, promotion, échec et mat, pat,
// nulle par matériel insuffisant, règle des 50 coups et triple répétition).
// Plateau : tableau de 64 cases, index = ligne*8 + colonne, ligne 0 = 8e rangée (côté noir).
// Pièces : 'PNBRQK' blancs, 'pnbrqk' noirs, '' vide. État sérialisable en JSON.

const START='rnbqkbnrpppppppp'+' '.repeat(32)+'PPPPPPPPRNBQKBNR';
const colorOf=p=>p?(p===p.toUpperCase()?'w':'b'):null;
const rc=i=>[i>>3,i&7];
const at=(r,c)=>r>=0&&r<8&&c>=0&&c<8?r*8+c:-1;
const KNIGHT=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
const KING=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
const ROOK=[[-1,0],[1,0],[0,-1],[0,1]],BISHOP=[[-1,-1],[-1,1],[1,-1],[1,1]];

export function initial(){const s={board:[...START].map(x=>x===' '?'':x),turn:'w',castling:'KQkq',ep:-1,half:0,full:1,last:null,keys:[]};s.keys=[key(s)];return s}
export function key(s){return s.board.map(p=>p||'.').join('')+s.turn+s.castling+s.ep}

export function attacked(board,sq,by){
 const [r,c]=rc(sq);const up=by==='w'?1:-1; // pions attaquants de "by" situés en r+up
 for(const dc of [-1,1]){const i=at(r+up,c+dc);if(i>=0&&board[i]===(by==='w'?'P':'p'))return true}
 for(const [dr,dc] of KNIGHT){const i=at(r+dr,c+dc);if(i>=0&&board[i]===(by==='w'?'N':'n'))return true}
 for(const [dr,dc] of KING){const i=at(r+dr,c+dc);if(i>=0&&board[i]===(by==='w'?'K':'k'))return true}
 const slide=(dirs,kinds)=>{for(const [dr,dc] of dirs){let rr=r+dr,cc=c+dc;while(at(rr,cc)>=0){const p=board[at(rr,cc)];if(p){if(colorOf(p)===by&&kinds.includes(p.toUpperCase()))return true;break}rr+=dr;cc+=dc}}return false};
 return slide(ROOK,'RQ')||slide(BISHOP,'BQ');
}
export function inCheck(s,color=s.turn){const k=s.board.indexOf(color==='w'?'K':'k');return k>=0&&attacked(s.board,k,color==='w'?'b':'w')}

function pseudo(s){
 const moves=[],b=s.board,me=s.turn,them=me==='w'?'b':'w';
 for(let i=0;i<64;i++){const p=b[i];if(colorOf(p)!==me)continue;const [r,c]=rc(i),t=p.toUpperCase();
  const add=(to,extra={})=>moves.push({from:i,to,...extra});
  if(t==='P'){const dir=me==='w'?-1:1,startRow=me==='w'?6:1,lastRow=me==='w'?0:7;
   const push=to=>{if(rc(to)[0]===lastRow)for(const promo of 'qrbn')add(to,{promo});else add(to)};
   const one=at(r+dir,c);if(one>=0&&!b[one]){push(one);const two=at(r+2*dir,c);if(r===startRow&&!b[two])add(two)}
   for(const dc of [-1,1]){const to=at(r+dir,c+dc);if(to<0)continue;if(b[to]&&colorOf(b[to])===them)push(to);else if(to===s.ep)add(to,{ep:true})}
  }else if(t==='N'||t==='K'){for(const [dr,dc] of t==='N'?KNIGHT:KING){const to=at(r+dr,c+dc);if(to>=0&&colorOf(b[to])!==me)add(to)}
   if(t==='K'){const home=me==='w'?60:4;if(i===home&&!attacked(b,i,them)){
    const K=me==='w'?'K':'k',Q=me==='w'?'Q':'q',R=me==='w'?'R':'r';
    if(s.castling.includes(K)&&!b[i+1]&&!b[i+2]&&b[i+3]===R&&!attacked(b,i+1,them)&&!attacked(b,i+2,them))add(i+2,{castle:'k'});
    if(s.castling.includes(Q)&&!b[i-1]&&!b[i-2]&&!b[i-3]&&b[i-4]===R&&!attacked(b,i-1,them)&&!attacked(b,i-2,them))add(i-2,{castle:'q'});
   }}
  }else{const dirs=t==='R'?ROOK:t==='B'?BISHOP:[...ROOK,...BISHOP];for(const [dr,dc] of dirs){let rr=r+dr,cc=c+dc;while(at(rr,cc)>=0){const to=at(rr,cc);if(b[to]){if(colorOf(b[to])===them)add(to);break}add(to);rr+=dr;cc+=dc}}}
 }
 return moves;
}

function play(s,m){
 const b=s.board.slice(),p=b[m.from],me=s.turn,captured=b[m.to]||(m.ep?(me==='w'?'p':'P'):'');
 b[m.to]=m.promo?(me==='w'?m.promo.toUpperCase():m.promo):p;b[m.from]='';
 if(m.ep)b[m.to+(me==='w'?8:-8)]='';
 if(m.castle==='k'){b[m.to-1]=b[m.to+1];b[m.to+1]=''}
 if(m.castle==='q'){b[m.to+1]=b[m.to-2];b[m.to-2]=''}
 let castling=s.castling;
 const strip=(sq,chars)=>{if(m.from===sq||m.to===sq)castling=castling.replace(new RegExp('['+chars+']','g'),'')};
 strip(60,'KQ');strip(4,'kq');strip(63,'K');strip(56,'Q');strip(7,'k');strip(0,'q');
 const pawn=p.toUpperCase()==='P';
 const n={board:b,turn:me==='w'?'b':'w',castling,ep:pawn&&Math.abs(m.to-m.from)===16?(m.from+m.to)/2:-1,
  half:pawn||captured?0:s.half+1,full:s.full+(me==='b'?1:0),last:{from:m.from,to:m.to},keys:s.keys};
 n.keys=(pawn||captured?[]:s.keys).concat(key(n));
 return n;
}

export function legalMoves(s){return pseudo(s).filter(m=>!inCheck(play(s,m),s.turn))}
export function apply(s,m){const ok=legalMoves(s).find(x=>x.from===m.from&&x.to===m.to&&(x.promo||'')===(m.promo||''));if(!ok)throw new Error('coup illégal');return play(s,ok)}

function insufficient(b){
 const pieces=b.map((p,i)=>[p,i]).filter(([p])=>p&&p.toUpperCase()!=='K');
 if(!pieces.length)return true;
 if(pieces.length===1&&'NB'.includes(pieces[0][0].toUpperCase()))return true;
 if(pieces.every(([p])=>p.toUpperCase()==='B')){const shade=new Set(pieces.map(([,i])=>((i>>3)+(i&7))%2));return shade.size===1}
 return false;
}

// {over, winner:'w'|'b'|null, reason}
export function status(s){
 const moves=legalMoves(s);
 if(!moves.length)return inCheck(s)?{over:true,winner:s.turn==='w'?'b':'w',reason:'mat'}:{over:true,winner:null,reason:'pat'};
 if(insufficient(s.board))return {over:true,winner:null,reason:'matériel insuffisant'};
 if(s.half>=100)return {over:true,winner:null,reason:'règle des 50 coups'};
 const k=key(s);if(s.keys.filter(x=>x===k).length>=3)return {over:true,winner:null,reason:'triple répétition'};
 return {over:false,winner:null,reason:''};
}
export const pieceColor=colorOf;
