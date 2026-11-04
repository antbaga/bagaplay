// BagaPET : crée ton petit monstre (tête ronde + cœur, puis yeux, bras, jambes, cornes…) et occupe-toi de lui, à la redneck.
import * as P from './bagapet-engine.js';
import {savedRun,saveRun,clearRun} from './runs.js';
const KEY='bagapet';
const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e};
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
const shade=(hex,k)=>{const n=parseInt(hex.slice(1),16),f=c=>clamp(Math.round(c*k),0,255);return `rgb(${f(n>>16)},${f(n>>8&255)},${f(n&255)})`};

export function bagapet(c){
 let pet=(!c.fresh&&savedRun(KEY))||null;if(pet&&pet.v!==1)pet=null;const isNew=!pet;if(!pet)pet=P.newPet();
 P.catchUp(pet);
 // ---- éléments
 const wrap=el('div','pt-wrap');c.board.append(wrap);const cv=el('canvas','pt-cv');wrap.append(cv);const g=cv.getContext('2d');
 const hud=el('div','pt-hud');wrap.append(hud);const tray=el('div','pt-tray');wrap.append(tray);const edit=el('div','pt-edit');edit.hidden=true;wrap.append(edit);
 let W=360,H=600,dpr=1,time=0,mode=pet.created?'care':'edit',tab='food',sel=null,saveT=0,idleT=4,lastHud='';
 // ---- état d'animation (non sauvegardé)
 const A={x:0,tx:0,face:1,jy:0,vy:0,anim:null,at:0,dur:0,data:null,bubble:null,bt:0,blink:0,parts:[],fly:[],soot:0,grab:null,dance:null,danceT:0,wet:0,lookX:0,lookY:0,hits:[],cx:0,cy:0,R:60};
 const fx=[];// particules
 // ---- sons (WebAudio, synthétisés)
 const vol=()=>c.volume?.('sfx')??.5,ac=()=>c.audio?.();
 function env(a,node,t,peak,att,dec){node.gain.setValueAtTime(0,t);node.gain.linearRampToValueAtTime(peak,t+att);node.gain.exponentialRampToValueAtTime(.0001,t+att+dec)}
 function osc(type,f0,f1,dur,peak=.3,delay=0,dest){const a=ac();if(!a||!vol())return;const t=a.currentTime+delay,o=a.createOscillator(),v=a.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+dur);env(a,v,t,peak*vol(),.01,dur);o.connect(v).connect(dest||a.destination);o.start(t);o.stop(t+dur+.05)}
 let noiseBuf=null;function noise(dur,f,q=1,peak=.3,delay=0,type='bandpass',dest){const a=ac();if(!a||!vol())return;if(!noiseBuf){noiseBuf=a.createBuffer(1,a.sampleRate,a.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
  const t=a.currentTime+delay,s=a.createBufferSource(),fl=a.createBiquadFilter(),v=a.createGain();s.buffer=noiseBuf;s.loop=true;fl.type=type;fl.frequency.value=f;fl.Q.value=q;env(a,v,t,peak*vol(),.005,dur);s.connect(fl).connect(v).connect(dest||a.destination);s.start(t);s.stop(t+dur+.05)}
 const SND={chomp:()=>{for(let k=0;k<3;k++)noise(.07,700+Math.random()*400,2,.35,k*.18)},gulp:()=>{for(let k=0;k<3;k++)osc('sine',300,140,.12,.3,k*.22)},
  burp:()=>{osc('sawtooth',120,70,.55,.22);noise(.5,300,3,.15)},hic:()=>osc('sine',500,1100,.09,.3),boing:()=>osc('sine',600,140,.35,.3),
  laugh:()=>{for(let k=0;k<6;k++)osc('square',520-k*30,380-k*25,.09,.08,k*.12)},spit:()=>{noise(.18,2500,1,.3);osc('sawtooth',300,120,.2,.08)},
  thud:()=>{osc('sine',120,40,.35,.5);noise(.15,200,1,.3)},fart:()=>{const a=ac();if(!a||!vol())return;osc('sawtooth',90,60,.6,.18);osc('square',70,95,.5,.06,.05)},
  squeak:()=>{osc('square',1400,900,.12,.08);osc('square',1500,1000,.12,.08,.18)},water:()=>noise(1.6,3000,.5,.18,0,'highpass'),
  boom:()=>{noise(.9,180,.7,.6,0,'lowpass');for(let k=0;k<10;k++)noise(.04,3000+Math.random()*3000,2,.15,.25+Math.random()*.6)},fuse:()=>noise(1,5000,4,.06),
  engine:()=>{for(let k=0;k<8;k++)osc('sawtooth',55+k%2*8,60,.3,.08,k*.28)},splash:()=>noise(.4,1200,.6,.25),whoosh:()=>noise(.35,900,.8,.15),
  snore:()=>{osc('sawtooth',70,55,1,.08);noise(1,400,4,.05)},pop:()=>osc('sine',900,1500,.06,.2),yawn:()=>osc('sine',300,180,.9,.12)};
 function sound(k){try{SND[k]?.()}catch{}}
 // voix : petit babillage (plus grave et traînant quand il a bu)
 function babble(n,drunk){const a=ac();if(!a||!vol())return;for(let k=0;k<n;k++){const f=(drunk?160:240)+Math.random()*140;osc('triangle',f,f*(drunk?.7:1.15),drunk?.16:.09,.12,k*(drunk?.17:.11))}}
 // ---- musique : rock, country, Marseillaise (synthés, ~16 s)
 let tune=null;
 function stopTune(){if(!tune)return;try{tune.g.gain.cancelScheduledValues(0);tune.g.gain.setTargetAtTime(0,ac().currentTime,.05);setTimeout(()=>tune?.g?.disconnect(),300)}catch{}tune=null;A.dance=null}
 function playTune(id){stopTune();const a=ac();const mv=Math.max(c.volume?.('music')??.5,vol());if(!a||!mv){A.dance=id;A.danceT=14;return}
  const out=a.createGain();out.gain.value=.55*mv;out.connect(a.destination);tune={g:out,id};const t0=a.currentTime+.08;
  const n2f=n=>440*Math.pow(2,(n-69)/12);
  const note=(type,midi,t,d,peak,dest=out)=>{const o=a.createOscillator(),v=a.createGain();o.type=type;o.frequency.value=n2f(midi);v.gain.setValueAtTime(0,t);v.gain.linearRampToValueAtTime(peak,t+.01);v.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(v).connect(dest);o.start(t);o.stop(t+d+.05)};
  const kick=t=>{const o=a.createOscillator(),v=a.createGain();o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(40,t+.15);v.gain.setValueAtTime(.7,t);v.gain.exponentialRampToValueAtTime(.001,t+.2);o.connect(v).connect(out);o.start(t);o.stop(t+.25)};
  const hit=(t,f,d,p,type='bandpass')=>noise(d,f,1,p/vol(),t-a.currentTime,type,out);
  if(id==='rock'){const bpm=140,b=60/bpm,dist=a.createWaveShaper(),cu=new Float32Array(256);for(let i=0;i<256;i++){const x=i/128-1;cu[i]=Math.tanh(x*6)}dist.curve=cu;const dg=a.createGain();dg.gain.value=.22;dist.connect(dg).connect(out);
   const riff=[[40,0,1],[40,1,.5],[43,1.5,.5],[45,2,1],[40,3,.5],[47,3.5,.5],[45,4,1.5],[43,5.5,.5],[40,6,1],[38,7,1]];
   for(let bar=0;bar<4;bar++)for(const [n,s,d] of riff){const t=t0+(bar*8+s)*b;for(const k of [0,7,12])note('sawtooth',n+k,t,d*b*.95,.25,dist)}
   for(let i=0;i<64;i++){const t=t0+i*b/2;if(i%4===0)kick(t);if(i%4===2)hit(t,1800,.12,.35);hit(t,8000,.04,.12,'highpass')}}
  if(id==='country'){const bpm=118,b=60/bpm,ch=[[55,59,62],[60,64,67],[55,59,62],[62,66,69]];
   for(let bar=0;bar<8;bar++){const C=ch[bar%4];for(let s=0;s<8;s++){const t=t0+(bar*4+s/2)*b;note('triangle',C[[0,1,2,1,0,2,1,2][s]]+12,t,.35,.22)}
    for(let s=0;s<4;s++){const t=t0+(bar*4+s)*b;note('sine',C[0]-(s%2?5:12)-12+12,t,.3,s%2?.0001:.4);if(s%2)hit(t,2500,.08,.18);else kick(t)}}
   const mel=[67,69,71,74,71,69,67,64,62,64,67,69,67,64,62,59];mel.forEach((n,i)=>note('square',n+12,t0+(16+i)*b,b*.9,.05))}
  if(id==='marseillaise'){const b=.42,M=[[62,.75],[62,.25],[62,1],[67,1],[67,1],[69,1],[69,1],[74,1.5],[71,.5],[67,.75],[67,.25],[71,.75],[67,.25],[64,1],[72,2],[69,.75],[66,.25],[67,2],[0,1],
   [67,.75],[69,.25],[71,1],[71,1],[71,1],[72,.75],[71,.25],[71,1],[69,2],[0,1],[69,.75],[71,.25],[72,1],[72,1],[72,1],[74,.75],[72,.25],[71,2],[0,1],
   [74,2],[71,.75],[67,.25],[69,2],[66,.75],[62,.25],[67,3]];
   let t=t0;for(const [n,d] of M){if(n){note('sawtooth',n,t,d*b*.95,.12);note('square',n-12,t,d*b*.95,.04)}t+=d*b}
   for(let i=0;i<Math.round((t-t0)/(b/2));i++){const tt=t0+i*b/2;if(i%4===0)kick(tt);hit(tt,2200,.05,i%2?.06:.12)}}
  A.dance=id;A.danceT=id==='marseillaise'?20:15}
 // ---- sauvegarde
 function save(){try{pet.at=Date.now();saveRun(KEY,pet)}catch{}}
 const onHide=()=>{if(document.hidden)save()};document.addEventListener('visibilitychange',onHide);window.addEventListener('pagehide',save);

 // ---------------------------------------------------------------- dessin du décor (jardin de mobile home)
 function scene(){const h=new Date().getHours()+new Date().getMinutes()/60,night=h<6.5||h>=20.5,dusk=!night&&(h<8||h>18.5),gy=horizon();
  const sky=g.createLinearGradient(0,0,0,gy);if(night){sky.addColorStop(0,'#141b3a');sky.addColorStop(1,'#3a3f6b')}else if(dusk){sky.addColorStop(0,'#f6a96b');sky.addColorStop(1,'#ffd9a0')}else{sky.addColorStop(0,'#7cc2ef');sky.addColorStop(1,'#cfeefc')}
  g.fillStyle=sky;g.fillRect(0,0,W,gy);
  if(night){g.fillStyle='#fff';for(let i=0;i<40;i++){const x=(i*97)%W,y=(i*53)%(gy*.6);g.globalAlpha=.4+.6*Math.abs(Math.sin(time*.8+i));g.fillRect(x,y,1.5,1.5)}g.globalAlpha=1;
   g.fillStyle='#f6f1d0';g.beginPath();g.arc(W*.8,gy*.18,16,0,TAU);g.fill()}
  else{g.fillStyle=dusk?'#ffb35c':'#ffe066';g.beginPath();g.arc(W*.82,gy*.17,20,0,TAU);g.fill()}
  // collines
  g.fillStyle=night?'#2b4a3a':'#9fcf7c';g.beginPath();g.moveTo(0,gy*.78);for(let x=0;x<=W;x+=20)g.lineTo(x,gy*.74+Math.sin(x*.02)*10);g.lineTo(W,gy);g.lineTo(0,gy);g.fill();
  // mobile home
  const mx=W*.03,my=gy-70;g.fillStyle=night?'#8c96a8':'#e9eef2';rr(mx,my,W*.42,62,8);g.fill();g.fillStyle=night?'#5d6a7d':'#9aa9b8';g.fillRect(mx,my+40,W*.42,6);
  g.fillStyle=night?'#ffd76a':'#bfe3f4';for(const k of [.06,.2])g.fillRect(mx+W*k,my+12,W*.09,18);g.fillStyle='#8a5a3b';g.fillRect(mx+W*.33,my+16,W*.06,46);
  g.fillStyle='#6b6b6b';for(const k of [.05,.3])g.fillRect(mx+W*k,gy-8,12,8);
  // pick-up sur parpaings
  const px=W*.66,py=gy-46;g.fillStyle=night?'#6b2d2d':'#c0473c';rr(px,py+12,W*.3,22,5);g.fill();rr(px+W*.03,py,W*.12,16,4);g.fill();g.fillStyle=night?'#ffd76a':'#bfe3f4';g.fillRect(px+W*.045,py+3,W*.09,9);
  g.fillStyle='#9a9a9a';g.fillRect(px+W*.04,gy-12,14,12);g.fillRect(px+W*.22,gy-12,14,12);g.fillStyle='#333';g.beginPath();g.arc(px+W*.24,gy-6,7,0,TAU);g.fill();
  // sol, barbecue, flamant rose, guirlande
  const gr=g.createLinearGradient(0,gy,0,H);gr.addColorStop(0,night?'#3c6b3c':'#7cbf54');gr.addColorStop(1,night?'#24452a':'#5aa13d');g.fillStyle=gr;g.fillRect(0,gy,W,H-gy);
  g.fillStyle=night?'#2a2a2a':'#3b3b3b';g.beginPath();g.arc(W*.56,gy-26,13,0,Math.PI);g.fill();g.fillRect(W*.56-1.5,gy-26,3,26);if(!night){g.fillStyle='rgba(200,200,200,.5)';for(let k=0;k<3;k++){g.beginPath();g.arc(W*.56+Math.sin(time+k)*4,gy-38-((time*12+k*12)%36),4+k,0,TAU);g.fill()}}
  g.strokeStyle='#f28ab2';g.lineWidth=2.5;g.beginPath();g.moveTo(W*.5,gy);g.lineTo(W*.5,gy-20);g.stroke();g.fillStyle='#f28ab2';g.beginPath();g.ellipse(W*.5+4,gy-24,9,6,0,0,TAU);g.fill();g.beginPath();g.moveTo(W*.5+11,gy-26);g.quadraticCurveTo(W*.5+18,gy-44,W*.5+12,gy-46);g.stroke();
  g.strokeStyle='#444';g.lineWidth=1;g.beginPath();g.moveTo(mx+W*.4,my+4);g.quadraticCurveTo(W*.55,my+28,px+W*.03,py);g.stroke();
  for(let k=1;k<8;k++){const t=k/8,x=lerp(mx+W*.4,px+W*.03,t),y=lerp(my+4,py,t)+Math.sin(t*Math.PI)*20;g.fillStyle=night?['#ff6b6b','#ffd166','#6bd1ff'][k%3]:'#ddd';g.beginPath();g.arc(x,y+3,2.5,0,TAU);g.fill()}
  if(A.dance==='marseillaise')flag(W*.16,gy-8)}
 function flag(x,y){g.fillStyle='#777';g.fillRect(x,y-70,2,70);const w=36,h=24;for(let i=0;i<3;i++){g.fillStyle=['#2a4b9b','#ffffff','#d83a3a'][i];g.beginPath();for(let s=0;s<=6;s++){const xx=x+2+i*w/3+s*w/18,yy=y-70+Math.sin(time*5+(i*w/3+s*w/18)*.25)*2;s?g.lineTo(xx,yy):g.moveTo(xx,yy)}for(let s=6;s>=0;s--){const xx=x+2+i*w/3+s*w/18,yy=y-70+h+Math.sin(time*5+(i*w/3+s*w/18)*.25)*2;g.lineTo(xx,yy)}g.fill()}}
 function rr(x,y,w,h,r){g.beginPath();g.roundRect?g.roundRect(x,y,w,h,r):g.rect(x,y,w,h)}
 const editTop=()=>(edit.firstChild?.offsetHeight||50)+8,editBot=()=>[...edit.children].slice(1).reduce((a,e)=>a+e.offsetHeight,0)+10;
 const editSpace=()=>Math.max(120,H-editTop()-editBot());
 const groundY=()=>mode==='edit'?H-editBot()-12:H-tray.offsetHeight-22;
 const horizon=()=>{const top=hud.offsetTop+hud.offsetHeight,gy=groundY();return top+(gy-top)*.5};

 // ---------------------------------------------------------------- dessin du BagaPET
 const ptPos=(q,cx,cy,rx,ry)=>[cx+Math.sin(q.ang)*rx*q.dist,cy-Math.cos(q.ang)*ry*q.dist];
 const LEG={courte:.32,longue:.85,poulet:.6,roue:.36};
 function legLen(q,R){return R*LEG[q.kind]*q.size}
 function petGeo(R){const w=(pet.poids-12)/40,rx=R*(1+clamp(w,-.15,.45))*pet.body.squash,ry=R;let foot=ry;
  for(const q of pet.parts)if(q.type==='leg'){const ay=-Math.cos(q.ang)*ry*q.dist;foot=Math.max(foot,ay+legLen(q,R))}return {rx,ry,foot}}
 // humeur → expression
 function face(){const m=P.mood(pet),an=A.anim;return {m,closed:m==='sleep'||m==='ko'||an==='faint'||A.blink>0,half:m==='tired'||m==='tipsy'||m==='hangover',x:m==='ko'||an==='faint',
  open:an==='eat'||an==='spit'||an==='drink'||an==='laugh'||an==='yell'||an==='yawn'||an==='burp'||an==='sing'||(A.dance&&A.dance!=='marseillaise')?1:0,
  smile:m==='happy'||an==='love'||an==='laugh'||an==='pose'?1:m==='sad'||m==='hungry'||m==='hangover'||an==='refuse'||an==='spit'?-1:.3}}
 function drawPet(cx,cy,R,opt={}){const {rx,ry}=petGeo(R),body=pet.body.color,F=face(),t=time,dr=pet.ivresse/100,sel2=opt.sel;A.hits=[];
  // balancement, respiration, danses
  let rot=Math.sin(t*1.6)*.02+Math.sin(t*2.3)*dr*.25,sx=1+Math.sin(t*3)*.015,sy=1-Math.sin(t*3)*.015;
  const an=A.anim,k=A.dur?clamp((time-A.at)/A.dur,0,1):0;
  if(A.dance==='rock'){rot+=Math.sin(t*14)*.18;sy+=Math.abs(Math.sin(t*14))*.06}
  if(A.dance==='country'){rot+=Math.sin(t*6)*.14;cx+=Math.sin(t*6)*R*.25}
  if(A.dance==='marseillaise'){rot=0;sy+=.04}
  if(an==='laugh'||an==='shower'){rot+=Math.sin(t*40)*.06}
  if(an==='poke'||an==='boing'){const s=Math.sin(k*Math.PI*3)*(1-k)*.18;sx+=s;sy-=s}
  if(an==='pose')rot=Math.sin(k*TAU)*.3;const lying=an==='faint'||P.mood(pet)==='ko';if(lying)rot=-1.4;if(P.mood(pet)==='sleep'&&!lying){rot=0;sy*=.93;sx*=1.04}
  g.save();if(lying){g.translate(cx,cy);g.rotate(rot)}else{g.translate(cx,cy+ry);g.rotate(rot);g.scale(sx,sy);g.translate(0,-ry)}
  // ombre
  const back=pet.parts.filter(q=>!P.PARTS[q.type].front),frontP=pet.parts.filter(q=>P.PARTS[q.type].front);
  for(const q of back)if(q.type!=='leg')part(q,rx,ry,R,F,sel2);
  for(const q of back)if(q.type==='leg')part(q,rx,ry,R,F,sel2);
  // corps
  const gr=g.createRadialGradient(-rx*.35,-ry*.4,R*.1,0,0,Math.max(rx,ry)*1.1);gr.addColorStop(0,shade(body,1.25));gr.addColorStop(.6,body);gr.addColorStop(1,shade(body,.72));
  g.fillStyle=gr;g.beginPath();g.ellipse(0,0,rx,ry,0,0,TAU);g.fill();
  g.save();g.clip();const pat=pet.body.pattern;g.fillStyle=shade(body,.8);
  if(pat==='taches')for(let i=0;i<7;i++){g.beginPath();g.ellipse(Math.sin(i*2.4)*rx*.7,Math.cos(i*1.7)*ry*.7,R*.13,R*.1,i,0,TAU);g.fill()}
  if(pat==='rayures')for(let i=-3;i<=3;i++){g.fillRect(i*R*.32-R*.06,-ry,R*.12,ry*2)}
  if(pat==='ventre'||true){g.fillStyle=pet.body.belly;g.globalAlpha=pat==='ventre'?.95:.35;g.beginPath();g.ellipse(0,ry*.45,rx*.62,ry*.5,0,0,TAU);g.fill();g.globalAlpha=1}
  if(A.soot>0){g.fillStyle=`rgba(30,30,30,${Math.min(.75,A.soot/4)})`;g.fillRect(-rx,-ry,rx*2,ry*2)}
  if(pet.st.proprete<30){g.fillStyle='rgba(110,80,40,.35)';for(let i=0;i<6;i++){g.beginPath();g.arc(Math.sin(i*3.1)*rx*.6,Math.cos(i*2.3)*ry*.6,R*.08,0,TAU);g.fill()}}
  g.restore();
  g.lineWidth=Math.max(2,R*.045);g.strokeStyle=shade(body,.45);g.beginPath();g.ellipse(0,0,rx,ry,0,0,TAU);g.stroke();
  // joues roses quand il a bu ou qu'il est content
  if(dr>.25||F.smile>.5){g.fillStyle=`rgba(255,90,110,${Math.min(.55,dr*.7+(F.smile>.5?.2:0))})`;for(const s of [-1,1]){g.beginPath();g.ellipse(s*rx*.5,ry*.12,R*.13,R*.08,0,0,TAU);g.fill()}}
  // le cœur, qui bat (plus vite quand il s'agite)
  const bpm=A.dance||an?3.2:1.4,beat=1+Math.max(0,Math.sin(t*TAU*bpm))*.12*(A.dance==='marseillaise'?2:1);heart(rx*.3,ry*.64,R*.13*beat,A.dance==='marseillaise');
  for(const q of frontP)part(q,rx,ry,R,F,sel2);
  // extras
  if(pet.extras.includes('bandana')){g.fillStyle='#c0392b';g.beginPath();g.moveTo(-rx*.75,ry*.62);g.quadraticCurveTo(0,ry*1.02,rx*.75,ry*.62);g.lineTo(rx*.6,ry*.8);g.quadraticCurveTo(0,ry*1.15,-rx*.6,ry*.8);g.fill();g.fillStyle='#fff';for(let i=-2;i<=2;i++){g.beginPath();g.arc(i*rx*.2,ry*.85,2,0,TAU);g.fill()}}
  const mouthQ=frontP.find(q=>q.type==='mouth'),noseQ=frontP.find(q=>q.type==='nose');
  if(pet.extras.includes('mustache')){const [mx,my]=noseQ?ptPos(noseQ,0,0,rx,ry):mouthQ?ptPos(mouthQ,0,0,rx,ry):[0,ry*.2];const yy=noseQ?my+R*.12*noseQ.size:my-R*.12;g.fillStyle='#3b2416';for(const s of [-1,1]){g.beginPath();g.ellipse(mx+s*R*.12,yy,R*.14,R*.055,s*.25,0,TAU);g.fill()}}
  if(pet.extras.includes('shades')){const eyes=frontP.filter(q=>q.type==='eye');if(eyes.length){const pts=eyes.map(q=>ptPos(q,0,0,rx,ry)),y0=pts.reduce((a,p)=>a+p[1],0)/pts.length,x0=Math.min(...pts.map(p=>p[0]))-R*.2,x1=Math.max(...pts.map(p=>p[0]))+R*.2;
   g.fillStyle='#111';rr(x0,y0-R*.12,x1-x0,R*.24,R*.08);g.fill();g.fillStyle='rgba(255,255,255,.35)';g.fillRect(x0+R*.06,y0-R*.08,R*.12,R*.04)}}
  hat(rx,ry,R,dr);
  if(an==='faint'||P.mood(pet)==='ko'){for(let i=0;i<3;i++){const a=t*3+i*TAU/3;g.fillStyle='#ffd23f';star(Math.cos(a)*R*.6,-ry-R*.25+Math.sin(a)*R*.12,R*.08)}}
  g.restore();
  return {rx,ry}}
 function star(x,y,r){g.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,rr2=i%2?r*.45:r;g.lineTo(x+Math.cos(a)*rr2,y+Math.sin(a)*rr2)}g.fill()}
 function heart(x,y,s,glow){g.save();g.translate(x,y);if(glow){g.shadowColor='#ff5470';g.shadowBlur=s*2}g.fillStyle='#e8344e';g.beginPath();g.moveTo(0,s*.35);g.bezierCurveTo(-s*1.2,-s*.4,-s*.5,-s*1.15,0,-s*.45);g.bezierCurveTo(s*.5,-s*1.15,s*1.2,-s*.4,0,s*.35);g.fill();
  g.fillStyle='rgba(255,255,255,.5)';g.beginPath();g.ellipse(-s*.35,-s*.45,s*.15,s*.1,-.5,0,TAU);g.fill();g.restore()}
 // une pièce : position sur le corps, puis dessin dans son repère (−y = vers l'extérieur)
 function part(q,rx,ry,R,F,sel2){const d=P.PARTS[q.type],[x,y]=ptPos(q,0,0,rx,ry),s=R*q.size,col=q.color||shade(pet.body.color,.85),dark=shade(pet.body.color,.45),t=time;
  const lw=Math.max(1.5,R*.04);g.lineWidth=lw;g.strokeStyle=dark;g.lineJoin=g.lineCap='round';
  const side=Math.sign(Math.sin(q.ang))||1;g.save();g.translate(x,y);
  const wave=A.anim==='love'||A.anim==='pose'||A.anim==='yell'||A.dance?Math.sin(t*(A.dance==='rock'?14:7)+q.id)*.5:A.grab?Math.sin(t*20+q.id)*.6:0;
  if(q.type==='eye'){const r=s*({rond:.16,'globuleux':.22,endormi:.15,cyclope:.3}[q.kind]);eye(0,0,r,F,q.kind,q.color)}
  else if(q.type==='mouth')mouth(s,F,q.kind,q.color);
  else if(q.type==='nose'){if(q.kind==='groin'){g.fillStyle=q.color||'#f7a1b5';g.beginPath();g.ellipse(0,0,s*.16,s*.11,0,0,TAU);g.fill();g.stroke();g.fillStyle=dark;for(const k of [-1,1]){g.beginPath();g.ellipse(k*s*.055,0,s*.025,s*.045,0,0,TAU);g.fill()}}
   else{g.fillStyle=q.kind==='clown'?'#e3242b':q.color||shade(pet.body.color,1.1);g.beginPath();g.arc(0,0,s*(q.kind==='clown'?.12:.15),0,TAU);g.fill();g.stroke();g.fillStyle='rgba(255,255,255,.5)';g.beginPath();g.arc(-s*.04,-s*.04,s*.035,0,TAU);g.fill()}}
  else if(q.type==='leg'){const L=legLen(q,R),walk=Math.abs(A.tx-A.x)>2||A.grab?Math.sin(t*12+(side>0?0:Math.PI)):0,off=walk*s*.12;
   if(q.kind==='roue'){const wr=L*.85;g.fillStyle='#333';g.beginPath();g.arc(0,L-wr,wr,0,TAU);g.fill();g.fillStyle='#bbb';g.beginPath();g.arc(0,L-wr,wr*.45,0,TAU);g.fill();g.strokeStyle='#777';g.save();g.translate(0,L-wr);g.rotate(A.x*.05);for(let i=0;i<4;i++){g.rotate(TAU/4);g.beginPath();g.moveTo(0,0);g.lineTo(wr*.45,0);g.stroke()}g.restore()}
   else if(q.kind==='poulet'){g.strokeStyle='#e0a030';g.lineWidth=s*.05;g.beginPath();g.moveTo(0,0);g.lineTo(off,L*.55);g.lineTo(-off*.5,L);g.stroke();for(const a of [-.6,0,.6]){g.beginPath();g.moveTo(-off*.5,L);g.lineTo(-off*.5+Math.sin(a)*s*.14,L+Math.cos(a)*s*.03);g.stroke()}}
   else{const w=s*(q.kind==='courte'?.13:.09);g.fillStyle=col;g.beginPath();g.moveTo(-w,0);g.lineTo(-w+off,L-w);g.lineTo(w+off,L-w);g.lineTo(w,0);g.fill();g.stroke();
    g.fillStyle=dark;g.beginPath();g.ellipse(off+side*w*.4,L-w*.6,w*1.6,w*.75,0,0,TAU);g.fill()}}
  else{g.rotate(q.ang);// pièces orientées vers l'extérieur
   if(q.type==='arm'){g.rotate(side*(.9+wave)-(A.anim==='eat'||A.anim==='drink'?side*1.2:0));const L=s*.62;
    if(q.kind==='tentacule'){g.strokeStyle=col;g.lineWidth=s*.12;g.beginPath();g.moveTo(0,0);for(let i=1;i<=10;i++){const u=i/10;g.lineTo(Math.sin(u*5+t*4+q.id)*s*.08,-u*L)}g.stroke();g.lineWidth=s*.05;g.strokeStyle=shade(pet.body.color,.65);g.stroke()}
    else{const w=s*(q.kind==='costaud'?.13:.06);g.strokeStyle=dark;g.lineWidth=w*2+lw*2;g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(side*s*.15,-L*.5,0,-L);g.stroke();g.strokeStyle=col;g.lineWidth=w*2;g.stroke();
     if(q.kind==='pince'){g.fillStyle='#e05a3a';g.beginPath();g.ellipse(0,-L-s*.1,s*.12,s*.16,0,0,TAU);g.fill();g.stroke();g.strokeStyle='#e05a3a';g.lineWidth=s*.07;const o=Math.abs(Math.sin(t*3))*.4;for(const k of [-1,1]){g.beginPath();g.moveTo(k*s*.04,-L-s*.2);g.lineTo(k*s*(.08+o*.1),-L-s*.38);g.stroke()}}
     else{g.fillStyle=col;g.beginPath();g.arc(0,-L,s*(q.kind==='costaud'?.13:.09),0,TAU);g.fill();g.stroke();for(const a of [-.5,0,.5]){g.beginPath();g.arc(Math.sin(a)*s*.1,-L-Math.cos(a)*s*.1,s*.035,0,TAU);g.fill();g.stroke()}}}}
   else if(q.type==='tail'){g.rotate(Math.sin(t*(A.anim==='love'?12:3))*.25);
    if(q.kind==='tire-bouchon'){g.strokeStyle=q.color||'#f7a1b5';g.lineWidth=s*.07;g.beginPath();for(let i=0;i<=30;i++){const u=i/30,a=u*TAU*2;g.lineTo(Math.cos(a)*s*.1*(1-u*.4),-u*s*.45+Math.sin(a)*s*.05)}g.stroke()}
    else if(q.kind==='poisson'){g.fillStyle=col;g.beginPath();g.moveTo(-s*.06,0);g.lineTo(s*.06,0);g.lineTo(s*.25,-s*.45);g.lineTo(0,-s*.33);g.lineTo(-s*.25,-s*.45);g.closePath();g.fill();g.stroke()}
    else{g.strokeStyle=dark;g.lineWidth=s*.09+lw;g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(s*.3,-s*.3,s*.1,-s*.65);g.stroke();g.strokeStyle=col;g.lineWidth=s*.09;g.stroke();
     g.fillStyle=q.kind==='touffue'?shade(col.startsWith('#')?col:pet.body.color,1.2):dark;g.beginPath();g.ellipse(s*.1,-s*.7,s*(q.kind==='touffue'?.2:.08),s*(q.kind==='touffue'?.14:.1),.4,0,TAU);g.fill()}}
   else if(q.type==='horn'){g.fillStyle=q.color||(q.kind==='diable'?'#c62828':q.kind==='bois de cerf'?'#8a5a3b':'#f2e6c9');
    if(q.kind==='bois de cerf'){g.strokeStyle=g.fillStyle;g.lineWidth=s*.06;g.beginPath();g.moveTo(0,0);g.lineTo(0,-s*.5);g.moveTo(0,-s*.2);g.lineTo(side*s*.18,-s*.38);g.moveTo(0,-s*.35);g.lineTo(-side*s*.15,-s*.5);g.moveTo(0,-s*.5);g.lineTo(side*s*.1,-s*.62);g.stroke()}
    else if(q.kind==='licorne'){g.beginPath();g.moveTo(-s*.08,0);g.lineTo(0,-s*.55);g.lineTo(s*.08,0);g.fill();g.stroke();g.strokeStyle='#e9b8d8';for(let i=1;i<5;i++){g.beginPath();g.moveTo(-s*.08*(1-i/5),-i*s*.11);g.lineTo(s*.08*(1-i/5),-i*s*.11+s*.04);g.stroke()}}
    else{const L=q.kind==='diable'?s*.28:s*.45;g.beginPath();g.moveTo(-s*.09,0);g.quadraticCurveTo(side*s*.25,-L*.6,side*s*.12,-L);g.quadraticCurveTo(side*s*.05,-L*.5,s*.09,0);g.fill();g.stroke()}}
   else if(q.type==='ear'){g.fillStyle=col;if(q.kind==='tombantes'){g.rotate(side*(1.6+Math.sin(t*2)*.1));g.beginPath();g.ellipse(0,-s*.25,s*.1,s*.28,0,0,TAU);g.fill();g.stroke()}
    else if(q.kind==='rondes'){g.beginPath();g.arc(0,-s*.12,s*.16,0,TAU);g.fill();g.stroke();g.fillStyle='#f7b8c8';g.beginPath();g.arc(0,-s*.12,s*.09,0,TAU);g.fill()}
    else{g.beginPath();g.moveTo(-s*.12,s*.02);g.lineTo(0,-s*.38);g.lineTo(s*.12,s*.02);g.fill();g.stroke();g.fillStyle='#f7b8c8';g.beginPath();g.moveTo(-s*.06,0);g.lineTo(0,-s*.25);g.lineTo(s*.06,0);g.fill()}}
   else if(q.type==='antenna'){const L=s*.5,sw=Math.sin(t*3+q.id)*s*.06;g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(sw,-L*.5,sw*2,-L);g.stroke();
    if(q.kind==='spirale'){g.beginPath();for(let i=0;i<=20;i++){const a=i/20*TAU*1.5;g.lineTo(sw*2+Math.cos(a)*s*.07*(1-i/25),-L-s*.07+Math.sin(a)*s*.07*(1-i/25))}g.stroke()}
    else{g.fillStyle=q.color||'#ffd23f';g.beginPath();g.arc(sw*2,-L,s*.07,0,TAU);g.fill();g.stroke()}}
   else if(q.type==='stalk'){const L=s*.55,sw=Math.sin(t*2+q.id)*s*.08;const tips=q.kind==='double'?[-1,1]:[0];
    for(const k of tips){const ex=sw+k*s*.14,ey=-L+Math.abs(k)*s*.05;g.strokeStyle=dark;g.lineWidth=s*.05+lw;g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(k*s*.05,-L*.5,ex,ey);g.stroke();g.strokeStyle=col;g.lineWidth=s*.05;g.stroke();
     g.save();g.translate(ex,ey);g.rotate(-q.ang);eye(0,0,s*.13,F,'rond',null);g.restore()}}
   else if(q.type==='wing'){const fl=Math.sin(t*(A.anim||A.dance?16:3))*.35;g.rotate(side*(.6+fl));g.fillStyle=q.kind==='plumes'?(q.color||'#fff'):(q.color||'#4a3b5c');g.beginPath();
    if(q.kind==='plumes'){for(let i=0;i<4;i++){g.ellipse(side*s*.05,-s*(.12+i*.08),s*.07,s*(.22-i*.03),side*(.3+i*.25),0,TAU)}g.fill();g.stroke()}
    else{g.moveTo(0,0);g.lineTo(side*s*.1,-s*.45);g.lineTo(side*s*.2,-s*.3);g.lineTo(side*s*.32,-s*.42);g.lineTo(side*s*.35,-s*.15);g.closePath();g.fill();g.stroke()}}}
  g.restore();
  // zone de sélection (création)
  const hx=Math.sin(q.ang)*rx*q.dist,hy=-Math.cos(q.ang)*ry*q.dist;A.hits.push({q,x:hx,y:hy,r:Math.max(R*.18,s*.22)});
  if(sel2&&P.partsOf(pet,sel2).includes(q)){g.save();g.setLineDash([4,3]);g.strokeStyle='#2f8a45';g.lineWidth=2;g.beginPath();g.arc(hx,hy,Math.max(R*.2,s*.25),0,TAU);g.stroke();g.restore()}}
 function eye(x,y,r,F,kind,col){const lx=clamp(A.lookX,-1,1),ly=clamp(A.lookY,-1,1);
  g.fillStyle='#fff';g.beginPath();g.arc(x,y,r,0,TAU);g.fill();g.lineWidth=Math.max(1.2,r*.12);g.strokeStyle='#2b2b2b';g.stroke();
  if(F.x){g.beginPath();g.moveTo(x-r*.5,y-r*.5);g.lineTo(x+r*.5,y+r*.5);g.moveTo(x+r*.5,y-r*.5);g.lineTo(x-r*.5,y+r*.5);g.stroke();return}
  if(F.closed){g.fillStyle=shade(pet.body.color,.9);g.beginPath();g.arc(x,y,r*1.02,0,TAU);g.fill();g.beginPath();g.arc(x,y+r*.1,r*.6,.15*Math.PI,.85*Math.PI);g.stroke();return}
  const pr=r*(kind==='globuleux'?.32:.45),drunk=pet.ivresse>40?Math.sin(time*3)*r*.25:0;g.fillStyle=col||'#3a2a1a';g.beginPath();g.arc(x+lx*r*.4+drunk,y+ly*r*.35,pr,0,TAU);g.fill();
  g.fillStyle='#111';g.beginPath();g.arc(x+lx*r*.45+drunk,y+ly*r*.4,pr*.55,0,TAU);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(x+lx*r*.4-pr*.35+drunk,y+ly*r*.35-pr*.35,pr*.28,0,TAU);g.fill();
  if(F.half||kind==='endormi'){g.fillStyle=shade(pet.body.color,.9);g.beginPath();g.arc(x,y,r*1.03,Math.PI,TAU);g.fill();g.strokeStyle='#2b2b2b';g.beginPath();g.moveTo(x-r,y);g.lineTo(x+r,y);g.stroke()}
  if(pet.ivresse>60){g.strokeStyle='rgba(220,40,40,.5)';g.lineWidth=1;for(const a of [.3,2.6,4]){g.beginPath();g.moveTo(x+Math.cos(a)*r*.95,y+Math.sin(a)*r*.95);g.lineTo(x+Math.cos(a)*r*.55,y+Math.sin(a)*r*.6);g.stroke()}}}
 function mouth(s,F,kind,col){const w=s*.26,o=F.open?(A.anim==='eat'?Math.abs(Math.sin(time*14))*.9+.1:A.dance?Math.abs(Math.sin(time*8)):1):0;g.lineWidth=Math.max(1.5,s*.035);g.strokeStyle='#3a1e14';
  if(kind==='bec'){g.fillStyle=col||'#f2a33a';g.beginPath();g.moveTo(-w*.6,0);g.lineTo(w*.6,0);g.lineTo(0,s*.12+o*s*.06);g.closePath();g.fill();g.stroke();if(o){g.beginPath();g.moveTo(-w*.6,0);g.lineTo(0,-s*.08*o);g.lineTo(w*.6,0);g.fill();g.stroke()}return}
  if(o>.05){g.fillStyle='#5a1e1e';g.beginPath();g.ellipse(0,s*.03,w*.75,s*.13*o+s*.02,0,0,TAU);g.fill();g.stroke();g.fillStyle='#e8657a';g.beginPath();g.ellipse(0,s*.03+s*.07*o,w*.4,s*.05*o,0,0,TAU);g.fill()}
  else{g.beginPath();const sm=F.smile;g.moveTo(-w,0);g.quadraticCurveTo(0,s*.18*sm,w,0);g.stroke();if(pet.ivresse>30){g.fillStyle='rgba(120,200,255,.8)';g.beginPath();g.ellipse(w*.8,s*.08+Math.sin(time*2)*2,s*.025,s*.04,0,0,TAU);g.fill()}}
  if(kind==='dents'){g.fillStyle='#fffbe8';g.fillRect(-s*.06,0,s*.055,s*.09);g.fillRect(s*.005,0,s*.055,s*.09);g.strokeRect(-s*.06,0,s*.055,s*.09);g.strokeRect(s*.005,0,s*.055,s*.09)}
  if(kind==='moustache'){g.fillStyle='#3b2416';for(const k of [-1,1]){g.beginPath();g.ellipse(k*w*.55,-s*.06,w*.6,s*.05,k*.3,0,TAU);g.fill()}}}
 function hat(rx,ry,R,dr){const id=pet.hat;if(!id)return;const tops=pet.parts.filter(q=>(q.type==='horn'||q.type==='ear'||q.type==='antenna'||q.type==='stalk')&&Math.abs(q.ang)<.5);
  g.save();g.translate(0,-ry*.86);g.rotate(Math.sin(time*2.3)*dr*.3+(id==='trucker'?-.12:.05));const w=rx*1.05;
  if(id==='cowboy'){g.fillStyle='#9b6a3c';g.beginPath();g.ellipse(0,0,w*1.15,R*.16,0,0,TAU);g.fill();g.fillStyle='#8a5a30';g.beginPath();g.moveTo(-w*.55,0);g.bezierCurveTo(-w*.6,-R*.6,-w*.1,-R*.45,0,-R*.55);g.bezierCurveTo(w*.1,-R*.45,w*.6,-R*.6,w*.55,0);g.fill();g.fillStyle='#4a2c16';g.fillRect(-w*.56,-R*.14,w*1.12,R*.1)}
  if(id==='trucker'){g.fillStyle='#fff';g.beginPath();g.arc(0,0,w*.7,Math.PI,TAU);g.fill();g.fillStyle='#d83a3a';g.beginPath();g.arc(0,0,w*.7,Math.PI*1.3,TAU);g.lineTo(0,0);g.fill();g.fillStyle='#d83a3a';g.beginPath();g.ellipse(-w*.75,0,w*.45,R*.08,0,0,TAU);g.fill();g.fillStyle='#d83a3a';g.font=`900 ${R*.18}px ui-rounded,Arial`;g.textAlign='center';g.fillText('BBQ',-w*.05,-R*.18)}
  if(id==='coon'){g.fillStyle='#7a6b5d';g.beginPath();g.arc(0,0,w*.7,Math.PI,TAU);g.fill();g.fillStyle='#4b4038';for(let i=0;i<4;i++){g.beginPath();g.ellipse(w*.75+i*R*.12,R*.05+i*R*.13,R*.1,R*.07,.8,0,TAU);g.fill();g.fillStyle=i%2?'#4b4038':'#cfc2b4'}}
  if(id==='beret'){g.fillStyle='#1d2a4f';g.beginPath();g.ellipse(-w*.1,-R*.08,w*.8,R*.2,-.1,0,TAU);g.fill();g.fillRect(-w*.12,-R*.32,R*.05,R*.1)}
  if(id==='crown'){g.fillStyle='#ffd23f';g.beginPath();g.moveTo(-w*.5,0);g.lineTo(-w*.5,-R*.35);g.lineTo(-w*.25,-R*.18);g.lineTo(0,-R*.4);g.lineTo(w*.25,-R*.18);g.lineTo(w*.5,-R*.35);g.lineTo(w*.5,0);g.fill();g.fillStyle='#e8344e';g.beginPath();g.arc(0,-R*.12,R*.06,0,TAU);g.fill()}
  if(id==='party'){g.fillStyle='#9b7ede';g.beginPath();g.moveTo(-w*.35,0);g.lineTo(0,-R*.7);g.lineTo(w*.35,0);g.fill();g.fillStyle='#ffd23f';for(let i=1;i<4;i++){g.beginPath();g.arc((i%2?-1:1)*w*.08,-i*R*.17,R*.04,0,TAU);g.fill()}g.beginPath();g.arc(0,-R*.72,R*.08,0,TAU);g.fill()}
  if(id==='hardhat'){g.fillStyle='#f5c518';g.beginPath();g.arc(0,0,w*.68,Math.PI,TAU);g.fill();g.fillRect(-w*.85,-R*.04,w*1.7,R*.08);g.fillStyle='#e0b000';g.fillRect(-R*.05,-w*.68,R*.1,w*.68)}
  g.restore();void tops}

 // ---------------------------------------------------------------- particules et objets lancés
 function puff(x,y,kind,n=6){for(let i=0;i<n;i++)fx.push({x,y,vx:(Math.random()-.5)*(kind==='spark'?260:90),vy:-Math.random()*(kind==='spark'?260:120)-20,t:0,life:kind==='zzz'||kind==='note'?2.2:1+Math.random()*.6,kind,s:Math.random()})}
 function drawFx(dt){for(let i=fx.length-1;i>=0;i--){const p=fx[i];p.t+=dt;if(p.t>p.life){fx.splice(i,1);continue}const k=p.t/p.life;
  if(p.kind==='zzz'||p.kind==='note'||p.kind==='heart'||p.kind==='bubble'){p.x+=Math.sin(p.t*3+p.s*6)*.6;p.y-=dt*30}else{p.vy+=(p.kind==='drop'||p.kind==='crumb'?500:p.kind==='spark'?300:0)*dt;p.x+=p.vx*dt;p.y+=p.vy*dt}
  g.globalAlpha=1-k;
  if(p.kind==='crumb'){g.fillStyle=['#c98a3d','#8a5a30','#e8c26a'][Math.floor(p.s*3)];g.fillRect(p.x,p.y,3,3)}
  else if(p.kind==='drop'){g.fillStyle='#6fc3f2';g.beginPath();g.ellipse(p.x,p.y,2.5,4,0,0,TAU);g.fill()}
  else if(p.kind==='spark'){g.fillStyle=['#ffd23f','#ff7b3a','#fff'][Math.floor(p.s*3)];g.beginPath();g.arc(p.x,p.y,2.5,0,TAU);g.fill()}
  else if(p.kind==='smoke'){g.fillStyle='rgba(120,120,120,.6)';g.beginPath();g.arc(p.x,p.y,6+k*14,0,TAU);g.fill()}
  else if(p.kind==='gas'){g.fillStyle='rgba(140,200,80,.45)';g.beginPath();g.arc(p.x,p.y,6+k*16,0,TAU);g.fill()}
  else{g.font=`${p.kind==='zzz'?16:18}px ui-rounded,Arial`;g.textAlign='center';g.fillStyle=p.kind==='zzz'?'#4a5a8a':'#d43';g.fillText(p.kind==='zzz'?'Z':p.kind==='note'?'♪':p.kind==='bubble'?'○':'♥',p.x,p.y)}
  g.globalAlpha=1}}
 // objet qui vole vers la bouche (ou repart quand il crache)
 function throwItem(icon,then,back){const m=mouthPos();A.fly.push({icon,x0:W*.92,y0:H-tray.offsetHeight-40,x1:m[0],y1:m[1],t:0,d:.5,then,back})}
 function mouthPos(){const R=A.R,{rx,ry}=petGeo(R),q=pet.parts.find(o=>o.type==='mouth');const [x,y]=q?ptPos(q,A.cx,A.cy,rx,ry):[A.cx,A.cy+ry*.3];return [x,y]}
 function drawFly(dt){for(let i=A.fly.length-1;i>=0;i--){const f=A.fly[i];f.t+=dt;let k=Math.min(1,f.t/f.d);if(f.back)k=1-k;
  const x=lerp(f.x0,f.x1,k),y=lerp(f.y0,f.y1,k)-Math.sin(k*Math.PI)*80;g.font='30px ui-rounded,Arial';g.textAlign='center';g.textBaseline='middle';g.save();g.translate(x,y);g.rotate(f.t*(f.back?14:5));g.fillText(f.icon,0,0);g.restore();g.textBaseline='alphabetic';
  if(f.t>=f.d){A.fly.splice(i,1);f.then?.()}}}

 // ---------------------------------------------------------------- actions
 function jumpTo(h){if(A.grab)return;A.vy=Math.sqrt(2*900*Math.max(0,h))}
 function say(t,ms=2600){A.bubble=t;A.bt=ms/1000;babble(Math.min(8,2+Math.floor(t.length/8)),pet.ivresse>40)}
 function anim(name,dur,data){A.anim=name;A.at=time;A.dur=dur;A.data=data}
 function react(r,icon){if(!r)return;save();hudUpdate();const m=mouthPos();
  if(r.anim==='eat'){throwItem(icon,()=>{anim('eat',1.2);sound('chomp');puff(m[0],m[1],'crumb',10);say(r.say);if(r.burp)setTimeout(()=>{if(!pet.asleep){anim('burp',.8);sound('burp');say('*ROT*',1200)}},1700)})}
  else if(r.anim==='spit'){throwItem(icon,()=>{anim('spit',1);sound('spit');say(r.say);A.fly.push({icon,x0:m[0],y0:m[1],x1:A.cx<W/2?W+40:-40,y1:H*.2,t:0,d:.7})})}
  else if(r.anim==='drink'){throwItem(icon,()=>{anim('drink',1.2,{icon});sound('gulp');say(r.say);if(r.hic)setTimeout(()=>{sound('hic');jumpTo(8)},1400);if(r.burp)setTimeout(()=>{sound('burp');say('*ROT*',1200)},2100)})}
  else if(r.anim==='faint'){throwItem(icon,()=>{anim('faint',2.5);sound('gulp');say(r.say);setTimeout(()=>sound('thud'),900)})}
  else if(r.anim==='full'){anim('refuse',1);say(r.say);sound('burp')}
  else if(r.anim==='refuse'){anim('refuse',1);say(r.say)}
  else if(r.anim==='sleep'){anim('sleep',1);say(r.say);if(pet.asleep)stopTune()}
  else if(r.anim==='wake'){anim('poke',.6);say(r.say);sound('yawn')}
  else if(r.anim==='shower'){anim('shower',2.4);sound('water');say(r.say);A.wet=3;A.soot=0}
  else if(r.music){playTune(r.music);anim('dance',1);say(r.say,3000)}
  else if(r.anim==='pose'){anim('pose',1);sound('pop');say(r.say);puff(A.cx,A.cy-A.R,'spark',10)}
  else if(TOY_ANIM[r.anim]){TOY_ANIM[r.anim]();say(r.say,3000)}
  else{anim(r.anim,1);say(r.say);if(r.sound)sound(r.sound)}}
 const TOY_ANIM={
  football:()=>{sound('whoosh');A.fly.push({icon:'🏈',x0:W+20,y0:H*.25,x1:A.cx,y1:A.cy-A.R,t:0,d:.8,then:()=>{jumpTo(26);anim('pose',1);sound('boing');A.fly.push({icon:'🏈',x0:A.cx,y0:A.cy-A.R,x1:-30,y1:H*.15,t:0,d:.8})}})},
  firecracker:()=>{anim('fuse',1.6);sound('fuse');A.data={x:A.cx+A.R*1.3,y:groundY()};setTimeout(()=>{if(mode!=='care')return;sound('boom');puff(A.data?.x??A.cx,groundY()-10,'spark',40);puff(A.cx,groundY()-10,'smoke',10);jumpTo(60);A.soot=5;anim('yell',1.4);say('BOUM ! YEEHAW !')},1600)},
  duck:()=>{anim('love',2);sound('squeak');A.fly.push({icon:'🦆',x0:-30,y0:groundY()-20,x1:A.cx-A.R*1.1,y1:groundY()-20,t:0,d:.9,then:()=>{sound('squeak');puff(A.cx,A.cy-A.R,'heart',6)}})},
  tractor:()=>{anim('ride',4);sound('engine');A.data={t0:time}},
  fishing:()=>{anim('fish',3);A.data={catch:['🐟','👢','🥫','🐟','🐠'][Math.floor(Math.random()*5)]};setTimeout(()=>{if(mode!=='care')return;sound('splash');const c2=A.data?.catch||'🐟';A.fly.push({icon:c2,x0:A.cx+A.R*2,y0:groundY(),x1:A.cx,y1:A.cy-A.R*1.4,t:0,d:.7,then:()=>say(c2==='👢'?'Une botte… encore.':c2==='🥫'?'Une canette ! Le jackpot.':'Le dîner est servi !')})},2200)},
  frisbee:()=>{sound('whoosh');A.fly.push({icon:'🥏',x0:-30,y0:H*.3,x1:A.cx,y1:A.cy-A.R*.6,t:0,d:1,then:()=>{jumpTo(34);anim('pose',1);sound('pop')}})}};
 function apply(kind,id){let r=null,icon='';
  if(kind==='food'){r=P.feed(pet,id);icon=P.FOODS.find(o=>o.id===id).icon}
  if(kind==='drink'){r=P.drink(pet,id);icon=P.DRINKS.find(o=>o.id===id).icon}
  if(kind==='toy')r=P.play(pet,id);
  if(kind==='music'){if(tune&&tune.id===id){stopTune();say('Oh, c’était bien…');return}r=P.listen(pet,id)}
  if(kind==='hat')r=P.wear(pet,id);
  if(kind==='care'){r=P.care(pet,id);if(id==='aspirin')icon='💊'}
  if(r&&(r.anim==='drink')&&!icon)icon='💊';
  react(r,icon);renderTray()}

 // ---------------------------------------------------------------- interface : jauges, plateau d'objets
 function hudUpdate(){const m=P.mood(pet),key=[Math.round(pet.st.ventre),Math.round(pet.st.moral),Math.round(pet.st.energie),Math.round(pet.st.proprete),Math.round(pet.ivresse),m,pet.name,mode].join();if(key===lastHud)return;lastHud=key;
  hud.innerHTML='';hud.hidden=mode==='edit';const top=el('div','pt-name');top.append(el('b',null,pet.name),el('span',null,P.MOOD_TEXT[m]));hud.append(top);
  const bars=el('div','pt-bars');for(const [k,label,ic] of P.STATS){const v=pet.st[k],b=el('div','pt-bar'+(v<25?' low':''));b.title=label;b.append(el('span',null,ic));const i=el('i');const u=el('u');u.style.width=v+'%';i.append(u);b.append(i);bars.append(b)}
  if(pet.ivresse>1){const b=el('div','pt-bar booze');b.append(el('span',null,'🍺'));const i=el('i');const u=el('u');u.style.width=pet.ivresse+'%';i.append(u);b.append(i);bars.append(b)}hud.append(bars);
  c.setBar?.('ÂGE',P.ageDays(pet)+' j','POIDS',pet.poids.toFixed(1).replace('.',',')+' kg')}
 const TABS=[['food','🍖','Bouffe'],['drink','🍺','À boire'],['toy','🏈','Jouets'],['music','🎸','Musique'],['hat','🤠','Look'],['care','🛁','Soins'],['edit','🛠️','Créer']];
 function renderTray(){tray.innerHTML='';if(mode==='edit'){tray.hidden=true;return}tray.hidden=false;
  const tabs=el('div','pt-tabs');for(const [id,ic,name] of TABS){const b=el('button','pt-tab'+(tab===id?' on':''));b.append(el('span',null,ic),el('small',null,name));b.onclick=()=>{c.tone?.(true);if(id==='edit')return openEditor();tab=id;renderTray()};tabs.append(b)}
  const row=el('div','pt-items');const list={food:P.FOODS,drink:P.DRINKS,toy:P.TOYS,music:P.MUSIC,hat:P.HATS.concat(P.EXTRAS),care:P.CARE}[tab]||[];
  for(const it of list){const on=(tab==='hat'&&(pet.hat===it.id||pet.extras.includes(it.id)||(it.id==='none'&&!pet.hat)))||(tab==='music'&&tune?.id===it.id)||(tab==='care'&&it.id==='sleep'&&pet.asleep);
   const b=el('button','pt-item'+(on?' on':''));b.append(el('span',null,it.icon),el('small',null,it.id==='sleep'&&pet.asleep?'Réveiller':it.name));b.dataset.kind=tab;b.dataset.id=it.id;dragSource(b);row.append(b)}
  tray.append(row,tabs);if(!pet.hinted){c.hint?.('Glisse un objet sur ton BagaPET, ou touche-le.');}}
 // glisser un objet du plateau jusqu'au BagaPET (ou simple toucher)
 function dragSource(b){b.addEventListener('pointerdown',e=>{if(c.isPaused?.())return;e.preventDefault();const s={x:e.clientX,y:e.clientY,moved:false,ghost:null,id:e.pointerId};
   const mv=ev=>{if(ev.pointerId!==s.id)return;if(!s.moved&&Math.hypot(ev.clientX-s.x,ev.clientY-s.y)>10){s.moved=true;s.ghost=el('div','pt-ghost',b.firstChild.textContent);wrap.append(s.ghost)}
    if(s.ghost){const r=wrap.getBoundingClientRect();s.ghost.style.left=ev.clientX-r.left+'px';s.ghost.style.top=ev.clientY-r.top+'px';const [x,y]=local(ev);A.lookX=(x-A.cx)/A.R;A.lookY=(y-A.cy)/A.R}};
   const up=ev=>{if(ev.pointerId!==s.id)return;window.removeEventListener('pointermove',mv);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);if(s.ghost)s.ghost.remove();
    if(ev.type==='pointercancel')return;if(!s.moved){apply(b.dataset.kind,b.dataset.id);return}const [x,y]=local(ev);if(Math.hypot(x-A.cx,y-A.cy)<A.R*1.6)apply(b.dataset.kind,b.dataset.id);pet.hinted=true};
   window.addEventListener('pointermove',mv);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up)})}
 function local(e){const r=cv.getBoundingClientRect();return [(e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height]}

 // ---------------------------------------------------------------- gestes sur le BagaPET (caresse, chatouilles, tape, le soulever)
 let tp=null,taps=[];
 cv.addEventListener('pointerdown',e=>{if(c.isPaused?.())return;const [x,y]=local(e);cv.setPointerCapture?.(e.pointerId);
  if(mode==='edit')return editDown(e,x,y);
  if(Math.hypot(x-A.cx,y-A.cy)>A.R*1.4){A.lookX=(x-A.cx)/A.R;A.lookY=(y-A.cy)/A.R;return}
  tp={x,y,x0:x,t0:time,dirs:0,lastDx:0,dist:0,id:e.pointerId,long:setTimeout(()=>{if(tp&&tp.dist<12&&!pet.asleep){A.grab={dx:A.cx-x,dy:A.cy-y,x,y};say('Hé ! Pose-moi !',1500);sound('boing')}},450)}});
 cv.addEventListener('pointermove',e=>{const [x,y]=local(e);if(mode==='edit')return editMove(e,x,y);A.lookX=(x-A.cx)/A.R;A.lookY=(y-A.cy)/A.R;if(!tp||e.pointerId!==tp.id)return;
  const dx=x-tp.x;tp.dist+=Math.hypot(dx,y-tp.y);if(A.grab){A.grab.x=x;A.grab.y=y}else if(Math.abs(dx)>3){if(tp.lastDx&&Math.sign(dx)!==Math.sign(tp.lastDx))tp.dirs++;tp.lastDx=dx;
   if(tp.dirs>=3){tp.dirs=0;react(P.touch(pet,'rub'));puff(A.cx,A.cy-A.R,'heart',3)}}tp.x=x;tp.y=y});
 const pUp=e=>{if(mode==='edit')return editUp(e);if(!tp||e.pointerId!==tp.id)return;clearTimeout(tp.long);
  if(A.grab){A.grab=null;A.vy=0;tp=null;return}
  if(tp.dist<12&&time-tp.t0<.4){taps=taps.filter(t=>time-t<1.1).concat(time);if(taps.length>=3){taps=[];react(P.touch(pet,'tickle'))}else react(P.touch(pet,'poke'))}
  tp=null};
 cv.addEventListener('pointerup',pUp);cv.addEventListener('pointercancel',pUp);

 // ---------------------------------------------------------------- création (éditeur)
 let drag=null,pinch=new Map();
 function openEditor(){mode='edit';sel=null;stopTune();renderEditor();renderTray();hudUpdate();c.hint?.('Ajoute des pièces, fais-les glisser sur le corps. Deux doigts : taille.')}
 function closeEditor(){mode='care';pet.created=true;sel=null;edit.hidden=true;save();renderTray();hudUpdate();say(pet.created&&P.ageDays(pet)<1&&!pet.greeted?'YEEHAW ! Salut toi !':'Me revoilà !');pet.greeted=true}
 let etab='parts';
 function renderEditor(){edit.hidden=false;edit.innerHTML='';
  const top=el('div','pt-etop');const name=el('input','pt-name-in');name.value=pet.name;name.maxLength=18;name.setAttribute('aria-label','Nom');name.onchange=()=>{pet.name=name.value.trim()||pet.name;save()};
  const dice=el('button','pt-small','🎲');dice.onclick=()=>{pet.name=P.NAMES[Math.floor(Math.random()*P.NAMES.length)];name.value=pet.name};
  const done=el('button','pt-done','C’est parti !');done.onclick=()=>{pet.name=name.value.trim()||pet.name;closeEditor()};top.append(name,dice,done);edit.append(top);
  if(sel){const bar=el('div','pt-selbar'),d=P.PARTS[sel.type];{const h=el('b');h.append(el('span',null,d.name),el('span',null,' · '),el('em',null,sel.kind));bar.append(h)}
   const B=(t,f,on)=>{const b=el('button','pt-small'+(on?' on':''),t);b.onclick=()=>{f();save();renderEditor()};bar.append(b)};
   B('↻ Style',()=>P.restylePart(pet,sel));B('−',()=>P.resizePart(pet,sel,.88));B('+',()=>P.resizePart(pet,sel,1.14));
   B('🎨',()=>{const i=P.COLORS.indexOf(sel.color);P.recolorPart(pet,sel,i>=P.COLORS.length-1?null:P.COLORS[i+1])});
   if(!d.front||sel.type==='eye')B('⇄ Miroir',()=>{if(P.toggleMirror(pet,sel)===null)c.toast?.('Trop de pièces !')},!!sel.sym);
   B('🗑',()=>{P.removePart(pet,sel);sel=null});edit.append(bar)}
  const tabs=el('div','pt-etabs');for(const [id,n] of [['parts','Pièces'],['body','Corps']]){const b=el('button','pt-small'+(etab===id?' on':''),n);b.onclick=()=>{etab=id;renderEditor()};tabs.append(b)}edit.append(tabs);
  const grid=el('div','pt-egrid');
  if(etab==='parts')for(const [type,d] of Object.entries(P.PARTS)){const b=el('button','pt-item');b.append(el('span',null,d.icon),el('small',null,d.name));b.onclick=()=>{const q=P.addPart(pet,type);if(!q){c.toast?.('Trop de pièces ! Retire-en une.');return}sel=q;sound('pop');save();renderEditor()};grid.append(b)}
  else{const sw=(list,cur,f)=>{const r=el('div','pt-swatches');for(const col of list){const b=el('button','pt-sw'+(cur===col?' on':''));b.style.background=col;b.setAttribute('aria-label',col);b.onclick=()=>{f(col);save();renderEditor()};r.append(b)}return r};
   grid.append(el('small','pt-lbl','Couleur'),sw(P.COLORS,pet.body.color,v=>pet.body.color=v),el('small','pt-lbl','Ventre'),sw(['#fff3d6','#ffd1dc','#d6f0ff','#e8ffd6','#f1e3c8','#ffe9a8'],pet.body.belly,v=>pet.body.belly=v));
   const pr=el('div','pt-swatches');for(const p of P.PATTERNS){const b=el('button','pt-small'+(pet.body.pattern===p?' on':''),p);b.onclick=()=>{pet.body.pattern=p;save();renderEditor()};pr.append(b)}grid.append(el('small','pt-lbl','Motif'),pr);
   const sq=el('div','pt-swatches');for(const [v,n] of [[.85,'Fin'],[1,'Rond'],[1.2,'Large']]){const b=el('button','pt-small'+(pet.body.squash===v?' on':''),n);b.onclick=()=>{pet.body.squash=v;save();renderEditor()};sq.append(b)}grid.append(el('small','pt-lbl','Forme'),sq)}
  edit.append(grid)}
 function hitPart(x,y){const R=A.R;for(let i=A.hits.length-1;i>=0;i--){const h=A.hits[i];if(Math.hypot(x-(A.cx+h.x),y-(A.cy+h.y))<h.r+8)return h.q}return null}
 function editDown(e,x,y){pinch.set(e.pointerId,[x,y]);if(pinch.size===2&&sel){const [a,b]=[...pinch.values()];drag={pinch:Math.hypot(a[0]-b[0],a[1]-b[1]),size:sel.size};return}
  const q=hitPart(x,y);if(q){sel=q;drag={q};renderEditor()}else if(sel){sel=null;drag=null;renderEditor()}}
 function editMove(e,x,y){if(!pinch.has(e.pointerId))return;pinch.set(e.pointerId,[x,y]);
  if(drag?.pinch&&pinch.size===2&&sel){const [a,b]=[...pinch.values()],k=Math.hypot(a[0]-b[0],a[1]-b[1])/drag.pinch;P.resizePart(pet,sel,(drag.size*k)/sel.size);return}
  if(!drag?.q)return;const {rx,ry}=petGeo(A.R),dx=(x-A.cx)/rx,dy=(y-A.cy)/ry;P.movePart(pet,drag.q,Math.atan2(dx,-dy),Math.hypot(dx,dy))}
 function editUp(e){pinch.delete(e.pointerId);if(!pinch.size){if(drag)save();drag=null}}

 // ---------------------------------------------------------------- boucle
 function resize(){const w=wrap.clientWidth,h=wrap.clientHeight;if(!w||!h)return;dpr=Math.min(2,window.devicePixelRatio||1);if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(h*dpr)){cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr)}W=w;H=h}
 function bubble(){if(!A.bubble||A.bt<=0)return;const t=A.bubble;g.font='700 14px ui-rounded,Arial';const w=Math.min(W*.8,g.measureText(t).width+22),x=clamp(A.cx,w/2+6,W-w/2-6),y=A.cy-A.R*1.55-(pet.hat?A.R*.35:0);
  g.globalAlpha=Math.min(1,A.bt*3);g.fillStyle='#fff';g.strokeStyle='#27453c';g.lineWidth=2;rr(x-w/2,y-34,w,30,12);g.fill();g.stroke();g.beginPath();g.moveTo(A.cx-6,y-4);g.lineTo(A.cx,y+8);g.lineTo(A.cx+6,y-4);g.fill();
  g.fillStyle='#27453c';g.textAlign='center';g.fillText(t,x,y-14,w-12);g.globalAlpha=1}
 function frame(dt){resize();time+=dt;g.setTransform(dpr,0,0,dpr,0,0);
  const R=A.R=mode==='edit'?Math.min(W*.24,editSpace()*.24):Math.min(W*.21,(H-tray.offsetHeight-hud.offsetHeight-8)*.22),geo=petGeo(R),gy=groundY();
  if(mode==='edit'){const gr=g.createRadialGradient(W/2,gy-R,R,W/2,gy-R,W);gr.addColorStop(0,'#fff6e2');gr.addColorStop(1,'#f0dcc0');g.fillStyle=gr;g.fillRect(0,0,W,H);g.fillStyle='#e6cfa8';g.beginPath();g.ellipse(W/2,gy+4,R*1.6,R*.25,0,0,TAU);g.fill();A.x=W/2;A.tx=W/2}
  else scene();
  // déplacement : il se balade, ou on le tient
  if(!A.x){A.x=W/2;A.tx=W/2}
  const busy=A.anim&&time-A.at<A.dur;if(busy===false&&A.anim){A.anim=null}
  if(mode==='care'&&!A.grab&&!busy&&!pet.asleep&&!A.dance){if((idleT-=dt)<=0){idleT=5+Math.random()*7;if(Math.random()<.55)A.tx=clamp(W*(.25+Math.random()*.5),R*1.5,W-R*1.5);else{const r=P.idleGag(pet);if(r){react(r);if(r.anim==='fart')puff(A.cx-R*.8,A.cy+R*.5,'gas',5);if(r.anim==='sing'||r.anim==='dance')puff(A.cx,A.cy-R,'note',4)}}}}
  if(A.anim==='ride'){const k=(time-A.at)/A.dur;A.x=W*(.15+.7*(k<.5?k*2:2-k*2));A.tx=A.x}
  const sp=60*(pet.ivresse>50?.6:1)*dt;if(Math.abs(A.tx-A.x)>sp){A.face=Math.sign(A.tx-A.x);A.x+=A.face*sp+(pet.ivresse>50?Math.sin(time*5)*1.2:0)}
  // saut et chute
  if(!A.grab&&(A.jy>0||A.vy>0)){A.jy+=A.vy*dt;A.vy-=900*dt;if(A.jy<=0){const hard=A.vy<-250;A.jy=0;A.vy=0;if(hard)sound('thud')}}
  let cx=A.x,cy=gy-geo.foot-A.jy;
  if(A.grab){cx=A.grab.x+A.grab.dx;cy=Math.min(A.grab.y+A.grab.dy,gy-geo.foot);A.jy=gy-geo.foot-cy;A.x=A.tx=cx}
  if(A.anim==='faint'||P.mood(pet)==='ko'){cy=gy-geo.rx*1.05}else if(pet.asleep)cy=gy-geo.foot*.93
  A.cx=cx;A.cy=cy;
  // ombre
  if(mode==='care'){g.fillStyle='rgba(0,0,0,.18)';g.beginPath();g.ellipse(cx,gy+2,geo.rx*.9*(1-Math.min(.5,A.jy/300)),R*.14,0,0,TAU);g.fill()}
  // tracteur sous lui
  if(A.anim==='ride'){g.font=`${R*1.6}px ui-rounded,Arial`;g.textAlign='center';g.save();g.translate(cx,gy-R*.3);g.scale(A.face<0?1:-1,1);g.fillText('🚜',0,0);g.restore();cy-=R*.5;A.cy=cy}
  // canne à pêche, pétard, tuyau
  if(A.anim==='fish'){g.strokeStyle='#6b4a2a';g.lineWidth=3;g.beginPath();g.moveTo(cx+R*.6,cy);g.lineTo(cx+R*1.8,cy-R);g.stroke();g.strokeStyle='#ddd';g.lineWidth=1;g.beginPath();g.moveTo(cx+R*1.8,cy-R);g.lineTo(cx+R*2,gy);g.stroke();g.fillStyle='#6fa8dc';g.beginPath();g.ellipse(cx+R*2,gy+4,R*.6,R*.12,0,0,TAU);g.fill()}
  if(A.anim==='fuse'){const x=cx+R*1.3,y=gy-10;g.fillStyle='#d83a3a';g.fillRect(x-5,y-12,10,16);puff(x,y-14,'spark',1)}
  if(A.anim==='shower'){g.strokeStyle='#3d8b3d';g.lineWidth=4;g.beginPath();g.moveTo(0,gy-10);g.quadraticCurveTo(W*.1,gy-40,cx-R*1.6,cy-R*1.2);g.stroke();for(let i=0;i<3;i++)fx.push({x:cx-R*1.6,y:cy-R*1.2,vx:120+Math.random()*80,vy:-60+Math.random()*60,t:0,life:.8,kind:'drop',s:0})}
  drawPet(cx,cy,R,{sel:mode==='edit'?sel:null});
  // objets dans les mains : boisson
  if(A.anim==='drink'&&busy){g.font=`${R*.5}px ui-rounded,Arial`;g.textAlign='center';const m=mouthPos();g.save();g.translate(m[0]+R*.2,m[1]);g.rotate(-1.1);g.fillText(A.data?.icon||'🍺',0,0);g.restore()}
  // Zzz, notes, mouches
  if(pet.asleep&&Math.random()<dt*1.2){puff(cx+R*.5,cy-R*.8,'zzz',1);if(Math.random()<.4)sound('snore')}
  if(A.dance&&Math.random()<dt*4)puff(cx+(Math.random()-.5)*R*2,cy-R,'note',1);
  if(pet.st.proprete<25){for(let i=0;i<3;i++){const a=time*3+i*2.1;g.fillStyle='#222';g.beginPath();g.arc(cx+Math.cos(a)*R*1.2,cy-R*.6+Math.sin(a*1.7)*R*.4,2.2,0,TAU);g.fill()}}
  if(A.wet>0){A.wet-=dt;if(Math.random()<dt*8)fx.push({x:cx+(Math.random()-.5)*R*1.6,y:cy-R*.5,vx:0,vy:0,t:0,life:.6,kind:'drop',s:0})}
  if(A.soot>0)A.soot-=dt*.4;
  drawFly(dt);drawFx(dt);if(A.bt>0)A.bt-=dt;bubble();
  if(A.danceT>0){A.danceT-=dt;if(A.danceT<=0){A.dance=null;tune=null;renderTray()}}
  // clignement
  if((A.blink-=dt)<-3-Math.random()*3)A.blink=.12;
  if(mode==='care'&&!tp&&!busy){A.lookX*=.98;A.lookY*=.98}}

 // ---- démarrage
 renderTray();hudUpdate();
 if(mode==='edit')openEditor();else{const away=Date.now()-(pet.lastSeen||Date.now());if(away>2*3600e3)say(pet.st.ventre<30?'T’étais où ?! J’ai la dalle !':'Ah, te revoilà !');else say(P.MOOD_TEXT[P.mood(pet)])}
 pet.lastSeen=Date.now();
 return {
  update(dt){P.tick(pet,dt*1000);pet.at=Date.now();frame(dt);hudUpdate();if((saveT+=dt)>15){saveT=0;pet.lastSeen=Date.now();save()}},
  pause(){stopTune();save()},
  destroy(){stopTune();pet.lastSeen=Date.now();save();document.removeEventListener('visibilitychange',onHide);window.removeEventListener('pagehide',save)}}
}
export const hasPet=()=>!!savedRun(KEY);
