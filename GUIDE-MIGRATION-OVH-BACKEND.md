# 🚀 Guide : Migration du Backend de Render vers OVH

## ✅ Réponse Rapide

**OUI**, il est tout à fait possible de se passer de Render et d'héberger votre backend Node.js directement sur OVH.

---

## 📋 Options d'Hébergement OVH pour Node.js

### **1. VPS (Virtual Private Server)** ⭐ Recommandé
- **Avantages** :
  - ✅ Contrôle total sur l'environnement
  - ✅ Installation de Node.js personnalisée
  - ✅ Gestion des processus avec PM2
  - ✅ Prix abordable (à partir de ~5€/mois)
  - ✅ Pas de limite de "pipeline minutes"
  
- **Inconvénients** :
  - ⚠️ Configuration manuelle requise
  - ⚠️ Maintenance serveur nécessaire
  - ⚠️ Gestion des mises à jour système

### **2. Cloud Web OVH** (avec Node.js)
- **Avantages** :
  - ✅ Plateforme managée
  - ✅ Déploiement simplifié
  - ✅ Support Node.js intégré
  
- **Inconvénients** :
  - ⚠️ Moins de flexibilité que VPS
  - ⚠️ Peut être plus cher

### **3. Serveur Dédié**
- **Avantages** :
  - ✅ Performance maximale
  - ✅ Contrôle total
  
- **Inconvénients** :
  - ⚠️ Plus cher (à partir de ~20€/mois)
  - ⚠️ Overkill pour votre application

---

## 🎯 Architecture Actuelle vs Architecture OVH

### **Actuellement (avec Render)**
```
Frontend (OVH) → Backend (Render) → MongoDB Atlas
```

### **Avec OVH (tout en un)**
```
Frontend (OVH) → Backend (OVH) → MongoDB Atlas
```

**Avantages de la migration :**
- ✅ Tout au même endroit (simplification)
- ✅ Pas de limite de build Render
- ✅ Contrôle total
- ✅ Coût potentiellement réduit

---

## 📦 Prérequis pour la Migration

### **1. Variables d'Environnement Nécessaires**

D'après votre configuration actuelle, vous aurez besoin de :

```bash
# MongoDB
MONGODB_URI=mongodb+srv://...

# JWT
JWT_SECRET=...

# CORS
CORS_ORIGIN=https://www.filmara.fr,https://www.filmara.fr/plan

# Email (SMTP OVH)
SMTP_HOST_OVH=ssl0.ovh.net
SMTP_PORT_OVH=465
SMTP_USER_OVH=longuenesse@filmara.fr
SMTP_PASS_OVH=...

# SFTP (NAS)
SFTP_BASE_PATH=/n8n/uploads/documents-longuenesse
SFTP_PASSWORD=...

# EmailJS (optionnel)
EMAILJS_SERVICE_ID=...
EMAILJS_TEMPLATE_ID=...
EMAILJS_USER_ID=...
EMAILJS_PRIVATE_KEY=...

# Application
NODE_ENV=production
PORT=3000  # ou autre port selon configuration OVH
STORE_NAME=Boulangerie Ange - Longuenesse
```

### **2. Dépendances Node.js**

Votre `package.json` backend nécessite :
- express
- mongoose
- cors
- helmet
- compression
- nodemailer
- jsonwebtoken
- multer
- ssh2-sftp-client
- Et autres...

---

## 🚀 Étapes de Migration (VPS OVH)

### **Étape 1 : Commander un VPS OVH**

1. Connectez-vous à votre espace OVH
2. Allez dans **VPS** → **Commander un VPS**
3. Choisissez une configuration adaptée :
   - **Minimum recommandé** : 2 vCPU, 4GB RAM, 80GB SSD
   - **OS** : Ubuntu 22.04 LTS (recommandé)

### **Étape 2 : Configuration Initiale du Serveur**

#### **2.1 Connexion SSH**
```bash
ssh root@votre-ip-vps
```

#### **2.2 Mise à jour du système**
```bash
apt update && apt upgrade -y
```

#### **2.3 Installation de Node.js**
```bash
# Installation de Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Vérification
node --version
npm --version
```

#### **2.4 Installation de PM2 (gestionnaire de processus)**
```bash
npm install -g pm2
```

#### **2.5 Installation de Nginx (reverse proxy)**
```bash
apt install -y nginx
```

### **Étape 3 : Déploiement de l'Application**

#### **3.1 Cloner le repository**
```bash
cd /var/www
git clone https://github.com/votre-repo/boulangerie-planning.git
cd boulangerie-planning
```

#### **3.2 Installation des dépendances**
```bash
cd backend
npm install --production
```

#### **3.3 Configuration des variables d'environnement**
```bash
# Créer le fichier .env
nano /var/www/boulangerie-planning/backend/.env
```

Copiez toutes les variables depuis votre fichier `boulangerie-planning-api-3-FINAL.env`

#### **3.4 Configuration du port**

Modifiez le port si nécessaire (OVH peut nécessiter un port spécifique) :
```bash
# Dans .env
PORT=3000
```

### **Étape 4 : Configuration Nginx (Reverse Proxy)**

#### **4.1 Créer la configuration Nginx**
```bash
nano /etc/nginx/sites-available/boulangerie-api
```

#### **4.2 Configuration Nginx**
```nginx
server {
    listen 80;
    server_name api.filmara.fr;  # ou votre sous-domaine

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### **4.3 Activer la configuration**
```bash
ln -s /etc/nginx/sites-available/boulangerie-api /etc/nginx/sites-enabled/
nginx -t  # Vérifier la configuration
systemctl reload nginx
```

### **Étape 5 : Configuration SSL (HTTPS)**

#### **5.1 Installation de Certbot**
```bash
apt install -y certbot python3-certbot-nginx
```

#### **5.2 Obtenir un certificat SSL**
```bash
certbot --nginx -d api.filmara.fr
```

### **Étape 6 : Démarrage avec PM2**

#### **6.1 Démarrer l'application**
```bash
cd /var/www/boulangerie-planning/backend
pm2 start server.js --name boulangerie-api
```

#### **6.2 Sauvegarder la configuration PM2**
```bash
pm2 save
pm2 startup  # Suivre les instructions pour le démarrage automatique
```

#### **6.3 Commandes PM2 utiles**
```bash
pm2 list              # Voir les processus
pm2 logs boulangerie-api  # Voir les logs
pm2 restart boulangerie-api  # Redémarrer
pm2 stop boulangerie-api     # Arrêter
```

### **Étape 7 : Mise à Jour du Frontend**

#### **7.1 Modifier l'URL de l'API**

Dans votre frontend, modifiez l'URL de l'API :

```javascript
// Avant (Render)
const API_BASE_URL = 'https://boulangerie-planning-api-3.onrender.com/api';

// Après (OVH)
const API_BASE_URL = 'https://api.filmara.fr/api';
```

#### **7.2 Rebuild et déployer le frontend**
```bash
cd frontend
npm run build
# Uploader sur OVH comme d'habitude
```

---

## 🔧 Configuration Alternative : Cloud Web OVH

Si vous préférez une solution plus managée :

### **1. Activer Node.js dans Cloud Web**
1. Allez dans votre espace OVH → **Cloud Web**
2. Activez **Node.js** dans les options
3. Configurez le **point d'entrée** : `backend/server.js`

### **2. Upload des fichiers**
- Utilisez SFTP ou le gestionnaire de fichiers OVH
- Uploader le dossier `backend/` dans `www/`

### **3. Configuration des variables**
- Dans l'interface OVH Cloud Web, ajoutez les variables d'environnement

### **4. Configuration du domaine**
- Configurez un sous-domaine (ex: `api.filmara.fr`)
- Point vers votre instance Cloud Web

---

## 📊 Comparaison Render vs OVH

| Critère | Render (Gratuit) | OVH VPS |
|---------|------------------|---------|
| **Coût** | Gratuit (limité) | ~5-10€/mois |
| **Pipeline minutes** | 750/mois | Illimité |
| **Cold start** | Oui (15-30s) | Non (toujours actif) |
| **Configuration** | Automatique | Manuelle |
| **Maintenance** | Aucune | Manuelle |
| **Contrôle** | Limité | Total |
| **HTTPS** | Inclus | À configurer (Certbot) |
| **Scaling** | Automatique | Manuel |

---

## ⚠️ Points d'Attention

### **1. Gestion des Processus**
- Utilisez **PM2** pour gérer Node.js
- Configurez le **redémarrage automatique**
- Surveillez les **logs** régulièrement

### **2. Sécurité**
- ✅ Configuration **firewall** (UFW)
- ✅ Mise à jour régulière du système
- ✅ Variables d'environnement sécurisées
- ✅ HTTPS obligatoire

### **3. Sauvegarde**
- Configurez des **backups automatiques**
- Sauvegardez les **variables d'environnement**
- Sauvegardez la **base de données MongoDB**

### **4. Monitoring**
- Surveillez les **logs PM2**
- Surveillez l'**utilisation des ressources**
- Configurez des **alertes** si nécessaire

---

## 🔄 Script de Déploiement Automatique

Créez un script pour faciliter les mises à jour :

```bash
#!/bin/bash
# deploy-backend-ovh.sh

cd /var/www/boulangerie-planning
git pull origin main
cd backend
npm install --production
pm2 restart boulangerie-api
echo "✅ Déploiement terminé"
```

---

## 📝 Checklist de Migration

- [ ] VPS OVH commandé et configuré
- [ ] Node.js installé et vérifié
- [ ] PM2 installé et configuré
- [ ] Application clonée et dépendances installées
- [ ] Variables d'environnement configurées
- [ ] Nginx configuré (reverse proxy)
- [ ] SSL/HTTPS configuré (Certbot)
- [ ] Application démarrée avec PM2
- [ ] Frontend mis à jour avec nouvelle URL API
- [ ] Tests de connexion effectués
- [ ] Logs vérifiés
- [ ] Backup configuré
- [ ] Monitoring configuré

---

## 🎯 Avantages de la Migration

1. **✅ Pas de limite de build** : Plus de problème de "pipeline minutes"
2. **✅ Performance constante** : Pas de "cold start"
3. **✅ Contrôle total** : Configuration personnalisée
4. **✅ Coût prévisible** : Pas de surprise de facturation
5. **✅ Tout au même endroit** : Frontend et backend sur OVH

---

## 🚨 En Cas de Problème

### **Application ne démarre pas**
```bash
# Vérifier les logs
pm2 logs boulangerie-api

# Vérifier les variables d'environnement
cat /var/www/boulangerie-planning/backend/.env

# Tester manuellement
cd /var/www/boulangerie-planning/backend
node server.js
```

### **Erreur de connexion MongoDB**
- Vérifier `MONGODB_URI` dans `.env`
- Vérifier les permissions MongoDB Atlas (whitelist IP)

### **Erreur CORS**
- Vérifier `CORS_ORIGIN` dans `.env`
- Vérifier la configuration Nginx

---

## 📞 Support

Pour toute question :
1. Consultez la documentation OVH
2. Vérifiez les logs PM2 et Nginx
3. Testez localement d'abord

---

**Votre backend peut maintenant fonctionner entièrement sur OVH, sans dépendre de Render !** 🚀




