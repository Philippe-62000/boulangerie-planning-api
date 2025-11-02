const SftpClient = require('ssh2-sftp-client');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

class SFTPService {
  constructor() {
    this.client = new SftpClient();
    this.config = {
      host: 'philange.synology.me',
      username: 'nHEIGHTn',
      password: process.env.SFTP_PASSWORD,
      port: 22,
      readyTimeout: 20000,
      retries: 3,
      retry_minTimeout: 2000
    };
    
    this.basePath = '/n8n/sick-leaves';
    this.isConnected = false;
  }

  // Connexion au NAS
  async connect() {
    try {
      if (this.isConnected) {
        return true;
      }

      console.log('🔌 Connexion au NAS Synology...');
      // Utiliser directement la config avec family: 4 pour forcer IPv4
      // La bibliothèque ssh2 gère elle-même la résolution DNS
      await this.client.connect(this.config);
      this.isConnected = true;
      console.log('✅ Connecté au NAS Synology');
      return true;
    } catch (error) {
      console.error('❌ Erreur de connexion SFTP:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  // Déconnexion
  async disconnect() {
    try {
      if (this.isConnected) {
        await this.client.end();
        this.isConnected = false;
        console.log('🔌 Déconnecté du NAS Synology');
      }
    } catch (error) {
      console.error('❌ Erreur de déconnexion SFTP:', error.message);
    }
  }

  // Créer la structure de dossiers (simplifiée)
  async ensureDirectoryStructure() {
    try {
      await this.connect();
      
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      
      const paths = [
        this.basePath,
        `${this.basePath}/${year}`
      ];

      console.log('🔍 Vérification et création de la structure de dossiers...');
      
      for (const dirPath of paths) {
        try {
          // Vérifier si le dossier existe
          await this.client.stat(dirPath);
          console.log(`✅ Dossier existe: ${dirPath}`);
        } catch (statError) {
          console.log(`⚠️ Dossier n'existe pas: ${dirPath}`);
          try {
            // Créer le dossier automatiquement
            await this.client.mkdir(dirPath, true);
            console.log(`✅ Dossier créé: ${dirPath}`);
          } catch (mkdirError) {
            console.log(`❌ Impossible de créer le dossier: ${dirPath}`);
            console.log(`ℹ️ Vérifiez les permissions SFTP pour: ${dirPath}`);
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ Erreur vérification structure dossiers:', error.message);
      throw error;
    }
  }

  // Upload d'un fichier
  async uploadFile(fileBuffer, originalFileName, employeeName) {
    try {
      await this.ensureDirectoryStructure();
      
      // Générer un nom de fichier unique
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const hash = crypto.createHash('md5').update(fileBuffer).digest('hex').substring(0, 8);
      const extension = path.extname(originalFileName);
      const fileName = `${timestamp}_${hash}_${employeeName.replace(/[^a-zA-Z0-9]/g, '_')}${extension}`;
      
      // Déterminer le dossier de destination avec statut "pending"
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      
      const remotePath = `${this.basePath}/${year}/pending/${fileName}`;
      
      console.log(`📤 Upload vers: ${remotePath}`);
      
      // Vérifier et créer les dossiers de destination si nécessaires
      const baseDir = this.basePath;
      const yearDir = `${this.basePath}/${year}`;
      const pendingDir = `${this.basePath}/${year}/pending`;
      
      // Créer le dossier racine si nécessaire
      try {
        await this.client.stat(baseDir);
        console.log(`✅ Dossier racine existe: ${baseDir}`);
      } catch (error) {
        console.log(`⚠️ Dossier racine n'existe pas: ${baseDir}`);
        try {
          await this.client.mkdir(baseDir, true);
          console.log(`✅ Dossier racine créé: ${baseDir}`);
        } catch (mkdirError) {
          console.log(`❌ Impossible de créer le dossier racine: ${baseDir}`);
          throw new Error(`Impossible de créer le dossier racine: ${baseDir}. Vérifiez les permissions SFTP.`);
        }
      }
      
      // Créer le dossier année si nécessaire
      try {
        await this.client.stat(yearDir);
        console.log(`✅ Dossier année existe: ${yearDir}`);
      } catch (error) {
        console.log(`⚠️ Dossier année n'existe pas: ${yearDir}`);
        try {
          await this.client.mkdir(yearDir, true);
          console.log(`✅ Dossier année créé: ${yearDir}`);
        } catch (mkdirError) {
          console.log(`❌ Impossible de créer le dossier année: ${yearDir}`);
          throw new Error(`Impossible de créer le dossier année: ${yearDir}. Vérifiez les permissions SFTP.`);
        }
      }
      
      // Créer le dossier pending si nécessaire
      try {
        await this.client.stat(pendingDir);
        console.log(`✅ Dossier pending existe: ${pendingDir}`);
      } catch (error) {
        console.log(`⚠️ Dossier pending n'existe pas: ${pendingDir}`);
        try {
          await this.client.mkdir(pendingDir, true);
          console.log(`✅ Dossier pending créé: ${pendingDir}`);
        } catch (mkdirError) {
          console.log(`❌ Impossible de créer le dossier pending: ${pendingDir}`);
          throw new Error(`Impossible de créer le dossier pending: ${pendingDir}. Vérifiez les permissions SFTP.`);
        }
      }
      
      // Upload du fichier
      await this.client.put(fileBuffer, remotePath);
      
      console.log(`✅ Fichier uploadé: ${fileName}`);
      
      return {
        fileName: fileName,
        remotePath: remotePath,
        size: fileBuffer.length
      };
      
    } catch (error) {
      console.error('❌ Erreur upload SFTP:', error.message);
      throw error;
    }
  }

  // Déplacer un fichier entre les statuts
  async moveFile(currentPath, newStatus) {
    try {
      await this.connect();
      
      // Extraire le nom du fichier du chemin actuel
      const fileName = path.basename(currentPath);
      const year = new Date().getFullYear();
      
      // Déterminer le nouveau chemin selon le statut
      let newPath;
      switch (newStatus) {
        case 'validated':
          newPath = `${this.basePath}/${year}/validated/${fileName}`;
          break;
        case 'declared':
          newPath = `${this.basePath}/${year}/declared/${fileName}`;
          break;
        case 'rejected':
          newPath = `${this.basePath}/${year}/rejected/${fileName}`;
          break;
        default:
          throw new Error(`Statut invalide: ${newStatus}`);
      }
      
      // Créer le dossier de destination si nécessaire
      const targetDir = path.dirname(newPath);
      try {
        await this.client.stat(targetDir);
        console.log(`✅ Dossier de destination existe: ${targetDir}`);
      } catch (error) {
        console.log(`⚠️ Dossier de destination n'existe pas: ${targetDir}`);
        try {
          await this.client.mkdir(targetDir, true);
          console.log(`✅ Dossier créé: ${targetDir}`);
        } catch (mkdirError) {
          console.log(`❌ Impossible de créer le dossier: ${targetDir}`);
          throw new Error(`Impossible de créer le dossier de destination: ${targetDir}. Vérifiez les permissions SFTP.`);
        }
      }
      
      // Déplacer le fichier
      await this.client.rename(currentPath, newPath);
      
      console.log(`📁 Fichier déplacé: ${currentPath} → ${newPath}`);
      
      return newPath;
      
    } catch (error) {
      console.error('❌ Erreur déplacement fichier:', error.message);
      throw error;
    }
  }

  // Supprimer un fichier
  async deleteFile(filePath) {
    try {
      await this.connect();
      await this.client.delete(filePath);
      console.log(`🗑️ Fichier supprimé: ${filePath}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur suppression fichier:', error.message);
      throw error;
    }
  }

  // Lister les fichiers d'un dossier
  async listFiles(folderPath) {
    try {
      await this.connect();
      const files = await this.client.list(folderPath);
      return files.filter(file => file.type === '-'); // Fichiers seulement
    } catch (error) {
      console.error('❌ Erreur listage fichiers:', error.message);
      throw error;
    }
  }

  // Vérifier si un fichier existe
  async fileExists(filePath) {
    try {
      await this.connect();
      const stats = await this.client.stat(filePath);
      return stats !== null;
    } catch (error) {
      return false;
    }
  }

  // Obtenir les statistiques d'un fichier
  async getFileStats(filePath) {
    try {
      await this.connect();
      const stats = await this.client.stat(filePath);
      return stats;
    } catch (error) {
      console.error('❌ Erreur stats fichier:', error.message);
      throw error;
    }
  }

  // Télécharger un fichier (pour prévisualisation)
  async downloadFile(filePath) {
    try {
      await this.connect();
      const buffer = await this.client.get(filePath);
      return buffer;
    } catch (error) {
      console.error('❌ Erreur téléchargement fichier:', error.message);
      throw error;
    }
  }

  // Utilitaires (simplifiés)
  getMonthName(monthIndex) {
    const months = [
      'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'
    ];
    return months[monthIndex];
  }

  // Nettoyer les anciens fichiers (maintenance)
  async cleanupOldFiles(daysOld = 90) {
    try {
      await this.connect();
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      // Logique de nettoyage à implémenter selon vos besoins
      console.log(`🧹 Nettoyage des fichiers plus anciens que ${daysOld} jours`);
      
    } catch (error) {
      console.error('❌ Erreur nettoyage:', error.message);
      throw error;
    }
  }
}

// Instance singleton
const sftpService = new SFTPService();

module.exports = sftpService;
