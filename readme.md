# Projet : Visualisation des Cônes de Lumière Relativiste

## 🚀 Lancement rapide

```bash
# Démarrer le serveur HTTP local
python3 -m http.server 8000

# Ou utiliser le script fourni
./start-server.sh
```

**Puis ouvrir** : `http://localhost:8000/index.html`

> ⚠️ **Important** : L'application utilise des modules ES6 et doit être servie via HTTP (pas `file://`)

## Concept central
Une représentation visuelle innovante montrant que la "vitesse" n'est pas une propriété absolue mais une relation entre événements dans l'espace-temps.

## Origine de l'idée
Partis du paradoxe "comment peut-on avoir des effets relativistes si la vitesse n'existe pas dans l'absolu ?", nous avons réalisé que le cône de lumière ne représente pas "où on peut aller" mais l'ensemble des relations causales possibles.

## 🎨 Fonctionnalités

### Visualisation Interactive
- **Cônes de lumière** colorés selon la vitesse relative
- **Création de cônes** par clic dans les zones causalement connectées
- **Trajectoires relativistes** entre référentiels
- **Isochrones** (surfaces de temps propre constant)
- **Paradoxe des jumeaux** avec démonstration automatique

### Interface Avancée
- **Panneaux de contrôle** : résolution, limites de couleur
- **Calculs en temps réel** : accélération, vitesse, temps propre
- **Système de commentaires** intégré avec sauvegarde
- **Mode glisser-déposer** pour repositionner les référentiels

## Innovation visuelle

- **Gradient de couleurs** : Bleu (repos) → Vert (0.5c) → Rouge (0.9c) → Noir (≥c, causalement impossible)
- **Heatmap superposée** : Chaque cône contribue à la visualisation globale
- **Référentiels multiples** : Chaque événement est au centre de son propre cône identique
- **Animation fluide** : Rendu en temps réel avec Canvas

## 🧮 Ce que ça démontre

- **Relativité** : La vitesse n'est pas une propriété mais une relation (angle dans le cône)
- **Équivalence** : Aucun référentiel n'est privilégié (tous les cônes sont identiques)
- **Accélération** : Change votre position relative dans les cônes, pas votre "vitesse absolue"
- **Causalité** : La limite c est géométrique, pas cinématique

## 🏗️ Architecture (Refactoring Phase 3)

```
EMC2/
├── index.html                   # Interface principale
├── css/
│   ├── styles.css              # Styles de base et layout
│   └── components.css          # Composants UI et panneaux
├── js/
│   ├── main.js                 # Orchestrateur principal
│   └── physics/                # 🧮 Module de calculs relativistes
│       ├── constants.js        # Constantes physiques
│       ├── relativity.js       # Formules d'Einstein
│       ├── trajectory.js       # Trajectoires et isochrones
│       └── index.js           # Point d'entrée du module
└── scripts/
    └── start-server.sh        # Script de lancement
```

### Modules
- **🧮 Physics** : Calculs relativistes purs (constantes, formules d'Einstein, trajectoires)
- **🎨 Renderer** : *(Prochaine étape)* - Rendu canvas et visualisation
- **🖱️ Interaction** : *(Prochaine étape)* - Gestion des événements et UI

## 💡 Impact pédagogique

Au lieu d'enseigner "on ne peut pas dépasser c", on montre visuellement que **c est la frontière de la causalité elle-même** - le noir au-delà n'est pas "interdit", il n'existe simplement pas causalement.

L'application permet de **construire intuitivement** des scénarios relativistes complexes en cliquant et glissant, rendant la relativité restreinte accessible et tangible.

## 🛠️ Développement

```bash
# Développement
python3 -m http.server 8000

# Tests (TODO)
npm test

# Build (TODO)  
npm run build
```

## 📚 Ressources

- **DDL-langage.md** : Documentation du langage de description
- **REFACTORING_STRATEGY.md** : Stratégie de modularisation
- **PROGRESS.md** : Avancement du refactoring