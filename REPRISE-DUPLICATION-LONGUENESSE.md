# 🚀 Reprise de la Duplication pour Longuenesse

## 📋 Contexte

La duplication du site d'Arras pour Longuenesse avait été commencée mais interrompue car Render avait atteint sa limite de minutes de build gratuites. Nous reprenons maintenant la duplication.

## ✅ État Actuel - Ce qui est Déjà Fait

### Code Backend
- ✅ **`backend/services/sftpService.js`** : Support de `SFTP_BASE_PATH` (ligne 22)
- ✅ **`backend/services/emailServiceAlternative.js`** : Support de `STORE_NAME` (ligne 409)
- ✅ **`backend/server.js`** : Support de `CORS_ORIGIN` via variable d'environnement (lignes 23-25)

### Scripts de Build
- ✅ **`deploy-frontend-lon-ovh.bat`** : Script de build pour Longuenesse
- ✅ **`upload-deploy-frontend-lon-ovh.bat`** : Script d'upload vers OVH

### Documentation
- ✅ Guides de duplication créés
- ✅ Instructions détaillées disponibles

---

## 📝 Plan d'Action - Étapes à Suivre

### **Étape 1 : Vérifier l'État de Render**

1. Connectez-vous à [Render Dashboard](https://dashboard.render.com)
2. Vérifiez le service `boulangerie-planning-api-3` :
   - ✅ Existe-t-il encore ?
   - ✅ Est-il suspendu ou actif ?
   - ✅ Les minutes de build sont-elles réinitialisées ?

**Si le service n'existe plus :**
- Créez un nouveau service Web
- Nom : `boulangerie-planning-api-3`
- Repository : `Philippe-62000/boulangerie-planning-api`
- Branch : `main` (ou créez une branche `longuenesse`)
- Root Directory : `backend`
- Build Command : `npm install`
- Start Command : `node server.js`

---

### **Étape 2 : Configurer les Variables d'Environnement dans Render**

Dans Render, allez dans **Environment** → **Environment Variables** et ajoutez/modifiez :

**📋 Les valeurs complètes sont disponibles dans le fichier `boulangerie-planning-api-3-FINAL.env`**

Voici les variables essentielles à configurer :

```bash
# MongoDB - NOUVELLE BASE (sera créée automatiquement)
MONGODB_URI=mongodb+srv://phimjc:ZDOPZA2Kd8ylewoR@cluster0.4huietv.mongodb.net/boulangerie-planning-longuenesse?retryWrites=true&w=majority

# JWT - NOUVELLE CLÉ (différente de celle d'Arras)
JWT_SECRET=a22/JbwO0C/zuixj0eNBq1rWKb+KBEvckPlw+T+dWbEDXH2S2FvxM2L5KoIg5WeNLWiDPgj5rlvNldE3kSN41A==

# CORS - INCLURE /lon
CORS_ORIGIN=https://www.filmara.fr,https://www.filmara.fr/plan,https://www.filmara.fr/lon,http://localhost:3000

# EmailJS - COMPTES LONGUENESSE
EMAILJS_SERVICE_ID=gmail
EMAILJS_TEMPLATE_ID=template_ti7474g
EMAILJS_USER_ID=RID3Du7xMUj54pzjb
EMAILJS_PRIVATE_KEY=tKYqrTUpzRQiq_7r0ZjCJ

# SFTP - NOUVEAU RÉPERTOIRE
SFTP_BASE_PATH=/n8n/uploads/documents-longuenesse
NAS_BASE_PATH=/n8n/uploads/documents-longuenesse
SFTP_PASSWORD=#heulph:N8N5

# Store Name
STORE_NAME=Boulangerie Ange - Longuenesse

# SMTP Configuration OVH
SMTP_HOST_OVH=ssl0.ovh.net
SMTP_PORT_OVH=465
SMTP_SECURE_OVH=true
SMTP_USER_OVH=longuenesse@filmara.fr
SMTP_PASS_OVH=#heulph:LON5

# SMTP Configuration Gmail (si utilisé)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=longuenesse.boulangerie.ange@gmail.com
SMTP_PASS=iazithmolbunifyv

# Node Environment
NODE_ENV=production
PORT=10000
```

**⚠️ IMPORTANT :**
- `JWT_SECRET` est **DIFFÉRENT** de celui d'Arras ✅
- `MONGODB_URI` pointe vers `boulangerie-planning-longuenesse` ✅
- `CORS_ORIGIN` inclut `https://www.filmara.fr/lon` ✅
- **SANS guillemets** dans Render (copiez-collez directement les valeurs)

---

### **Étape 3 : Vérifier les Comptes EmailJS pour Longuenesse**

✅ **Les comptes EmailJS semblent déjà configurés** (voir `boulangerie-planning-api-3-FINAL.env`)

Si vous devez vérifier ou recréer les comptes :

1. Connectez-vous à [EmailJS](https://www.emailjs.com/)
2. Vérifiez que le service existe : `gmail` (Service ID)
3. Vérifiez que le template existe : `template_ti7474g` (Template ID)
4. Vérifiez les identifiants :
   - **Service ID** : `gmail`
   - **Template ID** : `template_ti7474g`
   - **User ID** : `RID3Du7xMUj54pzjb`
   - **Private Key** : `tKYqrTUpzRQiq_7r0ZjCJ`
5. Si les comptes n'existent pas, créez-les et mettez à jour les valeurs dans Render

**⚠️ IMPORTANT :** Ne pas réutiliser les mêmes templates/service que pour Arras pour éviter les mélanges d'emails.

---

### **Étape 4 : Vérifier/Créer les Répertoires NAS**

1. Connectez-vous au NAS Synology : `philange.synology.me`
2. Vérifiez que le répertoire existe : `/n8n/uploads/documents-longuenesse/`
3. Si le répertoire n'existe pas, créez-le avec la structure :
   ```
   /n8n/uploads/documents-longuenesse/
   ├── 2025/
   │   ├── pending/
   │   ├── validated/
   │   ├── declared/
   │   └── rejected/
   ```
4. Vérifiez les permissions : l'utilisateur `nHEIGHTn` doit avoir les droits d'écriture

---

### **Étape 5 : Déployer le Backend sur Render**

1. Dans Render, allez dans le service `boulangerie-planning-api-3`
2. Cliquez sur **Manual Deploy** → **Deploy latest commit**
3. Attendez que le déploiement se termine (2-3 minutes)
4. Vérifiez les logs pour confirmer :
   - ✅ `✅ Connecté à MongoDB`
   - ✅ `🚀 Planning Boulangerie v1.0.0`
   - ✅ `📡 Serveur démarré sur le port 10000`

**Test de l'API :**
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

**✅ À ce moment, MongoDB créera automatiquement la base de données `boulangerie-planning-longuenesse` !**

---

### **Étape 6 : Build le Frontend pour Longuenesse**

1. Exécutez le script de build :
   ```batch
   deploy-frontend-lon-ovh.bat
   ```

2. Ce script va :
   - ✅ Build le frontend avec `base: '/lon/'`
   - ✅ Configurer l'API URL vers `api-3.onrender.com`
   - ✅ Créer le dossier `deploy-frontend-lon/`
   - ✅ Créer le fichier `.htaccess` pour `/lon/`
   - ✅ Remplacer les URLs API dans les fichiers HTML

3. Vérifiez que le dossier `deploy-frontend-lon/` a été créé avec :
   - `index.html`
   - `static/` (dossier avec JS, CSS, media)
   - `.htaccess`

---

### **Étape 7 : Upload le Frontend sur OVH**

#### 7.1. Créer le Dossier /lon/ sur OVH

1. Connectez-vous à votre espace OVH
2. Allez dans le **Gestionnaire de fichiers**
3. Naviguez vers `www/` (ou `public_html/`)
4. **Créez un nouveau dossier** nommé `lon`

**Chemin final :** `/www/lon/` (ou `/public_html/lon/`)`

#### 7.2. Upload les Fichiers

**Option A : Via le Script (si le partage réseau fonctionne)**
```batch
upload-deploy-frontend-lon-ovh.bat
```

**Option B : Manuellement via FTP/FileZilla**
1. Connectez-vous à OVH via FTP
2. Naviguez vers `/www/lon/` (ou `/public_html/lon/`)
3. **Uploadez TOUT le contenu** de `deploy-frontend-lon/` dans `/lon/`
4. **Important :** Uploadez aussi le fichier `.htaccess`

**Option C : Via le Gestionnaire de fichiers OVH**
1. Dans le gestionnaire de fichiers OVH
2. Allez dans le dossier `/lon/`
3. Uploadez tous les fichiers de `deploy-frontend-lon/`
4. Assurez-vous que `.htaccess` est bien uploadé

---

### **Étape 8 : Vérifications et Tests**

#### 8.1. Vérifier le Backend
- ✅ API accessible : `https://boulangerie-planning-api-3.onrender.com/api/health`
- ✅ Logs sans erreurs dans Render
- ✅ MongoDB base créée : `boulangerie-planning-longuenesse`

#### 8.2. Vérifier le Frontend
- ✅ Site accessible : `https://www.filmara.fr/lon/`
- ✅ Page se charge correctement
- ✅ Pas d'erreurs dans la console (F12)
- ✅ Appels API pointent vers `api-3.onrender.com`

#### 8.3. Initialiser la Base de Données
1. Allez sur : `https://www.filmara.fr/lon/login`
2. Créez le premier compte administrateur pour Longuenesse
3. Connectez-vous avec ce compte
4. Configurez les paramètres dans le menu **Paramètres**

#### 8.4. Tester les Fonctionnalités
- ✅ Upload SFTP : Vérifier qu'un fichier apparaît dans `/n8n/uploads/documents-longuenesse/2025/pending/`
- ✅ Emails : Créer un test qui envoie un email, vérifier que l'expéditeur est "Boulangerie Ange - Longuenesse"
- ✅ Séparation des données : Vérifier que les données de Longuenesse n'apparaissent PAS dans Arras et vice versa

---

## ✅ Checklist Complète

### Backend Render
- [ ] Service `boulangerie-planning-api-3` existe et est actif
- [ ] Toutes les variables d'environnement configurées
- [ ] Backend déployé et accessible
- [ ] API health check fonctionne
- [ ] Logs sans erreurs

### EmailJS
- [ ] Nouveau service créé
- [ ] Templates créés pour Longuenesse
- [ ] Identifiants récupérés et ajoutés dans Render

### NAS/SFTP
- [ ] Répertoire `/n8n/uploads/documents-longuenesse/` créé
- [ ] Structure de dossiers créée (pending, validated, declared, rejected)
- [ ] Permissions configurées

### Frontend OVH
- [ ] Frontend buildé : `deploy-frontend-lon/` créé
- [ ] Dossier `/lon/` créé sur OVH
- [ ] Fichiers uploadés sur OVH
- [ ] Site accessible : `filmara.fr/lon/`
- [ ] Pas d'erreurs dans la console
- [ ] Appels API vers `api-3`

### Base de Données
- [ ] Base MongoDB créée automatiquement : `boulangerie-planning-longuenesse`
- [ ] Premier compte admin créé
- [ ] Paramètres configurés

### Tests
- [ ] Upload SFTP fonctionne
- [ ] Emails envoyés correctement
- [ ] Séparation des données vérifiée

---

## 🐛 Dépannage

### Problème : Backend ne démarre pas
- Vérifiez les logs Render
- Vérifiez que toutes les variables d'environnement sont définies
- Vérifiez la connexion MongoDB dans les logs
- Vérifiez que `JWT_SECRET` n'a pas de guillemets

### Problème : Frontend ne se charge pas
- Vérifiez que le dossier `/lon/` existe sur OVH
- Vérifiez que le fichier `.htaccess` est présent
- Vérifiez que tous les fichiers sont uploadés
- Vérifiez la console navigateur (F12) pour les erreurs

### Problème : Erreurs CORS
- Vérifiez que `CORS_ORIGIN` contient `https://www.filmara.fr/lon`
- Vérifiez que le backend a été redéployé après modification CORS

### Problème : Erreurs API
- Vérifiez que le backend est accessible : `api-3.onrender.com/api/health`
- Vérifiez que le frontend pointe vers `api-3` (pas `api-4-pbfy`)
- Vérifiez les variables d'environnement

### Problème : MongoDB ne se crée pas
- Vérifiez que l'URI MongoDB est correcte
- Vérifiez que l'utilisateur MongoDB a les droits
- Attendez quelques minutes (parfois MongoDB met du temps)

---

## 📞 Support

En cas de problème :
1. Vérifiez les logs Render : `https://dashboard.render.com`
2. Vérifiez la console du navigateur (F12)
3. Vérifiez les logs MongoDB Atlas
4. Consultez les guides créés précédemment :
   - `GUIDE-DUPLICATION-LONGUENESSE.md`
   - `ETAPES-IMMEDIATES-LONGUENESSE.md`
   - `ETAPES-SUIVANTES-DUPLICATION.md`

---

## 🎯 Résultat Final

Une fois toutes ces étapes terminées, vous aurez :
- ✅ Deux sites **totalement indépendants** : Arras (`/plan/`) et Longuenesse (`/lon/`)
- ✅ Deux backends séparés : `api-4-pbfy` (Arras) et `api-3` (Longuenesse)
- ✅ Deux bases de données MongoDB séparées
- ✅ Deux comptes EmailJS séparés
- ✅ Deux répertoires NAS séparés
- ✅ Aucune interférence entre les deux sites

**Les deux boulangeries peuvent fonctionner en parallèle sans aucun conflit !** 🎉

