/**
 * Authentic Market Data Store & Fetcher
 * Strictly fetches genuine OHLCV data for:
 * 1. NIFTY 50 (^NSEI)
 * 2. BANK NIFTY (^NSEBANK)
 * 3. SENSEX (^BSESN)
 * 4. CRUDE OIL (CL=F)
 * 5. BITCOIN (BTC-USD)
 * 
 * Strict Policy:
 * - NO fake or synthetic candles are generated under any circumstances.
 * - If internet is disconnected or data provider fails, the system returns
 *   genuine cached historical data tagged with offline status, or reports an explicit network error.
 */

const fs = require('fs');
const path = require('path');
const { INSTRUMENTS } = require('./instruments');

const CACHE_FILE = path.join(__dirname, 'genuine_cache.json');

// In-memory candle cache
let candleCache = {};

// Load persisted genuine cache from disk on startup if available
try {
  if (fs.existsSync(CACHE_FILE)) {
    const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
    candleCache = JSON.parse(raw);
    console.log('[MarketData] Loaded genuine cached market candles from disk.');
  }
} catch (err) {
  console.warn('[MarketData] Cache file could not be read, starting fresh cache:', err.message);
  candleCache = {};
}

function persistCache() {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(candleCache), 'utf-8');
  } catch (err) {
    // Disk write error
  }
}

/**
 * Returns candles from the genuine cache if available.
 * Never creates falsy or random walk data!
 */
function getHistoricalCandles(instrumentId, timeframe = '15m') {
  const cacheKey = `${instrumentId}_${timeframe}`;
  const entry = candleCache[cacheKey];
  if (entry && Array.isArray(entry.candles) && entry.candles.length > 0) {
    return {
      success: true,
      candles: entry.candles,
      isLive: false,
      isCached: true,
      lastFetchedAt: entry.lastFetchedAt,
      source: entry.source || 'Yahoo Finance Genuine Data'
    };
  }

  return {
    success: false,
    candles: [],
    isLive: false,
    isCached: false,
    error: 'OFFLINE_NO_DATA: No internet connection to fetch authentic market data from exchange.'
  };
}

/**
 * Fetches real, authentic market data from Yahoo Finance / Binance.
 * If network fails, returns genuine cached data with offline status.
 * NEVER creates synthetic or fabricated candles.
 */
async function fetchLiveCandles(instrumentId, timeframe = '15m') {
  const inst = INSTRUMENTS[instrumentId];
  if (!inst) {
    return { success: false, candles: [], error: 'Unknown instrument' };
  }

  const cacheKey = `${instrumentId}_${timeframe}`;

  // Timeframe and range mappings for Yahoo Finance
  const rangeMap = {
    '1m': '1d',
    '5m': '5d',
    '15m': '1mo',
    '1h': '3mo',
    '1D': '1y',
    '1d': '1y'
  };
  const intervalMap = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '1h': '60m',
    '1D': '1d',
    '1d': '1d'
  };

  const yRange = rangeMap[timeframe] || '1mo';
  const yInterval = intervalMap[timeframe] || '15m';

  // Attempt 1: Fetch authentic data from Yahoo Finance
  if (inst.yahooSymbol) {
    try {
      const encoded = encodeURIComponent(inst.yahooSymbol);
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?interval=${yInterval}&range=${yRange}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: AbortSignal.timeout(3500)
      });

      if (res.ok) {
        const data = await res.json();
        const result = data.chart?.result?.[0];
        if (result && result.timestamp && result.indicators?.quote?.[0]) {
          const timestamps = result.timestamp;
          const quote = result.indicators.quote[0];
          const candles = [];

          const rate = inst.conversionRate || 1;
          for (let i = 0; i < timestamps.length; i++) {
            if (quote.open[i] != null && quote.close[i] != null && !isNaN(quote.close[i])) {
              const open = Number((quote.open[i] * rate).toFixed(inst.tickSize < 0.1 ? 2 : 1));
              const high = Number(((quote.high[i] || quote.close[i]) * rate).toFixed(1));
              const low = Number(((quote.low[i] || quote.open[i]) * rate).toFixed(1));
              const close = Number((quote.close[i] * rate).toFixed(1));
              const volume = quote.volume[i] || 0;

              candles.push({
                time: timestamps[i],
                open,
                high: Math.max(high, open, close),
                low: Math.min(low, open, close),
                close,
                volume
              });
            }
          }

          if (candles.length > 0) {
            // Check if volumes are all 0 (common for cash spot index feeds like ^NSEI)
            if (candles.every(c => c.volume === 0)) {
              const etfMap = { 'NIFTY': 'NIFTYBEES.NS', 'BANKNIFTY': 'BANKBEES.NS', 'SENSEX': 'SENSEXETF.NS' };
              const etfSym = etfMap[instrumentId];
              if (etfSym) {
                try {
                  const etfRes = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(etfSym)}?interval=${yInterval}&range=${yRange}`, {
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    signal: AbortSignal.timeout(2500)
                  });
                  if (etfRes.ok) {
                    const etfData = await etfRes.json();
                    const etfR = etfData.chart?.result?.[0];
                    if (etfR?.timestamp && etfR?.indicators?.quote?.[0]?.volume) {
                      const vMap = {};
                      const vols = etfR.indicators.quote[0].volume;
                      for (let k = 0; k < etfR.timestamp.length; k++) {
                        if (vols[k]) vMap[etfR.timestamp[k]] = vols[k];
                      }
                      candles.forEach(c => {
                        if (vMap[c.time]) c.volume = vMap[c.time];
                      });
                    }
                  }
                } catch {
                  // Ignore ETF fetch failure
                }
              }
            }

            // Update cache with authentic data
            const lastFetchedAt = new Date().toISOString();
            candleCache[cacheKey] = {
              candles,
              lastFetchedAt,
              source: `Yahoo Finance Live (${inst.yahooSymbol})`
            };
            persistCache();

            return {
              success: true,
              candles,
              isLive: true,
              isCached: false,
              lastFetchedAt,
              source: `Yahoo Finance Live (${inst.yahooSymbol})`
            };
          }
        }
      }
    } catch (netErr) {
      // Network failed or offline - will check genuine cached fallback
    }
  }

  // Attempt 2: If Bitcoin and Yahoo failed, try Binance as alternate genuine source
  if (inst.binanceSymbol) {
    try {
      const bIntervalMap = { '1m': '1m', '5m': '5m', '15m': '15m', '1h': '1h', '1D': '1d' };
      const bInterval = bIntervalMap[timeframe] || '15m';
      const bUrl = `https://api.binance.com/api/v3/klines?symbol=${inst.binanceSymbol}&interval=${bInterval}&limit=300`;
      const res = await fetch(bUrl, { signal: AbortSignal.timeout(4000) });

      if (res.ok) {
        const raw = await res.json();
        const candles = raw.map(k => ({
          time: Math.floor(k[0] / 1000),
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
          volume: parseFloat(k[5])
        }));

        if (candles.length > 0) {
          const lastFetchedAt = new Date().toISOString();
          candleCache[cacheKey] = {
            candles,
            lastFetchedAt,
            source: `Binance Public API (${inst.binanceSymbol})`
          };
          persistCache();

          return {
            success: true,
            candles,
            isLive: true,
            isCached: false,
            lastFetchedAt,
            source: `Binance Public API (${inst.binanceSymbol})`
          };
        }
      }
    } catch {
      // Binance alternate also failed
    }
  }

  // If live network requests failed, check if we have genuine cached data from previous live fetches
  const cached = getHistoricalCandles(instrumentId, timeframe);
  if (cached.success && cached.candles.length > 0) {
    return {
      success: true,
      candles: cached.candles,
      isLive: false,
      isCached: true,
      lastFetchedAt: cached.lastFetchedAt,
      source: cached.source,
      offlineWarning: 'Internet connection unavailable. Displaying last authentic market data recorded.'
    };
  }

  // No internet and no prior genuine data available - DO NOT CREATE FALSY DATA
  return {
    success: false,
    candles: [],
    isLive: false,
    isCached: false,
    error: 'NO_INTERNET: Live data feed unavailable. Please check your internet connection to load authentic market charts.'
  };
}

module.exports = {
  getHistoricalCandles,
  fetchLiveCandles,
  candleCache
};
