const SftpClient = require('ssh2-sftp-client');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

class SFTPService {
  constructor() {
    this._client = null;
    this.config = {
      host: 'philange.synology.me',
      username: 'nHEIGHTn',
      password: process.env.SFTP_PASSWORD,
      port: 22,
      readyTimeout: 20000,
      retries: 3,
      retry_minTimeout: 2000
    };
    
    // Base path configurable via variable d'environnement
    // Par défaut: /n8n/uploads/documents (pour Arras)
    // Pour Longuenesse: /n8n/uploads/documents-longuenesse
    this.basePath = process.env.SFTP_BASE_PATH || '/n8n/uploads/documents';
    this.isConnected = false;
    this.isConnecting = false; // Verrou pour éviter les connexions concurrentes
    this.connectionPromise = null; // Promise partagée pour les connexions concurrentes
  }

  // Réinitialiser le client en cas d'erreur
  _resetClient() {
    try {
      if (this._client) {
        // Supprimer tous les listeners pour éviter les fuites mémoire
        this._client.removeAllListeners();
        // Tenter de fermer proprement
        if (this._client.sftp) {
          this._client.sftp.end();
        }
      }
    } catch (error) {
      // Ignorer les erreurs lors de la réinitialisation
    }
    this._client = new SftpClient();
    // Augmenter la limite de listeners pour éviter les warnings
    if (this._client.client) {
      this._client.client.setMaxListeners(20);
    }
    this.isConnected = false;
  }

  // Vérifier si la connexion est vraiment active
  async _checkConnection() {
    try {
      if (!this._client || !this.isConnected) {
        return false;
      }
      // Tenter une opération simple pour vérifier la connexion
      await this._client.list('/');
      return true;
    } catch (error) {
      return false;
    }
  }

  // Connexion au NAS avec verrouillage pour éviter les connexions concurrentes
  async connect() {
    // Si une connexion est en cours, attendre qu'elle se termine
    if (this.isConnecting && this.connectionPromise) {
      try {
        await this.connectionPromise;
        // Vérifier si la connexion a réussi
        if (this.isConnected && await this._checkConnection()) {
          return true;
        }
      } catch (error) {
        // La connexion précédente a échoué, continuer pour créer une nouvelle
      }
    }

    // Si déjà connecté et la connexion est valide, retourner
    if (this.isConnected) {
      const isValid = await this._checkConnection();
      if (isValid) {
        return true;
      } else {
        // La connexion n'est plus valide, réinitialiser
        this._resetClient();
      }
    }

    // Créer une nouvelle connexion avec verrouillage
    this.isConnecting = true;
    this.connectionPromise = this._doConnect();

    try {
      const result = await this.connectionPromise;
      return result;
    } finally {
      this.isConnecting = false;
      this.connectionPromise = null;
    }
  }

  // Effectuer la connexion réelle
  async _doConnect() {
    try {
      // Réinitialiser le client si nécessaire
      if (!this._client) {
        this._resetClient();
      }

      console.log('🔌 Connexion au NAS Synology...');
      
      // Augmenter le timeout pour les connexions lentes
      const connectConfig = {
        ...this.config,
        readyTimeout: 30000, // 30 secondes
        keepaliveInterval: 10000, // Keepalive toutes les 10 secondes
        keepaliveCountMax: 3
      };

      await this._client.connect(connectConfig);
      this.isConnected = true;
      console.log('✅ Connecté au NAS Synology');
      return true;
    } catch (error) {
      console.error('❌ Erreur de connexion SFTP:', error.message);
      this.isConnected = false;
      // Réinitialiser le client en cas d'erreur
      this._resetClient();
      throw error;
    }
  }

  // Déconnexion
  async disconnect() {
    try {
      if (this.isConnected && this._client) {
        await this._client.end();
        this.isConnected = false;
        console.log('🔌 Déconnecté du NAS Synology');
      }
    } catch (error) {
      console.error('❌ Erreur de déconnexion SFTP:', error.message);
      // Réinitialiser même en cas d'erreur
      this._resetClient();
    } finally {
      this.isConnecting = false;
      this.connectionPromise = null;
    }
  }

  // Méthodes wrapper pour les opérations nécessitant l'accès au client
  async stat(path) {
    await this.connect();
    if (!this._client) {
      throw new Error('Client SFTP non initialisé');
    }
    return await this._client.stat(path);
  }

  async mkdir(path, recursive = false) {
    await this.connect();
    if (!this._client) {
      throw new Error('Client SFTP non initialisé');
    }
    return await this._client.mkdir(path, recursive);
  }

  async put(localPath, remotePath) {
    await this.connect();
    if (!this._client) {
      throw new Error('Client SFTP non initialisé');
    }
    return await this._client.put(localPath, remotePath);
  }

  // Getter pour le client (pour compatibilité avec le code existant)
  get client() {
    return this._client;
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
          await this._client.stat(dirPath);
          console.log(`✅ Dossier existe: ${dirPath}`);
        } catch (statError) {
          console.log(`⚠️ Dossier n'existe pas: ${dirPath}`);
          try {
            // Créer le dossier automatiquement
            await this._client.mkdir(dirPath, true);
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
        await this._client.stat(baseDir);
        console.log(`✅ Dossier racine existe: ${baseDir}`);
      } catch (error) {
        console.log(`⚠️ Dossier racine n'existe pas: ${baseDir}`);
        try {
          await this._client.mkdir(baseDir, true);
          console.log(`✅ Dossier racine créé: ${baseDir}`);
        } catch (mkdirError) {
          console.log(`❌ Impossible de créer le dossier racine: ${baseDir}`);
          throw new Error(`Impossible de créer le dossier racine: ${baseDir}. Vérifiez les permissions SFTP.`);
        }
      }
      
      // Créer le dossier année si nécessaire
      try {
        await this._client.stat(yearDir);
        console.log(`✅ Dossier année existe: ${yearDir}`);
      } catch (error) {
        console.log(`⚠️ Dossier année n'existe pas: ${yearDir}`);
        try {
          await this._client.mkdir(yearDir, true);
          console.log(`✅ Dossier année créé: ${yearDir}`);
        } catch (mkdirError) {
          console.log(`❌ Impossible de créer le dossier année: ${yearDir}`);
          throw new Error(`Impossible de créer le dossier année: ${yearDir}. Vérifiez les permissions SFTP.`);
        }
      }
      
      // Créer le dossier pending si nécessaire
      try {
        await this._client.stat(pendingDir);
        console.log(`✅ Dossier pending existe: ${pendingDir}`);
      } catch (error) {
        console.log(`⚠️ Dossier pending n'existe pas: ${pendingDir}`);
        try {
          await this._client.mkdir(pendingDir, true);
          console.log(`✅ Dossier pending créé: ${pendingDir}`);
        } catch (mkdirError) {
          console.log(`❌ Impossible de créer le dossier pending: ${pendingDir}`);
          throw new Error(`Impossible de créer le dossier pending: ${pendingDir}. Vérifiez les permissions SFTP.`);
        }
      }
      
      // Upload du fichier
      await this._client.put(fileBuffer, remotePath);
      
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
      await this._client.delete(filePath);
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
      const files = await this._client.list(folderPath);
      return files.filter(file => file.type === '-'); // Fichiers seulement
    } catch (error) {
      console.error('❌ Erreur listage fichiers:', error.message);
      throw error;
    }
  }

  /**
   * Liste récursivement tous les fichiers dans personal/ (y compris personal/2024/, personal/2025/, etc.)
   * Retourne les chemins relatifs au basePath (ex: personal/fiche.pdf, personal/2024/fiche.pdf)
   */
  async listAllPersonalFiles(basePath) {
    try {
      await this.connect();
      const personalPath = `${basePath}/personal`;
      const allFiles = [];

      try {
        const items = await this._client.list(personalPath);
        for (const item of items) {
          const itemPath = `personal/${item.name}`;
          if (item.type === '-') {
            allFiles.push(itemPath);
          } else if (item.type === 'd' && /^\d{4}$/.test(item.name)) {
            // Sous-dossier année (2024, 2025, etc.)
            const yearFiles = await this._client.list(`${personalPath}/${item.name}`);
            for (const f of yearFiles) {
              if (f.type === '-') {
                allFiles.push(`personal/${item.name}/${f.name}`);
              }
            }
          }
        }
      } catch (err) {
        if (err.message && err.message.includes('No such file')) {
          return [];
        }
        throw err;
      }

      return allFiles;
    } catch (error) {
      console.error('❌ Erreur listage fichiers personnels:', error.message);
      throw error;
    }
  }

  // Vérifier si un fichier existe
  async fileExists(filePath) {
    try {
      await this.connect();
      
      // Vérifier que la connexion est vraiment active
      if (!this.isConnected || !this._client) {
        return false;
      }

      const stats = await this._client.stat(filePath);
      return stats !== null;
    } catch (error) {
      // Si c'est une erreur de connexion, réinitialiser
      if (error.message.includes('Not connected') || error.message.includes('Timed out')) {
        this._resetClient();
      }
      return false;
    }
  }

  // Obtenir les statistiques d'un fichier
  async getFileStats(filePath) {
    try {
      await this.connect();
      const stats = await this._client.stat(filePath);
      return stats;
    } catch (error) {
      console.error('❌ Erreur stats fichier:', error.message);
      throw error;
    }
  }

  /**
   * Upload un buffer vers un chemin NAS personnalisé (ex: factures péage)
   * Crée les dossiers parents si nécessaire
   */
  async putBuffer(buffer, remotePath) {
    try {
      await this.connect();
      const pathParts = remotePath.split('/').filter(Boolean);
      let currentPath = '';
      for (let i = 0; i < pathParts.length - 1; i++) {
        currentPath += '/' + pathParts[i];
        try {
          await this._client.stat(currentPath);
        } catch {
          await this._client.mkdir(currentPath, true);
        }
      }
      await this._client.put(Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer), remotePath);
      return { remotePath };
    } catch (error) {
      console.error('❌ Erreur putBuffer:', error.message);
      throw error;
    }
  }

  // Télécharger un fichier (pour prévisualisation)
  async downloadFile(filePath) {
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        await this.connect();
        
        // Vérifier que la connexion est vraiment active
        if (!this.isConnected || !this._client) {
          throw new Error('Client SFTP non initialisé');
        }

        const buffer = await this._client.get(filePath);
        return buffer;
      } catch (error) {
        retryCount++;
        
        // Si c'est une erreur de connexion et qu'on peut réessayer
        if (retryCount <= maxRetries && (
          error.message.includes('Not connected') ||
          error.message.includes('Timed out') ||
          error.message.includes('handshake')
        )) {
          console.log(`⚠️ Tentative ${retryCount}/${maxRetries} de téléchargement échouée, réessai...`);
          // Réinitialiser le client et attendre un peu avant de réessayer
          this._resetClient();
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          continue;
        }
        
        console.error('❌ Erreur téléchargement fichier:', error.message);
        throw error;
      }
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
