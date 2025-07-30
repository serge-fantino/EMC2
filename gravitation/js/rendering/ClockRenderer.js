/**
 * Module de rendu des horloges
 * Extrait du main.js pour améliorer la modularité
 */

// Variables externes nécessaires (seront injectées)
let ctx = null;
let clocks = [];
let masses = []; // Référence aux masses actuelles
let getGridVersionIndex = null;
let getGridVersions = null;
let getMassesForVersion = null;
let calculateGravitationalTimeDilation = null;

/**
 * Initialise le renderer d'horloges avec les dépendances externes
 * @param {CanvasRenderingContext2D} ctxRef - Contexte Canvas
 * @param {Array} clocksRef - Référence vers le tableau des horloges
 * @param {Function} getGridVersionIndexRef - Fonction pour obtenir l'index de version
 * @param {Function} getGridVersionsRef - Fonction pour obtenir les versions de grille
 * @param {Function} getMassesForVersionRef - Fonction pour obtenir les masses d'une version
 * @param {Function} calculateGravitationalTimeDilationRef - Fonction de calcul de la dilatation temporelle
 * @param {Array} massesRef - Référence vers le tableau des masses
 */
export function initializeClockRenderer(
    ctxRef,
    clocksRef,
    getGridVersionIndexRef,
    getGridVersionsRef,
    getMassesForVersionRef,
    calculateGravitationalTimeDilationRef,
    massesRef
) {
    ctx = ctxRef;
    clocks = clocksRef;
    masses = massesRef;
    getGridVersionIndex = getGridVersionIndexRef;
    getGridVersions = getGridVersionsRef;
    getMassesForVersion = getMassesForVersionRef;
    calculateGravitationalTimeDilation = calculateGravitationalTimeDilationRef;
}

/**
 * Met à jour la référence vers les horloges
 * @param {Array} clocksRef - Nouvelle référence vers les horloges
 * @param {Array} massesRef - Nouvelle référence vers les masses
 */
export function updateClocks(clocksRef, massesRef) {
    clocks = clocksRef;
    masses = massesRef;
}

/**
 * Dessine toutes les horloges
 */
export function drawClocks() {
    if (!ctx || !clocks) return;
    
    clocks.forEach(clock => {
        // Couleur de base pour les horloges
        let clockColor = '#FFD700'; // Or
        
        // Si l'horloge est sélectionnée, changer la couleur
        if (clock.isSelected) {
            clockColor = '#FF6B6B'; // Rouge pour l'horloge sélectionnée
        }
        
        // Dessiner le cercle de l'horloge
        ctx.fillStyle = clockColor;
        ctx.beginPath();
        ctx.arc(clock.x, clock.y, 12, 0, 2 * Math.PI);
        ctx.fill();
        
        // Bordure
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Dessiner les aiguilles de l'horloge (simplifiées)
        const centerX = clock.x;
        const centerY = clock.y;
        
        // Aiguille des heures (plus courte)
        const hourAngle = (clock.localTime % 12) * Math.PI / 6; // 12 heures = 2π
        const hourLength = 6;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
            centerX + hourLength * Math.sin(hourAngle),
            centerY - hourLength * Math.cos(hourAngle)
        );
        ctx.stroke();
        
        // Aiguille des minutes (plus longue)
        const minuteAngle = (clock.localTime % 1) * 2 * Math.PI; // 1 minute = 2π
        const minuteLength = 8;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
            centerX + minuteLength * Math.sin(minuteAngle),
            centerY - minuteLength * Math.cos(minuteAngle)
        );
        ctx.stroke();
        
        // Afficher le temps local
        ctx.fillStyle = '#000000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${clock.localTime.toFixed(1)}s`, clock.x, clock.y + 25);
        
        // Afficher le facteur de dilatation temporelle
        const { gridX, gridY } = getGridVersionIndex(clock.x, clock.y);
        const gridVersions = getGridVersions();
        const pointVersion = gridVersions[gridX] && gridVersions[gridX][gridY] !== undefined 
            ? gridVersions[gridX][gridY] : 0;
                    const versionMasses = getMassesForVersion(pointVersion, masses);
        const timeDilationFactor = calculateGravitationalTimeDilation(clock.x, clock.y, versionMasses);
        
        ctx.fillStyle = '#666666';
        ctx.font = '8px Arial';
        ctx.fillText(`×${timeDilationFactor.toFixed(3)}`, clock.x, clock.y + 35);
    });
} 