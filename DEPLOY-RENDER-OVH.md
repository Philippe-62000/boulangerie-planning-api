# 🚀 Guide de Déploiement Render + OVH

## 📋 **Architecture recommandée**

```
Frontend (OVH Gratuit) ←→ API (Render) ←→ MongoDB Atlas
```

## 🔧 **Étape 1 : Déploiement Backend sur Render**

### 1.1 **Préparer le code**
```bash
# Créer un nouveau repository pour l'API
mkdir boulangerie-api
cd boulangerie-api

# Copier les fichiers du backend
cp -r deploy/api/* .
```

### 1.2 **Créer le repository Git**
```bash
git init
git add .
git commit -m "Initial commit - API Boulangerie Planning"
git branch -M main
git remote add origin https://github.com/votre-username/boulangerie-api.git
git push -u origin main
```

### 1.3 **Déployer sur Render**

1. **Allez sur [render.com](https://render.com)**
2. **Connectez votre compte GitHub**
3. **Cliquez sur "New Web Service"**
4. **Sélectionnez votre repository `boulangerie-api`**
5. **Configuration :**
   - **Name :** `boulangerie-planning-api`
   - **Environment :** `Node`
   - **Build Command :** `npm install`
   - **Start Command :** `node server.js`
   - **Plan :** `Free`

### 1.4 **Variables d'environnement Render**

Dans les paramètres de votre service Render, ajoutez :

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://phimjc:ZDOPZA2Kd8ylewoR@cluster0.4huietv.mongodb.net/boulangerie-planning?retryWrites=true&w=majority
JWT_SECRET=votre-secret-jwt-super-securise
CORS_ORIGIN=https://votre-domaine-ovh.com
```

### 1.5 **Vérifier le déploiement**

Votre API sera disponible sur : `https://boulangerie-planning-api.onrender.com`

Testez : `https://boulangerie-planning-api.onrender.com/health`

## 🌐 **Étape 2 : Configuration Frontend OVH**

### 2.1 **Mettre à jour la configuration**

Dans `deploy/www/config.js`, remplacez l'URL de l'API :

```javascript
API_URL: 'https://boulangerie-planning-api.onrender.com/api',
```

### 2.2 **Déployer sur OVH**

1. **Connectez-vous à votre espace client OVH**
2. **Allez dans "Hébergement Web" > votre-hébergement**
3. **Cliquez sur "FTP - SSH"**
4. **Connectez-vous via FTP**
5. **Uploadez le contenu du dossier `deploy/www/` dans le dossier `www/`**

### 2.3 **Vérifier les fichiers**

Assurez-vous que ces fichiers sont présents :
```
www/
├── index.html
├── config.js
├── .htaccess
└── static/
    ├── js/main.98512f67.js
    └── css/main.bda8b6f7.css
```

## 🔍 **Étape 3 : Tests et vérifications**

### 3.1 **Test de l'API**
```bash
curl https://boulangerie-planning-api.onrender.com/health
```

### 3.2 **Test du frontend**
1. Ouvrez votre site OVH
2. Appuyez sur F12 (outils de développement)
3. Vérifiez la console pour les erreurs
4. Testez : `console.log(window.APP_CONFIG)`

### 3.3 **Test de connectivité**
Dans la console du navigateur :
```javascript
fetch('https://boulangerie-planning-api.onrender.com/api/employees')
  .then(response => response.json())
  .then(data => console.log('API OK:', data))
  .catch(error => console.error('API Error:', error));
```

## 🛠️ **Étape 4 : Intégration n8n (Optionnel)**

### 4.1 **Workflows n8n utiles**

Créer des workflows pour :
- **Synchronisation des données** entre systèmes
- **Notifications automatiques** (email, SMS)
- **Rapports quotidiens** de planning
- **Sauvegarde automatique** des données

### 4.2 **Exemple de workflow**

```json
{
  "nodes": [
    {
      "name": "Trigger quotidien",
      "type": "cron",
      "parameters": {
        "rule": "0 6 * * *"
      }
    },
    {
      "name": "Récupérer planning",
      "type": "httpRequest",
      "parameters": {
        "url": "https://boulangerie-planning-api.onrender.com/api/planning/today"
      }
    },
    {
      "name": "Envoyer notification",
      "type": "email",
      "parameters": {
        "to": "manager@boulangerie.com",
        "subject": "Planning du jour",
        "body": "{{ $json }}"
      }
    }
  ]
}
```

## 🔧 **Dépannage**

### **Problème : API ne répond pas**
1. Vérifiez les logs Render
2. Vérifiez les variables d'environnement
3. Testez la connexion MongoDB

### **Problème : CORS**
1. Vérifiez `CORS_ORIGIN` dans Render
2. Ajoutez votre domaine OVH dans la liste

### **Problème : Frontend blanc**
1. Vérifiez que `config.js` est chargé
2. Vérifiez les erreurs dans la console
3. Testez l'accès direct aux fichiers statiques

## 📊 **Monitoring**

### **Render Dashboard**
- Logs en temps réel
- Métriques de performance
- Alertes automatiques

### **MongoDB Atlas**
- Monitoring de la base de données
- Alertes de performance
- Sauvegardes automatiques

## 💰 **Coûts estimés**

- **OVH Hébergement Web Gratuit :** 0€/mois
- **Render Free Tier :** 0€/mois (750h/mois)
- **MongoDB Atlas Free :** 0€/mois (512MB)
- **n8n Self-hosted :** 0€/mois

**Total : 0€/mois** 🎉

## 🚀 **Prochaines étapes**

1. **Déployez l'API sur Render**
2. **Mettez à jour la config frontend**
3. **Testez la connectivité**
4. **Configurez n8n si nécessaire**
5. **Monitorer les performances**
