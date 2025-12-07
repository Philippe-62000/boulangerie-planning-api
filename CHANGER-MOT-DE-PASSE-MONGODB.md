# 🔐 Comment Changer le Mot de Passe MongoDB

## 📍 Étape 1 : Changer le Mot de Passe dans MongoDB Atlas

### 1.1. Accéder à MongoDB Atlas

1. Allez sur https://cloud.mongodb.com
2. Connectez-vous avec votre compte
3. Sélectionnez votre projet/cluster

### 1.2. Aller dans Database Access

1. Dans le menu de gauche, cliquez sur **Security** → **Database Access**
   - Ou allez directement sur : https://cloud.mongodb.com/v2/68a190e2a87cb0633ac09252#/security/database

### 1.3. Trouver l'Utilisateur

1. Dans la liste des utilisateurs, trouvez l'utilisateur **`phimjc`**
2. Cliquez sur les **3 points** (⋯) à droite de l'utilisateur
3. Cliquez sur **Edit** ou **Change Password**

### 1.4. Générer un Nouveau Mot de Passe

**Option A : Laisser MongoDB générer automatiquement**
1. Cliquez sur **Autogenerate Secure Password**
2. MongoDB génère un mot de passe fort
3. **⚠️ IMPORTANT : Copiez immédiatement ce mot de passe !** Vous ne pourrez plus le voir après
4. Cliquez sur **Update User**

**Option B : Créer votre propre mot de passe**
1. Cliquez sur **Set Custom Password**
2. Entrez un mot de passe fort (minimum 12 caractères, lettres + chiffres + symboles)
3. Confirmez le mot de passe
4. Cliquez sur **Update User**

**Exemple de mot de passe fort :**
```
MySecureMongoDB2025!@#
```

---

## 📍 Étape 2 : Encoder le Mot de Passe pour l'URI

Si votre nouveau mot de passe contient des caractères spéciaux, vous devez les encoder dans l'URI MongoDB :

| Caractère | Encodage |
|-----------|----------|
| `@` | `%40` |
| `#` | `%23` |
| `$` | `%24` |
| `%` | `%25` |
| `&` | `%26` |
| `+` | `%2B` |
| `=` | `%3D` |
| `/` | `%2F` |
| `?` | `%3F` |
| `:` | `%3A` |

**Exemple :**
- Mot de passe : `MyPass@2025#`
- Mot de passe encodé : `MyPass%402025%23`

---

## 📍 Étape 3 : Mettre à Jour dans Render - Arras (api-4-pbfy)

### 3.1. Accéder aux Variables d'Environnement

1. Allez sur https://dashboard.render.com
2. Sélectionnez le service **`boulangerie-planning-api-4-pbfy`**
3. Allez dans **Environment** → **Environment Variables**

### 3.2. Modifier MONGODB_URI

1. Trouvez la variable **`MONGODB_URI`**
2. Cliquez sur l'icône **Edit** (crayon) à droite
3. Vous verrez quelque chose comme :
   ```
   mongodb+srv://phimjc:ZDOPZA2Kd8ylewoR@cluster0.4huietv.mongodb.net/boulangerie-planning?retryWrites=true&w=majority
   ```

4. Remplacez `ZDOPZA2Kd8ylewoR` par votre nouveau mot de passe (encodé si nécessaire)

   **Exemple avec nouveau mot de passe `MySecure2025!` :**
   ```
   mongodb+srv://phimjc:MySecure2025!@cluster0.4huietv.mongodb.net/boulangerie-planning?retryWrites=true&w=majority
   ```

   **Exemple avec nouveau mot de passe `MyPass@2025#` (avec caractères spéciaux) :**
   ```
   mongodb+srv://phimjc:MyPass%402025%23@cluster0.4huietv.mongodb.net/boulangerie-planning?retryWrites=true&w=majority
   ```

5. Cliquez sur **Save Changes**

---

## 📍 Étape 4 : Mettre à Jour dans Render - Longuenesse (api-3)

### 4.1. Accéder aux Variables d'Environnement

1. Allez sur https://dashboard.render.com
2. Sélectionnez le service **`boulangerie-planning-api-3`**
3. Allez dans **Environment** → **Environment Variables**

### 4.2. Modifier MONGODB_URI

1. Trouvez la variable **`MONGODB_URI`**
2. Cliquez sur l'icône **Edit** (crayon) à droite
3. Vous verrez quelque chose comme :
   ```
   mongodb+srv://phimjc:ZDOPZA2Kd8ylewoR@cluster0.4huietv.mongodb.net/boulangerie-planning-longuenesse?retryWrites=true&w=majority
   ```

4. Remplacez `ZDOPZA2Kd8ylewoR` par le **même nouveau mot de passe** que pour Arras (encodé si nécessaire)

   **Exemple :**
   ```
   mongodb+srv://phimjc:MySecure2025!@cluster0.4huietv.mongodb.net/boulangerie-planning-longuenesse?retryWrites=true&w=majority
   ```

5. Cliquez sur **Save Changes**

---

## 🔄 Étape 5 : Redémarrer les Services

Après avoir mis à jour les variables :

### 5.1. Redémarrer Arras

1. Dans Render Dashboard → `boulangerie-planning-api-4-pbfy`
2. Cliquez sur **Manual Deploy** → **Deploy latest commit**
3. Attendez 2-3 minutes

### 5.2. Redémarrer Longuenesse

1. Dans Render Dashboard → `boulangerie-planning-api-3`
2. Cliquez sur **Manual Deploy** → **Deploy latest commit**
3. Attendez 2-3 minutes

---

## ✅ Étape 6 : Vérifier que Ça Fonctionne

### 6.1. Vérifier les Logs Render

Dans les logs de chaque service, vous devriez voir :
```
✅ Connected to MongoDB
✅ Server running on port...
```

**Si vous voyez des erreurs de connexion :**
- Vérifiez que le mot de passe est correct
- Vérifiez que les caractères spéciaux sont bien encodés
- Vérifiez que l'utilisateur MongoDB a toujours les droits

### 6.2. Tester l'Application

1. Testez Arras : https://www.filmara.fr/plan
2. Testez Longuenesse : https://www.filmara.fr/lon
3. Vérifiez que les données se chargent correctement

---

## 🆘 En Cas de Problème

### Erreur "Authentication failed"

**Cause :** Le mot de passe est incorrect ou mal encodé

**Solution :**
1. Vérifiez le mot de passe dans MongoDB Atlas
2. Vérifiez l'encodage des caractères spéciaux dans l'URI
3. Testez l'URI avec un outil en ligne : https://www.mongodb.com/try/download/compass

### Erreur "User not found"

**Cause :** L'utilisateur a été supprimé par erreur

**Solution :**
1. Allez dans MongoDB Atlas → Database Access
2. Cliquez sur **Add New Database User**
3. Créez un nouvel utilisateur avec les mêmes droits
4. Utilisez le nouveau nom d'utilisateur dans l'URI

### L'Application ne se Connecte Plus

**Solution :**
1. Vérifiez les logs Render pour voir l'erreur exacte
2. Vérifiez que les deux services (Arras et Longuenesse) utilisent le même mot de passe
3. Vérifiez que l'utilisateur MongoDB a les droits sur les deux bases :
   - `boulangerie-planning` (Arras)
   - `boulangerie-planning-longuenesse` (Longuenesse)

---

## 📋 Checklist

- [ ] Mot de passe MongoDB changé dans MongoDB Atlas
- [ ] Mot de passe copié et sauvegardé en sécurité
- [ ] Caractères spéciaux encodés (si nécessaire)
- [ ] `MONGODB_URI` mis à jour dans Render (Arras)
- [ ] `MONGODB_URI` mis à jour dans Render (Longuenesse)
- [ ] Service Arras redémarré
- [ ] Service Longuenesse redémarré
- [ ] Logs vérifiés (pas d'erreurs)
- [ ] Application testée (données se chargent)

---

## 💡 Astuce : Tester l'URI Avant de Mettre à Jour

Vous pouvez tester votre nouvelle URI MongoDB avant de la mettre dans Render :

1. Allez sur https://www.mongodb.com/try/download/compass
2. Téléchargez MongoDB Compass (gratuit)
3. Connectez-vous avec votre nouvelle URI
4. Si la connexion fonctionne, l'URI est correcte !







