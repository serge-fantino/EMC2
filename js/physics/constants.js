/**
 * CONSTANTES PHYSIQUES - Module Physics 
 * Refactoring Phase 3 - Extraction des constantes relativistes
 */

// === CONSTANTES FONDAMENTALES ===
export const SPEED_OF_LIGHT = 1; // c = 1 dans nos unités normalisées
export const VELOCITY_EPSILON = 0.001; // Approche maximale de c (99.9% de c)
export const MAX_VELOCITY = SPEED_OF_LIGHT * (1 - VELOCITY_EPSILON); // 0.999c

// === PARAMÈTRES DE SÉCURITÉ ===
export const SAFETY_MARGIN = 0.02; // Marge de sécurité 2% depuis le bord du cône de lumière

// === PARAMÈTRES DE CALCUL ===
export const MIN_TIME_STEP = 0.001; // Pas de temps minimal pour éviter les divisions par zéro
export const TRAJECTORY_STEPS = 50; // Nombre d'étapes pour le rendu des trajectoires 