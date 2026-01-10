# 🔍 Comment Trouver le Template MongoDB `employee_password`

## 📍 Où se Trouve le Template ?

Le template `employee_password` se trouve dans votre base de données MongoDB pour Longuenesse :
- **Base de données :** `boulangerie-planning-longuenesse`
- **Collection :** `EmailTemplate` ou `emailtemplates`
- **Document à chercher :** `name: "employee_password"`

---

## 🚀 Méthode 1 : Via MongoDB Atlas (Recommandé)

### Étape 1 : Se Connecter à MongoDB Atlas

1. **Allez sur [MongoDB Atlas](https://cloud.mongodb.com/)**
2. **Connectez-vous** avec votre compte MongoDB
3. **Sélectionnez votre cluster** (probablement `Cluster0`)

### Étape 2 : Accéder à la Base de Données

1. **Cliquez sur "Browse Collections"** (ou "Collections" dans le menu de gauche)
2. **Cherchez la base de données** : `boulangerie-planning-longuenesse`
   - Si vous ne la voyez pas, elle n'existe peut-être pas encore (dans ce cas, le template n'existe pas non plus)
3. **Cliquez sur la base de données** pour l'ouvrir

### Étape 3 : Trouver la Collection EmailTemplate

1. **Cherchez la collection** : `EmailTemplate` ou `emailtemplates`
   - Le nom peut varier selon comment Mongoose l'a créée
2. **Cliquez sur la collection** pour voir les documents

### Étape 4 : Chercher le Document `employee_password`

1. **Dans la liste des documents**, cherchez celui avec `name: "employee_password"`
2. **Cliquez dessus** pour voir son contenu

### Étape 5 : Supprimer le Template

Une fois que vous avez trouvé le template, vous pouvez le supprimer :

1. **Cliquez sur le document** pour l'ouvrir
2. **Cliquez sur l'icône de suppression** (corbeille) en haut à droite
3. **Confirmez la suppression**

**OU** utilisez la commande dans la console MongoDB :

```javascript
db.EmailTemplate.deleteOne({ name: "employee_password" })
```

---

## 🖥️ Méthode 2 : Via MongoDB Compass (Application Desktop)

### Étape 1 : Télécharger MongoDB Compass

1. **Allez sur [https://www.mongodb.com/try/download/compass](https://www.mongodb.com/try/download/compass)**
2. **Téléchargez MongoDB Compass** (gratuit)
3. **Installez-le** sur votre ordinateur

### Étape 2 : Se Connecter à MongoDB

1. **Ouvrez MongoDB Compass**
2. **Copiez votre URI MongoDB** depuis Render :
   - Allez dans Render → Service `boulangerie-planning-api-3`
   - Variables d'environnement → `MONGODB_URI`
   - Copiez la valeur (ex: `mongodb+srv://username:password@cluster0.4huietv.mongodb.net/boulangerie-planning-longuenesse?retryWrites=true&w=majority`)
3. **Collez l'URI** dans MongoDB Compass
4. **Cliquez sur "Connect"**

### Étape 3 : Naviguer vers la Collection

1. **Dans la liste de gauche**, cherchez la base de données : `boulangerie-planning-longuenesse`
2. **Cliquez dessus** pour l'ouvrir
3. **Cherchez la collection** : `EmailTemplate` ou `emailtemplates`
4. **Cliquez dessus** pour voir les documents

### Étape 4 : Trouver et Supprimer le Template

1. **Cherchez le document** avec `name: "employee_password"`
   - Vous pouvez utiliser le filtre en haut : `{ name: "employee_password" }`
2. **Cliquez sur le document** pour le voir
3. **Cliquez sur "Delete"** (corbeille) pour le supprimer
4. **Confirmez la suppression**

---

## 🔧 Méthode 3 : Via l'Interface Admin (Si Disponible)

Si vous avez créé une interface admin pour gérer les templates d'email :

1. **Connectez-vous à l'interface admin** (probablement dans l'application web)
2. **Allez dans la section "Templates Email"** ou "Email Templates"
3. **Cherchez le template** `employee_password`
4. **Supprimez-le** via l'interface

---

## 📋 Informations sur le Template

Une fois que vous avez trouvé le template, vous devriez voir quelque chose comme :

```json
{
  "_id": "...",
  "name": "employee_password",
  "displayName": "Email Mot de Passe Salarié",
  "subject": "...",
  "htmlContent": "<p>Email : undefined</p>...",  // ⚠️ Ici le problème
  "textContent": "Email : undefined...",
  "isActive": true,
  ...
}
```

**Le problème :** Le champ `htmlContent` contient probablement `undefined` en dur ou utilise une variable incorrecte.

---

## ✅ Vérification : Le Template Existe-t-il ?

### Comment Savoir si le Template Existe ?

**Option 1 : Vérifier les Logs Render**

Après un envoi d'email, regardez les logs Render :

```
✅ Utilisation du template de la base de données
```

→ **Le template existe** dans MongoDB

**OU**

```
⚠️ Template non trouvé dans la base de données, utilisation du template par défaut
```

→ **Le template n'existe PAS** dans MongoDB (c'est bon, le template par défaut fonctionne)

### Option 2 : Vérifier dans MongoDB

Connectez-vous à MongoDB et cherchez :

```javascript
db.EmailTemplate.find({ name: "employee_password" })
```

Si cette commande retourne un document, le template existe.
Si elle retourne rien (`[]`), le template n'existe pas.

---

## 🎯 Solution Rapide

**Si vous ne trouvez pas le template ou si vous préférez une solution rapide :**

1. **Ne cherchez pas le template** - Le code fonctionnera avec le template par défaut
2. **Modifiez simplement le template EmailJS** pour utiliser `{{{html_message}}}` (3 accolades)
3. **Testez à nouveau** - Ça devrait fonctionner

Le template MongoDB est **optionnel**. Si il n'existe pas, le code utilise automatiquement le template par défaut qui fonctionne correctement.

---

## 📋 Checklist

- [ ] MongoDB Atlas ouvert ou MongoDB Compass installé
- [ ] Connecté à MongoDB avec l'URI correcte
- [ ] Base de données `boulangerie-planning-longuenesse` ouverte
- [ ] Collection `EmailTemplate` ou `emailtemplates` trouvée
- [ ] Document `employee_password` trouvé (ou vérifié qu'il n'existe pas)
- [ ] Template supprimé (si trouvé)

---

## 💡 Astuce

**Si vous n'arrivez pas à accéder à MongoDB**, vous pouvez aussi **vérifier dans les logs Render** pour voir si le template est utilisé. Si les logs disent "Template non trouvé", c'est que le template n'existe pas dans MongoDB, et dans ce cas, le code utilise déjà le template par défaut qui fonctionne !

---

## 🔗 URI MongoDB pour Longuenesse

Votre URI MongoDB devrait ressembler à :

```
mongodb+srv://username:password@cluster0.4huietv.mongodb.net/boulangerie-planning-longuenesse?retryWrites=true&w=majority
```

Vous pouvez la trouver dans Render :
- **Service :** `boulangerie-planning-api-3`
- **Environment Variables :** `MONGODB_URI`

---

**En résumé : Le template se trouve dans MongoDB Atlas → Base `boulangerie-planning-longuenesse` → Collection `EmailTemplate` → Document avec `name: "employee_password"`. Mais si vous ne le trouvez pas, c'est peut-être mieux car le code utilisera le template par défaut qui fonctionne !** 🎉
