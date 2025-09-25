const mongoose = require('mongoose');

const salesStatsSchema = new mongoose.Schema({
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true,
    min: 2020,
    max: 2030
  },
  salesData: {
    type: Map,
    of: {
      caNetHt: {
        type: Number,
        default: 0,
        min: 0
      },
      nbClients: {
        type: Number,
        default: 0,
        min: 0
      },
      panierMoyen: {
        type: Number,
        default: 0,
        min: 0
      },
      nbMenus: {
        type: Number,
        default: 0,
        min: 0
      },
      nbCartesFid: {
        type: Number,
        default: 0,
        min: 0
      },
      nbAvisPositifs: {
        type: Number,
        default: 0,
        min: 0
      },
      nbAvisNegatifs: {
        type: Number,
        default: 0,
        min: 0
      }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index composé pour mois/année
salesStatsSchema.index({ month: 1, year: 1 }, { unique: true });

// Index pour les recherches par année
salesStatsSchema.index({ year: 1 });

// Méthode pour calculer le score d'un employé
salesStatsSchema.methods.calculateEmployeeScore = function(employeeId) {
  const employeeData = this.salesData.get(employeeId);
  if (!employeeData) return 0;
  
  return employeeData.caNetHt + 
         (employeeData.nbCartesFid * 500) + 
         (employeeData.nbAvisPositifs * 100) - 
         (employeeData.nbAvisNegatifs * 300);
};

// Méthode statique pour obtenir les statistiques d'une période
salesStatsSchema.statics.getStatsForPeriod = function(month, year) {
  return this.findOne({ month, year });
};

// Méthode statique pour obtenir les statistiques d'une année
salesStatsSchema.statics.getStatsForYear = function(year) {
  return this.find({ year }).sort({ month: 1 });
};

// Méthode statique pour obtenir les statistiques mensuelles agrégées
salesStatsSchema.statics.getMonthlyAggregatedStats = function(year) {
  return this.aggregate([
    { $match: { year: year } },
    { $sort: { month: 1 } },
    {
      $project: {
        month: 1,
        year: 1,
        totalCA: {
          $sum: {
            $map: {
              input: { $objectToArray: "$salesData" },
              as: "emp",
              in: "$$emp.v.caNetHt"
            }
          }
        },
        totalClients: {
          $sum: {
            $map: {
              input: { $objectToArray: "$salesData" },
              as: "emp",
              in: "$$emp.v.nbClients"
            }
          }
        },
        totalCartesFid: {
          $sum: {
            $map: {
              input: { $objectToArray: "$salesData" },
              as: "emp",
              in: "$$emp.v.nbCartesFid"
            }
          }
        },
        totalAvisPositifs: {
          $sum: {
            $map: {
              input: { $objectToArray: "$salesData" },
              as: "emp",
              in: "$$emp.v.nbAvisPositifs"
            }
          }
        },
        totalAvisNegatifs: {
          $sum: {
            $map: {
              input: { $objectToArray: "$salesData" },
              as: "emp",
              in: "$$emp.v.nbAvisNegatifs"
            }
          }
        }
      }
    }
  ]);
};

// Méthode statique pour obtenir le classement des employés pour une période
salesStatsSchema.statics.getEmployeeRanking = function(month, year) {
  return this.aggregate([
    { $match: { month, year } },
    {
      $project: {
        month: 1,
        year: 1,
        employees: {
          $map: {
            input: { $objectToArray: "$salesData" },
            as: "emp",
            in: {
              employeeId: "$$emp.k",
              name: "$$emp.k", // À remplacer par le nom réel de l'employé
              caNetHt: "$$emp.v.caNetHt",
              nbClients: "$$emp.v.nbClients",
              panierMoyen: "$$emp.v.panierMoyen",
              nbMenus: "$$emp.v.nbMenus",
              nbCartesFid: "$$emp.v.nbCartesFid",
              nbAvisPositifs: "$$emp.v.nbAvisPositifs",
              nbAvisNegatifs: "$$emp.v.nbAvisNegatifs",
              score: {
                $add: [
                  "$$emp.v.caNetHt",
                  { $multiply: ["$$emp.v.nbCartesFid", 500] },
                  { $multiply: ["$$emp.v.nbAvisPositifs", 100] },
                  { $multiply: [{ $multiply: ["$$emp.v.nbAvisNegatifs", -1] }, 300] }
                ]
              }
            }
          }
        }
      }
    },
    { $unwind: "$employees" },
    { $sort: { "employees.score": -1 } },
    {
      $project: {
        _id: 0,
        employeeId: "$employees.employeeId",
        name: "$employees.name",
        caNetHt: "$employees.caNetHt",
        nbClients: "$employees.nbClients",
        panierMoyen: "$employees.panierMoyen",
        nbMenus: "$employees.nbMenus",
        nbCartesFid: "$employees.nbCartesFid",
        nbAvisPositifs: "$employees.nbAvisPositifs",
        nbAvisNegatifs: "$employees.nbAvisNegatifs",
        score: "$employees.score"
      }
    }
  ]);
};

module.exports = mongoose.model('SalesStats', salesStatsSchema);
