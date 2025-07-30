/**
 * Main.js - Version modulaire refactorisée
 * Point d'entrée principal utilisant les modules physics et objects
 */

// Import des modules
import { 
    calculateGravitationalGradient, 
    calculateGravitationalRedshift, 
    redshiftToColor,
    calculateGravitationalTimeDilation,
    c 
} from './physics/gravity.js';

import { 
    createNewVersion, 
    initializeGridVersions, 
    getPropagationFronts,
    getGridVersions,
    resetPropagation,
    getMassesForVersion,
    updateGridVersionsForFront,
    injectDependencies as injectPropagationDependencies
} from './physics/propagation.js';

import { 
    addMass, 
    addBlackHole, 
    modifyBlackHole,
    drawMasses, 
    getMasses, 
    setMasses,
    setCurrentTool,
    getCurrentTool,
    setSpacing,
    resetMasses,
    setCreateVersionCallback
} from './objects/masses.js';

// Variables globales du canvas et de l'animation
let canvas, ctx;
let animationId;
let lastTime = 0;
let fps = 0;
let frameCount = 0;
let lastFpsUpdate = 0;

// Variables de configuration
let spacing = 32;
let showVectors = true;
let showPropagation = true;
let propagationSpeed = 1.0;

// Variables pour les horloges
let referenceClockTime = Date.now();
let clocks = [];
let isPlacingClock = false;
let isMovingClock = false;
let selectedClock = null;

// Variables pour les géodésiques
let geodesics = [];
let showGeodesicDebug = false;
let geodesicSettings = {
    maxSteps: 10000,
    explorationStep: 0.5,
    maxAngle: 400,
    minGradientThreshold: 0.001,
    stopGradientThreshold: 0.001,
    curveStep: 10.0,
    thicknessAmplification: 1.0
};

// Variables pour les vaisseaux spatiaux
let spacecrafts = [];
let isPlacingSpacecraft = false;
let spacecraftStartPoint = null;
let spacecraftVelocity = null;

// Variables pour les lasers
let lasers = [];
let isPlacingLaser = false;
let laserStartPoint = null;
let laserVelocity = null;

/**
 * Initialise l'application
 */
function init() {
    console.log('Initialisation de l\'application modulaire...');
    
    // Initialiser le canvas
    canvas = document.getElementById('gravityCanvas');
    ctx = canvas.getContext('2d');
    
    // Définir la taille du canvas (laisser de la place pour le panneau)
    canvas.width = window.innerWidth - 360; // 320px pour le panneau + 40px de marge
    canvas.height = window.innerHeight - 200;
    
    // Initialiser les modules
    setSpacing(spacing);
    initializeGridVersions(canvas.width, canvas.height, spacing);
    
    // Injecter les dépendances dans le module de propagation
    injectPropagationDependencies(getMasses(), spacing);
    
    // Configurer le callback pour créer de nouvelles versions
    setCreateVersionCallback(createNewVersion);
    
    // Initialiser les événements
    initEvents();
    
    // Démarrer l'animation
    animate();
    
    console.log('Application initialisée avec succès !');
}

/**
 * Initialise les événements
 */
function initEvents() {
    // Gestion des clics sur le canvas
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('contextmenu', handleCanvasRightClick);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    
    // Gestion des touches
    document.addEventListener('keydown', handleKeyDown);
    
    // Gestion des outils
    document.querySelectorAll('input[name="tool"]').forEach(radio => {
        radio.addEventListener('change', handleToolChange);
    });
    
    // Gestion des paramètres
    document.getElementById('gridResolutionSlider').addEventListener('input', handleSpacingChange);
    document.getElementById('showVectorsToggle').addEventListener('change', handleShowVectorsChange);
    document.getElementById('showPropagationToggle').addEventListener('change', handleShowPropagationChange);
    
    // Gestion du reset
    document.getElementById('resetBtn').addEventListener('click', reset);
}

/**
 * Gère les clics sur le canvas
 */
function handleCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const currentTool = getCurrentTool();
    
    if (currentTool === 'mass') {
        addMass(x, y, false);
    } else if (currentTool === 'blackhole') {
        addBlackHole(x, y);
    } else if (currentTool === 'clock') {
        handleClockClick(x, y);
    }
}

/**
 * Gère les clics droits sur le canvas
 */
function handleCanvasRightClick(e) {
    e.preventDefault();
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const currentTool = getCurrentTool();
    
    if (currentTool === 'mass') {
        addMass(x, y, true);
    } else if (currentTool === 'blackhole') {
        modifyBlackHole(x, y);
    } else if (currentTool === 'clock' && isMovingClock) {
        cancelClockPlacement();
    }
}

/**
 * Gère le mouvement de la souris
 */
function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (isMovingClock && selectedClock) {
        selectedClock.x = x;
        selectedClock.y = y;
    }
}

/**
 * Gère le relâchement de la souris
 */
function handleMouseUp(e) {
    if (isMovingClock && selectedClock) {
        isMovingClock = false;
        selectedClock.isSelected = false;
        selectedClock = null;
        canvas.style.cursor = 'default';
    }
}

/**
 * Gère les touches du clavier
 */
function handleKeyDown(e) {
    if (e.key === 'Escape') {
        if (isMovingClock) {
            cancelClockPlacement();
        }
    }
}

/**
 * Gère le changement d'outil
 */
function handleToolChange(e) {
    const newTool = e.target.value;
    setCurrentTool(newTool);
    
    if (newTool !== 'clock') {
        cancelClockPlacement();
    } else {
        canvas.style.cursor = 'crosshair';
    }
}

/**
 * Gère le changement d'espacement
 */
function handleSpacingChange(e) {
    spacing = parseInt(e.target.value);
    setSpacing(spacing);
    initializeGridVersions(canvas.width, canvas.height, spacing);
    injectPropagationDependencies(getMasses(), spacing);
}

/**
 * Gère l'affichage des vecteurs
 */
function handleShowVectorsChange(e) {
    showVectors = e.target.checked;
}

/**
 * Gère l'affichage de la propagation
 */
function handleShowPropagationChange(e) {
    showPropagation = e.target.checked;
}

/**
 * Gère la vitesse de propagation
 */
function handlePropagationSpeedChange(e) {
    propagationSpeed = parseFloat(e.target.value);
}

/**
 * Gère les clics sur les horloges
 */
function handleClockClick(x, y) {
    // Vérifier si on clique sur une horloge existante
    const clickedClock = clocks.find(clock => {
        const dx = x - clock.x;
        const dy = y - clock.y;
        return Math.sqrt(dx * dx + dy * dy) < 15;
    });
    
    if (clickedClock) {
        // Mode déplacement
        isMovingClock = true;
        selectedClock = clickedClock;
        selectedClock.isSelected = true;
        canvas.style.cursor = 'move';
    } else {
        // Créer une nouvelle horloge
        addClock(x, y);
    }
}

/**
 * Ajoute une horloge
 */
function addClock(x, y) {
    const clock = {
        x: x,
        y: y,
        referenceTime: Date.now(),
        localTime: Date.now(),
        isSelected: false
    };
    clocks.push(clock);
}

/**
 * Annule le placement d'horloge
 */
function cancelClockPlacement() {
    isPlacingClock = false;
    isMovingClock = false;
    if (selectedClock) {
        selectedClock.isSelected = false;
        selectedClock = null;
    }
    canvas.style.cursor = 'default';
}

/**
 * Met à jour les horloges
 */
function updateClocks(deltaTime) {
    referenceClockTime = Date.now();
    
    clocks.forEach(clock => {
        const timeDilationFactor = calculateGravitationalTimeDilation(clock.x, clock.y, getMasses());
        const timeDifference = referenceClockTime - clock.referenceTime;
        clock.localTime = clock.referenceTime + (timeDifference * timeDilationFactor);
    });
}

/**
 * Formate le temps en jours/heures/minutes/secondes
 */
function formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    const remainingHours = hours % 24;
    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds % 60;
    
    if (days > 0) {
        return `${days}j ${remainingHours}h ${remainingMinutes}m ${remainingSeconds}s`;
    } else if (remainingHours > 0) {
        return `${remainingHours}h ${remainingMinutes}m ${remainingSeconds}s`;
    } else if (remainingMinutes > 0) {
        return `${remainingMinutes}m ${remainingSeconds}s`;
    } else {
        return `${remainingSeconds}s`;
    }
}

/**
 * Dessine les horloges
 */
function drawClocks() {
    clocks.forEach(clock => {
        // Dessiner le cercle de l'horloge
        ctx.fillStyle = clock.isSelected ? '#FF6B6B' : '#FFD700';
        ctx.beginPath();
        ctx.arc(clock.x, clock.y, 6, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(clock.x, clock.y, 6, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Calculer les informations de temps
        const timeDilationFactor = calculateGravitationalTimeDilation(clock.x, clock.y, getMasses());
        const timeDifference = clock.localTime - clock.referenceTime;
        const timeDelta = clock.localTime - referenceClockTime;
        
        // Afficher les informations de debug
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        
        const infoY = clock.y - 15;
        ctx.fillText(`Dilatation: ×${timeDilationFactor.toFixed(4)}`, clock.x + 10, infoY);
        ctx.fillText(`Delta: ${(timeDelta / 1000).toFixed(3)}s`, clock.x + 10, infoY + 12);
        ctx.fillText(`Local: ${formatTime(clock.localTime)}`, clock.x + 10, infoY + 24);
    });
}

/**
 * Dessine la grille
 */
function drawGrid() {
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= canvas.width; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    for (let y = 0; y <= canvas.height; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

/**
 * Dessine les vecteurs de champ gravitationnel
 */
function drawGravitationalVectors() {
    if (!showVectors) {
        console.log('Vecteurs masqués par showVectors = false');
        return;
    }
    
    const gridVersions = getGridVersions();
    const gridWidth = gridVersions.length;
    const gridHeight = gridVersions[0] ? gridVersions[0].length : 0;
    
    for (let x = 0; x < gridWidth; x++) {
        for (let y = 0; y < gridHeight; y++) {
            const worldX = x * spacing + spacing / 2;
            const worldY = y * spacing + spacing / 2;
            const version = gridVersions[x][y];
            
            // Obtenir les masses pour cette version
            const versionMasses = version === 0 ? [] : getMassesForVersion(version);
            
            // Utiliser les masses actuelles pour le debug
            const currentMasses = getMasses();
            
            // Utiliser les masses de version comme prévu
            if (versionMasses.length > 0) {
                console.log(`Version ${version}: ${versionMasses.length} masses trouvées`);
                const gradient = calculateGravitationalGradient(worldX, worldY, versionMasses);
                
                if (gradient.magnitude > 0.1) {
                    // Normaliser le vecteur pour l'affichage
                    const normalized = normalizeVector(gradient.x, gradient.y);
                    const vectorLength = Math.min(20, gradient.magnitude * 2);
                    
                    // Dessiner le vecteur
                    ctx.strokeStyle = '#00FF00';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(worldX, worldY);
                    ctx.lineTo(
                        worldX + normalized.x * vectorLength,
                        worldY + normalized.y * vectorLength
                    );
                    ctx.stroke();
                    
                    // Flèche
                    const arrowLength = 5;
                    const arrowAngle = Math.atan2(normalized.y, normalized.x);
                    
                    ctx.beginPath();
                    ctx.moveTo(
                        worldX + normalized.x * vectorLength,
                        worldY + normalized.y * vectorLength
                    );
                    ctx.lineTo(
                        worldX + normalized.x * vectorLength - arrowLength * Math.cos(arrowAngle - Math.PI / 6),
                        worldY + normalized.y * vectorLength - arrowLength * Math.sin(arrowAngle - Math.PI / 6)
                    );
                    ctx.moveTo(
                        worldX + normalized.x * vectorLength,
                        worldY + normalized.y * vectorLength
                    );
                    ctx.lineTo(
                        worldX + normalized.x * vectorLength - arrowLength * Math.cos(arrowAngle + Math.PI / 6),
                        worldY + normalized.y * vectorLength - arrowLength * Math.sin(arrowAngle + Math.PI / 6)
                    );
                    ctx.stroke();
                }
            }
        }
    }
}

/**
 * Normalise un vecteur
 */
function normalizeVector(vx, vy) {
    const magnitude = Math.sqrt(vx * vx + vy * vy);
    if (magnitude === 0) return { x: 0, y: 0 };
    return {
        x: vx / magnitude,
        y: vy / magnitude
    };
}

/**
 * Dessine les fronts de propagation
 */
function drawPropagationFronts() {
    if (!showPropagation) return;
    
    const fronts = getPropagationFronts();
    const currentTime = Date.now();
    
    fronts.forEach(front => {
        const elapsed = (currentTime - front.startTime) * propagationSpeed / 1000;
        const radius = elapsed * c; // c = vitesse de la lumière
        
        if (radius > 0) {
            // Couleur verte pour tous les fronts
            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = Math.max(1, 10 - radius / 50);
            
            ctx.beginPath();
            ctx.arc(front.x, front.y, radius, 0, 2 * Math.PI);
            ctx.stroke();
            
            // Mettre à jour la grille des versions pour ce front
            updateGridVersionsForFront(front, radius, spacing);
        }
    });
}

/**
 * Met à jour les informations de debug
 */
function updateDebugInfo() {
    // FPS
    const currentTime = performance.now();
    frameCount++;
    
    if (currentTime - lastFpsUpdate >= 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastFpsUpdate));
        frameCount = 0;
        lastFpsUpdate = currentTime;
    }
    
    document.getElementById('fps').textContent = fps;
    document.getElementById('referenceTime').textContent = formatTime(referenceClockTime);
}

/**
 * Réinitialise l'application
 */
function reset() {
    console.log('Réinitialisation de l\'application...');
    
    // Réinitialiser les modules
    resetMasses();
    resetPropagation();
    clocks = [];
    referenceClockTime = 0;
    
    // Réinitialiser les variables
    geodesics = [];
    spacecrafts = [];
    lasers = [];
    
    // Annuler les placements en cours
    cancelClockPlacement();
    
    // Réinitialiser la grille
    initializeGridVersions(canvas.width, canvas.height, spacing);
    injectPropagationDependencies(getMasses(), spacing);
    
    console.log('Application réinitialisée !');
}

/**
 * Boucle d'animation principale
 */
function animate(currentTime = 0) {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    // Effacer le canvas
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dessiner la grille
    drawGrid();
    
    // Dessiner les vecteurs de champ
    drawGravitationalVectors();
    
    // Dessiner les fronts de propagation
    drawPropagationFronts();
    
    // Dessiner les masses
    drawMasses(ctx);
    
    // Mettre à jour et dessiner les horloges
    updateClocks(deltaTime);
    drawClocks();
    
    // Mettre à jour les informations de debug
    updateDebugInfo();
    
    // Continuer l'animation
    animationId = requestAnimationFrame(animate);
}

// Initialiser l'application quand le DOM est chargé
document.addEventListener('DOMContentLoaded', init);
