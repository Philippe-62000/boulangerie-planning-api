const User = require('../models/User');
const Employee = require('../models/Employee');
const fs = require('fs');
const path = require('path');

const updatePassword = async (req, res) => {
  try {
    const { admin, employee } = req.body;

    console.log('🔐 Mise à jour des mots de passe:', { admin, employee });

    // Validation des données
    if (!admin && !employee) {
      return res.status(400).json({
        success: false,
        error: 'Au moins un mot de passe (admin ou employee) est requis'
      });
    }

    const results = [];

    // Mettre à jour le mot de passe admin si fourni
    if (admin) {
      if (admin.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Le mot de passe admin doit contenir au moins 6 caractères'
        });
      }

      const adminUser = await User.findOne({ 
        username: 'admin',
        role: 'admin',
        isActive: true 
      });

      if (!adminUser) {
        console.log('❌ Utilisateur admin non trouvé');
        return res.status(404).json({
          success: false,
          error: 'Utilisateur admin non trouvé'
        });
      }

      adminUser.password = admin;
      await adminUser.save();
      results.push('admin');
      console.log('✅ Mot de passe admin mis à jour');
    }

    // Mettre à jour le mot de passe employee si fourni
    if (employee) {
      if (employee.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Le mot de passe employee doit contenir au moins 6 caractères'
        });
      }

      const employeeUser = await User.findOne({ 
        username: 'salarie',
        role: 'employee',
        isActive: true 
      });

      if (!employeeUser) {
        console.log('❌ Utilisateur employee non trouvé');
        return res.status(404).json({
          success: false,
          error: 'Utilisateur employee non trouvé'
        });
      }

      employeeUser.password = employee;
      await employeeUser.save();
      results.push('employee');
      console.log('✅ Mot de passe employee mis à jour');
    }

    res.json({
      success: true,
      message: `Mots de passe mis à jour avec succès: ${results.join(', ')}`
    });

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du mot de passe:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la mise à jour du mot de passe'
    });
  }
};

const getUsers = async (req, res) => {
  try {
    console.log('📋 Récupération de la liste des utilisateurs');

    const users = await User.find({ isActive: true })
      .select('-password')
      .sort({ role: 1, name: 1 });

    console.log(`✅ ${users.length} utilisateurs récupérés`);

    res.json({
      success: true,
      users: users
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des utilisateurs'
    });
  }
};

// Fonction pour générer un mot de passe de 10 caractères avec lettres, chiffres et caractères spéciaux
const generatePayslipPassword = () => {
  const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const special = '@#$';
  
  let password = '';
  
  // Ajouter 8 lettres
  for (let i = 0; i < 8; i++) {
    password += letters[Math.floor(Math.random() * letters.length)];
  }
  
  // Ajouter 1 chiffre
  password += digits[Math.floor(Math.random() * digits.length)];
  
  // Ajouter 1 caractère spécial
  password += special[Math.floor(Math.random() * special.length)];
  
  // Mélanger les caractères
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Récupérer tous les employés avec leurs mots de passe de fiche de paie
const getPayslipPasswords = async (req, res) => {
  try {
    console.log('📋 Récupération des mots de passe des fiches de paie');
    
    const employees = await Employee.find({ isActive: true })
      .select('name payslipPassword')
      .sort({ name: 1 });
    
    // Retourner les employés avec leurs mots de passe (sans génération automatique)
    const employeesWithPasswords = employees.map((employee) => ({
      _id: employee._id,
      name: employee.name,
      payslipPassword: employee.payslipPassword || null
    }));
    
    console.log(`✅ ${employeesWithPasswords.length} employés récupérés avec leurs mots de passe`);
    
    res.json({
      success: true,
      data: employeesWithPasswords
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des mots de passe:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des mots de passe'
    });
  }
};

// Importer les mots de passe depuis le fichier mots_de_passe.bat
const importPayslipPasswordsFromBat = async (req, res) => {
  try {
    console.log('📥 Import des mots de passe depuis mots_de_passe.bat');
    
    let fileContent = '';
    
    // Option 1: Si le contenu est envoyé dans le body
    if (req.body && req.body.content) {
      fileContent = req.body.content;
    } 
    // Option 2: Essayer de lire depuis le fichier local (pour développement)
    else {
      const batFilePath = path.join(__dirname, '../../mots_de_passe.bat');
      if (fs.existsSync(batFilePath)) {
        fileContent = fs.readFileSync(batFilePath, 'utf8');
      } else {
        return res.status(400).json({
          success: false,
          error: 'Le fichier mots_de_passe.bat est introuvable. Veuillez envoyer le contenu du fichier dans le body (content).'
        });
      }
    }
    
    if (!fileContent || fileContent.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Le contenu du fichier est vide'
      });
    }
    
    const lines = fileContent.split('\n');
    
    // Parser les mots de passe
    const passwordsMap = new Map();
    for (const line of lines) {
      const trimmedLine = line.trim();
      // Format: set "pwd_NOM=mot_de_passe"
      const match = trimmedLine.match(/^set\s+"pwd_([^"]+)=([^"]+)"$/);
      if (match) {
        const nom = match[1].trim();
        const password = match[2].trim();
        passwordsMap.set(nom, password);
        console.log(`📋 Trouvé: ${nom} = ${password}`);
      }
    }
    
    if (passwordsMap.size === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucun mot de passe trouvé dans le fichier'
      });
    }
    
    // Récupérer tous les employés actifs
    const employees = await Employee.find({ isActive: true });
    
    let updatedCount = 0;
    let notFoundNames = [];
    
    // Mettre à jour les mots de passe
    for (const employee of employees) {
      // Extraire le nom de famille (dernier mot en majuscules)
      const nameParts = employee.name.trim().split(/\s+/);
      const lastName = nameParts[nameParts.length - 1].toUpperCase();
      
      // Chercher le mot de passe correspondant
      if (passwordsMap.has(lastName)) {
        employee.payslipPassword = passwordsMap.get(lastName);
        await employee.save();
        updatedCount++;
        console.log(`✅ Mis à jour: ${employee.name} (${lastName})`);
      } else {
        // Si pas trouvé exactement, chercher par correspondance partielle
        let found = false;
        for (const [nom, password] of passwordsMap.entries()) {
          // Vérifier si le nom de famille contient le nom du fichier ou vice versa
          if (employee.name.toUpperCase().includes(nom) || nom.includes(lastName)) {
            employee.payslipPassword = password;
            await employee.save();
            updatedCount++;
            found = true;
            console.log(`✅ Mis à jour (correspondance): ${employee.name} (${lastName}) = ${nom}`);
            break;
          }
        }
        if (!found) {
          notFoundNames.push({ name: employee.name, lastName: lastName });
        }
      }
    }
    
    // Marquer les noms du fichier qui n'ont pas été utilisés
    const unusedNames = [];
    for (const [nom] of passwordsMap.entries()) {
      let used = false;
      for (const employee of employees) {
        const nameParts = employee.name.trim().split(/\s+/);
        const lastName = nameParts[nameParts.length - 1].toUpperCase();
        if (lastName === nom || employee.name.toUpperCase().includes(nom) || nom.includes(lastName)) {
          used = true;
          break;
        }
      }
      if (!used) {
        unusedNames.push(nom);
      }
    }
    
    res.json({
      success: true,
      message: `Import terminé: ${updatedCount} employé(s) mis à jour`,
      stats: {
        totalInFile: passwordsMap.size,
        updated: updatedCount,
        notFound: notFoundNames.length,
        unused: unusedNames.length
      },
      notFound: notFoundNames,
      unused: unusedNames
    });
    
    console.log(`✅ Import terminé: ${updatedCount} employé(s) mis à jour`);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de l\'import des mots de passe'
    });
  }
};

// Télécharger le fichier mots_de_passe.bat
const downloadPayslipPasswordsBat = async (req, res) => {
  try {
    console.log('📥 Génération du fichier mots_de_passe.bat');
    
    const employees = await Employee.find({ isActive: true })
      .select('name payslipPassword')
      .sort({ name: 1 });
    
    // Ne pas générer automatiquement les mots de passe manquants
    // Ils doivent être importés depuis le fichier .bat ou créés manuellement
    
    // Construire le contenu du fichier .bat
    let batContent = '@echo off\n';
    batContent += 'REM Définir les mots de passe pour chaque utilisateur\n';
    
    for (const employee of employees) {
      // Extraire le nom de famille (dernier mot du nom)
      // Format attendu dans proteger_pdf.bat: "YYYYMM NOM Prenom_Normal.pdf"
      // Le script extrait tokens=2, donc le format attendu est "NOM Prenom"
      // Dans mots_de_passe.bat, on utilise juste "NOM" en majuscules
      const nameParts = employee.name.trim().split(/\s+/);
      // Prendre le dernier mot comme nom de famille (cas le plus courant: "Prénom NOM")
      let lastName = nameParts[nameParts.length - 1];
      
      // Si le premier mot est en majuscules, c'est peut-être "NOM Prénom"
      // Mais on prend toujours le dernier mot pour cohérence avec le format "Prénom NOM"
      lastName = lastName.toUpperCase();
      
      batContent += `set "pwd_${lastName}=${employee.payslipPassword}"\n`;
    }
    
    // Définir les headers pour le téléchargement
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename="mots_de_passe.bat"');
    
    // Envoyer le contenu
    res.send(batContent);
    
    console.log('✅ Fichier mots_de_passe.bat généré avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération du fichier:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la génération du fichier'
    });
  }
};

module.exports = {
  updatePassword,
  getUsers,
  getPayslipPasswords,
  downloadPayslipPasswordsBat,
  importPayslipPasswordsFromBat
};
