/**
 * Module de rendu des lasers
 * Extrait du main.js pour améliorer la modularité
 */

import { AppContext } from '../core/AppContext.js';
import { calculateGravitationalRedshift, redshiftToColor } from '../core/PhysicsUtils.js';

/**
 * Initialise le renderer de lasers
 */
export function initializeLaserRenderer() {
    // Plus besoin d'injection de dépendances, utilise AppContext directement
}

/**
 * Met à jour les références (maintenu pour compatibilité)
 */
export function updateReferences() {
    // Plus besoin de mise à jour, utilise AppContext directement
}

/**
 * Dessine tous les lasers
 */
export function drawLasers() {
    if (!AppContext.ctx || !AppContext.lasers) return;
    
    // Dessiner les lasers existants
    if (AppContext.lasers && AppContext.lasers.length > 0) {
        AppContext.lasers.forEach(laser => {
            // Calculer le redshift gravitationnel à la position du laser
            const { gridX, gridY } = AppContext.getGridVersionIndex(laser.x, laser.y);
            const gridVersions = AppContext.getGridVersions();
            const pointVersion = gridVersions[gridX] && gridVersions[gridX][gridY] !== undefined 
                ? gridVersions[gridX][gridY] : 0;
            const versionMasses = AppContext.getMassesForVersion(pointVersion, AppContext.masses);
            
            // Calculer le redshift gravitationnel à la position du laser
            const redshift = calculateGravitationalRedshift(laser.x, laser.y, versionMasses);
            const laserColor = redshiftToColor(redshift);
            
            // Dessiner la trajectoire avec couleur variable
            if (laser.trail.length > 1) {
                AppContext.ctx.lineWidth = 3; // Ligne plus épaisse
                AppContext.ctx.setLineDash([]);
                
                // Dessiner chaque segment avec sa propre couleur de redshift
                for (let i = 1; i < laser.trail.length; i++) {
                    const prevPoint = laser.trail[i - 1];
                    const currentPoint = laser.trail[i];
                    
                    // Calculer le redshift au milieu du segment
                    const midX = (prevPoint.x + currentPoint.x) / 2;
                    const midY = (prevPoint.y + currentPoint.y) / 2;
                    const { gridX, gridY } = AppContext.getGridVersionIndex(midX, midY);
                    const gridVersions = AppContext.getGridVersions();
                    const pointVersion = gridVersions[gridX] && gridVersions[gridX][gridY] !== undefined 
                        ? gridVersions[gridX][gridY] : 0;
                    const versionMasses = AppContext.getMassesForVersion(pointVersion, AppContext.masses);
                    
                    // Calculer le redshift du segment
                    const segmentRedshift = calculateGravitationalRedshift(midX, midY, versionMasses);
                    const segmentColor = redshiftToColor(segmentRedshift);
                    
                    AppContext.ctx.strokeStyle = segmentColor;
                    AppContext.ctx.beginPath();
                    AppContext.ctx.moveTo(prevPoint.x, prevPoint.y);
                    AppContext.ctx.lineTo(currentPoint.x, currentPoint.y);
                    AppContext.ctx.stroke();
                }
            }
            
            // Le laser est juste un rayon, pas de "tête" lumineuse
            // Seule la trajectoire est affichée avec la couleur variable
            
            // Afficher l'indicateur de redshift
            AppContext.ctx.fillStyle = '#ffffff';
            AppContext.ctx.font = '12px Arial';
            AppContext.ctx.textAlign = 'left';
            const redshiftText = `z: ${redshift.toFixed(3)}`;
            AppContext.ctx.fillText(redshiftText, laser.x + 10, laser.y - 5);
        });
    }
    
    // Dessiner l'indicateur de placement de laser
    if (AppContext.isPlacingLaser && AppContext.laserStartPoint) {
        // Dessiner le point de départ
        AppContext.ctx.strokeStyle = '#00ff00';
        AppContext.ctx.lineWidth = 2;
        AppContext.ctx.setLineDash([5, 5]);
        AppContext.ctx.beginPath();
        AppContext.ctx.arc(AppContext.laserStartPoint.x, AppContext.laserStartPoint.y, 8, 0, 2 * Math.PI);
        AppContext.ctx.stroke();
        AppContext.ctx.setLineDash([]);
        
        // Calculer le vecteur direction prévisualisé
        const directionX = AppContext.mousePosition.x - AppContext.laserStartPoint.x;
        const directionY = AppContext.mousePosition.y - AppContext.laserStartPoint.y;
        const distance = Math.sqrt(directionX * directionX + directionY * directionY);
        
        if (distance > 0) {
            // Normaliser la direction
            const normalizedDirX = directionX / distance;
            const normalizedDirY = directionY / distance;
            
            // Dessiner le vecteur direction prévisualisé
            AppContext.ctx.strokeStyle = '#00ff00';
            AppContext.ctx.lineWidth = 3;
            AppContext.ctx.setLineDash([]);
            AppContext.ctx.beginPath();
            AppContext.ctx.moveTo(AppContext.laserStartPoint.x, AppContext.laserStartPoint.y);
            AppContext.ctx.lineTo(AppContext.laserStartPoint.x + normalizedDirX * 30, AppContext.laserStartPoint.y + normalizedDirY * 30);
            AppContext.ctx.stroke();
            
            // Dessiner la flèche
            const arrowLength = 15;
            const angle = Math.atan2(normalizedDirY, normalizedDirX);
            AppContext.ctx.beginPath();
            AppContext.ctx.moveTo(AppContext.laserStartPoint.x + normalizedDirX * 30, AppContext.laserStartPoint.y + normalizedDirY * 30);
            AppContext.ctx.lineTo(
                AppContext.laserStartPoint.x + normalizedDirX * 30 - arrowLength * Math.cos(angle - 0.3),
                AppContext.laserStartPoint.y + normalizedDirY * 30 - arrowLength * Math.sin(angle - 0.3)
            );
            AppContext.ctx.moveTo(AppContext.laserStartPoint.x + normalizedDirX * 30, AppContext.laserStartPoint.y + normalizedDirY * 30);
            AppContext.ctx.lineTo(
                AppContext.laserStartPoint.x + normalizedDirX * 30 - arrowLength * Math.cos(angle + 0.3),
                AppContext.laserStartPoint.y + normalizedDirY * 30 - arrowLength * Math.sin(angle + 0.3)
            );
            AppContext.ctx.stroke();
        }
    }
} 