# ✅ Solution Erreur 403 sur /advance-requests

## 🔍 Diagnostic

Le problème n'est **PAS** une confusion entre deux pages. Il n'y a qu'**une seule page** :
- `/advance-requests` dans le menu flottant (Sidebar) ✅
- Le bouton dans Employees.js a bien été retiré ✅

Le problème est que **le frontend sur OVH n'a pas été mis à jour** avec le nouveau code de `Login.js`.

## 📋 État Actuel

### ✅ Code Local (Modifié)
- `Login.js` : Appelle `/api/auth/admin-login` et stocke le token
- `api.js` : Intercepteur pour ajouter le token automatiquement
- Backend : Route `/api/auth/admin-login` créée et déployée sur Render

### ❌ Frontend OVH (Pas à jour)
- L'ancien `Login.js` est toujours actif sur OVH
- L'ancien code ne génère pas de token JWT
- Résultat : Erreur 403 car aucun token n'est envoyé

## 🚀 Solution - 2 Étapes

### Étape 1 : Redéployer le Frontend sur OVH

**Option A : Script automatique (Recommandé)**
```bash
.\deploy-plan-ovh.bat
```

**Option B : Manuellement**
```bash
cd frontend
npm run build
cd ..
# Puis uploader le contenu de deploy-ovh/ sur OVH dans /plan/
```

### Étape 2 : Se Déconnecter et Se Reconnecter

**IMPORTANT** : Après le déploiement, vous DEVEZ :

1. **Se déconnecter** de l'application
2. **Vider le cache du navigateur** (Ctrl+Shift+Delete) ou ouvrir en navigation privée
3. **Se reconnecter** avec le mot de passe `admin2024`

Le nouveau code va maintenant :
- Appeler `/api/auth/admin-login`
- Récupérer un token JWT
- Le stocker dans `localStorage`
- L'ajouter automatiquement à toutes les requêtes API

## 🔍 Vérification

Après le redéploiement et la reconnexion, vérifiez dans la console du navigateur :

```javascript
// Doit retourner un token (pas null)
console.log('Token:', localStorage.getItem('token'));

// Test manuel de l'API
fetch('https://boulangerie-planning-api-4-pbfy.onrender.com/api/advance-requests', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
}).then(r => r.json()).then(console.log);
```

Si le test manuel fonctionne mais pas l'app, c'est un problème d'intercepteur. Si aucun des deux ne fonctionne, le token n'est pas valide.

## 📝 Checklist

- [ ] Frontend rebuild et déployé sur OVH
- [ ] Cache du navigateur vidé
- [ ] Déconnexion effectuée
- [ ] Reconnexion avec `admin2024`
- [ ] Token présent dans `localStorage.getItem('token')`
- [ ] Page `/advance-requests` accessible sans erreur 403

## ⚠️ Note Importante

**Ne pas oublier** : Le backend Render a déjà été mis à jour (après le push), mais le **frontend OVH doit être rebuild et redéployé** pour que les changements de `Login.js` soient actifs.

Le code est prêt et commité, il ne reste plus qu'à le déployer ! 🚀

