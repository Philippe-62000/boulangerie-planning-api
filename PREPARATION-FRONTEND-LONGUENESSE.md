# 🚀 Préparation Frontend Longuenesse - Upload Immédiat

## ✅ Oui, vous pouvez uploader le frontend MAINTENANT !

Le frontend peut être uploadé sur OVH **indépendamment** du backend Render. Il pointera vers `api-3` qui sera disponible quand les pipeline minutes seront réinitialisées.

---

## 📋 Étapes pour Uploader le Frontend

### **Étape 1 : Build le Frontend pour Longuenesse**

Exécutez le script de build :

```batch
deploy-frontend-lon-ovh.bat
```

**Ce script va :**
- ✅ Build le frontend avec `base: '/lon/'`
- ✅ Configurer l'API URL vers `api-3.onrender.com`
- ✅ Créer le dossier `deploy-frontend-lon/`
- ✅ Créer le fichier `.htaccess` pour `/lon/`

**Résultat :** Dossier `deploy-frontend-lon/` prêt à uploader

---

### **Étape 2 : Créer le Dossier /lon/ sur OVH**

1. Connectez-vous à votre espace OVH
2. Allez dans le **Gestionnaire de fichiers**
3. Naviguez vers `www/` (ou `public_html/`)
4. **Créez un nouveau dossier** nommé `lon`

**Chemin final :** `/www/lon/` (ou `/public_html/lon/`)

---

### **Étape 3 : Upload le Frontend**

#### Option A : Via le Script (si le partage réseau fonctionne)

```batch
upload-deploy-frontend-lon-ovh.bat
```

#### Option B : Manuellement via FTP/FileZilla

1. Connectez-vous à OVH via FTP
2. Naviguez vers `/www/lon/` (ou `/public_html/lon/`)
3. **Uploadez TOUT le contenu** de `deploy-frontend-lon/` dans `/lon/`
4. **Important :** Uploadez aussi le fichier `.htaccess`

#### Option C : Via le Gestionnaire de fichiers OVH

1. Dans le gestionnaire de fichiers OVH
2. Allez dans le dossier `/lon/`
3. Uploadez tous les fichiers de `deploy-frontend-lon/`
4. Assurez-vous que `.htaccess` est bien uploadé

---

### **Étape 4 : Vérifier l'Upload**

1. Ouvrez : `https://www.filmara.fr/lon/`
2. Vérifiez que la page se charge (même si l'API n'est pas encore disponible)
3. Appuyez sur **F12** → **Console**
4. Vous verrez peut-être des erreurs API (normal, api-3 n'est pas encore déployé)

**✅ Le frontend est prêt ! Il attendra que le backend soit disponible.**

---

## 🔍 Séparation des Fichiers - Checklist

### ✅ **Frontend - Déjà Séparé**

| Élément | Arras | Longuenesse | Séparation |
|---------|-------|-------------|------------|
| **Dossier OVH** | `/www/plan/` | `/www/lon/` | ✅ Séparé |
| **Base Path** | `/plan/` | `/lon/` | ✅ Séparé |
| **API URL** | `api-4-pbfy.onrender.com` | `api-3.onrender.com` | ✅ Séparé |
| **Build Output** | `deploy-frontend/` | `deploy-frontend-lon/` | ✅ Séparé |

### ✅ **Backend - Déjà Séparé**

| Élément | Arras | Longuenesse | Séparation |
|---------|-------|-------------|------------|
| **Service Render** | `api-4-pbfy` | `api-3` | ✅ Séparé |
| **Base MongoDB** | `boulangerie-planning` | `boulangerie-planning-longuenesse` | ✅ Séparé |
| **JWT Secret** | Clé Arras | Clé Longuenesse | ✅ Séparé |
| **SFTP Path** | `/n8n/uploads/documents` | `/n8n/uploads/documents-longuenesse` | ✅ Séparé |
| **EmailJS Service** | Service Arras | Service Longuenesse | ✅ Séparé |
| **Store Name** | `Boulangerie Ange - Arras` | `Boulangerie Ange - Longuenesse` | ✅ Séparé |

### ✅ **NAS - Déjà Séparé**

| Élément | Arras | Longuenesse | Séparation |
|---------|-------|-------------|------------|
| **Répertoire** | `/n8n/uploads/documents/` | `/n8n/uploads/documents-longuenesse/` | ✅ Séparé |
| **Structure** | `2025/pending/...` | `2025/pending/...` | ✅ Séparé |

---

## 📝 Fichiers à Vérifier (Séparation)

### **Frontend - Fichiers HTML Standalone**

Ces fichiers dans `frontend/public/` doivent être vérifiés s'ils contiennent des URLs hardcodées :

- [ ] `daily-sales-entry.html` → Utilise `VITE_API_URL` ou hardcodé ?
- [ ] `employee-dashboard.html` → Utilise `VITE_API_URL` ou hardcodé ?
- [ ] `sick-leave-standalone.html` → Utilise `VITE_API_URL` ou hardcodé ?
- [ ] `vacation-request-standalone.html` → Utilise `VITE_API_URL` ou hardcodé ?
- [ ] `admin-documents.html` → Utilise `VITE_API_URL` ou hardcodé ?

**Note :** Ces fichiers sont dans `frontend/public/` et seront copiés lors du build. Si ils ont des URLs hardcodées vers `api-4-pbfy`, ils pointeront vers `api-3` grâce à la variable `VITE_API_URL` définie dans le script de build.

---

## 🔧 Configuration du Script de Build

Le script `deploy-frontend-lon-ovh.bat` configure déjà :

```batch
set VITE_API_URL=https://boulangerie-planning-api-3.onrender.com/api
call npm run build -- --base=/lon/
```

**Cela garantit :**
- ✅ Tous les appels API pointent vers `api-3`
- ✅ Tous les chemins sont configurés pour `/lon/`
- ✅ Séparation complète avec Arras

---

## ⚠️ Points d'Attention

### 1. **Fichiers HTML Standalone**

Les fichiers HTML dans `frontend/public/` qui ont des URLs hardcodées :
- **Solution :** Le script de build définit `VITE_API_URL` qui sera utilisé
- **Vérification :** Après le build, vérifiez que les fichiers pointent vers `api-3`

### 2. **Variables d'Environnement**

Le frontend utilise `import.meta.env.VITE_API_URL` :
- **Arras :** Utilise la valeur par défaut `api-4-pbfy`
- **Longuenesse :** Le script définit `VITE_API_URL=api-3` lors du build

### 3. **Base Path**

- **Arras :** `base: '/plan/'` dans `vite.config.js`
- **Longuenesse :** `--base=/lon/` dans le script de build (surcharge)

---

## ✅ Checklist Avant Upload

- [ ] Script `deploy-frontend-lon-ovh.bat` exécuté avec succès
- [ ] Dossier `deploy-frontend-lon/` créé
- [ ] Fichier `.htaccess` présent dans `deploy-frontend-lon/`
- [ ] Dossier `/lon/` créé sur OVH
- [ ] Tous les fichiers uploadés dans `/lon/`
- [ ] `.htaccess` uploadé dans `/lon/`
- [ ] Site accessible : `https://www.filmara.fr/lon/`

---

## 🎯 Résultat Attendu

Après l'upload :

1. **Frontend accessible :** `https://www.filmara.fr/lon/`
2. **Page se charge** (même si l'API n'est pas encore disponible)
3. **Console navigateur :** Erreurs API normales (api-3 pas encore déployé)
4. **Quand api-3 sera déployé :** Tout fonctionnera automatiquement

---

## 📞 Prochaines Étapes (Quand Render sera Disponible)

1. **Déployer api-3** dans Render (Manual Deploy)
2. **Vérifier les logs** Render
3. **Tester l'API** : `https://boulangerie-planning-api-3.onrender.com/api/health`
4. **Tester le frontend** : `https://www.filmara.fr/lon/`
5. **Créer le premier compte admin** pour Longuenesse

---

**Le frontend peut être uploadé maintenant et attendra que le backend soit disponible !** 🎉





