const axios = require('axios');

async function checkVanessaMaladie() {
  console.log('🔍 Vérification de Vanessa F...');
  
  try {
    // Récupérer les employés
    const employeesResponse = await axios.get('https://boulangerie-planning-api-3.onrender.com/api/employees', {
      timeout: 30000
    });
    
    // Trouver Vanessa F
    const vanessa = employeesResponse.data.find(emp => emp.name === 'Vanessa F');
    
    if (!vanessa) {
      console.log('❌ Vanessa F non trouvée');
      return;
    }
    
    console.log('✅ Vanessa F trouvée:', {
      id: vanessa._id,
      name: vanessa.name,
      role: vanessa.role,
      weeklyHours: vanessa.weeklyHours,
      sickLeave: vanessa.sickLeave
    });
    
    // Vérifier les contraintes de la semaine 36
    const constraintsResponse = await axios.get(`https://boulangerie-planning-api-3.onrender.com/api/constraints/36/2025`, {
      timeout: 30000
    });
    
    const vanessaConstraints = constraintsResponse.data.find(c => c.employeeId === vanessa._id);
    
    if (vanessaConstraints) {
      console.log('📋 Contraintes de Vanessa F (semaine 36):', vanessaConstraints.constraints);
    } else {
      console.log('❌ Aucune contrainte trouvée pour Vanessa F (semaine 36)');
    }
    
    // Vérifier le planning de la semaine 36
    const planningResponse = await axios.get(`https://boulangerie-planning-api-3.onrender.com/api/planning?weekNumber=36&year=2025`, {
      timeout: 30000
    });
    
    const vanessaPlanning = planningResponse.data.find(p => p.employeeId === vanessa._id);
    
    if (vanessaPlanning) {
      console.log('📅 Planning de Vanessa F (semaine 36):');
      vanessaPlanning.schedule.forEach(day => {
        if (day.constraint) {
          console.log(`  ${day.day}: ${day.constraint}`);
        } else if (day.shifts.length > 0) {
          console.log(`  ${day.day}: ${day.shifts[0].startTime}-${day.shifts[0].endTime} (${day.totalHours}h)`);
        }
      });
    } else {
      console.log('❌ Aucun planning trouvé pour Vanessa F (semaine 36)');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📄 Données:', error.response.data);
    }
  }
}

checkVanessaMaladie();
