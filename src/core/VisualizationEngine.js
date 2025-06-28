/**
 * @fileoverview Orchestrateur principal de la visualisation des cônes de lumière
 * @author Serge Fantino
 * @version 2.0.0
 */

import EventEmitter from 'eventemitter3';
import { CanvasRenderer } from '@ui/rendering/CanvasRenderer.js';
import { HeatmapRenderer } from '@ui/rendering/HeatmapRenderer.js';
import { InfoBoxRenderer } from '@ui/rendering/InfoBoxRenderer.js';
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
      // Limites de visualisation (coordonnées espace-temps)
      bounds: {
        minX: -10,
        maxX: 10,
        minT: -2,
        maxT: 15
      },
      
      // Options de rendu
      rendering: {
        showHeatmap: true,
        showLightConeEnvelopes: true,
        showTrajectories: true,
        showIsochrones: false,
        showInfoBoxes: true,
        antialiasing: true,
        resolution: 'medium' // low, medium, high
      },
      
      // Configuration heatmap
      heatmap: {
        greenLimit: 0.5,  // Limite verte (v/c)
        redLimit: 1.0,    // Limite rouge (v/c)
        pixelSize: 2,     // Taille pixels
        showPastCone: false
      },
      
      // Options d'interaction
      interactions: {
        enablePan: true,
        enableZoom: true,
        enableDrag: true,
        enableHover: true,
        enableCreate: true
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
      selectedFrameIndex: -1,
      hoveredElement: null,
      dragState: {
        isDragging: false,
        draggedType: null, // 'frame' | 'infoBox'
        draggedIndex: -1,
        startPos: { x: 0, y: 0 },
        hasActuallyDragged: false
      }
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
      backgroundColor: '#000000',
      antialias: this._config.rendering.antialiasing
    });
    
    // Renderer de heatmap colorée
    this.heatmapRenderer = new HeatmapRenderer(canvas, {
      heatmap: this._config.heatmap
    });
    
    // Renderer des cartouches d'information
    this.infoBoxRenderer = new InfoBoxRenderer(canvas);
    
    // Autres renderers
    this.trajectoryRenderer = new TrajectoryRenderer(canvas);
    this.isochroneRenderer = new IsochroneRenderer(canvas);
    
    // Gestionnaire d'interactions
    this.mouseHandler = new MouseHandler(canvas, this.baseRenderer, {
      enableDrag: this._config.interactions.enableDrag,
      enableHover: this._config.interactions.enableHover
    });
    
    // Créer l'origine par défaut
    this._createOriginFrame();
    
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
      if (this._config.interactions.enablePan && !this._state.dragState.isDragging) {
        this._handlePan(event);
      }
    });
    
    this.mouseHandler.on('wheel', (event) => {
      if (this._config.interactions.enableZoom) {
        this._handleZoom(event);
      }
    });
    
    // Gestion des clics pour créer/sélectionner des référentiels
    this.mouseHandler.on('mouseDown', (event) => {
      this._handleMouseDown(event);
    });
    
    this.mouseHandler.on('mouseMove', (event) => {
      this._handleMouseMove(event);
    });
    
    this.mouseHandler.on('mouseUp', (event) => {
      this._handleMouseUp(event);
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
    this.heatmapRenderer.setCoordinateSystem(coords);
    this.infoBoxRenderer.setCoordinateSystem(coords);
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
   * Gère les événements de souris down
   * @param {Object} event - Événement de souris
   * @private
   */
  _handleMouseDown(event) {
    const { worldPosition, screenPosition } = event;
    
    // Vérifier si on clique sur un bouton de suppression
    const deleteIndex = this.infoBoxRenderer.findDeleteButtonAtPosition(screenPosition.x, screenPosition.y);
    if (deleteIndex > 0) { // Pas l'origine
      this._deleteReferenceFrame(deleteIndex);
      return;
    }
    
    // Vérifier si on clique sur une cartouche d'information
    const infoBoxIndex = this.infoBoxRenderer.findBoxAtPosition(screenPosition.x, screenPosition.y);
    if (infoBoxIndex >= 0) {
      this._startInfoBoxDrag(infoBoxIndex, screenPosition);
      return;
    }
    
    // Vérifier si on clique sur un référentiel existant
    const frameIndex = this._findReferenceFrameAt(worldPosition, 0.3);
    if (frameIndex >= 0) {
      this._startFrameDrag(frameIndex, screenPosition);
      return;
    }
    
    // Vérifier si on peut créer un nouveau référentiel
    if (this._config.interactions.enableCreate) {
      const sourceConeIndex = this._findContainingCone(worldPosition);
      if (sourceConeIndex >= 0 && worldPosition.t > 0) {
        this._createNewReferenceFrame(worldPosition, sourceConeIndex);
      }
    }
  }
  
  /**
   * Gère les événements de mouvement de souris
   * @param {Object} event - Événement de souris
   * @private
   */
  _handleMouseMove(event) {
    if (!this._state.dragState.isDragging) return;
    
    const { worldPosition, screenPosition } = event;
    const { draggedType, draggedIndex, startPos } = this._state.dragState;
    
    this._state.dragState.hasActuallyDragged = true;
    
    if (draggedType === 'frame') {
      this._updateFramePosition(draggedIndex, worldPosition, event.ctrlKey);
    } else if (draggedType === 'infoBox') {
      const deltaX = screenPosition.x - startPos.x;
      const deltaY = screenPosition.y - startPos.y;
      this.infoBoxRenderer.setManualOffset(draggedIndex, deltaX, deltaY);
    }
    
    this.render();
  }
  
  /**
   * Gère les événements de souris up
   * @param {Object} event - Événement de souris
   * @private
   */
  _handleMouseUp(event) {
    if (this._state.dragState.isDragging) {
      const { draggedType, draggedIndex, hasActuallyDragged } = this._state.dragState;
      
      // Si pas de mouvement, c'est un clic de sélection
      if (!hasActuallyDragged && draggedType === 'frame') {
        this._selectReferenceFrame(draggedIndex);
      }
      
      // Réinitialiser l'état de drag
      this._state.dragState = {
        isDragging: false,
        draggedType: null,
        draggedIndex: -1,
        startPos: { x: 0, y: 0 },
        hasActuallyDragged: false
      };
      
      this.render();
    }
  }
  
  /**
   * Démarre le drag d'un référentiel
   * @param {number} frameIndex - Index du référentiel
   * @param {Object} screenPos - Position écran
   * @private
   */
  _startFrameDrag(frameIndex, screenPos) {
    this._state.dragState = {
      isDragging: true,
      draggedType: 'frame',
      draggedIndex: frameIndex,
      startPos: { x: screenPos.x, y: screenPos.y },
      hasActuallyDragged: false
    };
  }
  
  /**
   * Démarre le drag d'une cartouche d'information
   * @param {number} infoBoxIndex - Index de la cartouche
   * @param {Object} screenPos - Position écran
   * @private
   */
  _startInfoBoxDrag(infoBoxIndex, screenPos) {
    this._state.dragState = {
      isDragging: true,
      draggedType: 'infoBox',
      draggedIndex: infoBoxIndex,
      startPos: { x: screenPos.x, y: screenPos.y },
      hasActuallyDragged: false
    };
  }
  
  /**
   * Met à jour la position d'un référentiel
   * @param {number} frameIndex - Index du référentiel
   * @param {Object} worldPos - Nouvelle position monde
   * @param {boolean} constrainVertical - Contraindre verticalement (Ctrl)
   * @private
   */
  _updateFramePosition(frameIndex, worldPos, constrainVertical) {
    if (frameIndex === 0) return; // Ne pas déplacer l'origine
    
    const frame = this._state.referenceFrames[frameIndex];
    const sourceFrame = this._state.referenceFrames[frame.sourceIndex || 0];
    
    let newX = worldPos.x;
    let newT = worldPos.t;
    
    // Contrainte verticale avec Ctrl
    if (constrainVertical) {
      newX = sourceFrame.x;
    }
    
    // Vérifier que le nouveau point est atteignable depuis la source
    if (this._isReachableFromSource(newX, newT, sourceFrame)) {
      frame.setPosition(newX, newT);
      
      // Mettre à jour le cône de lumière associé
      const lightCone = this._state.lightCones[frameIndex];
      if (lightCone) {
        lightCone.setOrigin(newX, newT);
      }
    }
  }
  
  /**
   * Vérifie si un point est atteignable depuis un référentiel source
   * @param {number} x - Position X
   * @param {number} t - Temps
   * @param {ReferenceFrame} sourceFrame - Référentiel source
   * @returns {boolean} True si atteignable
   * @private
   */
  _isReachableFromSource(x, t, sourceFrame) {
    const deltaX = x - sourceFrame.x;
    const deltaT = t - sourceFrame.t;
    
    // Doit être dans le futur et dans le cône de lumière
    const margin = 0.02; // Marge de 2% pour éviter la vitesse de la lumière
    return deltaT > 0 && Math.abs(deltaX) < deltaT * (1 - margin);
  }
  
  /**
   * Crée un nouveau référentiel
   * @param {Object} worldPos - Position monde
   * @param {number} sourceConeIndex - Index du cône source
   * @private
   */
  _createNewReferenceFrame(worldPos, sourceConeIndex) {
    const newFrame = new ReferenceFrame(worldPos.x, worldPos.t, {
      sourceIndex: sourceConeIndex
    });
    
    this._state.referenceFrames.push(newFrame);
    
    // Créer le cône de lumière associé
    const newCone = new LightCone(worldPos.x, worldPos.t);
    this._state.lightCones.push(newCone);
    
    // Sélectionner le nouveau référentiel
    this._selectReferenceFrame(this._state.referenceFrames.length - 1);
    
    this.render();
    this.emit('referenceFrameCreated', { frame: newFrame, position: worldPos });
  }
  
  /**
   * Supprime un référentiel et tous ses dérivés
   * @param {number} frameIndex - Index du référentiel à supprimer
   * @private
   */
  _deleteReferenceFrame(frameIndex) {
    if (frameIndex <= 0) return; // Ne pas supprimer l'origine
    
    // Trouver tous les référentiels dérivés récursivement
    const toDelete = [frameIndex];
    this._findDerivedFrames(frameIndex, toDelete);
    
    // Trier par index décroissant pour supprimer du plus grand au plus petit
    toDelete.sort((a, b) => b - a);
    
    // Supprimer les référentiels et cônes
    toDelete.forEach(index => {
      this._state.referenceFrames.splice(index, 1);
      this._state.lightCones.splice(index, 1);
    });
    
    // Mettre à jour les indices source
    this._updateSourceIndices(toDelete);
    
    // Réinitialiser la sélection
    this._state.selectedFrameIndex = 0;
    
    this.render();
    this.emit('referenceFrameDeleted', { deletedIndices: toDelete });
  }
  
  /**
   * Trouve récursivement tous les référentiels dérivés
   * @param {number} parentIndex - Index du parent
   * @param {Array} toDelete - Liste des indices à supprimer
   * @private
   */
  _findDerivedFrames(parentIndex, toDelete) {
    for (let i = 0; i < this._state.referenceFrames.length; i++) {
      const frame = this._state.referenceFrames[i];
      if (frame.sourceIndex === parentIndex && !toDelete.includes(i)) {
        toDelete.push(i);
        this._findDerivedFrames(i, toDelete);
      }
    }
  }
  
  /**
   * Met à jour les indices source après suppression
   * @param {Array} deletedIndices - Indices supprimés
   * @private
   */
  _updateSourceIndices(deletedIndices) {
    this._state.referenceFrames.forEach(frame => {
      if (frame.sourceIndex >= 0) {
        // Compter combien d'indices inférieurs ont été supprimés
        let adjustment = 0;
        deletedIndices.forEach(deletedIndex => {
          if (deletedIndex <= frame.sourceIndex) {
            adjustment++;
          }
        });
        frame.sourceIndex -= adjustment;
        
        // Sécurité : si la source a été supprimée, pointer vers l'origine
        if (frame.sourceIndex < 0) {
          frame.sourceIndex = 0;
        }
      }
    });
  }
  
  /**
   * Sélectionne un référentiel
   * @param {number} frameIndex - Index du référentiel
   * @private
   */
  _selectReferenceFrame(frameIndex) {
    this._state.selectedFrameIndex = frameIndex;
    this.emit('referenceFrameSelected', { 
      frame: this._state.referenceFrames[frameIndex],
      index: frameIndex 
    });
  }
  
  /**
   * Trouve le cône contenant un point
   * @param {Object} worldPos - Position monde
   * @returns {number} Index du cône (-1 si aucun)
   * @private
   */
  _findContainingCone(worldPos) {
    return this.heatmapRenderer.findContainingCone(
      worldPos.x, 
      worldPos.t, 
      this._state.lightCones
    );
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
   * @returns {number} Index du référentiel (-1 si aucun)
   * @private
   */
  _findReferenceFrameAt(worldPos, threshold) {
    for (let i = 0; i < this._state.referenceFrames.length; i++) {
      const frame = this._state.referenceFrames[i];
      const distance = Math.sqrt(
        Math.pow(frame.x - worldPos.x, 2) + 
        Math.pow(frame.t - worldPos.t, 2)
      );
      if (distance <= threshold) {
        return i;
      }
    }
    return -1;
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
    this._state.selectedFrameIndex = this._state.referenceFrames.indexOf(frame);
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
    
    // 1. Dessiner la heatmap colorée des cônes de lumière
    if (this._config.rendering.showHeatmap && this._state.lightCones.length > 0) {
      this.heatmapRenderer.drawLightConeHeatmap(this._state.lightCones, this._config.bounds);
    }
    
    // 2. Dessiner les enveloppes des cônes (lignes blanches pointillées)
    if (this._config.rendering.showLightConeEnvelopes && this._state.lightCones.length > 0) {
      this.heatmapRenderer.drawLightConeEnvelopes(this._state.lightCones, this._config.bounds);
    }
    
    // 3. Dessiner les axes et labels
    this.heatmapRenderer.drawAxesAndLabels(this._config.bounds);
    
    // 4. Dessiner les chemins d'accélération (trajectoires)
    if (this._config.rendering.showTrajectories && this._state.referenceFrames.length > 1) {
      this._drawAccelerationPaths();
    }
    
    // 5. Dessiner les isochrones pour le référentiel sélectionné
    if (this._config.rendering.showIsochrones && this._state.selectedFrameIndex >= 0) {
      this._drawSelectedIsochrone();
    }
    
    // 6. Dessiner les points des référentiels avec sélection
    this._drawReferenceFramePoints();
    
    // 7. Dessiner les cartouches d'information
    if (this._config.rendering.showInfoBoxes && this._state.referenceFrames.length > 0) {
      this.infoBoxRenderer.drawAllInfoBoxes(
        this._state.referenceFrames, 
        this.physics, 
        this._state.selectedFrameIndex
      );
    }
    
    // 8. Mettre en surbrillance l'élément survolé
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
   * Dessine les chemins d'accélération entre référentiels
   * @private
   */
  _drawAccelerationPaths() {
    this.baseRenderer.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    this.baseRenderer.ctx.lineWidth = 2;
    this.baseRenderer.ctx.setLineDash([]);
    
    for (let i = 1; i < this._state.referenceFrames.length; i++) {
      const frame = this._state.referenceFrames[i];
      const sourceFrame = this._state.referenceFrames[frame.sourceIndex || 0];
      
      const startPos = this.baseRenderer.worldToScreen(sourceFrame.x, sourceFrame.t);
      const endPos = this.baseRenderer.worldToScreen(frame.x, frame.t);
      
      this.baseRenderer.ctx.beginPath();
      this.baseRenderer.ctx.moveTo(startPos.x, startPos.y);
      this.baseRenderer.ctx.lineTo(endPos.x, endPos.y);
      this.baseRenderer.ctx.stroke();
    }
  }
  
  /**
   * Dessine l'isochrone du référentiel sélectionné
   * @private
   */
  _drawSelectedIsochrone() {
    if (this._state.selectedFrameIndex <= 0) return;
    
    const selectedFrame = this._state.referenceFrames[this._state.selectedFrameIndex];
    const physics = this.physics.calculateCumulativePhysics(selectedFrame, this._state.referenceFrames);
    
    // Créer une isochrone temporaire
    const isochrone = new Isochrone({ x: 0, t: 0 }, physics.cumulativeProperTime);
    isochrone.setBounds(this._config.bounds);
    
    // Dessiner l'isochrone en orange
    this.baseRenderer.ctx.strokeStyle = '#ff9f4a';
    this.baseRenderer.ctx.lineWidth = 2;
    this.baseRenderer.ctx.setLineDash([]);
    
    const points = isochrone.getPoints();
    if (points.length > 1) {
      this.baseRenderer.ctx.beginPath();
      const firstPoint = this.baseRenderer.worldToScreen(points[0].x, points[0].t);
      this.baseRenderer.ctx.moveTo(firstPoint.x, firstPoint.y);
      
      for (let i = 1; i < points.length; i++) {
        const point = this.baseRenderer.worldToScreen(points[i].x, points[i].t);
        this.baseRenderer.ctx.lineTo(point.x, point.y);
      }
      
      this.baseRenderer.ctx.stroke();
    }
  }
  
  /**
   * Dessine les points des référentiels
   * @private
   */
  _drawReferenceFramePoints() {
    for (let i = 0; i < this._state.referenceFrames.length; i++) {
      const frame = this._state.referenceFrames[i];
      const screen = this.baseRenderer.worldToScreen(frame.x, frame.t);
      const isSelected = i === this._state.selectedFrameIndex;
      
      // Couleur selon le type
      const color = i === 0 ? '#4a9eff' : '#ff9f4a';
      
      // Effet de lueur
      this.baseRenderer.ctx.shadowBlur = 10;
      this.baseRenderer.ctx.shadowColor = color;
      
      // Point principal
      this.baseRenderer.ctx.fillStyle = color;
      this.baseRenderer.ctx.beginPath();
      this.baseRenderer.ctx.arc(screen.x, screen.y, 5, 0, Math.PI * 2);
      this.baseRenderer.ctx.fill();
      
      // Indicateur de sélection
      if (isSelected) {
        this.baseRenderer.ctx.shadowBlur = 0;
        this.baseRenderer.ctx.strokeStyle = 'white';
        this.baseRenderer.ctx.lineWidth = 2;
        this.baseRenderer.ctx.beginPath();
        this.baseRenderer.ctx.arc(screen.x, screen.y, 8, 0, Math.PI * 2);
        this.baseRenderer.ctx.stroke();
      }
      
      this.baseRenderer.ctx.shadowBlur = 0;
    }
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
    this._state.selectedFrameIndex = -1;
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
  
  /**
   * Crée le référentiel d'origine par défaut
   * @private
   */
  _createOriginFrame() {
    const originFrame = new ReferenceFrame(0, 0, {
      label: 'Origine',
      isOrigin: true
    });
    
    this._state.referenceFrames.push(originFrame);
    
    // Créer le cône de lumière associé
    const originCone = new LightCone(0, 0);
    this._state.lightCones.push(originCone);
    
    // Sélectionner l'origine par défaut
    this._state.selectedFrameIndex = 0;
  }
} 