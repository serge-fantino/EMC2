/**
 * Module Interaction - Contrôles UI et boutons
 * @module interaction/controls
 */

// Variables globales à injecter
let coneOrigins = [];
let selectedReferenceFrame = 0;
let cartoucheOffsets = {};
let updateCalculationsDisplay = () => {};
let updateCommentsPanel = () => {};

/**
 * Initialise le module de contrôles
 * @param {Array} _coneOrigins - Origines des cônes
 * @param {number} _selectedReferenceFrame - Référentiel sélectionné
 * @param {Object} _cartoucheOffsets - Offsets des cartouches
 * @param {Function} _updateCalculationsDisplay - Fonction de mise à jour
 * @param {Function} _updateCommentsPanel - Fonction de mise à jour des commentaires
 */
export function initControlsModule(_coneOrigins, _selectedReferenceFrame, _cartoucheOffsets, _updateCalculationsDisplay, _updateCommentsPanel) {
    coneOrigins = _coneOrigins;
    selectedReferenceFrame = _selectedReferenceFrame;
    cartoucheOffsets = _cartoucheOffsets;
    updateCalculationsDisplay = _updateCalculationsDisplay;
    updateCommentsPanel = _updateCommentsPanel;
}

/**
 * Supprime le référentiel sélectionné et tous ses dérivés
 */
export function deleteSelectedReferenceFrame() {
    console.log('deleteSelectedReferenceFrame called, selectedReferenceFrame:', selectedReferenceFrame);
    
    if (selectedReferenceFrame <= 0) {
        console.log('Cannot delete origin, returning');
        return;
    }
    
    const frameToDelete = selectedReferenceFrame;
    const framesToDelete = [frameToDelete];
    
    function findDerivedFrames(parentIndex) {
        for (let i = 0; i < coneOrigins.length; i++) {
            const cone = coneOrigins[i];
            if (cone.sourceIndex === parentIndex && !framesToDelete.includes(i)) {
                framesToDelete.push(i);
                findDerivedFrames(i);
            }
        }
    }
    
    findDerivedFrames(frameToDelete);
    framesToDelete.sort((a, b) => b - a);
    
    framesToDelete.forEach(index => {
        coneOrigins.splice(index, 1);
        delete cartoucheOffsets[index];
    });
    
    // Mettre à jour les offsets des cartouches
    const newCartoucheOffsets = {};
    Object.keys(cartoucheOffsets).forEach(key => {
        const oldIndex = parseInt(key);
        let newIndex = oldIndex;
        
        for (const deletedIndex of framesToDelete) {
            if (deletedIndex < oldIndex) {
                newIndex--;
            }
        }
        
        if (newIndex >= 0) {
            newCartoucheOffsets[newIndex] = cartoucheOffsets[key];
        }
    });
    cartoucheOffsets = newCartoucheOffsets;
    
    // Mettre à jour les indices source
    for (let i = 0; i < coneOrigins.length; i++) {
        const cone = coneOrigins[i];
        if (cone.sourceIndex >= 0) {
            let adjustment = 0;
            for (const deletedIndex of framesToDelete) {
                if (deletedIndex <= cone.sourceIndex) {
                    adjustment++;
                }
            }
            cone.sourceIndex -= adjustment;
            
            if (cone.sourceIndex < 0) {
                cone.sourceIndex = 0;
            }
        }
    }
    
    selectedReferenceFrame = 0;
    updateCalculationsDisplay();
}

/**
 * Démonstration du paradoxe des jumeaux
 */
export function twinParadox() {
    console.log('Starting Twin Paradox demonstration...');
    
    // Effacer les cônes existants sauf l'origine
    coneOrigins.length = 0;
    coneOrigins.push({ 
        x: 0, 
        y: 0, 
        t: 0, 
        sourceIndex: -1,
        cumulativeVelocity: 0,
        cumulativeProperTime: 0,
        totalCoordinateTime: 0
    });
    
    // Effacer les offsets des cartouches
    cartoucheOffsets = {};
    
    // Réinitialiser la sélection à l'origine
    selectedReferenceFrame = 0;
    
    // Paramètres de démo (basés sur l'original - valeurs sûres qui respectent le cône de lumière)
    const T = 300; // Temps total pour le jumeau terrestre (3x plus grand pour meilleure visibilité)
    const X = 120; // Distance parcourue par le jumeau spatial (3x plus grand, bien dans le cône de lumière)
    
    // Créer le scénario du paradoxe des jumeaux (version simple 3-référentiels)
    setTimeout(() => {
        // Référentiel 1 : Jumeau terrestre reste sur Terre
        const ref1 = {
            x: 0,    // Reste sur Terre (x = 0)
            y: 0,
            t: T,    // Temps T quand ils se retrouvent
            sourceIndex: 0 // Depuis l'origine
        };
        coneOrigins.push(ref1);
        console.log('Created Ref 1 (Earth twin):', ref1);
        
        setTimeout(() => {
            // Référentiel 2 : Jumeau spatial voyage loin (point de retournement)
            const ref2 = {
                x: X,           // Distance lointaine X
                y: 0,
                t: T * 0.45,    // Moins que T/2 pour rester bien dans le cône de lumière
                sourceIndex: 0  // Directement depuis l'origine (départ)
            };
            coneOrigins.push(ref2);
            console.log('Created Ref 2 (Space twin - turnaround):', ref2);
            
            setTimeout(() => {
                // Référentiel 3 : Jumeau spatial revient vers le jumeau terrestre
                const ref3 = {
                    x: 0,    // Retour sur Terre (même que ref1)
                    y: 0,
                    t: T,    // Même temps que la réunion du jumeau terrestre
                    sourceIndex: 2 // Depuis ref2 (voyage de retour)
                };
                coneOrigins.push(ref3);
                console.log('Created Ref 3 (Space twin - return):', ref3);
                
                // Sélectionner ref3 pour montrer la comparaison
                selectedReferenceFrame = 3;
                updateCalculationsDisplay();
                
                console.log('Twin Paradox Demo completed!');
                
                // Mettre à jour le panneau de commentaires au lieu d'afficher une alerte
                setTimeout(() => {
                    const commentContent = `
                        <div style="line-height: 1.6;">
                            <p><strong style="color: #ff9f4a;">📊 Scénario créé :</strong></p>
                            <ul style="margin: 10px 0; padding-left: 20px;">
                                <li><strong style="color: #4a9eff;">Réf 1</strong> : Jumeau terrestre reste sur Terre (x=0, t=${T})</li>
                                <li><strong style="color: #ff6b6b;">Réf 2</strong> : Jumeau voyageur va loin (x=${X}, t=${T * 0.45})</li>
                                <li><strong style="color: #00ff00;">Réf 3</strong> : Jumeau voyageur revient sur Terre (x=0, t=${T})</li>
                            </ul>
                            
                            <p><strong style="color: #feca57;">🎯 Résultat clé :</strong></p>
                            <p>Les deux jumeaux se retrouvent au <em>même endroit</em> et au <em>même temps coordonnée</em>, MAIS le jumeau voyageur (réf 3) a un <strong style="color: #ff6b6b;">temps propre cumulé plus petit</strong> !</p>
                            
                            <p><strong style="color: #4a9eff;">💡 Observation :</strong></p>
                            <p>Le jumeau voyageur a <strong>vieilli moins</strong> ! Regardez les calculs pour comparer les temps propres entre réf 1 et réf 3.</p>
                            
                            <p style="margin-top: 15px; padding: 10px; background: rgba(74, 158, 255, 0.1); border-radius: 5px; border-left: 3px solid #4a9eff;">
                                <em>Cliquez sur les différents référentiels pour explorer chaque étape du voyage et comprendre l'accumulation des effets relativistes.</em>
                            </p>
                        </div>
                    `;
                    
                    updateCommentsPanel('🚀 Démonstration du Paradoxe des Jumeaux', commentContent);
                }, 500);
            }, 300);
        }, 300);
    }, 100);
}

/**
 * Configure le panneau de commentaires
 */
export function setupCommentsPanel() {
    const commentsEditor = document.getElementById('commentsEditor');
    
    if (!commentsEditor) return;
    
    // Effacer le placeholder quand l'utilisateur commence à taper
    commentsEditor.addEventListener('focus', function() {
        if (this.innerHTML.includes('Cliquez ici pour ajouter')) {
            this.innerHTML = '';
        }
    });
    
    // Restaurer le placeholder si vide
    commentsEditor.addEventListener('blur', function() {
        if (this.innerHTML.trim() === '' || this.innerHTML.trim() === '<br>') {
            this.innerHTML = '<em style="color: #666;">Cliquez ici pour ajouter vos notes...</em>';
        }
    });
    
    // Sauvegarder automatiquement
    commentsEditor.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            localStorage.setItem('lightConeComments', this.innerHTML);
            console.log('Comments saved');
        }
    });
    
    // Sauvegarder sur changement de sélection
    document.addEventListener('selectionchange', function() {
        if (document.activeElement === commentsEditor) {
            localStorage.setItem('lightConeComments', commentsEditor.innerHTML);
        }
    });
    
    // Sauvegarder sur keyup
    commentsEditor.addEventListener('keyup', function() {
        localStorage.setItem('lightConeComments', this.innerHTML);
    });
    
    // Sauvegarder sur mouseup
    commentsEditor.addEventListener('mouseup', function() {
        localStorage.setItem('lightConeComments', this.innerHTML);
    });
    
    // Charger les commentaires sauvegardés
    loadCommentsOnly();
}

/**
 * Charge les commentaires sauvegardés
 */
function loadCommentsOnly() {
    const savedComments = localStorage.getItem('lightConeComments');
    const commentsEditor = document.getElementById('commentsEditor');
    
    if (savedComments && !savedComments.includes('Cliquez ici pour ajouter') && commentsEditor) {
        commentsEditor.innerHTML = savedComments;
    }
}

/**
 * Configure tous les contrôles UI
 */
export function setupUIControls() {
    // Slider de résolution
    const resolutionSlider = document.getElementById('resolutionSlider');
    if (resolutionSlider) {
        resolutionSlider.addEventListener('input', function() {
            resolutionSettings.resolution = parseInt(this.value);
            updateResolutionDisplay();
        });
    }
    
    // Slider de limite verte
    const greenLimitSlider = document.getElementById('greenLimitSlider');
    if (greenLimitSlider) {
        greenLimitSlider.addEventListener('input', function() {
            config.greenLimit = parseFloat(this.value);
            updateGreenLimitDisplay();
        });
    }
    
    // Checkbox cône passé
    const showPastConeCheckbox = document.getElementById('showPastCone');
    if (showPastConeCheckbox) {
        showPastConeCheckbox.addEventListener('change', function() {
            config.showPastCone = this.checked;
        });
    }
    
    // Bouton paradoxe des jumeaux
    const twinParadoxButton = document.getElementById('twinParadoxDemo');
    if (twinParadoxButton) {
        twinParadoxButton.addEventListener('click', twinParadox);
    }
    
    // Bouton reset
    const resetButton = document.getElementById('resetButton');
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            coneOrigins.length = 0;
            coneOrigins.push({
                x: 0, y: 0, t: 0, sourceIndex: -1,
                cumulativeVelocity: 0,
                cumulativeProperTime: 0,
                totalCoordinateTime: 0
            });
            cartoucheOffsets = {};
            selectedReferenceFrame = 0;
            updateCalculationsDisplay();
        });
    }
    
    // Bouton effacer cônes
    const clearConesButton = document.getElementById('clearConesButton');
    if (clearConesButton) {
        clearConesButton.addEventListener('click', function() {
            coneOrigins.length = 0;
            coneOrigins.push({
                x: 0, y: 0, t: 0, sourceIndex: -1,
                cumulativeVelocity: 0,
                cumulativeProperTime: 0,
                totalCoordinateTime: 0
            });
            cartoucheOffsets = {};
            selectedReferenceFrame = 0;
            updateCalculationsDisplay();
        });
    }
    
    // Bouton aide
    const helpButton = document.getElementById('helpButton');
    if (helpButton) {
        helpButton.addEventListener('click', function() {
            document.getElementById('helpModal').style.display = 'flex';
        });
    }
    
    // Fermer aide
    const helpClose = document.getElementById('helpClose');
    if (helpClose) {
        helpClose.addEventListener('click', function() {
            document.getElementById('helpModal').style.display = 'none';
        });
    }
    
    // Fermer aide en cliquant à l'extérieur
    const helpModal = document.getElementById('helpModal');
    if (helpModal) {
        helpModal.addEventListener('click', function(event) {
            if (event.target === this) {
                this.style.display = 'none';
            }
        });
    }
    
    // Démo paradoxe des jumeaux dans le panneau d'info
    const infoPanelTwinDemo = document.getElementById('infoPanelTwinDemo');
    if (infoPanelTwinDemo) {
        infoPanelTwinDemo.addEventListener('click', twinParadox);
    }
    
    // Bouton toggle détails
    const toggleDetailsButton = document.getElementById('toggleDetails');
    if (toggleDetailsButton) {
        toggleDetailsButton.addEventListener('click', function() {
            const detailsPanel = document.getElementById('detailsPanel');
            if (detailsPanel) {
                detailsPanel.style.display = detailsPanel.style.display === 'none' ? 'block' : 'none';
            }
        });
    }
    
    // Configuration de l'éditeur de commentaires
    setupCommentsPanel();
}

// Variables temporaires (seront injectées)
let resolutionSettings = { resolution: 50 };
let config = { greenLimit: 0.8, showPastCone: true };

/**
 * Définit les paramètres de résolution
 * @param {Object} settings - Paramètres de résolution
 */
export function setResolutionSettings(settings) {
    resolutionSettings = settings;
}

/**
 * Définit la configuration
 * @param {Object} _config - Configuration
 */
export function setConfig(_config) {
    config = _config;
}

/**
 * Met à jour l'affichage de la résolution
 */
function updateResolutionDisplay() {
    const display = document.getElementById('resolutionDisplay');
    if (display) {
        display.textContent = resolutionSettings.resolution;
    }
}

/**
 * Met à jour l'affichage de la limite verte
 */
function updateGreenLimitDisplay() {
    const display = document.getElementById('greenLimitDisplay');
    if (display) {
        display.textContent = config.greenLimit.toFixed(2);
    }
} 