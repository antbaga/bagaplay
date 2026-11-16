// BagaCooker : modèles voxel (cuisine, ingrédients, assiettes, chef). Repère : 1 = une case, y vers le haut, pied à y = 0.
import {Builder,hex,shade} from './urssaf-gl.js';

export const CT=.62;   // hauteur des plans de travail
const C={floorA:'#f6efe1',floorB:'#7fc8c0',wood:'#c98a52',woodD:'#a96d3c',woodL:'#e2b07a',steel:'#c7ced6',steelD:'#9aa4ae',top:'#eef1f3',
 tile:'#ffffff',tileB:'#d7eef4',stripe:'#e9573f',dark:'#3b3f46',red:'#e2453c',gold:'#f3c33a',blue:'#5fb4e6'};

// ---- cuisine : un maillage statique pour le sol, les murs et les meubles (les objets posés sont dessinés à part)
export function kitchenMesh(R,S,opt={}){const b=new Builder(),W=S.W,H=S.H;
 // sol en damier sous toute la cuisine, plinthe autour
 for(let z=0;z<H;z++)for(let x=0;x<W;x++)b.box(x,-.06,z,x+1,0,z+1,(x+z)%2?C.floorA:C.floorB,'t');
 b.box(-.4,-.6,-.4,W+.4,-.06,H+.4,'#5a4a3c','tnsew');
 // mur du fond carrelé avec une frise, et deux murets sur les côtés
 for(let y=0;y<9;y++)for(let x=0;x<W*2;x++)b.box(x*.5,y*.25,-.12,x*.5+.5,y*.25+.25,-.02,(x+y)%2?C.tile:C.tileB,'s');
 b.box(0,1.15,-.11,W,1.25,-.01,C.stripe,'s');b.box(-.02,0,-.12,W+.02,2.3,-.1,'#e8e2d6','t');
 b.box(-.12,0,-.12,-.02,1.2,H,'#efe6d6','tnsew');if(!opt.side)b.box(W+.02,0,-.12,W+.12,1.2,H,'#efe6d6','tnsew');   // vue de côté : pas de muret devant la caméra
 for(const row of S.tiles)for(const t of row)furniture(b,t);
 return R.mesh(b)}
function counterBase(b,x,z,side,top){b.box(x+.02,0,z+.02,x+.98,CT-.05,z+.98,side,'nsew');b.box(x,CT-.05,z,x+1,CT,z+1,top,'tnsew',shade(hex(top),.85))}
function furniture(b,t){const x=t.x,z=t.z,ch=t.ch;
 if(ch==='.'||ch==='@')return;
 if(ch==='#'){counterBase(b,x,z,C.wood,C.top);b.box(x+.1,.2,z+.97,x+.9,.24,z+.99,C.woodD,'s');return}
 if('bclptm'.includes(ch)){b.box(x+.04,0,z+.04,x+.96,CT,z+.96,C.wood,'tnsew',C.woodD);for(let k=0;k<3;k++)b.box(x+.03,.08+k*.18,z+.03,x+.97,.13+k*.18,z+.97,C.woodL,'nsew');
  b.box(x+.12,CT,z+.12,x+.88,CT+.02,z+.88,C.woodD,'t');return}
 if(ch==='K'){counterBase(b,x,z,C.wood,C.top);b.box(x+.12,CT,z+.18,x+.88,CT+.05,z+.82,C.woodL,'tnsew',C.woodD);
  b.box(x+.72,CT+.05,z+.25,x+.76,CT+.08,z+.55,'#d9dee3','tnsew');b.box(x+.71,CT+.05,z+.55,x+.77,CT+.09,z+.72,'#2b2b30','tnsew');return}
 if(ch==='S'){counterBase(b,x,z,C.steelD,'#2c2f35');b.disc(x+.5,z+.5,.3,CT,CT+.01,.05,'#e2453c',.05);
  b.disc(x+.5,z+.5,.28,CT+.01,CT+.07,.04,'#3b3f46',0,'#2b2f35');b.box(x+.5,CT+.04,z+.47,x+.98,CT+.07,z+.53,'#2b2b30','tnsew');
  b.box(x+.1,.25,z+.97,x+.9,.5,z+.99,'#1d2026','s');for(let k=0;k<3;k++)b.box(x+.2+k*.25,.12,z+.97,x+.3+k*.25,.18,z+.995,'#e2453c','s');return}
 if(ch==='F'){counterBase(b,x,z,C.steel,C.steelD);b.box(x+.14,CT-.01,z+.14,x+.86,CT+.005,z+.86,'#f0b43a','t');
  b.box(x+.12,CT,z+.12,x+.88,CT+.08,z+.16,C.steelD,'tnsew');b.box(x+.12,CT,z+.84,x+.88,CT+.08,z+.88,C.steelD,'tnsew');
  b.box(x+.12,CT,z+.16,x+.16,CT+.08,z+.84,C.steelD,'tnsew');b.box(x+.84,CT,z+.16,x+.88,CT+.08,z+.84,C.steelD,'tnsew');return}
 if(ch==='W'){counterBase(b,x,z,C.steel,C.steel);b.box(x+.14,CT-.12,z+.14,x+.86,CT-.04,z+.86,'#7fc8f0','t');
  b.box(x+.45,CT,z+.06,x+.55,CT+.32,z+.14,C.steelD,'tnsew');b.box(x+.45,CT+.26,z+.06,x+.55,CT+.32,z+.36,C.steelD,'tnsew');return}
 if(ch==='D'){counterBase(b,x,z,C.wood,C.top);b.box(x+.15,CT,z+.15,x+.85,CT+.01,z+.85,'#d8433a','t');return}
 if(ch==='X'){b.box(x+.14,0,z+.14,x+.86,CT-.05,z+.86,'#6d7a85','tnsew','#5b6670');b.box(x+.1,CT-.05,z+.1,x+.9,CT+.02,z+.9,'#4e5963','tnsew');
  b.box(x+.4,CT+.02,z+.45,x+.6,CT+.06,z+.55,'#3e4851','tnsew');for(let k=0;k<3;k++)b.box(x+.24+k*.2,.08,z+.855,x+.3+k*.2,.45,z+.865,'#59656f','s');return}
 if(ch==='O'){counterBase(b,x,z,'#e2453c','#fff7e8');for(let k=0;k<5;k++)b.box(x+.02+k*.2,CT-.05,z+.98,x+.12+k*.2,CT,z+1,k%2?'#fff':'#e2453c','s');
  b.disc(x+.75,z+.3,.1,CT,CT+.03,.03,'#d49a1f');b.disc(x+.75,z+.3,.07,CT+.03,CT+.09,.025,C.gold);b.box(x+.73,CT+.09,z+.28,x+.77,CT+.12,z+.32,C.gold,'tnsew');
  for(let k=0;k<4;k++)b.box(x+.08+k*.22,CT+.02,z+.08,x+.2+k*.22,CT+.05,z+.2,k%2?'#fff':'#e2453c','tnsew');return}}

// ---- ingrédients et assiettes (centrés, pied à y = 0)
const g=.03;
function ball(b,r,col,y0=0,side){const q=.04,n=Math.ceil(r/q);for(let j=0;j<2*n;j++){const y=-r+(j+.5)*q,rr=Math.sqrt(Math.max(0,r*r-y*y));if(rr<q*.6)continue;b.disc(0,0,rr,y0+r+y-q/2,y0+r+y+q/2,q,col,0,side,"tnsew")}}
function slab(b,w,h,d,col,y0=0,side){b.box(-w/2,y0,-d/2,w/2,y0+h,d/2,col,'tnsewb',side)}
export const ITEM={
 bun_raw:b=>{b.disc(0,0,.17,0,.05,g,'#e0a85a');b.disc(0,0,.16,.05,.11,g,'#d08a3c');b.disc(0,0,.12,.11,.15,g,'#c97f33');for(const [x,z] of [[-.05,-.03],[.04,.05],[.06,-.06],[-.02,.07]])b.box(x,.15,z,x+.02,.16,z+.012,'#fff3d6','t')},
 cheese_raw:b=>{slab(b,.3,.05,.3,'#ffd23f',0,'#f0b81f');for(const [x,z] of [[-.08,-.06],[.05,.04],[.09,-.09]])b.box(x,.05,z,x+.04,.052,z+.04,'#e6a514','t')},
 lettuce_raw:b=>{ball(b,.15,'#6fbf4a','#5aa63b');b.disc(0,0,.1,.26,.3,g,'#a6dd73')},
 lettuce_chop:b=>{for(const [x,z,y] of [[-.1,-.06,0],[.04,-.1,0],[.08,.06,0],[-.05,.08,0],[0,0,.04],[-.08,0,.04],[.06,-.02,.04]])b.box(x-.05,y,z-.04,x+.05,y+.04,z+.04,(x+z)>0?'#7ccb55':'#a6dd73','tnsew')},
 tomato_raw:b=>{ball(b,.14,'#e8473a','#c9362b');b.box(-.03,.27,-.03,.03,.31,.03,'#4c9a3a','tnsew');b.box(-.07,.27,-.01,.07,.29,.01,'#5fb04a','tnsew')},
 tomato_chop:b=>{for(const [x,z] of [[-.08,-.04],[.06,-.07],[.03,.07],[-.05,.08]]){b.disc(x,z,.07,0,.03,g,'#e8473a',0,'#c9362b');b.disc(x,z,.04,.03,.032,g,'#ff8a6a')}},
 potato_raw:b=>{b.box(-.14,0,-.09,.14,.14,.09,'#b98a54','tnsewb','#a37645');b.box(-.1,.14,-.06,.1,.17,.06,'#c99a63','tnsew');b.box(-.04,.17,-.01,-.02,.171,.01,'#7d5a35','t')},
 potato_chop:b=>{for(let i=0;i<7;i++){const x=-.12+i*.04;b.box(x,0,-.1+(i%2)*.03,x+.03,.03,.1-(i%3)*.02,'#f3dfa8','tnsew')}},
 potato_fry:b=>{for(let i=0;i<9;i++){const x=-.12+(i%5)*.055,z=-.06+Math.floor(i/5)*.07;b.box(x,0+(i>4?.03:0),z,x+.035,.04+(i>4?.03:0),z+.18,i%2?'#f2b736':'#e9a52a','tnsew')}},
 potato_burnt:b=>{for(let i=0;i<7;i++){const x=-.12+i*.04;b.box(x,0,-.1,x+.03,.035,.1,i%2?'#3a2e26':'#241c17','tnsew')}},
 steak_raw:b=>{b.disc(0,0,.16,0,.06,g,'#e86a6a',0,'#c94f52');b.box(-.16,0,-.03,-.13,.06,.07,'#fff0e6','tnsew');b.disc(.03,.02,.05,.06,.062,g,'#f19393')},
 steak_cook:b=>{b.disc(0,0,.16,0,.06,g,'#8a4f2b',0,'#6e3b1f');for(let k=0;k<3;k++)b.box(-.12,.06,-.08+k*.07,.12,.062,-.06+k*.07,'#4e2a14','t')},
 steak_burnt:b=>{b.disc(0,0,.15,0,.055,g,'#1d1a18',0,'#141210');b.box(-.06,.055,-.02,.05,.06,.03,'#3b3632','t')},
 plate:b=>{b.disc(0,0,.24,0,.02,g,'#e8ecef',0,'#d2d8dd');b.disc(0,0,.24,.02,.04,g,'#ffffff',.04,'#e3e8ec')},
 plate_dirty:b=>{ITEM.plate(b);for(const [x,z] of [[-.1,-.05],[.08,.07],[.02,-.12],[-.04,.1]])b.box(x,.021,z,x+.06,.024,z+.05,'#a37645','t')},
 // éléments dressés (posés dans l'assiette)
 p_bun_bottom:b=>{b.disc(0,0,.15,0,.045,g,'#e0a85a',0,'#d08a3c')},
 p_bun_top:b=>{b.disc(0,0,.155,0,.04,g,'#d08a3c');b.disc(0,0,.14,.04,.08,g,'#c97f33');b.disc(0,0,.09,.08,.1,g,'#c27a30');for(const [x,z] of [[-.05,-.03],[.04,.05],[.06,-.06]])b.box(x,.1,z,x+.02,.105,z+.012,'#fff3d6','t')},
 p_steak:b=>{b.disc(0,0,.15,0,.05,g,'#7a4524',0,'#5e3219')},
 p_cheese:b=>{b.box(-.16,0,-.16,.16,.018,.16,'#ffd23f','tnsew');b.box(-.17,-.03,-.04,-.14,.018,.04,'#ffd23f','nsew')},
 p_lettuce:b=>{b.disc(0,0,.17,0,.03,g,'#7ccb55',0,'#5aa63b')},
 p_tomato:b=>{b.disc(-.05,0,.07,0,.025,g,'#e8473a');b.disc(.06,.02,.07,0,.025,g,'#e8473a')}};
export function makeItems(R){const out={};for(const k in ITEM){const b=new Builder();ITEM[k](b);out[k]=R.mesh(b)}
 const cube=new Builder();cube.box(-.5,-.5,-.5,.5,.5,.5,'#ffffff','tnsewb');out.cube=R.mesh(cube);return out}
// pile dressée : [maillage, hauteur] du bas vers le haut
export function platedLayers(parts){const has=k=>parts.includes(k),L=[];
 if(has('bun')){L.push(['p_bun_bottom',.045]);if(has('steak'))L.push(['p_steak',.05]);if(has('cheese'))L.push(['p_cheese',.018]);if(has('tomato'))L.push(['p_tomato',.025]);if(has('lettuce'))L.push(['p_lettuce',.03]);L.push(['p_bun_top',.1]);return {stack:L,side:[]}}
 const side=[];if(has('steak'))side.push(['steak_cook',-.08,0]);if(has('potato'))side.push(['potato_fry',has('steak')?.1:0,0]);
 if(has('lettuce'))side.push(['lettuce_chop',0,0]);if(has('tomato'))side.push(['tomato_chop',.02,.03,has('lettuce')?.05:0]);if(has('cheese'))side.push(['cheese_raw',0,0,.07]);
 return {stack:[],side}}

// ---- le chef (rig façon Minecraft, comme dans Fuis l'URSSAF) : veste blanche, foulard rouge, toque, grosse moustache
export function makeChef(R){const parts={},skin='#f2c493';let b=new Builder();
 b.box(-.16,0,-.1,.16,.36,.1,'#ffffff','tbnsew');b.box(-.165,.02,-.105,.165,.07,.105,'#2b2f35','nsew');
 for(const y of [.12,.2,.28]){b.box(-.07,y,-.106,-.04,y+.03,-.1,'#c9ced3','n');b.box(.04,y,-.106,.07,y+.03,-.1,'#c9ced3','n')}
 b.box(-.12,.3,-.11,.12,.37,.11,'#e2453c','tnsew');parts.torso=R.mesh(b);
 b=new Builder();b.box(-.16,0,-.16,.16,.32,.16,skin,'tbnsew');b.box(-.165,.24,-.165,.165,.3,.165,'#5a3a24','nsew');
 b.box(-.17,.28,-.17,.17,.36,.17,'#ffffff','tnsewb');b.box(-.2,.36,-.2,.2,.62,.2,'#ffffff','tnsew');b.box(-.21,.58,-.21,.21,.66,.21,'#f4f6f8','tnsew');
 b.box(-.1,.15,-.17,-.05,.21,-.16,'#2b2622','n');b.box(.05,.15,-.17,.1,.21,-.16,'#2b2622','n');
 b.box(-.13,.08,-.185,.13,.12,-.16,'#3a2416','tnsew');b.box(-.16,.06,-.185,-.1,.1,-.165,'#3a2416','tnsew');b.box(.1,.06,-.185,.16,.1,-.165,'#3a2416','tnsew');
 b.box(-.14,.1,-.165,-.1,.13,-.16,'#ff9a8a','n');b.box(.1,.1,-.165,.14,.13,-.16,'#ff9a8a','n');parts.head=R.mesh(b);
 for(const side of ['L','R']){b=new Builder();b.box(-.05,-.34,-.05,.05,0,.05,'#ffffff','tbnsew');b.box(-.051,-.34,-.051,.051,-.27,.051,skin,'bnsew');parts['arm'+side]=R.mesh(b);
  b=new Builder();b.box(-.06,-.34,-.06,.06,0,.06,'#3b3f46','tbnsew');for(let k=0;k<3;k++)b.box(-.061,-.3+k*.1,-.061,.061,-.26+k*.1,.061,'#e9ecef','nsew');b.box(-.065,-.34,-.1,.065,-.27,.065,'#1d1d1d','tbnsew');parts['leg'+side]=R.mesh(b)}
 return parts}
