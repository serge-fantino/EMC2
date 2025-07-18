# Stratégie de Refactoring - Architecture Modulaire

## 🎯 Objectif Principal
Refactoriser le code pour mieux isoler les différentes parties :
1. **Calculs** (physique relativiste)
2. **Visualisation** (rendu canvas)
3. **Interactivité** (gestion des événements)

**Contrainte critique** : Préserver exactement le look and feel et l'UX de la version HTML simple.

## 📋 État Actuel
- **Fichier monolithique** : `cone-lumiere-colore.html` (2966 lignes)
- **Architecture** : HTML/CSS/JS dans un seul fichier
- **Fonctionnalités** : Visualisation interactive des cônes de lumière relativiste

## 🔧 Approche Incrémentale

### Phase 1 : Extraction JavaScript (🟢 Sans Impact UX)
**Objectif** : Séparer le JavaScript du HTML sans changer le comportement

**Actions** :
- Créer `js/main.js` - Code principal
- Créer `js/physics.js` - Calculs relativistes
- Créer `js/renderer.js` - Rendu canvas
- Créer `js/events.js` - Gestion des événements
- Modifier `cone-lumiere-colore.html` pour inclure les scripts

**Validation** : L'application doit fonctionner exactement comme avant

### Phase 2 : Extraction CSS (🟢 Sans Impact UX)
**Objectif** : Séparer les styles du HTML

**Actions** :
- Créer `css/styles.css` - Styles principaux
- Créer `css/components.css` - Composants spécifiques
- Modifier le HTML pour inclure les feuilles de style

**Validation** : L'apparence doit être identique

### Phase 3 : Modularisation JavaScript (🟡 Refactoring Interne)
**Objectif** : Organiser le code en modules cohérents

**Actions** :
- Créer des classes/modules pour chaque domaine
- Implémenter des interfaces claires entre modules
- Maintenir la compatibilité avec l'existant

**Validation** : Même comportement, code plus maintenable

### Phase 4 : Optimisation et Tests (🟡 Améliorations)
**Objectif** : Optimiser sans changer l'UX

**Actions** :
- Ajouter des tests unitaires
- Optimiser les performances
- Documenter les APIs internes

## 📐 Architecture Cible

```
EMC2/
├── index.html                 # HTML minimal
├── css/
│   ├── styles.css            # Styles principaux
│   └── components.css        # Composants UI
├── js/
│   ├── main.js               # Point d'entrée
│   ├── physics/
│   │   ├── relativity.js     # Calculs relativistes
│   │   ├── lightcone.js      # Géométrie des cônes
│   │   └── isochrone.js      # Calculs isochrones
│   ├── renderer/
│   │   ├── canvas.js         # Rendu canvas
│   │   ├── heatmap.js        # Visualisation couleurs
│   │   └── trajectories.js   # Tracé des trajectoires
│   └── interaction/
│       ├── mouse.js          # Gestion souris
│       ├── drag.js           # Drag & drop
│       └── controls.js       # Contrôles UI
└── tests/
    └── unit/                 # Tests unitaires
```

## 🎨 Modules Principaux

### 1. Module Physics (`js/physics/`)
**Responsabilité** : Calculs mathématiques et physiques

**Fonctions principales** :
- `calculateVelocityRatio(x, y, t)` - Calcul vitesse relativiste
- `calculateAcceleration(deltaX, deltaT)` - Accélération propre
- `calculateProperTime(acceleration, deltaT)` - Temps propre
- `calculateCumulativePhysics(coneIndex)` - Physique cumulative

**Interface** : Fonctions pures, pas de dépendances UI

### 2. Module Renderer (`js/renderer/`)
**Responsabilité** : Rendu visuel sur canvas

**Fonctions principales** :
- `drawHeatmap(canvas, coneOrigins, config)` - Heatmap des cônes
- `drawTrajectories(canvas, coneOrigins)` - Trajectoires d'accélération
- `drawIsochrones(canvas, selectedFrame)` - Courbes isochrones
- `drawUI(canvas, placements)` - Éléments UI

**Interface** : Reçoit des données, produit du rendu

### 3. Module Interaction (`js/interaction/`)
**Responsabilité** : Gestion des événements utilisateur

**Fonctions principales** :
- `MouseHandler` - Gestion souris (click, hover, move)
- `DragHandler` - Drag & drop des référentiels
- `ControlsHandler` - Contrôles UI (sliders, boutons)
- `KeyboardHandler` - Raccourcis clavier

**Interface** : Écoute événements, met à jour l'état

## 🔄 Flux de Données

```
Événements → Interaction → État → Physics → Renderer → Canvas
     ↑                                                    ↓
     └─────────────── Feedback visuel ←──────────────────┘
```

## ⚡ Avantages du Refactoring

### 1. **Séparation des Responsabilités**
- Calculs physiques isolés et testables
- Rendu découplé de la logique métier
- Interactions centralisées

### 2. **Maintenabilité**
- Code organisé en modules cohérents
- Interfaces claires entre composants
- Facilité de débogage et modification

### 3. **Extensibilité**
- Nouveau type de visualisation → nouveau renderer
- Nouveau contrôle → nouveau handler
- Nouvelle physique → nouveau module physics

### 4. **Testabilité**
- Fonctions pures pour les calculs
- Mocks possibles pour les tests
- Isolation des effets de bord

## 📝 Plan de Validation

### Tests de Régression
- [ ] Même rendu visuel (capture d'écran)
- [ ] Même comportement interactif
- [ ] Mêmes calculs physiques
- [ ] Mêmes performances

### Tests de Qualité
- [ ] Code plus lisible et organisé
- [ ] Modules réutilisables
- [ ] Documentation des APIs
- [ ] Tests unitaires fonctionnels

## 🚀 Mise en Œuvre

### Étape 1 : Extraction JavaScript
1. Créer la structure de fichiers
2. Extraire le code JavaScript
3. Tester la non-régression
4. Commit : "Extract JavaScript to separate files"

### Étape 2 : Extraction CSS
1. Créer les fichiers CSS
2. Extraire les styles
3. Tester l'apparence
4. Commit : "Extract CSS to separate files"

### Étape 3 : Modularisation
1. Créer les modules un par un
2. Refactoriser progressivement
3. Tester à chaque étape
4. Commit : "Refactor to modular architecture"

### Étape 4 : Optimisation
1. Ajouter tests unitaires
2. Optimiser les performances
3. Documenter les APIs
4. Commit : "Add tests and optimize"

## 🎯 Critères de Succès

✅ **Fonctionnement identique** : L'application fonctionne exactement comme avant
✅ **Code maintenable** : Modules clairs et séparés
✅ **Tests couvrants** : Calculs physiques testés
✅ **Performance maintenue** : Pas de régression de vitesse
✅ **Documentation complète** : APIs documentées

---

Cette stratégie garantit un refactoring sûr et progressif, préservant l'expérience utilisateur tout en améliorant significativement la qualité du code. 