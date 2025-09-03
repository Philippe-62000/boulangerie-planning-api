// Test de la logique d'ajustement des heures contractuelles
console.log('🧪 Test de la logique d\'ajustement des heures contractuelles\n');

// Simulation d'un planning avec trop d'heures
const planningExcess = {
  employeeName: 'Anaïs',
  totalWeeklyHours: 42.0, // 7h en trop (35h contractuelles)
  schedule: [
    {
      day: 'Lundi',
      shifts: [{ hoursWorked: 8.5 }],
      totalHours: 8.5,
      constraint: undefined
    },
    {
      day: 'Mardi',
      shifts: [{ hoursWorked: 8.5 }],
      totalHours: 8.5,
      constraint: undefined
    },
    {
      day: 'Mercredi',
      shifts: [{ hoursWorked: 8.5 }],
      totalHours: 8.5,
      constraint: undefined
    },
    {
      day: 'Jeudi',
      shifts: [{ hoursWorked: 8.5 }],
      totalHours: 8.5,
      constraint: undefined
    },
    {
      day: 'Vendredi',
      shifts: [{ hoursWorked: 8.5 }],
      totalHours: 8.5,
      constraint: undefined
    },
    {
      day: 'Samedi',
      constraint: 'Repos',
      totalHours: 0
    },
    {
      day: 'Dimanche',
      constraint: 'Repos',
      totalHours: 0
    }
  ]
};

// Simulation d'un planning avec pas assez d'heures
const planningDeficit = {
  employeeName: 'Camille',
  totalWeeklyHours: 28.0, // 7h en moins (35h contractuelles)
  schedule: [
    {
      day: 'Lundi',
      shifts: [{ hoursWorked: 8.0 }],
      totalHours: 8.0,
      constraint: undefined
    },
    {
      day: 'Mardi',
      shifts: [{ hoursWorked: 8.0 }],
      totalHours: 8.0,
      constraint: undefined
    },
    {
      day: 'Mercredi',
      shifts: [{ hoursWorked: 8.0 }],
      totalHours: 8.0,
      constraint: undefined
    },
    {
      day: 'Jeudi',
      constraint: 'Formation',
      totalHours: 8
    },
    {
      day: 'Vendredi',
      constraint: 'Repos',
      totalHours: 0
    },
    {
      day: 'Samedi',
      constraint: 'Repos',
      totalHours: 0
    },
    {
      day: 'Dimanche',
      constraint: 'Repos',
      totalHours: 0
    }
  ]
};

const employeeAnaïs = {
  name: 'Anaïs',
  weeklyHours: 35,
  skills: ['Ouverture', 'Fermeture'],
  role: 'vendeuse'
};

const employeeCamille = {
  name: 'Camille',
  weeklyHours: 35,
  skills: ['Vente'],
  role: 'vendeuse'
};

console.log('📊 Test 1: Planning avec trop d\'heures (Anaïs)');
console.log(`- Employé: ${planningExcess.employeeName}`);
console.log(`- Heures totales: ${planningExcess.totalWeeklyHours}h`);
console.log(`- Heures contractuelles: ${employeeAnaïs.weeklyHours}h`);
console.log(`- Excédent: ${planningExcess.totalWeeklyHours - employeeAnaïs.weeklyHours}h\n`);

// Simulation de l'ajustement
function adjustPlanningToContractHours(planning, employee) {
  const targetHours = employee.weeklyHours;
  const currentHours = planning.totalWeeklyHours;
  
  console.log(`🔧 Ajustement planning ${employee.name}: ${currentHours.toFixed(1)}h sur ${targetHours}h`);
  
  // Si l'employé a trop d'heures, réduire les shifts
  if (currentHours > targetHours + 1) { // Tolérance de 1h
    const excessHours = currentHours - targetHours;
    console.log(`📅 ${employee.name} a ${excessHours.toFixed(1)}h en trop, réduction des shifts`);
    
    // Réduire les shifts en commençant par les plus longs
    const allShifts = [];
    planning.schedule.forEach(day => {
      if (day.shifts && day.shifts.length > 0) {
        day.shifts.forEach(shift => {
          allShifts.push({ day, shift, hours: shift.hoursWorked || day.totalHours });
        });
      }
    });
    
    // Trier par heures décroissantes
    allShifts.sort((a, b) => (b.hours || 0) - (a.hours || 0));
    
    let remainingExcess = excessHours;
    for (const { day, shift } of allShifts) {
      if (remainingExcess <= 0) break;
      
      const shiftHours = shift.hoursWorked || day.totalHours;
      if (shiftHours <= remainingExcess) {
        // Supprimer complètement le shift
        day.shifts = [];
        day.totalHours = 0;
        remainingExcess -= shiftHours;
        planning.totalWeeklyHours -= shiftHours;
        console.log(`  ❌ Suppression du shift ${day.day}: -${shiftHours}h`);
      } else {
        // Réduire partiellement le shift
        const reduction = remainingExcess;
        if (shift.hoursWorked) {
          shift.hoursWorked -= reduction;
        }
        day.totalHours = Math.max(0, day.totalHours - reduction);
        remainingExcess = 0;
        planning.totalWeeklyHours -= reduction;
        console.log(`  ✂️ Réduction du shift ${day.day}: -${reduction}h`);
      }
    }
  }
  
  // Si l'employé n'a pas assez d'heures, essayer d'ajouter des shifts
  else if (currentHours < targetHours - 2) { // Tolérance de 2h
    const missingHours = targetHours - currentHours;
    console.log(`📅 ${employee.name} manque ${missingHours.toFixed(1)}h, ajout de shifts`);
    
    // Trouver les jours vides (sans contraintes et sans shifts)
    const emptyDays = planning.schedule.filter(day => 
      !day.constraint && (!day.shifts || day.shifts.length === 0)
    );
    
    if (emptyDays.length > 0) {
      // Calculer combien de jours il faut pour atteindre les heures contractuelles
      const daysToFill = Math.min(Math.ceil(missingHours / 8), emptyDays.length);
      
      console.log(`📅 ${employee.name}: Ajout de shifts sur ${daysToFill} jours vides`);
      
      // Ajouter des shifts sur les jours vides
      for (let i = 0; i < daysToFill && planning.totalWeeklyHours < targetHours; i++) {
        const day = emptyDays[i];
        
        // Générer un shift approprié selon les compétences
        if (employee.skills.includes('Ouverture')) {
          const shift = {
            startTime: '06:00',
            endTime: '14:30',
            breakMinutes: 30,
            hoursWorked: 8.0,
            role: employee.role || 'vendeuse'
          };
          day.shifts = [shift];
          day.totalHours = 8.0;
          planning.totalWeeklyHours += 8.0;
          console.log(`  ➕ Ajout shift ouverture ${day.day}: +8.0h`);
        } else if (employee.skills.includes('Fermeture')) {
          const shift = {
            startTime: '13:00',
            endTime: '20:30',
            breakMinutes: 30,
            hoursWorked: 7.5,
            role: employee.role || 'vendeuse'
          };
          day.shifts = [shift];
          day.totalHours = 7.5;
          planning.totalWeeklyHours += 7.5;
          console.log(`  ➕ Ajout shift fermeture ${day.day}: +7.5h`);
        } else {
          // Shift standard
          const shift = {
            startTime: '09:00',
            endTime: '17:00',
            breakMinutes: 30,
            hoursWorked: 8.0,
            role: employee.role || 'vendeuse'
          };
          day.shifts = [shift];
          day.totalHours = 8.0;
          planning.totalWeeklyHours += 8.0;
          console.log(`  ➕ Ajout shift standard ${day.day}: +8.0h`);
        }
      }
    }
  }
  
  console.log(`✅ ${employee.name}: Ajustement terminé, total: ${planning.totalWeeklyHours.toFixed(1)}h`);
}

// Test 1: Ajustement planning avec trop d'heures
console.log('🧪 Test 1: Ajustement planning avec trop d\'heures');
adjustPlanningToContractHours(planningExcess, employeeAnaïs);

console.log('\n📊 Planning Anaïs après ajustement:');
console.log(`- Heures totales: ${planningExcess.totalWeeklyHours.toFixed(1)}h`);
console.log(`- Heures contractuelles: ${employeeAnaïs.weeklyHours}h`);
console.log(`- Différence: ${(planningExcess.totalWeeklyHours - employeeAnaïs.weeklyHours).toFixed(1)}h`);

// Test 2: Ajustement planning avec pas assez d'heures
console.log('\n\n🧪 Test 2: Ajustement planning avec pas assez d\'heures');
adjustPlanningToContractHours(planningDeficit, employeeCamille);

console.log('\n📊 Planning Camille après ajustement:');
console.log(`- Heures totales: ${planningDeficit.totalWeeklyHours.toFixed(1)}h`);
console.log(`- Heures contractuelles: ${employeeCamille.weeklyHours}h`);
console.log(`- Différence: ${(planningDeficit.totalWeeklyHours - employeeCamille.weeklyHours).toFixed(1)}h`);

// Afficher les plannings finaux
console.log('\n\n📅 Planning final Anaïs:');
planningExcess.schedule.forEach(day => {
  if (day.constraint) {
    console.log(`  ${day.day}: ${day.constraint} (${day.totalHours}h)`);
  } else if (day.shifts && day.shifts.length > 0) {
    console.log(`  ${day.day}: ${day.shifts[0].hoursWorked}h (${day.totalHours}h)`);
  } else {
    console.log(`  ${day.day}: Repos (${day.totalHours}h)`);
  }
});

console.log('\n📅 Planning final Camille:');
planningDeficit.schedule.forEach(day => {
  if (day.constraint) {
    console.log(`  ${day.day}: ${day.constraint} (${day.totalHours}h)`);
  } else if (day.shifts && day.shifts.length > 0) {
    console.log(`  ${day.day}: ${day.shifts[0].hoursWorked}h (${day.totalHours}h)`);
  } else {
    console.log(`  ${day.day}: Repos (${day.totalHours}h)`);
  }
});

