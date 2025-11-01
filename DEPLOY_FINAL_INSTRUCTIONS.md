# ✅ Déploiement Frontend - Instructions Finales

## 📁 Fichiers Prêts

Le dossier `deploy-ovh/` contient maintenant tous les fichiers nécessaires :
- ✅ `index.html` (avec le nouveau code React)
- ✅ `static/` (JS, CSS, médias avec le nouveau `Login.js`)
- ✅ `.htaccess` (configuration pour `/plan/`)

## 🚀 Étape 1 : Uploader sur OVH

1. **Connectez-vous** à votre espace OVH
2. **Allez dans le gestionnaire de fichiers**
3. **Naviguez vers** : `/plan/` (dossier principal de votre site)
4. **Sélectionnez TOUS les fichiers** du dossier `deploy-ovh/`
5. **Uploadez-les** et **remplacez** tous les fichiers existants

## 🔄 Étape 2 : Vider le Cache et Se Reconnecter

**IMPORTANT** : Après l'upload, vous DEVEZ :

1. **Ouvrir une fenêtre de navigation privée** (Ctrl+Shift+N)
   - OU vider le cache : Ctrl+Shift+Delete → Cocher "Images et fichiers en cache"
   
2. **Aller sur** : `https://www.filmara.fr/plan/`

3. **Se connecter** avec le mot de passe `admin2024`
   - Le nouveau code va appeler `/api/auth/admin-login`
   - Un token JWT sera stocké dans `localStorage`

## 🧪 Étape 3 : Vérification

Dans la console du navigateur (F12), tapez :

```javascript
// 1. Vérifier le token
localStorage.getItem('token')  // Doit retourner un token (pas null)

// 2. Aller sur la page /advance-requests
// Elle devrait se charger sans erreur 403
```

## 🔍 Si l'Erreur Persiste

Vérifiez dans l'onglet **Network** du navigateur :

1. Cliquez sur la requête `advance-requests`
2. Allez dans l'onglet **Headers**
3. Cherchez `Authorization: Bearer ...`

**Si cette ligne n'existe pas** :
- Le token n'est pas envoyé
- Vérifiez que `localStorage.getItem('token')` retourne bien un token
- Si `null`, déconnectez-vous et reconnectez-vous

**Si cette ligne existe mais erreur 403** :
- Le token est invalide ou expiré
- Déconnectez-vous et reconnectez-vous pour obtenir un nouveau token

## ✅ Résultat Attendu

Après le déploiement et la reconnexion :
- ✅ Token stocké dans `localStorage`
- ✅ Page `/advance-requests` accessible sans erreur 403
- ✅ Les demandes d'acompte s'affichent correctement

---

**Le dossier `deploy-ovh/` est prêt ! Uploadez-le sur OVH et reconnectez-vous.** 🚀

