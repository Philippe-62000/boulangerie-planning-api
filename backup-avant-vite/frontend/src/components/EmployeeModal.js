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
    email: '',
    isActive: true,
    emergencyContact: {
      lastName: '',
      firstName: '',
      phone: '',
      email: ''
    }
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
        tutorName: employee.tutorName || '',
        email: employee.email || '',
        isActive: employee.isActive !== undefined ? employee.isActive : true,
        emergencyContact: employee.emergencyContact || {
          lastName: '',
          firstName: '',
          phone: '',
          email: ''
        }
      });
    }
  }, [employee]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Gestion des champs de contact d'urgence
    if (name.startsWith('emergencyContact.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
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

  const handleSendPassword = async () => {
    if (!employee || !employee.email) {
      alert('❌ Aucun email configuré pour cet employé');
      return;
    }

    const confirmMessage = `📧 Envoyer les informations de connexion à ${employee.email} ?\n\n` +
      `- Email: ${employee.email}\n` +
      `- URL de connexion: https://www.filmara.fr/salarie-connexion\n` +
      `- Mot de passe: [Généré automatiquement]\n\n` +
      `Confirmer l'envoi ?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      console.log('📧 Envoi du mot de passe via backend API pour:', employee.name, employee.email);
      
      // Appeler l'API backend pour générer et sauvegarder le mot de passe
      const backendResponse = await fetch(`${process.env.REACT_APP_API_URL || 'https://boulangerie-planning-api-4-pbfy.onrender.com/api'}/auth/send-password/${employee._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json();
        throw new Error(errorData.error || 'Erreur backend');
      }

      const backendData = await backendResponse.json();
      
      console.log('✅ Mot de passe sauvegardé et email envoyé via backend (Modal)');
      
      alert(`✅ Mot de passe envoyé avec succès à ${employee.email}`);
      console.log('✅ Mot de passe envoyé via backend API (Modal)');
    } catch (error) {
      console.error('❌ Erreur envoi mot de passe:', error);
      alert(`❌ Erreur lors de l'envoi: ${error.message}`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log('🔍 Données du formulaire avant validation:', formData);

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

    // Préparer les données pour l'envoi
    const dataToSend = {
      ...formData,
      age: parseInt(formData.age),
      weeklyHours: parseInt(formData.weeklyHours),
      // S'assurer que les champs optionnels sont correctement formatés
      contractEndDate: formData.contractEndDate || undefined,
      tutor: formData.tutor || undefined,
      email: formData.email || undefined
    };

    console.log('📤 Données préparées pour l\'envoi:', dataToSend);
    onSave(dataToSend);
  };

  const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const availableSkills = ['Ouverture', 'Fermeture', 'Management'];
  const roles = [
    // Vente
    { value: 'vendeuse', label: 'Vendeuse' },
    { value: 'responsable', label: 'Responsable' },
    { value: 'manager', label: 'Manager' },
    { value: 'Apprenti Vendeuse', label: 'Apprenti Vendeuse' },
    
    // Production
    { value: 'chef prod', label: 'Chef Prod' },
    { value: 'boulanger', label: 'Boulanger' },
    { value: 'préparateur', label: 'Préparateur' },
    { value: 'Apprenti Boulanger', label: 'Apprenti Boulanger' },
    { value: 'Apprenti Préparateur', label: 'Apprenti Préparateur' }
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

            {/* Champs spécifiques aux apprentis */}
            {(formData.contractType === 'Apprentissage' || 
              formData.role === 'Apprenti Vendeuse' || 
              formData.role === 'Apprenti Boulanger' || 
              formData.role === 'Apprenti Préparateur') && (
              <>
                <div className="form-group">
                  <label className="form-label">Fin du contrat d'apprentissage *</label>
                  <input
                    type="date"
                    name="contractEndDate"
                    value={formData.contractEndDate}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nom du tuteur *</label>
                  <input
                    type="text"
                    name="tutorName"
                    value={formData.tutorName}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Nom du maître d'apprentissage"
                    required
                  />
                </div>
              </>
            )}

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

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-control"
                placeholder="exemple@email.com"
              />
              <small className="form-text">Email pour l'envoi des identifiants de connexion</small>
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

          {/* Section Contact d'urgence */}
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '2px solid #e0e0e0' }}>
            <h3 style={{ marginBottom: '1rem', color: '#333', fontSize: '1.1rem' }}>
              🚨 Personne à Contacter en Cas d'Urgence
            </h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nom</label>
                <input
                  type="text"
                  name="emergencyContact.lastName"
                  value={formData.emergencyContact.lastName}
                  onChange={handleInputChange}
                  className="form-control"
                  placeholder="Nom de la personne"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Prénom</label>
                <input
                  type="text"
                  name="emergencyContact.firstName"
                  value={formData.emergencyContact.firstName}
                  onChange={handleInputChange}
                  className="form-control"
                  placeholder="Prénom de la personne"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Numéro de téléphone</label>
                <input
                  type="tel"
                  name="emergencyContact.phone"
                  value={formData.emergencyContact.phone}
                  onChange={handleInputChange}
                  className="form-control"
                  placeholder="06 12 34 56 78"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="emergencyContact.email"
                  value={formData.emergencyContact.email}
                  onChange={handleInputChange}
                  className="form-control"
                  placeholder="contact@exemple.com"
                />
              </div>
            </div>
          </div>

          </form>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Annuler
            </button>
            {employee && (
              <button
                type="button"
                className="btn btn-info"
                onClick={handleSendPassword}
                title="Envoyer les informations de connexion par email"
              >
                📧 Envoyer mot de passe
              </button>
            )}
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

