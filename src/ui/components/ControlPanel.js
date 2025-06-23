/**
 * @fileoverview Panneau de contrôle pour la visualisation des cônes de lumière
 * @author Serge Fantino
 * @version 2.0.0
 */

import EventEmitter from 'eventemitter3';

/**
 * Panneau de contrôle pour l'interface utilisateur
 * @class ControlPanel
 * @extends EventEmitter
 */
export class ControlPanel extends EventEmitter {
  /**
   * Crée un nouveau panneau de contrôle
   * @param {HTMLElement} container - Conteneur HTML pour le panneau
   * @param {Object} [options] - Options de configuration
   */
  constructor(container, options = {}) {
    super();
    
    if (!container || !(container instanceof HTMLElement)) {
      throw new Error('Un conteneur HTML valide est requis');
    }
    
    /**
     * Conteneur principal
     * @type {HTMLElement}
     * @readonly
     */
    this.container = container;
    
    /**
     * Configuration du panneau
     * @type {Object}
     * @private
     */
    this._config = {
      collapsible: true,
      theme: 'dark',
      position: 'right',
      width: '300px',
      ...options
    };
    
    /**
     * État du panneau
     * @type {Object}
     * @private
     */
    this._state = {
      isCollapsed: false,
      activeTab: 'visualization',
      values: {
        showGrid: true,
        showLightCones: true,
        showTrajectories: true,
        showIsochrones: false,
        velocity: 0.5,
        acceleration: 1.0,
        properTime: 2.0,
        gridSpacing: 1.0
      }
    };
    
    /**
     * Éléments DOM
     * @type {Object}
     * @private
     */
    this._elements = {};
    
    // Construire l'interface
    this._buildInterface();
    
    // Configurer les événements
    this._setupEventListeners();
    
    this.emit('initialized');
  }
  
  /**
   * Construit l'interface du panneau
   * @private
   */
  _buildInterface() {
    // Appliquer les styles de base
    this._applyBaseStyles();
    
    // Structure principale
    this.container.innerHTML = `
      <div class="control-panel" data-theme="${this._config.theme}">
        <div class="panel-header">
          <h3 class="panel-title">
            <span class="title-icon">⚛️</span>
            Cônes de Lumière Relativistes
          </h3>
          ${this._config.collapsible ? '<button class="collapse-btn" title="Réduire/Étendre">▼</button>' : ''}
        </div>
        
        <div class="panel-content">
          <div class="tabs">
            <button class="tab-btn active" data-tab="visualization">
              <span class="tab-icon">👁️</span>
              Visualisation
            </button>
            <button class="tab-btn" data-tab="physics">
              <span class="tab-icon">⚡</span>
              Physique
            </button>
            <button class="tab-btn" data-tab="tools">
              <span class="tab-icon">🛠️</span>
              Outils
            </button>
          </div>
          
          <div class="tab-content">
            ${this._buildVisualizationTab()}
            ${this._buildPhysicsTab()}
            ${this._buildToolsTab()}
          </div>
        </div>
        
        <div class="panel-footer">
          <div class="status-bar">
            <span class="status-text">Prêt</span>
            <span class="fps-counter">60 FPS</span>
          </div>
        </div>
      </div>
    `;
    
    // Récupérer les références des éléments
    this._cacheElements();
  }
  
  /**
   * Construit l'onglet de visualisation
   * @returns {string} HTML de l'onglet
   * @private
   */
  _buildVisualizationTab() {
    return `
      <div class="tab-panel active" data-tab="visualization">
        <div class="control-group">
          <h4 class="group-title">Affichage</h4>
          
          <label class="control-item checkbox-item">
            <input type="checkbox" id="showGrid" ${this._state.values.showGrid ? 'checked' : ''}>
            <span class="checkbox-custom"></span>
            <span class="control-label">Grille d'espace-temps</span>
          </label>
          
          <label class="control-item checkbox-item">
            <input type="checkbox" id="showLightCones" ${this._state.values.showLightCones ? 'checked' : ''}>
            <span class="checkbox-custom"></span>
            <span class="control-label">Cônes de lumière</span>
          </label>
          
          <label class="control-item checkbox-item">
            <input type="checkbox" id="showTrajectories" ${this._state.values.showTrajectories ? 'checked' : ''}>
            <span class="checkbox-custom"></span>
            <span class="control-label">Trajectoires</span>
          </label>
          
          <label class="control-item checkbox-item">
            <input type="checkbox" id="showIsochrones" ${this._state.values.showIsochrones ? 'checked' : ''}>
            <span class="checkbox-custom"></span>
            <span class="control-label">Isochrones</span>
          </label>
        </div>
        
        <div class="control-group">
          <h4 class="group-title">Vue</h4>
          
          <div class="control-item">
            <label class="control-label">Espacement grille</label>
            <div class="slider-container">
              <input type="range" id="gridSpacing" min="0.1" max="5" step="0.1" value="${this._state.values.gridSpacing}">
              <span class="slider-value">${this._state.values.gridSpacing}</span>
            </div>
          </div>
          
          <div class="button-group">
            <button class="btn btn-secondary" id="resetView">🔄 Réinitialiser vue</button>
            <button class="btn btn-secondary" id="centerView">🎯 Centrer</button>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Construit l'onglet de physique
   * @returns {string} HTML de l'onglet
   * @private
   */
  _buildPhysicsTab() {
    return `
      <div class="tab-panel" data-tab="physics">
        <div class="control-group">
          <h4 class="group-title">Paramètres relativistes</h4>
          
          <div class="control-item">
            <label class="control-label">Vitesse (v/c)</label>
            <div class="slider-container">
              <input type="range" id="velocity" min="0" max="0.99" step="0.01" value="${this._state.values.velocity}">
              <span class="slider-value">${this._state.values.velocity}</span>
            </div>
            <div class="physics-info">
              <span class="info-label">γ = </span>
              <span class="gamma-value">${this._calculateGamma(this._state.values.velocity).toFixed(2)}</span>
            </div>
          </div>
          
          <div class="control-item">
            <label class="control-label">Accélération propre (c/s²)</label>
            <div class="slider-container">
              <input type="range" id="acceleration" min="0.1" max="10" step="0.1" value="${this._state.values.acceleration}">
              <span class="slider-value">${this._state.values.acceleration}</span>
            </div>
          </div>
          
          <div class="control-item">
            <label class="control-label">Temps propre τ</label>
            <div class="slider-container">
              <input type="range" id="properTime" min="0.5" max="10" step="0.1" value="${this._state.values.properTime}">
              <span class="slider-value">${this._state.values.properTime}</span>
            </div>
          </div>
        </div>
        
        <div class="control-group">
          <h4 class="group-title">Démonstrations</h4>
          
          <div class="button-group vertical">
            <button class="btn btn-primary" id="twinParadox">👥 Paradoxe des jumeaux</button>
            <button class="btn btn-primary" id="lightSpeed">💡 Vitesse de la lumière</button>
            <button class="btn btn-primary" id="timeTravel">⏰ Voyage temporel</button>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Construit l'onglet des outils
   * @returns {string} HTML de l'onglet
   * @private
   */
  _buildToolsTab() {
    return `
      <div class="tab-panel" data-tab="tools">
        <div class="control-group">
          <h4 class="group-title">Actions</h4>
          
          <div class="button-group vertical">
            <button class="btn btn-success" id="generateIsochrones">📈 Générer isochrones</button>
            <button class="btn btn-warning" id="clearAll">🗑️ Tout effacer</button>
            <button class="btn btn-info" id="exportImage">📷 Exporter image</button>
          </div>
        </div>
        
        <div class="control-group">
          <h4 class="group-title">Configuration</h4>
          
          <div class="control-item">
            <label class="control-label">Thème</label>
            <select id="theme" class="select-input">
              <option value="dark" ${this._config.theme === 'dark' ? 'selected' : ''}>Sombre</option>
              <option value="light" ${this._config.theme === 'light' ? 'selected' : ''}>Clair</option>
            </select>
          </div>
          
          <div class="control-item">
            <label class="control-label">Qualité de rendu</label>
            <select id="quality" class="select-input">
              <option value="low">Basse</option>
              <option value="medium" selected>Moyenne</option>
              <option value="high">Haute</option>
            </select>
          </div>
        </div>
        
        <div class="control-group">
          <h4 class="group-title">Aide</h4>
          
          <div class="help-content">
            <p><strong>Interactions :</strong></p>
            <ul class="help-list">
              <li>🖱️ Clic : Créer référentiel</li>
              <li>🖱️ Double-clic : Sélectionner</li>
              <li>🖱️ Glisser : Déplacer la vue</li>
              <li>🖱️ Molette : Zoomer</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Applique les styles CSS de base
   * @private
   */
  _applyBaseStyles() {
    if (document.getElementById('control-panel-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'control-panel-styles';
    styles.textContent = `
      .control-panel {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: var(--panel-bg);
        border: 1px solid var(--panel-border);
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        overflow: hidden;
        transition: all 0.3s ease;
        user-select: none;
      }
      
      .control-panel[data-theme="dark"] {
        --panel-bg: #1a1a1a;
        --panel-border: #333;
        --text-primary: #ffffff;
        --text-secondary: #b0b0b0;
        --accent-color: #4CAF50;
        --button-bg: #2d2d2d;
        --button-hover: #3d3d3d;
        --input-bg: #2d2d2d;
        --input-border: #444;
      }
      
      .control-panel[data-theme="light"] {
        --panel-bg: #ffffff;
        --panel-border: #ddd;
        --text-primary: #333333;
        --text-secondary: #666666;
        --accent-color: #2196F3;
        --button-bg: #f5f5f5;
        --button-hover: #e0e0e0;
        --input-bg: #ffffff;
        --input-border: #ccc;
      }
      
      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        background: linear-gradient(135deg, var(--accent-color), #673AB7);
        color: white;
      }
      
      .panel-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .collapse-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .collapse-btn:hover {
        background: rgba(255, 255, 255, 0.3);
      }
      
      .panel-content {
        color: var(--text-primary);
      }
      
      .tabs {
        display: flex;
        background: var(--button-bg);
        border-bottom: 1px solid var(--panel-border);
      }
      
      .tab-btn {
        flex: 1;
        padding: 12px 8px;
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        font-size: 12px;
      }
      
      .tab-btn:hover {
        background: var(--button-hover);
      }
      
      .tab-btn.active {
        background: var(--accent-color);
        color: white;
      }
      
      .tab-content {
        max-height: 500px;
        overflow-y: auto;
      }
      
      .tab-panel {
        display: none;
        padding: 16px;
      }
      
      .tab-panel.active {
        display: block;
      }
      
      .control-group {
        margin-bottom: 20px;
      }
      
      .group-title {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--accent-color);
        border-bottom: 1px solid var(--panel-border);
        padding-bottom: 4px;
      }
      
      .control-item {
        margin-bottom: 12px;
      }
      
      .control-label {
        display: block;
        font-size: 12px;
        font-weight: 500;
        margin-bottom: 6px;
        color: var(--text-primary);
      }
      
      .checkbox-item {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        padding: 4px 0;
      }
      
      .checkbox-item input[type="checkbox"] {
        display: none;
      }
      
      .checkbox-custom {
        width: 16px;
        height: 16px;
        border: 2px solid var(--input-border);
        border-radius: 3px;
        position: relative;
        transition: all 0.2s;
      }
      
      .checkbox-item input:checked + .checkbox-custom {
        background: var(--accent-color);
        border-color: var(--accent-color);
      }
      
      .checkbox-item input:checked + .checkbox-custom::after {
        content: '✓';
        position: absolute;
        top: -2px;
        left: 2px;
        color: white;
        font-size: 12px;
      }
      
      .slider-container {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .slider-container input[type="range"] {
        flex: 1;
        height: 4px;
        border-radius: 2px;
        background: var(--input-border);
        outline: none;
        -webkit-appearance: none;
      }
      
      .slider-container input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--accent-color);
        cursor: pointer;
      }
      
      .slider-value {
        min-width: 40px;
        text-align: right;
        font-size: 11px;
        color: var(--text-secondary);
        font-family: monospace;
      }
      
      .physics-info {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-top: 4px;
        font-size: 11px;
      }
      
      .info-label {
        color: var(--text-secondary);
      }
      
      .gamma-value {
        color: var(--accent-color);
        font-weight: 600;
        font-family: monospace;
      }
      
      .button-group {
        display: flex;
        gap: 8px;
      }
      
      .button-group.vertical {
        flex-direction: column;
      }
      
      .btn {
        padding: 8px 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }
      
      .btn-primary {
        background: var(--accent-color);
        color: white;
      }
      
      .btn-secondary {
        background: var(--button-bg);
        color: var(--text-primary);
        border: 1px solid var(--input-border);
      }
      
      .btn-success {
        background: #4CAF50;
        color: white;
      }
      
      .btn-warning {
        background: #FF9800;
        color: white;
      }
      
      .btn-info {
        background: #2196F3;
        color: white;
      }
      
      .btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
      
      .select-input {
        width: 100%;
        padding: 6px 8px;
        background: var(--input-bg);
        border: 1px solid var(--input-border);
        border-radius: 4px;
        color: var(--text-primary);
        font-size: 12px;
      }
      
      .help-content {
        font-size: 11px;
        color: var(--text-secondary);
      }
      
      .help-list {
        margin: 8px 0;
        padding-left: 16px;
      }
      
      .help-list li {
        margin-bottom: 4px;
      }
      
      .panel-footer {
        border-top: 1px solid var(--panel-border);
        padding: 8px 16px;
        background: var(--button-bg);
      }
      
      .status-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
      }
      
      .status-text {
        color: var(--text-secondary);
      }
      
      .fps-counter {
        color: var(--accent-color);
        font-family: monospace;
      }
      
      .control-panel.collapsed .panel-content {
        display: none;
      }
      
      .control-panel.collapsed .collapse-btn {
        transform: rotate(-90deg);
      }
    `;
    
    document.head.appendChild(styles);
  }
  
  /**
   * Met en cache les références des éléments DOM
   * @private
   */
  _cacheElements() {
    this._elements = {
      collapseBtn: this.container.querySelector('.collapse-btn'),
      tabs: this.container.querySelectorAll('.tab-btn'),
      tabPanels: this.container.querySelectorAll('.tab-panel'),
      statusText: this.container.querySelector('.status-text'),
      fpsCounter: this.container.querySelector('.fps-counter'),
      
      // Contrôles de visualisation
      showGrid: this.container.querySelector('#showGrid'),
      showLightCones: this.container.querySelector('#showLightCones'),
      showTrajectories: this.container.querySelector('#showTrajectories'),
      showIsochrones: this.container.querySelector('#showIsochrones'),
      gridSpacing: this.container.querySelector('#gridSpacing'),
      
      // Contrôles de physique
      velocity: this.container.querySelector('#velocity'),
      acceleration: this.container.querySelector('#acceleration'),
      properTime: this.container.querySelector('#properTime'),
      gammaValue: this.container.querySelector('.gamma-value'),
      
      // Boutons d'action
      resetView: this.container.querySelector('#resetView'),
      centerView: this.container.querySelector('#centerView'),
      twinParadox: this.container.querySelector('#twinParadox'),
      lightSpeed: this.container.querySelector('#lightSpeed'),
      timeTravel: this.container.querySelector('#timeTravel'),
      generateIsochrones: this.container.querySelector('#generateIsochrones'),
      clearAll: this.container.querySelector('#clearAll'),
      exportImage: this.container.querySelector('#exportImage'),
      
      // Sélecteurs
      theme: this.container.querySelector('#theme'),
      quality: this.container.querySelector('#quality')
    };
  }
  
  /**
   * Configure les gestionnaires d'événements
   * @private
   */
  _setupEventListeners() {
    // Bouton de réduction/expansion
    if (this._elements.collapseBtn) {
      this._elements.collapseBtn.addEventListener('click', () => {
        this.toggleCollapse();
      });
    }
    
    // Onglets
    this._elements.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchTab(tab.dataset.tab);
      });
    });
    
    // Contrôles de visualisation
    this._elements.showGrid?.addEventListener('change', (e) => {
      this._updateValue('showGrid', e.target.checked);
    });
    
    this._elements.showLightCones?.addEventListener('change', (e) => {
      this._updateValue('showLightCones', e.target.checked);
    });
    
    this._elements.showTrajectories?.addEventListener('change', (e) => {
      this._updateValue('showTrajectories', e.target.checked);
    });
    
    this._elements.showIsochrones?.addEventListener('change', (e) => {
      this._updateValue('showIsochrones', e.target.checked);
    });
    
    this._elements.gridSpacing?.addEventListener('input', (e) => {
      this._updateSliderValue('gridSpacing', parseFloat(e.target.value));
    });
    
    // Contrôles de physique
    this._elements.velocity?.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      this._updateSliderValue('velocity', value);
      this._updateGammaDisplay(value);
    });
    
    this._elements.acceleration?.addEventListener('input', (e) => {
      this._updateSliderValue('acceleration', parseFloat(e.target.value));
    });
    
    this._elements.properTime?.addEventListener('input', (e) => {
      this._updateSliderValue('properTime', parseFloat(e.target.value));
    });
    
    // Boutons d'action
    this._elements.resetView?.addEventListener('click', () => {
      this.emit('resetView');
    });
    
    this._elements.centerView?.addEventListener('click', () => {
      this.emit('centerView');
    });
    
    this._elements.twinParadox?.addEventListener('click', () => {
      this.emit('showDemo', { type: 'twinParadox' });
    });
    
    this._elements.lightSpeed?.addEventListener('click', () => {
      this.emit('showDemo', { type: 'lightSpeed' });
    });
    
    this._elements.timeTravel?.addEventListener('click', () => {
      this.emit('showDemo', { type: 'timeTravel' });
    });
    
    this._elements.generateIsochrones?.addEventListener('click', () => {
      this.emit('generateIsochrones', { properTime: this._state.values.properTime });
    });
    
    this._elements.clearAll?.addEventListener('click', () => {
      this.emit('clearAll');
    });
    
    this._elements.exportImage?.addEventListener('click', () => {
      this.emit('exportImage');
    });
    
    // Sélecteurs
    this._elements.theme?.addEventListener('change', (e) => {
      this.setTheme(e.target.value);
    });
    
    this._elements.quality?.addEventListener('change', (e) => {
      this.emit('qualityChanged', { quality: e.target.value });
    });
  }
  
  /**
   * Met à jour une valeur et émet l'événement correspondant
   * @param {string} key - Clé de la valeur
   * @param {*} value - Nouvelle valeur
   * @private
   */
  _updateValue(key, value) {
    this._state.values[key] = value;
    this.emit('valueChanged', { key, value });
  }
  
  /**
   * Met à jour une valeur de slider et son affichage
   * @param {string} key - Clé de la valeur
   * @param {number} value - Nouvelle valeur
   * @private
   */
  _updateSliderValue(key, value) {
    this._state.values[key] = value;
    
    // Mettre à jour l'affichage
    const slider = this._elements[key];
    const valueDisplay = slider?.parentElement.querySelector('.slider-value');
    if (valueDisplay) {
      valueDisplay.textContent = value.toFixed(key === 'gridSpacing' ? 1 : 2);
    }
    
    this.emit('valueChanged', { key, value });
  }
  
  /**
   * Met à jour l'affichage du facteur de Lorentz
   * @param {number} velocity - Vitesse (v/c)
   * @private
   */
  _updateGammaDisplay(velocity) {
    if (this._elements.gammaValue) {
      const gamma = this._calculateGamma(velocity);
      this._elements.gammaValue.textContent = gamma.toFixed(2);
    }
  }
  
  /**
   * Calcule le facteur de Lorentz
   * @param {number} velocity - Vitesse (v/c)
   * @returns {number} Facteur de Lorentz
   * @private
   */
  _calculateGamma(velocity) {
    return 1 / Math.sqrt(1 - velocity * velocity);
  }
  
  /**
   * Bascule entre les onglets
   * @param {string} tabName - Nom de l'onglet
   */
  switchTab(tabName) {
    // Désactiver tous les onglets
    this._elements.tabs.forEach(tab => {
      tab.classList.remove('active');
    });
    
    this._elements.tabPanels.forEach(panel => {
      panel.classList.remove('active');
    });
    
    // Activer l'onglet sélectionné
    const activeTab = this.container.querySelector(`[data-tab="${tabName}"]`);
    const activePanel = this.container.querySelector(`.tab-panel[data-tab="${tabName}"]`);
    
    if (activeTab && activePanel) {
      activeTab.classList.add('active');
      activePanel.classList.add('active');
      this._state.activeTab = tabName;
      
      this.emit('tabChanged', { tab: tabName });
    }
  }
  
  /**
   * Bascule l'état réduit/étendu du panneau
   */
  toggleCollapse() {
    this._state.isCollapsed = !this._state.isCollapsed;
    this.container.querySelector('.control-panel').classList.toggle('collapsed', this._state.isCollapsed);
    
    this.emit('collapseToggled', { isCollapsed: this._state.isCollapsed });
  }
  
  /**
   * Change le thème du panneau
   * @param {string} theme - Nouveau thème ('dark' ou 'light')
   */
  setTheme(theme) {
    this._config.theme = theme;
    this.container.querySelector('.control-panel').setAttribute('data-theme', theme);
    
    this.emit('themeChanged', { theme });
  }
  
  /**
   * Met à jour le statut affiché
   * @param {string} status - Nouveau statut
   */
  setStatus(status) {
    if (this._elements.statusText) {
      this._elements.statusText.textContent = status;
    }
  }
  
  /**
   * Met à jour le compteur FPS
   * @param {number} fps - Valeur FPS
   */
  setFPS(fps) {
    if (this._elements.fpsCounter) {
      this._elements.fpsCounter.textContent = `${Math.round(fps)} FPS`;
    }
  }
  
  /**
   * Obtient les valeurs actuelles des contrôles
   * @returns {Object} Valeurs des contrôles
   */
  getValues() {
    return { ...this._state.values };
  }
  
  /**
   * Met à jour les valeurs des contrôles
   * @param {Object} values - Nouvelles valeurs
   */
  setValues(values) {
    Object.entries(values).forEach(([key, value]) => {
      if (this._state.values.hasOwnProperty(key)) {
        this._state.values[key] = value;
        
        // Mettre à jour l'interface
        const element = this._elements[key];
        if (element) {
          if (element.type === 'checkbox') {
            element.checked = value;
          } else if (element.type === 'range') {
            element.value = value;
            this._updateSliderValue(key, value);
          }
        }
      }
    });
  }
  
  /**
   * Détruit le panneau et libère les ressources
   */
  destroy() {
    // Supprimer les styles si plus de panneaux
    const panels = document.querySelectorAll('.control-panel');
    if (panels.length <= 1) {
      const styles = document.getElementById('control-panel-styles');
      if (styles) {
        styles.remove();
      }
    }
    
    // Nettoyer le contenu
    this.container.innerHTML = '';
    this._elements = {};
    
    this.removeAllListeners();
    this.emit('destroyed');
  }
} 