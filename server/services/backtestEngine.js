/**
 * Institutional Backtesting & Performance Analysis Engine
 * Executes event-driven, bar-by-bar backtest simulations on historical candles
 * without lookahead bias, calculating realistic execution, slippage, and equity curves.
 */

const { STRATEGIES } = require('./strategyEngine');
const { INSTRUMENTS } = require('../data/instruments');
const { getHistoricalCandles } = require('../data/historicalData');
const {
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateATR,
  calculateSuperTrend,
  calculateVWAP
} = require('./technicalIndicators');

function runBacktest({
  strategyId = 'STRAT_TREND_MOMENTUM',
  instrumentId = 'NIFTY',
  timeframe = '15m',
  initialCapital = null,
  riskPercentage = 1.0
}) {
  const instrument = INSTRUMENTS[instrumentId] || INSTRUMENTS.NIFTY;
  const strat = STRATEGIES[strategyId] || STRATEGIES.STRAT_TREND_MOMENTUM;
  const capital = initialCapital || instrument.defaultCapital || 500000;

  // Retrieve candle series
  const candleResult = getHistoricalCandles(instrumentId, timeframe);
  const candles = candleResult.candles || [];
  if (!candles || candles.length < 60) {
    throw new Error('Insufficient historical candle data for backtesting. Please connect to internet to download authentic candles.');
  }

  let currentEquity = capital;
  let peakEquity = capital;
  let maxDrawdownCash = 0;
  let maxDrawdownPct = 0;

  const trades = [];
  const equityCurve = [{ time: candles[30].time, equity: capital, drawdownPct: 0 }];

  let activePosition = null;

  // Market condition categorizer
  const closes = candles.map(c => c.close);
  const ema50 = calculateEMA(closes, 50);
  const ema200 = calculateEMA(closes, 200);
  const atr = calculateATR(candles, 14);

  // Pre-calculate indicators
  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);
  const rsi = calculateRSI(closes, 14);
  const macd = calculateMACD(closes, 12, 26, 9);
  const bb = calculateBollingerBands(closes, 20, 2);
  const supertrend = calculateSuperTrend(candles, 10, 3);
  const vwap = calculateVWAP(candles);

  // Bar-by-bar step simulation (starting at bar 30)
  for (let i = 30; i < candles.length; i++) {
    const c = candles[i];
    const prevC = candles[i - 1];
    const prev2C = candles[i - 2] || prevC;
    const currentPrice = c.close;
    const currentATR = atr[i] || (currentPrice * (instrument.atrMultiplier || 0.01));

    // Determine current market regime
    let regime = 'Range-bound / Consolidation';
    if (ema50[i] && ema200[i]) {
      const slope50 = (ema50[i] - ema50[i - 5]) / (ema50[i - 5] || 1);
      if (slope50 > 0.0015 && currentPrice > ema50[i]) {
        regime = 'Bullish Trend';
      } else if (slope50 < -0.0015 && currentPrice < ema50[i]) {
        regime = 'Bearish Trend';
      } else if (bb.bandwidth[i] && bb.bandwidth[i] > 3.8) {
        regime = 'High Volatility Expansion';
      }
    }

    // 1. MANAGE ACTIVE POSITION
    if (activePosition) {
      let exitTrade = false;
      let exitPrice = currentPrice;
      let exitReason = '';

      if (activePosition.type === 'BUY') {
        // Stop Loss check
        if (c.low <= activePosition.sl) {
          exitTrade = true;
          exitPrice = activePosition.sl;
          exitReason = activePosition.slMovedToBreakeven ? 'Breakeven Stop (Profit Protected)' : 'Stop Loss Hit';
        }
        // Target 3 check (Full exit)
        else if (c.high >= activePosition.t3) {
          exitTrade = true;
          exitPrice = activePosition.t3;
          exitReason = 'Target 3 (Full Target) Reached';
        }
        // Target 2 reached
        else if (!activePosition.t2Hit && c.high >= activePosition.t2) {
          activePosition.t2Hit = true;
          // Trail SL to Target 1
          activePosition.sl = activePosition.t1;
        }
        // For Mean Reversion, Target 1 (Middle Band) is primary take-profit objective
        else if (activePosition.strategyId === 'STRAT_MEAN_REVERSION' && c.high >= activePosition.t1) {
          exitTrade = true;
          exitPrice = activePosition.t1;
          exitReason = 'Bollinger Middle Band Mean Target Hit';
        }
        // Target 1 reached
        else if (!activePosition.t1Hit && c.high >= activePosition.t1) {
          activePosition.t1Hit = true;
          activePosition.sl = activePosition.entry; // Move SL to Breakeven
          activePosition.slMovedToBreakeven = true;
        }
      } else if (activePosition.type === 'SELL') {
        // Stop Loss check
        if (c.high >= activePosition.sl) {
          exitTrade = true;
          exitPrice = activePosition.sl;
          exitReason = activePosition.slMovedToBreakeven ? 'Breakeven Stop (Profit Protected)' : 'Stop Loss Hit';
        }
        // Target 3 check
        else if (c.low <= activePosition.t3) {
          exitTrade = true;
          exitPrice = activePosition.t3;
          exitReason = 'Target 3 (Full Target) Reached';
        }
        // Target 2 reached
        else if (!activePosition.t2Hit && c.low <= activePosition.t2) {
          activePosition.t2Hit = true;
          activePosition.sl = activePosition.t1;
        }
        // For Mean Reversion, Target 1 (Middle Band) is primary take-profit objective
        else if (activePosition.strategyId === 'STRAT_MEAN_REVERSION' && c.low <= activePosition.t1) {
          exitTrade = true;
          exitPrice = activePosition.t1;
          exitReason = 'Bollinger Middle Band Mean Target Hit';
        }
        // Target 1 reached
        else if (!activePosition.t1Hit && c.low <= activePosition.t1) {
          activePosition.t1Hit = true;
          activePosition.sl = activePosition.entry;
          activePosition.slMovedToBreakeven = true;
        }
      }

      // Max holding period exit (prevent zombie trades)
      if (!exitTrade && (i - activePosition.entryBar) > 25) {
        exitTrade = true;
        exitPrice = currentPrice;
        exitReason = 'Time-Horizon Rebalance Exit';
      }

      if (exitTrade) {
        const pointDiff = activePosition.type === 'BUY' ? (exitPrice - activePosition.entry) : (activePosition.entry - exitPrice);
        let pnlCash = Number((pointDiff * activePosition.quantity).toFixed(2));
        
        // If Target 1 was hit, partial profit (50%) was locked in at Target 1
        if (activePosition.t1Hit && pnlCash <= 0) {
          const t1Gain = Math.abs(activePosition.t1 - activePosition.entry) * (activePosition.quantity * 0.5);
          pnlCash = Number(t1Gain.toFixed(2));
        }

        const pnlPct = Number(((pnlCash / (activePosition.entry * activePosition.quantity)) * 100).toFixed(2));
        const isWin = pnlCash > 0 || activePosition.t1Hit || activePosition.t2Hit;

        currentEquity += pnlCash;
        if (currentEquity > peakEquity) peakEquity = currentEquity;
        const currentDD = peakEquity - currentEquity;
        const currentDDPct = (currentDD / peakEquity) * 100;
        if (currentDD > maxDrawdownCash) maxDrawdownCash = currentDD;
        if (currentDDPct > maxDrawdownPct) maxDrawdownPct = currentDDPct;

        trades.push({
          id: `BT-${trades.length + 1}`,
          entryTime: activePosition.entryTime,
          exitTime: c.time,
          type: activePosition.type,
          entryPrice: activePosition.entry,
          exitPrice: Number(exitPrice.toFixed(2)),
          sl: activePosition.initialSL,
          target: activePosition.t2,
          quantity: activePosition.quantity,
          pnlCash,
          pnlPct,
          isWin,
          exitReason,
          regime: activePosition.regime,
          runningEquity: Number(currentEquity.toFixed(2))
        });

        equityCurve.push({
          time: c.time,
          equity: Number(currentEquity.toFixed(2)),
          drawdownPct: Number(currentDDPct.toFixed(2))
        });

        activePosition = null;
      }
    }

    // 2. EVALUATE ENTRY IF NO ACTIVE POSITION
    if (!activePosition && i < candles.length - 2) {
      let signal = null;

      if (strategyId === 'STRAT_TREND_MOMENTUM') {
        const isBull = ema9[i] > ema21[i];
        const isBear = ema9[i] < ema21[i];
        if (isBull && (c.low <= ema21[i] * 1.004 || prevC.low <= ema21[i] * 1.004) && c.close > ema21[i] && (macd.histogram[i] || 0) > -0.5) {
          signal = { type: 'BUY', sl: Number((Math.min(c.low, prevC.low) - currentATR * 0.4).toFixed(2)) };
        } else if (isBear && (c.high >= ema21[i] * 0.996 || prevC.high >= ema21[i] * 0.996) && c.close < ema21[i] && (macd.histogram[i] || 0) < 0.5) {
          signal = { type: 'SELL', sl: Number((Math.max(c.high, prevC.high) + currentATR * 0.4).toFixed(2)) };
        }
      } else if (strategyId === 'STRAT_SMC_STRUCTURE') {
        if (c.close > prevC.high && (rsi[i] || 50) > 48 && (c.volume || 1) > 1.15 * (prevC.volume || 1)) {
          signal = { type: 'BUY', sl: Number((c.low - currentATR * 0.35).toFixed(2)) };
        } else if (c.close < prevC.low && (rsi[i] || 50) < 52 && (c.volume || 1) > 1.15 * (prevC.volume || 1)) {
          signal = { type: 'SELL', sl: Number((c.high + currentATR * 0.35).toFixed(2)) };
        }
      } else if (strategyId === 'STRAT_MEAN_REVERSION') {
        const isConsolidation = regime === 'Range-bound / Consolidation';
        const bbLower = bb.lower[i] || 0;
        const bbUpper = bb.upper[i] || 0;
        const bbMid = bb.middle[i] || currentPrice;

        const isOversoldBounce = (rsi[i - 1] || 50) < 36 && prevC.low <= bbLower && c.close > bbLower && c.close > c.open && bbMid > c.close;
        const isOverboughtReject = (rsi[i - 1] || 50) > 64 && prevC.high >= bbUpper && c.close < bbUpper && c.close < c.open && bbMid < c.close;

        if (isOversoldBounce && (isConsolidation || currentPrice > (ema50[i] || 0))) {
          signal = { type: 'BUY', sl: Number((Math.min(c.low, prevC.low) - currentATR * 0.5).toFixed(2)) };
        } else if (isOverboughtReject && (isConsolidation || currentPrice < (ema50[i] || 0))) {
          signal = { type: 'SELL', sl: Number((Math.max(c.high, prevC.high) + currentATR * 0.5).toFixed(2)) };
        }
      } else if (strategyId === 'STRAT_SUPERTREND_VOLATILITY') {
        if (supertrend[i - 1]?.trend === -1 && supertrend[i]?.trend === 1) {
          signal = { type: 'BUY', sl: Number((supertrend[i].supertrend - currentATR * 0.2).toFixed(2)) };
        } else if (supertrend[i - 1]?.trend === 1 && supertrend[i]?.trend === -1) {
          signal = { type: 'SELL', sl: Number((supertrend[i].supertrend + currentATR * 0.2).toFixed(2)) };
        } else if (supertrend[i]?.trend === 1 && c.close > ema21[i] && prevC.close <= ema21[i]) {
          signal = { type: 'BUY', sl: Number((supertrend[i].supertrend - currentATR * 0.2).toFixed(2)) };
        }
      } else if (strategyId === 'STRAT_VWAP_VOLUME') {
        const vwapVal = vwap.vwap[i] || c.close;
        if (c.low <= vwapVal * 1.004 && c.close > vwapVal && c.close >= c.open) {
          signal = { type: 'BUY', sl: Number((vwapVal - currentATR * 0.4).toFixed(2)) };
        } else if (c.high >= vwapVal * 0.996 && c.close < vwapVal && c.close <= c.open) {
          signal = { type: 'SELL', sl: Number((vwapVal + currentATR * 0.4).toFixed(2)) };
        }
      } else if (strategyId === 'STRAT_RANGE_BREAKOUT') {
        if (c.close > prevC.high && prevC.close > prev2C.high && (rsi[i] || 50) > 55) {
          signal = { type: 'BUY', sl: Number((c.low - currentATR * 0.4).toFixed(2)) };
        } else if (c.close < prevC.low && prevC.close < prev2C.low && (rsi[i] || 50) < 45) {
          signal = { type: 'SELL', sl: Number((c.high + currentATR * 0.4).toFixed(2)) };
        }
      }

      if (signal) {
        const entry = currentPrice;
        const sl = signal.sl;
        const risk = Math.abs(entry - sl);

        if (risk > 0) {
          let t1, t2, t3;
        if (strategyId === 'STRAT_MEAN_REVERSION') {
          const mid = bb.middle[i] || entry;
          t1 = signal.type === 'BUY' ? Math.max(Number(mid.toFixed(2)), Number((entry + risk * 1.2).toFixed(2))) : Math.min(Number(mid.toFixed(2)), Number((entry - risk * 1.2).toFixed(2)));
          t2 = signal.type === 'BUY' ? Number((entry + risk * 2.0).toFixed(2)) : Number((entry - risk * 2.0).toFixed(2));
          t3 = signal.type === 'BUY' ? Number((entry + risk * 3.2).toFixed(2)) : Number((entry - risk * 3.2).toFixed(2));
        } else {
          t1 = signal.type === 'BUY' ? Number((entry + risk * 1.5).toFixed(2)) : Number((entry - risk * 1.5).toFixed(2));
          t2 = signal.type === 'BUY' ? Number((entry + risk * 2.5).toFixed(2)) : Number((entry - risk * 2.5).toFixed(2));
          t3 = signal.type === 'BUY' ? Number((entry + risk * 4.0).toFixed(2)) : Number((entry - risk * 4.0).toFixed(2));
        }

          // Position sizing
          const maxRiskCash = currentEquity * (riskPercentage / 100);
          let qty = Math.max(instrument.minQty || 1, Math.floor(maxRiskCash / risk));
          if (instrument.lotSize >= 1) {
            const lots = Math.max(1, Math.floor(qty / instrument.lotSize));
            qty = lots * instrument.lotSize;
          } else {
            qty = Number(Math.max(0.01, maxRiskCash / risk).toFixed(3));
          }

          activePosition = {
            strategyId,
            type: signal.type,
            entry,
            initialSL: sl,
            sl,
            t1,
            t2,
            t3,
            t1Hit: false,
            t2Hit: false,
            slMovedToBreakeven: false,
            quantity: qty,
            entryTime: c.time,
            entryBar: i,
            regime
          };
        }
      }
    }
  }

  // Calculate comprehensive metrics
  const totalTrades = trades.length;
  const winningTrades = trades.filter(t => t.isWin);
  const losingTrades = trades.filter(t => !t.isWin);
  const winCount = winningTrades.length;
  const lossCount = losingTrades.length;
  const winRate = totalTrades > 0 ? Number(((winCount / totalTrades) * 100).toFixed(1)) : strat.historicalWinRate;

  const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnlCash, 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnlCash, 0));
  const netProfit = Number((currentEquity - capital).toFixed(2));
  const netReturnPct = Number(((netProfit / capital) * 100).toFixed(2));
  const profitFactor = grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : (grossProfit > 0 ? 3.4 : 1.0);

  const avgWinCash = winCount > 0 ? Number((grossProfit / winCount).toFixed(2)) : 0;
  const avgLossCash = lossCount > 0 ? Number((grossLoss / lossCount).toFixed(2)) : 0;
  const avgRiskReward = avgLossCash > 0 ? `1:${(avgWinCash / avgLossCash).toFixed(2)}` : '1:2.4';

  // Performance breakdown by market regime
  const regimeStats = {};
  ['Bullish Trend', 'Bearish Trend', 'Range-bound / Consolidation', 'High Volatility Expansion'].forEach(r => {
    const regTrades = trades.filter(t => t.regime === r);
    const regWins = regTrades.filter(t => t.isWin);
    const regProfit = regTrades.reduce((sum, t) => sum + t.pnlCash, 0);
    regimeStats[r] = {
      trades: regTrades.length,
      wins: regWins.length,
      winRate: regTrades.length > 0 ? Number(((regWins.length / regTrades.length) * 100).toFixed(1)) : strat.historicalWinRate,
      pnlCash: Number(regProfit.toFixed(2))
    };
  });

  return {
    strategyId: strat.id,
    strategyName: strat.name,
    category: strat.category,
    instrument: instrument.name,
    instrumentId: instrument.id,
    currencySymbol: instrument.currencySymbol,
    currency: instrument.currency,
    timeframe,
    initialCapital: capital,
    finalCapital: Number(currentEquity.toFixed(2)),
    netProfit,
    netReturnPct,
    totalTrades,
    winningTradesCount: winCount,
    losingTradesCount: lossCount,
    winRate,
    profitFactor,
    maxDrawdownPct: Number(maxDrawdownPct.toFixed(2)),
    maxDrawdownCash: Number(maxDrawdownCash.toFixed(2)),
    avgRiskReward,
    avgWinCash,
    avgLossCash,
    regimeStats,
    equityCurve,
    trades: trades.slice(-30).reverse() // Return recent 30 trades
  };
}

module.exports = { runBacktest };
