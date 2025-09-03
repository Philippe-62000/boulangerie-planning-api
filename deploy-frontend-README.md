# 🚀 Déploiement Frontend OVH

## 📋 Prérequis

- **Node.js** installé sur votre machine
- **FileZilla** ou autre client FTP
- **Accès FTP** à votre hébergement OVH

## 🔧 Étapes de déploiement

### 1. **Construction du build**
```bash
# Double-cliquer sur deploy-frontend.bat
# Ou exécuter manuellement :
cd frontend
npm install
npm run build
```

### 2. **Préparation des fichiers**
Le script crée automatiquement le dossier `deploy-ovh\` contenant :
- Tous les fichiers optimisés
- Le fichier `.htaccess` pour le routage
- Les assets minifiés et compressés

### 3. **Upload via FileZilla**

#### **Connexion :**
- **Hôte :** ftp.votre-domaine.com (ou IP du serveur)
- **Nom d'utilisateur :** votre_identifiant_ovh
- **Mot de passe :** votre_mot_de_passe_ovh
- **Port :** 21 (par défaut)

#### **Navigation :**
1. **Côté local :** Naviguer vers `deploy-ovh\`
2. **Côté serveur :** Aller dans `www/` ou `public_html/`

#### **Upload :**
1. **Sélectionner** tous les fichiers de `deploy-ovh\`
2. **Glisser-déposer** vers le serveur
3. **Remplacer** tous les fichiers existants

## ⚠️ **Points d'attention**

### **Sauvegarde obligatoire :**
- **AVANT** le déploiement, sauvegardez votre site actuel
- Utilisez la fonction "Sauvegarde" d'OVH si disponible

### **Vérifications post-déploiement :**
- [ ] Le site se charge correctement
- [ ] Toutes les pages sont accessibles
- [ ] Les images et CSS se chargent
- [ ] Le routage fonctionne (navigation entre pages)

### **En cas de problème :**
1. **Vérifier** les permissions des fichiers (644 pour fichiers, 755 pour dossiers)
2. **Contrôler** que `.htaccess` est bien uploadé
3. **Tester** avec un navigateur en mode incognito
4. **Vérifier** les logs d'erreur d'OVH

## 🎯 **Structure des fichiers déployés**

```
www/
├── index.html          # Page principale
├── .htaccess          # Configuration Apache
├── static/
│   ├── css/           # Styles minifiés
│   ├── js/            # JavaScript optimisé
│   └── media/         # Images et assets
└── favicon.ico        # Icône du site
```

## 🔄 **Mise à jour future**

Pour les prochaines mises à jour :
1. Exécuter `deploy-frontend.bat`
2. Uploader le contenu de `deploy-ovh\`
3. Remplacer tous les fichiers

## 📞 **Support**

En cas de problème :
- **Logs OVH :** Espace client OVH > Hébergement > Logs
- **Documentation :** https://docs.ovh.com/fr/hosting/
- **Support :** Support OVH via l'espace client

