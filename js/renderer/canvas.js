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
    console.log('Canvas renderer initialized');
    return { canvas: canvasElement, ctx: canvasElement.getContext('2d') };
}

/**
 * Redimensionne le canvas à la taille de la fenêtre
 */
export function resizeCanvas() {
    const canvasRef = getCanvas();
    if (!canvasRef) return;
    
    canvasRef.width = window.innerWidth;
    canvasRef.height = window.innerHeight;
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
    const scale = 2;
    
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
    const scale = 2;
    
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
        scale: 2
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