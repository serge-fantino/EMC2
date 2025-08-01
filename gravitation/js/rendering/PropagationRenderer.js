/**
 * Module de rendu de la propagation gravitationnelle
 * Extrait du main.js pour améliorer la modularité
 */

import { AppContext } from '../core/AppContext.js';

/**
 * Initialise le renderer de propagation
 */
export function initializePropagationRenderer() {
    // Plus besoin d'injection de dépendances, utilise AppContext directement
}

/**
 * Met à jour les paramètres (maintenu pour compatibilité)
 */
export function updateParameters() {
    // Plus besoin de mise à jour, utilise AppContext directement
}

/**
 * Dessine les fronts de propagation gravitationnelle
 */
export function drawPropagation() {
    if (!AppContext.ctx || !AppContext.canvas || !AppContext.showPropagation || !AppContext.propagationFronts) return;
    
    const currentTime = Date.now();
    
    AppContext.propagationFronts.forEach(front => {
        const timeDiff = (currentTime - front.startTime) / 1000;
        const radius = timeDiff * 10; // 10 unités/seconde (comme dans l'original)
        const radiusInPixels = radius * front.spacing;
        
        if (radius > 0 && radiusInPixels < Math.max(AppContext.canvas.width, AppContext.canvas.height)) {
            AppContext.ctx.strokeStyle = '#44ff44';
            AppContext.ctx.lineWidth = 2;
            AppContext.ctx.setLineDash([5, 5]);
            AppContext.ctx.beginPath();
            AppContext.ctx.arc(front.x, front.y, radiusInPixels, 0, 2 * Math.PI);
            AppContext.ctx.stroke();
            AppContext.ctx.setLineDash([]);
            
            // Mettre à jour les versions de la grille pour ce front
            if (AppContext.updateGridVersionsForFront) {
                AppContext.updateGridVersionsForFront(front, radiusInPixels);
            }
        }
    });
} 