/**
 * Module Interaction - Gestion des événements souris et clavier
 * @module interaction/events
 */

import { getCanvas, getCtx, screenToSpacetime } from '../renderer/canvas.js';
import { getConeAtPosition, getCartoucheAtPosition, checkIsochroneHover } from '../renderer/drawing.js';
import { getContainingCone } from '../physics/trajectory.js';
import { isReachableFromSource } from '../physics/relativity.js';
import { addConeAndDocument } from './controls.js';

// États de drag & drop
let dragState = {
    isDragging: false,
    draggedConeIndex: -1,
    startX: 0,
    startY: 0,
    isNewCone: false,
    hasActuallyDragged: false
};

let cartoucheDragState = {
    isDragging: false,
    draggedConeIndex: -1,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0
};

// Variables globales à injecter
let coneOrigins = [];
let selectedReferenceFrame = 0;
let cartoucheOffsets = {};
let updateCalculationsDisplay = () => {};
let updateSelectedReferenceFrame = () => {};

/**
 * Initialise le module d'événements
 * @param {Array} _coneOrigins - Origines des cônes
 * @param {number} _selectedReferenceFrame - Référentiel sélectionné
 * @param {Object} _cartoucheOffsets - Offsets des cartouches
 * @param {Function} _updateCalculationsDisplay - Fonction de mise à jour
 * @param {Function} _updateSelectedReferenceFrame - Callback pour mettre à jour le référentiel sélectionné
 */
export function initEventsModule(_coneOrigins, _selectedReferenceFrame, _cartoucheOffsets, _updateCalculationsDisplay, _updateSelectedReferenceFrame) {
    coneOrigins = _coneOrigins;
    selectedReferenceFrame = _selectedReferenceFrame;
    cartoucheOffsets = _cartoucheOffsets;
    updateCalculationsDisplay = _updateCalculationsDisplay;
    updateSelectedReferenceFrame = _updateSelectedReferenceFrame || (() => {});
}

/**
 * Convertit les coordonnées de souris en coordonnées relatives au canvas
 * @param {MouseEvent} event - Événement souris
 * @returns {{x: number, y: number}} Coordonnées relatives au canvas
 */
function getCanvasRelativeCoordinates(event) {
    const canvas = getCanvas();
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const relativeX = event.clientX - rect.left;
    const relativeY = event.clientY - rect.top;
    
    // Debug pour Chrome vs Safari
    console.log(`🖱️ Mouse Debug:
        Client: (${event.clientX}, ${event.clientY})
        Canvas rect: left=${rect.left}, top=${rect.top}, width=${rect.width}, height=${rect.height}
        Relative: (${relativeX}, ${relativeY})
        Browser: ${navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Safari/Other'}`);
    
    return {
        x: relativeX,
        y: relativeY
    };
}

/**
 * Gestionnaire d'événement mousedown
 * @param {MouseEvent} event - Événement souris
 */
export function handleMouseDown(event) {
    const canvas = getCanvas();
    if (!canvas) return;
    
    const mouseCoords = getCanvasRelativeCoordinates(event);
    const mouseX = mouseCoords.x;
    const mouseY = mouseCoords.y;
    
    // Vérifier si on clique sur un cartouche
    const cartoucheIndex = getCartoucheAtPosition(mouseX, mouseY, getCurrentPlacements());
    if (cartoucheIndex !== -1) {
        // Commencer le drag du cartouche
        cartoucheDragState.isDragging = true;
        cartoucheDragState.draggedConeIndex = cartoucheIndex;
        cartoucheDragState.startX = mouseX;
        cartoucheDragState.startY = mouseY;
        
        // Calculer l'offset depuis le coin supérieur gauche du cartouche
        const placement = getCurrentPlacements().find(p => p.originalBox.coneIndex === cartoucheIndex);
        cartoucheDragState.offsetX = mouseX - placement.x;
        cartoucheDragState.offsetY = mouseY - placement.y;
        
        canvas.style.cursor = 'grabbing';
        return;
    }
    
    // Vérifier si on clique sur une origine de cône
    const coneIndex = getConeAtPosition(mouseX, mouseY, coneOrigins);
    if (coneIndex !== -1) {
        // Commencer le drag du cône
        dragState.isDragging = true;
        dragState.draggedConeIndex = coneIndex;
        dragState.startX = mouseX;
        dragState.startY = mouseY;
        dragState.isNewCone = false;
        dragState.hasActuallyDragged = false;
        
        canvas.style.cursor = 'grabbing';
        return;
    }
    
    // Vérifier si on clique à l'intérieur d'un cône de lumière
    const spacetime = screenToSpacetime(mouseX, mouseY);
    const sourceConeIndex = getContainingCone(spacetime.x, spacetime.t, coneOrigins);
    if (sourceConeIndex !== -1) {
        console.log('🚀 Creating new cone from source cone:', sourceConeIndex);
        
        // Créer un nouveau cône immédiatement à la position du clic
        const spacetime = screenToSpacetime(mouseX, mouseY);
        const sourceCone = coneOrigins[sourceConeIndex];
        
        if (isReachableFromSource(spacetime.x, spacetime.t, sourceCone)) {
            const newCone = {
                x: spacetime.x,
                t: spacetime.t,
                sourceIndex: sourceConeIndex,
                cumulativeVelocity: 0,
                cumulativeProperTime: 0,
                totalCoordinateTime: spacetime.t
            };
            
            coneOrigins.push(newCone);
            const newConeIndex = coneOrigins.length - 1;
            console.log('✅ Created new cone at:', spacetime.x.toFixed(2), spacetime.t.toFixed(2));
            // Documentation automatique (hors mode démo)
            if (!window.isDemoMode) {
                addConeAndDocument(spacetime.x, spacetime.t);
            }
            // Maintenant commencer à drag le nouveau cône créé
            dragState.isDragging = true;
            dragState.draggedConeIndex = newConeIndex;
            dragState.startX = mouseX;
            dragState.startY = mouseY;
            dragState.isNewCone = false; // C'est maintenant un cône existant qu'on drag
            dragState.hasActuallyDragged = false;
            
            // Mettre à jour les calculs
            updateCalculationsDisplay();
            
            canvas.style.cursor = 'grabbing';
        } else {
            console.log('❌ Position not reachable from source cone');
        }
    } else {
        console.log('❌ Click outside all light cones');
    }
}

/**
 * Gestionnaire d'événement mousemove
 * @param {MouseEvent} event - Événement souris
 */
export function handleMouseMove(event) {
    const canvas = getCanvas();
    if (!canvas) return;
    
    const mouseCoords = getCanvasRelativeCoordinates(event);
    const mouseX = mouseCoords.x;
    const mouseY = mouseCoords.y;
    
    // Vérifier le hover sur l'isochrone
    checkIsochroneHover(mouseX, mouseY, selectedReferenceFrame, coneOrigins);
    
    if (cartoucheDragState.isDragging) {
        // Mettre à jour l'offset du cartouche
        const deltaX = mouseX - cartoucheDragState.startX;
        const deltaY = mouseY - cartoucheDragState.startY;
        
        cartoucheOffsets[cartoucheDragState.draggedConeIndex] = {
            x: deltaX,
            y: deltaY
        };
        
        return;
    }
    
    if (dragState.isDragging) {
        const deltaX = mouseX - dragState.startX;
        const deltaY = mouseY - dragState.startY;
        
        if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
            dragState.hasActuallyDragged = true;
        }
        
        if (dragState.isNewCone) {
            // Prévisualiser la position du nouveau cône
            const spacetime = screenToSpacetime(mouseX, mouseY);
            const sourceCone = coneOrigins[dragState.draggedConeIndex];
            
            if (isReachableFromSource(spacetime.x, spacetime.t, sourceCone)) {
                canvas.style.cursor = 'grabbing';
            } else {
                canvas.style.cursor = 'not-allowed';
            }
        } else {
            // Mettre à jour la position du cône existant
            const spacetime = screenToSpacetime(mouseX, mouseY);
            const cone = coneOrigins[dragState.draggedConeIndex];
            
            if (cone.sourceIndex === -1) {
                // Ne peut pas déplacer l'origine
                return;
            }
            
            const sourceCone = coneOrigins[cone.sourceIndex];
            if (isReachableFromSource(spacetime.x, spacetime.t, sourceCone)) {
                cone.x = spacetime.x;
                cone.t = spacetime.t;
                canvas.style.cursor = 'grabbing';
            } else {
                canvas.style.cursor = 'not-allowed';
            }
        }
    } else {
        // Mettre à jour le curseur selon la position actuelle
        const cartoucheIndex = getCartoucheAtPosition(mouseX, mouseY, getCurrentPlacements());
        if (cartoucheIndex !== -1) {
            canvas.style.cursor = 'grab';
            return;
        }
        
        const coneIndex = getConeAtPosition(mouseX, mouseY, coneOrigins);
        if (coneIndex !== -1) {
            canvas.style.cursor = 'grab';
        } else {
            const spacetime = screenToSpacetime(mouseX, mouseY);
            if (getContainingCone(spacetime.x, spacetime.t, coneOrigins) !== -1) {
                canvas.classList.add('inside-cone');
                canvas.style.cursor = '';
            } else {
                canvas.classList.remove('inside-cone');
                canvas.style.cursor = '';
            }
        }
    }
}

/**
 * Gestionnaire d'événement mouseup
 * @param {MouseEvent} event - Événement souris
 */
export function handleMouseUp(event) {
    const canvas = getCanvas();
    if (!canvas) return;
    
    const mouseCoords = getCanvasRelativeCoordinates(event);
    const mouseX = mouseCoords.x;
    const mouseY = mouseCoords.y;
    
    if (cartoucheDragState.isDragging) {
        cartoucheDragState.isDragging = false;
        canvas.style.cursor = 'grab';
        return;
    }
    
    if (dragState.isDragging) {
        // Juste arrêter le drag - la création de cône est gérée dans mouseDown
        dragState.isDragging = false;
        dragState.isNewCone = false;
        dragState.hasActuallyDragged = false;
        
        canvas.style.cursor = '';
    }
}

/**
 * Gestionnaire d'événement click sur le canvas
 * @param {MouseEvent} event - Événement souris
 */
export function handleCanvasClick(event) {
    const mouseCoords = getCanvasRelativeCoordinates(event);
    const mouseX = mouseCoords.x;
    const mouseY = mouseCoords.y;
    
    // Vérifier si on clique sur une origine de cône pour la sélectionner
    const coneIndex = getConeAtPosition(mouseX, mouseY, coneOrigins);
    if (coneIndex !== -1) {
        selectedReferenceFrame = coneIndex;
        window.selectedReferenceFrame = coneIndex;
        updateSelectedReferenceFrame(coneIndex);
        updateCalculationsDisplay();
        return;
    }
    
    // Vérifier si on clique sur un cartouche pour le sélectionner
    const cartoucheIndex = getCartoucheAtPosition(mouseX, mouseY, getCurrentPlacements());
    if (cartoucheIndex !== -1) {
        selectedReferenceFrame = cartoucheIndex;
        window.selectedReferenceFrame = cartoucheIndex;
        updateSelectedReferenceFrame(cartoucheIndex);
        updateCalculationsDisplay();
        return;
    }
}

// Variables temporaires pour les placements (seront injectées)
let getCurrentPlacements = () => [];

/**
 * Définit la fonction pour obtenir les placements actuels
 * @param {Function} fn - Fonction pour obtenir les placements
 */
export function setGetCurrentPlacements(fn) {
    getCurrentPlacements = fn;
}

/**
 * Obtient l'état de drag actuel
 * @returns {Object} État de drag
 */
export function getDragState() {
    return dragState;
}

/**
 * Obtient l'état de drag des cartouches
 * @returns {Object} État de drag des cartouches
 */
export function getCartoucheDragState() {
    return cartoucheDragState;
} 