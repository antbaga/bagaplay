// Pétanque : terrain, physique des lancers et règles (sans affichage). Unités : mètres, secondes.
// Le terrain va de x=-2 à x=2 et de z=0 à z=15. Le cercle de lancer est en (0, 1).
export const FIELD={w:4,l:15},CIRCLE={x:0,z:1},TARGET_SCORE=13;
// Rayons physiques = rayons dessinés (boules un peu plus grosses que nature pour rester lisibles à l'écran) :
// ce qu'on voit se touche vraiment, aucune boule n'en traverse une autre.
export const R_BALL=.06,R_JACK=.025,M_BALL=.7,M_JACK=.03;
const DECEL={ball:1.7,jack:2.4},RESTITUTION=.8,DT=1/240;
// Cochonnet valable : entre 6 et 10 m du cercle, à plus de 50 cm des bords.
export const JACK_MIN=6,JACK_MAX=10,JACK_EDGE=.5;

// ---- équipes
// Équipes et boules comme sur le serveur : 3 boules en tête-à-tête et doublette, 2 en triplette,
// et une équipe plus petite reçoit plus de boules pour que chaque équipe en ait 6.
export function makePlayers(list,rand=Math.random){const n=list.length,small=Math.floor(n/2),smallTeam=rand()<.5?0:1;
 const size=[smallTeam===0?small:n-small,0];size[1]=n-size[0];const big=Math.max(size[0],size[1]);
 const per=t=>big===1?3:6/size[t];const order=list.slice().sort(()=>rand()-.5);
 return order.map((p,k)=>{const team=k<size[0]?0:1;return {id:p.id,name:p.name,team,boules:per(team)}})}
export function initial(list,rand=Math.random){const players=makePlayers(list,rand),start=rand()<.5?0:1;
 const s={v:1,players,score:[0,0],mene:1,phase:'jack',turnTeam:start,jackTeam:start,jack:null,balls:[],left:{},last:null};resetLeft(s);
 const team=players.filter(p=>p.team===start);s.nextThrower=team[Math.floor(rand()*team.length)].id;return s}
function resetLeft(s){s.left={};for(const p of s.players)s.left[p.id]=p.boules}
export const teamLeft=(s,t)=>s.players.filter(p=>p.team===t).reduce((n,p)=>n+(s.left[p.id]||0),0);
export const eligible=(s,t=s.turnTeam)=>s.players.filter(p=>p.team===t&&(s.left[p.id]||0)>0);
export const playerById=(s,id)=>s.players.find(p=>p.id===id);

// ---- lancer
// Visée : angle (radians, gauche/droite) et hauteur (0 = roulette rasante, 1 = plombée haute), puis puissance (0..1).
// La puissance règle la distance totale ; la hauteur partage cette distance entre vol et roulé :
// lancer bas = atterrit tôt et roule loin (et frappe fort), lancer haut = tombe près du but et roule peu.
export const rollRatio=loft=>.72-.64*clampLoft(loft);
const clampLoft=l=>typeof l==='string'?(l==='shoot'?.05:.6):Math.max(0,Math.min(1,l??.6));
export const distanceFor=power=>1+13*Math.max(0,Math.min(1,power));
export function throwParams(kind,angle,power,loft=.6,rand=Math.random){
 const u=clampLoft(loft),noise=a=>(rand()+rand()-1)*a,p=Math.max(0,Math.min(1,power));
 const a=angle+noise(.008+.012*p),D=distanceFor(p)*(1+noise(.02)),rr=rollRatio(u),L=D/(1+rr),R=L*rr*(1+noise(.07));
 const H=(.12+.88*u)*(.6+.28*L);
 return {kind,loft:u,mode:u<.25?'shoot':'point',dir:[Math.sin(a),Math.cos(a)],L,vL:Math.sqrt(2*(kind==='jack'?DECEL.jack:DECEL.ball)*R),
  T:2*Math.sqrt(2*Math.max(H,.2)/9.81)+.08,H,start:{x:CIRCLE.x,z:CIRCLE.z}}}
// Puissance pour une distance totale donnée, et pour atterrir à une distance donnée avec une hauteur donnée.
export const powerFor=(kind,dist)=>(dist-1)/13;
export const landPowerFor=(dist,loft)=>(dist*(1+rollRatio(loft))-1)/13;

const objects=s=>[...(s.jack?[{key:'jack',x:s.jack.x,z:s.jack.z,r:R_JACK,m:M_JACK,kind:'jack'}]:[]),...s.balls.map((b,i)=>({key:'b'+i,x:b.x,z:b.z,r:R_BALL,m:M_BALL,kind:'ball',team:b.team,by:b.by}))];
const outside=o=>Math.abs(o.x)>FIELD.w/2||o.z>FIELD.l||o.z<0;

// Simule un lancer. Renvoie les positions finales, les images de l'animation (60 / s) et les chocs (pour les sons).
export function simulate(s,tp,by){
 const objs=objects(s).map(o=>({...o,vx:0,vz:0,dead:false}));const team=by!=null?playerById(s,by)?.team:null;
 const mover={key:'new',x:tp.start.x+tp.dir[0]*tp.L,z:tp.start.z+tp.dir[1]*tp.L,vx:tp.dir[0]*tp.vL,vz:tp.dir[1]*tp.vL,
  r:tp.kind==='jack'?R_JACK:R_BALL,m:tp.kind==='jack'?M_JACK:M_BALL,kind:tp.kind,team,by,dead:false};
 const events=[{t:tp.T,type:'land',x:mover.x,z:mover.z,kind:tp.kind,mode:tp.mode}];
 if(outside(mover)){mover.dead=true;events.push({t:tp.T,type:'out',kind:tp.kind})}
 // Atterrissage sur (ou juste devant) une boule : choc dans le sens du lancer (carreau).
 if(!mover.dead)for(const o of objs){if(o.dead)continue;const rr=o.r+mover.r,dx=o.x-mover.x,dz=o.z-mover.z,d=Math.hypot(dx,dz);if(d>rr*1.4)continue;
  const nx=tp.dir[0],nz=tp.dir[1],rel=mover.vx*nx+mover.vz*nz,jimp=(1+RESTITUTION)*rel/(1/mover.m+1/o.m);
  o.vx+=jimp/o.m*nx;o.vz+=jimp/o.m*nz;mover.vx-=jimp/mover.m*nx;mover.vz-=jimp/mover.m*nz;
  const ahead=dx*nx+dz*nz;if(ahead<rr){o.x+=nx*(rr-ahead+.001);o.z+=nz*(rr-ahead+.001)}
  events.push({t:tp.T,type:'hit',x:o.x,z:o.z,power:rel,jack:o.kind==='jack',carreau:true})}
 objs.push(mover);const frames=[];let t=0,f=0;const snap=()=>frames.push(objs.map(o=>o.dead?null:[o.x,o.z]));snap();
 while(t<16){let moving=false;
  for(const o of objs){if(o.dead)continue;const sp=Math.sqrt(o.vx*o.vx+o.vz*o.vz);if(sp<1e-4){o.vx=o.vz=0;continue}moving=true;
   const ns=Math.max(0,sp-DECEL[o.kind]*DT),k=ns/sp;o.vx*=k;o.vz*=k;o.x+=o.vx*DT;o.z+=o.vz*DT;
   if(outside(o)){o.dead=true;o.vx=o.vz=0;events.push({t:tp.T+t,type:'out',kind:o.kind})}}
  for(let i=0;i<objs.length;i++)for(let j=i+1;j<objs.length;j++){const a=objs[i],b=objs[j];if(a.dead||b.dead)continue;
   let dx=b.x-a.x,dz=b.z-a.z;const rr=a.r+b.r;let d2=dx*dx+dz*dz;if(d2>=rr*rr)continue;
   if(d2<1e-12){const vx=a.vx-b.vx,vz=a.vz-b.vz,v=Math.hypot(vx,vz)||1;dx=vx/v*1e-6;dz=(vx||vz?vz/v:1)*1e-6;d2=dx*dx+dz*dz}// posé exactement dessus
   const d=Math.sqrt(d2),nx=dx/d,nz=dz/d;
   const rel=(a.vx-b.vx)*nx+(a.vz-b.vz)*nz;const over=rr-d,ta=b.m/(a.m+b.m),tb=a.m/(a.m+b.m);a.x-=nx*over*ta;a.z-=nz*over*ta;b.x+=nx*over*tb;b.z+=nz*over*tb;
   if(rel<=0)continue;const jimp=(1+RESTITUTION)*rel/(1/a.m+1/b.m);a.vx-=jimp/a.m*nx;a.vz-=jimp/a.m*nz;b.vx+=jimp/b.m*nx;b.vz+=jimp/b.m*nz;
   events.push({t:tp.T+t,type:'hit',x:(a.x+b.x)/2,z:(a.z+b.z)/2,power:rel,jack:a.kind==='jack'||b.kind==='jack'})}
  t+=DT;if(++f%4===0)snap();if(!moving)break}
 snap();
 const jack=objs.find(o=>o.kind==='jack');
 return {objs,frames,events,duration:tp.T+t,
  jack:jack&&!jack.dead?{x:jack.x,z:jack.z}:null,jackDead:!!jack&&jack.dead,
  balls:objs.filter(o=>o.kind==='ball'&&!o.dead).map(o=>({x:o.x,z:o.z,team:o.team,by:o.by})),
  order:objs.map(o=>o.key)}}

// ---- règles
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function jackValid(j){if(!j)return false;const d=dist(j,CIRCLE);return d>=JACK_MIN&&d<=JACK_MAX&&Math.abs(j.x)<=FIELD.w/2-JACK_EDGE&&j.z<=FIELD.l-JACK_EDGE}
// Point : équipe la plus proche et nombre de boules qui marquent.
export function standing(s){if(!s.jack)return null;const best=[Infinity,Infinity];for(const b of s.balls)best[b.team]=Math.min(best[b.team],dist(b,s.jack));
 if(best[0]===Infinity&&best[1]===Infinity)return {team:null,points:0,best};
 if(Math.abs(best[0]-best[1])<1e-4)return {team:null,points:0,best,tie:true};
 const team=best[0]<best[1]?0:1,points=s.balls.filter(b=>b.team===team&&dist(b,s.jack)<best[1-team]).length;return {team,points,best}}

// Applique le résultat d'un lancer. pick(list) choisit un joueur au hasard (cochonnet de la mène suivante).
export function applyThrow(s0,by,tp,res,pick=l=>l[Math.floor(Math.random()*l.length)]){
 const s=JSON.parse(JSON.stringify(s0)),p=playerById(s,by);s.msg='';s.nextThrower=null;
 s.last={by,tp,before:{jack:s0.jack,balls:s0.balls},n:(s0.last?.n||0)+1};
 if(tp.kind==='jack'){
  s.jack=res.jack;
  if(!jackValid(s.jack)){s.jack=null;s.msg='Cochonnet hors limites : on relance.';s.nextThrower=by;return s}
  s.phase='boules';s.turnTeam=s.jackTeam;return autoThrower(s)}
 s.left[by]=Math.max(0,(s.left[by]||0)-1);s.jack=res.jack;s.balls=res.balls;
 const left=[teamLeft(s,0),teamLeft(s,1)];
 if(!s.jack){// cochonnet sorti du jeu
  const pts=left[0]>0&&left[1]===0?[0,left[0]]:left[1]>0&&left[0]===0?[1,left[1]]:null;
  return endMene(s,pts?pts[0]:null,pts?pts[1]:0,'Cochonnet sorti du terrain',pick)}
 if(!left[0]&&!left[1]){const st=standing(s);return endMene(s,st.team,st.points,'',pick)}
 const st=standing(s),last=p.team;let next;
 if(st.team==null){next=left[last]>0?last:1-last}
 else{const other=1-st.team;next=left[other]>0?other:st.team}
 s.turnTeam=next;return autoThrower(s)}
// Un seul joueur de l'équipe a encore des boules : c'est lui qui lance.
function autoThrower(s){const e=eligible(s);if(e.length===1)s.nextThrower=e[0].id;return s}
function endMene(s,team,points,why,pick){
 s.lastMene={team,points,why,mene:s.mene};
 if(team!=null&&points>0){s.score[team]+=points;s.msg=(why?why+' : ':'')+`+${points} pour l’équipe ${team?'corail':'bleue'}`;s.jackTeam=team}
 else s.msg=(why?why+' : ':'')+'mène nulle';
 if(s.score[0]>=TARGET_SCORE||s.score[1]>=TARGET_SCORE){s.phase='over';s.winner=s.score[0]>s.score[1]?0:1;return s}
 s.mene++;s.phase='jack';s.turnTeam=s.jackTeam;s.balls=[];s.jack=null;resetLeft(s);
 s.nextThrower=pick(s.players.filter(x=>x.team===s.jackTeam)).id;return s}

// Joueur suivant en local (même téléphone / ordinateur) : celui de l'équipe qui a le plus de boules, à tour de rôle.
export function localThrower(s,lastBy){if(s.nextThrower)return s.nextThrower;const e=eligible(s);if(!e.length)return null;
 const max=Math.max(...e.map(p=>s.left[p.id]));const c=e.filter(p=>s.left[p.id]===max);const i=c.findIndex(p=>p.id===lastBy);return c[(i+1)%c.length].id}

// ---- ordinateur : vise le cochonnet, ou tire la boule adverse qui tient le point.
// Imprécision par niveau (angle en radians, distance en proportion) : Facile, Normal, Difficile.
const AI_ERR=[[.17,.3],[.11,.19],[.06,.1]],AI_SHOOT=[0,.04,.2];
export function aiThrow(s,level=1,rand=Math.random){
 const err=AI_ERR[level]??AI_ERR[1];const g=()=>(rand()+rand()-1);
 if(s.phase==='jack'){const d=7+rand()*2.5,x=(rand()-.5)*1.2;return {angle:Math.atan2(x,d)+g()*err[0],power:powerFor('jack',Math.hypot(x,d))*(1+g()*err[1]),loft:.6}}
 const me=playerById(s,s.nextThrower)?.team??1,st=standing(s);
 if(st&&st.team===1-me&&rand()<(AI_SHOOT[level]??0)){const target=s.balls.filter(b=>b.team===1-me).sort((a,b)=>dist(a,s.jack)-dist(b,s.jack))[0];
  if(target&&dist(target,s.jack)<.3){const dx=target.x-CIRCLE.x,dz=target.z-CIRCLE.z,d=Math.hypot(dx,dz);
   return {angle:Math.atan2(dx,dz)+g()*err[0]*.6,power:Math.min(1,landPowerFor(d,.05)*(1+g()*err[1]*.5)),loft:.05}}}
 const dx=s.jack.x-CIRCLE.x,dz=s.jack.z-CIRCLE.z;return {angle:Math.atan2(dx,dz)+g()*err[0],power:powerFor('ball',Math.hypot(dx,dz))*(1+g()*err[1]),loft:.55+rand()*.2}}
