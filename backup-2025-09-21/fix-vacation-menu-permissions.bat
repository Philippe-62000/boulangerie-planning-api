@echo off
echo 🔧 Correction du menu Gestion des Congés...
echo.

echo 📝 Forcer la recréation des permissions de menu...

REM Créer un script Node.js pour forcer la recréation des permissions
echo const mongoose = require('mongoose'); > fix-vacation-menu.js
echo const MenuPermissions = require('./backend/models/MenuPermissions'); >> fix-vacation-menu.js
echo. >> fix-vacation-menu.js
echo async function fixVacationMenu() { >> fix-vacation-menu.js
echo   try { >> fix-vacation-menu.js
echo     await mongoose.connect('mongodb+srv://phimjc:ZDOPZA2Kd8ylewoR@cluster0.4huietv.mongodb.net/boulangerie-planning?retryWrites=true&w=majority'); >> fix-vacation-menu.js
echo     console.log('✅ Connecté à MongoDB'); >> fix-vacation-menu.js
echo. >> fix-vacation-menu.js
echo     // Supprimer toutes les permissions existantes >> fix-vacation-menu.js
echo     await MenuPermissions.deleteMany({}); >> fix-vacation-menu.js
echo     console.log('🗑️ Anciennes permissions supprimées'); >> fix-vacation-menu.js
echo. >> fix-vacation-menu.js
echo     // Recréer les permissions par défaut >> fix-vacation-menu.js
echo     await MenuPermissions.createDefaultPermissions(); >> fix-vacation-menu.js
echo     console.log('✅ Nouvelles permissions créées'); >> fix-vacation-menu.js
echo. >> fix-vacation-menu.js
echo     // Vérifier que le menu vacation-management existe >> fix-vacation-menu.js
echo     const vacationMenu = await MenuPermissions.findOne({ menuId: 'vacation-management' }); >> fix-vacation-menu.js
echo     if (vacationMenu) { >> fix-vacation-menu.js
echo       console.log('✅ Menu Gestion des Congés trouvé:', vacationMenu.menuName); >> fix-vacation-menu.js
echo     } else { >> fix-vacation-menu.js
echo       console.log('❌ Menu Gestion des Congés non trouvé'); >> fix-vacation-menu.js
echo     } >> fix-vacation-menu.js
echo. >> fix-vacation-menu.js
echo     // Lister toutes les permissions >> fix-vacation-menu.js
echo     const allPermissions = await MenuPermissions.find({}).sort({ order: 1 }); >> fix-vacation-menu.js
echo     console.log('📋 Permissions créées:'); >> fix-vacation-menu.js
echo     allPermissions.forEach(p => console.log(\`  - \${p.menuId}: \${p.menuName} (admin: \${p.isVisibleToAdmin}, employee: \${p.isVisibleToEmployee})\`)); >> fix-vacation-menu.js
echo. >> fix-vacation-menu.js
echo     process.exit(0); >> fix-vacation-menu.js
echo   } catch (error) { >> fix-vacation-menu.js
echo     console.error('❌ Erreur:', error); >> fix-vacation-menu.js
echo     process.exit(1); >> fix-vacation-menu.js
echo   } >> fix-vacation-menu.js
echo } >> fix-vacation-menu.js
echo. >> fix-vacation-menu.js
echo fixVacationMenu(); >> fix-vacation-menu.js

echo ✅ Script créé
echo.

echo 🔧 Exécution de la correction...
node fix-vacation-menu.js

echo.
echo 🧹 Suppression du script temporaire...
del fix-vacation-menu.js

echo.
echo ✅ Correction terminée !
echo.
pause
