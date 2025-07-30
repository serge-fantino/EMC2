/**
 * Constantes physiques pour la simulation gravitationnelle
 * Extrait du main.js pour améliorer la modularité
 */

// Constantes physiques pour les trous noirs
export const G = 1.0; // Constante gravitationnelle (normalisée)
export const maxSpeed = 50; // Vitesse maximale (équivalent à c = 100%)
export const c = maxSpeed; // Vitesse de la lumière

// Paramètres de simulation
export const spacecraftSpeed = 2.0; // Vitesse initiale des vaisseaux (en unités arbitraires)

// Limites pour les calculs
export const REDSHIFT_MIN = -2.0;
export const REDSHIFT_MAX = 2.0; 