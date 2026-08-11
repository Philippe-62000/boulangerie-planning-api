const User = require('../models/User');
const Employee = require('../models/Employee');
const fs = require('fs');
const path = require('path');

/** Clé .bat sans accents (ex. Méline → MELINE) */
function batKeyPart(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

/**
 * Découpe "Prénom NOM" ou "NOM Prénom" → { lastName, firstName } pour mots_de_passe.bat.
 * Homonymes : clé pwd_NOM_PRENOM (ex. POUILLAUDE_LAURA / POUILLAUDE_NICOLAS).
 */
function parseEmployeeNameParts(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { lastName: '', firstName: '' };
  const firstIsLastName =
    parts.length >= 2 &&
    parts[0] === parts[0].toUpperCase() &&
    /[A-ZÀ-Ÿ]{2,}/.test(parts[0]);
  if (firstIsLastName) {
    return {
      lastName: batKeyPart(parts[0]),
      firstName: batKeyPart(parts.slice(1).join(' '))
    };
  }
  return {
    lastName: batKeyPart(parts[parts.length - 1]),
    firstName: batKeyPart(parts.slice(0, -1).join(' '))
  };
}

function buildPayslipBatKey(name, lastNameCounts) {
  const { lastName, firstName } = parseEmployeeNameParts(name);
  if (!lastName) return null;
  if ((lastNameCounts.get(lastName) || 0) > 1 && firstName) {
    return `${lastName}_${firstName}`;
  }
  return lastName;
}

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

      let employeeUser = await User.findOne({ 
        username: 'salarie',
        role: 'employee',
        isActive: true 
      });

      // Si l'utilisateur employee n'existe pas, le créer
      if (!employeeUser) {
        console.log('⚠️ Utilisateur employee non trouvé, création en cours...');
        employeeUser = new User({
          username: 'salarie',
          password: employee, // Le mot de passe sera mis à jour juste après
          role: 'employee',
          name: 'Salarié',
          permissions: [
            'view_planning',
            'view_absences',
            'view_sales_stats',
            'view_meal_expenses',
            'view_km_expenses'
          ],
          isActive: true
        });
        await employeeUser.save();
        console.log('✅ Utilisateur employee créé');
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
    
    // Compter les homonymes (même nom de famille) pour résoudre pwd_NOM vs pwd_NOM_PRENOM
    const lastNameCounts = new Map();
    for (const employee of employees) {
      const { lastName } = parseEmployeeNameParts(employee.name);
      if (lastName) lastNameCounts.set(lastName, (lastNameCounts.get(lastName) || 0) + 1);
    }

    // Mettre à jour les mots de passe
    for (const employee of employees) {
      const { lastName, firstName } = parseEmployeeNameParts(employee.name);
      const compoundKey = firstName ? `${lastName}_${firstName}` : null;
      const preferredKey = buildPayslipBatKey(employee.name, lastNameCounts);

      let password = null;
      let matchedKey = null;
      if (preferredKey && passwordsMap.has(preferredKey)) {
        password = passwordsMap.get(preferredKey);
        matchedKey = preferredKey;
      } else if (compoundKey && passwordsMap.has(compoundKey)) {
        password = passwordsMap.get(compoundKey);
        matchedKey = compoundKey;
      } else if (lastName && passwordsMap.has(lastName) && (lastNameCounts.get(lastName) || 0) <= 1) {
        // Clé courte uniquement s'il n'y a pas d'homonyme (évite d'attribuer le mauvais MDP)
        password = passwordsMap.get(lastName);
        matchedKey = lastName;
      }

      if (password != null) {
        employee.payslipPassword = password;
        await employee.save();
        updatedCount++;
        console.log(`✅ Mis à jour: ${employee.name} (${matchedKey})`);
      } else {
        notFoundNames.push({ name: employee.name, lastName, firstName });
      }
    }
    
    // Marquer les noms du fichier qui n'ont pas été utilisés
    const unusedNames = [];
    for (const [nom] of passwordsMap.entries()) {
      let used = false;
      for (const employee of employees) {
        const preferredKey = buildPayslipBatKey(employee.name, lastNameCounts);
        const { lastName, firstName } = parseEmployeeNameParts(employee.name);
        const compoundKey = firstName ? `${lastName}_${firstName}` : null;
        if (nom === preferredKey || nom === compoundKey || nom === lastName) {
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
    
    // Homonymes (ex. Laura + Nicolas Pouillaude) → clé pwd_NOM_PRENOM
    const lastNameCounts = new Map();
    for (const employee of employees) {
      const { lastName } = parseEmployeeNameParts(employee.name);
      if (lastName) lastNameCounts.set(lastName, (lastNameCounts.get(lastName) || 0) + 1);
    }

    // Construire le contenu du fichier .bat
    let batContent = '@echo off\n';
    batContent += 'REM Définir les mots de passe pour chaque utilisateur\n';
    batContent += 'REM Homonymes: pwd_NOM_PRENOM (ex. pwd_POUILLAUDE_LAURA)\n';
    
    for (const employee of employees) {
      const key = buildPayslipBatKey(employee.name, lastNameCounts);
      if (!key) continue;
      const { lastName, firstName } = parseEmployeeNameParts(employee.name);
      if ((lastNameCounts.get(lastName) || 0) > 1) {
        batContent += `REM ${employee.name} (homonyme ${lastName})\n`;
      }
      const pwd = employee.payslipPassword != null && employee.payslipPassword !== ''
        ? employee.payslipPassword
        : 'null';
      batContent += `set "pwd_${key}=${pwd}"\n`;
      if ((lastNameCounts.get(lastName) || 0) > 1 && !firstName) {
        batContent += `REM ATTENTION: pas de prenom pour distinguer ${employee.name}\n`;
      }
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

// Mettre à jour les mots de passe des fiches de paie
const updatePayslipPasswords = async (req, res) => {
  try {
    console.log('📝 Mise à jour des mots de passe des fiches de paie');
    console.log('📋 Body reçu:', req.body);
    const { passwords } = req.body; // Array of { employeeId, payslipPassword }
    
    if (!passwords || !Array.isArray(passwords)) {
      return res.status(400).json({
        success: false,
        error: 'Les mots de passe doivent être fournis sous forme de tableau'
      });
    }
    
    let updatedCount = 0;
    const errors = [];
    
    for (const { employeeId, payslipPassword } of passwords) {
      try {
        const employee = await Employee.findById(employeeId);
        if (!employee) {
          errors.push(`Employé ${employeeId} non trouvé`);
          continue;
        }
        
        // Ne pas convertir les chaînes vides en null - garder la chaîne vide ou null
        if (payslipPassword === null || payslipPassword === undefined || (typeof payslipPassword === 'string' && payslipPassword.trim() === '')) {
          employee.payslipPassword = null;
        } else {
          employee.payslipPassword = payslipPassword.trim();
        }
        await employee.save();
        updatedCount++;
      } catch (error) {
        errors.push(`Erreur pour ${employeeId}: ${error.message}`);
      }
    }
    
    res.json({
      success: true,
      message: `${updatedCount} mot(s) de passe mis à jour`,
      updated: updatedCount,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des mots de passe:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la mise à jour des mots de passe'
    });
  }
};

module.exports = {
  updatePassword,
  getUsers,
  getPayslipPasswords,
  downloadPayslipPasswordsBat,
  importPayslipPasswordsFromBat,
  updatePayslipPasswords
};
