/**
 * @fileoverview Gestionnaire d'état centralisé pour la visualisation
 * @author Serge Fantino
 * @version 2.0.0
 */

import EventEmitter from 'eventemitter3';
import { generateTwinParadoxDemo } from '@core/physics/trajectories.js';
import { ReferenceFrame } from '@core/entities/ReferenceFrame.js';

/**
 * Gestionnaire d'état centralisé pour l'application
 * @class StateManager
 * @extends EventEmitter
 */
export class StateManager extends EventEmitter {
  /**
   * Crée un nouveau gestionnaire d'état
   * @param {VisualizationEngine} engine - Moteur de visualisation
   * @param {ControlPanel} controlPanel - Panneau de contrôle
   */
  constructor(engine, controlPanel) {
    super();
    
    if (!engine || !controlPanel) {
      throw new Error('engine et controlPanel sont requis');
    }
    
    /**
     * Moteur de visualisation
     * @type {VisualizationEngine}
     * @readonly
     */
    this.engine = engine;
    
    /**
     * Panneau de contrôle
     * @type {ControlPanel}
     * @readonly
     */
    this.controlPanel = controlPanel;
    
    /**
     * État global de l'application
     * @type {Object}
     * @private
     */
    this._appState = {
      isInitialized: false,
      currentDemo: null,
      demoData: null,
      history: [],
      settings: {
        autoSave: true,
        showHints: true,
        animationSpeed: 1.0
      }
    };
    
    /**
     * Démonstrations disponibles
     * @type {Object}
     * @private
     */
    this._demos = {
      twinParadox: {
        name: 'Paradoxe des jumeaux',
        description: 'Démonstration du paradoxe des jumeaux avec voyage relativiste',
        icon: '👥',
        generator: this._generateTwinParadoxDemo.bind(this)
      },
      lightSpeed: {
        name: 'Vitesse de la lumière',
        description: 'Visualisation des cônes de lumière et causalité',
        icon: '💡',
        generator: this._generateLightSpeedDemo.bind(this)
      },
      timeTravel: {
        name: 'Voyage temporel',
        description: 'Exploration des limites causales',
        icon: '⏰',
        generator: this._generateTimeTravelDemo.bind(this)
      }
    };
    
    // Initialiser les connexions
    this._setupConnections();
    
    // Synchroniser l'état initial
    this._syncInitialState();
    
    this._appState.isInitialized = true;
    this.emit('initialized');
  }
  
  /**
   * Configure les connexions entre les modules
   * @private
   */
  _setupConnections() {
    // Écouter les changements du panneau de contrôle
    this.controlPanel.on('valueChanged', (event) => {
      this._handleControlChange(event);
    });
    
    this.controlPanel.on('resetView', () => {
      this._resetView();
    });
    
    this.controlPanel.on('centerView', () => {
      this._centerView();
    });
    
    this.controlPanel.on('showDemo', (event) => {
      this._showDemo(event.type);
    });
    
    this.controlPanel.on('generateIsochrones', (event) => {
      this._generateIsochrones(event);
    });
    
    this.controlPanel.on('clearAll', () => {
      this._clearAll();
    });
    
    this.controlPanel.on('exportImage', () => {
      this._exportImage();
    });
    
    this.controlPanel.on('themeChanged', (event) => {
      this._handleThemeChange(event);
    });
    
    this.controlPanel.on('qualityChanged', (event) => {
      this._handleQualityChange(event);
    });
    
    // Écouter les événements du moteur
    this.engine.on('referenceFrameCreated', (event) => {
      this._handleFrameCreated(event);
    });
    
    this.engine.on('referenceFrameSelected', (event) => {
      this._handleFrameSelected(event);
    });
    
    this.engine.on('hoverChanged', (event) => {
      this._handleHoverChanged(event);
    });
    
    this.engine.on('viewChanged', (event) => {
      this._handleViewChanged(event);
    });
    
    this.engine.on('rendered', (event) => {
      this._handleRenderStats(event);
    });
  }
  
  /**
   * Synchronise l'état initial entre les modules
   * @private
   */
  _syncInitialState() {
    const controlValues = this.controlPanel.getValues();
    
    // Appliquer la configuration initiale au moteur
    this.engine.updateConfig({
      rendering: {
        showGrid: controlValues.showGrid,
        showLightCones: controlValues.showLightCones,
        showTrajectories: controlValues.showTrajectories,
        showIsochrones: controlValues.showIsochrones
      }
    });
    
    // Démarrer le moteur
    this.engine.start();
    
    // Mettre à jour le statut
    this.controlPanel.setStatus('Prêt - Cliquez pour créer un référentiel');
  }
  
  /**
   * Gère les changements de contrôles
   * @param {Object} event - Événement de changement
   * @private
   */
  _handleControlChange(event) {
    const { key, value } = event;
    
    // Mapper les contrôles vers la configuration du moteur
    const configMap = {
      showGrid: 'rendering.showGrid',
      showLightCones: 'rendering.showLightCones', 
      showTrajectories: 'rendering.showTrajectories',
      showIsochrones: 'rendering.showIsochrones',
      gridSpacing: 'rendering.gridSpacing'
    };
    
    if (configMap[key]) {
      const configPath = configMap[key].split('.');
      const config = {};
      
      if (configPath.length === 2) {
        config[configPath[0]] = { [configPath[1]]: value };
      } else {
        config[configPath[0]] = value;
      }
      
      this.engine.updateConfig(config);
    }
    
    // Sauvegarder l'état si activé
    if (this._appState.settings.autoSave) {
      this._saveState();
    }
    
    this.emit('stateChanged', { key, value });
  }
  
  /**
   * Remet à zéro la vue
   * @private
   */
  _resetView() {
    this.engine.updateConfig({
      bounds: {
        minX: -10,
        maxX: 10,
        minT: -5,
        maxT: 15
      }
    });
    
    this.controlPanel.setStatus('Vue réinitialisée');
    this.emit('viewReset');
  }
  
  /**
   * Centre la vue sur les éléments
   * @private
   */
  _centerView() {
    const state = this.engine.getState();
    const frames = state.referenceFrames;
    
    if (frames.length === 0) {
      this._resetView();
      return;
    }
    
    // Calculer les limites des référentiels
    const bounds = frames.reduce((acc, frame) => ({
      minX: Math.min(acc.minX, frame.x),
      maxX: Math.max(acc.maxX, frame.x),
      minT: Math.min(acc.minT, frame.t),
      maxT: Math.max(acc.maxT, frame.t)
    }), {
      minX: frames[0].x,
      maxX: frames[0].x,
      minT: frames[0].t,
      maxT: frames[0].t
    });
    
    // Ajouter des marges
    const marginX = (bounds.maxX - bounds.minX) * 0.2 || 2;
    const marginT = (bounds.maxT - bounds.minT) * 0.2 || 2;
    
    this.engine.updateConfig({
      bounds: {
        minX: bounds.minX - marginX,
        maxX: bounds.maxX + marginX,
        minT: bounds.minT - marginT,
        maxT: bounds.maxT + marginT
      }
    });
    
    this.controlPanel.setStatus('Vue centrée sur les éléments');
    this.emit('viewCentered');
  }
  
  /**
   * Affiche une démonstration
   * @param {string} demoType - Type de démonstration
   * @private
   */
  _showDemo(demoType) {
    const demo = this._demos[demoType];
    if (!demo) {
      console.error(`Démonstration inconnue: ${demoType}`);
      return;
    }
    
    this.controlPanel.setStatus(`Génération: ${demo.name}...`);
    
    try {
      // Effacer l'état actuel
      this.engine.reset();
      
      // Générer la démonstration
      const demoData = demo.generator();
      
      // Appliquer les données
      this._applyDemoData(demoData);
      
      // Sauvegarder l'état de la démo
      this._appState.currentDemo = demoType;
      this._appState.demoData = demoData;
      
      this.controlPanel.setStatus(`${demo.name} - ${demo.description}`);
      this.emit('demoShown', { type: demoType, data: demoData });
      
    } catch (error) {
      console.error('Erreur lors de la génération de la démo:', error);
      this.controlPanel.setStatus('Erreur lors de la génération');
    }
  }
  
  /**
   * Génère la démonstration du paradoxe des jumeaux
   * @returns {Object} Données de la démonstration
   * @private
   */
  _generateTwinParadoxDemo() {
    const controlValues = this.controlPanel.getValues();
    
    return generateTwinParadoxDemo({
      earthFrame: { x: 0, t: 0 },
      travelVelocity: controlValues.velocity,
      acceleration: controlValues.acceleration,
      travelTime: controlValues.properTime * 2,
      returnTime: controlValues.properTime * 2
    });
  }
  
  /**
   * Génère la démonstration de la vitesse de la lumière
   * @returns {Object} Données de la démonstration
   * @private
   */
  _generateLightSpeedDemo() {
    const frames = [];
    const lightCones = [];
    
    // Créer plusieurs sources de lumière
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * 4;
      const t = i * 2;
      
      frames.push(new ReferenceFrame(x, t, {
        label: `Source ${i + 1}`,
        color: `hsl(${i * 120}, 70%, 60%)`
      }));
    }
    
    return {
      type: 'lightSpeed',
      frames,
      lightCones,
      bounds: { minX: -8, maxX: 8, minT: -2, maxT: 12 },
      settings: {
        showGrid: true,
        showLightCones: true,
        showTrajectories: false,
        showIsochrones: false
      }
    };
  }
  
  /**
   * Génère la démonstration du voyage temporel
   * @returns {Object} Données de la démonstration
   * @private
   */
  _generateTimeTravelDemo() {
    const frames = [];
    
    // Créer une trajectoire qui explore les limites causales
    const points = [
      { x: 0, t: 0 },
      { x: 2, t: 3 },
      { x: 4, t: 5 },
      { x: 2, t: 8 },
      { x: 0, t: 10 }
    ];
    
    points.forEach((point, index) => {
      frames.push(new ReferenceFrame(point.x, point.t, {
        label: `T${index}`,
        metadata: { step: index }
      }));
    });
    
    return {
      type: 'timeTravel',
      frames,
      bounds: { minX: -2, maxX: 6, minT: -1, maxT: 12 },
      settings: {
        showGrid: true,
        showLightCones: true,
        showTrajectories: true,
        showIsochrones: true
      }
    };
  }
  
  /**
   * Applique les données d'une démonstration
   * @param {Object} demoData - Données de la démonstration
   * @private
   */
  _applyDemoData(demoData) {
    // Appliquer les référentiels
    if (demoData.frames) {
      demoData.frames.forEach(frame => {
        this.engine.addReferenceFrame(frame);
      });
    }
    
    // Appliquer les paramètres
    if (demoData.settings) {
      this.engine.updateConfig({ rendering: demoData.settings });
      this.controlPanel.setValues(demoData.settings);
    }
    
    // Appliquer les limites de vue
    if (demoData.bounds) {
      this.engine.updateConfig({ bounds: demoData.bounds });
    }
    
    // Générer les isochrones si demandé
    if (demoData.settings?.showIsochrones) {
      this.engine.generateIsochrones();
    }
  }
  
  /**
   * Génère des isochrones
   * @param {Object} event - Événement de génération
   * @private
   */
  _generateIsochrones(event) {
    const { properTime } = event;
    
    // Générer une série d'isochrones
    const properTimes = [];
    for (let i = 1; i <= 5; i++) {
      properTimes.push(properTime * i / 2);
    }
    
    this.engine.generateIsochrones({
      properTimes,
      origin: { x: 0, t: 0 }
    });
    
    // Activer l'affichage des isochrones
    this.controlPanel.setValues({ showIsochrones: true });
    
    this.controlPanel.setStatus(`${properTimes.length} isochrones générées`);
    this.emit('isochronesGenerated', { properTimes });
  }
  
  /**
   * Efface tous les éléments
   * @private
   */
  _clearAll() {
    this.engine.reset();
    this._appState.currentDemo = null;
    this._appState.demoData = null;
    
    this.controlPanel.setStatus('Tout effacé - Cliquez pour créer un référentiel');
    this.emit('cleared');
  }
  
  /**
   * Exporte l'image actuelle
   * @private
   */
  _exportImage() {
    try {
      const canvas = this.engine.baseRenderer.canvas;
      const link = document.createElement('a');
      
      link.download = `cones-lumiere-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      this.controlPanel.setStatus('Image exportée');
      this.emit('imageExported');
      
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      this.controlPanel.setStatus('Erreur lors de l\'export');
    }
  }
  
  /**
   * Gère le changement de thème
   * @param {Object} event - Événement de changement
   * @private
   */
  _handleThemeChange(event) {
    const { theme } = event;
    
    // Appliquer le thème au moteur si nécessaire
    const backgroundColor = theme === 'dark' ? '#0a0a0a' : '#f5f5f5';
    this.engine.baseRenderer.updateConfig({ backgroundColor });
    
    this.emit('themeChanged', { theme });
  }
  
  /**
   * Gère le changement de qualité
   * @param {Object} event - Événement de changement
   * @private
   */
  _handleQualityChange(event) {
    const { quality } = event;
    
    // Mapper la qualité vers les paramètres de rendu
    const qualityMap = {
      low: { antialias: false, pixelRatio: 1 },
      medium: { antialias: true, pixelRatio: 1 },
      high: { antialias: true, pixelRatio: window.devicePixelRatio || 1 }
    };
    
    const settings = qualityMap[quality];
    if (settings) {
      this.engine.baseRenderer.updateConfig(settings);
      this.controlPanel.setStatus(`Qualité: ${quality}`);
    }
    
    this.emit('qualityChanged', { quality });
  }
  
  /**
   * Gère la création d'un référentiel
   * @param {Object} event - Événement de création
   * @private
   */
  _handleFrameCreated(event) {
    const { frame } = event;
    
    // Ajouter à l'historique
    this._appState.history.push({
      type: 'frameCreated',
      frame: frame.serialize(),
      timestamp: Date.now()
    });
    
    this.controlPanel.setStatus(`Référentiel créé à (${frame.x.toFixed(1)}, ${frame.t.toFixed(1)})`);
    this.emit('frameCreated', event);
  }
  
  /**
   * Gère la sélection d'un référentiel
   * @param {Object} event - Événement de sélection
   * @private
   */
  _handleFrameSelected(event) {
    const { frame } = event;
    
    this.controlPanel.setStatus(`Référentiel sélectionné: (${frame.x.toFixed(1)}, ${frame.t.toFixed(1)})`);
    this.emit('frameSelected', event);
  }
  
  /**
   * Gère les changements de survol
   * @param {Object} event - Événement de survol
   * @private
   */
  _handleHoverChanged(event) {
    const { element } = event;
    
    if (element) {
      const type = element.type;
      const pos = element.element;
      
      if (type === 'referenceFrame') {
        this.controlPanel.setStatus(`Survol référentiel: (${pos.x.toFixed(1)}, ${pos.t.toFixed(1)})`);
      } else if (type === 'isochrone') {
        this.controlPanel.setStatus(`Survol isochrone: τ = ${pos.properTime.toFixed(1)}`);
      }
    } else {
      this.controlPanel.setStatus('Prêt');
    }
  }
  
  /**
   * Gère les changements de vue
   * @param {Object} event - Événement de changement de vue
   * @private
   */
  _handleViewChanged(event) {
    const { type } = event;
    
    if (type === 'pan') {
      this.controlPanel.setStatus('Vue déplacée');
    } else if (type === 'zoom') {
      this.controlPanel.setStatus('Zoom modifié');
    }
  }
  
  /**
   * Gère les statistiques de rendu
   * @param {Object} event - Événement de rendu
   * @private
   */
  _handleRenderStats(event) {
    const state = this.engine.getState();
    const fps = state.stats.fps;
    
    this.controlPanel.setFPS(fps);
  }
  
  /**
   * Sauvegarde l'état actuel
   * @private
   */
  _saveState() {
    const state = {
      config: this.engine.getState().config,
      controlValues: this.controlPanel.getValues(),
      currentDemo: this._appState.currentDemo,
      timestamp: Date.now()
    };
    
    localStorage.setItem('lightConeVisualization', JSON.stringify(state));
  }
  
  /**
   * Charge un état sauvegardé
   * @returns {boolean} Succès du chargement
   */
  loadState() {
    try {
      const saved = localStorage.getItem('lightConeVisualization');
      if (!saved) return false;
      
      const state = JSON.parse(saved);
      
      // Restaurer la configuration
      if (state.config) {
        this.engine.updateConfig(state.config);
      }
      
      // Restaurer les contrôles
      if (state.controlValues) {
        this.controlPanel.setValues(state.controlValues);
      }
      
      // Restaurer la démo si applicable
      if (state.currentDemo) {
        this._showDemo(state.currentDemo);
      }
      
      this.controlPanel.setStatus('État restauré');
      this.emit('stateLoaded', state);
      
      return true;
      
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      return false;
    }
  }
  
  /**
   * Obtient l'état complet de l'application
   * @returns {Object} État complet
   */
  getFullState() {
    return {
      app: { ...this._appState },
      engine: this.engine.getState(),
      controls: this.controlPanel.getValues()
    };
  }
  
  /**
   * Obtient la liste des démonstrations disponibles
   * @returns {Object} Démonstrations disponibles
   */
  getAvailableDemos() {
    return Object.entries(this._demos).map(([key, demo]) => ({
      id: key,
      name: demo.name,
      description: demo.description,
      icon: demo.icon
    }));
  }
  
  /**
   * Détruit le gestionnaire d'état
   */
  destroy() {
    // Sauvegarder l'état final
    if (this._appState.settings.autoSave) {
      this._saveState();
    }
    
    // Nettoyer les références
    this._appState = {};
    
    this.removeAllListeners();
    this.emit('destroyed');
  }
} 