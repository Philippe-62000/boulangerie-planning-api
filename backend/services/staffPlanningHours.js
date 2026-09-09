const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

function parseMinutes(value) {
  if (value == null || value === '') return null;
  const s = String(value).trim().toLowerCase().replace('h', ':');
  const match = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function formatHours(hours) {
  if (hours == null || Number.isNaN(Number(hours))) return '0h';
  const rounded = Math.round(Number(hours) * 100) / 100;
  const whole = Math.trunc(rounded);
  const mins = Math.round((rounded - whole) * 60);
  if (mins === 0) return `${whole}h`;
  return `${whole}h${String(Math.abs(mins)).padStart(2, '0')}`;
}

function getISOWeekInfo(dateInput) {
  const source = dateInput instanceof Date ? dateInput : new Date();
  const date = new Date(Date.UTC(source.getFullYear(), source.getMonth(), source.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const isoYear = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const weekNumber = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return { weekNumber, year: isoYear };
}

function getMondayOfISOWeek(weekNumber, year) {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayNum = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - (dayNum - 1) + (weekNumber - 1) * 7);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

function addIsoWeeks(weekNumber, year, delta) {
  const monday = getMondayOfISOWeek(weekNumber, year);
  monday.setUTCDate(monday.getUTCDate() + delta * 7);
  return getISOWeekInfo(new Date(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate()));
}

function toIsoDate(utcDate) {
  return utcDate.toISOString().slice(0, 10);
}

function weekDates(weekNumber, year) {
  const monday = getMondayOfISOWeek(weekNumber, year);
  return DAYS.map((day, index) => {
    const date = new Date(monday);
    date.setUTCDate(monday.getUTCDate() + index);
    return { day, date: toIsoDate(date) };
  });
}

function shiftDurationMinutes(startTime, endTime) {
  const start = parseMinutes(startTime);
  const end = parseMinutes(endTime);
  if (start == null || end == null) return 0;
  if (end <= start) return 24 * 60 - start + end;
  return end - start;
}

function minutesInNight(startTime, endTime, nightStart, nightEnd) {
  const start = parseMinutes(startTime);
  const end = parseMinutes(endTime);
  const ns = parseMinutes(nightStart);
  const ne = parseMinutes(nightEnd);
  if (start == null || end == null || ns == null || ne == null) return 0;

  const workRanges = end <= start
    ? [[start, 1440], [0, end]]
    : [[start, end]];
  const nightRanges = ns === ne
    ? [[0, 1440]]
    : (ns > ne ? [[ns, 1440], [0, ne]] : [[ns, ne]]);

  let total = 0;
  for (const [a, b] of workRanges) {
    for (const [c, d] of nightRanges) {
      const lo = Math.max(a, c);
      const hi = Math.min(b, d);
      if (hi > lo) total += hi - lo;
    }
  }
  return total;
}

function normalizeShifts(shifts) {
  return (shifts || [])
    .map((shift) => ({
      startTime: shift.startTime || shift.start || '',
      endTime: shift.endTime || shift.end || ''
    }))
    .filter((shift) => parseMinutes(shift.startTime) != null && parseMinutes(shift.endTime) != null)
    .sort((a, b) => parseMinutes(a.startTime) - parseMinutes(b.startTime))
    .slice(0, 2);
}

function computeShifts(shifts, settings) {
  const cleaned = normalizeShifts(shifts);
  const breakThreshold = Math.round((settings.breakThresholdHours ?? 5) * 60);
  const breakMinutes = settings.breakMinutes ?? 30;
  const maxDayHours = settings.maxDayHours ?? 10;
  const maxSplitGapHours = settings.maxSplitGapHours ?? 3;
  const alerts = [];

  if (!cleaned.length) {
    return {
      paidHours: 0,
      nightHours: 0,
      deductedBreakMinutes: 0,
      alerts
    };
  }

  const durations = cleaned.map((shift) => shiftDurationMinutes(shift.startTime, shift.endTime));
  let paidMinutes = durations.reduce((sum, value) => sum + value, 0);
  let deducted = 0;

  if (cleaned.length === 1) {
    if (durations[0] > breakThreshold) {
      deducted = breakMinutes;
      paidMinutes -= breakMinutes;
    }
  } else {
    const endFirst = parseMinutes(cleaned[0].endTime);
    let startSecond = parseMinutes(cleaned[1].startTime);
    if (startSecond <= endFirst) startSecond += 24 * 60;
    const gap = startSecond - endFirst;
    if (gap > maxSplitGapHours * 60) {
      alerts.push({
        type: 'split_gap',
        message: `Coupure de ${formatHours(gap / 60)} (max ${formatHours(maxSplitGapHours)})`
      });
    }
    durations.forEach((duration) => {
      if (duration > breakThreshold) {
        deducted += breakMinutes;
        paidMinutes -= breakMinutes;
      }
    });
  }

  const paidHours = Math.max(0, paidMinutes / 60);
  const nightHours = cleaned.reduce((sum, shift) => (
    sum + minutesInNight(shift.startTime, shift.endTime, settings.nightStart, settings.nightEnd) / 60
  ), 0);

  if (paidHours >= maxDayHours) {
    alerts.push({
      type: 'max_day',
      message: `Journée de ${formatHours(paidHours)} (seuil ${formatHours(maxDayHours)})`
    });
  }

  return {
    paidHours: Math.round(paidHours * 100) / 100,
    nightHours: Math.round(nightHours * 100) / 100,
    deductedBreakMinutes: deducted,
    alerts
  };
}

function emptyDay(day, date) {
  return {
    day,
    date,
    kind: 'empty',
    code: '',
    shifts: [],
    volumeHours: 0,
    paidHours: 0,
    nightHours: 0,
    sickDays: 0,
    sickHours: 0,
    cpHours: 0,
    absenceHours: 0,
    holidayHours: 0,
    deductedBreakMinutes: 0,
    alerts: []
  };
}

function findWord(settings, code) {
  if (!code) return null;
  const needle = String(code).trim().toUpperCase();
  return (settings.words || []).find((word) => String(word.code).trim().toUpperCase() === needle) || null;
}

function computeDay(input, dayMeta, settings) {
  const base = emptyDay(dayMeta.day, dayMeta.date);
  const kind = input?.kind || 'empty';

  if (kind === 'code') {
    const word = findWord(settings, input.code);
    if (!word) {
      return {
        ...base,
        kind: 'code',
        code: input.code || '',
        alerts: [{ type: 'unknown_code', message: `Mot inconnu : ${input.code || ''}` }]
      };
    }
    const hours = Number(word.hours) || 0;
    const countsInTotal = word.countsInTotal === true;
    const category = word.category || 'autre';
    return {
      ...base,
      kind: 'code',
      code: word.code,
      paidHours: countsInTotal ? hours : 0,
      sickDays: word.countsAsSick ? 1 : 0,
      sickHours: word.countsAsSick ? hours : 0,
      cpHours: category === 'cp' ? hours : 0,
      absenceHours: category === 'absence' ? hours : 0,
      holidayHours: category === 'ferie' ? hours : 0
    };
  }

  if (kind === 'hours') {
    const volumeHours = Math.max(0, Number(input.volumeHours) || 0);
    const maxDayHours = settings.maxDayHours ?? 10;
    return {
      ...base,
      kind: 'hours',
      volumeHours,
      paidHours: volumeHours,
      alerts: volumeHours >= maxDayHours
        ? [{ type: 'max_day', message: `Journée de ${formatHours(volumeHours)} (seuil ${formatHours(maxDayHours)})` }]
        : []
    };
  }

  if (kind === 'shifts') {
    const shifts = normalizeShifts(input.shifts);
    const computed = computeShifts(shifts, settings);
    return {
      ...base,
      kind: shifts.length ? 'shifts' : 'empty',
      shifts,
      paidHours: computed.paidHours,
      nightHours: computed.nightHours,
      deductedBreakMinutes: computed.deductedBreakMinutes,
      alerts: computed.alerts
    };
  }

  return base;
}

function dayEndInfo(day) {
  if (day.kind !== 'shifts' || !day.shifts?.length) return null;
  const last = normalizeShifts(day.shifts).slice(-1)[0];
  if (!last) return null;
  const start = parseMinutes(last.startTime);
  const end = parseMinutes(last.endTime);
  if (start == null || end == null) return null;
  return { end, overnight: end <= start };
}

function dayStartMinutes(day) {
  if (day.kind !== 'shifts' || !day.shifts?.length) return null;
  const first = normalizeShifts(day.shifts)[0];
  return first ? parseMinutes(first.startTime) : null;
}

function restHoursBetween(prevDay, nextDay) {
  const prev = dayEndInfo(prevDay);
  const nextStart = dayStartMinutes(nextDay);
  if (!prev || nextStart == null) return null;
  if (prev.overnight) return (nextStart - prev.end) / 60;
  return ((24 * 60) - prev.end + nextStart) / 60;
}

function applyRestAlerts(days, settings) {
  const minRest = settings.minRestHours ?? 11;
  const next = days.map((day) => ({
    ...day,
    alerts: (day.alerts || []).filter((alert) => alert.type !== 'min_rest')
  }));

  for (let i = 1; i < next.length; i += 1) {
    const rest = restHoursBetween(next[i - 1], next[i]);
    if (rest == null) continue;
    if (rest + 1e-6 < minRest) {
      next[i] = {
        ...next[i],
        alerts: [
          ...next[i].alerts,
          {
            type: 'min_rest',
            message: `Repos ${formatHours(rest)} avant la prise de poste (mini ${formatHours(minRest)})`
          }
        ]
      };
    }
  }
  return next;
}

function overtimeFromPaid(paidHours, settings) {
  const from25 = settings.ot25FromHour ?? 36;
  const to25 = settings.ot25ToHour ?? 43;
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

function summarizeDays(days, contractedHours, settings) {
  const withRest = applyRestAlerts(days, settings);
  const weeklyPaidHours = Math.round(withRest.reduce((sum, day) => sum + (day.paidHours || 0), 0) * 100) / 100;
  const weeklyNightHours = Math.round(withRest.reduce((sum, day) => sum + (day.nightHours || 0), 0) * 100) / 100;
  const weeklySickDays = withRest.reduce((sum, day) => sum + (day.sickDays || 0), 0);
  const weeklySickHours = Math.round(withRest.reduce((sum, day) => sum + (day.sickHours || 0), 0) * 100) / 100;
  const weeklyCpHours = Math.round(withRest.reduce((sum, day) => sum + (day.cpHours || 0), 0) * 100) / 100;
  const weeklyAbsenceHours = Math.round(withRest.reduce((sum, day) => sum + (day.absenceHours || 0), 0) * 100) / 100;
  const weeklyHolidayHours = Math.round(withRest.reduce((sum, day) => sum + (day.holidayHours || 0), 0) * 100) / 100;
  const overtime = overtimeFromPaid(weeklyPaidHours, settings);
  const alertCount = withRest.reduce((sum, day) => sum + (day.alerts?.length || 0), 0);

  return {
    days: withRest,
    weeklyPaidHours,
    weeklyNightHours,
    weeklySickDays,
    weeklySickHours,
    weeklyCpHours,
    weeklyAbsenceHours,
    weeklyHolidayHours,
    weeklyOt25: overtime.ot25,
    weeklyOt50: overtime.ot50,
    contractedHours: Number(contractedHours) || 0,
    alertCount
  };
}

function defaultWords() {
  return [
    { code: 'REPOS', hours: 0, category: 'repos', countsInTotal: false, countsAsSick: false },
    { code: 'CFA', hours: 7, category: 'formation', countsInTotal: true, countsAsSick: false },
    { code: 'CFA8', hours: 8, category: 'formation', countsInTotal: true, countsAsSick: false },
    { code: 'CP', hours: 7, category: 'cp', countsInTotal: false, countsAsSick: false },
    { code: 'MAL', hours: 0, category: 'maladie', countsInTotal: false, countsAsSick: true },
    { code: 'ABS', hours: 0, category: 'absence', countsInTotal: false, countsAsSick: false },
    { code: 'FERIE', hours: 7, category: 'ferie', countsInTotal: false, countsAsSick: false }
  ];
}

function defaultSettings() {
  return {
    sundayOpen: false,
    breakThresholdHours: 5,
    breakMinutes: 30,
    maxDayHours: 10,
    minRestHours: 11,
    maxSplitGapHours: 3,
    nightStart: '21:00',
    nightEnd: '06:00',
    ot25FromHour: 36,
    ot25ToHour: 43,
    ot50FromHour: 44,
    defaultCfaCode: 'CFA8',
    words: defaultWords()
  };
}

module.exports = {
  DAYS,
  parseMinutes,
  formatHours,
  getISOWeekInfo,
  getMondayOfISOWeek,
  addIsoWeeks,
  weekDates,
  normalizeShifts,
  computeDay,
  emptyDay,
  findWord,
  applyRestAlerts,
  summarizeDays,
  overtimeFromPaid,
  defaultSettings,
  defaultWords
};
