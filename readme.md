# Visualisation Interactive des Cônes de Lumière Relativistes

Une application web interactive pour explorer les concepts de relativité restreinte, visualiser les cônes de lumière et comprendre le paradoxe des jumeaux.

## 🚀 Fonctionnalités

- **Visualisation Interactive** : Cônes de lumière avec gradient de couleurs représentant les vitesses relatives
- **Création de Référentiels** : Clic et glisser-déposer pour créer des trajectoires d'accélération
- **Calculs Physiques Précis** : Équations relativistes correctes pour l'accélération et la dilatation temporelle
- **Démonstration du Paradoxe des Jumeaux** : Scénario automatique illustrant les effets relativistes
- **Isochrones Interactives** : Courbes de temps propre constant avec tooltips informatifs
- **Sauvegarde/Chargement** : Persistance des configurations et commentaires

## 🏗️ Architecture Modulaire

```
src/
├── core/                   # Logique métier principale
│   ├── physics/           # Calculs physiques relativistes
│   │   ├── constants.js   # Constantes physiques
│   │   ├── relativity.js  # Équations relativistes
│   │   └── trajectories.js # Calculs de trajectoires
│   ├── entities/          # Modèles de données
│   │   ├── ReferenceFrame.js
│   │   ├── LightCone.js
│   │   └── Isochrone.js
│   └── services/          # Services métier
│       ├── PhysicsCalculator.js
│       ├── TrajectoryService.js
│       └── DemoService.js
├── ui/                    # Interface utilisateur
│   ├── components/        # Composants UI réutilisables
│   │   ├── Canvas/
│   │   ├── Controls/
│   │   ├── InfoPanels/
│   │   └── Modals/
│   ├── rendering/         # Moteur de rendu
│   │   ├── CanvasRenderer.js
│   │   ├── LightConeRenderer.js
│   │   ├── TrajectoryRenderer.js
│   │   └── UIRenderer.js
│   └── interactions/      # Gestion des interactions
│       ├── MouseHandler.js
│       ├── DragDropHandler.js
│       └── KeyboardHandler.js
├── utils/                 # Utilitaires
│   ├── coordinates.js     # Conversions de coordonnées
│   ├── collision.js       # Détection de collisions
│   ├── storage.js         # Persistance des données
│   └── validation.js      # Validation des données
└── tests/                 # Tests unitaires
    ├── physics/
    ├── entities/
    ├── services/
    └── utils/
```

## 📦 Installation et Utilisation

### Mode Développement

```bash
# Cloner le repository
git clone [url-du-repo]
cd light-cones-visualization

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Lancer les tests
npm test

# Lancer les tests en mode watch
npm run test:watch
```

### Mode Production

```bash
# Build de production
npm run build

# Servir les fichiers statiques
npm run serve
```

## 🧪 Tests

Le projet utilise **Jest** pour les tests unitaires avec une couverture complète :

```bash
# Tests unitaires
npm test

# Tests avec couverture
npm run test:coverage

# Tests end-to-end
npm run test:e2e
```

### Structure des Tests

- **Physics Tests** : Validation des calculs relativistes
- **Entity Tests** : Tests des modèles de données
- **Service Tests** : Tests de la logique métier
- **Rendering Tests** : Tests du moteur de rendu
- **Integration Tests** : Tests d'intégration des composants

## 📚 Documentation

### API Documentation

La documentation complète de l'API est générée automatiquement avec **JSDoc** :

```bash
npm run docs
```

### Concepts Physiques

- **Cônes de Lumière** : Régions causalement connectées dans l'espace-temps
- **Référentiels** : Points d'origine des trajectoires d'accélération
- **Temps Propre** : Temps mesuré par une horloge en mouvement
- **Addition Relativiste des Vitesses** : Composition non-linéaire des vitesses

### Exemples d'Usage

```javascript
import { PhysicsCalculator } from './src/core/services/PhysicsCalculator.js';
import { ReferenceFrame } from './src/core/entities/ReferenceFrame.js';

// Créer un nouveau référentiel
const frame = new ReferenceFrame({
  position: { x: 100, t: 200 },
  sourceFrame: originFrame
});

// Calculer la physique cumulative
const physics = PhysicsCalculator.calculateCumulative(frame);
console.log(`Vitesse finale: ${physics.finalVelocity}c`);
console.log(`Temps propre: ${physics.properTime}t`);
```

## 🔧 Configuration

### Variables d'Environnement

```env
# Mode de développement
NODE_ENV=development

# Configuration du rendu
CANVAS_RESOLUTION=high
PHYSICS_PRECISION=0.001

# Configuration des tests
TEST_TIMEOUT=5000
```

### Configuration du Build

Le projet utilise **Vite** pour le bundling avec support :
- ES6 modules
- Hot Module Replacement
- Tree shaking
- Code splitting

## 🤝 Contribution

### Guidelines de Développement

1. **Code Style** : ESLint + Prettier
2. **Commits** : Conventional Commits
3. **Tests** : Couverture minimale de 80%
4. **Documentation** : JSDoc obligatoire pour les APIs publiques

### Workflow de Contribution

```bash
# Créer une branche feature
git checkout -b feature/nouvelle-fonctionnalité

# Développer avec tests
npm run test:watch

# Vérifier le code
npm run lint
npm run test:coverage

# Créer une Pull Request
```

## 📈 Performance

### Optimisations Implémentées

- **Canvas Rendering** : ImageData pour les performances
- **Event Handling** : Debouncing pour les interactions
- **Memory Management** : Nettoyage des références
- **Code Splitting** : Chargement à la demande

### Métriques de Performance

- **First Paint** : < 100ms
- **Interactive** : < 500ms
- **Bundle Size** : < 200KB (gzipped)

## 🐛 Débogage

### Outils de Développement

```javascript
// Mode debug
window.DEBUG = true;

// Accès aux internals
window.LightCones = {
  physics: PhysicsCalculator,
  entities: { ReferenceFrame, LightCone },
  renderer: CanvasRenderer
};
```

### Logging

Le système de logging intégré permet un débogage fin :

```javascript
import { Logger } from './src/utils/logger.js';

const logger = new Logger('PhysicsCalculator');
logger.debug('Calculating trajectory', { from, to });
```

## 📄 Licence

MIT License - Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- **Einstein** pour la relativité restreinte
- **Minkowski** pour la géométrie de l'espace-temps
- **Langevin** pour le paradoxe des jumeaux
- **La communauté Open Source** pour les outils et librairies

---

*Développé avec ❤️ en utilisant le "vibe coding" conversationnel*