// Dames internationales (règles françaises / FMJD), damier 10×10.
// Prise obligatoire et majoritaire, pions qui prennent en arrière, dames volantes,
// pièces prises retirées en fin de rafle (on ne saute pas deux fois la même),
// promotion seulement si le pion termine son coup sur la dernière rangée.
// Nulle : triple répétition, ou 25 coups de chaque camp (50 demi-coups) uniquement avec des dames sans prise.
// Plateau : tableau de 100 cases, index = ligne*10 + colonne, ligne 0 en haut (côté noir).
// 'w' pion blanc, 'W' dame blanche, 'b' pion noir, 'B' dame noire, '' vide. Les blancs commencent.

const N=10,DIRS=[[-1,-1],[-1,1],[1,-1],[1,1]];
const at=(r,c)=>r>=0&&r<N&&c>=0&&c<N?r*N+c:-1;
const rc=i=>[Math.floor(i/N),i%N];
export const colorOf=p=>p?p.toLowerCase():null;
export const isKing=p=>!!p&&p===p.toUpperCase();
export const dark=i=>{const [r,c]=rc(i);return (r+c)%2===1};

export function initial(){const board=Array(100).fill('');for(let i=0;i<100;i++)if(dark(i)){const r=Math.floor(i/N);if(r<4)board[i]='b';else if(r>5)board[i]='w'}const s={board,turn:'w',quiet:0,last:null,keys:[]};s.keys=[key(s)];return s}
export function key(s){return s.board.map(p=>p||'.').join('')+s.turn}

// Toutes les rafles depuis une case. Une rafle = {path:[départ, arrivée1, ...], captures:[cases prises]}.
function captureSequences(board,from){
 const piece=board[from],me=colorOf(piece),king=isKing(piece),out=[];
 const empty=i=>i===from||!board[i];
 (function search(pos,path,taken){
  let extended=false;
  for(const [dr,dc] of DIRS){const [r,c]=rc(pos);
   if(king){let k=1;while(at(r+dr*k,c+dc*k)>=0&&empty(at(r+dr*k,c+dc*k)))k++;
    const victim=at(r+dr*k,c+dc*k);if(victim<0||!board[victim]||colorOf(board[victim])===me||taken.includes(victim))continue;
    let j=k+1;while(true){const land=at(r+dr*j,c+dc*j);if(land<0||!empty(land))break;extended=true;search(land,path.concat(land),taken.concat(victim));j++}
   }else{const victim=at(r+dr,c+dc),land=at(r+2*dr,c+2*dc);
    if(victim<0||land<0||!board[victim]||colorOf(board[victim])===me||taken.includes(victim)||!empty(land))continue;
    extended=true;search(land,path.concat(land),taken.concat(victim))}
  }
  if(!extended&&taken.length)out.push({path,captures:taken});
 })(from,[from],[]);
 return out;
}

export function legalMoves(s){
 const b=s.board,me=s.turn;let caps=[];
 for(let i=0;i<100;i++)if(colorOf(b[i])===me)caps.push(...captureSequences(b,i));
 if(caps.length){const max=Math.max(...caps.map(m=>m.captures.length));caps=caps.filter(m=>m.captures.length===max);
  const seen=new Set();return caps.filter(m=>{const k=m.path.join('-');if(seen.has(k))return false;seen.add(k);return true})}
 const moves=[];
 for(let i=0;i<100;i++){const p=b[i];if(colorOf(p)!==me)continue;const [r,c]=rc(i);
  if(isKing(p)){for(const [dr,dc] of DIRS){let k=1;while(true){const to=at(r+dr*k,c+dc*k);if(to<0||b[to])break;moves.push({path:[i,to],captures:[]});k++}}}
  else{const dr=me==='w'?-1:1;for(const dc of [-1,1]){const to=at(r+dr,c+dc);if(to>=0&&!b[to])moves.push({path:[i,to],captures:[]})}}
 }
 return moves;
}

export function apply(s,m){
 const legal=legalMoves(s).find(x=>x.path.join('-')===m.path.join('-'));if(!legal)throw new Error('coup illégal');
 const b=s.board.slice(),from=legal.path[0],to=legal.path.at(-1),p=b[from];
 b[from]='';for(const x of legal.captures)b[x]='';
 const lastRow=s.turn==='w'?0:N-1;b[to]=!isKing(p)&&Math.floor(to/N)===lastRow?p.toUpperCase():p;
 const quiet=isKing(p)&&!legal.captures.length?s.quiet+1:0;
 const n={board:b,turn:s.turn==='w'?'b':'w',quiet,last:{path:legal.path,captures:legal.captures},keys:s.keys};
 n.keys=(legal.captures.length||!isKing(p)?[]:s.keys).concat(key(n));
 return n;
}

export function count(s,color){return s.board.filter(p=>colorOf(p)===color).length}

export function status(s){
 if(!legalMoves(s).length)return {over:true,winner:s.turn==='w'?'b':'w',reason:count(s,s.turn)?'bloqué':'plus de pièces'};
 if(s.quiet>=50)return {over:true,winner:null,reason:'25 coups de dames sans prise'};
 const k=key(s);if(s.keys.filter(x=>x===k).length>=3)return {over:true,winner:null,reason:'triple répétition'};
 return {over:false,winner:null,reason:''};
}
