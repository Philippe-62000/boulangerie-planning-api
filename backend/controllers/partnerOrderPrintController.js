/**
 * File d'impression des commandes entreprises pour l'agent des caisses.
 * L'agent (script sur la caisse Crisalid) interroge GET /print-queue,
 * imprime les tickets renvoyés, puis confirme via POST /print-queue/ack.
 * Le texte du ticket est construit ici pour garder l'agent le plus simple possible.
 */
const PartnerOrder = require('../models/PartnerOrder');

const TICKET_WIDTH = 42; // caractères par ligne (imprimante 80 mm, marge de sécurité)
const DEFAULT_WINDOW_HOURS = 72; // ne jamais imprimer un stock d'anciennes commandes
const MAX_TICKETS_PER_CALL = 10;

function siteMatchQuery(site) {
  if (site === 'longuenesse') return { site: { $in: ['longuenesse', 'lon'] } };
  return { site: { $in: ['arras', 'plan'] } };
}

const siteMap = { lon: 'longuenesse', plan: 'arras' };
const normalizeSite = (s) => {
  const v = String(s || '').toLowerCase();
  return siteMap[v] || (v === 'arras' ? 'arras' : 'longuenesse');
};

const SITE_LABELS = { longuenesse: 'LONGUENESSE', arras: 'ARRAS' };
const MEAL_LABELS = { breakfast: 'Petit-dejeuner', lunch: 'Dejeuner' };
const TIER_LABELS = { eco: 'Eco', classic: 'Classique', premium: 'Premium' };
const KIND_LABELS = {
  formula: 'Formule',
  devis: 'Devis',
  commande: 'Commande libre',
  liste: 'Liste produits'
};

function formatParisDateTime(d) {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('fr-FR', {
    timeZone: 'Europe/Paris',
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/** Coupe un texte en lignes <= width, avec préfixe optionnel sur les suites. */
function wrapText(text, width = TICKET_WIDTH, indent = '') {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= width) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = indent + word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function separator() {
  return '-'.repeat(TICKET_WIDTH);
}

function pushWrapped(lines, label, value) {
  if (!value) return;
  wrapText(`${label} : ${value}`, TICKET_WIDTH, '  ').forEach((l) => lines.push(l));
}

function buildOrderTicket(order) {
  const site = normalizeSite(order.site);
  const lines = [];

  lines.push(separator());
  pushWrapped(lines, 'Entreprise', order.companyName || '');
  pushWrapped(lines, 'Contact', order.contactName || '');
  const when = formatParisDateTime(order.datetime);
  pushWrapped(lines, order.fulfillment === 'pickup' ? 'RETRAIT le' : 'LIVRAISON le', when);
  pushWrapped(lines, 'Type', KIND_LABELS[order.orderKind] || 'Formule');

  if (order.orderKind === 'formula') {
    const meal = MEAL_LABELS[order.mealType] || '';
    const tier = TIER_LABELS[order.tier] || '';
    const formule = [order.itemsSnapshot?.label, meal, tier].filter(Boolean).join(' - ');
    pushWrapped(lines, 'Formule', formule);
    pushWrapped(lines, 'Quantite', String(order.quantity || 1));
  } else if (order.orderKind === 'liste') {
    pushWrapped(lines, 'Quantite', String(order.quantity || 0));
  }

  if (order.orderKind === 'devis') {
    const prospect = [order.prospectFirstName, order.prospectLastName].filter(Boolean).join(' ');
    pushWrapped(lines, 'Demandeur', prospect);
    pushWrapped(lines, 'Structure', order.prospectStructureName || '');
    pushWrapped(lines, 'Tel', order.prospectPhone || '');
    pushWrapped(lines, 'Email', order.prospectEmail || '');
  }

  const items = Array.isArray(order.itemsSnapshot?.items) ? order.itemsSnapshot.items : [];
  if (items.length > 0) {
    lines.push(separator());
    lines.push('Contenu :');
    items.slice(0, 60).forEach((it) => {
      wrapText(`- ${it}`, TICKET_WIDTH, '  ').forEach((l) => lines.push(l));
    });
  }

  const minis = Array.isArray(order.miniViennoiserieDetail) ? order.miniViennoiserieDetail : [];
  if (minis.length > 0) {
    lines.push(separator());
    lines.push(`Mini-viennoiseries (${order.miniViennoiserieTotal || ''} total) :`);
    minis.forEach((mv) => {
      wrapText(`- ${mv.name} x ${mv.quantity}`, TICKET_WIDTH, '  ').forEach((l) => lines.push(l));
    });
  }

  const detail = String(order.requestDetail || order.itemsSnapshot?.description || '').trim();
  if (detail) {
    lines.push(separator());
    lines.push('Detail :');
    wrapText(detail, TICKET_WIDTH).forEach((l) => lines.push(l));
  }

  lines.push(separator());
  pushWrapped(lines, 'Recue le', formatParisDateTime(order.createdAt));
  lines.push('A valider dans le dashboard Filmara.');

  return {
    id: String(order._id),
    kind: 'order',
    title: 'NOUVELLE COMMANDE',
    subtitle: `ENTREPRISE - ${SITE_LABELS[site]}`,
    lines
  };
}

function buildClientRequestTicket(order) {
  const site = normalizeSite(order.site);
  const isCancel = order.clientRequest?.type === 'cancel';
  const lines = [];

  lines.push(separator());
  pushWrapped(lines, 'Entreprise', order.companyName || '');
  const when = formatParisDateTime(order.datetime);
  pushWrapped(lines, order.fulfillment === 'pickup' ? 'Retrait prevu' : 'Livraison prevue', when);
  pushWrapped(lines, 'Demande le', formatParisDateTime(order.clientRequest?.requestedAt));

  const proposedItems = order.clientRequest?.proposedChanges?.itemsSnapshot?.items;
  if (!isCancel && Array.isArray(proposedItems) && proposedItems.length > 0) {
    lines.push(separator());
    lines.push('Nouveau contenu propose :');
    proposedItems.slice(0, 60).forEach((it) => {
      wrapText(`- ${it}`, TICKET_WIDTH, '  ').forEach((l) => lines.push(l));
    });
  }

  lines.push(separator());
  lines.push('A traiter dans le dashboard Filmara.');

  return {
    id: String(order._id),
    kind: 'clientRequest',
    title: isCancel ? 'DEMANDE ANNULATION' : 'DEMANDE MODIFICATION',
    subtitle: `COMMANDE ENTREPRISE - ${SITE_LABELS[site]}`,
    lines
  };
}

/** GET /api/partner-orders/print-queue?site=arras — tickets en attente d'impression. */
const printQueue = async (req, res) => {
  try {
    const site = normalizeSite(req.query.site);
    const siteQ = siteMatchQuery(site);
    const windowHours = Math.min(
      Math.max(parseInt(req.query.windowHours, 10) || DEFAULT_WINDOW_HOURS, 1),
      24 * 14
    );
    const since = new Date(Date.now() - windowHours * 3600 * 1000);

    const [newOrders, requestOrders] = await Promise.all([
      PartnerOrder.find({
        ...siteQ,
        status: 'submitted',
        printedAt: null,
        createdAt: { $gte: since }
      })
        .sort({ createdAt: 1 })
        .limit(MAX_TICKETS_PER_CALL)
        .lean(),
      PartnerOrder.find({
        ...siteQ,
        'clientRequest.status': 'pending',
        'clientRequest.printedAt': null,
        'clientRequest.requestedAt': { $gte: since }
      })
        .sort({ 'clientRequest.requestedAt': 1 })
        .limit(MAX_TICKETS_PER_CALL)
        .lean()
    ]);

    const tickets = [
      ...newOrders.map(buildOrderTicket),
      ...requestOrders.map(buildClientRequestTicket)
    ];

    res.json({ success: true, data: { tickets } });
  } catch (err) {
    console.error('❌ printQueue:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/** POST /api/partner-orders/print-queue/ack — confirme l'impression des tickets. */
const printQueueAck = async (req, res) => {
  try {
    const site = normalizeSite(req.body?.site);
    const siteQ = siteMatchQuery(site);
    const orderIds = Array.isArray(req.body?.orderIds) ? req.body.orderIds : [];
    const clientRequestOrderIds = Array.isArray(req.body?.clientRequestOrderIds)
      ? req.body.clientRequestOrderIds
      : [];
    const now = new Date();

    const [ordersResult, requestsResult] = await Promise.all([
      orderIds.length > 0
        ? PartnerOrder.updateMany(
            { _id: { $in: orderIds }, ...siteQ },
            { $set: { printedAt: now } }
          )
        : { modifiedCount: 0 },
      clientRequestOrderIds.length > 0
        ? PartnerOrder.updateMany(
            { _id: { $in: clientRequestOrderIds }, ...siteQ },
            { $set: { 'clientRequest.printedAt': now } }
          )
        : { modifiedCount: 0 }
    ]);

    res.json({
      success: true,
      data: {
        ordersMarked: ordersResult.modifiedCount || 0,
        clientRequestsMarked: requestsResult.modifiedCount || 0
      }
    });
  } catch (err) {
    console.error('❌ printQueueAck:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { printQueue, printQueueAck };
