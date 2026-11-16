// BagaWorld : données du jeu (classes, sorts, monstres, objets, quêtes, PNJ). Textes [fr, en].
// Inspiré des mécaniques de Dofus : PA / PM, éléments liés aux caractéristiques, ligne de vue, tacle et fuite,
// sorts avec portée, zone, relances et délais, équipement à bonus, panoplies de mobs, quêtes de PNJ.

export const MAX_LVL=50;
export const xpFor=l=>l<=1?0:Math.floor(40*Math.pow(l-1,2.15)); // xp totale pour atteindre le niveau l
export const levelOf=xp=>{let l=1;while(l<MAX_LVL&&xp>=xpFor(l+1))l++;return l};
export const EL={earth:{fr:'Terre',en:'Earth',stat:'str',col:'#a0703c',ic:'⛰️'},fire:{fr:'Feu',en:'Fire',stat:'int',col:'#e2542d',ic:'🔥'},
 water:{fr:'Eau',en:'Water',stat:'cha',col:'#3a8fd9',ic:'💧'},air:{fr:'Air',en:'Air',stat:'agi',col:'#5fbf6a',ic:'🌪️'},neutral:{fr:'Neutre',en:'Neutral',stat:'str',col:'#9a9a9a',ic:'⚪'}};
export const STATS={vit:{fr:'Vitalité',en:'Vitality',ic:'❤️'},wis:{fr:'Sagesse',en:'Wisdom',ic:'🦉'},str:{fr:'Force',en:'Strength',ic:'⛰️'},
 int:{fr:'Intelligence',en:'Intelligence',ic:'🔥'},cha:{fr:'Chance',en:'Chance',ic:'💧'},agi:{fr:'Agilité',en:'Agility',ic:'🌪️'},
 pa:{fr:'PA',en:'AP',ic:'⭐'},pm:{fr:'PM',en:'MP',ic:'👟'},range:{fr:'Portée',en:'Range',ic:'🎯'},power:{fr:'Puissance',en:'Power',ic:'💪'},
 init:{fr:'Initiative',en:'Initiative',ic:'⚡'},crit:{fr:'Coups critiques',en:'Critical hits',ic:'💥'},heal:{fr:'Soins',en:'Heals',ic:'💚'},res:{fr:'Résistance',en:'Resistance',ic:'🛡️'}};

// ---- classes (et leurs sorts, débloqués au fil des niveaux)
export const CLASSES={
 bourrin:{fr:'Bourrin',en:'Brute',col:'#d9483b',col2:'#f2c14e',main:'str',ic:'🗡️',hp:60,
  desc:['Tape d’abord, réfléchit jamais. Spécialiste du corps à corps et du saut dans la mêlée.','Hits first, never thinks. Melee specialist who jumps into the fray.']},
 viseur:{fr:'Viseur',en:'Marksman',col:'#3e8f4e',col2:'#c9a46a',main:'agi',ic:'🏹',hp:52,
  desc:['Tire de loin, très loin. Repousse, enflamme, et râle quand on vient au contact.','Shoots from afar, very far. Pushes, burns, and complains when you get close.']},
 bisou:{fr:'Bisouilleur',en:'Smoocher',col:'#e86fae',col2:'#ffe0f0',main:'int',ic:'💋',hp:50,
  desc:['Soigne ses amis à coups de mots doux, blesse les autres avec des mots qui piquent.','Heals friends with sweet words, hurts the others with stinging ones.']},
 fourbe:{fr:'Fourbe',en:'Sneak',col:'#4b3f6b',col2:'#9fd36b',main:'agi',ic:'🗝️',hp:50,
  desc:['Pièges, poison et invisibilité. Jamais là où on l’attend.','Traps, poison and invisibility. Never where you expect.']}};

// cible : enemy | ally | any | empty (case libre) | self ; zone : cell | cross | circle | line | ring (r)
export const SPELLS={
 // Bourrin
 pression:{cls:'bourrin',lvl:1,fr:'Pression',en:'Pressure',ic:'👊',pa:3,range:[1,3],los:true,target:'enemy',perTurn:3,fx:[{t:'dmg',el:'earth',min:8,max:12}],d:['Une bonne pression sur la tête.','A good squeeze on the head.']},
 bond:{cls:'bourrin',lvl:1,fr:'Bond',en:'Leap',ic:'🦘',pa:4,range:[1,5],los:true,target:'empty',cd:2,fx:[{t:'tp'},{t:'dmgAround',el:'earth',min:4,max:6}],d:['Saute sur une case et écrase tout ce qui est autour.','Leaps onto a cell and squashes everything around.']},
 intimidation:{cls:'bourrin',lvl:3,fr:'Intimidation',en:'Intimidation',ic:'😠',pa:2,range:[1,1],target:'enemy',perTurn:2,fx:[{t:'dmg',el:'neutral',min:3,max:5},{t:'push',n:4}],d:['Un regard noir qui envoie valser.','A dirty look that sends them flying.']},
 tranchoir:{cls:'bourrin',lvl:6,fr:'Tranchoir',en:'Cleaver',ic:'🪓',pa:4,range:[1,4],line:true,los:true,target:'any',aoe:{s:'line',r:2},perTurn:2,fx:[{t:'dmg',el:'fire',min:11,max:15}],d:['Tranche en ligne droite, trois cases d’un coup.','Cuts in a straight line, three cells at once.']},
 puissance:{cls:'bourrin',lvl:10,fr:'Puissance',en:'Might',ic:'💪',pa:3,range:[0,0],target:'self',cd:5,fx:[{t:'buff',stat:'power',v:40,dur:3}],d:['+40 puissance pendant 3 tours. Les biceps brillent.','+40 power for 3 turns. Biceps glow.']},
 colere:{cls:'bourrin',lvl:15,fr:'Colère du Bourrin',en:'Brute’s Wrath',ic:'🌋',pa:6,range:[1,1],target:'enemy',cd:3,fx:[{t:'dmg',el:'earth',min:32,max:40}],d:['La colère d’un Bourrin à qui on a volé son goûter.','The wrath of a Brute whose snack was stolen.']},
 // Viseur
 fleche:{cls:'viseur',lvl:1,fr:'Flèche magique',en:'Magic Arrow',ic:'🏹',pa:3,range:[2,8],los:true,target:'enemy',perTurn:3,fx:[{t:'dmg',el:'air',min:7,max:10}],d:['Une flèche qui ne rate presque jamais.','An arrow that almost never misses.']},
 recul:{cls:'viseur',lvl:1,fr:'Flèche de recul',en:'Retreat Arrow',ic:'💨',pa:3,range:[1,6],line:true,los:true,target:'enemy',perTurn:2,fx:[{t:'dmg',el:'air',min:5,max:7},{t:'push',n:3}],d:['Repousse de 3 cases. Garde tes distances.','Pushes back 3 cells. Keep your distance.']},
 enflammee:{cls:'viseur',lvl:3,fr:'Flèche enflammée',en:'Flaming Arrow',ic:'🔥',pa:4,range:[2,7],los:true,line:true,target:'any',aoe:{s:'line',r:2},perTurn:2,fx:[{t:'dmg',el:'fire',min:10,max:13}],d:['Traverse trois cases et met le feu à tout ce qui passe.','Goes through three cells and burns everything in its way.']},
 eloigne:{cls:'viseur',lvl:6,fr:'Tir éloigné',en:'Long Shot',ic:'🔭',pa:2,range:[0,0],target:'self',cd:5,fx:[{t:'buff',stat:'range',v:3,dur:3}],d:['+3 portée pendant 3 tours.','+3 range for 3 turns.']},
 explosive:{cls:'viseur',lvl:10,fr:'Flèche explosive',en:'Explosive Arrow',ic:'💥',pa:5,range:[3,8],los:true,target:'any',aoe:{s:'circle',r:1},perTurn:1,fx:[{t:'dmg',el:'fire',min:13,max:17}],d:['Boum. Attention aux copains.','Boom. Mind your friends.']},
 paralysante:{cls:'viseur',lvl:15,fr:'Flèche paralysante',en:'Paralysing Arrow',ic:'🧊',pa:5,range:[2,6],los:true,target:'enemy',cd:2,fx:[{t:'dmg',el:'water',min:12,max:15},{t:'debuff',stat:'pa',v:2,dur:1}],d:['Retire 2 PA au prochain tour de la cible.','Removes 2 AP on the target’s next turn.']},
 // Bisouilleur
 blessant:{cls:'bisou',lvl:1,fr:'Mot blessant',en:'Hurtful Word',ic:'🗯️',pa:3,range:[1,5],los:true,target:'enemy',perTurn:3,fx:[{t:'dmg',el:'fire',min:7,max:10}],d:['« Ta mère elle a un abonnement à la salle. » Ça pique.','“Your mum has a gym membership.” Ouch.']},
 soignant:{cls:'bisou',lvl:1,fr:'Mot soignant',en:'Healing Word',ic:'💚',pa:3,range:[0,4],los:true,target:'ally',perTurn:2,fx:[{t:'heal',min:10,max:14}],d:['Un mot doux qui recolle les morceaux.','A sweet word that puts the pieces back together.']},
 stimulant:{cls:'bisou',lvl:3,fr:'Mot stimulant',en:'Stimulating Word',ic:'⭐',pa:2,range:[0,3],target:'ally',cd:4,fx:[{t:'buff',stat:'pa',v:2,dur:2}],d:['+2 PA à un allié pendant 2 tours. « Allez, t’es le meilleur ! »','+2 AP to an ally for 2 turns. “Come on, you’re the best!”']},
 interdit:{cls:'bisou',lvl:6,fr:'Mot interdit',en:'Forbidden Word',ic:'🤐',pa:4,range:[1,4],los:true,target:'enemy',perTurn:2,fx:[{t:'dmg',el:'water',min:9,max:12},{t:'debuff',stat:'pm',v:1,dur:2}],d:['Un gros mot qui coupe les jambes (−1 PM).','A swear word that cuts the legs (−1 MP).']},
 regen:{cls:'bisou',lvl:10,fr:'Mot de régénération',en:'Regeneration Word',ic:'🌿',pa:3,range:[0,5],target:'ally',cd:2,fx:[{t:'hot',v:9,dur:3}],d:['Soigne 9 PV par tour pendant 3 tours.','Heals 9 HP per turn for 3 turns.']},
 fracassant:{cls:'bisou',lvl:15,fr:'Mot fracassant',en:'Shattering Word',ic:'📢',pa:6,range:[1,5],los:true,target:'any',aoe:{s:'cross',r:2},cd:2,fx:[{t:'dmg',el:'fire',min:14,max:18,enemiesOnly:true},{t:'heal',min:6,max:8,alliesOnly:true}],d:['Crie si fort que les ennemis souffrent et les alliés se sentent mieux.','Shouts so loud that enemies suffer and allies feel better.']},
 // Fourbe
 sournoiserie:{cls:'fourbe',lvl:1,fr:'Sournoiserie',en:'Sneakiness',ic:'🗡️',pa:3,range:[1,2],los:true,target:'enemy',perTurn:3,fx:[{t:'dmg',el:'air',min:8,max:11}],d:['Un coup dans le dos, avec le sourire.','A stab in the back, with a smile.']},
 piege:{cls:'fourbe',lvl:1,fr:'Piège sournois',en:'Sneaky Trap',ic:'🪤',pa:3,range:[1,4],target:'empty',perTurn:2,fx:[{t:'trap',aoe:{s:'cross',r:1},fx:[{t:'dmg',el:'earth',min:10,max:13}]}],d:['Pose un piège invisible pour l’ennemi.','Sets a trap the enemy can’t see.']},
 poison:{cls:'fourbe',lvl:3,fr:'Poison paralysant',en:'Paralysing Poison',ic:'🧪',pa:4,range:[1,3],los:true,target:'enemy',cd:2,fx:[{t:'poison',el:'air',v:6,dur:3}],d:['6 dégâts Air par tour pendant 3 tours.','6 Air damage per turn for 3 turns.']},
 invisibilite:{cls:'fourbe',lvl:6,fr:'Invisibilité',en:'Invisibility',ic:'👻',pa:2,range:[0,0],target:'self',cd:6,fx:[{t:'invis',dur:2}],d:['Invisible 2 tours. Les ennemis tapent dans le vide.','Invisible for 2 turns. Enemies swing at nothing.']},
 coupfourre:{cls:'fourbe',lvl:10,fr:'Coup fourré',en:'Dirty Trick',ic:'🥷',pa:4,range:[1,1],target:'enemy',perTurn:2,fx:[{t:'dmg',el:'earth',min:15,max:19,invisBonus:50}],d:['+50 % de dégâts si tu es invisible.','+50% damage while invisible.']},
 piegemasse:{cls:'fourbe',lvl:15,fr:'Piège de masse',en:'Mass Trap',ic:'💣',pa:5,range:[1,5],target:'empty',cd:3,fx:[{t:'trap',aoe:{s:'circle',r:2},fx:[{t:'dmg',el:'fire',min:14,max:17}]}],d:['Un gros piège qui saute dans un grand rayon.','A big trap that blows up in a wide area.']},
 // ---- sorts des monstres
 coupdeboule:{mob:1,fr:'Coup de boule',en:'Headbutt',ic:'🐏',pa:3,range:[1,1],target:'enemy',perTurn:2,fx:[{t:'dmg',el:'earth',min:3,max:6}]},
 picorage:{mob:1,fr:'Picorage',en:'Pecking',ic:'🐤',pa:2,range:[1,1],target:'enemy',perTurn:3,fx:[{t:'dmg',el:'air',min:2,max:4}]},
 crachat:{mob:1,fr:'Crachat gluant',en:'Slimy Spit',ic:'🤢',pa:3,range:[1,4],los:true,target:'enemy',perTurn:2,fx:[{t:'dmg',el:'water',min:3,max:5}]},
 spores:{mob:1,fr:'Spores',en:'Spores',ic:'🍄',pa:4,range:[1,3],los:true,target:'any',aoe:{s:'cross',r:1},perTurn:1,fx:[{t:'dmg',el:'earth',min:4,max:6,enemiesOnly:true}]},
 champisoin:{mob:1,fr:'Champi-soin',en:'Mushroom Heal',ic:'💚',pa:3,range:[0,4],target:'ally',perTurn:1,fx:[{t:'heal',min:8,max:12}]},
 piqure:{mob:1,fr:'Piqûre',en:'Sting',ic:'🦟',pa:3,range:[1,4],los:true,target:'enemy',perTurn:2,fx:[{t:'dmg',el:'air',min:4,max:6},{t:'drain'}]},
 charge:{mob:1,fr:'Charge',en:'Charge',ic:'🐗',pa:4,range:[2,5],line:true,los:true,target:'enemy',perTurn:1,fx:[{t:'dash'},{t:'dmg',el:'earth',min:6,max:9}]},
 defense:{mob:1,fr:'Défense',en:'Tusk',ic:'🐗',pa:3,range:[1,1],target:'enemy',perTurn:1,fx:[{t:'dmg',el:'earth',min:5,max:7}]},
 toile:{mob:1,fr:'Toile',en:'Web',ic:'🕸️',pa:3,range:[1,5],los:true,target:'enemy',perTurn:1,fx:[{t:'dmg',el:'air',min:3,max:5},{t:'debuff',stat:'pm',v:2,dur:1}]},
 morsure:{mob:1,fr:'Morsure',en:'Bite',ic:'🕷️',pa:3,range:[1,1],target:'enemy',perTurn:2,fx:[{t:'poison',el:'earth',v:3,dur:2}]},
 pince:{mob:1,fr:'Pince',en:'Pinch',ic:'🦀',pa:3,range:[1,1],target:'enemy',perTurn:2,fx:[{t:'dmg',el:'water',min:4,max:7}]},
 carapace:{mob:1,fr:'Carapace',en:'Shell',ic:'🛡️',pa:2,range:[0,0],target:'self',cd:3,fx:[{t:'buff',stat:'res',v:30,dur:2}]},
 sporee:{mob:1,fr:'Nuage de spores',en:'Spore Cloud',ic:'☁️',pa:4,range:[1,4],los:true,target:'any',aoe:{s:'circle',r:1},perTurn:1,fx:[{t:'poison',el:'earth',v:5,dur:3}]},
 rebond:{mob:1,fr:'Chapeau rebondissant',en:'Bouncy Cap',ic:'🍄',pa:3,range:[1,1],target:'enemy',perTurn:2,fx:[{t:'dmg',el:'earth',min:10,max:14},{t:'push',n:3}]},
 mycelium:{mob:1,fr:'Mycélium',en:'Mycelium',ic:'🕸️',pa:3,range:[1,5],los:true,target:'enemy',perTurn:1,cd:2,fx:[{t:'dmg',el:'water',min:6,max:9},{t:'debuff',stat:'pa',v:2,dur:1}]},
 petitspore:{mob:1,fr:'Petit spore',en:'Tiny Spore',ic:'🟤',pa:3,range:[1,3],los:true,target:'enemy',perTurn:2,fx:[{t:'dmg',el:'earth',min:4,max:7}]},
 belement:{mob:1,fr:'Bêlement royal',en:'Royal Bleat',ic:'👑',pa:4,range:[1,4],los:true,target:'any',aoe:{s:'circle',r:1},perTurn:1,fx:[{t:'dmg',el:'earth',min:8,max:11,enemiesOnly:true},{t:'push',n:2}]}};
export const classSpells=cls=>Object.entries(SPELLS).filter(([,s])=>s.cls===cls).map(([id])=>id);

// ---- monstres. stats par niveau : pv = hp0 + hp*niveau ; ia : melee, ranged, healer, coward
export const MOBS={
 moutoufou:{fr:'Moutoufou',en:'Mad Sheep',lvl:[1,6],hp0:18,hp:6,pa:6,pm:3,init:8,stat:10,res:{earth:5},spells:['coupdeboule'],ai:'melee',col:'#f4f1e8',col2:'#3b3530',
  xp:12,kamas:[3,8],drops:[{i:'laine',p:.6},{i:'coiffe_mouton',p:.06},{i:'cape_mouton',p:.05}],d:['Un mouton qui a vu trop de vidéos de motivation. Il fonce.','A sheep that watched too many motivational videos. It charges.']},
 poultoss:{fr:'Poultoss',en:'Chirpy',lvl:[1,4],hp0:12,hp:4,pa:5,pm:5,init:14,stat:8,res:{air:10},spells:['picorage'],ai:'coward',col:'#ffd23f',col2:'#f08a2a',
  xp:9,kamas:[2,6],drops:[{i:'plume',p:.6},{i:'anneau_poultoss',p:.05}],d:['Petit, jaune, rapide, et franchement pénible.','Small, yellow, fast, and frankly annoying.']},
 vermichelle:{fr:'Vermichelle',en:'Noodleworm',lvl:[2,7],hp0:16,hp:5,pa:6,pm:2,init:6,stat:10,res:{water:10},spells:['crachat'],ai:'ranged',col:'#9bd36b',col2:'#5c8f3c',
  xp:13,kamas:[3,9],drops:[{i:'bave',p:.6},{i:'bottes_vermi',p:.05}],d:['Une larve qui se prend pour un spaghetti. Crache à distance.','A larva that thinks it’s a noodle. Spits from afar.']},
 crabouillon:{fr:'Crabouillon',en:'Crabroth',lvl:[4,9],hp0:24,hp:6,pa:6,pm:2,init:7,stat:12,res:{water:20,earth:10},spells:['pince','carapace'],ai:'melee',col:'#e8573f',col2:'#ffd9b3',
  xp:18,kamas:[5,12],drops:[{i:'pince_crabe',p:.5},{i:'ceinture_crabe',p:.05}],d:['Un crabe qui rêvait de finir en bouillon de luxe.','A crab that dreamt of ending up as a fancy broth.']},
 champi:{fr:'Champi-Champion',en:'Champ-ignon',lvl:[6,12],hp0:30,hp:5,pa:7,pm:2,init:6,stat:14,res:{earth:15,fire:-10},spells:['spores','champisoin'],ai:'healer',col:'#d94a3a',col2:'#fff3dc',
  xp:26,kamas:[8,16],drops:[{i:'spore',p:.55},{i:'amulette_champi',p:.05},{i:'cle_grotte',p:.03}],d:['Champion régional de lancer de spores. Soigne ses copains.','Regional spore-throwing champion. Heals its buddies.']},
 moustikouille:{fr:'Moustikouille',en:'Mosquitchy',lvl:[6,12],hp0:20,hp:4,pa:6,pm:4,init:12,stat:14,res:{air:15},spells:['piqure'],ai:'ranged',col:'#5a5f6b',col2:'#c9e3ff',
  xp:22,kamas:[6,14],drops:[{i:'dard',p:.55},{i:'cape_moustik',p:.05}],d:['Pique, aspire, et revient. Insupportable.','Stings, sucks, comes back. Unbearable.']},
 sanglier:{fr:'Sanglier Boudeur',en:'Sulky Boar',lvl:[10,16],hp0:38,hp:6,pa:7,pm:3,init:10,stat:18,res:{earth:15,neutral:10},spells:['charge','defense'],ai:'melee',col:'#7a5236',col2:'#efe2c9',aggro:true,
  xp:40,kamas:[12,24],drops:[{i:'defense',p:.5},{i:'coiffe_sanglier',p:.05},{i:'hache_sanglier',p:.04}],d:['Il boude depuis 1987. Ne lui parle pas, il charge.','Sulking since 1987. Don’t talk to him, he charges.']},
 araknee:{fr:'Araknée',en:'Spidernet',lvl:[12,18],hp0:34,hp:5,pa:6,pm:4,init:13,stat:18,res:{air:15,water:10},spells:['toile','morsure'],ai:'ranged',col:'#3b2f4a',col2:'#e2453c',aggro:true,
  xp:44,kamas:[14,26],drops:[{i:'soie',p:.5},{i:'bottes_arak',p:.05}],d:['Tisse des toiles et des rumeurs.','Spins webs and rumours.']},
 champinou:{fr:'Champinou',en:'Little Shroom',lvl:[10,15],hp0:22,hp:5,pa:6,pm:3,init:9,stat:15,res:{earth:10,fire:-10},spells:['petitspore','champisoin'],ai:'healer',col:'#e8b04a',col2:'#fff3dc',
  xp:30,kamas:[8,16],drops:[{i:'champignon',p:.5},{i:'spore',p:.3}],d:['Le petit cousin des Champi-Champions. Il soigne tout le monde sauf toi.','The Champ-ignons’ little cousin. Heals everyone except you.']},
 champidou:{fr:'Le Grand Champidou',en:'The Great Shroomdaddy',lvl:[18,18],hp0:300,hp:12,pa:8,pm:3,init:18,stat:28,res:{earth:25,water:10,fire:-15,air:5},spells:['rebond','sporee','mycelium'],ai:'melee',col:'#8a3bd9',col2:'#ffe9a8',boss:true,
  xp:600,kamas:[200,320],drops:[{i:'coiffe_champidou',p:.25},{i:'cape_champidou',p:.25},{i:'anneau_champidou',p:.2},{i:'champignon',p:1}],d:['Le roi de la grotte. Il pense que les champignons vont gouverner le monde. Il n’a pas complètement tort.','King of the cave. He thinks mushrooms will rule the world. He’s not entirely wrong.']},
 moutonroyal:{fr:'Mouton Royal',en:'Royal Sheep',lvl:[20,20],hp0:260,hp:10,pa:8,pm:3,init:20,stat:30,res:{earth:20,fire:10,water:10,air:10},spells:['belement','coupdeboule'],ai:'melee',col:'#fff8e8',col2:'#f2c14e',boss:true,
  xp:400,kamas:[150,250],drops:[{i:'couronne',p:.3},{i:'laine',p:1}],d:['Le roi des Moutoufous. Sa couronne est en carton, sa colère est réelle.','King of the Mad Sheep. Cardboard crown, very real anger.']}};

// ---- objets : équipements (emplacements), armes, ressources, consommables
export const SLOTS=['hat','cape','amulet','ring','belt','boots','weapon'];
export const SLOT_FR={hat:['Coiffe','Hat'],cape:['Cape','Cloak'],amulet:['Amulette','Amulet'],ring:['Anneau','Ring'],belt:['Ceinture','Belt'],boots:['Bottes','Boots'],weapon:['Arme','Weapon']};
export const ITEMS={
 // ressources
 laine:{fr:'Laine de Moutoufou',en:'Mad Sheep Wool',ic:'🧶',price:3,res:1,d:['Sent le mouton mouillé.','Smells like wet sheep.']},
 plume:{fr:'Plume de Poultoss',en:'Chirpy Feather',ic:'🪶',price:2,res:1,d:['Chatouille.','Tickles.']},
 bave:{fr:'Bave de Vermichelle',en:'Noodleworm Slime',ic:'🫧',price:3,res:1,d:['Ne pas confondre avec la sauce.','Not to be mistaken for the sauce.']},
 pince_crabe:{fr:'Pince de Crabouillon',en:'Crabroth Claw',ic:'🦀',price:5,res:1,d:['Encore un peu nerveuse.','Still a bit twitchy.']},
 spore:{fr:'Spore de champion',en:'Champion Spore',ic:'🍄',price:6,res:1,d:['Médaille d’or de la moisissure.','Gold medal in mould.']},
 dard:{fr:'Dard de Moustikouille',en:'Mosquitchy Stinger',ic:'🪡',price:6,res:1,d:['Pointu. Très pointu.','Sharp. Very sharp.']},
 defense:{fr:'Défense de Sanglier',en:'Boar Tusk',ic:'🦷',price:10,res:1,d:['Il ne la réclamera pas, il boude.','He won’t ask for it back, he’s sulking.']},
 soie:{fr:'Soie d’Araknée',en:'Spidernet Silk',ic:'🕸️',price:11,res:1,d:['Douce et collante, comme un ex.','Soft and sticky, like an ex.']},
 // consommables
 potion:{fr:'Potion de Mamie',en:'Granny’s Potion',ic:'🧃',price:15,use:{heal:40},d:['Rend 40 PV. Goût fraise-pastis.','Restores 40 HP. Strawberry-pastis flavour.']},
 grandepotion:{fr:'Grande potion de Mamie',en:'Granny’s Big Potion',ic:'🍾',price:45,use:{heal:150},d:['Rend 150 PV. Ne pas conduire après.','Restores 150 HP. Do not drive afterwards.']},
 pain:{fr:'Pain Baga',en:'Baga Bread',ic:'🥖',price:6,use:{heal:15},d:['Rend 15 PV. Croustillant.','Restores 15 HP. Crunchy.']},
 // armes (une attaque de base utilisable par tous)
 baton:{fr:'Bâton du débutant',en:'Beginner’s Staff',ic:'🦯',slot:'weapon',lvl:1,price:20,stats:{},weapon:{pa:3,range:[1,1],el:'neutral',min:4,max:7},d:['Un bâton. Avec un peu d’imagination, c’est une arme.','A stick. With some imagination, it’s a weapon.']},
 epee_rouillee:{fr:'Épée rouillée',en:'Rusty Sword',ic:'🗡️',slot:'weapon',lvl:3,price:60,stats:{str:5},weapon:{pa:4,range:[1,1],el:'earth',min:7,max:11},d:['Le tétanos est offert.','Tetanus included.']},
 arc_bois:{fr:'Arc en bois flotté',en:'Driftwood Bow',ic:'🏹',slot:'weapon',lvl:3,price:60,stats:{agi:5},weapon:{pa:4,range:[2,6],el:'air',min:5,max:8},d:['Trouvé sur la plage de Baga.','Found on Baga beach.']},
 baguette:{fr:'Baguette pas magique',en:'Not-So-Magic Wand',ic:'🪄',slot:'weapon',lvl:3,price:60,stats:{int:5},weapon:{pa:3,range:[1,4],el:'fire',min:4,max:7},d:['C’est une baguette de pain. Mais elle brûle.','It’s a bread stick. But it burns.']},
 dague:{fr:'Dague de poche',en:'Pocket Dagger',ic:'🔪',slot:'weapon',lvl:3,price:60,stats:{agi:5},weapon:{pa:3,range:[1,1],el:'air',min:6,max:9},d:['Se range dans la poche. Attention en s’asseyant.','Fits in a pocket. Careful when sitting.']},
 hache_sanglier:{fr:'Hache du Sanglier',en:'Boar Axe',ic:'🪓',slot:'weapon',lvl:12,price:300,stats:{str:20,vit:15},weapon:{pa:4,range:[1,1],el:'earth',min:14,max:20},d:['Boude aussi, mais tape fort.','Sulks too, but hits hard.']},
 // équipements des mobs (panoplies)
 coiffe_mouton:{fr:'Coiffe du Moutoufou',en:'Mad Sheep Hat',ic:'🐑',slot:'hat',lvl:2,price:40,set:'mouton',stats:{vit:15,wis:5},d:['Avec les cornes. Fait bêêêh au vent.','With horns. Goes baaa in the wind.']},
 cape_mouton:{fr:'Cape en laine',en:'Wool Cloak',ic:'🧥',slot:'cape',lvl:3,price:40,set:'mouton',stats:{vit:10,str:5},d:['Gratte un peu.','A bit itchy.']},
 anneau_poultoss:{fr:'Anneau Poultoss',en:'Chirpy Ring',ic:'💍',slot:'ring',lvl:2,price:35,stats:{agi:8,init:20},d:['Fait piou-piou quand on bouge le doigt.','Goes tweet-tweet when you move your finger.']},
 bottes_vermi:{fr:'Bottes gluantes',en:'Slimy Boots',ic:'🥾',slot:'boots',lvl:4,price:50,stats:{cha:8,vit:8},d:['Collent au sol. Pratique contre le vent.','Stick to the ground. Handy against the wind.']},
 ceinture_crabe:{fr:'Ceinture du Crabouillon',en:'Crabroth Belt',ic:'🦀',slot:'belt',lvl:6,price:70,stats:{vit:20,cha:6},d:['Avec une boucle qui pince.','With a pinching buckle.']},
 amulette_champi:{fr:'Amulette Champi',en:'Mushroom Amulet',ic:'🍄',slot:'amulet',lvl:8,price:90,stats:{int:12,heal:5,wis:8},d:['Ne pas manger.','Do not eat.']},
 cape_moustik:{fr:'Cape Moustikouille',en:'Mosquitchy Cloak',ic:'🦟',slot:'cape',lvl:8,price:90,stats:{agi:14,init:40},d:['Bzzz.','Bzzz.']},
 coiffe_sanglier:{fr:'Coiffe du Sanglier Boudeur',en:'Sulky Boar Hat',ic:'🐗',slot:'hat',lvl:12,price:160,stats:{str:18,vit:25},d:['Donne envie de bouder.','Makes you want to sulk.']},
 bottes_arak:{fr:'Bottes d’Araknée',en:'Spidernet Boots',ic:'🕷️',slot:'boots',lvl:14,price:180,stats:{agi:15,pm:1},d:['Huit lacets à faire chaque matin. +1 PM.','Eight laces to tie every morning. +1 MP.']},
 couronne:{fr:'Couronne en carton',en:'Cardboard Crown',ic:'👑',slot:'hat',lvl:18,price:500,stats:{vit:40,str:15,int:15,cha:15,agi:15,pa:1},d:['Le Mouton Royal en était très fier. +1 PA.','The Royal Sheep was very proud of it. +1 AP.']},
 // ressources des métiers
 frene:{fr:'Bois de frêne',en:'Ash Wood',ic:'🪵',price:2,res:1,d:['Du bois honnête, sans histoire.','Honest wood, no drama.']},
 pin:{fr:'Bois de pin',en:'Pine Wood',ic:'🌲',price:5,res:1,d:['Sent le sapin de Noël. Ce n’en est pas un.','Smells like a Christmas tree. It isn’t one.']},
 palmier:{fr:'Bois de palmier',en:'Palm Wood',ic:'🌴',price:9,res:1,d:['Souple, solide, un peu vantard.','Flexible, sturdy, a bit of a show-off.']},
 planche:{fr:'Planche',en:'Plank',ic:'🟫',price:5,res:1,d:['Bien droite. Fierté du bûcheron.','Nice and straight. The lumberjack’s pride.']},
 cuivre:{fr:'Minerai de cuivre',en:'Copper Ore',ic:'🟠',price:3,res:1,d:['Brille un peu quand on le regarde gentiment.','Shines a little when you look at it kindly.']},
 fer:{fr:'Minerai de fer',en:'Iron Ore',ic:'⚙️',price:8,res:1,d:['Lourd. Très lourd. Pourquoi tu l’as ramassé ?','Heavy. Very heavy. Why did you pick it up?']},
 lingot_cuivre:{fr:'Lingot de cuivre',en:'Copper Ingot',ic:'🧈',price:12,res:1,d:['Ce n’est pas du beurre. Ne pas tartiner.','It’s not butter. Do not spread.']},
 lingot_fer:{fr:'Lingot de fer',en:'Iron Ingot',ic:'🔩',price:30,res:1,d:['Momo dit que c’est « du sérieux ».','Momo says it’s “serious stuff”.']},
 ortie:{fr:'Ortie',en:'Nettle',ic:'🌿',price:2,res:1,d:['Pique. Soigne. Pique encore.','Stings. Heals. Stings again.']},
 fleur:{fr:'Fleur de prairie',en:'Meadow Flower',ic:'🌼',price:4,res:1,d:['Les Moutoufous adorent. Garde-la loin d’eux.','Mad Sheep love them. Keep it away from them.']},
 champignon:{fr:'Champignon des bois',en:'Wood Mushroom',ic:'🍄‍🟫',price:8,res:1,d:['Comestible. Probablement.','Edible. Probably.']},
 goujon:{fr:'Goujon',en:'Gudgeon',ic:'🐟',price:3,res:1,d:['Petit poisson de rivière, grand rêveur.','Small river fish, big dreamer.']},
 sardine:{fr:'Sardine de Baga',en:'Baga Sardine',ic:'🐠',price:7,res:1,d:['Vient de la mer. A vu des choses.','From the sea. Has seen things.']},
 cle_grotte:{fr:'Clé moisie',en:'Mouldy Key',ic:'🗝️',price:60,res:1,d:['Ouvre la Grotte du Champidou. Une seule fois : elle s’effrite.','Opens the Shroomdaddy’s Cave. Only once: it crumbles.']},
 brochette:{fr:'Brochette de goujon',en:'Gudgeon Skewer',ic:'🍢',price:20,use:{heal:70},d:['Rend 70 PV. Recette de Papi Marcel.','Restores 70 HP. Grandpa Marcel’s recipe.']},
 soupe:{fr:'Soupe de sardines',en:'Sardine Soup',ic:'🍲',price:50,use:{heal:180},d:['Rend 180 PV. L’haleine, par contre…','Restores 180 HP. The breath, though…']},
 // équipements fabriqués
 arc_frene:{fr:'Arc de frêne',en:'Ash Bow',ic:'🏹',slot:'weapon',lvl:5,price:110,stats:{agi:10,vit:8},weapon:{pa:4,range:[2,7],el:'air',min:7,max:10},d:['Fait main, ça se voit.','Handmade, and it shows.']},
 baton_pin:{fr:'Bâton de pin',en:'Pine Staff',ic:'🪄',slot:'weapon',lvl:8,price:160,stats:{int:12,vit:12},weapon:{pa:3,range:[1,4],el:'fire',min:7,max:11},d:['Brûle bien. Normal, c’est du pin.','Burns nicely. Of course, it’s pine.']},
 arc_palmier:{fr:'Arc en palmier',en:'Palm Bow',ic:'🏹',slot:'weapon',lvl:14,price:380,stats:{agi:22,vit:20,range:1},weapon:{pa:4,range:[2,8],el:'air',min:12,max:17},d:['+1 portée. Les cocotiers en tremblent.','+1 range. Coconut trees tremble.']},
 epee_cuivre:{fr:'Épée de cuivre',en:'Copper Sword',ic:'🗡️',slot:'weapon',lvl:6,price:130,stats:{str:12,vit:10},weapon:{pa:4,range:[1,1],el:'earth',min:10,max:14},d:['Brillante, et elle coupe vraiment.','Shiny, and it actually cuts.']},
 epee_fer:{fr:'Épée de fer',en:'Iron Sword',ic:'⚔️',slot:'weapon',lvl:13,price:360,stats:{str:22,vit:20},weapon:{pa:4,range:[1,1],el:'earth',min:15,max:21},d:['« Du sérieux », dit Momo.','“Serious stuff,” says Momo.']},
 dague_fer:{fr:'Dague de fer',en:'Iron Dagger',ic:'🔪',slot:'weapon',lvl:12,price:330,stats:{agi:20,vit:15},weapon:{pa:3,range:[1,1],el:'air',min:11,max:15},d:['Pour les Fourbes qui ont un budget.','For Sneaks on a budget.']},
 anneau_cuivre:{fr:'Anneau de cuivre',en:'Copper Ring',ic:'💍',slot:'ring',lvl:5,price:90,stats:{vit:12,cha:8,str:4},d:['Laisse une trace verte. C’est la preuve qu’il est vrai.','Leaves a green mark. Proof it’s real.']},
 amulette_fleurs:{fr:'Collier de fleurs',en:'Flower Necklace',ic:'🌸',slot:'amulet',lvl:7,price:120,stats:{int:12,wis:10,heal:4},d:['Les Moutoufous te suivent partout.','Mad Sheep follow you everywhere.']},
 ceinture_ecailles:{fr:'Ceinture en écailles',en:'Scale Belt',ic:'🐠',slot:'belt',lvl:9,price:150,stats:{cha:14,vit:18},d:['Sent la marée. Résiste à tout, sauf au savon.','Smells of the tide. Resists everything but soap.']},
 // panoplie du donjon
 coiffe_champidou:{fr:'Chapeau du Champidou',en:'Shroomdaddy Cap',ic:'🍄',slot:'hat',lvl:15,price:400,set:'champidou',stats:{vit:35,str:12,int:12,cha:12},d:['Un chapeau qui pousse tout seul.','A hat that grows by itself.']},
 cape_champidou:{fr:'Cape mycélienne',en:'Mycelium Cloak',ic:'🧣',slot:'cape',lvl:15,price:400,set:'champidou',stats:{vit:30,agi:14,wis:10},d:['Douce, chaude, légèrement vivante.','Soft, warm, slightly alive.']},
 anneau_champidou:{fr:'Anneau sporé',en:'Spore Ring',ic:'💍',slot:'ring',lvl:15,price:400,set:'champidou',stats:{vit:20,str:10,int:10,agi:10},d:['Éternue quand il pleut.','Sneezes when it rains.']},
 // boutique
 coiffe_paille:{fr:'Chapeau de paille',en:'Straw Hat',ic:'👒',slot:'hat',lvl:1,price:25,stats:{vit:8},d:['Le style Bagatown.','Bagatown style.']},
 bottes_cuir:{fr:'Bottes en cuir',en:'Leather Boots',ic:'👢',slot:'boots',lvl:1,price:25,stats:{vit:5,agi:3},d:['Elles ont fait la guerre. Enfin, le marché.','They’ve been to war. Well, to the market.']},
 amulette_baga:{fr:'Amulette Baga',en:'Baga Amulet',ic:'📿',slot:'amulet',lvl:5,price:80,stats:{vit:10,str:4,int:4,cha:4,agi:4},d:['Un souvenir de Bagatown, fabriqué à Bagatown.','A Bagatown souvenir, made in Bagatown.']},
 anneau_force:{fr:'Anneau du costaud',en:'Strongman Ring',ic:'💪',slot:'ring',lvl:5,price:80,stats:{str:10},d:['+10 Force. Et un petit miroir.','+10 Strength. And a little mirror.']},
 anneau_malin:{fr:'Anneau du malin',en:'Clever Ring',ic:'🧠',slot:'ring',lvl:5,price:80,stats:{int:10},d:['+10 Intelligence. Ou alors c’est l’effet placebo.','+10 Intelligence. Or it’s the placebo effect.']},
 ceinture_baga:{fr:'Ceinture de Bagatown',en:'Bagatown Belt',ic:'🎗️',slot:'belt',lvl:3,price:45,stats:{vit:12},d:['Tient le pantalon et le moral.','Holds up trousers and morale.']}};

// ---- quêtes
export const QUESTS={
 q_moutons:{fr:'Les moutons de la discorde',en:'Sheep of Discord',giver:'maire',kill:{moutoufou:5},reward:{xp:120,kamas:40,item:'coiffe_paille'},
  d:['Les Moutoufous ont mangé les géraniums de la mairie. Tapes-en 5, pour l’exemple.','The Mad Sheep ate the town hall’s geraniums. Whack 5 of them, as an example.']},
 q_poultoss:{fr:'Silence dans la prairie',en:'Peace in the Meadow',giver:'mamie',kill:{poultoss:4},reward:{xp:90,kamas:30,item:'potion'},
  d:['Les Poultoss font piou-piou sous ma fenêtre toute la nuit. Fais-les taire, mon grand.','The Chirpies tweet under my window all night. Make them stop, dear.']},
 q_crabes:{fr:'Bouillon de crabe',en:'Crab Broth',giver:'gege',kill:{crabouillon:3},reward:{xp:220,kamas:70,item:'grandepotion'},
  d:['Mon bouillon manque de crabe. Ramène-moi 3 Crabouillons de la plage, à l’ouest.','My broth needs crab. Bring me 3 Crabroths from the beach, to the west.']},
 q_champis:{fr:'Champions de rien',en:'Champions of Nothing',giver:'momo',kill:{champi:3,moustikouille:3},reward:{xp:500,kamas:150,item:'amulette_baga'},
  d:['Dans le bois à l’est, des champignons se prennent pour des champions. Va leur rappeler la vie.','In the eastern woods, mushrooms think they’re champions. Go remind them of reality.']},
 q_sanglier:{fr:'Le boudeur',en:'The Sulker',giver:'robert',kill:{sanglier:4},reward:{xp:900,kamas:300,item:'anneau_force'},
  d:['Au nord, les Sangliers boudent et chargent les passants. Je suis garde, mais j’ai peur. Vas-y, toi.','Up north, Boars sulk and charge at passers-by. I’m a guard, but I’m scared. You go.']},
 q_royal:{fr:'Lèse-majesté',en:'Treason',giver:'maire',kill:{moutonroyal:1},need:'q_moutons',reward:{xp:3000,kamas:800,item:'couronne'},
  d:['Le Mouton Royal s’est proclamé maire de la prairie. Il n’y a qu’un maire ici. Va le détrôner (au fond de la prairie, au sud).','The Royal Sheep declared himself mayor of the meadow. There’s only one mayor here. Go dethrone him (deep in the meadow, south).']},
 q_bois:{fr:'Bois de chauffage',en:'Firewood',giver:'josette',bring:{frene:8},reward:{xp:150,kamas:60,item:'pain'},
  d:['L’hiver arrive, et Mamie Kamas a encore froid. Coupe-moi 8 bûches de frêne.','Winter is coming, and Granny Kamas is cold again. Cut me 8 ash logs.']},
 q_cuivre:{fr:'Ça brille !',en:'Shiny!',giver:'leon',bring:{cuivre:8},reward:{xp:180,kamas:70,item:'lingot_cuivre'},
  d:['J’ai promis une bague à ma chérie. Ramène 8 minerais de cuivre, je ferai le reste. Elle ne saura rien.','I promised my sweetheart a ring. Bring 8 copper ores, I’ll do the rest. She’ll never know.']},
 q_herbes:{fr:'Tisane de Tata',en:'Auntie’s Tea',giver:'tata',bring:{ortie:6,fleur:3},reward:{xp:200,kamas:60,item:'grandepotion'},
  d:['Ma tisane « remède à tout » a besoin de 6 orties et 3 fleurs de prairie. Ça soigne même la timidité.','My “cure-all” tea needs 6 nettles and 3 meadow flowers. It even cures shyness.']},
 q_peche:{fr:'Le goujon de la discorde',en:'The Gudgeon Dispute',giver:'marcel',bring:{goujon:6},reward:{xp:180,kamas:60,item:'brochette'},
  d:['Gégé dit que je ne sais plus pêcher. Ramène-moi 6 goujons de la rivière, qu’on rigole.','Gégé says I can’t fish anymore. Bring me 6 gudgeons from the river, we’ll see who laughs.']},
 q_brochettes:{fr:'Menu du jour',en:'Today’s Special',giver:'gege',bring:{brochette:3},need:'q_peche',reward:{xp:450,kamas:150,item:'ceinture_ecailles'},
  d:['Bon, d’accord, Marcel sait pêcher. Mais sait-il cuisiner ? Rapporte 3 brochettes, je goûte.','Fine, Marcel can fish. But can he cook? Bring 3 skewers, I’ll taste.']},
 q_defenses:{fr:'Ivoire de bouderie',en:'Sulky Ivory',giver:'momo',bring:{defense:5,lingot_fer:2},reward:{xp:1200,kamas:300,item:'hache_sanglier'},
  d:['Avec 5 défenses de Sanglier et 2 lingots de fer, je te forge une hache qui boude aussi fort qu’eux.','With 5 Boar tusks and 2 iron ingots, I’ll forge you an axe that sulks as hard as they do.']},
 q_araknees:{fr:'Toile de fond',en:'Backdrop',giver:'josette',kill:{araknee:4},reward:{xp:1300,kamas:320,item:'bottes_arak'},
  d:['Les Araknées tissent dans mes pins, au nord. Je ne peux plus rien couper. Débarrasse-m’en.','Spidernets weave in my pines up north. I can’t cut anything anymore. Get rid of them.']},
 q_grotte:{fr:'Le roi sous la terre',en:'King Underground',giver:'bernard',kill:{champidou:1},reward:{xp:4000,kamas:1000,item:'cle_grotte'},
  d:['Au fond de la grotte, le Grand Champidou prépare la révolution des champignons. Arrête-le avant le dessert.','Deep in the cave, the Great Shroomdaddy is plotting the mushroom revolution. Stop him before dessert.']},
 q_cle:{fr:'Clé de voûte',en:'Keystone',giver:'bernard',bring:{champignon:4,spore:3},reward:{xp:600,kamas:100,item:'cle_grotte'},
  d:['Tu veux entrer ? Il te faut une clé moisie. Rapporte-moi 4 champignons des bois et 3 spores, je t’en moisis une.','Want in? You need a mouldy key. Bring me 4 wood mushrooms and 3 spores, I’ll mould you one.']}};


// ---- PNJ de Bagatown
export const NPCS={
 maire:{fr:'Maire Bagatelle',en:'Mayor Bagatelle',col:'#3b4a7a',hat:'top',lines:[['Bienvenue à Bagatown ! La ville la plus baga du monde. Enfin, de la région.','Welcome to Bagatown! The most baga town in the world. Well, in the region.'],['Je suis maire depuis 30 ans. Personne d’autre ne s’est présenté.','I’ve been mayor for 30 years. Nobody else ran.']]},
 mamie:{fr:'Mamie Kamas',en:'Granny Kamas',col:'#a86fb5',hat:'bun',shop:['potion','grandepotion','pain'],lines:[['Des potions, mon petit ? Faites maison, avec amour et un peu de pastis.','Potions, dear? Homemade, with love and a little pastis.']]},
 momo:{fr:'Forgeron Momo',en:'Momo the Smith',col:'#6b4a2f',hat:'band',shop:['baton','epee_rouillee','arc_bois','baguette','dague','coiffe_paille','bottes_cuir','ceinture_baga','amulette_baga','anneau_force','anneau_malin'],
  lines:[['Mes armes sont garanties à vie. La tienne, pas la mienne.','My weapons have a lifetime guarantee. Yours, not mine.']]},
 gege:{fr:'Tavernier Gégé',en:'Gégé the Innkeeper',col:'#c9853a',hat:'none',lines:[['Une limonade ? On n’a que ça et du bouillon.','Lemonade? That’s all we have, and broth.'],['Le Bourrin du coin a perdu un bras de fer contre un Moutoufou. On en parle encore.','The local Brute lost an arm wrestle to a Mad Sheep. People still talk about it.']]},
 robert:{fr:'Garde Robert',en:'Guard Robert',col:'#4a6b8a',hat:'helmet',lines:[['Halte ! … Ah non, c’est bon, vas-y. Je dis ça pour m’entraîner.','Halt! … Oh no, it’s fine, go ahead. I’m just practising.']]},
 josette:{fr:'Bûcheronne Josette',en:'Josette the Lumberjack',col:'#a83b2f',hat:'band',job:'bucheron',lines:[['Un arbre, ça se respecte. Après, ça se coupe.','A tree deserves respect. Then it gets chopped.'],['Je parle aux arbres. Ils ne répondent pas, c’est reposant.','I talk to trees. They don’t answer, it’s relaxing.']]},
 leon:{fr:'Gros Léon le mineur',en:'Big Léon the Miner',col:'#55555c',hat:'helmet',job:'mineur',lines:[['Le fer, c’est la vie. Le cuivre, c’est pour les amoureux.','Iron is life. Copper is for lovers.'],['J’ai creusé un trou une fois. Je suis toujours dedans, en quelque sorte.','I dug a hole once. I’m still in it, sort of.']]},
 tata:{fr:'Tata Ortie',en:'Auntie Nettle',col:'#5c8f3c',hat:'bun',job:'herboriste',lines:[['Une ortie par jour éloigne le médecin. Et tout le monde, en fait.','A nettle a day keeps the doctor away. And everyone else, really.'],['Les fleurs, ça ne se cueille pas, ça se convainc.','You don’t pick flowers, you convince them.']]},
 marcel:{fr:'Papi Marcel',en:'Grandpa Marcel',col:'#3a6fa8',hat:'top',job:'pecheur',lines:[['J’ai pêché une sardine grande comme ça. Non, plus grande.','I caught a sardine this big. No, bigger.'],['La patience, petit. Et un bon pique-nique.','Patience, kid. And a good picnic.']]},
 bernard:{fr:'Bernard, gardien de la grotte',en:'Bernard, Cave Keeper',col:'#6b3b8a',hat:'wizard',lines:[['La Grotte du Champidou, quatre salles, un roi champignon. On y entre avec une clé moisie, on en sort avec des spores partout.','The Shroomdaddy’s Cave: four rooms, one mushroom king. You go in with a mouldy key, you come out with spores everywhere.'],['Vas-y en groupe. Seul, c’est pour les héros. Ou les têtus.','Go as a group. Alone is for heroes. Or the stubborn.']]},
 prof:{fr:'Maître Bagaclasse',en:'Master Bagaclass',col:'#2f6b4a',hat:'wizard',reset:true,lines:[['Je peux te réapprendre tes caractéristiques. Gratuitement, parce que je suis gentil.','I can reset your characteristics. For free, because I’m nice.']]}};

// ---- zones du monde (repères pour le générateur et les noms affichés)
export const ZONES={town:{fr:'Bagatown',en:'Bagatown',lvl:'—',music:'town'},meadow:{fr:'Prairie des Moutoufous',en:'Mad Sheep Meadow',lvl:'1-6',music:'field'},
 beach:{fr:'Plage de Baga',en:'Baga Beach',lvl:'4-9',music:'field'},woods:{fr:'Bois des Champis',en:'Mushroom Woods',lvl:'6-12',music:'woods'},
 hills:{fr:'Collines Boudeuses',en:'Sulky Hills',lvl:'10-18',music:'woods'},throne:{fr:'Trône du Mouton Royal',en:'Royal Sheep’s Throne',lvl:'20',music:'woods'}};
export const SPAWNS={meadow:['moutoufou','moutoufou','poultoss','vermichelle'],beach:['crabouillon','crabouillon','vermichelle'],woods:['champi','moustikouille','vermichelle'],hills:['sanglier','araknee','sanglier'],throne:['moutonroyal']};

// ---- métiers : récolte dans le monde, fabrication auprès du maître de métier
export const JOB_MAX=30;
export const jobXpFor=l=>Math.floor(25*Math.pow(Math.max(0,l-1),1.75));
export const jobLevelOf=xp=>{let l=1;while(l<JOB_MAX&&xp>=jobXpFor(l+1))l++;return l};
export const JOBS={
 bucheron:{fr:'Bûcheron',en:'Lumberjack',ic:'🪓',master:'josette',shop:['Scierie','Sawmill'],d:['Coupe les arbres. Fabrique des planches et des armes en bois.','Chops trees. Makes planks and wooden weapons.']},
 mineur:{fr:'Mineur',en:'Miner',ic:'⛏️',master:'leon',shop:['Forge','Forge'],d:['Casse les rochers. Fond des lingots, forge des épées et des anneaux.','Breaks rocks. Smelts ingots, forges swords and rings.']},
 herboriste:{fr:'Herboriste',en:'Herbalist',ic:'🌿',master:'tata',shop:['Alambic','Still'],d:['Cueille orties, fleurs et champignons. Prépare potions et colliers (et la clé du donjon).','Picks nettles, flowers and mushrooms. Brews potions and necklaces (and the dungeon key).']},
 pecheur:{fr:'Pêcheur',en:'Fisher',ic:'🎣',master:'marcel',shop:['Cuisine','Kitchen'],d:['Pêche dans la rivière et la mer. Cuisine des plats qui rendent beaucoup de PV.','Fishes in the river and the sea. Cooks dishes that restore lots of HP.']}};
// ce qu'on récolte : selon le décor (et la zone), le niveau de métier requis, l'XP de métier
export const HARVEST={
 tree:{job:'bucheron',item:'frene',lvl:1,xp:8},pine:{job:'bucheron',item:'pin',lvl:5,xp:14},palm:{job:'bucheron',item:'palmier',lvl:10,xp:22},
 rock:{job:'mineur',item:'cuivre',lvl:1,xp:8},rock_hills:{job:'mineur',item:'fer',lvl:8,xp:18},
 bush:{job:'herboriste',item:'ortie',lvl:1,xp:7},deco:{job:'herboriste',item:'fleur',lvl:3,xp:10},shroom:{job:'herboriste',item:'champignon',lvl:8,xp:18},
 river:{job:'pecheur',item:'goujon',lvl:1,xp:8},sea:{job:'pecheur',item:'sardine',lvl:6,xp:15}};
export const RECIPES={
 planche:{job:'bucheron',lvl:1,in:{frene:2},xp:6},
 arc_frene:{job:'bucheron',lvl:3,in:{planche:6,plume:4},xp:30},
 baton_pin:{job:'bucheron',lvl:6,in:{pin:6,spore:3},xp:45},
 arc_palmier:{job:'bucheron',lvl:12,in:{palmier:8,soie:3,dard:2},xp:90},
 lingot_cuivre:{job:'mineur',lvl:1,in:{cuivre:3},xp:8},
 anneau_cuivre:{job:'mineur',lvl:2,in:{lingot_cuivre:3,bave:2},xp:25},
 epee_cuivre:{job:'mineur',lvl:3,in:{lingot_cuivre:5,pince_crabe:2},xp:35},
 lingot_fer:{job:'mineur',lvl:8,in:{fer:3},xp:20},
 dague_fer:{job:'mineur',lvl:10,in:{lingot_fer:4,dard:3},xp:70},
 epee_fer:{job:'mineur',lvl:10,in:{lingot_fer:6,defense:3},xp:80},
 potion:{job:'herboriste',lvl:1,in:{ortie:3},xp:8},
 amulette_fleurs:{job:'herboriste',lvl:4,in:{fleur:6,laine:4},xp:35},
 grandepotion:{job:'herboriste',lvl:6,in:{ortie:4,fleur:3,spore:1},xp:30},
 cle_grotte:{job:'herboriste',lvl:8,in:{champignon:3,spore:2,soie:2},xp:60},
 brochette:{job:'pecheur',lvl:1,in:{goujon:2,pain:1},xp:10},
 soupe:{job:'pecheur',lvl:6,in:{sardine:3,ortie:2},xp:28},
 ceinture_ecailles:{job:'pecheur',lvl:8,in:{sardine:8,pince_crabe:3},xp:60}};
// panoplies : bonus quand on porte plusieurs pièces du même ensemble
export const SETS={
 mouton:{fr:'Panoplie du Moutoufou',en:'Mad Sheep Set',bonus:{2:{vit:10,wis:5}}},
 champidou:{fr:'Panoplie du Champidou',en:'Shroomdaddy Set',bonus:{2:{vit:20,str:8,int:8,cha:8,agi:8},3:{vit:40,str:15,int:15,cha:15,agi:15,pm:1}}}};
// ---- donjon : la Grotte du Champidou, 4 salles à la suite (# pilier, ~ trou, A départ joueurs, B départ monstres)
export const DUNGEON={id:'grotte',fr:'Grotte du Champidou',en:'Shroomdaddy’s Cave',key:'cle_grotte',lvl:'14-20',rooms:[
 {fr:'Salle des Champinous',en:'Little Shroom Hall',mobs:[['champinou',11],['champinou',12],['champi',12]],map:[
  '~~~~~~~~~~~~~','~...B...B...~','~.#.......#.~','~....B......~','~...........~','~..#.....#..~','~.....#.....~','~..#.....#..~','~...........~','~.#.......#.~','~...A...A...~','~.....A.A...~','~~~~~~~~~~~~~']},
 {fr:'Galerie des Bourdonnements',en:'Buzzing Gallery',mobs:[['moustikouille',13],['moustikouille',13],['araknee',14]],map:[
  '~~~~~~~~~~~~~','~..B.....B..~','~...........~','~.##..B..##.~','~...........~','~...#...#...~','~~.........~~','~...#...#...~','~...........~','~.##.....##.~','~..A.....A..~','~....A.A....~','~~~~~~~~~~~~~']},
 {fr:'Champignonnière',en:'Mushroom Farm',mobs:[['champinou',14],['champinou',14],['champi',15],['champinou',15]],map:[
  '~~~~~~~~~~~~~','~.B..B.B..B.~','~...........~','~.#.#...#.#.~','~...........~','~.....~.....~','~...#.~.#...~','~.....~.....~','~...........~','~.#.#...#.#.~','~...A...A...~','~....A.A....~','~~~~~~~~~~~~~']},
 {fr:'Trône du Champidou',en:'Shroomdaddy’s Throne',mobs:[['champidou',18],['champinou',15],['champinou',15]],map:[
  '~~~~~~~~~~~~~','~....B.B....~','~.#...B...#.~','~...........~','~..#.....#..~','~...........~','~.#...#...#.~','~...........~','~..#.....#..~','~...........~','~.#.A...A.#.~','~....A.A....~','~~~~~~~~~~~~~']}]};
