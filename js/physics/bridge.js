/**
 * BRIDGE MODULE - Transition vers physics_relativistic
 * Phase 3 - Compatibilité avec l'application existante
 * 
 * Ce module adapte les nouvelles fonctions de physics_relativistic
 * pour maintenir la compatibilité avec l'interface existante
 */

import {
    // Nouvelles fonctions de physics_relativistic
    solveRendezvousProblem,
    generateTrajectory,
    validateTrajectory,
    SPEED_OF_LIGHT as C,
    TAU_SAMPLES
} from '../physics_relativistic/index.js';

/**
 * Calcule une trajectoire d'accélération relativiste entre deux points
 * Interface de compatibilité avec l'ancien système
 * @param {Object} fromCone - Point de départ {x, t, ...}
 * @param {Object} toCone - Point d'arrivée {x, t, ...}
 * @param {number} initialVelocity - Vitesse initiale (optionnelle)
 * @returns {Array} Tableau de points {x, t} de la trajectoire (format ancien)
 */
export function calculateAccelerationTrajectory(fromCone, toCone, initialVelocity = 0) {
    try {
        console.log('🚀🚀🚀 BRIDGE ACTIVÉ ! 🚀🚀🚀');
        console.log('🔧 BRIDGE: Utilisation du nouveau module physics_relativistic');
        console.log('🔧 BRIDGE: Paramètres:', { fromCone, toCone, initialVelocity });
        
        // Résolution du problème de rendez-vous avec le nouveau système
        const rendezvous = solveRendezvousProblem(
            fromCone.x, fromCone.t, initialVelocity,
            toCone.x, toCone.t
        );
        
        // Génération de la trajectoire avec le nouveau système
        const trajectory = generateTrajectory(
            fromCone.x, fromCone.t, initialVelocity,
            rendezvous.alpha, rendezvous.tau_f
        );
        
        // Conversion au format attendu par l'application existante
        return trajectory.map(point => ({
            x: point.x,
            t: point.t,
            // Ajout des nouvelles données pour compatibilité future
            v: point.v,
            gamma: point.gamma,
            phi: point.phi,
            tau: point.tau,
            // Données du rendez-vous pour les cartouches
            rendezvous: rendezvous
        }));
        
    } catch (error) {
        console.warn('Erreur dans calculateAccelerationTrajectory:', error.message);
        
        // Retourner une trajectoire vide en cas d'erreur (pas de fallback)
        // Cela permet de détecter les problèmes de causalité
        return [];
    }
}

/**
 * Calcule les points d'une isochrone (surface de temps propre constant)
 * Interface de compatibilité avec l'ancien système
 * @param {number} tau - Temps propre de l'isochrone
 * @param {Object} origin - Point d'origine {x, t, ...}
 * @param {Object} selectedCone - Cône sélectionné pour calibration
 * @param {number} canvasWidth - Largeur du canvas pour calculer les bornes
 * @returns {Array} Tableau de points {x, t} de l'isochrone
 */
export function calculateIsochronePoints(tau, origin, selectedCone, canvasWidth) {
    // Pour l'instant, on garde l'ancienne implémentation des isochrones
    // car elles ne sont pas directement liées aux trajectoires de rendez-vous
    const points = [];
    const c = C;
    
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
 * Détermine quel cône contient un point donné
 * Interface de compatibilité avec l'ancien système
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
            const lightConeRadius = relativeT * C;
            
            if (spatialDistance <= lightConeRadius) {
                return i; // Point trouvé dans ce cône
            }
        }
    }
    
    return -1; // Point en dehors de tous les cônes
}

/**
 * Fonction de fallback pour générer une trajectoire simple
 * Utilisée en cas d'erreur avec le nouveau système
 * @param {Object} fromCone - Point de départ
 * @param {Object} toCone - Point d'arrivée
 * @param {number} initialVelocity - Vitesse initiale
 * @returns {Array} Trajectoire simple
 */
function generateSimpleTrajectory(fromCone, toCone, initialVelocity) {
    const trajectory = [];
    const steps = 50;
    
    for (let i = 0; i <= steps; i++) {
        const t = fromCone.t + (toCone.t - fromCone.t) * (i / steps);
        const x = fromCone.x + (toCone.x - fromCone.x) * (i / steps);
        
        trajectory.push({ x, t });
    }
    
    return trajectory;
}

/**
 * Extrait les informations de rendez-vous d'une trajectoire
 * Utile pour les cartouches d'information
 * @param {Array} trajectory - Trajectoire générée
 * @returns {Object|null} Informations de rendez-vous ou null
 */
export function getRendezvousInfo(trajectory) {
    if (trajectory.length > 0 && trajectory[0].rendezvous) {
        return trajectory[0].rendezvous;
    }
    return null;
}

/**
 * Valide une trajectoire avec le nouveau système
 * @param {Array} trajectory - Trajectoire à valider
 * @returns {Object} Résultat de validation
 */
export function validateTrajectoryWithNewSystem(trajectory) {
    // Convertir au format attendu par validateTrajectory
    const formattedTrajectory = trajectory.map(point => ({
        x: point.x,
        t: point.t,
        v: point.v || 0,
        gamma: point.gamma || 1,
        phi: point.phi || 0,
        tau: point.tau || 0
    }));
    
    return validateTrajectory(formattedTrajectory);
} 