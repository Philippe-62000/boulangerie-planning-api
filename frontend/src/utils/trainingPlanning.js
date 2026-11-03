/** Planning type apprenti (CFA / Ajout planning) : apprentis + temporaires avec option Planning. */
export function canHaveTrainingPlanning(employee) {
  if (!employee) return false;
  if (employee.contractType === 'Apprentissage') return true;
  return employee.contractType === 'Temporaire' && employee.temporaryHasPlanning === true;
}
