/**
 * Module de rendu des vecteurs de force gravitationnelle
 * Extrait du main.js pour améliorer la modularité
 */

// Variables externes nécessaires (seront injectées)
let ctx = null;
let canvas = null;
let spacing = 32;
let showVectors = true;
let forceScale = 1.0;
let masses = [];
let getGridVersionIndex = null;
let getGridVersions = null;
let getMassesForVersion = null;

/**
 * Initialise le renderer de vecteurs avec les dépendances externes
 * @param {CanvasRenderingContext2D} ctxRef - Contexte Canvas
 * @param {HTMLCanvasElement} canvasRef - Élément Canvas
 * @param {number} spacingRef - Espacement de la grille
 * @param {boolean} showVectorsRef - État d'affichage des vecteurs
 * @param {number} forceScaleRef - Échelle des forces
 * @param {Array} massesRef - Référence vers le tableau des masses
 * @param {Function} getGridVersionIndexRef - Fonction pour obtenir l'index de version
 * @param {Function} getGridVersionsRef - Fonction pour obtenir les versions de grille
 * @param {Function} getMassesForVersionRef - Fonction pour obtenir les masses d'une version
 */
export function initializeVectorRenderer(
    ctxRef,
    canvasRef,
    spacingRef,
    showVectorsRef,
    forceScaleRef,
    massesRef,
    getGridVersionIndexRef,
    getGridVersionsRef,
    getMassesForVersionRef
) {
    ctx = ctxRef;
    canvas = canvasRef;
    spacing = spacingRef;
    showVectors = showVectorsRef;
    forceScale = forceScaleRef;
    masses = massesRef;
    getGridVersionIndex = getGridVersionIndexRef;
    getGridVersions = getGridVersionsRef;
    getMassesForVersion = getMassesForVersionRef;
}

/**
 * Met à jour les paramètres
 * @param {boolean} showVectorsRef - Nouvel état d'affichage
 * @param {number} forceScaleRef - Nouvelle échelle des forces
 * @param {Array} massesRef - Nouvelle référence vers les masses
 */
export function updateParameters(showVectorsRef, forceScaleRef, massesRef) {
    showVectors = showVectorsRef;
    forceScale = forceScaleRef;
    masses = massesRef;
}

/**
 * Dessine les vecteurs de force gravitationnelle
 */
export function drawVectors() {
    if (!ctx || !canvas || !showVectors || !masses || masses.length === 0) return;
    
    ctx.strokeStyle = '#4499ff';
    ctx.lineWidth = 2;
    
    const step = spacing;
    
    for (let x = 0; x <= canvas.width; x += step) {
        for (let y = 0; y <= canvas.height; y += step) {
            // Obtenir la version de ce point de grille
            const { gridX, gridY } = getGridVersionIndex(x, y);
            const gridVersions = getGridVersions();
            const pointVersion = gridVersions[gridX] && gridVersions[gridX][gridY] !== undefined 
                ? gridVersions[gridX][gridY] : 0;
            
            // Obtenir les masses pour cette version
            const versionMasses = getMassesForVersion(pointVersion, masses);
            
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
                const scale = Math.min(20, magnitude * 0.1) * forceScale;
                const normalizedX = totalForceX / magnitude;
                const normalizedY = totalForceY / magnitude;
                
                const endX = x + normalizedX * scale;
                const endY = y + normalizedY * scale;
                
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(endX, endY);
                ctx.stroke();
                
                const angle = Math.atan2(normalizedY, normalizedX);
                ctx.beginPath();
                ctx.moveTo(endX, endY);
                ctx.lineTo(
                    endX - 8 * Math.cos(angle - 0.3),
                    endY - 8 * Math.sin(angle - 0.3)
                );
                ctx.moveTo(endX, endY);
                ctx.lineTo(
                    endX - 8 * Math.cos(angle + 0.3),
                    endY - 8 * Math.sin(angle + 0.3)
                );
                ctx.stroke();
            }
        }
    }
} 