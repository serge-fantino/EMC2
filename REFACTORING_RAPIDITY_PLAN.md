# Plan de Refactoring TDD : Calculs Basés sur la Rapidité

## Objectif Principal
Refactoriser les calculs relativistes en utilisant une approche **Test-Driven Development (TDD)** progressive, en partant d'une feuille blanche pour éviter les régressions.

## Approche TDD Progressive

### Phase 0 : Nouveau Module (Fondations minimales)
- Créer un nouveau module `physics_relativistic` parallèle au module existant, sans toucher au code en production.
- **N'implémenter que le strict nécessaire** pour la phase 1 :
  - Fonctions hyperboliques précises (`artanh`, `arsinh`, `arcosh`)
  - Conversion vitesse/rapidité si besoin immédiat
- Reporter toute autre utilité tant qu'elle n'est pas requise par les tests de la phase 1/2.

### Phase 1 : Rendez-vous & Trajectoires (incluant la démo des jumeaux)
- Implémenter et tester la résolution du problème de rendez-vous **et la génération de trajectoires** paramétriques pour chaque segment du voyage (aller ET retour, gestion explicite de l’accélération négative).
- **Démo des jumeaux** :
  - Cas aller : accélération positive
  - Cas retour : accélération négative (décélération puis accélération dans l’autre sens)
  - Les tests doivent valider la continuité des vitesses et la cohérence des temps propres/coordonnés pour chaque segment.
- **Tests unitaires** :
  - Cas A : v₀ = 0 (départ du repos, aller simple)
  - Cas B : v₀ > 0 (aller simple)
  - Cas C : aller-retour (démo des jumeaux, avec inversion du signe de l’accélération)
  - Cas limites (rendez-vous impossible, etc.)

### Phase 2 : Intégration à la visualisation
- Intégrer les nouvelles trajectoires à la visualisation.
- Adapter l’affichage des trajectoires et des isochrones si nécessaire.

### Phase 3 : Interface (Affichage Enrichi)
- Mettre à jour l'affichage avec les nouvelles informations (rapidité, énergie, consommation, vitesse initiale dans le référentiel).
- Maintenir la compatibilité avec l’interface existante.

### Phase 4 : Validation (Démo des Jumeaux)
- S'assurer que la démo fonctionne avec les nouveaux calculs, y compris la gestion de l’accélération négative.
- Valider la continuité des vitesses entre segments.

### Phase 5 : Migration et Optimisation
- Migration progressive des appels depuis l’ancien module vers le nouveau.
- Optimisation et nettoyage final.

---

## Plan Détaillé TDD

### Phase 0 : Nouveau Module - Fondations minimales (1 jour)

#### 0.1 Structure du nouveau module
```
js/physics_relativistic/
├── constants.js           ← Constantes de base
├── rapidity.js           ← Fonctions de rapidité
├── rendezvous.js         ← Résolution du rendez-vous
├── trajectory.js         ← Trajectoires paramétriques
├── index.js              ← Point d'entrée
```

#### 0.2 Fonctions à implémenter immédiatement
- Fonctions hyperboliques précises (`artanh`, `arsinh`, `arcosh`)
- Conversion vitesse/rapidité si besoin pour la phase 1
- Reporter tout le reste

### Phase 1 : Rendez-vous & Trajectoires (TDD, 2-3 jours)

#### 1.1 Tests unitaires pour le rendez-vous et les trajectoires
```javascript
// tests/unit/rendezvous.test.js
describe('Rendezvous & Trajectory Solution', () => {
    test('Case A: v₀ = 0 (aller simple)', () => { ... });
    test('Case B: v₀ > 0 (aller simple)', () => { ... });
    test('Case C: Twin paradox (aller-retour, accélération négative au retour)', () => {
        // Aller : accélération positive
        // Retour : accélération négative
        // Vérifier la continuité des vitesses, la cohérence des temps propres, etc.
    });
    test('Edge cases and validation', () => { ... });
});
```

#### 1.2 Implémentation TDD du rendez-vous et des trajectoires
- solveRendezvousProblem(...)
- calculateTrajectory(...) (gère aussi bien l’aller que le retour, selon le signe de l’accélération)
- Fonctions auxiliaires strictement nécessaires pour ces tests

#### 1.3 Validation avec les exemples du document
- Cas A, B, C (démo des jumeaux)
- Tests de régression

### Phase 2 : Intégration à la visualisation (2-3 jours)
- Remplacer `calculateAccelerationTrajectory` par la nouvelle fonction
- Adapter l'affichage des trajectoires
- Mettre à jour les isochrones si nécessaire

### Phase 3 : Interface et Affichage - TDD (1-2 jours)
- Adapter le panneau latéral pour afficher les nouvelles informations
- Ajouter les nouvelles métriques (rapidité, énergie, etc.)
- Maintenir la compatibilité avec l'interface existante

### Phase 4 : Démo des Jumeaux - Validation (1-2 jours)
- Gestion explicite de l’accélération négative pour le retour
- Vérifier la continuité des vitesses, la cohérence des temps propres, etc.
- Validation complète de la démo

### Phase 5 : Migration et Optimisation (1 jour)
- Migration progressive des appels depuis l’ancien module vers le nouveau
- Optimisation des performances
- Nettoyage final et documentation

---

## Points d'Attention Spécifiques

### 1. Rapidité non bornée
**Correction** : Supprimer les limites arbitraires sur φ. La rapidité n'est effectivement pas bornée physiquement. Utiliser seulement des limites numériques pour éviter l'overflow.

### 2. Accélération négative pour le demi-tour
**Solution** : Implémenter explicitement la gestion des phases d'accélération/décélération dans la démo des jumeaux.

### 3. Continuité des vitesses
**Prérequis** : La vitesse finale d'un segment doit être la vitesse initiale du segment suivant.

---

## Ordre d'Implémentation TDD

### Semaine 1
- **Jour 1** : Phase 0 (Nouveau module + tests de base)
- **Jour 2-3** : Phase 1 (Rendez-vous & Trajectoires, démo des jumeaux incluse)
- **Jour 4-5** : Phase 2 (Intégration à la visualisation)

### Semaine 2  
- **Jour 1-2** : Phase 3 (Interface)
- **Jour 3-4** : Phase 4 (Démo des jumeaux, validation)
- **Jour 5** : Phase 5 (Migration et optimisation)

---

## Critères de Succès TDD

1. ✅ **Tests passent** : 100% de couverture pour les nouveaux calculs
2. ✅ **Validation numérique** : Résultats exacts avec les exemples du document
3. ✅ **Pas de régression** : Toutes les fonctionnalités existantes fonctionnent
4. ✅ **Démo des jumeaux** : Fonctionne avec accélération négative
5. ✅ **Performance** : < 100ms pour les calculs de trajectoire
6. ✅ **Interface enrichie** : Affichage de rapidité, énergie, consommation

---

*Cette approche TDD garantit une refactorisation sûre et progressive, en validant chaque étape avant de passer à la suivante.* 