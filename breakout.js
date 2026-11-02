// Casse-briques : 20 niveaux. La vitesse et le nombre de briques augmentent avec le niveau.
// Briques : normales (1 à 3 coups), acier (indestructibles, niveau 6+), lanceuses (niveau 4+) qui larguent des pics :
// un pic attrapé par la raquette coûte une vie. Bonus en cassant une brique : pièce, triple balle, vie (rare),
// balle de feu (1,5 s : traverse toutes les briques sauf l'acier).
const LEVELS=20,COLS=7,BW=46,BH=17,X0=11,Y0=44;
const HP_COLORS=['','#7cc46a','#a686e0','#f08a62'];
function seeded(n){let s=n*9301+49297;return()=>((s=(s*9301+49297)%233280)/233280)}

function makeLevel(level){
 const r=seeded(level*7+3),rows=Math.min(10,4+Math.floor(level/2)),bricks=[];
 const pattern=level%5; // 0 plein, 1 damier, 2 losange, 3 colonnes, 4 pyramide
 let lastSteel=-9;
 for(let row=0;row<rows;row++)for(let col=0;col<COLS;col++){
  if(pattern===1&&(row+col)%2&&row>1)continue;
  if(pattern===2&&Math.abs(col-3)+Math.abs(row-(rows-1)/2)>Math.max(3,rows/2+.5))continue;
  if(pattern===3&&col%3===1&&row<rows-1)continue;
  if(pattern===4&&Math.abs(col-3)>row)continue;
  let hp=1+(r()<Math.min(.7,level*.045)?1:0)+(r()<Math.max(0,level-8)*.035?1:0);
  const b={x:X0+col*(BW+3),y:Y0+row*(BH+4),hp:Math.min(3,hp),max:Math.min(3,hp),kind:'normal'};
  // acier : rangées impaires seulement et jamais deux côte à côte, pour qu'aucune brique ne soit emmurée
  if(level>=6&&row%2===1&&col-lastSteel>1&&r()<Math.min(.45,.14+(level-6)*.025)){b.kind='steel';lastSteel=col}
  else if(level>=4&&r()<Math.min(.14,.03+(level-4)*.01)){b.kind='bomber';b.hp=b.max=2;b.timer=2+r()*4}
  bricks.push(b);
 }
 // au moins une brique à casser par niveau
 if(!bricks.some(b=>b.kind!=='steel'))bricks.push({x:X0+3*(BW+3),y:Y0,hp:1,max:1,kind:'normal'});
 return bricks;
}

export function breakout(c){const [canvas,g]=c.canvas(450);
 let paddle=180,balls=[],bricks=[],drops=[],particles=[],trail=[],score=0,lives=3,level=Math.min(LEVELS,Math.max(1,c.startLevel||1)),waiting=true,fire=0,shake=0,banner=0,time=0;
 const speed=()=>Math.min(470,232+level*12),pw=()=>Math.max(62,82-level),circle=(x,y,r,color)=>{g.fillStyle=color;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill()};
 function rr(x,y,w,h,r,color){g.fillStyle=color;g.beginPath();g.roundRect?g.roundRect(x,y,w,h,r):g.rect(x,y,w,h);g.fill()}
 function setup(){balls=[];drops=[];fire=0;bricks=makeLevel(level);waiting=true;banner=1.6}
 function launch(){if(!waiting)return;waiting=false;balls=[{x:paddle,y:397,vx:(Math.random()<.5?-1:1)*90,vy:-speed()}]}
 function point(e){const r=canvas.getBoundingClientRect(),s=Math.min(r.width/360,r.height/450);paddle=Math.max(pw()/2,Math.min(360-pw()/2,(e.clientX-r.left-(r.width-360*s)/2)/s))}
 c.listen(canvas,'pointerdown',e=>{canvas.setPointerCapture(e.pointerId);point(e);launch()});c.listen(canvas,'pointermove',e=>{if(e.buttons||e.pointerType==='touch')point(e)});
 function burst(x,y,color,n=8,power=170){for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*power*2,vy:-Math.random()*power,life:1,color})}
 function loseLife(reason){lives--;shake=10;c.tone(false);burst(paddle,410,'#e5574a',14,220);if(!lives){c.finish(false,score,score+' points · Niveau '+level);return true}return false}
 function breakBrick(b){score+=10*b.max;c.score(score);burst(b.x+BW/2,b.y+BH/2,b.kind==='bomber'?'#e5574a':HP_COLORS[b.max],10);
  const roll=Math.random();let type=null;if(roll<.03)type='life';else if(roll<.08)type='fire';else if(roll<.15)type='multi';else if(roll<.32)type='coin';
  if(type)drops.push({x:b.x+BW/2,y:b.y+BH,type})}
 function hitBrick(b,ball,oldX,oldY){
  if(b.kind==='steel'){burst(ball.x,ball.y,'#b7c0c7',4,90);c.tone();return true}
  if(fire>0){b.hp=0;breakBrick(b);return false}
  b.hp--;c.tone();if(!b.hp)breakBrick(b);else burst(ball.x,ball.y,HP_COLORS[b.hp],4,90);return true}
 function draw(){g.save();if(shake>0)g.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
  const bgG=g.createLinearGradient(0,0,0,450);bgG.addColorStop(0,'#e3f0f6');bgG.addColorStop(1,'#f4f0dc');g.fillStyle=bgG;g.fillRect(-10,-10,380,470);
  g.font='600 15px "Trebuchet MS",sans-serif';g.textAlign='left';g.fillStyle='#d9534a';g.fillText('♥'.repeat(lives),14,26);g.textAlign='right';g.fillStyle='#4f6a5a';g.fillText('NIVEAU '+level,346,26);g.textAlign='left';
  for(const b of bricks){if(!b.hp&&b.kind!=='steel')continue;
   if(b.kind==='steel'){rr(b.x,b.y,BW,BH,4,'#8f9ba6');g.fillStyle='#c9d1d8';g.fillRect(b.x+3,b.y+3,BW-6,3);for(const dx of [5,BW-5])circle(b.x+dx,b.y+BH-5,1.6,'#5d6872');continue}
   const base=b.kind==='bomber'?'#e5574a':HP_COLORS[b.hp];rr(b.x,b.y+2,BW,BH,5,'#00000022');rr(b.x,b.y,BW,BH,5,base);g.fillStyle='#ffffff66';g.fillRect(b.x+4,b.y+3,BW-8,3);
   if(b.hp<b.max){g.strokeStyle='#00000040';g.lineWidth=1.3;g.beginPath();g.moveTo(b.x+12,b.y+2);g.lineTo(b.x+19,b.y+9);g.lineTo(b.x+15,b.y+15);g.stroke()}
   if(b.kind==='bomber'){const p=1+Math.sin(time*8)*.15;g.fillStyle='#fff';g.font=`800 ${12*p}px sans-serif`;g.textAlign='center';g.fillText('!',b.x+BW/2,b.y+13);g.textAlign='left'}}
  for(const d of drops){if(d.type==='spike'){g.fillStyle='#d23f35';g.beginPath();g.moveTo(d.x,d.y+12);g.lineTo(d.x-8,d.y-6);g.lineTo(d.x+8,d.y-6);g.fill();continue}
   const col={coin:'#f2b62c',multi:'#9b7be0',life:'#ec5c7a',fire:'#ff8a2a'}[d.type],label={coin:'●',multi:'×3',life:'♥',fire:'🔥︎'}[d.type];
   circle(d.x,d.y,12,col);circle(d.x-3,d.y-4,4,'#ffffff55');g.fillStyle='#fff';g.font='700 11px sans-serif';g.textAlign='center';g.fillText(d.type==='fire'?'✦':label,d.x,d.y+4);g.textAlign='left'}
  for(const t of trail){g.globalAlpha=t.life*.5;circle(t.x,t.y,6*t.life,t.fire?'#ffb347':'#7aa889')}g.globalAlpha=1;
  rr(paddle-pw()/2,411,pw(),12,6,fire>0?'#ff9b4a':'#4f8f6a');g.fillStyle='#ffffff55';g.fillRect(paddle-pw()/2+6,413,pw()-12,3);
  for(const b of balls){if(fire>0){circle(b.x,b.y,9,'#ffcf6a');circle(b.x,b.y,6,'#ff7a2a')}else{circle(b.x,b.y,7,'#2f6b55');circle(b.x-2,b.y-2,2.4,'#ffffff99')}}
  for(const p of particles){g.globalAlpha=Math.max(0,p.life);g.fillStyle=p.color;g.fillRect(p.x,p.y,5,5)}g.globalAlpha=1;
  if(waiting){circle(paddle,397,7,'#2f6b55');g.fillStyle='#4f6a5a';g.textAlign='center';g.font='600 13px "Trebuchet MS",sans-serif';g.fillText('Touche pour lancer · Glisse pour guider',180,330);g.textAlign='left'}
  if(banner>0){g.globalAlpha=Math.min(1,banner);g.fillStyle='#4f6a5a';g.font='800 34px "Trebuchet MS",sans-serif';g.textAlign='center';g.fillText('NIVEAU '+level,180,290-(1.6-banner)*10);g.textAlign='left';g.globalAlpha=1}
  g.restore()}
 setup();draw();
 return {update(dt){time+=dt;if(shake>0)shake=Math.max(0,shake-dt*30);if(banner>0)banner-=dt;if(fire>0)fire-=dt;
  for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=260*dt;p.life-=dt*1.8}particles=particles.filter(p=>p.life>0);
  for(const t of trail)t.life-=dt*5;trail=trail.filter(t=>t.life>0);
  if(waiting){draw();return}
  // briques lanceuses : larguent des pics de plus en plus souvent
  for(const b of bricks)if(b.kind==='bomber'&&b.hp>0){b.timer-=dt;if(b.timer<=0){b.timer=Math.max(1.6,6-level*.18)+Math.random()*2.5;drops.push({x:b.x+BW/2,y:b.y+BH,type:'spike'})}}
  for(const d of drops){d.y+=(d.type==='spike'?150+level*4:125)*dt;if(d.y>400&&d.y<428&&Math.abs(d.x-paddle)<pw()/2+10){d.y=999;
   if(d.type==='spike'){if(loseLife())return}
   else{c.tone(true);burst(d.x,405,'#f2b62c',6,120);if(d.type==='coin')c.collect(10);if(d.type==='life')lives=Math.min(5,lives+1);if(d.type==='fire')fire=1.5;if(d.type==='multi'){const o=balls[0];if(o)for(const vx of [-140,140])if(balls.length<9)balls.push({x:o.x,y:o.y,vx,vy:-speed()})}}}}
  drops=drops.filter(d=>d.y<470);
  const steps=Math.ceil(dt/.004),step=dt/steps;
  for(let k=0;k<steps;k++){for(const b of balls){const oldX=b.x,oldY=b.y;b.x+=b.vx*step;b.y+=b.vy*step;
    if(b.x<7){b.x=7;b.vx=Math.abs(b.vx)}if(b.x>353){b.x=353;b.vx=-Math.abs(b.vx)}if(b.y<7){b.y=7;b.vy=Math.abs(b.vy)}
    if(b.vy>0&&oldY<=404&&b.y>=404&&Math.abs(b.x-paddle)<pw()/2+7){b.y=404;b.vx=(b.x-paddle)/(pw()/2+7)*speed()*.85;b.vy=-Math.sqrt(Math.max(speed()**2*.3,speed()**2-b.vx**2));c.tone()}
    for(const br of bricks){if(br.kind!=='steel'&&!br.hp)continue;if(b.x+7>br.x&&b.x-7<br.x+BW&&b.y+7>br.y&&b.y-7<br.y+BH){
      if(hitBrick(br,b,oldX,oldY)){if(oldY+7<=br.y||oldY-7>=br.y+BH)b.vy=-b.vy;else b.vx=-b.vx;b.x=oldX;b.y=oldY;break}}}}
   balls=balls.filter(b=>b.y<465);
   if(!balls.length){drops=drops.filter(d=>d.type!=='spike');if(loseLife())return;waiting=true;fire=0;break}
   if(bricks.every(b=>b.kind==='steel'||!b.hp)){if(level===LEVELS){c.finish(true,score,LEVELS+' niveaux terminés · '+score+' points');return}level++;c.tone(true);setup();break}}
  if(Math.random()<.6)for(const b of balls)trail.push({x:b.x,y:b.y,life:1,fire:fire>0});
  draw()},
  key(k){if(k===' ')launch();if(k==='ArrowLeft')paddle=Math.max(pw()/2,paddle-25);if(k==='ArrowRight')paddle=Math.min(360-pw()/2,paddle+25)}}}
export const BREAKOUT_LEVELS=LEVELS;
export {makeLevel};
