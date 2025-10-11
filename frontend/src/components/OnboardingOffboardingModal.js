import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import './OnboardingOffboardingModal.css';

const OnboardingOffboardingModal = ({ isOpen, onClose, employees }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('entree'); // 'entree' ou 'sortie'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // État pour les démarches d'entrée
  const [onboardingData, setOnboardingData] = useState({
    contratSigne: { done: false, date: '', comment: '' },
    dpae: { done: false, date: '', comment: '' },
    declarationMedecineTravail: { done: false, date: '', comment: '' },
    demandeMutuelle: { done: false, date: '', comment: '', refused: false, attestationFournie: false },
    visiteMedicale: { done: false, date: '', comment: '' },
    formationSecurite: { done: false, date: '', comment: '' },
    charteDiscrimination: { done: false, date: '', comment: '' },
    rib: { done: false, date: '', comment: '' },
    registrePresenceEntree: { done: false, date: '', comment: '' },
    gabriel: { done: false, date: '', comment: '' }
  });

  // État pour les démarches de sortie
  const [offboardingData, setOffboardingData] = useState({
    arretMutuel: { done: false, date: '', comment: '' },
    gabrielSortie: { done: false, date: '', comment: '' },
    mutuelleSortie: { done: false, date: '', comment: '' },
    retourTenues: { done: false, date: '', comment: '' },
    retourCles: { done: false, date: '', comment: '' },
    registrePresenceSortie: { done: false, date: '', comment: '' }
  });

  const [entryDate, setEntryDate] = useState('');
  const [exitDate, setExitDate] = useState('');

  // Charger les données quand un employé est sélectionné
  useEffect(() => {
    if (selectedEmployeeId && employees.length > 0) {
      const employee = employees.find(emp => emp._id === selectedEmployeeId);
      setSelectedEmployee(employee);
      loadEmployeeData(selectedEmployeeId);
    }
  }, [selectedEmployeeId, employees]);

  // Fonction pour formater les dates au format yyyy-MM-dd
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Erreur formatage date:', error);
      return '';
    }
  };

  const loadEmployeeData = async (employeeId) => {
    try {
      setLoading(true);
      const response = await api.get(`/onboarding-offboarding/employee/${employeeId}`);
      
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        
        // Fonction pour formater les objets de démarches
        const formatTask = (task) => ({
          done: task?.done || false,
          date: formatDateForInput(task?.date) || '',
          comment: task?.comment || ''
        });
        
        // Charger les données d'entrée
        if (data.onboarding) {
          setOnboardingData({
            contratSigne: formatTask(data.onboarding.contratSigne),
            dpae: formatTask(data.onboarding.dpae),
            declarationMedecineTravail: formatTask(data.onboarding.declarationMedecineTravail),
            demandeMutuelle: {
              ...formatTask(data.onboarding.demandeMutuelle),
              refused: data.onboarding.demandeMutuelle?.refused || false,
              attestationFournie: data.onboarding.demandeMutuelle?.attestationFournie || false
            },
            visiteMedicale: formatTask(data.onboarding.visiteMedicale),
            formationSecurite: formatTask(data.onboarding.formationSecurite),
            charteDiscrimination: formatTask(data.onboarding.charteDiscrimination),
            rib: formatTask(data.onboarding.rib),
            registrePresenceEntree: formatTask(data.onboarding.registrePresenceEntree),
            gabriel: formatTask(data.onboarding.gabriel)
          });
        }
        
        // Charger les données de sortie
        if (data.offboarding) {
          setOffboardingData({
            arretMutuel: formatTask(data.offboarding.arretMutuel),
            gabrielSortie: formatTask(data.offboarding.gabrielSortie),
            mutuelleSortie: formatTask(data.offboarding.mutuelleSortie),
            retourTenues: formatTask(data.offboarding.retourTenues),
            retourCles: formatTask(data.offboarding.retourCles),
            registrePresenceSortie: formatTask(data.offboarding.registrePresenceSortie)
          });
        }
        
        // Charger les dates
        setEntryDate(formatDateForInput(data.entryDate));
        setExitDate(formatDateForInput(data.exitDate));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingChange = (key, field, value) => {
    setOnboardingData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleOffboardingChange = (key, field, value) => {
    setOffboardingData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    console.log('🔵 handleSave appelé');
    console.log('🔵 selectedEmployeeId:', selectedEmployeeId);
    console.log('🔵 selectedEmployee:', selectedEmployee);
    
    if (!selectedEmployeeId || !selectedEmployee) {
      console.log('❌ Validation échouée: pas d\'employé sélectionné');
      toast.error('Veuillez sélectionner un employé');
      return;
    }

    try {
      setSaving(true);
      
      // Nettoyer les dates vides avant l'envoi
      const cleanedOnboarding = {};
      Object.keys(onboardingData).forEach(key => {
        cleanedOnboarding[key] = {
          ...onboardingData[key],
          date: onboardingData[key].date || null
        };
      });
      
      const cleanedOffboarding = {};
      Object.keys(offboardingData).forEach(key => {
        cleanedOffboarding[key] = {
          ...offboardingData[key],
          date: offboardingData[key].date || null
        };
      });
      
      const payload = {
        employeeId: selectedEmployeeId,
        employeeName: selectedEmployee.name,
        onboarding: cleanedOnboarding,
        offboarding: cleanedOffboarding,
        entryDate: entryDate || null,
        exitDate: exitDate || null
      };

      console.log('📤 Envoi payload:', payload);
      const response = await api.post('/onboarding-offboarding', payload);
      console.log('✅ Réponse reçue:', response.data);
      
      if (response.data.success) {
        toast.success('✅ Démarches sauvegardées avec succès');
        // Recharger les obligations légales dans le dashboard
        if (window.location.pathname.includes('dashboard')) {
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      if (error.response) {
        console.error('Détails erreur:', error.response.data);
        toast.error(`❌ Erreur: ${error.response.data.message || 'Erreur serveur'}`);
      } else {
        toast.error('❌ Erreur lors de la sauvegarde des démarches');
      }
    } finally {
      setSaving(false);
    }
  };

  const renderOnboardingForm = () => {
    const tasks = [
      { key: 'contratSigne', label: 'Contrat de travail signé des deux parties' },
      { key: 'dpae', label: 'DPAE' },
      { key: 'declarationMedecineTravail', label: 'Déclaration Médecine du travail' },
      { key: 'demandeMutuelle', label: 'Demande de Mutuelle Entreprise', hasRefusal: true },
      { key: 'visiteMedicale', label: 'Visite médicale effectuée' },
      { key: 'formationSecurite', label: 'Formation Sécurité Magasin' },
      { key: 'charteDiscrimination', label: 'Charte Discrimination signée' },
      { key: 'rib', label: 'RIB' },
      { key: 'registrePresenceEntree', label: 'Registre de Présence' },
      { key: 'gabriel', label: 'Gabriel' }
    ];

    return (
      <div className="onboarding-form">
        <h3>📋 Démarches d'entrée</h3>
        
        <div className="form-group">
          <label>Date d'entrée</label>
          <input
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className="form-control"
          />
        </div>

        {tasks.map(task => (
          <div key={task.key} className="task-item">
            <div className="task-header">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={onboardingData[task.key]?.done || false}
                  onChange={(e) => handleOnboardingChange(task.key, 'done', e.target.checked)}
                />
                <span className={onboardingData[task.key]?.done ? 'task-done' : ''}>
                  {task.label}
                </span>
              </label>
            </div>
            
            {task.hasRefusal && (
              <div className="mutuelle-refusal">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={onboardingData[task.key]?.refused || false}
                    onChange={(e) => handleOnboardingChange(task.key, 'refused', e.target.checked)}
                  />
                  <span>Refus de la mutuelle</span>
                </label>
                {onboardingData[task.key]?.refused && (
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={onboardingData[task.key]?.attestationFournie || false}
                      onChange={(e) => handleOnboardingChange(task.key, 'attestationFournie', e.target.checked)}
                    />
                    <span>Attestation de refus fournie</span>
                  </label>
                )}
              </div>
            )}
            
            {onboardingData[task.key]?.done && (
              <div className="task-details">
                <input
                  type="date"
                  value={onboardingData[task.key]?.date || ''}
                  onChange={(e) => handleOnboardingChange(task.key, 'date', e.target.value)}
                  className="form-control form-control-sm"
                  placeholder="Date"
                />
                <input
                  type="text"
                  value={onboardingData[task.key]?.comment || ''}
                  onChange={(e) => handleOnboardingChange(task.key, 'comment', e.target.value)}
                  className="form-control form-control-sm"
                  placeholder="Commentaire (optionnel)"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderOffboardingForm = () => {
    const tasks = [
      { key: 'arretMutuel', label: 'Arrêt Mutuel' },
      { key: 'gabrielSortie', label: 'Gabriel' },
      { key: 'mutuelleSortie', label: 'Mutuelle (si demandée)' },
      { key: 'retourTenues', label: 'Retour tenues' },
      { key: 'retourCles', label: 'Retour clés' },
      { key: 'registrePresenceSortie', label: 'Registre de présence' }
    ];

    return (
      <div className="offboarding-form">
        <h3>📤 Démarches de sortie</h3>
        
        <div className="form-group">
          <label>Date de sortie</label>
          <input
            type="date"
            value={exitDate}
            onChange={(e) => setExitDate(e.target.value)}
            className="form-control"
          />
        </div>

        {tasks.map(task => (
          <div key={task.key} className="task-item">
            <div className="task-header">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={offboardingData[task.key]?.done || false}
                  onChange={(e) => handleOffboardingChange(task.key, 'done', e.target.checked)}
                />
                <span className={offboardingData[task.key]?.done ? 'task-done' : ''}>
                  {task.label}
                </span>
              </label>
            </div>
            
            {offboardingData[task.key]?.done && (
              <div className="task-details">
                <input
                  type="date"
                  value={offboardingData[task.key]?.date || ''}
                  onChange={(e) => handleOffboardingChange(task.key, 'date', e.target.value)}
                  className="form-control form-control-sm"
                  placeholder="Date"
                />
                <input
                  type="text"
                  value={offboardingData[task.key]?.comment || ''}
                  onChange={(e) => handleOffboardingChange(task.key, 'comment', e.target.value)}
                  className="form-control form-control-sm"
                  placeholder="Commentaire (optionnel)"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="onboarding-modal-overlay">
      <div className="onboarding-modal">
        <div className="onboarding-modal-header">
          <h2>📋 Entrée/Sortie - Démarches Administratives</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="onboarding-modal-body">
          {/* Sélection de l'employé */}
          <div className="employee-selector">
            <label>Sélectionner un employé :</label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="form-control"
            >
              <option value="">-- Choisir un employé --</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.role || 'Non spécifié'})
                </option>
              ))}
            </select>
          </div>

          {selectedEmployeeId && (
            <>
              {/* Onglets */}
              <div className="tabs">
                <button
                  className={`tab ${activeTab === 'entree' ? 'active' : ''}`}
                  onClick={() => setActiveTab('entree')}
                >
                  📥 Entrée
                </button>
                <button
                  className={`tab ${activeTab === 'sortie' ? 'active' : ''}`}
                  onClick={() => setActiveTab('sortie')}
                >
                  📤 Sortie
                </button>
              </div>

              {/* Contenu des onglets */}
              {loading ? (
                <div className="loading-container">
                  <div className="loading"></div>
                  <p>Chargement des données...</p>
                </div>
              ) : (
                <div className="tab-content">
                  {activeTab === 'entree' ? renderOnboardingForm() : renderOffboardingForm()}
                </div>
              )}
            </>
          )}
        </div>

        <div className="onboarding-modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!selectedEmployeeId || saving}
          >
            {saving ? 'Sauvegarde...' : '💾 Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingOffboardingModal;

