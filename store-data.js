// BagaStore : catalogues et constantes d'équilibrage.
// 1 case = 1 m. Prix en euros. Les prix d'achat des produits sont des prix moyens « par article ».

// Terrain et bâtiment de départ (grosse supérette de 400 m², façade au sud, réserve au nord).
// terrain : 160 × 152 m (5.1 : 4 fois plus grand qu'avant). La route principale traverse le terrain, on construit des deux côtés.
// OFF : décalage de l'ancien terrain de 80 × 76 m dans le nouveau (sauvegardes d'avant la 5.1).
export const LOT_W=160,LOT_H=152,ROAD={y:84,h:4},OFF={x:40,y:38},OLD_LOT={w:80,h:76};
export const START={x0:60,y0:56,x1:80,y1:76,entrance:69,reserveRows:5,cash:140000,starterCash:100000,loan:420000,loanMonthly:2900,rep:50};
export const EXTEND={perM2:900,margin:2};
// livraisons : un camion par rayon, au plus 3 par quai (+1) sur le terrain ; écart entre deux camions (s) ;
// déchargement : articles par seconde et par employé (100 articles en 10 s), ×roadFactor si le camion est resté sur la route,
// au plus maxHands employés sur un camion ; chauffeur seul (sans employé de rayon) : articles par seconde
export const TRUCK={gap:3,perStaff:10,roadFactor:.6,maxHands:5,driverRate:4};
// la nuit, quand il n'y a plus ni client ni livraison, l'horloge tourne plus vite (pas de saut dans le temps)
export const NIGHT_RATE=12;
// pendant les livraisons de nuit, les heures passent deux fois moins vite qu'en journée (le temps de vider les camions)
export const NIGHT_WORK_RATE=.5;
export const HOURS={start:6,open:8,close:20,realSecPerHour:20};   // 6 h–8 h : livraison et mise en place avant l'ouverture       // 12 h d'ouverture = 4 min en ×1
export const DAYS_PER_MONTH=30;
export const BANKRUPTCY=-40000;
export const WALL_COST=150,DOOR_COST=450,REFUND=0.5;
export const SPEEDS=[1,2,4,8];

// Rayons de produits. store : où on les stocke en réserve. fix : type de meuble de vente.
// cost : prix d'achat moyen d'un article. ref : marge « normale » (au-delà, les clients achètent moins).
// demand : poids dans les listes de courses. loss : part du stock perdue par nuit (périmé, invendus).
export const CATS=[
 {id:'fruits',   name:'Fruits & légumes',  store:'frais',   cost:2.08, ref:35, demand:14, loss:.05,  color:[[.86,.25,.2],[.45,.72,.26],[.98,.6,.15]]},
 {id:'pain',     name:'Pain & viennoiseries',store:'ambiant',cost:0.78,ref:60, demand:9,  loss:.35,  color:[[.86,.62,.33],[.76,.5,.25]]},
 {id:'cremerie', name:'Crèmerie',          store:'frais',   cost:1.69, ref:25, demand:14, loss:.015, color:[[.96,.96,.92],[.35,.55,.85]]},
 {id:'traiteur', name:'Traiteur',          store:'frais',   cost:4.16, ref:30, demand:7,  loss:.04,  color:[[.95,.75,.35],[.7,.85,.55]]},
 {id:'viande',   name:'Viande',            store:'frais',   cost:8.45, ref:28, demand:10, loss:.03,  color:[[.78,.2,.22],[.92,.45,.45]]},
 {id:'poisson',  name:'Poisson',           store:'frais',   cost:9.75, ref:30, demand:5,  loss:.06,  color:[[.7,.8,.88],[.95,.6,.45]]},
 {id:'fromage',  name:'Fromages',          store:'frais',   cost:4.94, ref:30, demand:7,  loss:.01,  color:[[.98,.85,.35],[.95,.92,.7]]},
 {id:'surgeles', name:'Surgelés & glaces', store:'surgele', cost:3.38, ref:30, demand:8,  loss:.001, color:[[.6,.82,.95],[.95,.95,1],[.85,.4,.6]]},
 {id:'epicerie', name:'Épicerie salée',    store:'ambiant', cost:1.43, ref:28, demand:15, loss:.0005,color:[[.95,.55,.2],[.85,.25,.2],[.95,.85,.4]]},
 {id:'sucre',    name:'Biscuits & gâteaux',store:'ambiant', cost:1.95, ref:32, demand:10, loss:.001, color:[[.95,.6,.7],[.55,.35,.25],[.98,.8,.4]]},
 {id:'petitdej', name:'Petit-déjeuner',    store:'ambiant', cost:3.12, ref:28, demand:7,  loss:.001, color:[[.45,.3,.2],[.95,.8,.3]]},
 {id:'boissons', name:'Boissons',          store:'ambiant', cost:1.17, ref:30, demand:13, loss:.0005,color:[[.3,.65,.95],[.9,.25,.25],[.98,.75,.2]]},
 {id:'alcool',   name:'Vins & alcools',    store:'ambiant', cost:7.15, ref:30, demand:6,  loss:0,    color:[[.45,.12,.2],[.2,.4,.25]],theft:2.5},
 {id:'hygiene',  name:'Hygiène & beauté',  store:'ambiant', cost:3.64, ref:35, demand:6,  loss:0,    color:[[.85,.7,.95],[.6,.85,.85]],theft:2},
 {id:'entretien',name:'Entretien & maison',store:'ambiant', cost:3.25, ref:30, demand:5,  loss:0,    color:[[.3,.6,.9],[.4,.8,.5]]},
 // rayons spécialisés (licence) : articles plus chers, achetés moins souvent ; pick : temps passé à choisir (s)
 {id:'livres',   name:'Livres & papeterie', store:'ambiant',cost:7.2,  ref:35, demand:4,  loss:0, lic:'livres',   pick:1.6, theft:1.5,color:[[.85,.3,.25],[.25,.45,.75],[.95,.85,.55],[.3,.6,.4]]},
 {id:'animaux',  name:'Animalerie',         store:'ambiant',cost:4.6,  ref:35, demand:3,  loss:0, lic:'animaux',  pick:1.2,           color:[[.95,.65,.25],[.45,.7,.3],[.4,.55,.85]]},
 {id:'jouets',   name:'Jouets',             store:'ambiant',cost:12.5, ref:40, demand:3,  loss:0, lic:'jouets',   pick:1.8, theft:1.5,color:[[.95,.3,.3],[.98,.8,.2],[.3,.6,.95],[.5,.8,.35]]},
 {id:'jardin',   name:'Jardinerie',         store:'ambiant',cost:8.2,  ref:40, demand:3,  loss:.01,lic:'jardin',  pick:1.6,           color:[[.35,.65,.3],[.9,.4,.55],[.95,.8,.3],[.55,.4,.3]]},
 {id:'sport',    name:'Sport',              store:'ambiant',cost:18,   ref:40, demand:3,  loss:0, lic:'sport',    pick:1.8, theft:1.5,color:[[.2,.45,.85],[.95,.95,.95],[.95,.5,.15],[.2,.2,.25]]},
 {id:'vetements',name:'Vêtements',          store:'ambiant',cost:11,   ref:55, demand:4,  loss:0, lic:'vetements',pick:2.4, theft:2,  color:[[.25,.3,.5],[.85,.85,.82],[.75,.25,.3],[.45,.6,.75],[.3,.45,.3]]},
 {id:'audiovisuel',name:'Audiovisuel',      store:'ambiant',cost:85,   ref:25, demand:2,  loss:0, lic:'audiovisuel',pick:2.6,theft:3,color:[[.15,.16,.18],[.6,.62,.66],[.2,.5,.9]]},
 {id:'electromenager',name:'Électroménager',store:'ambiant',cost:140,  ref:25, demand:1.5,loss:0, lic:'electromenager',pick:3,theft:.4,color:[[.95,.95,.95],[.75,.77,.8],[.25,.27,.3]]},
 {id:'bricolage',name:'Bricolage',          store:'ambiant',cost:9.5,  ref:40, demand:3,  loss:0, lic:'bricolage',pick:1.8, theft:1.5,color:[[.95,.6,.1],[.3,.3,.35],[.8,.2,.2],[.3,.55,.85]]},
 {id:'materiaux',name:'Matériaux',          store:'ambiant',cost:22,   ref:30, demand:2,  loss:0, lic:'materiaux',pick:2,             color:[[.75,.72,.68],[.8,.6,.38],[.55,.55,.58]]}
];
// Marges à l'échelle : 4.1 ×7, 4.2 ×5,6 (bénéfices −20 %). MARGIN_SCALE remet à l'échelle la sensibilité des clients aux marges.
export const MARGIN_SCALE=5.6;
for(const c of CATS)c.ref=Math.round(c.ref*MARGIN_SCALE);
export const CAT=Object.fromEntries(CATS.map(c=>[c.id,c]));
export const STORES={ambiant:'Ambiant',frais:'Frais',surgele:'Surgelé'};
const AMB=['epicerie','sucre','petitdej','boissons','alcool','hygiene','entretien'];

// Meubles. kind : sale (vente libre-service), counter (à la coupe, avec un employé), checkout, self (caisse auto),
// reserve, dock, decor. zone : 0 = magasin, 1 = réserve. power : €/mois d'électricité.
export const ITEMS=[
 {id:'shelf',  tab:'rayons',  name:'Étagère',              w:2,d:1,h:1.5,price:1200, kind:'sale',cats:AMB,cap:120,zone:0},
 {id:'shelfH', tab:'rayons',  name:'Gondole haute',        w:2,d:1,h:2.1,price:2100, kind:'sale',cats:AMB,cap:200,zone:0},
 {id:'promo',  tab:'rayons',  name:'Tête de gondole',      w:1,d:1,h:1.4,price:900,  kind:'sale',cats:AMB.concat(['pain']),cap:50,zone:0,attract:1.5},
 {id:'bread',  tab:'rayons',  name:'Présentoir à pain',    w:2,d:1,h:1.3,price:1600, kind:'sale',cats:['pain'],cap:90,zone:0},
 {id:'veg',    tab:'frais',   name:'Étal fruits & légumes',w:2,d:2,h:1.0,price:1800, kind:'sale',cats:['fruits'],cap:160,zone:0,attract:1},
 {id:'fridge', tab:'frais',   name:'Vitrine réfrigérée',   w:2,d:1,h:2.0,price:4800, kind:'sale',cats:['cremerie','traiteur','viande','poisson','fromage'],cap:90,zone:0,power:170},
 {id:'freezer',tab:'frais',   name:'Congélateur',          w:2,d:1,h:0.9,price:3900, kind:'sale',cats:['surgeles'],cap:80,zone:0,power:150},
 {id:'butcher',tab:'coupe',   name:'Boucherie',            w:3,d:2,h:1.2,price:14000,kind:'counter',cats:['viande'], staff:'boucher',    cap:140,zone:0,power:220,attract:3},
 {id:'fish',   tab:'coupe',   name:'Poissonnerie',         w:3,d:2,h:1.2,price:13000,kind:'counter',cats:['poisson'],staff:'poissonnier',cap:120,zone:0,power:220,attract:3},
 {id:'cheese', tab:'coupe',   name:'Fromagerie',           w:3,d:2,h:1.2,price:11000,kind:'counter',cats:['fromage'],staff:'fromager',   cap:120,zone:0,power:160,attract:3},
 {id:'bakery', tab:'coupe',   name:'Fournil',              w:3,d:2,h:1.6,price:16000,kind:'counter',cats:['pain'],   staff:'boulanger',  cap:160,zone:0,power:260,attract:3},
 {id:'checkout',tab:'caisses',name:'Caisse',               w:2,d:1,h:1.0,price:3500, kind:'checkout',zone:0,power:20},
 {id:'self',   tab:'caisses', name:'Caisse automatique',   w:1,d:1,h:1.4,price:6500, kind:'self',zone:0,power:25},
 {id:'rack',   tab:'reserve', name:'Rack de réserve',      w:2,d:1,h:2.4,price:700,  kind:'reserve',store:'ambiant',cap:500,zone:1},
 {id:'cold',   tab:'reserve', name:'Chambre froide',       w:3,d:3,h:2.5,price:11000,kind:'reserve',store:'frais',cap:1400,zone:1,power:450},
 {id:'frozen', tab:'reserve', name:'Chambre froide négative',w:3,d:3,h:2.5,price:13000,kind:'reserve',store:'surgele',cap:900,zone:1,power:600},
 {id:'dock',   tab:'reserve', name:'Quai de livraison',    w:3,d:2,h:0.4,price:9000, kind:'dock',zone:1},
 {id:'spot',   tab:'parking', name:'Place de parking',     w:2,d:4,h:.05,price:800,  kind:'spot',zone:2},
 {id:'busstop',tab:'parking', name:'Arrêt de bus',         w:3,d:1,h:2.4,price:6000, kind:'bus',zone:2},
 {id:'turn',   tab:'parking', name:'Zone de retournement', w:10,d:10,h:.03,price:4000,kind:'turn',zone:2},
 {id:'corral', tab:'parking', name:'Abri à caddies',       w:2,d:1,h:1.2,price:1500, kind:'corral',zone:2,cap:15},
 {id:'plant',  tab:'deco',    name:'Plante',               w:1,d:1,h:1.2,price:90,   kind:'decor',zone:0,attract:1},
 {id:'lamp',   tab:'deco',    name:'Éclairage d’ambiance', w:1,d:1,h:2.2,price:300,  kind:'decor',zone:0,attract:2,power:12},
 {id:'bin',    tab:'deco',    name:'Poubelle',             w:1,d:1,h:0.8,price:60,   kind:'decor',zone:0,clean:1},
 {id:'camera', tab:'caisses', name:'Caméra',               w:1,d:1,h:2.6,price:1400, kind:'decor',zone:0,security:.07,power:8},
 {id:'gate',   tab:'caisses', name:'Portique antivol',     w:1,d:1,h:1.6,price:3200, kind:'decor',zone:0,security:.2,power:10}
];
// ---- extension « centre commercial » : licences (achetées une par une), rayons spécialisés, boutiques, équipements de la galerie
export const LICENSES=[
 {id:'galerie',    group:'galerie',  name:'Galerie marchande',       price:100000, desc:'Bancs, toilettes, fontaines, distributeurs, aire de jeux, plan, agents de sécurité.'},
 {id:'livres',     group:'rayon',    name:'Librairie & papeterie',   price:100000, desc:'Livres, presse, papeterie.'},
 {id:'animaux',    group:'rayon',    name:'Animalerie',              price:120000, desc:'Croquettes, accessoires, aquariums.'},
 {id:'jouets',     group:'rayon',    name:'Jouets',                  price:150000, desc:'Jeux et jouets pour enfants.'},
 {id:'jardin',     group:'rayon',    name:'Jardinerie',              price:200000, desc:'Plantes, graines, outils de jardin.'},
 {id:'sport',      group:'rayon',    name:'Sport',                   price:250000, desc:'Équipement sportif, ballons, vélos.'},
 {id:'vetements',  group:'rayon',    name:'Textile',                 price:300000, desc:'Vêtements en libre-service, cabines d’essayage.'},
 {id:'audiovisuel',group:'rayon',    name:'Audiovisuel & multimédia',price:400000, desc:'Télévisions, hi-fi, consoles. Très convoités par les voleurs.'},
 {id:'electromenager',group:'rayon', name:'Électroménager',          price:450000, desc:'Gros et petit électroménager.'},
 {id:'bricolage',  group:'rayon',    name:'Bricolage',               price:500000, desc:'Outillage, quincaillerie, peinture.'},
 {id:'materiaux',  group:'rayon',    name:'Matériaux',               price:650000, desc:'Matériaux de construction sur racks à palettes.'},
 {id:'cafe',       group:'boutique', name:'Café',                    price:100000, desc:'Boissons chaudes : soif et petite pause.'},
 {id:'fleuriste',  group:'boutique', name:'Fleuriste',               price:100000, desc:'Bouquets et plantes.'},
 {id:'glacier',    group:'boutique', name:'Glacier',                 price:120000, desc:'Glaces et sorbets.'},
 {id:'boulangerie',group:'boutique', name:'Boulangerie-pâtisserie',  price:150000, desc:'Viennoiseries, sandwichs, gâteaux : contre la faim.'},
 {id:'snack',      group:'boutique', name:'Snack',                   price:180000, desc:'Restauration rapide : faim et soif.'},
 {id:'coiffeur',   group:'boutique', name:'Coiffeur',                price:200000, desc:'Coupes et brushings. Long, mais rentable.'},
 {id:'pretaporter',group:'boutique', name:'Prêt-à-porter',           price:300000, desc:'Boutique de mode.'},
 {id:'parfumerie', group:'boutique', name:'Parfumerie',              price:350000, desc:'Parfums et cosmétiques.'},
 {id:'pharmacie',  group:'boutique', name:'Pharmacie',               price:400000, desc:'Médicaments et parapharmacie.'},
 {id:'opticien',   group:'boutique', name:'Opticien',                price:450000, desc:'Lunettes et lentilles : peu de clients, gros paniers.'},
 {id:'electronique',group:'boutique',name:'Électronique',            price:500000, desc:'Téléphones, ordinateurs, accessoires.'},
 {id:'restaurant', group:'boutique', name:'Restaurant',              price:600000, desc:'Repas à table : faim, soif et repos.'},
 {id:'bijouterie', group:'boutique', name:'Bijouterie',              price:800000, desc:'Montres et bijoux : très gros paniers.'},
 {id:'cinema',     group:'boutique', name:'Cinéma',                  price:1000000,desc:'Salles de cinéma : attire beaucoup de monde dans le centre.'}
];
export const LICENSE=Object.fromEntries(LICENSES.map(l=>[l.id,l]));
const SL=(id,name,w,d,h,price,lic,cats,cap,ex={})=>({id,tab:'special',name,w,d,h,price,kind:'sale',cats,cap,zone:0,lic,...ex});
ITEMS.push(
 SL('bookcase','Bibliothèque',2,1,2.0,1800,'livres',['livres'],140),SL('press','Présentoir presse',1,1,1.5,700,'livres',['livres'],60),
 SL('petshelf','Rayon animalerie',2,1,1.6,1600,'animaux',['animaux'],110),SL('aquarium','Aquariums',2,1,1.8,3500,'animaux',['animaux'],40,{attract:2,power:60}),
 SL('toyshelf','Étagère à jouets',2,1,1.8,1700,'jouets',['jouets'],90),
 SL('plants','Étal de jardinerie',2,2,1.2,2000,'jardin',['jardin'],80,{attract:1}),
 SL('sportrack','Rayon sport',2,1,1.9,2200,'sport',['sport'],70),SL('bikes','Présentoir vélos',3,1,1.3,2600,'sport',['sport'],24,{attract:1}),
 SL('rail','Portant à vêtements',2,1,1.6,1400,'vetements',['vetements'],80),SL('island','Îlot textile',2,2,1.4,2200,'vetements',['vetements'],110),
 {id:'fitting',tab:'special',name:'Cabines d’essayage',w:2,d:1,h:2.2,price:4200,kind:'decor',zone:0,lic:'vetements',boost:{vetements:.3}},
 SL('tvwall','Mur d’écrans',3,1,2.2,6500,'audiovisuel',['audiovisuel'],30,{attract:2,power:300}),SL('hifi','Table multimédia',2,1,1.1,3000,'audiovisuel',['audiovisuel'],40,{power:60}),
 SL('appliance','Îlot électroménager',3,2,1.5,5000,'electromenager',['electromenager'],24,{power:40}),
 SL('toolwall','Mur d’outillage',2,1,2.1,2400,'bricolage',['bricolage'],120),SL('paint','Rayon peinture',2,1,1.8,1900,'bricolage',['bricolage'],90),
 SL('pallet','Rack à palettes',3,1,2.6,3600,'materiaux',['materiaux'],80));
// boutiques : ticket moyen (€), cr : part du ticket en marchandises, svc : durée du service (s), slots : clients servis en même temps,
// inside : le client entre dans la boutique, visit : chance qu'un client y passe, draw : clients en plus pour le centre, serves : besoins comblés
const SH=(id,name,w,d,price,lic,staff,ex)=>({id,tab:'boutiques',name,w,d,h:2.8,price,kind:'shop',zone:0,lic,staff,slots:1,...ex});
ITEMS.push(
 SH('sh_cafe','Café',4,3,18000,'cafe','serveur',{ticket:16,cr:.25,svc:4,slots:2,visit:0.34,draw:.05,serves:{soif:80,fatigue:35},power:120,sign:'#7a4a2e'}),
 SH('sh_florist','Fleuriste',3,3,12000,'fleuriste','vendeur',{ticket:61,cr:.4,svc:6,visit:0.1,draw:.03,sign:'#4f9a5a'}),
 SH('sh_glacier','Glacier',3,3,15000,'glacier','serveur',{ticket:14.4,cr:.3,svc:3,visit:0.22,draw:.04,serves:{faim:25,soif:35},power:150,sign:'#e86fa0'}),
 SH('sh_bakery','Boulangerie-pâtisserie',4,3,22000,'boulangerie','vendeur',{ticket:19,cr:.3,svc:3.5,slots:2,visit:0.32,draw:.05,serves:{faim:60},power:200,sign:'#b9773c'}),
 SH('sh_snack','Snack',4,3,25000,'snack','serveur',{ticket:29,cr:.32,svc:5,slots:2,visit:0.22,draw:.06,serves:{faim:85,soif:50},power:220,sign:'#e2462f'}),
 SH('sh_hair','Coiffeur',4,4,30000,'coiffeur','coiffeur',{ticket:86,cr:.08,svc:28,slots:2,inside:true,visit:0.08,draw:.04,power:80,sign:'#2f2f3a'}),
 SH('sh_fashion','Prêt-à-porter',5,4,40000,'pretaporter','vendeur',{ticket:128,cr:.45,svc:10,slots:3,inside:true,visit:0.16,draw:.08,power:90,sign:'#c23b6b'}),
 SH('sh_perfume','Parfumerie',4,3,35000,'parfumerie','vendeur',{ticket:144,cr:.45,svc:7,slots:2,visit:0.11,draw:.05,sign:'#8a5fc2'}),
 SH('sh_pharma','Pharmacie',4,3,45000,'pharmacie','vendeur',{ticket:58,cr:.55,svc:6,slots:2,visit:0.18,draw:.05,power:60,sign:'#2e9a54'}),
 SH('sh_optic','Opticien',4,3,45000,'opticien','vendeur',{ticket:416,cr:.4,svc:16,inside:true,visit:0.034,draw:.04,sign:'#2c5fa8'}),
 SH('sh_tech','Électronique',5,4,60000,'electronique','vendeur',{ticket:352,cr:.65,svc:10,slots:2,inside:true,visit:0.08,draw:.08,power:200,sign:'#1d2f4f'}),
 SH('sh_resto','Restaurant',6,5,80000,'restaurant','cuisinier',{ticket:72,cr:.3,svc:24,slots:8,inside:true,visit:0.12,draw:.1,serves:{faim:100,soif:70,fatigue:70},power:350,sign:'#8c2d2d'}),
 SH('sh_jewel','Bijouterie',4,3,70000,'bijouterie','vendeur',{ticket:640,cr:.5,svc:12,visit:0.026,draw:.05,security:.04,sign:'#b8962e'}),
 SH('sh_cinema','Cinéma',8,6,150000,'cinema','vendeur',{ticket:48,cr:.15,svc:45,slots:30,inside:true,visit:0.22,draw:.35,serves:{fatigue:90},power:600,sign:'#1c1c2a'}));
// équipements de la galerie : amenity = utilisés par les clients (serves : besoins comblés, use : durée, hide : on n'y voit plus le client, sale : petite vente)
const GA=(id,name,w,d,h,price,ex)=>({id,tab:'galerie',name,w,d,h,price,zone:0,lic:'galerie',kind:'amenity',slots:1,use:4,...ex});
ITEMS.push(
 GA('bench','Banc',2,1,.8,400,{wait:8,serves:{fatigue:70},slots:2,use:7,sit:true}),
 GA('table','Table de terrasse',2,2,2.2,900,{wait:10,serves:{fatigue:80},slots:4,use:9,sit:true,attract:1}),
 GA('wc','Toilettes',3,2,2.4,12000,{wait:40,serves:{wc:100},slots:2,use:7,hide:true,power:40}),
 GA('water','Fontaine à eau',1,1,1.1,900,{wait:15,serves:{soif:50},use:2}),
 GA('vdrink','Distributeur de boissons',1,1,1.9,3200,{wait:20,serves:{soif:70},use:3,sale:2.8,cr:.3,power:80}),
 GA('vsnack','Distributeur de snacks',1,1,1.9,3200,{wait:20,serves:{faim:40},use:3,sale:3,cr:.35,power:70}),
 GA('playground','Aire de jeux',3,3,1.6,15000,{wait:10,serves:{fatigue:45},slots:4,use:12,sit:true,attract:10}),
 {id:'atm',tab:'galerie',name:'Distributeur de billets',w:1,d:1,h:1.9,price:8000,kind:'decor',zone:0,lic:'galerie',attract:4,power:30},
 {id:'planter',tab:'galerie',name:'Grand bac à arbre',w:2,d:2,h:3,price:1200,kind:'decor',zone:0,lic:'galerie',attract:4},
 {id:'mapboard',tab:'galerie',name:'Plan du centre',w:1,d:1,h:2,price:1500,kind:'decor',zone:0,lic:'galerie',attract:3,power:15},
 {id:'infodesk',tab:'galerie',name:'Accueil',w:3,d:1,h:1.1,price:6000,kind:'decor',zone:0,lic:'galerie',attract:4},
 {id:'pool',tab:'galerie',name:'Fontaine décorative',w:3,d:3,h:1.2,price:9000,kind:'decor',zone:0,lic:'galerie',attract:8,power:40},
 {id:'charger',tab:'galerie',name:'Borne de recharge',w:1,d:1,h:1.3,price:2500,kind:'decor',zone:0,lic:'galerie',attract:2,power:20},
 {id:'recycle',tab:'galerie',name:'Poubelles de tri',w:2,d:1,h:1,price:300,kind:'decor',zone:0,lic:'galerie',clean:2});
export const ITEM=Object.fromEntries(ITEMS.map(i=>[i.id,i]));
// besoins des clients (actifs dès la licence Galerie ou une boutique) : départ aléatoire jusqu'à start, hausse par seconde passée dans le centre,
// au-delà de th le client cherche de quoi y répondre ; pen : satisfaction perdue s'il ne trouve rien
export const NEEDS={keys:['faim','soif','wc','fatigue'],start:{faim:78,soif:78,wc:65,fatigue:40},rate:{faim:1.1,soif:1.5,wc:1.2,fatigue:.75},th:70,pen:{faim:5,soif:4,wc:9,fatigue:3},icon:{faim:'🍴',soif:'💧',wc:'🚻',fatigue:'💺'},name:{faim:'faim',soif:'soif',wc:'toilettes',fatigue:'fatigue'}};
export const MAX_CUSTOMERS=1000;   // plafond de clients par jour (au-delà, le centre ne grossit plus en monde mais en paniers)
export const TABS=[['rayons','Rayons'],['frais','Frais'],['coupe','À la coupe'],['caisses','Caisses'],['reserve','Réserve'],['parking','Extérieur'],['murs','Murs'],['deco','Déco'],['agrandir','Agrandir'],['special','Spécialisés'],['boutiques','Boutiques'],['galerie','Galerie'],['licences','Licences']];
export const ENTRANCE_COST=2500;
export const BARRIER_COST=60,FLOW_COST=20;
export const TOOLS=[
 {id:'wall',name:'Mur',price:WALL_COST,hint:'Touche le début puis la fin du mur.'},
 {id:'door',name:'Porte',price:DOOR_COST,hint:'Touche un mur pour y mettre une porte (employés seulement vers la réserve).'},
 {id:'entrance',name:'Entrée',price:ENTRANCE_COST,hint:'Touche le bord du magasin, côté intérieur : une entrée de 2 cases s’ouvre vers l’extérieur. Touche ensuite une entrée (sans outil) pour la régler en entrée, sortie ou les deux.'},
 {id:'barrier',name:'Barrière',price:BARRIER_COST,hint:'Trace une ligne de barrières : les clients ne passent pas. Pour guider une file ou fermer un passage, dedans comme dehors.'},
 {id:'flow',name:'Sens de passage',price:FLOW_COST,hint:'Glisse le doigt dans le sens de marche : flèches au sol, les clients ne vont pas à contre-sens.'},
 {id:'zoneR',name:'Zone réserve',price:0,hint:'Touche deux coins : les clients n’y entrent pas.'},
 {id:'zoneS',name:'Zone magasin',price:0,hint:'Touche deux coins pour rendre la zone aux clients.'},
 {id:'erase',name:'Démolir',price:0,hint:'Touche un meuble ou un mur : il est revendu à moitié prix.'}
];

// Employés : coût employeur mensuel (charges comprises).
export const ROLES=[
 {id:'caissier',   name:'Caissier·ère',     salary:1920,desc:'Tient une caisse.'},
 {id:'rayon',      name:'Employé·e de rayon',salary:1840,desc:'Met en rayon depuis la réserve.'},
 {id:'menage',     name:'Agent d’entretien', salary:1680,desc:'Nettoie le magasin.'},
 {id:'boucher',    name:'Boucher·ère',      salary:2560,desc:'Tient la boucherie.',needs:'butcher'},
 {id:'poissonnier',name:'Poissonnier·ère',  salary:2480,desc:'Tient la poissonnerie.',needs:'fish'},
 {id:'fromager',   name:'Fromager·ère',     salary:2320,desc:'Tient la fromagerie.',needs:'cheese'},
 {id:'boulanger',  name:'Boulanger·ère',    salary:2400,desc:'Tient le fournil.',needs:'bakery'},
 {id:'vendeur',    name:'Vendeur·se',       salary:1900,desc:'Tient une boutique.',needs:['sh_bakery','sh_florist','sh_fashion','sh_perfume','sh_pharma','sh_optic','sh_tech','sh_jewel','sh_cinema']},
 {id:'serveur',    name:'Serveur·se',       salary:1850,desc:'Tient un café, un glacier ou un snack.',needs:['sh_cafe','sh_glacier','sh_snack']},
 {id:'cuisinier',  name:'Cuisinier·ère',    salary:2600,desc:'Tient le restaurant.',needs:['sh_resto']},
 {id:'coiffeur',   name:'Coiffeur·se',      salary:2100,desc:'Tient le salon de coiffure.',needs:['sh_hair']},
 {id:'vigile',     name:'Agent de sécurité',salary:2200,desc:'Moins de vols dans le centre.',lic:'galerie',security:.12}
];
export const ROLE=Object.fromEntries(ROLES.map(r=>[r.id,r]));

export const ADS=[
 {id:'flyer',name:'Prospectus',price:3000,boost:.25,days:7},
 {id:'radio',name:'Radio locale',price:9000,boost:.45,days:10}
];
export const EXTRA_LOAN={amount:100000,monthly:1110};

// Clients : affluence par heure d'ouverture (8 h → 19 h).
export const HOUR_CURVE=[.5,.7,.9,1.1,1.4,1.2,.9,.8,.9,1.2,1.5,1.0];
export const CUSTOMER={speed:2.6,pick:.7,serviceBase:.8,servicePerUnit:.1,selfFactor:1.5,theft:.02,patience:45};
export const TRAFFIC={carShare:.85,busShare:.1,noParkLeave:.35,busEvery:.5,busMax:12,carSpeed:5,busSpeed:7,carExtra:3};
export const STAFF={speed:2.4,carton:40,nightPerStocker:700,handle:1.2,needAt:1};
