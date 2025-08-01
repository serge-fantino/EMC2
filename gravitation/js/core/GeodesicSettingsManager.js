/**
 * Gestionnaire des paramètres des géodésiques
 * Gère les événements du panel de debug et la synchronisation des paramètres
 */

import { AppContext } from './AppContext.js';
import { recalculateAllGeodesics, clearGeodesics } from './GeodesicManager.js';

/**
 * Initialise les gestionnaires d'événements pour les paramètres des géodésiques
 */
export function initializeGeodesicSettings() {
    // Mettre à jour les valeurs affichées
    function updateDisplayValue(id, value) {
        const element = document.getElementById(id + 'Value');
        if (element) {
            element.textContent = value;
        }
    }
    
    // Gestionnaires pour les sliders
    const settings = [
        'explorationStep', 'curveStep', 'maxSteps', 
        'minGradientThreshold', 'stopGradientThreshold', 
        'minPoints', 'minDistanceBetweenPoints', 'maxAngle', 
        'boundingBoxMultiplier', 'thicknessAmplification'
    ];
    
    settings.forEach(setting => {
        const element = document.getElementById(setting);
        if (element) {
            // Initialiser l'affichage avec les valeurs d'AppContext
            updateDisplayValue(setting, AppContext.geodesicSettings[setting]);
            
            // Ajouter l'écouteur d'événement
            element.addEventListener('input', (e) => {
                const newValue = parseFloat(e.target.value);
                AppContext.geodesicSettings[setting] = newValue;
                updateDisplayValue(setting, newValue);
                
                // Recalculer toutes les géodésiques si nécessaire
                if (['explorationStep', 'curveStep', 'maxSteps', 'minGradientThreshold', 'stopGradientThreshold', 'minPoints', 'minDistanceBetweenPoints', 'maxAngle', 'boundingBoxMultiplier'].includes(setting)) {
                    recalculateAllGeodesics();
                }
            });
        }
    });
    
    // Gestionnaire pour le toggle des infos de debug
    const debugToggle = document.getElementById('showGeodesicDebugToggle');
    if (debugToggle) {
        // Initialiser l'état du toggle avec la valeur d'AppContext
        debugToggle.checked = AppContext.showGeodesicDebug;
        
        debugToggle.addEventListener('change', (e) => {
            AppContext.showGeodesicDebug = e.target.checked;
        });
    }
    
    // Bouton de recalcul
    const recalcButton = document.getElementById('recalculateGeodesics');
    if (recalcButton) {
        recalcButton.addEventListener('click', () => {
            recalculateAllGeodesics();
            console.log('Toutes les géodésiques recalculées avec les nouveaux paramètres');
        });
    }
    
    // Bouton d'effacement
    const clearButton = document.getElementById('clearGeodesics');
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            clearGeodesics();
            console.log('Toutes les géodésiques effacées');
        });
    }
}

/**
 * Met à jour l'affichage des valeurs des paramètres
 */
export function updateGeodesicSettingsDisplay() {
    const settings = [
        'explorationStep', 'curveStep', 'maxSteps', 
        'minGradientThreshold', 'stopGradientThreshold', 
        'minPoints', 'minDistanceBetweenPoints', 'maxAngle', 
        'boundingBoxMultiplier', 'thicknessAmplification'
    ];
    
    settings.forEach(setting => {
        const element = document.getElementById(setting + 'Value');
        if (element) {
            element.textContent = AppContext.geodesicSettings[setting];
        }
    });
} 