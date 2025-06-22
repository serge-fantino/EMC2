# Domain-Driven Language (DDL) - Visualisation Interactive des Cônes de Lumière

## Vue d'ensemble du projet

Ce document définit le langage ubiquitaire (ubiquitous language) de notre application de visualisation interactive des cônes de lumière en relativité restreinte. Il capture les concepts physiques, les éléments d'interface et les interactions développés au cours de ce projet.

---

## 🌌 Concepts Physiques Fondamentaux

### **Espace-temps (Spacetime)**
Continuum à 4 dimensions (3 spatiales + 1 temporelle) dans lequel se déroulent tous les événements physiques. Dans notre visualisation 2D, nous utilisons 1 dimension spatiale (x) et 1 dimension temporelle (t).

### **Événement (Event)**
Point spécifique dans l'espace-temps, caractérisé par ses coordonnées spatiales et temporelles (x, t).

### **Cône de lumière (Light Cone)**
Structure géométrique fondamentale de la relativité restreinte qui délimite les régions causalement connectées dans l'espace-temps.

#### **Cône de lumière futur (Future Light Cone)**
Ensemble de tous les événements qui peuvent être influencés causalement par un événement donné. Visualisé par des lignes blanches pointillées courtes s'étendant vers le futur.

#### **Cône de lumière passé (Past Light Cone)**
Ensemble de tous les événements qui peuvent avoir influencé causalement un événement donné. Représente l'espace-temps "visible" depuis ce point. Visualisé par des lignes blanches pointillées longues s'étendant vers le passé.

### **Vitesse de la lumière (c)**
Constante physique fondamentale. Dans notre système d'unités normalisé, c = 1. Représente la limite absolue de vitesse et définit la pente des cônes de lumière.

---

## 🎯 Référentiels et Trajectoires

### **Référentiel (Reference Frame)**
Système de coordonnées depuis lequel on observe et mesure les événements physiques. Représenté par un point orange dans l'interface.

### **Origine (Origin)**
Référentiel de base situé au point (0, 0) dans l'espace-temps. Représenté par un point bleu. Sert de référence pour tous les calculs physiques.

### **Référentiel source (Source Frame)**
Référentiel depuis lequel un nouveau référentiel est créé. Détermine les contraintes causales pour le placement du nouveau référentiel.

### **Trajectoire d'accélération (Acceleration Path)**
Chemin dans l'espace-temps suivi par un observateur subissant une accélération constante. Visualisé par des lignes blanches pointillées avec flèches.

### **Ligne d'univers (World Line)**
Trajectoire complète d'un objet dans l'espace-temps, tracée depuis l'origine jusqu'au référentiel considéré.

---

## ⏱️ Concepts Temporels

### **Temps coordonnée (Coordinate Time)**
Temps mesuré dans le référentiel de laboratoire (origine). Correspond à l'axe vertical t de notre diagramme.

### **Temps propre (Proper Time) - τ**
Temps mesuré par une horloge en mouvement avec l'observateur. Toujours inférieur ou égal au temps coordonnée en raison de la dilatation temporelle.

### **Dilatation temporelle (Time Dilation)**
Phénomène relativiste où le temps propre s'écoule plus lentement que le temps coordonnée pour un observateur en mouvement ou subissant une accélération.

### **Isochrone**
Courbe hyperbolique orange représentant tous les événements dans l'espace-temps atteignables depuis l'origine avec le même temps propre. Équation : t = √(τ² + x²/c²).

---

## 🚀 Cinématique Relativiste

### **Vitesse relative (Relative Velocity)**
Vitesse nécessaire pour connecter causalement deux événements dans l'espace-temps. Exprimée en pourcentage de c.

### **Addition relativiste des vitesses (Relativistic Velocity Addition)**
Formule pour combiner les vitesses en relativité : v_total = (v₁ + v₂)/(1 + v₁v₂/c²).

### **Accélération propre (Proper Acceleration)**
Accélération ressentie par l'observateur. Calculée par : a = 2|ΔX|c²/(ΔT² - ΔX²).

### **Limite de vitesse (Velocity Limit)**
Contrainte physique empêchant d'atteindre exactement c. Dans notre implémentation : VELOCITY_EPSILON = 0.001 (99.9% de c maximum).

---

## 🎨 Interface Utilisateur

### **Heatmap des cônes**
Visualisation colorée où chaque pixel représente la vitesse relative nécessaire pour atteindre ce point depuis l'origine :
- **Bleu** : Repos relatif (v ≈ 0)
- **Vert** : Vitesse intermédiaire (limite ajustable)
- **Rouge** : Vitesse élevée (jusqu'à c)
- **Transparent** : Causalement déconnecté (v ≥ c)

### **Cartouche d'information (Info Cartouche)**
Boîte d'information affichant les données physiques d'un référentiel :
- Distance spatiale à l'origine (x)
- Vitesse du segment et vitesse cumulative
- Accélération propre
- Temps coordonnée et temps propre
- Facteur de dilatation temporelle

### **Tooltip isochrone**
Info-bulle interactive apparaissant au survol de l'isochrone, affichant :
- Vitesse nécessaire pour atteindre ce point (% de c)
- Pourcentage de temps propre
- Coordonnées spatiales et temporelles

### **Panneau de calculs (Calculations Panel)**
Interface située en bas à gauche affichant les calculs physiques détaillés du référentiel sélectionné :
- Titre avec numéro du référentiel
- Bouton de suppression (🗑️) pour les référentiels non-origine
- Formules de physique relativiste avec variables et résultats
- Explication des concepts (isochrone, dilatation temporelle, etc.)

### **Panneau de contrôles (Controls Panel)**
Interface située en bas à droite contenant :
- Curseur de résolution d'affichage
- Curseur de limite verte pour le gradient
- Case à cocher pour l'affichage du cône passé
- Boutons "Réinitialiser" et "Effacer Cônes"
- Barre de gradient avec légendes

### **Panneau d'information (Info Panel)**
Interface située en haut à gauche contenant :
- Description générale de l'application
- Légende des couleurs et symboles
- Instructions d'utilisation de base
- Raccourcis clavier (Ctrl+drag)

---

## 🖱️ Interactions

### **Création de référentiel**
Action de cliquer dans un cône de lumière pour créer un nouveau référentiel à cette position.

### **Drag & Drop**
Fonctionnalité permettant de déplacer un référentiel dans son cône source en maintenant le clic et en déplaçant la souris.

### **Contrainte verticale (Ctrl+Drag)**
Mode de déplacement où maintenir la touche Ctrl contraint le mouvement à une ligne verticale (même position x que la source).

### **Sélection de référentiel**
Action de cliquer sur un point d'origine ou une cartouche pour afficher les calculs détaillés et mettre en évidence la trajectoire.

### **Suppression de référentiel**
Action de cliquer sur le bouton "🗑️ Supprimer" dans le panneau de calculs pour effacer un référentiel et tous ses référentiels dérivés. Impossible pour l'origine.

### **Suppression en cascade**
Comportement automatique où la suppression d'un référentiel entraîne la suppression de tous les référentiels qui en dérivent (directement ou indirectement).

---

## 🎛️ Contrôles et Configuration

### **Résolution d'affichage**
Qualité de rendu de la heatmap :
- Basse (8px), Moyenne (4px), Haute (2px)

### **Limite verte (Green Limit)**
Seuil de vitesse (0.1c à 0.8c) définissant la transition entre bleu et vert dans le gradient de couleur.

### **Limite rouge (Red Limit)**
Fixée à 1.0c (vitesse de la lumière), définit la transition entre rouge et transparent.

### **Affichage du cône passé**
Option pour visualiser ou masquer les cônes de lumière passé des référentiels sélectionnés.

---

## 🔧 Concepts Techniques

### **Échelle de visualisation (Scale)**
Facteur de conversion entre coordonnées d'écran et coordonnées physiques. Valeur par défaut : 2.

### **Marge de sécurité causale**
Pourcentage de marge (2%) appliqué aux limites des cônes de lumière pour éviter les vitesses supraluminiques lors des interactions.

### **Placement anti-collision**
Algorithme de recherche spiralée pour positionner les cartouches sans chevauchement, avec priorité à l'origine puis ordre de création.

### **Alpha blending**
Technique de rendu permettant la superposition transparente de multiples cônes de lumière.

---

## 📐 Formules Clés

### **Métrique de Minkowski**
ds² = -c²dt² + dx²

### **Trajectoire d'accélération constante**
x(t) = (c²/a) × (√(1 + (at/c)²) - 1)

### **Temps propre pour accélération constante**
τ = (c/a) × sinh⁻¹(aT/c)

### **Isochrone depuis l'origine**
t = √(τ² + x²/c²)

---

## 🎓 Valeur Pédagogique

### **Concepts enseignés**
- Structure causale de l'espace-temps
- Dilatation temporelle et paradoxe des jumeaux
- Limites de vitesse en relativité
- Géométrie hyperbolique de l'espace-temps de Minkowski
- Addition relativiste des vitesses

### **Interactions éducatives**
- Exploration interactive des trajectoires
- Visualisation en temps réel des effets relativistes
- Comparaison quantitative des différents référentiels
- Expérimentation avec les contraintes causales

---

## 📋 États du Système

### **Mode normal**
État par défaut où l'utilisateur peut créer, sélectionner et déplacer des référentiels.

### **Mode drag**
État temporaire pendant le déplacement d'un référentiel ou d'une cartouche.

### **Mode hover isochrone**
État où la tooltip isochrone est affichée au survol de la courbe.

### **Mode contrainte verticale**
État spécial activé par Ctrl+drag pour limiter le mouvement à l'axe temporel.

---

## 🔄 Événements du Système

### **Création de référentiel (ReferenceFrameCreated)**
Déclenché lors du clic dans un cône de lumière valide.

### **Déplacement de référentiel (ReferenceFrameMoved)**
Déclenché lors du drag & drop d'un référentiel.

### **Sélection de référentiel (ReferenceFrameSelected)**
Déclenché lors du clic sur un point d'origine ou une cartouche.

### **Mise à jour de la physique (PhysicsUpdated)**
Déclenché après chaque modification nécessitant un recalcul des valeurs physiques.

### **Suppression de référentiel (ReferenceFrameDeleted)**
Déclenché lors de la suppression d'un référentiel via le bouton de suppression.

### **Suppression en cascade (CascadeDelete)**
Déclenché lors de la suppression automatique des référentiels dérivés suite à la suppression de leur référentiel parent.

### **Réindexation (ReindexingComplete)**
Déclenché après la mise à jour des indices des référentiels suite à une suppression.

---

## 🏗️ Architecture du Code

### **Modules principaux**
- **Rendu (Rendering)** : Gestion de l'affichage Canvas 2D
- **Physique (Physics)** : Calculs relativistes
- **Interactions (Interactions)** : Gestion des événements souris
- **Interface (UI)** : Contrôles et affichage d'informations

### **Structures de données**
- **coneOrigins[]** : Array des référentiels avec leurs propriétés physiques
- **currentPlacements[]** : Positions optimisées des cartouches
- **config{}** : Configuration globale de l'application

---

*Ce document évolue avec le projet et capture notre compréhension partagée des concepts physiques et techniques impliqués dans la visualisation interactive des cônes de lumière relativistes.* 