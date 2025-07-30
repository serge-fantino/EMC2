/**
 * Module de rendu des géodésiques
 * Extrait du main.js pour améliorer la modularité
 */

// Variables externes nécessaires (seront injectées)
let ctx = null;
let geodesics = [];
let masses = [];

/**
 * Initialise le renderer de géodésiques avec les dépendances externes
 * @param {CanvasRenderingContext2D} ctxRef - Contexte Canvas
 * @param {Array} geodesicsRef - Référence vers le tableau des géodésiques
 * @param {Array} massesRef - Référence vers le tableau des masses
 */
export function initializeGeodesicRenderer(ctxRef, geodesicsRef, massesRef) {
    ctx = ctxRef;
    geodesics = geodesicsRef;
    masses = massesRef;
}

/**
 * Met à jour les références
 * @param {Array} geodesicsRef - Nouvelle référence vers les géodésiques
 * @param {Array} massesRef - Nouvelle référence vers les masses
 */
export function updateReferences(geodesicsRef, massesRef) {
    geodesics = geodesicsRef;
    masses = massesRef;
}

/**
 * Dessine toutes les géodésiques
 */
export function drawGeodesics() {
    if (!ctx || !geodesics || geodesics.length === 0) return;
    
    ctx.strokeStyle = '#8A2BE2';
    ctx.setLineDash([5, 5]);
    
    // Calculer les valeurs min/max d'intensité pour toutes les géodésiques
    let minIntensity = Infinity;
    let maxIntensity = -Infinity;
    
    geodesics.forEach(geodesic => {
        geodesic.points.forEach((point, index) => {
            if (index < geodesic.points.length - 1) {
                const nextPoint = geodesic.points[index + 1];
                const midX = (point.x + nextPoint.x) / 2;
                const midY = (point.y + nextPoint.y) / 2;
                
                let totalIntensity = 0;
                masses.forEach(mass => {
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
    
    geodesics.forEach(geodesic => {
        if (!geodesic.points || geodesic.points.length < 2) return;
        
        ctx.beginPath();
        ctx.moveTo(geodesic.points[0].x, geodesic.points[0].y);
        
        // Dessiner chaque segment avec une épaisseur variable
        for (let i = 0; i < geodesic.points.length - 1; i++) {
            const point = geodesic.points[i];
            const nextPoint = geodesic.points[i + 1];
            
            // Calculer l'intensité au milieu du segment
            const midX = (point.x + nextPoint.x) / 2;
            const midY = (point.y + nextPoint.y) / 2;
            
            let totalIntensity = 0;
            masses.forEach(mass => {
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
            ctx.lineWidth = lineWidth;
            
            ctx.lineTo(nextPoint.x, nextPoint.y);
        }
        
        ctx.stroke();
        
        // Dessiner le point de départ (plus discret)
        ctx.fillStyle = '#8A2BE2';
        ctx.beginPath();
        ctx.arc(geodesic.startX, geodesic.startY, 2, 0, 2 * Math.PI);
        ctx.fill();
        
        // Effet lumineux plus subtil
        ctx.shadowColor = '#8A2BE2';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(geodesic.startX, geodesic.startY, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;
    });
    
    // Remettre les paramètres par défaut
    ctx.setLineDash([]);
} 