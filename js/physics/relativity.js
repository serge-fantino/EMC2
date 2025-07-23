/**
 * CALCULS RELATIVISTES - Module Physics
 * Refactoring Phase 3 - Fonctions de physique relativiste pure
 */

import { SPEED_OF_LIGHT, MAX_VELOCITY, SAFETY_MARGIN, MIN_TIME_STEP } from './constants.js';

/**
 * Limite une vitesse pour rester sous la vitesse de la lumière
 * @param {number} velocity - Vitesse à limiter
 * @returns {number} Vitesse limitée à MAX_VELOCITY
 */
export function limitVelocity(velocity) {
    const absV = Math.abs(velocity);
    if (absV >= MAX_VELOCITY) {
        return Math.sign(velocity) * MAX_VELOCITY;
    }
    return velocity;
}

/**
 * Calcule le ratio de vitesse pour un point dans l'espace-temps
 * @param {number} x - Position spatiale
 * @param {number} y - Position spatiale (dimension Y)
 * @param {number} t - Temps coordonnée
 * @returns {number} Ratio de vitesse (0-1, où 1 = vitesse de la lumière)
 */
export function calculateVelocityRatio(x, y, t) {
    // Distance spatiale totale
    const spatialDistance = Math.sqrt(x * x + y * y);
    
    // Pour un cône de lumière : spatialDistance = c * t sur la surface
    // À l'intérieur : spatialDistance < c * t
    // Le ratio de vitesse est spatialDistance / (c * t)
    
    if (t <= 0) return 0;
    
    const velocityRatio = spatialDistance / t;
    return Math.min(1, velocityRatio); // Plafonné à 1 (vitesse de la lumière)
}

/**
 * Calcule la physique cumulative pour un référentiel depuis l'origine
 * @param {number} coneIndex - Index du cône dans le tableau coneOrigins
 * @param {Array} coneOrigins - Tableau des origines de cônes
 * @returns {Object} Objet contenant toute la physique calculée
 */
export function calculateCumulativePhysics(coneIndex, coneOrigins) {
    const cone = coneOrigins[coneIndex];
    
    if (cone.sourceIndex === -1) {
        // Ceci est l'origine - référentiel au repos
        return {
            cumulativeVelocity: 0,
            cumulativeProperTime: 0,
            totalCoordinateTime: 0,
            segmentVelocity: 0,
            segmentAcceleration: 0,
            segmentProperTime: 0,
            segmentCoordinateTime: 0
        };
    }
    
    // Récupérer la physique du cône source
    const sourceCone = coneOrigins[cone.sourceIndex];
    const sourcePhysics = calculateCumulativePhysics(cone.sourceIndex, coneOrigins);
    
    // Calculer ce segment
    const X = cone.x - sourceCone.x;
    const T = cone.t - sourceCone.t;
    const c = SPEED_OF_LIGHT;
    
    let segmentAcceleration, segmentVelocity, segmentProperTime;
    
    if (Math.abs(X) >= T * c * (1 - SAFETY_MARGIN) || T <= 0) {
        // Trajectoire invalide ou trop proche de la vitesse de la lumière
        segmentAcceleration = 0;
        segmentVelocity = 0;
        segmentProperTime = T;
    } else if (Math.abs(X) < MIN_TIME_STEP) {
        // Pas de déplacement spatial - repos relatif
        segmentAcceleration = 0.001;
        segmentVelocity = 0;
        segmentProperTime = T;
    } else {
        // Calculer le mouvement relativiste depuis la vitesse source
        segmentAcceleration = 2 * Math.abs(X) * c * c / (T * T - X * X);
        const aT_over_c = segmentAcceleration * T / c;
        segmentVelocity = (segmentAcceleration * T) / Math.sqrt(1 + aT_over_c * aT_over_c);
        segmentProperTime = (c / segmentAcceleration) * Math.asinh(aT_over_c);
        
        // Appliquer la limite de vitesse au segment
        segmentVelocity = limitVelocity(segmentVelocity);
    }
    
    // Addition relativiste des vitesses : v_total = (v1 + v2) / (1 + v1*v2/c²)
    const v1 = sourcePhysics.cumulativeVelocity;
    const v2 = Math.sign(X) * segmentVelocity;
    let cumulativeVelocity = (v1 + v2) / (1 + v1 * v2 / (c * c));
    
    // Appliquer la limite de vitesse à la vitesse cumulative
    cumulativeVelocity = limitVelocity(cumulativeVelocity);
    
    return {
        cumulativeVelocity: cumulativeVelocity,
        cumulativeProperTime: sourcePhysics.cumulativeProperTime + segmentProperTime,
        totalCoordinateTime: cone.t,
        segmentVelocity: segmentVelocity,
        segmentAcceleration: segmentAcceleration,
        segmentProperTime: segmentProperTime,
        segmentCoordinateTime: T
    };
}

/**
 * Vérifie si un point est atteignable depuis un cône source
 * @param {number} targetX - Position X cible
 * @param {number} targetT - Temps T cible
 * @param {Object} sourceCone - Cône source {x, t, ...}
 * @returns {boolean} True si le point est atteignable
 */
export function isReachableFromSource(targetX, targetT, sourceCone) {
    const deltaX = Math.abs(targetX - sourceCone.x);
    const deltaT = targetT - sourceCone.t;
    
    // Le point doit être dans le futur et dans le cône de lumière
    return deltaT > 0 && deltaX <= deltaT * SPEED_OF_LIGHT;
} 