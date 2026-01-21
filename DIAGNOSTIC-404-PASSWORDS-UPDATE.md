# 🔍 Diagnostic : Erreur 404 sur /passwords/update après Déploiement

## ✅ Vérifications Effectuées

- ✅ Le code est présent sur la branche `longuenesse`
- ✅ La route `/passwords/update` existe dans `backend/routes/passwords.js`
- ✅ Le contrôleur `updatePassword` est exporté
- ✅ La route est montée dans `backend/server.js`
- ✅ Le déploiement Render a été effectué (commit `0bd6fab`)

## 🔍 Étapes de Diagnostic

### 1. Vérifier les Logs Render

1. Allez sur [Render Dashboard](https://dashboard.render.com)
2. Sélectionnez `boulangerie-planning-api-3`
3. Cliquez sur l'onglet **Logs**
4. Cherchez des erreurs ou des messages importants :

**Cherchez :**
- `✅ Routes chargées` ou messages similaires
- `app.use('/api/passwords'` - confirmation que la route est montée
- Erreurs de compilation ou de démarrage
- Messages de connexion MongoDB

**Si vous voyez des erreurs :** Notez-les et partagez-les.

### 2. Vérifier que le Service est Actif

Le service Render gratuit peut être en mode "sleep" :
- **Free tier** : Le service se met en veille après 15 minutes d'inactivité
- **Première requête** : Peut prendre 50 secondes pour se réveiller
- **Solution** : Attendez 1 minute après le déploiement, puis testez

### 3. Forcer un Redémarrage du Service

Si le service semble bloqué :

1. Dans Render Dashboard → `boulangerie-planning-api-3`
2. Cliquez sur **Manual Deploy** → **Deploy latest commit**
3. Attendez la fin du déploiement
4. Testez à nouveau

### 4. Vérifier les Routes Déployées

Testez d'autres endpoints pour confirmer que le service fonctionne :

```bash
# Test de santé (devrait fonctionner)
curl https://boulangerie-planning-api-3.onrender.com/api/health

# Test de l'endpoint payslip-passwords (devrait fonctionner)
curl https://boulangerie-planning-api-3.onrender.com/api/passwords/payslip-passwords \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Si ces endpoints fonctionnent mais pas `/update` :** Il y a un problème spécifique avec cette route.

### 5. Vérifier le Code Déployé

Dans les logs Render, cherchez des messages qui confirment le chargement des routes :

```
Routes
app.use('/api/passwords'
```

Si vous ne voyez pas ces messages, le code n'a peut-être pas été correctement déployé.

## 🚨 Solutions Possibles

### Solution 1 : Redémarrage Complet

1. **Suspendre le service** (Settings → Suspend Service)
2. **Attendre 30 secondes**
3. **Reprendre le service** (Settings → Resume Service)
4. **Attendre le redémarrage complet**
5. **Tester à nouveau**

### Solution 2 : Vérifier la Branche Render

1. Allez dans **Settings** → **Build & Deploy**
2. Vérifiez que **Branch** est bien `longuenesse`
3. Si ce n'est pas le cas, changez-le et redéployez

### Solution 3 : Vérifier les Variables d'Environnement

1. Allez dans **Environment** → **Environment Variables**
2. Vérifiez que toutes les variables nécessaires sont présentes
3. Vérifiez notamment :
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `CORS_ORIGIN`

### Solution 4 : Vérifier les Dépendances

Dans les logs de build, vérifiez qu'il n'y a pas d'erreurs d'installation :

```
npm install
```

Si vous voyez des erreurs, cela pourrait expliquer pourquoi certaines routes ne fonctionnent pas.

## 📋 Checklist de Diagnostic

- [ ] Logs Render vérifiés (pas d'erreurs)
- [ ] Service actif (pas en mode sleep)
- [ ] Endpoint `/api/health` fonctionne
- [ ] Endpoint `/api/passwords/payslip-passwords` fonctionne
- [ ] Branche Render = `longuenesse`
- [ ] Variables d'environnement correctes
- [ ] Pas d'erreurs dans les logs de build

## 🆘 Si Rien ne Fonctionne

Si après toutes ces vérifications le problème persiste :

1. **Créez un nouveau déploiement** avec un commit vide (pour forcer un rebuild complet)
2. **Vérifiez les logs complets** et partagez-les
3. **Testez avec curl** directement pour voir la réponse exacte du serveur

---

**Prochaine étape :** Vérifiez les logs Render et partagez ce que vous voyez.
