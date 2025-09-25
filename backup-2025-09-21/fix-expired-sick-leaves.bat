@echo off
echo 🏥 Correction des arrêts maladie expirés...
echo.

echo 📝 Création du script de nettoyage automatique...

REM Créer un script Node.js pour nettoyer les arrêts maladie expirés
echo const mongoose = require('mongoose'); > fix-expired-sick-leaves.js
echo const Employee = require('./backend/models/Employee'); >> fix-expired-sick-leaves.js
echo. >> fix-expired-sick-leaves.js
echo async function cleanExpiredSickLeaves() { >> fix-expired-sick-leaves.js
echo   try { >> fix-expired-sick-leaves.js
echo     await mongoose.connect('mongodb+srv://phimjc:ZDOPZA2Kd8ylewoR@cluster0.4huietv.mongodb.net/boulangerie-planning?retryWrites=true&w=majority'); >> fix-expired-sick-leaves.js
echo     console.log('✅ Connecté à MongoDB'); >> fix-expired-sick-leaves.js
echo. >> fix-expired-sick-leaves.js
echo     const today = new Date(); >> fix-expired-sick-leaves.js
echo     const eightDaysAgo = new Date(today.getTime() - (8 * 24 * 60 * 60 * 1000)); >> fix-expired-sick-leaves.js
echo. >> fix-expired-sick-leaves.js
echo     const employees = await Employee.find({ >> fix-expired-sick-leaves.js
echo       'sickLeave.isOnSickLeave': true >> fix-expired-sick-leaves.js
echo     }); >> fix-expired-sick-leaves.js
echo. >> fix-expired-sick-leaves.js
echo     let cleaned = 0; >> fix-expired-sick-leaves.js
echo     for (const employee of employees) { >> fix-expired-sick-leaves.js
echo       if (employee.sickLeave.endDate ^&^& new Date(employee.sickLeave.endDate) ^<^= eightDaysAgo) { >> fix-expired-sick-leaves.js
echo         console.log(`🧹 Nettoyage arrêt maladie pour ${employee.name} (fini le ${employee.sickLeave.endDate})`); >> fix-expired-sick-leaves.js
echo         await Employee.findByIdAndUpdate(employee._id, { >> fix-expired-sick-leaves.js
echo           'sickLeave.isOnSickLeave': false, >> fix-expired-sick-leaves.js
echo           'sickLeave.startDate': undefined, >> fix-expired-sick-leaves.js
echo           'sickLeave.endDate': undefined >> fix-expired-sick-leaves.js
echo         }); >> fix-expired-sick-leaves.js
echo         cleaned++; >> fix-expired-sick-leaves.js
echo       } >> fix-expired-sick-leaves.js
echo     } >> fix-expired-sick-leaves.js
echo. >> fix-expired-sick-leaves.js
echo     console.log(`✅ ${cleaned} arrêts maladie nettoyés`); >> fix-expired-sick-leaves.js
echo     process.exit(0); >> fix-expired-sick-leaves.js
echo   } catch (error) { >> fix-expired-sick-leaves.js
echo     console.error('❌ Erreur:', error); >> fix-expired-sick-leaves.js
echo     process.exit(1); >> fix-expired-sick-leaves.js
echo   } >> fix-expired-sick-leaves.js
echo } >> fix-expired-sick-leaves.js
echo. >> fix-expired-sick-leaves.js
echo cleanExpiredSickLeaves(); >> fix-expired-sick-leaves.js

echo ✅ Script créé
echo.

echo 🔧 Exécution du nettoyage...
node fix-expired-sick-leaves.js

echo.
echo 🧹 Suppression du script temporaire...
del fix-expired-sick-leaves.js

echo.
echo ✅ Nettoyage terminé !
echo.
pause
