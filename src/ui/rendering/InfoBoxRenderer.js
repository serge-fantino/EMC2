/**
 * @fileoverview Renderer pour les cartouches d'information des référentiels
 * @author Serge Fantino
 * @version 2.0.0
 */

import { CanvasRenderer } from './CanvasRenderer.js';

/**
 * Renderer spécialisé pour les cartouches d'information
 * @class InfoBoxRenderer
 * @extends CanvasRenderer
 */
export class InfoBoxRenderer extends CanvasRenderer {
  /**
   * Crée un nouveau renderer de cartouches d'information
   * @param {HTMLCanvasElement} canvas - Canvas de rendu
   * @param {Object} [options] - Options de configuration
   */
  constructor(canvas, options = {}) {
    super(canvas, options);
    
    /**
     * Configuration des cartouches
     * @type {Object}
     * @private
     */
    this._boxConfig = {
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      textColor: 'white',
      highlightColor: '#4a9eff',
      valueColor: '#ff9f4a',
      fontSize: 11,
      padding: 8,
      borderRadius: 5,
      shadowBlur: 10,
      ...options.infoBox
    };
    
    /**
     * Placements optimisés des cartouches
     * @type {Array}
     * @private
     */
    this._placements = [];
    
    /**
     * Offsets manuels des cartouches
     * @type {Object}
     * @private
     */
    this._manualOffsets = {};
  }
  
  /**
   * Dessine toutes les cartouches d'information
   * @param {Array<ReferenceFrame>} referenceFrames - Référentiels
   * @param {PhysicsCalculator} physicsCalculator - Calculateur de physique
   * @param {number} selectedIndex - Index du référentiel sélectionné
   */
  drawAllInfoBoxes(referenceFrames, physicsCalculator, selectedIndex = -1) {
    // Collecter toutes les boîtes à dessiner
    const infoBoxes = this._collectInfoBoxes(referenceFrames);
    
    // Calculer les placements optimisés
    this._placements = this._calculateOptimalPlacements(infoBoxes);
    
    // Dessiner chaque cartouche
    this._placements.forEach((placement, index) => {
      const frame = referenceFrames[index];
      const isSelected = index === selectedIndex;
      
      if (index === 0) {
        this._drawOriginInfoBox(placement, frame, isSelected);
      } else {
        const physics = physicsCalculator.calculateSegmentPhysics(frame, referenceFrames[frame.sourceIndex || 0]);
        this._drawReferenceFrameInfoBox(placement, frame, physics, index, isSelected);
      }
    });
  }
  
  /**
   * Collecte les informations des boîtes à dessiner
   * @param {Array<ReferenceFrame>} referenceFrames - Référentiels
   * @returns {Array} Informations des boîtes
   * @private
   */
  _collectInfoBoxes(referenceFrames) {
    return referenceFrames.map((frame, index) => {
      const screen = this.worldToScreen(frame.x, frame.t);
      
      if (index === 0) {
        // Boîte d'origine
        return {
          idealX: screen.x + 20,
          idealY: screen.y - 55,
          width: 120,
          height: 65,
          index,
          isOrigin: true,
          originX: screen.x,
          originY: screen.y
        };
      } else {
        // Boîte de référentiel
        return {
          idealX: screen.x + 20,
          idealY: screen.y - 80,
          width: 150,
          height: 105,
          index,
          isOrigin: false,
          originX: screen.x,
          originY: screen.y
        };
      }
    });
  }
  
  /**
   * Calcule les placements optimisés pour éviter les chevauchements
   * @param {Array} infoBoxes - Boîtes d'information
   * @returns {Array} Placements optimisés
   * @private
   */
  _calculateOptimalPlacements(infoBoxes) {
    const { width, height } = this.getDimensions();
    const placements = [];
    
    infoBoxes.forEach(box => {
      let placement = {
        x: box.idealX,
        y: box.idealY,
        width: box.width,
        height: box.height,
        originalBox: box
      };
      
      // Appliquer l'offset manuel si disponible
      const offset = this._manualOffsets[box.index];
      if (offset) {
        placement.x += offset.x;
        placement.y += offset.y;
      }
      
      // Contraindre dans les limites du canvas
      placement.x = Math.max(0, Math.min(width - placement.width, placement.x));
      placement.y = Math.max(0, Math.min(height - placement.height, placement.y));
      
      // Éviter les chevauchements avec les placements existants
      placement = this._resolveOverlaps(placement, placements);
      
      placements.push(placement);
    });
    
    return placements;
  }
  
  /**
   * Résout les chevauchements entre boîtes
   * @param {Object} placement - Placement à ajuster
   * @param {Array} existingPlacements - Placements existants
   * @returns {Object} Placement ajusté
   * @private
   */
  _resolveOverlaps(placement, existingPlacements) {
    const margin = 5;
    let adjusted = { ...placement };
    
    for (const existing of existingPlacements) {
      if (this._boxesOverlap(adjusted, existing, margin)) {
        // Essayer de déplacer vers la droite
        adjusted.x = existing.x + existing.width + margin;
        
        // Si ça sort du canvas, essayer vers le bas
        if (adjusted.x + adjusted.width > this.getDimensions().width) {
          adjusted.x = placement.x;
          adjusted.y = existing.y + existing.height + margin;
          
          // Si ça sort du canvas, essayer vers le haut
          if (adjusted.y + adjusted.height > this.getDimensions().height) {
            adjusted.y = existing.y - adjusted.height - margin;
          }
        }
      }
    }
    
    return adjusted;
  }
  
  /**
   * Vérifie si deux boîtes se chevauchent
   * @param {Object} box1 - Première boîte
   * @param {Object} box2 - Deuxième boîte
   * @param {number} margin - Marge de sécurité
   * @returns {boolean} True si chevauchement
   * @private
   */
  _boxesOverlap(box1, box2, margin = 0) {
    return !(box1.x + box1.width + margin < box2.x ||
             box2.x + box2.width + margin < box1.x ||
             box1.y + box1.height + margin < box2.y ||
             box2.y + box2.height + margin < box1.y);
  }
  
  /**
   * Dessine la cartouche d'information de l'origine
   * @param {Object} placement - Placement de la boîte
   * @param {ReferenceFrame} frame - Référentiel origine
   * @param {boolean} isSelected - Si sélectionné
   * @private
   */
  _drawOriginInfoBox(placement, frame, isSelected) {
    const { backgroundColor, borderColor, textColor, highlightColor } = this._boxConfig;
    
    // Dessiner la ligne de connexion si déplacée
    if (this._isBoxMoved(placement)) {
      this._drawConnectionLine(placement);
    }
    
    // Fond et bordure
    this._drawBoxBackground(placement, isSelected);
    
    // Contenu
    this.ctx.fillStyle = textColor;
    this.ctx.font = `${this._boxConfig.fontSize}px Arial`;
    
    const x = placement.x + this._boxConfig.padding;
    let y = placement.y + this._boxConfig.padding + 12;
    
    // Titre
    this.ctx.fillStyle = highlightColor;
    this.ctx.font = `bold ${this._boxConfig.fontSize}px Arial`;
    this.ctx.fillText('Origine', x, y);
    
    // Informations
    this.ctx.fillStyle = textColor;
    this.ctx.font = `${this._boxConfig.fontSize}px Arial`;
    y += 15;
    this.ctx.fillText('x = 0', x, y);
    y += 12;
    this.ctx.fillText('t = 0', x, y);
    y += 12;
    this.ctx.fillText('Référentiel inertiel', x, y);
  }
  
  /**
   * Dessine la cartouche d'information d'un référentiel
   * @param {Object} placement - Placement de la boîte
   * @param {ReferenceFrame} frame - Référentiel
   * @param {Object} physics - Calculs physiques
   * @param {number} index - Index du référentiel
   * @param {boolean} isSelected - Si sélectionné
   * @private
   */
  _drawReferenceFrameInfoBox(placement, frame, physics, index, isSelected) {
    const { textColor, highlightColor, valueColor } = this._boxConfig;
    
    // Dessiner la ligne de connexion si déplacée
    if (this._isBoxMoved(placement)) {
      this._drawConnectionLine(placement);
    }
    
    // Fond et bordure
    this._drawBoxBackground(placement, isSelected);
    
    // Contenu
    const x = placement.x + this._boxConfig.padding;
    let y = placement.y + this._boxConfig.padding + 12;
    
    // Titre avec bouton de suppression
    this.ctx.fillStyle = highlightColor;
    this.ctx.font = `bold ${this._boxConfig.fontSize}px Arial`;
    this.ctx.fillText(`Réf ${index}`, x, y);
    
    // Bouton de suppression (si pas l'origine)
    if (index > 0) {
      const deleteX = placement.x + placement.width - 20;
      const deleteY = placement.y + 5;
      this._drawDeleteButton(deleteX, deleteY, index);
    }
    
    // Position
    this.ctx.fillStyle = textColor;
    this.ctx.font = `${this._boxConfig.fontSize}px Arial`;
    y += 15;
    this.ctx.fillText(`x = ${frame.x.toFixed(1)}`, x, y);
    y += 12;
    this.ctx.fillText(`t = ${frame.t.toFixed(1)}`, x, y);
    
    // Vitesse
    y += 15;
    this.ctx.fillStyle = valueColor;
    const velocityPercent = (Math.abs(physics.finalVelocity) * 100).toFixed(1);
    this.ctx.fillText(`v = ${velocityPercent}% c`, x, y);
    
    // Accélération propre
    y += 12;
    this.ctx.fillStyle = textColor;
    this.ctx.fillText(`a = ${physics.acceleration.toFixed(3)} c²/t`, x, y);
    
    // Temps propre
    y += 12;
    this.ctx.fillStyle = valueColor;
    this.ctx.fillText(`τ = ${physics.properTime.toFixed(3)} t`, x, y);
    
    // Dilatation temporelle
    y += 12;
    this.ctx.fillStyle = highlightColor;
    const dilationPercent = (physics.properTime / frame.t * 100).toFixed(1);
    this.ctx.fillText(`Dilatation: ${dilationPercent}%`, x, y);
  }
  
  /**
   * Dessine le fond et la bordure d'une boîte
   * @param {Object} placement - Placement de la boîte
   * @param {boolean} isSelected - Si sélectionnée
   * @private
   */
  _drawBoxBackground(placement, isSelected) {
    const { backgroundColor, borderColor, highlightColor, borderRadius, shadowBlur } = this._boxConfig;
    
    // Ombre
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    this.ctx.shadowBlur = shadowBlur;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;
    
    // Fond
    this.ctx.fillStyle = backgroundColor;
    this._drawRoundedRect(placement.x, placement.y, placement.width, placement.height, borderRadius);
    this.ctx.fill();
    
    // Bordure
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    
    this.ctx.strokeStyle = isSelected ? highlightColor : borderColor;
    this.ctx.lineWidth = isSelected ? 2 : 1;
    this._drawRoundedRect(placement.x, placement.y, placement.width, placement.height, borderRadius);
    this.ctx.stroke();
  }
  
  /**
   * Dessine un rectangle arrondi
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {number} width - Largeur
   * @param {number} height - Hauteur
   * @param {number} radius - Rayon des coins
   * @private
   */
  _drawRoundedRect(x, y, width, height, radius) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }
  
  /**
   * Dessine une ligne de connexion entre la boîte et son origine
   * @param {Object} placement - Placement de la boîte
   * @private
   */
  _drawConnectionLine(placement) {
    const { originX, originY } = placement.originalBox;
    const boxCenterX = placement.x + placement.width / 2;
    const boxCenterY = placement.y + placement.height / 2;
    
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([2, 2]);
    
    this.ctx.beginPath();
    this.ctx.moveTo(originX, originY);
    this.ctx.lineTo(boxCenterX, boxCenterY);
    this.ctx.stroke();
    
    this.ctx.setLineDash([]);
  }
  
  /**
   * Dessine un bouton de suppression
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {number} index - Index du référentiel
   * @private
   */
  _drawDeleteButton(x, y, index) {
    // Fond du bouton
    this.ctx.fillStyle = '#ff4444';
    this.ctx.beginPath();
    this.ctx.arc(x, y, 8, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Icône de suppression
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 10px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('×', x, y + 3);
    this.ctx.textAlign = 'left';
  }
  
  /**
   * Vérifie si une boîte a été déplacée de sa position idéale
   * @param {Object} placement - Placement de la boîte
   * @returns {boolean} True si déplacée
   * @private
   */
  _isBoxMoved(placement) {
    const { originalBox } = placement;
    const offset = this._manualOffsets[originalBox.index];
    
    return offset && (offset.x !== 0 || offset.y !== 0);
  }
  
  /**
   * Trouve la cartouche à une position donnée
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @returns {number} Index de la cartouche (-1 si aucune)
   */
  findBoxAtPosition(x, y) {
    for (const placement of this._placements) {
      if (x >= placement.x && x <= placement.x + placement.width &&
          y >= placement.y && y <= placement.y + placement.height) {
        return placement.originalBox.index;
      }
    }
    return -1;
  }
  
  /**
   * Trouve le bouton de suppression à une position donnée
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @returns {number} Index du référentiel (-1 si aucun)
   */
  findDeleteButtonAtPosition(x, y) {
    for (const placement of this._placements) {
      if (placement.originalBox.index > 0) { // Pas pour l'origine
        const deleteX = placement.x + placement.width - 20;
        const deleteY = placement.y + 5;
        const distance = Math.sqrt((x - deleteX) ** 2 + (y - deleteY) ** 2);
        
        if (distance <= 8) {
          return placement.originalBox.index;
        }
      }
    }
    return -1;
  }
  
  /**
   * Définit l'offset manuel d'une cartouche
   * @param {number} index - Index du référentiel
   * @param {number} offsetX - Offset X
   * @param {number} offsetY - Offset Y
   */
  setManualOffset(index, offsetX, offsetY) {
    this._manualOffsets[index] = { x: offsetX, y: offsetY };
  }
  
  /**
   * Obtient l'offset manuel d'une cartouche
   * @param {number} index - Index du référentiel
   * @returns {Object} Offset {x, y}
   */
  getManualOffset(index) {
    return this._manualOffsets[index] || { x: 0, y: 0 };
  }
  
  /**
   * Remet à zéro tous les offsets manuels
   */
  resetManualOffsets() {
    this._manualOffsets = {};
  }
} 