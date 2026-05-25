/** URL publique clients (Vercel ou domaine perso) — pas filmara.fr */
export const getCamarisPublicPageUrl = () => {
  const fromEnv = import.meta.env.VITE_CAMARIS_PUBLIC_URL;
  if (fromEnv && String(fromEnv).trim()) return String(fromEnv).trim().replace(/\/$/, '');
  return 'https://camaris-longuenesse.vercel.app';
};
