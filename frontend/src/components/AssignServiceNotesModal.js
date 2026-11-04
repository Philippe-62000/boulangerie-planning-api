import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import './AssignServiceNotesModal.css';

const AssignServiceNotesModal = ({ employee, onClose }) => {
  const [notes, setNotes] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await api.get('/service-notes');
        if (!cancelled) setNotes(response.data?.notes || []);
      } catch (error) {
        toast.error(error.response?.data?.error || 'Impossible de charger les notes');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleSave = async () => {
    if (!selected.length) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      const response = await api.post('/service-notes/assign-employee', {
        employeeId: employee._id,
        noteIds: selected
      });
      toast.success(response.data?.message || 'Notes attribuées');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Attribution impossible');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sn-assign-backdrop" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="sn-assign-card" role="dialog" aria-labelledby="sn-assign-title">
        <h2 id="sn-assign-title">Notes de service pour {employee.name}</h2>
        <p>Choisissez les notes que ce nouveau salarié devra lire et signer.</p>
        {loading ? (
          <p>Chargement…</p>
        ) : notes.length === 0 ? (
          <p>Aucune note existante.</p>
        ) : (
          <div className="sn-assign-list">
            {notes.map((note) => (
              <label key={note.id}>
                <input
                  type="checkbox"
                  checked={selected.includes(note.id)}
                  onChange={() => toggle(note.id)}
                />
                <span>
                  <strong>{note.title}</strong>
                  <small>
                    {note.audienceLabel} · {new Date(note.createdAt).toLocaleDateString('fr-FR')}
                  </small>
                </span>
              </label>
            ))}
          </div>
        )}
        <div className="sn-assign-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Plus tard
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Enregistrement…' : 'Attribuer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignServiceNotesModal;
