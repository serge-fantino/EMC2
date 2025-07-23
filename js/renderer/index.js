/**
 * MODULE RENDERER - Point d'entrée principal
 * Refactoring Phase 3 - Module de rendu unifié
 */

// Imports des sous-modules
import { 
    getCanvas, 
    getCtx, 
    initCanvas, 
    resizeCanvas, 
    screenToSpacetime, 
    spacetimeToScreen, 
    getCanvasTransform, 
    clearCanvas, 
    isInCanvasBounds,
    resolutionSettings 
} from './canvas.js';

import { 
    getColorForVelocity, 
    updateGradientBar, 
    getConeColorModulation, 
    blendColors, 
    colorToCSS, 
    createColor, 
    UI_COLORS 
} from './colors.js';

import { 
    initDrawingModule,
    drawLightConeHeatmap,
    drawAccelerationPath,
    drawSelectedIsochrone,
    drawLightConeEnvelopes,
    drawAxesAndLabels,
    calculateBoxPlacements,
    drawBoxConnection,
    drawOriginInfoBox,
    drawReferenceInfoBox,
    checkIsochroneHover,
    drawIsochroneTooltip,
    drawOriginPoints,
    getConeAtPosition,
    getCartoucheAtPosition,
    applyCartoucheOffset,
    getCurrentIsochronePoints,
    getCurrentPlacements,
    setCurrentPlacements
} from './drawing.js';

/**
 * ========== EXPORTS CANVAS ==========
 */
export { 
    getCanvas, 
    getCtx, 
    initCanvas, 
    resizeCanvas, 
    screenToSpacetime, 
    spacetimeToScreen, 
    getCanvasTransform, 
    clearCanvas, 
    isInCanvasBounds,
    resolutionSettings 
};

/**
 * ========== EXPORTS COLORS ==========
 */
export { 
    getColorForVelocity, 
    updateGradientBar, 
    getConeColorModulation, 
    blendColors, 
    colorToCSS, 
    createColor, 
    UI_COLORS 
};

/**
 * ========== EXPORTS DRAWING ==========
 */
export { 
    drawLightConeHeatmap,
    drawAccelerationPath,
    drawSelectedIsochrone,
    drawLightConeEnvelopes,
    drawAxesAndLabels,
    calculateBoxPlacements,
    drawBoxConnection,
    drawOriginInfoBox,
    drawReferenceInfoBox,
    checkIsochroneHover,
    drawIsochroneTooltip,
    drawOriginPoints,
    getConeAtPosition,
    getCartoucheAtPosition,
    applyCartoucheOffset,
    getCurrentIsochronePoints,
    getCurrentPlacements,
    setCurrentPlacements
};

/**
 * ========== FONCTION DE RENDU PRINCIPALE ==========
 */

/**
 * Fonction de rendu principale - dessine tout le diagramme
 * @param {Object} renderData - Données de rendu
 * @param {Object} renderData.config - Configuration
 * @param {Array} renderData.coneOrigins - Origines des cônes
 * @param {number} renderData.selectedReferenceFrame - Référentiel sélectionné
 * @param {Object} renderData.cartoucheOffsets - Décalages cartouches
 */
export function draw(renderData) {
    const canvas = getCanvas();
    const ctx = getCtx();
    if (!ctx || !canvas) {
        console.error('Canvas renderer not initialized');
        return;
    }
    
    const { config, coneOrigins, selectedReferenceFrame, cartoucheOffsets } = renderData;
    
    // Effacer le canvas
    clearCanvas();
    
    // 1. Dessiner la heatmap des cônes de lumière
    drawLightConeHeatmap(config, coneOrigins, selectedReferenceFrame, resolutionSettings);
    
    // 2. Dessiner les chemins d'accélération
    for (let i = 1; i < coneOrigins.length; i++) {
        const cone = coneOrigins[i];
        if (cone.sourceIndex !== -1) {
            drawAccelerationPath(
                coneOrigins[cone.sourceIndex], 
                cone, 
                i, 
                coneOrigins, 
                selectedReferenceFrame
            );
        }
    }
    
    // 3. Dessiner l'isochrone pour le référentiel sélectionné
    drawSelectedIsochrone(selectedReferenceFrame, coneOrigins);
    
    // 4. Dessiner les enveloppes de cônes de lumière
    drawLightConeEnvelopes(selectedReferenceFrame, coneOrigins, config);
    
    // 5. Dessiner les axes et labels
    drawAxesAndLabels();
    
    // 6. Collecter toutes les boîtes d'info
    const infoBoxes = [];
    
    for (let i = 0; i < coneOrigins.length; i++) {
        const origin = coneOrigins[i];
        const screen = spacetimeToScreen(origin.x, origin.t);
        
        if (i === 0) {
            infoBoxes.push({
                idealX: screen.screenX + 20,
                idealY: screen.screenY - 55,
                width: 120,
                height: 65,
                index: i,
                isOrigin: true,
                coneIndex: i,
                originX: screen.screenX,
                originY: screen.screenY
            });
        } else {
            infoBoxes.push({
                idealX: screen.screenX + 20,
                idealY: screen.screenY - 80,
                width: 150,
                height: 105,
                index: i,
                isOrigin: false,
                coneIndex: i,
                originX: screen.screenX,
                originY: screen.screenY
            });
        }
    }
    
    // 7. Calculer placements optimaux
    const placements = calculateBoxPlacements(infoBoxes);
    
    // 8. Appliquer décalages manuels
    const finalPlacements = placements.map(placement => {
        const coneIndex = placement.originalBox.coneIndex;
        return applyCartoucheOffset(placement, coneIndex, cartoucheOffsets);
    });
    
    // 9. Stocker placements globalement
    setCurrentPlacements(finalPlacements);
    
    // 10. Dessiner tous les points d'origine et leurs boîtes d'info
    for (const placement of finalPlacements) {
        const i = placement.originalBox.coneIndex;
        const origin = coneOrigins[i];
        const screen = spacetimeToScreen(origin.x, origin.t);
        
        // Dessiner ligne de connexion si boîte déplacée
        const wasMoved = placement.x !== placement.originalBox.idealX || 
                       placement.y !== placement.originalBox.idealY;
        if (wasMoved) {
            drawBoxConnection(
                screen.screenX, screen.screenY,
                placement.x + placement.width / 2, placement.y + placement.height / 2
            );
        }
        
        // Dessiner la boîte d'info
        if (i === 0) {
            drawOriginInfoBox(
                placement.x, placement.y, 
                placement.width, placement.height, 
                selectedReferenceFrame
            );
        } else {
            drawReferenceInfoBox(
                placement.x, placement.y, 
                placement.width, placement.height, 
                i, coneOrigins, selectedReferenceFrame
            );
        }
    }
    
    // 11. Dessiner les points d'origine par-dessus
    drawOriginPoints(coneOrigins, selectedReferenceFrame);
    
    // 12. Dessiner tooltip isochrone
    drawIsochroneTooltip();
}

/**
 * Boucle d'animation principale
 * @param {Function} getRenderData - Fonction qui retourne les données de rendu
 */
export function animate(getRenderData) {
    function animationLoop() {
        try {
            const renderData = getRenderData();
            draw(renderData);
        } catch (error) {
            console.error('Animation error:', error);
        }
        requestAnimationFrame(animationLoop);
    }
    
    console.log('Starting renderer animation loop...');
    animationLoop();
}

/**
 * Initialise le module renderer complet
 * @param {HTMLCanvasElement} canvasElement - Élément canvas
 */
export function initRenderer(canvasElement) {
    const { canvas, ctx } = initCanvas(canvasElement);
    initDrawingModule(canvas, ctx);
    console.log('🎨 Renderer module initialized');
} 