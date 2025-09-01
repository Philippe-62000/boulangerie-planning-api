# 🚀 Déploiement Automatique GitHub + Render

## 📋 **Prérequis**

1. **Git installé** sur votre machine
2. **Compte GitHub** créé
3. **Compte Render** créé

## 🔧 **Étape 1 : Créer le repository GitHub**

### 1.1 **Via l'interface web GitHub**
1. Allez sur [github.com](https://github.com)
2. Cliquez sur **"New repository"**
3. Nommez-le : `boulangerie-planning-api`
4. Laissez-le **public** (gratuit)
5. **Ne cochez pas** "Add a README file"
6. Cliquez sur **"Create repository"**

### 1.2 **Notez l'URL**
L'URL sera : `https://github.com/votre-username/boulangerie-planning-api.git`

## 🚀 **Étape 2 : Déploiement automatique**

### **Option A : Script PowerShell (Recommandé)**
```powershell
# Dans PowerShell, naviguez vers votre projet
cd C:\boulangerie-planning

# Exécutez le script
.\deploy-api-to-github.ps1
```

### **Option B : Script Batch**
```cmd
# Dans CMD, naviguez vers votre projet
cd C:\boulangerie-planning

# Exécutez le script
deploy-api-to-github.bat
```

### **Option C : Commandes manuelles**
```bash
# Créer le dossier temporaire
mkdir boulangerie-api-temp
cd boulangerie-api-temp

# Copier tous les fichiers
xcopy "..\deploy\api\*" "." /E /I /Y

# Initialiser Git
git init
git add .
git commit -m "Initial commit - API Boulangerie Planning"

# Ajouter le remote (remplacez par votre URL)
git remote add origin https://github.com/votre-username/boulangerie-planning-api.git

# Pousser vers GitHub
git branch -M main
git push -u origin main

# Nettoyer
cd ..
rmdir /s /q boulangerie-api-temp
```

## 🌐 **Étape 3 : Déploiement sur Render**

### 3.1 **Connecter GitHub à Render**
1. Allez sur [render.com](https://render.com)
2. Cliquez sur **"Sign up"** avec votre compte GitHub
3. Autorisez l'accès à vos repositories

### 3.2 **Créer le service web**
1. Cliquez sur **"New Web Service"**
2. Sélectionnez votre repository `boulangerie-planning-api`
3. Configuration :
   - **Name :** `boulangerie-planning-api`
   - **Environment :** `Node`
   - **Build Command :** `npm install`
   - **Start Command :** `node server.js`
   - **Plan :** `Free`

### 3.3 **Variables d'environnement**
Dans les paramètres du service, ajoutez :

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://phimjc:ZDOPZA2Kd8ylewoR@cluster0.4huietv.mongodb.net/boulangerie-planning?retryWrites=true&w=majority
JWT_SECRET=votre-secret-jwt-super-securise
CORS_ORIGIN=https://votre-domaine-ovh.com
```

## ✅ **Étape 4 : Vérification**

### 4.1 **Test de l'API**
Votre API sera disponible sur : `https://boulangerie-planning-api.onrender.com`

Testez avec :
```bash
curl https://boulangerie-planning-api.onrender.com
```

### 4.2 **Vérifier les logs Render**
1. Dans le dashboard Render
2. Cliquez sur votre service
3. Onglet "Logs"
4. Vérifiez qu'il n'y a pas d'erreurs

## 🔧 **Dépannage**

### **Problème : Erreur Git**
```bash
# Vérifier la configuration Git
git config --global user.name "Votre Nom"
git config --global user.email "votre-email@example.com"
```

### **Problème : Erreur de push**
```bash
# Forcer le push (si nécessaire)
git push -u origin main --force
```

### **Problème : Erreur Render**
1. Vérifiez les logs dans Render
2. Vérifiez que `package.json` existe
3. Vérifiez les variables d'environnement

## 📊 **Structure finale**

Votre repository GitHub contiendra :
```
boulangerie-planning-api/
├── package.json
├── server.js
├── config.js
├── routes/
│   ├── employees.js
│   ├── planning.js
│   └── constraints.js
├── models/
├── controllers/
└── node_modules/
```

## 🎯 **Prochaines étapes**

1. ✅ **Repository GitHub créé**
2. ✅ **API déployée sur Render**
3. 🔄 **Configurer le frontend OVH**
4. 🔄 **Tester la connectivité**
5. 🔄 **Configurer n8n (optionnel)**

## 💡 **Astuces**

- **GitHub Desktop** : Alternative graphique à Git
- **GitHub CLI** : Interface en ligne de commande
- **Render Dashboard** : Monitoring en temps réel
- **GitHub Actions** : CI/CD automatique (optionnel)
