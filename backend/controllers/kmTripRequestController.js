const KmTripRequest = require('../models/KmTripRequest');
const KmExpense = require('../models/KmExpense');
const Employee = require('../models/Employee');
const Parameter = require('../models/Parameters');

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const toId = (value) => (value ? String(value) : '');

const getKmParameters = async () => {
  const parameters = await Parameter.find({
    $and: [
      { kmValue: { $exists: true } },
      { kmValue: { $gte: 0 } }
    ]
  })
    .sort({ createdAt: 1 })
    .select('name displayName kmValue');
  return parameters.slice(0, 12);
};

const formatDestination = (parameter) => ({
  _id: parameter._id,
  name: parameter.name,
  displayName: parameter.displayName || parameter.name,
  kmValue: parameter.kmValue || 0
});

const monthYearFromTripDate = (tripDate) => {
  const [yearStr, monthStr] = String(tripDate).split('-');
  return {
    year: parseInt(yearStr, 10),
    month: parseInt(monthStr, 10)
  };
};

const findEmployeeFromReq = async (req) => {
  const employeeId = req.employeeId || req.user?.employeeId || req.user?.id;
  if (!employeeId || req.user?.role === 'admin') return null;
  return Employee.findById(employeeId).select('name email isActive');
};

const incrementKmExpenseCount = async (request) => {
  const { month, year } = monthYearFromTripDate(request.tripDate);
  if (!month || !year) {
    throw new Error('Date de déplacement invalide');
  }

  const kmParameters = await getKmParameters();
  let expense = await KmExpense.findOne({
    employeeId: request.employeeId,
    month,
    year
  });

  if (!expense) {
    expense = new KmExpense({
      employeeId: request.employeeId,
      employeeName: request.employeeName,
      month,
      year,
      parameterValues: kmParameters.map((parameter) => ({
        parameterId: parameter._id,
        parameterName: parameter.displayName || parameter.name,
        count: 0,
        kmValue: parameter.kmValue || 0,
        totalKm: 0
      }))
    });
  }

  if (year < 2020 || year > 2030) {
    throw new Error('L\'année du déplacement doit être entre 2020 et 2030');
  }

  const parameterId = toId(request.parameterId);
  let paramValue = expense.parameterValues.find(
    (item) => toId(item.parameterId) === parameterId
  );

  if (!paramValue) {
    expense.parameterValues.push({
      parameterId: request.parameterId,
      parameterName: request.parameterName,
      count: 1,
      kmValue: request.kmValue || 0,
      totalKm: request.kmValue || 0
    });
  } else {
    paramValue.count = (paramValue.count || 0) + 1;
    paramValue.parameterName = request.parameterName || paramValue.parameterName;
    if (typeof request.kmValue === 'number') {
      paramValue.kmValue = request.kmValue;
    }
    paramValue.totalKm = (paramValue.count || 0) * (paramValue.kmValue || 0);
  }
  expense.employeeName = request.employeeName || expense.employeeName;
  expense.markModified('parameterValues');

  await expense.save();
  return expense;
};

const getKmDestinations = async (req, res) => {
  try {
    const parameters = await getKmParameters();
    res.json({
      success: true,
      destinations: parameters.map(formatDestination)
    });
  } catch (error) {
    console.error('❌ Erreur destinations KM:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement des destinations',
      error: error.message
    });
  }
};

const createKmTripRequest = async (req, res) => {
  try {
    const employee = await findEmployeeFromReq(req);
    if (!employee) {
      return res.status(401).json({
        success: false,
        message: 'Salarié non identifié'
      });
    }
    if (employee.isActive === false) {
      return res.status(401).json({
        success: false,
        message: 'Compte salarié désactivé'
      });
    }

    const { tripDate, parameterId, remark } = req.body || {};
    if (!tripDate || !DATE_ONLY.test(String(tripDate).slice(0, 10))) {
      return res.status(400).json({
        success: false,
        message: 'Date du déplacement invalide'
      });
    }

    if (!parameterId) {
      return res.status(400).json({
        success: false,
        message: 'Destination obligatoire'
      });
    }

    const parameter = await Parameter.findById(parameterId);
    if (!parameter || parameter.kmValue == null || parameter.kmValue < 0) {
      return res.status(400).json({
        success: false,
        message: 'Destination inconnue'
      });
    }

    const request = await KmTripRequest.create({
      employeeId: employee._id,
      employeeName: employee.name,
      employeeEmail: employee.email || '',
      tripDate: String(tripDate).slice(0, 10),
      parameterId: parameter._id,
      parameterName: parameter.displayName || parameter.name,
      kmValue: parameter.kmValue || 0,
      remark: String(remark || '').trim().slice(0, 500),
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Demande de frais kilométriques envoyée',
      request
    });
  } catch (error) {
    console.error('❌ Erreur création demande KM:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi de la demande',
      error: error.message
    });
  }
};

const listMyKmTripRequests = async (req, res) => {
  try {
    const employee = await findEmployeeFromReq(req);
    if (!employee) {
      return res.status(401).json({
        success: false,
        message: 'Salarié non identifié'
      });
    }

    const requests = await KmTripRequest.find({ employeeId: employee._id })
      .sort({ tripDate: -1, createdAt: -1 })
      .limit(80);

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    console.error('❌ Erreur liste demandes KM salarié:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement des demandes',
      error: error.message
    });
  }
};

const listPendingKmTripRequests = async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const filter = status === 'all' ? {} : { status };
    const requests = await KmTripRequest.find(filter)
      .sort({ employeeName: 1, tripDate: 1, createdAt: 1 })
      .limit(400);

    const grouped = [];
    const byEmployee = new Map();
    requests.forEach((request) => {
      const key = toId(request.employeeId);
      if (!byEmployee.has(key)) {
        const group = {
          employeeId: request.employeeId,
          employeeName: request.employeeName,
          requests: []
        };
        byEmployee.set(key, group);
        grouped.push(group);
      }
      byEmployee.get(key).requests.push(request);
    });

    res.json({
      success: true,
      count: requests.length,
      requests,
      grouped
    });
  } catch (error) {
    console.error('❌ Erreur liste demandes KM admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement des demandes à valider',
      error: error.message
    });
  }
};

const getPendingKmTripCount = async (req, res) => {
  try {
    const count = await KmTripRequest.countDocuments({ status: 'pending' });
    res.json({ success: true, count });
  } catch (error) {
    console.error('❌ Erreur compteur demandes KM:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du comptage des demandes',
      error: error.message
    });
  }
};

const applyParameterToRequest = async (request, parameterId) => {
  if (!parameterId || toId(parameterId) === toId(request.parameterId)) {
    return;
  }
  const parameter = await Parameter.findById(parameterId);
  if (!parameter || parameter.kmValue == null || parameter.kmValue < 0) {
    throw new Error('Destination inconnue');
  }
  request.parameterId = parameter._id;
  request.parameterName = parameter.displayName || parameter.name;
  request.kmValue = parameter.kmValue || 0;
};

const updateKmTripRequest = async (req, res) => {
  try {
    const request = await KmTripRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Demande introuvable'
      });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Seules les demandes en attente peuvent être modifiées'
      });
    }

    const { tripDate, parameterId, remark } = req.body || {};
    if (tripDate) {
      const normalized = String(tripDate).slice(0, 10);
      if (!DATE_ONLY.test(normalized)) {
        return res.status(400).json({
          success: false,
          message: 'Date du déplacement invalide'
        });
      }
      request.tripDate = normalized;
    }
    if (parameterId) {
      await applyParameterToRequest(request, parameterId);
    }
    if (remark !== undefined) {
      request.remark = String(remark || '').trim().slice(0, 500);
    }

    await request.save();
    res.json({
      success: true,
      message: 'Demande mise à jour',
      request
    });
  } catch (error) {
    console.error('❌ Erreur modification demande KM:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la modification',
      error: error.message
    });
  }
};

const validateKmTripRequest = async (req, res) => {
  try {
    const request = await KmTripRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Demande introuvable'
      });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cette demande a déjà été traitée'
      });
    }

    const { tripDate, parameterId, remark } = req.body || {};
    if (tripDate) {
      const normalized = String(tripDate).slice(0, 10);
      if (!DATE_ONLY.test(normalized)) {
        return res.status(400).json({
          success: false,
          message: 'Date du déplacement invalide'
        });
      }
      request.tripDate = normalized;
    }
    if (parameterId) {
      await applyParameterToRequest(request, parameterId);
    }
    if (remark !== undefined) {
      request.remark = String(remark || '').trim().slice(0, 500);
    }

    await incrementKmExpenseCount(request);

    request.status = 'validated';
    request.validatedAt = new Date();
    request.validatedBy = req.user?.username || req.user?.id || 'admin';
    await request.save();

    res.json({
      success: true,
      message: 'Demande validée et reportée dans les frais KM',
      request
    });
  } catch (error) {
    console.error('❌ Erreur validation demande KM:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la validation',
      error: error.message
    });
  }
};

const rejectKmTripRequest = async (req, res) => {
  try {
    const request = await KmTripRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Demande introuvable'
      });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cette demande a déjà été traitée'
      });
    }

    request.status = 'rejected';
    request.rejectedAt = new Date();
    request.rejectedBy = req.user?.username || req.user?.id || 'admin';
    await request.save();

    res.json({
      success: true,
      message: 'Demande refusée',
      request
    });
  } catch (error) {
    console.error('❌ Erreur refus demande KM:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du refus',
      error: error.message
    });
  }
};

module.exports = {
  getKmDestinations,
  createKmTripRequest,
  listMyKmTripRequests,
  listPendingKmTripRequests,
  getPendingKmTripCount,
  updateKmTripRequest,
  validateKmTripRequest,
  rejectKmTripRequest
};
