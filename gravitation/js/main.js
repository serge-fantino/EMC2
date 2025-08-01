/**
 * Visualiseur de Propagation Gravitationnelle
 * Version simplifiée qui fonctionne
 */

// Import des modules physiques
import { G, c, maxSpeed, spacecraftSpeed } from './core/PhysicsConstants.js';
import { 
    calculateEventHorizon, 
    calculateGravitationalRedshift, 
    redshiftToColor, 
    normalizeVector 
} from './core/PhysicsUtils.js';

// Import du contexte global de l'application
import { AppContext, initializeAppContext, resetAppContext } from './core/AppContext.js';

// Import du gestionnaire de versions
import {
    createNewVersion,
    cleanupOldVersions,
    initializeGridVersions,
    getGridVersionIndex,
    updateGridPointVersion,
    getMassesForVersion,
    updateGridVersionsForFront,
    initializeVersionManager,
    getCurrentVersion,
    getMassHistory,
    getGridVersions,
    getMaxVersions
} from './core/VersionManager.js';

// Import du gestionnaire de masses
import {
    initializeMassManager,
    updateReferences as updateMassReferences,
    addMass,
    removeMass,
    getMasses,
    getPropagationFronts
} from './core/MassManager.js';

// Import du gestionnaire de trous noirs
import {
    initializeBlackHoleManager,
    updateReferences as updateBlackHoleReferences,
    addBlackHole,
    removeBlackHole,
    getBlackHoles,
    findBlackHoleAt
} from './core/BlackHoleManager.js';

// Import du gestionnaire de vaisseaux spatiaux
import {
    initializeSpacecraftManager,
    updateReferences as updateSpacecraftManagerReferences,
    addSpacecraft,
    updateSpacecrafts,
    removeSpacecraft,
    getSpacecrafts,
    clearSpacecrafts
} from './core/SpacecraftManager.js';

// Import du gestionnaire de lasers
import {
    initializeLaserManager,
    updateReferences as updateLaserManagerReferences,
    addLaser,
    updateLasers,
    removeLaser,
    getLasers,
    clearLasers,
    calculateLaserRedshift,
    getLaserColor
} from './core/LaserManager.js';

// Import du gestionnaire de géodésiques
import {
    initializeGeodesicManager,
    updateReferences as updateGeodesicManagerReferences,
    addGeodesic,
    recalculateAllGeodesics,
    updateGeodesics,
    removeGeodesic,
    getGeodesics,
    clearGeodesics,
    cancelGeodesicPlacement
} from './core/GeodesicManager.js';

// Import du gestionnaire des horloges
import { 
    initializeClockManager, 
    addClock, 
    updateClocks, 
    cancelClockPlacement 
} from './core/ClockManager.js';

// Import du gestionnaire des paramètres des géodésiques
import { initializeGeodesicSettings } from './core/GeodesicSettingsManager.js';

// Import des modules de rendu
import {
    initializeGridRenderer,
    setShowGrid,
    drawGrid
} from './rendering/GridRenderer.js';

import {
    initializeMassRenderer,
    updateMasses,
    drawMasses
} from './rendering/MassRenderer.js';

import {
    initializeSpacecraftRenderer,
    updateReferences as updateSpacecraftReferences,
    drawSpacecrafts
} from './rendering/SpacecraftRenderer.js';

import {
    initializeLaserRenderer,
    updateReferences as updateLaserReferences,
    drawLasers
} from './rendering/LaserRenderer.js';

import {
    initializeVectorRenderer,
    updateParameters as updateVectorParameters,
    drawVectors
} from './rendering/VectorRenderer.js';

import {
    initializePropagationRenderer,
    updateParameters as updatePropagationParameters,
    drawPropagation
} from './rendering/PropagationRenderer.js';

import {
    initializeGeodesicRenderer,
    updateReferences as updateGeodesicReferences,
    drawGeodesics
} from './rendering/GeodesicRenderer.js';

import {
    initializeClockRenderer,
    updateClocks as updateClockReferences,
    drawClocks
} from './rendering/ClockRenderer.js';

// Variables globales
const canvas = document.getElementById('gravityCanvas');
const ctx = canvas.getContext('2d');

let masses = [];
let propagationFronts = [];
let spacecrafts = []; // Nouveau : vaisseaux spatiaux
let animationRunning = true;
let spacing = 32; // 800/25
let showGrid = true;
let showVectors = true;
let showPropagation = true;
let showSpacecrafts = true; // Nouveau : affichage des vaisseaux

// Mode d'outil actuel
let currentTool = 'mass'; // 'mass', 'spacecraft', 'blackhole', 'laser'

// Paramètres physiques
let propagationSpeed = 1.0;
let forceScale = 1.0;
let gridResolution = 25;




    
// Fonctions de base
// addMass et removeMass sont maintenant dans MassManager.js

// Gestion des vaisseaux spatiaux
// addSpacecraft est maintenant dans SpacecraftManager.js

// addBlackHole est maintenant dans BlackHoleManager.js

// addLaser est maintenant dans LaserManager.js

// updateSpacecrafts est maintenant dans SpacecraftManager.js

// updateLasers est maintenant dans LaserManager.js

// Fonction pour calculer la métrique de Schwarzschild en 2D
function calculateSchwarzschildMetric(x, y, masses) {
    let totalPotential = 0;
    
    masses.forEach(mass => {
        const dx = mass.x - x;
        const dy = mass.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Potentiel gravitationnel Φ = -GM/r
            const potential = -(G * mass.mass) / distance;
            totalPotential += potential;
        }
    });
    
    // Métrique de Schwarzschild simplifiée en 2D
    // ds² = -(1 + 2Φ/c²)dt² + (1 - 2Φ/c²)(dx² + dy²)
    const phi = totalPotential;
    const factor = 2 * phi / (c * c);
    
    return {
        gtt: -(1 + factor),  // Composante temporelle
        gxx: 1 - factor,     // Composante spatiale x
        gyy: 1 - factor,     // Composante spatiale y
        gxy: 0               // Pas de couplage xy en 2D
    };
}

// Fonction pour calculer les symboles de Christoffel
function calculateChristoffelSymbols(x, y, masses) {
    const metric = calculateSchwarzschildMetric(x, y, masses);
    const { gtt, gxx, gyy } = metric;
    
    // Dérivées spatiales de la métrique (approximation numérique)
    const dx = 1.0;
    const dy = 1.0;
    
    const metricXPlus = calculateSchwarzschildMetric(x + dx, y, masses);
    const metricXMinus = calculateSchwarzschildMetric(x - dx, y, masses);
    const metricYPlus = calculateSchwarzschildMetric(x, y + dy, masses);
    const metricYMinus = calculateSchwarzschildMetric(x, y - dy, masses);
    
    // Calcul des dérivées
    const dgtt_dx = (metricXPlus.gtt - metricXMinus.gtt) / (2 * dx);
    const dgtt_dy = (metricYPlus.gtt - metricYMinus.gtt) / (2 * dy);
    const dgxx_dx = (metricXPlus.gxx - metricXMinus.gxx) / (2 * dx);
    const dgxx_dy = (metricYPlus.gxx - metricYMinus.gxx) / (2 * dy);
    const dgyy_dx = (metricXPlus.gyy - metricXMinus.gyy) / (2 * dx);
    const dgyy_dy = (metricYPlus.gyy - metricYMinus.gyy) / (2 * dy);
    
    // Symboles de Christoffel de première espèce
    const christoffel = {
        // Γᵢⱼₖ = ½(∂ᵢgⱼₖ + ∂ⱼgᵢₖ - ∂ₖgᵢⱼ)
        xxx: 0.5 * (dgxx_dx + dgxx_dx - dgxx_dx),
        xxy: 0.5 * (dgxx_dy + dgxx_dy - dgyy_dx),
        xyx: 0.5 * (dgxx_dy + dgyy_dx - dgxx_dy),
        xyy: 0.5 * (dgyy_dx + dgyy_dx - dgxx_dy),
        yxx: 0.5 * (dgyy_dx + dgxx_dy - dgyy_dx),
        yxy: 0.5 * (dgyy_dy + dgxx_dy - dgyy_dx),
        yyx: 0.5 * (dgyy_dy + dgyy_dy - dgyy_dy),
        yyy: 0.5 * (dgyy_dy + dgyy_dy - dgyy_dy)
    };
    
    return christoffel;
}







function getGridPoint(x, y) {
    const gridX = Math.round(x / spacing) * spacing;
    const gridY = Math.round(y / spacing) * spacing;
    return {
        x: Math.max(0, Math.min(canvas.width, gridX)),
        y: Math.max(0, Math.min(canvas.height, gridY))
    };
}

function updateDebugInfo() {
    // Mettre à jour les informations de debug
    document.getElementById('massCount').textContent = masses.length;
    document.getElementById('versionInfo').textContent = getCurrentVersion();
    document.getElementById('spacecraftCount').textContent = spacecrafts.length;
    document.getElementById('laserCount').textContent = window.lasers ? window.lasers.length : 0;
    document.getElementById('geodesicCount').textContent = geodesics.length;
    document.getElementById('clockCount').textContent = AppContext.clocks.length;
    
    // Mettre à jour le temps de référence
    document.getElementById('referenceTime').textContent = AppContext.referenceClockTime.toFixed(2);
    
    // Afficher des informations sur les géodésiques
    if (geodesics.length > 0) {
        const closedCount = geodesics.filter(g => g.isClosed).length;
        const avgAngle = geodesics.reduce((sum, g) => sum + (g.totalAngle || 0), 0) / geodesics.length;
        console.log(`Géodésiques: ${geodesics.length} total, ${closedCount} fermées, angle moyen: ${avgAngle.toFixed(1)}°`);
    }
    
    // Calculer le redshift moyen des lasers
    let totalRedshift = 0;
    let laserCount = 0;
    if (window.lasers && window.lasers.length > 0) {
        window.lasers.forEach(laser => {
            const { gridX, gridY } = getGridVersionIndex(laser.x, laser.y);
            const gridVersions = getGridVersions();
            const pointVersion = gridVersions[gridX] && gridVersions[gridX][gridY] !== undefined 
                ? gridVersions[gridX][gridY] : 0;
            const versionMasses = getMassesForVersion(pointVersion, masses);
            const redshift = calculateGravitationalRedshift(laser.x, laser.y, versionMasses);
            totalRedshift += redshift;
            laserCount++;
        });
    }
    
    const avgRedshift = laserCount > 0 ? (totalRedshift / laserCount).toFixed(3) : '--';
    document.getElementById('redshiftInfo').textContent = avgRedshift;
}

function toggleAnimation() {
    animationRunning = !animationRunning;
    const button = document.getElementById('playPauseBtn');
    
    if (animationRunning) {
        button.textContent = '⏸️ Pause';
        requestAnimationFrame(animate);
    } else {
        button.textContent = '▶️ Play';
    }
}

function reset() {
    // Réinitialiser le contexte global
    resetAppContext();
    
    // Réinitialiser les variables locales pour compatibilité
    masses = AppContext.masses;
    propagationFronts = AppContext.propagationFronts;
    spacecrafts = AppContext.spacecrafts;
    window.lasers = AppContext.lasers;
    geodesics = AppContext.geodesics;
    
    // Réinitialiser les gestionnaires
    initializeVersionManager(masses, spacing, gridResolution);
    initializeMassManager();
    initializeBlackHoleManager();
    initializeSpacecraftManager();
    initializeLaserManager();
    initializeGeodesicManager();
    cancelSpacecraftPlacement();
    cancelLaserPlacement();
    cancelGeodesicPlacement();
    cancelClockPlacement();
    
    console.log('Simulation réinitialisée');
}


    














function animate() {
    if (!animationRunning) return;
    
    const currentTime = Date.now();
    const deltaTime = currentTime - (animate.lastTime || currentTime);
    animate.lastTime = currentTime;
    
    // Mettre à jour les vaisseaux
    updateSpacecrafts(deltaTime);
    updateLasers(deltaTime); // Mettre à jour les lasers (via LaserManager)
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Mettre à jour les géodésiques
    updateGeodesics(deltaTime);
    
    // Mettre à jour les horloges
    updateClocks(deltaTime);
    
    // Synchroniser les variables locales avec le contexte global
    masses = AppContext.masses;
    propagationFronts = AppContext.propagationFronts;
    spacecrafts = AppContext.spacecrafts;
    window.lasers = AppContext.lasers;
    geodesics = AppContext.geodesics;
    
    // Mettre à jour les références des modules de rendu
    updateMassReferences();
    updateBlackHoleReferences();
    updateSpacecraftManagerReferences();
    updateLaserManagerReferences();
    updateGeodesicManagerReferences();
    updateMasses(masses);
    updateSpacecraftReferences(spacecrafts, isPlacingSpacecraft, spacecraftStartPoint, mousePosition);
    // Synchroniser lasers avec window.lasers
    lasers = window.lasers || [];
    updateLaserReferences(lasers, isPlacingLaser, laserStartPoint, mousePosition, masses);
    updateVectorParameters(showVectors, forceScale, masses);
    updatePropagationParameters(propagationFronts, showPropagation, propagationSpeed);
    updateGeodesicReferences(geodesics, masses);
    updateClockReferences();
    
    // Dessiner tout avec les modules de rendu
    drawGrid();
    drawMasses();
    drawSpacecrafts();
    drawLasers();
    drawPropagation();
    drawVectors();
    drawGeodesics();
    drawClocks();
    
    requestAnimationFrame(animate);
}

// Variables pour le placement de vaisseau
let spacecraftStartPoint = null;
let isPlacingSpacecraft = false;
let mousePosition = { x: 0, y: 0 };

// Variables pour le placement de laser
let laserStartPoint = null;
let isPlacingLaser = false;
let lasers = []; // Référence locale vers window.lasers

// Variables globales pour les géodésiques (courbes de niveau)
let geodesics = [];
let isPlacingGeodesic = false;
let geodesicStartPoint = null;



















// Gestion des événements
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (currentTool === 'mass') {
        addMass(x, y, false);
    } else if (currentTool === 'spacecraft') {
        if (!isPlacingSpacecraft) {
            // Premier clic : définir le point de départ
            spacecraftStartPoint = { x, y };
            mousePosition = { x, y }; // Initialiser mousePosition avec la position du clic
            isPlacingSpacecraft = true;
            canvas.style.cursor = 'crosshair';
            
            // Debug: forcer un redessinage immédiat
            console.log('Premier clic vaisseau:', { x, y, spacecraftStartPoint, mousePosition });
            
            // Forcer un cycle d'animation complet pour afficher la prévisualisation
            requestAnimationFrame(() => {
                animate();
            });
            

        } else {
            // Deuxième clic : confirmer le vecteur vitesse
            const directionX = mousePosition.x - spacecraftStartPoint.x;
            const directionY = mousePosition.y - spacecraftStartPoint.y;
            addSpacecraft(spacecraftStartPoint.x, spacecraftStartPoint.y, directionX, directionY);
            
            // Réinitialiser
            spacecraftStartPoint = null;
            isPlacingSpacecraft = false;
            canvas.style.cursor = 'default';
        }
    } else if (currentTool === 'blackhole') {
        addBlackHole(x, y, false); // Clic gauche
    } else if (currentTool === 'laser') {
        if (!isPlacingLaser) {
            // Premier clic : définir le point de départ
            laserStartPoint = { x, y };
            mousePosition = { x, y }; // Initialiser mousePosition avec la position du clic
            isPlacingLaser = true;
            canvas.style.cursor = 'crosshair';
            
            // Debug: forcer un redessinage immédiat
            console.log('Premier clic laser:', { x, y, laserStartPoint, mousePosition });
            
            // Forcer un cycle d'animation complet pour afficher la prévisualisation
            requestAnimationFrame(() => {
                animate();
            });
            

        } else {
            // Deuxième clic : confirmer la direction
            const directionX = mousePosition.x - laserStartPoint.x;
            const directionY = mousePosition.y - laserStartPoint.y;
            addLaser(laserStartPoint.x, laserStartPoint.y, directionX, directionY);
            
            // Réinitialiser
            laserStartPoint = null;
            isPlacingLaser = false;
            canvas.style.cursor = 'default';
        }
    } else if (currentTool === 'geodesic') {
        // Un seul clic pour placer une géodésique
        addGeodesic(x, y);
    } else if (currentTool === 'clock') {
        // Vérifier si on clique sur une horloge existante pour la déplacer
        const clickedClock = AppContext.clocks.find(clock => {
            const dx = x - clock.x;
            const dy = y - clock.y;
            return Math.sqrt(dx * dx + dy * dy) < 15; // Zone de clic
        });
        
        if (clickedClock) {
            // Commencer le déplacement d'une horloge existante
            AppContext.isMovingClock = true;
            AppContext.selectedClock = clickedClock;
            AppContext.selectedClock.isSelected = true;
            AppContext.canvas.style.cursor = 'move';
            console.log('Déplacement d\'horloge commencé');
        } else {
            // Placer une nouvelle horloge
            addClock(x, y);
        }
        return;
    }
});

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (currentTool === 'mass') {
        addMass(x, y, true);
    } else if (currentTool === 'blackhole') {
        addBlackHole(x, y, true); // Clic droit
    } else if (currentTool === 'spacecraft' && isPlacingSpacecraft) {
        // Annuler le placement de vaisseau
        cancelSpacecraftPlacement();
    } else if (currentTool === 'laser' && isPlacingLaser) {
        // Annuler le placement de laser
        cancelLaserPlacement();
    } else if (currentTool === 'geodesic' && isPlacingGeodesic) {
        // Annuler le placement de géodésique
        cancelGeodesicPlacement();
    } else if (currentTool === 'clock' && AppContext.isMovingClock) {
        // Annuler le déplacement d'horloge
        cancelClockPlacement();
    }
});

// Suivi de la souris pour la prévisualisation du vaisseau
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mousePosition.x = e.clientX - rect.left;
    mousePosition.y = e.clientY - rect.top;
    
    // Gestion du déplacement d'horloge
    if (AppContext.isMovingClock && AppContext.selectedClock) {
        AppContext.selectedClock.x = AppContext.mousePosition.x;
        AppContext.selectedClock.y = AppContext.mousePosition.y;
        return;
    }
});

// Gestion de la fin du déplacement d'horloge
canvas.addEventListener('mouseup', (e) => {
    if (AppContext.isMovingClock && AppContext.selectedClock) {
        AppContext.isMovingClock = false;
        AppContext.selectedClock.isSelected = false;
        AppContext.selectedClock = null;
        AppContext.canvas.style.cursor = 'default';
        console.log('Déplacement d\'horloge terminé');
    }
});

// Gestion de la touche ESC pour annuler le placement
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isPlacingSpacecraft) {
        cancelSpacecraftPlacement();
    } else if (e.key === 'Escape' && isPlacingLaser) {
        cancelLaserPlacement();
    } else if (e.key === 'Escape' && isPlacingGeodesic) {
        cancelGeodesicPlacement();
    } else if (e.key === 'Escape' && AppContext.isMovingClock) {
        cancelClockPlacement();
    }
});

function cancelSpacecraftPlacement() {
    spacecraftStartPoint = null;
    isPlacingSpacecraft = false;
    canvas.style.cursor = 'default';
}

function cancelLaserPlacement() {
    laserStartPoint = null;
    isPlacingLaser = false;
    canvas.style.cursor = 'default';
}



// Gestion de la palette d'outils
document.querySelectorAll('input[name="tool"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        currentTool = e.target.value;
        
        // Réinitialiser l'état de placement si on change d'outil
        if (currentTool !== 'spacecraft') {
            cancelSpacecraftPlacement();
        }
        if (currentTool !== 'laser') {
            cancelLaserPlacement();
        }
        if (currentTool !== 'geodesic') {
            cancelGeodesicPlacement();
        }
        if (currentTool !== 'clock') {
            cancelClockPlacement();
        }
        
        // Mettre à jour le curseur
        if (currentTool === 'spacecraft') {
            canvas.style.cursor = 'crosshair';
        } else if (currentTool === 'laser') {
            canvas.style.cursor = 'crosshair';
        } else if (currentTool === 'geodesic') {
            canvas.style.cursor = 'crosshair';
        } else if (currentTool === 'clock') {
            canvas.style.cursor = 'crosshair';
        } else {
            canvas.style.cursor = 'default';
        }
    });
});

// Contrôles
document.getElementById('playPauseBtn').addEventListener('click', toggleAnimation);
document.getElementById('resetBtn').addEventListener('click', reset);

// Sliders
document.getElementById('speedSlider').addEventListener('input', (e) => {
    propagationSpeed = parseFloat(e.target.value);
    document.getElementById('speedValue').textContent = propagationSpeed.toFixed(1) + ' × c';
});

document.getElementById('forceScaleSlider').addEventListener('input', (e) => {
    forceScale = parseFloat(e.target.value);
    document.getElementById('forceScaleValue').textContent = forceScale.toFixed(1);
});

document.getElementById('gridResolutionSlider').addEventListener('input', (e) => {
    gridResolution = parseInt(e.target.value);
    spacing = canvas.width / gridResolution;
    document.getElementById('gridResolutionValue').textContent = gridResolution + ' × ' + gridResolution;
});

// Toggles de visualisation
document.getElementById('showGridToggle').addEventListener('change', (e) => {
    showGrid = e.target.checked;
});

document.getElementById('showVectorsToggle').addEventListener('change', (e) => {
    showVectors = e.target.checked;
});

document.getElementById('showPropagationToggle').addEventListener('change', (e) => {
    showPropagation = e.target.checked;
});





// Initialisation
initializeVersionManager(masses, spacing, gridResolution);
initializeMassManager();
initializeBlackHoleManager();
    initializeSpacecraftManager();
    initializeLaserManager();
    initializeGeodesicManager();
    initializeClockManager();

// Initialisation du contexte global (après les modules)
initializeAppContext(canvas, ctx, updateDebugInfo, recalculateAllGeodesics, getGridVersionIndex, getGridVersions, getMassesForVersion);

// Synchroniser les variables locales avec le contexte global
masses = AppContext.masses;
propagationFronts = AppContext.propagationFronts;
spacecrafts = AppContext.spacecrafts;
window.lasers = AppContext.lasers;
geodesics = AppContext.geodesics;

// Initialiser les modules de rendu immédiatement
initializeGridRenderer(ctx, canvas, spacing, showGrid);
initializeMassRenderer(ctx, masses);
initializeSpacecraftRenderer(ctx, canvas, spacecrafts, isPlacingSpacecraft, spacecraftStartPoint, mousePosition);
    initializeLaserRenderer(ctx, window.lasers || [], isPlacingLaser, laserStartPoint, mousePosition, getGridVersionIndex, getGridVersions, getMassesForVersion, calculateGravitationalRedshift, redshiftToColor, masses);
initializeVectorRenderer(ctx, canvas, spacing, showVectors, forceScale, masses, getGridVersionIndex, getGridVersions, getMassesForVersion);
initializePropagationRenderer(ctx, canvas, propagationFronts, showPropagation, propagationSpeed, updateGridVersionsForFront);
    initializeGeodesicRenderer();
    initializeClockRenderer();

// Initialiser les paramètres et démarrer l'animation
document.addEventListener('DOMContentLoaded', () => {
    initializeGeodesicSettings();
    updateDebugInfo();
    animate();
}); 



