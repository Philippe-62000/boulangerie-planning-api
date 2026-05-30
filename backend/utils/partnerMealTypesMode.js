const MODES = new Set(['both', 'breakfast', 'lunch']);

function normalizeMealTypesMode(value) {
  const s = String(value || 'both').toLowerCase();
  return MODES.has(s) ? s : 'both';
}

function allowedMealTypesFromMode(mode) {
  const m = normalizeMealTypesMode(mode);
  if (m === 'breakfast') return ['breakfast'];
  if (m === 'lunch') return ['lunch'];
  return ['breakfast', 'lunch'];
}

function mealTypesModeLabel(mode) {
  const m = normalizeMealTypesMode(mode);
  if (m === 'breakfast') return 'Petit déjeuner uniquement';
  if (m === 'lunch') return 'Déjeuner uniquement';
  return 'Petit déjeuner et déjeuner';
}

module.exports = {
  normalizeMealTypesMode,
  allowedMealTypesFromMode,
  mealTypesModeLabel
};
