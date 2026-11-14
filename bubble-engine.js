// Éclate-Bulles : moteur (sans DOM), testable sous Node.
// Placement libre : la bulle tirée se fige exactement là où elle touche une autre bulle (ou le plafond), sans se caler
// sur une grille. Deux bulles se touchent quand leurs centres sont à une distance D (à TOL près). Groupes de 3 de la même
// couleur, chute de ce qui ne tient plus au plafond, et tous les X tirs tout descend d'un cran et une rangée arrive en haut.
export const W=400,R=18,D=36,RH=R*Math.sqrt(3),COLS=11,X0=2,LEVELS=150,TOL=1.6;
export function rng(seed){let a=seed>>>0||1;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
export const rowLen=r=>r%2?COLS-1:COLS;
const hx=(r,c,par=0)=>X0+R+c*D+((r+par)%2?R:0);
export const colored=b=>b&&(b.t==='n'||b.t==='chick');
const d2=(a,b)=>(a.x-b.x)**2+(a.y-b.y)**2;
export const touching=(a,b)=>d2(a,b)<=(D+TOL)**2;
export function neighborsOf(S,b){return S.bubbles.filter(o=>o!==b&&touching(o,b))}
export function present(S){const s=new Set();for(const b of S.bubbles)if(b.c!=null&&b.c>=0&&(b.t==='n'||b.t==='chick'||b.t==='ice'))s.add(b.c);return [...s]}
export const lowestY=S=>S.bubbles.reduce((m,b)=>Math.max(m,b.y),-Infinity);

// ---- niveaux : une grille de départ (formes variées) puis des rangées en réserve qui descendront
const SHAPES=[
 ()=>true,
 (r,c,H)=>{const x=(hx(r,c)-W/2)/(W/2),y=r/(H-1)*2-1;const a=x*1.15,b=-y*1.2+.25;return (a*a+b*b-1)**3-a*a*b*b*b<=0},
 (r,c,H)=>Math.abs(hx(r,c)-W/2)/(W/2)+Math.abs(r-(H-1)/2)/((H-1)/2)<=1.05,
 (r,c,H)=>Math.abs(hx(r,c)-W/2)<=(W/2)*(1-r/(H+1)),
 (r,c,H)=>Math.abs(hx(r,c)-W/2)<=(W/2)*((r+2)/(H+1)),
 (r,c,H)=>{const t=Math.abs(r-(H-1)/2)/((H-1)/2);return Math.abs(hx(r,c)-W/2)<=(W/2)*(.3+.7*t)},
 (r,c)=>Math.floor(c/3)%2===0||r%4<2,
 (r,c,H)=>Math.hypot((hx(r,c)-W/2)/(W/2),(r-(H-1)/2)/((H-1)/2+.5))<=1.02,
 (r,c)=>((r+Math.floor(c/2))%4)<3,
 (r,c)=>c%4!==3||r<2];
// [descente tous les N tirs, tirs max pour 2 étoiles, tirs max pour 3 étoiles] : calibré avec le robot
export const CALIB=[[11,30,20],[11,27,18],[11,20,13],[11,26,17],[11,24,16],[11,40,27],[11,64,44],[11,40,27],[11,61,42],[11,66,46],[10,31,21],[10,82,57],[10,35,23],[10,59,41],[10,88,61],[10,117,81],[10,51,35],[10,83,58],[10,83,58],[9,74,51],[9,81,56],[9,104,72],[9,33,22],[11,131,91],[9,100,70],[9,30,20],[9,18,12],[9,50,34],[9,60,41],[9,10,6],[9,86,59],[9,71,49],[9,27,18],[9,62,43],[9,64,44],[9,36,24],[9,57,39],[12,146,102],[9,81,56],[8,75,52],[8,54,37],[8,50,34],[8,58,40],[12,135,94],[8,31,21],[8,83,57],[8,70,48],[11,94,65],[8,78,54],[8,99,69],[8,48,33],[8,35,24],[8,69,48],[10,69,48],[8,7,4],[8,52,35],[8,98,68],[8,7,4],[8,128,89],[10,110,76],[7,45,31],[7,31,21],[13,160,112],[7,64,44],[13,92,64],[7,23,15],[7,9,5],[8,83,58],[11,120,84],[8,141,99],[9,89,62],[9,92,64],[7,45,31],[8,73,51],[13,132,92],[8,79,55],[7,26,17],[9,124,87],[8,84,58],[6,51,35],[9,60,41],[6,20,13],[6,43,29],[7,34,23],[7,33,22],[6,14,9],[12,168,117],[6,37,25],[6,94,65],[6,49,33],[9,57,39],[6,19,13],[11,168,118],[9,111,78],[6,52,35],[6,57,39],[7,36,25],[6,59,41],[12,143,100],[9,96,67],[6,70,48],[5,39,27],[5,20,13],[6,49,33],[5,71,49],[8,84,58],[8,56,39],[6,63,43],[7,41,28],[8,83,58],[5,34,23],[8,85,59],[6,54,37],[5,27,18],[7,72,50],[5,29,19],[5,31,21],[7,54,37],[9,73,51],[5,54,37],[6,33,22],[12,113,79],[5,49,33],[9,47,32],[8,104,72],[9,108,75],[5,53,37],[9,74,51],[11,142,99],[6,61,42],[7,47,32],[7,57,39],[5,18,11],[5,32,21],[8,57,39],[5,6,3],[7,51,35],[8,60,41],[5,64,44],[10,102,71],[10,94,65],[5,11,7],[12,128,90],[8,76,53],[6,80,55],[8,58,40],[11,105,73],[5,57,39],[10,100,70],[8,73,51]];
export function levelInfo(n){const i=(n-1)%25,ep=Math.floor((n-1)/25);
 const colors=n<=3?3:n<=15?4:n<=60?5:6;
 const rows=Math.min(9,5+Math.floor(i/6)+(ep>2?1:0));
 const extra=Math.min(14,2+Math.floor(n/8));
 const every=Math.max(4,9-Math.floor(n/20));
 const goal=n>3&&i%3===1?'chicks':'clear';
 return {n,i,ep,colors,rows,extra,every,goal}}
function clusterColor(r,around,colors,keep){const free=Array.from({length:colors},(_,i)=>i).filter(i=>!around.has(i));return free.length&&r()<keep?free[Math.floor(r()*free.length)]:Math.floor(r()*colors)}
export function makeLevel(n,full=false){const L=levelInfo(n),r=rng(n*7919+17),H=L.rows;
 const shape=n<=2||full?SHAPES[0]:SHAPES[(n*5+L.ep)%SHAPES.length];
 const grid=[];for(let row=0;row<H;row++)grid.push(new Array(rowLen(row)).fill(null));
 const fill=[];for(let row=0;row<H;row++)for(let c=0;c<rowLen(row);c++)if(row<1||shape(row,c,H))fill.push([row,c]);
 const inFill=new Set(fill.map(([a,b])=>a*16+b));const nbr=(row,c)=>(row%2?[[-1,0],[-1,1],[0,-1],[0,1],[1,0],[1,1]]:[[-1,-1],[-1,0],[0,-1],[0,1],[1,-1],[1,0]]).map(([a,b])=>[row+a,c+b]).filter(([a,b])=>a>=0&&a<H&&b>=0&&b<rowLen(a));
 // petites grappes de 1 à 3 bulles (2 à 4 au tout début), qui évitent la couleur des voisines
 const big=n<=6?1:0;
 for(const [row,c] of fill){if(grid[row][c])continue;const size=1+big+Math.floor(r()*3),grp=[[row,c]],seen=new Set([row*16+c]);
  for(let k=0;k<grp.length&&grp.length<size;k++){for(const p of nbr(...grp[k]).sort(()=>r()-.5)){if(grp.length>=size)break;const key=p[0]*16+p[1];if(!inFill.has(key)||grid[p[0]][p[1]]||seen.has(key))continue;seen.add(key);grp.push(p)}}
  const around=new Set();for(const p of grp)for(const [a,b] of nbr(...p))if(grid[a][b])around.add(grid[a][b].c);
  const col=clusterColor(r,around,L.colors,.85);for(const [a,b] of grp)grid[a][b]={t:'n',c:col}}
 // tout doit tenir au plafond
 const ok=new Set(),q=[];for(let c=0;c<rowLen(0);c++)if(grid[0][c]){ok.add(c);q.push([0,c])}
 while(q.length){const [a,b]=q.pop();for(const [x,y] of nbr(a,b))if(grid[x][y]&&!ok.has(x*16+y)){ok.add(x*16+y);q.push([x,y])}}
 const all=[];for(let row=0;row<H;row++)for(let c=0;c<rowLen(row);c++){if(grid[row][c]&&!ok.has(row*16+c))grid[row][c]=null;if(grid[row][c])all.push([row,c])}
 if(all.length<28&&!full)return makeLevel(n,true);
 const pick=f=>{const cand=all.filter(([a,b])=>grid[a][b].t==='n'&&(!f||f(a,b)));return cand.length?cand[Math.floor(r()*cand.length)]:null};
 const put=(t,count,f)=>{for(let k=0;k<count;k++){const p=pick(f);if(!p)break;const [a,b]=p;grid[a][b]=t==='ice'||t==='chick'?{t,c:grid[a][b].c}:{t}}};
 if(n>=8)put('stone',Math.min(7,1+Math.floor((n-8)/10)),a=>a>0);
 if(n>=12)put('ice',Math.min(10,2+Math.floor((n-12)/8)));
 if(n>=18)put('bomb',Math.min(3,1+Math.floor((n-18)/40)),a=>a>0);
 if(n>=26)put('bolt',Math.min(2,1+Math.floor((n-26)/60)),a=>a>1);
 if(n>=34&&n%3===1)put('star',1,a=>a>1);
 let chicks=0;if(L.goal==='chicks'){put('chick',Math.min(7,2+Math.floor(L.i/5)+Math.floor(L.ep/2)),a=>a<=Math.max(2,H*.6));for(const row of grid)for(const v of row)if(v&&v.t==='chick')chicks++}
 const bubbles=[];let id=1;for(let row=0;row<H;row++)for(let c=0;c<rowLen(row);c++){const v=grid[row][c];if(v)bubbles.push({id:id++,x:hx(row,c),y:R+row*RH,...v})}
 const cal=CALIB[n-1];return {...L,bubbles,chicks,count:bubbles.length,every:cal?cal[0]:L.every,stars:cal?[cal[1],cal[2]]:[Math.round(bubbles.length/2.2+L.extra*3),Math.round(bubbles.length/3+L.extra*2)],seedRows:n*131+7}}

export function newGame(n,seed=Date.now()){const lv=makeLevel(n);
 const S={n,lv,bubbles:lv.bubbles.map(b=>({...b})),nextId:1000,score:0,colors:lv.colors,goal:lv.goal,chicks:lv.chicks,freed:0,
  rnd:rng(seed),rowRnd:rng(lv.seedRows),every:lv.every,since:0,rowsLeft:lv.extra,parity:0,won:false,lost:null,deadY:Infinity,shotsUsed:0};
 S.cur=nextBall(S);S.next=nextBall(S);return S}
export function nextBall(S){const pr=present(S);const pool=pr.length?pr:Array.from({length:S.colors},(_,i)=>i);return {t:'c',c:pool[Math.floor(S.rnd()*pool.length)]}}

// ---- trajectoire : rebonds sur les murs ; arrêt au premier contact (bulle ou plafond) ; la boule de feu traverse tout
export function trace(S,sx,sy,angle,fire=false){let x=sx,y=sy,dx=Math.cos(angle);const dy=-Math.sin(angle),pts=[[x,y]],hits=[],seen=new Set(),STEP=3;
 for(let k=0;k<4000;k++){let px=x,py=y;x+=dx*STEP;y+=dy*STEP;
  if(x<R||x>W-R){const wall=x<R?R:W-R,u=(wall-px)/(x-px),wy=py+(y-py)*u;pts.push([wall,wy]);x=2*wall-x;dx=-dx;px=wall;py=wy}
  if(fire){for(const b of S.bubbles)if(!seen.has(b.id)&&d2(b,{x,y})<(D-3)**2){seen.add(b.id);hits.push(b.id)}if(y-R<=0){pts.push([x,y]);return {pts,hits,end:[x,y],fire:true}}continue}
  // premier contact le long du petit segment
  let best=null;const vx=x-px,vy=y-py,a=vx*vx+vy*vy||1e-9;
  for(const b of S.bubbles){const ox=px-b.x,oy=py-b.y;const c=ox*ox+oy*oy-D*D;if(c<=0){best={u:0,b};break}const bb=2*(vx*ox+vy*oy),disc=bb*bb-4*a*c;if(disc<0)continue;const u=(-bb-Math.sqrt(disc))/(2*a);if(u>=0&&u<=1&&(!best||u<best.u))best={u,b}}
  if(best){const ex=px+vx*best.u,ey=py+vy*best.u;pts.push([ex,ey]);return {pts,end:[ex,ey],hit:best.b.id,hits}}
  if(y-R<=0){const u=(py-R)/Math.max(1e-6,py-y),ex=px+vx*u;pts.push([ex,R]);return {pts,end:[ex,R],hits,ceiling:true}}}
 pts.push([x,y]);return {pts,end:[x,y],hits}}

// ---- résolution d'un tir
function flood(S,start,col,set){const st=[start],out=[];while(st.length){const b=st.pop();if(set.has(b.id))continue;if(!colored(b)||b.c!==col)continue;set.add(b.id);out.push(b);for(const o of neighborsOf(S,b))if(!set.has(o.id))st.push(o)}return out}
export function apply(S,ball,res){const ev={popped:[],dropped:[],freed:0,thawed:[],blasts:[],placed:null,pts:0,star:false};const pop=new Set(),byId=new Map(S.bubbles.map(b=>[b.id,b]));
 if(ball.t==='fire'){for(const id of res.hits)pop.add(id)}
 else{const [x,y]=res.end;
  if(ball.t==='bomb'){for(const b of S.bubbles)if(d2(b,{x,y})<=(D*2.1)**2)pop.add(b.id);ev.blasts.push({x,y})}
  else{const nb={id:S.nextId++,x,y,t:'n',c:ball.t==='rainbow'?-1:ball.c};S.bubbles.push(nb);byId.set(nb.id,nb);ev.placed=nb;
   if(ball.t==='rainbow'){const cols=new Set(neighborsOf(S,nb).filter(colored).map(o=>o.c).filter(c=>c>=0));let any=false;
    for(const col of cols){const grp=new Set();for(const o of neighborsOf(S,nb))if(colored(o)&&o.c===col)flood(S,o,col,grp);if(grp.size+1>=3){any=true;for(const id of grp)pop.add(id)}}
    if(any)pop.add(nb.id);else{const o=neighborsOf(S,nb).find(o=>colored(o)&&o.c>=0);nb.c=o?o.c:Math.floor(S.rnd()*S.colors)}}
   else{const grp=flood(S,nb,ball.c,new Set());if(grp.length>=3)for(const b of grp)pop.add(b.id);
    const star=neighborsOf(S,nb).find(o=>o.t==='star');if(star){ev.star=true;pop.add(star.id);for(const b of S.bubbles)if((b.t==='n'||b.t==='chick'||b.t==='ice')&&b.c===ball.c)pop.add(b.id)}}}}
 // réactions en chaîne : bombes et éclairs voisins, glace qui fond
 const q=[...pop],thaw=new Set();
 while(q.length){const b=byId.get(q.pop());if(!b)continue;
  if(b.t==='bomb'){ev.blasts.push({x:b.x,y:b.y});for(const o of S.bubbles)if(!pop.has(o.id)&&d2(o,b)<=(D*2.1)**2){pop.add(o.id);q.push(o.id)}}
  if(b.t==='bolt'){ev.blasts.push({x:-1,y:b.y});for(const o of S.bubbles)if(!pop.has(o.id)&&Math.abs(o.y-b.y)<R){pop.add(o.id);q.push(o.id)}}
  for(const o of neighborsOf(S,b)){if(pop.has(o.id))continue;if(o.t==='bomb'||o.t==='bolt'){pop.add(o.id);q.push(o.id)}else if(o.t==='ice')thaw.add(o.id)}}
 for(const b of S.bubbles)if(pop.has(b.id)){ev.popped.push(b);if(b.t==='chick')ev.freed++}
 S.bubbles=S.bubbles.filter(b=>!pop.has(b.id));
 for(const id of thaw){const b=byId.get(id);if(b&&!pop.has(id)&&b.t==='ice'){b.t='n';ev.thawed.push(b)}}
 // chute de tout ce qui ne tient plus au plafond
 for(const b of dropLoose(S)){ev.dropped.push(b);if(b.t==='chick')ev.freed++}
 const p=ev.popped.length,d=ev.dropped.length;ev.pts=p*10+Math.max(0,p-3)*5+d*20*(d>=8?2:1)+ev.freed*100;S.score+=ev.pts;S.freed+=ev.freed;return ev}
function dropLoose(S){const anch=new Set(),st=[];for(const b of S.bubbles)if(b.y-R<=TOL||b.hang){anch.add(b.id);st.push(b)}
 while(st.length){const b=st.pop();for(const o of S.bubbles)if(!anch.has(o.id)&&touching(o,b)){anch.add(o.id);st.push(o)}}
 const out=S.bubbles.filter(b=>!anch.has(b.id));S.bubbles=S.bubbles.filter(b=>anch.has(b.id));return out}
// tout descend d'un cran ; une nouvelle rangée arrive en haut tant qu'il en reste en réserve
export function descend(S){const ev={rows:0,spawned:[]};for(const b of S.bubbles)b.y+=RH;
 if(S.rowsLeft>0){S.rowsLeft--;S.parity^=1;const pr=present(S),pool=pr.length?pr:Array.from({length:S.colors},(_,i)=>i);let prev=null,run=0;
  for(let c=0;c<rowLen(S.parity);c++){const x=hx(0,c,S.parity),y=R;if(S.bubbles.some(o=>d2(o,{x,y})<(D-1)**2))continue;
   const col=run<2&&prev!=null&&S.rowRnd()<.45?prev:pool[Math.floor(S.rowRnd()*pool.length)];run=col===prev?run+1:0;prev=col;
   const b={id:S.nextId++,x,y,t:'n',c:col};S.bubbles.push(b);ev.spawned.push(b)}
  ev.rows=1}
 // ce qui touchait le plafond reste accroché (suspendu à la rangée du dessus)
 for(const b of S.bubbles)if(Math.abs(b.y-(R+RH))<TOL+1)b.hang=true;
 return ev}

export function goalDone(S){if(S.goal==='chicks')return S.freed>=S.chicks;return S.bubbles.length===0}
export const goalLeft=S=>S.goal==='chicks'?S.chicks-S.freed:S.bubbles.length;
export function shoot(S,ball,res){S.shotsUsed++;const ev=apply(S,ball,res);
 if(goalDone(S)){S.won=true;return ev}
 if(++S.since>=S.every){S.since=0;ev.descend=descend(S)}
 if(lowestY(S)+R>S.deadY){S.lost='line';return ev}
 if(ball===S.cur){S.cur=S.next;S.next=nextBall(S)}
 const pr=present(S);if(pr.length){if(S.cur.t==='c'&&!pr.includes(S.cur.c))S.cur=nextBall(S);if(S.next.t==='c'&&!pr.includes(S.next.c))S.next=nextBall(S)}
 return ev}
// étoiles : selon le nombre de tirs utilisés
export const starsFor=S=>!S.won?0:S.shotsUsed<=S.lv.stars[1]?3:S.shotsUsed<=S.lv.stars[0]?2:1;
export const HUD=64,FOOT=118;
export function view(S,H){const playH=H-HUD-FOOT;return {scroll:0,sx:W/2,sy:playH,playH,deadY:playH-48}}

// ---- robot (tests, calibrage)
export function clone(S){return {...S,bubbles:S.bubbles.map(b=>({...b})),rnd:()=>.5,rowRnd:()=>.5}}
export function bot(S,sx,sy){let best=null;
 for(const swap of [false,true]){const ball=swap?S.next:S.cur;if(!ball)continue;
  for(let a=.16;a<Math.PI-.15;a+=.045){const res=trace(S,sx,sy,a,ball.t==='fire');const T=clone(S);const ev=apply(T,ball,res);let sc=ev.popped.length+ev.dropped.length*1.4+ev.freed*6;
   if(!ev.popped.length&&ev.placed){const nb=T.bubbles.find(b=>b.id===ev.placed.id);if(nb)sc+=neighborsOf(T,nb).filter(o=>colored(o)&&o.c===nb.c).length*.4-nb.y*.002}
   if(!best||sc>best.sc)best={a,sc,swap}}}
 return best}
