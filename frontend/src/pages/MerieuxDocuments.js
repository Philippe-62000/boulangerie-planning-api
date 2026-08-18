import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { isArrasSite } from '../config/site';
import { useAuth } from '../contexts/AuthContext';
import { openAuditSanitaireFile } from '../utils/auditSanitaireFiles';
import './MerieuxDocuments.css';

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

const MerieuxDocuments = () => {
  const { isAdmin } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [markingId, setMarkingId] = useState(null);
  const showDriveFolder = isAdmin();

  const load = useCallback(async () => {
    if (!isArrasSite()) {
      setAlerts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/audit-sanitaire/history', { params: { site: 'arras' } });
      setAlerts(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) {
      console.warn('Historique Mérieux:', e.response?.status || e.message);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    if (filter === 'pending') return alerts.filter((a) => a.status === 'pending');
    if (filter === 'printed') return alerts.filter((a) => a.status === 'printed');
    return alerts;
  }, [alerts, filter]);

  const markPrinted = async (id) => {
    if (!id) return;
    if (!window.confirm('Marquer ces documents comme imprimés ? Ils disparaîtront du tableau de bord.')) {
      return;
    }
    setMarkingId(id);
    try {
      await api.post(`/audit-sanitaire/${id}/printed`);
      await load();
    } catch (e) {
      alert(e.response?.data?.error || 'Impossible de marquer comme imprimé');
    } finally {
      setMarkingId(null);
    }
  };

  if (!isArrasSite()) {
    return (
      <div className="merieux-page">
        <h1>Mérieux</h1>
        <p>Cette liste est disponible uniquement pour Arras.</p>
      </div>
    );
  }

  return (
    <div className="merieux-page">
      <h1>🧪 Mérieux</h1>
      <p className="merieux-intro">
        Historique des documents d’audit sanitaire. Le bandeau du tableau de bord n’affiche que ceux
        encore à imprimer.
      </p>

      <div className="merieux-filters">
        <button
          type="button"
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          Tous ({alerts.length})
        </button>
        <button
          type="button"
          className={filter === 'pending' ? 'active' : ''}
          onClick={() => setFilter('pending')}
        >
          À imprimer ({alerts.filter((a) => a.status === 'pending').length})
        </button>
        <button
          type="button"
          className={filter === 'printed' ? 'active' : ''}
          onClick={() => setFilter('printed')}
        >
          Imprimés ({alerts.filter((a) => a.status === 'printed').length})
        </button>
      </div>

      {loading ? (
        <p>Chargement…</p>
      ) : visible.length === 0 ? (
        <p className="merieux-empty">Aucun document pour ce filtre.</p>
      ) : (
        <div className="merieux-table-wrap">
          <table className="merieux-table">
            <thead>
              <tr>
                <th>Statut</th>
                <th>Objet du mail</th>
                <th>Date du mail</th>
                <th>Date d’impression</th>
                <th>Imprimé par</th>
                <th>Documents</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((alert) => {
                const pending = alert.status === 'pending';
                return (
                  <tr key={alert.id} className={pending ? 'merieux-row-pending' : ''}>
                    <td>
                      <span className={pending ? 'merieux-badge pending' : 'merieux-badge printed'}>
                        {pending ? 'À imprimer' : 'Imprimé'}
                      </span>
                      {pending && (
                        <button
                          type="button"
                          className="merieux-print-btn"
                          disabled={markingId === alert.id}
                          onClick={() => markPrinted(alert.id)}
                        >
                          {markingId === alert.id ? 'Enregistrement…' : 'Marquer imprimé'}
                        </button>
                      )}
                    </td>
                    <td>
                      <div className="merieux-subject">{alert.subject || 'Documents Mérieux'}</div>
                      {showDriveFolder && alert.driveFolderUrl && (
                        <a
                          href={alert.driveFolderUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="merieux-folder"
                        >
                          Dossier Drive
                        </a>
                      )}
                    </td>
                    <td>{formatDateTime(alert.receivedAt)}</td>
                    <td>{pending ? '—' : formatDateTime(alert.printedAt)}</td>
                    <td>{pending ? '—' : alert.printedByName || '—'}</td>
                    <td>
                      {alert.files?.length > 0 ? (
                        <ul className="merieux-files">
                          {alert.files.map((file, idx) => (
                            <li key={`${alert.id}-${idx}`}>
                              <button
                                type="button"
                                className="merieux-file-btn"
                                onClick={() => openAuditSanitaireFile(alert.id, file, file.index ?? idx)}
                              >
                                {file.name || 'Ouvrir'}
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        '—'
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
  );
};

export default MerieuxDocuments;
