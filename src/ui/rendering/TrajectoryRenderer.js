/**
 * @fileoverview Renderer spécialisé pour les trajectoires relativistes
 * @author Serge Fantino
 * @version 2.0.0
 */

import { CanvasRenderer } from './CanvasRenderer.js';
import { ReferenceFrame } from '@core/entities/ReferenceFrame.js';

/**
 * Renderer spécialisé pour les trajectoires relativistes
 * @class TrajectoryRenderer
 * @extends CanvasRenderer
 */
export class TrajectoryRenderer extends CanvasRenderer {
  /**
   * Crée un nouveau renderer de trajectoires
   * @param {HTMLCanvasElement} canvas - Élément canvas
   * @param {Object} [options] - Options de rendu
   */
  constructor(canvas, options = {}) {
    super(canvas, options);
    
    /**
     * Styles par défaut pour les trajectoires
     * @type {Object}
     * @private
     */
    this._defaultStyles = {
      trajectory: {
        stroke: '#E91E63',
        width: 3,
        smooth: true,
        glow: true
      },
      segment: {
        stroke: '#FF5722',
        width: 2,
        dash: null
      },
      referenceFrame: {
        fill: '#2196F3',
        stroke: '#FFFFFF',
        size: 6,
        glow: true
      },
      connection: {
        stroke: '#9E9E9E',
        width: 1,
        dash: [3, 3]
      },
      label: {
        color: '#FFFFFF',
        font: '12px Arial',
        background: 'rgba(0, 0, 0, 0.7)',
        padding: 4
      }
    };
  }
  
  /**
   * Dessine une trajectoire complète
   * @param {Array<ReferenceFrame>} referenceFrames - Chaîne de référentiels
   * @param {Object} [styleOverrides] - Styles personnalisés
   */
  drawTrajectory(referenceFrames, styleOverrides = {}) {
    if (!Array.isArray(referenceFrames) || referenceFrames.length === 0) {
      throw new Error('referenceFrames doit être un tableau non vide');
    }
    
    const styles = { ...this._defaultStyles, ...styleOverrides };
    
    // Dessiner les connexions entre référentiels
    this._drawTrajectoryConnections(referenceFrames, styles.connection);
    
    // Dessiner la trajectoire lissée
    if (styles.trajectory.smooth && referenceFrames.length > 2) {
      this._drawSmoothTrajectory(referenceFrames, styles.trajectory);
    } else {
      this._drawLinearTrajectory(referenceFrames, styles.segment);
    }
    
    // Dessiner les référentiels
    referenceFrames.forEach((frame, index) => {
      this._drawReferenceFrame(frame, index, styles.referenceFrame);
    });
    
    this.emit('trajectoryDrawn', { referenceFrames, styles });
  }
  
  /**
   * Dessine les connexions entre référentiels
   * @param {Array<ReferenceFrame>} frames - Référentiels
   * @param {Object} style - Style des connexions
   * @private
   */
  _drawTrajectoryConnections(frames, style) {
    this.save();
    this.ctx.strokeStyle = style.stroke;
    this.ctx.lineWidth = style.width;
    if (style.dash) this.ctx.setLineDash(style.dash);
    
    for (let i = 1; i < frames.length; i++) {
      const source = frames[i - 1];
      const target = frames[i];
      
      this.drawLine(source.x, source.t, target.x, target.t, style);
    }
    
    this.restore();
  }
  
  /**
   * Dessine une trajectoire linéaire (segments droits)
   * @param {Array<ReferenceFrame>} frames - Référentiels
   * @param {Object} style - Style de la trajectoire
   * @private
   */
  _drawLinearTrajectory(frames, style) {
    if (frames.length < 2) return;
    
    this.save();
    this.ctx.strokeStyle = style.stroke;
    this.ctx.lineWidth = style.width;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    this.ctx.beginPath();
    const firstPoint = this.worldToScreen(frames[0].x, frames[0].t);
    this.ctx.moveTo(firstPoint.x, firstPoint.y);
    
    for (let i = 1; i < frames.length; i++) {
      const point = this.worldToScreen(frames[i].x, frames[i].t);
      this.ctx.lineTo(point.x, point.y);
    }
    
    this.ctx.stroke();
    this.restore();
  }
  
  /**
   * Dessine une trajectoire lissée avec splines
   * @param {Array<ReferenceFrame>} frames - Référentiels
   * @param {Object} style - Style de la trajectoire
   * @private
   */
  _drawSmoothTrajectory(frames, style) {
    if (frames.length < 3) {
      this._drawLinearTrajectory(frames, style);
      return;
    }
    
    // Convertir en points écran
    const screenPoints = frames.map(frame => 
      this.worldToScreen(frame.x, frame.t)
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
    this.save();
    this.ctx.strokeStyle = style.stroke;
    this.ctx.lineWidth = style.width;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    
    // Utiliser des courbes de Bézier quadratiques
    for (let i = 1; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlX = current.x;
      const controlY = current.y;
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
      { width: style.width * 6, alpha: 0.05 },
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
   * Dessine un référentiel individuel
   * @param {ReferenceFrame} frame - Référentiel à dessiner
   * @param {number} index - Index du référentiel
   * @param {Object} style - Style du référentiel
   * @private
   */
  _drawReferenceFrame(frame, index, style) {
    const screenPos = this.worldToScreen(frame.x, frame.t);
    const radius = style.size;
    
    // Dessiner l'effet de lueur si activé
    if (style.glow) {
      this._drawGlowingCircle(screenPos, radius, style);
    } else {
      this._drawSimpleCircle(screenPos, radius, style);
    }
    
    // Dessiner le label si c'est l'origine ou un point important
    if (index === 0 || frame.metadata?.label) {
      const label = frame.metadata?.label || `R${index}`;
      this._drawFrameLabel(screenPos, label, style);
    }
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
      { radius: radius * 2, alpha: 0.2 },
      { radius: radius * 1.5, alpha: 0.4 },
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
   * Dessine le label d'un référentiel
   * @param {Object} position - Position écran
   * @param {string} label - Texte du label
   * @param {Object} style - Style du label
   * @private
   */
  _drawFrameLabel(position, label, style) {
    const labelStyle = this._defaultStyles.label;
    const offsetY = -style.size - 15; // Au-dessus du point
    
    this.save();
    
    // Mesurer le texte
    this.ctx.font = labelStyle.font;
    const textMetrics = this.ctx.measureText(label);
    const textWidth = textMetrics.width;
    const textHeight = 12; // Approximation
    
    // Dessiner le fond
    const bgX = position.x - textWidth / 2 - labelStyle.padding;
    const bgY = position.y + offsetY - textHeight - labelStyle.padding;
    const bgWidth = textWidth + 2 * labelStyle.padding;
    const bgHeight = textHeight + 2 * labelStyle.padding;
    
    this.ctx.fillStyle = labelStyle.background;
    this.ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
    
    // Dessiner le texte
    this.ctx.fillStyle = labelStyle.color;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(label, position.x, position.y + offsetY - textHeight / 2);
    
    this.restore();
  }
  
  /**
   * Dessine les vecteurs vitesse aux points de la trajectoire
   * @param {Array<ReferenceFrame>} frames - Référentiels
   * @param {Array<number>} velocities - Vitesses correspondantes
   * @param {Object} [style] - Style des vecteurs
   */
  drawVelocityVectors(frames, velocities, style = {}) {
    const vectorStyle = {
      stroke: '#FFC107',
      width: 2,
      arrowSize: 8,
      scale: 50, // Facteur d'échelle pour les vecteurs
      ...style
    };
    
    frames.forEach((frame, index) => {
      if (index < velocities.length) {
        const velocity = velocities[index];
        this._drawVelocityVector(frame, velocity, vectorStyle);
      }
    });
  }
  
  /**
   * Dessine un vecteur vitesse individuel
   * @param {ReferenceFrame} frame - Référentiel
   * @param {number} velocity - Vitesse (v/c)
   * @param {Object} style - Style du vecteur
   * @private
   */
  _drawVelocityVector(frame, velocity, style) {
    const startPos = this.worldToScreen(frame.x, frame.t);
    
    // Calculer la direction et la longueur du vecteur
    const vectorLength = Math.abs(velocity) * style.scale;
    const direction = Math.sign(velocity);
    
    const endX = startPos.x + direction * vectorLength;
    const endY = startPos.y; // Vecteur horizontal
    
    // Dessiner la ligne du vecteur
    this.save();
    this.ctx.strokeStyle = style.stroke;
    this.ctx.lineWidth = style.width;
    this.ctx.beginPath();
    this.ctx.moveTo(startPos.x, startPos.y);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();
    
    // Dessiner la pointe de flèche
    this._drawArrowHead(endX, endY, direction, style);
    
    this.restore();
  }
  
  /**
   * Dessine une pointe de flèche
   * @param {number} x - Position X de la pointe
   * @param {number} y - Position Y de la pointe
   * @param {number} direction - Direction (-1 ou 1)
   * @param {Object} style - Style de la flèche
   * @private
   */
  _drawArrowHead(x, y, direction, style) {
    const size = style.arrowSize;
    const angle = Math.PI / 6; // 30 degrés
    
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(
      x - direction * size * Math.cos(angle),
      y - size * Math.sin(angle)
    );
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(
      x - direction * size * Math.cos(angle),
      y + size * Math.sin(angle)
    );
    this.ctx.stroke();
  }
  
  /**
   * Ajoute de la transparence à une couleur
   * @param {string} color - Couleur de base
   * @param {number} alpha - Valeur alpha (0-1)
   * @returns {string} Couleur avec transparence
   * @private
   */
  _addAlphaToColor(color, alpha) {
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