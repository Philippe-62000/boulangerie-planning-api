# Page « Cette Semaine à Camaris » sur Vercel

Objectif : **URL dédiée aux clients**, sans accès à `filmara.fr` (réservé aux salariés / admin).

Même principe que **https://commande-longuenesse.vercel.app/** :

- **Front statique** → affichage immédiat
- **API serverless Vercel** (`/api/camaris/...`) → MongoDB direct, **pas** Render (pas de cold start ~50 s)

## 1. Build local

```bat
deploy-camaris-vercel.bat
```

Remplit `deploy-camaris-vercel/` : build Vite + copie de `camaris-vercel-api/` (`api/`, `lib/`, `package.json`, `vercel.json`).

Optionnel dans le `.bat` :

- `VITE_CAMARIS_PUBLIC_URL` = URL Vercel finale (lien affiché dans les paramètres Longuenesse)

## 2. Projet Vercel

### Erreur « No Flask entrypoint » / build qui scanne tout le repo

Vercel a déployé la **racine** du monorepo (dossiers `backup-*`, `.py`…) au lieu de Camaris. Corriger :

1. **Settings → General → Root Directory** → `deploy-camaris-vercel` → **Save**
2. **Settings → Build & Development** :
   - **Framework Preset** → **Other**
   - **Build Command** → *(vide)*
   - **Install Command** → `npm install`
   - **Output Directory** → `.`
3. **Redeploy**

Nom du projet Vercel (`camaris-longuenesse`, etc.) ≠ nom du repo GitHub : vous pouvez lier **`boulangerie-planning-api`** avec Root Directory `deploy-camaris-vercel`, sans créer un repo `camaris-longuenesse` séparé.

1. [vercel.com](https://vercel.com) → **Add New Project** → dépôt **`Philippe-62000/boulangerie-planning-api`**
2. **Root Directory** : `deploy-camaris-vercel`
3. **Framework** : Other (ou laisser Vercel détecter `package.json` pour installer les deps API)
4. **Build Command** (CI optionnel) : `deploy-camaris-vercel.bat` depuis la racine, ou build manuel puis push du dossier

### Variables d'environnement (obligatoires)

| Variable | Source |
|----------|--------|
| `MONGODB_URI` | **Identique** à Render **api-3** Longuenesse (`boulangerie-planning-longuenesse`) |
| `JWT_SECRET` | **Identique** à Render api-3 (tokens managers émis par Vercel valides tant que le secret est le même) |

Sans ces variables, les routes `/api/camaris/...` échouent au runtime.

### Déploiement CLI

```bash
cd deploy-camaris-vercel
npx vercel --prod
```

## 3. Routes API (sur Vercel)

| Route | Usage |
|-------|--------|
| `GET /api/camaris/public/board` | Page publique |
| `POST /api/camaris/manager/login` | Connexion manager |
| `GET /api/camaris/manager/week` | Semaine manager |
| `POST /api/camaris/manager/animations` | Créer animation |
| `PUT /api/camaris/manager/animations/:id` | Modifier |
| `DELETE /api/camaris/manager/animations/:id` | Supprimer |

Code source API : dossier `camaris-vercel-api/` (copié dans `deploy-camaris-vercel/` au build).

L’**admin** filmara (`/api/camaris/admin/...`) reste sur **Render api-3** (paramètres managers, événements territoire).

## 4. Paramètres Longuenesse (filmara admin)

Dans `deploy-frontend-lon-ovh-no-pause.bat` :

```bat
set VITE_CAMARIS_PUBLIC_URL=https://camaris-semaine.vercel.app
```

Rebuild `/lon/` et upload OVH.

Les **managers** se connectent via le bouton **Manager** sur la page Vercel.

## 5. Render api-3

`CAMARIS_PUBLIC_ORIGIN` n’est plus nécessaire pour le chargement des données clients (tout passe par Vercel). Utile seulement si un ancien build pointait encore vers Render.

Redéployer api-3 après merge si le backend a évolué (routes admin).

## 6. Maintenance

Modifier la logique dans `camaris-vercel-api/lib/` (ou `backend/` pour l’admin Render), puis relancer `deploy-camaris-vercel.bat` et redéployer Vercel.
