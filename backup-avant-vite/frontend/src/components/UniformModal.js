import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import './UniformModal.css';

const UniformModal = ({ isOpen, onClose, employees }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('entree'); // 'entree' ou 'sortie'
  const [loading, setLoading] = useState(false);
  const [uniformItems, setUniformItems] = useState([]);

  // États pour l'ajout d'une nouvelle tenue
  const [newItem, setNewItem] = useState({
    itemType: 'pantalon',
    size: '',
    quantity: 1,
    comment: ''
  });

  const itemTypes = [
    { value: 'pantalon', label: 'Pantalon' },
    { value: 'casquette', label: 'Casquette' },
    { value: 'chaussures', label: 'Chaussures' },
    { value: 'teeshirt', label: 'T-shirt' },
    { value: 'polaire', label: 'Polaire' },
    { value: 'carte_wengel', label: 'Carte Wengel' },
    { value: 'cle_entree', label: 'Clé Entrée' },
    { value: 'cle_volet', label: 'Clé Volet' },
    { value: 'code_alarme', label: 'Code Alarme' }
  ];

  // Charger les tenues quand un employé est sélectionné
  useEffect(() => {
    if (selectedEmployeeId && employees.length > 0) {
      const employee = employees.find(emp => emp._id === selectedEmployeeId);
      setSelectedEmployee(employee);
      loadUniformData(selectedEmployeeId);
    }
  }, [selectedEmployeeId, employees]);

  const loadUniformData = async (employeeId) => {
    try {
      setLoading(true);
      const response = await api.get(`/uniforms/employee/${employeeId}`);
      
      if (response.data.success && response.data.data) {
        setUniformItems(response.data.data.items || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des tenues:', error);
      toast.error('Erreur lors du chargement des tenues');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!selectedEmployeeId || !selectedEmployee) {
      toast.error('Veuillez sélectionner un employé');
      return;
    }

    if (!newItem.itemType) {
      toast.error('Veuillez sélectionner un type de tenue');
      return;
    }

    try {
      const payload = {
        employeeId: selectedEmployeeId,
        employeeName: selectedEmployee.name,
        itemType: newItem.itemType,
        size: newItem.size,
        quantity: parseInt(newItem.quantity) || 1,
        comment: newItem.comment
      };

      const response = await api.post('/uniforms', payload);
      
      if (response.data.success) {
        toast.success('✅ Tenue ajoutée avec succès');
        // Réinitialiser le formulaire
        setNewItem({
          itemType: 'pantalon',
          size: '',
          quantity: 1,
          comment: ''
        });
        // Recharger les données
        await loadUniformData(selectedEmployeeId);
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la tenue:', error);
      toast.error('❌ Erreur lors de l\'ajout de la tenue');
    }
  };

  const handleReturnItem = async (itemId) => {
    if (!window.confirm('Confirmer le retour de cette tenue ?')) {
      return;
    }

    try {
      const response = await api.patch(`/uniforms/${selectedEmployeeId}/${itemId}/return`, {
        returnDate: new Date().toISOString(),
        returnComment: 'Retourné'
      });
      
      if (response.data.success) {
        toast.success('✅ Tenue marquée comme retournée');
        await loadUniformData(selectedEmployeeId);
      }
    } catch (error) {
      console.error('Erreur lors du retour de la tenue:', error);
      toast.error('❌ Erreur lors du retour de la tenue');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Confirmer la suppression de cette tenue ?')) {
      return;
    }

    try {
      const response = await api.delete(`/uniforms/${selectedEmployeeId}/${itemId}`);
      
      if (response.data.success) {
        toast.success('✅ Tenue supprimée');
        await loadUniformData(selectedEmployeeId);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('❌ Erreur lors de la suppression');
    }
  };

  const getItemTypeLabel = (itemType) => {
    const item = itemTypes.find(t => t.value === itemType);
    return item ? item.label : itemType;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const renderEntryForm = () => {
    return (
      <div className="uniform-entry-form">
        <h3>➕ Ajouter une tenue</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Type de tenue *</label>
            <select
              value={newItem.itemType}
              onChange={(e) => setNewItem({...newItem, itemType: e.target.value})}
              className="form-control"
            >
              {itemTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Taille / Descriptif</label>
            <input
              type="text"
              value={newItem.size}
              onChange={(e) => setNewItem({...newItem, size: e.target.value})}
              className="form-control"
              placeholder="Ex: L, 42, etc."
            />
          </div>

          <div className="form-group">
            <label>Quantité</label>
            <input
              type="number"
              min="1"
              value={newItem.quantity}
              onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
              className="form-control"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Commentaire</label>
          <input
            type="text"
            value={newItem.comment}
            onChange={(e) => setNewItem({...newItem, comment: e.target.value})}
            className="form-control"
            placeholder="Optionnel"
          />
        </div>

        <button className="btn btn-primary" onClick={handleAddItem}>
          ➕ Ajouter cette tenue
        </button>

        <hr style={{ margin: '2rem 0' }} />

        <h3>📋 Historique des tenues attribuées</h3>
        {uniformItems.length === 0 ? (
          <p className="no-data">Aucune tenue enregistrée</p>
        ) : (
          <div className="uniform-list">
            {uniformItems
              .sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate))
              .map((item) => (
              <div key={item._id} className={`uniform-item ${item.returned ? 'returned' : ''}`}>
                <div className="item-header">
                  <span className="item-type">{getItemTypeLabel(item.itemType)}</span>
                  <span className={`item-status ${item.returned ? 'status-returned' : 'status-active'}`}>
                    {item.returned ? '✅ Retourné' : '🔵 En cours'}
                  </span>
                </div>
                <div className="item-details">
                  <div className="detail-row">
                    <strong>Taille:</strong> {item.size || '-'}
                  </div>
                  <div className="detail-row">
                    <strong>Quantité:</strong> {item.quantity}
                  </div>
                  <div className="detail-row">
                    <strong>Date d'attribution:</strong> {formatDate(item.issueDate)}
                  </div>
                  {item.comment && (
                    <div className="detail-row">
                      <strong>Commentaire:</strong> {item.comment}
                    </div>
                  )}
                  {item.returned && (
                    <>
                      <div className="detail-row">
                        <strong>Date de retour:</strong> {formatDate(item.returnDate)}
                      </div>
                      {item.returnComment && (
                        <div className="detail-row">
                          <strong>Commentaire retour:</strong> {item.returnComment}
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="item-actions">
                  {!item.returned && (
                    <button 
                      className="btn btn-sm btn-warning"
                      onClick={() => handleReturnItem(item._id)}
                    >
                      📤 Marquer comme retourné
                    </button>
                  )}
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDeleteItem(item._id)}
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderExitForm = () => {
    const activeItems = uniformItems.filter(item => !item.returned);

    return (
      <div className="uniform-exit-form">
        <h3>📤 Retour des tenues</h3>
        
        {activeItems.length === 0 ? (
          <div className="no-pending">
            <p>✅ Aucune tenue en attente de retour</p>
          </div>
        ) : (
          <div className="pending-returns">
            <p className="info-message">
              ⚠️ {activeItems.length} tenue(s) en attente de retour
            </p>
            <div className="uniform-list">
              {activeItems.map((item) => (
                <div key={item._id} className="uniform-item">
                  <div className="item-header">
                    <span className="item-type">{getItemTypeLabel(item.itemType)}</span>
                    <span className="item-status status-pending">🔵 À retourner</span>
                  </div>
                  <div className="item-details">
                    <div className="detail-row">
                      <strong>Taille:</strong> {item.size || '-'}
                    </div>
                    <div className="detail-row">
                      <strong>Quantité:</strong> {item.quantity}
                    </div>
                    <div className="detail-row">
                      <strong>Attribué le:</strong> {formatDate(item.issueDate)}
                    </div>
                  </div>
                  <div className="item-actions">
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleReturnItem(item._id)}
                    >
                      ✅ Confirmer le retour
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="uniform-modal-overlay">
      <div className="uniform-modal">
        <div className="uniform-modal-header">
          <h2>👕 Gestion des Tenues</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="uniform-modal-body">
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
                  ➕ Entrée / Historique
                </button>
                <button
                  className={`tab ${activeTab === 'sortie' ? 'active' : ''}`}
                  onClick={() => setActiveTab('sortie')}
                >
                  📤 Sortie / Retours
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
                  {activeTab === 'entree' ? renderEntryForm() : renderExitForm()}
                </div>
              )}
            </>
          )}
        </div>

        <div className="uniform-modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default UniformModal;

