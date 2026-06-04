/**
 * EXEMPLE — à adapter dans votre page « Mes commandes » Vercel.
 * Ne pas importer tel quel : copier les parties utiles dans votre fichier existant.
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import PartnerOrderMessages from '../components/PartnerOrderMessages';

const TOKEN_KEY = 'partnerToken'; // ← remplacer par la clé réelle de votre projet

export default function OrdersListWithMessagesExample() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : '';

  const loadOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/partner-orders/my?site=longuenesse', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      setOrders(Array.isArray(json?.data) ? json.data : []);
    } catch (e) {
      console.error(e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const onOrderReplied = (updated) => {
    const uid = String(updated._id || updated.id);
    setOrders((prev) => prev.map((o) => (String(o._id || o.id) === uid ? { ...o, ...updated } : o)));
  };

  if (loading) return <p>Chargement…</p>;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {orders.map((order) => (
        <article
          key={order._id || order.id}
          style={{ border: '1px solid #e5e5e5', borderRadius: 10, padding: 12 }}
        >
          <h3>{order.itemsSnapshot?.label || 'Commande'}</h3>
          <p>
            Livraison :{' '}
            {order.datetime
              ? new Date(order.datetime).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })
              : '—'}
          </p>

          {/* ← Bloc messages : à placer sous le détail produit */}
          <PartnerOrderMessages
            order={order}
            token={token}
            site="longuenesse"
            onReplied={onOrderReplied}
          />
        </article>
      ))}
    </div>
  );
}
