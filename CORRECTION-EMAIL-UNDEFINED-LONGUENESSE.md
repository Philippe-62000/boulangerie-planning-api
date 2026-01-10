# 🔧 Correction : Email "undefined" dans les Identifiants de Connexion

## ❌ Problème Identifié

Dans l'email envoyé, l'adresse email de connexion apparaît comme "undefined" :

```
Email : undefined
```

Au lieu de l'adresse email réelle de l'employé.

---

## 🔍 Cause du Problème

Le problème vient probablement d'un **template dans la base de données MongoDB** qui utilise des variables différentes ou une syntaxe incorrecte.

Le code essaie d'abord d'utiliser un template de la base de données (collection `EmailTemplate` avec `name: 'employee_password'`), et si ce template existe, il remplace les variables. Si ce template utilise une variable différente ou une syntaxe incorrecte, cela peut causer le problème.

---

## ✅ Solution : Vérifier et Corriger le Template dans la Base de Données

### Option 1 : Vérifier le Template dans MongoDB (Recommandé)

1. **Connectez-vous à MongoDB Atlas** (ou votre instance MongoDB)
2. **Naviguez vers la base de données** : `boulangerie-planning-longuenesse`
3. **Collection** : `EmailTemplate` ou `emailtemplates`
4. **Cherchez le document** avec `name: "employee_password"`
5. **Vérifiez le champ `htmlContent`** et cherchez comment l'email est affiché

#### Variables à Chercher

Le template devrait utiliser **UNE de ces variables** :

- `{{employeeEmail}}` ✅ (recommandé)
- `${employeeEmail}` ✅ (syntaxe JavaScript, aussi supportée maintenant)
- `{{email}}` ❌ (incorrect - pas remplacé)
- `{{to_email}}` ❌ (incorrect - pas remplacé)
- `undefined` ❌ (littéral - c'est le problème)

### Option 2 : Supprimer le Template de la Base de Données

Si vous préférez utiliser le template par défaut du code (qui fonctionne correctement) :

1. **Supprimez le template de la base de données** :
   ```javascript
   // Dans MongoDB Compass ou Atlas
   db.EmailTemplate.deleteOne({ name: "employee_password" })
   ```
   
   **OU** via l'API (si vous avez un endpoint pour supprimer les templates)

2. **Le code utilisera automatiquement le template par défaut** qui fonctionne correctement

### Option 3 : Corriger le Template dans la Base de Données

Si vous voulez garder le template de la base de données :

1. **Trouvez le template** dans MongoDB
2. **Modifiez le champ `htmlContent`** pour utiliser `{{employeeEmail}}` :
   ```html
   <p><strong>Email :</strong> {{employeeEmail}}</p>
   ```
   
   **PAS :**
   ```html
   <p><strong>Email :</strong> undefined</p>
   ```
   
   **PAS :**
   ```html
   <p><strong>Email :</strong> {{email}}</p>
   ```
   
   **PAS :**
   ```html
   <p><strong>Email :</strong> ${employeeEmail}</p>
   ```
   (même si cette syntaxe est maintenant supportée, utilisez `{{employeeEmail}}`)

3. **Sauvegardez le template**

---

## 🔧 Code Corrigé (Déjà Appliqué)

Le code a été mis à jour pour :

1. ✅ Vérifier que `employeeEmail` n'est pas undefined avant utilisation
2. ✅ Remplacer à la fois `{{variable}}` et `${variable}` dans les templates
3. ✅ Ajouter des logs de débogage pour identifier le problème
4. ✅ Utiliser une valeur par défaut (chaîne vide) si une variable est undefined

---

## 🧪 Test Après Correction

1. ✅ Vérifiez ou supprimez le template dans MongoDB
2. ✅ Testez l'envoi d'un mot de passe à un employé
3. ✅ Vérifiez les logs Render pour voir quel template est utilisé
4. ✅ Vérifiez que l'email reçu contient bien l'adresse email

---

## 📋 Checklist de Vérification

- [ ] Template `employee_password` vérifié dans MongoDB
- [ ] Template utilise `{{employeeEmail}}` (et non `{{email}}` ou `undefined`)
- [ ] Template supprimé OU corrigé
- [ ] Backend redéployé (si nécessaire)
- [ ] Test d'envoi de mot de passe effectué
- [ ] Email reçu avec l'adresse email correcte (pas "undefined")

---

## 🔍 Logs à Vérifier dans Render

Après un envoi d'email, vérifiez les logs Render :

```
📧 Envoi mot de passe salarié: {
  employeeName: "Test",
  employeeEmail: "test@example.com",  // Doit être défini
  hasPassword: true,
  loginUrl: "..."
}
```

Si vous voyez :
```
✅ Utilisation du template de la base de données
```

Alors le template MongoDB est utilisé. Vérifiez ce template.

Si vous voyez :
```
⚠️ Template non trouvé dans la base de données, utilisation du template par défaut
```

Alors le template par défaut est utilisé (qui fonctionne correctement).

---

## 🎯 Solution Rapide (Recommandée)

**Supprimez simplement le template de la base de données MongoDB** pour que le code utilise le template par défaut qui fonctionne correctement :

```javascript
// Dans MongoDB Compass ou Atlas
db.EmailTemplate.deleteOne({ name: "employee_password" })
```

Après suppression, le code utilisera automatiquement `generateEmployeePasswordHTML` qui génère correctement le HTML avec l'email.

---

**Une fois le template corrigé ou supprimé, l'email devrait afficher correctement l'adresse email au lieu de "undefined" !** 🎉
