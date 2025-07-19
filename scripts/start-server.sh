#!/bin/bash

# Script de lancement pour le serveur HTTP local
# Visualisation des Cônes de Lumière Relativiste

PORT=${1:-8000}
echo "🚀 Démarrage du serveur HTTP sur le port $PORT..."
echo ""
echo "📱 Ouvrez votre navigateur sur :"
echo "   http://localhost:$PORT/index.html"
echo ""
echo "⏹️  Pour arrêter : Ctrl+C"
echo ""

# Vérifier si Python est disponible
if command -v python3 &> /dev/null; then
    python3 -m http.server $PORT
elif command -v python &> /dev/null; then
    python -m http.server $PORT
else
    echo "❌ Erreur : Python n'est pas installé"
    echo "   Installez Python 3 ou utilisez :"
    echo "   npx serve"
    exit 1
fi 