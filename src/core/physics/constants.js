/**
 * @fileoverview Constantes physiques pour les calculs relativistes
 * @author Serge Fantino
 * @version 2.0.0
 */

/**
 * Constantes physiques utilisées dans l'application
 * @namespace PhysicsConstants
 */

/**
 * Vitesse de la lumière dans nos unités normalisées
 * @constant {number}
 * @default 1
 * @memberof PhysicsConstants
 */
export const SPEED_OF_LIGHT = 1;

/**
 * Epsilon de vitesse pour éviter les singularités numériques
 * Représente la distance maximale autorisée à la vitesse de la lumière (99.9% de c)
 * @constant {number}
 * @default 0.001
 * @memberof PhysicsConstants
 */
export const VELOCITY_EPSILON = 0.001;

/**
 * Vitesse maximale autorisée dans l'application
 * Calculée comme 99.9% de la vitesse de la lumière
 * @constant {number}
 * @memberof PhysicsConstants
 */
export const MAX_VELOCITY = SPEED_OF_LIGHT * (1 - VELOCITY_EPSILON);

/**
 * Marge de sécurité pour les calculs de cône de lumière
 * Pourcentage de marge par rapport à la frontière du cône
 * @constant {number}
 * @default 0.02
 * @memberof PhysicsConstants
 */
export const LIGHT_CONE_MARGIN = 0.02;

/**
 * Précision minimale pour les calculs d'accélération
 * En dessous de cette valeur, l'accélération est considérée comme nulle
 * @constant {number}
 * @default 0.001
 * @memberof PhysicsConstants
 */
export const ACCELERATION_PRECISION = 0.001;

/**
 * Temps propre minimal pour les calculs d'isochrones
 * En dessous de cette valeur, les isochrones ne sont pas calculées
 * @constant {number}
 * @default 0.01
 * @memberof PhysicsConstants
 */
export const MIN_PROPER_TIME = 0.01;

/**
 * Limite temporelle maximale pour les calculs
 * Utilisée pour éviter les calculs infinis
 * @constant {number}
 * @default 500
 * @memberof PhysicsConstants
 */
export const MAX_TIME_COORDINATE = 500;

/**
 * Facteur de calibration pour les isochrones
 * Utilisé pour ajuster les courbes d'isochrones
 * @constant {number}
 * @default 1.0
 * @memberof PhysicsConstants
 */
export const ISOCHRONE_CALIBRATION_FACTOR = 1.0;

/**
 * Marge d'extension pour les courbes d'isochrones
 * Pourcentage d'extension au-delà des limites de l'écran
 * @constant {number}
 * @default 1.1
 * @memberof PhysicsConstants
 */
export const ISOCHRONE_EXTENSION_MARGIN = 1.1;

/**
 * Nombre de points pour le calcul des isochrones
 * Plus élevé = courbes plus lisses mais calculs plus lourds
 * @constant {number}
 * @default 500
 * @memberof PhysicsConstants
 */
export const ISOCHRONE_POINTS_COUNT = 500;

/**
 * Seuil de détection pour les interactions avec les isochrones
 * Distance en pixels pour considérer qu'on survole une isochrone
 * @constant {number}
 * @default 15
 * @memberof PhysicsConstants
 */
export const ISOCHRONE_HOVER_THRESHOLD = 15; 