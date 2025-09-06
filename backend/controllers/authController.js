const User = require('../models/User');

// Créer les utilisateurs par défaut au démarrage
User.createDefaultUsers();

const login = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    console.log('🔐 Tentative de connexion:', { username, role });

    // Validation des données
    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Nom d\'utilisateur, mot de passe et rôle requis'
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
      return res.status(401).json({
        success: false,
        error: 'Identifiants incorrects'
      });
    }

    // Vérifier le mot de passe (version simple pour le moment)
    if (user.password !== password) {
      console.log('❌ Mot de passe incorrect pour:', username);
      return res.status(401).json({
        success: false,
        error: 'Identifiants incorrects'
      });
    }

    // Mettre à jour la dernière connexion
    user.lastLogin = new Date();
    await user.save();

    console.log('✅ Connexion réussie pour:', username);

    // Retourner les informations utilisateur (sans le mot de passe)
    const userResponse = {
      id: user._id,
      username: user.username,
      role: user.role,
      name: user.name,
      permissions: user.permissions,
      lastLogin: user.lastLogin
    };

    res.json({
      success: true,
      user: userResponse,
      message: 'Connexion réussie'
    });

  } catch (error) {
    console.error('❌ Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la connexion'
    });
  }
};

const verifyToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token requis'
      });
    }

    // Pour l'instant, on accepte tous les tokens valides
    // En production, implémenter JWT ou session
    res.json({
      success: true,
      message: 'Token valide'
    });

  } catch (error) {
    console.error('❌ Erreur lors de la vérification du token:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la vérification'
    });
  }
};

const logout = async (req, res) => {
  try {
    // En production, invalider le token côté serveur
    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    console.error('❌ Erreur lors de la déconnexion:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la déconnexion'
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .select('-password')
      .sort({ role: 1, name: 1 });

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
  login,
  verifyToken,
  logout,
  getUsers
};
