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
  
  // État local pour les 12 paramètres KM
  const [kmParameters, setKmParameters] = useState([]);
  
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

  // États pour la gestion des employés (pour la sélection nominative)
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  
  // États pour les mots de passe des fiches de paie
  const [payslipPasswords, setPayslipPasswords] = useState([]);
  const [loadingPayslipPasswords, setLoadingPayslipPasswords] = useState(false);
  const [savingPayslipPasswords, setSavingPayslipPasswords] = useState(false);

  // États pour la vérification de maintenance
  const [maintenanceCheck, setMaintenanceCheck] = useState(null);
  const [checkingMaintenance, setCheckingMaintenance] = useState(false);

  // États pour les marges des objectifs
  const [marges, setMarges] = useState({ vert: 100, jaune: 80, orange: 50 });
  const [savingMarges, setSavingMarges] = useState(false);

  useEffect(() => {
    fetchParameters();
    fetchMenuPermissions();
    fetchSite();
    fetchDatabaseStats();
    fetchEmailTemplates();
    fetchEmployees();
    fetchMarges();
  }, []);

  // Charger les mots de passe des fiches de paie quand l'onglet passwords est actif
  useEffect(() => {
    if (activeTab === 'passwords') {
      fetchPayslipPasswords();
    }
  }, [activeTab]);

  // Charger les marges
  const fetchMarges = async () => {
    try {
      const response = await api.get('/parameters');
      const params = Array.isArray(response.data) ? response.data : [];
      const margeVert = params.find(p => p.name === 'margeVert');
      const margeJaune = params.find(p => p.name === 'margeJaune');
      const margeOrange = params.find(p => p.name === 'margeOrange');
      setMarges({
        vert: margeVert?.kmValue || 100,
        jaune: margeJaune?.kmValue || 80,
        orange: margeOrange?.kmValue || 50
      });
    } catch (error) {
      console.error('Erreur chargement marges:', error);
    }
  };

  // Sauvegarder les marges
  const saveMarges = async () => {
    setSavingMarges(true);
    try {
      const paramsToSave = [
        { name: 'margeVert', kmValue: marges.vert },
        { name: 'margeJaune', kmValue: marges.jaune },
        { name: 'margeOrange', kmValue: marges.orange }
      ];

      for (const param of paramsToSave) {
        await api.put('/parameters', param);
      }

      toast.success('Marges enregistrées avec succès');
      await fetchParameters();
    } catch (error) {
      console.error('Erreur sauvegarde marges:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSavingMarges(false);
    }
  };

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
      const allParams = response.data;
      setParameters(allParams);
      
      // Initialiser kmParameters avec 12 éléments (existants + placeholders)
      const kmParams = allParams.filter(param => 
        param.kmValue !== undefined && param.kmValue >= 0
      ).sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(a.createdAt) - new Date(b.createdAt);
        }
        return 0;
      });
      
      const kmParamsArray = [];
      for (let i = 0; i < 12; i++) {
        if (i < kmParams.length) {
          kmParamsArray.push(kmParams[i]);
        } else {
          kmParamsArray.push({
            _id: `new-${i}`,
            name: `kmParam${Date.now()}-${i}`,
            displayName: '',
            kmValue: 0,
            isNew: true
          });
        }
      }
      setKmParameters(kmParamsArray);
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const response = await api.get('/employees');
      let employeesData = null;
      if (response.data.success && response.data.data) {
        employeesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        employeesData = response.data;
      }
      if (employeesData) {
        setEmployees(employeesData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des employés:', error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Charger les mots de passe des fiches de paie
  const fetchPayslipPasswords = async () => {
    setLoadingPayslipPasswords(true);
    try {
      const response = await api.get('/passwords/payslip-passwords');
      if (response.data.success && response.data.data) {
        setPayslipPasswords(response.data.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des mots de passe des fiches de paie:', error);
      toast.error('Erreur lors du chargement des mots de passe');
    } finally {
      setLoadingPayslipPasswords(false);
    }
  };

  // Mettre à jour les mots de passe des fiches de paie
  const savePayslipPasswords = async () => {
    setSavingPayslipPasswords(true);
    try {
      const passwords = payslipPasswords.map(emp => ({
        employeeId: emp._id,
        payslipPassword: emp.payslipPassword || ''
      }));
      
      const response = await api.put('/passwords/payslip-passwords', { passwords });
      if (response.data.success) {
        toast.success(response.data.message);
        // Recharger la liste
        fetchPayslipPasswords();
      } else {
        toast.error(response.data.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la sauvegarde des mots de passe');
    } finally {
      setSavingPayslipPasswords(false);
    }
  };

  // Mettre à jour un mot de passe localement
  const updatePayslipPassword = (employeeId, password) => {
    setPayslipPasswords(prev => 
      prev.map(emp => 
        emp._id === employeeId ? { ...emp, payslipPassword: password } : emp
      )
    );
  };

  // Télécharger le fichier mots_de_passe.bat
  const downloadPayslipPasswordsBat = async () => {
    try {
      const response = await api.get('/passwords/download-payslip-passwords-bat', {
        responseType: 'blob'
      });
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'mots_de_passe.bat');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Fichier mots_de_passe.bat téléchargé avec succès');
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error('Erreur lors du téléchargement du fichier');
    }
  };

  // Importer les mots de passe depuis le fichier mots_de_passe.bat
  const importPayslipPasswordsFromBat = async () => {
    try {
      // Lire le fichier mots_de_passe.bat depuis le serveur ou utiliser un fichier local
      // Pour l'instant, on essaie de récupérer le contenu via une requête
      // Si le fichier n'est pas disponible, on affiche un message d'erreur
      const response = await api.post('/passwords/import-payslip-passwords-from-bat', {
        // On peut aussi essayer de lire un fichier local si disponible
        // Pour l'instant, on laisse le serveur gérer
      });
      if (response.data.success) {
        toast.success(response.data.message);
        // Recharger la liste des mots de passe
        fetchPayslipPasswords();
      } else {
        toast.error(response.data.error || 'Erreur lors de l\'import');
      }
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      const errorMessage = error.response?.data?.error || 'Erreur lors de l\'import des mots de passe';
      toast.error(errorMessage);
      
      // Si le fichier n'est pas trouvé, proposer une alternative
      if (error.response?.status === 400 && errorMessage.includes('introuvable')) {
        toast.info('Le fichier mots_de_passe.bat doit être présent sur le serveur. Contactez l\'administrateur.');
      }
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
      console.log('📊 Paramètres KM à sauvegarder:', kmParameters);
      
      // Séparer les paramètres existants et les nouveaux
      const existingParams = kmParameters.filter(param => 
        param._id && !param._id.startsWith('new-') && !param.isNew
      );
      const newParams = kmParameters.filter(param => 
        param._id && param._id.startsWith('new-') || param.isNew
      );
      
      // Préparer les paramètres existants à mettre à jour
      const parametersToUpdate = existingParams.map(param => ({
        _id: param._id,
        displayName: param.displayName?.trim() || `Paramètre ${param.name || 'inconnu'}`,
        kmValue: parseFloat(param.kmValue) || 0
      }));
      
      // Préparer les nouveaux paramètres à créer (ignorer ceux qui sont vides)
      const parametersToCreate = newParams
        .filter(param => {
          const displayName = param.displayName?.trim() || '';
          const kmValue = parseFloat(param.kmValue) || 0;
          return displayName || kmValue > 0;
        })
        .map((param, index) => ({
          name: `kmParam${Date.now()}-${index}`,
          displayName: param.displayName?.trim() || `Paramètre ${existingParams.length + index + 1}`,
          kmValue: parseFloat(param.kmValue) || 0
        }));
      
      console.log('📤 Paramètres existants à mettre à jour:', parametersToUpdate);
      console.log('📤 Nouveaux paramètres à créer:', parametersToCreate);
      
      // Mettre à jour les paramètres existants
      if (parametersToUpdate.length > 0) {
        await api.put('/parameters/batch', {
          parameters: parametersToUpdate
        });
      }
      
      // Créer les nouveaux paramètres via le backend
      if (parametersToCreate.length > 0) {
        await api.post('/parameters/km', {
          parameters: parametersToCreate
        });
      }
      
      // Recharger les paramètres
      await fetchParameters();
      
      toast.success('Paramètres sauvegardés avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      console.error('❌ Détails de l\'erreur:', error.response?.data);
      
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
      const response = await api.get('/menu-permissions/all');
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

  // Fonction pour vérifier les mises à jour de sécurité
  const checkMaintenance = async () => {
    setCheckingMaintenance(true);
    try {
      const response = await api.get('/maintenance/security-check');
      if (response.data.success) {
        setMaintenanceCheck(response.data.data);
        console.log('✅ Vérification maintenance:', response.data.data);
      }
    } catch (error) {
      console.error('❌ Erreur vérification maintenance:', error);
      toast.error('Erreur lors de la vérification des mises à jour');
      setMaintenanceCheck({ error: error.response?.data?.message || 'Erreur inconnue' });
    } finally {
      setCheckingMaintenance(false);
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
        <button 
          className="tab-button"
          onClick={() => {
            // Utiliser l'URL actuelle pour ouvrir la bonne page (Longuenesse /lon ou Arras /plan)
            const path = window.location.pathname || '';
            const basename = path.startsWith('/lon') ? '/lon' : '/plan';
            window.open(`${basename}/admin-documents.html`, '_blank');
          }}
        >
          📁 Gestion des Documents
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

          {/* Section Mots de passe Fiches de paie */}
          <div className="payslip-passwords-section" style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '2px solid #e0e0e0' }}>
            <h4 style={{ marginBottom: '1.5rem', color: '#2c3e50' }}>📄 Mots de passe Fiches de Paie</h4>
            
            {loadingPayslipPasswords ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div className="loading"></div>
                <p>Chargement des mots de passe...</p>
              </div>
            ) : (
              <>
                <div className="payslip-passwords-table-container" style={{ marginBottom: '1.5rem', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', minWidth: '600px' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 600 }}>Salarié</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 600 }}>Mot de passe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payslipPasswords.length === 0 ? (
                        <tr>
                          <td colSpan="2" style={{ padding: '1rem', textAlign: 'center', color: '#6c757d' }}>
                            Aucun salarié trouvé
                          </td>
                        </tr>
                      ) : (
                        payslipPasswords.map((emp) => (
                          <tr key={emp._id} style={{ borderBottom: '1px solid #e9ecef' }}>
                            <td style={{ padding: '0.75rem' }}>{emp.name}</td>
                            <td style={{ padding: '0.75rem' }}>
                              <input
                                type="text"
                                value={emp.payslipPassword || ''}
                                onChange={(e) => updatePayslipPassword(emp._id, e.target.value)}
                                placeholder="Saisir le mot de passe"
                                style={{
                                  fontFamily: 'monospace',
                                  padding: '0.5rem',
                                  border: '1px solid #ced4da',
                                  borderRadius: '4px',
                                  width: '100%',
                                  maxWidth: '200px'
                                }}
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                <div style={{ textAlign: 'center', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary"
                    onClick={savePayslipPasswords}
                    disabled={savingPayslipPasswords}
                    style={{ padding: '12px 24px', fontSize: '1rem', fontWeight: 600 }}
                  >
                    {savingPayslipPasswords ? '💾 Sauvegarde...' : '💾 Sauvegarder les mots de passe'}
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={downloadPayslipPasswordsBat}
                    style={{ padding: '12px 24px', fontSize: '1rem', fontWeight: 600 }}
                  >
                    📥 Télécharger mots_de_passe.bat
                  </button>
                </div>
              </>
            )}
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
                        {permission.menuId === 'recup' && '⏱️'}
                        {permission.menuId === 'employee-status-print' && '🖨️'}
                        {permission.menuId === 'sick-leave-management' && '🏥'}
                        {permission.menuId === 'vacation-management' && '🏖️'}
                        {permission.menuId === 'advance-requests' && '💰'}
                        {permission.menuId === 'primes' && '💰'}
                        {permission.menuId === 'ticket-restaurant' && '🎫'}
                        {permission.menuId === 'mutuelle-management' && '🏥'}
                        {permission.menuId === 'commandes-en-ligne' && '🛒'}
                        {permission.menuId === 'product-exchanges' && '🔄'}
                        {permission.menuId === 'employee-dashboard' && '📁'}
                        {permission.menuId === 'ambassadeur' && '⭐'}
                        {permission.menuId === 'plateaux-repas' && '🍽️'}
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
          <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
            Configurez les 12 en-têtes de colonnes pour les frais KM
          </p>
        </div>
        <div className="card-body">
          <div className="parameters-list">
          {kmParameters.map((param, index) => (
            <div key={param._id || `new-${index}`} className="parameter-item">
              <div className="parameter-info">
                <span className="parameter-number">{index + 1}.</span>
                <input
                  type="text"
                  value={param.displayName || ''}
                  onChange={(e) => {
                    const newKmParams = [...kmParameters];
                    newKmParams[index] = {
                      ...newKmParams[index],
                      displayName: e.target.value
                    };
                    setKmParameters(newKmParams);
                  }}
                  className="parameter-name-input"
                  placeholder={`Paramètre ${index + 1}`}
                />
              </div>
              <div className="parameter-value">
                <input
                  type="number"
                  value={param.kmValue || 0}
                  onChange={(e) => {
                    const newKmParams = [...kmParameters];
                    newKmParams[index] = {
                      ...newKmParams[index],
                      kmValue: parseFloat(e.target.value) || 0
                    };
                    setKmParameters(newKmParams);
                  }}
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
            {/* Section Site en maintenance */}
            <div className="card">
                <div className="card-header">
                  <h3>🔧 Site en maintenance</h3>
                  <p>Bloquer l'accès des utilisateurs (sauf administrateur) pendant une maintenance</p>
                </div>
                <div className="card-body">
                  <label className="checkbox-option" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={parameters.find(p => p.name === 'siteEnMaintenance')?.booleanValue || false}
                      onChange={async (e) => {
                        const param = parameters.find(p => p.name === 'siteEnMaintenance');
                        const checked = e.target.checked;
                        const paramId = param?._id && !String(param._id).startsWith('temp-') ? param._id : null;
                        if (paramId) {
                          try {
                            await api.put(`/parameters/${paramId}`, { booleanValue: checked });
                            toast.success(checked ? 'Site mis en maintenance' : 'Site sorti de maintenance');
                            fetchParameters();
                          } catch (err) {
                            toast.error('Erreur lors de la mise à jour');
                          }
                        } else {
                          await fetchParameters();
                          const refetched = (await api.get('/parameters')).data;
                          const p = refetched.find(x => x.name === 'siteEnMaintenance');
                          if (p?._id) {
                            try {
                              await api.put(`/parameters/${p._id}`, { booleanValue: checked });
                              toast.success(checked ? 'Site mis en maintenance' : 'Site sorti de maintenance');
                              fetchParameters();
                            } catch (err) {
                              toast.error('Erreur lors de la mise à jour');
                            }
                          } else {
                            toast.warning('Paramètre non disponible. Rechargez la page.');
                          }
                        }
                      }}
                    />
                    <span>Site en maintenance</span>
                  </label>
                  <p className="text-muted" style={{ marginTop: '8px', fontSize: '0.9rem' }}>
                    Quand activé, les utilisateurs verront un message les invitant à revenir plus tard. L'administrateur peut toujours se connecter.
                  </p>
                </div>
              </div>

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
                            // Le paramètre existe, mettre à jour normalement
                            const updatedParams = parameters.map(p => 
                              p.name === 'storeEmail' 
                                ? { ...p, stringValue: e.target.value }
                                : p
                            );
                            setParameters(updatedParams);
                          } else {
                            // Le paramètre n'existe pas encore, le créer temporairement
                            const newParam = {
                              name: 'storeEmail',
                              displayName: 'Email du Magasin',
                              stringValue: e.target.value,
                              kmValue: -1,
                              _id: `temp-${Date.now()}` // ID temporaire pour l'UI
                            };
                            setParameters([...parameters, newParam]);
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
                            // Le paramètre existe, mettre à jour normalement
                            const updatedParams = parameters.map(p => 
                              p.name === 'adminEmail' 
                                ? { ...p, stringValue: e.target.value }
                                : p
                            );
                            setParameters(updatedParams);
                          } else {
                            // Le paramètre n'existe pas encore, le créer temporairement
                            const newParam = {
                              name: 'adminEmail',
                              displayName: 'Email de l\'Administrateur',
                              stringValue: e.target.value,
                              kmValue: -1,
                              _id: `temp-${Date.now()}` // ID temporaire pour l'UI
                            };
                            setParameters([...parameters, newParam]);
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
                          setSaving(true);
                          
                          // Récupérer les paramètres depuis le serveur (cela créera les paramètres manquants automatiquement)
                          const response = await api.get('/parameters');
                          let serverParams = response.data;
                          
                          // Récupérer les valeurs modifiées dans l'interface
                          const localStoreEmail = parameters.find(p => p.name === 'storeEmail')?.stringValue;
                          const localAdminEmail = parameters.find(p => p.name === 'adminEmail')?.stringValue;
                          const localAlertStore = parameters.find(p => p.name === 'alertStore')?.booleanValue;
                          const localAlertAdmin = parameters.find(p => p.name === 'alertAdmin')?.booleanValue;
                          
                          // Construire les données à sauvegarder
                          const paramsToSave = [];
                          
                          // Fonction helper pour obtenir ou créer un paramètre
                          const getOrCreateParam = (name, defaultValue) => {
                            let param = serverParams.find(p => p.name === name);
                            if (!param) {
                              // Le paramètre n'existe pas encore, il sera créé par le backend lors du GET
                              // On doit recharger pour obtenir les nouveaux paramètres
                              return null;
                            }
                            return param;
                          };
                          
                          // Vérifier si tous les paramètres existent, sinon recharger
                          const storeEmailParam = getOrCreateParam('storeEmail', '');
                          const adminEmailParam = getOrCreateParam('adminEmail', '');
                          const alertStoreParam = getOrCreateParam('alertStore', false);
                          const alertAdminParam = getOrCreateParam('alertAdmin', false);
                          
                          // Si un paramètre manque, recharger pour le créer
                          if (!storeEmailParam || !adminEmailParam || !alertStoreParam || !alertAdminParam) {
                            const refreshResponse = await api.get('/parameters');
                            serverParams = refreshResponse.data;
                          }
                          
                          // Construire les paramètres à sauvegarder avec les valeurs locales
                          const finalStoreEmail = serverParams.find(p => p.name === 'storeEmail');
                          const finalAdminEmail = serverParams.find(p => p.name === 'adminEmail');
                          const finalAlertStore = serverParams.find(p => p.name === 'alertStore');
                          const finalAlertAdmin = serverParams.find(p => p.name === 'alertAdmin');
                          
                          if (finalStoreEmail) {
                            paramsToSave.push({
                              _id: finalStoreEmail._id,
                              displayName: 'Email du Magasin',
                              stringValue: localStoreEmail !== undefined ? localStoreEmail : (finalStoreEmail.stringValue || ''),
                              kmValue: -1
                            });
                          }
                          
                          if (finalAdminEmail) {
                            paramsToSave.push({
                              _id: finalAdminEmail._id,
                              displayName: 'Email de l\'Administrateur',
                              stringValue: localAdminEmail !== undefined ? localAdminEmail : (finalAdminEmail.stringValue || ''),
                              kmValue: -1
                            });
                          }
                          
                          if (finalAlertStore) {
                            paramsToSave.push({
                              _id: finalAlertStore._id,
                              displayName: 'Alerte au Magasin',
                              booleanValue: localAlertStore !== undefined ? localAlertStore : (finalAlertStore.booleanValue ?? false),
                              kmValue: -1
                            });
                          }
                          
                          if (finalAlertAdmin) {
                            paramsToSave.push({
                              _id: finalAlertAdmin._id,
                              displayName: 'Alerte à l\'Administrateur',
                              booleanValue: localAlertAdmin !== undefined ? localAlertAdmin : (finalAlertAdmin.booleanValue ?? false),
                              kmValue: -1
                            });
                          }
                          
                          if (paramsToSave.length === 0) {
                            toast.error('Aucun paramètre à sauvegarder');
                            return;
                          }
                          
                          console.log('📤 Sauvegarde des paramètres d\'alerte:', paramsToSave);
                          await api.put('/parameters/batch', { parameters: paramsToSave });
                          
                          // Recharger les paramètres pour avoir les valeurs à jour
                          await fetchParameters();
                          
                          toast.success('Configuration des alertes sauvegardée');
                        } catch (error) {
                          console.error('❌ Erreur lors de la sauvegarde:', error);
                          toast.error('Erreur lors de la sauvegarde des alertes: ' + (error.response?.data?.error || error.message));
                        } finally {
                          setSaving(false);
                        }
                      }}
                      disabled={saving}
                    >
                      {saving ? '💾 Sauvegarde...' : '💾 Sauvegarder la configuration des alertes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Configuration Demande d'Acompte */}
            <div className="card">
              <div className="card-header">
                <h3>💰 Configuration Demande d'Acompte</h3>
                <p>Sélectionnez les salariés qui peuvent accéder à la demande d'acompte dans leur dashboard</p>
              </div>
              <div className="card-body">
                {loadingEmployees ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="spinner"></div>
                    <p>Chargement des employés...</p>
                  </div>
                ) : (
                  <>
                    <div className="email-config">
                      <div className="email-input-group">
                        <label>👥 Sélectionnez les salariés autorisés :</label>
                        <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '8px', padding: '1rem', marginTop: '0.5rem' }}>
                          {employees.length === 0 ? (
                            <p style={{ color: '#666', fontStyle: 'italic' }}>Aucun employé trouvé</p>
                          ) : (
                            employees.map((employee) => {
                              const advanceParam = parameters.find(p => p.name === 'enableEmployeeAdvanceRequest');
                              const allowedEmployees = advanceParam?.stringValue ? JSON.parse(advanceParam.stringValue || '[]') : [];
                              const isChecked = allowedEmployees.includes(employee._id);
                              
                              return (
                                <label key={employee._id} className="checkbox-option" style={{ display: 'block', marginBottom: '0.75rem', padding: '0.5rem', borderRadius: '4px', backgroundColor: isChecked ? '#f0f8ff' : 'transparent' }}>
                                  <input 
                                    type="checkbox" 
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const param = parameters.find(p => p.name === 'enableEmployeeAdvanceRequest');
                                      if (!param) return;
                                      
                                      let allowedEmployees = param.stringValue ? JSON.parse(param.stringValue || '[]') : [];
                                      
                                      if (e.target.checked) {
                                        if (!allowedEmployees.includes(employee._id)) {
                                          allowedEmployees.push(employee._id);
                                        }
                                      } else {
                                        allowedEmployees = allowedEmployees.filter(id => id !== employee._id);
                                      }
                                      
                                      handleParameterChange(param._id, 'stringValue', JSON.stringify(allowedEmployees));
                                    }}
                                  />
                                  <span style={{ marginLeft: '0.5rem' }}>
                                    {employee.name} {employee.email ? `(${employee.email})` : ''}
                                  </span>
                                </label>
                              );
                            })
                          )}
                        </div>
                        <small className="form-text text-muted" style={{ marginTop: '0.5rem', display: 'block' }}>
                          Seuls les salariés sélectionnés pourront voir et utiliser la demande d'acompte dans leur dashboard.
                        </small>
                      </div>
                    </div>
                    <div className="email-actions" style={{ marginTop: '1.5rem' }}>
                      <button 
                        className="btn btn-primary"
                        onClick={async () => {
                          try {
                            const advanceParam = parameters.find(p => p.name === 'enableEmployeeAdvanceRequest');
                            if (!advanceParam) {
                              toast.error('Paramètre de demande d\'acompte non trouvé');
                              return;
                            }
                            
                            const paramData = [{
                              _id: advanceParam._id,
                              displayName: advanceParam.displayName,
                              stringValue: advanceParam.stringValue || '[]',
                              kmValue: advanceParam.kmValue
                            }];
                            
                            console.log('📤 Sauvegarde du paramètre d\'acompte:', paramData);
                            await api.put('/parameters/batch', { parameters: paramData });
                            toast.success('Configuration de la demande d\'acompte sauvegardée');
                          } catch (error) {
                            console.error('❌ Erreur lors de la sauvegarde:', error);
                            toast.error('Erreur lors de la sauvegarde de la configuration');
                          }
                        }}
                      >
                        💾 Sauvegarder la configuration
                      </button>
                    </div>
                  </>
                )}
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
                  <div className="email-config">
                    <div className="email-input-group">
                      <label htmlFor="accountantEmail">📧 Email du comptable :</label>
                      <input
                        type="email"
                        id="accountantEmail"
                        value={parameters.find(p => p.name === 'accountantEmail')?.stringValue || ''}
                        onChange={(e) => {
                          const emailParam = parameters.find(p => p.name === 'accountantEmail');
                          if (emailParam) {
                            // Le paramètre existe, mettre à jour normalement
                            const updatedParams = parameters.map(p => 
                              p.name === 'accountantEmail' 
                                ? { ...p, stringValue: e.target.value }
                                : p
                            );
                            setParameters(updatedParams);
                          } else {
                            // Le paramètre n'existe pas encore, le créer temporairement
                            const newParam = {
                              name: 'accountantEmail',
                              displayName: 'Email du Comptable',
                              stringValue: e.target.value,
                              kmValue: -1,
                              _id: `temp-${Date.now()}` // ID temporaire pour l'UI
                            };
                            setParameters([...parameters, newParam]);
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
                            setSaving(true);
                            
                            // Récupérer les paramètres depuis le serveur (cela créera les paramètres manquants automatiquement)
                            const response = await api.get('/parameters');
                            let serverParams = response.data;
                            
                            // Récupérer la valeur modifiée dans l'interface
                            const localAccountantEmail = parameters.find(p => p.name === 'accountantEmail')?.stringValue;
                            
                            // Vérifier si le paramètre existe
                            let accountantParam = serverParams.find(p => p.name === 'accountantEmail');
                            if (!accountantParam) {
                              // Recharger pour que le backend crée le paramètre manquant
                              const refreshResponse = await api.get('/parameters');
                              serverParams = refreshResponse.data;
                              accountantParam = serverParams.find(p => p.name === 'accountantEmail');
                            }
                            
                            if (!accountantParam) {
                              toast.error('Impossible de créer le paramètre email comptable');
                              return;
                            }
                            
                            const paramToSave = {
                              _id: accountantParam._id,
                              displayName: 'Email du Comptable',
                              stringValue: localAccountantEmail !== undefined ? localAccountantEmail : (accountantParam.stringValue || ''),
                              kmValue: -1
                            };
                            
                            console.log('📤 Sauvegarde de l\'email comptable:', paramToSave);
                            await api.put('/parameters/batch', { parameters: [paramToSave] });
                            
                            // Recharger les paramètres pour avoir les valeurs à jour
                            await fetchParameters();
                            
                            toast.success('Email du comptable sauvegardé');
                          } catch (error) {
                            console.error('❌ Erreur lors de la sauvegarde:', error);
                            toast.error('Erreur lors de la sauvegarde de l\'email: ' + (error.response?.data?.error || error.message));
                          } finally {
                            setSaving(false);
                          }
                        }}
                        disabled={saving}
                      >
                        {saving ? '💾 Sauvegarde...' : '💾 Sauvegarder l\'email du comptable'}
                      </button>
                    </div>
                  </div>
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
                            {template.name === 'employee_password' && '🔐 Mot de Passe Salarié'}
                            {template.name === 'advance_request_employee' && '💰 Confirmation Acompte'}
                            {template.name === 'advance_request_manager' && '🔔 Alerte Acompte'}
                            {template.name === 'advance_approved' && '✅ Validation Acompte'}
                            {template.name === 'advance_rejected' && '❌ Rejet Acompte'}
                            {template.name === 'mutuelle_acknowledgement' && '📧 Accusé Mutuelle'}
                            {template.name === 'mutuelle_alert' && '🚨 Alerte Mutuelle'}
                            {template.name === 'mutuelle_validation' && '✅ Validation Mutuelle'}
                            {template.name === 'mutuelle_rejection' && '❌ Rejet Mutuelle'}
                            {template.name === 'mutuelle_reminder' && '⏰ Rappel Mutuelle'}
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

        {/* Onglet: Marges des Objectifs */}
        {activeTab === 'objectives' && (
          <div className="card">
            <div className="card-header">
              <h3>🎯 Marges des Objectifs Hebdomadaires</h3>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>
                <p style={{ marginBottom: '15px', fontWeight: '600' }}>Configuration des seuils de performance :</p>
                <ul style={{ marginLeft: '20px', lineHeight: '1.8' }}>
                  <li><strong style={{ color: '#28a745' }}>Vert :</strong> 100% ou plus</li>
                  <li><strong style={{ color: '#ffc107' }}>Jaune :</strong> 80% à moins de 100%</li>
                  <li><strong style={{ color: '#ff9800' }}>Orange :</strong> 50% à moins de 80%</li>
                  <li><strong style={{ color: '#dc3545' }}>Rouge :</strong> 0% à moins de 50%</li>
                </ul>
              </div>

              <div className="form-group" style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>
                  <span style={{ color: '#28a745', fontSize: '1.2rem' }}>●</span> Seuil Vert (minimum) :
                </label>
                <input
                  type="number"
                  value={marges.vert}
                  onChange={(e) => setMarges({ ...marges, vert: parseFloat(e.target.value) || 100 })}
                  min="0"
                  max="200"
                  style={{
                    width: '200px',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '2px solid #28a745',
                    fontSize: '1rem'
                  }}
                />
                <span style={{ marginLeft: '10px', color: '#666' }}>%</span>
              </div>

              <div className="form-group" style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>
                  <span style={{ color: '#ffc107', fontSize: '1.2rem' }}>●</span> Seuil Jaune (minimum) :
                </label>
                <input
                  type="number"
                  value={marges.jaune}
                  onChange={(e) => setMarges({ ...marges, jaune: parseFloat(e.target.value) || 80 })}
                  min="0"
                  max="100"
                  style={{
                    width: '200px',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '2px solid #ffc107',
                    fontSize: '1rem'
                  }}
                />
                <span style={{ marginLeft: '10px', color: '#666' }}>%</span>
              </div>

              <div className="form-group" style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>
                  <span style={{ color: '#ff9800', fontSize: '1.2rem' }}>●</span> Seuil Orange (minimum) :
                </label>
                <input
                  type="number"
                  value={marges.orange}
                  onChange={(e) => setMarges({ ...marges, orange: parseFloat(e.target.value) || 50 })}
                  min="0"
                  max="80"
                  style={{
                    width: '200px',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '2px solid #ff9800',
                    fontSize: '1rem'
                  }}
                />
                <span style={{ marginLeft: '10px', color: '#666' }}>%</span>
              </div>

              <div style={{ marginTop: '30px' }}>
                <button
                  className="btn btn-primary"
                  onClick={saveMarges}
                  disabled={savingMarges}
                >
                  {savingMarges ? '💾 Sauvegarde...' : '💾 Enregistrer les marges'}
                </button>
              </div>
            </div>
          </div>
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

          {/* Vérification des mises à jour de sécurité */}
          <div className="maintenance-check" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid #eee' }}>
            <h4>🔒 Vérification des Mises à Jour</h4>
            <p style={{ marginBottom: '1rem', color: '#666' }}>
              Vérifiez les vulnérabilités de sécurité et les mises à jour disponibles pour les dépendances
            </p>
            
            <button
              className="btn btn-primary"
              onClick={checkMaintenance}
              disabled={checkingMaintenance}
              style={{ marginBottom: '1rem' }}
            >
              {checkingMaintenance ? '🔍 Vérification en cours...' : '🔍 Vérifier les Mises à Jour'}
            </button>

            {maintenanceCheck && (
              <div className="maintenance-results" style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                {maintenanceCheck.error ? (
                  <div style={{ color: '#d32f2f' }}>
                    <strong>❌ Erreur:</strong> {maintenanceCheck.error}
                    <p style={{ fontSize: '0.9em', marginTop: '0.5rem' }}>
                      La vérification nécessite npm install dans les répertoires backend et frontend.
                      Cette fonctionnalité fonctionne mieux en développement local.
                    </p>
                  </div>
                ) : (
                  <>
                    {maintenanceCheck.summary && (
                      <div style={{ marginBottom: '1rem', padding: '1rem', borderRadius: '4px', backgroundColor: maintenanceCheck.summary.status === 'critical' ? '#ffebee' : maintenanceCheck.summary.status === 'warning' ? '#fff3e0' : '#e8f5e9' }}>
                        <h5 style={{ marginTop: 0 }}>
                          {maintenanceCheck.summary.status === 'critical' 
                            ? '🔴 État Critique' 
                            : maintenanceCheck.summary.status === 'warning' 
                              ? '🟡 Attention Requise' 
                              : '✅ Tout est à Jour'}
                        </h5>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                          <div>
                            <strong>Vulnérabilités Critiques:</strong>
                            <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: maintenanceCheck.summary.totalCriticalVulnerabilities > 0 ? '#d32f2f' : '#4caf50' }}>
                              {maintenanceCheck.summary.totalCriticalVulnerabilities}
                            </div>
                          </div>
                          <div>
                            <strong>Vulnérabilités Élevées:</strong>
                            <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: maintenanceCheck.summary.totalHighVulnerabilities > 0 ? '#f57c00' : '#4caf50' }}>
                              {maintenanceCheck.summary.totalHighVulnerabilities}
                            </div>
                          </div>
                          <div>
                            <strong>Packages Obsolètes:</strong>
                            <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
                              {maintenanceCheck.summary.totalOutdatedPackages}
                            </div>
                          </div>
                        </div>
                        {maintenanceCheck.summary.requiresAction && (
                          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #ff9800' }}>
                            <strong>⚠️ Action recommandée:</strong> Des mises à jour de sécurité sont nécessaires pour garantir la sécurité de l'application.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Détails Backend */}
                    {maintenanceCheck.backend && (
                      <div style={{ marginBottom: '1rem' }}>
                        <h5>🔧 Backend</h5>
                        {maintenanceCheck.backend.vulnerabilities.length > 0 && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <strong style={{ color: '#d32f2f' }}>Vulnérabilités ({maintenanceCheck.backend.vulnerabilities.length}):</strong>
                            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                              {maintenanceCheck.backend.vulnerabilities.slice(0, 5).map((vuln, idx) => (
                                <li key={idx} style={{ marginBottom: '0.25rem' }}>
                                  <strong>{vuln.name}</strong> ({vuln.severity}) - {vuln.title}
                                </li>
                              ))}
                              {maintenanceCheck.backend.vulnerabilities.length > 5 && (
                                <li>... et {maintenanceCheck.backend.vulnerabilities.length - 5} autres</li>
                              )}
                            </ul>
                          </div>
                        )}
                        {maintenanceCheck.backend.outdated.length > 0 && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <strong>Packages obsolètes ({maintenanceCheck.backend.outdated.length}):</strong>
                            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                              {maintenanceCheck.backend.outdated.slice(0, 5).map((pkg, idx) => (
                                <li key={idx} style={{ marginBottom: '0.25rem' }}>
                                  <strong>{pkg.name}</strong>: {pkg.current} → {pkg.latest}
                                </li>
                              ))}
                              {maintenanceCheck.backend.outdated.length > 5 && (
                                <li>... et {maintenanceCheck.backend.outdated.length - 5} autres</li>
                              )}
                            </ul>
                          </div>
                        )}
                        {maintenanceCheck.backend.vulnerabilities.length === 0 && maintenanceCheck.backend.outdated.length === 0 && (
                          <p style={{ color: '#4caf50' }}>✅ Aucun problème détecté</p>
                        )}
                      </div>
                    )}

                    {/* Détails Frontend */}
                    {maintenanceCheck.frontend && (
                      <div>
                        <h5>🎨 Frontend</h5>
                        {maintenanceCheck.frontend.vulnerabilities.length > 0 && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <strong style={{ color: '#d32f2f' }}>Vulnérabilités ({maintenanceCheck.frontend.vulnerabilities.length}):</strong>
                            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                              {maintenanceCheck.frontend.vulnerabilities.slice(0, 5).map((vuln, idx) => (
                                <li key={idx} style={{ marginBottom: '0.25rem' }}>
                                  <strong>{vuln.name}</strong> ({vuln.severity}) - {vuln.title}
                                </li>
                              ))}
                              {maintenanceCheck.frontend.vulnerabilities.length > 5 && (
                                <li>... et {maintenanceCheck.frontend.vulnerabilities.length - 5} autres</li>
                              )}
                            </ul>
                          </div>
                        )}
                        {maintenanceCheck.frontend.outdated.length > 0 && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <strong>Packages obsolètes ({maintenanceCheck.frontend.outdated.length}):</strong>
                            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                              {maintenanceCheck.frontend.outdated.slice(0, 5).map((pkg, idx) => (
                                <li key={idx} style={{ marginBottom: '0.25rem' }}>
                                  <strong>{pkg.name}</strong>: {pkg.current} → {pkg.latest}
                                </li>
                              ))}
                              {maintenanceCheck.frontend.outdated.length > 5 && (
                                <li>... et {maintenanceCheck.frontend.outdated.length - 5} autres</li>
                              )}
                            </ul>
                          </div>
                        )}
                        {maintenanceCheck.frontend.vulnerabilities.length === 0 && maintenanceCheck.frontend.outdated.length === 0 && (
                          <p style={{ color: '#4caf50' }}>✅ Aucun problème détecté</p>
                        )}
                      </div>
                    )}

                    {maintenanceCheck.timestamp && (
                      <p style={{ fontSize: '0.85em', color: '#999', marginTop: '1rem', marginBottom: 0 }}>
                        Dernière vérification: {new Date(maintenanceCheck.timestamp).toLocaleString('fr-FR')}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
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

