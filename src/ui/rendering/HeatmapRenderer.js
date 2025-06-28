/**
 * @fileoverview Renderer de heatmap colorée pour les cônes de lumière
 * @author Serge Fantino
 * @version 2.0.0
 */

import { CanvasRenderer } from './CanvasRenderer.js';

/**
 * Renderer spécialisé pour la heatmap colorée des cônes de lumière
 * @class HeatmapRenderer
 * @extends CanvasRenderer
 */
export class HeatmapRenderer extends CanvasRenderer {
  /**
   * Crée un nouveau renderer de heatmap
   * @param {HTMLCanvasElement} canvas - Canvas de rendu
   * @param {Object} [options] - Options de configuration
   */
  constructor(canvas, options = {}) {
    super(canvas, options);
    
    /**
     * Configuration de la heatmap
     * @type {Object}
     * @private
     */
    this._heatmapConfig = {
      greenLimit: 0.5,  // Limite pour la couleur verte (v/c)
      redLimit: 1.0,    // Limite pour la couleur rouge (v/c)
      pixelSize: 2,     // Taille des pixels de la heatmap
      showPastCone: false,
      ...options.heatmap
    };
    
    /**
     * Cache des données d'image
     * @type {ImageData|null}
     * @private
     */
    this._imageDataCache = null;
  }
  
  /**
   * Dessine la heatmap complète des cônes de lumière
   * @param {Array<LightCone>} lightCones - Cônes de lumière à dessiner
   * @param {Object} bounds - Limites de la visualisation
   */
  drawLightConeHeatmap(lightCones, bounds) {
    const { width, height } = this.getDimensions();
    const pixelSize = this._heatmapConfig.pixelSize;
    
    // Créer l'ImageData pour la heatmap
    const imageData = this.ctx.createImageData(width, height);
    const data = imageData.data;
    
    // Initialiser avec du noir transparent
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 0;     // R
      data[i + 1] = 0; // G
      data[i + 2] = 0; // B
      data[i + 3] = 0; // A (transparent)
    }
    
    // Dessiner tous les cônes avec superposition alpha
    for (let coneIndex = 0; coneIndex < lightCones.length; coneIndex++) {
      const lightCone = lightCones[coneIndex];
      this._drawSingleConeHeatmap(data, width, height, lightCone, coneIndex, pixelSize);
    }
    
    // Appliquer l'ImageData au canvas
    this.ctx.putImageData(imageData, 0, 0);
    
    this._imageDataCache = imageData;
  }
  
  /**
   * Dessine un seul cône dans la heatmap
   * @param {Uint8ClampedArray} data - Données de l'image
   * @param {number} width - Largeur du canvas
   * @param {number} height - Hauteur du canvas
   * @param {LightCone} lightCone - Cône de lumière
   * @param {number} coneIndex - Index du cône
   * @param {number} pixelSize - Taille des pixels
   * @private
   */
  _drawSingleConeHeatmap(data, width, height, lightCone, coneIndex, pixelSize) {
    const coneModulation = coneIndex === 0 ? 1.0 : 0.8;
    
    // Parcourir tous les pixels par blocs
    for (let px = 0; px < width; px += pixelSize) {
      for (let py = 0; py < height; py += pixelSize) {
        // Convertir les coordonnées pixel en coordonnées espace-temps
        const spacetime = this._screenToSpacetime(px, py);
        
        // Position relative par rapport à l'origine du cône
        const relativeX = spacetime.x - lightCone.originX;
        const relativeT = spacetime.t - lightCone.originT;
        
        // Ne dessiner que le cône futur (et passé si activé)
        const shouldDraw = relativeT > 0 || (this._heatmapConfig.showPastCone && relativeT < 0);
        
        if (shouldDraw) {
          const velocityRatio = this._calculateVelocityRatio(relativeX, 0, Math.abs(relativeT));
          
          // Vérifier si le point est dans le cône de lumière
          if (velocityRatio <= 1) {
            const color = this._getColorForVelocity(velocityRatio);
            
            // Appliquer la modulation du cône
            if (color.alpha > 0) {
              this._fillPixelBlock(data, width, height, px, py, pixelSize, color, coneModulation);
            }
          }
        }
      }
    }
  }
  
  /**
   * Remplit un bloc de pixels avec alpha blending
   * @param {Uint8ClampedArray} data - Données de l'image
   * @param {number} width - Largeur du canvas
   * @param {number} height - Hauteur du canvas
   * @param {number} px - Position X du bloc
   * @param {number} py - Position Y du bloc
   * @param {number} pixelSize - Taille du bloc
   * @param {Object} color - Couleur à appliquer
   * @param {number} modulation - Facteur de modulation
   * @private
   */
  _fillPixelBlock(data, width, height, px, py, pixelSize, color, modulation) {
    for (let dx = 0; dx < pixelSize; dx++) {
      for (let dy = 0; dy < pixelSize; dy++) {
        const x = px + dx;
        const y = py + dy;
        
        if (x < width && y < height) {
          const index = (y * width + x) * 4;
          
          // Alpha blending avec les pixels existants
          const newAlpha = (color.alpha / 255) * modulation;
          const existingAlpha = data[index + 3] / 255;
          const blendAlpha = newAlpha + existingAlpha * (1 - newAlpha);
          
          if (blendAlpha > 0) {
            // Mélanger les couleurs
            const newWeight = newAlpha / blendAlpha;
            const existingWeight = (existingAlpha * (1 - newAlpha)) / blendAlpha;
            
            data[index] = Math.floor(color.r * modulation * newWeight + data[index] * existingWeight);
            data[index + 1] = Math.floor(color.g * modulation * newWeight + data[index + 1] * existingWeight);
            data[index + 2] = Math.floor(color.b * modulation * newWeight + data[index + 2] * existingWeight);
            data[index + 3] = Math.floor(blendAlpha * 255);
          }
        }
      }
    }
  }
  
  /**
   * Calcule la couleur pour une vitesse donnée
   * @param {number} v - Vitesse relative (0 à 1, où 1 = c)
   * @returns {Object} Couleur RGBA
   * @private
   */
  _getColorForVelocity(v) {
    const { greenLimit, redLimit } = this._heatmapConfig;
    
    if (v >= 1) {
      // Transparent pour v ≥ c (causalement déconnecté)
      return { r: 0, g: 0, b: 0, alpha: 0 };
    }
    
    if (v < greenLimit) {
      // Bleu vers Vert (0 à greenLimit)
      const t = v / greenLimit;
      return {
        r: 0,
        g: Math.floor(255 * t),
        b: Math.floor(255 * (1 - t)),
        alpha: 255
      };
    } else if (v < redLimit) {
      // Vert vers Rouge (greenLimit à redLimit)
      const t = (v - greenLimit) / (redLimit - greenLimit);
      return {
        r: Math.floor(255 * t),
        g: Math.floor(255 * (1 - t)),
        b: 0,
        alpha: 255
      };
    } else {
      // Rouge vers Transparent (redLimit à c)
      const t = (v - redLimit) / (1 - redLimit);
      const alpha = Math.floor(255 * (1 - t));
      return {
        r: Math.floor(255 * (1 - t)),
        g: 0,
        b: 0,
        alpha
      };
    }
  }
  
  /**
   * Calcule le ratio de vitesse pour un point dans l'espace-temps
   * @param {number} x - Position spatiale
   * @param {number} y - Position spatiale (pour 2D)
   * @param {number} t - Temps
   * @returns {number} Ratio de vitesse (0 à 1)
   * @private
   */
  _calculateVelocityRatio(x, y, t) {
    if (t <= 0) return 0;
    
    const spatialDistance = Math.sqrt(x * x + y * y);
    const velocityRatio = spatialDistance / t;
    
    return Math.min(1, velocityRatio);
  }
  
  /**
   * Convertit les coordonnées écran en coordonnées espace-temps
   * @param {number} screenX - Coordonnée X écran
   * @param {number} screenY - Coordonnée Y écran
   * @returns {Object} Coordonnées espace-temps
   * @private
   */
  _screenToSpacetime(screenX, screenY) {
    const coords = this.getCoordinateSystem();
    
    // Utiliser le système de coordonnées configuré
    const x = (screenX - coords.offsetX) / coords.scaleX + coords.originX;
    const t = (screenY - coords.offsetY) / coords.scaleY + coords.originY;
    
    return { x, t };
  }
  
  /**
   * Dessine les enveloppes des cônes de lumière
   * @param {Array<LightCone>} lightCones - Cônes de lumière
   * @param {Object} bounds - Limites de visualisation
   */
  drawLightConeEnvelopes(lightCones, bounds) {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([2, 2]);
    
    lightCones.forEach(lightCone => {
      this._drawSingleConeEnvelope(lightCone, bounds);
    });
    
    this.ctx.setLineDash([]);
  }
  
  /**
   * Dessine l'enveloppe d'un seul cône
   * @param {LightCone} lightCone - Cône de lumière
   * @param {Object} bounds - Limites de visualisation
   * @private
   */
  _drawSingleConeEnvelope(lightCone, bounds) {
    const origin = this.worldToScreen(lightCone.originX, lightCone.originT);
    
    // Calculer les points de l'enveloppe du cône futur
    const topTime = bounds.maxT;
    const timeSpan = topTime - lightCone.originT;
    
    if (timeSpan > 0) {
      const leftEdge = this.worldToScreen(lightCone.originX - timeSpan, topTime);
      const rightEdge = this.worldToScreen(lightCone.originX + timeSpan, topTime);
      
      // Dessiner le cône futur
      this.ctx.beginPath();
      this.ctx.moveTo(origin.x, origin.y);
      this.ctx.lineTo(leftEdge.x, leftEdge.y);
      this.ctx.moveTo(origin.x, origin.y);
      this.ctx.lineTo(rightEdge.x, rightEdge.y);
      this.ctx.stroke();
    }
    
    // Dessiner le cône passé si activé
    if (this._heatmapConfig.showPastCone) {
      const bottomTime = bounds.minT;
      const pastTimeSpan = lightCone.originT - bottomTime;
      
      if (pastTimeSpan > 0) {
        const leftPastEdge = this.worldToScreen(lightCone.originX - pastTimeSpan, bottomTime);
        const rightPastEdge = this.worldToScreen(lightCone.originX + pastTimeSpan, bottomTime);
        
        this.ctx.beginPath();
        this.ctx.moveTo(origin.x, origin.y);
        this.ctx.lineTo(leftPastEdge.x, leftPastEdge.y);
        this.ctx.moveTo(origin.x, origin.y);
        this.ctx.lineTo(rightPastEdge.x, rightPastEdge.y);
        this.ctx.stroke();
      }
    }
  }
  
  /**
   * Dessine les axes et labels
   * @param {Object} bounds - Limites de visualisation
   */
  drawAxesAndLabels(bounds) {
    const { width, height } = this.getDimensions();
    const center = this.worldToScreen(0, 0);
    
    // Axes
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1;
    
    // Axe du temps (vertical)
    this.ctx.beginPath();
    this.ctx.moveTo(center.x, 0);
    this.ctx.lineTo(center.x, height);
    this.ctx.stroke();
    
    // Axe de l'espace (horizontal)
    this.ctx.beginPath();
    this.ctx.moveTo(0, center.y);
    this.ctx.lineTo(width, center.y);
    this.ctx.stroke();
    
    // Labels
    this.ctx.fillStyle = 'white';
    this.ctx.font = '14px Arial';
    this.ctx.fillText('Temps', center.x + 10, 30);
    this.ctx.fillText('Espace', width - 100, center.y - 10);
  }
  
  /**
   * Met à jour la configuration de la heatmap
   * @param {Object} config - Nouvelle configuration
   */
  updateHeatmapConfig(config) {
    this._heatmapConfig = { ...this._heatmapConfig, ...config };
    this._imageDataCache = null; // Invalider le cache
  }
  
  /**
   * Obtient la configuration actuelle de la heatmap
   * @returns {Object} Configuration de la heatmap
   */
  getHeatmapConfig() {
    return { ...this._heatmapConfig };
  }
  
  /**
   * Vérifie si un point est dans un cône de lumière
   * @param {number} x - Position X
   * @param {number} t - Temps
   * @param {LightCone} lightCone - Cône de lumière
   * @returns {boolean} True si dans le cône
   */
  isInsideLightCone(x, t, lightCone) {
    const relativeX = x - lightCone.originX;
    const relativeT = t - lightCone.originT;
    
    // Vérifier le cône futur
    if (relativeT > 0) {
      return Math.abs(relativeX) <= relativeT;
    }
    
    // Vérifier le cône passé si activé
    if (this._heatmapConfig.showPastCone && relativeT < 0) {
      return Math.abs(relativeX) <= Math.abs(relativeT);
    }
    
    return false;
  }
  
  /**
   * Trouve le cône de lumière contenant un point
   * @param {number} x - Position X
   * @param {number} t - Temps
   * @param {Array<LightCone>} lightCones - Cônes de lumière
   * @returns {number} Index du cône (-1 si aucun)
   */
  findContainingCone(x, t, lightCones) {
    // Vérifier du plus récent au plus ancien pour la priorité
    for (let i = lightCones.length - 1; i >= 0; i--) {
      if (this.isInsideLightCone(x, t, lightCones[i])) {
        return i;
      }
    }
    return -1;
  }
} 