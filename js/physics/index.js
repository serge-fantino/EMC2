/**
 * MODULE PHYSICS - Point d'entrée principal
 * Refactoring Phase 3 - Calculs relativistes modulaires
 * 
 * Ce module exporte toutes les fonctions de physique relativiste
 * pour la visualisation des cônes de lumière
 */

// === EXPORTS DE CONSTANTES ===
export {
    SPEED_OF_LIGHT,
    VELOCITY_EPSILON, 
    MAX_VELOCITY,
    SAFETY_MARGIN,
    MIN_TIME_STEP,
    TRAJECTORY_STEPS
} from './constants.js';

// === EXPORTS DE CALCULS RELATIVISTES ===
export {
    limitVelocity,
    calculateVelocityRatio,
    calculateCumulativePhysics,
    isReachableFromSource
} from './relativity.js';

// === EXPORTS DE TRAJECTOIRES (BRIDGE VERS PHYSICS_RELATIVISTIC) ===
export {
    calculateIsochronePoints,
    calculateAccelerationTrajectory,
    getContainingCone,
    getRendezvousInfo,
    validateTrajectoryWithNewSystem
} from './bridge.js';

// === EXPORTS DU NOUVEAU MODULE PHYSICS_RELATIVISTIC ===
// Export direct pour accès aux nouvelles fonctions
export * from '../physics_relativistic/index.js'; 