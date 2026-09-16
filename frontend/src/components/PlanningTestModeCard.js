import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

function employeeListFrom(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload?.success && Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

const PlanningTestModeCard = () => {
  const [settings, setSettings] = useState({ testMode: false, testEmployeeIds: [] });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [settingsRes, employeesRes] = await Promise.all([
        api.get('/staff-planning/settings'),
        api.get('/employees')
      ]);
      const next = settingsRes.data?.settings || {};
      setSettings({
        testMode: !!next.testMode,
        testEmployeeIds: Array.isArray(next.testEmployeeIds) ? next.testEmployeeIds.map(String) : []
      });
      setEmployees(employeeListFrom(employeesRes.data).filter((item) => item.isActive !== false));
    } catch (error) {
      toast.error('Impossible de charger le mode test planning');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const persist = async (patch, options = {}) => {
    const next = {
      testMode: patch.testMode !== undefined ? patch.testMode : settings.testMode,
      testEmployeeIds: patch.testEmployeeIds !== undefined ? patch.testEmployeeIds : settings.testEmployeeIds
    };
    setSaving(true);
    try {
      const response = await api.put('/staff-planning/settings', next);
      const saved = response.data?.settings || next;
      setSettings({
        testMode: !!saved.testMode,
        testEmployeeIds: Array.isArray(saved.testEmployeeIds) ? saved.testEmployeeIds.map(String) : []
      });
      if (!options.silent) {
        toast.success(next.testMode
          ? 'Mode test activé — seuls les salariés cochés reçoivent mails et notifications'
          : 'Mode test désactivé — tous les salariés actifs reçoivent à nouveau le planning');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Enregistrement du mode test impossible');
    } finally {
      setSaving(false);
    }
  };

  const selected = useMemo(() => new Set((settings.testEmployeeIds || []).map(String)), [settings.testEmployeeIds]);
  const visible = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    return [...employees]
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'fr'))
      .filter((item) => {
        if (!needle) return true;
        return `${item.name || ''} ${item.email || ''}`.toLowerCase().includes(needle);
      });
  }, [employees, filter]);

  const toggleEmployee = (id, checked) => {
    const nextIds = checked
      ? Array.from(new Set([...settings.testEmployeeIds, String(id)]))
      : settings.testEmployeeIds.filter((item) => item !== String(id));
    persist({ testEmployeeIds: nextIds }, { silent: true });
  };

  const toggleMode = (checked) => {
    if (!checked) {
      if (!window.confirm('Désactiver le mode test ? Tous les salariés actifs recevront à nouveau les mails et notifications de planning.')) {
        return;
      }
    } else if (!settings.testEmployeeIds.length) {
      if (!window.confirm('Aucun salarié n’est encore coché. Tant que la liste est vide, personne ne recevra de mail ni de notification. Continuer ?')) {
        return;
      }
    }
    persist({ testMode: checked });
  };

  const selectedNames = employees
    .filter((item) => selected.has(String(item._id)))
    .map((item) => item.name);

  if (loading) {
    return (
      <div className="card planning-test-card">
        <div className="card-body">Chargement du mode test…</div>
      </div>
    );
  }

  return (
    <div className={`card planning-test-card${settings.testMode ? ' planning-test-card-on' : ''}`}>
      <div className="card-header">
        <h3>Mode test planning</h3>
        <p>
          Quand il est activé, seuls les salariés cochés reçoivent un mail ou une notification
          (prise de connaissance, planning modifié, signature du réel). Les autres ne sont pas prévenus.
        </p>
      </div>
      <div className="card-body">
        <label className="planning-test-toggle">
          <input
            type="checkbox"
            checked={!!settings.testMode}
            disabled={saving}
            onChange={(event) => toggleMode(event.target.checked)}
          />
          <span>{settings.testMode ? 'Mode test activé' : 'Mode test désactivé'}</span>
        </label>
        {settings.testMode && (
          <p className="planning-test-warning">
            {selectedNames.length
              ? `Mails et notifications uniquement pour : ${selectedNames.join(', ')}.`
              : 'Aucun salarié coché : personne ne reçoit de mail ni de notification.'}
          </p>
        )}
        <input
          className="form-control"
          type="search"
          placeholder="Filtrer un salarié…"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          style={{ maxWidth: '24rem', margin: '0.75rem 0' }}
        />
        <div className="planning-test-list">
          {visible.map((employee) => {
            const id = String(employee._id);
            return (
              <label key={id} className="planning-test-item">
                <input
                  type="checkbox"
                  checked={selected.has(id)}
                  disabled={saving}
                  onChange={(event) => toggleEmployee(id, event.target.checked)}
                />
                <span>
                  <strong>{employee.name}</strong>
                  <small>{employee.email || 'pas d’e-mail sur la fiche'}</small>
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PlanningTestModeCard;
