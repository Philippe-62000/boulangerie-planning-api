const mongoose = require('mongoose');
const Parameter = require('./backend/models/Parameters');

async function checkKmParameters() {
  try {
    await mongoose.connect('mongodb+srv://phimjc:ZDOPZA2Kd8ylewoR@cluster0.4huietv.mongodb.net/boulangerie-planning?retryWrites=true&w=majority');
    console.log('✅ Connecté à MongoDB');
    
    // Récupérer tous les paramètres
    const allParameters = await Parameter.find({}).sort({ name: 1 });
    console.log(`📋 ${allParameters.length} paramètres trouvés:`);
    
    allParameters.forEach(param => {
      console.log(`  - ${param.name}: ${param.displayName} (kmValue: ${param.kmValue})`);
    });
    
    // Récupérer les paramètres avec kmValue > 0
    const kmParameters = await Parameter.find({ kmValue: { $gt: 0 } }).sort({ name: 1 });
    console.log(`\n🚗 ${kmParameters.length} paramètres KM (kmValue > 0):`);
    
    kmParameters.forEach(param => {
      console.log(`  - ${param.name}: ${param.displayName} (${param.kmValue} km)`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

checkKmParameters();
