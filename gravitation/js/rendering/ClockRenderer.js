/**
 * Module de rendu des horloges
 * Extrait du main.js pour améliorer la modularité
 */

import { AppContext } from '../core/AppContext.js';

/**
 * Initialise le renderer d'horloges
 */
export function initializeClockRenderer() {
    // Plus besoin d'injection de dépendances, utilise AppContext directement
}

/**
 * Met à jour les références (maintenu pour compatibilité)
 */
export function updateClocks() {
    // Plus besoin de mise à jour, utilise AppContext directement
}

/**
 * Dessine toutes les horloges
 */
export function drawClocks() {
    if (!AppContext.ctx || !AppContext.canvas || !AppContext.clocks) return;
    
    AppContext.clocks.forEach(clock => {
        // Couleur de base pour les horloges
        let clockColor = '#FFD700'; // Or
        
        // Si l'horloge est sélectionnée, changer la couleur
        if (clock.isSelected) {
            clockColor = '#FF6B6B'; // Rouge pour l'horloge sélectionnée
        }
        
        // Dessiner le cercle de l'horloge
        AppContext.ctx.fillStyle = clockColor;
        AppContext.ctx.beginPath();
        AppContext.ctx.arc(clock.x, clock.y, 12, 0, 2 * Math.PI);
        AppContext.ctx.fill();
        
        // Bordure
        AppContext.ctx.strokeStyle = '#000000';
        AppContext.ctx.lineWidth = 2;
        AppContext.ctx.stroke();
        
        // Dessiner les aiguilles de l'horloge (simplifiées)
        const centerX = clock.x;
        const centerY = clock.y;
        
        // Aiguille des heures (plus courte)
        const hourAngle = (clock.localTime % 12) * Math.PI / 6; // 12 heures = 2π
        const hourLength = 6;
        AppContext.ctx.strokeStyle = '#000000';
        AppContext.ctx.lineWidth = 2;
        AppContext.ctx.beginPath();
        AppContext.ctx.moveTo(centerX, centerY);
        AppContext.ctx.lineTo(
            centerX + hourLength * Math.sin(hourAngle),
            centerY - hourLength * Math.cos(hourAngle)
        );
        AppContext.ctx.stroke();
        
        // Aiguille des minutes (plus longue)
        const minuteAngle = (clock.localTime % 1) * 2 * Math.PI; // 1 minute = 2π
        const minuteLength = 8;
        AppContext.ctx.strokeStyle = '#000000';
        AppContext.ctx.lineWidth = 1;
        AppContext.ctx.beginPath();
        AppContext.ctx.moveTo(centerX, centerY);
        AppContext.ctx.lineTo(
            centerX + minuteLength * Math.sin(minuteAngle),
            centerY - minuteLength * Math.cos(minuteAngle)
        );
        AppContext.ctx.stroke();
        
        // Afficher le temps local
        AppContext.ctx.fillStyle = '#000000';
        AppContext.ctx.font = '10px Arial';
        AppContext.ctx.textAlign = 'center';
        AppContext.ctx.fillText(`${clock.localTime.toFixed(1)}s`, clock.x, clock.y + 25);
        
        // Afficher le facteur de dilatation temporelle
        const { gridX, gridY } = AppContext.getGridVersionIndex(clock.x, clock.y);
        const gridVersions = AppContext.getGridVersions();
        const pointVersion = gridVersions[gridX] && gridVersions[gridX][gridY] !== undefined 
            ? gridVersions[gridX][gridY] : 0;
        const versionMasses = AppContext.getMassesForVersion(pointVersion, AppContext.masses);
        
        // Calculer la dilatation temporelle (utiliser la fonction du ClockManager)
        let timeDilationFactor = 1.0;
        if (versionMasses.length > 0) {
            let potential = 0;
            versionMasses.forEach(mass => {
                const dx = mass.x - clock.x;
                const dy = mass.y - clock.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > 0) {
                    potential -= AppContext.G * mass.mass / distance;
                }
            });
            timeDilationFactor = 1 + potential / (AppContext.c * AppContext.c);
            timeDilationFactor = Math.max(0.1, timeDilationFactor);
        }
        
        AppContext.ctx.fillStyle = '#666666';
        AppContext.ctx.font = '8px Arial';
        AppContext.ctx.fillText(`×${timeDilationFactor.toFixed(3)}`, clock.x, clock.y + 35);
    });
} 