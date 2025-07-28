/**
 * Visualiseur de Propagation Gravitationnelle
 * Version simplifiée qui fonctionne
 */

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
let spacecraftSpeed = 2.0; // Vitesse initiale des vaisseaux (en unités arbitraires)
const maxSpeed = 50; // Vitesse maximale (équivalent à c = 100%)

// Constantes physiques pour les trous noirs
const G = 1.0; // Constante gravitationnelle (normalisée)
const c = maxSpeed; // Vitesse de la lumière

// Fonction pour calculer l'horizon des événements d'un trou noir
function calculateEventHorizon(mass) {
    // R = 2GM/c² (rayon de Schwarzschild)
    return (2 * G * mass) / (c * c);
}

// Fonction pour calculer le redshift gravitationnel
function calculateGravitationalRedshift(x, y, masses) {
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
    
    // Redshift z = ΔΦ/c²
    // Amplification maximale pour visualisation spectaculaire
    const redshift = totalPotential / (c * c * 1); // Réduit de 10 à 1 (10x plus sensible)
    
    return Math.max(-2.0, Math.min(2.0, redshift)); // Limiter entre -2.0 et 2.0
}

// Fonction pour convertir redshift en couleur
function redshiftToColor(redshift) {
    // redshift négatif = blueshift (plus bleu)
    // redshift positif = redshift (plus rouge)
    // redshift = 0 = vert (couleur de base)
    
    if (redshift < 0) {
        // Blueshift : vert → bleu → violet
        const intensity = Math.abs(redshift) / 2.0; // Normaliser à 0-1
        const r = 0;
        const g = Math.round(255 * (1 - intensity));
        const b = Math.round(255 * (0.5 + intensity * 0.5)); // Bleu plus intense
        return `rgb(${r}, ${g}, ${b})`;
    } else {
        // Redshift : vert → rouge → orange
        const intensity = redshift / 2.0; // Normaliser à 0-1
        const r = Math.round(255 * (0.5 + intensity * 0.5)); // Rouge plus intense
        const g = Math.round(255 * (1 - intensity));
        const b = 0;
        return `rgb(${r}, ${g}, ${b})`;
    }
}

// Système de versions (nouveau)
let currentVersion = 0;
let massHistory = []; // Historique des configurations de masses
let gridVersions = []; // Version de chaque point de grille
let maxVersions = 50; // Limite pour le round-robin
    
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
        const oldMass = existing.mass;
        if (isRightClick) {
            existing.mass = Math.max(0, existing.mass - 25);
            if (existing.mass <= 0) {
                removeMass(existing);
            }
        } else {
            existing.mass += 25;
        }
        
        // Créer un nouveau front de propagation si la masse a changé
        if (existing.mass !== oldMass) {
            createNewVersion('modification', gridPoint.x, gridPoint.y, existing.mass - oldMass);
        }
    } else if (!isRightClick) {
        // Créer nouvelle masse (seulement avec clic gauche)
        masses.push({ x: gridPoint.x, y: gridPoint.y, mass: 50 });
        createNewVersion('creation', gridPoint.x, gridPoint.y, 0);
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

function addBlackHole(x, y) {
    const gridPoint = getGridPoint(x, y);
    
    // Créer le trou noir central (masse énorme)
    const blackHole = {
        x: gridPoint.x,
        y: gridPoint.y,
        mass: 100000, // Masse énorme !
        type: 'blackhole',
        creationTime: Date.now()
    };
    
    masses.push(blackHole);
    
    // Créer un front de propagation pour le trou noir
    createNewVersion('blackhole_creation', gridPoint.x, gridPoint.y, 0);
    
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
        const pointVersion = gridVersions[gridX] && gridVersions[gridX][gridY] !== undefined 
            ? gridVersions[gridX][gridY] : 0;
        const versionMasses = getMassesForVersion(pointVersion);
        
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
        const pointVersion = gridVersions[gridX] && gridVersions[gridX][gridY] !== undefined 
            ? gridVersions[gridX][gridY] : 0;
        const versionMasses = getMassesForVersion(pointVersion);
        
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

// Fonction pour ajouter une géodésique
function addGeodesic(x, y, directionX, directionY) {
    const distance = Math.sqrt(directionX * directionX + directionY * directionY);
    if (distance === 0) return;
    
    const normalizedDirX = directionX / distance;
    const normalizedDirY = directionY / distance;
    
    const geodesic = {
        x: x,
        y: y,
        vx: normalizedDirX * 2, // Vitesse initiale pour les géodésiques
        vy: normalizedDirY * 2,
        trail: [{ x: x, y: y }],
        maxTrailLength: 400,
        type: 'geodesic'
    };
    
    geodesics.push(geodesic);
    console.log('Géodésique ajoutée:', geodesic);
}

// Fonction pour mettre à jour les géodésiques selon l'équation des géodésiques
function updateGeodesics(deltaTime) {
    geodesics.forEach(geodesic => {
        // Obtenir la version des masses à la position actuelle
        const { gridX, gridY } = getGridVersionIndex(geodesic.x, geodesic.y);
        const pointVersion = gridVersions[gridX] && gridVersions[gridX][gridY] !== undefined 
            ? gridVersions[gridX][gridY] : 0;
        const versionMasses = getMassesForVersion(pointVersion);
        
        // Calculer les symboles de Christoffel
        const christoffel = calculateChristoffelSymbols(geodesic.x, geodesic.y, versionMasses);
        
        // Équation des géodésiques : d²x^μ/dτ² + Γ^μ_αβ (dx^α/dτ)(dx^β/dτ) = 0
        // En 2D, on simplifie en considérant seulement les composantes spatiales
        
        // Accélération due à la courbure
        const ax = -(christoffel.xxx * geodesic.vx * geodesic.vx + 
                    2 * christoffel.xxy * geodesic.vx * geodesic.vy + 
                    christoffel.xyy * geodesic.vy * geodesic.vy);
        
        const ay = -(christoffel.yxx * geodesic.vx * geodesic.vx + 
                    2 * christoffel.yxy * geodesic.vx * geodesic.vy + 
                    christoffel.yyy * geodesic.vy * geodesic.vy);
        
        // Mettre à jour la vitesse
        geodesic.vx += ax * deltaTime;
        geodesic.vy += ay * deltaTime;
        
        // Limiter la vitesse
        const speed = Math.sqrt(geodesic.vx * geodesic.vx + geodesic.vy * geodesic.vy);
        if (speed > maxSpeed) {
            geodesic.vx = (geodesic.vx / speed) * maxSpeed;
            geodesic.vy = (geodesic.vy / speed) * maxSpeed;
        }
        
        // Mettre à jour la position
        geodesic.x += geodesic.vx * deltaTime;
        geodesic.y += geodesic.vy * deltaTime;
        
        // Ajouter à la trajectoire
        geodesic.trail.push({ x: geodesic.x, y: geodesic.y });
        if (geodesic.trail.length > geodesic.maxTrailLength) {
            geodesic.trail.shift();
        }
        
        // Supprimer si hors du canvas
        if (geodesic.x < 0 || geodesic.x > canvas.width || 
            geodesic.y < 0 || geodesic.y > canvas.height) {
            const index = geodesics.indexOf(geodesic);
            if (index > -1) {
                geodesics.splice(index, 1);
            }
        }
    });
}

// Fonction pour dessiner les géodésiques
function drawGeodesics() {
    // Dessiner les géodésiques existantes
    if (geodesics && geodesics.length > 0) {
        geodesics.forEach(geodesic => {
            // Dessiner la trajectoire avec couleur violette pour les géodésiques
            if (geodesic.trail.length > 1) {
                ctx.strokeStyle = '#8A2BE2'; // Violet pour les géodésiques
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]); // Ligne pointillée
                ctx.beginPath();
                ctx.moveTo(geodesic.trail[0].x, geodesic.trail[0].y);
                
                for (let i = 1; i < geodesic.trail.length; i++) {
                    ctx.lineTo(geodesic.trail[i].x, geodesic.trail[i].y);
                }
                ctx.stroke();
                ctx.setLineDash([]); // Réinitialiser
            }
            
            // Dessiner le point de la géodésique
            ctx.fillStyle = '#8A2BE2';
            ctx.beginPath();
            ctx.arc(geodesic.x, geodesic.y, 4, 0, 2 * Math.PI);
            ctx.fill();
            
            // Ajouter un effet lumineux
            ctx.shadowColor = '#8A2BE2';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(geodesic.x, geodesic.y, 8, 0, 2 * Math.PI);
            ctx.fill();
            ctx.shadowBlur = 0;
        });
    }
    
    // Dessiner l'indicateur de placement de géodésique
    if (isPlacingGeodesic && geodesicStartPoint) {
        // Cercle de placement
        ctx.strokeStyle = '#8A2BE2';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(geodesicStartPoint.x, geodesicStartPoint.y, 20, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Vecteur de direction
        if (mousePosition) {
            const dx = mousePosition.x - geodesicStartPoint.x;
            const dy = mousePosition.y - geodesicStartPoint.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const normalizedDirX = dx / distance;
                const normalizedDirY = dy / distance;
                
                ctx.strokeStyle = '#8A2BE2';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(geodesicStartPoint.x, geodesicStartPoint.y);
                ctx.lineTo(
                    geodesicStartPoint.x + normalizedDirX * 30,
                    geodesicStartPoint.y + normalizedDirY * 30
                );
                ctx.stroke();
                
                // Texte explicatif
                ctx.fillStyle = '#8A2BE2';
                ctx.font = '14px Arial';
                ctx.textAlign = 'left';
                ctx.fillText('Géodésique Einsteinienne', geodesicStartPoint.x + 35, geodesicStartPoint.y - 10);
                ctx.fillText('Clic pour confirmer', geodesicStartPoint.x + 35, geodesicStartPoint.y + 10);
            }
        }
    }
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
    document.getElementById('massCount').textContent = masses.length;
    document.getElementById('versionInfo').textContent = massHistory.length;
    document.getElementById('spacecraftCount').textContent = spacecrafts.length;
    document.getElementById('laserCount').textContent = window.lasers ? window.lasers.length : 0;
    document.getElementById('geodesicCount').textContent = geodesics.length;
    
    // Calculer le redshift moyen des lasers
    let totalRedshift = 0;
    let laserCount = 0;
    if (window.lasers && window.lasers.length > 0) {
        window.lasers.forEach(laser => {
            const { gridX, gridY } = getGridVersionIndex(laser.x, laser.y);
            const pointVersion = gridVersions[gridX] && gridVersions[gridX][gridY] !== undefined 
                ? gridVersions[gridX][gridY] : 0;
            const versionMasses = getMassesForVersion(pointVersion);
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
    currentVersion = 0;
    massHistory = [];
    initializeGridVersions();
    cancelSpacecraftPlacement();
    cancelLaserPlacement();
    cancelGeodesicPlacement();
    console.log('Simulation réinitialisée');
}

// Nouvelles fonctions pour le système de versions
function createNewVersion(type, x, y, massChange) {
    currentVersion++;
    
    // Créer une copie de la configuration actuelle des masses
    const newMassConfig = masses.map(mass => ({ x: mass.x, y: mass.y, mass: mass.mass }));
    massHistory.push({
        version: currentVersion,
        masses: newMassConfig,
        timestamp: Date.now()
    });
    
    // Nettoyer les anciennes versions si nécessaire
    cleanupOldVersions();
    
    // Créer le front de propagation
    propagationFronts.push({
        x: x,
        y: y,
        startTime: Date.now(),
        spacing: spacing,
        version: currentVersion,
        type: type,
        massChange: massChange
    });
}

function cleanupOldVersions() {
    if (massHistory.length > maxVersions) {
        // Supprimer les versions les plus anciennes
        const versionsToRemove = massHistory.length - maxVersions;
        const removedVersions = massHistory.splice(0, versionsToRemove);
        
        // Mettre à jour les références dans la grille
        const removedVersionNumbers = removedVersions.map(v => v.version);
        updateGridVersionsAfterCleanup(removedVersionNumbers);
        
        // Supprimer les fronts de propagation correspondants
        propagationFronts = propagationFronts.filter(front => 
            !removedVersionNumbers.includes(front.version)
        );
    }
}

function updateGridVersionsAfterCleanup(removedVersions) {
    const gridWidth = gridVersions.length;
    const gridHeight = gridVersions[0] ? gridVersions[0].length : 0;
    
    for (let x = 0; x < gridWidth; x++) {
        for (let y = 0; y < gridHeight; y++) {
            if (gridVersions[x] && gridVersions[x][y] !== undefined) {
                if (removedVersions.includes(gridVersions[x][y])) {
                    // Remettre à la version 0 si la version a été supprimée
                    gridVersions[x][y] = 0;
                }
            }
        }
    }
}

function initializeGridVersions() {
    const gridWidth = Math.ceil(canvas.width / spacing);
    const gridHeight = Math.ceil(canvas.height / spacing);
    
    gridVersions = [];
    for (let x = 0; x < gridWidth; x++) {
        gridVersions[x] = [];
        for (let y = 0; y < gridHeight; y++) {
            gridVersions[x][y] = 0; // Version initiale
        }
    }
}

function getGridVersionIndex(x, y) {
    const gridX = Math.floor(x / spacing);
    const gridY = Math.floor(y / spacing);
    return { gridX, gridY };
}

function updateGridPointVersion(x, y, version) {
    const { gridX, gridY } = getGridVersionIndex(x, y);
    if (gridVersions[gridX] && gridVersions[gridX][gridY] !== undefined) {
        gridVersions[gridX][gridY] = version;
    }
}

function getMassesForVersion(version) {
    if (version === 0) return [];
    const versionData = massHistory.find(v => v.version === version);
    return versionData ? versionData.masses : [];
}
    
// Fonctions de dessin
function drawGrid() {
    if (!showGrid) return;
    
    ctx.fillStyle = '#666';
    for (let x = 0; x <= canvas.width; x += spacing) {
        for (let y = 0; y <= canvas.height; y += spacing) {
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
}

function drawMasses() {
    masses.forEach(mass => {
        let radius, fillColor, strokeColor, textColor;
        
        if (mass.type === 'blackhole') {
            // Trou noir : très grand, noir avec bordure rouge
            radius = Math.max(15, Math.sqrt(mass.mass) * 0.1);
            fillColor = '#000000';
            strokeColor = '#ff0000';
            textColor = '#ff0000';
        } else if (mass.type === 'planet') {
            // Planète : taille normale, couleur bleue
            radius = 8 + Math.sqrt(mass.mass) * 0.3;
            fillColor = '#4444ff';
            strokeColor = '#aaaaff';
            textColor = '#ffffff';
        } else {
            // Masse normale : rouge
            radius = 8 + Math.sqrt(mass.mass) * 0.3;
            fillColor = '#ff4444';
            strokeColor = '#ffaaaa';
            textColor = '#ffffff';
        }
        
        // Dessiner le corps principal
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.arc(mass.x, mass.y, radius, 0, 2 * Math.PI);
        ctx.fill();
        
        // Bordure
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mass.x, mass.y, radius + 4, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Texte de la masse
        ctx.fillStyle = textColor;
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        
        if (mass.type === 'blackhole') {
            // Pour les trous noirs, afficher "BH" au lieu du nombre
            ctx.fillText('BH', mass.x, mass.y - radius - 8);
        } else {
            ctx.fillText(Math.round(mass.mass), mass.x, mass.y - radius - 8);
        }
        
        // Effet spécial pour les trous noirs : cercle d'horizon
        if (mass.type === 'blackhole') {
            const eventHorizonRadius = calculateEventHorizon(mass.mass);
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(mass.x, mass.y, eventHorizonRadius, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Afficher le rayon de l'horizon
            ctx.fillStyle = '#ff0000';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`R=${Math.round(eventHorizonRadius)}`, mass.x, mass.y + radius + 20);
        }
    });
}

function drawSpacecrafts() {
    if (!showSpacecrafts) return;
    
    spacecrafts.forEach(spacecraft => {
        // Dessiner la trajectoire
        if (spacecraft.trail.length > 1) {
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 1;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(spacecraft.trail[0].x, spacecraft.trail[0].y);
            
            for (let i = 1; i < spacecraft.trail.length; i++) {
                ctx.lineTo(spacecraft.trail[i].x, spacecraft.trail[i].y);
            }
            ctx.stroke();
        }
        
        // Dessiner le vaisseau
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(spacecraft.x, spacecraft.y, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        // Dessiner la direction du vaisseau
        const speed = Math.sqrt(spacecraft.vx * spacecraft.vx + spacecraft.vy * spacecraft.vy);
        if (speed > 0) {
            const dirX = spacecraft.vx / speed;
            const dirY = spacecraft.vy / speed;
            
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(spacecraft.x, spacecraft.y);
            ctx.lineTo(spacecraft.x + dirX * 15, spacecraft.y + dirY * 15);
            ctx.stroke();
            
            // Afficher la vitesse actuelle du vaisseau
            const speedPercentage = Math.round((speed / maxSpeed) * 100);
            ctx.fillStyle = '#ffff00';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${speedPercentage}%`, spacecraft.x + dirX * 25, spacecraft.y + dirY * 25);
        }
    });
    
    // Dessiner l'indicateur de placement de vaisseau
    if (isPlacingSpacecraft && spacecraftStartPoint) {
        console.log('Dessin placement vaisseau:', { isPlacingSpacecraft, spacecraftStartPoint, mousePosition });
        // Dessiner le point de départ
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(spacecraftStartPoint.x, spacecraftStartPoint.y, 8, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Calculer le vecteur vitesse prévisualisé
        const directionX = mousePosition.x - spacecraftStartPoint.x;
        const directionY = mousePosition.y - spacecraftStartPoint.y;
        const distance = Math.sqrt(directionX * directionX + directionY * directionY);
        

        
        // Toujours afficher quelque chose, même si distance = 0
        let previewSpeed = 0;
        let velocityX = 0;
        let velocityY = 0;
        
        console.log('Calcul prévisualisation:', { distance, directionX, directionY });
        
        if (distance > 0) {
            // Normaliser la direction
            const normalizedDirX = directionX / distance;
            const normalizedDirY = directionY / distance;
            
            // La vitesse est proportionnelle à la distance, avec limite à c
            previewSpeed = Math.min(distance * 0.5, maxSpeed); // 0.5 pour un contrôle plus sensible
            
            velocityX = normalizedDirX * previewSpeed;
            velocityY = normalizedDirY * previewSpeed;
        } else {
            // Si distance = 0, afficher un petit vecteur par défaut
            previewSpeed = 5; // Vitesse minimale
            velocityX = 5;
            velocityY = 0;
        }
        
        // Dessiner le vecteur vitesse prévisualisé (toujours)
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(spacecraftStartPoint.x, spacecraftStartPoint.y);
        ctx.lineTo(spacecraftStartPoint.x + velocityX, spacecraftStartPoint.y + velocityY);
        ctx.stroke();
        
        // Dessiner la flèche
        const arrowLength = 15;
        const arrowAngle = Math.atan2(velocityY, velocityX);
        ctx.beginPath();
        ctx.moveTo(spacecraftStartPoint.x + velocityX, spacecraftStartPoint.y + velocityY);
        ctx.lineTo(
            spacecraftStartPoint.x + velocityX - arrowLength * Math.cos(arrowAngle - 0.3),
            spacecraftStartPoint.y + velocityY - arrowLength * Math.sin(arrowAngle - 0.3)
        );
        ctx.moveTo(spacecraftStartPoint.x + velocityX, spacecraftStartPoint.y + velocityY);
        ctx.lineTo(
            spacecraftStartPoint.x + velocityX - arrowLength * Math.cos(arrowAngle + 0.3),
            spacecraftStartPoint.y + velocityY - arrowLength * Math.sin(arrowAngle + 0.3)
        );
        ctx.stroke();
        
        // Afficher la vitesse en pourcentage de c
        const speedPercentage = Math.round((previewSpeed / maxSpeed) * 100);
        ctx.fillStyle = '#ffff00';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${speedPercentage}% de c`, spacecraftStartPoint.x + velocityX, spacecraftStartPoint.y + velocityY - 10);
        
        // Afficher les instructions
        ctx.fillStyle = '#ffff00';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Déplacez la souris pour ajuster la vitesse', spacecraftStartPoint.x, spacecraftStartPoint.y - 30);
        ctx.fillText('Clic pour confirmer, ESC pour annuler', spacecraftStartPoint.x, spacecraftStartPoint.y - 15);
    }
}

function drawLasers() {
    // Supprimer la condition pour permettre l'affichage de la prévisualisation
    // if (!window.lasers || window.lasers.length === 0) return;
    
    // Dessiner les lasers existants
    if (window.lasers && window.lasers.length > 0) {
        window.lasers.forEach(laser => {
            // Calculer le redshift gravitationnel à la position du laser
            const { gridX, gridY } = getGridVersionIndex(laser.x, laser.y);
            const pointVersion = gridVersions[gridX] && gridVersions[gridX][gridY] !== undefined 
                ? gridVersions[gridX][gridY] : 0;
            const versionMasses = getMassesForVersion(pointVersion);
            
            const redshift = calculateGravitationalRedshift(laser.x, laser.y, versionMasses);
            const laserColor = redshiftToColor(redshift);
            
            // Dessiner la trajectoire avec couleur variable
            if (laser.trail.length > 1) {
                ctx.lineWidth = 3; // Ligne plus épaisse
                ctx.setLineDash([]);
                
                // Dessiner chaque segment avec sa propre couleur de redshift
                for (let i = 1; i < laser.trail.length; i++) {
                    const prevPoint = laser.trail[i - 1];
                    const currentPoint = laser.trail[i];
                    
                    // Calculer le redshift au milieu du segment
                    const midX = (prevPoint.x + currentPoint.x) / 2;
                    const midY = (prevPoint.y + currentPoint.y) / 2;
                    const { gridX, gridY } = getGridVersionIndex(midX, midY);
                    const pointVersion = gridVersions[gridX] && gridVersions[gridX][gridY] !== undefined 
                        ? gridVersions[gridX][gridY] : 0;
                    const versionMasses = getMassesForVersion(pointVersion);
                    const segmentRedshift = calculateGravitationalRedshift(midX, midY, versionMasses);
                    const segmentColor = redshiftToColor(segmentRedshift);
                    
                    ctx.strokeStyle = segmentColor;
                    ctx.beginPath();
                    ctx.moveTo(prevPoint.x, prevPoint.y);
                    ctx.lineTo(currentPoint.x, currentPoint.y);
                    ctx.stroke();
                }
            }
            
            // Dessiner le laser (point lumineux) avec couleur variable
            ctx.fillStyle = laserColor;
            ctx.beginPath();
            ctx.arc(laser.x, laser.y, 3, 0, 2 * Math.PI);
            ctx.fill();
            
            // Ajouter un effet lumineux avec couleur variable et pulsation
            ctx.shadowColor = laserColor;
            const pulseIntensity = Math.abs(redshift) * 10; // Pulsation basée sur l'intensité du redshift
            ctx.shadowBlur = 5 + pulseIntensity;
            ctx.beginPath();
            ctx.arc(laser.x, laser.y, 6 + pulseIntensity * 0.5, 0, 2 * Math.PI);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Afficher l'indicateur de redshift
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            const redshiftText = `z: ${redshift.toFixed(3)}`;
            ctx.fillText(redshiftText, laser.x + 10, laser.y - 5);
        });
    }
    
    // Dessiner l'indicateur de placement de laser
    if (isPlacingLaser && laserStartPoint) {
        // Dessiner le point de départ
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(laserStartPoint.x, laserStartPoint.y, 8, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Calculer le vecteur direction prévisualisé
        const directionX = mousePosition.x - laserStartPoint.x;
        const directionY = mousePosition.y - laserStartPoint.y;
        const distance = Math.sqrt(directionX * directionX + directionY * directionY);
        
        if (distance > 0) {
            // Normaliser la direction
            const normalizedDirX = directionX / distance;
            const normalizedDirY = directionY / distance;
            
            // Dessiner le vecteur direction prévisualisé
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(laserStartPoint.x, laserStartPoint.y);
            ctx.lineTo(laserStartPoint.x + normalizedDirX * 30, laserStartPoint.y + normalizedDirY * 30);
            ctx.stroke();
            
            // Dessiner la flèche
            const arrowLength = 15;
            const arrowAngle = Math.atan2(normalizedDirY, normalizedDirX);
            ctx.beginPath();
            ctx.moveTo(laserStartPoint.x + normalizedDirX * 30, laserStartPoint.y + normalizedDirY * 30);
            ctx.lineTo(
                laserStartPoint.x + normalizedDirX * 30 - arrowLength * Math.cos(arrowAngle - 0.3),
                laserStartPoint.y + normalizedDirY * 30 - arrowLength * Math.sin(arrowAngle - 0.3)
            );
            ctx.moveTo(laserStartPoint.x + normalizedDirX * 30, laserStartPoint.y + normalizedDirY * 30);
            ctx.lineTo(
                laserStartPoint.x + normalizedDirX * 30 - arrowLength * Math.cos(arrowAngle + 0.3),
                laserStartPoint.y + normalizedDirY * 30 - arrowLength * Math.sin(arrowAngle + 0.3)
            );
            ctx.stroke();
            
            // Afficher "vitesse c"
            ctx.fillStyle = '#00ff00';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('vitesse c', laserStartPoint.x + normalizedDirX * 30, laserStartPoint.y + normalizedDirY * 30 - 10);
        }
        
        // Afficher les instructions
        ctx.fillStyle = '#00ff00';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Déplacez la souris pour ajuster la direction', laserStartPoint.x, laserStartPoint.y - 30);
        ctx.fillText('Clic pour confirmer, ESC pour annuler', laserStartPoint.x, laserStartPoint.y - 15);
    }
}

function drawPropagation() {
    if (!showPropagation) return;
    
    const currentTime = Date.now();
    
    propagationFronts.forEach(front => {
        const timeDiff = (currentTime - front.startTime) / 1000;
        const radius = timeDiff * propagationSpeed * 10; // Vitesse configurable
        const radiusInPixels = radius * front.spacing;
        
        if (radius > 0 && radiusInPixels < Math.max(canvas.width, canvas.height)) {
            // Trouver la masse correspondante
            const mass = masses.find(m => m.x === front.x && m.y === front.y);
            if (mass) {
                // Calculer l'intensité gravitationnelle à cette distance (M/r²)
                const intensity = mass.mass / (radius * radius);
                const normalizedIntensity = Math.max(0.1, Math.min(5, intensity * 0.1));
                
                // Couleur uniforme pour tous les fronts d'onde
                ctx.strokeStyle = '#44ff44'; // Vert pour tous les fronts
                
                // Épaisseur basée sur l'intensité gravitationnelle (décroît avec la distance)
                ctx.lineWidth = Math.max(1, Math.min(8, normalizedIntensity * 4));
                
                // Pointillés plus denses pour les fronts intenses
                const dashLength = Math.max(2, Math.min(8, 12 - normalizedIntensity * 2));
                ctx.setLineDash([dashLength, dashLength]);
                
                ctx.beginPath();
                ctx.arc(front.x, front.y, radiusInPixels, 0, 2 * Math.PI);
                ctx.stroke();
                ctx.setLineDash([]);
                
                // Mettre à jour les versions des points de grille atteints par le front
                updateGridVersionsForFront(front, radius);
            }
        }
    });
}

function updateGridVersionsForFront(front, radius) {
    const step = spacing;
    for (let x = 0; x <= canvas.width; x += step) {
        for (let y = 0; y <= canvas.height; y += step) {
            const dist = Math.sqrt((front.x - x) ** 2 + (front.y - y) ** 2) / front.spacing;
            if (dist <= radius) {
                updateGridPointVersion(x, y, front.version);
            }
        }
    }
}

function drawVectors() {
    if (!showVectors || masses.length === 0) return;
    
    ctx.strokeStyle = '#4499ff';
    ctx.lineWidth = 2;
    
    const step = spacing;
    
    for (let x = 0; x <= canvas.width; x += step) {
        for (let y = 0; y <= canvas.height; y += step) {
            // Obtenir la version de ce point de grille
            const { gridX, gridY } = getGridVersionIndex(x, y);
            const pointVersion = gridVersions[gridX] && gridVersions[gridX][gridY] !== undefined 
                ? gridVersions[gridX][gridY] : 0;
            
            // Obtenir les masses pour cette version
            const versionMasses = getMassesForVersion(pointVersion);
            
            let totalForceX = 0;
            let totalForceY = 0;
            
            versionMasses.forEach(mass => {
                const dx = mass.x - x;
                const dy = mass.y - y;
                const distSq = dx * dx + dy * dy;
                
                if (distSq > 0) {
                    const force = 1000 * mass.mass / distSq;
                    const dist = Math.sqrt(distSq);
                    totalForceX += force * dx / dist;
                    totalForceY += force * dy / dist;
                }
            });
            
            const magnitude = Math.sqrt(totalForceX * totalForceX + totalForceY * totalForceY);
            
            if (magnitude > 1) {
                const scale = Math.min(20, magnitude * 0.1) * forceScale;
                const normalizedX = totalForceX / magnitude;
                const normalizedY = totalForceY / magnitude;
                
                const endX = x + normalizedX * scale;
                const endY = y + normalizedY * scale;
                
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(endX, endY);
                ctx.stroke();
                
                const angle = Math.atan2(normalizedY, normalizedX);
                ctx.beginPath();
                ctx.moveTo(endX, endY);
                ctx.lineTo(
                    endX - 8 * Math.cos(angle - 0.3),
                    endY - 8 * Math.sin(angle - 0.3)
                );
                ctx.moveTo(endX, endY);
                ctx.lineTo(
                    endX - 8 * Math.cos(angle + 0.3),
                    endY - 8 * Math.sin(angle + 0.3)
                );
                ctx.stroke();
            }
        }
    }
}

function animate() {
    if (!animationRunning) return;
    
    const currentTime = Date.now();
    const deltaTime = currentTime - (animate.lastTime || currentTime);
    animate.lastTime = currentTime;
    
    // Mettre à jour les vaisseaux
    updateSpacecrafts(deltaTime);
    updateLasers(deltaTime); // Mettre à jour les lasers
    updateGeodesics(deltaTime); // Mettre à jour les géodésiques
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawGrid();
    drawVectors();
    drawPropagation();
    drawMasses();
    drawSpacecrafts();
    drawLasers(); // Dessiner les lasers
    drawGeodesics(); // Dessiner les géodésiques
    
    requestAnimationFrame(animate);
}

// Variables pour le placement de vaisseau
let spacecraftStartPoint = null;
let isPlacingSpacecraft = false;
let mousePosition = { x: 0, y: 0 };

// Variables pour le placement de laser
let laserStartPoint = null;
let isPlacingLaser = false;

// Variables globales pour les géodésiques
let geodesics = [];
let isPlacingGeodesic = false;
let geodesicStartPoint = null;
let geodesicDirection = null;

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
        addBlackHole(x, y);
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
        if (!isPlacingGeodesic) {
            // Premier clic : définir le point de départ
            geodesicStartPoint = { x, y };
            mousePosition = { x, y }; // Initialiser mousePosition avec la position du clic
            isPlacingGeodesic = true;
            canvas.style.cursor = 'crosshair';
            
            // Debug: forcer un redessinage immédiat
            console.log('Premier clic géodésique:', { x, y, geodesicStartPoint, mousePosition });
            
            // Forcer un cycle d'animation complet pour afficher la prévisualisation
            requestAnimationFrame(() => {
                animate();
            });
            

        } else {
            // Deuxième clic : confirmer la direction
            const directionX = mousePosition.x - geodesicStartPoint.x;
            const directionY = mousePosition.y - geodesicStartPoint.y;
            addGeodesic(geodesicStartPoint.x, geodesicStartPoint.y, directionX, directionY);
            
            // Réinitialiser
            geodesicStartPoint = null;
            isPlacingGeodesic = false;
            canvas.style.cursor = 'default';
        }
    }
});

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (currentTool === 'mass') {
        addMass(x, y, true);
    } else if (currentTool === 'spacecraft' && isPlacingSpacecraft) {
        // Annuler le placement de vaisseau
        cancelSpacecraftPlacement();
    } else if (currentTool === 'laser' && isPlacingLaser) {
        // Annuler le placement de laser
        cancelLaserPlacement();
    } else if (currentTool === 'geodesic' && isPlacingGeodesic) {
        // Annuler le placement de géodésique
        cancelGeodesicPlacement();
    }
});

// Suivi de la souris pour la prévisualisation du vaisseau
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mousePosition.x = e.clientX - rect.left;
    mousePosition.y = e.clientY - rect.top;
});

// Gestion de la touche ESC pour annuler le placement
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isPlacingSpacecraft) {
        cancelSpacecraftPlacement();
    } else if (e.key === 'Escape' && isPlacingLaser) {
        cancelLaserPlacement();
    } else if (e.key === 'Escape' && isPlacingGeodesic) {
        cancelGeodesicPlacement();
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
        
        // Mettre à jour le curseur
        if (currentTool === 'spacecraft') {
            canvas.style.cursor = 'crosshair';
        } else if (currentTool === 'laser') {
            canvas.style.cursor = 'crosshair';
        } else if (currentTool === 'geodesic') {
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
initializeGridVersions();
updateDebugInfo();
animate(); 