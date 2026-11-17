import React, { useState, useEffect } from 'react';
import { useMarket } from '../context/MarketContext';
import { formatCurrency, formatPercent, formatDateTime } from '../utils/formatters';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Award,
  Layers,
  Activity,
  ShieldAlert,
  Target,
  RefreshCw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sliders,
  DollarSign
} from 'lucide-react';

export default function BacktestLab() {
  const { instruments, strategies, selectedInstrument, theme } = useMarket();
  const isDark = theme === 'dark';

  const [selectedStrat, setSelectedStrat] = useState('STRAT_TREND_MOMENTUM');
  const [selectedInst, setSelectedInst] = useState(selectedInstrument || 'NIFTY');
  const [selectedTf, setSelectedTf] = useState('15m');
  const [capital, setCapital] = useState(500000);
  const [riskPct, setRiskPct] = useState(1.0);

  const [backtestData, setBacktestData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedInst === 'BTCUSD' || selectedInst === 'CRUDEOIL') {
      if (capital > 50000) setCapital(25000);
    } else {
      if (capital < 50000) setCapital(500000);
    }
  }, [selectedInst]);

  const executeBacktest = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategyId: selectedStrat,
          instrumentId: selectedInst,
          timeframe: selectedTf,
          initialCapital: capital,
          riskPercentage: riskPct
        })
      });
      const data = await res.json();
      if (data.success) {
        setBacktestData(data.result);
      }
    } catch (err) {
      console.error('Failed to run backtest:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    executeBacktest();
  }, []);

  const curr = backtestData?.currencySymbol || '₹';

  // Calculate coordinates for SVG equity curve
  const renderEquityCurve = () => {
    if (!backtestData?.equityCurve || backtestData.equityCurve.length < 2) return null;

    const points = backtestData.equityCurve;
    const equities = points.map(p => p.equity);
    const minEq = Math.min(...equities) * 0.995;
    const maxEq = Math.max(...equities) * 1.005;
    const range = maxEq - minEq || 1;

    const width = 800;
    const height = 220;

    const coords = points.map((p, idx) => {
      const x = (idx / (points.length - 1)) * width;
      const y = height - ((p.equity - minEq) / range) * (height - 30) - 15;
      return `${x},${y}`;
    }).join(' ');

    const isProfitable = backtestData.netProfit >= 0;
    const strokeColor = '#6366f1';
    const areaCoords = `${coords} ${width},${height} 0,${height}`;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="eqGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {/* Baseline grid lines */}
        <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke={isDark ? '#1e293b' : '#f1f5f9'} strokeDasharray="4" />
        <line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} stroke={isDark ? '#1e293b' : '#f1f5f9'} strokeDasharray="4" />
        <line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke={isDark ? '#1e293b' : '#f1f5f9'} strokeDasharray="4" />

        {/* Shaded Area */}
        <polygon points={areaCoords} fill="url(#eqGradient)" />

        {/* Equity Line */}
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={coords}
        />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Overview */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Strategy Backtesting &amp; Quantitative Lab
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Bar-by-bar historical simulation with dynamic trailing stops, slippage, and regime analysis.
          </p>
        </div>

        <button
          onClick={executeBacktest}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50 text-xs"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Simulating Strategy...' : 'Run Quantitative Backtest'}</span>
        </button>
      </div>

      {/* Interactive Backtest Controls Panel */}
      <div className={`border rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 ${
        isDark ? 'bg-[#131722] border-slate-800 shadow-sm' : 'bg-white border-slate-200/90 shadow-xs'
      }`}>
        {/* Strategy Selector */}
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">
            Trading Strategy
          </label>
          <select
            value={selectedStrat}
            onChange={(e) => setSelectedStrat(e.target.value)}
            className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            {strategies.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.historicalWinRate}%)
              </option>
            ))}
          </select>
        </div>

        {/* Instrument Selector */}
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">
            Trading Asset
          </label>
          <select
            value={selectedInst}
            onChange={(e) => setSelectedInst(e.target.value)}
            className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            {instruments.map(inst => (
              <option key={inst.id} value={inst.id}>
                {inst.name} ({inst.currency})
              </option>
            ))}
          </select>
        </div>

        {/* Timeframe Selector */}
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">
            Candle Timeframe
          </label>
          <select
            value={selectedTf}
            onChange={(e) => setSelectedTf(e.target.value)}
            className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <option value="1m">1 Minute (Ultra Scalp)</option>
            <option value="5m">5 Minutes (Intraday Momentum)</option>
            <option value="15m">15 Minutes (Standard Swing)</option>
            <option value="1h">1 Hour (Macro Trend)</option>
            <option value="1D">1 Day (Multi-Week Position)</option>
          </select>
        </div>

        {/* Initial Capital */}
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">
            Initial Capital
          </label>
          <input
            type="number"
            value={capital}
            onChange={(e) => setCapital(Number(e.target.value))}
            className={`w-full border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-indigo-500 ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
            min="1000"
            step="10000"
          />
        </div>

        {/* Risk Percentage Per Trade */}
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">
            Risk Per Trade (%)
          </label>
          <input
            type="number"
            value={riskPct}
            onChange={(e) => setRiskPct(Number(e.target.value))}
            className={`w-full border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-indigo-500 ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
            min="0.25"
            max="5"
            step="0.25"
          />
        </div>
      </div>

      {/* KPI Performance Metrics Grid */}
      {backtestData && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Win Rate */}
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-[#131722] border-slate-800' : 'bg-white border-slate-200/90 shadow-xs'
          }`}>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Historical Win Rate
            </span>
            <span className="font-mono-numbers text-xl font-black text-amber-600 dark:text-amber-300">
              {backtestData.winRate}%
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              {backtestData.winningTradesCount} W / {backtestData.losingTradesCount} L
            </span>
          </div>

          {/* Profit Factor */}
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-[#131722] border-slate-800' : 'bg-white border-slate-200/90 shadow-xs'
          }`}>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Profit Factor
            </span>
            <span className="font-mono-numbers text-xl font-black text-emerald-600 dark:text-emerald-400">
              {backtestData.profitFactor}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              Gross Win / Gross Loss
            </span>
          </div>

          {/* Net Profit Cash & % */}
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-[#131722] border-slate-800' : 'bg-white border-slate-200/90 shadow-xs'
          }`}>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Net Profit / Loss
            </span>
            <span className={`font-mono-numbers text-xl font-black ${
              backtestData.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {formatCurrency(backtestData.netProfit, backtestData.currency, curr)}
            </span>
            <span className={`text-[11px] font-bold block mt-1 ${
              backtestData.netReturnPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {formatPercent(backtestData.netReturnPct)} Return
            </span>
          </div>

          {/* Maximum Drawdown */}
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-[#131722] border-slate-800' : 'bg-white border-slate-200/90 shadow-xs'
          }`}>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Max Drawdown
            </span>
            <span className="font-mono-numbers text-xl font-black text-rose-600 dark:text-rose-400">
              {backtestData.maxDrawdownPct}%
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              {formatCurrency(backtestData.maxDrawdownCash, backtestData.currency, curr)} Peak
            </span>
          </div>

          {/* Average Risk-Reward Ratio */}
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-[#131722] border-slate-800' : 'bg-white border-slate-200/90 shadow-xs'
          }`}>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Avg Risk / Reward
            </span>
            <span className="font-mono-numbers text-xl font-black text-teal-600 dark:text-teal-300">
              {backtestData.avgRiskReward}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              Asymmetric Edge
            </span>
          </div>

          {/* Total Trades Executed */}
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-[#131722] border-slate-800' : 'bg-white border-slate-200/90 shadow-xs'
          }`}>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Total Trades
            </span>
            <span className="font-mono-numbers text-xl font-black text-slate-900 dark:text-white">
              {backtestData.totalTrades}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              Historical Sample
            </span>
          </div>
        </div>
      )}

      {/* Equity Growth Curve Visualization */}
      <div className={`p-6 rounded-2xl border ${
        isDark ? 'bg-[#131722] border-slate-800 shadow-sm' : 'bg-white border-slate-200/90 shadow-xs'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Equity Curve Growth &amp; Capital Compounding
            </h3>
          </div>
          {backtestData && (
            <div className="text-xs font-mono-numbers text-slate-500 dark:text-slate-400">
              Start: {formatCurrency(backtestData.initialCapital, backtestData.currency, curr)} → End:{' '}
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                {formatCurrency(backtestData.finalCapital, backtestData.currency, curr)}
              </strong>
            </div>
          )}
        </div>

        <div className={`w-full h-56 relative rounded-xl p-2 border ${
          isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50/70 border-slate-200/80'
        }`}>
          {renderEquityCurve()}
        </div>
      </div>

      {/* Market Regimes Breakdown Table */}
      {backtestData?.regimeStats && (
        <div className={`p-6 rounded-2xl border ${
          isDark ? 'bg-[#131722] border-slate-800 shadow-sm' : 'bg-white border-slate-200/90 shadow-xs'
        }`}>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-amber-500" />
            <span>Performance Across Different Market Regimes</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className={`uppercase font-mono border-b ${
                isDark ? 'bg-slate-900/80 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}>
                <tr>
                  <th className="py-2.5 px-3">Market Regime</th>
                  <th className="py-2.5 px-3">Trades Executed</th>
                  <th className="py-2.5 px-3">Winning Trades</th>
                  <th className="py-2.5 px-3">Win Rate (%)</th>
                  <th className="py-2.5 px-3">Net Realised P&amp;L</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-mono-numbers ${
                isDark ? 'divide-slate-800/60' : 'divide-slate-100'
              }`}>
                {Object.entries(backtestData.regimeStats).map(([regime, stat]) => (
                  <tr key={regime} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-800 dark:text-slate-200">
                      {regime}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{stat.trades}</td>
                    <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-semibold">{stat.wins}</td>
                    <td className="py-2.5 px-3 font-bold text-amber-600 dark:text-amber-300">{stat.winRate}%</td>
                    <td className={`py-2.5 px-3 font-bold ${
                      stat.pnlCash >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {formatCurrency(stat.pnlCash, backtestData.currency, curr)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transparent Historical Trade Execution Log */}
      {backtestData?.trades && (
        <div className={`p-6 rounded-2xl border ${
          isDark ? 'bg-[#131722] border-slate-800 shadow-sm' : 'bg-white border-slate-200/90 shadow-xs'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
              <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Transparent Historical Trade Execution Log (Recent Trades)</span>
            </h3>
            <span className="text-xs text-slate-400">
              Simulated bar-by-bar execution without lookahead bias
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className={`uppercase font-mono border-b ${
                isDark ? 'bg-slate-900/80 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}>
                <tr>
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Entry Time</th>
                  <th className="py-2.5 px-3">Entry Price</th>
                  <th className="py-2.5 px-3">Exit Price</th>
                  <th className="py-2.5 px-3">Exit Reason</th>
                  <th className="py-2.5 px-3">P&amp;L ({curr})</th>
                  <th className="py-2.5 px-3">P&amp;L (%)</th>
                  <th className="py-2.5 px-3">Running Equity</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-mono-numbers ${
                isDark ? 'divide-slate-800/60' : 'divide-slate-100'
              }`}>
                {backtestData.trades.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 text-slate-400">{t.id}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.type === 'BUY'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                      }`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{formatDateTime(t.entryTime)}</td>
                    <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 font-semibold">{curr}{t.entryPrice}</td>
                    <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 font-semibold">{curr}{t.exitPrice}</td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-sans">{t.exitReason}</td>
                    <td className={`py-2.5 px-3 font-bold ${
                      t.isWin ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {t.isWin ? '+' : ''}{formatCurrency(t.pnlCash, backtestData.currency, curr)}
                    </td>
                    <td className={`py-2.5 px-3 font-bold ${
                      t.pnlPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {formatPercent(t.pnlPct)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 font-semibold">{curr}{t.runningEquity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
