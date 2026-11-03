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
  'Défier un joueur…':'Challenge a player…','Inviter jusqu’à 5 joueurs…':'Invite up to 5 players…','Chercher un joueur…':'Search for a player…','Jouer à plusieurs sur ce téléphone':'Several players on this phone','Inviter':'Invite','6 joueurs au maximum.':'6 players at most.','Invitations envoyées':'Invitations sent','Invitation':'Invitation','Annulée':'Cancelled','À toi de lancer':'Your throw','À ton équipe':'Your team','Ton équipe':'Your team','Équipe adverse':'Other team','En attente':'Waiting','À toi':'Your turn','Annuler la partie ?':'Cancel the game?','Les invitations seront retirées.':'The invitations will be withdrawn.','Annuler la partie':'Cancel game','Garder':'Keep','En attente des autres joueurs.':'Waiting for the other players.','Annuler le défi ?':'Cancel the challenge?','Annuler le défi':'Cancel challenge','Défi accepté':'Challenge accepted','Défi refusé':'Challenge declined','Accepter':'Accept','Refuser':'Decline','Aucune partie. Invite des joueurs ci-dessus.':'No games yet. Invite players above.','Aucune partie. Défie un joueur ci-dessus.':'No games yet. Challenge a player above.','Sur ce téléphone':'On this phone','Combien de joueurs ? Les équipes sont tirées au sort, on se passe le téléphone.':'How many players? Teams are drawn at random; pass the phone around.','Nombre de joueurs':'Number of players','Défis reçus':'Challenges received','Activer les notifications ?':'Turn on notifications?','Pour savoir quand on te défie, quand on accepte ton défi et quand c’est ton tour.':'To know when someone challenges you, accepts your challenge, or when it’s your turn.','Activer':'Turn on','Notifications activées':'Notifications on','Notifications désactivées':'Notifications off','Musique':'Music','Bruitages':'Sound effects','Notifications':'Notifications','Activées ✓':'On ✓','Activer ›':'Turn on ›','Bloquées par le téléphone':'Blocked by the phone','Installe l’app d’abord':'Install the app first','Non disponibles ici':'Not available here','Autoriser ›':'Allow ›','Autorisées ✓':'Allowed ✓','Notifications non disponibles ici.':'Notifications are not available here.','Notifications refusées.':'Notifications denied.','Pétanque':'Pétanque','Fin':'End','Vue de dessus':'Top view','Vue du lanceur':'Thrower view','Pointer ou tirer':'Point or shoot','Pointer (toucher pour tirer)':'Pointing (tap to shoot)','Tirer (toucher pour pointer)':'Shooting (tap to point)','Viser à nouveau':'Aim again','Demander à lancer':'Ask to throw','Annuler la demande':'Cancel the request','Joli lancer…':'Nice throw…','Tu lances…':'You throw…','À toi : glisse pour viser, puis relâche':'Your turn: swipe to aim, then release','À toi : vise le cochonnet (6 à 10 m), glisse puis relâche':'Your turn: aim the jack (6 to 10 m), swipe then release','À toi : reviens en vue lanceur pour lancer':'Your turn: go back to thrower view to throw','Appuie, maintiens, relâche pour la force':'Press, hold, release to set the power','Demande envoyée à ton équipe…':'Request sent to your team…','À ton équipe : demande à lancer':'Your team’s turn: ask to throw','Ton équipe choisit qui lance…':'Your team is choosing who throws…','L’équipe adverse joue…':'The other team is playing…','Connexion perdue…':'Connection lost…','Cochonnet hors limites : on relance.':'Jack out of bounds: throw again.','Victoire !':'Victory!','Toi':'You','Ordinateur':'Computer','FORCE':'POWER','Pétanque : terrain en 3D':'Pétanque: 3D pitch','Invite au moins un joueur.':'Invite at least one player.','la partie a déjà commencé':'the game has already started','tu as créé cette partie':'you created this game','pas possible maintenant':'not possible right now','ce n\'est pas à ton équipe de lancer':'it\'s not your team\'s turn','tu n\'as plus de boule':'you have no boules left','pas de demande en cours':'no request pending','c\'est ta demande':'it\'s your own request','pas ton équipe':'not your team','lancer désynchronisé':'throw out of sync','ce n\'est pas à toi de lancer':'it\'s not your turn to throw','partie en cours':'game in progress','défi en attente':'challenge pending','trop de parties en attente':'too many pending games','Pétanque : 2 à 6 joueurs, 2 équipes tirées au sort. Glisse pour viser puis relâche ; appuie, maintiens et relâche pour la force. L’équipe qui n’a pas le point joue. Première équipe à 13 points.':'Pétanque: 2 to 6 players in 2 random teams. Swipe to aim, then release; press, hold and release to set the power. The team that doesn’t hold the point plays. First team to 13 points wins.',
  'Pétanque : 2 à 6 joueurs, 2 équipes tirées au sort. Glisse sur le terrain pour tourner la vue (deux doigts pour zoomer). Pour lancer : glisse le pavé (gauche/droite, haut/bas) et relâche, puis appuie, maintiens et relâche pour la force. L’équipe qui n’a pas le point joue. Première équipe à 13 points.':'Pétanque: 2 to 6 players in 2 random teams. Swipe the pitch to turn the view (two fingers to zoom). To throw: drag the pad (left/right, up/down) and release, then press, hold and release to set the power. The team that doesn’t hold the point plays. First team to 13 points wins.','Quitter la vue de dessus':'Leave top view','Pavé de visée':'Aiming pad','À toi : quitte la vue de dessus pour lancer':'Your turn: leave top view to throw','À toi : vise le cochonnet (6 à 10 m) avec le pavé, puis relâche':'Your turn: aim the jack (6 to 10 m) with the pad, then release','À toi : vise avec le pavé (gauche/droite, haut/bas), puis relâche':'Your turn: aim with the pad (left/right, up/down), then release','Appuie sur le pavé, maintiens, relâche pour la force':'Press the pad, hold, release to set the power','Grille en cours':'Game in progress','Nouvelle grille':'New grid','Ta grille est sauvegardée, tu la retrouveras ici.':'Your grid is saved; you’ll find it here.',
  'Hauteur du lancer':'Throw height','Lancer bas (roulette)':'Low throw (roll)','Lancer moyen (demi-portée)':'Medium throw (half lob)','Lancer haut (plombée)':'High throw (lob)','Boule à lancer : fais glisser vers le haut et relâche':'Boule to throw: swipe up and release','Lance la boule vers le haut, d’un geste vif':'Throw the boule upwards with a quick swipe','À toi : lance le cochonnet (6 à 10 m) : glisse la boule vers le haut et relâche':'Your turn: throw the jack (6 to 10 m): swipe the boule up and release','À toi : lance la boule d’un geste, la vitesse donne la force':'Your turn: throw the boule with a swipe; speed sets the power','Pétanque : 2 à 6 joueurs, 2 équipes tirées au sort. Glisse sur le terrain pour tourner la vue (deux doigts pour zoomer). Pour lancer : fais glisser la boule vers le haut d’un geste et relâche ; la direction du geste donne la direction, sa vitesse la force. Choisis avant la hauteur du lancer. L’équipe qui n’a pas le point joue. Première équipe à 13 points.':'Pétanque: 2 to 6 players in 2 random teams. Swipe the pitch to turn the view (two fingers to zoom). To throw: swipe the boule up and release; the swipe direction sets the direction, its speed the power. Pick the throw height first. The team that doesn’t hold the point plays. First team to 13 points wins.',
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
  'Installe BagaPlay':'Install BagaPlay',
  // 1.9 : bataille navale, binero, mots croisés et fléchés
  'Bataille navale':'Battleship','Binero':'Binairo','Mots croisés':'Crossword','Mots fléchés':'Arrow words',
  'Des 0, des 1, de la logique.':'Zeros, ones and logic.','ZÉRO OU UN':'ZERO OR ONE','Une définition, un mot.':'One clue, one word.','LE PLAISIR DES MOTS':'THE JOY OF WORDS','Suis les flèches.':'Follow the arrows.','À LA FLÈCHE':'ON TARGET',
  'Bataille navale : place tes 5 bateaux (touche un bateau puis une case pour le déplacer, touche-le encore pour le tourner), valide, puis tirez chacun votre tour sur la grille adverse. Le premier qui coule toute la flotte gagne.':'Battleship: place your 5 ships (tap a ship then a square to move it, tap it again to rotate it), confirm, then take turns firing at the other grid. The first to sink the whole fleet wins.',
  'Je suis prêt':'I’m ready','✓ Valider ma flotte':'✓ Confirm my fleet','Tourner le bateau':'Rotate ship','Placer au hasard':'Random placement','Pas de place ici.':'No room here.',
  'Touché !':'Hit!','À l’eau.':'Miss.','JOUEUR 1':'PLAYER 1','JOUEUR 2':'PLAYER 2','L’ordinateur vise…':'The computer is aiming…',
  'À toi de tirer : touche une case de la grille adverse.':'Your shot: tap a square on the enemy grid.',
  'Flotte du joueur 1 en place. Passe le téléphone au joueur 2 pour qu’il place la sienne.':'Player 1’s fleet is ready. Hand the phone to player 2 to place theirs.',
  'Le joueur 1 commence. Passe-lui le téléphone.':'Player 1 goes first. Hand them the phone.',
  'Au tour du joueur 1. Passe-lui le téléphone.':'Player 1’s turn. Hand them the phone.','Au tour du joueur 2. Passe-lui le téléphone.':'Player 2’s turn. Hand them the phone.',
  'Tu as coulé toute la flotte de l’ordinateur !':'You sank the computer’s whole fleet!','L’ordinateur a coulé toute ta flotte.':'The computer sank your whole fleet.','Tu as abandonné.':'You resigned.',
  'Ton défi a été refusé.':'Your challenge was declined.','Défier à la bataille navale':'Challenge to Battleship',
  'Porte-avions':'Carrier','Croiseur':'Battleship','Contre-torpilleur':'Cruiser','Torpilleur':'Destroyer',
  'Touche une case : vide → 0 → 1. Pas trois pareils à la suite, autant de 0 que de 1, pas deux lignes identiques.':'Tap a square: empty → 0 → 1. No three in a row, as many 0s as 1s, no two identical lines.',
  'Touche une case, tape le mot. Les définitions sont dans les cases fléchées.':'Tap a square and type the word. Clues are in the arrow squares (French words).',
  'Touche une case (deux fois pour changer de sens) et tape le mot.':'Tap a square (twice to switch direction) and type the word (French words).',
  // BagaStore
  "Ton supermarché, à ta façon.":"Your supermarket, your way.","JEU DE GESTION":"MANAGEMENT GAME","TRÉSORERIE":"CASH","Ton magasin est sauvegardé, tu le retrouveras ici.":"Your store is saved, you’ll find it here.","Ton magasin actuel sera effacé et tu repartiras de zéro.":"Your current store will be erased and you’ll start from scratch.","Construire":"Build","Stock":"Stock","Équipe":"Team","Compta":"Accounts","Ouvert":"Open","Fermé":"Closed","Tourner la vue à gauche":"Rotate view left","Tourner la vue à droite":"Rotate view right","Zoomer":"Zoom in","Dézoomer":"Zoom out","Recentrer":"Recenter","Tourner":"Rotate","Valider":"Confirm","Terminer":"Done","La 3D (WebGL) n’est pas disponible sur cet appareil.":"3D (WebGL) isn’t available on this device.","Rayons":"Aisles","Frais":"Fresh","À la coupe":"Counters","Caisses":"Checkouts","Réserve":"Stockroom","Murs":"Walls","Déco":"Decor","Agrandir":"Expand","Étagère":"Shelf","Gondole haute":"Tall gondola","Tête de gondole":"End cap","Présentoir à pain":"Bread display","Étal fruits & légumes":"Fruit & veg stand","Vitrine réfrigérée":"Fridge","Congélateur":"Freezer","Boucherie":"Butcher counter","Poissonnerie":"Fish counter","Fromagerie":"Cheese counter","Fournil":"Bakery","Caisse":"Checkout","Caisse automatique":"Self-checkout","Rack de réserve":"Storage rack","Chambre froide":"Cold room","Chambre froide négative":"Freezer room","Quai de livraison":"Loading dock","Plante":"Plant","Éclairage d’ambiance":"Mood lighting","Poubelle":"Bin","Caméra":"Camera","Portique antivol":"Security gate","Mur":"Wall","Porte":"Door","Zone réserve":"Stockroom zone","Zone magasin":"Shop zone","Démolir":"Demolish","Touche le début puis la fin du mur.":"Tap the start then the end of the wall.","Touche un mur pour y mettre une porte (employés seulement vers la réserve).":"Tap a wall to add a door (staff only into the stockroom).","Touche deux coins : les clients n’y entrent pas.":"Tap two corners: customers don’t go there.","Touche deux coins pour rendre la zone aux clients.":"Tap two corners to open the area to customers.","Touche un meuble ou un mur : il est revendu à moitié prix.":"Tap a fixture or a wall: it is sold back at half price.","Caissier·ère":"Cashier","Employé·e de rayon":"Shelf stocker","Agent d’entretien":"Cleaner","Boucher·ère":"Butcher","Poissonnier·ère":"Fishmonger","Fromager·ère":"Cheesemonger","Boulanger·ère":"Baker","Tient une caisse.":"Runs a checkout.","Met en rayon depuis la réserve.":"Restocks shelves from the stockroom.","Nettoie le magasin.":"Keeps the store clean.","Tient la boucherie.":"Runs the butcher counter.","Tient la poissonnerie.":"Runs the fish counter.","Tient la fromagerie.":"Runs the cheese counter.","Tient le fournil.":"Runs the bakery.","Fruits & légumes":"Fruit & veg","Pain & viennoiseries":"Bread & pastries","Crèmerie":"Dairy","Traiteur":"Deli","Viande":"Meat","Poisson":"Fish","Fromages":"Cheese","Surgelés & glaces":"Frozen food","Épicerie salée":"Pantry","Biscuits & gâteaux":"Biscuits & cakes","Petit-déjeuner":"Breakfast","Boissons":"Drinks","Vins & alcools":"Wine & spirits","Hygiène & beauté":"Health & beauty","Entretien & maison":"Household","Ambiant":"Ambient","Surgelé":"Frozen","Prospectus":"Flyers","Radio locale":"Local radio","Rend le magasin plus agréable":"Makes the store nicer","Moins de vols":"Less theft","Moins de saletés":"Less mess","Avec caissier·ère":"Needs a cashier","Sans personnel, plus de vols":"No staff, more theft","Contre un mur extérieur":"Against an outside wall","Vers le nord":"To the north","Vers l’ouest":"To the west","Vers l’est":"To the east","Impossible":"Not possible","Le terrain s’arrête ici.":"The plot ends here.","Stock et prix":"Stock and prices","Livraison chaque nuit au quai, selon ton budget.":"Delivered to the dock every night, within your budget.","Budget d’achat":"Purchase budget","Répartir selon les ventes":"Split by sales","Livraison express (+15 %)":"Express delivery (+15%)","Rayon":"Aisle","Achat":"Buy","Marge":"Margin","pas en rayon":"not on sale","aucune":"none","Stock : en rayon / en réserve. Marge habituelle des clients : autour de 30 % (60 % pour le pain). Plus cher, ils achètent moins et viennent moins ; moins cher, ils reviennent plus.":"Stock: on shelves / in the stockroom. Customers expect a margin of about 30% (60% for bread). Pricier and they buy less and come less; cheaper and they come back more.","Trésorerie":"Cash","Crédit restant":"Loan left","Réputation":"Reputation","Clients attendus":"Expected customers","— Ce mois-ci —":"— This month —","Chiffre d’affaires":"Revenue","Achats de marchandises":"Goods purchased","Travaux et équipement":"Building and equipment","Publicité":"Advertising","Pertes (périmés)":"Spoilage","Vols":"Theft","— À payer en fin de mois —":"— Due at month end —","Salaires (estimés)":"Wages (estimate)","Électricité":"Electricity","Remboursement du crédit":"Loan repayment","* déjà compris dans les achats : marchandise perdue ou volée.":"* already included in purchases: goods lost or stolen.","Banque":"Bank","Mois précédents":"Previous months","En rayon":"On shelves","↻ Tourner":"↻ Rotate","Vendre":"Sell","Clients":"Customers","Satisfaction":"Satisfaction","Achats":"Purchases","Salaires":"Wages","Crédit":"Loan","Agios":"Overdraft fees","Résultat":"Result","Continuer":"Continue","Nouvelle partie":"New game","Faillite":"Bankrupt","La banque ferme le magasin.":"The bank closes the store.","Bien joué, le magasin gagne de l’argent.":"Well done, the store is making money.","Le mois est négatif : regarde les prix, le stock et l’équipe.":"The month is negative: check prices, stock and staff.","Tenue par un·e caissier·ère.":"Staffed by a cashier.","Personne à cette caisse : embauche un·e caissier·ère (Équipe).":"Nobody at this checkout: hire a cashier (Team).","Le comptoir est tenu.":"The counter is staffed.","Bienvenue dans ton magasin !":"Welcome to your store!","Tu viens d’acheter une supérette de 400 m².":"You’ve just bought a 400 m² convenience store.","Construis tes rayons, frigos, caisses (menu Construire). Le fond gris est la réserve : racks, chambres froides et quai de livraison s’y installent.":"Build your shelves, fridges and checkouts (Build menu). The grey area at the back is the stockroom: racks, cold rooms and the loading dock go there.","Embauche des caissiers, des employés de rayon et un agent d’entretien (Équipe).":"Hire cashiers, shelf stockers and a cleaner (Team).","Choisis ton budget d’achat, la répartition et tes marges (Stock). Les livraisons arrivent chaque nuit ; la livraison express te dépanne tout de suite.":"Pick your purchase budget, its split and your margins (Stock). Deliveries arrive every night; express delivery helps right away.","Ouvre le magasin ! Fin de mois : salaires, électricité et crédit. Garde un œil sur la trésorerie.":"Open the store! At month end: wages, electricity and the loan. Keep an eye on your cash.","Fais glisser pour te déplacer, pince pour zoomer, ⟲ ⟳ pour tourner la vue.":"Drag to move, pinch to zoom, ⟲ ⟳ to rotate the view.","C’est parti":"Let’s go","Porte posée.":"Door added.","C’est fait.":"Done.","Vendu.":"Sold.","Campagne lancée !":"Campaign started!","Le magasin s’agrandit !":"The store is growing!","Répartition recalculée d’après les ventes du mois.":"Split recalculated from this month’s sales.","Bienvenue !":"Welcome!","Bon retour dans ton magasin !":"Welcome back to your store!","Lancer":"Start","Emprunter":"Borrow","Agrandir le magasin ?":"Expand the store?","Nouvel emprunt ?":"New loan?","Démolir le mur":"Demolish the wall","Touche la fin du mur.":"Tap the end of the wall.","Touche le coin opposé.":"Tap the opposite corner.","Hors du magasin.":"Outside the store.","Il y a un mur.":"There’s a wall.","Place déjà prise.":"Already taken.","À placer dans la réserve.":"Goes in the stockroom.","À placer dans le magasin, pas dans la réserve.":"Goes in the shop, not the stockroom.","Laisse l’entrée libre.":"Keep the entrance clear.","Le quai se place contre un mur extérieur (pas la façade).":"The dock goes against an outside wall (not the front).","Il faut une case libre devant.":"It needs a free square in front.","Cela bloquerait l’accès à un meuble.":"That would block access to a fixture.","Pas assez d’argent.":"Not enough money.","Rien à construire ici.":"Nothing to build here.","Touche un mur.":"Tap a wall.","Rien à démolir ici.":"Nothing to demolish here.","Rien à changer ici.":"Nothing to change here.","Il faut un quai de livraison.":"You need a loading dock.","Il faut de la place en réserve.":"You need stockroom space.","La réserve est pleine.":"The stockroom is full.","Ajoute des rayons (menu Construire).":"Add some shelves (Build menu).","Il faut au moins une caisse.":"You need at least one checkout.","Embauche un·e caissier·ère.":"Hire a cashier.","Installe des racks dans la réserve.":"Put racks in the stockroom.","Il faut un quai de livraison dans la réserve.":"You need a loading dock in the stockroom.","Embauche un·e employé·e de rayon.":"Hire a shelf stocker.","Budget d’achat à 0 : aucune livraison.":"Purchase budget at 0: no deliveries.","Tout est prêt : ouvre le magasin !":"All set: open the store!",
  "Annuler":"Cancel","Fini":"Done","Touche le sol pour placer.":"Tap the floor to place.","Touche deux coins hors du magasin.":"Tap two corners outside the store.","Agrandir":"Expand","Tracer une extension":"Draw an extension","Sol et murs compris":"Floor and walls included","Pas devant la façade.":"Not in front of the store.","Trace la zone hors du magasin.":"Draw the area outside the store.","La zone doit toucher le magasin.":"The area must touch the store.","+ attractif":"+ appeal","− vols":"− theft","− saleté":"− mess","Statistiques":"Statistics","Budget / jour":"Budget / day","Livraison express +15 %":"Express delivery +15%","% par défaut":"Default %","Rayon / réserve":"Shelf / stock","Populaire":"Popular","Impopulaire":"Unpopular","Vide":"Empty","Les statistiques apparaissent après la première journée d’ouverture.":"Statistics appear after the first day of business.","Clients / jour":"Customers / day","Panier moyen":"Average basket","Articles / panier":"Items / basket","Ventes / jour":"Sales / day","Pertes / jour":"Spoilage / day","Vols / jour":"Theft / day","Réserves":"Stockrooms","Mécontentement (pour 100 clients)":"Complaints (per 100 customers)","Rayon vide":"Empty shelf","Trop cher":"Too expensive","Pas vendu ici":"Not sold here","Satisfaction (30 jours)":"Satisfaction (30 days)","Clients par jour":"Customers per day","Rentrées":"Income","Dépenses":"Expenses","Bénéfice par jour":"Profit per day","CA hier":"Revenue yesterday","CA du mois":"Revenue this month","Bénéfice 30 j":"Profit 30 days","Ventes du mois par rayon":"This month’s sales by aisle","Dépenses par jour":"Expenses per day","Ce mois-ci":"This month","Marchandises":"Goods","Travaux":"Building","Perdu":"Lost","Périmés":"Spoiled","Mensualité":"Monthly payment","Pas de caissier·ère":"No cashier","Pas encore de données":"No data yet","Bienvenue dans ton magasin !":"Welcome to your store!","Construis rayons, frigos et caisses. Le sol gris est la réserve : racks, chambres froides et quai de livraison.":"Build shelves, fridges and checkouts. The grey floor is the stockroom: racks, cold rooms and the loading dock.","Embauche ton équipe, règle ton budget d’achat et tes marges.":"Hire your team, set your purchase budget and margins.","Ouvre le magasin ! Fin de mois : salaires, électricité et crédit.":"Open the store! At month end: wages, electricity and the loan."
 };
 var T=function(s){return translate(s)};
 function storeCat(x){for(var k in D)if(k.toLowerCase()===x.toLowerCase())return D[k];return x}
 var P=[
  // BagaStore
  [/^Construire · (.+)$/,function(m){return 'Build · '+m[1]}],
  [/^Équipe · (.+) \/ mois$/,function(m){return 'Team · '+m[1]+' / month'}],
  [/^Agrandir : (\d+) m²$/,function(m){return 'Expand: '+m[1]+' m²'}],
  [/^Surface : (\d+) m² · vente (\d+) m²$/,function(m){return 'Size: '+m[1]+' m² · shop floor '+m[2]+' m²'}],
  [/^Caisses tenues : (\d+) \/ (\d+)$/,function(m){return 'Staffed checkouts: '+m[1]+' / '+m[2]}],
  [/^Livraison express : (.+)$/,function(m){return 'Express delivery: '+m[1]}],
  [/^Jour (\d+) · (\d+) clients · (.+)$/,function(m){return 'Day '+m[1]+' · '+m[2]+' customers · '+m[3]}],
  [/^dernier : (.+)$/,function(m){return 'latest: '+m[1]}],
  [/^(\d+) art\.$/,function(m){return m[1]+' items'}],
  [/^(\d+,\d\d) €( · (\d+)\/j)?$/,function(m){return m[1]+' €'+(m[2]?' · '+m[3]+'/d':'')}],
  [/^(\d+) \/ j$/,function(m){return m[1]+' / d'}],
  [/^Charges fixes : (.+) \/ mois$/,function(m){return 'Fixed costs: '+m[1]+' / month'}],
  [/^Publicité · jusqu’au jour (\d+)$/,function(m){return 'Advertising · until day '+m[1]}],
  [/^(Prospectus|Radio locale) (.+) · \+(\d+) % (\d+) j$/,function(m){return T(m[1])+' '+m[2]+' · +'+m[3]+'% '+m[4]+' d'}],
  [/^(Prospectus|Radio locale) lancée !$/,function(m){return T(m[1])+' started!'}],
  [/^Emprunter (.+) · \+(.+)\/mois$/,function(m){return 'Borrow '+m[1]+' · +'+m[2]+'/month'}],
  [/^\+(.+) · \+(.+)\/mois$/,function(m){return '+'+m[1]+' · +'+m[2]+'/month'}],
  [/^Vendre (.+)$/,function(m){return 'Sell '+m[1]}],
  [/^Mois (\d+)$/,function(m){return 'Month '+m[1]}],
  [/^(\d+)×(\d+)$/,function(m){return m[0]}],
  [/^MOIS (\d+) · JOUR (\d+)$/,function(m){return 'MONTH '+m[1]+' · DAY '+m[2]}],
  [/^(\d+) h (\d\d)$/,function(m){return m[1]+':'+m[2]}],
  [/^★ (\d+) · (\d+) clients? · (ouvert|fermé|fermeture…)$/,function(m){return '★ '+m[1]+' · '+m[2]+(m[2]==='1'?' customer · ':' customers · ')+({'ouvert':'open','fermé':'closed','fermeture…':'closing…'})[m[3]]}],
  [/^Trésorerie : (.+)$/,function(m){return 'Cash: '+m[1]}],
  [/^Mois (\d+), jour (\d+)$/,function(m){return 'Month '+m[1]+', day '+m[2]}],
  [/^(\d+) articles( (ambiant|frais|surgelé))?( · (\d+) €\/mois d’électricité)?$/,function(m){return m[1]+(m[3]?' '+({ambiant:'ambient',frais:'fresh','surgelé':'frozen'})[m[3]]:'')+' items'+(m[5]?' · '+m[5]+' €/month electricity':'')}],
  [/^(.+) · (\d+) €\/mois d’électricité$/,function(m){return (T(m[1])||m[1])+' · '+m[2]+' €/month electricity'}],
  [/^avec (boucher·ère|poissonnier·ère|fromager·ère|boulanger·ère)$/,function(m){return 'with a '+({'boucher·ère':'butcher','poissonnier·ère':'fishmonger','fromager·ère':'cheesemonger','boulanger·ère':'baker'})[m[1]]}],
  [/^\+(\d+) m² \((\d+) m sur tout le côté\)$/,function(m){return '+'+m[1]+' m² ('+m[2]+' m along the whole side)'}],
  [/^Surface actuelle : (\d+) m² \(vente (\d+) m²\)\. La façade avec l’entrée ne bouge pas\.$/,function(m){return 'Current size: '+m[1]+' m² (shop floor '+m[2]+' m²). The front with the entrance stays put.'}],
  [/^Hier : (\d+) clients, ventes au prix d’achat ≈ (.+), pertes (.+)\.$/,function(m){return 'Yesterday: '+m[1]+' customers, sales at cost ≈ '+m[2]+', spoilage '+m[3]+'.'}],
  [/^Réserve (ambiant|frais|surgelé)$/,function(m){return ({ambiant:'Ambient',frais:'Fresh','surgelé':'Frozen'})[m[1]]+' storage'}],
  [/^(Ambiant|Frais|Surgelé) · (.+) € l’article$/,function(m){return T(m[1])+' · '+m[2]+' € each'}],
  [/^Masse salariale : (.+) \/ mois \(charges comprises\)$/,function(m){return 'Payroll: '+m[1]+' / month (all costs included)'}],
  [/^(.+\.) (.+ €)\/mois\.$/,function(m){return (T(m[1])||m[1])+' '+m[2]+'/month.'}],
  [/^Caisses tenues : (\d+) \/ (\d+)\. Les salaires sont payés à la fin du mois, au prorata des jours travaillés\.$/,function(m){return 'Staffed checkouts: '+m[1]+' / '+m[2]+'. Wages are paid at month end, pro rata of days worked.'}],
  [/^(.+ €) \((.+ €)\/mois\)$/,function(m){return m[1]+' ('+m[2]+'/month)'}],
  [/^(\d+) \/ jour$/,function(m){return m[1]+' / day'}],
  [/^(.+ €) \/ jour$/,function(m){return m[1]+' / day'}],
  [/^(Prospectus|Radio locale) : (.+) \(\+(\d+) % de clients, (\d+) j\)$/,function(m){return T(m[1])+': '+m[2]+' (+'+m[3]+'% customers, '+m[4]+' days)'}],
  [/^Publicité( \(en cours jusqu’au jour (\d+)\))?$/,function(m){return 'Advertising'+(m[2]?' (running until day '+m[2]+')':'')}],
  [/^Emprunter (.+) \(\+(.+)\/mois\)$/,function(m){return 'Borrow '+m[1]+' (+'+m[2]+'/month)'}],
  [/^Mois (\d+) · CA (.+)$/,function(m){return 'Month '+m[1]+' · revenue '+m[2]}],
  [/^Revente : (.+)$/,function(m){return 'Resale: '+m[1]}],
  [/^Réserve (ambiant|frais|surgelé) : (\d+) \/ (\d+) articles\.$/,function(m){return ({ambiant:'Ambient',frais:'Fresh','surgelé':'Frozen'})[m[1]]+' storage: '+m[2]+' / '+m[3]+' items.'}],
  [/^Rayon : (.+)\.$/,function(m){return 'Aisle: '+(T(m[1])||m[1])+'.'}],
  [/^Comptoir fermé : embauche un·e (.+)\.$/,function(m){return 'Counter closed: hire a '+(T(m[1].charAt(0).toUpperCase()+m[1].slice(1))||m[1]).toLowerCase()+'.'}],
  [/^Bilan du mois (\d+)$/,function(m){return 'Month '+m[1]+' report'}],
  [/^Ta trésorerie est passée sous (.+)\.$/,function(m){return 'Your cash went below '+m[1]+'.'}],
  [/^Touche le sol pour placer : (.+)\. Touche deux fois ou ✓ pour valider\.$/,function(m){return 'Tap the floor to place: '+(T(m[1])||m[1])+'. Tap twice or ✓ to confirm.'}],
  [/^(.+) installé·e( : rayon (.+)\. Touche-le pour changer de rayon\.|\.)$/,function(m){return (T(m[1])||m[1])+' placed'+(m[3]?': '+storeCat(m[3])+'. Tap it to change the aisle.':'.')}],
  [/^Démolir : (.+)$/,function(m){return 'Demolish: '+(T(m[1])||m[1])}],
  [/^Jour (\d+) : (\d+) clients, (.+?)(, satisfaction (\d+))?( · livraison (.+)| · pas de quai, pas de livraison)?$/,function(m){return 'Day '+m[1]+': '+m[2]+' customers, '+m[3]+(m[5]?', satisfaction '+m[5]:'')+(m[7]?' · delivery '+m[7]:m[6]?' · no dock, no delivery':'')}],
  [/^Livraison express reçue : (.+)$/,function(m){return 'Express delivery received: '+m[1]}],
  [/^(\d+) m² de plus pour (.+)\.$/,function(m){return m[1]+' m² more for '+m[2]+'.'}],
  [/^Coût (.+)\.$/,function(m){return 'Cost '+m[1]+'.'}],
  [/^Tu reçois (.+) et tu rembourses (.+) de plus chaque mois\.$/,function(m){return 'You receive '+m[1]+' and repay '+m[2]+' more each month.'}],
  [/^Il faut d’abord un (.+) pour chaque (.+)\.$/,function(m){return 'You first need one '+(T(m[1].charAt(0).toUpperCase()+m[1].slice(1))||m[1]).toLowerCase()+' per '+(T(m[2].charAt(0).toUpperCase()+m[2].slice(1))||m[2]).toLowerCase()+'.'}],
  [/^Rayon (.+) : il faut une (chambre froide|chambre froide négative) en réserve\.$/,function(m){return storeCat(m[1])+': you need a '+(m[2]==='chambre froide'?'cold room':'freezer room')+' in the stockroom.'}],
  [/^(Joueur [12]) : place ta flotte\. (.+)$/,function(m){return m[1].replace('Joueur','Player')+': '+T('place ta flotte. '+m[2])}],
  [/^place ta flotte\. Touche un bateau puis une case, touche-le encore pour le tourner\. 🎲 pour placer au hasard\.$/,function(){return 'place your fleet. Tap a ship then a square, tap it again to rotate it. 🎲 for random placement.'}],
  [/^((?:Ordinateur|.+) : )?Coulé ! (.+)\.$/,function(m){return (m[1]?(m[1]==='Ordinateur : '?'Computer: ':m[1]):'')+'Sunk! '+(T(m[2])||m[2])+'.'}],
  [/^(Ordinateur|.+) : (Touché !|À l’eau\.)$/,function(m){return (m[1]==='Ordinateur'?'Computer':m[1])+': '+T(m[2])}],
  [/^(.+) \((\d) cases\) : touche une case pour le déplacer\.$/,function(m){return (T(m[1])||m[1])+' ('+m[2]+' squares): tap a square to move it.'}],
  [/^Ta flotte est prête\. En attente de celle de (.+)…$/,function(m){return 'Your fleet is ready. Waiting for '+m[1]+'’s…'}],
  [/^Tu as coulé toute la flotte de (.+) !$/,function(m){return 'You sank '+m[1]+'’s whole fleet!'}],
  [/^(.+) a coulé toute ta flotte\.$/,function(m){return m[1]+' sank your whole fleet.'}],
  [/^(.+) abandonne\.$/,function(m){return m[1]+' resigned.'}],
  [/^Le joueur ([12]) a coulé toute la flotte adverse\.$/,function(m){return 'Player '+m[1]+' sank the whole enemy fleet.'}],
  [/^Victoire du joueur ([12]) !$/,function(m){return 'Player '+m[1]+' wins!'}],
  [/^Grille (\d+)×(\d+) terminée en (.+?)( avec un peu d’aide\.| !)$/,function(m){return m[1]+'×'+m[2]+' grid solved in '+(T(m[3])||m[3])+(m[4]===' !'?'!':' with a little help.')}],
  [/^(\d+) mots trouvés en (.+?)( avec un peu d’aide\.| !)$/,function(m){return m[1]+' words found in '+(T(m[2])||m[2])+(m[3]===' !'?'!':' with a little help.')}],
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
  [/^Tu as une grille (facile|normale?|difficile|expert) commencée\.$/,function(m){return 'You have a '+({facile:'easy',normal:'normal',normale:'normal',difficile:'hard',expert:'expert'})[m[1]]+' grid in progress.'}],
  [/^Joueur (\d+) \((bleue|corail)\) : (lance le cochonnet \(6 à 10 m\) : glisse la boule vers le haut et relâche|lance la boule d’un geste, la vitesse donne la force)$/,function(m){return 'Player '+m[1]+' ('+(m[2]==='bleue'?'blue':'coral')+'): '+(m[3][9]==='c'?'throw the jack (6 to 10 m): swipe the boule up and release':'throw the boule with a swipe; speed sets the power')}],
  [/^Joueur (\d+) \((bleue|corail)\) : (quitte la vue de dessus pour lancer|vise le cochonnet \(6 à 10 m\) avec le pavé, puis relâche|vise avec le pavé \(gauche\/droite, haut\/bas\), puis relâche)$/,function(m){var r={'quitte la vue de dessus pour lancer':'leave top view to throw','vise le cochonnet (6 à 10 m) avec le pavé, puis relâche':'aim the jack (6 to 10 m) with the pad, then release','vise avec le pavé (gauche/droite, haut/bas), puis relâche':'aim with the pad (left/right, up/down), then release'};return 'Player '+m[1]+' ('+(m[2]==='bleue'?'blue':'coral')+'): '+r[m[3]]}],
  [/^Inviter \((\d+) joueurs\)$/,function(m){return 'Invite ('+m[1]+' players)'}],
  [/^Retirer (.+)$/,function(m){return 'Remove '+m[1]}],
  [/^Défi (aux échecs|aux dames|au puissance 4|à la bataille navale)\. (.+) l’accepte ou le refuse\.$/,function(m){return ({'aux échecs':'Chess','aux dames':'Checkers','au puissance 4':'Connect Four','à la bataille navale':'Battleship'})[m[1]]+' challenge. '+m[2]+' can accept or decline.'}],
  [/^Défi envoyé à (.+)$/,function(m){return 'Challenge sent to '+m[1]}],
  [/^En attente (\d+)\/(\d+)$/,function(m){return 'Waiting '+m[1]+'/'+m[2]}],
  [/^(.+) veut lancer$/,function(m){return m[1]+' wants to throw'}],
  [/^(.+) demande à lancer$/,function(m){return m[1]+' asks to throw'}],
  [/^(.+) demande$/,function(m){return m[1]+' is asking'}],
  [/^Au tour de (.+)$/,function(m){return m[1]+'’s turn'}],
  [/^(.+) te défie (aux échecs|aux dames|au puissance 4|à la pétanque|à la bataille navale)\.?$/,function(m){return m[1]+' challenges you to '+({'aux échecs':'chess','aux dames':'checkers','au puissance 4':'Connect Four','à la pétanque':'pétanque','à la bataille navale':'Battleship'})[m[2]]}],
  [/^(.+) t’invite (aux échecs|aux dames|au puissance 4|à la pétanque|à la bataille navale)\.?$/,function(m){return m[1]+' invites you to '+({'aux échecs':'chess','aux dames':'checkers','au puissance 4':'Connect Four','à la pétanque':'pétanque','à la bataille navale':'Battleship'})[m[2]]}],
  [/^(.+) n’a pas encore répondu\.$/,function(m){return m[1]+' hasn’t answered yet.'}],
  [/^(\d+) joueurs$/,function(m){return m[1]+' players'}],
  [/^Joueur (\d+)$/,function(m){return 'Player '+m[1]}],
  [/^Mène (\d+)$/,function(m){return 'End '+m[1]}],
  [/^(.+) lance…$/,function(m){return m[1]+' is throwing…'}],
  [/^Joueur (\d+) \((bleue|corail)\) : (.+)$/,function(m){var r={'glisse pour viser, puis relâche':'swipe to aim, then release','vise le cochonnet (6 à 10 m), glisse puis relâche':'aim the jack (6 to 10 m), swipe then release','reviens en vue lanceur pour lancer':'go back to thrower view to throw'};return 'Player '+m[1]+' ('+(m[2]==='bleue'?'blue':'coral')+'): '+(r[m[3]]||m[3])}],
  [/^Lancer non envoyé : (.+)$/,function(m){return 'Throw not sent: '+(T(m[1])||m[1])}],
  [/^(?:(Cochonnet sorti du terrain) : )?(?:\+(\d+) pour l’équipe (bleue|corail)|(mène nulle))$/,function(m){return (m[1]?'Jack knocked out: ':'')+(m[4]?'no points this end':'+'+m[2]+' for the '+(m[3]==='bleue'?'blue':'coral')+' team')}],
  [/^Victoire (\d+) à (\d+) !\nÉquipe (bleue|corail) : (.+)\.$/,function(m){return 'Victory '+m[1]+' to '+m[2]+'!\n'+(m[3]==='bleue'?'Blue':'Coral')+' team: '+m[4].replace(/Joueur (\d+)/g,'Player $1').replace('Ordinateur','Computer').replace(/\bToi\b/,'You')+'.'}],
  [/^Défaite (\d+) à (\d+)\.\nÉquipe (bleue|corail) : (.+)\.$/,function(m){return 'Defeat '+m[1]+' to '+m[2]+'.\n'+(m[3]==='bleue'?'Blue':'Coral')+' team: '+m[4].replace('Ordinateur','Computer').replace(/\bToi\b/,'You')+'.'}],
  [/^L’équipe (bleue|corail) gagne (\d+) à (\d+) !\n(.+)\.$/,function(m){return 'The '+(m[1]==='bleue'?'blue':'coral')+' team wins '+m[2]+' to '+m[3]+'!\n'+m[4].replace(/Joueur (\d+)/g,'Player $1')+'.'}],
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
  [/^(-?\d+) drapeaux? restants? · (\d+)\/(\d+) cases sûres dévoilées\.$/,function(m){return m[1]+' flags left · '+m[2]+'/'+m[3]+' safe squares revealed.'}],
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
 // zones en français par nature (mots croisés, mots fléchés) : jamais traduites
 function keep(n){var e=n.nodeType===1?n:n.parentNode;return !!(e&&e.closest&&e.closest('[translate="no"]'))}
 function fixNode(n){
  if(keep(n))return;
  if(n.nodeType===3){var t=translate(n.nodeValue);if(t!=null&&t!==n.nodeValue)n.nodeValue=t;return}
  if(n.nodeType!==1)return;
  if(n.tagName==='SCRIPT'||n.tagName==='STYLE')return;
  for(var a=0;a<ATTRS.length;a++){var v=n.getAttribute(ATTRS[a]);if(v){var t2=translate(v);if(t2!=null&&t2!==v)n.setAttribute(ATTRS[a],t2)}}
  for(var c=n.firstChild;c;c=c.nextSibling)fixNode(c);
 }
 new MutationObserver(function(list){for(var i=0;i<list.length;i++){var m=list[i];
  if(m.type==='characterData')fixNode(m.target);
  else if(m.type==='attributes'){if(keep(m.target))continue;var v=m.target.getAttribute(m.attributeName),t=translate(v);if(t!=null&&t!==v)m.target.setAttribute(m.attributeName,t)}
  else for(var j=0;j<m.addedNodes.length;j++)fixNode(m.addedNodes[j]);}})
  .observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:ATTRS});
 document.addEventListener('DOMContentLoaded',function(){fixNode(document.body);document.title='BagaPlay · A little break, a big smile.'});
 // textes dessinés dans les jeux (canvas)
 var C=window.CanvasRenderingContext2D&&CanvasRenderingContext2D.prototype;
 if(C)['fillText','strokeText','measureText'].forEach(function(k){var f=C[k];C[k]=function(text){var t=typeof text==='string'?translate(text):null;if(t!=null){var args=Array.prototype.slice.call(arguments);args[0]=t;return f.apply(this,args)}return f.apply(this,arguments)}});
})();
