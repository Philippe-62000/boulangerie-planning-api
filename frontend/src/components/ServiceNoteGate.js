import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import SignaturePad from './SignaturePad';
import './ServiceNoteGate.css';

const ServiceNoteGate = () => {
  const { user } = useAuth();
  const employeeMode = user?.role === 'employee';
  const [notes, setNotes] = useState([]);
  const [signature, setSignature] = useState({ hasInk: false, dataUrl: '' });
  const [saving, setSaving] = useState(false);

  const loadPending = useCallback(async () => {
    if (!employeeMode) {
      setNotes([]);
      return;
    }
    try {
      const response = await api.get('/service-notes/mine/pending');
      setNotes(response.data?.notes || []);
    } catch (_) {
      /* silencieux : ne pas bloquer l’espace si l’API est indisponible */
    }
  }, [employeeMode]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const current = notes[0];

  useEffect(() => {
    if (!current?.id) return;
    setSignature({ hasInk: false, dataUrl: '' });
    api.post(`/service-notes/${current.id}/viewed`).catch(() => {});
  }, [current?.id]);

  if (!employeeMode || !current) return null;

  const handleSign = async () => {
    if (!signature.hasInk || !signature.dataUrl) {
      toast.error('Signez dans le cadre pour valider la lecture');
      return;
    }
    setSaving(true);
    try {
      await api.post(`/service-notes/${current.id}/sign`, {
        signatureDataUrl: signature.dataUrl
      });
      toast.success('Lecture de la note enregistrée');
      setNotes((prev) => prev.filter((note) => note.id !== current.id));
    } catch (error) {
      toast.error(error.response?.data?.error || 'Impossible d’enregistrer la signature');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sn-gate" role="dialog" aria-modal="true" aria-labelledby="sn-gate-title">
      <div className="sn-gate-card">
        <p className="sn-gate-kicker">Note de service {notes.length > 1 ? `· ${1} / ${notes.length}` : ''}</p>
        <h2 id="sn-gate-title">{current.title}</h2>
        <p className="sn-gate-meta">
          {current.createdAt
            ? new Date(current.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
            : ''}
        </p>
        <div className="sn-gate-content">{current.content}</div>
        <p className="sn-gate-hint">Après lecture, signez pour confirmer que vous avez pris connaissance de cette note.</p>
        <SignaturePad key={current.id} onChange={setSignature} />
        <button
          type="button"
          className="btn btn-primary"
          disabled={saving || !signature.hasInk}
          onClick={handleSign}
        >
          {saving ? 'Enregistrement…' : 'J’ai lu et je signe'}
        </button>
      </div>
    </div>
  );
};

export default ServiceNoteGate;
