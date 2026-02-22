# 🔧 Correction : Lien acompte Arras → Longuenesse

## ❌ Problème

Lorsqu'une salariée d'**Arras** fait une demande d'acompte, l'email de notification contient un lien vers **Longuenesse** (`https://www.filmara.fr/lon/advance-requests`) au lieu d'**Arras** (`https://www.filmara.fr/plan/advance-requests`).

## ✅ Corrections appliquées

### 1. Suppression des remplacements forcés

Le code contenait des remplacements qui convertissaient **toutes** les URLs `/plan/` en `/lon/` avant l'envoi des emails. Ces remplacements ont été supprimés dans :
- `sendViaEmailJS` (traitement global des emails)
- `sendAdvanceRequestNotification` (notification acompte)
- `sendAdvanceRequestConfirmation` (confirmation au salarié)
- `sendAdvanceApproved` (approbation acompte)

### 2. Variable APP_BASE_PATH

Une nouvelle variable d'environnement `APP_BASE_PATH` permet de définir explicitement le magasin :

| Magasin     | Valeur        | URL des liens |
|-------------|---------------|---------------|
| **Arras**   | `APP_BASE_PATH=/plan`   | https://www.filmara.fr/plan/... |
| **Longuenesse** | `APP_BASE_PATH=/lon` | https://www.filmara.fr/lon/... |

## 📋 Configuration Render

### Pour l'API Arras (api-4-pbfy)

Dans **Render Dashboard** → service **boulangerie-planning-api-4-pbfy** → **Environment** :

```
APP_BASE_PATH=/plan
```

### Pour l'API Longuenesse (api-3)

Dans **Render Dashboard** → service **boulangerie-planning-api-3** → **Environment** :

```
APP_BASE_PATH=/lon
```

**Note :** Si `APP_BASE_PATH` n'est pas défini, le système utilise `CORS_ORIGIN` pour détecter le magasin. Quand `CORS_ORIGIN` contient à la fois `/plan` et `/lon`, la variable `APP_BASE_PATH` évite toute ambiguïté.

## 🚀 Déploiement

1. Déployer le code modifié
2. Ajouter `APP_BASE_PATH=/plan` sur l'API Arras (api-4-pbfy)
3. Ajouter `APP_BASE_PATH=/lon` sur l'API Longuenesse (api-3)
4. Render redéploiera automatiquement après modification des variables
