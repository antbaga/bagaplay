// Jeux à deux (échecs, dames) : sur le même téléphone ou en ligne.
import * as Chess from './chess-engine.js';
import * as Draughts from './draughts-engine.js';
import * as online from './online.js';

const GLYPH={k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'};
const COLOR_NAME={w:'Blancs',b:'Noirs'};
const POLL_MS=1500;
export const DUEL_RULES={
 chess:'Échecs : règles complètes. Touche une pièce puis sa case d’arrivée.',
 draughts:'Dames internationales 10×10 : prise obligatoire et majoritaire, dames volantes. Touche une pièce puis chaque case d’arrivée.'
};

export const initialState=kind=>(kind==='chess'?Chess:Draughts).initial();

export function duel(kind){return c=>{
 const E=kind==='chess'?Chess:Draughts,size=kind==='chess'?8:10;
 const opts=c.duel||{mode:'local'};let match=opts.match||null;
 const isOnline=!!match;
 let state=isOnline?match.state:E.initial(),ply=isOnline?match.ply:0,history=[];
 let sel=null,prefix=[],busy=false,ended=false,drawAsked=-1,errorText='';
 const myColor=()=>isOnline?match.my_color:null;
 const flipped=()=>myColor()==='b';
 const grid=c.grid(size,'duel '+kind);
 const cells=[];
 for(let v=0;v<size*size;v++){const cell=c.cell(grid,'',()=>tap(+cell.dataset.i));cells.push(cell)}
 cells.forEach((cell,v)=>{const i=flipped()?size*size-1-v:v;cell.dataset.i=i;const r=Math.floor(i/size),col=i%size;cell.classList.add((r+col)%2?'dk':'lt')});

 // ---- commandes
 let undoBtn,resignBtn,drawBtn,declineBtn;
 function buildControls(){c.controls.innerHTML='';undoBtn=resignBtn=drawBtn=declineBtn=null;
  if(!isOnline){undoBtn=c.button('↶ Annuler le coup',undo,'wide');return}
  if(match.status!=='active')return;
  if(canDecline())declineBtn=c.button('Refuser le défi',decline,'wide');
  else{drawBtn=c.button('Proposer nulle',offerDraw,'wide');resignBtn=c.button('Abandonner',resign,'wide')}
 }

 // ---- affichage
 const names=()=>isOnline?{w:match.white_name||'…',b:match.black_name||'…'}:{w:'BLANCS',b:'NOIRS'};
 function count(color){return kind==='chess'?state.board.filter(p=>Chess.pieceColor(p)===color).length:Draughts.count(state,color)}
 function legal(){return E.legalMoves(state)}
 function targets(){
  if(sel==null)return new Map();const m=new Map();
  if(kind==='chess'){for(const mv of legal())if(mv.from===sel)m.set(mv.to,!!state.board[mv.to]||mv.ep)}
  else for(const mv of legal())if(prefix.every((x,k)=>mv.path[k]===x)&&mv.path.length>prefix.length)m.set(mv.path[prefix.length],mv.captures.length>0);
  return m;
 }
 function render(){
  const t=targets(),last=state.last,lastSquares=new Set(last?(kind==='chess'?[last.from,last.to]:last.path):[]);
  const checkSq=kind==='chess'&&Chess.inCheck(state)?state.board.indexOf(state.turn==='w'?'K':'k'):-1;
  const forced=kind==='draughts'&&sel==null&&canPlay()?new Set(legal().filter(m=>m.captures.length).map(m=>m.path[0])):new Set();
  for(const cell of cells){const i=+cell.dataset.i,p=state.board[i];
   cell.classList.toggle('sel',i===sel||prefix.slice(1).includes(i));cell.classList.toggle('last',lastSquares.has(i));cell.classList.toggle('check',i===checkSq);
   cell.classList.toggle('target',t.has(i));cell.classList.toggle('capture',!!t.get(i));cell.classList.toggle('forced',forced.has(i));
   let html='';
   if(p){if(kind==='chess')html=`<span class="piece ${Chess.pieceColor(p)}">${GLYPH[p.toLowerCase()]}︎</span>`;
    else html=`<span class="man ${Draughts.colorOf(p)}${Draughts.isKing(p)?' king':''}"></span>`}
   if(cell._html!==html){cell.innerHTML=html;cell._html=html}
   cell.setAttribute('aria-label',(p?pieceName(p):'case vide')+(t.has(i)?', destination possible':''));
  }
  const n=names(),turnSide=state.turn==='w'?'l':'r';
  c.setBar(n.w,count('w'),n.b,count('b'),ended?null:turnSide);
  c.hint(hintText());
  if(undoBtn)undoBtn.disabled=!history.length||ended;
  if(declineBtn&&!canDecline())buildControls();
  if(drawBtn){drawBtn.disabled=match.draw_offer==='me';drawBtn.textContent=match.draw_offer==='me'?'Nulle proposée…':'Proposer nulle'}
 }
 function pieceName(p){if(kind==='chess')return ({k:'roi',q:'dame',r:'tour',b:'fou',n:'cavalier',p:'pion'})[p.toLowerCase()]+' '+(Chess.pieceColor(p)==='w'?'blanc':'noir');return (Draughts.isKing(p)?'dame ':'pion ')+(Draughts.colorOf(p)==='w'?'blanc':'noir')}
 function hintText(){
  if(errorText)return errorText;
  if(ended)return 'Partie terminée.';
  const opp=isOnline?names()[myColor()==='w'?'b':'w']:'';
  if(isOnline&&canDecline())return state.turn===myColor()?`${opp} te défie ! Joue ton premier coup, ou refuse le défi.`:`${opp} te défie et commence. Tu pourras jouer ensuite, ou refuser.`;
  const check=kind==='chess'&&Chess.inCheck(state)?'Échec ! ':'';
  const forced=kind==='draughts'&&legal()[0]?.captures.length?` Prise obligatoire (${legal()[0].captures.length}).`:'';
  if(!isOnline)return `${check}Aux ${COLOR_NAME[state.turn].toLowerCase()} de jouer.${forced}`;
  if(state.turn===myColor())return `${check}À toi de jouer (${COLOR_NAME[myColor()].toLowerCase()}).${forced}`;
  return `${check}Au tour de ${names()[state.turn]}…`;
 }
 function canDecline(){return isOnline&&match.status==='active'&&!match.from_me&&((myColor()==='w'&&ply===0)||(myColor()==='b'&&ply<=1))}
 function canPlay(){return !ended&&!busy&&(!isOnline||(match.status==='active'&&state.turn===myColor()))}

 // ---- jeu
 function own(i){const p=state.board[i];return p&&(kind==='chess'?Chess.pieceColor(p):Draughts.colorOf(p))===state.turn}
 function tap(i){
  errorText='';
  if(!canPlay()){if(isOnline&&match.status==='active'&&!ended)c.hint(`Au tour de ${names()[state.turn]}…`);return}
  const t=targets();
  if(sel!=null&&t.has(i)){
   if(kind==='chess'){const moves=legal().filter(m=>m.from===sel&&m.to===i);if(moves.length>1)return askPromotion(moves[0]);return commit(moves[0])}
   prefix.push(i);const rest=legal().filter(m=>prefix.every((x,k)=>m.path[k]===x));
   if(rest.length===1&&rest[0].path.length===prefix.length)return commit(rest[0]);
   c.tone();render();return;
  }
  const movable=kind==='chess'?legal().some(m=>m.from===i):legal().some(m=>m.path[0]===i);
  if(own(i)&&movable){sel=sel===i&&prefix.length<=1?null:i;prefix=sel==null?[]:[i]}
  else{sel=null;prefix=[];if(own(i)&&kind==='draughts'&&legal()[0]?.captures.length)errorText='Une prise est obligatoire avec une autre pièce.'}
  render();
 }
 function askPromotion(m){
  c.dialog('Promotion','','Dame',()=>commit({...m,promo:'q'}),'Annuler',()=>render());
  const box=document.querySelector('#dialog-text');box.innerHTML='';
  for(const [promo,label] of [['r','Tour'],['b','Fou'],['n','Cavalier']]){const b=document.createElement('button');b.className='text-btn promo-btn';b.textContent=label;b.onclick=()=>{c.closeDialog();commit({...m,promo})};box.append(b)}
 }
 async function commit(m){
  const before=state,next=E.apply(state,m),st=E.status(next);
  sel=null;prefix=[];c.tone();
  if(!isOnline){history.push(state);state=next;ply++;render();if(st.over)endLocal(st);return}
  state=next;busy=true;render();
  try{applyView(await online.playMove(match.id,ply,next,st.over?{winner:st.winner,reason:st.reason}:null))}
  catch(e){state=before;errorText='Coup non envoyé : '+e.message;render();refresh()}
  finally{busy=false;render()}
 }
 function undo(){if(!history.length||ended)return;state=history.pop();ply--;sel=null;prefix=[];render()}

 // ---- fin de partie
 function resultText(winner,reason){const n=names();return winner?`${isOnline?n[winner]:COLOR_NAME[winner]} gagne${reason?' ('+reason+')':''}.`:`Partie nulle${reason?' ('+reason+')':''}.`}
 function endLocal(st){ended=true;render();c.finish(true,0,resultText(st.winner,st.reason),{reward:0,noRecord:true,title:st.winner?`Victoire des ${COLOR_NAME[st.winner].toLowerCase()} !`:'Partie nulle'})}
 function endOnline(){if(ended)return;ended=true;sel=null;prefix=[];buildControls();render();
  if(match.status==='declined'){c.finish(false,0,match.from_me?`${names()[myColor()==='w'?'b':'w']} a refusé ton défi.`:'Tu as refusé ce défi.',{reward:0,noRecord:true,title:'Défi refusé'});return}
  const mine=match.my_color,won=match.winner===mine,draw=!match.winner;
  c.finish(won,0,resultText(match.winner,match.reason),{reward:won?300:draw?150:50,once:'match:'+match.id,duelWin:won,noRecord:true,title:won?'Victoire !':draw?'Partie nulle':'Défaite'});
 }

 // ---- synchronisation en ligne
 function applyView(v){if(!v)return;const statusChanged=v.status!==match.status,moved=v.ply!==ply;
  match=v;state=v.state;ply=v.ply;if(moved){sel=null;prefix=[];if(v.my_turn)c.tone(true)}
  if(statusChanged)buildControls();
  if(v.status==='finished'||v.status==='declined')return endOnline();
  if(v.draw_offer==='them'&&drawAsked!==ply){drawAsked=ply;c.dialog('Nulle proposée',`${names()[myColor()==='w'?'b':'w']} te propose la nulle.`,'Accepter',()=>action('accept_draw'),'Refuser',()=>action('decline_draw'))}
  render();
 }
 async function refresh(){if(busy||ended)return;try{const v=await online.getMatch(match.id);if(errorText.startsWith('Connexion')){errorText=''}
   if(v.ply!==ply||v.status!==match.status||v.draw_offer!==match.draw_offer||v.white_name!==match.white_name||v.black_name!==match.black_name)applyView(v);else render()}
  catch(e){errorText='Connexion perdue, nouvel essai…';render()}}
 async function action(name){try{const v=await online.matchAction(match.id,name);if(v)applyView(v)}catch(e){errorText=e.message;render()}}
 function resign(){c.dialog('Abandonner ?','Ton adversaire gagnera la partie.','Abandonner',()=>action('resign'),'Continuer',()=>{})}
 function offerDraw(){action('offer_draw')}
 function decline(){c.dialog('Refuser le défi ?','La partie sera annulée, sans gagnant.','Refuser',()=>action('decline'),'Jouer',()=>{})}

 buildControls();render();
 if(isOnline){if(match.status!=='active')setTimeout(endOnline,0);c.every(refresh,POLL_MS)}
 return {key(k){if(k==='Escape'){sel=null;prefix=[];render()}}};
}}
