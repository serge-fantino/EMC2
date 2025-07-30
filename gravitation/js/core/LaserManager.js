/**
 * Gestionnaire de lasers
 * Extrait du main.js pour améliorer la modularité
 */

import { c } from './PhysicsConstants.js';
import { calculateGravitationalRedshift, redshiftToColor } from './PhysicsUtils.js';
import { AppContext } from './AppContext.js';

/**
 * Initialise le gestionnaire de lasers
 * Plus besoin d'injection de dépendances, utilise AppContext
 */
export function initializeLaserManager() {
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
 * Ajoute un laser
 * @param {number} x - Coordonnée x
 * @param {number} y - Coordonnée y
 * @param {number} directionX - Direction X
 * @param {number} directionY - Direction Y
 */
export function addLaser(x, y, directionX, directionY) {
    const gridPoint = getGridPoint(x, y);
    
    // Normaliser la direction
    const distance = Math.sqrt(directionX * directionX + directionY * directionY);
    if (distance === 0) return;
    
    const normalizedDirX = directionX / distance;
    const normalizedDirY = directionY / distance;
    
    // Créer le laser avec vitesse constante c
    const laser = {
        x: gridPoint.x,
        y: gridPoint.y,
        vx: normalizedDirX * c, // Vitesse constante c
        vy: normalizedDirY * c,
        trail: [], // Historique des positions
        maxTrailLength: 300, // Traces plus courtes que les vaisseaux
        creationTime: Date.now()
    };
    
    // Ajouter le laser à la liste globale
    if (!AppContext.lasers) {
        AppContext.lasers = [];
    }
    AppContext.lasers.push(laser);
    AppContext.updateDebugInfo();
}

/**
 * Met à jour les lasers
 * @param {number} deltaTime - Temps écoulé depuis la dernière mise à jour
 */
export function updateLasers(deltaTime) {
    if (!AppContext.lasers) return;
    
    AppContext.lasers.forEach((laser, index) => {
        // Calculer la force gravitationnelle totale (seulement pour dévier la direction)
        let totalForceX = 0;
        let totalForceY = 0;
        
        // Utiliser les masses de la version actuelle du point où se trouve le laser
        const { gridX, gridY } = AppContext.getGridVersionIndex(laser.x, laser.y);
        const gridVersions = AppContext.getGridVersions();
        const pointVersion = gridVersions[gridX] && gridVersions[gridX][gridY] !== undefined 
            ? gridVersions[gridX][gridY] : 0;
        const versionMasses = AppContext.getMassesForVersion(pointVersion, AppContext.masses);
        
        versionMasses.forEach(mass => {
            const dx = mass.x - laser.x;
            const dy = mass.y - laser.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                // Force gravitationnelle (simplifiée pour les lasers)
                const force = mass.mass / (distance * distance);
                const forceX = (dx / distance) * force;
                const forceY = (dy / distance) * force;
                
                totalForceX += forceX;
                totalForceY += forceY;
            }
        });
        
        // Appliquer une légère déviation gravitationnelle (effet de lentille)
        const deviationFactor = 0.1; // Facteur de déviation
        laser.vx += totalForceX * deviationFactor * deltaTime * 0.001;
        laser.vy += totalForceY * deviationFactor * deltaTime * 0.001;
        
        // Normaliser la vitesse pour maintenir c
        const speed = Math.sqrt(laser.vx * laser.vx + laser.vy * laser.vy);
        if (speed > 0) {
            laser.vx = (laser.vx / speed) * c;
            laser.vy = (laser.vy / speed) * c;
        }
        
        // Mettre à jour la position
        laser.x += laser.vx * deltaTime * 0.001;
        laser.y += laser.vy * deltaTime * 0.001;
        
        // Ajouter à la trajectoire
        laser.trail.push({ x: laser.x, y: laser.y });
        if (laser.trail.length > laser.maxTrailLength) {
            laser.trail.shift();
        }
        
        // Vérifier les limites du canvas
        if (laser.x < 0 || laser.x > AppContext.canvas.width || 
            laser.y < 0 || laser.y > AppContext.canvas.height) {
            // Supprimer le laser s'il sort du canvas
            AppContext.lasers.splice(index, 1);
        }
    });
}

/**
 * Supprime un laser
 * @param {Object} laser - Laser à supprimer
 */
export function removeLaser(laser) {
    const index = AppContext.lasers.indexOf(laser);
    if (index > -1) {
        AppContext.lasers.splice(index, 1);
    }
}

/**
 * Récupère le tableau des lasers
 * @returns {Array} Tableau des lasers
 */
export function getLasers() {
    return AppContext.lasers;
}

/**
 * Supprime tous les lasers
 */
export function clearLasers() {
    if (AppContext.lasers) {
        AppContext.lasers.length = 0;
    }
}

/**
 * Calcule le redshift gravitationnel pour un laser
 * @param {Object} laser - Laser pour lequel calculer le redshift
 * @returns {number} Valeur du redshift
 */
export function calculateLaserRedshift(laser) {
    // Utiliser les masses de la version actuelle du point où se trouve le laser
    const { gridX, gridY } = AppContext.getGridVersionIndex(laser.x, laser.y);
    const gridVersions = AppContext.getGridVersions();
    const pointVersion = gridVersions[gridX] && gridVersions[gridX][gridY] !== undefined 
        ? gridVersions[gridX][gridY] : 0;
    const versionMasses = AppContext.getMassesForVersion(pointVersion, AppContext.masses);
    
    return calculateGravitationalRedshift(laser.x, laser.y, versionMasses);
}

/**
 * Obtient la couleur du laser basée sur le redshift
 * @param {Object} laser - Laser pour lequel obtenir la couleur
 * @returns {string} Couleur CSS
 */
export function getLaserColor(laser) {
    const redshift = calculateLaserRedshift(laser);
    return redshiftToColor(redshift);
} 