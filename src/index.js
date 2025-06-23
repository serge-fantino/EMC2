/**
 * @fileoverview Point d'entrée principal de l'application de visualisation des cônes de lumière
 * @author Serge Fantino
 * @version 2.0.0
 */

import { VisualizationEngine } from '@core/VisualizationEngine.js';
import { ControlPanel } from '@ui/components/ControlPanel.js';
import { StateManager } from '@ui/components/StateManager.js';

/**
 * Classe principale de l'application
 * @class LightConeVisualization
 */
export class LightConeVisualization {
  /**
   * Crée une nouvelle instance de l'application
   * @param {Object} config - Configuration de l'application
   * @param {HTMLCanvasElement} config.canvas - Élément canvas pour le rendu
   * @param {HTMLElement} config.controlContainer - Conteneur pour le panneau de contrôle
   * @param {Object} [config.options] - Options supplémentaires
   */
  constructor(config) {
    if (!config.canvas || !config.controlContainer) {
      throw new Error('canvas et controlContainer sont requis');
    }
    
    /**
     * Configuration de l'application
     * @type {Object}
     * @readonly
     */
    this.config = {
      canvas: config.canvas,
      controlContainer: config.controlContainer,
      options: {
        autoStart: true,
        enableKeyboardShortcuts: true,
        theme: 'dark',
        ...config.options
      }
    };
    
    /**
     * Modules de l'application
     * @type {Object}
     * @private
     */
    this._modules = {};
    
    /**
     * État de l'application
     * @type {Object}
     * @private
     */
    this._state = {
      isInitialized: false,
      isRunning: false,
      hasError: false,
      errorMessage: null
    };
    
    // Initialiser l'application
    this._initialize();
  }
  
  /**
   * Initialise tous les modules de l'application
   * @private
   */
  async _initialize() {
    try {
      console.log("🚀 Initialisation de la visualisation des cônes de lumière...");
      
      // Étape 1: Créer le moteur de visualisation
      console.log("⚛️ Création du moteur de visualisation...");
      this._modules.engine = new VisualizationEngine(this.config.canvas, {
        rendering: {
          antialiasing: true,
          backgroundColor: this.config.options.theme === 'dark' ? '#0a0a0a' : '#f5f5f5'
        }
      });
      
      // Étape 2: Créer le panneau de contrôle
      console.log("🎛️ Création du panneau de contrôle...");
      this._modules.controlPanel = new ControlPanel(this.config.controlContainer, {
        theme: this.config.options.theme,
        collapsible: true
      });
      
      // Étape 3: Créer le gestionnaire d'état
      console.log("🔗 Création du gestionnaire d'état...");
      this._modules.stateManager = new StateManager(
        this._modules.engine,
        this._modules.controlPanel
      );
      
      // Étape 4: Configurer les raccourcis clavier
      if (this.config.options.enableKeyboardShortcuts) {
        this._setupKeyboardShortcuts();
      }
      
      // Étape 5: Configurer la gestion d'erreurs
      this._setupErrorHandling();
      
      // Étape 6: Charger l'état sauvegardé si disponible
      this._loadSavedState();
      
      // Marquer comme initialisé
      this._state.isInitialized = true;
      
      // Démarrer automatiquement si configuré
      if (this.config.options.autoStart) {
        this.start();
      }
      
      console.log("✅ Application initialisée avec succès !");
      
    } catch (error) {
      this._handleError("Erreur lors de l'initialisation", error);
    }
  }
  
  /**
   * Configure les raccourcis clavier
   * @private
   */
  _setupKeyboardShortcuts() {
    const shortcuts = {
      // Contrôles de vue
      'r': () => this._modules.stateManager.emit('resetView'),
      'c': () => this._modules.stateManager.emit('centerView'),
      
      // Basculer les éléments d'affichage
      'g': () => this._toggleDisplay('showGrid'),
      'l': () => this._toggleDisplay('showLightCones'),
      't': () => this._toggleDisplay('showTrajectories'),
      'i': () => this._toggleDisplay('showIsochrones'),
      
      // Actions
      'Delete': () => this._modules.stateManager.emit('clearAll'),
      'Escape': () => this._modules.controlPanel.toggleCollapse(),
      
      // Démonstrations (avec Ctrl)
      '1': (e) => e.ctrlKey && this._modules.stateManager.emit('showDemo', { type: 'twinParadox' }),
      '2': (e) => e.ctrlKey && this._modules.stateManager.emit('showDemo', { type: 'lightSpeed' }),
      '3': (e) => e.ctrlKey && this._modules.stateManager.emit('showDemo', { type: 'timeTravel' }),
      
      // Export
      's': (e) => e.ctrlKey && this._modules.stateManager.emit('exportImage')
    };
    
    document.addEventListener('keydown', (event) => {
      const key = event.key;
      const handler = shortcuts[key];
      
      if (handler && typeof handler === 'function') {
        // Éviter les conflits avec les champs de saisie
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
          return;
        }
        
        event.preventDefault();
        handler(event);
      }
    });
    
    console.log("⌨️ Raccourcis clavier configurés");
  }
  
  /**
   * Bascule l'affichage d'un élément
   * @param {string} displayKey - Clé d'affichage à basculer
   * @private
   */
  _toggleDisplay(displayKey) {
    const currentValues = this._modules.controlPanel.getValues();
    const newValue = !currentValues[displayKey];
    
    this._modules.controlPanel.setValues({ [displayKey]: newValue });
  }
  
  /**
   * Configure la gestion d'erreurs
   * @private
   */
  _setupErrorHandling() {
    // Écouter les erreurs de tous les modules
    Object.values(this._modules).forEach(module => {
      if (module.on) {
        module.on('error', (error) => {
          this._handleError('Erreur de module', error);
        });
      }
    });
    
    // Écouter les erreurs globales
    window.addEventListener('error', (event) => {
      this._handleError('Erreur JavaScript', event.error);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      this._handleError('Promesse rejetée', event.reason);
    });
  }
  
  /**
   * Charge l'état sauvegardé
   * @private
   */
  _loadSavedState() {
    try {
      const loaded = this._modules.stateManager.loadState();
      if (loaded) {
        console.log("💾 État précédent restauré");
      }
    } catch (error) {
      console.warn("⚠️ Impossible de charger l'état sauvegardé:", error);
    }
  }
  
  /**
   * Gère les erreurs de l'application
   * @param {string} context - Contexte de l'erreur
   * @param {Error} error - Erreur survenue
   * @private
   */
  _handleError(context, error) {
    console.error(`❌ ${context}:`, error);
    
    this._state.hasError = true;
    this._state.errorMessage = `${context}: ${error.message}`;
    
    // Afficher l'erreur dans le panneau de contrôle si disponible
    if (this._modules.controlPanel) {
      this._modules.controlPanel.setStatus(`Erreur: ${error.message}`);
    }
    
    // Émettre l'événement d'erreur
    this.emit?.('error', { context, error });
  }
  
  /**
   * Démarre l'application
   */
  start() {
    if (!this._state.isInitialized) {
      throw new Error("L'application n'est pas encore initialisée");
    }
    
    if (this._state.isRunning) {
      console.warn("⚠️ L'application est déjà en cours d'exécution");
      return;
    }
    
    try {
      // Démarrer le moteur de visualisation
      this._modules.engine.start();
      
      this._state.isRunning = true;
      console.log("▶️ Application démarrée");
      
    } catch (error) {
      this._handleError("Erreur lors du démarrage", error);
    }
  }
  
  /**
   * Arrête l'application
   */
  stop() {
    if (!this._state.isRunning) {
      return;
    }
    
    try {
      // Arrêter le moteur de visualisation
      this._modules.engine.stop();
      
      this._state.isRunning = false;
      console.log("⏸️ Application arrêtée");
      
    } catch (error) {
      this._handleError("Erreur lors de l'arrêt", error);
    }
  }
  
  /**
   * Redémarre l'application
   */
  restart() {
    console.log('🔄 Redémarrage de l\'application...');
    this.stop();
    this.start();
  }
  
  /**
   * Obtient l'état complet de l'application
   * @returns {Object} État de l'application
   */
  getState() {
    return {
      app: { ...this._state },
      modules: this._modules.stateManager?.getFullState() || {}
    };
  }
  
  /**
   * Obtient les statistiques de performance
   * @returns {Object} Statistiques
   */
  getStats() {
    if (!this._modules.engine) return {};
    
    const engineStats = this._modules.engine.getState().stats;
    const fullState = this._modules.stateManager.getFullState();
    
    return {
      performance: {
        fps: engineStats.fps,
        frameCount: engineStats.frameCount,
        isRendering: engineStats.isRendering
      },
      content: {
        referenceFrames: fullState.engine.referenceFrames.length,
        lightCones: fullState.engine.lightCones.length,
        isochrones: fullState.engine.isochrones.length
      },
      memory: {
        // Estimation basique de l'utilisation mémoire
        estimatedMB: Math.round(
          (fullState.engine.referenceFrames.length * 0.1 +
           fullState.engine.lightCones.length * 0.2 +
           fullState.engine.isochrones.length * 0.5) * 100
        ) / 100
      }
    };
  }
  
  /**
   * Exporte la configuration actuelle
   * @returns {Object} Configuration exportable
   */
  exportConfig() {
    const fullState = this._modules.stateManager.getFullState();
    
    return {
      version: '2.0.0',
      timestamp: Date.now(),
      config: fullState.engine.config,
      controls: fullState.controls,
      demo: fullState.app.currentDemo
    };
  }
  
  /**
   * Importe une configuration
   * @param {Object} config - Configuration à importer
   */
  importConfig(config) {
    if (!config || config.version !== '2.0.0') {
      throw new Error('Configuration invalide ou version incompatible');
    }
    
    try {
      // Appliquer la configuration au moteur
      if (config.config) {
        this._modules.engine.updateConfig(config.config);
      }
      
      // Appliquer les contrôles
      if (config.controls) {
        this._modules.controlPanel.setValues(config.controls);
      }
      
      // Charger la démo si spécifiée
      if (config.demo) {
        this._modules.stateManager.emit('showDemo', { type: config.demo });
      }
      
      console.log('📥 Configuration importée avec succès');
      
    } catch (error) {
      this._handleError('Erreur lors de l\'import', error);
    }
  }
  
  /**
   * Détruit l'application et libère toutes les ressources
   */
  destroy() {
    console.log('🗑️ Destruction de l\'application...');
    
    try {
      // Arrêter l'application
      this.stop();
      
      // Détruire tous les modules dans l'ordre inverse
      if (this._modules.stateManager) {
        this._modules.stateManager.destroy();
      }
      
      if (this._modules.controlPanel) {
        this._modules.controlPanel.destroy();
      }
      
      if (this._modules.engine) {
        this._modules.engine.destroy();
      }
      
      // Nettoyer les références
      this._modules = {};
      this._state = {};
      
      console.log('✅ Application détruite');
      
    } catch (error) {
      console.error('❌ Erreur lors de la destruction:', error);
    }
  }
}

/**
 * Fonction d'initialisation rapide
 * @param {string} canvasId - ID de l'élément canvas
 * @param {string} controlId - ID du conteneur de contrôles
 * @param {Object} [options] - Options supplémentaires
 * @returns {LightConeVisualization} Instance de l'application
 */
export function initializeLightConeVisualization(canvasId, controlId, options = {}) {
  const canvas = document.getElementById(canvasId);
  const controlContainer = document.getElementById(controlId);
  
  if (!canvas) {
    throw new Error(`Élément canvas avec l'ID '${canvasId}' introuvable`);
  }
  
  if (!controlContainer) {
    throw new Error(`Conteneur de contrôles avec l'ID '${controlId}' introuvable`);
  }
  
  return new LightConeVisualization({
    canvas,
    controlContainer,
    options
  });
}

/**
 * Export par défaut pour utilisation directe
 */
export default LightConeVisualization; 