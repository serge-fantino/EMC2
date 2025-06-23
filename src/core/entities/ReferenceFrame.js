/**
 * @fileoverview Classe ReferenceFrame représentant un référentiel dans l'espace-temps
 * @author Serge Fantino
 * @version 2.0.0
 */

import EventEmitter from 'eventemitter3';
import { validatePosition, validateSourceFrame } from '@utils/validation.js';

/**
 * Représente un référentiel dans l'espace-temps de Minkowski
 * @class ReferenceFrame
 * @extends EventEmitter
 */
export class ReferenceFrame extends EventEmitter {
  /**
   * Crée un nouveau référentiel
   * @param {Object} params - Paramètres du référentiel
   * @param {number} params.x - Position spatiale
   * @param {number} params.t - Temps coordonnée
   * @param {ReferenceFrame|null} [params.sourceFrame=null] - Référentiel source
   * @param {number} [params.id] - Identifiant unique
   */
  constructor({ x, t, sourceFrame = null, id = null }) {
    super();
    
    // Validation des paramètres
    validatePosition({ x, t });
    if (sourceFrame) {
      validateSourceFrame(sourceFrame, { x, t });
    }
    
    /**
     * Identifiant unique du référentiel
     * @type {number}
     * @readonly
     */
    this.id = id ?? ReferenceFrame.generateId();
    
    /**
     * Position spatiale dans l'espace-temps
     * @type {number}
     * @private
     */
    this._x = x;
    
    /**
     * Temps coordonnée dans l'espace-temps
     * @type {number}
     * @private
     */
    this._t = t;
    
    /**
     * Référentiel source (parent dans la chaîne causale)
     * @type {ReferenceFrame|null}
     * @private
     */
    this._sourceFrame = sourceFrame;
    
    /**
     * Référentiels dérivés (enfants dans la chaîne causale)
     * @type {Set<ReferenceFrame>}
     * @private
     */
    this._derivedFrames = new Set();
    
    /**
     * Cache pour les calculs physiques
     * @type {Object|null}
     * @private
     */
    this._physicsCache = null;
    
    /**
     * Métadonnées utilisateur
     * @type {Object}
     */
    this.metadata = {};
    
    // Enregistrer ce référentiel comme dérivé du source
    if (this._sourceFrame) {
      this._sourceFrame._derivedFrames.add(this);
    }
    
    // Émettre l'événement de création
    this.emit('created', this);
  }
  
  /**
   * Position spatiale (getter)
   * @type {number}
   */
  get x() {
    return this._x;
  }
  
  /**
   * Position spatiale (setter)
   * @type {number}
   */
  set x(value) {
    if (typeof value !== 'number' || !isFinite(value)) {
      throw new Error('Position spatiale doit être un nombre fini');
    }
    
    const oldValue = this._x;
    this._x = value;
    this._invalidateCache();
    this.emit('positionChanged', { old: { x: oldValue, t: this._t }, new: { x: value, t: this._t } });
  }
  
  /**
   * Temps coordonnée (getter)
   * @type {number}
   */
  get t() {
    return this._t;
  }
  
  /**
   * Temps coordonnée (setter)
   * @type {number}
   */
  set t(value) {
    if (typeof value !== 'number' || !isFinite(value)) {
      throw new Error('Temps coordonnée doit être un nombre fini');
    }
    
    if (this._sourceFrame && value <= this._sourceFrame.t) {
      throw new Error('Le temps doit être postérieur au référentiel source');
    }
    
    const oldValue = this._t;
    this._t = value;
    this._invalidateCache();
    this.emit('positionChanged', { old: { x: this._x, t: oldValue }, new: { x: this._x, t: value } });
  }
  
  /**
   * Référentiel source (getter)
   * @type {ReferenceFrame|null}
   */
  get sourceFrame() {
    return this._sourceFrame;
  }
  
  /**
   * Référentiels dérivés (getter)
   * @type {ReferenceFrame[]}
   */
  get derivedFrames() {
    return Array.from(this._derivedFrames);
  }
  
  /**
   * Vérifie si ce référentiel est l'origine
   * @type {boolean}
   */
  get isOrigin() {
    return this._sourceFrame === null;
  }
  
  /**
   * Obtient la position complète
   * @returns {Object} Position {x, t}
   */
  getPosition() {
    return { x: this._x, t: this._t };
  }
  
  /**
   * Définit une nouvelle position
   * @param {Object} position - Nouvelle position
   * @param {number} position.x - Position spatiale
   * @param {number} position.t - Temps coordonnée
   */
  setPosition({ x, t }) {
    validatePosition({ x, t });
    
    if (this._sourceFrame) {
      validateSourceFrame(this._sourceFrame, { x, t });
    }
    
    const oldPosition = { x: this._x, t: this._t };
    this._x = x;
    this._t = t;
    this._invalidateCache();
    
    this.emit('positionChanged', { old: oldPosition, new: { x, t } });
  }
  
  /**
   * Calcule le déplacement depuis le référentiel source
   * @returns {Object|null} Déplacement {deltaX, deltaT} ou null si pas de source
   */
  getDisplacementFromSource() {
    if (!this._sourceFrame) {
      return null;
    }
    
    return {
      deltaX: this._x - this._sourceFrame.x,
      deltaT: this._t - this._sourceFrame.t
    };
  }
  
  /**
   * Calcule le déplacement vers un autre référentiel
   * @param {ReferenceFrame} targetFrame - Référentiel cible
   * @returns {Object} Déplacement {deltaX, deltaT}
   */
  getDisplacementTo(targetFrame) {
    if (!(targetFrame instanceof ReferenceFrame)) {
      throw new Error('Le paramètre doit être un ReferenceFrame');
    }
    
    return {
      deltaX: targetFrame.x - this._x,
      deltaT: targetFrame.t - this._t
    };
  }
  
  /**
   * Obtient la chaîne causale depuis l'origine
   * @returns {ReferenceFrame[]} Chaîne de référentiels depuis l'origine
   */
  getCausalChain() {
    const chain = [];
    let current = this;
    
    while (current) {
      chain.unshift(current);
      current = current._sourceFrame;
    }
    
    return chain;
  }
  
  /**
   * Vérifie si ce référentiel est causalement connecté à un autre
   * @param {ReferenceFrame} otherFrame - Autre référentiel
   * @returns {boolean} True si causalement connecté
   */
  isCausallyConnectedTo(otherFrame) {
    const chain = this.getCausalChain();
    const otherChain = otherFrame.getCausalChain();
    
    // Chercher un ancêtre commun
    for (const frame of chain) {
      if (otherChain.includes(frame)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Supprime ce référentiel et tous ses dérivés
   * @param {boolean} [recursive=true] - Supprimer récursivement les dérivés
   */
  destroy(recursive = true) {
    // Supprimer récursivement les référentiels dérivés
    if (recursive) {
      for (const derivedFrame of this._derivedFrames) {
        derivedFrame.destroy(true);
      }
    } else {
      // Réattacher les dérivés au source de ce référentiel
      for (const derivedFrame of this._derivedFrames) {
        derivedFrame._sourceFrame = this._sourceFrame;
        if (this._sourceFrame) {
          this._sourceFrame._derivedFrames.add(derivedFrame);
        }
      }
    }
    
    // Se retirer du référentiel source
    if (this._sourceFrame) {
      this._sourceFrame._derivedFrames.delete(this);
    }
    
    // Nettoyer les références
    this._derivedFrames.clear();
    this._sourceFrame = null;
    this._physicsCache = null;
    
    this.emit('destroyed', this);
    this.removeAllListeners();
  }
  
  /**
   * Clone ce référentiel
   * @param {Object} [overrides] - Propriétés à surcharger
   * @returns {ReferenceFrame} Nouveau référentiel cloné
   */
  clone(overrides = {}) {
    return new ReferenceFrame({
      x: overrides.x ?? this._x,
      t: overrides.t ?? this._t,
      sourceFrame: overrides.sourceFrame ?? this._sourceFrame,
      ...overrides
    });
  }
  
  /**
   * Sérialise le référentiel
   * @returns {Object} Données sérialisées
   */
  serialize() {
    return {
      id: this.id,
      x: this._x,
      t: this._t,
      sourceFrameId: this._sourceFrame?.id ?? null,
      metadata: { ...this.metadata }
    };
  }
  
  /**
   * Invalide le cache des calculs physiques
   * @private
   */
  _invalidateCache() {
    this._physicsCache = null;
    
    // Invalider également le cache des référentiels dérivés
    for (const derivedFrame of this._derivedFrames) {
      derivedFrame._invalidateCache();
    }
  }
  
  /**
   * Représentation string du référentiel
   * @returns {string} Représentation textuelle
   */
  toString() {
    const sourceId = this._sourceFrame?.id ?? 'none';
    return `ReferenceFrame(id=${this.id}, x=${this._x}, t=${this._t}, source=${sourceId})`;
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
    return ++ReferenceFrame._idCounter;
  }
  
  /**
   * Désérialise un référentiel depuis des données
   * @param {Object} data - Données sérialisées
   * @param {Map<number, ReferenceFrame>} [frameMap] - Map des référentiels existants
   * @returns {ReferenceFrame} Référentiel désérialisé
   * @static
   */
  static deserialize(data, frameMap = new Map()) {
    const sourceFrame = data.sourceFrameId ? frameMap.get(data.sourceFrameId) : null;
    
    const frame = new ReferenceFrame({
      x: data.x,
      t: data.t,
      sourceFrame,
      id: data.id
    });
    
    frame.metadata = { ...data.metadata };
    
    // Mettre à jour le compteur d'ID si nécessaire
    if (data.id >= ReferenceFrame._idCounter) {
      ReferenceFrame._idCounter = data.id;
    }
    
    return frame;
  }
} 