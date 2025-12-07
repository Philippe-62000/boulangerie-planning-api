# 📧 Guide de Configuration EmailJS pour Longuenesse

## 📋 Vue d'ensemble

Ce guide vous explique comment configurer EmailJS pour Longuenesse, en créant un nouveau service et des templates séparés de ceux d'Arras.

---

## 🎯 Option 1 : Utiliser le Même Compte EmailJS (Plus Simple)

Si vous utilisez le **même compte EmailJS** que pour Arras, vous pouvez créer un **nouveau service** dans le même compte.

### Avantages :
- ✅ Plus simple à gérer
- ✅ Un seul compte à maintenir
- ✅ Même USER_ID et PRIVATE_KEY

### Inconvénients :
- ⚠️ Les emails peuvent se mélanger si mal configurés

---

## 🎯 Option 2 : Créer un Nouveau Compte EmailJS (Recommandé)

Créer un **compte complètement séparé** pour Longuenesse.

### Avantages :
- ✅ Séparation totale des emails
- ✅ Aucun risque de mélange
- ✅ Plus professionnel

### Inconvénients :
- ⚠️ Deux comptes à gérer

---

## 🚀 Étapes de Configuration

### **Étape 1 : Se Connecter à EmailJS**

1. Allez sur [https://www.emailjs.com/](https://www.emailjs.com/)
2. Connectez-vous avec votre compte (ou créez-en un nouveau pour Option 2)

---

### **Étape 2 : Créer un Nouveau Service Email**

1. Dans le dashboard EmailJS, allez dans **Email Services**
2. Cliquez sur **Add New Service**
3. Choisissez votre fournisseur email :
   - **Gmail** (recommandé si vous utilisez Gmail)
   - **Outlook**
   - **Yahoo**
   - **Autre** (SMTP personnalisé)

4. Suivez les instructions pour connecter votre compte email
5. **Notez le Service ID** (ex: `service_abc123`)

**📝 Service ID pour Longuenesse :** `_________________`

---

### **Étape 3 : Créer les Templates Email**

L'application utilise principalement **un template générique** qui reçoit le contenu HTML/text en paramètres.

#### 3.1. Créer le Template Principal

1. Allez dans **Email Templates**
2. Cliquez sur **Create New Template**
3. Configurez le template :

**Template Name :** `Boulangerie Longuenesse - Template Générique`

**Subject :** `{{subject}}`

**Content (HTML) :**
```html
{{html_message}}
```

**Content (Text) :**
```
{{message}}
```

4. **Variables du template :**
   - `{{subject}}` - Sujet de l'email
   - `{{to_email}}` - Email du destinataire
   - `{{html_message}}` - Contenu HTML de l'email
   - `{{message}}` - Contenu texte de l'email
   - `{{from_name}}` - Nom de l'expéditeur (Boulangerie Ange - Longuenesse)
   - `{{from_email}}` - Email de l'expéditeur

5. **Notez le Template ID** (ex: `template_xyz789`)

**📝 Template ID pour Longuenesse :** `_________________`

---

#### 3.2. Templates Optionnels (si vous voulez des templates spécifiques)

Si vous voulez créer des templates spécifiques pour chaque type d'email, vous pouvez créer :

1. **Template Arrêt Maladie**
   - Name : `Arrêt Maladie - Longuenesse`
   - Subject : `Accusé de réception - Arrêt maladie de {{employeeName}}`
   - Content : HTML personnalisé pour les arrêts maladie

2. **Template Demande d'Acompte**
   - Name : `Demande Acompte - Longuenesse`
   - Subject : `Nouvelle demande d'acompte - {{employeeName}}`
   - Content : HTML personnalisé pour les acomptes

3. **Template Congés**
   - Name : `Demande Congés - Longuenesse`
   - Subject : `Nouvelle demande de congés - {{employeeName}}`
   - Content : HTML personnalisé pour les congés

**⚠️ Note :** Pour simplifier, un seul template générique suffit. L'application envoie déjà le HTML complet.

---

### **Étape 4 : Récupérer les Identifiants**

#### 4.1. User ID

1. Allez dans **Account** → **General**
2. Trouvez **User ID** (ex: `EHw0fFSAwQ_4SfY6Z`)
3. **Copiez-le**

**📝 User ID :** `_________________`

---

#### 4.2. Private Key (Clé Privée)

1. Allez dans **Account** → **Security** → **API Keys**
2. Si vous n'avez pas de clé privée, cliquez sur **Create API Key**
3. **Copiez la clé privée** (ex: `jKt0abc123...`)
4. **⚠️ IMPORTANT :** Cette clé ne sera affichée qu'une seule fois, notez-la bien !

**📝 Private Key :** `_________________`

---

### **Étape 5 : Configurer dans Render**

1. Allez dans [Render Dashboard](https://dashboard.render.com)
2. Sélectionnez le service `boulangerie-planning-api-3`
3. Allez dans **Environment** → **Environment Variables**
4. Ajoutez/modifiez ces variables :

```
EMAILJS_SERVICE_ID=<votre_service_id_longuenesse>
EMAILJS_TEMPLATE_ID=<votre_template_id_longuenesse>
EMAILJS_USER_ID=<votre_user_id>
EMAILJS_PRIVATE_KEY=<votre_private_key>
```

**Exemple :**
```
EMAILJS_SERVICE_ID=service_abc123
EMAILJS_TEMPLATE_ID=template_xyz789
EMAILJS_USER_ID=EHw0fFSAwQ_4SfY6Z
EMAILJS_PRIVATE_KEY=jKt0abc123def456...
```

---

### **Étape 6 : Tester la Configuration**

#### 6.1. Redéployer le Backend

1. Dans Render, allez dans **Manual Deploy** → **Deploy latest commit**
2. Attendez que le déploiement se termine

#### 6.2. Tester un Email

1. Connectez-vous à `https://www.filmara.fr/lon/`
2. Créez un test (ex: uploader un arrêt maladie test)
3. Vérifiez que l'email arrive correctement

#### 6.3. Vérifier les Logs

1. Dans Render, allez dans **Logs**
2. Cherchez les messages EmailJS :
   - `✅ Email envoyé via EmailJS` = Succès
   - `❌ Erreur EmailJS` = Problème à corriger

---

## 📝 Checklist de Configuration

- [ ] Compte EmailJS créé/connecté
- [ ] Service Email créé (Service ID noté)
- [ ] Template principal créé (Template ID noté)
- [ ] User ID récupéré
- [ ] Private Key créée et notée
- [ ] Variables ajoutées dans Render :
  - [ ] `EMAILJS_SERVICE_ID`
  - [ ] `EMAILJS_TEMPLATE_ID`
  - [ ] `EMAILJS_USER_ID`
  - [ ] `EMAILJS_PRIVATE_KEY`
- [ ] Backend redéployé
- [ ] Test d'envoi d'email effectué
- [ ] Email reçu avec succès

---

## 🔍 Variables d'Environnement dans Render

Voici un exemple complet des variables EmailJS à ajouter :

```bash
# EmailJS Configuration pour Longuenesse
EMAILJS_SERVICE_ID=service_abc123
EMAILJS_TEMPLATE_ID=template_xyz789
EMAILJS_USER_ID=EHw0fFSAwQ_4SfY6Z
EMAILJS_PRIVATE_KEY=jKt0abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567
```

---

## ⚠️ Points Importants

### 1. **Séparation des Services**

- **Arras** : Utilise `service_arras` (ou pas de variable si défaut)
- **Longuenesse** : Utilise `service_longuenesse` (NOUVEAU service)

**⚠️ NE JAMAIS utiliser le même Service ID pour les deux !**

### 2. **Séparation des Templates**

- **Arras** : Utilise `template_arras` (ou pas de variable si défaut)
- **Longuenesse** : Utilise `template_longuenesse` (NOUVEAU template)

**⚠️ NE JAMAIS utiliser le même Template ID pour les deux !**

### 3. **User ID et Private Key**

- **Si même compte EmailJS** : Peuvent être identiques
- **Si nouveau compte EmailJS** : Doivent être différents

### 4. **Sécurité de la Private Key**

- ⚠️ **NE JAMAIS** partager la Private Key publiquement
- ⚠️ **NE JAMAIS** la commiter dans Git
- ✅ **UNIQUEMENT** dans les variables d'environnement Render

---

## 🐛 Dépannage

### Problème : Les emails ne partent pas

**Vérifications :**
1. ✅ Service ID correct dans Render ?
2. ✅ Template ID correct dans Render ?
3. ✅ User ID correct dans Render ?
4. ✅ Private Key correcte dans Render ?
5. ✅ Service Email connecté dans EmailJS ?
6. ✅ Template publié dans EmailJS ?
7. ✅ Vérifier les logs Render pour les erreurs

### Problème : Erreur "EmailJS non configuré"

**Solution :**
- Vérifiez que toutes les variables EmailJS sont définies dans Render
- Vérifiez qu'elles ne sont pas vides

### Problème : Erreur "Invalid service_id"

**Solution :**
- Vérifiez que le Service ID est correct
- Vérifiez que le service est bien connecté dans EmailJS

### Problème : Erreur "Invalid template_id"

**Solution :**
- Vérifiez que le Template ID est correct
- Vérifiez que le template est publié dans EmailJS

### Problème : Erreur "Invalid user_id"

**Solution :**
- Vérifiez que le User ID est correct
- Vérifiez que vous êtes connecté au bon compte EmailJS

### Problème : Erreur "Invalid accessToken"

**Solution :**
- Vérifiez que la Private Key est correcte
- Créez une nouvelle Private Key si nécessaire

---

## 📞 Support EmailJS

Si vous avez des problèmes avec EmailJS :
- Documentation : [https://www.emailjs.com/docs/](https://www.emailjs.com/docs/)
- Support : [https://www.emailjs.com/support/](https://www.emailjs.com/support/)

---

## ✅ Résumé

**Pour Longuenesse, vous devez avoir :**

1. ✅ **Service ID** : Nouveau service EmailJS
2. ✅ **Template ID** : Nouveau template EmailJS
3. ✅ **User ID** : Même ou nouveau (selon votre choix)
4. ✅ **Private Key** : Même ou nouvelle (selon votre choix)

**Toutes ces valeurs doivent être ajoutées dans Render (api-3) !**

---

Une fois configuré, les emails de Longuenesse seront complètement séparés de ceux d'Arras ! 🎉











