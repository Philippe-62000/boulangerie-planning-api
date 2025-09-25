# 🔐 Guide : Créer un Mot de Passe d'Application Gmail

## 🎯 **Pourquoi un Mot de Passe d'Application ?**

Google a renforcé la sécurité et exige maintenant un **mot de passe d'application** pour les connexions SMTP externes. C'est plus sécurisé que votre mot de passe normal.

## 📋 **Prérequis**

- ✅ Compte Gmail actif
- ✅ Authentification à 2 facteurs **OBLIGATOIRE**
- ✅ Accès aux paramètres Google

## 🚀 **Étapes Détaillées**

### **Étape 1 : Activer l'Authentification à 2 Facteurs**

Si ce n'est pas déjà fait :

1. **Aller sur** [myaccount.google.com](https://myaccount.google.com)
2. **Cliquer** sur "Sécurité" dans le menu de gauche
3. **Chercher** "Validation en 2 étapes"
4. **Cliquer** sur "Commencer"
5. **Suivre** les instructions pour configurer :
   - Numéro de téléphone
   - Code de vérification
   - Application d'authentification (optionnel)

### **Étape 2 : Générer le Mot de Passe d'Application**

1. **Aller sur** [myaccount.google.com](https://myaccount.google.com)
2. **Cliquer** sur "Sécurité"
3. **Chercher** "Mots de passe des applications"
4. **Cliquer** sur "Mots de passe des applications"

### **Étape 3 : Créer le Mot de Passe**

1. **Sélectionner** l'application : "Autre (nom personnalisé)"
2. **Taper** : "Boulangerie Planning API"
3. **Cliquer** sur "Générer"
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
2. Sécurité → Mots de passe des applications
3. Révoker le mot de passe compromis
4. Générer un nouveau mot de passe

## 🚨 **Dépannage**

### **Erreur : "Mots de passe des applications non disponibles"**
- ✅ Vérifier que l'authentification à 2 facteurs est activée
- ✅ Attendre quelques minutes après activation
- ✅ Se déconnecter/reconnecter à Google

### **Erreur : "Connexion SMTP échouée"**
- ✅ Vérifier le mot de passe (sans espaces)
- ✅ Vérifier l'email (exactement comme dans Gmail)
- ✅ Tester avec un client email

### **Erreur : "Authentification échouée"**
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
- [Paramètres Google](https://myaccount.google.com)
- [Sécurité Google](https://myaccount.google.com/security)
- [Support Google](https://support.google.com)

---

**Développé pour la Boulangerie Planning System**  
*Version 1.0 - Janvier 2025*
