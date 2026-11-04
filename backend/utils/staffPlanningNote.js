const MAX_PLANNING_NOTE = 2000;

function sanitizePlanningNote(value) {
  return String(value == null ? '' : value)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim()
    .slice(0, MAX_PLANNING_NOTE);
}

module.exports = {
  MAX_PLANNING_NOTE,
  sanitizePlanningNote
};
