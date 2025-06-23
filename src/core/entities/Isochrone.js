/**
 * @fileoverview Classe Isochrone représentant une courbe de temps propre constant
 * @author Serge Fantino
 * @version 2.0.0
 */

import EventEmitter from 'eventemitter3';
import { validateIsochroneParameters } from '@utils/validation.js';
import { calculateIsochronePoints, calculateCoordinateTimeForIsochrone } from '@core/physics/trajectories.js';
import { MIN_PROPER_TIME, ISOCHRONE_HOVER_THRESHOLD } from '@core/physics/constants.js';

/**
 * Représente une isochrone (courbe de temps propre constant) dans l'espace-temps
 * @class Isochrone
 * @extends EventEmitter
 */
export class Isochrone extends EventEmitter {
  /**
   * Crée une nouvelle isochrone
   * @param {Object} params - Paramètres de l'isochrone
   * @param {number} params.properTime - Temps propre constant
   * @param {number} params.originX - Position X de l'origine
   * @param {number} params.originT - Position T de l'origine
   * @param {Object} [params.bounds] - Limites de calcul
   * @param {boolean} [params.visible=true] - Visibilité de l'isochrone
   * @param {string} [params.color='blue'] - Couleur de l'isochrone
   * @param {number} [params.id] - Identifiant unique
   */
  constructor({
    properTime,
    originX,
    originT,
    bounds = null,
    visible = true,
    color = 'blue',
    id = null
  }) {
    super();
    
    // Validation des paramètres
    validateIsochroneParameters({ properTime, originX, originT });
    
    /**
     * Identifiant unique de l'isochrone
     * @type {number}
     * @readonly
     */
    this.id = id ?? Isochrone.generateId();
    
    /**
     * Temps propre constant
     * @type {number}
     * @private
     */
    this._properTime = properTime;
    
    /**
     * Position X de l'origine
     * @type {number}
     * @private
     */
    this._originX = originX;
    
    /**
     * Position T de l'origine
     * @type {number}
     * @private
     */
    this._originT = originT;
    
    /**
     * Limites de calcul
     * @type {Object|null}
     * @private
     */
    this._bounds = bounds;
    
    /**
     * Visibilité de l'isochrone
     * @type {boolean}
     * @private
     */
    this._visible = visible;
    
    /**
     * Couleur de l'isochrone
     * @type {string}
     * @private
     */
    this._color = color;
    
    /**
     * Cache pour les points calculés
     * @type {Object|null}
     * @private
     */
    this._pointsCache = null;
    
    /**
     * Métadonnées de l'isochrone
     * @type {Object}
     */
    this.metadata = {};
    
    // Émettre l'événement de création
    this.emit('created', this);
  }
  
  /**
   * Temps propre (getter)
   * @type {number}
   */
  get properTime() {
    return this._properTime;
  }
  
  /**
   * Temps propre (setter)
   * @type {number}
   */
  set properTime(value) {
    if (typeof value !== 'number' || !isFinite(value) || value < 0) {
      throw new Error('Le temps propre doit être un nombre positif fini');
    }
    
    const oldValue = this._properTime;
    this._properTime = value;
    this._invalidateCache();
    this.emit('properTimeChanged', { old: oldValue, new: value });
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
   * Visibilité (getter)
   * @type {boolean}
   */
  get visible() {
    return this._visible;
  }
  
  /**
   * Visibilité (setter)
   * @type {boolean}
   */
  set visible(value) {
    if (typeof value !== 'boolean') {
      throw new Error('La visibilité doit être un booléen');
    }
    
    const oldValue = this._visible;
    this._visible = value;
    this.emit('visibilityChanged', { old: oldValue, new: value });
  }
  
  /**
   * Couleur (getter)
   * @type {string}
   */
  get color() {
    return this._color;
  }
  
  /**
   * Couleur (setter)
   * @type {string}
   */
  set color(value) {
    if (typeof value !== 'string') {
      throw new Error('La couleur doit être une chaîne');
    }
    
    const oldValue = this._color;
    this._color = value;
    this.emit('colorChanged', { old: oldValue, new: value });
  }
  
  /**
   * Limites de calcul (getter)
   * @type {Object|null}
   */
  get bounds() {
    return this._bounds;
  }
  
  /**
   * Limites de calcul (setter)
   * @type {Object|null}
   */
  set bounds(value) {
    if (value !== null && (typeof value !== 'object' || 
        typeof value.minX !== 'number' || typeof value.maxX !== 'number' || 
        typeof value.maxT !== 'number')) {
      throw new Error('Les limites doivent avoir les propriétés minX, maxX, maxT');
    }
    
    const oldValue = this._bounds;
    this._bounds = value;
    this._invalidateCache();
    this.emit('boundsChanged', { old: oldValue, new: value });
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
    validateIsochroneParameters({ properTime: this._properTime, originX: x, originT: t });
    
    const oldOrigin = { x: this._originX, t: this._originT };
    this._originX = x;
    this._originT = t;
    this._invalidateCache();
    
    this.emit('originChanged', { old: oldOrigin, new: { x, t } });
  }
  
  /**
   * Vérifie si l'isochrone est valide (temps propre suffisant)
   * @returns {boolean} True si l'isochrone est valide
   */
  isValid() {
    return this._properTime >= MIN_PROPER_TIME;
  }
  
  /**
   * Calcule les points de l'isochrone
   * @param {Object} [customBounds] - Limites personnalisées
   * @returns {Array<Object>} Points de l'isochrone {x, t}
   */
  calculatePoints(customBounds = null) {
    const bounds = customBounds || this._bounds;
    
    if (!bounds) {
      throw new Error('Les limites de calcul doivent être définies');
    }
    
    // Vérifier le cache
    const cacheKey = JSON.stringify({ bounds, properTime: this._properTime, origin: { x: this._originX, t: this._originT } });
    if (this._pointsCache && this._pointsCache.key === cacheKey) {
      return this._pointsCache.points;
    }
    
    // Calculer les points
    const points = calculateIsochronePoints({
      originX: this._originX,
      originT: this._originT,
      properTime: this._properTime,
      bounds
    });
    
    // Mettre en cache
    this._pointsCache = {
      key: cacheKey,
      points
    };
    
    return points;
  }
  
  /**
   * Trouve le point le plus proche d'une position donnée
   * @param {number} x - Position X
   * @param {number} t - Position T
   * @param {number} [maxDistance=ISOCHRONE_HOVER_THRESHOLD] - Distance maximale
   * @returns {Object|null} Point le plus proche ou null
   */
  findNearestPoint(x, t, maxDistance = ISOCHRONE_HOVER_THRESHOLD) {
    if (!this._bounds) {
      return null;
    }
    
    const points = this.calculatePoints();
    let nearestPoint = null;
    let minDistance = Infinity;
    
    for (const point of points) {
      const distance = Math.sqrt(
        Math.pow(point.x - x, 2) + Math.pow(point.t - t, 2)
      );
      
      if (distance < minDistance && distance <= maxDistance) {
        minDistance = distance;
        nearestPoint = { ...point, distance };
      }
    }
    
    return nearestPoint;
  }
  
  /**
   * Calcule le temps coordonnée pour une position X donnée
   * @param {number} x - Position X
   * @returns {number|null} Temps coordonnée ou null si impossible
   */
  getCoordinateTimeAtPosition(x) {
    try {
      return calculateCoordinateTimeForIsochrone(
        this._originX,
        this._originT,
        x,
        this._properTime
      );
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Vérifie si un point est sur l'isochrone
   * @param {number} x - Position X
   * @param {number} t - Position T
   * @param {number} [tolerance=1] - Tolérance
   * @returns {boolean} True si le point est sur l'isochrone
   */
  containsPoint(x, t, tolerance = 1) {
    const expectedT = this.getCoordinateTimeAtPosition(x);
    if (expectedT === null) {
      return false;
    }
    
    return Math.abs(t - expectedT) <= tolerance;
  }
  
  /**
   * Calcule l'intersection avec une autre isochrone
   * @param {Isochrone} otherIsochrone - Autre isochrone
   * @returns {Array<Object>} Points d'intersection
   */
  intersectWith(otherIsochrone) {
    if (!(otherIsochrone instanceof Isochrone)) {
      throw new Error('Le paramètre doit être une Isochrone');
    }
    
    if (!this._bounds || !otherIsochrone.bounds) {
      return [];
    }
    
    const points1 = this.calculatePoints();
    const points2 = otherIsochrone.calculatePoints();
    const intersections = [];
    
    // Recherche des intersections par proximité
    for (const point1 of points1) {
      for (const point2 of points2) {
        const distance = Math.sqrt(
          Math.pow(point1.x - point2.x, 2) + 
          Math.pow(point1.t - point2.t, 2)
        );
        
        if (distance <= 2) { // Seuil d'intersection
          intersections.push({
            x: (point1.x + point2.x) / 2,
            t: (point1.t + point2.t) / 2,
            distance
          });
        }
      }
    }
    
    // Éliminer les doublons
    const uniqueIntersections = [];
    for (const intersection of intersections) {
      const isDuplicate = uniqueIntersections.some(existing => 
        Math.abs(existing.x - intersection.x) < 1 && 
        Math.abs(existing.t - intersection.t) < 1
      );
      
      if (!isDuplicate) {
        uniqueIntersections.push(intersection);
      }
    }
    
    return uniqueIntersections.slice(0, 5); // Maximum 5 intersections
  }
  
  /**
   * Clone cette isochrone
   * @param {Object} [overrides] - Propriétés à surcharger
   * @returns {Isochrone} Nouvelle isochrone clonée
   */
  clone(overrides = {}) {
    return new Isochrone({
      properTime: overrides.properTime ?? this._properTime,
      originX: overrides.originX ?? this._originX,
      originT: overrides.originT ?? this._originT,
      bounds: overrides.bounds ?? this._bounds,
      visible: overrides.visible ?? this._visible,
      color: overrides.color ?? this._color,
      ...overrides
    });
  }
  
  /**
   * Sérialise l'isochrone
   * @returns {Object} Données sérialisées
   */
  serialize() {
    return {
      id: this.id,
      properTime: this._properTime,
      originX: this._originX,
      originT: this._originT,
      bounds: this._bounds,
      visible: this._visible,
      color: this._color,
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
   * Représentation string de l'isochrone
   * @returns {string} Représentation textuelle
   */
  toString() {
    const visibility = this._visible ? 'visible' : 'hidden';
    return `Isochrone(id=${this.id}, τ=${this._properTime}, origin=(${this._originX},${this._originT}), ${visibility})`;
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
    return ++Isochrone._idCounter;
  }
  
  /**
   * Crée une isochrone depuis un référentiel
   * @param {Object} referenceFrame - Référentiel source
   * @param {number} properTime - Temps propre
   * @param {Object} [options] - Options supplémentaires
   * @returns {Isochrone} Nouvelle isochrone
   * @static
   */
  static fromReferenceFrame(referenceFrame, properTime, options = {}) {
    return new Isochrone({
      properTime,
      originX: referenceFrame.x,
      originT: referenceFrame.t,
      ...options
    });
  }
  
  /**
   * Désérialise une isochrone depuis des données
   * @param {Object} data - Données sérialisées
   * @returns {Isochrone} Isochrone désérialisée
   * @static
   */
  static deserialize(data) {
    const isochrone = new Isochrone({
      properTime: data.properTime,
      originX: data.originX,
      originT: data.originT,
      bounds: data.bounds,
      visible: data.visible,
      color: data.color,
      id: data.id
    });
    
    isochrone.metadata = { ...data.metadata };
    
    // Mettre à jour le compteur d'ID si nécessaire
    if (data.id >= Isochrone._idCounter) {
      Isochrone._idCounter = data.id;
    }
    
    return isochrone;
  }
  
  /**
   * Crée une série d'isochrones régulièrement espacées
   * @param {Object} params - Paramètres de la série
   * @param {number} params.originX - Position X de l'origine
   * @param {number} params.originT - Position T de l'origine
   * @param {number} params.minProperTime - Temps propre minimum
   * @param {number} params.maxProperTime - Temps propre maximum
   * @param {number} params.count - Nombre d'isochrones
   * @param {Object} params.bounds - Limites de calcul
   * @param {Object} [options] - Options supplémentaires
   * @returns {Array<Isochrone>} Série d'isochrones
   * @static
   */
  static createSeries({
    originX,
    originT,
    minProperTime,
    maxProperTime,
    count,
    bounds
  }, options = {}) {
    if (count <= 0) {
      throw new Error('Le nombre d\'isochrones doit être positif');
    }
    
    if (minProperTime >= maxProperTime) {
      throw new Error('Le temps propre minimum doit être inférieur au maximum');
    }
    
    const series = [];
    const step = (maxProperTime - minProperTime) / (count - 1);
    
    for (let i = 0; i < count; i++) {
      const properTime = minProperTime + step * i;
      const color = options.colorFunction ? 
        options.colorFunction(i, count) : 
        `hsl(${(i / count) * 360}, 70%, 50%)`;
      
      series.push(new Isochrone({
        properTime,
        originX,
        originT,
        bounds,
        color,
        ...options
      }));
    }
    
    return series;
  }
} 