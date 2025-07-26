/**
 * Module Interaction - Contrôles UI et boutons
 * @module interaction/controls
 */

import { openSection } from '../ui/sidepanel.js';
import { updateGradientBar } from '../renderer/colors.js';

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
    // Lire dynamiquement le référentiel sélectionné
    let ref = window.selectedReferenceFrame;
    if (typeof ref !== 'number') ref = selectedReferenceFrame;
    if (ref <= 0) {
        console.log('Cannot delete origin, returning');
        return;
    }
    const frameToDelete = ref;
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
    window.selectedReferenceFrame = 0;
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
    
    // Paramètres de démo (ratio x₂/t₂ = 1/3 pour vitesse très modérée)
    const T = 300; // Temps total pour le jumeau terrestre
    const X = 100; // Distance parcourue par le jumeau spatial
    
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
                x: T / 6,       // x₂ = t₁/6 = 300/6 = 50 années-lumière
                y: 0,
                t: T / 2,       // t₂ = t₁/2 = 300/2 = 150 ans
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
                        <div style="line-height:1.7; font-size: 14px;">
                            <div><strong style="color:#ff9f4a;">📊 Scénario créé:</strong></div>
                            <ul style="margin:0 0 10px 2px; padding:0;">
                                <li><span style="color:#4a9eff; font-weight:bold;">Réf 1</span> : Jumeau terrestre reste sur Terre (x=0, t=${T})</li>
                                <li><span style="color:#ff6b6b; font-weight:bold;">Réf 2</span> : Jumeau voyageur va loin (x=${X}, t=${T * 0.45})</li>
                                <li><span style="color:#00ff00; font-weight:bold;">Réf 3</span> : Jumeau voyageur revient sur Terre (x=0, t=${T})</li>
                            </ul>
                            <div><strong style="color:#feca57;">🎯 Résultat clé :</strong> Les deux jumeaux se retrouvent au <em>même endroit</em> et au <em>même temps coordonnée</em>, MAIS le jumeau voyageur (réf 3) a un <strong style="color:#ff6b6b;">temps propre cumulé plus petit</strong> !</div>
                            <div><strong style="color:#4a9eff;">💡 Observation :</strong> Le jumeau voyageur a <strong>vieilli moins</strong> ! Regardez les calculs pour comparer les temps propres entre réf 1 et réf 3.</div>
                            <div style="margin-top: 10px; padding: 8px 12px; background:rgba(74,158,255,0.08); border-radius:5px; border-left:3px solid #4a9eff; font-size:13px;">
                                <em>Cliquez sur les différents référentiels pour explorer chaque étape du voyage et comprendre l'accumulation des effets relativistes.</em>
                            </div>
                        </div>
                    `;
                    updateCommentsPanel('🚀 Démonstration du Paradoxe des Jumeaux', commentContent);
                    openSection && openSection('comments');
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
    
    // BOUTONS DE FORMATTAGE
    const boldBtn = document.getElementById('boldBtn');
    if (boldBtn) boldBtn.onclick = () => document.execCommand('bold');
    const italicBtn = document.getElementById('italicBtn');
    if (italicBtn) italicBtn.onclick = () => document.execCommand('italic');
    const underlineBtn = document.getElementById('underlineBtn');
    if (underlineBtn) underlineBtn.onclick = () => document.execCommand('underline');
    const colorBtn = document.getElementById('colorBtn');
    if (colorBtn) colorBtn.onclick = () => document.execCommand('foreColor', false, '#ff6b6b');
    const clearFormatBtn = document.getElementById('clearFormatBtn');
    if (clearFormatBtn) clearFormatBtn.onclick = () => document.execCommand('removeFormat');

    // BOUTONS ACTIONS
    const saveBtn = document.getElementById('saveComments');
    if (saveBtn) saveBtn.onclick = () => {
        // Sauvegarde complète
        const saveData = {
            comments: commentsEditor.innerHTML,
            coneOrigins: coneOrigins,
            cartoucheOffsets: cartoucheOffsets,
            selectedReferenceFrame: selectedReferenceFrame,
            config: config,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('lightConeComments', commentsEditor.innerHTML);
        localStorage.setItem('lightConeDiagram', JSON.stringify(saveData));
        // Feedback visuel
        saveBtn.innerHTML = '✅ Sauvé !';
        saveBtn.style.background = '#00ff00';
        setTimeout(() => {
            saveBtn.innerHTML = '💾 Sauver';
            saveBtn.style.background = '#4a9eff';
        }, 1500);
    };
    const loadBtn = document.getElementById('loadComments');
    if (loadBtn) loadBtn.onclick = () => {
        const savedDiagram = localStorage.getItem('lightConeDiagram');
        if (savedDiagram) {
            try {
                const saveData = JSON.parse(savedDiagram);
                // Restaurer tout l'état
                if (saveData.coneOrigins && Array.isArray(saveData.coneOrigins)) {
                    coneOrigins.length = 0;
                    saveData.coneOrigins.forEach(c => coneOrigins.push({...c}));
                }
                if (saveData.cartoucheOffsets) {
                    cartoucheOffsets = {...saveData.cartoucheOffsets};
                }
                if (saveData.selectedReferenceFrame !== undefined) {
                    selectedReferenceFrame = saveData.selectedReferenceFrame;
                }
                if (saveData.config) {
                    Object.assign(config, saveData.config);
                }
                if (saveData.comments && !saveData.comments.includes('Cliquez ici pour ajouter')) {
                    commentsEditor.innerHTML = saveData.comments;
                }
                updateCalculationsDisplay();
                // Feedback visuel
                loadBtn.innerHTML = '✅ Chargé !';
                loadBtn.style.background = '#00ff00';
                setTimeout(() => {
                    loadBtn.innerHTML = '📂 Charger';
                    loadBtn.style.background = '#4a9eff';
                }, 1500);
            } catch (e) {
                alert('Erreur lors du chargement de la sauvegarde !');
            }
        } else {
            alert('Aucune sauvegarde trouvée !');
        }
    };
    const clearBtn = document.getElementById('clearComments');
    if (clearBtn) clearBtn.onclick = () => {
        // Effacer commentaires
        commentsEditor.innerHTML = '';
        // Effacer cônes
        coneOrigins.length = 0;
        coneOrigins.push({
            x: 0, y: 0, t: 0, sourceIndex: -1,
            cumulativeVelocity: 0,
            cumulativeProperTime: 0,
            totalCoordinateTime: 0
        });
        cartoucheOffsets = {};
        selectedReferenceFrame = 0;
        localStorage.removeItem('lightConeComments');
        localStorage.removeItem('lightConeDiagram');
        updateCalculationsDisplay();
    };
    
    // Charger automatiquement la sauvegarde complète au démarrage
    (function autoLoadFullDiagram() {
        const savedDiagram = localStorage.getItem('lightConeDiagram');
        if (savedDiagram) {
            try {
                const saveData = JSON.parse(savedDiagram);
                if (saveData.coneOrigins && Array.isArray(saveData.coneOrigins)) {
                    coneOrigins.length = 0;
                    saveData.coneOrigins.forEach(c => coneOrigins.push({...c}));
                }
                if (saveData.cartoucheOffsets) {
                    cartoucheOffsets = {...saveData.cartoucheOffsets};
                }
                if (saveData.selectedReferenceFrame !== undefined) {
                    selectedReferenceFrame = saveData.selectedReferenceFrame;
                }
                if (saveData.config) {
                    Object.assign(config, saveData.config);
                }
                if (saveData.comments && !saveData.comments.includes('Cliquez ici pour ajouter')) {
                    commentsEditor.innerHTML = saveData.comments;
                }
                updateCalculationsDisplay();
            } catch (e) {
                // fallback : ne rien faire
            }
        }
    })();
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
    const resolutionValue = document.getElementById('resolutionValue');
    if (resolutionSlider) {
        resolutionSlider.addEventListener('input', function() {
            config.resolution = parseInt(this.value);
            if (resolutionValue) {
                const names = {1: 'Basse', 2: 'Moyenne', 3: 'Haute'};
                resolutionValue.textContent = names[this.value] || this.value;
            }
            if (window.requestAnimationFrame) window.requestAnimationFrame(() => updateCalculationsDisplay());
        });
        // Initialisation affichage
        if (resolutionValue) {
            const names = {1: 'Basse', 2: 'Moyenne', 3: 'Haute'};
            resolutionValue.textContent = names[resolutionSlider.value] || resolutionSlider.value;
        }
        // Initialiser la valeur dans config
        config.resolution = parseInt(resolutionSlider.value);
    }
    
    // Slider de limite verte
    const greenLimitSlider = document.getElementById('greenLimitSlider');
    const greenLimitValue = document.getElementById('greenLimitValue');
    const greenLabel = document.getElementById('greenLabel');
    if (greenLimitSlider) {
        greenLimitSlider.addEventListener('input', function() {
            config.greenLimit = parseFloat(this.value);
            const percent = Math.round(config.greenLimit * 100);
            if (greenLimitValue) greenLimitValue.textContent = percent + '% c';
            if (greenLabel) greenLabel.textContent = percent + '% c';
            updateGreenLimitDisplay();
            updateGradientBar(config);
        });
        // Initialisation affichage
        const percent = Math.round(parseFloat(greenLimitSlider.value) * 100);
        if (greenLimitValue) greenLimitValue.textContent = percent + '% c';
        if (greenLabel) greenLabel.textContent = percent + '% c';
    }
    
    // Checkbox cône passé
    const showPastConeCheckbox = document.getElementById('showPastCone');
    if (showPastConeCheckbox) {
        showPastConeCheckbox.addEventListener('change', function() {
            config.showPastCone = this.checked;
            if (window.requestAnimationFrame) window.requestAnimationFrame(() => updateCalculationsDisplay());
        });
        // Initialisation
        config.showPastCone = showPastConeCheckbox.checked;
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
            // Valeurs par défaut (alignées sur l'original)
            if (resolutionSlider) {
                resolutionSlider.value = 2;
                if (resolutionValue) {
                    const names = {1: 'Basse', 2: 'Moyenne', 3: 'Haute'};
                    resolutionValue.textContent = names[2];
                }
                config.resolution = 2;
            }
            if (greenLimitSlider) {
                greenLimitSlider.value = 0.8;
                const percent = 80;
                if (greenLimitValue) greenLimitValue.textContent = percent + '% c';
                if (greenLabel) greenLabel.textContent = percent + '% c';
                config.greenLimit = 0.8;
                updateGradientBar(config);
            }
            if (showPastConeCheckbox) {
                showPastConeCheckbox.checked = true;
                config.showPastCone = true;
            }
            if (window.requestAnimationFrame) window.requestAnimationFrame(() => updateCalculationsDisplay());
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
    
    // Tous les boutons de démo du paradoxe des jumeaux dans la popup Info
    [
        '#infoPanelTwinDemo',
        '#twinParadoxDemo',
        '.twin-paradox-demo-btn'
    ].forEach(selector => {
        document.querySelectorAll(selector).forEach(btn => {
            btn.addEventListener('click', function() {
                twinParadox();
                document.getElementById('helpModal').style.display = 'none';
            });
        });
    });
    
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

// Ajout automatique de documentation lors de l'ajout d'un cône (hors mode démo)
export function addConeAndDocument(x, t) {
    const refNum = coneOrigins.length - 1;
    const line = `<div>🟠 <b>Ref ${refNum}</b> : t = ${t.toFixed(2)}, x = ${x.toFixed(2)}</div>`;
    const commentsEditor = document.getElementById('commentsEditor');
    if (commentsEditor) {
        if (commentsEditor.innerHTML.includes('Cliquez ici pour ajouter')) {
            commentsEditor.innerHTML = line;
        } else {
            commentsEditor.innerHTML += line;
        }
        localStorage.setItem('lightConeComments', commentsEditor.innerHTML);
    }
} 