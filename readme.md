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

## 🌐 Démo
[Cliquez ici pour voir la démo](https://serge-fantino.github.io/EMC2/cone-lumiere-colore.html)

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

## 🏗️ Architecture (v2.0 - Architecture Modulaire)

```
EMC2/
├── index.html                   # Interface principale avec panneau latéral
├── css/
│   ├── styles.css              # Styles de base et layout
│   ├── components.css          # Composants UI et panneaux
│   └── sidepanel.css           # Styles panneau latéral avec accordéons
├── js/
│   ├── main.js                 # Orchestrateur principal
│   ├── physics/                # 🧮 Module de calculs relativistes
│   │   ├── constants.js        # Constantes physiques
│   │   ├── relativity.js       # Formules d'Einstein
│   │   ├── trajectory.js       # Trajectoires et isochrones
│   │   └── index.js           # Point d'entrée du module
│   ├── renderer/               # 🎨 Module de rendu et visualisation
│   │   ├── canvas.js           # Gestion canvas et transformations
│   │   ├── colors.js           # Calculs de couleurs et gradients
│   │   ├── drawing.js          # Fonctions de dessin spécialisées
│   │   └── index.js           # Point d'entrée du module
│   ├── interaction/            # 🖱️ Module d'interaction utilisateur
│   │   ├── events.js           # Gestion événements souris/clavier
│   │   ├── controls.js         # Contrôles UI et boutons
│   │   ├── state.js            # États d'interaction et drag & drop
│   │   └── index.js           # Point d'entrée du module
│   └── ui/                     # 🎛️ Module interface utilisateur
│       └── sidepanel.js        # Gestionnaire panneau latéral
├── scripts/                    # 🛠️ Outils de développement
│   ├── start-server.sh        # Script de lancement simple
│   ├── update-version.sh      # Cache-busting standard
│   ├── chrome-refresh.sh      # Cache-busting agressif pour Chrome
│   └── dev-server.sh          # Serveur avec auto-refresh
└── version.json               # Version dynamique pour cache-busting
```

### Modules (Architecture Complète)
- **🧮 Physics** : Calculs relativistes purs (constantes, formules d'Einstein, trajectoires)
- **🎨 Renderer** : Rendu canvas, transformations, couleurs, et fonctions de dessin
- **🖱️ Interaction** : Gestion des événements, contrôles UI, et états d'interaction
- **🎛️ UI** : Interface utilisateur avancée (panneau latéral, accordéons)

## 💡 Impact pédagogique

Au lieu d'enseigner "on ne peut pas dépasser c", on montre visuellement que **c est la frontière de la causalité elle-même** - le noir au-delà n'est pas "interdit", il n'existe simplement pas causalement.

L'application permet de **construire intuitivement** des scénarios relativistes complexes en cliquant et glissant, rendant la relativité restreinte accessible et tangible.

## 🛠️ Développement

```bash
# Développement rapide avec cache-busting automatique
npm run dev

# Développement avec cache-busting agressif pour Chrome
npm run chrome

# Serveur simple
python3 -m http.server 8000

# Tests unitaires
npm test
# Puis ouvrir http://localhost:8000/test-runner.html

# Tests du module Physics spécifiquement  
npm run test:physics
```

## 🧪 Tests Unitaires

Le projet inclut une suite complète de **tests unitaires** pour le module Physics :

### 📋 Couverture des tests
- **✅ Constantes physiques** : Vérification des valeurs et cohérence
- **✅ Calculs relativistes** : limitVelocity, calculateVelocityRatio, calculateCumulativePhysics
- **✅ Causalité** : isReachableFromSource, contraintes des cônes de lumière  
- **✅ Trajectoires** : calculateIsochronePoints, calculateAccelerationTrajectory
- **✅ Détection** : getContainingCone, logique d'intersection
- **✅ Cas limites** : Valeurs extrêmes, robustesse, cohérence dimensionnelle
- **✅ Intégration** : Conservation, limites relativistes, trajectoires fermées

### 🚀 Lancement des tests
```bash
# Démarrer le serveur
npm test

# Ouvrir dans le navigateur  
open http://localhost:8000/test-runner.html
```

**Interface de test** :
- 🎯 **Exécution automatique** au chargement
- 📊 **Rapport détaillé** avec statistiques
- ⏱️ **Mesure des performances** 
- 🎨 **Interface sombre** adaptée au développement

## 📚 Ressources

- **DDL-langage.md** : Documentation du langage de description
- **REFACTORING_STRATEGY.md** : Stratégie de modularisation
- **PROGRESS.md** : Avancement du refactoring
>>>>>>> feature/modular-architecture
