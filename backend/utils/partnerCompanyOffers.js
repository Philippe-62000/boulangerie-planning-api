const MODES = new Set(['both', 'breakfast', 'lunch', 'none']);

function normalizeMealTypesMode(value) {
  const s = String(value || 'both').toLowerCase();
  return MODES.has(s) ? s : 'both';
}

function offersFromMealTypesMode(mode) {
  const m = normalizeMealTypesMode(mode);
  if (m === 'breakfast') {
    return { offerBreakfast: true, offerLunch: false, offerDevis: false, offerCommande: false };
  }
  if (m === 'lunch') {
    return { offerBreakfast: false, offerLunch: true, offerDevis: false, offerCommande: false };
  }
  if (m === 'none') {
    return { offerBreakfast: false, offerLunch: false, offerDevis: false, offerCommande: false };
  }
  return { offerBreakfast: true, offerLunch: true, offerDevis: false, offerCommande: false };
}

function mealTypesModeFromOffers(offers) {
  const b = !!offers?.offerBreakfast;
  const l = !!offers?.offerLunch;
  if (b && l) return 'both';
  if (b) return 'breakfast';
  if (l) return 'lunch';
  return 'none';
}

function parseOffersInput(body = {}) {
  const hasExplicit =
    body.offerBreakfast !== undefined ||
    body.offerLunch !== undefined ||
    body.offerDevis !== undefined ||
    body.offerCommande !== undefined;

  if (hasExplicit) {
    return {
      offerBreakfast: !!body.offerBreakfast,
      offerLunch: !!body.offerLunch,
      offerDevis: !!body.offerDevis,
      offerCommande: !!body.offerCommande
    };
  }

  if (body.mealTypesMode !== undefined) {
    return offersFromMealTypesMode(body.mealTypesMode);
  }

  return offersFromMealTypesMode('both');
}

function resolveCompanyOffers(company) {
  if (!company) return offersFromMealTypesMode('both');
  const hasExplicit =
    company.offerBreakfast !== undefined ||
    company.offerLunch !== undefined ||
    company.offerDevis !== undefined ||
    company.offerCommande !== undefined;
  if (hasExplicit) {
    return {
      offerBreakfast: !!company.offerBreakfast,
      offerLunch: !!company.offerLunch,
      offerDevis: !!company.offerDevis,
      offerCommande: !!company.offerCommande
    };
  }
  return offersFromMealTypesMode(company.mealTypesMode);
}

function allowedMealTypesFromOffers(offers) {
  const out = [];
  if (offers?.offerBreakfast) out.push('breakfast');
  if (offers?.offerLunch) out.push('lunch');
  return out;
}

function companyOffersLabel(offers) {
  const parts = [];
  if (offers?.offerBreakfast) parts.push('Petit déjeuner');
  if (offers?.offerLunch) parts.push('Déjeuner');
  if (offers?.offerDevis) parts.push('Devis');
  if (offers?.offerCommande) parts.push('Commande');
  return parts.length ? parts.join(', ') : 'Aucune option';
}

function serializeCompanyOffers(company) {
  const offers = resolveCompanyOffers(company);
  return {
    ...offers,
    mealTypesMode: mealTypesModeFromOffers(offers),
    offersLabel: companyOffersLabel(offers)
  };
}

/** @deprecated use resolveCompanyOffers */
function allowedMealTypesFromMode(mode) {
  return allowedMealTypesFromOffers(offersFromMealTypesMode(mode));
}

/** @deprecated use companyOffersLabel */
function mealTypesModeLabel(mode) {
  return companyOffersLabel(offersFromMealTypesMode(mode));
}

module.exports = {
  normalizeMealTypesMode,
  offersFromMealTypesMode,
  mealTypesModeFromOffers,
  parseOffersInput,
  resolveCompanyOffers,
  allowedMealTypesFromOffers,
  companyOffersLabel,
  serializeCompanyOffers,
  allowedMealTypesFromMode,
  mealTypesModeLabel
};
