#!/bin/bash

# Script de déploiement pour OVH
# Usage: ./deploy-ovh.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}
DOMAIN=${2:-localhost}

echo "🚀 Déploiement Boulangerie Planning sur OVH"
echo "📋 Environnement: $ENVIRONMENT"
echo "🌐 Domaine: $DOMAIN"

# Vérifier que Docker et Docker Compose sont installés
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé"
    exit 1
fi

# Créer le fichier .env pour la production
echo "📝 Création du fichier .env..."
cat > .env << EOF
NODE_ENV=$ENVIRONMENT
PORT=5000
MONGODB_URI=mongodb://admin:password123@mongodb:27017/boulangerie_planning?authSource=admin
CORS_ORIGIN=http://$DOMAIN
JWT_SECRET=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 32)
EOF

# Créer les répertoires nécessaires
echo "📁 Création des répertoires..."
mkdir -p logs ssl

# Build et démarrage des conteneurs
echo "🔨 Build des conteneurs..."
docker-compose build

echo "🚀 Démarrage des services..."
docker-compose up -d

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 30

# Vérifier que l'API fonctionne
echo "🔍 Vérification de l'API..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ API fonctionnelle"
else
    echo "❌ L'API ne répond pas"
    docker-compose logs app
    exit 1
fi

# Vérifier que MongoDB fonctionne
echo "🔍 Vérification de MongoDB..."
if docker-compose exec mongodb mongosh --eval "db.runCommand('ping')" > /dev/null 2>&1; then
    echo "✅ MongoDB fonctionnel"
else
    echo "❌ MongoDB ne répond pas"
    docker-compose logs mongodb
    exit 1
fi

echo "🎉 Déploiement terminé avec succès!"
echo "📊 URLs:"
echo "   - Frontend: http://$DOMAIN"
echo "   - API: http://$DOMAIN/api"
echo "   - Health: http://$DOMAIN/health"
echo ""
echo "📋 Commandes utiles:"
echo "   - Voir les logs: docker-compose logs -f"
echo "   - Arrêter: docker-compose down"
echo "   - Redémarrer: docker-compose restart"
echo "   - Mise à jour: ./deploy-ovh.sh $ENVIRONMENT $DOMAIN"

