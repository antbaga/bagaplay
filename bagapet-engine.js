// BagaPET : logique (sans affichage). Un petit monstre tout rond à créer et à chouchouter, version redneck.
// Les jauges baissent en temps réel, même appli fermée (rattrapage plafonné à 48 h).

export const STATS=[['ventre','Ventre','🍖'],['moral','Moral','😄'],['energie','Énergie','⚡'],['proprete','Propreté','🛁']];
const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
// baisse par heure (éveillé) ; endormi, l'énergie remonte
const DECAY={ventre:7,moral:5,energie:5,proprete:3};
export const MAX_CATCHUP_H=48;

// ---------------------------------------------------------------- catalogue
// v : ventre, m : moral, w : poids (kg), s : saleté, love : il adore / hate : il déteste
export const FOODS=[
 {id:'kebab',name:'Kebab',icon:'🥙',v:30,m:12,w:.35,s:8,love:1,say:['Kebab sauce blanche, mon pote !','Avec des frites dedans ?!']},
 {id:'pizza',name:'Pizza',icon:'🍕',v:26,m:10,w:.3,s:6,love:1,say:['Pizza ! Pizza ! Pizza !','Avec un supplément fromage !']},
 {id:'steak',name:'Steak grillé',icon:'🥩',v:32,m:14,w:.3,s:4,love:1,say:['Ça c’est d’la viande !','Saignant, comme au Texas !']},
 {id:'ribs',name:'Ribs au barbecue',icon:'🍖',v:34,m:15,w:.4,s:12,love:1,say:['Sauce barbecue partout !','J’en ai jusqu’aux oreilles !']},
 {id:'hotdog',name:'Saucisses',icon:'🌭',v:22,m:12,w:.25,s:5,love:1,say:['Encore une saucisse !','Moutarde ! Ketchup ! Tout !']},
 {id:'burger',name:'Burger',icon:'🍔',v:28,m:11,w:.35,s:6,love:1,say:['Triple steak, triple bacon !','Le régime commence lundi.']},
 {id:'chicken',name:'Poulet frit',icon:'🍗',v:24,m:10,w:.3,s:7,love:1,say:['Croustillant !','Finger lickin’ !']},
 {id:'bacon',name:'Bacon',icon:'🥓',v:14,m:12,w:.2,s:3,love:1,say:['Du bacon ! Du BACON !','Ça sent le paradis.']},
 {id:'fries',name:'Frites',icon:'🍟',v:16,m:7,w:.2,s:4,love:1,say:['Les frites, c’est des légumes.','Avec de la mayo !']},
 {id:'taco',name:'Chili tacos',icon:'🌮',v:20,m:9,w:.25,s:8,love:1,say:['Ça pique ! J’adore !','Chili con carne !']},
 {id:'donut',name:'Donut',icon:'🍩',v:12,m:10,w:.25,s:3,love:1,say:['Glaçage rose !','Un dernier pour la route.']},
 {id:'corn',name:'Maïs grillé',icon:'🌽',v:12,m:4,w:.1,s:3,say:['Bon, si y’a du beurre…','C’est presque d’la viande.']},
 {id:'salad',name:'Salade',icon:'🥗',v:3,m:-14,w:-.05,s:0,hate:1,say:['De l’herbe ?! J’suis pas une vache !','Beurk ! Remporte ça !']},
 {id:'broccoli',name:'Brocoli',icon:'🥦',v:2,m:-16,w:-.05,s:0,hate:1,say:['Un p’tit arbre ? Non merci.','Ça, c’est pour les lapins !']}
];
// a : alcool (ivresse), e : énergie
export const DRINKS=[
 {id:'beer',name:'Bière',icon:'🍺',v:4,m:12,a:18,e:-3,s:2,say:['Une p’tite mousse !','À la tienne, Étienne !']},
 {id:'whisky',name:'Whisky',icon:'🥃',v:0,m:14,a:32,e:-4,s:1,say:['Ça réchauffe le gosier !','Sans glaçon, voyons !']},
 {id:'moonshine',name:'Gnôle maison',icon:'🧪',v:0,m:18,a:45,e:-6,s:2,say:['C’est la recette de tonton !','Ça brûle les yeux !']},
 {id:'soda',name:'Soda',icon:'🥤',v:4,m:8,a:0,e:6,s:1,say:['Plein de bulles !','Pschiiit !'],burp:1},
 {id:'coffee',name:'Café',icon:'☕',v:2,m:2,a:-25,e:22,s:0,say:['Ça réveille !','Noir comme du goudron.']},
 {id:'water',name:'Eau',icon:'💧',v:2,m:-4,a:-10,e:2,s:0,say:['De l’eau ? T’es sérieux ?','Ça a pas d’goût…']},
 {id:'milk',name:'Lait',icon:'🥛',v:6,m:-2,a:-5,e:2,s:1,say:['J’suis plus un bébé !','Pouah, du lait.']}
];
export const TOYS=[
 {id:'football',name:'Ballon',icon:'🏈',m:16,e:-10,s:4,w:-.1,say:['Touchdown !','Lance plus fort !']},
 {id:'firecracker',name:'Pétards',icon:'🧨',m:22,e:-6,s:6,say:['BOUM ! YEEHAW !','Encore ! Encore !']},
 {id:'duck',name:'Canard',icon:'🦆',m:10,e:-2,s:-4,say:['Coin coin !','Mon meilleur pote.']},
 {id:'tractor',name:'Tracteur',icon:'🚜',m:18,e:-6,s:8,say:['Vroum vroum !','Plein gaz dans l’champ !']},
 {id:'fishing',name:'Pêche',icon:'🎣',m:14,e:-4,s:3,say:['Ça mord !','Le silence, c’est la pêche.']},
 {id:'frisbee',name:'Frisbee',icon:'🥏',m:14,e:-10,s:3,w:-.1,say:['Je l’ai !','Encore une fois !']}
];
export const MUSIC=[
 {id:'rock',name:'Rock',icon:'🎸',m:18,e:-8,say:['ROCK’N’ROLL !','Plus fort ! PLUS FORT !']},
 {id:'country',name:'Country',icon:'🪕',m:16,e:-5,say:['Yeehaw !','Tout le monde en ligne !']},
 {id:'marseillaise',name:'La Marseillaise',icon:'🇫🇷',m:12,e:-2,say:['Allons enfants !','Je suis ému…']}
];
export const HATS=[
 {id:'cowboy',name:'Cowboy',icon:'🤠'},{id:'trucker',name:'Casquette',icon:'🧢'},{id:'coon',name:'Chapka raton',icon:'🦝'},
 {id:'beret',name:'Béret',icon:'🥖'},{id:'crown',name:'Couronne',icon:'👑'},{id:'party',name:'Chapeau de fête',icon:'🥳'},
 {id:'hardhat',name:'Casque de chantier',icon:'⛑️'},{id:'none',name:'Tête nue',icon:'🚫'}
];
export const EXTRAS=[{id:'shades',name:'Lunettes de soleil',icon:'😎'},{id:'mustache',name:'Moustache',icon:'🥸'},{id:'bandana',name:'Bandana',icon:'🧣'}];
export const CARE=[
 {id:'hose',name:'Tuyau d’arrosage',icon:'🚿'},{id:'sleep',name:'Dodo',icon:'💤'},{id:'aspirin',name:'Aspirine',icon:'💊'}
];

// ---------------------------------------------------------------- création
// pièces : type, sous-modèle, angle sur le corps (0 = en haut, sens horaire), distance au centre (1 = bord), taille, couleur ;
// sym : identifiant commun d'une paire en miroir
export const PARTS={
 eye:{name:'Œil',icon:'👁️',kinds:['rond','globuleux','endormi','cyclope'],front:1,dist:.45,ang:-.45,sym:1},
 stalk:{name:'Œil sur antenne',icon:'🐌',kinds:['antenne','double'],dist:1,ang:-.35,sym:1},
 mouth:{name:'Bouche',icon:'👄',kinds:['sourire','dents','bec','moustache'],front:1,dist:.35,ang:Math.PI,sym:0},
 nose:{name:'Nez',icon:'🐽',kinds:['groin','patate','clown'],front:1,dist:.1,ang:Math.PI,sym:0},
 arm:{name:'Bras',icon:'💪',kinds:['nouille','costaud','tentacule','pince'],dist:1,ang:1.75,sym:1},
 leg:{name:'Jambe',icon:'🦵',kinds:['courte','longue','poulet','roue'],dist:1,ang:2.6,sym:1},
 tail:{name:'Queue',icon:'🐷',kinds:['tire-bouchon','longue','touffue','poisson'],dist:1,ang:2.2,sym:0},
 horn:{name:'Cornes',icon:'🐂',kinds:['taureau','diable','bois de cerf','licorne'],dist:1,ang:-.55,sym:1},
 ear:{name:'Oreilles',icon:'🐰',kinds:['pointues','tombantes','rondes'],dist:1,ang:-.95,sym:1},
 antenna:{name:'Antennes',icon:'📡',kinds:['boule','spirale'],dist:1,ang:-.25,sym:1},
 wing:{name:'Ailes',icon:'🪽',kinds:['plumes','chauve-souris'],dist:1,ang:1.3,sym:1}
};
export const MAX_PARTS=26;
export const COLORS=['#f4a261','#e76f51','#e9c46a','#8ab17d','#2a9d8f','#6d9dc5','#9b7ede','#f28ab2','#c08552','#a3a3a3','#f1e3c8','#5c4033'];
export const PATTERNS=['uni','taches','rayures','ventre'];
export const NAMES=['Billy-Bob','Cletus','Bubba','Earl','Jolene','Dolly','Hank','Buck','Jimmy-Ray','Darlene','Bobby-Lee','Tammy','Duke','Daisy','Rusty','Waylon'];

const nid=p=>(p.nid=(p.nid||100)+1);
export function newPet(r=Math.random,now=Date.now()){const p={v:1,level:1,name:NAMES[Math.floor(r()*NAMES.length)],born:now,at:now,
  body:{color:COLORS[Math.floor(r()*8)],pattern:'uni',belly:'#fff3d6',squash:1},parts:[],hat:'cowboy',extras:[],
  st:{ventre:65,moral:70,energie:80,proprete:85},ivresse:0,poids:12,asleep:false,created:false,counts:{},nid:100};
 addPart(p,'eye','rond');addPart(p,'mouth','sourire');addPart(p,'leg','courte');return p}
export function addPart(p,type,kind){const d=PARTS[type];if(!d)return null;const n=d.sym?2:1;if(p.parts.length+n>MAX_PARTS)return null;
 const base={type,kind:kind||d.kinds[0],ang:d.ang,dist:d.dist,size:1,color:null};
 if(!d.sym){const q={...base,id:nid(p)};p.parts.push(q);return q}
 const s=nid(p),a={...base,id:nid(p),sym:s},b={...base,id:nid(p),sym:s,ang:-d.ang};p.parts.push(a,b);return a}
export const partsOf=(p,q)=>q&&q.sym?p.parts.filter(o=>o.sym===q.sym):[q];
// déplacer une pièce : son jumeau suit en miroir
export function movePart(p,q,ang,dist){const d=PARTS[q.type];dist=d.front?clamp(dist,0,.85):clamp(dist,.75,1.1);
 for(const o of partsOf(p,q))if(o===q){o.ang=ang;o.dist=dist}else{o.ang=-ang;o.dist=dist}}
export function resizePart(p,q,k){for(const o of partsOf(p,q))o.size=clamp(+(o.size*k).toFixed(2),.45,2.2)}
export function recolorPart(p,q,col){for(const o of partsOf(p,q))o.color=col}
export function restylePart(p,q){const d=PARTS[q.type],k=d.kinds[(d.kinds.indexOf(q.kind)+1)%d.kinds.length];for(const o of partsOf(p,q))o.kind=k;return k}
export function removePart(p,q){const ids=new Set(partsOf(p,q).map(o=>o.id));p.parts=p.parts.filter(o=>!ids.has(o.id))}
// sépare ou réunit une paire
export function toggleMirror(p,q){if(q.sym){for(const o of partsOf(p,q))if(o!==q)p.parts.splice(p.parts.indexOf(o),1);delete q.sym;return false}
 if(p.parts.length+1>MAX_PARTS)return null;const s=nid(p);q.sym=s;p.parts.push({...q,id:nid(p),ang:-q.ang});return true}

// ---------------------------------------------------------------- temps qui passe
// fait vivre le BagaPET pendant ms (rattrapage limité). Endormi : énergie +18/h ; ivre : moral +, propreté −.
export function tick(p,ms){const h=Math.min(ms,MAX_CATCHUP_H*3600e3)/3600e3;if(h<=0)return;const s=p.st;
 s.ventre=clamp(s.ventre-DECAY.ventre*h);s.proprete=clamp(s.proprete-DECAY.proprete*h);
 s.moral=clamp(s.moral-DECAY.moral*h*(s.ventre<20?1.8:1)*(s.proprete<20?1.4:1));
 if(p.asleep){s.energie=clamp(s.energie+18*h);if(s.energie>=99&&p.ivresse<20)p.asleep=false}else s.energie=clamp(s.energie-DECAY.energie*h);
 p.ivresse=clamp(p.ivresse-22*h);p.poids=Math.max(6,p.poids-.4*h/24);if(p.hangover)p.hangover=Math.max(0,p.hangover-h)}
export function catchUp(p,now=Date.now()){const ms=now-(p.at??now);tick(p,ms);p.at=now;return ms}
export const ageDays=(p,now=Date.now())=>Math.floor((now-p.born)/864e5);

// ---------------------------------------------------------------- humeur
export function mood(p){const s=p.st;
 if(p.asleep)return p.ivresse>60?'ko':'sleep';
 if(p.ivresse>=70)return 'drunk';if(p.ivresse>=30)return 'tipsy';
 if(s.ventre<20)return 'hungry';if(s.energie<15)return 'tired';if(s.proprete<20)return 'dirty';if(p.hangover>0)return 'hangover';
 if(s.moral<25)return 'sad';if(s.moral>75&&s.ventre>50)return 'happy';return 'ok'}
export const MOOD_TEXT={ko:'Il cuve…',sleep:'Il dort.',drunk:'Complètement bourré !',tipsy:'Un peu pompette.',hungry:'Il a la dalle !',tired:'Il tombe de sommeil.',
 dirty:'Il sent le fennec.',hangover:'Gueule de bois.',sad:'Il s’ennuie à mourir.',happy:'Heureux comme un cochon dans la boue !',ok:'Ça va, tranquille.'};

// ---------------------------------------------------------------- actions (renvoient la réaction à jouer)
const pick=(a,r=Math.random)=>a[Math.floor(r()*a.length)];
function bump(p,o){const s=p.st;s.ventre=clamp(s.ventre+(o.v||0));s.moral=clamp(s.moral+(o.m||0));s.energie=clamp(s.energie+(o.e||0));s.proprete=clamp(s.proprete-(o.s||0));
 p.poids=Math.max(6,+(p.poids+(o.w||0)).toFixed(2));p.counts[o.id]=(p.counts[o.id]||0)+1}
export function feed(p,id,r=Math.random){const f=FOODS.find(o=>o.id===id);if(!f)return null;
 if(p.asleep)return {anim:'sleep',say:'Zzz… (il dort)'};
 if(p.ivresse>=90)return {anim:'refuse',say:'Hic… pu faim… hic.'};
 if(f.hate){bump(p,f);return {anim:'spit',say:pick(f.say,r),sound:'spit'}}
 if(p.st.ventre>=97)return {anim:'full',say:pick(['J’ai plus faim… enfin, un peu.','Mon bide va exploser !'],r),sound:'burp'};
 bump(p,f);return {anim:'eat',say:pick(f.say,r),sound:'chomp',burp:r()<.3}}
export function drink(p,id,r=Math.random){const d=DRINKS.find(o=>o.id===id);if(!d)return null;
 if(p.asleep)return {anim:'sleep',say:'Zzz…'};
 bump(p,d);const was=p.ivresse;p.ivresse=clamp(p.ivresse+d.a);
 if(d.a>0&&p.ivresse>=95){p.asleep=true;p.hangover=6;return {anim:'faint',say:'Ch’uis… pas… bourré…',sound:'thud'}}
 if(d.a>0&&was<70&&p.ivresse>=70)p.hangover=Math.max(p.hangover||0,3);
 return {anim:'drink',say:p.ivresse>=70&&d.a>0?pick(['J’T’AIME MON POTE !','On est bien là… hic !','Ch’uis pas bourré !'],r):pick(d.say,r),sound:'gulp',burp:d.burp||d.a>0&&r()<.4,hic:p.ivresse>=30}}
export function play(p,id,r=Math.random){const t=TOYS.find(o=>o.id===id);if(!t)return null;
 if(p.asleep)return {anim:'sleep',say:'Zzz…'};
 if(p.st.energie<8)return {anim:'refuse',say:'Trop crevé… plus tard.'};
 bump(p,t);return {anim:id,say:pick(t.say,r),sound:id}}
export function listen(p,id,r=Math.random){const m=MUSIC.find(o=>o.id===id);if(!m)return null;
 if(p.asleep&&p.ivresse<60){p.asleep=false}
 bump(p,m);return {anim:'dance-'+id,say:p.asleep?'Zzz… hic…':pick(m.say,r),music:id}}
export function wear(p,id){if(HATS.some(h=>h.id===id)){p.hat=id==='none'?null:id;return {anim:'pose',say:id==='none'?'Tête nue, cheveux au vent.':pick(['Classe !','J’ai l’air d’un champion !','Trop stylé !'])}}
 if(EXTRAS.some(h=>h.id===id)){const i=p.extras.indexOf(id);if(i>=0)p.extras.splice(i,1);else p.extras.push(id);return {anim:'pose',say:i>=0?'Bon, j’enlève.':'La grande classe.'}}return null}
export function care(p,id,r=Math.random){const s=p.st;
 if(id==='hose'){if(p.asleep)p.asleep=false;s.proprete=100;s.moral=clamp(s.moral-4);p.ivresse=clamp(p.ivresse-10);return {anim:'shower',say:pick(['C’EST FROID !','Glou glou… ça mouille !']),sound:'water'}}
 if(id==='sleep'){if(p.asleep){p.asleep=false;s.moral=clamp(s.moral-(s.energie<60?6:0));return {anim:'wake',say:s.energie<60?'Hein ? Quoi ? Laisse-moi dormir…':'Bien dormi !'}}
  p.asleep=true;return {anim:'sleep',say:'Bonne nuit… Zzz…'}}
 if(id==='aspirin'){const had=p.hangover>0||p.ivresse>30;p.hangover=0;p.ivresse=clamp(p.ivresse-30);s.moral=clamp(s.moral+(had?10:-2));return {anim:'drink',say:had?'Ah… ça va mieux.':'J’ai pas mal à la tête, moi.'}}
 return null}
// gestes sur le BagaPET : caresse, chatouilles, petite tape
export function touch(p,kind,r=Math.random){const s=p.st;
 if(p.asleep){if(kind==='poke'&&r()<.5){p.asleep=false;s.moral=clamp(s.moral-5);return {anim:'wake',say:'Hé ! Je dormais !'}}return {anim:'snore',say:'Zzz…'}}
 if(kind==='rub'){s.moral=clamp(s.moral+3);return {anim:'love',say:pick(['Ronron…','Encore !','Là, derrière l’oreille…'],r)}}
 if(kind==='tickle'){s.moral=clamp(s.moral+5);s.energie=clamp(s.energie-1);return {anim:'laugh',say:pick(['HAHAHA ! Arrête !','Hihihi ! Pas les pieds !'],r),sound:'laugh'}}
 return {anim:'poke',say:pick(['Aïe !','Quoi ?','Tu veux ma photo ?','Hé ho !'],r),sound:'boing'}}
// bêtises spontanées quand on ne fait rien
export function idleGag(p,r=Math.random){const m=mood(p);if(p.asleep)return null;
 const g=m==='drunk'||m==='tipsy'?[['hic','Hic !'],['sing','🎵 Lalalaaa… hic !'],['wobble','Le sol bouge…']]:
  m==='hungry'?[['grumble','J’ai la dalle !'],['grumble','Une saucisse… vite…']]:m==='dirty'?[['flies','Ça sent bizarre ici…']]:
  m==='tired'?[['yawn','Aaaah… *bâille*']]:[['burp','*ROT*'],['scratch','Ça gratte…'],['yell','YEEEHAW !'],['look','C’est quoi ce truc là-bas ?'],['dance','🎵 Hum hum…'],['fart','Oups… c’est pas moi.']];
 const [anim,say]=pick(g,r);return {anim,say,sound:anim==='burp'||anim==='fart'?anim:anim==='hic'?'hic':null}}
