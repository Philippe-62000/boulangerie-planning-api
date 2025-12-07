# 📁 Où Trouver les Fichiers à Uploader sur OVH

## 📍 Emplacement des Fichiers

### **Après avoir exécuté le script de build :**

Les fichiers se trouvent dans :
```
C:\boulangerie-planning\deploy-frontend-lon\
```

---

## 🚀 Étapes Complètes

### **Étape 1 : Build le Frontend**

1. Ouvrez un terminal dans `C:\boulangerie-planning`
2. Exécutez :
   ```batch
   deploy-frontend-lon-ovh.bat
   ```
3. Attendez que le script se termine

### **Étape 2 : Localiser les Fichiers**

Après le build, les fichiers sont dans :
```
C:\boulangerie-planning\deploy-frontend-lon\
```

**Contenu du dossier :**
- `index.html`
- `.htaccess`
- `static/` (dossier avec JS, CSS, images)
  - `static/js/` (fichiers JavaScript)
  - `static/css/` (fichiers CSS)
  - `static/media/` (images, etc.)

---

## 📂 Structure du Dossier `deploy-frontend-lon/`

```
deploy-frontend-lon/
├── index.html
├── .htaccess
├── static/
│   ├── js/
│   │   ├── [name].[hash].js
│   │   └── ...
│   ├── css/
│   │   ├── [name].[hash].css
│   │   └── ...
│   └── media/
│       └── ...
└── (autres fichiers si présents)
```

---

## 🔍 Comment Vérifier que les Fichiers sont Prêts

### **Méthode 1 : Explorateur Windows**

1. Ouvrez l'**Explorateur de fichiers Windows**
2. Allez dans : `C:\boulangerie-planning\`
3. Cherchez le dossier `deploy-frontend-lon`
4. Ouvrez-le et vérifiez qu'il contient :
   - ✅ `index.html`
   - ✅ `.htaccess`
   - ✅ Dossier `static/`

### **Méthode 2 : Ligne de Commande**

```batch
cd C:\boulangerie-planning
dir deploy-frontend-lon
```

Vous devriez voir :
```
deploy-frontend-lon
├── index.html
├── .htaccess
└── static/
```

---

## 📤 Upload sur OVH

### **Option A : Via FileZilla (Recommandé)**

1. **Téléchargez FileZilla** si vous ne l'avez pas : [https://filezilla-project.org/](https://filezilla-project.org/)

2. **Connectez-vous à OVH :**
   - **Hôte :** `ftp.cluster029.hosting.ovh.net`
   - **Nom d'utilisateur :** (votre identifiant OVH)
   - **Mot de passe :** (votre mot de passe OVH)
   - **Port :** `21`

3. **Naviguez vers le dossier `/www/lon/`** (ou `/public_html/lon/`)

4. **Sélectionnez TOUT le contenu** de `C:\boulangerie-planning\deploy-frontend-lon\`

5. **Glissez-déposez** dans FileZilla vers `/www/lon/`

6. **Vérifiez** que tous les fichiers sont uploadés, y compris `.htaccess`

---

### **Option B : Via le Gestionnaire de Fichiers OVH**

1. **Connectez-vous** à votre espace OVH
2. Allez dans **Gestionnaire de fichiers** (File Manager)
3. Naviguez vers `www/` (ou `public_html/`)
4. **Créez le dossier `lon`** s'il n'existe pas
5. Allez dans le dossier `lon/`
6. Cliquez sur **Upload**
7. **Sélectionnez TOUS les fichiers** de `C:\boulangerie-planning\deploy-frontend-lon\`
8. **Important :** Uploadez aussi le fichier `.htaccess` (il peut être caché, activez "Afficher les fichiers cachés")

---

### **Option C : Via le Script (si le partage réseau fonctionne)**

Si vous avez accès au partage réseau OVH :

```batch
upload-deploy-frontend-lon-ovh.bat
```

**Note :** Cette méthode nécessite que le partage réseau `\\ftp.cluster029.hosting.ovh.net\www\lon` soit accessible.

---

## ✅ Vérification Après Upload

### **1. Vérifier les Fichiers sur OVH**

Dans le gestionnaire de fichiers OVH, vérifiez que `/www/lon/` contient :
- ✅ `index.html`
- ✅ `.htaccess`
- ✅ Dossier `static/` avec sous-dossiers `js/`, `css/`, `media/`

### **2. Tester le Site**

1. Ouvrez votre navigateur
2. Allez sur : `https://www.filmara.fr/lon/`
3. Vérifiez que la page se charge
4. Appuyez sur **F12** → **Console**
5. Vous verrez peut-être des erreurs API (normal, api-3 n'est pas encore déployé)

---

## 🎯 Résumé Rapide

1. **Exécutez :** `deploy-frontend-lon-ovh.bat`
2. **Fichiers dans :** `C:\boulangerie-planning\deploy-frontend-lon\`
3. **Uploadez TOUT** dans `/www/lon/` sur OVH
4. **Testez :** `https://www.filmara.fr/lon/`

---

## 📝 Checklist

- [ ] Script `deploy-frontend-lon-ovh.bat` exécuté
- [ ] Dossier `deploy-frontend-lon/` créé dans `C:\boulangerie-planning\`
- [ ] Fichiers vérifiés : `index.html`, `.htaccess`, `static/`
- [ ] Dossier `/lon/` créé sur OVH
- [ ] Tous les fichiers uploadés dans `/lon/`
- [ ] `.htaccess` uploadé (fichier caché)
- [ ] Site accessible : `https://www.filmara.fr/lon/`

---

**Les fichiers sont dans `C:\boulangerie-planning\deploy-frontend-lon\` après le build !** 🎉













