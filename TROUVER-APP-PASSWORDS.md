# 🔍 Comment Trouver "App passwords" sur Google

## ✅ **Bonne Nouvelle !**

Je vois dans votre page Security que :
- ✅ **2-Step Verification** est **ON** (depuis 9:50 PM)
- ✅ Votre numéro de téléphone est configuré
- ✅ Vous êtes prêt à créer un App Password

## 🔍 **Où Trouver "App passwords"**

La section "App passwords" n'est pas visible dans votre capture d'écran car elle se trouve **plus bas** sur la page. Voici comment la trouver :

### **Méthode 1 : Faire défiler la page**
1. **Faire défiler** vers le bas sur la page Security
2. **Chercher** la section **"How you sign in to Google"**
3. **Sous** "2-Step Verification", vous devriez voir **"App passwords"**

### **Méthode 2 : Recherche directe**
1. **Cliquer** sur **"2-Step Verification"** (ligne avec "On since 9:50 PM")
2. **Dans la page** qui s'ouvre, chercher **"App passwords"**
3. **Cliquer** sur **"App passwords"**

### **Méthode 3 : Lien direct**
1. **Aller directement** sur : [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. **Ou** : [myaccount.google.com/security](https://myaccount.google.com/security) puis chercher "App passwords"

## 📱 **Étapes Détaillées**

### **Étape 1 : Accéder à App passwords**
```
myaccount.google.com → Security → 2-Step Verification → App passwords
```

### **Étape 2 : Créer le mot de passe**
1. **Cliquer** sur **"Select app"** (menu déroulant)
2. **Choisir** **"Other (Custom name)"**
3. **Taper** : **"Boulangerie Planning API"**
4. **Cliquer** sur **"Generate"**
5. **Copier** le mot de passe (16 caractères)

## 🔧 **Configuration sur Render**

Une fois le mot de passe copié :

1. **Aller sur** [Render Dashboard](https://dashboard.render.com)
2. **Sélectionner** `boulangerie-planning-api-3`
3. **Onglet** `Environment`
4. **Ajouter** ces variables :

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=philangenpdc@gmail.com
SMTP_PASS=abcdefghijklmnop
```

## ⚠️ **Points Importants**

- **App passwords** n'apparaît que si 2-Step Verification est activé ✅
- Le mot de passe ne s'affiche qu'**une seule fois**
- Utiliser le mot de passe **sans espaces** dans Render
- Votre email : `philangenpdc@gmail.com`

## 🧪 **Test de Configuration**

Après configuration, testez avec :
```bash
node test-email-config.js
```

## 🚨 **Si App passwords n'apparaît pas**

### **Solutions :**
1. **Attendre** quelques minutes (parfois il y a un délai)
2. **Se déconnecter/reconnecter** à Google
3. **Vider le cache** du navigateur
4. **Essayer** un autre navigateur
5. **Utiliser** le lien direct : [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)

### **Alternative :**
Si App passwords ne fonctionne pas, vous pouvez utiliser :
- **OVH SMTP** (si vous avez un compte OVH)
- **Outlook SMTP** (si vous avez un compte Outlook)

## 📞 **Support**

Si vous ne trouvez toujours pas "App passwords", contactez-moi et je vous aiderai avec une alternative.

---

**Développé pour la Boulangerie Planning System**  
*Version 1.0 - Janvier 2025*
