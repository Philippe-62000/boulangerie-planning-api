const axios = require('axios');

async function testConstraintsAPI() {
  console.log('🔍 Test de l\'API des contraintes pour la semaine 36...');
  
  try {
    // Test 1: Vérifier que l'API répond
    console.log('\n1. Test de connexion à l\'API...');
    const healthResponse = await axios.get('https://boulangerie-planning-api-3.onrender.com/health', {
      timeout: 30000
    });
    console.log('✅ API accessible:', healthResponse.data);
    
    // Test 2: Récupérer les contraintes pour la semaine 36, 2025
    console.log('\n2. Test de récupération des contraintes (semaine 36, 2025)...');
    const constraintsResponse = await axios.get('https://boulangerie-planning-api-3.onrender.com/api/constraints/36/2025', {
      timeout: 30000
    });
    
    console.log('✅ Contraintes récupérées:', constraintsResponse.data.length, 'contraintes trouvées');
    
    if (constraintsResponse.data.length > 0) {
      console.log('\n📋 Détail des contraintes:');
      constraintsResponse.data.forEach(constraint => {
        console.log(`\n👤 ${constraint.employeeId.name} (${constraint.employeeId.role}):`);
        if (constraint.constraints && typeof constraint.constraints === 'object') {
          Object.entries(constraint.constraints).forEach(([day, value]) => {
            if (value) {
              console.log(`  ${day}: ${value}`);
            }
          });
        } else {
          console.log('  Aucune contrainte définie');
        }
      });
      
      // Test spécifique pour Severine et les apprentis
      console.log('\n🔍 Vérification des contraintes spécifiques:');
      
      const severineConstraints = constraintsResponse.data.find(c => 
        c.employeeId.name === 'Severine'
      );
      
      if (severineConstraints) {
        console.log('\n👤 Severine:');
        if (severineConstraints.constraints && severineConstraints.constraints.Dimanche === 'CP') {
          console.log('✅ Dimanche: CP (correct)');
        } else {
          console.log('❌ Dimanche: Pas en CP - problème !');
        }
      }
      
      // Vérifier les apprentis
      const apprentis = constraintsResponse.data.filter(c => 
        c.employeeId.role === 'apprenti'
      );
      
      if (apprentis.length > 0) {
        console.log('\n👨‍🎓 Apprentis:');
        apprentis.forEach(apprenti => {
          console.log(`\n  ${apprenti.employeeId.name}:`);
          if (apprenti.constraints && typeof apprenti.constraints === 'object') {
            Object.entries(apprenti.constraints).forEach(([day, value]) => {
              if (value === 'Formation') {
                console.log(`    ${day}: Formation ✅`);
              } else if (value === 'Repos') {
                console.log(`    ${day}: Repos ❌ (devrait être Formation)`);
              } else if (value) {
                console.log(`    ${day}: ${value}`);
              }
            });
          }
        });
      }
      
    } else {
      console.log('❌ Aucune contrainte trouvée pour cette semaine');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📄 Données d\'erreur:', error.response.data);
    }
  }
}

testConstraintsAPI();
