import React, { useMemo } from 'react';
import {
  computeMiniViennoiserieTotal,
  validateBreakfastMiniViennoiserie
} from '../lib/partnerMiniViennoiserie';

/**
 * Bloc à intégrer sur commande-longuenesse.vercel.app (formulaire petit déjeuner).
 *
 * Props:
 * - tierSnap: formule breakfast[tier] depuis GET /api/partner-orders/formulas
 * - quantity: nombre de formules
 * - detail: [{ name, quantity }]
 * - onChangeDetail: (rows) => void
 */
export default function PartnerBreakfastMiniViennoiseries({ tierSnap, quantity, detail, onChangeDetail }) {
  const options = useMemo(
    () => (tierSnap?.miniViennoiserieOptions || []).map((s) => String(s).trim()).filter(Boolean),
    [tierSnap]
  );

  const totalRequired = useMemo(
    () => computeMiniViennoiserieTotal(tierSnap, quantity),
    [tierSnap, quantity]
  );

  const validation = useMemo(
    () =>
      validateBreakfastMiniViennoiserie({
        tierSnap,
        quantity,
        miniViennoiserieDetail: detail
      }),
    [tierSnap, quantity, detail]
  );

  if (options.length === 0 || totalRequired <= 0) return null;

  const perFormula = tierSnap?.miniViennoiserieCountPerFormula ?? 1;
  const remaining = validation.remaining ?? Math.max(0, totalRequired - (validation.normalized || []).reduce((s, r) => s + r.quantity, 0));

  const setQty = (name, raw) => {
    const q = Math.max(0, Math.floor(Number(raw) || 0));
    const others = (detail || []).filter((d) => d.name !== name);
    const next = q > 0 ? [...others, { name, quantity: q }] : others;
    onChangeDetail(next);
  };

  const getQty = (name) => {
    const row = (detail || []).find((d) => d.name === name);
    return row ? row.quantity : 0;
  };

  return (
    <div
      style={{
        marginTop: 16,
        padding: 14,
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        background: '#fafafa'
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Mini-viennoiseries</div>
      <p style={{ margin: '0 0 12px', color: '#555', fontSize: '0.95rem', lineHeight: 1.45 }}>
        {perFormula} par formule × {quantity} formule{quantity > 1 ? 's' : ''} ={' '}
        <strong>{totalRequired} au total</strong>. Répartissez exactement {totalRequired} unités.
      </p>
      <p
        style={{
          margin: '0 0 12px',
          fontWeight: 700,
          color: remaining === 0 ? '#15803d' : '#b45309'
        }}
      >
        Reste à répartir : {remaining}
      </p>
      {options.map((name) => (
        <label
          key={name}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 100px',
            gap: 10,
            alignItems: 'center',
            marginBottom: 8
          }}
        >
          <span>{name}</span>
          <input
            type="number"
            min={0}
            value={getQty(name)}
            onChange={(e) => setQty(name, e.target.value)}
            style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db' }}
          />
        </label>
      ))}
      {!validation.ok && validation.error ? (
        <p style={{ color: '#b02a37', marginTop: 10, fontSize: '0.9rem' }}>{validation.error}</p>
      ) : null}
    </div>
  );
}

export function canSubmitBreakfastOrder({ tierSnap, quantity, detail }) {
  const check = validateBreakfastMiniViennoiserie({
    tierSnap,
    quantity,
    miniViennoiserieDetail: detail
  });
  return check.ok;
}
