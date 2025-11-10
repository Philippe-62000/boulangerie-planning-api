# Guide de Déploiement Backend sur Render

## Méthode : Déploiement Automatique via GitHub

Render détecte automatiquement les changements poussés sur GitHub et redéploie le backend.

## Étapes pour Déployer

### 1. Vérifier les modifications
```bash
git status
```

### 2. Ajouter les fichiers modifiés
```bash
# Ajouter seulement le backend (recommandé)
git add backend/controllers/kmExpenseController.js

# OU ajouter tous les fichiers modifiés
git add .
```

### 3. Créer un commit
```bash
git commit -m "Fix: Ordre colonnes KM selon createdAt + suppression bouton Réinitialiser Adélaïde"
```

### 4. Pousser vers GitHub
```bash
git push origin main
```

## Vérification du Déploiement

### Sur Render.com
1. Connectez-vous à [Render Dashboard](https://dashboard.render.com)
2. Sélectionnez votre service backend (`boulangerie-planning-api`)
3. Vérifiez l'onglet **Events** ou **Logs**
4. Vous verrez un nouveau déploiement se lancer automatiquement

### Statut du Déploiement
- **Queued** : En attente
- **Building** : Construction en cours
- **Live** : Déploiement réussi ✅
- **Build Failed** : Erreur (voir les logs)

### Durée Estimée
- **Build** : 2-5 minutes
- **Déploiement** : 1-2 minutes
- **Total** : ~5-7 minutes

## Modifications Actuelles à Déployer

### Backend (`backend/controllers/kmExpenseController.js`)
- ✅ Tri des paramètres KM par `createdAt` au lieu de `kmValue`
- ✅ Permet d'afficher les colonnes dans l'ordre défini dans Parameters

### Frontend (`frontend/src/pages/KmExpenses.js`)
- ✅ Suppression du bouton "Réinitialiser Adélaïde"
- ✅ Suppression de la fonction `resetEmployeeData`

## Notes Importantes

⚠️ **Ne pas commiter les fichiers de `deploy-frontend/`** : Ce sont des fichiers générés qui ne doivent pas être versionnés.

✅ **Render se met à jour automatiquement** : Dès que vous poussez sur GitHub, Render détecte le changement et redéploie.

📋 **Logs Render** : Si le déploiement échoue, vérifiez les logs dans le dashboard Render pour voir l'erreur.

## Commandes Rapides (Tout en un)

```bash
# Ajouter seulement les fichiers importants
git add backend/controllers/kmExpenseController.js frontend/src/pages/KmExpenses.js

# Commit
git commit -m "Fix: Ordre colonnes KM + suppression bouton Réinitialiser Adélaïde"

# Push (Render détectera automatiquement)
git push origin main
```

## Alternative : Utiliser le Script Batch

Vous pouvez aussi utiliser `push-to-main.bat` mais **il faut modifier le message de commit** dans le script avant de l'exécuter.

```batch
# Modifier la ligne 16 dans push-to-main.bat :
git commit -m "Fix: Ordre colonnes KM + suppression bouton Réinitialiser Adélaïde"
```

Puis exécutez :
```bash
.\push-to-main.bat
```

---

**Une fois le push effectué, Render redéploiera automatiquement le backend dans les 5-7 minutes.**




















