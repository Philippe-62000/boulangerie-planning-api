const Planning = require('../models/Planning');
const Employee = require('../models/Employee');
const WeeklyConstraints = require('../models/WeeklyConstraints');
const EquityStats = require('../models/EquityStats');

class PlanningGenerator {
  constructor() {
    this.days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    this.businessHours = {
      start: '06:00',
      end: '20:30'
    };
  }

  // Configuration des besoins par jour selon l'affluence
  getDailyRequirements(affluenceLevel) {
    const requirements = {
      0: { // Faible affluence
        morning: { start: '06:00', end: '13:30', staff: 1 },
        afternoon: { start: '13:30', end: '20:30', staff: 2 }
      },
      2: { // Affluence normale
        morning: { start: '06:00', end: '13:30', staff: 2 },
        afternoon: { start: '13:30', end: '20:30', staff: 3 }
      },
      4: { // Forte affluence
        morning: { start: '06:00', end: '13:30', staff: 3 },
        afternoon: { start: '13:30', end: '20:30', staff: 4 }
      }
    };
    return requirements[affluenceLevel] || requirements[2];
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
  checkConstraints(employee, dayConstraints, day) {
    // Vérifier que dayConstraints existe et est un objet
    if (!dayConstraints || typeof dayConstraints !== 'object') {
      return { canWork: true, type: 'shift' };
    }
    
    const constraint = dayConstraints[day];

    if (!constraint) return { canWork: true, type: 'shift' };

    switch (constraint) {
      case 'Fermé':
        return { canWork: false, type: 'Fermé' };
      case 'Repos':
        return { canWork: false, type: 'Repos' };
      case 'Formation':
        return { canWork: false, type: 'Formation' };
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

  // Générer le planning pour une semaine avec optimisation
  async generateWeeklyPlanning(weekNumber, year, affluenceLevels, employees) {
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

    // Créer les plannings finaux
    for (const [employeeId, schedule] of employeeSchedules) {
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
    
    // Priorité basse si l'employé a déjà beaucoup d'heures
    priority += schedule.totalHours * 10;
    
    // Priorité basse si l'employé a déjà beaucoup de jours travaillés
    priority += schedule.daysWorked * 5;
    
    // Priorité haute pour les managers
    if (employee.role === 'manager' || employee.role === 'responsable') {
      priority -= 20;
    }
    
    // Priorité basse pour les apprentis (formation prioritaire)
    if (employee.role === 'apprenti') {
      priority += 50;
    }
    
    return priority;
  }

  // Sélectionner les employés pour un jour donné
  selectEmployeesForDay(availableEmployees, requirements, day) {
    const selected = [];
    const morningNeeded = requirements.morning.staff;
    const afternoonNeeded = requirements.afternoon.staff;
    
    // Sélectionner pour le matin
    let morningSelected = 0;
    for (const candidate of availableEmployees) {
      if (morningSelected >= morningNeeded) break;
      
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
      
      selected.push({
        ...candidate,
        shiftType: 'standard'
      });
    }
    
    return selected;
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

    // Générer les plannings
    const plannings = await planningGenerator.generateWeeklyPlanning(
      weekNumber,
      year,
      affluenceLevels,
      employees
    );

    // Sauvegarder les plannings
    const savedPlannings = await Planning.insertMany(plannings);

    res.json({
      message: 'Planning généré avec succès',
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

