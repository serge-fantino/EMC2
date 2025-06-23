/**
 * @fileoverview Renderer spécialisé pour les isochrones
 * @author Serge Fantino
 * @version 2.0.0
 */

import { CanvasRenderer } from './CanvasRenderer.js';
import { Isochrone } from '@core/entities/Isochrone.js';

/**
 * Renderer spécialisé pour les isochrones (courbes de temps propre constant)
 * @class IsochroneRenderer
 * @extends CanvasRenderer
 */
export class IsochroneRenderer extends CanvasRenderer {
  /**
   * Crée un nouveau renderer d'isochrones
   * @param {HTMLCanvasElement} canvas - Élément canvas
   * @param {Object} [options] - Options de rendu
   */
  constructor(canvas, options = {}) {
    super(canvas, options);
    
    /**
     * Styles par défaut pour les isochrones
     * @type {Object}
     * @private
     */
    this._defaultStyles = {
      curve: {
        stroke: '#9C27B0',
        width: 2,
        smooth: true,
        glow: false
      },
      highlighted: {
        stroke: '#E91E63',
        width: 3,
        glow: true
      },
      label: {
        color: '#FFFFFF',
        font: '11px Arial',
        background: 'rgba(156, 39, 176, 0.8)',
        padding: 3
      },
      series: {
        alphaRange: [0.3, 1.0],
        widthRange: [1, 3]
      }
    };
  }
  
  /**
   * Dessine une isochrone individuelle
   * @param {Isochrone} isochrone - Isochrone à dessiner
   * @param {Object} [styleOverrides] - Styles personnalisés
   */
  drawIsochrone(isochrone, styleOverrides = {}) {
    if (!(isochrone instanceof Isochrone)) {
      throw new Error('isochrone doit être une instance de Isochrone');
    }
    
    if (!isochrone.visible || !isochrone.isValid()) {
      return;
    }
    
    const style = { ...this._defaultStyles.curve, ...styleOverrides };
    const points = isochrone.calculatePoints();
    
    if (points.length < 2) {
      return;
    }
    
    // Dessiner la courbe
    if (style.smooth && points.length > 3) {
      this._drawSmoothCurve(points, style);
    } else {
      this._drawLinearCurve(points, style);
    }
    
    // Dessiner le label si demandé
    if (style.showLabel !== false) {
      this._drawIsochroneLabel(isochrone, points, style);
    }
    
    this.emit('isochroneDrawn', { isochrone, points: points.length });
  }
  
  /**
   * Dessine une série d'isochrones
   * @param {Array<Isochrone>} isochrones - Série d'isochrones
   * @param {Object} [options] - Options de rendu de la série
   */
  drawIsochroneSeries(isochrones, options = {}) {
    if (!Array.isArray(isochrones) || isochrones.length === 0) {
      return;
    }
    
    const seriesOptions = {
      colorGradient: true,
      alphaGradient: true,
      widthGradient: false,
      labelEvery: 3, // Afficher un label tous les 3 isochrones
      ...options
    };
    
    isochrones.forEach((isochrone, index) => {
      if (!isochrone.visible || !isochrone.isValid()) {
        return;
      }
      
      const style = this._calculateSeriesStyle(index, isochrones.length, seriesOptions);
      
      // Ajouter le label seulement pour certaines isochrones
      style.showLabel = (index % seriesOptions.labelEvery === 0);
      
      this.drawIsochrone(isochrone, style);
    });
    
    this.emit('isochroneSeriesDrawn', { 
      count: isochrones.length, 
      visible: isochrones.filter(iso => iso.visible).length 
    });
  }
  
  /**
   * Dessine une courbe linéaire (segments droits)
   * @param {Array<Object>} points - Points de la courbe
   * @param {Object} style - Style de la courbe
   * @private
   */
  _drawLinearCurve(points, style) {
    this.save();
    this.ctx.strokeStyle = style.stroke;
    this.ctx.lineWidth = style.width;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    if (style.dash) {
      this.ctx.setLineDash(style.dash);
    }
    
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
   * Dessine une courbe lissée avec splines
   * @param {Array<Object>} points - Points de la courbe
   * @param {Object} style - Style de la courbe
   * @private
   */
  _drawSmoothCurve(points, style) {
    // Convertir en points écran
    const screenPoints = points.map(point => 
      this.worldToScreen(point.x, point.t)
    );
    
    // Dessiner avec effet de lueur si activé
    if (style.glow) {
      this._drawGlowingSpline(screenPoints, style);
    } else {
      this._drawSpline(screenPoints, style);
    }
  }
  
  /**
   * Dessine une spline lissée
   * @param {Array<Object>} points - Points écran
   * @param {Object} style - Style de la spline
   * @private
   */
  _drawSpline(points, style) {
    if (points.length < 3) {
      return this._drawLinearCurve(points.map(p => ({ x: p.x, t: p.y })), style);
    }
    
    this.save();
    this.ctx.strokeStyle = style.stroke;
    this.ctx.lineWidth = style.width;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    if (style.dash) {
      this.ctx.setLineDash(style.dash);
    }
    
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    
    // Utiliser des courbes de Bézier pour lisser
    for (let i = 1; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      
      // Point de contrôle pour la courbe
      const controlX = current.x;
      const controlY = current.y;
      
      // Point final (milieu entre current et next)
      const endX = (current.x + next.x) / 2;
      const endY = (current.y + next.y) / 2;
      
      this.ctx.quadraticCurveTo(controlX, controlY, endX, endY);
    }
    
    // Terminer à la dernière point
    const lastPoint = points[points.length - 1];
    this.ctx.lineTo(lastPoint.x, lastPoint.y);
    
    this.ctx.stroke();
    this.restore();
  }
  
  /**
   * Dessine une spline avec effet de lueur
   * @param {Array<Object>} points - Points écran
   * @param {Object} style - Style avec lueur
   * @private
   */
  _drawGlowingSpline(points, style) {
    // Plusieurs passes pour l'effet de lueur
    const glowPasses = [
      { width: style.width * 4, alpha: 0.1 },
      { width: style.width * 2, alpha: 0.3 },
      { width: style.width, alpha: 1.0 }
    ];
    
    glowPasses.forEach(pass => {
      const glowStyle = {
        ...style,
        stroke: this._addAlphaToColor(style.stroke, pass.alpha),
        width: pass.width
      };
      this._drawSpline(points, glowStyle);
    });
  }
  
  /**
   * Dessine le label d'une isochrone
   * @param {Isochrone} isochrone - Isochrone
   * @param {Array<Object>} points - Points de la courbe
   * @param {Object} style - Style de la courbe
   * @private
   */
  _drawIsochroneLabel(isochrone, points, style) {
    if (points.length === 0) return;
    
    const labelStyle = this._defaultStyles.label;
    
    // Trouver un bon point pour placer le label (milieu de la courbe)
    const midIndex = Math.floor(points.length / 2);
    const labelPoint = this.worldToScreen(points[midIndex].x, points[midIndex].t);
    
    // Texte du label
    const properTime = isochrone.properTime;
    const labelText = `τ = ${properTime.toFixed(1)}`;
    
    this.save();
    
    // Mesurer le texte
    this.ctx.font = labelStyle.font;
    const textMetrics = this.ctx.measureText(labelText);
    const textWidth = textMetrics.width;
    const textHeight = 11; // Approximation
    
    // Position du label (décalé vers le haut)
    const labelX = labelPoint.x;
    const labelY = labelPoint.y - 15;
    
    // Dessiner le fond
    const bgX = labelX - textWidth / 2 - labelStyle.padding;
    const bgY = labelY - textHeight / 2 - labelStyle.padding;
    const bgWidth = textWidth + 2 * labelStyle.padding;
    const bgHeight = textHeight + 2 * labelStyle.padding;
    
    this.ctx.fillStyle = labelStyle.background;
    this.ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
    
    // Dessiner le texte
    this.ctx.fillStyle = labelStyle.color;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(labelText, labelX, labelY);
    
    this.restore();
  }
  
  /**
   * Calcule le style pour une isochrone dans une série
   * @param {number} index - Index dans la série
   * @param {number} total - Nombre total d'isochrones
   * @param {Object} options - Options de la série
   * @returns {Object} Style calculé
   * @private
   */
  _calculateSeriesStyle(index, total, options) {
    const style = { ...this._defaultStyles.curve };
    const progress = index / (total - 1); // 0 à 1
    
    // Gradient de couleur
    if (options.colorGradient) {
      const hue = 270 + progress * 60; // De violet (270°) à rouge (330°)
      style.stroke = `hsl(${hue}, 70%, 60%)`;
    }
    
    // Gradient d'alpha
    if (options.alphaGradient) {
      const { alphaRange } = this._defaultStyles.series;
      const alpha = alphaRange[0] + progress * (alphaRange[1] - alphaRange[0]);
      style.stroke = this._addAlphaToColor(style.stroke, alpha);
    }
    
    // Gradient de largeur
    if (options.widthGradient) {
      const { widthRange } = this._defaultStyles.series;
      style.width = widthRange[0] + progress * (widthRange[1] - widthRange[0]);
    }
    
    return style;
  }
  
  /**
   * Met en surbrillance une isochrone spécifique
   * @param {Isochrone} isochrone - Isochrone à mettre en surbrillance
   * @param {Object} [styleOverrides] - Styles de surbrillance personnalisés
   */
  highlightIsochrone(isochrone, styleOverrides = {}) {
    const highlightStyle = { 
      ...this._defaultStyles.highlighted, 
      ...styleOverrides,
      showLabel: true
    };
    
    this.drawIsochrone(isochrone, highlightStyle);
    this.emit('isochroneHighlighted', { isochrone });
  }
  
  /**
   * Dessine les intersections entre isochrones
   * @param {Array<Object>} intersections - Points d'intersection
   * @param {Object} [style] - Style des intersections
   */
  drawIntersections(intersections, style = {}) {
    const intersectionStyle = {
      fill: '#FFD700',
      stroke: '#FFA000',
      size: 4,
      glow: true,
      ...style
    };
    
    intersections.forEach(intersection => {
      const screenPos = this.worldToScreen(intersection.x, intersection.t);
      
      if (intersectionStyle.glow) {
        this._drawGlowingCircle(screenPos, intersectionStyle.size, intersectionStyle);
      } else {
        this._drawSimpleCircle(screenPos, intersectionStyle.size, intersectionStyle);
      }
    });
    
    this.emit('intersectionsDrawn', { count: intersections.length });
  }
  
  /**
   * Dessine un cercle simple
   * @param {Object} position - Position écran
   * @param {number} radius - Rayon en pixels
   * @param {Object} style - Style du cercle
   * @private
   */
  _drawSimpleCircle(position, radius, style) {
    this.save();
    
    this.ctx.beginPath();
    this.ctx.arc(position.x, position.y, radius, 0, 2 * Math.PI);
    
    if (style.fill) {
      this.ctx.fillStyle = style.fill;
      this.ctx.fill();
    }
    
    if (style.stroke) {
      this.ctx.strokeStyle = style.stroke;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
    
    this.restore();
  }
  
  /**
   * Dessine un cercle avec effet de lueur
   * @param {Object} position - Position écran
   * @param {number} radius - Rayon en pixels
   * @param {Object} style - Style avec lueur
   * @private
   */
  _drawGlowingCircle(position, radius, style) {
    // Effet de lueur
    const glowPasses = [
      { radius: radius * 3, alpha: 0.1 },
      { radius: radius * 2, alpha: 0.3 },
      { radius: radius, alpha: 1.0 }
    ];
    
    glowPasses.forEach(pass => {
      this.save();
      
      this.ctx.beginPath();
      this.ctx.arc(position.x, position.y, pass.radius, 0, 2 * Math.PI);
      
      const glowColor = this._addAlphaToColor(style.fill, pass.alpha);
      this.ctx.fillStyle = glowColor;
      this.ctx.fill();
      
      this.restore();
    });
    
    // Contour final
    this._drawSimpleCircle(position, radius, style);
  }
  
  /**
   * Ajoute de la transparence à une couleur
   * @param {string} color - Couleur de base
   * @param {number} alpha - Valeur alpha (0-1)
   * @returns {string} Couleur avec transparence
   * @private
   */
  _addAlphaToColor(color, alpha) {
    // Gestion des couleurs HSL
    if (color.startsWith('hsl')) {
      return color.replace('hsl', 'hsla').replace(')', `, ${alpha})`);
    }
    
    // Gestion des couleurs hex
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
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