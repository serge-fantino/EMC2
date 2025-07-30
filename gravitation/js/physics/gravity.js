/**
 * Module de physique gravitationnelle
 * Contient tous les calculs liés à la gravité, trous noirs, redshift, etc.
 */

// Constantes physiques
export const G = 1.0; // Constante gravitationnelle (normalisée)
export const c = 50; // Vitesse de la lumière (maxSpeed)

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
 * Calcule le redshift gravitationnel à un point donné
 * @param {number} x - Position X
 * @param {number} y - Position Y
 * @param {Array} masses - Liste des masses
 * @returns {number} Valeur du redshift
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
    
    return Math.max(-2.0, Math.min(2.0, redshift)); // Limiter entre -2.0 et 2.0
}

/**
 * Convertit un redshift en couleur
 * @param {number} redshift - Valeur du redshift
 * @returns {string} Couleur RGB
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
 * Calcule le gradient gravitationnel à un point donné
 * @param {number} x - Position X
 * @param {number} y - Position Y
 * @param {Array} masses - Liste des masses
 * @returns {Object} Gradient {x, y, magnitude}
 */
export function calculateGravitationalGradient(x, y, masses) {
    let gradientX = 0;
    let gradientY = 0;
    
    masses.forEach(mass => {
        const dx = mass.x - x;
        const dy = mass.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Force gravitationnelle F = GM/r²
            const force = (G * mass.mass) / (distance * distance);
            gradientX += (dx / distance) * force;
            gradientY += (dy / distance) * force;
        }
    });
    
    const magnitude = Math.sqrt(gradientX * gradientX + gradientY * gradientY);
    
    return {
        x: gradientX,
        y: gradientY,
        magnitude: magnitude
    };
}

/**
 * Normalise un vecteur
 * @param {number} vx - Composante X
 * @param {number} vy - Composante Y
 * @returns {Object} Vecteur normalisé {x, y}
 */
export function normalizeVector(vx, vy) {
    const magnitude = Math.sqrt(vx * vx + vy * vy);
    if (magnitude === 0) return { x: 0, y: 0 };
    return {
        x: vx / magnitude,
        y: vy / magnitude
    };
}

/**
 * Calcule la dilatation temporelle gravitationnelle
 * @param {number} x - Position X
 * @param {number} y - Position Y
 * @param {Array} masses - Liste des masses
 * @returns {number} Facteur de dilatation temporelle
 */
export function calculateGravitationalTimeDilation(x, y, masses) {
    // Calculer le potentiel gravitationnel Φ = -GM/r
    let potential = 0;
    masses.forEach(mass => {
        const dx = mass.x - x;
        const dy = mass.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
            potential -= G * mass.mass / distance;
        }
    });
    
    // Dilatation temporelle : dt = dt₀ * √(1 + 2Φ/c²)
    // Pour de faibles potentiels : dt ≈ dt₀ * (1 + Φ/c²)
    const timeDilationFactor = 1 + potential / (c * c);
    
    return Math.max(0.1, timeDilationFactor); // Éviter les valeurs négatives
}

/**
 * Calcule la métrique de Schwarzschild (simplifiée)
 * @param {number} x - Position X
 * @param {number} y - Position Y
 * @param {Array} masses - Liste des masses
 * @returns {Object} Métrique {g00, g11, g22}
 */
export function calculateSchwarzschildMetric(x, y, masses) {
    let totalPotential = 0;
    
    masses.forEach(mass => {
        const dx = mass.x - x;
        const dy = mass.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const potential = -(G * mass.mass) / distance;
            totalPotential += potential;
        }
    });
    
    // Métrique de Schwarzschild en coordonnées isotropes
    const phi = totalPotential / (c * c);
    const g00 = -(1 + 2 * phi);
    const g11 = 1 - 2 * phi;
    const g22 = 1 - 2 * phi;
    
    return { g00, g11, g22 };
}

/**
 * Calcule les symboles de Christoffel (simplifiés)
 * @param {number} x - Position X
 * @param {number} y - Position Y
 * @param {Array} masses - Liste des masses
 * @returns {Object} Symboles de Christoffel
 */
export function calculateChristoffelSymbols(x, y, masses) {
    // Calcul simplifié des symboles de Christoffel
    // Pour une métrique diagonale en 2D
    const metric = calculateSchwarzschildMetric(x, y, masses);
    
    // Symboles de Christoffel de première espèce
    const gamma001 = 0.5 * (metric.g00 - metric.g11);
    const gamma002 = 0.5 * (metric.g00 - metric.g22);
    const gamma112 = 0.5 * (metric.g11 - metric.g22);
    
    return {
        gamma001,
        gamma002,
        gamma112
    };
} 