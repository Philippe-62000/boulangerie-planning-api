/**
 * Supprime deploy-frontend-lon/static avant build:lon pour éviter d'empiler
 * d'anciens chunks hashés (FTP / tri par date confus).
 */
const fs = require('fs');
const path = require('path');

const staticDir = path.join(__dirname, '..', 'deploy-frontend-lon', 'static');
if (fs.existsSync(staticDir)) {
  fs.rmSync(staticDir, { recursive: true, force: true });
  console.log('[clean-deploy-lon-static] Supprimé:', staticDir);
}
