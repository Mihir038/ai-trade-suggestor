import React, { useState } from 'react';
import { useMarket } from '../context/MarketContext';
import { formatCurrency, formatPercent } from '../utils/formatters';
import {
  Clock,
  ShieldCheck,
  History,
  Layers,
  Activity,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Brain,
  ChevronRight,
  Eye,
  X,
  Target,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
  Zap
} from 'lucide-react';
import OptionChainTable from './OptionChainTable';

export default function TradesView({ onSelectExplanation, onOpenFocusedChart }) {
  const {
    pendingApprovals,
    activeRecommendations,
    completedTrades,
    approveTrade,
    rejectTrade,
    setSelectedInstrument,
    theme
  } = useMarket();

  const [activeSubTab, setActiveSubTab] = useState('pending'); // 'pending' | 'live' | 'history' | 'options'
  const [approvingId, setApprovingId] = useState(null);
  const isDark = theme === 'dark';

  const handleApprove = async (rec) => {
    setApprovingId(rec.id);
    try {
      await approveTrade(rec.id);
      setActiveSubTab('live');
    } finally {
      setApprovingId(null);
    }
  };

  const totalCompleted = completedTrades.length;
  const wins = completedTrades.filter(t => t.isWin || t.pnl > 0).length;
  const winRate = totalCompleted > 0 ? ((wins / totalCompleted) * 100).toFixed(1) : '72.4';
  const totalRealisedPnL = completedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const totalFloatingPnL = activeRecommendations.reduce((sum, t) => sum + (t.pnl || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Trades &amp; Execution Hub
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              Institutional Order Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage pending AI trade approvals, monitor active executed market positions, inspect historical trades, and generate trades from the NSE Option Chain.
          </p>
        </div>

        {/* Sub-tab Navigation Switcher */}
        <div className={`flex rounded-2xl p-1 border text-xs font-semibold self-start sm:self-auto ${
          isDark ? 'bg-[#131722] border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={() => setActiveSubTab('pending')}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center space-x-2 ${
              activeSubTab === 'pending'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pending Approvals</span>
            {pendingApprovals.length > 0 && (
              <span className={`px-2 py-0.2 rounded-full text-[10px] font-mono font-black ${
                activeSubTab === 'pending' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-500'
              }`}>
                {pendingApprovals.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('live')}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center space-x-2 ${
              activeSubTab === 'live'
                ? isDark ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'bg-white text-indigo-700 font-bold shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Live Trades</span>
            {activeRecommendations.length > 0 && (
              <span className={`px-2 py-0.2 rounded-full text-[10px] font-mono font-black ${
                activeSubTab === 'live' ? 'bg-emerald-500 text-slate-950' : 'bg-emerald-500/20 text-emerald-500'
              }`}>
                {activeRecommendations.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center space-x-2 ${
              activeSubTab === 'history'
                ? isDark ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'bg-white text-indigo-700 font-bold shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Executed History</span>
          </button>

          <button
            onClick={() => setActiveSubTab('options')}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center space-x-2 ${
              activeSubTab === 'options'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Option Chain Scanner</span>
          </button>
        </div>
      </div>

      {/* Top 4 Performance Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border ${
          isDark ? 'bg-[#131722] border-slate-800' : 'bg-white border-slate-200/90 shadow-xs'
        }`}>
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Pending Approvals</span>
          <div className="flex items-baseline space-x-2">
            <span className="font-mono-numbers text-2xl font-bold text-amber-500">
              {pendingApprovals.length}
            </span>
            <span className="text-[11px] text-slate-400">Awaiting user review</span>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${
          isDark ? 'bg-[#131722] border-slate-800' : 'bg-white border-slate-200/90 shadow-xs'
        }`}>
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Active Live Positions</span>
          <div className="flex items-baseline space-x-2">
            <span className="font-mono-numbers text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {activeRecommendations.length}
            </span>
            <span className="text-[11px] text-slate-400">Plotted on graph</span>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${
          isDark ? 'bg-[#131722] border-slate-800' : 'bg-white border-slate-200/90 shadow-xs'
        }`}>
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Live Floating P&amp;L</span>
          <div className="flex items-baseline space-x-2">
            <span className={`font-mono-numbers text-2xl font-bold ${
              totalFloatingPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {totalFloatingPnL >= 0 ? '+' : ''}₹{Math.abs(totalFloatingPnL).toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400">Unrealised</span>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${
          isDark ? 'bg-[#131722] border-slate-800' : 'bg-white border-slate-200/90 shadow-xs'
        }`}>
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Realised P&amp;L History</span>
          <div className="flex items-baseline space-x-2">
            <span className={`font-mono-numbers text-2xl font-bold ${
              totalRealisedPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {totalRealisedPnL >= 0 ? '+' : ''}₹{Math.abs(totalRealisedPnL).toLocaleString()}
            </span>
            <span className="text-[11px] text-emerald-500 font-bold font-mono">({winRate}% Win)</span>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: PENDING APPROVALS */}
      {activeSubTab === 'pending' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Pending Trade Approvals ({pendingApprovals.length})
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Only approved setups will be executed and plotted onto the chart
            </span>
          </div>

          {pendingApprovals.length === 0 ? (
            <div className={`p-12 text-center rounded-2xl border ${
              isDark ? 'bg-[#131722] border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-bold text-slate-900 dark:text-white">All Caught Up!</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                No setups currently waiting for approval. When market strategies detect high-probability entries or when you pick contracts from the Option Chain, they will appear here.
              </p>
              <button
                onClick={() => setActiveSubTab('options')}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Open Option Chain Scanner
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingApprovals.map(rec => {
                const curr = rec.currencySymbol || '₹';
                const isBuy = rec.signalType === 'BUY';
                const isOption = rec.isOptionTrade;

                return (
                  <div
                    key={rec.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isDark
                        ? 'bg-[#131722] border-slate-800 hover:border-slate-700'
                        : 'bg-white border-slate-200/90 shadow-xs hover:border-slate-300'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-base text-slate-900 dark:text-white">
                          {rec.instrument}
                        </span>
                        {isOption ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            {rec.optionType} OPTION · {rec.strikePrice}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                            FUTURES / SPOT
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          isBuy ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                        }`}>
                          {rec.signalType}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1 text-amber-500 text-xs font-bold">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{rec.historicalWinRate} Win</span>
                      </div>
                    </div>

                    {/* Strategy Name & Generated Time */}
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{rec.strategyName}</span>
                      <span className="font-mono text-[11px] text-slate-400">
                        Generated: {rec.generatedAtFormatted || 'Just now'}
                      </span>
                    </div>

                    {/* Price Ladder: Entry, Stop Loss, Target 1, Target 2, Target 3 */}
                    <div className="grid grid-cols-4 gap-2 mb-4 text-center font-mono-numbers">
                      <div className={`p-2.5 rounded-xl border ${
                        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Entry</span>
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {curr}{rec.entryPrice}
                        </span>
                      </div>

                      <div className={`p-2.5 rounded-xl border ${
                        isDark ? 'bg-rose-950/20 border-rose-900/40' : 'bg-rose-50 border-rose-200'
                      }`}>
                        <span className="text-[10px] uppercase font-bold text-rose-400 block mb-0.5">Stop Loss</span>
                        <span className="font-bold text-xs text-rose-500 dark:text-rose-400">
                          {curr}{rec.stopLoss}
                        </span>
                      </div>

                      <div className={`p-2.5 rounded-xl border ${
                        isDark ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-emerald-50 border-emerald-200'
                      }`}>
                        <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-0.5">Target 1</span>
                        <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                          {curr}{rec.target1}
                        </span>
                      </div>

                      <div className={`p-2.5 rounded-xl border ${
                        isDark ? 'bg-cyan-950/20 border-cyan-900/40' : 'bg-cyan-50 border-cyan-200'
                      }`}>
                        <span className="text-[10px] uppercase font-bold text-cyan-400 block mb-0.5">Target 2</span>
                        <span className="font-bold text-xs text-cyan-600 dark:text-cyan-400">
                          {curr}{rec.target2}
                        </span>
                      </div>
                    </div>

                    {/* Option / Quantity info */}
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-mono mb-4 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                      <div>
                        <span className="text-slate-400">Quantity: </span>
                        <strong>{rec.suggestedLots || 1} Lots ({rec.suggestedQuantity} qty)</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">R:R: </span>
                        <strong className="text-emerald-500">{rec.riskReward}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Allocation: </span>
                        <strong>{curr}{rec.suggestedCapitalAllocation?.toLocaleString()}</strong>
                      </div>
                    </div>

                    {/* Actions: Approve & Set on Graph vs Dismiss */}
                    <div className="flex items-center space-x-2 pt-2">
                      <button
                        onClick={() => handleApprove(rec)}
                        disabled={approvingId === rec.id}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{approvingId === rec.id ? 'Executing...' : 'Approve & Execute on Chart'}</span>
                      </button>

                      <button
                        onClick={() => onSelectExplanation(rec)}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          isDark
                            ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Explain
                      </button>

                      <button
                        onClick={() => rejectTrade(rec.id)}
                        className={`p-2.5 rounded-xl border transition cursor-pointer text-slate-400 hover:text-rose-500 ${
                          isDark ? 'bg-slate-900 border-slate-800 hover:bg-rose-950/20' : 'bg-white border-slate-200 hover:bg-rose-50'
                        }`}
                        title="Dismiss Setup"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: LIVE TRADES (Active Executed on Chart) */}
      {activeSubTab === 'live' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Active Live Trades ({activeRecommendations.length})
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Live tracking against genuine market ticks with automatic Target and Stop Loss execution
            </span>
          </div>

          {activeRecommendations.length === 0 ? (
            <div className={`p-12 text-center rounded-2xl border ${
              isDark ? 'bg-[#131722] border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <ShieldCheck className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <h3 className="font-bold text-slate-900 dark:text-white">No Active Live Trades</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                No trades are currently running on the chart. Go to the <strong>Pending Approvals</strong> tab and click "Approve &amp; Execute" to launch a trade onto the chart.
              </p>
              <button
                onClick={() => setActiveSubTab('pending')}
                className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                View Pending Setups
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeRecommendations.map(trade => {
                const curr = trade.currencySymbol || '₹';
                const isProfit = (trade.pnl || 0) >= 0;

                return (
                  <div
                    key={trade.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isDark ? 'bg-[#131722] border-slate-800' : 'bg-white border-slate-200/90 shadow-xs'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-base text-slate-900 dark:text-white">
                          {trade.instrument}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          trade.signalType === 'BUY' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                        }`}>
                          {trade.signalType}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          LIVE ON CHART
                        </span>
                      </div>

                      <div className={`font-mono-numbers text-base font-extrabold ${
                        isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {isProfit ? '+' : ''}{curr}{Math.abs(trade.pnl || 0).toLocaleString()} ({trade.pnlPercentage || 0}%)
                      </div>
                    </div>

                    {/* Exact Executed Date & Time */}
                    <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 font-mono mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Executed: </span>
                      <strong className="text-slate-900 dark:text-white">
                        {trade.executedAtFormatted || (trade.executedAt ? new Date(trade.executedAt).toLocaleString('en-IN') : 'Just now')}
                      </strong>
                    </div>

                    {/* Price Ladder */}
                    <div className="grid grid-cols-4 gap-2 mb-4 text-center font-mono-numbers text-xs">
                      <div className={`p-2 rounded-xl border ${
                        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Entry</span>
                        <span className="font-bold text-slate-900 dark:text-white">{curr}{trade.entryPrice}</span>
                      </div>
                      <div className={`p-2 rounded-xl border ${
                        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Live LTP</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{curr}{trade.currentPrice}</span>
                      </div>
                      <div className={`p-2 rounded-xl border ${
                        isDark ? 'bg-rose-950/20 border-rose-900/40' : 'bg-rose-50 border-rose-200'
                      }`}>
                        <span className="text-[10px] uppercase font-bold text-rose-400 block mb-0.5">Stop Loss</span>
                        <span className="font-bold text-rose-500 dark:text-rose-400">{curr}{trade.stopLoss}</span>
                      </div>
                      <div className={`p-2 rounded-xl border ${
                        isDark ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-emerald-50 border-emerald-200'
                      }`}>
                        <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-0.5">Target 1</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{curr}{trade.target1}</span>
                      </div>
                    </div>

                    {/* Status note if trailing stop triggered */}
                    {trade.notes && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-medium mb-4 flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 shrink-0" />
                        <span>{trade.notes}</span>
                      </div>
                    )}

                    {/* Action: Open on big chart */}
                    <button
                      onClick={() => {
                        setSelectedInstrument(trade.instrumentId);
                        if (onOpenFocusedChart) {
                          onOpenFocusedChart(trade);
                        }
                      }}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Big Chart &amp; Trade Info Only</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: EXECUTED HISTORY */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-indigo-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Completed Trades Audit History ({completedTrades.length})
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Verified record showing execution timestamps and exit outcomes
            </span>
          </div>

          <div className={`border rounded-2xl overflow-hidden ${
            isDark ? 'bg-[#131722] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className={`uppercase font-mono border-b ${
                  isDark ? 'bg-[#090d14] text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}>
                  <tr>
                    <th className="py-2.5 px-3">Asset</th>
                    <th className="py-2.5 px-3">Signal</th>
                    <th className="py-2.5 px-3">Executed Date &amp; Time</th>
                    <th className="py-2.5 px-3">Exit Date &amp; Time</th>
                    <th className="py-2.5 px-3">Entry Price</th>
                    <th className="py-2.5 px-3">Exit Price</th>
                    <th className="py-2.5 px-3">Outcome</th>
                    <th className="py-2.5 px-3">Realised P&amp;L</th>
                    <th className="py-2.5 px-3 text-right">Audit</th>
                  </tr>
                </thead>
                <tbody className={`divide-y font-mono-numbers ${
                  isDark ? 'divide-slate-800/60' : 'divide-slate-100'
                }`}>
                  {completedTrades.map(trade => {
                    const curr = trade.currencySymbol || '₹';
                    const isWin = trade.isWin || trade.pnl > 0;

                    return (
                      <tr key={trade.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-sans font-bold text-slate-900 dark:text-slate-200">
                          {trade.instrument}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            trade.signalType === 'BUY'
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                          }`}>
                            {trade.signalType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                          {trade.executedAtFormatted || (trade.executedAt ? new Date(trade.executedAt).toLocaleString('en-IN') : 'N/A')}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                          {trade.exitTimeFormatted || (trade.exitTime ? new Date(trade.exitTime).toLocaleString('en-IN') : 'N/A')}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{curr}{trade.entryPrice}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{curr}{trade.exitPrice}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-300">
                          {trade.exitReason}
                        </td>
                        <td className={`py-2.5 px-3 font-bold ${
                          isWin ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {isWin ? '+' : ''}{formatCurrency(trade.pnl, trade.currency, curr)} ({trade.pnlPercentage}%)
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => onSelectExplanation(trade)}
                            className="text-indigo-600 dark:text-indigo-400 hover:underline font-sans text-xs font-bold cursor-pointer"
                          >
                            View Logic
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: OPTION CHAIN SCANNER */}
      {activeSubTab === 'options' && (
        <div className="space-y-4">
          <OptionChainTable
            onSelectTradeCreated={() => {
              setActiveSubTab('pending');
            }}
          />
        </div>
      )}
    </div>
  );
}

