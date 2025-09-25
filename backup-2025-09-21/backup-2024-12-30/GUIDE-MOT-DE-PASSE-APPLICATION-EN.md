# 🔐 Guide : Créer un Mot de Passe d'Application Gmail (Version Anglaise)

## 🎯 **Pourquoi un Mot de Passe d'Application ?**

Google a renforcé la sécurité et exige maintenant un **mot de passe d'application** pour les connexions SMTP externes. C'est plus sécurisé que votre mot de passe normal.

## 📋 **Prérequis**

- ✅ Compte Gmail actif
- ✅ **2-Step Verification** OBLIGATOIRE
- ✅ Accès aux paramètres Google

## 🚀 **Étapes Détaillées (Version Anglaise)**

### **Étape 1 : Activer l'Authentification à 2 Facteurs**

Si ce n'est pas déjà fait :

1. **Aller sur** [myaccount.google.com](https://myaccount.google.com)
2. **Cliquer** sur **"Security"** dans le menu de gauche
3. **Chercher** **"2-Step Verification"**
4. **Cliquer** sur **"Get started"**
5. **Suivre** les instructions pour configurer :
   - Numéro de téléphone
   - Code de vérification
   - Application d'authentification (optionnel)

### **Étape 2 : Générer le Mot de Passe d'Application**

1. **Aller sur** [myaccount.google.com](https://myaccount.google.com)
2. **Cliquer** sur **"Security"**
3. **Chercher** **"App passwords"**
4. **Cliquer** sur **"App passwords"**

### **Étape 3 : Créer le Mot de Passe**

1. **Sélectionner** l'application : **"Other (Custom name)"**
2. **Taper** : **"Boulangerie Planning API"**
3. **Cliquer** sur **"Generate"**
4. **Copier** le mot de passe généré (16 caractères)

**⚠️ IMPORTANT :** Ce mot de passe ne s'affiche qu'**une seule fois** !

## 📝 **Exemple de Mot de Passe Généré**

```
abcd efgh ijkl mnop
```

**Format :** 16 caractères, espaces tous les 4 caractères

## 🔧 **Configuration sur Render**

### **Variables d'environnement à configurer :**

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=abcdefghijklmnop
```

**⚠️ Note :** Utiliser le mot de passe d'application **sans espaces**

### **Interface Render :**

```
Environment Variables
┌─────────────────┬─────────────────────────┐
│ SMTP_HOST       │ smtp.gmail.com          │
│ SMTP_PORT       │ 587                     │
│ SMTP_USER       │ votre-email@gmail.com   │
│ SMTP_PASS       │ abcdefghijklmnop        │
└─────────────────┴─────────────────────────┘
```

## 🧪 **Test de la Configuration**

### **1. Script de test automatique :**
```bash
node test-email-config.js
```

### **2. Test manuel via API :**
```bash
curl https://boulangerie-planning-api-3.onrender.com/api/sick-leaves/test-email
```

### **3. Réponse attendue :**
```json
{
  "success": true,
  "config": {
    "smtpHost": "smtp.gmail.com",
    "smtpPort": "587",
    "smtpUser": "votre-email@gmail.com",
    "configured": true,
    "connectionTest": {
      "success": true,
      "message": "Connexion SMTP vérifiée"
    }
  }
}
```

## 🔒 **Sécurité**

### **Bonnes pratiques :**
- ✅ **Ne jamais partager** le mot de passe d'application
- ✅ **Utiliser uniquement** pour l'API Boulangerie
- ✅ **Révocation possible** depuis Google si compromis
- ✅ **Variables d'environnement** sécurisées sur Render

### **En cas de compromission :**
1. Aller sur [myaccount.google.com](https://myaccount.google.com)
2. Security → App passwords
3. Révoker le mot de passe compromis
4. Générer un nouveau mot de passe

## 🚨 **Dépannage**

### **Erreur : "App passwords not available"**
- ✅ Vérifier que la 2-Step Verification est activée
- ✅ Attendre quelques minutes après activation
- ✅ Se déconnecter/reconnecter à Google

### **Erreur : "SMTP connection failed"**
- ✅ Vérifier le mot de passe (sans espaces)
- ✅ Vérifier l'email (exactement comme dans Gmail)
- ✅ Tester avec un client email

### **Erreur : "Authentication failed"**
- ✅ Régénérer un nouveau mot de passe d'application
- ✅ Vérifier que le compte n'est pas verrouillé
- ✅ Contacter le support Google si nécessaire

## 📱 **Alternative : Application d'Authentification**

Pour plus de sécurité, vous pouvez aussi utiliser :
- **Google Authenticator**
- **Microsoft Authenticator**
- **Authy**

Mais le mot de passe d'application reste la solution la plus simple pour SMTP.

## 🔄 **Renouvellement**

### **Quand renouveler :**
- ✅ Tous les 6 mois (recommandé)
- ✅ En cas de suspicion de compromission
- ✅ Si Google le demande

### **Comment renouveler :**
1. Révoker l'ancien mot de passe
2. Générer un nouveau mot de passe
3. Mettre à jour sur Render
4. Redémarrer le service

## 📞 **Support**

### **En cas de problème :**
1. Vérifier les logs Render
2. Tester la configuration email
3. Contacter le support Google si nécessaire
4. Utiliser l'alternative OVH si Gmail pose problème

### **Liens utiles :**
- [Google Account Settings](https://myaccount.google.com)
- [Google Security](https://myaccount.google.com/security)
- [Google Support](https://support.google.com)

---

**Développé pour la Boulangerie Planning System**  
*Version 1.0 - Janvier 2025*
