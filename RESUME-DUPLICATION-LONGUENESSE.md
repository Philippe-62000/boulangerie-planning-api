# 📋 Résumé : Duplication pour Longuenesse

## ✅ Réponses Rapides

### 1. **GitHub - Même repo ?**
**OUI, même repo avec branche séparée recommandé** (ou nouveau repo si préférence)

### 2. **Interférences ?**
**NON** - Aucune interférence si bien configuré :
- Bases MongoDB séparées ✅
- Comptes EmailJS séparés ✅
- Répertoires NAS séparés ✅
- Backends Render séparés ✅

### 3. **Comptes à créer :**
- ✅ **MongoDB** : Nouvelle base de données `boulangerie-planning-longuenesse` (même cluster OK)
- ✅ **EmailJS** : Nouveau service/compte avec nouveaux templates
- ✅ **NAS** : Nouveaux répertoires `/n8n/uploads/documents-longuenesse/`
- ✅ **Render** : Utiliser `api-3` (déjà existant)

---

## 🚀 Fichiers Créés

1. **`GUIDE-DUPLICATION-LONGUENESSE.md`** - Guide complet étape par étape
2. **`deploy-frontend-lon-ovh.bat`** - Script de build pour Longuenesse
3. **`upload-deploy-frontend-lon-ovh.bat`** - Script d'upload vers OVH
4. **`RESUME-DUPLICATION-LONGUENESSE.md`** - Ce fichier

---

## 🔧 Modifications Code Effectuées

### Backend

1. **`backend/services/sftpService.js`** (ligne 19)
   - Ajout support variable `SFTP_BASE_PATH`
   - Par défaut : `/n8n/uploads/documents` (Arras)
   - Pour Longuenesse : `/n8n/uploads/documents-longuenesse`

2. **`backend/services/emailServiceAlternative.js`** (ligne 409)
   - Ajout support variable `STORE_NAME`
   - Par défaut : `'Boulangerie Ange - Arras'`
   - Pour Longuenesse : `'Boulangerie Ange - Longuenesse'`

---

## 📝 Prochaines Étapes

### 1. Configurer Render (api-3)

Variables d'environnement à ajouter dans Render :

```bash
# MongoDB - NOUVELLE BASE
MONGODB_URI=mongodb+srv://username:VOTRE_MOT_DE_PASSE_MONGODB@cluster0.4huietv.mongodb.net/boulangerie-planning-longuenesse?retryWrites=true&w=majority

# JWT - GÉNÉRER UNE NOUVELLE CLÉ
JWT_SECRET=<générer_une_nouvelle_clé>

# CORS - AJOUTER /lon
CORS_ORIGIN=https://www.filmara.fr,https://www.filmara.fr/plan,https://www.filmara.fr/lon,http://localhost:3000

# EmailJS - NOUVEAUX COMPTES
EMAILJS_SERVICE_ID=<service_id_longuenesse>
EMAILJS_TEMPLATE_ID=<template_id_longuenesse>
EMAILJS_USER_ID=<user_id_longuenesse>
EMAILJS_PRIVATE_KEY=<private_key_longuenesse>

# SFTP - NOUVEAU RÉPERTOIRE
SFTP_BASE_PATH=/n8n/sick-leaves-longuenesse
SFTP_PASSWORD=<même_mot_de_passe>

# Store Name
STORE_NAME=Boulangerie Ange - Longuenesse

# Node
NODE_ENV=production
PORT=10000
```

### 2. Créer les Répertoires NAS

Sur le NAS Synology, créer :
```
/n8n/sick-leaves-longuenesse/
├── 2025/
│   ├── pending/
│   ├── validated/
│   ├── declared/
│   └── rejected/
```

### 3. Créer les Comptes EmailJS

1. Connectez-vous à [EmailJS](https://www.emailjs.com/)
2. Créez un nouveau service (ou utilisez un compte différent)
3. Créez les templates nécessaires
4. Notez les IDs pour les variables d'environnement

### 4. Build et Upload Frontend

```batch
# 1. Build
deploy-frontend-lon-ovh.bat

# 2. Upload (manuellement sur OVH)
upload-deploy-frontend-lon-ovh.bat
```

### 5. Créer le Dossier /lon/ sur OVH

Sur OVH, créer le dossier `/lon/` et y uploader les fichiers.

---

## ✅ Checklist Complète

Voir le fichier **`GUIDE-DUPLICATION-LONGUENESSE.md`** pour la checklist détaillée.

---

## ⚠️ Points Critiques

1. **NE JAMAIS** utiliser la même base MongoDB
2. **NE JAMAIS** utiliser les mêmes comptes EmailJS
3. **NE JAMAIS** utiliser les mêmes répertoires NAS
4. **TOUJOURS** vérifier les variables d'environnement avant déploiement

---

## 📞 Support

Consultez **`GUIDE-DUPLICATION-LONGUENESSE.md`** pour les détails complets.

