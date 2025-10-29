# 🔐 Documentation - Système de Changement de Mot de Passe

## 📋 Vue d'ensemble

Le système de changement de mot de passe permet aux salariés de modifier leur mot de passe temporaire reçu par email lors de leur première connexion. Cette fonctionnalité répond à l'exigence mentionnée dans l'email d'envoi des identifiants : *"⚠️ Ce mot de passe est temporaire, changez-le lors de votre première connexion."*

## 🏗️ Architecture

### Backend (API)
- **Endpoint** : `POST /api/auth/change-password`
- **Authentification** : Token JWT requis
- **Validation** : Mot de passe actuel + nouveau mot de passe
- **Sécurité** : Vérification du mot de passe actuel avant changement

### Frontend (Dashboard Salarié)
- **Page** : `employee-dashboard.html`
- **Onglet** : "🔐 Mot de Passe"
- **Interface** : Formulaire sécurisé avec validation côté client
- **UX** : Déconnexion automatique après changement réussi

## 🔧 Modifications Techniques

### 1. Backend - Contrôleur (`backend/controllers/authController.js`)

#### Nouvelle fonction `changePassword`
```javascript
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const employeeId = req.user.id || req.employeeId;
    
    // Validation des données
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel et nouveau mot de passe requis'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
      });
    }
    
    // Récupérer l'employé avec le mot de passe (IMPORTANT: select('+password'))
    const employee = await Employee.findById(employeeId).select('+password');
    
    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, employee.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }
    
    // Hasher et sauvegarder le nouveau mot de passe
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    employee.password = hashedNewPassword;
    await employee.save();
    
    res.json({
      success: true,
      message: 'Mot de passe changé avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du changement de mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: error.message
    });
  }
};
```

#### Export de la fonction
```javascript
module.exports = {
  sendPasswordToEmployee,
  employeeLogin,
  getEmployeeProfile,
  generateRandomPassword,
  changePassword  // ← Nouvelle fonction
};
```

### 2. Backend - Routes (`backend/routes/auth.js`)

#### Middleware d'authentification amélioré
```javascript
const authenticateEmployee = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token d\'authentification requis'
      });
    }
    
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre-cle-secrete-ici');
    
    if (decoded.role !== 'employee') {
      return res.status(403).json({
        success: false,
        error: 'Accès non autorisé'
      });
    }
    
    // Ajouter les informations de l'employé à req.user pour compatibilité
    req.user = {
      id: decoded.employeeId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    };
    
    req.employeeId = decoded.employeeId;
    req.employeeEmail = decoded.email;
    req.employeeName = decoded.name;
    
    next();
  } catch (error) {
    console.error('❌ Erreur authentification:', error);
    res.status(401).json({
      success: false,
      error: 'Token invalide'
    });
  }
};
```

#### Nouvelle route
```javascript
// Route pour changer le mot de passe d'un salarié
router.post('/change-password', authenticateEmployee, authController.changePassword);
```

### 3. Frontend - Dashboard Salarié (`frontend/public/employee-dashboard.html`)

#### Nouvel onglet dans la navigation
```html
<div class="tabs">
    <button class="tab" onclick="switchTab('sick-leave')">
        🏥 Arrêt Maladie
    </button>
    <button class="tab active" onclick="switchTab('vacation')">
        🏖️ Demande de Congés
    </button>
    <button class="tab" onclick="switchTab('documents')">
        📁 Mes Documents
    </button>
    <button class="tab" onclick="switchTab('password')">
        🔐 Mot de Passe
    </button>
</div>
```

#### Interface utilisateur
```html
<!-- Onglet Mot de Passe -->
<div class="tab-panel" id="password-panel">
    <div class="form-container">
        <h2 class="form-title">🔐 Changer mon mot de passe</h2>
        <p class="form-subtitle">Modifiez votre mot de passe pour sécuriser votre compte</p>

        <div id="passwordAlert"></div>

        <form id="passwordForm" class="form">
            <div class="form-group">
                <label for="currentPassword">Mot de passe actuel *</label>
                <input type="password" id="currentPassword" name="currentPassword" required>
            </div>

            <div class="form-group">
                <label for="newPassword">Nouveau mot de passe *</label>
                <input type="password" id="newPassword" name="newPassword" required minlength="6">
                <small class="form-text">Le mot de passe doit contenir au moins 6 caractères</small>
            </div>

            <div class="form-group">
                <label for="confirmPassword">Confirmer le nouveau mot de passe *</label>
                <input type="password" id="confirmPassword" name="confirmPassword" required minlength="6">
            </div>

            <div class="form-actions">
                <button type="submit" class="btn btn-primary">
                    <span class="btn-text">Changer le mot de passe</span>
                    <div class="btn-loading" style="display: none;">
                        <div class="spinner"></div>
                    </div>
                </button>
            </div>
        </form>

        <div class="info-box">
            <h4>ℹ️ Informations importantes</h4>
            <ul>
                <li>🔒 Votre mot de passe actuel est requis pour confirmer votre identité</li>
                <li>🛡️ Le nouveau mot de passe doit contenir au moins 6 caractères</li>
                <li>✅ Après le changement, vous devrez vous reconnecter avec votre nouveau mot de passe</li>
                <li>⚠️ Si vous oubliez votre mot de passe, contactez votre manager</li>
            </ul>
        </div>
    </div>
</div>
```

#### Logique JavaScript
```javascript
// Gestion du formulaire de changement de mot de passe
document.getElementById('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');
    
    // Validation côté client
    if (!currentPassword || !newPassword || !confirmPassword) {
        showAlert('passwordAlert', 'Tous les champs sont requis', 'danger');
        return;
    }
    
    if (newPassword.length < 6) {
        showAlert('passwordAlert', 'Le nouveau mot de passe doit contenir au moins 6 caractères', 'danger');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showAlert('passwordAlert', 'Les mots de passe ne correspondent pas', 'danger');
        return;
    }
    
    // Afficher le loading
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    btnText.style.display = 'none';
    btnLoading.style.display = 'flex';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_URL}/auth/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('employeeToken')}`
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('passwordAlert', '✅ Mot de passe changé avec succès ! Vous allez être déconnecté.', 'success');
            
            // Vider le formulaire
            e.target.reset();
            
            // Déconnexion automatique après 2 secondes
            setTimeout(() => {
                localStorage.removeItem('employeeToken');
                window.location.href = '/plan/salarie-connexion.html';
            }, 2000);
            
        } else {
            showAlert('passwordAlert', `❌ ${data.message || 'Erreur lors du changement de mot de passe'}`, 'danger');
        }
        
    } catch (error) {
        console.error('Erreur changement mot de passe:', error);
        showAlert('passwordAlert', '❌ Erreur de connexion. Veuillez réessayer.', 'danger');
    } finally {
        // Restaurer le bouton
        btnText.style.display = 'block';
        btnLoading.style.display = 'none';
        submitBtn.disabled = false;
    }
});
```

## 🔒 Sécurité

### Validations
- **Côté client** : Longueur minimale, correspondance des mots de passe
- **Côté serveur** : Vérification du mot de passe actuel, validation des données
- **Authentification** : Token JWT requis pour toutes les opérations

### Chiffrement
- **Mot de passe actuel** : Vérifié avec `bcrypt.compare()`
- **Nouveau mot de passe** : Chiffré avec `bcrypt.hash()` (10 rounds de salt)

### Gestion des erreurs
- **Messages clairs** : Erreurs spécifiques pour chaque cas d'échec
- **Logs détaillés** : Traçabilité des opérations côté serveur
- **Déconnexion automatique** : Sécurité après changement réussi

## 🐛 Problèmes résolus

### 1. Erreur 500 - "Illegal arguments: string, undefined"
**Problème** : Le champ `password` n'était pas récupéré de la base de données
**Cause** : `select: false` dans le modèle Employee
**Solution** : Utilisation de `.select('+password')` pour forcer la récupération

### 2. Variable `url` redéclarée
**Problème** : Conflit de noms de variables dans `downloadDocument()`
**Solution** : Renommage en `apiUrl` et `downloadUrl`

### 3. Logs de debug
**Problème** : Difficulté à diagnostiquer les erreurs
**Solution** : Ajout de logs détaillés dans le middleware et le contrôleur

## 📊 Flux utilisateur

1. **Connexion** : Le salarié se connecte avec son mot de passe temporaire
2. **Navigation** : Accès à l'onglet "🔐 Mot de Passe"
3. **Saisie** : Remplissage du formulaire (mot de passe actuel + nouveau)
4. **Validation** : Vérification côté client et serveur
5. **Changement** : Mise à jour sécurisée en base de données
6. **Déconnexion** : Déconnexion automatique après succès
7. **Reconnexion** : Le salarié se reconnecte avec son nouveau mot de passe

## 🎯 Points d'attention

### Modèle Employee
- Le champ `password` a `select: false` - **toujours utiliser `.select('+password')`**
- Le champ est optionnel - vérifier l'existence avant utilisation

### Token JWT
- Contient `employeeId`, `email`, `name`, `role`
- Vérifier la validité avant traitement
- Gérer les cas d'expiration

### Interface utilisateur
- Validation en temps réel côté client
- Messages d'erreur clairs et informatifs
- États de chargement pour une meilleure UX

## 🚀 Déploiement

### Backend
- Déployé automatiquement sur Render via Git
- Variables d'environnement : `JWT_SECRET`
- Base de données : MongoDB Atlas

### Frontend
- Déployé manuellement sur OVH via FTP
- Fichier : `frontend/public/employee-dashboard.html`
- Accessible : `https://www.filmara.fr/plan/employee-dashboard.html`

## ✅ Tests

### Tests fonctionnels
- [x] Connexion avec mot de passe temporaire
- [x] Accès à l'onglet "Mot de Passe"
- [x] Validation des champs obligatoires
- [x] Vérification de la correspondance des mots de passe
- [x] Changement de mot de passe réussi
- [x] Déconnexion automatique
- [x] Reconnexion avec nouveau mot de passe

### Tests de sécurité
- [x] Vérification du mot de passe actuel
- [x] Chiffrement du nouveau mot de passe
- [x] Authentification JWT requise
- [x] Validation côté serveur
- [x] Gestion des erreurs sécurisée

## 📝 Notes de maintenance

### Logs à surveiller
- `🔐 Changement de mot de passe pour l'employé: [ID]`
- `✅ Mot de passe changé avec succès pour: [Nom]`
- `❌ Erreur lors du changement de mot de passe: [Erreur]`

### Points de vigilance
- Vérifier que le champ `password` est bien récupéré avec `.select('+password')`
- S'assurer que le token JWT contient bien `employeeId`
- Surveiller les erreurs de validation côté client et serveur

---

**Date de création** : Janvier 2025  
**Version** : 1.0  
**Statut** : ✅ Fonctionnel et déployé
