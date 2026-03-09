# Instructions pour l'upload manuel sur OVH

## Dossier à uploader

Le dossier **deploy-frontend-lon** est prêt pour l'upload sur OVH.

## Structure à respecter sur OVH

L'application utilise le chemin de base `/lon/`. Sur votre hébergement OVH :

1. **Créez un dossier `lon`** à la racine de votre site web (ou dans le répertoire public)
2. **Uploadez tout le contenu** du dossier `deploy-frontend-lon` **dans** le dossier `lon`

### Structure finale sur OVH :
```
[racine du site]/
└── lon/
    ├── index.html
    ├── .htaccess (si présent)
    ├── static/
    │   ├── css/
    │   │   └── index.DyOegkdS.css
    │   └── js/
    │       └── index.CD0-1gyH.js
    └── [autres fichiers HTML si présents]
```

## URL d'accès

Après l'upload, l'application sera accessible à :
**https://votre-domaine.com/lon/**

## Fichiers à uploader (contenu actuel de deploy-frontend-lon)

- `index.html`
- `static/css/index.DyOegkdS.css`
- `static/js/index.CD0-1gyH.js`
- Tous les fichiers `.html` additionnels (admin-documents, employee-dashboard, etc.)
- Le fichier `.htaccess` si vous utilisez Apache

---
*Build généré le 6 mars 2025 - Branche longuenesse*
