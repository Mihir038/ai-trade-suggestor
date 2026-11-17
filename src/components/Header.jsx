import React, { useState, useEffect } from 'react';
import { useMarket } from '../context/MarketContext';
import { formatCurrency, formatPercent } from '../utils/formatters';
import {
  Activity,
  Zap,
  TrendingUp,
  TrendingDown,
  Volume2,
  VolumeX,
  Clock,
  Radio,
  SlidersHorizontal,
  Layers,
  Sparkles,
  BarChart3,
  Cpu
} from 'lucide-react';

export default function Header({ activeTab, setActiveTab }) {
  const {
    instruments,
    selectedInstrument,
    setSelectedInstrument,
    prices,
    marketStatuses,
    activeRecommendations,
    connectionStatus,
    latencyMs,
    soundEnabled,
    setSoundEnabled,
    triggerSimulatedSignal
  } = useMarket();

  const [currentTimeIST, setCurrentTimeIST] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      // Formatted in IST
      const istString = d.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      setCurrentTimeIST(istString);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-slate-800/80 bg-[#0d111a]/95 backdrop-blur-md sticky top-0 z-50">
      {/* Top Meta Bar */}
      <div className="max-w-[1780px] mx-auto px-4 py-2 border-b border-slate-800/40 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
        {/* Left: Branding & Status */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 font-bold text-slate-100 text-sm tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Cpu className="w-4 h-4 text-slate-900" />
            </div>
            <span>AI TRADE SUGGESTOR</span>
            <span className="px-1.5 py-0.5 text-[10px] uppercase font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
              PRO INTELLIGENCE
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden md:block"></div>

          {/* Connection status */}
          <div className="flex items-center space-x-1.5">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                connectionStatus === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}></span>
            </span>
            <span className="text-slate-300 font-medium">
              {connectionStatus === 'connected' ? 'LIVE FEED ACTIVE' : 'RECONNECTING...'}
            </span>
            <span className="px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded text-[10px] font-mono-numbers">
              {latencyMs}ms
            </span>
          </div>
        </div>

        {/* Right: Clock & Quick Actions */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 text-slate-300 font-mono-numbers">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>IST: {currentTimeIST}</span>
            <span className="text-slate-500 text-[10px]">(NSE/BSE/MCX)</span>
          </div>

          <div className="h-4 w-px bg-slate-800"></div>

          {/* Audio Chime Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1.5 rounded transition ${
              soundEnabled ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:bg-slate-800'
            }`}
            title={soundEnabled ? 'Audio Alerts Enabled' : 'Audio Alerts Muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Manual AI Scan Button */}
          <button
            onClick={() => triggerSimulatedSignal(selectedInstrument, 'STRAT_TREND_MOMENTUM', 'BUY')}
            className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-medium transition cursor-pointer text-xs"
            title="Force run instant strategy scanner for active instrument"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Trigger AI Scan</span>
          </button>
        </div>
      </div>

      {/* Five Instruments Ticker Bar */}
      <div className="max-w-[1780px] mx-auto px-4 py-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center space-x-2.5 min-w-max">
          {instruments.map(inst => {
            const priceObj = prices[inst.id] || { price: inst.basePrice, changePct: 0, change: 0 };
            const isSelected = selectedInstrument === inst.id;
            const isUp = (priceObj.changePct || 0) >= 0;
            const activeSigs = activeRecommendations.filter(r => r.instrumentId === inst.id);
            const mStatus = marketStatuses[inst.id];

            return (
              <button
                key={inst.id}
                onClick={() => setSelectedInstrument(inst.id)}
                className={`px-3 py-2 rounded-lg border text-left transition relative flex flex-col justify-between w-56 ${
                  isSelected
                    ? 'bg-slate-800/90 border-emerald-500/60 shadow-lg shadow-emerald-950/20'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-xs text-slate-100">{inst.name}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">{inst.currency}</span>
                  </div>
                  {activeSigs.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                      {activeSigs.length} SIGNAL{activeSigs.length > 1 ? 'S' : ''}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between w-full">
                  <span className="font-mono-numbers font-bold text-sm text-slate-100">
                    {formatCurrency(priceObj.price, inst.currency, inst.currencySymbol)}
                  </span>
                  <div className={`flex items-center text-xs font-mono-numbers font-semibold ${
                    isUp ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {isUp ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                    <span>{formatPercent(priceObj.changePct)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                  <span>Lot: {inst.lotSize}</span>
                  <span className={`${mStatus?.isOpen ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {mStatus?.isOpen ? '• Live Market' : '• Active Stream'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-[1780px] mx-auto px-4 flex items-center space-x-1 border-t border-slate-800/60 text-xs font-medium">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center space-x-2 py-2.5 px-3 border-b-2 font-semibold transition ${
            activeTab === 'dashboard'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Live Trading Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('backtest')}
          className={`flex items-center space-x-2 py-2.5 px-3 border-b-2 font-semibold transition ${
            activeTab === 'backtest'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Strategy Backtesting Lab</span>
        </button>

        <button
          onClick={() => setActiveTab('scanner')}
          className={`flex items-center space-x-2 py-2.5 px-3 border-b-2 font-semibold transition ${
            activeTab === 'scanner'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>AI Multi-Timeframe Scanner</span>
        </button>

        <button
          onClick={() => setActiveTab('strategies')}
          className={`flex items-center space-x-2 py-2.5 px-3 border-b-2 font-semibold transition ${
            activeTab === 'strategies'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Trading Strategies & Knowledge Base</span>
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex items-center space-x-2 py-2.5 px-3 border-b-2 font-semibold transition ${
            activeTab === 'calculator'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Position Sizing & Risk Calculator</span>
        </button>
      </div>
    </header>
  );
}

