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
 * ANCIENNE FONCTION SUPPRIMÉE - Utilisez le bridge module
 * Cette fonction a été remplacée par le nouveau système physics_relativistic
 * via le bridge module pour des calculs plus précis
 */

/**
 * ANCIENNE FONCTION SUPPRIMÉE - Utilisez le bridge module
 * Cette fonction a été remplacée par le nouveau système physics_relativistic
 * via le bridge module pour des calculs plus précis
 */ 