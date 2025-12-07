# 🚀 Guide Upload Immédiat Frontend Longuenesse

## ✅ Oui, vous pouvez uploader MAINTENANT !

Le frontend peut être uploadé sur OVH **indépendamment** du backend Render. Il pointera vers `api-3` qui sera disponible quand les pipeline minutes seront réinitialisées.

---

## 📋 Étapes Immédiates

### **Étape 1 : Build le Frontend**

Exécutez le script :

```batch
deploy-frontend-lon-ovh.bat
```

**Ce script va automatiquement :**
- ✅ Build le frontend avec `base: '/lon/'`
- ✅ Configurer l'API URL vers `api-3.onrender.com`
- ✅ Créer le dossier `deploy-frontend-lon/`
- ✅ Créer le fichier `.htaccess` pour `/lon/`
- ✅ **Remplacer les URLs hardcodées** dans les fichiers HTML (`api-4-pbfy` → `api-3`)

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
2. Vérifiez que la page se charge
3. Appuyez sur **F12** → **Console**
4. Vous verrez peut-être des erreurs API (normal, api-3 n'est pas encore déployé)

**✅ Le frontend est prêt ! Il attendra que le backend soit disponible.**

---

## 🔍 Séparation Complète - Vérification

### ✅ **Tout est Déjà Séparé**

| Élément | Arras | Longuenesse | Suffixe |
|---------|-------|-------------|---------|
| **Dossier OVH** | `/www/plan/` | `/www/lon/` | `-lon` |
| **Base Path** | `/plan/` | `/lon/` | `-lon` |
| **API URL** | `api-4-pbfy` | `api-3` | Différent |
| **Dossier Build** | `deploy-frontend/` | `deploy-frontend-lon/` | `-lon` |
| **Scripts** | `*-ovh.bat` | `*-lon-ovh.bat` | `-lon-ovh` |
| **Base MongoDB** | `boulangerie-planning` | `boulangerie-planning-longuenesse` | `-longuenesse` |
| **SFTP Path** | `/documents/` | `/documents-longuenesse/` | `-longuenesse` |
| **Store Name** | `Boulangerie Ange - Arras` | `Boulangerie Ange - Longuenesse` | `-Longuenesse` |

**✅ Aucun risque de mélange !**

---

## 📝 Checklist Avant Upload

- [ ] Script `deploy-frontend-lon-ovh.bat` exécuté avec succès
- [ ] Dossier `deploy-frontend-lon/` créé
- [ ] Fichier `.htaccess` présent dans `deploy-frontend-lon/`
- [ ] URLs dans les fichiers HTML vérifiées (doivent pointer vers `api-3`)
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











