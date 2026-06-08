/** Applique les changements proposés par le client sur une commande partenaire. */
function applyProposedOrderChanges(order, changes) {
  if (!order || !changes || typeof changes !== 'object') return;

  if (changes.fulfillment) {
    order.fulfillment = changes.fulfillment === 'pickup' ? 'pickup' : 'delivery';
  }
  if (changes.datetime) {
    const dt = new Date(changes.datetime);
    if (!Number.isNaN(dt.getTime())) order.datetime = dt;
  }
  if (changes.orderKind) order.orderKind = String(changes.orderKind);
  if (changes.mealType !== undefined) order.mealType = changes.mealType || null;
  if (changes.tier !== undefined) order.tier = changes.tier || null;
  if (changes.quantity != null) order.quantity = Math.max(1, Number(changes.quantity) || 1);
  if (changes.requestDetail != null) order.requestDetail = String(changes.requestDetail || '').trim();
  if (changes.contactName != null) order.contactName = String(changes.contactName || '').trim();
  if (changes.prospectFirstName != null) order.prospectFirstName = String(changes.prospectFirstName || '').trim();
  if (changes.prospectLastName != null) order.prospectLastName = String(changes.prospectLastName || '').trim();
  if (changes.prospectStructureName != null) {
    order.prospectStructureName = String(changes.prospectStructureName || '').trim();
  }
  if (changes.prospectPhone != null) order.prospectPhone = String(changes.prospectPhone || '').trim();
  if (changes.prospectEmail != null) order.prospectEmail = String(changes.prospectEmail || '').trim();
  if (changes.itemsSnapshot && typeof changes.itemsSnapshot === 'object') {
    order.itemsSnapshot = changes.itemsSnapshot;
  }
}

module.exports = { applyProposedOrderChanges };
