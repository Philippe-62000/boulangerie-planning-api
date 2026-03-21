# Configuration OAuth Google pour Commandes en ligne (Longuenesse & Arras)

Pour que la connexion Google fonctionne avec les feuilles partagées par l'école, configurez OAuth 2.0 :

## 1. Google Cloud Console

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un projet ou sélectionnez-en un
3. Activez **Google Sheets API** (obligatoire)

## 2. Écran de consentement OAuth

1. **APIs & Services** → **OAuth consent screen**
2. Type : **Externe** (ou Interne si vous avez un Workspace)
3. Remplissez : Nom de l'application, email de support
4. **Scopes** : ajoutez au minimum (comme dans le code backend) :
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/drive.readonly` (accès aux fichiers Drive liés aux feuilles partagées)
   - `https://www.googleapis.com/auth/userinfo.email`

   Après ajout de scopes : les **anciens** jetons (refresh token) ne contiennent pas les nouveaux droits — il faut **Déconnecter** puis **Connecter Google** sur la page Commandes.
5. En mode **Test**, ajoutez les comptes Google autorisés (utilisateurs de test).

## 3. Identifiants OAuth

1. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
2. Type : **Web application**
3. **Authorized redirect URIs** : ajoutez **les deux** URLs de callback (Longuenesse + Arras si vous utilisez deux API Render) :

   ```
   https://boulangerie-planning-api-3.onrender.com/api/online-orders/auth/google/callback
   https://boulangerie-planning-api-4-pbfy.onrender.com/api/online-orders/auth/google/callback
   ```

   (Adaptez le host si vos services Render ont d’autres noms.)

4. Créez et récupérez **Client ID** et **Client Secret**

## 4. Variables d'environnement (Render / serveur)

Sur **chaque** service API qui expose `/api/online-orders` :

```
GOOGLE_CLIENT_ID=votre_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre_client_secret
GOOGLE_OAUTH_REDIRECT_URI=https://<votre-api>/api/online-orders/auth/google/callback
```

Important : `GOOGLE_OAUTH_REDIRECT_URI` doit correspondre **exactement** à l’URI enregistrée pour ce service (api-3 vs api-4).

Optionnel :

```
API_BASE_URL=https://<votre-api>.onrender.com
FRONTEND_URL=https://www.filmara.fr
```

## 5. Après changement des scopes

Les tokens déjà stockés en base peuvent être **invalides**. Sur la page **Commandes en ligne** : **Déconnecter Google**, puis **Connecter Google** à nouveau pour obtenir un refresh token avec les bons scopes.

## 6. Utilisation

1. Connectez-vous à l’app avec le compte autorisé
2. Allez dans **Commandes en ligne** (`/lon/...` ou `/plan/...`)
3. Cliquez sur **Connecter Google**
4. Les Google Sheets partagés avec ce compte seront accessibles
