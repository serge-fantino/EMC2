/**
 * Utilitaires physiques pour la simulation gravitationnelle
 * Extrait du main.js pour améliorer la modularité
 */

import { G, c, REDSHIFT_MIN, REDSHIFT_MAX } from './PhysicsConstants.js';

/**
 * Calcule l'horizon des événements d'un trou noir
 * @param {number} mass - Masse du trou noir
 * @returns {number} Rayon de Schwarzschild
 */
export function calculateEventHorizon(mass) {
    // R = 2GM/c² (rayon de Schwarzschild)
    return (2 * G * mass) / (c * c);
}

/**
 * Calcule le redshift gravitationnel en un point
 * @param {number} x - Coordonnée x
 * @param {number} y - Coordonnée y
 * @param {Array} masses - Tableau des masses gravitationnelles
 * @returns {number} Valeur du redshift (-2.0 à 2.0)
 */
export function calculateGravitationalRedshift(x, y, masses) {
    let totalPotential = 0;
    
    masses.forEach(mass => {
        const dx = mass.x - x;
        const dy = mass.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Potentiel gravitationnel Φ = -GM/r
            const potential = -(G * mass.mass) / distance;
            totalPotential += potential;
        }
    });
    
    // Redshift z = ΔΦ/c²
    // Amplification maximale pour visualisation spectaculaire
    const redshift = totalPotential / (c * c * 1); // Réduit de 10 à 1 (10x plus sensible)
    
    return Math.max(REDSHIFT_MIN, Math.min(REDSHIFT_MAX, redshift));
}

/**
 * Convertit une valeur de redshift en couleur RGB
 * @param {number} redshift - Valeur du redshift
 * @returns {string} Couleur CSS RGB
 */
export function redshiftToColor(redshift) {
    // redshift négatif = blueshift (plus bleu)
    // redshift positif = redshift (plus rouge)
    // redshift = 0 = vert (couleur de base)
    
    if (redshift < 0) {
        // Blueshift : vert → bleu → violet
        const intensity = Math.abs(redshift) / 2.0; // Normaliser à 0-1
        const r = 0;
        const g = Math.round(255 * (1 - intensity));
        const b = Math.round(255 * (0.5 + intensity * 0.5)); // Bleu plus intense
        return `rgb(${r}, ${g}, ${b})`;
    } else {
        // Redshift : vert → rouge → orange
        const intensity = redshift / 2.0; // Normaliser à 0-1
        const r = Math.round(255 * (0.5 + intensity * 0.5)); // Rouge plus intense
        const g = Math.round(255 * (1 - intensity));
        const b = 0;
        return `rgb(${r}, ${g}, ${b})`;
    }
}

/**
 * Normalise un vecteur 2D
 * @param {number} vx - Composante x du vecteur
 * @param {number} vy - Composante y du vecteur
 * @returns {Object} Vecteur normalisé {x, y}
 */
export function normalizeVector(vx, vy) {
    const length = Math.sqrt(vx * vx + vy * vy);
    if (length === 0) return { x: 0, y: 0 };
    return { x: vx / length, y: vy / length };
} 