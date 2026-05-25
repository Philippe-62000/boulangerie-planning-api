const { CamarisManager, CamarisAnimation } = require('./models');
const { signManagerToken } = require('./auth');
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
} = require('./digest');

const SITE_LON = 'lon';

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

async function getPublicBoard() {
  const now = new Date();
  const weekKey = getIsoWeekKey(now);
  const todayFrench = jsDayToFrench(now.getDay());

  const animations = await CamarisAnimation.find({ siteKey: SITE_LON, isActive: true }).lean();
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
    const title =
      hit?.title || (isTodayManager ? today.title : d.isToday && today.source === 'auto' ? today.title : '');
    const body = hit?.body || (isTodayManager ? today.body : d.isToday && today.source === 'auto' ? today.body : '');
    const hasAnimation = Boolean(hit) || isTodayManager;
    return {
      ...d,
      hasAnimation,
      animationTitle: title || '',
      animationBodyHtml: body ? formatBodyHtml(body) : '',
      preview: body ? String(body).slice(0, 120) : ''
    };
  });

  const info = await getInfoBanner(now, SITE_LON);

  return {
    pageTitle: 'Cette Semaine à Camaris',
    siteKey: SITE_LON,
    weekKey,
    todayFrenchDay: todayFrench,
    dateLabel: formatFrenchDate(now),
    ephemeride: getEphemeride(now),
    infoBanner: info,
    today,
    weekDays,
    managerAnimationCount: animations.filter((a) => a.weekKey === weekKey).length
  };
}

async function managerLogin(body) {
  const login = String(body.login || '')
    .trim()
    .toLowerCase();
  const password = String(body.password || '');
  if (!login || !password) {
    const err = new Error('Identifiant et mot de passe requis');
    err.status = 400;
    throw err;
  }
  const manager = await CamarisManager.findOne({ siteKey: SITE_LON, login, isActive: true }).select(
    '+password'
  );
  if (!manager || !(await manager.comparePassword(password))) {
    const err = new Error('Identifiants incorrects');
    err.status = 401;
    throw err;
  }
  return {
    token: signManagerToken(manager),
    manager: {
      id: String(manager._id),
      login: manager.login,
      displayName: manager.displayName || manager.login
    }
  };
}

async function getManagerWeek(weekKeyQuery) {
  const weekKey = String(weekKeyQuery || getIsoWeekKey());
  const list = await CamarisAnimation.find({ siteKey: SITE_LON, weekKey }).sort({ updatedAt: -1 });
  return { weekKey, animations: list.map(serializeAnimation) };
}

async function saveManagerAnimation(manager, body, idParam) {
  const weekKey = String(body.weekKey || getIsoWeekKey());
  const daysOfWeek = Array.isArray(body.daysOfWeek)
    ? [...new Set(body.daysOfWeek.map((d) => Number(d)).filter((d) => d >= 1 && d <= 7))]
    : [];
  const textBody = String(body.body || '').trim();
  const title = String(body.title || '').trim();
  const id = idParam || body.id;

  if (!daysOfWeek.length) {
    const err = new Error('Choisissez au moins un jour (lundi–dimanche)');
    err.status = 400;
    throw err;
  }
  if (!textBody) {
    const err = new Error('Texte de l’animation requis');
    err.status = 400;
    throw err;
  }

  let doc;
  if (id) {
    doc = await CamarisAnimation.findOneAndUpdate(
      { _id: id, siteKey: SITE_LON },
      {
        weekKey,
        daysOfWeek,
        title: title || 'Animation Camaris',
        body: textBody,
        isActive: true,
        updatedByManagerId: manager._id
      },
      { new: true }
    );
    if (!doc) {
      const err = new Error('Animation introuvable');
      err.status = 404;
      throw err;
    }
  } else {
    doc = await CamarisAnimation.create({
      siteKey: SITE_LON,
      weekKey,
      daysOfWeek,
      title: title || 'Animation Camaris',
      body: textBody,
      isActive: true,
      updatedByManagerId: manager._id
    });
  }
  return serializeAnimation(doc);
}

async function deleteManagerAnimation(id) {
  const r = await CamarisAnimation.deleteOne({ _id: id, siteKey: SITE_LON });
  if (!r.deletedCount) {
    const err = new Error('Animation introuvable');
    err.status = 404;
    throw err;
  }
}

module.exports = {
  getPublicBoard,
  managerLogin,
  getManagerWeek,
  saveManagerAnimation,
  deleteManagerAnimation
};
