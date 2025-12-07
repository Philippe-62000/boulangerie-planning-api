# 🚀 Étapes Immédiates pour Longuenesse

## ✅ Déjà Fait

- [x] Répertoire NAS créé : `/n8n/sick-leaves-longuenesse/`
- [x] Code modifié pour supporter Longuenesse
- [x] Scripts de build/upload créés

---

## 📋 Actions à Faire MAINTENANT

### 1. **MongoDB - NE RIEN CRÉER MANUELLEMENT** ✅

**IMPORTANT :** Ne créez **RIEN** dans MongoDB Atlas maintenant !

- ❌ Ne créez pas la base de données manuellement
- ❌ Ne créez pas les collections manuellement
- ✅ **Mongoose créera tout automatiquement** au premier démarrage du backend

**Ce qui se passera automatiquement :**
1. Quand le backend Render (api-3) démarre
2. Il se connecte à MongoDB avec l'URI : `mongodb+srv://.../boulangerie-planning-longuenesse`
3. MongoDB Atlas crée automatiquement la base `boulangerie-planning-longuenesse`
4. Mongoose crée automatiquement les collections au premier usage (employees, sickLeaves, etc.)

**Vous n'avez RIEN à faire pour MongoDB !** ✅

---

### 2. **Configurer Render (api-3)**

#### 2.1. Accéder au service Render

1. Connectez-vous à [Render Dashboard](https://dashboard.render.com)
2. Trouvez le service `boulangerie-planning-api-3`
3. Si le service n'existe plus, créez-en un nouveau :
   - **Type** : Web Service
   - **Name** : `boulangerie-planning-api-3`
   - **Repository** : Connectez `Philippe-62000/boulangerie-planning-api` (même repo)
   - **Branch** : `main`
   - **Root Directory** : `backend`
   - **Build Command** : `npm install`
   - **Start Command** : `node server.js`
   - **Environment** : Node

#### 2.2. Configurer les Variables d'Environnement

Allez dans **Environment** → **Environment Variables** et ajoutez :

```bash
# MongoDB - NOUVELLE BASE (sera créée automatiquement)
MONGODB_URI=mongodb+srv://username:VOTRE_MOT_DE_PASSE_MONGODB@cluster0.4huietv.mongodb.net/boulangerie-planning-longuenesse?retryWrites=true&w=majority

# JWT - GÉNÉRER UNE NOUVELLE CLÉ (différente de celle d'Arras)
# Utilisez un générateur en ligne ou : openssl rand -hex 32
JWT_SECRET=<générer_une_nouvelle_clé_secrète_unique>

# CORS - AJOUTER /lon
CORS_ORIGIN=https://www.filmara.fr,https://www.filmara.fr/plan,https://www.filmara.fr/lon,http://localhost:3000

# EmailJS - NOUVEAUX COMPTES (à créer sur emailjs.com)
EMAILJS_SERVICE_ID=<service_id_longuenesse>
EMAILJS_TEMPLATE_ID=<template_id_longuenesse>
EMAILJS_USER_ID=<user_id_longuenesse>
EMAILJS_PRIVATE_KEY=<private_key_longuenesse>

# SFTP - NOUVEAU RÉPERTOIRE (déjà créé sur le NAS)
SFTP_BASE_PATH=/n8n/uploads/documents-longuenesse
NAS_BASE_PATH=/n8n/uploads/documents-longuenesse
SFTP_PASSWORD=<même_mot_de_passe_que_pour_arras>

# Store Name
STORE_NAME=Boulangerie Ange - Longuenesse

# Node Environment
NODE_ENV=production
PORT=10000
```

#### 2.3. Déployer le Backend

1. Cliquez sur **Manual Deploy** → **Deploy latest commit**
2. Attendez que le déploiement se termine (2-3 minutes)
3. Vérifiez les logs pour confirmer la connexion MongoDB

**✅ À ce moment, MongoDB créera automatiquement la base de données !**

---

### 3. **Créer les Comptes EmailJS**

#### 3.1. Accéder à EmailJS

1. Connectez-vous à [EmailJS](https://www.emailjs.com/)
2. Si vous avez déjà un compte, vous pouvez créer un **nouveau service** dans le même compte
3. **OU** créez un compte complètement séparé (recommandé pour éviter les mélanges)

#### 3.2. Créer un Nouveau Service

1. Allez dans **Email Services** → **Add New Service**
2. Choisissez votre fournisseur email (Gmail, etc.)
3. Notez le **Service ID**

#### 3.3. Créer les Templates

Créez les templates suivants (ou copiez ceux d'Arras et modifiez) :

- Template pour arrêts maladie
- Template pour demandes d'acompte
- Template pour demandes de congés
- Template pour notifications admin

Pour chaque template, notez le **Template ID**.

#### 3.4. Récupérer les Identifiants

1. **User ID** : Trouvé dans **Account** → **General**
2. **Private Key** : Créez-en une dans **Account** → **Security** → **API Keys**

#### 3.5. Ajouter dans Render

Ajoutez ces valeurs dans les variables d'environnement Render (étape 2.2).

---

### 4. **Build et Upload du Frontend**

#### 4.1. Build le Frontend

```batch
# Exécutez ce script :
deploy-frontend-lon-ovh.bat
```

Ce script va :
- Build le frontend avec `base: '/lon/'`
- Configurer l'API URL vers `api-3`
- Créer le dossier `deploy-frontend-lon/`

#### 4.2. Créer le Dossier /lon/ sur OVH

1. Connectez-vous à votre espace OVH
2. Allez dans le gestionnaire de fichiers
3. Créez le dossier `/lon/` à la racine de `www/`
4. **OU** utilisez FileZilla/FTP pour créer le dossier

#### 4.3. Upload les Fichiers

**Option A : Via le script (si le partage réseau fonctionne)**
```batch
upload-deploy-frontend-lon-ovh.bat
```

**Option B : Manuellement**
1. Uploadez **TOUT** le contenu de `deploy-frontend-lon/` dans `/lon/` sur OVH
2. Assurez-vous que le fichier `.htaccess` est bien uploadé

---

### 5. **Vérifications Finales**

#### 5.1. Vérifier le Backend

```bash
# Testez l'API
curl https://boulangerie-planning-api-3.onrender.com/api/health
```

**Résultat attendu :**
```json
{
  "message": "Planning Boulangerie v1.0.0",
  "environment": "production"
}
```

#### 5.2. Vérifier MongoDB

1. Allez dans [MongoDB Atlas](https://cloud.mongodb.com)
2. **Browse Collections**
3. Vous devriez voir la base `boulangerie-planning-longuenesse` (créée automatiquement)
4. Les collections apparaîtront après la première utilisation

#### 5.3. Vérifier le Frontend

1. Accédez à : `https://www.filmara.fr/lon/`
2. Vérifiez que la page se charge
3. Ouvrez la console (F12) et vérifiez qu'il n'y a pas d'erreurs
4. Testez la connexion (créer un compte admin)

#### 5.4. Vérifier SFTP

1. Uploadez un arrêt maladie test
2. Vérifiez qu'il apparaît dans `/n8n/uploads/documents-longuenesse/2025/pending/`

---

## 📝 Ordre Recommandé

1. ✅ **MongoDB** : Ne rien faire (automatique)
2. ✅ **Render (api-3)** : Configurer les variables d'environnement et déployer
3. ✅ **EmailJS** : Créer les comptes/templates et ajouter dans Render
4. ✅ **Frontend** : Build et upload sur OVH
5. ✅ **Vérifications** : Tester chaque composant

---

## ⚠️ Points Critiques

1. **MongoDB** : Ne créez RIEN manuellement - c'est automatique ✅
2. **JWT_SECRET** : Doit être DIFFÉRENT de celui d'Arras
3. **EmailJS** : Nouveaux comptes/templates pour éviter les mélanges
4. **SFTP_BASE_PATH** : Doit pointer vers `/n8n/sick-leaves-longuenesse/`
5. **CORS_ORIGIN** : Doit inclure `https://www.filmara.fr/lon`

---

## 🆘 En Cas de Problème

### Backend ne démarre pas
- Vérifiez les logs Render
- Vérifiez que toutes les variables d'environnement sont définies
- Vérifiez la connexion MongoDB dans les logs

### Frontend ne se charge pas
- Vérifiez que le dossier `/lon/` existe sur OVH
- Vérifiez que le `.htaccess` est présent
- Vérifiez la console navigateur (F12) pour les erreurs

### MongoDB ne se crée pas
- Vérifiez que l'URI MongoDB est correcte
- Vérifiez que l'utilisateur MongoDB a les droits
- Attendez quelques minutes (parfois MongoDB met du temps)

---

## ✅ Checklist Finale

- [ ] Render (api-3) configuré et déployé
- [ ] Variables d'environnement toutes définies
- [ ] EmailJS comptes/templates créés
- [ ] Frontend buildé et uploadé sur OVH
- [ ] Dossier `/lon/` créé sur OVH
- [ ] Backend accessible : `api-3.onrender.com/api/health`
- [ ] Frontend accessible : `filmara.fr/lon/`
- [ ] MongoDB base créée automatiquement (vérifier dans Atlas)
- [ ] Test de connexion réussi
- [ ] Test d'upload SFTP réussi

---

**Une fois tout cela fait, les deux sites seront totalement indépendants !** 🎉

