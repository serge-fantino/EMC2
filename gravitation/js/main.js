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
    document.getElementById('clockCount').textContent = clocks.length;
    
    // Mettre à jour le temps de référence
    document.getElementById('referenceTime').textContent = referenceClockTime.toFixed(2);
    
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
    clocks = AppContext.clocks;
    referenceClockTime = 0;
    
    // Réinitialiser les gestionnaires
    initializeVersionManager(masses, spacing, gridResolution);
    initializeMassManager();
    initializeBlackHoleManager();
    initializeSpacecraftManager();
    initializeLaserManager();
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
    clocks = AppContext.clocks;
    
    // Mettre à jour les références des modules de rendu
    updateMassReferences();
    updateBlackHoleReferences();
    updateSpacecraftManagerReferences();
    updateLaserManagerReferences();
    updateMasses(masses);
    updateSpacecraftReferences(spacecrafts, isPlacingSpacecraft, spacecraftStartPoint, mousePosition);
    // Synchroniser lasers avec window.lasers
    lasers = window.lasers || [];
    updateLaserReferences(lasers, isPlacingLaser, laserStartPoint, mousePosition, masses);
    updateVectorParameters(showVectors, forceScale, masses);
    updatePropagationParameters(propagationFronts, showPropagation, propagationSpeed);
    updateGeodesicReferences(geodesics, masses);
    updateClockReferences(clocks, masses);
    
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
let showGeodesicDebug = true; // Nouvelle variable pour afficher/masquer les infos de debug

// Variables globales pour les horloges
let referenceClockTime = 0; // Temps de l'horloge de référence (non affectée par la gravité)
let clocks = []; // Array des horloges placées sur la grille
let isPlacingClock = false;
let isMovingClock = false;
let selectedClock = null;

// Paramètres réglables pour les géodésiques
let geodesicSettings = {
    explorationStep: 0.5, // Réduit de 1.0 à 0.5 pour plus de précision
    curveStep: 10.0, // Augmenté de 5.0 à 10.0 pour une meilleure convergence
    maxSteps: 10000, // Augmenté à 10000 pour permettre les courbes complexes
    minGradientThreshold: 0.001,
    stopGradientThreshold: 0.001,
    minPoints: 3,
    minDistanceBetweenPoints: 2.0,
    maxAngle: 400, // Augmenté de 360 à 400 pour les courbes complexes
    boundingBoxMultiplier: 3,
    thicknessAmplification: 1.0 // Nouveau paramètre pour amplifier l'épaisseur
};

// Fonction pour calculer le gradient du potentiel gravitationnel
function calculateGravitationalGradient(x, y, masses) {
    let gradientX = 0;
    let gradientY = 0;
    
    masses.forEach(mass => {
        const dx = mass.x - x;
        const dy = mass.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Gradient du potentiel gravitationnel ∇Φ = GM/r² * (r/r)
            const gradientMagnitude = (G * mass.mass) / (distance * distance);
            gradientX += (dx / distance) * gradientMagnitude;
            gradientY += (dy / distance) * gradientMagnitude;
        }
    });
    
    return { x: gradientX, y: gradientY };
}



// Fonction pour ajouter une géodésique (courbe de niveau)
function addGeodesic(startX, startY) {
    // Vérifier d'abord si le champ gravitationnel est suffisamment fort
    const gradient = calculateGravitationalGradient(startX, startY, masses);
    const gradientMagnitude = Math.sqrt(gradient.x * gradient.x + gradient.y * gradient.y);
    
    if (gradientMagnitude < geodesicSettings.minGradientThreshold) {
        console.log('Champ gravitationnel trop faible pour créer une géodésique');
        return;
    }
    
    const geodesic = {
        startX: startX,
        startY: startY,
        points: [],
        maxLength: geodesicSettings.maxSteps,
        type: 'geodesic'
    };
    
    // Calculer les points de la géodésique
    calculateGeodesicPoints(geodesic);
    
    // Vérifier que la géodésique a une longueur suffisante
    if (geodesic.points.length < geodesicSettings.minPoints) {
        console.log('Géodésique trop courte, ignorée');
        return;
    }
    
    geodesics.push(geodesic);
    console.log('Géodésique ajoutée:', geodesic);
}

// Fonction pour calculer les points d'une géodésique (perpendiculaire au gradient)
function calculateGeodesicPoints(geodesic) {
    geodesic.points = [];
    
    const explorationStep = geodesicSettings.explorationStep;
    const curveStep = geodesicSettings.curveStep;
    const maxSteps = geodesicSettings.maxSteps;
    const maxAngle = geodesicSettings.maxAngle;
    const boundingBoxMultiplier = geodesicSettings.boundingBoxMultiplier;
    
    let x = geodesic.startX;
    let y = geodesic.startY;
    let distanceTraveled = 0;
    let lastCurvePoint = { x: x, y: y };
    
    // Calculer le centre de la bounding box étendue
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxDistance = Math.max(canvas.width, canvas.height) * boundingBoxMultiplier / 2;
    
    // Variables pour le suivi de l'angle
    let totalAngle = 0;
    let lastDirection = null;
    
    // Ajouter le point de départ
    geodesic.points.push({ x: x, y: y });
    
    // Calculer dans une seule direction jusqu'à fermeture ou limite
    for (let step = 0; step < maxSteps; step++) {
        // Calculer le gradient à la position actuelle
        const gradient = calculateGravitationalGradient(x, y, masses);
        
        // Si le gradient est trop faible, arrêter
        const gradientMagnitude = Math.sqrt(gradient.x * gradient.x + gradient.y * gradient.y);
        if (gradientMagnitude < geodesicSettings.stopGradientThreshold) {
            break;
        }
        
        // La géodésique est perpendiculaire au gradient
        // Si gradient = (gx, gy), alors direction = (-gy, gx)
        const geodesicDirX = -gradient.y;
        const geodesicDirY = gradient.x;
        
        // Normaliser la direction
        const directionVector = normalizeVector(geodesicDirX, geodesicDirY);
        
        // Calculer l'angle par rapport à la direction précédente
        if (lastDirection) {
            const dotProduct = lastDirection.x * directionVector.x + lastDirection.y * directionVector.y;
            const crossProduct = lastDirection.x * directionVector.y - lastDirection.y * directionVector.x;
            const angleChange = Math.atan2(crossProduct, dotProduct) * (180 / Math.PI);
            totalAngle += angleChange; // Supprimer Math.abs() pour tenir compte du signe
        }
        lastDirection = { x: directionVector.x, y: directionVector.y };
        
        // Vérifier si on a fait un tour complet (en valeur absolue)
        if (Math.abs(totalAngle) >= maxAngle) {
            console.log(`Géodésique fermée après ${totalAngle.toFixed(1)}° (courbure ${totalAngle >= 0 ? 'positive' : 'négative'})`);
            break;
        }
        
        // Nouveau cas d'arrêt : si courbure > 360° et proche du point de départ
        if (Math.abs(totalAngle) >= 360) {
            const distanceToStart = Math.sqrt((x - geodesic.startX) * (x - geodesic.startX) + (y - geodesic.startY) * (y - geodesic.startY));
            if (distanceToStart <= curveStep) {
                console.log(`Géodésique fermée naturellement à ${totalAngle.toFixed(1)}° (distance au départ: ${distanceToStart.toFixed(1)})`);
                break;
            }
        }
        
        // Avancer avec le pas d'exploration
        x += directionVector.x * explorationStep;
        y += directionVector.y * explorationStep;
        
        // Vérifier la bounding box étendue
        const distanceFromCenter = Math.sqrt((x - centerX) * (x - centerX) + (y - centerY) * (y - centerY));
        if (distanceFromCenter > maxDistance) {
            console.log(`Géodésique arrêtée par bounding box (distance: ${distanceFromCenter.toFixed(1)})`);
            break;
        }
        
        // Calculer la distance parcourue depuis le dernier point de courbe
        const dx = x - lastCurvePoint.x;
        const dy = y - lastCurvePoint.y;
        distanceTraveled += Math.sqrt(dx * dx + dy * dy);
        
        // Ajouter un point de courbe si on a parcouru assez de distance
        if (distanceTraveled >= curveStep) {
            geodesic.points.push({ x: x, y: y });
            lastCurvePoint = { x: x, y: y };
            distanceTraveled = 0;
        }
        
        // Arrêter si trop proche d'une masse (singularité)
        let tooClose = false;
        masses.forEach(mass => {
            const dx = mass.x - x;
            const dy = mass.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 15) {
                tooClose = true;
            }
        });
        if (tooClose) break;
    }
    
    // Éviter les doublons et les points trop proches
    geodesic.points = geodesic.points.filter((point, index) => {
        if (index === 0) return true;
        const prevPoint = geodesic.points[index - 1];
        const dx = point.x - prevPoint.x;
        const dy = point.y - prevPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance > geodesicSettings.minDistanceBetweenPoints;
    });
    
    // Ajouter des informations sur la géodésique
    geodesic.totalAngle = totalAngle;
    geodesic.isClosed = Math.abs(totalAngle) >= maxAngle;
    geodesic.steps = geodesic.points.length;
}

// Fonction pour recalculer toutes les géodésiques
function recalculateAllGeodesics() {
    geodesics.forEach(geodesic => {
        calculateGeodesicPoints(geodesic);
    });
}

// Fonction pour mettre à jour les géodésiques (maintenant statiques)
function updateGeodesics(deltaTime) {
    // Les géodésiques sont statiques, pas besoin de mise à jour continue
    // Elles sont recalculées seulement quand les masses changent
}

// Fonction pour calculer la dilatation temporelle gravitationnelle
function calculateGravitationalTimeDilation(x, y, masses) {
    // Calculer le potentiel gravitationnel Φ = -GM/r
    let potential = 0;
    masses.forEach(mass => {
        const dx = mass.x - x;
        const dy = mass.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
            potential -= G * mass.mass / distance;
        }
    });
    
    // Dilatation temporelle : dt = dt₀ * √(1 + 2Φ/c²)
    // Pour de faibles potentiels : dt ≈ dt₀ * (1 + Φ/c²)
    const timeDilationFactor = 1 + potential / (c * c);
    
    return Math.max(0.1, timeDilationFactor); // Éviter les valeurs négatives
}

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
        const clickedClock = clocks.find(clock => {
            const dx = x - clock.x;
            const dy = y - clock.y;
            return Math.sqrt(dx * dx + dy * dy) < 15; // Zone de clic
        });
        
        if (clickedClock) {
            // Commencer le déplacement d'une horloge existante
            isMovingClock = true;
            selectedClock = clickedClock;
            selectedClock.isSelected = true;
            canvas.style.cursor = 'move';
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
    } else if (currentTool === 'clock' && isMovingClock) {
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
    if (isMovingClock && selectedClock) {
        selectedClock.x = mousePosition.x;
        selectedClock.y = mousePosition.y;
        return;
    }
});

// Gestion de la fin du déplacement d'horloge
canvas.addEventListener('mouseup', (e) => {
    if (isMovingClock && selectedClock) {
        isMovingClock = false;
        selectedClock.isSelected = false;
        selectedClock = null;
        canvas.style.cursor = 'default';
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
    } else if (e.key === 'Escape' && isMovingClock) {
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

function cancelGeodesicPlacement() {
    geodesicStartPoint = null;
    isPlacingGeodesic = false;
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

// Gestion des réglages des géodésiques
function initializeGeodesicSettings() {
    // Mettre à jour les valeurs affichées
    function updateDisplayValue(id, value) {
        const element = document.getElementById(id + 'Value');
        if (element) {
            element.textContent = value;
        }
    }
    
    // Gestionnaires pour les sliders
    const settings = [
        'explorationStep', 'curveStep', 'maxSteps', 
        'minGradientThreshold', 'stopGradientThreshold', 
        'minPoints', 'minDistanceBetweenPoints', 'maxAngle', 
        'boundingBoxMultiplier', 'thicknessAmplification'
    ];
    
    settings.forEach(setting => {
        const element = document.getElementById(setting);
        if (element) {
            // Initialiser l'affichage
            updateDisplayValue(setting, geodesicSettings[setting]);
            
            element.addEventListener('input', (e) => {
                geodesicSettings[setting] = parseFloat(e.target.value);
                updateDisplayValue(setting, e.target.value);
            });
        }
    });
    
    // Gestionnaire pour le toggle des infos de debug
    const debugToggle = document.getElementById('showGeodesicDebugToggle');
    if (debugToggle) {
        debugToggle.addEventListener('change', (e) => {
            showGeodesicDebug = e.target.checked;
        });
    }
    
    // Bouton de recalcul
    const recalcButton = document.getElementById('recalculateGeodesics');
    if (recalcButton) {
        recalcButton.addEventListener('click', () => {
            recalculateAllGeodesics();
            console.log('Toutes les géodésiques recalculées avec les nouveaux paramètres');
        });
    }
    
    // Bouton d'effacement
    const clearButton = document.getElementById('clearGeodesics');
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            geodesics = [];
            console.log('Toutes les géodésiques effacées');
        });
    }
}

// Initialiser les réglages au chargement
document.addEventListener('DOMContentLoaded', () => {
    initializeGeodesicSettings();
});

// Initialisation du contexte global
initializeAppContext(canvas, ctx, updateDebugInfo, recalculateAllGeodesics, getGridVersionIndex, getGridVersions, getMassesForVersion);

// Synchroniser les variables locales avec le contexte global
masses = AppContext.masses;
propagationFronts = AppContext.propagationFronts;
spacecrafts = AppContext.spacecrafts;
window.lasers = AppContext.lasers;
geodesics = AppContext.geodesics;
clocks = AppContext.clocks;

// Initialisation
initializeVersionManager(masses, spacing, gridResolution);
initializeMassManager();
initializeBlackHoleManager();
    initializeSpacecraftManager();
    initializeLaserManager();

// Initialiser les modules de rendu immédiatement
initializeGridRenderer(ctx, canvas, spacing, showGrid);
initializeMassRenderer(ctx, masses);
initializeSpacecraftRenderer(ctx, canvas, spacecrafts, isPlacingSpacecraft, spacecraftStartPoint, mousePosition);
    initializeLaserRenderer(ctx, window.lasers || [], isPlacingLaser, laserStartPoint, mousePosition, getGridVersionIndex, getGridVersions, getMassesForVersion, calculateGravitationalRedshift, redshiftToColor, masses);
initializeVectorRenderer(ctx, canvas, spacing, showVectors, forceScale, masses, getGridVersionIndex, getGridVersions, getMassesForVersion);
initializePropagationRenderer(ctx, canvas, propagationFronts, showPropagation, propagationSpeed, updateGridVersionsForFront);
initializeGeodesicRenderer(ctx, geodesics, masses);
    initializeClockRenderer(ctx, clocks, getGridVersionIndex, getGridVersions, getMassesForVersion, calculateGravitationalTimeDilation, masses);

// Initialiser les paramètres et démarrer l'animation
document.addEventListener('DOMContentLoaded', () => {
    initializeGeodesicSettings();
    updateDebugInfo();
    animate();
}); 

// Fonction pour ajouter une horloge
function addClock(x, y) {
    const clock = {
        x: x,
        y: y,
        referenceTime: referenceClockTime, // Temps de référence au moment de la création
        localTime: referenceClockTime, // Temps local (sera mis à jour)
        isSelected: false
    };
    
    clocks.push(clock);
    console.log(`Horloge ajoutée à (${x}, ${y}), temps de référence: ${referenceClockTime.toFixed(2)}s`);
}

// Fonction pour mettre à jour les horloges
function updateClocks(deltaTime) {
    // Mettre à jour le temps de référence
    referenceClockTime += deltaTime;
    
    // Mettre à jour chaque horloge
    clocks.forEach(clock => {
        // Obtenir les masses à la position de l'horloge (avec propagation causale)
        const { gridX, gridY } = getGridVersionIndex(clock.x, clock.y);
        const gridVersions = getGridVersions();
        const pointVersion = gridVersions[gridX] && gridVersions[gridX][gridY] !== undefined 
            ? gridVersions[gridX][gridY] : 0;
        const versionMasses = getMassesForVersion(pointVersion, masses);
        
        // Calculer la dilatation temporelle
        const timeDilationFactor = calculateGravitationalTimeDilation(clock.x, clock.y, versionMasses);
        
        // Mettre à jour le temps local
        clock.localTime += deltaTime * timeDilationFactor;
    });
}





function cancelClockPlacement() {
    isPlacingClock = false;
    isMovingClock = false;
    if (selectedClock) {
        selectedClock.isSelected = false;
        selectedClock = null;
    }
    canvas.style.cursor = 'default';
}

