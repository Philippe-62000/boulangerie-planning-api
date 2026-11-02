import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatClockShort } from '../utils/staffPlanning';
import './PlanningImperative.css';

const NOTICE_TITLE = 'Contraintes ponctuelles de planning';
const NOTICE_BUTTON = 'Lire les contraintes ponctuelles de planning';
const NOTICE_PARAGRAPHS = [
  'Ce formulaire a pour objectif de recueillir vos contraintes personnelles ponctuelles afin de faciliter l’organisation des plannings et d’en tenir compte dans la mesure du possible.',
  'Il est destiné à signaler uniquement les impératifs personnels incontournables nécessitant une organisation particulière de votre journée de travail : rendez-vous médical, déménagement, démarches administratives importantes ou autre obligation ne pouvant être déplacée.',
  'Les contraintes signalées seront étudiées et prises en compte dans la mesure du possible, en fonction des nécessités de service, des effectifs et de l’équilibre général des plannings.'
];

function todayIsoParis() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

function formatFrDate(isoDate) {
  if (!isoDate) return '';
  const [year, month, day] = String(isoDate).split('-');
  return `${day}/${month}/${year}`;
}

function imperativeLabel(item) {
  if (!item) return '';
  if (item.kind === 'rest') return 'Journée complète en repos';
  return `Indisponible de ${formatClockShort(item.startTime)} à ${formatClockShort(item.endTime)}`;
}

const emptyForm = {
  date: todayIsoParis(),
  kind: 'rest',
  startTime: '08:00',
  endTime: '12:00',
  comment: ''
};

const PlanningImperative = () => {
  const { isAdmin } = useAuth();
  const admin = isAdmin();
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/planning-imperatives');
      setItems(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || 'Impossible de charger les impératifs');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const upcoming = useMemo(() => {
    const today = todayIsoParis();
    return items.filter((item) => item.date >= today);
  }, [items]);

  const submit = async (event) => {
    event.preventDefault();
    if (admin) return;
    if (!form.date) {
      toast.error('Indiquez la date de l’impératif');
      return;
    }
    if (form.kind === 'unavailable' && (!form.startTime || !form.endTime)) {
      toast.error('Indiquez l’heure de début et l’heure de fin');
      return;
    }
    setSaving(true);
    try {
      const response = await api.post('/planning-imperatives', {
        date: form.date,
        kind: form.kind,
        startTime: form.kind === 'unavailable' ? form.startTime : '',
        endTime: form.kind === 'unavailable' ? form.endTime : '',
        comment: form.comment
      });
      toast.success(response.data?.updated
        ? 'Impératif mis à jour pour cette date'
        : 'Impératif enregistré. Il apparaîtra sur le planning du jour concerné.');
      setForm({ ...emptyForm, date: form.date });
      await loadItems();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Impossible d’enregistrer l’impératif');
    } finally {
      setSaving(false);
    }
  };

  const cancelItem = async (item) => {
    if (!item?.id) return;
    if (!window.confirm('Annuler cet impératif de planning ?')) return;
    try {
      await api.delete(`/planning-imperatives/${item.id}`);
      toast.success('Impératif annulé');
      await loadItems();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Impossible d’annuler cet impératif');
    }
  };

  return (
    <div className="imp-page fade-in">
      <div className="imp-header">
        <div>
          <h2>📌 Impératif de Planning</h2>
          <p>
            {admin
              ? 'Contraintes ponctuelles signalées par les salariés, à prendre en compte lors de la réalisation du planning.'
              : 'Signalez une journée complète de repos ou une plage horaire à ne pas proposer.'}
          </p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => setNoticeOpen(true)}>
          {NOTICE_BUTTON}
        </button>
      </div>

      {!admin && (
        <form className="imp-card" onSubmit={submit}>
          <label className="imp-field">
            <span>Date de l’impératif</span>
            <input
              type="date"
              min={todayIsoParis()}
              value={form.date}
              onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
              required
            />
          </label>

          <fieldset className="imp-kinds">
            <legend>Type d’impératif</legend>
            <label className={form.kind === 'rest' ? 'is-active' : ''}>
              <input
                type="radio"
                name="imperative-kind"
                checked={form.kind === 'rest'}
                onChange={() => setForm((prev) => ({ ...prev, kind: 'rest' }))}
              />
              <span>
                <strong>Journée complète en repos</strong>
                <small>Ne pas proposer de créneau ce jour-là</small>
              </span>
            </label>
            <label className={form.kind === 'unavailable' ? 'is-active' : ''}>
              <input
                type="radio"
                name="imperative-kind"
                checked={form.kind === 'unavailable'}
                onChange={() => setForm((prev) => ({ ...prev, kind: 'unavailable' }))}
              />
              <span>
                <strong>Indisponible de telle heure à telle heure</strong>
                <small>Période à ne pas proposer sur la journée</small>
              </span>
            </label>
          </fieldset>

          {form.kind === 'unavailable' && (
            <div className="imp-times">
              <label className="imp-field">
                <span>De</span>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
                  required
                />
              </label>
              <label className="imp-field">
                <span>À</span>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
                  required
                />
              </label>
            </div>
          )}

          <label className="imp-field">
            <span>Précision (optionnel)</span>
            <textarea
              rows={3}
              maxLength={500}
              value={form.comment}
              onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
              placeholder="Ex. rendez-vous médical, déménagement…"
            />
          </label>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer l’impératif'}
          </button>
        </form>
      )}

      <section className="imp-card">
        <h3>{admin ? 'Impératifs à venir' : 'Mes impératifs'}</h3>
        {loading ? (
          <p className="imp-empty">Chargement…</p>
        ) : upcoming.length === 0 ? (
          <p className="imp-empty">Aucun impératif enregistré pour les prochaines semaines.</p>
        ) : (
          <ul className="imp-list">
            {upcoming.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{formatFrDate(item.date)}{admin && item.employeeName ? ` — ${item.employeeName}` : ''}</strong>
                  <span>{imperativeLabel(item)}</span>
                  {item.comment ? <small>{item.comment}</small> : null}
                </div>
                <button type="button" className="btn btn-secondary" onClick={() => cancelItem(item)}>
                  Annuler
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {noticeOpen && (
        <div className="imp-modal-backdrop" onClick={() => setNoticeOpen(false)}>
          <div className="imp-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="imp-notice-title">
            <h3 id="imp-notice-title">{NOTICE_TITLE}</h3>
            {NOTICE_PARAGRAPHS.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <button type="button" className="btn btn-primary" onClick={() => setNoticeOpen(false)}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanningImperative;
