const User = require('../models/User');

const updatePassword = async (req, res) => {
  try {
    const { username, newPassword, role } = req.body;

    console.log('🔐 Mise à jour du mot de passe pour:', { username, role });

    // Validation des données
    if (!username || !newPassword || !role) {
      return res.status(400).json({
        success: false,
        error: 'Nom d\'utilisateur, nouveau mot de passe et rôle requis'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Rechercher l'utilisateur
    const user = await User.findOne({ 
      username: username.toLowerCase(),
      role: role,
      isActive: true 
    });

    if (!user) {
      console.log('❌ Utilisateur non trouvé:', { username, role });
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Mettre à jour le mot de passe
    user.password = newPassword;
    await user.save();

    console.log('✅ Mot de passe mis à jour pour:', username);

    res.json({
      success: true,
      message: 'Mot de passe mis à jour avec succès'
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
