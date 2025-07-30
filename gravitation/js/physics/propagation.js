/**
 * Module de propagation causale
 * Gère le système de versions et la propagation des effets gravitationnels
 */

// Variables du système de propagation
let currentVersion = 0;
let massHistory = []; // Historique des configurations de masses
let gridVersions = []; // Version de chaque point de grille
let maxVersions = 50; // Limite pour le round-robin
let propagationFronts = [];

/**
 * Crée une nouvelle version du système de masses
 * @param {string} type - Type de modification
 * @param {number} x - Position X
 * @param {number} y - Position Y
 * @param {number} massChange - Changement de masse
 */
export function createNewVersion(type, x, y, massChange) {
    currentVersion++;
    
    console.log(`Création version ${currentVersion} avec ${masses.length} masses`);
    
    // Créer une copie de la configuration actuelle des masses
    const newMassConfig = masses.map(mass => ({ 
        x: mass.x, 
        y: mass.y, 
        mass: mass.mass,
        isBlackHole: mass.isBlackHole || false
    }));
    massHistory.push({
        version: currentVersion,
        masses: newMassConfig,
        timestamp: Date.now()
    });
    
    console.log(`Version ${currentVersion} créée avec ${newMassConfig.length} masses`);
    
    // Nettoyer les anciennes versions si nécessaire
    cleanupOldVersions();
    
    // Créer le front de propagation
    propagationFronts.push({
        x: x,
        y: y,
        startTime: Date.now(),
        spacing: spacing,
        version: currentVersion,
        type: type,
        massChange: massChange
    });
}

/**
 * Nettoie les anciennes versions (round-robin)
 */
function cleanupOldVersions() {
    if (massHistory.length > maxVersions) {
        // Supprimer les versions les plus anciennes
        const versionsToRemove = massHistory.length - maxVersions;
        const removedVersions = massHistory.splice(0, versionsToRemove);
        
        // Mettre à jour les références dans la grille
        const removedVersionNumbers = removedVersions.map(v => v.version);
        updateGridVersionsAfterCleanup(removedVersionNumbers);
        
        // Supprimer les fronts de propagation correspondants
        propagationFronts = propagationFronts.filter(front => 
            !removedVersionNumbers.includes(front.version)
        );
    }
}

/**
 * Met à jour les versions de grille après nettoyage
 * @param {Array} removedVersions - Versions supprimées
 */
function updateGridVersionsAfterCleanup(removedVersions) {
    const gridWidth = gridVersions.length;
    const gridHeight = gridVersions[0] ? gridVersions[0].length : 0;
    
    for (let x = 0; x < gridWidth; x++) {
        for (let y = 0; y < gridHeight; y++) {
            if (gridVersions[x] && gridVersions[x][y] !== undefined) {
                if (removedVersions.includes(gridVersions[x][y])) {
                    // Remettre à la version 0 si la version a été supprimée
                    gridVersions[x][y] = 0;
                }
            }
        }
    }
}

/**
 * Initialise la grille des versions
 * @param {number} canvasWidth - Largeur du canvas
 * @param {number} canvasHeight - Hauteur du canvas
 * @param {number} gridSpacing - Espacement de la grille
 */
export function initializeGridVersions(canvasWidth, canvasHeight, gridSpacing) {
    const gridWidth = Math.ceil(canvasWidth / gridSpacing);
    const gridHeight = Math.ceil(canvasHeight / gridSpacing);
    
    gridVersions = [];
    for (let x = 0; x < gridWidth; x++) {
        gridVersions[x] = [];
        for (let y = 0; y < gridHeight; y++) {
            gridVersions[x][y] = 0; // Version initiale
        }
    }
}

/**
 * Obtient l'index de grille pour une position donnée
 * @param {number} x - Position X
 * @param {number} y - Position Y
 * @param {number} spacing - Espacement de la grille
 * @returns {Object} Index {gridX, gridY}
 */
export function getGridVersionIndex(x, y, spacing) {
    const gridX = Math.floor(x / spacing);
    const gridY = Math.floor(y / spacing);
    return { gridX, gridY };
}

/**
 * Met à jour la version d'un point de grille
 * @param {number} x - Position X
 * @param {number} y - Position Y
 * @param {number} version - Version à assigner
 * @param {number} spacing - Espacement de la grille
 */
export function updateGridPointVersion(x, y, version, spacing) {
    const { gridX, gridY } = getGridVersionIndex(x, y, spacing);
    if (gridVersions[gridX] && gridVersions[gridX][gridY] !== undefined) {
        gridVersions[gridX][gridY] = version;
    }
}

/**
 * Obtient les masses pour une version donnée
 * @param {number} version - Numéro de version
 * @returns {Array} Liste des masses pour cette version
 */
export function getMassesForVersion(version) {
    if (version === 0) return [];
    const versionData = massHistory.find(v => v.version === version);
    console.log(`Recherche version ${version}: ${versionData ? versionData.masses.length : 0} masses trouvées`);
    return versionData ? versionData.masses : [];
}

/**
 * Met à jour les versions de grille pour un front de propagation
 * @param {Object} front - Front de propagation
 * @param {number} radius - Rayon du front
 * @param {number} spacing - Espacement de la grille
 */
export function updateGridVersionsForFront(front, radius, spacing) {
    const { gridX, gridY } = getGridVersionIndex(front.x, front.y, spacing);
    const gridRadius = Math.ceil(radius / spacing);
    
    for (let dx = -gridRadius; dx <= gridRadius; dx++) {
        for (let dy = -gridRadius; dy <= gridRadius; dy++) {
            const x = gridX + dx;
            const y = gridY + dy;
            
            if (x >= 0 && x < gridVersions.length && 
                y >= 0 && y < gridVersions[0].length) {
                updateGridPointVersion(x * spacing, y * spacing, front.version, spacing);
            }
        }
    }
}

/**
 * Obtient les fronts de propagation
 * @returns {Array} Liste des fronts de propagation
 */
export function getPropagationFronts() {
    return propagationFronts;
}

/**
 * Obtient la version actuelle
 * @returns {number} Numéro de version actuel
 */
export function getCurrentVersion() {
    return currentVersion;
}

/**
 * Obtient la grille des versions
 * @returns {Array} Grille des versions
 */
export function getGridVersions() {
    return gridVersions;
}

/**
 * Réinitialise le système de propagation
 */
export function resetPropagation() {
    currentVersion = 0;
    massHistory = [];
    propagationFronts = [];
}

// Variables à injecter depuis le module principal
let masses = [];
let spacing = 32;

/**
 * Injecte les dépendances depuis le module principal
 * @param {Array} massesArray - Array des masses
 * @param {number} gridSpacing - Espacement de la grille
 */
export function injectDependencies(massesArray, gridSpacing) {
    masses = massesArray;
    spacing = gridSpacing;
} 