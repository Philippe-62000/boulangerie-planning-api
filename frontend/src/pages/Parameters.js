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
  
  // États pour la gestion du site
  const [site, setSite] = useState({ name: 'Boulangerie', city: 'Ville' });
  const [loadingSite, setLoadingSite] = useState(false);
  const [savingSite, setSavingSite] = useState(false);
  
  // États pour la gestion de la base de données
  const [databaseStats, setDatabaseStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [exportingDatabase, setExportingDatabase] = useState(false);
  const [importingDatabase, setImportingDatabase] = useState(false);

  useEffect(() => {
    fetchParameters();
    fetchMenuPermissions();
    fetchSite();
    fetchDatabaseStats();
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
      console.log('🔐 Tentative de mise à jour des mots de passe:', passwords);
      
      // Vérifier qu'au moins un mot de passe est saisi
      if (!passwords.admin && !passwords.employee) {
        toast.error('Veuillez saisir au moins un mot de passe');
        setSavingPasswords(false);
        return;
      }

      // Validation des mots de passe
      if (passwords.admin && passwords.admin.length < 6) {
        toast.error('Le mot de passe administrateur doit contenir au moins 6 caractères');
        setSavingPasswords(false);
        return;
      }
      if (passwords.employee && passwords.employee.length < 6) {
        toast.error('Le mot de passe salarié doit contenir au moins 6 caractères');
        setSavingPasswords(false);
        return;
      }

      // Mettre à jour le mot de passe administrateur
      if (passwords.admin) {
        console.log('🔐 Mise à jour mot de passe admin...');
        await api.put('/passwords/update', {
          username: 'admin',
          newPassword: passwords.admin,
          role: 'admin'
        });
        console.log('✅ Mot de passe admin mis à jour');
      }

      // Mettre à jour le mot de passe salarié
      if (passwords.employee) {
        console.log('🔐 Mise à jour mot de passe salarié...');
        await api.put('/passwords/update', {
          username: 'salarie',
          newPassword: passwords.employee,
          role: 'employee'
        });
        console.log('✅ Mot de passe salarié mis à jour');
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

  const fetchSite = async () => {
    setLoadingSite(true);
    try {
      const response = await api.get('/site');
      setSite(response.data);
      console.log('🏪 Site chargé:', response.data);
    } catch (error) {
      console.error('❌ Erreur lors du chargement du site:', error);
      toast.error('Erreur lors du chargement des informations du site');
    } finally {
      setLoadingSite(false);
    }
  };

  const handleSiteChange = (field, value) => {
    setSite(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveSite = async () => {
    setSavingSite(true);
    try {
      await api.put('/site', site);
      toast.success('Informations du site mises à jour avec succès');
      // Recharger la page pour mettre à jour le titre
      window.location.reload();
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du site:', error);
      toast.error('Erreur lors de la mise à jour du site');
    } finally {
      setSavingSite(false);
    }
  };

  // Fonctions pour la gestion de la base de données
  const fetchDatabaseStats = async () => {
    setLoadingStats(true);
    try {
      const response = await api.get('/database/stats');
      if (response.data.success) {
        setDatabaseStats(response.data.stats);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des statistiques:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const exportDatabase = async () => {
    setExportingDatabase(true);
    try {
      const response = await api.get('/database/export', {
        responseType: 'blob'
      });
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `boulangerie-backup-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Base de données exportée avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'export:', error);
      toast.error('Erreur lors de l\'export de la base de données');
    } finally {
      setExportingDatabase(false);
    }
  };

  const importDatabase = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Veuillez sélectionner un fichier JSON');
      return;
    }

    setImportingDatabase(true);
    try {
      const formData = new FormData();
      formData.append('backupFile', file);

      const response = await api.post('/database/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Base de données importée avec succès');
        // Recharger les données
        fetchParameters();
        fetchMenuPermissions();
        fetchSite();
        fetchDatabaseStats();
      } else {
        toast.error('Erreur lors de l\'import: ' + (response.data.error || 'Erreur inconnue'));
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'import:', error);
      toast.error('Erreur lors de l\'import de la base de données');
    } finally {
      setImportingDatabase(false);
      // Réinitialiser l'input file
      event.target.value = '';
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
      </div>

      {/* Section Informations du Site */}
      <div className="card">
        <div className="card-header">
          <h3>🏪 Informations du Site</h3>
        </div>
        <div className="card-body">
          {loadingSite ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="loading"></div>
              <p>Chargement des informations du site...</p>
            </div>
          ) : (
            <div className="site-section">
              <div className="site-item">
                <label htmlFor="site-name">
                  <span className="site-icon">🏪</span>
                  Nom du site
                </label>
                <input
                  id="site-name"
                  type="text"
                  value={site.name}
                  onChange={(e) => handleSiteChange('name', e.target.value)}
                  placeholder="Nom de la boulangerie"
                  className="site-input"
                />
              </div>
              
              <div className="site-item">
                <label htmlFor="site-city">
                  <span className="site-icon">🏙️</span>
                  Ville
                </label>
                <input
                  id="site-city"
                  type="text"
                  value={site.city}
                  onChange={(e) => handleSiteChange('city', e.target.value)}
                  placeholder="Ville du magasin"
                  className="site-input"
                />
              </div>
              
              <div className="site-actions">
                <button
                  className="btn btn-primary"
                  onClick={saveSite}
                  disabled={savingSite}
                >
                  {savingSite ? '💾 Sauvegarde...' : '💾 Sauvegarder les informations du site'}
                </button>
              </div>
            </div>
          )}
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
          
          <div className="parameters-actions">
            <button
              className="btn btn-success"
              onClick={saveParameters}
              disabled={saving}
            >
              {saving ? '💾 Sauvegarde...' : '💾 Sauvegarder les paramètres KM'}
            </button>
          </div>
        </div>
      </div>

      {/* Section Gestion de la Base de Données */}
      <div className="card">
        <div className="card-header">
          <h3>🗄️ Gestion de la Base de Données</h3>
          <p>Sauvegarde et restauration complète de la base de données</p>
        </div>
        
        <div className="card-body">
          {/* Statistiques de la base de données */}
          <div className="database-stats">
            <h4>📊 Statistiques</h4>
            {loadingStats ? (
              <p>Chargement des statistiques...</p>
            ) : databaseStats ? (
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Total documents:</span>
                  <span className="stat-value">{databaseStats.totalDocuments}</span>
                </div>
                {Object.entries(databaseStats.collections).map(([collection, count]) => (
                  <div key={collection} className="stat-item">
                    <span className="stat-label">{collection}:</span>
                    <span className="stat-value">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>Aucune statistique disponible</p>
            )}
          </div>

          {/* Actions de sauvegarde/restauration */}
          <div className="database-actions">
            <h4>💾 Sauvegarde & Restauration</h4>
            <div className="action-buttons">
              <button
                className="btn btn-primary"
                onClick={exportDatabase}
                disabled={exportingDatabase}
              >
                {exportingDatabase ? '📤 Export en cours...' : '📤 Exporter Base de Données'}
              </button>
              
              <div className="import-section">
                <input
                  type="file"
                  id="importFile"
                  accept=".json"
                  onChange={importDatabase}
                  style={{ display: 'none' }}
                />
                <label
                  htmlFor="importFile"
                  className={`btn btn-warning ${importingDatabase ? 'disabled' : ''}`}
                >
                  {importingDatabase ? '📥 Import en cours...' : '📥 Importer Base de Données'}
                </label>
              </div>
            </div>
            
            <div className="database-warning">
              <h5>⚠️ Attention</h5>
              <ul>
                <li>L'export crée une sauvegarde complète de toutes les données</li>
                <li>L'import remplace TOUTES les données existantes</li>
                <li>Assurez-vous d'avoir une sauvegarde récente avant d'importer</li>
                <li>L'opération d'import ne peut pas être annulée</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Parameters;

