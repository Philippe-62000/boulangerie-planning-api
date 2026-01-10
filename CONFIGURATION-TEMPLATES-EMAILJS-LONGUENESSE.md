# 📧 Configuration des Templates EmailJS pour Longuenesse

## ❌ Problème Actuel

Les emails envoyés affichent le HTML en texte brut au lieu d'être rendu correctement :
```
<!DOCTYPE html> <html lang="fr"> ...
```

**Cause :** Le template EmailJS n'utilise pas correctement la variable `{{html_message}}` pour afficher le contenu HTML.

---

## ✅ Solution : Configurer le Template EmailJS

### Étape 1 : Accéder au Dashboard EmailJS

1. Allez sur [EmailJS Dashboard](https://dashboard.emailjs.com/admin)
2. Connectez-vous avec votre compte EmailJS pour Longuenesse
3. Cliquez sur **"Email Templates"** dans le menu de gauche

### Étape 2 : Identifier le Template Utilisé

Le backend utilise la variable d'environnement `EMAILJS_TEMPLATE_ID` pour déterminer quel template utiliser.

Pour Longuenesse, vérifiez dans Render (service `boulangerie-planning-api-3`) :
- **Variable :** `EMAILJS_TEMPLATE_ID`
- **Valeur actuelle :** `template_xxxxx` (remplacez par votre Template ID)

### Étape 3 : Configurer le Template Correctement

Une fois que vous avez trouvé le bon template, éditez-le :

#### Configuration Minimale (Recommandée)

**Subject (Sujet) :**
```
{{subject}}
```

**Content (Contenu) :**
```
{{html_message}}
```

**⚠️ IMPORTANT :** Utilisez **`{{html_message}}`** et NON `{{message}}`
- `{{html_message}}` = Version HTML complète (à utiliser) ✅
- `{{message}}` = Version texte simple (pour les clients qui ne supportent pas HTML) ❌

#### Configuration Complète avec Version Texte

Si vous voulez aussi une version texte pour les clients email qui ne supportent pas HTML :

**Subject (Sujet) :**
```
{{subject}}
```

**Content (Contenu HTML) :**
```
{{html_message}}
```

**Content (Contenu Texte) :**
```
{{message}}
```

---

## 🔍 Vérification dans EmailJS

### Template "template_password" ou "Template Générique"

Selon les copies d'écran que vous avez fournies, vous avez deux templates dans EmailJS pour Arras :
1. `template_password` - Pour les mots de passe
2. `Réponse Arrêt Maladie` - Pour les arrêts maladie

**Pour Longuenesse, vous devez créer des templates séparés OU utiliser le même template avec `{{html_message}}`.**

### Étape 4 : Vérifier le Contenu du Template

Dans le dashboard EmailJS :

1. Ouvrez votre template (ex: `template_password` ou le template générique)
2. Allez dans l'onglet **"Content"**
3. Vérifiez que le champ **"Content"** contient **`{{html_message}}`**
4. **PAS** `{{message}}` seul (sinon le HTML s'affichera en texte brut)

#### Exemple de Configuration Correcte

**Dans EmailJS Dashboard → Template → Content :**

```
{{html_message}}
```

#### Exemple de Configuration INCORRECTE (à éviter)

```
{{message}}
```

Ou pire :
```
{{html_message}}
{{message}}
```

(Car `{{message}}` est la version texte, pas HTML)

---

## 📝 Variables Disponibles dans le Template

Le backend envoie ces variables au template EmailJS :

| Variable | Description | Exemple |
|----------|-------------|---------|
| `{{subject}}` | Sujet de l'email | "Vos identifiants de connexion" |
| `{{to_email}}` | Email du destinataire | "employe@example.com" |
| `{{html_message}}` | Contenu HTML complet | "<html>...</html>" |
| `{{message}}` | Contenu texte simple | "Bonjour, ..." |
| `{{from_name}}` | Nom de l'expéditeur | "Boulangerie Ange - Longuenesse" |
| `{{from_email}}` | Email de l'expéditeur | "contact@boulangerie.fr" |

**Pour afficher le HTML correctement, utilisez :** `{{html_message}}`

---

## 🎯 Configuration Recommandée pour Longuenesse

### Template Unique pour Tous les Types d'Emails

Si vous utilisez un seul template pour tous les types d'emails (mots de passe, arrêts maladie, etc.) :

**Subject :**
```
{{subject}}
```

**Content :**
```
{{html_message}}
```

**C'est tout !** Le backend envoie déjà le HTML complet et formaté dans `html_message`.

### Templates Séparés par Type d'Email

Si vous préférez créer des templates spécifiques pour chaque type d'email :

#### Template 1 : Mots de Passe (`template_password`)

**Subject :**
```
Vos identifiants de connexion - {{to_name}}
```

**Content :**
```
{{html_message}}
```

#### Template 2 : Arrêts Maladie (`template_sick_leave`)

**Subject :**
```
{{subject}}
```

**Content :**
```
{{html_message}}
```

**Note :** Même avec des templates séparés, utilisez toujours `{{html_message}}` car le backend envoie le HTML complet.

---

## ⚠️ Points Importants

### 1. Utiliser `{{html_message}}` et non `{{message}}`

- ✅ **`{{html_message}}`** = HTML rendu correctement
- ❌ **`{{message}}`** = Texte brut, HTML affiché en texte

### 2. Ne pas Échapper le HTML

EmailJS doit interpréter le HTML directement. Ne mettez PAS de balises HTML supplémentaires autour de `{{html_message}}`.

**Correct :**
```
{{html_message}}
```

**Incorrect :**
```html
<div>
{{html_message}}
</div>
```

(Car `{{html_message}}` contient déjà le HTML complet avec `<html>`, `<body>`, etc.)

### 3. Type de Contenu

Certains templates EmailJS ont un champ séparé pour "HTML Content" et "Text Content". Dans ce cas :
- **HTML Content :** `{{html_message}}`
- **Text Content :** `{{message}}`

---

## 🧪 Test Après Configuration

1. ✅ Modifiez le template dans EmailJS Dashboard
2. ✅ Sauvegardez le template (cliquez sur **"Save"**)
3. ✅ Vérifiez que le template est **"Published"** (publié)
4. ✅ Redéployez le backend (ou attendez le redéploiement automatique)
5. ✅ Testez l'envoi d'un mot de passe ou d'un arrêt maladie
6. ✅ Vérifiez que l'email s'affiche correctement avec le HTML rendu

---

## 📋 Checklist de Configuration

- [ ] Template EmailJS ouvert dans le Dashboard
- [ ] Champ "Subject" contient `{{subject}}`
- [ ] Champ "Content" contient **`{{html_message}}`** (et NON `{{message}}`)
- [ ] Template sauvegardé
- [ ] Template publié (Published)
- [ ] Template ID noté et vérifié dans Render
- [ ] Backend redéployé (ou redéploiement automatique en attente)
- [ ] Test d'envoi effectué
- [ ] Email reçu avec HTML correctement rendu

---

## 🔗 Liens Utiles

- [EmailJS Dashboard](https://dashboard.emailjs.com/admin)
- [EmailJS Documentation - Templates](https://www.emailjs.com/docs/user-guide/creating-email-templates/)
- [EmailJS Documentation - Template Variables](https://www.emailjs.com/docs/user-guide/template-variables/)

---

## 🐛 Problèmes Courants

### Problème : Le HTML s'affiche toujours en texte brut

**Solutions :**
1. Vérifiez que le template utilise **`{{html_message}}`** et non `{{message}}`
2. Vérifiez que le template est **publié** (Published)
3. Vérifiez que le Template ID dans Render correspond au bon template
4. Vérifiez les logs Render pour voir quelles variables sont envoyées

### Problème : Les variables ne s'affichent pas

**Solutions :**
1. Vérifiez la syntaxe exacte : `{{nom_variable}}` (sans espaces)
2. Vérifiez que le nom de la variable correspond à celle envoyée par le backend
3. Utilisez l'onglet "Test it" dans EmailJS pour tester le template

### Problème : Le template n'est pas utilisé

**Solutions :**
1. Vérifiez que `EMAILJS_TEMPLATE_ID` dans Render correspond au Template ID d'EmailJS
2. Vérifiez que le template est publié
3. Vérifiez les logs Render pour voir quel template ID est utilisé

---

## 📞 Support

Si vous avez encore des problèmes :
1. Vérifiez les logs Render pour voir les erreurs
2. Testez le template directement dans EmailJS avec "Test it"
3. Vérifiez la documentation EmailJS
4. Contactez le support EmailJS si nécessaire

---

Une fois configuré correctement, les emails s'afficheront avec un rendu HTML parfait ! 🎉
