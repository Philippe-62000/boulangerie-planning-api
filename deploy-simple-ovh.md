# 🚀 Déploiement Simple sur OVH avec FileZilla

## Option 1 : Hébergement Web OVH (Recommandé)

### Étape 1 : Préparer les fichiers

1. **Build du frontend React**
   ```bash
   cd frontend
   npm run build
   ```
   Cela crée un dossier `build/` avec les fichiers statiques.

2. **Préparer le backend**
   - Copier le dossier `backend/` complet
   - Créer un fichier `.htaccess` pour rediriger les API calls

### Étape 2 : Upload avec FileZilla

1. **Connectez-vous à votre espace OVH** via FileZilla
   - Hôte : `ftp.votre-domaine.com` ou l'IP fournie par OVH
   - Utilisateur : votre nom d'utilisateur OVH
   - Mot de passe : votre mot de passe OVH
   - Port : 21

2. **Upload des fichiers**
   - **Frontend** : Uploader tout le contenu du dossier `frontend/build/` vers `www/`
   - **Backend** : Uploader le dossier `backend/` vers `www/api/`

### Étape 3 : Configuration

1. **Créer un fichier `.htaccess`** dans `www/` :
   ```apache
   # Redirection API vers le backend
   RewriteEngine On
   RewriteRule ^api/(.*)$ api/$1 [L]
   
   # Redirection React Router
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule . /index.html [L]
   ```

2. **Configurer la base de données**
   - Utiliser MongoDB Atlas (gratuit)
   - Ou installer MongoDB sur votre VPS OVH

## Option 2 : VPS OVH Simple

### Étape 1 : Préparer l'archive

1. **Créer une archive complète**
   ```bash
   # Dans le dossier du projet
   tar -czf boulangerie-planning.tar.gz backend/ frontend/build/ package.json
   ```

### Étape 2 : Upload et installation

1. **Upload avec FileZilla** vers votre VPS
2. **Connexion SSH** à votre VPS
3. **Installation simple** :
   ```bash
   # Extraire l'archive
   tar -xzf boulangerie-planning.tar.gz
   
   # Installer Node.js (si pas déjà fait)
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Installer les dépendances
   cd backend
   npm install
   
   # Démarrer l'application
   npm start
   ```

## 📋 Checklist Simple

### Pour l'hébergement web OVH :
- [ ] Build du frontend (`npm run build`)
- [ ] Upload du dossier `build/` vers `www/`
- [ ] Upload du dossier `backend/` vers `www/api/`
- [ ] Créer le fichier `.htaccess`
- [ ] Configurer MongoDB Atlas
- [ ] Tester l'application

### Pour le VPS OVH :
- [ ] Créer l'archive du projet
- [ ] Upload avec FileZilla
- [ ] Installer Node.js
- [ ] Installer les dépendances
- [ ] Démarrer l'application
- [ ] Configurer le domaine

## 💰 Coûts estimés

- **Hébergement Web OVH** : 2-5€/mois
- **VPS OVH** : 3,50€/mois
- **MongoDB Atlas** : Gratuit (512MB)
- **Domaine** : 8€/an

**Total** : 10-15€/mois maximum !

## 🔧 Configuration MongoDB Atlas (Gratuit)

1. Créer un compte sur [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Créer un cluster gratuit
3. Obtenir l'URI de connexion
4. L'utiliser dans votre configuration backend

## ✅ Avantages de cette approche

- ✅ **Simple** : Juste FileZilla
- ✅ **Rapide** : 10 minutes de setup
- ✅ **Économique** : 10-15€/mois
- ✅ **Fiable** : OVH est stable
- ✅ **Sans Docker** : Pas de complexité

## 🆘 En cas de problème

1. **Vérifier les logs** dans l'espace client OVH
2. **Tester l'API** : `votre-domaine.com/api/health`
3. **Vérifier la base de données** MongoDB Atlas
4. **Contacter le support OVH** si nécessaire

---

**Cette solution est 10x plus simple que Docker !** 🎉

