/**
 * Module de rendu de la propagation gravitationnelle
 * Extrait du main.js pour améliorer la modularité
 */

// Variables externes nécessaires (seront injectées)
let ctx = null;
let canvas = null;
let propagationFronts = [];
let showPropagation = true;
let propagationSpeed = 1.0;
let updateGridVersionsForFront = null;

/**
 * Initialise le renderer de propagation avec les dépendances externes
 * @param {CanvasRenderingContext2D} ctxRef - Contexte Canvas
 * @param {HTMLCanvasElement} canvasRef - Élément Canvas
 * @param {Array} propagationFrontsRef - Référence vers le tableau des fronts de propagation
 * @param {boolean} showPropagationRef - État d'affichage de la propagation
 * @param {number} propagationSpeedRef - Vitesse de propagation
 * @param {Function} updateGridVersionsForFrontRef - Fonction pour mettre à jour les versions de grille
 */
export function initializePropagationRenderer(
    ctxRef,
    canvasRef,
    propagationFrontsRef,
    showPropagationRef,
    propagationSpeedRef,
    updateGridVersionsForFrontRef
) {
    ctx = ctxRef;
    canvas = canvasRef;
    propagationFronts = propagationFrontsRef;
    showPropagation = showPropagationRef;
    propagationSpeed = propagationSpeedRef;
    updateGridVersionsForFront = updateGridVersionsForFrontRef;
}

/**
 * Met à jour les paramètres
 * @param {Array} propagationFrontsRef - Nouvelle référence vers les fronts de propagation
 * @param {boolean} showPropagationRef - Nouvel état d'affichage
 * @param {number} propagationSpeedRef - Nouvelle vitesse de propagation
 */
export function updateParameters(propagationFrontsRef, showPropagationRef, propagationSpeedRef) {
    propagationFronts = propagationFrontsRef;
    showPropagation = showPropagationRef;
    propagationSpeed = propagationSpeedRef;
}

/**
 * Dessine les fronts de propagation gravitationnelle
 */
export function drawPropagation() {
    if (!ctx || !canvas || !showPropagation || !propagationFronts) return;
    
    const currentTime = Date.now();
    
    propagationFronts.forEach(front => {
        const timeDiff = (currentTime - front.startTime) / 1000;
        const radius = timeDiff * 10; // 10 unités/seconde (comme dans l'original)
        const radiusInPixels = radius * front.spacing;
        
        if (radius > 0 && radiusInPixels < Math.max(canvas.width, canvas.height)) {
            ctx.strokeStyle = '#44ff44';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(front.x, front.y, radiusInPixels, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Mettre à jour les versions de la grille pour ce front
            if (updateGridVersionsForFront) {
                updateGridVersionsForFront(front, radiusInPixels);
            }
        }
    });
} 