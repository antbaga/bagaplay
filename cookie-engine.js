(function(root){'use strict';
const W=360,H=560,LINE=456,LAUNCH=518,LEFT=10,RIGHT=350,TOP=14,BOTTOM=548,DT=1/120;
const TIERS=[
 {name:'Cookie',radius:14,color:'#dba15f',subtitle:'Tout commence par une pépite.'},
 {name:'Tartelette',radius:19,color:'#cf5d61',subtitle:'Un cœur de confiture.'},
 {name:'Tarte citron',radius:25,color:'#e8c768',subtitle:'Un peu de soleil.'},
 {name:'Moelleux chocolat',radius:32,color:'#80544b',subtitle:'Le chocolat, évidemment.'},
 {name:'Fraisier',radius:40,color:'#e99a9c',subtitle:'La vie en rose.'},
 {name:'Délice myrtille',radius:49,color:'#9a8ab4',subtitle:'Une douceur bien ronde.'},
 {name:'Gâteau de fête',radius:60,color:'#88b5a3',subtitle:'Il y a quelque chose à fêter.'},
 {name:'Pièce montée',radius:73,color:'#e4c58c',subtitle:'Le grand chef-d’œuvre !'}
];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
class Game{
 constructor(saved){this.pieces=[];this.phase='ready';this.score=0;this.shots=0;this.highest=0;this.id=1;this.time=0;this.combo=0;this.maxCombo=0;this.settle=0;this.shotTime=0;this.launchX=180;this.events=[];this.acc=0;this.undoState=null;this.pendingWin=false;if(saved)this.restore(saved);}
 add(level,x,y,vx=0,vy=0){const p={id:this.id++,level,x,y,vx,vy,r:TIERS[level].radius,angle:(this.id*2.399)%6.28,spin:0,born:this.time-.3};this.pieces.push(p);return p;}
 snapshot(includeUndo=true){return {version:1,pieces:this.pieces.map(p=>({...p})),phase:this.phase,score:this.score,shots:this.shots,highest:this.highest,id:this.id,time:this.time,combo:this.combo,maxCombo:this.maxCombo,settle:this.settle,shotTime:this.shotTime,launchX:this.launchX,pendingWin:this.pendingWin,undoState:includeUndo?this.undoState:null};}
 restore(s){if(!s||s.version!==1||!Array.isArray(s.pieces)||s.pieces.length>100)throw Error('Invalid save');for(const p of s.pieces)if(!Number.isInteger(p.level)||p.level<0||p.level>=TIERS.length||!['x','y','vx','vy'].every(k=>Number.isFinite(p[k])))throw Error('Invalid piece');
  for(const k of ['phase','score','shots','highest','id','time','combo','maxCombo','settle','shotTime','launchX','pendingWin','undoState'])if(s[k]!==undefined)this[k]=s[k];this.pieces=s.pieces.map(p=>({...p,r:TIERS[p.level].radius}));this.events=[];this.acc=0;
 }
 launch(x,dx,dy,power){if(this.phase!=='ready'||!Number.isFinite(dx)||!Number.isFinite(dy)||dy>=-1||!Number.isFinite(power))return false;const angle=clamp(Math.atan2(dx,-dy),-1.15,1.15),v=clamp(power,180,1100);
  this.undoState=this.snapshot(false);this.launchX=clamp(x,LEFT+18,RIGHT-18);this.add(0,this.launchX,LAUNCH,Math.sin(angle)*v,-Math.cos(angle)*v);this.phase='moving';this.shots++;this.combo=0;this.shotTime=0;this.settle=0;this.pendingWin=false;this.events.push({type:'launch'});return true;
 }
 undo(){if(!this.undoState)return false;const old=this.undoState;this.restore(old);this.undoState=null;this.phase='ready';this.events.push({type:'undo'});return true;}
 advance(dt){if(this.phase!=='moving')return;this.acc+=clamp(dt,0,.1);while(this.acc+1e-10>=DT&&this.phase==='moving'){this.step(DT);this.acc-=DT;}if(this.acc<0)this.acc=0;}
 wall(p){let hit=false;if(p.x-p.r<LEFT){p.x=LEFT+p.r;if(p.vx<0){p.vx*=-.65;hit=true;}}if(p.x+p.r>RIGHT){p.x=RIGHT-p.r;if(p.vx>0){p.vx*=-.65;hit=true;}}if(p.y-p.r<TOP){p.y=TOP+p.r;if(p.vy<0){p.vy*=-.65;hit=true;}}if(p.y+p.r>BOTTOM){p.y=BOTTOM-p.r;if(p.vy>0){p.vy*=-.45;hit=true;}}if(hit&&Math.hypot(p.vx,p.vy)>70)this.events.push({type:'bounce',x:p.x,y:p.y});}
 merge(a,b){
  const level=a.level+1,x=(a.x+b.x)/2,y=(a.y+b.y)/2,vx=(a.vx+b.vx)/2,vy=(a.vy+b.vy)/2;
  this.pieces=this.pieces.filter(p=>p!==a&&p!==b);const p=this.add(level,x,y,vx,vy);p.born=this.time;p.angle=(a.angle+b.angle)/2;p.spin=(a.spin+b.spin)/2;this.wall(p);
  this.combo++;this.maxCombo=Math.max(this.maxCombo,this.combo);const points=10*(1<<level)*Math.min(5,this.combo);this.score+=points;
  const discovered=level>this.highest;this.highest=Math.max(this.highest,level);this.events.push({type:'merge',x:p.x,y:p.y,level,points,combo:this.combo,discovered});if(level===TIERS.length-1)this.pendingWin=true;
 }
 collide(a,b,allowMerge=true){
  let dx=b.x-a.x,dy=b.y-a.y,d2=dx*dx+dy*dy,r=a.r+b.r;if(d2>r*r)return false;
  if(allowMerge&&a.level===b.level&&a.level<TIERS.length-1){this.merge(a,b);return true;}
  let d=Math.sqrt(d2),nx,ny;if(d<1e-6){const ang=((a.id*7+b.id*13)%37)*.17;nx=Math.cos(ang);ny=Math.sin(ang);d=0;}else{nx=dx/d;ny=dy/d;}
  const ia=1/(a.r*a.r),ib=1/(b.r*b.r),sum=ia+ib,depth=Math.max(0,r-d-.015),corr=depth*.85/sum;a.x-=nx*corr*ia;a.y-=ny*corr*ia;b.x+=nx*corr*ib;b.y+=ny*corr*ib;
  const rvx=b.vx-a.vx,rvy=b.vy-a.vy,vn=rvx*nx+rvy*ny;if(vn<0){const j=-(1+.52)*vn/sum;a.vx-=j*ia*nx;a.vy-=j*ia*ny;b.vx+=j*ib*nx;b.vy+=j*ib*ny;const tangent=rvx*(-ny)+rvy*nx;a.spin-=tangent*.002;b.spin+=tangent*.002;if(-vn>90)this.events.push({type:'bump',x:(a.x+b.x)/2,y:(a.y+b.y)/2});}return false;
 }
 step(dt){if(this.phase!=='moving')return;this.time+=dt;this.shotTime+=dt;
  for(const p of this.pieces){const v=Math.hypot(p.vx,p.vy),nv=Math.max(0,v*Math.exp(-1.1*dt)-42*dt),factor=v>0?nv/v:0;p.vx*=factor;p.vy*=factor;if(nv<2.5){p.vx=0;p.vy=0;}p.x+=p.vx*dt;p.y+=p.vy*dt;p.angle+=p.spin*dt+(p.vx-p.vy)*dt*.002;p.spin*=Math.exp(-3*dt);this.wall(p);}
  for(let iter=0;iter<4;iter++){let restart=false;outer:for(let i=0;i<this.pieces.length;i++)for(let j=i+1;j<this.pieces.length;j++){if(this.collide(this.pieces[i],this.pieces[j])){restart=true;break outer;}}for(const p of this.pieces)this.wall(p);if(restart)this.settle=0;}
  const resting=this.pieces.every(p=>Math.hypot(p.vx,p.vy)<3&&this.time-p.born>.15);this.settle=resting?this.settle+dt:0;
  if(this.settle>.34||this.shotTime>9){for(const p of this.pieces){p.vx=0;p.vy=0;p.spin=0;}if(this.pendingWin){this.phase='won';this.events.push({type:'win'});}else if(this.pieces.some(p=>p.y+p.r>LINE+.5)){this.phase='lost';this.events.push({type:'loss'});}else{this.phase='ready';this.events.push({type:'settled'});}this.acc=0;}
 }
}
function aim(dx,dy,duration){const distance=Math.hypot(dx,dy),flick=clamp(distance/Math.max(.08,duration),0,1500);return clamp(180+distance*2.6+flick*.06,180,1100);}
function predict(x,dx,dy,power,pieces=[]){const angle=clamp(Math.atan2(dx,-dy),-1.15,1.15),p={x:clamp(x,LEFT+18,RIGHT-18),y:LAUNCH,vx:Math.sin(angle)*power,vy:-Math.cos(angle)*power},points=[[p.x,p.y]];for(let i=0;i<170;i++){const v=Math.hypot(p.vx,p.vy),nv=Math.max(0,v*Math.exp(-1.1/90)-42/90),f=v?nv/v:0;p.vx*=f;p.vy*=f;p.x+=p.vx/90;p.y+=p.vy/90;if(p.x<LEFT+14){p.x=LEFT+14;p.vx*=-.65;}if(p.x>RIGHT-14){p.x=RIGHT-14;p.vx*=-.65;}if(p.y<TOP+14){p.y=TOP+14;p.vy*=-.65;}if(i%4===0)points.push([p.x,p.y]);if(pieces.some(b=>Math.hypot(b.x-p.x,b.y-p.y)<b.r+14)||nv<10)break;}return points;}
root.CookiePhysics={Game,TIERS,W,H,LINE,LAUNCH,LEFT,RIGHT,TOP,BOTTOM,DT,aim,predict};if(typeof module!=='undefined')module.exports=root.CookiePhysics;
})(typeof window!=='undefined'?window:globalThis);

