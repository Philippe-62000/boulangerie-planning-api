const sharp = require('sharp');
const pdfParse = require('pdf-parse');

class ImageValidationService {
  constructor() {
    this.minQualityScore = 60; // Score minimum pour accepter une image
    this.minWidth = 800;
    this.minHeight = 600;
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
  }

  // Validation principale
  async validateFile(fileBuffer, fileName, fileType) {
    try {
      console.log(`🔍 Validation du fichier: ${fileName}`);
      
      const result = {
        isValid: false,
        isReadable: false,
        qualityScore: 0,
        message: '',
        details: {}
      };

      // Vérification de la taille
      if (fileBuffer.length > this.maxFileSize) {
        result.message = 'Fichier trop volumineux (max 10MB)';
        return result;
      }

      // Validation selon le type de fichier
      if (fileType.startsWith('image/')) {
        result.details = await this.validateImage(fileBuffer);
      } else if (fileType === 'application/pdf') {
        result.details = await this.validatePDF(fileBuffer);
      } else {
        result.message = 'Type de fichier non supporté';
        return result;
      }

      // Calcul du score global
      result.qualityScore = this.calculateQualityScore(result.details);
      result.isReadable = result.qualityScore >= this.minQualityScore;
      result.isValid = result.isReadable;

      if (!result.isValid) {
        result.message = this.generateValidationMessage(result.details);
      } else {
        result.message = 'Fichier validé avec succès';
      }

      console.log(`✅ Validation terminée - Score: ${result.qualityScore}/100`);
      return result;

    } catch (error) {
      console.error('❌ Erreur validation fichier:', error.message);
      return {
        isValid: false,
        isReadable: false,
        qualityScore: 0,
        message: 'Erreur lors de la validation du fichier',
        details: { error: error.message }
      };
    }
  }

  // Validation d'une image
  async validateImage(buffer) {
    try {
      const metadata = await sharp(buffer).metadata();
      
      const details = {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: buffer.length,
        hasAlpha: metadata.hasAlpha,
        density: metadata.density,
        channels: metadata.channels
      };

      // Vérifications de qualité
      const checks = {
        hasMinimumSize: details.width >= this.minWidth && details.height >= this.minHeight,
        hasGoodAspectRatio: this.checkAspectRatio(details.width, details.height),
        hasGoodResolution: details.density && details.density >= 150,
        isNotTooSmall: details.width >= 600 && details.height >= 400,
        isNotTooLarge: details.width <= 4000 && details.height <= 4000,
        hasGoodFormat: ['jpeg', 'jpg', 'png'].includes(details.format),
        hasReasonableSize: details.size >= 50000 && details.size <= this.maxFileSize
      };

      details.checks = checks;
      return details;

    } catch (error) {
      console.error('❌ Erreur validation image:', error.message);
      return {
        error: error.message,
        checks: {
          hasMinimumSize: false,
          hasGoodAspectRatio: false,
          hasGoodResolution: false,
          isNotTooSmall: false,
          isNotTooLarge: false,
          hasGoodFormat: false,
          hasReasonableSize: false
        }
      };
    }
  }

  // Validation d'un PDF
  async validatePDF(buffer) {
    try {
      const data = await pdfParse(buffer);
      
      const details = {
        pages: data.numpages,
        size: buffer.length,
        hasText: data.text && data.text.trim().length > 0,
        textLength: data.text ? data.text.trim().length : 0,
        info: data.info || {}
      };

      // Vérifications de qualité
      const checks = {
        hasContent: details.pages > 0,
        hasText: details.hasText,
        hasReasonableSize: details.size >= 10000 && details.size <= this.maxFileSize,
        isNotTooManyPages: details.pages <= 10,
        hasMinimumText: details.textLength >= 50
      };

      details.checks = checks;
      return details;

    } catch (error) {
      console.error('❌ Erreur validation PDF:', error.message);
      return {
        error: error.message,
        checks: {
          hasContent: false,
          hasText: false,
          hasReasonableSize: false,
          isNotTooManyPages: false,
          hasMinimumText: false
        }
      };
    }
  }

  // Vérification du ratio d'aspect
  checkAspectRatio(width, height) {
    const ratio = width / height;
    // Ratio acceptable entre 0.5 et 2.0 (portrait ou paysage)
    return ratio >= 0.5 && ratio <= 2.0;
  }

  // Calcul du score de qualité
  calculateQualityScore(details) {
    if (details.error) {
      return 0;
    }

    let score = 0;
    const checks = details.checks;

    if (details.width && details.height) {
      // Score pour les images
      if (checks.hasMinimumSize) score += 25;
      if (checks.hasGoodAspectRatio) score += 15;
      if (checks.hasGoodResolution) score += 15;
      if (checks.isNotTooSmall) score += 10;
      if (checks.isNotTooLarge) score += 10;
      if (checks.hasGoodFormat) score += 15;
      if (checks.hasReasonableSize) score += 10;
    } else if (details.pages) {
      // Score pour les PDF
      if (checks.hasContent) score += 20;
      if (checks.hasText) score += 25;
      if (checks.hasReasonableSize) score += 15;
      if (checks.isNotTooManyPages) score += 15;
      if (checks.hasMinimumText) score += 25;
    }

    return Math.min(score, 100);
  }

  // Génération du message de validation
  generateValidationMessage(details) {
    const issues = [];

    if (details.error) {
      return `Erreur de lecture: ${details.error}`;
    }

    const checks = details.checks;

    if (details.width && details.height) {
      // Messages pour les images
      if (!checks.hasMinimumSize) {
        issues.push(`Résolution trop faible (${details.width}x${details.height}, minimum 800x600)`);
      }
      if (!checks.hasGoodAspectRatio) {
        issues.push('Format d\'image non standard');
      }
      if (!checks.hasGoodResolution) {
        issues.push('Résolution insuffisante (minimum 150 DPI)');
      }
      if (!checks.isNotTooSmall) {
        issues.push('Image trop petite');
      }
      if (!checks.isNotTooLarge) {
        issues.push('Image trop grande');
      }
      if (!checks.hasGoodFormat) {
        issues.push('Format non supporté');
      }
      if (!checks.hasReasonableSize) {
        issues.push('Taille de fichier inappropriée');
      }
    } else if (details.pages) {
      // Messages pour les PDF
      if (!checks.hasContent) {
        issues.push('PDF vide ou corrompu');
      }
      if (!checks.hasText) {
        issues.push('PDF sans texte lisible');
      }
      if (!checks.hasReasonableSize) {
        issues.push('Taille de fichier inappropriée');
      }
      if (!checks.isNotTooManyPages) {
        issues.push('Trop de pages (maximum 10)');
      }
      if (!checks.hasMinimumText) {
        issues.push('Texte insuffisant pour validation');
      }
    }

    if (issues.length === 0) {
      return 'Fichier validé avec succès';
    }

    return `Problèmes détectés: ${issues.join(', ')}`;
  }

  // Optimisation d'image (optionnel)
  async optimizeImage(buffer, maxWidth = 1920, quality = 85) {
    try {
      const optimized = await sharp(buffer)
        .resize(maxWidth, null, { 
          withoutEnlargement: true,
          fit: 'inside'
        })
        .jpeg({ quality })
        .toBuffer();

      return optimized;
    } catch (error) {
      console.error('❌ Erreur optimisation image:', error.message);
      return buffer; // Retourner l'original en cas d'erreur
    }
  }

  // Extraction de texte d'un PDF (pour recherche)
  async extractTextFromPDF(buffer) {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      console.error('❌ Erreur extraction texte PDF:', error.message);
      return '';
    }
  }
}

module.exports = new ImageValidationService();
