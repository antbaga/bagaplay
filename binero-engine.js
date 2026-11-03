// Binero (Takuzu) : grille n×n de 0 et de 1.
// Règles : jamais trois chiffres identiques côte à côte ; autant de 0 que de 1 par ligne et par colonne ;
// deux lignes (ou deux colonnes) ne peuvent pas être identiques.
// Les grilles générées ont une solution unique. Case vide = -1.

const line=(g,n,k,col)=>Array.from({length:n},(_,j)=>col?g[j*n+k]:g[k*n+j]);
const idx=(n,k,j,col)=>col?j*n+k:k*n+j;

// Vérifie une grille (partielle) : pas de triple, pas plus de n/2 d'un chiffre, lignes complètes distinctes.
export function valid(g,n){
 for(const col of [false,true]){const seen=new Set();
  for(let k=0;k<n;k++){const L=line(g,n,k,col);let c0=0,c1=0;
   for(let j=0;j<n;j++){if(L[j]===0)c0++;else if(L[j]===1)c1++;if(j>=2&&L[j]>=0&&L[j]===L[j-1]&&L[j]===L[j-2])return false}
   if(c0>n/2||c1>n/2)return false;if(c0+c1===n){const key=L.join('');if(seen.has(key))return false;seen.add(key)}}}
 return true}

// Déductions simples répétées : 00_ → 1, 0_0 → 1, ligne avec n/2 zéros → le reste à 1. Renvoie false si contradiction.
function propagate(g,n){let changed=true;while(changed){changed=false;
 for(const col of [false,true])for(let k=0;k<n;k++){const L=line(g,n,k,col);
  for(let j=0;j<n;j++){if(L[j]>=0)continue;let v=-1;
   if(j>=2&&L[j-1]>=0&&L[j-1]===L[j-2])v=1-L[j-1];
   else if(j+2<n&&L[j+1]>=0&&L[j+1]===L[j+2])v=1-L[j+1];
   else if(j>=1&&j+1<n&&L[j-1]>=0&&L[j-1]===L[j+1])v=1-L[j-1];
   if(v>=0){g[idx(n,k,j,col)]=v;L[j]=v;changed=true}}
  const c0=L.filter(x=>x===0).length,c1=L.filter(x=>x===1).length;
  if(c0>n/2||c1>n/2)return false;
  if(c0===n/2&&c1<n/2||c1===n/2&&c0<n/2){const v=c0===n/2?1:0;for(let j=0;j<n;j++)if(L[j]<0){g[idx(n,k,j,col)]=v;changed=true}}}
 if(!valid(g,n))return false}
 return true}

// Nombre de solutions (arrêt à limit).
export function countSolutions(g0,n,limit=2){const g=Int8Array.from(g0);if(!propagate(g,n))return 0;const e=g.indexOf(-1);if(e<0)return valid(g,n)?1:0;
 let total=0;for(const v of [0,1]){const h=Int8Array.from(g);h[e]=v;if(!valid(h,n))continue;total+=countSolutions(h,n,limit-total);if(total>=limit)break}return total}

function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
// Grille complète valide, tirée au hasard : on empile des lignes valides (équilibrées, sans triple),
// en vérifiant les colonnes au fur et à mesure.
const ROWS={};
function validRows(n){if(ROWS[n])return ROWS[n];const out=[];
 for(let m=0;m<1<<n;m++){const r=Array.from({length:n},(_,j)=>m>>j&1);if(r.filter(Boolean).length!==n/2)continue;let ok=true;for(let j=2;j<n&&ok;j++)if(r[j]===r[j-1]&&r[j]===r[j-2])ok=false;if(ok)out.push(r)}
 return ROWS[n]=out}
function fullGrid(n){const rows=validRows(n);
 for(;;){const pick=[],used=new Set();
  const ok=(r)=>{const k=pick.length;for(let j=0;j<n;j++){if(k>=2&&pick[k-1][j]===r[j]&&pick[k-2][j]===r[j])return false;let ones=r[j];for(const p of pick)ones+=p[j];if(ones>n/2||k+1-ones>n/2)return false}return true};
  const go=()=>{if(pick.length===n)return true;for(const r of shuffle(rows.slice())){const key=r.join('');if(used.has(key)||!ok(r))continue;pick.push(r);used.add(key);if(go())return true;pick.pop();used.delete(key)}return false};
  if(!go())continue;const g=Int8Array.from(pick.flat());if(valid(g,n))return g}}

// Puzzle : on retire des cases tant que la solution reste unique.
// budgetMs limite le temps (12×12) : au-delà, on garde les indices restants (la solution reste unique).
export function makeBinero(n=8,budgetMs=1200){const solution=fullGrid(n),puzzle=Int8Array.from(solution),t0=Date.now();
 for(const i of shuffle(Array.from({length:n*n},(_,i)=>i))){if(Date.now()-t0>budgetMs)break;const v=puzzle[i];puzzle[i]=-1;if(countSolutions(puzzle,n)!==1)puzzle[i]=v}
 return {n,puzzle:[...puzzle],solution:[...solution]}}

// Cases en faute dans une grille en cours (pour les signaler) : triples, lignes trop chargées, lignes identiques.
export function conflicts(g,n){const bad=new Set();
 for(const col of [false,true]){const full=new Map();
  for(let k=0;k<n;k++){const L=line(g,n,k,col);
   for(let j=2;j<n;j++)if(L[j]>=0&&L[j]===L[j-1]&&L[j]===L[j-2])for(const t of [j,j-1,j-2])bad.add(idx(n,k,t,col));
   for(const v of [0,1])if(L.filter(x=>x===v).length>n/2)for(let j=0;j<n;j++)if(L[j]===v)bad.add(idx(n,k,j,col));
   if(!L.includes(-1)){const key=L.join('');if(full.has(key))for(const kk of [k,full.get(key)])for(let j=0;j<n;j++)bad.add(idx(n,kk,j,col));else full.set(key,k)}}}
 return bad}
