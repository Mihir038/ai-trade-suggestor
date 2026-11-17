import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

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
    basePrice: 25144.30
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
    basePrice: 61034.10
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
    basePrice: 81592.45
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
  const [prices, setPrices] = useState({});
  const [marketStatuses, setMarketStatuses] = useState({});
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [activeRecommendations, setActiveRecommendations] = useState([]);
  const [completedTrades, setCompletedTrades] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // connected, connecting, disconnected
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
              executedAtFormatted: '17 Nov 2026, 09:06:55 am'
            },
            {
              id: 'SIG-SENSEX-APPROVED-INIT',
              instrumentId: 'SENSEX',
              instrument: 'SENSEX',
              currency: 'INR',
              currencySymbol: '₹',
              signalType: 'BUY',
              entryPrice: 81592.45,
              currentPrice: 82299.49,
              stopLoss: 81364.04,
              target1: 82049.27,
              target2: 82391.89,
              target3: 82734.50,
              riskReward: '1:3.50',
              pnl: 28281.60,
              pnlPercentage: 0.87,
              suggestedLots: 4,
              suggestedQuantity: 40,
              strategyName: 'Smart Money (SMC) - Break of Structure',
              historicalWinRate: '65.2%',
              executedAtFormatted: '17 Nov 2026, 02:10:30 am'
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
    try {
      const res = await fetch('/api/trades/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signalId })
      });
      const data = await res.json();
      if (data.success && data.trade) {
        setPendingApprovals(prev => prev.filter(p => p.id !== signalId));
        setActiveRecommendations(prev => [data.trade, ...prev.filter(r => r.id !== signalId)]);
        // Focus the chart directly on this approved asset
        if (data.trade.instrumentId) {
          setSelectedInstrument(data.trade.instrumentId);
        }
        playSuccessSound();
        return data.trade;
      }
    } catch (err) {
      console.error('Failed to approve trade:', err);
    }
    return null;
  };

  // User Action: Reject / Dismiss a pending trade signal
  const rejectTrade = async (signalId, reason = 'User Dismissed') => {
    try {
      await fetch('/api/trades/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signalId, reason })
      });
      setPendingApprovals(prev => prev.filter(p => p.id !== signalId));
    } catch (err) {
      console.error('Failed to reject trade:', err);
    }
  };

  // Connect WebSocket
  useEffect(() => {
    function connectWS() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;

      console.log('[WebSocket] Connecting to', wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
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
  }, [selectedInstrument, soundEnabled]);

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
      const data = await res.json();
      if (data.success) {
        setOptionChainData(data.optionChain);
      }
    } catch (err) {
      console.error('Failed to fetch option chain:', err);
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
      const data = await res.json();
      if (data.success && data.trade) {
        playAlertSound();
        const pendingRes = await fetch('/api/pending-approvals').then(r => r.json());
        if (pendingRes.success) setPendingApprovals(pendingRes.pendingApprovals);
        return data.trade;
      }
    } catch (err) {
      console.error('Failed to generate option trade:', err);
    }
    return null;
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

