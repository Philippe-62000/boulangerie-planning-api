# 📦 Déploiement - Gestion des doublons tickets restaurant (Longuenesse)

**Date :** 13 février 2026

## ✅ Ce qui a été fait

### 1. Modifications du code
- **Backend** : Les tickets en doublon retournent maintenant 409 (au lieu de bloquer) avec une option `forceDuplicate` pour accepter l'ajout
- **Frontend** : Détection des doublons + boîte de dialogue "Souhaitez-vous l'ajouter quand même ?"

### 2. Build frontend Longuenesse
- ✅ Build Vite exécuté avec `--base=/lon/`
- ✅ Fichiers copiés dans `deploy-frontend-lon/`
- ✅ `.htaccess` configuré pour /lon/
- ✅ URLs /plan/ remplacées par /lon/ dans les fichiers HTML

---

## 📤 À faire : Upload sur OVH

### Fichiers à uploader
**Dossier source :** `C:\boulangerie-planning\deploy-frontend-lon\`

**Destination sur OVH :** Dossier `/lon/` (dans www)

### Contenu à uploader
Uploadez **TOUT** le contenu du dossier `deploy-frontend-lon` :
- `index.html`
- `salarie-connexion.html`
- `employee-dashboard.html`
- `employee-dashboard-new.html`
- `employee-dashboard-old.html`
- `daily-sales-entry.html`
- `daily-losses-entry.html`
- `admin-documents.html`
- `sick-leave-simple.html`
- `sick-leave-standalone.html`
- `vacation-request-standalone.html`
- `http-redirect.html`
- `manifest.json`
- `.htaccess` ⚠️ **Important** - ne pas oublier !
- Dossier `static/` (CSS + JS)

### URL finale
https://www.filmara.fr/lon/

---

## ⚠️ Backend (Render) - À déployer aussi !

Les modifications du backend sont dans `backend/routes/ticketRestaurant.js`.

**Pour que les doublons fonctionnent, il faut déployer le backend sur Render :**

1. Poussez les modifications sur le repo Git (ou uploadez le fichier modifié)
2. Sur [Render Dashboard](https://dashboard.render.com) → service `boulangerie-planning-api-3`
3. **Manual Deploy** → **Deploy latest commit**
4. Attendre 2-3 minutes

Sans le déploiement backend, l'ancienne version continuera de bloquer les doublons avec une erreur 400.

---

## 📋 Récapitulatif

| Élément | Statut |
|---------|--------|
| Frontend buildé | ✅ `deploy-frontend-lon/` prêt |
| Backend modifié | ✅ Code prêt, à déployer sur Render |
| Upload OVH | ⏳ À faire par vous |
| Deploy Render | ⏳ À faire (Manual Deploy) |
