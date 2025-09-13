import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import './Parameters.css';
import './Parameters-email-styles.css';
import './Parameters-tabs-styles.css';

const Parameters = () => {
  // État pour la gestion des onglets
  const [activeTab, setActiveTab] = useState('site');
  
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
  
  // États pour la gestion des templates d'email
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);

  useEffect(() => {
    fetchParameters();
    fetchMenuPermissions();
    fetchSite();
    fetchDatabaseStats();
    fetchEmailTemplates();
  }, []);

  // Fonction pour changer d'onglet
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };

  // Fonction pour créer les paramètres manquants
  const createMissingParameters = async () => {
    try {
      const requiredParams = ['storeEmail', 'adminEmail', 'alertStore', 'alertAdmin'];
      const missingParams = requiredParams.filter(paramName => 
        !parameters.find(p => p.name === paramName)
      );

      if (missingParams.length > 0) {
        console.log('📝 Création des paramètres manquants:', missingParams);
        
        // Recharger les paramètres depuis le serveur
        await fetchParameters();
        
        toast.success(`${missingParams.length} paramètres créés automatiquement`);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création des paramètres:', error);
      toast.error('Erreur lors de la création des paramètres');
    }
  };

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

  const handleParameterChange = (idOrIndex, field, value) => {
    const newParameters = [...parameters];
    
    // Si c'est un ID (string), trouver l'index
    if (typeof idOrIndex === 'string') {
      const index = newParameters.findIndex(p => p._id === idOrIndex);
      if (index !== -1) {
        newParameters[index][field] = value;
        setParameters(newParameters);
      } else {
        console.error('❌ Paramètre non trouvé avec l\'ID:', idOrIndex);
      }
    } else {
      // Si c'est un index (number), utiliser directement
      newParameters[idOrIndex][field] = value;
      setParameters(newParameters);
    }
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

      // Envoyer les mots de passe dans le bon format
      const passwordData = {};
      if (passwords.admin) {
        passwordData.admin = passwords.admin;
      }
      if (passwords.employee) {
        passwordData.employee = passwords.employee;
      }

      console.log('🔐 Envoi des mots de passe:', passwordData);
      await api.put('/passwords/update', passwordData);

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

  // Fonctions pour la gestion des templates d'email
  const fetchEmailTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const response = await api.get('/email-templates');
      if (response.data.success) {
        setEmailTemplates(response.data.templates);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des templates:', error);
      toast.error('Erreur lors du chargement des templates d\'email');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const initializeDefaultTemplates = async () => {
    setSavingTemplate(true);
    try {
      const response = await api.post('/email-templates/initialize-defaults');
      if (response.data.success) {
        toast.success(response.data.message);
        fetchEmailTemplates();
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error);
      toast.error('Erreur lors de l\'initialisation des templates');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleTemplateChange = (field, value) => {
    setSelectedTemplate(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveTemplate = async () => {
    if (!selectedTemplate) return;
    
    setSavingTemplate(true);
    try {
      await api.put(`/email-templates/${selectedTemplate._id}`, {
        displayName: selectedTemplate.displayName,
        subject: selectedTemplate.subject,
        htmlContent: selectedTemplate.htmlContent,
        textContent: selectedTemplate.textContent,
        description: selectedTemplate.description,
        variables: selectedTemplate.variables
      });
      
      toast.success('Template sauvegardé avec succès');
      setShowTemplateEditor(false);
      setSelectedTemplate(null);
      fetchEmailTemplates();
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde du template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const openTemplateEditor = (template) => {
    setSelectedTemplate({ ...template });
    setShowTemplateEditor(true);
  };

  const closeTemplateEditor = () => {
    setShowTemplateEditor(false);
    setSelectedTemplate(null);
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

      {/* Navigation par onglets */}
      <div className="tabs-navigation">
        <button 
          className={`tab-button ${activeTab === 'site' ? 'active' : ''}`}
          onClick={() => handleTabChange('site')}
        >
          🏪 Informations du Site
        </button>
        <button 
          className={`tab-button ${activeTab === 'passwords' ? 'active' : ''}`}
          onClick={() => handleTabChange('passwords')}
        >
          🔐 Gestion des Mots de Passe
        </button>
        <button 
          className={`tab-button ${activeTab === 'permissions' ? 'active' : ''}`}
          onClick={() => handleTabChange('permissions')}
        >
          🔐 Gestion des Permissions de Menu
        </button>
        <button 
          className={`tab-button ${activeTab === 'km' ? 'active' : ''}`}
          onClick={() => handleTabChange('km')}
        >
          🚗 Paramètres - Frais KM
        </button>
        <button 
          className={`tab-button ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => handleTabChange('templates')}
        >
          📋 Templates disponibles
        </button>
        <button 
          className={`tab-button ${activeTab === 'database' ? 'active' : ''}`}
          onClick={() => handleTabChange('database')}
        >
          🗄️ Gestion de la Base de Données
        </button>
      </div>

      {/* Contenu des onglets */}
      <div className="tab-content">

        {/* Onglet: Informations du Site */}
        {activeTab === 'site' && (
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
        )}

        {/* Onglet: Gestion des Mots de Passe */}
        {activeTab === 'passwords' && (
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
                disabled={savingPasswords}
                style={{ 
                  opacity: (!passwords.admin && !passwords.employee) ? 0.6 : 1,
                  cursor: (!passwords.admin && !passwords.employee) ? 'not-allowed' : 'pointer'
                }}
              >
                {savingPasswords ? '🔐 Mise à jour...' : '🔐 Mettre à jour les mots de passe'}
              </button>
            </div>
          </div>
        </div>
          </div>
        )}

        {/* Onglet: Gestion des Permissions de Menu */}
        {activeTab === 'permissions' && (
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
        )}

        {/* Onglet: Paramètres - Frais KM */}
        {activeTab === 'km' && (
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
        )}

        {/* Onglet: Templates disponibles */}
        {activeTab === 'templates' && (
          <>
            {/* Section Configuration des Alertes Email */}
            <div className="card">
              <div className="card-header">
                <h3>🚨 Configuration des Alertes Email</h3>
                <p>Configurez les alertes pour les nouveaux arrêts maladie à valider</p>
              </div>
              <div className="card-body">
                <div className="alert-email-section">
                  {/* Vérifier si les paramètres existent */}
                  {(!parameters.find(p => p.name === 'storeEmail') || 
                    !parameters.find(p => p.name === 'adminEmail') || 
                    !parameters.find(p => p.name === 'alertStore') || 
                    !parameters.find(p => p.name === 'alertAdmin')) && (
                    <div className="alert alert-warning">
                      <p>⚠️ Certains paramètres d'alerte email sont manquants.</p>
                      <button 
                        className="btn btn-primary"
                        onClick={createMissingParameters}
                      >
                        🔧 Créer les paramètres manquants
                      </button>
                    </div>
                  )}
                  {/* Email du Magasin */}
                  <div className="email-config">
                    <div className="email-input-group">
                      <label htmlFor="storeEmail">📧 Email du Magasin :</label>
                      <input 
                        type="email" 
                        id="storeEmail"
                        value={parameters.find(p => p.name === 'storeEmail')?.stringValue || ''}
                        onChange={(e) => {
                          const param = parameters.find(p => p.name === 'storeEmail');
                          if (param) {
                            const updatedParams = parameters.map(p => 
                              p.name === 'storeEmail' 
                                ? { ...p, stringValue: e.target.value }
                                : p
                            );
                            setParameters(updatedParams);
                          }
                        }}
                        className="email-input"
                        placeholder="magasin@boulangerie.fr"
                      />
                    </div>
                  </div>

                  {/* Email de l'Admin */}
                  <div className="email-config">
                    <div className="email-input-group">
                      <label htmlFor="adminEmail">👑 Email de l'Administrateur :</label>
                      <input 
                        type="email" 
                        id="adminEmail"
                        value={parameters.find(p => p.name === 'adminEmail')?.stringValue || ''}
                        onChange={(e) => {
                          const param = parameters.find(p => p.name === 'adminEmail');
                          if (param) {
                            const updatedParams = parameters.map(p => 
                              p.name === 'adminEmail' 
                                ? { ...p, stringValue: e.target.value }
                                : p
                            );
                            setParameters(updatedParams);
                          }
                        }}
                        className="email-input"
                        placeholder="admin@boulangerie.fr"
                      />
                    </div>
                  </div>

                  {/* Choix des Destinataires */}
                  <div className="email-config">
                    <div className="email-input-group">
                      <label>🎯 Destinataires des Alertes :</label>
                      <div className="recipient-options">
                        <label className="checkbox-option">
                          <input 
                            type="checkbox" 
                            checked={parameters.find(p => p.name === 'alertStore')?.booleanValue || false}
                            onChange={(e) => {
                              const param = parameters.find(p => p.name === 'alertStore');
                              if (param) {
                                handleParameterChange(param._id, 'booleanValue', e.target.checked);
                              }
                            }}
                          />
                          <span>📧 Envoyer au Magasin</span>
                        </label>
                        <label className="checkbox-option">
                          <input 
                            type="checkbox" 
                            checked={parameters.find(p => p.name === 'alertAdmin')?.booleanValue || false}
                            onChange={(e) => {
                              const param = parameters.find(p => p.name === 'alertAdmin');
                              if (param) {
                                handleParameterChange(param._id, 'booleanValue', e.target.checked);
                              }
                            }}
                          />
                          <span>👑 Envoyer à l'Administrateur</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="email-actions">
                    <button 
                      className="btn btn-primary"
                      onClick={async () => {
                        try {
                          // Sauvegarder seulement les paramètres d'alerte
                          const alertParams = parameters.filter(p => 
                            ['storeEmail', 'adminEmail', 'alertStore', 'alertAdmin'].includes(p.name)
                          );
                          
                          if (alertParams.length === 0) {
                            toast.error('Aucun paramètre d\'alerte trouvé');
                            return;
                          }
                          
                          const alertData = alertParams.map(param => ({
                            _id: param._id,
                            displayName: param.displayName,
                            stringValue: param.stringValue,
                            booleanValue: param.booleanValue,
                            kmValue: param.kmValue
                          }));
                          
                          console.log('📤 Sauvegarde des paramètres d\'alerte:', alertData);
                          await api.put('/parameters/batch', { parameters: alertData });
                          toast.success('Configuration des alertes sauvegardée');
                        } catch (error) {
                          console.error('❌ Erreur lors de la sauvegarde:', error);
                          toast.error('Erreur lors de la sauvegarde des alertes');
                        }
                      }}
                    >
                      💾 Sauvegarder la configuration des alertes
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Configuration Email Comptable */}
            <div className="card">
        <div className="card-header">
          <h3>📧 Configuration Email Comptable</h3>
          <p>Adresse email pour l'envoi automatique des arrêts maladie validés</p>
        </div>
        <div className="card-body">
          <div className="accountant-email-section">
            {parameters.find(p => p.name === 'accountantEmail') ? (
              <div className="email-config">
                <div className="email-input-group">
                  <label htmlFor="accountantEmail">Email du comptable :</label>
                  <input
                    type="email"
                    id="accountantEmail"
                    value={parameters.find(p => p.name === 'accountantEmail')?.stringValue || ''}
                    onChange={(e) => {
                      const emailParam = parameters.find(p => p.name === 'accountantEmail');
                      if (emailParam) {
                        const updatedParams = parameters.map(p => 
                          p.name === 'accountantEmail' 
                            ? { ...p, stringValue: e.target.value }
                            : p
                        );
                        setParameters(updatedParams);
                      }
                    }}
                    className="email-input"
                    placeholder="comptable@boulangerie.fr"
                  />
                </div>
                <div className="email-info">
                  <p>💡 <strong>Utilisation :</strong> Cette adresse sera utilisée pour envoyer automatiquement les arrêts maladie validés au comptable.</p>
                  <p>🔒 <strong>Sécurité :</strong> Vous pouvez également configurer cette valeur via la variable d'environnement <code>ACCOUNTANT_EMAIL</code> dans Render.</p>
                </div>
                <div className="email-actions">
                  <button
                    className="btn btn-primary"
                    onClick={async () => {
                      try {
                        console.log('🔍 Tous les paramètres:', parameters);
                        const emailParam = parameters.find(p => p.name === 'accountantEmail');
                        console.log('📧 Paramètre email comptable trouvé:', emailParam);
                        
                        if (emailParam) {
                          console.log('📤 Envoi de la requête PUT avec:', {
                            stringValue: emailParam.stringValue,
                            _id: emailParam._id
                          });
                          
                          const response = await api.put(`/parameters/${emailParam._id}`, {
                            stringValue: emailParam.stringValue
                          });
                          
                          console.log('✅ Réponse reçue:', response.data);
                          toast.success('Email du comptable sauvegardé');
                        } else {
                          console.log('❌ Paramètre email comptable non trouvé');
                          toast.error('Paramètre email comptable non trouvé');
                        }
                      } catch (error) {
                        console.error('❌ Erreur lors de la sauvegarde:', error);
                        console.error('❌ Détails:', error.response?.data);
                        toast.error('Erreur lors de la sauvegarde de l\'email');
                      }
                    }}
                  >
                    💾 Sauvegarder l'email du comptable
                  </button>
                </div>
              </div>
            ) : (
              <div className="no-email-param">
                <p>⚠️ Le paramètre email comptable n'a pas encore été créé.</p>
                <button
                  className="btn btn-secondary"
                  onClick={async () => {
                    try {
                      await api.post('/parameters', {
                        name: 'accountantEmail',
                        displayName: 'Email du Comptable',
                        stringValue: 'comptable@boulangerie.fr',
                        kmValue: 0
                      });
                      toast.success('Paramètre email comptable créé');
                      fetchParameters();
                    } catch (error) {
                      toast.error('Erreur lors de la création du paramètre');
                    }
                  }}
                >
                  Créer le paramètre email comptable
                </button>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Section Gestion des Messages Email */}
      <div className="card">
        <div className="card-header">
          <h3>📧 Gestion des Messages Email</h3>
          <p>Personnalisez le contenu des emails envoyés automatiquement</p>
        </div>
        <div className="card-body">
          {loadingTemplates ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="loading"></div>
              <p>Chargement des templates d'email...</p>
            </div>
          ) : (
            <div className="email-templates-section">
              {emailTemplates.length === 0 ? (
                <div className="no-templates">
                  <p>⚠️ Aucun template d'email configuré.</p>
                  <button
                    className="btn btn-primary"
                    onClick={initializeDefaultTemplates}
                    disabled={savingTemplate}
                  >
                    {savingTemplate ? '🔄 Initialisation...' : '🚀 Créer les templates par défaut'}
                  </button>
                </div>
              ) : (
                <div className="templates-list">
                  <div className="templates-header">
                    <h4>📋 Templates disponibles</h4>
                    <button
                      className="btn btn-secondary"
                      onClick={initializeDefaultTemplates}
                      disabled={savingTemplate}
                    >
                      {savingTemplate ? '🔄 Mise à jour...' : '🔄 Mettre à jour les templates'}
                    </button>
                  </div>
                  
                  {emailTemplates.map(template => (
                    <div key={template._id} className="template-item">
                      <div className="template-info">
                        <div className="template-header">
                          <h5>{template.displayName}</h5>
                          <span className="template-type">
                            {template.name === 'sick_leave_validation' && '✅ Validation'}
                            {template.name === 'sick_leave_rejection' && '❌ Rejet'}
                            {template.name === 'sick_leave_accountant' && '📋 Comptable'}
                            {template.name === 'sick_leave_alert' && '🚨 Alerte'}
                            {template.name === 'vacation_request_confirmation' && '🏖️ Confirmation Congés'}
                            {template.name === 'vacation_request_alert' && '🚨 Alerte Congés'}
                            {template.name === 'vacation_request_validation' && '✅ Validation Congés'}
                          </span>
                        </div>
                        <p className="template-description">{template.description}</p>
                        <div className="template-subject">
                          <strong>Sujet :</strong> {template.subject}
                        </div>
                      </div>
                      <div className="template-actions">
                        <button
                          className="btn btn-primary"
                          onClick={() => openTemplateEditor(template)}
                        >
                          ✏️ Modifier
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
            </div>
          </>
        )}

        {/* Onglet: Gestion de la Base de Données */}
        {activeTab === 'database' && (
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
        )}

      </div>

      {/* Modal d'édition des templates */}
      {showTemplateEditor && selectedTemplate && (
        <div className="modal-overlay">
          <div className="modal-content template-editor">
            <div className="modal-header">
              <h3>✏️ Modifier le Template : {selectedTemplate.displayName}</h3>
              <button className="modal-close" onClick={closeTemplateEditor}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="template-editor-form">
                <div className="form-group">
                  <label>Nom d'affichage :</label>
                  <input
                    type="text"
                    value={selectedTemplate.displayName}
                    onChange={(e) => handleTemplateChange('displayName', e.target.value)}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Sujet de l'email :</label>
                  <input
                    type="text"
                    value={selectedTemplate.subject}
                    onChange={(e) => handleTemplateChange('subject', e.target.value)}
                    className="form-input"
                    placeholder="Utilisez {{variable}} pour les variables"
                  />
                </div>
                
                <div className="form-group">
                  <label>Description :</label>
                  <textarea
                    value={selectedTemplate.description}
                    onChange={(e) => handleTemplateChange('description', e.target.value)}
                    className="form-textarea"
                    rows="2"
                  />
                </div>
                
                <div className="form-group">
                  <label>Contenu HTML :</label>
                  <textarea
                    value={selectedTemplate.htmlContent}
                    onChange={(e) => handleTemplateChange('htmlContent', e.target.value)}
                    className="form-textarea template-html"
                    rows="15"
                    placeholder="Contenu HTML de l'email"
                  />
                </div>
                
                <div className="form-group">
                  <label>Contenu Texte :</label>
                  <textarea
                    value={selectedTemplate.textContent}
                    onChange={(e) => handleTemplateChange('textContent', e.target.value)}
                    className="form-textarea template-text"
                    rows="10"
                    placeholder="Version texte de l'email"
                  />
                </div>
                
                <div className="form-group">
                  <label>Variables disponibles :</label>
                  <div className="variables-list">
                    {selectedTemplate.variables.map((variable, index) => (
                      <div key={index} className="variable-item">
                        <code>{`{{${variable.name}}}`}</code>
                        <span className="variable-description">{variable.description}</span>
                        {variable.example && (
                          <span className="variable-example">Ex: {variable.example}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={closeTemplateEditor}
              >
                Annuler
              </button>
              <button
                className="btn btn-primary"
                onClick={saveTemplate}
                disabled={savingTemplate}
              >
                {savingTemplate ? '💾 Sauvegarde...' : '💾 Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Parameters;

