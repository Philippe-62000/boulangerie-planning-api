# 🏠 Guide : Hébergement du Backend sur Serveur Linux Local

## ✅ Réponse Rapide

**OUI**, il est tout à fait possible d'héberger votre backend Node.js sur votre propre serveur Linux à la maison ! C'est même une excellente solution pour avoir un contrôle total.

---

## 📋 Prérequis

### **1. Serveur Linux**
- ✅ Serveur Linux fonctionnel (Ubuntu, Debian, CentOS, etc.)
- ✅ Accès SSH ou accès physique
- ✅ Au moins 2GB RAM (4GB recommandé)
- ✅ Connexion Internet stable

### **2. Accès Réseau**
- ✅ Routeur avec accès à la configuration
- ✅ IP publique (statique ou dynamique)
- ✅ Port forwarding configuré (si nécessaire)

### **3. Connaissances**
- ✅ Connaissances de base Linux (SSH, commandes terminal)
- ✅ Accès root ou sudo

---

## 🎯 Architecture

### **Configuration Typique**
```
Internet → Routeur → Serveur Linux (Backend Node.js) → MongoDB Atlas
                ↓
         Frontend (OVH)
```

### **Flux de Données**
1. Frontend (OVH) appelle votre API
2. Requête arrive sur votre routeur
3. Routeur redirige vers votre serveur Linux
4. Backend Node.js traite la requête
5. Connexion à MongoDB Atlas (cloud)

---

## 🚀 Installation et Configuration

### **Étape 1 : Préparation du Serveur**

#### **1.1 Mise à jour du système**
```bash
sudo apt update && sudo apt upgrade -y
```

#### **1.2 Installation des outils de base**
```bash
sudo apt install -y curl wget git build-essential
```

### **Étape 2 : Installation de Node.js**

#### **2.1 Installation Node.js 18.x (LTS)**
```bash
# Ajouter le repository NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Installer Node.js
sudo apt install -y nodejs

# Vérification
node --version
npm --version
```

#### **2.2 Installation de PM2 (gestionnaire de processus)**
```bash
sudo npm install -g pm2
```

### **Étape 3 : Déploiement de l'Application**

#### **3.1 Créer le répertoire de l'application**
```bash
sudo mkdir -p /opt/boulangerie-api
sudo chown $USER:$USER /opt/boulangerie-api
cd /opt/boulangerie-api
```

#### **3.2 Cloner le repository (ou copier les fichiers)**
```bash
# Option 1 : Si vous avez un repo Git
git clone https://github.com/votre-repo/boulangerie-planning.git .

# Option 2 : Copier depuis votre machine locale
# Utilisez scp ou rsync depuis votre PC Windows
```

#### **3.3 Copier depuis Windows (si nécessaire)**

Depuis votre PC Windows (PowerShell) :
```powershell
# Installer rsync via WSL ou utiliser scp
scp -r C:\boulangerie-planning\backend\* user@votre-serveur:/opt/boulangerie-api/
```

Ou utilisez WinSCP pour copier les fichiers via interface graphique.

#### **3.4 Installation des dépendances**
```bash
cd /opt/boulangerie-api/backend
npm install --production
```

### **Étape 4 : Configuration des Variables d'Environnement**

#### **4.1 Créer le fichier .env**
```bash
nano /opt/boulangerie-api/backend/.env
```

#### **4.2 Copier les variables depuis votre fichier existant**

Copiez toutes les variables depuis `boulangerie-planning-api-3-FINAL.env` :

```bash
# MongoDB
MONGODB_URI=mongodb+srv://username:VOTRE_MOT_DE_PASSE_MONGODB@cluster0.4huietv.mongodb.net/boulangerie-planning-longuenesse?retryWrites=true&w=majority

# JWT
JWT_SECRET=VOTRE_JWT_SECRET_GENERE

# CORS
CORS_ORIGIN=https://www.filmara.fr,https://www.filmara.fr/plan,https://www.filmara.fr/lon,http://localhost:3000

# Email SMTP OVH
SMTP_HOST_OVH=ssl0.ovh.net
SMTP_PORT_OVH=465
SMTP_SECURE_OVH=true
SMTP_USER_OVH=longuenesse@filmara.fr
SMTP_PASS_OVH=VOTRE_MOT_DE_PASSE_SMTP_OVH

# SFTP
SFTP_BASE_PATH=/n8n/uploads/documents-longuenesse
SFTP_PASSWORD=VOTRE_MOT_DE_PASSE_SFTP

# Application
NODE_ENV=production
PORT=3000
STORE_NAME=Boulangerie Ange - Longuenesse
```

#### **4.3 Sécuriser le fichier .env**
```bash
chmod 600 /opt/boulangerie-api/backend/.env
```

### **Étape 5 : Configuration du Firewall**

#### **5.1 Installation et configuration UFW**
```bash
sudo apt install -y ufw

# Autoriser SSH (IMPORTANT - faites-le en premier !)
sudo ufw allow 22/tcp

# Autoriser le port de l'API (ex: 3000)
sudo ufw allow 3000/tcp

# Ou si vous utilisez HTTPS (443)
sudo ufw allow 443/tcp

# Activer le firewall
sudo ufw enable

# Vérifier le statut
sudo ufw status
```

### **Étape 6 : Configuration du Routeur (Port Forwarding)**

#### **6.1 Accéder à votre routeur**
- Ouvrez un navigateur : `http://192.168.1.1` (ou l'IP de votre routeur)
- Connectez-vous avec vos identifiants admin

#### **6.2 Configurer le port forwarding**
1. Allez dans **Port Forwarding** ou **Virtual Server**
2. Créez une nouvelle règle :
   - **Nom** : Boulangerie API
   - **Port externe** : 3000 (ou 443 pour HTTPS)
   - **Port interne** : 3000
   - **IP interne** : IP de votre serveur Linux (ex: 192.168.1.100)
   - **Protocole** : TCP
   - **Activer** : Oui

#### **6.3 Trouver l'IP de votre serveur**
```bash
# Sur votre serveur Linux
ip addr show
# ou
hostname -I
```

### **Étape 7 : Configuration DNS (Optionnel mais Recommandé)**

#### **7.1 Option A : Sous-domaine avec IP statique**

Si vous avez une IP publique statique :
1. Allez dans votre gestionnaire de domaine (OVH)
2. Créez un enregistrement A :
   - **Nom** : `api` (ou `backend`)
   - **Type** : A
   - **Valeur** : Votre IP publique
   - **TTL** : 3600

Résultat : `api.filmara.fr` → Votre IP publique

#### **7.2 Option B : DNS Dynamique (si IP dynamique)**

Si votre IP change régulièrement, utilisez un service DNS dynamique :

**Avec DuckDNS (gratuit) :**
```bash
# Installer DuckDNS
sudo apt install -y curl

# Créer un script de mise à jour
sudo nano /opt/scripts/update-dns.sh
```

```bash
#!/bin/bash
# update-dns.sh
TOKEN="votre-token-duckdns"
DOMAIN="votre-domaine.duckdns.org"
curl "https://www.duckdns.org/update?domains=$DOMAIN&token=$TOKEN&ip="
```

```bash
chmod +x /opt/scripts/update-dns.sh

# Ajouter au cron (mise à jour toutes les 5 minutes)
crontab -e
# Ajouter :
*/5 * * * * /opt/scripts/update-dns.sh
```

### **Étape 8 : Configuration HTTPS (Recommandé)**

#### **8.1 Installation de Certbot (Let's Encrypt)**
```bash
sudo apt install -y certbot

# Si vous utilisez Nginx
sudo apt install -y nginx
sudo certbot --nginx -d api.filmara.fr
```

#### **8.2 Configuration Nginx comme Reverse Proxy**

Créer la configuration Nginx :
```bash
sudo nano /etc/nginx/sites-available/boulangerie-api
```

```nginx
server {
    listen 80;
    server_name api.filmara.fr;

    # Redirection vers HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.filmara.fr;

    ssl_certificate /etc/letsencrypt/live/api.filmara.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.filmara.fr/privkey.pem;

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

Activer la configuration :
```bash
sudo ln -s /etc/nginx/sites-available/boulangerie-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### **Étape 9 : Démarrage avec PM2**

#### **9.1 Démarrer l'application**
```bash
cd /opt/boulangerie-api/backend
pm2 start server.js --name boulangerie-api
```

#### **9.2 Sauvegarder la configuration PM2**
```bash
pm2 save
pm2 startup
# Suivre les instructions affichées pour le démarrage automatique
```

#### **9.3 Commandes PM2 utiles**
```bash
pm2 list                    # Voir les processus
pm2 logs boulangerie-api    # Voir les logs
pm2 restart boulangerie-api # Redémarrer
pm2 stop boulangerie-api    # Arrêter
pm2 monit                   # Monitoring en temps réel
```

### **Étape 10 : Mise à Jour du Frontend**

#### **10.1 Modifier l'URL de l'API**

Dans votre frontend, modifiez l'URL de l'API :

```javascript
// Avant (Render)
const API_BASE_URL = 'https://boulangerie-planning-api-3.onrender.com/api';

// Après (Serveur local)
const API_BASE_URL = 'https://api.filmara.fr/api';
// ou si pas de HTTPS : 'http://votre-ip-publique:3000/api'
```

#### **10.2 Rebuild et déployer le frontend**
```bash
cd frontend
npm run build
# Uploader sur OVH comme d'habitude
```

---

## 🔒 Sécurité

### **1. Firewall (UFW)**
```bash
# Vérifier les règles
sudo ufw status verbose

# Autoriser uniquement ce qui est nécessaire
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 443/tcp   # HTTPS
sudo ufw deny 3000/tcp   # Bloquer l'accès direct au port 3000 (utiliser Nginx)
```

### **2. Fail2Ban (Protection contre les attaques)**
```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### **3. Mises à jour automatiques**
```bash
# Installer unattended-upgrades
sudo apt install -y unattended-upgrades

# Configurer
sudo dpkg-reconfigure -plow unattended-upgrades
```

### **4. Accès SSH sécurisé**
```bash
# Désactiver l'authentification par mot de passe (utiliser les clés)
sudo nano /etc/ssh/sshd_config
# Modifier : PasswordAuthentication no
sudo systemctl restart sshd
```

### **5. MongoDB Atlas Whitelist**

N'oubliez pas d'ajouter votre IP publique dans MongoDB Atlas :
1. Allez dans MongoDB Atlas → Network Access
2. Ajoutez votre IP publique (ou 0.0.0.0/0 si IP dynamique)

---

## 📊 Monitoring et Maintenance

### **1. Script de Monitoring**

Créer un script de vérification :
```bash
sudo nano /opt/scripts/check-api.sh
```

```bash
#!/bin/bash
# check-api.sh

API_URL="http://localhost:3000/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)

if [ $RESPONSE -ne 200 ]; then
    echo "❌ API ne répond pas (Code: $RESPONSE)"
    pm2 restart boulangerie-api
    # Optionnel : Envoyer une notification
else
    echo "✅ API fonctionne correctement"
fi
```

```bash
chmod +x /opt/scripts/check-api.sh

# Ajouter au cron (vérification toutes les 5 minutes)
crontab -e
# Ajouter :
*/5 * * * * /opt/scripts/check-api.sh
```

### **2. Logs**

```bash
# Logs PM2
pm2 logs boulangerie-api

# Logs système
sudo journalctl -u pm2-root -f

# Logs Nginx (si utilisé)
sudo tail -f /var/log/nginx/error.log
```

### **3. Sauvegarde**

Créer un script de sauvegarde :
```bash
sudo nano /opt/scripts/backup-api.sh
```

```bash
#!/bin/bash
# backup-api.sh

BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Créer le dossier de backup
mkdir -p $BACKUP_DIR

# Sauvegarder le code
tar -czf $BACKUP_DIR/api-code-$DATE.tar.gz /opt/boulangerie-api

# Sauvegarder le .env (sécurisé)
cp /opt/boulangerie-api/backend/.env $BACKUP_DIR/.env-$DATE

# Garder seulement les 7 derniers backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name ".env-*" -mtime +7 -delete
```

```bash
chmod +x /opt/scripts/backup-api.sh

# Backup quotidien à 2h du matin
crontab -e
# Ajouter :
0 2 * * * /opt/scripts/backup-api.sh
```

---

## 🔄 Script de Déploiement Automatique

Créer un script pour faciliter les mises à jour :
```bash
sudo nano /opt/scripts/deploy-api.sh
```

```bash
#!/bin/bash
# deploy-api.sh

cd /opt/boulangerie-api

# Sauvegarder avant mise à jour
echo "📦 Sauvegarde en cours..."
tar -czf /opt/backups/pre-update-$(date +%Y%m%d_%H%M%S).tar.gz .

# Mettre à jour depuis Git (si utilisé)
if [ -d .git ]; then
    echo "🔄 Mise à jour depuis Git..."
    git pull origin main
fi

# Installer les dépendances
echo "📥 Installation des dépendances..."
cd backend
npm install --production

# Redémarrer l'application
echo "🚀 Redémarrage de l'application..."
pm2 restart boulangerie-api

echo "✅ Déploiement terminé !"
pm2 logs boulangerie-api --lines 20
```

```bash
chmod +x /opt/scripts/deploy-api.sh
```

---

## 🚨 Dépannage

### **Problème : Application ne démarre pas**
```bash
# Vérifier les logs
pm2 logs boulangerie-api

# Vérifier les variables d'environnement
cat /opt/boulangerie-api/backend/.env

# Tester manuellement
cd /opt/boulangerie-api/backend
node server.js
```

### **Problème : Port déjà utilisé**
```bash
# Vérifier quel processus utilise le port
sudo lsof -i :3000

# Tuer le processus si nécessaire
sudo kill -9 <PID>
```

### **Problème : Connexion MongoDB échoue**
- Vérifier `MONGODB_URI` dans `.env`
- Vérifier les permissions MongoDB Atlas (whitelist IP)
- Vérifier la connectivité Internet

### **Problème : CORS errors**
- Vérifier `CORS_ORIGIN` dans `.env`
- Vérifier que l'URL du frontend est dans la liste

### **Problème : IP publique change**
- Utiliser un service DNS dynamique (DuckDNS, No-IP)
- Ou configurer un script de mise à jour automatique

---

## 📝 Checklist Complète

- [ ] Serveur Linux configuré et à jour
- [ ] Node.js installé (v18+)
- [ ] PM2 installé et configuré
- [ ] Application déployée dans `/opt/boulangerie-api`
- [ ] Dépendances installées (`npm install`)
- [ ] Variables d'environnement configurées (`.env`)
- [ ] Firewall configuré (UFW)
- [ ] Port forwarding configuré sur le routeur
- [ ] DNS configuré (sous-domaine ou DNS dynamique)
- [ ] HTTPS configuré (Certbot + Nginx)
- [ ] Application démarrée avec PM2
- [ ] Démarrage automatique configuré (`pm2 startup`)
- [ ] MongoDB Atlas whitelist mis à jour
- [ ] Frontend mis à jour avec nouvelle URL API
- [ ] Tests de connexion effectués
- [ ] Monitoring configuré
- [ ] Sauvegarde configurée
- [ ] Sécurité renforcée (fail2ban, SSH keys)

---

## 🎯 Avantages de l'Hébergement Local

1. **✅ Contrôle total** : Vous gérez tout
2. **✅ Pas de limite** : Pas de restriction de build/minutes
3. **✅ Coût réduit** : Seulement le coût de l'électricité
4. **✅ Performance** : Pas de latence réseau vers le serveur
5. **✅ Confidentialité** : Données sur votre serveur
6. **✅ Apprentissage** : Excellente expérience technique

---

## ⚠️ Inconvénients à Considérer

1. **⚠️ IP dynamique** : Peut changer (solution : DNS dynamique)
2. **⚠️ Maintenance** : Vous devez gérer les mises à jour
3. **⚠️ Électricité** : Serveur doit rester allumé 24/7
4. **⚠️ Bande passante** : Utilise votre connexion Internet
5. **⚠️ Sécurité** : Vous êtes responsable de la sécurité

---

## 🔧 Configuration Avancée : Script de Déploiement depuis Windows

Créer un script batch pour déployer depuis votre PC Windows :

```batch
@echo off
REM deploy-to-local-server.bat

echo ========================================
echo 🚀 DÉPLOIEMENT VERS SERVEUR LOCAL
echo ========================================

set SERVER_USER=user
set SERVER_IP=192.168.1.100
set SERVER_PATH=/opt/boulangerie-api

echo 📦 Compression des fichiers...
cd backend
tar -czf ..\backend.tar.gz *
cd ..

echo 📤 Upload vers le serveur...
scp backend.tar.gz %SERVER_USER%@%SERVER_IP%:/tmp/

echo 🔄 Déploiement sur le serveur...
ssh %SERVER_USER%@%SERVER_IP% "cd %SERVER_PATH%/backend && tar -xzf /tmp/backend.tar.gz && npm install --production && pm2 restart boulangerie-api"

echo ✅ Déploiement terminé !
```

---

**Votre backend peut maintenant fonctionner sur votre propre serveur Linux !** 🏠🚀




