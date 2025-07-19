/**
 * Module Interaction - Point d'entrée principal
 * @module interaction
 * 
 * Ce module gère toutes les interactions utilisateur :
 * - Événements souris et clavier
 * - Contrôles UI et boutons
 * - États d'interaction et drag & drop
 * - Gestion des événements DOM
 */

import * as Events from './events.js';
import * as Controls from './controls.js';
import * as State from './state.js';

// Variables globales à injecter
let coneOrigins = [];
let selectedReferenceFrame = 0;
let cartoucheOffsets = {};
let updateCalculationsDisplay = () => {};
let updateCommentsPanel = () => {};
let getCurrentPlacements = () => [];
let resolutionSettings = { resolution: 50 };
let config = { greenLimit: 0.8, showPastCone: true };

/**
 * Initialise le module Interaction complet
 * @param {Object} params - Paramètres d'initialisation
 */
export function initInteractionModule(params) {
    const {
        _coneOrigins,
        _selectedReferenceFrame,
        _cartoucheOffsets,
        _updateCalculationsDisplay,
        _updateCommentsPanel,
        _getCurrentPlacements,
        _resolutionSettings,
        _config,
        _setSelectedReferenceFrame
    } = params;
    
    // Injecter les variables globales
    coneOrigins = _coneOrigins;
    selectedReferenceFrame = _selectedReferenceFrame;
    cartoucheOffsets = _cartoucheOffsets;
    updateCalculationsDisplay = _updateCalculationsDisplay;
    updateCommentsPanel = _updateCommentsPanel;
    getCurrentPlacements = _getCurrentPlacements;
    resolutionSettings = _resolutionSettings;
    config = _config;
    
    // Initialiser les sous-modules
    Events.initEventsModule(coneOrigins, selectedReferenceFrame, cartoucheOffsets, updateCalculationsDisplay, _setSelectedReferenceFrame);
    Controls.initControlsModule(coneOrigins, selectedReferenceFrame, cartoucheOffsets, updateCalculationsDisplay, updateCommentsPanel);
    State.initStateModule();
    
    // Configurer les fonctions de callback
    Events.setGetCurrentPlacements(getCurrentPlacements);
    Controls.setResolutionSettings(resolutionSettings);
    Controls.setConfig(config);
    
    // Configurer tous les contrôles UI
    Controls.setupUIControls();
    
    console.log('✅ Module Interaction initialisé');
}

/**
 * Configure tous les event listeners du canvas
 * @param {HTMLCanvasElement} canvas - Élément canvas
 */
export function setupCanvasEventListeners(canvas) {
    if (!canvas) {
        console.error('Canvas not found for event listeners');
        return;
    }
    
    // Événements souris
    canvas.addEventListener('mousedown', Events.handleMouseDown);
    canvas.addEventListener('mousemove', Events.handleMouseMove);
    canvas.addEventListener('mouseup', Events.handleMouseUp);
    canvas.addEventListener('click', Events.handleCanvasClick);
    
    console.log('✅ Event listeners canvas configurés');
}

/**
 * Configure les event listeners globaux
 */
export function setupGlobalEventListeners() {
    // Redimensionnement de la fenêtre
    window.addEventListener('resize', () => {
        // Cette fonction sera injectée depuis main.js
        if (typeof window.resizeCanvas === 'function') {
            window.resizeCanvas();
        }
    });
    
    console.log('✅ Event listeners globaux configurés');
}

/**
 * Met à jour les références des modules
 * @param {Object} updates - Mises à jour des références
 */
export function updateModuleReferences(updates) {
    const {
        _coneOrigins,
        _selectedReferenceFrame,
        _cartoucheOffsets,
        _getCurrentPlacements
    } = updates;
    
    if (_coneOrigins !== undefined) coneOrigins = _coneOrigins;
    if (_selectedReferenceFrame !== undefined) selectedReferenceFrame = _selectedReferenceFrame;
    if (_cartoucheOffsets !== undefined) cartoucheOffsets = _cartoucheOffsets;
    if (_getCurrentPlacements !== undefined) getCurrentPlacements = _getCurrentPlacements;
    
    // Mettre à jour les sous-modules
    Events.initEventsModule(coneOrigins, selectedReferenceFrame, cartoucheOffsets, updateCalculationsDisplay);
    Controls.initControlsModule(coneOrigins, selectedReferenceFrame, cartoucheOffsets, updateCalculationsDisplay, updateCommentsPanel);
    Events.setGetCurrentPlacements(getCurrentPlacements);
}

/**
 * Obtient l'état de drag actuel
 * @returns {Object} État de drag
 */
export function getDragState() {
    return Events.getDragState();
}

/**
 * Obtient l'état de drag des cartouches
 * @returns {Object} État de drag des cartouches
 */
export function getCartoucheDragState() {
    return Events.getCartoucheDragState();
}

/**
 * Supprime le référentiel sélectionné
 */
export function deleteSelectedReferenceFrame() {
    Controls.deleteSelectedReferenceFrame();
}

/**
 * Lance la démonstration du paradoxe des jumeaux
 */
export function twinParadox() {
    Controls.twinParadox();
}

/**
 * Obtient le référentiel sélectionné
 * @returns {number} Index du référentiel sélectionné
 */
export function getSelectedReferenceFrame() {
    return State.getSelectedReferenceFrame();
}

/**
 * Met à jour le référentiel sélectionné
 * @param {number} referenceFrame - Index du référentiel
 */
export function updateSelectedReferenceFrame(referenceFrame) {
    State.updateSelectedReferenceFrame(referenceFrame);
}

/**
 * Vérifie si un drag est en cours
 * @returns {boolean} True si un drag est en cours
 */
export function isDragging() {
    return State.isDragging();
}

/**
 * Obtient l'état complet de l'application
 * @returns {Object} État complet
 */
export function getAppState() {
    return State.getAppState();
}

/**
 * Réinitialise l'état de l'application
 */
export function resetAppState() {
    State.resetAppState();
}

// Ré-exporter les fonctions des sous-modules pour compatibilité
export {
    // Events
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleCanvasClick,
    initEventsModule,
    setGetCurrentPlacements
} from './events.js';

export {
    // Controls
    setupCommentsPanel,
    setupUIControls,
    initControlsModule,
    setResolutionSettings,
    setConfig
} from './controls.js';

export {
    // State
    updateDragState,
    updateCartoucheDragState,
    updateHelpModalState,
    updateDetailsPanelState,
    updateCommentsEditorState,
    updateUnsavedChangesState,
    isHelpModalOpen,
    isDetailsPanelOpen,
    isCommentsEditorFocused,
    hasUnsavedChanges,
    initStateModule
} from './state.js';