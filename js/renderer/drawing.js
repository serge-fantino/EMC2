/**
 * FONCTIONS DE DESSIN - Module Renderer
 * Refactoring Phase 3 - Dessin spécialisé et rendu principal
 */

import { canvas, ctx, spacetimeToScreen, getCanvasTransform, isInCanvasBounds } from './canvas.js';
import { getColorForVelocity, getConeColorModulation, blendColors, UI_COLORS } from './colors.js';
import { 
    calculateVelocityRatio, 
    calculateCumulativePhysics, 
    calculateIsochronePoints, 
    limitVelocity 
} from '../physics/index.js';

// Variables globales pour hover et placement
let currentIsochronePoints = [];
let isochroneHoverInfo = null;
let currentPlacements = [];

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
    if (!ctx || !canvas) return;
    
    // Créer ImageData pour la heatmap
    const imageData = ctx.createImageData(canvas.width, canvas.height);
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
        for (let px = 0; px < canvas.width; px += pixelSize) {
            for (let py = 0; py < canvas.height; py += pixelSize) {
                // Convertir coordonnées pixel vers espace-temps
                const spacetime = spacetimeToScreen(px, py);
                
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
                                    const index = ((py + dy) * canvas.width + (px + dx)) * 4;
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
    
    ctx.putImageData(imageData, 0, 0);
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
    if (!ctx) return;
    
    const fromScreen = spacetimeToScreen(fromCone.x, fromCone.t);
    const toScreen = spacetimeToScreen(toCone.x, toCone.t);
    
    // Calculer trajectoire pour accélération constante depuis repos
    const X = toCone.x - fromCone.x;  // déplacement spatial
    const T = toCone.t - fromCone.t;  // déplacement temporel
    
    // S'assurer qu'on va vers le futur
    if (T <= 0) return;
    
    const c = 1; // c = 1 dans nos unités (cône 45°)
    
    // Obtenir physique pour ce cône et le cône source
    const physics = calculateCumulativePhysics(newConeIndex, coneOrigins);
    
    // Obtenir vitesse initiale du cône de départ (fromCone)
    let fromConeIndex = -1;
    for (let i = 0; i < coneOrigins.length; i++) {
        if (coneOrigins[i] === fromCone) {
            fromConeIndex = i;
            break;
        }
    }
    const fromPhysics = calculateCumulativePhysics(fromConeIndex, coneOrigins);
    
    let properAccel = physics.segmentAcceleration;
    let isValidTrajectory = !(Math.abs(X) >= T * c * (1 - 0.02)); // Même marge de sécurité
    
    if (!isValidTrajectory) return; // Ne pas dessiner trajectoires invalides
    
    // Obtenir vitesse initiale du cône de départ
    const v0 = limitVelocity(fromPhysics.cumulativeVelocity); // Appliquer limite de vitesse
    
    // Vérifier si ce chemin fait partie de la trajectoire du référentiel sélectionné
    const isPartOfSelectedTrajectory_result = isPathInSelectedTrajectory(newConeIndex, selectedReferenceFrame, coneOrigins);
    
    // Définir style de ligne selon sélection
    if (isPartOfSelectedTrajectory_result) {
        ctx.strokeStyle = UI_COLORS.PATH_SELECTED; // Blanc brillant pour sélectionné
        ctx.lineWidth = 4; // Ligne épaisse
        ctx.setLineDash([8, 4]); // Tirets plus longs
    } else {
        ctx.strokeStyle = UI_COLORS.PATH_NORMAL;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
    }
    
    ctx.beginPath();
    ctx.moveTo(fromScreen.screenX, fromScreen.screenY);
    
    // Dessiner la trajectoire d'accélération relativiste avec vitesse initiale
    const steps = 50;
    for (let i = 1; i <= steps; i++) {
        const t = (i / steps) * T; // coordonnée de temps
        
        let x;
        
        if (Math.abs(v0) < 0.001) {
            // Partir du repos (ou presque repos) - utiliser formule simple
            const at_over_c = properAccel * t / c;
            const x_rel = (c * c / properAccel) * (Math.sqrt(1 + at_over_c * at_over_c) - 1);
            x = fromCone.x + Math.sign(X) * x_rel;
        } else {
            // Partir avec vitesse initiale v0
            const t_norm = t / T; // Temps normalisé (0 à 1)
            
            // Composant inertiel (ce qui arriverait avec vitesse constante)
            const x_inertial = fromCone.x + v0 * t;
            
            // Correction d'accélération pour atteindre la cible
            const x_target_correction = (toCone.x - fromCone.x) - v0 * T;
            
            // Interpolation non-linéaire pour trajectoire relativiste
            const accel_factor = t_norm * t_norm * (3 - 2 * t_norm); // Interpolation lisse
            
            x = x_inertial + x_target_correction * accel_factor;
        }
        
        const screen = spacetimeToScreen(x, fromCone.t + t);
        ctx.lineTo(screen.screenX, screen.screenY);
    }
    
    ctx.stroke();
    ctx.setLineDash([]);
}

/**
 * Dessine l'isochrone pour le référentiel sélectionné
 * @param {number} selectedReferenceFrame - Référentiel sélectionné
 * @param {Array} coneOrigins - Origines des cônes
 */
export function drawSelectedIsochrone(selectedReferenceFrame, coneOrigins) {
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
    const isochronePoints = calculateIsochronePoints(tau, origin, selectedCone, canvas.width);
    
    currentIsochronePoints = isochronePoints;
    
    if (isochronePoints.length < 2) return;
    
    // Dessiner la courbe isochrone
    ctx.strokeStyle = UI_COLORS.ISOCHRONE;
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    
    ctx.beginPath();
    
    let firstScreen = spacetimeToScreen(isochronePoints[0].x, isochronePoints[0].t);
    ctx.moveTo(firstScreen.screenX, firstScreen.screenY);
    
    for (let i = 1; i < isochronePoints.length; i++) {
        const screen = spacetimeToScreen(isochronePoints[i].x, isochronePoints[i].t);
        
        if (isInCanvasBounds(screen.screenX, screen.screenY)) {
            ctx.lineTo(screen.screenX, screen.screenY);
        }
    }
    
    ctx.stroke();
    ctx.setLineDash([]);
}

/**
 * Dessine les enveloppes de cônes de lumière
 * @param {number} selectedReferenceFrame - Référentiel sélectionné
 * @param {Array} coneOrigins - Origines des cônes
 * @param {Object} config - Configuration
 */
export function drawLightConeEnvelopes(selectedReferenceFrame, coneOrigins, config) {
    if (!ctx || !canvas) return;
    
    if (selectedReferenceFrame === 0) return;
    
    const selectedCone = coneOrigins[selectedReferenceFrame];
    const c = 1;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    
    const { centerX, centerY, scale } = getCanvasTransform();
    const maxExtent = Math.max(canvas.width, canvas.height);
    
    // Frontière gauche du cône futur
    const leftStartFuture = spacetimeToScreen(selectedCone.x, selectedCone.t);
    ctx.moveTo(leftStartFuture.screenX, leftStartFuture.screenY);
    
    const futureTime = selectedCone.t + maxExtent / scale;
    const leftFutureX = selectedCone.x - c * (futureTime - selectedCone.t);
    const leftFutureScreen = spacetimeToScreen(leftFutureX, futureTime);
    ctx.lineTo(leftFutureScreen.screenX, leftFutureScreen.screenY);
    
    // Frontière droite du cône futur
    ctx.moveTo(leftStartFuture.screenX, leftStartFuture.screenY);
    const rightFutureX = selectedCone.x + c * (futureTime - selectedCone.t);
    const rightFutureScreen = spacetimeToScreen(rightFutureX, futureTime);
    ctx.lineTo(rightFutureScreen.screenX, rightFutureScreen.screenY);
    
    ctx.stroke();
    
    // Cône de lumière passé (optionnel)
    if (config.showPastCone) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        
        ctx.beginPath();
        
        const leftStartPast = spacetimeToScreen(selectedCone.x, selectedCone.t);
        ctx.moveTo(leftStartPast.screenX, leftStartPast.screenY);
        
        const pastTime = selectedCone.t - maxExtent / 2;
        const leftPastX = selectedCone.x - c * (selectedCone.t - pastTime);
        const leftPastScreen = spacetimeToScreen(leftPastX, pastTime);
        ctx.lineTo(leftPastScreen.screenX, leftPastScreen.screenY);
        
        ctx.moveTo(leftStartPast.screenX, leftStartPast.screenY);
        const rightPastX = selectedCone.x + c * (selectedCone.t - pastTime);
        const rightPastScreen = spacetimeToScreen(rightPastX, pastTime);
        ctx.lineTo(rightPastScreen.screenX, rightPastScreen.screenY);
        
        ctx.stroke();
    }
    
    ctx.setLineDash([]);
}

/**
 * Dessine les axes et labels
 */
export function drawAxesAndLabels() {
    if (!ctx || !canvas) return;
    
    const { centerX, centerY } = getCanvasTransform();
    
    // Dessiner axes
    ctx.strokeStyle = UI_COLORS.AXES;
    ctx.lineWidth = 1;
    
    // Axe du temps
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, canvas.height);
    ctx.stroke();
    
    // Axe de l'espace
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.stroke();
    
    // Labels
    ctx.fillStyle = UI_COLORS.WHITE;
    ctx.font = '14px Arial';
    ctx.fillText('Temps', centerX + 10, 30);
    ctx.fillText('Espace', canvas.width - 380, centerY - 10);
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
    if (!canvas) return [];
    
    const placements = [];
    const margin = 10;
    
    for (let i = 0; i < infoBoxes.length; i++) {
        const box = infoBoxes[i];
        let bestX = box.idealX;
        let bestY = box.idealY;
        
        // S'assurer que la boîte reste dans les limites du canvas
        bestX = Math.max(margin, Math.min(canvas.width - box.width - margin, bestX));
        bestY = Math.max(margin, Math.min(canvas.height - box.height - margin, bestY));
        
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
    if (!ctx) return;
    
    ctx.strokeStyle = UI_COLORS.CONNECTION_LINE;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(boxCenterX, boxCenterY);
    ctx.stroke();
    
    ctx.setLineDash([]);
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
    if (!ctx) return;
    
    ctx.fillStyle = UI_COLORS.BOX_BACKGROUND;
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    ctx.strokeStyle = UI_COLORS.BOX_BORDER_ORIGIN;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    
    if (selectedReferenceFrame === 0) {
        ctx.strokeStyle = UI_COLORS.WHITE;
        ctx.lineWidth = 3;
        ctx.strokeRect(boxX - 2, boxY - 2, boxWidth + 4, boxHeight + 4);
    }
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = 'bold 11px Arial';
    ctx.fillText('Origine', boxX + 5, boxY + 12);
    
    ctx.font = '10px Arial';
    ctx.fillText('v = 0% c', boxX + 5, boxY + 25);
    ctx.fillText('a = 0 c²/t', boxX + 5, boxY + 37);
    ctx.fillText('t = 0 t', boxX + 5, boxY + 49);
    ctx.fillText('Référentiel inertiel', boxX + 5, boxY + 61);
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
    if (!ctx) return;
    
    const physics = calculateCumulativePhysics(coneIndex, coneOrigins);
    const cone = coneOrigins[coneIndex];
    
    const finalVelocityPercent = (Math.abs(physics.segmentVelocity) / 1 * 100).toFixed(1);
    const cumulativeVelocityPercent = (Math.abs(physics.cumulativeVelocity) / 1 * 100).toFixed(1);
    
    ctx.fillStyle = UI_COLORS.BOX_BACKGROUND;
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    
    ctx.strokeStyle = UI_COLORS.BOX_BORDER_REFERENCE;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    
    if (selectedReferenceFrame === coneIndex) {
        ctx.strokeStyle = UI_COLORS.WHITE;
        ctx.lineWidth = 3;
        ctx.strokeRect(boxX - 2, boxY - 2, boxWidth + 4, boxHeight + 4);
    }
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = 'bold 11px Arial';
    ctx.fillText(`Réf ${coneIndex}`, boxX + 5, boxY + 12);
    
    ctx.font = '10px Arial';
    ctx.fillText(`v = ${cumulativeVelocityPercent}% c`, boxX + 5, boxY + 25);
    ctx.fillText(`a = ${physics.segmentAcceleration.toFixed(3)} c²/t`, boxX + 5, boxY + 37);
    ctx.fillText(`t = ${physics.cumulativeProperTime.toFixed(2)} t`, boxX + 5, boxY + 49);
    ctx.fillText(`Δt = ${physics.segmentCoordinateTime.toFixed(2)} t`, boxX + 5, boxY + 61);
    ctx.fillText(`X = ${cone.x.toFixed(1)}, T = ${cone.t.toFixed(1)}`, boxX + 5, boxY + 73);
    ctx.fillText(`v_seg = ${finalVelocityPercent}% c`, boxX + 5, boxY + 85);
    ctx.fillText(`Source: Réf ${cone.sourceIndex}`, boxX + 5, boxY + 97);
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
    if (!isochroneHoverInfo || !ctx || !canvas) return;
    
    const tooltip = isochroneHoverInfo;
    const tooltipWidth = 200;
    const tooltipHeight = 80;
    
    let tooltipX = tooltip.x + 15;
    let tooltipY = tooltip.y - tooltipHeight - 15;
    
    if (tooltipX + tooltipWidth > canvas.width) {
        tooltipX = tooltip.x - tooltipWidth - 15;
    }
    if (tooltipY < 0) {
        tooltipY = tooltip.y + 15;
    }
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
    ctx.strokeStyle = UI_COLORS.ISOCHRONE;
    ctx.strokeRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = 'bold 11px Arial';
    ctx.fillText('Isochrone', tooltipX + 5, tooltipY + 15);
    
    ctx.font = '10px Arial';
    ctx.fillText(`Vitesse: ${tooltip.velocityPercent.toFixed(1)}% c`, tooltipX + 5, tooltipY + 30);
    ctx.fillText(`Temps propre: ${tooltip.properTimePercent.toFixed(1)}%`, tooltipX + 5, tooltipY + 45);
    ctx.fillText(`Position: x=${tooltip.spatialPosition.toFixed(1)}`, tooltipX + 5, tooltipY + 60);
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