/**
 * Solveur de planning par algorithme génétique + scoring multi-critères.
 * Fitness = somme des pénalités (minimisation).
 */

const planningBusinessRules = require('../constants/planningBusinessRules');

const SOLVER_DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

/** Libellés français pour l’API (détail du scoring) */
const SCORE_LABELS = {
  contractVolumeVente: 'Volume horaire (vente) : écart contrat vs heures effectives après pause (×10)',
  weekendEquity: 'Équité week-end (vendeuses) : dispersion des jours sam./dim. travaillés (×8)',
  globalRestDistribution: 'Répartition globale des repos par jour (écart à 2 personnes en repos/jour)',
  preferenceRestDay: 'Préférence jour de repos vendeuse non respectée (×25 par occurrence)',
  preferenceShift: 'Préférence matin/soir vendeuse non respectée (×12 par créneau)',
  coverageEarly: 'Couverture matin tôt : au moins 1 vendeuse en 6h (×40 par jour manquant)',
  coverageMid: 'Couverture mi-journée : au moins 3 vendeuses sur plage élargie (×15 par jour manquant)',
  coverageLate: 'Couverture fin de journée : au moins 2 vendeuses (×20 par jour manquant)',
  minorsSunday: 'Mineur : travail le dimanche interdit (×100)',
  minorsMinRestDays: 'Mineur : moins de 2 jours de repos sur la semaine (×80)',
  majorsVenteMinRest: 'Majeur vendeur : moins d\'un jour de repos (×60)'
};

function inferEmployeeCategoryForSolver(emp) {
  if (emp.employeeCategory && ['vente', 'preparation', 'boulanger'].includes(emp.employeeCategory)) {
    return emp.employeeCategory;
  }
  const role = (emp.role || '').toLowerCase();
  if (role === 'boulanger' || role === 'apprenti boulanger') return 'boulanger';
  if (role === 'préparateur' || role === 'apprenti préparateur' || role === 'chef prod') return 'preparation';
  return 'vente';
}

function getContractTypeForSolver(emp) {
  return emp.contractType || emp.contract;
}

function slotAllowedForEmployeeSkills(slot, emp) {
  if (!slot || slot === 'Repos') return true;
  if (['Formation', 'CP', 'MAL', 'Indisponible'].includes(slot)) return true;
  const skills = emp.skills || [];
  if (slot.startsWith('06h00') && !skills.includes('Ouverture')) return false;
  if (
    (slot.includes('13h00-20h30') ||
      slot.includes('14h00-20h30') ||
      slot.includes('16h30-20h30') ||
      slot.includes('17h00-20h30')) &&
    !skills.includes('Fermeture')
  ) {
    return false;
  }
  return true;
}

class PlanningBoulangerieSolver {
  constructor() {
    this.timeoutMs = 45000;
    this.gaPopulationSize = 40;
    this.gaMaxGenerations = 70;
    this.gaElitism = 2;
    this.gaCrossoverRate = 0.88;
    this.gaMutationRate = 0.12;
    this.gaMutationGeneRate = 0.08;
    this.gaTournamentSize = 3;
  }

  getEffectiveHoursForSlot(slot, emp, slotHoursMap) {
    const raw = slotHoursMap[slot];
    if (raw === undefined || raw === null || slot === 'Repos') return raw || 0;
    if (slot === 'Formation' || slot === 'CP') {
      return raw;
    }
    const breakMin =
      emp.dailyBreakMinutes != null
        ? emp.dailyBreakMinutes
        : planningBusinessRules.DEFAULT_DAILY_BREAK_MINUTES;
    if (raw >= 5.5) {
      return Math.max(0, raw - breakMin / 60);
    }
    return raw;
  }

  getTimeSlotsForDay(dayIndex, affluenceLevel) {
    if (dayIndex === 6) {
      return [
        'Repos',
        '06h00-13h00',
        '07h30-13h00',
        '09h30-13h00',
        '13h00-20h30',
        '14h00-20h30'
      ];
    }
    if (dayIndex === 5) {
      return [
        'Repos',
        '06h00-16h30',
        '07h30-16h30',
        '10h30-16h30',
        '16h30-20h30',
        '17h00-20h30'
      ];
    }
    let baseSlots = ['Repos', '06h00-14h00', '07h30-15h30', '13h00-20h30'];
    if (affluenceLevel >= 2) {
      baseSlots.push('10h00-18h00', '14h00-20h30');
    }
    if (affluenceLevel >= 3) {
      baseSlots.push('09h00-17h00', '16h00-20h30');
    }
    return baseSlots;
  }

  getSlotHours() {
    return {
      '06h00-14h00': 8.0,
      '07h30-15h30': 8.0,
      '09h00-17h00': 8.0,
      '10h00-18h00': 8.0,
      '13h00-20h30': 7.5,
      '14h00-20h30': 6.5,
      '16h00-20h30': 4.5,
      '06h00-16h30': 10.5,
      '07h30-16h30': 9.0,
      '10h30-16h30': 6.0,
      '16h30-20h30': 4.0,
      '17h00-20h30': 3.5,
      '06h00-13h00': 7.0,
      '07h30-13h00': 5.5,
      '09h30-13h00': 3.5,
      '13h00-20h30': 7.5,
      '14h00-20h30': 6.5,
      Formation: 8.0,
      CP: 5.5,
      MAL: 0,
      Indisponible: 0,
      Repos: 0
    };
  }

  cloneSolution(solution) {
    return JSON.parse(JSON.stringify(solution));
  }

  getFixedSlotForCell(emp, dayIndex, constraints) {
    const empId = emp._id.toString();
    const category = inferEmployeeCategoryForSolver(emp);
    if (category === 'boulanger' || category === 'preparation') {
      return 'Repos';
    }
    if (constraints[empId] && constraints[empId][dayIndex] !== undefined) {
      const c = constraints[empId][dayIndex];
      if (['CP', 'MAL', 'Formation', 'Indisponible', 'Repos'].includes(c)) {
        return c;
      }
    }
    const dayName = SOLVER_DAY_NAMES[dayIndex];
    const ct = getContractTypeForSolver(emp);
    if (
      ct === 'Apprentissage' &&
      emp.trainingDays &&
      emp.trainingDays.includes(dayName) &&
      emp.trainingDaysOutsideShop !== false
    ) {
      return 'Formation';
    }
    return null;
  }

  pickRandomLegalSlot(emp, dayIndex, affluences) {
    const availableSlots = this.getTimeSlotsForDay(dayIndex, affluences[dayIndex]);
    let pool = availableSlots.filter((s) => slotAllowedForEmployeeSkills(s, emp));
    if (pool.length === 0) {
      pool = availableSlots;
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  repairSolution(solution, employees, constraints, affluences) {
    for (const emp of employees) {
      const empId = emp._id.toString();
      if (!solution[empId]) solution[empId] = {};
      for (let day = 0; day < 7; day++) {
        const fixed = this.getFixedSlotForCell(emp, day, constraints);
        if (fixed !== null) {
          solution[empId][day] = fixed;
        } else {
          const slot = solution[empId][day];
          if (!slot || !slotAllowedForEmployeeSkills(slot, emp)) {
            solution[empId][day] = this.pickRandomLegalSlot(emp, day, affluences);
          }
        }
      }
    }
  }

  tournamentSelection(population, fitness) {
    let best = Math.floor(Math.random() * population.length);
    for (let t = 1; t < this.gaTournamentSize; t++) {
      const j = Math.floor(Math.random() * population.length);
      if (fitness[j] < fitness[best]) {
        best = j;
      }
    }
    return population[best];
  }

  crossover(parentA, parentB, employees, constraints, affluences) {
    const child = {};
    for (const emp of employees) {
      const empId = emp._id.toString();
      child[empId] = {};
      for (let day = 0; day < 7; day++) {
        const fixed = this.getFixedSlotForCell(emp, day, constraints);
        if (fixed !== null) {
          child[empId][day] = fixed;
        } else {
          const src = Math.random() < 0.5 ? parentA : parentB;
          child[empId][day] = src[empId] ? src[empId][day] : this.pickRandomLegalSlot(emp, day, affluences);
        }
      }
    }
    this.repairSolution(child, employees, constraints, affluences);
    return child;
  }

  mutate(solution, employees, constraints, affluences) {
    const copy = this.cloneSolution(solution);
    for (const emp of employees) {
      const empId = emp._id.toString();
      if (inferEmployeeCategoryForSolver(emp) !== 'vente') continue;
      for (let day = 0; day < 7; day++) {
        if (this.getFixedSlotForCell(emp, day, constraints) !== null) continue;
        if (Math.random() < this.gaMutationGeneRate) {
          copy[empId][day] = this.pickRandomLegalSlot(emp, day, affluences);
        }
      }
    }
    if (Math.random() < this.gaMutationRate) {
      const venteEmps = employees.filter((e) => inferEmployeeCategoryForSolver(e) === 'vente');
      if (venteEmps.length > 0) {
        const emp = venteEmps[Math.floor(Math.random() * venteEmps.length)];
        const day = Math.floor(Math.random() * 7);
        if (this.getFixedSlotForCell(emp, day, constraints) === null) {
          const id = emp._id.toString();
          copy[id][day] = this.pickRandomLegalSlot(emp, day, affluences);
        }
      }
    }
    this.repairSolution(copy, employees, constraints, affluences);
    return copy;
  }

  /**
   * Détail complet des pénalités (pour l’API).
   */
  evaluateSolutionDetailed(solution, employees, slotHours) {
    return this._computeScoreBreakdown(solution, employees, slotHours);
  }

  /** Fitness scalaire (minimisation) — utilisé par l’AG. */
  evaluateSolution(solution, employees, slotHours) {
    return this._computeScoreBreakdown(solution, employees, slotHours).total;
  }

  _computeScoreBreakdown(solution, employees, slotHours) {
    const breakdown = {
      contractVolumeVente: 0,
      weekendEquity: 0,
      globalRestDistribution: 0,
      preferenceRestDay: 0,
      preferenceShift: 0,
      coverageEarly: 0,
      coverageMid: 0,
      coverageLate: 0,
      minorsSunday: 0,
      minorsMinRestDays: 0,
      majorsVenteMinRest: 0
    };

    const volumeDetails = [];

    const vendeIds = employees
      .filter((e) => inferEmployeeCategoryForSolver(e) === 'vente')
      .map((e) => e._id.toString());

    for (const emp of employees) {
      const empId = emp._id.toString();
      if (!solution[empId]) continue;
      if (inferEmployeeCategoryForSolver(emp) !== 'vente') continue;

      let totalHours = 0;
      for (let day = 0; day < 7; day++) {
        const slot = solution[empId][day];
        totalHours += this.getEffectiveHoursForSlot(slot, emp, slotHours);
      }

      const targetHours = emp.weeklyHours;
      const gap = Math.abs(totalHours - targetHours);
      const penalty = gap * 10;
      breakdown.contractVolumeVente += penalty;
      if (gap > 0.01) {
        volumeDetails.push({
          employeeId: empId,
          name: emp.name,
          targetHours,
          effectiveHours: Math.round(totalHours * 100) / 100,
          gapHours: Math.round(gap * 100) / 100,
          penalty: Math.round(penalty * 100) / 100
        });
      }
    }

    if (vendeIds.length > 1) {
      const weekendLoads = vendeIds.map((id) => {
        let w = 0;
        for (const d of [5, 6]) {
          const sl = solution[id][d];
          if (sl && sl !== 'Repos' && !['MAL', 'CP', 'Indisponible'].includes(sl)) {
            w += 1;
          }
        }
        return w;
      });
      const avg = weekendLoads.reduce((a, b) => a + b, 0) / weekendLoads.length;
      weekendLoads.forEach((w) => {
        breakdown.weekendEquity += Math.abs(w - avg) * 8;
      });
    }

    for (let day = 0; day < 7; day++) {
      let restCount = 0;
      for (const emp of employees) {
        const empId = emp._id.toString();
        if (solution[empId] && solution[empId][day] === 'Repos') {
          restCount++;
        }
      }
      const idealRest = 2;
      breakdown.globalRestDistribution += Math.abs(restCount - idealRest);
    }

    for (const emp of employees) {
      const empId = emp._id.toString();
      if (!solution[empId] || inferEmployeeCategoryForSolver(emp) !== 'vente') continue;

      const pref = emp.vendeusePlanningPreferences || {};
      const restDay = pref.preferredRestDay;
      if (restDay) {
        const idx = SOLVER_DAY_NAMES.indexOf(restDay);
        if (idx >= 0 && solution[empId][idx] !== 'Repos') {
          breakdown.preferenceRestDay += 25;
        }
      }

      const sp = pref.shiftPreference || 'aucune';
      if (sp === 'matin' || sp === 'soir') {
        for (let day = 0; day < 7; day++) {
          const slot = solution[empId][day];
          if (!slot || slot === 'Repos' || ['Formation', 'CP', 'MAL', 'Indisponible'].includes(slot)) continue;
          const isEvening =
            slot.includes('13h00') ||
            slot.includes('14h00') ||
            slot.includes('16h00') ||
            slot.includes('16h30') ||
            slot.includes('17h00');
          const isMorning =
            slot.startsWith('06h00') ||
            slot.startsWith('07h30') ||
            slot.startsWith('09h00') ||
            slot.startsWith('10h00');
          if (sp === 'matin' && isEvening) breakdown.preferenceShift += 12;
          if (sp === 'soir' && isMorning) breakdown.preferenceShift += 12;
        }
      }
    }

    for (let day = 0; day < 7; day++) {
      let early = 0;
      let mid = 0;
      let late = 0;
      for (const id of vendeIds) {
        const slot = solution[id][day];
        if (!slot || slot === 'Repos' || ['MAL', 'CP', 'Indisponible'].includes(slot)) continue;
        if (slot.startsWith('06h00')) early += 1;
        if (
          slot.includes('10h00') ||
          slot.includes('12h00') ||
          slot === '06h00-14h00' ||
          slot.includes('10h30') ||
          slot.includes('07h30')
        ) {
          mid += 1;
        }
        if (
          slot.includes('13h00-20h30') ||
          slot.includes('14h00-20h30') ||
          slot.includes('16h30-20h30') ||
          slot.includes('17h00-20h30')
        ) {
          late += 1;
        }
      }
      if (early < 1) breakdown.coverageEarly += 40;
      if (mid < 3) breakdown.coverageMid += 15;
      if (late < 2) breakdown.coverageLate += 20;
    }

    for (const emp of employees) {
      const empId = emp._id.toString();
      if (!solution[empId]) continue;

      if (emp.age < 18) {
        if (solution[empId][6] !== 'Repos') {
          breakdown.minorsSunday += 100;
        }
        let restDays = 0;
        for (let day = 0; day < 7; day++) {
          if (solution[empId][day] === 'Repos') restDays++;
        }
        if (restDays < 2) {
          breakdown.minorsMinRestDays += 80;
        }
      }

      if (emp.age >= 18 && inferEmployeeCategoryForSolver(emp) === 'vente') {
        let restDays = 0;
        for (let day = 0; day < 7; day++) {
          if (solution[empId][day] === 'Repos') restDays++;
        }
        if (restDays < 1) {
          breakdown.majorsVenteMinRest += 60;
        }
      }
    }

    const total = Object.values(breakdown).reduce((sum, v) => sum + v, 0);

    return {
      total,
      breakdown,
      labels: SCORE_LABELS,
      volumeDetails
    };
  }

  solvePlanning(employees, constraints, affluences, weekNumber) {
    console.log(`🧬 AG — résolution planning semaine ${weekNumber}`);
    console.log(
      `👥 Employés: ${employees.length}, contraintes: ${Object.keys(constraints).length}, population: ${this.gaPopulationSize}`
    );

    const startTime = Date.now();
    const slotHours = this.getSlotHours();

    if (employees.length < 1) {
      return {
        success: false,
        error: 'Au moins 1 employé est nécessaire',
        diagnostic: ['Aucun employé fourni'],
        suggestions: ['Ajoutez au moins un employé']
      };
    }

    const diagnostic = [];
    const suggestions = [];

    if (employees.length === 1) {
      diagnostic.push('Un seul employé (planification limitée)');
      suggestions.push('Ajoutez plus d\'employés pour un planning optimal');
    }

    const openingStaff = employees.filter((emp) => emp.skills && emp.skills.includes('Ouverture')).length;
    const closingStaff = employees.filter((emp) => emp.skills && emp.skills.includes('Fermeture')).length;

    if (openingStaff === 0) {
      diagnostic.push('Aucun employé avec compétence Ouverture');
      suggestions.push('Ajoutez la compétence Ouverture à au moins un employé');
    }

    if (closingStaff === 0) {
      diagnostic.push('Aucun employé avec compétence Fermeture');
      suggestions.push('Ajoutez la compétence Fermeture à au moins un employé');
    }

    diagnostic.push(
      'Algorithme génétique : population, croisement uniforme par case libre, mutation, élitisme ; fitness = somme des pénalités (voir scoringDetail)'
    );
    diagnostic.push(
      'Champs salarié : employeeCategory, dailyBreakMinutes, vendeusePlanningPreferences, trainingDaysOutsideShop, contractType + trainingDays'
    );

    const population = [];
    for (let i = 0; i < this.gaPopulationSize; i++) {
      population.push(this.generateCandidateSolution(employees, constraints, affluences, slotHours));
    }

    let fitness = population.map((ind) => this.evaluateSolution(ind, employees, slotHours));
    let fitnessEvaluations = this.gaPopulationSize;

    const argmin = (arr) => arr.reduce((m, v, i) => (v < arr[m] ? i : m), 0);
    let bestIdx = argmin(fitness);
    let bestEver = this.cloneSolution(population[bestIdx]);
    let bestEverScore = fitness[bestIdx];

    let generationsRun = 0;

    for (let gen = 0; gen < this.gaMaxGenerations; gen++) {
      if (Date.now() - startTime > this.timeoutMs) {
        console.log('⏰ Timeout AG — meilleure solution conservée');
        break;
      }

      const indices = population.map((_, i) => i).sort((a, b) => fitness[a] - fitness[b]);

      const nextPop = [];
      for (let e = 0; e < this.gaElitism; e++) {
        nextPop.push(this.cloneSolution(population[indices[e]]));
      }

      while (nextPop.length < this.gaPopulationSize) {
        const pa = this.tournamentSelection(population, fitness);
        const pb = this.tournamentSelection(population, fitness);
        let child;
        if (Math.random() < this.gaCrossoverRate) {
          child = this.crossover(pa, pb, employees, constraints, affluences);
        } else {
          child = this.cloneSolution(Math.random() < 0.5 ? pa : pb);
        }
        child = this.mutate(child, employees, constraints, affluences);
        nextPop.push(child);
      }

      population.length = 0;
      population.push(...nextPop);

      fitness = population.map((ind) => {
        fitnessEvaluations++;
        return this.evaluateSolution(ind, employees, slotHours);
      });

      bestIdx = argmin(fitness);
      if (fitness[bestIdx] < bestEverScore) {
        bestEverScore = fitness[bestIdx];
        bestEver = this.cloneSolution(population[bestIdx]);
        console.log(`🧬 Gen ${gen + 1}/${this.gaMaxGenerations} — meilleur score: ${bestEverScore.toFixed(2)}`);
      }

      generationsRun = gen + 1;
      if (bestEverScore === 0) {
        console.log('🎯 Score optimal (0) atteint');
        break;
      }
    }

    const finalSolution = this.buildFinalSolution(bestEver, employees, slotHours);
    const validation = this.validateSolution(finalSolution, employees, slotHours);

    const bestScoringDetail = this.evaluateSolutionDetailed(bestEver, employees, slotHours);

    const ranked = population
      .map((ind, i) => ({ ind, score: fitness[i] }))
      .sort((a, b) => a.score - b.score);
    const seenKeys = new Set();
    const topUnique = [];
    for (const row of ranked) {
      const key = JSON.stringify(row.ind);
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
      topUnique.push(row);
      if (topUnique.length >= 3) break;
    }

    const alternatives = topUnique.slice(1).map((row, i) => {
      const detail = this.evaluateSolutionDetailed(row.ind, employees, slotHours);
      return {
        rank: i + 2,
        score: row.score,
        planning: this.buildFinalSolution(row.ind, employees, slotHours),
        scoringDetail: {
          total: detail.total,
          breakdown: detail.breakdown,
          labels: detail.labels,
          volumeDetails: detail.volumeDetails
        }
      };
    });

    const scoringSummary = {
      bestScore: bestEverScore,
      fitnessEvaluations,
      note: 'Total = somme des pénalités listées dans breakdown (minimiser).',
      best: {
        total: bestScoringDetail.total,
        breakdown: bestScoringDetail.breakdown,
        labels: bestScoringDetail.labels,
        volumeDetails: bestScoringDetail.volumeDetails
      }
    };

    console.log(`✅ AG terminé en ${Date.now() - startTime}ms — score ${bestEverScore.toFixed(2)}, ${generationsRun} gén.`);

    return {
      success: true,
      planning: finalSolution,
      validation,
      diagnostic,
      suggestions,
      alternatives,
      scoringDetail: {
        total: bestScoringDetail.total,
        breakdown: bestScoringDetail.breakdown,
        labels: bestScoringDetail.labels,
        volumeDetails: bestScoringDetail.volumeDetails
      },
      solverInfo: {
        status: 'FEASIBLE',
        algorithm: 'genetic',
        solveTime: Date.now() - startTime,
        objective: bestEverScore,
        generationsRun,
        populationSize: this.gaPopulationSize,
        elitism: this.gaElitism,
        crossoverRate: this.gaCrossoverRate,
        mutationRate: this.gaMutationRate,
        fitnessEvaluations,
        usesEmployeePlanningFields: true,
        topScores: topUnique.map((t, idx) => ({ rank: idx + 1, score: t.score })),
        scoringSummary
      }
    };
  }

  generateCandidateSolution(employees, constraints, affluences, slotHours) {
    const solution = {};
    const days = 7;

    for (const emp of employees) {
      const empId = emp._id.toString();
      solution[empId] = {};
      const category = inferEmployeeCategoryForSolver(emp);

      if (category === 'boulanger' || category === 'preparation') {
        for (let day = 0; day < days; day++) {
          solution[empId][day] = 'Repos';
        }
        continue;
      }

      for (let day = 0; day < days; day++) {
        if (constraints[empId] && constraints[empId][day] !== undefined) {
          const constraintValue = constraints[empId][day];
          if (['CP', 'MAL', 'Formation', 'Indisponible', 'Repos'].includes(constraintValue)) {
            solution[empId][day] = constraintValue;
            continue;
          }
        }

        const dayName = SOLVER_DAY_NAMES[day];
        const ct = getContractTypeForSolver(emp);
        if (ct === 'Apprentissage' && emp.trainingDays && emp.trainingDays.includes(dayName)) {
          if (emp.trainingDaysOutsideShop !== false) {
            solution[empId][day] = 'Formation';
            continue;
          }
        }

        solution[empId][day] = this.pickRandomLegalSlot(emp, day, affluences);
      }
    }

    return solution;
  }

  buildFinalSolution(solution, employees, slotHours) {
    const finalSolution = {};

    for (const emp of employees) {
      const empId = emp._id.toString();
      finalSolution[empId] = {};

      for (let day = 0; day < 7; day++) {
        const slot = solution[empId][day];
        const hours = this.getEffectiveHoursForSlot(slot, emp, slotHours);
        finalSolution[empId][day] = {
          slot: slot,
          hours,
          rawSlotHours: slotHours[slot] || 0,
          breakMinutes:
            emp.dailyBreakMinutes != null
              ? emp.dailyBreakMinutes
              : planningBusinessRules.DEFAULT_DAILY_BREAK_MINUTES,
          type: this.getSlotType(slot)
        };
      }
    }

    return finalSolution;
  }

  getSlotType(slot) {
    if (slot === 'Repos') return 'Repos';
    if (slot === 'Formation') return 'Formation';
    if (slot === 'CP') return 'CP';
    if (slot === 'MAL') return 'MAL';
    if (slot === 'Indisponible') return 'Indisponible';
    if (slot.includes('06h00') || slot.includes('07h30')) return 'Ouverture';
    if (slot.includes('20h30') || slot.includes('16h30')) return 'Fermeture';
    return 'Standard';
  }

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

      const cat = inferEmployeeCategoryForSolver(emp);
      if (cat === 'vente') {
        const volumeDiff = Math.abs(empTotalHours - emp.weeklyHours);
        if (volumeDiff > 1.0) {
          validation.warnings.push(
            `${emp.name}: ${empTotalHours.toFixed(2)}h effectives (pause déduite) au lieu de ${emp.weeklyHours}h (écart ${volumeDiff.toFixed(1)}h)`
          );
        }
      }

      if (emp.age < 18) {
        if (empRestDays < 2) {
          validation.warnings.push(
            `${emp.name} (mineur): ${empRestDays} jour(s) de repos — viser 2 jours dont le dimanche`
          );
        }
      } else if (cat === 'vente' && empRestDays < 1) {
        validation.warnings.push(
          `${emp.name}: aucun jour de repos sur la semaine (minimum 1 pour les majeurs en vente)`
        );
      }

      if (cat === 'vente' && emp.weeklyHours >= 35 && empRestDays < 2 && emp.age >= 18) {
        validation.warnings.push(
          `${emp.name}: ${empRestDays} jour(s) de repos (souvent 2 recommandés pour un contrat à temps plein)`
        );
      }
    }

    const dayNames = SOLVER_DAY_NAMES;
    const restInfo = {};
    dayNames.forEach((day, index) => {
      restInfo[day] = restDistribution[index];
    });

    validation.stats = {
      totalHours: totalWeekHours,
      restDistribution: restInfo,
      employeeCategories: employees.map((e) => ({
        name: e.name,
        category: inferEmployeeCategoryForSolver(e)
      }))
    };

    return validation;
  }
}

const planningSolver = new PlanningBoulangerieSolver();

module.exports = {
  PlanningBoulangerieSolver,
  planningSolver,
  inferEmployeeCategoryForSolver,
  getContractTypeForSolver,
  SOLVER_DAY_NAMES,
  SCORE_LABELS
};
