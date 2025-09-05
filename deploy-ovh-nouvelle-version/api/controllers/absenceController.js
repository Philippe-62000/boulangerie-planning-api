const Absence = require('../models/Absence');
const Employee = require('../models/Employee');

// Déclarer une absence
exports.declareAbsence = async (req, res) => {
  try {
    const { employeeId, type, startDate, endDate, reason } = req.body;

    // Vérifier que l'employé existe
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }

    // Créer l'absence
    const absence = new Absence({
      employeeId,
      employeeName: employee.name,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason
    });

    await absence.save();

    res.status(201).json({
      message: 'Absence déclarée avec succès',
      absence
    });
  } catch (error) {
    console.error('Erreur lors de la déclaration d\'absence:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtenir les statistiques d'absences
exports.getAbsenceStats = async (req, res) => {
  try {
    const { period, startDate, endDate, employeeId } = req.query;

    let query = {};
    let groupBy = {};

    // Filtrer par employé si spécifié
    if (employeeId) {
      query.employeeId = employeeId;
    }

    // Filtrer par période
    if (startDate && endDate) {
      query.startDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Agrégation pour les statistiques
    const stats = await Absence.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            employeeId: '$employeeId',
            employeeName: '$employeeName',
            type: '$type'
          },
          count: { $sum: 1 },
          totalDays: {
            $sum: {
              $ceil: {
                $divide: [
                  { $subtract: ['$endDate', '$startDate'] },
                  1000 * 60 * 60 * 24
                ]
              }
            }
          }
        }
      },
      {
        $group: {
          _id: {
            employeeId: '$_id.employeeId',
            employeeName: '$_id.employeeName'
          },
          absences: {
            $push: {
              type: '$_id.type',
              count: '$count',
              totalDays: '$totalDays'
            }
          },
          totalAbsences: { $sum: '$count' },
          totalDays: { $sum: '$totalDays' }
        }
      },
      {
        $project: {
          employeeId: '$_id.employeeId',
          employeeName: '$_id.employeeName',
          absences: 1,
          totalAbsences: 1,
          totalDays: 1,
          malCount: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$absences',
                    cond: { $eq: ['$$this.type', 'MAL'] }
                  }
                },
                as: 'mal',
                in: '$$mal.count'
              }
            }
          },
          absCount: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$absences',
                    cond: { $eq: ['$$this.type', 'ABS'] }
                  }
                },
                as: 'abs',
                in: '$$abs.count'
              }
            }
          },
          retCount: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$absences',
                    cond: { $eq: ['$$this.type', 'RET'] }
                  }
                },
                as: 'ret',
                in: '$$ret.count'
              }
            }
          }
        }
      },
      { $sort: { employeeName: 1 } }
    ]);

    // Calculer les totaux globaux
    const globalTotals = stats.reduce((acc, stat) => {
      acc.totalMal += stat.malCount || 0;
      acc.totalAbs += stat.absCount || 0;
      acc.totalRet += stat.retCount || 0;
      acc.totalAbsences += stat.totalAbsences || 0;
      acc.totalDays += stat.totalDays || 0;
      return acc;
    }, {
      totalMal: 0,
      totalAbs: 0,
      totalRet: 0,
      totalAbsences: 0,
      totalDays: 0
    });

    res.json({
      stats,
      globalTotals,
      period: { startDate, endDate, employeeId }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtenir toutes les absences
exports.getAllAbsences = async (req, res) => {
  try {
    const absences = await Absence.find()
      .populate('employeeId', 'name role')
      .sort({ startDate: -1 });

    res.json(absences);
  } catch (error) {
    console.error('Erreur lors de la récupération des absences:', error);
    res.status(500).json({ error: error.message });
  }
};

// Supprimer une absence
exports.deleteAbsence = async (req, res) => {
  try {
    const { id } = req.params;

    const absence = await Absence.findByIdAndDelete(id);
    if (!absence) {
      return res.status(404).json({ error: 'Absence non trouvée' });
    }

    res.json({ message: 'Absence supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'absence:', error);
    res.status(500).json({ error: error.message });
  }
};



