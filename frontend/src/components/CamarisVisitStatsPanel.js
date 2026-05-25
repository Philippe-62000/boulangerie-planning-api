import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';

const formatMonthLabel = (monthKey) => {
  if (!monthKey) return '';
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
};

const formatDayLabel = (dateKey) => {
  if (!dateKey) return '';
  const [y, m, d] = dateKey.split('-');
  return `${d}/${m}/${y}`;
};

const CamarisVisitStatsPanel = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/camaris/admin/visit-stats');
      setStats(res.data?.data || null);
    } catch (e) {
      console.error(e);
      setStats(null);
      setError('Impossible de charger les statistiques de visites.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <p style={{ color: '#666', fontSize: '0.9rem' }}>Chargement des visites…</p>;
  }

  if (error) {
    return <p style={{ color: '#c00', fontSize: '0.9rem' }}>{error}</p>;
  }

  if (!stats) return null;

  const { summary, daily, monthly, compare } = stats;
  const deltaSign = compare.delta > 0 ? '+' : '';
  const deltaColor = compare.delta >= 0 ? '#2d6a4f' : '#c0392b';

  return (
    <div
      className="camaris-visit-stats-panel"
      style={{
        marginTop: '1.5rem',
        padding: '1rem',
        background: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e0e0e0'
      }}
    >
      <h5 style={{ margin: '0 0 0.75rem', color: '#2c3e50' }}>📊 Visites page Camaris (Vercel)</h5>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1rem',
          fontSize: '0.95rem'
        }}
      >
        <span>
          <strong>{summary.today}</strong> aujourd&apos;hui
        </span>
        <span>
          <strong>{summary.week}</strong> cette semaine
        </span>
        <span>
          <strong>{summary.month}</strong> ce mois
        </span>
        <span style={{ color: '#888' }}>
          ({summary.total} au total depuis le compteur)
        </span>
      </div>

      {compare ? (
        <p style={{ margin: '0 0 1rem', fontSize: '0.9rem' }}>
          Mois en cours ({formatMonthLabel(compare.currentMonth)}) : <strong>{compare.currentMonthCount}</strong>
          {' — '}
          mois précédent ({formatMonthLabel(compare.previousMonth)}) : <strong>{compare.previousMonthCount}</strong>
          {' — '}
          <span style={{ color: deltaColor, fontWeight: 600 }}>
            {deltaSign}
            {compare.delta} vs mois précédent
          </span>
        </p>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        <div>
          <h6 style={{ margin: '0 0 0.5rem' }}>Par jour (35 derniers jours)</h6>
          <div style={{ maxHeight: '220px', overflow: 'auto', fontSize: '0.85rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#eee' }}>
                  <th style={{ padding: '0.35rem', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '0.35rem', textAlign: 'right' }}>Visites</th>
                </tr>
              </thead>
              <tbody>
                {[...(daily || [])].reverse().map((row) => (
                  <tr key={row.date} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '0.35rem' }}>{formatDayLabel(row.date)}</td>
                    <td style={{ padding: '0.35rem', textAlign: 'right', fontWeight: row.count > 0 ? 600 : 400 }}>
                      {row.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h6 style={{ margin: '0 0 0.5rem' }}>Par mois (comparaison)</h6>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#eee' }}>
                <th style={{ padding: '0.35rem', textAlign: 'left' }}>Mois</th>
                <th style={{ padding: '0.35rem', textAlign: 'right' }}>Visites</th>
              </tr>
            </thead>
            <tbody>
              {[...(monthly || [])].reverse().map((row) => (
                <tr key={row.month} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.35rem' }}>{formatMonthLabel(row.month)}</td>
                  <td style={{ padding: '0.35rem', textAlign: 'right', fontWeight: 600 }}>
                    {row.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }} onClick={load}>
        Actualiser les stats
      </button>
    </div>
  );
};

export default CamarisVisitStatsPanel;
