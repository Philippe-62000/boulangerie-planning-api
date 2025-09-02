const Planning = require('../models/Planning');
const Employee = require('../models/Employee');
const WeeklyConstraints = require('../models/WeeklyConstraints');
const EquityStats = require('../models/EquityStats');
const fetch = require('node-fetch');

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

  // Ajuster l'heure de fin d'un shift selon les heures travaillées
  adjustEndTime(startTime, hoursWorked) {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = startMinutes + (hoursWorked * 60);
    
    const endHour = Math.floor(endMinutes / 60);
    const endMinute = endMinutes % 60;
    
    return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
  }

  // Configuration des besoins selon le cadre général - ÉQUILIBRÉE
  getDailyRequirements(day) {
    const requirements = {
      'Lundi': {
        opening: { start: '06:00', end: '13:30', staff: 1, skills: ['Ouverture'] }, // Réduit de 2 à 1
        afternoon: { start: '13:30', end: '16:00', staff: 2 }, // Réduit de 3 à 2
        evening: { start: '16:00', end: '20:30', staff: 1, skills: ['Fermeture'] } // Réduit de 2 à 1
      },
      'Mardi': {
        opening: { start: '06:00', end: '13:30', staff: 1, skills: ['Ouverture'] }, // Réduit de 2 à 1
        afternoon: { start: '13:30', end: '16:00', staff: 2 }, // Réduit de 3 à 2
        evening: { start: '16:00', end: '20:30', staff: 1, skills: ['Fermeture'] } // Réduit de 2 à 1
      },
      'Mercredi': {
        opening: { start: '06:00', end: '13:30', staff: 1, skills: ['Ouverture'] }, // Réduit de 2 à 1
        afternoon: { start: '13:30', end: '16:00', staff: 2 }, // Réduit de 3 à 2
        evening: { start: '16:00', end: '20:30', staff: 1, skills: ['Fermeture'] } // Réduit de 2 à 1
      },
      'Jeudi': {
        opening: { start: '06:00', end: '13:30', staff: 1, skills: ['Ouverture'] }, // Réduit de 2 à 1
        afternoon: { start: '13:30', end: '16:00', staff: 2 }, // Réduit de 3 à 2
        evening: { start: '16:00', end: '20:30', staff: 1, skills: ['Fermeture'] } // Réduit de 2 à 1
      },
      'Vendredi': {
        opening: { start: '06:00', end: '13:30', staff: 1, skills: ['Ouverture'] }, // Réduit de 2 à 1
        afternoon: { start: '13:30', end: '16:00', staff: 2 }, // Réduit de 3 à 2
        evening: { start: '16:00', end: '20:30', staff: 1, skills: ['Fermeture'] } // Réduit de 2 à 1
      },
      'Samedi': {
        opening: { start: '06:00', end: '16:30', staff: 3, skills: ['Ouverture'] }, // Maintenu à 3
        evening: { start: '16:30', end: '20:30', staff: 2, skills: ['Fermeture'] } // Maintenu à 2
      },
      'Dimanche': {
        opening: { start: '06:00', end: '13:00', staff: 3, skills: ['Ouverture'] }, // Maintenu à 3
        evening: { start: '13:00', end: '20:30', staff: 2, skills: ['Fermeture'] } // Maintenu à 2
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
    try {
      const constraints = await WeeklyConstraints.findOne({
        weekNumber: weekNumber,
        year: year,
        employeeId: employee._id
      });
      
      if (constraints && constraints.constraints && constraints.constraints[day]) {
        const constraint = constraints.constraints[day];
        
        switch (constraint) {
          case 'Repos':
            return { canWork: false, type: 'Repos' };
          case 'Formation':
            return { canWork: false, type: 'Formation', hours: 8 }; // Formation = 8h
          case 'CP':
            return { canWork: false, type: 'CP', hours: employee.weeklyHours === 35 ? 5.5 : 6.5 };
          case 'MAL':
            return { canWork: false, type: 'MAL' };
          case 'Indisponible':
            return { canWork: false, type: 'Indisponible' };
          default:
            return { canWork: true, type: 'shift' };
        }
      }
    } catch (error) {
      console.log(`⚠️ Erreur lors de la vérification des contraintes pour ${employee.name}:`, error.message);
      // En cas d'erreur, on considère que l'employé peut travailler
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

  // Calculer l'historique des weekends pour équilibrer les futures affectations
  async calculateWeekendHistory(employees, currentWeekNumber, year) {
    console.log('📊 Calcul de l\'historique des weekends pour équilibrage');
    
    const weekendHistory = {};
    
    try {
      // Calculer les 4 dernières semaines pour l'historique
      const weeksToAnalyze = [];
      for (let i = 1; i <= 4; i++) {
        let analyzeWeek = currentWeekNumber - i;
        let analyzeYear = year;
        
        if (analyzeWeek <= 0) {
          analyzeWeek += 52; // Approximation, semaines de l'année précédente
          analyzeYear -= 1;
        }
        
        weeksToAnalyze.push({ week: analyzeWeek, year: analyzeYear });
      }
      
      console.log('🔍 Analyse des semaines:', weeksToAnalyze);
      
      for (const emp of employees) {
        const empId = emp._id.toString();
        let saturdayCount = 0;
        let sundayCount = 0;
        
        // Analyser les plannings des semaines précédentes
        for (const { week, year: analyzeYear } of weeksToAnalyze) {
          const planning = await Planning.findOne({
            weekNumber: week,
            year: analyzeYear,
            employeeId: emp._id
          });
          
          if (planning && planning.schedule) {
            // Compter les samedis et dimanches travaillés
            const saturdaySchedule = planning.schedule.find(day => day.day === 'Samedi');
            const sundaySchedule = planning.schedule.find(day => day.day === 'Dimanche');
            
            if (saturdaySchedule && saturdaySchedule.totalHours > 0 && saturdaySchedule.constraint !== 'Repos') {
              saturdayCount++;
            }
            
            if (sundaySchedule && sundaySchedule.totalHours > 0 && sundaySchedule.constraint !== 'Repos') {
              sundayCount++;
            }
          }
        }
        
        weekendHistory[`${empId}_saturday`] = saturdayCount;
        weekendHistory[`${empId}_sunday`] = sundayCount;
        
        console.log(`👤 ${emp.name}: ${saturdayCount} samedis, ${sundayCount} dimanches sur 4 semaines`);
      }
      
      return weekendHistory;
    } catch (error) {
      console.error('❌ Erreur calcul historique weekends:', error);
      // Retourner un historique vide en cas d'erreur
      return {};
    }
  }

  // Intégrer les maladies déclarées dans les contraintes automatiquement
  async integrateDeclaredSickLeaves(employees, constraints, weekNumber, year) {
    console.log('🏥 Intégration des maladies déclarées dans les contraintes');
    
    for (const employee of employees) {
      const empId = employee._id.toString();
      
      // Vérifier si l'employé a un arrêt maladie déclaré
      if (employee.sickLeave && employee.sickLeave.isOnSickLeave) {
        const startDate = new Date(employee.sickLeave.startDate);
        const endDate = new Date(employee.sickLeave.endDate);
        
        console.log(`🏥 ${employee.name} en arrêt maladie du ${startDate.toLocaleDateString()} au ${endDate.toLocaleDateString()}`);
        
        // Vérifier chaque jour de la semaine
        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
          const dayDate = this.getDateForDay(this.days[dayIndex], weekNumber, year);
          
          if (dayDate >= startDate && dayDate <= endDate) {
            // Initialiser les contraintes pour cet employé si nécessaire
            if (!constraints[empId]) {
              constraints[empId] = {};
            }
            
            // Forcer la contrainte maladie pour ce jour
            constraints[empId][dayIndex] = 'MAL';
            console.log(`🏥 ${employee.name}: ${this.days[dayIndex]} → MAL (arrêt maladie déclaré)`);
          }
        }
      }
    }
    
    console.log('✅ Maladies déclarées intégrées dans les contraintes');
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

  // Utiliser Google OR-Tools via API externe
  async generateWeeklyPlanning(weekNumber, year, affluenceLevels, employees) {
    console.log('🚀 Génération planning avec Google OR-Tools...');
    console.log('📊 Données reçues:', {
      weekNumber,
      year,
      employeesCount: employees.length,
      affluenceLevels,
      ortoolsUrl: process.env.ORTOOLS_API_URL
    });
    
    try {
      // Préparer les données pour OR-Tools
      const constraints = {};
      for (const emp of employees) {
        const empId = emp._id.toString();
        constraints[empId] = {};
        
        // Récupérer les contraintes de la base de données
        const weeklyConstraints = await WeeklyConstraints.findOne({
          weekNumber,
          year,
          employeeId: emp._id
        });
        
        if (weeklyConstraints && weeklyConstraints.constraints) {
          for (let day = 0; day < 7; day++) {
            const dayName = this.days[day];
            if (weeklyConstraints.constraints[dayName]) {
              constraints[empId][day] = weeklyConstraints.constraints[dayName];
            }
          }
        }
      }
      
      // Préparer les affluences (convertir en tableau de 7 jours)
      const affluences = [];
      for (let day = 0; day < 7; day++) {
        const dayName = this.days[day];
        affluences.push(affluenceLevels[dayName] || 2);
      }
      
      // Convertir les employés au format attendu par l'architecture distribuée
      const employeesData = employees.map(emp => ({
        _id: emp._id.toString(),
        name: emp.name,
        age: emp.age || 18,
        weeklyHours: emp.weeklyHours,
        skills: emp.skills || [],
        trainingDays: emp.trainingDays || [],
        sickLeave: emp.sickLeave || { isOnSickLeave: false }
      }));
      
      // Calculer l'historique des weekends (simulation basée sur les plannings précédents)
      const weekendHistory = await this.calculateWeekendHistory(employees, weekNumber, year);
      
      // Intégrer les maladies déclarées dans les contraintes automatiquement
      await this.integrateDeclaredSickLeaves(employees, constraints, weekNumber, year);
      
      console.log('📡 Données préparées pour OR-Tools:', {
        employeesData: employeesData.length,
        constraints: Object.keys(constraints).length,
        affluences
      });

      // Appeler l'architecture distribuée par défaut
      const result = await this.callDistributedServices({
        employees: employeesData,
        constraints: constraints,
        affluences: affluences,
        week_number: weekNumber,
        year: year,
        weekend_history: weekendHistory
      });
      
      console.log('📈 Résultat OR-Tools:', {
        success: result.success,
        hasPlanning: !!result.planning,
        error: result.error || 'Aucune erreur'
      });
      
      if (result.success) {
        if (result.method === 'distributed') {
          console.log('✅ Solution trouvée avec l\'architecture distribuée !');
          return this.createPlanningsFromDistributedSolution(result.planning, weekNumber, year, employees);
        } else {
          console.log('✅ Solution trouvée avec OR-Tools !');
          return this.createPlanningsFromORToolsSolution(result.planning, weekNumber, year, employees);
        }
      } else {
        console.log('⚠️ OR-Tools a échoué, fallback vers méthode classique...');
        console.log('Diagnostic:', result.diagnostic);
        console.log('Suggestions:', result.suggestions);
        return this.generateWeeklyPlanningClassic(weekNumber, year, affluenceLevels, employees);
      }
    } catch (error) {
      console.error('❌ Erreur avec l\'architecture distribuée:', error);
      console.log('⚠️ Tentative de fallback vers l\'ancien service OR-Tools...');
      
      try {
        const fallbackResult = await this.callORToolsAPI({
          employees: employeesData,
          constraints: constraints,
          affluences: affluences,
          week_number: weekNumber,
          weekend_history: weekendHistory
        });
        
        if (fallbackResult.success) {
          console.log('✅ Fallback OR-Tools réussi !');
          return this.createPlanningsFromORToolsSolution(fallbackResult.planning, weekNumber, year, employees);
        } else {
          throw new Error('Fallback OR-Tools échoué');
        }
      } catch (fallbackError) {
        console.error('❌ Fallback OR-Tools échoué:', fallbackError.message);
        console.log('⚠️ Fallback final vers méthode classique...');
        return this.generateWeeklyPlanningClassic(weekNumber, year, affluenceLevels, employees);
      }
    }
  }

  // Appeler l'API OR-Tools externe
  async callORToolsAPI(data) {
    
    // URL de l'API OR-Tools (vous devrez déployer le service Python)
    const apiUrl = process.env.ORTOOLS_API_URL || 'https://planning-ortools-api.onrender.com/solve';
    
    try {
      console.log('📡 Appel API OR-Tools:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data),
        timeout: 60000 // 60 secondes
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('📊 Réponse OR-Tools:', result.success ? '✅ Succès' : '❌ Échec');
      
      return result;
    } catch (error) {
      console.error('❌ Erreur appel API OR-Tools:', error.message);
      throw error;
    }
  }

  // NOUVELLE MÉTHODE : Architecture Distribuée avec 2 Services
  async callDistributedServices(data) {
    
    try {
      console.log('🏗️ Utilisation de l\'architecture distribuée...');
      
      // ÉTAPE 1 : Calculer les contraintes avec constraint-calculator
      console.log('🧮 Étape 1: Calcul des contraintes...');
      const constraintsResponse = await fetch('https://constraint-calculator.onrender.com/calculate-constraints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          employees: data.employees,
          week_number: data.week_number,
          year: data.year || new Date().getFullYear()
        }),
        timeout: 30000 // 30 secondes
      });
      
      if (!constraintsResponse.ok) {
        throw new Error(`Erreur calcul contraintes: HTTP ${constraintsResponse.status}`);
      }
      
      const constraintsResult = await constraintsResponse.json();
      console.log('✅ Contraintes calculées:', constraintsResult.success ? 'Succès' : 'Échec');
      
      // ÉTAPE 2 : Générer le planning avec planning-generator
      console.log('🚀 Étape 2: Génération du planning...');
      const planningResponse = await fetch('https://planning-generator.onrender.com/generate-planning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          employees: data.employees,
          week_number: data.week_number,
          year: data.year || new Date().getFullYear(),
          affluences: data.affluences
        }),
        timeout: 60000 // 60 secondes
      });
      
      if (!planningResponse.ok) {
        throw new Error(`Erreur génération planning: HTTP ${planningResponse.status}`);
      }
      
      const planningResult = await planningResponse.json();
      console.log('✅ Planning généré:', planningResult.success ? 'Succès' : 'Échec');
      
      if (planningResult.success) {
        return {
          success: true,
          planning: planningResult.planning,
          method: 'distributed',
          constraints: constraintsResult.constraints,
          solver_status: planningResult.solver_status,
          solve_time: planningResult.solve_time
        };
      } else {
        throw new Error(`Erreur génération planning: ${planningResult.error}`);
      }
      
    } catch (error) {
      console.error('❌ Erreur architecture distribuée:', error.message);
      throw error;
    }
  }

  // Créer les plannings à partir de la solution OR-Tools
  createPlanningsFromORToolsSolution(solution, weekNumber, year, employees) {
    const plannings = [];
    
    for (const emp of employees) {
      const empId = emp._id.toString();
      if (solution[empId]) {
        const schedule = [];
        let totalHours = 0;
        
        for (let day = 0; day < 7; day++) {
          const dayName = this.days[day];
          const daySlot = solution[empId][day];
          
          if (daySlot === 'Repos') {
            schedule.push({
              day: dayName,
              shifts: [],
              totalHours: 0,
              constraint: 'Repos'
            });
          } else if (daySlot === 'Formation') {
            schedule.push({
              day: dayName,
              shifts: [],
              totalHours: 8,
              constraint: 'Formation'
            });
            totalHours += 8;
          } else if (daySlot === 'CP') {
            const cpHours = emp.weeklyHours === 35 ? 5.5 : 6.5;
            schedule.push({
              day: dayName,
              shifts: [],
              totalHours: cpHours,
              constraint: 'CP'
            });
            totalHours += cpHours;
          } else if (daySlot === 'MAL' || daySlot === 'Maladie') {
            schedule.push({
              day: dayName,
              shifts: [],
              totalHours: 0,
              constraint: 'MAL'
            });
          } else {
            // Créneau de travail - convertir depuis le format OR-Tools
            const shift = this.convertORToolsSlotToShift(daySlot, emp);
            schedule.push({
              day: dayName,
              shifts: [shift],
              totalHours: shift.hoursWorked,
              constraint: undefined
            });
            totalHours += shift.hoursWorked;
          }
        }
        
        const planning = new Planning({
          weekNumber,
          year,
          employeeId: emp._id,
          employeeName: emp.name,
          schedule,
          totalWeeklyHours: totalHours,
          contractedHours: emp.weeklyHours,
          status: 'generated'
        });
        
        plannings.push(planning);
      }
    }
    
    return plannings;
  }

  // Créer les plannings à partir de la solution distribuée
  createPlanningsFromDistributedSolution(solution, weekNumber, year, employees) {
    const plannings = [];
    
    console.log('🏗️ Création des plannings depuis la solution distribuée...');
    
    for (const emp of employees) {
      const empId = emp._id.toString();
      if (solution[empId]) {
        const schedule = [];
        let totalHours = 0;
        
        for (let day = 0; day < 7; day++) {
          const dayName = this.days[day];
          const daySlot = solution[empId][day];
          
          if (daySlot === 'Repos') {
            schedule.push({
              day: dayName,
              shifts: [],
              totalHours: 0,
              constraint: 'Repos'
            });
          } else if (daySlot === 'Formation') {
            schedule.push({
              day: dayName,
              shifts: [],
              totalHours: 8,
              constraint: 'Formation'
            });
            totalHours += 8;
          } else if (daySlot === 'CP') {
            const cpHours = emp.weeklyHours === 35 ? 5.5 : 6.5;
            schedule.push({
              day: dayName,
              shifts: [],
              totalHours: cpHours,
              constraint: 'CP'
            });
            totalHours += cpHours;
          } else if (daySlot === 'MAL' || daySlot === 'Maladie') {
            schedule.push({
              day: dayName,
              shifts: [],
              totalHours: 0,
              constraint: 'MAL'
            });
          } else if (daySlot.startsWith('opening_') || daySlot.startsWith('afternoon_') || daySlot.startsWith('evening_')) {
            // Format distribué : "opening_06:00-13:30"
            const shift = this.convertDistributedSlotToShift(daySlot, emp);
            schedule.push({
              day: dayName,
              shifts: [shift],
              totalHours: shift.hoursWorked,
              constraint: undefined
            });
            totalHours += shift.hoursWorked;
          } else {
            // Créneau de travail - convertir depuis le format distribué
            const shift = this.convertDistributedSlotToShift(daySlot, emp);
            schedule.push({
              day: dayName,
              shifts: [shift],
              totalHours: shift.hoursWorked,
              constraint: undefined
            });
            totalHours += shift.hoursWorked;
          }
        }
        
        const planning = new Planning({
          weekNumber,
          year,
          employeeId: emp._id,
          employeeName: emp.name,
          schedule,
          totalWeeklyHours: totalHours,
          contractedHours: emp.weeklyHours,
          status: 'generated',
          method: 'distributed'
        });
        
        // 🔧 AJOUTER L'AJUSTEMENT DES HEURES CONTRACTUELLES
        this.adjustPlanningToContractHours(planning, emp);
        
        plannings.push(planning);
        console.log(`✅ Planning créé pour ${emp.name}: ${planning.totalWeeklyHours.toFixed(1)}h / ${emp.weeklyHours}h`);
      }
    }
    
    console.log(`🎯 Total: ${plannings.length} plannings créés`);
    return plannings;
  }

  // Convertir un créneau distribué en shift
  convertDistributedSlotToShift(slot, employee) {
    // Format distribué : "opening_06:00-13:30", "afternoon_13:30-16:00", "evening_16:00-20:30"
    if (slot.startsWith('opening_')) {
      const timeRange = slot.replace('opening_', '');
      const [start, end] = timeRange.split('-');
      return {
        start,
        end,
        hoursWorked: 7.5,
        shiftType: 'opening'
      };
    } else if (slot.startsWith('afternoon_')) {
      const timeRange = slot.replace('afternoon_', '');
      const [start, end] = timeRange.split('-');
      return {
        start,
        end,
        hoursWorked: 2.5,
        shiftType: 'afternoon'
      };
    } else if (slot.startsWith('evening_')) {
      const timeRange = slot.replace('evening_', '');
      const [start, end] = timeRange.split('-');
      return {
        start,
        end,
        hoursWorked: 4.5,
        shiftType: 'evening'
      };
    } else {
      // Format par défaut
      return {
        start: '09:00',
        end: '17:00',
        hoursWorked: 8.0,
        shiftType: 'standard'
      };
    }
  }

  // Convertir un créneau OR-Tools en shift
  convertORToolsSlotToShift(slot, employee) {
    // Mapping des créneaux OR-Tools vers les horaires
    const slotMappings = {
      // Créneaux semaine
      '06h00-14h00': { start: '06:00', end: '14:00', hours: 8.0 },
      '07h30-15h30': { start: '07:30', end: '15:30', hours: 8.0 },
      '09h00-17h00': { start: '09:00', end: '17:00', hours: 8.0 },
      '10h00-18h00': { start: '10:00', end: '18:00', hours: 8.0 },
      '13h00-20h30': { start: '13:00', end: '20:30', hours: 7.5 },
      '14h00-20h30': { start: '14:00', end: '20:30', hours: 6.5 },
      '16h00-20h30': { start: '16:00', end: '20:30', hours: 4.5 },
      
      // Créneaux samedi
      '06h00-16h30': { start: '06:00', end: '16:30', hours: 10.5 },
      '07h30-16h30': { start: '07:30', end: '16:30', hours: 9.0 },
      '10h30-16h30': { start: '10:30', end: '16:30', hours: 6.0 },
      '16h30-20h30': { start: '16:30', end: '20:30', hours: 4.0 },
      '17h00-20h30': { start: '17:00', end: '20:30', hours: 3.5 },
      
      // Créneaux dimanche
      '06h00-13h00': { start: '06:00', end: '13:00', hours: 7.0 },
      '07h30-13h00': { start: '07:30', end: '13:00', hours: 5.5 },
      '09h30-13h00': { start: '09:30', end: '13:00', hours: 3.5 },
      '13h00-20h30': { start: '13:00', end: '20:30', hours: 7.5 },
      '14h00-20h30': { start: '14:00', end: '20:30', hours: 6.5 }
    };
    
    const mapping = slotMappings[slot];
    if (mapping) {
      return {
        startTime: mapping.start,
        endTime: mapping.end,
        breakMinutes: 30,
        hoursWorked: mapping.hours,
        role: employee.role || 'vendeuse'
      };
    }
    
    // Fallback pour créneaux non reconnus
    return {
      startTime: '08:00',
      endTime: '17:00',
      breakMinutes: 30,
      hoursWorked: 8.0,
      role: employee.role || 'vendeuse'
    };
  }

  // Créer les plannings à partir de la solution du solveur (fallback)
  createPlanningsFromSolution(solution, weekNumber, year, employees) {
    const plannings = [];
    
    for (const emp of employees) {
      const empId = emp._id.toString();
      if (solution[empId]) {
        const schedule = [];
        let totalHours = 0;
        
        for (let day = 0; day < 7; day++) {
          const daySchedule = solution[empId][day];
          const dayName = this.days[day];
          
          if (daySchedule.slot === 'Repos') {
            schedule.push({
              day: dayName,
              shifts: [],
              totalHours: 0,
              constraint: 'Repos'
            });
          } else if (daySchedule.slot === 'Formation') {
            schedule.push({
              day: dayName,
              shifts: [],
              totalHours: 8,
              constraint: 'Formation'
            });
            totalHours += 8;
          } else if (daySchedule.slot === 'CP') {
            schedule.push({
              day: dayName,
              shifts: [],
              totalHours: emp.weeklyHours === 35 ? 5.5 : 6.5,
              constraint: 'CP'
            });
            totalHours += emp.weeklyHours === 35 ? 5.5 : 6.5;
          } else if (daySchedule.slot === 'MAL') {
            schedule.push({
              day: dayName,
              shifts: [],
              totalHours: 0,
              constraint: 'MAL'
            });
          } else {
            // Créneau de travail
            const shift = this.generateShiftFromSlot(daySchedule.slot, emp);
            schedule.push({
              day: dayName,
              shifts: [shift],
              totalHours: daySchedule.hours,
              constraint: undefined
            });
            totalHours += daySchedule.hours;
          }
        }
        
        const planning = new Planning({
          weekNumber,
          year,
          employeeId: emp._id,
          employeeName: emp.name,
          schedule,
          totalWeeklyHours: totalHours,
          contractedHours: emp.weeklyHours,
          status: 'generated'
        });
        
        plannings.push(planning);
      }
    }
    
    return plannings;
  }

  // Générer un shift à partir d'un créneau
  generateShiftFromSlot(slot, employee) {
    const slotHours = planningSolver.getSlotHours();
    const hours = slotHours[slot] || 8;
    
    // Extraire les heures du créneau (ex: "06h00-14h00")
    const timeMatch = slot.match(/(\d{1,2})h(\d{2})-(\d{1,2})h(\d{2})/);
    if (timeMatch) {
      const startHour = timeMatch[1] + ':' + timeMatch[2];
      const endHour = timeMatch[3] + ':' + timeMatch[4];
      
      return {
        startTime: startHour,
        endTime: endHour,
        breakMinutes: 30,
        hoursWorked: hours,
        role: employee.role
      };
    }
    
    // Fallback
    return {
      startTime: '08:00',
      endTime: '17:00',
      breakMinutes: 30,
      hoursWorked: hours,
      role: employee.role
    };
  }

  // Méthode supprimée - utilisez celle avec API OR-Tools externe (ligne 570)

  // Méthode supprimée - utilisez createPlanningsFromORToolsSolution (ligne 673)

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
        const dayConstraint = await this.checkConstraints(employee, day, weekNumber, year);
        
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
          
          const dayConstraint = await this.checkConstraints(employee, day, weekNumber, year);
          
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
    
    // ÉQUILIBRAGE SPÉCIAL DES WEEKENDS - PRIORITÉ MAXIMALE
    if (day === 'Samedi' || day === 'Dimanche') {
      // Priorité TRÈS haute pour ceux qui ont peu travaillé les weekends précédents
      const weekendWorkCount = this.getWeekendWorkCount(employee, schedule);
      priority -= (3 - weekendWorkCount) * 25; // Priorité +25 par weekend manquant
      
      // Priorité TRÈS basse pour ceux qui ont beaucoup travaillé les weekends
      if (weekendWorkCount > 1) {
        priority += weekendWorkCount * 20;
      }
      
      // Priorité absolue pour les weekends si l'employé a des heures disponibles
      if (schedule.totalHours < employee.weeklyHours) {
        priority -= 200; // Priorité absolue pour les weekends
      }
    }
    
    // RÉSERVATION D'HEURES POUR LES WEEKENDS
    if (day === 'Lundi' || day === 'Mardi' || day === 'Mercredi' || day === 'Jeudi' || day === 'Vendredi') {
      // Priorité basse si l'employé a déjà beaucoup d'heures en semaine
      if (schedule.totalHours > employee.weeklyHours * 0.7) { // Plus de 70% des heures
        priority += 50; // Priorité basse pour réserver des heures aux weekends
      }
    }
    
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

  // Compter le nombre de weekends travaillés récemment
  getWeekendWorkCount(employee, schedule) {
    let weekendCount = 0;
    for (const daySchedule of schedule.schedule) {
      if ((daySchedule.day === 'Samedi' || daySchedule.day === 'Dimanche') && 
          daySchedule.shifts && daySchedule.shifts.length > 0) {
        weekendCount++;
      }
    }
    return weekendCount;
  }

  // Calculer la priorité weekend spécifique
  calculateWeekendPriority(candidate, day) {
    let priority = 0;
    const employee = candidate.employee;
    const schedule = candidate.schedule;
    
    // Priorité basse si l'employé a déjà beaucoup d'heures
    if (schedule.totalHours >= employee.weeklyHours) {
      priority += 1000; // Priorité très basse
      return priority;
    }
    
    // Priorité haute si l'employé a des heures disponibles
    const remainingHours = employee.weeklyHours - schedule.totalHours;
    priority -= remainingHours * 2; // Plus d'heures disponibles = priorité plus haute
    
    // Priorité haute pour ceux qui ont peu travaillé les weekends
    const weekendWorkCount = this.getWeekendWorkCount(employee, schedule);
    priority -= (3 - weekendWorkCount) * 30; // Priorité +30 par weekend manquant
    
    // Priorité basse pour ceux qui ont beaucoup travaillé les weekends
    if (weekendWorkCount > 1) {
      priority += weekendWorkCount * 25;
    }
    
    // Priorité haute pour les bonnes compétences
    const hasOpeningSkill = employee.skills.includes('Ouverture');
    const hasClosingSkill = employee.skills.includes('Fermeture');
    
    if (day === 'Dimanche' && hasOpeningSkill) {
      priority -= 50; // Priorité très haute pour ouverture le dimanche
    } else if (day === 'Samedi' && (hasOpeningSkill || hasClosingSkill)) {
      priority -= 40; // Priorité haute pour ouverture/fermeture le samedi
    }
    
    return priority;
  }

  // Sélectionner les employés pour un jour donné
  selectEmployeesForDay(availableEmployees, requirements, day) {
    const selected = [];
    const openingNeeded = requirements.opening?.staff || 0;
    const afternoonNeeded = requirements.afternoon?.staff || 0;
    const eveningNeeded = requirements.evening?.staff || 0;
    
    // EXIGENCE SPÉCIALE : Weekends avec personnel minimum garanti
    const isWeekend = day === 'Samedi' || day === 'Dimanche';
    const weekendMinStaff = day === 'Samedi' ? 4 : 2; // Samedi: 4 min, Dimanche: 2 min
    
    // Trier par priorité (plus bas = plus prioritaire)
    availableEmployees.sort((a, b) => a.priority - b.priority);
    
    // SÉLECTION OBLIGATOIRE pour les weekends - PRIORITÉ ABSOLUE
    if (isWeekend) {
      // Forcer la sélection d'employés pour respecter le minimum weekend
      let forcedSelected = 0;
      
      // TRIER par priorité weekend (plus bas = plus prioritaire)
      const weekendCandidates = [...availableEmployees].sort((a, b) => {
        const aWeekendPriority = this.calculateWeekendPriority(a, day);
        const bWeekendPriority = this.calculateWeekendPriority(b, day);
        return aWeekendPriority - bWeekendPriority;
      });
      
      for (const candidate of weekendCandidates) {
        if (forcedSelected >= weekendMinStaff) break;
        
        // Éviter de sélectionner deux fois le même employé
        if (selected.find(s => s.employee._id.toString() === candidate.employee._id.toString())) {
          continue;
        }
        
        // Vérifier que l'employé peut encore travailler
        const totalHoursWithConstraints = candidate.schedule.totalHours;
        if (totalHoursWithConstraints >= candidate.employee.weeklyHours) {
          continue;
        }
        
        // Sélectionner en priorité ceux avec les bonnes compétences
        const hasOpeningSkill = candidate.employee.skills.includes('Ouverture');
        const hasClosingSkill = candidate.employee.skills.includes('Fermeture');
        
        if (day === 'Dimanche' && hasOpeningSkill) {
          // Dimanche : priorité aux ouverture
          selected.push({ ...candidate, shiftType: 'opening' });
          forcedSelected++;
          console.log(`🔒 FORCÉ: ${candidate.employee.name} sélectionné pour ${day} (ouverture)`);
        } else if (day === 'Samedi' && (hasOpeningSkill || hasClosingSkill)) {
          // Samedi : priorité aux ouverture/fermeture
          selected.push({ ...candidate, shiftType: hasOpeningSkill ? 'opening' : 'afternoon' });
          forcedSelected++;
          console.log(`🔒 FORCÉ: ${candidate.employee.name} sélectionné pour ${day} (${hasOpeningSkill ? 'ouverture' : 'fermeture'})`);
        } else if (!hasOpeningSkill && !hasClosingSkill) {
          // Compléter avec les autres
          selected.push({ ...candidate, shiftType: 'standard' });
          forcedSelected++;
          console.log(`🔒 FORCÉ: ${candidate.employee.name} sélectionné pour ${day} (standard)`);
        }
      }
      
      // VÉRIFICATION : Si on n'a pas assez de personnel, forcer la sélection
      if (forcedSelected < weekendMinStaff) {
        console.log(`⚠️ ATTENTION: Seulement ${forcedSelected}/${weekendMinStaff} employés sélectionnés pour ${day}`);
      }
    }
    
    // SÉLECTION NORMALE pour l'ouverture
    let openingSelected = 0;
    for (const candidate of availableEmployees) {
      if (openingSelected >= openingNeeded) break;
      
      // Éviter de sélectionner deux fois le même employé
      if (selected.find(s => s.employee._id.toString() === candidate.employee._id.toString())) {
        continue;
      }
      
      // Vérifier que l'employé peut encore travailler
      const totalHoursWithConstraints = candidate.schedule.totalHours;
      if (totalHoursWithConstraints >= candidate.employee.weeklyHours) {
        continue;
      }
      
      const hasOpeningSkill = candidate.employee.skills.includes('Ouverture');
      if (hasOpeningSkill || candidate.employee.role === 'manager' || candidate.employee.role === 'responsable') {
        selected.push({
          ...candidate,
          shiftType: 'opening'
        });
        openingSelected++;
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
      if (selected.length >= (openingNeeded + afternoonNeeded + eveningNeeded)) break;
      
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
    
    // Si l'employé a trop d'heures, réduire les shifts pour atteindre exactement les heures contractuelles
    if (currentHours > targetHours) {
      const excessHours = currentHours - targetHours;
      console.log(`📅 ${employee.name} a ${excessHours}h en trop, réduction des shifts`);
      
      // Réduire les shifts en commençant par les plus longs
      const allShifts = [];
      schedule.schedule.forEach(day => {
        day.shifts.forEach(shift => {
          allShifts.push({ day, shift, hours: shift.hoursWorked });
        });
      });
      
      // Trier par heures décroissantes
      allShifts.sort((a, b) => b.hours - a.hours);
      
      let remainingExcess = excessHours;
      for (const { day, shift } of allShifts) {
        if (remainingExcess <= 0) break;
        
        if (shift.hoursWorked <= remainingExcess) {
          // Supprimer complètement le shift
          day.shifts = day.shifts.filter(s => s !== shift);
          day.totalHours = day.shifts.reduce((sum, s) => sum + s.hoursWorked, 0);
          remainingExcess -= shift.hoursWorked;
          schedule.totalHours -= shift.hoursWorked;
        } else {
          // Réduire partiellement le shift
          const reduction = remainingExcess;
          shift.hoursWorked -= reduction;
          shift.endTime = this.adjustEndTime(shift.startTime, shift.hoursWorked);
          day.totalHours = day.shifts.reduce((sum, s) => sum + s.hoursWorked, 0);
          remainingExcess = 0;
          schedule.totalHours -= reduction;
        }
      }
    }
    
    // Si l'employé n'a pas assez d'heures, essayer de réduire les repos
    else if (currentHours < targetHours - 4) { // Tolérance de 4h
      const missingHours = targetHours - currentHours;
      console.log(`📅 ${employee.name} manque ${missingHours}h, transformation de jours de repos en travail`);
      
      // Trouver les jours de repos pour les transformer en travail
      const restDays = schedule.schedule.filter(day => day.constraint === 'Repos');
      
      for (const restDay of restDays) {
        if (schedule.totalHours >= targetHours) break;
        
        restDay.constraint = undefined;
        restDay.totalHours = 0;
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

  // Méthode de test pour l'architecture distribuée
  async testDistributedArchitecture() {
    console.log('🧪 Test de l\'architecture distribuée...');
    
    try {
      // Test du service constraint-calculator
      console.log('🧮 Test du service constraint-calculator...');
      const constraintResponse = await fetch('https://constraint-calculator.onrender.com/health');
      const constraintHealth = await constraintResponse.json();
      console.log('✅ Constraint Calculator:', constraintHealth.status);
      
      // Test du service planning-generator
      console.log('🚀 Test du service planning-generator...');
      const planningResponse = await fetch('https://planning-generator.onrender.com/health');
      const planningHealth = await planningResponse.json();
      console.log('✅ Planning Generator:', planningHealth.status);
      
      return {
        success: true,
        constraint_calculator: constraintHealth,
        planning_generator: planningHealth,
        message: 'Architecture distribuée opérationnelle'
      };
    } catch (error) {
      console.error('❌ Erreur test architecture distribuée:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Architecture distribuée non opérationnelle'
      };
    }
  }

  // 🔧 AJOUTER L'AJUSTEMENT DES HEURES CONTRACTUELLES
  adjustPlanningToContractHours(planning, employee) {
    const targetHours = employee.weeklyHours;
    const currentHours = planning.totalWeeklyHours;
    
    if (currentHours > targetHours) {
      const excessHours = currentHours - targetHours;
      console.log(`📅 ${employee.name}: ${excessHours}h en trop, réduction des shifts`);
      
      // Réduire les shifts en commençant par les plus longs
      const allShifts = [];
      planning.schedule.forEach(day => {
        day.shifts.forEach(shift => {
          allShifts.push({ day, shift, hours: shift.hoursWorked });
        });
      });
      
      // Trier par heures décroissantes
      allShifts.sort((a, b) => b.hours - a.hours);
      
      let remainingExcess = excessHours;
      for (const { day, shift } of allShifts) {
        if (remainingExcess <= 0) break;
        
        if (shift.hoursWorked <= remainingExcess) {
          // Supprimer complètement le shift
          day.shifts = day.shifts.filter(s => s !== shift);
          day.totalHours = day.shifts.reduce((sum, s) => sum + s.hoursWorked, 0);
          remainingExcess -= shift.hoursWorked;
          planning.totalWeeklyHours -= shift.hoursWorked;
        } else {
          // Réduire partiellement le shift
          const reduction = remainingExcess;
          shift.hoursWorked -= reduction;
          shift.endTime = this.adjustEndTime(shift.startTime, shift.hoursWorked);
          day.totalHours = day.shifts.reduce((sum, s) => sum + s.hoursWorked, 0);
          remainingExcess = 0;
          planning.totalWeeklyHours -= reduction;
        }
      }
    }
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

// Test de l'architecture distribuée
exports.testDistributedArchitecture = async (req, res) => {
  try {
    const result = await planningGenerator.testDistributedArchitecture();
    res.json(result);
  } catch (error) {
    console.error('Erreur lors du test de l\'architecture distribuée:', error);
    res.status(500).json({ error: error.message });
  }
};

