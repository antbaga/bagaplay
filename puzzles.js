import {shuffle,move2048,add2048,can2048,makeMines,revealMines,winnerTTT,bestTTT,makeSlide,slideMove,slideSolved,makeSudoku,formatDuration} from './engines.js';
const directions={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'};
// 2048 : tuiles qui glissent (transformations CSS), fusion qui « claque », plateau qui suit le pouce pendant le geste.
function game2048(c){const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let tiles=[],score=0,nextId=1,over=false;
 const grid=c.grid(4,'grid-4 g2048');for(let i=0;i<16;i++){const s=document.createElement('div');s.className='slot';grid.append(s)}
 const layer=document.createElement('div');layer.className='tiles';grid.append(layer);
 function place(t){t.el.style.setProperty('--x',t.x);t.el.style.setProperty('--y',t.y)}
 function paint(t){t.el.textContent=t.v;t.el.dataset.v=t.v;t.el.setAttribute('aria-label',String(t.v));t.el.classList.toggle('big',t.v>=128);t.el.classList.toggle('huge',t.v>=1024)}
 function spawn(){const used=new Set(tiles.map(t=>t.y*4+t.x)),free=[...Array(16).keys()].filter(i=>!used.has(i));if(!free.length)return;const i=free[Math.floor(Math.random()*free.length)];
  const t={id:nextId++,v:Math.random()<.9?2:4,x:i%4,y:Math.floor(i/4),el:document.createElement('div')};t.el.className='cell tile';place(t);paint(t);layer.append(t.el);tiles.push(t);
  if(!reduced)t.el.animate([{opacity:0,scale:'.6'},{opacity:1,scale:'1'}],{duration:170,easing:'cubic-bezier(.25,.8,.25,1)',delay:110,fill:'backwards'})}
 const numbers=()=>{const b=Array(16).fill(0);for(const t of tiles)b[t.y*4+t.x]=t.v;return b};
 function line(dir,k){const r=[0,1,2,3];if(dir==='left')return r.map(i=>[i,k]);if(dir==='right')return r.map(i=>[3-i,k]);if(dir==='up')return r.map(i=>[k,i]);return r.map(i=>[k,3-i])}
 function popup(text,t){const p=document.createElement('div');p.className='pop2048';p.textContent=text;p.style.setProperty('--x',t.x);p.style.setProperty('--y',t.y);layer.append(p);setTimeout(()=>p.remove(),900)}
 function move(dir){if(over)return;const at=new Map(tiles.map(t=>[t.y*4+t.x,t]));let moved=false,gained=0;const dying=[],merged=[];
  for(let k=0;k<4;k++){const pos=line(dir,k),row=pos.map(([x,y])=>at.get(y*4+x)).filter(Boolean),out=[];
   for(const t of row){const last=out[out.length-1];if(last&&!last.fresh&&last.v===t.v){last.v*=2;last.fresh=true;gained+=last.v;dying.push({t,into:last});merged.push(last)}else out.push(t)}
   out.forEach((t,i)=>{const [x,y]=pos[i];if(t.x!==x||t.y!==y)moved=true;t.x=x;t.y=y});}
  for(const d of dying){moved=true;d.t.x=d.into.x;d.t.y=d.into.y}
  if(!moved)return;
  for(const t of tiles){place(t);t.fresh=false}
  for(const d of dying){d.t.el.classList.add('dying');setTimeout(()=>d.t.el.remove(),180)}
  tiles=tiles.filter(t=>!dying.some(d=>d.t===t));
  setTimeout(()=>{for(const t of merged){paint(t);if(!reduced)t.el.animate([{scale:'1'},{scale:'1.1'},{scale:'1'}],{duration:170,easing:'ease-in-out'});}},110);
  if(gained){score+=gained;c.score(score);c.tone(gained>=64);const top=merged.reduce((a,b)=>b.v>a.v?b:a);popup('+'+gained,top)}
  spawn();
  if(tiles.some(t=>t.v>=2048)){over=true;setTimeout(()=>c.finish(true,score,'La tuile 2048 est à toi !\n'+score+' points de douceur.'),350)}
  else if(!can2048(numbers())){over=true;setTimeout(()=>c.finish(false,score,'Plus de place sur le plateau.\nTon score : '+score+' points.'),350)}}
 // le plateau suit légèrement le pouce, puis le coup part dès que le geste est assez long
 let start=null;
 c.listen(c.board,'pointerdown',e=>{start=[e.clientX,e.clientY];c.board.setPointerCapture?.(e.pointerId);layer.style.transition='none'});
 c.listen(c.board,'pointermove',e=>{if(!start)return;const dx=e.clientX-start[0],dy=e.clientY-start[1],h=Math.abs(dx)>Math.abs(dy),d=Math.max(-6,Math.min(6,(h?dx:dy)*.18));layer.style.transform=h?`translateX(${d}px)`:`translateY(${d}px)`;
  if(Math.max(Math.abs(dx),Math.abs(dy))>34){start=null;release();move(h?dx>0?'right':'left':dy>0?'down':'up')}});
 function release(){layer.style.transition='transform .2s cubic-bezier(.25,.8,.25,1)';layer.style.transform=''}
 c.listen(c.board,'pointerup',e=>{if(!start)return;const dx=e.clientX-start[0],dy=e.clientY-start[1];start=null;release();if(Math.max(Math.abs(dx),Math.abs(dy))>18)move(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up')});
 c.listen(c.board,'pointercancel',()=>{start=null;release()});
 spawn();spawn();c.score(0);
 return {key:k=>directions[k]&&move(directions[k])}}
// Memory : 6, 8, 18 paires, ou 32 en Extrême (8×8). En Extrême, les symboles existent en deux couleurs.
// 32 symboles tous différents (forme), chacun avec sa couleur ; \uFE0E force l'affichage texte (pas d'emoji)
const MEMORY_GLYPHS=['✿','☀','☾','✦','♥','♣','◆','●','▲','★','☁','♫','☂','❀','✚','◉','☘','✺','♠','■','♪','✖','❖','⬢','✤','⚑','✎','☯','♞','⌘','☆','⬟'];
function memory(c){const pairs=[6,8,18,32][c.difficulty]??8;
 const set=MEMORY_GLYPHS.slice(0,pairs).map((g,k)=>g+'|'+(k%8));
 const faces=shuffle(set.slice(0,pairs).flatMap(x=>[x,x]));let open=[],found=new Set(),locked=false,moves=0;const grid=c.grid([4,4,6,8][c.difficulty]??4,'memory'+(c.difficulty===3?' xl':''));const cells=faces.map((f,i)=>c.cell(grid,'✦',()=>flip(i)));function render(){cells.forEach((b,i)=>{const visible=open.includes(i)||found.has(i);const [glyph,hue]=faces[i].split('|');b.textContent=visible?glyph+'\uFE0E':'✦';b.className='cell'+(visible?' open h'+hue:'')+(found.has(i)?' matched':'');b.setAttribute('aria-label',visible?'Carte '+glyph:'Retourner la carte '+(i+1))});c.score(moves,false)}function flip(i){if(locked||open.includes(i)||found.has(i))return;open.push(i);c.tone();render();if(open.length===2){moves++;render();const [a,b]=open;if(faces[a]===faces[b]){found.add(a);found.add(b);open=[];render();if(found.size===faces.length)c.finish(true,moves,'Paires réunies en '+moves+' coups.')}else{locked=true;c.later(()=>{open=[];locked=false;render()},800)}}}render();return {}}
// Démineur : 4 niveaux. À la fin, toute la grille est dévoilée (mines, drapeaux justes ou faux).
const MINES_LEVELS=[{w:8,h:8,m:8},{w:9,h:9,m:12},{w:10,h:10,m:18},{w:12,h:12,m:30}];
function mines(c){const L=MINES_LEVELS[c.difficulty]??MINES_LEVELS[1],N=L.w*L.h,SAFE=N-L.m;let board=null,shown=new Set(),flags=new Set(),flagMode=false,elapsed=0,over=false;
 const grid=c.grid(L.w,'mines m'+L.w);const cells=Array.from({length:N},(_,i)=>c.cell(grid,'',()=>tap(i)));
 const mode=c.button('⚑ Poser un drapeau',()=>{flagMode=!flagMode;mode.classList.toggle('selected-mode',flagMode);mode.textContent=flagMode?'⌕ Dévoiler une case':'⚑ Poser un drapeau'},'wide');
 function render(end=null,boom=-1){cells.forEach((b,i)=>{const mine=board?.[i]===-1,visible=shown.has(i)||(end&&board);
   let txt='',cls='cell';
   if(end&&board){if(mine)txt=flags.has(i)||end==='win'?'⚑':'✹';else txt=board[i]||'';if(flags.has(i)&&!mine){txt='✗';cls+=' wrong'}cls+=' revealed'+(mine?(i===boom?' exploded':' mine'):'')+(mine&&(flags.has(i)||end==='win')?' flagged':'')}
   else if(visible){txt=mine?'✹':board[i]||'';cls+=' revealed'}else if(flags.has(i)){txt='⚑';cls+=' flag'}
   b.textContent=txt;b.className=cls;b.dataset.n=board?.[i];b.setAttribute('aria-label',visible?mine?'Mine':`${board[i]} mines voisines`:flags.has(i)?'Drapeau':'Case '+(i+1))});
  if(!end)c.hint(`${L.m-flags.size} drapeaux restants · ${shown.size}/${SAFE} cases sûres dévoilées.`)}
 function tap(i){if(over||shown.has(i))return;if(flagMode){if(flags.has(i))flags.delete(i);else if(flags.size<L.m)flags.add(i);render();return}if(flags.has(i))return;
  if(!board)board=makeMines(i,L.w,L.h,L.m);
  const t=Math.max(1,Math.floor(elapsed));
  if(board[i]===-1){over=true;render('lose',i);c.tone(false);c.hint('Voici où se cachaient les mines.');setTimeout(()=>c.finish(false,t,'Une petite mine se cachait ici.\nLe premier clic est toujours sans danger.',{viewBoard:true}),1300);return}
  revealMines(board,shown,flags,i,L.w,L.h);render();
  if(shown.size===SAFE){over=true;render('win');c.finish(true,t,'Terrain dégagé en '+formatDuration(t)+' !',{viewBoard:true})}}
 render();return {update:dt=>{if(board&&!over){elapsed+=dt;c.score(Math.floor(elapsed),false)}}}}
function ttt(c){let b=Array(9).fill(''),turn='X',solo=true,busy=false;const grid=c.grid(3,'ttt');const cells=b.map((_,i)=>c.cell(grid,'',()=>play(i)));const mode=c.button('Mode : solo',()=>{solo=!solo;mode.textContent=solo?'Mode : solo':'Mode : 2 joueurs';b=Array(9).fill('');turn='X';busy=false;generation++;render()},'wide');let generation=0;function render(){cells.forEach((el,i)=>{el.textContent=b[i]==='X'?'×':b[i]==='O'?'○':'';el.className='cell'+(b[i]==='O'?' o':'');el.setAttribute('aria-label',b[i]||'Case '+(i+1))});c.hint(solo?(turn==='X'?'À toi ! Tu joues les croix.':'Le petit adversaire réfléchit…'):`Au tour des ${turn==='X'?'croix':'ronds'}.`)}function check(){const result=winnerTTT(b);if(!result)return false;c.finish(result==='X'||(!solo&&result!=='draw'),result==='X'?1:0,result==='draw'?'Égalité ! Vous avez bien défendu votre place.':result==='X'?'Les croix ont gagné !':solo?'Les ronds gagnent cette fois. Tente une nouvelle stratégie !':'Les ronds ont gagné !');return true}function play(i){if(b[i]||busy)return;b[i]=turn;c.tone();render();if(check())return;turn=turn==='X'?'O':'X';render();if(solo&&turn==='O'){busy=true;const gen=generation;c.later(()=>{if(gen!==generation)return;b[bestTTT(b)]='O';busy=false;turn='X';render();check()},420)}}render();return {}}
function slide(c){const board=makeSlide();let moves=0;const grid=c.grid(4,'slide');const cells=board.map((_,i)=>c.cell(grid,'',()=>move(i)));function render(){cells.forEach((b,i)=>{b.textContent=board[i]||'';b.className='cell'+(!board[i]?' empty':'');b.setAttribute('aria-label',board[i]?'Déplacer la pièce '+board[i]:'Espace vide')});c.score(moves,false)}function move(i){if(slideMove(board,i)){moves++;render();c.tone();if(slideSolved(board))c.finish(true,moves,'Tout est à sa place !\nPuzzle terminé en '+moves+' coups.')}}render();return {key:k=>{const e=board.indexOf(0),d={ArrowUp:e+4,ArrowDown:e-4,ArrowLeft:e+1,ArrowRight:e-1}[k];if(d>=0&&d<16)move(d)}}}
const ICON={
 pencil:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.2-4.6L15.6 5a2 2 0 0 1 2.8 0l.6.6a2 2 0 0 1 0 2.8L8.6 18.8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M13.5 7l3.5 3.5" stroke="currentColor" stroke-width="2"/></svg>',
 eraser:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 19.5h11M4.6 14.6l8.8-8.8a2 2 0 0 1 2.8 0l2.9 2.9a2 2 0 0 1 0 2.8l-7.7 7.7a1 1 0 0 1-.7.3H9.2a1 1 0 0 1-.7-.3l-3.9-3.9a.5.5 0 0 1 0-.7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><path d="M9 10l5.5 5.5" stroke="currentColor" stroke-width="2"/></svg>',
 bulb:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>'
};
function sudoku(c){const {board,solution}=makeSudoku([32,42,53][c.difficulty]),given=board.map(Boolean);let selected=board.findIndex(v=>!v),elapsed=0,hints=3,usedHint=false,notesMode=false,notes=Array.from({length:81},()=>new Set());
 const grid=c.grid(9,'sudoku');const cells=board.map((_,i)=>c.cell(grid,'',()=>{selected=i;render()}));
 // pavé : chiffre + nombre restant à placer
 const nums=[];for(let n=1;n<=9;n++){const b=c.button('',()=>enter(n),'number',String(n));b.innerHTML=`<span class="num">${n}</span><span class="left"></span>`;nums.push(b)}
 const tools=document.createElement('div');tools.className='sudoku-tools';c.controls.append(tools);
 const tool=(icon,label,fn)=>{const b=c.button('',fn,'tool',label);b.innerHTML=ICON[icon];tools.append(b);return b};
 const noteBtn=tool('pencil','Notes',()=>{notesMode=!notesMode;render()});
 tool('eraser','Effacer',()=>enter(0));
 const help=tool('bulb','Indice',()=>{if(hints&&!given[selected]&&board[selected]!==solution[selected]){usedHint=true;hints--;board[selected]=solution[selected];notes[selected].clear();render();check()}});
 const badge=document.createElement('span');badge.className='badge';help.append(badge);
 const box=i=>Math.floor(Math.floor(i/9)/3)*3+Math.floor(i%9/3);
 function render(){const v=board[selected];
  cells.forEach((b,i)=>{const r=Math.floor(i/9),col=i%9,peer=r===Math.floor(selected/9)||col===selected%9||box(i)===box(selected);
   if(board[i])b.textContent=board[i];else if(notes[i].size)b.innerHTML='<span class="notes">'+[1,2,3,4,5,6,7,8,9].map(n=>`<span${v&&n===v&&notes[i].has(n)?' class="hl"':''}>${notes[i].has(n)?n:''}</span>`).join('')+'</span>';else b.textContent='';
   b.className='cell'+(given[i]?' given':'')+(peer&&i!==selected?' peer':'')+(i===selected?' selected':'')+(v&&board[i]===v&&i!==selected?' same':'')+(board[i]&&board[i]!==solution[i]?' error':'');
   b.setAttribute('aria-label',`Ligne ${r+1}, colonne ${col+1}, ${board[i]||'vide'}${given[i]?', fixe':''}`)});
  nums.forEach((b,k)=>{const n=k+1,left=9-board.filter((x,i)=>x===n&&solution[i]===n).length;b.querySelector('.left').textContent=left||'';b.classList.toggle('done',!left);b.disabled=!left;b.classList.toggle('current',v===n)});
  noteBtn.classList.toggle('on',notesMode);noteBtn.setAttribute('aria-pressed',String(notesMode));
  badge.textContent=hints;help.disabled=!hints;
 }
 function check(){if(board.every((v,i)=>v===solution[i])){const t=formatDuration(Math.max(1,Math.floor(elapsed)));c.finish(true,Math.max(1,Math.floor(elapsed)),'Les 81 cases sont en harmonie.\nTerminé en '+t+(usedHint?' avec un peu d’aide.':' !'))}}
 function enter(n){if(given[selected])return;if(notesMode&&n){if(!board[selected]){if(notes[selected].has(n))notes[selected].delete(n);else notes[selected].add(n)}}else{board[selected]=n;notes[selected].clear();
   // un chiffre juste retire ce chiffre des notes de sa ligne, colonne et carré
   if(n&&n===solution[selected])for(let i=0;i<81;i++)if(Math.floor(i/9)===Math.floor(selected/9)||i%9===selected%9||box(i)===box(selected))notes[i].delete(n)}
  render();if(n&&!notesMode){const el=cells[selected];el.classList.add('fill');setTimeout(()=>el.classList.remove('fill'),300)}check()}
 render();
 return {update:dt=>{elapsed+=dt;c.score(Math.floor(elapsed),false)},key:k=>{if(/^[1-9]$/.test(k))enter(+k);if(k==='Backspace'||k==='Delete')enter(0);if(k==='n'||k==='N'){notesMode=!notesMode;render()}const d={ArrowLeft:-1,ArrowRight:1,ArrowUp:-9,ArrowDown:9}[k];if(d){selected=Math.max(0,Math.min(80,selected+d));render()}}}}
export const puzzles={'2048':game2048,memory,mines,ttt,slide,sudoku};
