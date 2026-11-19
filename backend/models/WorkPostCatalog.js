const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  detail: { type: String, default: '' },
  group: { type: String, default: '' },
  groupLabel: { type: String, default: '' },
  weekly: { type: Boolean, default: false },
  visible: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { _id: false });

const menuSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  hint: { type: String, default: '' },
  visible: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  items: { type: [itemSchema], default: [] }
}, { _id: false });

const roleSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  visible: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  menus: { type: [menuSchema], default: [] }
}, { _id: false });

const workPostCatalogSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'default' },
  roles: { type: [roleSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('WorkPostCatalog', workPostCatalogSchema);
