import React, { useState } from 'react';
import './DeclarationModal.css';

const DeclarationModal = ({ show, onClose, onSave, employees }) => {
  const [declarationType, setDeclarationType] = useState('maladie');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployee || !startDate || !endDate) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        type: declarationType,
        employeeId: selectedEmployee,
        startDate,
        endDate,
        reason: reason || (declarationType === 'maladie' ? 'Arrêt maladie' : 'Absence'),
        file: file // Ajouter le fichier si fourni
      });
      
      // Reset form
      setSelectedEmployee('');
      setStartDate('');
      setEndDate('');
      setReason('');
      setFile(null);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Vérifier le type de fichier
      const allowedTypes = ['image/jpeg', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(selectedFile.type)) {
        alert('Type de fichier non supporté. Seuls JPG et PDF sont acceptés.');
        e.target.value = '';
        return;
      }
      // Vérifier la taille (10MB max)
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert('Le fichier est trop volumineux. Taille maximale : 10MB');
        e.target.value = '';
        return;
      }
      setFile(selectedFile);
    }
  };

  if (!show) return null;

  return (
    <div className="modal show" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {declarationType === 'maladie' ? '🏥 Déclarer un arrêt maladie' : '📋 Déclarer une absence'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="close-icon">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} className="declaration-form">
            {/* Type de déclaration */}
            <div className="form-group">
              <label className="form-label">Type de déclaration</label>
              <div className="type-selector">
                <button
                  type="button"
                  className={`type-option ${declarationType === 'maladie' ? 'active' : ''}`}
                  onClick={() => setDeclarationType('maladie')}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="type-icon">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                  Arrêt maladie
                </button>
                <button
                  type="button"
                  className={`type-option ${declarationType === 'absence' ? 'active' : ''}`}
                  onClick={() => setDeclarationType('absence')}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="type-icon">
                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                  </svg>
                  Absence
                </button>
              </div>
            </div>

            {/* Sélection employé */}
            <div className="form-group">
              <label className="form-label">Employé *</label>
              <select
                className="form-control"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                required
              >
                <option value="">Sélectionner un employé</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} - {emp.role}
                  </option>
                ))}
              </select>
            </div>

            {/* Dates */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date de début *</label>
                <input
                  type="date"
                  className="form-control"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date de fin *</label>
                <input
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  min={startDate}
                />
              </div>
            </div>

            {/* Raison (optionnel) */}
            <div className="form-group">
              <label className="form-label">Raison (optionnel)</label>
              <textarea
                className="form-control"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={`Détails sur ${declarationType === 'maladie' ? 'l\'arrêt maladie' : 'l\'absence'}...`}
                rows="3"
              />
            </div>

            {/* Upload fichier (optionnel, uniquement pour arrêt maladie) */}
            {declarationType === 'maladie' && (
              <div className="form-group">
                <label className="form-label">
                  Certificat médical (optionnel)
                  <span style={{ fontSize: '0.85em', color: '#666', marginLeft: '8px' }}>
                    JPG ou PDF, max 10MB
                  </span>
                </label>
                <input
                  type="file"
                  className="form-control"
                  accept=".jpg,.jpeg,.pdf,image/jpeg,image/jpg,application/pdf"
                  onChange={handleFileChange}
                />
                {file && (
                  <div style={{ marginTop: '8px', fontSize: '0.9em', color: '#28a745' }}>
                    ✓ Fichier sélectionné : {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
              </div>
            )}

            {/* Informations supplémentaires */}
            <div className="info-box">
              <div className="info-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div className="info-content">
                <h4>Informations importantes</h4>
                <ul>
                  <li>Les dates sont inclusives</li>
                  <li>L'employé sera automatiquement marqué comme indisponible</li>
                  <li>Le planning sera mis à jour en conséquence</li>
                </ul>
              </div>
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="loading-spinner" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                </svg>
                Enregistrement...
              </>
            ) : (
              `Déclarer ${declarationType === 'maladie' ? 'l\'arrêt maladie' : 'l\'absence'}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeclarationModal;
