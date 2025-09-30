const mongoose = require('mongoose');

const ticketRestaurantSchema = new mongoose.Schema({
  provider: {
    type: String,
    required: true,
    enum: ['up', 'pluxee', 'bimpli', 'edenred']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true
  },
  month: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}$/ // Format YYYY-MM
  },
  barcode: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index pour optimiser les requêtes par mois et fournisseur
ticketRestaurantSchema.index({ month: 1, provider: 1 });
ticketRestaurantSchema.index({ date: 1 });

module.exports = mongoose.model('TicketRestaurant', ticketRestaurantSchema);

