import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config/apiConfig';

const getTutorId = (value) => {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'object') {
    return value._id || value.id || '';
  }
  return '';
};

const EmployeeModal = ({ employee, onSave, onClose, employees = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    contractType: 'CDI',
    age: '',
    birthDate: '',
    skills: [],
    role: 'vendeuse',
    weeklyHours: 35,
    trainingDays: [],
    contractEndDate: '',
    tutor: '',
    email: '',
    saleCode: '',
    mutuelle: 'Oui Entreprise',
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
        birthDate: employee.birthDate ? new Date(employee.birthDate).toISOString().split('T')[0] : '',
        skills: employee.skills || [],
        role: employee.role || 'vendeuse',
        weeklyHours: employee.weeklyHours || 35,
        trainingDays: Array.isArray(employee.trainingDays) ? employee.trainingDays : [],
        contractEndDate: employee.contractEndDate ? new Date(employee.contractEndDate).toISOString().split('T')[0] : '',
        tutor: getTutorId(employee.tutor),
        email: employee.email || '',
        saleCode: employee.saleCode || '',
        mutuelle: employee.mutuelle || 'Oui Entreprise',
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
        ...(name === 'contractType' && value !== 'Apprentissage' ? {
          tutor: '',
          trainingDays: [],
          contractEndDate: ''
        } : {}),
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
      const backendResponse = await fetch(`${getApiUrl()}/auth/send-password/${employee._id}`, {
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

    const tutorValue = formData.contractType === 'Apprentissage' ? getTutorId(formData.tutor) : '';

    // Préparer les données pour l'envoi
    const dataToSend = {
      ...formData,
      age: parseInt(formData.age),
      weeklyHours: parseInt(formData.weeklyHours),
      // S'assurer que les champs optionnels sont correctement formatés
      contractEndDate: formData.contractEndDate || undefined,
      birthDate: formData.birthDate || undefined,
      tutor: formData.contractType === 'Apprentissage' ? (tutorValue || undefined) : undefined,
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

          {/* Champ date de naissance (affiché uniquement pour les mineurs) */}
          {formData.age && formData.age !== '' && !isNaN(parseInt(formData.age)) && parseInt(formData.age) < 18 && (
            <div className="form-group">
              <label className="form-label">Date de naissance *</label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleInputChange}
                className="form-control"
                required
                max={new Date().toISOString().split('T')[0]}
              />
              <small className="form-text" style={{ color: '#666', marginTop: '5px' }}>
                Nécessaire pour calculer précisément le nombre de jours avant les 18 ans
              </small>
            </div>
          )}

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

          {/* Champ Code Vente pour les rôles concernés */}
          {(() => {
            const rolesAvecCode = ['vendeuse', 'apprenti', 'manager', 'responsable', 'Apprenti Vendeuse'];
            const roleNormalized = formData.role?.toLowerCase();
            const isRoleConcerned = rolesAvecCode.some(r => r.toLowerCase() === roleNormalized);
            
            if (!isRoleConcerned) {
              return null;
            }

            return (
              <div
                style={{
                  marginTop: '1.5rem',
                  padding: '1.25rem',
                  border: '1px solid #e1e5e9',
                  borderRadius: '10px',
                  backgroundColor: '#f8f9fa'
                }}
              >
                <h3 style={{ marginBottom: '1rem', color: '#333', fontSize: '1.05rem' }}>
                  🔐 Code Vente (saisie quotidienne)
                </h3>
                <div className="form-group" style={{ maxWidth: '320px' }}>
                  <label className="form-label">
                    <strong>Code Vente (3 chiffres)</strong>
                    {!formData.saleCode && (
                      <span style={{ color: '#ffc107', marginLeft: '10px', fontSize: '0.85rem' }}>
                        (sera généré automatiquement à la création)
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    name="saleCode"
                    value={formData.saleCode || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 3);
                      setFormData(prev => ({ ...prev, saleCode: value }));
                    }}
                    className="form-control"
                    placeholder={formData.saleCode ? formData.saleCode : 'Ex : 123'}
                    pattern="[0-9]{3}"
                    maxLength="3"
                    style={{
                      backgroundColor: formData.saleCode ? '#fff' : '#fef9e7',
                      border: formData.saleCode ? '2px solid #28a745' : '2px dashed #ffd966'
                    }}
                  />
                  <small className="form-text" style={{ color: '#666', marginTop: '5px' }}>
                    Ce code permet à la vendeuse de s'identifier sur la page de saisie quotidienne.
                  </small>
                </div>
              </div>
            );
          })()}



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
            </>
          )}

          {/* Champ Mutuelle */}
          <div className="form-group" style={{ marginTop: '1.5rem' }}>
            <label className="form-label">Mutuelle *</label>
            <select
              name="mutuelle"
              value={formData.mutuelle}
              onChange={handleInputChange}
              className="form-control"
              required
            >
              <option value="Oui Entreprise">Oui Entreprise</option>
              <option value="Non Perso">Non Perso</option>
            </select>
            <small className="form-text">Choisissez si l'employé a la mutuelle entreprise ou une mutuelle personnelle</small>
          </div>

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

