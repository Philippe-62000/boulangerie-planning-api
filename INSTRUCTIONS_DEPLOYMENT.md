# 🚀 Instructions de Déploiement Rapide

## ✅ Fichiers prêts pour le déploiement

Le dossier **`deploy-frontend/`** contient tous les fichiers nécessaires pour OVH.

## 📋 Étapes de déploiement

### 1. **Backend (Render) - Déploiement automatique**

Les modifications backend seront déployées automatiquement lors du push Git :

```bash
git commit -m "Modifications acomptes: modal simplifié, sélection nominative, contact urgence"
git push origin main
```

⏱️ **Délai :** ~2-3 minutes pour le déploiement automatique sur Render

### 2. **Frontend (OVH) - Déploiement manuel**

1. **Connectez-vous à OVH**
   - Allez sur https://www.ovh.com/auth/
   - Hébergements → Votre hébergement → Gestionnaire de fichiers

2. **Uploadez les fichiers**
   - Sélectionnez **TOUS** les fichiers du dossier `deploy-frontend/`
   - Uploadez vers `/www/` ou `/www/votre-domaine/`
   - Remplacez les fichiers existants

3. **Vérifiez les permissions** (optionnel)
   - Fichiers : 644
   - Dossiers : 755

## 🧪 Tests rapides après déploiement

1. **Modal d'acompte** : https://www.filmara.fr/plan/employee-dashboard.html
   - Ouvrir le modal "💰 Demande d'Acompte"
   - Vérifier que le mois est pré-rempli automatiquement

2. **Sélection nominative** : https://www.filmara.fr/plan/parameters
   - Templates disponibles → Configuration Demande d'Acompte
   - Vérifier la liste de checkboxes par employé

3. **Contact d'urgence** : https://www.filmara.fr/plan/employees
   - Ajouter/modifier un employé
   - Vérifier la section "🚨 Personne à Contacter en Cas d'Urgence"

## 📁 Contenu du dossier deploy-frontend

```
deploy-frontend/
├── index.html                    ← Application React principale
├── employee-dashboard.html       ← Dashboard salarié (modifié)
├── static/
│   ├── css/
│   │   └── main.71ce68f0.css
│   └── js/
│       └── main.db543bcf.js      ← JavaScript avec toutes les modifs
└── [autres fichiers HTML...]
```

## ⚡ Résumé des modifications

- ✅ Modal d'acompte simplifié (mois automatique, pas de commentaire)
- ✅ Sélection nominative des salariés dans Paramètres
- ✅ Retrait du bouton redondant dans Employees.js
- ✅ Contact d'urgence dans formulaire employé

**Tout est prêt ! 🎉**

