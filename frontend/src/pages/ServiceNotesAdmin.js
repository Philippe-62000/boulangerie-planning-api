import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import './ServiceNotesAdmin.css';

const AUDIENCES = [
  { id: 'all', label: 'Tous les salariés' },
  { id: 'vente', label: 'Tous les vendeurs' },
  { id: 'boulanger', label: 'Tous les boulangers' },
  { id: 'preparation', label: 'Tous les préparateurs' }
];

function formatWhen(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

const ServiceNotesAdmin = () => {
  const [audience, setAudience] = useState('all');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [notes, setNotes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState('');
  const [detail, setDetail] = useState(null);
  const [assignNoteId, setAssignNoteId] = useState('');
  const [assignEmployeeId, setAssignEmployeeId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const loadNotes = useCallback(async () => {
    const response = await api.get('/service-notes');
    setNotes(response.data?.notes || []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [notesRes, empRes] = await Promise.all([
          api.get('/service-notes'),
          api.get('/employees')
        ]);
        if (cancelled) return;
        setNotes(notesRes.data?.notes || []);
        const list = empRes.data?.success ? empRes.data.data : empRes.data;
        setEmployees((Array.isArray(list) ? list : []).filter((item) => item.isActive !== false));
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

  const handleSend = async (event) => {
    event.preventDefault();
    const text = content.trim();
    if (!text) {
      toast.error('Saisissez le contenu de la note');
      return;
    }
    setSending(true);
    try {
      const response = await api.post('/service-notes', {
        audience,
        title: title.trim(),
        content: text
      });
      toast.success(response.data?.message || 'Note envoyée');
      setContent('');
      setTitle('');
      await loadNotes();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de l’envoi');
    } finally {
      setSending(false);
    }
  };

  const openNote = async (id) => {
    if (openId === id) {
      setOpenId('');
      setDetail(null);
      return;
    }
    setOpenId(id);
    try {
      const response = await api.get(`/service-notes/${id}`);
      setDetail(response.data?.note || null);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Impossible de charger le détail');
    }
  };

  const handleDelete = async (note) => {
    if (!window.confirm(`Supprimer la note « ${note.title} » ?`)) return;
    try {
      await api.delete(`/service-notes/${note.id}`);
      toast.success('Note supprimée');
      if (openId === note.id) {
        setOpenId('');
        setDetail(null);
      }
      await loadNotes();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Suppression impossible');
    }
  };

  const handleAssign = async (noteId) => {
    if (!assignEmployeeId) {
      toast.error('Choisissez un salarié');
      return;
    }
    setAssigning(true);
    try {
      const response = await api.post(`/service-notes/${noteId}/assign`, {
        employeeIds: [assignEmployeeId]
      });
      toast.success(response.data?.message || 'Salarié ajouté');
      setAssignEmployeeId('');
      setAssignNoteId('');
      await loadNotes();
      if (openId === noteId) {
        const detailRes = await api.get(`/service-notes/${noteId}`);
        setDetail(detailRes.data?.note || null);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Attribution impossible');
    } finally {
      setAssigning(false);
    }
  };

  const recipients = detail?.recipients || [];

  return (
    <div className="sn-admin">
      <header className="sn-admin-header">
        <p className="sn-admin-back">
          <Link to="/message-vente">← Messages</Link>
        </p>
        <h1>Message à Diffuser</h1>
        <p>Note de service destinée aux salariés. Ils devront la lire et la signer sur leur espace.</p>
      </header>

      <form className="sn-admin-form" onSubmit={handleSend}>
        <label>
          <span>Destinataires</span>
          <select value={audience} onChange={(e) => setAudience(e.target.value)} disabled={sending}>
            {AUDIENCES.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Titre (optionnel)</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="Note de service"
            disabled={sending}
          />
        </label>
        <label>
          <span>Contenu</span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            maxLength={8000}
            placeholder="Écrire la note de service…"
            disabled={sending}
          />
          <small>{content.length} / 8000</small>
        </label>
        <div className="sn-admin-actions">
          <button type="submit" className="btn btn-primary" disabled={sending || !content.trim()}>
            {sending ? 'Envoi…' : 'Envoyer la note'}
          </button>
        </div>
      </form>

      <section className="sn-admin-list">
        <h2>Notes envoyées</h2>
        {loading ? (
          <p>Chargement…</p>
        ) : notes.length === 0 ? (
          <p className="sn-admin-empty">Aucune note pour le moment.</p>
        ) : (
          notes.map((note) => {
            const assignedIds = new Set((detail?.id === note.id ? recipients : note.recipients || []).map((item) => String(item.employeeId)));
            const candidates = employees.filter((emp) => !assignedIds.has(String(emp._id)));
            return (
              <article key={note.id} className="sn-admin-card">
                <div className="sn-admin-card-head">
                  <button type="button" className="sn-admin-toggle" onClick={() => openNote(note.id)}>
                    <strong>{note.title}</strong>
                    <span>{note.audienceLabel} · {formatWhen(note.createdAt)}</span>
                    <span>
                      Lus {note.viewedCount}/{note.recipientCount} · Signés {note.signedCount}/{note.recipientCount}
                    </span>
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => handleDelete(note)}>
                    Supprimer
                  </button>
                </div>
                {openId === note.id && detail?.id === note.id && (
                  <div className="sn-admin-detail">
                    <p className="sn-admin-content">{detail.content}</p>
                    <table className="sn-admin-table">
                      <thead>
                        <tr>
                          <th>Salarié</th>
                          <th>Lu</th>
                          <th>Signé</th>
                          <th>Signature</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recipients.map((item) => (
                          <tr key={String(item.employeeId)}>
                            <td>{item.employeeName}</td>
                            <td>{item.viewedAt ? formatWhen(item.viewedAt) : 'Non'}</td>
                            <td>{item.signedAt ? formatWhen(item.signedAt) : 'Non'}</td>
                            <td>
                              {item.signatureDataUrl ? (
                                <img src={item.signatureDataUrl} alt={`Signature ${item.employeeName}`} className="sn-admin-sign" />
                              ) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="sn-admin-assign">
                      <span>Ajouter un salarié (nouvelle arrivée)</span>
                      <select
                        value={assignNoteId === note.id ? assignEmployeeId : ''}
                        onChange={(e) => {
                          setAssignNoteId(note.id);
                          setAssignEmployeeId(e.target.value);
                        }}
                      >
                        <option value="">Choisir…</option>
                        {candidates.map((emp) => (
                          <option key={emp._id} value={emp._id}>{emp.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={assigning || assignNoteId !== note.id || !assignEmployeeId}
                        onClick={() => handleAssign(note.id)}
                      >
                        Attribuer
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>
    </div>
  );
};

export default ServiceNotesAdmin;
