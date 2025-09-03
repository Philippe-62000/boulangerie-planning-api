const { MongoClient } = require('mongodb');

// Configuration MongoDB
const MONGODB_URI = 'mongodb+srv://phimjc:ZDOPZA2Kd8ylewoR@cluster0.4huietv.mongodb.net/boulangerie-planning?retryWrites=true&w=majority';

async function testPlanningCorrections() {
  console.log('🧪 TEST DES CORRECTIONS DU PLANNING');
  console.log('=====================================');
  
  try {
    // Connexion MongoDB
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connecté à MongoDB');
    
    const db = client.db('boulangerie-planning');
    
    // Test 1: Vérifier les employés
    console.log('\n📊 Test 1: Vérification des employés');
    const employees = await db.collection('employees').find({}).toArray();
    console.log(`👥 ${employees.length} employés trouvés`);
    
    employees.forEach(emp => {
      console.log(`  - ${emp.name}: ${emp.weeklyHours}h, Compétences: ${emp.skills?.join(', ') || 'Aucune'}`);
    });
    
    // Test 2: Vérifier les contraintes de la semaine 36
    console.log('\n📊 Test 2: Vérification des contraintes semaine 36');
    const constraints = await db.collection('weeklyconstraints').find({
      weekNumber: 36,
      year: 2025
    }).toArray();
    console.log(`📋 ${constraints.length} contraintes trouvées`);
    
    // Test 3: Vérifier le planning existant
    console.log('\n📊 Test 3: Vérification du planning semaine 36');
    const plannings = await db.collection('plannings').find({
      weekNumber: 36,
      year: 2025
    }).toArray();
    console.log(`📅 ${plannings.length} plannings trouvés`);
    
    if (plannings.length > 0) {
      console.log('\n📊 Analyse du planning existant:');
      plannings.forEach(planning => {
        const employee = employees.find(emp => emp._id.toString() === planning.employeeId.toString());
        if (employee) {
          console.log(`\n👤 ${employee.name} (${employee.weeklyHours}h contractuelles):`);
          console.log(`   Total planifié: ${planning.totalWeeklyHours}h`);
          console.log(`   Écart: ${planning.totalWeeklyHours - employee.weeklyHours}h`);
          
          // Analyser par jour
          planning.schedule.forEach(day => {
            if (day.shifts && day.shifts.length > 0) {
              console.log(`   ${day.day}: ${day.shifts.length} shifts, ${day.totalHours}h`);
            } else if (day.constraint) {
              console.log(`   ${day.day}: ${day.constraint}`);
            } else {
              console.log(`   ${day.day}: Vide`);
            }
          });
        }
      });
    }
    
    // Test 4: Vérifier les besoins en personnel
    console.log('\n📊 Test 4: Vérification des besoins en personnel');
    const dailyRequirements = {
      'Lundi': { opening: 1, afternoon: 2, evening: 1, total: 4 },
      'Mardi': { opening: 1, afternoon: 2, evening: 1, total: 4 },
      'Mercredi': { opening: 1, afternoon: 2, evening: 1, total: 4 },
      'Jeudi': { opening: 1, afternoon: 2, evening: 1, total: 4 },
      'Vendredi': { opening: 1, afternoon: 2, evening: 1, total: 4 },
      'Samedi': { opening: 3, evening: 2, total: 5 },
      'Dimanche': { opening: 3, evening: 2, total: 5 }
    };
    
    console.log('📋 Besoins quotidiens:');
    Object.entries(dailyRequirements).forEach(([day, needs]) => {
      console.log(`   ${day}: ${needs.total} personnes (${needs.opening || 0} ouverture, ${needs.afternoon || 0} après-midi, ${needs.evening || 0} soirée)`);
    });
    
    // Test 5: Vérifier l'équilibre des weekends
    console.log('\n📊 Test 5: Vérification de l\'équilibre des weekends');
    const weekendPlannings = plannings.filter(planning => {
      const weekendDays = planning.schedule.filter(day => 
        day.day === 'Samedi' || day.day === 'Dimanche'
      );
      return weekendDays.some(day => day.shifts && day.shifts.length > 0);
    });
    
    console.log(`🏪 ${weekendPlannings.length} employés travaillent le weekend`);
    
    // Test 6: Recommandations
    console.log('\n📊 Test 6: Recommandations');
    console.log('✅ Corrections appliquées:');
    console.log('   - Limites strictes sur la sélection des employés');
    console.log('   - Tolérance réduite sur les heures (1h au lieu de 2h)');
    console.log('   - Meilleur équilibrage des weekends');
    console.log('   - Respect strict des besoins en personnel');
    
    console.log('\n🔧 Prochaines étapes:');
    console.log('   1. Régénérer le planning semaine 36');
    console.log('   2. Vérifier que les volumes horaires sont respectés');
    console.log('   3. Vérifier l\'équilibre personnel par jour');
    console.log('   4. Tester avec différentes affluences');
    
    await client.close();
    console.log('\n✅ Test terminé');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Exécuter le test
testPlanningCorrections();
