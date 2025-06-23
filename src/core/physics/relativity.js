/**
 * @fileoverview Calculs relativistes pour la physique des cônes de lumière
 * @author Serge Fantino
 * @version 2.0.0
 */

import { 
  SPEED_OF_LIGHT, 
  MAX_VELOCITY, 
  ACCELERATION_PRECISION 
} from './constants.js';

/**
 * Utilitaires pour les calculs relativistes
 * @namespace RelativityUtils
 */

/**
 * Limite une vitesse pour rester en dessous de c
 * @param {number} velocity - Vitesse à limiter
 * @returns {number} Vitesse limitée
 * @memberof RelativityUtils
 */
export function limitVelocity(velocity) {
  const absV = Math.abs(velocity);
  if (absV >= MAX_VELOCITY) {
    return Math.sign(velocity) * MAX_VELOCITY;
  }
  return velocity;
}

/**
 * Calcule le facteur de Lorentz γ = 1/√(1 - v²/c²)
 * @param {number} velocity - Vitesse en unités de c
 * @returns {number} Facteur de Lorentz
 * @memberof RelativityUtils
 */
export function lorentzFactor(velocity) {
  const c = SPEED_OF_LIGHT;
  const vSquared = velocity * velocity;
  const cSquared = c * c;
  
  if (vSquared >= cSquared) {
    // Éviter la division par zéro pour v ≥ c
    return Infinity;
  }
  
  return 1 / Math.sqrt(1 - vSquared / cSquared);
}

/**
 * Addition relativiste des vitesses: v = (v1 + v2) / (1 + v1*v2/c²)
 * @param {number} v1 - Première vitesse
 * @param {number} v2 - Seconde vitesse
 * @returns {number} Vitesse résultante
 * @memberof RelativityUtils
 */
export function addVelocitiesRelativistic(v1, v2) {
  const c = SPEED_OF_LIGHT;
  const cSquared = c * c;
  
  const numerator = v1 + v2;
  const denominator = 1 + (v1 * v2) / cSquared;
  
  if (Math.abs(denominator) < 1e-10) {
    // Éviter la division par zéro
    return Math.sign(numerator) * MAX_VELOCITY;
  }
  
  const result = numerator / denominator;
  return limitVelocity(result);
}

/**
 * Calcule l'accélération propre pour une trajectoire donnée
 * Formule: a = 2|ΔX|c² / (ΔT² - ΔX²)
 * @param {number} deltaX - Déplacement spatial
 * @param {number} deltaT - Déplacement temporel
 * @returns {number} Accélération propre
 * @memberof RelativityUtils
 */
export function calculateProperAcceleration(deltaX, deltaT) {
  const c = SPEED_OF_LIGHT;
  const cSquared = c * c;
  
  const deltaXAbs = Math.abs(deltaX);
  const deltaTSquared = deltaT * deltaT;
  const deltaXSquared = deltaX * deltaX;
  
  // Vérifier que le point est dans le cône de lumière
  if (deltaXSquared >= deltaTSquared * cSquared || deltaT <= 0) {
    return 0; // Trajectoire impossible
  }
  
  const denominator = deltaTSquared - deltaXSquared;
  
  if (Math.abs(denominator) < 1e-10) {
    return 0; // Éviter la division par zéro
  }
  
  return (2 * deltaXAbs * cSquared) / denominator;
}

/**
 * Calcule la vitesse finale pour une accélération constante
 * Formule: v = (aΔT) / √(1 + (aΔT/c)²)
 * @param {number} acceleration - Accélération propre
 * @param {number} deltaT - Temps coordonnée
 * @returns {number} Vitesse finale
 * @memberof RelativityUtils
 */
export function calculateFinalVelocity(acceleration, deltaT) {
  const c = SPEED_OF_LIGHT;
  
  if (Math.abs(acceleration) < ACCELERATION_PRECISION) {
    return 0; // Pas d'accélération significative
  }
  
  const aT = acceleration * deltaT;
  const aTOverC = aT / c;
  const denominator = Math.sqrt(1 + aTOverC * aTOverC);
  
  if (denominator === 0) {
    return 0;
  }
  
  const velocity = aT / denominator;
  return limitVelocity(velocity);
}

/**
 * Calcule le temps propre pour une accélération constante
 * Formule: τ = (c/a) × asinh(aΔT/c)
 * @param {number} acceleration - Accélération propre
 * @param {number} deltaT - Temps coordonnée
 * @returns {number} Temps propre
 * @memberof RelativityUtils
 */
export function calculateProperTime(acceleration, deltaT) {
  const c = SPEED_OF_LIGHT;
  
  if (Math.abs(acceleration) < ACCELERATION_PRECISION) {
    // Mouvement inertiel: temps propre = temps coordonnée
    return deltaT;
  }
  
  const aTOverC = (acceleration * deltaT) / c;
  
  // Utiliser asinh pour éviter les problèmes numériques
  const asinhValue = Math.asinh(aTOverC);
  
  return (c / acceleration) * asinhValue;
}

/**
 * Calcule la vitesse relative nécessaire pour connecter deux événements
 * @param {number} deltaX - Déplacement spatial
 * @param {number} deltaT - Déplacement temporel
 * @returns {number} Vitesse relative (ratio v/c)
 * @memberof RelativityUtils
 */
export function calculateVelocityRatio(deltaX, deltaT) {
  if (deltaT <= 0) return 0;
  
  const spatialDistance = Math.abs(deltaX);
  const velocityRatio = spatialDistance / deltaT;
  
  return Math.min(1, velocityRatio); // Limiter à c
}

/**
 * Vérifie si un point est dans le cône de lumière
 * @param {number} deltaX - Déplacement spatial
 * @param {number} deltaT - Déplacement temporel
 * @param {number} [margin=0] - Marge de sécurité
 * @returns {boolean} True si dans le cône
 * @memberof RelativityUtils
 */
export function isInsideLightCone(deltaX, deltaT, margin = 0) {
  if (deltaT <= 0) return false;
  
  const c = SPEED_OF_LIGHT;
  const spatialDistance = Math.abs(deltaX);
  const lightConeRadius = c * deltaT * (1 - margin);
  
  return spatialDistance <= lightConeRadius;
}

/**
 * Calcule la position sur une trajectoire hyperbolique
 * Pour une accélération constante avec vitesse initiale
 * @param {number} acceleration - Accélération propre
 * @param {number} initialVelocity - Vitesse initiale
 * @param {number} time - Temps coordonnée
 * @param {number} initialPosition - Position initiale
 * @returns {number} Position à l'instant t
 * @memberof RelativityUtils
 */
export function calculateHyperbolicPosition(acceleration, initialVelocity, time, initialPosition = 0) {
  const c = SPEED_OF_LIGHT;
  
  if (Math.abs(acceleration) < ACCELERATION_PRECISION) {
    // Mouvement inertiel
    return initialPosition + initialVelocity * time;
  }
  
  if (Math.abs(initialVelocity) < ACCELERATION_PRECISION) {
    // Départ du repos
    const aTOverC = (acceleration * time) / c;
    const cSquaredOverA = (c * c) / acceleration;
    return initialPosition + cSquaredOverA * (Math.sqrt(1 + aTOverC * aTOverC) - 1);
  }
  
  // Cas général avec vitesse initiale non nulle
  // Combinaison de mouvement inertiel et d'accélération
  const gamma0 = lorentzFactor(initialVelocity);
  const inertialComponent = initialVelocity * time;
  
  // Composante d'accélération ajustée
  const aTOverC = (acceleration * time) / c;
  const accelerationComponent = (c * c / acceleration) * (Math.sqrt(1 + aTOverC * aTOverC) - 1);
  
  return initialPosition + inertialComponent + accelerationComponent / gamma0;
}

/**
 * Calcule les paramètres physiques complets pour un segment de trajectoire
 * @param {Object} params - Paramètres du segment
 * @param {number} params.deltaX - Déplacement spatial
 * @param {number} params.deltaT - Déplacement temporel
 * @param {number} [params.initialVelocity=0] - Vitesse initiale
 * @returns {Object} Paramètres physiques calculés
 * @memberof RelativityUtils
 */
export function calculateSegmentPhysics({ deltaX, deltaT, initialVelocity = 0 }) {
  const acceleration = calculateProperAcceleration(deltaX, deltaT);
  const finalVelocity = calculateFinalVelocity(acceleration, deltaT);
  const properTime = calculateProperTime(acceleration, deltaT);
  const velocityRatio = calculateVelocityRatio(deltaX, deltaT);
  
  return {
    acceleration,
    finalVelocity: Math.sign(deltaX) * finalVelocity,
    properTime,
    coordinateTime: deltaT,
    velocityRatio,
    isValid: isInsideLightCone(deltaX, deltaT)
  };
} 