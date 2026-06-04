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
  parseOffersInput,
  resolveCompanyOffers,
  allowedMealTypesFromOffers,
  mealTypesModeFromOffers,
  serializeCompanyOffers
} = require('../utils/partnerCompanyOffers');
const {
  initialStatusHistory,
  appendStatusChange,
  buildStatusHistoryTimeline
} = require('../utils/partnerOrderStatusHistory');

const getSite = (req) => (req.query.site || req.body.site || 'longuenesse').toLowerCase();
const siteMap = { lon: 'longuenesse', plan: 'arras' };
const normalizeSite = (s) => siteMap[s] || (s === 'arras' ? 'arras' : 'longuenesse');

const generateRandomPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 10; i++) password += chars.charAt(Math.floor(Math.random() * chars.length));
  return password;
};

function companyPayloadForClient(company) {
  const offers = resolveCompanyOffers(company);
  return {
    id: company._id,
    name: company.name,
    contactName: company.contactName || '',
    email: company.email,
    phone: company.phone || '',
    isAnonymous: !!company.isAnonymous,
    firstName: company.firstName || '',
    lastName: company.lastName || '',
    structureName: company.structureName || '',
    createdViaDashboardForm: !!company.createdViaDashboardForm,
    mealTypesMode: mealTypesModeFromOffers(offers),
    ...offers
  };
}

function jwtPayloadForCompany(company, site) {
  const offers = resolveCompanyOffers(company);
  return {
    role: 'partner_company',
    companyId: company._id,
    email: company.email,
    name: company.name,
    contactName: String(company.contactName || '').trim(),
    isAnonymous: !!company.isAnonymous,
    mealTypesMode: mealTypesModeFromOffers(offers),
    ...offers,
    site
  };
}

function applyOffersToCompany(company, body) {
  const offers = parseOffersInput(body);
  company.offerBreakfast = offers.offerBreakfast;
  company.offerLunch = offers.offerLunch;
  company.offerDevis = offers.offerDevis;
  company.offerCommande = offers.offerCommande;
  company.mealTypesMode = mealTypesModeFromOffers(offers);
}

function buildSimpleOrderSnapshot({ orderKind, requestDetail, fulfillment, companyName, contactName, prospect }) {
  const kindLabel = orderKind === 'devis' ? 'Demande de devis' : 'Commande libre';
  const lines = [];
  if (companyName) lines.push(`Entreprise : ${companyName}`);
  if (contactName) lines.push(`Contact : ${contactName}`);
  if (prospect?.firstName || prospect?.lastName) {
    lines.push(`Nom : ${[prospect.firstName, prospect.lastName].filter(Boolean).join(' ')}`);
  }
  if (prospect?.structureName) lines.push(`Structure : ${prospect.structureName}`);
  if (prospect?.phone) lines.push(`Téléphone : ${prospect.phone}`);
  if (prospect?.email) lines.push(`E-mail : ${prospect.email}`);
  lines.push(`Mode : ${fulfillment === 'delivery' ? 'Livraison' : 'Retrait magasin'}`);
  if (requestDetail) lines.push(`Détail : ${requestDetail}`);
  return {
    label: kindLabel,
    priceCents: 0,
    description: requestDetail || '',
    items: lines,
    quantity: 1,
    remarks: requestDetail || '',
    orderKind
  };
}

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
    plain.placedAt = plain.createdAt || null;
    plain.statusHistoryTimeline = buildStatusHistoryTimeline(plain);
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

    const siteNorm = normalizeSite(String(company.site || site));
    const token = jwt.sign(jwtPayloadForCompany(company, siteNorm), getJwtSecret(), { expiresIn: '30d' });

    res.json({
      success: true,
      token,
      company: companyPayloadForClient(company)
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
      data: companyPayloadForClient(company)
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
    const orderKind = String(req.body?.orderKind || 'formula').toLowerCase();
    const { fulfillment, datetime } = req.body;
    if (!fulfillment || !datetime) {
      return res.status(400).json({ success: false, error: 'Champs requis: fulfillment, datetime' });
    }
    const dt = new Date(datetime);
    if (Number.isNaN(dt.getTime())) return res.status(400).json({ success: false, error: 'Date/heure invalide' });

    const company = await PartnerCompany.findById(req.partnerCompanyId).select(
      'name contactName mealTypesMode offerBreakfast offerLunch offerDevis offerCommande isAnonymous'
    );
    const offers = resolveCompanyOffers(company || { mealTypesMode: req.partnerCompanyMealTypesMode });
    const companyName = String(company?.name || req.partnerCompanyName || '').trim();

    if (orderKind === 'devis' || orderKind === 'commande') {
      if (orderKind === 'devis' && !offers.offerDevis) {
        return res.status(400).json({ success: false, error: 'Demande de devis non autorisée pour votre compte.' });
      }
      if (orderKind === 'commande' && !offers.offerCommande) {
        return res.status(400).json({ success: false, error: 'Commande libre non autorisée pour votre compte.' });
      }
      const requestDetail = String(req.body?.requestDetail || req.body?.remarks || '').trim();
      if (!requestDetail) {
        return res.status(400).json({ success: false, error: 'Détail de la demande requis.' });
      }
      const prospect = {
        firstName: String(req.body?.prospectFirstName || req.body?.firstName || '').trim(),
        lastName: String(req.body?.prospectLastName || req.body?.lastName || '').trim(),
        structureName: String(req.body?.prospectStructureName || req.body?.structureName || '').trim(),
        phone: String(req.body?.prospectPhone || req.body?.phone || '').trim(),
        email: String(req.body?.prospectEmail || req.body?.email || '').trim()
      };
      let contactName = String(
        req.body?.contactName || company?.contactName || req.partnerCompanyContactName || ''
      ).trim();
      if (company?.isAnonymous) {
        if (!prospect.firstName || !prospect.lastName || !prospect.phone || !prospect.email) {
          return res.status(400).json({
            success: false,
            error: 'Nom, prénom, téléphone et e-mail requis pour cette demande.'
          });
        }
        contactName = `${prospect.firstName} ${prospect.lastName}`.trim();
      } else if (!contactName) {
        return res.status(400).json({
          success: false,
          error:
            'Contact non renseigné sur votre compte. Demandez à la boulangerie de l’ajouter dans Filmara (onglet Entreprises).'
        });
      }
      const itemsSnapshot = buildSimpleOrderSnapshot({
        orderKind,
        requestDetail,
        fulfillment,
        companyName,
        contactName,
        prospect: company?.isAnonymous ? prospect : null
      });
      const order = await PartnerOrder.create({
        site,
        companyId: req.partnerCompanyId,
        companyName,
        contactName,
        fulfillment,
        datetime: dt,
        orderKind,
        requestDetail,
        prospectFirstName: prospect.firstName,
        prospectLastName: prospect.lastName,
        prospectStructureName: prospect.structureName,
        prospectPhone: prospect.phone,
        prospectEmail: prospect.email,
        mealType: null,
        tier: null,
        quantity: 1,
        miniViennoiserieTotal: 0,
        miniViennoiserieDetail: [],
        itemsSnapshot,
        status: 'submitted',
        statusUpdatedAt: new Date(),
        statusHistory: initialStatusHistory('submitted')
      });
      return res.json({ success: true, data: order });
    }

    const { mealType, tier, miniViennoiserieDetail } = req.body;
    if (!mealType || !tier) {
      return res.status(400).json({ success: false, error: 'Champs requis: mealType, tier' });
    }
    const allowedMeals = allowedMealTypesFromOffers(offers);
    if (!allowedMeals.includes(mealType)) {
      return res.status(400).json({
        success: false,
        error: 'Type de formule non autorisé pour votre entreprise.'
      });
    }

    const quantity = Math.max(1, Math.floor(Number(req.body?.quantity) || 1));
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
      orderKind: 'formula',
      mealType,
      tier,
      quantity,
      miniViennoiserieTotal: miniTotal,
      miniViennoiserieDetail: miniDetail,
      itemsSnapshot,
      status: 'submitted',
      statusUpdatedAt: new Date(),
      statusHistory: initialStatusHistory('submitted')
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
    const {
      name,
      phone,
      email,
      contactName,
      mealTypesMode: mealTypesModeRaw,
      isAnonymous,
      firstName,
      lastName,
      structureName
    } = req.body;
    const anonymous = !!isAnonymous;
    if (!email) return res.status(400).json({ success: false, error: 'Email requis' });
    const contactTrim = String(contactName || '').trim();
    if (!anonymous && !contactTrim) {
      return res.status(400).json({ success: false, error: 'Nom du contact requis' });
    }
    const nameTrim = String(name || '').trim() || (anonymous ? 'Client prospect' : '');
    if (!nameTrim) return res.status(400).json({ success: false, error: 'Nom entreprise requis' });

    const offers = parseOffersInput({ ...req.body, mealTypesMode: mealTypesModeRaw });
    const mealTypesMode = mealTypesModeFromOffers(offers);

    const site = normalizeSite(getSite(req));
    const emailNorm = String(email).toLowerCase().trim();
    const password = generateRandomPassword();

    const existing = await PartnerCompany.findOne({ email: emailNorm });
    if (existing) {
      if (existing.active) {
        return res.status(400).json({ success: false, error: 'Cet email existe déjà' });
      }
      existing.name = nameTrim;
      existing.contactName = contactTrim;
      applyOffersToCompany(existing, { ...req.body, mealTypesMode: mealTypesModeRaw });
      existing.isAnonymous = anonymous;
      existing.firstName = String(firstName || '').trim();
      existing.lastName = String(lastName || '').trim();
      existing.structureName = String(structureName || '').trim();
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
          ...resolveCompanyOffers(existing),
          isAnonymous: existing.isAnonymous,
          active: true,
          plainPassword: password
        })
      );
      return res.json({
        success: true,
        data: companyPayloadForClient(existing),
        password,
        reactivated: true
      });
    }

    const company = await PartnerCompany.create({
      name: nameTrim,
      contactName: contactTrim,
      mealTypesMode,
      offerBreakfast: offers.offerBreakfast,
      offerLunch: offers.offerLunch,
      offerDevis: offers.offerDevis,
      offerCommande: offers.offerCommande,
      isAnonymous: anonymous,
      firstName: String(firstName || '').trim(),
      lastName: String(lastName || '').trim(),
      structureName: String(structureName || '').trim(),
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
        ...resolveCompanyOffers(company),
        isAnonymous: company.isAnonymous,
        active: true,
        plainPassword: password
      })
    );

    res.json({
      success: true,
      data: companyPayloadForClient(company),
      password
    });
  } catch (err) {
    if (err.code === 11000) {
      const emailNorm = String(req.body?.email || '').toLowerCase().trim();
      const dup = await PartnerCompany.findOne({ email: emailNorm });
      if (dup && !dup.active) {
        const contactTrim = String(req.body?.contactName || '').trim();
        const anonymous = !!req.body?.isAnonymous;
        if (!anonymous && !contactTrim) {
          return res.status(400).json({ success: false, error: 'Nom du contact requis' });
        }
        const offers = parseOffersInput(req.body);
        const password = generateRandomPassword();
        dup.name = String(req.body?.name || '').trim() || 'Client prospect';
        dup.contactName = contactTrim;
        applyOffersToCompany(dup, req.body);
        dup.isAnonymous = anonymous;
        dup.firstName = String(req.body?.firstName || '').trim();
        dup.lastName = String(req.body?.lastName || '').trim();
        dup.structureName = String(req.body?.structureName || '').trim();
        dup.phone = req.body?.phone ? String(req.body.phone).trim() : '';
        dup.site = normalizeSite(getSite(req));
        dup.password = password;
        dup.active = true;
        await dup.save();
        setImmediate(() =>
          partnerOrderAppSync.syncUpsert({
            site: dup.site,
            name: dup.name,
            phone: dup.phone || '',
            email: dup.email,
            contactName: dup.contactName || '',
            mealTypesMode: dup.mealTypesMode,
            ...resolveCompanyOffers(dup),
            isAnonymous: dup.isAnonymous,
            active: true,
            plainPassword: password
          })
        );
        return res.json({
          success: true,
          data: companyPayloadForClient(dup),
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

async function sendPartnerCompanyInviteEmail(company, plainPassword, site) {
  const orderAppUrl = process.env.PARTNER_ORDER_APP_URL || 'https://commande-longuenesse.vercel.app';
  const subject = `Accès commande entreprises - ${company.name}`;
  const html = `
      <p>Bonjour,</p>
      <p>Votre accès à la page de commande en ligne est prêt.</p>
      <p><b>Identifiant (login) :</b> ${company.email}<br/>
      <b>Mot de passe :</b> ${plainPassword}</p>
      <p><b>Lien de connexion :</b> <a href="${orderAppUrl}">${orderAppUrl}</a></p>
      <p>Vous pourrez consulter vos commandes et en créer de nouvelles selon les options activées pour votre compte.</p>
      <p>— Boulangerie Longuenesse</p>
    `;
  const text = `Identifiant (login): ${company.email}\nMot de passe: ${plainPassword}\nLien: ${orderAppUrl}\n`;
  return emailService.sendEmail(company.email, subject, html, text);
}

const adminSendInvite = async (req, res) => {
  try {
    const { id } = req.params;
    const site = normalizeSite(getSite(req));
    const company = await PartnerCompany.findById(id).select('+password');
    if (!company) return res.status(404).json({ success: false, error: 'Entreprise non trouvée' });

    const newPassword = generateRandomPassword();
    company.site = site;
    company.password = newPassword;
    company.active = true;
    await company.save();

    const r = await sendPartnerCompanyInviteEmail(company, newPassword, site);
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
        mealTypesMode: company.mealTypesMode,
        ...resolveCompanyOffers(company),
        isAnonymous: company.isAnonymous,
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

/** Crée ou réactive un compte entreprise par e-mail et envoie identifiants (dashboard admin / salarié). */
const staffQuickInviteByEmail = async (req, res) => {
  try {
    const site = normalizeSite(getSite(req));
    const emailNorm = String(req.body?.email || '')
      .toLowerCase()
      .trim();
    if (!emailNorm) {
      return res.status(400).json({ success: false, error: 'Adresse e-mail requise' });
    }

    const newPassword = generateRandomPassword();
    let company = await PartnerCompany.findOne({ email: emailNorm }).select('+password');
    let wasCreated = false;

    if (company) {
      if (!company.active) {
        company.active = true;
      }
      company.site = site;
      company.password = newPassword;
      if (!String(company.contactName || '').trim()) {
        const local = emailNorm.split('@')[0] || 'Client';
        company.contactName = local.charAt(0).toUpperCase() + local.slice(1);
      }
      await company.save();
    } else {
      const local = emailNorm.split('@')[0] || 'client';
      const displayName = local.charAt(0).toUpperCase() + local.slice(1);
      company = await PartnerCompany.create({
        name: displayName,
        contactName: displayName,
        email: emailNorm,
        phone: '',
        site,
        password: newPassword,
        active: true,
        offerBreakfast: false,
        offerLunch: false,
        offerDevis: true,
        offerCommande: true,
        mealTypesMode: 'none',
        createdViaDashboardForm: true
      });
      wasCreated = true;
    }

    const mailResult = await sendPartnerCompanyInviteEmail(company, newPassword, site);
    if (!mailResult?.success) {
      return res.status(500).json({ success: false, error: mailResult?.error || 'Email non envoyé' });
    }

    setImmediate(() =>
      partnerOrderAppSync.syncUpsert({
        site,
        name: company.name,
        phone: company.phone || '',
        email: company.email,
        contactName: company.contactName || '',
        mealTypesMode: company.mealTypesMode,
        ...resolveCompanyOffers(company),
        isAnonymous: company.isAnonymous,
        createdViaDashboardForm: company.createdViaDashboardForm,
        active: true,
        plainPassword: newPassword
      })
    );

    res.json({
      success: true,
      data: {
        id: company._id,
        email: company.email,
        name: company.name,
        created: wasCreated,
        createdViaDashboardForm: !!company.createdViaDashboardForm
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, error: 'Cet e-mail est déjà utilisé' });
    }
    console.error('❌ staffQuickInviteByEmail:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const adminUpdateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const site = normalizeSite(getSite(req));
    const company = await PartnerCompany.findById(id);
    if (!company) return res.status(404).json({ success: false, error: 'Entreprise non trouvée' });

    const { contactName, name, phone, mealTypesMode: mealTypesModeRaw, isAnonymous, firstName, lastName, structureName } =
      req.body || {};
    if (contactName !== undefined) company.contactName = String(contactName).trim();
    if (mealTypesModeRaw !== undefined || req.body?.offerBreakfast !== undefined) {
      applyOffersToCompany(company, req.body);
    }
    if (isAnonymous !== undefined) company.isAnonymous = !!isAnonymous;
    if (firstName !== undefined) company.firstName = String(firstName).trim();
    if (lastName !== undefined) company.lastName = String(lastName).trim();
    if (structureName !== undefined) company.structureName = String(structureName).trim();
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
        mealTypesMode: company.mealTypesMode,
        ...resolveCompanyOffers(company),
        isAnonymous: company.isAnonymous,
        active: company.active
      })
    );

    res.json({
      success: true,
      data: {
        ...companyPayloadForClient(company),
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
        ...companyPayloadForClient(c),
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
    const order = await PartnerOrder.findById(id);
    if (!order) return res.status(404).json({ success: false, error: 'Commande non trouvée' });
    if (order.status !== status) {
      appendStatusChange(order, status);
      await order.save();
    }
    const plain = order.toObject ? order.toObject() : order;
    plain.placedAt = plain.createdAt || null;
    plain.statusHistoryTimeline = buildStatusHistoryTimeline(plain);
    res.json({ success: true, data: plain });
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
  internalListOrders,
  staffQuickInviteByEmail
};

