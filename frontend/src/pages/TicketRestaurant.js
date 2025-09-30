import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import './TicketRestaurant.css';

const TicketRestaurant = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7)); // Format YYYY-MM
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('up');
  const [scanning, setScanning] = useState(false);

  // États pour les totaux
  const [totals, setTotals] = useState({
    up: { count: 0, amount: 0 },
    pluxee: { count: 0, amount: 0 },
    bimpli: { count: 0, amount: 0 },
    edenred: { count: 0, amount: 0 },
    total: { count: 0, amount: 0 }
  });

  useEffect(() => {
    loadTickets();
  }, [currentMonth]);

  useEffect(() => {
    calculateTotals();
  }, [tickets]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/ticket-restaurant?month=${currentMonth}`);
      setTickets(response.data.tickets || []);
    } catch (error) {
      console.error('Erreur lors du chargement des tickets:', error);
      toast.error('Erreur lors du chargement des tickets');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const newTotals = {
      up: { count: 0, amount: 0 },
      pluxee: { count: 0, amount: 0 },
      bimpli: { count: 0, amount: 0 },
      edenred: { count: 0, amount: 0 },
      total: { count: 0, amount: 0 }
    };

    tickets.forEach(ticket => {
      if (newTotals[ticket.provider]) {
        newTotals[ticket.provider].count++;
        newTotals[ticket.provider].amount += ticket.amount;
      }
      newTotals.total.count++;
      newTotals.total.amount += ticket.amount;
    });

    setTotals(newTotals);
  };

  const handleScanTicket = async (scannedData) => {
    try {
      setScanning(true);
      
      // Simulation de l'extraction du montant depuis le code-barres
      const amount = extractAmountFromBarcode(scannedData);
      
      if (!amount) {
        toast.error('Impossible d\'extraire le montant du ticket');
        return;
      }

      const ticketData = {
        provider: selectedProvider,
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        month: currentMonth,
        barcode: scannedData
      };

      await api.post('/ticket-restaurant', ticketData);
      toast.success(`Ticket ${selectedProvider.toUpperCase()} ajouté: ${amount}€`);
      
      // Recharger les tickets
      await loadTickets();
      
    } catch (error) {
      console.error('Erreur lors de l\'ajout du ticket:', error);
      toast.error('Erreur lors de l\'ajout du ticket');
    } finally {
      setScanning(false);
    }
  };

  const extractAmountFromBarcode = (barcode) => {
    console.log('🔍 Code-barres scanné:', barcode);
    
    // Extraction du montant depuis le code-barres
    // Format des codes-barres fournis :
    // 041222212300070028300005 → 7€ (positions 12-13: 07)
    // 045906168640115220700005 → 11,52€ (positions 12-15: 1152)
    
    if (!barcode || barcode.length < 15) {
      console.warn('⚠️ Code-barres trop court:', barcode);
      return null;
    }
    
    try {
      // Extraire les 4 derniers chiffres avant les 5 derniers
      const amountString = barcode.substring(12, 16);
      console.log('🔍 Chaîne de montant extraite:', amountString);
      
      // Convertir en montant (diviser par 100 pour avoir les euros)
      const amount = parseInt(amountString) / 100;
      
      console.log('💰 Montant extrait:', amount, '€');
      
      // Vérifier que le montant est valide (entre 0.01€ et 50€)
      if (amount < 0.01 || amount > 50) {
        console.warn('⚠️ Montant invalide:', amount);
        return null;
      }
      
      return Math.round(amount * 100) / 100; // Arrondir à 2 décimales
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'extraction du montant:', error);
      return null;
    }
  };

  const removeTicket = async (ticketId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce ticket ?')) {
      return;
    }

    try {
      await api.delete(`/ticket-restaurant/${ticketId}`);
      toast.success('Ticket supprimé');
      await loadTickets();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression du ticket');
    }
  };

  const startScanner = () => {
    setScannerActive(true);
    // Ici, on pourrait intégrer une vraie API de scanner de code-barres
    // Pour l'instant, on simule avec un input
  };

  const stopScanner = () => {
    setScannerActive(false);
  };

  const simulateScan = () => {
    // Simuler un vrai code-barres de ticket restaurant
    const testBarcodes = [
      '041222212300070028300005', // 7€
      '045906168640115220700005'  // 11,52€
    ];
    
    const randomBarcode = testBarcodes[Math.floor(Math.random() * testBarcodes.length)];
    console.log('🧪 Simulation avec code-barres:', randomBarcode);
    handleScanTicket(randomBarcode);
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getProviderLabel = (provider) => {
    const labels = {
      up: 'UP',
      pluxee: 'Pluxee',
      bimpli: 'Bimpli',
      edenred: 'Edenred'
    };
    return labels[provider] || provider.toUpperCase();
  };

  const getProviderColor = (provider) => {
    const colors = {
      up: '#e74c3c',
      pluxee: '#3498db',
      bimpli: '#2ecc71',
      edenred: '#f39c12'
    };
    return colors[provider] || '#95a5a6';
  };

  return (
    <div className="ticket-restaurant fade-in">
      <div className="page-header">
        <h2>🎫 Gestion des Tickets Restaurant</h2>
        <div className="header-actions">
          <div className="month-selector">
            <label htmlFor="month">Mois :</label>
            <input
              type="month"
              id="month"
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
              className="form-control"
            />
          </div>
        </div>
      </div>

      {/* Scanner Section */}
      <div className="card">
        <div className="card-header">
          <h3>📱 Scanner des Tickets</h3>
        </div>
        <div className="card-body">
          <div className="scanner-controls">
            <div className="provider-selector">
              <label>Fournisseur :</label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="form-control"
                disabled={scannerActive}
              >
                <option value="up">UP</option>
                <option value="pluxee">Pluxee</option>
                <option value="bimpli">Bimpli</option>
                <option value="edenred">Edenred</option>
              </select>
            </div>
            
            {!scannerActive ? (
              <button 
                className="btn btn-primary"
                onClick={startScanner}
                disabled={scanning}
              >
                {scanning ? '⏳ Traitement...' : '📱 Démarrer le scanner'}
              </button>
            ) : (
              <div className="scanner-active">
                <div className="scanner-status">
                  <div className="scanner-indicator"></div>
                  <span>Scanner actif - Pointez vers le code-barres</span>
                </div>
                <button 
                  className="btn btn-secondary"
                  onClick={stopScanner}
                >
                  Arrêter le scanner
                </button>
                <button 
                  className="btn btn-success"
                  onClick={simulateScan}
                  disabled={scanning}
                >
                  {scanning ? '⏳ Ajout...' : '✅ Simuler scan'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Totaux par fournisseur */}
      <div className="totals-grid">
        {Object.entries(totals).map(([provider, data]) => {
          if (provider === 'total') return null;
          return (
            <div key={provider} className="total-card" style={{ borderColor: getProviderColor(provider) }}>
              <div className="total-header">
                <h4 style={{ color: getProviderColor(provider) }}>
                  {getProviderLabel(provider)}
                </h4>
              </div>
              <div className="total-content">
                <div className="total-count">
                  <span className="count-number">{data.count}</span>
                  <span className="count-label">tickets</span>
                </div>
                <div className="total-amount">
                  {formatAmount(data.amount)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total général */}
      <div className="card total-general">
        <div className="card-header">
          <h3>📊 Total du mois</h3>
        </div>
        <div className="card-body">
          <div className="general-totals">
            <div className="total-item">
              <span className="total-label">Nombre total de tickets :</span>
              <span className="total-value">{totals.total.count}</span>
            </div>
            <div className="total-item">
              <span className="total-label">Montant total :</span>
              <span className="total-value amount">{formatAmount(totals.total.amount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des tickets */}
      <div className="card">
        <div className="card-header">
          <h3>📋 Historique des tickets</h3>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="loading-container">
              <div className="loading"></div>
              <p>Chargement des tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="empty-state">
              <p>🎫 Aucun ticket enregistré pour ce mois</p>
            </div>
          ) : (
            <div className="tickets-list">
              {tickets.map((ticket, index) => (
                <div key={ticket._id || index} className="ticket-item">
                  <div className="ticket-info">
                    <div className="ticket-provider" style={{ color: getProviderColor(ticket.provider) }}>
                      {getProviderLabel(ticket.provider)}
                    </div>
                    <div className="ticket-amount">{formatAmount(ticket.amount)}</div>
                    <div className="ticket-date">
                      {new Date(ticket.date).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => removeTicket(ticket._id)}
                    title="Supprimer ce ticket"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketRestaurant;

