# 🔍 Comment Trouver le Service ID EmailJS pour Longuenesse

## ❌ Problème Actuel

L'erreur indique :
```
The service ID not found. To find this ID, visit https://dashboard.emailjs.com/admin
```

**Cause :** Le `EMAILJS_SERVICE_ID` dans Render est configuré avec `gmail`, mais ce n'est pas le bon format. EmailJS nécessite l'ID unique du service créé dans votre compte EmailJS.

---

## ✅ Solution : Trouver le Vrai Service ID

### Étape 1 : Se Connecter à EmailJS

1. Allez sur [https://dashboard.emailjs.com/admin](https://dashboard.emailjs.com/admin)
2. Connectez-vous avec votre compte EmailJS pour Longuenesse

### Étape 2 : Trouver le Service ID

1. Dans le menu de gauche, cliquez sur **"Email Services"**
2. Vous verrez la liste de vos services (Gmail, Outlook, etc.)
3. Cliquez sur le service que vous utilisez (probablement Gmail)
4. Le **Service ID** s'affiche en haut de la page, format : `service_xxxxx` ou `gmail_xxxxx`

**Exemple de Service ID :**
```
service_abc123xyz
```
ou
```
gmail_abc123xyz
```

### Étape 3 : Trouver le Template ID

1. Dans le menu de gauche, cliquez sur **"Email Templates"**
2. Trouvez le template pour "employee_password" (mot de passe salarié)
3. Le **Template ID** s'affiche, format : `template_xxxxx`

**Exemple de Template ID :**
```
template_ti7474g
```

### Étape 4 : Trouver le User ID

1. Dans le menu de gauche, cliquez sur **"Account"** → **"General"**
2. Le **User ID** (Public Key) s'affiche, format : `xxxxx`

**Exemple de User ID :**
```
RID3Du7xMUj54pzjb
```

### Étape 5 : Trouver la Private Key

1. Dans le menu de gauche, cliquez sur **"Account"** → **"Security"**
2. Trouvez la section **"API Keys"**
3. Cliquez sur **"Create API Key"** ou utilisez une clé existante
4. Copiez la **Private Key**

---

## 🔧 Configuration dans Render

Une fois que vous avez tous les identifiants, allez dans Render :

1. **Render Dashboard** → Service `boulangerie-planning-api-3`
2. **Environment** → **Environment Variables**
3. **Modifiez/Ajoutez** ces variables :

```bash
EMAILJS_SERVICE_ID=service_abc123xyz    ← Le VRAI Service ID d'EmailJS (pas juste "gmail")
EMAILJS_TEMPLATE_ID=template_ti7474g   ← Le Template ID
EMAILJS_USER_ID=RID3Du7xMUj54pzjb      ← Le User ID
EMAILJS_PRIVATE_KEY=tKYqrTUpzRQiq_7r0ZjCJ  ← La Private Key
```

**⚠️ IMPORTANT :**
- Le Service ID doit être au format `service_xxxxx` ou `gmail_xxxxx` (pas juste "gmail")
- Toutes les valeurs SANS guillemets
- Sauvegardez et redéployez le service

---

## 🎯 Vérification

Après configuration, testez à nouveau l'envoi de mot de passe. Les logs devraient montrer :
```
✅ Email envoyé via EmailJS
```

Au lieu de :
```
❌ The service ID not found
```

---

## 📝 Note Importante

**Pourquoi "gmail" ne fonctionne pas ?**

- EmailJS utilise des **Services** que vous créez dans votre compte
- Chaque service a un **ID unique** (ex: `service_abc123`)
- "gmail" n'est qu'un **type** de service, pas l'ID du service
- Vous devez utiliser l'ID du service que vous avez créé dans EmailJS

---

## 🔗 Liens Utiles

- [EmailJS Dashboard](https://dashboard.emailjs.com/admin)
- [EmailJS Documentation - Service ID](https://www.emailjs.com/docs/user-guide/creating-email-service/)
- [EmailJS Documentation - Template ID](https://www.emailjs.com/docs/user-guide/creating-email-templates/)


