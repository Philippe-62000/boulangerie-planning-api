import React, { useState } from 'react';

const SickLeaveModal = ({ employees, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    startDate: '',
    endDate: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!formData.employeeId) {
      alert('Veuillez sélectionner un employé');
      return;
    }

    if (!formData.startDate) {
      alert('Veuillez saisir la date de début d\'arrêt');
      return;
    }

    if (!formData.endDate) {
      alert('Veuillez saisir la date de fin d\'arrêt');
      return;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (endDate <= startDate) {
      alert('La date de fin doit être postérieure à la date de début');
      return;
    }

    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🏥 Déclarer un arrêt maladie</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Employé *</label>
            <select
              name="employeeId"
              value={formData.employeeId}
              onChange={handleInputChange}
              required
            >
              <option value="">Sélectionner un employé</option>
              {employees.map(employee => (
                <option key={employee._id} value={employee._id}>
                  {employee.name} - {employee.role}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Début arrêt maladie *</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Fin arrêt maladie *</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn btn-warning">
              Déclarer l'arrêt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SickLeaveModal;
