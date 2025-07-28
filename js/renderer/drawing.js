/**
 * FONCTIONS DE DESSIN - Module Renderer
 * Refactoring Phase 3 - Dessin spécialisé et rendu principal
 */

import { spacetimeToScreen, screenToSpacetime, getCanvasTransform, isInCanvasBounds, getCanvas, getCtx } from './canvas.js';
import { getColorForVelocity, getConeColorModulation, blendColors, UI_COLORS } from './colors.js';
import { 
    calculateVelocityRatio, 
    calculateCumulativePhysics, 
    calculateIsochronePoints, 
    limitVelocity,
    calculateAccelerationTrajectory
} from '../physics/index.js';

// Variables globales pour le rendu
let _canvas = null;
let _ctx = null;

// Variables globales pour hover et placement
let currentIsochronePoints = [];
let isochroneHoverInfo = null;
let currentPlacements = [];

/**
 * Initialise les références canvas/ctx pour ce module
 * @param {HTMLCanvasElement} canvas 
 * @param {CanvasRenderingContext2D} ctx 
 */
export function initDrawingModule(canvas, ctx) {
    _canvas = canvas;
    _ctx = ctx;
    console.log('Drawing module initialized');
}

/**
 * ========== FONCTIONS HELPER ==========
 */

/**
 * Calcule la distance d'un point à un segment de ligne
 * @param {number} px - Point X
 * @param {number} py - Point Y  
 * @param {number} x1 - Ligne début X
 * @param {number} y1 - Ligne début Y
 * @param {number} x2 - Ligne fin X
 * @param {number} y2 - Ligne fin Y
 * @returns {number} Distance minimale
 */
function distanceToLineSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (length * length)));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    
    return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
}

/**
 * Vérifie si un chemin fait partie de la trajectoire sélectionnée
 * @param {number} coneIndex - Index du cône
 * @param {number} selectedReferenceFrame - Référentiel sélectionné
 * @param {Array} coneOrigins - Origines des cônes
 * @returns {boolean} True si fait partie de la trajectoire
 */
function isPathInSelectedTrajectory(coneIndex, selectedReferenceFrame, coneOrigins) {
    if (selectedReferenceFrame === 0) return false;
    
    // Vérifier si ce chemin fait partie de la chaîne menant au référentiel sélectionné
    let currentIndex = selectedReferenceFrame;
    while (currentIndex !== -1) {
        if (currentIndex === coneIndex) return true;
        currentIndex = coneOrigins[currentIndex].sourceIndex;
    }
    return false;
}

/**
 * Vérifie si la souris est sur un point d'origine de cône
 * @param {number} mouseX - Position X souris
 * @param {number} mouseY - Position Y souris
 * @param {Array} coneOrigins - Origines des cônes
 * @returns {number} Index du cône ou -1 si aucun
 */
export function getConeAtPosition(mouseX, mouseY, coneOrigins) {
    const threshold = 15; // Seuil de clic en pixels
    
    for (let i = 1; i < coneOrigins.length; i++) { // Ignorer l'origine (index 0)
        const origin = coneOrigins[i];
        const screen = spacetimeToScreen(origin.x, origin.t);
        const distance = Math.sqrt(
            Math.pow(mouseX - screen.screenX, 2) + 
            Math.pow(mouseY - screen.screenY, 2)
        );
        
        if (distance <= threshold) {
            return i;
        }
    }
    return -1;
}

/**
 * Vérifie si la souris est sur une cartouche d'information
 * @param {number} mouseX - Position X souris
 * @param {number} mouseY - Position Y souris
 * @param {Array} placements - Placements des cartouches
 * @returns {number} Index du cône ou -1 si aucun
 */
export function getCartoucheAtPosition(mouseX, mouseY, placements) {
    for (const placement of placements) {
        const coneIndex = placement.originalBox.coneIndex;
        if (mouseX >= placement.x && mouseX <= placement.x + placement.width &&
            mouseY >= placement.y && mouseY <= placement.y + placement.height) {
            return coneIndex;
        }
    }
    return -1;
}

/**
 * Applique un décalage manuel au placement d'une cartouche
 * @param {Object} placement - Placement de base
 * @param {number} coneIndex - Index du cône
 * @param {Object} cartoucheOffsets - Décalages manuels
 * @returns {Object} Placement avec décalage appliqué
 */
export function applyCartoucheOffset(placement, coneIndex, cartoucheOffsets) {
    const offset = cartoucheOffsets[coneIndex] || { x: 0, y: 0 };
    return {
        ...placement,
        x: placement.x + offset.x,
        y: placement.y + offset.y
    };
}

/**
 * ========== FONCTIONS DE DESSIN PRINCIPAL ==========
 */

/**
 * Dessine la heatmap des cônes de lumière
 * @param {Object} config - Configuration de rendu
 * @param {Array} coneOrigins - Origines des cônes
 * @param {number} selectedReferenceFrame - Référentiel sélectionné
 * @param {Object} resolutionSettings - Paramètres de résolution
 */
export function drawLightConeHeatmap(config, coneOrigins, selectedReferenceFrame, resolutionSettings) {
    if (!_ctx || !_canvas) return;
    
    // Créer ImageData pour la heatmap
    const imageData = _ctx.createImageData(_canvas.width, _canvas.height);
    const data = imageData.data;
    
    // Effacer avec du noir
    for (let i = 0; i < data.length; i += 4) {
        data[i] = 0;     // R
        data[i + 1] = 0; // G
        data[i + 2] = 0; // B
        data[i + 3] = 255; // A
    }
    
    const pixelSize = resolutionSettings[config.resolution].pixelSize;
    
    // Dessiner tous les cônes avec superposition de transparence (plus anciens vers plus récents)
    for (let coneIndex = 0; coneIndex < coneOrigins.length; coneIndex++) {
        const coneOrigin = coneOrigins[coneIndex];
        
        // Dessiner la heatmap du cône
        for (let px = 0; px < _canvas.width; px += pixelSize) {
            for (let py = 0; py < _canvas.height; py += pixelSize) {
                // Convertir coordonnées pixel vers espace-temps
                const spacetime = screenToSpacetime(px, py);
                
                // Calculer position relative depuis l'origine de ce cône
                const relativeX = spacetime.x - coneOrigin.x;
                const relativeT = spacetime.t - coneOrigin.t;
                
                // Dessiner seulement le cône de lumière futur (t > 0)
                if (relativeT > 0) {
                    const velocityRatio = calculateVelocityRatio(relativeX, 0, relativeT);
                    
                    // Vérifier si le point est dans le cône de lumière
                    if (velocityRatio <= 1) {
                        const color = getColorForVelocity(velocityRatio, config);
                        
                        // Appliquer modulation couleur spécifique au cône
                        const coneModulation = getConeColorModulation(coneIndex, selectedReferenceFrame);
                        
                        // Dessiner seulement si la couleur a de l'opacité
                        if (color.alpha > 0) {
                            // Remplir bloc de pixels
                            for (let dx = 0; dx < pixelSize; dx++) {
                                for (let dy = 0; dy < pixelSize; dy++) {
                                                                            const index = ((py + dy) * _canvas.width + (px + dx)) * 4;
                                    if (index < data.length - 3) {
                                        // Mélange alpha avec pixels existants
                                        const existingColor = {
                                            r: data[index],
                                            g: data[index + 1], 
                                            b: data[index + 2],
                                            alpha: data[index + 3]
                                        };
                                        
                                        const blendedColor = blendColors(color, existingColor, coneModulation);
                                        
                                        data[index] = blendedColor.r;
                                        data[index + 1] = blendedColor.g;
                                        data[index + 2] = blendedColor.b;
                                        data[index + 3] = blendedColor.alpha;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    _ctx.putImageData(imageData, 0, 0);
}

/**
 * Dessine un chemin d'accélération entre deux cônes
 * @param {Object} fromCone - Cône de départ
 * @param {Object} toCone - Cône d'arrivée  
 * @param {number} newConeIndex - Index du nouveau cône
 * @param {Array} coneOrigins - Origines des cônes
 * @param {number} selectedReferenceFrame - Référentiel sélectionné
 */
export function drawAccelerationPath(fromCone, toCone, newConeIndex, coneOrigins, selectedReferenceFrame) {
    if (!_ctx) return;
    
    const fromScreen = spacetimeToScreen(fromCone.x, fromCone.t);
    const toScreen = spacetimeToScreen(toCone.x, toCone.t);
    
    // S'assurer qu'on va vers le futur
    if (toCone.t <= fromCone.t) return;
    
    // Obtenir vitesse initiale du cône de départ (fromCone)
    let fromConeIndex = -1;
    for (let i = 0; i < coneOrigins.length; i++) {
        if (coneOrigins[i] === fromCone) {
            fromConeIndex = i;
            break;
        }
    }
    const fromPhysics = calculateCumulativePhysics(fromConeIndex, coneOrigins);
    
    // Obtenir vitesse initiale du cône de départ
    const v0 = limitVelocity(fromPhysics.cumulativeVelocity); // Appliquer limite de vitesse
    
    // UTILISER LE NOUVEAU BRIDGE MODULE
    try {
        // Calculer la trajectoire avec le nouveau système
        const trajectory = calculateAccelerationTrajectory(fromCone, toCone, v0);
        
        // Si la trajectoire est vide, c'est que le rendez-vous est impossible
        if (trajectory.length === 0) {
    
            return;
        }
        
        // Vérifier si ce chemin fait partie de la trajectoire du référentiel sélectionné
        const isPartOfSelectedTrajectory_result = isPathInSelectedTrajectory(newConeIndex, selectedReferenceFrame, coneOrigins);
        
        // Définir style de ligne selon sélection
        if (isPartOfSelectedTrajectory_result) {
            _ctx.strokeStyle = UI_COLORS.PATH_SELECTED; // Blanc brillant pour sélectionné
            _ctx.lineWidth = 4; // Ligne épaisse
            _ctx.setLineDash([8, 4]); // Tirets plus longs
        } else {
            _ctx.strokeStyle = UI_COLORS.PATH_NORMAL;
            _ctx.lineWidth = 2;
            _ctx.setLineDash([5, 5]);
        }
        
        _ctx.beginPath();
        _ctx.moveTo(fromScreen.screenX, fromScreen.screenY);
        
        // Dessiner la trajectoire calculée par le bridge
        for (const point of trajectory) {
            const screenPoint = spacetimeToScreen(point.x, point.t);
            _ctx.lineTo(screenPoint.screenX, screenPoint.screenY);
        }
        
        _ctx.stroke();
        _ctx.setLineDash([]); // Reset dash pattern
        
        // Dessiner une flèche au bout de la trajectoire
        const arrowLength = isPartOfSelectedTrajectory_result ? 15 : 10;
        const angle = Math.atan2(toScreen.screenY - fromScreen.screenY, toScreen.screenX - fromScreen.screenX);
        
        _ctx.beginPath();
        _ctx.moveTo(toScreen.screenX, toScreen.screenY);
        _ctx.lineTo(
            toScreen.screenX - arrowLength * Math.cos(angle - Math.PI / 6),
            toScreen.screenY - arrowLength * Math.sin(angle - Math.PI / 6)
        );
        _ctx.moveTo(toScreen.screenX, toScreen.screenY);
        _ctx.lineTo(
            toScreen.screenX - arrowLength * Math.cos(angle + Math.PI / 6),
            toScreen.screenY - arrowLength * Math.sin(angle + Math.PI / 6)
        );
        _ctx.stroke();
        
    } catch (error) {
        console.warn('Erreur dans drawAccelerationPath avec le bridge:', error);
        // Fallback vers l'ancien système si nécessaire
        return;
    }
}

/**
 * Dessine l'isochrone pour le référentiel sélectionné
 * @param {number} selectedReferenceFrame - Référentiel sélectionné
 * @param {Array} coneOrigins - Origines des cônes
 */
export function drawSelectedIsochrone(selectedReferenceFrame, coneOrigins) {
    const canvas = getCanvas();
    const ctx = getCtx();
    if (!ctx || !canvas) return;
    
    if (selectedReferenceFrame === 0) {
        currentIsochronePoints = [];
        return;
    }
    
    const selectedCone = coneOrigins[selectedReferenceFrame];
    const physics = calculateCumulativePhysics(selectedReferenceFrame, coneOrigins);
    const tau = physics.cumulativeProperTime;
    
    if (tau <= 0.01) {
        currentIsochronePoints = [];
        return;
    }
    
    const origin = coneOrigins[0];
    const isochronePoints = calculateIsochronePoints(tau, origin, selectedCone, _canvas.width);
    
    currentIsochronePoints = isochronePoints;
    
    if (isochronePoints.length < 2) return;
    
    // Dessiner la courbe isochrone
    _ctx.strokeStyle = UI_COLORS.ISOCHRONE;
    _ctx.lineWidth = 2;
    _ctx.setLineDash([10, 5]);
    
    _ctx.beginPath();
    
    let firstScreen = spacetimeToScreen(isochronePoints[0].x, isochronePoints[0].t);
    _ctx.moveTo(firstScreen.screenX, firstScreen.screenY);
    
    for (let i = 1; i < isochronePoints.length; i++) {
        const screen = spacetimeToScreen(isochronePoints[i].x, isochronePoints[i].t);
        
        if (isInCanvasBounds(screen.screenX, screen.screenY)) {
            _ctx.lineTo(screen.screenX, screen.screenY);
        }
    }
    
    _ctx.stroke();
    _ctx.setLineDash([]);
}

/**
 * Dessine les enveloppes de cônes de lumière
 * @param {number} selectedReferenceFrame - Référentiel sélectionné
 * @param {Array} coneOrigins - Origines des cônes
 * @param {Object} config - Configuration
 */
export function drawLightConeEnvelopes(selectedReferenceFrame, coneOrigins, config) {
    if (!_ctx || !_canvas) return;
    
    if (selectedReferenceFrame === 0) return;
    
    const selectedCone = coneOrigins[selectedReferenceFrame];
    const c = 1;
    
    _ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    _ctx.lineWidth = 1;
    _ctx.setLineDash([5, 5]);
    
    _ctx.beginPath();
    
    const { centerX, centerY, scale } = getCanvasTransform();
    const maxExtent = Math.max(_canvas.width, _canvas.height);
    
    // Frontière gauche du cône futur
    const leftStartFuture = spacetimeToScreen(selectedCone.x, selectedCone.t);
    _ctx.moveTo(leftStartFuture.screenX, leftStartFuture.screenY);
    
    const futureTime = selectedCone.t + maxExtent / scale;
    const leftFutureX = selectedCone.x - c * (futureTime - selectedCone.t);
    const leftFutureScreen = spacetimeToScreen(leftFutureX, futureTime);
    _ctx.lineTo(leftFutureScreen.screenX, leftFutureScreen.screenY);
    
    // Frontière droite du cône futur
    _ctx.moveTo(leftStartFuture.screenX, leftStartFuture.screenY);
    const rightFutureX = selectedCone.x + c * (futureTime - selectedCone.t);
    const rightFutureScreen = spacetimeToScreen(rightFutureX, futureTime);
    _ctx.lineTo(rightFutureScreen.screenX, rightFutureScreen.screenY);
    
    _ctx.stroke();
    
    // Cône de lumière passé (optionnel)
    if (config.showPastCone) {
        _ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        _ctx.lineWidth = 1;
        _ctx.setLineDash([3, 3]);
        
        _ctx.beginPath();
        
        const leftStartPast = spacetimeToScreen(selectedCone.x, selectedCone.t);
        _ctx.moveTo(leftStartPast.screenX, leftStartPast.screenY);
        
        const pastTime = selectedCone.t - maxExtent / 2;
        const leftPastX = selectedCone.x - c * (selectedCone.t - pastTime);
        const leftPastScreen = spacetimeToScreen(leftPastX, pastTime);
        _ctx.lineTo(leftPastScreen.screenX, leftPastScreen.screenY);
        
        _ctx.moveTo(leftStartPast.screenX, leftStartPast.screenY);
        const rightPastX = selectedCone.x + c * (selectedCone.t - pastTime);
        const rightPastScreen = spacetimeToScreen(rightPastX, pastTime);
        _ctx.lineTo(rightPastScreen.screenX, rightPastScreen.screenY);
        
        _ctx.stroke();
    }
    
    _ctx.setLineDash([]);
}

/**
 * Dessine les axes et labels
 */
export function drawAxesAndLabels() {
    if (!_ctx || !_canvas) return;
    
    const { centerX, centerY } = getCanvasTransform();
    
    // Dessiner axes
    _ctx.strokeStyle = UI_COLORS.AXES;
    _ctx.lineWidth = 1;
    
    // Axe du temps
    _ctx.beginPath();
    _ctx.moveTo(centerX, 0);
    _ctx.lineTo(centerX, _canvas.height);
    _ctx.stroke();
    
    // Axe de l'espace
    _ctx.beginPath();
    _ctx.moveTo(0, centerY);
    _ctx.lineTo(_canvas.width, centerY);
    _ctx.stroke();
    
    // Labels
    _ctx.fillStyle = UI_COLORS.WHITE;
    _ctx.font = '14px Arial';
    _ctx.fillText('Temps', centerX + 10, 30);
    _ctx.fillText('Espace', _canvas.width - 380, centerY - 10);
}

/**
 * ========== FONCTIONS INFO BOXES ==========
 */

/**
 * Calcule les placements optimaux des boîtes d'info
 * @param {Array} infoBoxes - Boîtes d'information
 * @returns {Array} Placements optimisés
 */
export function calculateBoxPlacements(infoBoxes) {
    if (!_canvas) return [];
    
    const placements = [];
    const margin = 10;
    
    for (let i = 0; i < infoBoxes.length; i++) {
        const box = infoBoxes[i];
        let bestX = box.idealX;
        let bestY = box.idealY;
        
        // S'assurer que la boîte reste dans les limites du canvas
        bestX = Math.max(margin, Math.min(_canvas.width - box.width - margin, bestX));
        bestY = Math.max(margin, Math.min(_canvas.height - box.height - margin, bestY));
        
        // Évitement de collision simple avec boîtes précédentes
        let hasCollision = true;
        let attempts = 0;
        
        while (hasCollision && attempts < 10) {
            hasCollision = false;
            
            for (const existingPlacement of placements) {
                if (bestX < existingPlacement.x + existingPlacement.width + margin &&
                    bestX + box.width + margin > existingPlacement.x &&
                    bestY < existingPlacement.y + existingPlacement.height + margin &&
                    bestY + box.height + margin > existingPlacement.y) {
                    
                    hasCollision = true;
                    bestY += box.height + margin;
                    break;
                }
            }
            
            attempts++;
        }
        
        placements.push({
            x: bestX,
            y: bestY,
            width: box.width,
            height: box.height,
            originalBox: box
        });
    }
    
    return placements;
}

/**
 * Dessine une ligne de connexion boîte
 * @param {number} originX - X origine
 * @param {number} originY - Y origine
 * @param {number} boxCenterX - X centre boîte
 * @param {number} boxCenterY - Y centre boîte
 */
export function drawBoxConnection(originX, originY, boxCenterX, boxCenterY) {
    if (!_ctx) return;
    
    _ctx.strokeStyle = UI_COLORS.CONNECTION_LINE;
    _ctx.lineWidth = 1;
    _ctx.setLineDash([2, 2]);
    
    _ctx.beginPath();
    _ctx.moveTo(originX, originY);
    _ctx.lineTo(boxCenterX, boxCenterY);
    _ctx.stroke();
    
    _ctx.setLineDash([]);
}

/**
 * Dessine une boîte d'info origine
 * @param {number} boxX - Position X
 * @param {number} boxY - Position Y
 * @param {number} boxWidth - Largeur
 * @param {number} boxHeight - Hauteur
 * @param {number} selectedReferenceFrame - Référentiel sélectionné
 */
export function drawOriginInfoBox(boxX, boxY, boxWidth, boxHeight, selectedReferenceFrame) {
    if (!_ctx) return;
    
    _ctx.fillStyle = UI_COLORS.BOX_BACKGROUND;
    _ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    _ctx.strokeStyle = UI_COLORS.BOX_BORDER_ORIGIN;
    _ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    
    if (selectedReferenceFrame === 0) {
        _ctx.strokeStyle = UI_COLORS.WHITE;
        _ctx.lineWidth = 3;
        _ctx.strokeRect(boxX - 2, boxY - 2, boxWidth + 4, boxHeight + 4);
    }
    
    _ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    _ctx.font = 'bold 11px Arial';
    _ctx.fillText('Origine', boxX + 5, boxY + 12);
    
    _ctx.font = '10px Arial';
    _ctx.fillText('v = 0% c', boxX + 5, boxY + 25);
    _ctx.fillText('a = 0 c²/t', boxX + 5, boxY + 37);
    _ctx.fillText('t = 0 t', boxX + 5, boxY + 49);
    _ctx.fillText('Référentiel inertiel', boxX + 5, boxY + 61);
}

/**
 * Dessine une boîte d'info référentiel
 * @param {number} boxX - Position X
 * @param {number} boxY - Position Y
 * @param {number} boxWidth - Largeur
 * @param {number} boxHeight - Hauteur
 * @param {number} coneIndex - Index du cône
 * @param {Array} coneOrigins - Origines des cônes
 * @param {number} selectedReferenceFrame - Référentiel sélectionné
 */
export function drawReferenceInfoBox(boxX, boxY, boxWidth, boxHeight, coneIndex, coneOrigins, selectedReferenceFrame) {
    if (!_ctx) return;
    
    const physics = calculateCumulativePhysics(coneIndex, coneOrigins);
    const cone = coneOrigins[coneIndex];
    
    const finalVelocityPercent = (Math.abs(physics.segmentVelocity) / 1 * 100).toFixed(1);
    const cumulativeVelocityPercent = (Math.abs(physics.cumulativeVelocity) / 1 * 100).toFixed(1);
    
    // Calcul de l'énergie cinétique pour le cartouche
    const energyKinetic = (Math.cosh(Math.atanh(Math.abs(physics.cumulativeVelocity))) - 1) * 25000; // GWh/tonne
    
    _ctx.fillStyle = UI_COLORS.BOX_BACKGROUND;
    _ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    
    _ctx.strokeStyle = UI_COLORS.BOX_BORDER_REFERENCE;
    _ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    
    if (selectedReferenceFrame === coneIndex) {
        _ctx.strokeStyle = UI_COLORS.WHITE;
        _ctx.lineWidth = 3;
        _ctx.strokeRect(boxX - 2, boxY - 2, boxWidth + 4, boxHeight + 4);
    }
    
    _ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    _ctx.font = 'bold 11px Arial';
    _ctx.fillText(`Réf ${coneIndex}`, boxX + 5, boxY + 12);
    
    _ctx.font = '10px Arial';
    _ctx.fillText(`v = ${cumulativeVelocityPercent}% c`, boxX + 5, boxY + 25);
    _ctx.fillText(`t = ${cone.t.toFixed(1)}`, boxX + 5, boxY + 37);
    _ctx.fillText(`τ = ${physics.cumulativeProperTime.toFixed(1)}`, boxX + 5, boxY + 49);
    _ctx.fillText(`Δφ = ${(Math.atanh(Math.abs(physics.cumulativeVelocity))).toFixed(2)}`, boxX + 5, boxY + 61);
    _ctx.fillText(`E = ${energyKinetic.toFixed(1)} GWh/t`, boxX + 5, boxY + 73);
}

/**
 * ========== FONCTIONS HOVER ET TOOLTIP ==========
 */

/**
 * Vérifie le hover de l'isochrone
 * @param {number} mouseX - Position X souris
 * @param {number} mouseY - Position Y souris
 * @param {number} selectedReferenceFrame - Référentiel sélectionné
 * @param {Array} coneOrigins - Origines des cônes
 */
export function checkIsochroneHover(mouseX, mouseY, selectedReferenceFrame, coneOrigins) {
    if (currentIsochronePoints.length < 2) {
        isochroneHoverInfo = null;
        return;
    }
    
    const coneIndex = getConeAtPosition(mouseX, mouseY, coneOrigins);
    if (coneIndex !== -1) {
        isochroneHoverInfo = null;
        return;
    }
    
    const cartoucheIndex = getCartoucheAtPosition(mouseX, mouseY, currentPlacements);
    if (cartoucheIndex !== -1) {
        isochroneHoverInfo = null;
        return;
    }
    
    const threshold = 15;
    let closestPoint = null;
    let minDistance = Infinity;
    
    for (let i = 0; i < currentIsochronePoints.length - 1; i++) {
        const p1 = spacetimeToScreen(currentIsochronePoints[i].x, currentIsochronePoints[i].t);
        const p2 = spacetimeToScreen(currentIsochronePoints[i + 1].x, currentIsochronePoints[i + 1].t);
        
        const distance = distanceToLineSegment(mouseX, mouseY, p1.screenX, p1.screenY, p2.screenX, p2.screenY);
        
        if (distance < threshold && distance < minDistance) {
            minDistance = distance;
            const t = Math.max(0, Math.min(1, 
                ((mouseX - p1.screenX) * (p2.screenX - p1.screenX) + (mouseY - p1.screenY) * (p2.screenY - p1.screenY)) /
                ((p2.screenX - p1.screenX) ** 2 + (p2.screenY - p1.screenY) ** 2)
            ));
            
            const interpolatedPoint = {
                x: currentIsochronePoints[i].x + t * (currentIsochronePoints[i + 1].x - currentIsochronePoints[i].x),
                t: currentIsochronePoints[i].t + t * (currentIsochronePoints[i + 1].t - currentIsochronePoints[i].t)
            };
            
            closestPoint = interpolatedPoint;
        }
    }
    
    if (closestPoint && minDistance < threshold) {
        const origin = coneOrigins[0];
        const selectedCone = coneOrigins[selectedReferenceFrame];
        const selectedPhysics = calculateCumulativePhysics(selectedReferenceFrame, coneOrigins);
        
        const deltaX = closestPoint.x - origin.x;
        const deltaT = closestPoint.t - origin.t;
        const velocity = deltaT > 0 ? Math.abs(deltaX / deltaT) : 0;
        const velocityPercent = Math.min(99.9, velocity * 100);
        
        const properTime = selectedPhysics.cumulativeProperTime;
        const coordinateTime = deltaT;
        const properTimePercent = coordinateTime > 0 ? (properTime / coordinateTime * 100) : 100;
        
        isochroneHoverInfo = {
            x: mouseX,
            y: mouseY,
            velocityPercent: velocityPercent,
            properTimePercent: properTimePercent,
            properTime: properTime,
            coordinateTime: coordinateTime,
            spatialPosition: deltaX
        };
    } else {
        isochroneHoverInfo = null;
    }
}

/**
 * Dessine le tooltip de l'isochrone
 */
export function drawIsochroneTooltip() {
    if (!isochroneHoverInfo || !_ctx || !_canvas) return;
    
    const tooltip = isochroneHoverInfo;
    const tooltipWidth = 200;
    const tooltipHeight = 80;
    
    let tooltipX = tooltip.x + 15;
    let tooltipY = tooltip.y - tooltipHeight - 15;
    
    if (tooltipX + tooltipWidth > _canvas.width) {
        tooltipX = tooltip.x - tooltipWidth - 15;
    }
    if (tooltipY < 0) {
        tooltipY = tooltip.y + 15;
    }
    
    _ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    _ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
    _ctx.strokeStyle = UI_COLORS.ISOCHRONE;
    _ctx.strokeRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
    
    _ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    _ctx.font = 'bold 11px Arial';
    _ctx.fillText('Isochrone', tooltipX + 5, tooltipY + 15);
    
    _ctx.font = '10px Arial';
    _ctx.fillText(`Vitesse: ${tooltip.velocityPercent.toFixed(1)}% c`, tooltipX + 5, tooltipY + 30);
    _ctx.fillText(`Temps propre: ${tooltip.properTimePercent.toFixed(1)}%`, tooltipX + 5, tooltipY + 45);
    _ctx.fillText(`Position: x=${tooltip.spatialPosition.toFixed(1)}`, tooltipX + 5, tooltipY + 60);
}

/**
 * ========== FONCTION DE DESSIN PRINCIPALE ==========
 */

/**
 * Dessine les points d'origine et leurs indicateurs
 * @param {Array} coneOrigins - Origines des cônes
 * @param {number} selectedReferenceFrame - Référentiel sélectionné
 */
export function drawOriginPoints(coneOrigins, selectedReferenceFrame) {
    const ctx = getCtx();
    if (!ctx) return;
    
    for (let i = 0; i < coneOrigins.length; i++) {
        const origin = coneOrigins[i];
        const screen = spacetimeToScreen(origin.x, origin.t);
        
        // Dessiner le point d'origine
        ctx.fillStyle = i === 0 ? UI_COLORS.ORIGIN : UI_COLORS.REFERENCE;
        ctx.shadowBlur = 10;
        ctx.shadowColor = i === 0 ? UI_COLORS.ORIGIN : UI_COLORS.REFERENCE;
        ctx.beginPath();
        ctx.arc(screen.screenX, screen.screenY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Dessiner indicateur de sélection
        if (i === selectedReferenceFrame) {
            ctx.strokeStyle = UI_COLORS.WHITE;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(screen.screenX, screen.screenY, 8, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

/**
 * Exporte les variables globales pour accès externe
 */
export function getCurrentIsochronePoints() {
    return currentIsochronePoints;
}

export function getCurrentPlacements() {
    return currentPlacements;
}

export function setCurrentPlacements(placements) {
    currentPlacements = placements;
} 