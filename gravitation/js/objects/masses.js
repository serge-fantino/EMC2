/**
 * Module de gestion des masses et trous noirs
 * Gère la création, modification et affichage des masses
 */

import { calculateEventHorizon } from '../physics/gravity.js';

// Variables du module
let masses = [];
let currentTool = 'mass';
let spacing = 32;
let createVersionCallback = null;

/**
 * Obtient un point de grille pour une position donnée
 * @param {number} x - Position X
 * @param {number} y - Position Y
 * @returns {Object} Point de grille {x, y}
 */
function getGridPoint(x, y) {
    const gridX = Math.floor(x / spacing) * spacing;
    const gridY = Math.floor(y / spacing) * spacing;
    return { x: gridX, y: gridY };
}

/**
 * Ajoute une masse à la position donnée
 * @param {number} x - Position X
 * @param {number} y - Position Y
 * @param {boolean} isRightClick - Si c'est un clic droit
 */
export function addMass(x, y, isRightClick = false) {
    const gridPoint = getGridPoint(x, y);
    
    // Chercher une masse existante à cet endroit
    const existing = masses.find(m => 
        Math.abs(m.x - gridPoint.x) < spacing/2 && 
        Math.abs(m.y - gridPoint.y) < spacing/2
    );
    
    if (existing) {
        if (isRightClick) {
            // Réduire la masse
            const oldMass = existing.mass;
            existing.mass = Math.max(1, existing.mass - 10);
            console.log(`Masse réduite: ${oldMass} → ${existing.mass}`);
            
            // Créer un nouveau front de propagation pour la modification
            if (createVersionCallback) {
                createVersionCallback('mass_modify', x, y, existing.mass - oldMass);
            }
        } else {
            // Augmenter la masse
            const oldMass = existing.mass;
            existing.mass += 10;
            console.log(`Masse augmentée: ${oldMass} → ${existing.mass}`);
            
            // Créer un nouveau front de propagation pour la modification
            if (createVersionCallback) {
                createVersionCallback('mass_modify', x, y, existing.mass - oldMass);
            }
        }
    } else {
        // Créer une nouvelle masse
        const newMass = {
            x: gridPoint.x,
            y: gridPoint.y,
            mass: 50,
            isBlackHole: false
        };
        
        masses.push(newMass);
        console.log(`Nouvelle masse créée à (${gridPoint.x}, ${gridPoint.y})`);
        
        // Créer un nouveau front de propagation
        if (createVersionCallback) {
            createVersionCallback('mass_create', gridPoint.x, gridPoint.y, 50);
        }
    }
}

/**
 * Supprime une masse
 * @param {Object} mass - Masse à supprimer
 */
export function removeMass(mass) {
    const index = masses.indexOf(mass);
    if (index > -1) {
        masses.splice(index, 1);
        console.log(`Masse supprimée à (${mass.x}, ${mass.y})`);
        
        // Créer un nouveau front de propagation pour la suppression
        if (createVersionCallback) {
            createVersionCallback('mass_remove', mass.x, mass.y, -mass.mass);
        }
    }
}

/**
 * Ajoute un trou noir à la position donnée
 * @param {number} x - Position X
 * @param {number} y - Position Y
 */
export function addBlackHole(x, y) {
    // Vérifier si on clique sur un trou noir existant pour modifier sa masse
    const existingBlackHole = masses.find(mass => {
        const dx = x - mass.x;
        const dy = y - mass.y;
        return Math.sqrt(dx * dx + dy * dy) < 20 && mass.isBlackHole; // Zone de clic pour les trous noirs
    });
    
    if (existingBlackHole) {
        // Modifier la masse du trou noir existant (facteur 2)
        const oldMass = existingBlackHole.mass;
        existingBlackHole.mass *= 2;
        console.log(`Trou noir: masse ${oldMass} → ${existingBlackHole.mass}`);
        
        // Créer un nouveau front de propagation pour la modification
        if (createVersionCallback) {
            createVersionCallback('blackhole_modify', x, y, existingBlackHole.mass - oldMass);
        }
        return;
    }
    
    // Créer un nouveau trou noir avec masse réduite
    const blackHoleMass = 10000; // Réduit de 100000 à 10000 (facteur 10)
    const blackHole = {
        x: x,
        y: y,
        mass: blackHoleMass,
        isBlackHole: true
    };
    
    masses.push(blackHole);
    console.log(`Trou noir créé à (${x}, ${y}) avec masse ${blackHoleMass}`);
    
    // Créer un nouveau front de propagation
    if (createVersionCallback) {
        createVersionCallback('blackhole_create', x, y, blackHoleMass);
    }
}

/**
 * Modifie la masse d'un trou noir (clic droit)
 * @param {number} x - Position X
 * @param {number} y - Position Y
 */
export function modifyBlackHole(x, y) {
    const existingBlackHole = masses.find(mass => {
        const dx = x - mass.x;
        const dy = y - mass.y;
        return Math.sqrt(dx * dx + dy * dy) < 20 && mass.isBlackHole;
    });
    
    if (existingBlackHole) {
        const oldMass = existingBlackHole.mass;
        existingBlackHole.mass /= 2;
        console.log(`Trou noir: masse ${oldMass} → ${existingBlackHole.mass}`);
        
        // Créer un nouveau front de propagation pour la modification
        if (createVersionCallback) {
            createVersionCallback('blackhole_modify', x, y, existingBlackHole.mass - oldMass);
        }
    }
}

/**
 * Dessine toutes les masses sur le canvas
 * @param {CanvasRenderingContext2D} ctx - Contexte du canvas
 */
export function drawMasses(ctx) {
    masses.forEach(mass => {
        let radius, fillColor, strokeColor, textColor;
        
        if (mass.isBlackHole) {
            // Trou noir : taille énorme, couleur noire
            radius = 12 + Math.sqrt(mass.mass) * 0.1;
            fillColor = '#000000';
            strokeColor = '#ff0000';
            textColor = '#ffffff';
        } else if (mass.mass > 100) {
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
        
        if (mass.isBlackHole) {
            // Pour les trous noirs, afficher la masse en kilo
            const massInK = Math.round(mass.mass / 1000);
            ctx.fillText(`${massInK}k`, mass.x, mass.y - radius - 8);
        } else {
            ctx.fillText(Math.round(mass.mass), mass.x, mass.y - radius - 8);
        }
        
        // Effet spécial pour les trous noirs : cercle d'horizon
        if (mass.isBlackHole) {
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

/**
 * Obtient la liste des masses
 * @returns {Array} Liste des masses
 */
export function getMasses() {
    return masses;
}

/**
 * Définit la liste des masses
 * @param {Array} massesArray - Nouvelle liste des masses
 */
export function setMasses(massesArray) {
    masses = massesArray;
}

/**
 * Définit l'outil actuel
 * @param {string} tool - Outil à définir
 */
export function setCurrentTool(tool) {
    currentTool = tool;
}

/**
 * Obtient l'outil actuel
 * @returns {string} Outil actuel
 */
export function getCurrentTool() {
    return currentTool;
}

/**
 * Définit l'espacement de la grille
 * @param {number} gridSpacing - Espacement de la grille
 */
export function setSpacing(gridSpacing) {
    spacing = gridSpacing;
}

/**
 * Définit le callback pour créer de nouvelles versions
 * @param {Function} callback - Fonction de callback
 */
export function setCreateVersionCallback(callback) {
    createVersionCallback = callback;
}

/**
 * Réinitialise les masses
 */
export function resetMasses() {
    masses = [];
} 