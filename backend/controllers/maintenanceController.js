const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const path = require('path');
const fs = require('fs');

// Contrôleur pour les vérifications de maintenance
const maintenanceController = {
  // Vérifier les vulnérabilités de sécurité
  async checkSecurityUpdates(req, res) {
    try {
      const backendDir = path.join(__dirname, '..');
      const frontendDir = path.join(backendDir, '..', 'frontend');

      const results = {
        backend: {
          vulnerabilities: [],
          outdated: [],
          errors: []
        },
        frontend: {
          vulnerabilities: [],
          outdated: [],
          errors: []
        },
        timestamp: new Date().toISOString()
      };

      // Vérifier si npm est disponible
      try {
        await execPromise('npm --version', { timeout: 5000 });
      } catch (err) {
        return res.json({
          success: false,
          message: 'npm n\'est pas disponible sur ce serveur. Cette vérification fonctionne uniquement en environnement de développement local avec npm install.',
          data: {
            error: 'npm non disponible',
            timestamp: new Date().toISOString()
          }
        });
      }

      // Vérifier si le package.json existe
      const backendPackageJson = path.join(backendDir, 'package.json');
      if (!fs.existsSync(backendPackageJson)) {
        results.backend.errors.push('package.json non trouvé dans le backend');
      } else {
        // Vérifier le backend
        try {
          // npm audit pour les vulnérabilités
          try {
            const { stdout: auditBackend } = await execPromise('npm audit --json', {
              cwd: backendDir,
              timeout: 30000,
              maxBuffer: 1024 * 1024 * 10 // 10MB buffer
            });
            
            const auditDataBackend = JSON.parse(auditBackend);
            if (auditDataBackend.vulnerabilities) {
              const vulns = Object.values(auditDataBackend.vulnerabilities);
              results.backend.vulnerabilities = vulns.filter(v => 
                v.severity === 'critical' || v.severity === 'high'
              ).map(v => ({
                name: v.name,
                severity: v.severity,
                title: v.title,
                dependency: v.via?.[0]?.name || v.name
              }));
            }
          } catch (auditErr) {
            // npm audit peut retourner un exit code non-zéro même avec des résultats
            if (auditErr.stdout) {
              try {
                const auditDataBackend = JSON.parse(auditErr.stdout);
                if (auditDataBackend.vulnerabilities) {
                  const vulns = Object.values(auditDataBackend.vulnerabilities);
                  results.backend.vulnerabilities = vulns.filter(v => 
                    v.severity === 'critical' || v.severity === 'high'
                  ).map(v => ({
                    name: v.name,
                    severity: v.severity,
                    title: v.title,
                    dependency: v.via?.[0]?.name || v.name
                  }));
                }
              } catch (parseErr) {
                results.backend.errors.push('Erreur parsing npm audit backend');
              }
            } else {
              results.backend.errors.push(`npm audit échoué: ${auditErr.message}`);
            }
          }

          // npm outdated pour les mises à jour disponibles
          try {
            const { stdout: outdatedBackend } = await execPromise('npm outdated --json', {
              cwd: backendDir,
              timeout: 30000,
              maxBuffer: 1024 * 1024 * 10
            });
            const outdatedDataBackend = JSON.parse(outdatedBackend);
            results.backend.outdated = Object.entries(outdatedDataBackend).map(([name, data]) => ({
              name,
              current: data.current,
              wanted: data.wanted,
              latest: data.latest,
              location: data.location
            }));
          } catch (err) {
            // npm outdated retourne exit code 1 s'il y a des packages obsolètes
            if (err.stdout) {
              try {
                const outdatedDataBackend = JSON.parse(err.stdout);
                results.backend.outdated = Object.entries(outdatedDataBackend).map(([name, data]) => ({
                  name,
                  current: data.current,
                  wanted: data.wanted,
                  latest: data.latest,
                  location: data.location
                }));
              } catch (parseErr) {
                // Pas d'erreur si pas de packages obsolètes
              }
            }
          }
        } catch (err) {
          results.backend.errors.push(err.message);
        }
      }

      // Vérifier le frontend
      const frontendPackageJson = path.join(frontendDir, 'package.json');
      if (fs.existsSync(frontendPackageJson)) {
        try {
          // npm audit pour les vulnérabilités
          try {
            const { stdout: auditFrontend } = await execPromise('npm audit --json', {
              cwd: frontendDir,
              timeout: 30000,
              maxBuffer: 1024 * 1024 * 10
            });
            
            const auditDataFrontend = JSON.parse(auditFrontend);
            if (auditDataFrontend.vulnerabilities) {
              const vulns = Object.values(auditDataFrontend.vulnerabilities);
              results.frontend.vulnerabilities = vulns.filter(v => 
                v.severity === 'critical' || v.severity === 'high'
              ).map(v => ({
                name: v.name,
                severity: v.severity,
                title: v.title,
                dependency: v.via?.[0]?.name || v.name
              }));
            }
          } catch (auditErr) {
            // npm audit peut retourner un exit code non-zéro même avec des résultats
            if (auditErr.stdout) {
              try {
                const auditDataFrontend = JSON.parse(auditErr.stdout);
                if (auditDataFrontend.vulnerabilities) {
                  const vulns = Object.values(auditDataFrontend.vulnerabilities);
                  results.frontend.vulnerabilities = vulns.filter(v => 
                    v.severity === 'critical' || v.severity === 'high'
                  ).map(v => ({
                    name: v.name,
                    severity: v.severity,
                    title: v.title,
                    dependency: v.via?.[0]?.name || v.name
                  }));
                }
              } catch (parseErr) {
                results.frontend.errors.push('Erreur parsing npm audit frontend');
              }
            } else {
              results.frontend.errors.push(`npm audit échoué: ${auditErr.message}`);
            }
          }

          // npm outdated pour les mises à jour disponibles
          try {
            const { stdout: outdatedFrontend } = await execPromise('npm outdated --json', {
              cwd: frontendDir,
              timeout: 30000,
              maxBuffer: 1024 * 1024 * 10
            });
            const outdatedDataFrontend = JSON.parse(outdatedFrontend);
            results.frontend.outdated = Object.entries(outdatedDataFrontend).map(([name, data]) => ({
              name,
              current: data.current,
              wanted: data.wanted,
              latest: data.latest,
              location: data.location
            }));
          } catch (err) {
            // npm outdated retourne exit code 1 s'il y a des packages obsolètes
            if (err.stdout) {
              try {
                const outdatedDataFrontend = JSON.parse(err.stdout);
                results.frontend.outdated = Object.entries(outdatedDataFrontend).map(([name, data]) => ({
                  name,
                  current: data.current,
                  wanted: data.wanted,
                  latest: data.latest,
                  location: data.location
                }));
              } catch (parseErr) {
                // Pas d'erreur si pas de packages obsolètes
              }
            }
          }
        } catch (err) {
          results.frontend.errors.push(err.message);
        }
      } else {
        results.frontend.errors.push('package.json frontend non trouvé');
      }

      // Calculer un score de sécurité global
      const criticalBackend = results.backend.vulnerabilities.filter(v => v.severity === 'critical').length;
      const highBackend = results.backend.vulnerabilities.filter(v => v.severity === 'high').length;
      const criticalFrontend = results.frontend.vulnerabilities.filter(v => v.severity === 'critical').length;
      const highFrontend = results.frontend.vulnerabilities.filter(v => v.severity === 'high').length;

      const totalCritical = criticalBackend + criticalFrontend;
      const totalHigh = highBackend + highFrontend;

      results.summary = {
        totalCriticalVulnerabilities: totalCritical,
        totalHighVulnerabilities: totalHigh,
        totalOutdatedPackages: results.backend.outdated.length + results.frontend.outdated.length,
        status: totalCritical > 0 ? 'critical' : totalHigh > 0 ? 'warning' : 'ok',
        requiresAction: totalCritical > 0 || totalHigh > 5 || results.backend.outdated.length + results.frontend.outdated.length > 10
      };

      res.json({ success: true, data: results });
    } catch (error) {
      console.error('❌ Erreur vérification mises à jour:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la vérification des mises à jour',
        error: error.message 
      });
    }
  },

  // Obtenir les informations système
  async getSystemInfo(req, res) {
    try {
      const os = require('os');
      const packageJsonBackend = require('../package.json');
      
      let packageJsonFrontend = null;
      try {
        packageJsonFrontend = require('../../frontend/package.json');
      } catch (err) {
        // Frontend non disponible
      }

      const systemInfo = {
        nodeVersion: process.version,
        platform: os.platform(),
        arch: os.arch(),
        backend: {
          name: packageJsonBackend.name,
          version: packageJsonBackend.version,
          dependencies: Object.keys(packageJsonBackend.dependencies || {}).length,
          devDependencies: Object.keys(packageJsonBackend.devDependencies || {}).length
        },
        frontend: packageJsonFrontend ? {
          name: packageJsonFrontend.name,
          version: packageJsonFrontend.version,
          dependencies: Object.keys(packageJsonFrontend.dependencies || {}).length,
          devDependencies: Object.keys(packageJsonFrontend.devDependencies || {}).length
        } : null,
        timestamp: new Date().toISOString()
      };

      res.json({ success: true, data: systemInfo });
    } catch (error) {
      console.error('❌ Erreur récupération infos système:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la récupération des informations système',
        error: error.message 
      });
    }
  }
};

module.exports = maintenanceController;

