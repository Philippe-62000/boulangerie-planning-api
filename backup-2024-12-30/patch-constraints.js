// PATCH POUR CONSTRAINTS.JS
// Appliquer ces modifications manuellement

// 1. AJOUTER L'ÉTAT sixDayWorkers (après la ligne 15)
const [sixDayWorkers, setSixDayWorkers] = useState({});

// 2. REMPLACER la fonction applySixDaysWork complète par :
const applySixDaysWork = (employeeId) => {
  setSixDayWorkers(prev => ({
    ...prev,
    [employeeId]: !prev[employeeId]
  }));

  setConstraints(prev => {
    const updated = { ...prev };
    if (!updated[employeeId]) {
      updated[employeeId] = {};
    }
    
    if (sixDayWorkers[employeeId]) {
      // Désactiver 6j/7 - remettre toutes les contraintes
      daysOfWeek.forEach(day => {
        updated[employeeId][day] = '';
      });
      toast.success('6j/7 désactivé pour cet employé');
    } else {
      // Activer 6j/7 - forcer 1 jour de repos
      daysOfWeek.forEach(day => {
        updated[employeeId][day] = '';
      });
      
      // Choisir un jour de repos (généralement le dimanche)
      const restDay = 'Dimanche';
      updated[employeeId][restDay] = 'Repos';
      toast.success('6 jours de travail appliqués (1 jour de repos)');
    }
    
    return updated;
  });
};

// 3. REMPLACER le bouton 6j/7 par :
<button
  className={`btn btn-info ${sixDayWorkers[employee._id] ? 'active' : ''}`}
  onClick={() => applySixDaysWork(employee._id)}
  style={{ 
    fontSize: '0.7rem', 
    padding: '0.25rem 0.5rem', 
    marginTop: '0.25rem',
    backgroundColor: sixDayWorkers[employee._id] ? '#17a2b8' : '#6c757d',
    color: 'white'
  }}
  title={sixDayWorkers[employee._id] ? "Désactiver 6j/7" : "Appliquer 6 jours de travail (1 jour de repos)"}
>
  {sixDayWorkers[employee._id] ? '✅ 6j/7' : '📅 6j/7'}
</button>

