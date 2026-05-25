const jwt = require('jsonwebtoken');
const CamarisManager = require('../models/CamarisManager');
const CamarisAnimation = require('../models/CamarisAnimation');
const CamarisTerritoryEvent = require('../models/CamarisTerritoryEvent');
const { getJwtSecret } = require('../utils/jwtSecret');
const { authenticateManager } = require('../middleware/auth');
const {
  jsDayToFrench,
  getIsoWeekKey,
  formatFrenchDate,
  getEphemeride,
  getInfoBanner,
  getAutoAnimation,
  formatBodyHtml,
  buildWeekDays,
  pickAnimationForDay
} = require('../services/camarisDigestService');

const SITE_LON = 'lon';
const TOKEN_TTL = '12h';

const signManagerToken = (manager) =>
  jwt.sign(
    {
      role: 'camaris_manager',
      managerId: String(manager._id),
      siteKey: SITE_LON,
      login: manager.login
    },
    getJwtSecret(),
    { expiresIn: TOKEN_TTL }
  );

const serializeAnimation = (doc) => {
  if (!doc) return null;
  const plain = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(plain._id),
    weekKey: plain.weekKey,
    daysOfWeek: plain.daysOfWeek || [],
    title: plain.title || '',
    body: plain.body || '',
    bodyHtml: formatBodyHtml(plain.body),
    isActive: plain.isActive !== false,
    updatedAt: plain.updatedAt
  };
};

const getPublicBoard = async (req, res) => {
  try {
    const siteKey = req.query.siteKey === SITE_LON ? SITE_LON : SITE_LON;
    const now = new Date();
    const weekKey = getIsoWeekKey(now);
    const todayFrench = jsDayToFrench(now.getDay());

    const animations = await CamarisAnimation.find({ siteKey, isActive: true }).lean();
    const todayManager = pickAnimationForDay(animations, todayFrench, weekKey);

    let today;
    if (todayManager) {
      today = {
        source: 'manager',
        title: todayManager.title || 'Animation du jour',
        body: todayManager.body,
        bodyHtml: formatBodyHtml(todayManager.body),
        daysOfWeek: todayManager.daysOfWeek
      };
    } else {
      const auto = getAutoAnimation(now);
      today = {
        source: 'auto',
        title: auto.title,
        body: auto.body,
        bodyHtml: formatBodyHtml(auto.body),
        daysOfWeek: auto.daysOfWeek
      };
    }

    const weekDays = buildWeekDays(now).map((d) => {
      const hit = pickAnimationForDay(animations, d.dayOfWeek, weekKey);
      const isTodayManager = d.isToday && today.source === 'manager';
      const animTitle =
        hit?.title || (isTodayManager ? today.title : d.isToday && today.source === 'auto' ? today.title : '');
      const hasAnimation = Boolean(hit) || isTodayManager;
      return {
        ...d,
        hasAnimation,
        animationTitle: animTitle || '',
        preview: hit?.body
          ? String(hit.body).slice(0, 80)
          : isTodayManager
            ? String(today.body).slice(0, 80)
            : d.isToday
              ? String(today.body).slice(0, 80)
              : ''
      };
    });

    const info = await getInfoBanner(now, siteKey);

    res.json({
      success: true,
      data: {
        pageTitle: 'Cette Semaine à Camaris',
        siteKey,
        weekKey,
        todayFrenchDay: todayFrench,
        dateLabel: formatFrenchDate(now),
        ephemeride: getEphemeride(now),
        infoBanner: info,
        today,
        weekDays,
        managerAnimationCount: animations.filter((a) => a.weekKey === weekKey).length
      }
    });
  } catch (e) {
    console.error('camaris getPublicBoard', e);
    res.status(500).json({ success: false, error: 'Erreur chargement page Camaris' });
  }
};

const managerLogin = async (req, res) => {
  try {
    const login = String(req.body.login || '')
      .trim()
      .toLowerCase();
    const password = String(req.body.password || '');
    if (!login || !password) {
      return res.status(400).json({ success: false, error: 'Identifiant et mot de passe requis' });
    }
    const manager = await CamarisManager.findOne({ siteKey: SITE_LON, login, isActive: true }).select(
      '+password'
    );
    if (!manager || !(await manager.comparePassword(password))) {
      return res.status(401).json({ success: false, error: 'Identifiants incorrects' });
    }
    const token = signManagerToken(manager);
    res.json({
      success: true,
      token,
      manager: {
        id: String(manager._id),
        login: manager.login,
        displayName: manager.displayName || manager.login
      }
    });
  } catch (e) {
    console.error('camaris managerLogin', e);
    res.status(500).json({ success: false, error: 'Erreur connexion manager' });
  }
};

const getManagerWeek = async (req, res) => {
  try {
    const weekKey = String(req.query.weekKey || getIsoWeekKey());
    const list = await CamarisAnimation.find({ siteKey: SITE_LON, weekKey }).sort({ updatedAt: -1 });
    res.json({
      success: true,
      data: {
        weekKey,
        animations: list.map(serializeAnimation)
      }
    });
  } catch (e) {
    console.error('camaris getManagerWeek', e);
    res.status(500).json({ success: false, error: 'Erreur chargement semaine' });
  }
};

const saveManagerAnimation = async (req, res) => {
  try {
    const weekKey = String(req.body.weekKey || getIsoWeekKey());
    const daysOfWeek = Array.isArray(req.body.daysOfWeek)
      ? [...new Set(req.body.daysOfWeek.map((d) => Number(d)).filter((d) => d >= 1 && d <= 7))]
      : [];
    const body = String(req.body.body || '').trim();
    const title = String(req.body.title || '').trim();
    const id = req.body.id || req.params.id;

    if (!daysOfWeek.length) {
      return res.status(400).json({ success: false, error: 'Choisissez au moins un jour (lundi–dimanche)' });
    }
    if (!body) {
      return res.status(400).json({ success: false, error: 'Texte de l’animation requis' });
    }

    let doc;
    if (id) {
      doc = await CamarisAnimation.findOneAndUpdate(
        { _id: id, siteKey: SITE_LON },
        {
          weekKey,
          daysOfWeek,
          title: title || 'Animation Camaris',
          body,
          isActive: true,
          updatedByManagerId: req.camarisManager._id
        },
        { new: true }
      );
      if (!doc) return res.status(404).json({ success: false, error: 'Animation introuvable' });
    } else {
      doc = await CamarisAnimation.create({
        siteKey: SITE_LON,
        weekKey,
        daysOfWeek,
        title: title || 'Animation Camaris',
        body,
        isActive: true,
        updatedByManagerId: req.camarisManager._id
      });
    }

    res.json({ success: true, data: serializeAnimation(doc) });
  } catch (e) {
    console.error('camaris saveManagerAnimation', e);
    res.status(500).json({ success: false, error: 'Erreur enregistrement animation' });
  }
};

const deleteManagerAnimation = async (req, res) => {
  try {
    const r = await CamarisAnimation.deleteOne({ _id: req.params.id, siteKey: SITE_LON });
    if (!r.deletedCount) return res.status(404).json({ success: false, error: 'Animation introuvable' });
    res.json({ success: true });
  } catch (e) {
    console.error('camaris deleteManagerAnimation', e);
    res.status(500).json({ success: false, error: 'Erreur suppression' });
  }
};

const listManagersAdmin = async (req, res) => {
  try {
    const rows = await CamarisManager.find({ siteKey: SITE_LON }).sort({ login: 1 }).select('-password');
    res.json({
      success: true,
      data: rows.map((m) => ({
        id: String(m._id),
        login: m.login,
        displayName: m.displayName,
        isActive: m.isActive
      }))
    });
  } catch (e) {
    console.error('camaris listManagersAdmin', e);
    res.status(500).json({ success: false, error: 'Erreur liste managers' });
  }
};

const createManagerAdmin = async (req, res) => {
  try {
    const login = String(req.body.login || '')
      .trim()
      .toLowerCase();
    const password = String(req.body.password || '');
    const displayName = String(req.body.displayName || '').trim();
    if (!login || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Login et mot de passe (6 car. min.) requis' });
    }
    const exists = await CamarisManager.findOne({ siteKey: SITE_LON, login });
    if (exists) return res.status(409).json({ success: false, error: 'Ce login existe déjà' });
    const m = await CamarisManager.create({
      siteKey: SITE_LON,
      login,
      password,
      displayName: displayName || login
    });
    res.json({
      success: true,
      data: { id: String(m._id), login: m.login, displayName: m.displayName, isActive: m.isActive }
    });
  } catch (e) {
    console.error('camaris createManagerAdmin', e);
    res.status(500).json({ success: false, error: 'Erreur création manager' });
  }
};

const updateManagerAdmin = async (req, res) => {
  try {
    const m = await CamarisManager.findById(req.params.id);
    if (!m) return res.status(404).json({ success: false, error: 'Manager introuvable' });
    if (req.body.login != null) m.login = String(req.body.login).trim().toLowerCase();
    if (req.body.displayName != null) m.displayName = String(req.body.displayName).trim();
    if (req.body.isActive != null) m.isActive = Boolean(req.body.isActive);
    if (req.body.password && String(req.body.password).length >= 6) {
      m.password = String(req.body.password);
    }
    await m.save();
    res.json({
      success: true,
      data: { id: String(m._id), login: m.login, displayName: m.displayName, isActive: m.isActive }
    });
  } catch (e) {
    console.error('camaris updateManagerAdmin', e);
    res.status(500).json({ success: false, error: 'Erreur mise à jour manager' });
  }
};

const deleteManagerAdmin = async (req, res) => {
  try {
    const r = await CamarisManager.deleteOne({ _id: req.params.id, siteKey: SITE_LON });
    if (!r.deletedCount) return res.status(404).json({ success: false, error: 'Manager introuvable' });
    res.json({ success: true });
  } catch (e) {
    console.error('camaris deleteManagerAdmin', e);
    res.status(500).json({ success: false, error: 'Erreur suppression manager' });
  }
};

const listTerritoryEventsAdmin = async (req, res) => {
  try {
    const rows = await CamarisTerritoryEvent.find({ siteKey: SITE_LON })
      .sort({ month: 1, day: 1, scope: 1 })
      .lean();
    res.json({
      success: true,
      data: rows.map((e) => ({
        id: String(e._id),
        month: e.month,
        day: e.day,
        year: e.year,
        scope: e.scope,
        title: e.title,
        text: e.text,
        isActive: e.isActive
      }))
    });
  } catch (e) {
    console.error('camaris listTerritoryEventsAdmin', e);
    res.status(500).json({ success: false, error: 'Erreur liste événements' });
  }
};

const saveTerritoryEventAdmin = async (req, res) => {
  try {
    const month = Number(req.body.month);
    const day = Number(req.body.day);
    const year = req.body.year != null && req.body.year !== '' ? Number(req.body.year) : null;
    const scope = String(req.body.scope || 'audomarois');
    const title = String(req.body.title || '').trim();
    const text = String(req.body.text || '').trim();
    if (!month || !day || !title || !text) {
      return res.status(400).json({ success: false, error: 'Mois, jour, titre et texte requis' });
    }
    const payload = { siteKey: SITE_LON, month, day, year, scope, title, text, isActive: true };
    let doc;
    if (req.params.id) {
      doc = await CamarisTerritoryEvent.findOneAndUpdate(
        { _id: req.params.id, siteKey: SITE_LON },
        payload,
        { new: true }
      );
      if (!doc) return res.status(404).json({ success: false, error: 'Événement introuvable' });
    } else {
      doc = await CamarisTerritoryEvent.create(payload);
    }
    res.json({
      success: true,
      data: {
        id: String(doc._id),
        month: doc.month,
        day: doc.day,
        year: doc.year,
        scope: doc.scope,
        title: doc.title,
        text: doc.text,
        isActive: doc.isActive
      }
    });
  } catch (e) {
    console.error('camaris saveTerritoryEventAdmin', e);
    res.status(500).json({ success: false, error: 'Erreur enregistrement événement' });
  }
};

const deleteTerritoryEventAdmin = async (req, res) => {
  try {
    const r = await CamarisTerritoryEvent.deleteOne({ _id: req.params.id, siteKey: SITE_LON });
    if (!r.deletedCount) return res.status(404).json({ success: false, error: 'Événement introuvable' });
    res.json({ success: true });
  } catch (e) {
    console.error('camaris deleteTerritoryEventAdmin', e);
    res.status(500).json({ success: false, error: 'Erreur suppression' });
  }
};

module.exports = {
  getPublicBoard,
  managerLogin,
  getManagerWeek,
  saveManagerAnimation,
  deleteManagerAnimation,
  listManagersAdmin,
  createManagerAdmin,
  updateManagerAdmin,
  deleteManagerAdmin,
  listTerritoryEventsAdmin,
  saveTerritoryEventAdmin,
  deleteTerritoryEventAdmin,
  authenticateManagerAdmin: authenticateManager
};
