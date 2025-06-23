/**
 * @fileoverview Utilitaires de validation pour les entités et calculs physiques
 * @author Serge Fantino
 * @version 2.0.0
 */

import { LIGHT_CONE_MARGIN } from '@core/physics/constants.js';
import { isInsideLightCone } from '@core/physics/relativity.js';

/**
 * Erreurs de validation personnalisées
 * @namespace ValidationErrors
 */

/**
 * Erreur de validation de position
 * @class PositionValidationError
 * @extends Error
 */
export class PositionValidationError extends Error {
  constructor(message, position) {
    super(message);
    this.name = 'PositionValidationError';
    this.position = position;
  }
}

/**
 * Erreur de validation de référentiel source
 * @class SourceFrameValidationError
 * @extends Error
 */
export class SourceFrameValidationError extends Error {
  constructor(message, sourceFrame, targetPosition) {
    super(message);
    this.name = 'SourceFrameValidationError';
    this.sourceFrame = sourceFrame;
    this.targetPosition = targetPosition;
  }
}

/**
 * Erreur de validation de paramètres physiques
 * @class PhysicsValidationError
 * @extends Error
 */
export class PhysicsValidationError extends Error {
  constructor(message, parameters) {
    super(message);
    this.name = 'PhysicsValidationError';
    this.parameters = parameters;
  }
}

/**
 * Valide une position dans l'espace-temps
 * @param {Object} position - Position à valider
 * @param {number} position.x - Coordonnée spatiale
 * @param {number} position.t - Coordonnée temporelle
 * @throws {PositionValidationError} Si la position est invalide
 */
export function validatePosition({ x, t }) {
  if (typeof x !== 'number' || !isFinite(x)) {
    throw new PositionValidationError(
      'La coordonnée spatiale doit être un nombre fini',
      { x, t }
    );
  }
  
  if (typeof t !== 'number' || !isFinite(t)) {
    throw new PositionValidationError(
      'La coordonnée temporelle doit être un nombre fini',
      { x, t }
    );
  }
  
  if (t < 0) {
    throw new PositionValidationError(
      'La coordonnée temporelle ne peut pas être négative',
      { x, t }
    );
  }
}

/**
 * Valide qu'un référentiel source est compatible avec une position cible
 * @param {Object} sourceFrame - Référentiel source
 * @param {Object} targetPosition - Position cible
 * @param {number} targetPosition.x - Coordonnée spatiale cible
 * @param {number} targetPosition.t - Coordonnée temporelle cible
 * @throws {SourceFrameValidationError} Si la validation échoue
 */
export function validateSourceFrame(sourceFrame, { x, t }) {
  if (!sourceFrame) {
    return; // Pas de validation nécessaire pour l'origine
  }
  
  if (sourceFrame.x === undefined || sourceFrame.t === undefined) {
    throw new SourceFrameValidationError(
      'Le référentiel source doit avoir des coordonnées x et t définies',
      sourceFrame,
      { x, t }
    );
  }
  
  // Vérifier que le temps cible est postérieur au source
  if (t <= sourceFrame.t) {
    throw new SourceFrameValidationError(
      'La coordonnée temporelle doit être postérieure au référentiel source',
      sourceFrame,
      { x, t }
    );
  }
  
  // Vérifier que la position cible est dans le cône de lumière du source
  const deltaX = x - sourceFrame.x;
  const deltaT = t - sourceFrame.t;
  
  if (!isInsideLightCone(deltaX, deltaT, LIGHT_CONE_MARGIN)) {
    throw new SourceFrameValidationError(
      'La position cible doit être dans le cône de lumière du référentiel source',
      sourceFrame,
      { x, t }
    );
  }
}

/**
 * Valide les paramètres d'un calcul physique
 * @param {Object} params - Paramètres à valider
 * @param {number} params.deltaX - Déplacement spatial
 * @param {number} params.deltaT - Déplacement temporel
 * @param {number} [params.initialVelocity] - Vitesse initiale
 * @throws {PhysicsValidationError} Si les paramètres sont invalides
 */
export function validatePhysicsParameters({ deltaX, deltaT, initialVelocity }) {
  if (typeof deltaX !== 'number' || !isFinite(deltaX)) {
    throw new PhysicsValidationError(
      'Le déplacement spatial doit être un nombre fini',
      { deltaX, deltaT, initialVelocity }
    );
  }
  
  if (typeof deltaT !== 'number' || !isFinite(deltaT)) {
    throw new PhysicsValidationError(
      'Le déplacement temporel doit être un nombre fini',
      { deltaX, deltaT, initialVelocity }
    );
  }
  
  if (deltaT <= 0) {
    throw new PhysicsValidationError(
      'Le déplacement temporel doit être positif',
      { deltaX, deltaT, initialVelocity }
    );
  }
  
  if (initialVelocity !== undefined) {
    if (typeof initialVelocity !== 'number' || !isFinite(initialVelocity)) {
      throw new PhysicsValidationError(
        'La vitesse initiale doit être un nombre fini',
        { deltaX, deltaT, initialVelocity }
      );
    }
    
    if (Math.abs(initialVelocity) >= 1) {
      throw new PhysicsValidationError(
        'La vitesse initiale doit être inférieure à la vitesse de la lumière',
        { deltaX, deltaT, initialVelocity }
      );
    }
  }
}

/**
 * Valide une vitesse
 * @param {number} velocity - Vitesse à valider
 * @param {string} [name='velocity'] - Nom de la vitesse pour les messages d'erreur
 * @throws {PhysicsValidationError} Si la vitesse est invalide
 */
export function validateVelocity(velocity, name = 'velocity') {
  if (typeof velocity !== 'number' || !isFinite(velocity)) {
    throw new PhysicsValidationError(
      `${name} doit être un nombre fini`,
      { velocity, name }
    );
  }
  
  if (Math.abs(velocity) >= 1) {
    throw new PhysicsValidationError(
      `${name} doit être inférieure à la vitesse de la lumière`,
      { velocity, name }
    );
  }
}

/**
 * Valide une accélération
 * @param {number} acceleration - Accélération à valider
 * @throws {PhysicsValidationError} Si l'accélération est invalide
 */
export function validateAcceleration(acceleration) {
  if (typeof acceleration !== 'number' || !isFinite(acceleration)) {
    throw new PhysicsValidationError(
      'L\'accélération doit être un nombre fini',
      { acceleration }
    );
  }
  
  if (acceleration < 0) {
    throw new PhysicsValidationError(
      'L\'accélération propre doit être positive',
      { acceleration }
    );
  }
}

/**
 * Valide un temps propre
 * @param {number} properTime - Temps propre à valider
 * @throws {PhysicsValidationError} Si le temps propre est invalide
 */
export function validateProperTime(properTime) {
  if (typeof properTime !== 'number' || !isFinite(properTime)) {
    throw new PhysicsValidationError(
      'Le temps propre doit être un nombre fini',
      { properTime }
    );
  }
  
  if (properTime < 0) {
    throw new PhysicsValidationError(
      'Le temps propre ne peut pas être négatif',
      { properTime }
    );
  }
}

/**
 * Valide un facteur de Lorentz
 * @param {number} gamma - Facteur de Lorentz à valider
 * @throws {PhysicsValidationError} Si le facteur est invalide
 */
export function validateLorentzFactor(gamma) {
  if (typeof gamma !== 'number' || !isFinite(gamma)) {
    throw new PhysicsValidationError(
      'Le facteur de Lorentz doit être un nombre fini',
      { gamma }
    );
  }
  
  if (gamma < 1) {
    throw new PhysicsValidationError(
      'Le facteur de Lorentz doit être supérieur ou égal à 1',
      { gamma }
    );
  }
}

/**
 * Valide les paramètres d'un cône de lumière
 * @param {Object} coneParams - Paramètres du cône
 * @param {number} coneParams.originX - Position X de l'origine
 * @param {number} coneParams.originT - Position T de l'origine
 * @param {number} coneParams.radius - Rayon du cône (optionnel)
 * @throws {PhysicsValidationError} Si les paramètres sont invalides
 */
export function validateLightConeParameters({ originX, originT, radius }) {
  validatePosition({ x: originX, t: originT });
  
  if (radius !== undefined) {
    if (typeof radius !== 'number' || !isFinite(radius) || radius < 0) {
      throw new PhysicsValidationError(
        'Le rayon du cône doit être un nombre positif fini',
        { originX, originT, radius }
      );
    }
  }
}

/**
 * Valide les paramètres d'une isochrone
 * @param {Object} isochroneParams - Paramètres de l'isochrone
 * @param {number} isochroneParams.properTime - Temps propre
 * @param {number} isochroneParams.originX - Position X de l'origine
 * @param {number} isochroneParams.originT - Position T de l'origine
 * @throws {PhysicsValidationError} Si les paramètres sont invalides
 */
export function validateIsochroneParameters({ properTime, originX, originT }) {
  validateProperTime(properTime);
  validatePosition({ x: originX, t: originT });
}

/**
 * Valide un tableau de référentiels
 * @param {Array} frames - Tableau de référentiels
 * @throws {Error} Si le tableau est invalide
 */
export function validateReferenceFrameArray(frames) {
  if (!Array.isArray(frames)) {
    throw new Error('Les référentiels doivent être dans un tableau');
  }
  
  if (frames.length === 0) {
    throw new Error('Il doit y avoir au moins un référentiel (origine)');
  }
  
  // Vérifier que l'origine est au début
  const origin = frames[0];
  if (origin.sourceFrame !== null && origin.sourceFrame !== undefined) {
    throw new Error('Le premier référentiel doit être l\'origine (sans source)');
  }
  
  // Vérifier la cohérence des chaînes causales
  for (let i = 1; i < frames.length; i++) {
    const frame = frames[i];
    if (!frame.sourceFrame) {
      throw new Error(`Le référentiel ${i} doit avoir un référentiel source`);
    }
    
    const sourceIndex = frames.indexOf(frame.sourceFrame);
    if (sourceIndex === -1 || sourceIndex >= i) {
      throw new Error(`Le référentiel source du référentiel ${i} doit être défini avant lui`);
    }
  }
}

/**
 * Valide la cohérence physique d'un ensemble de calculs
 * @param {Object} physics - Résultats de calculs physiques
 * @param {number} physics.acceleration - Accélération
 * @param {number} physics.finalVelocity - Vitesse finale
 * @param {number} physics.properTime - Temps propre
 * @param {number} physics.coordinateTime - Temps coordonnée
 * @throws {PhysicsValidationError} Si les résultats sont incohérents
 */
export function validatePhysicsConsistency({ acceleration, finalVelocity, properTime, coordinateTime }) {
  validateAcceleration(acceleration);
  validateVelocity(finalVelocity, 'finalVelocity');
  validateProperTime(properTime);
  
  if (typeof coordinateTime !== 'number' || !isFinite(coordinateTime) || coordinateTime <= 0) {
    throw new PhysicsValidationError(
      'Le temps coordonnée doit être un nombre positif fini',
      { coordinateTime }
    );
  }
  
  // Le temps propre doit toujours être inférieur ou égal au temps coordonnée
  if (properTime > coordinateTime + 1e-10) { // Tolérance numérique
    throw new PhysicsValidationError(
      'Le temps propre ne peut pas être supérieur au temps coordonnée',
      { properTime, coordinateTime }
    );
  }
}

/**
 * Valide les paramètres de rendu
 * @param {Object} renderParams - Paramètres de rendu
 * @param {number} renderParams.canvasWidth - Largeur du canvas
 * @param {number} renderParams.canvasHeight - Hauteur du canvas
 * @param {number} renderParams.scale - Facteur d'échelle
 * @throws {Error} Si les paramètres sont invalides
 */
export function validateRenderParameters({ canvasWidth, canvasHeight, scale }) {
  if (typeof canvasWidth !== 'number' || canvasWidth <= 0 || !Number.isInteger(canvasWidth)) {
    throw new Error('La largeur du canvas doit être un entier positif');
  }
  
  if (typeof canvasHeight !== 'number' || canvasHeight <= 0 || !Number.isInteger(canvasHeight)) {
    throw new Error('La hauteur du canvas doit être un entier positif');
  }
  
  if (typeof scale !== 'number' || scale <= 0 || !isFinite(scale)) {
    throw new Error('L\'échelle doit être un nombre positif fini');
  }
} 