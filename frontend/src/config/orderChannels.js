/** Canaux commande / stocks (TGT, Mill'Ange, …). */
export const ORDER_CHANNELS = {
  TGT: {
    key: 'TGT',
    supplier: 'TGT',
    title: 'Commande TGT',
    stocksTitle: 'Stocks TGT',
    commandePath: '/commande-tgt',
    stocksPath: '/stocks-tgt',
    menuCommandeId: 'commande-tgt',
    menuStocksId: 'stocks-tgt',
    showPositive: true,
    showSeedArras: true,
    showProductOrderControls: false,
    emptyProductsHint: 'Configurez le catalogue dans Commande TGT.',
    stockScheduleMenuLabel: 'Stocks TGT'
  },
  MILLANGE: {
    key: 'MILLANGE',
    supplier: 'MILLANGE',
    title: "Commande Mill'Ange",
    stocksTitle: "Stocks Mill'Ange",
    commandePath: '/commande-millange',
    stocksPath: '/stocks-millange',
    menuCommandeId: 'commande-millange',
    menuStocksId: 'stocks-millange',
    showPositive: false,
    showSeedArras: false,
    showProductOrderControls: true,
    emptyProductsHint: "Configurez le catalogue dans Commande Mill'Ange (onglet Configuration).",
    stockScheduleMenuLabel: "Stocks Mill'Ange"
  }
};

export const getOrderChannel = (key) => ORDER_CHANNELS[key] || ORDER_CHANNELS.TGT;
