/** Jour calendaire Europe/Paris (YYYY-MM-DD). */
function getParisDayString(date = new Date()) {
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
  return new Date(date).toISOString().slice(0, 10);
}

/** Borne [start, end) UTC pour un jour Europe/Paris (YYYY-MM-DD). */
function getParisDayBounds(dayStr) {
  const [y, m, d] = String(dayStr || '').split('-').map(Number);
  const anchor = y && m && d ? new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0)) : new Date();
  const parisDay = (dt) => getParisDayString(dt);

  let t = new Date(anchor);
  for (let i = 0; i < 96 && parisDay(t) !== dayStr; i++) {
    t = new Date(t.getTime() + (parisDay(t) < dayStr ? 30 : -30) * 60 * 1000);
  }

  let start = new Date(t);
  for (let i = 0; i < 96 && parisDay(start) === dayStr; i++) {
    start = new Date(start.getTime() - 30 * 60 * 1000);
  }
  while (parisDay(start) !== dayStr) start = new Date(start.getTime() + 60 * 1000);
  start.setSeconds(0, 0);

  let end = new Date(start);
  for (let i = 0; i < 96 && parisDay(end) === dayStr; i++) {
    end = new Date(end.getTime() + 30 * 60 * 1000);
  }
  while (parisDay(end) === dayStr) end = new Date(end.getTime() + 60 * 1000);
  end.setSeconds(0, 0);

  return { start, end };
}

function addParisDays(dayStr, n) {
  const [y, m, d] = String(dayStr || '').split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));
  t.setUTCDate(t.getUTCDate() + Number(n) || 0);
  return getParisDayString(t);
}

module.exports = { getParisDayString, getParisDayBounds, addParisDays };
