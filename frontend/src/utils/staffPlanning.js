export const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export function getISOWeekInfo(dateInput = new Date()) {
  const source = dateInput instanceof Date ? dateInput : new Date();
  const date = new Date(Date.UTC(source.getFullYear(), source.getMonth(), source.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const isoYear = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const weekNumber = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return { weekNumber, year: isoYear };
}

export function addIsoWeeks(weekNumber, year, delta) {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayNum = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - (dayNum - 1) + (weekNumber - 1 + delta) * 7);
  return getISOWeekInfo(new Date(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate()));
}

export function formatHours(value) {
  if (value == null || Number.isNaN(Number(value))) return '0h';
  const rounded = Math.round(Number(value) * 100) / 100;
  const whole = Math.trunc(rounded);
  const mins = Math.round((rounded - whole) * 60);
  if (mins === 0) return `${whole}h`;
  return `${whole}h${String(Math.abs(mins)).padStart(2, '0')}`;
}

export function formatShortDate(iso) {
  if (!iso) return '';
  const parts = String(iso).split('-');
  if (parts.length < 3) return '';
  return `${Number(parts[2])}/${Number(parts[1])}`;
}

export function rowPaidHours(row) {
  const fromDays = (row?.days || []).reduce((sum, day) => sum + (Number(day.paidHours) || 0), 0);
  if (fromDays > 0) return Math.round(fromDays * 100) / 100;
  return Number(row?.weeklyPaidHours) || 0;
}

export function planningWords(settings) {
  return (settings?.words || []).filter((word) => (
    word && String(word.code).toUpperCase() !== 'FERIE' && word.category !== 'ferie'
  ));
}

export function formatDayRange(dates = []) {
  if (!dates.length) return '';
  const first = dates[0]?.date;
  const last = dates[dates.length - 1]?.date;
  if (!first || !last) return '';
  const fmt = (iso) => {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };
  return `${fmt(first)} au ${fmt(last)}`;
}

export function cellLabel(day) {
  if (!day || day.kind === 'empty') return '';
  if (day.kind === 'code') return day.code || '';
  if (day.kind === 'hours') return formatHours(day.volumeHours);
  if (day.kind === 'shifts') {
    return (day.shifts || [])
      .map((shift) => `${String(shift.startTime).replace(':', 'h')}–${String(shift.endTime).replace(':', 'h')}`)
      .join('\n');
  }
  return '';
}

export function cellClass(day) {
  const holiday = day?.isHoliday ? ' sp-cell-holiday-day' : '';
  if (!day || !day.kind || day.kind === 'empty') return `sp-cell-empty${holiday}`;
  if (day.kind === 'code') {
    const code = String(day.code || '').toUpperCase();
    let base = 'sp-cell-code';
    if (code === 'REPOS') base = 'sp-cell-code sp-cell-repos';
    else if (code.startsWith('CFA')) base = 'sp-cell-code sp-cell-cfa';
    else if (code === 'MAL') base = 'sp-cell-code sp-cell-mal';
    else if (code === 'CP') base = 'sp-cell-code sp-cell-cp';
    else if (code === 'ABS') base = 'sp-cell-code sp-cell-abs';
    if (day.alerts?.length) return `${base} sp-cell-alert${holiday}`;
    return `${base}${holiday}`;
  }
  const kind = `sp-cell-${day.kind}`;
  if (day.alerts?.length) return `${kind} sp-cell-alert${holiday}`;
  return `${kind}${holiday}`;
}
