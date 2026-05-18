import React, { useState, useEffect } from 'react';
import api from '../services/api';
import partnerApi from '../services/partnerApi';
import { getSiteKey } from '../config/site';
import { buildFlourStocksStatusClient } from '../utils/flourStockStatus';
import { useAuth } from '../contexts/AuthContext';

const normalizePersonName = (name) =>
  String(name || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');

const VACATION_DASHBOARD_HORIZON_DAYS = 8;

const buildVacationEmployeesFromRequests = (employeesList, validatedRequests) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayMs = 1000 * 60 * 60 * 24;
  const byEmployeeId = new Map();
  const requests = Array.isArray(validatedRequests) ? validatedRequests : [];

  for (const req of requests) {
    if (req.status && req.status !== 'validated') continue;
    const emp = employeesList.find(
      (e) => normalizePersonName(e.name) === normalizePersonName(req.employeeName)
    );
    if (!emp) continue;

    const startDate = new Date(req.startDate);
    const endDate = new Date(req.endDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    if (endDate < today) continue;

    const daysUntil = Math.floor((startDate - today) / dayMs);
    const isActive = today >= startDate && today <= endDate;
    if (!isActive && daysUntil > VACATION_DASHBOARD_HORIZON_DAYS) continue;

    const key = String(emp._id);
    const score = isActive ? 1000 - daysUntil : 500 - daysUntil;
    const existing = byEmployeeId.get(key);
    if (!existing || score > existing.score) {
      byEmployeeId.set(key, {
        emp,
        score,
        vacation: {
          isOnVacation: isActive,
          startDate: req.startDate,
          endDate: req.endDate,
          vacationRequestId: req._id
        }
      });
    }
  }

  return Array.from(byEmployeeId.values())
    .map(({ emp, vacation }) => ({ ...emp, vacation }))
    .sort((a, b) => new Date(a.vacation.startDate) - new Date(b.vacation.startDate));
};

const Dashboard = () => {
  const { isAdmin, user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [validatedVacations, setValidatedVacations] = useState([]);
  const [sickLeaves, setSickLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingObligations, setPendingObligations] = useState([]);
  const [lossesStats, setLossesStats] = useState(null);
  const [printingRecup, setPrintingRecup] = useState(false);
  const [vehicleSummary, setVehicleSummary] = useState(null);
  const [vehicleSummaryLoading, setVehicleSummaryLoading] = useState(false);
  const [accountDepositRemise, setAccountDepositRemise] = useState(null);
  const [accountDepositRemiseLoading, setAccountDepositRemiseLoading] = useState(false);
  /** Compteurs pour le widget « Actions en attente » (acomptes, congés, arrêts maladie) */
  const [pendingActions, setPendingActions] = useState({
    advance: 0,
    vacation: 0,
    sickLeave: 0,
    loading: false
  });
  const [partnerOrdersPending, setPartnerOrdersPending] = useState({ count: 0, loading: false });
  const [flourStocksWidget, setFlourStocksWidget] = useState({
    loading: false,
    items: [],
    error: null,
    lastEntryAt: null,
    lastFullCountAt: null,
    updatedByName: '',
    physicalCountDue: false,
    physicalCountIntervalDays: 5,
    daysSinceFullCount: null,
    daysUntilCountDue: null
  });
  /** false = uniquement farines rouges ; true = toutes */
  const [flourStocksShowAll, setFlourStocksShowAll] = useState(false);

  // Détecter si on est sur Longuenesse ou Arras
  const siteKey = getSiteKey(); // 'lon' | 'plan' (fallback persistant)
  const isLonguenesse = siteKey === 'lon';
  const isArras = siteKey === 'plan';
  const shouldShowLosses = isLonguenesse || isArras;
  const shouldShowVehicleRecap = shouldShowLosses;

  useEffect(() => {
    fetchDashboardData();
    fetchPendingObligations();
    fetchSickLeaves();
    if (shouldShowLosses) {
      fetchLossesStats();
    }
    if (shouldShowVehicleRecap) {
      fetchVehicleSummary();
      fetchAccountDepositRemise();
    }
    if (shouldShowLosses && isAdmin()) {
      fetchPendingActionsCounts();
    }
    fetchPartnerOrdersPending();
    if (shouldShowLosses) {
      fetchFlourStocksWidget();
    }
  }, [shouldShowLosses, shouldShowVehicleRecap, user?.role]);

  const applyFlourWidgetFromStatusPayload = (payload) => {
    const items = Array.isArray(payload?.data) ? payload.data : [];
    const meta = payload?.meta || {};
    setFlourStocksWidget({
      loading: false,
      items,
      error: null,
      lastEntryAt: meta.lastEntryAt || null,
      lastFullCountAt: meta.lastFullCountAt || null,
      updatedByName: String(meta.updatedByName || '').trim(),
      physicalCountDue: meta.physicalCountDue === true,
      physicalCountIntervalDays: meta.physicalCountIntervalDays ?? 5,
      daysSinceFullCount: meta.daysSinceFullCount ?? null,
      daysUntilCountDue: meta.daysUntilCountDue ?? null
    });
  };

  const fetchFlourStocksWidgetFallback = async (siteKey) => {
    const [cfgRes, invRes, paramsRes] = await Promise.all([
      api.get('/stocks/flours/config', { params: { siteKey } }),
      api.get('/stocks/flours/inventory', { params: { siteKey } }),
      api.get('/parameters')
    ]);
    const configs = Array.isArray(cfgRes.data?.data) ? cfgRes.data.data : [];
    const inventory = invRes.data?.data || { items: [] };
    if (invRes.data?.meta) {
      const built = buildFlourStocksStatusClient({
        configs,
        inventory,
        countIntervalDays: invRes.data.meta.physicalCountIntervalDays ?? 5
      });
      applyFlourWidgetFromStatusPayload({ data: built.items, meta: invRes.data.meta });
      return;
    }
    const params = Array.isArray(paramsRes.data) ? paramsRes.data : [];
    const sacksPerPalletName = `whiteFlourSacksPerPallet_${siteKey}`;
    const sacksPerPalletRaw = params.find((p) => p.name === sacksPerPalletName)?.stringValue;
    const sacksPerPalletNum = Number(String(sacksPerPalletRaw || '').trim());
    const sacksPerPallet = Number.isFinite(sacksPerPalletNum) && sacksPerPalletNum > 0 ? sacksPerPalletNum : 50;
    const intervalName = `flourPhysicalCountIntervalDays_${siteKey}`;
    const intervalRaw = params.find((p) => p.name === intervalName)?.stringValue;
    const countIntervalDays = Number(String(intervalRaw || '5').trim()) || 5;
    const built = buildFlourStocksStatusClient({ configs, inventory, sacksPerPallet, countIntervalDays });
    applyFlourWidgetFromStatusPayload({ data: built.items, meta: built.meta });
  };

  const fetchFlourStocksWidget = async () => {
    setFlourStocksWidget((s) => ({
      ...s,
      loading: true,
      error: null
    }));
    const siteKey = getSiteKey();
    try {
      const res = await api.get('/stocks/flours/status', { params: { siteKey } });
      applyFlourWidgetFromStatusPayload(res.data);
    } catch (e) {
      console.warn('Widget farines : repli config/inventaire', e.response?.status || e.message);
      try {
        await fetchFlourStocksWidgetFallback(siteKey);
      } catch (e2) {
        console.error('Erreur widget stocks farines (repli):', e2);
        setFlourStocksWidget({
          loading: false,
          items: [],
          error: 'Erreur chargement stocks farines',
          lastEntryAt: null,
          lastFullCountAt: null,
          updatedByName: '',
          physicalCountDue: false,
          physicalCountIntervalDays: 5,
          daysSinceFullCount: null,
          daysUntilCountDue: null
        });
      }
    }
  };

  const formatLastStockSendLine = (iso, byName) => {
    if (!iso) {
      return 'Dernier envoi : aucun pour l’instant.';
    }
    const d = new Date(iso);
    const label = Number.isNaN(d.getTime())
      ? String(iso)
      : d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
    const dayMs = 86400000;
    const a = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const t = new Date();
    const b = new Date(t.getFullYear(), t.getMonth(), t.getDate());
    const days = Math.round((b - a) / dayMs);
    const jourTxt = days <= 0 ? "aujourd'hui" : days === 1 ? 'hier' : `il y a ${days} jours`;
    const par = byName && String(byName).trim() ? ` — par ${String(byName).trim()}` : '';
    return `Dernier envoi : ${label} (${jourTxt})${par}`;
  };

  const formatStockQty = (qty) => {
    const n = Number(qty);
    if (!Number.isFinite(n)) return '—';
    return n.toFixed(2);
  };

  const formatDailyConsumption = (daily) => {
    const n = Number(daily);
    if (!Number.isFinite(n) || n < 0) return '0';

    // Affichage en fraction si ça correspond à 1/2..1/7 (tolérance flottante)
    const eps = 1e-9;
    for (let d = 2; d <= 7; d++) {
      const v = 1 / d;
      if (Math.abs(n - v) < eps) return `1/${d}`;
    }

    // Sinon, afficher avec 2 décimales max sans zéros inutiles
    const s = n.toFixed(2);
    return s.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
  };

  const fetchPartnerOrdersPending = async () => {
    setPartnerOrdersPending((s) => ({ ...s, loading: true }));
    try {
      const site = isLonguenesse ? 'longuenesse' : 'arras';
      const res = await api.get('/partner-orders/pending-count', { params: { site } });
      const count = Number(res.data?.data?.count || 0);
      setPartnerOrdersPending({ count, loading: false });
    } catch (e) {
      console.error('Erreur pending commandes entreprises:', e);
      setPartnerOrdersPending({ count: 0, loading: false });
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [employeesResponse, vacationsResponse] = await Promise.all([
        api.get('/employees'),
        api.get('/vacation-requests', {
          params: { planning: true, status: 'validated' }
        })
      ]);

      let employeesData = null;
      if (employeesResponse.data.success && employeesResponse.data.data) {
        employeesData = employeesResponse.data.data;
      } else if (Array.isArray(employeesResponse.data)) {
        employeesData = employeesResponse.data;
      }

      if (employeesData) {
        setEmployees(employeesData);
      } else {
        setEmployees([]);
        console.error('Format de données employés invalide:', employeesResponse.data);
      }

      const vacPayload = vacationsResponse.data;
      const vacationsData = vacPayload?.success
        ? vacPayload.data
        : Array.isArray(vacPayload)
          ? vacPayload
          : [];
      setValidatedVacations(Array.isArray(vacationsData) ? vacationsData : []);
    } catch (error) {
      console.error('Erreur lors du chargement du tableau de bord:', error);
      setEmployees([]);
      setValidatedVacations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSickLeaves = async () => {
    try {
      const response = await api.get('/sick-leaves', {
        params: {
          status: 'all', // Récupérer tous les statuts
          limit: 1000 // Limite élevée pour récupérer tous les arrêts maladie
        }
      });
      
      if (response.data.success && response.data.data) {
        const allSickLeaves = response.data.data.sickLeaves || response.data.data;
        setSickLeaves(Array.isArray(allSickLeaves) ? allSickLeaves : []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des arrêts maladie:', error);
      setSickLeaves([]);
    }
  };

  const fetchPendingObligations = async () => {
    try {
      const response = await api.get('/onboarding-offboarding/pending-obligations');
      if (response.data.success && response.data.data) {
        setPendingObligations(response.data.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des obligations légales:', error);
      setPendingObligations([]);
    }
  };

  const fetchLossesStats = async () => {
    try {
      const city = isLonguenesse ? 'longuenesse' : 'arras';
      const response = await api.get('/daily-losses/dashboard', {
        params: { city }
      });
      if (response.data.success) {
        setLossesStats(response.data.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des stats pertes:', error);
      setLossesStats(null);
    }
  };

  const fetchVehicleSummary = async () => {
    try {
      setVehicleSummaryLoading(true);
      const site = isLonguenesse ? 'longuenesse' : 'arras';
      const response = await api.get('/vehicle/dashboard-summary', {
        params: { site }
      });
      if (response.data.success && response.data.data) {
        setVehicleSummary(response.data.data);
      } else {
        setVehicleSummary(null);
      }
    } catch (error) {
      console.error('Erreur récap véhicule:', error);
      setVehicleSummary(null);
    } finally {
      setVehicleSummaryLoading(false);
    }
  };

  const fetchAccountDepositRemise = async () => {
    try {
      setAccountDepositRemiseLoading(true);
      const site = isLonguenesse ? 'longuenesse' : 'arras';
      const response = await api.get('/account-deposit-remises/dashboard', { params: { site } });
      if (response.data?.success && response.data?.data) {
        setAccountDepositRemise(response.data.data);
      } else {
        setAccountDepositRemise(null);
      }
    } catch (error) {
      console.error('Erreur remise dépôts:', error);
      setAccountDepositRemise(null);
    } finally {
      setAccountDepositRemiseLoading(false);
    }
  };

  const fetchPendingActionsCounts = async () => {
    setPendingActions((s) => ({ ...s, loading: true }));
    try {
      const [advRes, vacRes, sickRes] = await Promise.all([
        api.get('/advance-requests/pending'),
        api.get('/vacation-requests', { params: { status: 'pending', limit: 1, page: 1 } }),
        api.get('/sick-leaves', { params: { status: 'pending', limit: 1, page: 1 } })
      ]);

      const advanceCount = Array.isArray(advRes.data?.data) ? advRes.data.data.length : 0;
      const vacationTotal = vacRes.data?.pagination?.total;
      const vacationCount =
        typeof vacationTotal === 'number'
          ? vacationTotal
          : Array.isArray(vacRes.data?.data)
            ? vacRes.data.data.filter((r) => r.status === 'pending').length
            : 0;
      const sickTotal = sickRes.data?.data?.pagination?.total;
      const sickCount =
        typeof sickTotal === 'number'
          ? sickTotal
          : Array.isArray(sickRes.data?.data?.sickLeaves)
            ? sickRes.data.data.sickLeaves.length
            : 0;

      setPendingActions({
        advance: advanceCount,
        vacation: vacationCount,
        sickLeave: sickCount,
        loading: false
      });
    } catch (error) {
      console.error('Erreur chargement actions en attente:', error);
      setPendingActions({ advance: 0, vacation: 0, sickLeave: 0, loading: false });
    }
  };

  // Impression Heures de Récup (Longuenesse uniquement)
  const getMonday = (date) => {
    const ref = new Date(date);
    const day = ref.getDay() || 7;
    if (day !== 1) ref.setDate(ref.getDate() - (day - 1));
    ref.setHours(0, 0, 0, 0);
    return ref;
  };

  const handlePrintRecupHours = async () => {
    try {
      setPrintingRecup(true);
      const weekStart = getMonday(new Date()).toISOString().split('T')[0];
      const response = await api.get('/recup-hours', { params: { weekStart } });
      if (!response.data?.success || !response.data?.data?.employees) {
        console.error('Données recup invalides');
        return;
      }
      const employees = [...(response.data.data.employees || [])]
        .sort((a, b) => (a.employeeName || '').localeCompare(b.employeeName || '', 'fr'));
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Heures de Récup - Impression</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { font-size: 1.4rem; margin-bottom: 1rem; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #333; padding: 8px 12px; text-align: left; }
            th { background: #f0f0f0; font-weight: bold; }
            .total { font-weight: bold; }
            .positive { color: #28a745; }
            .negative { color: #dc3545; }
          </style>
        </head>
        <body>
          <h1>Heures de Récup – Liste des salariés (Longuenesse)</h1>
          <p>Imprimé le ${new Date().toLocaleDateString('fr-FR', { dateStyle: 'full' })}</p>
          <table>
            <thead><tr><th>Salarié</th><th>Compteur (heures)</th></tr></thead>
            <tbody>
              ${employees.map((e) => {
                const h = Number(e.totalHours || 0);
                const cls = h > 0 ? 'positive' : h < 0 ? 'negative' : '';
                return `<tr><td>${(e.employeeName || '-').replace(/</g, '&lt;')}</td><td class="${cls}">${h >= 0 ? '+' : ''}${h.toFixed(2)} h</td></tr>`;
              }).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;
      const w = window.open('', '_blank');
      if (!w) {
        alert('Veuillez autoriser les pop-ups pour imprimer.');
        return;
      }
      w.document.write(printContent);
      w.document.close();
      w.focus();
      setTimeout(() => {
        w.print();
        w.close();
      }, 250);
    } catch (err) {
      console.error('Erreur impression heures récup:', err);
      alert('Erreur lors du chargement des heures de récup.');
    } finally {
      setPrintingRecup(false);
    }
  };

  const getPercentageColor = (percentage) => {
    const pct = parseFloat(percentage);
    if (pct >= 6 && pct <= 8) return '#28a745'; // vert
    if (pct < 6) return '#ff9800'; // orange
    return '#dc3545'; // rouge
  };

  // Filtrer les employés en arrêt maladie (exclure ceux repris depuis plus de 8 jours)
  // Combiner les arrêts maladie depuis employee.sickLeave et depuis l'API /sick-leaves
  const sickEmployees = employees.filter(emp => {
    // Vérifier l'ancien système (employee.sickLeave.isOnSickLeave)
    if (emp.sickLeave?.isOnSickLeave) {
      if (emp.sickLeave?.endDate) {
        const endDate = new Date(emp.sickLeave.endDate);
        const today = new Date();
        const daysSinceReturn = Math.floor((today - endDate) / (1000 * 60 * 60 * 24));
        if (daysSinceReturn > 8) return false;
      }
      return true;
    }
    
    // Vérifier les arrêts maladie depuis l'API /sick-leaves
    const employeeSickLeaves = sickLeaves.filter(sl => {
      // Comparer par nom (insensible à la casse) ou email
      const nameMatch = sl.employeeName && emp.name && 
        sl.employeeName.toLowerCase().trim() === emp.name.toLowerCase().trim();
      const emailMatch = sl.employeeEmail && emp.email && 
        sl.employeeEmail.toLowerCase().trim() === emp.email.toLowerCase().trim();
      
      return nameMatch || emailMatch;
    });
    
    // Vérifier si l'employé a un arrêt maladie actif (non rejeté, non terminé depuis plus de 8 jours)
    // Inclure les arrêts maladie pending, validated et declared (pas seulement validated)
    const activeSickLeave = employeeSickLeaves.find(sl => {
      if (sl.status === 'rejected') return false;
      
      const endDate = new Date(sl.endDate);
      const today = new Date();
      const daysSinceReturn = Math.floor((today - endDate) / (1000 * 60 * 60 * 24));
      
      // Inclure si l'arrêt est en cours ou terminé depuis moins de 8 jours
      // Inclure tous les statuts sauf rejected (pending, validated, declared)
      return daysSinceReturn <= 8;
    });
    
    return !!activeSickLeave;
  }).map(emp => {
    // Enrichir avec les données de l'arrêt maladie depuis l'API si disponible
    const employeeSickLeaves = sickLeaves.filter(sl => {
      const nameMatch = sl.employeeName && emp.name && 
        sl.employeeName.toLowerCase().trim() === emp.name.toLowerCase().trim();
      const emailMatch = sl.employeeEmail && emp.email && 
        sl.employeeEmail.toLowerCase().trim() === emp.email.toLowerCase().trim();
      return nameMatch || emailMatch;
    });
    
    // Trouver l'arrêt maladie le plus récent et actif
    // Inclure tous les statuts sauf rejected (pending, validated, declared)
    // Vérifier aussi si l'arrêt est EN COURS (aujourd'hui entre startDate et endDate)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activeSickLeave = employeeSickLeaves
      .filter(sl => {
        if (sl.status === 'rejected') return false;
        
        // Vérifier si l'arrêt est EN COURS (aujourd'hui entre startDate et endDate)
        const start = new Date(sl.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(sl.endDate);
        end.setHours(23, 59, 59, 999);
        const isCurrentlyOnSickLeave = today >= start && today <= end;
        
        // Si l'arrêt est en cours, l'inclure
        if (isCurrentlyOnSickLeave) return true;
        
        // Sinon, vérifier si l'arrêt est terminé depuis moins de 8 jours
        const daysSinceReturn = Math.floor((today - end) / (1000 * 60 * 60 * 24));
        return daysSinceReturn <= 8;
      })
      .sort((a, b) => {
        // Trier par date de fin (plus récente en premier), puis par date de création
        const aEnd = new Date(a.endDate);
        const bEnd = new Date(b.endDate);
        if (aEnd.getTime() !== bEnd.getTime()) {
          return bEnd - aEnd;
        }
        return new Date(b.uploadDate || b.createdAt || b.startDate) - new Date(a.uploadDate || a.createdAt || a.startDate);
      })[0];
    
    // Toujours utiliser l'arrêt maladie le plus récent de l'API si disponible
    // Cela permet de prendre en compte les arrêts maladie manuels créés via /plan/employees
    if (activeSickLeave) {
      // Vérifier si l'arrêt API est EN COURS (plus fiable que les données de l'employé)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const apiStart = new Date(activeSickLeave.startDate);
      apiStart.setHours(0, 0, 0, 0);
      const apiEnd = new Date(activeSickLeave.endDate);
      apiEnd.setHours(23, 59, 59, 999);
      const isApiSickLeaveActive = today >= apiStart && today <= apiEnd;
      
      // Comparer les dates pour voir si l'arrêt API est plus récent que celui de l'employé
      const apiEndDate = new Date(activeSickLeave.endDate);
      const existingEndDate = emp.sickLeave?.endDate ? new Date(emp.sickLeave.endDate) : null;
      
      // Debug: Log pour Camille CASTEL
      if (emp.name && emp.name.toLowerCase().includes('camille')) {
        console.log('🔍 Debug Camille:', {
          name: emp.name,
          activeSickLeave: {
            startDate: activeSickLeave.startDate,
            endDate: activeSickLeave.endDate,
            status: activeSickLeave.status
          },
          existingSickLeave: emp.sickLeave,
          isApiSickLeaveActive,
          today: today.toISOString(),
          apiStart: apiStart.toISOString(),
          apiEnd: apiEnd.toISOString()
        });
      }
      
      // Utiliser l'arrêt API si :
      // 1. L'arrêt API est EN COURS (priorité absolue)
      // 2. L'employé n'a pas d'arrêt existant
      // 3. L'arrêt API est plus récent (date de fin plus récente)
      if (isApiSickLeaveActive || !existingEndDate || apiEndDate >= existingEndDate) {
        return {
          ...emp,
          sickLeave: {
            isOnSickLeave: true,
            startDate: activeSickLeave.startDate,
            endDate: activeSickLeave.endDate,
            therapeuticPartTime: !!activeSickLeave.therapeuticPartTime
          }
        };
      }
    }
    
    // Si l'employé a déjà un arrêt maladie et qu'on n'a pas trouvé d'arrêt API plus récent, utiliser celui de l'employé
    return emp;
  });

  // Congés validés (même source que le planning), fenêtre 8 jours avant le début ou en cours
  const vacationEmployees = buildVacationEmployeesFromRequests(employees, validatedVacations);

  // Filtrer les employés mineurs (âge < 18)
  const minorEmployees = employees.filter(emp => emp.age < 18);

  // Filtrer les apprentis
  const apprenticeEmployees = employees.filter(emp => emp.contractType === 'Apprentissage');

  // Formater une date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  };

  // Calculer les jours jusqu'à une date
  const calculateDaysUntil = (dateString) => {
    if (!dateString) return 0;
    const targetDate = new Date(dateString);
    const today = new Date();
    const diffTime = targetDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading"></div>
          <p>Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>📊 Tableau de bord</h2>
        {isLonguenesse && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handlePrintRecupHours}
            disabled={printingRecup}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {printingRecup ? '⏳ Chargement...' : '🖨️ Impression Heures de Récup'}
          </button>
        )}
      </div>

      {/* Widget Pertes Invendus/Dons - Longuenesse et Arras */}
      {shouldShowLosses && lossesStats && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>📉 Statistiques Pertes (Invendus/Dons)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {lossesStats.jour && (
              <div style={{ 
                textAlign: 'center', 
                padding: '1rem', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px',
                border: '2px solid ' + getPercentageColor(lossesStats.jour.pourcentage)
              }}>
                <h4 style={{ color: '#666', fontSize: '0.9rem', marginBottom: '10px' }}>Jour passé</h4>
                <div style={{ 
                  fontSize: '2rem', 
                  fontWeight: 'bold',
                  color: getPercentageColor(lossesStats.jour.pourcentage)
                }}>
                  {lossesStats.jour.pourcentage.toFixed(2)}%
                </div>
                <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '5px' }}>
                  {lossesStats.jour.totalPertes.toFixed(2)}€ / {lossesStats.jour.totalVentes.toFixed(2)}€
                </p>
              </div>
            )}
            <div style={{ 
              textAlign: 'center', 
              padding: '1rem', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              border: '2px solid ' + getPercentageColor(lossesStats.semaine.pourcentage)
            }}>
              <h4 style={{ color: '#666', fontSize: '0.9rem', marginBottom: '10px' }}>Cumul Semaine</h4>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: 'bold',
                color: getPercentageColor(lossesStats.semaine.pourcentage)
              }}>
                {lossesStats.semaine.pourcentage.toFixed(2)}%
              </div>
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '5px' }}>
                {lossesStats.semaine.totalPertes.toFixed(2)}€ / {lossesStats.semaine.totalVentes.toFixed(2)}€
              </p>
            </div>
            <div style={{ 
              textAlign: 'center', 
              padding: '1rem', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              border: '2px solid ' + getPercentageColor(lossesStats.mois.pourcentage)
            }}>
              <h4 style={{ color: '#666', fontSize: '0.9rem', marginBottom: '10px' }}>Cumul Mois</h4>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: 'bold',
                color: getPercentageColor(lossesStats.mois.pourcentage)
              }}>
                {lossesStats.mois.pourcentage.toFixed(2)}%
              </div>
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '5px' }}>
                {lossesStats.mois.totalPertes.toFixed(2)}€ / {lossesStats.mois.totalVentes.toFixed(2)}€
              </p>
            </div>
          </div>
          <div style={{ marginTop: '15px', textAlign: 'center' }}>
            <a href={isLonguenesse ? "/lon/daily-losses-entry.html" : "/plan/daily-losses-entry.html"} target="_blank" style={{
              display: 'inline-block',
              padding: '10px 20px',
              backgroundColor: '#667eea',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600'
            }}>
              📊 Ouvrir la page de saisie
            </a>
          </div>
        </div>
      )}

      {/* Actions en attente (acomptes, congés, arrêts maladie) — admins uniquement, Longuenesse et Arras */}
      {shouldShowLosses && isAdmin() && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>📌 Actions en attente</h3>
          {pendingActions.loading ? (
            <p style={{ color: '#666' }}>Chargement…</p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem'
              }}
            >
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  border: `2px solid ${pendingActions.advance > 0 ? '#ffc107' : '#c3e6cb'}`,
                  backgroundColor: pendingActions.advance > 0 ? '#fff8e6' : '#f8fff9'
                }}
              >
                <div style={{ fontSize: '0.85rem', color: '#555', marginBottom: '0.35rem' }}>
                  Demandes d&apos;acompte
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: pendingActions.advance > 0 ? '#856404' : '#155724' }}>
                  {pendingActions.advance}
                </div>
                <a
                  href={isLonguenesse ? '/lon/advance-requests' : '/plan/advance-requests'}
                  style={{
                    display: 'inline-block',
                    marginTop: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#667eea'
                  }}
                >
                  Traiter les acomptes →
                </a>
              </div>
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  border: `2px solid ${pendingActions.vacation > 0 ? '#ffc107' : '#c3e6cb'}`,
                  backgroundColor: pendingActions.vacation > 0 ? '#fff8e6' : '#f8fff9'
                }}
              >
                <div style={{ fontSize: '0.85rem', color: '#555', marginBottom: '0.35rem' }}>
                  Demandes de congés
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: pendingActions.vacation > 0 ? '#856404' : '#155724' }}>
                  {pendingActions.vacation}
                </div>
                <a
                  href={isLonguenesse ? '/lon/vacation-management' : '/plan/vacation-management'}
                  style={{
                    display: 'inline-block',
                    marginTop: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#667eea'
                  }}
                >
                  Traiter les congés →
                </a>
              </div>
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  border: `2px solid ${pendingActions.sickLeave > 0 ? '#ffc107' : '#c3e6cb'}`,
                  backgroundColor: pendingActions.sickLeave > 0 ? '#fff8e6' : '#f8fff9'
                }}
              >
                <div style={{ fontSize: '0.85rem', color: '#555', marginBottom: '0.35rem' }}>
                  Arrêts maladie à valider
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: pendingActions.sickLeave > 0 ? '#856404' : '#155724' }}>
                  {pendingActions.sickLeave}
                </div>
                <a
                  href={isLonguenesse ? '/lon/sick-leave-management' : '/plan/sick-leave-management'}
                  style={{
                    display: 'inline-block',
                    marginTop: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#667eea'
                  }}
                >
                  Traiter les arrêts maladie →
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stocks farines — Longuenesse et Arras */}
      {shouldShowLosses && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 240px', minWidth: 0 }}>
              <h3 style={{ margin: 0 }}>📦 Stocks farines</h3>
              <div style={{ marginTop: 6, fontSize: '0.9rem', color: '#555', lineHeight: 1.35 }}>
                {formatLastStockSendLine(
                  flourStocksWidget.lastFullCountAt || flourStocksWidget.lastEntryAt,
                  flourStocksWidget.updatedByName
                )}
                {flourStocksWidget.lastFullCountAt ? ' (inventaire complet)' : ''}
              </div>
              <div style={{ marginTop: 4, fontSize: '0.85rem', color: '#666', lineHeight: 1.35 }}>
                Stock théorique : conso/j déduite chaque jour — inventaire physique tous les{' '}
                {flourStocksWidget.physicalCountIntervalDays} jours.
              </div>
            </div>
            {isAdmin() && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <a
                  href={isLonguenesse ? '/lon/stocks' : '/plan/stocks'}
                  style={{ fontSize: '0.9rem', fontWeight: 700, color: '#667eea', whiteSpace: 'nowrap' }}
                >
                  Paramètres stocks →
                </a>
                <a
                  href={isLonguenesse ? '/lon/stocks?tab=historique' : '/plan/stocks?tab=historique'}
                  style={{ fontSize: '0.85rem', fontWeight: 600, color: '#555', whiteSpace: 'nowrap' }}
                >
                  Historique des envois →
                </a>
              </div>
            )}
          </div>

          {!flourStocksWidget.loading && !flourStocksWidget.error && flourStocksWidget.physicalCountDue && (
            <div
              style={{
                marginTop: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                background: '#fff3cd',
                border: '1px solid #ffc107',
                color: '#856404',
                fontSize: '0.92rem',
                lineHeight: 1.4
              }}
            >
              <strong>Inventaire physique à faire</strong>
              {typeof flourStocksWidget.daysSinceFullCount === 'number' ? (
                <> — dernier inventaire complet il y a {flourStocksWidget.daysSinceFullCount} j.</>
              ) : null}{' '}
              Saisissez le stock réel de toutes les farines (
              <a
                href={isLonguenesse ? '/lon/stocks-farines-standalone.html' : '/plan/stocks-farines-standalone.html'}
                style={{ fontWeight: 700, color: '#664d03' }}
              >
                page stocks farines
              </a>
              , mode « Envoi complet »).
            </div>
          )}

          {!flourStocksWidget.loading &&
            !flourStocksWidget.error &&
            !flourStocksWidget.physicalCountDue &&
            typeof flourStocksWidget.daysUntilCountDue === 'number' &&
            flourStocksWidget.daysUntilCountDue > 0 && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.88rem', color: '#555' }}>
                Prochain inventaire physique dans {flourStocksWidget.daysUntilCountDue} jour
                {flourStocksWidget.daysUntilCountDue > 1 ? 's' : ''}.
              </p>
            )}

          {flourStocksWidget.loading ? (
            <p style={{ color: '#666' }}>Chargement…</p>
          ) : flourStocksWidget.error ? (
            <p style={{ color: '#856404' }}>{flourStocksWidget.error}</p>
          ) : flourStocksWidget.items.length === 0 ? (
            <p style={{ color: '#666' }}>Aucune farine configurée.</p>
          ) : (() => {
            const allItems = flourStocksWidget.items;
            const redItems = allItems.filter((it) => it.status === 'red');
            const visibleItems = flourStocksShowAll ? allItems : redItems;
            const hasNonRed = allItems.some((it) => it.status !== 'red');

            return (
              <>
                <div style={{ marginTop: '0.5rem', fontSize: '0.88rem', color: '#444', lineHeight: 1.4 }}>
                  {flourStocksShowAll ? (
                    <>
                      Affichage : <strong>toutes les farines</strong> ({allItems.length})
                    </>
                  ) : redItems.length === 0 ? (
                    <>
                      Affichage : <strong>alertes rouges uniquement</strong> — aucune parmi les {allItems.length} farine
                      {allItems.length > 1 ? 's' : ''} au catalogue.
                    </>
                  ) : redItems.length === allItems.length ? (
                    <>
                      Affichage : <strong>alertes rouges uniquement</strong> — les {allItems.length} farine
                      {allItems.length > 1 ? 's sont' : ' est'} en alerte critique (liste complète affichée).
                    </>
                  ) : (
                    <>
                      Affichage : <strong>alertes rouges uniquement</strong> ({redItems.length} sur {allItems.length}{' '}
                      farine{allItems.length > 1 ? 's' : ''}).
                    </>
                  )}
                </div>
                {hasNonRed && (
                  <div style={{ marginTop: '0.65rem' }}>
                    <button
                      type="button"
                      onClick={() => setFlourStocksShowAll((v) => !v)}
                      style={{
                        padding: '0.45rem 0.85rem',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        borderRadius: '8px',
                        border: '1px solid #667eea',
                        background: flourStocksShowAll ? '#f0f2ff' : '#fff',
                        color: '#667eea',
                        cursor: 'pointer'
                      }}
                    >
                      {flourStocksShowAll
                        ? 'Afficher uniquement les alertes (rouge)'
                        : 'Voir toutes les farines'}
                    </button>
                  </div>
                )}

                {!flourStocksShowAll && visibleItems.length === 0 ? (
                  <p style={{ color: '#555', marginTop: '0.75rem' }}>
                    Aucune farine en alerte critique (rouge).
                  </p>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                      gap: '0.75rem',
                      marginTop: '0.75rem'
                    }}
                  >
                    {visibleItems.map((it) => {
                const color =
                  it.status === 'green' ? '#155724' : it.status === 'orange' ? '#856404' : it.status === 'red' ? '#721c24' : '#555';
                const border =
                  it.status === 'green' ? '#c3e6cb' : it.status === 'orange' ? '#ffeeba' : it.status === 'red' ? '#f5c6cb' : '#e1e5e9';
                const bg =
                  it.status === 'green' ? '#f8fff9' : it.status === 'orange' ? '#fff8e6' : it.status === 'red' ? '#fff5f5' : '#f8f9fa';
                const days =
                  typeof it.daysRemaining === 'number' && Number.isFinite(it.daysRemaining) ? it.daysRemaining.toFixed(1) : 'N/A';
                return (
                  <div
                    key={String(it.flourConfigId)}
                    style={{
                      padding: '0.85rem',
                      borderRadius: '10px',
                      border: `2px solid ${border}`,
                      backgroundColor: bg
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                      <div style={{ fontWeight: 800 }}>{it.name}</div>
                      <div style={{ fontWeight: 800, color }}>{days} j</div>
                    </div>
                    <div style={{ marginTop: 6, fontSize: '0.9rem', color: '#555' }}>
                      Stock théorique:{' '}
                      <strong>{formatStockQty(it.stockTheoreticalSacks ?? it.stockSacksTotal)}</strong> sacs
                      {typeof it.stockPhysicalSacks === 'number' &&
                      formatStockQty(it.stockPhysicalSacks) !==
                        formatStockQty(it.stockTheoreticalSacks ?? it.stockSacksTotal) ? (
                        <> (réel saisi: {formatStockQty(it.stockPhysicalSacks)})</>
                      ) : null}
                      — Conso/j: <strong>{formatDailyConsumption(it.daily)}</strong>
                    </div>
                  </div>
                );
              })}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Commandes entreprises — admin + salarié (lecture) */}
      {shouldShowLosses && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>🚚 Commandes entreprises</h3>
          {partnerOrdersPending.loading ? (
            <p style={{ color: '#666' }}>Chargement…</p>
          ) : (
            <div
              style={{
                padding: '1rem',
                borderRadius: '8px',
                border: `2px solid ${partnerOrdersPending.count > 0 ? '#ffc107' : '#c3e6cb'}`,
                backgroundColor: partnerOrdersPending.count > 0 ? '#fff8e6' : '#f8fff9'
              }}
            >
              <div style={{ fontSize: '0.85rem', color: '#555', marginBottom: '0.35rem' }}>
                Commandes en attente (non traitées)
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: partnerOrdersPending.count > 0 ? '#856404' : '#155724' }}>
                {partnerOrdersPending.count}
              </div>
              <a
                href={isLonguenesse ? '/lon/commande-livraison' : '/plan/commande-livraison'}
                style={{
                  display: 'inline-block',
                  marginTop: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#667eea'
                }}
              >
                Voir les commandes →
              </a>
            </div>
          )}
        </div>
      )}

      {/* Récapitulatif véhicule — Longuenesse et Arras */}
      {shouldShowVehicleRecap && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>🚗 Récapitulatif véhicule</h3>
          {vehicleSummaryLoading ? (
            <p style={{ color: '#666' }}>Chargement…</p>
          ) : !vehicleSummary ? (
            <p style={{ color: '#856404' }}>Impossible de charger les données véhicule.</p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isLonguenesse ? 'minmax(0, 1fr) minmax(360px, 1fr)' : 'minmax(0, 1fr) 360px',
                gap: '1.25rem',
                alignItems: 'start'
              }}
            >
              <div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#444' }}>
                    Échéances (fenêtre de rappel)
                  </h4>
                  {vehicleSummary.rappels && vehicleSummary.rappels.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                      {vehicleSummary.rappels.map((r) => (
                        <li key={r.id} style={{ marginBottom: '0.35rem' }}>
                          <strong>{r.label}</strong> — {r.detail}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ margin: 0, color: '#6c757d' }}>
                      Aucun rappel actif : vous n’êtes pas dans la fenêtre définie (km avant révision, jours avant
                      révision / CT / renouvellement).
                    </p>
                  )}
                </div>

                {vehicleSummary.kmIncoherenceDernierTrajet && (
                  <div
                    style={{
                      marginBottom: '1rem',
                      padding: '0.65rem 0.85rem',
                      backgroundColor: '#f8d7da',
                      color: '#721c24',
                      borderRadius: '8px',
                      border: '1px solid #f5c6cb',
                      fontWeight: 600
                    }}
                  >
                    Incohérence km : le dernier trajet enregistré présente un écart (≥ 2 km) entre le km retour du
                    trajet précédent et le km départ du suivant, comme sur la page véhicule.
                  </div>
                )}

                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#444' }}>
                    Dernier trajet terminé
                  </h4>
                  {!vehicleSummary.dernierTrajet ? (
                    <p style={{ margin: 0, color: '#6c757d' }}>Aucun trajet terminé enregistré.</p>
                  ) : (
                    <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                      <li>
                        {vehicleSummary.dernierTrajet.dateRetour
                          ? `Retour le ${formatDate(vehicleSummary.dernierTrajet.dateRetour)}`
                          : `Départ le ${formatDate(vehicleSummary.dernierTrajet.dateDepart)}`}
                        {vehicleSummary.dernierTrajet.conducteur
                          ? ` — ${vehicleSummary.dernierTrajet.conducteur}`
                          : ''}
                      </li>
                      {vehicleSummary.dernierTrajet.etatsEnDessousDe5 && (
                        <li style={{ color: '#856404', fontWeight: 600 }}>
                          États &lt; 5 : intérieur {vehicleSummary.dernierTrajet.etatInterieur}/5, extérieur{' '}
                          {vehicleSummary.dernierTrajet.etatExterieur}/5 (action à prévoir)
                        </li>
                      )}
                      {vehicleSummary.dernierTrajet.pleinAFaire && (
                        <li style={{ color: '#0d6efd', fontWeight: 600 }}>Plein à faire</li>
                      )}
                      {vehicleSummary.dernierTrajet.autresChosesAFaire &&
                        vehicleSummary.dernierTrajet.autresChosesAFaire.length > 0 && (
                          <li style={{ color: '#0d6efd', fontWeight: 600 }}>
                            Chose(s) à faire : {vehicleSummary.dernierTrajet.autresChosesAFaire.join(', ')}
                          </li>
                        )}
                      <li>
                        Photo retour :{' '}
                        <strong>{vehicleSummary.dernierTrajet.photoUploadee ? 'Oui (uploadée)' : 'Non'}</strong>
                      </li>
                    </ul>
                  )}
                </div>

                <a
                  href={isLonguenesse ? '/lon/vehicle' : '/plan/vehicle'}
                  style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    backgroundColor: '#667eea',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}
                >
                  Ouvrir la page véhicule
                </a>
              </div>

              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  background: '#fff',
                  // Sur Longuenesse, la colonne de droite est plus large : on centre cette carte dans l'espace
                  maxWidth: isLonguenesse ? 360 : undefined,
                  width: isLonguenesse ? '100%' : undefined,
                  justifySelf: isLonguenesse ? 'center' : undefined
                }}
              >
                <h4 style={{ fontSize: '1rem', margin: 0, marginBottom: '0.5rem', color: '#444' }}>
                  💳 Remise dépôts (aujourd’hui)
                </h4>
                {accountDepositRemiseLoading ? (
                  <p style={{ margin: 0, color: '#666' }}>Chargement…</p>
                ) : !accountDepositRemise ? (
                  <p style={{ margin: 0, color: '#856404' }}>Données indisponibles.</p>
                ) : accountDepositRemise.todayRemise?.status === 'finished' ? (
                  <div style={{ display: 'grid', gap: '0.35rem' }}>
                    <p style={{ margin: 0 }}>
                      <strong>Remise effectuée</strong> ({accountDepositRemise.todayRemise.depositsCount} pers.,{' '}
                      {Number(accountDepositRemise.todayRemise.depositsTotal || 0).toFixed(2)} €)
                    </p>
                    <p style={{ margin: 0, color: '#6c757d', fontSize: '0.9rem' }}>
                      Tickets TPE : <strong>{accountDepositRemise.todayRemise.declaredTicketCount ?? '—'}</strong>
                    </p>
                    <p style={{ margin: 0, color: '#6c757d', fontSize: '0.9rem' }}>
                      Terminée : <strong>{formatDateTime(accountDepositRemise.todayRemise.finishedAt)}</strong>
                    </p>
                  </div>
                ) : accountDepositRemise.todayDeposits?.depositsCount > 0 ? (
                  <div style={{ display: 'grid', gap: '0.35rem' }}>
                    <p style={{ margin: 0 }}>
                      <strong>Remise en cours</strong> : {accountDepositRemise.todayDeposits.depositsCount} pers.,{' '}
                      {Number(accountDepositRemise.todayDeposits.depositsTotal || 0).toFixed(2)} €
                    </p>
                    <p style={{ margin: 0, color: '#6c757d', fontSize: '0.9rem' }}>
                      Aller sur <a href={isLonguenesse ? '/lon/compte-client-depots' : '/plan/compte-client-depots'}>Dépôts compte client</a> pour terminer.
                    </p>
                  </div>
                ) : (
                  <p style={{ margin: 0, color: '#6c757d' }}>
                    Aucune remise aujourd’hui. Dernière remise :{' '}
                    <strong>{accountDepositRemise.lastFinishedAt ? formatDate(accountDepositRemise.lastFinishedAt) : '—'}</strong>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Récapitulatif : Arrêts maladie */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>🏥 Récapitulatif : Arrêts maladie</h3>
        {sickEmployees.length === 0 ? (
          <p>Aucun employé en arrêt maladie</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Date de reprise</th>
                  <th>Jours avant reprise</th>
                  <th>Temps partiel thérapeutique</th>
                </tr>
              </thead>
              <tbody>
                {sickEmployees.map((employee) => {
                  // Calculer la date de reprise (lendemain du dernier jour de maladie)
                  const startDate = employee.sickLeave?.startDate ? new Date(employee.sickLeave.startDate) : null;
                  const endDate = employee.sickLeave?.endDate ? new Date(employee.sickLeave.endDate) : null;
                  const returnDate = endDate ? new Date(endDate) : null;
                  if (returnDate) {
                    returnDate.setDate(returnDate.getDate() + 1); // Ajouter 1 jour
                  }
                  
                  // Vérifier si l'arrêt est EN COURS (aujourd'hui entre startDate et endDate)
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  let isCurrentlyOnSickLeave = false;
                  if (startDate && endDate) {
                    const start = new Date(startDate);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    // Vérifier si today est entre start et end (inclus)
                    isCurrentlyOnSickLeave = today >= start && today <= end;
                  }
                  
                  return (
                    <tr key={employee._id}>
                      <td>{employee.name}</td>
                      <td>{returnDate ? formatDate(returnDate.toISOString()) : '-'}</td>
                      <td>
                        {(() => {
                          // Si l'arrêt est en cours, calculer les jours jusqu'à la reprise
                          if (isCurrentlyOnSickLeave && returnDate) {
                            const daysUntilReturn = calculateDaysUntil(returnDate.toISOString());
                            return (
                              <span style={{ 
                                color: '#ffc107',
                                fontWeight: 'bold'
                              }}>
                                En arrêt ({daysUntilReturn} jour{daysUntilReturn > 1 ? 's' : ''} avant reprise)
                              </span>
                            );
                          }
                          
                          // Si l'arrêt est terminé, vérifier s'il est récent (moins de 8 jours)
                          if (returnDate) {
                            const daysUntilReturn = calculateDaysUntil(returnDate.toISOString());
                            if (daysUntilReturn <= 0 && daysUntilReturn >= -8) {
                              return (
                                <span style={{ 
                                  color: '#28a745',
                                  fontWeight: 'bold'
                                }}>
                                  Repris ({Math.abs(daysUntilReturn)} jour{Math.abs(daysUntilReturn) > 1 ? 's' : ''} depuis)
                                </span>
                              );
                            } else if (daysUntilReturn > 0) {
                              return (
                                <span style={{ 
                                  color: '#28a745',
                                  fontWeight: 'bold'
                                }}>
                                  {daysUntilReturn} jour{daysUntilReturn > 1 ? 's' : ''} avant reprise
                                </span>
                              );
                            }
                          }
                          
                          return (
                            <span style={{ 
                              color: '#dc3545',
                              fontWeight: 'bold'
                            }}>
                              Repris
                            </span>
                          );
                        })()}
                      </td>
                      <td>
                        {employee.sickLeave?.therapeuticPartTime ? (
                          <span style={{ color: '#0d6efd', fontWeight: '600' }}>Oui</span>
                        ) : (
                          <span style={{ color: '#6c757d' }}>Non</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Récapitulatif : Absences et Retards */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>📋 Récapitulatif : Absences et Retards (Aujourd'hui)</h3>
        {(() => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayEnd = new Date(today);
          todayEnd.setHours(23, 59, 59, 999);
          
          // Filtrer les employés avec absences/retards aujourd'hui uniquement
          const employeesWithAbsences = employees.filter(emp => {
            const absencesArray = emp.absences?.all || (Array.isArray(emp.absences) ? emp.absences : []);
            const delaysArray = emp.delays?.all || (Array.isArray(emp.delays) ? emp.delays : []);
            
            // Filtrer les absences qui incluent aujourd'hui (today est entre startDate et endDate)
            const todayAbsences = absencesArray.filter(a => {
              if (a.startDate && a.endDate) {
                const aStart = new Date(a.startDate);
                aStart.setHours(0, 0, 0, 0);
                const aEnd = new Date(a.endDate);
                aEnd.setHours(23, 59, 59, 999);
                // Vérifier si today est dans la période [aStart, aEnd]
                return today >= aStart && today <= aEnd;
              }
              return false;
            });
            
            // Filtrer les retards d'aujourd'hui uniquement
            const todayDelays = delaysArray.filter(d => {
              if (d.date) {
                const dDate = new Date(d.date);
                dDate.setHours(0, 0, 0, 0);
                // Vérifier si la date du retard est exactement aujourd'hui
                return dDate.getTime() === today.getTime();
              }
              return false;
            });
            
            return todayAbsences.length > 0 || todayDelays.length > 0;
          });
          
          if (employeesWithAbsences.length === 0) {
            return <p>Aucune absence ou retard aujourd'hui</p>;
          }
          
          return (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Absences</th>
                    <th>Retards</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {employeesWithAbsences.map((employee) => {
                    const absencesArray = employee.absences?.all || (Array.isArray(employee.absences) ? employee.absences : []);
                    const delaysArray = employee.delays?.all || (Array.isArray(employee.delays) ? employee.delays : []);
                    
                    // Filtrer les absences qui incluent aujourd'hui
                    const todayAbsences = absencesArray.filter(a => {
                      if (a.startDate && a.endDate) {
                        const aStart = new Date(a.startDate);
                        aStart.setHours(0, 0, 0, 0);
                        const aEnd = new Date(a.endDate);
                        aEnd.setHours(23, 59, 59, 999);
                        return today >= aStart && today <= aEnd;
                      }
                      return false;
                    });
                    
                    // Filtrer les retards d'aujourd'hui uniquement
                    const todayDelays = delaysArray.filter(d => {
                      if (d.date) {
                        const dDate = new Date(d.date);
                        dDate.setHours(0, 0, 0, 0);
                        return dDate.getTime() === today.getTime();
                      }
                      return false;
                    });
                    
                    return (
                      <tr key={employee._id}>
                        <td>{employee.name}</td>
                        <td>
                          <span style={{ color: '#dc3545', fontWeight: 'bold' }}>
                            {todayAbsences.length}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: '#ffc107', fontWeight: 'bold' }}>
                            {todayDelays.length}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 'bold' }}>
                            {todayAbsences.length + todayDelays.length}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>

      {/* Récapitulatif : Congés */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>🏖️ Récapitulatif : Congés</h3>
        {vacationEmployees.length === 0 ? (
          <p>Aucun employé en congés (8 jours avant le début ou en cours)</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Date de début</th>
                  <th>Date de fin</th>
                  <th>Jours avant congés</th>
                </tr>
              </thead>
              <tbody>
                {vacationEmployees.map((employee) => (
                  <tr key={employee._id}>
                    <td>{employee.name}</td>
                    <td>{formatDate(employee.vacation?.startDate)}</td>
                    <td>{formatDate(employee.vacation?.endDate)}</td>
                    <td>
                      {(() => {
                        const daysUntilVacation = calculateDaysUntil(employee.vacation?.startDate);
                        return (
                          <span style={{ 
                            color: daysUntilVacation > 0 ? '#ffc107' : '#28a745',
                            fontWeight: 'bold'
                          }}>
                            {daysUntilVacation > 0 ? `${daysUntilVacation} jours` : 'En congés'}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* État Âge : Salariés mineurs */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>🎂 État Âge : Salariés mineurs</h3>
        {minorEmployees.length === 0 ? (
          <p>Aucun employé mineur</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Date des 18 ans</th>
                  <th>Jours avant les 18 ans</th>
                </tr>
              </thead>
              <tbody>
                {minorEmployees.map((employee) => (
                  <tr key={employee._id}>
                    <td>{employee.name}</td>
                    <td>{(() => {
                      // Si birthDate est disponible, calculer précisément la date des 18 ans
                      if (employee.birthDate) {
                        const birthDate = new Date(employee.birthDate);
                        const eighteenBirthday = new Date(birthDate);
                        eighteenBirthday.setFullYear(birthDate.getFullYear() + 18);
                        return formatDate(eighteenBirthday);
                      }
                      // Sinon, calcul approximatif basé sur l'âge actuel
                      const currentAge = employee.age;
                      const yearsUntil18 = 18 - currentAge;
                      const today = new Date();
                      const eighteenBirthday = new Date(today.getFullYear() + yearsUntil18, today.getMonth(), today.getDate());
                      return formatDate(eighteenBirthday);
                    })()}</td>
                    <td>
                      {(() => {
                        // Si birthDate est disponible, calculer précisément le nombre de jours
                        if (employee.birthDate) {
                          const birthDate = new Date(employee.birthDate);
                          const eighteenBirthday = new Date(birthDate);
                          eighteenBirthday.setFullYear(birthDate.getFullYear() + 18);
                          const daysUntilEighteen = calculateDaysUntil(eighteenBirthday);
                          
                          return (
                            <span style={{ 
                              color: daysUntilEighteen > 0 ? '#ffc107' : '#28a745',
                              fontWeight: 'bold'
                            }}>
                              {daysUntilEighteen > 0 ? `${daysUntilEighteen} jours` : 'Majeur'}
                            </span>
                          );
                        }
                        // Sinon, calcul approximatif basé sur l'âge actuel
                        const currentAge = employee.age;
                        const yearsUntil18 = 18 - currentAge;
                        const today = new Date();
                        const eighteenBirthday = new Date(today.getFullYear() + yearsUntil18, today.getMonth(), today.getDate());
                        const daysUntilEighteen = calculateDaysUntil(eighteenBirthday);
                        
                        return (
                          <span style={{ 
                            color: daysUntilEighteen > 0 ? '#ffc107' : '#28a745',
                            fontWeight: 'bold'
                          }}>
                            {daysUntilEighteen > 0 ? `${daysUntilEighteen} jours (approximatif)` : 'Majeur'}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* État Contrat : Apprentis */}
      <div className="card">
        <h3>📋 État Contrat : Apprentis</h3>
        {apprenticeEmployees.length === 0 ? (
          <p>Aucun apprenti</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Date de fin de contrat</th>
                  <th>Jours avant fin de contrat</th>
                </tr>
              </thead>
              <tbody>
                {apprenticeEmployees.map((employee) => (
                  <tr key={employee._id}>
                    <td>{employee.name}</td>
                    <td>{formatDate(employee.contractEndDate)}</td>
                    <td>
                      {(() => {
                        const daysUntilContractEnd = calculateDaysUntil(employee.contractEndDate);
                        return (
                          <span style={{ 
                            color: daysUntilContractEnd > 30 ? '#28a745' : 
                                   daysUntilContractEnd > 7 ? '#ffc107' : '#dc3545',
                            fontWeight: 'bold'
                          }}>
                            {daysUntilContractEnd > 0 ? `${daysUntilContractEnd} jours` : 'Terminé'}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Obligations Légales */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>⚖️ Obligations Légales</h3>
        {pendingObligations.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem', 
            backgroundColor: '#d4edda', 
            color: '#155724',
            borderRadius: '8px',
            border: '1px solid #c3e6cb'
          }}>
            <svg 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              style={{ width: '48px', height: '48px', marginBottom: '1rem' }}
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
              ✅ Toutes les obligations légales sont à jour !
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <div style={{ 
              padding: '0.75rem', 
              backgroundColor: '#fff3cd', 
              color: '#856404',
              borderRadius: '8px',
              marginBottom: '1rem',
              border: '1px solid #ffeaa7'
            }}>
              <strong>⚠️ {pendingObligations.length} démarche(s) administrative(s) en attente</strong>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Démarche</th>
                  <th>Commentaire</th>
                </tr>
              </thead>
              <tbody>
                {pendingObligations.map((obligation, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: 'bold' }}>{obligation.employeeName}</td>
                    <td>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        backgroundColor: '#f8d7da', 
                        color: '#721c24',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                        fontWeight: '500'
                      }}>
                        {obligation.taskLabel}
                      </span>
                    </td>
                    <td style={{ color: '#6c757d', fontStyle: 'italic' }}>
                      {obligation.comment || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Statistiques générales */}
      <div className="card">
        <h3>📈 Statistiques générales</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <h4>{employees.length}</h4>
            <p>Total employés</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <h4>{employees.filter(emp => emp.isActive).length}</h4>
            <p>Employés actifs</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <h4>{sickEmployees.length}</h4>
            <p>En arrêt maladie</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <h4>{vacationEmployees.length}</h4>
            <p>En congés (8j)</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <h4>{minorEmployees.length}</h4>
            <p>Employés mineurs</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <h4>{apprenticeEmployees.length}</h4>
            <p>Apprentis</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '8px', border: '2px solid #ffc107' }}>
            <h4 style={{ color: '#856404' }}>{pendingObligations.length}</h4>
            <p style={{ color: '#856404' }}>Obligations légales</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

