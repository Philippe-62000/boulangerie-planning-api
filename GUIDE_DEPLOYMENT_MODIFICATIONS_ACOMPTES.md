# 🚀 Guide de Déploiement - Modifications Demandes d'Acompte

## 📋 Résumé des modifications

### 1. **Modal de demande d'acompte** (Dashboard salarié)
- ✅ Retiré le texte "Montant entre 1€ et 5000€"
- ✅ Mois de déduction automatique (lecture seule, mois courant)
- ✅ Retiré le champ "Commentaire (optionnel)"
- ✅ Retiré les mentions superflues dans les informations

### 2. **Sélection nominative** (Paramètres)
- ✅ Remplacement de la checkbox globale par une liste de checkboxes
- ✅ Sélection individuelle des salariés autorisés
- ✅ Stockage des IDs dans `stringValue` (format JSON)

### 3. **Retrait du bouton redondant** (Page Employees)
- ✅ Retiré le bouton "💰 Acomptes" du header
- ✅ La fonctionnalité reste accessible via le menu flottant

### 4. **Contact d'urgence** (Formulaire employé)
- ✅ Ajout de la section "Personne à Contacter en Cas d'Urgence"
- ✅ Champs : Nom, Prénom, Téléphone, Email

## 📁 Fichiers modifiés

### Frontend
- ✅ `frontend/public/employee-dashboard.html` - Modal d'acompte simplifié
- ✅ `frontend/src/pages/Parameters.js` - Sélection nominative des salariés
- ✅ `frontend/src/pages/Employees.js` - Retrait du bouton redondant
- ✅ `frontend/src/components/EmployeeModal.js` - Ajout contact d'urgence

### Backend
- ✅ `backend/controllers/parametersController.js` - Paramètre avec stringValue
- ✅ `backend/models/Employee.js` - Ajout emergencyContact

## 🔧 Instructions de déploiement

### Étape 1 : Déployer le backend sur Render (GitHub)

Les modifications backend seront automatiquement déployées lors du push vers GitHub :

```bash
git add .
git commit -m "Modifications acomptes: modal simplifié, sélection nominative, contact urgence"
git push origin main
```

### Étape 2 : Déployer le frontend sur OVH

1. **Connectez-vous à votre espace OVH**
   - Allez sur [https://www.ovh.com/auth/](https://www.ovh.com/auth/)
   - Naviguez vers "Hébergements" → Votre hébergement → "Gestionnaire de fichiers"

2. **Uploadez les fichiers**
   - Sélectionnez **TOUS les fichiers** du dossier `deploy-frontend/`
   - Uploadez-les vers le dossier de votre site (`/www/` ou `/www/votre-domaine/`)
   - **Remplacez** les fichiers existants quand demandé

3. **Vérifiez les permissions**
   - Fichiers HTML : 644
   - Dossiers : 755
   - Fichiers CSS/JS : 644

## 🧪 Tests après déploiement

### Test 1 : Modal d'acompte (Dashboard salarié)
- [ ] Aller sur https://www.filmara.fr/plan/employee-dashboard.html
- [ ] Cliquer sur "💰 Demande d'Acompte"
- [ ] Vérifier que :
  - Le texte "Montant entre 1€ et 5000€" n'apparaît pas
  - Le champ "Déduction sur la paye" est en lecture seule avec le mois courant
  - Le champ "Commentaire" n'existe pas
  - Les mentions superflues ont été retirées

### Test 2 : Sélection nominative (Paramètres)
- [ ] Aller sur https://www.filmara.fr/plan/parameters
- [ ] Ouvrir l'onglet "Templates disponibles"
- [ ] Aller dans la section "💰 Configuration Demande d'Acompte"
- [ ] Vérifier que :
  - Une liste de checkboxes avec tous les employés s'affiche
  - On peut cocher/décocher individuellement
  - La sauvegarde fonctionne

### Test 3 : Dashboard salarié - Vérification nominative
- [ ] Sélectionner un employé dans Paramètres
- [ ] Se connecter avec cet employé sur le dashboard
- [ ] Vérifier que le bouton "💰 Demande d'Acompte" apparaît
- [ ] Se connecter avec un autre employé non sélectionné
- [ ] Vérifier que le bouton n'apparaît pas

### Test 4 : Page Employees
- [ ] Aller sur https://www.filmara.fr/plan/employees
- [ ] Vérifier que le bouton "💰 Acomptes" n'est plus présent dans le header
- [ ] Vérifier que l'accès aux acomptes est toujours possible via le menu flottant

### Test 5 : Contact d'urgence (Formulaire employé)
- [ ] Aller sur https://www.filmara.fr/plan/employees
- [ ] Cliquer sur "Ajouter un employé" ou modifier un employé existant
- [ ] Vérifier que la section "🚨 Personne à Contacter en Cas d'Urgence" apparaît
- [ ] Remplir les champs et sauvegarder
- [ ] Modifier l'employé pour vérifier que les données sont chargées

## 📦 Structure des fichiers à uploader

```
deploy-frontend/
├── index.html                    # Application React principale
├── employee-dashboard.html       # Dashboard salarié (modal simplifié)
├── admin-documents.html         # Gestion des documents
├── manifest.json                # Manifest
├── static/
│   ├── css/
│   │   └── main.71ce68f0.css   # Styles CSS
│   └── js/
│       └── main.db543bcf.js    # JavaScript (avec toutes les modifications)
└── [autres fichiers HTML...]
```

## ⚠️ Notes importantes

### Migration du paramètre d'acompte

Le paramètre `enableEmployeeAdvanceRequest` a changé de format :
- **Avant** : `booleanValue: true/false` (tous ou aucun)
- **Maintenant** : `stringValue: '["id1", "id2", ...]'` (liste JSON d'IDs)

**Compatibilité** : Le code gère automatiquement la transition. Si `stringValue` est vide mais `booleanValue` est `true`, tous les employés ont accès (fallback).

**Pour migrer manuellement** :
1. Aller dans Paramètres → Templates disponibles
2. Section "💰 Configuration Demande d'Acompte"
3. Cocher les employés désirés
4. Cliquer sur "💾 Sauvegarder la configuration"

## ✅ Checklist de déploiement

### Backend (Render)
- [ ] `git push origin main` effectué
- [ ] Déploiement automatique confirmé sur Render
- [ ] Paramètre `enableEmployeeAdvanceRequest` créé avec `stringValue: '[]'`

### Frontend (OVH)
- [ ] Fichiers uploadés depuis `deploy-frontend/`
- [ ] Permissions correctes
- [ ] Tests de fonctionnement OK

### Tests fonctionnels
- [ ] Modal d'acompte simplifié fonctionne
- [ ] Sélection nominative dans Paramètres fonctionne
- [ ] Vérification nominative dans dashboard salarié fonctionne
- [ ] Bouton redondant retiré de Employees.js
- [ ] Contact d'urgence dans formulaire employé fonctionne

## 🎉 Déploiement terminé !

Une fois tous les tests effectués, toutes les modifications seront opérationnelles !

---

**Date :** 31/10/2025  
**Version :** 1.1.0  
**Modifications :** Simplification modal acompte, sélection nominative, contact urgence
