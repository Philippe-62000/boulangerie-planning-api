function toIso(utcDate) {
  return utcDate.toISOString().slice(0, 10);
}

function addUtcDays(utcDate, days) {
  const next = new Date(utcDate.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

/** Dimanche de Pâques (algorithme de Meeus/Jones/Butcher). */
function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function frenchPublicHolidays(year) {
  const y = Number(year);
  const easter = easterSunday(y);
  return [
    { date: `${y}-01-01`, name: 'Jour de l\'an' },
    { date: toIso(addUtcDays(easter, 1)), name: 'Lundi de Pâques' },
    { date: `${y}-05-01`, name: 'Fête du Travail' },
    { date: `${y}-05-08`, name: 'Victoire 1945' },
    { date: toIso(addUtcDays(easter, 39)), name: 'Ascension' },
    { date: toIso(addUtcDays(easter, 50)), name: 'Lundi de Pentecôte' },
    { date: `${y}-07-14`, name: 'Fête nationale' },
    { date: `${y}-08-15`, name: 'Assomption' },
    { date: `${y}-11-01`, name: 'Toussaint' },
    { date: `${y}-11-11`, name: 'Armistice' },
    { date: `${y}-12-25`, name: 'Noël' }
  ];
}

function holidayMapForYears(years) {
  const map = new Map();
  [...new Set((years || []).map(Number).filter(Boolean))].forEach((year) => {
    frenchPublicHolidays(year).forEach((item) => {
      map.set(item.date, item.name);
    });
  });
  return map;
}

function holidaysForIsoDates(isoDates = []) {
  const years = isoDates.map((iso) => Number(String(iso).slice(0, 4))).filter(Boolean);
  const map = holidayMapForYears(years);
  return isoDates.filter((iso) => map.has(iso));
}

function holidayLabelsForIsoDates(isoDates = []) {
  const years = isoDates.map((iso) => Number(String(iso).slice(0, 4))).filter(Boolean);
  const map = holidayMapForYears(years);
  const labels = {};
  isoDates.forEach((iso) => {
    if (map.has(iso)) labels[iso] = map.get(iso);
  });
  return labels;
}

module.exports = {
  easterSunday,
  frenchPublicHolidays,
  holidaysForIsoDates,
  holidayLabelsForIsoDates
};
