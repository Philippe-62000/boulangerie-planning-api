# 🔧 Configuration Template EmailJS pour Afficher le HTML

## ❌ Problème Actuel

L'email arrive avec le HTML en texte brut au lieu d'être rendu correctement :
```
<!DOCTYPE html> <html lang="fr"> ...
```

**Cause :** Le template EmailJS n'utilise pas correctement la variable `{{html_message}}` pour afficher le contenu HTML.

---

## ✅ Solution : Configurer le Template EmailJS

### Étape 1 : Accéder au Template

1. Allez sur [EmailJS Dashboard](https://dashboard.emailjs.com/admin)
2. Cliquez sur **"Email Templates"**
3. Trouvez le template `template_ti7474g` (ou celui utilisé pour les mots de passe)
4. Cliquez sur **"Edit"**

### Étape 2 : Configurer le Contenu HTML

Dans le template EmailJS, vous avez deux options :

#### Option A : Utiliser le HTML Complet (Recommandé)

Dans le champ **"Content"** ou **"Message"** du template, utilisez :

```
{{html_message}}
```

**OU** selon votre configuration :

```
{{html_content}}
```

**OU** :

```
{{content}}
```

#### Option B : Créer un Template Personnalisé

Si vous préférez créer votre propre template dans EmailJS :

1. Dans le template, utilisez les variables disponibles :
   - `{{employee_name}}` : Nom de l'employé
   - `{{password}}` : Mot de passe
   - `{{login_url}}` : URL de connexion
   - `{{to_email}}` : Email du destinataire

2. Créez votre propre HTML dans le template EmailJS

---

## 🔍 Vérification

### Dans le Template EmailJS

Le champ **"Content"** doit contenir :

```
{{html_message}}
```

**PAS :**
```
{{message}}
```
(Car `message` contient la version texte, pas HTML)

---

## 📝 Variables Disponibles dans le Template

Le code envoie ces variables au template EmailJS :

- `to_email` : Email du destinataire
- `user_email` : Alternative pour le destinataire
- `subject` : Sujet de l'email
- `message` : Version texte du contenu
- `html_message` : Version HTML du contenu (à utiliser)
- `html_content` : Alternative pour le HTML
- `content` : Alternative pour le HTML
- `from_name` : Nom de l'expéditeur
- `from_email` : Email de l'expéditeur

**Pour afficher le HTML correctement, utilisez :**
```
{{html_message}}
```

---

## 🎯 Configuration Recommandée

### Template EmailJS - Configuration Complète

```
To Email: {{to_email}}
Subject: {{subject}}
Content: {{html_message}}
```

**OU** si EmailJS a un champ séparé pour HTML :

```
To Email: {{to_email}}
Subject: {{subject}}
HTML Content: {{html_message}}
Text Content: {{message}}
```

---

## ⚠️ Points Importants

1. **Utiliser `{{html_message}}`** et non `{{message}}` pour le HTML
2. **Ne pas échapper le HTML** - EmailJS doit interpréter le HTML
3. **Vérifier le type de contenu** - Certains templates ont un champ "HTML" séparé

---

## 🧪 Test Après Configuration

1. Modifiez le template dans EmailJS Dashboard
2. Redéployez le backend (ou attendez le redéploiement automatique)
3. Testez l'envoi de mot de passe
4. Vérifiez que l'email s'affiche correctement avec le HTML rendu

---

## 📋 Checklist

- [ ] Template EmailJS ouvert dans le Dashboard
- [ ] Champ "Content" contient `{{html_message}}`
- [ ] Champ "To Email" contient `{{to_email}}`
- [ ] Champ "Subject" contient `{{subject}}`
- [ ] Template sauvegardé
- [ ] Backend redéployé
- [ ] Test d'envoi effectué

---

## 🔗 Liens Utiles

- [EmailJS Dashboard - Templates](https://dashboard.emailjs.com/admin/template)
- [EmailJS Documentation - HTML Content](https://www.emailjs.com/docs/user-guide/template-variables/)

