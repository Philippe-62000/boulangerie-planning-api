# 🔍 Debug Token JWT - Erreur 403 sur /advance-requests

## Problème

L'erreur 403 persiste même après les modifications. Cela peut être dû à :

1. **Frontend non redéployé** : Le nouveau code de `Login.js` n'est pas sur OVH
2. **Token non stocké** : L'utilisateur s'est connecté avant les modifications
3. **Token expiré ou invalide** : Le token n'est plus valide

## Solution Immédiate

### Étape 1 : Vérifier le token dans localStorage

Ouvrez la console du navigateur et tapez :

```javascript
localStorage.getItem('token')
localStorage.getItem('adminToken')
```

Si les deux retournent `null`, c'est que le token n'a pas été stocké.

### Étape 2 : Se déconnecter et se reconnecter

1. **Se déconnecter** de l'application
2. **Effacer le localStorage** :
   ```javascript
   localStorage.clear()
   ```
3. **Se reconnecter** avec le mot de passe `admin2024`
4. Le nouveau code devrait maintenant :
   - Appeler `/api/auth/admin-login`
   - Stocker le token dans `localStorage`

### Étape 3 : Vérifier que le token est envoyé

Ouvrez l'onglet **Network** du navigateur :
1. Rechargez la page `/advance-requests`
2. Cliquez sur la requête `advance-requests`
3. Allez dans l'onglet **Headers**
4. Vérifiez qu'il y a une ligne :
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

Si cette ligne n'existe pas, le token n'est pas envoyé.

## Vérification du Code

### Backend (Render)
- ✅ Route `/api/auth/admin-login` créée
- ✅ Génère un token JWT avec rôle `admin`
- ✅ Middleware `authenticateManager` accepte `admin` et `manager`

### Frontend (OVH) - À VÉRIFIER
- ❓ `Login.js` modifié pour appeler `/api/auth/admin-login`
- ❓ Token stocké dans `localStorage`
- ❓ `api.js` avec intercepteur pour ajouter le token

## Actions Requises

1. **Redéployer le frontend sur OVH** avec les nouvelles modifications
2. **Se déconnecter et se reconnecter** après le déploiement
3. **Vérifier les logs Render** pour voir si le token est bien reçu

## Commande de Debug

Dans la console du navigateur, tapez :

```javascript
// Vérifier le token
console.log('Token:', localStorage.getItem('token'));

// Vérifier le user
console.log('User:', localStorage.getItem('userRole'));

// Tester l'API manuellement
fetch('https://boulangerie-planning-api-4-pbfy.onrender.com/api/advance-requests', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
}).then(r => r.json()).then(console.log).catch(console.error);
```

Si la dernière commande fonctionne, c'est que le problème vient de l'intercepteur `api.js`.

