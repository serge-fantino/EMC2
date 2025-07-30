/**
 * Module de rendu des masses gravitationnelles
 * Extrait du main.js pour améliorer la modularité
 */

// Import de la fonction de calcul de l'horizon des événements
import { calculateEventHorizon } from '../core/PhysicsUtils.js';

// Variables externes nécessaires (seront injectées)
let ctx = null;
let masses = [];

/**
 * Initialise le renderer de masses avec les dépendances externes
 * @param {CanvasRenderingContext2D} ctxRef - Contexte Canvas
 * @param {Array} massesRef - Référence vers le tableau des masses
 */
export function initializeMassRenderer(ctxRef, massesRef) {
    ctx = ctxRef;
    masses = massesRef;
}

/**
 * Met à jour la référence vers les masses
 * @param {Array} massesRef - Nouvelle référence vers les masses
 */
export function updateMasses(massesRef) {
    masses = massesRef;
}

/**
 * Dessine toutes les masses gravitationnelles
 */
export function drawMasses() {
    if (!ctx || !masses) return;
    
    masses.forEach(mass => {
        let radius, fillColor, strokeColor, textColor;
        
        if (mass.type === 'blackhole') {
            // Paramètres
            radius = 20;
            const eventHorizonRadius = calculateEventHorizon(mass.mass);

            // 1. Halo orange
            ctx.save();
            ctx.shadowColor = '#ff8800';
            ctx.shadowBlur = 25;
            ctx.beginPath();
            ctx.arc(mass.x, mass.y, radius + 10, 0, 2 * Math.PI);
            ctx.fillStyle = '#ff8800';
            ctx.fill();
            ctx.restore();

            // 2. Disque noir
            ctx.beginPath();
            ctx.arc(mass.x, mass.y, radius, 0, 2 * Math.PI);
            ctx.fillStyle = '#000000';
            ctx.fill();

            // 3. Bordure orange
            ctx.strokeStyle = '#ff8800';
            ctx.lineWidth = 2;
            ctx.stroke();

            // 4. Horizon des événements (pointillé orange)
            ctx.save();
            ctx.strokeStyle = '#ff8800';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(mass.x, mass.y, eventHorizonRadius, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            // 5. Texte orange
            ctx.fillStyle = '#ff8800';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${(mass.mass / 1000).toFixed(0)}K`, mass.x, mass.y + 4);
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
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.arc(mass.x, mass.y, radius, 0, 2 * Math.PI);
        ctx.fill();
        
        // Bordure
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Afficher la masse
        ctx.fillStyle = textColor;
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        
        let massText;
        if (mass.type === 'blackhole') {
            // Afficher en K pour les trous noirs
            massText = `${(mass.mass / 1000).toFixed(0)}K`;
        } else {
            massText = `${mass.mass.toFixed(0)}`;
        }
        
        ctx.fillText(massText, mass.x, mass.y + 4);
        
        // Effet lumineux pour les trous noirs
        if (mass.type === 'blackhole') {
            ctx.shadowColor = '#ff8800';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(mass.x, mass.y, radius + 8, 0, 2 * Math.PI);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    });
} 