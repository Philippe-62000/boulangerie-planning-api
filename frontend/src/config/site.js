/**
 * Détection du site (Longuenesse vs Arras) avec fallback persistant.
 *
 * Contexte: certaines pages étaient filtrées via `window.location.pathname.startsWith('/lon')`.
 * Si l'app est servie sans le préfixe (/lon ou /plan) après un refresh, la détection échoue
 * et des menus/widgets "longuenesseOnly" disparaissent. On mémorise donc le dernier site explicite.
 */
const SITE_STORAGE_KEY = 'bp:lastSite'; // valeurs: 'lon' | 'plan'

const detectSiteFromPath = (pathname) => {
  if (typeof pathname !== 'string') return null;
  if (pathname === '/lon' || pathname.startsWith('/lon/')) return 'lon';
  if (pathname === '/plan' || pathname.startsWith('/plan/')) return 'plan';
  return null;
};

const readStoredSite = () => {
  try {
    const v = localStorage.getItem(SITE_STORAGE_KEY);
    return v === 'lon' || v === 'plan' ? v : null;
  } catch {
    return null;
  }
};

const writeStoredSite = (site) => {
  try {
    if (site === 'lon' || site === 'plan') localStorage.setItem(SITE_STORAGE_KEY, site);
  } catch {
    /* ignore */
  }
};

export const getSiteKey = () => {
  const fromPath = detectSiteFromPath(typeof window !== 'undefined' ? window.location.pathname : '');
  if (fromPath) {
    writeStoredSite(fromPath);
    return fromPath;
  }
  return readStoredSite() || 'plan';
};

export const isLonguenesseSite = () => getSiteKey() === 'lon';
export const isArrasSite = () => getSiteKey() === 'plan';

export const getSiteBasename = () => (getSiteKey() === 'lon' ? '/lon' : '/plan');

/** Ville enregistrée sur les demandes de congés (champ `city` en base). */
export const getVacationCity = () => (getSiteKey() === 'lon' ? 'Longuenesse' : 'Arras');

