/**
 * Module de rendu des masses gravitationnelles
 * Extrait du main.js pour améliorer la modularité
 */

// Import de la fonction de calcul de l'horizon des événements
import { calculateEventHorizon } from '../core/PhysicsUtils.js';
import { AppContext } from '../core/AppContext.js';

/**
 * Initialise le renderer de masses
 */
export function initializeMassRenderer() {
    // Plus besoin d'injection de dépendances, utilise AppContext directement
}

/**
 * Met à jour la référence vers les masses (maintenu pour compatibilité)
 */
export function updateMasses() {
    // Plus besoin de mise à jour, utilise AppContext directement
}

/**
 * Dessine toutes les masses gravitationnelles
 */
export function drawMasses() {
    if (!AppContext.ctx || !AppContext.masses) return;
    
    AppContext.masses.forEach(mass => {
        let radius, fillColor, strokeColor, textColor;
        
        if (mass.type === 'blackhole') {
            // Paramètres
            radius = 20;
            const eventHorizonRadius = calculateEventHorizon(mass.mass);

            // 1. Halo orange
            AppContext.ctx.save();
            AppContext.ctx.shadowColor = '#ff8800';
            AppContext.ctx.shadowBlur = 25;
            AppContext.ctx.beginPath();
            AppContext.ctx.arc(mass.x, mass.y, radius + 10, 0, 2 * Math.PI);
            AppContext.ctx.fillStyle = '#ff8800';
            AppContext.ctx.fill();
            AppContext.ctx.restore();

            // 2. Disque noir
            AppContext.ctx.beginPath();
            AppContext.ctx.arc(mass.x, mass.y, radius, 0, 2 * Math.PI);
            AppContext.ctx.fillStyle = '#000000';
            AppContext.ctx.fill();

            // 3. Bordure orange
            AppContext.ctx.strokeStyle = '#ff8800';
            AppContext.ctx.lineWidth = 2;
            AppContext.ctx.stroke();

            // 4. Horizon des événements (pointillé orange)
            AppContext.ctx.save();
            AppContext.ctx.shadowColor = '#ff8800';
            AppContext.ctx.lineWidth = 2;
            AppContext.ctx.setLineDash([5, 5]);
            AppContext.ctx.beginPath();
            AppContext.ctx.arc(mass.x, mass.y, eventHorizonRadius, 0, 2 * Math.PI);
            AppContext.ctx.stroke();
            AppContext.ctx.setLineDash([]);
            AppContext.ctx.restore();

            // 5. Texte orange
            AppContext.ctx.fillStyle = '#ff8800';
            AppContext.ctx.font = '12px Arial';
            AppContext.ctx.textAlign = 'center';
            AppContext.ctx.fillText(`${(mass.mass / 1000).toFixed(0)}K`, mass.x, mass.y + 4);
            return; // Empêcher le reste du rendu pour ce type
        } else if (mass.type === 'planet') {
            // Planète : taille normale, couleur bleue
            radius = 8 + Math.sqrt(mass.mass) * 0.3;
            fillColor = '#4444ff';
            strokeColor = '#aaaaff';
            textColor = '#ffffff';
        } else {
            // Masse normale : taille basée sur la masse
            radius = 8 + Math.sqrt(mass.mass) * 0.3;
            fillColor = '#ff4444';
            strokeColor = '#ffaaaa';
            textColor = '#ffffff';
        }
        
        // Dessiner le cercle de la masse
        AppContext.ctx.fillStyle = fillColor;
        AppContext.ctx.beginPath();
        AppContext.ctx.arc(mass.x, mass.y, radius, 0, 2 * Math.PI);
        AppContext.ctx.fill();
        
        // Bordure
        AppContext.ctx.strokeStyle = strokeColor;
        AppContext.ctx.lineWidth = 2;
        AppContext.ctx.stroke();
        
        // Afficher la masse
        AppContext.ctx.fillStyle = textColor;
        AppContext.ctx.font = '12px Arial';
        AppContext.ctx.textAlign = 'center';
        
        let massText;
        if (mass.type === 'blackhole') {
            // Afficher en K pour les trous noirs
            massText = `${(mass.mass / 1000).toFixed(0)}K`;
        } else {
            massText = `${mass.mass.toFixed(0)}`;
        }
        
        AppContext.ctx.fillText(massText, mass.x, mass.y + 4);
        
        // Effet lumineux pour les trous noirs
        if (mass.type === 'blackhole') {
            AppContext.ctx.shadowColor = '#ff8800';
            AppContext.ctx.shadowBlur = 15;
            AppContext.ctx.beginPath();
            AppContext.ctx.arc(mass.x, mass.y, radius + 8, 0, 2 * Math.PI);
            AppContext.ctx.fill();
            AppContext.ctx.shadowBlur = 0;
        }
    });
} 