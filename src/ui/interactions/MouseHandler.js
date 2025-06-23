/**
 * @fileoverview Gestionnaire centralisé des interactions souris
 * @author Serge Fantino
 * @version 2.0.0
 */

import EventEmitter from 'eventemitter3';

/**
 * Gestionnaire centralisé pour toutes les interactions souris sur le canvas
 * @class MouseHandler
 * @extends EventEmitter
 */
export class MouseHandler extends EventEmitter {
  /**
   * Crée un nouveau gestionnaire de souris
   * @param {HTMLCanvasElement} canvas - Élément canvas
   * @param {CanvasRenderer} renderer - Renderer pour les conversions de coordonnées
   * @param {Object} [options] - Options de configuration
   */
  constructor(canvas, renderer, options = {}) {
    super();
    
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Un élément canvas HTML valide est requis');
    }
    
    if (!renderer || typeof renderer.screenToWorld !== 'function') {
      throw new Error('Un renderer avec méthode screenToWorld est requis');
    }
    
    /**
     * Élément canvas
     * @type {HTMLCanvasElement}
     * @readonly
     */
    this.canvas = canvas;
    
    /**
     * Renderer pour les conversions
     * @type {CanvasRenderer}
     * @readonly
     */
    this.renderer = renderer;
    
    /**
     * Options de configuration
     * @type {Object}
     * @private
     */
    this._options = {
      enableDrag: true,
      enableHover: true,
      enableClick: true,
      enableDoubleClick: true,
      enableWheel: true,
      hoverThreshold: 10, // pixels
      doubleClickDelay: 300, // ms
      ...options
    };
    
    /**
     * État de la souris
     * @type {Object}
     * @private
     */
    this._mouseState = {
      isDown: false,
      isDragging: false,
      button: -1,
      position: { x: 0, y: 0 },
      worldPosition: { x: 0, y: 0 },
      lastPosition: { x: 0, y: 0 },
      dragStart: { x: 0, y: 0 },
      lastClickTime: 0
    };
    
    /**
     * Éléments sous la souris
     * @type {Object}
     * @private
     */
    this._hoverState = {
      currentElement: null,
      lastElement: null,
      isHovering: false
    };
    
    /**
     * Gestionnaires d'événements
     * @type {Object}
     * @private
     */
    this._eventHandlers = {};
    
    // Initialiser les événements
    this._setupEventListeners();
    
    // Configurer le curseur
    this.canvas.style.cursor = 'crosshair';
    
    this.emit('initialized');
  }
  
  /**
   * Configure les écouteurs d'événements
   * @private
   */
  _setupEventListeners() {
    // Événements de souris
    this._eventHandlers.mousedown = this._onMouseDown.bind(this);
    this._eventHandlers.mousemove = this._onMouseMove.bind(this);
    this._eventHandlers.mouseup = this._onMouseUp.bind(this);
    this._eventHandlers.mouseleave = this._onMouseLeave.bind(this);
    this._eventHandlers.wheel = this._onWheel.bind(this);
    this._eventHandlers.contextmenu = this._onContextMenu.bind(this);
    
    // Ajouter les écouteurs
    this.canvas.addEventListener('mousedown', this._eventHandlers.mousedown);
    this.canvas.addEventListener('mousemove', this._eventHandlers.mousemove);
    this.canvas.addEventListener('mouseup', this._eventHandlers.mouseup);
    this.canvas.addEventListener('mouseleave', this._eventHandlers.mouseleave);
    this.canvas.addEventListener('wheel', this._eventHandlers.wheel);
    this.canvas.addEventListener('contextmenu', this._eventHandlers.contextmenu);
    
    // Événements tactiles pour mobile
    this._eventHandlers.touchstart = this._onTouchStart.bind(this);
    this._eventHandlers.touchmove = this._onTouchMove.bind(this);
    this._eventHandlers.touchend = this._onTouchEnd.bind(this);
    
    this.canvas.addEventListener('touchstart', this._eventHandlers.touchstart);
    this.canvas.addEventListener('touchmove', this._eventHandlers.touchmove);
    this.canvas.addEventListener('touchend', this._eventHandlers.touchend);
  }
  
  /**
   * Gestionnaire mousedown
   * @param {MouseEvent} event - Événement souris
   * @private
   */
  _onMouseDown(event) {
    event.preventDefault();
    
    const { x, y } = this._getCanvasCoordinates(event);
    const worldPos = this.renderer.screenToWorld(x, y);
    
    this._mouseState.isDown = true;
    this._mouseState.button = event.button;
    this._mouseState.position = { x, y };
    this._mouseState.worldPosition = worldPos;
    this._mouseState.dragStart = { x, y };
    this._mouseState.lastPosition = { x, y };
    
    // Émettre l'événement
    this.emit('mouseDown', {
      button: event.button,
      position: { x, y },
      worldPosition: worldPos,
      originalEvent: event
    });
    
    // Changer le curseur
    this.canvas.style.cursor = 'grabbing';
  }
  
  /**
   * Gestionnaire mousemove
   * @param {MouseEvent} event - Événement souris
   * @private
   */
  _onMouseMove(event) {
    const { x, y } = this._getCanvasCoordinates(event);
    const worldPos = this.renderer.screenToWorld(x, y);
    
    // Calculer le déplacement
    const deltaX = x - this._mouseState.lastPosition.x;
    const deltaY = y - this._mouseState.lastPosition.y;
    
    // Mettre à jour l'état
    this._mouseState.position = { x, y };
    this._mouseState.worldPosition = worldPos;
    
    // Gérer le drag
    if (this._mouseState.isDown && this._options.enableDrag) {
      if (!this._mouseState.isDragging) {
        // Commencer le drag si le seuil est dépassé
        const dragDistance = Math.sqrt(
          Math.pow(x - this._mouseState.dragStart.x, 2) +
          Math.pow(y - this._mouseState.dragStart.y, 2)
        );
        
        if (dragDistance > 3) { // Seuil de 3 pixels
          this._mouseState.isDragging = true;
          this.emit('dragStart', {
            position: { x, y },
            worldPosition: worldPos,
            startPosition: this._mouseState.dragStart,
            originalEvent: event
          });
        }
      }
      
      if (this._mouseState.isDragging) {
        this.emit('drag', {
          position: { x, y },
          worldPosition: worldPos,
          delta: { x: deltaX, y: deltaY },
          startPosition: this._mouseState.dragStart,
          originalEvent: event
        });
      }
    }
    
    // Gérer le hover
    if (this._options.enableHover) {
      this._handleHover(x, y, worldPos, event);
    }
    
    // Émettre l'événement move général
    this.emit('mouseMove', {
      position: { x, y },
      worldPosition: worldPos,
      delta: { x: deltaX, y: deltaY },
      isDragging: this._mouseState.isDragging,
      originalEvent: event
    });
    
    this._mouseState.lastPosition = { x, y };
  }
  
  /**
   * Gestionnaire mouseup
   * @param {MouseEvent} event - Événement souris
   * @private
   */
  _onMouseUp(event) {
    const { x, y } = this._getCanvasCoordinates(event);
    const worldPos = this.renderer.screenToWorld(x, y);
    
    // Gérer la fin du drag
    if (this._mouseState.isDragging) {
      this.emit('dragEnd', {
        position: { x, y },
        worldPosition: worldPos,
        startPosition: this._mouseState.dragStart,
        originalEvent: event
      });
    } else if (this._mouseState.isDown && this._options.enableClick) {
      // C'est un clic
      this._handleClick(x, y, worldPos, event);
    }
    
    // Émettre l'événement mouseUp
    this.emit('mouseUp', {
      button: this._mouseState.button,
      position: { x, y },
      worldPosition: worldPos,
      wasDragging: this._mouseState.isDragging,
      originalEvent: event
    });
    
    // Réinitialiser l'état
    this._mouseState.isDown = false;
    this._mouseState.isDragging = false;
    this._mouseState.button = -1;
    
    // Restaurer le curseur
    this.canvas.style.cursor = 'crosshair';
  }
  
  /**
   * Gestionnaire mouseleave
   * @param {MouseEvent} event - Événement souris
   * @private
   */
  _onMouseLeave(event) {
    // Terminer le drag si en cours
    if (this._mouseState.isDragging) {
      this.emit('dragEnd', {
        position: this._mouseState.position,
        worldPosition: this._mouseState.worldPosition,
        startPosition: this._mouseState.dragStart,
        cancelled: true,
        originalEvent: event
      });
    }
    
    // Terminer le hover
    if (this._hoverState.isHovering) {
      this._endHover(event);
    }
    
    // Réinitialiser l'état
    this._mouseState.isDown = false;
    this._mouseState.isDragging = false;
    
    this.emit('mouseLeave', { originalEvent: event });
  }
  
  /**
   * Gestionnaire wheel
   * @param {WheelEvent} event - Événement de roulette
   * @private
   */
  _onWheel(event) {
    if (!this._options.enableWheel) return;
    
    event.preventDefault();
    
    const { x, y } = this._getCanvasCoordinates(event);
    const worldPos = this.renderer.screenToWorld(x, y);
    
    this.emit('wheel', {
      position: { x, y },
      worldPosition: worldPos,
      deltaY: event.deltaY,
      deltaX: event.deltaX,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      originalEvent: event
    });
  }
  
  /**
   * Gestionnaire contextmenu
   * @param {MouseEvent} event - Événement de menu contextuel
   * @private
   */
  _onContextMenu(event) {
    event.preventDefault(); // Empêcher le menu contextuel par défaut
    
    const { x, y } = this._getCanvasCoordinates(event);
    const worldPos = this.renderer.screenToWorld(x, y);
    
    this.emit('contextMenu', {
      position: { x, y },
      worldPosition: worldPos,
      originalEvent: event
    });
  }
  
  /**
   * Gère les clics et double-clics
   * @param {number} x - Position X écran
   * @param {number} y - Position Y écran
   * @param {Object} worldPos - Position monde
   * @param {MouseEvent} event - Événement original
   * @private
   */
  _handleClick(x, y, worldPos, event) {
    const now = Date.now();
    const timeSinceLastClick = now - this._mouseState.lastClickTime;
    
    if (timeSinceLastClick < this._options.doubleClickDelay && this._options.enableDoubleClick) {
      // Double clic
      this.emit('doubleClick', {
        position: { x, y },
        worldPosition: worldPos,
        button: event.button,
        originalEvent: event
      });
    } else {
      // Clic simple
      this.emit('click', {
        position: { x, y },
        worldPosition: worldPos,
        button: event.button,
        originalEvent: event
      });
    }
    
    this._mouseState.lastClickTime = now;
  }
  
  /**
   * Gère les événements de hover
   * @param {number} x - Position X écran
   * @param {number} y - Position Y écran
   * @param {Object} worldPos - Position monde
   * @param {MouseEvent} event - Événement original
   * @private
   */
  _handleHover(x, y, worldPos, event) {
    // Émettre l'événement hover général
    this.emit('hover', {
      position: { x, y },
      worldPosition: worldPos,
      originalEvent: event
    });
    
    // Logique de détection d'éléments à implémenter selon les besoins
    // Pour l'instant, juste émettre les événements de base
  }
  
  /**
   * Termine un hover en cours
   * @param {MouseEvent} event - Événement original
   * @private
   */
  _endHover(event) {
    if (this._hoverState.currentElement) {
      this.emit('hoverEnd', {
        element: this._hoverState.currentElement,
        originalEvent: event
      });
    }
    
    this._hoverState.currentElement = null;
    this._hoverState.isHovering = false;
  }
  
  /**
   * Gestionnaire touchstart (mobile)
   * @param {TouchEvent} event - Événement tactile
   * @private
   */
  _onTouchStart(event) {
    event.preventDefault();
    
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const mouseEvent = this._touchToMouseEvent(touch, 'mousedown');
      this._onMouseDown(mouseEvent);
    }
  }
  
  /**
   * Gestionnaire touchmove (mobile)
   * @param {TouchEvent} event - Événement tactile
   * @private
   */
  _onTouchMove(event) {
    event.preventDefault();
    
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const mouseEvent = this._touchToMouseEvent(touch, 'mousemove');
      this._onMouseMove(mouseEvent);
    }
  }
  
  /**
   * Gestionnaire touchend (mobile)
   * @param {TouchEvent} event - Événement tactile
   * @private
   */
  _onTouchEnd(event) {
    event.preventDefault();
    
    const mouseEvent = {
      button: 0,
      clientX: this._mouseState.position.x,
      clientY: this._mouseState.position.y,
      preventDefault: () => {}
    };
    
    this._onMouseUp(mouseEvent);
  }
  
  /**
   * Convertit un événement tactile en événement souris
   * @param {Touch} touch - Événement tactile
   * @param {string} type - Type d'événement souris
   * @returns {Object} Événement souris simulé
   * @private
   */
  _touchToMouseEvent(touch, type) {
    return {
      type,
      button: 0,
      clientX: touch.clientX,
      clientY: touch.clientY,
      preventDefault: () => {}
    };
  }
  
  /**
   * Obtient les coordonnées relatives au canvas
   * @param {MouseEvent} event - Événement souris
   * @returns {Object} Coordonnées {x, y}
   * @private
   */
  _getCanvasCoordinates(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }
  
  /**
   * Obtient la position actuelle de la souris
   * @returns {Object} Position {screen: {x, y}, world: {x, y}}
   */
  getMousePosition() {
    return {
      screen: { ...this._mouseState.position },
      world: { ...this._mouseState.worldPosition }
    };
  }
  
  /**
   * Obtient l'état actuel de la souris
   * @returns {Object} État de la souris
   */
  getMouseState() {
    return {
      isDown: this._mouseState.isDown,
      isDragging: this._mouseState.isDragging,
      button: this._mouseState.button,
      position: { ...this._mouseState.position },
      worldPosition: { ...this._mouseState.worldPosition }
    };
  }
  
  /**
   * Active ou désactive un type d'interaction
   * @param {string} type - Type d'interaction
   * @param {boolean} enabled - État activé/désactivé
   */
  setInteractionEnabled(type, enabled) {
    if (this._options.hasOwnProperty(`enable${type.charAt(0).toUpperCase()}${type.slice(1)}`)) {
      this._options[`enable${type.charAt(0).toUpperCase()}${type.slice(1)}`] = enabled;
      this.emit('interactionToggled', { type, enabled });
    }
  }
  
  /**
   * Change le curseur
   * @param {string} cursor - Type de curseur CSS
   */
  setCursor(cursor) {
    this.canvas.style.cursor = cursor;
  }
  
  /**
   * Détruit le gestionnaire et libère les ressources
   */
  destroy() {
    // Supprimer tous les écouteurs
    Object.entries(this._eventHandlers).forEach(([event, handler]) => {
      this.canvas.removeEventListener(event, handler);
    });
    
    // Nettoyer les références
    this._eventHandlers = {};
    this._mouseState = {};
    this._hoverState = {};
    
    this.removeAllListeners();
    this.emit('destroyed');
  }
} 