/**
 * Gestionnaire de versions pour la simulation de propagation causale gravitationnelle
 * 
 * Ce module gère le système de versions qui simule la propagation de la gravitation
 * à la vitesse de la lumière selon les principes de la relativité générale.
 * 
 * Concept : Chaque modification de masse crée une nouvelle "version" de l'univers
 * qui se propage en cercles concentriques, simulant la causalité relativiste.
 */

// Variables d'état du système de versions
let currentVersion = 0;
let massHistory = []; // Historique des configurations de masses
let gridVersions = []; // Version de chaque point de grille
let maxVersions = 50; // Limite pour le round-robin

/**
 * Crée une nouvelle version de l'univers quand une masse change
 * @param {string} type - Type de modification ('add', 'remove', 'modify')
 * @param {number} x - Coordonnée x de la modification
 * @param {number} y - Coordonnée y de la modification
 * @param {number} massChange - Changement de masse (positif pour ajout, négatif pour suppression)
 */
export function createNewVersion(type, x, y, massChange) {
    currentVersion++;
    
    // Créer un snapshot de l'état actuel des masses
    const massSnapshot = masses.map(mass => ({
        x: mass.x,
        y: mass.y,
        mass: mass.mass
    }));
    
    // Ajouter à l'historique
    massHistory.push({
        version: currentVersion,
        type: type,
        x: x,
        y: y,
        massChange: massChange,
        masses: massSnapshot,
        timestamp: Date.now()
    });
    
    // Nettoyer les anciennes versions si nécessaire
    if (massHistory.length > maxVersions) {
        cleanupOldVersions();
    }
    
    console.log(`Nouvelle version créée: ${currentVersion} (${type} à ${x}, ${y})`);
    
    // Retourner les informations pour créer le front de propagation
    return {
        version: currentVersion,
        x: x,
        y: y,
        type: type,
        massChange: massChange
    };
}

/**
 * Nettoie les anciennes versions selon le système de round-robin
 */
export function cleanupOldVersions() {
    const removedVersions = [];
    
    // Supprimer les versions les plus anciennes
    while (massHistory.length > maxVersions / 2) {
        const removed = massHistory.shift();
        removedVersions.push(removed.version);
    }
    
    // Mettre à jour les versions de la grille
    updateGridVersionsAfterCleanup(removedVersions);
    
    console.log(`Nettoyage: ${removedVersions.length} versions supprimées (${removedVersions.join(', ')})`);
}

/**
 * Met à jour les versions de la grille après suppression d'anciennes versions
 * @param {Array} removedVersions - Versions supprimées
 */
export function updateGridVersionsAfterCleanup(removedVersions) {
    const minRemovedVersion = Math.min(...removedVersions);
    
    // Mettre à jour chaque point de la grille
    for (let x = 0; x < gridVersions.length; x++) {
        if (gridVersions[x]) {
            for (let y = 0; y < gridVersions[x].length; y++) {
                if (gridVersions[x][y] !== undefined && gridVersions[x][y] < minRemovedVersion) {
                    // Si la version du point est plus ancienne que la plus récente supprimée,
                    // on la met à jour vers la version la plus récente disponible
                    gridVersions[x][y] = massHistory[0] ? massHistory[0].version : 0;
                }
            }
        }
    }
}

/**
 * Initialise le système de versions de la grille
 */
export function initializeGridVersions() {
    gridVersions = [];
    for (let x = 0; x < gridResolution; x++) {
        gridVersions[x] = [];
        for (let y = 0; y < gridResolution; y++) {
            gridVersions[x][y] = 0; // Version initiale
        }
    }
    console.log('Système de versions de grille initialisé');
}

/**
 * Convertit les coordonnées en indices de grille
 * @param {number} x - Coordonnée x
 * @param {number} y - Coordonnée y
 * @returns {Object} Indices de grille {gridX, gridY}
 */
export function getGridVersionIndex(x, y) {
    const gridX = Math.floor(x / spacing);
    const gridY = Math.floor(y / spacing);
    return { gridX, gridY };
}

/**
 * Met à jour la version d'un point de grille
 * @param {number} x - Coordonnée x
 * @param {number} y - Coordonnée y
 * @param {number} version - Nouvelle version
 */
export function updateGridPointVersion(x, y, version) {
    const { gridX, gridY } = getGridVersionIndex(x, y);
    if (gridVersions[gridX] && gridVersions[gridX][gridY] !== undefined) {
        gridVersions[gridX][gridY] = version;
    }
}

/**
 * Récupère les masses visibles pour une version donnée
 * @param {number} version - Version demandée
 * @returns {Array} Configuration des masses pour cette version
 */
export function getMassesForVersion(version) {
    // Trouver la version la plus proche dans l'historique
    let targetVersion = 0;
    let targetMasses = [];
    
    for (let i = massHistory.length - 1; i >= 0; i--) {
        if (massHistory[i].version <= version) {
            targetVersion = massHistory[i].version;
            targetMasses = massHistory[i].masses;
            break;
        }
    }
    
    // Si aucune version trouvée, utiliser les masses actuelles
    if (targetMasses.length === 0) {
        targetMasses = masses.map(mass => ({
            x: mass.x,
            y: mass.y,
            mass: mass.mass
        }));
    }
    
    return targetMasses;
}

/**
 * Met à jour les versions de la grille pour un front de propagation
 * @param {Object} front - Front de propagation
 * @param {number} radius - Rayon du front
 */
export function updateGridVersionsForFront(front, radius) {
    const frontVersion = front.version;
    const centerX = front.x;
    const centerY = front.y;
    
    // Mettre à jour tous les points de grille dans le rayon
    for (let x = 0; x < gridResolution; x++) {
        for (let y = 0; y < gridResolution; y++) {
            const gridWorldX = x * spacing;
            const gridWorldY = y * spacing;
            const distance = Math.sqrt(
                (gridWorldX - centerX) * (gridWorldX - centerX) +
                (gridWorldY - centerY) * (gridWorldY - centerY)
            );
            
            if (distance <= radius) {
                updateGridPointVersion(gridWorldX, gridWorldY, frontVersion);
            }
        }
    }
}

// Variables externes nécessaires (seront injectées)
let masses = [];
let spacing = 32;
let gridResolution = 25;

/**
 * Initialise le gestionnaire de versions avec les dépendances externes
 * @param {Array} massesRef - Référence vers le tableau des masses
 * @param {number} spacingRef - Espacement de la grille
 * @param {number} gridResolutionRef - Résolution de la grille
 */
export function initializeVersionManager(massesRef, spacingRef, gridResolutionRef) {
    masses = massesRef;
    spacing = spacingRef;
    gridResolution = gridResolutionRef;
    
    // Initialiser le système
    initializeGridVersions();
    
    console.log('Gestionnaire de versions initialisé');
}

// Export des variables d'état pour accès externe
export function getCurrentVersion() { return currentVersion; }
export function getMassHistory() { return massHistory; }
export function getGridVersions() { return gridVersions; }
export function getMaxVersions() { return maxVersions; } 