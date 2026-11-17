/**
 * Client-side Option Chain Generator for Static Hosting (e.g. GitHub Pages)
 */

function standardNormalCDF(x) {
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.sqrt(2.0);

  const t = 1.0 / (1.0 + p * absX);
  const erf = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return 0.5 * (1.0 + sign * erf);
}

function calculateOptionGreeks(spotPrice, strikePrice, daysToExpiry = 4, iv = 0.14, riskFreeRate = 0.065) {
  const T = Math.max(daysToExpiry / 365, 0.002);
  const S = spotPrice;
  const K = strikePrice;
  const sigma = iv;
  const r = riskFreeRate;

  const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  const callDelta = Number(standardNormalCDF(d1).toFixed(2));
  const putDelta = Number((callDelta - 1).toFixed(2));

  const callPrice = Math.max(0.5, Number((S * standardNormalCDF(d1) - K * Math.exp(-r * T) * standardNormalCDF(d2)).toFixed(2)));
  const putPrice = Math.max(0.5, Number((K * Math.exp(-r * T) * standardNormalCDF(-d2) - S * standardNormalCDF(-d1)).toFixed(2)));

  return {
    callPrice,
    putPrice,
    callDelta,
    putDelta,
    iv: `${(iv * 100).toFixed(1)}%`
  };
}

export function getClientOptionChain(instrumentId = 'NIFTY', spotPrice = 25291.10) {
  let step = 50;
  let lotSize = 25;
  let defaultIv = 0.138;

  if (instrumentId === 'BANKNIFTY') {
    step = 100;
    lotSize = 15;
    defaultIv = 0.165;
  } else if (instrumentId === 'SENSEX') {
    step = 100;
    lotSize = 10;
    defaultIv = 0.125;
  }

  const atmStrike = Math.round(spotPrice / step) * step;
  const expiry = '26-NOV-2026';
  const strikes = [];

  for (let i = -5; i <= 5; i++) {
    const strike = atmStrike + (i * step);
    const greeks = calculateOptionGreeks(spotPrice, strike, 4, defaultIv);
    const distFromAtm = Math.abs(i);
    const callOI = Math.max(15000, Math.floor(250000 / (1 + distFromAtm * 0.45)));
    const putOI = Math.max(16000, Math.floor(240000 / (1 + distFromAtm * 0.42)));

    strikes.push({
      strike,
      isAtm: i === 0,
      isItmCall: strike < spotPrice,
      isItmPut: strike > spotPrice,
      call: {
        symbol: `${instrumentId} ${strike} CE`,
        ltp: greeks.callPrice,
        delta: greeks.callDelta,
        oi: callOI,
        volume: Math.floor(callOI * 1.6),
        iv: greeks.iv
      },
      put: {
        symbol: `${instrumentId} ${strike} PE`,
        ltp: greeks.putPrice,
        delta: greeks.putDelta,
        oi: putOI,
        volume: Math.floor(putOI * 1.5),
        iv: greeks.iv
      }
    });
  }

  return {
    instrumentId,
    spotPrice,
    expiry,
    lotSize,
    atmStrike,
    pcr: 1.04,
    strikes
  };
}
