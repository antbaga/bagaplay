// BagaStore : jeu de gestion de supermarché en 3D (vue 3/4). Interface : construction, stock, équipe, compta.
import * as D from './store-data.js';
import * as E from './store-engine.js';
import {createRenderer,camera,viewProj,project,ground,Builder} from './store-gl.js';
import {buildStatic,buildAgents,buildGhost,buildAccess,item as itemModel} from './store-models.js';
import {savedRun,saveRun,clearRun} from './runs.js';

const KEY='bagastore';
const eur=v=>(v<0?'−':'')+Math.round(Math.abs(v)).toLocaleString('fr-FR').replace(/ | /g,' ')+' €';
const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e};
const SVG='http://www.w3.org/2000/svg';

// petit graphique (barres ou courbe) en SVG
function chart(vals,{line=false,color='#5aa36a',neg='#d9534f',fmt=v=>String(Math.round(v)),label='',zero=true}={}){
 const box=el('div','st-chart');if(label)box.append(el('b',null,label));
 const W=300,H=96,pad=4,v=vals.map(x=>x??0),max=Math.max(zero?0:-Infinity,...v),min=Math.min(zero?0:Infinity,...v),span=max-min||1,y=t=>pad+(max-t)/span*(H-2*pad);
 const s=document.createElementNS(SVG,'svg');s.setAttribute('viewBox',`0 0 ${W} ${H}`);s.setAttribute('preserveAspectRatio','none');
 const add=(tag,a)=>{const e=document.createElementNS(SVG,tag);for(const k in a)e.setAttribute(k,a[k]);s.append(e);return e};
 add('line',{x1:0,x2:W,y1:y(0),y2:y(0),stroke:'#cfc8b6','stroke-width':1});
 if(!v.length){box.append(s,el('small','st-chart-empty','Pas encore de données'));return box}
 const bw=W/Math.max(v.length,12);
 if(line){add('polyline',{points:v.map((t,i)=>`${(i+.5)*bw},${y(t)}`).join(' '),fill:'none',stroke:color,'stroke-width':2.2,'stroke-linejoin':'round'});const t=v.length-1;add('circle',{cx:(t+.5)*bw,cy:y(v[t]),r:3,fill:color})}
 else v.forEach((t,i)=>add('rect',{x:i*bw+bw*.12,width:bw*.76,y:Math.min(y(t),y(0)),height:Math.max(1,Math.abs(y(t)-y(0))),rx:1.5,fill:t<0?neg:color}));
 const leg=el('div','st-chart-leg');leg.append(el('span',null,fmt(max)),el('span',null,'dernier : '+fmt(v[v.length-1])),el('span',null,fmt(min)));
 box.append(s,leg);return box}

export function bagastore(c){
 const saved=!c.fresh&&savedRun(KEY);let S=(saved&&E.load(saved))||null,isNew=!S;if(!S)S=E.starter(E.withDirt(E.newGame()));
 // on reprend exactement où on en était : clients, voitures, camion, employés, heure
 let R=(!isNew&&E.restore(S,saved))||E.runtime();
 // ---- éléments
 const wrap=el('div','st-wrap');c.board.append(wrap);
 const cv=el('canvas','st-gl'),ov=el('canvas','st-ov');wrap.append(cv,ov);const g2=ov.getContext('2d');
 const hud=el('div','st-hud');const info=el('div','st-info');const camBox=el('div','st-cam');hud.append(info,camBox);wrap.append(hud);
 const pop=el('div','st-pop');pop.hidden=true;const popNo=el('button','st-pop-no','✕'),popOk=el('button','st-pop-ok','✓'),popCost=el('div','st-pop-cost');popNo.setAttribute('aria-label','Annuler');popOk.setAttribute('aria-label','Valider');const popBtns=el('div','st-pop-btns');popBtns.append(popNo,popOk);pop.append(popBtns,popCost);wrap.append(pop);
 const sheet=el('div','st-sheet');sheet.hidden=true;wrap.append(sheet);
 const bar=el('div','st-place');bar.hidden=true;wrap.append(bar);
 const toastBox=el('div','st-toast');wrap.append(toastBox);
 const ren=createRenderer(cv);
 if(!ren){wrap.append(el('p','st-nogl','La 3D (WebGL) n’est pas disponible sur cet appareil.'));return {}}
 const cam=camera();const home=()=>{cam.tx=(S.b.x0+S.b.x1)/2;cam.tz=(S.b.y0+S.b.y1)/2+2;cam.zoom=Math.max(14,Math.min(26,(S.b.x1-S.b.x0)*.8))};home();
 const Bs=new Builder(1<<17),Ba=new Builder(1<<14),Bg=new Builder(1<<12),Bsel=new Builder(1<<11),Bac=new Builder(1<<9);
 let mode=null,sel=null,panel=null,speedIdx=0,hold=false,lastStatic=-1,staticKey='',time=0,saveT=0,floats=[],pending=null,ghostTint=[0,0,0,0],anchor=null,frameDt=.016;
 const view=()=>{const s=Math.sin(cam.yawTo),k=Math.cos(cam.yawTo);return {yaw:cam.yaw,near:{S:k>.3,N:k<-.3,E:s>.3,W:s<-.3},sel:null,zones:!!mode,hide:mode?.move||null,dt:frameDt}};

 // ---- bruitages (synthétisés)
 const last={};
 function sfx(kind,gap=0){const vol=c.volume?.('sfx')??.5;if(!vol)return;const a=c.audio?.();if(!a)return;const t=a.currentTime;if(gap&&last[kind]&&t-last[kind]<gap)return;last[kind]=t;const G=vol*.5;
  const tone=(f,d,type='sine',g=.15,at=0,f2=null)=>{const o=a.createOscillator(),v=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t+at);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+at+d);v.gain.setValueAtTime(0,t+at);v.gain.linearRampToValueAtTime(g*G,t+at+.01);v.gain.exponentialRampToValueAtTime(.0005,t+at+d);o.connect(v);v.connect(a.destination);o.start(t+at);o.stop(t+at+d+.05)};
  const noise=(d,g=.1,f=1200,at=0,q=1)=>{const n=a.createBuffer(1,Math.ceil(a.sampleRate*d),a.sampleRate),ch=n.getChannelData(0);for(let i=0;i<ch.length;i++)ch[i]=(Math.random()*2-1)*(1-i/ch.length);const src=a.createBufferSource(),fl=a.createBiquadFilter(),v=a.createGain();src.buffer=n;fl.type='bandpass';fl.frequency.value=f;fl.Q.value=q;v.gain.value=g*G;src.connect(fl);fl.connect(v);v.connect(a.destination);src.start(t+at)};
  if(kind==='place'){tone(150,.18,'sine',.35,0,70);noise(.08,.25,700)}
  if(kind==='erase'){noise(.25,.35,500,0,.6);tone(110,.2,'square',.06,0,55)}
  if(kind==='error'){tone(220,.12,'square',.07);tone(165,.16,'square',.07,.12)}
  if(kind==='click')tone(1300,.04,'triangle',.08);
  if(kind==='cash'){noise(.05,.12,3500,0,2);tone(1568,.18,'triangle',.11,.03);tone(2093,.3,'triangle',.11,.09)}
  if(kind==='door')tone(988,.35,'sine',.05,0);
  if(kind==='bad')tone(330,.18,'sine',.06,0,250);
  if(kind==='night'){tone(523,.4,'sine',.08);tone(659,.5,'sine',.07,.15)}
  if(kind==='month'){[523,659,784,1047].forEach((f,i)=>tone(f,.35,'triangle',.1,i*.11))}
  if(kind==='truck'){noise(.7,.25,180,0,.5);tone(60,.6,'sawtooth',.04)}
  if(kind==='coin')tone(1760,.12,'square',.04);
  if(kind==='horn'){tone(392,.25,'square',.05);tone(392,.3,'square',.05,.3)}}

 // ---- boutons de caméra
 for(const [t,a,fn] of [['⟲','Tourner la vue à gauche',()=>{cam.yawTo-=Math.PI/2}],['⟳','Tourner la vue à droite',()=>{cam.yawTo+=Math.PI/2}],['+','Zoomer',()=>zoom(.8)],['−','Dézoomer',()=>zoom(1.25)],['⌂','Recentrer',home],['🗑','Démolir',()=>{if(mode?.id==='erase')stopMode();else startTool('erase')}]]){
  const b=el('button','st-cbtn',t);b.setAttribute('aria-label',a);c.listen(b,'click',()=>{sfx('click');fn()});camBox.append(b)}
 const zoom=k=>{cam.zoom=Math.max(4,Math.min(40,cam.zoom*k))};

 // ---- barre d'outils
 c.controls.innerHTML='';
 const tb=(icon,label,fn)=>{const b=c.button('',()=>{sfx('click');fn()},'st-tool',label);b.innerHTML=`<span>${icon}</span><small>${label}</small>`;return b};
 tb('🏗️','Construire',()=>openPanel('build'));tb('📦','Stock',()=>openPanel('stock'));tb('👥','Équipe',()=>openPanel('team'));tb('💶','Compta',()=>openPanel('money'));
 const speedBtn=tb('▶','×1',()=>{speedIdx=(speedIdx+1)%D.SPEEDS.length;refreshBar()});
 const openBtn=tb('🔒','Fermé',()=>{S.open=!S.open;S.started=true;refreshBar();save()});
 function refreshBar(){speedBtn.querySelector('small').textContent='×'+D.SPEEDS[speedIdx];speedBtn.querySelector('span').textContent=['▶','⏩','⏩','⏭'][speedIdx];
  openBtn.querySelector('span').textContent=S.open?'🔓':'🔒';openBtn.querySelector('small').textContent=S.open?'Ouvert':'Fermé';openBtn.classList.toggle('on',S.open)}
 refreshBar();

 // ---- toucher : glisser = déplacer la vue, pincer = zoom, toucher = action
 const pts=new Map();let pinch=null,drag=null;
 const DRAW=new Set(['wall','zoneR','zoneS','extend','asphalt','road','walk','cross','yield','oneway']);const GT={asphalt:1,road:2,walk:3,cross:4,yield:5,oneway:6};
 const cellAt=(px,py)=>{const [gx,gz]=ground(cam,px,py);return [Math.floor(gx),Math.floor(gz)]};
 c.listen(cv,'pointerdown',e=>{cv.setPointerCapture?.(e.pointerId);pts.set(e.pointerId,{x:e.offsetX,y:e.offsetY,x0:e.offsetX,y0:e.offsetY,t:performance.now()});
  if(pts.size===2){const [a,b]=[...pts.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),z:cam.zoom,mx:(a.x+b.x)/2,my:(a.y+b.y)/2};if(drag?.draw&&mode){mode.a=mode.b=null;updatePlace()}drag={moved:true}}
  else if(mode?.kind==='tool'&&DRAW.has(mode.id)){const c0=cellAt(e.offsetX,e.offsetY);mode.a=c0;mode.b=c0;drag={draw:true,moved:false};updatePlace()}
  else{drag={moved:false}}});
 c.listen(cv,'pointermove',e=>{const p=pts.get(e.pointerId);if(!p)return;const px=p.x,py=p.y;p.x=e.offsetX;p.y=e.offsetY;
  if(pts.size>=2&&pinch){const [a,b]=[...pts.values()];cam.zoom=Math.max(4,Math.min(40,pinch.z*pinch.d/Math.max(20,Math.hypot(a.x-b.x,a.y-b.y))));
   const mx=(a.x+b.x)/2,my=(a.y+b.y)/2,g0=ground(cam,pinch.mx,pinch.my),g1=ground(cam,mx,my);cam.tx+=g0[0]-g1[0];cam.tz+=g0[1]-g1[1];pinch.mx=mx;pinch.my=my;clampCam();return}
  if(drag?.draw&&mode){const c1=cellAt(p.x,p.y);if(!mode.b||c1[0]!==mode.b[0]||c1[1]!==mode.b[1]){mode.b=c1;drag.moved=true;updatePlace()}return}
  if(drag&&(drag.moved||Math.hypot(p.x-p.x0,p.y-p.y0)>8)){drag.moved=true;const g0=ground(cam,px,py),g1=ground(cam,p.x,p.y);cam.tx+=g0[0]-g1[0];cam.tz+=g0[1]-g1[1];clampCam()}});
 const up=e=>{const p=pts.get(e.pointerId);pts.delete(e.pointerId);if(pts.size<2)pinch=null;if(!p)return;
  if(drag?.draw){if(!pts.size){drag=null;updatePlace()}return}
  if(drag&&!drag.moved&&pts.size===0&&performance.now()-p.t<500)tap(p.x,p.y);if(!pts.size)drag=null};
 c.listen(cv,'pointerup',up);c.listen(cv,'pointercancel',e=>{pts.delete(e.pointerId);drag=null;pinch=null});
 c.listen(cv,'wheel',e=>{e.preventDefault();zoom(e.deltaY>0?1.12:.89)},{passive:false});
 function clampCam(){cam.tx=Math.max(-5,Math.min(D.LOT_W+5,cam.tx));cam.tz=Math.max(-5,Math.min(D.LOT_H+5,cam.tz))}

 function tap(px,py){const [gx,gz]=ground(cam,px,py),x=Math.floor(gx),y=Math.floor(gz);
  if(mode?.kind==='item'){const d=D.ITEM[mode.t],[w,dd]=mode.r%2?[d.d,d.w]:[d.w,d.d],nx=x-Math.floor((w-1)/2),ny=y-Math.floor((dd-1)/2);
   if(mode.pos&&mode.pos[0]===nx&&mode.pos[1]===ny)return confirmPlace();mode.pos=[nx,ny];updatePlace();return}
  if(mode?.kind==='tool'){const t=mode.id;
   if(t==='door'){const why=E.makeDoor(S,x,y);if(why){msg(why);sfx('error')}else sfx('place');return}
   if(t==='erase'){mode.a=[x,y];mode.b=[x,y];updatePlace();return}
   return}
  // sans outil : sélection d'un meuble (contour)
  const L=E.layout(S),id=E.inLot(x,y)?L.occ[E.idx(x,y)]:0;sel=id||null;if(sel){sfx('click');openPanel('item')}else if(panel==='item')closePanel()}

 // ---- placement : aperçu, petite bulle ✕ / ✓ au-dessus de l'objet
 const TOOL_NAMES={extend:'Agrandir',asphalt:'Goudron',road:'Route',walk:'Trottoir',cross:'Passage piéton',yield:'Cédez le passage',oneway:'Sens unique'},TOOL_HINT={oneway:'Glisse le doigt sur une route, dans le sens où les voitures doivent rouler.',yield:'Trace la ligne en travers de la voie : les voitures qui y arrivent laissent passer les autres.',cross:'Glisse le doigt en travers d’une route.',extend:'Glisse le doigt pour tracer l’extension.',asphalt:'Glisse le doigt pour goudronner une zone.',walk:'Glisse le doigt pour poser un trottoir.',road:'Glisse le doigt pour tracer une route.',wall:'Glisse le doigt pour tracer le mur.',zoneR:'Glisse le doigt sur la zone.',zoneS:'Glisse le doigt sur la zone.',erase:'Touche ce que tu veux démolir.'};
 function startMove(id){const it=S.items.find(o=>o.id===id);if(!it)return;mode={kind:'item',t:it.t,r:it.r,pos:[it.x,it.y],move:id};staticKey='';closePanel();bar.hidden=false;updatePlace();msg('Touche la nouvelle place.')}
 function startItem(t){mode={kind:'item',t,r:0,pos:null};closePanel();bar.hidden=false;updatePlace();msg('Touche le sol pour placer.')}
 function startTool(t){mode={kind:'tool',id:t};closePanel();bar.hidden=false;updatePlace();msg(TOOL_HINT[t]||D.TOOLS.find(o=>o.id===t)?.hint||'')}
 function stopMode(){mode=null;staticKey='';bar.hidden=true;pop.hidden=true;anchor=null;ren.upload('ghost',Bg.d,0);ren.upload('access',Bac.d,0);c.hint(E.problems(S)[0]||'')}
 function updatePlace(){bar.innerHTML='';let ok=false,why='',label='',cost=0;const g={};anchor=null;
  let access=[];if(mode.kind==='item'){const d=D.ITEM[mode.t];label=d.name;cost=mode.move?0:mode.pos?E.placeCost(S,mode.t,mode.pos[0],mode.pos[1],mode.r):d.price;
   if(mode.pos){why=mode.move?E.canMove(S,mode.move,mode.pos[0],mode.pos[1],mode.r):E.canPlace(S,mode.t,mode.pos[0],mode.pos[1],mode.r);if(d.zone!==2&&d.kind!=='decor')access=E.front({t:mode.t,x:mode.pos[0],y:mode.pos[1],r:mode.r});ok=!why;g.item={t:mode.t,x:mode.pos[0],y:mode.pos[1],r:mode.r};const [w,dd]=mode.r%2?[d.d,d.w]:[d.w,d.d];anchor=[mode.pos[0]+w/2,d.h+1.6,mode.pos[1]+dd/2]}}
  else{const t=mode.id;label=TOOL_NAMES[t]||D.TOOLS.find(o=>o.id===t).name;const b=mode.b||mode.a;
   if(t==='wall'&&mode.a){const cl=E.wallPlan(S,mode.a,b);g.cells=cl;g.h=1.3;cost=cl.length*D.WALL_COST;ok=cl.length>0;why=cl.length?'':'Rien à construire ici.'}
   if((t==='zoneR'||t==='zoneS')&&mode.a){const o=[];for(let y=Math.min(mode.a[1],b[1]);y<=Math.max(mode.a[1],b[1]);y++)for(let x=Math.min(mode.a[0],b[0]);x<=Math.max(mode.a[0],b[0]);x++)if(E.inside(S,x,y))o.push([x,y]);g.cells=o;g.h=.06;ok=o.length>0}
   if(t==='extend'&&mode.a){const p=E.extendPlan(S,mode.a,b);g.cells=p.cells;g.h=.12;cost=p.cost;ok=!p.why;why=p.why||'';if(p.m2)label=`Agrandir : ${p.m2} m²`}
   if(GT[t]&&mode.a){const p=E.groundPlan(S,mode.a,b,GT[t]);g.cells=p.cells.map(i=>[i%D.LOT_W,i/D.LOT_W|0]);g.h=.04;cost=p.cost;ok=!p.why;why=p.why||'';if(p.cells.length)label=`${TOOL_NAMES[t]} : ${p.cells.length} m²`}
   if(t==='erase'&&mode.a){const inf=E.eraseInfo(S,...mode.a);if(inf){g.cells=inf.cells.map(k=>[k%D.LOT_W,k/D.LOT_W|0]);g.h=.3;label='Démolir : '+inf.label;cost=-inf.refund;ok=true;if(inf.lost)why=inf.lost+' articles de la réserve seront perdus.'}else why='Rien à démolir ici.'}
   if(mode.a)anchor=[b[0]+.5,(g.h||0)+1,b[1]+.5]}
  if(ok&&cost>0&&cost>S.cash){ok=false;why='Pas assez d’argent.'}
  buildGhost(Bg,S,g,view());ren.upload('ghost',Bg.d,Bg.n);buildAccess(Bac,access,view());ren.upload('access',Bac.d,Bac.n);ghostTint=ok?[.3,.85,.4,.45]:[.95,.3,.25,.5];
  const name=el('div','st-place-name');name.append(el('b',null,label),el('small',null,cost?(cost>0?eur(cost):'+'+eur(-cost)):''));bar.append(name);
  if(mode.kind==='item'){const r=el('button','st-pbtn','↻');r.setAttribute('aria-label','Tourner');r.onclick=()=>{mode.r=(mode.r+1)%4;sfx('click');updatePlace()};bar.append(r)}
  if(E.canUndo(S)){const u=el('button','st-pbtn','↶');u.setAttribute('aria-label','Annuler la dernière construction');u.onclick=()=>{const why=E.undo(S);if(why){msg(why);sfx('error')}else{sfx('erase');toast('Construction annulée, remboursée')}updatePlace()};bar.append(u)}
  const x=el('button','st-pbtn done','Fini');x.onclick=()=>{sfx('click');stopMode()};bar.append(x);
  pop.hidden=!anchor||(mode.kind==='tool'&&!mode.b)||!!drag?.draw||(mode.id==='erase'&&!ok);popOk.disabled=!ok;pop.classList.toggle('bad',!ok);popCost.textContent=cost?(cost>0?eur(cost):'+'+eur(-cost)):'';
  popOk.onclick=()=>mode.kind==='item'?confirmPlace():applyTool();popNo.onclick=()=>{if(mode.kind==='item')mode.pos=null;else mode.a=mode.b=null;sfx('click');updatePlace()};
  c.hint(why||'')}
 function confirmPlace(){if(!mode?.pos)return;if(mode.move){const why=E.moveItem(S,mode.move,mode.pos[0],mode.pos[1],mode.r);if(why){msg(why);sfx('error');return}sfx('place');sel=mode.move;stopMode();return}const r=E.place(S,mode.t,mode.pos[0],mode.pos[1],mode.r);
  if(typeof r==='string'){msg(r);sfx('error');return}sfx('place');mode.pos=null;updatePlace()}
 function applyTool(){let why=null;const t=mode.id;
  if(t==='wall')why=E.buildWall(S,mode.a,mode.b);
  if(t==='zoneR'||t==='zoneS')why=E.paintZone(S,mode.a,mode.b,t==='zoneR'?1:0);
  if(t==='erase')why=E.eraseAt(S,...mode.a);
  if(t==='extend'){why=E.extendRect(S,mode.a,mode.b);if(!why)save()}
  if(GT[t])why=E.paintGround(S,mode.a,mode.b,GT[t]);
  if(why){msg(why);sfx('error')}else sfx(t==='erase'?'erase':'place');mode.a=mode.b=null;updatePlace()}

 // ---- panneaux
 function closePanel(){panel=null;sheet.hidden=true;if(!mode)sel=null}
 function openPanel(name){if(mode&&name!=='item')stopMode();panel=name;sheet.hidden=false;renderPanel()}
 let buildTab='rayons',stockTab='stock',moneyTab='tresor',cashSpan=30;
 function head(title,tabs,cur,set){sheet.innerHTML='';const h=el('div','st-head');h.append(el('b',null,title));
  const x=el('button','st-x','✕');x.setAttribute('aria-label','Fermer');x.onclick=()=>{sfx('click');closePanel()};h.append(x);sheet.append(h);
  if(tabs){const t=el('div','st-tabs');for(const [id,name] of tabs)t.append(btn(name,()=>{set(id);renderPanel()},'st-tab'+(id===cur?' on':'')));sheet.append(t)}
  const body=el('div','st-body');sheet.append(body);return body}
 const row=(...kids)=>{const r=el('div','st-row');r.append(...kids);return r};
 const btn=(t,fn,cls='st-small')=>{const b=el('button',cls,t);b.onclick=e=>{e.stopPropagation();sfx('click');fn()};return b};
 const tile=(k,v,sub)=>{const d=el('div','st-tile');d.append(el('small',null,k),el('b',null,v));if(sub)d.append(el('i',null,sub));return d};
 const bars=(items,fmt=eur)=>{const box=el('div','st-hbars'),max=Math.max(1,...items.map(i=>Math.abs(i[1])));for(const [k,v,col] of items){const r=el('div','st-hbar');const m=el('i');const u=el('u');u.style.width=Math.abs(v)/max*100+'%';if(col)u.style.background=col;m.append(u);r.append(el('span',null,k),m,el('b',null,fmt(v)));box.append(r)}return box};
 let panelKey='';
 function renderPanel(){if(!panel)return;const old=sheet.querySelector('.st-body'),top=old?old.scrollTop:0,key=[panel,buildTab,stockTab,moneyTab,sel].join();
  const fn={build:pBuild,stock:pStock,team:pTeam,money:pMoney,item:pItem,report:pReport,welcome:pWelcome}[panel];fn&&fn();
  const nb=sheet.querySelector('.st-body');if(nb&&key===panelKey)nb.scrollTop=top;panelKey=key}
 function pBuild(){const body=head('Construire · '+eur(S.cash),D.TABS,buildTab,v=>buildTab=v);const grid=el('div','st-cards');body.append(grid);
  if(buildTab==='murs'){for(const t of D.TOOLS){const b=card(t.name,t.price?eur(t.price)+(t.id==='wall'?' / m':''):'');b.onclick=()=>{sfx('click');startTool(t.id)};grid.append(b)}return}
  if(buildTab==='parking'){for(const [id,name,price,sub] of [['walk','Trottoir',E.GROUND_COST[3],'Chemin des piétons (1 de large)'],['cross','Passage piéton',E.GROUND_COST[4],'Traverser une route'],['yield','Cédez le passage',E.GROUND_COST[5],'Les voitures y laissent passer'],['oneway','Sens unique',E.GROUND_COST[6],'Circulation en boucle, évite les bouchons'],['asphalt','Goudron',E.GROUND_COST[1],'Sol des places, piétons'],['road','Route',E.GROUND_COST[2],'Voitures et camions (3 de large)']]){const b=card(name,eur(price)+' / m²',sub);b.onclick=()=>{sfx('click');startTool(id)};grid.append(b)}}
  if(buildTab==='agrandir'){const b=card('Agrandir le magasin',eur(D.EXTEND.perM2)+' / m²','Sol et murs compris');b.onclick=()=>{sfx('click');startTool('extend')};grid.append(b);
   body.append(el('p','st-note',`Surface : ${E.area(S)} m² · vente ${E.salesArea(S)} m²`));return}
  for(const d of D.ITEMS.filter(i=>i.tab===buildTab)){const sub=d.kind==='spot'?'+ clients en voiture':d.kind==='bus'?'Un bus amène des clients':d.kind==='corral'?'Caddies : paniers plus gros':d.kind==='sale'||d.kind==='counter'||d.kind==='reserve'?`${d.cap} articles`:d.attract?'+ attractif':d.security?'− vols':d.clean?'− saleté':'';
   const b=card(d.name,eur(d.price),sub,d.w+'×'+d.d);b.onclick=()=>{sfx('click');startItem(d.id)};grid.append(b)}}
 function card(t,p,sub,size){const b=el('button','st-card');b.append(el('b',null,t));if(size)b.append(el('i',null,size));b.append(el('span',null,p));if(sub)b.append(el('small',null,sub));return b}
 function pStock(){const body=head('Stock',[['stock','Stock'],['stats','Statistiques'],['avis','Avis']],stockTab,v=>stockTab=v);({stock:stockList,stats:stockStats,avis:opinions})[stockTab](body)}
 const cn=k=>D.CAT[k]?D.CAT[k].name.toLowerCase():k;
 const PHRASES={rupture:k=>['Il n’y a plus de '+cn(k)+' !',-2],notsold:k=>['Dommage, pas de '+cn(k)+' ici.',-1],cher:k=>['Le rayon '+cn(k)+' est trop cher.',-2],cheap:k=>['Les prix '+cn(k)+' sont intéressants.',1],
  counter:k=>['J’adore le comptoir '+cn(k)+' !',2],queue:()=>['La queue aux caisses est interminable.',-2],dirt:()=>['C’est sale par terre…',-2],happy:()=>['Super magasin, je reviendrai !',2],decor:()=>['C’est joli et agréable ici.',1],
  noparking:()=>['Impossible de se garer !',-2],nocart:()=>['Il n’y a même pas de caddies.',-1],nocheckout:()=>['Aucune caisse ouverte !',-2]};
 function opinions(body){const list=E.thoughts(S);if(!list.length){body.append(el('p','st-note','Ouvre le magasin pour entendre tes clients.'));return}
  const box=el('div','st-opinions'),max=list[0][1];
  for(const [key,n] of list.slice(0,14)){const [k,cat]=key.split(':'),f=PHRASES[k];if(!f)continue;const [txt,mood]=f(cat);
   const r=el('div','st-op '+(mood>0?'good':mood<-1?'bad':'meh'));r.append(el('span','st-op-face',mood>0?'😊':mood<-1?'😠':'😕'),el('span','st-op-txt',txt));const m=el('i');const u=el('u');u.style.width=n/max*100+'%';m.append(u);r.append(m,el('b',null,String(n)));box.append(r)}
  body.append(el('p','st-note','Ce que disent tes clients ces 7 derniers jours.'),box)}
 function stockList(body){const bud=el('div','st-budget'),step=v=>v<2000?50:250;
  bud.append(el('span',null,'Budget max / jour'),btn('−',()=>{S.budget=Math.max(0,S.budget-step(S.budget-1));renderPanel()}),el('b',null,eur(S.budget)),btn('+',()=>{S.budget+=step(S.budget);renderPanel()}));body.append(bud);
  const fl=el('div','st-budget'),fill=Math.round((S.fill??1)*100);fl.append(el('span',null,'Remplir la réserve à'),btn('−',()=>{S.fill=Math.max(.5,Math.round(((S.fill??1)-.1)*10)/10);renderPanel()}),el('b',null,fill+' %'),btn('+',()=>{S.fill=Math.min(1,Math.round(((S.fill??1)+.1)*10)/10);renderPanel()}));body.append(fl);
  body.append(el('p','st-note','Chaque livraison complète seulement ce qui manque, pour que la réserve suive tes % (en volume). Le budget est un plafond.'));
  // ce qui manque, ce qui est en trop, quoi commander
  const plan=E.stockPlan(S),dj=v=>v>=99?'—':v.toFixed(1).replace('.',',')+' j',rows=Object.entries(plan.rows),pick=st=>rows.filter(([,r])=>r.st===st).sort((a,b)=>a[1].days-b[1].days);
  const box=el('div','st-plan');box.append(el('b','st-plan-h','À commander'));
  const line=(cls,label,list)=>{if(!list.length)return;const r=el('p','st-pl '+cls);r.append(el('i'),el('span',null,label+' '),el('em',null,list.join(', ')));box.append(r)};
  line('miss','Il en manque :',pick('missing').map(([c,r])=>`${cn(c)} (${dj(r.days)})`));
  line('short','Part trop faible :',pick('short').map(([c,r])=>`${cn(c)} (objectif ${Math.round(r.target)}, vend ${Math.round(r.perDay)} / j)`));
  line('over','Trop de stock :',pick('over').reverse().map(([c,r])=>`${cn(c)} (${dj(r.days)})`));
  line('want','Demandés, pas en rayon :',plan.wanted.slice(0,5).map(([c,n])=>`${cn(c)} (${n} clients)`));
  if(box.children.length===1)box.append(el('p','st-pl ok','Stock équilibré : rien à signaler.'));
  if(plan.est)box.append(el('p','st-note','Estimation avant la première journée d’ouverture.'));
  if(plan.low){const r=el('p','st-pl miss');r.append(el('i'),el('span',null,'Budget trop bas : les livraisons ne remplissent pas tout.'));box.append(r)}
  const adv=el('div','st-plan-row');adv.append(el('span',null,`Budget conseillé : ${eur(plan.budget)} / jour`));
  adv.append(btn('Appliquer',()=>{const why=E.applyPlan(S);if(why){msg(why);sfx('error')}else{sfx('click');toast('Budget et % mis à jour')}renderPanel()},'st-small'+(Math.abs(plan.budget-S.budget)>S.budget*.1?' on':'')));box.append(adv);
  if(plan.rushCost)box.append(btn(`🚚 Commander le manquant · ${eur(plan.rushCost)}`,()=>{const r=E.express(S,0,R,plan.rush);if(typeof r==='string'){msg(r);sfx('error')}else{toast('Camion en route : '+eur(r.cost));sfx('truck');save()}renderPanel()},'st-small wide'));
  body.append(box);
  body.append(row(btn('Livraison express +15 %',()=>{const r=E.express(S,S.budget,R);if(typeof r==='string'){msg(r);sfx('error')}else{toast('Camion en route : '+eur(r.cost));sfx('truck');save()}renderPanel()},'st-small wide'),
   btn('% par défaut',()=>{S.alloc=E.allocFor(S);renderPanel()},'st-small wide')));
  const tot=D.CATS.reduce((t,k)=>t+(S.alloc[k.id]||0),0)||1,pop=E.popularity(S),TAG={hot:['Populaire','hot'],cold:['Impopulaire','cold'],empty:['Vide','empty'],missing:['Manque','empty'],short:['Part faible','warn'],over:['Trop','cold']};
  const tbl=el('div','st-cats');tbl.append(row(el('span','st-h','Rayon'),el('span','st-h','Part'),el('span','st-h','Marge'),el('span','st-h','Stock')));
  // rayons présents d'abord ; ceux qu'on ne vend pas, en grisé à la fin
  for(const k of D.CATS.filter(c=>plan.rows[c.id]).concat(D.CATS.filter(c=>!plan.rows[c.id]))){const p=pop[k.id],pl=plan.rows[k.id],name=el('span','st-cn');const nb=el('b',null,k.name);
   const tg=p.tag==='empty'?'empty':pl&&pl.st!=='ok'?pl.st:p.tag;if(tg){nb.append(el('em','st-tag '+TAG[tg][1],TAG[tg][0]))}
   name.append(nb,el('small',null,E.price(S,k.id).toFixed(2).replace('.',',')+' €'+(pl?` · vend ${Math.round(pl.perDay)} / j · objectif ${Math.round(pl.target)}`:'')));
   const al=el('span','st-step');al.append(btn('−',()=>{S.alloc[k.id]=Math.max(0,(S.alloc[k.id]||0)-1);renderPanel()}),el('b',null,Math.round((S.alloc[k.id]||0)/tot*100)+' %'),btn('+',()=>{S.alloc[k.id]=(S.alloc[k.id]||0)+1;renderPanel()}));
   const mg=el('span','st-step'+(S.margin[k.id]>k.ref+5?' high':S.margin[k.id]<k.ref-5?' low':''));mg.append(btn('−',()=>{S.margin[k.id]=Math.max(0,S.margin[k.id]-2);renderPanel()}),el('b',null,S.margin[k.id]+' %'),btn('+',()=>{S.margin[k.id]=Math.min(120,S.margin[k.id]+2);renderPanel()}));
   const sk=el('span','st-stk'+(pl?' '+pl.st:p.tag==='empty'?' missing':''));sk.append(el('span',null,`${p.shelf} / ${p.reserve}`));if(pl)sk.append(el('small',null,dj(pl.days)));
   const rw=row(name,al,mg,sk);if(!pl)rw.classList.add('st-off');tbl.append(rw)}
  body.append(tbl)}
 function stockStats(body){const st=E.stats(S),h=S.history.slice(-30);
  if(!st.days){body.append(el('p','st-note','Les statistiques apparaissent après la première journée d’ouverture.'))}
  const g=el('div','st-tiles');
  g.append(tile('Satisfaction',st.sat==null?'—':Math.round(st.sat)+' / 100'),tile('Clients / jour',st.days?String(Math.round(st.customers)):'—'),tile('Panier moyen',st.days?eur(st.basket):'—'),tile('Articles / panier',st.days?st.items.toFixed(1).replace('.',','):'—'),
   tile('Ventes / jour',st.days?Math.round(st.units)+' art.':'—'),tile('En rayon',`${st.shelf} / ${st.shelfCap}`,st.shelfCap?Math.round(st.shelf/st.shelfCap*100)+' %':''),tile('Pertes / jour',st.days?eur(st.loss):'—'),tile('Vols / jour',st.days?eur(st.theft):'—'));
  body.append(g);
  body.append(el('b','st-sub','Réserves'));for(const k of ['ambiant','frais','surgele']){const r=el('div','st-cap'),f=st.cap.cap[k]?Math.min(1,st.cap.used[k]/st.cap.cap[k]):0;r.append(el('span',null,D.STORES[k]));const m=el('i'),u=el('u');u.style.width=f*100+'%';m.append(u);r.append(m,el('small',null,st.cap.cap[k]?`${st.cap.used[k]} / ${st.cap.cap[k]}`:'—'));body.append(r)}
  if(st.days){body.append(el('b','st-sub','Mécontentement (pour 100 clients)'));body.append(bars([['Rayon vide',st.rupture,'#d9534f'],['Trop cher',st.expensive,'#e0a23a'],['Pas vendu ici',st.notSold,'#9aa38f'],['Caisse',st.angry,'#7b61c9']],v=>Math.round(v)+''))}
  body.append(chart(h.map(d=>d.sat),{line:true,color:'#3f7fcf',label:'Satisfaction (30 jours)'}),chart(h.map(d=>d.customers),{color:'#7cb069',label:'Clients par jour'}))}
 function pTeam(){const body=head('Équipe · '+eur(E.salaries(S))+' / mois');
  for(const r of D.ROLES){const n=S.staff[r.id]||0,name=el('span','st-cn');name.append(el('b',null,r.name),el('small',null,eur(r.salary)+' / mois'));
   const st=el('span','st-step');st.append(btn('−',()=>{E.hire(S,r.id,-1);E.syncStaff(S,R);renderPanel()}),el('b',null,String(n)),btn('+',()=>{const why=E.hire(S,r.id,1);if(why){msg(why);sfx('error')}else E.syncStaff(S,R);renderPanel()}));
   body.append(row(name,st))}
  const ck=S.items.filter(o=>o.t==='checkout').length,man=S.items.filter(o=>o.t==='checkout'&&E.manned(S,o)).length;
  body.append(el('p','st-note',`Caisses tenues : ${man} / ${ck}`))}
 function pMoney(){const body=head('Compta',[['tresor','Trésorerie'],['in','Rentrées'],['out','Dépenses'],['cash','Banque']],moneyTab,v=>moneyTab=v);const h=S.history.slice(-30),m=S.month;
  if(moneyTab==='tresor')return treasury(body);
  if(moneyTab==='in'){body.append(chart(h.map(d=>d.profit),{label:'Bénéfice par jour',fmt:eur}));
   const g=el('div','st-tiles');const y=h[h.length-1];g.append(tile('CA hier',y?eur(y.rev):'—'),tile('CA du mois',eur(m.rev)),tile('Bénéfice 30 j',eur(h.reduce((t,d)=>t+d.profit,0))),tile('Clients attendus',E.attraction(S).perDay+' / j'));body.append(g);
   const mc=S.monthCat||{},list=D.CATS.map(k=>[k.name,mc[k.id]||0]).filter(i=>i[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,8);
   if(list.length){body.append(el('b','st-sub','Ventes du mois par rayon'),bars(list.map(i=>[i[0],i[1],'#5aa36a'])))}}
  if(moneyTab==='out'){body.append(chart(h.map(d=>d.buy+d.fixed+d.ads),{color:'#e0a23a',label:'Dépenses par jour',fmt:eur}));
   const dm=E.dayOfMonth(S)-1,pr=v=>v*dm/D.DAYS_PER_MONTH;
   body.append(el('b','st-sub','Ce mois-ci'),bars([['Marchandises',m.buy,'#e0a23a'],['Salaires',pr(E.salaries(S)),'#3f7fcf'],['Électricité',pr(E.electricity(S)),'#f5c542'],['Crédit',pr(S.loan.left>0?S.loan.monthly:0),'#7b61c9'],['Publicité',m.ads,'#e5603f'],['Travaux',m.build,'#9aa38f']]));
   body.append(el('b','st-sub','Perdu'),bars([['Périmés',m.loss,'#d9534f'],['Vols',m.theft,'#d9534f']]));
   body.append(el('p','st-note',`Charges fixes : ${eur(E.salaries(S)+E.electricity(S)+(S.loan.left>0?S.loan.monthly:0))} / mois`))}
  if(moneyTab==='cash'){
   const g=el('div','st-tiles');g.append(tile('Trésorerie',eur(S.cash)),tile('Crédit restant',eur(S.loan.left)),tile('Mensualité',eur(S.loan.monthly)),tile('Réputation',Math.round(S.rep)+' / 100'));body.append(g);
   body.append(el('b','st-sub','Publicité'+(S.ads.until>=S.d?` · jusqu’au jour ${S.ads.until}`:'')));
   const ads=el('div','st-row');for(const ad of D.ADS)ads.append(btn(`${ad.name} ${eur(ad.price)} · +${Math.round(ad.boost*100)} % ${ad.days} j`,()=>c.dialog(ad.name+' ?',eur(ad.price),'Lancer',()=>{E.advertise(S,ad.id);sfx('coin');toast(ad.name+' lancée !');renderPanel()},'Annuler',()=>{}),'st-small wide'));body.append(ads);
   body.append(el('b','st-sub','Banque'),row(btn(`Emprunter ${eur(D.EXTRA_LOAN.amount)} · +${eur(D.EXTRA_LOAN.monthly)}/mois`,()=>c.dialog('Nouvel emprunt ?',`+${eur(D.EXTRA_LOAN.amount)} · +${eur(D.EXTRA_LOAN.monthly)}/mois`,'Emprunter',()=>{E.borrow(S);sfx('coin');save();renderPanel()},'Annuler',()=>{}),'st-small wide')));
   if(S.reports?.length){body.append(el('b','st-sub','Mois précédents'),bars(S.reports.slice(-6).map(r=>['Mois '+r.month,r.result,r.result<0?'#d9534f':'#5aa36a'])))}}}
 // ---- trésorerie : jours rentables ou non, dans le temps
 function treasury(body){const st=E.cashStats(S,cashSpan),sg=v=>(v>0?'+':'')+eur(v);
  const top=el('div','st-cash-top');const t=el('div','st-cash-today '+(st.today>=0?'up':'down'));t.append(el('small',null,'Aujourd’hui (en cours)'),el('b',null,sg(st.today)));
  const c2=el('div','st-cash-today');c2.append(el('small',null,'En caisse'),el('b',null,eur(S.cash)));top.append(t,c2);body.append(top);
  const chips=el('div','st-chips');for(const [n,l] of [[7,'7 jours'],[30,'30 jours'],[90,'90 jours'],[0,'Tout']])chips.append(btn(l,()=>{cashSpan=n;renderPanel()},'st-chip'+(cashSpan===n?' on':'')));body.append(chips);
  if(!st.n){body.append(el('p','st-note','Les graphiques apparaissent après la première journée.'));return}
  // verdict en une phrase
  const v=el('p','st-verdict '+(st.avg>=0?'up':'down'),st.avg>=0?`Tu gagnes de l’argent : ${sg(Math.round(st.avg))} par jour en moyenne.`:`Tu perds de l’argent : ${sg(Math.round(st.avg))} par jour en moyenne.`);body.append(v);
  body.append(dayBars(st));
  {const adv=E.advice(S),box=el('div','st-advice');box.append(el('b',null,'Conseils'));
   if(!adv.length)box.append(el('p',null,'Rien à signaler : continue comme ça.'));
   for(const x of adv){const r=el('p');r.append(el('i',null,x.ico),el('span',null,x.t));box.append(r)}body.append(box)}
  const g=el('div','st-tiles');
  g.append(tile('Jours rentables',`${st.good} / ${st.n}`,Math.round(st.good/st.n*100)+' %'),tile('Bénéfice total',sg(st.sum)),
   tile('Meilleur jour',sg(st.best),'jour '+st.bestDay),tile('Pire jour',sg(st.worst),'jour '+st.worstDay),
   tile('Série en cours',st.streak>0?`${st.streak} j dans le vert`:`${-st.streak} j dans le rouge`),tile('Moyenne / jour',sg(Math.round(st.avg))));body.append(g);
  if(st.n>=14){const wk=[];for(let i=0;i<st.n;i+=7){const p=st.profit.slice(i,i+7);wk.push(p.reduce((a,b)=>a+b,0))}body.append(chart(wk,{label:'Par semaine',fmt:eur}))}
  body.append(chart(st.cash,{line:true,color:'#406c47',label:'Argent en caisse',fmt:eur,zero:false}))}
 // barres par jour : vert = jour rentable, rouge = jour à perte ; pointillés = moyenne
 function dayBars(st){const box=el('div','st-chart st-bars2');box.append(el('b',null,'Bénéfice par jour'));
  const W=300,H=120,pad=6,v=st.profit,max=Math.max(1,...v),min=Math.min(0,...v),span=max-min||1,y=t=>pad+(max-t)/span*(H-2*pad),bw=W/Math.max(v.length,7);
  const s=document.createElementNS(SVG,'svg');s.setAttribute('viewBox',`0 0 ${W} ${H}`);s.setAttribute('preserveAspectRatio','none');
  const add=(tag,a)=>{const e=document.createElementNS(SVG,tag);for(const k in a)e.setAttribute(k,a[k]);s.append(e);return e};
  if(min<0)add('rect',{x:0,y:y(0),width:W,height:H-pad-y(0)+pad,fill:'#fbe9e6'});
  v.forEach((t,i)=>add('rect',{x:i*bw+bw*.1,width:Math.max(1,bw*.8),y:Math.min(y(t),y(0)),height:Math.max(1.5,Math.abs(y(t)-y(0))),rx:Math.min(2,bw*.2),fill:t<0?'#d9534f':'#4f9d5d'}));
  add('line',{x1:0,x2:W,y1:y(0),y2:y(0),stroke:'#8d8676','stroke-width':1.2});
  add('line',{x1:0,x2:W,y1:y(st.avg),y2:y(st.avg),stroke:st.avg<0?'#a33':'#2f6b3a','stroke-width':1,'stroke-dasharray':'4 3'});
  const leg=el('div','st-chart-leg');leg.append(el('span',null,'jour '+st.days[0]),el('span',null,'▬ vert : rentable · ▬ rouge : à perte'),el('span',null,'jour '+st.days[st.days.length-1]));
  box.append(s,leg);return box}
 function pItem(){const it=S.items.find(o=>o.id===sel);if(!it){closePanel();return}const d=D.ITEM[it.t];const body=head(d.name);
  if(d.cap&&d.kind!=='reserve'){const f=Math.min(1,it.stock/d.cap),r=el('div','st-cap');const m=el('i'),u=el('u');u.style.width=f*100+'%';m.append(u);r.append(el('span',null,'En rayon'),m,el('small',null,it.stock+' / '+d.cap));body.append(r)}
  if(d.kind==='reserve'){const cap=E.capacity(S),r=el('div','st-cap'),f=cap.cap[d.store]?cap.used[d.store]/cap.cap[d.store]:0;const m=el('i'),u=el('u');u.style.width=Math.min(1,f)*100+'%';m.append(u);r.append(el('span',null,D.STORES[d.store]),m,el('small',null,`${cap.used[d.store]} / ${cap.cap[d.store]}`));body.append(r)}
  if(it.cat&&(d.kind==='sale'||d.kind==='counter')){
   body.append(row(btn(it.urgent?'🚨 Urgence en cours…':'🚨 Remplir en urgence',()=>{E.urgent(S,it.id,!it.urgent);renderPanel()},'st-small wide'+(it.urgent?' on':'')),
    btn('📦 Commander '+D.CAT[it.cat].name.toLowerCase(),()=>{const r=E.expressCat(S,it.cat,R);if(typeof r==='string'){msg(r);sfx('error')}else{toast('Camion en route : '+eur(r.cost));sfx('truck')}renderPanel()},'st-small wide')))}
  if(d.cats&&d.cats.length>1){const chips=el('div','st-chips');for(const k of d.cats){chips.append(btn(D.CAT[k].name,()=>{E.setCat(S,it.id,k);renderPanel()},'st-chip'+(it.cat===k?' on':'')))}body.append(chips)}
  if((d.kind==='checkout'||d.kind==='counter')&&!E.manned(S,it))body.append(el('p','st-note warn',d.kind==='checkout'?'Pas de caissier·ère':'Comptoir fermé : embauche un·e '+D.ROLES.find(r=>r.needs===it.t).name.toLowerCase()));
  body.append(row(btn('✥ Déplacer',()=>startMove(it.id),'st-small wide'),btn('↻ Tourner',()=>{const why=E.rotateItem(S,it.id);if(why){msg(why);sfx('error')}renderPanel()},'st-small wide'),btn('Vendre '+eur(d.price*D.REFUND),()=>{const lost=E.reserveLoss(S,it.id),go=()=>{E.removeItem(S,it.id);sfx('erase');sel=null;closePanel()};if(lost)c.dialog('Vendre ?',lost+' articles de la réserve seront perdus.','Vendre',go,'Annuler',()=>{});else go()},'st-small wide danger')))}
 function pReport(){const r=pending;if(!r){closePanel();return}const m=r.report;const body=head(r.over?'Faillite':'Bilan du mois '+m.month);
  const t=el('div','st-lines');for(const [k,v] of [['Clients',String(m.customers)],['Satisfaction',m.avgSat==null?'—':Math.round(m.avgSat)+' / 100'],['Chiffre d’affaires',eur(m.rev)],['Achats',eur(-m.buy)],['Salaires',eur(-m.salaries)],['Électricité',eur(-m.elec)],['Crédit',eur(-m.loan)],['Agios',eur(-m.interest)],['Publicité',eur(-m.ads)],['Résultat',eur(m.result)],['Travaux',eur(-m.build)],['Trésorerie',eur(m.cash)]]){if(v===eur(-0)||v==='−0 €')continue;const d=el('div',k==='Résultat'?'st-total '+(m.result<0?'neg':'pos'):'');d.append(el('span',null,k),el('b',null,v));t.append(d)}
  body.append(t);
  body.append(btn(r.over?'Nouvelle partie':'Continuer',()=>{if(r.over){clearRun(KEY);S=E.starter(E.withDirt(E.newGame()));R=E.runtime();staticKey='';isNew=true;home()}pending=null;hold=false;closePanel();if(isNew){isNew=false;openPanel('welcome');hold=true}},'primary'))}
 function pWelcome(){const body=head('Bienvenue dans ton magasin !');
  for(const t of ['Tu as déjà des rayons d’épicerie remplis, deux caisses, une réserve et un quai. Ajoute frais, surgelés et rayons à la coupe pour attirer plus de clients.','Embauche ton équipe, règle ton budget d’achat et tes marges.','Ouvre le magasin ! Fin de mois : salaires, électricité et crédit.'])body.append(el('p','st-step-txt',t));
  body.append(btn('C’est parti',()=>{hold=false;closePanel()},'primary'))}

 // ---- messages
 function msg(t){c.hint(t)}
 function toast(t){const d=el('div','st-t',t);toastBox.append(d);setTimeout(()=>d.remove(),3800);while(toastBox.children.length>3)toastBox.firstChild.remove()}
 function handleEvents(){for(const e of R.events.splice(0)){
  if(e.t==='pay'){floats.push({x:e.x,z:e.y,y:2,txt:'+'+Math.round(e.v)+' €',col:'#2f8a45',life:1.4});sfx('cash',.18)}
  if(e.t==='bubble'){const a=R.agents.find(o=>o.id===e.id);if(a){floats.push({x:a.x,z:a.y,y:2.2,txt:e.txt,col:e.txt==='€'?'#b8860b':'#c62f2f',life:1.6,big:true});sfx('bad',1.2)}}
  if(e.t==='bus'&&e.n)sfx('horn',3);
  if(e.t==='truck')sfx('truck');if(e.t==='delivery'&&e.cost)toast('Livraison reçue : '+eur(e.cost));if(e.t==='noroad')toast('Le camion ne peut pas atteindre le quai : construis une route.');
  if(e.t==='night'){const d=e.day;toast(`Jour ${d.d} · ${d.customers} clients · ${eur(d.rev)}`);sfx('night');save()}
  if(e.t==='month'){pending=e;hold=true;openPanel('report');sfx('month');save()}}}

 // ---- sauvegarde
 function save(){try{if(!S.over)saveRun(KEY,E.serialize(S,R))}catch{}}
 // écouteurs directs : l'appli se met en pause en passant en arrière-plan, la sauvegarde doit se faire quand même
 const onHide=()=>{if(document.hidden)save()};document.addEventListener('visibilitychange',onHide);window.addEventListener('pagehide',save);
 // panneaux ouverts : les chiffres suivent la partie en temps réel (sauf pendant un appui, pour ne pas manquer le bouton)
 const LIVE=new Set(['stock','money','team','item','build']);let liveT=0,press=false;
 let scrolled=0;sheet.addEventListener('pointerdown',()=>{press=true});sheet.addEventListener('scroll',()=>{scrolled=performance.now()},true);const unpress=()=>{press=false};window.addEventListener('pointerup',unpress);window.addEventListener('pointercancel',unpress);

 // ---- rendu
 function resize(){const w=wrap.clientWidth,h=wrap.clientHeight,dpr=Math.min(2,window.devicePixelRatio||1);if(!w||!h)return;
  if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(h*dpr)){cv.width=ov.width=Math.round(w*dpr);cv.height=ov.height=Math.round(h*dpr)}cam.w=w;cam.h=h}
 c.listen(window,'resize',resize);
 let doorWas=0;
 function draw(dt){resize();time+=dt;frameDt=dt;
  if(Math.abs(cam.yaw-cam.yawTo)>1e-3){cam.yaw+=(cam.yawTo-cam.yaw)*Math.min(1,dt*10);if(Math.abs(cam.yaw-cam.yawTo)<.002)cam.yaw=cam.yawTo}
  const v=view(),key=[cam.yaw.toFixed(3),v.zones,S._L?1:0].join();lastStatic+=dt;
  if(key!==staticKey||!S._L||lastStatic>.5){E.layout(S);staticKey=key;lastStatic=0;buildStatic(Bs,S,v);ren.upload('static',Bs.d,Bs.n)}
  buildAgents(Ba,S,R,v,time);ren.upload('agents',Ba.d,Ba.n);
  if(R.door>.5&&doorWas<=.5)sfx('door',2.5);doorWas=R.door||0;
  // contour de l'objet sélectionné
  const it=sel&&S.items.find(o=>o.id===sel);Bsel.reset();Bsel.setYaw(cam.yaw);if(it)itemModel(Bsel,S,it,v);ren.upload('sel',Bsel.d,Bsel.n);
  const M=viewProj(cam);ren.frame(M,[['static'],['access'],['agents'],['ghost',ghostTint]],it&&!mode?'sel':null);
  // bulle ✕ / ✓ au-dessus de l'aperçu
  if(anchor&&!pop.hidden){const [px,py]=project(M,cam,...anchor);pop.style.left=Math.max(40,Math.min(cam.w-40,px))+'px';pop.style.top=Math.max(50,Math.min(cam.h-60,py))+'px'}
  // icônes : rayons vides, bulles, encaissements
  const dpr=cv.width/cam.w;g2.setTransform(dpr,0,0,dpr,0,0);g2.clearRect(0,0,cam.w,cam.h);g2.textAlign='center';g2.textBaseline='middle';
  // rayons vides ou presque : rouge = plus rien en réserve (il faut commander), orange = vide mais la réserve en a (l'équipe va remplir), jaune = presque vide
  for(const o of S.items){const d=D.ITEM[o.t];if(!o.cat||!d.cap||d.kind==='reserve'||o.stock>=d.cap*.25)continue;if(d.kind==='counter'&&!E.manned(S,o))continue;const [w,dd]=E.size(o),[px,py]=project(M,cam,o.x+w/2,d.h+.6,o.y+dd/2);
   const res=S.reserve[o.cat]>0,s=1+Math.sin(time*5+o.id)*.08;
   if(o.stock>0){g2.fillStyle='#f0b429';g2.beginPath();g2.arc(px,py,4.5,0,7);g2.fill();continue}
   const lab=res?'À remplir':'Réserve vide',col=res?'#e8892b':'#d93a30';g2.font='bold 9px sans-serif';const tw=g2.measureText(lab).width+20;
   g2.fillStyle=col;g2.beginPath();g2.roundRect?g2.roundRect(px-tw/2,py-8*s,tw,16*s,8):g2.rect(px-tw/2,py-8,tw,16);g2.fill();g2.fillStyle='#fff';g2.fillText((res?'! ':'📦 ')+lab,px,py+.5)}
  const tk=R.truck;if(tk&&tk.st==='unload'&&tk.total>0){const [px,py]=project(M,cam,tk.x,4.4,tk.z),k=Math.min(1,tk.done/tk.total),w=64;
   g2.fillStyle='#fffaf1e6';g2.beginPath();g2.roundRect?g2.roundRect(px-w/2-4,py-13,w+8,22,7):g2.rect(px-w/2-4,py-13,w+8,22);g2.fill();g2.fillStyle='#e6e1d3';g2.fillRect(px-w/2,py+1,w,5);g2.fillStyle='#5aa36a';g2.fillRect(px-w/2,py+1,w*k,5);
   g2.fillStyle='#27453c';g2.font='bold 9px sans-serif';g2.fillText(S.staff.rayon?'Déchargement '+Math.round(k*100)+' %':'Personne pour décharger !',px,py-5)}
  for(const f of floats){f.life-=dt;f.y+=dt*.8;const [px,py]=project(M,cam,f.x,f.y,f.z);g2.globalAlpha=Math.max(0,Math.min(1,f.life));g2.font=(f.big?'bold 15px':'bold 11px')+' sans-serif';g2.fillStyle=f.col;g2.fillText(f.txt,px,py)}
  g2.globalAlpha=1;floats=floats.filter(f=>f.life>0);if(floats.length>60)floats.splice(0,floats.length-60)}
 function hudUpdate(){const n=R.agents.filter(a=>a.k==='c').length;info.textContent=`★ ${Math.round(S.rep)} · ${n} 🛒`;
  c.setBar('TRÉSORERIE',eur(S.cash),'MOIS '+E.monthOf(S)+' · JOUR '+E.dayOfMonth(S),E.hourLabel(S))}

 // ---- démarrage
 if(isNew){openPanel('welcome');hold=true}
 c.hint(isNew?'':E.problems(S)[0]||'');resize();hudUpdate();
 let hintT=0;
 return {
  update(dt){if(!hold&&!S.over){const total=dt*D.SPEEDS[speedIdx],n=Math.ceil(total/.05);for(let k=0;k<n;k++)E.step(S,R,total/n);handleEvents()}
   draw(dt);hudUpdate();if((hintT+=dt)>2&&!mode){hintT=0;const p=E.problems(S);c.hint(p[0]||(S.open&&E.advice(S).find(x=>x.ico!=='📉')?.t)||'')}
   if(panel&&LIVE.has(panel)&&!press&&!hold&&(liveT+=dt)>.5&&performance.now()-scrolled>600){liveT=0;renderPanel()}
   if((saveT+=dt)>20){saveT=0;save()}},
  key(k){if(k==='Escape'){if(mode)stopMode();else closePanel()}if(k==='r'&&mode?.kind==='item'){mode.r=(mode.r+1)%4;updatePlace()}},
  destroy(){save();document.removeEventListener('visibilitychange',onHide);window.removeEventListener('pagehide',save);window.removeEventListener('pointerup',unpress);window.removeEventListener('pointercancel',unpress)}}
}
