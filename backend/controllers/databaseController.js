const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Modèles à exporter
const Employee = require('../models/Employee');
const Parameter = require('../models/Parameters');
const MenuPermissions = require('../models/MenuPermissions');
const SickLeave = require('../models/SickLeave');
const Absence = require('../models/Absence');
const MealExpense = require('../models/MealExpense');
const KmExpense = require('../models/KmExpense');

// Export de la base de données
const exportDatabase = async (req, res) => {
  try {
    console.log('📦 Début de l\'export de la base de données...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      collections: {}
    };

    // Exporter toutes les collections
    const collections = [
      { name: 'employees', model: Employee },
      { name: 'parameters', model: Parameter },
      { name: 'menupermissions', model: MenuPermissions },
      { name: 'sickleaves', model: SickLeave },
      { name: 'absences', model: Absence },
      { name: 'mealexpenses', model: MealExpense },
      { name: 'kmexpenses', model: KmExpense }
    ];

    for (const collection of collections) {
      try {
        const data = await collection.model.find({});
        exportData.collections[collection.name] = data;
        console.log(`✅ Collection ${collection.name}: ${data.length} documents exportés`);
      } catch (error) {
        console.error(`❌ Erreur export collection ${collection.name}:`, error);
        exportData.collections[collection.name] = [];
      }
    }

    // Créer le fichier JSON
    const jsonData = JSON.stringify(exportData, null, 2);
    
    // Envoyer le fichier en téléchargement
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="boulangerie-backup-${timestamp}.json"`);
    res.send(jsonData);

    console.log('✅ Export de la base de données terminé avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'export de la base de données:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'export de la base de données'
    });
  }
};

// Import de la base de données
const importDatabase = async (req, res) => {
  try {
    console.log('📥 Début de l\'import de la base de données...');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier fourni'
      });
    }

    // Lire le contenu du fichier
    const fileContent = req.file.buffer.toString('utf8');
    let importData;
    
    try {
      importData = JSON.parse(fileContent);
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        error: 'Fichier JSON invalide'
      });
    }

    // Vérifier la structure du fichier
    if (!importData.collections) {
      return res.status(400).json({
        success: false,
        error: 'Format de fichier invalide - collections manquantes'
      });
    }

    const importResults = {
      success: true,
      collections: {},
      errors: []
    };

    // Mapping des collections
    const collectionMapping = {
      'employees': Employee,
      'parameters': Parameter,
      'menupermissions': MenuPermissions,
      'sickleaves': SickLeave,
      'absences': Absence,
      'mealexpenses': MealExpense,
      'kmexpenses': KmExpense
    };

    // Importer chaque collection
    for (const [collectionName, data] of Object.entries(importData.collections)) {
      try {
        if (!Array.isArray(data)) {
          console.warn(`⚠️ Collection ${collectionName}: données non valides (pas un tableau)`);
          importResults.collections[collectionName] = { imported: 0, errors: ['Données non valides'] };
          continue;
        }

        const Model = collectionMapping[collectionName];
        if (!Model) {
          console.warn(`⚠️ Collection ${collectionName}: modèle non trouvé`);
          importResults.collections[collectionName] = { imported: 0, errors: ['Modèle non trouvé'] };
          continue;
        }

        // Vider la collection existante
        await Model.deleteMany({});
        console.log(`🗑️ Collection ${collectionName} vidée`);

        // Insérer les nouvelles données
        if (data.length > 0) {
          const result = await Model.insertMany(data, { ordered: false });
          importResults.collections[collectionName] = { 
            imported: result.length, 
            errors: [] 
          };
          console.log(`✅ Collection ${collectionName}: ${result.length} documents importés`);
        } else {
          importResults.collections[collectionName] = { imported: 0, errors: [] };
          console.log(`ℹ️ Collection ${collectionName}: aucune donnée à importer`);
        }

      } catch (error) {
        console.error(`❌ Erreur import collection ${collectionName}:`, error);
        importResults.collections[collectionName] = { 
          imported: 0, 
          errors: [error.message] 
        };
        importResults.errors.push(`${collectionName}: ${error.message}`);
      }
    }

    // Vérifier s'il y a eu des erreurs critiques
    const hasErrors = importResults.errors.length > 0;
    if (hasErrors) {
      importResults.success = false;
    }

    console.log('✅ Import de la base de données terminé');
    console.log('📊 Résultats:', importResults);

    res.json({
      success: importResults.success,
      message: hasErrors ? 'Import terminé avec des erreurs' : 'Import terminé avec succès',
      results: importResults
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'import de la base de données:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'import de la base de données'
    });
  }
};

// Obtenir les statistiques de la base de données
const getDatabaseStats = async (req, res) => {
  try {
    console.log('📊 Récupération des statistiques de la base de données...');
    
    const stats = {};
    
    const collections = [
      { name: 'employees', model: Employee },
      { name: 'parameters', model: Parameter },
      { name: 'menupermissions', model: MenuPermissions },
      { name: 'sickleaves', model: SickLeave },
      { name: 'absences', model: Absence },
      { name: 'mealexpenses', model: MealExpense },
      { name: 'kmexpenses', model: KmExpense }
    ];

    for (const collection of collections) {
      try {
        const count = await collection.model.countDocuments();
        stats[collection.name] = count;
      } catch (error) {
        console.error(`❌ Erreur stats collection ${collection.name}:`, error);
        stats[collection.name] = 0;
      }
    }

    const totalDocuments = Object.values(stats).reduce((sum, count) => sum + count, 0);
    
    res.json({
      success: true,
      stats: {
        collections: stats,
        totalDocuments,
        exportDate: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
};

module.exports = {
  exportDatabase,
  importDatabase,
  getDatabaseStats
};


