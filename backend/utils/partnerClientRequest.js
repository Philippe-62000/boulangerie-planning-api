const CLIENT_REQUEST_TYPES = new Set(['cancel', 'modify']);

function hasPendingClientRequest(order) {
  return order?.clientRequest?.status === 'pending';
}

/** Le client peut envoyer une demande (annulation ou modification). */
function canClientSubmitRequest(order) {
  if (!order || order.status !== 'acknowledged') return false;
  if (hasPendingClientRequest(order)) return false;
  const cr = order.clientRequest;
  if (!cr || !cr.status) return true;
  return cr.status === 'acknowledged';
}

function buildClientRequest(type, proposedChanges = null) {
  if (!CLIENT_REQUEST_TYPES.has(type)) {
    throw new Error('Type de demande invalide');
  }
  const req = {
    type,
    status: 'pending',
    requestedAt: new Date(),
    acknowledgedAt: null,
    proposedChanges: null
  };
  if (type === 'modify' && proposedChanges && typeof proposedChanges === 'object') {
    req.proposedChanges = proposedChanges;
  }
  return req;
}

function acknowledgeClientRequest(order) {
  if (!hasPendingClientRequest(order)) return null;
  const type = order.clientRequest.type;
  order.clientRequest.status = 'acknowledged';
  order.clientRequest.acknowledgedAt = new Date();
  return type;
}

function clientRequestQuery(type) {
  return {
    status: 'acknowledged',
    'clientRequest.type': type,
    'clientRequest.status': 'pending'
  };
}

module.exports = {
  CLIENT_REQUEST_TYPES,
  hasPendingClientRequest,
  canClientSubmitRequest,
  buildClientRequest,
  acknowledgeClientRequest,
  clientRequestQuery
};
