#!/bin/bash

# Script de développement avec auto-refresh et cache-busting agressif
# Usage: ./scripts/dev-server.sh

echo "🚀 Starting development server with aggressive cache busting..."

# Fonction pour mettre à jour les versions
update_versions() {
    local timestamp=$(date +%s)
    local version="3.0.$timestamp"
    
    echo "📅 Updating to version: $version"
    
    # Mettre à jour index.html
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/\?v=[0-9]\+\.[0-9]\+\.[0-9]\+/\?v=$version/g" index.html
        sed -i '' "s/\?v=[0-9]\+\.[0-9]\+\.[0-9]\+/\?v=$version/g" js/main.js
    else
        # Linux
        sed -i "s/\?v=[0-9]\+\.[0-9]\+\.[0-9]\+/\?v=$version/g" index.html
        sed -i "s/\?v=[0-9]\+\.[0-9]\+\.[0-9]\+/\?v=$version/g" js/main.js
    fi
    
    echo "✅ Versions updated to $version"
}

# Fonction pour démarrer le serveur
start_server() {
    echo "🌐 Starting HTTP server on port 8001..."
    
    # Tuer les anciens serveurs
    pkill -f "python3 -m http.server" 2>/dev/null || true
    sleep 1
    
    # Démarrer le nouveau serveur
    python3 -m http.server 8001 &
    SERVER_PID=$!
    
    echo "🚀 Server started with PID: $SERVER_PID"
    echo "🌐 Open: http://localhost:8001/index.html"
}

# Fonction de nettoyage
cleanup() {
    echo "🧹 Cleaning up..."
    kill $SERVER_PID 2>/dev/null || true
    exit 0
}

# Piéger Ctrl+C
trap cleanup SIGINT SIGTERM

# Première mise à jour et démarrage
update_versions
start_server

# Surveiller les changements de fichiers
echo "👀 Watching for file changes... (Press Ctrl+C to stop)"
echo "📁 Watching: js/, css/, index.html"

# Utiliser fswatch si disponible, sinon polling simple
if command -v fswatch >/dev/null 2>&1; then
    echo "🔍 Using fswatch for file monitoring"
    fswatch -o js/ css/ index.html | while read f; do
        echo "🔄 File changed, updating versions..."
        update_versions
        echo "✅ Ready! Refresh your browser."
    done
else
    echo "🔍 Using simple polling (install fswatch for better performance)"
    LAST_CHANGE=$(find js/ css/ index.html -type f -newer /tmp/last_change 2>/dev/null | wc -l)
    touch /tmp/last_change
    
    while true; do
        sleep 2
        CURRENT_CHANGE=$(find js/ css/ index.html -type f -newer /tmp/last_change 2>/dev/null | wc -l)
        
        if [ $CURRENT_CHANGE -gt 0 ]; then
            echo "🔄 File changed, updating versions..."
            update_versions
            touch /tmp/last_change
            echo "✅ Ready! Refresh your browser."
        fi
    done
fi 