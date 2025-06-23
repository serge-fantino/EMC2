/**
 * @fileoverview Service PhysicsCalculator pour orchestrer les calculs physiques
 * @author Serge Fantino
 * @version 2.0.0
 */

import EventEmitter from 'eventemitter3';
import { calculateSegmentPhysics } from '@core/physics/relativity.js';
import { calculateCumulativeTrajectory } from '@core/physics/trajectories.js';
import { validateReferenceFrameArray, validatePhysicsConsistency } from '@utils/validation.js';

/**
 * Service orchestrant tous les calculs physiques de l'application
 * @class PhysicsCalculator
 * @extends EventEmitter
 */
export class PhysicsCalculator extends EventEmitter {
  /**
   * Crée un nouveau calculateur physique
   * @param {Object} [options] - Options de configuration
   * @param {boolean} [options.enableCache=true] - Activer le cache des calculs
   * @param {boolean} [options.validateResults=true] - Valider les résultats
   */
  constructor(options = {}) {
    super();
    
    /**
     * Options de configuration
     * @type {Object}
     * @private
     */
    this._options = {
      enableCache: true,
      validateResults: true,
      ...options
    };
    
    /**
     * Cache des calculs
     * @type {Map}
     * @private
     */
    this._cache = new Map();
    
    /**
     * Statistiques des calculs
     * @type {Object}
     * @private
     */
    this._stats = {
      calculations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0
    };
  }
  
  /**
   * Calcule la physique pour un segment entre deux référentiels
   * @param {Object} sourceFrame - Référentiel source
   * @param {Object} targetFrame - Référentiel cible
   * @param {Object} [options] - Options de calcul
   * @returns {Object} Résultats physiques du segment
   */
  calculateSegmentPhysics(sourceFrame, targetFrame, options = {}) {
    try {
      const cacheKey = this._generateCacheKey('segment', sourceFrame, targetFrame, options);
      
      // Vérifier le cache
      if (this._options.enableCache && this._cache.has(cacheKey)) {
        this._stats.cacheHits++;
        return this._cache.get(cacheKey);
      }
      
      this._stats.cacheMisses++;
      
      // Calculer les paramètres du segment
      const deltaX = targetFrame.x - sourceFrame.x;
      const deltaT = targetFrame.t - sourceFrame.t;
      const initialVelocity = options.initialVelocity || 0;
      
      // Effectuer les calculs
      const physics = calculateSegmentPhysics({
        deltaX,
        deltaT,
        initialVelocity
      });
      
      // Ajouter des métadonnées
      const result = {
        ...physics,
        sourceFrame: { x: sourceFrame.x, t: sourceFrame.t },
        targetFrame: { x: targetFrame.x, t: targetFrame.t },
        segment: { deltaX, deltaT },
        metadata: {
          calculatedAt: Date.now(),
          options: { ...options }
        }
      };
      
      // Valider si activé
      if (this._options.validateResults) {
        this._validateSegmentResult(result);
      }
      
      // Mettre en cache
      if (this._options.enableCache) {
        this._cache.set(cacheKey, result);
      }
      
      this._stats.calculations++;
      this.emit('segmentCalculated', result);
      
      return result;
      
    } catch (error) {
      this._stats.errors++;
      this.emit('calculationError', { type: 'segment', error, sourceFrame, targetFrame });
      throw error;
    }
  }
  
  /**
   * Calcule la physique cumulative pour une chaîne de référentiels
   * @param {Array<Object>} referenceFrames - Chaîne de référentiels
   * @param {Object} [options] - Options de calcul
   * @returns {Object} Résultats physiques cumulatifs
   */
  calculateCumulative(referenceFrames, options = {}) {
    try {
      validateReferenceFrameArray(referenceFrames);
      
      const cacheKey = this._generateCacheKey('cumulative', referenceFrames, options);
      
      // Vérifier le cache
      if (this._options.enableCache && this._cache.has(cacheKey)) {
        this._stats.cacheHits++;
        return this._cache.get(cacheKey);
      }
      
      this._stats.cacheMisses++;
      
      // Calculer la trajectoire cumulative
      const trajectory = calculateCumulativeTrajectory(referenceFrames);
      
      // Enrichir avec des analyses supplémentaires
      const result = {
        ...trajectory,
        analysis: this._analyzeTrajectory(trajectory),
        referenceFrames: referenceFrames.slice(), // Copie
        metadata: {
          calculatedAt: Date.now(),
          frameCount: referenceFrames.length,
          options: { ...options }
        }
      };
      
      // Valider si activé
      if (this._options.validateResults) {
        this._validateCumulativeResult(result);
      }
      
      // Mettre en cache
      if (this._options.enableCache) {
        this._cache.set(cacheKey, result);
      }
      
      this._stats.calculations++;
      this.emit('cumulativeCalculated', result);
      
      return result;
      
    } catch (error) {
      this._stats.errors++;
      this.emit('calculationError', { type: 'cumulative', error, referenceFrames });
      throw error;
    }
  }
  
  /**
   * Calcule les isochrones pour un référentiel donné
   * @param {Object} originFrame - Référentiel d'origine
   * @param {Array<number>} properTimes - Temps propres à calculer
   * @param {Object} bounds - Limites de calcul
   * @param {Object} [options] - Options de calcul
   * @returns {Array<Object>} Données des isochrones
   */
  calculateIsochrones(originFrame, properTimes, bounds, options = {}) {
    try {
      const cacheKey = this._generateCacheKey('isochrones', originFrame, properTimes, bounds, options);
      
      // Vérifier le cache
      if (this._options.enableCache && this._cache.has(cacheKey)) {
        this._stats.cacheHits++;
        return this._cache.get(cacheKey);
      }
      
      this._stats.cacheMisses++;
      
      const isochrones = [];
      
      for (const properTime of properTimes) {
        const isochroneData = {
          properTime,
          originX: originFrame.x,
          originT: originFrame.t,
          bounds,
          points: [], // Sera calculé par la classe Isochrone
          metadata: {
            calculatedAt: Date.now(),
            pointCount: 0
          }
        };
        
        isochrones.push(isochroneData);
      }
      
      const result = {
        isochrones,
        origin: { x: originFrame.x, t: originFrame.t },
        bounds,
        count: properTimes.length,
        metadata: {
          calculatedAt: Date.now(),
          options: { ...options }
        }
      };
      
      // Mettre en cache
      if (this._options.enableCache) {
        this._cache.set(cacheKey, result);
      }
      
      this._stats.calculations++;
      this.emit('isochronesCalculated', result);
      
      return result;
      
    } catch (error) {
      this._stats.errors++;
      this.emit('calculationError', { type: 'isochrones', error, originFrame, properTimes });
      throw error;
    }
  }
  
  /**
   * Analyse une trajectoire pour extraire des informations utiles
   * @param {Object} trajectory - Trajectoire à analyser
   * @returns {Object} Analyse de la trajectoire
   * @private
   */
  _analyzeTrajectory(trajectory) {
    const { segments, totalPhysics } = trajectory;
    
    // Analyser les segments
    const segmentAnalysis = segments.map((segment, index) => ({
      index,
      distance: Math.abs(segment.physics.deltaX),
      duration: segment.physics.deltaT,
      acceleration: segment.physics.acceleration,
      velocityChange: Math.abs(
        segment.physics.finalCumulativeVelocity - 
        segment.physics.initialCumulativeVelocity
      ),
      efficiency: segment.physics.properTime / segment.physics.deltaT
    }));
    
    // Statistiques globales
    const totalDistance = segmentAnalysis.reduce((sum, seg) => sum + seg.distance, 0);
    const maxAcceleration = Math.max(...segmentAnalysis.map(seg => seg.acceleration));
    const avgEfficiency = segmentAnalysis.reduce((sum, seg) => sum + seg.efficiency, 0) / segments.length;
    
    // Classification du voyage
    const journeyType = this._classifyJourney(totalPhysics, segmentAnalysis);
    
    return {
      segments: segmentAnalysis,
      global: {
        totalDistance,
        maxAcceleration,
        avgEfficiency,
        journeyType,
        relativistic: Math.abs(totalPhysics.finalVelocity) > 0.1, // > 10% de c
        timeDilationSignificant: totalPhysics.timeDilationPercentage > 1 // > 1%
      }
    };
  }
  
  /**
   * Classifie le type de voyage basé sur la physique
   * @param {Object} totalPhysics - Physique totale
   * @param {Array<Object>} segmentAnalysis - Analyse des segments
   * @returns {string} Type de voyage
   * @private
   */
  _classifyJourney(totalPhysics, segmentAnalysis) {
    const { finalVelocity, timeDilationPercentage } = totalPhysics;
    const maxAccel = Math.max(...segmentAnalysis.map(seg => seg.acceleration));
    
    if (Math.abs(finalVelocity) < 0.01 && maxAccel < 0.001) {
      return 'stationary'; // Quasi-stationnaire
    }
    
    if (timeDilationPercentage > 10) {
      return 'highly_relativistic'; // Très relativiste
    }
    
    if (timeDilationPercentage > 1) {
      return 'relativistic'; // Relativiste
    }
    
    if (Math.abs(finalVelocity) > 0.1) {
      return 'high_speed'; // Haute vitesse
    }
    
    return 'classical'; // Classique
  }
  
  /**
   * Valide les résultats d'un calcul de segment
   * @param {Object} result - Résultat à valider
   * @private
   */
  _validateSegmentResult(result) {
    validatePhysicsConsistency({
      acceleration: result.acceleration,
      finalVelocity: result.finalVelocity,
      properTime: result.properTime,
      coordinateTime: result.coordinateTime
    });
  }
  
  /**
   * Valide les résultats d'un calcul cumulatif
   * @param {Object} result - Résultat à valider
   * @private
   */
  _validateCumulativeResult(result) {
    const { totalPhysics } = result;
    
    if (totalPhysics.totalProperTime > totalPhysics.totalCoordinateTime + 1e-10) {
      throw new Error('Le temps propre total ne peut pas dépasser le temps coordonnée total');
    }
    
    if (Math.abs(totalPhysics.finalVelocity) >= 1) {
      throw new Error('La vitesse finale ne peut pas atteindre ou dépasser c');
    }
  }
  
  /**
   * Génère une clé de cache pour les calculs
   * @param {string} type - Type de calcul
   * @param {...any} params - Paramètres du calcul
   * @returns {string} Clé de cache
   * @private
   */
  _generateCacheKey(type, ...params) {
    const serialized = params.map(param => {
      if (typeof param === 'object' && param !== null) {
        return JSON.stringify(param);
      }
      return String(param);
    }).join('|');
    
    return `${type}:${serialized}`;
  }
  
  /**
   * Vide le cache des calculs
   */
  clearCache() {
    const oldSize = this._cache.size;
    this._cache.clear();
    this.emit('cacheCleared', { oldSize });
  }
  
  /**
   * Obtient les statistiques des calculs
   * @returns {Object} Statistiques
   */
  getStats() {
    return {
      ...this._stats,
      cacheSize: this._cache.size,
      hitRate: this._stats.cacheHits / (this._stats.cacheHits + this._stats.cacheMisses) || 0
    };
  }
  
  /**
   * Réinitialise les statistiques
   */
  resetStats() {
    this._stats = {
      calculations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0
    };
    this.emit('statsReset');
  }
  
  /**
   * Active ou désactive le cache
   * @param {boolean} enabled - État du cache
   */
  setCacheEnabled(enabled) {
    const wasEnabled = this._options.enableCache;
    this._options.enableCache = enabled;
    
    if (!enabled) {
      this.clearCache();
    }
    
    this.emit('cacheSettingChanged', { old: wasEnabled, new: enabled });
  }
  
  /**
   * Active ou désactive la validation des résultats
   * @param {boolean} enabled - État de la validation
   */
  setValidationEnabled(enabled) {
    const wasEnabled = this._options.validateResults;
    this._options.validateResults = enabled;
    
    this.emit('validationSettingChanged', { old: wasEnabled, new: enabled });
  }
  
  /**
   * Effectue un benchmark des performances
   * @param {number} [iterations=1000] - Nombre d'itérations
   * @returns {Object} Résultats du benchmark
   */
  benchmark(iterations = 1000) {
    const startTime = performance.now();
    const initialStats = { ...this._stats };
    
    // Test avec des référentiels simples
    const testFrames = [
      { x: 0, t: 0 },
      { x: 100, t: 200 },
      { x: 200, t: 300 }
    ];
    
    for (let i = 0; i < iterations; i++) {
      this.calculateCumulative(testFrames);
    }
    
    const endTime = performance.now();
    const finalStats = { ...this._stats };
    
    return {
      duration: endTime - startTime,
      iterations,
      avgTimePerCalculation: (endTime - startTime) / iterations,
      calculationsPerSecond: iterations / ((endTime - startTime) / 1000),
      statsIncrease: {
        calculations: finalStats.calculations - initialStats.calculations,
        cacheHits: finalStats.cacheHits - initialStats.cacheHits,
        cacheMisses: finalStats.cacheMisses - initialStats.cacheMisses
      }
    };
  }
  
  /**
   * Représentation string du calculateur
   * @returns {string} Représentation textuelle
   */
  toString() {
    const stats = this.getStats();
    return `PhysicsCalculator(calculations=${stats.calculations}, cache=${stats.cacheSize}, hitRate=${(stats.hitRate * 100).toFixed(1)}%)`;
  }
} 