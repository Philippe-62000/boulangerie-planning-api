const User = require('../models/User');

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

module.exports = {
  updatePassword,
  getUsers
};
