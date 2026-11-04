import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import './ServiceNotesEmployee.css';

function formatWhen(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

const ServiceNotesEmployee = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await api.get('/service-notes/mine');
        if (!cancelled) setNotes(response.data?.notes || []);
      } catch (error) {
        toast.error(error.response?.data?.error || 'Impossible de charger les notes de service');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const unsigned = notes.filter((note) => !note.signedAt);
  const signed = notes.filter((note) => note.signedAt);

  return (
    <div className="sn-emp">
      <header>
        <h1>Notes de service</h1>
        <p>Consultez les notes de la direction et confirmez-en la lecture par signature.</p>
      </header>
      {loading ? (
        <p>Chargement…</p>
      ) : notes.length === 0 ? (
        <p className="sn-emp-empty">Aucune note de service pour le moment.</p>
      ) : (
        <>
          {unsigned.length > 0 && (
            <section>
              <h2>À signer</h2>
              {unsigned.map((note) => (
                <article key={note.id} className="sn-emp-card is-pending">
                  <button type="button" onClick={() => setOpenId(openId === note.id ? '' : note.id)}>
                    <strong>{note.title}</strong>
                    <span>{formatWhen(note.createdAt)}</span>
                  </button>
                  {openId === note.id && <p className="sn-emp-content">{note.content}</p>}
                  <small>Une fenêtre vous demandera de signer cette note.</small>
                </article>
              ))}
            </section>
          )}
          {signed.length > 0 && (
            <section>
              <h2>Lues et signées</h2>
              {signed.map((note) => (
                <article key={note.id} className="sn-emp-card">
                  <button type="button" onClick={() => setOpenId(openId === note.id ? '' : note.id)}>
                    <strong>{note.title}</strong>
                    <span>Signée le {formatWhen(note.signedAt)}</span>
                  </button>
                  {openId === note.id && <p className="sn-emp-content">{note.content}</p>}
                </article>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default ServiceNotesEmployee;
