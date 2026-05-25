# Page « Cette Semaine à Camaris » sur Vercel

Objectif : **URL dédiée aux clients**, sans accès à `filmara.fr` (réservé aux salariés / admin).  
Le site Vercel est **100 % statique** → affichage immédiat ; seules les données passent par l’API Render **api-3** (branche `longuenesse`).

## 1. Build local

```bat
deploy-camaris-vercel.bat
```

Modifiez dans le `.bat` si besoin :

- `VITE_CAMARIS_PUBLIC_URL` = l’URL Vercel finale (ex. `https://camaris-semaine.vercel.app` ou domaine perso)

## 2. Projet Vercel

### Option A — Dossier statique (recommandé)

1. [vercel.com](https://vercel.com) → **Add New Project**
2. Import du dépôt GitHub `boulangerie-planning-api`
3. **Root Directory** : `deploy-camaris-vercel`
4. Framework : **Other** (pas de build command — fichiers déjà buildés)
5. Ou build command si CI : `cd frontend && npm ci && npm run build:camaris-vercel`
6. **Output Directory** : `deploy-camaris-vercel` (si build CI)

### Option B — CLI

```bash
cd deploy-camaris-vercel
npx vercel --prod
```

### Domaine personnalisé (optionnel)

Vercel → **Settings → Domains** → ex. `semaine.votre-boulangerie.fr`

## 3. Render api-3 (CORS)

**Settings → Environment** sur le service **boulangerie-planning-api-3** :

| Variable | Exemple |
|----------|---------|
| `CAMARIS_PUBLIC_ORIGIN` | `https://camaris-semaine.vercel.app` |
| ou plusieurs | `CAMARIS_PUBLIC_ORIGINS` | `https://camaris-semaine.vercel.app,https://semaine.camaris.fr` |

Les origines `*.vercel.app` sont aussi acceptées par défaut après déploiement du backend.

Redéployer api-3 après changement.

## 4. Paramètres Longuenesse (filmara admin)

Sur `https://www.filmara.fr/lon/parameters`, le lien affiché vers la page clients utilise `VITE_CAMARIS_PUBLIC_URL` au build **lon** :

Dans `deploy-frontend-lon-ovh-no-pause.bat`, ajoutez :

```bat
set VITE_CAMARIS_PUBLIC_URL=https://VOTRE-URL-VERCEL
```

Puis rebuild `/lon/` et upload OVH.

Les **managers** se connectent via le bouton **Manager** sur la page Vercel uniquement (pas besoin d’ouvrir filmara).

## 5. Cold start Render (~50 s)

La page Vercel s’affiche tout de suite. Le **premier** appel API du jour peut être lent si Render est endormi.

Pistes :

- Cron gratuit qui appelle `https://boulangerie-planning-api-3.onrender.com/health` toutes les 10–14 min (uptimerobot, cron-job.org, etc.)
- Plan Render payant sans spin-down

## 6. Ce qui reste sur filmara.fr/lon

- Paramètres, comptes manager, événements locaux → **admin** sur filmara uniquement
- Page publique clients → **Vercel uniquement**
