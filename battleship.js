// Bataille navale : chacun place sa flotte, valide, puis on tire à tour de rôle.
// Modes : contre l'ordinateur, à deux sur le même téléphone (écran caché entre les tours) ou en ligne
// (le serveur garde les flottes cachées et répond « à l'eau / touché / coulé »).
import * as B from './battleship-engine.js';
import * as online from './online.js';

const POLL_MS=1500,N=B.SIZE*B.SIZE;
const other=s=>s==='w'?'b':'w';
const sunkCount=shots=>shots.filter(s=>s.sunk).length;

export function battleship(c){
 const opts=c.duel||{mode:'local'};let match=opts.match||null;
 const isOnline=!!match,vsAI=!isOnline&&opts.mode==='ai',local2=!isOnline&&!vsAI,level=opts.level??1;
 let st=isOnline?match.state:B.initial();
 const fleets={w:null,b:null};
 let draft=B.randomFleet(),sel=0,viewer='w',busy=false,ended=false,curtain=null,errorText='',flash=-1,flashSide=null;
 // à deux sur un téléphone : « viewer » ne change que derrière l'écran de passage, jamais pendant qu'on voit la grille
 const me=()=>isOnline?match.my_color:local2?viewer:'w';
 const names=()=>isOnline?{w:match.white_name||'…',b:match.black_name||'…'}:vsAI?{w:'TOI',b:'ORDINATEUR'}:{w:'JOUEUR 1',b:'JOUEUR 2'};
 const myFleet=()=>isOnline?match.my_fleet:fleets[me()];
 const oppFleet=()=>isOnline?match.opp_fleet:(ended?fleets[other(me())]:null);
 const placing=()=>st.phase==='place'&&!(isOnline?st.placed?.[me()]:false);

 // ---- éléments
 const wrap=document.createElement('div');wrap.className='bs-wrap';c.board.append(wrap);
 const big=mkGrid('bs-grid bs-big'),small=mkGrid('bs-grid bs-small');
 const banner=document.createElement('div');banner.className='bs-banner';banner.setAttribute('aria-live','polite');
 const cover=document.createElement('div');cover.className='bs-curtain';cover.hidden=true;
 const coverText=document.createElement('p'),coverBtn=document.createElement('button');coverBtn.className='primary';coverBtn.textContent='Je suis prêt';cover.append(coverText,coverBtn);
 wrap.append(big.el,banner,small.el,cover);
 c.listen(coverBtn,'click',()=>{curtain=null;render()});
 function mkGrid(cls){const el=document.createElement('div');el.className=cls;el.setAttribute('translate','no');const cells=[];
  for(let i=0;i<N;i++){const b=document.createElement('button');b.className='cell';el.append(b);c.listen(b,'click',()=>tapBig(el,i));cells.push(b)}return {el,cells}}

 // ---- commandes
 let rotBtn,shuffleBtn,okBtn,resignBtn;
 function buildControls(){c.controls.innerHTML='';rotBtn=shuffleBtn=okBtn=resignBtn=null;
  if(ended)return;
  if(placing()&&!curtain){rotBtn=c.button('↻',rotate,'tool','Tourner le bateau');shuffleBtn=c.button('🎲',()=>{draft=B.randomFleet();sel=0;render()},'tool','Placer au hasard');okBtn=c.button('✓ Valider ma flotte',validate,'wide')}
  else if(isOnline&&match.status==='active')resignBtn=c.button('Abandonner',()=>c.dialog('Abandonner ?','Ton adversaire gagnera la partie.','Abandonner',()=>action('resign'),'Continuer',()=>{}),'wide')}
 let controlsKey='';
 function syncControls(){const k=[ended,placing(),!!curtain,isOnline&&match.status].join();if(k!==controlsKey){controlsKey=k;buildControls()}}

 // ---- placement
 function shipAt(fleet,i){return fleet.findIndex(s=>B.shipCells(s).includes(i))}
 function fits(fleet,k,s){if(!B.inBounds(s))return false;const cs=new Set(B.shipCells(s));return fleet.every((o,j)=>j===k||!B.shipCells(o).some(x=>cs.has(x)))}
 // garde le bateau dans la grille en le décalant si besoin
 function clamp(s){const r=Math.min(s.r,s.dir==='v'?B.SIZE-s.len:B.SIZE-1),c2=Math.min(s.c,s.dir==='h'?B.SIZE-s.len:B.SIZE-1);return {...s,r:Math.max(0,r),c:Math.max(0,c2)}}
 function tryPlace(k,s){s=clamp(s);if(!fits(draft,k,s)){say('Pas de place ici.','bad');c.tone(false);return false}draft=draft.map((o,j)=>j===k?s:o);return true}
 function rotate(){if(sel<0)return;const s=draft[sel];if(tryPlace(sel,{...s,dir:s.dir==='h'?'v':'h'}))render()}
 function tapPlace(i){const k=shipAt(draft,i);
  if(k>=0){if(k===sel)rotate();else{sel=k;say(B.SHIP_NAMES[draft[k].len]+' ('+draft[k].len+' cases) : touche une case pour le déplacer.');render()}return}
  if(sel<0)return;if(tryPlace(sel,{...draft[sel],r:Math.floor(i/B.SIZE),c:i%B.SIZE})){say('');render()}}
 async function validate(){if(!B.validFleet(draft)||busy)return;const side=me(),fleet=draft.map(s=>({...s}));
  if(isOnline){busy=true;say('');render();try{applyView(await online.bsPlace(match.id,fleet))}catch(e){errorText=e.message}busy=false;render();return}
  fleets[side]=fleet;st.placed[side]=true;sel=0;say('');
  if(vsAI){fleets.b=B.randomFleet();st.placed.b=true}
  if(st.placed.w&&st.placed.b){st.phase='fire';st.turn='w';if(local2){viewer='w';curtain='Le joueur 1 commence. Passe-lui le téléphone.'}}
  else{draft=B.randomFleet();viewer='b';curtain='Flotte du joueur 1 en place. Passe le téléphone au joueur 2 pour qu’il place la sienne.'}
  render()}

 // ---- tirs
 function tapBig(el,i){if(el!==big.el||ended||busy||curtain)return;if(placing())return tapPlace(i);
  if(st.phase!=='fire'||st.turn!==me()||(isOnline&&match.status!=='active'))return;
  if(st.shots[me()].some(s=>s.i===i))return;shoot(i)}
 async function shoot(i){const side=me();
  if(isOnline){busy=true;render();try{const v=await online.bsFire(match.id,i);applyView(v,true)}catch(e){errorText=e.message}busy=false;render();return}
  const opp=other(side),res=B.fire(fleets[opp],st.shots[side].map(s=>s.i),i);
  st.shots[side].push({i,hit:res.hit,sunk:res.sunk});announce(res,side,i);
  if(res.won)return endLocal(side);
  st.turn=opp;busy=true;render();
  if(vsAI)c.later(aiTurn,900);
  else c.later(()=>{busy=false;viewer=opp;flash=-1;curtain=`Au tour du ${opp==='w'?'joueur 1':'joueur 2'}. Passe-lui le téléphone.`;render()},1300)}
 function aiTurn(){if(ended)return;const i=B.aiShot(st.shots.b,level),res=B.fire(fleets.w,st.shots.b.map(s=>s.i),i);
  st.shots.b.push({i,hit:res.hit,sunk:res.sunk});announce(res,'b',i);busy=false;
  if(res.won)return endLocal('b');st.turn='w';render()}
 // message après un tir (side : qui a tiré)
 function announce(res,side,i){const mine=side===me()||(vsAI&&side==='w');flash=i;flashSide=side;
  const who=isOnline?(mine?'':names()[side]+' : '):vsAI&&!mine?'Ordinateur : ':'';
  say(who+(res.sunk?'Coulé ! '+B.SHIP_NAMES[res.sunk.len]+'.':res.hit?'Touché !':'À l’eau.'),res.sunk?'sunk':res.hit?'hit':'miss');
  c.tone(!!res.hit);if(res.hit&&navigator.vibrate)try{navigator.vibrate(res.sunk?[40,40,80]:30)}catch{}}
 let sayT=0;function say(t,kind=''){banner.textContent=t;banner.className='bs-banner'+(kind?' '+kind:'');clearTimeout(sayT);if(t&&kind)sayT=setTimeout(()=>{if(banner.textContent===t)banner.className='bs-banner fade'},2200)}

 // ---- affichage
 function paintFleet(g,fleet,shots,{reveal=true,selected=-1,mark=-1}={}){
  const shot=new Map(shots.map(s=>[s.i,s])),sunk=new Set(shots.filter(s=>s.sunk).flatMap(s=>B.shipCells(s.sunk)));
  const ship=new Map();(fleet||[]).forEach((s,k)=>B.shipCells(s).forEach((i,j)=>ship.set(i,{k,j,s})));
  for(let i=0;i<N;i++){const b=g.cells[i],sh=shot.get(i),p=ship.get(i);let cls='cell';
   const showShip=p&&(reveal||sunk.has(i));
   if(showShip){cls+=' ship';const {s,j}=p;if(j===0)cls+=s.dir==='h'?' end-l':' end-t';if(j===s.len-1)cls+=s.dir==='h'?' end-r':' end-b';if(p.k===selected)cls+=' sel'}
   if(sh)cls+=sunk.has(i)?' sunk':sh.hit?' hit':' miss';
   if(i===mark)cls+=' flash';
   b.className=cls;b.textContent=sh?(sh.hit?'✕':'•'):'';
   b.setAttribute('aria-label',`${'ABCDEFGHIJ'[i%10]}${Math.floor(i/10)+1}${sh?(sunk.has(i)?', coulé':sh.hit?', touché':', à l’eau'):showShip?', bateau':''}`)}}
 function render(){syncControls();const side=me(),opp=other(side),n=names();
  const battle=st.phase==='fire'||ended;
  wrap.classList.toggle('battle',battle);wrap.classList.toggle('placing',placing());
  cover.hidden=!curtain;coverText.textContent=curtain||'';big.el.classList.toggle('hidden-grid',!!curtain);small.el.classList.toggle('hidden-grid',!!curtain);
  if(!battle){paintFleet(big,placing()?draft:myFleet(),[],{selected:placing()?sel:-1});small.el.hidden=true}
  else{small.el.hidden=false;
   paintFleet(big,oppFleet(),st.shots[side],{reveal:ended,mark:flashSide===side?flash:-1});
   paintFleet(small,myFleet(),st.shots[opp],{mark:flashSide===opp?flash:-1})}
  big.el.classList.toggle('aim',battle&&!ended&&st.turn===side&&!busy&&!curtain&&(!isOnline||match.status==='active'));
  // barre : bateaux encore à flot de chaque côté
  const left=s=>B.FLEET.length-sunkCount(st.shots[other(s)]||[]);
  c.setBar(local2?n[side]:'TOI',left(side),n[opp],left(opp),ended||!battle?null:st.turn===side?'l':'r');
  c.hint(hintText());layout()}
 function hintText(){if(errorText)return errorText;const n=names(),side=me();
  if(curtain)return '';
  if(ended)return 'Partie terminée.';
  if(isOnline&&match.status!=='active')return 'Partie terminée.';
  if(placing())return (local2?(side==='w'?'Joueur 1':'Joueur 2')+' : ':'')+'place ta flotte. Touche un bateau puis une case, touche-le encore pour le tourner. 🎲 pour placer au hasard.';
  if(st.phase==='place')return 'Ta flotte est prête. En attente de celle de '+n[other(side)]+'…';
  if(busy&&vsAI)return 'L’ordinateur vise…';
  if(st.turn===side)return 'À toi de tirer : touche une case de la grille adverse.';
  return isOnline?'Au tour de '+n[other(side)]+'…':'';}
 function layout(){const W=c.board.clientWidth,H=c.board.clientHeight;if(!W||!H)return;const battle=st.phase==='fire'||ended,bh=banner.offsetHeight||24;
  let a,b=0;if(!battle)a=Math.min(W,H-bh-6);else{a=Math.min(W,(H-bh-12)*.64);b=Math.min(a*.5,H-a-bh-12)}
  big.el.style.width=big.el.style.height=Math.max(120,Math.floor(a))+'px';small.el.style.width=small.el.style.height=Math.max(80,Math.floor(b))+'px'}
 c.listen(window,'resize',layout);

 // ---- fin
 function endLocal(winner){ended=true;busy=false;curtain=null;render();
  c.later(()=>{if(vsAI){const won=winner==='w';c.finish(won,0,won?'Tu as coulé toute la flotte de l’ordinateur !':'L’ordinateur a coulé toute ta flotte.',{reward:won?[60,150,300][level]:20,noRecord:true,title:won?'Victoire !':'Défaite'});return}
   c.finish(true,0,`Le ${winner==='w'?'joueur 1':'joueur 2'} a coulé toute la flotte adverse.`,{reward:0,noRecord:true,title:`Victoire du ${winner==='w'?'joueur 1':'joueur 2'} !`})},1000)}
 function endOnline(){if(ended)return;ended=true;render();
  if(match.status==='declined'){c.finish(false,0,match.from_me?'Ton défi a été refusé.':'Tu as refusé ce défi.',{reward:0,noRecord:true,title:'Défi refusé'});return}
  const won=match.winner===match.my_color,n=names(),opp=n[other(match.my_color)];
  c.later(()=>c.finish(won,0,won?(match.reason==='abandon'?opp+' abandonne.':'Tu as coulé toute la flotte de '+opp+' !'):(match.reason==='abandon'?'Tu as abandonné.':opp+' a coulé toute ta flotte.'),{reward:won?300:50,once:'match:'+match.id,duelWin:won,noRecord:true,title:won?'Victoire !':'Défaite'}),900)}

 // ---- en ligne
 function applyView(v,fromMe=false){if(!v)return;const prevOpp=(st.shots?.[other(match.my_color)]||[]).length,prevMine=(st.shots?.[match.my_color]||[]).length;
  match=v;st=v.state;errorText='';const opp=other(match.my_color);
  if(fromMe&&st.shots[match.my_color].length>prevMine){const s=st.shots[match.my_color].at(-1);announce(s,match.my_color,s.i)}
  else if(st.shots[opp].length>prevOpp){const s=st.shots[opp].at(-1);announce(s,opp,s.i)}
  if(v.status!=='active'&&v.status!=='pending')return endOnline();
  render()}
 async function refresh(){if(busy||ended)return;try{const v=await online.getMatch(match.id);if(v.ply!==match.ply||v.status!==match.status||v.white_name!==match.white_name||v.black_name!==match.black_name)applyView(v);else if(errorText){errorText='';render()}}
  catch{errorText='Connexion perdue, nouvel essai…';render()}}
 async function action(name){try{applyView(await online.matchAction(match.id,name))}catch(e){errorText=e.message;render()}}

 render();requestAnimationFrame(layout);
 if(isOnline){if(match.status!=='active')setTimeout(endOnline,0);c.every(refresh,POLL_MS)}
 return {key(k){if(k==='r'||k==='R')rotate()},destroy(){clearTimeout(sayT);if(isOnline&&(ended||match.status==='finished'||match.status==='declined'))online.hideMatch(match.id).catch(()=>{})}};
}
