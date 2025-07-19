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
} from './physics/index.js';

import {
    // Initialisation renderer
    initRenderer,
    animate,
    
    // Fonctions canvas
    canvas,
    ctx,
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
} from './renderer/index.js';

// Configuration
let config = {
    resolution: 2,
    greenLimit: 0.5,
    redLimit: 1.0, // Fixed at speed of light
    showPastCone: false
};

// Drag and drop state
let dragState = {
    isDragging: false,
    draggedConeIndex: -1,
    startX: 0,
    startY: 0,
    isNewCone: false,
    hasActuallyDragged: false
};

// Cartouche drag state
let cartoucheDragState = {
    isDragging: false,
    draggedConeIndex: -1,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0
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



// Event handlers
function handleMouseDown(event) {
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    // Check if clicking on a cartouche
    const cartoucheIndex = getCartoucheAtPosition(mouseX, mouseY, getCurrentPlacements());
    if (cartoucheIndex !== -1) {
        // Start cartouche drag
        cartoucheDragState.isDragging = true;
        cartoucheDragState.draggedConeIndex = cartoucheIndex;
        cartoucheDragState.startX = mouseX;
        cartoucheDragState.startY = mouseY;
        
        // Calculate offset from cartouche top-left
        const placement = getCurrentPlacements().find(p => p.originalBox.coneIndex === cartoucheIndex);
        cartoucheDragState.offsetX = mouseX - placement.x;
        cartoucheDragState.offsetY = mouseY - placement.y;
        
        canvas.style.cursor = 'grabbing';
        return;
    }
    
    // Check if clicking on a cone origin
    const coneIndex = getConeAtPosition(mouseX, mouseY, coneOrigins);
    if (coneIndex !== -1) {
        // Start cone drag
        dragState.isDragging = true;
        dragState.draggedConeIndex = coneIndex;
        dragState.startX = mouseX;
        dragState.startY = mouseY;
        dragState.isNewCone = false;
        dragState.hasActuallyDragged = false;
        
        canvas.style.cursor = 'grabbing';
        return;
    }
    
    // Check if clicking inside a light cone
    const spacetime = screenToSpacetime(mouseX, mouseY);
    const sourceConeIndex = getContainingCone(spacetime.x, spacetime.t, coneOrigins);
    if (sourceConeIndex !== -1) {
        console.log('🚀 Creating new cone from source cone:', sourceConeIndex);
        
        // Create new cone immediately at click position
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
            
            // Now start dragging the newly created cone
            dragState.isDragging = true;
            dragState.draggedConeIndex = newConeIndex;
            dragState.startX = mouseX;
            dragState.startY = mouseY;
            dragState.isNewCone = false; // It's now an existing cone being dragged
            dragState.hasActuallyDragged = false;
            
            // Update calculations
            updateCalculationsDisplay();
            
            canvas.style.cursor = 'grabbing';
        } else {
            console.log('❌ Position not reachable from source cone');
        }
    } else {
        console.log('❌ Click outside all light cones');
    }
}

function handleMouseMove(event) {
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    // Check isochrone hover
    checkIsochroneHover(mouseX, mouseY, selectedReferenceFrame, coneOrigins);
    
    if (cartoucheDragState.isDragging) {
        // Update cartouche offset
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
            // Preview new cone position
            const spacetime = screenToSpacetime(mouseX, mouseY);
            const sourceCone = coneOrigins[dragState.draggedConeIndex];
            
            if (isReachableFromSource(spacetime.x, spacetime.t, sourceCone)) {
                canvas.style.cursor = 'grabbing';
            } else {
                canvas.style.cursor = 'not-allowed';
            }
        } else {
            // Update existing cone position
            const spacetime = screenToSpacetime(mouseX, mouseY);
            const cone = coneOrigins[dragState.draggedConeIndex];
            
            if (cone.sourceIndex === -1) {
                // Can't move origin
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
        // Update cursor based on current position
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

function handleMouseUp(event) {
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    if (cartoucheDragState.isDragging) {
        cartoucheDragState.isDragging = false;
        canvas.style.cursor = 'grab';
        return;
    }
    
    if (dragState.isDragging) {
        // Just stop dragging - cone creation is handled in mouseDown
        dragState.isDragging = false;
        dragState.isNewCone = false;
        dragState.hasActuallyDragged = false;
        
        canvas.style.cursor = '';
    }
}

function handleCanvasClick(event) {
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    // Check if clicking on a cone origin to select it
    const coneIndex = getConeAtPosition(mouseX, mouseY, coneOrigins);
    if (coneIndex !== -1) {
        selectedReferenceFrame = coneIndex;
        updateCalculationsDisplay();
        return;
    }
    
    // Check if clicking on a cartouche to select it
    const cartoucheIndex = getCartoucheAtPosition(mouseX, mouseY, getCurrentPlacements());
    if (cartoucheIndex !== -1) {
        selectedReferenceFrame = cartoucheIndex;
        updateCalculationsDisplay();
        return;
    }
}

// Add event listeners
canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('mouseup', handleMouseUp);
canvas.addEventListener('click', handleCanvasClick);

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

// Update calculations display
function updateCalculationsDisplay() {
    const calculationsDiv = document.querySelector('.calculations');
    
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
}

// Delete selected reference frame
function deleteSelectedReferenceFrame() {
    console.log('deleteSelectedReferenceFrame called, selectedReferenceFrame:', selectedReferenceFrame);
    
    if (selectedReferenceFrame <= 0) {
        console.log('Cannot delete origin, returning');
        return;
    }
    
    const frameToDelete = selectedReferenceFrame;
    const framesToDelete = [frameToDelete];
    
    function findDerivedFrames(parentIndex) {
        for (let i = 0; i < coneOrigins.length; i++) {
            const cone = coneOrigins[i];
            if (cone.sourceIndex === parentIndex && !framesToDelete.includes(i)) {
                framesToDelete.push(i);
                findDerivedFrames(i);
            }
        }
    }
    
    findDerivedFrames(frameToDelete);
    framesToDelete.sort((a, b) => b - a);
    
    framesToDelete.forEach(index => {
        coneOrigins.splice(index, 1);
        delete cartoucheOffsets[index];
    });
    
    // Update cartouche offsets
    const newCartoucheOffsets = {};
    Object.keys(cartoucheOffsets).forEach(key => {
        const oldIndex = parseInt(key);
        let newIndex = oldIndex;
        
        for (const deletedIndex of framesToDelete) {
            if (deletedIndex < oldIndex) {
                newIndex--;
            }
        }
        
        if (newIndex >= 0) {
            newCartoucheOffsets[newIndex] = cartoucheOffsets[key];
        }
    });
    cartoucheOffsets = newCartoucheOffsets;
    
    // Update source indices
    for (let i = 0; i < coneOrigins.length; i++) {
        const cone = coneOrigins[i];
        if (cone.sourceIndex >= 0) {
            let adjustment = 0;
            for (const deletedIndex of framesToDelete) {
                if (deletedIndex <= cone.sourceIndex) {
                    adjustment++;
                }
            }
            cone.sourceIndex -= adjustment;
            
            if (cone.sourceIndex < 0) {
                cone.sourceIndex = 0;
            }
        }
    }
    
    selectedReferenceFrame = 0;
    updateCalculationsDisplay();
}

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

// Twin paradox demonstration
function twinParadox() {
    console.log('Starting Twin Paradox demonstration...');
    
    // Clear existing cones except origin
    coneOrigins = [{ 
        x: 0, 
        y: 0, 
        t: 0, 
        sourceIndex: -1,
        cumulativeVelocity: 0,
        cumulativeProperTime: 0,
        totalCoordinateTime: 0
    }];
    
    // Clear cartouche offsets
    cartoucheOffsets = {};
    
    // Reset selection to origin
    selectedReferenceFrame = 0;
    
    // Demo parameters (based on original - safe values that respect light cone)
    const T = 300; // Total time for the Earth twin (3x bigger for better visibility)
    const X = 120; // Distance traveled by the space twin (3x bigger, well within light cone)
    
    // Create the twin paradox scenario (simple 3-reference version)
    setTimeout(() => {
        // Reference frame 1: Earth twin stays on Earth
        const ref1 = {
            x: 0,    // Stays on Earth (x = 0)
            y: 0,
            t: T,    // Time T when they reunite
            sourceIndex: 0 // From origin
        };
        coneOrigins.push(ref1);
        console.log('Created Ref 1 (Earth twin):', ref1);
        
        setTimeout(() => {
            // Reference frame 2: Space twin travels far (turnaround point)
            const ref2 = {
                x: X,           // Far distance X
                y: 0,
                t: T * 0.45,    // Less than T/2 to stay well within light cone
                sourceIndex: 0  // Directly from origin (departure)
            };
            coneOrigins.push(ref2);
            console.log('Created Ref 2 (Space twin - turnaround):', ref2);
            
            setTimeout(() => {
                // Reference frame 3: Space twin returns to Earth twin
                const ref3 = {
                    x: 0,    // Back to Earth (same as ref1)
                    y: 0,
                    t: T,    // Same time as Earth twin reunion
                    sourceIndex: 2 // From ref2 (return journey)
                };
                coneOrigins.push(ref3);
                console.log('Created Ref 3 (Space twin - return):', ref3);
                
                // Select ref3 to show the comparison
                selectedReferenceFrame = 3;
                updateCalculationsDisplay();
                
                console.log('Twin Paradox Demo completed!');
                
                // Update comments panel instead of showing alert
                setTimeout(() => {
                    const commentContent = `
                        <div style="line-height: 1.6;">
                            <p><strong style="color: #ff9f4a;">📊 Scénario créé :</strong></p>
                            <ul style="margin: 10px 0; padding-left: 20px;">
                                <li><strong style="color: #4a9eff;">Réf 1</strong> : Jumeau terrestre reste sur Terre (x=0, t=${T})</li>
                                <li><strong style="color: #ff6b6b;">Réf 2</strong> : Jumeau voyageur va loin (x=${X}, t=${T * 0.45})</li>
                                <li><strong style="color: #00ff00;">Réf 3</strong> : Jumeau voyageur revient sur Terre (x=0, t=${T})</li>
                            </ul>
                            
                            <p><strong style="color: #feca57;">🎯 Résultat clé :</strong></p>
                            <p>Les deux jumeaux se retrouvent au <em>même endroit</em> et au <em>même temps coordonnée</em>, MAIS le jumeau voyageur (réf 3) a un <strong style="color: #ff6b6b;">temps propre cumulé plus petit</strong> !</p>
                            
                            <p><strong style="color: #4a9eff;">💡 Observation :</strong></p>
                            <p>Le jumeau voyageur a <strong>vieilli moins</strong> ! Regardez les calculs pour comparer les temps propres entre réf 1 et réf 3.</p>
                            
                            <p style="margin-top: 15px; padding: 10px; background: rgba(74, 158, 255, 0.1); border-radius: 5px; border-left: 3px solid #4a9eff;">
                                <em>Cliquez sur les différents référentiels pour explorer chaque étape du voyage et comprendre l'accumulation des effets relativistes.</em>
                            </p>
                        </div>
                    `;
                    
                    updateCommentsPanel('🚀 Démonstration du Paradoxe des Jumeaux', commentContent);
                }, 500);
            }, 300);
        }, 300);
    }, 100);
}

// Load comments only (fallback function)
function loadCommentsOnly() {
    const savedComments = localStorage.getItem('lightConeComments');
    if (savedComments && !savedComments.includes('Cliquez ici pour ajouter')) {
        document.getElementById('commentsEditor').innerHTML = savedComments;
    }
}

// Setup comments panel management
function setupCommentsPanel() {
    const commentsEditor = document.getElementById('commentsEditor');
    
    if (!commentsEditor) return;
    
    // Clear placeholder when user starts typing
    commentsEditor.addEventListener('focus', function() {
        if (this.innerHTML.includes('Cliquez ici pour ajouter')) {
            this.innerHTML = '';
        }
    });
    
    // Restore placeholder if empty
    commentsEditor.addEventListener('blur', function() {
        if (this.innerHTML.trim() === '' || this.innerHTML.trim() === '<br>') {
            this.innerHTML = '<p style="color: #888; font-style: italic;">Cliquez ici pour ajouter vos commentaires sur le diagramme...</p>';
        }
    });
    
    // Add keyboard shortcuts for comments editor
    commentsEditor.addEventListener('keydown', function(e) {
        // Ctrl+B for bold
        if (e.ctrlKey && e.key === 'b') {
            e.preventDefault();
            document.execCommand('bold');
            document.getElementById('boldBtn').classList.toggle('active');
        }
        // Ctrl+I for italic
        else if (e.ctrlKey && e.key === 'i') {
            e.preventDefault();
            document.execCommand('italic');
            document.getElementById('italicBtn').classList.toggle('active');
        }
        // Ctrl+U for underline
        else if (e.ctrlKey && e.key === 'u') {
            e.preventDefault();
            document.execCommand('underline');
            document.getElementById('underlineBtn').classList.toggle('active');
        }
        // Ctrl+S for save
        else if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            document.getElementById('saveComments').click();
        }
        // Ctrl+L for load
        else if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            document.getElementById('loadComments').click();
        }
    });
    
    // Update toolbar button states based on current selection
    document.addEventListener('selectionchange', function() {
        updateToolbarStates();
    });
    
    commentsEditor.addEventListener('keyup', function() {
        updateToolbarStates();
    });
    
    commentsEditor.addEventListener('mouseup', function() {
        updateToolbarStates();
    });
}

// Update toolbar button states
function updateToolbarStates() {
    // Check if current selection has formatting
    const boldBtn = document.getElementById('boldBtn');
    const italicBtn = document.getElementById('italicBtn');
    const underlineBtn = document.getElementById('underlineBtn');
    
    if (boldBtn) boldBtn.classList.toggle('active', document.queryCommandState('bold'));
    if (italicBtn) italicBtn.classList.toggle('active', document.queryCommandState('italic'));
    if (underlineBtn) underlineBtn.classList.toggle('active', document.queryCommandState('underline'));
}

// Initialize the application
function init() {
    console.log('Initializing application...');
    
    // Update initial display
    updateCalculationsDisplay();
    updateGradientBar(config);
    
    // Set up control event listeners
    const resolutionSlider = document.getElementById('resolution');
    const greenLimitSlider = document.getElementById('greenLimit');
    const showPastConeCheckbox = document.getElementById('showPastCone');
    const twinParadoxButton = document.getElementById('twinParadoxDemo');
    
    if (resolutionSlider) {
        resolutionSlider.addEventListener('input', function() {
            config.resolution = parseInt(this.value);
            document.getElementById('resolutionValue').textContent = resolutionSettings[config.resolution].name;
        });
    }
    
    if (greenLimitSlider) {
        greenLimitSlider.addEventListener('input', function() {
            config.greenLimit = parseFloat(this.value);
            document.getElementById('greenLimitValue').textContent = config.greenLimit.toFixed(2) + 'c';
            updateGradientBar(config);
        });
    }
    
    if (showPastConeCheckbox) {
        showPastConeCheckbox.addEventListener('change', function() {
            config.showPastCone = this.checked;
        });
    }
    
    if (twinParadoxButton) {
        twinParadoxButton.addEventListener('click', twinParadox);
    }
    
    // Set up other control buttons
    const resetButton = document.getElementById('reset');
    const clearConesButton = document.getElementById('clearCones');
    const helpButton = document.getElementById('helpButton');
    const infoPanelTwinDemo = document.getElementById('infoPanelTwinDemo');
    
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            // Reset to initial state
            coneOrigins = [{ 
                x: 0, 
                y: 0, 
                t: 0, 
                sourceIndex: -1,
                cumulativeVelocity: 0,
                cumulativeProperTime: 0,
                totalCoordinateTime: 0
            }];
            selectedReferenceFrame = 0;
            cartoucheOffsets = {};
            
            // Reset config
            config.resolution = 2;
            config.greenLimit = 0.5;
            config.showPastCone = false;
            
            // Update UI
            updateCalculationsDisplay();
            updateGradientBar(config);
            
            // Update controls
            if (resolutionSlider) {
                resolutionSlider.value = config.resolution;
                document.getElementById('resolutionValue').textContent = resolutionSettings[config.resolution].name;
            }
            if (greenLimitSlider) {
                greenLimitSlider.value = config.greenLimit;
                document.getElementById('greenLimitValue').textContent = config.greenLimit.toFixed(2) + 'c';
            }
            if (showPastConeCheckbox) {
                showPastConeCheckbox.checked = config.showPastCone;
            }
            
            console.log('🔄 Application reset to initial state');
        });
    }
    
    if (clearConesButton) {
        clearConesButton.addEventListener('click', function() {
            if (confirm('Êtes-vous sûr de vouloir effacer tous les cônes ?')) {
                coneOrigins = [coneOrigins[0]]; // Keep only origin
                selectedReferenceFrame = 0;
                cartoucheOffsets = {};
                updateCalculationsDisplay();
                console.log('🗑️ All cones cleared');
            }
        });
    }
    
    if (helpButton) {
        helpButton.addEventListener('click', function() {
            const helpModal = document.getElementById('helpModal');
            if (helpModal) {
                helpModal.style.display = 'block';
            }
        });
    }
    
    // Set up help modal close functionality
    const helpModal = document.getElementById('helpModal');
    const helpClose = document.querySelector('.help-close');
    
    if (helpClose) {
        helpClose.addEventListener('click', function() {
            if (helpModal) {
                helpModal.style.display = 'none';
            }
        });
    }
    
    // Close modal when clicking outside
    if (helpModal) {
        helpModal.addEventListener('click', function(event) {
            if (event.target === helpModal) {
                helpModal.style.display = 'none';
            }
        });
    }
    
    if (infoPanelTwinDemo) {
        infoPanelTwinDemo.addEventListener('click', twinParadox);
    }
    
    // Set up UI toggle listeners
    const toggleDetailsButton = document.getElementById('toggleDetails');
    if (toggleDetailsButton) {
        toggleDetailsButton.addEventListener('click', function() {
            const infoDetails = document.getElementById('infoDetails');
            const calculationsPanel = document.querySelector('.calculations');
            
            if (infoDetails.classList.contains('hidden')) {
                infoDetails.classList.remove('hidden');
                calculationsPanel.classList.remove('expanded');
                this.innerHTML = '👁️ Masquer';
                this.title = 'Masquer les détails';
            } else {
                infoDetails.classList.add('hidden');
                calculationsPanel.classList.add('expanded');
                this.innerHTML = '👁️ Afficher';
                this.title = 'Afficher les détails';
            }
        });
    }
    
    // Set up comments toolbar
    const boldBtn = document.getElementById('boldBtn');
    const italicBtn = document.getElementById('italicBtn');
    const underlineBtn = document.getElementById('underlineBtn');
    const colorBtn = document.getElementById('colorBtn');
    const clearFormatBtn = document.getElementById('clearFormatBtn');
    
    if (boldBtn) {
        boldBtn.addEventListener('click', function() {
            document.execCommand('bold');
            this.classList.toggle('active');
        });
    }
    
    if (italicBtn) {
        italicBtn.addEventListener('click', function() {
            document.execCommand('italic');
            this.classList.toggle('active');
        });
    }
    
    if (underlineBtn) {
        underlineBtn.addEventListener('click', function() {
            document.execCommand('underline');
            this.classList.toggle('active');
        });
    }
    
    if (colorBtn) {
        colorBtn.addEventListener('click', function() {
            const colors = ['#ff6b6b', '#4a9eff', '#00ff00', '#feca57', '#ff9f4a', '#ffffff'];
            const colorNames = ['Rouge', 'Bleu', 'Vert', 'Jaune', 'Orange', 'Blanc'];
            
            let colorChoice = prompt(`Choisissez une couleur (1-${colors.length}) :\n` + 
                colorNames.map((name, i) => `${i+1}. ${name}`).join('\n'));
            
            if (colorChoice && colorChoice >= 1 && colorChoice <= colors.length) {
                document.execCommand('foreColor', false, colors[colorChoice - 1]);
                this.style.background = colors[colorChoice - 1];
            }
        });
    }
    
    if (clearFormatBtn) {
        clearFormatBtn.addEventListener('click', function() {
            document.execCommand('removeFormat');
            document.querySelectorAll('.comments-toolbar button').forEach(btn => {
                btn.classList.remove('active');
            });
        });
    }
    
    // Set up save/load/clear buttons
    const saveBtn = document.getElementById('saveComments');
    const loadBtn = document.getElementById('loadComments');
    const clearBtn = document.getElementById('clearComments');
    
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            const comments = document.getElementById('commentsEditor').innerHTML;
            
            const saveData = {
                comments: comments,
                coneOrigins: coneOrigins,
                cartoucheOffsets: cartoucheOffsets,
                selectedReferenceFrame: selectedReferenceFrame,
                config: config,
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('lightConeComments', comments);
            localStorage.setItem('lightConeDiagram', JSON.stringify(saveData));
            
            this.innerHTML = '✅ Sauvé !';
            this.style.background = '#00ff00';
            setTimeout(() => {
                this.innerHTML = '💾 Sauver';
                this.style.background = '#4a9eff';
            }, 1500);
            
            console.log('Saved diagram with', coneOrigins.length, 'reference frames');
        });
    }
    
    if (loadBtn) {
        loadBtn.addEventListener('click', function() {
            const savedDiagram = localStorage.getItem('lightConeDiagram');
            
            if (savedDiagram) {
                try {
                    const saveData = JSON.parse(savedDiagram);
                    const saveDate = new Date(saveData.timestamp).toLocaleString('fr-FR');
                    const numFrames = saveData.coneOrigins ? saveData.coneOrigins.length : 0;
                    
                    if (confirm(`Charger la sauvegarde du ${saveDate} ?\n\n` +
                              `📊 ${numFrames} référentiel(s)\n` +
                              `📝 Commentaires inclus\n` +
                              `⚙️ Configuration incluse\n\n` +
                              `⚠️ Cela remplacera le diagramme actuel !`)) {
                        
                        if (saveData.coneOrigins && Array.isArray(saveData.coneOrigins)) {
                            coneOrigins = saveData.coneOrigins;
                        }
                        
                        if (saveData.cartoucheOffsets) {
                            cartoucheOffsets = saveData.cartoucheOffsets;
                        }
                        
                        if (saveData.selectedReferenceFrame !== undefined) {
                            selectedReferenceFrame = saveData.selectedReferenceFrame;
                        }
                        
                        if (saveData.config) {
                            config = { ...config, ...saveData.config };
                            
                            if (resolutionSlider) {
                                resolutionSlider.value = config.resolution;
                                document.getElementById('resolutionValue').textContent = resolutionSettings[config.resolution].name;
                            }
                            if (greenLimitSlider) {
                                greenLimitSlider.value = config.greenLimit;
                                document.getElementById('greenLimitValue').textContent = config.greenLimit.toFixed(2) + 'c';
                            }
                            if (showPastConeCheckbox) {
                                showPastConeCheckbox.checked = config.showPastCone;
                            }
                            updateGradientBar(config);
                        }
                        
                        if (saveData.comments && !saveData.comments.includes('Cliquez ici pour ajouter')) {
                            document.getElementById('commentsEditor').innerHTML = saveData.comments;
                        }
                        
                        updateCalculationsDisplay();
                        
                        this.innerHTML = '✅ Chargé !';
                        this.style.background = '#00ff00';
                        setTimeout(() => {
                            this.innerHTML = '📂 Charger';
                            this.style.background = '#4a9eff';
                        }, 1500);
                        
                        console.log('Loaded diagram with', coneOrigins.length, 'reference frames');
                    }
                } catch (error) {
                    alert('Erreur lors du chargement de la sauvegarde !\n\n' + error.message);
                }
            } else {
                alert('Aucune sauvegarde trouvée !\n\nUtilisez d\'abord le bouton "💾 Sauver" pour créer une sauvegarde.');
            }
        });
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            if (confirm('Êtes-vous sûr de vouloir effacer tous les commentaires ET la configuration du diagramme ?')) {
                document.getElementById('commentsEditor').innerHTML = '<p style="color: #888; font-style: italic;">Cliquez ici pour ajouter vos commentaires sur le diagramme...</p>';
                
                coneOrigins = [{ 
                    x: 0, 
                    y: 0, 
                    t: 0, 
                    sourceIndex: -1,
                    cumulativeVelocity: 0,
                    cumulativeProperTime: 0,
                    totalCoordinateTime: 0
                }];
                selectedReferenceFrame = 0;
                cartoucheOffsets = {};
                
                localStorage.removeItem('lightConeComments');
                localStorage.removeItem('lightConeDiagram');
                
                updateCalculationsDisplay();
                
                console.log('Cleared all saved data and reset diagram');
            }
        });
    }
    
    // Load saved data on initialization
    const savedDiagram = localStorage.getItem('lightConeDiagram');
    if (savedDiagram) {
        try {
            const saveData = JSON.parse(savedDiagram);
            
            if (saveData.coneOrigins && Array.isArray(saveData.coneOrigins)) {
                coneOrigins = saveData.coneOrigins;
                console.log('Restored', coneOrigins.length, 'reference frames');
            }
            
            if (saveData.cartoucheOffsets) {
                cartoucheOffsets = saveData.cartoucheOffsets;
            }
            
            if (saveData.selectedReferenceFrame !== undefined) {
                selectedReferenceFrame = saveData.selectedReferenceFrame;
            }
            
            if (saveData.config) {
                config = { ...config, ...saveData.config };
                
                if (resolutionSlider) {
                    resolutionSlider.value = config.resolution;
                    document.getElementById('resolutionValue').textContent = resolutionSettings[config.resolution].name;
                }
                if (greenLimitSlider) {
                    greenLimitSlider.value = config.greenLimit;
                    document.getElementById('greenLimitValue').textContent = config.greenLimit.toFixed(2) + 'c';
                }
                if (showPastConeCheckbox) {
                    showPastConeCheckbox.checked = config.showPastCone;
                }
                updateGradientBar(config);
            }
            
            if (saveData.comments && !saveData.comments.includes('Cliquez ici pour ajouter')) {
                document.getElementById('commentsEditor').innerHTML = saveData.comments;
            }
            
            updateCalculationsDisplay();
            
            console.log('Diagram restored from', saveData.timestamp);
            
        } catch (error) {
            console.error('Error loading saved diagram:', error);
            // Fallback to just comments if diagram data is corrupted
            loadCommentsOnly();
        }
    } else {
        // Fallback to old comments-only system
        loadCommentsOnly();
    }
    
    // Set up comments panel management
    setupCommentsPanel();
    
    // Initialize renderer and start animation
    console.log('Initializing renderer...');
    initRenderer(document.getElementById('canvas'));
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    console.log('Starting animation loop...');
    animate(getRenderData);
}

// Start the application when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Additional window load event for complete initialization
window.addEventListener('load', function() {
    // Try to load complete diagram data first
    const savedDiagram = localStorage.getItem('lightConeDiagram');
    
    if (savedDiagram) {
        try {
            const saveData = JSON.parse(savedDiagram);
            
            // Restore diagram configuration
            if (saveData.coneOrigins && Array.isArray(saveData.coneOrigins)) {
                coneOrigins = saveData.coneOrigins;
                console.log('Restored', coneOrigins.length, 'reference frames');
            }
            
            if (saveData.cartoucheOffsets) {
                cartoucheOffsets = saveData.cartoucheOffsets;
            }
            
            if (saveData.selectedReferenceFrame !== undefined) {
                selectedReferenceFrame = saveData.selectedReferenceFrame;
            }
            
            if (saveData.config) {
                // Restore configuration settings
                config = { ...config, ...saveData.config };
                
                // Update UI controls to match restored config
                const resolutionSlider = document.getElementById('resolution');
                const greenLimitSlider = document.getElementById('greenLimit');
                const showPastConeCheckbox = document.getElementById('showPastCone');
                
                if (resolutionSlider) {
                    resolutionSlider.value = config.resolution;
                    document.getElementById('resolutionValue').textContent = resolutionSettings[config.resolution].name;
                }
                if (greenLimitSlider) {
                    greenLimitSlider.value = config.greenLimit;
                    document.getElementById('greenLimitValue').textContent = config.greenLimit.toFixed(2) + 'c';
                }
                if (showPastConeCheckbox) {
                    showPastConeCheckbox.checked = config.showPastCone;
                }
                updateGradientBar(config);
            }
            
            // Restore comments
            if (saveData.comments && !saveData.comments.includes('Cliquez ici pour ajouter')) {
                document.getElementById('commentsEditor').innerHTML = saveData.comments;
            }
            
            // Update calculations display
            updateCalculationsDisplay();
            
            console.log('Diagram restored from', saveData.timestamp);
            
        } catch (error) {
            console.error('Error loading saved diagram:', error);
            // Fallback to just comments if diagram data is corrupted
            loadCommentsOnly();
        }
    } else {
        // Fallback to old comments-only system
        loadCommentsOnly();
    }
});

console.log('Phase 1 - Extraction JavaScript: main.js chargé complètement'); 