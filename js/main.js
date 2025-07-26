// JavaScript principal extrait de cone-lumiere-colore.html
// Refactoring Phase 1 - Extraction JavaScript
// Refactoring Phase 3 - Modularisation avec modules Physics et Renderer

// === IMPORTS ===
import {
    // Constantes
    SPEED_OF_LIGHT,
    VELOCITY_EPSILON,
    MAX_VELOCITY,
    
    // Fonctions de calculs relativistes
    limitVelocity,
    calculateVelocityRatio,
    calculateCumulativePhysics,
    isReachableFromSource,
    
    // Fonctions de trajectoires
    calculateIsochronePoints,
    calculateAccelerationTrajectory,
    getContainingCone
} from './physics/index.js?v=4.0.17532862523N.5';

import {
    // Initialisation renderer
    initRenderer,
    animate,
    
    // Fonctions canvas
    getCanvas,
    getCtx,
    resizeCanvas,
    screenToSpacetime,
    spacetimeToScreen,
    resolutionSettings,
    
    // Fonctions couleurs
    updateGradientBar,
    
    // Fonctions de dessin
    getConeAtPosition,
    getCartoucheAtPosition,
    checkIsochroneHover,
    getCurrentPlacements
} from './renderer/index.js?v=4.0.17532862523N.6';

import {
    // Initialisation interaction
    initInteractionModule,
    setupCanvasEventListeners,
    setupGlobalEventListeners,
    updateModuleReferences,
    
    // Fonctions d'interaction
    deleteSelectedReferenceFrame,
    twinParadox,
    getSelectedReferenceFrame,
    updateSelectedReferenceFrame,
    isDragging,
    getAppState,
    resetAppState
} from './interaction/index.js?v=4.0.17532862523N.7';

import {
    // Gestionnaire panneau latéral
    initSidePanel,
    getSidePanelManager,
    openSection
} from './ui/sidepanel.js?v=4.0.17532862523N.8';

// Configuration
let config = {
    resolution: 2,
    greenLimit: 0.5,
    redLimit: 1.0, // Fixed at speed of light
    showPastCone: false
};

// Manual cartouche offsets (relative to ideal position)
let cartoucheOffsets = {};

// Array to store multiple cone origins with their source cone
let coneOrigins = [{ 
    x: 0, 
    y: 0, 
    t: 0, 
    sourceIndex: -1,
    cumulativeVelocity: 0,
    cumulativeProperTime: 0,
    totalCoordinateTime: 0
}]; // Start with origin at bottom

// Selected reference frame for detailed calculations
let selectedReferenceFrame = 0;

// Note: isochrone hover et resolution settings maintenant dans le module Renderer

// Note: Fonctions de rendu (updateGradientBar, getColorForVelocity, 
// screenToSpacetime, spacetimeToScreen, getConeAtPosition) maintenant dans module Renderer



// Note: getCartoucheAtPosition et applyCartoucheOffset maintenant dans module Renderer



// Note: Toutes les fonctions handleMouse* sont maintenant dans le module Interaction

// Note: Event listeners ajoutés dans init() après initialisation du renderer

// Note: isPathInSelectedTrajectory maintenant dans module Renderer

// Note: Toutes les fonctions de dessin (drawAccelerationPath, distanceToLineSegment,
// drawSelectedIsochrone, checkIsochroneHover, calculateBoxPlacements, 
// drawBoxConnection, drawOriginInfoBox, drawReferenceInfoBox, drawIsochroneTooltip,
// drawLightConeEnvelopes) sont maintenant dans le module Renderer

// Fonction pour obtenir les données de rendu pour le module Renderer
function getRenderData() {
    return {
        config,
        coneOrigins,
        selectedReferenceFrame,
        cartoucheOffsets
    };
}

// Callback pour mettre à jour le référentiel sélectionné
function setSelectedReferenceFrame(newIndex) {
    selectedReferenceFrame = newIndex;
}

// Update calculations display
function updateCalculationsDisplay() {
    // Chercher dans le nouveau panneau latéral d'abord
    let calculationsDiv = document.querySelector('.accordion-section[data-section="calculations"] .accordion-content');
    
    // Fallback vers l'ancien panneau si le nouveau n'existe pas encore
    if (!calculationsDiv) {
        calculationsDiv = document.querySelector('.calculations');
    }
    
    // Vérification robuste
    if (!calculationsDiv) {
        console.warn('⚠️ Calculations div not found, skipping update');
        return;
    }
    
    // Ouvrir automatiquement la section calculs quand on sélectionne un référentiel
    if (selectedReferenceFrame > 0 && getSidePanelManager()) {
        openSection('calculations');
    }
    
    if (selectedReferenceFrame >= coneOrigins.length) {
        selectedReferenceFrame = 0;
    }
    
    const cone = coneOrigins[selectedReferenceFrame];
    const physics = calculateCumulativePhysics(selectedReferenceFrame, coneOrigins);
    
    // Create title with delete button if not origin
    let titleContent = `<h4 style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
        <span>Calculs - Référentiel ${selectedReferenceFrame}</span>`;
    
    if (selectedReferenceFrame > 0) {
        titleContent += `
            <button class="delete-reference-btn" onclick="deleteSelectedReferenceFrame(); console.log('Inline onclick triggered');" style="
                background: #ff4444; 
                color: white; 
                border: none; 
                padding: 4px 8px; 
                border-radius: 3px; 
                cursor: pointer; 
                font-size: 10px;
                box-shadow: 0 0 3px rgba(255, 68, 68, 0.5);
                margin-left: 10px;
                pointer-events: auto;
                z-index: 1000;
                position: relative;
            ">🗑️</button>`;
    }
    
    titleContent += `</h4>`;
    
    let content = titleContent;
    
    try {
        if (selectedReferenceFrame === 0) {
        content += `
            <p><strong>Référentiel d'origine (repos)</strong></p>
            <div class="formula">v = 0 c</div>
            <div class="formula">a = 0 c²/t</div>
            <div class="formula">t_propre = t_coordonnée = 0</div>
            <p>Ce référentiel sert de base pour tous les calculs.</p>
        `;
    } else {
        const sourceCone = coneOrigins[cone.sourceIndex];
        const X = cone.x - sourceCone.x;
        const T = cone.t - sourceCone.t;
        const c = 1;
        
        content += `
            <p><strong>Segment depuis Réf ${cone.sourceIndex}</strong></p>
            
            <div class="formula">
                Déplacement spatial: <span class="variable">ΔX</span> = <span class="result">${X.toFixed(3)}</span>
            </div>
            <div class="formula">
                Temps coordonnée: <span class="variable">ΔT</span> = <span class="result">${T.toFixed(3)} t</span>
            </div>
            
            <p><strong>Accélération propre :</strong></p>
            <div class="formula">
                a = 2|ΔX|c² / (ΔT² - ΔX²)<br>
                a = <span class="result">${physics.segmentAcceleration.toFixed(4)} c²/t</span>
            </div>
            
            <p><strong>Vitesse finale du segment :</strong></p>
            <div class="formula">
                v = (aΔT) / √(1 + (aΔT/c)²)<br>
                v = <span class="result">${(Math.abs(physics.segmentVelocity) * 100).toFixed(1)}% c</span>
            </div>
            
            <p><strong>Temps propre du segment :</strong></p>
            <div class="formula">
                Δτ = (c/a) × asinh(aΔT/c)<br>
                Δτ = <span class="result">${physics.segmentProperTime.toFixed(3)} t</span>
            </div>
            
            <p><strong>Totaux cumulés :</strong></p>
            <div class="formula">
                Vitesse cumulée = <span class="result">${(Math.abs(physics.cumulativeVelocity) * 100).toFixed(1)}% c</span>
            </div>
            <div class="formula">
                Temps propre total = <span class="result">${physics.cumulativeProperTime.toFixed(3)} t</span>
            </div>
            <div class="formula">
                Temps coordonnée total = <span class="result">${physics.totalCoordinateTime.toFixed(3)} t</span>
            </div>
        `;
    }
    
    calculationsDiv.innerHTML = content;
    
    } catch (error) {
        console.error('❌ Error updating calculations display:', error);
    }
}

// Note: deleteSelectedReferenceFrame est maintenant dans le module Interaction

// Update comments panel
function updateCommentsPanel(title, content) {
    const editor = document.getElementById('commentsEditor');
    if (editor) {
        editor.innerHTML = `
            <h4 style="color: #4a9eff; margin: 0 0 10px 0; text-shadow: 0 0 5px rgba(74, 158, 255, 0.5);">${title}</h4>
            ${content}
        `;
    }
}

// Note: twinParadox est maintenant dans le module Interaction

// Note: setupCommentsPanel et updateToolbarStates sont maintenant dans le module Interaction

// Version de l'application (chargée dynamiquement depuis version.json)
let APP_VERSION = 'Loading...'; // Sera mise à jour par loadVersion()

// Initialize the application
function init() {
    // console.log('🚀 Initializing application with modular architecture...');
    
    // Charger la version en premier
    loadVersion().then(() => {
        // console.log('📱 App Version:', APP_VERSION);
        updateVersionDisplay();
    }).catch(error => {
        console.warn('❌ Failed to load version:', error);
        APP_VERSION = 'Unknown';
        updateVersionDisplay();
    });
    
    // Obtenir l'élément canvas
    const canvasElement = document.getElementById('canvas');
    if (!canvasElement) {
        console.error('Canvas element not found!');
        return;
    }
    
    // Initialiser le panneau latéral en premier
    try {
        initSidePanel();
        // console.log('✅ SidePanel initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize SidePanel:', error);
    }
    
    // Initialiser le module Renderer
    initRenderer(canvasElement);
    
    // Initialiser le module Interaction
    initInteractionModule({
        _coneOrigins: coneOrigins,
        _selectedReferenceFrame: selectedReferenceFrame,
        _cartoucheOffsets: cartoucheOffsets,
        _updateCalculationsDisplay: updateCalculationsDisplay,
        _updateCommentsPanel: updateCommentsPanel,
        _getCurrentPlacements: getCurrentPlacements,
        _resolutionSettings: resolutionSettings,
        _config: config,
        _setSelectedReferenceFrame: setSelectedReferenceFrame
    });
    
    // Configurer les event listeners du canvas
    setupCanvasEventListeners(canvasElement);
    
    // Configurer les event listeners globaux
    setupGlobalEventListeners();
    
    // Redimensionner le canvas à la taille de la fenêtre
    resizeCanvas();
    
    // Exposer resizeCanvas sur window pour les event listeners
    window.resizeCanvas = resizeCanvas;
    
    // Debug: vérifier que resizeCanvas fonctionne
    // console.log('🔧 window.resizeCanvas exposed:', typeof window.resizeCanvas);
    
    // Exposer la fonction de suppression de référentiel pour le bouton inline
    window.deleteSelectedReferenceFrame = deleteSelectedReferenceFrame;
    
    // Mettre à jour l'affichage initial après un court délai pour s'assurer que le DOM est prêt
    setTimeout(() => {
        updateCalculationsDisplay();
        updateGradientBar(config);
    }, 100);
    
    // console.log('✅ Application initialisée avec succès');
}

/**
 * Charge la version depuis version.json avec cache-busting
 */
async function loadVersion() {
    try {
        // Cache-busting avec timestamp
        const cacheBuster = Date.now();
        const response = await fetch(`version.json?t=${cacheBuster}`, {
            cache: 'no-cache',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const versionData = await response.json();
        APP_VERSION = versionData.version;
        
        // console.log('✅ Version loaded from version.json:', versionData);
        return versionData;
    } catch (error) {
        console.error('❌ Failed to load version.json:', error);
        throw error;
    }
}

/**
 * Met à jour l'affichage de la version dans le panneau À Propos
 */
function updateVersionDisplay() {
    const versionElement = document.getElementById('appVersion');
    const loadTimeElement = document.getElementById('loadTime');
    
    if (versionElement) {
        versionElement.textContent = APP_VERSION;
        
        // Ajouter une couleur différente selon l'état
        if (APP_VERSION === 'Loading...') {
            versionElement.style.color = '#ffaa00';
        } else if (APP_VERSION === 'Unknown') {
            versionElement.style.color = '#ff4444';
        } else {
            versionElement.style.color = '#00ff00';
        }
    }
    
    if (loadTimeElement) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('fr-FR', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        loadTimeElement.textContent = timeString;
    }
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Start animation loop when window is loaded
window.addEventListener('load', function() {
    // console.log('🎬 Starting animation loop...');
    animate(getRenderData);
}); 