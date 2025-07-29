# 🌌 Visualisation Gravitationnelle - Newton vers Einstein

Un outil pédagogique interactif pour explorer la transition entre la gravitation newtonienne (instantanée) et einsteinienne (propagation causale), avec des fonctionnalités avancées incluant les géodésiques, les vaisseaux spatiaux, les lasers et les trous noirs.

## 🎯 Objectif

Ce projet illustre la différence fondamentale entre :
- **Gravitation Newtonienne** : Effet instantané à distance
- **Gravitation Einsteinienne** : Propagation causale à la vitesse de la lumière

## 🚀 Fonctionnalités

### 🔧 Outils de Base
- **Masse** : Créer des masses gravitationnelles
- **Trou Noir** : Créer un trou noir massif (100,000 unités)
- **Vaisseau Spatial** : Lancer des vaisseaux avec trajectoire relativiste
- **Laser** : Tirer des rayons lumineux avec redshift gravitationnel
- **Géodésique** : Tracer les courbes de niveau du champ gravitationnel

### 🌊 Propagation Causale
- **Fronts d'onde** : Visualisation de la propagation gravitationnelle
- **Système de versions** : Gestion des états temporels des masses
- **Effet de retard** : Les forces n'apparaissent qu'après la propagation

### 🎨 Visualisations
- **Grille** : Représentation discrète de l'espace
- **Vecteurs de force** : Champ gravitationnel en temps réel
- **Trajectoires** : Chemins des vaisseaux et lasers
- **Géodésiques** : Courbes d'équipotentiel avec épaisseur variable

### ⚙️ Paramètres Réglables
- Vitesse de propagation
- Échelle des forces
- Résolution de la grille
- Paramètres des géodésiques
- Amplification de l'épaisseur

## 🛠️ Installation et Utilisation

### Prérequis
- Navigateur web moderne (Chrome, Firefox, Safari, Edge)
- Serveur HTTP local (optionnel mais recommandé)

### Démarrage Rapide

1. **Cloner le projet**
   ```bash
   git clone https://github.com/serge-fantino/EMC2.git
   cd EMC2/gravitation
   ```

2. **Lancer le serveur local**
   ```bash
   python3 -m http.server 8000
   # ou
   python -m http.server 8000
   ```

3. **Ouvrir dans le navigateur**
   ```
   http://localhost:8000
   ```

### Utilisation Directe
Si vous avez un serveur web configuré, placez simplement les fichiers dans votre répertoire web et accédez à `index.html`.

## 🎮 Guide d'Utilisation

### Interface
- **Canvas principal** : Zone de visualisation interactive
- **Palette d'outils** : Sélection des modes d'interaction
- **Panneau de contrôle** : Réglages et informations de debug
- **Panneau des géodésiques** : Paramètres spécifiques aux géodésiques

### Création d'Objets

#### 🌟 Masse
- Clic gauche : Créer une masse
- Clic droit : Supprimer une masse
- Slider : Ajuster la masse

#### 🕳️ Trou Noir
- Sélectionner "Trou Noir" dans la palette
- Clic pour créer un trou noir massif

#### 🚀 Vaisseau Spatial
1. Sélectionner "Vaisseau" dans la palette
2. Premier clic : Position de départ
3. Déplacer la souris : Ajuster la vitesse (limite relativiste)
4. Second clic : Confirmer le lancement
5. ESC : Annuler

#### 🔦 Laser
1. Sélectionner "Laser" dans la palette
2. Premier clic : Position de départ
3. Déplacer la souris : Ajuster la direction
4. Second clic : Confirmer le tir
5. ESC : Annuler

#### 📐 Géodésique
1. Sélectionner "Géodésique" dans la palette
2. Clic pour placer le point de départ
3. La géodésique se calcule automatiquement
4. Utiliser les paramètres pour ajuster le calcul

### Contrôles de Visualisation
- **Grille** : Afficher/masquer la grille
- **Vecteurs** : Afficher/masquer les vecteurs de force
- **Propagation** : Afficher/masquer les fronts d'onde
- **Infos géodésiques** : Afficher/masquer les valeurs de debug

## 🔬 Concepts Physiques

### Propagation Causale
La gravitation ne se propage pas instantanément mais à la vitesse de la lumière. Les fronts d'onde montrent cette propagation.

### Géodésiques
Les géodésiques représentent les "courbes de niveau" du champ gravitationnel, perpendiculaires aux lignes de champ.

### Effets Relativistes
- **Vaisseaux** : Limite de vitesse `c`, capture par trous noirs
- **Lasers** : Vitesse constante `c`, redshift gravitationnel
- **Trous noirs** : Rayon de Schwarzschild pour la capture

### Redshift Gravitationnel
Les lasers changent de couleur selon le potentiel gravitationnel local, illustrant l'effet Einstein.

## 🎛️ Paramètres Avancés

### Géodésiques
- **Pas d'exploration** : Précision du calcul (0.5 par défaut)
- **Pas de courbe** : Distance entre points (10.0 par défaut)
- **Itérations max** : Limite de calcul (10000 par défaut)
- **Seuils de gradient** : Critères d'arrêt (0.001 par défaut)
- **Angle max** : Limite de courbure (400° par défaut)
- **Amplification épaisseur** : Contrôle visuel (1.0 par défaut)

### Propagation
- **Vitesse** : Multiplicateur de la vitesse de propagation
- **Échelle des forces** : Amplification des vecteurs
- **Résolution** : Densité de la grille

## 🔧 Développement

### Structure du Projet
```
gravitation/
├── index.html          # Interface principale
├── css/
│   └── gravity-viz.css # Styles
├── js/
│   └── main.js         # Logique principale
├── README.md           # Ce fichier
└── gravity_viz_specs.md # Spécifications détaillées
```

### Technologies
- **HTML5 Canvas** : Rendu graphique
- **JavaScript ES6+** : Logique de simulation
- **CSS3** : Interface utilisateur
- **Git** : Versioning

### Branches
- `main` : Version stable
- `feature/gravity_demo` : Développement des nouvelles fonctionnalités

## 🎓 Valeur Pédagogique

Cet outil permet de :
- **Visualiser** la différence entre Newton et Einstein
- **Expérimenter** avec les effets gravitationnels
- **Comprendre** la propagation causale
- **Explorer** les géodésiques et la courbure de l'espace-temps
- **Observer** les effets relativistes en temps réel

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer des améliorations
- Ajouter de nouvelles fonctionnalités
- Améliorer la documentation

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

## 🔗 Liens Utiles

- **Démo en ligne** : [Lien vers la démo]
- **Repository** : https://github.com/serge-fantino/EMC2
- **Issues** : https://github.com/serge-fantino/EMC2/issues

---

*Développé avec passion pour l'enseignement de la physique relativiste* 🌟