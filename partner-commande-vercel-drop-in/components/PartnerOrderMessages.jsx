'use client';

import React, { useState } from 'react';

/**
 * Fil de messages boulangerie ↔ client sur une commande.
 * À intégrer sur la liste « Mes commandes » du site Vercel (même API Render que Filmara).
 *
 * Props:
 *   order — document commande (messages[], status, _id)
 *   apiBase — ex. process.env.NEXT_PUBLIC_PARTNER_API_UPSTREAM ou '' si routes proxy /api
 *   token — JWT entreprise
 *   onReplied — callback après réponse envoyée
 */
export default function PartnerOrderMessages({ order, apiBase = '', token, onReplied }) {
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  if (!order) return null;

  const messages = Array.isArray(order.messages) ? order.messages : [];
  let lastBakeryIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].from === 'bakery') {
      lastBakeryIdx = i;
      break;
    }
  }
  const hasClientReplyAfter =
    lastBakeryIdx >= 0 && messages.slice(lastBakeryIdx + 1).some((m) => m.from === 'client');
  const canReply =
    lastBakeryIdx >= 0 &&
    !hasClientReplyAfter &&
    order.status !== 'acknowledged' &&
    order.status !== 'cancelled';

  const formatWhen = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return '—';
    }
  };

  const submitReply = async () => {
    const text = String(reply || '').trim();
    if (!text || !token) return;
    const id = order._id || order.id;
    if (!id) return;
    setSending(true);
    setError('');
    try {
      const base = String(apiBase || '').replace(/\/+$/, '');
      const url = base
        ? `${base}/api/partner-orders/my/${id}/reply`
        : `/api/partner-orders/my/${id}/reply`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text, site: order.site || 'longuenesse' })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Envoi impossible');
      setReply('');
      if (onReplied) onReplied(data.data || order);
    } catch (e) {
      setError(e.message || 'Erreur');
    } finally {
      setSending(false);
    }
  };

  if (!messages.length && !canReply) return null;

  return (
    <div
      style={{
        marginTop: 12,
        padding: 10,
        borderRadius: 8,
        border: '1px solid #e2e8f0',
        background: '#f8fafc'
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.95rem' }}>Messages</div>
      {messages.length === 0 ? (
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>Aucun message.</p>
      ) : (
        <div style={{ display: 'grid', gap: 8, marginBottom: canReply ? 10 : 0 }}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                background: m.from === 'bakery' ? '#eef2ff' : '#fff',
                border: `1px solid ${m.from === 'bakery' ? '#c7d2fe' : '#e2e8f0'}`
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                {m.from === 'bakery' ? 'Boulangerie' : 'Vous'} — {formatWhen(m.at)}
              </div>
              <div style={{ marginTop: 4, whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{m.text}</div>
            </div>
          ))}
        </div>
      )}
      {canReply ? (
        <>
          <p style={{ margin: '0 0 6px', fontSize: '0.88rem', color: '#334155' }}>
            La boulangerie attend votre réponse :
          </p>
          <textarea
            rows={3}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Votre réponse…"
            style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #cbd5e1', marginBottom: 8 }}
          />
          {error ? <p style={{ color: '#b02a37', fontSize: '0.85rem' }}>{error}</p> : null}
          <button
            type="button"
            onClick={submitReply}
            disabled={sending || !String(reply).trim()}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: 'none',
              background: '#667eea',
              color: '#fff',
              fontWeight: 600,
              cursor: sending ? 'wait' : 'pointer'
            }}
          >
            {sending ? 'Envoi…' : 'Envoyer ma réponse'}
          </button>
        </>
      ) : null}
    </div>
  );
}
