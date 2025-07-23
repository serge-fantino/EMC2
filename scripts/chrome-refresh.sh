#!/bin/bash

# Script pour forcer Chrome à recharger sans cache
# Usage: ./scripts/chrome-refresh.sh

echo "🔥 CHROME CACHE BUSTER - Mode Ultra Agressif"

# Générer un timestamp unique
TIMESTAMP=$(date +%s%3N)
VERSION="4.0.$TIMESTAMP"

echo "📅 New version: $VERSION"

# Fonction pour mettre à jour TOUS les fichiers avec des versions uniques
update_all_versions() {
    echo "🔄 Updating ALL version numbers..."
    
    # Mettre à jour index.html avec des versions uniques pour chaque fichier
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # CSS files
        sed -i '' "s/styles\.css?v=[^\"]*\"/styles.css?v=$VERSION.1\"/g" index.html
        sed -i '' "s/components\.css?v=[^\"]*\"/components.css?v=$VERSION.2\"/g" index.html  
        sed -i '' "s/sidepanel\.css?v=[^\"]*\"/sidepanel.css?v=$VERSION.3\"/g" index.html
        
        # Main script
        sed -i '' "s/main\.js?v=[^\"]*\"/main.js?v=$VERSION.4\"/g" index.html
        
        # Update main.js imports with unique versions
        sed -i '' "s/physics\/index\.js?v=[^']*'/physics\/index.js?v=$VERSION.5'/g" js/main.js
        sed -i '' "s/renderer\/index\.js?v=[^']*'/renderer\/index.js?v=$VERSION.6'/g" js/main.js
        sed -i '' "s/interaction\/index\.js?v=[^']*'/interaction\/index.js?v=$VERSION.7'/g" js/main.js
        sed -i '' "s/ui\/sidepanel\.js?v=[^']*'/ui\/sidepanel.js?v=$VERSION.8'/g" js/main.js
        
        # Generate version.json with current version
        cat > version.json << EOF
{
  "version": "$VERSION.4",
  "timestamp": $(date +%s),
  "buildTime": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)",
  "browser": "multi",
  "cache": "bust"
}
EOF
    else
        # Linux fallback
        sed -i "s/styles\.css?v=[^\"]*\"/styles.css?v=$VERSION.1\"/g" index.html
        sed -i "s/components\.css?v=[^\"]*\"/components.css?v=$VERSION.2\"/g" index.html  
        sed -i "s/sidepanel\.css?v=[^\"]*\"/sidepanel.css?v=$VERSION.3\"/g" index.html
        sed -i "s/main\.js?v=[^\"]*\"/main.js?v=$VERSION.4\"/g" index.html
        sed -i "s/physics\/index\.js?v=[^']*'/physics\/index.js?v=$VERSION.5'/g" js/main.js
        sed -i "s/renderer\/index\.js?v=[^']*'/renderer\/index.js?v=$VERSION.6'/g" js/main.js
        sed -i "s/interaction\/index\.js?v=[^']*'/interaction\/index.js?v=$VERSION.7'/g" js/main.js
        sed -i "s/ui\/sidepanel\.js?v=[^']*'/ui\/sidepanel.js?v=$VERSION.8'/g" js/main.js
        
        # Generate version.json with current version
        cat > version.json << EOF
{
  "version": "$VERSION.4",
  "timestamp": $(date +%s),
  "buildTime": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)",
  "browser": "multi",
  "cache": "bust"
}
EOF
    fi
    
    echo "✅ All versions updated to $VERSION.x"
}

# Mettre à jour les versions
update_all_versions

# Redémarrer le serveur pour être sûr
echo "🔄 Restarting HTTP server..."
pkill -f "python3 -m http.server" 2>/dev/null || true
sleep 2
python3 -m http.server 8001 &
SERVER_PID=$!

echo "🚀 Server restarted on port 8001 (PID: $SERVER_PID)"
echo ""
echo "🌐 URL: http://localhost:8001/index.html"
echo ""
echo "🔥 POUR CHROME - Faites ceci:"
echo "   1. Ouvrez les DevTools (F12)"
echo "   2. Clic droit sur le bouton refresh ↻"
echo "   3. Sélectionnez 'Empty Cache and Hard Reload'"
echo "   4. OU utilisez Cmd+Shift+R (Mac) / Ctrl+Shift+R (PC)"
echo ""
echo "💡 Ou tapez dans la barre d'adresse:"
echo "   chrome://settings/clearBrowserData"
echo "   et videz le cache des images et fichiers" 