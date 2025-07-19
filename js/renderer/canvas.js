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
    canvas = canvasElement;
    ctx = canvas.getContext('2d');
    console.log('Canvas renderer initialized');
}

/**
 * Redimensionne le canvas à la taille de la fenêtre
 */
export function resizeCanvas() {
    if (!canvas) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

/**
 * Convertit coordonnées écran vers coordonnées espace-temps
 * @param {number} screenX - Coordonnée X écran
 * @param {number} screenY - Coordonnée Y écran  
 * @returns {{x: number, t: number}} Coordonnées espace-temps
 */
export function screenToSpacetime(screenX, screenY) {
    if (!canvas) return { x: 0, t: 0 };
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height - 50; // Origine en bas avec marge
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
    if (!canvas) return { screenX: 0, screenY: 0 };
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height - 50; // Origine en bas avec marge
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
    if (!canvas) return { centerX: 0, centerY: 0, scale: 2 };
    
    return {
        centerX: canvas.width / 2,
        centerY: canvas.height - 50,
        scale: 2
    };
}

/**
 * Efface complètement le canvas
 */
export function clearCanvas() {
    if (!ctx || !canvas) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Vérifie si un point écran est dans les limites du canvas
 * @param {number} screenX - Coordonnée X écran
 * @param {number} screenY - Coordonnée Y écran
 * @returns {boolean} True si le point est dans le canvas
 */
export function isInCanvasBounds(screenX, screenY) {
    if (!canvas) return false;
    
    return screenX >= 0 && screenX <= canvas.width && 
           screenY >= 0 && screenY <= canvas.height;
} 