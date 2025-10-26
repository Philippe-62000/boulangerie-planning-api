# 📁 Instructions d'Upload de Documents

## 🎯 Solutions Disponibles

### 1. **Interface Web d'Administration** (Recommandée)
- **URL** : `https://www.filmara.fr/admin-documents.html`
- **Accès** : Administrateurs uniquement
- **Fonctionnalités** :
  - Upload de documents généraux (notices, procédures)
  - Upload de documents personnels (fiches de paie, contrats)
  - Upload par lot avec reconnaissance automatique des employés
  - Gestion et suppression des documents

### 2. **Upload par Lot pour Fiches de Paie**

#### Méthode 1 : Interface Web (Simple)
1. Accédez à `https://www.filmara.fr/admin-documents.html`
2. Section "Upload par Lot"
3. Nommez vos fichiers selon le format : `Nom_Prenom_MoisAnnee.pdf`
   - Exemple : `Marie_Dupont_Janvier2025.pdf`
   - Exemple : `Jean_Martin_Fevrier2025.pdf`
4. Sélectionnez tous les fichiers d'un coup
5. Choisissez la catégorie "Fiches de paie"
6. Cliquez sur "Uploader tous les documents"

#### Méthode 2 : Script Automatique (Avancé)
```bash
# Script pour uploader automatiquement un dossier de fiches de paie
node scripts/batch-upload-payslips.js /chemin/vers/fiches-de-paie/
```

### 3. **Configuration NAS**

#### Structure des Dossiers
```
/nas/documents/
├── general/           # Documents généraux
│   ├── notices/      # Notices
│   ├── procedures/    # Procédures
│   └── training/     # Formations
└── personal/         # Documents personnels
    ├── payslips/     # Fiches de paie
    ├── contracts/    # Contrats
    └── certificates/ # Attestations
```

#### Configuration Backend
```javascript
// Dans backend/controllers/documentController.js
const NAS_CONFIG = {
  basePath: process.env.NAS_BASE_PATH || '/path/to/nas/documents',
  generalPath: '/general',
  personalPath: '/personal',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'txt']
};
```

## 🚀 Guide d'Utilisation

### Upload de Documents Généraux
1. **Accès** : Interface web d'administration
2. **Processus** :
   - Remplir le titre du document
   - Sélectionner la catégorie (notice, procédure, etc.)
   - Choisir le fichier
   - Cliquer sur "Uploader"
3. **Résultat** : Document accessible à tous les salariés

### Upload de Documents Personnels
1. **Accès** : Interface web d'administration
2. **Processus** :
   - Sélectionner le salarié dans la liste
   - Remplir le titre du document
   - Sélectionner la catégorie (fiche de paie, contrat, etc.)
   - Choisir le fichier
   - Cliquer sur "Uploader"
3. **Résultat** : Document accessible uniquement au salarié concerné

### Upload par Lot - Fiches de Paie
1. **Préparation** :
   - Organiser les fichiers dans un dossier
   - Nommer les fichiers : `Nom_Prenom_MoisAnnee.pdf`
   - Exemple : `Marie_Dupont_Janvier2025.pdf`

2. **Upload** :
   - Accéder à l'interface d'administration
   - Section "Upload par Lot"
   - Sélectionner tous les fichiers
   - Choisir "Fiches de paie" comme catégorie
   - Cliquer sur "Uploader tous les documents"

3. **Vérification** :
   - Le système tentera de faire correspondre automatiquement les fichiers aux employés
   - Vérifier les résultats dans la section "Résultats de l'upload par lot"
   - Corriger manuellement les correspondances incorrectes

## 🔧 Solutions Techniques Avancées

### Script d'Upload Automatique
```javascript
// scripts/batch-upload-payslips.js
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function uploadPayslips(directoryPath) {
  const files = fs.readdirSync(directoryPath);
  const pdfFiles = files.filter(file => file.endsWith('.pdf'));
  
  for (const file of pdfFiles) {
    const filePath = path.join(directoryPath, file);
    const formData = new FormData();
    
    // Extraire le nom de l'employé du nom du fichier
    const employeeName = extractEmployeeName(file);
    const employeeId = await findEmployeeByName(employeeName);
    
    formData.append('employeeId', employeeId);
    formData.append('title', file.replace('.pdf', ''));
    formData.append('category', 'payslip');
    formData.append('type', 'personal');
    formData.append('file', fs.createReadStream(filePath));
    
    try {
      const response = await fetch('https://boulangerie-planning-api-4-pbfy.onrender.com/api/documents/upload', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      console.log(`${file}: ${result.success ? '✅ Succès' : '❌ Erreur'}`);
    } catch (error) {
      console.error(`Erreur pour ${file}:`, error.message);
    }
  }
}

function extractEmployeeName(filename) {
  // Logique pour extraire le nom de l'employé du nom du fichier
  // Exemple: "Marie_Dupont_Janvier2025.pdf" -> "Marie Dupont"
  return filename.split('_').slice(0, 2).join(' ');
}
```

### Configuration NAS avec Samba
```bash
# Monter le NAS en tant que partage Samba
sudo mount -t cifs //nas-server/documents /mnt/nas -o username=admin,password=password,uid=1000,gid=1000

# Configurer les permissions
sudo chown -R www-data:www-data /mnt/nas
sudo chmod -R 755 /mnt/nas
```

### Variables d'Environnement
```bash
# .env
NAS_BASE_PATH=/mnt/nas/documents
NAS_USERNAME=admin
NAS_PASSWORD=password
NAS_SERVER=//nas-server/documents
```

## 📋 Bonnes Pratiques

### Nommage des Fichiers
- **Fiches de paie** : `Nom_Prenom_MoisAnnee.pdf`
- **Contrats** : `Contrat_Nom_Prenom.pdf`
- **Attestations** : `Attestation_Nom_Prenom_Type.pdf`

### Organisation des Dossiers
```
Documents/
├── Fiches_Paie_2025/
│   ├── Janvier/
│   ├── Fevrier/
│   └── Mars/
├── Contrats/
└── Attestations/
```

### Sécurité
- Les documents personnels sont automatiquement supprimés après 1 mois
- Accès restreint par employé
- Logs de téléchargement
- Chiffrement des fichiers sensibles

## 🆘 Dépannage

### Problèmes Courants
1. **"Fichier trop volumineux"** : Limite de 10MB par fichier
2. **"Type de fichier non autorisé"** : Utiliser PDF, DOC, DOCX, JPG, PNG
3. **"Employé non trouvé"** : Vérifier le nommage des fichiers
4. **"Erreur NAS"** : Vérifier la configuration du chemin NAS

### Logs de Débogage
```bash
# Vérifier les logs du backend
tail -f logs/backend.log

# Vérifier l'accès au NAS
ls -la /mnt/nas/documents/

# Tester l'API
curl -X GET https://boulangerie-planning-api-4-pbfy.onrender.com/api/documents/general
```

## 📞 Support

Pour toute question ou problème :
1. Vérifier les logs dans la console du navigateur
2. Consulter les logs du backend
3. Vérifier la configuration NAS
4. Contacter l'administrateur système

