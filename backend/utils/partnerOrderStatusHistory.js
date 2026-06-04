const STATUS_VALUES = ['submitted', 'acknowledged', 'invoiced', 'paid', 'cancelled'];

function initialStatusHistory(status = 'submitted', at = new Date()) {
  return [{ status, at }];
}

/** Ajoute une entrée si le statut change. */
function appendStatusChange(order, nextStatus, at = new Date()) {
  if (!order || !nextStatus) return;
  if (order.status === nextStatus) return;
  if (!Array.isArray(order.statusHistory)) order.statusHistory = [];
  order.statusHistory.push({ status: nextStatus, at });
  order.status = nextStatus;
  order.statusUpdatedAt = at;
}

/**
 * Timeline pour l’admin Filmara (anciennes commandes sans historique : repli createdAt / statusUpdatedAt).
 */
function buildStatusHistoryTimeline(order) {
  const raw = order && typeof order === 'object' ? order : {};
  const hist = Array.isArray(raw.statusHistory) ? raw.statusHistory.filter((h) => h && h.status) : [];
  if (hist.length) {
    return hist
      .map((h) => ({ status: h.status, at: h.at }))
      .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  }

  const out = [];
  const created = raw.createdAt ? new Date(raw.createdAt) : null;
  const updated = raw.statusUpdatedAt ? new Date(raw.statusUpdatedAt) : null;
  const cur = raw.status || 'submitted';

  if (created && !Number.isNaN(created.getTime())) {
    out.push({ status: 'submitted', at: created });
  }
  if (cur !== 'submitted' && updated && !Number.isNaN(updated.getTime())) {
    const last = out[out.length - 1];
    if (!last || last.status !== cur || new Date(last.at).getTime() !== updated.getTime()) {
      out.push({ status: cur, at: updated });
    }
  }
  return out;
}

module.exports = {
  STATUS_VALUES,
  initialStatusHistory,
  appendStatusChange,
  buildStatusHistoryTimeline
};
