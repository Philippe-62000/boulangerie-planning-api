# 🔧 Correction du Template EmailJS `template_ti7474g` pour Longuenesse

## ❌ Problème Identifié

**Template ID utilisé dans Render :** `template_ti7474g`

Ce template est probablement configuré avec `{{message}}` au lieu de `{{html_message}}`, ce qui fait que le HTML s'affiche en texte brut au lieu d'être rendu correctement.

---

## ✅ Solution : Corriger le Template `template_ti7474g` dans EmailJS

### Étape 1 : Accéder au Template dans EmailJS

1. Allez sur [EmailJS Dashboard](https://dashboard.emailjs.com/admin)
2. Connectez-vous avec votre compte EmailJS pour Longuenesse
3. Dans le menu de gauche, cliquez sur **"Email Templates"**
4. Trouvez et cliquez sur le template avec l'ID `template_ti7474g`

**Note :** L'ID complet peut être `template_ti7474g` ou simplement `ti7474g` selon l'affichage dans EmailJS.

### Étape 2 : Vérifier la Configuration Actuelle

Une fois dans le template `template_ti7474g`, vérifiez :

#### Onglet "Content" (Contenu)

**Champ "Subject" (Sujet) :**
```
{{subject}}
```

**Champ "Content" (Contenu) :**
```
{{message}}  ❌ PROBLÈME ICI
```

**OU peut-être :**
```
Bonjour {{to_name}},
{{message}}
...
```

---

## ✅ Solution : Modifier le Template

### Configuration Correcte

**Subject (Sujet) :**
```
{{subject}}
```

**Content (Contenu) :**
```
{{html_message}}
```

**⚠️ IMPORTANT :** 
- Remplacez `{{message}}` par `{{html_message}}`
- `{{message}}` = Version texte (affichage en texte brut)
- `{{html_message}}` = Version HTML (affichage correct)

---

## 🔍 Étapes de Correction Détaillées

### 1. Ouvrir le Template `template_ti7474g`

1. Dans EmailJS Dashboard, allez dans **"Email Templates"**
2. Recherchez le template avec l'ID `ti7474g` ou `template_ti7474g`
3. Cliquez dessus pour l'éditer

### 2. Modifier le Champ Content

1. Cliquez sur l'onglet **"Content"** (si ce n'est pas déjà fait)
2. Dans le champ **"Content"** (Desktop), vous verrez probablement quelque chose comme :

```
{{message}}
```

**OU :**

```
Bonjour {{to_name}},
{{message}}
...
```

3. **Remplacez `{{message}}` par `{{html_message}}`**

**Avant (Incorrect) :**
```
{{message}}
```

**Après (Correct) :**
```
{{html_message}}
```

### 3. Sauvegarder le Template

1. Cliquez sur le bouton **"Save"** (en haut à droite)
2. Le template est automatiquement publié après la sauvegarde

### 4. Vérifier que le Template est Publié

1. Assurez-vous que le template est bien **"Published"** (publié)
2. Si ce n'est pas le cas, publiez-le

---

## 📋 Configuration Complète Recommandée

### Template `template_ti7474g` - Configuration Minimale

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

### Alternative : Configuration avec Version Texte

Si vous voulez aussi une version texte pour les clients email qui ne supportent pas HTML :

**Subject (Sujet) :**
```
{{subject}}
```

**Content HTML (Contenu HTML) :**
```
{{html_message}}
```

**Content Text (Contenu Texte) :**
```
{{message}}
```

**Note :** EmailJS utilise automatiquement la version HTML si disponible, sinon la version texte.

---

## ⚠️ Points Importants

### 1. Ne pas Mélanger `{{message}}` et `{{html_message}}`

**Incorrect :**
```
{{html_message}}
{{message}}
```

**Correct :**
```
{{html_message}}
```

### 2. Ne pas Ajouter de HTML Supplémentaire

Le backend envoie déjà le HTML complet dans `{{html_message}}`, donc ne mettez PAS :

**Incorrect :**
```html
<div>
{{html_message}}
</div>
```

**Correct :**
```
{{html_message}}
```

(Car `{{html_message}}` contient déjà `<html>`, `<body>`, etc.)

### 3. Utiliser `{{html_message}}` pour le Contenu Principal

Le champ **Content** principal doit utiliser `{{html_message}}`, pas `{{message}}`.

---

## 🧪 Test Après Correction

1. ✅ Modifiez le template `template_ti7474g` dans EmailJS
2. ✅ Remplacez `{{message}}` par `{{html_message}}` dans le champ Content
3. ✅ Sauvegardez le template
4. ✅ Vérifiez que le template est publié
5. ✅ Attendez quelques secondes (synchronisation EmailJS)
6. ✅ Testez l'envoi d'un email depuis l'application Longuenesse
7. ✅ Vérifiez que l'email reçu affiche le HTML correctement

---

## 🔍 Vérification dans EmailJS Dashboard

Après modification, vérifiez que :

- [ ] Template `template_ti7474g` ouvert dans EmailJS
- [ ] Onglet "Content" sélectionné
- [ ] Champ "Subject" contient `{{subject}}`
- [ ] Champ "Content" contient **`{{html_message}}`** (et NON `{{message}}`)
- [ ] Template sauvegardé
- [ ] Template publié (Published)
- [ ] Template ID noté : `template_ti7474g`
- [ ] Template ID dans Render : `template_ti7474g` (correspond)

---

## 🐛 Si le Problème Persiste

### Vérification 1 : Template ID Correspond

Vérifiez que le Template ID dans Render correspond bien au template modifié :

**Dans Render :**
```
EMAILJS_TEMPLATE_ID=template_ti7474g
```

**Dans EmailJS :**
- Template ID visible : `ti7474g` ou `template_ti7474g`

### Vérification 2 : Logs Render

Vérifiez les logs Render lors d'un envoi d'email :

```javascript
📧 Données EmailJS: {
  templateId: "template_ti7474g",  // Doit correspondre
  ...
}
```

### Vérification 3 : Template Publié

Assurez-vous que le template `template_ti7474g` est bien **publié** (Published) dans EmailJS.

### Vérification 4 : Synchronisation

Après modification, attendez quelques secondes pour que EmailJS synchronise les changements avant de tester.

---

## 📞 Support

Si après toutes ces vérifications le problème persiste :

1. Vérifiez les logs Render pour voir les erreurs
2. Testez le template directement dans EmailJS avec "Test it"
3. Vérifiez la documentation EmailJS
4. Contactez le support EmailJS si nécessaire

---

**Une fois le template `template_ti7474g` corrigé avec `{{html_message}}`, les emails s'afficheront correctement avec le HTML rendu !** 🎉
