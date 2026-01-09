# 🔧 Correction : Page Grise sur filmara.fr/lon

## ❌ Problème Identifié

La page `filmara.fr/lon` affichait une page grise car le `basename` du Router React était hardcodé à `/plan` dans `App.js`.

## ✅ Solution Appliquée

### 1. Modification de `App.js`

Le `basename` du Router React est maintenant **dynamique** et détecte automatiquement le bon chemin :

```javascript
// Détecter automatiquement le basename depuis l'URL ou utiliser la variable Vite
const basename = import.meta.env.BASE_URL 
  ? import.meta.env.BASE_URL.replace(/\/$/, '') // Enlever le slash final
  : (window.location.pathname.startsWith('/lon') ? '/lon' : '/plan'); // Fallback
```

**Résultat :**
- ✅ Pour Arras (`/plan/`) : basename = `/plan`
- ✅ Pour Longuenesse (`/lon/`) : basename = `/lon`

### 2. Nouveau Build Créé

Le frontend a été rebuilder avec cette correction :
- ✅ Dossier : `deploy-frontend-lon/`
- ✅ Basename dynamique configuré
- ✅ Manifest.json corrigé

---

## 📤 Prochaine Étape : Upload sur OVH

**Vous devez maintenant uploader le nouveau build sur OVH :**

1. **Uploadez tout le contenu** de `deploy-frontend-lon/` dans `/lon/` sur OVH
2. **Remplacez les anciens fichiers** (le nouveau build a un hash différent : `index.DIzEZtxQ.js`)
3. **Vérifiez** que le fichier `.htaccess` est bien présent

**Après upload, la page devrait fonctionner correctement !** ✅

---

## 🔍 Vérifications Après Upload

1. **Ouvrez** : `https://www.filmara.fr/lon/`
2. **Vérifiez** que la page se charge (plus de page grise)
3. **Ouvrez la console** (F12) et vérifiez :
   - ✅ Pas d'erreurs 404 pour les fichiers JS/CSS
   - ✅ Pas d'erreurs de routage
   - ✅ L'application se charge correctement

---

## 📝 Notes

- Le basename est maintenant **automatique** et fonctionne pour les deux sites
- Les futurs builds pour Arras ou Longuenesse utiliseront automatiquement le bon basename
- Plus besoin de modifier manuellement le code pour chaque site

