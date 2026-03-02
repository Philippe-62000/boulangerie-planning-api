# Configuration OAuth Google pour Commandes en ligne (Longuenesse)

Pour que la connexion Google fonctionne avec les feuilles partagées par l'école, configurez OAuth 2.0 :

## 1. Google Cloud Console

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un projet ou sélectionnez-en un
3. Activez **Google Sheets API** et **Google People API** (pour l'email)

## 2. Écran de consentement OAuth

1. **APIs & Services** → **OAuth consent screen**
2. Type : **Externe** (ou Interne si vous avez un Workspace)
3. Remplissez : Nom de l'application, email de support
4. Scopes : ajoutez `.../auth/spreadsheets.readonly` et `.../auth/userinfo.email`
5. Utilisateurs de test : ajoutez `longuenesse.boulangerie.ange@gmail.com` (en mode test)

## 3. Identifiants OAuth

1. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
2. Type : **Web application**
3. Nom : "Boulangerie Commandes"
4. **Authorized redirect URIs** : ajoutez exactement :
   ```
   https://boulangerie-planning-api-3.onrender.com/api/online-orders/auth/google/callback
   ```
5. Créez et récupérez **Client ID** et **Client Secret**

## 4. Variables d'environnement (Render / serveur)

Ajoutez sur le service Longuenesse (boulangerie-planning-api-3) :

```
GOOGLE_CLIENT_ID=votre_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre_client_secret
```

Optionnel :
```
API_BASE_URL=https://boulangerie-planning-api-3.onrender.com
FRONTEND_URL=https://www.filmara.fr
```

## 5. Utilisation

1. Connectez-vous à l'app avec **longuenesse.boulangerie.ange@gmail.com**
2. Allez dans **Commandes en ligne**
3. Cliquez sur **Connecter Google**
4. Autorisez l'accès aux feuilles
5. Les Google Sheets partagés avec ce compte seront accessibles
