#!/bin/bash

# Script pour forcer le rechargement des ressources
# Usage: ./scripts/update-version.sh

echo "🔄 Updating version numbers to force cache refresh..."

# Générer un timestamp unique
TIMESTAMP=$(date +%s)
VERSION="2.0.${TIMESTAMP}"

echo "📅 New version: $VERSION"

# Mettre à jour les versions dans index.html
sed -i.bak "s/\?v=[0-9]\+\.[0-9]\+\.[0-9]\+/?v=$VERSION/g" index.html

# Mettre à jour les versions dans main.js
sed -i.bak "s/\?v=[0-9]\+\.[0-9]\+\.[0-9]\+/?v=$VERSION/g" js/main.js

# Supprimer les fichiers de sauvegarde
rm -f index.html.bak js/main.js.bak

echo "✅ Version updated to $VERSION"
echo "🌐 Reload http://localhost:8001/index.html to see changes"

# Optionnel: redémarrer le serveur
if pgrep -f "python3 -m http.server" > /dev/null; then
    echo "🔄 Restarting HTTP server..."
    pkill -f "python3 -m http.server"
    sleep 1
    cd "$(dirname "$0")/.."
    python3 -m http.server 8001 &
    echo "🚀 Server restarted on port 8001"
fi 