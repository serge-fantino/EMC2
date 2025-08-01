/**
 * Contexte global de l'application
 * Centralise toutes les données et références pour une meilleure modularité
 */

// Données de l'application
export const AppContext = {
    // Objets de simulation
    masses: [],
    propagationFronts: [],
    spacecrafts: [],
    lasers: [],
    geodesics: [],
    clocks: [],
    
    // Paramètres de simulation
    spacing: 32,
    maxSpeed: 10,
    gridResolution: 25,
    
    // Constantes physiques
    G: 1.0,
    c: 10, // maxSpeed
    
    // Temps de référence pour les horloges
    referenceClockTime: 0,
    
    // Références externes
    canvas: null,
    ctx: null,
    
    // Fonctions utilitaires
    updateDebugInfo: null,
    recalculateAllGeodesics: null,
    
    // Système de versions
    getGridVersionIndex: null,
    getGridVersions: null,
    getMassesForVersion: null,
    updateGridVersionsForFront: null,
    
    // Variables d'état pour le placement
    isPlacingSpacecraft: false,
    spacecraftStartPoint: null,
    isPlacingLaser: false,
    laserStartPoint: null,
    isPlacingGeodesic: false,
    geodesicStartPoint: null,
    isPlacingClock: false,
    isMovingClock: false,
    selectedClock: null,
    mousePosition: { x: 0, y: 0 },
    
    // Paramètres d'affichage
    showGrid: true,
    showVectors: false,
    showPropagation: true,
    showGeodesicDebug: false,
    forceScale: 1.0,
    propagationSpeed: 1.0,
    
    // Paramètres des géodésiques
    geodesicSettings: {
        explorationStep: 0.5, // Réduit de 1.0 à 0.5 pour plus de précision
        curveStep: 10.0, // Augmenté de 5.0 à 10.0 pour une meilleure convergence
        maxSteps: 10000, // Augmenté à 10000 pour permettre les courbes complexes
        minGradientThreshold: 0.001,
        stopGradientThreshold: 0.001,
        minPoints: 3,
        minDistanceBetweenPoints: 2.0,
        maxAngle: 400, // Augmenté de 360 à 400 pour les courbes complexes
        boundingBoxMultiplier: 3,
        thicknessAmplification: 1.0 // Nouveau paramètre pour amplifier l'épaisseur
    }
};

/**
 * Initialise le contexte avec les références externes
 * @param {Object} canvas - Référence vers le canvas
 * @param {Object} ctx - Contexte de rendu
 * @param {Function} updateDebugInfo - Fonction de mise à jour des infos de debug
 * @param {Function} recalculateAllGeodesics - Fonction de recalcul des géodésiques
 * @param {Function} getGridVersionIndex - Fonction pour obtenir l'index de version
 * @param {Function} getGridVersions - Fonction pour obtenir les versions de grille
 * @param {Function} getMassesForVersion - Fonction pour obtenir les masses d'une version
 */
export function initializeAppContext(
    canvas,
    ctx,
    updateDebugInfo,
    recalculateAllGeodesics,
    getGridVersionIndex,
    getGridVersions,
    getMassesForVersion,
    updateGridVersionsForFront
) {
    AppContext.canvas = canvas;
    AppContext.ctx = ctx;
    AppContext.updateDebugInfo = updateDebugInfo;
    AppContext.recalculateAllGeodesics = recalculateAllGeodesics;
    AppContext.getGridVersionIndex = getGridVersionIndex;
    AppContext.getGridVersions = getGridVersions;
    AppContext.getMassesForVersion = getMassesForVersion;
    AppContext.updateGridVersionsForFront = updateGridVersionsForFront;
}

/**
 * Réinitialise toutes les données de simulation
 */
export function resetAppContext() {
    AppContext.masses.length = 0;
    AppContext.propagationFronts.length = 0;
    AppContext.spacecrafts.length = 0;
    AppContext.lasers.length = 0;
    AppContext.geodesics.length = 0;
    AppContext.clocks.length = 0;
    
    // Réinitialiser les états de placement
    AppContext.isPlacingSpacecraft = false;
    AppContext.spacecraftStartPoint = null;
    AppContext.isPlacingLaser = false;
    AppContext.laserStartPoint = null;
    AppContext.isPlacingGeodesic = false;
    AppContext.geodesicStartPoint = null;
    AppContext.isPlacingClock = false;
    AppContext.isMovingClock = false;
    AppContext.selectedClock = null;
    AppContext.mousePosition = { x: 0, y: 0 };
    AppContext.referenceClockTime = 0;
}

/**
 * Met à jour la position de la souris
 * @param {number} x - Coordonnée x
 * @param {number} y - Coordonnée y
 */
export function updateMousePosition(x, y) {
    AppContext.mousePosition.x = x;
    AppContext.mousePosition.y = y;
} 