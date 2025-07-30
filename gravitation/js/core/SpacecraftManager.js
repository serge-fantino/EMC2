/**
 * Gestionnaire de vaisseaux spatiaux
 * Extrait du main.js pour améliorer la modularité
 */

import { normalizeVector, calculateEventHorizon } from './PhysicsUtils.js';
import { AppContext } from './AppContext.js';

/**
 * Initialise le gestionnaire de vaisseaux spatiaux
 * Plus besoin d'injection de dépendances, utilise AppContext
 */
export function initializeSpacecraftManager() {
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
 * Ajoute un vaisseau spatial
 * @param {number} x - Coordonnée x
 * @param {number} y - Coordonnée y
 * @param {number} directionX - Direction X
 * @param {number} directionY - Direction Y
 */
export function addSpacecraft(x, y, directionX, directionY) {
    const gridPoint = getGridPoint(x, y);
    
    // Calculer la vitesse basée sur la distance (comme dans la prévisualisation)
    const distance = Math.sqrt(directionX * directionX + directionY * directionY);
    if (distance === 0) return;
    
    // Normaliser la direction
    const normalizedDirX = directionX / distance;
    const normalizedDirY = directionY / distance;
    
    // Calculer la vitesse initiale (même logique que la prévisualisation)
    const initialSpeed = Math.min(distance * 0.5, AppContext.maxSpeed);
    
    // Créer le vaisseau
    const spacecraft = {
        x: gridPoint.x,
        y: gridPoint.y,
        vx: normalizedDirX * initialSpeed,
        vy: normalizedDirY * initialSpeed,
        trail: [], // Historique des positions
        maxTrailLength: 500, // Traces plus longues pour mieux voir les trajectoires
        mass: 1.0, // Masse du vaisseau pour les calculs gravitationnels
        creationTime: Date.now()
    };
    
    AppContext.spacecrafts.push(spacecraft);
    AppContext.updateDebugInfo();
}

/**
 * Met à jour les vaisseaux spatiaux
 * @param {number} deltaTime - Temps écoulé depuis la dernière mise à jour
 */
export function updateSpacecrafts(deltaTime) {
    AppContext.spacecrafts.forEach(spacecraft => {
        // Calculer la force gravitationnelle totale
        let totalForceX = 0;
        let totalForceY = 0;
        let closestBlackHole = null;
        let minDistance = Infinity;
        
        // Utiliser les masses de la version actuelle du point où se trouve le vaisseau
        const { gridX, gridY } = AppContext.getGridVersionIndex(spacecraft.x, spacecraft.y);
        const gridVersions = AppContext.getGridVersions();
        const pointVersion = gridVersions[gridX] && gridVersions[gridX][gridY] !== undefined 
            ? gridVersions[gridX][gridY] : 0;
        const versionMasses = AppContext.getMassesForVersion(pointVersion, AppContext.masses);
        
        versionMasses.forEach(mass => {
            const dx = mass.x - spacecraft.x;
            const dy = mass.y - spacecraft.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const force = (mass.mass * spacecraft.mass) / (distance * distance);
                const forceX = (dx / distance) * force;
                const forceY = (dy / distance) * force;
                
                totalForceX += forceX;
                totalForceY += forceY;
                
                // Vérifier si c'est un trou noir et le plus proche
                if (mass.type === 'blackhole' && distance < minDistance) {
                    closestBlackHole = mass;
                    minDistance = distance;
                }
            }
        });
        
        // Vérifier la capture par trou noir (horizon des événements)
        if (closestBlackHole) {
            const eventHorizonRadius = calculateEventHorizon(closestBlackHole.mass);
            const currentSpeed = Math.sqrt(spacecraft.vx * spacecraft.vx + spacecraft.vy * spacecraft.vy);
            
            // Si le vaisseau traverse l'horizon des événements, il est capturé
            if (minDistance <= eventHorizonRadius) {
                console.log(`Vaisseau capturé par trou noir: distance=${minDistance.toFixed(1)}, horizon=${eventHorizonRadius.toFixed(1)}`);
                // Le vaisseau est capturé par le trou noir
                const index = spacecrafts.indexOf(spacecraft);
                if (index > -1) {
                    spacecrafts.splice(index, 1);
                }
                return; // Ne pas continuer la mise à jour
            }
        }
        
        // Appliquer la force (F = ma, donc a = F/m)
        const accelerationX = totalForceX / spacecraft.mass;
        const accelerationY = totalForceY / spacecraft.mass;
        
        // Mettre à jour la vitesse (v = v0 + at)
        spacecraft.vx += accelerationX * deltaTime * 0.001; // Convertir en secondes
        spacecraft.vy += accelerationY * deltaTime * 0.001;
        
        // Limiter la vitesse maximale (effet relativiste)
        const currentSpeed = Math.sqrt(spacecraft.vx * spacecraft.vx + spacecraft.vy * spacecraft.vy);
        
        if (currentSpeed > AppContext.maxSpeed) {
            const scale = AppContext.maxSpeed / currentSpeed;
            spacecraft.vx *= scale;
            spacecraft.vy *= scale;
        }
        
        // Mettre à jour la position (x = x0 + vt)
        spacecraft.x += spacecraft.vx * deltaTime * 0.001;
        spacecraft.y += spacecraft.vy * deltaTime * 0.001;
        
        // Ajouter à la trajectoire
        spacecraft.trail.push({ x: spacecraft.x, y: spacecraft.y });
        if (spacecraft.trail.length > spacecraft.maxTrailLength) {
            spacecraft.trail.shift();
        }
        
        // Vérifier les limites du canvas
        if (spacecraft.x < 0 || spacecraft.x > AppContext.canvas.width || 
            spacecraft.y < 0 || spacecraft.y > AppContext.canvas.height) {
            // Supprimer le vaisseau s'il sort du canvas
            const index = AppContext.spacecrafts.indexOf(spacecraft);
            if (index > -1) {
                AppContext.spacecrafts.splice(index, 1);
            }
        }
    });
}

/**
 * Supprime un vaisseau spatial
 * @param {Object} spacecraft - Vaisseau spatial à supprimer
 */
export function removeSpacecraft(spacecraft) {
    const index = AppContext.spacecrafts.indexOf(spacecraft);
    if (index > -1) {
        AppContext.spacecrafts.splice(index, 1);
    }
}

/**
 * Récupère le tableau des vaisseaux spatiaux
 * @returns {Array} Tableau des vaisseaux spatiaux
 */
export function getSpacecrafts() {
    return AppContext.spacecrafts;
}

/**
 * Supprime tous les vaisseaux spatiaux
 */
export function clearSpacecrafts() {
    AppContext.spacecrafts.length = 0;
} 