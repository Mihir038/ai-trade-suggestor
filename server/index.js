const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const path = require('path');

const { INSTRUMENTS } = require('./data/instruments');
const { getHistoricalCandles, fetchLiveCandles } = require('./data/historicalData');
const { STRATEGIES, evaluateStrategies } = require('./services/strategyEngine');
const { runBacktest } = require('./services/backtestEngine');
const { generateTradeExplanation } = require('./services/aiExplanationEngine');
const { MarketDataService } = require('./services/marketDataService');
const {
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateATR,
  calculateSuperTrend,
  calculateVWAP,
  calculatePivotPoints,
  analyzeMarketStructure
} = require('./services/technicalIndicators');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize Real-time Market Data & Monitoring Service
const marketService = new MarketDataService(wss);
marketService.start();

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('[WebSocket] Client connected. Active clients:', wss.clients.size);

  // Send initial state payload immediately upon connection
  ws.send(JSON.stringify({
    type: 'INITIAL_STATE',
    timestamp: Date.now(),
    prices: marketService.getAllPrices(),
    marketStatuses: marketService.getMarketStatuses(),
    pendingApprovals: marketService.getTradeManager().getPendingApprovals(),
    activeRecommendations: marketService.getTradeManager().getActiveRecommendations(),
    completedTrades: marketService.getTradeManager().getCompletedTrades()
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
      }
    } catch {
      // Ignore
    }
  });

  ws.on('close', () => {
    console.log('[WebSocket] Client disconnected.');
  });
});

// ================= API ROUTES =================

// 1. Supported Instruments
app.get('/api/instruments', (req, res) => {
  res.json({
    success: true,
    instruments: Object.values(INSTRUMENTS)
  });
});

// 2. Real-time Prices and Market Status
app.get('/api/prices', (req, res) => {
  res.json({
    success: true,
    prices: marketService.getAllPrices(),
    statuses: marketService.getMarketStatuses()
  });
});

// 3. OHLCV Chart Candles with Technical Indicators
app.get('/api/candles/:instrumentId', async (req, res) => {
  try {
    const { instrumentId } = req.params;
    const timeframe = req.query.timeframe || '15m';

    const inst = INSTRUMENTS[instrumentId.toUpperCase()];
    if (!inst) {
      return res.status(404).json({ success: false, error: 'Instrument not supported.' });
    }

    const candleResult = await fetchLiveCandles(inst.id, timeframe);
    const candles = candleResult.candles || [];

    if (!candleResult.success || candles.length === 0) {
      return res.json({
        success: false,
        instrument: inst,
        timeframe,
        isOffline: true,
        isLive: false,
        error: candleResult.error || 'Live market data feed unavailable. Please check your internet connection.'
      });
    }

    const closes = candles.map(c => c.close);

    // Compute key indicators for chart overlays
    const ema9 = calculateEMA(closes, 9);
    const ema21 = calculateEMA(closes, 21);
    const ema50 = calculateEMA(closes, 50);
    const ema200 = calculateEMA(closes, 200);
    const rsi = calculateRSI(closes, 14);
    const macd = calculateMACD(closes, 12, 26, 9);
    const bb = calculateBollingerBands(closes, 20, 2);
    const supertrend = calculateSuperTrend(candles, 10, 3);
    const vwap = calculateVWAP(candles);
    const structure = analyzeMarketStructure(candles);

    // Pivot points from latest bar
    const lastBar = candles[candles.length - 1];
    const pivots = calculatePivotPoints(lastBar.high, lastBar.low, lastBar.close);

    res.json({
      success: true,
      instrument: inst,
      timeframe,
      isLive: candleResult.isLive,
      isCached: candleResult.isCached,
      lastFetchedAt: candleResult.lastFetchedAt,
      source: candleResult.source,
      offlineWarning: candleResult.offlineWarning,
      candles,
      indicators: {
        ema9,
        ema21,
        ema50,
        ema200,
        rsi,
        macd,
        bb,
        supertrend,
        vwap,
        pivots,
        structure
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Pending Trade Approvals
app.get('/api/pending-approvals', (req, res) => {
  const pending = marketService.getTradeManager().getPendingApprovals();
  res.json({
    success: true,
    count: pending.length,
    pendingApprovals: pending
  });
});

// 5. Approve & Execute Trade Signal (Sets onto chart with execution timestamp)
app.post('/api/trades/approve', (req, res) => {
  const { signalId } = req.body;
  if (!signalId) {
    return res.status(400).json({ success: false, error: 'signalId is required.' });
  }
  const result = marketService.approveTrade(signalId);
  res.json(result);
});

// 6. Dismiss / Reject Pending Trade Signal
app.post('/api/trades/reject', (req, res) => {
  const { signalId, reason } = req.body;
  if (!signalId) {
    return res.status(400).json({ success: false, error: 'signalId is required.' });
  }
  const result = marketService.rejectTrade(signalId, reason);
  res.json(result);
});

// 7. Active / Executed Trade Recommendations
app.get('/api/recommendations', (req, res) => {
  const active = marketService.getTradeManager().getActiveRecommendations();
  res.json({
    success: true,
    count: active.length,
    recommendations: active
  });
});

// 5. In-depth AI Trade Explanation & Risk Analysis (Section 6)
app.get('/api/recommendations/:id/explanation', (req, res) => {
  const { id } = req.params;
  const active = marketService.getTradeManager().getActiveRecommendations();
  const pending = marketService.getTradeManager().getPendingApprovals();
  const completed = marketService.getTradeManager().getCompletedTrades();

  const trade = active.find(t => t.id === id) || pending.find(t => t.id === id) || completed.find(t => t.id === id);

  if (!trade) {
    return res.status(404).json({ success: false, error: 'Trade recommendation not found.' });
  }

  const explanation = generateTradeExplanation(trade);
  res.json({
    success: true,
    trade,
    explanation
  });
});

// 6. Completed Trades History
app.get('/api/trades/history', (req, res) => {
  const completed = marketService.getTradeManager().getCompletedTrades();
  res.json({
    success: true,
    count: completed.length,
    trades: completed
  });
});

// 7. Option Chain Data Endpoint (NSE Nifty / BankNifty / Sensex)
app.get('/api/option-chain', (req, res) => {
  const data = marketService.getOptionChainData('NIFTY');
  res.json({ success: true, optionChain: data });
});

app.get('/api/option-chain/:instrumentId', (req, res) => {
  const instrumentId = req.params.instrumentId || 'NIFTY';
  const data = marketService.getOptionChainData(instrumentId);
  if (!data) {
    return res.status(404).json({ success: false, error: `Option chain not supported for ${instrumentId}. Supported: NIFTY, BANKNIFTY, SENSEX.` });
  }
  res.json({
    success: true,
    optionChain: data
  });
});

// 8. Generate Option Trade from Strike
app.post('/api/option-chain/generate-trade', (req, res) => {
  const { instrumentId, strike, optionType } = req.body;
  const added = marketService.createOptionTradeFromStrike(instrumentId, Number(strike), optionType);
  if (!added) {
    return res.status(400).json({ success: false, error: 'Could not generate option trade signal.' });
  }
  res.json({
    success: true,
    trade: added,
    message: `Generated option trade ${added.instrument} into Pending Approvals.`
  });
});

// 7. Trading Strategies Catalog
app.get('/api/strategies', (req, res) => {
  res.json({
    success: true,
    strategies: Object.values(STRATEGIES)
  });
});

// 8. Strategy Backtesting Lab (Section 4)
app.post('/api/backtest', (req, res) => {
  try {
    const {
      strategyId = 'STRAT_TREND_MOMENTUM',
      instrumentId = 'NIFTY',
      timeframe = '15m',
      initialCapital = null,
      riskPercentage = 1.0
    } = req.body;

    const result = runBacktest({
      strategyId,
      instrumentId,
      timeframe,
      initialCapital: initialCapital ? Number(initialCapital) : null,
      riskPercentage: Number(riskPercentage)
    });

    res.json({
      success: true,
      result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 9. Multi-Timeframe AI Market Scanner
app.get('/api/scanner', (req, res) => {
  const timeframes = ['1m', '5m', '15m', '1h', '1D'];
  const scannerData = [];

  Object.values(INSTRUMENTS).forEach(inst => {
    const tfStatus = {};
    timeframes.forEach(tf => {
      const candleResult = getHistoricalCandles(inst.id, tf);
      const candles = candleResult.candles || [];
      if (candles.length === 0) return;
      const closes = candles.map(c => c.close);
      const ema9 = calculateEMA(closes, 9);
      const ema21 = calculateEMA(closes, 21);
      const rsi = calculateRSI(closes, 14);
      const supertrend = calculateSuperTrend(candles, 10, 3);

      const lastIdx = candles.length - 1;
      const isBull = ema9[lastIdx] > ema21[lastIdx];
      const rsiVal = rsi[lastIdx] || 50;
      const stTrend = supertrend[lastIdx]?.trend || 1;

      let trend = 'NEUTRAL';
      if (isBull && stTrend === 1 && rsiVal > 50) trend = 'STRONG_BULLISH';
      else if (isBull || stTrend === 1) trend = 'MODERATE_BULLISH';
      else if (!isBull && stTrend === -1 && rsiVal < 50) trend = 'STRONG_BEARISH';
      else if (!isBull || stTrend === -1) trend = 'MODERATE_BEARISH';

      tfStatus[tf] = {
        trend,
        rsi: Number(rsiVal.toFixed(1)),
        price: candles[lastIdx].close,
        stTrend: stTrend === 1 ? 'BULL' : 'BEAR'
      };
    });

    scannerData.push({
      instrumentId: inst.id,
      name: inst.name,
      currencySymbol: inst.currencySymbol,
      currentPrice: marketService.getPrice(inst.id)?.price || inst.basePrice,
      timeframes: tfStatus
    });
  });

  res.json({
    success: true,
    scanner: scannerData
  });
});

// 10. Manual / Instant Trigger of Strategy Scanner
app.post('/api/recommendations/simulate', (req, res) => {
  const { instrumentId = 'NIFTY', strategyKey = 'STRAT_TREND_MOMENTUM', signalType = 'BUY' } = req.body;
  const inst = INSTRUMENTS[instrumentId] || INSTRUMENTS.NIFTY;
  const strat = STRATEGIES[strategyKey] || STRATEGIES.STRAT_TREND_MOMENTUM;

  const currentPrice = marketService.getPrice(inst.id)?.price || inst.basePrice;
  const atr = currentPrice * (inst.atrMultiplier || 0.01);
  const isBuy = signalType === 'BUY';

  const entry = currentPrice;
  const sl = isBuy ? Number((entry - atr * 1.2).toFixed(2)) : Number((entry + atr * 1.2).toFixed(2));
  const risk = Math.abs(entry - sl);
  const t1 = isBuy ? Number((entry + risk * 1.5).toFixed(2)) : Number((entry - risk * 1.5).toFixed(2));
  const t2 = isBuy ? Number((entry + risk * 2.5).toFixed(2)) : Number((entry - risk * 2.5).toFixed(2));
  const t3 = isBuy ? Number((entry + risk * 4.0).toFixed(2)) : Number((entry - risk * 4.0).toFixed(2));

  const { createSignalPayload } = require('./services/strategyEngine');
  const signal = createSignalPayload({
    strategyKey: strat.id,
    instrument: inst,
    signalType,
    entry,
    sl,
    t1,
    t2,
    t3,
    timeframe: '15m',
    confidence: 89,
    marketCondition: 'Simulated High-Probability Opportunity',
    indicators: { atr, rsi: isBuy ? 56 : 44 }
  });

  marketService.getTradeManager().addRecommendation(signal);
  marketService.broadcastSignalAlert(signal);

  res.json({
    success: true,
    signal
  });
});

// Serve frontend in production if built
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback to index.html for client routing
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.send('AI Trade Suggestor API is active on port ' + PORT + '. Frontend is running on Vite dev port 5173.');
    }
  });
});

server.listen(PORT, () => {
  console.log(`[Server] AI Trade Suggestor Server running on http://localhost:${PORT}`);
  console.log(`[Server] WebSocket live stream active on ws://localhost:${PORT}`);
});
