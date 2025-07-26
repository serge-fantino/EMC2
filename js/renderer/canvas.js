/**
 * TRANSFORMATIONS CANVAS - Module Renderer
 * Refactoring Phase 3 - Transformations coordonnées et gestion canvas
 */

/**
 * Instance du canvas HTML
 * @type {HTMLCanvasElement}
 */
export let canvas = null;

/**
 * Contexte 2D du canvas
 * @type {CanvasRenderingContext2D}
 */
export let ctx = null;

/**
 * Getter pour le canvas (toujours à jour)
 */
export function getCanvas() {
    return canvas;
}

/**
 * Getter pour le contexte (toujours à jour)
 */
export function getCtx() {
    return ctx;
}

/**
 * Configuration des paramètres de résolution
 */
export const resolutionSettings = {
    1: { name: 'Basse', pixelSize: 8 },
    2: { name: 'Moyenne', pixelSize: 4 },
    3: { name: 'Haute', pixelSize: 2 }
};

/**
 * Initialise les références au canvas et contexte
 * @param {HTMLCanvasElement} canvasElement - Élément canvas HTML
 */
export function initCanvas(canvasElement) {
    // Mettre à jour les variables exportées
    canvas = canvasElement;
    ctx = canvas.getContext('2d');
    // console.log('Canvas renderer initialized');
    return { canvas: canvasElement, ctx: canvasElement.getContext('2d') };
}

/**
 * Redimensionne le canvas à la taille de son container
 */
export function resizeCanvas() {
    const canvasRef = getCanvas();
    if (!canvasRef) {
        console.warn('❌ Canvas not found in resizeCanvas');
        return;
    }
    
    // Obtenir les dimensions du container canvas, pas de la fenêtre
    const container = canvasRef.parentElement;
    if (!container) {
        console.warn('❌ Canvas container not found');
        return;
    }
    
    // FORCER UN REFLOW pour s'assurer que les dimensions CSS sont à jour
    // Cette ligne force le navigateur à recalculer le layout avant de mesurer
    container.offsetHeight; // Lecture forcée qui déclenche un reflow
    
    const containerRect = container.getBoundingClientRect();
    const newWidth = Math.floor(containerRect.width);
    const newHeight = Math.floor(containerRect.height);
    
    // console.log(`🔄 Resizing canvas: ${canvasRef.width}x${canvasRef.height} → ${newWidth}x${newHeight}`);
    // console.log(`🔍 Container computed style:`, window.getComputedStyle(container).width, 'x', window.getComputedStyle(container).height);
    
    // Vérifier que les nouvelles dimensions sont valides
    if (newWidth > 0 && newHeight > 0) {
        const oldWidth = canvasRef.width;
        const oldHeight = canvasRef.height;
        
        canvasRef.width = newWidth;
        canvasRef.height = newHeight;
        
        // Forcer un redraw en déclenchant un événement personnalisé
        canvasRef.dispatchEvent(new Event('canvasResized'));
        
        // console.log(`✅ Canvas successfully resized to ${newWidth}x${newHeight}`);
        
        // Si les dimensions ont vraiment changé, forcer un recalcul des transformations
        if (oldWidth !== newWidth || oldHeight !== newHeight) {
            // console.log('🔄 Dimensions changed, forcing coordinate recalculation...');
            
            // Invalider le cache des transformations en forçant un recalcul
            // La prochaine frame d'animation utilisera les nouvelles dimensions
            setTimeout(() => {
                // console.log('🎨 Forcing immediate redraw with new dimensions...');
                // Cette technique force le navigateur à redessiner immédiatement
                canvasRef.style.display = 'none';
                canvasRef.offsetHeight; // Force reflow
                canvasRef.style.display = 'block';
            }, 10);
        }
    } else {
        console.warn(`❌ Invalid canvas dimensions: ${newWidth}x${newHeight}`);
    }
}

/**
 * Calcule l'échelle adaptative pour préserver l'angle de 45° du cône de lumière
 * @returns {number} Échelle optimale
 */
function calculateAdaptiveScale() {
    const canvasRef = getCanvas();
    if (!canvasRef) return 2;
    
    // Utiliser la plus petite dimension pour préserver l'aspect carré du diagramme de Minkowski
    // Cela garantit que les cônes de lumière restent à 45°
    const minDimension = Math.min(canvasRef.width, canvasRef.height - 100); // -100 pour les marges
    
    // Échelle basée sur la taille pour avoir un zoom cohérent
    // Plus le canvas est grand, plus on peut voir de détails (échelle plus petite)
    const baseScale = Math.max(1, minDimension / 400); // 400px = référence pour scale = 1
    
    return baseScale;
}

/**
 * Convertit coordonnées écran vers coordonnées espace-temps
 * @param {number} screenX - Coordonnée X écran
 * @param {number} screenY - Coordonnée Y écran  
 * @returns {{x: number, t: number}} Coordonnées espace-temps
 */
export function screenToSpacetime(screenX, screenY) {
    const canvasRef = getCanvas();
    if (!canvasRef) return { x: 0, t: 0 };
    
    const centerX = canvasRef.width / 2;
    const centerY = canvasRef.height - 50; // Origine en bas avec marge
    const scale = calculateAdaptiveScale();
    
    const x = (screenX - centerX) / scale;
    const t = (centerY - screenY) / scale; // Le temps va vers le haut
    
    return { x, t };
}

/**
 * Convertit coordonnées espace-temps vers coordonnées écran
 * @param {number} x - Coordonnée spatiale
 * @param {number} t - Coordonnée temporelle
 * @returns {{screenX: number, screenY: number}} Coordonnées écran
 */
export function spacetimeToScreen(x, t) {
    const canvasRef = getCanvas();
    if (!canvasRef) return { screenX: 0, screenY: 0 };
    
    const centerX = canvasRef.width / 2;
    const centerY = canvasRef.height - 50; // Origine en bas avec marge
    const scale = calculateAdaptiveScale();
    
    const screenX = centerX + x * scale;
    const screenY = centerY - t * scale;
    
    return { screenX, screenY };
}

/**
 * Obtient les paramètres de centrage et échelle du canvas
 * @returns {{centerX: number, centerY: number, scale: number}} Paramètres de rendu
 */
export function getCanvasTransform() {
    const canvasRef = getCanvas();
    if (!canvasRef) return { centerX: 0, centerY: 0, scale: 2 };
    
    return {
        centerX: canvasRef.width / 2,
        centerY: canvasRef.height - 50,
        scale: calculateAdaptiveScale()
    };
}

/**
 * Efface complètement le canvas
 */
export function clearCanvas() {
    const canvasRef = getCanvas();
    const ctxRef = getCtx();
    if (!ctxRef || !canvasRef) return;
    
    ctxRef.clearRect(0, 0, canvasRef.width, canvasRef.height);
}

/**
 * Vérifie si un point écran est dans les limites du canvas
 * @param {number} screenX - Coordonnée X écran
 * @param {number} screenY - Coordonnée Y écran
 * @returns {boolean} True si le point est dans le canvas
 */
export function isInCanvasBounds(screenX, screenY) {
    const canvasRef = getCanvas();
    if (!canvasRef) return false;
    
    return screenX >= 0 && screenX <= canvasRef.width && 
           screenY >= 0 && screenY <= canvasRef.height;
} 