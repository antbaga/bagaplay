// BagaStore : modèles 3D de l'extension « centre commercial » (rayons spécialisés, boutiques, équipements de la galerie).
// Même repère que store-models.js : largeur d.w sur x, profondeur d.d sur z, le devant (côté clients) vers +z.
const rgb=h=>[parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255];
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const lit=(c,t=.25)=>mix(c,[1,1,1],t);
const P={wood:rgb('#c58e5a'),woodD:rgb('#8f6038'),woodL:rgb('#e2b98a'),metal:rgb('#c9ced6'),steel:rgb('#9aa2ad'),dark:rgb('#3b4048'),black:rgb('#1d2026'),white:rgb('#f6f7f8'),
 glass:rgb('#bfe6f2'),screen:rgb('#5fb7ff'),gold:rgb('#e2b84a'),silver:rgb('#d9dde3'),red:rgb('#d9493f'),green:rgb('#4fae5c'),leaf:rgb('#5fa84f'),leaf2:rgb('#4c9442'),
 pot:rgb('#cf7a52'),soil:rgb('#5b4232'),water:rgb('#59b4e0'),cream:rgb('#f3e7cf'),pink:rgb('#ef8fb5'),blue:rgb('#3f7fcf'),yellow:rgb('#f5c542'),orange:rgb('#f0913a'),
 tile:rgb('#ece6dc'),tileB:rgb('#ddd5c7'),red2:rgb('#a8312b')};
const VIVID=[rgb('#e8463a'),rgb('#f5c542'),rgb('#3f7fcf'),rgb('#5bbf6a'),rgb('#a35fc8'),rgb('#f0913a'),rgb('#2fb7b0'),rgb('#ef8fb5')];
const hash=(a,b=0)=>((a*73856093)^(b*19349663))>>>0;

// boutique : sol, murs du fond et des côtés, poteaux et bandeau d'enseigne en façade
function shell(L,w,d,sign,floor,wall,opt={}){const s=rgb(sign),wl=wall||rgb('#f1ebe2');
 L(0,0,0,w,.02,d,floor||P.tile);if(opt.tiles)for(let x=0;x<w;x++)for(let z=0;z<d;z++)if((x+z)&1)L(x,.02,z,x+1,.022,z+1,opt.tiles);
 L(0,0,0,w,2.7,.12,wl,lit(wl,.1));L(0,0,0,.1,2.7,d,wl,lit(wl,.1));L(w-.1,0,0,w,2.7,d,wl,lit(wl,.1));
 L(0,0,d-.14,.14,2.7,d,s);L(w-.14,0,d-.14,w,2.7,d,s);L(0,2.25,d-.16,w,2.75,d,s,lit(s,.15));
 L(w*.22,2.36,d,w*.78,2.62,d+.02,P.white);for(let k=0;k<5;k++)L(w*.26+k*w*.1,2.42,d+.02,w*.26+k*w*.1+w*.06,2.56,d+.03,s);
}
const counter=(L,x0,x1,z0,z1,col,top=P.white)=>{L(x0,0,z0,x1,.95,z1,col,top);L(x0-.02,.95,z0-.02,x1+.02,1.0,z1+.02,top)};
const chair=(L,x,z,col,face=0)=>{L(x-.18,0,z-.18,x-.14,.45,z-.14,P.dark);L(x+.14,0,z-.18,x+.18,.45,z-.14,P.dark);L(x-.18,0,z+.14,x-.14,.45,z+.18,P.dark);L(x+.14,0,z+.14,x+.18,.45,z+.18,P.dark);
 L(x-.2,.45,z-.2,x+.2,.5,z+.2,col);const b=face?[x-.2,z+.16,x+.2,z+.2]:[x-.2,z-.2,x+.2,z-.16];L(b[0],.5,b[1],b[2],.9,b[3],col)};
const table=(L,x,z,r,col)=>{L(x-.04,0,z-.04,x+.04,.72,z+.04,P.dark);L(x-r,.72,z-r,x+r,.76,z+r,col)};
const plant=(L,x,z,s=1)=>{L(x-.15*s,0,z-.15*s,x+.15*s,.3*s,z+.15*s,P.pot);L(x-.22*s,.3*s,z-.22*s,x+.22*s,.75*s,z+.22*s,P.leaf,lit(P.leaf,.15));L(x-.13*s,.75*s,z-.13*s,x+.13*s,1*s,z+.13*s,P.leaf2)};

export function mallItem(B,S,it,F,L,h){const d=F.d,w=d.w,dd=d.d,fill=h.fill,col=k=>h.catCol(it.cat||d.cats?.[0],k),seed=it.id;
 const goods=(n,x0,x1,z0,z1,y,ht,cls)=>{const per=Math.max(1,Math.round((x1-x0)/.3)),m=Math.min(per,n),sw=(x1-x0)/per;for(let k=0;k<m;k++){const c=cls?cls(k):col(k+seed);L(x0+k*sw+.03,y,z0,x0+(k+1)*sw-.03,y+ht*(.8+.2*((k*7+seed)%3)/2),z1,c,lit(c,.2))}};
 const levels=(lv,x0,x1,z0,z1,ht,cls)=>{const per=Math.max(1,Math.round((x1-x0)/.3)),tot=per*lv.length,n=Math.round(fill*tot);lv.forEach((y,i)=>goods(Math.max(0,Math.min(per,n-i*per)),x0,x1,z0,z1,y,ht,cls))};
 const signTop=(c)=>L(.1,d.h,.02,w-.1,d.h+.22,.1,c);
 switch(it.t){
 // ---------------------------------------------------------------- rayons spécialisés
 case 'bookcase':{L(0,0,0,w,d.h,.1,P.woodD);L(0,0,0,.07,d.h,.9,P.wood);L(w-.07,0,0,w,d.h,.9,P.wood);L(0,0,.1,w,.1,.9,P.woodD);L(0,d.h-.06,0,w,d.h,.9,P.wood);
  const lv=[.12,.5,.88,1.26,1.64],per=22,n=Math.round(fill*per*lv.length);
  for(let i=0;i<lv.length;i++){L(.07,lv[i]-.04,.1,w-.07,lv[i],.88,P.wood);for(let k=0;k<per&&i*per+k<n;k++){const x=.1+k*.082,hh=.22+((k*5+i*3+seed)%4)*.03,c=col(k+i);L(x,lv[i],.22,x+.07,lv[i]+hh,.8,c,lit(c,.3))}}
  signTop(rgb('#2c5fa8'));break}
 case 'press':{L(.1,0,.1,.9,.25,.9,P.dark);for(let i=0;i<4;i++){const y=.3+i*.28,z=.15+i*.17;L(.08,y,z,.92,y+.04,z+.22,P.metal);
   for(let k=0;k<3&&(i*3+k)<Math.round(fill*12);k++){const c=col(k+i);L(.12+k*.27,y+.04,z+.02,.36+k*.27,y+.3,z+.06,c,lit(c,.3))}}
  L(.42,0,.42,.58,1.5,.58,P.dark);L(.2,1.35,.45,.8,1.5,.55,rgb('#2c5fa8'));break}
 case 'petshelf':{L(0,0,0,w,d.h,.12,P.metal);L(0,0,0,.06,d.h,.95,P.metal);L(w-.06,0,0,w,d.h,.95,P.metal);L(0,0,.1,w,.12,.95,P.dark);
  const lv=[.14,.55,.96,1.37];for(const y of lv)L(.06,y-.04,.12,w-.06,y,.95,P.white);levels(lv,.06,w-.06,.22,.9,.32);signTop(P.orange);
  L(w/2-.15,d.h+.05,.0,w/2+.15,d.h+.18,.02,P.white);break}
 case 'aquarium':{L(0,0,0,w,.7,1,P.dark,P.black);for(const [x0,x1] of [[.05,.98],[1.02,1.95]]){L(x0,.7,.12,x1,1.6,.9,P.water,lit(P.water,.35));L(x0+.05,.7,.15,x1-.05,.78,.87,rgb('#d8c89a'));
   for(let k=0;k<4;k++){const x=x0+.12+((k*37+seed)%7)/7*(x1-x0-.3),y=.9+((k*13)%5)*.12,z=.3+((k*29)%5)*.1;const c=VIVID[(k+seed)%VIVID.length];L(x,y,z,x+.14,y+.06,z+.05,c)}
   L(x0+.1,.78,.25,x0+.16,1.15,.31,P.leaf);L(x1-.2,.78,.6,x1-.14,1.3,.66,P.leaf2)}
  L(0,1.6,0,w,1.8,1,P.dark);L(.1,1.62,.95,w-.1,1.76,1.0,P.screen);break}
 case 'toyshelf':{const fr=rgb('#f5c542');L(0,0,0,w,d.h,.12,fr);L(0,0,0,.07,d.h,.95,fr);L(w-.07,0,0,w,d.h,.95,fr);L(0,0,.1,w,.12,.95,rgb('#e2462f'));
  const lv=[.14,.6,1.06];for(const y of lv)L(.07,y-.04,.12,w-.07,y,.95,P.white);levels(lv,.07,w-.07,.2,.85,.38,k=>VIVID[(k+seed)%VIVID.length]);
  if(fill>.3){const tb=rgb('#a8733f');L(.3,1.5,.4,.62,1.78,.7,tb);L(.36,1.78,.45,.56,1.95,.65,tb);L(.33,1.92,.48,.4,1.99,.55,tb);L(.52,1.92,.48,.59,1.99,.55,tb)}
  L(1.2,1.5,.35,1.7,1.65,.75,P.blue);L(1.25,1.65,.45,1.65,1.8,.65,P.red);break}
 case 'plants':{L(.05,0,.05,w-.05,.35,dd-.05,P.woodD);L(.25,.35,.25,w-.25,.7,dd*.55,P.wood);L(.45,.7,.45,w-.45,1.0,dd*.4,P.woodL);
  const spots=[];for(let i=0;i<4;i++)spots.push([.25+i*.5,.35,dd-.45]);for(let i=0;i<3;i++)spots.push([.5+i*.5,.7,dd*.55-.35]);for(let i=0;i<2;i++)spots.push([.75+i*.5,1.0,dd*.4-.2]);
  const n=Math.round(fill*spots.length);spots.slice(0,n).forEach(([x,y,z],k)=>{L(x-.13,y,z-.13,x+.13,y+.2,z+.13,P.pot);L(x-.18,y+.2,z-.18,x+.18,y+.48,z+.18,k%3?P.leaf:P.leaf2,lit(P.leaf,.2));if(k%2)L(x-.06,y+.48,z-.06,x+.06,y+.56,z+.06,col(k+1))});
  L(.1,.2,dd-.06,w-.1,.32,dd-.02,P.green);break}
 case 'sportrack':{const fr=rgb('#2c4f8f');L(0,0,0,w,d.h,.12,fr);L(0,0,0,.07,d.h,.95,fr);L(w-.07,0,0,w,d.h,.95,fr);L(0,0,.1,w,.12,.95,P.dark);
  L(.07,.6,.12,w-.07,.64,.95,P.white);L(.07,1.15,.12,w-.07,1.19,.95,P.white);
  const nb=Math.round(fill*6);for(let k=0;k<nb;k++){const x=.18+k*.3,c=[P.white,P.orange,P.yellow][k%3];L(x,.12,.35,x+.24,.36,.6,c,lit(c,.2))}
  levels([.64],.07,w-.07,.25,.88,.34);const nr=Math.round(fill*4);for(let k=0;k<nr;k++){const x=.25+k*.42;L(x,1.25,.25,x+.05,1.75,.3,P.dark);L(x-.08,1.55,.24,x+.13,1.85,.31,col(k))}signTop(rgb('#2c4f8f'));break}
 case 'bikes':{L(0,0,.35,w,.06,.65,P.dark);L(.1,0,.45,.18,.9,.55,P.steel);L(w-.18,0,.45,w-.1,.9,.55,P.steel);L(.1,.85,.45,w-.1,.9,.55,P.steel);
  const nb=Math.round(fill*3);for(let k=0;k<nb;k++){const x=.4+k*.95,c=VIVID[(k+seed)%VIVID.length];
   for(const wx of [0,.62]){L(x+wx-.02,.05,.27,x+wx+.02,.62,.73,P.black);L(x+wx-.025,.3,.47,x+wx+.025,.36,.53,P.steel)}
   L(x,.32,.48,x+.62,.38,.52,c);L(x+.18,.38,.48,x+.22,.7,.52,c);L(x+.1,.68,.44,x+.3,.72,.56,P.black);L(x+.54,.38,.48,x+.58,.8,.52,c);L(x+.5,.78,.38,x+.6,.82,.62,P.dark)}
  break}
 case 'rail':{L(.08,0,.42,.14,1.5,.58,P.steel);L(w-.14,0,.42,w-.08,1.5,.58,P.steel);L(.08,1.45,.47,w-.08,1.52,.53,P.silver);L(0,0,.35,.22,.04,.65,P.dark);L(w-.22,0,.35,w,.04,.65,P.dark);
  const n=Math.round(fill*16);for(let k=0;k<n;k++){const x=.2+k*.1,c=col(k+seed);L(x,1.45,.49,x+.012,1.52,.51,P.dark);L(x-.005,.75,.3,x+.075,1.43,.7,c,lit(c,.15))}
  break}
 case 'island':{L(.3,0,.3,w-.3,.75,dd-.3,P.woodL,P.wood);const n=Math.round(fill*12);
  for(let k=0;k<Math.min(6,n);k++){const x=.45+(k%3)*.38,z=.45+Math.floor(k/3)*.62,c=col(k+seed);for(let j=0;j<3;j++)L(x,.75+j*.07,z,x+.3,.81+j*.07,z+.4,c,lit(c,.2))}
  L(w/2-.03,0,.05,w/2+.03,1.4,.11,P.steel);L(w/2-.03,0,dd-.11,w/2+.03,1.4,dd-.05,P.steel);L(w/2-.03,1.35,.05,w/2+.03,1.4,dd-.05,P.silver);
  for(let k=6;k<n;k++){const z=.15+(k-6)*.28,c=col(k);L(w/2-.3,.7,z,w/2+.3,1.33,z+.07,c)}break}
 case 'fitting':{const wl=rgb('#efe6da'),cur=rgb('#7a3b5a');L(0,0,0,w,2.2,.08,wl);L(0,0,0,.08,2.2,dd,wl);L(w-.08,0,0,w,2.2,dd,wl);L(w/2-.04,0,0,w/2+.04,2.2,dd,wl);
  for(const x0 of [.08,w/2+.04]){L(x0,.12,dd-.1,x0+(w/2-.12),2.0,dd-.05,cur,lit(cur,.15));L(x0+.2,1.2,.1,x0+.6,1.9,.12,P.glass);L(x0+.1,0,.1,x0+.35,.45,.4,P.woodL)}
  L(0,2.2,0,w,2.35,dd,wl,lit(wl,.1));L(.3,2.05,dd-.04,w-.3,2.2,dd,P.dark);break}
 case 'tvwall':{L(0,0,0,w,d.h,.15,P.dark,P.black);L(0,0,.15,w,.55,.85,P.dark,rgb('#2a2e35'));const n=Math.round(fill*6);
  for(let k=0;k<6;k++){const cx=k%3,cy=Math.floor(k/3),x0=.1+cx*.97,y0=.8+cy*.68;L(x0,y0,.15,x0+.87,y0+.56,.2,P.black);
   if(k<n){const c=mix(VIVID[(k*3+seed+Math.floor(Date.now()/4000))%VIVID.length],P.screen,.45);L(x0+.04,y0+.04,.2,x0+.83,y0+.52,.21,c,c)}}
  goods(Math.round(fill*8),.1,w-.1,.25,.8,.55,.16,()=>P.white);break}
 case 'hifi':{L(.05,0,.15,w-.05,.75,.9,P.black,P.dark);const n=Math.round(fill*4);
  if(n>0){L(.15,.75,.35,.45,1.35,.65,P.dark);L(.22,.85,.64,.38,1.0,.66,P.steel);L(.22,1.08,.64,.38,1.26,.66,P.steel)}
  if(n>1){L(w-.45,.75,.35,w-.15,1.35,.65,P.dark);L(w-.38,.85,.64,w-.22,1.0,.66,P.steel);L(w-.38,1.08,.64,w-.22,1.26,.66,P.steel)}
  if(n>2){L(.7,.75,.35,1.3,.85,.7,P.white);L(.75,.85,.4,1.25,.88,.66,P.screen)}if(n>3)L(.8,.75,.15,1.2,1.05,.3,P.black);break}
 case 'appliance':{L(.05,0,.05,w-.05,.08,dd-.05,P.dark);const n=Math.round(fill*6),spots=[[.15,.1],[1.05,.1],[1.95,.1],[.15,1.05],[1.05,1.05],[1.95,1.05]];
  spots.slice(0,n).forEach(([x,z],k)=>{const tall=k%3===0;L(x,.08,z,x+.8,tall?1.5:.88,z+.8,P.white,lit(P.white,.1));
   if(tall){L(x+.05,.9,z+.81,x+.75,.92,z+.82,P.steel);L(x+.65,.3,z+.81,x+.7,1.3,z+.84,P.steel)}else{L(x+.15,.2,z+.81,x+.65,.7,z+.82,P.dark);L(x+.25,.3,z+.82,x+.55,.6,z+.83,P.glass)}
   L(x+.25,(tall?1.5:.88)+.01,z+.3,x+.55,(tall?1.5:.88)+.02,z+.5,P.yellow)});break}
 case 'toolwall':{const pb=rgb('#c9a27a');L(0,0,0,w,d.h,.1,pb);for(let y=.4;y<d.h-.1;y+=.2)for(let x=.1;x<w;x+=.2)L(x,y,.1,x+.03,y+.03,.105,P.woodD);
  L(0,0,.1,w,.5,.9,rgb('#e8913a'),rgb('#c97a2e'));const n=Math.round(fill*12);
  for(let k=0;k<n;k++){const x=.15+(k%6)*.3,y=.75+Math.floor(k/6)*.55,c=k%4===0?P.red:k%4===1?P.orange:k%4===2?P.steel:P.dark;L(x+.08,y+.2,.1,x+.11,y+.42,.16,P.steel);L(x,y,.11,x+.2,y+.2,.2,c)}
  signTop(rgb('#e8913a'));break}
 case 'paint':{L(0,0,0,w,d.h,.12,P.white);L(0,0,0,.06,d.h,.95,P.metal);L(w-.06,0,0,w,d.h,.95,P.metal);const lv=[.12,.55,.98,1.41];for(const y of lv)L(.06,y-.04,.12,w-.06,y,.95,P.metal);
  levels(lv,.06,w-.06,.25,.85,.3,k=>VIVID[(k*5+seed)%VIVID.length]);for(let k=0;k<6;k++)L(.2+k*.27,d.h+.02,.03,.44+k*.27,d.h+.22,.08,VIVID[k]);break}
 case 'pallet':{const up=rgb('#e8792f'),bm=rgb('#2f6bc4');for(const x of [0,w/2-.05,w-.1])L(x,0,.05,x+.1,d.h,.95,up);
  const lv=[.15,1.0,1.85];for(const y of lv)L(0,y-.1,.05,w,y,.95,bm);const n=Math.round(fill*6);
  for(let k=0;k<n;k++){const lvi=Math.floor(k/2),side=k%2,x0=side?w/2+.05:.1,x1=side?w-.1:w/2-.05,y=lv[lvi];L(x0+.05,y,.12,x1-.05,y+.1,.88,P.woodL,P.wood);
   if((k+seed)%3===0)for(let j=0;j<3;j++)L(x0+.1,y+.1+j*.12,.18,x1-.1,y+.21+j*.12,.82,rgb('#bdb8ae'),rgb('#d4cfc6'));
   else if((k+seed)%3===1)for(let j=0;j<4;j++)L(x0+.08,y+.1+j*.09,.15,x1-.08,y+.18+j*.09,.85,P.woodL,lit(P.woodL,.2));
   else L(x0+.1,y+.1,.2,x1-.1,y+.5,.8,rgb('#8a8f96'),rgb('#a2a7ae'))}break}
 // ---------------------------------------------------------------- boutiques
 case 'sh_cafe':{shell(L,w,dd,d.sign,P.woodL,rgb('#efe2cf'),{tiles:mix(P.woodL,P.wood,.3)});counter(L,.3,2.3,dd-.75,dd-.25,rgb('#7a4a2e'),P.cream);
  L(.5,1.0,dd-.7,.95,1.45,dd-.35,P.steel,P.silver);L(.6,1.1,dd-.36,.85,1.3,dd-.34,P.black);for(let k=0;k<4;k++)L(1.1+k*.14,1.0,dd-.6,1.2+k*.14,1.12,dd-.5,P.white);
  L(1.6,1.0,dd-.72,2.2,1.3,dd-.3,P.glass);L(1.65,1.0,dd-.65,2.15,1.08,dd-.38,rgb('#d9a25e'));L(.4,1.4,.12,2.4,2.1,.14,P.black);for(let k=0;k<5;k++)L(.55,1.5+k*.11,.14,1.4+(k%3)*.2,1.55+k*.11,.15,P.cream);
  table(L,3.2,.8,.3,P.white);chair(L,3.2,.3,rgb('#7a4a2e'));chair(L,3.2,1.3,rgb('#7a4a2e'),1);table(L,3.2,2.0,.3,P.white);chair(L,3.65,2.0,rgb('#7a4a2e'));plant(L,.35,.35,.9);break}
 case 'sh_florist':{shell(L,w,dd,d.sign,rgb('#dfe8d6'),rgb('#eef3e8'));counter(L,.2,1.4,.3,.8,P.woodL,P.wood);L(.3,1.0,.4,.6,1.2,.65,P.dark);
  for(let r=0;r<3;r++)for(let k=0;k<5;k++){const x=.35+k*.5,z=1.25+r*.5;if(x>w-.3||z>dd-.2)continue;const c=VIVID[(k*3+r+seed)%VIVID.length];L(x-.14,0,z-.14,x+.14,.4,z+.14,P.steel);L(x-.12,.4,z-.12,x+.12,.6,z+.12,P.leaf2);L(x-.16,.6,z-.16,x+.16,.78,z+.16,c,lit(c,.3))}
  plant(L,w-.45,.45,1.3);plant(L,2.0,.45,1);break}
 case 'sh_glacier':{shell(L,w,dd,d.sign,rgb('#fbe9f0'),rgb('#fff4f8'),{tiles:rgb('#f6d9e5')});L(.25,0,dd-.85,w-.25,.95,dd-.2,P.white,P.white);
  const tubs=[rgb('#f7b8cf'),rgb('#a8e0c0'),rgb('#7a4b33'),rgb('#f6e7b0'),rgb('#c95a7a'),rgb('#f3a35c')];for(let k=0;k<6;k++){const x=.35+(k%3)*.78,z=dd-.8+Math.floor(k/3)*.3;L(x,.95,z,x+.66,1.02,z+.26,tubs[k],lit(tubs[k],.2))}
  L(.25,.95,dd-.85,w-.25,1.3,dd-.82,P.glass);L(.25,1.3,dd-.85,w-.25,1.33,dd-.2,P.glass);
  L(w/2-.12,1.6,.15,w/2+.12,2.0,.4,P.orange);L(w/2-.2,2.0,.1,w/2+.2,2.35,.45,P.pink,lit(P.pink,.2));L(.3,0,.3,.9,.9,.7,P.steel);L(w-.9,0,.3,w-.3,1.4,.7,P.white);break}
 case 'sh_bakery':{shell(L,w,dd,d.sign,rgb('#f3e3c6'),rgb('#f6ecd9'),{tiles:rgb('#ead3ac')});L(.25,0,dd-.85,w-.25,.95,dd-.25,P.woodD,P.cream);L(.25,.95,dd-.85,w-.25,1.35,dd-.82,P.glass);L(.25,1.35,dd-.85,w-.25,1.38,dd-.25,P.glass);
  for(let k=0;k<9;k++){const x=.35+k*.36,c=[rgb('#d9a25e'),rgb('#b8743a'),rgb('#f0c88a'),rgb('#e07a8a')][k%4];L(x,.95,dd-.75,x+.28,1.05+(k%2)*.05,dd-.45,c,lit(c,.2))}
  for(let k=0;k<4;k++){const x=.4+k*.85;L(x,0,.15,x+.6,.5,.65,P.wood);for(let j=0;j<5;j++)L(x+.06+j*.1,.5,.25,x+.12+j*.1,1.3,.31,rgb('#d9a25e'),rgb('#e8bd80'))}
  L(.3,1.4,.12,w-.3,2.1,.14,P.woodD);for(let j=0;j<3;j++)L(.4,1.5+j*.2,.14,w-.4,1.55+j*.2,.4,P.wood);for(let k=0;k<8;k++)L(.5+k*.42,1.55+(k%3)*.2,.18,.8+k*.42,1.7+(k%3)*.2,.36,rgb('#c9853e'));break}
 case 'sh_snack':{shell(L,w,dd,d.sign,rgb('#e6e6e6'),rgb('#fbeee8'),{tiles:rgb('#d24b38')});counter(L,.2,w-.2,dd-.75,dd-.25,rgb('#e2462f'),P.steel);
  for(let k=0;k<3;k++){L(.3+k*1.15,1.55,.13,1.3+k*1.15,2.15,.16,P.black);L(.38+k*1.15,1.62,.16,1.22+k*1.15,2.08,.17,k===1?P.yellow:rgb('#ffe1a1'));for(let j=0;j<3;j++)L(.45+k*1.15,1.7+j*.12,.17,1.0+k*1.15,1.74+j*.12,.18,P.red2)}
  L(.3,0,.2,1.3,.95,.75,P.steel,P.dark);L(.4,.95,.3,.8,1.02,.65,rgb('#f5c542'));L(.9,.95,.3,1.2,1.02,.65,rgb('#c26a2e'));L(1.6,0,.2,2.4,1.5,.7,P.steel);L(1.7,1.0,.68,2.3,1.4,.72,P.red);
  L(2.8,0,.2,3.7,1.0,.7,P.white);for(let k=0;k<4;k++)L(2.9+k*.2,1.0,.35,3.05+k*.2,1.15,.5,VIVID[k]);for(let k=0;k<3;k++)L(.6+k*1.1,1.0,dd-.6,.9+k*1.1,1.03,dd-.38,rgb('#c9853e'));break}
 case 'sh_hair':{shell(L,w,dd,d.sign,rgb('#2e2e36'),rgb('#ebe7e3'),{tiles:rgb('#3b3b45')});
  for(let k=0;k<2;k++){const x=.8+k*1.6;L(x-.45,1.0,.12,x+.45,2.1,.15,P.glass,lit(P.glass,.3));L(x-.5,.75,.15,x+.5,.82,.45,P.white);
   L(x-.25,0,1.1,x+.25,.08,1.6,P.steel);L(x-.04,.08,1.3,x+.04,.45,1.4,P.steel);L(x-.28,.45,1.0,x+.28,.62,1.55,P.black);L(x-.28,.62,1.45,x+.28,1.25,1.55,P.black);L(x-.3,.62,1.0,x-.24,.8,1.5,P.black);L(x+.24,.62,1.0,x+.3,.8,1.5,P.black)}
  L(w-.7,0,.2,w-.15,.85,.75,P.white);L(w-.62,.85,.28,w-.23,.95,.67,P.steel);L(.25,0,dd-1.2,.65,.45,dd-.3,P.red2);L(.25,.45,dd-1.2,.35,.85,dd-.3,P.red2);
  counter(L,w-1.2,w-.25,dd-.8,dd-.35,P.white,P.dark);for(let k=0;k<5;k++)L(w-1.1+k*.17,1.0,dd-.7,w-1.0+k*.17,1.2,dd-.62,VIVID[k]);plant(L,w-.4,dd-1.4,.9);break}
 case 'sh_fashion':{shell(L,w,dd,d.sign,rgb('#efe8e4'),rgb('#f7eef2'));
  const rack=(x0,x1,z,cs)=>{L(x0,1.55,z-.03,x1,1.6,z+.03,P.silver);L(x0,0,z-.03,x0+.05,1.6,z+.03,P.steel);L(x1-.05,0,z-.03,x1,1.6,z+.03,P.steel);for(let x=x0+.1;x<x1-.1;x+=.12){const c=VIVID[(Math.floor(x*9)+cs)%VIVID.length];L(x,.85,z-.2,x+.08,1.53,z+.2,mix(c,P.white,.15))}};
  rack(.25,2.3,.45,seed);rack(2.7,w-.25,.45,seed+3);L(1.2,0,1.6,2.4,.75,2.4,P.woodL,P.wood);for(let k=0;k<6;k++){const x=1.3+(k%3)*.36,z=1.7+Math.floor(k/3)*.35,c=VIVID[(k+seed)%VIVID.length];for(let j=0;j<3;j++)L(x,.75+j*.06,z,x+.3,.8+j*.06,z+.28,c)}
  for(const [x,z] of [[3.2,1.8],[3.9,1.8]]){L(x-.05,0,z-.05,x+.05,.9,z+.05,P.steel);L(x-.18,.9,z-.12,x+.18,1.5,z+.12,P.white);L(x-.08,1.5,z-.08,x+.08,1.75,z+.08,P.white)}
  counter(L,w-1.4,w-.3,dd-.9,dd-.45,rgb('#c23b6b'),P.white);L(w-1.2,1.0,dd-.8,w-.95,1.25,dd-.6,P.dark);L(.2,0,2.5,.9,2.2,3.0,rgb('#7a3b5a'));break}
 case 'sh_perfume':{shell(L,w,dd,d.sign,rgb('#f2eef8'),rgb('#f7f2fb'),{tiles:rgb('#e6dff0')});
  for(const x0 of [.15,w/2+.1]){L(x0,0,.12,x0+w/2-.25,2.1,.5,P.white,P.white);for(let j=0;j<4;j++){const y=.5+j*.4;L(x0,y,.15,x0+w/2-.25,y+.03,.5,P.glass);for(let k=0;k<6;k++){const c=VIVID[(k+j+seed)%VIVID.length];L(x0+.08+k*.27,y+.03,.25,x0+.2+k*.27,y+.22,.37,mix(c,P.pink,.3),lit(c,.4));L(x0+.11+k*.27,y+.22,.28,x0+.17+k*.27,y+.27,.34,P.gold)}}}
  L(1.2,0,1.2,2.8,.9,1.8,P.white,P.glass);for(let k=0;k<5;k++)L(1.35+k*.28,.9,1.4,1.5+k*.28,1.12,1.55,VIVID[(k*2+seed)%VIVID.length],P.gold);counter(L,w-1.2,w-.25,dd-.75,dd-.3,rgb('#8a5fc2'),P.white);break}
 case 'sh_pharma':{shell(L,w,dd,d.sign,rgb('#eef5ef'),P.white);const g=P.green;L(w/2-.1,2.78,dd-.12,w/2+.1,3.38,dd-.04,g);L(w/2-.3,2.98,dd-.12,w/2+.3,3.18,dd-.04,g);
  for(let x0=.15;x0<w-.3;x0+=1.25){L(x0,0,.12,x0+1.15,2.1,.5,P.white);for(let j=0;j<5;j++){const y=.2+j*.38;L(x0,y,.12,x0+1.15,y+.03,.5,rgb('#dfe7ee'));for(let k=0;k<5;k++){const c=[P.white,rgb('#7fc4ff'),rgb('#9ad6a8'),rgb('#f2b8c6'),P.yellow][(k+j)%5];L(x0+.05+k*.22,y+.03,.2,x0+.22+k*.22,y+.25,.45,c)}}}
  counter(L,.5,w-.5,dd-.85,dd-.4,P.white,rgb('#2e9a54'));for(const x of [1.1,2.6])L(x,1.0,dd-.75,x+.4,1.3,dd-.7,P.dark);break}
 case 'sh_optic':{shell(L,w,dd,d.sign,rgb('#e9eef6'),rgb('#f3f6fb'));L(.2,.8,.12,w-.2,2.2,.15,P.white);
  for(let j=0;j<5;j++)for(let k=0;k<12;k++){const x=.3+k*.28,y=.95+j*.25;if(x>w-.4)continue;const c=[P.black,rgb('#7a4a2e'),P.red2,P.blue,P.gold][(k+j+seed)%5];L(x,y,.15,x+.08,y+.06,.18,c);L(x+.12,y,.15,x+.2,y+.06,.18,c);L(x+.08,y+.02,.15,x+.12,y+.04,.18,c)}
  table(L,1.4,1.5,.4,P.white);chair(L,1.4,1.0,P.blue);chair(L,1.4,2.0,P.blue,1);L(w-.8,0,1.2,w-.3,2.0,1.3,P.glass);counter(L,w-1.3,w-.25,dd-.75,dd-.3,rgb('#2c5fa8'),P.white);break}
 case 'sh_tech':{shell(L,w,dd,d.sign,rgb('#dfe3ea'),rgb('#eef1f5'),{tiles:rgb('#cfd5de')});L(.2,.9,.12,w-.2,2.1,.15,P.black);for(let k=0;k<4;k++)L(.35+k*1.1,1.05,.15,1.25+k*1.1,1.9,.17,mix(VIVID[(k+seed)%VIVID.length],P.screen,.5));
  for(const [x0,z0] of [[.6,1.2],[2.8,1.2]]){L(x0,0,z0,x0+1.6,.9,z0+.9,P.white);for(let k=0;k<4;k++){const x=x0+.12+k*.38;L(x,.9,z0+.2,x+.2,.92,z0+.55,P.black);L(x+.02,.92,z0+.22,x+.18,.93,z0+.53,P.screen)}}
  for(let k=0;k<3;k++){const x=.8+k*1.1;L(x,0,2.6,x+.8,.75,3.1,P.white);L(x+.1,.75,2.7,x+.7,.78,3.0,P.dark);L(x+.12,.78,2.7,x+.68,1.15,2.73,P.dark);L(x+.15,.8,2.73,x+.65,1.12,2.74,P.screen)}
  counter(L,w-1.4,w-.3,dd-.8,dd-.35,rgb('#1d2f4f'),P.white);break}
 case 'sh_resto':{shell(L,w,dd,d.sign,rgb('#c79a6a'),rgb('#f3e3cf'),{tiles:rgb('#b8895a')});L(.2,0,.15,w-.2,1.1,.75,P.steel,P.silver);L(.2,1.1,.15,w-.2,1.6,.2,P.steel);
  for(let k=0;k<4;k++)L(.5+k*1.3,1.1,.3,1.0+k*1.3,1.25,.6,k%2?P.dark:P.red2);L(.3,1.7,.12,w-.3,2.3,.14,rgb('#6b2a2a'));
  for(const [x,z] of [[1.0,1.7],[2.6,1.7],[4.2,1.7],[1.0,3.3],[2.6,3.3],[4.2,3.3]]){if(z>dd-.9)continue;table(L,x,z,.38,P.white);L(x-.4,.76,z-.4,x+.4,.77,z+.4,rgb('#c94a4a'));chair(L,x-.6,z,rgb('#6b3a24'));chair(L,x+.6,z,rgb('#6b3a24'));L(x-.05,.76,z-.05,x+.05,.92,z+.05,P.yellow)}
  plant(L,.4,dd-.6,1.1);plant(L,w-.4,dd-.6,1.1);L(w/2-.6,0,dd-.6,w/2+.6,1.2,dd-.3,rgb('#6b2a2a'),P.cream);break}
 case 'sh_jewel':{shell(L,w,dd,d.sign,rgb('#2b2730'),rgb('#3a3540'),{tiles:rgb('#35303b')});
  for(const [x0,z0,x1,z1] of [[.3,.3,w-.3,.8],[.3,1.3,1.6,1.9],[2.4,1.3,w-.3,1.9]]){L(x0,0,z0,x1,.85,z1,P.black,P.dark);L(x0,.85,z0,x1,1.15,z1,P.glass,lit(P.glass,.4));
   for(let k=0;k<Math.floor((x1-x0)/.25);k++)L(x0+.08+k*.25,.86,(z0+z1)/2-.06,x0+.18+k*.25,.92,(z0+z1)/2+.06,k%3?P.gold:P.silver,lit(P.gold,.4))}
  L(w-.8,0,.12,w-.2,1.4,.6,rgb('#55505a'));L(w-.6,.5,.6,w-.4,.7,.62,P.gold);L(.2,1.5,.12,w-.2,1.55,.3,P.gold);break}
 case 'sh_cinema':{shell(L,w,dd,d.sign,rgb('#2a2433'),rgb('#3a3046'),{tiles:rgb('#7a2a35')});
  L(.1,0,3.2,w-2.6,2.7,3.32,rgb('#3a3046'));L(.4,.5,.15,w-.4,2.4,.2,P.white,P.white);
  for(let r=0;r<3;r++)for(let k=0;k<9;k++){const x=.7+k*.62,z=1.0+r*.7;if(x>w-.6)continue;L(x,0,z,x+.5,.45,z+.45,rgb('#b02a35'));L(x,.45,z+.36,x+.5,.85,z+.45,rgb('#b02a35'))}
  counter(L,.6,3.0,dd-.85,dd-.4,rgb('#b02a35'),P.gold);L(3.6,0,dd-1.0,4.4,1.5,dd-.4,P.red,P.yellow);L(3.7,1.0,dd-.42,4.3,1.4,dd-.38,P.glass);
  for(let k=0;k<3;k++)L(.12,1.0,3.5+k*.75,.14,2.1,4.1+k*.75,VIVID[(k*2+seed)%VIVID.length]);for(let k=0;k<2;k++)L(w-.14,1.0,3.6+k*.9,w-.12,2.1,4.3+k*.9,VIVID[(k*3+1)%VIVID.length]);break}
 // ---------------------------------------------------------------- galerie
 case 'bench':{for(const x of [.15,w-.25])L(x,0,.25,x+.1,.42,.75,P.dark);L(.05,.42,.25,w-.05,.5,.75,P.wood,P.woodL);L(.05,.5,.18,w-.05,.85,.26,P.wood,P.woodL);break}
 case 'table':{table(L,1,1,.45,P.white);for(const [x,z,f] of [[1,.35,0],[1,1.65,1],[.35,1,0],[1.65,1,1]])chair(L,x,z,rgb('#3f7a4f'),f);L(.96,.76,.96,1.04,2.1,1.04,P.steel);
  const pc=VIVID[seed%VIVID.length];L(.05,2.1,.05,1.95,2.18,1.95,pc,lit(pc,.25));L(.45,2.18,.45,1.55,2.3,1.55,pc,lit(pc,.25));break}
 case 'wc':{const tl=rgb('#dfeef6'),dr=rgb('#4f7fa8');L(0,0,0,w,2.4,dd-.05,tl,lit(tl,.1));L(-.02,2.4,-.02,w+.02,2.5,dd-.03,P.steel);
  for(const x of [.35,1.85]){L(x,0,dd-.07,x+.8,2.0,dd-.02,dr,lit(dr,.2));L(x+.62,.95,dd-.02,x+.7,1.05,dd,P.silver)}
  L(1.25,1.4,dd-.05,1.75,1.9,dd,P.white);L(1.35,1.5,dd,1.47,1.8,dd+.01,P.blue);L(1.53,1.5,dd,1.65,1.8,dd+.01,P.pink);break}
 case 'water':{L(.35,0,.35,.65,.85,.65,P.steel);L(.2,.85,.2,.8,1.0,.8,P.silver,lit(P.water,.3));L(.45,1.0,.45,.55,1.08,.55,P.steel);break}
 case 'vdrink':{L(.08,0,.15,.92,1.9,.85,P.red,lit(P.red,.15));L(.15,.7,.85,.7,1.75,.87,P.glass);for(let j=0;j<4;j++)for(let k=0;k<4;k++)L(.2+k*.12,.78+j*.24,.86,.28+k*.12,.95+j*.24,.875,VIVID[(k+j*2)%VIVID.length]);
  L(.74,.9,.85,.88,1.3,.87,P.dark);L(.2,.2,.85,.7,.45,.87,P.black);break}
 case 'vsnack':{L(.08,0,.15,.92,1.9,.85,P.dark,P.black);L(.15,.6,.85,.75,1.78,.87,P.glass);for(let j=0;j<5;j++)for(let k=0;k<4;k++)L(.19+k*.14,.66+j*.22,.86,.29+k*.14,.8+j*.22,.875,VIVID[(k*3+j)%VIVID.length]);
  L(.78,.9,.85,.88,1.4,.87,P.steel);L(.2,.15,.85,.7,.4,.87,P.black);break}
 case 'playground':{L(0,0,0,w,.05,dd,rgb('#5bbf6a'));for(let x=0;x<w;x++)for(let z=0;z<dd;z++)if((x+z)&1)L(x,.05,z,x+1,.06,z+1,rgb('#f0913a'));
  for(const [x0,z0,x1,z1] of [[0,0,w,.08],[0,dd-.08,w,dd],[0,0,.08,dd],[w-.08,0,w,dd*.4],[w-.08,dd*.7,w,dd]])L(x0,0,z0,x1,.7,z1,P.yellow);
  L(.3,0,.3,1.3,1.3,1.3,P.blue);L(.3,1.3,.3,1.3,1.6,1.3,P.red);for(let k=0;k<5;k++)L(1.3+k*.24,1.2-k*.24,.55,1.54+k*.24,1.3-k*.24,1.05,P.yellow);
  L(1.7,0,1.8,2.8,.4,2.8,P.blue);for(let k=0;k<14;k++){const x=1.8+(k%5)*.2,z=1.9+Math.floor(k/5)*.28;L(x,.4,z,x+.14,.54,z+.14,VIVID[k%VIVID.length])}
  L(.4,0,2.0,.5,1.1,2.1,P.red);L(1.1,0,2.0,1.2,1.1,2.1,P.red);L(.4,1.05,2.0,1.2,1.15,2.1,P.red);L(.7,.45,1.95,.9,.5,2.15,P.dark);break}
 case 'atm':{L(.1,0,.1,.9,1.9,.6,P.steel,P.silver);L(.1,1.75,.1,.9,1.9,.62,P.blue);L(.25,1.1,.6,.75,1.5,.62,P.screen);L(.3,.85,.6,.7,1.05,.66,P.dark);L(.35,.7,.6,.65,.75,.63,P.black);break}
 case 'planter':{L(.05,0,.05,w-.05,.55,dd-.05,P.woodD,P.wood);L(.12,.5,.12,w-.12,.56,dd-.12,P.soil);L(.9,.55,.9,1.1,1.6,1.1,rgb('#8a5d3b'));
  L(.25,1.4,.25,1.75,2.4,1.75,P.leaf,lit(P.leaf,.15));L(.5,2.4,.5,1.5,3.0,1.5,P.leaf2,lit(P.leaf,.2));for(const [x,z] of [[.3,.3],[1.6,.4],[.4,1.6],[1.5,1.5]])L(x,.55,z,x+.15,.75,z+.15,VIVID[(x*7|0)%VIVID.length]);break}
 case 'mapboard':{L(.35,0,.35,.65,.1,.65,P.dark);L(.15,.1,.4,.85,2.0,.6,P.white);L(.15,1.85,.4,.85,2.0,.62,P.blue);
  for(let k=0;k<9;k++){const x=.22+(k%3)*.21,y=.4+Math.floor(k/3)*.45;L(x,y,.6,x+.17,y+.38,.61,VIVID[(k+seed)%VIVID.length])}L(.4,1.88,.62,.6,1.98,.63,P.white);break}
 case 'infodesk':{L(.1,0,.2,w-.1,1.05,.85,P.white,P.white);L(.1,.75,.84,w-.1,.95,.86,P.blue);L(1.3,1.05,.3,1.7,1.35,.34,P.dark);L(1.33,1.08,.34,1.67,1.32,.35,P.screen);
  L(w/2-.05,1.05,.5,w/2+.05,2.2,.6,P.steel);L(w/2-.35,2.0,.5,w/2+.35,2.4,.6,P.blue);L(w/2-.06,2.08,.6,w/2+.06,2.32,.61,P.white);break}
 case 'pool':{L(0,0,0,w,.45,dd,rgb('#cfc8bb'),rgb('#e2dccf'));L(.2,.3,.2,w-.2,.42,dd-.2,P.water,lit(P.water,.3));L(1.3,.4,1.3,1.7,1.0,1.7,rgb('#cfc8bb'));
  const t=Date.now()/400;for(let k=0;k<6;k++){const a=k/6*6.28+t*.2,r=.35+.1*Math.sin(t+k);L(1.5+Math.cos(a)*r-.04,1.0,1.5+Math.sin(a)*r-.04,1.5+Math.cos(a)*r+.04,1.15+.1*Math.sin(t*2+k),1.5+Math.sin(a)*r+.04,P.white)}
  L(1.42,1.0,1.42,1.58,1.25,1.58,lit(P.water,.6));break}
 case 'charger':{L(.3,0,.3,.7,1.3,.7,P.white);L(.3,1.1,.3,.7,1.3,.72,P.green);for(let j=0;j<3;j++)L(.36,.4+j*.22,.7,.64,.55+j*.22,.72,P.dark);break}
 case 'recycle':{for(const [k,c] of [[0,P.yellow],[1,P.green],[2,P.blue]]){const x=.1+k*.62;L(x,0,.2,x+.55,.95,.8,c,lit(c,.15));L(x+.15,.85,.79,x+.4,.9,.81,P.dark)}break}
 default:return false}
 return true}

// personnel dans une boutique (couleur du tablier = enseigne)
export function shopStaffPos(it,F){const d=F.d;return d.inside?F.m(d.w-.8,d.d-1.1):F.m(d.w/2,d.d-1.15)}
// places assises : bancs, tables, aire de jeux, restaurant, coiffeur, cinéma (k : rang du client parmi ceux servis)
export function seat(it,F,k){const d=F.d;let p=null,face=0;
 switch(it.t){
 case 'bench':p=[.5+(k%2)*1,.5];break;
 case 'table':p=[[1,.3],[1,1.7],[.3,1],[1.7,1]][k%4];face=[0,Math.PI,Math.PI/2,-Math.PI/2][k%4];break;
 case 'playground':p=[[.6,2.5],[2.3,.6],[2.2,2.2],[.8,.8]][k%4];break;
 case 'sh_resto':{const t=[[1.0,1.7],[2.6,1.7],[4.2,1.7],[1.0,3.3],[2.6,3.3],[4.2,3.3]][Math.floor(k/2)%6];p=[t[0]+(k%2?.6:-.6),t[1]];face=k%2?-Math.PI/2:Math.PI/2;break}
 case 'sh_hair':p=[.8+(k%2)*1.6,1.3];face=Math.PI;break;
 case 'sh_cinema':{const r=Math.floor(k/9)%3,c=k%9;p=[.95+c*.62,1.15+r*.7];face=Math.PI;break}
 case 'sh_cafe':p=[[3.2,.3],[3.2,1.3],[3.65,2.0]][k%3];face=[0,Math.PI,-Math.PI/2][k%3];break}
 if(!p)return null;const [x,z]=F.m(p[0],p[1]);return [x,z,F.ang+face]}
