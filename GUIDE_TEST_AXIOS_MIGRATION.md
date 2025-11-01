# 🧪 Guide de Test - Migration node-fetch → axios

## ✅ Changements poussés sur GitHub

Le remplacement de `node-fetch` par `axios` a été effectué et poussé sur GitHub. Render va automatiquement redéployer le backend.

---

## 📋 Tests à Effectuer

### **Test 1 : Vérifier le déploiement Render** ⏱️ 2 minutes

1. **Attendre 2-3 minutes** après le push pour que Render redéploie
2. **Vérifier les logs Render** :
   - Aller sur https://dashboard.render.com
   - Vérifier que le déploiement est réussi (status "Live")
   - Vérifier les logs pour voir s'il y a des erreurs au démarrage

**Résultat attendu :** ✅ Backend déployé sans erreur

---

### **Test 2 : Test de santé de l'architecture distribuée** ⏱️ 1 minute

**Endpoint de test :**
```
GET https://boulangerie-planning-api-4-pbfy.onrender.com/api/planning/test/distributed
```

**Comment tester :**
- Ouvrir cette URL dans un navigateur
- Ou utiliser Postman/Insomnia
- Ou via curl : `curl https://boulangerie-planning-api-4-pbfy.onrender.com/api/planning/test/distributed`

**Résultat attendu :**
```json
{
  "success": true,
  "constraint_calculator": {
    "status": "ok"
  },
  "planning_generator": {
    "status": "ok"
  }
}
```

**Ce test vérifie :**
- ✅ Les health checks utilisent maintenant `axios.get()` au lieu de `fetch()`
- ✅ Les appels HTTP fonctionnent correctement

---

### **Test 3 : Génération de planning** ⏱️ 3 minutes

**Endpoint :**
```
POST https://boulangerie-planning-api-4-pbfy.onrender.com/api/planning/generate
```

**Body (JSON) :**
```json
{
  "weekNumber": 1,
  "year": 2025,
  "affluenceLevels": {
    "monday": 2,
    "tuesday": 2,
    "wednesday": 2,
    "thursday": 2,
    "friday": 2,
    "saturday": 4,
    "sunday": 4
  }
}
```

**Comment tester :**
1. Se connecter à l'interface admin : https://www.filmara.fr/plan/
2. Aller dans la page "Planning"
3. Sélectionner une semaine
4. Cliquer sur "Générer le planning"

**Résultat attendu :**
- ✅ Le planning est généré avec succès
- ✅ Pas d'erreur dans la console du navigateur
- ✅ Pas d'erreur dans les logs Render
- ✅ Le planning s'affiche correctement dans l'interface

**Ce test vérifie :**
- ✅ `callORToolsAPI()` utilise `axios.post()` correctement
- ✅ `callDistributedServices()` utilise `axios.post()` pour les deux services
- ✅ La gestion d'erreurs fonctionne

---

### **Test 4 : Vérifier les logs Render** ⏱️ 1 minute

Après avoir généré un planning, vérifier les logs Render :

1. Aller sur https://dashboard.render.com
2. Sélectionner le service backend
3. Ouvrir l'onglet "Logs"
4. Rechercher les messages suivants :

**Messages attendus :**
```
📡 Appel API OR-Tools: https://planning-ortools-api.onrender.com/solve
✅ Réponse OR-Tools: ✅ Succès
```

**OU** (si architecture distribuée utilisée) :
```
🧮 Étape 1: Calcul des contraintes...
✅ Contraintes calculées: Succès
🚀 Étape 2: Génération du planning...
✅ Planning généré: Succès
```

**Résultat attendu :**
- ✅ Pas d'erreur mentionnant "node-fetch"
- ✅ Pas d'erreur "require is not defined" ou "fetch is not a function"
- ✅ Les appels axios fonctionnent correctement

---

### **Test 5 : Test en cas d'erreur réseau** ⏱️ 2 minutes

Si les services OR-Tools sont indisponibles, vérifier que la gestion d'erreurs fonctionne :

**Résultat attendu :**
- ✅ Le backend retourne une erreur propre
- ✅ Pas de crash du serveur
- ✅ Message d'erreur clair dans les logs
- ✅ L'interface affiche un message d'erreur approprié

**Messages d'erreur attendus (si services indisponibles) :**
```
❌ Erreur appel API OR-Tools: [message d'erreur]
```

ou

```
❌ Erreur architecture distribuée: Erreur [URL]: HTTP [status] - [message]
```

---

## 🔍 Points de Vérification Spécifiques

### ✅ Checklist de Validation

- [ ] Backend redéployé sur Render sans erreur
- [ ] Test `/api/planning/test/distributed` retourne `success: true`
- [ ] Génération de planning fonctionne normalement
- [ ] Pas d'erreur "node-fetch" dans les logs
- [ ] Pas d'erreur "require is not defined"
- [ ] Les appels HTTP fonctionnent (axios.post, axios.get)
- [ ] La gestion d'erreurs fonctionne correctement

---

## 🚨 En Cas de Problème

### **Erreur : "axios is not defined"**
- Vérifier que `axios` est bien installé : `npm list axios` dans le backend
- Solution : Render devrait avoir réinstallé automatiquement

### **Erreur : "Cannot find module 'node-fetch'"**
- C'est normal ! On a retiré node-fetch intentionnellement
- Si cette erreur apparaît, c'est qu'il reste une référence quelque part
- Vérifier avec : `grep -r "node-fetch" backend/`

### **Erreur : "fetch is not a function" dans planningController**
- Normal ! On utilise maintenant axios, pas fetch
- Si cette erreur apparaît, vérifier que le code a bien été mis à jour

### **Les appels API ne fonctionnent pas**
- Vérifier que les services externes (OR-Tools, constraint-calculator, planning-generator) sont en ligne
- Vérifier les logs Render pour voir les erreurs détaillées
- Vérifier la configuration des URLs dans les variables d'environnement

---

## 📝 Résumé

**Ce qui a changé :**
- ✅ `node-fetch` → `axios` dans `planningController.js`
- ✅ 5 fonctions converties
- ✅ `node-fetch` retiré du `package.json`

**Ce qui n'a PAS changé :**
- ✅ Les endpoints API restent les mêmes
- ✅ Le comportement fonctionnel reste identique
- ✅ Les utilisations de `fetch` dans `emailServiceAlternative.js` (fetch natif Node.js)

**Temps total de test estimé :** ⏱️ 8-10 minutes

---

## ✅ Après les Tests

Si tous les tests passent, la migration est **100% réussie** ! 🎉

Le backend utilise maintenant `axios` au lieu de `node-fetch`, ce qui :
- ✅ Améliore la sécurité (package maintenu)
- ✅ Unifie le code (axios déjà utilisé ailleurs)
- ✅ Réduit les dépendances obsolètes

