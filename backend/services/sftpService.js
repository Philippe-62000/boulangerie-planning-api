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
    
    this.basePath = '/volume1/sick-leaves';
    this.isConnected = false;
  }

  // Connexion au NAS
  async connect() {
    try {
      if (this.isConnected) {
        return true;
      }

      console.log('🔌 Connexion au NAS Synology...');
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

  // Créer la structure de dossiers
  async ensureDirectoryStructure() {
    try {
      await this.connect();
      
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const monthName = this.getMonthName(currentDate.getMonth());
      
      const paths = [
        this.basePath,
        `${this.basePath}/${year}`,
        `${this.basePath}/${year}/${month}-${monthName}`,
        `${this.basePath}/pending`,
        `${this.basePath}/validated`,
        `${this.basePath}/declared`
      ];

      console.log('🔍 Vérification de la structure de dossiers...');
      
      for (const dirPath of paths) {
        try {
          // Vérifier si le dossier existe
          await this.client.stat(dirPath);
          console.log(`✅ Dossier existe: ${dirPath}`);
        } catch (statError) {
          console.log(`⚠️ Dossier n'existe pas: ${dirPath}`);
          // Ne pas essayer de créer automatiquement, laisser l'utilisateur le faire
          console.log(`ℹ️ Veuillez créer manuellement le dossier: ${dirPath}`);
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
      
      // Déterminer le dossier de destination
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const monthName = this.getMonthName(currentDate.getMonth());
      
      const remotePath = `${this.basePath}/${year}/${month}-${monthName}/${fileName}`;
      
      console.log(`📤 Upload vers: ${remotePath}`);
      
      // Vérifier que le dossier de destination existe
      const targetDir = `${this.basePath}/${year}/${month}-${monthName}`;
      try {
        await this.client.stat(targetDir);
        console.log(`✅ Dossier de destination existe: ${targetDir}`);
      } catch (error) {
        console.log(`❌ Dossier de destination n'existe pas: ${targetDir}`);
        throw new Error(`Le dossier de destination n'existe pas: ${targetDir}. Veuillez le créer manuellement.`);
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

  // Déplacer un fichier (changement de statut)
  async moveFile(currentPath, newStatus) {
    try {
      await this.connect();
      
      const fileName = path.basename(currentPath);
      const newPath = `${this.basePath}/${newStatus}/${fileName}`;
      
      // Créer le dossier de destination si nécessaire
      await this.client.mkdir(`${this.basePath}/${newStatus}`, true);
      
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

  // Utilitaires
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
