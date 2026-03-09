# Déploiement - Menu Échanges

## Problème
Le menu "Échanges entre boulangeries" n'apparaît pas car **l'ancien JavaScript** est encore chargé (cache ou fichiers non mis à jour sur OVH).

## Solution - Vérifier le déploiement

### 1. Fichiers à uploader (OBLIGATOIRE - les 3)
- **`index.html`** ← CRUCIAL : pointe vers le nouveau JS
- **`static/js/index.Be2Vh0kZ.js`**
- **`static/css/index.BiUPL3kI.css`**

### 2. Vérifier quel JS est chargé
1. Ouvrir https://www.filmara.fr/lon/
2. F12 → onglet **Network** (Réseau)
3. Recharger la page (Ctrl+Shift+R pour forcer)
4. Filtrer par "JS"
5. Vérifier : le fichier chargé doit être **index.Be2Vh0kZ.js**

Si vous voyez **index.BMXN7NPg.js** ou **index.D9paiBqT.js** ou **index.DsGNsmJm.js** → ancienne version, le nouveau n'est pas déployé.

### 3. Après upload
- **Vider le cache** : Ctrl+Shift+R (ou Cmd+Shift+R sur Mac)
- Ou tester en **navigation privée**

### 4. Où uploader sur OVH
Le contenu de `deploy-frontend-lon/` doit aller dans le dossier **lon/** de votre site :
```
[racine]/
└── lon/
    ├── index.html
    └── static/
        ├── css/
        │   └── index.BiUPL3kI.css
        └── js/
            └── index.Be2Vh0kZ.js
```

## Résultat attendu
Dans le menu **Social** (cliquer pour déplier), vous devez voir en dernier :
- **Échanges entre boulangeries**
