# 🔧 Configuration MongoDB pour OVH

## 📍 Où configurer l'adresse MongoDB

### Option 1 : Variables d'environnement (Recommandé)

Créez un fichier `.env` dans le dossier `backend/` avec le contenu suivant :

```env
# Configuration MongoDB Atlas (gratuit)
MONGODB_URI=mongodb+srv://votre-utilisateur:votre-mot-de-passe@votre-cluster.mongodb.net/boulangerie-planning?retryWrites=true&w=majority

# Configuration de l'environnement
NODE_ENV=production
PORT=5000

# Clé secrète pour JWT
JWT_SECRET=votre-cle-secrete-tres-longue-et-complexe

# Configuration CORS
CORS_ORIGIN=https://votre-domaine.com
```

### Option 2 : Modification directe du fichier config.js

Modifiez le fichier `backend/config.js` ligne 7 :

```javascript
MONGODB_URI: process.env.MONGODB_URI || 'votre-uri-mongodb-ici',
```

## 🚀 Configuration MongoDB Atlas (Gratuit)

### Étape 1 : Créer un compte MongoDB Atlas
1. Allez sur [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Créez un compte gratuit
3. Créez un nouveau cluster (gratuit)

### Étape 2 : Configurer la base de données
1. Dans votre cluster, cliquez sur "Connect"
2. Choisissez "Connect your application"
3. Créez un utilisateur avec mot de passe
4. Copiez l'URI de connexion

### Étape 3 : Configurer l'accès réseau
1. Dans "Network Access", ajoutez votre IP
2. Ou autorisez l'accès depuis partout : `0.0.0.0/0`

### Étape 4 : Récupérer l'URI
L'URI ressemble à :
```
mongodb+srv://votre-utilisateur:votre-mot-de-passe@cluster0.xxxxx.mongodb.net/boulangerie-planning?retryWrites=true&w=majority
```

## 🔧 Configuration pour OVH

### Pour l'hébergement web OVH
1. Modifiez le fichier `backend/config.js` directement
2. Remplacez l'URI MongoDB par votre URI Atlas
3. Uploadez le fichier modifié

### Pour le VPS OVH
1. Créez un fichier `.env` sur le serveur
2. Ajoutez vos variables d'environnement
3. Redémarrez l'application

## ✅ Test de connexion

Pour tester la connexion, vous pouvez ajouter ce code dans `server.js` :

```javascript
mongoose.connect(config.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connecté à MongoDB'))
.catch(err => console.error('❌ Erreur de connexion MongoDB:', err));
```

## 🔒 Sécurité

- Ne partagez jamais vos identifiants MongoDB
- Utilisez des mots de passe forts
- Limitez l'accès réseau si possible
- Changez la clé JWT_SECRET en production


