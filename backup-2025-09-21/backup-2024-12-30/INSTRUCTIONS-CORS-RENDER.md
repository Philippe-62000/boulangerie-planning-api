# 🔧 Instructions: Corriger CORS sur Render

## 🚨 **Problème Détecté**
```
Access to XMLHttpRequest at 'https://boulangerie-planning-api-3.onrender.com/api/planning/generate' 
from origin 'https://www.filmara.fr' has been blocked by CORS policy
```

## ✅ **Solution : Variables d'Environnement Render**

### **Étape 1: Accéder à Render Dashboard**
1. Allez sur https://dashboard.render.com/
2. Connectez-vous à votre compte
3. Trouvez le service **"boulangerie-planning-api-3"**
4. Cliquez dessus pour accéder aux paramètres

### **Étape 2: Ajouter Variable CORS_ORIGIN**
1. Dans le service, allez à l'onglet **"Environment"**
2. Cliquez sur **"Add Environment Variable"**
3. Ajoutez cette nouvelle variable :

```
Nom: CORS_ORIGIN
Valeur: https://www.filmara.fr,https://filmara.fr,http://localhost:3000
```

### **Étape 3: Redéployer**
1. Cliquez sur **"Save Changes"**
2. Render va automatiquement redéployer l'API
3. Attendez que le statut redevienne "Live" (environ 2-3 minutes)

### **Étape 4: Vérifier**
Testez que CORS fonctionne :
```bash
curl -H "Origin: https://www.filmara.fr" -I https://boulangerie-planning-api-3.onrender.com/health
```

Vous devriez voir dans les headers :
```
access-control-allow-origin: https://www.filmara.fr
```

## 🔄 **Alternative si pas d'accès Render**

Si vous n'avez pas accès à Render Dashboard, modifiez temporairement le code pour autoriser tous les domaines :

### **Fichier: backend/server.js**
```javascript
// Configuration CORS temporaire (ligne 15-20)
const corsOptions = {
  origin: "*", // ⚠️ TEMPORAIRE - Autoriser tous les domaines
  credentials: true,
  optionsSuccessStatus: 200
};
```

### **Puis déployez :**
```bash
git add backend/server.js
git commit -m "🔧 CORS TEMP: Autoriser tous domaines temporairement"
git push origin main
```

## 🎯 **Résultat Attendu**

Après la correction CORS, votre frontend pourra à nouveau communiquer avec l'API backend sans erreur de sécurité.

**L'erreur "blocked by CORS policy" disparaîtra ! ✅**
