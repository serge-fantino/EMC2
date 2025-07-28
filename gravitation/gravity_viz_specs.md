# Visualiseur de Propagation Gravitationnelle
*Transition pédagogique Newton → Einstein*

## 🎯 Objectifs du Projet

### Vision Générale
Créer un outil pédagogique interactif illustrant la différence fondamentale entre la gravité newtonienne (instantanée) et einsteinienne (propagation causale). L'approche progressive permet de comprendre intuitivement les concepts relativistes.

### Progression Pédagogique
1. **Phase 1** : Représentation 2D avec forces newtoniennes + propagation relativiste
2. **Phase 2** : Transition vers géodésiques et courbure spatio-temporelle  
3. **Phase 3** : Extensions avancées (redshift, dilatation temporelle)

---

## 📋 Spécifications Fonctionnelles

### Core Features - Phase 1

#### Grille Gravitationnelle 2D
- **Grille de points** : Représentation discrète de l'espace 2D
- **Résolution configurable** : 15×15 à 40×40 points
- **Coordonnées alignées** : Placement précis des objets sur la grille

#### Gestion des Masses
- **Placement interactif** : Clic pour ajouter/modifier des masses
- **Masses variables** : Possibilité d'augmenter/diminuer la masse en un point
- **Visualisation** : Taille proportionnelle à la masse + valeur numérique
- **Suppression** : Retrait des masses existantes

#### Propagation Causale
- **Vitesse finie** : Les effets gravitationnels se propagent à vitesse c (ajustable)
- **Fronts d'onde** : Visualisation des cercles de propagation
- **Causalité** : Les vecteurs force n'apparaissent qu'après passage du front
- **Interférences** : Combinaison des effets de multiples sources

#### Champ de Forces
- **Vecteurs directionnels** : Représentation classique F = GMm/r²
- **Intensité visuelle** : Couleur et taille proportionnelles à la magnitude
- **Mise à jour dynamique** : Recalcul en temps réel selon la propagation

### Extensions - Phase 2

#### Lasers et Géodésiques
- **Rayons laser** : Placement et orientation interactifs
- **Trajectoires courbées** : Visualisation des géodésiques lumineuses
- **Redshift gravitationnel** : Changement de couleur selon le potentiel
- **Déviation angulaire** : Effet de lentille gravitationnelle

#### Horloges Relativistes
- **Temps local** : Affichage du temps propre en chaque point
- **Référence mobile** : Possibilité de choisir l'horloge de référence
- **Dilatation temporelle** : Ralentissement dans les champs intenses
- **Synchronisation** : Démonstration de l'impossibilité du "maintenant universel"

#### Transition Géométrique
- **Vue 3D** : Représentation de la courbure spatio-temporelle
- **Bascule Newton/Einstein** : Même simulation, deux interprétations
- **Lignes de niveau** : Visualisation du potentiel gravitationnel
- **Géodésiques de particules** : Trajectoires "naturelles" dans l'espace courbé

---

## 🏗️ Architecture Technique

### Structure Modulaire

```
GravityVisualizer/
├── core/
│   ├── PhysicsEngine.js      # Calculs gravitationnels
│   ├── PropagationManager.js # Gestion des fronts d'onde
│   └── TimeManager.js        # Synchronisation temporelle
├── rendering/
│   ├── GridRenderer.js       # Affichage de la grille
│   ├── VectorRenderer.js     # Rendu des vecteurs force
│   ├── MassRenderer.js       # Visualisation des masses
│   └── EffectsRenderer.js    # Fronts, lasers, horloges
├── interaction/
│   ├── MouseHandler.js       # Gestion des clics/drags
│   ├── ControlPanel.js       # Interface utilisateur
│   └── ScenarioManager.js    # Sauvegarde/chargement
└── utils/
    ├── MathUtils.js          # Fonctions mathématiques
    ├── CoordinateSystem.js   # Conversions coordonnées
    └── AnimationLoop.js      # Boucle de rendu
```

### Moteur Physique

#### Classes Principales
```javascript
class Mass {
    constructor(x, y, mass, creationTime)
    // Propriétés: position, masse, moment de création
}

class PropagationFront {
    constructor(sourceX, sourceY, startTime)
    update(currentTime, propagationSpeed)
    hasReached(targetX, targetY)
    // Gestion des fronts d'onde sphériques
}

class ForceField {
    calculateAt(x, y, currentTime)
    // Calcul des forces avec causalité
}

class LaserBeam {
    constructor(startX, startY, angle)
    calculateTrajectory(gravitationalField)
    getColorShift(gravitationalPotential)
}
```

#### Algorithmes Clés
1. **Calcul des forces** : Loi de Newton avec limitation causale
2. **Propagation** : Expansion radiale à vitesse constante
3. **Interférences** : Superposition vectorielle des champs
4. **Géodésiques** : Intégration numérique dans l'espace courbe

---

## 🎨 Interface Utilisateur

### Canvas Principal
- **Dimensions** : 800×600px pour Phase 1
- **Grille** : Points discrets avec espacement configurable
- **Interaction** : Clic gauche/droit pour masses, drag pour lasers

### Panneau de Contrôle
- **Paramètres physiques** : Vitesse propagation, constante G
- **Visualisation** : Intensité vecteurs, résolution grille
- **Simulation** : Play/pause, reset, vitesse d'animation
- **Modes** : Basculement Newton/Einstein (Phase 2)

### Indicateurs en Temps Réel
- **Debug** : Nombre d'objets, performance
- **Physique** : Valeurs des champs en point sélectionné
- **Temps** : Horloge globale et locales (Phase 2)

---

## 🚀 Plan d'Implémentation

### Milestone 1 : Base Fonctionnelle
- [ ] Grille 2D interactive avec placement précis
- [ ] Gestion basique des masses (ajout/suppression)
- [ ] Calcul et affichage des vecteurs force statiques
- [ ] Interface de contrôle minimale

### Milestone 2 : Propagation Dynamique
- [ ] Implémentation des fronts de propagation
- [ ] Animation temporelle fluide
- [ ] Causalité : vecteurs conditionnés par les fronts
- [ ] Contrôles de vitesse et intensité

### Milestone 3 : Fonctionnalités Avancées
- [ ] Système de masses variables
- [ ] Sauvegarde/chargement de scénarios
- [ ] Optimisations performance (spatial partitioning)
- [ ] Tests d'interférences complexes

### Milestone 4 : Extensions Relativistes
- [ ] Implémentation des lasers et géodésiques
- [ ] Système d'horloges locales
- [ ] Calcul du redshift gravitationnel
- [ ] Mode de visualisation 3D (Phase 2)

---

## 🔧 Défis Techniques

### Performance
- **Calculs intensifs** : O(N²) pour N masses × M points de grille
- **Solutions** : Spatial hashing, optimisations GPU, calculs différés
- **Cible** : 60fps avec 5 masses sur grille 30×30

### Précision Numérique
- **Singularités** : Gestion des divisions par zéro près des masses
- **Stabilité** : Éviter l'oscillation des vecteurs proches
- **Échelles** : Adaptation dynamique pour visualisation claire

### Interaction Utilisateur
- **Responsivité** : Feedback immédiat malgré les calculs
- **Intuitivité** : Interface claire pour concepts complexes
- **Robustesse** : Gestion des cas limites et erreurs utilisateur

---

## 📚 Extensions Futures

### Scenarios Pédagogiques Prédéfinis
- **Paradoxe des jumeaux** : Avec propagation gravitationnelle
- **Lentille gravitationnelle** : Déviation de rayons lumineux
- **Ondes gravitationnelles** : Masses en mouvement (Phase 3)
- **Trous noirs** : Horizon des événements et géodésiques

### Intégration Éducative
- **Mode guidé** : Tutoriels interactifs step-by-step
- **Annotations** : Explications contextuelles des phénomènes
- **Export** : Sauvegarde d'animations pour présentations
- **Collaboration** : Partage de scénarios entre utilisateurs

---

## 🎓 Valeur Pédagogique

Cette approche progressive permet de :
- **Démystifier** la relativité par la visualisation directe
- **Montrer** la continuité entre Newton et Einstein
- **Illustrer** l'importance de la causalité en physique
- **Expérimenter** avec des concepts abstraits de manière tangible

Le passage des "forces" aux "géodésiques" devient naturel quand l'utilisateur voit la même simulation sous deux angles différents, révélant l'élégance conceptuelle de la relativité générale.