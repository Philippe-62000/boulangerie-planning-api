/**
 * Script de test pour la nouvelle stratégie de calcul de planning
 * Test l'intégration complète avec l'API OR-Tools adaptée
 */

// Utiliser fetch natif Node.js 18+
const fetch = globalThis.fetch;

// Configuration de test
const API_URL = 'https://planning-ortools-api.onrender.com/solve';

// Données de test représentatives
const testData = {
  employees: [
    {
      id: "emp1",
      name: "Alice Dupont",
      volume: 35,
      status: "Majeur",
      contract: "CDI",
      skills: ["Ouverture"],
      function: "Manager"
    },
    {
      id: "emp2", 
      name: "Bob Martin",
      volume: 39,
      status: "Majeur",
      contract: "CDI",
      skills: ["Fermeture"],
      function: "Responsable"
    },
    {
      id: "emp3",
      name: "Clara Durand",
      volume: 30,
      status: "Mineur",
      contract: "Apprentissage",
      skills: [],
      function: "Apprenti"
    },
    {
      id: "emp4",
      name: "David Moreau",
      volume: 35,
      status: "Majeur",
      contract: "CDI",
      skills: ["Ouverture"],  // Deuxième personne avec ouverture
      function: "Vendeuse"
    },
    {
      id: "emp5",
      name: "Emma Bernard",
      volume: 32,
      status: "Majeur",
      contract: "CDI",
      skills: ["Fermeture"],  // Deuxième personne avec fermeture
      function: "Vendeuse"
    }
  ],
  constraints: {
    "emp1": {
      "1": "Formation"   // Mardi formation seulement
    },
    "emp3": {
      "0": "Formation"   // Lundi formation seulement (apprenti)
    }
  },
  affluences: [2, 2, 3, 3, 4, 3, 2], // Lun-Dim
  week_number: 36,
  weekend_history: {
    "emp1_saturday": 2,  // Alice a travaillé 2 samedis récemment
    "emp1_sunday": 1,
    "emp2_saturday": 3,  // Bob a beaucoup travaillé les weekends
    "emp2_sunday": 3,
    "emp3_saturday": 0,  // Clara (mineure) n'a pas travaillé
    "emp3_sunday": 0,
    "emp4_saturday": 1,  // David peu de weekends
    "emp4_sunday": 0,
    "emp5_saturday": 2,  // Emma quelques weekends
    "emp5_sunday": 1
  }
};

async function testNouvelleStrategie() {
  console.log('🧪 Test de la nouvelle stratégie de calcul de planning');
  console.log('=' .repeat(60));
  
  try {
    console.log('📡 Envoi des données à l\'API OR-Tools...');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testData),
      timeout: 120000 // 2 minutes
    });
    
    if (!response.ok) {
      console.log('❌ Erreur HTTP:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('📝 Détail erreur:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log('\n✅ Résultat reçu !');
    console.log('Success:', result.success);
    
    if (result.success) {
      console.log('\n📊 ANALYSE DES RÉSULTATS');
      console.log('=' .repeat(40));
      
      // Analyser la répartition par groupe
      if (result.strategy_info) {
        console.log('\n👥 Distribution par groupes:');
        console.log(`- Ouverture: ${result.strategy_info.group_distribution.ouverture} employés`);
        console.log(`- Fermeture: ${result.strategy_info.group_distribution.fermeture} employés`);
        console.log(`- Vente: ${result.strategy_info.group_distribution.vente} employés`);
        
        console.log('\n🔄 Affectations ouvertures/fermetures:');
        Object.entries(result.strategy_info.shift_assignments.opening_assignments).forEach(([day, empId]) => {
          const emp = testData.employees.find(e => e.id === empId);
          console.log(`- Jour ${day}: ${emp?.name || empId} à l'ouverture`);
        });
        
        Object.entries(result.strategy_info.shift_assignments.closing_assignments).forEach(([day, empId]) => {
          const emp = testData.employees.find(e => e.id === empId);
          console.log(`- Jour ${day}: ${emp?.name || empId} à la fermeture`);
        });
        
        console.log('\n📊 Historique weekends pris en compte:');
        Object.entries(result.strategy_info.weekend_scores).forEach(([empId, scores]) => {
          const emp = testData.employees.find(e => e.id === empId);
          console.log(`- ${emp?.name || empId}: ${scores.saturday_count} sam, ${scores.sunday_count} dim (total: ${scores.total_weekend})`);
        });
      }
      
      // Analyser le planning final
      console.log('\n📅 PLANNING GÉNÉRÉ');
      console.log('=' .repeat(40));
      
      const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
      
      testData.employees.forEach(emp => {
        console.log(`\n👤 ${emp.name} (${emp.volume}h contractuelles):`);
        let totalHours = 0;
        
        for (let day = 0; day < 7; day++) {
          const dayName = days[day];
          const slot = result.planning[emp.id]?.[day] || 'Repos';
          
          if (slot === 'Repos') {
            console.log(`  ${dayName}: Repos`);
          } else if (slot === 'Formation') {
            console.log(`  ${dayName}: Formation (8h)`);
            totalHours += 8;
          } else if (slot === 'CP') {
            const cpHours = emp.volume === 35 ? 5.5 : 6.5;
            console.log(`  ${dayName}: Congé payé (${cpHours}h)`);
            totalHours += cpHours;
          } else if (slot === 'MAL') {
            console.log(`  ${dayName}: Maladie`);
          } else {
            // Calculer les heures du créneau
            const slotHours = calculateSlotHours(slot);
            console.log(`  ${dayName}: ${slot} (${slotHours}h)`);
            totalHours += slotHours;
          }
        }
        
        const ecart = totalHours - emp.volume;
        const ecartStr = ecart > 0 ? `+${ecart.toFixed(1)}h` : `${ecart.toFixed(1)}h`;
        console.log(`  ⏱️  Total: ${totalHours}h (écart: ${ecartStr})`);
      });
      
      // Analyser les contraintes respectées
      console.log('\n✅ VÉRIFICATIONS');
      console.log('=' .repeat(40));
      
      // Vérifier repos dimanche pour mineurs
      const minorSundayRest = testData.employees
        .filter(emp => emp.status === 'Mineur')
        .every(emp => {
          const sundaySlot = result.planning[emp.id]?.[6];
          return sundaySlot === 'Repos';
        });
      
      console.log(`👶 Repos dimanche mineurs: ${minorSundayRest ? '✅' : '❌'}`);
      
      // Vérifier ouvertures/fermetures
      let openingsOk = true;
      let closingsOk = true;
      
      for (let day = 0; day < 7; day++) {
        let hasOpening = false;
        let hasClosing = false;
        
        testData.employees.forEach(emp => {
          const slot = result.planning[emp.id]?.[day];
          if (slot && slot.startsWith('06h00')) {
            hasOpening = emp.skills.includes('Ouverture');
          }
          if (slot && slot.includes('20h30') && !slot.startsWith('06h00')) {
            hasClosing = emp.skills.includes('Fermeture');
          }
        });
        
        if (!hasOpening) openingsOk = false;
        if (!hasClosing) closingsOk = false;
      }
      
      console.log(`🌅 Ouvertures correctes: ${openingsOk ? '✅' : '❌'}`);
      console.log(`🌙 Fermetures correctes: ${closingsOk ? '✅' : '❌'}`);
      
      // Afficher les warnings
      if (result.validation.warnings.length > 0) {
        console.log('\n⚠️  Avertissements:');
        result.validation.warnings.forEach(warning => {
          console.log(`  - ${warning}`);
        });
      }
      
      // Info solver
      console.log('\n🔧 Informations solveur:');
      console.log(`- Statut: ${result.solver_info.status}`);
      console.log(`- Temps: ${result.solver_info.solve_time?.toFixed(2) || 'N/A'}s`);
      console.log(`- Objectif: ${result.solver_info.objective || 'N/A'}`);
      
    } else {
      console.log('\n❌ Échec de la résolution:');
      console.log('Erreur:', result.error);
      if (result.diagnostic) {
        console.log('Diagnostic:', result.diagnostic);
      }
      if (result.suggestions) {
        console.log('Suggestions:', result.suggestions);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error.message);
  }
}

function calculateSlotHours(slot) {
  const slotHours = {
    '06h00-14h00': 8.0,
    '07h30-15h30': 8.0,
    '09h00-17h00': 8.0,
    '10h00-18h00': 8.0,
    '11h00-19h00': 8.0,
    '12h00-20h00': 8.0,
    '13h00-20h30': 7.5,
    '14h00-20h30': 6.5,
    '16h00-20h30': 4.5,
    '06h00-16h30': 10.5,
    '07h30-16h30': 9.0,
    '10h30-16h30': 6.0,
    '11h00-18h30': 7.5,
    '12h00-19h30': 7.5,
    '16h30-20h30': 4.0,
    '17h00-20h30': 3.5,
    '06h00-13h00': 7.0,
    '07h30-13h00': 5.5,
    '09h30-13h00': 3.5,
    '11h00-18h00': 7.0,
    '12h00-19h00': 7.0,
    '13h00-20h30': 7.5,
    '14h00-20h30': 6.5
  };
  
  return slotHours[slot] || 0;
}

// Lancer le test
if (require.main === module) {
  testNouvelleStrategie().then(() => {
    console.log('\n🏁 Test terminé');
  }).catch(error => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = { testNouvelleStrategie };
