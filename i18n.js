// Traduction de l'interface (français → anglais), sans modifier le code des jeux.
// Le texte source reste en français dans le code ; en anglais, cette couche traduit à la volée
// les textes du DOM (nœuds texte, aria-label, placeholder, title) et ceux dessinés sur les canvas.
// Ajouter une phrase : une entrée dans D (texte exact) ou dans P (texte avec des parties variables).
(function(){
 var saved={};try{saved=JSON.parse(localStorage.getItem('bagaplay-v1')||'{}')}catch(e){}
 var lang=saved.lang||((navigator.language||'fr').toLowerCase().indexOf('fr')===0?'fr':'en');
 window.bagaLang=lang;
 document.documentElement.lang=lang;

 var D={
  // accueil, navigation
  'LE PETIT ATELIER DU JEU':'THE LITTLE GAME WORKSHOP','À toi de jouer':'Your turn to play','Tous les jeux':'All games','À deux':'Two players','Réflexion':'Puzzles','Arcade':'Arcade','Catégories':'Categories',
  'app créé par Kiara':'app made by Kiara','Mes pièces et mes scores':'My coins and scores','Retour à l’accueil':'Back to home','Mettre en pause':'Pause','Recommencer':'Restart','Pièces récoltées':'Coins collected','Plateau de jeu':'Game board',
  'SCORE':'SCORE','RECORD':'BEST','COUPS':'MOVES','SECONDES':'SECONDS','TEMPS':'TIME','Notes':'Notes','Indice':'Hint','VICTOIRES':'WINS','BLANCS':'WHITE','NOIRS':'BLACK','PIÈCES':'COINS',
  'PETITE DOSE D’ARCADE':'A LITTLE ARCADE','PAUSE RÉFLEXION':'THINKING BREAK','Réglages':'Settings','Son':'Sound','Langue':'Language','Version':'Version','Fermer':'Close',
  'Activer le son':'Turn sound on','Désactiver le son':'Turn sound off',
  // jeux
  'Échecs':'Chess','Dames':'Checkers','Puissance 4':'Connect Four','ROUGES':'RED','JAUNES':'YELLOW','4 alignés':'four in a row','grille pleine':'board full','Voir la grille':'View board','Voici où se cachaient les mines.':'Here’s where the mines were hiding.','Expert':'Expert','Défier au puissance 4':'Challenge to Connect Four',
  'Puissance 4 : aligne 4 jetons (ligne, colonne ou diagonale). Touche une colonne pour y lâcher ton jeton.':'Connect Four: line up 4 discs (row, column or diagonal). Tap a column to drop your disc.','Blocs pastel':'Pastel Blocks','Casse-briques':'Breakout','Démineur':'Minesweeper','Morpion':'Tic-tac-toe','Petit envol':'Little Flight','Le taquin':'15 Puzzle','Memory':'Memory','Sudoku':'Sudoku','Snake':'Snake','2048':'2048','Cookie Curling':'Cookie Curling',
  'Fusionne, encore et encore.':'Merge, again and again.','Un petit creux sans fin.':'An endless little snack.','Tout finit par s’emboîter.':'Everything fits in the end.','Les jolies paires font la paire.':'Pretty pairs belong together.','Rebondis de plus belle.':'Bounce back, better.','Un petit air de mystère.':'A hint of mystery.','À toi de faire la ligne.':'Make the line yours.','Un chiffre, une petite victoire.':'One digit, one small win.','Un battement de plus.':'One more flap.','Chaque pièce à sa place.':'Every tile in its place.',
  'Glisse le cookie vers le haut. Deux pâtisseries identiques fusionnent.':'Swipe the cookie up. Two identical pastries merge.',
  'Glisse pour fusionner les nombres identiques.':'Swipe to merge identical numbers.',
  'Glisse pour diriger le serpent. Évite les murs et ta queue.':'Swipe to steer the snake. Avoid the walls and your tail.',
  'Glisse à gauche ou à droite. Touche pour tourner, glisse vers le bas pour poser.':'Swipe left or right. Tap to rotate, swipe down to drop.',
  'Retrouve toutes les paires en un minimum de coups.':'Find all the pairs in as few moves as possible.',
  'Fais glisser la raquette. Touche le plateau pour lancer la balle. 3 vies.':'Slide the paddle. Tap the board to launch the ball. 3 lives.',
  'Dévoile les cases sans mine. Les chiffres comptent les mines voisines.':'Reveal the squares without mines. Numbers count the neighbouring mines.',
  'Aligne 3 symboles. Tu joues les croix, à toi de commencer !':'Line up 3 symbols. You play crosses, you go first!',
  'Chaque ligne, colonne et carré doit contenir les chiffres 1 à 9.':'Each row, column and box must contain the digits 1 to 9.',
  'Touche pour voler. Attrape les pièces entre les obstacles.':'Tap to fly. Catch the coins between the obstacles.',
  'Touche une case voisine du vide. Remets les nombres de 1 à 15 dans l’ordre.':'Tap a tile next to the gap. Put the numbers 1 to 15 back in order.',
  // dialogues génériques
  'Difficulté':'Difficulty','Facile':'Easy','Normal':'Normal','Difficile':'Hard','Jouer':'Play','Annuler':'Cancel','Pause':'Pause','Reprendre':'Resume','Retour aux jeux':'Back to games','Retour aux jeux ?':'Back to games?',
  'Ta partie sera sauvegardée.':'Your game will be saved.','La partie en cours sera perdue.':'The current game will be lost.','La partie en cours sera terminée. Ton record est conservé.':'The current game will end. Your best score is kept.',
  'Quitter la partie':'Quit game','Continuer':'Continue','On recommence ?':'Start over?','Une nouvelle partie, une nouvelle chance.':'A new game, a new chance.',
  'Bien joué !':'Well done!','Partie terminée':'Game over','Rejouer':'Play again','Retour':'Back','Retour au salon':'Back to lobby','Voir le plateau':'View board','Pas encore de record':'No best score yet',
  'Panda roux en papier':'Paper red panda','Valider':'Confirm','Plus tard':'Later','OK':'OK',
  // profil, scores, classements
  'Mes scores':'My scores','Ton pseudo':'Your username','Choisis un nom':'Choose a name','Choisis un pseudo.':'Choose a username.','Ex. Kiara':'e.g. Kiara','Mes records':'My best scores','Joueurs':'Players','Classement':'Leaderboard','Classement à afficher':'Leaderboard to show','Pièces':'Coins',
  'C’est le nom que les autres joueurs verront et chercheront.':'This is the name other players will see and search for.',
  'Les autres joueurs peuvent te trouver et te défier avec ce pseudo.':'Other players can find and challenge you with this username.',
  'Choisis un pseudo pour apparaître dans les classements et être trouvé.':'Choose a username to appear on leaderboards and be found.',
  'Ton pseudo est enregistré sur ce téléphone.':'Your username is saved on this phone.',
  'Installe BagaPlay sur ton écran d’accueil pour avoir un profil en ligne.':'Add BagaPlay to your home screen to get an online profile.',
  'Modifier le pseudo':'Edit username','Chercher un joueur…':'Search for a player…','Chercher un adversaire…':'Search for an opponent…','Joueurs récents':'Recent players','Recherche…':'Searching…','Chargement…':'Loading…','Chargement du profil…':'Loading profile…','Joueur introuvable.':'Player not found.',
  'Aucun autre joueur pour l’instant.':'No other players yet.','Classement indisponible (connexion ?).':'Leaderboard unavailable (connection?).','Personne pour l’instant. À toi !':'Nobody yet. Your turn!',
  // salon, défis
  'Mes parties':'My games','Jouer contre l’ordinateur':'Play against the computer','Contre l’ordinateur':'Against the computer','TOI':'YOU','ORDINATEUR':'COMPUTER','L’ordinateur réfléchit…':'The computer is thinking…','Extrême':'Extreme','Actualiser':'Refresh','Jouer à deux sur ce téléphone':'Two players on this phone','Le jeu en ligne n’est pas activé dans cette version.':'Online play is not enabled in this version.',
  'Pour jouer en ligne, installe BagaPlay sur ton écran d’accueil : touche Partager puis « Sur l’écran d’accueil ».':'To play online, add BagaPlay to your home screen: tap Share, then “Add to Home Screen”.',
  'Choisis un pseudo pour jouer en ligne.':'Choose a username to play online.','Tes parties apparaîtront ici.':'Your games will appear here.','Aucune partie. Cherche un adversaire ci-dessus.':'No games yet. Search for an opponent above.',
  'Ouverture de la partie…':'Opening game…','Envoi du défi…':'Sending challenge…','Défier':'Challenge','Défier aux échecs':'Challenge to chess','Défier aux dames':'Challenge to checkers',
  'Tes parties':'Your games','Mon profil':'My profile','Autre appareil ›':'Other device ›','Mon profil sur un autre appareil':'My profile on another device','Créer un code':'Create a code','Valable 10 minutes, une seule fois.':'Valid for 10 minutes, single use.','J’ai un code venant de mon autre appareil :':'I have a code from my other device:','Utiliser ce code':'Use this code','Ex. K7P2QX':'E.g. K7P2QX','Changer de profil ?':'Switch profile?','Changer':'Switch','Code invalide ou expiré.':'Invalid or expired code.','1 à toi de jouer':'1 your turn','1 partie':'1 game',
  'Refusé':'Declined','Nulle':'Draw','Gagné':'Won','Perdu':'Lost','Son tour':'Their turn','Nouveau défi':'New challenge','À toi !':'Your turn!',
  'Échecs : règles complètes. Touche une pièce puis sa case d’arrivée.':'Chess: full rules. Tap a piece, then its destination square.',
  'Dames internationales 10×10 : prise obligatoire et majoritaire, dames volantes. Touche une pièce puis chaque case d’arrivée.':'International checkers 10×10: captures are mandatory and you must take the most pieces, kings fly. Tap a piece, then each landing square.',
  // partie à deux
  '↶ Annuler le coup':'↶ Undo move','Proposer nulle':'Offer draw','Nulle proposée…':'Draw offered…','Abandonner':'Resign','Abandonner ?':'Resign?','Ton adversaire gagnera la partie.':'Your opponent will win the game.',
  'Refuser le défi':'Decline challenge','Refuser le défi ?':'Decline challenge?','La partie sera annulée, sans gagnant.':'The game will be cancelled, with no winner.','Refuser':'Decline','Accepter':'Accept','Nulle proposée':'Draw offered',
  'Promotion':'Promotion','Dame':'Queen','Tour':'Rook','Fou':'Bishop','Cavalier':'Knight','Partie terminée.':'Game over.','Victoire !':'Victory!','Défaite':'Defeat','Partie nulle':'Draw','Défi refusé':'Challenge declined','Tu as refusé ce défi.':'You declined this challenge.',
  'Une prise est obligatoire avec une autre pièce.':'A capture is mandatory with another piece.','Connexion perdue, nouvel essai…':'Connection lost, retrying…','case vide':'empty square',
  'mat':'checkmate','pat':'stalemate','matériel insuffisant':'insufficient material','règle des 50 coups':'50-move rule','triple répétition':'threefold repetition','abandon':'resignation','nulle acceptée':'draw agreed','bloqué':'blocked','plus de pièces':'no pieces left','25 coups de dames sans prise':'25 king moves without a capture','défi refusé':'challenge declined',
  // messages du serveur
  'Ce pseudo est déjà pris.':'This username is already taken.','pseudo manquant':'missing username','joueur introuvable':'player not found','tu ne peux pas te défier toi-même':'you can’t challenge yourself','trop de défis en attente':'too many pending challenges','partie introuvable':'game not found','tu ne joues pas dans cette partie':'you’re not in this game','partie terminée ou pas commencée':'game over or not started','coup désynchronisé':'move out of sync','ce n\'est pas ton tour':'it’s not your turn','impossible de refuser cette partie':'this game can’t be declined','partie pas en cours':'game not in progress','pas de nulle proposée':'no draw offered',
  'Pas de connexion internet.':'No internet connection.','Choisis d’abord un pseudo.':'Choose a username first.','Le jeu en ligne n’est pas activé.':'Online play is not enabled.',
  // Cookie Curling
  '↶ Annuler le lancer':'↶ Undo throw','Terminer la partie':'End game','Les huit pâtisseries à créer':'The eight pastries to create','TOUT DOUX':'GENTLY','BIEN DOSÉ':'JUST RIGHT','ÉNERGIQUE':'POWERFUL','Cookie':'Cookie','Tartelette':'Tartlet','Tarte citron':'Lemon tart','Moelleux chocolat':'Chocolate fondant','Fraisier':'Strawberry cake','Délice myrtille':'Blueberry delight','Gâteau de fête':'Party cake','Pièce montée':'Wedding tower',
  'Tout commence par une pépite.':'It all starts with a chip.','Un cœur de confiture.':'A jam heart.','Un peu de soleil.':'A bit of sunshine.','Le chocolat, évidemment.':'Chocolate, of course.','La vie en rose.':'La vie en rose.','Une douceur bien ronde.':'A nicely round treat.','Il y a quelque chose à fêter.':'There’s something to celebrate.','Le grand chef-d’œuvre !':'The grand masterpiece!',
  // jeux d'arcade (canvas)
  'Glisse pour commencer':'Swipe to start','Glisse pour déplacer, touche pour tourner.':'Swipe to move, tap to rotate.','À SUIVRE':'NEXT','LIGNES':'LINES','NIVEAU':'LEVEL','Un petit envol':'Little Flight','Touche l’écran pour battre des ailes.':'Tap the screen to flap.','Prêt pour le rebond ?':'Ready to bounce?','Touche pour lancer, glisse pour guider.':'Tap to launch, slide to steer.','Touche pour lancer · Glisse pour guider':'Tap to launch · Slide to steer',
  'Tu as rempli tout le jardin !':'You filled the whole garden!','Les 5 jardins sont libérés !\nUn sans-faute tout en rebonds.':'All 5 gardens are cleared!\nA flawless bouncing run.',
  // jeux de réflexion
  'Le petit adversaire réfléchit…':'Your little opponent is thinking…','Les croix ont gagné !':'Crosses win!','Les ronds gagnent cette fois. Tente une nouvelle stratégie !':'Noughts win this time. Try a new strategy!','Les ronds ont gagné !':'Noughts win!','Mode : 2 joueurs':'Mode: 2 players','Mode : solo':'Mode: solo','À toi ! Tu joues les croix.':'Your turn! You play crosses.','Égalité ! Vous avez bien défendu votre place.':'Tie! You both held your ground.','Au tour des croix.':'Crosses to play.','Au tour des ronds.':'Noughts to play.',
  'Une petite mine se cachait ici.\nLe premier clic est toujours sans danger.':'A little mine was hiding here.\nThe first tap is always safe.','⌕ Dévoiler une case':'⌕ Reveal a square','⚑ Poser un drapeau':'⚑ Place a flag','✎ Notes':'✎ Notes','Effacer':'Erase','Case vide':'Empty square','Espace vide':'Empty space','drapeau':'flag','mine':'mine','case cachée':'hidden square',
  // version web / installation
  'Installe BagaPlay':'Install BagaPlay'
 };
 var T=function(s){return translate(s)};
 var P=[
  [/^(\d+) coups?$/,function(m){return m[1]+(m[1]==='1'?' move':' moves')}],
  [/^(\d+) victoires?$/,function(m){return m[1]+(m[1]==='1'?' win':' wins')}],
  [/^(\d+) s$/,function(m){return m[0]}],
  [/^✦ Record : (.+)$/,function(m){return '✦ Best: '+(T(m[1])||m[1])}],
  [/^✦ (\d+) (victoires?) en ligne$/,function(m){return '✦ '+T(m[1]+' '+m[2])+' online'}],
  [/^(Nouveau record ! |Record : )(.+)$/,function(m){return (m[1]==='Record : '?'Best: ':'New best! ')+(T(m[2])||m[2])}],
  [/^● À toi de jouer( \((\d+)\))?$/,function(m){return '● Your turn'+(m[1]||'')}],
  [/^Jouer à (.+)$/,function(m){return 'Play '+(T(m[1])||m[1])}],
  [/^(.+) : plateau tactile$/,function(m){return (T(m[1])||m[1])+': touch board'}],
  [/^\+(\d+) pièces$/,function(m){return '+'+m[1]+' coins'}],
  [/^Total : (\d+)$/,function(m){return 'Total: '+m[1]}],
  [/^ PIÈCES$/,function(){return ' COINS'}],
  [/^Aucun joueur ne commence par « (.*) »\.$/,function(m){return 'No player starts with “'+m[1]+'”.'}],
  [/^Défier (.+) \?$/,function(m){return 'Challenge '+m[1]+'?'}],
  [/^Une partie de (échecs|dames|puissance 4) commence\. (.+) reçoit une notification et joue quand il veut\.$/,function(m){return 'A game of '+({'échecs':'chess',dames:'checkers','puissance 4':'Connect Four'})[m[1]]+' starts. '+m[2]+' gets a notification and plays whenever they like.'}],
  [/^BagaPlay ([\d.]+) · Sans pub, sans compte\.$/,function(m){return 'BagaPlay '+m[1]+' · No ads, no account.'}],
 [/^(.+) · (Facile|Normal|Difficile|Extrême|Expert)$/,function(m){return (T(m[1])||m[1])+' · '+T(m[2])}],
 [/^✦ ([FNDX] .+)$/,function(m){return '✦ '+m[1].split(' · ').map(function(part){var k=part.slice(0,1),v=part.slice(2);return ({F:'E',N:'N',D:'H',X:'X'})[k]+' '+(T(v)||v)}).join(' · ')}],
 [/^Carte (.+) \(corail\)$/,function(m){return 'Card '+m[1]+' (coral)'}],
 [/^jeton (rouge|jaune), colonne (\d+)$/,function(m){return (m[1]==='rouge'?'red':'yellow')+' disc, column '+m[2]}],
 [/^case vide, colonne (\d+)$/,function(m){return 'empty square, column '+m[1]}],
 [/^(\d+) jeux$/,function(m){return m[1]+' games'}],
  [/^Serveur indisponible \((\d+)\)\.$/,function(m){return 'Server unavailable ('+m[1]+').'}],
  [/^Coup non envoyé : (.+)$/,function(m){return 'Move not sent: '+(T(m[1])||m[1])}],
  // parties à deux
  [/^(\d+) à toi de jouer$/,function(m){return m[1]+' your turn'}],
  [/^(\d+) parties$/,function(m){return m[1]+' games'}],
  [/^Profil (.+) activé\.$/,function(m){return 'Profile '+m[1]+' activated.'}],
  [/^Pour jouer en tant que (.+) sur un autre téléphone, crée un code ici puis tape-le là-bas \(Réglages › Mon profil\)\.$/,function(m){return 'To play as '+m[1]+' on another phone, create a code here and type it there (Settings › My profile).'}],
  [/^Cet appareil n’utilisera plus le profil (.+)\. Tes records enregistrés sur ce téléphone sont conservés\.$/,function(m){return 'This device will stop using the profile '+m[1]+'. Records saved on this phone are kept.'}],
  [/^(Échec ! )?Aux (blancs|noirs|rouges|jaunes) de jouer\.(?: Prise obligatoire \((\d+)\)\.)?$/,function(m){return (m[1]?'Check! ':'')+({blancs:'White',noirs:'Black',rouges:'Red',jaunes:'Yellow'})[m[2]]+' to play.'+(m[3]?' Capture is mandatory ('+m[3]+').':'')}],
  [/^(Échec ! )?À toi de jouer \((blancs|noirs|rouges|jaunes)\)\.(?: Prise obligatoire \((\d+)\)\.)?$/,function(m){return (m[1]?'Check! ':'')+'Your turn ('+({blancs:'white',noirs:'black',rouges:'red',jaunes:'yellow'})[m[2]]+').'+(m[3]?' Capture is mandatory ('+m[3]+').':'')}],
  [/^(Échec ! )?Au tour de (.+)…$/,function(m){return (m[1]?'Check! ':'')+m[2]+'’s turn…'}],
  [/^(.+) te défie ! Joue ton premier coup, ou refuse le défi\.$/,function(m){return m[1]+' challenges you! Make your first move, or decline.'}],
  [/^(.+) te défie et commence\. Tu pourras jouer ensuite, ou refuser\.$/,function(m){return m[1]+' challenges you and moves first. You can play next, or decline.'}],
  [/^(Tu as battu l’ordinateur|L’ordinateur gagne)(?: \((.+)\))?\.$/,function(m){return (m[1][0]==='T'?'You beat the computer':'The computer wins')+(m[2]?' ('+(T(m[2])||m[2])+')':'')+'.'}],
 [/^À toi de jouer\.(?: Prise obligatoire \((\d+)\)\.)?$/,function(m){return 'Your turn.'+(m[1]?' Capture is mandatory ('+m[1]+').':'')}],
 [/^Partie nulle(?: \((.+)\))?\.$/,function(m){return 'Draw'+(m[1]?' ('+(T(m[1])||m[1])+')':'')+'.'}],
  [/^(.+) gagne(?: \((.+)\))?\.$/,function(m){var w=({Blancs:'White',Noirs:'Black',Rouges:'Red',Jaunes:'Yellow'})[m[1]]||m[1];return w+' wins'+(m[2]?' ('+(T(m[2])||m[2])+')':'')+'.'}],
  [/^Victoire des (blancs|noirs|rouges|jaunes) !$/,function(m){return ({blancs:'White',noirs:'Black',rouges:'Red',jaunes:'Yellow'})[m[1]]+' wins!'}],
  [/^(.+) a refusé ton défi\.$/,function(m){return m[1]+' declined your challenge.'}],
  [/^(.+) te propose la nulle\.$/,function(m){return m[1]+' offers you a draw.'}],
  [/^(roi|dame|tour|fou|cavalier|pion) (blanc|noir)(, destination possible)?$/,function(m){return ({roi:'king',dame:'queen',tour:'rook',fou:'bishop',cavalier:'knight',pion:'pawn'})[m[1]]+' '+(m[2]==='blanc'?'white':'black')+(m[3]?', possible destination':'')}],
  [/^case vide, destination possible$/,function(){return 'empty square, possible destination'}],
  // Cookie Curling
  [/^(\d+) lancers? · ([^.·]+)(?: · Combo ×(\d+))?\. (.+)$/,function(m){var tail={'Glisse le cookie du bas vers le haut.':'Swipe the cookie from the bottom up.','Attends l’arrêt des gâteaux.':'Wait for the cakes to stop.','Zone encombrée : annule le lancer ou termine la partie.':'Launch zone blocked: undo the throw or end the game.'}[m[4]]||m[4];return m[1]+(m[1]==='1'?' throw':' throws')+' · '+(T(m[2])||m[2])+(m[3]?' · Combo ×'+m[3]:'')+'. '+tail}],
  [/^([^·]+) · (\d+) lancers · (\d+) points$/,function(m){return (T(m[1])||m[1])+' · '+m[2]+' throws · '+m[3]+' points'}],
  // arcade
  [/^JARDIN (\d+)$/,function(m){return 'GARDEN '+m[1]}],
  [/^NIVEAU (\d+)$/,function(m){return 'LEVEL '+m[1]}],
  [/^Ton serpent a récolté (\d+) points\.\nPrêt pour une nouvelle promenade \?$/,function(m){return 'Your snake collected '+m[1]+' points.\nReady for another stroll?'}],
  [/^La pile a atteint le ciel\.\n(\d+) lignes et (\d+) points\.$/,function(m){return 'The stack reached the sky.\n'+m[1]+' lines and '+m[2]+' points.'}],
  [/^Plus de balles, mais (\d+) points récoltés !$/,function(m){return 'Out of balls, but '+m[1]+' points scored!'}],
  [/^Tu as franchi (\d+) obstacles?\.\nUn nouveau départ t’attend !$/,function(m){return 'You cleared '+m[1]+(m[1]==='1'?' obstacle':' obstacles')+'.\nA fresh start awaits!'}],
  [/^Un peu trop près du bord !\n(\d+) obstacles franchis\.$/,function(m){return 'A bit too close to the edge!\n'+m[1]+' obstacles cleared.'}],
  [/^(\d+) points · Niveau (\d+)$/,function(m){return m[1]+' points · Level '+m[2]}],
  [/^(\d+) niveaux terminés · (\d+) points$/,function(m){return m[1]+' levels complete · '+m[2]+' points'}],
  // réflexion
  [/^La tuile 2048 est à toi !\n(\d+) points de douceur\.$/,function(m){return 'The 2048 tile is yours!\n'+m[1]+' sweet points.'}],
  [/^Plus de place sur le plateau\.\nTon score : (\d+) points\.$/,function(m){return 'No more room on the board.\nYour score: '+m[1]+' points.'}],
  [/^Paires réunies en (\d+) coups\.$/,function(m){return 'All pairs found in '+m[1]+' moves.'}],
  [/^Terrain dégagé en (.+) !$/,function(m){return 'Field cleared in '+m[1]+'!'}],
  [/^Les 81 cases sont en harmonie\.\nTerminé en (.+?)( avec un peu d’aide\.| !)$/,function(m){return 'All 81 squares are in harmony.\nFinished in '+m[1]+(m[2]===' !'?'!':' with a little help.')}],
  [/^Tout est à sa place !\nPuzzle terminé en (\d+) coups\.$/,function(m){return 'Everything is in its place!\nPuzzle solved in '+m[1]+' moves.'}],
  [/^(\d+) drapeaux restants · (\d+)\/54 cases sûres dévoilées\.$/,function(m){return m[1]+' flags left · '+m[2]+'/54 safe squares revealed.'}],
  [/^Indice · (\d+)$/,function(m){return 'Hint · '+m[1]}],
  [/^(\d+) mines voisines$/,function(m){return m[1]+' neighbouring mines'}],
  [/^Ligne (\d+), colonne (\d+), (.+)$/,function(m){return 'Row '+m[1]+', column '+m[2]+', '+(T(m[3])||m[3])}],
  [/^Carte (.+)$/,function(m){return 'Card '+m[1]}],
  [/^Retourner la carte (\d+)$/,function(m){return 'Flip card '+m[1]}],
  [/^Case (\d+)$/,function(m){return 'Square '+m[1]}],
  [/^Déplacer la pièce (\d+)$/,function(m){return 'Move tile '+m[1]}]
 ];
 var cache=new Map();
 function translate(s){
  if(lang==='fr'||!s)return null;
  if(cache.has(s))return cache.get(s);
  var lead=s.match(/^\s*/)[0],trail=s.match(/\s*$/)[0],core=s.trim(),r=null;
  if(core){if(Object.prototype.hasOwnProperty.call(D,core))r=D[core];else for(var i=0;i<P.length;i++){var m=core.match(P[i][0]);if(m){r=P[i][1](m);break}}}
  r=r==null?null:lead+r+trail;
  if(cache.size>5000)cache.clear();cache.set(s,r);return r;
 }
 window.bagaT=function(s){return translate(s)||s};
 if(lang==='fr')return;

 var ATTRS=['aria-label','placeholder','title'];
 function fixNode(n){
  if(n.nodeType===3){var t=translate(n.nodeValue);if(t!=null&&t!==n.nodeValue)n.nodeValue=t;return}
  if(n.nodeType!==1)return;
  if(n.tagName==='SCRIPT'||n.tagName==='STYLE')return;
  for(var a=0;a<ATTRS.length;a++){var v=n.getAttribute(ATTRS[a]);if(v){var t2=translate(v);if(t2!=null&&t2!==v)n.setAttribute(ATTRS[a],t2)}}
  for(var c=n.firstChild;c;c=c.nextSibling)fixNode(c);
 }
 new MutationObserver(function(list){for(var i=0;i<list.length;i++){var m=list[i];
  if(m.type==='characterData')fixNode(m.target);
  else if(m.type==='attributes'){var v=m.target.getAttribute(m.attributeName),t=translate(v);if(t!=null&&t!==v)m.target.setAttribute(m.attributeName,t)}
  else for(var j=0;j<m.addedNodes.length;j++)fixNode(m.addedNodes[j]);}})
  .observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:ATTRS});
 document.addEventListener('DOMContentLoaded',function(){fixNode(document.body);document.title='BagaPlay · A little break, a big smile.'});
 // textes dessinés dans les jeux (canvas)
 var C=window.CanvasRenderingContext2D&&CanvasRenderingContext2D.prototype;
 if(C)['fillText','strokeText','measureText'].forEach(function(k){var f=C[k];C[k]=function(text){var t=typeof text==='string'?translate(text):null;if(t!=null){var args=Array.prototype.slice.call(arguments);args[0]=t;return f.apply(this,args)}return f.apply(this,arguments)}});
})();
