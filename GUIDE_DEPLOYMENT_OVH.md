# 🚀 Guide de Déploiement OVH - Demandes d'Acompte

## 📋 Résumé des nouvelles fonctionnalités

Les nouvelles fonctionnalités suivantes ont été développées et sont prêtes pour le déploiement :

- ✅ **Page "Demandes d'Acompte"** (`/advance-requests`)
- ✅ **Menu "Demandes d'Acompte"** dans la sidebar
- ✅ **Templates EmailJS** pour les acomptes (4 templates)
- ✅ **Interface de validation manager**
- ✅ **Récapitulatif dans employee-status-print**

## 📁 Fichiers prêts pour le déploiement

Le dossier `deploy-frontend/` contient tous les fichiers nécessaires :

```
deploy-frontend/
├── index.html                    # Page principale React
├── employee-dashboard.html       # Dashboard employé (mis à jour)
├── admin-documents.html         # Gestion des documents
├── manifest.json                # Manifest de l'application
├── static/                      # Dossier des assets
│   ├── css/                     # Fichiers CSS
│   └── js/                      # Fichiers JavaScript
└── [autres fichiers HTML...]
```

## 🔧 Instructions de déploiement OVH

### Étape 1 : Accéder à l'espace OVH

1. Connectez-vous à votre [espace client OVH](https://www.ovh.com/auth/)
2. Allez dans **"Hébergements"**
3. Sélectionnez votre hébergement web
4. Cliquez sur **"Gestionnaire de fichiers"**

### Étape 2 : Naviguer vers le dossier du site

1. Dans le gestionnaire de fichiers, naviguez vers le dossier de votre site
2. Le chemin est généralement : `/www/` ou `/www/votre-domaine/`

### Étape 3 : Sauvegarder les fichiers existants (optionnel)

1. Créez un dossier `backup-avant-deploiement/`
2. Copiez les fichiers existants dans ce dossier pour sauvegarde

### Étape 4 : Uploader les nouveaux fichiers

1. **Sélectionnez TOUS les fichiers** du dossier `deploy-frontend/`
2. **Uploadez-les** vers le dossier de votre site
3. **Remplacez** les fichiers existants quand demandé

### Étape 5 : Vérifier les permissions

1. Vérifiez que les fichiers ont les bonnes permissions :
   - **Fichiers HTML** : 644
   - **Dossiers** : 755
   - **Fichiers CSS/JS** : 644

### Étape 6 : Tester le déploiement

1. Allez sur [https://www.filmara.fr/plan](https://www.filmara.fr/plan)
2. Connectez-vous avec vos identifiants
3. Vérifiez que le menu **"Demandes d'Acompte"** apparaît dans la sidebar
4. Cliquez sur **"Demandes d'Acompte"** pour accéder à la nouvelle page

## 🧪 Tests à effectuer après déploiement

### Test 1 : Menu et Navigation
- [ ] Le menu "Demandes d'Acompte" est visible dans la sidebar
- [ ] La page `/advance-requests` s'ouvre correctement
- [ ] L'interface de gestion des acomptes s'affiche

### Test 2 : Dashboard Employé
- [ ] Le modal d'acompte fonctionne sur `/employee-dashboard.html`
- [ ] La création de demande d'acompte fonctionne
- [ ] Les emails de confirmation sont envoyés

### Test 3 : Gestion Manager
- [ ] Les demandes apparaissent dans l'interface manager
- [ ] Les actions d'approbation/rejet fonctionnent
- [ ] Les emails de notification sont envoyés

### Test 4 : Récapitulatif
- [ ] La page "Imprimer État" affiche la section acomptes
- [ ] Le filtrage par mois fonctionne
- [ ] Les statistiques sont correctes

## 🔍 Vérification des fonctionnalités

### Page "Demandes d'Acompte"
- **URL :** `https://www.filmara.fr/plan/advance-requests`
- **Accès :** Menu sidebar → "Demandes d'Acompte"
- **Fonctionnalités :**
  - Liste des demandes en attente
  - Actions d'approbation/rejet
  - Statistiques en temps réel
  - Historique des demandes

### Templates EmailJS
- **Accès :** Paramètres → "Templates disponibles"
- **Templates ajoutés :**
  - 💰 Confirmation Acompte
  - 🔔 Alerte Acompte
  - ✅ Validation Acompte
  - ❌ Rejet Acompte

### Dashboard Employé
- **URL :** `https://www.filmara.fr/plan/employee-dashboard.html`
- **Nouvelle fonctionnalité :** Modal "Demande d'Acompte"
- **Accès :** Bouton "💰 Demande d'Acompte" (temporaire)

## 🚨 Dépannage

### Problème : Menu "Demandes d'Acompte" non visible
**Solution :**
1. Vérifiez que le fichier `index.html` a été correctement uploadé
2. Videz le cache du navigateur (Ctrl+F5)
3. Vérifiez les permissions du fichier

### Problème : Page 404 sur `/advance-requests`
**Solution :**
1. Vérifiez que tous les fichiers JavaScript sont uploadés
2. Vérifiez la console du navigateur pour les erreurs
3. Vérifiez que le fichier `index.html` contient les nouvelles routes

### Problème : Erreurs JavaScript
**Solution :**
1. Ouvrez les outils de développement (F12)
2. Vérifiez la console pour les erreurs
3. Vérifiez que tous les fichiers CSS/JS sont accessibles

## 📞 Support

Si vous rencontrez des problèmes :

1. **Vérifiez les logs** du serveur backend (Render)
2. **Consultez la console** du navigateur
3. **Vérifiez les permissions** des fichiers sur OVH
4. **Testez en navigation privée** pour éviter les problèmes de cache

## ✅ Checklist de déploiement

- [ ] Fichiers uploadés sur OVH
- [ ] Permissions correctes
- [ ] Menu "Demandes d'Acompte" visible
- [ ] Page `/advance-requests` accessible
- [ ] Dashboard employé fonctionnel
- [ ] Templates EmailJS disponibles
- [ ] Tests de fonctionnement OK

## 🎉 Déploiement terminé !

Une fois tous les tests effectués, le système de gestion des acomptes sera entièrement opérationnel !

---

**Date de création :** 29/10/2025  
**Version :** 1.0.0  
**Fonctionnalités :** Gestion complète des demandes d'acompte

