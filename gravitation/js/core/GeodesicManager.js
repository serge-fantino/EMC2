/**
 * Gestionnaire de géodésiques
 * Extrait du main.js pour améliorer la modularité
 */

import { normalizeVector } from './PhysicsUtils.js';
import { AppContext } from './AppContext.js';

/**
 * Initialise le gestionnaire de géodésiques
 * Plus besoin d'injection de dépendances, utilise AppContext
 */
export function initializeGeodesicManager() {
    // Plus besoin d'initialisation, utilise AppContext directement
}

/**
 * Met à jour les références
 * Plus besoin de mise à jour, utilise AppContext directement
 */
export function updateReferences() {
    // Plus besoin de mise à jour, utilise AppContext directement
}

/**
 * Calcule le gradient gravitationnel à un point donné
 * @param {number} x - Coordonnée x
 * @param {number} y - Coordonnée y
 * @param {Array} masses - Tableau des masses
 * @returns {Object} Gradient {x, y}
 */
function calculateGravitationalGradient(x, y, masses) {
    let gradientX = 0;
    let gradientY = 0;
    
    masses.forEach(mass => {
        const dx = mass.x - x;
        const dy = mass.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Force gravitationnelle F = GM/r²
            const force = mass.mass / (distance * distance);
            
            // Gradient = force * direction unitaire
            gradientX += (dx / distance) * force;
            gradientY += (dy / distance) * force;
        }
    });
    
    return { x: gradientX, y: gradientY };
}

/**
 * Ajoute une géodésique (courbe de niveau)
 * @param {number} startX - Coordonnée x de départ
 * @param {number} startY - Coordonnée y de départ
 */
export function addGeodesic(startX, startY) {
    // Vérifier d'abord si le champ gravitationnel est suffisamment fort
    const gradient = calculateGravitationalGradient(startX, startY, AppContext.masses);
    const gradientMagnitude = Math.sqrt(gradient.x * gradient.x + gradient.y * gradient.y);
    
    if (gradientMagnitude < AppContext.geodesicSettings.minGradientThreshold) {
        console.log('Champ gravitationnel trop faible pour créer une géodésique');
        return;
    }
    
    const geodesic = {
        startX: startX,
        startY: startY,
        points: [],
        maxLength: AppContext.geodesicSettings.maxSteps,
        type: 'geodesic'
    };
    
    // Calculer les points de la géodésique
    calculateGeodesicPoints(geodesic);
    
    // Vérifier que la géodésique a une longueur suffisante
    if (geodesic.points.length < AppContext.geodesicSettings.minPoints) {
        console.log('Géodésique trop courte, ignorée');
        return;
    }
    
    AppContext.geodesics.push(geodesic);
    console.log('Géodésique ajoutée:', geodesic);
}

/**
 * Calcule les points d'une géodésique (perpendiculaire au gradient)
 * @param {Object} geodesic - Objet géodésique
 */
function calculateGeodesicPoints(geodesic) {
    geodesic.points = [];
    
    const explorationStep = AppContext.geodesicSettings.explorationStep;
    const curveStep = AppContext.geodesicSettings.curveStep;
    const maxSteps = AppContext.geodesicSettings.maxSteps;
    const maxAngle = AppContext.geodesicSettings.maxAngle;
    const boundingBoxMultiplier = AppContext.geodesicSettings.boundingBoxMultiplier;
    
    let x = geodesic.startX;
    let y = geodesic.startY;
    let distanceTraveled = 0;
    let lastCurvePoint = { x: x, y: y };
    
    // Calculer le centre de la bounding box étendue
    const centerX = AppContext.canvas.width / 2;
    const centerY = AppContext.canvas.height / 2;
    const maxDistance = Math.max(AppContext.canvas.width, AppContext.canvas.height) * boundingBoxMultiplier / 2;
    
    // Variables pour le suivi de l'angle
    let totalAngle = 0;
    let lastDirection = null;
    
    // Ajouter le point de départ
    geodesic.points.push({ x: x, y: y });
    
    // Calculer dans une seule direction jusqu'à fermeture ou limite
    for (let step = 0; step < maxSteps; step++) {
        // Calculer le gradient à la position actuelle
        const gradient = calculateGravitationalGradient(x, y, AppContext.masses);
        
        // Si le gradient est trop faible, arrêter
        const gradientMagnitude = Math.sqrt(gradient.x * gradient.x + gradient.y * gradient.y);
        if (gradientMagnitude < AppContext.geodesicSettings.stopGradientThreshold) {
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
        
        // Vérifier les limites de la bounding box
        const distanceFromCenter = Math.sqrt((x - centerX) * (x - centerX) + (y - centerY) * (y - centerY));
        if (distanceFromCenter > maxDistance) {
            console.log('Géodésique sort de la bounding box');
            break;
        }
        
        // Avancer dans la direction de la géodésique
        x += directionVector.x * curveStep;
        y += directionVector.y * curveStep;
        distanceTraveled += curveStep;
        
        // Ajouter le point à la géodésique
        geodesic.points.push({ x: x, y: y });
        
        // Vérifier la distance minimale entre les points
        const lastPoint = geodesic.points[geodesic.points.length - 2];
        const distanceBetweenPoints = Math.sqrt((x - lastPoint.x) * (x - lastPoint.x) + (y - lastPoint.y) * (y - lastPoint.y));
        
        if (distanceBetweenPoints < AppContext.geodesicSettings.minDistanceBetweenPoints) {
            // Supprimer le dernier point si trop proche
            geodesic.points.pop();
        }
    }
}

/**
 * Recalcule toutes les géodésiques
 */
export function recalculateAllGeodesics() {
    AppContext.geodesics.forEach(geodesic => {
        calculateGeodesicPoints(geodesic);
    });
}

/**
 * Met à jour les géodésiques (maintenant statiques)
 * @param {number} deltaTime - Temps écoulé depuis la dernière mise à jour
 */
export function updateGeodesics(deltaTime) {
    // Les géodésiques sont statiques, pas besoin de mise à jour continue
    // Elles sont recalculées seulement quand les masses changent
}

/**
 * Supprime une géodésique
 * @param {Object} geodesic - Géodésique à supprimer
 */
export function removeGeodesic(geodesic) {
    const index = AppContext.geodesics.indexOf(geodesic);
    if (index > -1) {
        AppContext.geodesics.splice(index, 1);
    }
}

/**
 * Récupère le tableau des géodésiques
 * @returns {Array} Tableau des géodésiques
 */
export function getGeodesics() {
    return AppContext.geodesics;
}

/**
 * Supprime toutes les géodésiques
 */
export function clearGeodesics() {
    AppContext.geodesics.length = 0;
}

/**
 * Annule le placement de géodésique
 */
export function cancelGeodesicPlacement() {
    AppContext.geodesicStartPoint = null;
    AppContext.isPlacingGeodesic = false;
    AppContext.canvas.style.cursor = 'default';
} 