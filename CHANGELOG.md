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
