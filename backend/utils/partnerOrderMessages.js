const ALERT_HIDE_STATUSES = new Set(['acknowledged', 'cancelled']);

function normalizeMessages(raw) {
  return Array.isArray(raw) ? raw.filter((m) => m && m.text && m.from) : [];
}

function appendOrderMessage(order, from, text) {
  const t = String(text || '').trim().slice(0, 2000);
  if (!t) return false;
  if (!['bakery', 'client'].includes(from)) return false;
  if (!Array.isArray(order.messages)) order.messages = [];
  order.messages.push({ from, text: t, at: new Date() });
  order.messageAlertClearedAt = null;
  return true;
}

function clearOrderMessageAlert(order) {
  if (!order) return;
  order.messageAlertClearedAt = new Date();
}

/** null | awaiting_reply | reply_received */
function resolveMessageAlert(order) {
  const plain = order && typeof order === 'object' ? order : {};
  if (plain.messageAlertClearedAt) return null;
  if (ALERT_HIDE_STATUSES.has(plain.status)) return null;

  const msgs = normalizeMessages(plain.messages);
  if (!msgs.length) return null;

  let lastBakeryIdx = -1;
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].from === 'bakery') {
      lastBakeryIdx = i;
      break;
    }
  }

  if (lastBakeryIdx < 0) return null;

  const hasClientReplyAfter = msgs.slice(lastBakeryIdx + 1).some((m) => m.from === 'client');
  return hasClientReplyAfter ? 'reply_received' : 'awaiting_reply';
}

function enrichOrderMessages(plain) {
  const o = plain && typeof plain === 'object' ? { ...plain } : {};
  o.messageAlert = resolveMessageAlert(o);
  o.hasOpenMessageThread = !!o.messageAlert;
  return o;
}

async function countMessageAlertsForSite(PartnerOrder, site) {
  const orders = await PartnerOrder.find({ site }).select('status messages messageAlertClearedAt').lean();
  let awaitingReply = 0;
  let replyReceived = 0;
  for (const o of orders) {
    const alert = resolveMessageAlert(o);
    if (alert === 'awaiting_reply') awaitingReply += 1;
    if (alert === 'reply_received') replyReceived += 1;
  }
  return { awaitingReply, replyReceived };
}

module.exports = {
  ALERT_HIDE_STATUSES,
  appendOrderMessage,
  clearOrderMessageAlert,
  resolveMessageAlert,
  enrichOrderMessages,
  countMessageAlertsForSite
};
