# Intégrer les messages boulangerie ↔ client sur Vercel

Guide pour le site **commande-longuenesse.vercel.app** (projet Next.js séparé de `boulangerie-planning`).

## Prérequis

1. **Render api-3** déployé avec le commit `8f79fb9` ou plus récent (routes message + reply).
2. **Filmara** : `deploy-frontend-lon/` uploadé (bouton Message côté boulangerie).
3. Le site Vercel utilise déjà le **proxy login** vers Render (`PARTNER_API_UPSTREAM`) — voir `INSTRUCTIONS.txt`.

Les commandes et messages sont stockés dans **MongoDB sur Render**. Vercel lit les mêmes données via l’API Render (pas de sync message séparée).

---

## Étape 1 — Ouvrir le bon projet dans Cursor

1. **Fichier → Ouvrir le dossier** (pas seulement `boulangerie-planning`).
2. Choisir le dépôt du site entreprise (souvent nommé `commande-longuenesse` ou similaire sur GitHub).
3. Vérifier la structure :
   - **App Router** : dossier `app/`
   - **Pages Router** : dossier `pages/`

---

## Étape 2 — Copier le composant Messages

Depuis `boulangerie-planning/partner-commande-vercel-drop-in/` :

| Source | Destination dans le projet Vercel |
|--------|----------------------------------|
| `components/PartnerOrderMessages.jsx` | `components/PartnerOrderMessages.jsx` |

---

## Étape 3 — Route API proxy « réponse client »

Le navigateur appelle `/api/partner-orders/my/ID/reply` sur Vercel ; la route relaie vers Render avec le JWT.

### Si votre projet utilise **App Router** (`app/`)

Copier :

```
partner-commande-vercel-drop-in/app-router/app/api/partner-orders/my/[id]/reply/route.ts
```

Vers :

```
app/api/partner-orders/my/[id]/reply/route.ts
```

Copier aussi (si pas déjà présent) :

```
partner-commande-vercel-drop-in/lib/partnerApiUpstream.ts  →  lib/partnerApiUpstream.ts
```

Ajuster le chemin d’import dans `route.ts` si votre `lib/` n’est pas à la racine (ex. `@/lib/partnerApiUpstream`).

### Si votre projet utilise **Pages Router** (`pages/api/`)

Copier :

```
partner-commande-vercel-drop-in/pages-router/pages/api/partner-orders/my/[id]/reply.ts
```

Vers :

```
pages/api/partner-orders/my/[id]/reply.ts
```

---

## Étape 4 — Trouver la page « Mes commandes »

Dans le projet Vercel, recherche globale (**Ctrl+Shift+F**) :

| Terme à chercher | Fichier typique |
|------------------|-----------------|
| `partner-orders/my` | page qui liste les commandes |
| `Mes commandes` | composant carte commande |
| `localStorage` + `token` | où le JWT est stocké après login |

Exemples de chemins possibles :

- `app/dashboard/page.jsx`
- `app/orders/page.jsx`
- `pages/orders.js`

---

## Étape 5 — Brancher le composant sur chaque commande

### Récupérer le token (comme pour les autres appels API)

Souvent :

```javascript
const token = localStorage.getItem('partnerToken'); // ou clé utilisée chez vous
```

### Importer et afficher

```jsx
import PartnerOrderMessages from '@/components/PartnerOrderMessages';

// Dans le .map() des commandes, sous le détail de la formule :
<PartnerOrderMessages
  order={order}
  token={token}
  site="longuenesse"
  onReplied={(updated) => {
    setOrders((prev) =>
      prev.map((o) =>
        String(o._id || o.id) === String(updated._id || updated.id) ? { ...o, ...updated } : o
      )
    );
  }}
/>
```

- **`apiBase`** : laisser vide (`''`) si vous utilisez la route proxy Vercel (étape 3).
- Si vos appels vont **directement** vers Render depuis le navigateur :  
  `apiBase={process.env.NEXT_PUBLIC_PARTNER_API_UPSTREAM}`  
  (et CORS doit autoriser le domaine Vercel sur Render — déjà le cas en général).

### Recharger les commandes après envoi d’une réponse

Le callback `onReplied` met à jour la commande locale avec `messages` renvoyés par l’API.

Pour être sûr d’avoir les derniers messages, vous pouvez aussi rappeler :

```javascript
const res = await fetch('/api/partner-orders/my?site=longuenesse', {
  headers: { Authorization: `Bearer ${token}` }
});
```

(adaptez l’URL si vous avez déjà un proxy `GET /api/partner-orders/my`).

---

## Étape 6 — Variables Vercel

Dans **Vercel → Project → Settings → Environment Variables** :

| Variable | Valeur |
|----------|--------|
| `PARTNER_API_UPSTREAM` | `https://boulangerie-planning-api-3.onrender.com` (sans slash final) |

Redéployer après toute modification.

---

## Étape 7 — Test de bout en bout

1. **Filmara** `/lon/commande-livraison` → commande « Envoyée » → **Message** → texte test → **Envoyer au client**.
2. Vérifier l’e-mail reçu par le client (lien Vercel).
3. **Se connecter sur Vercel** avec le compte entreprise.
4. Ouvrir la commande : bloc **Messages** avec le texte de la boulangerie + zone **Envoyer ma réponse**.
5. Envoyer une réponse.
6. **Filmara** : badge **1 réponse client** ; ouvrir **Message** → le fil disparaît du dashboard (lu).
7. Ou passer la commande en **Pris en compte** → l’alerte disparaît aussi.

---

## Dépannage

| Problème | Piste |
|----------|--------|
| Pas de bloc Messages | `GET /partner-orders/my` ne renvoie pas `messages` → redéployer Render api-3. |
| 404 sur reply | Route proxy non copiée ou mauvais chemin `[id]`. |
| 401 | Token expiré : se reconnecter sur Vercel. |
| 502 proxy | `PARTNER_API_UPSTREAM` incorrect ou Render en veille. |

---

## Fichiers fournis dans ce dossier

```
partner-commande-vercel-drop-in/
  components/PartnerOrderMessages.jsx
  lib/partnerApiUpstream.ts
  app-router/app/api/partner-orders/my/[id]/reply/route.ts
  pages-router/pages/api/partner-orders/my/[id]/reply.ts
  INTEGRATION-MESSAGES-VERCEL.md   ← ce guide
  INSTRUCTIONS.txt
```
