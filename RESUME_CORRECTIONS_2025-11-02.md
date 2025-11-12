# Résumé des Corrections - 2 Novembre 2025

## Problèmes Corrigés

### 1. ✅ Ordre des colonnes KM incorrect
**Problème** : Les colonnes KM s'affichaient dans le désordre (ex: Métro, Paramètre 2, Golf au lieu de College, B&B, Cérélia...)

**Solution** :
- **Backend** : `parametersController.js` et `kmExpenseController.js` trient maintenant par `createdAt` au lieu de `name`
- **Frontend** : `Parameters.js` trie également par `createdAt` après récupération
- **Filtrage** : Exclusion des paramètres avec `kmValue < 0` (ex: `siteName` avec `-1`)

**Fichiers modifiés** :
- `backend/controllers/parametersController.js` : Ligne 6
- `backend/controllers/kmExpenseController.js` : Lignes 24-28
- `frontend/src/pages/Parameters.js` : Lignes 93-100 et 810-814

### 2. ✅ Bouton "Réinitialiser Adélaïde" supprimé
**Problème** : Bouton inutile sur la page des frais KM

**Solution** :
- Bouton et fonction `resetEmployeeData` supprimés de `KmExpenses.js`

**Fichiers modifiés** :
- `frontend/src/pages/KmExpenses.js` : Lignes 188-205 et 108-126

### 3. ✅ Troncature des informations dans vacation-management
**Problème** : Les valeurs dans les cartes de congés étaient tronquées (ex: "Con" au lieu de "Congés")

**Solution** :
- Largeur minimale des cartes augmentée : `min-width: 420px` (au lieu de ~300px)
- `overflow: visible` sur les cartes pour permettre l'affichage complet
- Largeur minimale des valeurs : `min-width: 150px` pour éviter la troncature

**Fichiers modifiés** :
- `frontend/src/pages/VacationRequestAdmin.css` : Lignes 105-113, 243-255, 99-102

### 4. ✅ Colonne "numéros de jour" masquée à l'impression
**Problème** : Première colonne (1-31) affichée à l'impression alors que les numéros sont déjà dans chaque cellule

**Solution** :
- `.day-number-cell` et `.first-header` masqués avec `display: none !important`

**Fichiers modifiés** :
- `frontend/src/pages/VacationPlanning.css` : Lignes 324-327, 353-355

### 5. ✅ Téléchargement arrêts maladie & historique récup
**Problèmes** :
- Les arrêts maladie envoyés en JPEG étaient convertis en PDF corrompus au téléchargement.
- La page `Heures de récup` ne proposait pas d’historique détaillé par salarié.
- Le menu `Planning` se réactivait côté salariés à chaque réouverture de la page de permissions.
- La racine `https://www.filmara.fr/` affichait un index Apache.

**Solutions** :
- Utilisation du type MIME réel pour restituer le format d’origine (`.jpg`, `.png`, `.pdf`) dans `SickLeaveAdmin` et `SickLeaveManagement`.
- Ajout d’une modale « Détails » listant toutes les semaines avec justificatif depuis un nouvel endpoint `GET /api/recup-hours/:employeeId/history`.
- Stabilisation de `MenuPermissions.createDefaultPermissions` pour ne plus écraser `isVisibleToEmployee` existant.
- Affichage de `recup` activé par défaut pour les salariés et nettoyage du bouton obsolète « Lien pour salariés » dans la gestion des arrêts maladie.
- Simplification du `.htaccess` racine pour rediriger proprement vers `/plan/` sans exposer le chemin physique.
- Exposition explicite du header `Content-Disposition` via CORS et normalisation des types MIME pour forcer l’extension correcte lors du téléchargement.

**Fichiers modifiés** :
- `backend/controllers/recupHourController.js`, `backend/routes/recupHours.js`
- `backend/models/MenuPermissions.js`
- `backend/controllers/sickLeaveController.js`
- `frontend/src/pages/Recup.js`, `frontend/src/pages/Recup.css`
- `frontend/src/pages/SickLeaveAdmin.js`, `frontend/src/pages/SickLeaveManagement.js`
- `deploy-ovh/.htaccess`

## Déploiement

### Backend (Render)
Les modifications backend doivent être commitées et pushées pour être déployées :
```bash
git add backend/controllers/parametersController.js backend/controllers/kmExpenseController.js
git commit -m "Fix: Ordre colonnes KM selon createdAt + suppression bouton Réinitialiser"
git push origin main
```

### Frontend (OVH)
Les fichiers sont prêts dans `deploy-frontend/` :
- `index.html` et `static/` mis à jour
- Upload nécessaire sur OVH

### Scripts exécutés le 12/11/2025
- `build-frontend-simple.bat`
- `deploy-frontend-complet.bat` (copie vers OVH)
- `deploy-backend-render.bat` (build + rappel reboot Render)

## État Actuel

✅ **Terminé** :
- Filtrage et limitation à 12 paramètres KM
- Tri par `createdAt` pour respecter l'ordre Parameters
- Exclusion des paramètres avec `kmValue < 0`
- Suppression du bouton "Réinitialiser Adélaïde"
- Correction de la troncature dans vacation-management
- Masquage de la colonne numéros de jour à l'impression
- Historique détaillé des heures de récup avec justificatifs
- Téléchargement fiable des arrêts maladie au format d’origine
- Redirection propre de la racine `filmara.fr` vers `/plan/`
- Conservation des permissions personnalisées du menu `Planning`

⚠️ **En attente de déploiement** :
- Backend : Commit et push nécessaires
- Frontend : Upload OVH nécessaire

## Notes

**Problème arrêt maladie Anaïs** : La synchronisation est déjà gérée correctement dans le backend (recherche par email puis par nom nettoyé). Si Anaïs ne s'affiche pas dans le dashboard, vérifier :
1. Si l'employé "Anaïs" existe bien dans la base (sans le suffixe "- Manager")
2. Si le `sickLeave.isOnSickLeave` est bien à `true` après validation
3. Les logs Render pour voir si la synchronisation a réussi






















