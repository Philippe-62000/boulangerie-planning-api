const EmployeeMessage = require('../models/EmployeeMessage');
const Employee = require('../models/Employee');

const normalizeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

exports.createMessage = async (req, res) => {
  try {
    const {
      title,
      content,
      startDate,
      endDate,
      untilRead,
      recipientsType,
      selectedEmployeeIds = [],
      createdBy
    } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Le contenu du message est requis'
      });
    }

    const normalizedStartDate = normalizeDate(startDate) || new Date();
    const normalizedEndDate = normalizeDate(endDate);

    const message = new EmployeeMessage({
      title: title?.trim() || 'Information',
      content: content.trim(),
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
      untilRead: !!untilRead,
      recipientsType: recipientsType === 'selected' ? 'selected' : 'all',
      selectedEmployees: recipientsType === 'selected' ? selectedEmployeeIds : [],
      createdBy: createdBy?.trim() || 'Administrateur'
    });

    await message.save();

    res.json({
      success: true,
      message: 'Message enregistré',
      data: message
    });
  } catch (error) {
    console.error('❌ Erreur création message salariés:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du message',
      error: error.message
    });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const now = new Date();
    const includeExpired = req.query.includeExpired === 'true';

    const filter = includeExpired
      ? {}
      : {
          $or: [
            { endDate: null },
            { endDate: { $gte: now } }
          ]
        };

    const messages = await EmployeeMessage.find(filter)
      .sort({ startDate: -1, createdAt: -1 })
      .populate('selectedEmployees', 'name saleCode role');

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('❌ Erreur récupération messages salariés:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des messages',
      error: error.message
    });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    await EmployeeMessage.findByIdAndDelete(id);
    res.json({
      success: true,
      message: 'Message supprimé'
    });
  } catch (error) {
    console.error('❌ Erreur suppression message salarié:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du message',
      error: error.message
    });
  }
};

exports.getPublicMessages = async (req, res) => {
  try {
    const { saleCode } = req.query;
    const now = new Date();

    if (!saleCode) {
      return res.status(400).json({
        success: false,
        message: 'Code vendeuse requis'
      });
    }

    const employee = await Employee.findOne({ saleCode, isActive: true }).select('_id name role saleCode');
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Vendeuse non trouvée ou inactive'
      });
    }

    const messages = await EmployeeMessage.find({
      startDate: { $lte: now },
      $and: [
        {
          $or: [
            { endDate: null },
            { endDate: { $gte: now } }
          ]
        },
        {
          $or: [
            { recipientsType: 'all' },
            { recipientsType: 'selected', selectedEmployees: employee._id }
          ]
        }
      ]
    }).sort({ startDate: -1, createdAt: -1 });

    res.json({
      success: true,
      data: {
        employee,
        messages: messages.map((msg) => ({
          id: msg._id,
          title: msg.title,
          content: msg.content,
          startDate: msg.startDate,
          endDate: msg.endDate,
          untilRead: msg.untilRead
        }))
      }
    });
  } catch (error) {
    console.error('❌ Erreur récupération messages publics:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des messages',
      error: error.message
    });
  }
};

