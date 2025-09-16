# 🚨 Guide - Limite Render Atteinte

## 📋 Situation actuelle

**Problème :** Render a atteint sa limite de minutes de build gratuites  
**Message d'erreur :** "Your most recent build failed because the account has reached its custom build pipeline minute spend limit of $0.00"  
**Date de reset :** 10/01/25

## 💰 Options disponibles

### 1. ⏳ Attendre le reset (Recommandé)
- **Coût :** Gratuit
- **Délai :** Quelques jours (reset le 10/01/25)
- **Action :** Aucune action requise
- **Avantage :** Pas de coût supplémentaire

### 2. 💳 Mettre à niveau le plan Render
- **Coût :** ~$7/mois pour le plan Starter
- **Avantages :**
  - Déploiements illimités
  - Builds plus rapides
  - Support prioritaire
- **Action :** Aller dans les paramètres Render → Billing

### 3. 🔧 Déploiement manuel (Solution temporaire)
- **Coût :** Gratuit
- **Action :** Upload manuel des fichiers sur OVH
- **Statut :** ✅ Fichiers prêts dans `frontend-ovh/`

## 🚀 Déploiement manuel OVH

### Fichiers prêts
- **Dossier :** `frontend-ovh/`
- **Statut :** ✅ Tous les fichiers sont à jour
- **Nouvelles pages :**
  - `salarie-connexion.html` - Connexion salarié
  - `employee-dashboard.html` - Dashboard salarié
  - `vacation-request-standalone.html` - Demande congés

### Instructions upload
1. **Se connecter** à votre espace OVH
2. **Aller** dans le gestionnaire de fichiers
3. **Naviguer** vers le dossier `www/`
4. **Supprimer** les anciens fichiers (sauf `.htaccess`)
5. **Uploader** tous les fichiers du dossier `frontend-ovh/`
6. **Vérifier** les permissions (644 pour fichiers, 755 pour dossiers)

## 🔗 URLs à tester après upload

- **Interface admin :** `https://www.filmara.fr/plan`
- **Connexion salarié :** `https://www.filmara.fr/salarie-connexion.html`
- **Dashboard salarié :** `https://www.filmara.fr/employee-dashboard.html`

## ⚠️ Backend Render

### Statut actuel
- **API :** ✅ Fonctionnelle
- **URL :** `https://boulangerie-planning-api-3.onrender.com/api`
- **Problème :** Seulement les nouveaux déploiements sont bloqués

### Fonctionnalités disponibles
- ✅ Authentification salariés
- ✅ Envoi d'emails mot de passe
- ✅ Gestion des congés
- ✅ Templates email
- ⚠️ Permissions de menu (seront créées au prochain redémarrage)

## 🎯 Fonctionnalités déployées

### Système d'authentification salariés
- ✅ Modèle Employee avec champs email/password
- ✅ Contrôleur d'authentification
- ✅ Routes JWT avec session 24h
- ✅ Template email personnalisable
- ✅ Pages de connexion et dashboard

### Gestion des congés
- ✅ Page de validation des demandes
- ✅ API complète pour les congés
- ✅ Emails de confirmation
- ✅ Interface admin intégrée

## 📊 Impact du problème

### ✅ Fonctionnel
- Backend API
- Base de données
- Authentification
- Envoi d'emails
- Toutes les fonctionnalités existantes

### ⚠️ Temporairement bloqué
- Nouveaux déploiements backend
- Mises à jour du code backend
- Création des permissions de menu (sera résolu au prochain redémarrage)

## 🔄 Plan de récupération

### Immédiat (aujourd'hui)
1. ✅ Upload des fichiers frontend sur OVH
2. ✅ Test des nouvelles fonctionnalités
3. ✅ Vérification du système d'authentification

### Court terme (quelques jours)
1. ⏳ Attendre le reset des minutes Render (10/01/25)
2. 🔄 Redéployer le backend pour créer les permissions de menu
3. ✅ Vérifier que le menu "Gestion des Congés" s'affiche

### Long terme (optionnel)
1. 💳 Considérer la mise à niveau du plan Render
2. 📊 Évaluer l'utilisation des minutes de build
3. 🔧 Optimiser les déploiements pour réduire la consommation

## 📞 Support

### Render
- **Documentation :** https://render.com/docs
- **Support :** Via le dashboard Render
- **Limites :** Vérifiables dans les paramètres de compte

### OVH
- **Documentation :** https://docs.ovh.com
- **Support :** Via l'espace client OVH

---

**Date de création :** 14 septembre 2025  
**Statut :** ✅ Solution temporaire disponible  
**Prochaine action :** Upload OVH des fichiers frontend





