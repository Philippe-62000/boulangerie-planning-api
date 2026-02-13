const express = require('express');
const router = express.Router();
const TicketRestaurant = require('../models/TicketRestaurant');

// GET /api/ticket-restaurant - Récupérer les tickets d'un mois
router.get('/', async (req, res) => {
  try {
    const { month } = req.query;
    
    if (!month) {
      return res.status(400).json({
        success: false,
        error: 'Le paramètre month est requis (format: YYYY-MM)'
      });
    }

    // Validation du format du mois
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        error: 'Format de mois invalide. Utilisez YYYY-MM'
      });
    }

    const tickets = await TicketRestaurant.find({ month }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      tickets,
      month
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des tickets:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des tickets'
    });
  }
});

// POST /api/ticket-restaurant - Ajouter un nouveau ticket
router.post('/', async (req, res) => {
  try {
    const { provider, amount, date, month, barcode, forceDuplicate } = req.body;
    
    console.log('📤 Données reçues:', { provider, amount, date, month, barcode });
    
    // Validation des données
    if (!provider || !amount || !date || !month || !barcode) {
      console.log('❌ Champs manquants:', { provider: !!provider, amount: !!amount, date: !!date, month: !!month, barcode: !!barcode });
      return res.status(400).json({
        success: false,
        error: 'Tous les champs sont requis (provider, amount, date, month, barcode)'
      });
    }

    if (!['up', 'pluxee', 'bimpli', 'edenred'].includes(provider)) {
      return res.status(400).json({
        success: false,
        error: 'Fournisseur invalide. Utilisez: up, pluxee, bimpli, edenred'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Le montant doit être positif'
      });
    }

    // Vérifier si le ticket existe déjà (même code-barres) - sauf si forceDuplicate
    if (!forceDuplicate) {
      console.log('🔍 Vérification ticket existant pour barcode:', barcode);
      const existingTicket = await TicketRestaurant.findOne({ barcode });
      if (existingTicket) {
        console.log('⚠️ Ticket déjà existant (doublon détecté):', existingTicket._id);
        return res.status(409).json({
          success: false,
          duplicate: true,
          error: 'Ce ticket a déjà été scanné'
        });
      }
    } else {
      console.log('⚠️ Ajout forcé (doublon accepté par l\'utilisateur)');
    }
    console.log('✅ Création du ticket autorisée');

    const ticket = new TicketRestaurant({
      provider,
      amount,
      date: new Date(date),
      month,
      barcode
    });

    await ticket.save();
    
    console.log(`✅ Ticket ${provider.toUpperCase()} ajouté: ${amount}€`);
    
    res.status(201).json({
      success: true,
      ticket,
      message: `Ticket ${provider.toUpperCase()} ajouté avec succès`
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout du ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'ajout du ticket'
    });
  }
});

// DELETE /api/ticket-restaurant/:id - Supprimer un ticket
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const ticket = await TicketRestaurant.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket non trouvé'
      });
    }

    await TicketRestaurant.findByIdAndDelete(id);
    
    console.log(`🗑️ Ticket supprimé: ${ticket.provider.toUpperCase()} - ${ticket.amount}€`);
    
    res.json({
      success: true,
      message: 'Ticket supprimé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression du ticket'
    });
  }
});

// GET /api/ticket-restaurant/stats/:month - Statistiques d'un mois
router.get('/stats/:month', async (req, res) => {
  try {
    const { month } = req.params;
    
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        error: 'Format de mois invalide. Utilisez YYYY-MM'
      });
    }

    const tickets = await TicketRestaurant.find({ month });
    
    // Calculer les statistiques par fournisseur
    const stats = {
      up: { count: 0, amount: 0 },
      pluxee: { count: 0, amount: 0 },
      bimpli: { count: 0, amount: 0 },
      edenred: { count: 0, amount: 0 },
      total: { count: 0, amount: 0 }
    };

    tickets.forEach(ticket => {
      if (stats[ticket.provider]) {
        stats[ticket.provider].count++;
        stats[ticket.provider].amount += ticket.amount;
      }
      stats.total.count++;
      stats.total.amount += ticket.amount;
    });

    res.json({
      success: true,
      month,
      stats,
      tickets: tickets.length
    });
  } catch (error) {
    console.error('❌ Erreur lors du calcul des statistiques:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du calcul des statistiques'
    });
  }
});

module.exports = router;



