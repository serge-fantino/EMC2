/**
 * @fileoverview Tests unitaires pour les calculs de trajectoires
 * @author Serge Fantino
 * @version 2.0.0
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  calculateHyperbolicTrajectory,
  calculateIsochronePoints,
  calculateCoordinateTimeForIsochrone,
  calculateCumulativeTrajectory,
  generateTwinParadoxDemo,
  findTrajectoryIsochroneIntersections,
  optimizeTrajectoryForMinimalProperTime,
  calculateTrajectoryCurvature
} from '@core/physics/trajectories.js';

describe('TrajectoryUtils', () => {
  describe('calculateHyperbolicTrajectory', () => {
    test('should calculate trajectory with valid parameters', () => {
      const trajectory = calculateHyperbolicTrajectory({
        startX: 0,
        startT: 0,
        endX: 100,
        endT: 200,
        points: 10
      });

      expect(trajectory).toHaveProperty('points');
      expect(trajectory).toHaveProperty('physics');
      expect(trajectory).toHaveProperty('bounds');
      expect(trajectory.points).toHaveLength(11); // 0 to 10 inclusive
      expect(trajectory.physics.acceleration).toBeGreaterThan(0);
      expect(trajectory.physics.properTime).toBeLessThan(trajectory.physics.coordinateTime);
    });

    test('should throw error for invalid time', () => {
      expect(() => {
        calculateHyperbolicTrajectory({
          startX: 0,
          startT: 100,
          endX: 100,
          endT: 50 // Invalid: end before start
        });
      }).toThrow('Le temps d\'arrivée doit être postérieur au temps de départ');
    });

    test('should throw error for trajectory outside light cone', () => {
      expect(() => {
        calculateHyperbolicTrajectory({
          startX: 0,
          startT: 0,
          endX: 300, // Too far for the time
          endT: 200
        });
      }).toThrow('La trajectoire doit rester dans le cône de lumière');
    });

    test('should include initial velocity in calculations', () => {
      const trajectory1 = calculateHyperbolicTrajectory({
        startX: 0,
        startT: 0,
        endX: 100,
        endT: 200,
        initialVelocity: 0,
        points: 5
      });

      const trajectory2 = calculateHyperbolicTrajectory({
        startX: 0,
        startT: 0,
        endX: 100,
        endT: 200,
        initialVelocity: 0.1,
        points: 5
      });

      expect(trajectory1.physics.initialVelocity).toBe(0);
      expect(trajectory2.physics.initialVelocity).toBe(0.1);
      
      // La vitesse initiale devrait affecter les points intermédiaires de la trajectoire
      const midPoint1 = trajectory1.points[2]; // Point au milieu
      const midPoint2 = trajectory2.points[2];
      expect(Math.abs(midPoint1.x - midPoint2.x)).toBeGreaterThan(0.1);
    });
  });

  describe('calculateIsochronePoints', () => {
    const bounds = { minX: -200, maxX: 200, maxT: 500 };

    test('should calculate isochrone points', () => {
      const points = calculateIsochronePoints({
        originX: 0,
        originT: 0,
        properTime: 50,
        bounds
      });

      expect(Array.isArray(points)).toBe(true);
      expect(points.length).toBeGreaterThan(0);
      
      // Tous les points doivent avoir des coordonnées valides
      points.forEach(point => {
        expect(typeof point.x).toBe('number');
        expect(typeof point.t).toBe('number');
        expect(point.t).toBeGreaterThan(0); // Dans le futur
      });
    });

    test('should return empty array for very small proper time', () => {
      const points = calculateIsochronePoints({
        originX: 0,
        originT: 0,
        properTime: 0.001, // Below MIN_PROPER_TIME
        bounds
      });

      expect(points).toHaveLength(0);
    });

    test('should respect bounds', () => {
      const restrictedBounds = { minX: -50, maxX: 50, maxT: 100 };
      const points = calculateIsochronePoints({
        originX: 0,
        originT: 0,
        properTime: 20,
        bounds: restrictedBounds
      });

      points.forEach(point => {
        expect(point.t).toBeLessThanOrEqual(restrictedBounds.maxT);
      });
    });
  });

  describe('calculateCoordinateTimeForIsochrone', () => {
    test('should calculate coordinate time correctly', () => {
      const coordinateTime = calculateCoordinateTimeForIsochrone(0, 0, 50, 30);
      
      expect(typeof coordinateTime).toBe('number');
      expect(coordinateTime).toBeGreaterThan(0);
      expect(coordinateTime).toBeGreaterThan(30); // Should be greater than proper time
    });

    test('should handle zero spatial displacement', () => {
      const coordinateTime = calculateCoordinateTimeForIsochrone(0, 0, 0, 30);
      
      expect(coordinateTime).toBe(30); // Should equal proper time for no spatial movement
    });

    test('should handle origin offset', () => {
      const time1 = calculateCoordinateTimeForIsochrone(0, 0, 50, 30);
      const time2 = calculateCoordinateTimeForIsochrone(100, 50, 150, 30);
      
      expect(time2).toBe(time1 + 50); // Should account for origin offset
    });
  });

  describe('calculateCumulativeTrajectory', () => {
    test('should calculate cumulative trajectory', () => {
      const frames = [
        { x: 0, t: 0 },
        { x: 50, t: 100 },
        { x: 150, t: 250 },
        { x: 100, t: 400 }
      ];

      const result = calculateCumulativeTrajectory(frames);

      expect(result).toHaveProperty('segments');
      expect(result).toHaveProperty('totalPhysics');
      expect(result.segments).toHaveLength(3); // n-1 segments
      
      const { totalPhysics } = result;
      expect(totalPhysics.totalProperTime).toBeLessThanOrEqual(totalPhysics.totalCoordinateTime);
      expect(Math.abs(totalPhysics.finalVelocity)).toBeLessThan(1);
      expect(totalPhysics.timeDilationPercentage).toBeGreaterThanOrEqual(0);
    });

    test('should throw error for empty array', () => {
      expect(() => {
        calculateCumulativeTrajectory([]);
      }).toThrow('Il faut au moins un référentiel');
    });

    test('should handle single frame', () => {
      const frames = [{ x: 0, t: 0 }];
      
      const result = calculateCumulativeTrajectory(frames);
      
      expect(result.segments).toHaveLength(0);
      expect(result.totalPhysics.totalProperTime).toBe(0);
      expect(result.totalPhysics.totalCoordinateTime).toBe(0);
    });

    test('should accumulate velocities relativistically', () => {
      const frames = [
        { x: 0, t: 0 },
        { x: 80, t: 100 }, // High velocity segment
        { x: 160, t: 200 } // Another high velocity segment
      ];

      const result = calculateCumulativeTrajectory(frames);
      
      // Final velocity should be less than sum of individual velocities
      expect(Math.abs(result.totalPhysics.finalVelocity)).toBeLessThan(1.6);
    });
  });

  describe('generateTwinParadoxDemo', () => {
    test('should generate twin paradox trajectory', () => {
      const frames = generateTwinParadoxDemo({
        maxDistance: 200,
        totalTime: 500,
        accelerationPhase: 0.1
      });

      expect(Array.isArray(frames)).toBe(true);
      expect(frames).toHaveLength(7); // Origin + 6 phases
      
      // First frame should be origin
      expect(frames[0].x).toBe(0);
      expect(frames[0].t).toBe(0);
      expect(frames[0].sourceFrame).toBeNull();
      
      // Last frame should return to origin
      expect(frames[6].x).toBe(0);
      expect(frames[6].t).toBe(500);
      
      // Maximum distance should be reached
      const maxX = Math.max(...frames.map(f => f.x));
      expect(maxX).toBe(200);
    });

    test('should respect acceleration phase parameter', () => {
      const frames1 = generateTwinParadoxDemo({
        maxDistance: 200,
        totalTime: 500,
        accelerationPhase: 0.1
      });

      const frames2 = generateTwinParadoxDemo({
        maxDistance: 200,
        totalTime: 500,
        accelerationPhase: 0.2
      });

      // Different acceleration phases should produce different trajectories
      expect(frames1[1].t).not.toEqual(frames2[1].t);
    });
  });

  describe('findTrajectoryIsochroneIntersections', () => {
    test('should find intersections between trajectory and isochrone', () => {
      const trajectoryPoints = [
        { x: 0, t: 0 },
        { x: 50, t: 100 },
        { x: 100, t: 200 }
      ];

      const isochronePoints = [
        { x: 40, t: 90 },
        { x: 50, t: 100 },
        { x: 60, t: 110 }
      ];

      const intersections = findTrajectoryIsochroneIntersections(
        trajectoryPoints,
        isochronePoints,
        10 // tolerance
      );

      expect(Array.isArray(intersections)).toBe(true);
      expect(intersections.length).toBeGreaterThan(0);
      
      intersections.forEach(intersection => {
        expect(intersection).toHaveProperty('trajectory');
        expect(intersection).toHaveProperty('isochrone');
        expect(intersection).toHaveProperty('distance');
        expect(intersection.distance).toBeLessThanOrEqual(10);
      });
    });

    test('should return empty array when no intersections', () => {
      const trajectoryPoints = [{ x: 0, t: 0 }];
      const isochronePoints = [{ x: 100, t: 100 }];

      const intersections = findTrajectoryIsochroneIntersections(
        trajectoryPoints,
        isochronePoints,
        5
      );

      expect(intersections).toHaveLength(0);
    });

    test('should limit number of intersections', () => {
      // Create many overlapping points
      const trajectoryPoints = Array.from({ length: 50 }, (_, i) => ({
        x: i,
        t: i
      }));

      const isochronePoints = Array.from({ length: 50 }, (_, i) => ({
        x: i,
        t: i
      }));

      const intersections = findTrajectoryIsochroneIntersections(
        trajectoryPoints,
        isochronePoints,
        1
      );

      expect(intersections.length).toBeLessThanOrEqual(10); // Max 10 intersections
    });
  });

  describe('optimizeTrajectoryForMinimalProperTime', () => {
    test('should optimize trajectory for minimal proper time', () => {
      const optimized = optimizeTrajectoryForMinimalProperTime({
        startX: 0,
        startT: 0,
        endX: 100,
        endT: 200
      });

      expect(optimized).toHaveProperty('points');
      expect(optimized).toHaveProperty('physics');
      expect(optimized.physics.properTime).toBeLessThan(optimized.physics.coordinateTime);
    });

    test('should throw error for waypoints (not implemented)', () => {
      expect(() => {
        optimizeTrajectoryForMinimalProperTime({
          startX: 0,
          startT: 0,
          endX: 100,
          endT: 200,
          waypoints: [{ x: 50, t: 100 }]
        });
      }).toThrow('Les points de passage ne sont pas encore supportés');
    });
  });

  describe('calculateTrajectoryCurvature', () => {
    test('should calculate curvature for straight line', () => {
      const straightLine = [
        { x: 0, t: 0 },
        { x: 50, t: 100 },
        { x: 100, t: 200 }
      ];

      const curvature = calculateTrajectoryCurvature(straightLine, 1);
      expect(curvature).toBeCloseTo(0, 5); // Straight line has zero curvature
    });

    test('should calculate curvature for curved trajectory', () => {
      const curvedTrajectory = [
        { x: 0, t: 0 },
        { x: 50, t: 100 },
        { x: 75, t: 200 } // Curved
      ];

      const curvature = calculateTrajectoryCurvature(curvedTrajectory, 1);
      expect(curvature).toBeGreaterThan(0);
    });

    test('should return 0 for edge points', () => {
      const trajectory = [
        { x: 0, t: 0 },
        { x: 50, t: 100 },
        { x: 100, t: 200 }
      ];

      expect(calculateTrajectoryCurvature(trajectory, 0)).toBe(0); // First point
      expect(calculateTrajectoryCurvature(trajectory, 2)).toBe(0); // Last point
    });

    test('should handle degenerate cases', () => {
      const degenerateTrajectory = [
        { x: 0, t: 0 },
        { x: 0, t: 0 }, // Same point
        { x: 0, t: 0 }
      ];

      const curvature = calculateTrajectoryCurvature(degenerateTrajectory, 1);
      expect(curvature).toBe(0);
    });
  });

  describe('Integration tests', () => {
    test('should maintain physical consistency across all calculations', () => {
      const frames = [
        { x: 0, t: 0 },
        { x: 80, t: 120 },
        { x: 160, t: 300 },
        { x: 80, t: 480 },
        { x: 0, t: 600 }
      ];

      const trajectory = calculateCumulativeTrajectory(frames);
      
      // Physical consistency checks
      expect(trajectory.totalPhysics.totalProperTime).toBeLessThanOrEqual(
        trajectory.totalPhysics.totalCoordinateTime + 1e-10
      );
      
      expect(Math.abs(trajectory.totalPhysics.finalVelocity)).toBeLessThan(1);
      
      trajectory.segments.forEach(segment => {
        expect(segment.physics.properTime).toBeLessThanOrEqual(
          segment.physics.deltaT + 1e-10
        );
      });
    });

    test('should handle twin paradox scenario correctly', () => {
      const twinFrames = generateTwinParadoxDemo({
        maxDistance: 100,
        totalTime: 300,
        accelerationPhase: 0.15
      });

      const trajectory = calculateCumulativeTrajectory(twinFrames);
      
      // Twin should experience time dilation
      expect(trajectory.totalPhysics.timeDilationPercentage).toBeGreaterThan(0);
      expect(trajectory.totalPhysics.totalProperTime).toBeLessThan(
        trajectory.totalPhysics.totalCoordinateTime
      );
      
      // Should return to origin
      expect(twinFrames[twinFrames.length - 1].x).toBe(0);
    });
  });
}); 