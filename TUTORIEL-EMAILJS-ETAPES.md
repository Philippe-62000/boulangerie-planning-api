# 📧 Tutoriel EmailJS - Étapes Détaillées

## 🔍 1. Où Trouver le EMAILJS_USER_ID

### Méthode 1 : Dans le Dashboard EmailJS

1. **Connectez-vous** à [https://www.emailjs.com/](https://www.emailjs.com/)
2. Cliquez sur votre **nom d'utilisateur** en haut à droite
3. Allez dans **Account Settings** ou **General**
4. Vous verrez votre **User ID** affiché (ex: `EHw0fFSAwQ_4SfY6Z`)

### Méthode 2 : Dans la Documentation

1. Allez dans **Account** → **General**
2. Le **User ID** est affiché en haut de la page
3. **Copiez-le** (il ressemble à : `EHw0fFSAwQ_4SfY6Z`)

### Méthode 3 : Dans les Exemples de Code

1. Allez dans **Email Templates**
2. Créez un template
3. Dans l'onglet **Code**, vous verrez votre User ID dans l'exemple de code

**📝 Votre User ID :** `_________________`

---

## 📝 2. Comment Ajouter les Variables dans le Template EmailJS

### Étape 1 : Créer/Modifier un Template

1. Allez dans **Email Templates**
2. Cliquez sur **Create New Template** (ou modifiez un template existant)
3. Vous verrez deux onglets : **Visual** et **Code**

---

### Étape 2 : Ajouter les Variables dans le Template

#### Option A : Mode Visual (Recommandé pour débutants)

1. Cliquez sur l'onglet **Visual**
2. Dans le champ **Subject**, tapez : `{{subject}}`
3. Dans le champ **Content**, vous pouvez :
   - Soit taper directement : `{{html_message}}`
   - Soit utiliser l'éditeur visuel et insérer les variables

**Pour insérer une variable dans l'éditeur visuel :**
- Cliquez sur le bouton **Insert Variable** (ou `{{ }}`)
- Tapez le nom de la variable (ex: `html_message`)
- Ou sélectionnez-la dans la liste

#### Option B : Mode Code (Plus de contrôle)

1. Cliquez sur l'onglet **Code**
2. Vous verrez le code HTML du template
3. Modifiez-le comme suit :

**Subject (Sujet) :**
```
{{subject}}
```

**Content (Contenu HTML) :**
```html
{{html_message}}
```

**Content (Contenu Texte - optionnel) :**
```
{{message}}
```

---

### Étape 3 : Configuration Complète du Template

Voici un exemple complet de template :

#### **Subject (Sujet de l'email) :**
```
{{subject}}
```

#### **Content (Contenu HTML) :**
```html
{{html_message}}
```

#### **Content (Contenu Texte - pour les clients qui ne supportent pas HTML) :**
```
{{message}}
```

**C'est tout !** L'application envoie déjà le HTML complet dans `html_message`, donc vous n'avez pas besoin de créer un template complexe.

---

### Étape 4 : Variables Disponibles

Voici toutes les variables que l'application peut envoyer :

| Variable | Description | Exemple |
|----------|-------------|---------|
| `{{subject}}` | Sujet de l'email | "Accusé de réception - Arrêt maladie" |
| `{{to_email}}` | Email du destinataire | "employe@example.com" |
| `{{html_message}}` | Contenu HTML complet | "<html>...</html>" |
| `{{message}}` | Contenu texte simple | "Bonjour, ..." |
| `{{from_name}}` | Nom de l'expéditeur | "Boulangerie Ange - Longuenesse" |
| `{{from_email}}` | Email de l'expéditeur | "contact@boulangerie.fr" |

---

### Étape 5 : Publier le Template

1. Une fois le template configuré, cliquez sur **Save**
2. Le template est automatiquement publié
3. **Notez le Template ID** (ex: `template_xyz789`)

**📝 Votre Template ID :** `_________________`

---

## 🎯 Configuration Minimale (Recommandée)

Pour simplifier, voici la configuration minimale :

### **Subject :**
```
{{subject}}
```

### **Content (HTML) :**
```
{{html_message}}
```

### **Content (Text) :**
```
{{message}}
```

**C'est suffisant !** L'application gère déjà tout le formatage HTML.

---

## 📸 Guide Visuel (Étapes dans EmailJS)

### Étape 1 : Créer le Template

```
Email Templates → Create New Template
```

### Étape 2 : Configurer le Subject

```
Subject: {{subject}}
```

### Étape 3 : Configurer le Content

```
Content (HTML): {{html_message}}
Content (Text): {{message}}
```

### Étape 4 : Sauvegarder

```
Save → Template publié automatiquement
```

---

## ✅ Checklist

- [ ] User ID récupéré depuis Account → General
- [ ] Template créé dans Email Templates
- [ ] Subject configuré : `{{subject}}`
- [ ] Content HTML configuré : `{{html_message}}`
- [ ] Content Text configuré : `{{message}}` (optionnel)
- [ ] Template sauvegardé et publié
- [ ] Template ID noté

---

## 🔍 Vérification

Pour vérifier que votre template est correct :

1. Dans EmailJS, allez dans **Email Templates**
2. Cliquez sur votre template
3. Vérifiez que :
   - Le Subject contient `{{subject}}`
   - Le Content contient `{{html_message}}`
   - Le template est **Published** (publié)

---

## 💡 Astuce

**Vous n'avez PAS besoin de créer un template HTML complexe !**

L'application envoie déjà le HTML complet et formaté dans la variable `html_message`. Votre template EmailJS doit simplement afficher cette variable.

C'est pourquoi un template minimal suffit :
- Subject : `{{subject}}`
- Content : `{{html_message}}`

---

## 🐛 Problèmes Courants

### Problème : Les variables ne s'affichent pas

**Solution :**
- Vérifiez que vous utilisez la syntaxe exacte : `{{nom_variable}}`
- Vérifiez qu'il n'y a pas d'espaces : `{{ subject }}` ❌ → `{{subject}}` ✅

### Problème : Le template ne fonctionne pas

**Solution :**
- Vérifiez que le template est **Published** (publié)
- Vérifiez que vous utilisez le bon Template ID dans Render

---

## 📞 Besoin d'Aide ?

Si vous avez des problèmes :
1. Vérifiez la documentation EmailJS : [https://www.emailjs.com/docs/](https://www.emailjs.com/docs/)
2. Contactez le support EmailJS
3. Vérifiez les logs Render pour les erreurs

---

Une fois configuré, votre template est prêt à recevoir les emails de l'application ! 🎉













