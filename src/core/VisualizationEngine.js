/**
 * @fileoverview Orchestrateur principal de la visualisation des cônes de lumière
 * @author Serge Fantino
 * @version 2.0.0
 */

import EventEmitter from 'eventemitter3';
import { CanvasRenderer } from '@ui/rendering/CanvasRenderer.js';
import { LightConeRenderer } from '@ui/rendering/LightConeRenderer.js';
import { TrajectoryRenderer } from '@ui/rendering/TrajectoryRenderer.js';
import { IsochroneRenderer } from '@ui/rendering/IsochroneRenderer.js';
import { MouseHandler } from '@ui/interactions/MouseHandler.js';
import { PhysicsCalculator } from './services/PhysicsCalculator.js';
import { ReferenceFrame } from './entities/ReferenceFrame.js';
import { LightCone } from './entities/LightCone.js';
import { Isochrone } from './entities/Isochrone.js';
import { SPEED_OF_LIGHT } from './physics/constants.js';

/**
 * Orchestrateur principal coordonnant tous les modules de visualisation
 * @class VisualizationEngine
 * @extends EventEmitter
 */
export class VisualizationEngine extends EventEmitter {
  /**
   * Crée un nouveau moteur de visualisation
   * @param {HTMLCanvasElement} canvas - Élément canvas principal
   * @param {Object} [options] - Options de configuration
   */
  constructor(canvas, options = {}) {
    super();
    
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Un élément canvas HTML valide est requis');
    }
    
    /**
     * Configuration par défaut
     * @type {Object}
     * @private
     */
    this._config = {
      // Limites de visualisation
      bounds: {
        minX: -10,
        maxX: 10,
        minT: -5,
        maxT: 15
      },
      
      // Options de rendu
      rendering: {
        showGrid: true,
        showLightCones: true,
        showTrajectories: true,
        showIsochrones: false,
        antialiasing: true
      },
      
      // Options d'interaction
      interactions: {
        enablePan: true,
        enableZoom: true,
        enableDrag: true,
        enableHover: true
      },
      
      // Physique
      physics: {
        maxVelocity: 0.99, // 99% de c
        timeStep: 0.1,
        precisionDigits: 3
      },
      
      ...options
    };
    
    /**
     * État de la visualisation
     * @type {Object}
     * @private
     */
    this._state = {
      isInitialized: false,
      isRunning: false,
      animationId: null,
      lastFrameTime: 0,
      referenceFrames: [],
      lightCones: [],
      isochrones: [],
      selectedFrame: null,
      hoveredElement: null
    };
    
    // Initialiser les modules
    this._initializeModules(canvas);
    
    // Configurer les interactions
    this._setupInteractions();
    
    // Marquer comme initialisé
    this._state.isInitialized = true;
    
    this.emit('initialized', this);
  }
  
  /**
   * Initialise tous les modules de rendu et services
   * @param {HTMLCanvasElement} canvas - Canvas principal
   * @private
   */
  _initializeModules(canvas) {
    // Moteur de physique
    this.physics = new PhysicsCalculator();
    
    // Renderers
    this.baseRenderer = new CanvasRenderer(canvas, {
      backgroundColor: '#0a0a0a',
      antialias: this._config.rendering.antialiasing
    });
    
    this.lightConeRenderer = new LightConeRenderer(canvas);
    this.trajectoryRenderer = new TrajectoryRenderer(canvas);
    this.isochroneRenderer = new IsochroneRenderer(canvas);
    
    // Gestionnaire d'interactions
    this.mouseHandler = new MouseHandler(canvas, this.baseRenderer, {
      enableDrag: this._config.interactions.enableDrag,
      enableHover: this._config.interactions.enableHover
    });
    
    // Configuration initiale du système de coordonnées
    this._updateCoordinateSystem();
  }
  
  /**
   * Configure les gestionnaires d'événements d'interaction
   * @private
   */
  _setupInteractions() {
    // Gestion du pan/zoom
    this.mouseHandler.on('drag', (event) => {
      if (this._config.interactions.enablePan) {
        this._handlePan(event);
      }
    });
    
    this.mouseHandler.on('wheel', (event) => {
      if (this._config.interactions.enableZoom) {
        this._handleZoom(event);
      }
    });
    
    // Gestion des clics pour créer des référentiels
    this.mouseHandler.on('click', (event) => {
      this._handleClick(event);
    });
    
    // Gestion du hover pour la sélection
    this.mouseHandler.on('hover', (event) => {
      this._handleHover(event);
    });
    
    // Gestion du double-clic pour les actions spéciales
    this.mouseHandler.on('doubleClick', (event) => {
      this._handleDoubleClick(event);
    });
    
    // Redimensionnement
    this.baseRenderer.on('resized', () => {
      this._updateCoordinateSystem();
      this.render();
    });
  }
  
  /**
   * Met à jour le système de coordonnées de tous les renderers
   * @private
   */
  _updateCoordinateSystem() {
    const { width, height } = this.baseRenderer.getDimensions();
    const { bounds } = this._config;
    
    // Calculer l'échelle pour maintenir le ratio d'aspect
    const worldWidth = bounds.maxX - bounds.minX;
    const worldHeight = bounds.maxT - bounds.minT;
    const scaleX = width / worldWidth;
    const scaleY = height / worldHeight;
    
    // Utiliser la plus petite échelle pour éviter la déformation
    const scale = Math.min(scaleX, scaleY) * 0.9; // 90% pour les marges
    
    const coords = {
      offsetX: width / 2,
      offsetY: height / 2,
      scaleX: scale,
      scaleY: -scale, // Y inversé (temps vers le haut)
      originX: (bounds.minX + bounds.maxX) / 2,
      originY: (bounds.minT + bounds.maxT) / 2
    };
    
    // Appliquer à tous les renderers
    this.baseRenderer.setCoordinateSystem(coords);
    this.lightConeRenderer.setCoordinateSystem(coords);
    this.trajectoryRenderer.setCoordinateSystem(coords);
    this.isochroneRenderer.setCoordinateSystem(coords);
  }
  
  /**
   * Gère le panoramique (pan)
   * @param {Object} event - Événement de drag
   * @private
   */
  _handlePan(event) {
    const { delta } = event;
    const coords = this.baseRenderer.getCoordinateSystem();
    
    // Convertir le déplacement écran en déplacement monde
    const worldDeltaX = -delta.x / coords.scaleX;
    const worldDeltaY = delta.y / coords.scaleY; // Y inversé
    
    // Mettre à jour les limites
    this._config.bounds.minX += worldDeltaX;
    this._config.bounds.maxX += worldDeltaX;
    this._config.bounds.minT += worldDeltaY;
    this._config.bounds.maxT += worldDeltaY;
    
    this._updateCoordinateSystem();
    this.render();
    
    this.emit('viewChanged', { bounds: this._config.bounds, type: 'pan' });
  }
  
  /**
   * Gère le zoom
   * @param {Object} event - Événement de roulette
   * @private
   */
  _handleZoom(event) {
    const { worldPosition, deltaY } = event;
    const zoomFactor = deltaY > 0 ? 1.1 : 0.9;
    
    const { bounds } = this._config;
    const centerX = worldPosition.x;
    const centerY = worldPosition.t;
    
    // Calculer les nouvelles limites centrées sur le point de zoom
    const currentWidth = bounds.maxX - bounds.minX;
    const currentHeight = bounds.maxT - bounds.minT;
    const newWidth = currentWidth * zoomFactor;
    const newHeight = currentHeight * zoomFactor;
    
    bounds.minX = centerX - newWidth / 2;
    bounds.maxX = centerX + newWidth / 2;
    bounds.minT = centerY - newHeight / 2;
    bounds.maxT = centerY + newHeight / 2;
    
    this._updateCoordinateSystem();
    this.render();
    
    this.emit('viewChanged', { bounds: this._config.bounds, type: 'zoom' });
  }
  
  /**
   * Gère les clics pour créer des référentiels
   * @param {Object} event - Événement de clic
   * @private
   */
  _handleClick(event) {
    if (event.button !== 0) return; // Seulement clic gauche
    
    const { worldPosition } = event;
    
    // Créer un nouveau référentiel
    const frame = new ReferenceFrame(worldPosition.x, worldPosition.t);
    this.addReferenceFrame(frame);
    
    this.emit('referenceFrameCreated', { frame, position: worldPosition });
  }
  
  /**
   * Gère le survol pour la sélection
   * @param {Object} event - Événement de hover
   * @private
   */
  _handleHover(event) {
    const { worldPosition } = event;
    
    // Chercher l'élément le plus proche
    const hoveredElement = this._findElementAt(worldPosition);
    
    if (hoveredElement !== this._state.hoveredElement) {
      this._state.hoveredElement = hoveredElement;
      this.render(); // Re-render pour montrer la sélection
      
      this.emit('hoverChanged', { element: hoveredElement, position: worldPosition });
    }
  }
  
  /**
   * Gère les double-clics pour les actions spéciales
   * @param {Object} event - Événement de double-clic
   * @private
   */
  _handleDoubleClick(event) {
    const { worldPosition } = event;
    
    // Chercher un référentiel proche
    const frame = this._findReferenceFrameAt(worldPosition, 0.5);
    if (frame) {
      this.selectReferenceFrame(frame);
      this.emit('referenceFrameSelected', { frame });
    }
  }
  
  /**
   * Trouve l'élément le plus proche d'une position
   * @param {Object} worldPos - Position monde
   * @returns {Object|null} Élément trouvé
   * @private
   */
  _findElementAt(worldPos) {
    // Chercher parmi les référentiels
    const frame = this._findReferenceFrameAt(worldPos, 0.3);
    if (frame) return { type: 'referenceFrame', element: frame };
    
    // Chercher parmi les isochrones si visibles
    if (this._config.rendering.showIsochrones) {
      const isochrone = this._findIsochroneAt(worldPos, 0.2);
      if (isochrone) return { type: 'isochrone', element: isochrone };
    }
    
    return null;
  }
  
  /**
   * Trouve un référentiel proche d'une position
   * @param {Object} worldPos - Position monde
   * @param {number} threshold - Seuil de distance
   * @returns {ReferenceFrame|null} Référentiel trouvé
   * @private
   */
  _findReferenceFrameAt(worldPos, threshold) {
    return this._state.referenceFrames.find(frame => {
      const distance = Math.sqrt(
        Math.pow(frame.x - worldPos.x, 2) + 
        Math.pow(frame.t - worldPos.t, 2)
      );
      return distance <= threshold;
    });
  }
  
  /**
   * Trouve une isochrone proche d'une position
   * @param {Object} worldPos - Position monde
   * @param {number} threshold - Seuil de distance
   * @returns {Isochrone|null} Isochrone trouvée
   * @private
   */
  _findIsochroneAt(worldPos, threshold) {
    return this._state.isochrones.find(isochrone => {
      return isochrone.isNearPoint(worldPos.x, worldPos.t, threshold);
    });
  }
  
  /**
   * Ajoute un référentiel à la visualisation
   * @param {ReferenceFrame} frame - Référentiel à ajouter
   */
  addReferenceFrame(frame) {
    if (!(frame instanceof ReferenceFrame)) {
      throw new Error('frame doit être une instance de ReferenceFrame');
    }
    
    this._state.referenceFrames.push(frame);
    
    // Créer un cône de lumière associé
    const lightCone = new LightCone(frame.x, frame.t);
    this._state.lightCones.push(lightCone);
    
    this.render();
    this.emit('referenceFrameAdded', { frame });
  }
  
  /**
   * Supprime un référentiel
   * @param {ReferenceFrame} frame - Référentiel à supprimer
   */
  removeReferenceFrame(frame) {
    const index = this._state.referenceFrames.indexOf(frame);
    if (index >= 0) {
      this._state.referenceFrames.splice(index, 1);
      
      // Supprimer le cône de lumière associé
      this._state.lightCones.splice(index, 1);
      
      this.render();
      this.emit('referenceFrameRemoved', { frame });
    }
  }
  
  /**
   * Sélectionne un référentiel
   * @param {ReferenceFrame} frame - Référentiel à sélectionner
   */
  selectReferenceFrame(frame) {
    this._state.selectedFrame = frame;
    this.render();
    this.emit('referenceFrameSelected', { frame });
  }
  
  /**
   * Génère des isochrones pour la visualisation
   * @param {Object} options - Options de génération
   */
  generateIsochrones(options = {}) {
    const config = {
      origin: { x: 0, t: 0 },
      properTimes: [1, 2, 3, 4, 5],
      bounds: this._config.bounds,
      ...options
    };
    
    this._state.isochrones = config.properTimes.map(tau => {
      const isochrone = new Isochrone(config.origin, tau);
      isochrone.setBounds(config.bounds);
      return isochrone;
    });
    
    this._config.rendering.showIsochrones = true;
    this.render();
    
    this.emit('isochronesGenerated', { 
      count: this._state.isochrones.length,
      properTimes: config.properTimes 
    });
  }
  
  /**
   * Effectue le rendu complet de la visualisation
   */
  render() {
    if (!this._state.isInitialized) return;
    
    this.baseRenderer.beginFrame();
    this.baseRenderer.clear();
    
    // Dessiner la grille si activée
    if (this._config.rendering.showGrid) {
      this.lightConeRenderer.drawSpacetimeGrid(this._config.bounds);
    }
    
    // Dessiner les cônes de lumière
    if (this._config.rendering.showLightCones) {
      this._state.lightCones.forEach(lightCone => {
        this.lightConeRenderer.drawLightCone(lightCone, this._config.bounds);
      });
    }
    
    // Dessiner les isochrones
    if (this._config.rendering.showIsochrones && this._state.isochrones.length > 0) {
      this.isochroneRenderer.drawIsochroneSeries(this._state.isochrones);
    }
    
    // Dessiner les trajectoires
    if (this._config.rendering.showTrajectories && this._state.referenceFrames.length > 1) {
      this.trajectoryRenderer.drawTrajectory(this._state.referenceFrames);
    }
    
    // Mettre en surbrillance l'élément survolé
    if (this._state.hoveredElement) {
      this._renderHoveredElement();
    }
    
    this.baseRenderer.endFrame();
    
    this.emit('rendered', {
      frameCount: this.baseRenderer.getStats().frameCount,
      elementCount: this._state.referenceFrames.length
    });
  }
  
  /**
   * Rend l'élément actuellement survolé
   * @private
   */
  _renderHoveredElement() {
    const { element, type } = this._state.hoveredElement;
    
    if (type === 'referenceFrame') {
      // Mettre en surbrillance le référentiel
      this.trajectoryRenderer.drawTrajectory([element], {
        referenceFrame: { glow: true, size: 8 }
      });
    } else if (type === 'isochrone') {
      // Mettre en surbrillance l'isochrone
      this.isochroneRenderer.highlightIsochrone(element);
    }
  }
  
  /**
   * Démarre l'animation (si nécessaire)
   */
  start() {
    if (this._state.isRunning) return;
    
    this._state.isRunning = true;
    this._animate();
    
    this.emit('started');
  }
  
  /**
   * Arrête l'animation
   */
  stop() {
    if (!this._state.isRunning) return;
    
    this._state.isRunning = false;
    if (this._state.animationId) {
      cancelAnimationFrame(this._state.animationId);
      this._state.animationId = null;
    }
    
    this.emit('stopped');
  }
  
  /**
   * Boucle d'animation
   * @private
   */
  _animate() {
    if (!this._state.isRunning) return;
    
    this.render();
    
    this._state.animationId = requestAnimationFrame(() => {
      this._animate();
    });
  }
  
  /**
   * Met à jour la configuration
   * @param {Object} newConfig - Nouvelle configuration
   */
  updateConfig(newConfig) {
    this._config = { ...this._config, ...newConfig };
    
    // Appliquer les changements
    if (newConfig.bounds) {
      this._updateCoordinateSystem();
    }
    
    this.render();
    this.emit('configUpdated', this._config);
  }
  
  /**
   * Obtient l'état actuel
   * @returns {Object} État de la visualisation
   */
  getState() {
    return {
      ...this._state,
      config: { ...this._config },
      stats: this.baseRenderer.getStats()
    };
  }
  
  /**
   * Remet à zéro la visualisation
   */
  reset() {
    this._state.referenceFrames = [];
    this._state.lightCones = [];
    this._state.isochrones = [];
    this._state.selectedFrame = null;
    this._state.hoveredElement = null;
    
    this.render();
    this.emit('reset');
  }
  
  /**
   * Détruit le moteur et libère les ressources
   */
  destroy() {
    this.stop();
    
    // Détruire les modules
    this.mouseHandler?.destroy();
    this.baseRenderer?.destroy();
    
    // Nettoyer l'état
    this._state = {};
    
    this.removeAllListeners();
    this.emit('destroyed');
  }
} 