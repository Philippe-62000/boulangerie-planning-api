/**
 * Test avec les données réelles de la boulangerie
 */

const fetch = globalThis.fetch;
const API_URL = 'https://planning-ortools-api.onrender.com/solve';

// Données réelles basées sur votre configuration
const realData = {
  employees: [
    {
      id: "adelaïde",
      name: "Adelaïde",
      volume: 35,
      status: "Majeur",
      contract: "CDI",
      skills: ["Ouverture"], // Supposé d'après la responsabilité
      function: "Vendeuse"
    },
    {
      id: "anaïs",
      name: "Anaïs", 
      volume: 35,
      status: "Majeur",
      contract: "CDI",
      skills: ["Fermeture"], // Supposé
      function: "Vendeuse"
    },
    {
      id: "camille",
      name: "Camille",
      volume: 35,
      status: "Majeur", 
      contract: "CDI",
      skills: [], // PAS de compétence ouverture (problème détecté)
      function: "Vendeuse"
    },
    {
      id: "laura_d",
      name: "Laura D",
      volume: 35,
      status: "Majeur",
      contract: "CDI", 
      skills: ["Ouverture"], // Supposé
      function: "Vendeuse"
    },
    {
      id: "laura_p",
      name: "Laura P",
      volume: 35,
      status: "Majeur",
      contract: "CDI",
      skills: ["Fermeture"], // Supposé
      function: "Vendeuse"
    },
    {
      id: "océane",
      name: "Océane",
      volume: 35, 
      status: "Majeur",
      contract: "CDI",
      skills: [], // Vente générale
      function: "Vendeuse"
    },
    {
      id: "severine",
      name: "Severine",
      volume: 39,
      status: "Majeur",
      contract: "CDI",
      skills: ["Ouverture", "Fermeture"], // Responsable
      function: "Responsable"
    },
    {
      id: "vanessa_f", 
      name: "Vanessa F",
      volume: 39,
      status: "Majeur",
      contract: "CDI",
      skills: ["Ouverture", "Fermeture"], // Manager
      function: "Manager"
    }
    // test2 exclu car maladie totale
  ],
  constraints: {
    "anaïs": {
      "2": "Formation"  // Mercredi formation
    },
    "camille": {
      "0": "Formation",  // Lundi formation
      "1": "Formation"   // Mardi formation
    },
    "severine": {
      "6": "CP"  // Dimanche congé payé
    }
    // Les maladies déclarées seront intégrées automatiquement par le backend
  },
  affluences: [2, 2, 2, 2, 2, 2, 2], // Même affluence lundi-vendredi comme observé
  week_number: 36,
  weekend_history: {
    // Simulation d'historique équitable
    "adelaïde_saturday": 1, "adelaïde_sunday": 1,
    "anaïs_saturday": 2, "anaïs_sunday": 1, 
    "camille_saturday": 1, "camille_sunday": 0,
    "laura_d_saturday": 2, "laura_d_sunday": 2,
    "laura_p_saturday": 1, "laura_p_sunday": 1,
    "océane_saturday": 0, "océane_sunday": 1,
    "severine_saturday": 3, "severine_sunday": 2, // Plus fatiguée
    "vanessa_f_saturday": 2, "vanessa_f_sunday": 2
  }
};

async function testDonneesReelles() {
  console.log('🧪 Test avec les données réelles de la boulangerie');
  console.log('=' .repeat(60));
  
  try {
    console.log('📡 Envoi des données réelles à l\'API OR-Tools...');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(realData),
      timeout: 120000
    });
    
    if (!response.ok) {
      console.log('❌ Erreur HTTP:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('📝 Détail erreur:', errorText);
      return;
    }
    
    const result = await response.json();
    
    console.log('\n✅ Résultat reçu !');
    console.log('Success:', result.success);
    
    if (result.success) {
      console.log('\n📊 ANALYSE DES CORRECTIONS');
      console.log('=' .repeat(40));
      
      // 1. Vérifier la répartition lundi-vendredi
      const weekdayStats = [];
      for (let day = 0; day < 5; day++) {
        let workingCount = 0;
        let totalHours = 0;
        
        for (const emp of realData.employees) {
          const slot = result.planning[emp.id]?.[day];
          if (slot && slot !== 'Repos' && slot !== 'MAL' && slot !== 'Formation' && slot !== 'CP') {
            workingCount++;
            totalHours += calculateSlotHours(slot);
          }
        }
        
        weekdayStats.push({ day, workingCount, totalHours });
        const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
        console.log(`📅 ${dayNames[day]}: ${workingCount} employés, ${totalHours}h total`);
      }
      
      // Vérifier l'équilibrage
      const workingCounts = weekdayStats.map(s => s.workingCount);
      const minWorking = Math.min(...workingCounts);
      const maxWorking = Math.max(...workingCounts);
      const ecart = maxWorking - minWorking;
      
      console.log(`\n⚖️ ÉQUILIBRAGE LUNDI-VENDREDI:`);
      console.log(`- Minimum: ${minWorking} employés`);
      console.log(`- Maximum: ${maxWorking} employés`);
      console.log(`- Écart: ${ecart} employés ${ecart <= 2 ? '✅' : '❌ (>2)'}`);
      
      // 2. Vérifier les compétences ouverture
      console.log(`\n🌅 VÉRIFICATION OUVERTURES:`);
      for (let day = 0; day < 7; day++) {
        const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
        let opener = null;
        
        for (const emp of realData.employees) {
          const slot = result.planning[emp.id]?.[day];
          if (slot && slot.startsWith('06h00')) {
            opener = emp;
            break;
          }
        }
        
        if (opener) {
          const hasSkill = opener.skills.includes('Ouverture');
          console.log(`- ${dayNames[day]}: ${opener.name} ${hasSkill ? '✅' : '❌ (pas de compétence)'}`);
        } else {
          console.log(`- ${dayNames[day]}: Pas d'ouverture`);
        }
      }
      
      // 3. Vérifier les contraintes
      console.log(`\n📋 VÉRIFICATION CONTRAINTES:`);
      
      // Camille formation lundi/mardi
      const camilleLundi = result.planning['camille']?.[0];
      const camilleMardi = result.planning['camille']?.[1];
      console.log(`- Camille Lundi: ${camilleLundi} ${camilleLundi === 'Formation' ? '✅' : '❌'}`);
      console.log(`- Camille Mardi: ${camilleMardi} ${camilleMardi === 'Formation' ? '✅' : '❌'}`);
      
      // Anaïs formation mercredi
      const anaisMercredi = result.planning['anaïs']?.[2];
      console.log(`- Anaïs Mercredi: ${anaisMercredi} ${anaisMercredi === 'Formation' ? '✅' : '❌'}`);
      
      // Severine CP dimanche
      const severineDimanche = result.planning['severine']?.[6];
      console.log(`- Severine Dimanche: ${severineDimanche} ${severineDimanche === 'CP' ? '✅' : '❌'}`);
      
      // 4. Vérifier les volumes horaires
      console.log(`\n⏱️ VOLUMES HORAIRES:`);
      for (const emp of realData.employees) {
        let totalHours = 0;
        for (let day = 0; day < 7; day++) {
          const slot = result.planning[emp.id]?.[day];
          if (slot === 'Formation') {
            totalHours += 8;
          } else if (slot === 'CP') {
            totalHours += emp.volume === 35 ? 5.5 : 6.5;
          } else if (slot && slot !== 'Repos' && slot !== 'MAL') {
            totalHours += calculateSlotHours(slot);
          }
        }
        
        const ecart = totalHours - emp.volume;
        const ecartStr = ecart > 0 ? `+${ecart.toFixed(1)}h` : `${ecart.toFixed(1)}h`;
        const status = Math.abs(ecart) <= 0.5 ? '✅' : '❌';
        console.log(`- ${emp.name}: ${totalHours}h/${emp.volume}h (${ecartStr}) ${status}`);
      }
      
      // Afficher les warnings
      if (result.validation && result.validation.warnings && result.validation.warnings.length > 0) {
        console.log('\n⚠️ Avertissements:');
        result.validation.warnings.forEach(warning => {
          console.log(`  - ${warning}`);
        });
      }
      
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
    '06h00-14h00': 8.0, '07h30-15h30': 8.0, '09h00-17h00': 8.0,
    '10h00-18h00': 8.0, '11h00-19h00': 8.0, '12h00-20h00': 8.0,
    '13h00-20h30': 7.5, '14h00-20h30': 6.5, '16h00-20h30': 4.5,
    '06h00-16h30': 10.5, '07h30-16h30': 9.0, '10h30-16h30': 6.0,
    '11h00-18h30': 7.5, '12h00-19h30': 7.5, '16h30-20h30': 4.0,
    '17h00-20h30': 3.5, '06h00-13h00': 7.0, '07h30-13h00': 5.5,
    '09h30-13h00': 3.5, '11h00-18h00': 7.0, '12h00-19h00': 7.0,
    '13h00-20h30': 7.5, '14h00-20h30': 6.5
  };
  return slotHours[slot] || 0;
}

if (require.main === module) {
  testDonneesReelles().then(() => {
    console.log('\n🏁 Test terminé');
  }).catch(error => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = { testDonneesReelles };

