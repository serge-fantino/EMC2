/**
 * Module de rendu de la grille
 * Extrait du main.js pour améliorer la modularité
 */

import { AppContext } from '../core/AppContext.js';

/**
 * Initialise le renderer de grille
 */
export function initializeGridRenderer() {
    // Plus besoin d'injection de dépendances, utilise AppContext directement
}

/**
 * Met à jour l'état d'affichage de la grille
 * @param {boolean} show - Nouvel état d'affichage
 */
export function setShowGrid(show) {
    AppContext.showGrid = show;
}

/**
 * Dessine la grille de points
 */
export function drawGrid() {
    if (!AppContext.showGrid || !AppContext.ctx || !AppContext.canvas) return;
    
    AppContext.ctx.fillStyle = '#666';
    for (let x = 0; x <= AppContext.canvas.width; x += AppContext.spacing) {
        for (let y = 0; y <= AppContext.canvas.height; y += AppContext.spacing) {
            AppContext.ctx.beginPath();
            AppContext.ctx.arc(x, y, 2, 0, 2 * Math.PI);
            AppContext.ctx.fill();
        }
    }
} 