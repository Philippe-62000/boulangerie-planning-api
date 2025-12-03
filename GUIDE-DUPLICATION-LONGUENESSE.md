# 🏪 Guide de Duplication du Site pour Longuenesse

## 📋 Vue d'ensemble

Ce guide explique comment dupliquer le système de planning pour la boulangerie de Longuenesse, en utilisant :
- **Frontend** : `filmara.fr/lon` (au lieu de `/plan`)
- **Backend Render** : `boulangerie-planning-api-3.onrender.com` (ancien compte inutilisé)
- **Même serveur OVH** : Partage des ressources mais séparation complète des données

---

## ✅ Réponses aux Questions

### 1. **GitHub - Même repo ou différent ?**

**Recommandation : MÊME REPO avec une branche séparée**

**Avantages :**
- ✅ Partage du code commun (corrections de bugs, nouvelles fonctionnalités)
- ✅ Maintenance simplifiée
- ✅ Historique unifié

**Structure proposée :**
```
main (branche actuelle - Arras)
├── frontend/plan/ (configuration pour Arras)
└── frontend/lon/ (configuration pour Longuenesse)

lon (nouvelle branche - Longuenesse)
├── frontend/ (configuré pour /lon)
└── backend/ (configuré pour api-3)
```

**Alternative :** Si vous préférez une séparation totale, créez un nouveau repo `boulangerie-planning-longuenesse`.

### 2. **Interférences entre /plan et /lon ?**

**NON, aucune interférence si bien configuré :**
- ✅ Bases de données MongoDB **séparées**
- ✅ Comptes EmailJS **séparés**
- ✅ Répertoires NAS **séparés**
- ✅ Backends Render **séparés** (api-4-pbfy vs api-3)
- ✅ Variables d'environnement **différentes**

Les deux instances sont **totalement indépendantes**.

### 3. **Comptes à créer**

#### ✅ **MongoDB - NOUVELLE BASE DE DONNÉES OBLIGATOIRE**

**Option A : Même cluster MongoDB Atlas (recommandé)**
- Utilisez le même compte MongoDB Atlas
- Créez une **nouvelle base de données** : `boulangerie-planning-longuenesse`
- URI : `mongodb+srv://phimjc:ZDOPZA2Kd8ylewoR@cluster0.4huietv.mongodb.net/boulangerie-planning-longuenesse?retryWrites=true&w=majority`

**Option B : Nouveau cluster (si vous voulez séparation totale)**
- Créez un nouveau cluster MongoDB Atlas
- Nouvelle base de données : `boulangerie-planning-longuenesse`

#### ✅ **EmailJS - NOUVEAU COMPTE/SERVICE OBLIGATOIRE**

**Étapes :**
1. Connectez-vous à [EmailJS](https://www.emailjs.com/)
2. Créez un **nouveau service** (ou utilisez un compte différent)
3. Créez de **nouveaux templates** pour Longuenesse
4. Notez les nouveaux IDs :
   - `EMAILJS_SERVICE_ID_LON`
   - `EMAILJS_TEMPLATE_ID_LON`
   - `EMAILJS_USER_ID_LON`
   - `EMAILJS_PRIVATE_KEY_LON`

**⚠️ IMPORTANT :** Ne pas réutiliser les mêmes templates/service pour éviter les mélanges d'emails.

#### ✅ **NAS/SFTP - NOUVEAUX RÉPERTOIRES OBLIGATOIRES**

**Structure actuelle (Arras) :**
```
/n8n/uploads/documents/
├── 2025/
│   ├── pending/
│   ├── validated/
│   ├── declared/
│   └── rejected/
```

**Structure à créer (Longuenesse) :**
```
/n8n/uploads/documents-longuenesse/
├── 2025/
│   ├── pending/
│   ├── validated/
│   ├── declared/
│   └── rejected/
```

**Modification via variable d'environnement :**
```bash
# Dans Render, ajouter :
SFTP_BASE_PATH=/n8n/uploads/documents-longuenesse
NAS_BASE_PATH=/n8n/uploads/documents-longuenesse
```

---

## 🚀 Étapes de Duplication

### **Étape 1 : Préparer le Backend Render (api-3)**

#### 1.1. Configurer le service Render

1. Connectez-vous à [Render](https://render.com)
2. Accédez au service `boulangerie-planning-api-3`
3. Allez dans **Settings** → **Environment Variables**

#### 1.2. Variables d'environnement à configurer

**Variables OBLIGATOIRES :**

```bash
# MongoDB - NOUVELLE BASE DE DONNÉES
MONGODB_URI=mongodb+srv://phimjc:ZDOPZA2Kd8ylewoR@cluster0.4huietv.mongodb.net/boulangerie-planning-longuenesse?retryWrites=true&w=majority

# JWT Secret - GÉNÉRER UN NOUVEAU
JWT_SECRET=<générer_une_nouvelle_clé_secrète>

# CORS - AJOUTER /lon
CORS_ORIGIN=https://www.filmara.fr,https://www.filmara.fr/plan,https://www.filmara.fr/lon,http://localhost:3000

# EmailJS - NOUVEAUX COMPTES
EMAILJS_SERVICE_ID=<service_id_longuenesse>
EMAILJS_TEMPLATE_ID=<template_id_longuenesse>
EMAILJS_USER_ID=<user_id_longuenesse>
EMAILJS_PRIVATE_KEY=<private_key_longuenesse>

# SFTP - MÊME SERVEUR, NOUVEAU RÉPERTOIRE
SFTP_BASE_PATH=/n8n/uploads/documents-longuenesse
NAS_BASE_PATH=/n8n/uploads/documents-longuenesse
SFTP_PASSWORD=<même_mot_de_passe>

# Node Environment
NODE_ENV=production
PORT=10000
```

#### 1.3. Connecter le repo GitHub

1. Dans Render, allez dans **Settings** → **Build & Deploy**
2. Connectez le même repo GitHub : `Philippe-62000/boulangerie-planning-api`
3. **OU** créez une branche `lon` et connectez cette branche

---

### **Étape 2 : Modifier le Code Backend**

#### 2.1. Modifier `backend/services/sftpService.js`

**Pour Longuenesse, ajouter une variable d'environnement :**

```javascript
// Dans sftpService.js, ligne ~19
this.basePath = process.env.SFTP_BASE_PATH || '/n8n/sick-leaves';

// Dans Render, ajouter :
// SFTP_BASE_PATH=/n8n/sick-leaves-longuenesse
```

#### 2.2. Modifier `backend/config.js`

**Ajouter la configuration pour Longuenesse :**

```javascript
// Dans config.js, ligne ~17
CORS_ORIGIN: process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['https://www.filmara.fr', 'https://www.filmara.fr/plan', 'https://www.filmara.fr/lon', 'http://localhost:3000'],
```

#### 2.3. Modifier les emails (optionnel)

Dans `backend/services/emailServiceAlternative.js`, ligne ~409 :
```javascript
from_name: process.env.STORE_NAME || 'Boulangerie Ange - Longuenesse',
```

Ajouter dans Render :
```bash
STORE_NAME=Boulangerie Ange - Longuenesse
```

---

### **Étape 3 : Préparer le Frontend**

#### 3.1. Créer une configuration pour Longuenesse

**Option A : Utiliser des variables d'environnement (recommandé)**

Créer `frontend/.env.lon` :
```bash
VITE_API_URL=https://boulangerie-planning-api-3.onrender.com/api
VITE_BASE_PATH=/lon
```

**Option B : Dupliquer et modifier `vite.config.js`**

Créer `frontend/vite.config.lon.js` :
```javascript
export default defineConfig({
  // ...
  base: '/lon/',  // Au lieu de '/plan/'
  // ...
});
```

#### 3.2. Créer un script de build pour Longuenesse

Créer `deploy-frontend-lon-ovh.bat` :
```batch
@echo off
echo ========================================
echo   DEPLOYMENT FRONTEND LONGUENESSE VERS OVH
echo ========================================
echo.

echo 1. Construction du frontend avec Vite pour /lon...
cd frontend
set VITE_API_URL=https://boulangerie-planning-api-3.onrender.com/api
call npm run build -- --base=/lon/
if %errorlevel% neq 0 (
    echo ERREUR: Echec de la construction du frontend
    pause
    exit /b 1
)
cd ..

echo.
echo 2. Copie des fichiers vers le dossier de déploiement...
if not exist "deploy-frontend-lon" mkdir "deploy-frontend-lon"

echo    - Copie des fichiers...
xcopy "frontend\build\*" "deploy-frontend-lon\" /E /I /Y

echo    - Création du .htaccess pour /lon/...
echo RewriteEngine On > deploy-frontend-lon\.htaccess
echo RewriteBase /lon/ >> deploy-frontend-lon\.htaccess
echo RewriteCond %%{REQUEST_FILENAME} !-f >> deploy-frontend-lon\.htaccess
echo RewriteCond %%{REQUEST_FILENAME} !-d >> deploy-frontend-lon\.htaccess
echo RewriteRule . /lon/index.html [L] >> deploy-frontend-lon\.htaccess

echo.
echo ✅ Fichiers prêts pour le déploiement OVH
echo 📁 Dossier: deploy-frontend-lon\
echo 🌐 URL: https://www.filmara.fr/lon/
echo.
pause
```

#### 3.3. Créer un script d'upload pour Longuenesse

Créer `upload-deploy-frontend-lon-ovh.bat` :
```batch
@echo off
echo ========================================
echo   UPLOAD DEPLOY-FRONTEND-LON VERS OVH
echo ========================================
echo.

echo 🚀 Upload vers OVH...
echo    Source: deploy-frontend-lon\
echo    Destination: \\ftp.cluster029.hosting.ovh.net\www\lon
echo.

robocopy "deploy-frontend-lon" "\\ftp.cluster029.hosting.ovh.net\www\lon" /MIR /R:3 /W:10 /NP /NDL /NFL

if %errorlevel% leq 3 (
    echo.
    echo ✅ Déploiement réussi !
    echo 🌐 Vérifiez le site sur: https://www.filmara.fr/lon
) else (
    echo.
    echo ❌ Erreur lors du déploiement
)

echo.
pause
```

---

### **Étape 4 : Créer les Répertoires NAS**

#### 4.1. Se connecter au NAS

1. Connectez-vous au NAS Synology : `philange.synology.me`
2. Utilisez File Station ou un client SFTP

#### 4.2. Créer la structure

Créer les dossiers suivants :
```
/n8n/sick-leaves-longuenesse/
├── 2025/
│   ├── pending/
│   ├── validated/
│   ├── declared/
│   └── rejected/
```

**Permissions :** Assurez-vous que l'utilisateur `nHEIGHTn` a les droits d'écriture.

---

### **Étape 5 : Initialiser la Base de Données**

#### 5.1. Créer la base de données MongoDB

1. Connectez-vous à [MongoDB Atlas](https://cloud.mongodb.com)
2. Allez dans **Database Access** → Vérifiez que l'utilisateur existe
3. Allez dans **Clusters** → **Browse Collections**
4. La base de données sera créée automatiquement au premier démarrage du backend

#### 5.2. Initialiser les données

1. Démarrez le backend Render (api-3)
2. Connectez-vous à `https://www.filmara.fr/lon/login`
3. Créez le premier compte administrateur
4. Configurez les paramètres dans le menu **Paramètres**

---

## 📝 Checklist de Déploiement

### Backend Render (api-3)
- [ ] Service Render configuré et connecté au repo GitHub
- [ ] Variables d'environnement configurées (MongoDB, JWT, CORS, EmailJS, SFTP)
- [ ] Backend déployé et accessible : `https://boulangerie-planning-api-3.onrender.com/api/health`
- [ ] CORS configuré pour accepter `filmara.fr/lon`

### Frontend OVH
- [ ] Script de build créé : `deploy-frontend-lon-ovh.bat`
- [ ] Script d'upload créé : `upload-deploy-frontend-lon-ovh.bat`
- [ ] Frontend buildé avec `base: '/lon/'`
- [ ] Frontend uploadé dans `/lon/` sur OVH
- [ ] `.htaccess` configuré pour `/lon/`
- [ ] Site accessible : `https://www.filmara.fr/lon/`

### Base de Données
- [ ] Nouvelle base MongoDB créée : `boulangerie-planning-longuenesse`
- [ ] URI MongoDB configurée dans Render
- [ ] Données initialisées (premier admin créé)

### EmailJS
- [ ] Nouveau service EmailJS créé
- [ ] Nouveaux templates créés pour Longuenesse
- [ ] Variables EmailJS configurées dans Render
- [ ] Test d'envoi d'email effectué

### NAS/SFTP
- [ ] Répertoire `/n8n/sick-leaves-longuenesse/` créé
- [ ] Structure de dossiers créée (pending, validated, declared, rejected)
- [ ] Permissions configurées
- [ ] Variable `SFTP_BASE_PATH` configurée dans Render

---

## 🔍 Vérifications Post-Déploiement

### 1. Vérifier le Backend
```bash
curl https://boulangerie-planning-api-3.onrender.com/api/health
```

**Résultat attendu :**
```json
{
  "message": "Planning Boulangerie v1.0.0",
  "environment": "production"
}
```

### 2. Vérifier le Frontend
- Accédez à : `https://www.filmara.fr/lon/`
- Vérifiez que la page se charge
- Vérifiez que les appels API fonctionnent (console navigateur)

### 3. Vérifier CORS
- Ouvrez la console du navigateur sur `filmara.fr/lon`
- Vérifiez qu'il n'y a pas d'erreurs CORS

### 4. Vérifier MongoDB
- Connectez-vous à MongoDB Atlas
- Vérifiez que la base `boulangerie-planning-longuenesse` existe
- Vérifiez qu'elle contient des collections après la première connexion

### 5. Vérifier EmailJS
- Créez un test (ex: demande d'acompte)
- Vérifiez que l'email arrive avec le bon expéditeur

### 6. Vérifier SFTP
- Uploadez un arrêt maladie
- Vérifiez qu'il apparaît dans `/n8n/sick-leaves-longuenesse/2025/pending/`

---

## 🛠️ Maintenance Future

### Mises à jour du Code

**Si même repo GitHub :**
1. Faire les modifications dans la branche `main`
2. Merger dans la branche `lon` si nécessaire
3. Redéployer les deux backends (api-4-pbfy et api-3)

**Si repos séparés :**
1. Appliquer les modifications dans les deux repos
2. Redéployer les deux backends

### Variables d'Environnement à Surveiller

- `MONGODB_URI` : Ne jamais mélanger les bases de données
- `EMAILJS_*` : Ne jamais mélanger les comptes EmailJS
- `SFTP_BASE_PATH` : Vérifier que les chemins sont corrects
- `CORS_ORIGIN` : Maintenir les deux URLs (`/plan` et `/lon`)

---

## ⚠️ Points d'Attention

1. **NE JAMAIS** utiliser la même base MongoDB pour les deux sites
2. **NE JAMAIS** utiliser les mêmes comptes EmailJS
3. **NE JAMAIS** utiliser les mêmes répertoires NAS
4. **TOUJOURS** vérifier les variables d'environnement avant de déployer
5. **TOUJOURS** tester sur un environnement de développement avant la production

---

## 📞 Support

En cas de problème :
1. Vérifier les logs Render : `https://dashboard.render.com`
2. Vérifier la console du navigateur (F12)
3. Vérifier les logs MongoDB Atlas
4. Vérifier les emails EmailJS dans le dashboard

---

## ✅ Résumé

**Ce qui est SÉPARÉ (obligatoire) :**
- ✅ Base de données MongoDB
- ✅ Comptes EmailJS
- ✅ Répertoires NAS
- ✅ Backends Render (api-4-pbfy vs api-3)
- ✅ Variables d'environnement

**Ce qui peut être PARTAGÉ (optionnel) :**
- ✅ Repo GitHub (avec branches séparées)
- ✅ Compte MongoDB Atlas (mais bases différentes)
- ✅ Serveur NAS (mais répertoires différents)
- ✅ Serveur OVH (mais dossiers différents)

**Résultat :** Deux instances **totalement indépendantes** qui ne peuvent pas interférer l'une avec l'autre.

