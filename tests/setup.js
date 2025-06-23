/**
 * @fileoverview Configuration Jest pour les tests
 * @author Serge Fantino
 * @version 2.0.0
 */

require('jest-canvas-mock');

// Configuration globale pour les tests
global.console = {
  ...console,
  // Supprimer les logs pendant les tests sauf erreurs
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error
};

// Mock des APIs Web non disponibles dans jsdom
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now())
  }
});

// Mock de requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Configuration par défaut pour les tests de canvas
beforeEach(() => {
  // Reset des mocks
  jest.clearAllMocks();
}); 