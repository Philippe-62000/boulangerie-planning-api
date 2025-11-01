import React from 'react';
import DocumentCard from './DocumentCard';
import './DocumentsSection.css';

const DocumentsSection = ({
  title,
  description,
  documents,
  onDownload,
  getCategoryIcon,
  getCategoryLabel,
  formatFileSize,
  formatDate,
  emptyMessage,
  isPersonal = false
}) => {
  return (
    <div className="documents-section">
      <div className="section-header">
        <h2>{title}</h2>
        <p className="section-description">{description}</p>
      </div>

      {documents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <h3>Aucun document</h3>
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="documents-grid">
          {documents.map((document) => (
            <DocumentCard
              key={document._id}
              document={document}
              onDownload={onDownload}
              getCategoryIcon={getCategoryIcon}
              getCategoryLabel={getCategoryLabel}
              formatFileSize={formatFileSize}
              formatDate={formatDate}
              isPersonal={isPersonal}
            />
          ))}
        </div>
      )}

      {documents.length > 0 && (
        <div className="section-footer">
          <p className="document-count">
            {documents.length} document{documents.length > 1 ? 's' : ''} disponible{documents.length > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentsSection;
