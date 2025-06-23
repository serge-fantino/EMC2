/**
 * @fileoverview Renderer spécialisé pour les cônes de lumière
 * @author Serge Fantino
 * @version 2.0.0
 */

import { CanvasRenderer } from './CanvasRenderer.js';
import { LightCone } from '@core/entities/LightCone.js';
import { SPEED_OF_LIGHT } from '@core/physics/constants.js';

/**
 * Renderer spécialisé pour les cônes de lumière relativistes
 * @class LightConeRenderer
 * @extends CanvasRenderer
 */
export class LightConeRenderer extends CanvasRenderer {
  /**
   * Crée un nouveau renderer de cônes de lumière
   * @param {HTMLCanvasElement} canvas - Élément canvas
   * @param {Object} [options] - Options de rendu
   */
  constructor(canvas, options = {}) {
    super(canvas, {
      backgroundColor: '#0a0a0a',
      ...options
    });
    
    /**
     * Styles par défaut pour les cônes
     * @type {Object}
     * @private
     */
    this._defaultStyles = {
      future: {
        stroke: '#4CAF50',
        fill: 'rgba(76, 175, 80, 0.1)',
        width: 2,
        dash: null
      },
      past: {
        stroke: '#FF9800',
        fill: 'rgba(255, 152, 0, 0.05)',
        width: 1,
        dash: [5, 5]
      },
      boundary: {
        stroke: '#2196F3',
        width: 3,
        glow: true
      },
      grid: {
        stroke: '#333333',
        width: 1,
        dash: [2, 2]
      }
    };
  }
  
  /**
   * Dessine un cône de lumière complet
   * @param {LightCone} lightCone - Cône de lumière à dessiner
   * @param {Object} bounds - Limites de rendu
   * @param {Object} [styleOverrides] - Styles personnalisés
   */
  drawLightCone(lightCone, bounds, styleOverrides = {}) {
    if (!(lightCone instanceof LightCone)) {
      throw new Error('lightCone doit être une instance de LightCone');
    }
    
    const styles = { ...this._defaultStyles, ...styleOverrides };
    const origin = lightCone.getOrigin();
    
    // Dessiner le cône futur
    this._drawConeSector(origin, bounds, 'future', styles.future);
    
    // Dessiner le cône passé si activé
    if (lightCone.showPastCone) {
      this._drawConeSector(origin, bounds, 'past', styles.past);
    }
    
    // Dessiner les frontières
    this._drawConeBoundaries(origin, bounds, styles.boundary);
    
    // Dessiner l'origine
    this._drawOrigin(origin, styles.boundary);
    
    this.emit('lightConeDrawn', { lightCone, bounds });
  }
  
  /**
   * Dessine un secteur de cône (futur ou passé)
   * @param {Object} origin - Origine du cône {x, t}
   * @param {Object} bounds - Limites de rendu
   * @param {string} type - Type de cône ('future' ou 'past')
   * @param {Object} style - Style de rendu
   * @private
   */
  _drawConeSector(origin, bounds, type, style) {
    const { minT, maxT, minX, maxX } = bounds;
    const c = SPEED_OF_LIGHT;
    
    // Calculer les limites du secteur
    const startT = type === 'future' ? origin.t : minT;
    const endT = type === 'future' ? maxT : origin.t;
    
    if (startT >= endT) return;
    
    // Générer les points du secteur
    const points = [];
    const steps = 50;
    
    for (let i = 0; i <= steps; i++) {
      const t = startT + (endT - startT) * (i / steps);
      const deltaT = Math.abs(t - origin.t);
      const radius = c * deltaT;
      
      if (radius > 0) {
        const leftX = Math.max(origin.x - radius, minX);
        const rightX = Math.min(origin.x + radius, maxX);
        
        if (i === 0) {
          points.push({ x: leftX, t });
        } else {
          points.unshift({ x: leftX, t });
          points.push({ x: rightX, t });
        }
      }
    }
    
    if (points.length < 3) return;
    
    // Dessiner le remplissage
    if (style.fill) {
      this._drawFilledPolygon(points, style.fill);
    }
    
    // Dessiner le contour
    if (style.stroke) {
      this._drawPolygonOutline(points, style);
    }
  }
  
  /**
   * Dessine les frontières du cône de lumière
   * @param {Object} origin - Origine du cône
   * @param {Object} bounds - Limites de rendu
   * @param {Object} style - Style des frontières
   * @private
   */
  _drawConeBoundaries(origin, bounds, style) {
    const { minT, maxT, minX, maxX } = bounds;
    const c = SPEED_OF_LIGHT;
    
    // Frontière droite (future)
    const rightPoints = [];
    // Frontière gauche (future)
    const leftPoints = [];
    
    for (let t = origin.t; t <= maxT; t += (maxT - origin.t) / 100) {
      const radius = c * (t - origin.t);
      const rightX = Math.min(origin.x + radius, maxX);
      const leftX = Math.max(origin.x - radius, minX);
      
      rightPoints.push({ x: rightX, t });
      leftPoints.push({ x: leftX, t });
    }
    
    // Dessiner les frontières avec effet de lueur si activé
    if (style.glow) {
      this._drawGlowingLine(rightPoints, style);
      this._drawGlowingLine(leftPoints, style);
    } else {
      this._drawPolyline(rightPoints, style);
      this._drawPolyline(leftPoints, style);
    }
  }
  
  /**
   * Dessine l'origine du cône
   * @param {Object} origin - Position de l'origine
   * @param {Object} style - Style de l'origine
   * @private
   */
  _drawOrigin(origin, style) {
    const radius = 3; // pixels
    this.drawCircle(origin.x, origin.t, radius / this._coordinateSystem.scaleX, {
      fill: style.stroke,
      stroke: '#FFFFFF',
      width: 2
    });
  }
  
  /**
   * Dessine un polygone rempli
   * @param {Array<Object>} points - Points du polygone
   * @param {string} fillColor - Couleur de remplissage
   * @private
   */
  _drawFilledPolygon(points, fillColor) {
    if (points.length < 3) return;
    
    this.save();
    this.ctx.fillStyle = fillColor;
    this.ctx.beginPath();
    
    const firstPoint = this.worldToScreen(points[0].x, points[0].t);
    this.ctx.moveTo(firstPoint.x, firstPoint.y);
    
    for (let i = 1; i < points.length; i++) {
      const point = this.worldToScreen(points[i].x, points[i].t);
      this.ctx.lineTo(point.x, point.y);
    }
    
    this.ctx.closePath();
    this.ctx.fill();
    this.restore();
  }
  
  /**
   * Dessine le contour d'un polygone
   * @param {Array<Object>} points - Points du polygone
   * @param {Object} style - Style du contour
   * @private
   */
  _drawPolygonOutline(points, style) {
    if (points.length < 2) return;
    
    this.save();
    this.ctx.strokeStyle = style.stroke;
    this.ctx.lineWidth = style.width || 1;
    if (style.dash) this.ctx.setLineDash(style.dash);
    
    this.ctx.beginPath();
    const firstPoint = this.worldToScreen(points[0].x, points[0].t);
    this.ctx.moveTo(firstPoint.x, firstPoint.y);
    
    for (let i = 1; i < points.length; i++) {
      const point = this.worldToScreen(points[i].x, points[i].t);
      this.ctx.lineTo(point.x, point.y);
    }
    
    this.ctx.stroke();
    this.restore();
  }
  
  /**
   * Dessine une polyligne
   * @param {Array<Object>} points - Points de la ligne
   * @param {Object} style - Style de la ligne
   * @private
   */
  _drawPolyline(points, style) {
    if (points.length < 2) return;
    
    this.save();
    this.ctx.strokeStyle = style.stroke;
    this.ctx.lineWidth = style.width || 1;
    if (style.dash) this.ctx.setLineDash(style.dash);
    
    this.ctx.beginPath();
    const firstPoint = this.worldToScreen(points[0].x, points[0].t);
    this.ctx.moveTo(firstPoint.x, firstPoint.y);
    
    for (let i = 1; i < points.length; i++) {
      const point = this.worldToScreen(points[i].x, points[i].t);
      this.ctx.lineTo(point.x, point.y);
    }
    
    this.ctx.stroke();
    this.restore();
  }
  
  /**
   * Dessine une ligne avec effet de lueur
   * @param {Array<Object>} points - Points de la ligne
   * @param {Object} style - Style avec lueur
   * @private
   */
  _drawGlowingLine(points, style) {
    if (points.length < 2) return;
    
    // Dessiner l'effet de lueur (plusieurs passes)
    const glowPasses = [
      { width: (style.width || 2) * 4, alpha: 0.1 },
      { width: (style.width || 2) * 2, alpha: 0.3 },
      { width: style.width || 2, alpha: 1.0 }
    ];
    
    glowPasses.forEach(pass => {
      this.save();
      this.ctx.strokeStyle = this._addAlphaToColor(style.stroke, pass.alpha);
      this.ctx.lineWidth = pass.width;
      this.ctx.lineCap = 'round';
      
      this.ctx.beginPath();
      const firstPoint = this.worldToScreen(points[0].x, points[0].t);
      this.ctx.moveTo(firstPoint.x, firstPoint.y);
      
      for (let i = 1; i < points.length; i++) {
        const point = this.worldToScreen(points[i].x, points[i].t);
        this.ctx.lineTo(point.x, point.y);
      }
      
      this.ctx.stroke();
      this.restore();
    });
  }
  
  /**
   * Dessine une grille d'espace-temps
   * @param {Object} bounds - Limites de la grille
   * @param {Object} [style] - Style de la grille
   */
  drawSpacetimeGrid(bounds, style = this._defaultStyles.grid) {
    const { minX, maxX, minT, maxT } = bounds;
    
    // Calculer l'espacement de la grille
    const xRange = maxX - minX;
    const tRange = maxT - minT;
    const xStep = this._calculateGridStep(xRange);
    const tStep = this._calculateGridStep(tRange);
    
    this.save();
    this.ctx.strokeStyle = style.stroke;
    this.ctx.lineWidth = style.width;
    if (style.dash) this.ctx.setLineDash(style.dash);
    
    // Lignes verticales (x constant)
    for (let x = Math.ceil(minX / xStep) * xStep; x <= maxX; x += xStep) {
      this.drawLine(x, minT, x, maxT, style);
    }
    
    // Lignes horizontales (t constant)
    for (let t = Math.ceil(minT / tStep) * tStep; t <= maxT; t += tStep) {
      this.drawLine(minX, t, maxX, t, style);
    }
    
    this.restore();
  }
  
  /**
   * Calcule l'espacement optimal pour la grille
   * @param {number} range - Étendue à couvrir
   * @returns {number} Espacement optimal
   * @private
   */
  _calculateGridStep(range) {
    const targetLines = 10; // Nombre cible de lignes
    const rawStep = range / targetLines;
    
    // Arrondir à une valeur "propre"
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const normalized = rawStep / magnitude;
    
    if (normalized <= 1) return magnitude;
    if (normalized <= 2) return 2 * magnitude;
    if (normalized <= 5) return 5 * magnitude;
    return 10 * magnitude;
  }
  
  /**
   * Ajoute de la transparence à une couleur
   * @param {string} color - Couleur de base
   * @param {number} alpha - Valeur alpha (0-1)
   * @returns {string} Couleur avec transparence
   * @private
   */
  _addAlphaToColor(color, alpha) {
    // Conversion simple pour les couleurs hex
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    // Retourner la couleur originale si pas de conversion possible
    return color;
  }
  
  /**
   * Met à jour les styles par défaut
   * @param {Object} newStyles - Nouveaux styles
   */
  updateDefaultStyles(newStyles) {
    this._defaultStyles = { ...this._defaultStyles, ...newStyles };
    this.emit('stylesUpdated', this._defaultStyles);
  }
  
  /**
   * Obtient les styles par défaut
   * @returns {Object} Styles par défaut
   */
  getDefaultStyles() {
    return { ...this._defaultStyles };
  }
} 