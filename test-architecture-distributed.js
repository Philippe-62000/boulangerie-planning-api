#!/usr/bin/env node
/**
 * Script de test pour l'architecture distribuée
 * Teste les 2 services Python déployés sur Render
 */

const fetch = require('node-fetch');

// Configuration des services
const SERVICES = {
  constraint_calculator: 'https://constraint-calculator.onrender.com',
  planning_generator: 'https://planning-generator.onrender.com'
};

// Données de test
const testData = {
  employees: [
    {
      _id: 'test_emp_1',
      name: 'Anaïs Test',
      age: 17,
      weeklyHours: 35,
      skills: ['vendeuse'],
      trainingDays: ['Mercredi'],
      sickLeave: { isOnSickLeave: false }
    },
    {
      _id: 'test_emp_2',
      name: 'Vanessa Test',
      age: 18,
      weeklyHours: 39,
      skills: ['manager', 'ouverture', 'fermeture'],
      trainingDays: [],
      sickLeave: { isOnSickLeave: false }
    }
  ],
  week_number: 36,
  year: 2025,
  affluences: [2, 2, 2, 2, 2, 2, 2]
};

async function testServiceHealth() {
  console.log('🏥 Test de santé des services...\n');
  
  for (const [name, url] of Object.entries(SERVICES)) {
    try {
      console.log(`🧪 Test ${name}...`);
      const response = await fetch(`${url}/health`);
      const health = await response.json();
      
      if (response.ok && health.status === 'healthy') {
        console.log(`✅ ${name}: ${health.status} - MongoDB: ${health.mongodb}`);
      } else {
        console.log(`❌ ${name}: Statut invalide`);
      }
    } catch (error) {
      console.log(`❌ ${name}: Erreur - ${error.message}`);
    }
    console.log('');
  }
}

async function testConstraintCalculator() {
  console.log('🧮 Test du service Constraint Calculator...\n');
  
  try {
    const response = await fetch(`${SERVICES.constraint_calculator}/calculate-constraints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employees: testData.employees,
        week_number: testData.week_number,
        year: testData.year
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Calcul des contraintes réussi !');
      console.log(`   - ${result.constraints.length} contraintes calculées`);
      console.log(`   - Semaine ${result.week_number}, année ${result.year}`);
      
      // Afficher les contraintes
      for (const constraint of result.constraints) {
        console.log(`   - ${constraint.name}: ${constraint.total_available_days} jours disponibles`);
        if (Object.keys(constraint.constraints).length > 0) {
          console.log(`     Contraintes: ${JSON.stringify(constraint.constraints)}`);
        }
      }
    } else {
      console.log(`❌ Erreur HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
  }
  console.log('');
}

async function testPlanningGenerator() {
  console.log('🚀 Test du service Planning Generator...\n');
  
  try {
    const response = await fetch(`${SERVICES.planning_generator}/generate-planning`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employees: testData.employees,
        week_number: testData.week_number,
        year: testData.year,
        affluences: testData.affluences
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Génération du planning réussie !');
      console.log(`   - Statut solveur: ${result.solver_status}`);
      console.log(`   - Temps de résolution: ${result.solve_time}s`);
      
      if (result.planning) {
        console.log('   - Planning généré:');
        for (const [empId, schedule] of Object.entries(result.planning)) {
          const empName = testData.employees.find(emp => emp._id === empId)?.name || empId;
          console.log(`     ${empName}: ${JSON.stringify(schedule)}`);
        }
      }
    } else {
      console.log(`❌ Erreur HTTP ${response.status}: ${response.statusText}`);
      const errorText = await response.text();
      console.log(`   Détails: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
  }
  console.log('');
}

async function main() {
  console.log('🧪 TEST DE L\'ARCHITECTURE DISTRIBUÉE');
  console.log('='.repeat(50));
  console.log('');
  
  // Test 1: Santé des services
  await testServiceHealth();
  
  // Test 2: Calcul des contraintes
  await testConstraintCalculator();
  
  // Test 3: Génération du planning
  await testPlanningGenerator();
  
  console.log('🎯 Tests terminés !');
  console.log('');
  console.log('📋 Prochaines étapes:');
  console.log('1. ✅ Services testés localement');
  console.log('2. 🔄 Déployer le backend modifié');
  console.log('3. 🧪 Tester l\'intégration complète');
  console.log('4. 🎉 Architecture distribuée opérationnelle !');
}

// Lancer les tests
main().catch(console.error);
