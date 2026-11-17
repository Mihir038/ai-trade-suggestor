/**
 * High-performance Technical Analysis and Market Structure Engine
 * Provides mathematical indicator computations and price action structure detection.
 */

// Simple Moving Average
function calculateSMA(data, period) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j];
      }
      result.push(Number((sum / period).toFixed(4)));
    }
  }
  return result;
}

// Exponential Moving Average
function calculateEMA(data, period) {
  const result = [];
  const multiplier = 2 / (period + 1);
  let firstValidIndex = -1;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      // First EMA is simple average
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[j];
      }
      const initialSMA = sum / period;
      result.push(Number(initialSMA.toFixed(4)));
      firstValidIndex = i;
    } else {
      const prevEMA = result[i - 1];
      const currentEMA = (data[i] - prevEMA) * multiplier + prevEMA;
      result.push(Number(currentEMA.toFixed(4)));
    }
  }
  return result;
}

// Relative Strength Index (RSI - 14)
function calculateRSI(closes, period = 14) {
  const result = [];
  if (closes.length <= period) {
    return closes.map(() => null);
  }

  const gains = [];
  const losses = [];

  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? Math.abs(diff) : 0);
  }

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 0; i < period; i++) {
    avgGain += gains[i];
    avgLoss += losses[i];
  }
  avgGain /= period;
  avgLoss /= period;

  // Fill nulls for initial period
  for (let i = 0; i < period; i++) {
    result.push(null);
  }

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = 100 - (100 / (1 + rs));
  result.push(Number(rsi.toFixed(2)));

  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = 100 - (100 / (1 + rs));
    result.push(Number(rsi.toFixed(2)));
  }

  return result;
}

// Moving Average Convergence Divergence (MACD)
function calculateMACD(closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);
  const macdLine = [];

  for (let i = 0; i < closes.length; i++) {
    if (fastEMA[i] === null || slowEMA[i] === null) {
      macdLine.push(null);
    } else {
      macdLine.push(Number((fastEMA[i] - slowEMA[i]).toFixed(4)));
    }
  }

  // Calculate signal line of macdLine
  const validMacdValues = macdLine.filter(v => v !== null);
  const signalValues = calculateEMA(validMacdValues, signalPeriod);

  const signalLine = [];
  const histogram = [];
  let sigIdx = 0;

  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] === null) {
      signalLine.push(null);
      histogram.push(null);
    } else {
      const sig = signalValues[sigIdx++];
      signalLine.push(sig);
      if (sig !== null && macdLine[i] !== null) {
        histogram.push(Number((macdLine[i] - sig).toFixed(4)));
      } else {
        histogram.push(null);
      }
    }
  }

  return { macdLine, signalLine, histogram };
}

// Bollinger Bands (20, 2)
function calculateBollingerBands(closes, period = 20, multiplier = 2) {
  const sma = calculateSMA(closes, period);
  const upper = [];
  const lower = [];
  const bandwidth = [];
  const percentB = [];

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1 || sma[i] === null) {
      upper.push(null);
      lower.push(null);
      bandwidth.push(null);
      percentB.push(null);
    } else {
      let sumSquares = 0;
      for (let j = 0; j < period; j++) {
        const diff = closes[i - j] - sma[i];
        sumSquares += diff * diff;
      }
      const stdDev = Math.sqrt(sumSquares / period);
      const u = Number((sma[i] + multiplier * stdDev).toFixed(4));
      const l = Number((sma[i] - multiplier * stdDev).toFixed(4));
      upper.push(u);
      lower.push(l);
      const bw = Number(((u - l) / sma[i] * 100).toFixed(2));
      bandwidth.push(bw);
      const pb = Number(((closes[i] - l) / (u - l)).toFixed(4));
      percentB.push(pb);
    }
  }

  return { middle: sma, upper, lower, bandwidth, percentB };
}

// Average True Range (ATR - 14)
function calculateATR(candles, period = 14) {
  const result = [];
  if (candles.length < 2) return candles.map(() => null);

  const trueRanges = [candles[0].high - candles[0].low];

  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const prev = candles[i - 1];
    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - prev.close),
      Math.abs(current.low - prev.close)
    );
    trueRanges.push(tr);
  }

  let atr = 0;
  for (let i = 0; i < period && i < trueRanges.length; i++) {
    atr += trueRanges[i];
    if (i < period - 1) {
      result.push(null);
    }
  }
  atr /= period;
  result.push(Number(atr.toFixed(4)));

  for (let i = period; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period;
    result.push(Number(atr.toFixed(4)));
  }

  return result;
}

// SuperTrend (period = 10, factor = 3)
function calculateSuperTrend(candles, period = 10, factor = 3) {
  const atr = calculateATR(candles, period);
  const result = [];
  let prevTrend = 1; // 1 for bull, -1 for bear
  let prevUpper = 0;
  let prevLower = 0;

  for (let i = 0; i < candles.length; i++) {
    if (atr[i] === null) {
      result.push({ trend: 1, supertrend: null, upper: null, lower: null });
      continue;
    }

    const hl2 = (candles[i].high + candles[i].low) / 2;
    let basicUpper = hl2 + factor * atr[i];
    let basicLower = hl2 - factor * atr[i];

    let upper = basicUpper;
    let lower = basicLower;

    if (i > 0 && result[i - 1].upper !== null) {
      const prevClose = candles[i - 1].close;
      upper = (basicUpper < prevUpper || prevClose > prevUpper) ? basicUpper : prevUpper;
      lower = (basicLower > prevLower || prevClose < prevLower) ? basicLower : prevLower;
    }

    let trend = prevTrend;
    if (candles[i].close > upper) {
      trend = 1;
    } else if (candles[i].close < lower) {
      trend = -1;
    }

    const supertrend = trend === 1 ? lower : upper;

    prevTrend = trend;
    prevUpper = upper;
    prevLower = lower;

    result.push({
      trend,
      supertrend: Number(supertrend.toFixed(4)),
      upper: Number(upper.toFixed(4)),
      lower: Number(lower.toFixed(4))
    });
  }

  return result;
}

// Volume Weighted Average Price (VWAP) with Standard Deviation Bands
function calculateVWAP(candles) {
  let cumulativeTPV = 0;
  let cumulativeVolume = 0;
  const vwapList = [];
  const upper1 = [];
  const lower1 = [];
  const upper2 = [];
  const lower2 = [];

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const typicalPrice = (c.high + c.low + c.close) / 3;
    const vol = c.volume || 1;

    cumulativeTPV += typicalPrice * vol;
    cumulativeVolume += vol;

    const vwap = cumulativeTPV / cumulativeVolume;
    vwapList.push(Number(vwap.toFixed(4)));

    // Cumulative variance for bands
    let varianceSum = 0;
    for (let j = 0; j <= i; j++) {
      const tp = (candles[j].high + candles[j].low + candles[j].close) / 3;
      const v = candles[j].volume || 1;
      varianceSum += v * Math.pow(tp - vwap, 2);
    }
    const stdDev = Math.sqrt(varianceSum / cumulativeVolume);

    upper1.push(Number((vwap + stdDev).toFixed(4)));
    lower1.push(Number((vwap - stdDev).toFixed(4)));
    upper2.push(Number((vwap + 2 * stdDev).toFixed(4)));
    lower2.push(Number((vwap - 2 * stdDev).toFixed(4)));
  }

  return { vwap: vwapList, upper1, lower1, upper2, lower2 };
}

// Classic Floor Pivot Points
function calculatePivotPoints(high, low, close) {
  const p = (high + low + close) / 3;
  const r1 = 2 * p - low;
  const s1 = 2 * p - high;
  const r2 = p + (high - low);
  const s2 = p - (high - low);
  const r3 = high + 2 * (p - low);
  const s3 = low - 2 * (high - p);

  return {
    pivot: Number(p.toFixed(2)),
    r1: Number(r1.toFixed(2)),
    r2: Number(r2.toFixed(2)),
    r3: Number(r3.toFixed(2)),
    s1: Number(s1.toFixed(2)),
    s2: Number(s2.toFixed(2)),
    s3: Number(s3.toFixed(2))
  };
}

// Detect Market Structure: Swing Highs/Lows, BOS, ChoCh, Order Blocks, FVGs
function analyzeMarketStructure(candles) {
  const swingLookback = 3;
  const swingHighs = [];
  const swingLows = [];

  for (let i = swingLookback; i < candles.length - swingLookback; i++) {
    let isHigh = true;
    let isLow = true;
    for (let j = 1; j <= swingLookback; j++) {
      if (candles[i].high <= candles[i - j].high || candles[i].high <= candles[i + j].high) {
        isHigh = false;
      }
      if (candles[i].low >= candles[i - j].low || candles[i].low >= candles[i + j].low) {
        isLow = false;
      }
    }
    if (isHigh) swingHighs.push({ index: i, price: candles[i].high, time: candles[i].time });
    if (isLow) swingLows.push({ index: i, price: candles[i].low, time: candles[i].time });
  }

  // Fair Value Gaps (FVG)
  const fvgs = [];
  for (let i = 2; i < candles.length; i++) {
    // Bullish FVG: candle 1 high < candle 3 low
    if (candles[i].low > candles[i - 2].high) {
      fvgs.push({
        type: 'BULLISH',
        top: candles[i].low,
        bottom: candles[i - 2].high,
        index: i - 1,
        time: candles[i - 1].time
      });
    }
    // Bearish FVG: candle 1 low > candle 3 high
    if (candles[i].high < candles[i - 2].low) {
      fvgs.push({
        type: 'BEARISH',
        top: candles[i - 2].low,
        bottom: candles[i].high,
        index: i - 1,
        time: candles[i - 1].time
      });
    }
  }

  // Break of Structure (BOS) / Change of Character (ChoCh)
  let lastBOS = null;
  const recentHighs = swingHighs.slice(-3);
  const recentLows = swingLows.slice(-3);
  const latestClose = candles[candles.length - 1].close;

  if (recentHighs.length > 0 && latestClose > recentHighs[recentHighs.length - 1].price) {
    lastBOS = {
      type: 'BULLISH_BOS',
      level: recentHighs[recentHighs.length - 1].price,
      description: 'Bullish Break of Structure: Price decisively broke above previous key swing high.'
    };
  } else if (recentLows.length > 0 && latestClose < recentLows[recentLows.length - 1].price) {
    lastBOS = {
      type: 'BEARISH_BOS',
      level: recentLows[recentLows.length - 1].price,
      description: 'Bearish Break of Structure: Price broke below previous key swing low.'
    };
  }

  // Order Blocks (last opposing candle before impulsive displacement)
  const orderBlocks = [];
  for (let i = 1; i < candles.length - 2; i++) {
    const displacement = Math.abs(candles[i + 2].close - candles[i].open);
    const avgBody = Math.abs(candles[i].close - candles[i].open);
    if (displacement > avgBody * 2.5) {
      if (candles[i + 2].close > candles[i].open && candles[i].close < candles[i].open) {
        orderBlocks.push({
          type: 'BULLISH_OB',
          top: candles[i].high,
          bottom: candles[i].low,
          time: candles[i].time
        });
      } else if (candles[i + 2].close < candles[i].open && candles[i].close > candles[i].open) {
        orderBlocks.push({
          type: 'BEARISH_OB',
          top: candles[i].high,
          bottom: candles[i].low,
          time: candles[i].time
        });
      }
    }
  }

  return {
    swingHighs,
    swingLows,
    fvgs: fvgs.slice(-5),
    orderBlocks: orderBlocks.slice(-5),
    lastBOS
  };
}

module.exports = {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateATR,
  calculateSuperTrend,
  calculateVWAP,
  calculatePivotPoints,
  analyzeMarketStructure
};

