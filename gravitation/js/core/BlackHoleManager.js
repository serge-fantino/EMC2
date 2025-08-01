/**
 * Gestionnaire de trous noirs
 * Extrait du main.js pour améliorer la modularité
 */

import { createNewVersion, updateGridPointVersion } from './VersionManager.js';
import { AppContext } from './AppContext.js';
import { createPropagationFront, removePropagationFront } from './PropagationManager.js';

/**
 * Initialise le gestionnaire de trous noirs
 * Plus besoin d'injection de dépendances, utilise AppContext
 */
export function initializeBlackHoleManager() {
    // Plus besoin d'initialisation, utilise AppContext directement
}

/**
 * Met à jour les références
 * Plus besoin de mise à jour, utilise AppContext directement
 */
export function updateReferences() {
    // Plus besoin de mise à jour, utilise AppContext directement
}

/**
 * Convertit les coordonnées en point de grille
 * @param {number} x - Coordonnée x
 * @param {number} y - Coordonnée y
 * @returns {Object} Point de grille {x, y}
 */
function getGridPoint(x, y) {
    const gridX = Math.round(x / AppContext.spacing) * AppContext.spacing;
    const gridY = Math.round(y / AppContext.spacing) * AppContext.spacing;
    return { x: gridX, y: gridY };
}

/**
 * Ajoute ou modifie un trou noir
 * @param {number} x - Coordonnée x
 * @param {number} y - Coordonnée y
 * @param {boolean} isRightClick - Si c'est un clic droit
 */
export function addBlackHole(x, y, isRightClick = false) {
    const gridPoint = getGridPoint(x, y);
    
    // Chercher un trou noir existant à cet endroit
    const existing = AppContext.masses.find(m => 
        m.type === 'blackhole' &&
        Math.abs(m.x - gridPoint.x) < AppContext.spacing/2 && 
        Math.abs(m.y - gridPoint.y) < AppContext.spacing/2
    );
    
    if (existing) {
        // Modifier trou noir existant
        console.log('Trou noir existant trouvée, masse:', existing.mass);
        const oldMass = existing.mass;
        
        if (isRightClick) {
            // Division par 2
            existing.mass = existing.mass / 2;
            
            // Supprimer le trou noir si sa masse devient trop petite
            if (existing.mass < 50000) {
                removeBlackHole(existing);
                return;
            }
        } else {
            // Multiplication par 2
            existing.mass *= 2;
            console.log('Trou noir agrandi:', existing.mass);
        }
        
        // Créer un nouveau front de propagation si la masse a changé
        if (existing.mass !== oldMass) {
            const versionInfo = createNewVersion('modification', gridPoint.x, gridPoint.y, existing.mass - oldMass, AppContext.masses);
            
            // Mettre à jour immédiatement la version du point où le trou noir est modifié
            updateGridPointVersion(gridPoint.x, gridPoint.y, versionInfo.version);
            
            // Créer le front de propagation
            createPropagationFront(versionInfo.x, versionInfo.y, versionInfo.version, versionInfo.type, versionInfo.massChange);
            // Recalculer toutes les géodésiques quand un trou noir change
            AppContext.recalculateAllGeodesics();
        }
    } else if (!isRightClick) {
        // Créer nouveau trou noir (seulement avec clic gauche)
        AppContext.masses.push({ 
            x: gridPoint.x, 
            y: gridPoint.y, 
            mass: 100000,
            type: 'blackhole'
        });
        const versionInfo = createNewVersion('creation', gridPoint.x, gridPoint.y, 0, AppContext.masses);
        
        // Mettre à jour immédiatement la version du point où le trou noir est créé
        updateGridPointVersion(gridPoint.x, gridPoint.y, versionInfo.version);
        
                    // Créer le front de propagation
            createPropagationFront(versionInfo.x, versionInfo.y, versionInfo.version, versionInfo.type, versionInfo.massChange);
        // Recalculer toutes les géodésiques quand un nouveau trou noir est ajouté
        AppContext.recalculateAllGeodesics();
    }
    
    AppContext.updateDebugInfo();
}

/**
 * Supprime un trou noir
 * @param {Object} blackHole - Trou noir à supprimer
 */
export function removeBlackHole(blackHole) {
    const index = AppContext.masses.indexOf(blackHole);
    if (index > -1) {
        AppContext.masses.splice(index, 1);
        // Supprimer aussi le front de propagation correspondant
        removePropagationFront(blackHole.x, blackHole.y);
        // Recalculer toutes les géodésiques quand un trou noir est supprimé
        AppContext.recalculateAllGeodesics();
    }
}

/**
 * Récupère tous les trous noirs
 * @returns {Array} Tableau des trous noirs
 */
export function getBlackHoles() {
    return AppContext.masses.filter(m => m.type === 'blackhole');
}

/**
 * Vérifie si un point contient un trou noir
 * @param {number} x - Coordonnée x
 * @param {number} y - Coordonnée y
 * @returns {Object|null} Trou noir trouvé ou null
 */
export function findBlackHoleAt(x, y) {
    const gridPoint = getGridPoint(x, y);
    return AppContext.masses.find(m => 
        m.type === 'blackhole' &&
        Math.abs(m.x - gridPoint.x) < AppContext.spacing/2 && 
        Math.abs(m.y - gridPoint.y) < AppContext.spacing/2
    );
} 