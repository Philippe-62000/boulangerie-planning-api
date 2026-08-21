import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { isArrasSite } from '../config/site';
import { useAuth } from '../contexts/AuthContext';
import './CommandeMail.css';

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

function sanitizeMailHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?>/gi, '')
    .replace(/on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '');
}

const CommandeMail = ({ standalone = false }) => {
  const { isAdmin } = useAuth();
  const [mails, setMails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('unread');
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [bodyTab, setBodyTab] = useState('text');
  const [deletingId, setDeletingId] = useState(null);
  const [printing, setPrinting] = useState(false);
  const canDelete = isAdmin();

  const load = useCallback(async () => {
    if (!isArrasSite()) {
      setMails([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/commande-mails');
      setMails(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) {
      console.warn('Commande mail:', e.response?.status || e.message);
      setMails([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    if (filter === 'unread') return mails.filter((m) => m.status === 'unread');
    if (filter === 'read') return mails.filter((m) => m.status === 'read');
    return mails;
  }, [mails, filter]);

  const openMail = async (id) => {
    if (!id) return;
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const res = await api.get(`/commande-mails/${id}`);
      const data = res.data?.data || null;
      setDetail(data);
      setBodyTab(data?.text ? 'text' : data?.html ? 'html' : 'text');
      setMails((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: 'read' } : m))
      );
    } catch (e) {
      alert(e.response?.data?.error || 'Impossible de charger ce mail');
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const printMail = async (id) => {
    if (!id) return;
    setPrinting(true);
    try {
      const res = await api.post(`/commande-mails/${id}/print`);
      alert(
        res.data?.message ||
          'Envoyé à l’imprimante des commandes. Le ticket sortira sous environ une minute.'
      );
    } catch (e) {
      alert(e.response?.data?.error || 'Impossible d’envoyer à l’imprimante');
    } finally {
      setPrinting(false);
    }
  };

  const deleteMail = async (id) => {
    if (!id || !canDelete) return;
    if (!window.confirm('Supprimer ce mail de commande ?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/commande-mails/${id}`);
      setMails((prev) => prev.filter((m) => m.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
        setDetail(null);
      }
    } catch (e) {
      alert(e.response?.data?.error || 'Impossible de supprimer');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isArrasSite()) {
    return (
      <div className="commande-mail-page">
        <h1>Commande mail</h1>
        <p className="commande-mail-intro">Cette page est disponible uniquement pour Arras.</p>
      </div>
    );
  }

  return (
    <div className={`commande-mail-page${standalone ? ' standalone' : ''}`}>
      {standalone && (
        <div className="commande-mail-standalone-bar">
          <strong>Filmara Arras</strong>
          <a href="/plan/commande-mail">Ouvrir dans le menu Filmara</a>
        </div>
      )}
      <h1>Commande mail</h1>
      <p className="commande-mail-intro">
        Mails de commande envoyés par n8n. À l’arrivée, le contenu part sur l’imprimante
        des commandes (comme les messages). Vous pouvez aussi réimprimer depuis cette page.
      </p>

      <div className="commande-mail-filters">
        <button type="button" className={filter === 'unread' ? 'active' : ''} onClick={() => setFilter('unread')}>
          Non lus
        </button>
        <button type="button" className={filter === 'read' ? 'active' : ''} onClick={() => setFilter('read')}>
          Lus
        </button>
        <button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
          Tous
        </button>
        <button type="button" onClick={load}>Actualiser</button>
      </div>

      {loading ? (
        <p className="commande-mail-empty">Chargement…</p>
      ) : (
        <div className="commande-mail-layout">
          <div className="commande-mail-list">
            {visible.length === 0 ? (
              <p className="commande-mail-empty">Aucun mail pour ce filtre.</p>
            ) : (
              visible.map((mail) => (
                <button
                  type="button"
                  key={mail.id}
                  className={`commande-mail-item${mail.status === 'unread' ? ' unread' : ''}${selectedId === mail.id ? ' active' : ''}`}
                  onClick={() => openMail(mail.id)}
                >
                  <div className="commande-mail-item-meta">
                    <span>{formatDateTime(mail.receivedAt)}</span>
                    <span>{mail.attachmentCount ? `${mail.attachmentCount} pj` : ''}</span>
                  </div>
                  <div className="commande-mail-item-subject">{mail.subject || '(sans objet)'}</div>
                  <div className="commande-mail-item-from">{mail.from || 'Expéditeur inconnu'}</div>
                  {mail.snippet ? <div className="commande-mail-item-snippet">{mail.snippet}</div> : null}
                </button>
              ))
            )}
          </div>

          <div className="commande-mail-detail">
            {detailLoading ? (
              <p className="commande-mail-empty">Chargement du mail…</p>
            ) : !detail ? (
              <p className="commande-mail-empty">Sélectionnez un mail à gauche pour lire son contenu.</p>
            ) : (
              <>
                <div className="commande-mail-detail-header">
                  <h2>{detail.subject || '(sans objet)'}</h2>
                  <div className="commande-mail-detail-meta">
                    <div><strong>De :</strong> {detail.from || '—'}</div>
                    {detail.to ? <div><strong>À :</strong> {detail.to}</div> : null}
                    <div><strong>Date :</strong> {formatDateTime(detail.receivedAt)}</div>
                  </div>
                </div>

                {(detail.text || detail.html) && (
                  <div className="commande-mail-tabs">
                    {detail.text ? (
                      <button type="button" className={bodyTab === 'text' ? 'active' : ''} onClick={() => setBodyTab('text')}>
                        Texte
                      </button>
                    ) : null}
                    {detail.html ? (
                      <button type="button" className={bodyTab === 'html' ? 'active' : ''} onClick={() => setBodyTab('html')}>
                        HTML
                      </button>
                    ) : null}
                  </div>
                )}

                {bodyTab === 'html' && detail.html ? (
                  <iframe
                    className="commande-mail-html-frame"
                    title="Contenu HTML du mail"
                    sandbox=""
                    srcDoc={sanitizeMailHtml(detail.html)}
                  />
                ) : (
                  <pre className="commande-mail-body-text">
                    {detail.text || (detail.html ? 'Pas de version texte : ouvrez l’onglet HTML.' : 'Mail sans contenu.')}
                  </pre>
                )}

                {Array.isArray(detail.attachments) && detail.attachments.length > 0 && (
                  <ul className="commande-mail-attachments">
                    {detail.attachments.map((file, index) => (
                      <li key={`${file.name}-${index}`}>
                        {file.url ? (
                          <a href={file.url} target="_blank" rel="noopener noreferrer">{file.name}</a>
                        ) : (
                          file.name
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="commande-mail-detail-actions">
                  <button
                    type="button"
                    className="commande-mail-print-btn"
                    disabled={printing}
                    onClick={() => printMail(detail.id)}
                  >
                    {printing ? 'Envoi…' : 'Imprimer'}
                  </button>
                  {canDelete && (
                    <button
                      type="button"
                      className="commande-mail-delete-btn"
                      disabled={deletingId === detail.id}
                      onClick={() => deleteMail(detail.id)}
                    >
                      {deletingId === detail.id ? 'Suppression…' : 'Supprimer'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommandeMail;
