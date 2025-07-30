/**
 * Module de rendu des vaisseaux spatiaux
 * Extrait du main.js pour améliorer la modularité
 */

// Variables externes nécessaires (seront injectées)
let ctx = null;
let canvas = null;
let spacecrafts = [];
let isPlacingSpacecraft = false;
let spacecraftStartPoint = null;
let mousePosition = { x: 0, y: 0 };

/**
 * Initialise le renderer de vaisseaux avec les dépendances externes
 * @param {CanvasRenderingContext2D} ctxRef - Contexte Canvas
 * @param {HTMLCanvasElement} canvasRef - Élément Canvas
 * @param {Array} spacecraftsRef - Référence vers le tableau des vaisseaux
 * @param {boolean} isPlacingSpacecraftRef - État de placement de vaisseau
 * @param {Object} spacecraftStartPointRef - Point de départ du vaisseau
 * @param {Object} mousePositionRef - Position de la souris
 */
export function initializeSpacecraftRenderer(ctxRef, canvasRef, spacecraftsRef, isPlacingSpacecraftRef, spacecraftStartPointRef, mousePositionRef) {
    ctx = ctxRef;
    canvas = canvasRef;
    spacecrafts = spacecraftsRef;
    isPlacingSpacecraft = isPlacingSpacecraftRef;
    spacecraftStartPoint = spacecraftStartPointRef;
    mousePosition = mousePositionRef;
}

/**
 * Met à jour les références
 * @param {Array} spacecraftsRef - Nouvelle référence vers les vaisseaux
 * @param {boolean} isPlacingSpacecraftRef - Nouvel état de placement
 * @param {Object} spacecraftStartPointRef - Nouveau point de départ
 * @param {Object} mousePositionRef - Nouvelle position de souris
 */
export function updateReferences(spacecraftsRef, isPlacingSpacecraftRef, spacecraftStartPointRef, mousePositionRef) {
    spacecrafts = spacecraftsRef;
    isPlacingSpacecraft = isPlacingSpacecraftRef;
    spacecraftStartPoint = spacecraftStartPointRef;
    mousePosition = mousePositionRef;
}

/**
 * Dessine tous les vaisseaux spatiaux
 */
export function drawSpacecrafts() {
    if (!ctx || !canvas || !spacecrafts) return;
    
    // Dessiner les vaisseaux existants
    spacecrafts.forEach(spacecraft => {
        // Dessiner la trajectoire
        if (spacecraft.trail.length > 1) {
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(spacecraft.trail[0].x, spacecraft.trail[0].y);
            
            for (let i = 1; i < spacecraft.trail.length; i++) {
                ctx.lineTo(spacecraft.trail[i].x, spacecraft.trail[i].y);
            }
            ctx.stroke();
        }
        
        // Dessiner le vaisseau
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(spacecraft.x, spacecraft.y, 6, 0, 2 * Math.PI);
        ctx.fill();
        
        // Bordure
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Indicateur de direction (flèche)
        const speed = Math.sqrt(spacecraft.vx * spacecraft.vx + spacecraft.vy * spacecraft.vy);
        if (speed > 0) {
            const angle = Math.atan2(spacecraft.vy, spacecraft.vx);
            const arrowLength = 15;
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(spacecraft.x, spacecraft.y);
            ctx.lineTo(
                spacecraft.x + arrowLength * Math.cos(angle),
                spacecraft.y + arrowLength * Math.sin(angle)
            );
            ctx.stroke();
            
            // Pointe de la flèche
            ctx.beginPath();
            ctx.moveTo(
                spacecraft.x + arrowLength * Math.cos(angle),
                spacecraft.y + arrowLength * Math.sin(angle)
            );
            ctx.lineTo(
                spacecraft.x + (arrowLength - 5) * Math.cos(angle - 0.3),
                spacecraft.y + (arrowLength - 5) * Math.sin(angle - 0.3)
            );
            ctx.moveTo(
                spacecraft.x + arrowLength * Math.cos(angle),
                spacecraft.y + arrowLength * Math.sin(angle)
            );
            ctx.lineTo(
                spacecraft.x + (arrowLength - 5) * Math.cos(angle + 0.3),
                spacecraft.y + (arrowLength - 5) * Math.sin(angle + 0.3)
            );
            ctx.stroke();
        }
        
        // Afficher la vitesse
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${speed.toFixed(1)}`, spacecraft.x, spacecraft.y - 15);
    });
    
    // Dessiner l'indicateur de placement de vaisseau
    if (isPlacingSpacecraft && spacecraftStartPoint) {
        // Dessiner le point de départ
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(spacecraftStartPoint.x, spacecraftStartPoint.y, 8, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Calculer le vecteur vitesse prévisualisé
        const velocityX = mousePosition.x - spacecraftStartPoint.x;
        const velocityY = mousePosition.y - spacecraftStartPoint.y;
        const distance = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
        
        if (distance > 0) {
            // Normaliser la direction
            const normalizedDirX = velocityX / distance;
            const normalizedDirY = velocityY / distance;
            
            // Calculer la vitesse initiale (même logique que la création)
            const initialSpeed = Math.min(distance * 0.5, 50); // maxSpeed = 50
            
            // Dessiner le vecteur vitesse prévisualisé
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(spacecraftStartPoint.x, spacecraftStartPoint.y);
            ctx.lineTo(
                spacecraftStartPoint.x + normalizedDirX * initialSpeed * 0.5,
                spacecraftStartPoint.y + normalizedDirY * initialSpeed * 0.5
            );
            ctx.stroke();
            
            // Dessiner la flèche
            const arrowLength = 15;
            const angle = Math.atan2(normalizedDirY, normalizedDirX);
            ctx.beginPath();
            ctx.moveTo(
                spacecraftStartPoint.x + normalizedDirX * initialSpeed * 0.5,
                spacecraftStartPoint.y + normalizedDirY * initialSpeed * 0.5
            );
            ctx.lineTo(
                spacecraftStartPoint.x + normalizedDirX * initialSpeed * 0.5 - arrowLength * Math.cos(angle - 0.3),
                spacecraftStartPoint.y + normalizedDirY * initialSpeed * 0.5 - arrowLength * Math.sin(angle - 0.3)
            );
            ctx.moveTo(
                spacecraftStartPoint.x + normalizedDirX * initialSpeed * 0.5,
                spacecraftStartPoint.y + normalizedDirY * initialSpeed * 0.5
            );
            ctx.lineTo(
                spacecraftStartPoint.x + normalizedDirX * initialSpeed * 0.5 - arrowLength * Math.cos(angle + 0.3),
                spacecraftStartPoint.y + normalizedDirY * initialSpeed * 0.5 - arrowLength * Math.sin(angle + 0.3)
            );
            ctx.stroke();
            
            // Afficher la vitesse prévisualisée
            ctx.fillStyle = '#00ff00';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${initialSpeed.toFixed(1)}`, 
                spacecraftStartPoint.x + normalizedDirX * initialSpeed * 0.25,
                spacecraftStartPoint.y + normalizedDirY * initialSpeed * 0.25 - 10
            );
        }
    }
} 