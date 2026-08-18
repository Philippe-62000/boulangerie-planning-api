import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { isArrasSite } from '../config/site';
import { useAuth } from '../contexts/AuthContext';
import { openAuditSanitaireFile } from '../utils/auditSanitaireFiles';

function formatReceivedAt(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

/**
 * Bandeau Arras uniquement : documents Mérieux à imprimer (déposés par n8n sur Drive).
 */
const AuditSanitaireBanner = () => {
  const { isAdmin } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const showDriveFolder = isAdmin();

  const load = useCallback(async () => {
    if (!isArrasSite()) {
      setAlerts([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/audit-sanitaire/pending', { params: { site: 'arras' } });
      setAlerts(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) {
      console.warn('Alerte audit sanitaire:', e.response?.status || e.message);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markPrinted = async (id) => {
    if (!id) return;
    if (!window.confirm('Marquer ces documents comme imprimés ? L’alerte disparaîtra du tableau de bord.')) {
      return;
    }
    setMarkingId(id);
    try {
      await api.post(`/audit-sanitaire/${id}/printed`);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      alert(e.response?.data?.error || 'Impossible de marquer comme imprimé');
    } finally {
      setMarkingId(null);
    }
  };

  if (!isArrasSite() || loading || alerts.length === 0) {
    return null;
  }

  return (
    <div
      className="card"
      style={{
        marginBottom: '1.25rem',
        padding: '1rem 1.25rem',
        border: '2px solid #dc3545',
        background: '#fff5f5',
        color: '#721c24'
      }}
    >
      <strong style={{ fontSize: '1.05rem' }}>
        🖨️ Documents audit sanitaire à imprimer
      </strong>
      <p style={{ margin: '0.35rem 0 0.75rem', lineHeight: 1.45 }}>
        Un mail Mérieux a déposé {alerts.length > 1 ? 'des lots de documents' : 'des documents'}{' '}
        à imprimer. Ouvrez-les, imprimez-les, puis marquez comme fait.
      </p>
      {alerts.map((alert) => (
        <div
          key={alert.id}
          style={{
            marginTop: '0.75rem',
            padding: '0.85rem 1rem',
            background: '#fff',
            borderRadius: 8,
            border: '1px solid #f5c2c7'
          }}
        >
          <div style={{ fontWeight: 600, color: '#333' }}>
            {alert.subject || 'Documents Mérieux'}
          </div>
          {alert.receivedAt && (
            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: 4 }}>
              Reçu le {formatReceivedAt(alert.receivedAt)}
            </div>
          )}
          {alert.files?.length > 0 && (
            <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.2rem' }}>
              {alert.files.map((file, idx) => (
                <li key={`${alert.id}-${idx}`} style={{ marginBottom: 4 }}>
                  <button
                    type="button"
                    onClick={() => openAuditSanitaireFile(alert.id, file, file.index ?? idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: '#0d6efd',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      font: 'inherit',
                      textAlign: 'left'
                    }}
                  >
                    {file.name || 'Ouvrir le fichier'}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
            {showDriveFolder && alert.driveFolderUrl && (
              <a
                href={alert.driveFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: '#0d6efd',
                  color: '#fff',
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                Ouvrir le dossier Drive
              </a>
            )}
            <button
              type="button"
              onClick={() => markPrinted(alert.id)}
              disabled={markingId === alert.id}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: 'none',
                background: '#198754',
                color: '#fff',
                fontWeight: 600,
                cursor: markingId === alert.id ? 'wait' : 'pointer'
              }}
            >
              {markingId === alert.id ? 'Enregistrement…' : 'Marquer comme imprimé'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AuditSanitaireBanner;
