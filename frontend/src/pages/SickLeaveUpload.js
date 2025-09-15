import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SickLeaveUpload.css';

const SickLeaveUpload = () => {
  const [formData, setFormData] = useState({
    employeeName: '',
    employeeEmail: '',
    startDate: '',
    endDate: ''
  });
  
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || 'https://boulangerie-planning-api-4-pbfy.onrender.com/api';

  // Charger la liste des employés
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get(`${API_URL}/employees`);
        if (response.data.success) {
          setEmployees(response.data.data);
        }
      } catch (error) {
        console.error('Erreur récupération employés:', error);
        setMessage('Erreur lors du chargement de la liste des employés');
        setMessageType('error');
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, [API_URL]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'employeeName') {
      // Trouver l'employé sélectionné et mettre à jour l'email
      const selectedEmployee = employees.find(emp => emp.name === value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        employeeEmail: selectedEmployee ? selectedEmployee.email : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (selectedFile) {
      // Vérification du type de fichier
      const allowedTypes = ['image/jpeg', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setMessage('Seuls les fichiers JPG et PDF sont acceptés');
        setMessageType('error');
        return;
      }

      // Vérification de la taille (10MB max)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setMessage('Le fichier ne doit pas dépasser 10MB');
        setMessageType('error');
        return;
      }

      setFile(selectedFile);
      setMessage('');
      setMessageType('');

      // Prévisualisation pour les images
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target.result);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setMessage('Veuillez sélectionner un fichier');
      setMessageType('error');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('sickLeaveFile', file);
      formDataToSend.append('employeeName', formData.employeeName);
      formDataToSend.append('employeeEmail', formData.employeeEmail);
      formDataToSend.append('startDate', formData.startDate);
      formDataToSend.append('endDate', formData.endDate);

      const response = await axios.post(`${API_URL}/sick-leaves/upload`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setMessage('Arrêt maladie envoyé avec succès !');
        setMessageType('success');
        
        // Réinitialiser le formulaire
        setFormData({
          employeeName: '',
          employeeEmail: '',
          startDate: '',
          endDate: ''
        });
        setFile(null);
        setPreview(null);
        document.getElementById('fileInput').value = '';
      } else {
        setMessage(response.data.error || 'Erreur lors de l\'envoi');
        setMessageType('error');
      }

    } catch (error) {
      console.error('Erreur upload:', error);
      setMessage(error.response?.data?.error || 'Erreur lors de l\'envoi de l\'arrêt maladie');
      setMessageType('error');
    } finally {
      setUploading(false);
    }
  };

  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div className="sick-leave-upload">
      <div className="upload-container">
        <div className="upload-header">
          <h1>📋 Envoi d'Arrêt Maladie</h1>
          <p>Envoyez votre arrêt maladie</p>
        </div>

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-group">
            <label htmlFor="employeeName">Nom complet *</label>
            <select
              id="employeeName"
              name="employeeName"
              value={formData.employeeName}
              onChange={handleInputChange}
              required
              disabled={loadingEmployees}
            >
              <option value="">
                {loadingEmployees ? 'Chargement...' : 'Sélectionnez votre nom'}
              </option>
              {employees.map((employee) => (
                <option key={employee._id} value={employee.name}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="employeeEmail">Email *</label>
            <input
              type="email"
              id="employeeEmail"
              name="employeeEmail"
              value={formData.employeeEmail}
              onChange={handleInputChange}
              required
              placeholder="votre.email@exemple.com"
              readOnly
              className="readonly-input"
            />
          </div>

          <div className="date-group">
            <div className="form-group">
              <label htmlFor="startDate">Date de début d'arrêt *</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                required
                max={getCurrentDate()}
              />
            </div>

            <div className="form-group">
              <label htmlFor="endDate">Date de fin d'arrêt *</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                required
                min={formData.startDate || getCurrentDate()}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="fileInput">Arrêt maladie (JPG ou PDF) *</label>
            <div className="file-upload-area">
              <input
                type="file"
                id="fileInput"
                accept=".jpg,.jpeg,.pdf"
                onChange={handleFileChange}
                required
                className="file-input"
              />
              <label htmlFor="fileInput" className="file-label">
                {file ? (
                  <div className="file-selected">
                    <span className="file-icon">📄</span>
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                ) : (
                  <div className="file-placeholder">
                    <span className="upload-icon">📤</span>
                    <span>Cliquez pour sélectionner un fichier</span>
                    <small>JPG, PDF (max 10MB)</small>
                  </div>
                )}
              </label>
            </div>
          </div>

          {preview && (
            <div className="preview-container">
              <h3>Aperçu :</h3>
              <img src={preview} alt="Aperçu" className="preview-image" />
            </div>
          )}

          {message && (
            <div className={`message ${messageType}`}>
              {message}
            </div>
          )}

          <button 
            type="submit" 
            className="submit-button"
            disabled={uploading}
          >
            {uploading ? (
              <>
                <span className="spinner"></span>
                Envoi en cours...
              </>
            ) : (
              <>
                📤 Envoyer l'arrêt maladie
              </>
            )}
          </button>
        </form>

        <div className="upload-info">
          <h3>ℹ️ Informations importantes</h3>
          <ul>
            <li>Seuls les fichiers JPG et PDF sont acceptés</li>
            <li>Taille maximum : 10MB</li>
            <li>Vous recevrez une confirmation par email si votre arrêt nous est bien transmis</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SickLeaveUpload;
