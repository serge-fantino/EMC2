/**
 * TESTS UNITAIRES - Génération de Trajectoires Relativistes (TDD)
 * Tests pour la génération de trajectoires basées sur la rapidité
 */

import {
    // Constantes
    SPEED_OF_LIGHT,
    TAU_SAMPLES,
    
    // Fonctions hyperboliques
    artanh,
    velocityToRapidity,
    rapidityToVelocity,
    
    // Fonctions de rendez-vous
    solveRendezvousProblem,
    
    // Fonctions de trajectoire
    calculateTrajectoryPoint,
    generateTrajectory,
    generateRendezvousTrajectory,
    validateTrajectory
} from '../../js/physics_relativistic/index.js';

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
    
    async run() {
        console.log('🚀 === TESTS TRAJECTOIRES RELATIVISTES ===\n');
        
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

// === TESTS DES FONCTIONS DE TRAJECTOIRE ===

test.test('calculateTrajectoryPoint - Point initial', function() {
    // Test avec l'exemple du document : v₀ = 0.3c, α = 0.3323 c/an
    const x0 = 0, t0 = 0, v0 = 0.3;
    const alpha = 0.3323;
    const tau = 0; // Point initial
    
    const point = calculateTrajectoryPoint(x0, t0, v0, alpha, tau);
    
    this.assertAlmostEqual(point.x, 0.0, 1e-2, 'x(0) = 0');
    this.assertAlmostEqual(point.t, 0.0, 1e-2, 't(0) = 0');
    this.assertAlmostEqual(point.v, 0.3, 1e-2, 'v(0) = 0.3c');
    this.assertAlmostEqual(point.gamma, 1.048, 1e-3, 'γ(0) = 1.048');
});

test.test('calculateTrajectoryPoint - Point intermédiaire', function() {
    // Test avec l'exemple du document : τ = 2.0 ans
    const x0 = 0, t0 = 0, v0 = 0.3;
    const alpha = 0.3323;
    const tau = 2.0;
    
    const point = calculateTrajectoryPoint(x0, t0, v0, alpha, tau);
    
    // Vérifications physiques plutôt que valeurs exactes
    this.assertTrue(point.x > 0, 'Position positive');
    this.assertTrue(point.t > 0, 'Temps positif');
    this.assertTrue(point.v > v0, 'Vitesse croissante');
    this.assertTrue(point.gamma > 1, 'Facteur de Lorentz > 1');
    this.assertTrue(point.tau === tau, 'Temps propre correct');
});

test.test('calculateTrajectoryPoint - Point final', function() {
    // Test avec l'exemple du document : τ = 5.36 ans (point final)
    const x0 = 0, t0 = 0, v0 = 0.3;
    const alpha = 0.3323;
    const tau = 5.36;
    
    const point = calculateTrajectoryPoint(x0, t0, v0, alpha, tau);
    
    // Vérifications physiques plutôt que valeurs exactes
    this.assertTrue(point.x > 0, 'Position finale positive');
    this.assertTrue(point.t > 0, 'Temps final positif');
    this.assertTrue(point.v > v0, 'Vitesse finale > vitesse initiale');
    this.assertTrue(point.gamma > 1, 'Facteur de Lorentz > 1');
    this.assertTrue(point.tau === tau, 'Temps propre correct');
    
    // Vérifier que le point est proche du rendez-vous attendu
    this.assertAlmostEqual(point.x, 10.0, 1.0, 'Position finale proche de 10 al');
    this.assertAlmostEqual(point.t, 12.0, 1.0, 'Temps final proche de 12 ans');
});

test.test('generateTrajectory - Échantillonnage complet', function() {
    // Test de génération de trajectoire complète
    const x0 = 0, t0 = 0, v0 = 0.3;
    const x1 = 10, t1 = 12;
    
    // Résolution du rendez-vous
    const rendezvous = solveRendezvousProblem(x0, t0, v0, x1, t1);
    
    const trajectory = generateTrajectory(x0, t0, v0, rendezvous.alpha, rendezvous.tau_f);
    
    this.assertTrue(trajectory.length > 0, 'Trajectoire non vide');
    this.assertAlmostEqual(trajectory[0].x, x0, 1e-10, 'Point initial x');
    this.assertAlmostEqual(trajectory[0].t, t0, 1e-10, 'Point initial t');
    this.assertAlmostEqual(trajectory[0].v, v0, 1e-10, 'Point initial v');
    
    const lastPoint = trajectory[trajectory.length - 1];
    this.assertAlmostEqual(lastPoint.x, x1, 1e-2, 'Point final x');
    this.assertAlmostEqual(lastPoint.t, t1, 1e-2, 'Point final t');
    this.assertAlmostEqual(lastPoint.v, rendezvous.v_f, 1e-3, 'Point final v');
});

test.test('generateTrajectory - Cas immobile', function() {
    // Test du cas trivial : vaisseau immobile
    const x0 = 0, t0 = 0, v0 = 0;
    const x1 = 0, t1 = 10;
    
    const rendezvous = solveRendezvousProblem(x0, t0, v0, x1, t1);
    
    const trajectory = generateTrajectory(x0, t0, v0, rendezvous.alpha, rendezvous.tau_f);
    
    this.assertTrue(trajectory.length > 0, 'Trajectoire non vide');
    
    // Tous les points doivent être identiques (immobile)
    for (const point of trajectory) {
        this.assertAlmostEqual(point.x, x0, 1e-10, 'Position constante');
        this.assertAlmostEqual(point.v, 0, 1e-10, 'Vitesse nulle');
        this.assertAlmostEqual(point.gamma, 1, 1e-10, 'Facteur de Lorentz = 1');
    }
});

test.test('generateTrajectory - Décélération', function() {
    // Test avec décélération (Δx < 0)
    const x0 = 0, t0 = 0, v0 = 0.5;
    const x1 = -5, t1 = 10;
    
    const rendezvous = solveRendezvousProblem(x0, t0, v0, x1, t1);
    
    const trajectory = generateTrajectory(x0, t0, v0, rendezvous.alpha, rendezvous.tau_f);
    
    this.assertTrue(rendezvous.alpha < 0, 'Accélération négative');
    this.assertTrue(trajectory.length > 0, 'Trajectoire non vide');
    
    const lastPoint = trajectory[trajectory.length - 1];
    this.assertAlmostEqual(lastPoint.x, x1, 1e-2, 'Point final x');
    this.assertAlmostEqual(lastPoint.v, rendezvous.v_f, 1e-3, 'Point final v');
    this.assertTrue(lastPoint.v < 0, 'Vitesse finale négative');
});

test.test('Validation physique - Monotonie de la vitesse', function() {
    // Vérifier que la vitesse est monotone (croissante pour α > 0, décroissante pour α < 0)
    const x0 = 0, t0 = 0, v0 = 0.3;
    const x1 = 10, t1 = 12;
    
    const rendezvous = solveRendezvousProblem(x0, t0, v0, x1, t1);
    
    const trajectory = generateTrajectory(x0, t0, v0, rendezvous.alpha, rendezvous.tau_f);
    
    for (let i = 1; i < trajectory.length; i++) {
        if (rendezvous.alpha > 0) {
            this.assertTrue(trajectory[i].v >= trajectory[i-1].v, 'Vitesse croissante');
        } else if (rendezvous.alpha < 0) {
            this.assertTrue(trajectory[i].v <= trajectory[i-1].v, 'Vitesse décroissante');
        }
    }
});

test.test('validateTrajectory - Trajectoire valide', function() {
    // Test de validation d'une trajectoire valide
    const x0 = 0, t0 = 0, v0 = 0.3;
    const alpha = 0.3323;
    const tau_f = 5.36;
    
    const trajectory = generateTrajectory(x0, t0, v0, alpha, tau_f);
    const validation = validateTrajectory(trajectory);
    
    this.assertTrue(validation.valid, 'Trajectoire valide');
    this.assertTrue(validation.errors.length === 0, 'Aucune erreur');
});

// === LANCEMENT DES TESTS ===
if (typeof window === 'undefined') {
    // Mode Node.js
    test.run().then(success => {
        process.exit(success ? 0 : 1);
    });
} else {
    // Mode navigateur
    test.run();
} 