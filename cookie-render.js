(function(root){'use strict';
const P=globalThis.CookiePhysics,TAU=Math.PI*2;
const circle=(c,x,y,r,color)=>{c.beginPath();c.arc(x,y,r,0,TAU);c.fillStyle=color;c.fill();};
function round(c,x,y,w,h,r,color){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();c.fillStyle=color;c.fill();}
function line(c,x,y,u,v,color,width=1){c.beginPath();c.moveTo(x,y);c.lineTo(u,v);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function ring(c,x,y,r,color,width=1){c.beginPath();c.arc(x,y,r,0,TAU);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function polygon(c,pts,fill){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fillStyle=fill;c.fill();}
function label(c,s,x,y,font,color,align='center'){c.font=font;c.fillStyle=color;c.textAlign=align;c.fillText(s,x,y);}
function star(c,x,y,r,color,rot=0){const pts=[];for(let i=0;i<10;i++){const a=rot+i*Math.PI/5-Math.PI/2,rr=i%2?r*.45:r;pts.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr]);}polygon(c,pts,color);}
function fluted(c,r,n,fill){const pts=[];for(let i=0;i<n*4;i++){const a=i*TAU/(n*4),rr=r-(i%4===2?4:i%2?1.5:0);pts.push([Math.cos(a)*rr,Math.sin(a)*rr]);}polygon(c,pts,fill);}
function gradient(c,a,b,r=100){const g=c.createRadialGradient(-30,-38,5,0,0,r);g.addColorStop(0,a);g.addColorStop(1,b);return g;}
function cream(c,x,y,r=12){circle(c,x+1,y+2,r,'#d8cbbb55');for(let i=0;i<6;i++){const a=i*TAU/6;circle(c,x+Math.cos(a)*r*.32,y+Math.sin(a)*r*.32,r*.62,i%2?'#fffaf0':'#f3eadb');}circle(c,x-1,y-2,r*.4,'#fffef8');}
function berry(c,x,y,r,rot){c.save();c.translate(x,y);c.rotate(rot);c.beginPath();c.moveTo(0,r);c.bezierCurveTo(-r*1.4,-r*.2,-r*.65,-r,0,-r*.62);c.bezierCurveTo(r*.65,-r,r*1.4,-r*.2,0,r);c.fillStyle='#c9585d';c.fill();for(const [u,v] of [[-3,-3],[4,-2],[0,4],[-5,3],[3,9]])circle(c,u*r/15,v*r/15,1.05,'#f9d49b');polygon(c,[[-r*.8,-r*.45],[-r*.3,-r*.65],[0,-r],[r*.25,-r*.65],[r*.8,-r*.45],[0,-r*.35]],'#6f956d');c.restore();}
const cache=[];
function makeSprite(level){const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');c.translate(128,128);c.lineCap='round';c.lineJoin='round';c.shadowColor='#76503a36';c.shadowBlur=11;c.shadowOffsetY=8;circle(c,0,0,97,'#bc9870');c.shadowColor='transparent';
 if(level===0){fluted(c,99,17,gradient(c,'#efc384','#c89250'));ring(c,0,0,89,'#b77f433f',2);const chips=[[-45,-35,14],[15,-58,11],[51,-17,13],[-7,-8,15],[-59,22,10],[22,38,12],[-18,64,10],[59,47,9]];for(const [x,y,r] of chips){polygon(c,[[x-r*.7,y-r*.5],[x+r*.4,y-r],[x+r,y+r*.3],[x+r*.1,y+r*.8],[x-r*.7,y+r*.4]],'#725041');line(c,x-r*.2,y-r*.5,x+r*.4,y-r*.5,'#99705a',2);}for(let i=0;i<24;i++){const a=i*2.399,r=27+(i*13)%55;circle(c,Math.cos(a)*r,Math.sin(a)*r,1.6,'#b47e4466');}c.beginPath();c.arc(-4,-4,82,3.65,4.6);c.strokeStyle='#ffe4a5';c.lineWidth=3;c.stroke();}
 if(level===1){fluted(c,100,22,gradient(c,'#edbe7a','#c78c46'));circle(c,0,0,83,'#ad634c');circle(c,0,-2,78,gradient(c,'#e58b87','#ba4c5a',80));c.save();c.beginPath();c.arc(0,-2,76,0,TAU);c.clip();c.rotate(.65);for(let x=-75;x<=75;x+=28){line(c,x,-90,x,90,'#dfb276',9);line(c,-90,x,90,x,'#efc78a',9);}c.restore();ring(c,0,0,84,'#f8d392',4);cream(c,0,0,16);circle(c,0,-1,8,'#bb4854');circle(c,-2,-4,2.5,'#efb3a3');}
 if(level===2){fluted(c,100,25,'#d9aa66');circle(c,0,0,86,'#f5d78c');circle(c,0,0,79,gradient(c,'#f9e89f','#e9c65d',80));for(let i=0;i<8;i++){const a=i*TAU/8;cream(c,Math.cos(a)*63,Math.sin(a)*63,13);}c.save();c.translate(0,-2);c.rotate(.5);circle(c,0,0,29,'#fff6cc');circle(c,0,0,25,'#e8c653');for(let i=0;i<8;i++){const a=i*TAU/8;line(c,0,0,Math.cos(a)*24,Math.sin(a)*24,'#fff4bf',2);}c.restore();polygon(c,[[14,22],[31,15],[44,25],[32,34]],'#91a574');}
 if(level===3){fluted(c,100,28,'#795447');circle(c,0,0,90,gradient(c,'#ab7461','#65423d'));ring(c,0,0,81,'#bd8c7066',2);c.beginPath();for(let i=0;i<150;i++){const a=i*.13,r=i*.39;c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.strokeStyle='#c08e7244';c.lineWidth=3;c.stroke();for(let i=0;i<9;i++){const a=i*TAU/9;cream(c,Math.cos(a)*70,Math.sin(a)*70,9);}for(const [x,y,a] of [[-18,-19,.3],[10,9,-.2],[30,-19,.7]]){c.save();c.translate(x,y);c.rotate(a);round(c,-10,-12,20,24,2,'#4c3731');line(c,-7,-8,6,-8,'#9d7560',2);c.restore();}circle(c,-10,24,2,'#e5bb8a');circle(c,-31,17,2,'#e5bb8a');}
 if(level===4){fluted(c,100,27,'#f0ded0');circle(c,0,0,89,gradient(c,'#f5b9b6','#dc858b'));ring(c,0,0,83,'#ffded0',2);for(let i=0;i<6;i++){const a=i*TAU/6;cream(c,Math.cos(a+.25)*65,Math.sin(a+.25)*65,12);berry(c,Math.cos(a-.1)*68,Math.sin(a-.1)*68,15,a-.4);}cream(c,0,0,22);berry(c,-5,-2,17,-.5);berry(c,16,8,13,.4);for(let i=0;i<10;i++){const a=i*2.399;circle(c,Math.cos(a)*40,Math.sin(a)*40,2,'#fff2dc');}}
 if(level===5){fluted(c,100,31,'#ddcdb9');circle(c,0,0,90,gradient(c,'#b8a6cb','#8d7d9f'));ring(c,0,0,81,'#cfc1da',2);for(let i=0;i<12;i++){const a=i*TAU/12;cream(c,Math.cos(a)*74,Math.sin(a)*74,8);}for(const [x,y,r] of [[-17,-13,17],[14,-16,18],[1,15,18],[31,10,13],[-33,13,12]]){circle(c,x,y,r,'#6f658c');circle(c,x-3,y-4,r*.66,'#8e83aa');star(c,x,y,4,'#514d6d');}polygon(c,[[0,-33],[18,-52],[34,-46],[15,-29]],'#809b7a');}
 if(level===6){fluted(c,100,32,'#e9dfc5');circle(c,0,0,90,gradient(c,'#b2d1bd','#7ba892'));for(let i=0;i<16;i++){const a=i*TAU/16;cream(c,Math.cos(a)*82,Math.sin(a)*82,7);}for(let i=0;i<25;i++){const a=i*2.399,r=35+(i*17)%35;c.save();c.translate(Math.cos(a)*r,Math.sin(a)*r);c.rotate(a);round(c,-1,-4,2,8,1,['#f1d27f','#e7acac','#fff4df'][i%3]);c.restore();}for(const [x,y,col] of [[-23,5,'#d88c8d'],[0,-11,'#e2bd6b'],[23,5,'#c3a0bc']]){round(c,x-5,y-16,10,29,3,col);line(c,x-2,y-12,x+2,y+8,'#fff1d3',1);c.beginPath();c.moveTo(x,y-34);c.bezierCurveTo(x-10,y-23,x-4,y-15,x,y-18);c.bezierCurveTo(x+7,y-16,x+10,y-24,x,y-34);c.fillStyle='#f1c876';c.fill();circle(c,x,y-23,2,'#fff0b0');}}
 if(level===7){fluted(c,100,35,'#d7b272');circle(c,0,0,91,'#f6e8ce');for(let i=0;i<20;i++){const a=i*TAU/20;cream(c,Math.cos(a)*84,Math.sin(a)*84,6);}circle(c,1,4,70,'#b7977144');circle(c,0,0,69,'#dca4a0');ring(c,0,0,64,'#fae3cd',2);for(let i=0;i<12;i++){const a=i*TAU/12;circle(c,Math.cos(a)*61,Math.sin(a)*61,3,'#f9e8c8');}circle(c,1,3,46,'#a98b6944');circle(c,0,0,46,'#fff1d9');ring(c,0,0,40,'#d9b778',2);for(let i=0;i<8;i++){const a=i*TAU/8;cream(c,Math.cos(a)*36,Math.sin(a)*36,5);}circle(c,0,0,25,'#e1c17f');star(c,0,-1,19,'#fff0b5',.2);star(c,0,-2,12,'#d3a554',.2);}
 return canvas;
}
function pastry(c,level,x,y,r,angle=0,alpha=1){cache[level]=cache[level]||makeSprite(level);c.save();c.globalAlpha=alpha;c.translate(x,y);c.rotate(angle);c.drawImage(cache[level],-r*1.28,-r*1.28,r*2.56,r*2.56);c.restore();}
class Renderer{
 constructor(canvas){this.canvas=canvas;this.c=canvas.getContext('2d');this.particles=[];this.popups=[];this.trails=new Map();this.w=1;this.h=1;this.scale=1;this.resize();}
 resize(){const r=this.canvas.getBoundingClientRect();if(!r.width||!r.height)return;this.w=r.width;this.h=r.height;this.dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(this.w*this.dpr);this.canvas.height=Math.round(this.h*this.dpr);this.scale=Math.min(this.w/P.W,this.h/P.H);this.ox=(this.w-P.W*this.scale)/2;this.oy=(this.h-P.H*this.scale)/2;}
 toWorld(x,y){return [(x-this.ox)/this.scale,(y-this.oy)/this.scale];}
 toScreen(x,y){return [x*this.scale+this.ox,y*this.scale+this.oy];}
 burst(e){const count=e.type==='win'?75:15;for(let i=0;i<count;i++)this.particles.push({x:e.x||180,y:e.y||170,vx:(Math.random()-.5)*140,vy:-35-Math.random()*120,age:0,life:e.type==='win'?2.5:.8+Math.random()*.4,size:2+Math.random()*3,spin:Math.random()*6,color:[P.TIERS[e.level||1].color,'#eacb8c','#fcf0d4','#a2b9a3'][i%4],star:i%4===0});if(e.type==='merge')this.popups.push({x:e.x,y:e.y-18,age:0,text:'+'+e.points,combo:e.combo});}
 update(dt){for(const p of this.particles){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=150*dt;p.spin+=dt*2;}this.particles=this.particles.filter(p=>p.age<p.life);for(const p of this.popups)p.age+=dt;this.popups=this.popups.filter(p=>p.age<1.2);}
 draw(game,options={}){const c=this.c,{time=0,aim=null,reduced=false}=options;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,this.w,this.h);c.translate(this.ox,this.oy);c.scale(this.scale,this.scale);
  // A shallow baking tray with a pale curling target.
  round(c,1,4,358,554,23,'#d9c6b52b');round(c,1,0,358,555,23,'#e6d4bb');round(c,3,0,354,551,22,'#fffaf0');round(c,10,14,340,534,16,'#f6f1df');
  c.save();c.beginPath();c.rect(10,14,340,534);c.clip();circle(c,180,139,85,'#dce8d630');circle(c,180,139,61,'#e7c5b724');circle(c,180,139,32,'#d4e0cc2a');circle(c,180,139,4,'#b7c9b950');
  for(let x=30;x<350;x+=20)for(let y=35;y<455;y+=20)circle(c,x,y,.65,'#cbbb9e28');
  c.fillStyle=game.phase==='lost'?'#e8a1a33b':'#f0d8d038';c.fillRect(10,P.LINE,340,95);for(let x=-80;x<400;x+=15)line(c,x,P.LINE+90,x+95,P.LINE,'#d3a39d0c',4);
  c.restore();
  c.save();c.setLineDash([4,6]);line(c,18,P.LINE,342,P.LINE,game.phase==='lost'?'#c46060':'#cf969084',1);c.restore();label(c,'GARDE CETTE ZONE LIBRE',180,P.LINE+17,'6px system-ui','#bd9690');
  // Dust and motion trails stay under the desserts.
  const ids=new Set(game.pieces.map(p=>p.id));for(const id of this.trails.keys())if(!ids.has(id))this.trails.delete(id);
  for(const p of game.pieces){let t=this.trails.get(p.id)||[];if(Math.hypot(p.vx,p.vy)>90&&!reduced)t.push([p.x,p.y]);else t=t.slice(1);if(t.length>9)t.shift();this.trails.set(p.id,t);for(let i=0;i<t.length;i++)circle(c,t[i][0],t[i][1],Math.max(1,p.r*.35*i/t.length),P.TIERS[p.level].color+'12');}
  if(aim){const pts=P.predict(game.launchX,aim.dx,aim.dy,aim.power,game.pieces);for(let i=1;i<pts.length;i++){circle(c,pts[i][0],pts[i][1],1.6,'#b77b6b'+Math.round(150*(1-i/pts.length)+30).toString(16).padStart(2,'0'));}const q=pts[pts.length-1];ring(c,q[0],q[1],7,'#bd8c7560',1);}
  for(const p of game.pieces){let scale=1;if(!reduced){const age=game.time-p.born;if(age<.24)scale=.76+.24*Math.min(1,age/.15)+Math.sin(Math.min(1,age/.24)*Math.PI)*.09;}pastry(c,p.level,p.x,p.y,p.r*scale,p.angle);}
  if(game.phase==='ready'){
   line(c,47,P.LAUNCH,313,P.LAUNCH,'#ddc7ba',1);for(const x of [41,319]){line(c,x,P.LAUNCH,x+(x<180?4:-4),P.LAUNCH-3,'#c8ac9d',1);line(c,x,P.LAUNCH,x+(x<180?4:-4),P.LAUNCH+3,'#c8ac9d',1);}
   circle(c,game.launchX,P.LAUNCH,26,'#fff8eac9');ring(c,game.launchX,P.LAUNCH,25,'#dcb8a53f',1);pastry(c,0,game.launchX,P.LAUNCH,14,0);
   if(aim){c.beginPath();c.arc(game.launchX,P.LAUNCH,25,Math.PI*.75,Math.PI*.75+(aim.power-180)/600*Math.PI*1.5);c.strokeStyle=aim.power>620?'#c88073':'#91a98c';c.lineWidth=3;c.stroke();label(c,aim.power>620?'ÉNERGIQUE':aim.power>380?'BIEN DOSÉ':'TOUT DOUX',game.launchX,550,'6px system-ui','#a88370');}
   else{const bob=reduced?0:Math.sin(time*3)*2;line(c,game.launchX,P.LAUNCH-33+bob,game.launchX,P.LAUNCH-43+bob,'#c59c8455',1.5);line(c,game.launchX,P.LAUNCH-43+bob,game.launchX-3,P.LAUNCH-40+bob,'#c59c8455',1.5);line(c,game.launchX,P.LAUNCH-43+bob,game.launchX+3,P.LAUNCH-40+bob,'#c59c8455',1.5);}
  }
  for(const p of this.particles){c.save();c.globalAlpha=Math.max(0,1-p.age/p.life);if(p.star)star(c,p.x,p.y,p.size,p.color,p.spin);else{c.translate(p.x,p.y);c.rotate(p.spin);round(c,-p.size/2,-p.size,p.size,p.size*1.5,1,p.color);}c.restore();}
  for(const p of this.popups){c.save();c.globalAlpha=Math.max(0,1-p.age/1.2);label(c,p.text,p.x,p.y-p.age*24,'600 16px system-ui','#a36159');if(p.combo>=2)label(c,'COMBO ×'+p.combo,p.x,p.y+11-p.age*24,'600 6px system-ui','#9a8e6a');c.restore();}
 }
 hero(time,reduced=false){const c=this.c;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,this.w,this.h);const s=Math.min(this.w/370,this.h/245);c.translate(this.w/2,this.h/2);c.scale(s,s);circle(c,47,-2,101,'#e2e8d3');ring(c,47,-2,112,'#dfd9c5',1);const f=reduced?0:Math.sin(time*1.3)*3;
  pastry(c,4,60,-10+f,67,-.15);pastry(c,1,-48,47-f,39,.1);pastry(c,0,-116,-34+f,27,-.35);pastry(c,0,-80,-88-f,21,.3);
  for(const [x,y,r] of [[128,-83,7],[-133,49,5],[-8,-107,4],[142,55,4]])star(c,x,y,r,'#d6b676',time*.12);circle(c,-37,-39,2,'#cca787');circle(c,123,91,3,'#cb9b8d');circle(c,-133,-77,3,'#a9b89b');
 }
}
function thumbnail(canvas,level,alpha=1){const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);pastry(c,level,canvas.width/2,canvas.height/2,canvas.width*.38,-.12,alpha);}
root.CookieRenderer={Renderer,pastry,thumbnail};
})(typeof window!=='undefined'?window:globalThis);

