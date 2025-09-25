# Dockerfile pour le déploiement sur OVH
FROM node:18-alpine

# Créer le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Installer les dépendances
RUN cd backend && npm ci --only=production
RUN cd frontend && npm ci

# Copier le code source
COPY backend ./backend
COPY frontend ./frontend

# Build du frontend
RUN cd frontend && npm run build

# Exposer le port
EXPOSE 5000

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=5000

# Commande de démarrage
CMD ["node", "backend/server.js"]

