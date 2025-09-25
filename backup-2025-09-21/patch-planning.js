// PATCH POUR PLANNING.JS
// Appliquer ces modifications manuellement

// 1. AJOUTER les fonctions utilitaires (après getWeekNumber)
const getDayDate = (weekNumber, year, dayIndex) => {
  const firstDayOfWeek = new Date(year, 0, 1);
  const dayOfWeek = firstDayOfWeek.getDay();
  const daysSinceStartOfYear = Math.floor((weekNumber - 1) * 7) + dayIndex;
  const date = new Date(firstDayOfWeek);
  date.setDate(firstDayOfWeek.getDate() + daysSinceStartOfYear);
  return `${date.getDate()}/${date.getMonth() + 1}`;
};

const getShiftType = (shift) => {
  const startHour = parseInt(shift.startTime.split(':')[0]);
  if (startHour <= 7) return 'Ouverture';
  if (startHour >= 16) return 'Fermeture';
  return 'Standard';
};

const getShiftColor = (shiftType) => {
  switch (shiftType) {
    case 'Ouverture':
      return '#28a745'; // Vert pour ouverture
    case 'Fermeture':
      return '#dc3545'; // Rouge pour fermeture
    default:
      return '#007bff'; // Bleu pour standard
  }
};

// 2. REMPLACER l'en-tête du tableau par :
{daysOfWeek.map((day, index) => {
  const dayDate = getDayDate(weekNumber, year, index);
  return (
    <th key={day}>
      {day}<br />
      <small style={{ fontSize: '0.8rem', color: '#666' }}>
        {dayDate}
      </small>
    </th>
  );
})}

// 3. REMPLACER l'affichage des shifts par :
{daySchedule.shifts.map((shift, index) => {
  const shiftType = getShiftType(shift);
  const shiftColor = getShiftColor(shiftType);
  
  return (
    <div key={index} className="planning-shift" style={{ color: shiftColor }}>
      {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
      <br />
      <small style={{ color: shiftColor }}>
        {shiftType}
      </small>
    </div>
  );
})}

// 4. REMPLACER l'affichage des contraintes par :
<div className="planning-constraint" style={{ 
  color: daySchedule.constraint === 'MAL' ? '#dc3545' : '#666',
  fontWeight: daySchedule.constraint === 'MAL' ? 'bold' : 'normal'
}}>
  {daySchedule.constraint}
</div>

// 5. REMPLACER la colonne total semaine par :
<td style={{ fontWeight: 'bold' }}>
  {employeePlanning.schedule.reduce((total, day) => {
    return total + (day.totalHours || 0);
  }, 0).toFixed(1)}h
  <br />
  <small style={{ color: '#666' }}>
    /{employeePlanning.contractedHours}h
  </small>
</td>

