# Upload automatique vers OVH via SFTP

Ce script utilise le module `ssh2-sftp-client` (de liximomo) pour automatiser l'upload de votre application vers OVH.

## 🚀 Utilisation rapide

1. **Configurez vos paramètres OVH** dans `ovh-config.js`
2. **Exécutez le script** : `upload-to-ovh.bat`

## 📋 Configuration requise

### 1. Modifiez `ovh-config.js`

```javascript
module.exports = {
  host: 'ftp.cluster123.hosting.ovh.net', // Votre serveur OVH
  port: 22,
  username: 'votre-username', // Votre nom d'utilisateur OVH
  password: 'votre-password', // Votre mot de passe OVH
  
  remotePaths: {
    frontend: '/www',      // Dossier racine pour le frontend
    backend: '/www/api'    // Dossier pour l'API
  }
};
```

### 2. Paramètres OVH à récupérer

- **Host** : Dans votre espace client OVH → Hébergement → Informations de connexion
- **Username** : Votre nom d'utilisateur FTP
- **Password** : Votre mot de passe FTP
- **Port** : Généralement 22 pour SFTP

## 🔧 Installation et utilisation

### Méthode automatique (recommandée)
```bash
upload-to-ovh.bat
```

### Méthode manuelle
```bash
# Installer le module SFTP
npm install ssh2-sftp-client

# Lancer l'upload
node upload-to-ovh.js
```

## 📁 Structure des fichiers uploadés

Le script uploadera automatiquement :

- **Frontend** : `deploy/www/` → `/www/` sur OVH
- **Backend** : `deploy/api/` → `/www/api/` sur OVH

## 🔒 Sécurité

- Le fichier `ovh-config.js` contient vos identifiants
- **Ne committez jamais ce fichier** dans Git
- Ajoutez `ovh-config.js` à votre `.gitignore`

## ⚠️ Prérequis

1. **Build terminé** : Exécutez d'abord `build-for-ovh.bat`
2. **Dossier deploy** : Doit exister avec les fichiers prêts
3. **Paramètres OVH** : Configurés dans `ovh-config.js`

## 🐛 Dépannage

### Erreur de connexion
- Vérifiez vos identifiants OVH
- Assurez-vous que SFTP est activé sur votre hébergement

### Erreur de chemin
- Vérifiez que le dossier `deploy` existe
- Exécutez d'abord `build-for-ovh.bat`

### Erreur de permissions
- Vérifiez les permissions sur votre espace OVH
- Contactez le support OVH si nécessaire

## 📞 Support

En cas de problème :
1. Vérifiez les logs d'erreur
2. Testez la connexion avec un client FTP classique
3. Contactez le support OVH pour vérifier vos paramètres SFTP
