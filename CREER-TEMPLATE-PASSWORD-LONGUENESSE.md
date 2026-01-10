# 📧 Créer un Template `template_password` pour Longuenesse

## ✅ Pourquoi Créer un Template Spécifique ?

Si Arras utilise un template `template_password` dédié aux mots de passe qui fonctionne bien, vous pouvez créer le même type de template pour Longuenesse pour :
- ✅ Avoir une séparation claire des templates par type d'email
- ✅ Permettre des personnalisations différentes si nécessaire
- ✅ Faciliter le débogage

---

## 🎯 Option 1 : Utiliser le Même Template pour Tout (Plus Simple)

**Actuellement**, le code utilise **un seul template EmailJS** (`template_sick_leave`) pour tous les types d'emails. Si ce template utilise `{{html_message}}`, il devrait fonctionner pour :
- ✅ Mots de passe
- ✅ Arrêts maladie
- ✅ Congés
- ✅ Tous les autres types d'emails

**Configuration actuelle dans Render :**
```
EMAILJS_TEMPLATE_ID=template_sick_leave
```

**Si ce template utilise `{{html_message}}`, vous n'avez PAS besoin de créer un nouveau template !**

---

## 🎯 Option 2 : Créer un Template Spécifique `template_password` (Recommandé si Arras l'utilise)

Si vous préférez avoir un template séparé pour les mots de passe (comme Arras), suivez ces étapes :

### Étape 1 : Créer le Template dans EmailJS

1. **Allez sur [EmailJS Dashboard](https://dashboard.emailjs.com/admin)**
2. **Connectez-vous avec votre compte EmailJS pour Longuenesse**
3. **Cliquez sur "Email Templates"** dans le menu de gauche
4. **Cliquez sur "Create New Template"**

### Étape 2 : Configurer le Template `template_password`

**Template Name :**
```
template_password
```

**Subject (Sujet) :**
```
{{subject}}
```

**Content (Contenu) :**
```
{{html_message}}
```

**To Email (Destinataire) :**
```
{{to_email}}
```

**From Name (Nom de l'Expéditeur) :**
```
{{from_name}}
```

**Reply To (Répondre à) :**
```
{{reply_to}}
```

### Étape 3 : Sauvegarder et Noter le Template ID

1. **Cliquez sur "Save"**
2. **Notez le Template ID** (ex: `template_abc123` ou `template_password`)

**📝 Template ID pour Longuenesse :** `_________________`

---

## ⚠️ ATTENTION : Modification du Code Nécessaire

**Actuellement**, le code utilise **une seule variable d'environnement** `EMAILJS_TEMPLATE_ID` pour tous les types d'emails. Si vous créez un template séparé pour les mots de passe, vous devrez **modifier le code** pour utiliser des templates différents selon le type d'email.

### Modification Nécessaire

Il faudrait ajouter une variable d'environnement supplémentaire dans Render :
```
EMAILJS_TEMPLATE_ID_PASSWORD=template_password_longuenesse
```

Et modifier le code pour utiliser cette variable pour les mots de passe.

**⚠️ Cette modification n'est PAS encore implémentée dans le code actuel.**

---

## ✅ Solution Recommandée : Utiliser le Même Template

**Pour l'instant, je recommande d'utiliser le même template `template_sick_leave` pour tous les types d'emails**, car :

1. ✅ Le code actuel utilise un seul template pour tout
2. ✅ Si le template utilise `{{html_message}}`, il fonctionne pour tous les types
3. ✅ Pas besoin de modifier le code
4. ✅ Plus simple à maintenir

### Vérification

Vérifiez que votre template `template_sick_leave` dans EmailJS utilise bien `{{html_message}}` dans le champ Content. Si c'est le cas, il devrait fonctionner correctement pour les mots de passe aussi.

---

## 🔍 Comparaison avec Arras

### Arras

- **Template pour mots de passe :** `template_password`
- **Template pour arrêts maladie :** `template_sick_leave` (ou autre)
- **Configuration :** Probablement des templates séparés OU le code Arras utilise différents templates selon le type

### Longuenesse (Actuel)

- **Template pour tout :** `template_sick_leave`
- **Configuration :** Un seul template pour tous les types d'emails

---

## 📋 Checklist

### Si vous créez un nouveau template `template_password` :

- [ ] Template créé dans EmailJS Dashboard
- [ ] Template configuré avec `{{html_message}}` dans Content
- [ ] Template sauvegardé et publié
- [ ] Template ID noté
- [ ] Variable `EMAILJS_TEMPLATE_ID_PASSWORD` ajoutée dans Render (si modification du code)
- [ ] Code modifié pour utiliser le bon template selon le type d'email
- [ ] Test d'envoi de mot de passe effectué

### Si vous utilisez le même template pour tout :

- [ ] Vérifier que `template_sick_leave` utilise `{{html_message}}` ✅
- [ ] Template est publié ✅
- [ ] Test d'envoi de mot de passe effectué ✅
- [ ] Email reçu avec HTML correctement rendu ✅

---

## 🎯 Ma Recommandation

**Pour l'instant, utilisez le même template `template_sick_leave` pour tous les types d'emails** si ce template utilise `{{html_message}}`. C'est la solution la plus simple et elle devrait fonctionner.

Si vous voulez vraiment créer un template séparé `template_password` comme Arras, il faudra modifier le code pour supporter plusieurs templates. Voulez-vous que je modifie le code pour cela ?

---

**Résumé : Le template actuel `template_sick_leave` devrait fonctionner pour les mots de passe s'il utilise `{{html_message}}`. Pas besoin de créer un nouveau template sauf si vous voulez vraiment une séparation comme Arras.** 🎉
