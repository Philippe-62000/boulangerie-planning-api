# 🔧 Instructions pour Corriger l'Erreur 403

## 🔍 Diagnostic

L'erreur 403 persiste car **le token JWT n'est pas envoyé** dans la requête. Les logs Render ne montrent aucun token.

## ✅ Solution Immédiate

### Étape 1 : Vérifier le Token dans le Navigateur

Ouvrez la **console du navigateur** (F12) et tapez :

```javascript
localStorage.getItem('token')
```

**Si cela retourne `null`** :
- Le token n'a pas été stocké
- Vous devez vous déconnecter et vous reconnecter

### Étape 2 : Vider le Cache et Se Reconnecter

1. **Ouvrir une fenêtre de navigation privée** (Ctrl+Shift+N)
2. **Aller sur** : `https://www.filmara.fr/plan/`
3. **Se connecter** avec le mot de passe `admin2024`
4. Le nouveau code devrait maintenant :
   - Appeler `/api/auth/admin-login`
   - Stocker le token dans `localStorage`

### Étape 3 : Vérifier que le Token est Envoyé

Dans la console, vérifiez que la requête contient le header :

```javascript
// Observer les requêtes réseau
// Dans l'onglet Network, cliquez sur la requête advance-requests
// Vérifiez l'onglet Headers
// Il doit y avoir : Authorization: Bearer eyJhbGc...
```

## 🚨 Si le Token est Toujours Null

Cela signifie que :

1. **Le frontend sur OVH n'a pas été mis à jour** avec le nouveau `Login.js`
   - **Solution** : Uploader le contenu de `deploy-ovh/` sur OVH dans `/plan/`

2. **Ou** le frontend est à jour mais vous utilisez une ancienne session
   - **Solution** : Navigation privée + reconnexion

## 📋 Checklist de Déploiement

### Backend (Render)
- ✅ Route `/api/auth/admin-login` créée
- ✅ Code pushé sur GitHub
- ✅ Render redéployé automatiquement

### Frontend (OVH)
- ✅ Code local modifié (`Login.js` + `api.js`)
- ✅ Frontend rebuild (`deploy-ovh/` créé)
- ❓ **À FAIRE** : Uploader `deploy-ovh/` sur OVH dans `/plan/`

## 🔄 Processus de Déploiement OVH

1. **Connectez-vous à votre espace OVH**
2. **Allez dans le gestionnaire de fichiers**
3. **Naviguez vers** : `/plan/` (ou le dossier de votre site)
4. **Uploadez TOUT le contenu de** `deploy-ovh/`
5. **Remplacez** tous les fichiers existants
6. **Videz le cache** du navigateur ou utilisez la navigation privée
7. **Reconnectez-vous** avec `admin2024`

## 🧪 Test Final

Après le déploiement et la reconnexion :

```javascript
// 1. Vérifier le token
console.log('Token:', localStorage.getItem('token'));

// 2. Tester manuellement l'API
fetch('https://boulangerie-planning-api-4-pbfy.onrender.com/api/advance-requests', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(data => console.log('✅ Succès:', data))
.catch(err => console.error('❌ Erreur:', err));
```

Si ce test fonctionne, la page devrait aussi fonctionner. Si ce test échoue, vérifiez les logs Render pour voir l'erreur exacte.

---

**Note** : Le dossier `deploy-ovh/` est prêt, il ne reste plus qu'à l'uploader sur OVH ! 🚀

