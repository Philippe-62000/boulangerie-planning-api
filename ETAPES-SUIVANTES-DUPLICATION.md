# 🚀 Étapes Suivantes - Duplication Arras → Longuenesse

## ✅ Ce qui est déjà fait

- [x] Répertoire NAS créé : `/n8n/uploads/documents-longuenesse/`
- [x] Variables d'environnement configurées dans Render (api-3)
- [x] Code backend modifié pour supporter Longuenesse
- [x] Scripts de build/upload créés

---

## 📋 Prochaines Étapes

### **Étape 1 : Vérifier le Backend Render (api-3)**

#### 1.1. Vérifier que le backend démarre

1. Allez dans [Render Dashboard](https://dashboard.render.com)
2. Sélectionnez le service `boulangerie-planning-api-3`
3. Allez dans **Logs**
4. Vérifiez que vous voyez :
   - ✅ `✅ Connecté à MongoDB`
   - ✅ `🚀 Planning Boulangerie v1.0.0`
   - ✅ `📡 Serveur démarré sur le port 10000`

#### 1.2. Tester l'API

Ouvrez votre navigateur ou utilisez curl :

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

#### 1.3. Vérifier MongoDB

1. Allez dans [MongoDB Atlas](https://cloud.mongodb.com)
2. **Browse Collections**
3. Vous devriez voir la base `boulangerie-planning-longuenesse` (créée automatiquement)
4. Les collections apparaîtront après la première utilisation

**✅ Si tout fonctionne, passez à l'étape 2**

**❌ Si erreur, vérifiez les logs Render et corrigez les problèmes**

---

### **Étape 2 : Build le Frontend pour Longuenesse**

#### 2.1. Exécuter le script de build

Dans votre terminal, exécutez :

```batch
deploy-frontend-lon-ovh.bat
```

Ce script va :
- ✅ Build le frontend avec `base: '/lon/'`
- ✅ Configurer l'API URL vers `api-3`
- ✅ Créer le dossier `deploy-frontend-lon/`
- ✅ Créer le fichier `.htaccess` pour `/lon/`

#### 2.2. Vérifier le résultat

1. Vérifiez que le dossier `deploy-frontend-lon/` existe
2. Vérifiez qu'il contient :
   - `index.html`
   - `static/` (dossier avec JS, CSS, media)
   - `.htaccess`

**✅ Si tout est OK, passez à l'étape 3**

---

### **Étape 3 : Créer le Dossier /lon/ sur OVH**

#### 3.1. Se connecter à OVH

1. Connectez-vous à votre espace OVH
2. Allez dans le **Gestionnaire de fichiers** (File Manager)
3. Naviguez vers le dossier `www/` (ou `public_html/`)

#### 3.2. Créer le dossier /lon/

1. Créez un nouveau dossier nommé `lon`
2. **OU** utilisez FileZilla/FTP pour créer le dossier

**Chemin final :** `/www/lon/` (ou `/public_html/lon/`)

---

### **Étape 4 : Upload le Frontend sur OVH**

#### Option A : Via le Script (si le partage réseau fonctionne)

```batch
upload-deploy-frontend-lon-ovh.bat
```

#### Option B : Manuellement via FTP/FileZilla

1. Connectez-vous à votre serveur OVH via FTP
2. Naviguez vers le dossier `/www/lon/` (ou `/public_html/lon/`)
3. Uploadez **TOUT** le contenu de `deploy-frontend-lon/` dans `/lon/`
4. **Important :** Uploadez aussi le fichier `.htaccess`

#### Option C : Via le Gestionnaire de fichiers OVH

1. Dans le gestionnaire de fichiers OVH
2. Allez dans le dossier `/lon/`
3. Uploadez tous les fichiers de `deploy-frontend-lon/`
4. Assurez-vous que `.htaccess` est bien uploadé

---

### **Étape 5 : Vérifier le Frontend**

#### 5.1. Tester l'accès

1. Ouvrez votre navigateur
2. Allez sur : `https://www.filmara.fr/lon/`
3. Vérifiez que la page se charge

#### 5.2. Vérifier la console

1. Appuyez sur **F12** pour ouvrir la console
2. Allez dans l'onglet **Console**
3. Vérifiez qu'il n'y a **pas d'erreurs** :
   - ❌ Pas d'erreurs CORS
   - ❌ Pas d'erreurs 404
   - ❌ Pas d'erreurs de connexion API

#### 5.3. Vérifier les appels API

1. Dans la console, allez dans l'onglet **Network**
2. Rechargez la page
3. Vérifiez que les appels API pointent vers :
   - ✅ `https://boulangerie-planning-api-3.onrender.com/api/...`

**✅ Si tout fonctionne, passez à l'étape 6**

---

### **Étape 6 : Initialiser la Base de Données**

#### 6.1. Créer le premier compte administrateur

1. Allez sur : `https://www.filmara.fr/lon/login`
2. Cliquez sur **Créer un compte** ou **S'inscrire**
3. Créez un compte administrateur pour Longuenesse
4. Connectez-vous avec ce compte

#### 6.2. Configurer les paramètres

1. Allez dans le menu **Paramètres**
2. Configurez :
   - Email du magasin
   - Email de l'administrateur
   - Autres paramètres nécessaires

#### 6.3. Vérifier MongoDB

1. Allez dans [MongoDB Atlas](https://cloud.mongodb.com)
2. **Browse Collections** → `boulangerie-planning-longuenesse`
3. Vous devriez voir des collections créées :
   - `employees`
   - `parameters`
   - etc.

---

### **Étape 7 : Tester les Fonctionnalités**

#### 7.1. Tester l'upload SFTP

1. Créez un test (ex: uploader un arrêt maladie test)
2. Vérifiez que le fichier apparaît dans `/n8n/uploads/documents-longuenesse/2025/pending/`

#### 7.2. Tester les emails

1. Créez un test qui envoie un email (ex: demande d'acompte)
2. Vérifiez que l'email arrive avec le bon expéditeur :
   - ✅ "Boulangerie Ange - Longuenesse"

#### 7.3. Tester la séparation des données

1. Vérifiez que les données de Longuenesse n'apparaissent **PAS** dans Arras
2. Vérifiez que les données d'Arras n'apparaissent **PAS** dans Longuenesse

---

## ✅ Checklist Finale

### Backend
- [ ] Backend Render (api-3) démarre correctement
- [ ] API accessible : `api-3.onrender.com/api/health`
- [ ] MongoDB base créée : `boulangerie-planning-longuenesse`
- [ ] Logs sans erreurs

### Frontend
- [ ] Frontend buildé : `deploy-frontend-lon/` créé
- [ ] Dossier `/lon/` créé sur OVH
- [ ] Fichiers uploadés sur OVH
- [ ] Site accessible : `filmara.fr/lon/`
- [ ] Pas d'erreurs dans la console
- [ ] Appels API vers `api-3`

### Base de Données
- [ ] Premier compte admin créé
- [ ] Paramètres configurés
- [ ] Collections MongoDB créées

### Tests
- [ ] Upload SFTP fonctionne
- [ ] Emails envoyés correctement
- [ ] Séparation des données vérifiée

---

## 🐛 Dépannage

### Problème : Backend ne démarre pas

**Vérifications :**
1. Logs Render pour les erreurs
2. Variables d'environnement toutes définies
3. MongoDB URI correcte
4. JWT_SECRET sans guillemets

### Problème : Frontend ne se charge pas

**Vérifications :**
1. Dossier `/lon/` existe sur OVH
2. Fichier `.htaccess` présent
3. Tous les fichiers uploadés
4. Console navigateur pour les erreurs

### Problème : Erreurs CORS

**Vérifications :**
1. `CORS_ORIGIN` contient `https://www.filmara.fr/lon`
2. Backend redéployé après modification CORS

### Problème : Erreurs API

**Vérifications :**
1. Backend accessible : `api-3.onrender.com/api/health`
2. Frontend pointe vers `api-3` (pas `api-4-pbfy`)
3. Variables d'environnement correctes

---

## 🎯 Prochaines Actions Immédiates

1. **Vérifier le backend Render** (étape 1)
2. **Build le frontend** (étape 2)
3. **Créer le dossier /lon/ sur OVH** (étape 3)
4. **Upload le frontend** (étape 4)
5. **Tester** (étapes 5-7)

---

## 📞 Support

Si vous avez des problèmes :
1. Vérifiez les logs Render
2. Vérifiez la console du navigateur (F12)
3. Vérifiez les logs MongoDB Atlas
4. Consultez les guides créés précédemment

---

**Une fois toutes ces étapes terminées, Longuenesse sera complètement opérationnel et indépendant d'Arras !** 🎉













