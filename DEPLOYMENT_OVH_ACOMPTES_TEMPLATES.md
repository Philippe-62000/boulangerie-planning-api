# 🚀 Déploiement OVH - Templates Acomptes et Authentification

## 📋 Fichiers Modifiés

### ✅ Frontend (à déployer sur OVH)
- **`frontend/src/services/api.js`** 
  - ✨ Ajout d'un intercepteur pour inclure automatiquement le token JWT dans toutes les requêtes API
  - 🔧 Corrige l'erreur 401 sur `/advance-requests`

### ✅ Backend (déjà sur Render - pas besoin de déploiement)
- `backend/services/emailServiceAlternative.js` - Utilise maintenant les templates DB
- `backend/services/emailService.js` - Utilise maintenant les templates DB

---

## 🔧 Étapes de Déploiement

### 1. **Reconstruire le Frontend**

Dans le dossier `frontend`, exécutez :

```bash
cd frontend
npm run build
```

Ou utilisez le script de déploiement existant :

```bash
.\deploy-frontend-ovh.bat
```

### 2. **Déployer sur OVH**

Le script crée le dossier `deploy-frontend\` avec tous les fichiers nécessaires.

**Fichiers à uploader :**
- `index.html`
- Tous les fichiers du dossier `static/` (JS, CSS, médias)
- Les fichiers HTML de `public/` si nécessaire

**Destination sur OVH :**
- Dossier : `/plan/` (ou selon votre configuration)

---

## ✅ Vérifications Post-Déploiement

Après le déploiement, vérifiez :

1. **Authentification API** ✅
   - [ ] Les pages React peuvent maintenant accéder à `/api/advance-requests`
   - [ ] Plus d'erreur 401 si vous avez un token JWT en localStorage

2. **Templates Email** ✅
   - [ ] Aller dans Parameters → Templates disponibles
   - [ ] Cliquer sur "Initialiser les templates par défaut"
   - [ ] Vérifier que les 4 templates d'acompte apparaissent :
     - 💰 Email Confirmation - Demande d'Acompte
     - 🔔 Email d'Alerte - Nouvelle Demande d'Acompte
     - ✅ Email de Validation - Acompte Approuvé
     - ❌ Email de Rejet - Acompte Refusé

3. **Fonctionnalités** ✅
   - [ ] Créer une demande d'acompte depuis le dashboard salarié
   - [ ] Vérifier que les emails sont envoyés correctement
   - [ ] Approuver/rejeter une demande depuis la page `/advance-requests`

---

## 🐛 Dépannage

### Erreur 401 persiste
- Vérifiez que le nouveau build inclut bien `api.js` modifié
- Videz le cache du navigateur (Ctrl+Shift+R)
- Vérifiez que vous avez un token JWT valide dans localStorage

### Templates n'apparaissent pas
- Connectez-vous en tant qu'admin
- Allez dans Parameters → Templates disponibles
- Cliquez sur "Initialiser les templates par défaut"
- Attendez quelques secondes puis rechargez la page

---

## 📝 Résumé des Modifications

### Frontend
- ✅ Correction de l'authentification API (token JWT automatique)
- ✅ Le fichier `api.js` inclut maintenant tous les tokens possibles

### Backend (Render)
- ✅ Templates d'acompte utilisent maintenant la base de données
- ✅ Plus besoin de créer 4 templates supplémentaires dans EmailJS
- ✅ Les templates utilisent vos 2 templates EmailJS existants

---

**Date de déploiement :** À faire maintenant
**Impact :** Correction importante pour l'authentification et les emails d'acompte

