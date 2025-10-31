# 🚀 Guide de Déploiement - Contact d'Urgence

## 📋 Résumé des modifications

Ajout d'une section "Personne à Contacter en Cas d'Urgence" dans le formulaire d'ajout/modification d'employé avec les champs suivants :
- **Nom** (texte)
- **Prénom** (texte)
- **Numéro de téléphone** (tel)
- **Email** (email avec validation)

## 📁 Fichiers modifiés

### Backend
- ✅ `backend/models/Employee.js` - Ajout du schéma `emergencyContact`

### Frontend
- ✅ `frontend/src/components/EmployeeModal.js` - Ajout des champs dans le formulaire

## 🔧 Instructions de déploiement OVH

### Étape 1 : Accéder à l'espace OVH

1. Connectez-vous à votre [espace client OVH](https://www.ovh.com/auth/)
2. Allez dans **"Hébergements"**
3. Sélectionnez votre hébergement web
4. Cliquez sur **"Gestionnaire de fichiers"**

### Étape 2 : Naviguer vers le dossier du site

1. Dans le gestionnaire de fichiers, naviguez vers le dossier de votre site
2. Le chemin est généralement : `/www/` ou `/www/votre-domaine/`

### Étape 3 : Uploader les nouveaux fichiers

1. **Sélectionnez TOUS les fichiers** du dossier `deploy-frontend/`
2. **Uploadez-les** vers le dossier de votre site
3. **Remplacez** les fichiers existants quand demandé

### Étape 4 : Vérifier les permissions

1. Vérifiez que les fichiers ont les bonnes permissions :
   - **Fichiers HTML** : 644
   - **Dossiers** : 755
   - **Fichiers CSS/JS** : 644

### Étape 5 : Tester le déploiement

1. Allez sur [https://www.filmara.fr/plan/employees](https://www.filmara.fr/plan/employees)
2. Cliquez sur **"Ajouter un employé"**
3. Vérifiez que la section **"🚨 Personne à Contacter en Cas d'Urgence"** apparaît en bas du formulaire
4. Remplissez les champs et sauvegardez
5. Modifiez l'employé créé pour vérifier que les données sont bien chargées

## 🧪 Tests à effectuer après déploiement

### Test 1 : Création d'employé
- [ ] La section "Contact d'urgence" est visible dans le formulaire
- [ ] Les 4 champs sont présents (Nom, Prénom, Téléphone, Email)
- [ ] Les données sont sauvegardées correctement

### Test 2 : Modification d'employé
- [ ] Les données d'urgence sont chargées et affichées
- [ ] Les modifications sont sauvegardées correctement

### Test 3 : Validation
- [ ] Le format email est validé pour le contact d'urgence
- [ ] Les champs sont optionnels (pas d'erreur si vides)

## 📦 Fichiers à uploader

```
deploy-frontend/
├── index.html                    # Page principale React (avec nouveau composant)
├── employee-dashboard.html       # Dashboard employé
├── admin-documents.html         # Gestion des documents
├── manifest.json                # Manifest de l'application
├── static/                      # Dossier des assets
│   ├── css/                     # Fichiers CSS
│   └── js/                      # Fichiers JavaScript (avec EmployeeModal mis à jour)
└── [autres fichiers HTML...]
```

## ⚠️ Notes importantes

1. **Backend** : Les modifications du modèle `Employee` seront automatiquement déployées sur Render lors du prochain push vers GitHub (si le déploiement automatique est configuré).

2. **Base de données** : Les employés existants n'auront pas de contact d'urgence. Ils peuvent être modifiés pour ajouter ces informations.

3. **Compatibilité** : Les nouveaux champs sont optionnels, donc compatibles avec les données existantes.

## ✅ Checklist de déploiement

- [ ] Fichiers uploadés sur OVH
- [ ] Permissions correctes
- [ ] Section "Contact d'urgence" visible dans le formulaire
- [ ] Création d'employé avec contact d'urgence fonctionnelle
- [ ] Modification d'employé avec contact d'urgence fonctionnelle
- [ ] Tests de validation OK

## 🎉 Déploiement terminé !

Une fois tous les tests effectués, la fonctionnalité de contact d'urgence sera entièrement opérationnelle !

---

**Date de création :** 30/10/2025  
**Version :** 1.0.0  
**Fonctionnalités :** Contact d'urgence pour les employés
