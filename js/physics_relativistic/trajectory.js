/**
 * GÉNÉRATION DE TRAJECTOIRES RELATIVISTES (TDD)
 * Implémentation basée sur les équations paramétriques en temps propre
 */

import { SPEED_OF_LIGHT, TAU_SAMPLES } from './constants.js';
import { velocityToRapidity, rapidityToVelocity } from './rapidity.js';

/**
 * Calcule un point de la trajectoire à un temps propre donné
 * @param {number} x0 - Position initiale (années-lumière)
 * @param {number} t0 - Temps initial (ans)
 * @param {number} v0 - Vitesse initiale (v/c)
 * @param {number} alpha - Accélération propre (c/an)
 * @param {number} tau - Temps propre (ans)
 * @returns {Object} Point de la trajectoire {x, t, v, gamma, phi}
 */
export function calculateTrajectoryPoint(x0, t0, v0, alpha, tau) {
    // Cas spécial : vaisseau immobile
    if (Math.abs(alpha) < 1e-12) {
        return {
            x: x0,
            t: t0 + tau,
            v: v0,
            gamma: 1 / Math.sqrt(1 - v0 * v0),
            phi: velocityToRapidity(v0),
            tau: tau
        };
    }
    
    // Rapidité initiale
    const phi0 = velocityToRapidity(v0);
    
    // Rapidité à l'instant τ
    const phi = phi0 + alpha * tau / SPEED_OF_LIGHT;
    
    // Position en fonction du temps propre
    const x = x0 + (SPEED_OF_LIGHT * SPEED_OF_LIGHT / alpha) * 
              (Math.cosh(phi) - Math.cosh(phi0));
    
    // Temps coordonné en fonction du temps propre
    const t = t0 + (SPEED_OF_LIGHT / alpha) * 
              (Math.sinh(phi) - Math.sinh(phi0));
    
    // Vitesse instantanée
    const v = rapidityToVelocity(phi);
    
    // Facteur de Lorentz
    const gamma = Math.cosh(phi);
    
    return {
        x: x,
        t: t,
        v: v,
        gamma: gamma,
        phi: phi,
        tau: tau
    };
}

/**
 * Génère une trajectoire complète échantillonnée
 * @param {number} x0 - Position initiale (années-lumière)
 * @param {number} t0 - Temps initial (ans)
 * @param {number} v0 - Vitesse initiale (v/c)
 * @param {number} alpha - Accélération propre (c/an)
 * @param {number} tau_f - Temps propre final (ans)
 * @param {number} samples - Nombre de points d'échantillonnage (optionnel)
 * @returns {Array} Tableau de points de la trajectoire
 */
export function generateTrajectory(x0, t0, v0, alpha, tau_f, samples = TAU_SAMPLES) {
    const trajectory = [];
    
    // Échantillonnage en temps propre
    for (let i = 0; i < samples; i++) {
        const tau = (i / (samples - 1)) * tau_f;
        const point = calculateTrajectoryPoint(x0, t0, v0, alpha, tau);
        trajectory.push(point);
    }
    
    return trajectory;
}

/**
 * Génère une trajectoire complète avec un pas de temps propre fixe
 * @param {number} x0 - Position initiale (années-lumière)
 * @param {number} t0 - Temps initial (ans)
 * @param {number} v0 - Vitesse initiale (v/c)
 * @param {number} alpha - Accélération propre (c/an)
 * @param {number} tau_f - Temps propre final (ans)
 * @param {number} dtau - Pas de temps propre (ans)
 * @returns {Array} Tableau de points de la trajectoire
 */
export function generateTrajectoryWithStep(x0, t0, v0, alpha, tau_f, dtau) {
    const trajectory = [];
    
    // Échantillonnage avec pas fixe
    for (let tau = 0; tau <= tau_f; tau += dtau) {
        const point = calculateTrajectoryPoint(x0, t0, v0, alpha, tau);
        trajectory.push(point);
    }
    
    // S'assurer que le point final est inclus
    if (trajectory.length === 0 || trajectory[trajectory.length - 1].tau < tau_f) {
        const finalPoint = calculateTrajectoryPoint(x0, t0, v0, alpha, tau_f);
        trajectory.push(finalPoint);
    }
    
    return trajectory;
}

/**
 * Calcule la trajectoire complète pour un problème de rendez-vous
 * @param {number} x0 - Position initiale (années-lumière)
 * @param {number} t0 - Temps initial (ans)
 * @param {number} v0 - Vitesse initiale (v/c)
 * @param {number} x1 - Position finale (années-lumière)
 * @param {number} t1 - Temps final (ans)
 * @param {number} samples - Nombre de points d'échantillonnage (optionnel)
 * @returns {Object} {trajectory, rendezvous} - Trajectoire et solution du rendez-vous
 */
export async function generateRendezvousTrajectory(x0, t0, v0, x1, t1, samples = TAU_SAMPLES) {
    // Import dynamique pour éviter les dépendances circulaires
    const { solveRendezvousProblem } = await import('./rendezvous.js');
    
    // Résolution du problème de rendez-vous
    const rendezvous = solveRendezvousProblem(x0, t0, v0, x1, t1);
    
    // Génération de la trajectoire
    const trajectory = generateTrajectory(x0, t0, v0, rendezvous.alpha, rendezvous.tau_f, samples);
    
    return {
        trajectory: trajectory,
        rendezvous: rendezvous
    };
}

/**
 * Valide la cohérence physique d'une trajectoire
 * @param {Array} trajectory - Trajectoire à valider
 * @returns {Object} Résultat de validation
 */
export function validateTrajectory(trajectory) {
    if (trajectory.length < 2) {
        return { valid: false, errors: ['Trajectoire trop courte'] };
    }
    
    const errors = [];
    
    // Vérifier que tous les points sont dans le cône de lumière
    for (const point of trajectory) {
        if (Math.abs(point.v) >= 1) {
            errors.push(`Vitesse supra-luminique: v = ${point.v}c`);
        }
        if (point.gamma < 1) {
            errors.push(`Facteur de Lorentz invalide: γ = ${point.gamma}`);
        }
    }
    
    // Vérifier la monotonie du temps coordonné
    for (let i = 1; i < trajectory.length; i++) {
        if (trajectory[i].t <= trajectory[i-1].t) {
            errors.push('Temps coordonné non monotone');
            break;
        }
    }
    
    // Vérifier la monotonie du temps propre
    for (let i = 1; i < trajectory.length; i++) {
        if (trajectory[i].tau <= trajectory[i-1].tau) {
            errors.push('Temps propre non monotone');
            break;
        }
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
} 