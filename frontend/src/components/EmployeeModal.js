import React, { useState, useEffect } from 'react';

const EmployeeModal = ({ employee, onSave, onClose, employees = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    contractType: 'CDI',
    age: '',
    skills: [],
    role: 'vendeuse',
    weeklyHours: 35,
    trainingDays: [],
    contractEndDate: '',
    tutor: '',
    isActive: true
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || '',
        contractType: employee.contractType || 'CDI',
        age: employee.age || '',
        skills: employee.skills || [],
        role: employee.role || 'vendeuse',
        weeklyHours: employee.weeklyHours || 35,
        trainingDays: employee.trainingDays || [],
        contractEndDate: employee.contractEndDate ? new Date(employee.contractEndDate).toISOString().split('T')[0] : '',
        tutor: employee.tutor || '',
        isActive: employee.isActive !== undefined ? employee.isActive : true
      });
    }
  }, [employee]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSkillChange = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleTrainingDayChange = (day) => {
    setFormData(prev => ({
      ...prev,
      trainingDays: prev.trainingDays.includes(day)
        ? prev.trainingDays.filter(d => d !== day)
        : [...prev.trainingDays, day]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation de base
    if (!formData.name.trim()) {
      alert('Le nom est obligatoire');
      return;
    }

    if (!formData.age) {
      alert('L\'âge est obligatoire');
      return;
    }

    // Validation d'âge
    if (formData.age < 16 || formData.age > 65) {
      alert('L\'âge doit être entre 16 et 65 ans');
      return;
    }

    if (formData.weeklyHours < 20 || formData.weeklyHours > 39) {
      alert('Le volume hebdomadaire doit être entre 20 et 39 heures');
      return;
    }

    // Pour les apprentis, vérifier qu'ils ont des jours de formation et une date de fin de contrat
    if (formData.contractType === 'Apprentissage') {
      if (formData.trainingDays.length === 0) {
        alert('Les apprentis doivent avoir au moins un jour de formation');
        return;
      }
      if (!formData.contractEndDate) {
        alert('Les apprentis doivent avoir une date de fin de contrat');
        return;
      }
    }

    onSave(formData);
  };

  const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const availableSkills = ['Ouverture', 'Fermeture', 'Management'];
  const roles = [
    { value: 'vendeuse', label: 'Vendeuse' },
    { value: 'apprenti', label: 'Apprenti' },
    { value: 'responsable', label: 'Responsable' },
    { value: 'manager', label: 'Manager' },
    { value: 'preparateur', label: 'Préparateur' },
    { value: 'chef_prod', label: 'Chef Prod' },
    { value: 'boulanger', label: 'Boulanger' }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, color: '#333' }}>
          {employee ? '👤 Modifier l\'employé' : '➕ Ajouter un employé'}
        </h2>
        <button 
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#666',
            padding: '0.5rem'
          }}
        >
          ✕
        </button>
      </div>

      <div>
          <form onSubmit={handleSubmit} className="declaration-form">
          <div className="form-group">
            <label className="form-label">Nom complet *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="form-control"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Contrat *</label>
              <select
                name="contractType"
                value={formData.contractType}
                onChange={handleInputChange}
                className="form-control"
                required
              >
                <option value="CDI">CDI</option>
                <option value="Apprentissage">Contrat d'apprentissage</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Âge *</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                className="form-control"
                min="16"
                max="65"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Rôle *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="form-control"
                required
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Volume hebdomadaire (h) *</label>
              <input
                type="number"
                name="weeklyHours"
                value={formData.weeklyHours}
                onChange={handleInputChange}
                className="form-control"
                min="20"
                max="39"
                required
              />
            </div>
          </div>



          <div className="form-group">
            <label className="form-label">Compétences</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {availableSkills.map(skill => (
                <label key={skill} style={{ display: 'flex', alignItems: 'center', marginRight: '1rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.skills.includes(skill)}
                    onChange={() => handleSkillChange(skill)}
                    style={{ marginRight: '0.5rem' }}
                  />
                  {skill}
                </label>
              ))}
            </div>
          </div>

          {/* Champ Tuteur pour les apprentis */}
          {formData.contractType === 'Apprentissage' && (
            <div className="form-group">
              <label className="form-label">Tuteur *</label>
              <select
                name="tutor"
                value={formData.tutor}
                onChange={handleInputChange}
                className="form-control"
                required
              >
                <option value="">Sélectionner un tuteur</option>
                {employees
                  .filter(emp => emp._id !== employee?._id && emp.isActive)
                  .map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} - {emp.role}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {formData.contractType === 'Apprentissage' && (
            <>
              <div className="form-group">
                <label className="form-label">Jours de formation *</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {daysOfWeek.map(day => (
                    <label key={day} style={{ display: 'flex', alignItems: 'center', marginRight: '1rem' }}>
                      <input
                        type="checkbox"
                        checked={formData.trainingDays.includes(day)}
                        onChange={() => handleTrainingDayChange(day)}
                        style={{ marginRight: '0.5rem' }}
                      />
                      {day}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Date de fin de contrat *</label>
                <input
                  type="date"
                  name="contractEndDate"
                  value={formData.contractEndDate}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                />
              </div>
            </>
          )}

          </form>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              onClick={handleSubmit}
            >
              {employee ? 'Modifier l\'employé' : 'Ajouter l\'employé'}
            </button>
          </div>
        </div>
    </div>
  );
};

export default EmployeeModal;

