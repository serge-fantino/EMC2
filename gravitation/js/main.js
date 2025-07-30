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
function addMass(x, y, isRightClick = false) {
    const gridPoint = getGridPoint(x, y);
    
    // Chercher une masse existante à cet endroit
    const existing = masses.find(m => 
        Math.abs(m.x - gridPoint.x) < spacing/2 && 
        Math.abs(m.y - gridPoint.y) < spacing/2
    );
    
    if (existing) {
        // Modifier masse existante
        console.log('Masse existante trouvée:', existing.type, 'masse:', existing.mass);
        const oldMass = existing.mass;
        if (isRightClick) {
            if (existing.type === 'blackhole') {
                // Pour les trous noirs : division par 2 avec minimum
                existing.mass = Math.max(1000, existing.mass / 2);
            } else {
                // Pour les autres masses : décrément de 1000
                existing.mass = Math.max(0, existing.mass - 1000);
                if (existing.mass <= 0) {
                    removeMass(existing);
                }
            }
        } else {
            if (existing.type === 'blackhole') {
                // Pour les trous noirs : multiplication par 2
                existing.mass *= 2;
                console.log('Trou noir agrandi:', existing.mass);
            } else {
                // Pour les autres masses : incrément de 1000
                existing.mass += 1000;
            }
        }
        
        // Créer un nouveau front de propagation si la masse a changé
        if (existing.mass !== oldMass) {
            const versionInfo = createNewVersion('modification', gridPoint.x, gridPoint.y, existing.mass - oldMass, masses);
            
            // Mettre à jour immédiatement la version du point où la masse est modifiée
            updateGridPointVersion(gridPoint.x, gridPoint.y, versionInfo.version);
            
            // Créer le front de propagation
            propagationFronts.push({
                x: versionInfo.x,
                y: versionInfo.y,
                startTime: Date.now(),
                spacing: spacing,
                version: versionInfo.version,
                type: versionInfo.type,
                massChange: versionInfo.massChange
            });
            // Recalculer toutes les géodésiques quand une masse change
            recalculateAllGeodesics();
        }
    } else if (!isRightClick) {
        // Créer nouvelle masse (seulement avec clic gauche)
        masses.push({ x: gridPoint.x, y: gridPoint.y, mass: 1000 });
        const versionInfo = createNewVersion('creation', gridPoint.x, gridPoint.y, 0, masses);
        
        // Mettre à jour immédiatement la version du point où la masse est créée
        updateGridPointVersion(gridPoint.x, gridPoint.y, versionInfo.version);
        
        // Créer le front de propagation
        propagationFronts.push({
            x: versionInfo.x,
            y: versionInfo.y,
            startTime: Date.now(),
            spacing: spacing,
            version: versionInfo.version,
            type: versionInfo.type,
            massChange: versionInfo.massChange
        });
        // Recalculer toutes les géodésiques quand une nouvelle masse est ajoutée
        recalculateAllGeodesics();
    }
    
    updateDebugInfo();
}

function removeMass(mass) {
    const index = masses.indexOf(mass);
    if (index > -1) {
        masses.splice(index, 1);
        // Supprimer aussi le front de propagation correspondant
        const frontIndex = propagationFronts.findIndex(f => f.x === mass.x && f.y === mass.y);
        if (frontIndex > -1) {
            propagationFronts.splice(frontIndex, 1);
        }
        // Recalculer toutes les géodésiques quand une masse est supprimée
        recalculateAllGeodesics();
    }
}

// Gestion des vaisseaux spatiaux
function addSpacecraft(x, y, directionX, directionY) {
    const gridPoint = getGridPoint(x, y);
    
    // Calculer la vitesse basée sur la distance (comme dans la prévisualisation)
    const distance = Math.sqrt(directionX * directionX + directionY * directionY);
    if (distance === 0) return;
    
    // Normaliser la direction
    const normalizedDirX = directionX / distance;
    const normalizedDirY = directionY / distance;
    
    // Calculer la vitesse initiale (même logique que la prévisualisation)
    const initialSpeed = Math.min(distance * 0.5, maxSpeed);
    
    // Créer le vaisseau
    const spacecraft = {
        x: gridPoint.x,
        y: gridPoint.y,
        vx: normalizedDirX * initialSpeed,
        vy: normalizedDirY * initialSpeed,
        trail: [], // Historique des positions
        maxTrailLength: 500, // Traces plus longues pour mieux voir les trajectoires
        mass: 1.0, // Masse du vaisseau pour les calculs gravitationnels
        creationTime: Date.now()
    };
    
    spacecrafts.push(spacecraft);
    updateDebugInfo();
}

function addBlackHole(x, y, isRightClick = false) {
    const gridPoint = getGridPoint(x, y);
    
    // Chercher un trou noir existant à cet endroit
    const existing = masses.find(m => 
        m.type === 'blackhole' &&
        Math.abs(m.x - gridPoint.x) < spacing/2 && 
        Math.abs(m.y - gridPoint.y) < spacing/2
    );
    
    if (existing) {
        // Modifier trou noir existant
        const oldMass = existing.mass;
        
        // Utiliser le paramètre isRightClick passé à la fonction
        
        if (isRightClick) {
            // Division par 2
            existing.mass = existing.mass / 2;
            console.log('Trou noir réduit:', existing.mass);
            
            // Supprimer si la masse devient trop petite
            if (existing.mass < 50000) {
                removeMass(existing);
                console.log('Trou noir supprimé (masse trop faible)');
                updateDebugInfo();
                return;
            }
        } else {
            // Multiplication par 2
            existing.mass *= 2;
            console.log('Trou noir agrandi:', existing.mass);
        }
        
        // Créer un nouveau front de propagation si la masse a changé
        if (existing.mass !== oldMass) {
            const versionInfo = createNewVersion('blackhole_modification', gridPoint.x, gridPoint.y, existing.mass - oldMass, masses);
            
            // Mettre à jour immédiatement la version du point où le trou noir est modifié
            updateGridPointVersion(gridPoint.x, gridPoint.y, versionInfo.version);
            
            // Créer le front de propagation
            propagationFronts.push({
                x: versionInfo.x,
                y: versionInfo.y,
                startTime: Date.now(),
                spacing: spacing,
                version: versionInfo.version,
                type: versionInfo.type,
                massChange: versionInfo.massChange
            });
            
            // Recalculer toutes les géodésiques quand un trou noir change
            recalculateAllGeodesics();
        }
    } else {
        // Créer un nouveau trou noir
        const blackHole = {
            x: gridPoint.x,
            y: gridPoint.y,
            mass: 100000, // Masse énorme !
            type: 'blackhole',
            creationTime: Date.now()
        };
        
        masses.push(blackHole);
        
        // Créer un front de propagation pour le trou noir
        const versionInfo = createNewVersion('blackhole_creation', gridPoint.x, gridPoint.y, 0, masses);
        
        // Mettre à jour immédiatement la version du point où le trou noir est créé
        updateGridPointVersion(gridPoint.x, gridPoint.y, versionInfo.version);
        
        // Créer le front de propagation
        propagationFronts.push({
            x: versionInfo.x,
            y: versionInfo.y,
            startTime: Date.now(),
            spacing: spacing,
            version: versionInfo.version,
            type: versionInfo.type,
            massChange: versionInfo.massChange
        });
        
        // Recalculer toutes les géodésiques quand un trou noir est ajouté
        recalculateAllGeodesics();
    }
    
    updateDebugInfo();
}

function addLaser(x, y, directionX, directionY) {
    const gridPoint = getGridPoint(x, y);
    
    // Normaliser la direction
    const distance = Math.sqrt(directionX * directionX + directionY * directionY);
    if (distance === 0) return;
    
    const normalizedDirX = directionX / distance;
    const normalizedDirY = directionY / distance;
    
    // Créer le laser avec vitesse constante c
    const laser = {
        x: gridPoint.x,
        y: gridPoint.y,
        vx: normalizedDirX * c, // Vitesse constante c
        vy: normalizedDirY * c,
        trail: [], // Historique des positions
        maxTrailLength: 300, // Traces plus courtes que les vaisseaux
        creationTime: Date.now()
    };
    
    // Ajouter le laser à la liste globale
    if (!window.lasers) {
        window.lasers = [];
    }
    window.lasers.push(laser);
    updateDebugInfo();
}

function updateSpacecrafts(deltaTime) {
    spacecrafts.forEach(spacecraft => {
        // Calculer la force gravitationnelle totale
        let totalForceX = 0;
        let totalForceY = 0;
        let closestBlackHole = null;
        let minDistance = Infinity;
        
        // Utiliser les masses de la version actuelle du point où se trouve le vaisseau
        const { gridX, gridY } = getGridVersionIndex(spacecraft.x, spacecraft.y);
        const gridVersions = getGridVersions();
        const pointVersion = gridVersions[gridX] && gridVersions[gridX][gridY] !== undefined 
            ? gridVersions[gridX][gridY] : 0;
        const versionMasses = getMassesForVersion(pointVersion, masses);
        
        versionMasses.forEach(mass => {
            const dx = mass.x - spacecraft.x;
            const dy = mass.y - spacecraft.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const force = (mass.mass * spacecraft.mass) / (distance * distance);
                const forceX = (dx / distance) * force;
                const forceY = (dy / distance) * force;
                
                totalForceX += forceX;
                totalForceY += forceY;
                
                // Vérifier si c'est un trou noir et le plus proche
                if (mass.type === 'blackhole' && distance < minDistance) {
                    closestBlackHole = mass;
                    minDistance = distance;
                }
            }
        });
        
        // Vérifier la capture par trou noir (horizon des événements)
        if (closestBlackHole) {
            const eventHorizonRadius = calculateEventHorizon(closestBlackHole.mass);
            const currentSpeed = Math.sqrt(spacecraft.vx * spacecraft.vx + spacecraft.vy * spacecraft.vy);
            
            // Si le vaisseau traverse l'horizon des événements, il est capturé
            if (minDistance <= eventHorizonRadius) {
                console.log(`Vaisseau capturé par trou noir: distance=${minDistance.toFixed(1)}, horizon=${eventHorizonRadius.toFixed(1)}`);
                // Le vaisseau est capturé par le trou noir
                const index = spacecrafts.indexOf(spacecraft);
                if (index > -1) {
                    spacecrafts.splice(index, 1);
                }
                return; // Ne pas continuer la mise à jour
            }
        }
        
        // Appliquer la force (F = ma, donc a = F/m)
        const accelerationX = totalForceX / spacecraft.mass;
        const accelerationY = totalForceY / spacecraft.mass;
        
        // Mettre à jour la vitesse (v = v0 + at)
        spacecraft.vx += accelerationX * deltaTime * 0.001; // Convertir en secondes
        spacecraft.vy += accelerationY * deltaTime * 0.001;
        
        // Limiter la vitesse maximale (effet relativiste)
        const currentSpeed = Math.sqrt(spacecraft.vx * spacecraft.vx + spacecraft.vy * spacecraft.vy);
        
        if (currentSpeed > maxSpeed) {
            const scale = maxSpeed / currentSpeed;
            spacecraft.vx *= scale;
            spacecraft.vy *= scale;
        }
        
        // Mettre à jour la position (x = x0 + vt)
        spacecraft.x += spacecraft.vx * deltaTime * 0.001;
        spacecraft.y += spacecraft.vy * deltaTime * 0.001;
        
        // Ajouter à la trajectoire
        spacecraft.trail.push({ x: spacecraft.x, y: spacecraft.y });
        if (spacecraft.trail.length > spacecraft.maxTrailLength) {
            spacecraft.trail.shift();
        }
        
        // Vérifier les limites du canvas
        if (spacecraft.x < 0 || spacecraft.x > canvas.width || 
            spacecraft.y < 0 || spacecraft.y > canvas.height) {
            // Supprimer le vaisseau s'il sort du canvas
            const index = spacecrafts.indexOf(spacecraft);
            if (index > -1) {
                spacecrafts.splice(index, 1);
            }
        }
    });
}

function updateLasers(deltaTime) {
    if (!window.lasers) return;
    
    window.lasers.forEach((laser, index) => {
        // Calculer la force gravitationnelle totale (seulement pour dévier la direction)
        let totalForceX = 0;
        let totalForceY = 0;
        
        // Utiliser les masses de la version actuelle du point où se trouve le laser
        const { gridX, gridY } = getGridVersionIndex(laser.x, laser.y);
        const gridVersions = getGridVersions();
        const pointVersion = gridVersions[gridX] && gridVersions[gridX][gridY] !== undefined 
            ? gridVersions[gridX][gridY] : 0;
        const versionMasses = getMassesForVersion(pointVersion, masses);
        
        versionMasses.forEach(mass => {
            const dx = mass.x - laser.x;
            const dy = mass.y - laser.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                // Force gravitationnelle (même effet que pour les vaisseaux)
                const force = (mass.mass * 1.0) / (distance * distance); // Même effet que les vaisseaux
                const forceX = (dx / distance) * force;
                const forceY = (dy / distance) * force;
                
                totalForceX += forceX;
                totalForceY += forceY;
            }
        });
        
        // Appliquer la force pour dévier la direction (mais garder la vitesse constante)
        const currentSpeed = Math.sqrt(laser.vx * laser.vx + laser.vy * laser.vy);
        
        // Modifier la vitesse en ajoutant l'effet gravitationnel
        laser.vx += totalForceX * deltaTime * 0.001;
        laser.vy += totalForceY * deltaTime * 0.001;
        
        // Re-normaliser pour maintenir la vitesse constante c
        const newSpeed = Math.sqrt(laser.vx * laser.vx + laser.vy * laser.vy);
        if (newSpeed > 0) {
            laser.vx = (laser.vx / newSpeed) * c;
            laser.vy = (laser.vy / newSpeed) * c;
        }
        
        // Mettre à jour la position
        laser.x += laser.vx * deltaTime * 0.001;
        laser.y += laser.vy * deltaTime * 0.001;
        
        // Ajouter à la trajectoire
        laser.trail.push({ x: laser.x, y: laser.y });
        if (laser.trail.length > laser.maxTrailLength) {
            laser.trail.shift();
        }
        
        // Supprimer le laser s'il sort du canvas
        if (laser.x < 0 || laser.x > canvas.width || 
            laser.y < 0 || laser.y > canvas.height) {
            window.lasers.splice(index, 1);
        }
    });
}

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
    masses = [];
    propagationFronts = [];
    spacecrafts = [];
    window.lasers = [];
    geodesics = [];
    clocks = [];
    referenceClockTime = 0;
    initializeVersionManager(masses, spacing, gridResolution);
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
    updateLasers(deltaTime); // Mettre à jour les lasers
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Mettre à jour les géodésiques
    updateGeodesics(deltaTime);
    
    // Mettre à jour les horloges
    updateClocks(deltaTime);
    
    // Mettre à jour les références des modules de rendu
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

// Initialisation
initializeVersionManager(masses, spacing, gridResolution);

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

