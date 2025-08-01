/**
 * Gestionnaire des fronts de propagation gravitationnelle
 * Extrait du main.js pour améliorer la modularité
 */

import { AppContext } from './AppContext.js';

/**
 * Initialise le gestionnaire de propagation
 */
export function initializePropagationManager() {
    // Plus besoin d'injection de dépendances, utilise AppContext directement
}

/**
 * Met à jour les références (maintenu pour compatibilité)
 */
export function updateReferences() {
    // Plus besoin de mise à jour, utilise AppContext directement
}

/**
 * Crée un nouveau front de propagation
 * @param {number} x - Coordonnée x du front
 * @param {number} y - Coordonnée y du front
 * @param {number} version - Version du front
 * @param {string} type - Type de modification ('creation', 'modification', 'deletion')
 * @param {number} massChange - Changement de masse
 */
export function createPropagationFront(x, y, version, type, massChange) {
    const front = {
        x: x,
        y: y,
        startTime: Date.now(),
        spacing: AppContext.spacing,
        version: version,
        type: type,
        massChange: massChange
    };
    
    AppContext.propagationFronts.push(front);
    console.log(`Front de propagation créé à (${x}, ${y}), version: ${version}, type: ${type}`);
}

/**
 * Supprime un front de propagation spécifique
 * @param {number} x - Coordonnée x du front
 * @param {number} y - Coordonnée y du front
 */
export function removePropagationFront(x, y) {
    const frontIndex = AppContext.propagationFronts.findIndex(f => f.x === x && f.y === y);
    if (frontIndex > -1) {
        AppContext.propagationFronts.splice(frontIndex, 1);
        console.log(`Front de propagation supprimé à (${x}, ${y})`);
    }
}

/**
 * Met à jour tous les fronts de propagation
 * @param {number} deltaTime - Temps écoulé depuis la dernière mise à jour
 */
export function updatePropagationFronts(deltaTime) {
    const currentTime = Date.now();
    
    AppContext.propagationFronts.forEach(front => {
        const timeDiff = (currentTime - front.startTime) / 1000;
        const radius = timeDiff * 10; // 10 unités/seconde (comme dans l'original)
        const radiusInPixels = radius * front.spacing;
        
        // Mettre à jour les versions de la grille pour ce front
        if (AppContext.updateGridVersionsForFront) {
            AppContext.updateGridVersionsForFront(front, radiusInPixels);
        }
    });
}

/**
 * Nettoie les fronts de propagation expirés
 */
export function cleanupPropagationFronts() {
    const currentTime = Date.now();
    const maxCanvasSize = Math.max(AppContext.canvas.width, AppContext.canvas.height);
    
    // Filtrer les fronts qui sont sortis du canvas
    AppContext.propagationFronts = AppContext.propagationFronts.filter(front => {
        const timeDiff = (currentTime - front.startTime) / 1000;
        const radius = timeDiff * 10;
        const radiusInPixels = radius * front.spacing;
        
        // Garder le front s'il est encore visible dans le canvas
        return radiusInPixels < maxCanvasSize;
    });
}

/**
 * Récupère tous les fronts de propagation
 * @returns {Array} Tableau des fronts de propagation
 */
export function getPropagationFronts() {
    return AppContext.propagationFronts;
}

/**
 * Efface tous les fronts de propagation
 */
export function clearPropagationFronts() {
    AppContext.propagationFronts.length = 0;
    console.log('Tous les fronts de propagation effacés');
}

/**
 * Calcule le rayon actuel d'un front de propagation
 * @param {Object} front - Front de propagation
 * @returns {number} Rayon en pixels
 */
export function calculateFrontRadius(front) {
    const currentTime = Date.now();
    const timeDiff = (currentTime - front.startTime) / 1000;
    const radius = timeDiff * 10; // 10 unités/seconde
    return radius * front.spacing;
}

/**
 * Vérifie si un front de propagation est encore visible
 * @param {Object} front - Front de propagation
 * @returns {boolean} True si le front est visible
 */
export function isFrontVisible(front) {
    const radiusInPixels = calculateFrontRadius(front);
    const maxCanvasSize = Math.max(AppContext.canvas.width, AppContext.canvas.height);
    return radiusInPixels < maxCanvasSize;
} 