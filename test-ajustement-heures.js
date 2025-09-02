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

const employee = {
  name: 'Anaïs',
  weeklyHours: 35,
  skills: ['Ouverture', 'Fermeture'],
  role: 'vendeuse'
};

console.log('📊 Planning initial:');
console.log(`- Employé: ${planningExcess.employeeName}`);
console.log(`- Heures totales: ${planningExcess.totalWeeklyHours}h`);
console.log(`- Heures contractuelles: ${employee.weeklyHours}h`);
console.log(`- Excédent: ${planningExcess.totalWeeklyHours - employee.weeklyHours}h\n`);

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
  
  console.log(`✅ ${employee.name}: Ajustement terminé, total: ${planning.totalWeeklyHours.toFixed(1)}h`);
}

// Appliquer l'ajustement
adjustPlanningToContractHours(planningExcess, employee);

console.log('\n📊 Planning après ajustement:');
console.log(`- Heures totales: ${planningExcess.totalWeeklyHours.toFixed(1)}h`);
console.log(`- Heures contractuelles: ${employee.weeklyHours}h`);
console.log(`- Différence: ${(planningExcess.totalWeeklyHours - employee.weeklyHours).toFixed(1)}h`);

// Afficher le planning final
console.log('\n📅 Planning final:');
planningExcess.schedule.forEach(day => {
  if (day.constraint) {
    console.log(`  ${day.day}: ${day.constraint} (${day.totalHours}h)`);
  } else if (day.shifts && day.shifts.length > 0) {
    console.log(`  ${day.day}: ${day.shifts[0].hoursWorked}h (${day.totalHours}h)`);
  } else {
    console.log(`  ${day.day}: Repos (${day.totalHours}h)`);
  }
});
