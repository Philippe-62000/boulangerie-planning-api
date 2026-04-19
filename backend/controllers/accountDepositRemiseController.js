const AccountDeposit = require('../models/AccountDeposit');
const AccountDepositRemise = require('../models/AccountDepositRemise');

function getParisDayString(date = new Date()) {
  // YYYY-MM-DD in Europe/Paris
  try {
    const parts = new Intl.DateTimeFormat('fr-CA', {
      timeZone: 'Europe/Paris',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(date);
    const y = parts.find((p) => p.type === 'year')?.value;
    const m = parts.find((p) => p.type === 'month')?.value;
    const d = parts.find((p) => p.type === 'day')?.value;
    if (y && m && d) return `${y}-${m}-${d}`;
  } catch {
    /* fallback below */
  }
  const x = new Date(date);
  return x.toISOString().slice(0, 10);
}

function getParisDayBounds(dayStr) {
  // Convertit un jour Europe/Paris (YYYY-MM-DD) en borne [start, end) en UTC.
  // On le calcule par recherche "pas à pas" autour d'un point d'ancrage,
  // ce qui reste robuste aux changements d'heure sans dépendances externes.
  const [y, m, d] = String(dayStr || '').split('-').map(Number);
  const anchor = y && m && d ? new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0)) : new Date();

  const parisDay = (dt) => getParisDayString(dt);

  // Ajuster l'ancre pour tomber sur le bon jour Paris.
  let t = new Date(anchor);
  for (let i = 0; i < 96 && parisDay(t) !== dayStr; i++) {
    // avance / recule par 30 minutes selon comparaison lexicographique YYYY-MM-DD
    t = new Date(t.getTime() + (parisDay(t) < dayStr ? 30 : -30) * 60 * 1000);
  }

  // Trouver le début du jour : reculer jusqu'à changer de jour, puis avancer minute par minute.
  let start = new Date(t);
  for (let i = 0; i < 96 && parisDay(start) === dayStr; i++) {
    start = new Date(start.getTime() - 30 * 60 * 1000);
  }
  while (parisDay(start) !== dayStr) start = new Date(start.getTime() + 60 * 1000);
  start.setSeconds(0, 0);

  // Fin du jour : avancer depuis start jusqu'au prochain jour.
  let end = new Date(start);
  for (let i = 0; i < 96 && parisDay(end) === dayStr; i++) {
    end = new Date(end.getTime() + 30 * 60 * 1000);
  }
  while (parisDay(end) === dayStr) end = new Date(end.getTime() + 60 * 1000);
  end.setSeconds(0, 0);

  return { start, end };
}

async function computeTodayDepositsSnapshot(site, day) {
  const { start, end } = getParisDayBounds(day);
  const deposits = await AccountDeposit.find({
    site,
    createdAt: { $gte: start, $lt: end }
  })
    .sort({ createdAt: 1 })
    .limit(2000)
    .lean();

  const snapshot = (deposits || []).map((d) => ({
    depositId: d._id,
    firstName: d.firstName || '',
    lastName: d.lastName || '',
    amount: Number(d.amount || 0)
  }));
  const depositsCount = snapshot.length;
  const depositsTotal = Math.round(snapshot.reduce((sum, x) => sum + (Number(x.amount) || 0), 0) * 100) / 100;
  return { snapshot, depositsCount, depositsTotal };
}

exports.getDashboardSummary = async (req, res) => {
  try {
    const site = req.query.site === 'arras' ? 'arras' : 'longuenesse';
    const today = getParisDayString();
    const [todayDoc, lastFinished] = await Promise.all([
      AccountDepositRemise.findOne({ site, day: today }).lean(),
      AccountDepositRemise.findOne({ site, status: 'finished' }).sort({ finishedAt: -1 }).lean()
    ]);

    const todayDeposits = await computeTodayDepositsSnapshot(site, today);

    return res.json({
      success: true,
      data: {
        site,
        today,
        todayDeposits,
        todayRemise: todayDoc || null,
        lastFinishedDay: lastFinished?.day || null,
        lastFinishedAt: lastFinished?.finishedAt || null
      }
    });
  } catch (e) {
    console.error('accountDepositRemise getDashboardSummary:', e);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

exports.upsertTodayDraft = async (req, res) => {
  try {
    const site = req.body?.site === 'arras' ? 'arras' : 'longuenesse';
    const today = getParisDayString();
    const declaredTicketCountRaw = req.body?.declaredTicketCount;
    const declaredTicketCount =
      declaredTicketCountRaw === '' || declaredTicketCountRaw == null
        ? null
        : Math.max(0, Math.floor(Number(declaredTicketCountRaw)));

    const doc = await AccountDepositRemise.findOneAndUpdate(
      { site, day: today },
      {
        $set: {
          site,
          day: today,
          status: 'draft',
          declaredTicketCount: Number.isFinite(declaredTicketCount) ? declaredTicketCount : null,
          finishedAt: null,
          finishedById: null,
          finishedByName: ''
        },
        $setOnInsert: {}
      },
      { upsert: true, new: true }
    ).lean();

    return res.json({ success: true, data: doc });
  } catch (e) {
    console.error('accountDepositRemise upsertTodayDraft:', e);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

exports.finishToday = async (req, res) => {
  try {
    const site = req.body?.site === 'arras' ? 'arras' : 'longuenesse';
    const today = getParisDayString();
    const { snapshot, depositsCount, depositsTotal } = await computeTodayDepositsSnapshot(site, today);

    if (depositsCount === 0) {
      return res.status(400).json({ success: false, error: 'Aucun dépôt enregistré aujourd’hui' });
    }

    const declaredTicketCountRaw = req.body?.declaredTicketCount;
    const declaredTicketCount =
      declaredTicketCountRaw === '' || declaredTicketCountRaw == null
        ? null
        : Math.max(0, Math.floor(Number(declaredTicketCountRaw)));

    const user = req.user || {};

    const update = {
      status: 'finished',
      declaredTicketCount: Number.isFinite(declaredTicketCount) ? declaredTicketCount : null,
      depositsSnapshot: snapshot,
      depositsCount,
      depositsTotal,
      finishedAt: new Date(),
      finishedById: user.id || null,
      finishedByName: user.name || user.email || ''
    };

    const doc = await AccountDepositRemise.findOneAndUpdate(
      { site, day: today },
      { $set: update, $setOnInsert: { site, day: today } },
      { upsert: true, new: true }
    );

    return res.json({ success: true, data: doc });
  } catch (e) {
    console.error('accountDepositRemise finishToday:', e);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

exports.resumeToday = async (req, res) => {
  try {
    const site = req.body?.site === 'arras' ? 'arras' : 'longuenesse';
    const today = getParisDayString();

    const doc = await AccountDepositRemise.findOneAndUpdate(
      { site, day: today },
      {
        $set: {
          status: 'draft',
          finishedAt: null,
          finishedById: null,
          finishedByName: ''
        }
      },
      { new: true }
    );

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Aucune remise du jour à reprendre' });
    }

    return res.json({ success: true, data: doc });
  } catch (e) {
    console.error('accountDepositRemise resumeToday:', e);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

