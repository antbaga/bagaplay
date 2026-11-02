import {rand,shuffle,shapes,rotate,blockFits,clearLines} from './engines.js';
const colors=['#88bc71','#e58e79','#a186d5','#fbcd48','#71b4cf','#b5d26a','#d79bc2'];
function box(g,x,y,w,h,color,r=5){g.fillStyle=color;g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();g.fill()}
function text(g,s,x,y,size=14,color='#56764a',align='center'){g.fillStyle=color;g.font=`600 ${size}px "Trebuchet MS",sans-serif`;g.textAlign=align;g.fillText(s,x,y)}
function bg(g,h){g.fillStyle='#f0f5da';g.fillRect(0,0,360,h)}
function cover(g,h,title,sub){g.fillStyle='#fcf5e7e8';g.fillRect(0,h/2-56,360,112);text(g,title,180,h/2-8,25);text(g,sub,180,h/2+24,12)}
const dirs={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'};
function snake(c){const [canvas,g]=c.canvas(400);const N=18,vec={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]};
 let body=[{x:8,y:9},{x:7,y:9},{x:6,y:9}],dir='right',queue=[],food={x:12,y:9},score=0,clock=0,time=0,started=false,previous=body.map(p=>({...p})),particles=[],flash=0;
 const delay=()=>Math.max(.065,[.2,.14,.095][c.difficulty]-score*.0004);
 // virages mis en file : un geste en angle (haut puis droite…) donne deux virages successifs, sans demi-tour
 function steer(d){started=true;const last=queue.length?queue[queue.length-1]:dir;if(d===last)return;const a=vec[d],b=vec[last];if(a[0]+b[0]===0&&a[1]+b[1]===0)return;if(queue.length<3)queue.push(d)}
 // direction lue pendant le glissé (pas au relâcher) : réaction immédiate.
 // Après une première direction, un virage n'est compté que si le doigt part nettement à angle droit
 // (écart perpendiculaire ≥ 1,6 seuil et nettement plus grand que l'avance dans l'axe) : un trait un peu penché ne tourne pas.
 let gesture=null;
 c.listen(c.board,'pointerdown',e=>{started=true;gesture={x:e.clientX,y:e.clientY,dir:null};c.board.setPointerCapture?.(e.pointerId)});
 c.listen(c.board,'pointermove',e=>{if(!gesture)return;const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y,T=Math.max(16,canvas.getBoundingClientRect().width/20);
  if(!gesture.dir){if(Math.max(Math.abs(dx),Math.abs(dy))<T)return;const d=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';steer(d);Object.assign(gesture,{dir:d,x:e.clientX,y:e.clientY});return}
  const horiz=gesture.dir==='left'||gesture.dir==='right',par=horiz?dx:dy,perp=horiz?dy:dx;
  if(Math.abs(perp)>=1.6*T&&Math.abs(perp)>1.8*Math.abs(par)){const d=horiz?perp>0?'down':'up':perp>0?'right':'left';steer(d);Object.assign(gesture,{dir:d,x:e.clientX,y:e.clientY})}
  else if(Math.abs(par)>T)Object.assign(gesture,{x:e.clientX,y:e.clientY})});
 c.listen(c.board,'pointerup',()=>gesture=null);c.listen(c.board,'pointercancel',()=>gesture=null);
 function draw(){bg(g,400);for(let y=0;y<N;y++)for(let x=0;x<N;x++){g.fillStyle=(x+y)%2?'#e4f2cb':'#eaf7d6';g.fillRect(x*20,y*20+20,20,20)}
  const pul=1+Math.sin(time*8)*.12;box(g,food.x*20+10-7*pul,food.y*20+30-7*pul,14*pul,14*pul,'#ff4f31',6);g.fillStyle='#4aa137';g.fillRect(food.x*20+9,food.y*20+21,2,5);
  const t=Math.min(1,clock/delay()),smooth=body.map((s,i)=>{const p=previous[i]||s;return {x:p.x+(s.x-p.x)*t,y:p.y+(s.y-p.y)*t}});
  for(let i=smooth.length-1;i>=0;i--){const s=smooth[i],k=i/smooth.length;box(g,s.x*20+1,s.y*20+21,18,18,i?`hsl(${105-k*25},${42+flash*30}%,${52+k*12}%)`:'#388f31',6)}
  const h=smooth[0],[dx,dy]=vec[dir],ex=dy?4:0,ey=dx?4:0;g.fillStyle='#fffaf0';for(const s of [-1,1]){g.beginPath();g.arc(h.x*20+10+dx*4+ex*s,h.y*20+30+dy*4+ey*s,3,0,7);g.fill()}g.fillStyle='#183023';for(const s of [-1,1]){g.beginPath();g.arc(h.x*20+10+dx*5+ex*s,h.y*20+30+dy*5+ey*s,1.5,0,7);g.fill()}
  for(const p of particles){g.globalAlpha=Math.max(0,p.life);g.fillStyle=p.color;g.beginPath();g.arc(p.x,p.y,3*p.life+1,0,7);g.fill()}g.globalAlpha=1;
  if(!started)cover(g,400,'Snake','Glisse pour commencer')}
 draw();
 return {update(dt){time+=dt;flash=Math.max(0,flash-dt*3);for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt*1.8}particles=particles.filter(p=>p.life>0);
  if(!started){draw();return}clock+=dt;if(clock<delay()){draw();return}clock=0;dir=queue.shift()||dir;
  const [dx,dy]=vec[dir],head={x:body[0].x+dx,y:body[0].y+dy},eating=head.x===food.x&&head.y===food.y,obstacles=eating?body:body.slice(0,-1);
  if(head.x<0||head.x>=N||head.y<0||head.y>=N||obstacles.some(s=>s.x===head.x&&s.y===head.y)){c.finish(false,score,'Ton serpent a récolté '+score+' points.\nPrêt pour une nouvelle promenade ?');return}
  previous=body.map(p=>({...p}));body.unshift(head);
  if(eating){score+=10;c.score(score);c.tone(true);flash=1;for(let i=0;i<12;i++){const a=i/12*Math.PI*2;particles.push({x:food.x*20+10,y:food.y*20+30,vx:Math.cos(a)*90,vy:Math.sin(a)*90,life:1,color:i%2?'#ff4f31':'#ffc22f'})}
   const free=[];for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(!body.some(s=>s.x===x&&s.y===y))free.push({x,y});if(!free.length){c.finish(true,score,'Tu as rempli tout le jardin !');return}food=free[rand(free.length)]}
  else body.pop();draw()},
  key:k=>{if(k===' ')started=true;if(dirs[k])steer(dirs[k])}}}
function blocks(c){const [canvas,g]=c.canvas(400);let board=Array.from({length:18},()=>Array(10).fill(0)),bag=[],piece,next=take(),score=0,lines=0,clock=0,started=false,flashRows=[],flashT=0,shake=0;
 function take(){if(!bag.length)bag=shuffle([0,1,2,3,4,5,6]);return bag.pop()}
 function spawn(){const id=next;next=take();piece={shape:shapes[id].map(r=>r.slice()),x:3,y:0,id};if(!blockFits(board,piece.shape,piece.x,piece.y)){draw();c.finish(false,score,'La pile a atteint le ciel.\n'+lines+' lignes et '+score+' points.')}}
 function lock(){piece.shape.forEach((r,j)=>r.forEach((v,i)=>{if(v&&piece.y+j>=0)board[piece.y+j][piece.x+i]=piece.id+1}));
  const full=board.map((r,i)=>r.every(Boolean)?i:-1).filter(i=>i>=0);const out=clearLines(board);board=out.board;lines+=out.count;score+=[0,100,300,500,800][out.count]*(1+Math.floor(lines/10));c.score(score);
  if(out.count){c.tone(true);flashRows=full;flashT=.35;shake=out.count*3}else shake=Math.max(shake,1.2);spawn()}
 function move(dx,dy){if(!started||!piece)return false;if(blockFits(board,piece.shape,piece.x+dx,piece.y+dy)){piece.x+=dx;piece.y+=dy;if(dy){score++;c.score(score)}draw();return true}if(dy)lock();draw();return false}
 function turn(){if(!started)return;const shape=rotate(piece.shape);for(const kick of [0,-1,1,-2,2])if(blockFits(board,shape,piece.x+kick,piece.y)){piece.shape=shape;piece.x+=kick;c.tone();break}draw()}
 function drop(){if(!started)return;while(blockFits(board,piece.shape,piece.x,piece.y+1)){piece.y++;score+=2}shake=Math.max(shake,2.5);lock();draw()}
 function paint(shape,x,y,id,ghost=false){shape.forEach((r,j)=>r.forEach((v,i)=>{if(v&&y+j>=0){const X=20+(x+i)*18+1,Y=20+(y+j)*18+1;if(ghost){g.strokeStyle=colors[id];g.lineWidth=2;g.strokeRect(X+1.5,Y+1.5,13,13)}else{box(g,X,Y,16,16,colors[id],3);g.fillStyle='#ffffff55';g.fillRect(X+3,Y+3,10,3)}}}))}
 function draw(){g.save();if(shake>0)g.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);bg(g,400);box(g,17,17,186,330,'#dbecc0',7);
  for(let y=0;y<18;y++)for(let x=0;x<10;x++){const v=board[y][x];box(g,21+x*18,21+y*18,16,16,v?colors[v-1]:'#eaf4d5',3)}
  if(flashT>0){g.fillStyle=`rgba(255,250,220,${flashT*2.4})`;for(const r of flashRows)g.fillRect(19,19+r*18,182,18)}
  if(piece){let ghost=piece.y;while(blockFits(board,piece.shape,piece.x,ghost+1))ghost++;paint(piece.shape,piece.x,ghost,piece.id,true);paint(piece.shape,piece.x,piece.y,piece.id)}
  text(g,'À SUIVRE',274,39,11);shapes[next].forEach((r,j)=>r.forEach((v,i)=>{if(v)box(g,232+i*20,57+j*20,18,18,colors[next],4)}));text(g,'LIGNES',274,153,11);text(g,lines,274,183,27);text(g,'NIVEAU',274,233,11);text(g,1+Math.floor(lines/10),274,263,27);
  if(!started)cover(g,400,'Blocs pastel','Glisse pour déplacer, touche pour tourner.');g.restore()}
 // le bloc suit le pouce horizontalement (comme la raquette du casse-briques) ; glisser vers le bas accélère ; toucher = tourner ; lancer vers le bas = poser
 let drag=null;
 c.listen(canvas,'pointerdown',e=>{canvas.setPointerCapture?.(e.pointerId);if(!started){started=true;draw();return}drag={x:e.clientX,y:e.clientY,col:piece.x,rows:0,moved:false,t:performance.now()}});
 c.listen(canvas,'pointermove',e=>{if(!drag||!piece)return;const cell=canvas.getBoundingClientRect().width*18/360,dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(Math.abs(dx)>cell*.4||Math.abs(dy)>cell*.6)drag.moved=true;const target=drag.col+Math.round(dx/cell);while(piece.x<target&&move(1,0));while(piece.x>target&&move(-1,0));
  const rows=Math.floor(Math.max(0,dy)/cell);while(drag.rows<rows){drag.rows++;if(!move(0,1)){drag=null;return}}});
 c.listen(canvas,'pointerup',e=>{if(!drag)return;const dt=performance.now()-drag.t,dy=e.clientY-drag.y,dx=e.clientX-drag.x;
  if(dy>45&&dt<230&&Math.abs(dy)>Math.abs(dx)*1.5)drop();else if(dy<-35&&Math.abs(dy)>Math.abs(dx))turn();else if(!drag.moved)turn();drag=null});
 c.listen(canvas,'pointercancel',()=>drag=null);
 spawn();draw();
 return {update(dt){if(flashT>0)flashT-=dt;if(shake>0)shake=Math.max(0,shake-dt*14);if(!started){draw();return}clock+=dt;if(clock>Math.max(.1,.72-Math.floor(lines/10)*.07)){clock=0;if(blockFits(board,piece.shape,piece.x,piece.y+1))piece.y++;else lock()}draw()},
  key:k=>{if(!started&&k)started=true;if(k==='ArrowLeft')move(-1,0);if(k==='ArrowRight')move(1,0);if(k==='ArrowDown')move(0,1);if(k==='ArrowUp')turn();if(k===' ')drop()}}}
function breakout(c){const [canvas,g]=c.canvas(450);let paddle=180,x=180,y=392,vx=125,vy=-205,score=0,lives=3,level=1,waiting=true,bricks=[];function makeBricks(){bricks=Array.from({length:30},(_,i)=>({x:15+i%6*55,y:40+Math.floor(i/6)*24,active:true,color:colors[Math.floor(i/6)]}))}function launch(){if(waiting){waiting=false;vx=(Math.random()<.5?-1:1)*125;vy=-Math.min(280,205+level*10)}}function pointer(e){const r=canvas.getBoundingClientRect(),scale=Math.min(r.width/360,r.height/450);paddle=Math.max(42,Math.min(318,(e.clientX-r.left-(r.width-360*scale)/2)/scale));if(waiting)x=paddle}c.listen(canvas,'pointerdown',e=>{canvas.setPointerCapture?.(e.pointerId);pointer(e);launch()});c.listen(canvas,'pointermove',e=>{if(e.buttons||e.pointerType==='touch')pointer(e)});function draw(){bg(g,450);text(g,'♥'.repeat(lives)+'♡'.repeat(3-lives),40,22,16,'#cf8066','left');text(g,'JARDIN '+level,320,22,11,'#6e9159','right');bricks.forEach(b=>{if(b.active){box(g,b.x,b.y+3,49,18,'#94ae7133',5);box(g,b.x,b.y,49,18,b.color,5)}});box(g,paddle-40,411,80,12,'#72b083',6);g.fillStyle='#59936d';g.beginPath();g.arc(x,y,7,0,Math.PI*2);g.fill();if(waiting){text(g,'Prêt pour le rebond ?',180,251,22);text(g,'Touche pour lancer, glisse pour guider.',180,280,12)}}makeBricks();draw();return {update(dt){if(waiting){x=paddle;y=398;draw();return}const steps=Math.ceil(dt/.006),step=dt/steps;for(let k=0;k<steps;k++){const oldY=y;x+=vx*step;y+=vy*step;if(x<7){x=7;vx=Math.abs(vx)}if(x>353){x=353;vx=-Math.abs(vx)}if(y<7){y=7;vy=Math.abs(vy)}if(vy>0&&y+7>=411&&oldY+7<=423&&x>paddle-47&&x<paddle+47){y=404;const angle=(x-paddle)/47;vx=angle*260;vy=-Math.sqrt(Math.max(14000,290*290-vx*vx))}for(const b of bricks)if(b.active&&x+7>b.x&&x-7<b.x+49&&y+7>b.y&&y-7<b.y+18){b.active=false;if(oldY+7<=b.y||oldY-7>=b.y+18)vy=-vy;else vx=-vx;score+=10;c.score(score);c.tone();break}if(y>460){lives--;if(!lives){c.finish(false,score,'Plus de balles, mais '+score+' points récoltés !');return}waiting=true;break}if(bricks.every(b=>!b.active)){if(level===5){c.finish(true,score,'Les 5 jardins sont libérés !\nUn sans-faute tout en rebonds.');return}level++;makeBricks();waiting=true;break}}draw()},key:k=>{if(k==='ArrowLeft')paddle=Math.max(42,paddle-24);if(k==='ArrowRight')paddle=Math.min(318,paddle+24);if(k===' ')launch()}}}
function bird(c){const [canvas,g]=c.canvas(450);let y=210,vy=0,pipes=[],score=0,dist=0,time=0,started=false,ground=420,feathers=[],scroll=0;
 // la vitesse augmente à chaque obstacle franchi ; dès 4 obstacles, les colonnes montent et descendent de plus en plus
 const speed=()=>Math.min(290,125+score*5),spacing=230;
 function flap(){if(!started){started=true}vy=-265;c.tone();for(let i=0;i<4;i++)feathers.push({x:80,y:y+6,vx:-40-Math.random()*60,vy:Math.random()*60-30,life:1})}
 c.listen(canvas,'pointerdown',flap);
 function gapAt(p){return Math.max(p.gap/2+20,Math.min(ground-p.gap/2-20,p.base+Math.sin(time*p.freq+p.phase)*p.amp))}
 function draw(){const sky=g.createLinearGradient(0,0,0,450);sky.addColorStop(0,'#cff0fb');sky.addColorStop(1,'#fbf5ce');g.fillStyle=sky;g.fillRect(0,0,360,450);
  g.fillStyle='#ffffffcc';for(const [x0,yy,r] of [[55,67,24],[258,111,31],[140,147,18]]){const x=((x0-scroll*.25)%440+440)%440-40;g.beginPath();g.arc(x,yy,r,0,7);g.arc(x+22,yy+4,r*.8,0,7);g.fill()}
  for(const p of pipes){const ct=gapAt(p);if(!p.coin){const bob=Math.sin(time*6)*2;g.fillStyle='#ffb917';g.beginPath();g.arc(p.x+27,ct+bob,9,0,7);g.fill();g.fillStyle='#fff3b0';g.beginPath();g.arc(p.x+24,ct-3+bob,3,0,7);g.fill()}
   const col=p.amp?'#7bcf56':'#8ed368',cap=p.amp?'#63bd40':'#74c54f';box(g,p.x,0,54,ct-p.gap/2,col,4);box(g,p.x-4,ct-p.gap/2-17,62,17,cap,4);box(g,p.x,ct+p.gap/2,54,ground-ct-p.gap/2,col,4);box(g,p.x-4,ct+p.gap/2,62,17,cap,4)}
  g.fillStyle='#c9e67d';g.fillRect(0,ground,360,30);g.fillStyle='#b5d662';for(let x=-((scroll)%24);x<360;x+=24)g.fillRect(x,ground,12,4);
  for(const f of feathers){g.globalAlpha=Math.max(0,f.life);g.fillStyle='#ffd15e';g.beginPath();g.ellipse(f.x,f.y,4,2,f.life*3,0,7);g.fill()}g.globalAlpha=1;
  g.save();g.translate(88,y);g.rotate(Math.max(-.4,Math.min(.8,vy*.0022)));g.fillStyle='#ffcb2b';g.beginPath();g.ellipse(0,0,16,13,0,0,7);g.fill();
  const wing=Math.sin(time*(started?22:6))*5;g.fillStyle='#fff6dc';g.beginPath();g.ellipse(-6,3+wing*.4,10,6,-.3+wing*.06,0,7);g.fill();g.fillStyle='#ff731c';g.beginPath();g.moveTo(14,-3);g.lineTo(24,1);g.lineTo(14,6);g.fill();g.fillStyle='#243920';g.beginPath();g.arc(7,-5,2.6,0,7);g.fill();g.restore();
  if(!started)cover(g,450,'Un petit envol','Touche l’écran pour battre des ailes.')}
 draw();
 return {update(dt){time+=dt;for(const f of feathers){f.x+=f.vx*dt;f.y+=f.vy*dt;f.life-=dt*2}feathers=feathers.filter(f=>f.life>0);if(!started){y=210+Math.sin(time*3)*8;draw();return}
  vy+=760*dt;y+=vy*dt;const v=speed();scroll+=v*dt;dist+=v*dt;
  if(dist>=spacing||!pipes.length&&dist>140){dist=0;const lvl=Math.max(0,score-3),amp=lvl?Math.min(70,18+lvl*5):0;pipes.push({x:380,base:150+rand(140),gap:Math.max(118,165-score*1.6),amp,freq:1.2+Math.min(1.6,lvl*.08),phase:Math.random()*6,passed:false})}
  for(const p of pipes){p.x-=v*dt;const ct=gapAt(p);
   if(!p.coin&&Math.abs(p.x+27-88)<22&&Math.abs(ct-y)<23){p.coin=true;c.collect(5)}
   if(!p.passed&&p.x+54<72){p.passed=true;score++;c.score(score)}
   if(88+12>p.x-4&&88-12<p.x+58&&(y-11<ct-p.gap/2||y+11>ct+p.gap/2)){draw();c.finish(false,score,'Tu as franchi '+score+' obstacle'+(score>1?'s':'')+'.\nUn nouveau départ t’attend !');return}}
  pipes=pipes.filter(p=>p.x>-70);if(y<11||y>ground-12){c.finish(false,score,'Un peu trop près du bord !\n'+score+' obstacles franchis.');return}draw()},
  key:k=>{if(k===' '||k==='ArrowUp')flap()}}}
export const arcade={snake,blocks,breakout,bird};
