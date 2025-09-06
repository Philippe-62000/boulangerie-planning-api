import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import './Parameters.css';

const Parameters = () => {
  const [parameters, setParameters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // États pour la gestion des mots de passe
  const [passwords, setPasswords] = useState({
    admin: '',
    employee: ''
  });
  const [savingPasswords, setSavingPasswords] = useState(false);
  
  // États pour la gestion des permissions de menu
  const [menuPermissions, setMenuPermissions] = useState([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);

  useEffect(() => {
    fetchParameters();
    fetchMenuPermissions();
  }, []);

  const fetchParameters = async () => {
    setLoading(true);
    try {
      const response = await api.get('/parameters');
      setParameters(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleParameterChange = (index, field, value) => {
    const newParameters = [...parameters];
    newParameters[index][field] = value;
    setParameters(newParameters);
  };

  const saveParameters = async () => {
    setSaving(true);
    try {
      console.log('📊 Paramètres à sauvegarder:', parameters);
      
      // Validation des données
      const parametersToSave = parameters.map(param => {
        if (!param._id) {
          console.error('❌ Paramètre sans ID:', param);
          throw new Error('Paramètre sans ID détecté');
        }
        
        const displayName = param.displayName?.trim() || '';
        const kmValue = parseFloat(param.kmValue) || 0;
        
        // Vérifier qu'au moins un champ a une valeur
        if (!displayName && kmValue === 0) {
          console.warn('⚠️ Paramètre sans valeur:', param);
          // Ne pas exclure, mais donner des valeurs par défaut
        }
        
        return {
          _id: param._id,
          displayName: displayName || `Paramètre ${param.name || 'inconnu'}`,
          kmValue: kmValue
        };
      });
      
      console.log('📤 Données envoyées:', parametersToSave);
      console.log('📤 URL de la requête:', '/api/parameters/batch');
      
      // Debug détaillé de chaque paramètre
      parametersToSave.forEach((param, index) => {
        console.log(`📋 Paramètre ${index + 1}:`, {
          _id: param._id,
          displayName: param.displayName,
          kmValue: param.kmValue,
          displayNameLength: param.displayName?.length || 0,
          kmValueType: typeof param.kmValue,
          kmValueIsNaN: isNaN(param.kmValue)
        });
      });
      
      const response = await api.put('/parameters/batch', {
        parameters: parametersToSave
      });
      
      console.log('✅ Réponse reçue:', response.data);
      toast.success('Paramètres sauvegardés avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      console.error('❌ Détails de l\'erreur:', error.response?.data);
      console.error('❌ Status:', error.response?.status);
      console.error('❌ Headers:', error.response?.headers);
      
      const errorMessage = error.response?.data?.error || error.message || 'Erreur inconnue';
      toast.error(`Erreur lors de la sauvegarde: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = (role, value) => {
    setPasswords(prev => ({
      ...prev,
      [role]: value
    }));
  };

  const savePasswords = async () => {
    setSavingPasswords(true);
    try {
      // Validation des mots de passe
      if (passwords.admin.length < 6) {
        toast.error('Le mot de passe administrateur doit contenir au moins 6 caractères');
        return;
      }
      if (passwords.employee.length < 6) {
        toast.error('Le mot de passe salarié doit contenir au moins 6 caractères');
        return;
      }

      // Mettre à jour le mot de passe administrateur
      if (passwords.admin) {
        await api.put('/passwords/update', {
          username: 'admin',
          newPassword: passwords.admin,
          role: 'admin'
        });
      }

      // Mettre à jour le mot de passe salarié
      if (passwords.employee) {
        await api.put('/passwords/update', {
          username: 'salarie',
          newPassword: passwords.employee,
          role: 'employee'
        });
      }

      toast.success('Mots de passe mis à jour avec succès');
      setPasswords({ admin: '', employee: '' });
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour des mots de passe:', error);
      toast.error('Erreur lors de la mise à jour des mots de passe');
    } finally {
      setSavingPasswords(false);
    }
  };

  const fetchMenuPermissions = async () => {
    setLoadingPermissions(true);
    try {
      const response = await api.get('/menu-permissions');
      if (response.data.success) {
        setMenuPermissions(response.data.menuPermissions);
        console.log('📋 Permissions de menu chargées:', response.data.menuPermissions);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des permissions:', error);
      toast.error('Erreur lors du chargement des permissions de menu');
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handlePermissionChange = (menuId, field, value) => {
    setMenuPermissions(prev => 
      prev.map(permission => 
        permission.menuId === menuId 
          ? { ...permission, [field]: value }
          : permission
      )
    );
  };

  const saveMenuPermissions = async () => {
    setSavingPermissions(true);
    try {
      const permissionsToUpdate = menuPermissions.map(permission => ({
        _id: permission._id,
        isVisibleToAdmin: permission.isVisibleToAdmin,
        isVisibleToEmployee: permission.isVisibleToEmployee
      }));

      await api.put('/menu-permissions/batch', { permissions: permissionsToUpdate });
      toast.success('Permissions de menu mises à jour avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde des permissions:', error);
      toast.error('Erreur lors de la sauvegarde des permissions');
    } finally {
      setSavingPermissions(false);
    }
  };

  const recreateDefaultPermissions = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir recréer les permissions par défaut ? Cela supprimera toutes les permissions actuelles.')) {
      return;
    }

    setSavingPermissions(true);
    try {
      const response = await api.post('/menu-permissions/recreate');
      if (response.data.success) {
        toast.success(response.data.message);
        // Recharger les permissions
        await fetchMenuPermissions();
      }
    } catch (error) {
      console.error('❌ Erreur lors de la recréation des permissions:', error);
      toast.error('Erreur lors de la recréation des permissions');
    } finally {
      setSavingPermissions(false);
    }
  };

  if (loading) {
    return (
      <div className="parameters fade-in">
        <div className="card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="loading"></div>
            <p>Chargement des paramètres...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="parameters fade-in">
      <div className="page-header">
        <h2>⚙️ Paramètres</h2>
        <div className="header-actions">
          <button
            className="btn btn-success"
            onClick={saveParameters}
            disabled={saving}
          >
            {saving ? '💾 Sauvegarde...' : '💾 Sauvegarder KM'}
          </button>
        </div>
      </div>

      {/* Section Gestion des Mots de Passe */}
      <div className="card">
        <div className="card-header">
          <h3>🔐 Gestion des Mots de Passe</h3>
        </div>
        <div className="card-body">
          <div className="password-section">
            <div className="password-item">
              <label htmlFor="admin-password">
                <span className="password-icon">👑</span>
                Mot de passe Administrateur
              </label>
              <input
                id="admin-password"
                type="password"
                value={passwords.admin}
                onChange={(e) => handlePasswordChange('admin', e.target.value)}
                placeholder="Nouveau mot de passe (min. 6 caractères)"
                className="password-input"
              />
            </div>
            
            <div className="password-item">
              <label htmlFor="employee-password">
                <span className="password-icon">👤</span>
                Mot de passe Salarié
              </label>
              <input
                id="employee-password"
                type="password"
                value={passwords.employee}
                onChange={(e) => handlePasswordChange('employee', e.target.value)}
                placeholder="Nouveau mot de passe (min. 6 caractères)"
                className="password-input"
              />
            </div>
            
            <div className="password-actions">
              <button
                className="btn btn-primary"
                onClick={savePasswords}
                disabled={savingPasswords || (!passwords.admin && !passwords.employee)}
              >
                {savingPasswords ? '🔐 Mise à jour...' : '🔐 Mettre à jour les mots de passe'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section Gestion des Permissions de Menu */}
      <div className="card">
        <div className="card-header">
          <h3>🔐 Gestion des Permissions de Menu</h3>
          <p>Configurez quels menus sont visibles pour les salariés</p>
        </div>
        <div className="card-body">
          {loadingPermissions ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="loading"></div>
              <p>Chargement des permissions...</p>
            </div>
          ) : (
            <div className="permissions-section">
              <div className="permissions-table">
                <div className="permissions-header">
                  <div className="permission-menu">Menu</div>
                  <div className="permission-admin">👑 Admin</div>
                  <div className="permission-employee">👤 Salarié</div>
                </div>
                {menuPermissions.map(permission => (
                  <div key={permission._id} className="permission-row">
                    <div className="permission-menu">
                      <span className="permission-icon">
                        {permission.menuId === 'dashboard' && '📊'}
                        {permission.menuId === 'employees' && '👥'}
                        {permission.menuId === 'constraints' && '📋'}
                        {permission.menuId === 'planning' && '🎯'}
                        {permission.menuId === 'sales-stats' && '💰'}
                        {permission.menuId === 'absences' && '📈'}
                        {permission.menuId === 'parameters' && '⚙️'}
                        {permission.menuId === 'employee-status' && '👤'}
                        {permission.menuId === 'meal-expenses' && '🍽️'}
                        {permission.menuId === 'km-expenses' && '🚗'}
                        {permission.menuId === 'employee-status-print' && '🖨️'}
                      </span>
                      {permission.menuName}
                    </div>
                    <div className="permission-admin">
                      <input
                        type="checkbox"
                        checked={permission.isVisibleToAdmin}
                        onChange={(e) => handlePermissionChange(permission.menuId, 'isVisibleToAdmin', e.target.checked)}
                        disabled
                      />
                    </div>
                    <div className="permission-employee">
                      <input
                        type="checkbox"
                        checked={permission.isVisibleToEmployee}
                        onChange={(e) => handlePermissionChange(permission.menuId, 'isVisibleToEmployee', e.target.checked)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="permissions-actions">
                <button
                  className="btn btn-primary"
                  onClick={saveMenuPermissions}
                  disabled={savingPermissions}
                >
                  {savingPermissions ? '💾 Sauvegarde...' : '💾 Sauvegarder les permissions'}
                </button>
                <button
                  className="btn btn-warning"
                  onClick={recreateDefaultPermissions}
                  disabled={savingPermissions}
                  style={{ marginLeft: '10px' }}
                >
                  {savingPermissions ? '🔄 Recréation...' : '🔄 Recréer les permissions par défaut'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section Paramètres KM */}
      <div className="card">
        <div className="card-header">
          <h3>🚗 Paramètres - Frais KM</h3>
        </div>
        <div className="card-body">
          <div className="parameters-list">
          {parameters.map((param, index) => (
            <div key={param._id} className="parameter-item">
              <div className="parameter-info">
                <span className="parameter-number">{index + 1}.</span>
                <input
                  type="text"
                  value={param.displayName}
                  onChange={(e) => handleParameterChange(index, 'displayName', e.target.value)}
                  className="parameter-name-input"
                  placeholder={`Paramètre ${index + 1}`}
                />
              </div>
              <div className="parameter-value">
                <input
                  type="number"
                  value={param.kmValue}
                  onChange={(e) => handleParameterChange(index, 'kmValue', e.target.value)}
                  className="parameter-km-input"
                  min="0"
                  step="0.1"
                  placeholder="0"
                />
                <span className="km-unit">km</span>
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Parameters;

