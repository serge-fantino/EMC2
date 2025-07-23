/**
 * Gestionnaire du panneau latéral avec accordéons
 * @module ui/sidepanel
 */

class SidePanelManager {
    constructor() {
        this.isCollapsed = false;
        this.currentWidth = 350;
        this.minWidth = 250;
        this.maxWidth = window.innerWidth * 0.5;
        this.expandedSections = new Set(['about']); // Par défaut: À Propos ouvert
        this.isResizing = false;
        
        // Références DOM
        this.sidePanel = null;
        this.panelToggle = null;
        this.floatingReopenBtn = null;
        this.accordionSections = null;
        this.resizeHandle = null;
        this.canvasContainer = null;
    }

    /**
     * Initialise le gestionnaire du panneau latéral
     */
    init() {
        console.log('🎨 Initializing SidePanel Manager...');
        
        // Obtenir les références DOM
        this.sidePanel = document.getElementById('sidePanel');
        this.panelToggle = document.getElementById('sidePanelToggle');
        this.floatingReopenBtn = document.getElementById('floatingReopenBtn');
        this.accordionSections = document.querySelectorAll('.accordion-section');
        this.resizeHandle = document.querySelector('.resize-handle');
        this.canvasContainer = document.getElementById('canvasContainer');
        
        if (!this.sidePanel) {
            console.error('SidePanel element not found!');
            return;
        }
        
        // Configurer les event listeners
        this.setupEventListeners();
        
        // Charger l'état sauvegardé
        this.loadState();
        
        // Appliquer l'état initial
        this.applyState();
        
        console.log('✅ SidePanel Manager initialized');
    }

    /**
     * Configure tous les event listeners
     */
    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        // Toggle du panneau
        if (this.panelToggle) {
            console.log('✅ Panel toggle button found');
            this.panelToggle.addEventListener('click', () => {
                console.log('🖱️ Panel toggle clicked');
                this.togglePanel();
            });
        } else {
            console.warn('❌ Panel toggle button not found');
        }

        // Bouton flottant pour réouvrir
        if (this.floatingReopenBtn) {
            console.log('✅ Floating reopen button found');
            this.floatingReopenBtn.addEventListener('click', () => {
                console.log('🖱️ Floating reopen clicked');
                this.expand();
            });
        } else {
            console.warn('❌ Floating reopen button not found');
        }

        // Accordéons
        console.log(`📋 Found ${this.accordionSections.length} accordion sections`);
        this.accordionSections.forEach((section, index) => {
            const header = section.querySelector('.accordion-header');
            const sectionName = section.dataset.section;
            console.log(`📝 Section ${index}: ${sectionName}`, header ? '✅' : '❌');
            
            if (header) {
                header.addEventListener('click', () => {
                    console.log(`🖱️ Accordion clicked: ${sectionName}`);
                    this.toggleSection(sectionName);
                });
            }
        });

        // Redimensionnement
        if (this.resizeHandle) {
            console.log('✅ Resize handle found');
            this.resizeHandle.addEventListener('mousedown', (e) => {
                console.log('🖱️ Resize started');
                this.startResize(e);
            });
        } else {
            console.warn('❌ Resize handle not found');
        }

        // Listeners globaux pour le redimensionnement
        document.addEventListener('mousemove', (e) => this.handleResize(e));
        document.addEventListener('mouseup', () => this.stopResize());
        
        // Redimensionnement de la fenêtre
        window.addEventListener('resize', () => {
            this.maxWidth = window.innerWidth * 0.5;
            if (this.currentWidth > this.maxWidth) {
                this.currentWidth = this.maxWidth;
                this.applyWidth();
            }
            
            // Déclencher aussi le redimensionnement du canvas
            if (window.resizeCanvas) {
                console.log('🔄 Window resize triggered canvas resize');
                window.resizeCanvas();
            }
        });
    }

    /**
     * Bascule l'état du panneau (ouvert/fermé)
     */
    togglePanel() {
        this.isCollapsed = !this.isCollapsed;
        this.applyState();
        this.saveState();
        
        console.log(`Panel ${this.isCollapsed ? 'collapsed' : 'expanded'}`);
        
        // Méthode 1: Écouter l'événement transitionend pour être sûr
        const handleTransitionEnd = (event) => {
            // S'assurer que c'est bien la transition de width qui s'est terminée
            if (event.target === this.sidePanel && event.propertyName === 'width') {
                console.log('🎯 Panel transition completed via transitionend');
                this.sidePanel.removeEventListener('transitionend', handleTransitionEnd);
                
                                 // Attendre un petit délai supplémentaire pour le layout
                 setTimeout(() => {
                     console.log('🔄 Canvas resize after transitionend...');
                     if (window.resizeCanvas) {
                         window.resizeCanvas();
                         console.log('✅ Canvas resized via transitionend');
                         
                         // Double appel pour être absolument sûr
                         setTimeout(() => {
                             console.log('🔄 Double-check canvas resize...');
                             window.resizeCanvas();
                         }, 100);
                     }
                 }, 100); // Délai un peu plus long
            }
        };
        
        this.sidePanel.addEventListener('transitionend', handleTransitionEnd);
        
        // Méthode 2: Fallback avec setTimeout (au cas où transitionend ne marche pas)
        setTimeout(() => {
            console.log('🔄 Fallback canvas resize after timeout...');
            console.log('🔍 Panel collapsed state:', this.isCollapsed);
            
            // Vérifier que les dimensions du container ont bien changé
            const canvas = document.getElementById('canvas');
            const container = canvas?.parentElement;
            if (container) {
                const rect = container.getBoundingClientRect();
                console.log('🔍 Container dimensions:', rect.width, 'x', rect.height);
            }
            
            if (window.resizeCanvas) {
                window.resizeCanvas();
                console.log('✅ Canvas resize triggered via timeout');
            }
            
        }, 600); // Délai de sécurité plus long
    }

    /**
     * Bascule l'état d'une section d'accordéon
     * @param {string} sectionName - Nom de la section
     */
    toggleSection(sectionName) {
        if (this.expandedSections.has(sectionName)) {
            this.expandedSections.delete(sectionName);
        } else {
            this.expandedSections.add(sectionName);
        }
        
        this.applySectionStates();
        this.saveState();
        
        console.log(`Section ${sectionName} ${this.expandedSections.has(sectionName) ? 'expanded' : 'collapsed'}`);
    }

    /**
     * Démarre le redimensionnement
     * @param {MouseEvent} e - Événement souris
     */
    startResize(e) {
        this.isResizing = true;
        this.resizeHandle.classList.add('resizing');
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    }

    /**
     * Gère le redimensionnement en cours
     * @param {MouseEvent} e - Événement souris
     */
    handleResize(e) {
        if (!this.isResizing || this.isCollapsed) return;

        const newWidth = Math.max(
            this.minWidth,
            Math.min(this.maxWidth, e.clientX)
        );

        if (Math.abs(newWidth - this.currentWidth) > 5) {
            this.currentWidth = newWidth;
            this.applyWidth();
        }
    }

    /**
     * Arrête le redimensionnement
     */
    stopResize() {
        if (!this.isResizing) return;
        
        this.isResizing = false;
        this.resizeHandle.classList.remove('resizing');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        this.saveState();
        
        // Redimensionner le canvas après resize manuel
        console.log('🔄 Panel manually resized, triggering canvas resize...');
        if (window.resizeCanvas) {
            window.resizeCanvas();
            console.log('✅ Canvas resized after manual panel resize');
        }
    }

    /**
     * Applique la largeur actuelle
     */
    applyWidth() {
        if (this.sidePanel && !this.isCollapsed) {
            this.sidePanel.style.width = `${this.currentWidth}px`;
        }
    }

    /**
     * Applique l'état global du panneau
     */
    applyState() {
        if (!this.sidePanel) return;

        if (this.isCollapsed) {
            this.sidePanel.classList.add('collapsed');
            // FORCER la largeur à 0 via style inline pour override toute autre règle
            this.sidePanel.style.width = '0px';
            this.sidePanel.style.minWidth = '0px';
            console.log('🔧 Forced panel width to 0px via inline style');
            
            // Afficher le bouton flottant
            if (this.floatingReopenBtn) {
                this.floatingReopenBtn.classList.add('visible');
            }
        } else {
            this.sidePanel.classList.remove('collapsed');
            // Retirer les styles inline pour laisser le CSS normal fonctionner
            this.sidePanel.style.width = '';
            this.sidePanel.style.minWidth = '';
            this.applyWidth();
            console.log('🔧 Restored panel width to CSS rules');
            
            // Masquer le bouton flottant
            if (this.floatingReopenBtn) {
                this.floatingReopenBtn.classList.remove('visible');
            }
        }

        this.applySectionStates();
    }

    /**
     * Applique l'état des sections d'accordéon
     */
    applySectionStates() {
        this.accordionSections.forEach(section => {
            const sectionName = section.dataset.section;
            const icon = section.querySelector('.accordion-icon');
            
            if (this.expandedSections.has(sectionName)) {
                section.classList.add('expanded');
                if (icon) icon.textContent = '▼';
            } else {
                section.classList.remove('expanded');
                if (icon) icon.textContent = '▶';
            }
        });
    }

    /**
     * Sauvegarde l'état dans localStorage
     */
    saveState() {
        const state = {
            isCollapsed: this.isCollapsed,
            currentWidth: this.currentWidth,
            expandedSections: Array.from(this.expandedSections)
        };
        
        localStorage.setItem('sidePanelState', JSON.stringify(state));
    }

    /**
     * Charge l'état depuis localStorage
     */
    loadState() {
        try {
            const savedState = localStorage.getItem('sidePanelState');
            if (savedState) {
                const state = JSON.parse(savedState);
                
                this.isCollapsed = state.isCollapsed || false;
                this.currentWidth = Math.max(
                    this.minWidth,
                    Math.min(this.maxWidth, state.currentWidth || 350)
                );
                this.expandedSections = new Set(state.expandedSections || ['about']);
            }
        } catch (error) {
            console.warn('Failed to load side panel state:', error);
            // Utiliser les valeurs par défaut
        }
    }

    /**
     * Réinitialise le panneau à ses valeurs par défaut
     */
    reset() {
        this.isCollapsed = false;
        this.currentWidth = 350;
        this.expandedSections = new Set(['about']);
        
        this.applyState();
        this.saveState();
        
        console.log('Side panel reset to defaults');
    }

    /**
     * Obtient l'état actuel du panneau
     * @returns {Object} État du panneau
     */
    getState() {
        return {
            isCollapsed: this.isCollapsed,
            currentWidth: this.currentWidth,
            expandedSections: Array.from(this.expandedSections),
            isResizing: this.isResizing
        };
    }

    /**
     * Ouvre une section spécifique
     * @param {string} sectionName - Nom de la section à ouvrir
     */
    openSection(sectionName) {
        if (!this.expandedSections.has(sectionName)) {
            this.expandedSections.add(sectionName);
            this.applySectionStates();
            this.saveState();
        }
    }

    /**
     * Ferme une section spécifique
     * @param {string} sectionName - Nom de la section à fermer
     */
    closeSection(sectionName) {
        if (this.expandedSections.has(sectionName)) {
            this.expandedSections.delete(sectionName);
            this.applySectionStates();
            this.saveState();
        }
    }

    /**
     * Ouvre le panneau s'il est fermé
     */
    expand() {
        if (this.isCollapsed) {
            console.log('📖 Expanding panel...');
            this.togglePanel();
        }
    }

    /**
     * Ferme le panneau s'il est ouvert
     */
    collapse() {
        if (!this.isCollapsed) {
            console.log('📕 Collapsing panel...');
            this.togglePanel();
        }
    }
}

// Instance globale
let sidePanelManager = null;

/**
 * Initialise le gestionnaire du panneau latéral
 * @returns {SidePanelManager} Instance du gestionnaire
 */
export function initSidePanel() {
    if (!sidePanelManager) {
        sidePanelManager = new SidePanelManager();
        sidePanelManager.init();
    }
    return sidePanelManager;
}

/**
 * Obtient l'instance du gestionnaire du panneau latéral
 * @returns {SidePanelManager|null} Instance du gestionnaire
 */
export function getSidePanelManager() {
    return sidePanelManager;
}

/**
 * Fonctions utilitaires exportées
 */
export function togglePanel() {
    if (sidePanelManager) {
        sidePanelManager.togglePanel();
    }
}

export function toggleSection(sectionName) {
    if (sidePanelManager) {
        sidePanelManager.toggleSection(sectionName);
    }
}

export function openSection(sectionName) {
    if (sidePanelManager) {
        sidePanelManager.openSection(sectionName);
    }
}

export function closeSection(sectionName) {
    if (sidePanelManager) {
        sidePanelManager.closeSection(sectionName);
    }
}

export function resetSidePanel() {
    if (sidePanelManager) {
        sidePanelManager.reset();
    }
}

export function getSidePanelState() {
    return sidePanelManager ? sidePanelManager.getState() : null;
} 