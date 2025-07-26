/**
 * TESTS UNITAIRES - Résolution du Rendez-vous Relativiste (TDD)
 * Tests pour la solution du problème de rendez-vous basée sur la rapidité
 */

import {
    // Constantes
    SPEED_OF_LIGHT,
    
    // Fonctions hyperboliques
    artanh,
    velocityToRapidity,
    rapidityToVelocity,
    
    // Fonctions de rendez-vous
    calculateRendezvousRapidity,
    calculateRequiredAcceleration,
    calculateFinalProperTime,
    solveRendezvousProblem,
    validateRendezvous
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
    
    assertFalse(condition, message = '') {
        if (!condition) {
            return true;
        }
        throw new Error(`Expected false. ${message}`);
    }
    
    async run() {
        console.log('🚀 === TESTS RENDEZ-VOUS RELATIVISTE ===\n');
        
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

// === TESTS DES FONCTIONS AUXILIAIRES ===

test.test('calculateRendezvousRapidity - Cas A (v₀ = 0)', function() {
    // Test avec l'exemple du document : v₀ = 0, Δx = 10 al, Δt = 12 ans
    const v0 = 0;
    const deltaX = 10; // années-lumière
    const deltaT = 12; // ans
    
    const deltaPhi = calculateRendezvousRapidity(v0, deltaX, deltaT);
    this.assertAlmostEqual(deltaPhi, 2.3978, 1e-4, 'Δφ = 2.3978');
});

test.test('calculateRendezvousRapidity - Cas B (v₀ = 0.3c)', function() {
    // Test avec l'exemple du document : v₀ = 0.3c, Δx = 10 al, Δt = 12 ans
    const v0 = 0.3;
    const deltaX = 10; // années-lumière
    const deltaT = 12; // ans
    
    const deltaPhi = calculateRendezvousRapidity(v0, deltaX, deltaT);
    this.assertAlmostEqual(deltaPhi, 1.7788, 1e-4, 'Δφ = 1.7788');
});

test.test('calculateRequiredAcceleration - Cas A (v₀ = 0)', function() {
    // Test avec l'exemple du document
    const v0 = 0;
    const deltaX = 10; // années-lumière
    const deltaT = 12; // ans
    
    const phi0 = velocityToRapidity(v0);
    const deltaPhi = calculateRendezvousRapidity(v0, deltaX, deltaT);
    const alpha = calculateRequiredAcceleration(phi0, deltaPhi, deltaT);
    
    this.assertAlmostEqual(alpha, 0.4545, 1e-4, 'α = 0.4545 c/an');
});

test.test('calculateRequiredAcceleration - Cas B (v₀ = 0.3c)', function() {
    // Test avec l'exemple du document
    const v0 = 0.3;
    const deltaX = 10; // années-lumière
    const deltaT = 12; // ans
    
    const phi0 = velocityToRapidity(v0);
    const deltaPhi = calculateRendezvousRapidity(v0, deltaX, deltaT);
    const alpha = calculateRequiredAcceleration(phi0, deltaPhi, deltaT);
    
    this.assertAlmostEqual(alpha, 0.3050, 1e-4, 'α = 0.3050 c/an');
});

test.test('calculateFinalProperTime - Cas A (v₀ = 0)', function() {
    // Test avec l'exemple du document
    const v0 = 0;
    const deltaX = 10; // années-lumière
    const deltaT = 12; // ans
    
    const deltaPhi = calculateRendezvousRapidity(v0, deltaX, deltaT);
    const phi0 = velocityToRapidity(v0);
    const alpha = calculateRequiredAcceleration(phi0, deltaPhi, deltaT);
    const tau_f = calculateFinalProperTime(deltaPhi, alpha);
    
    this.assertAlmostEqual(tau_f, 5.28, 1e-2, 'τ_f = 5.28 ans');
});

test.test('calculateFinalProperTime - Cas B (v₀ = 0.3c)', function() {
    // Test avec l'exemple du document
    const v0 = 0.3;
    const deltaX = 10; // années-lumière
    const deltaT = 12; // ans
    
    const deltaPhi = calculateRendezvousRapidity(v0, deltaX, deltaT);
    const phi0 = velocityToRapidity(v0);
    const alpha = calculateRequiredAcceleration(phi0, deltaPhi, deltaT);
    const tau_f = calculateFinalProperTime(deltaPhi, alpha);
    
    this.assertAlmostEqual(tau_f, 5.83, 1e-2, 'τ_f = 5.83 ans');
});

test.test('solveRendezvousProblem - Cas A (v₀ = 0)', function() {
    // Test complet avec l'exemple du document
    const x0 = 0, t0 = 0, v0 = 0;
    const x1 = 10, t1 = 12; // rendez-vous en (10 al, 12 ans)
    
    const result = solveRendezvousProblem(x0, t0, v0, x1, t1);
    
    this.assertAlmostEqual(result.alpha, 0.4545, 1e-4, 'Accélération');
    this.assertAlmostEqual(result.tau_f, 5.28, 1e-2, 'Temps propre');
    this.assertAlmostEqual(result.v_f, 0.983, 1e-3, 'Vitesse finale');
    this.assertAlmostEqual(result.energyConsumed, 2.3978, 1e-4, 'Énergie consommée');
    this.assertTrue(result.is_valid, 'Solution valide');
});

test.test('solveRendezvousProblem - Cas B (v₀ = 0.3c)', function() {
    // Test complet avec l'exemple du document
    const x0 = 0, t0 = 0, v0 = 0.3;
    const x1 = 10, t1 = 12; // rendez-vous en (10 al, 12 ans)
    
    const result = solveRendezvousProblem(x0, t0, v0, x1, t1);
    
    this.assertAlmostEqual(result.alpha, 0.3050, 1e-4, 'Accélération');
    this.assertAlmostEqual(result.tau_f, 5.83, 1e-2, 'Temps propre');
    this.assertAlmostEqual(result.v_f, 0.970, 1e-3, 'Vitesse finale');
    this.assertAlmostEqual(result.energyConsumed, 1.7788, 1e-4, 'Énergie consommée');
    this.assertTrue(result.is_valid, 'Solution valide');
});

test.test('Validation physique - Dilatation temporelle', function() {
    // Vérifier que τ_f < Δt (dilatation temporelle)
    const v0 = 0.3;
    const deltaX = 10;
    const deltaT = 12;
    
    const result = solveRendezvousProblem(0, 0, v0, deltaX, deltaT);
    
    this.assertTrue(result.tau_f < deltaT, 'τ_f < Δt (dilatation temporelle)');
    this.assertAlmostEqual(result.tau_f / deltaT, 0.486, 1e-3, 'Ratio τ_f/Δt ≈ 0.486');
});

test.test('validateRendezvous - Cas valides', function() {
    // Rendez-vous possible
    this.assertTrue(validateRendezvous(10, 12), 'Rendez-vous possible');
    this.assertTrue(validateRendezvous(5, 10), 'Rendez-vous possible');
    
    // Rendez-vous impossible (violation de la causalité)
    this.assertFalse(validateRendezvous(15, 10), 'Rendez-vous impossible');
    this.assertFalse(validateRendezvous(10, 5), 'Rendez-vous impossible');
    
    // Temps négatif
    this.assertFalse(validateRendezvous(10, -5), 'Temps négatif');
});

test.test('Gestion des erreurs - Cas limites', function() {
    // Vitesse initiale >= c
    try {
        solveRendezvousProblem(0, 0, 1.0, 10, 12);
        this.assertTrue(false, 'Devrait lever une erreur pour v₀ >= c');
    } catch (e) {
        this.assertTrue(e.message.includes('Vitesse initiale'), 'Erreur correcte');
    }
    
    // Temps de rendez-vous dans le passé (cas où causalité n'est pas violée)
    try {
        solveRendezvousProblem(0, 10, 0.3, 5, 5);
        this.assertTrue(false, 'Devrait lever une erreur pour t₁ < t₀');
    } catch (e) {
        this.assertTrue(e.message.includes('futur'), 'Erreur correcte');
    }
    
    // Rendez-vous impossible
    try {
        solveRendezvousProblem(0, 0, 0.3, 15, 10);
        this.assertTrue(false, 'Devrait lever une erreur pour rendez-vous impossible');
    } catch (e) {
        this.assertTrue(e.message.includes('Rendez-vous impossible'), 'Erreur correcte');
    }
});

test.test('Cas trivial - Vaisseau immobile', function() {
    const x0 = 0, t0 = 0, v0 = 0;
    const x1 = 0, t1 = 10;
    const result = solveRendezvousProblem(x0, t0, v0, x1, t1);
    this.assertAlmostEqual(result.alpha, 0, 1e-10, 'α = 0');
    this.assertAlmostEqual(result.tau_f, 10, 1e-10, 'τ_f = Δt');
    this.assertAlmostEqual(result.phi_f, 0, 1e-10, 'φ_f = 0');
    this.assertAlmostEqual(result.v_f, 0, 1e-10, 'v_f = 0');
    this.assertAlmostEqual(result.deltaPhi, 0, 1e-10, 'Δφ = 0');
    this.assertAlmostEqual(result.energyConsumed, 0, 1e-10, 'Énergie = 0');
    this.assertTrue(result.is_valid, 'Solution valide');
});

test.test('Cas de décélération - Δx < 0', function() {
    // Test avec v₀ = 0.5c, Δx = -5 al, Δt = 10 ans
    const x0 = 0, t0 = 0, v0 = 0.5;
    const x1 = -5, t1 = 10; // Rendez-vous en arrière
    
    const result = solveRendezvousProblem(x0, t0, v0, x1, t1);
    
    // Vérifications physiques
    this.assertTrue(result.alpha < 0, 'Accélération négative pour décélération');
    this.assertTrue(result.deltaPhi < 0, 'Δφ négatif pour décélération');
    this.assertTrue(result.energyConsumed > 0, 'Énergie consommée toujours positive');
    this.assertTrue(result.tau_f > 0, 'Temps propre positif');
    this.assertTrue(result.is_valid, 'Solution valide');
    
    // Vérification que la vitesse finale est dans la bonne direction
    this.assertTrue(result.v_f < 0, 'Vitesse finale négative (direction arrière)');
});

test.test('Cas de décélération - v₀ > 0, Δx < 0', function() {
    // Test avec v₀ = 0.3c, Δx = -10 al, Δt = 12 ans
    const x0 = 0, t0 = 0, v0 = 0.3;
    const x1 = -10, t1 = 12;
    
    const result = solveRendezvousProblem(x0, t0, v0, x1, t1);
    
    // Calculs manuels pour validation
    const beta = -10 / (1 * 12); // β = -0.8333
    const phi0 = velocityToRapidity(0.3); // φ₀ ≈ 0.3095
    const deltaPhiExpected = 2 * (artanh(beta) - phi0); // Δφ ≈ -2.3978
    
    this.assertAlmostEqual(result.deltaPhi, deltaPhiExpected, 1e-4, 'Δφ correct pour décélération');
    this.assertTrue(result.alpha < 0, 'Accélération négative');
    this.assertTrue(result.v_f < 0, 'Vitesse finale négative');
});

test.test('Validation physique - Décélération', function() {
    // Vérifier que la décélération respecte la physique
    const v0 = 0.5;
    const deltaX = -5;
    const deltaT = 10;
    
    const result = solveRendezvousProblem(0, 0, v0, deltaX, deltaT);
    
    // Le temps propre doit être inférieur au temps coordonné (dilatation temporelle)
    this.assertTrue(result.tau_f < deltaT, 'Dilatation temporelle même en décélération');
    
    // L'énergie consommée doit être positive
    this.assertTrue(result.energyConsumed > 0, 'Énergie consommée positive');
    
    // La vitesse finale doit être dans la direction du mouvement
    this.assertTrue(result.v_f < 0, 'Vitesse finale dans la bonne direction');
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