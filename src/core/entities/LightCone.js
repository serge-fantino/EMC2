/**
 * @fileoverview Classe LightCone représentant un cône de lumière dans l'espace-temps
 * @author Serge Fantino
 * @version 2.0.0
 */

import EventEmitter from 'eventemitter3';
import { validateLightConeParameters } from '@utils/validation.js';
import { isInsideLightCone, calculateVelocityRatio } from '@core/physics/relativity.js';
import { SPEED_OF_LIGHT, LIGHT_CONE_MARGIN } from '@core/physics/constants.js';

/**
 * Représente un cône de lumière dans l'espace-temps de Minkowski
 * @class LightCone
 * @extends EventEmitter
 */
export class LightCone extends EventEmitter {
  /**
   * Crée un nouveau cône de lumière
   * @param {Object} params - Paramètres du cône
   * @param {number} params.originX - Position X de l'origine
   * @param {number} params.originT - Position T de l'origine
   * @param {number} [params.maxRadius] - Rayon maximal (optionnel)
   * @param {boolean} [params.showPastCone=false] - Afficher le cône passé
   * @param {number} [params.id] - Identifiant unique
   */
  constructor({
    originX,
    originT,
    maxRadius = null,
    showPastCone = false,
    id = null
  }) {
    super();
    
    // Validation des paramètres
    validateLightConeParameters({ originX, originT, radius: maxRadius });
    
    /**
     * Identifiant unique du cône
     * @type {number}
     * @readonly
     */
    this.id = id ?? LightCone.generateId();
    
    /**
     * Position X de l'origine du cône
     * @type {number}
     * @private
     */
    this._originX = originX;
    
    /**
     * Position T de l'origine du cône
     * @type {number}
     * @private
     */
    this._originT = originT;
    
    /**
     * Rayon maximal du cône (null = illimité)
     * @type {number|null}
     * @private
     */
    this._maxRadius = maxRadius;
    
    /**
     * Afficher le cône passé
     * @type {boolean}
     * @private
     */
    this._showPastCone = showPastCone;
    
    /**
     * Cache pour les calculs de points
     * @type {Object|null}
     * @private
     */
    this._pointsCache = null;
    
    /**
     * Métadonnées du cône
     * @type {Object}
     */
    this.metadata = {};
    
    // Émettre l'événement de création
    this.emit('created', this);
  }
  
  /**
   * Position X de l'origine (getter)
   * @type {number}
   */
  get originX() {
    return this._originX;
  }
  
  /**
   * Position X de l'origine (setter)
   * @type {number}
   */
  set originX(value) {
    if (typeof value !== 'number' || !isFinite(value)) {
      throw new Error('La position X doit être un nombre fini');
    }
    
    const oldValue = this._originX;
    this._originX = value;
    this._invalidateCache();
    this.emit('originChanged', { old: { x: oldValue, t: this._originT }, new: { x: value, t: this._originT } });
  }
  
  /**
   * Position T de l'origine (getter)
   * @type {number}
   */
  get originT() {
    return this._originT;
  }
  
  /**
   * Position T de l'origine (setter)
   * @type {number}
   */
  set originT(value) {
    if (typeof value !== 'number' || !isFinite(value)) {
      throw new Error('La position T doit être un nombre fini');
    }
    
    const oldValue = this._originT;
    this._originT = value;
    this._invalidateCache();
    this.emit('originChanged', { old: { x: this._originX, t: oldValue }, new: { x: this._originX, t: value } });
  }
  
  /**
   * Rayon maximal (getter)
   * @type {number|null}
   */
  get maxRadius() {
    return this._maxRadius;
  }
  
  /**
   * Rayon maximal (setter)
   * @type {number|null}
   */
  set maxRadius(value) {
    if (value !== null && (typeof value !== 'number' || !isFinite(value) || value < 0)) {
      throw new Error('Le rayon maximal doit être un nombre positif fini ou null');
    }
    
    const oldValue = this._maxRadius;
    this._maxRadius = value;
    this._invalidateCache();
    this.emit('radiusChanged', { old: oldValue, new: value });
  }
  
  /**
   * Affichage du cône passé (getter)
   * @type {boolean}
   */
  get showPastCone() {
    return this._showPastCone;
  }
  
  /**
   * Affichage du cône passé (setter)
   * @type {boolean}
   */
  set showPastCone(value) {
    if (typeof value !== 'boolean') {
      throw new Error('showPastCone doit être un booléen');
    }
    
    const oldValue = this._showPastCone;
    this._showPastCone = value;
    this.emit('visibilityChanged', { old: oldValue, new: value });
  }
  
  /**
   * Obtient la position de l'origine
   * @returns {Object} Position {x, t}
   */
  getOrigin() {
    return { x: this._originX, t: this._originT };
  }
  
  /**
   * Définit une nouvelle origine
   * @param {Object} origin - Nouvelle origine
   * @param {number} origin.x - Position X
   * @param {number} origin.t - Position T
   */
  setOrigin({ x, t }) {
    validateLightConeParameters({ originX: x, originT: t });
    
    const oldOrigin = { x: this._originX, t: this._originT };
    this._originX = x;
    this._originT = t;
    this._invalidateCache();
    
    this.emit('originChanged', { old: oldOrigin, new: { x, t } });
  }
  
  /**
   * Vérifie si un point est à l'intérieur du cône de lumière
   * @param {number} x - Position X du point
   * @param {number} t - Position T du point
   * @param {number} [margin=0] - Marge de sécurité
   * @returns {boolean} True si le point est dans le cône
   */
  containsPoint(x, t, margin = 0) {
    const deltaX = x - this._originX;
    const deltaT = t - this._originT;
    
    // Vérifier le cône futur
    if (deltaT > 0) {
      const inFutureCone = isInsideLightCone(deltaX, deltaT, margin);
      if (this._maxRadius !== null) {
        const distance = Math.sqrt(deltaX * deltaX + deltaT * deltaT);
        return inFutureCone && distance <= this._maxRadius;
      }
      return inFutureCone;
    }
    
    // Vérifier le cône passé si activé
    if (this._showPastCone && deltaT < 0) {
      const inPastCone = isInsideLightCone(deltaX, -deltaT, margin);
      if (this._maxRadius !== null) {
        const distance = Math.sqrt(deltaX * deltaX + deltaT * deltaT);
        return inPastCone && distance <= this._maxRadius;
      }
      return inPastCone;
    }
    
    return false;
  }
  
  /**
   * Calcule la vitesse relative nécessaire pour atteindre un point
   * @param {number} x - Position X du point
   * @param {number} t - Position T du point
   * @returns {number} Vitesse relative (v/c)
   */
  getVelocityRatioToPoint(x, t) {
    const deltaX = x - this._originX;
    const deltaT = t - this._originT;
    
    return calculateVelocityRatio(deltaX, deltaT);
  }
  
  /**
   * Obtient la frontière du cône pour un temps donné
   * @param {number} t - Temps coordonnée
   * @returns {Object|null} Frontière {xMin, xMax} ou null si hors limites
   */
  getBoundaryAtTime(t) {
    const deltaT = t - this._originT;
    
    if (deltaT === 0) {
      return { xMin: this._originX, xMax: this._originX };
    }
    
    // Vérifier si on doit afficher ce temps
    if (deltaT > 0 || (deltaT < 0 && this._showPastCone)) {
      const radius = SPEED_OF_LIGHT * Math.abs(deltaT);
      
      // Appliquer la limite de rayon si définie
      const effectiveRadius = this._maxRadius !== null 
        ? Math.min(radius, this._maxRadius) 
        : radius;
      
      return {
        xMin: this._originX - effectiveRadius,
        xMax: this._originX + effectiveRadius
      };
    }
    
    return null;
  }
  
  /**
   * Génère les points de la frontière du cône
   * @param {Object} bounds - Limites de génération
   * @param {number} bounds.minT - Temps minimum
   * @param {number} bounds.maxT - Temps maximum
   * @param {number} [points=100] - Nombre de points à générer
   * @returns {Array<Object>} Points de la frontière {x, t}
   */
  generateBoundaryPoints({ minT, maxT, points = 100 }) {
    if (this._pointsCache && 
        this._pointsCache.bounds.minT === minT && 
        this._pointsCache.bounds.maxT === maxT &&
        this._pointsCache.points === points) {
      return this._pointsCache.boundaryPoints;
    }
    
    const boundaryPoints = [];
    
    for (let i = 0; i <= points; i++) {
      const t = minT + (maxT - minT) * (i / points);
      const boundary = this.getBoundaryAtTime(t);
      
      if (boundary) {
        // Ajouter les points de frontière gauche et droite
        boundaryPoints.push(
          { x: boundary.xMin, t },
          { x: boundary.xMax, t }
        );
      }
    }
    
    // Mettre en cache
    this._pointsCache = {
      bounds: { minT, maxT },
      points,
      boundaryPoints
    };
    
    return boundaryPoints;
  }
  
  /**
   * Calcule l'intersection avec un autre cône de lumière
   * @param {LightCone} otherCone - Autre cône de lumière
   * @returns {Array<Object>} Points d'intersection
   */
  intersectWith(otherCone) {
    if (!(otherCone instanceof LightCone)) {
      throw new Error('Le paramètre doit être un LightCone');
    }
    
    const intersections = [];
    
    // Calcul des intersections entre les frontières
    // Implémentation simplifiée pour les cônes symétriques
    const deltaX = otherCone.originX - this._originX;
    const deltaT = otherCone.originT - this._originT;
    
    if (deltaT === 0) {
      // Cônes simultanés - pas d'intersection causale
      return intersections;
    }
    
    // Points d'intersection des frontières
    const c = SPEED_OF_LIGHT;
    const discriminant = deltaT * deltaT - deltaX * deltaX / (c * c);
    
    if (discriminant >= 0) {
      const sqrtDiscriminant = Math.sqrt(discriminant);
      const t1 = this._originT + deltaT / 2 + sqrtDiscriminant / 2;
      const t2 = this._originT + deltaT / 2 - sqrtDiscriminant / 2;
      
      [t1, t2].forEach(t => {
        if (t > Math.max(this._originT, otherCone.originT)) {
          const x = this._originX + c * (t - this._originT);
          intersections.push({ x, t });
          intersections.push({ x: this._originX - c * (t - this._originT), t });
        }
      });
    }
    
    return intersections;
  }
  
  /**
   * Clone ce cône de lumière
   * @param {Object} [overrides] - Propriétés à surcharger
   * @returns {LightCone} Nouveau cône cloné
   */
  clone(overrides = {}) {
    return new LightCone({
      originX: overrides.originX ?? this._originX,
      originT: overrides.originT ?? this._originT,
      maxRadius: overrides.maxRadius ?? this._maxRadius,
      showPastCone: overrides.showPastCone ?? this._showPastCone,
      ...overrides
    });
  }
  
  /**
   * Sérialise le cône de lumière
   * @returns {Object} Données sérialisées
   */
  serialize() {
    return {
      id: this.id,
      originX: this._originX,
      originT: this._originT,
      maxRadius: this._maxRadius,
      showPastCone: this._showPastCone,
      metadata: { ...this.metadata }
    };
  }
  
  /**
   * Invalide le cache des points
   * @private
   */
  _invalidateCache() {
    this._pointsCache = null;
  }
  
  /**
   * Représentation string du cône
   * @returns {string} Représentation textuelle
   */
  toString() {
    const radius = this._maxRadius !== null ? `r=${this._maxRadius}` : 'r=∞';
    const past = this._showPastCone ? '+past' : '';
    return `LightCone(id=${this.id}, origin=(${this._originX},${this._originT}), ${radius}${past})`;
  }
  
  /**
   * Générateur d'identifiants uniques
   * @private
   * @static
   */
  static _idCounter = 0;
  
  /**
   * Génère un nouvel identifiant unique
   * @returns {number} Identifiant unique
   * @static
   */
  static generateId() {
    return ++LightCone._idCounter;
  }
  
  /**
   * Crée un cône de lumière depuis un référentiel
   * @param {Object} referenceFrame - Référentiel source
   * @param {Object} [options] - Options supplémentaires
   * @returns {LightCone} Nouveau cône de lumière
   * @static
   */
  static fromReferenceFrame(referenceFrame, options = {}) {
    return new LightCone({
      originX: referenceFrame.x,
      originT: referenceFrame.t,
      ...options
    });
  }
  
  /**
   * Désérialise un cône de lumière depuis des données
   * @param {Object} data - Données sérialisées
   * @returns {LightCone} Cône désérialisé
   * @static
   */
  static deserialize(data) {
    const cone = new LightCone({
      originX: data.originX,
      originT: data.originT,
      maxRadius: data.maxRadius,
      showPastCone: data.showPastCone,
      id: data.id
    });
    
    cone.metadata = { ...data.metadata };
    
    // Mettre à jour le compteur d'ID si nécessaire
    if (data.id >= LightCone._idCounter) {
      LightCone._idCounter = data.id;
    }
    
    return cone;
  }
  
  /**
   * Calcule l'union de plusieurs cônes de lumière
   * @param {Array<LightCone>} cones - Cônes à unir
   * @returns {Object} Données de l'union
   * @static
   */
  static union(cones) {
    if (!Array.isArray(cones) || cones.length === 0) {
      throw new Error('Il faut au moins un cône pour calculer l\'union');
    }
    
    // Calculer les limites englobantes
    let minX = Infinity, maxX = -Infinity;
    let minT = Infinity, maxT = -Infinity;
    
    cones.forEach(cone => {
      minX = Math.min(minX, cone.originX);
      maxX = Math.max(maxX, cone.originX);
      minT = Math.min(minT, cone.originT);
      maxT = Math.max(maxT, cone.originT);
    });
    
    return {
      bounds: { minX, maxX, minT, maxT },
      cones: cones.slice(), // Copie des cônes
      count: cones.length
    };
  }
} 