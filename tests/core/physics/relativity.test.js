/**
 * @fileoverview Tests unitaires pour les calculs relativistes
 * @author Serge Fantino
 * @version 2.0.0
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  limitVelocity,
  lorentzFactor,
  addVelocitiesRelativistic,
  calculateProperAcceleration,
  calculateFinalVelocity,
  calculateProperTime,
  calculateVelocityRatio,
  isInsideLightCone,
  calculateHyperbolicPosition,
  calculateSegmentPhysics
} from '@core/physics/relativity.js';
import { SPEED_OF_LIGHT, MAX_VELOCITY } from '@core/physics/constants.js';

describe('RelativityUtils', () => {
  describe('limitVelocity', () => {
    test('should limit velocity to MAX_VELOCITY', () => {
      expect(limitVelocity(1.5)).toBe(MAX_VELOCITY);
      expect(limitVelocity(-1.5)).toBe(-MAX_VELOCITY);
    });

    test('should not modify velocities below limit', () => {
      expect(limitVelocity(0.5)).toBe(0.5);
      expect(limitVelocity(-0.5)).toBe(-0.5);
      expect(limitVelocity(0)).toBe(0);
    });

    test('should handle edge cases', () => {
      expect(limitVelocity(MAX_VELOCITY)).toBe(MAX_VELOCITY);
      expect(limitVelocity(MAX_VELOCITY + 0.001)).toBe(MAX_VELOCITY);
    });
  });

  describe('lorentzFactor', () => {
    test('should calculate correct Lorentz factor', () => {
      expect(lorentzFactor(0)).toBe(1);
      expect(lorentzFactor(0.5)).toBeCloseTo(1.1547, 4);
      expect(lorentzFactor(0.9)).toBeCloseTo(2.2942, 4);
    });

    test('should return Infinity for v >= c', () => {
      expect(lorentzFactor(1)).toBe(Infinity);
      expect(lorentzFactor(1.1)).toBe(Infinity);
    });

    test('should handle negative velocities', () => {
      expect(lorentzFactor(-0.5)).toBeCloseTo(1.1547, 4);
    });
  });

  describe('addVelocitiesRelativistic', () => {
    test('should add velocities relativistically', () => {
      // Cas classique: petites vitesses
      expect(addVelocitiesRelativistic(0.1, 0.1)).toBeCloseTo(0.198, 2);
      
      // Cas relativiste
      expect(addVelocitiesRelativistic(0.6, 0.6)).toBeCloseTo(0.882, 2);
      
      // Asymptote vers c
      expect(addVelocitiesRelativistic(0.9, 0.9)).toBeLessThan(1);
    });

    test('should handle zero velocities', () => {
      expect(addVelocitiesRelativistic(0, 0.5)).toBe(0.5);
      expect(addVelocitiesRelativistic(0.5, 0)).toBe(0.5);
      expect(addVelocitiesRelativistic(0, 0)).toBe(0);
    });

    test('should handle edge cases near c', () => {
      const result = addVelocitiesRelativistic(0.999, 0.999);
      expect(result).toBeLessThanOrEqual(MAX_VELOCITY);
      expect(result).toBeGreaterThanOrEqual(0.999);
    });

    test('should be commutative', () => {
      const v1 = 0.3;
      const v2 = 0.7;
      expect(addVelocitiesRelativistic(v1, v2)).toBeCloseTo(addVelocitiesRelativistic(v2, v1), 10);
    });
  });

  describe('calculateProperAcceleration', () => {
    test('should calculate proper acceleration correctly', () => {
      // Cas simple: déplacement spatial et temporel égaux
      const a1 = calculateProperAcceleration(100, 200);
      expect(a1).toBeGreaterThan(0);
      
      // Cas limite: proche du cône de lumière
      const a2 = calculateProperAcceleration(190, 200);
      expect(a2).toBeGreaterThan(a1);
    });

    test('should return 0 for invalid trajectories', () => {
      // Hors du cône de lumière
      expect(calculateProperAcceleration(200, 100)).toBe(0);
      
      // Temps négatif
      expect(calculateProperAcceleration(50, -100)).toBe(0);
      
      // Sur la frontière du cône
      expect(calculateProperAcceleration(100, 100)).toBe(0);
    });

    test('should handle zero displacement', () => {
      expect(calculateProperAcceleration(0, 100)).toBe(0);
    });

    test('should be symmetric for positive/negative spatial displacement', () => {
      const a1 = calculateProperAcceleration(50, 100);
      const a2 = calculateProperAcceleration(-50, 100);
      expect(a1).toBeCloseTo(a2, 10);
    });
  });

  describe('calculateFinalVelocity', () => {
    test('should calculate final velocity correctly', () => {
      const acceleration = 0.01;
      const deltaT = 100;
      
      const velocity = calculateFinalVelocity(acceleration, deltaT);
      expect(velocity).toBeGreaterThan(0);
      expect(velocity).toBeLessThan(1);
    });

    test('should return 0 for zero acceleration', () => {
      expect(calculateFinalVelocity(0, 100)).toBe(0);
      expect(calculateFinalVelocity(0.0001, 100)).toBe(0); // Below precision threshold
    });

    test('should approach but not exceed c', () => {
      const velocity = calculateFinalVelocity(1, 1000);
      expect(velocity).toBeLessThanOrEqual(MAX_VELOCITY);
    });

    test('should increase with acceleration and time', () => {
      const v1 = calculateFinalVelocity(0.01, 100);
      const v2 = calculateFinalVelocity(0.02, 100);
      const v3 = calculateFinalVelocity(0.01, 200);
      
      expect(v2).toBeGreaterThan(v1);
      expect(v3).toBeGreaterThan(v1);
    });
  });

  describe('calculateProperTime', () => {
    test('should calculate proper time correctly', () => {
      const acceleration = 0.01;
      const deltaT = 100;
      
      const properTime = calculateProperTime(acceleration, deltaT);
      expect(properTime).toBeGreaterThan(0);
      expect(properTime).toBeLessThan(deltaT); // Dilatation temporelle
    });

    test('should equal coordinate time for zero acceleration', () => {
      expect(calculateProperTime(0, 100)).toBe(100);
      expect(calculateProperTime(0.0001, 100)).toBe(100); // Below precision
    });

    test('should show time dilation effect', () => {
      const deltaT = 100;
      const lowAccel = calculateProperTime(0.001, deltaT);
      const highAccel = calculateProperTime(0.01, deltaT);
      
      expect(lowAccel).toBeCloseTo(deltaT, 0);
      expect(highAccel).toBeLessThan(lowAccel);
    });

    test('should handle large accelerations', () => {
      const properTime = calculateProperTime(10, 100);
      expect(properTime).toBeGreaterThan(0);
      expect(properTime).toBeLessThan(100);
    });
  });

  describe('calculateVelocityRatio', () => {
    test('should calculate velocity ratio correctly', () => {
      expect(calculateVelocityRatio(50, 100)).toBe(0.5);
      expect(calculateVelocityRatio(100, 100)).toBe(1);
      expect(calculateVelocityRatio(150, 100)).toBe(1); // Capped at c
    });

    test('should return 0 for non-positive time', () => {
      expect(calculateVelocityRatio(50, 0)).toBe(0);
      expect(calculateVelocityRatio(50, -10)).toBe(0);
    });

    test('should handle negative spatial displacement', () => {
      expect(calculateVelocityRatio(-50, 100)).toBe(0.5);
    });
  });

  describe('isInsideLightCone', () => {
    test('should correctly identify points inside light cone', () => {
      expect(isInsideLightCone(50, 100)).toBe(true);
      expect(isInsideLightCone(-50, 100)).toBe(true);
      expect(isInsideLightCone(0, 100)).toBe(true);
    });

    test('should correctly identify points outside light cone', () => {
      expect(isInsideLightCone(150, 100)).toBe(false);
      expect(isInsideLightCone(-150, 100)).toBe(false);
    });

    test('should handle boundary cases', () => {
      expect(isInsideLightCone(100, 100)).toBe(true); // On the boundary
      expect(isInsideLightCone(100.1, 100)).toBe(false); // Just outside
    });

    test('should respect margin parameter', () => {
      const margin = 0.1;
      expect(isInsideLightCone(90, 100, margin)).toBe(true);
      expect(isInsideLightCone(95, 100, margin)).toBe(false);
    });

    test('should return false for non-positive time', () => {
      expect(isInsideLightCone(50, 0)).toBe(false);
      expect(isInsideLightCone(50, -10)).toBe(false);
    });
  });

  describe('calculateHyperbolicPosition', () => {
    test('should calculate position for zero initial velocity', () => {
      const position = calculateHyperbolicPosition(0.01, 0, 100, 0);
      expect(position).toBeGreaterThan(0);
    });

    test('should calculate position for non-zero initial velocity', () => {
      const position = calculateHyperbolicPosition(0.01, 0.1, 100, 0);
      expect(position).toBeGreaterThan(0);
    });

    test('should reduce to linear motion for zero acceleration', () => {
      const initialVelocity = 0.5;
      const time = 100;
      const initialPosition = 10;
      
      const position = calculateHyperbolicPosition(0, initialVelocity, time, initialPosition);
      expect(position).toBeCloseTo(initialPosition + initialVelocity * time, 10);
    });

    test('should handle zero time', () => {
      const position = calculateHyperbolicPosition(0.01, 0.1, 0, 10);
      expect(position).toBe(10);
    });
  });

  describe('calculateSegmentPhysics', () => {
    test('should calculate complete physics for valid segment', () => {
      const physics = calculateSegmentPhysics({
        deltaX: 100,
        deltaT: 200,
        initialVelocity: 0
      });

      expect(physics).toHaveProperty('acceleration');
      expect(physics).toHaveProperty('finalVelocity');
      expect(physics).toHaveProperty('properTime');
      expect(physics).toHaveProperty('coordinateTime');
      expect(physics).toHaveProperty('velocityRatio');
      expect(physics).toHaveProperty('isValid');

      expect(physics.acceleration).toBeGreaterThan(0);
      expect(physics.coordinateTime).toBe(200);
      expect(physics.isValid).toBe(true);
      expect(physics.properTime).toBeLessThan(physics.coordinateTime);
    });

    test('should handle invalid segments', () => {
      const physics = calculateSegmentPhysics({
        deltaX: 200,
        deltaT: 100, // Outside light cone
        initialVelocity: 0
      });

      expect(physics.isValid).toBe(false);
      expect(physics.acceleration).toBe(0);
    });

    test('should preserve sign of spatial displacement in final velocity', () => {
      const physicsPositive = calculateSegmentPhysics({
        deltaX: 100,
        deltaT: 200,
        initialVelocity: 0
      });

      const physicsNegative = calculateSegmentPhysics({
        deltaX: -100,
        deltaT: 200,
        initialVelocity: 0
      });

      expect(physicsPositive.finalVelocity).toBeGreaterThan(0);
      expect(physicsNegative.finalVelocity).toBeLessThan(0);
      expect(Math.abs(physicsPositive.finalVelocity)).toBeCloseTo(Math.abs(physicsNegative.finalVelocity), 10);
    });

    test('should handle zero displacement', () => {
      const physics = calculateSegmentPhysics({
        deltaX: 0,
        deltaT: 100,
        initialVelocity: 0
      });

      expect(physics.acceleration).toBe(0);
      expect(physics.finalVelocity).toBe(0);
      expect(physics.properTime).toBe(physics.coordinateTime);
      expect(physics.isValid).toBe(true);
    });
  });

  describe('Physical consistency tests', () => {
    test('velocity addition should never exceed c', () => {
      const testCases = [
        [0.9, 0.9],
        [0.99, 0.99],
        [0.999, 0.999],
        [-0.9, 0.9],
        [0.5, -0.8]
      ];

      testCases.forEach(([v1, v2]) => {
        const result = addVelocitiesRelativistic(v1, v2);
        expect(Math.abs(result)).toBeLessThanOrEqual(MAX_VELOCITY);
      });
    });

    test('proper time should always be less than or equal to coordinate time', () => {
      const testCases = [
        { a: 0.001, t: 100 },
        { a: 0.01, t: 100 },
        { a: 0.1, t: 100 },
        { a: 1, t: 100 }
      ];

      testCases.forEach(({ a, t }) => {
        const properTime = calculateProperTime(a, t);
        expect(properTime).toBeLessThanOrEqual(t);
      });
    });

    test('Lorentz factor should always be >= 1', () => {
      const velocities = [0, 0.1, 0.5, 0.9, 0.99, 0.999];
      
      velocities.forEach(v => {
        const gamma = lorentzFactor(v);
        expect(gamma).toBeGreaterThanOrEqual(1);
      });
    });

    test('acceleration should increase as we approach light cone boundary', () => {
      const deltaT = 100;
      const positions = [10, 50, 80, 95, 99];
      
      let previousAccel = 0;
      positions.forEach(deltaX => {
        const accel = calculateProperAcceleration(deltaX, deltaT);
        expect(accel).toBeGreaterThanOrEqual(previousAccel);
        previousAccel = accel;
      });
    });
  });
}); 