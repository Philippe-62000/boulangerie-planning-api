import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  DAYS,
  addIsoWeeks,
  cellClass,
  cellLabel,
  computePlanningHints,
  formatDayRange,
  formatHours,
  formatShortDate,
  getISOWeekInfo,
  cpHoursForContract,
  hoursMatchContract,
  overtimeFromPaid,
  planningWords,
  rowCpHours,
  rowPaidHours,
  rowRecupHours,
  rowWeekHours,
  dayDisplayHours,
  buildShopPrintHtml,
  buildMonthRecapHtml,
  groupRowsByCategory,
  isIsoDayFinished,
  openPrintHtml,
  todayIsoParis
} from '../utils/staffPlanning';
import './StaffPlanning.css';

function splitHm(value) {
  if (value == null || value === '') return { h: '', m: '' };
  const [h = '', m = ''] = String(value).split(':');
  return { h, m };
}

function clampTimePart(value, max) {
  const n = Number(String(value).replace(/\D/g, ''));
  if (!Number.isFinite(n)) return '00';
  return String(Math.max(0, Math.min(max, n))).padStart(2, '0');
}

function normalizeTime(value, fallback = '') {
  const { h, m } = splitHm(value);
  if (h === '' && m === '') return fallback;
  return `${clampTimePart(h === '' ? '0' : h, 23)}:${clampTimePart(m === '' ? '0' : m, 59)}`;
}

function TimePair({ value, onChange, hourRef, emptyOk = false, skipTab = false, hourLabel, minuteLabel }) {
  const { h, m } = splitHm(value);
  const tabIndex = skipTab ? -1 : undefined;

  const commit = (nextH, nextM, pad) => {
    if (pad) {
      if (emptyOk && nextH === '' && nextM === '') {
        onChange('');
        return;
      }
      onChange(`${clampTimePart(nextH === '' ? '0' : nextH, 23)}:${clampTimePart(nextM === '' ? '0' : nextM, 59)}`);
      return;
    }
    const hh = String(nextH).replace(/\D/g, '').slice(0, 2);
    const mm = String(nextM).replace(/\D/g, '').slice(0, 2);
    if (emptyOk && hh === '' && mm === '') {
      onChange('');
      return;
    }
    onChange(`${hh}:${mm}`);
  };

  return (
    <div className="sp-time-pair">
      <input
        ref={hourRef}
        className="form-control sp-time-part"
        inputMode="numeric"
        autoComplete="off"
        maxLength={2}
        tabIndex={tabIndex}
        value={h}
        aria-label={hourLabel}
        onFocus={(e) => e.target.select()}
        onChange={(e) => commit(e.target.value, m, false)}
        onBlur={() => commit(h, m, true)}
      />
      <span className="sp-time-sep">h</span>
      <input
        className="form-control sp-time-part"
        inputMode="numeric"
        autoComplete="off"
        maxLength={2}
        tabIndex={tabIndex}
        value={m}
        aria-label={minuteLabel}
        onFocus={(e) => e.target.select()}
        onChange={(e) => commit(h, e.target.value, false)}
        onBlur={() => commit(h, m, true)}
      />
    </div>
  );
}

const emptyEditor = {
  start1: '08:00',
  end1: '16:00',
  start2: '',
  end2: '',
  applyToWeek: false
};

const StaffPlanning = () => {
  const { user, isAdmin } = useAuth();
  const current = getISOWeekInfo();
  const [weekNumber, setWeekNumber] = useState(current.weekNumber);
  const [year, setYear] = useState(current.year);
  const [week, setWeek] = useState(null);
  const [dates, setDates] = useState([]);
  const [previousRows, setPreviousRows] = useState([]);
  const [holidayLabels, setHolidayLabels] = useState({});
  const [settings, setSettings] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [counters, setCounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editor, setEditor] = useState(null);
  const [menu, setMenu] = useState(null);
  const [teamModal, setTeamModal] = useState(false);
  const [teamSelected, setTeamSelected] = useState([]);
  const [statsModal, setStatsModal] = useState(null);
  const [layer, setLayer] = useState('forecast');
  const [lock, setLock] = useState({ today: todayIsoParis(), weekFinished: false, finishedDates: [] });
  const [dragId, setDragId] = useState(null);
  const [recupModal, setRecupModal] = useState(null);
  const startHourRef = useRef(null);

  const canEdit = isAdmin();
  const myEmployeeId = user?.employeeId || user?.id;
  const prevWeek = useMemo(() => addIsoWeeks(weekNumber, year, -1), [weekNumber, year]);
  const nextWeek = useMemo(() => addIsoWeeks(weekNumber, year, 1), [weekNumber, year]);

  const applyWeekPayload = useCallback((payload) => {
    if (payload.week) setWeek(payload.week);
    if (payload.dates) setDates(payload.dates);
    if (payload.settings) setSettings(payload.settings);
    if (payload.alerts) setAlerts(payload.alerts);
    if (payload.previousWeek?.rows) setPreviousRows(payload.previousWeek.rows);
    if (payload.holidayLabels) setHolidayLabels(payload.holidayLabels);
    if (payload.lock) setLock(payload.lock);
  }, []);

  const loadWeek = useCallback(async (nextWeekNumber, nextYear) => {
    setLoading(true);
    try {
      const response = await api.get(`/staff-planning/week/${nextYear}/${nextWeekNumber}`);
      applyWeekPayload(response.data);
      if (!response.data.previousWeek) setPreviousRows([]);
      if (!response.data.holidayLabels) setHolidayLabels({});
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || 'Impossible de charger le planning');
    } finally {
      setLoading(false);
    }
  }, [applyWeekPayload]);

  useEffect(() => {
    loadWeek(weekNumber, year);
  }, [weekNumber, year, loadWeek]);

  const loadCounters = useCallback(async () => {
    const monday = dates[0]?.date;
    if (!monday) return;
    const [y, m] = monday.split('-');
    try {
      const response = await api.get('/staff-planning/month-counters', {
        params: { year: Number(y), month: Number(m) }
      });
      setCounters(response.data.counters || []);
    } catch (error) {
      console.error(error);
    }
  }, [dates]);

  useEffect(() => {
    loadCounters();
  }, [loadCounters, week]);

  useEffect(() => {
    if (!menu) return undefined;
    const close = () => setMenu(null);
    const onKey = (event) => {
      if (event.key === 'Escape') close();
    };
    const timer = window.setTimeout(() => {
      window.addEventListener('click', close);
    }, 0);
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('click', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  useEffect(() => {
    if (!editor) return undefined;
    const id = window.setTimeout(() => {
      const el = startHourRef.current;
      if (!el) return;
      el.focus({ preventScroll: true });
      el.select();
    }, 30);
    return () => window.clearTimeout(id);
  }, [editor?.employeeId, editor?.day, editor?.date]);

  const monthLabel = useMemo(() => {
    const monday = dates[0]?.date;
    if (!monday) return '';
    const [y, m] = monday.split('-');
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }, [dates]);

  const hintsByEmployee = useMemo(() => {
    const prevById = new Map((previousRows || []).map((row) => [String(row.employeeId), row]));
    const map = new Map();
    const sourceRows = layer === 'actual' ? (week?.actualRows || []) : (week?.rows || []);
    sourceRows.forEach((row) => {
      const prev = prevById.get(String(row.employeeId));
      map.set(String(row.employeeId), computePlanningHints(prev?.days || [], row.days || []));
    });
    return map;
  }, [week, previousRows, layer]);

  const goWeek = (delta) => {
    const next = addIsoWeeks(weekNumber, year, delta);
    setWeekNumber(next.weekNumber);
    setYear(next.year);
  };

  const displayedRows = layer === 'actual' ? (week?.actualRows || []) : (week?.rows || []);
  const groups = useMemo(
    () => groupRowsByCategory(displayedRows, settings?.employeeOrder),
    [displayedRows, settings]
  );
  const weekFinished = !!(lock?.weekFinished || (
    dates[dates.length - 1]?.date && String(dates[dates.length - 1].date) < String(lock?.today || todayIsoParis())
  ));
  const actualExists = week?.actualStatus && week.actualStatus !== 'none' && (week.actualRows || []).length > 0;
  const actualLocked = week?.actualStatus === 'validated';

  const canEditDay = (isoDate) => {
    if (!canEdit) return false;
    if (layer === 'actual') return !actualLocked;
    if (weekFinished) return false;
    if (isIsoDayFinished(isoDate, lock?.today)) return false;
    return true;
  };

  const openEditor = (row, dayName, options = {}) => {
    if (!canEdit) return;
    const day = (row.days || []).find((item) => item.day === dayName);
    if (!options.skipLockCheck && !canEditDay(day?.date)) {
      toast.info(layer === 'actual'
        ? 'Le planning réel est validé et n’est plus modifiable.'
        : 'Ce jour est terminé. Utilisez le planning réel pour les absences, retards et maladies.');
      return;
    }
    setMenu(null);
    const shifts = day?.shifts || [];
    setEditor({
      employeeId: row.employeeId,
      employeeName: row.employeeName,
      contractedHours: row.contractedHours,
      day: dayName,
      date: day?.date,
      currentCode: day?.kind === 'code' ? day.code : '',
      start1: shifts[0]?.startTime || emptyEditor.start1,
      end1: shifts[0]?.endTime || emptyEditor.end1,
      start2: shifts[1]?.startTime || '',
      end2: shifts[1]?.endTime || '',
      applyToWeek: false
    });
  };

  const holidaySet = useMemo(
    () => new Set(week?.holidayDates || []),
    [week]
  );
  const words = useMemo(() => planningWords(settings), [settings]);
  const employeeOptions = week?.rows || [];

  const toggleHoliday = async (date, holiday) => {
    if (!canEdit || !date) return;
    setSaving(true);
    try {
      const response = await api.put(`/staff-planning/week/${year}/${weekNumber}/holiday`, { date, holiday });
      applyWeekPayload(response.data);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || 'Impossible de marquer le férié');
    } finally {
      setSaving(false);
    }
  };

  const saveCell = async (payload, options = {}) => {
    setSaving(true);
    try {
      const response = await api.put(`/staff-planning/week/${year}/${weekNumber}/cell`, payload);
      applyWeekPayload(response.data);
      const nextDayName = options.openNext && payload.day !== 'Dimanche' && !payload.applyToWeek
        ? DAYS[DAYS.indexOf(payload.day) + 1]
        : null;
      if (nextDayName) {
        const rowsKey = payload.layer === 'actual' ? 'actualRows' : 'rows';
        const row = (response.data.week?.[rowsKey] || []).find((item) => String(item.employeeId) === String(payload.employeeId));
        const nextMeta = (response.data.dates || dates).find((item) => item.day === nextDayName);
        const nextLock = response.data.lock || lock;
        const nextWeek = response.data.week;
        const nextActualLocked = nextWeek?.actualStatus === 'validated';
        const locked = payload.layer === 'actual'
          ? nextActualLocked
          : !!(nextLock.weekFinished || (nextMeta?.date && isIsoDayFinished(nextMeta.date, nextLock.today)));
        if (row && nextMeta && !locked) {
          openEditor(row, nextDayName, { skipLockCheck: true });
          return;
        }
      }
      setEditor(null);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || 'Enregistrement impossible');
    } finally {
      setSaving(false);
    }
  };

  const submitEditor = () => {
    if (!editor) return;
    const start1 = normalizeTime(editor.start1, emptyEditor.start1);
    const end1 = normalizeTime(editor.end1, emptyEditor.end1);
    const start2 = normalizeTime(editor.start2, '');
    const end2 = normalizeTime(editor.end2, '');
    const shifts = [{ startTime: start1, endTime: end1 }];
    if (start2 && end2) {
      shifts.push({ startTime: start2, endTime: end2 });
    }
    saveCell({
      employeeId: editor.employeeId,
      day: editor.day,
      cell: { kind: 'shifts', shifts },
      applyToWeek: !!editor.applyToWeek,
      layer
    }, { openNext: true });
  };

  const applyCode = (code) => {
    if (!editor) return;
    saveCell({
      employeeId: editor.employeeId,
      day: editor.day,
      cell: { kind: 'code', code },
      applyToWeek: !!editor.applyToWeek,
      layer
    });
  };

  const clearCell = () => {
    if (!editor) return;
    saveCell({
      employeeId: editor.employeeId,
      day: editor.day,
      cell: { kind: 'empty' },
      applyToWeek: !!editor.applyToWeek,
      layer
    });
  };

  const confirmAlerts = (actionLabel) => {
    if (!alerts.length) return true;
    const preview = alerts.slice(0, 8).map((item) => `${item.employeeName} (${item.day}) : ${item.message}`).join('\n');
    const extra = alerts.length > 8 ? `\n… et ${alerts.length - 8} autre(s)` : '';
    return window.confirm(
      `${alerts.length} alerte(s) sur ce planning.\n\n${preview}${extra}\n\n${actionLabel} quand même ?`
    );
  };

  const validate = async () => {
    if (!confirmAlerts('Valider')) return;
    try {
      const response = await api.post(`/staff-planning/week/${year}/${weekNumber}/validate`);
      applyWeekPayload(response.data);
      toast.success('Planning validé');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Validation impossible');
    }
  };

  const send = async (options = {}) => {
    const urgent = !!options.urgent;
    const sendLayer = options.layer || layer;
    if (sendLayer === 'forecast' && !urgent && !confirmAlerts('Envoyer')) return;
    const update = sendLayer === 'forecast' && (week?.sendCount || 0) > 0;
    const confirmLabel = sendLayer === 'actual'
      ? 'Envoyer un e-mail URGENT à chaque salarié pour qu’il signe son planning réel ?'
      : (urgent
        ? 'Le planning a été modifié : envoyer un e-mail URGENT à tous les salariés ? Les prises de connaissance (cases vertes) seront réinitialisées.'
        : (update
          ? 'Renvoyer le planning modifié à tous les salariés qui ont un e-mail ?'
          : 'Envoyer ce planning à tous les salariés qui ont un e-mail ?'));
    if (!window.confirm(confirmLabel)) return;
    try {
      const response = await api.post(`/staff-planning/week/${year}/${weekNumber}/send`, {
        urgent: urgent || sendLayer === 'actual',
        layer: sendLayer
      });
      applyWeekPayload(response.data);
      const failed = (response.data.results || []).filter((item) => !item.ok);
      if (failed.length) {
        toast.warn(`Envoyé à ${response.data.sent}/${response.data.total}. ${failed.length} sans e-mail ou en échec.`);
      } else {
        toast.success(sendLayer === 'actual'
          ? `E-mail envoyé à ${response.data.sent} salarié(s) pour signature`
          : `Planning envoyé à ${response.data.sent} salarié(s)`);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Envoi impossible');
    }
  };

  const duplicate = async () => {
    const target = addIsoWeeks(weekNumber, year, 1);
    if (!window.confirm(`Dupliquer la semaine ${weekNumber} vers la semaine ${target.weekNumber} ? Les jours CFA ne sont ni copiés ni écrasés.`)) {
      return;
    }
    try {
      const response = await api.post(`/staff-planning/week/${year}/${weekNumber}/duplicate`, {
        targetWeek: target.weekNumber,
        targetYear: target.year
      });
      setWeekNumber(target.weekNumber);
      setYear(target.year);
      applyWeekPayload(response.data);
      toast.success(`Semaine ${target.weekNumber} créée`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Duplication impossible');
    }
  };

  const createActual = async () => {
    if (actualExists) {
      setLayer('actual');
      return;
    }
    if (!window.confirm('Créer le planning réel à partir du planning prévu ? Vous pourrez y reporter maladies, absences, retards et heures de récup.')) {
      return;
    }
    try {
      const response = await api.post(`/staff-planning/week/${year}/${weekNumber}/actual`);
      applyWeekPayload(response.data);
      setLayer('actual');
      toast.success('Planning réel créé — vous pouvez y reporter maladies, absences, retards et heures de récup');
    } catch (error) {
      const message = error.response?.data?.error || 'Création du planning réel impossible';
      toast.error(message);
    }
  };

  const openRecupModal = (row) => {
    if (layer !== 'actual' || !canEdit || actualLocked) return;
    const worked = rowPaidHours(row);
    setRecupModal({
      employeeId: row.employeeId,
      employeeName: row.employeeName,
      contractedHours: row.contractedHours,
      worked,
      hours: String(rowRecupHours(row) || 0),
      comment: row.recupComment || ''
    });
  };

  const saveRecupModal = async () => {
    if (!recupModal) return;
    const hoursValue = Number.parseFloat(String(recupModal.hours).replace(',', '.'));
    if (!Number.isFinite(hoursValue)) {
      toast.error('Indiquez un nombre d’heures (+ pour ajouter au compteur, − pour en retirer)');
      return;
    }
    setSaving(true);
    try {
      const response = await api.put(`/staff-planning/week/${year}/${weekNumber}/recup`, {
        employeeId: recupModal.employeeId,
        hours: hoursValue,
        comment: recupModal.comment || ''
      });
      applyWeekPayload(response.data);
      setRecupModal(null);
      toast.success('Heures de récup enregistrées');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Enregistrement des heures de récup impossible');
    } finally {
      setSaving(false);
    }
  };

  const validateActual = async () => {
    if (!window.confirm('Valider le planning réel ? Il ne sera plus modifiable. Un e-mail URGENT partira pour que chaque salarié le signe sur son téléphone.')) {
      return;
    }
    try {
      const response = await api.post(`/staff-planning/week/${year}/${weekNumber}/actual/validate`);
      applyWeekPayload(response.data);
      const mailed = Number(response.data.mailed) || 0;
      toast.success(mailed
        ? `Planning réel validé — e-mail envoyé à ${mailed} salarié(s)`
        : 'Planning réel validé');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Validation du planning réel impossible');
    }
  };

  const printMonthRecap = async () => {
    const monday = dates[0]?.date;
    const [y, m] = monday ? monday.split('-') : [String(year), '1'];
    try {
      const response = await api.get('/staff-planning/month-recap', {
        params: { year: Number(y), month: Number(m) }
      });
      const html = buildMonthRecapHtml(response.data);
      if (!openPrintHtml(html)) toast.error('Autorisez les fenêtres pop-up pour le récapitulatif.');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Récapitulatif mensuel indisponible');
    }
  };

  const persistOrder = async (orderedIds, categories = {}) => {
    try {
      const response = await api.put('/staff-planning/reorder', { employeeOrder: orderedIds, categories });
      if (response.data.settings) setSettings(response.data.settings);
      await loadWeek(weekNumber, year);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Impossible d’enregistrer l’ordre');
    }
  };

  const flatOrderedIds = () => groups.flatMap((group) => group.rows.map((row) => String(row.employeeId)));

  const moveRow = (employeeId, direction) => {
    const flat = flatOrderedIds();
    const index = flat.indexOf(String(employeeId));
    const next = index + direction;
    if (index < 0 || next < 0 || next >= flat.length) return;
    const copy = [...flat];
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    persistOrder(copy);
  };

  const onDropRow = (targetId, targetCategory) => {
    if (!dragId || String(dragId) === String(targetId)) return;
    const flat = flatOrderedIds();
    const from = flat.indexOf(String(dragId));
    const to = flat.indexOf(String(targetId));
    if (from < 0 || to < 0) return;
    const copy = [...flat];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    const source = displayedRows.find((row) => String(row.employeeId) === String(dragId));
    const categories = {};
    if (source && source.employeeCategory !== targetCategory) {
      categories[String(dragId)] = targetCategory;
    }
    setDragId(null);
    persistOrder(copy, categories);
  };

  const copyRows = async (direction, employeeIds) => {
    if (!canEdit) return;
    if (!employeeIds?.length) {
      toast.error('Sélectionnez au moins un salarié');
      return;
    }
    const label = direction === 'to-next'
      ? `Copier vers la semaine ${nextWeek.weekNumber} (sans CFA) ?`
      : `Importer la semaine ${prevWeek.weekNumber} vers la semaine ${weekNumber} (sans CFA) ?`;
    if (!window.confirm(label)) return;
    setSaving(true);
    try {
      const response = await api.post(`/staff-planning/week/${year}/${weekNumber}/copy`, {
        direction,
        employeeIds
      });
      applyWeekPayload(response.data);
      setMenu(null);
      setTeamModal(false);
      const skipped = response.data.skippedCfa ? ` ${response.data.skippedCfa} jour(s) CFA conservés.` : '';
      toast.success(direction === 'to-next'
        ? `Semaine ${response.data.targetWeek} mise à jour.${skipped}`
        : `Planning importé depuis la semaine ${prevWeek.weekNumber}.${skipped}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Copie impossible');
    } finally {
      setSaving(false);
    }
  };

  const openEmployeeMenu = (event, row) => {
    event.preventDefault();
    event.stopPropagation();
    setMenu({
      type: 'employee',
      employeeId: row.employeeId,
      employeeName: row.employeeName,
      swapOpen: false,
      x: Math.min(event.clientX, window.innerWidth - 280),
      y: Math.min(event.clientY, window.innerHeight - 340)
    });
  };

  const openTeamModal = (event) => {
    if (!canEdit) return;
    event.preventDefault();
    setMenu(null);
    setTeamSelected(employeeOptions.map((row) => String(row.employeeId)));
    setTeamModal(true);
  };

  const swapWith = async (other) => {
    if (!canEdit || !menu || !other) return;
    if (!window.confirm(
      `Intervertir ${menu.employeeName} et ${other.employeeName} sur la semaine ${weekNumber} ?\nLes jours CFA restent en place.`
    )) return;
    setSaving(true);
    try {
      const response = await api.post(`/staff-planning/week/${year}/${weekNumber}/swap`, {
        employeeIdA: menu.employeeId,
        employeeIdB: other.employeeId,
        layer
      });
      applyWeekPayload(response.data);
      setMenu(null);
      const skipped = response.data.skippedCfa ? ` ${response.data.skippedCfa} jour(s) CFA conservés.` : '';
      toast.success(`Semaines interverties.${skipped}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Permutation impossible');
    } finally {
      setSaving(false);
    }
  };

  const openStats = async (employeeId, employeeName) => {
    setMenu(null);
    setStatsModal({ employeeId, employeeName, loading: true, stats: null, error: null });
    try {
      const response = await api.get(`/staff-planning/stats/${employeeId}`, { params: { year } });
      setStatsModal({
        employeeId,
        employeeName: response.data.employeeName || employeeName,
        loading: false,
        stats: response.data.stats,
        year: response.data.year,
        error: null
      });
    } catch (error) {
      setStatsModal({
        employeeId,
        employeeName,
        loading: false,
        stats: null,
        year,
        error: error.response?.data?.error || 'Statistiques indisponibles'
      });
    }
  };

  const toggleTeamEmployee = (employeeId) => {
    const id = String(employeeId);
    setTeamSelected((currentSelection) => (
      currentSelection.includes(id)
        ? currentSelection.filter((item) => item !== id)
        : [...currentSelection, id]
    ));
  };

  const printPlanning = () => {
    const html = buildShopPrintHtml({
      weekNumber,
      dates,
      rows: displayedRows,
      holidayDates: week?.holidayDates || [],
      title: layer === 'actual' ? 'Planning réel' : 'Planning'
    });
    if (!openPrintHtml(html)) {
      toast.error('Autorisez les fenêtres pop-up pour imprimer le planning magasin.');
    }
  };

  const statusLabel = layer === 'actual'
    ? (week?.actualStatus === 'validated' ? 'Planning réel validé' : (actualExists ? 'Planning réel (modifiable)' : 'Pas encore de planning réel'))
    : week?.status === 'sent'
      ? `Envoyé${week.sendCount > 1 ? ` (${week.sendCount} fois)` : ''}`
      : week?.status === 'validated'
        ? 'Validé'
        : 'Brouillon';

  return (
    <div className="staff-planning">
      <div className="sp-toolbar no-print">
        <div>
          <h2>Planning</h2>
          <p className="sp-sub">
            Semaine {weekNumber} — {formatDayRange(dates)}
            {settings?.sundayOpen === false ? ' · Dimanche fermé' : ''}
          </p>
        </div>
        <div className="sp-week-nav">
          <button type="button" className="btn btn-secondary" onClick={() => goWeek(-1)}>◀</button>
          <label>
            Semaine
            <input
              className="form-control"
              type="number"
              min="1"
              max="53"
              value={weekNumber}
              onChange={(e) => setWeekNumber(Number(e.target.value) || weekNumber)}
            />
          </label>
          <label>
            Année
            <input
              className="form-control"
              type="number"
              min="2020"
              max="2100"
              value={year}
              onChange={(e) => setYear(Number(e.target.value) || year)}
            />
          </label>
          <button type="button" className="btn btn-secondary" onClick={() => goWeek(1)}>▶</button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              const now = getISOWeekInfo();
              setWeekNumber(now.weekNumber);
              setYear(now.year);
            }}
          >
            Semaine en cours
          </button>
        </div>
      </div>

      <div className="sp-actions no-print">
        <span className={`sp-status sp-status-${layer === 'actual' ? (week?.actualStatus || 'none') : (week?.status || 'draft')}`}>{statusLabel}</span>
        {weekFinished && layer === 'forecast' && (
          <span className="sp-status sp-status-alert">Semaine terminée — planning prévu verrouillé</span>
        )}
        {alerts.length > 0 && layer === 'forecast' && (
          <span className="sp-status sp-status-alert">{alerts.length} alerte(s) — confirmation à l’envoi</span>
        )}
        <button type="button" className={`btn ${layer === 'forecast' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setLayer('forecast')}>Planning prévu</button>
        <button
          type="button"
          className={`btn ${layer === 'actual' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => {
            setLayer('actual');
            if (!loading && !actualExists && canEdit) createActual();
          }}
        >
          Planning réel
        </button>
        {canEdit && layer === 'forecast' && (
          <>
            <button type="button" className="btn btn-secondary" onClick={duplicate}>Dupliquer vers la semaine suivante</button>
            <button type="button" className="btn btn-primary" onClick={() => send()} disabled={weekFinished && (week?.sendCount || 0) === 0}>
              {(week?.sendCount || 0) > 0 ? 'Renvoyer le planning' : 'Envoyer aux salariés'}
            </button>
            {(week?.sendCount || 0) > 0 && (
              <button type="button" className="btn btn-urgent" onClick={() => send({ urgent: true, layer: 'forecast' })}>
                Planning modifié
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={validate} disabled={weekFinished}>Valider le planning</button>
          </>
        )}
        {canEdit && layer === 'actual' && actualExists && actualLocked && (
          <button type="button" className="btn btn-urgent" onClick={() => send({ urgent: true, layer: 'actual' })}>
            Planning modifié
          </button>
        )}
        {canEdit && !actualExists && (
          <button type="button" className="btn btn-secondary" onClick={createActual}>Créer le planning réel</button>
        )}
        {canEdit && layer === 'actual' && actualExists && !actualLocked && (
          <button type="button" className="btn btn-primary" onClick={validateActual}>Valider le planning réel</button>
        )}
        <button type="button" className="btn btn-secondary" onClick={printPlanning}>Imprimer (affichage magasin)</button>
        <button type="button" className="btn btn-secondary" onClick={printMonthRecap}>Récapitulatif mensuel des horaires</button>
        {(week?.acknowledgements || []).length > 0 && (
          <span className="sp-status">{(week.acknowledgements || []).length} prise(s) de connaissance</span>
        )}
        {(week?.actualSignatures || []).length > 0 && (
          <span className="sp-status sp-status-signed">{(week.actualSignatures || []).length} signature(s) réel</span>
        )}
      </div>

      <div className="sp-legend no-print">
        <span className="sp-legend-item sp-legend-prev">Repos de la semaine {prevWeek.weekNumber}</span>
        <span className="sp-legend-item sp-legend-six">7e jour consécutif sans repos (max. 6 jours de travail)</span>
        <span className="sp-legend-item sp-legend-ack">Prise de connaissance (prévu)</span>
        <span className="sp-legend-item sp-legend-signed">Planning réel signé</span>
      </div>
      {(week?.acknowledgements || []).length > 0 && (
        <div className="sp-alerts no-print">
          <h3>Prise de connaissance</h3>
          <ul>
            {(week.acknowledgements || []).map((item) => (
              <li key={String(item.employeeId)}>
                {item.employeeName} — {item.acknowledgedAt ? new Date(item.acknowledgedAt).toLocaleString('fr-FR') : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
      {(week?.actualSignatures || []).length > 0 && (
        <div className="sp-alerts no-print sp-sign-list">
          <h3>Signatures du planning réel</h3>
          <ul>
            {(week.actualSignatures || []).map((item) => (
              <li key={String(item.employeeId)}>
                <div>
                  <strong>{item.employeeName}</strong>
                  {' — '}
                  {item.signedAt ? new Date(item.signedAt).toLocaleString('fr-FR') : ''}
                </div>
                {item.snapshot ? (
                  <small>
                    Semaine signée : {formatHours(item.snapshot.weeklyAccountantHours || item.snapshot.weeklyPaidHours)} / {formatHours(item.snapshot.contractedHours)}
                    {Number(item.snapshot.recupHours)
                      ? ` · récup ${Number(item.snapshot.recupHours) > 0 ? '+' : ''}${formatHours(item.snapshot.recupHours)}`
                      : ''}
                  </small>
                ) : null}
                {item.signatureDataUrl ? (
                  <img src={item.signatureDataUrl} alt={`Signature ${item.employeeName}`} className="sp-sign-thumb" />
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="sp-print-header">
        <h1>Planning semaine {weekNumber} — {formatDayRange(dates)}</h1>
      </div>

      {loading ? (
        <p className="no-print">Chargement du planning…</p>
      ) : layer === 'actual' && !actualExists ? (
        <p className="no-print">Pas encore de planning réel. Créez-le en copie du planning prévu pour y reporter les absences, maladies et retards.</p>
      ) : (
        <div className="sp-table-wrap">
          <table className="sp-grid">
            <thead>
              <tr>
                <th
                  className={canEdit ? 'sp-th-employee sp-th-employee-menu' : 'sp-th-employee'}
                  onClick={openTeamModal}
                  title={canEdit ? 'Importer ou copier le planning de l’équipe' : undefined}
                >
                  Salarié
                  {canEdit && <small className="sp-th-hint">équipe · glisser pour ranger</small>}
                </th>
                {DAYS.map((day, index) => {
                  const iso = dates[index]?.date;
                  const isHoliday = iso ? holidaySet.has(iso) : false;
                  const holidayName = iso ? holidayLabels[iso] : '';
                  return (
                    <th key={day} className={isHoliday ? 'sp-th-holiday' : undefined}>
                      <div className="sp-day-head">
                        <span>{day} {formatShortDate(iso)}</span>
                        {canEdit && layer === 'forecast' && canEditDay(iso) ? (
                          <label className="sp-ferie-check" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isHoliday}
                              disabled={saving}
                              onChange={(e) => toggleHoliday(iso, e.target.checked)}
                            />
                            Férié{holidayName ? ` — ${holidayName}` : ''}
                          </label>
                        ) : (
                          isHoliday && <span className="sp-ferie-tag">Férié{holidayName ? ` — ${holidayName}` : ''}</span>
                        )}
                      </div>
                    </th>
                  );
                })}
                <th>Semaine</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <React.Fragment key={group.id}>
                  <tr className="sp-group-row">
                    <td colSpan={9}>{group.label}</td>
                  </tr>
                  {group.rows.map((row) => {
                    const mine = String(row.employeeId) === String(myEmployeeId);
                    const month = counters.find((item) => String(item.employeeId) === String(row.employeeId));
                    const hints = hintsByEmployee.get(String(row.employeeId));
                    const ack = (week?.acknowledgements || []).find((item) => String(item.employeeId) === String(row.employeeId));
                    const signed = (week?.actualSignatures || []).find((item) => String(item.employeeId) === String(row.employeeId));
                    const nameStatus = signed ? 'sp-name-signed' : (ack ? 'sp-name-ack' : '');
                    const nameTitle = signed
                      ? `Planning réel signé le ${new Date(signed.signedAt).toLocaleString('fr-FR')}`
                      : (ack
                        ? `Prise de connaissance le ${new Date(ack.acknowledgedAt).toLocaleString('fr-FR')}`
                        : 'Menu du salarié — glisser pour ranger');
                    return (
                      <tr
                        key={row.employeeId}
                        className={mine ? 'sp-row-mine' : undefined}
                        draggable={canEdit}
                        onDragStart={() => setDragId(String(row.employeeId))}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => onDropRow(row.employeeId, group.id)}
                      >
                        <td
                          className={`sp-name sp-name-menu ${nameStatus}`}
                          onClick={(event) => openEmployeeMenu(event, row)}
                          onContextMenu={(event) => openEmployeeMenu(event, row)}
                          title={nameTitle}
                        >
                          {canEdit && (
                            <span className="sp-move">
                              <button type="button" className="sp-move-btn" onClick={(e) => { e.stopPropagation(); moveRow(row.employeeId, -1); }}>▲</button>
                              <button type="button" className="sp-move-btn" onClick={(e) => { e.stopPropagation(); moveRow(row.employeeId, 1); }}>▼</button>
                            </span>
                          )}
                          <strong>{row.employeeName}</strong>
                          <small>{row.contractedHours}h</small>
                        </td>
                        {DAYS.map((dayName) => {
                          const day = (row.days || []).find((item) => item.day === dayName);
                          const label = cellLabel(day);
                          const holiday = !!(day?.isHoliday || (day?.date && holidaySet.has(day.date)));
                          const prevRest = hints?.prevRestWeekdays?.has(dayName);
                          const sixthLimit = day?.date && hints?.seventhDates?.has(day.date);
                          const locked = !canEditDay(day?.date);
                          const hintClass = `${prevRest ? ' sp-cell-prev-rest' : ''}${sixthLimit ? ' sp-cell-six-day' : ''}${locked ? ' sp-cell-locked' : ''}`;
                          const hintTitle = [
                            prevRest ? `Repos en semaine ${prevWeek.weekNumber}` : '',
                            sixthLimit ? '7e jour consécutif sans repos' : '',
                            locked ? 'Jour verrouillé' : ''
                          ].filter(Boolean).join(' · ');
                          return (
                            <td
                              key={dayName}
                              className={`sp-cell ${cellClass({ ...day, isHoliday: holiday })}${hintClass} ${canEdit && !locked ? 'sp-cell-edit' : ''}`}
                              onClick={() => openEditor(row, dayName)}
                              title={hintTitle || undefined}
                            >
                              <div className="sp-cell-label">{label || '—'}</div>
                              {dayDisplayHours(day, row.contractedHours) > 0 && (
                                <div className="sp-cell-hours">{formatHours(dayDisplayHours(day, row.contractedHours))}</div>
                              )}
                              {holiday && day?.paidHours > 0 && (
                                <div className="sp-cell-holiday-hint">majoré</div>
                              )}
                              {holiday && !(day?.paidHours > 0) && (
                                <div className="sp-cell-holiday-hint">Férié</div>
                              )}
                              {day?.alerts?.length > 0 && <div className="sp-cell-flag">!</div>}
                              <div className="sp-pause-line">Pause : de ______ à ______</div>
                            </td>
                          );
                        })}
                        <td
                          className={`sp-total${hoursMatchContract(row, layer === 'actual') ? ' sp-total-match' : ''}${layer === 'actual' && canEdit && !actualLocked ? ' sp-total-recup' : ''}`}
                          onClick={() => openRecupModal(row)}
                          title={layer === 'actual' && canEdit && !actualLocked ? 'Cliquer pour affecter des heures de récup' : undefined}
                        >
                          <strong>{formatHours(rowWeekHours(row, layer === 'actual'))}</strong>
                          <small>/ {formatHours(row.contractedHours)}</small>
                          {rowCpHours(row) > 0 && <small>CP {formatHours(rowCpHours(row))}</small>}
                          {layer === 'actual' && rowRecupHours(row) !== 0 && (
                            <small className={rowRecupHours(row) > 0 ? 'sp-recup-pos' : 'sp-recup-neg'}>
                              Récup {rowRecupHours(row) > 0 ? '+' : ''}{formatHours(rowRecupHours(row))}
                            </small>
                          )}
                          {row.weeklyOt25 > 0 && <small>HS 25% {formatHours(row.weeklyOt25)}</small>}
                          {row.weeklyOt50 > 0 && <small>HS 50% {formatHours(row.weeklyOt50)}</small>}
                          {row.weeklyHolidayHours > 0 && <small>Férié {formatHours(row.weeklyHolidayHours)}</small>}
                          {row.weeklySickDays > 0 && <small>Maladie {row.weeklySickDays} j</small>}
                          {month?.sickDays > 0 && <small>Mal. {monthLabel}: {month.sickDays} j</small>}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {alerts.length > 0 && (
        <div className="sp-alerts no-print">
          <h3>Alertes de la semaine</h3>
          <ul>
            {alerts.map((alert, index) => (
              <li key={`${alert.employeeName}-${alert.day}-${index}`}>
                <strong>{alert.employeeName}</strong> — {alert.day} : {alert.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {menu && (
        <div
          className="sp-ctx no-print"
          style={{ left: menu.x, top: menu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <p className="sp-ctx-title">{menu.employeeName}</p>
          {canEdit && (
            <>
              <button type="button" onClick={() => copyRows('from-prev', [String(menu.employeeId)])}>
                Importer la semaine {prevWeek.weekNumber} → {weekNumber}
              </button>
              <button type="button" onClick={() => copyRows('to-next', [String(menu.employeeId)])}>
                Copier vers la semaine {nextWeek.weekNumber}
              </button>
              <button
                type="button"
                onClick={() => setMenu((current) => current && ({ ...current, swapOpen: !current.swapOpen }))}
              >
                Intervertir avec…
              </button>
              {menu.swapOpen && (
                <div className="sp-ctx-swap">
                  {displayedRows.filter((row) => String(row.employeeId) !== String(menu.employeeId)).length === 0
                    ? <p className="sp-ctx-empty">Aucun autre salarié</p>
                    : displayedRows
                      .filter((row) => String(row.employeeId) !== String(menu.employeeId))
                      .map((row) => (
                        <button
                          key={String(row.employeeId)}
                          type="button"
                          disabled={saving}
                          onClick={() => swapWith(row)}
                        >
                          {row.employeeName}
                        </button>
                      ))}
                </div>
              )}
            </>
          )}
          <button type="button" onClick={() => openStats(menu.employeeId, menu.employeeName)}>
            Statistiques
          </button>
        </div>
      )}

      {teamModal && (
        <div className="sp-modal-backdrop no-print" onClick={() => !saving && setTeamModal(false)}>
          <div className="sp-modal sp-modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3>Planning de l’équipe</h3>
            <p className="sp-modal-help">
              Les jours CFA ne sont ni importés, ni exportés, ni écrasés.
            </p>
            <div className="sp-team-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setTeamSelected(employeeOptions.map((row) => String(row.employeeId)))}
              >
                Tous
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setTeamSelected([])}>
                Aucun
              </button>
            </div>
            <div className="sp-team-list">
              {employeeOptions.map((row) => {
                const id = String(row.employeeId);
                return (
                  <label key={id}>
                    <input
                      type="checkbox"
                      checked={teamSelected.includes(id)}
                      onChange={() => toggleTeamEmployee(id)}
                    />
                    {row.employeeName}
                  </label>
                );
              })}
            </div>
            <div className="sp-modal-actions sp-modal-actions-split">
              <button
                type="button"
                className="btn btn-primary"
                disabled={saving}
                onClick={() => copyRows('from-prev', teamSelected)}
              >
                Importer S{prevWeek.weekNumber} → S{weekNumber}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={saving}
                onClick={() => copyRows('to-next', teamSelected)}
              >
                Copier S{weekNumber} → S{nextWeek.weekNumber}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setTeamModal(false)} disabled={saving}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {statsModal && (
        <div className="sp-modal-backdrop no-print" onClick={() => setStatsModal(null)}>
          <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Statistiques — {statsModal.employeeName}</h3>
            <p className="sp-modal-help">Année {statsModal.year || year}</p>
            {statsModal.loading && <p>Chargement…</p>}
            {statsModal.error && <p className="sp-stats-error">{statsModal.error}</p>}
            {statsModal.stats && (
              <table className="sp-stats-table">
                <tbody>
                  <tr>
                    <th>Dimanche</th>
                    <td>{statsModal.stats.sunday.rest} repos / {statsModal.stats.sunday.worked} travaillé(s)</td>
                  </tr>
                  <tr>
                    <th>Samedi</th>
                    <td>{statsModal.stats.saturday.rest} repos / {statsModal.stats.saturday.worked} travaillé(s)</td>
                  </tr>
                  <tr>
                    <th>Jours fériés</th>
                    <td>{statsModal.stats.holiday.rest} repos / {statsModal.stats.holiday.worked} travaillé(s)</td>
                  </tr>
                  <tr>
                    <th>Maladie</th>
                    <td>{statsModal.stats.sickDays} jour(s)</td>
                  </tr>
                  <tr>
                    <th>Absences</th>
                    <td>{statsModal.stats.absences} jour(s)</td>
                  </tr>
                </tbody>
              </table>
            )}
            <div className="sp-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setStatsModal(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {recupModal && (() => {
        const recup = Number.parseFloat(String(recupModal.hours).replace(',', '.'));
        const recupValue = Number.isFinite(recup) ? recup : 0;
        const accountant = Math.round((Number(recupModal.worked) - recupValue) * 100) / 100;
        const ot = overtimeFromPaid(accountant, settings);
        return (
          <div className="sp-modal-backdrop no-print" onClick={() => !saving && setRecupModal(null)}>
            <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Heures de récup — {recupModal.employeeName}</h3>
              <p className="sp-modal-help">
                Semaine {weekNumber} · travaillé {formatHours(recupModal.worked)} / contrat {formatHours(recupModal.contractedHours)}.
                Un + ajoute au compteur et diminue les heures vues par le comptable. Un − retire du compteur.
              </p>
              <label className="sp-recup-field">
                Heures de récup cette semaine
                <input
                  className="form-control"
                  type="number"
                  step="0.25"
                  value={recupModal.hours}
                  onChange={(e) => setRecupModal((current) => ({ ...current, hours: e.target.value }))}
                />
              </label>
              <label className="sp-recup-field">
                Justificatif
                <textarea
                  className="form-control"
                  rows={2}
                  value={recupModal.comment}
                  onChange={(e) => setRecupModal((current) => ({ ...current, comment: e.target.value }))}
                  placeholder="Heures faites en plus, ou récup prise"
                />
              </label>
              <div className="sp-recup-preview">
                <p>Comptable : <strong>{formatHours(accountant)}</strong></p>
                <p>HS 25% : <strong>{formatHours(ot.ot25)}</strong>{ot.ot50 > 0 ? ` · HS 50% ${formatHours(ot.ot50)}` : ''}</p>
                <p>Compteur salarié : <strong>{recupValue > 0 ? '+' : ''}{formatHours(recupValue)}</strong></p>
              </div>
              <div className="sp-modal-actions">
                <button type="button" className="btn btn-primary" onClick={saveRecupModal} disabled={saving}>
                  Enregistrer
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setRecupModal(null)} disabled={saving}>
                  Annuler
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {editor && (
        <div className="sp-modal-backdrop" onClick={() => !saving && setEditor(null)}>
          <form
            className="sp-modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              if (!saving) submitEditor();
            }}
          >
            <h3>{editor.employeeName} — {editor.day} {formatShortDate(editor.date)}</h3>
            <div className="sp-shift-fields">
              <div className="sp-shift-block">
                <span className="sp-shift-caption">Créneau 1</span>
                <div className="sp-time-row">
                  <TimePair
                    hourRef={startHourRef}
                    value={editor.start1}
                    hourLabel="Heure de début"
                    minuteLabel="Minutes de début"
                    onChange={(start1) => setEditor((p) => ({ ...p, start1 }))}
                  />
                  <span className="sp-time-arrow" aria-hidden="true">→</span>
                  <TimePair
                    value={editor.end1}
                    hourLabel="Heure de fin"
                    minuteLabel="Minutes de fin"
                    onChange={(end1) => setEditor((p) => ({ ...p, end1 }))}
                  />
                </div>
              </div>
              <div className="sp-shift-block">
                <span className="sp-shift-caption">Créneau 2 (optionnel, coupure)</span>
                <div className="sp-time-row">
                  <TimePair
                    emptyOk
                    skipTab
                    value={editor.start2}
                    hourLabel="Heure de début coupure"
                    minuteLabel="Minutes de début coupure"
                    onChange={(start2) => setEditor((p) => ({ ...p, start2 }))}
                  />
                  <span className="sp-time-arrow" aria-hidden="true">→</span>
                  <TimePair
                    emptyOk
                    skipTab
                    value={editor.end2}
                    hourLabel="Heure de fin coupure"
                    minuteLabel="Minutes de fin coupure"
                    onChange={(end2) => setEditor((p) => ({ ...p, end2 }))}
                  />
                </div>
              </div>
            </div>
            <label className="sp-apply-week">
              <input
                type="checkbox"
                tabIndex={-1}
                checked={!!editor.applyToWeek}
                onChange={(e) => setEditor((p) => ({ ...p, applyToWeek: e.target.checked }))}
              />
              Appliquer pour toute la semaine
            </label>
            <p className="sp-modal-help">
              Si aucun mot-code n’est choisi, l’horaire du jour est recopié sur la semaine. Les jours CFA ne sont pas écrasés.
              Un CP appliqué à toute la semaine laisse les jours REPOS à 0 h (6 j de CP + 1 repos = le volume du contrat).
              Tab : heure → minutes → heure de fin. Entrée : enregistrer et ouvrir le jour suivant (sauf le dimanche).
            </p>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '…' : 'Enregistrer les horaires'}
            </button>
            <div className="sp-word-block">
              <p className="sp-word-title">Mots-codes</p>
              <div className="sp-word-chips">
                {words.map((word) => (
                  <button
                    key={word.code}
                    type="button"
                    className={`sp-word-chip${editor.currentCode === word.code ? ' active' : ''}`}
                    disabled={saving}
                    onClick={() => applyCode(word.code)}
                  >
                    <strong>{word.code}</strong>
                    <span>
                      {String(word.code).toUpperCase() === 'CP' || word.category === 'cp'
                        ? formatHours(cpHoursForContract(editor.contractedHours))
                        : formatHours(word.hours)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="sp-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={clearCell} disabled={saving}>Effacer</button>
              <button type="button" className="btn btn-secondary" onClick={() => setEditor(null)} disabled={saving}>Annuler</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default StaffPlanning;
