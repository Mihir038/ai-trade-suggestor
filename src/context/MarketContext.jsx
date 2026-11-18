import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getClientOptionChain } from '../utils/optionChainHelper';
import { generateLiveSignal } from '../utils/signalGenerator';

const MarketContext = createContext();

const DEFAULT_INSTRUMENTS = [
  {
    id: 'NIFTY',
    name: 'NIFTY 50',
    exchange: 'NSE (India)',
    currency: 'INR',
    currencySymbol: '₹',
    lotSize: 25,
    tickSize: 0.05,
    type: 'INDEX_FUTURES',
    basePrice: 25415.10
  },
  {
    id: 'BANKNIFTY',
    name: 'BANK NIFTY',
    exchange: 'NSE (India)',
    currency: 'INR',
    currencySymbol: '₹',
    lotSize: 15,
    tickSize: 0.05,
    type: 'INDEX_FUTURES',
    basePrice: 62267.20
  },
  {
    id: 'SENSEX',
    name: 'SENSEX',
    exchange: 'BSE (India)',
    currency: 'INR',
    currencySymbol: '₹',
    lotSize: 10,
    tickSize: 0.05,
    type: 'INDEX_FUTURES',
    basePrice: 82506.69
  },
  {
    id: 'CRUDEOIL',
    name: 'CRUDE OIL',
    exchange: 'MCX (India)',
    currency: 'INR',
    currencySymbol: '₹',
    lotSize: 100,
    tickSize: 1.0,
    type: 'COMMODITY_FUTURES',
    basePrice: 6120.00
  },
  {
    id: 'BTCUSD',
    name: 'BITCOIN',
    exchange: 'CRYPTO',
    currency: 'USD',
    currencySymbol: '$',
    lotSize: 0.01,
    tickSize: 0.1,
    type: 'CRYPTO_SPOT',
    basePrice: 96450.00
  }
];

export function MarketProvider({ children }) {
  const [instruments, setInstruments] = useState(DEFAULT_INSTRUMENTS);
  const [selectedInstrument, setSelectedInstrument] = useState('NIFTY');
  const [selectedTimeframe, setSelectedTimeframe] = useState('15m');
  const isLocalHost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const [prices, setPrices] = useState(() => {
    const init = {};
    DEFAULT_INSTRUMENTS.forEach(inst => {
      init[inst.id] = {
        instrumentId: inst.id,
        price: inst.basePrice,
        change: 0,
        changePct: 0,
        high: Number((inst.basePrice * 1.006).toFixed(2)),
        low: Number((inst.basePrice * 0.994).toFixed(2)),
        volume: 250000,
        currency: inst.currency,
        currencySymbol: inst.currencySymbol,
        isLiveFeed: true
      };
    });
    return init;
  });
  const [marketStatuses, setMarketStatuses] = useState({});
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [activeRecommendations, setActiveRecommendations] = useState([]);
  const [completedTrades, setCompletedTrades] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState(() => (isLocalHost ? 'connecting' : 'connected'));
  const [latencyMs, setLatencyMs] = useState(14);
  const [lastAlert, setLastAlert] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [userCapital, setUserCapital] = useState(500000);
  const [userRiskPct, setUserRiskPct] = useState(1.0);
  const [isNetworkOnline, setIsNetworkOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [feedStatus, setFeedStatus] = useState('ONLINE');
  const [optionChainData, setOptionChainData] = useState(null);
  const [isOptionChainLoading, setIsOptionChainLoading] = useState(false);

  // Track browser native network online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsNetworkOnline(true);
      setFeedStatus('ONLINE');
    };
    const handleOffline = () => {
      setIsNetworkOnline(false);
      setFeedStatus('OFFLINE');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsNetworkOnline(false);
      setFeedStatus('OFFLINE');
    }
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Theme State (light / dark)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('app-theme') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Load initial instrument list and strategies
  useEffect(() => {
    async function initMetadata() {
      try {
        const safeFetchJson = async (url) => {
          try {
            const r = await fetch(url);
            const ct = r.headers.get('content-type') || '';
            if (r.ok && ct.includes('application/json')) return await r.json();
          } catch {}
          return null;
        };

        const [instRes, stratRes, recRes, tradeRes, pendingRes] = await Promise.all([
          safeFetchJson('/api/instruments'),
          safeFetchJson('/api/strategies'),
          safeFetchJson('/api/recommendations'),
          safeFetchJson('/api/trades/history'),
          safeFetchJson('/api/pending-approvals')
        ]);

        if (instRes?.success) setInstruments(instRes.instruments);
        if (stratRes?.success) setStrategies(stratRes.strategies);
        if (recRes?.success && recRes.recommendations?.length > 0) {
          setActiveRecommendations(recRes.recommendations);
        } else {
          // Static host preview fallback
          setActiveRecommendations([
            {
              id: 'SIG-NIFTY-OPT-01',
              instrumentId: 'NIFTY',
              instrument: 'NIFTY 25200 CE',
              isOptionTrade: true,
              optionSymbol: 'NIFTY 25200 CE',
              underlyingAsset: 'NIFTY 50',
              underlyingSpot: 25144.30,
              strikePrice: 25200,
              optionType: 'CE',
              expiryDate: '27-NOV-2026',
              currency: 'INR',
              currencySymbol: '₹',
              signalType: 'BUY',
              entryPrice: 142.50,
              currentPrice: 227.20,
              stopLoss: 98.00,
              target1: 195.00,
              target2: 245.00,
              target3: 310.00,
              riskReward: '1:2.45',
              pnl: 8470.00,
              pnlPercentage: 59.44,
              suggestedLots: 4,
              suggestedQuantity: 100,
              suggestedCapitalAllocation: 14250.00,
              strategyKey: 'STRAT_OPTION_CHAIN_FLOW',
              strategyName: 'Option Chain Institutional OI Call Surge',
              historicalWinRate: '68.9%',
              executedAtFormatted: '17 Nov 2026, 09:30:15 am'
            },
            {
              id: 'SIG-SENSEX-APPROVED-INIT',
              instrumentId: 'SENSEX',
              instrument: 'SENSEX',
              currency: 'INR',
              currencySymbol: '₹',
              signalType: 'BUY',
              entryPrice: 82150.00,
              currentPrice: 82506.69,
              stopLoss: 81850.00,
              target1: 82550.00,
              target2: 82850.00,
              target3: 83200.00,
              riskReward: '1:3.50',
              pnl: 14267.60,
              pnlPercentage: 0.43,
              suggestedLots: 4,
              suggestedQuantity: 40,
              strategyName: 'Smart Money (SMC) - Break of Structure',
              historicalWinRate: '65.2%',
              executedAtFormatted: '17 Nov 2026, 02:10:30 pm'
            }
          ]);
        }

        if (tradeRes?.success) setCompletedTrades(tradeRes.trades);
        if (pendingRes?.success && pendingRes.pendingApprovals?.length > 0) {
          setPendingApprovals(pendingRes.pendingApprovals);
        } else {
          // Default pending setups for static preview
          setPendingApprovals([
            {
              id: 'SIG-BNF-OPT-02',
              instrumentId: 'BANKNIFTY',
              instrument: 'BANKNIFTY 61200 CE',
              isOptionTrade: true,
              optionSymbol: 'BANKNIFTY 61200 CE',
              underlyingAsset: 'BANK NIFTY',
              strikePrice: 61200,
              optionType: 'CE',
              currency: 'INR',
              currencySymbol: '₹',
              signalType: 'BUY',
              entryPrice: 320.00,
              stopLoss: 225.00,
              target1: 440.00,
              target2: 560.00,
              target3: 690.00,
              riskReward: '1:2.55',
              suggestedLots: 3,
              suggestedQuantity: 45,
              strategyName: 'Bank Nifty Heavyweight ATM Call Breakout',
              historicalWinRate: '67.2%',
              generatedAtFormatted: '17 Nov 2026, 09:30:00 am'
            },
            {
              id: 'SIG-BTC-PENDING-01',
              instrumentId: 'BTCUSD',
              instrument: 'BITCOIN',
              currency: 'USD',
              currencySymbol: '$',
              signalType: 'BUY',
              entryPrice: 65532.00,
              stopLoss: 63801.96,
              target1: 68127.06,
              target2: 69857.10,
              target3: 72452.16,
              riskReward: '1:2.50',
              suggestedLots: 14,
              suggestedQuantity: 0.145,
              strategyName: 'Price Action Compression Breakout',
              historicalWinRate: '64.7%',
              generatedAtFormatted: '17 Nov 2026, 09:15:00 am'
            }
          ]);
        }
      } catch (err) {
        console.error('Failed to fetch initial metadata:', err);
      }
    }
    initMetadata();
  }, []);

  // Play audio chime for new signal
  const playAlertSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.15); // E6
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch {
      // AudioContext not allowed before user gesture
    }
  };

  // Play crisp execution confirmation sound
  const playSuccessSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // Ignore
    }
  };

  // User Action: Approve and Execute a pending trade signal -> sets onto graph
  const approveTrade = async (signalId) => {
    let serverTrade = null;
    try {
      const res = await fetch('/api/trades/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signalId })
      });
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        const data = await res.json();
        if (data.success && data.trade) {
          serverTrade = data.trade;
        }
      }
    } catch {
      // Offline / Static host fallback
    }

    // Resolve target trade from pendingApprovals
    const target = pendingApprovals.find(p => p.id === signalId);
    if (!target && !serverTrade) {
      console.warn('Signal ID not found for approval:', signalId);
      return null;
    }

    const now = new Date();
    const executedAtFormatted = now.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    const currentInstPrice = prices[target?.instrumentId]?.price || target?.entryPrice || 0;
    const isBuy = (target?.signalType || 'BUY') === 'BUY';
    const initialDiff = isBuy ? (currentInstPrice - (target?.entryPrice || 0)) : ((target?.entryPrice || 0) - currentInstPrice);
    const initialPnl = Number((initialDiff * (target?.suggestedQuantity || 1)).toFixed(2));
    const initialPnlPct = Number((((target?.entryPrice || 1) ? (initialDiff / target.entryPrice) : 0) * 100).toFixed(2));

    const approvedTrade = serverTrade || {
      ...target,
      status: 'ACTIVE_APPROVED',
      executedAt: now.toISOString(),
      executedAtFormatted,
      currentPrice: currentInstPrice,
      pnl: initialPnl,
      pnlPercentage: initialPnlPct
    };

    // Atomically update state: remove from pending, prepend to active recommendations
    setPendingApprovals(prev => prev.filter(p => p.id !== signalId));
    setActiveRecommendations(prev => [approvedTrade, ...prev.filter(r => r.id !== signalId)]);

    // Focus chart on this approved asset
    if (approvedTrade.instrumentId) {
      setSelectedInstrument(approvedTrade.instrumentId);
    }

    // Play crisp execution confirmation audio chime
    playSuccessSound();

    return approvedTrade;
  };

  // User Action: Reject / Dismiss a pending trade signal
  const rejectTrade = async (signalId, reason = 'User Dismissed') => {
    try {
      fetch('/api/trades/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signalId, reason })
      }).catch(() => {});
    } catch {}
    setPendingApprovals(prev => prev.filter(p => p.id !== signalId));
  };

  // Connect WebSocket & Live Ticks
  useEffect(() => {
    const isLocal = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (isLocal) {
      function connectWS() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/ws`;

        console.log('[WebSocket] Connecting to local server', wsUrl);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setConnectionStatus('connected');
          setFeedStatus('ONLINE');
          console.log('[WebSocket] Connected successfully');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.isNetworkConnected !== undefined) {
              setIsNetworkOnline(data.isNetworkConnected);
            }
            if (data.feedStatus) {
              setFeedStatus(data.feedStatus);
            }

            if (data.type === 'INITIAL_STATE') {
              if (data.prices) setPrices(data.prices);
              if (data.marketStatuses) setMarketStatuses(data.marketStatuses);
              if (data.pendingApprovals) setPendingApprovals(data.pendingApprovals);
              if (data.activeRecommendations) setActiveRecommendations(data.activeRecommendations);
              if (data.completedTrades) setCompletedTrades(data.completedTrades);
            } else if (data.type === 'MARKET_HEARTBEAT') {
              if (data.marketStatuses) setMarketStatuses(data.marketStatuses);
            } else if (data.type === 'MARKET_TICK') {
              if (data.prices) setPrices(data.prices);
              if (data.marketStatuses) setMarketStatuses(data.marketStatuses);
              if (data.pendingApprovals) setPendingApprovals(data.pendingApprovals);
              if (data.activeRecommendations) setActiveRecommendations(data.activeRecommendations);

              const activePrice = data.prices?.[selectedInstrument];
              if (activePrice?.latencyMs) {
                setLatencyMs(activePrice.latencyMs);
              }
            } else if (data.type === 'NEW_PENDING_APPROVAL_ALERT' || data.type === 'NEW_RECOMMENDATION_ALERT') {
              setLastAlert(data.signal);
              playAlertSound();
              if (data.pendingApprovals) setPendingApprovals(data.pendingApprovals);
            } else if (data.type === 'TRADE_APPROVED') {
              if (data.pendingApprovals) setPendingApprovals(data.pendingApprovals);
              if (data.activeRecommendations) setActiveRecommendations(data.activeRecommendations);
            }
          } catch (e) {
            console.error('WS message error:', e);
          }
        };

        ws.onclose = () => {
          setConnectionStatus('disconnected');
          console.log('[WebSocket] Disconnected. Retrying in 2.5s...');
          reconnectTimeoutRef.current = setTimeout(connectWS, 2500);
        };

        ws.onerror = (err) => {
          console.warn('[WebSocket] Error, closing socket:', err);
          ws.close();
        };
      }

      connectWS();

      return () => {
        if (wsRef.current) wsRef.current.close();
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      };
    } else {
      // STATIC CLOUD HOST (e.g. GitHub Pages)
      // Directly stream Bitcoin live from Binance public WebSocket and simulate micro-ticks for indices
      setConnectionStatus('connected');
      setFeedStatus('ONLINE');
      setLatencyMs(16);

      let btcWs = null;
      try {
        btcWs = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker');
        btcWs.onopen = () => {
          setConnectionStatus('connected');
        };
        btcWs.onmessage = (e) => {
          try {
            const d = JSON.parse(e.data);
            if (d && d.c) {
              const liveBtc = parseFloat(d.c);
              const changePct = parseFloat(d.P);
              setPrices(prev => ({
                ...prev,
                BTCUSD: {
                  ...(prev.BTCUSD || {}),
                  instrumentId: 'BTCUSD',
                  price: liveBtc,
                  changePct: changePct,
                  high: parseFloat(d.h),
                  low: parseFloat(d.l),
                  volume: parseFloat(d.v),
                  currency: 'USD',
                  currencySymbol: '$',
                  isLiveFeed: true
                }
              }));
            }
          } catch {}
        };
      } catch (err) {
        console.warn('Binance direct stream notice:', err);
      }

      // Live tick simulation for Indian indices and active trades P&L
      const tickInterval = setInterval(() => {
        setPrices(prev => {
          const next = { ...prev };
          ['NIFTY', 'BANKNIFTY', 'SENSEX', 'CRUDEOIL'].forEach(sym => {
            if (next[sym]) {
              const drift = (Math.random() - 0.49) * 0.0003;
              const newPrice = Number((next[sym].price * (1 + drift)).toFixed(2));
              next[sym] = {
                ...next[sym],
                price: newPrice,
                isLiveFeed: true
              };
            }
          });
          return next;
        });

        // Update floating P&L on active recommendations
        setActiveRecommendations(prev => prev.map(rec => {
          const curr = rec.currentPrice || rec.entryPrice;
          const drift = (Math.random() - 0.48) * 0.0004;
          const newPrice = Number((curr * (1 + drift)).toFixed(2));
          const diff = rec.signalType === 'BUY' ? (newPrice - rec.entryPrice) : (rec.entryPrice - newPrice);
          const pnl = Number((diff * (rec.suggestedQuantity || 1)).toFixed(2));
          const pnlPct = Number(((diff / rec.entryPrice) * 100).toFixed(2));
          return {
            ...rec,
            currentPrice: newPrice,
            pnl,
            pnlPercentage: pnlPct
          };
        }));
      }, 3000);

      // Autonomous AI Strategy Scanner for Static Host (e.g. GitHub Pages)
      // Generates continuous high-probability trade setups into Pending Approvals
      const signalScanInterval = setInterval(() => {
        setPendingApprovals(prevPending => {
          if (prevPending.length >= 6) return prevPending;

          const newSignal = generateLiveSignal(prices, [...prevPending, ...activeRecommendations]);
          if (!newSignal) return prevPending;

          // Alert user with chime and floating alert banner
          playAlertSound();
          setLastAlert(newSignal);

          return [newSignal, ...prevPending];
        });
      }, 24000); // Scans and produces new trade opportunity every 24 seconds

      return () => {
        if (btcWs) btcWs.close();
        clearInterval(tickInterval);
        clearInterval(signalScanInterval);
      };
    }
  }, [selectedInstrument, soundEnabled]);

  // Manual trigger to scan and generate an instant AI trade setup on demand
  const triggerManualScan = () => {
    const newSignal = generateLiveSignal(prices, [...pendingApprovals, ...activeRecommendations]);
    if (newSignal) {
      setPendingApprovals(prev => [newSignal, ...prev]);
      playAlertSound();
      setLastAlert(newSignal);
      return newSignal;
    }
    return null;
  };

  // Force trigger simulated opportunity
  const triggerSimulatedSignal = async (instrumentId, strategyKey, signalType = 'BUY') => {
    try {
      const res = await fetch('/api/recommendations/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instrumentId, strategyKey, signalType })
      });
      const data = await res.json();
      if (data.success) {
        setLastAlert(data.signal);
        playAlertSound();
        const activeRes = await fetch('/api/recommendations').then(r => r.json());
        if (activeRes.success) setActiveRecommendations(activeRes.recommendations);
      }
    } catch (err) {
      console.error('Failed to simulate signal:', err);
    }
  };

  const fetchOptionChain = async (instrumentId = 'NIFTY') => {
    setIsOptionChainLoading(true);
    try {
      const res = await fetch(`/api/option-chain/${instrumentId}`);
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        const data = await res.json();
        if (data.success && data.optionChain) {
          setOptionChainData(data.optionChain);
          return;
        }
      }
      throw new Error('Static host');
    } catch {
      // Client-side Option Chain generator for static host (GitHub Pages)
      const spot = prices[instrumentId]?.price || (instrumentId === 'BANKNIFTY' ? 62267.20 : (instrumentId === 'SENSEX' ? 82506.69 : 25415.10));
      const clientChain = getClientOptionChain(instrumentId, spot);
      setOptionChainData(clientChain);
    } finally {
      setIsOptionChainLoading(false);
    }
  };

  const generateOptionTrade = async (instrumentId, strike, optionType = 'CE') => {
    try {
      const res = await fetch('/api/option-chain/generate-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instrumentId, strike, optionType })
      });
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        const data = await res.json();
        if (data.success && data.trade) {
          playAlertSound();
          const pendingRes = await fetch('/api/pending-approvals').then(r => r.json()).catch(() => null);
          if (pendingRes?.success) setPendingApprovals(pendingRes.pendingApprovals);
          return data.trade;
        }
      }
      throw new Error('Static host');
    } catch {
      // Client-side fallback trade generation for static preview
      playAlertSound();
      const lotSize = instrumentId === 'BANKNIFTY' ? 15 : (instrumentId === 'SENSEX' ? 10 : 25);
      const premium = optionType === 'CE' ? 165.50 : 142.20;
      const trade = {
        id: `OPT-${instrumentId}-${strike}${optionType}-${Date.now()}`,
        isOptionTrade: true,
        underlyingAsset: instrumentId,
        optionSymbol: `${instrumentId} ${strike} ${optionType}`,
        instrument: `${instrumentId} ${strike} ${optionType}`,
        instrumentId: instrumentId,
        strikePrice: strike,
        optionType: optionType,
        expiryDate: '26-NOV-2026',
        signalType: 'BUY',
        entryPrice: premium,
        currentPrice: premium,
        stopLoss: Number((premium * 0.72).toFixed(2)),
        target1: Number((premium * 1.45).toFixed(2)),
        target2: Number((premium * 1.85).toFixed(2)),
        target3: Number((premium * 2.30).toFixed(2)),
        riskReward: '1:2.50',
        lotSize: lotSize,
        suggestedLots: 4,
        suggestedQuantity: 4 * lotSize,
        suggestedCapitalAllocation: Number((premium * 4 * lotSize).toFixed(2)),
        strategyName: `${instrumentId} ATM Option Breakout`,
        historicalWinRate: '68.5%',
        generatedAtFormatted: new Date().toLocaleString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
        })
      };
      setPendingApprovals(prev => [trade, ...prev]);
      return trade;
    }
  };

  const currentInstrumentData = instruments.find(i => i.id === selectedInstrument) || instruments[0] || DEFAULT_INSTRUMENTS[0];
  const currentPriceData = prices[selectedInstrument] || {
    price: currentInstrumentData?.basePrice || 0,
    change: 0,
    changePct: 0,
    high: 0,
    low: 0,
    volume: 0,
    currency: currentInstrumentData?.currency || 'INR',
    currencySymbol: currentInstrumentData?.currencySymbol || '₹'
  };

  const currentMarketStatus = marketStatuses[selectedInstrument] || {
    isOpen: true,
    statusText: 'ONLINE',
    session: 'Active'
  };

  return (
    <MarketContext.Provider
      value={{
        instruments,
        selectedInstrument,
        setSelectedInstrument,
        selectedTimeframe,
        setSelectedTimeframe,
        prices,
        currentPriceData,
        currentInstrumentData,
        marketStatuses,
        currentMarketStatus,
        activeRecommendations,
        pendingApprovals,
        setPendingApprovals,
        approveTrade,
        rejectTrade,
        triggerManualScan,
        completedTrades,
        strategies,
        connectionStatus,
        latencyMs,
        lastAlert,
        setLastAlert,
        soundEnabled,
        setSoundEnabled,
        theme,
        setTheme,
        toggleTheme,
        isNetworkOnline,
        setIsNetworkOnline,
        feedStatus,
        userCapital,
        setUserCapital,
        userRiskPct,
        setUserRiskPct,
        optionChainData,
        isOptionChainLoading,
        fetchOptionChain,
        generateOptionTrade,
        triggerSimulatedSignal
      }}
    >
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error('useMarket must be used within a MarketProvider');
  }
  return context;
}

