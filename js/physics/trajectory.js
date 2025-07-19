/**
 * CALCULS DE TRAJECTOIRES - Module Physics
 * Refactoring Phase 3 - Trajectoires relativistes et isochrones
 */

import { SPEED_OF_LIGHT, TRAJECTORY_STEPS } from './constants.js';

/**
 * Calcule les points d'une isochrone (surface de temps propre constant)
 * @param {number} tau - Temps propre de l'isochrone
 * @param {Object} origin - Point d'origine {x, t, ...}
 * @param {Object} selectedCone - Cône sélectionné pour calibration
 * @param {number} canvasWidth - Largeur du canvas pour calculer les bornes
 * @returns {Array} Tableau de points {x, t} de l'isochrone
 */
export function calculateIsochronePoints(tau, origin, selectedCone, canvasWidth) {
    const points = [];
    const c = SPEED_OF_LIGHT;
    
    // Calcul des bornes d'écran
    const centerX = canvasWidth / 2;
    const scale = 2;
    const maxScreenX = canvasWidth;
    const minScreenX = 0;
    
    // Conversion bornes écran → coordonnées espace-temps
    const maxSpatialExtent = (maxScreenX - centerX) / scale;
    const minSpatialExtent = (minScreenX - centerX) / scale;
    
    // Extension au-delà de l'écran pour des courbes lisses
    const margin = 50;
    const xMin = minSpatialExtent - margin;
    const xMax = maxSpatialExtent + margin;
    
    if (xMax <= xMin) return [];
    
    const step = Math.max(1, Math.abs(xMax - xMin) / 500);
    
    // Facteur de calibration pour l'isochrone
    let tauCalibration = 1.0;
    
    if (selectedCone) {
        const deltaX_selected = selectedCone.x - origin.x;
        const deltaT_selected = selectedCone.t - origin.t;
        const t_formula = Math.sqrt(tau * tau + (deltaX_selected * deltaX_selected) / (c * c));
        
        if (t_formula > 0 && deltaT_selected > 0) {
            tauCalibration = deltaT_selected / t_formula;
        }
    }
    
    // Génération des points de l'isochrone
    for (let x = xMin; x <= xMax; x += step) {
        const deltaX = x - origin.x;
        
        // Formule de l'isochrone : t = √(τ² + (Δx/c)²)
        const t_formula = Math.sqrt(tau * tau + (deltaX * deltaX) / (c * c));
        const t = origin.t + t_formula * tauCalibration;
        
        // Vérification que le point est dans le futur
        if (t > origin.t) {
            points.push({ x: x, t: t });
        }
    }
    
    return points;
}

/**
 * Calcule une trajectoire d'accélération relativiste entre deux points
 * @param {Object} fromCone - Point de départ {x, t, ...}
 * @param {Object} toCone - Point d'arrivée {x, t, ...}
 * @param {number} initialVelocity - Vitesse initiale (optionnelle)
 * @returns {Array} Tableau de points {x, t} de la trajectoire
 */
export function calculateAccelerationTrajectory(fromCone, toCone, initialVelocity = 0) {
    const trajectory = [];
    const c = SPEED_OF_LIGHT;
    
    const X = toCone.x - fromCone.x;
    const T = toCone.t - fromCone.t;
    
    if (T <= 0) return trajectory; // Pas de trajectoire vers le passé
    
    // Calcul de l'accélération propre nécessaire
    let properAccel;
    const v0 = initialVelocity;
    
    if (Math.abs(X) < 0.001) {
        // Mouvement principalement temporel
        properAccel = 0.001;
    } else {
        // Accélération propre pour atteindre la cible
        properAccel = 2 * Math.abs(X) * c * c / (T * T - X * X);
    }
    
    // Génération des points de trajectoire
    trajectory.push({ x: fromCone.x, t: fromCone.t });
    
    for (let i = 1; i <= TRAJECTORY_STEPS; i++) {
        const t = (i / TRAJECTORY_STEPS) * T; // temps coordonnée
        
        let x, time;
        
        if (Math.abs(v0) < 0.001) {
            // Départ du repos - formule simple
            const at_over_c = properAccel * t / c;
            const x_rel = (c * c / properAccel) * (Math.sqrt(1 + at_over_c * at_over_c) - 1);
            x = fromCone.x + Math.sign(X) * x_rel;
        } else {
            // Départ avec vitesse initiale v0
            const targetX = toCone.x;
            const targetT = toCone.t;
            const deltaX = targetX - fromCone.x;
            const deltaT = targetT - fromCone.t;
            
            const t_norm = t / deltaT; // Temps normalisé (0 à 1)
            
            // Composante inertielle (mouvement à vitesse constante)
            const x_inertial = fromCone.x + v0 * t;
            
            // Correction d'accélération pour atteindre la cible
            const x_target_correction = deltaX - v0 * deltaT;
            
            // Trajectoire hyperbolique corrigée
            if (Math.abs(x_target_correction) > 0.001) {
                const correction_factor = x_target_correction / deltaT;
                const at_over_c = properAccel * t / c;
                const accel_term = (c * c / properAccel) * (Math.sqrt(1 + at_over_c * at_over_c) - 1);
                
                x = x_inertial + Math.sign(correction_factor) * accel_term * Math.abs(correction_factor) / Math.abs(x_target_correction) * deltaT;
            } else {
                x = x_inertial;
            }
        }
        
        time = fromCone.t + t;
        trajectory.push({ x, t: time });
    }
    
    return trajectory;
}

/**
 * Détermine quel cône contient un point donné
 * @param {number} x - Position spatiale
 * @param {number} t - Temps coordonnée  
 * @param {Array} coneOrigins - Tableau des cônes
 * @returns {number} Index du cône contenant le point, ou -1 si aucun
 */
export function getContainingCone(x, t, coneOrigins) {
    // Vérifier les cônes dans l'ordre inverse (les plus récents d'abord)
    for (let i = coneOrigins.length - 1; i >= 0; i--) {
        const cone = coneOrigins[i];
        
        // Position relative par rapport au cône
        const relativeX = x - cone.x;
        const relativeT = t - cone.t;
        
        // Le point doit être dans le futur de ce cône
        if (relativeT > 0) {
            // Vérifier si le point est dans le cône de lumière
            const spatialDistance = Math.abs(relativeX);
            const lightConeRadius = relativeT * SPEED_OF_LIGHT;
            
            if (spatialDistance <= lightConeRadius) {
                return i; // Point trouvé dans ce cône
            }
        }
    }
    
    return -1; // Point en dehors de tous les cônes
} 