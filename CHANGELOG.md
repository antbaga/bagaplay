# 5.8.1 — 14 novembre 2026

- Fuis l’URSSAF : le virage part dès qu’on entre dans le carrefour (avant, il attendait d’en atteindre le centre, d’où une petite latence) et la caméra suit plus vite.
- Sauts plus hauts (+30 %) et plus longs (+20 % de temps en l’air).
- Un seul geste par appui : il faut relever le doigt pour enchaîner un deuxième déplacement, et le geste doit être un peu plus long (36 px au lieu de 26). Fini les décalages de deux couloirs d’un coup quand on veut se recentrer.

# 5.8.0 — 14 novembre 2026

- Nouveau jeu : **Fuis l’URSSAF**, une course sans fin façon Temple Run, en 3D voxel et en miniature sur un bureau.
  - Intro animée (les agents de l’URSSAF arrivent pour un contrôle, on prend la fuite), passable d’un toucher ; plus courte quand on rejoue dans la même session.
  - On court sur des ramettes de papier (feuille Seyès, marge rouge) : 3 couloirs, virages au bout des feuilles, trous entre les ramettes et trous de perforatrice.
  - Obstacles : crayon et trombones (sauter), agrafeuse posée sur deux piles de post-it (glisser dessous), règle sur des gommes (sauter ou glisser), agrafeuse, paquet de chewing-gum, taille-crayon, pile de post-it, calculatrice, tasse de café (esquiver), tampon « REFUSÉ » qui tape, post-it, chewing-gum mâché et tache d’encre (on trébuche : au deuxième faux pas rapproché, les agents nous attrapent).
  - Bonus « paradis fiscal » : Îles Caïmans (aimant à pièces), lingot suisse (points ×2), société écran (encaisse un choc), jet privé (on survole tout), valise de billets (+25 pièces). Les vies sont des subventions de l’État : 3 au départ, 5 au maximum.
  - Contrôles : glisser ← → (couloir ou virage), ↑ (sauter), ↓ (glisser) ; flèches et espace au clavier. Conseils affichés pendant les 3 premières parties.
  - La vitesse augmente avec la distance ; la définition baisse toute seule si l’appareil peine.
- Tests : génération de la piste (jamais de croisement, abords des virages dégagés, trous toujours franchissables), un robot qui court 3 km sur plusieurs graines, virage raté, fin de partie, bonus.

# 5.7.5 — 13 novembre 2026

- 2048 : la partie en cours est sauvegardée à chaque coup. Si on quitte le jeu (retour aux jeux, bouton d'accueil du téléphone, app fermée par le système), on la retrouve en revenant : reprise automatique à la réouverture de l'app, sinon la carte du jeu propose « Reprendre » ou « Nouvelle partie ». La sauvegarde est effacée en fin de partie (2048 atteint ou plateau bloqué) ; « Recommencer » repart d'une partie neuve.

# 5.7.4 — 11 novembre 2026

- Correction d'un blocage définitif des camions près du parking : une voiture qui attend pour sortir de sa place fait s'arrêter la circulation, mais elle mesurait le semi-remorque arrêté pour la laisser passer comme s'il était plus long vers l'avant (calcul resté sur l'ancien camion). Elle croyait la voie occupée et ne sortait jamais, le camion l'attendait, et toute la file derrière restait bloquée.
- Test : journée chargée (réputation maximale, camions toutes les 2 h pour tous les rayons), avec et sans zone de retournement : aucun véhicule n'attend plus de 90 s (avant : plus de 300 s, jusqu'à la fin de la partie).

# 5.7.3 — 11 novembre 2026

- Correction des va-et-vient sans fin sur le parking : l'agent d'entretien qui rééquilibre les abris à caddies annulait son trajet dès qu'un client prenait ou rendait un caddie, puis repartait dans l'autre sens. Source et destination sont maintenant fixées au départ ; il ne rééquilibre que si un abri se vide (5 caddies ou moins) ou déborde (plus de 15), avec un vrai écart, et souffle 10 s entre deux trajets.
- Les clients gardent l'abri à caddies choisi jusqu'à l'arrivée (ils n'en changent que s'il disparaît ou s'il est vide/plein une fois sur place).
- Sélection d'un client ou d'un véhicule (voiture, camion, bus) en le touchant : un losange jaune le suit et un panneau permet de le supprimer pour débloquer une situation. Client : articles non payés rendus à la réserve, caddie rendu aux abris, sa voiture repart. Camion : commande non payée remise en file, sinon reste remboursé.
- Tests : rééquilibrage des caddies sous un flux de clients, sélection et suppression d'un client, d'une voiture et d'un camion.

# 5.7.2 — 11 novembre 2026

- Casse-briques : la zone tactile de la raquette va du haut du plateau jusqu'en bas de l'écran (on peut guider la raquette avec le pouce sous le plateau, sans masquer le jeu).

# 5.7.1 — 11 novembre 2026

- Correction d'un plantage de la circulation : après une modification des routes, une voiture garée dont la place n'avait plus d'accès faisait planter toute la circulation à son départ (véhicules figés, puis jeu bloqué même en supprimant la route).
- Garde-fou : une erreur dans la circulation ne fige plus jamais la partie (itinéraires recalculés, et en dernier recours les véhicules repartent de zéro, commandes non livrées remises en file).
- Test : modifications de routes au hasard sous les voitures et les camions pendant plusieurs jours de jeu.

# 5.7.0 — 10 novembre 2026

- Circulation refaite aux zones de conflit : priorité à droite aux croisements (sauf cédez-le-passage), priorité à l'anneau dans les ronds-points. On s'insère dès qu'il y a juste la place de sa carrosserie ; les véhicules déjà engagés finissent de passer.
- Plus d'interblocage : on ne s'engage pas sans pouvoir ressortir du carrefour, on n'entre plus dans un rond-point plein, chaque entrée passe à son tour en cas d'attente, et les blocages en boucle sont détectés et dénoués.
- Les voies d'entrée et de sortie d'une même branche ne se gênent plus, et les zones à cheval sur le point 0 d'un rond-point sont recollées.
- Semi-remorques articulées (tracteur + remorque qui pivote, y compris en marche arrière vers le quai) et bus de ville plus courts (8,4 m).
- Routes : le début et la fin d'une voie se déplacent en les tirant ; toucher une voie la coupe en deux à cet endroit.
- Tests de circulation continue sur les ronds-points de 3, 4 et 5 m (voitures, bus, camions), croisements chargés, articulation, coupe et déplacement des bouts de voie.

# 5.6.0 — 8 novembre 2026

- Priorité à droite aux intersections, sauf cédez-le-passage explicite. Passage par zone de conflit et récupération des blocages existants.
- Plusieurs véhicules peuvent circuler simultanément dans un rond-point si l'espace le permet. Contrôle des carrosseries dans les virages, distances de sécurité et priorité aux véhicules engagés et sortants.
- Les employés remplissent les rayons avant de décharger les camions ; un carton déjà transporté termine son trajet.
- Chaque dépôt possède son propre stock de caddies : 15 à l'installation, 25 maximum, avec dépassement visible au-delà de 15.
- Les clients chargent leurs courses dans leur voiture puis rendent leur caddie au dépôt accessible le plus proche ayant de la place.
- Les agents d'entretien transportent des groupes de caddies pour équilibrer les dépôts. Stocks et transports conservés dans les sauvegardes, migration des anciennes parties.
- Tests de priorité, circulation simultanée, chargement, restitution, redistribution et reprise de sauvegarde, en plus des scénarios bus/camion et des tests précédents.

# 5.5.0 — 8 novembre 2026

- Plus de faillite, même à découvert. Les anciennes sauvegardes marquées en faillite peuvent reprendre ; les salaires, charges et échéances continuent à être débités.
- Commandes quotidiennes et express réduites proportionnellement au solde disponible, après prise en compte des livraisons impayées. Nouvelle vérification du solde au quai pour tenir compte des charges intervenues pendant le trajet.
- Construction et achats restent interdits sans argent suffisant ; publicité soumise au même contrôle.
- Priorité à la circulation et aux sorties des ronds-points, suppression du faux croisement à la jonction d'une boucle et occupation basée sur la voie présente.
- Régulation de l'entrée des petits ronds-points jusqu'au dégagement de l'arrière du véhicule. Recul lent d'un véhicule trop avancé si l'arrière est libre, sans supprimer les véhicules.
- Tests : 768 combinaisons bus/camion, récupération d'un blocage existant, piétons, finances négatives et paiements à la livraison, plus les tests 5.4.0.

# 5.4.0 — 8 novembre 2026

- Les employés de rayon et de ménage restent présents et travaillent après la fermeture et minuit. Récupération automatique des employés manquants dans les anciennes parties.
- Suppression du double retrait des clients qui supprimait aussi des employés, et des purges de voitures à la fermeture ou après un délai dans un embouteillage.
- Bilan quotidien à minuit sans réinitialiser les personnages, voitures, files ou caddies. Les clients terminent leur sortie normalement.
- Transport réel des cartons du quai vers les racks, réservation du volume transporté, plusieurs employés par camion. Le camion attend le dépôt du dernier carton.
- Un salarié automatiquement inclus par caisse, comptoir et boutique. Salaire inclus dans les charges mensuelles et affiché avant l'achat et dans le détail du poste ; aucun double comptage des anciens employés manuels.
- APK autonome séparé « BagaPlay Continu » et sources Android reproductibles.
