// Instrument specifications and trading metadata for the 5 supported markets
const INSTRUMENTS = {
  NIFTY: {
    id: 'NIFTY',
    name: 'NIFTY 50',
    yahooSymbol: '^NSEI',
    binanceSymbol: null,
    exchange: 'NSE (India)',
    currency: 'INR',
    currencySymbol: '₹',
    lotSize: 25, // Current standard lot size
    tickSize: 0.05,
    minQty: 25,
    type: 'INDEX_FUTURES',
    tradingHours: {
      open: '09:15',
      close: '15:30',
      timezone: 'Asia/Kolkata',
      days: [1, 2, 3, 4, 5]
    },
    defaultCapital: 500000, // ₹5,00,000
    basePrice: 25261.85,
    atrMultiplier: 0.008,
    description: 'National Stock Exchange benchmark index representing the weighted average of 50 of the largest Indian companies.'
  },
  BANKNIFTY: {
    id: 'BANKNIFTY',
    name: 'BANK NIFTY',
    yahooSymbol: '^NSEBANK',
    binanceSymbol: null,
    exchange: 'NSE (India)',
    currency: 'INR',
    currencySymbol: '₹',
    lotSize: 15, // Standard current Bank Nifty lot size
    tickSize: 0.05,
    minQty: 15,
    type: 'INDEX_FUTURES',
    tradingHours: {
      open: '09:15',
      close: '15:30',
      timezone: 'Asia/Kolkata',
      days: [1, 2, 3, 4, 5]
    },
    defaultCapital: 500000, // ₹5,00,000
    basePrice: 62108.95,
    atrMultiplier: 0.012,
    description: 'Index composed of the 12 most liquid and large-capitalised banking stocks listed on the NSE.'
  },
  SENSEX: {
    id: 'SENSEX',
    name: 'SENSEX',
    yahooSymbol: '^BSESN',
    binanceSymbol: null,
    exchange: 'BSE (India)',
    currency: 'INR',
    currencySymbol: '₹',
    lotSize: 10,
    tickSize: 0.05,
    minQty: 10,
    type: 'INDEX_FUTURES',
    tradingHours: {
      open: '09:15',
      close: '15:30',
      timezone: 'Asia/Kolkata',
      days: [1, 2, 3, 4, 5]
    },
    defaultCapital: 1000000, // ₹10,00,000
    basePrice: 82050.23,
    atrMultiplier: 0.0075,
    description: 'BSE 30 benchmark index representing 30 well-established and financially sound companies across key sectors.'
  },
  CRUDEOIL: {
    id: 'CRUDEOIL',
    name: 'CRUDE OIL',
    yahooSymbol: 'CL=F',
    binanceSymbol: null,
    exchange: 'NYMEX / MCX',
    currency: 'USD',
    currencySymbol: '$',
    secondaryCurrency: 'INR',
    secondaryRate: 86.5, // USD to INR conversion
    lotSize: 100, // 100 barrels standard MCX / mini NYMEX
    tickSize: 0.01,
    minQty: 100,
    type: 'COMMODITY',
    tradingHours: {
      open: '09:00',
      close: '23:30',
      timezone: 'Asia/Kolkata',
      days: [1, 2, 3, 4, 5]
    },
    defaultCapital: 10000, // $10,000
    basePrice: 88.56,
    atrMultiplier: 0.018,
    description: 'Light Sweet Crude Oil (WTI / MCX), the worlds primary benchmark for petroleum energy markets.'
  },
  BTCUSD: {
    id: 'BTCUSD',
    name: 'BITCOIN',
    yahooSymbol: 'BTC-USD',
    binanceSymbol: 'BTCUSDT',
    exchange: 'Binance / Global',
    currency: 'USD',
    currencySymbol: '$',
    lotSize: 0.01, // Fractional contracts / unit
    tickSize: 0.01,
    minQty: 0.001,
    type: 'CRYPTO',
    tradingHours: {
      open: '00:00',
      close: '23:59',
      timezone: 'UTC',
      days: [0, 1, 2, 3, 4, 5, 6] // 24/7/365
    },
    defaultCapital: 25000, // $25,000
    basePrice: 65532.00,
    atrMultiplier: 0.022,
    description: 'Leading decentralized digital cryptocurrency asset trading 24/7 across global institutional spot and derivatives exchanges.'
  }
};

module.exports = { INSTRUMENTS };

