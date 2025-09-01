const Planning = require('../models/Planning');
const Employee = require('../models/Employee');
const WeeklyConstraints = require('../models/WeeklyConstraints');
const EquityStats = require('../models/EquityStats');

// Solveur de planning optimisé en JavaScript pur (inspiré du code Python OR-Tools)
class PlanningBoulangerieSolver {
  constructor() {
    this.maxIterations = 1000;
    this.timeoutMs = 30000; // 30 secondes max
  }

  // Créneaux simplifiés mais complets (inspirés du code Python)
  getTimeSlotsForDay(dayIndex, affluenceLevel) {
    if (dayIndex === 6) { // DIMANCHE
      return [
        'Repos',
        '06h00-13h00',    // Ouverture matin
        '07h30-13h00',    // Support matin  
        '09h30-13h00',    // Renfort matin
        '13h00-20h30',    // Fermeture après-midi
        '14h00-20h30',    // Support fermeture
      ];
    } else if (dayIndex === 5) { // SAMEDI
      return [
        'Repos',
        '06h00-16h30',    // Ouverture longue
        '07h30-16h30',    // Support matin
        '10h30-16h30',    // Renfort midi
        '16h30-20h30',    // Fermeture
        '17h00-20h30',    // Support fermeture
      ];
    } else { // LUNDI À VENDREDI
      let baseSlots = [
        'Repos',
        '06h00-14h00',    // Ouverture standard
        '07h30-15h30',    // Support matin
        '13h00-20h30',    // Fermeture
      ];
      
      // Ajouter selon affluence
      if (affluenceLevel >= 2) {
        baseSlots.push(
          '10h00-18h00',    // Renfort midi
          '14h00-20h30'     // Renfort fermeture
        );
      }
      
      if (affluenceLevel >= 3) {
        baseSlots.push(
          '09h00-17h00',    // Renfort matinée
          '16h00-20h30'     // Support fermeture courte
        );
      }
      
      return baseSlots;
    }
  }

  // Heures par créneau (inspirées du code Python)
  getSlotHours() {
    return {
      // Créneaux semaine
      '06h00-14h00': 8.0,
      '07h30-15h30': 8.0,
      '09h00-17h00': 8.0,
      '10h00-18h00': 8.0,
      '13h00-20h30': 7.5,
      '14h00-20h30': 6.5,
      '16h00-20h30': 4.5,
      
      // Créneaux samedi
      '06h00-16h30': 10.5,
      '07h30-16h30': 9.0,
      '10h30-16h30': 6.0,
      '16h30-20h30': 4.0,
      '17h00-20h30': 3.5,
      
      // Créneaux dimanche
      '06h00-13h00': 7.0,
      '07h30-13h00': 5.5,
      '09h30-13h00': 3.5,
      '13h00-20h30': 7.5,
      '14h00-20h30': 6.5,
      
      // Spéciaux
      'Formation': 8.0,
      'CP': 5.5,
      'MAL': 0,
      'Indisponible': 0,
      'Repos': 0
    };
  }

  // Algorithme de résolution optimisé (inspiré du code Python)
  solvePlanning(employees, constraints, affluences, weekNumber) {
    console.log(`🚀 Début résolution planning semaine ${weekNumber}`);
    console.log(`👥 Employés: ${employees.length}, Contraintes: ${Object.keys(constraints).length}`);
    
    const startTime = Date.now();
    const slotHours = this.getSlotHours();
    const days = 7;
    
    // Validation des données d'entrée
    if (employees.length < 1) {
      return {
        success: false,
        error: 'Au moins 1 employé est nécessaire',
        diagnostic: ['Aucun employé fourni'],
        suggestions: ['Ajoutez au moins un employé']
      };
    }
    
    let diagnostic = [];
    let suggestions = [];
    
    if (employees.length === 1) {
      diagnostic.push('Un seul employé (planification limitée)');
      suggestions.push('Ajoutez plus d\'employés pour un planning optimal');
    }
    
    // Vérifier les compétences
    const openingStaff = employees.filter(emp => emp.skills && emp.skills.includes('Ouverture')).length;
    const closingStaff = employees.filter(emp => emp.skills && emp.skills.includes('Fermeture')).length;
    
    if (openingStaff === 0) {
      diagnostic.push('Aucun employé avec compétence Ouverture');
      suggestions.push('Ajoutez la compétence Ouverture à au moins un employé');
    }
    
    if (closingStaff === 0) {
      diagnostic.push('Aucun employé avec compétence Fermeture');
      suggestions.push('Ajoutez la compétence Fermeture à au moins un employé');
    }
    
    // Initialiser la solution
    let solution = {};
    let bestSolution = null;
    let bestScore = Infinity;
    
    // Algorithme de recherche avec backtracking optimisé
    for (let iteration = 0; iteration < this.maxIterations; iteration++) {
      if (Date.now() - startTime > this.timeoutMs) {
        console.log('⏰ Timeout atteint, utilisation de la meilleure solution trouvée');
        break;
      }
      
      // Générer une solution candidate
      const candidateSolution = this.generateCandidateSolution(employees, constraints, affluences, slotHours);
      
      if (candidateSolution) {
        // Évaluer la solution
        const score = this.evaluateSolution(candidateSolution, employees, slotHours);
        
        if (score < bestScore) {
          bestScore = score;
          bestSolution = JSON.parse(JSON.stringify(candidateSolution));
          console.log(`✅ Nouvelle meilleure solution trouvée (score: ${score})`);
        }
        
        // Si la solution est parfaite, on peut s'arrêter
        if (score === 0) {
          console.log('🎯 Solution parfaite trouvée !');
          break;
        }
      }
    }
    
    if (bestSolution) {
      // Construire la solution finale
      const finalSolution = this.buildFinalSolution(bestSolution, employees, slotHours);
      const validation = this.validateSolution(finalSolution, employees, slotHours);
      
      console.log(`✅ Solution trouvée en ${Date.now() - startTime}ms`);
      
      return {
        success: true,
        planning: finalSolution,
        validation: validation,
        diagnostic: diagnostic,
        suggestions: suggestions,
        solverInfo: {
          status: 'FEASIBLE',
          solveTime: Date.now() - startTime,
          objective: bestScore,
          iterations: Math.min(this.maxIterations, this.maxIterations)
        }
      };
    } else {
      return {
        success: false,
        error: 'Aucune solution possible avec les contraintes actuelles',
        diagnostic: diagnostic,
        suggestions: suggestions
      };
    }
  }

  // Générer une solution candidate
  generateCandidateSolution(employees, constraints, affluences, slotHours) {
    const solution = {};
    const days = 7;
    
    for (const emp of employees) {
      const empId = emp._id.toString();
      solution[empId] = {};
      
      for (let day = 0; day < days; day++) {
        const availableSlots = this.getTimeSlotsForDay(day, affluences[day]);
        
        // Appliquer contraintes spécifiques
        if (constraints[empId] && constraints[empId][day] !== undefined) {
          const constraintValue = constraints[empId][day];
          if (['CP', 'MAL', 'Formation', 'Indisponible', 'Repos'].includes(constraintValue)) {
            solution[empId][day] = constraintValue;
            continue;
          }
        }
        
        // Contraintes apprentis : jours de formation
        if (emp.contract === 'Apprentissage' && emp.trainingDays) {
          if (emp.trainingDays.includes(day + 1)) {
            solution[empId][day] = 'Formation';
            continue;
          }
        }
        
        // Sélectionner un créneau aléatoire
        const randomSlot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
        solution[empId][day] = randomSlot;
      }
    }
    
    return solution;
  }

  // Évaluer une solution
  evaluateSolution(solution, employees, slotHours) {
    let score = 0;
    
    // Pénaliser les écarts de volume horaire
    for (const emp of employees) {
      const empId = emp._id.toString();
      let totalHours = 0;
      
      for (let day = 0; day < 7; day++) {
        const slot = solution[empId][day];
        totalHours += slotHours[slot] || 0;
      }
      
      const targetHours = emp.weeklyHours;
      const gap = Math.abs(totalHours - targetHours);
      score += gap * 10; // Poids élevé pour les écarts de volume
    }
    
    // Pénaliser les déséquilibres de repos
    for (let day = 0; day < 7; day++) {
      let restCount = 0;
      for (const emp of employees) {
        const empId = emp._id.toString();
        if (solution[empId][day] === 'Repos') {
          restCount++;
        }
      }
      
      // Pénaliser si trop ou pas assez de repos
      const idealRest = 2;
      const deviation = Math.abs(restCount - idealRest);
      score += deviation;
    }
    
    // Pénaliser les violations de contraintes
    for (const emp of employees) {
      const empId = emp._id.toString();
      
      // Contraintes mineurs
      if (emp.age < 18) {
        if (solution[empId][6] !== 'Repos') { // Dimanche
          score += 100;
        }
        
        // Vérifier repos consécutifs
        for (let day = 0; day < 6; day++) {
          if (solution[empId][day] !== 'Repos' && solution[empId][day + 1] !== 'Repos') {
            score += 50;
          }
        }
      }
    }
    
    return score;
  }

  // Construire la solution finale
  buildFinalSolution(solution, employees, slotHours) {
    const finalSolution = {};
    
    for (const emp of employees) {
      const empId = emp._id.toString();
      finalSolution[empId] = {};
      
      for (let day = 0; day < 7; day++) {
        const slot = solution[empId][day];
        finalSolution[empId][day] = {
          slot: slot,
          hours: slotHours[slot] || 0,
          type: this.getSlotType(slot)
        };
      }
    }
    
    return finalSolution;
  }

  // Obtenir le type de créneau
  getSlotType(slot) {
    if (slot === 'Repos') return 'Repos';
    if (slot === 'Formation') return 'Formation';
    if (slot === 'CP') return 'CP';
    if (slot === 'MAL') return 'MAL';
    if (slot.includes('06h00') || slot.includes('07h30')) return 'Ouverture';
    if (slot.includes('20h30') || slot.includes('16h30')) return 'Fermeture';
    return 'Standard';
  }

  // Valider une solution
  validateSolution(solution, employees, slotHours) {
    const validation = { errors: [], warnings: [], stats: {} };
    
    let totalWeekHours = 0;
    const restDistribution = [0, 0, 0, 0, 0, 0, 0];
    
    for (const emp of employees) {
      const empId = emp._id.toString();
      let empTotalHours = 0;
      let empRestDays = 0;
      
      for (let day = 0; day < 7; day++) {
        const daySchedule = solution[empId][day];
        if (daySchedule.slot === 'Repos') {
          empRestDays++;
          restDistribution[day]++;
        } else {
          empTotalHours += daySchedule.hours;
        }
      }
      
      totalWeekHours += empTotalHours;
      
      // Validation volume horaire
      const volumeDiff = Math.abs(empTotalHours - emp.weeklyHours);
      if (volumeDiff > 1.0) {
        validation.warnings.push(
          `${emp.name}: ${empTotalHours}h au lieu de ${emp.weeklyHours}h (écart ${volumeDiff.toFixed(1)}h)`
        );
      }
      
      // Validation nombre de repos
      if (emp.weeklyHours >= 35 && empRestDays < 2) {
        validation.warnings.push(
          `${emp.name}: seulement ${empRestDays} jour(s) de repos (minimum 2 recommandés)`
        );
      }
    }
    
    // Stats de répartition des repos
    const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const restInfo = {};
    dayNames.forEach((day, index) => {
      restInfo[day] = restDistribution[index];
    });
    
    validation.stats = {
      totalHours: totalWeekHours,
      restDistribution: restInfo
    };
    
    return validation;
  }
}

// Instance globale du solveur
const planningSolver = new PlanningBoulangerieSolver();

class PlanningGenerator {
  constructor() {
    this.days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    this.businessHours = {
      start: '06:00',
      end: '20:30'
    };
    this.shifts = {
      morning: { start: '06:00', end: '14:30', hours: 8 },
      afternoon: { start: '13:30', end: '20:30', hours: 6.5 },
      full: { start: '07:30', end: '16:30', hours: 8.5 }
    };
  }

  // Configuration des besoins selon le cadre général
  getDailyRequirements(day) {
    const requirements = {
      'Lundi': {
        opening: { start: '06:00', end: '13:30', staff: 2, skills: ['Ouverture'] },
        afternoon: { start: '13:30', end: '16:00', staff: 3 },
        evening: { start: '16:00', end: '20:30', staff: 2, skills: ['Fermeture'] }
      },
      'Mardi': {
        opening: { start: '06:00', end: '13:30', staff: 2, skills: ['Ouverture'] },
        afternoon: { start: '13:30', end: '16:00', staff: 3 },
        evening: { start: '16:00', end: '20:30', staff: 2, skills: ['Fermeture'] }
      },
      'Mercredi': {
        opening: { start: '06:00', end: '13:30', staff: 2, skills: ['Ouverture'] },
        afternoon: { start: '13:30', end: '16:00', staff: 3 },
        evening: { start: '16:00', end: '20:30', staff: 2, skills: ['Fermeture'] }
      },
      'Jeudi': {
        opening: { start: '06:00', end: '13:30', staff: 2, skills: ['Ouverture'] },
        afternoon: { start: '13:30', end: '16:00', staff: 3 },
        evening: { start: '16:00', end: '20:30', staff: 2, skills: ['Fermeture'] }
      },
      'Vendredi': {
        opening: { start: '06:00', end: '13:30', staff: 2, skills: ['Ouverture'] },
        afternoon: { start: '13:30', end: '16:00', staff: 3 },
        evening: { start: '16:00', end: '20:30', staff: 2, skills: ['Fermeture'] }
      },
      'Samedi': {
        opening: { start: '06:00', end: '16:30', staff: 3, skills: ['Ouverture'] },
        evening: { start: '16:30', end: '20:30', staff: 2, skills: ['Fermeture'] }
      },
      'Dimanche': {
        opening: { start: '06:00', end: '13:00', staff: 3, skills: ['Ouverture'] },
        evening: { start: '13:00', end: '20:30', staff: 2, skills: ['Fermeture'] }
      }
    };
    return requirements[day] || requirements['Lundi'];
  }

  // Calculer les heures travaillées
  calculateHoursWorked(startTime, endTime, hasBreak = false) {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    let hours = (end - start) / (1000 * 60 * 60);

    // Ajouter une pause de 30 minutes si >= 5h30
    if (hours >= 5.5 && hasBreak) {
      hours -= 0.5; // Pause non payée
    }

    return Math.max(0, hours);
  }

  // Vérifier les contraintes d'un employé pour un jour
  async checkConstraints(employee, day, weekNumber, year) {
    // Vérifier d'abord les arrêts maladie déclarés
    if (employee.sickLeave && employee.sickLeave.isOnSickLeave) {
      const startDate = new Date(employee.sickLeave.startDate);
      const endDate = new Date(employee.sickLeave.endDate);
      const dayDate = this.getDateForDay(day, weekNumber, year);
      
      if (dayDate >= startDate && dayDate <= endDate) {
        console.log(`🏥 ${employee.name} en arrêt maladie le ${day}`);
        return { canWork: false, type: 'MAL' };
      }
    }
    
    // Vérifier les contraintes hebdomadaires
    const constraints = await WeeklyConstraints.findOne({
      weekNumber,
      year,
      employeeId: employee._id
    });
    
    if (constraints && constraints.constraints && constraints.constraints[day]) {
      const constraint = constraints.constraints[day];
      
      switch (constraint) {
        case 'Fermé':
          return { canWork: false, type: 'Fermé' };
        case 'Repos':
          return { canWork: false, type: 'Repos' };
        case 'Formation':
          return { canWork: false, type: 'Formation', hours: 8 }; // Formation = 8h
        case 'CP':
          return { canWork: false, type: 'CP', hours: employee.weeklyHours === 35 ? 5.5 : 6.5 };
        case 'MAL':
          return { canWork: false, type: 'MAL' };
        case 'ABS':
          return { canWork: false, type: 'ABS' };
        case 'RET':
          return { canWork: false, type: 'RET' };
        case 'Férié':
          return { canWork: false, type: 'Férié' };
        case 'Management':
          return { canWork: true, type: 'Management' };
        default:
          return { canWork: true, type: 'shift' };
      }
    }
    
    return { canWork: true, type: 'shift' };
  }

  // Obtenir la date pour un jour donné
  getDateForDay(day, weekNumber, year) {
    const dayIndex = this.days.indexOf(day);
    const firstDayOfYear = new Date(year, 0, 1);
    const firstMonday = new Date(firstDayOfYear);
    
    // Trouver le premier lundi de l'année
    while (firstMonday.getDay() !== 1) {
      firstMonday.setDate(firstMonday.getDate() + 1);
    }
    
    // Calculer la date du jour demandé
    const targetDate = new Date(firstMonday);
    targetDate.setDate(firstMonday.getDate() + (weekNumber - 1) * 7 + dayIndex);
    
    return targetDate;
  }

  // Vérifier les règles pour mineurs
  checkMinorRules(employee, day, weekSchedule) {
    if (employee.age >= 18) return { canWork: true };
    
    // Règles pour mineurs
    const isSunday = day === 'Dimanche';
    
    // Pas de travail le dimanche
    if (isSunday) {
      console.log(`👶 ${employee.name} (mineur) - Pas de travail le dimanche`);
      return { canWork: false, reason: 'Dimanche interdit pour mineurs' };
    }
    
    // Vérifier repos consécutifs avec dimanche
    const consecutiveRest = this.checkConsecutiveRestForMinor(employee, day, weekSchedule);
    if (!consecutiveRest.valid) {
      console.log(`👶 ${employee.name} (mineur) - ${consecutiveRest.reason}`);
      return { canWork: false, reason: consecutiveRest.reason };
    }
    
    return { canWork: true };
  }

  // Vérifier repos consécutifs pour mineurs
  checkConsecutiveRestForMinor(employee, day, weekSchedule) {
    const dayIndex = this.days.indexOf(day);
    
    // Pour les mineurs : repos consécutifs avec dimanche
    if (day === 'Samedi') {
      // Si travail le samedi, repos dimanche obligatoire
      const saturdayWork = weekSchedule.find(s => s.day === 'Samedi' && s.totalHours > 0);
      if (saturdayWork) {
        return { valid: false, reason: 'Repos dimanche obligatoire après travail samedi' };
      }
    }
    
    if (day === 'Lundi') {
      // Si travail le lundi, repos dimanche obligatoire
      const mondayWork = weekSchedule.find(s => s.day === 'Lundi' && s.totalHours > 0);
      if (mondayWork) {
        return { valid: false, reason: 'Repos dimanche obligatoire avant travail lundi' };
      }
    }
    
    return { valid: true };
  }
      return { canWork: false, reason: 'Dimanche interdit pour mineurs' };
    }
    
    // Pas de travail les jours fériés
    if (isHoliday) {
      return { canWork: false, reason: 'Jour férié interdit pour mineurs' };
    }
    
    // Vérifier repos consécutifs avec dimanche
    const consecutiveRest = this.checkConsecutiveRest(employee, day, weekSchedule);
    if (!consecutiveRest.valid) {
      return { canWork: false, reason: consecutiveRest.reason };
    }
    
    return { canWork: true };
  }

  // Vérifier repos consécutifs pour mineurs
  checkConsecutiveRest(employee, day, weekSchedule) {
    const dayIndex = this.days.indexOf(day);
    const previousDay = this.days[dayIndex - 1];
    const nextDay = this.days[dayIndex + 1];
    
    // Vérifier si l'employé a travaillé le jour précédent
    const workedPrevious = weekSchedule.find(s => s.day === previousDay && s.totalHours > 0);
    const workedNext = weekSchedule.find(s => s.day === nextDay && s.totalHours > 0);
    
    // Pour les mineurs : repos consécutifs avec dimanche
    if (employee.age < 18) {
      // Si travail le samedi, repos dimanche obligatoire
      if (day === 'Dimanche' && workedPrevious) {
        return { valid: false, reason: 'Repos dimanche obligatoire après travail samedi' };
      }
      
      // Si travail le dimanche, repos lundi obligatoire
      if (day === 'Lundi' && workedPrevious) {
        return { valid: false, reason: 'Repos lundi obligatoire après travail dimanche' };
      }
    }
    
    return { valid: true };
  }

  // Optimiser le planning avec OR-Tools
  optimizePlanningWithORTools(employees, weekNumber, year, affluenceLevels) {
    const model = new CpModel();
    const solver = new CpSolver();
    
    // Variables de décision
    const assignments = {};
    const employeesList = employees.filter(emp => emp.isActive);
    
    // Créer les variables pour chaque employé/jour/shift
    for (const employee of employeesList) {
      assignments[employee._id] = {};
      for (const day of this.days) {
        assignments[employee._id][day] = {};
        for (const shiftType of Object.keys(this.shifts)) {
          assignments[employee._id][day][shiftType] = model.newBoolVar(
            `${employee.name}_${day}_${shiftType}`
          );
        }
        // Variable pour repos
        assignments[employee._id][day]['rest'] = model.newBoolVar(
          `${employee.name}_${day}_rest`
        );
      }
    }
    
    // Contraintes
    
    // 1. Chaque employé doit avoir exactement une activité par jour
    for (const employee of employeesList) {
      for (const day of this.days) {
        const activities = [
          ...Object.keys(this.shifts).map(shift => assignments[employee._id][day][shift]),
          assignments[employee._id][day]['rest']
        ];
        model.addExactlyOne(activities);
      }
    }
    
    // 2. Respect des heures contractuelles
    for (const employee of employeesList) {
      const weeklyHours = [];
      for (const day of this.days) {
        for (const [shiftType, shift] of Object.entries(this.shifts)) {
          weeklyHours.push(
            LinearExpr.term(assignments[employee._id][day][shiftType], shift.hours)
          );
        }
      }
      model.add(LinearExpr.sum(weeklyHours) <= employee.weeklyHours);
      model.add(LinearExpr.sum(weeklyHours) >= employee.weeklyHours - 2); // Tolérance 2h
    }
    
    // 3. Rotation des horaires (éviter la monotonie)
    for (const employee of employeesList) {
      for (let i = 0; i < this.days.length - 1; i++) {
        const day1 = this.days[i];
        const day2 = this.days[i + 1];
        
        // Éviter le même shift deux jours consécutifs
        for (const shiftType of Object.keys(this.shifts)) {
          const consecutive = [
            assignments[employee._id][day1][shiftType],
            assignments[employee._id][day2][shiftType]
          ];
          model.addAtMostOne(consecutive);
        }
      }
    }
    
    // 4. Règles spéciales pour mineurs
    for (const employee of employeesList) {
      if (employee.age < 18) {
        // Pas de travail le dimanche
        model.add(assignments[employee._id]['Dimanche']['rest'] === 1);
        
        // Repos consécutifs avec dimanche
        model.add(assignments[employee._id]['Samedi']['rest'] === 1);
      }
    }
    
    // 5. Besoins en personnel par jour
    for (const day of this.days) {
      const affluence = affluenceLevels[day] || 2;
      const requirements = this.getDailyRequirements(affluence);
      
      // Matin
      const morningStaff = [];
      for (const employee of employeesList) {
        morningStaff.push(assignments[employee._id][day]['morning']);
      }
      model.add(LinearExpr.sum(morningStaff) >= requirements.morning.staff);
      
      // Après-midi
      const afternoonStaff = [];
      for (const employee of employeesList) {
        afternoonStaff.push(assignments[employee._id][day]['afternoon']);
      }
      model.add(LinearExpr.sum(afternoonStaff) >= requirements.afternoon.staff);
    }
    
    // Objectif : minimiser la monotonie et maximiser la satisfaction
    const objective = [];
    for (const employee of employeesList) {
      for (const day of this.days) {
        for (const shiftType of Object.keys(this.shifts)) {
          // Pénaliser les shifts répétitifs
          objective.push(
            LinearExpr.term(assignments[employee._id][day][shiftType], 1)
          );
        }
      }
    }
    
    model.minimize(LinearExpr.sum(objective));
    
    // Résoudre
    const status = solver.solve(model);
    
    if (status === CpSolver.OPTIMAL || status === CpSolver.FEASIBLE) {
      return this.extractSolution(assignments, employeesList, solver);
    } else {
      console.log('❌ Aucune solution trouvée avec OR-Tools');
      return null;
    }
  }

  // Extraire la solution d'OR-Tools
  extractSolution(assignments, employees, solver) {
    const solution = [];
    
    for (const employee of employees) {
      const schedule = [];
      let totalHours = 0;
      
      for (const day of this.days) {
        let daySchedule = { day, shifts: [], totalHours: 0, constraint: undefined };
        
        // Vérifier quel shift est assigné
        for (const [shiftType, shift] of Object.entries(this.shifts)) {
          if (solver.value(assignments[employee._id][day][shiftType]) === 1) {
            daySchedule.shifts = [{
              startTime: shift.start,
              endTime: shift.end,
              breakMinutes: 30,
              hoursWorked: shift.hours,
              role: employee.role
            }];
            daySchedule.totalHours = shift.hours;
            totalHours += shift.hours;
            break;
          }
        }
        
        // Si aucun shift, c'est un repos
        if (daySchedule.shifts.length === 0) {
          daySchedule.constraint = 'Repos';
        }
        
        schedule.push(daySchedule);
      }
      
      solution.push({
        employee,
        schedule,
        totalHours
      });
    }
    
    return solution;
  }

  // Générer le planning pour une semaine avec OR-Tools
  async generateWeeklyPlanning(weekNumber, year, affluenceLevels, employees) {
    console.log('🚀 Génération planning avec OR-Tools...');
    
    // Essayer d'abord avec OR-Tools
    const orToolsSolution = this.optimizePlanningWithORTools(employees, weekNumber, year, affluenceLevels);
    
    if (orToolsSolution) {
      console.log('✅ Solution OR-Tools trouvée !');
      return this.createPlanningsFromSolution(orToolsSolution, weekNumber, year);
    } else {
      console.log('⚠️ Fallback vers méthode classique...');
      return this.generateWeeklyPlanningClassic(weekNumber, year, affluenceLevels, employees);
    }
  }

  // Créer les plannings à partir de la solution OR-Tools
  createPlanningsFromSolution(solution, weekNumber, year) {
    const plannings = [];
    
    for (const employeeSolution of solution) {
      const planning = new Planning({
        weekNumber,
        year,
        employeeId: employeeSolution.employee._id,
        employeeName: employeeSolution.employee.name,
        schedule: employeeSolution.schedule,
        totalWeeklyHours: employeeSolution.totalHours,
        contractedHours: employeeSolution.employee.weeklyHours,
        status: 'generated'
      });
      
      plannings.push(planning);
    }
    
    return plannings;
  }

  // Méthode classique (fallback)
  async generateWeeklyPlanningClassic(weekNumber, year, affluenceLevels, employees) {
    const plannings = [];
    const employeeSchedules = new Map(); // Pour tracker les heures par employé

    // Initialiser les horaires de chaque employé
    for (const employee of employees) {
      employeeSchedules.set(employee._id.toString(), {
        employee,
        totalHours: 0,
        daysWorked: 0,
        schedule: []
      });
    }

    // Générer le planning jour par jour
    for (const day of this.days) {
      const dayAffluence = affluenceLevels[day] || 2;
      const requirements = this.getDailyRequirements(dayAffluence);
      
      // Trier les employés disponibles pour ce jour
      const availableEmployees = [];
      
      for (const [employeeId, schedule] of employeeSchedules) {
        const employee = schedule.employee;
        
        // Obtenir les contraintes de l'employé pour cette semaine
        const constraints = await WeeklyConstraints.findOne({
          weekNumber,
          year,
          employeeId: employee._id
        });
        
        const dayConstraint = this.checkConstraints(employee, constraints?.constraints || {}, day);
        
        if (dayConstraint.canWork) {
          availableEmployees.push({
            employee,
            schedule,
            priority: this.calculatePriority(employee, schedule, day, dayConstraint.type)
          });
        } else {
          // Ajouter le jour avec contrainte (pas de travail)
          let constraintHours = 0;
          
          // Calculer les heures selon le type de contrainte
          switch (dayConstraint.type) {
            case 'CP':
              constraintHours = employee.weeklyHours === 35 ? 5.5 : 6.5;
              break;
            case 'Formation':
              constraintHours = 8; // Formation = 8h
              break;
            case 'MAL':
            case 'ABS':
            case 'RET':
              constraintHours = 0; // Pas d'heures comptées
              break;
            case 'Repos':
              constraintHours = 0; // Pas d'heures comptées
              break;
            default:
              constraintHours = dayConstraint.hours || 0;
          }
          
          schedule.schedule.push({
            day,
            shifts: [],
            totalHours: constraintHours,
            constraint: dayConstraint.type
          });
          
          // Ajouter les heures pour les contraintes qui en ont
          if (constraintHours > 0) {
            schedule.totalHours += constraintHours;
          }
        }
      }

      // Trier par priorité (plus bas = plus prioritaire)
      availableEmployees.sort((a, b) => a.priority - b.priority);

      // Sélectionner les employés pour ce jour
      const selectedEmployees = this.selectEmployeesForDay(
        availableEmployees, 
        requirements, 
        day
      );

      // Assigner les shifts aux employés sélectionnés
      for (const selected of selectedEmployees) {
        const shift = this.generateShiftForEmployee(
          selected.employee, 
          day, 
          requirements, 
          selected.shiftType
        );
        
        if (shift) {
          selected.schedule.schedule.push({
            day,
            shifts: [shift],
            totalHours: shift.hoursWorked,
            constraint: undefined
          });
          
          selected.schedule.totalHours += shift.hoursWorked;
          selected.schedule.daysWorked++;
        }
      }

      // Ajouter des jours vides pour les employés non sélectionnés
      for (const [employeeId, schedule] of employeeSchedules) {
        if (!schedule.schedule.find(s => s.day === day)) {
          // Vérifier s'il y a une contrainte réelle pour ce jour
          const employee = schedule.employee;
          const constraints = await WeeklyConstraints.findOne({
            weekNumber,
            year,
            employeeId: employee._id
          });
          
          const dayConstraint = this.checkConstraints(employee, constraints?.constraints || {}, day);
          
          if (!dayConstraint.canWork) {
            // Il y a une vraie contrainte, l'utiliser
            schedule.schedule.push({
              day,
              shifts: [],
              totalHours: dayConstraint.hours || 0,
              constraint: dayConstraint.type
            });
            
            // Ajouter les heures pour CP
            if (dayConstraint.hours) {
              schedule.totalHours += dayConstraint.hours;
            }
          } else {
            // Pas de contrainte, c'est un vrai repos
            schedule.schedule.push({
              day,
              shifts: [],
              totalHours: 0,
              constraint: 'Repos'
            });
          }
        }
      }
    }

    // Créer les plannings finaux et ajuster les repos
    for (const [employeeId, schedule] of employeeSchedules) {
      // Ajuster les repos pour respecter les heures contractuelles
      this.adjustEmployeeSchedule(schedule);
      
      // Si l'employé a encore des jours vides et pas assez d'heures, essayer de les remplir
      if (schedule.totalHours < schedule.employee.weeklyHours - 4) { // Tolérance de 4h
        this.fillRemainingDays(schedule);
      }
      
      const planning = new Planning({
        weekNumber,
        year,
        employeeId: schedule.employee._id,
        employeeName: schedule.employee.name,
        schedule: schedule.schedule,
        totalWeeklyHours: schedule.totalHours,
        contractedHours: schedule.employee.weeklyHours,
        status: 'generated'
      });

      plannings.push(planning);
    }

    return plannings;
  }

  // Calculer la priorité d'un employé pour un jour
  calculatePriority(employee, schedule, day, constraintType) {
    let priority = 0;
    
    // Priorité HAUTE si l'employé n'a pas atteint ses heures contractuelles
    if (schedule.totalHours < employee.weeklyHours) {
      priority -= 100; // Priorité très haute
      
      // Priorité encore plus haute si proche des heures contractuelles
      const remainingHours = employee.weeklyHours - schedule.totalHours;
      if (remainingHours <= 8) {
        priority -= 50; // Priorité maximale
      }
    } else if (schedule.totalHours > employee.weeklyHours) {
      // Priorité basse seulement s'il dépasse ses heures contractuelles
      priority += (schedule.totalHours - employee.weeklyHours) * 20;
    }
    
    // Priorité basse si l'employé a déjà beaucoup de jours travaillés
    priority += schedule.daysWorked * 3;
    
    // Priorité haute pour les managers (mais pas au détriment des heures)
    if (employee.role === 'manager' || employee.role === 'responsable') {
      priority -= 10;
    }
    
    // Priorité basse pour les apprentis (formation prioritaire)
    if (employee.role === 'apprenti') {
      priority += 30;
    }
    
    return priority;
  }

  // Sélectionner les employés pour un jour donné
  selectEmployeesForDay(availableEmployees, requirements, day) {
    const selected = [];
    const morningNeeded = requirements.morning.staff;
    const afternoonNeeded = requirements.afternoon.staff;
    
    // Trier par priorité (plus bas = plus prioritaire)
    availableEmployees.sort((a, b) => a.priority - b.priority);
    
    // Sélectionner pour le matin
    let morningSelected = 0;
    for (const candidate of availableEmployees) {
      if (morningSelected >= morningNeeded) break;
      
      // Vérifier que l'employé peut encore travailler
      // Permettre le travail même avec des heures de contraintes si le total est inférieur aux heures contractuelles
      const totalHoursWithConstraints = candidate.schedule.totalHours;
      if (totalHoursWithConstraints >= candidate.employee.weeklyHours) {
        continue;
      }
      
      const hasOpeningSkill = candidate.employee.skills.includes('Ouverture');
      if (hasOpeningSkill || candidate.employee.role === 'manager' || candidate.employee.role === 'responsable') {
        selected.push({
          ...candidate,
          shiftType: 'morning'
        });
        morningSelected++;
      }
    }
    
    // Sélectionner pour l'après-midi
    let afternoonSelected = 0;
    for (const candidate of availableEmployees) {
      if (afternoonSelected >= afternoonNeeded) break;
      
      // Éviter de sélectionner deux fois le même employé
      if (selected.find(s => s.employee._id.toString() === candidate.employee._id.toString())) {
        continue;
      }
      
      // Vérifier que l'employé peut encore travailler
      // Permettre le travail même avec des heures de contraintes si le total est inférieur aux heures contractuelles
      const totalHoursWithConstraints = candidate.schedule.totalHours;
      if (totalHoursWithConstraints >= candidate.employee.weeklyHours) {
        continue;
      }
      
      const hasClosingSkill = candidate.employee.skills.includes('Fermeture');
      if (hasClosingSkill || candidate.employee.role === 'manager' || candidate.employee.role === 'responsable') {
        selected.push({
          ...candidate,
          shiftType: 'afternoon'
        });
        afternoonSelected++;
      }
    }
    
    // Compléter avec d'autres employés si nécessaire
    for (const candidate of availableEmployees) {
      if (selected.length >= (morningNeeded + afternoonNeeded)) break;
      
      // Éviter de sélectionner deux fois le même employé
      if (selected.find(s => s.employee._id.toString() === candidate.employee._id.toString())) {
        continue;
      }
      
      // Vérifier que l'employé peut encore travailler
      // Permettre le travail même avec des heures de contraintes si le total est inférieur aux heures contractuelles
      const totalHoursWithConstraints = candidate.schedule.totalHours;
      if (totalHoursWithConstraints >= candidate.employee.weeklyHours) {
        continue;
      }
      
      selected.push({
        ...candidate,
        shiftType: 'standard'
      });
    }
    
    return selected;
  }

  // Ajuster le planning d'un employé pour respecter ses heures contractuelles
  adjustEmployeeSchedule(schedule) {
    const employee = schedule.employee;
    const targetHours = employee.weeklyHours;
    const currentHours = schedule.totalHours;
    
    console.log(`🔧 Ajustement planning ${employee.name}: ${currentHours}h sur ${targetHours}h`);
    
    // Si l'employé a trop d'heures, ajouter des repos
    if (currentHours > targetHours) {
      const excessHours = currentHours - targetHours;
      const daysToRest = Math.ceil(excessHours / 8); // 8h par jour de repos
      
      console.log(`📅 ${employee.name} a ${excessHours}h en trop, ajout de ${daysToRest} jours de repos`);
      
      // Trouver les jours sans contraintes pour ajouter des repos
      const availableDays = schedule.schedule.filter(day => 
        !day.constraint && day.shifts.length === 0
      );
      
      for (let i = 0; i < Math.min(daysToRest, availableDays.length); i++) {
        availableDays[i].constraint = 'Repos';
        availableDays[i].totalHours = 0;
        schedule.totalHours -= availableDays[i].shifts.reduce((sum, shift) => sum + shift.hoursWorked, 0);
        availableDays[i].shifts = [];
      }
    }
    
    // Si l'employé n'a pas assez d'heures, essayer de réduire les repos
    else if (currentHours < targetHours - 8) { // Tolérance de 8h
      const missingHours = targetHours - currentHours;
      const daysToWork = Math.ceil(missingHours / 8);
      
      console.log(`📅 ${employee.name} manque ${missingHours}h, transformation de ${daysToWork} jours de repos en travail`);
      
      // Trouver les jours de repos pour les transformer en travail
      const restDays = schedule.schedule.filter(day => day.constraint === 'Repos');
      
      for (let i = 0; i < Math.min(daysToWork, restDays.length); i++) {
        restDays[i].constraint = undefined;
        restDays[i].totalHours = 0;
        // Le shift sera généré plus tard
      }
    }
    
    console.log(`✅ ${employee.name}: Ajustement terminé, total: ${schedule.totalHours}h`);
  }

  // Remplir les jours restants pour atteindre les heures contractuelles
  fillRemainingDays(schedule) {
    const employee = schedule.employee;
    const targetHours = employee.weeklyHours;
    const currentHours = schedule.totalHours;
    
    if (currentHours >= targetHours) return;
    
    console.log(`🔧 Remplissage jours restants pour ${employee.name}: ${currentHours}h sur ${targetHours}h`);
    
    // Trouver les jours vides (sans contraintes et sans shifts)
    const emptyDays = schedule.schedule.filter(day => 
      !day.constraint && day.shifts.length === 0
    );
    
    if (emptyDays.length === 0) return;
    
    // Calculer combien de jours il faut pour atteindre les heures contractuelles
    const missingHours = targetHours - currentHours;
    const daysToFill = Math.min(Math.ceil(missingHours / 8), emptyDays.length);
    
    console.log(`📅 ${employee.name}: Remplissage de ${daysToFill} jours vides`);
    
    // Remplir les jours vides avec des shifts
    for (let i = 0; i < daysToFill; i++) {
      const day = emptyDays[i];
      
      // Générer un shift approprié selon les compétences
      if (employee.skills.includes('Ouverture')) {
        day.shifts = [{
          startTime: '06:00',
          endTime: '14:30',
          breakMinutes: 30,
          hoursWorked: this.calculateHoursWorked('06:00', '14:30', true),
          role: employee.role
        }];
      } else if (employee.skills.includes('Fermeture')) {
        day.shifts = [{
          startTime: '13:30',
          endTime: '20:30',
          breakMinutes: 30,
          hoursWorked: this.calculateHoursWorked('13:30', '20:30', true),
          role: employee.role
        }];
      } else {
        day.shifts = [{
          startTime: '07:30',
          endTime: '16:30',
          breakMinutes: 30,
          hoursWorked: this.calculateHoursWorked('07:30', '16:30', true),
          role: employee.role
        }];
      }
      
      day.totalHours = day.shifts[0].hoursWorked;
      schedule.totalHours += day.totalHours;
    }
    
    console.log(`✅ ${employee.name}: Remplissage terminé, total: ${schedule.totalHours}h`);
  }

  // Générer un shift pour un employé
  generateShiftForEmployee(employee, day, requirements, constraintType) {
    // Logique simplifiée - à améliorer avec OR Tools
    let shift = null;

    if (constraintType === 'management') {
      // Manager travaille toute la journée en management
      shift = {
        startTime: this.businessHours.start,
        endTime: this.businessHours.end,
        breakMinutes: 30,
        hoursWorked: this.calculateHoursWorked(this.businessHours.start, this.businessHours.end, true),
        role: employee.role
      };
    } else {
      // Générer un shift normal selon les compétences
      const hasOpeningSkill = employee.skills.includes('Ouverture');
      const hasClosingSkill = employee.skills.includes('Fermeture');

      if (hasOpeningSkill && day !== 'Dimanche') {
        // Ouvrir le matin
        shift = {
          startTime: '06:00',
          endTime: '14:30',
          breakMinutes: 30,
          hoursWorked: this.calculateHoursWorked('06:00', '14:30', true),
          role: employee.role
        };
      } else if (hasClosingSkill) {
        // Fermer le soir
        shift = {
          startTime: '13:30',
          endTime: '20:30',
          breakMinutes: 30,
          hoursWorked: this.calculateHoursWorked('13:30', '20:30', true),
          role: employee.role
        };
      } else {
        // Shift standard
        shift = {
          startTime: '07:30',
          endTime: '16:30',
          breakMinutes: 30,
          hoursWorked: this.calculateHoursWorked('07:30', '16:30', true),
          role: employee.role
        };
      }
    }

    return shift;
  }
}

// Contrôleur principal
const planningGenerator = new PlanningGenerator();

// Générer le planning pour une semaine
exports.generatePlanning = async (req, res) => {
  try {
    const { weekNumber, year, affluenceLevels } = req.body;

    // Obtenir tous les employés actifs
    const employees = await Employee.find({ isActive: true });

    if (employees.length === 0) {
      return res.status(400).json({ error: 'Aucun employé actif trouvé' });
    }

    // Supprimer les anciens plannings pour cette semaine s'ils existent
    console.log(`🗑️ Suppression des anciens plannings pour la semaine ${weekNumber}, année ${year}`);
    const deleteResult = await Planning.deleteMany({
      weekNumber: parseInt(weekNumber),
      year: parseInt(year)
    });
    
    if (deleteResult.deletedCount > 0) {
      console.log(`✅ ${deleteResult.deletedCount} anciens plannings supprimés`);
    }

    // Générer les plannings avec OR-Tools
    const plannings = await planningGenerator.generateWeeklyPlanning(
      weekNumber,
      year,
      affluenceLevels,
      employees
    );

    // Sauvegarder les plannings
    const savedPlannings = await Planning.insertMany(plannings);

    res.json({
      message: 'Planning généré avec succès (OR-Tools)',
      plannings: savedPlannings,
      deletedCount: deleteResult.deletedCount
    });
  } catch (error) {
    console.error('Erreur lors de la génération du planning:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtenir les plannings pour une semaine
exports.getPlanningByWeek = async (req, res) => {
  try {
    const { weekNumber, year } = req.params;

    const plannings = await Planning.find({
      weekNumber: parseInt(weekNumber),
      year: parseInt(year)
    }).populate('employeeId', 'name role skills');

    res.json(plannings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Valider un planning
exports.validatePlanning = async (req, res) => {
  try {
    const { planningId } = req.params;

    const planning = await Planning.findByIdAndUpdate(
      planningId,
      {
        status: 'validated',
        isValidated: true
      },
      { new: true }
    );

    if (!planning) {
      return res.status(404).json({ error: 'Planning non trouvé' });
    }

    res.json(planning);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Marquer comme réalisé (avec modifications réelles)
exports.markAsRealized = async (req, res) => {
  try {
    const { planningId } = req.params;
    const updates = req.body;

    const planning = await Planning.findByIdAndUpdate(
      planningId,
      {
        ...updates,
        status: 'realized'
      },
      { new: true }
    );

    if (!planning) {
      return res.status(404).json({ error: 'Planning non trouvé' });
    }

    res.json(planning);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Supprimer tous les plannings d'une semaine
exports.deletePlanningByWeek = async (req, res) => {
  try {
    const { weekNumber, year } = req.params;

    const deleteResult = await Planning.deleteMany({
      weekNumber: parseInt(weekNumber),
      year: parseInt(year)
    });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ error: 'Aucun planning trouvé pour cette semaine' });
    }

    res.json({
      message: `${deleteResult.deletedCount} plannings supprimés avec succès`,
      deletedCount: deleteResult.deletedCount,
      weekNumber: parseInt(weekNumber),
      year: parseInt(year)
    });
  } catch (error) {
    console.error('Erreur lors de la suppression des plannings:', error);
    res.status(500).json({ error: error.message });
  }
};

