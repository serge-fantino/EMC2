# Refactoring du fichier main.js - Suivi et Stratégie

## 📋 Vue d'ensemble

Le fichier `gravitation/js/main.js` est devenu trop volumineux (1955 lignes) et nécessite un refactoring progressif pour améliorer la maintenabilité et la lisibilité du code.

**Objectif :** Découper le fichier en modules logiques tout en garantissant que l'application fonctionne à chaque étape (approche iso-fonctionnelle).

## 🎯 Stratégie de refactoring

### Principes
- **Approche progressive** : Une étape à la fois
- **Iso-fonctionnalité** : L'application doit fonctionner exactement comme avant à chaque étape
- **Tests continus** : Vérifier le bon fonctionnement après chaque modification
- **Documentation** : Mettre à jour ce document à chaque étape

### Structure cible
```
gravitation/js/
├── main.js (fichier principal simplifié)
├── core/
│   ├── PhysicsConstants.js (constantes physiques)
│   ├── PhysicsUtils.js (utilitaires de calcul)
│   ├── VersionManager.js (système de versions)
│   ├── ObjectManager.js (gestion des objets)
│   └── AnimationLoop.js (boucle d'animation)
├── rendering/
│   ├── GridRenderer.js (rendu de la grille)
│   ├── MassRenderer.js (rendu des masses)
│   ├── SpacecraftRenderer.js (rendu des vaisseaux)
│   ├── LaserRenderer.js (rendu des lasers)
│   ├── GeodesicRenderer.js (rendu des géodésiques)
│   ├── ClockRenderer.js (rendu des horloges)
│   ├── VectorRenderer.js (rendu des vecteurs)
│   └── PropagationRenderer.js (rendu de la propagation)
└── interaction/
    ├── EventManager.js (gestion des événements)
    ├── ToolManager.js (gestion des outils)
    └── PlacementManager.js (gestion du placement)
```

## 📊 Analyse du code actuel

### Modules identifiés dans main.js (1955 lignes)

1. **Variables globales et configuration** (lignes 1-90)
   - Variables d'état de l'application
   - Constantes physiques (G, c, maxSpeed)
   - Configuration de l'interface

2. **Physique et calculs** (lignes 34-90, 381-450, 1317-1680)
   - `calculateEventHorizon`, `calculateGravitationalRedshift`, `redshiftToColor`
   - `calculateSchwarzschildMetric`, `calculateChristoffelSymbols`
   - `calculateGravitationalGradient`, `calculateGravitationalTimeDilation`
   - `normalizeVector`

3. **Gestion des objets** (lignes 92-450)
   - `addMass`, `removeMass`, `addSpacecraft`, `addBlackHole`, `addLaser`
   - `addGeodesic`, `addClock`

4. **Mise à jour et simulation** (lignes 227-380, 470-615, 1506-1680)
   - `updateSpacecrafts`, `updateLasers`, `updateGeodesics`, `updateClocks`

5. **Rendu et affichage** (lignes 475-1247, 1874-1945)
   - `drawGrid`, `drawMasses`, `drawSpacecrafts`, `drawLasers`
   - `drawPropagation`, `drawVectors`, `drawGeodesics`, `drawClocks`

6. **Système de versions** (lignes 694-780)
   - `createNewVersion`, `cleanupOldVersions`, `initializeGridVersions`
   - `getGridVersionIndex`, `updateGridPointVersion`, `getMassesForVersion`

7. **Gestion des événements** (lignes 1500-1955)
   - Gestionnaires d'événements mouseup, mousemove, keydown
   - Fonctions de placement et d'annulation

8. **Boucle d'animation** (lignes 1247-1316)
   - `animate()`

## 🚀 Plan d'exécution

### Étape 1 : Constantes et utilitaires physiques ✅
**Fichiers créés :**
- `js/core/PhysicsConstants.js`
- `js/core/PhysicsUtils.js`

**Fonctions déplacées :**
- Constantes : `G`, `c`, `maxSpeed`, `spacecraftSpeed`
- Fonctions : `calculateEventHorizon`, `calculateGravitationalRedshift`, `redshiftToColor`, `normalizeVector`

**Dépendances :** Aucune (fonctions indépendantes)
**Risque :** Faible
**Statut :** ✅ Terminé

### Étape 2 : Système de versions ✅
**Fichiers créés :**
- `js/core/VersionManager.js`

**Fonctions déplacées :**
- `createNewVersion`, `cleanupOldVersions`, `initializeGridVersions`
- `getGridVersionIndex`, `updateGridPointVersion`, `getMassesForVersion`
- `updateGridVersionsForFront`
- Variables : `currentVersion`, `massHistory`, `gridVersions`, `maxVersions`

**Dépendances :** Accès aux variables globales `masses`
**Risque :** Moyen
**Statut :** ✅ Terminé

### Étape 3 : Fonctions de rendu ⏳
**Fichiers à créer :**
- `js/rendering/GridRenderer.js`
- `js/rendering/MassRenderer.js`
- `js/rendering/SpacecraftRenderer.js`
- `js/rendering/LaserRenderer.js`
- `js/rendering/GeodesicRenderer.js`
- `js/rendering/ClockRenderer.js`
- `js/rendering/VectorRenderer.js`
- `js/rendering/PropagationRenderer.js`

**Fonctions à déplacer :**
- `drawGrid`, `drawMasses`, `drawSpacecrafts`, `drawLasers`
- `drawPropagation`, `drawVectors`, `drawGeodesics`, `drawClocks`

**Dépendances :** Accès à `ctx`, variables globales d'état
**Risque :** Moyen
**Statut :** À faire

### Étape 4 : Gestion des objets ⏳
**Fichiers à créer :**
- `js/core/ObjectManager.js`

**Fonctions à déplacer :**
- `addMass`, `removeMass`, `addSpacecraft`, `addBlackHole`, `addLaser`
- `addGeodesic`, `addClock`

**Dépendances :** Accès aux tableaux d'objets, fonctions de calcul
**Risque :** Élevé
**Statut :** À faire

### Étape 5 : Mise à jour et simulation ⏳
**Fichiers à créer :**
- `js/core/SimulationManager.js`

**Fonctions à déplacer :**
- `updateSpacecrafts`, `updateLasers`, `updateGeodesics`, `updateClocks`

**Dépendances :** Accès aux tableaux d'objets, fonctions de calcul
**Risque :** Élevé
**Statut :** À faire

### Étape 6 : Gestion des événements ⏳
**Fichiers à créer :**
- `js/interaction/EventManager.js`
- `js/interaction/ToolManager.js`
- `js/interaction/PlacementManager.js`

**Fonctions à déplacer :**
- Gestionnaires d'événements
- Fonctions de placement et d'annulation

**Dépendances :** Accès à toutes les fonctions et variables
**Risque :** Très élevé
**Statut :** À faire

### Étape 7 : Boucle d'animation ⏳
**Fichiers à créer :**
- `js/core/AnimationLoop.js`

**Fonctions à déplacer :**
- `animate()`

**Dépendances :** Accès à toutes les fonctions de mise à jour et de rendu
**Risque :** Très élevé
**Statut :** À faire

## 📝 Journal des modifications

### [Date] - Initialisation
- ✅ Création du document de suivi
- ✅ Analyse de la structure actuelle du code
- ✅ Définition du plan de refactoring

### [Date] - Étape 1 terminée
- ✅ Création de `js/core/PhysicsConstants.js` avec les constantes physiques
- ✅ Création de `js/core/PhysicsUtils.js` avec les fonctions utilitaires
- ✅ Modification de `main.js` pour importer les modules
- ✅ Modification de `index.html` pour utiliser les modules ES6
- ✅ Suppression du code extrait du `main.js`
- ✅ Test de l'application (serveur lancé sur port 8000)

### [Date] - Correction de bug
- ✅ Correction de l'erreur "Identifier 'addGeodesic' has already been declared"
- ✅ Suppression de la fonction `addGeodesic` obsolète (ligne 399)
- ✅ Conservation de la version moderne de `addGeodesic` (ligne 1291)
- ✅ Vérification qu'aucun appel à l'ancienne signature n'existe
- ✅ Correction de l'erreur "Identifier 'updateGeodesics' has already been declared"
- ✅ Suppression de la fonction `updateGeodesics` obsolète (ligne 401)
- ✅ Conservation de la version moderne de `updateGeodesics` (ligne 1429)
- ✅ Vérification qu'aucune autre duplication de fonction n'existe

### [Date] - Étape 2 terminée
- ✅ Création de `js/core/VersionManager.js` avec le système de versions complet
- ✅ Documentation détaillée du système de propagation causale gravitationnelle
- ✅ Modification de `main.js` pour importer le module VersionManager
- ✅ Suppression du code extrait du `main.js`
- ✅ Adaptation des appels pour créer les fronts de propagation
- ✅ Initialisation du gestionnaire de versions avec les dépendances

### [Date] - Correction de bug après Étape 2
- ✅ Correction de l'erreur "currentVersion is not defined"
- ✅ Remplacement de toutes les références aux variables supprimées par les fonctions du module
- ✅ Correction de `updateDebugInfo()`, `reset()`, `updateSpacecrafts()`, `updateLasers()`
- ✅ Correction de `drawLasers()`, `drawVectors()`, `updateClocks()`, `drawClocks()`
- ✅ Utilisation de `getCurrentVersion()`, `getGridVersions()` et autres fonctions du module

## ⚠️ Points d'attention

### Dépendances critiques
- Variables globales partagées entre modules
- Accès au contexte Canvas (`ctx`)
- État de l'application distribué

## 🔬 Analyse du système de versions

### Concept principal
Le système de versions simule la **propagation causale de la gravitation** selon les principes de la relativité générale d'Einstein, où les effets gravitationnels ne se propagent pas instantanément mais à la vitesse de la lumière.

### Grands principes

#### 1. **Propagation causale**
- Les modifications de masse créent des "ondes gravitationnelles" qui se propagent à la vitesse de la lumière
- Chaque point de l'espace voit une version différente de l'univers selon sa distance aux sources gravitationnelles
- Simulation de la causalité relativiste : les événements ne peuvent pas influencer le passé

#### 2. **Versions temporelles**
- Chaque modification de masse incrémente la version de l'univers
- L'historique des configurations de masses est conservé
- Système de round-robin pour limiter la mémoire utilisée

#### 3. **Grille versionnée**
- Chaque point de la grille a sa propre "version" qui détermine quelles masses il "voit"
- Les fronts de propagation mettent à jour les versions de la grille
- Les calculs physiques (gravitation, redshift, dilatation temporelle) utilisent les masses de la version locale

#### 4. **Effets relativistes simulés**
- **Vaisseaux spatiaux** : Voient des versions différentes selon leur position
- **Horloges** : Battent à des rythmes différents selon le champ gravitationnel local
- **Lasers** : Subissent un redshift gravitationnel selon le potentiel local
- **Géodésiques** : Calculées selon la configuration gravitationnelle locale

### Variables clés
```javascript
let currentVersion = 0;           // Version actuelle de l'univers
let massHistory = [];             // Historique des configurations de masses
let gridVersions = [];            // Version de chaque point de grille
let maxVersions = 50;             // Limite pour le round-robin
```

### Fonctions principales
- `createNewVersion()` - Crée une nouvelle version quand une masse change
- `cleanupOldVersions()` - Nettoie les anciennes versions (round-robin)
- `getMassesForVersion()` - Récupère les masses visibles pour une version donnée
- `updateGridVersionsForFront()` - Met à jour les versions de la grille selon la propagation
- `getGridVersionIndex()` - Convertit les coordonnées en indices de grille
- `updateGridPointVersion()` - Met à jour la version d'un point de grille

### Stratégie de gestion des dépendances
1. **Phase 1** : Extraire les modules indépendants
2. **Phase 2** : Créer un système de gestion d'état centralisé
3. **Phase 3** : Refactorer les modules avec dépendances

### Tests à effectuer après chaque étape
- [ ] L'application se charge sans erreur
- [ ] Tous les outils fonctionnent (masse, vaisseau, trou noir, laser, géodésiques, horloge)
- [ ] La simulation fonctionne correctement
- [ ] Les contrôles de l'interface utilisateur répondent
- [ ] Les performances sont maintenues

## 🎯 Objectifs de qualité

- **Maintenabilité** : Code modulaire et lisible
- **Performance** : Pas de dégradation des performances
- **Fonctionnalité** : Aucune régression fonctionnelle
- **Documentation** : Code bien documenté
- **Tests** : Validation à chaque étape

---

*Ce document sera mis à jour à chaque étape du refactoring.* 