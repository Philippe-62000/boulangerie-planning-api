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
  const [barcodeBuffer, setBarcodeBuffer] = useState('');
  const [scanOrderNumber, setScanOrderNumber] = useState(1);

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
      
      // Sauvegarder la position de scroll actuelle
      const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
      
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

      console.log('📤 Envoi des données:', ticketData);
      const response = await api.post('/ticket-restaurant', ticketData);
      console.log('✅ Réponse du serveur:', response.data);
      toast.success(`#${scanOrderNumber} - Ticket ${selectedProvider.toUpperCase()} ajouté: ${amount}€`);
      
      // Incrémenter le numéro d'ordre
      setScanOrderNumber(prev => prev + 1);
      
      // Recharger les tickets
      await loadTickets();
      
      // Restaurer la position de scroll après le rechargement
      setTimeout(() => {
        window.scrollTo(0, scrollPosition);
      }, 100);
      
    } catch (error) {
      console.error('Erreur lors de l\'ajout du ticket:', error);
      toast.error('Erreur lors de l\'ajout du ticket');
    } finally {
      setScanning(false);
    }
  };

  const extractAmountFromBarcode = (barcode) => {
    console.log('🔍 Code-barres scanné:', barcode);
    
    if (!barcode || barcode.length < 10) {
      console.warn('⚠️ Code-barres trop court:', barcode);
      return null;
    }
    
    try {
      let amount = null;
      
      // Structure officielle pour tickets restaurant (24 caractères)
      // Format: XXXXXXXXXXXYYYYYZZZZZZZ
      // Positions 11-15 (5 chiffres) = montant en centimes
      if (barcode.length === 24) {
        console.log('🔍 Extraction par structure officielle (24 caractères)...');
        const amountInCents = barcode.substring(11, 16);
        console.log('🔍 Montant brut extrait:', amountInCents, 'centimes');
        
        const extractedAmount = parseFloat(amountInCents) / 100;
        
        if (!isNaN(extractedAmount) && extractedAmount > 0 && extractedAmount <= 999.99) {
          amount = extractedAmount;
          console.log('🔍 Structure officielle:', amountInCents, 'centimes →', amount, '€');
        }
      }
      
      if (!amount) {
        console.log('❌ Aucun montant valide trouvé');
        return null;
      }
      
      console.log('✅ Montant final:', amount, '€');
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

  const removeAllTickets = async () => {
    if (tickets.length === 0) {
      toast.info('Aucun ticket à supprimer');
      return;
    }

    const confirmMessage = `⚠️ ATTENTION ⚠️\n\nVous êtes sur le point de supprimer TOUS les ${tickets.length} tickets du mois ${new Date(currentMonth).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}.\n\nMontant total : ${formatAmount(totals.total.amount)}\n\nCette action est IRRÉVERSIBLE !\n\nÊtes-vous absolument sûr ?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setLoading(true);
      let deletedCount = 0;
      let errorCount = 0;

      // Supprimer tous les tickets un par un
      for (const ticket of tickets) {
        try {
          await api.delete(`/ticket-restaurant/${ticket._id}`);
          deletedCount++;
        } catch (error) {
          console.error(`Erreur suppression ticket ${ticket._id}:`, error);
          errorCount++;
        }
      }

      if (errorCount === 0) {
        toast.success(`✅ ${deletedCount} tickets supprimés avec succès`);
      } else {
        toast.warning(`⚠️ ${deletedCount} tickets supprimés, ${errorCount} erreurs`);
      }

      await loadTickets();
    } catch (error) {
      console.error('Erreur lors de la suppression globale:', error);
      toast.error('Erreur lors de la suppression des tickets');
    } finally {
      setLoading(false);
    }
  };

  const startScanner = () => {
    setScannerActive(true);
    console.log('🔍 Démarrage du scanner...');
    
    // Focus sur l'input caché pour capturer les codes-barres
    setTimeout(() => {
      const hiddenInput = document.getElementById('barcode-input');
      if (hiddenInput) {
        hiddenInput.focus();
        console.log('🎯 Focus appliqué sur input scanner');
        console.log('📱 Scanner prêt - Pointez vers le code-barres');
      } else {
        console.error('❌ Input scanner non trouvé');
      }
    }, 100);
  };

  const stopScanner = () => {
    setScannerActive(false);
  };

  const handleBarcodeInput = (event) => {
    const inputValue = event.target.value;
    console.log('🔍 Input détecté:', inputValue, 'Longueur:', inputValue.length);
    
    // Accumuler les caractères dans le buffer
    const newBuffer = barcodeBuffer + inputValue;
    console.log('📝 Buffer actuel:', newBuffer, 'Longueur:', newBuffer.length);
    
    // Vider l'input pour le prochain caractère
    event.target.value = '';
    
    // Si on a exactement 24 caractères, traiter le code-barres
    if (newBuffer.length === 24) {
      console.log('✅ Code-barres complet scanné:', newBuffer);
      handleScanTicket(newBuffer);
      
      // Réinitialiser le buffer
      setBarcodeBuffer('');
    } 
    // Si on dépasse 24 caractères, réinitialiser
    else if (newBuffer.length > 24) {
      console.error('❌ Buffer trop long, réinitialisation');
      toast.error('❌ Erreur de scan. Veuillez rescanner le ticket.');
      setBarcodeBuffer('');
    }
    // Sinon, continuer à accumuler
    else {
      setBarcodeBuffer(newBuffer);
    }
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
                  <span className="scan-order-badge">Prochain scan: #{scanOrderNumber}</span>
                </div>
                {/* Input caché pour capturer les codes-barres */}
                <input
                  id="barcode-input"
                  type="text"
                  onChange={handleBarcodeInput}
                  placeholder="Code-barres sera capturé automatiquement"
                  style={{ 
                    position: 'absolute', 
                    left: '-9999px', 
                    opacity: 0,
                    width: '1px',
                    height: '1px'
                  }}
                  autoFocus
                />
                <button 
                  className="btn btn-secondary"
                  onClick={stopScanner}
                >
                  Arrêter le scanner
                </button>
                
                {barcodeBuffer.length > 0 && (
                  <div className="buffer-status">
                    <span>Buffer: {barcodeBuffer.length}/24 caractères</span>
                    <button 
                      className="btn btn-warning btn-sm"
                      onClick={() => {
                        // Réinitialiser le buffer
                        setBarcodeBuffer('');
                        console.log('🔄 Buffer réinitialisé - Redémarrage du scanner');
                        
                        // Arrêter le scanner
                        setScannerActive(false);
                        
                        // Redémarrer le scanner après un court délai
                        setTimeout(() => {
                          setScannerActive(true);
                          setTimeout(() => {
                            const hiddenInput = document.getElementById('barcode-input');
                            if (hiddenInput) {
                              hiddenInput.focus();
                              console.log('🎯 Scanner redémarré et focus restauré');
                            }
                          }, 100);
                        }, 200);
                        
                        toast.info('🔄 Buffer réinitialisé - Scanner redémarré');
                      }}
                    >
                      🔄 Réinitialiser
                    </button>
                  </div>
                )}
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
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>📋 Historique des tickets</h3>
          {tickets.length > 0 && (
            <button
              className="btn btn-danger"
              onClick={removeAllTickets}
              title="Supprimer tous les tickets du mois"
            >
              🗑️ Tout effacer ({tickets.length})
            </button>
          )}
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

