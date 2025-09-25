# 📧 Configuration du Service Email - Boulangerie Planning

## 🔍 **Problème Identifié**

Le service email est implémenté mais non configuré, ce qui génère les messages d'erreur suivants :
```
⚠️ Service email non configuré - email non envoyé
⚠️ Email de validation non envoyé: Service email non configuré
```

## 🛠️ **Solution : Configuration SMTP**

### **1. Variables d'environnement requises**

Le service email utilise **nodemailer** et nécessite ces variables sur Render :

| Variable | Description | Exemple |
|----------|-------------|---------|
| `SMTP_HOST` | Serveur SMTP | `smtp.gmail.com` |
| `SMTP_PORT` | Port SMTP | `587` |
| `SMTP_USER` | Email d'envoi | `votre-email@gmail.com` |
| `SMTP_PASS` | Mot de passe | `votre-mot-de-passe-app` |

### **2. Configuration sur Render**

#### **Étapes :**
1. **Aller sur** [Render Dashboard](https://dashboard.render.com)
2. **Sélectionner** le service `boulangerie-planning-api-3`
3. **Cliquer** sur l'onglet `Environment`
4. **Ajouter** les 4 variables SMTP
5. **Sauvegarder** et **redémarrer** le service

#### **Interface Render :**
```
Environment Variables
┌─────────────────┬─────────────────────────┐
│ SMTP_HOST       │ smtp.gmail.com          │
│ SMTP_PORT       │ 587                     │
│ SMTP_USER       │ votre-email@gmail.com   │
│ SMTP_PASS       │ votre-mot-de-passe      │
└─────────────────┴─────────────────────────┘
```

## 🔧 **Configurations SMTP Recommandées**

### **Gmail (Recommandé)**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-app
```

**⚠️ Important pour Gmail :**
- Utiliser un **mot de passe d'application** (pas le mot de passe normal)
- Activer l'authentification à 2 facteurs
- Générer un mot de passe d'application dans les paramètres Google

### **OVH (Alternative)**
```bash
SMTP_HOST=ssl0.ovh.net
SMTP_PORT=587
SMTP_USER=votre-email@votre-domaine.fr
SMTP_PASS=votre-mot-de-passe
```

### **Outlook/Hotmail**
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=votre-email@outlook.com
SMTP_PASS=votre-mot-de-passe
```

## 🧪 **Test de la Configuration**

### **1. Test automatique**
Après configuration, le service teste automatiquement la connexion SMTP au démarrage.

### **2. Test manuel via API**
```bash
GET https://boulangerie-planning-api-3.onrender.com/api/sick-leaves/test-email
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Test de configuration email terminé",
  "config": {
    "smtpHost": "smtp.gmail.com",
    "smtpPort": "587",
    "smtpUser": "votre-email@gmail.com",
    "smtpPass": "***123",
    "configured": true,
    "connectionTest": {
      "success": true,
      "message": "Connexion SMTP vérifiée"
    }
  }
}
```

## 📧 **Fonctionnalités Email Disponibles**

### **1. Emails automatiques**
- ✅ **Validation d'arrêt maladie** → Salarié
- ✅ **Rejet d'arrêt maladie** → Salarié  
- ✅ **Notification comptable** → Comptable
- ✅ **Alerte admin** → Administrateur

### **2. Templates HTML**
- Design professionnel avec logo Boulangerie Ange
- Responsive et compatible tous clients
- Version texte alternative

### **3. Gestion des erreurs**
- Fallback gracieux si email échoue
- Logs détaillés pour debugging
- Continuité du service même sans email

## 🔒 **Sécurité**

### **Bonnes pratiques :**
- ✅ **Mot de passe d'application** pour Gmail
- ✅ **Variables d'environnement** sécurisées sur Render
- ✅ **Connexion TLS** (port 587)
- ✅ **Validation des destinataires**

### **Protection des données :**
- Emails chiffrés en transit
- Pas de stockage des mots de passe
- Logs sécurisés (pas de credentials)

## 🚀 **Déploiement**

### **Script automatisé :**
```bash
deploy-email-config.bat
```

### **Déploiement manuel :**
1. Configurer les variables sur Render
2. Redémarrer le service
3. Tester la configuration
4. Vérifier les logs

## 📊 **Monitoring**

### **Logs à surveiller :**
```
✅ Service email configuré
✅ Connexion SMTP vérifiée
✅ Email de validation envoyé: <messageId>
```

### **En cas d'erreur :**
```
❌ Erreur configuration service email: <détails>
❌ Erreur envoi email: <détails>
```

## 🔧 **Dépannage**

### **Problèmes courants :**

#### **1. "Service email non configuré"**
- ✅ Vérifier que les 4 variables SMTP sont définies
- ✅ Redémarrer le service Render
- ✅ Vérifier les logs de démarrage

#### **2. "Connexion SMTP échouée"**
- ✅ Vérifier les credentials
- ✅ Tester avec un client email
- ✅ Vérifier les paramètres de sécurité

#### **3. "Email non envoyé"**
- ✅ Vérifier l'adresse destinataire
- ✅ Contrôler les logs d'erreur
- ✅ Tester avec un email simple

### **Commandes de test :**
```bash
# Test de configuration
curl https://boulangerie-planning-api-3.onrender.com/api/sick-leaves/test-email

# Test de connexion SFTP
curl https://boulangerie-planning-api-3.onrender.com/api/sick-leaves/test-sftp
```

## 📞 **Support**

En cas de problème :
1. Vérifier les logs Render
2. Tester la configuration email
3. Vérifier les variables d'environnement
4. Contacter l'administrateur système

---

**Développé pour la Boulangerie Planning System**  
*Version 1.0 - Janvier 2025*
