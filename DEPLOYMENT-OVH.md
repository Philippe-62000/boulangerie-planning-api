# Guide de Déploiement sur OVH

Ce guide vous explique comment déployer votre application Boulangerie Planning sur OVH.

## 🎯 Options d'hébergement OVH

### 1. **OVHcloud Public Cloud** (Recommandé)
- **VPS** : À partir de 3,50€/mois
- **Container** : À partir de 2,50€/mois
- **Kubernetes** : Pour une architecture scalable

### 2. **OVH Web Hosting**
- **Mutualisé** : Pour le frontend React
- **Dédié** : Pour le backend Node.js

### 3. **OVH Database**
- **MongoDB Atlas** : Base de données managée
- **OVH Database** : Base de données OVH

## 🚀 Déploiement Rapide avec Docker

### Prérequis
- Compte OVH avec accès SSH
- VPS OVH avec Ubuntu 20.04+
- Domaine configuré (optionnel)

### Étape 1 : Connexion à votre VPS OVH

```bash
ssh root@votre-ip-ovh
```

### Étape 2 : Installation de Docker

```bash
# Mise à jour du système
apt update && apt upgrade -y

# Installation de Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Installation de Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Ajouter l'utilisateur au groupe docker
usermod -aG docker $USER
```

### Étape 3 : Cloner et déployer l'application

```bash
# Cloner votre projet
git clone https://github.com/votre-username/boulangerie-planning.git
cd boulangerie-planning

# Rendre le script de déploiement exécutable
chmod +x deploy-ovh.sh

# Déployer l'application
./deploy-ovh.sh production votre-domaine.com
```

### Étape 4 : Configuration du domaine (optionnel)

Si vous avez un domaine OVH :

1. **Dans l'espace client OVH** :
   - Allez dans "Domaine" > votre-domaine.com
   - Cliquez sur "Zone DNS"
   - Ajoutez un enregistrement A :
     - Nom : `@` ou `www`
     - Valeur : IP de votre VPS

2. **Mise à jour du script de déploiement** :
   ```bash
   ./deploy-ovh.sh production votre-domaine.com
   ```

## 🔧 Configuration Avancée

### Variables d'environnement

Créez un fichier `.env` personnalisé :

```bash
# .env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://admin:password123@mongodb:27017/boulangerie_planning?authSource=admin
CORS_ORIGIN=https://votre-domaine.com
JWT_SECRET=votre-secret-jwt-super-securise
SESSION_SECRET=votre-secret-session-super-securise
```

### SSL/HTTPS avec Let's Encrypt

```bash
# Installation de Certbot
apt install certbot python3-certbot-nginx -y

# Génération du certificat
certbot --nginx -d votre-domaine.com

# Renouvellement automatique
crontab -e
# Ajouter : 0 12 * * * /usr/bin/certbot renew --quiet
```

### Sauvegarde automatique

```bash
# Script de sauvegarde
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup"

# Sauvegarde MongoDB
docker-compose exec mongodb mongodump --out /dump
docker cp boulangerie-mongodb:/dump $BACKUP_DIR/mongodb_$DATE

# Sauvegarde des logs
tar -czf $BACKUP_DIR/logs_$DATE.tar.gz logs/

# Nettoyage (garder 7 jours)
find $BACKUP_DIR -name "mongodb_*" -mtime +7 -delete
find $BACKUP_DIR -name "logs_*" -mtime +7 -delete
EOF

chmod +x backup.sh

# Ajouter au cron
crontab -e
# Ajouter : 0 2 * * * /chemin/vers/backup.sh
```

## 📊 Monitoring et Maintenance

### Commandes utiles

```bash
# Voir les logs en temps réel
docker-compose logs -f

# Voir les logs d'un service spécifique
docker-compose logs -f app
docker-compose logs -f mongodb

# Redémarrer un service
docker-compose restart app

# Mettre à jour l'application
git pull
docker-compose build
docker-compose up -d

# Vérifier l'état des conteneurs
docker-compose ps

# Accéder à MongoDB
docker-compose exec mongodb mongosh
```

### Monitoring avec PM2 (alternative)

Si vous préférez PM2 à Docker :

```bash
# Installation de PM2
npm install -g pm2

# Démarrage de l'application
cd backend
pm2 start server.js --name boulangerie-api

# Monitoring
pm2 monit
pm2 logs
pm2 status
```

## 🔒 Sécurité

### Firewall

```bash
# Installation d'UFW
apt install ufw -y

# Configuration du firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80
ufw allow 443
ufw enable
```

### Mise à jour automatique

```bash
# Installation d'unattended-upgrades
apt install unattended-upgrades -y

# Configuration
dpkg-reconfigure -plow unattended-upgrades
```

## 💰 Coûts estimés OVH

### VPS Public Cloud
- **VPS Starter** : 3,50€/mois (1 vCPU, 2GB RAM)
- **VPS Value** : 7,00€/mois (1 vCPU, 4GB RAM) - **Recommandé**
- **VPS Essential** : 14,00€/mois (2 vCPU, 8GB RAM)

### Base de données
- **MongoDB Atlas** : Gratuit (512MB) à 9,00€/mois
- **OVH Database** : À partir de 15,00€/mois

### Domaine
- **Nom de domaine** : 8,00€/an

**Total estimé** : 15-25€/mois pour une solution complète

## 🆘 Dépannage

### Problèmes courants

1. **L'application ne démarre pas**
   ```bash
   docker-compose logs app
   docker-compose down && docker-compose up -d
   ```

2. **MongoDB ne se connecte pas**
   ```bash
   docker-compose logs mongodb
   docker-compose restart mongodb
   ```

3. **Problème de permissions**
   ```bash
   chmod -R 755 .
   chown -R $USER:$USER .
   ```

4. **Port déjà utilisé**
   ```bash
   netstat -tulpn | grep :5000
   docker-compose down
   docker-compose up -d
   ```

### Support

- **OVH Support** : https://www.ovh.com/fr/support/
- **Documentation Docker** : https://docs.docker.com/
- **Logs de l'application** : `docker-compose logs`

## 🎉 Félicitations !

Votre application Boulangerie Planning est maintenant déployée sur OVH !

**URLs d'accès** :
- Frontend : http://votre-domaine.com
- API : http://votre-domaine.com/api
- Health Check : http://votre-domaine.com/health

**Prochaines étapes** :
1. Configurer les sauvegardes automatiques
2. Mettre en place le monitoring
3. Configurer les alertes
4. Tester toutes les fonctionnalités
5. Former les utilisateurs

