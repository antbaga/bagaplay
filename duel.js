// Jeux à deux (échecs, dames, puissance 4) : sur le même téléphone, contre l'ordinateur (dames, puissance 4) ou en ligne.
import * as Chess from './chess-engine.js';
import * as Draughts from './draughts-engine.js';
import * as online from './online.js';
import * as Connect4 from './connect4-engine.js';
import {bestMove as draughtsAI} from './draughts-ai.js';
import {bestMove as chessAI} from './chess-ai.js';
import * as Battleship from './battleship-engine.js';

const GLYPH={k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'};
const COLOR_NAMES={w:'Blancs',b:'Noirs'},C4_NAMES={w:'Rouges',b:'Jaunes'};
const POLL_MS=1500;
export const DUEL_RULES={
 chess:'Échecs : règles complètes. Touche une pièce puis sa case d’arrivée.',
 draughts:'Dames internationales 10×10 : prise obligatoire et majoritaire, dames volantes. Touche une pièce puis chaque case d’arrivée.',
 connect4:'Puissance 4 : aligne 4 jetons (ligne, colonne ou diagonale). Touche une colonne pour y lâcher ton jeton.',
 battleship:'Bataille navale : place tes 5 bateaux (touche un bateau puis une case pour le déplacer, touche-le encore pour le tourner), valide, puis tirez chacun votre tour sur la grille adverse. Le premier qui coule toute la flotte gagne.'
};

const ENGINES={chess:Chess,draughts:Draughts,connect4:Connect4,battleship:Battleship};
export const initialState=kind=>ENGINES[kind].initial();
export const AI_GAMES=['chess','draughts','connect4','battleship'];

export function duel(kind){return c=>{
 const E=ENGINES[kind],c4=kind==='connect4',cols=kind==='chess'?8:kind==='draughts'?10:7,rows=c4?6:cols,COLOR_NAME=c4?C4_NAMES:COLOR_NAMES;
 const aiMove=(st,l)=>c4?Connect4.bestMove(st,l):kind==='chess'?chessAI(st,l):draughtsAI(st,l);
 const opts=c.duel||{mode:'local'};let match=opts.match||null;
 const isOnline=!!match,vsAI=opts.mode==='ai'&&AI_GAMES.includes(kind),aiColor='b',aiLevel=opts.level??1;let thinking=false;
 let state=isOnline?match.state:E.initial(),ply=isOnline?match.ply:0,history=[];
 let sel=null,prefix=[],busy=false,ended=false,drawAsked=-1,errorText='';
 const myColor=()=>isOnline?match.my_color:null;
 const flipped=()=>myColor()==='b'&&!c4;
 const grid=c.grid(cols,'duel '+kind);if(c4)grid.dataset.aspect=String(cols/rows);
 const cells=[],N=cols*rows;
 for(let v=0;v<N;v++){const cell=c.cell(grid,'',()=>tap(+cell.dataset.i));cells.push(cell)}
 cells.forEach((cell,v)=>{const i=flipped()?N-1-v:v;cell.dataset.i=i;const r=Math.floor(i/cols),col=i%cols;if(!c4)cell.classList.add((r+col)%2?'dk':'lt')});

 // ---- commandes
 let undoBtn,resignBtn,drawBtn,declineBtn;
 function buildControls(){c.controls.innerHTML='';undoBtn=resignBtn=drawBtn=declineBtn=null;
  if(!isOnline){undoBtn=c.button('↶ Annuler le coup',undo,'wide');return}
  if(match.status!=='active')return;
  if(canDecline())declineBtn=c.button('Refuser le défi',decline,'wide');
  else{drawBtn=c.button('Proposer nulle',offerDraw,'wide');resignBtn=c.button('Abandonner',resign,'wide')}
 }

 // ---- affichage
 const names=()=>isOnline?{w:match.white_name||'…',b:match.black_name||'…'}:vsAI?{w:'TOI',b:'ORDINATEUR'}:c4?{w:'ROUGES',b:'JAUNES'}:{w:'BLANCS',b:'NOIRS'};
 function count(color){return kind==='chess'?state.board.filter(p=>Chess.pieceColor(p)===color).length:c4?Connect4.count(state,color):Draughts.count(state,color)}
 function legal(){return E.legalMoves(state)}
 function targets(){
  if(sel==null)return new Map();const m=new Map();
  if(kind==='chess'){for(const mv of legal())if(mv.from===sel)m.set(mv.to,!!state.board[mv.to]||mv.ep)}
  else for(const mv of legal())if(prefix.every((x,k)=>mv.path[k]===x)&&mv.path.length>prefix.length)m.set(mv.path[prefix.length],mv.captures.length>0);
  return m;
 }
 function render(){
  const t=c4?new Map():targets(),last=state.last,lastSquares=new Set(last?(kind==='chess'?[last.from,last.to]:c4?[]:last.path):[]),winLine=new Set(c4&&state.line||[]);
  const checkSq=kind==='chess'&&Chess.inCheck(state)?state.board.indexOf(state.turn==='w'?'K':'k'):-1;
  const forced=kind==='draughts'&&sel==null&&canPlay()?new Set(legal().filter(m=>m.captures.length).map(m=>m.path[0])):new Set();
  for(const cell of cells){const i=+cell.dataset.i,p=state.board[i];
   cell.classList.toggle('sel',i===sel||prefix.slice(1).includes(i));cell.classList.toggle('last',lastSquares.has(i));cell.classList.toggle('check',i===checkSq);
   cell.classList.toggle('target',t.has(i));cell.classList.toggle('capture',!!t.get(i));cell.classList.toggle('forced',forced.has(i));
   let html='';
   if(c4){cell.classList.toggle('win',winLine.has(i));const drop=p&&last&&last.index===i&&cell._drop!==ply;if(p)html=`<span class="disc ${p}"></span>`;if(cell._html!==html){cell.innerHTML=html;cell._html=html;if(drop){cell._drop=ply;const r=Math.floor(i/cols)+1;cell.firstChild.animate([{transform:`translateY(${-r*110}%)`},{transform:'translateY(0)',offset:.75},{transform:'translateY(-8%)',offset:.87},{transform:'translateY(0)'}],{duration:180+r*45,easing:'ease-in'})}}cell.setAttribute('aria-label',(p?(p==='w'?'jeton rouge':'jeton jaune'):'case vide')+', colonne '+(i%cols+1));continue}
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
  if(vsAI)return thinking||state.turn===aiColor?'L’ordinateur réfléchit…':`À toi de jouer.${forced}`;
  if(!isOnline)return `${check}Aux ${COLOR_NAME[state.turn].toLowerCase()} de jouer.${forced}`;
  if(state.turn===myColor())return `${check}À toi de jouer (${COLOR_NAME[myColor()].toLowerCase()}).${forced}`;
  return `${check}Au tour de ${names()[state.turn]}…`;
 }
 // depuis la 1.7 le défi est accepté ou refusé avant d'ouvrir le plateau
 function canDecline(){return false}
 function canPlay(){return !ended&&!busy&&!thinking&&(!vsAI||state.turn!==aiColor)&&(!isOnline||(match.status==='active'&&state.turn===myColor()))}

 // ---- jeu
 function own(i){const p=state.board[i];return p&&(kind==='chess'?Chess.pieceColor(p):Draughts.colorOf(p))===state.turn}
 function tap(i){
  errorText='';
  if(!canPlay()){if(isOnline&&match.status==='active'&&!ended)c.hint(`Au tour de ${names()[state.turn]}…`);return}
  if(c4){const m=legal().find(x=>x.col===i%cols);if(m)commit(m);return}
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
  if(!isOnline){history.push(state);state=next;ply++;render();if(st.over)return endLocal(st);if(vsAI&&state.turn===aiColor)aiTurn();return}
  state=next;busy=true;render();
  try{applyView(await online.playMove(match.id,ply,next,st.over?{winner:st.winner,reason:st.reason}:null))}
  catch(e){state=before;errorText='Coup non envoyé : '+e.message;render();refresh()}
  finally{busy=false;render()}
 }
 function undo(){if(!history.length||ended||thinking)return;state=history.pop();ply--;if(vsAI&&state.turn===aiColor&&history.length){state=history.pop();ply--}sel=null;prefix=[];render()}
 // tour de l'ordinateur : petit délai pour qu'on voie son coup arriver
 function aiTurn(){thinking=true;render();c.later(()=>{const m=aiMove(state,aiLevel);thinking=false;commit(m)},450)}

 // ---- fin de partie
 function resultText(winner,reason){const n=names();return winner?`${isOnline?n[winner]:COLOR_NAME[winner]} gagne${reason?' ('+reason+')':''}.`:`Partie nulle${reason?' ('+reason+')':''}.`}
 function endLocal(st){ended=true;render();
  if(vsAI){const won=st.winner&&st.winner!==aiColor;c.finish(won,0,st.winner?(won?'Tu as battu l’ordinateur':'L’ordinateur gagne')+(st.reason?' ('+st.reason+')':'')+'.':resultText(null,st.reason),{reward:won?[60,150,300][aiLevel]:st.winner?20:40,noRecord:true,title:won?'Victoire !':st.winner?'Défaite':'Partie nulle'});return}
  c.finish(true,0,resultText(st.winner,st.reason),{reward:0,noRecord:true,title:st.winner?`Victoire des ${COLOR_NAME[st.winner].toLowerCase()} !`:'Partie nulle'})}
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
 // partie finie : quitter le plateau la retire de mes listes
 return {key(k){if(k==='Escape'){sel=null;prefix=[];render()}},destroy(){if(isOnline&&(ended||match.status==='finished'||match.status==='declined'))online.hideMatch(match.id).catch(()=>{})}};
}}
