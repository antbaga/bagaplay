// Mots français (sans accents dans la grille, comme dans les grilles imprimées) et définitions courtes.
// Une ligne = MOT:définition. Les définitions restent courtes pour tenir dans une case de mots fléchés.
const RAW=`
ABEILLE:Fait du miel
ABRI:Refuge
ACIER:Fer allié
ADIEU:Au revoir pour toujours
AGNEAU:Petit de la brebis
AIGLE:Rapace royal
AILE:Sert à voler
AIMER:Chérir
AIR:On le respire
AMI:Copain
AMIE:Copine
ANANAS:Fruit tropical
ANE:Baudet
ANGE:Être céleste
ANNEE:Douze mois
ARBRE:Chêne ou sapin
ARC:Lance des flèches
ARENE:Lieu de corrida
ARGENT:Métal ou monnaie
ARME:Épée ou fusil
ART:Peinture ou musique
ASTRE:Étoile ou planète
ATLAS:Recueil de cartes
AUBE:Lever du jour
AVION:Il vole
AVRIL:Mois du poisson
BAIN:Dans la baignoire
BAL:On y danse
BALLE:Ronde au tennis
BANC:Siège de parc
BARQUE:Petit bateau
BATEAU:Il flotte
BEC:Bouche d'oiseau
BETE:Animal
BEURRE:Sur la tartine
BIJOU:Bague ou collier
BISE:Petit baiser
BLE:Fait la farine
BOIS:Matière d'arbre
BOL:Pour le café au lait
BON:Délicieux
BOTTE:Grande chaussure
BOUCHE:Pour manger
BOUGIE:Elle éclaire
BRAS:Membre supérieur
BRISE:Vent léger
BRUN:Couleur châtain
BUT:Objectif
CADEAU:Présent offert
CAFE:Boisson noire
CAGE:Prison d'oiseau
CALME:Paisible
CANAL:Voie d'eau
CANARD:Il fait coin-coin
CAPE:Manteau sans manches
CAR:Autocar
CARTE:À jouer ou routière
CERF:Il brame
CHAISE:On s'y assoit
CHAT:Félin
CHAUD:Brûlant
CHEMIN:Petite route
CHENE:Arbre à glands
CHEVAL:Il galope
CHIEN:Il aboie
CIEL:Il est bleu
CINE:Salle obscure
CIRE:Faite par l'abeille
CITRON:Agrume jaune
CLE:Ouvre la porte
CLOU:Se plante au marteau
COEUR:Il bat
COIN:Angle
COL:Passage en montagne
COQ:Il chante à l'aube
CORDE:Pour grimper
CORPS:Tête, tronc, membres
COTE:Bord de mer
COU:Porte la tête
COUR:Devant la maison
CRABE:Il marche de côté
CRAIE:Pour le tableau
CREME:Chantilly
CRI:Hurlement
CUIR:Peau tannée
DAME:Madame
DANSE:Valse ou tango
DATTE:Fruit du palmier
DE:Cube à jouer
DENT:Dans la bouche
DESERT:Plein de sable
DIEU:Être suprême
DINER:Repas du soir
DOS:Arrière du corps
DOUX:Pas rude
DRAP:Sur le lit
DUNE:Colline de sable
EAU:H2O
ECOLE:On y apprend
ECRAN:Télé ou ordinateur
EGLISE:Lieu de culte
ELAN:Cerf du Nord
ELEVE:Écolier
ENCRE:Dans le stylo
ENFANT:Petit d'humain
EPEE:Arme du mousquetaire
EPI:Tête de blé
ERE:Époque
ETE:Saison chaude
ETOILE:Brille la nuit
ETANG:Petit lac
FACE:Visage
FARINE:Pour le pain
FEE:Magicienne
FER:Métal
FERME:Maison agricole
FETE:Célébration
FEU:Il brûle
FIL:À coudre
FILLE:Enfant féminin
FLEUR:Rose ou tulipe
FLEUVE:Il va à la mer
FOIN:Herbe séchée
FORET:Plein d'arbres
FOUR:Il cuit
FRAISE:Fruit rouge
FROID:Glacial
FROMAGE:Brie ou comté
FRUIT:Pomme ou poire
FUMEE:Sort de la cheminée
GANT:Pour la main
GARE:Les trains s'y arrêtent
GATEAU:Dessert
GEL:Glace fine
GENOU:Plie la jambe
GLACE:Eau gelée
GOMME:Efface le crayon
GOUT:Saveur
GRAIN:Petite graine
GRUE:Oiseau ou engin
GUEPE:Elle pique
HACHE:Coupe le bois
HERBE:Pousse au jardin
HIBOU:Oiseau de nuit
HIVER:Saison froide
HOTEL:On y dort en voyage
HUILE:D'olive
IDEE:Pensée
ILE:Terre dans l'eau
IRIS:Fleur ou œil
JARDIN:Potager
JAUNE:Couleur citron
JEU:Divertissement
JOIE:Bonheur
JOUR:Pas la nuit
JUPE:Vêtement féminin
LAC:Étendue d'eau
LAINE:Du mouton
LAIT:Blanc et nourrissant
LAMPE:Elle éclaire
LAPIN:Aime les carottes
LARME:Goutte de chagrin
LEVRE:Bord de bouche
LIEVRE:Lapin sauvage
LIGNE:Trait
LION:Roi des animaux
LIRE:Parcourir un livre
LIT:Pour dormir
LIVRE:Roman
LOUP:Il hurle
LUNE:Astre de la nuit
LUNDI:Début de semaine
MAI:Mois du muguet
MAIN:Cinq doigts
MAIRE:Chef de commune
MAISON:Logis
MALLE:Grand coffre
MANGUE:Fruit exotique
MARDI:Après lundi
MARE:Petit étang
MER:Grande eau salée
MERE:Maman
MIEL:Doux et doré
MIDI:Douze heures
MOTO:Deux-roues
MOULE:Coquillage
MOUTON:Bêle
MUR:Paroi
MUSEE:On y voit des tableaux
NAGE:Brasse ou crawl
NEIGE:Flocons blancs
NEZ:Pour sentir
NID:Maison d'oiseau
NOEL:Fête de décembre
NOIR:Sans lumière
NOIX:Fruit à coque
NOM:Prénom ou patronyme
NUAGE:Dans le ciel gris
NUIT:Sombre
OASIS:Eau dans le désert
OCEAN:Atlantique
OEIL:Pour voir
OEUF:Pondu par la poule
OIE:Gros oiseau blanc
OISEAU:Il vole
OLIVE:Verte ou noire
OMBRE:Zone sans soleil
ONDE:Vague
ONGLE:Au bout du doigt
OR:Métal précieux
ORAGE:Éclairs et tonnerre
ORANGE:Agrume
OREILLE:Pour entendre
ORGUE:Instrument d'église
OS:Squelette
OURS:Aime le miel
PAIN:Baguette
PAIX:Contraire de guerre
PALAIS:Demeure royale
PAPA:Père
PARC:Jardin public
PATE:Feuilletée
PEAU:Enveloppe du corps
PECHE:Fruit ou loisir
PERE:Papa
PIANO:Touches noires et blanches
PIED:Au bout de la jambe
PIERRE:Caillou
PIN:Conifère
PIRATE:Bandit des mers
PLAGE:Sable et mer
PLUIE:Gouttes d'eau
PLUME:Recouvre l'oiseau
POIRE:Fruit à pépins
POMME:Fruit d'Ève
PONT:Enjambe la rivière
PORC:Cochon
PORTE:On l'ouvre
POT:Récipient
POULE:Pond des œufs
PRE:Champ d'herbe
PRINCE:Fils de roi
PRUNE:Fruit violet
PUITS:Trou à eau
RADIO:Poste à ondes
RAME:Fait avancer la barque
RAT:Rongeur
REINE:Épouse du roi
RENARD:Rusé
REVE:Pendant le sommeil
RIRE:Éclater de joie
RIVE:Bord de rivière
RIZ:Céréale d'Asie
ROBE:Vêtement long
ROC:Rocher
ROI:Monarque
ROSE:Fleur à épines
ROUE:Tourne
ROUGE:Couleur du sang
RUE:Voie de ville
RUSE:Malice
SABLE:Sur la plage
SAC:À main
SAGE:Raisonnable
SAISON:Été ou hiver
SALADE:Laitue
SALLE:Pièce
SANG:Coule dans les veines
SAPIN:Arbre de Noël
SAVON:Pour se laver
SEL:Sur les frites
SEMAINE:Sept jours
SERRE:Abri vitré
SIRENE:Mi-femme mi-poisson
SOEUR:Fille des mêmes parents
SOIE:Tissu fin
SOIR:Fin du jour
SOL:Par terre
SOLEIL:Il brille
SOMME:Total
SON:Bruit
SOUPE:Potage
SUCRE:Doux
SUD:Point cardinal
TABLE:Pour manger
TANTE:Sœur du parent
TAPIS:Sur le sol
TASSE:Pour le thé
TAUPE:Creuse des galeries
TENTE:Pour camper
TERRE:Planète bleue
TETE:Sur les épaules
THE:Boisson chaude
TIGRE:Félin rayé
TOIT:Au-dessus de la maison
TOMATE:Rouge en salade
TOUR:Eiffel
TRAIN:Sur des rails
TRESOR:Coffre d'or
TROU:Creux
TULIPE:Fleur de Hollande
UNI:D'une seule couleur
USINE:Fabrique
VACHE:Elle meugle
VAGUE:Ondulation de la mer
VALSE:Danse à trois temps
VASE:Pour les fleurs
VEAU:Petit de la vache
VELO:Bicyclette
VENT:Il souffle
VER:De terre
VERRE:Pour boire
VERT:Couleur de l'herbe
VESTE:Veston
VIE:Existence
VIGNE:Donne le raisin
VILLE:Cité
VIN:Rouge ou blanc
VOILE:Pousse le bateau
VOIX:Pour chanter
VOL:Trajet en avion
ZEBRE:Rayé noir et blanc
ZERO:Rien
ABRICOT:Fruit orange
ALBUM:Recueil de photos
ALLEE:Chemin bordé
AMANDE:Fruit sec
ANCRE:Retient le bateau
ANNEAU:Bague
ARROSER:Donner de l'eau
ASSIETTE:Pour servir
ATELIER:Lieu de travail
AUTEUR:Écrivain
AVENIR:Futur
BALCON:Terrasse suspendue
BALEINE:Géant des mers
BANANE:Fruit jaune
BOUTEILLE:Contient le vin
CAMION:Poids lourd
CANAPE:Sofa
CAROTTE:Légume orange
CERISE:Petit fruit rouge
CHAPEAU:Couvre-chef
CHATEAU:Demeure de seigneur
CLOCHE:Sonne
COUSIN:Fils de l'oncle
CRAYON:Pour dessiner
CUISINE:Pièce des repas
DAUPHIN:Mammifère marin
DRAGON:Crache du feu
ECHELLE:Pour monter
ECUREUIL:Aime les noisettes
ETOILES:Constellation
FENETRE:Ouverture vitrée
FOURMI:Insecte travailleur
GIRAFE:Long cou
GUITARE:Six cordes
HORLOGE:Donne l'heure
JOURNAL:Quotidien
LEGUME:Carotte ou poireau
LUMIERE:Clarté
MARCHE:Lieu d'achats
MATELAS:Sur le sommier
MIROIR:Reflète
MONTAGNE:Alpes
MOUCHE:Insecte agaçant
MUSIQUE:Mélodie
NUMERO:Chiffre
OCTOBRE:Dixième mois
ORDINATEUR:Machine à calculer
PAPILLON:Insecte aux ailes colorées
PARAPLUIE:Contre la pluie
PATISSIER:Fait des gâteaux
PINCEAU:Pour peindre
PISCINE:Pour nager
POISSON:Il nage
POMPIER:Éteint le feu
PRINTEMPS:Saison des fleurs
RAISIN:Fruit de la vigne
REQUIN:Prédateur marin
RIVIERE:Cours d'eau
SALON:Pièce de séjour
SERPENT:Reptile sans pattes
SOURIS:Rongeur
TAMBOUR:Instrument à frapper
TELEPHONE:Pour appeler
TORTUE:Lente à carapace
TOMBEAU:Sépulture
VILLAGE:Petite commune
VOITURE:Automobile
VOYAGE:Déplacement lointain
ARENES:Amphithéâtre
AILES:Paires de plumes
AINE:Premier-né
ALOES:Plante grasse
AMER:Contraire de sucré
ANES:Baudets
ARIA:Air d'opéra
AROME:Parfum
ASSE:Club de Saint-Étienne
ATRE:Foyer
AUNE:Arbre des rives
AVE:Prière à Marie
EMU:Touché
ENTRE:Parmi
EPAIS:Pas mince
ERRER:Vagabonder
ETAPE:Halte
ETUI:Boîte à lunettes
ILOT:Petite île
INDE:Pays du Taj Mahal
ITEM:De même
LIEU:Endroit
LOI:Règle
LOTO:Jeu de hasard
MOT:Il se croise
NEUF:Après huit
NOTE:Do ou ré
OSER:Avoir l'audace
OTER:Enlever
OUI:Contraire de non
OURSE:Grande ou petite
PIE:Oiseau voleur
RAIE:Poisson plat
RARE:Peu fréquent
RATE:Organe ou manqué
REEL:Vrai
RIEN:Néant
ROSEE:Gouttes du matin
SEINE:Fleuve de Paris
SERA:Futur d'être
SIESTE:Somme de l'après-midi
SOT:Bête
TAS:Amas
TIRE:Tracte
TOILE:Tissu ou tableau
TRIO:Groupe de trois
USE:Râpé
UNE:Première page
URNE:Pour voter
VASTE:Immense
VERS:Ligne de poème
VISA:Pour voyager
ABIME:Gouffre profond
ACTEUR:Joue au théâtre
ADULTE:Grande personne
AFFICHE:Placardée au mur
AGENDA:Carnet de rendez-vous
AGNEAUX:Petits de la brebis
AIGUILLE:Pour coudre
AIL:Gousse qui sent fort
AIMANT:Attire le fer
ALBATROS:Grand oiseau marin
ALERTE:Signal de danger
ALGUE:Plante de la mer
ALPAGE:Pré de montagne
AMANDIER:Arbre à amandes
AMBRE:Résine fossile
AMIRAL:Chef de flotte
AMOUR:Sentiment tendre
AMPOULE:Elle s'allume
ANCETRE:Aïeul
ANORAK:Veste de pluie
ANTENNE:Capte les ondes
APPEL:Coup de fil
ARAIGNEE:Tisse sa toile
ARBITRE:Siffle les fautes
ARCHE:Bateau de Noé
ARDOISE:Pierre du toit
ARMOIRE:Range les habits
ARRET:Station de bus
ASPERGE:Légume en pointe
ASSIS:Sur une chaise
ATOME:Particule de matière
AUTOMNE:Saison des feuilles mortes
AVOCAT:Fruit ou défenseur
AVOINE:Céréale du cheval
BADGE:Insigne épinglé
BAGAGE:Valise
BAGUE:Au doigt
BAGUETTE:Pain long
BAIE:Petit fruit ou golfe
BALAI:Pour balayer
BALLON:Rond au foot
BAMBOU:Mangé par le panda
BANQUE:Garde l'argent
BARBE:Poils du menton
BASSIN:Petit plan d'eau
BATON:Morceau de bois
BAVARD:Parle beaucoup
BEBE:Tout-petit
BELIER:Mâle de la brebis
BERCEAU:Lit de bébé
BERGER:Garde les moutons
BIBERON:Lait de bébé
BICHE:Femelle du cerf
BILLE:Petite boule
BISCUIT:Gâteau sec
BLANC:Couleur de la neige
BLEU:Couleur du ciel
BLOND:Couleur des blés
BOCAL:Pot en verre
BOIRE:Avaler un liquide
BOITE:Carton fermé
BONBON:Sucrerie
BONNET:Chapeau de laine
BORD:Rive ou limite
BOUC:Mâle de la chèvre
BOUE:Terre mouillée
BOUEE:Aide à flotter
BOULE:Sphère
BOUQUET:Fleurs réunies
BOUTON:Ferme la chemise
BRANCHE:Bras de l'arbre
BRIQUE:Bloc de maison
BROSSE:Pour les cheveux
BRUIT:Son gênant
BUREAU:Table de travail
CABANE:Petite maison de bois
CACAO:Donne le chocolat
CACTUS:Plante qui pique
CAHIER:Pour écrire en classe
CAILLOU:Petite pierre
CAISSE:Grande boîte
CALIN:Câlinerie
CAMPAGNE:Hors de la ville
CANNE:Aide à marcher
CANOE:Bateau à pagaie
CANTINE:Restaurant scolaire
CAPRICE:Envie soudaine
CARAMEL:Sucre fondu
CARGO:Navire marchand
CARNET:Petit cahier
CARRE:Quatre côtés égaux
CARTON:Papier épais
CASQUE:Protège la tête
CASSEROLE:Pour cuire
CAVE:Sous la maison
CEDRE:Grand conifère
CEINTURE:Tient le pantalon
CENDRE:Reste du feu
CERCLE:Rond parfait
CERISIER:Arbre à cerises
CERVEAU:Organe de la pensée
CHAINE:Anneaux liés
CHALET:Maison de montagne
CHAMEAU:Deux bosses
CHAMP:Terre cultivée
CHANCE:Bonne fortune
CHANSON:On la chante
CHARIOT:Caddie
CHATON:Petit chat
CHEMISE:Haut à boutons
CHENILLE:Futur papillon
CHEVEU:Sur la tête
CHEVRE:Fait du fromage
CHOCOLAT:Douceur au cacao
CHOU:Légume vert
CIGALE:Chante l'été
CIGOGNE:Apporte les bébés
CINQ:Après quatre
CIRQUE:Clowns et acrobates
CISEAUX:Pour couper
CITRONNADE:Boisson au citron
CLAIR:Lumineux
CLASSE:Salle d'école
CLOWN:Fait rire au cirque
COCHON:Animal rose
COFFRE:Boîte à trésor
COLLE:Pour coller
COLLIER:Autour du cou
COMETE:Astre à queue
COPAIN:Ami
COQUE:Coquille ou carcasse
CORAIL:Récif marin
CORBEAU:Oiseau noir
CORNE:Sur la tête du taureau
COSTUME:Veste et pantalon
COTON:Fibre blanche
COUDE:Plie le bras
COULEUR:Rouge ou bleu
COUPE:Trophée
COURGE:Grosse cucurbitacée
COURSE:Compétition
COUSSIN:Oreiller du canapé
COUTEAU:Pour couper la viande
CRAPAUD:Cousin de la grenouille
CREPE:Fine galette
CRIQUET:Insecte sauteur
CROCO:Gros reptile
CROISSANT:Viennoiserie
CUBE:Six faces carrées
CUILLERE:Pour la soupe
CYGNE:Oiseau blanc gracieux
DANSEUR:Fait des pas
DECOR:Fond de scène
DEFI:Challenge
DELICE:Grand plaisir
DESSIN:Fait au crayon
DIAMANT:Pierre précieuse
DIMANCHE:Jour de repos
DINDE:Plat de Noël
DOIGT:Au bout de la main
DOMINO:Jeu de pièces
DOUCHE:Pour se laver
DOUZE:Une douzaine
DROIT:Pas tordu
ECHARPE:Autour du cou en hiver
ECLAIR:Lueur d'orage
ECORCE:Peau de l'arbre
EGOUT:Canalisation
ELEPHANT:A une trompe
EMPEREUR:Souverain
ENCLUME:Chez le forgeron
ENIGME:Devinette
EPICE:Poivre ou cannelle
EPINARD:Légume de Popeye
EPONGE:Absorbe l'eau
ERABLE:Arbre du Canada
ESCARGOT:Porte sa maison
ESPACE:Univers
ETABLE:Abri des vaches
ETAGE:Niveau d'immeuble
EVIER:Pour la vaisselle
FAIM:Envie de manger
FALAISE:Roche au bord de mer
FAMILLE:Parents et enfants
FANTOME:Il hante
FARCE:Blague
FAUCON:Rapace rapide
FAUTEUIL:Siège confortable
FENOUIL:Légume anisé
FEUILLE:Pousse sur l'arbre
FICELLE:Petite corde
FIGUE:Fruit méditerranéen
FILET:Pour pêcher
FLAMME:Langue de feu
FLECHE:Tirée à l'arc
FLUTE:Instrument à vent
FOLIE:Démence
FONTAINE:Eau sur la place
FOOT:Sport de ballon
FORGE:Atelier du forgeron
FOUET:Bat les oeufs
FOULARD:Carré de soie
FRERE:Fils des mêmes parents
FRITE:Bâtonnet de pomme de terre
FUSEE:Va dans l'espace
GALET:Pierre de plage
GALOP:Allure du cheval
GARCON:Jeune homme
GAZON:Herbe tondue
GENIE:Sort de la lampe
GILET:Veste sans manches
GIVRE:Gel blanc
GLAND:Fruit du chêne
GORILLE:Grand singe
GOURDE:Bouteille de randonnée
GRAINE:Elle germe
GRENIER:Sous le toit
GRILLE:Barreaux
GRIS:Entre blanc et noir
GROTTE:Caverne
GUIDE:Montre le chemin
HAMAC:Lit suspendu
HAMSTER:Petit rongeur
HARPE:Instrument à cordes
HAUT:Élevé
HERISSON:Il pique
HEROS:Personnage courageux
HEURE:Soixante minutes
HOMARD:Crustacé à pinces
HONTE:Gêne
HUIT:Après sept
HUITRE:Coquillage à perle
IGLOO:Maison de glace
IMAGE:Illustration
INSECTE:Six pattes
JAMBE:Membre inférieur
JAMBON:Charcuterie
JARDINIER:Cultive le jardin
JASMIN:Fleur parfumée
JEUDI:Après mercredi
JEUNE:Pas vieux
JOUET:Pour jouer
JUDO:Art martial
JUGE:Rend la justice
JUILLET:Mois de l'été
JUIN:Mois des fraises
JUMEAU:Né le même jour
JUS:De fruit pressé
KAYAK:Canoë fermé
KIWI:Fruit vert poilu
KOALA:Mange l'eucalyptus
LACET:Ferme la chaussure
LAMA:Crache dans les Andes
LANGUE:Dans la bouche
LANTERNE:Lampe portative
LAVANDE:Fleur de Provence
LECON:À apprendre
LENT:Pas rapide
LETTRE:Courrier
LIERRE:Plante grimpante
LIMACE:Escargot sans coquille
LIMON:Boue fertile
LINGE:Vêtements à laver
LOCHE:Petit poisson
LOGIS:Habitation
LONG:Pas court
LOUTRE:Nage dans la rivière
LUCIOLE:Insecte lumineux
LUTIN:Petit farceur
MACHINE:Appareil
MAGIE:Tours de sorcier
MAGNOLIA:Arbre à grandes fleurs
MAIGRE:Pas gros
MAILLOT:Pour se baigner
MAIS:Épis jaunes
MAITRE:Instituteur
MANCHOT:Oiseau qui ne vole pas
MANEGE:Chevaux de bois
MANTEAU:Vêtement d'hiver
MARIN:Navigue
MARMITE:Grosse casserole
MARRON:Couleur ou châtaigne
MARS:Planète rouge
MASQUE:Cache le visage
MATIN:Début de journée
MECHANT:Pas gentil
MEDAILLE:Récompense
MELON:Fruit d'été
MENTON:Bas du visage
MERCI:Formule de politesse
MERLE:Oiseau noir chanteur
METRO:Train souterrain
MEUBLE:Table ou armoire
MIETTE:Petit bout de pain
MILLE:Dix fois cent
MINUTE:Soixante secondes
MISTRAL:Vent de Provence
MODE:Tendance
MOINEAU:Petit oiseau
MOIS:Douzième d'année
MONDE:Planète Terre
MONSTRE:Créature effrayante
MORSE:Code ou animal
MOTEUR:Fait avancer
MOUETTE:Oiseau du port
MOULIN:Tourne au vent
MOUSSE:Écume ou dessert
MOUSTIQUE:Il pique la nuit
MUGUET:Fleur du premier mai
MURE:Fruit de la ronce
NAPPE:Couvre la table
NAVET:Légume blanc
NAVIRE:Grand bateau
NEON:Tube lumineux
NEVEU:Fils du frère
NIECE:Fille de la soeur
NOISETTE:Fruit du noisetier
NORD:Point cardinal
NOUILLE:Pâte longue
NOUVEAU:Récent
OBUS:Projectile
OIGNON:Fait pleurer
OMELETTE:Oeufs battus cuits
ONCLE:Frère du père
OPERA:Spectacle chanté
ORCHESTRE:Groupe de musiciens
ORTEIL:Doigt de pied
OUEST:Où le soleil se couche
OURAGAN:Tempête violente
OUTIL:Marteau ou pince
PAGE:Feuille de livre
PAILLE:Pour boire
PALMIER:Arbre des tropiques
PANDA:Ours noir et blanc
PANIER:Pour les courses
PANTALON:Deux jambes
PAON:Fait la roue
PAPIER:Pour écrire
PARFUM:Sent bon
PASSAGE:Lieu où l'on passe
PASTEQUE:Gros fruit rouge
PATIN:Glisse sur la glace
PAUME:Creux de la main
PAVE:Pierre de rue
PELLE:Pour creuser
PELOTE:Boule de laine
PENSEE:Idée
PERLE:Bijou de l'huître
PERROQUET:Oiseau qui parle
PETALE:Partie de fleur
PETIT:Pas grand
PHARE:Guide les bateaux
PHOQUE:Mammifère marin
PIEUVRE:Huit bras
PIGEON:Oiseau de ville
PILE:Batterie
PILOTE:Conduit l'avion
PIMENT:Ça pique
PINGOUIN:Oiseau du Nord
PIPE:Pour fumer
PIQUE:Couleur de carte
PIVERT:Tape sur l'arbre
PIZZA:Spécialité italienne
PLACARD:Rangement mural
PLAFOND:Haut de la pièce
PLANETE:Tourne autour du soleil
PLANTE:Végétal
PLAT:Mets servi
PLOMB:Métal lourd
POCHE:Sur le pantalon
POELE:Pour les crêpes
POETE:Écrit des vers
POIDS:Masse
POIVRE:Épice noire
POLICE:Maintient l'ordre
POMMIER:Arbre à pommes
POMPE:Pour gonfler
PORT:Abri des bateaux
POSTE:Envoie le courrier
POUCE:Gros doigt
POULET:Volaille
POUPEE:Jouet de chiffon
POUSSIN:Petit de la poule
PRAIRIE:Grand pré
PRENOM:Avant le nom
PRISON:Pour les voleurs
PRIX:Coût
PUCE:Insecte sauteur
PULL:Tricot chaud
PUNAISE:Insecte ou clou
PYJAMA:Pour dormir
QUAI:Bord du port
QUATRE:Après trois
QUEUE:Au bout du chien
QUILLE:Jeu de bowling
RACINE:Sous la plante
RADEAU:Embarcation de fortune
RAISON:Bon sens
RAPIDE:Vite
RAQUETTE:Pour le tennis
RAYON:Trait de lumière
RECOLTE:Moisson
REGLE:Pour tracer droit
RENNE:Tire le traîneau
REPAS:Déjeuner ou dîner
RIDEAU:À la fenêtre
ROBOT:Machine automatique
ROCHER:Gros bloc de pierre
ROMAN:Long récit
RONCE:Buisson épineux
ROND:Circulaire
ROSEAU:Plante des marais
ROUTE:Voie pour voitures
RUBAN:Bande de tissu
RUCHE:Maison des abeilles
RUISSEAU:Petite rivière
SALUT:Bonjour familier
SAMEDI:Jour du week-end
SANDALE:Chaussure d'été
SAPEUR:Pompier
SARDINE:Petit poisson en boîte
SAUCE:Accompagne le plat
SAULE:Arbre pleureur
SAUMON:Poisson rose
SAUT:Bond
SAUTERELLE:Insecte sauteur
SAVANE:Prairie d'Afrique
SCIE:Pour couper le bois
SEAU:Pour l'eau
SECRET:Chose cachée
SEIZE:Dix plus six
SENTIER:Petit chemin
SEPT:Après six
SERVIETTE:Pour s'essuyer
SIFFLET:Instrument de l'arbitre
SIGNE:Geste ou symbole
SINGE:Grimpe aux arbres
SIROP:Liquide sucré
SKI:Glisse sur la neige
SOLDAT:Militaire
SOMMEIL:Repos de la nuit
SONNETTE:À la porte
SORCIERE:Vole sur un balai
SOUPIR:Respiration lasse
SOURCE:Naissance d'une rivière
SOURIRE:Expression joyeuse
SPORT:Activité physique
STADE:Terrain de foot
STYLO:Pour écrire
SUCETTE:Bonbon sur bâton
SUEUR:Transpiration
SURF:Glisse sur les vagues
TABLEAU:Peinture encadrée
TACHE:Salissure
TAILLE:Hauteur
TALON:Arrière du pied
TAMIS:Passoire fine
TARTE:Pâtisserie aux fruits
TAUREAU:Mâle de la vache
TAXI:Voiture payante
TEMPS:Météo ou durée
TENNIS:Sport de raquette
TETARD:Future grenouille
THEATRE:Lieu des pièces
THON:Gros poisson
TIMBRE:Sur l'enveloppe
TIROIR:Dans la commode
TISSU:Étoffe
TONNERRE:Bruit de l'orage
TORCHE:Lampe de poche
TOUPIE:Tourne sur elle-même
TRAINEAU:Glisse sur la neige
TRAMWAY:Train de ville
TREFLE:Porte-bonheur
TRIANGLE:Trois côtés
TROMPETTE:Instrument en cuivre
TRONC:Corps de l'arbre
TROUPEAU:Groupe de moutons
TUBA:Pour respirer sous l'eau
TUILE:Sur le toit
TUNNEL:Passage sous terre
TUTU:Jupe de danseuse
VACANCES:Repos d'été
VALISE:Bagage
VALLEE:Entre deux montagnes
VAMPIRE:Boit du sang
VANILLE:Parfum de glace
VEDETTE:Star
VENDREDI:Avant samedi
VERGER:Champ d'arbres fruitiers
VERNIS:Pour les ongles
VIANDE:Steak ou rôti
VIEUX:Âgé
VINGT:Deux dizaines
VIOLET:Couleur de la violette
VIOLON:Instrument à archet
VIPERE:Serpent venimeux
VIRAGE:Courbe de la route
VITRE:Verre de fenêtre
VOISIN:Habite à côté
VOLCAN:Crache la lave
WAGON:Voiture de train
YAOURT:Laitage
YOGA:Gymnastique douce
ZOO:Parc aux animaux
`;
export const WORDS=RAW.trim().split('\n').map(l=>{const i=l.indexOf(':');return {w:l.slice(0,i).trim(),c:l.slice(i+1).trim()}}).filter(e=>/^[A-Z]{2,10}$/.test(e.w));
