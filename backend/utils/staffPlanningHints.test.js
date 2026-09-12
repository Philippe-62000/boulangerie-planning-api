const assert = require('assert');

function isRestDay(day) {
  return day && day.kind === 'code' && String(day.code || '').toUpperCase() === 'REPOS';
}

function isOffDay(day) {
  const code = String(day?.code || '').toUpperCase();
  return day?.kind === 'code' && (code === 'REPOS' || code === 'CP' || code === 'MAL' || code === 'ABS');
}

function computePlanningHints(prevDays = [], currentDays = []) {
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

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const prevDates = ['2026-08-24', '2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28', '2026-08-29', '2026-08-30'];
const currentDates = ['2026-08-31', '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05', '2026-09-06'];

const prev = DAYS.map((day, index) => ({
  day,
  date: prevDates[index],
  kind: day === 'Mardi' || day === 'Dimanche' ? 'code' : 'shifts',
  code: day === 'Mardi' || day === 'Dimanche' ? 'REPOS' : ''
}));
const current = DAYS.map((day, index) => ({
  day,
  date: currentDates[index],
  kind: 'empty',
  code: ''
}));

const hints = computePlanningHints(prev, current);
assert.deepStrictEqual([...hints.prevRestWeekdays].sort(), ['Dimanche', 'Mardi']);
assert.ok(hints.seventhDates.has('2026-09-06'), 'dimanche = 7e jour après le repos du dimanche précédent');
assert.ok(!hints.seventhDates.has('2026-09-01'), 'mardi n’est pas le 7e jour car un repos a eu lieu dimanche');

console.log('staff planning hints tests OK');
