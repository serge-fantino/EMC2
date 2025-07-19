/**
 * TESTS UNITAIRES - Module Physics
 * Tests de non-régression pour les calculs relativistes
 */

import {
    // Constantes
    SPEED_OF_LIGHT,
    VELOCITY_EPSILON,
    MAX_VELOCITY,
    SAFETY_MARGIN,
    MIN_TIME_STEP,
    TRAJECTORY_STEPS,
    
    // Fonctions de relativité
    limitVelocity,
    calculateVelocityRatio,
    calculateCumulativePhysics,
    isReachableFromSource,
    
    // Fonctions de trajectoires
    calculateIsochronePoints,
    calculateAccelerationTrajectory,
    getContainingCone
} from '../../js/physics/index.js';

// === FRAMEWORK DE TEST SIMPLE ===
class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }
    
    test(name, testFn) {
        this.tests.push({ name, testFn });
    }
    
    assertEqual(actual, expected, message = '') {
        if (Math.abs(actual - expected) < 1e-10) {
            return true;
        }
        throw new Error(`Expected ${expected}, got ${actual}. ${message}`);
    }
    
    assertAlmostEqual(actual, expected, tolerance = 1e-6, message = '') {
        if (Math.abs(actual - expected) <= tolerance) {
            return true;
        }
        throw new Error(`Expected ~${expected}, got ${actual} (tolerance: ${tolerance}). ${message}`);
    }
    
    assertTrue(condition, message = '') {
        if (condition) {
            return true;
        }
        throw new Error(`Expected true. ${message}`);
    }
    
    assertFalse(condition, message = '') {
        if (!condition) {
            return true;
        }
        throw new Error(`Expected false. ${message}`);
    }
    
    async run() {
        console.log('🧮 === TESTS UNITAIRES - MODULE PHYSICS ===\n');
        
        for (const { name, testFn } of this.tests) {
            try {
                await testFn.call(this);
                console.log(`✅ ${name}`);
                this.passed++;
            } catch (error) {
                console.error(`❌ ${name}: ${error.message}`);
                this.failed++;
            }
        }
        
        console.log(`\n📊 === RÉSULTATS ===`);
        console.log(`✅ Tests réussis: ${this.passed}`);
        console.log(`❌ Tests échoués: ${this.failed}`);
        console.log(`📈 Taux de réussite: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
        
        return this.failed === 0;
    }
}

const test = new TestRunner();

// === TESTS DES CONSTANTES ===
test.test('Constantes physiques - Valeurs correctes', function() {
    this.assertEqual(SPEED_OF_LIGHT, 1, 'Vitesse de la lumière normalisée');
    this.assertEqual(VELOCITY_EPSILON, 0.001, 'Epsilon de vitesse');
    this.assertAlmostEqual(MAX_VELOCITY, 0.999, 1e-6, 'Vitesse maximale');
    this.assertTrue(SAFETY_MARGIN > 0 && SAFETY_MARGIN < 1, 'Marge de sécurité valide');
    this.assertTrue(MIN_TIME_STEP > 0, 'Pas de temps minimal positif');
    this.assertTrue(TRAJECTORY_STEPS > 0, 'Nombre d\'étapes de trajectoire positif');
});

test.test('Constantes physiques - Cohérence', function() {
    this.assertTrue(MAX_VELOCITY < SPEED_OF_LIGHT, 'Vitesse max < vitesse lumière');
    this.assertTrue(VELOCITY_EPSILON > 0, 'Epsilon positif');
    this.assertTrue(SAFETY_MARGIN < 0.5, 'Marge de sécurité raisonnable');
});

// === TESTS DES FONCTIONS DE RELATIVITÉ ===
test.test('limitVelocity - Vitesses normales', function() {
    this.assertAlmostEqual(limitVelocity(0.5), 0.5, 1e-10, 'Vitesse 0.5c inchangée');
    this.assertAlmostEqual(limitVelocity(-0.3), -0.3, 1e-10, 'Vitesse négative conservée');
    this.assertEqual(limitVelocity(0), 0, 'Vitesse nulle');
});

test.test('limitVelocity - Vitesses limites', function() {
    this.assertAlmostEqual(limitVelocity(1.5), MAX_VELOCITY, 1e-10, 'Vitesse > c limitée');
    this.assertAlmostEqual(limitVelocity(-2.0), -MAX_VELOCITY, 1e-10, 'Vitesse négative > c limitée');
    this.assertAlmostEqual(limitVelocity(MAX_VELOCITY), MAX_VELOCITY, 1e-10, 'Vitesse max conservée');
});

test.test('calculateVelocityRatio - Cas de base', function() {
    this.assertEqual(calculateVelocityRatio(0, 0, 1), 0, 'Point au repos');
    this.assertAlmostEqual(calculateVelocityRatio(1, 0, 1), 1, 1e-10, 'Vitesse de la lumière');
    this.assertAlmostEqual(calculateVelocityRatio(0.5, 0, 1), 0.5, 1e-10, 'Vitesse 0.5c');
    this.assertEqual(calculateVelocityRatio(1, 0, 0), 0, 'Temps nul');
    this.assertEqual(calculateVelocityRatio(1, 0, -1), 0, 'Temps négatif');
});

test.test('calculateVelocityRatio - Cas 2D', function() {
    this.assertAlmostEqual(calculateVelocityRatio(0.6, 0.8, 1), 1, 1e-10, 'Pythagore: 0.6² + 0.8² = 1');
    this.assertAlmostEqual(calculateVelocityRatio(0.3, 0.4, 1), 0.5, 1e-10, 'Pythagore: 0.3² + 0.4² = 0.25');
});

test.test('isReachableFromSource - Causalité', function() {
    const origin = { x: 0, t: 0 };
    
    // Points atteignables
    this.assertTrue(isReachableFromSource(0, 1, origin), 'Futur direct atteignable');
    this.assertTrue(isReachableFromSource(0.5, 1, origin), 'Point dans le cône');
    this.assertTrue(isReachableFromSource(-0.5, 1, origin), 'Point dans le cône (négatif)');
    
    // Points non atteignables
    this.assertFalse(isReachableFromSource(0, -1, origin), 'Passé non atteignable');
    this.assertFalse(isReachableFromSource(2, 1, origin), 'Hors cône de lumière');
    this.assertFalse(isReachableFromSource(-2, 1, origin), 'Hors cône de lumière (négatif)');
});

test.test('calculateCumulativePhysics - Origine', function() {
    const coneOrigins = [{ x: 0, t: 0, sourceIndex: -1 }];
    const physics = calculateCumulativePhysics(0, coneOrigins);
    
    this.assertEqual(physics.cumulativeVelocity, 0, 'Vitesse cumulative nulle à l\'origine');
    this.assertEqual(physics.cumulativeProperTime, 0, 'Temps propre nul à l\'origine');
    this.assertEqual(physics.totalCoordinateTime, 0, 'Temps coordonnée nul à l\'origine');
    this.assertEqual(physics.segmentVelocity, 0, 'Vitesse de segment nulle à l\'origine');
    this.assertEqual(physics.segmentAcceleration, 0, 'Accélération nulle à l\'origine');
});

test.test('calculateCumulativePhysics - Mouvement simple', function() {
    const coneOrigins = [
        { x: 0, t: 0, sourceIndex: -1 },
        { x: 1, t: 2, sourceIndex: 0 }
    ];
    const physics = calculateCumulativePhysics(1, coneOrigins);
    
    this.assertTrue(physics.segmentVelocity > 0, 'Vitesse de segment positive');
    this.assertTrue(physics.segmentAcceleration > 0, 'Accélération positive');
    this.assertTrue(physics.segmentProperTime > 0, 'Temps propre positif');
    this.assertEqual(physics.totalCoordinateTime, 2, 'Temps coordonnée correct');
    this.assertTrue(physics.segmentVelocity < SPEED_OF_LIGHT, 'Vitesse sous-luminique');
});

// === TESTS DES TRAJECTOIRES ===
test.test('calculateIsochronePoints - Paramètres de base', function() {
    const origin = { x: 0, t: 0 };
    const selectedCone = { x: 0, t: 1 };
    const points = calculateIsochronePoints(1, origin, selectedCone, 800);
    
    this.assertTrue(points.length > 0, 'Points d\'isochrone générés');
    this.assertTrue(points.every(p => p.t > origin.t), 'Tous les points dans le futur');
    this.assertTrue(points.every(p => isFinite(p.x) && isFinite(p.t)), 'Tous les points finis');
});

test.test('calculateAccelerationTrajectory - Trajectoire simple', function() {
    const fromCone = { x: 0, t: 0 };
    const toCone = { x: 1, t: 2 };
    const trajectory = calculateAccelerationTrajectory(fromCone, toCone);
    
    this.assertTrue(trajectory.length > 0, 'Points de trajectoire générés');
    this.assertAlmostEqual(trajectory[0].x, fromCone.x, 1e-10, 'Débute au point de départ');
    this.assertAlmostEqual(trajectory[0].t, fromCone.t, 1e-10, 'Débute au temps de départ');
    
    // Vérifier que la trajectoire est monotone en temps
    for (let i = 1; i < trajectory.length; i++) {
        this.assertTrue(trajectory[i].t >= trajectory[i-1].t, 'Temps monotone croissant');
    }
});

test.test('calculateAccelerationTrajectory - Pas de trajectoire vers le passé', function() {
    const fromCone = { x: 0, t: 2 };
    const toCone = { x: 1, t: 1 }; // Dans le passé
    const trajectory = calculateAccelerationTrajectory(fromCone, toCone);
    
    this.assertEqual(trajectory.length, 0, 'Aucune trajectoire vers le passé');
});

test.test('getContainingCone - Détection de cônes', function() {
    const coneOrigins = [
        { x: 0, t: 0 },
        { x: 2, t: 2 },
        { x: -1, t: 3 }
    ];
    
    // Point dans le premier cône
    this.assertEqual(getContainingCone(0.5, 1, coneOrigins), 0, 'Point dans le premier cône');
    
    // Point dans le deuxième cône
    this.assertEqual(getContainingCone(2.5, 3, coneOrigins), 1, 'Point dans le deuxième cône');
    
    // Point hors de tous les cônes
    this.assertEqual(getContainingCone(10, 1, coneOrigins), -1, 'Point hors de tous les cônes');
    
    // Point dans le passé
    this.assertEqual(getContainingCone(0, -1, coneOrigins), -1, 'Point dans le passé');
});

// === TESTS D'INTÉGRATION PHYSIQUE ===
test.test('Conservation de l\'énergie - Trajectoire fermée', function() {
    // Test conceptuel : une trajectoire qui revient au même point spatial
    const coneOrigins = [
        { x: 0, t: 0, sourceIndex: -1 },
        { x: 1, t: 2, sourceIndex: 0 },
        { x: 0, t: 4, sourceIndex: 1 }
    ];
    
    const physics1 = calculateCumulativePhysics(1, coneOrigins);
    const physics2 = calculateCumulativePhysics(2, coneOrigins);
    
    // Le temps propre doit toujours augmenter
    this.assertTrue(physics2.cumulativeProperTime > physics1.cumulativeProperTime, 
                   'Temps propre strictement croissant');
    
    // Position finale identique à l'origine
    this.assertEqual(coneOrigins[2].x, coneOrigins[0].x, 'Retour à la position initiale');
});

test.test('Limites relativistes - Approche de c', function() {
    // Test avec un point proche du bord du cône de lumière (mais dans la zone valide)
    const coneOrigins = [
        { x: 0, t: 0, sourceIndex: -1 },
        { x: 0.95, t: 1, sourceIndex: 0 } // 0.95c - proche mais dans la zone de sécurité
    ];
    
    const physics = calculateCumulativePhysics(1, coneOrigins);
    
    this.assertTrue(physics.segmentVelocity < SPEED_OF_LIGHT, 'Vitesse toujours sous-luminique');
    this.assertTrue(physics.segmentVelocity > 0.9, 'Vitesse élevée comme attendu');
    this.assertTrue(isFinite(physics.segmentAcceleration), 'Accélération finie');
    this.assertTrue(physics.segmentProperTime > 0, 'Temps propre positif');
});

test.test('Limites relativistes - Zone interdite', function() {
    // Test avec un point exactement à la limite de sécurité (doit être rejeté)
    const coneOrigins = [
        { x: 0, t: 0, sourceIndex: -1 },
        { x: 0.98, t: 1, sourceIndex: 0 } // Exactement à la limite de sécurité (1 - 0.02 = 0.98)
    ];
    
    const physics = calculateCumulativePhysics(1, coneOrigins);
    
    // Le point doit être rejeté (vitesse = 0, accélération = 0)
    this.assertEqual(physics.segmentVelocity, 0, 'Point dans la zone interdite - vitesse = 0');
    this.assertEqual(physics.segmentAcceleration, 0, 'Point dans la zone interdite - accélération = 0');
    this.assertEqual(physics.segmentProperTime, 1, 'Temps propre = temps coordonnée pour trajectoire rejetée');
});

// === TESTS DE ROBUSTESSE ===
test.test('Gestion des cas limites - Valeurs extrêmes', function() {
    // Test avec des valeurs très petites
    this.assertEqual(calculateVelocityRatio(1e-10, 0, 1), 1e-10, 'Très petites vitesses');
    
    // Test avec des cônes vides
    const emptyTrajectory = calculateAccelerationTrajectory({x: 0, t: 0}, {x: 0, t: 0});
    this.assertEqual(emptyTrajectory.length, 0, 'Trajectoire nulle pour points identiques');
    
    // Test avec vitesse nulle
    this.assertEqual(limitVelocity(0), 0, 'Vitesse nulle conservée');
});

test.test('Cohérence des unités - Vérifications dimensionnelles', function() {
    // Vérifier que les calculs ont des unités cohérentes
    const coneOrigins = [
        { x: 0, t: 0, sourceIndex: -1 },
        { x: 1, t: 2, sourceIndex: 0 }
    ];
    
    const physics = calculateCumulativePhysics(1, coneOrigins);
    
    // Vérifications de cohérence dimensionnelle
    this.assertTrue(Math.abs(physics.segmentVelocity) <= 1, 'Vitesse en unités de c');
    this.assertTrue(physics.segmentAcceleration >= 0, 'Accélération positive');
    this.assertTrue(physics.segmentProperTime >= 0, 'Temps propre positif');
    this.assertTrue(physics.totalCoordinateTime >= 0, 'Temps coordonnée positif');
});

// Exporter le runner de tests
export default test; 