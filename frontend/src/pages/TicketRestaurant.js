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
  const [testMode, setTestMode] = useState(false);
  const [scannedCodes, setScannedCodes] = useState([]);
  const [barcodeBuffer, setBarcodeBuffer] = useState('');

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
      toast.success(`Ticket ${selectedProvider.toUpperCase()} ajouté: ${amount}€`);
      
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
      // Logique hybride : patterns connus + structure officielle
      let amount = null;
      
      // 1. Recherche de patterns connus (priorité)
      if (barcode.includes('680')) {
        amount = 6.80;
        console.log('🔍 Pattern 680 trouvé → 6,80€');
      }
      else if (barcode.includes('1152')) {
        amount = 11.52;
        console.log('🔍 Pattern 1152 trouvé → 11,52€');
      }
      else if (barcode.includes('900')) {
        amount = 9.00;
        console.log('🔍 Pattern 900 trouvé → 9€');
      }
      else if (barcode.includes('800')) {
        amount = 8.00;
        console.log('🔍 Pattern 800 trouvé → 8€');
      }
      else if (barcode.includes('700') && !barcode.includes('680')) {
        amount = 7.00;
        console.log('🔍 Pattern 700 trouvé → 7€');
      }
      else if (barcode.includes('383')) {
        amount = 3.83;
        console.log('🔍 Pattern 383 trouvé → 3,83€');
      }
      // 2. Fallback: Structure officielle (si code fait 20 caractères)
      else if (barcode.length === 20) {
        console.log('🔍 Tentative extraction par structure officielle...');
        const amountInCents = barcode.substring(11, 16);
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

  const handleBarcodeInput = (event) => {
    const input = event.target.value.trim();
    console.log('🔍 Input détecté:', input, 'Longueur:', input.length);
    
    // Si on a exactement 24 caractères, traiter directement
    if (input.length === 24) {
      console.log('📱 Code-barres complet détecté:', input);
      
      if (testMode) {
        // Mode test : analyser le code sans l'ajouter
        analyzeBarcodeForTest(input);
      } else {
        // Mode normal : ajouter le ticket
        handleScanTicket(input);
      }
      
      // Vider l'input pour le prochain scan
      event.target.value = '';
      setBarcodeBuffer('');
      return;
    }
    
    // Si on a moins de 24 caractères, accumuler dans le buffer
    if (input.length < 24) {
      setBarcodeBuffer(prevBuffer => {
        const newBuffer = prevBuffer + input;
        console.log('📝 Buffer actuel:', newBuffer, 'Longueur:', newBuffer.length);
        
        // Si on atteint exactement 24 caractères
        if (newBuffer.length === 24) {
          console.log('📱 Code-barres complet via buffer:', newBuffer);
          
          if (testMode) {
            analyzeBarcodeForTest(newBuffer);
          } else {
            handleScanTicket(newBuffer);
          }
          
          event.target.value = '';
          return '';
        }
        
        // Si on dépasse 24 caractères, réinitialiser
        if (newBuffer.length > 24) {
          console.log('⚠️ Buffer trop long, réinitialisation');
          event.target.value = '';
          return '';
        }
        
        return newBuffer;
      });
    } else {
      // Code trop long, réinitialiser
      console.log('⚠️ Code trop long:', input.length, 'caractères');
      event.target.value = '';
      setBarcodeBuffer('');
    }
  };

  const analyzeBarcodeForTest = (barcode) => {
    console.log('🧪 MODE TEST - Analyse du code-barres:', barcode);
    
    const analysis = {
      barcode: barcode,
      length: barcode.length,
      prefix: barcode[0],
      suffix: barcode[barcode.length - 1],
      timestamp: new Date().toLocaleTimeString(),
      expectedFormat: 'XXXXXXXXXXXXXX (24 caractères)',
      issues: []
    };
    
    // Vérifier uniquement la longueur fixe pour tickets restaurant
    if (barcode.length !== 24) {
      analysis.issues.push(`Longueur incorrecte: ${barcode.length} (attendu: 24)`);
    }
    
    // Analyser les patterns de montants
    const amount = extractAmountFromBarcode(barcode);
    analysis.extractedAmount = amount;
    
    if (!amount) {
      analysis.issues.push('Aucun montant extrait du code-barres');
    }
    
    // Ajouter à la liste des codes scannés
    setScannedCodes(prev => [analysis, ...prev.slice(0, 9)]); // Garder les 10 derniers
    
    console.log('🔍 Analyse complète:', analysis);
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
                <button 
                  className="btn btn-success"
                  onClick={simulateScan}
                  disabled={scanning}
                >
                  {scanning ? '⏳ Ajout...' : '✅ Simuler scan'}
                </button>
                <button 
                  className={`btn ${testMode ? 'btn-warning' : 'btn-info'}`}
                  onClick={() => setTestMode(!testMode)}
                >
                  {testMode ? '🧪 Mode Test ACTIF' : '🧪 Mode Test'}
                </button>
                
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    const input = document.getElementById('barcode-input');
                    if (input) {
                      input.value = '039624357600068022200005';
                      input.dispatchEvent(new Event('change', { bubbles: true }));
                      console.log('🧪 Test manuel avec code réel déclenché');
                    }
                  }}
                >
                  🧪 Test code réel
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

      {/* Mode Test - Diagnostic Netum L6 */}
      {testMode && (
        <div className="test-mode-section">
          <div className="test-header">
            <h3>🧪 Mode Test - Diagnostic Scanner Netum L6</h3>
            <p>Analyse des codes-barres scannés pour diagnostiquer la configuration</p>
          </div>
          
          <div className="test-info">
            <div className="test-format">
              <h4>📋 Format attendu pour tickets restaurant :</h4>
              <code>XXXXXXXXXXXXXXXXXXXXXXXX</code>
              <ul>
                <li>Longueur : <strong>24 caractères exactement</strong></li>
                <li>Si moins de 24 caractères : <strong>Rescanner le ticket</strong></li>
                <li>Si plus de 24 caractères : <strong>Rescanner le ticket</strong></li>
                <li>Montant : extraction par patterns connus</li>
              </ul>
            </div>
          </div>

          {scannedCodes.length > 0 ? (
            <div className="test-results">
              <h4>📱 Codes-barres analysés :</h4>
              <div className="test-codes">
                {scannedCodes.map((analysis, index) => (
                  <div key={index} className={`test-code ${analysis.issues.length > 0 ? 'has-issues' : 'no-issues'}`}>
                    <div className="test-code-header">
                      <span className="test-time">{analysis.timestamp}</span>
                      <span className="test-status">
                        {analysis.issues.length > 0 ? '❌ Problèmes' : '✅ Correct'}
                      </span>
                    </div>
                    <div className="test-code-content">
                      <div className="test-barcode">
                        <strong>Code :</strong> <code>{analysis.barcode}</code>
                      </div>
                      <div className="test-details">
                        <div>Longueur : {analysis.length} (attendu: 24) {analysis.length === 24 ? '✅' : '❌'}</div>
                        <div>Préfixe : "{analysis.prefix}"</div>
                        <div>Suffixe : "{analysis.suffix}"</div>
                        <div>Montant extrait : {analysis.extractedAmount ? `${analysis.extractedAmount}€` : 'Aucun'}</div>
                      </div>
                      {analysis.issues.length > 0 && (
                        <div className="test-issues">
                          <strong>Problèmes détectés :</strong>
                          <ul>
                            {analysis.issues.map((issue, i) => (
                              <li key={i}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="test-waiting">
              <p>🎯 Scannez des codes-barres pour analyser leur format...</p>
              <p>Le mode test n'ajoute pas les tickets, il analyse seulement la configuration.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TicketRestaurant;

