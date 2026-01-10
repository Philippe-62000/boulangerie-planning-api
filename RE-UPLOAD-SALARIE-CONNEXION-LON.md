# 🔄 Re-Upload salarie-connexion.html pour Longuenesse

## ❌ Problème

La page `/lon/salarie-connexion.html` sur OVH redirige encore vers `/plan/employee-dashboard.html` au lieu de `/lon/employee-dashboard.html`.

**Cause :** Le fichier corrigé n'a pas été uploadé sur OVH, ou un ancien fichier est encore en cache.

---

## ✅ Solution : Re-Uploader le Fichier Corrigé

### Option 1 : Upload Manuel (Rapide)

1. **Ouvrez le fichier** : `deploy-frontend-lon/salarie-connexion.html`
2. **Vérifiez** que les lignes 460 et 621 contiennent :
   ```javascript
   window.location.href = '/lon/employee-dashboard.html';
   ```
   (et **PAS** `/plan/employee-dashboard.html`)

3. **Connectez-vous à OVH** (via FTP/SFTP ou FileZilla)
4. **Allez dans le dossier** `/lon/` sur OVH
5. **Uploader le fichier** `salarie-connexion.html` depuis `deploy-frontend-lon/` vers `/lon/` sur OVH
6. **Écrasez** l'ancien fichier si demandé

### Option 2 : Utiliser le Script de Build (Complet)

Si vous avez le script `deploy-frontend-lon-ovh.bat` :

1. **Exécutez le script** :
   ```batch
   deploy-frontend-lon-ovh.bat
   ```
2. **Le script va** :
   - Rebuild le frontend avec les bonnes URLs
   - Créer le dossier `deploy-frontend-lon/` avec tous les fichiers corrigés
   - Remplacer les URLs `api-4-pbfy` par `api-3` dans les fichiers HTML
3. **Uploader ensuite** tout le contenu de `deploy-frontend-lon/` vers `/lon/` sur OVH

---

## 🔍 Vérification Après Upload

### 1. Vérifier le Fichier sur OVH

**Option A : Via FTP/SFTP**
- Ouvrez `/lon/salarie-connexion.html` sur OVH
- Cherchez les lignes contenant `window.location.href`
- Vérifiez qu'elles contiennent `/lon/employee-dashboard.html` (pas `/plan/`)

**Option B : Via le Navigateur**
- Allez sur `https://www.filmara.fr/lon/salarie-connexion.html`
- Ouvrez les outils de développement (F12)
- Allez dans l'onglet "Sources" ou "Network"
- Cherchez `salarie-connexion.html` dans les fichiers chargés
- Vérifiez le contenu (cherchez `/lon/employee-dashboard.html`)

### 2. Tester la Connexion

1. **Allez sur** `https://www.filmara.fr/lon/salarie-connexion.html`
2. **Connectez-vous** avec un compte salarié
3. **Vérifiez la redirection** :
   - ✅ Doit rediriger vers `/lon/employee-dashboard.html`
   - ❌ Ne doit **PAS** rediriger vers `/plan/employee-dashboard.html`

### 3. Vider le Cache (si nécessaire)

Si la redirection ne fonctionne toujours pas après l'upload :

1. **Videz le cache du navigateur** :
   - Chrome/Edge : `Ctrl + Shift + Delete` → Cochez "Images et fichiers en cache" → Effacer
   - Ou : `Ctrl + F5` pour forcer le rechargement

2. **Testez en navigation privée** :
   - Ouvrez une fenêtre de navigation privée
   - Allez sur `https://www.filmara.fr/lon/salarie-connexion.html`
   - Connectez-vous et vérifiez la redirection

---

## 📋 Checklist

- [ ] Fichier `deploy-frontend-lon/salarie-connexion.html` vérifié (contient `/lon/employee-dashboard.html`)
- [ ] Fichier uploadé sur OVH dans `/lon/`
- [ ] Ancien fichier écrasé
- [ ] Cache du navigateur vidé (si nécessaire)
- [ ] Test de connexion effectué
- [ ] Redirection vers `/lon/employee-dashboard.html` confirmée

---

## 🆘 Si le Problème Persiste

### Si la redirection va toujours vers `/plan/` :

1. **Vérifiez que le bon fichier est uploadé** :
   - Le fichier sur OVH doit avoir la même taille que celui dans `deploy-frontend-lon/`
   - Comparez les dates de modification

2. **Vérifiez qu'il n'y a pas de cache serveur** :
   - OVH peut mettre en cache les fichiers HTML
   - Attendez quelques minutes et réessayez
   - Ou contactez le support OVH pour vider le cache

3. **Vérifiez qu'il n'y a pas de redirection .htaccess** :
   - Vérifiez le fichier `.htaccess` dans `/lon/`
   - Il ne doit **PAS** contenir de redirection vers `/plan/`

4. **Vérifiez la console du navigateur** :
   - Ouvrez les outils de développement (F12)
   - Allez dans l'onglet "Console"
   - Regardez s'il y a des erreurs JavaScript
   - Regardez les logs pour voir quelle URL est utilisée

---

## 📝 Notes

- Le fichier local `deploy-frontend-lon/salarie-connexion.html` est **déjà corrigé**
- Il faut juste **re-uploader** ce fichier sur OVH
- Le fichier utilise l'API Longuenesse (`api-3`) et redirige vers `/lon/employee-dashboard.html`
