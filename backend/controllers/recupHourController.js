const mongoose = require('mongoose');
const RecupHour = require('../models/RecupHour');
const Employee = require('../models/Employee');

const getMonday = (date) => {
  const result = new Date(date);
  const day = result.getDay() || 7;
  if (day !== 1) {
    result.setDate(result.getDate() - (day - 1));
  }
  result.setHours(0, 0, 0, 0);
  return result;
};

const parseWeekStart = (value) => {
  if (!value) {
    return getMonday(new Date());
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return getMonday(new Date());
  }

  return getMonday(parsed);
};

exports.getRecupHours = async (req, res) => {
  try {
    const weekStart = parseWeekStart(req.query.weekStart);

    const [employees, weekEntries, totals] = await Promise.all([
      Employee.find({ isActive: true }).sort({ name: 1 }),
      RecupHour.find({ weekStart }),
      RecupHour.aggregate([
        {
          $group: {
            _id: '$employeeId',
            totalHours: { $sum: '$hours' }
          }
        }
      ])
    ]);

    const entriesMap = new Map(
      weekEntries.map((entry) => [entry.employeeId.toString(), entry])
    );

    const totalsMap = new Map(
      totals.map((item) => [item._id.toString(), item.totalHours])
    );

    const result = employees.map((employee) => {
      const entry = entriesMap.get(employee._id.toString());
      const total = totalsMap.get(employee._id.toString()) || 0;

      return {
        employeeId: employee._id,
        employeeName: employee.name,
        role: employee.role,
        weekHours: entry ? entry.hours : 0,
        totalHours: total,
        comment: entry?.comment || ''
      };
    });

    res.json({
      success: true,
      data: {
        weekStart: weekStart.toISOString(),
        employees: result
      }
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des heures de récup:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des heures de récup'
    });
  }
};

exports.saveRecupHours = async (req, res) => {
  try {
    const { weekStart: weekStartInput, entries } = req.body;

    if (!entries || !Array.isArray(entries)) {
      return res.status(400).json({
        success: false,
        error: 'La liste des heures est requise'
      });
    }

    const weekStart = parseWeekStart(weekStartInput);

    const operations = entries.map((entry) => {
      const hours = Number.parseFloat(entry.hours);
      const comment =
        typeof entry.comment === 'string' ? entry.comment.trim().slice(0, 500) : '';

      return {
        updateOne: {
          filter: {
            employeeId: entry.employeeId,
            weekStart
          },
          update: {
            $set: {
              hours: Number.isNaN(hours) ? 0 : hours,
              comment,
              updatedBy: req.user?.id || null
            }
          },
          upsert: true
        }
      };
    });

    if (operations.length > 0) {
      await RecupHour.bulkWrite(operations);
    }

    res.json({
      success: true,
      message: 'Heures de récup sauvegardées avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde des heures de récup:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la sauvegarde des heures de récup'
    });
  }
};

exports.getRecupHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        success: false,
        error: 'Identifiant salarié invalide'
      });
    }

    const employee = await Employee.findById(employeeId).select('name role');

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Salarié introuvable'
      });
    }

    const entries = await RecupHour.find({
      employeeId,
      hours: { $ne: 0 }
    })
      .sort({ weekStart: -1 })
      .lean();

    const totalHours = entries.reduce((sum, entry) => sum + (entry.hours || 0), 0);

    res.json({
      success: true,
      data: {
        employee: {
          id: employee._id,
          name: employee.name,
          role: employee.role
        },
        totalHours,
        entries: entries.map((entry) => ({
          weekStart: entry.weekStart ? entry.weekStart.toISOString() : null,
          hours: entry.hours || 0,
          comment: entry.comment || '',
          updatedAt: entry.updatedAt ? entry.updatedAt.toISOString() : null,
          createdAt: entry.createdAt ? entry.createdAt.toISOString() : null
        }))
      }
    });
  } catch (error) {
    console.error('❌ Erreur historique heures de récup:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération de l’historique'
    });
  }
};


