# 🔧 Guide de Dépannage - Déploiement OVH

## 🚨 Problème : Site blanc après déploiement

### ✅ **Solution 1 : Vérification des fichiers**

1. **Vérifiez que tous les fichiers sont présents :**
   ```
   www/
   ├── index.html ✅
   ├── config.js ✅
   ├── .htaccess ✅
   └── static/
       ├── js/main.98512f67.js ✅
       └── css/main.bda8b6f7.css ✅
   ```

2. **Testez l'accès direct aux fichiers :**
   - `https://votre-domaine.com/index.html`
   - `https://votre-domaine.com/static/js/main.98512f67.js`
   - `https://votre-domaine.com/static/css/main.bda8b6f7.css`

### ✅ **Solution 2 : Configuration .htaccess**

Vérifiez que votre fichier `.htaccess` est correct :

```apache
# Configuration pour OVH Hébergement Web
RewriteEngine On

# Redirection API vers le backend (si applicable)
RewriteRule ^api/(.*)$ api/$1 [L]

# Redirection React Router
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Sécurité
<Files ".htaccess">
    Order allow,deny
    Deny from all
</Files>
```

### ✅ **Solution 3 : Console du navigateur**

1. **Ouvrez les outils de développement (F12)**
2. **Vérifiez l'onglet Console pour les erreurs :**
   - Erreurs JavaScript
   - Erreurs de chargement de fichiers
   - Erreurs CORS

3. **Vérifiez l'onglet Network :**
   - Les fichiers sont-ils chargés ?
   - Y a-t-il des erreurs 404 ?

### ✅ **Solution 4 : Configuration OVH**

#### **Pour OVH Hébergement Web mutualisé :**

1. **Vérifiez la version PHP :**
   - Allez dans votre espace client OVH
   - Configuration > Version PHP
   - Utilisez PHP 8.0 ou supérieur

2. **Activez les modules Apache :**
   - `mod_rewrite` doit être activé
   - `mod_headers` pour CORS

3. **Vérifiez les permissions :**
   ```bash
   chmod 644 *.html *.js *.css
   chmod 755 static/
   ```

#### **Pour OVH VPS :**

1. **Vérifiez que Docker fonctionne :**
   ```bash
   docker --version
   docker-compose --version
   ```

2. **Vérifiez les logs :**
   ```bash
   docker-compose logs -f
   ```

3. **Vérifiez les ports :**
   ```bash
   netstat -tlnp | grep :80
   netstat -tlnp | grep :443
   ```

### ✅ **Solution 5 : Test local**

Avant de déployer, testez localement :

```bash
# Dans le dossier deploy/www
python -m http.server 8000
# ou
npx serve .
```

Puis ouvrez `http://localhost:8000`

### ✅ **Solution 6 : Déploiement alternatif**

Si OVH Hébergement Web ne fonctionne pas :

#### **Option A : VPS OVH**
```bash
# Connexion SSH
ssh root@votre-ip-ovh

# Déploiement avec Docker
./deploy-ovh.sh production votre-domaine.com
```

#### **Option B : Services externes**
- **Frontend :** Netlify, Vercel, GitHub Pages
- **Backend :** Render, Railway, Heroku
- **Base de données :** MongoDB Atlas

### 🔍 **Diagnostic avancé**

#### **Test de connectivité API :**
```javascript
// Dans la console du navigateur
fetch('/api/health')
  .then(response => response.json())
  .then(data => console.log('API OK:', data))
  .catch(error => console.error('API Error:', error));
```

#### **Vérification des variables d'environnement :**
```javascript
// Dans la console du navigateur
console.log('Config:', window.APP_CONFIG);
```

### 📞 **Support OVH**

Si le problème persiste :

1. **Contactez le support OVH**
2. **Fournissez les informations :**
   - URL du site
   - Erreurs de la console
   - Logs du serveur
   - Configuration utilisée

### 🚀 **Déploiement recommandé**

Pour une application React + Node.js, nous recommandons :

1. **VPS OVH** avec Docker
2. **Ou séparation frontend/backend :**
   - Frontend sur Netlify/Vercel
   - Backend sur Render/Railway
   - Base de données MongoDB Atlas
