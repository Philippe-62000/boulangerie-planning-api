# 🏥 Système de Gestion des Arrêts Maladie

## 📋 Vue d'ensemble

Système complet pour la gestion des arrêts maladie des salariés avec upload sécurisé vers NAS Synology et validation automatique des documents.

## 🚀 Fonctionnalités

### Pour les Salariés
- **Page d'accueil** : `/sick-leave` - Information et accès au formulaire
- **Upload d'arrêt** : `/sick-leave-upload` - Formulaire d'envoi sécurisé
- **Validation automatique** : Vérification de la qualité des documents
- **Support JPG/PDF** : Formats acceptés avec limite de 10MB

### Pour l'Administrateur
- **Gestion complète** : `/sick-leave-management` - Interface d'administration
- **Validation manuelle** : Approbation/rejet des arrêts
- **Suivi des statuts** : pending → validated → declared
- **Téléchargement** : Accès aux documents originaux
- **Statistiques** : Vue d'ensemble des arrêts

## 🔧 Configuration Technique

### Variables d'environnement requises
```bash
SFTP_PASSWORD=votre_mot_de_passe_nas
```

### Structure NAS automatique
```
/sick-leaves/
├── 2025/
│   ├── 01-janvier/
│   ├── 02-fevrier/
│   └── ...
├── pending/      # Arrêts en attente
├── validated/    # Arrêts validés
└── declared/     # Arrêts déclarés
```

## 📊 Modèle de données

### SickLeave Schema
```javascript
{
  employeeName: String,      // Nom du salarié
  employeeEmail: String,     // Email du salarié
  startDate: Date,          // Date de début d'arrêt
  endDate: Date,            // Date de fin d'arrêt
  fileName: String,         // Nom du fichier sur le NAS
  originalFileName: String, // Nom original du fichier
  fileSize: Number,         // Taille en bytes
  fileType: String,         // MIME type (image/jpeg, application/pdf)
  filePath: String,         // Chemin complet sur le NAS
  status: String,           // pending/validated/declared/rejected
  autoValidation: {
    isReadable: Boolean,    // Document lisible
    qualityScore: Number,   // Score 0-100
    validationMessage: String
  },
  manualValidation: {
    validatedBy: String,    // Qui a validé
    validatedAt: Date,      // Quand
    validationNotes: String // Notes
  },
  declaration: {
    declaredBy: String,     // Qui a déclaré
    declaredAt: Date,       // Quand
    declarationNotes: String
  }
}
```

## 🔄 Workflow

### 1. Upload par le salarié
1. Accès à `/sick-leave`
2. Remplissage du formulaire
3. Upload du document (JPG/PDF)
4. Validation automatique
5. Stockage sur NAS
6. Confirmation

### 2. Validation par l'admin
1. Accès à `/sick-leave-management`
2. Consultation des arrêts en attente
3. Validation ou rejet
4. Déplacement du fichier vers `validated/`

### 3. Déclaration
1. Marquer comme "déclaré"
2. Déplacement vers `declared/`
3. Suivi complet

## 🛡️ Sécurité

- **Chiffrement** : Connexion SFTP sécurisée
- **Validation** : Vérification des types de fichiers
- **Limites** : Taille max 10MB
- **Accès** : Restriction aux administrateurs
- **Stockage** : NAS sécurisé avec organisation

## 📱 API Endpoints

### Public (Salariés)
- `POST /api/sick-leaves/upload` - Upload d'arrêt maladie

### Admin
- `GET /api/sick-leaves` - Liste des arrêts
- `GET /api/sick-leaves/:id` - Détails d'un arrêt
- `GET /api/sick-leaves/:id/download` - Téléchargement
- `PUT /api/sick-leaves/:id/validate` - Valider
- `PUT /api/sick-leaves/:id/reject` - Rejeter
- `PUT /api/sick-leaves/:id/declare` - Marquer comme déclaré
- `GET /api/sick-leaves/stats/overview` - Statistiques
- `DELETE /api/sick-leaves/:id` - Supprimer

## 🔍 Validation automatique

### Images (JPG)
- Résolution minimum : 800x600
- Ratio d'aspect acceptable
- Résolution DPI >= 150
- Taille raisonnable (50KB - 10MB)

### PDF
- Contenu non vide
- Texte lisible
- Maximum 10 pages
- Taille raisonnable

### Score de qualité
- 0-59 : Rejeté automatiquement
- 60-100 : Accepté avec validation manuelle

## 🚨 Gestion des erreurs

- **Connexion SFTP** : Retry automatique (3 tentatives)
- **Validation** : Messages d'erreur explicites
- **Upload** : Vérification des types et tailles
- **Stockage** : Gestion des espaces insuffisants

## 📈 Monitoring

- **Statistiques** : Compteurs par statut
- **Retards** : Alertes pour arrêts > 48h
- **Qualité** : Scores de validation
- **Utilisation** : Espace disque NAS

## 🔧 Maintenance

### Nettoyage automatique
- Fichiers > 90 jours (configurable)
- Arrêts rejetés anciens
- Logs de validation

### Sauvegarde
- Base de données MongoDB
- Fichiers NAS (sauvegarde Synology)
- Configuration SFTP

## 📞 Support

En cas de problème :
1. Vérifier les logs Render
2. Tester la connexion SFTP
3. Vérifier les permissions NAS
4. Contacter l'administrateur système

---

**Développé pour la Boulangerie Planning System**  
*Version 1.0 - Janvier 2025*
