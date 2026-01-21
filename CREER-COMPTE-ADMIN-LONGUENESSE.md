# 🔐 Créer le Compte Admin pour Longuenesse

## 🎯 Problème

Dans la base de données MongoDB pour Longuenesse, il n'y a qu'un seul utilisateur : **"salarié"**. Il manque le compte **"admin"** pour pouvoir se connecter en tant qu'administrateur.

Pour Arras, il y a bien 2 utilisateurs :
- ✅ `admin` avec son mot de passe
- ✅ `salarie` avec son mot de passe

Pour Longuenesse, il n'y a que :
- ❌ `admin` → **MANQUANT**
- ✅ `salarie` avec son mot de passe

---

## ✅ Solution : Ajouter le Compte Admin dans MongoDB

### Méthode 1 : Via MongoDB Atlas (Recommandé)

#### Étape 1 : Se Connecter à MongoDB Atlas

1. Allez sur **[MongoDB Atlas](https://cloud.mongodb.com/)**
2. Connectez-vous avec votre compte
3. Sélectionnez votre cluster (probablement `Cluster0`)

#### Étape 2 : Accéder à la Base de Données Longuenesse

1. Cliquez sur **"Browse Collections"** (ou "Collections" dans le menu de gauche)
2. Cherchez la base de données : **`boulangerie-planning-longuenesse`**
3. Cliquez dessus pour l'ouvrir

#### Étape 3 : Trouver la Collection `users`

1. Cherchez la collection : **`users`** ou **`Users`**
   - Le nom peut varier selon comment Mongoose l'a créée
   - Généralement : `users` (minuscule)
2. Cliquez sur la collection pour voir les documents existants

#### Étape 4 : Vérifier le Compte Salarié Existant

Vous devriez voir un document avec :
```json
{
  "username": "salarie",
  "password": "...",
  "role": "employee",
  ...
}
```

#### Étape 5 : Ajouter le Compte Admin

1. Cliquez sur le bouton **"Insert Document"** (ou "Add Data" → "Insert Document")
2. Cliquez sur **"{} JSON"** pour entrer en mode JSON
3. Collez ce JSON :

```json
{
  "username": "admin",
  "password": "admin2024",
  "role": "admin",
  "name": "Administrateur",
  "permissions": ["all"],
  "isActive": true
}
```

4. Cliquez sur **"Insert"**

**📝 Note :** Utilisez le même mot de passe que pour Arras si vous le connaissez, ou `admin2024` si c'est le mot de passe par défaut.

#### Étape 6 : Vérifier que le Compte est Créé

1. Dans la liste des documents, vous devriez maintenant voir :
   - ✅ `admin` (le nouveau compte)
   - ✅ `salarie` (l'ancien compte)

2. Vérifiez que le document admin a bien :
   - `username: "admin"`
   - `role: "admin"`
   - `isActive: true`

---

### Méthode 2 : Via MongoDB Compass (Application Desktop)

#### Étape 1 : Télécharger MongoDB Compass

1. Allez sur **[https://www.mongodb.com/try/download/compass](https://www.mongodb.com/try/download/compass)**
2. Téléchargez MongoDB Compass (gratuit)
3. Installez-le sur votre ordinateur

#### Étape 2 : Se Connecter à MongoDB

1. Ouvrez MongoDB Compass
2. Copiez votre URI MongoDB depuis Render :
   - Allez dans Render → Service `boulangerie-planning-api-3`
   - Variables d'environnement → `MONGODB_URI`
   - Copiez la valeur : `mongodb+srv://username:password@cluster0.4huietv.mongodb.net/boulangerie-planning-longuenesse?retryWrites=true&w=majority`
3. Collez l'URI dans MongoDB Compass
4. Cliquez sur **"Connect"**

#### Étape 3 : Naviguer vers la Collection

1. Dans la liste de gauche, cherchez la base de données : **`boulangerie-planning-longuenesse`**
2. Cliquez dessus pour l'ouvrir
3. Cherchez la collection : **`users`**
4. Cliquez dessus pour voir les documents

#### Étape 4 : Ajouter le Compte Admin

1. Cliquez sur le bouton **"ADD DATA"** → **"Insert Document"**
2. Sélectionnez **"JSON"**
3. Collez ce JSON :

```json
{
  "username": "admin",
  "password": "admin2024",
  "role": "admin",
  "name": "Administrateur",
  "permissions": ["all"],
  "isActive": true
}
```

4. Cliquez sur **"Insert"**

---

## 🔍 Vérifier le Mot de Passe Admin d'Arras

Si vous voulez utiliser le même mot de passe que pour Arras :

1. Dans MongoDB Atlas, allez dans la base : **`boulangerie-planning`** (Arras)
2. Ouvrez la collection **`users`**
3. Trouvez le document avec `username: "admin"`
4. Notez la valeur du champ **`password`**
5. Utilisez ce même mot de passe lors de la création du compte admin pour Longuenesse

---

## ✅ Vérification : Test de Connexion

Après avoir créé le compte admin :

1. Allez sur **https://www.filmara.fr/lon/**
2. Essayez de vous connecter en tant qu'**admin**
3. Utilisez le mot de passe que vous avez défini

**Si ça fonctionne :** ✅ Le problème est résolu !

**Si ça ne fonctionne pas :**
- Vérifiez que le document a bien été créé dans MongoDB
- Vérifiez que `username: "admin"` (exactement, sans espaces)
- Vérifiez que `role: "admin"` (exactement, sans espaces)
- Vérifiez que `isActive: true`
- Vérifiez le mot de passe

---

## 🆘 En Cas de Problème

### Le compte admin n'apparaît pas dans MongoDB

**Solution :**
1. Vérifiez que vous êtes bien dans la base **`boulangerie-planning-longuenesse`** (pas `boulangerie-planning`)
2. Vérifiez que la collection s'appelle bien **`users`** (pas `Users` ou autre)

### Erreur lors de l'insertion

**Si vous avez une erreur "Duplicate key" :**
- Le compte admin existe peut-être déjà
- Cherchez-le dans la collection avec le filtre : `{ username: "admin" }`

### Le mot de passe ne fonctionne pas

**Solution :**
1. Vérifiez le mot de passe dans MongoDB
2. Le mot de passe est stocké en clair (pas hashé)
3. Assurez-vous de taper exactement le même mot de passe (attention aux majuscules/minuscules)

---

## 📋 Checklist

- [ ] MongoDB Atlas ouvert ou MongoDB Compass installé
- [ ] Connecté à MongoDB avec l'URI correcte
- [ ] Base de données `boulangerie-planning-longuenesse` ouverte
- [ ] Collection `users` trouvée
- [ ] Vérifié le compte salarié existant
- [ ] Créé le compte admin avec les bonnes valeurs
- [ ] Vérifié que `username: "admin"`, `role: "admin"`, `isActive: true`
- [ ] Testé la connexion sur https://www.filmara.fr/lon/

---

## 💡 Astuce

**Pour utiliser le même mot de passe qu'Arras :**

1. Dans MongoDB Atlas → Base `boulangerie-planning` → Collection `users`
2. Trouvez le document `admin`
3. Copiez la valeur du champ `password`
4. Utilisez-la lors de la création du compte admin pour Longuenesse

**Exemple :**
- Si le mot de passe admin d'Arras est `monMotDePasse2024`
- Utilisez exactement `monMotDePasse2024` pour Longuenesse

---

**Une fois le compte admin créé, vous pourrez vous connecter depuis n'importe quel ordinateur !** 🎉
