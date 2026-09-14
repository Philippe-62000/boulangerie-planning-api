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

export function cpHoursForContract(contractedHours) {
  const weekly = Number(contractedHours);
  const base = Number.isFinite(weekly) && weekly > 0 ? weekly : 35;
  return Math.round((base / 6) * 10000) / 10000;
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

export function rowCpHours(row) {
  const perDay = cpHoursForContract(row?.contractedHours);
  const fromDays = (row?.days || []).reduce((sum, day) => {
    const stored = Number(day?.cpHours) || 0;
    if (stored > 0) return sum + stored;
    if (day && day.kind === 'code' && String(day.code || '').toUpperCase() === 'CP') return sum + perDay;
    return sum;
  }, 0);
  if (fromDays > 0) return Math.round(fromDays * 100) / 100;
  return Number(row?.weeklyCpHours) || 0;
}

export function dayDisplayHours(day, contractedHours) {
  const paid = Number(day?.paidHours) || 0;
  if (paid > 0) return paid;
  const cp = Number(day?.cpHours) || 0;
  if (cp > 0) return cp;
  if (day && day.kind === 'code' && String(day.code || '').toUpperCase() === 'CP') {
    return cpHoursForContract(contractedHours);
  }
  return 0;
}

export function rowRecupHours(row) {
  return Number(row?.recupHours) || 0;
}

export function rowAccountantHours(row) {
  return Math.round((rowPaidHours(row) - rowRecupHours(row)) * 100) / 100;
}

export function rowWeekHours(row, useAccountant = false) {
  const base = useAccountant ? rowAccountantHours(row) : rowPaidHours(row);
  return Math.round((base + rowCpHours(row)) * 100) / 100;
}

export function overtimeFromPaid(paidHours, settings) {
  const from25 = settings?.ot25FromHour ?? 36;
  const to25 = settings?.ot25ToHour ?? 43;
  const paid = Number(paidHours) || 0;
  let ot25 = 0;
  let ot50 = 0;
  if (paid > to25) {
    ot50 = paid - to25;
    ot25 = to25 - (from25 - 1);
  } else if (paid >= from25) {
    ot25 = paid - (from25 - 1);
  }
  return {
    ot25: Math.round(ot25 * 100) / 100,
    ot50: Math.round(ot50 * 100) / 100
  };
}

export function hoursMatchContract(row, useAccountant = false) {
  const paid = Number(rowWeekHours(row, useAccountant));
  const contracted = Number(row.contractedHours);
  if (!Number.isFinite(paid) || !Number.isFinite(contracted) || contracted <= 0) return false;
  return Math.abs(paid - contracted) < 0.05;
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

export function isRestDay(day) {
  return day && day.kind === 'code' && String(day.code || '').toUpperCase() === 'REPOS';
}

export function isOffDay(day) {
  const code = String(day?.code || '').toUpperCase();
  return day?.kind === 'code' && (code === 'REPOS' || code === 'CP' || code === 'MAL' || code === 'ABS');
}

export function computePlanningHints(prevDays = [], currentDays = []) {
  const prevRestWeekdays = new Set((prevDays || []).filter(isRestDay).map((day) => day.day));
  const seventhDates = new Set();
  const currentDates = new Set((currentDays || []).map((day) => day.date).filter(Boolean));
  let streak = 0;
  [...(prevDays || []), ...(currentDays || [])].forEach((day) => {
    if (isOffDay(day)) {
      streak = 0;
      return;
    }
    streak += 1;
    if (streak >= 7 && day?.date && currentDates.has(day.date)) {
      seventhDates.add(day.date);
    }
  });
  return { prevRestWeekdays, seventhDates };
}

export function buildShopPrintHtml({ weekNumber, dates = [], rows = [], holidayDates = [], title = 'Planning' }) {
  const holidays = new Set(holidayDates || []);
  const range = formatDayRange(dates);
  const head = DAYS.map((day, index) => {
    const iso = dates[index]?.date;
    const holiday = iso && holidays.has(iso);
    return `<th>${day} ${formatShortDate(iso) || ''}${holiday ? '<br><small>Férié</small>' : ''}</th>`;
  }).join('');
  const body = (rows || []).filter((row) => !row._group).map((row) => {
    const cells = DAYS.map((dayName) => {
      const day = (row.days || []).find((item) => item.day === dayName);
      const label = (cellLabel(day) || '—').replace(/\n/g, '<br>');
      const code = String(day?.code || '').toUpperCase();
      const isCode = day?.kind === 'code' || !day || day.kind === 'empty';
      const pause = isCode || code === 'REPOS' ? '' : '<div class="pause">Pause : de ______ à ______</div>';
      const shown = dayDisplayHours(day, row.contractedHours);
      const hoursText = shown > 0 ? `<div class="hrs">${formatHours(shown)}</div>` : '';
      return `<td>${label}${hoursText}${pause}</td>`;
    }).join('');
    const weekHours = rowWeekHours(row, true);
    return `<tr><th>${row.employeeName || ''}</th>${cells}<td>${formatHours(weekHours)}</td></tr>`;
  }).join('');
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>${title} semaine ${weekNumber}</title>
<style>
  @page { size: A4 landscape; margin: 8mm; }
  body { font-family: Arial, sans-serif; color: #111; margin: 0; }
  h1 { font-size: 16px; margin: 0 0 4px; }
  p { font-size: 11px; margin: 0 0 8px; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 10px; }
  th, td { border: 1px solid #333; padding: 4px 3px; text-align: center; vertical-align: top; }
  th { background: #f0f0f0; }
  td { height: 52px; }
  .pause { margin-top: 8px; border-top: 1px dashed #666; padding-top: 3px; font-size: 9px; white-space: nowrap; }
  .hrs { font-size: 9px; color: #333; }
</style></head><body>
<h1>${title} semaine ${weekNumber} — ${range}</h1>
<table>
<thead><tr><th>Salarié</th>${head}<th>Semaine</th></tr></thead>
<tbody>${body}</tbody>
</table>
</body></html>`;
}

export const CATEGORY_GROUPS = [
  { id: 'preparation', label: 'Préparateurs' },
  { id: 'boulanger', label: 'Boulangers' },
  { id: 'vente', label: 'Vendeurs' }
];

export function groupRowsByCategory(rows = [], employeeOrder = []) {
  const orderMap = new Map((employeeOrder || []).map((id, index) => [String(id), index]));
  const buckets = { preparation: [], boulanger: [], vente: [] };
  (rows || []).forEach((row) => {
    const cat = buckets[row.employeeCategory] ? row.employeeCategory : 'vente';
    buckets[cat].push(row);
  });
  const sortBucket = (list) => list.sort((a, b) => {
    const ia = orderMap.has(String(a.employeeId)) ? orderMap.get(String(a.employeeId)) : 10000;
    const ib = orderMap.has(String(b.employeeId)) ? orderMap.get(String(b.employeeId)) : 10000;
    if (ia !== ib) return ia - ib;
    return String(a.employeeName || '').localeCompare(String(b.employeeName || ''), 'fr');
  });
  return CATEGORY_GROUPS.map((group) => ({
    ...group,
    rows: sortBucket(buckets[group.id] || [])
  })).filter((group) => group.rows.length);
}

export function todayIsoParis(dateInput = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(dateInput);
}

export function isIsoDayFinished(isoDate, today = todayIsoParis()) {
  return !!isoDate && String(isoDate) < String(today);
}

export function isIsoWeekFinished(dates = [], today = todayIsoParis()) {
  const last = dates[dates.length - 1]?.date;
  return !!last && String(last) < String(today);
}

export function openPrintHtml(html) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const popup = window.open(url, '_blank');
  if (!popup) {
    URL.revokeObjectURL(url);
    return false;
  }
  const tryPrint = () => {
    try {
      popup.focus();
      popup.print();
    } catch (error) {
      console.error(error);
    }
  };
  popup.addEventListener('load', tryPrint);
  window.setTimeout(tryPrint, 400);
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  return true;
}

export function buildMonthRecapHtml({ monthLabel, year, month, employees = [] }) {
  const pages = (employees || []).map((employee) => {
    const rows = (employee.days || []).map((day) => {
      const label = (cellLabel(day) || '—').replace(/\n/g, '<br>');
      return `<tr><td>${formatShortDate(day.date)} ${day.day || ''}</td><td>${label}</td><td>${formatHours(day.paidHours)}</td></tr>`;
    }).join('');
    return `<section class="page">
      <h1>${employee.employeeName || ''}</h1>
      <p class="recap-meta">${monthLabel} · Contrat ${formatHours(employee.contractedHours)} · Payé ${formatHours(employee.paidHours)} · Nuit ${formatHours(employee.nightHours)} · HS 25% ${formatHours(employee.ot25)} · HS 50% ${formatHours(employee.ot50)} · Maladie ${employee.sickDays || 0} j</p>
      <table>
        <thead><tr><th>Jour</th><th>Horaire</th><th>Heures</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="3">Aucune heure ce mois</td></tr>'}</tbody>
      </table>
    </section>`;
  }).join('');
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>Récapitulatif ${monthLabel || `${month}/${year}`}</title>
<style>
  @page { size: A4 portrait; margin: 12mm; }
  body { font-family: Arial, sans-serif; color: #111; margin: 0; }
  .page { page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  h1 { font-size: 18px; margin: 0 0 8px; }
  .recap-meta { font-size: 16px; font-weight: 700; line-height: 1.35; margin: 0 0 12px; }
  p { font-size: 12px; margin: 0 0 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #333; padding: 5px 6px; }
  th { background: #f0f0f0; }
</style></head><body>${pages}</body></html>`;
}
