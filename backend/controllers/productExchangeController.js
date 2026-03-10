const ProductExchange = require('../models/ProductExchange');
const ExchangePartner = require('../models/ExchangePartner');
const Site = require('../models/Site');
const emailService = require('../services/emailService');

// Obtenir le nom du site actuel (Longuenesse ou Arras)
const getCurrentSiteName = () => {
  const basePath = process.env.APP_BASE_PATH || '';
  if (basePath === '/lon') return 'Boulangerie Longuenesse';
  if (basePath === '/plan') return 'Boulangerie Arras';
  return 'Boulangerie';
};

// Récupérer tous les partenaires
const getPartners = async (req, res) => {
  try {
    const partners = await ExchangePartner.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: partners });
  } catch (error) {
    console.error('❌ Erreur récupération partenaires:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Créer un partenaire
const createPartner = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Nom et email requis' });
    }
    const partner = new ExchangePartner({ name: name.trim(), email: email.trim().toLowerCase() });
    await partner.save();
    res.status(201).json({ success: true, data: partner });
  } catch (error) {
    console.error('❌ Erreur création partenaire:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Modifier un partenaire
const updatePartner = async (req, res) => {
  try {
    const partner = await ExchangePartner.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!partner) return res.status(404).json({ success: false, error: 'Partenaire non trouvé' });
    res.json({ success: true, data: partner });
  } catch (error) {
    console.error('❌ Erreur mise à jour partenaire:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Supprimer un partenaire (soft delete)
const deletePartner = async (req, res) => {
  try {
    const partner = await ExchangePartner.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!partner) return res.status(404).json({ success: false, error: 'Partenaire non trouvé' });
    res.json({ success: true, data: partner });
  } catch (error) {
    console.error('❌ Erreur suppression partenaire:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Récupérer le site actuel pour les dropdowns
const getCurrentSite = async (req, res) => {
  try {
    const site = await Site.findOne({ isActive: true });
    const currentSiteName = getCurrentSiteName();
    res.json({
      success: true,
      data: {
        name: site ? `${site.name} ${site.city}` : currentSiteName,
        isCurrentSite: true
      }
    });
  } catch (error) {
    res.json({
      success: true,
      data: { name: getCurrentSiteName(), isCurrentSite: true }
    });
  }
};

// Récupérer tous les échanges
const getExchanges = async (req, res) => {
  try {
    const { partnerId, startDate, endDate } = req.query;
    const query = {};
    if (partnerId) {
      query.$or = [
        { fromPartnerId: partnerId },
        { toPartnerId: partnerId }
      ];
    }
    if (startDate) query.date = { ...query.date, $gte: new Date(startDate) };
    if (endDate) query.date = { ...query.date, $lte: new Date(endDate + 'T23:59:59.999Z') };

    const exchanges = await ProductExchange.find(query)
      .populate('fromPartnerId', 'name email')
      .populate('toPartnerId', 'name email')
      .sort({ date: -1 });
    res.json({ success: true, data: exchanges });
  } catch (error) {
    console.error('❌ Erreur récupération échanges:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Récupérer les échanges avec un partenaire (pour le récap dans l'email)
const getExchangesWithPartner = async (partnerId) => {
  return ProductExchange.find({
    $or: [
      { fromPartnerId: partnerId },
      { toPartnerId: partnerId }
    ]
  })
    .populate('fromPartnerId', 'name email')
    .populate('toPartnerId', 'name email')
    .sort({ date: -1 })
    .limit(50);
};

// Générer le HTML du tableau récapitulatif
const buildExchangesTableHtml = (exchanges, currentSiteName) => {
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '-';
  const getFromName = (ex) => ex.fromPartnerId ? ex.fromPartnerId.name : currentSiteName;
  const getToName = (ex) => ex.toPartnerId ? ex.toPartnerId.name : currentSiteName;

  let html = `
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
      <thead>
        <tr style="background: #f0f0f0;">
          <th>Date</th>
          <th>Produit</th>
          <th>Qté</th>
          <th>Détail</th>
          <th>De</th>
          <th>À</th>
          <th>Soldé</th>
          <th>Facturé</th>
          <th>Payé</th>
          <th>Valorisé le</th>
          <th>Montant</th>
        </tr>
      </thead>
      <tbody>
  `;
  exchanges.forEach(ex => {
    const valorisedStr = ex.valorisedAmount != null ? `${ex.valorisedAmount}€` : '-';
    html += `
      <tr>
        <td>${formatDate(ex.date)}</td>
        <td>${ex.productName}</td>
        <td>${ex.quantity}</td>
        <td>${ex.detail || '-'}</td>
        <td>${getFromName(ex)}</td>
        <td>${getToName(ex)}</td>
        <td>${formatDate(ex.settledAt)}</td>
        <td>${formatDate(ex.invoicedAt)}</td>
        <td>${formatDate(ex.paidAt)}</td>
        <td>${formatDate(ex.valorisedAt)}</td>
        <td>${valorisedStr}</td>
      </tr>
    `;
  });
  html += '</tbody></table>';
  return html;
};

// Créer un échange et envoyer l'email au partenaire
const createExchange = async (req, res) => {
  try {
    const { date, productName, quantity, detail, fromPartnerId, toPartnerId } = req.body;
    if (!date || !productName || quantity == null) {
      return res.status(400).json({ success: false, error: 'Date, produit et quantité requis' });
    }

    const fromId = fromPartnerId || null;
    const toId = toPartnerId || null;
    if (!fromId && !toId) {
      return res.status(400).json({ success: false, error: 'De et À requis (au moins un partenaire)' });
    }
    if (fromId && toId && fromId === toId) {
      return res.status(400).json({ success: false, error: 'De et À doivent être différents' });
    }

    const exchange = new ProductExchange({
      date: new Date(date),
      productName: productName.trim(),
      quantity: Number(quantity),
      detail: (detail || '').trim(),
      fromPartnerId: fromId,
      toPartnerId: toId
    });
    await exchange.save();
    await exchange.populate(['fromPartnerId', 'toPartnerId']);

    const currentSiteName = getCurrentSiteName();
    const partnerToNotify = fromId ? await ExchangePartner.findById(fromId) : await ExchangePartner.findById(toId);
    if (partnerToNotify && partnerToNotify.email) {
      try {
        const fromName = fromId ? (await ExchangePartner.findById(fromId))?.name : currentSiteName;
        const toName = toId ? (await ExchangePartner.findById(toId))?.name : currentSiteName;
        const subject = `[Échange] Nouvelle demande - ${productName} - ${currentSiteName}`;
        const htmlContent = `
          <h2>Nouvelle demande d'échange de produits</h2>
          <p>Bonjour,</p>
          <p>Une nouvelle demande d'échange a été enregistrée :</p>
          <ul>
            <li><strong>Date :</strong> ${new Date(date).toLocaleDateString('fr-FR')}</li>
            <li><strong>Produit :</strong> ${productName}</li>
            <li><strong>Quantité :</strong> ${quantity}</li>
            <li><strong>Détail :</strong> ${detail || '-'}</li>
            <li><strong>De :</strong> ${fromName}</li>
            <li><strong>À :</strong> ${toName}</li>
          </ul>
          <p>Cordialement,<br>${currentSiteName}</p>
        `;
        await emailService.sendEmail(partnerToNotify.email, subject, htmlContent);
        exchange.emailSentOnCreate = true;
        await exchange.save();
      } catch (emailErr) {
        console.error('❌ Erreur envoi email création échange:', emailErr);
      }
    }

    res.status(201).json({ success: true, data: exchange });
  } catch (error) {
    console.error('❌ Erreur création échange:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Mettre à jour un échange (soldé, facturé, payé) et envoyer email
const updateExchange = async (req, res) => {
  try {
    const exchange = await ProductExchange.findById(req.params.id)
      .populate('fromPartnerId', 'name email')
      .populate('toPartnerId', 'name email');
    if (!exchange) return res.status(404).json({ success: false, error: 'Échange non trouvé' });

    const { settledAt, invoicedAt, paidAt, valorisedAt, valorisedAmount } = req.body;
    const currentSiteName = getCurrentSiteName();
    const updates = [];

    // Format date sans slash pour éviter encodage HTML (&#x2F;) dans le sujet email
    const formatDateForEmail = (d) => {
      if (!d) return '';
      const date = new Date(d);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    if (settledAt !== undefined) {
      exchange.settledAt = settledAt ? new Date(settledAt) : null;
      if (exchange.settledAt && !exchange.emailSentOnSettled) {
        exchange.emailSentOnSettled = true;
        updates.push(`Soldé le ${formatDateForEmail(settledAt)}`);
      }
    }
    if (invoicedAt !== undefined) {
      exchange.invoicedAt = invoicedAt ? new Date(invoicedAt) : null;
      if (exchange.invoicedAt && !exchange.emailSentOnInvoiced) {
        exchange.emailSentOnInvoiced = true;
        updates.push(`Facturé le ${formatDateForEmail(invoicedAt)}`);
      }
    }
    if (paidAt !== undefined) {
      exchange.paidAt = paidAt ? new Date(paidAt) : null;
      if (exchange.paidAt && !exchange.emailSentOnPaid) {
        exchange.emailSentOnPaid = true;
        updates.push(`Payé le ${formatDateForEmail(paidAt)}`);
      }
    }
    if (valorisedAt !== undefined || valorisedAmount !== undefined) {
      if (valorisedAt !== undefined) exchange.valorisedAt = valorisedAt ? new Date(valorisedAt) : null;
      if (valorisedAmount !== undefined) exchange.valorisedAmount = valorisedAmount != null && valorisedAmount !== '' ? Number(valorisedAmount) : null;
      if (exchange.valorisedAt && exchange.valorisedAmount != null && !exchange.emailSentOnValorised) {
        exchange.emailSentOnValorised = true;
        updates.push(`Valorisé ${exchange.valorisedAmount}€ le ${formatDateForEmail(exchange.valorisedAt)}`);
      }
    }

    await exchange.save();

    const partnerToNotify = exchange.fromPartnerId || exchange.toPartnerId;
    const partnerEmail = partnerToNotify?.email;
    if (updates.length > 0 && partnerEmail) {
      try {
        const exchangesWithPartner = await getExchangesWithPartner(partnerToNotify._id);
        const tableHtml = buildExchangesTableHtml(exchangesWithPartner, currentSiteName);
        const emailSubject = `[Échange] ${updates.join(' - ')} - ${currentSiteName}`;
        const htmlContent = `
          <h2>Mise à jour d'échange</h2>
          <p>Bonjour ${partnerToNotify.name},</p>
          <p>Un échange a été mis à jour : ${updates.join(', ')}.</p>
          <p>Voici le récapitulatif des échanges passés avec vous :</p>
          ${tableHtml}
          <p>Cordialement,<br>${currentSiteName}</p>
        `;
        await emailService.sendEmail(partnerEmail, emailSubject, htmlContent);
      } catch (emailErr) {
        console.error('❌ Erreur envoi email mise à jour échange:', emailErr);
      }
    }

    const updated = await ProductExchange.findById(req.params.id)
      .populate('fromPartnerId', 'name email')
      .populate('toPartnerId', 'name email');
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('❌ Erreur mise à jour échange:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Supprimer un échange
const deleteExchange = async (req, res) => {
  try {
    const exchange = await ProductExchange.findByIdAndDelete(req.params.id);
    if (!exchange) return res.status(404).json({ success: false, error: 'Échange non trouvé' });
    res.json({ success: true, data: exchange });
  } catch (error) {
    console.error('❌ Erreur suppression échange:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getPartners,
  createPartner,
  updatePartner,
  deletePartner,
  getCurrentSite,
  getExchanges,
  createExchange,
  updateExchange,
  deleteExchange
};
