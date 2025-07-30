/**
 * Module de rendu de la grille
 * Extrait du main.js pour améliorer la modularité
 */

// Variables externes nécessaires (seront injectées)
let ctx = null;
let canvas = null;
let spacing = 32;
let showGrid = true;

/**
 * Initialise le renderer de grille avec les dépendances externes
 * @param {CanvasRenderingContext2D} ctxRef - Contexte Canvas
 * @param {HTMLCanvasElement} canvasRef - Élément Canvas
 * @param {number} spacingRef - Espacement de la grille
 * @param {boolean} showGridRef - État d'affichage de la grille
 */
export function initializeGridRenderer(ctxRef, canvasRef, spacingRef, showGridRef) {
    ctx = ctxRef;
    canvas = canvasRef;
    spacing = spacingRef;
    showGrid = showGridRef;
}

/**
 * Met à jour l'état d'affichage de la grille
 * @param {boolean} show - Nouvel état d'affichage
 */
export function setShowGrid(show) {
    showGrid = show;
}

/**
 * Dessine la grille de points
 */
export function drawGrid() {
    if (!showGrid || !ctx || !canvas) return;
    
    ctx.fillStyle = '#666';
    for (let x = 0; x <= canvas.width; x += spacing) {
        for (let y = 0; y <= canvas.height; y += spacing) {
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
} 