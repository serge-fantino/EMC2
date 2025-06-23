/**
 * @fileoverview Calculs de trajectoires complexes et isochrones
 * @author Serge Fantino
 * @version 2.0.0
 */

import {
  calculateProperAcceleration,
  calculateFinalVelocity,
  calculateProperTime,
  addVelocitiesRelativistic,
  calculateHyperbolicPosition,
  isInsideLightCone
} from './relativity.js';
import {
  SPEED_OF_LIGHT,
  ISOCHRONE_POINTS_COUNT,
  ISOCHRONE_EXTENSION_MARGIN,
  MIN_PROPER_TIME
} from './constants.js';

/**
 * Utilitaires pour les calculs de trajectoires
 * @namespace TrajectoryUtils
 */

/**
 * Calcule une trajectoire hyperbolique complète
 * @param {Object} params - Paramètres de la trajectoire
 * @param {number} params.startX - Position de départ
 * @param {number} params.startT - Temps de départ
 * @param {number} params.endX - Position d'arrivée
 * @param {number} params.endT - Temps d'arrivée
 * @param {number} [params.initialVelocity=0] - Vitesse initiale
 * @param {number} [params.points=100] - Nombre de points à calculer
 * @returns {Object} Données de la trajectoire
 * @memberof TrajectoryUtils
 */
export function calculateHyperbolicTrajectory({
  startX,
  startT,
  endX,
  endT,
  initialVelocity = 0,
  points = 100
}) {
  const deltaX = endX - startX;
  const deltaT = endT - startT;
  
  if (deltaT <= 0) {
    throw new Error('Le temps d\'arrivée doit être postérieur au temps de départ');
  }
  
  if (!isInsideLightCone(deltaX, deltaT)) {
    throw new Error('La trajectoire doit rester dans le cône de lumière');
  }
  
  const acceleration = calculateProperAcceleration(deltaX, deltaT);
  const finalVelocity = calculateFinalVelocity(acceleration, deltaT);
  const properTime = calculateProperTime(acceleration, deltaT);
  
  // Générer les points de la trajectoire
  const trajectoryPoints = [];
  for (let i = 0; i <= points; i++) {
    const t = startT + (deltaT * i) / points;
    const relativeTime = t - startT;
    const x = startX + calculateHyperbolicPosition(
      acceleration,
      initialVelocity,
      relativeTime,
      0
    );
    
    trajectoryPoints.push({ x, t });
  }
  
  return {
    points: trajectoryPoints,
    physics: {
      acceleration,
      initialVelocity,
      finalVelocity,
      properTime,
      coordinateTime: deltaT
    },
    bounds: {
      startX,
      startT,
      endX,
      endT
    }
  };
}

/**
 * Calcule les points d'une isochrone (courbe de temps propre constant)
 * @param {Object} params - Paramètres de l'isochrone
 * @param {number} params.originX - Position X de l'origine
 * @param {number} params.originT - Position T de l'origine
 * @param {number} params.properTime - Temps propre constant
 * @param {Object} params.bounds - Limites de calcul
 * @param {number} params.bounds.minX - X minimum
 * @param {number} params.bounds.maxX - X maximum
 * @param {number} params.bounds.maxT - T maximum
 * @returns {Array<Object>} Points de l'isochrone {x, t}
 * @memberof TrajectoryUtils
 */
export function calculateIsochronePoints({
  originX,
  originT,
  properTime,
  bounds
}) {
  if (properTime < MIN_PROPER_TIME) {
    return [];
  }
  
  const points = [];
  const { minX, maxX, maxT } = bounds;
  
  // Extension des limites pour une meilleure visualisation
  const extendedMinX = minX * ISOCHRONE_EXTENSION_MARGIN;
  const extendedMaxX = maxX * ISOCHRONE_EXTENSION_MARGIN;
  
  // Calculer les points de l'isochrone
  for (let i = 0; i < ISOCHRONE_POINTS_COUNT; i++) {
    const progress = i / (ISOCHRONE_POINTS_COUNT - 1);
    const x = extendedMinX + (extendedMaxX - extendedMinX) * progress;
    
    // Calculer le temps coordonnée correspondant pour ce temps propre
    const t = calculateCoordinateTimeForIsochrone(
      originX,
      originT,
      x,
      properTime
    );
    
    // Vérifier que le point est valide et dans les limites
    if (t > originT && t <= maxT && isInsideLightCone(x - originX, t - originT)) {
      points.push({ x, t });
    }
  }
  
  return points;
}

/**
 * Calcule le temps coordonnée pour un point donné sur une isochrone
 * @param {number} originX - Position X de l'origine
 * @param {number} originT - Position T de l'origine
 * @param {number} targetX - Position X cible
 * @param {number} properTime - Temps propre désiré
 * @returns {number} Temps coordonnée correspondant
 * @memberof TrajectoryUtils
 */
export function calculateCoordinateTimeForIsochrone(originX, originT, targetX, properTime) {
  const deltaX = targetX - originX;
  const c = SPEED_OF_LIGHT;
  
  if (Math.abs(deltaX) < 1e-10) {
    // Cas trivial: pas de déplacement spatial
    return originT + properTime;
  }
  
  // Pour une isochrone, nous devons résoudre l'équation :
  // τ = (c/a) * asinh(aΔT/c)
  // où a = 2|ΔX|c² / (ΔT² - ΔX²)
  
  // Résolution numérique par méthode de Newton-Raphson
  let deltaT = Math.abs(deltaX) / 0.5; // Estimation initiale
  const maxIterations = 50;
  const tolerance = 1e-10;
  
  for (let iter = 0; iter < maxIterations; iter++) {
    if (deltaT <= Math.abs(deltaX)) {
      deltaT = Math.abs(deltaX) * 1.1; // Assurer qu'on reste dans le cône
      continue;
    }
    
    const acceleration = calculateProperAcceleration(deltaX, deltaT);
    if (acceleration === 0) {
      deltaT *= 1.1;
      continue;
    }
    
    const currentProperTime = calculateProperTime(acceleration, deltaT);
    const error = currentProperTime - properTime;
    
    if (Math.abs(error) < tolerance) {
      break;
    }
    
    // Dérivée numérique pour Newton-Raphson
    const epsilon = 1e-8;
    const deltaTPlusEps = deltaT + epsilon;
    const accelerationPlusEps = calculateProperAcceleration(deltaX, deltaTPlusEps);
    const properTimePlusEps = calculateProperTime(accelerationPlusEps, deltaTPlusEps);
    const derivative = (properTimePlusEps - currentProperTime) / epsilon;
    
    if (Math.abs(derivative) > 1e-15) {
      deltaT -= error / derivative;
    } else {
      deltaT *= 1.01; // Petit ajustement si la dérivée est trop petite
    }
    
    // Contraintes de sécurité
    deltaT = Math.max(deltaT, Math.abs(deltaX) * 1.001);
    deltaT = Math.min(deltaT, Math.abs(deltaX) * 1000);
  }
  
  return originT + deltaT;
}

/**
 * Calcule une trajectoire cumulative à travers plusieurs référentiels
 * @param {Array<Object>} referenceFrames - Chaîne de référentiels
 * @returns {Object} Trajectoire cumulative complète
 * @memberof TrajectoryUtils
 */
export function calculateCumulativeTrajectory(referenceFrames) {
  if (!Array.isArray(referenceFrames) || referenceFrames.length === 0) {
    throw new Error('Il faut au moins un référentiel');
  }
  
  const segments = [];
  let cumulativeVelocity = 0;
  let cumulativeProperTime = 0;
  let totalCoordinateTime = 0;
  
  for (let i = 1; i < referenceFrames.length; i++) {
    const sourceFrame = referenceFrames[i - 1];
    const targetFrame = referenceFrames[i];
    
    const deltaX = targetFrame.x - sourceFrame.x;
    const deltaT = targetFrame.t - sourceFrame.t;
    
    // Calculs pour ce segment
    const segmentPhysics = {
      deltaX,
      deltaT,
      acceleration: calculateProperAcceleration(deltaX, deltaT),
      segmentVelocity: calculateFinalVelocity(
        calculateProperAcceleration(deltaX, deltaT),
        deltaT
      ),
      properTime: calculateProperTime(
        calculateProperAcceleration(deltaX, deltaT),
        deltaT
      )
    };
    
    // Appliquer le signe du déplacement à la vitesse
    segmentPhysics.segmentVelocity *= Math.sign(deltaX);
    
    // Addition relativiste des vitesses
    const newCumulativeVelocity = addVelocitiesRelativistic(
      cumulativeVelocity,
      segmentPhysics.segmentVelocity
    );
    
    // Mise à jour des cumuls
    cumulativeProperTime += segmentPhysics.properTime;
    totalCoordinateTime += deltaT;
    
    segments.push({
      sourceFrame,
      targetFrame,
      physics: {
        ...segmentPhysics,
        initialCumulativeVelocity: cumulativeVelocity,
        finalCumulativeVelocity: newCumulativeVelocity,
        cumulativeProperTime,
        totalCoordinateTime
      }
    });
    
    cumulativeVelocity = newCumulativeVelocity;
  }
  
  return {
    segments,
    totalPhysics: {
      finalVelocity: cumulativeVelocity,
      totalProperTime: cumulativeProperTime,
      totalCoordinateTime,
      timeDilationFactor: totalCoordinateTime / cumulativeProperTime,
      timeDilationPercentage: ((totalCoordinateTime - cumulativeProperTime) / totalCoordinateTime) * 100
    }
  };
}

/**
 * Génère une trajectoire de démonstration du paradoxe des jumeaux
 * @param {Object} params - Paramètres de la démonstration
 * @param {number} params.maxDistance - Distance maximale du voyage
 * @param {number} params.totalTime - Temps total du voyage
 * @param {number} [params.accelerationPhase=0.1] - Fraction du temps en accélération
 * @returns {Array<Object>} Référentiels pour la démonstration
 * @memberof TrajectoryUtils
 */
export function generateTwinParadoxDemo({
  maxDistance,
  totalTime,
  accelerationPhase = 0.1
}) {
  const frames = [];
  
  // Origine
  frames.push({ x: 0, t: 0, sourceFrame: null });
  
  // Phase d'accélération (aller)
  const accelTime = totalTime * accelerationPhase;
  const cruiseTime = totalTime * (0.5 - accelerationPhase);
  const returnAccelTime = totalTime * accelerationPhase;
  const returnCruiseTime = totalTime * (0.5 - accelerationPhase);
  
  // Point 1: Fin d'accélération aller
  frames.push({
    x: maxDistance * 0.1,
    t: accelTime,
    sourceFrame: frames[0]
  });
  
  // Point 2: Début de décélération aller
  frames.push({
    x: maxDistance * 0.9,
    t: accelTime + cruiseTime,
    sourceFrame: frames[1]
  });
  
  // Point 3: Arrêt à destination
  frames.push({
    x: maxDistance,
    t: totalTime * 0.5,
    sourceFrame: frames[2]
  });
  
  // Point 4: Début d'accélération retour
  frames.push({
    x: maxDistance * 0.9,
    t: totalTime * 0.5 + returnAccelTime,
    sourceFrame: frames[3]
  });
  
  // Point 5: Fin d'accélération retour
  frames.push({
    x: maxDistance * 0.1,
    t: totalTime * 0.5 + returnAccelTime + returnCruiseTime,
    sourceFrame: frames[4]
  });
  
  // Point 6: Retour à l'origine
  frames.push({
    x: 0,
    t: totalTime,
    sourceFrame: frames[5]
  });
  
  return frames;
}

/**
 * Détecte les intersections entre une trajectoire et une isochrone
 * @param {Array<Object>} trajectoryPoints - Points de la trajectoire
 * @param {Array<Object>} isochronePoints - Points de l'isochrone
 * @param {number} [tolerance=5] - Tolérance de détection en pixels
 * @returns {Array<Object>} Points d'intersection trouvés
 * @memberof TrajectoryUtils
 */
export function findTrajectoryIsochroneIntersections(
  trajectoryPoints,
  isochronePoints,
  tolerance = 5
) {
  const intersections = [];
  
  for (const trajPoint of trajectoryPoints) {
    for (const isoPoint of isochronePoints) {
      const distance = Math.sqrt(
        Math.pow(trajPoint.x - isoPoint.x, 2) +
        Math.pow(trajPoint.t - isoPoint.t, 2)
      );
      
      if (distance <= tolerance) {
        intersections.push({
          trajectory: trajPoint,
          isochrone: isoPoint,
          distance
        });
      }
    }
  }
  
  // Trier par distance et retourner les plus proches
  return intersections
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 10); // Maximum 10 intersections
}

/**
 * Optimise une trajectoire pour minimiser le temps propre
 * @param {Object} params - Paramètres d'optimisation
 * @param {number} params.startX - Position de départ
 * @param {number} params.startT - Temps de départ
 * @param {number} params.endX - Position d'arrivée
 * @param {number} params.endT - Temps d'arrivée
 * @param {Array<Object>} [params.waypoints] - Points de passage optionnels
 * @returns {Object} Trajectoire optimisée
 * @memberof TrajectoryUtils
 */
export function optimizeTrajectoryForMinimalProperTime({
  startX,
  startT,
  endX,
  endT,
  waypoints = []
}) {
  // Pour l'instant, implémentation simple sans points de passage
  if (waypoints.length > 0) {
    throw new Error('Les points de passage ne sont pas encore supportés');
  }
  
  // La trajectoire optimale pour minimiser le temps propre
  // est la trajectoire d'accélération constante
  return calculateHyperbolicTrajectory({
    startX,
    startT,
    endX,
    endT,
    initialVelocity: 0,
    points: 100
  });
}

/**
 * Calcule la courbure d'une trajectoire en un point donné
 * @param {Array<Object>} trajectoryPoints - Points de la trajectoire
 * @param {number} index - Index du point à analyser
 * @returns {number} Courbure au point donné
 * @memberof TrajectoryUtils
 */
export function calculateTrajectoryCurvature(trajectoryPoints, index) {
  if (index <= 0 || index >= trajectoryPoints.length - 1) {
    return 0; // Pas de courbure aux extrémités
  }
  
  const p1 = trajectoryPoints[index - 1];
  const p2 = trajectoryPoints[index];
  const p3 = trajectoryPoints[index + 1];
  
  // Calcul de la courbure par la formule des trois points
  const dx1 = p2.x - p1.x;
  const dt1 = p2.t - p1.t;
  const dx2 = p3.x - p2.x;
  const dt2 = p3.t - p2.t;
  
  const cross = dx1 * dt2 - dt1 * dx2;
  const norm1 = Math.sqrt(dx1 * dx1 + dt1 * dt1);
  const norm2 = Math.sqrt(dx2 * dx2 + dt2 * dt2);
  
  if (norm1 === 0 || norm2 === 0) {
    return 0;
  }
  
  return Math.abs(cross) / (norm1 * norm1 * norm2);
} 