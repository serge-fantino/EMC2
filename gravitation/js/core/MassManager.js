/**
 * Gestionnaire de masses gravitationnelles
 * Extrait du main.js pour améliorer la modularité
 */

import { createNewVersion, updateGridPointVersion } from './VersionManager.js';
import { AppContext } from './AppContext.js';

/**
 * Initialise le gestionnaire de masses
 * Plus besoin d'injection de dépendances, utilise AppContext
 */
export function initializeMassManager() {
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
 * Ajoute ou modifie une masse gravitationnelle
 * @param {number} x - Coordonnée x
 * @param {number} y - Coordonnée y
 * @param {boolean} isRightClick - Si c'est un clic droit
 */
export function addMass(x, y, isRightClick = false) {
    const gridPoint = getGridPoint(x, y);
    
    // Chercher une masse existante à cet endroit
    const existing = AppContext.masses.find(m => 
        Math.abs(m.x - gridPoint.x) < AppContext.spacing/2 && 
        Math.abs(m.y - gridPoint.y) < AppContext.spacing/2
    );
    
    if (existing) {
        // Modifier masse existante
        console.log('Masse existante trouvée:', existing.type, 'masse:', existing.mass);
        const oldMass = existing.mass;
        
        if (isRightClick) {
            existing.mass = Math.max(0, existing.mass - 1000);
            if (existing.mass <= 0) {
                removeMass(existing);
            }
        } else {
            existing.mass += 1000;
        }
        
        // Créer un nouveau front de propagation si la masse a changé
        if (existing.mass !== oldMass) {
            const versionInfo = createNewVersion('modification', gridPoint.x, gridPoint.y, existing.mass - oldMass, AppContext.masses);
            
            // Mettre à jour immédiatement la version du point où la masse est modifiée
            updateGridPointVersion(gridPoint.x, gridPoint.y, versionInfo.version);
            
            // Créer le front de propagation
            AppContext.propagationFronts.push({
                x: versionInfo.x,
                y: versionInfo.y,
                startTime: Date.now(),
                spacing: AppContext.spacing,
                version: versionInfo.version,
                type: versionInfo.type,
                massChange: versionInfo.massChange
            });
            // Recalculer toutes les géodésiques quand une masse change
            AppContext.recalculateAllGeodesics();
        }
    } else if (!isRightClick) {
        // Créer nouvelle masse (seulement avec clic gauche)
        AppContext.masses.push({ x: gridPoint.x, y: gridPoint.y, mass: 1000 });
        const versionInfo = createNewVersion('creation', gridPoint.x, gridPoint.y, 0, AppContext.masses);
        
        // Mettre à jour immédiatement la version du point où la masse est créée
        updateGridPointVersion(gridPoint.x, gridPoint.y, versionInfo.version);
        
        // Créer le front de propagation
        AppContext.propagationFronts.push({
            x: versionInfo.x,
            y: versionInfo.y,
            startTime: Date.now(),
            spacing: AppContext.spacing,
            version: versionInfo.version,
            type: versionInfo.type,
            massChange: versionInfo.massChange
        });
        // Recalculer toutes les géodésiques quand une nouvelle masse est ajoutée
        AppContext.recalculateAllGeodesics();
    }
    
    AppContext.updateDebugInfo();
}

/**
 * Supprime une masse
 * @param {Object} mass - Masse à supprimer
 */
export function removeMass(mass) {
    const index = AppContext.masses.indexOf(mass);
    if (index > -1) {
        AppContext.masses.splice(index, 1);
        // Supprimer aussi le front de propagation correspondant
        const frontIndex = AppContext.propagationFronts.findIndex(f => f.x === mass.x && f.y === mass.y);
        if (frontIndex > -1) {
            AppContext.propagationFronts.splice(frontIndex, 1);
        }
        // Recalculer toutes les géodésiques quand une masse est supprimée
        AppContext.recalculateAllGeodesics();
    }
}

/**
 * Récupère le tableau des masses
 * @returns {Array} Tableau des masses
 */
export function getMasses() {
    return AppContext.masses;
}

/**
 * Récupère le tableau des fronts de propagation
 * @returns {Array} Tableau des fronts de propagation
 */
export function getPropagationFronts() {
    return AppContext.propagationFronts;
} 