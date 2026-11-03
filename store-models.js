// BagaStore : modèles 3D (pavés colorés, style maquette) du terrain, du magasin, des meubles et des personnages.
import * as D from './store-data.js';
import * as E from './store-engine.js';
const W=D.LOT_W,H=D.LOT_H;
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
const trees=(()=>{const o=[];let s=7;const r=()=>(s=(s*16807)%2147483647)/2147483647;for(let k=0;k<70;k++)o.push([r()*(W+16)-8,r()*(H+10)-12,.7+r()*.6]);return o})();
export function buildStatic(B,S,v){const b=S.b,L=E.layout(S);B.reset();B.setYaw(v.yaw);
 // herbe, parking, route
 B.tile(-30,-30,W+30,H+30,-.02,C.grass);
 const px0=b.x0-2,px1=b.x1+2,fy=S.fy+1;B.tile(px0,fy,px1,H-3,0,C.asphalt);B.tile(-30,H-3,W+30,H,0,C.road);
 for(let x=-30;x<W+30;x+=3)B.tile(x,H-1.58,x+1.6,H-1.42,.005,C.line);
 for(let x=px0+1;x<px1-1;x+=3)if(x>S.ent+3||x+3<S.ent-1){B.tile(x,fy+2.5,x+.08,fy+6.5,.005,C.line)}
 const ins=(x,y)=>E.inside(S,x,y);
 // trottoir autour du bâtiment
 for(let y=b.y0-1;y<=b.y1;y++)for(let x=b.x0-1;x<=b.x1;x++){if(ins(x,y))continue;let near=false;for(let dy=-1;dy<=1&&!near;dy++)for(let dx=-1;dx<=1;dx++)if(ins(x+dx,y+dy)){near=true;break}if(near)B.tile(x,y,x+1,y+1,.002,C.walk)}
 for(const [x,z,s] of trees){if(x>b.x0-3&&x<b.x1+3&&z>b.y0-3&&z<H)continue;if(z>H-4&&z<H+1)continue;tree(B,x,z,s)}
 // sol (carrelage, béton dans la réserve, salissures)
 for(let y=b.y0;y<b.y1;y++)for(let x=b.x0;x<b.x1;x++){if(!ins(x,y))continue;const i=E.idx(x,y),r=S.zone[i],alt=(x+y)&1;
  let c=r?(alt?C.resA:C.resB):(alt?C.tileA:C.tileB);const d=S.dirt?S.dirt[i]:0;if(d>.12)c=mix(c,C.dirt,Math.min(.55,(d-.12)*.9));
  if(v.zones&&r)c=mix(c,[.55,.7,.95],.35);B.tile(x,y,x+1,y+1,.01,c)}
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
 for(const it of S.items)item(B,S,it,v)}
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
  // camion garé derrière le quai
  L(.25,.45,-7.2,w-.25,3.1,-.25,C.white,rgb('#e6e6e6'));L(.25,1.4,-7.2,w-.25,1.75,-.25,C.red);L(.35,.45,-8.9,w-.35,2.5,-7.25,C.red,rgb('#b83a32'));L(.5,1.6,-8.95,w-.5,2.3,-8.85,rgb('#9fd3ff'));
  for(const z of [-1.6,-2.6,-6.3,-8.3])for(const x of [.15,w-.45])L(x,0,z,x+.3,.6,z+.65,rgb('#2b2b2f'));break}
 case 'plant':L(.3,0,.3,.7,.35,.7,C.pot);L(.2,.35,.2,.8,.95,.8,C.leaf);L(.32,.95,.32,.68,1.25,.68,C.leaf2);break;
 case 'lamp':L(.45,0,.45,.55,2,.55,C.dark);L(.3,2,.3,.7,2.2,.7,C.warm);L(.35,0,.35,.65,.08,.65,C.dark);break;
 case 'bin':L(.32,0,.32,.68,.75,.68,rgb('#5aa36a'));L(.3,.75,.3,.7,.82,.7,rgb('#3e7f4f'));break;
 case 'camera':L(.45,0,.45,.55,2.5,.55,C.metal);L(.35,2.35,.4,.65,2.55,.75,C.dark);L(.45,2.4,.75,.55,2.5,.8,C.red);break;
 case 'gate':L(.05,0,.4,.17,1.6,.6,C.metal);L(.83,0,.4,.95,1.6,.6,C.metal);L(.05,1.55,.45,.95,1.6,.55,rgb('#9aa3ad'));break}
}

// ---------------------------------------------------------------- personnages
// ang : direction du regard (0 = vers +z). phase : pas de marche. carry : 'carton' | 'basket' | 'mop'
export function person(B,x,z,ang,col,phase=0,carry=null,sit=1,scan=false,bob=0){const s=Math.sin(phase)*.18,c=Math.cos(ang),sn=Math.sin(ang),off=(lx,lz)=>[x+lx*c+lz*sn,z-lx*sn+lz*c];
 const leg=.8*sit;
 for(const k of [-1,1]){const [lx,lz]=off(k*.09,k*s*.5);B.obox(lx,leg/2,lz,.06,leg/2,.07,ang,col.pants)}
 const ty=leg+.28+bob;B.obox(x,ty,z,.18,.28,.11,ang,col.shirt,mix(col.shirt,[1,1,1],.15));
 if(col.apron){const [ax,az]=off(0,.115);B.obox(ax,ty-.05,az,.15,.3,.01,ang,col.apron)}
 // bras : balancés en marchant, tendus vers le caddie, ou en train de scanner
 for(const k of [-1,1]){if(carry==='push'){const [lx,lz]=off(k*.19,.2);B.obox(lx,ty+.02,lz,.05,.06,.2,ang,col.shirt)}
  else if(scan&&k===1){const [lx,lz]=off(.22,.14+Math.sin(phase)*.06);B.obox(lx,ty+.05,lz,.05,.06,.18,ang,col.shirt)}
  else{const [lx,lz]=off(k*.23,-k*s*.4);B.obox(lx,ty+.02,lz,.05,.24,.06,ang,col.shirt)}}
 B.obox(x,ty+.42,z,.12,.13,.12,ang,col.skin);B.obox(x,ty+.57,z,.13,.04,.13,ang,col.hair||C.skinH);
 const [ex,ez]=off(.06,.12),[fx2,fz2]=off(-.06,.12);B.obox(ex,ty+.45,ez,.015,.02,.01,ang,C.dark);B.obox(fx2,ty+.45,fz2,.015,.02,.01,ang,C.dark);
 const [fx,fz]=off(0,.3);
 if(carry==='carton')B.obox(fx,ty+.05,fz,.2,.16,.14,ang,C.carton,C.cartonT);
 if(carry==='basket'){const [bx,bz]=off(.26,.05);B.obox(bx,ty-.12,bz,.12,.08,.09,ang,C.red)}
 if(carry==='mop'){const sw=Math.sin(phase)*.2,[mx,mz]=off(.28+sw,.32);B.obox(mx,.55,mz,.02,.55,.02,ang,C.woodD);B.obox(mx,.04,mz,.14,.04,.06,ang,rgb('#4aa3c8'))}}
const STAFF_COL={rayon:{shirt:C.orange,pants:C.dark,skin:rgb('#e9bf98'),hair:rgb('#3b2a20')},menage:{shirt:rgb('#4db08a'),pants:rgb('#2f5f4d'),skin:rgb('#a87452'),hair:rgb('#1e1a18')}};
const SHADOW=rgb('#000000');
function shadow(B,x,z,r=.26){B.tile(x-r,z-r*.8,x+r,z+r*.8,.03,mix(C.tileB,SHADOW,.28))}
// caddie poussé devant soi, rempli selon les articles
function cart(B,x,z,ang,units,id){const c=Math.cos(ang),sn=Math.sin(ang),P=(lx,lz)=>[x+lx*c+lz*sn,z-lx*sn+lz*c],m=C.metal;
 for(const [lx,lz] of [[-.2,.05],[.2,.05],[-.2,.62],[.2,.62]]){const [wx,wz]=P(lx,lz);B.obox(wx,.05,wz,.03,.05,.03,ang,C.dark)}
 const [bx,bz]=P(0,.36);B.obox(bx,.18,bz,.2,.03,.3,ang,m);B.obox(bx,.62,bz,.23,.2,.32,ang,mix(m,[1,1,1],.25),mix(m,C.dark,.1));
 const [hx,hz]=P(0,.0);B.obox(hx,.95,hz,.24,.02,.02,ang,C.red);
 const n=Math.min(8,Math.ceil(units/2));for(let k=0;k<n;k++){const [px,pz]=P(-.12+(k%3)*.12,.2+Math.floor(k/3)*.14),col=[C.red,C.yellow,C.green,C.blue,C.orange][(id+k)%5];B.obox(px,.86+((k*5)%3)*.02,pz,.05,.06,.05,ang+k,col)}}
export function buildAgents(B,S,R,v,time){B.reset();B.setYaw(v.yaw);
 // portes coulissantes de l'entrée : s'ouvrent quand quelqu'un approche
 const ex=S.ent+1,ez=S.fy+1;let near=0;for(const a of R.agents)if(Math.abs(a.x-ex)<1.8&&Math.abs(a.y-ez)<2.2)near=1;
 R.door=(R.door||0)+((near?1:0)-(R.door||0))*Math.min(1,(v.dt||.016)*6);const o=R.door*.9;
 if(!v.near.S||true){const h=v.near.S?.55:2.3;B.box(S.ent-o,0,ez+.06,S.ent+1-o,h,ez+.12,C.glass,mix(C.glass,C.metal,.4));B.box(S.ent+1+o,0,ez+.06,S.ent+2+o,h,ez+.12,C.glass,mix(C.glass,C.metal,.4))}
 // personnel à son poste (caisse, comptoir) : animé
 const paying=new Set(R.agents.filter(a=>a.st==='pay').map(a=>a.item));
 for(const it of S.items){const k=D.ITEM[it.t].kind;if((k!=='checkout'&&k!=='counter')||!E.manned(S,it))continue;const F=frame(it);
  if(k==='checkout'){const [x,z]=F.m(1.75,.3);shadow(B,x,z,.22);person(B,x,z,F.ang+(paying.has(it.id)?Math.sin(time*7)*.5:0),{shirt:rgb('#3f7fcf'),pants:C.dark,skin:rgb('#f0c8a0'),hair:C.skinH},paying.has(it.id)?time*10:0,null,.9,true)}
  else{const base={butcher:rgb('#c2433f'),fish:rgb('#3f78b8'),cheese:rgb('#e8b93c'),bakery:rgb('#a46a3f')}[it.t],sway=Math.sin(time*1.3+it.id)*.6;const [x,z]=F.m(1.5+sway,.85);shadow(B,x,z);
   person(B,x,z,F.ang+Math.sin(time*.9+it.id)*.3,{shirt:C.white,pants:C.dark,skin:rgb('#f0c8a0'),hair:C.white,apron:base},Math.abs(Math.cos(time*1.3+it.id))>.3?time*6:0)}}
 for(const a of R.agents){let x=a.x,z=a.y,ang=a.dir||0;
  if(a.k==='c'&&(a.st==='queue'||a.st==='pay')){const it=S.items.find(o=>o.id===a.item),k=E.queueIndex(R,a);if(it&&k>=0&&a.nx<0){const [dx,dy]=E.DIRS[it.r];const f=E.front(it)[0];x=f[0]+.5+dx*k*(a.cart?1:.7);z=f[1]+.5+dy*k*(a.cart?1:.7);ang=Math.atan2(-dx,-dy)}}
  const moving=a.nx>=0,ph=moving?time*9+a.id:0,bob=moving?Math.abs(Math.sin(time*9+a.id))*.03:0;
  shadow(B,x,z);
  if(a.k==='c'){if(a.cart){const c=Math.cos(ang),sn=Math.sin(ang);cart(B,x+sn*.3,z+c*.3,ang,a.basket.units,a.id)}
   person(B,x,z,ang,{shirt:a.shirt,pants:a.pants,skin:a.skin,hair:a.id%3?C.skinH:rgb('#d9b25b')},ph,a.cart?'push':a.basket.units?'basket':null,1,false,bob)}
  else{const work=a.st==='clean'||a.st==='take'||a.st==='put';person(B,x,z,ang+(a.st==='clean'?Math.sin(time*6)*.35:0),STAFF_COL[a.role],work?time*8:ph,a.role==='menage'?'mop':a.carry||a.st==='put'?'carton':null,a.st==='put'||a.st==='take'?.92:1,false,bob)}}}

// ---------------------------------------------------------------- aperçu de placement
export function buildGhost(B,S,g,v){B.reset();B.setYaw(v.yaw);if(!g)return;
 if(g.item){item(B,S,{...g.item,stock:0,id:-1,cat:null},{...v,sel:null});return}
 for(const [x,y] of g.cells||[])B.box(x+.04,0,y+.04,x+.96,g.h||.08,y+.96,g.col||C.white)}
