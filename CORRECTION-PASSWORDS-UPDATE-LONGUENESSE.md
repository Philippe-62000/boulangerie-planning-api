# 🔧 Correction du Problème de Mise à Jour des Mots de Passe - Longuenesse

## ❌ Problème Identifié

L'API Longuenesse (`boulangerie-planning-api-3.onrender.com`) retourne une erreur **404** sur l'endpoint `/passwords/update`, ce qui empêche la mise à jour des mots de passe salarié.

**Erreur observée :**
```
boulangerie-planning-api-3.onrender.com/api/passwords/update:1  
Failed to load resource: the server responded with a status of 404
```

## ✅ Solution

Le code backend est correct et contient bien la route `/passwords/update`. Le problème vient du fait que l'API sur Render n'a pas été mise à jour avec le dernier code.

### Étapes pour Corriger

#### 1. Vérifier que le Code est à Jour

Assurez-vous que le code actuel est bien poussé sur le repository :
- La route existe dans `backend/routes/passwords.js` (ligne 6)
- Le contrôleur existe dans `backend/controllers/passwordController.js`
- La route est bien montée dans `backend/server.js` (ligne 128)

#### 2. Redéployer l'API sur Render

1. **Connectez-vous à [Render Dashboard](https://dashboard.render.com)**
2. **Trouvez le service `boulangerie-planning-api-3`**
3. **Allez dans l'onglet "Events" ou "Deploys"**
4. **Cliquez sur "Manual Deploy" → "Deploy latest commit"**
5. **Attendez que le déploiement se termine (2-3 minutes)**

#### 3. Vérifier le Déploiement

Une fois le déploiement terminé, testez l'endpoint :

```bash
# Test de l'endpoint (remplacez YOUR_TOKEN par un token valide)
curl -X PUT https://boulangerie-planning-api-3.onrender.com/api/passwords/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"employee": "test123"}'
```

**Résultat attendu :**
- Si l'utilisateur employee n'existe pas : `{"success": false, "error": "Utilisateur employee non trouvé"}`
- Si l'utilisateur existe : `{"success": true, "message": "Mots de passe mis à jour avec succès: employee"}`

#### 4. Vérifier que l'Utilisateur Employee Existe

Si après le redéploiement, vous obtenez toujours une erreur "Utilisateur employee non trouvé", il faut créer l'utilisateur dans la base de données de Longuenesse.

L'utilisateur employee doit avoir :
- `username: 'salarie'`
- `role: 'employee'`
- `isActive: true`

## 🔍 Vérifications Supplémentaires

### Vérifier les Routes Disponibles

Pour vérifier que la route est bien déployée, vous pouvez tester d'autres endpoints :

```bash
# Test de l'endpoint payslip-passwords (qui fonctionne selon les logs)
curl https://boulangerie-planning-api-3.onrender.com/api/passwords/payslip-passwords \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Si cet endpoint fonctionne mais pas `/update`, cela confirme que le code n'est pas à jour.

### Vérifier les Logs Render

1. Allez dans le service `boulangerie-planning-api-3` sur Render
2. Cliquez sur l'onglet "Logs"
3. Vérifiez qu'il n'y a pas d'erreurs au démarrage
4. Vérifiez que les routes sont bien chargées (cherchez "Routes" dans les logs)

## 📝 Code de la Route

La route est définie dans `backend/routes/passwords.js` :

```javascript
router.put('/update', passwordController.updatePassword);
```

Et montée dans `backend/server.js` :

```javascript
app.use('/api/passwords', require('./routes/passwords'));
```

Donc l'URL complète devrait être : `/api/passwords/update`

## ✅ Après Correction

Une fois le redéploiement effectué :

1. **Testez sur la page** : `https://www.filmara.fr/lon/parameters`
2. **Ouvrez la console (F12)** et vérifiez qu'il n'y a plus d'erreur 404
3. **Essayez de changer le mot de passe salarié**
4. **Vérifiez que la mise à jour fonctionne**

## 🆘 Si le Problème Persiste

Si après le redéploiement le problème persiste :

1. **Vérifiez que le repository est bien connecté** à Render
2. **Vérifiez que la branche utilisée** est bien `main` (ou la bonne branche)
3. **Vérifiez les logs Render** pour voir s'il y a des erreurs de compilation
4. **Vérifiez que toutes les dépendances** sont installées correctement
