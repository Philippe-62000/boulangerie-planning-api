# 🔍 Vérifier CORS_ORIGIN pour Longuenesse

## ❌ Problème Actuel

Le lien dans l'email pointe vers `/plan/salarie-connexion.html` (Arras) au lieu de `/lon/salarie-connexion.html` (Longuenesse).

**Cause probable :** La variable `CORS_ORIGIN` dans Render pour Longuenesse ne contient pas `/lon`.

---

## ✅ Action Immédiate

### ÉTAPE 1 : Vérifier CORS_ORIGIN dans Render

1. **Allez sur [Render Dashboard](https://dashboard.render.com/)**
2. **Trouvez le service Longuenesse** (`boulangerie-planning-api-3` ou similaire)
3. **Cliquez sur le service**
4. **Allez dans "Environment" → "Environment Variables"**
5. **Cherchez la variable `CORS_ORIGIN`**

### ÉTAPE 2 : Vérifier la Valeur

**Valeur actuelle attendue :**
```
https://www.filmara.fr,https://www.filmara.fr/plan,https://www.filmara.fr/lon,http://localhost:3000
```

**Vérifiez que `/lon` est bien dans la liste :**
- ✅ Si `/lon` est présent → C'est bon, vérifiez les logs Render
- ❌ Si `/lon` n'est **PAS** présent → **MODIFIER** (voir ÉTAPE 3)

### ÉTAPE 3 : Corriger CORS_ORIGIN

**Si `/lon` n'est pas présent :**

1. **Cliquez sur "Edit"** ou "Modifier" pour `CORS_ORIGIN`
2. **Ajoutez** `https://www.filmara.fr/lon` à la liste (séparée par des virgules)
3. **Valeur complète à mettre :**
   ```
   https://www.filmara.fr,https://www.filmara.fr/plan,https://www.filmara.fr/lon,http://localhost:3000
   ```
4. **Cliquez sur "Save Changes"**
5. **Render va automatiquement redéployer** (2-5 minutes)

### ÉTAPE 4 : Vérifier dans les Logs Render

**Après le redéploiement, vérifiez les logs Render. Vous devriez voir :**

```
🔧 CORS Origins configurés: [
  'https://www.filmara.fr',
  'https://www.filmara.fr/plan',
  'https://www.filmara.fr/lon',  ← Doit être présent
  'http://localhost:3000'
]
```

**Si `/lon` est dans les logs → ✅ C'est bon !**

---

## 🧪 Test Après Correction

1. **Envoyer un nouvel email de mot de passe** à un employé
2. **Vérifier que le lien dans l'email** pointe vers `/lon/salarie-connexion.html` (pas `/plan/`)
3. **Cliquer sur le lien** et se connecter
4. **Vérifier la redirection** vers `/lon/employee-dashboard.html`
5. **Vérifier qu'il n'y a plus d'erreur 401**

---

## 📋 Résumé

**Corrections appliquées dans le code :**
- ✅ `deploy-frontend-lon/salarie-connexion.html` redirige vers `/lon/employee-dashboard.html`

**Action requise dans Render :**
- ⏳ **Vérifier que `CORS_ORIGIN` contient `/lon`** (si non, le corriger)
- ⏳ **Attendre le redéploiement automatique** (2-5 minutes)
- ⏳ **Tester avec un nouvel email**

**Action requise sur OVH (si nécessaire) :**
- ⏳ **Vérifier que `/lon/salarie-connexion.html` existe** sur OVH
- ⏳ **Re-uploader les fichiers** depuis `deploy-frontend-lon/` si nécessaire
