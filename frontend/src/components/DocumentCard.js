import React from 'react';
import './DocumentCard.css';

const DocumentCard = ({
  document,
  onDownload,
  getCategoryIcon,
  getCategoryLabel,
  formatFileSize,
  formatDate,
  isPersonal = false
}) => {
  const handleDownload = () => {
    onDownload(document._id, document.title);
  };

  const getExpiryStatus = () => {
    if (!isPersonal || !document.expiryDate) return null;
    
    const now = new Date();
    const expiryDate = new Date(document.expiryDate);
    const diffTime = expiryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return { status: 'expired', text: 'Expiré', class: 'expired' };
    } else if (diffDays <= 7) {
      return { status: 'warning', text: `Expire dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`, class: 'warning' };
    } else if (diffDays <= 15) {
      return { status: 'info', text: `Expire dans ${diffDays} jours`, class: 'info' };
    }
    
    return null;
  };

  const expiryStatus = getExpiryStatus();

  return (
    <div className={`document-card ${isPersonal ? 'personal' : 'general'}`}>
      <div className="document-header">
        <div className="document-icon">
          {getCategoryIcon(document.category)}
        </div>
        <div className="document-title">
          <h3>{document.title}</h3>
          <span className="document-category">
            {getCategoryLabel(document.category)}
          </span>
        </div>
        {expiryStatus && (
          <div className={`expiry-badge ${expiryStatus.class}`}>
            {expiryStatus.text}
          </div>
        )}
      </div>

      <div className="document-content">
        {document.description && (
          <p className="document-description">{document.description}</p>
        )}
        
        <div className="document-details">
          <div className="detail-item">
            <span className="detail-label">📅 Ajouté le:</span>
            <span className="detail-value">{formatDate(document.uploadDate)}</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">📏 Taille:</span>
            <span className="detail-value">{formatFileSize(document.fileSize)}</span>
          </div>
          
          {document.downloadCount > 0 && (
            <div className="detail-item">
              <span className="detail-label">⬇️ Téléchargé:</span>
              <span className="detail-value">{document.downloadCount} fois</span>
            </div>
          )}
          
          {document.lastDownloadDate && (
            <div className="detail-item">
              <span className="detail-label">🕒 Dernier téléchargement:</span>
              <span className="detail-value">{formatDate(document.lastDownloadDate)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="document-actions">
        <button 
          className="download-btn"
          onClick={handleDownload}
          disabled={expiryStatus?.status === 'expired'}
        >
          <span className="download-icon">⬇️</span>
          Télécharger
        </button>
        
        {expiryStatus?.status === 'expired' && (
          <div className="expired-message">
            ⚠️ Ce document a expiré et ne peut plus être téléchargé
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentCard;
