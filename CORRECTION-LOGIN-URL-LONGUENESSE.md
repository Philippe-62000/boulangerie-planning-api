# 🔧 Correction : Login URL et Redirection Longuenesse

## ❌ Problèmes Identifiés

1. **Lien dans l'email** : Pointe vers `/plan/salarie-connexion.html` (Arras) au lieu de `/lon/salarie-connexion.html` (Longuenesse)
2. **Redirection après connexion** : Pointe vers `/plan/employee-dashboard.html` au lieu de `/lon/employee-dashboard.html`
3. **Erreur 401** : Token invalide car la page `/plan/` utilise l'API Arras (api-4-pbfy) alors que le token vient de Longuenesse (api-3)

---

## ✅ Corrections Appliquées

### 1. Correction des Redirections dans `salarie-connexion.html`

**Fichier** : `deploy-frontend-lon/salarie-connexion.html`

- ✅ Ligne 460 : Changé `/plan/employee-dashboard.html` → `/lon/employee-dashboard.html`
- ✅ Ligne 621 : Changé `/plan/employee-dashboard.html` → `/lon/employee-dashboard.html`

### 2. Vérifier la Variable CORS_ORIGIN dans Render

**⚠️ IMPORTANT** : Pour que le lien dans l'email pointe vers `/lon/`, la variable `CORS_ORIGIN` dans Render pour Longuenesse **DOIT** contenir `/lon`.

**Dans Render Dashboard (service Longuenesse) :**
1. Allez dans **Environment Variables**
2. Vérifiez que `CORS_ORIGIN` contient :
   ```
   https://www.filmara.fr,https://www.filmara.fr/plan,https://www.filmara.fr/lon,http://localhost:3000
   ```
3. Si `CORS_ORIGIN` ne contient **PAS** `/lon`, ajoutez-le et sauvegardez
4. Render redéploiera automatiquement

### 3. Vérifier que la Page `/lon/salarie-connexion.html` Existe sur OVH

**⚠️ IMPORTANT** : La page `/lon/salarie-connexion.html` doit être uploadée sur OVH.

**Vérification :**
1. Allez sur `https://www.filmara.fr/lon/salarie-connexion.html`
2. La page doit s'afficher correctement
3. Si la page n'existe pas (404), il faut uploader les fichiers depuis `deploy-frontend-lon/`

---

## 🔍 Diagnostic

### Pourquoi le Lien dans l'Email Pointe vers `/plan/` ?

Le code dans `backend/controllers/authController.js` vérifie :
```javascript
loginUrl: process.env.CORS_ORIGIN && process.env.CORS_ORIGIN.includes('/lon') 
  ? 'https://www.filmara.fr/lon/salarie-connexion.html'
  : 'https://www.filmara.fr/plan/salarie-connexion.html'
```

**Si le lien pointe vers `/plan/`**, cela signifie que :
- ❌ `CORS_ORIGIN` ne contient pas `/lon` dans Render
- ❌ OU `process.env.CORS_ORIGIN` est `undefined`

**Solution :** Vérifier `CORS_ORIGIN` dans Render pour Longuenesse.

---

## 📋 Checklist

### Dans Render (Service Longuenesse) :
- [ ] `CORS_ORIGIN` contient `https://www.filmara.fr/lon`
- [ ] Service redéployé après modification de `CORS_ORIGIN`

### Sur OVH :
- [ ] La page `/lon/salarie-connexion.html` existe et est accessible
- [ ] Tous les fichiers de `deploy-frontend-lon/` sont uploadés dans `/lon/`

### Dans le Code :
- [x] `deploy-frontend-lon/salarie-connexion.html` redirige vers `/lon/employee-dashboard.html`
- [ ] `authController.js` détecte correctement Longuenesse (vérifier `CORS_ORIGIN`)

---

## 🧪 Test Après Corrections

1. **Vérifier que `CORS_ORIGIN` contient `/lon`** dans Render Longuenesse
2. **Envoyer un nouvel email de mot de passe** à un employé
3. **Vérifier que le lien dans l'email** pointe vers `/lon/salarie-connexion.html`
4. **Cliquer sur le lien** et se connecter
5. **Vérifier la redirection** vers `/lon/employee-dashboard.html`
6. **Vérifier qu'il n'y a plus d'erreur 401**

---

## 🆘 Si le Problème Persiste

### Si le lien dans l'email pointe toujours vers `/plan/` :

1. **Vérifiez les logs Render** pour voir la valeur de `CORS_ORIGIN` :
   ```
   🔧 CORS Origins configurés: [ 'https://www.filmara.fr', 'https://www.filmara.fr/plan', 'https://www.filmara.fr/lon', ... ]
   ```
   Si `/lon` n'est pas dans la liste → Ajoutez-le dans Render

2. **Forcez un redéploiement** de Longuenesse après avoir modifié `CORS_ORIGIN`

### Si l'erreur 401 persiste :

1. **Vérifiez que vous utilisez bien** `/lon/salarie-connexion.html` (pas `/plan/`)
2. **Vérifiez que cette page** utilise l'API Longuenesse (`api-3`, pas `api-4-pbfy`)
3. **Vérifiez dans la console du navigateur** quelle API est appelée
