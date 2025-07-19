/**
 * Module Interaction - Gestion des états d'interaction
 * @module interaction/state
 */

// États globaux de l'application
let appState = {
    // États de drag & drop
    dragState: {
        isDragging: false,
        draggedConeIndex: -1,
        startX: 0,
        startY: 0,
        isNewCone: false,
        hasActuallyDragged: false
    },
    
    cartoucheDragState: {
        isDragging: false,
        draggedConeIndex: -1,
        startX: 0,
        startY: 0,
        offsetX: 0,
        offsetY: 0
    },
    
    // États de sélection
    selectedReferenceFrame: 0,
    
    // États d'interface
    isHelpModalOpen: false,
    isDetailsPanelOpen: true,
    
    // États de l'éditeur
    isCommentsEditorFocused: false,
    hasUnsavedChanges: false
};

/**
 * Initialise le module d'état
 */
export function initStateModule() {
    // Charger l'état depuis localStorage si disponible
    loadStateFromStorage();
}

/**
 * Obtient l'état complet de l'application
 * @returns {Object} État complet
 */
export function getAppState() {
    return { ...appState };
}

/**
 * Met à jour l'état de drag
 * @param {Object} newDragState - Nouvel état de drag
 */
export function updateDragState(newDragState) {
    appState.dragState = { ...appState.dragState, ...newDragState };
}

/**
 * Met à jour l'état de drag des cartouches
 * @param {Object} newCartoucheDragState - Nouvel état de drag des cartouches
 */
export function updateCartoucheDragState(newCartoucheDragState) {
    appState.cartoucheDragState = { ...appState.cartoucheDragState, ...newCartoucheDragState };
}

/**
 * Met à jour le référentiel sélectionné
 * @param {number} referenceFrame - Index du référentiel
 */
export function updateSelectedReferenceFrame(referenceFrame) {
    appState.selectedReferenceFrame = referenceFrame;
    saveStateToStorage();
}

/**
 * Obtient le référentiel sélectionné
 * @returns {number} Index du référentiel sélectionné
 */
export function getSelectedReferenceFrame() {
    return appState.selectedReferenceFrame;
}

/**
 * Met à jour l'état de la modale d'aide
 * @param {boolean} isOpen - Si la modale est ouverte
 */
export function updateHelpModalState(isOpen) {
    appState.isHelpModalOpen = isOpen;
}

/**
 * Met à jour l'état du panneau de détails
 * @param {boolean} isOpen - Si le panneau est ouvert
 */
export function updateDetailsPanelState(isOpen) {
    appState.isDetailsPanelOpen = isOpen;
    saveStateToStorage();
}

/**
 * Met à jour l'état de l'éditeur de commentaires
 * @param {boolean} isFocused - Si l'éditeur est focalisé
 */
export function updateCommentsEditorState(isFocused) {
    appState.isCommentsEditorFocused = isFocused;
}

/**
 * Met à jour l'état des changements non sauvegardés
 * @param {boolean} hasChanges - S'il y a des changements non sauvegardés
 */
export function updateUnsavedChangesState(hasChanges) {
    appState.hasUnsavedChanges = hasChanges;
}

/**
 * Sauvegarde l'état dans localStorage
 */
function saveStateToStorage() {
    try {
        const stateToSave = {
            selectedReferenceFrame: appState.selectedReferenceFrame,
            isDetailsPanelOpen: appState.isDetailsPanelOpen
        };
        localStorage.setItem('lightConeAppState', JSON.stringify(stateToSave));
    } catch (error) {
        console.warn('Failed to save app state to localStorage:', error);
    }
}

/**
 * Charge l'état depuis localStorage
 */
function loadStateFromStorage() {
    try {
        const savedState = localStorage.getItem('lightConeAppState');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            appState.selectedReferenceFrame = parsedState.selectedReferenceFrame || 0;
            appState.isDetailsPanelOpen = parsedState.isDetailsPanelOpen !== false; // true par défaut
        }
    } catch (error) {
        console.warn('Failed to load app state from localStorage:', error);
    }
}

/**
 * Réinitialise l'état de l'application
 */
export function resetAppState() {
    appState = {
        dragState: {
            isDragging: false,
            draggedConeIndex: -1,
            startX: 0,
            startY: 0,
            isNewCone: false,
            hasActuallyDragged: false
        },
        cartoucheDragState: {
            isDragging: false,
            draggedConeIndex: -1,
            startX: 0,
            startY: 0,
            offsetX: 0,
            offsetY: 0
        },
        selectedReferenceFrame: 0,
        isHelpModalOpen: false,
        isDetailsPanelOpen: true,
        isCommentsEditorFocused: false,
        hasUnsavedChanges: false
    };
    
    saveStateToStorage();
}

/**
 * Obtient l'état de drag actuel
 * @returns {Object} État de drag
 */
export function getDragState() {
    return { ...appState.dragState };
}

/**
 * Obtient l'état de drag des cartouches
 * @returns {Object} État de drag des cartouches
 */
export function getCartoucheDragState() {
    return { ...appState.cartoucheDragState };
}

/**
 * Vérifie si un drag est en cours
 * @returns {boolean} True si un drag est en cours
 */
export function isDragging() {
    return appState.dragState.isDragging || appState.cartoucheDragState.isDragging;
}

/**
 * Vérifie si la modale d'aide est ouverte
 * @returns {boolean} True si la modale est ouverte
 */
export function isHelpModalOpen() {
    return appState.isHelpModalOpen;
}

/**
 * Vérifie si le panneau de détails est ouvert
 * @returns {boolean} True si le panneau est ouvert
 */
export function isDetailsPanelOpen() {
    return appState.isDetailsPanelOpen;
}

/**
 * Vérifie si l'éditeur de commentaires est focalisé
 * @returns {boolean} True si l'éditeur est focalisé
 */
export function isCommentsEditorFocused() {
    return appState.isCommentsEditorFocused;
}

/**
 * Vérifie s'il y a des changements non sauvegardés
 * @returns {boolean} True s'il y a des changements
 */
export function hasUnsavedChanges() {
    return appState.hasUnsavedChanges;
} 