// JavaScript principal extrait de cone-lumiere-colore.html
// Refactoring Phase 1 - Extraction JavaScript
// Refactoring Phase 3 - Modularisation avec module Physics

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

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

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

// Store isochrone points globally for hover detection
let currentIsochronePoints = [];
let isochroneHoverInfo = null;

// Resolution settings
const resolutionSettings = {
    1: { name: 'Basse', pixelSize: 8 },
    2: { name: 'Moyenne', pixelSize: 4 },
    3: { name: 'Haute', pixelSize: 2 }
};

// Resize canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Update gradient bar dynamically
function updateGradientBar() {
    const gradientBar = document.getElementById('gradientBar');
    const greenPercent = config.greenLimit * 100;
    const redPercent = config.redLimit * 100; // Always 100% now
    
    gradientBar.style.background = `linear-gradient(to right, 
        #0000ff 0%, 
        #00ff00 ${greenPercent}%, 
        #ff0000 ${redPercent}%, 
        #000000 100%)`;
    
    // Update labels
    document.getElementById('greenLabel').textContent = `${config.greenLimit.toFixed(2)}c`;
    // Red label is now fixed at 1.0c
}

// Color function for velocity (now dynamic)
function getColorForVelocity(v) {
    // v goes from 0 to 1 (where 1 = c)
    // Dynamic gradient: Blue (0) -> Green (greenLimit) -> Red (redLimit) -> Transparent (≥c)
    
    if (v >= 1) {
        // Transparent for v ≥ c (causally disconnected)
        return { r: 0, g: 0, b: 0, alpha: 0 };
    }
    
    if (v < config.greenLimit) {
        // Blue to Green (0 to greenLimit)
        const t = v / config.greenLimit; // 0 to 1
        const r = 0;
        const g = Math.floor(255 * t);
        const b = Math.floor(255 * (1 - t));
        return { r, g, b, alpha: 255 };
    } else if (v < config.redLimit) {
        // Green to Red (greenLimit to redLimit)
        const t = (v - config.greenLimit) / (config.redLimit - config.greenLimit); // 0 to 1
        const r = Math.floor(255 * t);
        const g = Math.floor(255 * (1 - t));
        const b = 0;
        return { r, g, b, alpha: 255 };
    } else {
        // Red to Transparent (redLimit to c)
        const t = (v - config.redLimit) / (1 - config.redLimit); // 0 to 1
        const r = Math.floor(255 * (1 - t));
        const g = 0;
        const b = 0;
        const alpha = Math.floor(255 * (1 - t)); // Fade to transparent
        return { r, g, b, alpha };
    }
}



// Convert screen coordinates to spacetime coordinates
function screenToSpacetime(screenX, screenY) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height - 50; // Origin at bottom with some margin
    const scale = 2;
    
    const x = (screenX - centerX) / scale;
    const t = (centerY - screenY) / scale; // Time goes up
    
    return { x, t };
}

// Convert spacetime coordinates to screen coordinates
function spacetimeToScreen(x, t) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height - 50; // Origin at bottom with some margin
    const scale = 2;
    
    const screenX = centerX + x * scale;
    const screenY = centerY - t * scale;
    
    return { screenX, screenY };
}



// Check if mouse is over a cone origin point
function getConeAtPosition(mouseX, mouseY) {
    const threshold = 15; // Click threshold in pixels
    
    for (let i = 1; i < coneOrigins.length; i++) { // Skip origin (index 0)
        const origin = coneOrigins[i];
        const screen = spacetimeToScreen(origin.x, origin.t);
        const distance = Math.sqrt(
            Math.pow(mouseX - screen.screenX, 2) + 
            Math.pow(mouseY - screen.screenY, 2)
        );
        
        if (distance <= threshold) {
            return i;
        }
    }
    return -1;
}



// Store placements globally for mouse event access
let currentPlacements = [];

// Check if mouse is over a cartouche
function getCartoucheAtPosition(mouseX, mouseY, placements) {
    for (const placement of placements) {
        const coneIndex = placement.originalBox.coneIndex;
        if (mouseX >= placement.x && mouseX <= placement.x + placement.width &&
            mouseY >= placement.y && mouseY <= placement.y + placement.height) {
            return coneIndex;
        }
    }
    return -1;
}

// Apply manual offset to cartouche placement
function applyCartoucheOffset(placement, coneIndex) {
    const offset = cartoucheOffsets[coneIndex] || { x: 0, y: 0 };
    return {
        ...placement,
        x: placement.x + offset.x,
        y: placement.y + offset.y
    };
}



// Event handlers
function handleMouseDown(event) {
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    // Check if clicking on a cartouche
    const cartoucheIndex = getCartoucheAtPosition(mouseX, mouseY, currentPlacements);
    if (cartoucheIndex !== -1) {
        // Start cartouche drag
        cartoucheDragState.isDragging = true;
        cartoucheDragState.draggedConeIndex = cartoucheIndex;
        cartoucheDragState.startX = mouseX;
        cartoucheDragState.startY = mouseY;
        
        // Calculate offset from cartouche top-left
        const placement = currentPlacements.find(p => p.originalBox.coneIndex === cartoucheIndex);
        cartoucheDragState.offsetX = mouseX - placement.x;
        cartoucheDragState.offsetY = mouseY - placement.y;
        
        canvas.style.cursor = 'grabbing';
        return;
    }
    
    // Check if clicking on a cone origin
    const coneIndex = getConeAtPosition(mouseX, mouseY);
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
    checkIsochroneHover(mouseX, mouseY);
    
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
        const cartoucheIndex = getCartoucheAtPosition(mouseX, mouseY, currentPlacements);
        if (cartoucheIndex !== -1) {
            canvas.style.cursor = 'grab';
            return;
        }
        
        const coneIndex = getConeAtPosition(mouseX, mouseY);
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
    const coneIndex = getConeAtPosition(mouseX, mouseY);
    if (coneIndex !== -1) {
        selectedReferenceFrame = coneIndex;
        updateCalculationsDisplay();
        return;
    }
    
    // Check if clicking on a cartouche to select it
    const cartoucheIndex = getCartoucheAtPosition(mouseX, mouseY, currentPlacements);
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

// Check if path is part of selected trajectory
function isPathInSelectedTrajectory(coneIndex) {
    if (selectedReferenceFrame === 0) return false;
    
    // Check if this path is part of the chain leading to the selected frame
    let currentIndex = selectedReferenceFrame;
    while (currentIndex !== -1) {
        if (currentIndex === coneIndex) return true;
        currentIndex = coneOrigins[currentIndex].sourceIndex;
    }
    return false;
}

// Draw acceleration path between two cones
function drawAccelerationPath(fromCone, toCone, newConeIndex) {
    const fromScreen = spacetimeToScreen(fromCone.x, fromCone.t);
    const toScreen = spacetimeToScreen(toCone.x, toCone.t);
    
    // Calculate trajectory for constant acceleration from rest
    const X = toCone.x - fromCone.x;  // spatial displacement
    const T = toCone.t - fromCone.t;  // temporal displacement
    
    // Ensure we're going forward in time
    if (T <= 0) return;
    
    const c = 1; // c = 1 in our units (45° cone)
    
    // Get physics for this cone and the source cone
                const physics = calculateCumulativePhysics(newConeIndex, coneOrigins);
    
    // Get initial velocity from the cone we're starting from (fromCone)
    let fromConeIndex = -1;
    for (let i = 0; i < coneOrigins.length; i++) {
        if (coneOrigins[i] === fromCone) {
            fromConeIndex = i;
            break;
        }
    }
            const fromPhysics = calculateCumulativePhysics(fromConeIndex, coneOrigins);
    
    let properAccel = physics.segmentAcceleration;
    let isValidTrajectory = !(Math.abs(X) >= T * c * (1 - 0.02)); // Same safety margin
    
    if (!isValidTrajectory) return; // Don't draw invalid trajectories
    
    // Get initial velocity from the cone we're departing from
    const v0 = limitVelocity(fromPhysics.cumulativeVelocity); // Apply velocity limit
    
    // Check if this path is part of the selected reference frame's trajectory
    const isPartOfSelectedTrajectory = isPathInSelectedTrajectory(newConeIndex);
    
    // Set line style based on selection
    if (isPartOfSelectedTrajectory) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 1.0)'; // Bright white for selected
        ctx.lineWidth = 4; // Thick line
        ctx.setLineDash([8, 4]); // Longer dashes
    } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
    }
    
    ctx.beginPath();
    ctx.moveTo(fromScreen.screenX, fromScreen.screenY);
    
    // Draw the relativistic acceleration trajectory with initial velocity
    const steps = 50;
    for (let i = 1; i <= steps; i++) {
        const t = (i / steps) * T; // time coordinate
        
        let x, time;
        
        if (Math.abs(v0) < 0.001) {
            // Starting from rest (or nearly rest) - use the simple formula
            const at_over_c = properAccel * t / c;
            const x_rel = (c * c / properAccel) * (Math.sqrt(1 + at_over_c * at_over_c) - 1);
            x = fromCone.x + Math.sign(X) * x_rel;
        } else {
            // Starting with initial velocity v0
            // We need to find the proper acceleration that gets us from 
            // (fromCone.x, fromCone.t) with velocity v0 to (toCone.x, toCone.t)
            
            // For relativistic motion with initial velocity, we solve:
            // The trajectory must satisfy the boundary conditions
            
            // Simple approach: use the calculated proper acceleration from physics
            // and solve the relativistic trajectory equation
            
            const targetX = toCone.x;
            const targetT = toCone.t;
            const deltaX = targetX - fromCone.x;
            const deltaT = targetT - fromCone.t;
            
            // For the trajectory calculation, we use the fact that we know both
            // the initial velocity and the final point
            
            // Simple relativistic trajectory with initial velocity:
            // We approximate by combining inertial motion + acceleration correction
            
            const t_norm = t / deltaT; // Normalized time (0 to 1)
            
            // Inertial component (what would happen with constant velocity)
            const x_inertial = fromCone.x + v0 * t;
            
            // Acceleration component to reach the target
            // We need to correct the trajectory to reach the exact target
            const x_target_correction = deltaX - v0 * deltaT; // What acceleration must provide
            
            // Use a smooth acceleration profile that respects relativity
            // The correction follows a relativistic profile
            const gamma0 = 1 / Math.sqrt(1 - v0 * v0 / (c * c));
            
            // Relativistic acceleration contribution
            // Using the fact that for constant proper acceleration:
            // Δx = (c²/a) * [√(1 + (aΔt/c)²) - 1] for motion starting from rest
            // We scale this by the time parameter
            
            if (Math.abs(properAccel) > 0.001) {
                const aT_over_c = properAccel * t / c;
                const accel_component = (c * c / properAccel) * (Math.sqrt(1 + aT_over_c * aT_over_c) - 1);
                
                // Scale the acceleration component to hit the target
                const scale_factor = x_target_correction / ((c * c / properAccel) * (Math.sqrt(1 + (properAccel * deltaT / c) * (properAccel * deltaT / c)) - 1));
                
                x = x_inertial + scale_factor * accel_component;
            } else {
                // No significant acceleration, mostly inertial motion
                x = x_inertial + x_target_correction * t_norm;
            }
        }
        
        time = fromCone.t + t;
        
        const pathScreen = spacetimeToScreen(x, time);
        ctx.lineTo(pathScreen.screenX, pathScreen.screenY);
    }
    
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash
    
    // Draw arrow at the end with appropriate size
    const arrowLength = isPartOfSelectedTrajectory ? 15 : 10;
    const angle = Math.atan2(toScreen.screenY - fromScreen.screenY, toScreen.screenX - fromScreen.screenX);
    
    ctx.beginPath();
    ctx.moveTo(toScreen.screenX, toScreen.screenY);
    ctx.lineTo(
        toScreen.screenX - arrowLength * Math.cos(angle - Math.PI / 6),
        toScreen.screenY - arrowLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(toScreen.screenX, toScreen.screenY);
    ctx.lineTo(
        toScreen.screenX - arrowLength * Math.cos(angle + Math.PI / 6),
        toScreen.screenY - arrowLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
}

// Calculate distance from point to line segment
function distanceToLineSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (length * length)));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    
    return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
}



// Draw isochrone for the selected reference frame
function drawSelectedIsochrone() {
    if (selectedReferenceFrame === 0) {
        currentIsochronePoints = [];
        return;
    }
    
    const selectedCone = coneOrigins[selectedReferenceFrame];
    const physics = calculateCumulativePhysics(selectedReferenceFrame, coneOrigins);
    const tau = physics.cumulativeProperTime;
    
    if (tau <= 0.01) {
        currentIsochronePoints = [];
        return;
    }
    
    const origin = coneOrigins[0];
    const isochronePoints = calculateIsochronePoints(tau, origin, selectedCone, canvas.width);
    
    currentIsochronePoints = isochronePoints;
    
    if (isochronePoints.length < 2) return;
    
    // Draw the isochrone curve
    ctx.strokeStyle = 'rgba(255, 165, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    
    ctx.beginPath();
    
    let firstScreen = spacetimeToScreen(isochronePoints[0].x, isochronePoints[0].t);
    ctx.moveTo(firstScreen.screenX, firstScreen.screenY);
    
    for (let i = 1; i < isochronePoints.length; i++) {
        const screen = spacetimeToScreen(isochronePoints[i].x, isochronePoints[i].t);
        
        if (screen.screenX >= 0 && screen.screenX <= canvas.width && 
            screen.screenY >= 0 && screen.screenY <= canvas.height) {
            ctx.lineTo(screen.screenX, screen.screenY);
        }
    }
    
    ctx.stroke();
    ctx.setLineDash([]);
}

// Check if mouse is near the isochrone curve
function checkIsochroneHover(mouseX, mouseY) {
    if (currentIsochronePoints.length < 2) {
        isochroneHoverInfo = null;
        return;
    }
    
    const coneIndex = getConeAtPosition(mouseX, mouseY);
    if (coneIndex !== -1) {
        isochroneHoverInfo = null;
        return;
    }
    
    const cartoucheIndex = getCartoucheAtPosition(mouseX, mouseY, currentPlacements);
    if (cartoucheIndex !== -1) {
        isochroneHoverInfo = null;
        return;
    }
    
    const threshold = 15;
    let closestPoint = null;
    let minDistance = Infinity;
    
    for (let i = 0; i < currentIsochronePoints.length - 1; i++) {
        const p1 = spacetimeToScreen(currentIsochronePoints[i].x, currentIsochronePoints[i].t);
        const p2 = spacetimeToScreen(currentIsochronePoints[i + 1].x, currentIsochronePoints[i + 1].t);
        
        const distance = distanceToLineSegment(mouseX, mouseY, p1.screenX, p1.screenY, p2.screenX, p2.screenY);
        
        if (distance < threshold && distance < minDistance) {
            minDistance = distance;
            const t = Math.max(0, Math.min(1, 
                ((mouseX - p1.screenX) * (p2.screenX - p1.screenX) + (mouseY - p1.screenY) * (p2.screenY - p1.screenY)) /
                ((p2.screenX - p1.screenX) ** 2 + (p2.screenY - p1.screenY) ** 2)
            ));
            
            const interpolatedPoint = {
                x: currentIsochronePoints[i].x + t * (currentIsochronePoints[i + 1].x - currentIsochronePoints[i].x),
                t: currentIsochronePoints[i].t + t * (currentIsochronePoints[i + 1].t - currentIsochronePoints[i].t)
            };
            
            closestPoint = interpolatedPoint;
        }
    }
    
    if (closestPoint && minDistance < threshold) {
        const origin = coneOrigins[0];
        const selectedCone = coneOrigins[selectedReferenceFrame];
        const selectedPhysics = calculateCumulativePhysics(selectedReferenceFrame, coneOrigins);
        
        const deltaX = closestPoint.x - origin.x;
        const deltaT = closestPoint.t - origin.t;
        const velocity = deltaT > 0 ? Math.abs(deltaX / deltaT) : 0;
        const velocityPercent = Math.min(99.9, velocity * 100);
        
        const properTime = selectedPhysics.cumulativeProperTime;
        const coordinateTime = deltaT;
        const properTimePercent = coordinateTime > 0 ? (properTime / coordinateTime * 100) : 100;
        
        isochroneHoverInfo = {
            x: mouseX,
            y: mouseY,
            velocityPercent: velocityPercent,
            properTimePercent: properTimePercent,
            properTime: properTime,
            coordinateTime: coordinateTime,
            spatialPosition: deltaX
        };
    } else {
        isochroneHoverInfo = null;
    }
}

// Draw box placement calculations
function calculateBoxPlacements(infoBoxes) {
    const placements = [];
    const margin = 10;
    
    for (let i = 0; i < infoBoxes.length; i++) {
        const box = infoBoxes[i];
        let bestX = box.idealX;
        let bestY = box.idealY;
        
        // Ensure box stays within canvas bounds
        bestX = Math.max(margin, Math.min(canvas.width - box.width - margin, bestX));
        bestY = Math.max(margin, Math.min(canvas.height - box.height - margin, bestY));
        
        // Simple collision avoidance with previous boxes
        let hasCollision = true;
        let attempts = 0;
        
        while (hasCollision && attempts < 10) {
            hasCollision = false;
            
            for (const existingPlacement of placements) {
                if (bestX < existingPlacement.x + existingPlacement.width + margin &&
                    bestX + box.width + margin > existingPlacement.x &&
                    bestY < existingPlacement.y + existingPlacement.height + margin &&
                    bestY + box.height + margin > existingPlacement.y) {
                    
                    hasCollision = true;
                    bestY += box.height + margin;
                    break;
                }
            }
            
            attempts++;
        }
        
        placements.push({
            x: bestX,
            y: bestY,
            width: box.width,
            height: box.height,
            originalBox: box
        });
    }
    
    return placements;
}

// Draw box connection line
function drawBoxConnection(originX, originY, boxCenterX, boxCenterY) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(boxCenterX, boxCenterY);
    ctx.stroke();
    
    ctx.setLineDash([]);
}

// Draw origin info box
function drawOriginInfoBox(boxX, boxY, boxWidth, boxHeight) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    ctx.strokeStyle = 'rgba(74, 158, 255, 0.8)';
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    
    if (selectedReferenceFrame === 0) {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.strokeRect(boxX - 2, boxY - 2, boxWidth + 4, boxHeight + 4);
    }
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = 'bold 11px Arial';
    ctx.fillText('Origine', boxX + 5, boxY + 12);
    
    ctx.font = '10px Arial';
    ctx.fillText('v = 0% c', boxX + 5, boxY + 25);
    ctx.fillText('a = 0 c²/t', boxX + 5, boxY + 37);
    ctx.fillText('t = 0 t', boxX + 5, boxY + 49);
    ctx.fillText('Référentiel inertiel', boxX + 5, boxY + 61);
}

// Draw reference frame info box
function drawReferenceInfoBox(boxX, boxY, boxWidth, boxHeight, coneIndex) {
    const physics = calculateCumulativePhysics(coneIndex, coneOrigins);
    const cone = coneOrigins[coneIndex];
    
    const finalVelocityPercent = (Math.abs(physics.segmentVelocity) / 1 * 100).toFixed(1);
    const cumulativeVelocityPercent = (Math.abs(physics.cumulativeVelocity) / 1 * 100).toFixed(1);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    
    ctx.strokeStyle = 'rgba(255, 159, 74, 0.8)';
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    
    if (selectedReferenceFrame === coneIndex) {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.strokeRect(boxX - 2, boxY - 2, boxWidth + 4, boxHeight + 4);
    }
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = 'bold 11px Arial';
    ctx.fillText(`Réf ${coneIndex}`, boxX + 5, boxY + 12);
    
    ctx.font = '10px Arial';
    ctx.fillText(`v = ${cumulativeVelocityPercent}% c`, boxX + 5, boxY + 25);
    ctx.fillText(`a = ${physics.segmentAcceleration.toFixed(3)} c²/t`, boxX + 5, boxY + 37);
    ctx.fillText(`t = ${physics.cumulativeProperTime.toFixed(2)} t`, boxX + 5, boxY + 49);
    ctx.fillText(`Δt = ${physics.segmentCoordinateTime.toFixed(2)} t`, boxX + 5, boxY + 61);
    ctx.fillText(`X = ${cone.x.toFixed(1)}, T = ${cone.t.toFixed(1)}`, boxX + 5, boxY + 73);
    ctx.fillText(`v_seg = ${finalVelocityPercent}% c`, boxX + 5, boxY + 85);
    ctx.fillText(`Source: Réf ${cone.sourceIndex}`, boxX + 5, boxY + 97);
}

// Draw isochrone tooltip
function drawIsochroneTooltip() {
    if (!isochroneHoverInfo) return;
    
    const tooltip = isochroneHoverInfo;
    const tooltipWidth = 200;
    const tooltipHeight = 80;
    
    let tooltipX = tooltip.x + 15;
    let tooltipY = tooltip.y - tooltipHeight - 15;
    
    if (tooltipX + tooltipWidth > canvas.width) {
        tooltipX = tooltip.x - tooltipWidth - 15;
    }
    if (tooltipY < 0) {
        tooltipY = tooltip.y + 15;
    }
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
    ctx.strokeStyle = 'rgba(255, 165, 0, 0.8)';
    ctx.strokeRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = 'bold 11px Arial';
    ctx.fillText('Isochrone', tooltipX + 5, tooltipY + 15);
    
    ctx.font = '10px Arial';
    ctx.fillText(`Vitesse: ${tooltip.velocityPercent.toFixed(1)}% c`, tooltipX + 5, tooltipY + 30);
    ctx.fillText(`Temps propre: ${tooltip.properTimePercent.toFixed(1)}%`, tooltipX + 5, tooltipY + 45);
    ctx.fillText(`Position: x=${tooltip.spatialPosition.toFixed(1)}`, tooltipX + 5, tooltipY + 60);
}

// Draw light cone envelopes
function drawLightConeEnvelopes() {
    if (selectedReferenceFrame === 0) return;
    
    const selectedCone = coneOrigins[selectedReferenceFrame];
    const c = 1;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height - 50;
    const scale = 2;
    
    const maxExtent = Math.max(canvas.width, canvas.height);
    
    // Left boundary of future cone
    const leftStartFuture = spacetimeToScreen(selectedCone.x, selectedCone.t);
    ctx.moveTo(leftStartFuture.screenX, leftStartFuture.screenY);
    
    const futureTime = selectedCone.t + maxExtent / scale;
    const leftFutureX = selectedCone.x - c * (futureTime - selectedCone.t);
    const leftFutureScreen = spacetimeToScreen(leftFutureX, futureTime);
    ctx.lineTo(leftFutureScreen.screenX, leftFutureScreen.screenY);
    
    // Right boundary of future cone
    ctx.moveTo(leftStartFuture.screenX, leftStartFuture.screenY);
    const rightFutureX = selectedCone.x + c * (futureTime - selectedCone.t);
    const rightFutureScreen = spacetimeToScreen(rightFutureX, futureTime);
    ctx.lineTo(rightFutureScreen.screenX, rightFutureScreen.screenY);
    
    ctx.stroke();
    
    // Past light cone (optional)
    if (config.showPastCone) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        
        ctx.beginPath();
        
        const leftStartPast = spacetimeToScreen(selectedCone.x, selectedCone.t);
        ctx.moveTo(leftStartPast.screenX, leftStartPast.screenY);
        
        const pastTime = selectedCone.t - maxExtent / 2;
        const leftPastX = selectedCone.x - c * (selectedCone.t - pastTime);
        const leftPastScreen = spacetimeToScreen(leftPastX, pastTime);
        ctx.lineTo(leftPastScreen.screenX, leftPastScreen.screenY);
        
        ctx.moveTo(leftStartPast.screenX, leftStartPast.screenY);
        const rightPastX = selectedCone.x + c * (selectedCone.t - pastTime);
        const rightPastScreen = spacetimeToScreen(rightPastX, pastTime);
        ctx.lineTo(rightPastScreen.screenX, rightPastScreen.screenY);
        
        ctx.stroke();
    }
    
    ctx.setLineDash([]);
}

// Main drawing function
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height - 50;
    const scale = 2;
    
    // Draw heatmap - using original algorithm with individual cone rendering
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;
    
    // Clear with black
    for (let i = 0; i < data.length; i += 4) {
        data[i] = 0;     // R
        data[i + 1] = 0; // G
        data[i + 2] = 0; // B
        data[i + 3] = 255; // A
    }
    
    const pixelSize = resolutionSettings[config.resolution].pixelSize;
    
    // Draw all cones using transparency layering (oldest to newest)
    for (let coneIndex = 0; coneIndex < coneOrigins.length; coneIndex++) {
        const coneOrigin = coneOrigins[coneIndex];
        
        // Draw the cone heatmap
        for (let px = 0; px < canvas.width; px += pixelSize) {
            for (let py = 0; py < canvas.height; py += pixelSize) {
                // Convert pixel coordinates to spacetime coordinates
                const spacetime = screenToSpacetime(px, py);
                
                // Calculate relative position from this cone's origin
                const relativeX = spacetime.x - coneOrigin.x;
                const relativeT = spacetime.t - coneOrigin.t;
                
                // Only draw future light cone (t > 0)
                if (relativeT > 0) {
                    const velocityRatio = calculateVelocityRatio(relativeX, 0, relativeT);
                    
                    // Check if point is inside the light cone
                    if (velocityRatio <= 1) {
                        const color = getColorForVelocity(velocityRatio);
                        
                        // Apply cone-specific color modulation
                        const coneModulation = coneIndex === selectedReferenceFrame ? 1.2 : 
                                             (coneIndex === 0 ? 1.0 : 0.8);
                        
                        // Only draw if the color has some opacity
                        if (color.alpha > 0) {
                            // Fill pixel block
                            for (let dx = 0; dx < pixelSize; dx++) {
                                for (let dy = 0; dy < pixelSize; dy++) {
                                    const index = ((py + dy) * canvas.width + (px + dx)) * 4;
                                    if (index < data.length - 3) {
                                        // Alpha blending with existing pixels
                                        const newAlpha = (color.alpha / 255) * coneModulation;
                                        const existingAlpha = data[index + 3] / 255;
                                        const blendAlpha = newAlpha + existingAlpha * (1 - newAlpha);
                                        
                                        if (blendAlpha > 0) {
                                            // Blend colors
                                            const newWeight = newAlpha / blendAlpha;
                                            const existingWeight = (existingAlpha * (1 - newAlpha)) / blendAlpha;
                                            
                                            data[index] = Math.floor(color.r * coneModulation * newWeight + data[index] * existingWeight);
                                            data[index + 1] = Math.floor(color.g * coneModulation * newWeight + data[index + 1] * existingWeight);
                                            data[index + 2] = Math.floor(color.b * coneModulation * newWeight + data[index + 2] * existingWeight);
                                            data[index + 3] = Math.floor(blendAlpha * 255);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Draw acceleration paths
    for (let i = 1; i < coneOrigins.length; i++) {
        const cone = coneOrigins[i];
        if (cone.sourceIndex !== -1) {
            drawAccelerationPath(coneOrigins[cone.sourceIndex], cone, i);
        }
    }
    
    // Draw isochrone for selected reference frame
    drawSelectedIsochrone();
    
    // Draw light cone envelopes
    drawLightConeEnvelopes();
    
    // Draw axes and labels
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    
    // Time axis
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, canvas.height);
    ctx.stroke();
    
    // Space axis
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.stroke();
    
    // Labels
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.fillText('Temps', centerX + 10, 30);
    ctx.fillText('Espace', canvas.width - 380, centerY - 10);
    
    // Collect all info boxes
    const infoBoxes = [];
    
    for (let i = 0; i < coneOrigins.length; i++) {
        const origin = coneOrigins[i];
        const screen = spacetimeToScreen(origin.x, origin.t);
        
        if (i === 0) {
            infoBoxes.push({
                idealX: screen.screenX + 20,
                idealY: screen.screenY - 55,
                width: 120,
                height: 65,
                index: i,
                isOrigin: true,
                coneIndex: i,
                originX: screen.screenX,
                originY: screen.screenY
            });
        } else {
            infoBoxes.push({
                idealX: screen.screenX + 20,
                idealY: screen.screenY - 80,
                width: 150,
                height: 105,
                index: i,
                isOrigin: false,
                coneIndex: i,
                originX: screen.screenX,
                originY: screen.screenY
            });
        }
    }
    
    // Calculate optimal placements
    const placements = calculateBoxPlacements(infoBoxes);
    
    // Apply manual offsets
    const finalPlacements = placements.map(placement => {
        const coneIndex = placement.originalBox.coneIndex;
        return applyCartoucheOffset(placement, coneIndex);
    });
    
    // Store placements globally
    currentPlacements = finalPlacements;
    
    // Draw all origin points and their info boxes
    for (const placement of finalPlacements) {
        const i = placement.originalBox.coneIndex;
        const origin = coneOrigins[i];
        const screen = spacetimeToScreen(origin.x, origin.t);
        
        // Draw the origin point
        ctx.fillStyle = i === 0 ? '#4a9eff' : '#ff9f4a';
        ctx.shadowBlur = 10;
        ctx.shadowColor = i === 0 ? '#4a9eff' : '#ff9f4a';
        ctx.beginPath();
        ctx.arc(screen.screenX, screen.screenY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Draw selection indicator
        if (i === selectedReferenceFrame) {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(screen.screenX, screen.screenY, 8, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw connection line if box was moved
        const wasMoved = placement.x !== placement.originalBox.idealX || 
                       placement.y !== placement.originalBox.idealY;
        if (wasMoved) {
            drawBoxConnection(
                screen.screenX, screen.screenY,
                placement.x + placement.width / 2, placement.y + placement.height / 2
            );
        }
        
        // Draw the info box
        if (i === 0) {
            drawOriginInfoBox(placement.x, placement.y, placement.width, placement.height);
        } else {
            drawReferenceInfoBox(placement.x, placement.y, placement.width, placement.height, i);
        }
    }
    
    // Draw isochrone tooltip
    drawIsochroneTooltip();
}

// Animation loop
function animate() {
    draw();
    requestAnimationFrame(animate);
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
    updateGradientBar();
    
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
            updateGradientBar();
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
            updateGradientBar();
            
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
                            updateGradientBar();
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
                updateGradientBar();
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
    
    // Start animation
    console.log('Starting animation loop...');
    animate();
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
                updateGradientBar();
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