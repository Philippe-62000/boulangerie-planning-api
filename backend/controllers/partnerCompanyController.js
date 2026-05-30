const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const PartnerCompany = require('../models/PartnerCompany');
const PartnerOrder = require('../models/PartnerOrder');
const PartnerFormulaConfig = require('../models/PartnerFormulaConfig');
const emailService = require('../services/emailService');
const partnerOrderAppSync = require('../services/partnerOrderAppSync');
const { getJwtSecret } = require('../utils/jwtSecret');
const {
  clampMiniCountPerFormula,
  validateBreakfastMiniViennoiserie
} = require('../utils/partnerMiniViennoiserie');
const {
  normalizeMealTypesMode,
  allowedMealTypesFromMode
} = require('../utils/partnerMealTypesMode');

const getSite = (req) => (req.query.site || req.body.site || 'longuenesse').toLowerCase();
const siteMap = { lon: 'longuenesse', plan: 'arras' };
const normalizeSite = (s) => siteMap[s] || (s === 'arras' ? 'arras' : 'longuenesse');

const generateRandomPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 10; i++) password += chars.charAt(Math.floor(Math.random() * chars.length));
  return password;
};

async function attachCompanyInfoToOrders(orders) {
  const list = Array.isArray(orders) ? orders : [];
  if (list.length === 0) return [];
  const ids = [
    ...new Set(
      list
        .map((o) => (o?.companyId ? String(o.companyId) : ''))
        .filter(Boolean)
    )
  ];
  const companies = ids.length
    ? await PartnerCompany.find({ _id: { $in: ids } }).select('name contactName email phone').lean()
    : [];
  const byId = new Map(companies.map((c) => [String(c._id), c]));
  return list.map((o) => {
    const plain = o?.toObject ? o.toObject() : { ...o };
    const company = byId.get(String(plain.companyId));
    if (!plain.companyName && company?.name) plain.companyName = company.name;
    if (!plain.contactName && company?.contactName) plain.contactName = company.contactName;
    if (!plain.companyEmail && company?.email) plain.companyEmail = company.email;
    if (!plain.companyPhone && company?.phone) plain.companyPhone = company.phone;
    return plain;
  });
}

async function ensureDefaultFormulas(site) {
  const existing = await PartnerFormulaConfig.findOne({ site });
  if (existing) return existing;
  return await PartnerFormulaConfig.create({
    site,
    breakfast: {
      eco: {
        label: 'Petit déjeuner Éco',
        priceCents: 0,
        description: '',
        items: [],
        miniViennoiserieCountPerFormula: 1
      },
      classic: {
        label: 'Petit déjeuner Classique',
        priceCents: 0,
        description: '',
        items: [],
        miniViennoiserieCountPerFormula: 1
      },
      premium: {
        label: 'Petit déjeuner Premium',
        priceCents: 0,
        description: '',
        items: [],
        miniViennoiserieCountPerFormula: 1
      }
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
    const emailNorm = String(email).toLowerCase().trim();
    const company = await PartnerCompany.findOne({ email: emailNorm }).select('+password');
    if (!company) return res.status(401).json({ success: false, error: 'Identifiants incorrects' });
    if (company.site && normalizeSite(String(company.site)) !== site) {
      return res.status(401).json({ success: false, error: 'Identifiants incorrects' });
    }
    if (!company.active) {
      return res.status(403).json({
        success: false,
        error:
          'Ce compte entreprise est désactivé. Si vous venez de le recréer, attendez la synchro ou utilisez le même mot de passe que sur la fiche admin ; sinon contactez la boulangerie.'
      });
    }
    const valid = await bcrypt.compare(password, company.password);
    if (!valid) return res.status(401).json({ success: false, error: 'Identifiants incorrects' });

    company.lastLoginAt = new Date();
    await company.save();

    const contactName = String(company.contactName || '').trim();
    const mealTypesMode = normalizeMealTypesMode(company.mealTypesMode);
    const token = jwt.sign(
      {
        role: 'partner_company',
        companyId: company._id,
        email: company.email,
        name: company.name,
        contactName,
        mealTypesMode,
        site
      },
      getJwtSecret(),
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      company: {
        id: company._id,
        name: company.name,
        contactName,
        mealTypesMode,
        email: company.email,
        phone: company.phone
      }
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
    res.json({
      success: true,
      data: {
        id: company._id,
        name: company.name,
        contactName: company.contactName || '',
        mealTypesMode: normalizeMealTypesMode(company.mealTypesMode),
        email: company.email,
        phone: company.phone
      }
    });
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

const partnerGetFormulas = async (req, res) => {
  try {
    const site = normalizeSite(getSite(req));
    const cfg = await ensureDefaultFormulas(site);
    res.json({ success: true, data: cfg });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const createMyOrder = async (req, res) => {
  try {
    const site = normalizeSite(getSite(req));
    const { fulfillment, datetime, mealType, tier, miniViennoiserieDetail } = req.body;
    if (!fulfillment || !datetime || !mealType || !tier) {
      return res.status(400).json({ success: false, error: 'Champs requis: fulfillment, datetime, mealType, tier' });
    }
    const dt = new Date(datetime);
    if (Number.isNaN(dt.getTime())) return res.status(400).json({ success: false, error: 'Date/heure invalide' });

    const quantity = Math.max(1, Math.floor(Number(req.body?.quantity) || 1));
    const company = await PartnerCompany.findById(req.partnerCompanyId).select('name contactName mealTypesMode');
    const companyName = String(company?.name || req.partnerCompanyName || '').trim();
    const contactName = String(
      req.body?.contactName || company?.contactName || req.partnerCompanyContactName || ''
    ).trim();
    if (!contactName) {
      return res.status(400).json({
        success: false,
        error:
          'Contact non renseigné sur votre compte. Demandez à la boulangerie de l’ajouter dans Filmara (onglet Entreprises).'
      });
    }
    const mealMode = normalizeMealTypesMode(
      company?.mealTypesMode || req.partnerCompanyMealTypesMode
    );
    const allowedMeals = allowedMealTypesFromMode(mealMode);
    if (!allowedMeals.includes(mealType)) {
      return res.status(400).json({
        success: false,
        error: 'Type de formule non autorisé pour votre entreprise.'
      });
    }

    const formulas = await ensureDefaultFormulas(site);
    const snap = formulas?.[mealType]?.[tier];
    const perFormula =
      mealType === 'breakfast' && snap
        ? clampMiniCountPerFormula(snap.miniViennoiserieCountPerFormula)
        : 0;

    let miniTotal = 0;
    let miniDetail = [];

    if (mealType === 'breakfast' && snap) {
      const check = validateBreakfastMiniViennoiserie({
        tierSnap: snap,
        quantity,
        miniViennoiserieDetail
      });
      if (!check.ok) {
        return res.status(400).json({ success: false, error: check.error });
      }
      miniTotal = check.totalRequired || 0;
      miniDetail = check.normalized || [];
    }

    const itemsSnapshot = snap
      ? {
          label: snap.label,
          priceCents: snap.priceCents,
          description: snap.description,
          items: snap.items || [],
          miniViennoiserieCountPerFormula: perFormula,
          miniViennoiserieOptions: snap.miniViennoiserieOptions || []
        }
      : {
          label: `${mealType}-${tier}`,
          priceCents: 0,
          description: '',
          items: [],
          miniViennoiserieCountPerFormula: 1,
          miniViennoiserieOptions: []
        };

    const order = await PartnerOrder.create({
      site,
      companyId: req.partnerCompanyId,
      companyName,
      contactName,
      fulfillment,
      datetime: dt,
      mealType,
      tier,
      quantity,
      miniViennoiserieTotal: miniTotal,
      miniViennoiserieDetail: miniDetail,
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

// --- Admin ---
const adminCreateCompany = async (req, res) => {
  try {
    const { name, phone, email, contactName, mealTypesMode: mealTypesModeRaw } = req.body;
    if (!name || !email) return res.status(400).json({ success: false, error: 'Nom et email requis' });
    const contactTrim = String(contactName || '').trim();
    if (!contactTrim) return res.status(400).json({ success: false, error: 'Nom du contact requis' });
    const mealTypesMode = normalizeMealTypesMode(mealTypesModeRaw);

    const site = normalizeSite(getSite(req));
    const emailNorm = String(email).toLowerCase().trim();
    const password = generateRandomPassword();

    const existing = await PartnerCompany.findOne({ email: emailNorm });
    if (existing) {
      if (existing.active) {
        return res.status(400).json({ success: false, error: 'Cet email existe déjà' });
      }
      existing.name = String(name).trim();
      existing.contactName = contactTrim;
      existing.mealTypesMode = mealTypesMode;
      existing.phone = phone ? String(phone).trim() : '';
      existing.site = site;
      existing.password = password;
      existing.active = true;
      await existing.save();
      setImmediate(() =>
        partnerOrderAppSync.syncUpsert({
          site,
          name: existing.name,
          phone: existing.phone || '',
          email: existing.email,
          contactName: existing.contactName || '',
          mealTypesMode: existing.mealTypesMode,
          active: true,
          plainPassword: password
        })
      );
      return res.json({
        success: true,
        data: {
          id: existing._id,
          name: existing.name,
          contactName: existing.contactName || '',
          mealTypesMode: normalizeMealTypesMode(existing.mealTypesMode),
          email: existing.email,
          phone: existing.phone
        },
        password,
        reactivated: true
      });
    }

    const company = await PartnerCompany.create({
      name: String(name).trim(),
      contactName: contactTrim,
      mealTypesMode,
      phone: phone ? String(phone).trim() : '',
      email: emailNorm,
      site,
      password,
      active: true
    });

    setImmediate(() =>
      partnerOrderAppSync.syncUpsert({
        site,
        name: company.name,
        phone: company.phone || '',
        email: company.email,
        contactName: company.contactName || '',
        mealTypesMode: company.mealTypesMode,
        active: true,
        plainPassword: password
      })
    );

    res.json({
      success: true,
      data: {
        id: company._id,
        name: company.name,
        contactName: company.contactName || '',
        mealTypesMode: normalizeMealTypesMode(company.mealTypesMode),
        email: company.email,
        phone: company.phone
      },
      password
    });
  } catch (err) {
    if (err.code === 11000) {
      const dup = await PartnerCompany.findOne({ email: emailNorm });
      if (dup && !dup.active) {
        dup.name = String(name).trim();
        dup.contactName = contactTrim;
        dup.mealTypesMode = mealTypesMode;
        dup.phone = phone ? String(phone).trim() : '';
        dup.site = site;
        dup.password = password;
        dup.active = true;
        await dup.save();
        setImmediate(() =>
          partnerOrderAppSync.syncUpsert({
            site,
            name: dup.name,
            phone: dup.phone || '',
            email: dup.email,
            contactName: dup.contactName || '',
            mealTypesMode: dup.mealTypesMode,
            active: true,
            plainPassword: password
          })
        );
        return res.json({
          success: true,
          data: {
            id: dup._id,
            name: dup.name,
            contactName: dup.contactName || '',
            mealTypesMode: normalizeMealTypesMode(dup.mealTypesMode),
            email: dup.email,
            phone: dup.phone
          },
          password,
          reactivated: true
        });
      }
      return res.status(400).json({ success: false, error: 'Cet email existe déjà' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
};

/** Logique partagée : efface la fiche PartnerCompany pour cet e-mail (libère l’index unique). */
const purgePartnerCompanyByEmailNorm = async (emailNorm, res) => {
  try {
    if (!emailNorm) {
      return res.status(400).json({ success: false, error: 'E-mail requis.' });
    }
    const deleted = await PartnerCompany.findOneAndDelete({ email: emailNorm });
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: `Aucune entreprise en base pour l’e-mail ${emailNorm}.`
      });
    }
    setImmediate(() => partnerOrderAppSync.syncDelete({ email: deleted.email }));
    return res.json({
      success: true,
      permanent: true,
      email: deleted.email
    });
  } catch (err) {
    console.error('❌ purgePartnerCompanyByEmailNorm:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * DELETE /companies?email=…&permanent=true (compat.)
 * Certains hébergeurs / proxies ne routent pas DELETE sur la « collection » → préférer POST /companies/purge.
 */
const adminPurgePartnerCompanyByEmail = async (req, res) => {
  const emailRaw = req.query.email;
  const permanent =
    req.query.permanent === '1' ||
    req.query.permanent === 'true' ||
    req.query.hard === '1' ||
    req.query.hard === 'true';

  if (!emailRaw || !permanent) {
    return res.status(400).json({
      success: false,
      error: 'Utilisez permanent=true et le paramètre email pour effacer définitivement une entreprise.'
    });
  }

  const emailNorm = String(emailRaw).toLowerCase().trim();
  return purgePartnerCompanyByEmailNorm(emailNorm, res);
};

/** POST /companies/purge { email } — route recommandée (évite 404 sur DELETE /companies). */
const adminPurgePartnerCompanyByEmailPost = async (req, res) => {
  const emailNorm = String(req.body?.email || '').toLowerCase().trim();
  return purgePartnerCompanyByEmailNorm(emailNorm, res);
};

const adminDeleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const permanent =
      req.query.permanent === '1' ||
      req.query.permanent === 'true' ||
      req.query.hard === '1' ||
      req.query.hard === 'true';

    if (permanent) {
      const deleted = await PartnerCompany.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Entreprise non trouvée (suppression définitive)' });
      }
      setImmediate(() => partnerOrderAppSync.syncDelete({ email: deleted.email }));
      return res.json({ success: true, permanent: true });
    }

    const company = await PartnerCompany.findById(id);
    if (!company) return res.status(404).json({ success: false, error: 'Entreprise non trouvée' });

    const site = normalizeSite(getSite(req));
    company.active = false;
    await company.save();
    setImmediate(() => partnerOrderAppSync.syncDeactivate({ site, email: company.email }));
    return res.json({ success: true });
  } catch (err) {
    console.error('❌ adminDeleteCompany:', err);
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
    company.site = site;
    company.password = newPassword;
    await company.save();

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
    setImmediate(() =>
      partnerOrderAppSync.syncUpsert({
        site,
        name: company.name,
        phone: company.phone || '',
        email: company.email,
        contactName: company.contactName || '',
        mealTypesMode: normalizeMealTypesMode(company.mealTypesMode),
        active: true,
        plainPassword: newPassword
      })
    );
    res.json({ success: true });
  } catch (err) {
    console.error('❌ adminSendInvite:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const adminUpdateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const site = normalizeSite(getSite(req));
    const company = await PartnerCompany.findById(id);
    if (!company) return res.status(404).json({ success: false, error: 'Entreprise non trouvée' });

    const { contactName, name, phone, mealTypesMode: mealTypesModeRaw } = req.body || {};
    if (contactName !== undefined) company.contactName = String(contactName).trim();
    if (mealTypesModeRaw !== undefined) company.mealTypesMode = normalizeMealTypesMode(mealTypesModeRaw);
    if (name !== undefined && String(name).trim()) company.name = String(name).trim();
    if (phone !== undefined) company.phone = String(phone).trim();
    company.site = site;
    await company.save();

    setImmediate(() =>
      partnerOrderAppSync.syncUpsert({
        site,
        name: company.name,
        phone: company.phone || '',
        email: company.email,
        contactName: company.contactName || '',
        mealTypesMode: normalizeMealTypesMode(company.mealTypesMode),
        active: company.active
      })
    );

    res.json({
      success: true,
      data: {
        id: company._id,
        name: company.name,
        contactName: company.contactName || '',
        mealTypesMode: normalizeMealTypesMode(company.mealTypesMode),
        email: company.email,
        phone: company.phone,
        site: company.site || 'longuenesse',
        active: company.active,
        lastLoginAt: company.lastLoginAt
      }
    });
  } catch (err) {
    console.error('❌ adminUpdateCompany:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const adminListCompanies = async (req, res) => {
  try {
    const q = {};
    // Par défaut: masquer les entreprises désactivées ("Supprimer")
    // Pour tout voir: ?active=all
    // Pour filtrer explicitement: ?active=true|false
    if (req.query.active === 'true') q.active = true;
    else if (req.query.active === 'false') q.active = false;
    else if (req.query.active === 'all') {
      // pas de filtre active
    } else {
      q.active = true;
    }
    const companies = await PartnerCompany.find(q).sort({ active: -1, name: 1 }).limit(500);
    res.json({
      success: true,
      data: companies.map((c) => ({
        id: c._id,
        name: c.name,
        contactName: c.contactName || '',
        mealTypesMode: normalizeMealTypesMode(c.mealTypesMode),
        email: c.email,
        phone: c.phone,
        site: c.site || 'longuenesse',
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
    res.json({ success: true, data: await attachCompanyInfoToOrders(orders) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const deletePartnerOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const q = { _id: id };
    if (req.partnerCompanyId) {
      q.companyId = req.partnerCompanyId;
    }
    const order = await PartnerOrder.findOneAndDelete(q);
    if (!order) return res.status(404).json({ success: false, error: 'Commande non trouvée' });
    setImmediate(() =>
      partnerOrderAppSync.syncOrderDelete({ orderId: order._id, site: order.site || 'longuenesse' })
    );
    res.json({ success: true, deletedId: String(order._id) });
  } catch (err) {
    console.error('❌ deletePartnerOrderById:', err);
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
    res.json({ success: true, data: await attachCompanyInfoToOrders(orders) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  partnerLogin,
  partnerMe,
  partnerGetFormulas,
  listMyOrders,
  createMyOrder,
  deletePartnerOrderById,
  adminCreateCompany,
  adminUpdateCompany,
  adminPurgePartnerCompanyByEmail,
  adminPurgePartnerCompanyByEmailPost,
  adminDeleteCompany,
  adminSendInvite,
  adminListCompanies,
  adminListOrders,
  adminUpdateOrderStatus,
  adminGetFormulas,
  adminUpdateFormulas,
  internalPendingCount,
  internalListOrders
};

