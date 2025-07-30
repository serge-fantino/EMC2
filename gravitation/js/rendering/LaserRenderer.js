/**
 * Module de rendu des lasers
 * Extrait du main.js pour améliorer la modularité
 */

// Variables externes nécessaires (seront injectées)
let ctx = null;
let lasers = [];
let masses = []; // Référence aux masses actuelles
let isPlacingLaser = false;
let laserStartPoint = null;
let mousePosition = { x: 0, y: 0 };
let getGridVersionIndex = null;
let getGridVersions = null;
let getMassesForVersion = null;
let calculateGravitationalRedshift = null;
let redshiftToColor = null;

/**
 * Initialise le renderer de lasers avec les dépendances externes
 * @param {CanvasRenderingContext2D} ctxRef - Contexte Canvas
 * @param {Array} lasersRef - Référence vers le tableau des lasers
 * @param {boolean} isPlacingLaserRef - État de placement de laser
 * @param {Object} laserStartPointRef - Point de départ du laser
 * @param {Object} mousePositionRef - Position de la souris
 * @param {Function} getGridVersionIndexRef - Fonction pour obtenir l'index de version
 * @param {Function} getGridVersionsRef - Fonction pour obtenir les versions de grille
 * @param {Function} getMassesForVersionRef - Fonction pour obtenir les masses d'une version
 * @param {Function} calculateGravitationalRedshiftRef - Fonction de calcul du redshift
 * @param {Function} redshiftToColorRef - Fonction de conversion redshift vers couleur
 * @param {Array} massesRef - Référence vers le tableau des masses
 */
export function initializeLaserRenderer(
    ctxRef, 
    lasersRef, 
    isPlacingLaserRef, 
    laserStartPointRef, 
    mousePositionRef,
    getGridVersionIndexRef,
    getGridVersionsRef,
    getMassesForVersionRef,
    calculateGravitationalRedshiftRef,
    redshiftToColorRef,
    massesRef
) {
    ctx = ctxRef;
    lasers = lasersRef;
    masses = massesRef;
    isPlacingLaser = isPlacingLaserRef;
    laserStartPoint = laserStartPointRef;
    mousePosition = mousePositionRef;
    getGridVersionIndex = getGridVersionIndexRef;
    getGridVersions = getGridVersionsRef;
    getMassesForVersion = getMassesForVersionRef;
    calculateGravitationalRedshift = calculateGravitationalRedshiftRef;
    redshiftToColor = redshiftToColorRef;
}

/**
 * Met à jour les références
 * @param {Array} lasersRef - Nouvelle référence vers les lasers
 * @param {boolean} isPlacingLaserRef - Nouvel état de placement
 * @param {Object} laserStartPointRef - Nouveau point de départ
 * @param {Object} mousePositionRef - Nouvelle position de souris
 * @param {Array} massesRef - Nouvelle référence vers les masses
 */
export function updateReferences(lasersRef, isPlacingLaserRef, laserStartPointRef, mousePositionRef, massesRef) {
    lasers = lasersRef;
    isPlacingLaser = isPlacingLaserRef;
    laserStartPoint = laserStartPointRef;
    mousePosition = mousePositionRef;
    masses = massesRef;
}

/**
 * Dessine tous les lasers
 */
export function drawLasers() {
    if (!ctx || !lasers) return;
    
    // Dessiner les lasers existants
    if (lasers && lasers.length > 0) {
        lasers.forEach(laser => {
            // Calculer le redshift gravitationnel à la position du laser
            const { gridX, gridY } = getGridVersionIndex(laser.x, laser.y);
            const gridVersions = getGridVersions();
            const pointVersion = gridVersions[gridX] && gridVersions[gridX][gridY] !== undefined 
                ? gridVersions[gridX][gridY] : 0;
            const versionMasses = getMassesForVersion(pointVersion, masses);
            
            const redshift = calculateGravitationalRedshift(laser.x, laser.y, versionMasses);
            const laserColor = redshiftToColor(redshift);
            
            // Dessiner la trajectoire avec couleur variable
            if (laser.trail.length > 1) {
                ctx.lineWidth = 3; // Ligne plus épaisse
                ctx.setLineDash([]);
                
                // Dessiner chaque segment avec sa propre couleur de redshift
                for (let i = 1; i < laser.trail.length; i++) {
                    const prevPoint = laser.trail[i - 1];
                    const currentPoint = laser.trail[i];
                    
                    // Calculer le redshift au milieu du segment
                    const midX = (prevPoint.x + currentPoint.x) / 2;
                    const midY = (prevPoint.y + currentPoint.y) / 2;
                    const { gridX, gridY } = getGridVersionIndex(midX, midY);
                    const gridVersions = getGridVersions();
                    const pointVersion = gridVersions[gridX] && gridVersions[gridX][gridY] !== undefined 
                        ? gridVersions[gridX][gridY] : 0;
                    const versionMasses = getMassesForVersion(pointVersion, masses);
                    const segmentRedshift = calculateGravitationalRedshift(midX, midY, versionMasses);
                    const segmentColor = redshiftToColor(segmentRedshift);
                    
                    ctx.strokeStyle = segmentColor;
                    ctx.beginPath();
                    ctx.moveTo(prevPoint.x, prevPoint.y);
                    ctx.lineTo(currentPoint.x, currentPoint.y);
                    ctx.stroke();
                }
            }
            
            // Dessiner le laser (point lumineux) avec couleur variable
            ctx.fillStyle = laserColor;
            ctx.beginPath();
            ctx.arc(laser.x, laser.y, 3, 0, 2 * Math.PI);
            ctx.fill();
            
            // Ajouter un effet lumineux avec couleur variable et pulsation
            ctx.shadowColor = laserColor;
            const pulseIntensity = Math.abs(redshift) * 10; // Pulsation basée sur l'intensité du redshift
            ctx.shadowBlur = 5 + pulseIntensity;
            ctx.beginPath();
            ctx.arc(laser.x, laser.y, 6 + pulseIntensity * 0.5, 0, 2 * Math.PI);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Afficher l'indicateur de redshift
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            const redshiftText = `z: ${redshift.toFixed(3)}`;
            ctx.fillText(redshiftText, laser.x + 10, laser.y - 5);
        });
    }
    
    // Dessiner l'indicateur de placement de laser
    if (isPlacingLaser && laserStartPoint) {
        // Dessiner le point de départ
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(laserStartPoint.x, laserStartPoint.y, 8, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Calculer le vecteur direction prévisualisé
        const directionX = mousePosition.x - laserStartPoint.x;
        const directionY = mousePosition.y - laserStartPoint.y;
        const distance = Math.sqrt(directionX * directionX + directionY * directionY);
        
        if (distance > 0) {
            // Normaliser la direction
            const normalizedDirX = directionX / distance;
            const normalizedDirY = directionY / distance;
            
            // Dessiner le vecteur direction prévisualisé
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(laserStartPoint.x, laserStartPoint.y);
            ctx.lineTo(laserStartPoint.x + normalizedDirX * 30, laserStartPoint.y + normalizedDirY * 30);
            ctx.stroke();
            
            // Dessiner la flèche
            const arrowLength = 15;
            const angle = Math.atan2(normalizedDirY, normalizedDirX);
            ctx.beginPath();
            ctx.moveTo(laserStartPoint.x + normalizedDirX * 30, laserStartPoint.y + normalizedDirY * 30);
            ctx.lineTo(
                laserStartPoint.x + normalizedDirX * 30 - arrowLength * Math.cos(angle - 0.3),
                laserStartPoint.y + normalizedDirY * 30 - arrowLength * Math.sin(angle - 0.3)
            );
            ctx.moveTo(laserStartPoint.x + normalizedDirX * 30, laserStartPoint.y + normalizedDirY * 30);
            ctx.lineTo(
                laserStartPoint.x + normalizedDirX * 30 - arrowLength * Math.cos(angle + 0.3),
                laserStartPoint.y + normalizedDirY * 30 - arrowLength * Math.sin(angle + 0.3)
            );
            ctx.stroke();
        }
    }
} 