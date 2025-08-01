/**
 * Module de rendu des géodésiques
 * Extrait du main.js pour améliorer la modularité
 */

import { AppContext } from '../core/AppContext.js';

/**
 * Initialise le renderer de géodésiques
 */
export function initializeGeodesicRenderer() {
    // Plus besoin d'injection de dépendances, utilise AppContext directement
}

/**
 * Met à jour les références (maintenu pour compatibilité)
 */
export function updateReferences() {
    // Plus besoin de mise à jour, utilise AppContext directement
}

/**
 * Dessine toutes les géodésiques
 */
export function drawGeodesics() {
    if (!AppContext.ctx || !AppContext.canvas || !AppContext.geodesics || AppContext.geodesics.length === 0) return;
    
    AppContext.ctx.strokeStyle = '#8A2BE2';
    AppContext.ctx.setLineDash([5, 5]);
    
    // Calculer les valeurs min/max d'intensité pour toutes les géodésiques
    let minIntensity = Infinity;
    let maxIntensity = -Infinity;
    
    AppContext.geodesics.forEach(geodesic => {
        geodesic.points.forEach((point, index) => {
            if (index < geodesic.points.length - 1) {
                const nextPoint = geodesic.points[index + 1];
                const midX = (point.x + nextPoint.x) / 2;
                const midY = (point.y + nextPoint.y) / 2;
                
                let totalIntensity = 0;
                AppContext.masses.forEach(mass => {
                    const dx = mass.x - midX;
                    const dy = mass.y - midY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance > 0) {
                        totalIntensity += mass.mass / (distance * distance);
                    }
                });
                
                // Appliquer une échelle logarithmique pour mieux gérer les variations d'ordre de grandeur
                const logIntensity = Math.log(1 + totalIntensity);
                minIntensity = Math.min(minIntensity, logIntensity);
                maxIntensity = Math.max(maxIntensity, logIntensity);
            }
        });
    });
    
    // Éviter la division par zéro
    const intensityRange = maxIntensity - minIntensity;
    if (intensityRange === 0) {
        minIntensity = 0;
        maxIntensity = 1;
    }
    
    AppContext.geodesics.forEach(geodesic => {
        if (!geodesic.points || geodesic.points.length < 2) return;
        
        AppContext.ctx.beginPath();
        AppContext.ctx.moveTo(geodesic.points[0].x, geodesic.points[0].y);
        
        // Dessiner chaque segment avec une épaisseur variable
        for (let i = 0; i < geodesic.points.length - 1; i++) {
            const point = geodesic.points[i];
            const nextPoint = geodesic.points[i + 1];
            
            // Calculer l'intensité au milieu du segment
            const midX = (point.x + nextPoint.x) / 2;
            const midY = (point.y + nextPoint.y) / 2;
            
            let totalIntensity = 0;
            AppContext.masses.forEach(mass => {
                const dx = mass.x - midX;
                const dy = mass.y - midY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > 0) {
                    totalIntensity += mass.mass / (distance * distance);
                }
            });
            
            // Appliquer l'échelle logarithmique et normaliser
            const logIntensity = Math.log(1 + totalIntensity);
            const normalizedIntensity = (logIntensity - minIntensity) / (maxIntensity - minIntensity);
            
            // Calculer l'épaisseur avec amplification
            const lineWidth = Math.max(2, Math.min(12, normalizedIntensity * 10));
            AppContext.ctx.lineWidth = lineWidth;
            
            AppContext.ctx.lineTo(nextPoint.x, nextPoint.y);
        }
        
        AppContext.ctx.stroke();
        
        // Dessiner le point de départ (plus discret)
        AppContext.ctx.fillStyle = '#8A2BE2';
        AppContext.ctx.beginPath();
        AppContext.ctx.arc(geodesic.startX, geodesic.startY, 2, 0, 2 * Math.PI);
        AppContext.ctx.fill();
        
        // Effet lumineux plus subtil
        AppContext.ctx.shadowColor = '#8A2BE2';
        AppContext.ctx.shadowBlur = 4;
        AppContext.ctx.beginPath();
        AppContext.ctx.arc(geodesic.startX, geodesic.startY, 4, 0, 2 * Math.PI);
        AppContext.ctx.fill();
        AppContext.ctx.shadowBlur = 0;
        
        // Afficher les infos de debug si activé
        if (AppContext.showGeodesicDebug) {
            drawGeodesicDebugInfo(geodesic);
        }
    });
    
    // Remettre les paramètres par défaut
    AppContext.ctx.setLineDash([]);
}

/**
 * Dessine les informations de debug pour une géodésique
 * @param {Object} geodesic - Objet géodésique
 */
function drawGeodesicDebugInfo(geodesic) {
    if (!AppContext.ctx) return;
    
    // Calculer la longueur totale
    let totalLength = 0;
    for (let i = 0; i < geodesic.points.length - 1; i++) {
        const dx = geodesic.points[i + 1].x - geodesic.points[i].x;
        const dy = geodesic.points[i + 1].y - geodesic.points[i].y;
        totalLength += Math.sqrt(dx * dx + dy * dy);
    }
    
    // Calculer la courbure moyenne
    let totalCurvature = 0;
    let curvatureCount = 0;
    
    for (let i = 1; i < geodesic.points.length - 1; i++) {
        const prev = geodesic.points[i - 1];
        const curr = geodesic.points[i];
        const next = geodesic.points[i + 1];
        
        const v1x = curr.x - prev.x;
        const v1y = curr.y - prev.y;
        const v2x = next.x - curr.x;
        const v2y = next.y - curr.y;
        
        const crossProduct = v1x * v2y - v1y * v2x;
        const dotProduct = v1x * v2x + v1y * v2y;
        
        if (dotProduct !== 0) {
            const curvature = Math.atan2(crossProduct, dotProduct) * (180 / Math.PI);
            totalCurvature += Math.abs(curvature);
            curvatureCount++;
        }
    }
    
    const avgCurvature = curvatureCount > 0 ? totalCurvature / curvatureCount : 0;
    
    // Afficher les informations
    AppContext.ctx.fillStyle = '#8A2BE2';
    AppContext.ctx.font = '12px Arial';
    AppContext.ctx.textAlign = 'left';
    
    const infoX = geodesic.startX + 10;
    const infoY = geodesic.startY - 10;
    
    AppContext.ctx.fillText(`Longueur: ${totalLength.toFixed(1)}`, infoX, infoY);
    AppContext.ctx.fillText(`Points: ${geodesic.points.length}`, infoX, infoY + 15);
    AppContext.ctx.fillText(`Courbure: ${avgCurvature.toFixed(1)}°`, infoX, infoY + 30);
} 