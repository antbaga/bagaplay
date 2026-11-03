// BagaStore : jeu de gestion de supermarché en 3D (vue 3/4). Interface : construction, stock, équipe, compta.
import * as D from './store-data.js';
import * as E from './store-engine.js';
import {createRenderer,camera,viewProj,project,ground,Builder} from './store-gl.js';
import {buildStatic,buildAgents,buildGhost,COLORS} from './store-models.js';
import {savedRun,saveRun,clearRun} from './runs.js';

const KEY='bagastore';
const eur=v=>(v<0?'−':'')+Math.round(Math.abs(v)).toLocaleString('fr-FR').replace(/ | /g,' ')+' €';
const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e};

export function bagastore(c){
 let S=(!c.fresh&&E.load(savedRun(KEY)))||null,isNew=!S;if(!S)S=E.withDirt(E.newGame());let R=E.runtime();
 // ---- éléments
 const wrap=el('div','st-wrap');c.board.append(wrap);
 const cv=el('canvas','st-gl'),ov=el('canvas','st-ov');wrap.append(cv,ov);const g2=ov.getContext('2d');
 const hud=el('div','st-hud');const info=el('div','st-info');const camBox=el('div','st-cam');hud.append(info,camBox);wrap.append(hud);
 const sheet=el('div','st-sheet');sheet.hidden=true;wrap.append(sheet);
 const bar=el('div','st-place');bar.hidden=true;wrap.append(bar);
 const toastBox=el('div','st-toast');wrap.append(toastBox);
 const ren=createRenderer(cv);
 if(!ren){wrap.append(el('p','st-nogl','La 3D (WebGL) n’est pas disponible sur cet appareil.'));return {}}
 const cam=camera();cam.tx=(S.b.x0+S.b.x1)/2;cam.tz=(S.b.y0+S.b.y1)/2+2;cam.zoom=16;
 const Bs=new Builder(1<<17),Ba=new Builder(1<<14),Bg=new Builder(1<<12);
 let mode=null,sel=null,panel=null,speedIdx=0,hold=false,lastStatic=-1,staticKey='',time=0,saveT=0,floats=[],pending=null;
 const view=()=>{const s=Math.sin(cam.yawTo),k=Math.cos(cam.yawTo);return {yaw:cam.yaw,near:{S:k>.3,N:k<-.3,E:s>.3,W:s<-.3},sel,zones:!!mode}};

 // ---- boutons de caméra
 for(const [t,a,fn] of [['⟲','Tourner la vue à gauche',()=>{cam.yawTo-=Math.PI/2}],['⟳','Tourner la vue à droite',()=>{cam.yawTo+=Math.PI/2}],['+','Zoomer',()=>zoom(.8)],['−','Dézoomer',()=>zoom(1.25)],['⌂','Recentrer',()=>{cam.tx=(S.b.x0+S.b.x1)/2;cam.tz=(S.b.y0+S.b.y1)/2+2;cam.zoom=16}]]){
  const b=el('button','st-cbtn',t);b.setAttribute('aria-label',a);c.listen(b,'click',fn);camBox.append(b)}
 const zoom=k=>{cam.zoom=Math.max(4,Math.min(34,cam.zoom*k))};

 // ---- barre d'outils
 c.controls.innerHTML='';
 const tb=(icon,label,fn)=>{const b=c.button('',fn,'st-tool',label);b.innerHTML=`<span>${icon}</span><small>${label}</small>`;return b};
 tb('🏗️','Construire',()=>openPanel('build'));tb('📦','Stock',()=>openPanel('stock'));tb('👥','Équipe',()=>openPanel('team'));tb('💶','Compta',()=>openPanel('money'));
 const speedBtn=tb('▶','×1',()=>{speedIdx=(speedIdx+1)%D.SPEEDS.length;refreshBar()});
 const openBtn=tb('🔒','Fermé',()=>{S.open=!S.open;if(S.open&&!S.started){S.started=true}refreshBar();save()});
 function refreshBar(){speedBtn.querySelector('small').textContent='×'+D.SPEEDS[speedIdx];speedBtn.querySelector('span').textContent=['▶','⏩','⏩','⏭'][speedIdx];
  openBtn.querySelector('span').textContent=S.open?'🔓':'🔒';openBtn.querySelector('small').textContent=S.open?'Ouvert':'Fermé';openBtn.classList.toggle('on',S.open)}
 refreshBar();

 // ---- toucher : glisser = déplacer la vue, pincer = zoom, toucher = action
 const pts=new Map();let pinch=null,drag=null;
 c.listen(cv,'pointerdown',e=>{cv.setPointerCapture?.(e.pointerId);pts.set(e.pointerId,{x:e.offsetX,y:e.offsetY,x0:e.offsetX,y0:e.offsetY,t:performance.now()});
  if(pts.size===2){const [a,b]=[...pts.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),z:cam.zoom}}else{drag={moved:false}}});
 c.listen(cv,'pointermove',e=>{const p=pts.get(e.pointerId);if(!p)return;const px=p.x,py=p.y;p.x=e.offsetX;p.y=e.offsetY;
  if(pts.size>=2&&pinch){const [a,b]=[...pts.values()];cam.zoom=Math.max(4,Math.min(34,pinch.z*pinch.d/Math.max(20,Math.hypot(a.x-b.x,a.y-b.y))));if(drag)drag.moved=true;return}
  if(drag&&(drag.moved||Math.hypot(p.x-p.x0,p.y-p.y0)>8)){drag.moved=true;const g0=ground(cam,px,py),g1=ground(cam,p.x,p.y);cam.tx+=g0[0]-g1[0];cam.tz+=g0[1]-g1[1];clampCam()}});
 const up=e=>{const p=pts.get(e.pointerId);pts.delete(e.pointerId);if(pts.size<2)pinch=null;if(!p)return;
  if(drag&&!drag.moved&&pts.size===0&&performance.now()-p.t<500)tap(p.x,p.y);if(!pts.size)drag=null};
 c.listen(cv,'pointerup',up);c.listen(cv,'pointercancel',e=>{pts.delete(e.pointerId);drag=null;pinch=null});
 c.listen(cv,'wheel',e=>{e.preventDefault();zoom(e.deltaY>0?1.12:.89)},{passive:false});
 function clampCam(){cam.tx=Math.max(-5,Math.min(D.LOT_W+5,cam.tx));cam.tz=Math.max(-5,Math.min(D.LOT_H+5,cam.tz))}

 function tap(px,py){const [gx,gz]=ground(cam,px,py),x=Math.floor(gx),y=Math.floor(gz);
  if(mode?.kind==='item'){const d=D.ITEM[mode.t],[w,dd]=mode.r%2?[d.d,d.w]:[d.w,d.d],nx=x-Math.floor((w-1)/2),ny=y-Math.floor((dd-1)/2);
   if(mode.pos&&mode.pos[0]===nx&&mode.pos[1]===ny)return confirmPlace();mode.pos=[nx,ny];updatePlace();return}
  if(mode?.kind==='tool'){const t=mode.id;
   if(t==='door'){const why=E.makeDoor(S,x,y);msg(why||'Porte posée.');c.tone(!why);return}
   if(t==='erase'){mode.a=[x,y];mode.b=[x,y];updatePlace();return}
   if(!mode.a||mode.b){mode.a=[x,y];mode.b=null}else mode.b=[x,y];updatePlace();return}
  // sans outil : sélection d'un meuble
  const L=E.layout(S),id=E.inLot(x,y)?L.occ[E.idx(x,y)]:0;sel=id||null;if(sel)openPanel('item');else if(panel==='item')closePanel()}

 // ---- placement
 function startItem(t){mode={kind:'item',t,r:0,pos:null};closePanel();bar.hidden=false;updatePlace();msg('Touche le sol pour placer : '+D.ITEM[t].name+'. Touche deux fois ou ✓ pour valider.')}
 function startTool(t){mode={kind:'tool',id:t};closePanel();bar.hidden=false;updatePlace();msg(D.TOOLS.find(o=>o.id===t).hint)}
 function stopMode(){mode=null;bar.hidden=true;buildGhost(Bg,S,null,view());ren.upload('ghost',Bg.d,0);c.hint(E.problems(S)[0]||'')}
 function updatePlace(){bar.innerHTML='';let ok=false,why='',label='',cost=0;const g={};
  if(mode.kind==='item'){const d=D.ITEM[mode.t];label=d.name;cost=d.price;
   if(mode.pos){why=E.canPlace(S,mode.t,mode.pos[0],mode.pos[1],mode.r);ok=!why;g.item={t:mode.t,x:mode.pos[0],y:mode.pos[1],r:mode.r}}}
  else{const t=D.TOOLS.find(o=>o.id===mode.id);label=t.name;
   if(mode.id==='wall'&&mode.a){const b=mode.b||mode.a,cl=E.wallPlan(S,mode.a,b);g.cells=cl;g.h=1.3;cost=cl.length*D.WALL_COST;ok=!!mode.b&&cl.length>0;why=mode.b?'':'Touche la fin du mur.'}
   if((mode.id==='zoneR'||mode.id==='zoneS')&&mode.a){const b=mode.b||mode.a,o=[];for(let y=Math.min(mode.a[1],b[1]);y<=Math.max(mode.a[1],b[1]);y++)for(let x=Math.min(mode.a[0],b[0]);x<=Math.max(mode.a[0],b[0]);x++)if(E.inside(S,x,y))o.push([x,y]);g.cells=o;g.h=.06;ok=!!mode.b;why=mode.b?'':'Touche le coin opposé.'}
   if(mode.id==='erase'&&mode.a){const L=E.layout(S),i=E.idx(...mode.a),id=E.inLot(...mode.a)?L.occ[i]:0;
    if(id){const it=S.items.find(o=>o.id===id);g.cells=E.cells(it).map(k=>[k%D.LOT_W,k/D.LOT_W|0]);g.h=.3;label='Démolir : '+D.ITEM[it.t].name;cost=-Math.round(D.ITEM[it.t].price*D.REFUND);ok=true}
    else if(S.wall[i]){g.cells=[mode.a];g.h=1.4;cost=-Math.round(D.WALL_COST*D.REFUND);ok=true;label='Démolir le mur'}else why='Rien à démolir ici.'}}
  buildGhost(Bg,S,g,view());ren.upload('ghost',Bg.d,Bg.n);ghostTint=ok?[.3,.85,.4,.45]:[.95,.3,.25,.5];
  const name=el('div','st-place-name');name.append(el('b',null,label),el('small',null,cost?(cost>0?eur(cost):'+'+eur(-cost)):''));bar.append(name);
  if(mode.kind==='item'){const r=el('button','st-pbtn','↻');r.setAttribute('aria-label','Tourner');r.onclick=()=>{mode.r=(mode.r+1)%4;updatePlace()};bar.append(r)}
  const okB=el('button','st-pbtn ok','✓');okB.setAttribute('aria-label','Valider');okB.disabled=!ok;okB.onclick=()=>mode.kind==='item'?confirmPlace():applyTool();
  const x=el('button','st-pbtn','✕');x.setAttribute('aria-label','Terminer');x.onclick=stopMode;bar.append(okB,x);
  if(why&&mode.pos||why&&mode.a)c.hint(why)}
 let ghostTint=[0,0,0,0];
 function confirmPlace(){if(!mode?.pos)return;const r=E.place(S,mode.t,mode.pos[0],mode.pos[1],mode.r);
  if(typeof r==='string'){msg(r);c.tone(false);return}c.tone(true);mode.pos=null;updatePlace();msg(D.ITEM[r.t].name+' installé·e'+(r.cat?' : rayon '+D.CAT[r.cat].name.toLowerCase()+'. Touche-le pour changer de rayon.':'.'))}
 function applyTool(){let why=null;const t=mode.id;
  if(t==='wall')why=E.buildWall(S,mode.a,mode.b);
  if(t==='zoneR'||t==='zoneS')why=E.paintZone(S,mode.a,mode.b,t==='zoneR'?1:0);
  if(t==='erase')why=E.eraseAt(S,...mode.a);
  msg(why||'C’est fait.');c.tone(!why);mode.a=mode.b=null;updatePlace()}

 // ---- panneaux
 function closePanel(){panel=null;sheet.hidden=true;if(!mode)sel=null}
 function openPanel(name){if(mode&&name!=='item')stopMode();panel=name;sheet.hidden=false;renderPanel()}
 let buildTab='rayons';
 function head(title,sub){sheet.innerHTML='';const h=el('div','st-head');const t=el('div');t.append(el('b',null,title));if(sub)t.append(el('small',null,sub));
  const x=el('button','st-x','✕');x.setAttribute('aria-label','Fermer');x.onclick=closePanel;h.append(t,x);sheet.append(h);const body=el('div','st-body');sheet.append(body);return body}
 const row=(...kids)=>{const r=el('div','st-row');r.append(...kids);return r};
 const btn=(t,fn,cls='st-small')=>{const b=el('button',cls,t);b.onclick=e=>{e.stopPropagation();fn()};return b};
 function renderPanel(){if(!panel)return;const fn={build:pBuild,stock:pStock,team:pTeam,money:pMoney,item:pItem,report:pReport,welcome:pWelcome}[panel];fn&&fn()}
 function pBuild(){const body=head('Construire','Trésorerie : '+eur(S.cash));const tabs=el('div','st-tabs');
  for(const [id,name] of D.TABS){const b=btn(name,()=>{buildTab=id;renderPanel()},'st-tab'+(id===buildTab?' on':''));tabs.append(b)}body.append(tabs);
  const grid=el('div','st-cards');body.append(grid);
  if(buildTab==='murs'){for(const t of D.TOOLS){const b=card(t.name,t.price?eur(t.price)+(t.id==='wall'?' / m':''):'',t.hint);b.onclick=()=>startTool(t.id);grid.append(b)}return}
  if(buildTab==='agrandir'){for(const [side,name] of [['N','Vers le nord'],['W','Vers l’ouest'],['E','Vers l’est']]){const inf=E.extendInfo(S,side);
    const b=card(name,inf.ok?eur(inf.cost):'Impossible',inf.ok?`+${inf.m2} m² (${D.EXTEND.depth} m sur tout le côté)`:'Le terrain s’arrête ici.');b.disabled=!inf.ok;
    b.onclick=()=>c.dialog('Agrandir le magasin ?',`${inf.m2} m² de plus pour ${eur(inf.cost)}.`,'Construire',()=>{const why=E.extend(S,side);msg(why||'Le magasin s’agrandit !');c.tone(!why);save();renderPanel()},'Annuler',()=>{});grid.append(b)}
   body.append(el('p','st-note','Surface actuelle : '+E.area(S)+' m² (vente '+E.salesArea(S)+' m²). La façade avec l’entrée ne bouge pas.'));return}
  for(const d of D.ITEMS.filter(i=>i.tab===buildTab)){const sub=d.kind==='sale'?`${d.cap} articles`:d.kind==='counter'?`avec ${D.ROLES.find(r=>r.needs===d.id).name.toLowerCase()}`:d.kind==='reserve'?`${d.cap} articles ${D.STORES[d.store].toLowerCase()}`:d.attract?'Rend le magasin plus agréable':d.security?'Moins de vols':d.clean?'Moins de saletés':d.kind==='checkout'?'Avec caissier·ère':d.kind==='self'?'Sans personnel, plus de vols':d.kind==='dock'?'Contre un mur extérieur':'';
   const b=card(d.name,eur(d.price),sub+(d.power?` · ${d.power} €/mois d’électricité`:''),d.w+'×'+d.d);b.onclick=()=>startItem(d.id);grid.append(b)}}
 function card(t,p,sub,size){const b=el('button','st-card');b.append(el('b',null,t));if(size)b.append(el('i',null,size+' m'));b.append(el('span',null,p));if(sub)b.append(el('small',null,sub));return b}
 function pStock(){const body=head('Stock et prix','Livraison chaque nuit au quai, selon ton budget.');const cap=E.capacity(S);
  const bud=el('div','st-budget');const val=el('b',null,eur(S.budget)+' / jour');
  bud.append(el('span',null,'Budget d’achat'),btn('−',()=>{S.budget=Math.max(0,S.budget-250);renderPanel()}),val,btn('+',()=>{S.budget+=250;renderPanel()}));body.append(bud);
  const y=S.last?Math.round(S.last.cogs):0;body.append(el('p','st-note',`Hier : ${S.last?S.last.customers:0} clients, ventes au prix d’achat ≈ ${eur(y)}, pertes ${eur(S.last?S.last.loss:0)}.`));
  for(const k of ['ambiant','frais','surgele']){const r=el('div','st-cap'),f=cap.cap[k]?Math.min(1,cap.used[k]/cap.cap[k]):0;r.append(el('span',null,'Réserve '+D.STORES[k].toLowerCase()));const m=el('i');const fillEl=el('u');fillEl.style.width=(f*100)+'%';m.append(fillEl);r.append(m,el('small',null,cap.cap[k]?`${cap.used[k]} / ${cap.cap[k]}`:'aucune'));body.append(r)}
  body.append(row(btn('Répartir selon les ventes',()=>{S.alloc=E.allocFromSales(S);renderPanel();msg('Répartition recalculée d’après les ventes du mois.')},'st-small wide'),
   btn('Livraison express (+15 %)',()=>{const r=E.express(S,S.budget);if(typeof r==='string')msg(r);else{msg('Livraison express reçue : '+eur(r.cost));save()}renderPanel()},'st-small wide')));
  const tot=D.CATS.reduce((t,k)=>t+(S.alloc[k.id]||0),0)||1,off=E.offered(S);
  const tbl=el('div','st-cats');tbl.append(row(el('span','st-h','Rayon'),el('span','st-h','Achat'),el('span','st-h','Marge'),el('span','st-h','Stock')));
  for(const k of D.CATS){const shelf=S.items.filter(o=>o.cat===k.id).reduce((t,o)=>t+o.stock,0);
   const name=el('span','st-cn');name.append(el('b',null,k.name),el('small',null,off.has(k.id)?D.STORES[k.store]+' · '+E.price(S,k.id).toFixed(2).replace('.',',')+' € l’article':'pas en rayon'));
   const al=el('span','st-step');al.append(btn('−',()=>{S.alloc[k.id]=Math.max(0,(S.alloc[k.id]||0)-1);renderPanel()}),el('b',null,Math.round((S.alloc[k.id]||0)/tot*100)+' %'),btn('+',()=>{S.alloc[k.id]=(S.alloc[k.id]||0)+1;renderPanel()}));
   const mg=el('span','st-step'+(S.margin[k.id]>k.ref+5?' high':S.margin[k.id]<k.ref-5?' low':''));mg.append(btn('−',()=>{S.margin[k.id]=Math.max(0,S.margin[k.id]-2);renderPanel()}),el('b',null,S.margin[k.id]+' %'),btn('+',()=>{S.margin[k.id]=Math.min(120,S.margin[k.id]+2);renderPanel()}));
   const st=el('span','st-stk',`${shelf} / ${S.reserve[k.id]}`);if(off.has(k.id)&&!shelf&&!S.reserve[k.id])st.classList.add('warn');
   tbl.append(row(name,al,mg,st))}
  body.append(tbl,el('p','st-note','Stock : en rayon / en réserve. Marge habituelle des clients : autour de 30 % (60 % pour le pain). Plus cher, ils achètent moins et viennent moins ; moins cher, ils reviennent plus.'))}
 function pTeam(){const body=head('Équipe','Masse salariale : '+eur(E.salaries(S))+' / mois (charges comprises)');
  for(const r of D.ROLES){const n=S.staff[r.id]||0,name=el('span','st-cn');name.append(el('b',null,r.name),el('small',null,r.desc+' '+eur(r.salary)+'/mois.'));
   const st=el('span','st-step');st.append(btn('−',()=>{E.hire(S,r.id,-1);E.syncStaff(S,R);renderPanel()}),el('b',null,String(n)),btn('+',()=>{const why=E.hire(S,r.id,1);if(why)msg(why);else E.syncStaff(S,R);renderPanel()}));
   body.append(row(name,st))}
  const ck=S.items.filter(o=>o.t==='checkout').length,man=S.items.filter(o=>o.t==='checkout'&&E.manned(S,o)).length;
  body.append(el('p','st-note',`Caisses tenues : ${man} / ${ck}. Les salaires sont payés à la fin du mois, au prorata des jours travaillés.`))}
 function pMoney(){const body=head('Compta','Mois '+E.monthOf(S)+', jour '+E.dayOfMonth(S));const m=S.month,a=E.attraction(S);
  const lines=[['Trésorerie',eur(S.cash)],['Crédit restant',eur(S.loan.left)+' ('+eur(S.loan.monthly)+'/mois)'],['Réputation',Math.round(S.rep)+' / 100'],['Clients attendus',a.perDay+' / jour'],
   ['— Ce mois-ci —',''],['Chiffre d’affaires',eur(m.rev)],['Achats de marchandises',eur(-m.buy)],['Travaux et équipement',eur(-m.build)],['Publicité',eur(-m.ads)],['Pertes (périmés)',eur(-m.loss)+' *'],['Vols',eur(-m.theft)+' *'],
   ['— À payer en fin de mois —',''],['Salaires (estimés)',eur(-E.salaries(S))],['Électricité',eur(-E.electricity(S))],['Remboursement du crédit',eur(-S.loan.monthly)]];
  const t=el('div','st-lines');for(const [k,v] of lines){const r=el('div',v?'':'st-sep');r.append(el('span',null,k),el('b',null,v));t.append(r)}body.append(t);
  body.append(el('p','st-note','* déjà compris dans les achats : marchandise perdue ou volée.'));
  const ads=el('div','st-row');for(const ad of D.ADS)ads.append(btn(`${ad.name} : ${eur(ad.price)} (+${Math.round(ad.boost*100)} % de clients, ${ad.days} j)`,()=>c.dialog(ad.name+' ?',`Coût ${eur(ad.price)}.`,'Lancer',()=>{E.advertise(S,ad.id);msg('Campagne lancée !');renderPanel()},'Annuler',()=>{}),'st-small wide'));
  body.append(el('b','st-sub','Publicité'+(S.ads.until>=S.d?` (en cours jusqu’au jour ${S.ads.until})`:'')),ads);
  body.append(el('b','st-sub','Banque'),row(btn(`Emprunter ${eur(D.EXTRA_LOAN.amount)} (+${eur(D.EXTRA_LOAN.monthly)}/mois)`,()=>c.dialog('Nouvel emprunt ?',`Tu reçois ${eur(D.EXTRA_LOAN.amount)} et tu rembourses ${eur(D.EXTRA_LOAN.monthly)} de plus chaque mois.`,'Emprunter',()=>{E.borrow(S);save();renderPanel()},'Annuler',()=>{}),'st-small wide')));
  if(S.reports?.length){body.append(el('b','st-sub','Mois précédents'));const h=el('div','st-lines');for(const r of S.reports.slice().reverse()){const d=el('div');d.append(el('span',null,'Mois '+r.month+' · CA '+eur(r.rev)),el('b',r.result<0?'neg':'pos',eur(r.result)));h.append(d)}body.append(h)}
 }
 function pItem(){const it=S.items.find(o=>o.id===sel);if(!it){closePanel();return}const d=D.ITEM[it.t];const body=head(d.name,'Revente : '+eur(d.price*D.REFUND));
  if(d.cap&&d.kind!=='reserve'){const f=Math.min(1,it.stock/d.cap),r=el('div','st-cap');const m=el('i'),u=el('u');u.style.width=f*100+'%';m.append(u);r.append(el('span',null,'En rayon'),m,el('small',null,it.stock+' / '+d.cap));body.append(r)}
  if(d.kind==='reserve'){const cap=E.capacity(S);body.append(el('p','st-note',`Réserve ${D.STORES[d.store].toLowerCase()} : ${cap.used[d.store]} / ${cap.cap[d.store]} articles.`))}
  if(d.cats&&d.cats.length>1){body.append(el('b','st-sub','Rayon'));const chips=el('div','st-chips');for(const k of d.cats){const b=btn(D.CAT[k].name,()=>{E.setCat(S,it.id,k);renderPanel()},'st-chip'+(it.cat===k?' on':''));chips.append(b)}body.append(chips)}
  else if(it.cat)body.append(el('p','st-note','Rayon : '+D.CAT[it.cat].name+'.'));
  if(d.kind==='checkout')body.append(el('p','st-note',E.manned(S,it)?'Tenue par un·e caissier·ère.':'Personne à cette caisse : embauche un·e caissier·ère (Équipe).'));
  if(d.kind==='counter')body.append(el('p','st-note',E.manned(S,it)?'Le comptoir est tenu.':'Comptoir fermé : embauche un·e '+D.ROLES.find(r=>r.needs===it.t).name.toLowerCase()+'.'));
  body.append(row(btn('↻ Tourner',()=>{const why=E.rotateItem(S,it.id);if(why)msg(why);renderPanel()},'st-small wide'),btn('Vendre',()=>{E.removeItem(S,it.id);sel=null;closePanel();msg('Vendu.')},'st-small wide danger')))}
 function pReport(){const r=pending;if(!r){closePanel();return}const body=head(r.over?'Faillite':'Bilan du mois '+r.report.month,r.over?'La banque ferme le magasin.':'');const m=r.report;
  const t=el('div','st-lines');for(const [k,v] of [['Clients',String(m.customers)],['Satisfaction',m.avgSat==null?'—':Math.round(m.avgSat)+' / 100'],['Chiffre d’affaires',eur(m.rev)],['Achats',eur(-m.buy)],['Salaires',eur(-m.salaries)],['Électricité',eur(-m.elec)],['Crédit',eur(-m.loan)],['Agios',eur(-m.interest)],['Publicité',eur(-m.ads)],['Résultat',eur(m.result)],['Travaux et équipement',eur(-m.build)],['Trésorerie',eur(m.cash)]]){const d=el('div',k==='Résultat'?'st-total':'');d.append(el('span',null,k),el('b',null,v));t.append(d)}
  body.append(t);body.append(el('p','st-note',r.over?'Ta trésorerie est passée sous '+eur(D.BANKRUPTCY)+'.':m.result>=0?'Bien joué, le magasin gagne de l’argent.':'Le mois est négatif : regarde les prix, le stock et l’équipe.'));
  body.append(btn(r.over?'Nouvelle partie':'Continuer',()=>{if(r.over){clearRun(KEY);S=E.withDirt(E.newGame());R=E.runtime();staticKey='';isNew=true}pending=null;hold=false;closePanel();if(isNew){isNew=false;openPanel('welcome');hold=true}},'primary'))}
 function pWelcome(){const body=head('Bienvenue dans ton magasin !','Tu viens d’acheter une supérette de 400 m².');
  for(const t of ['Construis tes rayons, frigos, caisses (menu Construire). Le fond gris est la réserve : racks, chambres froides et quai de livraison s’y installent.','Embauche des caissiers, des employés de rayon et un agent d’entretien (Équipe).','Choisis ton budget d’achat, la répartition et tes marges (Stock). Les livraisons arrivent chaque nuit ; la livraison express te dépanne tout de suite.','Ouvre le magasin ! Fin de mois : salaires, électricité et crédit. Garde un œil sur la trésorerie.','Fais glisser pour te déplacer, pince pour zoomer, ⟲ ⟳ pour tourner la vue.'])body.append(el('p','st-step-txt',t));
  body.append(btn('C’est parti',()=>{hold=false;closePanel()},'primary'))}

 // ---- messages
 function msg(t){c.hint(t)}
 function toast(t){const d=el('div','st-t',t);toastBox.append(d);setTimeout(()=>d.remove(),4200)}
 function handleEvents(){for(const e of R.events.splice(0)){
  if(e.t==='pay')floats.push({x:e.x,z:e.y,y:2,txt:'+'+Math.round(e.v)+' €',col:'#2f8a45',life:1.4});
  if(e.t==='bubble'){const a=R.agents.find(o=>o.id===e.id);if(a)floats.push({x:a.x,z:a.y,y:2.2,txt:e.txt,col:e.txt==='€'?'#b8860b':'#c62f2f',life:1.6,big:true})}
  if(e.t==='night'){const d=e.day;toast(`Jour ${d.d} : ${d.customers} clients, ${eur(d.rev)}`+(d.avgSat!=null?`, satisfaction ${Math.round(d.avgSat)}`:'')+(e.dock?(e.delivered?` · livraison ${eur(e.delivered)}`:''):' · pas de quai, pas de livraison'));save()}
  if(e.t==='month'){pending=e;hold=true;openPanel('report');save()}}}

 // ---- sauvegarde
 function save(){try{if(!S.over)saveRun(KEY,E.serialize(S))}catch{}}
 c.listen(document,'visibilitychange',()=>{if(document.hidden)save()});c.listen(window,'pagehide',save);

 // ---- rendu
 function resize(){const w=wrap.clientWidth,h=wrap.clientHeight,dpr=Math.min(2,window.devicePixelRatio||1);if(!w||!h)return;
  if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(h*dpr)){cv.width=ov.width=Math.round(w*dpr);cv.height=ov.height=Math.round(h*dpr)}cam.w=w;cam.h=h}
 c.listen(window,'resize',resize);
 function draw(dt){resize();time+=dt;
  if(Math.abs(cam.yaw-cam.yawTo)>1e-3){cam.yaw+=(cam.yawTo-cam.yaw)*Math.min(1,dt*10);if(Math.abs(cam.yaw-cam.yawTo)<.002)cam.yaw=cam.yawTo}
  const v=view(),key=[cam.yaw.toFixed(3),v.sel,v.zones,S._L?1:0].join();lastStatic+=dt;
  if(key!==staticKey||!S._L||lastStatic>.5){E.layout(S);staticKey=key;lastStatic=0;buildStatic(Bs,S,v);ren.upload('static',Bs.d,Bs.n)}
  buildAgents(Ba,S,R,v,time);ren.upload('agents',Ba.d,Ba.n);
  const M=viewProj(cam);ren.frame(M,[['static'],['agents'],['ghost',ghostTint]]);
  // icônes : rayons vides, bulles, encaissements
  const dpr=cv.width/cam.w;g2.setTransform(dpr,0,0,dpr,0,0);g2.clearRect(0,0,cam.w,cam.h);g2.textAlign='center';g2.textBaseline='middle';
  for(const it of S.items){const d=D.ITEM[it.t];if(!it.cat||!d.cap||it.stock>0)continue;if(d.kind==='counter'&&!E.manned(S,it))continue;const [w,dd]=E.size(it),[px,py]=project(M,cam,it.x+w/2,d.h+.6,it.y+dd/2);
   g2.fillStyle='#e0453a';g2.beginPath();g2.arc(px,py,8,0,7);g2.fill();g2.fillStyle='#fff';g2.font='bold 12px sans-serif';g2.fillText('!',px,py+.5)}
  for(const f of floats){f.life-=dt;f.y+=dt*.8;const [px,py]=project(M,cam,f.x,f.y,f.z);g2.globalAlpha=Math.max(0,Math.min(1,f.life));g2.font=(f.big?'bold 15px':'bold 11px')+' sans-serif';g2.fillStyle=f.col;g2.fillText(f.txt,px,py)}
  g2.globalAlpha=1;floats=floats.filter(f=>f.life>0);if(floats.length>60)floats.splice(0,floats.length-60)}
 function hudUpdate(){const n=R.agents.filter(a=>a.k==='c').length;info.textContent=`★ ${Math.round(S.rep)} · ${n} client${n>1?'s':''} · ${S.open?(S.hour<D.HOURS.close?'ouvert':'fermeture…'):'fermé'}`;
  c.setBar('TRÉSORERIE',eur(S.cash),'MOIS '+E.monthOf(S)+' · JOUR '+E.dayOfMonth(S),E.hourLabel(S))}

 // ---- démarrage
 if(isNew){openPanel('welcome');hold=true}else{msg(E.problems(S)[0]||'Bon retour dans ton magasin !')}
 c.hint(isNew?'Bienvenue !':E.problems(S)[0]||'');resize();hudUpdate();
 let hintT=0;
 return {
  update(dt){if(!hold&&!S.over){const total=dt*D.SPEEDS[speedIdx],n=Math.ceil(total/.05);for(let k=0;k<n;k++)E.step(S,R,total/n);handleEvents()}
   draw(dt);hudUpdate();if((hintT+=dt)>2&&!mode){hintT=0;const p=E.problems(S);if(p.length)c.hint(p[0])}
   if((saveT+=dt)>20){saveT=0;save()}},
  key(k){if(k==='Escape'){if(mode)stopMode();else closePanel()}if(k==='r'&&mode?.kind==='item'){mode.r=(mode.r+1)%4;updatePlace()}},
  destroy(){save()}}
}
