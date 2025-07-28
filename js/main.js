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
async function updateCalculationsDisplay() {
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
            <div class="formula">φ = 0</div>
            <div class="formula">τ = t = 0</div>
            <div class="formula">E_kin = 0</div>
            <p>Ce référentiel sert de base pour tous les calculs.</p>
        `;
    } else {
        const sourceCone = coneOrigins[cone.sourceIndex];
        const X = cone.x - sourceCone.x;
        const T = cone.t - sourceCone.t;
        const c = 1;
        
        // Récupérer la physique du cône source pour calculer Vdépart
        const { calculateCumulativePhysics } = await import('./physics/index.js');
        const sourcePhysics = calculateCumulativePhysics(cone.sourceIndex, coneOrigins);
        
        // Récupérer les données du nouveau système via le bridge
        let rendezvousData = null;
        try {
            const { getRendezvousInfo } = await import('./physics/index.js');
            // Simuler l'appel pour obtenir les données de rendez-vous
            // (en réalité, ces données sont déjà calculées dans drawAccelerationPath)
            rendezvousData = {
                alpha: physics.segmentAcceleration,
                tau_f: physics.segmentProperTime,
                v_f: Math.abs(physics.segmentVelocity),
                deltaPhi: Math.abs(physics.segmentVelocity) > 0.001 ? Math.atanh(Math.abs(physics.segmentVelocity)) : 0,
                energyConsumed: Math.abs(physics.segmentVelocity) > 0.001 ? Math.atanh(Math.abs(physics.segmentVelocity)) : 0
            };
        } catch (error) {
            console.warn('Impossible de récupérer les données de rendez-vous:', error);
        }
        
        // Calculer les vitesses de départ et d'arrivée
        const vDepart = cone.sourceIndex === 0 ? 0 : Math.abs(sourcePhysics.cumulativeVelocity);
        const vArrivee = Math.abs(physics.cumulativeVelocity);
        
        content += `
            <p><strong>🚀 Résolution du problème de rendez-vous</strong></p>
            <div class="formula">
                <strong>Paramètres d'entrée :</strong><br>
                <strong>Départ (Réf ${cone.sourceIndex}) :</strong><br>
                x(${cone.sourceIndex}) = ${sourceCone.x.toFixed(3)}, t(${cone.sourceIndex}) = ${sourceCone.t.toFixed(3)}<br>
                v(${cone.sourceIndex}) = ${(vDepart * 100).toFixed(1)}% c<br>
                <strong>Arrivée (Réf ${selectedReferenceFrame}) :</strong><br>
                x(${selectedReferenceFrame}) = ${cone.x.toFixed(3)}, t(${selectedReferenceFrame}) = ${cone.t.toFixed(3)}<br>
                v(${selectedReferenceFrame}) = ${(vArrivee * 100).toFixed(1)}% c
            </div>
            
            <div class="formula">
                <strong>Calculs intermédiaires :</strong><br>
                Δx = ${X.toFixed(3)} années-lumière<br>
                Δt = ${T.toFixed(3)} ans<br>
                β = Δx/Δt = ${(X/T).toFixed(3)}c
            </div>
            
            ${rendezvousData ? `
            <div class="formula">
                <strong>Solution du rendez-vous :</strong><br>
                α = ${rendezvousData.alpha.toFixed(4)} c/an<br>
                τ_f = ${rendezvousData.tau_f.toFixed(3)} ans<br>
                v_f = ${(rendezvousData.v_f * 100).toFixed(1)}% c<br>
                Δφ = ${rendezvousData.deltaPhi.toFixed(3)}
            </div>
            ` : ''}
            
            <p><strong>⏱️ Comparaison des temps</strong></p>
            <div class="formula">
                <strong>Temps coordonnée :</strong> Δt = ${T.toFixed(3)} ans<br>
                <strong>Temps propre :</strong> Δτ = ${physics.segmentProperTime.toFixed(3)} ans<br>
                <strong>Dilatation temporelle :</strong> Δt/Δτ = ${(T/physics.segmentProperTime).toFixed(3)}
            </div>
            
            <p><strong>⚡ Estimation énergétique</strong></p>
            <div class="formula">
                <strong>Énergie cinétique finale :</strong><br>
                E_kin = m₀c²(γ - 1) = ${(Math.cosh(Math.atanh(Math.abs(physics.segmentVelocity))) - 1).toFixed(3)} m₀c² = ${((Math.cosh(Math.atanh(Math.abs(physics.segmentVelocity))) - 1) * 25000).toFixed(0)} GWh/tonne
            </div>
            ${rendezvousData ? `
            <div class="formula">
                <strong>Énergie de propulsion :</strong><br>
                E_propulsion = m₀c²Δφ = ${(rendezvousData.energyConsumed * 25000).toFixed(0)} GWh/tonne
            </div>
            ` : ''}
            
            <p><strong>📊 Calculs cumulatifs depuis R₀</strong></p>
            <div class="formula">
                <strong>Trajectoire complète :</strong><br>
                Nombre de segments : ${selectedReferenceFrame}<br>
                Vitesse finale : ${(Math.abs(physics.cumulativeVelocity) * 100).toFixed(1)}% c
            </div>
            
            <div class="formula">
                <strong>Comparaison temporelle globale :</strong><br>
                Temps coordonnée total : ${physics.totalCoordinateTime.toFixed(3)} ans<br>
                Temps propre total : ${physics.cumulativeProperTime.toFixed(3)} ans<br>
                <strong>Dilatation temporelle globale :</strong> ${(physics.totalCoordinateTime/physics.cumulativeProperTime).toFixed(3)}
            </div>
            
            <div class="formula">
                <strong>Énergie transformée (par unité de masse) :</strong><br>
                Énergie cinétique finale : ${(Math.cosh(Math.atanh(Math.abs(physics.cumulativeVelocity))) - 1).toFixed(3)} m₀c² = ${((Math.cosh(Math.atanh(Math.abs(physics.cumulativeVelocity))) - 1) * 25000).toFixed(0)} GWh/tonne<br>
                Énergie de propulsion totale : ${(Math.atanh(Math.abs(physics.cumulativeVelocity)) * 25000).toFixed(0)} GWh/tonne
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