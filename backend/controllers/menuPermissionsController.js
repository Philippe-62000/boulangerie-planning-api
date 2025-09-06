const MenuPermissions = require('../models/MenuPermissions');

// Créer les permissions par défaut au démarrage
MenuPermissions.createDefaultPermissions();

const getMenuPermissions = async (req, res) => {
  try {
    const { role } = req.query;

    console.log('📋 Récupération des permissions de menu pour le rôle:', role);

    let query = { isActive: true };
    
    // Filtrer selon le rôle
    if (role === 'admin') {
      query.isVisibleToAdmin = true;
    } else if (role === 'employee') {
      query.isVisibleToEmployee = true;
    }

    const menuPermissions = await MenuPermissions.find(query)
      .sort({ order: 1 });

    console.log(`✅ ${menuPermissions.length} permissions de menu récupérées`);

    res.json({
      success: true,
      menuPermissions: menuPermissions
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des permissions de menu:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des permissions'
    });
  }
};

const updateMenuPermission = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log('📝 Mise à jour de la permission de menu:', id, updateData);

    const updatedPermission = await MenuPermissions.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedPermission) {
      return res.status(404).json({
        success: false,
        error: 'Permission de menu non trouvée'
      });
    }

    console.log('✅ Permission de menu mise à jour');

    res.json({
      success: true,
      menuPermission: updatedPermission,
      message: 'Permission mise à jour avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de la permission:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la mise à jour'
    });
  }
};

const updateAllMenuPermissions = async (req, res) => {
  try {
    const { permissions } = req.body;

    console.log('📝 Mise à jour de toutes les permissions de menu');
    console.log('📋 Données reçues:', req.body);
    console.log('📋 Permissions:', permissions);

    if (!Array.isArray(permissions)) {
      console.log('❌ Les permissions ne sont pas un tableau:', typeof permissions);
      return res.status(400).json({
        success: false,
        error: 'Les permissions doivent être un tableau'
      });
    }

    const updatePromises = permissions.map(permission => {
      return MenuPermissions.findByIdAndUpdate(
        permission._id,
        {
          isVisibleToAdmin: permission.isVisibleToAdmin,
          isVisibleToEmployee: permission.isVisibleToEmployee,
          order: permission.order
        },
        { new: true, runValidators: true }
      );
    });

    const updatedPermissions = await Promise.all(updatePromises);

    console.log('✅ Toutes les permissions de menu mises à jour');

    res.json({
      success: true,
      menuPermissions: updatedPermissions,
      message: 'Toutes les permissions ont été mises à jour'
    });

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la mise à jour'
    });
  }
};

const getAllMenuPermissions = async (req, res) => {
  try {
    console.log('📋 Récupération de toutes les permissions de menu');

    const allPermissions = await MenuPermissions.find({ isActive: true })
      .sort({ order: 1 });

    console.log(`✅ ${allPermissions.length} permissions de menu récupérées`);

    res.json({
      success: true,
      menuPermissions: allPermissions
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération'
    });
  }
};

module.exports = {
  getMenuPermissions,
  updateMenuPermission,
  updateAllMenuPermissions,
  getAllMenuPermissions
};
