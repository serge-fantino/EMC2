/**
 * Visualiseur de Propagation Gravitationnelle
 * Version simplifiée qui fonctionne
 */

// ===== IMPORTS DES MODULES PHYSIQUES =====
import { 
    calculateGravitationalRedshift
} from './core/PhysicsUtils.js';

// ===== IMPORTS DU CONTEXTE GLOBAL =====
import { AppContext, initializeAppContext, resetAppContext } from './core/AppContext.js';

// ===== IMPORTS DES GESTIONNAIRES CORE =====
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

import {
    initializeMassManager,
    addMass,
    removeMass
} from './core/MassManager.js';

import {
    initializeBlackHoleManager,
    addBlackHole,
    removeBlackHole,
    findBlackHoleAt
} from './core/BlackHoleManager.js';

import {
    initializeSpacecraftManager,
    addSpacecraft,
    updateSpacecrafts,
    removeSpacecraft,
    clearSpacecrafts
} from './core/SpacecraftManager.js';

import {
    initializeLaserManager,
    addLaser,
    updateLasers,
    removeLaser,
    clearLasers
} from './core/LaserManager.js';

import {
    initializeGeodesicManager,
    addGeodesic,
    recalculateAllGeodesics,
    updateGeodesics,
    removeGeodesic,
    clearGeodesics,
    cancelGeodesicPlacement
} from './core/GeodesicManager.js';

import { 
    initializeClockManager, 
    addClock, 
    updateClocks, 
    cancelClockPlacement 
} from './core/ClockManager.js';

import { 
    initializePropagationManager,
    updatePropagationFronts
} from './core/PropagationManager.js';

import { initializeGeodesicSettings } from './core/GeodesicSettingsManager.js';

// ===== IMPORTS DES MODULES DE RENDU =====
import {
    initializeGridRenderer,
    drawGrid
} from './rendering/GridRenderer.js';

import {
    initializeMassRenderer,
    drawMasses
} from './rendering/MassRenderer.js';

import {
    initializeSpacecraftRenderer,
    drawSpacecrafts
} from './rendering/SpacecraftRenderer.js';

import {
    initializeLaserRenderer,
    drawLasers
} from './rendering/LaserRenderer.js';

import {
    initializeVectorRenderer,
    drawVectors
} from './rendering/VectorRenderer.js';

import {
    initializePropagationRenderer,
    drawPropagation
} from './rendering/PropagationRenderer.js';

import {
    initializeGeodesicRenderer,
    updateReferences as updateGeodesicReferences,
    drawGeodesics
} from './rendering/GeodesicRenderer.js';

import {
    initializeClockRenderer,
    drawClocks
} from './rendering/ClockRenderer.js';

// Variables globales
const canvas = document.getElementById('gravityCanvas');
const ctx = canvas.getContext('2d');

let animationRunning = true;

// Mode d'outil actuel
let currentTool = 'mass'; // 'mass', 'spacecraft', 'blackhole', 'laser'




    
// Fonctions de base
// addMass et removeMass sont maintenant dans MassManager.js

// Gestion des vaisseaux spatiaux
// addSpacecraft est maintenant dans SpacecraftManager.js

// addBlackHole est maintenant dans BlackHoleManager.js

// addLaser est maintenant dans LaserManager.js

// updateSpacecrafts est maintenant dans SpacecraftManager.js

// updateLasers est maintenant dans LaserManager.js











function updateDebugInfo() {
    // Mettre à jour les informations de debug
    document.getElementById('massCount').textContent = AppContext.masses.length;
    document.getElementById('versionInfo').textContent = getCurrentVersion();
    document.getElementById('spacecraftCount').textContent = AppContext.spacecrafts.length;
    document.getElementById('laserCount').textContent = AppContext.lasers ? AppContext.lasers.length : 0;
    document.getElementById('geodesicCount').textContent = AppContext.geodesics.length;
    document.getElementById('clockCount').textContent = AppContext.clocks.length;
    
    // Mettre à jour le temps de référence
    document.getElementById('referenceTime').textContent = AppContext.referenceClockTime.toFixed(2);
    
    // Afficher des informations sur les géodésiques
    if (AppContext.geodesics.length > 0) {
        const closedCount = AppContext.geodesics.filter(g => g.isClosed).length;
        const avgAngle = AppContext.geodesics.reduce((sum, g) => sum + (g.totalAngle || 0), 0) / AppContext.geodesics.length;
        console.log(`Géodésiques: ${AppContext.geodesics.length} total, ${closedCount} fermées, angle moyen: ${avgAngle.toFixed(1)}°`);
    }
    
    // Calculer le redshift moyen des lasers
    let totalRedshift = 0;
    let laserCount = 0;
    if (AppContext.lasers && AppContext.lasers.length > 0) {
        AppContext.lasers.forEach(laser => {
            const { gridX, gridY } = getGridVersionIndex(laser.x, laser.y);
            const gridVersions = getGridVersions();
            const pointVersion = gridVersions[gridX] && gridVersions[gridX][gridY] !== undefined 
                ? gridVersions[gridX][gridY] : 0;
            const versionMasses = getMassesForVersion(pointVersion, AppContext.masses);
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
    // ===== RÉINITIALISATION DU CONTEXTE =====
    resetAppContext();
    
    // ===== RÉINITIALISATION DES GESTIONNAIRES =====
    initializeVersionManager(AppContext.masses, AppContext.spacing, AppContext.gridResolution);
    initializeMassManager();
    initializeBlackHoleManager();
    initializeSpacecraftManager();
    initializeLaserManager();
    initializeGeodesicManager();
    
    // ===== ANNULATION DES PLACEMENTS ACTIFS =====
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
    
    // ===== MISE À JOUR DES OBJETS DE SIMULATION =====
    updateSpacecrafts(deltaTime);
    updateLasers(deltaTime);
    updateGeodesics(deltaTime);
    updateClocks(deltaTime);
    updatePropagationFronts(deltaTime);
    
    // ===== MISE À JOUR DES RÉFÉRENCES =====
    updateGeodesicReferences(AppContext.geodesics, AppContext.masses);
    
    // ===== RENDU =====
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Ordre de rendu optimisé (arrière-plan vers premier plan)
    drawGrid();
    drawVectors();
    drawPropagation();
    drawGeodesics();
    drawMasses();
    drawSpacecrafts();
    drawLasers();
    drawClocks();
    
    requestAnimationFrame(animate);
}

// Plus de variables locales - tout est géré par AppContext



















// Gestion des événements
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (currentTool === 'mass') {
        addMass(x, y, false);
    } else if (currentTool === 'spacecraft') {
        if (!AppContext.isPlacingSpacecraft) {
            // Premier clic : définir le point de départ
            AppContext.spacecraftStartPoint = { x, y };
            AppContext.mousePosition = { x, y }; // Initialiser mousePosition avec la position du clic
            AppContext.isPlacingSpacecraft = true;
            canvas.style.cursor = 'crosshair';
            
            // Debug: forcer un redessinage immédiat
            console.log('Premier clic vaisseau:', { x, y, startPoint: AppContext.spacecraftStartPoint, mousePos: AppContext.mousePosition });
            
            // Forcer un cycle d'animation complet pour afficher la prévisualisation
            requestAnimationFrame(() => {
                animate();
            });
        } else {
            // Deuxième clic : confirmer le vecteur vitesse
            const directionX = AppContext.mousePosition.x - AppContext.spacecraftStartPoint.x;
            const directionY = AppContext.mousePosition.y - AppContext.spacecraftStartPoint.y;
            addSpacecraft(AppContext.spacecraftStartPoint.x, AppContext.spacecraftStartPoint.y, directionX, directionY);
            
            // Réinitialiser
            AppContext.spacecraftStartPoint = null;
            AppContext.isPlacingSpacecraft = false;
            canvas.style.cursor = 'default';
        }
    } else if (currentTool === 'blackhole') {
        addBlackHole(x, y, false); // Clic gauche
    } else if (currentTool === 'laser') {
        if (!AppContext.isPlacingLaser) {
            // Premier clic : définir le point de départ
            AppContext.laserStartPoint = { x, y };
            AppContext.mousePosition = { x, y }; // Initialiser mousePosition avec la position du clic
            AppContext.isPlacingLaser = true;
            canvas.style.cursor = 'crosshair';
            
            // Debug: forcer un redessinage immédiat
            console.log('Premier clic laser:', { x, y, startPoint: AppContext.laserStartPoint, mousePos: AppContext.mousePosition });
            
            // Forcer un cycle d'animation complet pour afficher la prévisualisation
            requestAnimationFrame(() => {
                animate();
            });
        } else {
            // Deuxième clic : confirmer la direction
            const directionX = AppContext.mousePosition.x - AppContext.laserStartPoint.x;
            const directionY = AppContext.mousePosition.y - AppContext.laserStartPoint.y;
            addLaser(AppContext.laserStartPoint.x, AppContext.laserStartPoint.y, directionX, directionY);
            
            // Réinitialiser
            AppContext.laserStartPoint = null;
            AppContext.isPlacingLaser = false;
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
    } else if (currentTool === 'spacecraft' && AppContext.isPlacingSpacecraft) {
        // Annuler le placement de vaisseau
        cancelSpacecraftPlacement();
    } else if (currentTool === 'laser' && AppContext.isPlacingLaser) {
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
    AppContext.mousePosition.x = e.clientX - rect.left;
    AppContext.mousePosition.y = e.clientY - rect.top;
    
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
    if (e.key === 'Escape' && AppContext.isPlacingSpacecraft) {
        cancelSpacecraftPlacement();
    } else if (e.key === 'Escape' && AppContext.isPlacingLaser) {
        cancelLaserPlacement();
    } else if (e.key === 'Escape' && isPlacingGeodesic) {
        cancelGeodesicPlacement();
    } else if (e.key === 'Escape' && AppContext.isMovingClock) {
        cancelClockPlacement();
    }
});

function cancelSpacecraftPlacement() {
    AppContext.spacecraftStartPoint = null;
    AppContext.isPlacingSpacecraft = false;
    canvas.style.cursor = 'default';
}

function cancelLaserPlacement() {
    AppContext.laserStartPoint = null;
    AppContext.isPlacingLaser = false;
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
    AppContext.propagationSpeed = parseFloat(e.target.value);
    document.getElementById('speedValue').textContent = AppContext.propagationSpeed.toFixed(1) + ' × c';
});

document.getElementById('forceScaleSlider').addEventListener('input', (e) => {
    AppContext.forceScale = parseFloat(e.target.value);
    document.getElementById('forceScaleValue').textContent = AppContext.forceScale.toFixed(1);
});

document.getElementById('gridResolutionSlider').addEventListener('input', (e) => {
    AppContext.gridResolution = parseInt(e.target.value);
    AppContext.spacing = canvas.width / AppContext.gridResolution;
    document.getElementById('gridResolutionValue').textContent = AppContext.gridResolution + ' × ' + AppContext.gridResolution;
});

// Toggles de visualisation
document.getElementById('showGridToggle').addEventListener('change', (e) => {
    AppContext.showGrid = e.target.checked;
});

document.getElementById('showVectorsToggle').addEventListener('change', (e) => {
    AppContext.showVectors = e.target.checked;
});

document.getElementById('showPropagationToggle').addEventListener('change', (e) => {
    AppContext.showPropagation = e.target.checked;
});





// ===== INITIALISATION DES GESTIONNAIRES =====
initializeVersionManager(AppContext.masses, AppContext.spacing, AppContext.gridResolution);
initializeMassManager();
initializeBlackHoleManager();
initializeSpacecraftManager();
initializeLaserManager();
initializeGeodesicManager();
initializeClockManager();
initializePropagationManager();

// ===== INITIALISATION DU CONTEXTE GLOBAL =====
initializeAppContext(canvas, ctx, updateDebugInfo, recalculateAllGeodesics, getGridVersionIndex, getGridVersions, getMassesForVersion, updateGridVersionsForFront);

// ===== INITIALISATION DES MODULES DE RENDU =====
initializeGridRenderer();
initializeMassRenderer();
initializeSpacecraftRenderer();
initializeLaserRenderer();
initializeVectorRenderer();
initializePropagationRenderer();
initializeGeodesicRenderer();
initializeClockRenderer();

// Initialiser les paramètres et démarrer l'animation
document.addEventListener('DOMContentLoaded', () => {
    initializeGeodesicSettings();
    updateDebugInfo();
    animate();
}); 



