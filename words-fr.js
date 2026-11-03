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
`;
export const WORDS=RAW.trim().split('\n').map(l=>{const i=l.indexOf(':');return {w:l.slice(0,i).trim(),c:l.slice(i+1).trim()}}).filter(e=>/^[A-Z]{2,10}$/.test(e.w));
