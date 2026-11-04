// BagaStore : catalogues et constantes d'équilibrage.
// 1 case = 1 m. Prix en euros. Les prix d'achat des produits sont des prix moyens « par article ».

// Terrain et bâtiment de départ (grosse supérette de 400 m², façade au sud, réserve au nord).
// terrain : 80 × 76 m. La route principale (2 × 3 voies) traverse le terrain, on construit des deux côtés.
export const LOT_W=80,LOT_H=76,ROAD={y:45,h:6};
export const START={x0:20,y0:18,x1:40,y1:38,entrance:29,reserveRows:5,cash:140000,starterCash:100000,loan:420000,loanMonthly:2900,rep:50};
export const EXTEND={perM2:900,margin:2};
export const HOURS={start:6,open:8,close:20,realSecPerHour:20};   // 6 h–8 h : livraison et mise en place avant l'ouverture       // 12 h d'ouverture = 4 min en ×1
export const DAYS_PER_MONTH=30;
export const BANKRUPTCY=-40000;
export const WALL_COST=150,DOOR_COST=450,REFUND=0.5;
export const SPEEDS=[1,2,4,8];

// Rayons de produits. store : où on les stocke en réserve. fix : type de meuble de vente.
// cost : prix d'achat moyen d'un article. ref : marge « normale » (au-delà, les clients achètent moins).
// demand : poids dans les listes de courses. loss : part du stock perdue par nuit (périmé, invendus).
export const CATS=[
 {id:'fruits',   name:'Fruits & légumes',  store:'frais',   cost:1.6, ref:35, demand:14, loss:.05,  color:[[.86,.25,.2],[.45,.72,.26],[.98,.6,.15]]},
 {id:'pain',     name:'Pain & viennoiseries',store:'ambiant',cost:0.6,ref:60, demand:9,  loss:.35,  color:[[.86,.62,.33],[.76,.5,.25]]},
 {id:'cremerie', name:'Crèmerie',          store:'frais',   cost:1.3, ref:25, demand:14, loss:.015, color:[[.96,.96,.92],[.35,.55,.85]]},
 {id:'traiteur', name:'Traiteur',          store:'frais',   cost:3.2, ref:30, demand:7,  loss:.04,  color:[[.95,.75,.35],[.7,.85,.55]]},
 {id:'viande',   name:'Viande',            store:'frais',   cost:6.5, ref:28, demand:10, loss:.03,  color:[[.78,.2,.22],[.92,.45,.45]]},
 {id:'poisson',  name:'Poisson',           store:'frais',   cost:7.5, ref:30, demand:5,  loss:.06,  color:[[.7,.8,.88],[.95,.6,.45]]},
 {id:'fromage',  name:'Fromages',          store:'frais',   cost:3.8, ref:30, demand:7,  loss:.01,  color:[[.98,.85,.35],[.95,.92,.7]]},
 {id:'surgeles', name:'Surgelés & glaces', store:'surgele', cost:2.6, ref:30, demand:8,  loss:.001, color:[[.6,.82,.95],[.95,.95,1],[.85,.4,.6]]},
 {id:'epicerie', name:'Épicerie salée',    store:'ambiant', cost:1.1, ref:28, demand:15, loss:.0005,color:[[.95,.55,.2],[.85,.25,.2],[.95,.85,.4]]},
 {id:'sucre',    name:'Biscuits & gâteaux',store:'ambiant', cost:1.5, ref:32, demand:10, loss:.001, color:[[.95,.6,.7],[.55,.35,.25],[.98,.8,.4]]},
 {id:'petitdej', name:'Petit-déjeuner',    store:'ambiant', cost:2.4, ref:28, demand:7,  loss:.001, color:[[.45,.3,.2],[.95,.8,.3]]},
 {id:'boissons', name:'Boissons',          store:'ambiant', cost:0.9, ref:30, demand:13, loss:.0005,color:[[.3,.65,.95],[.9,.25,.25],[.98,.75,.2]]},
 {id:'alcool',   name:'Vins & alcools',    store:'ambiant', cost:5.5, ref:30, demand:6,  loss:0,    color:[[.45,.12,.2],[.2,.4,.25]],theft:2.5},
 {id:'hygiene',  name:'Hygiène & beauté',  store:'ambiant', cost:2.8, ref:35, demand:6,  loss:0,    color:[[.85,.7,.95],[.6,.85,.85]],theft:2},
 {id:'entretien',name:'Entretien & maison',store:'ambiant', cost:2.5, ref:30, demand:5,  loss:0,    color:[[.3,.6,.9],[.4,.8,.5]]}
];
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
 {id:'corral', tab:'parking', name:'Abri à caddies',       w:2,d:1,h:1.2,price:1500, kind:'corral',zone:2,cap:15},
 {id:'plant',  tab:'deco',    name:'Plante',               w:1,d:1,h:1.2,price:90,   kind:'decor',zone:0,attract:1},
 {id:'lamp',   tab:'deco',    name:'Éclairage d’ambiance', w:1,d:1,h:2.2,price:300,  kind:'decor',zone:0,attract:2,power:12},
 {id:'bin',    tab:'deco',    name:'Poubelle',             w:1,d:1,h:0.8,price:60,   kind:'decor',zone:0,clean:1},
 {id:'camera', tab:'deco',    name:'Caméra',               w:1,d:1,h:2.6,price:1400, kind:'decor',zone:0,security:.07,power:8},
 {id:'gate',   tab:'deco',    name:'Portique antivol',     w:1,d:1,h:1.6,price:3200, kind:'decor',zone:0,security:.2,power:10}
];
export const ITEM=Object.fromEntries(ITEMS.map(i=>[i.id,i]));
export const TABS=[['rayons','Rayons'],['frais','Frais'],['coupe','À la coupe'],['caisses','Caisses'],['reserve','Réserve'],['parking','Extérieur'],['murs','Murs'],['deco','Déco'],['agrandir','Agrandir']];
export const TOOLS=[
 {id:'wall',name:'Mur',price:WALL_COST,hint:'Touche le début puis la fin du mur.'},
 {id:'door',name:'Porte',price:DOOR_COST,hint:'Touche un mur pour y mettre une porte (employés seulement vers la réserve).'},
 {id:'zoneR',name:'Zone réserve',price:0,hint:'Touche deux coins : les clients n’y entrent pas.'},
 {id:'zoneS',name:'Zone magasin',price:0,hint:'Touche deux coins pour rendre la zone aux clients.'},
 {id:'erase',name:'Démolir',price:0,hint:'Touche un meuble ou un mur : il est revendu à moitié prix.'}
];

// Employés : coût employeur mensuel (charges comprises).
export const ROLES=[
 {id:'caissier',   name:'Caissier·ère',     salary:2400,desc:'Tient une caisse.'},
 {id:'rayon',      name:'Employé·e de rayon',salary:2300,desc:'Met en rayon depuis la réserve.'},
 {id:'menage',     name:'Agent d’entretien', salary:2100,desc:'Nettoie le magasin.'},
 {id:'boucher',    name:'Boucher·ère',      salary:3200,desc:'Tient la boucherie.',needs:'butcher'},
 {id:'poissonnier',name:'Poissonnier·ère',  salary:3100,desc:'Tient la poissonnerie.',needs:'fish'},
 {id:'fromager',   name:'Fromager·ère',     salary:2900,desc:'Tient la fromagerie.',needs:'cheese'},
 {id:'boulanger',  name:'Boulanger·ère',    salary:3000,desc:'Tient le fournil.',needs:'bakery'}
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
export const TRAFFIC={carShare:.5,busShare:.25,busEvery:.5,busMax:12,carSpeed:5,busSpeed:7,carExtra:3};
export const STAFF={speed:2.4,carton:40,nightPerStocker:700,handle:1.2};
