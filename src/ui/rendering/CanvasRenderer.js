/**
 * @fileoverview Classe de base pour le rendu sur canvas
 * @author Serge Fantino
 * @version 2.0.0
 */

import EventEmitter from 'eventemitter3';
import { validateRenderParameters } from '@utils/validation.js';

/**
 * Classe de base pour le rendu sur canvas HTML5
 * @class CanvasRenderer
 * @extends EventEmitter
 */
export class CanvasRenderer extends EventEmitter {
  /**
   * Crée un nouveau moteur de rendu
   * @param {HTMLCanvasElement} canvas - Élément canvas HTML
   * @param {Object} [options] - Options de rendu
   * @param {number} [options.pixelRatio] - Ratio de pixels (pour écrans haute densité)
   * @param {boolean} [options.antialias=true] - Activer l'antialiasing
   * @param {string} [options.backgroundColor='#000000'] - Couleur de fond
   */
  constructor(canvas, options = {}) {
    super();
    
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Un élément canvas HTML valide est requis');
    }
    
    /**
     * Élément canvas HTML
     * @type {HTMLCanvasElement}
     * @readonly
     */
    this.canvas = canvas;
    
    /**
     * Contexte de rendu 2D
     * @type {CanvasRenderingContext2D}
     * @readonly
     */
    this.ctx = canvas.getContext('2d');
    
    /**
     * Options de rendu
     * @type {Object}
     * @private
     */
    this._options = {
      pixelRatio: window.devicePixelRatio || 1,
      antialias: true,
      backgroundColor: '#000000',
      ...options
    };
    
    /**
     * Dimensions du canvas
     * @type {Object}
     * @private
     */
    this._dimensions = {
      width: 0,
      height: 0,
      displayWidth: 0,
      displayHeight: 0
    };
    
    /**
     * Système de coordonnées (transformation monde → écran)
     * @type {Object}
     * @private
     */
    this._coordinateSystem = {
      offsetX: 0,
      offsetY: 0,
      scaleX: 1,
      scaleY: 1,
      originX: 0,
      originY: 0
    };
    
    /**
     * État du rendu
     * @type {Object}
     * @private
     */
    this._state = {
      isRendering: false,
      frameCount: 0,
      lastFrameTime: 0,
      fps: 0
    };
    
    // Initialiser le canvas
    this._initializeCanvas();
    
    // Configurer les événements de redimensionnement
    this._setupResizeObserver();
    
    // Émettre l'événement de création
    this.emit('initialized', this);
  }
  
  /**
   * Initialise le canvas avec les bonnes dimensions
   * @private
   */
  _initializeCanvas() {
    this.resize();
    
    // Configuration du contexte
    if (this._options.antialias) {
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = 'high';
    }
    
    // Styles par défaut
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }
  
  /**
   * Configure l'observateur de redimensionnement
   * @private
   */
  _setupResizeObserver() {
    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(() => {
        this.resize();
      });
      this._resizeObserver.observe(this.canvas);
    } else {
      // Fallback pour les navigateurs sans ResizeObserver
      window.addEventListener('resize', () => this.resize());
    }
  }
  
  /**
   * Redimensionne le canvas selon sa taille CSS
   */
  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const { pixelRatio } = this._options;
    
    // Dimensions d'affichage
    const displayWidth = rect.width;
    const displayHeight = rect.height;
    
    // Dimensions réelles du canvas (avec pixel ratio)
    const canvasWidth = Math.floor(displayWidth * pixelRatio);
    const canvasHeight = Math.floor(displayHeight * pixelRatio);
    
    // Mettre à jour seulement si les dimensions ont changé
    if (this._dimensions.width !== canvasWidth || 
        this._dimensions.height !== canvasHeight) {
      
      this.canvas.width = canvasWidth;
      this.canvas.height = canvasHeight;
      
      // Ajuster l'échelle du contexte
      this.ctx.scale(pixelRatio, pixelRatio);
      
      // Sauvegarder les dimensions
      this._dimensions = {
        width: canvasWidth,
        height: canvasHeight,
        displayWidth,
        displayHeight
      };
      
      // Valider les paramètres
      validateRenderParameters({
        canvasWidth,
        canvasHeight,
        scale: this._coordinateSystem.scaleX
      });
      
      this.emit('resized', this._dimensions);
    }
  }
  
  /**
   * Définit le système de coordonnées (transformation monde → écran)
   * @param {Object} coords - Paramètres de coordonnées
   * @param {number} coords.offsetX - Décalage X
   * @param {number} coords.offsetY - Décalage Y
   * @param {number} coords.scaleX - Échelle X
   * @param {number} coords.scaleY - Échelle Y
   * @param {number} [coords.originX=0] - Origine X dans l'espace monde
   * @param {number} [coords.originY=0] - Origine Y dans l'espace monde
   */
  setCoordinateSystem({ offsetX, offsetY, scaleX, scaleY, originX = 0, originY = 0 }) {
    this._coordinateSystem = {
      offsetX,
      offsetY,
      scaleX,
      scaleY,
      originX,
      originY
    };
    
    this.emit('coordinateSystemChanged', this._coordinateSystem);
  }
  
  /**
   * Convertit des coordonnées monde en coordonnées écran
   * @param {number} worldX - Coordonnée X monde
   * @param {number} worldY - Coordonnée Y monde
   * @returns {Object} Coordonnées écran {x, y}
   */
  worldToScreen(worldX, worldY) {
    const { offsetX, offsetY, scaleX, scaleY, originX, originY } = this._coordinateSystem;
    
    return {
      x: offsetX + (worldX - originX) * scaleX,
      y: offsetY + (worldY - originY) * scaleY
    };
  }
  
  /**
   * Convertit des coordonnées écran en coordonnées monde
   * @param {number} screenX - Coordonnée X écran
   * @param {number} screenY - Coordonnée Y écran
   * @returns {Object} Coordonnées monde {x, y}
   */
  screenToWorld(screenX, screenY) {
    const { offsetX, offsetY, scaleX, scaleY, originX, originY } = this._coordinateSystem;
    
    return {
      x: originX + (screenX - offsetX) / scaleX,
      y: originY + (screenY - offsetY) / scaleY
    };
  }
  
  /**
   * Efface le canvas
   * @param {string} [color] - Couleur de fond (optionnelle)
   */
  clear(color = this._options.backgroundColor) {
    const { displayWidth, displayHeight } = this._dimensions;
    
    if (color) {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(0, 0, displayWidth, displayHeight);
    } else {
      this.ctx.clearRect(0, 0, displayWidth, displayHeight);
    }
  }
  
  /**
   * Sauvegarde l'état du contexte
   */
  save() {
    this.ctx.save();
  }
  
  /**
   * Restaure l'état du contexte
   */
  restore() {
    this.ctx.restore();
  }
  
  /**
   * Dessine une ligne
   * @param {number} x1 - X de départ (coordonnées monde)
   * @param {number} y1 - Y de départ (coordonnées monde)
   * @param {number} x2 - X d'arrivée (coordonnées monde)
   * @param {number} y2 - Y d'arrivée (coordonnées monde)
   * @param {Object} [style] - Style de la ligne
   */
  drawLine(x1, y1, x2, y2, style = {}) {
    const start = this.worldToScreen(x1, y1);
    const end = this.worldToScreen(x2, y2);
    
    this.save();
    
    // Appliquer le style
    if (style.color) this.ctx.strokeStyle = style.color;
    if (style.width) this.ctx.lineWidth = style.width;
    if (style.dash) this.ctx.setLineDash(style.dash);
    
    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.stroke();
    
    this.restore();
  }
  
  /**
   * Dessine un cercle
   * @param {number} x - Centre X (coordonnées monde)
   * @param {number} y - Centre Y (coordonnées monde)
   * @param {number} radius - Rayon (coordonnées monde)
   * @param {Object} [style] - Style du cercle
   */
  drawCircle(x, y, radius, style = {}) {
    const center = this.worldToScreen(x, y);
    const screenRadius = radius * this._coordinateSystem.scaleX;
    
    this.save();
    
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, screenRadius, 0, 2 * Math.PI);
    
    if (style.fill) {
      this.ctx.fillStyle = style.fill;
      this.ctx.fill();
    }
    
    if (style.stroke) {
      this.ctx.strokeStyle = style.stroke;
      if (style.width) this.ctx.lineWidth = style.width;
      this.ctx.stroke();
    }
    
    this.restore();
  }
  
  /**
   * Dessine du texte
   * @param {string} text - Texte à afficher
   * @param {number} x - Position X (coordonnées monde)
   * @param {number} y - Position Y (coordonnées monde)
   * @param {Object} [style] - Style du texte
   */
  drawText(text, x, y, style = {}) {
    const position = this.worldToScreen(x, y);
    
    this.save();
    
    if (style.font) this.ctx.font = style.font;
    if (style.color) this.ctx.fillStyle = style.color;
    if (style.align) this.ctx.textAlign = style.align;
    if (style.baseline) this.ctx.textBaseline = style.baseline;
    
    this.ctx.fillText(text, position.x, position.y);
    
    this.restore();
  }
  
  /**
   * Commence une nouvelle frame de rendu
   */
  beginFrame() {
    this._state.isRendering = true;
    this._state.frameCount++;
    
    const now = performance.now();
    if (this._state.lastFrameTime > 0) {
      const deltaTime = now - this._state.lastFrameTime;
      this._state.fps = 1000 / deltaTime;
    }
    this._state.lastFrameTime = now;
    
    this.emit('frameBegin', this._state);
  }
  
  /**
   * Termine la frame de rendu
   */
  endFrame() {
    this._state.isRendering = false;
    this.emit('frameEnd', this._state);
  }
  
  /**
   * Obtient les dimensions du canvas
   * @returns {Object} Dimensions {width, height, displayWidth, displayHeight}
   */
  getDimensions() {
    return { ...this._dimensions };
  }
  
  /**
   * Obtient le système de coordonnées actuel
   * @returns {Object} Système de coordonnées
   */
  getCoordinateSystem() {
    return { ...this._coordinateSystem };
  }
  
  /**
   * Obtient les statistiques de rendu
   * @returns {Object} Statistiques {frameCount, fps, isRendering}
   */
  getStats() {
    return {
      frameCount: this._state.frameCount,
      fps: Math.round(this._state.fps),
      isRendering: this._state.isRendering
    };
  }
  
  /**
   * Détruit le moteur de rendu et libère les ressources
   */
  destroy() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }
    
    this.removeAllListeners();
    this.emit('destroyed');
  }
  
  /**
   * Représentation string du moteur de rendu
   * @returns {string} Représentation textuelle
   */
  toString() {
    const { width, height } = this._dimensions;
    const { fps } = this._state;
    return `CanvasRenderer(${width}x${height}, ${fps}fps)`;
  }
} 