/**
 * Module de rendu des vaisseaux spatiaux
 * Extrait du main.js pour améliorer la modularité
 */

import { AppContext } from '../core/AppContext.js';
import { maxSpeed } from '../core/PhysicsConstants.js';

/**
 * Initialise le renderer de vaisseaux
 */
export function initializeSpacecraftRenderer() {
    // Plus besoin d'injection de dépendances, utilise AppContext directement
}

/**
 * Met à jour les références (maintenu pour compatibilité)
 */
export function updateReferences() {
    // Plus besoin de mise à jour, utilise AppContext directement
}

/**
 * Dessine tous les vaisseaux spatiaux
 */
export function drawSpacecrafts() {
    if (!AppContext.ctx || !AppContext.canvas || !AppContext.spacecrafts) return;
    
    // Dessiner les vaisseaux existants
    AppContext.spacecrafts.forEach(spacecraft => {
        // Dessiner la trajectoire
        if (spacecraft.trail.length > 1) {
            AppContext.ctx.strokeStyle = '#ffff00';
            AppContext.ctx.lineWidth = 2;
            AppContext.ctx.setLineDash([]);
            AppContext.ctx.beginPath();
            AppContext.ctx.moveTo(spacecraft.trail[0].x, spacecraft.trail[0].y);
            
            for (let i = 1; i < spacecraft.trail.length; i++) {
                AppContext.ctx.lineTo(spacecraft.trail[i].x, spacecraft.trail[i].y);
            }
            AppContext.ctx.stroke();
        }
        
        // Dessiner le vaisseau
        AppContext.ctx.fillStyle = '#00ff00';
        AppContext.ctx.beginPath();
        AppContext.ctx.arc(spacecraft.x, spacecraft.y, 6, 0, 2 * Math.PI);
        AppContext.ctx.fill();
        
        // Bordure
        AppContext.ctx.strokeStyle = '#ffffff';
        AppContext.ctx.lineWidth = 2;
        AppContext.ctx.stroke();
        
        // Indicateur de direction (flèche)
        const speed = Math.sqrt(spacecraft.vx * spacecraft.vx + spacecraft.vy * spacecraft.vy);
        if (speed > 0) {
            const angle = Math.atan2(spacecraft.vy, spacecraft.vx);
            const arrowLength = 15;
            
            AppContext.ctx.strokeStyle = '#ffffff';
            AppContext.ctx.lineWidth = 2;
            AppContext.ctx.beginPath();
            AppContext.ctx.moveTo(spacecraft.x, spacecraft.y);
            AppContext.ctx.lineTo(
                spacecraft.x + arrowLength * Math.cos(angle),
                spacecraft.y + arrowLength * Math.sin(angle)
            );
            AppContext.ctx.stroke();
            
            // Pointe de la flèche
            AppContext.ctx.beginPath();
            AppContext.ctx.moveTo(
                spacecraft.x + arrowLength * Math.cos(angle),
                spacecraft.y + arrowLength * Math.sin(angle)
            );
            AppContext.ctx.lineTo(
                spacecraft.x + (arrowLength - 5) * Math.cos(angle - 0.3),
                spacecraft.y + (arrowLength - 5) * Math.sin(angle - 0.3)
            );
            AppContext.ctx.moveTo(
                spacecraft.x + arrowLength * Math.cos(angle),
                spacecraft.y + arrowLength * Math.sin(angle)
            );
            AppContext.ctx.lineTo(
                spacecraft.x + (arrowLength - 5) * Math.cos(angle + 0.3),
                spacecraft.y + (arrowLength - 5) * Math.sin(angle + 0.3)
            );
            AppContext.ctx.stroke();
        }
        
        // Afficher la vitesse
        AppContext.ctx.fillStyle = '#ffffff';
        AppContext.ctx.font = '10px Arial';
        AppContext.ctx.textAlign = 'center';
        AppContext.ctx.fillText(`${speed.toFixed(1)}`, spacecraft.x, spacecraft.y - 15);
    });
    
    // Dessiner l'indicateur de placement de vaisseau
    if (AppContext.isPlacingSpacecraft && AppContext.spacecraftStartPoint) {
        // Dessiner le point de départ
        AppContext.ctx.strokeStyle = '#00ff00';
        AppContext.ctx.lineWidth = 2;
        AppContext.ctx.setLineDash([5, 5]);
        AppContext.ctx.beginPath();
        AppContext.ctx.arc(AppContext.spacecraftStartPoint.x, AppContext.spacecraftStartPoint.y, 8, 0, 2 * Math.PI);
        AppContext.ctx.stroke();
        AppContext.ctx.setLineDash([]);
        
        // Calculer le vecteur vitesse prévisualisé
        const velocityX = AppContext.mousePosition.x - AppContext.spacecraftStartPoint.x;
        const velocityY = AppContext.mousePosition.y - AppContext.spacecraftStartPoint.y;
        const distance = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
        
        if (distance > 0) {
            // Normaliser la direction
            const normalizedDirX = velocityX / distance;
            const normalizedDirY = velocityY / distance;
            
            // Calculer la vitesse initiale (même logique que la création)
            const initialSpeed = Math.min(distance * 2.0, maxSpeed); // Augmenter le facteur pour plus de visibilité
            
            // Dessiner le vecteur vitesse prévisualisé
            AppContext.ctx.strokeStyle = '#00ff00';
            AppContext.ctx.lineWidth = 3;
            AppContext.ctx.setLineDash([]);
            AppContext.ctx.beginPath();
            AppContext.ctx.moveTo(AppContext.spacecraftStartPoint.x, AppContext.spacecraftStartPoint.y);
            AppContext.ctx.lineTo(
                AppContext.spacecraftStartPoint.x + normalizedDirX * initialSpeed * 0.5,
                AppContext.spacecraftStartPoint.y + normalizedDirY * initialSpeed * 0.5
            );
            AppContext.ctx.stroke();
            
            // Dessiner la flèche
            const arrowLength = 15;
            const angle = Math.atan2(normalizedDirY, normalizedDirX);
            AppContext.ctx.beginPath();
            AppContext.ctx.moveTo(
                AppContext.spacecraftStartPoint.x + normalizedDirX * initialSpeed * 0.5,
                AppContext.spacecraftStartPoint.y + normalizedDirY * initialSpeed * 0.5
            );
            AppContext.ctx.lineTo(
                AppContext.spacecraftStartPoint.x + normalizedDirX * initialSpeed * 0.5 - arrowLength * Math.cos(angle - 0.3),
                AppContext.spacecraftStartPoint.y + normalizedDirY * initialSpeed * 0.5 - arrowLength * Math.sin(angle - 0.3)
            );
            AppContext.ctx.moveTo(
                AppContext.spacecraftStartPoint.x + normalizedDirX * initialSpeed * 0.5,
                AppContext.spacecraftStartPoint.y + normalizedDirY * initialSpeed * 0.5
            );
            AppContext.ctx.lineTo(
                AppContext.spacecraftStartPoint.x + normalizedDirX * initialSpeed * 0.5 - arrowLength * Math.cos(angle + 0.3),
                AppContext.spacecraftStartPoint.y + normalizedDirY * initialSpeed * 0.5 - arrowLength * Math.sin(angle + 0.3)
            );
            AppContext.ctx.stroke();
            
            // Afficher la vitesse prévisualisée
            AppContext.ctx.fillStyle = '#00ff00';
            AppContext.ctx.font = '12px Arial';
            AppContext.ctx.textAlign = 'center';
            AppContext.ctx.fillText(`${initialSpeed.toFixed(1)}`, 
                AppContext.spacecraftStartPoint.x + normalizedDirX * initialSpeed * 0.25,
                AppContext.spacecraftStartPoint.y + normalizedDirY * initialSpeed * 0.25 - 10
            );
        }
    }
} 