const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const PartnerCompany = require('../models/PartnerCompany');
const PartnerOrder = require('../models/PartnerOrder');
const PartnerFormulaConfig = require('../models/PartnerFormulaConfig');
const emailService = require('../services/emailService');

const getSite = (req) => (req.query.site || req.body.site || 'longuenesse').toLowerCase();
const siteMap = { lon: 'longuenesse', plan: 'arras' };
const normalizeSite = (s) => siteMap[s] || (s === 'arras' ? 'arras' : 'longuenesse');

function requireInternalSecret(req) {
  const expected = process.env.INTERNAL_API_SECRET;
  const got = req.headers['x-internal-secret'];
  return !!expected && !!got && String(got) === String(expected);
}

async function syncCompanyToVercel({ site, name, phone, email, password }) {
  const base = process.env.PARTNER_ORDER_APP_URL || 'https://commande-longuenesse.vercel.app';
  const secret = process.env.INTERNAL_API_SECRET || process.env.PARTNER_INTERNAL_SECRET;
  if (!secret) {
    console.warn('⚠️ INTERNAL_API_SECRET manquant: sync Vercel ignorée');
    return { skipped: true };
  }
  const url = `${String(base).replace(/\/+$/, '')}/api/internal-upsert-company?site=${encodeURIComponent(site)}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-internal-secret': secret },
    body: JSON.stringify({ site, name, phone, email, password })
  });
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new Error(data?.error || `Sync Vercel échouée (${r.status})`);
  return data;
}

async function syncPasswordToVercel({ site, email, password }) {
  const base = process.env.PARTNER_ORDER_APP_URL || 'https://commande-longuenesse.vercel.app';
  const secret = process.env.INTERNAL_API_SECRET || process.env.PARTNER_INTERNAL_SECRET;
  if (!secret) {
    console.warn('⚠️ INTERNAL_API_SECRET manquant: sync Vercel ignorée');
    return { skipped: true };
  }
  const url = `${String(base).replace(/\/+$/, '')}/api/internal-reset-company-password?site=${encodeURIComponent(site)}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-internal-secret': secret },
    body: JSON.stringify({ site, email, password })
  });
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new Error(data?.error || `Sync Vercel mot de passe échouée (${r.status})`);
  return data;
}

const generateRandomPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 10; i++) password += chars.charAt(Math.floor(Math.random() * chars.length));
  return password;
};

async function ensureDefaultFormulas(site) {
  const existing = await PartnerFormulaConfig.findOne({ site });
  if (existing) return existing;
  return await PartnerFormulaConfig.create({
    site,
    breakfast: {
      eco: { label: 'Petit déjeuner Éco', priceCents: 0, description: '', items: [] },
      classic: { label: 'Petit déjeuner Classique', priceCents: 0, description: '', items: [] },
      premium: { label: 'Petit déjeuner Premium', priceCents: 0, description: '', items: [] }
    },
    lunch: {
      eco: { label: 'Déjeuner Éco', priceCents: 0, description: '', items: [] },
      classic: { label: 'Déjeuner Classique', priceCents: 0, description: '', items: [] },
      premium: { label: 'Déjeuner Premium', priceCents: 0, description: '', items: [] }
    }
  });
}

// --- Auth entreprise ---
const partnerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const site = normalizeSite(getSite(req));
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email et mot de passe requis' });
    }
    const company = await PartnerCompany.findOne({ email: String(email).toLowerCase().trim(), active: true }).select('+password');
    if (!company) return res.status(401).json({ success: false, error: 'Identifiants incorrects' });
    const valid = await bcrypt.compare(password, company.password);
    if (!valid) return res.status(401).json({ success: false, error: 'Identifiants incorrects' });

    company.lastLoginAt = new Date();
    await company.save();

    const token = jwt.sign(
      { role: 'partner_company', companyId: company._id, email: company.email, name: company.name, site },
      process.env.JWT_SECRET || 'votre-cle-secrete-ici',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      company: { id: company._id, name: company.name, email: company.email, phone: company.phone }
    });
  } catch (err) {
    console.error('❌ partnerLogin:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const partnerMe = async (req, res) => {
  try {
    const company = await PartnerCompany.findById(req.partnerCompanyId);
    if (!company) return res.status(404).json({ success: false, error: 'Entreprise non trouvée' });
    res.json({ success: true, data: { id: company._id, name: company.name, email: company.email, phone: company.phone } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- Orders entreprise ---
const listMyOrders = async (req, res) => {
  try {
    const site = normalizeSite(getSite(req));
    const orders = await PartnerOrder.find({ companyId: req.partnerCompanyId, site }).sort({ datetime: -1, createdAt: -1 }).limit(200);
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const createMyOrder = async (req, res) => {
  try {
    const site = normalizeSite(getSite(req));
    const { fulfillment, datetime, mealType, tier } = req.body;
    if (!fulfillment || !datetime || !mealType || !tier) {
      return res.status(400).json({ success: false, error: 'Champs requis: fulfillment, datetime, mealType, tier' });
    }
    const dt = new Date(datetime);
    if (Number.isNaN(dt.getTime())) return res.status(400).json({ success: false, error: 'Date/heure invalide' });

    const formulas = await ensureDefaultFormulas(site);
    const snap = formulas?.[mealType]?.[tier];
    const itemsSnapshot = snap
      ? { label: snap.label, priceCents: snap.priceCents, description: snap.description, items: snap.items || [] }
      : { label: `${mealType}-${tier}`, priceCents: 0, description: '', items: [] };

    const order = await PartnerOrder.create({
      site,
      companyId: req.partnerCompanyId,
      fulfillment,
      datetime: dt,
      mealType,
      tier,
      itemsSnapshot,
      status: 'submitted',
      statusUpdatedAt: new Date()
    });
    res.json({ success: true, data: order });
  } catch (err) {
    console.error('❌ createMyOrder:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- Internal: receive orders pushed from Vercel quick-order app ---
const internalUpsertOrderFromVercel = async (req, res) => {
  try {
    if (!requireInternalSecret(req)) {
      return res.status(401).json({ success: false, error: 'Secret interne requis' });
    }

    const site = normalizeSite(getSite(req));
    const vercelOrderId = req.body?.vercelOrderId ? String(req.body.vercelOrderId) : null;
    const companyEmail = req.body?.companyEmail ? String(req.body.companyEmail).toLowerCase().trim() : null;
    const fulfillment = String(req.body?.fulfillment || '');
    const datetime = String(req.body?.datetime || '');
    const mealType = String(req.body?.mealType || '');
    const tier = String(req.body?.tier || '');
    const itemsSnapshot = req.body?.itemsSnapshot || null;

    if (!vercelOrderId || !companyEmail) {
      return res.status(400).json({ success: false, error: 'Champs requis: vercelOrderId, companyEmail' });
    }
    if (!fulfillment || !datetime || !mealType || !tier || !itemsSnapshot) {
      return res
        .status(400)
        .json({ success: false, error: 'Champs requis: fulfillment, datetime, mealType, tier, itemsSnapshot' });
    }

    const dt = new Date(datetime);
    if (Number.isNaN(dt.getTime())) return res.status(400).json({ success: false, error: 'Date/heure invalide' });

    const company = await PartnerCompany.findOne({ site, email: companyEmail, active: true });
    if (!company) return res.status(404).json({ success: false, error: 'Entreprise non trouvée' });

    const update = {
      $setOnInsert: {
        site,
        companyId: company._id,
        source: 'vercel',
        sourceId: vercelOrderId,
        createdAt: new Date()
      },
      $set: {
        fulfillment,
        datetime: dt,
        mealType,
        tier,
        itemsSnapshot,
        status: 'submitted',
        statusUpdatedAt: new Date()
      }
    };

    const saved = await PartnerOrder.findOneAndUpdate({ source: 'vercel', sourceId: vercelOrderId }, update, {
      new: true,
      upsert: true
    });

    return res.json({ success: true, data: saved });
  } catch (err) {
    console.error('❌ internalUpsertOrderFromVercel:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- Admin ---
const adminCreateCompany = async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    if (!name || !email) return res.status(400).json({ success: false, error: 'Nom et email requis' });

    const password = generateRandomPassword();
    const site = normalizeSite(getSite(req));
    const company = await PartnerCompany.create({
      name: String(name).trim(),
      phone: phone ? String(phone).trim() : '',
      email: String(email).toLowerCase().trim(),
      password,
      active: true,
      site
    });

    // Sync vers Vercel (pour login entreprise instantané)
    try {
      await syncCompanyToVercel({ site, name: company.name, phone: company.phone, email: company.email, password });
    } catch (e) {
      console.error('⚠️ Sync Vercel (create company) échouée:', e.message);
    }

    res.json({ success: true, data: { id: company._id, name: company.name, email: company.email, phone: company.phone }, password });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, error: 'Cet email existe déjà' });
    res.status(500).json({ success: false, error: err.message });
  }
};

const adminSendInvite = async (req, res) => {
  try {
    const { id } = req.params;
    const site = normalizeSite(getSite(req));
    const company = await PartnerCompany.findById(id).select('+password');
    if (!company) return res.status(404).json({ success: false, error: 'Entreprise non trouvée' });

    const newPassword = generateRandomPassword();
    company.password = newPassword;
    await company.save();

    // Sync mot de passe vers Vercel (pour login entreprise instantané)
    try {
      await syncPasswordToVercel({ site, email: company.email, password: newPassword });
    } catch (e) {
      console.error('⚠️ Sync Vercel (reset password) échouée:', e.message);
    }

    const orderAppUrl = process.env.PARTNER_ORDER_APP_URL || 'https://commande-longuenesse.vercel.app';
    const subject = `Accès Commande en ligne - ${company.name}`;
    const html = `
      <p>Bonjour,</p>
      <p>Votre accès à la page de commande en ligne est prêt.</p>
      <p><b>Identifiant :</b> ${company.email}<br/>
      <b>Mot de passe :</b> ${newPassword}</p>
      <p><b>Lien :</b> <a href="${orderAppUrl}">${orderAppUrl}</a></p>
      <p>Vous pourrez voir vos commandes et en créer une nouvelle (petit déjeuner / déjeuner, livraison / retrait).</p>
      <p>— Boulangerie Longuenesse</p>
    `;
    const text = `Identifiant: ${company.email}\nMot de passe: ${newPassword}\nLien: ${orderAppUrl}\n`;

    const r = await emailService.sendEmail(company.email, subject, html, text);
    if (!r?.success) {
      return res.status(500).json({ success: false, error: r?.error || 'Email non envoyé' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('❌ adminSendInvite:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const adminListCompanies = async (req, res) => {
  try {
    const q = {};
    if (req.query.active === 'true') q.active = true;
    if (req.query.active === 'false') q.active = false;
    const companies = await PartnerCompany.find(q).sort({ active: -1, name: 1 }).limit(500);
    res.json({
      success: true,
      data: companies.map((c) => ({
        id: c._id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        active: c.active,
        lastLoginAt: c.lastLoginAt
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const adminListOrders = async (req, res) => {
  try {
    const site = normalizeSite(getSite(req));
    const status = req.query.status;
    const q = { site };
    if (status) q.status = status;
    const orders = await PartnerOrder.find(q).sort({ statusUpdatedAt: -1, datetime: -1 }).limit(500);
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const adminUpdateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, error: 'Statut requis' });
    const allowed = new Set(['submitted', 'acknowledged', 'invoiced', 'paid', 'cancelled']);
    if (!allowed.has(status)) return res.status(400).json({ success: false, error: 'Statut invalide' });
    const order = await PartnerOrder.findByIdAndUpdate(
      id,
      { status, statusUpdatedAt: new Date() },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, error: 'Commande non trouvée' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const adminGetFormulas = async (req, res) => {
  try {
    const site = normalizeSite(getSite(req));
    const cfg = await ensureDefaultFormulas(site);
    res.json({ success: true, data: cfg });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const adminUpdateFormulas = async (req, res) => {
  try {
    const site = normalizeSite(getSite(req));
    await ensureDefaultFormulas(site);
    const updated = await PartnerFormulaConfig.findOneAndUpdate({ site }, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- Employees/admin (internal dashboard) ---
const internalPendingCount = async (req, res) => {
  try {
    const site = normalizeSite(getSite(req));
    const count = await PartnerOrder.countDocuments({ site, status: 'submitted' });
    res.json({ success: true, data: { count } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const internalListOrders = async (req, res) => {
  try {
    const site = normalizeSite(getSite(req));
    const status = req.query.status;
    const q = { site };
    if (status) q.status = status;
    const orders = await PartnerOrder.find(q).sort({ statusUpdatedAt: -1, datetime: -1 }).limit(500);
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  partnerLogin,
  partnerMe,
  listMyOrders,
  createMyOrder,
  internalUpsertOrderFromVercel,
  adminCreateCompany,
  adminSendInvite,
  adminListCompanies,
  adminListOrders,
  adminUpdateOrderStatus,
  adminGetFormulas,
  adminUpdateFormulas,
  internalPendingCount,
  internalListOrders
};

