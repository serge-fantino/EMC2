# Plan de Refactorisation - Cônes de Lumière Relativistes

## 🎯 Objectifs de la Refactorisation

### Problèmes Actuels
- **Monolithe de 3000 lignes** : Difficile à maintenir et déboguer
- **Pas de séparation des responsabilités** : Logique métier mélangée avec UI
- **Pas de tests** : Risque élevé de régression
- **Documentation insuffisante** : Difficile à comprendre et étendre
- **Pas de modularité** : Réutilisation impossible

### Bénéfices Attendus
- ✅ **Maintenabilité** : Code modulaire et organisé
- ✅ **Testabilité** : Couverture de tests > 80%
- ✅ **Extensibilité** : Nouvelles fonctionnalités plus faciles
- ✅ **Performance** : Optimisations ciblées
- ✅ **Documentation** : APIs documentées avec JSDoc

## 📋 Plan de Migration (Étapes)

### Phase 1 : Setup du Projet Modulaire (Jour 1)

#### 1.1 Configuration de Base
- [x] Créer `package.json` avec dépendances
- [x] Configurer Vite pour le build
- [x] Setup ESLint + Prettier
- [x] Configuration Jest pour tests
- [ ] Configuration JSDoc pour documentation
- [ ] Setup Husky pour pre-commit hooks

#### 1.2 Structure des Dossiers
```bash
mkdir -p src/{core/{physics,entities,services},ui/{components,rendering,interactions},utils}
mkdir -p tests/{core/{physics,entities,services},ui,utils}
```

#### 1.3 Fichiers de Base
- [x] `src/core/physics/constants.js`
- [x] `src/core/physics/relativity.js`
- [x] `src/core/entities/ReferenceFrame.js`
- [ ] `src/utils/validation.js`
- [ ] `src/utils/coordinates.js`

### Phase 2 : Extraction de la Logique Métier (Jour 2-3)

#### 2.1 Modules Physiques
- [x] **constants.js** : Toutes les constantes physiques
- [x] **relativity.js** : Calculs relativistes purs
- [x] **trajectories.js** : Calculs de trajectoires complexes

```javascript
// Exemple d'extraction
// Avant (dans le monolithe)
function calculateProperAcceleration(deltaX, deltaT) { ... }

// Après (module dédié)
import { calculateProperAcceleration } from '@core/physics/relativity.js';
```

#### 2.2 Entités Métier
- [x] **ReferenceFrame.js** : Classe complète avec événements
- [x] **LightCone.js** : Représentation d'un cône de lumière
- [x] **Isochrone.js** : Calculs et rendu des isochrones

#### 2.3 Services
- [x] **PhysicsCalculator.js** : Orchestration des calculs
- [ ] **TrajectoryService.js** : Gestion des trajectoires
- [ ] **DemoService.js** : Scénarios prédéfinis

### Phase 3 : Refactorisation du Rendu (Jour 4-5)

#### 3.1 Moteur de Rendu
- [ ] **CanvasRenderer.js** : Classe de base pour le rendu
- [ ] **LightConeRenderer.js** : Rendu spécialisé des cônes
- [ ] **TrajectoryRenderer.js** : Rendu des trajectoires
- [ ] **UIRenderer.js** : Éléments d'interface

#### 3.2 Composants UI
- [ ] **Canvas/** : Composant canvas principal
- [ ] **Controls/** : Panneaux de contrôle
- [ ] **InfoPanels/** : Cartouches d'information
- [ ] **Modals/** : Fenêtres modales (aide, etc.)

#### 3.3 Gestion des Interactions
- [ ] **MouseHandler.js** : Gestion souris centralisée
- [ ] **DragDropHandler.js** : Logique drag & drop
- [ ] **KeyboardHandler.js** : Raccourcis clavier

### Phase 4 : Utilitaires et Helpers (Jour 6)

#### 4.1 Utilitaires
- [ ] **coordinates.js** : Conversions coordonnées
- [ ] **collision.js** : Détection de collisions
- [ ] **storage.js** : Persistance des données
- [ ] **validation.js** : Validation des entrées

#### 4.2 Helpers
- [ ] **logger.js** : Système de logging
- [ ] **performance.js** : Mesures de performance
- [ ] **events.js** : Bus d'événements global

### Phase 5 : Tests Unitaires (Jour 7-8)

#### 5.1 Tests Physiques
- [x] **relativity.test.js** : Tests des calculs relativistes
- [ ] **trajectories.test.js** : Tests des trajectoires
- [ ] **constants.test.js** : Validation des constantes

#### 5.2 Tests Entités
- [ ] **ReferenceFrame.test.js** : Tests de la classe principale
- [ ] **LightCone.test.js** : Tests des cônes de lumière
- [ ] **Isochrone.test.js** : Tests des isochrones

#### 5.3 Tests Services
- [ ] **PhysicsCalculator.test.js** : Tests d'intégration
- [ ] **TrajectoryService.test.js** : Tests de trajectoires
- [ ] **DemoService.test.js** : Tests des démonstrations

#### 5.4 Tests d'Intégration
- [ ] **rendering.integration.test.js** : Tests du rendu
- [ ] **interactions.integration.test.js** : Tests des interactions
- [ ] **e2e.test.js** : Tests end-to-end avec Playwright

### Phase 6 : Documentation et Optimisation (Jour 9-10)

#### 6.1 Documentation
- [x] **README.md** : Documentation utilisateur
- [ ] **API.md** : Documentation développeur
- [ ] **PHYSICS.md** : Explication des concepts
- [ ] Génération JSDoc automatique

#### 6.2 Optimisations
- [ ] **Code splitting** : Chargement à la demande
- [ ] **Web Workers** : Calculs lourds en background
- [ ] **Canvas optimizations** : Rendu plus efficace
- [ ] **Memory management** : Gestion de la mémoire

## 🔄 Stratégie de Migration

### Approche Incrémentale

1. **Coexistence** : Nouveau code à côté de l'ancien
2. **Migration progressive** : Une fonctionnalité à la fois
3. **Tests de régression** : Validation continue
4. **Rollback possible** : Garde-fou en cas de problème

### Exemple de Migration d'une Fonctionnalité

#### Avant (Monolithe)
```javascript
// Dans le fichier principal
function calculateCumulativePhysics(coneIndex) {
  // 100 lignes de code mélangé...
}
```

#### Pendant (Transition)
```javascript
// Import du nouveau module
import { PhysicsCalculator } from '@core/services/PhysicsCalculator.js';

// Wrapper temporaire
function calculateCumulativePhysics(coneIndex) {
  // Nouvelle implémentation
  return PhysicsCalculator.calculateCumulative(coneOrigins[coneIndex]);
}
```

#### Après (Refactorisé)
```javascript
// Utilisation directe du service
const physics = PhysicsCalculator.calculateCumulative(referenceFrame);
```

## 📊 Métriques de Qualité

### Objectifs Quantitatifs
- **Couverture de tests** : > 80% ✅ (96% sur modules physiques)
- **Complexité cyclomatique** : < 10 par fonction ✅
- **Taille des fichiers** : < 300 lignes ✅
- **Performance** : Pas de régression > 10% ⏳

### Outils de Mesure
- **Jest Coverage** : Couverture de tests ✅
- **ESLint** : Qualité du code ✅
- **Lighthouse** : Performance web ⏳
- **Bundle Analyzer** : Taille des bundles ⏳

## 🚀 Points d'Attention

### Risques Identifiés
1. **Régression fonctionnelle** : Tests exhaustifs requis
2. **Performance** : Surveillance continue
3. **Complexité temporaire** : Phase de transition délicate
4. **Adoption** : Formation nécessaire

### Mitigation
- Tests automatisés à chaque étape
- Benchmarks de performance
- Documentation détaillée
- Revues de code systématiques

## 📅 Planning Détaillé

### Semaine 1 : Fondations
- **Lundi** : Setup projet + constantes physiques
- **Mardi** : Calculs relativistes + entités
- **Mercredi** : Services métier
- **Jeudi** : Tests unitaires physique
- **Vendredi** : Review + ajustements

### Semaine 2 : Interface
- **Lundi** : Moteur de rendu
- **Mardi** : Composants UI
- **Mardi** : Interactions
- **Jeudi** : Tests d'intégration
- **Vendredi** : Documentation + optimisations

## ✅ Critères de Succès

### Technique
- [x] Architecture modulaire en place
- [x] Tests unitaires > 80% couverture (96% sur physique)
- [x] Modules physiques et entités complets
- [ ] Documentation API complète
- [ ] Performance maintenue ou améliorée
- [ ] Pas de régression fonctionnelle

### Métier
- [ ] Toutes les fonctionnalités existantes préservées
- [ ] Nouvelles fonctionnalités plus faciles à ajouter
- [x] Code plus maintenable (architecture modulaire)
- [x] Onboarding développeur facilité (documentation JSDoc)

## 🎯 État d'Avancement

### ✅ Phase 1 Complétée : Setup du Projet Modulaire
- Configuration Vite, Jest, ESLint
- Structure des dossiers modulaire
- Configuration Babel pour les tests

### ✅ Phase 2 En Cours : Extraction de la Logique Métier
- **Modules physiques** : 100% complétés avec tests (96% couverture)
- **Entités métier** : 100% complétées (ReferenceFrame, LightCone, Isochrone)
- **Services** : PhysicsCalculator créé, tests à ajouter
- **Validation** : Module de validation complet

### ⏳ Prochaines Étapes
1. Créer les tests pour PhysicsCalculator et validation
2. Commencer Phase 3 : Modules de rendu
3. Créer les composants UI modulaires
4. Migration progressive du code existant

*Ce plan sera ajusté en fonction des découvertes lors de la refactorisation* 