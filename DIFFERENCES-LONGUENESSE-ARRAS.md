# Différences Longuenesse / Arras

Ce document liste les différences entre les déploiements Longuenesse (`/lon`, api-3) et Arras (`/plan`, api-4-pbfy) pour faciliter les décisions de mise en œuvre.

## Corrections appliquées sur Arras (main) – à déployer

### 1. Permissions de menu (planning, ticket restaurant)
**Problème** : Les menus "Génération du planning" et "Ticket restaurant" restaient visibles pour les salariés même après désactivation dans Paramètres > Gestion des permissions.

**Cause** : À chaque redémarrage du backend, `createDefaultPermissions` réinitialisait `isVisibleToAdmin` et `isVisibleToEmployee` avec les valeurs par défaut, écrasant les choix de l’admin.

**Correction** : `backend/models/MenuPermissions.js` – utilisation de `$setOnInsert` pour ne définir la visibilité qu’à la création d’un nouveau menu. Les menus existants conservent les valeurs configurées par l’admin. Ajout du menu `employee-dashboard` (Mes Documents) pour les salariés.

**Action** : Redéployer le backend Arras (api-4-pbfy). Ensuite, aller dans Paramètres > Gestion des permissions et reconfigurer les droits salariés si nécessaire (les valeurs actuelles en base sont conservées).

### 2. Documents personnels / fiches de paie
**Problème** : Message trompeur indiquant que tous les documents personnels sont supprimés après 1 mois.

**Réalité** : Le backend conserve déjà les fiches de paie sans limite (voir `Document.js` : `category === 'payslip'` exclu de l’expiration).

**Correction** : Texte mis à jour dans `employee-dashboard.html` :
- "Les fiches de paie sont conservées sans limite de temps"
- "Les autres documents personnels sont désactivés après 1 mois"

**Fichiers modifiés** :
- `deploy-frontend/employee-dashboard.html`
- `deploy-frontend-lon/employee-dashboard.html`
- `frontend/public/employee-dashboard.html`
- `frontend/src/pages/EmployeeDashboard.js`

---

## Différences de fonctionnalités (Longuenesse vs Arras)

| Fonctionnalité | Longuenesse | Arras | Décision |
|----------------|-------------|-------|---------|
| **Plateaux repas** | Non (pas dans MenuPermissions) | Oui (menu plateaux-repas) | À décider : activer sur Longuenesse ? |
| **Commandes en ligne** | Oui (`longuenesseOnly: true` dans Sidebar) | Non (masqué) | Spécifique Longuenesse |
| **Module MealReservations** (plateaux, formules, etc.) | Non (absent du backend longuenesse) | Oui (main) | Déjà sur Arras uniquement |
| **Frais KM Responsable** | Oui | Oui | Commun |
| **Chorus** (commandes, bons NAS) | Oui (menu visible) | Non (`longuenesseOnly`) | Activer sur Arras après tests |
| **Branche déploiement** | `longuenesse` | `main` | - |
| **Base MongoDB** | `boulangerie-planning-longuenesse` | `boulangerie-planning` | - |
| **API Render** | api-3 | api-4-pbfy | - |

---

## Actions recommandées pour Arras

1. **Backend** : Déployer les modifications (MenuPermissions) sur Render api-4-pbfy.
2. **Frontend** : Rebuild et upload du dossier `deploy-frontend` vers `/plan/` sur OVH (pour le texte documents).
3. **Permissions** : Vérifier dans Paramètres > Gestion des permissions que "Génération du planning" et "Ticket restaurant" sont bien désactivés pour les salariés si souhaité. Sauvegarder.

---

## Actions pour synchroniser Longuenesse

Si vous souhaitez que Longuenesse ait les mêmes corrections :
1. Merger `main` dans `longuenesse` (ou cherry-pick les commits).
2. Rebuild frontend avec `npm run build` (base `/lon`).
3. Déployer sur OVH dans `/lon/`.
