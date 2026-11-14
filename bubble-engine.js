// Éclate-Bulles : moteur (sans DOM), testable sous Node.
// Grille hexagonale (rangées impaires décalées d'un demi-cran, 11 puis 10 bulles), tir avec rebonds sur les murs,
// groupes de 3 de la même couleur, chute des bulles décrochées, bulles spéciales et 150 niveaux déterministes.
export const W=400,R=18,D=36,RH=R*Math.sqrt(3),COLS=11,X0=2,LEVELS=150;
export const COLORS=6;
export function rng(seed){let a=seed>>>0||1;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
export const rowLen=r=>r%2?COLS-1:COLS;
export const cx=(r,c)=>X0+R+c*D+(r%2?R:0);
export const cy=(S,r)=>S.ceil*RH+R+r*RH;
export const key=(r,c)=>r*16+c;
const unkey=k=>[k>>4,k&15];
export function get(S,r,c){if(r<0||c<0||c>=rowLen(r))return null;const row=S.rows[r];return row?row[c]||null:null}
function set(S,r,c,v){while(S.rows.length<=r)S.rows.push(new Array(rowLen(S.rows.length)).fill(null));S.rows[r][c]=v}
export function neighbors(r,c){const o=r%2?[[-1,0],[-1,1],[0,-1],[0,1],[1,0],[1,1]]:[[-1,-1],[-1,0],[0,-1],[0,1],[1,-1],[1,0]];
 return o.map(([dr,dc])=>[r+dr,c+dc]).filter(([a,b])=>a>=0&&b>=0&&b<rowLen(a))}
export const colored=cell=>cell&&(cell.t==='n'||cell.t==='chick');
export function cells(S){const out=[];S.rows.forEach((row,r)=>row.forEach((v,c)=>{if(v)out.push([r,c,v])}));return out}
export function lowestY(S){let y=-Infinity;S.rows.forEach((row,r)=>{if(row.some(v=>v))y=Math.max(y,cy(S,r))});return y}
export function present(S){const s=new Set();for(const [,,v] of cells(S))if(v.c!=null&&(v.t==='n'||v.t==='chick'||v.t==='ice'))s.add(v.c);return [...s]}

// ---- niveaux
const SHAPES=[
 ()=>true,
 (r,c,H)=>{const x=(cx(r,c)-W/2)/(W/2),y=r/(H-1)*2-1;const a=x*1.15,b=-y*1.2+.25;return (a*a+b*b-1)**3-a*a*b*b*b<=0},       // cœur
 (r,c,H)=>Math.abs(cx(r,c)-W/2)/(W/2)+Math.abs(r-(H-1)/2)/((H-1)/2)<=1.05,                                                // losange
 (r,c,H)=>Math.abs(cx(r,c)-W/2)<=(W/2)*(1-r/(H+1)),                                                                     // pyramide inversée (pointe en bas)
 (r,c,H)=>Math.abs(cx(r,c)-W/2)<=(W/2)*((r+2)/(H+1)),                                                                   // pyramide
 (r,c,H)=>{const t=Math.abs(r-(H-1)/2)/((H-1)/2);return Math.abs(cx(r,c)-W/2)<=(W/2)*(.25+.75*t)},                        // sablier
 (r,c)=>Math.floor(c/3)%2===0||r%4<2,                                                                                    // créneaux
 (r,c,H)=>Math.hypot((cx(r,c)-W/2)/(W/2),(r-(H-1)/2)/((H-1)/2+.5))<=1.02,                                                 // cercle
 (r,c,H)=>Math.abs(cx(r,c)-W/2)<70||Math.abs(r-(H-1)/2)<1.6||r<2,                                                         // croix
 (r,c)=>((r+Math.floor(c/2))%4)<3,                                                                                       // zigzag
 (r,c)=>c%4!==3||r<2,                                                                                                    // colonnes
 (r,c,H)=>{const x=Math.abs(cx(r,c)-W/2);return x>40||r<3||r>H-3},                                                       // ailes
];
// tirs et seuils d'étoiles (calibrés avec le robot, voir tests/bubble-calibrate.mjs)
export const CALIB=[[20,1600,2500],[28,1800,2900],[18,1300,2000],[18,1400,2200],[30,2000,3100],[24,1800,2700],[28,2100,3200],[34,2200,3400],[26,2000,3100],[18,1400,2100],[37,2300,3700],[33,2100,3300],[25,1700,2600],[29,2100,3200],[23,1800,2800],[41,2400,3800],[33,2400,3700],[40,2500,3900],[31,2300,3600],[27,2400,3800],[44,2700,4300],[27,2200,3400],[48,3100,4800],[55,3400,5400],[30,2600,4100],[34,2200,3400],[23,1600,2600],[23,1600,2400],[21,1500,2400],[23,1900,3000],[26,1800,2800],[21,1700,2600],[45,2500,3900],[19,1500,2300],[34,2300,3600],[24,1600,2600],[24,1800,2700],[34,2400,3800],[39,2600,4100],[24,2300,3600],[37,2400,3800],[41,2900,4500],[33,2200,3400],[41,2600,4100],[33,2500,3900],[44,2700,4200],[39,3000,4700],[26,2400,3700],[22,2000,3100],[46,3400,5300],[49,2900,4500],[40,2500,3900],[20,1300,2100],[20,1600,2500],[42,3000,4700],[29,1700,2600],[38,2600,4000],[27,1900,3000],[43,2600,4100],[21,1700,2700],[34,2500,3800],[31,2000,3100],[27,2100,3200],[28,2500,3800],[22,2600,4000],[43,2700,4200],[34,2500,3900],[32,1900,3000],[44,2500,4000],[24,2700,4300],[62,4000,6200],[25,2400,3800],[33,3600,5500],[48,2900,4600],[47,3100,4800],[54,3000,4600],[28,2100,3300],[38,1600,2500],[18,1900,2900],[40,2500,3900],[21,1500,2400],[22,2400,3700],[45,3300,5100],[69,3300,5100],[25,2700,4300],[40,2400,3800],[36,2000,3100],[31,2800,4400],[36,2600,4000],[41,2800,4300],[23,2200,3400],[38,3300,5200],[44,2700,4200],[27,2800,4300],[56,3900,6100],[37,2500,3800],[25,2600,4100],[56,3500,5500],[31,2200,3400],[37,3500,5400],[39,2300,3600],[40,2900,4500],[21,1900,2900],[22,1900,2900],[37,2700,4200],[25,1600,2400],[29,2700,4200],[28,2100,3200],[33,2500,3900],[23,2200,3500],[31,2500,3900],[22,1600,2400],[27,2300,3600],[56,3400,5200],[25,2300,3500],[26,2200,3400],[59,4200,6500],[22,1700,2700],[35,2800,4300],[28,3200,5000],[53,3800,6000],[28,2800,4300],[55,3400,5400],[37,2500,3800],[33,3400,5300],[29,2600,4000],[26,2700,4100],[31,2100,3300],[24,1700,2600],[31,2400,3800],[23,1600,2400],[29,2400,3800],[30,2900,4500],[24,2000,3100],[26,2500,3900],[30,2400,3800],[29,1700,2600],[36,2600,4000],[28,2600,4100],[31,3300,5200],[27,2000,3100],[38,3300,5100],[28,1800,2800],[45,2800,4400],[46,3700,5800],[29,2400,3700],[28,2400,3800],[66,4200,6500],[28,1600,2600],[47,3500,5400]];
export function levelInfo(n){const i=(n-1)%25,ep=Math.floor((n-1)/25);
 const colors=n<=4?3:n<=20?4:n<=70?5:6;
 const drop=n>24&&i%6===5?Math.max(5,8-ep):0;
 const rows=drop?Math.min(8,5+Math.floor(i/6)):Math.min(18,5+Math.floor(i/4)+ep);
 let goal=['clear','chicks','clear','top','chicks'][i%5];if(n<=3||drop)goal='clear';else if(goal==='top'&&rows<9)goal='chicks';
 return {n,i,ep,colors,drop,rows,goal}}
export function makeLevel(n,full=false){const L=levelInfo(n),r=rng(n*7919+17),H=L.rows;
 const shape=n<=2||full?SHAPES[0]:SHAPES[(n*5+L.ep)%SHAPES.length];
 const grid=[];for(let row=0;row<H;row++){grid.push(new Array(rowLen(row)).fill(null))}
 const fill=[];for(let row=0;row<H;row++)for(let c=0;c<rowLen(row);c++)if(row<1||shape(row,c,H))fill.push([row,c]);
 // couleurs en petites grappes (2 à 4 bulles, un peu plus au début) qui évitent souvent la couleur des voisines
 const inFill=new Set(fill.map(([a,b])=>key(a,b)));const big=n<=8?2:n<=40?1:0;
 for(const [row,c] of fill){if(grid[row][c])continue;const size=2+big+Math.floor(r()*3),grp=[[row,c]],seen=new Set([key(row,c)]);
  for(let i=0;i<grp.length&&grp.length<size;i++){const nb=neighbors(...grp[i]).filter(([a,b])=>inFill.has(key(a,b))&&!grid[a][b]&&!seen.has(key(a,b))).sort(()=>r()-.5);for(const p of nb){if(grp.length>=size)break;seen.add(key(...p));grp.push(p)}}
  const around=new Set();for(const p of grp)for(const [a,b] of neighbors(...p)){const v=grid[a]&&grid[a][b];if(v)around.add(v.c)}
  const free=Array.from({length:L.colors},(_,i)=>i).filter(i=>!around.has(i));const col=free.length&&r()<.8?free[Math.floor(r()*free.length)]:Math.floor(r()*L.colors);
  for(const [a,b] of grp)grid[a][b]={t:'n',c:col}}
 // garder la grille accrochée : on supprime ce qui ne tient pas au plafond
 const anchored=new Set(),q=[];for(let c=0;c<rowLen(0);c++)if(grid[0][c]){anchored.add(key(0,c));q.push([0,c])}
 while(q.length){const [a,b]=q.pop();for(const [x,y] of neighbors(a,b))if(x<H&&grid[x][y]&&!anchored.has(key(x,y))){anchored.add(key(x,y));q.push([x,y])}}
 for(let row=0;row<H;row++)for(let c=0;c<rowLen(row);c++)if(grid[row][c]&&!anchored.has(key(row,c)))grid[row][c]=null;
 const all=[];for(let row=0;row<H;row++)for(let c=0;c<rowLen(row);c++)if(grid[row][c])all.push([row,c]);
 if(all.length<30&&!full)return makeLevel(n,true);   // forme trop découpée une fois accrochée : grille pleine
 const pickCell=(filter=()=>true)=>{const cand=all.filter(([a,b])=>grid[a][b].t==='n'&&filter(a,b));return cand.length?cand[Math.floor(r()*cand.length)]:null};
 // bulles spéciales, introduites petit à petit
 const put=(t,count,filter)=>{for(let k=0;k<count;k++){const p=pickCell(filter);if(!p)break;const [a,b]=p;grid[a][b]=t==='ice'?{t:'ice',c:grid[a][b].c}:t==='chick'?{t:'chick',c:grid[a][b].c}:{t}}};
 if(n>=10)put('stone',Math.min(6,1+Math.floor((n-10)/12)),(a)=>a>0);
 if(n>=15)put('ice',Math.min(8,2+Math.floor((n-15)/10)));
 if(n>=20)put('bomb',Math.min(3,1+Math.floor((n-20)/40)),(a)=>a>0);
 if(n>=30)put('bolt',Math.min(2,1+Math.floor((n-30)/60)),(a)=>a>1);
 if(n>=40&&n%3===1)put('star',1,(a)=>a>1);
 let chicks=0;if(L.goal==='chicks'){chicks=Math.min(6,2+Math.floor(L.i/6)+Math.floor(L.ep/2));put('chick',chicks,(a)=>a<=Math.max(2,H*.6));chicks=0;for(const row of grid)for(const v of row)if(v&&v.t==='chick')chicks++}
 const cal=CALIB[n-1];const count=all.length;
 const shots=cal?cal[0]:Math.ceil(count/2.3)+6,stars=cal?[cal[1],cal[2]]:[count*14,count*22];
 return {...L,grid,shots,stars,chicks,count}}

export function newGame(n,seed=Date.now()){const lv=makeLevel(n);
 const S={n,lv,rows:lv.grid.map(row=>row.map(v=>v&&{...v})),ceil:0,shots:lv.shots,score:0,colors:lv.colors,goal:lv.goal,chicks:lv.chicks,freed:0,
  rnd:rng(seed),dropEvery:lv.drop,since:0,won:false,lost:null,deadY:Infinity,shotsUsed:0,best:0};
 S.cur=nextBall(S);S.next=nextBall(S);return S}
export function nextBall(S){const pr=present(S);const pool=pr.length?pr:Array.from({length:S.colors},(_,i)=>i);return {t:'c',c:pool[Math.floor(S.rnd()*pool.length)]}}

// ---- trajectoire : rebonds sur les murs, arrêt au plafond ou au contact d'une bulle ; la boule de feu traverse tout
export function trace(S,sx,sy,angle,fire=false){let x=sx,y=sy;const dx0=Math.cos(angle),dy=-Math.sin(angle);let dx=dx0;const pts=[[x,y]],hits=[],seen=new Set();const top=S.ceil*RH;
 for(let k=0;k<4000;k++){x+=dx*3;y+=dy*3;
  if(x<R){x=2*R-x;dx=-dx;pts.push([x,y])}else if(x>W-R){x=2*(W-R)-x;dx=-dx;pts.push([x,y])}
  if(y-R<=top){if(fire){pts.push([x,y]);return {pts,hits,end:[x,y],fire:true}}pts.push([x,y]);return {pts,cell:snap(S,x,Math.max(y,top+R)),end:[x,Math.max(y,top+R)],hits}}
  const r0=Math.round((y-top-R)/RH);
  for(let rr=Math.max(0,r0-1);rr<=r0+1;rr++){const row=S.rows[rr];if(!row)continue;for(let c=0;c<row.length;c++){const v=row[c];if(!v)continue;const d=Math.hypot(cx(rr,c)-x,cy(S,rr)-y);
   if(fire){if(d<D-2&&!seen.has(key(rr,c))){seen.add(key(rr,c));hits.push([rr,c])}continue}
   if(d<D-5){pts.push([x,y]);return {pts,cell:snap(S,x,y),end:[x,y],hits}}}}}
 pts.push([x,y]);return {pts,cell:snap(S,x,y),end:[x,y],hits}}
function snap(S,x,y){const top=S.ceil*RH,r0=Math.round((y-top-R)/RH);let best=null,bd=Infinity;
 for(let rr=Math.max(0,r0-1);rr<=r0+1;rr++)for(let c=0;c<rowLen(rr);c++){if(get(S,rr,c))continue;
  if(rr>0&&!neighbors(rr,c).some(([a,b])=>get(S,a,b)))continue;const d=Math.hypot(cx(rr,c)-x,cy(S,rr)-y);if(d<bd){bd=d;best=[rr,c]}}
 if(!best){const rr=Math.max(0,r0);let c=Math.round((x-X0-R-(rr%2?R:0))/D);c=Math.max(0,Math.min(rowLen(rr)-1,c));best=[rr,c]}
 return best}

// ---- résolution d'un tir
function flood(S,r,c,col,set){const st=[[r,c]];const out=[];while(st.length){const [a,b]=st.pop();const k=key(a,b);if(set.has(k))continue;const v=get(S,a,b);if(!colored(v)||v.c!==col)continue;set.add(k);out.push([a,b]);for(const nb of neighbors(a,b))st.push(nb)}return out}
function within2(r,c){const out=new Set([key(r,c)]);for(const [a,b] of neighbors(r,c)){out.add(key(a,b));for(const [x,y] of neighbors(a,b))out.add(key(x,y))}return [...out].map(unkey)}
export function apply(S,ball,res){const ev={popped:[],dropped:[],freed:0,thawed:[],blasts:[],placed:null,pts:0,star:false};const pop=new Set();
 if(ball.t==='fire'){for(const [a,b] of res.hits)pop.add(key(a,b))}
 else{const [r,c]=res.cell;
  if(ball.t==='bomb'){for(const [a,b] of within2(r,c))if(get(S,a,b))pop.add(key(a,b));ev.blasts.push([r,c])}
  else if(ball.t==='rainbow'){set(S,r,c,{t:'n',c:-1});ev.placed=[r,c];const cols=new Set(neighbors(r,c).map(([a,b])=>get(S,a,b)).filter(colored).map(v=>v.c));let any=false;
   for(const col of cols){const grp=new Set();for(const [a,b] of neighbors(r,c)){const v=get(S,a,b);if(colored(v)&&v.c===col)flood(S,a,b,col,grp)}if(grp.size+1>=3){any=true;for(const k of grp)pop.add(k)}}
   if(any)pop.add(key(r,c));else{const nb=neighbors(r,c).map(([a,b])=>get(S,a,b)).filter(colored);S.rows[r][c]={t:'n',c:nb.length?nb[0].c:Math.floor(S.rnd()*S.colors)}}}
  else{set(S,r,c,{t:'n',c:ball.c});ev.placed=[r,c];const grp=flood(S,r,c,ball.c,new Set());if(grp.length>=3)for(const [a,b] of grp)pop.add(key(a,b));
   const star=neighbors(r,c).find(([a,b])=>get(S,a,b)?.t==='star');if(star){ev.star=true;pop.add(key(...star));for(const [a,b,v] of cells(S))if((v.t==='n'||v.t==='chick'||v.t==='ice')&&v.c===ball.c)pop.add(key(a,b))}}}
 // réactions en chaîne : bombes et éclairs voisins, glace qui fond
 const q=[...pop];const thaw=new Set();
 while(q.length){const k=q.pop();const [a,b]=unkey(k);const v=get(S,a,b);if(!v)continue;
  const extra=v.t==='bomb'?within2(a,b):v.t==='bolt'?Array.from({length:rowLen(a)},(_,i)=>[a,i]):[];if(v.t==='bomb')ev.blasts.push([a,b]);if(v.t==='bolt')ev.blasts.push([a,-1]);
  for(const [x,y] of extra)if(get(S,x,y)&&!pop.has(key(x,y))){pop.add(key(x,y));q.push(key(x,y))}
  for(const [x,y] of neighbors(a,b)){const w=get(S,x,y);if(!w||pop.has(key(x,y)))continue;if(w.t==='bomb'||w.t==='bolt'){pop.add(key(x,y));q.push(key(x,y))}else if(w.t==='ice')thaw.add(key(x,y))}}
 for(const k of pop){const [a,b]=unkey(k);const v=get(S,a,b);if(!v)continue;ev.popped.push([a,b,v]);if(v.t==='chick')ev.freed++;S.rows[a][b]=null}
 for(const k of thaw){const [a,b]=unkey(k);const v=get(S,a,b);if(v&&v.t==='ice'){v.t='n';ev.thawed.push([a,b])}}
 // chute de tout ce qui ne tient plus au plafond
 const anch=new Set(),st=[];(S.rows[0]||[]).forEach((v,c)=>{if(v){anch.add(key(0,c));st.push([0,c])}});
 while(st.length){const [a,b]=st.pop();for(const [x,y] of neighbors(a,b))if(get(S,x,y)&&!anch.has(key(x,y))){anch.add(key(x,y));st.push([x,y])}}
 for(const [a,b,v] of cells(S))if(!anch.has(key(a,b))){ev.dropped.push([a,b,v]);if(v.t==='chick')ev.freed++;S.rows[a][b]=null}
 while(S.rows.length&&!S.rows[S.rows.length-1].some(Boolean))S.rows.pop();
 const p=ev.popped.length,d=ev.dropped.length;ev.pts=p*10+Math.max(0,p-3)*5+d*20*(d>=8?2:1)+ev.freed*100;S.score+=ev.pts;S.freed+=ev.freed;
 return ev}

export function goalDone(S){if(S.goal==='chicks')return S.freed>=S.chicks;if(S.goal==='top')return !(S.rows[0]||[]).some(Boolean);return cells(S).length===0}
export const goalLeft=S=>S.goal==='chicks'?S.chicks-S.freed:S.goal==='top'?(S.rows[0]||[]).filter(Boolean).length:cells(S).length;
// un tir complet : décompte, résolution, plafond qui descend, victoire ou défaite
export function shoot(S,ball,res){S.shots--;S.shotsUsed++;const ev=apply(S,ball,res);
 if(goalDone(S)){S.won=true;return ev}
 if(S.dropEvery&&++S.since>=S.dropEvery){S.since=0;S.ceil++;ev.ceil=true}
 if(lowestY(S)+R>S.deadY){S.lost='line';return ev}
 if(S.shots<=0){S.lost='shots';return ev}
 const pr=present(S);if(ball===S.cur){S.cur=S.next;S.next=nextBall(S)}
 if(pr.length){if(S.cur.t==='c'&&!pr.includes(S.cur.c))S.cur=nextBall(S);if(S.next.t==='c'&&!pr.includes(S.next.c))S.next=nextBall(S)}
 return ev}
// cadrage : la grille descend avec la caméra tant qu'elle est haute ; le lanceur reste en bas de l'écran
export const HUD=64,FOOT=118;
export function view(S,H){const playH=H-HUD-FOOT;let scroll=0;if(!S.dropEvery)scroll=Math.max(0,lowestY(S)+R-(playH-250));return {scroll,sx:W/2,sy:scroll+playH,playH,deadY:S.dropEvery?playH-56:Infinity}}
export const starsFor=(S,score=S.score)=>!S.won?0:score>=S.lv.stars[1]?3:score>=S.lv.stars[0]?2:1;
export const LEFT_BONUS=150;

// ---- robot (tests, calibrage) : essaie des angles, garde le coup qui fait le plus de dégâts
export function clone(S){return {...S,rows:S.rows.map(r=>r.map(v=>v&&{...v})),rnd:()=>.5}}
export function bot(S,sx,sy){let best=null;
 for(const swap of [false,true]){const ball=swap?S.next:S.cur;if(!ball)continue;
  for(let a=.16;a<Math.PI-.15;a+=.035){const res=trace(S,sx,sy,a,ball.t==='fire');const T=clone(S);const ev=apply(T,ball,res);let sc=ev.popped.length*1+ev.dropped.length*1.4+ev.freed*6;
   if(S.goal==='top')sc+=ev.popped.filter(([r])=>r===0).length*2;
   if(!ev.popped.length&&res.cell){const [r,c]=res.cell;sc+=neighbors(r,c).filter(([x,y])=>{const v=get(S,x,y);return colored(v)&&v.c===ball.c}).length*.35-(r*.02)}
   if(!best||sc>best.sc)best={a,sc,swap}}}
 return best}
