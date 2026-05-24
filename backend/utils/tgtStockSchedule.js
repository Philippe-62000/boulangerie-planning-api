const DAY_LABELS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return startOfDay(x);
};

const normalizeSubmissionDays = (days) =>
  [...new Set((Array.isArray(days) ? days : []).map(Number).filter((d) => d >= 0 && d <= 6))].sort(
    (a, b) => a - b
  );

const findNextScheduledDay = (fromDate, submissionDays) => {
  const days = normalizeSubmissionDays(submissionDays);
  if (!days.length) return null;
  for (let offset = 1; offset <= 14; offset += 1) {
    const d = addDays(fromDate, offset);
    if (days.includes(d.getDay())) return d;
  }
  return null;
};

/** Ancre de saisie en cours : dernier jour paramétré atteint ou égal à aujourd'hui. */
const getCurrentDueWindow = (now, submissionDays) => {
  const days = normalizeSubmissionDays(submissionDays);
  if (!days.length) {
    return { dueAnchor: null, nextAnchor: null, submissionDays: days };
  }
  const today = startOfDay(now);
  for (let offset = 0; offset <= 14; offset += 1) {
    const d = addDays(today, -offset);
    if (days.includes(d.getDay())) {
      const dueAnchor = d;
      const nextAnchor = findNextScheduledDay(dueAnchor, days);
      return { dueAnchor, nextAnchor, submissionDays: days };
    }
  }
  return { dueAnchor: null, nextAnchor: null, submissionDays: days };
};

/**
 * Vert si une saisie existe dans la fenêtre [dueAnchor, nextAnchor).
 * Ex. merc.+dim. : lundi compte pour le créneau dimanche ; jeudi exige la saisie du mercredi.
 */
const isSubmissionUpToDate = (lastSubmissionAt, submissionDays, now = new Date()) => {
  const { dueAnchor, nextAnchor, submissionDays: days } = getCurrentDueWindow(now, submissionDays);
  if (!days.length) return { upToDate: true, dueAnchor, nextAnchor, reason: 'no_schedule' };
  if (!dueAnchor) return { upToDate: true, dueAnchor, nextAnchor, reason: 'no_anchor' };

  const last = lastSubmissionAt ? new Date(lastSubmissionAt) : null;
  if (!last) {
    return { upToDate: false, dueAnchor, nextAnchor, reason: 'never_submitted' };
  }

  const upToDate = last >= dueAnchor && (!nextAnchor || last < nextAnchor);
  return { upToDate, dueAnchor, nextAnchor, reason: upToDate ? 'ok' : 'overdue' };
};

const formatDayLabels = (submissionDays) =>
  normalizeSubmissionDays(submissionDays).map((d) => DAY_LABELS[d]).join(', ');

module.exports = {
  DAY_LABELS,
  normalizeSubmissionDays,
  getCurrentDueWindow,
  isSubmissionUpToDate,
  formatDayLabels
};
