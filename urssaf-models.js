// Fuis l'URSSAF : modèles voxel (personnages, fournitures de bureau, bonus, décor) et maillage de la piste.
// Repère des objets de la piste : x = droite, y = haut, -z = sens de la course. Pied des objets à y = 0 (le papier).
import {Builder,hex,shade} from './urssaf-gl.js';
import {TW,REAM,KINDS} from './urssaf-engine.js';

const C={paper:'#fbf9f3',paperSide:'#efe9dc',sheet:'#e3dccb',blue:'#c3cfee',blueDark:'#9fb0e3',margin:'#ee8f8f',
 wood:'#c99a63',woodDark:'#b4854f',skin:'#f2c493',hair:'#5a3a24',shirt:'#f4f1ea',tie:'#d8433a',jeans:'#3d5d9c',shoe:'#3a2f2a',
 suit:'#59636e',suitDark:'#4a535d',glasses:'#1e2328',agentHair:'#2d2a28',gold:'#f3c33a',goldDark:'#d49a1f'};

// ---- personnages : rig façon Minecraft, chaque membre autour de son pivot
function rig(R,o){const parts={};
 let b=new Builder();b.box(-.15,0,-.09,.15,.36,.09,o.body,'tbnsew');if(o.shirt){b.box(-.06,.1,-.096,.06,.36,-.09,o.shirt,'n')}if(o.tie)b.box(-.025,.05,-.1,.025,.33,-.094,o.tie,'n');
 if(o.belt)b.box(-.152,0,-.092,.152,.05,.092,o.belt,'nsew');if(o.badge)b.box(.06,.24,-.1,.12,.29,-.093,o.badge,'n');parts.torso=R.mesh(b);
 b=new Builder();b.box(-.16,0,-.16,.16,.32,.16,C.skin,'tbnsew');b.box(-.17,.25,-.17,.17,.35,.17,o.hair,'tnsew');b.box(-.17,.08,.1,.17,.3,.17,o.hair,'snewb');
 if(o.glasses){b.box(-.165,.15,-.175,.165,.21,-.16,C.glasses,'tnsew')}else{b.box(-.1,.15,-.17,-.05,.21,-.16,'#2b2622','n');b.box(.05,.15,-.17,.1,.21,-.16,'#2b2622','n')}
 b.box(-.05,.06,-.17,.05,.09,-.16,o.mouth||'#b8564a','n');parts.head=R.mesh(b);
 for(const side of ['L','R']){b=new Builder();b.box(-.05,-.34,-.05,.05,0,.05,o.sleeve,'tbnsew');b.box(-.051,-.34,-.051,.051,-.26,.051,C.skin,'bnsew');
  if(side==='R'&&o.case){b.box(-.04,-.5,-.14,.04,-.32,.16,o.case,'tbnsew');b.box(-.02,-.34,-.04,.02,-.3,.06,'#2a2a2a','tnsew')}
  if(side==='L'&&o.clip){b.box(-.03,-.42,-.2,.0,-.2,-.02,'#c9a26b','tbnsew');b.box(-.035,-.4,-.19,-.03,-.22,-.04,'#ffffff','w')}
  parts['arm'+side]=R.mesh(b);
  b=new Builder();b.box(-.06,-.34,-.06,.06,0,.06,o.legs,'tbnsew');b.box(-.065,-.34,-.1,.065,-.27,.065,o.shoe,'tbnsew');parts['leg'+side]=R.mesh(b)}
 return parts}
export function makeHero(R){return rig(R,{body:'#f08a4b',sleeve:'#f08a4b',shirt:'#fff3df',hair:C.hair,legs:C.jeans,shoe:C.shoe,belt:'#7a4b2a',mouth:'#b8564a'})}
export function makeAgent(R){return rig(R,{body:C.suit,sleeve:C.suit,shirt:C.shirt,tie:'#1e2328',hair:C.agentHair,legs:C.suitDark,shoe:'#151515',glasses:true,case:'#2b2b30',clip:true,badge:'#f3c33a',mouth:'#7a4a40'})}
// pose : {legL,legR,armL,armR,bob,lean,roll,armUp}
export function drawRig(R,M4,parts,root,pose,tint){const T=M4.t,rx=M4.rx,mul=M4.mul;
 let base=mul(root,T(0,pose.bob||0,0));if(pose.lean)base=mul(base,mul(T(0,.34,0),mul(rx(pose.lean),T(0,-.34,0))));if(pose.roll)base=mul(base,M4.rz(pose.roll));
 R.draw(parts.legL,mul(base,mul(T(-.075,.34,0),rx(pose.legL||0))),tint);R.draw(parts.legR,mul(base,mul(T(.075,.34,0),rx(pose.legR||0))),tint);
 R.draw(parts.torso,mul(base,T(0,.34,0)),tint);
 const up=pose.armUp||0;R.draw(parts.armL,mul(base,mul(T(-.2,.68,0),mul(rx((pose.armL||0)*(1-up)+up*-2.9),M4.rz(up*-.25)))),tint);
 R.draw(parts.armR,mul(base,mul(T(.2,.68,0),mul(rx((pose.armR||0)*(1-up)+up*-2.9),M4.rz(up*.25)))),tint);
 R.draw(parts.head,mul(base,mul(T(0,.7,0),rx(pose.head||0))),tint)}

// ---- fournitures de bureau (obstacles)
function pencilAcross(b,len,y0,body,cz=0){const h=.34,x0=-len/2,x1=len/2;
 b.box(x0+.55,y0,cz-h/2,x1-.42,y0+h,cz+h/2,body,'tnsew',shade(hex(body),.9));
 b.box(x0+.55,y0+h*.33,cz-h/2-.005,x1-.42,y0+h*.4,cz+h/2+.005,shade(hex(body),.82),'ns');
 b.box(x0+.55,y0+h*.73,cz-h/2-.005,x1-.42,y0+h*.8,cz+h/2+.005,shade(hex(body),.82),'ns');
 b.box(x1-.42,y0+.01,cz-h/2+.01,x1-.24,y0+h-.01,cz+h/2-.01,'#c9cdd2','tnsewb');b.box(x1-.36,y0,cz-h/2,x1-.33,y0+h,cz+h/2,'#a4a9ae','tns');
 b.box(x1-.24,y0+.02,cz-h/2+.02,x1,y0+h-.02,cz+h/2-.02,'#f08aa0','tnsewe');
 b.box(x0+.3,y0+.05,cz-h/2+.05,x0+.55,y0+h-.05,cz+h/2-.05,'#ecc89a','tnsew');b.box(x0+.12,y0+.1,cz-h/2+.1,x0+.3,y0+h-.1,cz+h/2-.1,'#e2bb88','tnsew');
 b.box(x0,y0+.13,cz-.04,x0+.12,y0+h-.13,cz+.04,'#3a3a3a','tnsew')}
function eraser(b,cx,cz,w,d,h){b.box(cx-w/2,0,cz-d/2,cx+w/2,h,cz+d/2,'#f7f4ee','tnsew');b.box(cx-w/2-.01,h*.15,cz-d/2-.01,cx+w/2+.01,h*.75,cz+d/2+.01,'#3d7fd1','nsew')}
function clip(b,x,y,z,col,rot){const t=.05,L=.75,W=.26;const add=(x0,z0,x1,z1)=>{if(rot)b.box(x+z0,y,z+x0,x+z1,y+t,z+x1,col,'tnsew');else b.box(x+x0,y,z+z0,x+x1,y+t,z+z1,col,'tnsew')};
 add(-L/2,-W/2,L/2,-W/2+t);add(-L/2,W/2-t,L/2,W/2);add(-L/2,-W/2,-L/2+t,W/2);add(L/2-t,-W/2,L/2,W/2);add(-L/2+.12,-W/2+.08,L/2-.1,-W/2+.08+t);add(-L/2+.12,-W/2+.08,-L/2+.12+t,W/2-.1)}
const ITEM={
 pencil(b){pencilAcross(b,TW-.1,0,'#f2c230')},
 clips(b){const cols=['#e5574a','#4f8fd8','#c7ccd2','#5fb36a','#f2a33a','#b38ad8'];let k=0;for(let x=-1.7;x<=1.7;x+=.55){for(let lay=0;lay<3;lay++){if((k*7+lay*3)%5===0)continue;clip(b,x+((k*13+lay*5)%7-3)*.03,lay*.08,((k*11+lay*3)%5-2)*.1,cols[(k+lay)%cols.length],(k+lay)%2);}k++}},
 ruler(b){eraser(b,-TW/2+.3,0,.5,.45,.6);eraser(b,TW/2-.3,0,.5,.45,.6);eraser(b,0,0,.4,.35,.6);
  b.box(-TW/2-.1,.6,-.27,TW/2+.1,.78,.27,'#e9cf9a','tbnsew','#d8b97f');for(let x=-TW/2;x<TW/2;x+=.2)b.box(x,.78,.12,x+.03,.79,(Math.round(x/.2)%5===0)?.27:.2,'#5a4a3a','t')},
 bridge(b){b.box(-TW/2-.05,0,-.48,-TW/2+.75,.55,.48,'#ffe36e','tnsew','#f1d14f');b.box(TW/2-.75,0,-.48,TW/2+.05,.55,.48,'#ff9fc4','tnsew','#f08ab3');
  for(let y=.1;y<.55;y+=.1){b.box(-TW/2-.06,y,-.49,-TW/2+.76,y+.012,.49,'#e8c94a','nsew');b.box(TW/2-.76,y,-.49,TW/2+.06,y+.012,.49,'#e07fa8','nsew')}
  b.box(-TW/2-.15,.55,-.32,TW/2+.15,.8,.32,'#2b2d31','tbnsew');b.box(-TW/2-.05,.8,-.3,TW/2+.25,1.3,.3,'#d8433a','tbnsew','#c63a32');b.box(TW/2+.05,.8,-.31,TW/2+.3,1.25,.31,'#c9cdd2','tnsew')},
 stapler(b){b.box(-.42,0,-1.05,.42,.22,1.05,'#2b2d31','tnsew');b.box(-.4,.22,-1.0,.4,.86,.95,'#d8433a','tnsew','#c63a32');b.box(-.41,.6,-1.06,.41,.95,-.7,'#c9cdd2','tnsew');b.box(-.3,.86,-.6,.3,.95,.85,'#e45c52','t')},
 gum(b){b.box(-.5,0,-.42,.5,1.3,.42,'#47b07a','tnsew','#3d9e6c');b.box(-.505,.45,-.425,.505,.85,.425,'#f4f7f2','nsew');b.box(-.506,.55,-.426,.506,.75,.426,'#2f8a5c','nsew');
  b.box(-.3,1.3,-.1,-.05,1.55,.1,'#f4f7f2','tnsew');b.box(.05,1.3,-.1,.3,1.45,.1,'#dfe9e2','tnsew')},
 sharpener(b){b.box(-.4,0,-.37,.4,.55,.37,'#e45c52','tnsew','#cf4d44');b.box(-.2,.12,.371,.2,.42,.38,'#3a2a26','s');b.box(-.38,.42,.2,.38,.55,.38,'#c9cdd2','tnsew')},
 postits(b){for(let i=0;i<6;i++){const y=i*.1;b.box(-.47+(i%2)*.01,y,-.47,.47,y+.1,.47,i%2?'#ffe36e':'#ffd84a','tnsew',i%2?'#f1d14f':'#ebc53e')}b.box(-.49,.6,-.5,.45,.62,.45,'#fff07f','tnsew')},
 calc(b){b.box(-1.1,0,-.85,1.1,.3,.85,'#3c4148','tnsew','#33383e');b.box(-.95,.3,-.75,.95,.33,-.25,'#9fc29a','t');b.box(-.95,.3,-.78,.95,.32,-.22,'#2d3237','nsew');
  for(let i=0;i<5;i++)for(let j=0;j<4;j++)b.box(-.9+j*.48,.3,-.1+i*.18,-.55+j*.48,.36,.04+i*.18,(j===3)?'#f2a33a':(i===0?'#e5574a':'#d9dde2'),'tnsew')},
 mug(b){b.disc(0,0,1.15,0,3.0,.23,'#f7f4ee',.3,'#ebe6dc');b.disc(0,0,.86,0,2.75,.23,'#5a3424');b.disc(0,0,1.16,.9,1.5,.23,'#3d7fd1',.25);
  b.box(1.1,.7,-.15,1.55,.9,.15,'#f7f4ee','tbnsew');b.box(1.35,.7,-.15,1.55,2.3,.15,'#f7f4ee','tbnsew');b.box(1.1,2.1,-.15,1.55,2.3,.15,'#f7f4ee','tbnsew')},
 postit(b){b.box(-.52,0,-.52,.52,.03,.52,'#ffe36e','tnsew');for(let i=0;i<4;i++)b.box(-.38,.031,-.3+i*.18,.1+((i*37)%30)/100,.035,-.27+i*.18,'#7a6a3a','t')},
 gumblob(b){b.disc(0,0,.38,0,.07,.13,'#f59ac0');b.disc(.08,-.05,.2,.07,.11,.1,'#f8b4d2')},
 ink(b){b.disc(-.2,.1,.85,0,.03,.15,'#2a3f9e',0,null,'t');b.disc(.55,-.3,.5,0,.036,.15,'#2f47ad',0,null,'t');b.disc(-.7,-.45,.35,0,.033,.15,'#24388c',0,null,'t')},
 hole(b){b.disc(0,0,.46,0,.016,.1,'#4a3a2e',0,null,'t');b.disc(0,0,.34,0,.018,.1,'#2a211b',0,null,'t')},
 coin(b){b.box(-.28,-.16,-.045,.28,.16,.045,C.gold,'tbnsew',C.goldDark);b.box(-.16,-.28,-.045,.16,.28,.045,C.gold,'tbnsew',C.goldDark);b.box(-.12,-.12,-.055,.12,.12,.055,'#e8ad2b','ns');b.box(-.07,-.03,-.06,.09,.0,.06,'#fff3b0','ns');b.box(-.07,.04,-.06,.09,.07,.06,'#fff3b0','ns');b.box(-.1,-.09,-.06,-.06,.1,.06,'#fff3b0','ns')},
 // bonus « paradis fiscal »
 magnet(b){b.disc(0,0,.42,0,.12,.14,'#f2dd9a');b.disc(0,0,.52,-.02,.04,.17,'#59b7d8',0,null,'t');for(let i=0;i<5;i++)b.box(-.04+i*.03,.12+i*.13,-.04,.04+i*.03,.25+i*.13,.04,'#8a5a34','tnsew');
  const tx=.14,ty=.8;for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]])b.box(tx+Math.min(0,dx*.38),ty,Math.min(0,dz*.38),tx+Math.max(.06,dx*.38),ty+.06,Math.max(.06,dz*.38),'#4caf50','tbnsew');
  b.box(tx-.05,ty-.08,-.05,tx+.06,ty+.02,.06,'#6b4a2a','tnsew')},
 mult(b){const bar=(x,y,z)=>{b.box(x-.32,y,z-.15,x+.32,y+.18,z+.15,C.gold,'tbnsew',C.goldDark);b.box(x-.26,y+.18,z-.1,x+.26,y+.2,z+.1,'#ffe48a','t')};bar(0,0,0);bar(.08,.2,.04)},
 shield(b){b.box(-.42,.15,-.05,.42,.68,.05,'#2b2d31','tbnsew');b.box(-.36,.2,-.06,.36,.63,-.05,'#5fa8e8','n');b.box(-.2,.42,-.065,.2,.5,-.06,'#ffffff','n');b.box(-.05,0,-.05,.05,.15,.05,'#3a3d42','tnsew');b.box(-.22,0,-.12,.22,.04,.12,'#3a3d42','tnsew')},
 jet(b){b.box(-.12,.2,-.55,.12,.42,.55,'#f4f6f8','tbnsew');b.box(-.08,.24,-.68,.08,.38,-.55,'#e7ebef','tbnsew');b.box(-.55,.27,-.05,.55,.31,.2,'#d9dee4','tbnsew');
  b.box(-.03,.42,.35,.03,.66,.55,'#3d7fd1','tbnsew');b.box(-.2,.38,.45,.2,.42,.55,'#d9dee4','tbnsew');for(let i=0;i<4;i++){b.box(-.121,.33,-.35+i*.18,.121,.37,-.27+i*.18,'#28323c','ew')}b.box(-.06,.3,-.69,.06,.37,-.68,'#28323c','n')},
 cash(b){b.box(-.42,0,-.14,.42,.48,.14,'#6b4426','tbnsew','#5a391f');b.box(-.12,.48,-.03,.12,.6,.03,'#3a2414','tnsew');b.box(-.43,.2,-.145,.43,.25,.145,'#c9a14a','nsew');
  for(let i=0;i<3;i++)b.box(-.3+i*.22,.44,-.08,-.14+i*.22,.62,.0,'#7cc46a','tnsew')},
 life(b){b.box(-.45,0,-.04,.45,.6,.04,'#fffaf0','tbnsew');b.box(-.45,0,-.045,-.3,.6,.045,'#3557a6','nsew');b.box(-.3,0,-.045,-.15,.6,.045,'#ffffff','nsew');b.box(-.15,0,-.045,0,.6,.045,'#e1453c','nsew');
  b.box(.1,.12,-.05,.38,.16,-.045,'#9aa3ad','n');b.box(.1,.22,-.05,.32,.26,-.045,'#9aa3ad','n');b.box(.22,.38,-.055,.36,.52,-.045,'#d8433a','n')},
 stampHead(b){b.box(-.45,0,-.45,.45,.25,.45,'#2b2d31','tbnsew');b.box(-.43,-.02,-.43,.43,0,.43,'#d8433a','b');b.box(-.12,.25,-.12,.12,.9,.12,'#8a5a34','tnsew');b.box(-.24,.9,-.24,.24,1.25,.24,'#b5372f','tnsew')},
 stampMark(b){for(const [x0,z0,x1,z1] of [[-.45,-.45,.45,-.37],[-.45,.37,.45,.45],[-.45,-.45,-.37,.45],[.37,-.45,.45,.45],[-.25,-.1,.25,.04]])b.box(x0,.012,z0,x1,.016,z1,'#e06a63','t')},
 envelope(b){b.box(-1.5,0,-1,1.5,.08,1,'#e2c08f','tnsew');b.box(-1.45,.08,-.95,1.45,.1,-.1,'#d6b27c','t');b.box(.4,.08,.2,1.2,.11,.7,'#d8433a','t');b.box(.48,.11,.28,1.12,.115,.62,'#e2c08f','t');b.box(-1.2,.081,.3,-.2,.1,.4,'#7a6a5a','t');b.box(-1.2,.081,.5,-.4,.1,.6,'#7a6a5a','t')}
};
export function makeItems(R){const out={};for(const k in ITEM){const b=new Builder();ITEM[k](b);out[k]=R.mesh(b)}
 const sh=new Builder();sh.disc(0,0,.5,0,.001,.12,'#000000',0,null,'t');out.shadow=R.mesh(sh);
 const cube=new Builder();cube.box(-.5,-.5,-.5,.5,.5,.5,'#ffffff','tbnsew');out.cube=R.mesh(cube);return out}

// ---- piste : ramettes de papier (feuilles blanches dessus, emballage coloré dessous) et quadrillage Seyès
const WRAP=['#cfe0ef','#e3c597','#d3e6c8','#ddd3ee','#f2d0c4'];
export function trackMesh(R,seg){const b=new Builder(),x0=-TW/2,x1=TW/2,z=s=>-s;
 const cuts=[seg.draw,...seg.seams.filter(q=>q>seg.draw+1&&q<seg.L-1),seg.L];
 const pieces=[];for(let i=0;i<cuts.length-1;i++){let a=cuts[i],c=cuts[i+1];const gs=seg.gaps.filter(([g0,g1])=>g1>a&&g0<c).sort((p,q)=>p[0]-q[0]);let cur=a;for(const [g0,g1] of gs){if(g0>cur)pieces.push([cur,g0]);cur=Math.max(cur,g1)}if(c>cur)pieces.push([cur,c])}
 pieces.forEach(([a,c],i)=>{const wrap=WRAP[(seg.id*3+i)%WRAP.length],side=shade(hex(wrap),.92);
  b.box(x0,-.34,z(c),x1,0,z(a),C.paper,'tnsew',C.paperSide);
  for(const y of [-.11,-.22])b.box(x0-.004,y,z(c)-.004,x1+.004,y+.012,z(a)+.004,C.sheet,'nsew');
  b.box(x0-.025,-REAM,z(c)+.02,x1+.025,-.34,z(a)-.02,wrap,'tnsew',side);
  // étiquette de la ramette sur les flancs
  const mid=(a+c)/2;if(c-a>4){b.box(x0-.035,-1.6,z(mid+1.2),x0-.03,-.75,z(mid-1.2),'#fbf8f0','w');b.box(x0-.04,-1.45,z(mid+.9),x0-.035,-1.3,z(mid-.9),shade(hex(wrap),.72),'w');
   b.box(x1+.03,-1.6,z(mid+1.2),x1+.035,-.75,z(mid-1.2),'#fbf8f0','e');b.box(x1+.035,-1.45,z(mid+.9),x1+.04,-1.3,z(mid-.9),shade(hex(wrap),.72),'e')}
  // Seyès : interlignes fines, une ligne plus marquée tous les 4, marge rouge
  for(let s=Math.ceil(a/.5)*.5;s<c;s+=.5){const k=Math.round(s/.5)%4===0;b.box(x0+.02,.008,z(s)-(k?.025:.013),x1-.02,.012,z(s)+(k?.025:.013),k?C.blueDark:C.blue,'t')}
  for(let x=x0+1.05;x<x1-.1;x+=1.0)b.box(x-.011,.009,z(c),x+.011,.013,z(a),C.blue,'t');
  b.box(x0+.4,.01,z(c),x0+.45,.014,z(a),C.margin,'t')});
 return R.mesh(b)}

// bureau : lattes de bois, réutilisé autour de la caméra
export function deskMesh(R){const b=new Builder();for(let i=-30;i<30;i++){const col=i%2?'#c99a63':'#c2925b';b.box(i*2,-REAM-.02,-120,i*2+2,-REAM,120,col,'t');b.box(i*2+1.97,-REAM-.019,-120,i*2+2,-REAM+.001,120,'#a87a45','t')}
 for(let z=-120;z<120;z+=17)for(let i=-30;i<30;i+=3)b.box(i*2+((z/17)%2)*2,-REAM-.019,z,i*2+((z/17)%2)*2+2,-REAM+.0015,z+.04,'#a87a45','t');return R.mesh(b)}

// ---- décor géant posé sur le bureau (tasse, livres, plante, ordinateur…)
const DECOR={
 bigmug(b,r){const col=['#e85d4f','#3d7fd1','#f2c230','#5fb36a'][r(4)];b.disc(0,0,3,0,7,.5,col,.6);b.disc(0,0,2.4,0,6.6,.5,'#5a3424');b.box(2.8,1.5,-.35,4.2,2.1,.35,col,'tbnsew');b.box(3.6,1.5,-.35,4.2,5.4,.35,col,'tbnsew');b.box(2.8,4.8,-.35,4.2,5.4,.35,col,'tbnsew')},
 books(b,r){const cols=['#c0453c','#3d6fb6','#4f9a5c','#e3a63a','#7b5aa6','#2f6b7a'];let y=0;for(let i=0;i<3+r(3);i++){const w=6+r(3),d=4+r(2),h=.9+r(3)*.2,c=cols[r(cols.length)];b.box(-w/2+r(5)*.1,y,-d/2,w/2,y+h,d/2,c,'tnsew');b.box(-w/2+.15,y+.1,-d/2-.01,w/2-.15,y+h-.1,d/2+.01,'#f4efe2','ew');y+=h}},
 plant(b,r){b.box(-1.6,0,-1.6,1.6,3,1.6,'#c9724a','tnsew','#b8643f');b.box(-1.8,2.6,-1.8,1.8,3.2,1.8,'#d4804f','tnsew');b.box(-1.5,3.1,-1.5,1.5,3.2,1.5,'#4a3324','t');
  for(let i=0;i<9;i++){const a=i*.7,h=3.4+(i%3)*1.2,x=Math.cos(a)*.8,z=Math.sin(a)*.8;b.box(x-.5,3.2,z-.5,x+.5,h+1.2,z+.5,i%2?'#4caf50':'#3f9d47','tnsew');b.box(x-1.2,h,z-.3,x+1.2,h+.5,z+.3,'#5cbf5f','tnsew')}},
 laptop(b,r){b.box(-7,0,-4.5,7,.6,4.5,'#c7ccd2','tnsew','#b4bac1');for(let i=0;i<4;i++)for(let j=0;j<12;j++)b.box(-6+j,.6,-3.6+i*.9,-5.2+j,.75,-2.9+i*.9,'#3a3d42','tnsew');b.box(-2,.6,1.2,2,.62,3.6,'#b4bac1','t');
  b.box(-7,.6,-4.9,7,9.5,-4.4,'#b4bac1','tnsew');b.box(-6.5,1.2,-4.41,6.5,9,-4.4,'#2c3e57','s');b.box(-5.5,6,-4.399,-1,7.4,-4.39,'#f2c230','s');b.box(-5.5,3,-4.399,4,4,-4.39,'#7cc46a','s')},
 penholder(b,r){b.disc(0,0,1.6,0,4,.4,'#2f6b7a',.4);b.disc(0,0,1.25,0,3.8,.4,'#20333a');const cols=['#f2c230','#e5574a','#3d7fd1','#5fb36a'];for(let i=0;i<4;i++){const x=(i%2?.5:-.5),z=(i<2?.5:-.5),h=7+i*.6;b.box(x-.3,1,z-.3,x+.3,h,z+.3,cols[i],'tnsew');b.box(x-.2,h,z-.2,x+.2,h+.6,z+.2,'#ecc89a','tnsew');b.box(x-.08,h+.6,z-.08,x+.08,h+.9,z+.08,'#3a3a3a','tnsew')}},
 tape(b,r){b.box(-2.2,0,-1,2.2,1.6,1,'#2b2d31','tnsew');b.vdisc(-.3,2.1,1.3,-.6,.6,.3,'#d9e6ea','#c5d4d9');b.vdisc(-.3,2.1,.6,-.61,.61,.3,'#8a6a4a')},
 ball(b,r){for(let i=0;i<14;i++){const x=(r(9)-4)*.3,y=1+(r(9)-4)*.25,z=(r(9)-4)*.3;b.box(x-.6,Math.max(0,y-.6),z-.6,x+.6,y+.6,z+.6,i%3?'#f4f1e8':'#e6e1d4','tnsew')}},
 folder(b,r){b.box(-5,0,-3.5,5,.3,3.5,'#e7c27a','tnsew');for(let i=0;i<4;i++)b.box(-4.6+i*.05,.3+i*.06,-3.2,4.6,.36+i*.06,3.2,'#fbf9f3','tnsew');b.box(-5,.6,-3.6,5,.75,3.4,'#e7c27a','tnsew');b.box(-3.6,.75,-2.6,1.4,.77,-1.8,'#d8433a','t');b.box(-3.6,.75,-1.4,3.4,.77,-1.1,'#7a6a5a','t');b.box(-3.6,.75,-.8,2.2,.77,-.5,'#7a6a5a','t')},
 piggy(b,r){b.box(-2.2,1,-1.4,2.2,3.6,1.4,'#f6a6c1','tnsew','#ec96b3');b.box(-2.6,1.8,-.7,-2.2,2.9,.7,'#f08fb0','tnsew');b.box(-2.62,2.1,-.4,-2.6,2.6,-.15,'#c46a8a','w');b.box(-2.62,2.1,.15,-2.6,2.6,.4,'#c46a8a','w');
  for(const [x,z] of [[-1.4,-.8],[-1.4,.8],[1.4,-.8],[1.4,.8]])b.box(x-.35,0,z-.35,x+.35,1,z+.35,'#ec96b3','tnsew');b.box(-.8,3.6,-.1,.8,3.62,.1,'#3a2a2a','t');b.box(-1.8,3.2,-1.41,-1.5,3.5,-1.4,'#2a2222','n');b.box(-1.8,3.2,1.4,-1.5,3.5,1.41,'#2a2222','s');b.box(-1.8,3.6,-1,-1.2,4.2,-.5,'#f6a6c1','tnsew');b.box(-1.8,3.6,.5,-1.2,4.2,1,'#f6a6c1','tnsew')},
 lamp(b,r){b.disc(0,0,2,0,.6,.4,'#3a3d42');b.box(-.3,.6,-.3,.3,6,.3,'#3a3d42','tnsew');b.box(-.3,5.6,-.3,4,6.2,.3,'#3a3d42','tnsew');b.box(3,4.4,-1.2,5.4,5.8,1.2,'#f2c230','tnsew','#e0b028');b.box(3.3,4.38,-.9,5.1,4.4,.9,'#fff6c8','b')}
};
export const DECOR_KINDS=Object.keys(DECOR);
export function makeDecor(R){const out={};for(const k in DECOR){const b=new Builder();let s=k.length*7+3;const r=n=>{s=(s*9301+49297)%233280;return Math.floor(s/233280*n)};DECOR[k](b,r);out[k]=R.mesh(b)}return out}
export const DECOR_SIZE={bigmug:4.3,books:4.8,plant:2.4,laptop:7.6,penholder:1.8,tape:2.4,ball:1.8,folder:5.4,piggy:2.8,lamp:5.5};
export const ITEM_KINDS=Object.keys(ITEM);
export {KINDS};
