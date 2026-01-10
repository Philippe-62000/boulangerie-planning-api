# 🔍 Vérification du Template EmailJS pour Longuenesse

## ✅ Template EmailJS Identifié

D'après votre copie d'écran, le template pour Longuenesse est :
- **Nom :** "Contact Us"
- **Template ID :** `shicigp` (visible dans l'URL : `https://dashboard.emailjs.com/admin/templates/shicigp`)
- **Configuration :** 
  - Subject : `{{subject}}` ✅
  - Content : `{{html_message}}` ✅
  - To Email : `{{to_email}}` ✅

**Le template est correctement configuré !** ✅

---

## ❓ Problème : Pourquoi ça ne fonctionne pas pour Longuenesse ?

Si le template est correctement configuré mais que le HTML s'affiche toujours en texte brut, le problème vient probablement de **la configuration dans Render**.

---

## 🔧 Vérification à Faire dans Render

### Étape 1 : Vérifier le Template ID dans Render

1. Allez dans **Render Dashboard** → Service `boulangerie-planning-api-3`
2. Allez dans **Environment** → **Environment Variables**
3. Vérifiez la variable `EMAILJS_TEMPLATE_ID`

**Valeur Attendue pour Longuenesse :**
```
EMAILJS_TEMPLATE_ID=shicigp
```

**⚠️ IMPORTANT :** 
- Le Template ID doit être **exactement** `shicigp` (celui du template "Contact Us")
- Si vous avez une valeur différente (ex: `template_ti7474g`), c'est le problème !

---

## 🔍 Différence Entre Arras et Longuenesse

### Pourquoi ça fonctionne pour Arras ?

Arras utilise probablement un template différent avec un Template ID différent dans Render. Les deux sites utilisent la **même variable d'environnement** `EMAILJS_TEMPLATE_ID`, donc :

- **Si Arras fonctionne :** Le Template ID dans Render correspond au bon template d'Arras
- **Si Longuenesse ne fonctionne pas :** Le Template ID dans Render ne correspond PAS au template "Contact Us" (`shicigp`)

---

## ✅ Solution

### Option 1 : Utiliser le Même Compte EmailJS (Recommandé)

Si Arras et Longuenesse utilisent le **même compte EmailJS**, vous pouvez :

1. Vérifier que le Template ID `shicigp` ("Contact Us") est bien configuré dans Render pour Longuenesse
2. Utiliser un template différent avec un ID différent si nécessaire

**Mais attention :** Le backend utilise une **seule variable d'environnement** `EMAILJS_TEMPLATE_ID` pour les deux sites. Si vous avez **un seul service Render** qui sert les deux sites, vous ne pouvez pas avoir deux Template IDs différents.

### Option 2 : Vérifier si les Sites Utilisent des Services Render Différents

- **Arras :** Utilise peut-être `boulangerie-planning-api-4` (ou autre)
- **Longuenesse :** Utilise `boulangerie-planning-api-3`

Si c'est le cas, chaque service peut avoir son propre `EMAILJS_TEMPLATE_ID`.

---

## 🔍 Vérifications à Effectuer

### 1. Vérifier le Template ID dans Render pour Longuenesse

Dans Render (service `boulangerie-planning-api-3`) :
```bash
EMAILJS_TEMPLATE_ID=shicigp
```

**Vérifiez aussi :**
- `EMAILJS_SERVICE_ID` = le Service ID EmailJS
- `EMAILJS_USER_ID` = le User ID EmailJS
- `EMAILJS_PRIVATE_KEY` = la Private Key EmailJS

### 2. Vérifier que le Template est Publié dans EmailJS

1. Allez sur [EmailJS Dashboard](https://dashboard.emailjs.com/admin/templates/shicigp)
2. Vérifiez que le template "Contact Us" est **publié** (Published)
3. Vérifiez que le champ **Content** contient bien `{{html_message}}`

### 3. Vérifier les Logs Render

Après un envoi d'email, vérifiez les logs Render pour voir :
- Quel Template ID est utilisé
- Si l'email est bien envoyé
- S'il y a des erreurs

---

## 🎯 Action Immédiate

**Vérifiez maintenant dans Render :**

1. Service : `boulangerie-planning-api-3`
2. Variable : `EMAILJS_TEMPLATE_ID`
3. Valeur actuelle : `_________________`
4. Valeur attendue : `shicigp`

**Si la valeur actuelle est différente de `shicigp`, c'est probablement le problème !**

---

## 📋 Checklist de Vérification

- [ ] Template "Contact Us" (`shicigp`) est bien configuré avec `{{html_message}}` ✅
- [ ] Template est publié dans EmailJS ✅
- [ ] Variable `EMAILJS_TEMPLATE_ID` dans Render = `shicigp`
- [ ] Variable `EMAILJS_SERVICE_ID` est correcte
- [ ] Variable `EMAILJS_USER_ID` est correcte
- [ ] Variable `EMAILJS_PRIVATE_KEY` est correcte
- [ ] Backend redéployé après modification des variables (si nécessaire)
- [ ] Test d'envoi effectué
- [ ] Email reçu avec HTML correctement rendu

---

## 🐛 Si le Problème Persiste

Si après avoir vérifié toutes ces choses le problème persiste, vérifiez :

1. **Les logs Render** lors d'un envoi d'email :
   ```
   📧 Données EmailJS: {
     serviceId: ...,
     templateId: ...,
     ...
   }
   ```
   
   Vérifiez que `templateId` correspond bien à `shicigp`.

2. **Le type de contenu** dans le template EmailJS :
   - Certains templates EmailJS ont un champ séparé pour "HTML Content" et "Text Content"
   - Assurez-vous que `{{html_message}}` est dans le champ **HTML Content** et non Text Content

3. **La configuration EmailJS** :
   - Vérifiez que le service email est bien connecté
   - Vérifiez que vous n'avez pas atteint la limite de requêtes

---

Une fois le Template ID corrigé dans Render, le HTML devrait s'afficher correctement ! 🎉
