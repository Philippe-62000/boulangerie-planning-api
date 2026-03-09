# Fix : Menu Échanges qui n'apparaît pas

## Problème

Le menu **Échanges entre boulangeries** ne s'affiche pas dans la sidebar.

## Solution (comme vacation-management - voir fix-vacation-menu-permissions.bat)

### 1. Recréer les permissions en base

**Option A - Via l'interface :**
1. Aller sur https://www.filmara.fr/lon/parameters
2. Onglet **Gestion des Permissions de Menu**
3. Cliquer **"🔄 Recréer les permissions par défaut"**
4. Confirmer

**Option B - Redémarrer le backend :** Le backend synchronise maintenant les menus manquants à chaque démarrage.

### 2. Déployer le nouveau frontend

Fichiers à uploader dans `lon/` sur OVH :
- `index.html`
- `static/js/index.C47JzW62.js`
- `static/css/index.BiUPL3kI.css`

### 3. Vider le cache

Ctrl+Shift+R ou navigation privée.

## Modifications appliquées

- **Backend** : `menuPermissionsController.js` - synchronise les menus à chaque démarrage (comme fix-vacation)
- **Frontend** : Échanges ajouté au menu principal ET au menu Social
- **.htaccess** : Redirections corrigées vers `/lon/` (pas `/plan/`)

## Référence

- `fix-vacation-menu-permissions.bat` : Supprime et recrée les permissions
- `GUIDE-RENDER-LIMITE.md` : "Recréer les permissions de menu"
- `CORRECTIONS-FINALES-COMPLETEES.md` : Menus manquants
