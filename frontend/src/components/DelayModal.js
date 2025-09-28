import React, { useState } from 'react';
import './DelayModal.css';

const DelayModal = ({ show, onClose, onSave, employees }) => {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [delayDate, setDelayDate] = useState('');
  const [duration, setDuration] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployee || !delayDate || !duration) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (parseInt(duration) < 1) {
      alert('La durée du retard doit être d\'au moins 1 minute');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        employeeId: selectedEmployee,
        date: delayDate,
        duration: parseInt(duration),
        reason: reason || ''
      });
      
      // Reset form
      setSelectedEmployee('');
      setDelayDate('');
      setDuration('');
      setReason('');
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal show" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            🕐 Déclarer un retard
          </h2>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="close-icon">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} className="delay-form">
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

            {/* Date du retard */}
            <div className="form-group">
              <label className="form-label">Date du retard *</label>
              <input
                type="date"
                className="form-control"
                value={delayDate}
                onChange={(e) => setDelayDate(e.target.value)}
                required
                max={new Date().toISOString().split('T')[0]} // Pas de date future
              />
            </div>

            {/* Durée du retard */}
            <div className="form-group">
              <label className="form-label">Durée du retard (minutes) *</label>
              <div className="duration-input">
                <input
                  type="number"
                  className="form-control"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Ex: 15"
                  min="1"
                  max="480" // 8 heures max
                  required
                />
                <span className="duration-unit">minutes</span>
              </div>
              <div className="duration-help">
                <small>Durée en minutes (ex: 15 pour 15 minutes, 90 pour 1h30)</small>
              </div>
            </div>

            {/* Raison (optionnel) */}
            <div className="form-group">
              <label className="form-label">Raison du retard (optionnel)</label>
              <textarea
                className="form-control"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Problème de transport, réveil tardif, embouteillage..."
                rows="3"
              />
            </div>

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
                  <li>Le retard sera enregistré pour la date sélectionnée</li>
                  <li>La durée doit être en minutes (minimum 1 minute)</li>
                  <li>Les retards sont visibles dans les statistiques d'absences</li>
                  <li>Vous ne pouvez pas déclarer un retard pour une date future</li>
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
              'Déclarer le retard'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DelayModal;
