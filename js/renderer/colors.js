/**
 * CALCULS DE COULEURS - Module Renderer  
 * Refactoring Phase 3 - Couleurs et gradients
 */

/**
 * Calcule la couleur pour une vitesse donnée selon le gradient dynamique
 * @param {number} v - Vitesse en fraction de c (0 à 1)
 * @param {Object} config - Configuration avec greenLimit et redLimit
 * @returns {{r: number, g: number, b: number, alpha: number}} Couleur RGBA
 */
export function getColorForVelocity(v, config = { greenLimit: 0.5, redLimit: 1.0 }) {
    // v va de 0 à 1 (où 1 = c)
    // Gradient dynamique : Bleu (0) → Vert (greenLimit) → Rouge (redLimit) → Transparent (≥c)
    
    if (v >= 1) {
        // Transparent pour v ≥ c (causalement déconnecté)
        return { r: 0, g: 0, b: 0, alpha: 0 };
    }
    
    if (v < config.greenLimit) {
        // Bleu vers Vert (0 à greenLimit)
        const t = v / config.greenLimit; // 0 à 1
        const r = 0;
        const g = Math.floor(255 * t);
        const b = Math.floor(255 * (1 - t));
        return { r, g, b, alpha: 255 };
    } else if (v < config.redLimit) {
        // Vert vers Rouge (greenLimit à redLimit)
        const t = (v - config.greenLimit) / (config.redLimit - config.greenLimit); // 0 à 1
        const r = Math.floor(255 * t);
        const g = Math.floor(255 * (1 - t));
        const b = 0;
        return { r, g, b, alpha: 255 };
    } else {
        // Rouge vers Transparent (redLimit à c)
        const t = (v - config.redLimit) / (1 - config.redLimit); // 0 à 1
        const r = Math.floor(255 * (1 - t));
        const g = 0;
        const b = 0;
        const alpha = Math.floor(255 * (1 - t)); // Fondu vers transparent
        return { r, g, b, alpha };
    }
}

/**
 * Met à jour la barre de gradient dynamiquement selon la configuration
 * @param {Object} config - Configuration avec greenLimit et redLimit
 */
export function updateGradientBar(config) {
    const gradientBar = document.getElementById('gradientBar');
    if (!gradientBar) return;
    
    const greenPercent = config.greenLimit * 100;
    const redPercent = config.redLimit * 100; // Toujours 100% maintenant
    
    gradientBar.style.background = `linear-gradient(to right, 
        #0000ff 0%, 
        #00ff00 ${greenPercent}%, 
        #ff0000 ${redPercent}%, 
        #000000 100%)`;
    
    // Met à jour les labels
    const greenLabel = document.getElementById('greenLabel');
    if (greenLabel) {
        greenLabel.textContent = `${config.greenLimit.toFixed(2)}c`;
    }
    // Le label rouge est fixé à 1.0c
}

/**
 * Calcule une modulation de couleur selon le cône sélectionné
 * @param {number} coneIndex - Index du cône
 * @param {number} selectedReferenceFrame - Référentiel sélectionné
 * @returns {number} Facteur de modulation (0.8 à 1.2)
 */
export function getConeColorModulation(coneIndex, selectedReferenceFrame) {
    if (coneIndex === selectedReferenceFrame) {
        return 1.2; // Plus lumineux pour le cône sélectionné
    } else if (coneIndex === 0) {
        return 1.0; // Normal pour l'origine
    } else {
        return 0.8; // Plus sombre pour les autres cônes
    }
}

/**
 * Effectue un mélange alpha entre deux couleurs
 * @param {Object} newColor - Nouvelle couleur {r, g, b, alpha}
 * @param {Object} existingColor - Couleur existante {r, g, b, alpha}
 * @param {number} modulation - Facteur de modulation pour la nouvelle couleur
 * @returns {{r: number, g: number, b: number, alpha: number}} Couleur mélangée
 */
export function blendColors(newColor, existingColor, modulation = 1.0) {
    const newAlpha = (newColor.alpha / 255) * modulation;
    const existingAlpha = existingColor.alpha / 255;
    const blendAlpha = newAlpha + existingAlpha * (1 - newAlpha);
    
    if (blendAlpha === 0) {
        return { r: 0, g: 0, b: 0, alpha: 0 };
    }
    
    // Calcul des poids pour le mélange
    const newWeight = newAlpha / blendAlpha;
    const existingWeight = (existingAlpha * (1 - newAlpha)) / blendAlpha;
    
    return {
        r: Math.floor(newColor.r * modulation * newWeight + existingColor.r * existingWeight),
        g: Math.floor(newColor.g * modulation * newWeight + existingColor.g * existingWeight),
        b: Math.floor(newColor.b * modulation * newWeight + existingColor.b * existingWeight),
        alpha: Math.floor(blendAlpha * 255)
    };
}

/**
 * Convertit une couleur RGBA en string CSS
 * @param {{r: number, g: number, b: number, alpha: number}} color - Couleur RGBA
 * @returns {string} Chaîne CSS rgba()
 */
export function colorToCSS(color) {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.alpha / 255})`;
}

/**
 * Crée une couleur solide avec alpha
 * @param {number} r - Rouge (0-255)
 * @param {number} g - Vert (0-255)  
 * @param {number} b - Bleu (0-255)
 * @param {number} alpha - Alpha (0-255)
 * @returns {{r: number, g: number, b: number, alpha: number}} Couleur RGBA
 */
export function createColor(r, g, b, alpha = 255) {
    return { 
        r: Math.floor(Math.max(0, Math.min(255, r))), 
        g: Math.floor(Math.max(0, Math.min(255, g))), 
        b: Math.floor(Math.max(0, Math.min(255, b))), 
        alpha: Math.floor(Math.max(0, Math.min(255, alpha))) 
    };
}

/**
 * Couleurs prédéfinies pour les éléments UI
 */
export const UI_COLORS = {
    ORIGIN: '#4a9eff',
    REFERENCE: '#ff9f4a', 
    WHITE: 'white',
    LIGHT_WHITE: 'rgba(255, 255, 255, 0.3)',
    AXES: 'rgba(255, 255, 255, 0.3)',
    ISOCHRONE: 'rgba(255, 165, 0, 0.8)',
    PATH_SELECTED: 'rgba(255, 255, 255, 1.0)',
    PATH_NORMAL: 'rgba(255, 255, 255, 0.8)',
    BOX_BACKGROUND: 'rgba(0, 0, 0, 0.85)',
    BOX_BORDER_ORIGIN: 'rgba(74, 158, 255, 0.8)',
    BOX_BORDER_REFERENCE: 'rgba(255, 159, 74, 0.8)',
    CONNECTION_LINE: 'rgba(255, 255, 255, 0.3)'
}; 