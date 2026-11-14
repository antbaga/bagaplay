// Massilia Biz : données du jeu (plateau, cartes, personnages). Chaque texte existe en français et en anglais : [fr, en].
export const START_MONEY=1500,GO_SALARY=200,JAIL_FINE=50,JAIL=10,GOTO_JAIL=30;
export const GROUPS={
 brown:{color:'#9a6141',house:50},sky:{color:'#7ccdf0',house:50},pink:{color:'#e9579a',house:100},orange:{color:'#f39a33',house:100},
 red:{color:'#e2453c',house:150},yellow:{color:'#f4cf2d',house:150},green:{color:'#36a35e',house:200},blue:{color:'#2f5fb3',house:200}};
const P=(name,g,price,tag,icon)=>({t:'prop',name,g,price,tag,icon});
export const SQUARES=[
 {t:'go',name:['Départ','Start'],tag:['Le Vieux-Port : on part d’ici, on revient toujours ici. +200 € à chaque passage.','The Old Port: everything starts here, and everyone comes back. +€200 each time you pass.'],icon:'⚓'},
 P(['Noailles','Noailles'],'brown',60,['Le ventre de Marseille : épices, embrouilles et bonnes affaires.','The belly of Marseille: spices, squabbles and bargains.'],'🌶️'),
 {t:'card',deck:'tchatche',name:['Tchatche','Gossip'],icon:'💬'},
 P(['La Belle de Mai','La Belle de Mai'],'brown',60,['Friche artistique : ici, même les murs ont un avis.','Art squat territory: even the walls have an opinion.'],'🎨'),
 {t:'tax',amount:200,name:['Impôts locaux','Local taxes'],tag:['Pour refaire le trottoir. Un jour. Peut-être.','To fix the pavement. One day. Maybe.'],icon:'🧾'},
 {t:'station',name:['Gare Saint-Charles','Saint-Charles Station'],price:200,tag:['L’escalier monumental : on arrive à Marseille déjà essoufflé.','The giant staircase: you reach Marseille already out of breath.'],icon:'🚆'},
 P(['Le Panier','Le Panier'],'sky',100,['Ruelles, linge aux fenêtres et mamés qui savent tout sur tout le monde.','Alleys, laundry at the windows and grannies who know everything about everyone.'],'🧺'),
 {t:'card',deck:'mistral',name:['Coup de Mistral','Mistral Gust'],icon:'🌬️'},
 P(['L’Estaque','L’Estaque'],'sky',100,['Des chichis-fregis et une vue que Cézanne a déjà peinte, merci.','Fried dough sticks and a view Cézanne already painted, thanks.'],'🍩'),
 P(['La Plaine','La Plaine'],'sky',120,['Le marché : on y trouve de tout, surtout ce qu’on ne cherchait pas.','The market: you find everything, mostly what you weren’t looking for.'],'🛍️'),
 {t:'jail',name:['Les Baumettes','Les Baumettes'],tag:['Simple visite… ou séjour prolongé.','Just visiting… or staying a while.'],icon:'🚔'},
 P(['Cours Julien','Cours Julien'],'pink',140,['Tags, terrasses et artistes qui se mettent au travail… demain.','Graffiti, terraces and artists who’ll start working… tomorrow.'],'🖌️'),
 {t:'util',name:['La Savonnerie','The Soap Factory'],price:150,tag:['Le vrai savon de Marseille : 72 % d’huile, 100 % de fierté.','Real Marseille soap: 72% oil, 100% pride.'],icon:'🧼'},
 P(['La Canebière','La Canebière'],'pink',140,['La plus belle avenue du monde. C’est un Marseillais qui le dit.','The most beautiful avenue in the world. Says a local.'],'🏛️'),
 P(['Rue de la République','Rue de la République'],'pink',160,['Des façades haussmanniennes : Paris, mais avec du soleil.','Haussmann-style buildings: like Paris, but with sunshine.'],'🏢'),
 {t:'station',name:['Métro ligne 2','Metro Line 2'],price:200,tag:['Rapide et moderne. Quand il roule.','Fast and modern. When it runs.'],icon:'🚇'},
 P(['Castellane','Castellane'],'orange',180,['Le rond-point où le clignotant est en option.','The roundabout where indicators are optional.'],'⛲'),
 {t:'card',deck:'tchatche',name:['Tchatche','Gossip'],icon:'💬'},
 P(['Le Vélodrome','The Vélodrome'],'orange',180,['67 000 sélectionneurs bénévoles chaque week-end.','67,000 volunteer team managers every weekend.'],'⚽'),
 P(['Le Prado','Le Prado'],'orange',200,['Plages, rollers et gens qui font semblant de courir.','Beaches, rollerblades and people pretending to jog.'],'🏖️'),
 {t:'park',name:['Pause pastis','Pastis Break'],tag:['On se pose, on refait le monde. Rien ne se passe, et c’est parfait.','Sit down, put the world to rights. Nothing happens, and that’s perfect.'],icon:'🥃'},
 P(['Vallon des Auffes','Vallon des Auffes'],'red',220,['Un port de poche : trois barques et mille photos.','A pocket-sized harbour: three boats, a thousand photos.'],'🚣'),
 {t:'card',deck:'mistral',name:['Coup de Mistral','Mistral Gust'],icon:'🌬️'},
 P(['Malmousque','Malmousque'],'red',220,['Les rochers où l’on plonge pour impressionner la galerie.','The rocks where you dive to impress the crowd.'],'🤿'),
 P(['La Corniche','La Corniche'],'red',240,['Le plus long banc du monde : on regarde la mer… et surtout les autres.','The world’s longest bench: you watch the sea… and mostly everyone else.'],'🌅'),
 {t:'station',name:['Le Ferry-Boat','The Ferry Boat'],price:200,tag:['La plus courte traversée du monde : 283 mètres d’aventure.','The shortest crossing in the world: 283 metres of adventure.'],icon:'⛴️'},
 P(['La Pointe Rouge','La Pointe Rouge'],'yellow',260,['Planche à voile, glaces et coups de soleil garantis.','Windsurfing, ice cream and guaranteed sunburn.'],'🍦'),
 P(['Les Goudes','Les Goudes'],'yellow',260,['Le bout du monde, à 20 minutes du centre (2 heures en été).','The end of the world, 20 minutes from downtown (2 hours in summer).'],'🎣'),
 {t:'util',name:['Le Mistral','The Mistral'],price:150,tag:['Énergie gratuite et illimitée. Mais elle décoiffe.','Free, unlimited energy. Messes up your hair, though.'],icon:'🌀'},
 P(['Le Roucas-Blanc','Le Roucas-Blanc'],'yellow',280,['Villas avec vue : ici, même le mistral sonne avant d’entrer.','Villas with a view: even the mistral rings the bell before coming in.'],'🏡'),
 {t:'gotojail',name:['Garde à vue','Busted!'],tag:['« C’est un malentendu, monsieur l’agent ! » Direction les Baumettes.','“It’s a misunderstanding, officer!” Straight to Les Baumettes.'],icon:'👮'},
 P(['Sormiou','Sormiou'],'green',300,['Calanque de rêve : le parking est plus dur à trouver que la plage.','Dream cove: finding a parking spot is harder than finding the beach.'],'🏞️'),
 P(['Le Pharo','Le Pharo'],'green',300,['Un palais avec vue sur le port : impérial, peuchère.','A palace overlooking the port: imperial, my dear.'],'🏰'),
 {t:'card',deck:'tchatche',name:['Tchatche','Gossip'],icon:'💬'},
 P(['Rue Paradis','Rue Paradis'],'green',320,['Boutiques chics : on paie même pour regarder.','Fancy shops: you pay just to look.'],'💎'),
 {t:'station',name:['Navette Marignane','Airport Shuttle'],price:200,tag:['Pour accueillir les touristes… et leur expliquer la vie.','To welcome the tourists… and explain how life works here.'],icon:'✈️'},
 {t:'card',deck:'mistral',name:['Coup de Mistral','Mistral Gust'],icon:'🌬️'},
 P(['Le Vieux-Port','The Old Port'],'blue',350,['Des poissonnières qui crient plus fort que toi. Et elles ont raison.','Fishmongers who shout louder than you. And they’re right.'],'🐟'),
 {t:'tax',amount:100,name:['Amende double file','Double-parking fine'],tag:['« Deux minutes, je reviens ! » Deux heures plus tard…','“Back in two minutes!” Two hours later…'],icon:'🚗'},
 P(['La Bonne Mère','La Bonne Mère'],'blue',400,['Elle veille sur la ville. Et sur ton loyer.','She watches over the city. And over your rent.'],'⛪')];

// cartes : effet + texte
const C=(fr,en,act)=>({text:[fr,en],act});
export const DECKS={
 mistral:[
  C('Le mistral emporte ton linge jusqu’à l’Estaque. Va le chercher.','The mistral blows your laundry all the way to L’Estaque. Go and fetch it.',{move:8}),
  C('La sardine a encore bouché le port. Recule de 3 cases.','The sardine has blocked the port again. Go back 3 spaces.',{rel:-3}),
  C('Tu racontes que tu as pêché un thon de 300 kg. Personne ne te croit, mais on t’offre l’apéro : reçois 50 €.','You claim you caught a 300 kg tuna. Nobody believes you, but they buy you a drink: collect €50.',{money:50}),
  C('L’OM a gagné ! Tout le monde est de bonne humeur : chaque joueur te donne 20 €.','OM won! Everyone’s in a good mood: each player gives you €20.',{each:20}),
  C('Garé en triple file « deux minutes ». Fourrière : paie 60 €.','Triple-parked “for two minutes”. Tow truck: pay €60.',{money:-60}),
  C('Tu dis à la police que tu « connais quelqu’un ». Garde à vue !','You tell the police you “know someone”. Busted!',{jail:true}),
  C('Carte « Je connais quelqu’un » : tu sors de garde à vue gratuitement. À garder.','“I know someone” card: get out of Les Baumettes for free. Keep it.',{jailCard:true}),
  C('Retour au Vieux-Port pour l’aïoli de mamé : avance jusqu’au Départ.','Back to the Old Port for granny’s aioli: advance to Start.',{move:0}),
  C('Le TER a une heure de retard : prends la gare la plus proche, tu arriveras avant lui.','The train is an hour late: go to the nearest station, you’ll still beat it.',{nearest:'station'}),
  C('Ton cabanon au Frioul s’écroule : paie 25 € par cabanon et 100 € par villa.','Your beach hut on Frioul collapses: pay €25 per hut and €100 per villa.',{repairs:[25,100]}),
  C('Tu vends des « vraies » lunettes de marque au marché : reçois 100 €.','You sell “genuine” designer sunglasses at the market: collect €100.',{money:100}),
  C('Le métro est en grève : recule jusqu’à la Gare Saint-Charles.','The metro is on strike: go back to Saint-Charles Station.',{move:5,back:true}),
  C('Concours de pétanque : tu as tiré… sur le pied d’un touriste. Paie 50 €.','Pétanque contest: you shot… a tourist’s foot. Pay €50.',{money:-50}),
  C('Ton cousin a « trouvé » des places pour le match : reçois 150 €.','Your cousin “found” tickets for the match: collect €150.',{money:150}),
  C('Grosse envie de bouillabaisse : file sur la Corniche.','Craving bouillabaisse: head to La Corniche.',{move:24}),
  C('Le mistral te pousse dans le dos : avance jusqu’à La Bonne Mère.','The mistral pushes you along: advance to La Bonne Mère.',{move:39})],
 tchatche:[
  C('Ta mamé te glisse un billet « pour t’acheter des chocolats » : reçois 50 €.','Your granny slips you a note “to buy some sweets”: collect €50.',{money:50}),
  C('Tu as dit du bien de Paris en public. Paie 100 € pour te faire pardonner.','You said something nice about Paris in public. Pay €100 to be forgiven.',{money:-100}),
  C('Erreur de la banque en ta faveur (ton cousin y travaille) : reçois 200 €.','Bank error in your favour (your cousin works there): collect €200.',{money:200}),
  C('C’est ton anniversaire : chaque joueur te donne 10 € et trois bises.','It’s your birthday: each player gives you €10 and three kisses on the cheek.',{each:10}),
  C('Chez le médecin : « C’est le mistral, ça va passer. » Paie 50 €.','At the doctor’s: “It’s the mistral, it’ll pass.” Pay €50.',{money:-50}),
  C('Tu gagnes le concours de la plus grosse exagération du quartier : reçois 20 €.','You win the neighbourhood’s biggest exaggeration contest: collect €20.',{money:20}),
  C('Ton pointu prend l’eau : paie 100 € de réparations.','Your little fishing boat is leaking: pay €100 for repairs.',{money:-100}),
  C('Tu revends ta collection d’écharpes de l’OM : reçois 100 €.','You sell your OM scarf collection: collect €100.',{money:100}),
  C('Ton scooter est retrouvé au fond du Vieux-Port, tout propre : reçois 25 €.','Your scooter is found at the bottom of the Old Port, spotless: collect €25.',{money:25}),
  C('« C’est un malentendu, monsieur l’agent ! » Tu sors de garde à vue gratuitement. À garder.','“It’s a misunderstanding, officer!” Get out of Les Baumettes for free. Keep it.',{jailCard:true}),
  C('Tu as klaxonné au feu vert pendant dix minutes. Garde à vue !','You honked at a green light for ten minutes. Busted!',{jail:true}),
  C('Loto du quartier : tu gagnes 100 €.','Neighbourhood bingo: you win €100.',{money:100}),
  C('Fête des voisins au Panier : tu offres le pastis à tout le monde. Paie 15 € à chaque joueur.','Street party in Le Panier: drinks are on you. Pay each player €15.',{each:-15}),
  C('Tu héberges ton cousin « pour deux jours » depuis trois mois : paie 50 €.','Your cousin has been staying “for two days” for three months: pay €50.',{money:-50}),
  C('Taxe foncière sur tes cabanons : paie 40 € par cabanon et 115 € par villa.','Property tax on your huts: pay €40 per hut and €115 per villa.',{repairs:[40,115]}),
  C('Le Vieux-Port fête ta victoire au concours de boules : avance jusqu’au Départ.','The Old Port celebrates your pétanque win: advance to Start.',{move:0})]};

export const TOKENS=[
 {id:'sardine',name:['La sardine','The sardine'],color:'#5aa9e6'},{id:'pastis',name:['Le pastis','The pastis'],color:'#f4cf2d'},
 {id:'boule',name:['La boule','The boule'],color:'#9aa3ad'},{id:'scooter',name:['Le scooter','The scooter'],color:'#e2453c'},
 {id:'pointu',name:['Le pointu','The fishing boat'],color:'#36a35e'},{id:'savon',name:['Le savon','The soap'],color:'#c58bf0'}];

// adversaires de l'ordinateur : chacun son caractère et ses répliques
export const CHARACTERS=[
 {name:'Momo du Panier',style:'malin',lines:{
  buy:[['Celle-là, je la gardais pour mon cousin.','I was saving that one for my cousin.'],['Ça, c’est un placement, tu peux pas comprendre.','That’s an investment, you wouldn’t understand.']],
  rent:[['Merci, ça paiera l’apéro.','Thanks, that’ll cover the drinks.'],['Tu reviens quand tu veux, hein !','Come back anytime!']],
  pay:[['Oh, tu me fends le cœur.','Oh, you’re breaking my heart.'],['Je te paie, mais c’est bien parce que c’est toi.','I’ll pay, but only because it’s you.']],
  jail:[['C’est un malentendu !','It’s a misunderstanding!']],double:[['Oh, fan de chichourle !','Well, I’ll be!']],broke:[['Peuchère… j’avais tout misé sur le cousin.','Oh dear… I bet it all on my cousin.']]}},
 {name:'Tatie Josette',style:'prudente',lines:{
  buy:[['Je l’achète pour mes petits-enfants.','I’m buying it for my grandchildren.'],['À mon âge, on prend ce qu’on trouve.','At my age, you take what you can get.']],
  rent:[['Tu as mangé au moins ? Bon, tu paies quand même.','Have you eaten, dear? Anyway, you still pay.'],['Range ton argent, je plaisante… Non, donne.','Put your money away, I’m joking… No, hand it over.']],
  pay:[['De mon temps, c’était moins cher.','In my day, it was cheaper.'],['Je vais le dire à ta mère.','I’m telling your mother.']],
  jail:[['À mon âge ? Quelle honte !','At my age? The shame!']],double:[['Oh, la chance !','Oh, lucky me!']],broke:[['Bon, je retourne à mes mots croisés.','Right, back to my crosswords.']]}},
 {name:'Kevin le Minot',style:'fonceur',lines:{
  buy:[['Wesh, c’est à moi maintenant.','Yo, it’s mine now.'],['Ça va être trop stylé ici.','It’s gonna be so cool here.']],
  rent:[['Merci frérot !','Cheers, bro!'],['Allez, aboule la monnaie !','Come on, hand over the cash!']],
  pay:[['Sérieux ? C’est du vol.','Seriously? That’s robbery.'],['Je te le rends dimanche, promis.','I’ll pay you back Sunday, promise.']],
  jail:[['J’ai rien fait, je passais !','I didn’t do anything, I was just passing by!']],double:[['Trop fort !','Too good!']],broke:[['J’arrête, c’est truqué.','I quit, it’s rigged.']]}},
 {name:'Fanny la poissonnière',style:'équilibrée',lines:{
  buy:[['Elle est fraîche, celle-là, je la prends !','That one’s fresh, I’ll take it!'],['Allez, mets-moi ça de côté.','Go on, put that aside for me.']],
  rent:[['Ça fait 120, mais pour toi c’est 120.','That’s 120, but for you it’s 120.'],['Merci mon beau, à la revoyure !','Thanks, love, see you soon!']],
  pay:[['Tu me prends pour une sardine ?','Do you take me for a sardine?'],['C’est plus cher que le loup de ligne !','That’s pricier than line-caught sea bass!']],
  jail:[['Laissez-moi, j’ai la marée qui m’attend !','Let me go, the tide is waiting!']],double:[['Et hop, coup double !','And hop, double!']],broke:[['Plus un sou… même pas pour une sardine.','Not a penny left… not even for a sardine.']]}},
 {name:'Le Grand Robert',style:'joueur',lines:{
  buy:[['Président du club de boules, et maintenant propriétaire.','Pétanque club president, and now landlord.'],['Je pointe, je tire, j’achète.','I point, I shoot, I buy.']],
  rent:[['Ça, c’est un carreau !','Now that’s a perfect shot!'],['Mène gagnée !','Round won!']],
  pay:[['Je conteste, il y a mesure !','I dispute that, let’s measure!'],['Oh, c’est pas fini, ça.','Oh, this isn’t over.']],
  jail:[['Je demande l’arbitre !','I want the referee!']],double:[['Fanny pour les autres !','Shut-out for everyone else!']],broke:[['J’ai fait Fanny… et pas la poissonnière.','I lost 13–0… and not in a good way.']]}}];
export const HUMAN_LINES={go:[['Tranquille, le bénéf’.','Easy money.']],double:[['Double ! On rejoue.','Doubles! Roll again.']]};

// petits commentaires du narrateur
export const QUIPS={
 go:[['Passage au Départ : +200 €. Le Vieux-Port te salue.','Passing Start: +€200. The Old Port says hi.']],
 park:[['Pause pastis. On ne bouge plus, on profite.','Pastis break. Nobody moves, just enjoy.']],
 visit:[['Simple visite aux Baumettes. On fait coucou et on repart.','Just visiting Les Baumettes. Wave and move on.']],
 three:[['Trois doubles d’affilée ? C’est louche. Garde à vue !','Three doubles in a row? Suspicious. Busted!']]};
