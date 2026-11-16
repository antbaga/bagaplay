// BagaWorld : modèles voxel. Terrain en morceaux de 16 × 16 cases (sol « texturé » par petites variations de teinte,
// flancs de terre, végétation et bâtiments compris), personnages (4 classes, équipement visible), monstres et PNJ.
import {Builder,hex,shade} from './urssaf-gl.js';
import {T,P} from './bagaworld-world.js';

export const BH=.5,CH=16;   // hauteur d'un bloc, taille d'un morceau de terrain
const hash=(x,z,k=0)=>{let n=(x*73856093^z*19349663^k*83492791)>>>0;n=(n^(n>>>13))*1274126177>>>0;return((n^(n>>>16))>>>0)/4294967296};
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const TOP={[T.grass]:['#7cc45a','#6db54d','#8fd06a'],[T.dark]:['#4f8f45','#467f3d','#5c9c50'],[T.sand]:['#ecd9a0','#e3cd8f','#f2e2b4'],[T.water]:['#3f97d8','#3a8fd0','#4aa2e0'],
 [T.path]:['#b9935f','#a98454','#c6a06c'],[T.stone]:['#c9c3b6','#b9b2a4','#d6d0c4'],[T.flowers]:['#86c95e','#7aba52','#90d366'],[T.wood]:['#9a6b3e','#8a5e35','#a87646'],[T.moss]:['#8ab069','#7aa05c','#98bd77']};
const SIDE={[T.grass]:'#8a6a45',[T.dark]:'#6e5236',[T.sand]:'#d9c28a',[T.path]:'#8a6a45',[T.stone]:'#9a9488',[T.flowers]:'#8a6a45',[T.wood]:'#6b4a2a',[T.moss]:'#7d7a6a',[T.water]:'#2f6fa8'};

// ---- un morceau de terrain
export function chunkMesh(R,W,cx,cz){const b=new Builder(),N=W.N,x0=cx*CH,z0=cz*CH;
 const H=(x,z)=>x<0||z<0||x>=N||z>=N?0:W.h[z*N+x];
 for(let z=z0;z<Math.min(N,z0+CH);z++)for(let x=x0;x<Math.min(N,x0+CH);x++){const k=z*N+x,ty=W.type[k],h=W.h[k],y=h*BH,pal=TOP[ty].map(hex);
  if(ty===T.water&&h===0){b.box(x,-.3,z,x+1,-.25,z+1,'#2a6aa0','t');continue}   // fond ; la surface de l'eau est un maillage à part
  // dessus en 2 × 2 « pixels » de teintes voisines : effet de texture
  for(let j=0;j<2;j++)for(let i=0;i<2;i++){const c=pal[Math.floor(hash(x*2+i,z*2+j,ty)*3)];let col=c;
   if(ty===T.stone&&((x+z)%2))col=shade(c,.94);if(ty===T.flowers&&hash(x*2+i,z*2+j,9)<.22)col=hex(['#ff7aa8','#ffd23f','#ffffff','#b48cff'][Math.floor(hash(x,z,i+j*2)*4)]);
   b.box(x+i*.5,y-.02,z+j*.5,x+i*.5+.5,y,z+j*.5+.5,col,'t')}
  // flancs jusqu'à la hauteur des voisines (bande d'herbe en haut, terre en dessous)
  const sideC=hex(SIDE[ty]),topBand=ty===T.grass||ty===T.dark||ty===T.flowers||ty===T.moss?pal[0]:sideC;
  for(const [dx,dz,f] of [[1,0,'e'],[-1,0,'w'],[0,1,'s'],[0,-1,'n']]){const nh=H(x+dx,z+dz),ny=(W.type[(z+dz)*N+x+dx]===T.water&&nh===0)?-.3:nh*BH;if(ny>=y-.001)continue;
   b.box(x,ny,z,x+1,y-.12,z+1,sideC,f,shade(sideC,.92));b.box(x,y-.12,z,x+1,y-.02,z+1,topBand,f,shade(topBand,.85))}
  propMesh(b,W.prop[k],x,y,z,k,ty)}
 for(const bd of W.buildings)if(Math.floor(bd.door.x/CH)===cx&&Math.floor(bd.door.z/CH)===cz)buildingMesh(b,bd,W);
 return R.mesh(b)}
// surface de l'eau (dessinée en semi-transparence)
export function waterMesh(R,W){const b=new Builder(),N=W.N;for(let z=0;z<N;z++)for(let x=0;x<N;x++){const k=z*N+x;if(W.type[k]!==T.water||W.h[k]!==0)continue;
 b.box(x,.12,z,x+1,.14,z+1,hash(x,z,3)<.5?'#4aa2e0':'#59b0ea','t')}return R.mesh(b)}

function tree(b,x,y,z,k,big=1){const s=.8+hash(k,1)*.4*big,cx=x+.5,cz=z+.5;b.box(cx-.12,y,cz-.12,cx+.12,y+1.1*s,cz+.12,'#7a5236','tnsew','#6b4a2f');
 const g=['#4ea845','#5cb84f','#46993f'];for(const [ox,oy,oz,w] of [[0,1.0,0,.9],[.18,1.5,.1,.62],[-.2,1.35,-.15,.6],[0,1.85,0,.48]])b.cbox(cx+ox*s,y+oy*s,cz+oz*s,w*s,.5*s,w*s,g[Math.floor(hash(k,oy*10)*3)],'tnsew',shade(hex(g[0]),.85));
 if(hash(k,7)<.3)b.cbox(cx+.25*s,y+1.25*s,cz-.3*s,.1,.1,.1,'#e2453c','tnsew')}
function propMesh(b,p,x,y,z,k,ty){const cx=x+.5,cz=z+.5;
 switch(p){
  case P.tree:tree(b,x,y,z,k);break;
  case P.pine:{const s=.85+hash(k,2)*.35;b.box(cx-.1,y,cz-.1,cx+.1,y+.5,cz+.1,'#6b4a2f');for(let i=0;i<4;i++){const w=(1-i*.22)*s;b.cbox(cx,y+.4+i*.42*s,cz,w,.45*s,w,i%2?'#2f7a4a':'#2a6b42','tnsew','#245c39')}b.cbox(cx,y+.4+4*.42*s,cz,.15,.25,.15,'#ffffff');break}
  case P.palm:{let px=cx,pz=cz;for(let i=0;i<6;i++){b.cbox(px,y+i*.3,pz,.18,.3,.18,i%2?'#a37a4a':'#8f6a3e');px+=.04}for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[.7,.7],[-.7,-.7]])b.box(Math.min(px,px+dx*.8),y+1.8,Math.min(pz,pz+dz*.8),Math.max(px,px+dx*.8)+.12,y+1.88,Math.max(pz,pz+dz*.8)+.12,'#5cb84f','tnsew');b.cbox(px+.1,y+1.6,pz,.14,.14,.14,'#7a5236');break}
  case P.rock:{const s=.6+hash(k,3)*.5;b.cbox(cx,y,cz,.7*s,.42*s,.6*s,'#9a9a9a','tnsew','#858585');b.cbox(cx+.15*s,y+.38*s,cz-.05,.38*s,.24*s,.36*s,'#b0b0b0','tnsew','#949494');if(ty===T.moss||hash(k,4)<.3)b.cbox(cx-.1,y+.42*s,cz+.1,.3*s,.04,.25*s,'#6aa84f','t');break}
  case P.bush:{const s=.7+hash(k,5)*.3;b.cbox(cx,y,cz,.7*s,.45*s,.7*s,'#4ea845','tnsew','#3f8f39');b.cbox(cx,y+.4*s,cz,.45*s,.2*s,.45*s,'#5cb84f');if(hash(k,6)<.4)for(const [ox,oz] of [[.2,.1],[-.15,-.2]])b.cbox(cx+ox,y+.46*s,cz+oz,.08,.08,.08,'#ff7aa8');break}
  case P.shroom:{const s=.9+hash(k,8)*.6;b.cbox(cx,y,cz,.24*s,.7*s,.24*s,'#f3ead8','tnsew','#e2d6bf');b.cbox(cx,y+.65*s,cz,.9*s,.22*s,.9*s,'#d94a3a','tnsew','#b93a2c');b.cbox(cx,y+.85*s,cz,.6*s,.14*s,.6*s,'#e25a48');
   for(const [ox,oz] of [[.25,.1],[-.2,-.22],[.05,.3],[-.28,.18]])b.cbox(cx+ox*s,y+.87*s,cz+oz*s,.1*s,.03,.1*s,'#ffffff','t');break}
  case P.stump:b.cbox(cx,y,cz,.5,.32,.5,'#8a5e35','tnsew','#7a5236');b.cbox(cx,y+.32,cz,.4,.01,.4,'#d9b47a','t');break;
  case P.fence:b.cbox(cx,y,cz,.12,.6,.12,'#a87646');b.box(x,y+.35,cz-.04,x+1,y+.43,cz+.04,'#c08a52','tnsew');b.box(cx-.04,y+.35,z,cx+.04,y+.43,z+1,'#c08a52','tnsew');break;
  case P.lamp:b.cbox(cx,y,cz,.1,1.5,.1,'#3b3f46');b.cbox(cx,y+1.5,cz,.3,.32,.3,'#ffd76a','tnsew','#f2c14e');b.cbox(cx,y+1.82,cz,.36,.06,.36,'#3b3f46');break;
  case P.barrel:b.cbox(cx,y,cz,.5,.62,.5,'#9a6b3e','tnsew','#8a5e35');for(const yy of [.1,.48])b.cbox(cx,y+yy,cz,.52,.05,.52,'#55555c','nsew');break;
  case P.deco:for(let i=0;i<4;i++){const ox=hash(k,i)*.7+.15,oz=hash(k,i+5)*.7+.15;b.box(x+ox,y,z+oz,x+ox+.04,y+.18,z+oz+.04,'#4e9a3e');b.box(x+ox-.04,y+.18,z+oz-.04,x+ox+.08,y+.24,z+oz+.08,['#ff7aa8','#ffd23f','#ffffff','#b48cff'][i])}break;
  case P.statue:b.cbox(cx,y,cz,.8,.5,.8,'#bdb6a8','tnsew','#a59e90');b.cbox(cx,y+.5,cz,.3,.5,.3,'#e8833a');b.cbox(cx,y+1,cz,.36,.3,.36,'#f2a33a');for(const s of [-1,1])b.box(cx+s*.18,y+.8,cz-.06,cx+s*.62,y+.9,cz+.06,'#ff5a3a','tnsew');b.cbox(cx,y+1.3,cz-.18,.08,.06,.12,'#ffd23f');break;
  case P.fountain:b.cbox(cx,y,cz,.96,.35,.96,'#bdb6a8','tnsew','#a59e90');b.cbox(cx,y+.35,cz,.7,.02,.7,'#59b0ea','t');for(const s of [-1,1])b.cbox(cx+s*.36,y+.35,cz,.1,1.1,.1,'#8c7cd9');b.cbox(cx,y+1.45,cz,.82,.1,.1,'#8c7cd9');b.cbox(cx,y+1.55,cz,.18,.18,.18,'#c9b8ff');break;
  case P.throne:b.cbox(cx,y,cz,1.1,.4,1,'#d4a017','tnsew','#b8890f');b.box(cx-.55,y+.4,cz-.5,cx+.55,y+1.7,cz-.3,'#d4a017','tnsew','#b8890f');b.cbox(cx,y+.4,cz,.9,.12,.8,'#c0392b');for(const s of [-1,1])b.cbox(cx+s*.5,y+1.7,cz-.4,.12,.25,.12,'#f2c14e');break;
  case P.sign:b.cbox(cx,y,cz,.1,.8,.1,'#7a5236');b.cbox(cx,y+.6,cz,.6,.3,.06,'#c08a52');break}}

function buildingMesh(b,bd,W){const {x0,z0,w,d,h}=bd,y=W.h[z0*W.N+x0]*BH,wall=hex(bd.wall),roof=hex(bd.roof),top=y+h*.9;
 b.box(x0+.05,y,z0+.05,x0+w-.05,top,z0+d-.05,wall,'tnsew',shade(wall,.92));
 // colombages et soubassement en pierre
 b.box(x0,y,z0,x0+w,y+.35,z0+d,'#9a9488','nsew','#8c8679');for(let i=0;i<=w;i+=2)b.box(x0+i-.06,y+.35,z0+d-.07,x0+i+.06,top,z0+d-.03,'#6b4a2f','s');b.box(x0,top-.12,z0+d-.08,x0+w,top,z0+d-.02,'#6b4a2f','s');
 // fenêtres et porte
 for(let i=1;i<w-1;i+=2)if(Math.abs(x0+i+.5-bd.door.x-.5)>.8){b.box(x0+i+.15,y+1.05,z0+d-.04,x0+i+.85,y+1.6,z0+d,'#7fc8f0','s');b.box(x0+i+.1,y+1.0,z0+d-.02,x0+i+.9,y+1.05,z0+d+.06,'#6b4a2f','ts')}
 b.box(bd.door.x+.15,y,z0+d-.03,bd.door.x+.85,y+1.25,z0+d+.01,'#7a4a2a','s');b.box(bd.door.x+.62,y+.55,z0+d+.01,bd.door.x+.7,y+.63,z0+d+.05,'#f2c14e','s');
 // toit en escalier (deux pentes) avec débord
 const steps=Math.ceil(d/2)+1;for(let i=0;i<steps;i++){const inset=i*(d/2)/steps;b.box(x0-.25,top+i*.35,z0-.25+inset,x0+w+.25,top+(i+1)*.35,z0+d+.25-inset,i%2?roof:shade(roof,1.08),'tnsew',shade(roof,.85))}
 b.box(x0+w-1.4,top+.3,z0+.8,x0+w-.9,top+steps*.35+.4,z0+1.3,'#8a5e35','tnsew');
 // enseigne au-dessus de la porte
 if(bd.sign){b.box(bd.door.x-.6,y+1.45,z0+d+.02,bd.door.x+1.6,y+1.85,z0+d+.12,'#c08a52','tnsew','#a87646');b.box(bd.door.x-.4,y+1.55,z0+d+.12,bd.door.x+1.4,y+1.75,z0+d+.13,shade(roof,1.2),'s')}
 // auvent coloré
 b.box(bd.door.x-.6,y+1.3,z0+d,bd.door.x+1.6,y+1.38,z0+d+.6,roof,'tnsew',shade(roof,.8))}

// ---- personnages (rig : jambes, torse, bras, tête), d'après la classe, l'apparence et l'équipement
const CLS_LOOK={bourrin:{tunic:'#d9483b',trim:'#f2c14e',pants:'#5a4632',extra:'sword'},viseur:{tunic:'#3e8f4e',trim:'#c9a46a',pants:'#5a4a32',extra:'quiver',hood:'#2f7040'},
 bisou:{tunic:'#e86fae',trim:'#ffe0f0',pants:'#ffffff',extra:'heart'},fourbe:{tunic:'#4b3f6b',trim:'#9fd36b',pants:'#2b2638',extra:'mask',hood:'#3a3054'}};
const CAPE_COL={cape_mouton:'#f4f1e8',cape_moustik:'#5a5f6b'};
export function charParts(R,look){const L=CLS_LOOK[look.cls]||CLS_LOOK.bourrin,skin=look.skin||'#f2c493',hair=look.hair||'#5a3a24',eq=look.eq||{},parts={};let b=new Builder();
 b.box(-.16,0,-.1,.16,.36,.1,L.tunic,'tbnsew');b.box(-.165,.02,-.105,.165,.08,.105,L.trim,'nsew');b.box(-.07,.12,-.106,.07,.3,-.1,L.trim,'n');
 if(L.extra==='heart'){b.box(-.06,.2,-.11,.06,.27,-.105,'#e2453c','n');b.box(-.03,.16,-.11,.03,.2,-.105,'#e2453c','n')}
 if(L.extra==='sword'){b.box(-.04,.05,.1,.04,.62,.14,'#c9ced6','tnsew');b.box(-.1,.4,.1,.1,.44,.15,'#6b4a2f','tnsew')}
 if(L.extra==='quiver'){b.box(.02,.05,.1,.12,.4,.18,'#8a5e35','tnsew');for(let i=0;i<3;i++)b.box(.03+i*.03,.4,.12,.05+i*.03,.5,.14,'#e8e2d6','tnsew')}
 if(eq.belt)b.box(-.165,.06,-.108,.165,.11,.108,eq.belt==='ceinture_crabe'?'#e8573f':'#6b4a2f','nsew');
 if(eq.cape){const cc=CAPE_COL[eq.cape]||'#7a3b8a';b.box(-.15,-.12,.1,.15,.36,.13,cc,'tnsew',shade(hex(cc),.85))}
 if(eq.amulet)b.box(-.03,.25,-.115,.03,.31,-.105,'#f2c14e','n');
 parts.torso=R.mesh(b);
 b=new Builder();b.box(-.16,0,-.16,.16,.32,.16,skin,'tbnsew');b.box(-.1,.14,-.17,-.05,.2,-.16,'#2b2622','n');b.box(.05,.14,-.17,.1,.2,-.16,'#2b2622','n');b.box(-.04,.07,-.165,.04,.09,-.16,'#b5654a','n');
 const hat=eq.hat;
 if(L.hood&&!hat){b.box(-.18,.18,-.18,.18,.38,.18,L.hood,'tnsew');b.box(-.18,.0,.1,.18,.3,.18,L.hood,'nsew')}
 else if(!hat){b.box(-.17,.26,-.17,.17,.36,.17,hair,'tnsew');b.box(-.17,.12,.12,.17,.3,.17,hair,'nsew');if(look.sex==='f')b.box(-.12,-.05,.14,.12,.22,.2,hair,'tnsew');
  if(look.cls==='bourrin')for(const [x,z] of [[-.1,-.05],[.05,.05],[.1,-.1]])b.box(x,.36,z,x+.06,.44,z+.06,hair,'tnsew');
  if(look.cls==='bourrin')b.box(-.17,.24,-.172,.17,.28,.17,'#e2453c','n');if(look.cls==='bisou')b.box(.08,.3,-.12,.16,.38,-.04,'#ffd23f','tnsew')}
 if(L.extra==='mask')b.box(-.165,.04,-.175,.165,.12,-.16,'#9fd36b','nsew');
 if(hat==='coiffe_paille'){b.box(-.3,.3,-.3,.3,.34,.3,'#e8c86a','tnsew','#d4b04f');b.box(-.17,.34,-.17,.17,.48,.17,'#e8c86a','tnsew');b.box(-.175,.34,-.175,.175,.38,.175,'#c0392b','nsew')}
 if(hat==='coiffe_mouton'){b.box(-.19,.24,-.19,.19,.44,.19,'#f4f1e8','tnsew');for(const s of [-1,1])b.box(s>0?.16:-.26,.24,-.06,s>0?.26:-.16,.34,.06,'#8a7a5a','tnsew')}
 if(hat==='coiffe_sanglier'){b.box(-.2,.26,-.22,.2,.46,.2,'#7a5236','tnsew');b.box(-.1,.28,-.3,.1,.38,-.2,'#9a6b4a','tnsew');for(const s of [-1,1])b.box(s*.12-.02,.24,-.32,s*.12+.02,.32,-.28,'#efe2c9','tnsew')}
 if(hat==='couronne'){b.box(-.17,.32,-.17,.17,.42,.17,'#f2c14e','nsew');for(const [x,z] of [[-.15,-.15],[.11,-.15],[-.15,.11],[.11,.11],[-.02,-.15]])b.box(x,.42,z,x+.05,.5,z+.05,'#f2c14e','tnsew');b.box(-.03,.36,-.18,.03,.4,-.17,'#e2453c','n')}
 parts.head=R.mesh(b);
 for(const side of ['L','R']){b=new Builder();b.box(-.05,-.34,-.05,.05,0,.05,L.tunic,'tbnsew');b.box(-.051,-.34,-.051,.051,-.27,.051,skin,'bnsew');b.box(-.052,-.08,-.052,.052,-.03,.052,L.trim,'nsew');parts['arm'+side]=R.mesh(b);
  b=new Builder();b.box(-.06,-.34,-.06,.06,0,.06,L.pants,'tbnsew');b.box(-.065,-.34,-.1,.065,-.26,.065,eq.boots?'#5a3a24':'#3b2f28','tbnsew');parts['leg'+side]=R.mesh(b)}
 // arme tenue en main
 const wp=eq.weapon;b=new Builder();
 if(wp==='arc_bois'){b.box(-.02,-.6,-.16,.02,-.1,-.12,'#8a5e35','tnsew');b.box(-.02,-.62,-.12,.02,-.58,.02,'#8a5e35','tnsew');b.box(-.02,-.14,-.12,.02,-.1,.02,'#8a5e35','tnsew');b.box(-.005,-.58,.0,.005,-.14,.01,'#ffffff','tnsew')}
 else if(wp==='baguette'){b.box(-.025,-.36,-.4,.025,-.31,.02,'#d9a456','tnsew');b.box(-.03,-.37,-.42,.03,-.3,-.38,'#ff7a3a','tnsew')}
 else if(wp==='dague'){b.box(-.02,-.36,-.26,.02,-.33,-.05,'#d9dee3','tnsew');b.box(-.04,-.37,-.06,.04,-.32,0,'#3b3f46','tnsew')}
 else if(wp==='epee_rouillee'||wp==='hache_sanglier'){b.box(-.025,-.36,-.5,.025,-.32,-.08,wp==='hache_sanglier'?'#7a5236':'#b8a37a','tnsew');if(wp==='hache_sanglier')b.box(-.03,-.44,-.52,.03,-.28,-.38,'#c9ced6','tnsew');else b.box(-.07,-.37,-.1,.07,-.31,-.06,'#6b4a2f','tnsew')}
 else b.box(-.02,-.36,-.45,.02,-.32,.08,'#8a6a45','tnsew');
 parts.weapon=R.mesh(b);return parts}
export function npcParts(R,n){const parts=charParts(R,{cls:'bisou',skin:'#f2c493',hair:'#d9d9d9'});let b=new Builder(),col=n.col;
 b.box(-.16,0,-.1,.16,.36,.1,col,'tbnsew');b.box(-.165,.02,-.105,.165,.08,.105,shade(hex(col),.7),'nsew');parts.torso=R.mesh(b);
 b=new Builder();b.box(-.16,0,-.16,.16,.32,.16,'#f2c493','tbnsew');b.box(-.1,.14,-.17,-.05,.2,-.16,'#2b2622','n');b.box(.05,.14,-.17,.1,.2,-.16,'#2b2622','n');b.box(-.17,.26,-.17,.17,.34,.17,'#d9d9d9','tnsew');
 if(n.hat==='top'){b.box(-.14,.34,-.14,.14,.7,.14,'#2b2b30','tnsew');b.box(-.24,.32,-.24,.24,.36,.24,'#2b2b30','tnsew');b.box(-.145,.36,-.145,.145,.42,.145,'#c0392b','nsew');b.box(-.1,.04,-.18,.1,.08,-.16,'#d9d9d9','n')}
 if(n.hat==='bun'){b.box(-.08,.34,-.04,.08,.46,.1,'#d9d9d9','tnsew');b.box(-.12,.15,-.175,.12,.19,-.16,'#8a6a45','n')}
 if(n.hat==='band'){b.box(-.17,.24,-.172,.17,.28,.17,'#e2453c','nsew');b.box(-.12,.02,-.18,.12,.1,-.16,'#5a3a24','n')}
 if(n.hat==='helmet'){b.box(-.19,.22,-.19,.19,.4,.19,'#9aa4ae','tnsew');b.box(-.03,.4,-.03,.03,.5,.03,'#e2453c','tnsew')}
 if(n.hat==='wizard'){b.box(-.2,.32,-.2,.2,.36,.2,'#2f6b4a','tnsew');b.box(-.14,.36,-.14,.14,.52,.14,'#2f6b4a','tnsew');b.box(-.08,.52,-.08,.08,.66,.08,'#2f6b4a','tnsew');b.box(-.03,.66,-.03,.03,.74,.03,'#ffd23f','tnsew');b.box(-.1,-.04,-.18,.1,.08,-.16,'#ffffff','n')}
 parts.head=R.mesh(b);b=new Builder();parts.weapon=R.mesh(b);return parts}
export function drawChar(R,M4,parts,root,pose,tint,alpha=1){const T=M4.t,rx=M4.rx,mul=M4.mul;let base=mul(root,T(0,pose.bob||0,0));if(pose.lean)base=mul(base,mul(T(0,.34,0),mul(rx(pose.lean),T(0,-.34,0))));
 R.draw(parts.legL,mul(base,mul(T(-.075,.34,0),rx(pose.legL||0))),tint,alpha);R.draw(parts.legR,mul(base,mul(T(.075,.34,0),rx(pose.legR||0))),tint,alpha);R.draw(parts.torso,mul(base,T(0,.34,0)),tint,alpha);
 const up=pose.armUp||0;R.draw(parts.armL,mul(base,mul(T(-.2,.68,0),rx((pose.armL||0)*(1-up)+up*-2.9))),tint,alpha);const armR=mul(base,mul(T(.2,.68,0),rx((pose.armR||0)*(1-up)+up*-2.9)));R.draw(parts.armR,armR,tint,alpha);
 if(parts.weapon)R.draw(parts.weapon,armR,tint,alpha);R.draw(parts.head,mul(base,mul(T(0,.7,0),rx(pose.head||0))),tint,alpha)}

// ---- monstres (un maillage chacun ; l'animation vient du dessin : sauts, écrasement, balancement)
export const MOB_MODEL={
 moutoufou:b=>{for(const [x,y,z,s] of [[0,.35,0,.62],[-.18,.5,.1,.36],[.18,.52,-.05,.38],[0,.62,.12,.34],[-.12,.45,-.2,.32]])b.cbox(x,y,z,s,s*.8,s,'#f4f1e8','tnsew','#e2ddd0');
  b.cbox(0,.4,-.36,.3,.32,.24,'#3b3530','tnsew');for(const s of [-1,1]){b.cbox(s*.09,.56,-.49,.06,.04,.02,'#ffffff','n');b.cbox(s*.09,.62,-.49,.08,.025,.02,'#1d1a18','n');b.cbox(s*.2,.66,-.34,.1,.1,.14,'#8a7a5a')}
  for(const [x,z] of [[-.18,-.15],[.18,-.15],[-.18,.18],[.18,.18]])b.cbox(x,0,z,.1,.22,.1,'#3b3530')},
 poultoss:b=>{b.cbox(0,.05,0,.5,.45,.48,'#ffd23f','tnsew','#f2c22f');b.cbox(0,.5,-.02,.34,.24,.32,'#ffe066');b.cbox(0,.38,-.3,.14,.08,.14,'#f08a2a');for(const s of [-1,1]){b.cbox(s*.1,.56,-.19,.06,.07,.02,'#1d1a18','n');b.cbox(s*.27,.18,0,.06,.2,.2,'#f2c22f');b.cbox(s*.1,0,0,.08,.06,.14,'#f08a2a')}b.cbox(0,.74,.05,.06,.1,.12,'#f08a2a')},
 vermichelle:b=>{for(let i=0;i<5;i++)b.cbox(0,0,-.32+i*.17,.3-i*.03,.26-i*.02,.18,i%2?'#9bd36b':'#8bc35b','tnsew','#5c8f3c');for(const s of [-1,1])b.cbox(s*.07,.15,-.42,.06,.06,.02,'#1d1a18','n');b.cbox(0,.04,-.42,.12,.03,.02,'#5c3a2a','n')},
 crabouillon:b=>{b.cbox(0,.12,0,.62,.26,.46,'#e8573f','tnsew','#c9432f');b.cbox(0,.38,0,.44,.06,.32,'#f0704f');for(const s of [-1,1]){b.cbox(s*.12,.38,-.18,.04,.18,.04,'#c9432f');b.cbox(s*.12,.56,-.18,.08,.08,.08,'#ffffff');b.cbox(s*.12,.58,-.22,.04,.04,.02,'#1d1a18','n');
  b.cbox(s*.42,.2,-.26,.2,.18,.22,'#e8573f','tnsew','#c9432f');b.cbox(s*.48,.24,-.4,.08,.1,.1,'#ffd9b3');for(let k=0;k<3;k++)b.cbox(s*.34,0,-.12+k*.14,.18,.06,.05,'#c9432f')}},
 champi:b=>{b.cbox(0,0,0,.34,.5,.32,'#fff3dc','tnsew','#eadfc4');for(const s of [-1,1]){b.cbox(s*.08,.3,-.17,.06,.08,.02,'#1d1a18','n');b.cbox(s*.24,.2,0,.12,.06,.06,'#fff3dc')}b.cbox(0,.18,-.17,.12,.03,.02,'#b5654a','n');
  b.cbox(0,.48,0,.86,.24,.86,'#d94a3a','tnsew','#b93a2c');b.cbox(0,.72,0,.56,.14,.56,'#e25a48');for(const [x,z] of [[.24,.12],[-.2,-.2],[.05,.3],[-.28,.16],[.16,-.26]])b.cbox(x,.86,z,.1,.02,.1,'#ffffff','t');
  b.cbox(0,.3,-.18,.1,.1,.02,'#f2c14e','n');b.cbox(0,.4,-.17,.04,.1,.02,'#3a6fd9','n')},
 moustikouille:b=>{b.cbox(0,.5,0,.24,.22,.4,'#5a5f6b','tnsew','#484c56');b.cbox(0,.52,-.26,.2,.2,.18,'#6b707c');b.cbox(0,.56,-.52,.03,.03,.36,'#2b2b30');for(const s of [-1,1]){b.cbox(s*.07,.62,-.35,.08,.08,.02,'#e2453c','n');
  b.box(s>0?.1:-.5,.7,-.1,s>0?.5:-.1,.72,.18,'#c9e3ff','tbnsew');for(let k=0;k<3;k++)b.box(s*.1-.02,.2,-.12+k*.12,s*.14,.5,-.1+k*.12,'#2b2b30','tnsew')}},
 sanglier:b=>{b.cbox(0,.25,0,.62,.5,.9,'#7a5236','tnsew','#6b4a2f');b.cbox(0,.75,.1,.3,.1,.5,'#5a3a24');b.cbox(0,.3,-.55,.44,.4,.3,'#7a5236');b.cbox(0,.3,-.74,.22,.16,.1,'#c9907a');
  for(const s of [-1,1]){b.cbox(s*.13,.5,-.71,.08,.03,.02,'#1d1a18','n');b.cbox(s*.13,.55,-.71,.12,.025,.02,'#1d1a18','n');b.box(s*.14-.02,.22,-.86,s*.14+.02,.4,-.8,'#efe2c9','tnsew');b.cbox(s*.16,.7,-.48,.08,.12,.06,'#6b4a2f')}
  for(const [x,z] of [[-.2,-.3],[.2,-.3],[-.2,.3],[.2,.3]])b.cbox(x,0,z,.13,.26,.13,'#5a3a24')},
 araknee:b=>{b.cbox(0,.3,.15,.5,.4,.55,'#3b2f4a','tnsew','#2f253c');b.cbox(0,.3,-.25,.32,.28,.3,'#4a3b5c');b.cbox(0,.55,.2,.18,.04,.18,'#e2453c','t');for(const s of [-1,1]){for(let k=0;k<2;k++)b.cbox(s*(.06+k*.07),.46,-.41,.05,.05,.02,'#ff3b3b','n');
  for(let k=0;k<4;k++){const z=-.25+k*.17;b.box(s>0?.15:-.6,.38,z-.03,s>0?.6:-.15,.43,z+.03,'#2f253c','tnsew');b.box(s>0?.55:-.6,0,z-.03,s>0?.6:-.55,.4,z+.03,'#2f253c','tnsew')}}},
 moutonroyal:b=>{MOB_MODEL.moutoufou(b);b.cbox(0,.88,.06,.3,.1,.3,'#f2c14e','nsew');for(const [x,z] of [[-.12,-.06],[.12,-.06],[0,.18]])b.cbox(x,.98,z,.06,.1,.06,'#f2c14e');b.box(-.32,.2,.25,.32,.75,.32,'#c0392b','tnsew','#a5301f')}};
export function mobMesh(R,id){const b=new Builder();(MOB_MODEL[id]||MOB_MODEL.moutoufou)(b);return R.mesh(b)}
export const MOB_SCALE={moutoufou:1,poultoss:.9,vermichelle:1.1,crabouillon:1,champi:1.15,moustikouille:1,sanglier:1.1,araknee:1.1,moutonroyal:1.9};
export function cubeMesh(R){const b=new Builder();b.box(-.5,-.5,-.5,.5,.5,.5,'#ffffff','tnsewb');return R.mesh(b)}
export function tileMesh(R){const b=new Builder();b.box(.04,0,.04,.96,.02,.96,'#ffffff','t');return R.mesh(b)}
