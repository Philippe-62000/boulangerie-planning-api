const CamarisVisitDaily = require('../models/CamarisVisitDaily');
const CamarisVisitCounter = require('../models/CamarisVisitCounter');
const { getIsoWeekKey } = require('./camarisDigestService');

const SITE_LON = 'lon';

function getParisDateKey(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(d);
}

function getParisLocalDate(d = new Date()) {
  const key = getParisDateKey(d);
  const [y, m, day] = key.split('-').map(Number);
  return new Date(y, m - 1, day);
}

function getParisWeekKey(d = new Date()) {
  return getIsoWeekKey(getParisLocalDate(d));
}

function getParisMonthKey(d = new Date()) {
  return getParisDateKey(d).slice(0, 7);
}

function addDaysToDateKey(dateKey, delta) {
  const [y, m, day] = dateKey.split('-').map(Number);
  const dt = new Date(y, m - 1, day);
  dt.setDate(dt.getDate() + delta);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

async function getVisitSummary(siteKey = SITE_LON) {
  const dateKey = getParisDateKey();
  const weekKey = getParisWeekKey();
  const monthKey = getParisMonthKey();

  const todayRow = await CamarisVisitDaily.findOne({ siteKey, dateKey }).lean();
  const today = todayRow?.count || 0;

  const [weekAgg] = await CamarisVisitDaily.aggregate([
    { $match: { siteKey, weekKey } },
    { $group: { _id: null, total: { $sum: '$count' } } }
  ]);
  const week = weekAgg?.total || 0;

  const [monthAgg] = await CamarisVisitDaily.aggregate([
    { $match: { siteKey, monthKey } },
    { $group: { _id: null, total: { $sum: '$count' } } }
  ]);
  const month = monthAgg?.total || 0;

  const legacy = await CamarisVisitCounter.findOne({ siteKey }).lean();
  const total = legacy?.totalVisits || 0;

  return { today, week, month, total };
}

async function getVisitStatsAdmin(siteKey = SITE_LON, { daysBack = 35, monthsBack = 13 } = {}) {
  const todayKey = getParisDateKey();
  const startDayKey = addDaysToDateKey(todayKey, -(daysBack - 1));

  const rows = await CamarisVisitDaily.find({
    siteKey,
    dateKey: { $gte: startDayKey, $lte: todayKey }
  })
    .sort({ dateKey: 1 })
    .lean();

  const byDate = new Map(rows.map((r) => [r.dateKey, r.count || 0]));
  const daily = [];
  for (let i = 0; i < daysBack; i++) {
    const dk = addDaysToDateKey(startDayKey, i);
    daily.push({ date: dk, count: byDate.get(dk) || 0 });
  }

  const monthlyRaw = await CamarisVisitDaily.aggregate([
    { $match: { siteKey } },
    { $group: { _id: '$monthKey', count: { $sum: '$count' } } },
    { $sort: { _id: -1 } },
    { $limit: monthsBack }
  ]);

  const monthly = monthlyRaw
    .map((m) => ({ month: m._id, count: m.count || 0 }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const summary = await getVisitSummary(siteKey);

  const [y, m] = getParisMonthKey().split('-').map(Number);
  const prevMonthKey = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;

  const thisMonth = monthly.find((x) => x.month === getParisMonthKey())?.count ?? summary.month;
  const prevMonth = monthly.find((x) => x.month === prevMonthKey)?.count ?? 0;

  return {
    summary,
    daily,
    monthly,
    compare: {
      currentMonth: getParisMonthKey(),
      currentMonthCount: thisMonth,
      previousMonth: prevMonthKey,
      previousMonthCount: prevMonth,
      delta: thisMonth - prevMonth
    }
  };
}

module.exports = { getVisitSummary, getVisitStatsAdmin };
