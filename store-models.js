// BagaStore : modèles 3D (pavés colorés, style maquette) du terrain, du magasin, des meubles et des personnages.
import * as D from './store-data.js';
import * as E from './store-engine.js';
const W=D.LOT_W,H=D.LOT_H,RY=D.ROAD.y,RE=D.ROAD.y+D.ROAD.h;
const rgb=h=>[parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255];
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const C={grass:rgb('#8cc56b'),grass2:rgb('#7fb862'),asphalt:rgb('#6c7078'),road:rgb('#4d5058'),line:rgb('#f4f1e6'),walk:rgb('#d8d4c8'),
 tileA:rgb('#f3ece0'),tileB:rgb('#e7dfd1'),resA:rgb('#b9bcc0'),resB:rgb('#b0b3b8'),dirt:rgb('#8a7458'),
 wall:rgb('#f2e6d2'),wallTop:rgb('#c9b79c'),brick:rgb('#d98f6c'),iwall:rgb('#efe4d4'),iwallTop:rgb('#bfae96'),glass:rgb('#bfe6f2'),
 metal:rgb('#c9ced6'),dark:rgb('#4b525c'),white:rgb('#f6f7f8'),wood:rgb('#c58e5a'),woodD:rgb('#9d6b3e'),carton:rgb('#c99a66'),cartonT:rgb('#a87b4d'),
 orange:rgb('#f0913a'),blue:rgb('#3f7fcf'),leaf:rgb('#5fa84f'),leaf2:rgb('#4c9442'),trunk:rgb('#8a5d3b'),pot:rgb('#d07a52'),warm:rgb('#ffe79a'),
 red:rgb('#d9493f'),green:rgb('#5bbf6a'),yellow:rgb('#f5c542'),skinH:rgb('#5a3d2b')};
export const COLORS=C;

// ---------------------------------------------------------------- terrain, sol, murs
// arbres décoratifs hors du terrain (pas sur la route principale prolongée)
const trees=(()=>{const o=[];let s=7;const r=()=>(s=(s*16807)%2147483647)/2147483647;for(let k=0;k<400&&o.length<110;k++){const x=r()*(W+40)-20,z=r()*(H+40)-20;if(x>-1.5&&x<W+1.5&&z>-1.5&&z<H+1.5)continue;if(z>RY-2&&z<RE+2)continue;o.push([x,z,.7+r()*.6])}return o})();
export function buildStatic(B,S,v){const b=S.b,L=E.layout(S);B.reset();B.setYaw(v.yaw);
 // herbe, parking, route
 // hors du terrain : herbe plus sombre (on ne construit pas) ; le terrain constructible est l'herbe claire
 B.tile(-40,-40,W+40,H+40,-.03,mix(C.grass2,[.35,.45,.3],.35));B.tile(0,0,W,H,-.02,C.grass);
 // sol : goudron, routes (route principale prolongée hors du terrain), marquages : ligne continue au milieu, tirets dans chaque sens
 for(const [a,b] of [[-40,0],[W,W+40]]){B.tile(a,RY,b,RE,0,C.road);B.tile(a,RY-1,b,RY,0,C.walk);B.tile(a,RE,b,RE+1,0,C.walk)}
 {const m=(RY+RE)/2;for(const d of [-.12,.12])B.tile(-40,m+d-.04,W+40,m+d+.04,.006,C.yellow);
  for(let x=-39;x<W+40;x+=3)for(const z of [RY+1.5,RE-1.5])B.tile(x,z-.06,x+1.4,z+.06,.006,C.line)}
 const G=S.ground||[],gr=(x,y)=>x>=0&&y>=0&&x<W&&y<H?G[E.idx(x,y)]:0;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const g=gr(x,y);if(!g||E.inside(S,x,y))continue;B.tile(x,y,x+1,y+1,.001,g===2||g===4||g===5?C.road:g===3?((x+y)&1?C.walk:mix(C.walk,C.white,.25)):C.asphalt);
  // passage piéton : bandes blanches dans le sens de la route
  if(g===4){B.tile(x,y,x+1,y+1,.007,C.road);const vert=gr(x,y-1)===4||gr(x,y+1)===4;if(vert)B.tile(x+.08,y+.22,x+.92,y+.78,.008,C.line);else B.tile(x+.22,y+.08,x+.78,y+.92,.008,C.line);continue}
  // cédez le passage : dents de requin blanches le long de la ligne
  if(g===5){const hor=gr(x-1,y)===5||gr(x+1,y)===5;for(const k of [.25,.75]){const a=hor?[x+k-.18,y+.35]:[x+.35,y+k-.18],b2=hor?[x+k+.18,y+.35]:[x+.35,y+k+.18],c2=hor?[x+k,y+.72]:[x+.72,y+k];
    B.quad([a[0],.008,a[1]],[b2[0],.008,b2[1]],[c2[0],.008,c2[1]],[c2[0],.008,c2[1]],C.line)}continue}
  if(g===2&&!E.isMainRoad(x,y)){const e=.07,lc=mix(C.road,C.line,.75);if(!gr(x,y-1))B.tile(x,y,x+1,y+e,.004,lc);if(!gr(x,y+1))B.tile(x,y+1-e,x+1,y+1,.004,lc);if(!gr(x-1,y))B.tile(x,y,x+e,y+1,.004,lc);if(!gr(x+1,y))B.tile(x+1-e,y,x+1,y+1,.004,lc)}}
 const ins=(x,y)=>E.inside(S,x,y);
 for(const [x,y,s] of S.trees||[])tree(B,x+.5,y+.5,s);
 for(const [x,z,s] of trees)if(x<-1||x>W+1||z<-1)tree(B,x,z,s);
 // sol (carrelage, béton dans la réserve, salissures)
 for(let y=b.y0;y<b.y1;y++)for(let x=b.x0;x<b.x1;x++){if(!ins(x,y))continue;const i=E.idx(x,y),r=S.zone[i],alt=(x+y)&1;
  let c=r?(alt?C.resA:C.resB):(alt?C.tileA:C.tileB);const d=S.dirt?S.dirt[i]:0;if(d>.12)c=mix(c,C.dirt,Math.min(.55,(d-.12)*.9));
  if(v.zones&&r)c=mix(c,[.55,.7,.95],.35);B.tile(x,y,x+1,y+1,.01,c);
  if(d>.3){const h=(x*73856093^y*19349663)>>>0,ox=(h%50)/100,oz=((h>>6)%50)/100;B.tile(x+.15+ox*.4,y+.2+oz*.4,x+.55+ox*.4,y+.5+oz*.4,.013,mix(c,rgb('#5d4a35'),.45));
   if(d>.5){B.box(x+.2+ox,0,y+.6-oz*.3,x+.32+ox,.03,y+.7-oz*.3,[.96,.96,.92]);B.box(x+.6-ox*.4,0,y+.25+oz,x+.66-ox*.4,.1,y+.31+oz,[.8,.22,.2])}
   if(d>.75)B.box(x+.4,0,y+.4,x+.58,.05,y+.52,[.55,.8,.95])}}
 // murs intérieurs et portes
 for(let y=b.y0;y<b.y1;y++)for(let x=b.x0;x<b.x1;x++){const w=ins(x,y)&&S.wall[E.idx(x,y)];if(!w)continue;
  if(w===1)B.box(x,0,y,x+1,1.3,y+1,C.iwall,C.iwallTop);
  else{const hor=S.wall[E.idx(x-1,y)]||S.wall[E.idx(x+1,y)];if(hor){B.box(x,0,y,x+.12,1.3,y+1,C.iwall,C.iwallTop);B.box(x+.88,0,y,x+1,1.3,y+1,C.iwall,C.iwallTop)}else{B.box(x,0,y,x+1,1.3,y+.12,C.iwall,C.iwallTop);B.box(x,0,y+.88,x+1,1.3,y+1,C.iwall,C.iwallTop)}
   B.tile(x+.1,y+.1,x+.9,y+.9,.015,C.woodD)}}
 // murs extérieurs, sur chaque bord du bâtiment ; bas du côté de la caméra pour voir dedans
 const ch=v.near,hi=2.9,lo=.55,t=.22,gaps=new Set(),door=rgb('#9aa3ad');
 for(const it of S.items)if(it.t==='dock')for(const g of dockGap(S,it))gaps.add(g);
 for(let y=b.y0;y<b.y1;y++)for(let x=b.x0;x<b.x1;x++){if(!ins(x,y))continue;const i=E.idx(x,y);
  for(const [side,dx,dy] of [['N',0,-1],['S',0,1],['W',-1,0],['E',1,0]]){if(ins(x+dx,y+dy))continue;const h=ch[side]?lo:hi;
   const box=(y0,y1,col,top,inset=0)=>{if(side==='N')B.box(x,y0,y-t,x+1,y1,y-inset,col,top);if(side==='S')B.box(x,y0,y+1+inset,x+1,y1,y+1+t,col,top);if(side==='W')B.box(x-t,y0,y,x-inset,y1,y+1,col,top);if(side==='E')B.box(x+1+inset,y0,y,x+1+t,y1,y+1,col,top)};
   if(side==='S'&&y===S.fy&&(x===S.ent||x===S.ent+1)){if(h>1)box(2.3,h,C.wall,C.wallTop);continue}
   if(gaps.has(side+i)){box(0,Math.min(h,2.6),door,C.wallTop,.08);if(h>1)box(2.6,h,C.wall,C.wallTop);continue}
   box(0,h,C.wall,C.wallTop);if(h>1){const e=.02;if(side==='N')B.box(x,0,y-t-e,x+1,.5,y-t,C.brick);if(side==='S')B.box(x,0,y+1+t,x+1,.5,y+1+t+e,C.brick);if(side==='W')B.box(x-t-e,0,y,x-t,.5,y+1,C.brick);if(side==='E')B.box(x+1+t,0,y,x+1+t+e,.5,y+1,C.brick)}}
  // poteaux d'angle (coins extérieurs)
  for(const [sx,sy,px,pz] of [[-1,-1,x-t,y-t],[1,-1,x+1,y-t],[-1,1,x-t,y+1],[1,1,x+1,y+1]])if(!ins(x+sx,y)&&!ins(x,y+sy)){const h=(ch[sx<0?'W':'E']||ch[sy<0?'N':'S'])?lo:hi;B.box(px,0,pz,px+t,h,pz+t,C.wall,C.wallTop)}}
 // enseigne au-dessus de l'entrée
 if(!ch.S){B.box(S.ent-1.5,2.95,S.fy+1.05,S.ent+3.5,3.75,S.fy+1.35,rgb('#3f7a4f'));B.box(S.ent-1.2,3.1,S.fy+1.35,S.ent+3.2,3.6,S.fy+1.4,C.yellow)}
 // tapis d'entrée
 B.tile(S.ent,S.fy,S.ent+2,S.fy+2.2,.02,rgb('#55606b'));
 // meubles
 for(const it of S.items)if(it.id!==v.hide)item(B,S,it,v)}
function dockGap(S,it){const [w,d]=E.size(it),o=[];
 if(it.r===0)for(let i=0;i<w;i++)o.push('N'+E.idx(it.x+i,it.y));if(it.r===2)for(let i=0;i<w;i++)o.push('S'+E.idx(it.x+i,it.y+d-1));
 if(it.r===1)for(let j=0;j<d;j++)o.push('E'+E.idx(it.x+w-1,it.y+j));if(it.r===3)for(let j=0;j<d;j++)o.push('W'+E.idx(it.x,it.y+j));return o}
function tree(B,x,z,s){B.box(x-.12*s,0,z-.12*s,x+.12*s,1.1*s,z+.12*s,C.trunk);B.box(x-.75*s,1*s,z-.75*s,x+.75*s,2.1*s,z+.75*s,C.leaf,mix(C.leaf,[1,1,.8],.15));B.box(x-.5*s,2.1*s,z-.5*s,x+.5*s,2.8*s,z+.5*s,C.leaf2,mix(C.leaf,[1,1,.8],.2))}

// ---------------------------------------------------------------- meubles
// repère local : largeur d.w sur x, profondeur d.d sur z, le devant vers +z ; converti selon la rotation
export function frame(it){const d=D.ITEM[it.t],X=it.x,Y=it.y,w=d.w,dd=d.d,r=it.r;
 const m=(lx,lz)=>r===0?[X+lx,Y+lz]:r===1?[X+(dd-lz),Y+lx]:r===2?[X+(w-lx),Y+(dd-lz)]:[X+lz,Y+(w-lx)];
 return {d,m,ang:[0,-Math.PI/2,Math.PI,Math.PI/2][r]}}
function lb(B,F,x0,y0,z0,x1,y1,z1,col,top){const a=F.m(x0,z0),b=F.m(x1,z1);B.box(Math.min(a[0],b[0]),y0,Math.min(a[1],b[1]),Math.max(a[0],b[0]),y1,Math.max(a[1],b[1]),col,top||col)}
const catCol=(cat,k)=>{const c=D.CAT[cat].color;return c[k%c.length]};
export function item(B,S,it,v){const F=frame(it),d=F.d,w=d.w,dd=d.d,fill=d.cap?Math.min(1,it.stock/d.cap):0;
 const L=(...a)=>lb(B,F,...a);
 const products=(levels,x0,x1,z0,z1,ph,cat,f)=>{if(!cat)return;const per=Math.max(1,Math.round((x1-x0)/.38)),tot=per*levels.length,n=Math.round(f*tot),sw=(x1-x0)/per;
  for(let k=0;k<n;k++){const lv=k%levels.length,col=Math.floor(k/levels.length),y=levels[lv],c=catCol(cat,col+lv);L(x0+col*sw+.03,y,z0,x0+(col+1)*sw-.03,y+ph*(.85+.15*((col*7+lv*3)%3)/2),z1,c,mix(c,[1,1,1],.2))}};
 switch(it.t){
 case 'shelf':case 'shelfH':case 'promo':{const lv=it.t==='shelfH'?[.14,.5,.86,1.22,1.58]:it.t==='promo'?[.14,.5,.86]:[.14,.5,.86,1.22],h=d.h;
  L(0,0,.08,w,.12,.95,C.dark);L(0,0,0,w,h,.12,C.metal,mix(C.metal,[1,1,1],.3));L(0,0,0,.06,h,.95,C.metal);L(w-.06,0,0,w,h,.95,C.metal);
  for(const y of lv)L(.06,y-.04,.12,w-.06,y,.95,C.white);
  products(lv,.06,w-.06,.22,.9,.28,it.cat,fill);
  const sc=it.cat?catCol(it.cat,0):C.metal;L(.1,h,.02,w-.1,h+.22,.1,it.t==='promo'?C.red:sc);break}
 case 'bread':{L(0,0,0,w,.15,1,C.woodD);L(0,0,0,w,1.3,.12,C.wood);L(0,0,0,.06,1.3,1,C.wood);L(w-.06,0,0,w,1.3,1,C.wood);
  for(const [y,z] of [[.3,.95],[.65,.7],[1.0,.45]])L(.06,y-.04,.12,w-.06,y,z,C.woodD);
  const n=Math.round(fill*12);for(let k=0;k<n;k++){const lv=k%3,col=Math.floor(k/3),y=[.3,.65,1][lv],z1=[.92,.67,.42][lv];L(.12+col*.46,y,.2,.12+col*.46+.38,y+.16,z1,catCol('pain',k),mix(catCol('pain',k),[1,1,.8],.25))}
  L(.1,1.3,.02,w-.1,1.5,.1,rgb('#c9853e'));break}
 case 'veg':{for(const [x,z] of [[.05,.05],[w-.15,.05],[.05,dd-.15],[w-.15,dd-.15]])L(x,0,z,x+.1,.5,z+.1,C.woodD);
  const rows=[[1.35,1.95,.55],[.7,1.3,.72],[.05,.65,.89]];let k=0;const n=Math.round(fill*12);
  for(const [z0,z1,y] of rows)for(const [x0,x1] of [[.05,.95],[1.05,1.95]]){L(x0,y-.12,z0,x1,y,z1,C.wood,C.woodD);
   const f2=Math.max(0,Math.min(1,(n-k*2)/2));if(f2>0){const c=catCol('fruits',k);L(x0+.06,y,z0+.06,x1-.06,y+.08+.12*f2,z1-.06,c,mix(c,[1,1,1],.25))}k++}
  L(.05,1.05,.05,w-.05,1.12,.15,C.green);break}
 case 'fridge':{L(0,0,0,w,.15,1,C.dark);L(0,0,0,w,d.h,.15,C.white);L(0,0,0,.08,d.h,1,C.white);L(w-.08,0,0,w,d.h,1,C.white);
  L(0,d.h-.28,0,w,d.h,1,C.white);L(.1,d.h-.26,.96,w-.1,d.h-.12,1.01,it.cat?catCol(it.cat,0):C.blue);
  const lv=[.2,.55,.9,1.25];for(const y of lv)L(.08,y-.04,.15,w-.08,y,.93,rgb('#dfe7ee'));
  products(lv,.1,w-.1,.22,.85,.26,it.cat,fill);
  for(const x of [.06,w/2-.025,w-.11])L(x,.15,.94,x+.05,d.h-.28,1,C.metal);break}
 case 'freezer':{L(0,0,0,w,.4,1,C.white);L(0,.3,.98,w,.45,1.01,rgb('#7fb7e6'));L(0,.4,0,w,.88,.1,C.white);L(0,.4,.9,w,.88,1,C.white);L(0,.4,0,.08,.88,1,C.white);L(w-.08,.4,0,w,.88,1,C.white);
  L(.08,.4,.1,w-.08,.45,.9,rgb('#d8eefc'));const n=Math.round(fill*10);for(let k=0;k<n;k++){const c=catCol('surgeles',k),x=.12+(k%5)*.36,z=k<5?.15:.5;L(x,.45,z,x+.32,.72,z+.32,c,mix(c,[1,1,1],.3))}
  L(.08,.86,.45,w-.08,.9,.55,C.metal);break}
 case 'butcher':case 'fish':case 'cheese':case 'bakery':{const base={butcher:rgb('#c2433f'),fish:rgb('#3f78b8'),cheese:rgb('#e8b93c'),bakery:rgb('#a46a3f')}[it.t];
  L(0,0,0,w,1.95,.3,mix(base,[1,1,1],.55));L(0,1.95,0,w,2.35,.36,base,mix(base,[1,1,1],.2));
  for(const y of [.9,1.3])L(.1,y-.04,.3,w-.1,y,.55,C.white);products([.9,1.3],.15,w-.15,.32,.52,.22,it.cat,Math.min(1,fill*1.5));
  L(0,0,1.3,w,.85,2,base);L(0,.82,1.3,w,.86,2,C.white);L(.05,.86,1.35,w-.05,.88,1.95,C.white);
  products([.88],.1,w-.1,1.4,1.9,.12,it.cat,fill);L(0,.86,1.3,.06,1.2,2,C.glass);L(w-.06,.86,1.3,w,1.2,2,C.glass);L(0,1.17,1.92,w,1.22,2,C.glass);break}
 case 'checkout':{L(0,0,.2,1.5,.85,.8,rgb('#5b6470'));L(0,.85,.25,1.5,.88,.75,rgb('#22262c'));L(1.5,0,.55,1.98,.95,.85,rgb('#5b6470'));
  L(1.55,.95,.6,1.9,1.15,.8,C.dark);L(1.6,1.15,.62,1.85,1.35,.68,rgb('#9fd3ff'));
  L(.04,0,.22,.1,1.9,.28,C.metal);const on=E.manned(S,it);L(-.02,1.9,.18,.16,2.1,.32,on?C.green:C.red);break}
 case 'self':{L(.3,0,.3,.7,1,.7,rgb('#5b6470'));L(.2,1,.35,.8,1.38,.5,C.dark);L(.25,1.05,.5,.75,1.33,.52,rgb('#9fd3ff'));L(.1,.75,.55,.9,.8,.95,C.metal);break}
 case 'rack':{const store=d.store,cap=E.capacity(S),f=cap.cap[store]?cap.used[store]/cap.cap[store]:0,n=Math.round(Math.min(1,f)*9);
  for(const [x,z] of [[0,0],[w-.08,0],[0,.92],[w-.08,.92]])L(x,0,z,x+.08,d.h,z+.08,C.orange);
  for(const y of [.12,.85,1.6,2.35])L(0,y-.06,0,w,y,1,C.blue);
  for(let k=0;k<n;k++){const lv=k%3,col=Math.floor(k/3),y=[.12,.85,1.6][lv];L(.12+col*.6,y,.1,.12+col*.6+.55,y+.55,.9,C.carton,C.cartonT)}break}
 case 'cold':case 'frozen':{const c=it.t==='cold'?rgb('#eef3f6'):rgb('#dbeaf6');L(0,0,0,w,d.h,dd,c,mix(c,C.metal,.4));
  L(1,0,dd,2,2.1,dd+.06,it.t==='cold'?C.metal:rgb('#a9cbe6'));L(1.75,1,dd+.06,1.9,1.15,dd+.12,C.dark);L(.4,d.h,.4,1.4,d.h+.45,1.3,C.metal,C.dark);
  for(let x=1.5;x<2.8;x+=.2)L(x,d.h,.3,x+.1,d.h+.2,1.3,C.dark);break}
 case 'dock':{L(0,0,0,w,.15,dd,rgb('#a7aaae'));for(let x=0;x<w;x+=.5)L(x,.15,.02,x+.25,.17,.12,C.yellow);
  L(.1,0,-.05,w-.1,1.3,.02,C.dark);
  break}
 case 'spot':{L(0,0,0,.08,.012,dd,C.line);L(w-.08,0,0,w,.012,dd,C.line);L(0,0,0,w,.012,.08,C.line);L(.6,0,.35,w-.6,.1,.5,rgb('#9aa0a6'));break}
 case 'busstop':{L(.1,0,.2,.2,2.3,.3,C.metal);L(w-.2,0,.2,w-.1,2.3,.3,C.metal);L(0,2.3,0,w,2.42,1,rgb('#4c8fd1'),rgb('#6aa6e0'));L(.15,0,.15,w-.15,2.2,.22,C.glass);
  L(.4,.45,.3,w-.4,.52,.7,C.wood);for(const x of [.5,w-.6])L(x,0,.4,x+.1,.45,.6,C.dark);L(w-.05,0,.85,w+.05,2.6,.95,C.metal);L(w-.35,2.2,.82,w+.35,2.7,.98,C.yellow);L(w-.2,2.32,.98,w+.2,2.58,1,rgb('#2f6f45'));break}
 case 'corral':{L(0,0,.1,.06,1,.9,C.metal);L(w-.06,0,.1,w,1,.9,C.metal);L(0,.95,.1,w,1,.9,C.metal);for(let k=0;k<4;k++){const z=.15+k*.17;L(.25,.2,z,w-.25,.75,z+.5,mix(C.metal,[1,1,1],.2),mix(C.metal,C.dark,.1));L(.25,.9,z+.45,w-.25,.95,z+.5,C.red)}L(.2,1.05,.4,w-.2,1.4,.5,rgb('#2f6f45'));break}
 case 'plant':L(.3,0,.3,.7,.35,.7,C.pot);L(.2,.35,.2,.8,.95,.8,C.leaf);L(.32,.95,.32,.68,1.25,.68,C.leaf2);break;
 case 'lamp':L(.45,0,.45,.55,2,.55,C.dark);L(.3,2,.3,.7,2.2,.7,C.warm);L(.35,0,.35,.65,.08,.65,C.dark);break;
 case 'bin':L(.32,0,.32,.68,.75,.68,rgb('#5aa36a'));L(.3,.75,.3,.7,.82,.7,rgb('#3e7f4f'));break;
 case 'camera':L(.45,0,.45,.55,2.5,.55,C.metal);L(.35,2.35,.4,.65,2.55,.75,C.dark);L(.45,2.4,.75,.55,2.5,.8,C.red);break;
 case 'gate':L(.05,0,.4,.17,1.6,.6,C.metal);L(.83,0,.4,.95,1.6,.6,C.metal);L(.05,1.55,.45,.95,1.6,.55,rgb('#9aa3ad'));break}
}

// ---------------------------------------------------------------- personnages
// ang : direction du regard (0 = vers +z). phase : cycle de marche (radians). carry : 'carton' | 'basket' | 'mop' | 'push' | 'pallet'
// ex : {amp : amplitude de marche 0..1, look : rotation de la tête, reach : bras tendu vers un rayon 0..1, t : temps (respiration, clignement), id}
const SHOES=[rgb('#3a3634'),rgb('#f2efe8'),rgb('#7a4a2e'),rgb('#2f4f7a'),rgb('#c94a3e')];
export function person(B,x,z,ang,col,phase=0,carry=null,sit=1,scan=false,bob=0,ex={}){
 const k0=col.scale||1,c=Math.cos(ang),sn=Math.sin(ang),off=(lx,lz)=>[x+lx*c+lz*sn,z-lx*sn+lz*c],id=ex.id||0,t=ex.t||0;
 const amp=ex.amp??(phase?1:0),hair=col.hair||C.skinH,st=col.style||0,outfit=col.outfit??0,old=hair[0]>.6&&hair[1]>.6&&hair[2]>.6;
 const shoe=col.shoe||SHOES[id%SHOES.length],L=.78*sit*k0,hip=L+.05;
 // jambes : cuisse, tibia, pied ; le pied qui avance se lève
 for(const k of [-1,1]){const p2=phase+(k>0?0:Math.PI),sw=Math.sin(p2)*amp,lift=Math.max(0,Math.cos(p2))*amp*.07,lx=k*.085;
  const legC=outfit===1||outfit===2?col.skin:col.pants;
  {const [a,b]=off(lx,sw*.09);B.obox(a,hip-L*.27,b,.068,L*.27,.075,ang,outfit===2?col.pants:legC)}
  {const [a,b]=off(lx,sw*.2-lift*.4);B.obox(a,L*.25+.06+lift,b,.058,L*.24,.065,ang,legC)}
  {const [a,b]=off(lx,sw*.22+.045);B.obox(a,.04+lift*.8,b,.07,.04,.12,ang,shoe)}}
 // bassin, jupe ou short
 const lean=amp*.035+(old?.03:0),tw=.18*(st===1||st===3?.93:1)*(k0>1.04?1.06:1);
 B.obox(x,hip,z,tw-.01,.07,.1,ang,col.pants);
 if(outfit===1){const [a,b]=off(0,.0);B.obox(a,hip-.16,b,tw+.03,.14,.13,ang,col.pants,mix(col.pants,[1,1,1],.1))}
 // buste (respiration), léger penché en marchant
 const br=1+Math.sin(t*2.1+id)*.012*(1-amp),cy=hip+.07+.25*k0*br+bob;
 {const [a,b]=off(0,lean*.5);B.obox(a,hip+.12,b,tw,.09,.105,ang,col.shirt)}
 {const [a,b]=off(0,lean);B.obox(a,cy+.04,b,tw+.01,.17*k0*br,.115,ang,col.shirt,mix(col.shirt,[1,1,1],.15))}
 if(outfit===3){for(const k of [-1,1]){const [a,b]=off(k*(tw-.035),lean+.06);B.obox(a,cy-.02,b,.045,.24*k0,.07,ang,mix(col.pants,col.shirt,.35))}}
 if(col.apron){const [a,b]=off(0,lean+.118);B.obox(a,cy-.06,b,.15,.3,.01,ang,col.apron)}
 const sh=cy+.17*k0;// épaules
 // bras : haut du bras, avant-bras, main ; balancement opposé aux jambes, ou pose selon ce qu'on porte
 for(const k of [-1,1]){const ax=k*(tw+.055),sw=-Math.sin(phase+(k>0?0:Math.PI))*amp;let u=sw*.09,f=sw*.17+.03,fy=0,hold=0;
  if(carry==='push'||carry==='carton'||carry==='pallet'){u=.1;f=.3;fy=.12;hold=1}
  else if(carry==='mop'){u=.08;f=.22+Math.sin(phase)*.08*k;fy=.1;hold=1}
  else if(carry==='basket'&&k===1){u=sw*.03;f=.04}
  if(scan&&k===1){u=.08;f=.2+Math.sin(phase)*.07;fy=.14}
  if(ex.reach&&k===1){u=.12*ex.reach;f=.34*ex.reach+.03;fy=.32*ex.reach}
  {const [a,b]=off(ax,lean+u*.5);B.obox(a,sh-.13,b,.05,.13*k0,.06,ang,outfit===3?mix(col.pants,col.shirt,.35):col.shirt)}
  {const [a,b]=off(ax*(hold?.92:1),lean+f*.75);B.obox(a,sh-.33+fy*.6,b,.044,.11*k0,.05,ang,(hold||fy>.1)&&!col.long?col.skin:col.shirt)}
  {const [a,b]=off(ax*(hold?.88:1),lean+f*1.05);B.obox(a,sh-.45+fy*1.1,b,.042,.045,.045,ang,col.skin)}}
 // cou et tête (regarde autour, cligne des yeux)
 const ha=ang+(ex.look||0),hc=Math.cos(ha),hs=Math.sin(ha),hoff=(lx,lz)=>[x+(lean*1.3)*sn+lx*hc+lz*hs,z+(lean*1.3)*c-lx*hs+lz*hc];
 {const [a,b]=hoff(0,0);B.obox(a,sh+.05,b,.05,.05,.05,ang,col.skin)}
 const hy=sh+.2*k0;{const [a,b]=hoff(0,0);B.obox(a,hy,b,.125,.135,.125,ha,col.skin)}
 const blink=((t*.37+id*.13)%1)<.04;
 for(const e of [-.05,.05]){const [a,b]=hoff(e,.126);B.obox(a,hy+.025,b,.024,blink?.004:.026,.004,ha,C.white);const [p,q]=hoff(e,.129);if(!blink)B.obox(p,hy+.02,q,.013,.016,.004,ha,C.dark);
  const [bx,bz]=hoff(e,.128);B.obox(bx,hy+.068,bz,.03,.008,.004,ha,mix(hair,[0,0,0],.2))}
 {const [a,b]=hoff(0,.135);B.obox(a,hy-.015,b,.018,.025,.014,ha,mix(col.skin,[.55,.3,.25],.25))}
 {const [a,b]=hoff(0,.127);B.obox(a,hy-.065,b,.036,.008,.004,ha,mix(col.skin,[.5,.1,.1],.5))}
 if(id%5===2){const [a,b]=hoff(0,.133);B.obox(a,hy+.025,b,.105,.006,.003,ha,C.dark)}
 if(id%7===3&&st!==1&&st!==3&&!col.apron){const [a,b]=hoff(0,.105);B.obox(a,hy-.085,b,.115,.045,.03,ha,hair)}
 // cheveux
 {const [a,b]=hoff(0,0);B.obox(a,hy+.15,b,.132,.035,.132,ha,hair)}{const [a,b]=hoff(0,-.05);B.obox(a,hy+.04,b,.132,.1,.085,ha,hair)}
 if(st===1){const [a,b]=hoff(0,-.1);B.obox(a,hy-.12,b,.12,.18,.04,ha,hair)}
 if(st===2){const [a,b]=hoff(0,-.14);B.obox(a,hy+.12,b,.06,.06,.05,ha,hair)}
 if(st===3){const [a,b]=hoff(0,-.13);B.obox(a,hy-.02,b,.04,.12,.04,ha,hair)}
 if(st===4){{const [a,b]=hoff(0,0);B.obox(a,hy+.18,b,.137,.05,.137,ha,col.shirt)}const [a,b]=hoff(0,.17);B.obox(a,hy+.14,b,.12,.012,.07,ha,col.shirt)}
 // objets portés
 const [fx,fz]=off(0,lean+.33);
 if(carry==='carton')B.obox(fx,sh-.32,fz,.2,.16,.14,ang,C.carton,C.cartonT);
 if(carry==='pallet'){const [px,pz]=off(0,.75);B.obox(px,.07,pz,.42,.07,.42,ang,C.wood,C.woodD);B.obox(px,.42,pz,.38,.28,.38,ang,C.carton,C.cartonT);B.obox(px,.72,pz,.3,.03,.3,ang,mix(C.cartonT,C.white,.3));const [hx,hz]=off(0,.3);B.obox(hx,.55,hz,.03,.45,.03,ang,C.red);B.obox(hx,.95,hz,.14,.03,.03,ang,C.dark)}
 if(carry==='basket'){const [bx2,bz2]=off(tw+.08,lean+.07);B.obox(bx2,sh-.6,bz2,.13,.07,.09,ang,C.red);B.obox(bx2,sh-.5,bz2,.13,.01,.01,ang,C.red)}
 if(carry==='mop'){const sw=Math.sin(phase)*.2,[mx2,mz2]=off(.1+sw,.42);B.obox(mx2,.55,mz2,.02,.55,.02,ang,C.woodD);B.obox(mx2,.04,mz2,.14,.04,.06,ang,rgb('#4aa3c8'))}}
// cycle de marche lié à la distance parcourue (les pieds ne glissent pas), amplitude lissée à l'arrêt
const gait=new Map();
function walk(a,x,z,dt){let g=gait.get(a.id);if(!g){g={x,z,ph:a.id,amp:0};gait.set(a.id,g)}const d=Math.hypot(x-g.x,z-g.z);g.x=x;g.z=z;
 if(d<1.5)g.ph+=d*5.4;g.amp+=((d>.002?1:0)-g.amp)*Math.min(1,dt*8);return g}
const STAFF_COL={rayon:{shirt:C.orange,pants:C.dark,skin:rgb('#e9bf98'),hair:rgb('#3b2a20')},menage:{shirt:rgb('#4db08a'),pants:rgb('#2f5f4d'),skin:rgb('#a87452'),hair:rgb('#1e1a18')}};
// places de la file d'attente : tout droit devant la caisse tant que c'est libre, sinon les cases libres voisines
function queueSlots(S,it,n){const L=E.layout(S),[dx,dy]=E.DIRS[it.r],f=E.front(it)[0],out=[],used=new Set(),W2=D.LOT_W;let cx=f[0],cy=f[1],step=.7;
 const ok=(x,y)=>x>=0&&y>=0&&x<W2&&y<D.LOT_H&&L.pc[y*W2+x];
 for(let k=0;k<n;k++){const px=f[0]+.5+dx*k*step,pz=f[1]+.5+dy*k*step,gx=Math.floor(px),gy=Math.floor(pz);
  if(ok(gx,gy)){out.push([px,pz,Math.atan2(-dx,-dy)]);used.add(gy*W2+gx);continue}
  // sinon : virage vers la case libre la plus proche de la dernière place
  const [lx,lz]=out.length?out[out.length-1]:[f[0]+.5,f[1]+.5];let best=null;
  for(const [ax,ay] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=Math.floor(lx+ax*step*1.4),y=Math.floor(lz+ay*step*1.4);if(ok(x,y)&&!used.has(y*W2+x)){best=[lx+ax*step,lz+ay*step,Math.atan2(-ax,-ay)];used.add(y*W2+x);break}}
  out.push(best||[lx,lz,0])}return out}
const SHADOW=rgb('#000000');
function shadow(B,x,z,r=.26){B.tile(x-r,z-r*.8,x+r,z+r*.8,.03,mix(C.tileB,SHADOW,.28))}
// caddie poussé devant soi, rempli selon les articles
function cart(B,x,z,ang,units,id){const c=Math.cos(ang),sn=Math.sin(ang),P=(lx,lz)=>[x+lx*c+lz*sn,z-lx*sn+lz*c],m=C.metal;
 for(const [lx,lz] of [[-.2,.05],[.2,.05],[-.2,.62],[.2,.62]]){const [wx,wz]=P(lx,lz);B.obox(wx,.05,wz,.03,.05,.03,ang,C.dark)}
 const [bx,bz]=P(0,.36);B.obox(bx,.18,bz,.2,.03,.3,ang,m);B.obox(bx,.62,bz,.23,.2,.32,ang,mix(m,[1,1,1],.25),mix(m,C.dark,.1));
 const [hx,hz]=P(0,.0);B.obox(hx,.95,hz,.24,.02,.02,ang,C.red);
 const n=Math.min(8,Math.ceil(units/2));for(let k=0;k<n;k++){const [px,pz]=P(-.12+(k%3)*.12,.2+Math.floor(k/3)*.14),col=[C.red,C.yellow,C.green,C.blue,C.orange][(id+k)%5];B.obox(px,.86+((k*5)%3)*.02,pz,.05,.06,.05,ang+k,col)}}
function car(B,x,z,ang,col){const c=Math.cos(ang),sn=Math.sin(ang),P=(lx,lz)=>[x+lx*c+lz*sn,z-lx*sn+lz*c];
 B.obox(x,.42,z,.58,.27,1.3,ang,col,mix(col,[1,1,1],.15));const [cx,cz]=P(0,-.12);B.obox(cx,.9,cz,.51,.23,.74,ang,C.glass,col);B.obox(cx,1.14,cz,.5,.02,.7,ang,col);
 for(const [lx,lz] of [[-.56,.82],[.56,.82],[-.56,-.82],[.56,-.82]]){const [wx,wz]=P(lx,lz);B.obox(wx,.3,wz,.1,.3,.3,ang,rgb('#25262a'))}
 for(const lx of [-.38,.38]){const [hx,hz]=P(lx,1.31);B.obox(hx,.5,hz,.13,.07,.02,ang,rgb('#fff6c8'));const [tx,tz]=P(lx,-1.31);B.obox(tx,.5,tz,.16,.06,.02,ang,C.red)}}
function bus(B,x,z,ang){const c=Math.cos(ang),sn=Math.sin(ang),P=(lx,lz)=>[x+lx*c+lz*sn,z-lx*sn+lz*c],body=rgb('#f2c230');
 B.obox(x,1.55,z,1,1.25,5.5,ang,body,C.white);B.obox(x,1.95,z,1.02,.4,5.3,ang,C.glass);
 for(const lz of [-3.6,3.4]){for(const lx of [-.92,.92]){const [wx,wz]=P(lx,lz);B.obox(wx,.4,wz,.12,.4,.45,ang,rgb('#25262a'))}}
 const [fx,fz]=P(0,5.51);B.obox(fx,1.9,fz,.88,.55,.02,ang,C.glass);const [sx,sz]=P(0,5.52);B.obox(sx,2.65,sz,.75,.15,.02,ang,rgb('#2f6f45'))}
function truck(B,x,z,ang,open){const c=Math.cos(ang),sn=Math.sin(ang),P=(lx,lz)=>[x+lx*c+lz*sn,z-lx*sn+lz*c];
 const [bx,bz]=P(0,-1.2);B.obox(bx,1.75,bz,.95,1.3,3,ang,C.white,rgb('#ececec'));const [sx,sz]=P(0,-1.2);B.obox(sx,1.5,sz,.97,.18,2.9,ang,rgb('#3f7a4f'));
 const [cx,cz]=P(0,2.45);B.obox(cx,1.2,cz,.88,.8,.75,ang,rgb('#3f7a4f'),rgb('#4f8f5f'));const [wx,wz]=P(0,3.21);B.obox(wx,1.45,wz,.76,.35,.02,ang,C.glass);
 for(const lz of [-3.2,-1.2,2.4])for(const lx of [-.82,.82]){const [px,pz]=P(lx,lz);B.obox(px,.4,pz,.13,.4,.42,ang,rgb('#25262a'))}
 if(open){for(const k of [-1,1]){const [dx,dz]=P(k*1.4,-4.35);B.obox(dx,1.75,dz,.04,1.25,.55,ang+k*Math.PI/2*.0,rgb('#dcdcdc'))}const [ix,iz]=P(0,-3.9);B.obox(ix,1.75,iz,.88,1.15,.3,ang,rgb('#6b5a48'))}
 else{const [rx,rz]=P(0,-4.21);B.obox(rx,1.75,rz,1.1,1.25,.02,ang,rgb('#dcdcdc'))}}
export function buildAgents(B,S,R,v,time){B.reset();B.setYaw(v.yaw);
 if(R.truck)truck(B,R.truck.x,R.truck.z,R.truck.ang,R.truck.st==='unload');
 for(const c of R.cars||[])car(B,c.x,c.z,c.ang,c.col);if(R.bus)bus(B,R.bus.x,R.bus.z,R.bus.ang);
 // portes coulissantes de l'entrée : s'ouvrent quand quelqu'un approche
 const ex=S.ent+1,ez=S.fy+1;let near=0;for(const a of R.agents)if(Math.abs(a.x-ex)<1.8&&Math.abs(a.y-ez)<2.2)near=1;
 R.door=(R.door||0)+((near?1:0)-(R.door||0))*Math.min(1,(v.dt||.016)*6);const o=R.door*.9;
 if(!v.near.S||true){const h=v.near.S?.55:2.3;B.box(S.ent-o,0,ez+.06,S.ent+1-o,h,ez+.12,C.glass,mix(C.glass,C.metal,.4));B.box(S.ent+1+o,0,ez+.06,S.ent+2+o,h,ez+.12,C.glass,mix(C.glass,C.metal,.4))}
 // personnel à son poste (caisse, comptoir) : animé
 const paying=new Set(R.agents.filter(a=>a.st==='pay').map(a=>a.item));
 for(const it of S.items){const k=D.ITEM[it.t].kind;if((k!=='checkout'&&k!=='counter')||!E.manned(S,it))continue;const F=frame(it);
  if(k==='checkout'){const [x,z]=F.m(1.75,.3);shadow(B,x,z,.22);person(B,x,z,F.ang+(paying.has(it.id)?Math.sin(time*7)*.5:0),{shirt:rgb('#3f7fcf'),pants:C.dark,skin:rgb('#f0c8a0'),hair:C.skinH,style:it.id%5},paying.has(it.id)?time*10:0,null,.9,paying.has(it.id),0,{amp:0,t:time,id:it.id,look:paying.has(it.id)?0:Math.sin(time*.5+it.id)*.5})}
  else{const base={butcher:rgb('#c2433f'),fish:rgb('#3f78b8'),cheese:rgb('#e8b93c'),bakery:rgb('#a46a3f')}[it.t],sway=Math.sin(time*1.3+it.id)*.6;const [x,z]=F.m(1.5+sway,.85);shadow(B,x,z);
   person(B,x,z,F.ang+Math.sin(time*.9+it.id)*.3,{shirt:C.white,pants:C.dark,skin:rgb('#f0c8a0'),hair:C.skinH,style:4,apron:base},time*4,null,1,false,0,{amp:Math.min(1,Math.abs(Math.cos(time*1.3+it.id))*1.5),t:time,id:it.id,reach:Math.max(0,Math.sin(time*2.1+it.id))*.6})}}
 for(const a of R.agents){let x=a.x,z=a.y,ang=a.dir||0;
  if(a.k==='c'&&(a.st==='queue'||a.st==='pay')){const it=S.items.find(o=>o.id===a.item),k=E.queueIndex(R,a);if(it&&k>=0&&a.nx<0){const sl=queueSlots(S,it,k+1)[k];if(sl){x=sl[0];z=sl[1];ang=sl[2]}}}
  else if(a.k==='c'){const o=a.id*2654435761>>>0;x+=((o%7)-3)*.05;z+=(((o>>3)%7)-3)*.05}
  const g=walk(a,x,z,v.dt||.016),ph=g.ph,amp=g.amp,bob=Math.abs(Math.sin(ph))*.035*amp;
  // au rayon : face au meuble, bras tendu ; à l'arrêt : regarde autour de soi
  let reach=0,look=amp<.3?Math.sin(time*.55+a.id*1.7)*.55*(1-amp):0;
  if(a.st==='pick'||a.st==='put'||a.st==='take'){const it=S.items.find(o=>o.id===(a.st==='pick'?a.item:a.task?.f));if(it){const F=frame(it),[cx2,cz2]=F.m(F.d.w/2,F.d.d/2);ang=Math.atan2(cx2-x,cz2-z)}reach=.55+Math.sin(time*5+a.id)*.4;look=0}
  shadow(B,x,z);
  if(a.k==='c'){if(a.hasCart){const c=Math.cos(ang),sn=Math.sin(ang);cart(B,x+sn*.3,z+c*.3,ang,a.basket.units,a.id)}const h=a.id*2654435761>>>0;
   person(B,x,z,ang,{shirt:a.shirt,pants:a.pants,skin:a.skin,hair:a.hair||C.skinH,style:a.style,scale:a.scale,outfit:h%5===4?0:h%5,long:h%3===0},ph,a.hasCart?'push':a.basket.units?'basket':null,1,false,bob,{amp,look,reach,t:time,id:a.id})}
  else{const work=a.st==='clean';person(B,x,z,ang+(work?Math.sin(time*6)*.35:0),STAFF_COL[a.role],work?time*8:ph,a.role==='menage'?'mop':a.carry?.pallet?'pallet':a.carry?'carton':null,1,false,bob,{amp:work?.4:amp,look,reach:a.carry?.pallet?0:reach,t:time,id:a.id})}}
 if(gait.size>400){const ids=new Set(R.agents.map(a=>a.id));for(const k of gait.keys())if(!ids.has(k))gait.delete(k)}}

// ---------------------------------------------------------------- aperçu de placement
export function buildAccess(B,cells,v){B.reset();B.setYaw(v.yaw);for(const [x,y] of cells||[]){B.tile(x+.06,y+.06,x+.94,y+.94,.025,rgb('#f7c948'));B.tile(x+.2,y+.2,x+.8,y+.8,.03,rgb('#fff4cf'))}}
export function buildGhost(B,S,g,v){B.reset();B.setYaw(v.yaw);if(!g)return;
 if(g.item){item(B,S,{...g.item,stock:0,id:-1,cat:null},{...v,sel:null});return}
 for(const [x,y] of g.cells||[])B.box(x+.04,0,y+.04,x+.96,g.h||.08,y+.96,g.col||C.white)}
