# 🚨 URGENT : Redéployer l'API Longuenesse pour Corriger /passwords/update

## ❌ Problème Actuel

L'API Longuenesse (`boulangerie-planning-api-3.onrender.com`) retourne **404** sur `/passwords/update` car elle n'a pas été redéployée avec le dernier code.

**Erreur :**
```
PUT https://boulangerie-planning-api-3.onrender.com/api/passwords/update 404 (Not Found)
```

## ✅ Solution : Redéploiement Manuel sur Render

### Étape 1 : Vérifier que le Code est sur GitHub

✅ **Déjà fait** : Le code est sur la branche `longuenesse` avec le commit `0bd6fab`

### Étape 2 : Redéployer l'API sur Render

1. **Connectez-vous à [Render Dashboard](https://dashboard.render.com)**

2. **Trouvez le service `boulangerie-planning-api-3`**
   - C'est le service pour Longuenesse
   - URL : `https://boulangerie-planning-api-3.onrender.com`

3. **Vérifiez la Configuration**
   - Allez dans **Settings** → **Build & Deploy**
   - Vérifiez que **Branch** est bien `longuenesse` ✅
   - Vérifiez que **Auto-Deploy** est sur `No` (c'est normal, déploiement manuel)

4. **Lancez le Déploiement Manuel**
   - Cliquez sur **Manual Deploy** (en haut à droite)
   - Sélectionnez **Deploy latest commit**
   - Cliquez sur **Deploy**

5. **Attendez la Fin du Déploiement**
   - Le déploiement prend généralement **2-3 minutes**
   - Vous pouvez suivre la progression dans l'onglet **Logs**
   - Attendez le message : `✅ Your service is live`

### Étape 3 : Vérifier que le Déploiement a Réussi

1. **Vérifiez les Logs**
   - Allez dans l'onglet **Logs**
   - Cherchez des messages comme :
     - `✅ Routes chargées`
     - `✅ Server running on port 10000`
     - Pas d'erreurs de compilation

2. **Testez l'Endpoint** (optionnel)
   ```bash
   curl -X PUT https://boulangerie-planning-api-3.onrender.com/api/passwords/update \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"employee": "test123"}'
   ```
   
   **Résultat attendu :**
   - Si l'utilisateur employee n'existe pas : `{"success": false, "error": "Utilisateur employee non trouvé"}`
   - Si l'utilisateur existe : `{"success": true, "message": "Mots de passe mis à jour avec succès: employee"}`
   - **Plus d'erreur 404 !**

### Étape 4 : Tester sur le Site

1. Allez sur `https://www.filmara.fr/lon/parameters`
2. Essayez de changer le mot de passe salarié
3. Vérifiez qu'il n'y a plus d'erreur 404 dans la console

## 📋 Checklist

- [ ] Connecté à Render Dashboard
- [ ] Trouvé le service `boulangerie-planning-api-3`
- [ ] Vérifié que la branche est `longuenesse`
- [ ] Lancé **Manual Deploy** → **Deploy latest commit**
- [ ] Attendu la fin du déploiement (2-3 minutes)
- [ ] Vérifié les logs (pas d'erreurs)
- [ ] Testé sur le site (`/lon/parameters`)

## ⚠️ Points Importants

1. **Le code est déjà sur GitHub** : Pas besoin de push, juste redéployer
2. **Déploiement manuel** : Auto-Deploy est désactivé, c'est normal
3. **Temps de déploiement** : 2-3 minutes, soyez patient
4. **Vérification** : Après déploiement, testez immédiatement sur le site

## 🆘 Si le Problème Persiste

Si après le redéploiement vous obtenez toujours une erreur 404 :

1. **Vérifiez les logs Render** pour voir s'il y a des erreurs
2. **Vérifiez que la route est bien montée** dans les logs :
   - Cherchez `app.use('/api/passwords'` dans les logs
3. **Vérifiez que le contrôleur est bien exporté** :
   - Cherchez `updatePassword` dans les logs
4. **Contactez-moi** avec les logs complets si nécessaire

---

**Une fois le redéploiement terminé, le problème devrait être résolu !** ✅
