/**
 * Module de rendu des vecteurs de force gravitationnelle
 * Extrait du main.js pour améliorer la modularité
 */

import { AppContext } from '../core/AppContext.js';

/**
 * Initialise le renderer de vecteurs
 */
export function initializeVectorRenderer() {
    // Plus besoin d'injection de dépendances, utilise AppContext directement
}

/**
 * Met à jour les paramètres (maintenu pour compatibilité)
 */
export function updateParameters() {
    // Plus besoin de mise à jour, utilise AppContext directement
}

/**
 * Dessine les vecteurs de force gravitationnelle
 */
export function drawVectors() {
    if (!AppContext.ctx || !AppContext.canvas || !AppContext.showVectors || !AppContext.masses || AppContext.masses.length === 0) return;
    
    AppContext.ctx.strokeStyle = '#4499ff';
    AppContext.ctx.lineWidth = 2;
    
    const step = AppContext.spacing;
    
    for (let x = 0; x <= AppContext.canvas.width; x += step) {
        for (let y = 0; y <= AppContext.canvas.height; y += step) {
            // Obtenir la version de ce point de grille
            const { gridX, gridY } = AppContext.getGridVersionIndex(x, y);
            const gridVersions = AppContext.getGridVersions();
            const pointVersion = gridVersions[gridX] && gridVersions[gridX][gridY] !== undefined 
                ? gridVersions[gridX][gridY] : 0;
            
            // Obtenir les masses pour cette version
            const versionMasses = AppContext.getMassesForVersion(pointVersion, AppContext.masses);
            
            let totalForceX = 0;
            let totalForceY = 0;
            
            versionMasses.forEach(mass => {
                const dx = mass.x - x;
                const dy = mass.y - y;
                const distSq = dx * dx + dy * dy;
                
                if (distSq > 0) {
                    const force = 1000 * mass.mass / distSq;
                    const dist = Math.sqrt(distSq);
                    totalForceX += force * dx / dist;
                    totalForceY += force * dy / dist;
                }
            });
            
            const magnitude = Math.sqrt(totalForceX * totalForceX + totalForceY * totalForceY);
            
            if (magnitude > 1) {
                const scale = Math.min(20, magnitude * 0.1) * AppContext.forceScale;
                const normalizedX = totalForceX / magnitude;
                const normalizedY = totalForceY / magnitude;
                
                const endX = x + normalizedX * scale;
                const endY = y + normalizedY * scale;
                
                AppContext.ctx.beginPath();
                AppContext.ctx.moveTo(x, y);
                AppContext.ctx.lineTo(endX, endY);
                AppContext.ctx.stroke();
                
                const angle = Math.atan2(normalizedY, normalizedX);
                AppContext.ctx.beginPath();
                AppContext.ctx.moveTo(endX, endY);
                AppContext.ctx.lineTo(
                    endX - 8 * Math.cos(angle - 0.3),
                    endY - 8 * Math.sin(angle - 0.3)
                );
                AppContext.ctx.moveTo(endX, endY);
                AppContext.ctx.lineTo(
                    endX - 8 * Math.cos(angle + 0.3),
                    endY - 8 * Math.sin(angle + 0.3)
                );
                AppContext.ctx.stroke();
            }
        }
    }
} 