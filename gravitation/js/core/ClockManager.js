/**
 * Gestionnaire des horloges et de la dilatation temporelle gravitationnelle
 * Extrait du main.js pour améliorer la modularité
 */

import { AppContext } from './AppContext.js';

/**
 * Initialise le gestionnaire d'horloges
 */
export function initializeClockManager() {
    // Plus besoin d'injection de dépendances, utilise AppContext directement
}

/**
 * Met à jour les références (maintenu pour compatibilité)
 */
export function updateReferences() {
    // Plus besoin de mise à jour, utilise AppContext directement
}

/**
 * Calcule la dilatation temporelle gravitationnelle
 * @param {number} x - Coordonnée x
 * @param {number} y - Coordonnée y
 * @param {Array} masses - Tableau des masses
 * @returns {number} Facteur de dilatation temporelle
 */
function calculateGravitationalTimeDilation(x, y, masses) {
    // Calculer le potentiel gravitationnel Φ = -GM/r
    let potential = 0;
    masses.forEach(mass => {
        const dx = mass.x - x;
        const dy = mass.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
            potential -= AppContext.G * mass.mass / distance;
        }
    });
    
    // Dilatation temporelle : dt = dt₀ * √(1 + 2Φ/c²)
    // Pour de faibles potentiels : dt ≈ dt₀ * (1 + Φ/c²)
    const timeDilationFactor = 1 + potential / (AppContext.c * AppContext.c);
    
    return Math.max(0.1, timeDilationFactor); // Éviter les valeurs négatives
}

/**
 * Ajoute une horloge à la position spécifiée
 * @param {number} x - Coordonnée x
 * @param {number} y - Coordonnée y
 */
export function addClock(x, y) {
    const clock = {
        x: x,
        y: y,
        referenceTime: AppContext.referenceClockTime, // Temps de référence au moment de la création
        localTime: AppContext.referenceClockTime, // Temps local (sera mis à jour)
        isSelected: false
    };
    
    AppContext.clocks.push(clock);
    console.log(`Horloge ajoutée à (${x}, ${y}), temps de référence: ${AppContext.referenceClockTime.toFixed(2)}s`);
}

/**
 * Met à jour toutes les horloges
 * @param {number} deltaTime - Temps écoulé depuis la dernière mise à jour
 */
export function updateClocks(deltaTime) {
    // Mettre à jour le temps de référence
    AppContext.referenceClockTime += deltaTime;
    
    // Mettre à jour chaque horloge
    AppContext.clocks.forEach(clock => {
        // Obtenir les masses à la position de l'horloge (avec propagation causale)
        const { gridX, gridY } = AppContext.getGridVersionIndex(clock.x, clock.y);
        const gridVersions = AppContext.getGridVersions();
        const pointVersion = gridVersions[gridX] && gridVersions[gridX][gridY] !== undefined 
            ? gridVersions[gridX][gridY] : 0;
        const versionMasses = AppContext.getMassesForVersion(pointVersion, AppContext.masses);
        
        // Calculer la dilatation temporelle
        const timeDilationFactor = calculateGravitationalTimeDilation(clock.x, clock.y, versionMasses);
        
        // Mettre à jour le temps local
        clock.localTime += deltaTime * timeDilationFactor;
    });
}

/**
 * Supprime une horloge
 * @param {Object} clock - Horloge à supprimer
 */
export function removeClock(clock) {
    const index = AppContext.clocks.indexOf(clock);
    if (index > -1) {
        AppContext.clocks.splice(index, 1);
        console.log('Horloge supprimée');
    }
}

/**
 * Récupère toutes les horloges
 * @returns {Array} Tableau des horloges
 */
export function getClocks() {
    return AppContext.clocks;
}

/**
 * Efface toutes les horloges
 */
export function clearClocks() {
    AppContext.clocks.length = 0;
    console.log('Toutes les horloges effacées');
}

/**
 * Annule le placement d'une horloge
 */
export function cancelClockPlacement() {
    AppContext.isPlacingClock = false;
    AppContext.isMovingClock = false;
    if (AppContext.selectedClock) {
        AppContext.selectedClock.isSelected = false;
        AppContext.selectedClock = null;
    }
    if (AppContext.canvas) {
        AppContext.canvas.style.cursor = 'default';
    }
}

/**
 * Sélectionne une horloge
 * @param {Object} clock - Horloge à sélectionner
 */
export function selectClock(clock) {
    // Désélectionner l'horloge précédemment sélectionnée
    if (AppContext.selectedClock) {
        AppContext.selectedClock.isSelected = false;
    }
    
    // Sélectionner la nouvelle horloge
    AppContext.selectedClock = clock;
    if (clock) {
        clock.isSelected = true;
    }
} 