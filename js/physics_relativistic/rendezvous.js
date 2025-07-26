/**
 * RÉSOLUTION DU RENDEZ-VOUS RELATIVISTE (TDD)
 * Implémentation basée sur la rapidité selon le document de référence
 */

import { SPEED_OF_LIGHT } from './constants.js';
import { artanh, velocityToRapidity, rapidityToVelocity } from './rapidity.js';

/**
 * Calcule l'accroissement de rapidité nécessaire pour le rendez-vous
 * @param {number} v0 - Vitesse initiale (v/c)
 * @param {number} deltaX - Distance à parcourir (années-lumière)
 * @param {number} deltaT - Temps disponible (ans)
 * @returns {number} Accroissement de rapidité Δφ
 */
export function calculateRendezvousRapidity(v0, deltaX, deltaT) {
    // β = Δx/(cΔt)
    const beta = deltaX / (SPEED_OF_LIGHT * deltaT);
    
    // Vérification de la causalité
    if (Math.abs(beta) >= 1) {
        throw new Error('Rendez-vous impossible : |β| >= 1 (violation de la causalité)');
    }
    
    // φ₀ = artanh(v₀/c)
    const phi0 = velocityToRapidity(v0);
    
    // Δφ = 2[artanh(β) - φ₀]
    const deltaPhi = 2 * (artanh(beta) - phi0);
    
    return deltaPhi;
}

/**
 * Calcule l'accélération propre requise pour le rendez-vous
 * @param {number} phi0 - Rapidité initiale
 * @param {number} deltaPhi - Accroissement de rapidité
 * @param {number} deltaT - Temps disponible (ans)
 * @returns {number} Accélération propre α (c/an)
 */
export function calculateRequiredAcceleration(phi0, deltaPhi, deltaT) {
    const phi_f = phi0 + deltaPhi;
    
    // α = c[sinh(φ₀ + Δφ) - sinh(φ₀)]/Δt
    const alpha = SPEED_OF_LIGHT * (Math.sinh(phi_f) - Math.sinh(phi0)) / deltaT;
    
    return alpha;
}

/**
 * Calcule le temps propre final pour l'équipage
 * @param {number} deltaPhi - Accroissement de rapidité
 * @param {number} alpha - Accélération propre
 * @returns {number} Temps propre final τ_f (ans)
 */
export function calculateFinalProperTime(deltaPhi, alpha) {
    // τ_f = cΔφ/α
    const tau_f = SPEED_OF_LIGHT * deltaPhi / alpha;
    
    return tau_f;
}

/**
 * Résout le problème de rendez-vous relativiste complet
 * @param {number} x0 - Position initiale (années-lumière)
 * @param {number} t0 - Temps initial (ans)
 * @param {number} v0 - Vitesse initiale (v/c)
 * @param {number} x1 - Position de rendez-vous (années-lumière)
 * @param {number} t1 - Temps de rendez-vous (ans)
 * @returns {Object} Solution complète du rendez-vous
 */
export function solveRendezvousProblem(x0, t0, v0, x1, t1) {
    const deltaX = x1 - x0;
    const deltaT = t1 - t0;
    
    // Vérifications de base
    if (deltaT <= 0) {
        throw new Error('Temps de rendez-vous doit être dans le futur');
    }
    
    if (Math.abs(v0) >= 1) {
        throw new Error('Vitesse initiale doit être < c');
    }
    
    // Cas trivial : vaisseau immobile
    if (Math.abs(deltaX) < 1e-12 && Math.abs(v0) < 1e-12) {
        return {
            alpha: 0,
            tau_f: deltaT,
            phi_f: 0,
            v_f: 0,
            deltaPhi: 0,
            energyConsumed: 0,
            is_valid: true
        };
    }
    
    // Calcul de l'accroissement de rapidité
    const deltaPhi = calculateRendezvousRapidity(v0, deltaX, deltaT);
    
    // Calcul de la rapidité initiale
    const phi0 = velocityToRapidity(v0);
    
    // Calcul de l'accélération propre requise (peut être négative pour décélération)
    const alpha = calculateRequiredAcceleration(phi0, deltaPhi, deltaT);
    
    // Calcul du temps propre final
    const tau_f = calculateFinalProperTime(Math.abs(deltaPhi), Math.abs(alpha));
    
    // Calcul de la rapidité et vitesse finales
    const phi_f = phi0 + deltaPhi;
    const v_f = rapidityToVelocity(phi_f);
    
    // Calcul de l'énergie consommée (en unités de m₀c²) - toujours positive
    const energyConsumed = Math.abs(deltaPhi);
    
    return {
        alpha: alpha,                    // Accélération propre (peut être négative)
        tau_f: tau_f,                    // Temps propre final (ans)
        phi_f: phi_f,                    // Rapidité finale
        v_f: v_f,                        // Vitesse finale (v/c)
        deltaPhi: deltaPhi,              // Accroissement de rapidité (peut être négatif)
        energyConsumed: energyConsumed,  // Énergie consommée (toujours positive)
        is_valid: true                   // Solution valide
    };
}

/**
 * Valide si un rendez-vous est possible
 * @param {number} deltaX - Distance à parcourir
 * @param {number} deltaT - Temps disponible
 * @returns {boolean} True si le rendez-vous est possible
 */
export function validateRendezvous(deltaX, deltaT) {
    if (deltaT <= 0) return false;
    
    const beta = Math.abs(deltaX) / (SPEED_OF_LIGHT * deltaT);
    return beta < 1;
} 