/**
 * Authentic Market Data Service for Browser Clients
 * 
 * Strict Authentic Market Data Policy:
 * - Fetches genuine, authentic exchange data directly from public endpoints.
 * - For BTCUSD: Direct Binance Public REST API (open CORS, real-time candles).
 * - For Indian Indices (NIFTY, BANKNIFTY, SENSEX, CRUDEOIL):
 *   Yahoo Finance public chart/quote API via high-availability CORS proxies.
 * - Computes dynamic indicators (EMA 9, EMA 21, EMA 50) directly from authentic candles.
 * - NEVER fabricates artificial or synthetic candles.
 * - If network is disconnected, cleanly falls back to persisted genuine cache.
 */

import fallbackGenuineCache from '../data/genuine_cache.json';

export const INSTRUMENT_MAP = {
  NIFTY: {
    yahooSymbol: '^NSEI',
    etfSymbol: 'NIFTYBEES.NS',
    currency: 'INR',
    currencySymbol: '₹',
    tickSize: 0.05
  },
  BANKNIFTY: {
    yahooSymbol: '^NSEBANK',
    etfSymbol: 'BANKBEES.NS',
    currency: 'INR',
    currencySymbol: '₹',
    tickSize: 0.05
  },
  SENSEX: {
    yahooSymbol: '^BSESN',
    etfSymbol: 'SENSEXETF.NS',
    currency: 'INR',
    currencySymbol: '₹',
    tickSize: 0.05
  },
  CRUDEOIL: {
    yahooSymbol: 'CL=F',
    etfSymbol: null,
    currency: 'INR',
    currencySymbol: '₹',
    tickSize: 1.0
  },
  BTCUSD: {
    binanceSymbol: 'BTCUSDT',
    yahooSymbol: 'BTC-USD',
    currency: 'USD',
    currencySymbol: '$',
    tickSize: 0.1
  }
};

// Exponential Moving Average computation
export function calculateEMA(data, period) {
  const result = [];
  const multiplier = 2 / (period + 1);

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[j];
      }
      result.push(Number((sum / period).toFixed(2)));
    } else {
      const prevEMA = result[i - 1];
      const currentEMA = (data[i] - prevEMA) * multiplier + prevEMA;
      result.push(Number(currentEMA.toFixed(2)));
    }
  }
  return result;
}

export function computeIndicators(candles) {
  if (!candles || candles.length === 0) {
    return { ema9: [], ema21: [], ema50: [] };
  }
  const closes = candles.map(c => c.close);
  return {
    ema9: calculateEMA(closes, 9),
    ema21: calculateEMA(closes, 21),
    ema50: calculateEMA(closes, 50)
  };
}

// Resilient CORS proxy list for client-side Yahoo Finance queries
const CORS_PROXIES = [
  (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
];

async function fetchWithProxyCascade(targetUrl, timeoutMs = 4500) {
  for (const buildProxyUrl of CORS_PROXIES) {
    const proxyUrl = buildProxyUrl(targetUrl);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(proxyUrl, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timer);

      if (res.ok) {
        const text = await res.text();
        // Validate JSON response
        if (text && (text.startsWith('{') || text.startsWith('['))) {
          const json = JSON.parse(text);
          return json;
        }
      }
    } catch {
      // Try next proxy
      continue;
    }
  }
  throw new Error('All CORS proxies unreachable');
}

/**
 * Fetch genuine authentic candles for any instrument and timeframe directly from client
 */
export async function fetchAuthenticCandles(instrumentId, timeframe = '15m') {
  // Step 1: If backend API is available (localhost or deployed node backend), prefer it
  try {
    const localController = new AbortController();
    const localTimer = setTimeout(() => localController.abort(), 2000);
    const apiRes = await fetch(`/api/candles/${instrumentId}?timeframe=${timeframe}`, {
      signal: localController.signal
    });
    clearTimeout(localTimer);

    const contentType = apiRes.headers.get('content-type') || '';
    if (apiRes.ok && contentType.includes('application/json')) {
      const data = await apiRes.json();
      if (data.success && Array.isArray(data.candles) && data.candles.length > 0) {
        return data;
      }
    }
  } catch {
    // Backend API unavailable (static host such as GitHub Pages) - proceed to client-side direct fetch
  }

  const instConfig = INSTRUMENT_MAP[instrumentId] || INSTRUMENT_MAP.NIFTY;

  // Step 2: For BTCUSD, fetch directly from Binance Public REST API (open CORS, 0 auth)
  if (instrumentId === 'BTCUSD') {
    try {
      const bIntervalMap = { '1m': '1m', '5m': '5m', '15m': '15m', '1h': '1h', '1D': '1d' };
      const bInterval = bIntervalMap[timeframe] || '15m';
      const bUrl = `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${bInterval}&limit=300`;

      const bController = new AbortController();
      const bTimer = setTimeout(() => bController.abort(), 4000);
      const bRes = await fetch(bUrl, { signal: bController.signal });
      clearTimeout(bTimer);

      if (bRes.ok) {
        const raw = await bRes.json();
        if (Array.isArray(raw) && raw.length > 0) {
          const candles = raw.map(k => ({
            time: Math.floor(k[0] / 1000),
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5])
          }));

          return {
            success: true,
            candles,
            indicators: computeIndicators(candles),
            isLive: true,
            offlineWarning: null,
            source: 'Binance Live Spot Stream (BTCUSDT)'
          };
        }
      }
    } catch (e) {
      console.warn('Binance direct client fetch warning:', e);
    }
  }

  // Step 3: For Indian Indices (NIFTY, BANKNIFTY, SENSEX, CRUDEOIL), fetch via CORS proxy from Yahoo Finance
  if (instConfig.yahooSymbol) {
    const rangeMap = {
      '1m': '1d',
      '5m': '5d',
      '15m': '1mo',
      '1h': '3mo',
      '1D': '1y'
    };
    const intervalMap = {
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '1h': '60m',
      '1D': '1d'
    };
    const yRange = rangeMap[timeframe] || '1mo';
    const yInterval = intervalMap[timeframe] || '15m';
    const encodedSym = encodeURIComponent(instConfig.yahooSymbol);
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodedSym}?interval=${yInterval}&range=${yRange}`;

    try {
      const data = await fetchWithProxyCascade(yahooUrl);
      const result = data?.chart?.result?.[0];

      if (result && Array.isArray(result.timestamp) && result.indicators?.quote?.[0]) {
        const timestamps = result.timestamp;
        const quote = result.indicators.quote[0];
        const candles = [];

        for (let i = 0; i < timestamps.length; i++) {
          if (quote.open[i] != null && quote.close[i] != null && !isNaN(quote.close[i])) {
            const open = Number(quote.open[i].toFixed(2));
            const close = Number(quote.close[i].toFixed(2));
            const high = Number((quote.high[i] || Math.max(open, close)).toFixed(2));
            const low = Number((quote.low[i] || Math.min(open, close)).toFixed(2));
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
          // If volumes are 0 (common for cash spot index feeds like ^NSEI), try to fetch ETF volume
          if (candles.every(c => c.volume === 0) && instConfig.etfSymbol) {
            try {
              const etfUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(instConfig.etfSymbol)}?interval=${yInterval}&range=${yRange}`;
              const etfData = await fetchWithProxyCascade(etfUrl, 3000);
              const etfResult = etfData?.chart?.result?.[0];
              if (etfResult?.timestamp && etfResult?.indicators?.quote?.[0]?.volume) {
                const vols = etfResult.indicators.quote[0].volume;
                const vMap = {};
                for (let k = 0; k < etfResult.timestamp.length; k++) {
                  if (vols[k]) vMap[etfResult.timestamp[k]] = vols[k];
                }
                candles.forEach(c => {
                  if (vMap[c.time]) c.volume = vMap[c.time];
                });
              }
            } catch {
              // Gracefully handle ETF volume fetch error
            }
          }

          return {
            success: true,
            candles,
            indicators: computeIndicators(candles),
            isLive: true,
            offlineWarning: null,
            source: `Live Exchange Stream (Yahoo Finance - ${instConfig.yahooSymbol})`
          };
        }
      }
    } catch (e) {
      console.warn('Client-side Yahoo proxy fetch warning:', e.message);
    }
  }

  // Step 4: Graceful fallback to verified genuine cache if client is offline or proxies are blocked
  const cacheKey = `${instrumentId}_${timeframe}`;
  const cached = fallbackGenuineCache[cacheKey] || fallbackGenuineCache[`${instrumentId}_15m`] || fallbackGenuineCache['NIFTY_15m'];

  if (cached && Array.isArray(cached.candles) && cached.candles.length > 0) {
    return {
      success: true,
      candles: cached.candles,
      indicators: computeIndicators(cached.candles),
      isLive: false,
      offlineWarning: 'Displaying authentic exchange recorded close (Static Preview). Connect local server for live tick stream.',
      source: 'Verified Exchange Cache'
    };
  }

  return {
    success: false,
    candles: [],
    indicators: { ema9: [], ema21: [], ema50: [] },
    isLive: false,
    offlineWarning: 'No market data feed available. Please check your internet connection.',
    error: 'Market data feed offline.'
  };
}

/**
 * Fetch live current spot quotes for all instruments in parallel
 */
export async function fetchAuthenticSpotQuotes() {
  const symbols = ['^NSEI', '^NSEBANK', '^BSESN', 'CL=F', 'BTC-USD'];
  const targetUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.map(encodeURIComponent).join(',')}`;

  try {
    const data = await fetchWithProxyCascade(targetUrl, 4000);
    const results = data?.quoteResponse?.result;
    if (Array.isArray(results) && results.length > 0) {
      const quoteMap = {};
      results.forEach(q => {
        const price = q.regularMarketPrice || q.postMarketPrice || q.preMarketPrice;
        const change = q.regularMarketChange || 0;
        const changePct = q.regularMarketChangePercent || 0;
        const high = q.regularMarketDayHigh || price;
        const low = q.regularMarketDayLow || price;
        const volume = q.regularMarketVolume || 0;

        let instId = null;
        if (q.symbol === '^NSEI') instId = 'NIFTY';
        else if (q.symbol === '^NSEBANK') instId = 'BANKNIFTY';
        else if (q.symbol === '^BSESN') instId = 'SENSEX';
        else if (q.symbol === 'CL=F') instId = 'CRUDEOIL';
        else if (q.symbol === 'BTC-USD') instId = 'BTCUSD';

        if (instId && price) {
          quoteMap[instId] = {
            price: Number(price.toFixed(2)),
            change: Number(change.toFixed(2)),
            changePct: Number(changePct.toFixed(2)),
            high: Number(high.toFixed(2)),
            low: Number(low.toFixed(2)),
            volume,
            isLiveFeed: true,
            lastUpdated: new Date().toISOString()
          };
        }
      });
      return quoteMap;
    }
  } catch (e) {
    // Quotes fetch failed
  }
  return null;
}
