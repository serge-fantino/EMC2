/**
 * TESTS UNITAIRES - Module Physics Relativistic (TDD)
 * Tests pour les fonctions hyperboliques et conversions rapidité
 */

import {
    // Constantes
    SPEED_OF_LIGHT,
    MASS_UNIT,
    NUMERICAL_PRECISION,
    TAU_SAMPLES,
    
    // Fonctions hyperboliques
    artanh,
    arsinh,
    arcosh,
    
    // Conversions rapidité
    velocityToRapidity,
    rapidityToVelocity
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
        console.log('🧮 === TESTS UNITAIRES - MODULE PHYSICS RELATIVISTIC ===\n');
        
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
test.test('Constantes fondamentales - Valeurs correctes', function() {
    this.assertEqual(SPEED_OF_LIGHT, 1, 'Vitesse de la lumière normalisée');
    this.assertEqual(MASS_UNIT, 1, 'Masse unitaire normalisée');
    this.assertTrue(NUMERICAL_PRECISION > 0, 'Précision numérique positive');
    this.assertTrue(TAU_SAMPLES > 0, 'Nombre d\'échantillons positif');
});

// === TESTS DES FONCTIONS HYPERBOLIQUES ===
test.test('artanh - Valeurs de base', function() {
    this.assertAlmostEqual(artanh(0), 0, 1e-10, 'artanh(0) = 0');
    this.assertAlmostEqual(artanh(0.5), 0.5493061443340548, 1e-10, 'artanh(0.5)');
    this.assertAlmostEqual(artanh(-0.5), -0.5493061443340548, 1e-10, 'artanh(-0.5)');
});

test.test('artanh - Cas limites', function() {
    // Test des erreurs pour |x| >= 1
    try {
        artanh(1);
        this.assertTrue(false, 'artanh(1) devrait lever une erreur');
    } catch (e) {
        this.assertTrue(e instanceof RangeError, 'artanh(1) doit lever RangeError');
    }
    
    try {
        artanh(-1);
        this.assertTrue(false, 'artanh(-1) devrait lever une erreur');
    } catch (e) {
        this.assertTrue(e instanceof RangeError, 'artanh(-1) doit lever RangeError');
    }
});

test.test('arsinh - Valeurs de base', function() {
    this.assertAlmostEqual(arsinh(0), 0, 1e-10, 'arsinh(0) = 0');
    this.assertAlmostEqual(arsinh(1), 0.881373587019543, 1e-10, 'arsinh(1)');
    this.assertAlmostEqual(arsinh(-1), -0.881373587019543, 1e-10, 'arsinh(-1)');
});

test.test('arcosh - Valeurs de base', function() {
    this.assertAlmostEqual(arcosh(1), 0, 1e-10, 'arcosh(1) = 0');
    this.assertAlmostEqual(arcosh(2), 1.3169578969248166, 1e-10, 'arcosh(2)');
});

test.test('arcosh - Cas limites', function() {
    // Test des erreurs pour x < 1
    try {
        arcosh(0.5);
        this.assertTrue(false, 'arcosh(0.5) devrait lever une erreur');
    } catch (e) {
        this.assertTrue(e instanceof RangeError, 'arcosh(0.5) doit lever RangeError');
    }
});

// === TESTS DES CONVERSIONS RAPIDITÉ ===
test.test('velocityToRapidity - Valeurs de base', function() {
    this.assertAlmostEqual(velocityToRapidity(0), 0, 1e-10, 'v=0 → φ=0');
    this.assertAlmostEqual(velocityToRapidity(0.5), 0.5493061443340548, 1e-10, 'v=0.5c');
    this.assertAlmostEqual(velocityToRapidity(-0.5), -0.5493061443340548, 1e-10, 'v=-0.5c');
});

test.test('velocityToRapidity - Cas limites', function() {
    // Test des erreurs pour |v| >= 1
    try {
        velocityToRapidity(1);
        this.assertTrue(false, 'velocityToRapidity(1) devrait lever une erreur');
    } catch (e) {
        this.assertTrue(e instanceof RangeError, 'velocityToRapidity(1) doit lever RangeError');
    }
});

test.test('rapidityToVelocity - Valeurs de base', function() {
    this.assertAlmostEqual(rapidityToVelocity(0), 0, 1e-10, 'φ=0 → v=0');
    this.assertAlmostEqual(rapidityToVelocity(0.5493061443340548), 0.5, 1e-10, 'φ=0.549... → v=0.5c');
    this.assertAlmostEqual(rapidityToVelocity(-0.5493061443340548), -0.5, 1e-10, 'φ=-0.549... → v=-0.5c');
});

test.test('Conversions réciproques - Cohérence', function() {
    const testVelocities = [0, 0.1, 0.5, 0.9, -0.1, -0.5, -0.9];
    
    for (const v of testVelocities) {
        const phi = velocityToRapidity(v);
        const vBack = rapidityToVelocity(phi);
        this.assertAlmostEqual(vBack, v, 1e-10, `Conversion réciproque pour v=${v}`);
    }
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