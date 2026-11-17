import React, { useState } from 'react';
import { useMarket } from '../context/MarketContext';
import { formatCurrency, formatPercent } from '../utils/formatters';
import {
  ArrowLeft,
  Clock,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Maximize2,
  Brain,
  Sparkles,
  Layers,
  ChevronRight,
  Target,
  ShieldAlert,
  Zap
} from 'lucide-react';
import MiniTradeChart from './MiniTradeChart';
import LiveChart from './LiveChart';

export default function LiveChartsCollageView({ onSelectExplanation }) {
  const {
    activeRecommendations,
    selectedInstrument,
    setSelectedInstrument,
    theme
  } = useMarket();

  const [focusedTradeId, setFocusedTradeId] = useState(null);
  const isDark = theme === 'dark';

  const focusedTrade = activeRecommendations.find(t => t.id === focusedTradeId);

  // If user clicked on a trade card, show only that trade info with big chart and info of it trade only. No extra.
  if (focusedTrade) {
    const curr = focusedTrade.currencySymbol || '₹';
    const isProfit = (focusedTrade.pnl || 0) >= 0;
    const isOption = focusedTrade.isOptionTrade;

    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Navigation & Focused Trade Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setFocusedTradeId(null)}
              className={`p-2 rounded-xl border transition cursor-pointer flex items-center space-x-2 text-xs font-bold ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Approved Collage</span>
            </button>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {focusedTrade.instrument}
                </h1>
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                  focusedTrade.signalType === 'BUY'
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                }`}>
                  {focusedTrade.signalType}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  APPROVED &amp; ACTIVE
                </span>
              </div>
            </div>
          </div>

          {/* Execution Time & Live Floating P&L */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>Executed:</span>
              <strong className="text-slate-900 dark:text-white">
                {focusedTrade.executedAtFormatted || (focusedTrade.executedAt ? new Date(focusedTrade.executedAt).toLocaleString('en-IN') : 'Just now')}
              </strong>
            </div>

            <div className={`px-3 py-1.5 rounded-xl font-mono-numbers text-sm font-extrabold border ${
              isProfit
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
            }`}>
              Live P&amp;L: {isProfit ? '+' : ''}{curr}{Math.abs(focusedTrade.pnl || 0).toLocaleString()} ({focusedTrade.pnlPercentage || 0}%)
            </div>
          </div>
        </div>

        {/* Big Chart */}
        <div>
          <LiveChart />
        </div>

        {/* Dedicated Trade Info Panel Only ("info of it trade only. No extra.") */}
        <div className={`p-6 rounded-2xl border ${
          isDark ? 'bg-[#131722] border-slate-800 shadow-sm' : 'bg-white border-slate-200/90 shadow-xs'
        }`}>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-5">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Active Execution Specifications &amp; Risk Parameters
              </h2>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Strategy: <strong className="text-slate-900 dark:text-white">{focusedTrade.strategyName}</strong> ({focusedTrade.historicalWinRate} Win)
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 font-mono-numbers">
            <div className={`p-3 rounded-xl border ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Execution Price</span>
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">{curr}{focusedTrade.entryPrice}</span>
            </div>

            <div className={`p-3 rounded-xl border ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Current Live Price</span>
              <span className="font-extrabold text-sm text-indigo-600 dark:text-indigo-400">{curr}{focusedTrade.currentPrice}</span>
            </div>

            <div className={`p-3 rounded-xl border ${
              isDark ? 'bg-rose-950/20 border-rose-900/40' : 'bg-rose-50 border-rose-200'
            }`}>
              <span className="text-[10px] uppercase font-bold text-rose-400 block mb-0.5">Stop Loss</span>
              <span className="font-extrabold text-sm text-rose-500 dark:text-rose-400">{curr}{focusedTrade.stopLoss}</span>
            </div>

            <div className={`p-3 rounded-xl border ${
              isDark ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-emerald-50 border-emerald-200'
            }`}>
              <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-0.5">Target 1 (50% Out)</span>
              <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">{curr}{focusedTrade.target1}</span>
            </div>

            <div className={`p-3 rounded-xl border ${
              isDark ? 'bg-cyan-950/20 border-cyan-900/40' : 'bg-cyan-50 border-cyan-200'
            }`}>
              <span className="text-[10px] uppercase font-bold text-cyan-400 block mb-0.5">Target 2 (30% Out)</span>
              <span className="font-extrabold text-sm text-cyan-600 dark:text-cyan-400">{curr}{focusedTrade.target2}</span>
            </div>

            <div className={`p-3 rounded-xl border ${
              isDark ? 'bg-cyan-950/20 border-cyan-900/40' : 'bg-cyan-50 border-cyan-200'
            }`}>
              <span className="text-[10px] uppercase font-bold text-cyan-400 block mb-0.5">Target 3 (Runner)</span>
              <span className="font-extrabold text-sm text-cyan-600 dark:text-cyan-400">{curr}{focusedTrade.target3}</span>
            </div>
          </div>

          {/* Option Specs (If Option Trade) */}
          {isOption && (
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 mb-5 text-xs text-purple-700 dark:text-purple-300 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <Layers className="w-4 h-4 text-purple-500" />
                <span className="font-bold">Option Contract: {focusedTrade.optionSymbol}</span>
                <span>Expiry: {focusedTrade.expiryDate}</span>
                <span>Type: {focusedTrade.optionType}</span>
                <span>Strike: ₹{focusedTrade.strikePrice}</span>
              </div>
              <div className="font-mono text-[11px]">
                Delta: {focusedTrade.greeks?.delta || 0.5} | IV: {focusedTrade.greeks?.iv || '14%'}
              </div>
            </div>
          )}

          {/* Allocation & Invalidation details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
            } space-y-2`}>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Position Sizing &amp; Capital</span>
              <div className="flex justify-between font-mono">
                <span className="text-slate-400">Position Quantity:</span>
                <span className="font-bold text-slate-900 dark:text-white">{focusedTrade.suggestedLots || 1} Lots ({focusedTrade.suggestedQuantity} qty)</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-400">Capital Deployed:</span>
                <span className="font-bold text-slate-900 dark:text-white">{curr}{focusedTrade.suggestedCapitalAllocation?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-400">Planned Risk:Reward:</span>
                <span className="font-bold text-emerald-500">{focusedTrade.riskReward}</span>
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
            } space-y-2`}>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Execution Reason &amp; Invalidation</span>
              <p className="text-slate-700 dark:text-slate-300">
                {focusedTrade.invalidationCondition || 'Loss of structural baseline or candle close beyond Stop Loss triggers automatic exit.'}
              </p>
              {focusedTrade.notes && (
                <div className="pt-1 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{focusedTrade.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // COLLAGE MODE: Grid of all approved trades
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Approved Live Trades Collage
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {activeRecommendations.length} Active On Graph
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Collage of all approved trades with live charts, exact execution timestamps, and real-time floating P&amp;L. Click any card to expand into single focus mode.
          </p>
        </div>
      </div>

      {/* No approved trades fallback */}
      {activeRecommendations.length === 0 ? (
        <div className={`p-16 text-center rounded-2xl border ${
          isDark ? 'bg-[#131722] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <ShieldCheck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            No Approved Trades Currently Set on Graph
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Signals wait in <strong>Pending Approvals</strong> until you approve them. Once approved, their charts and live P&amp;L will be displayed in this collage.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeRecommendations.map(trade => {
            const curr = trade.currencySymbol || '₹';
            const isProfit = (trade.pnl || 0) >= 0;
            const isBuy = trade.signalType === 'BUY';
            const isOption = trade.isOptionTrade;

            return (
              <div
                key={trade.id}
                onClick={() => {
                  setSelectedInstrument(trade.instrumentId);
                  setFocusedTradeId(trade.id);
                }}
                className={`rounded-2xl border overflow-hidden transition-all duration-200 cursor-pointer group ${
                  isDark
                    ? 'bg-[#131722] border-slate-800 hover:border-indigo-500/80 shadow-md hover:shadow-indigo-500/10'
                    : 'bg-white border-slate-200/90 hover:border-indigo-400 shadow-xs hover:shadow-md'
                }`}
              >
                {/* Card Top Header */}
                <div className={`p-4 border-b flex items-center justify-between ${
                  isDark ? 'bg-[#0d111a] border-slate-800' : 'bg-slate-50 border-slate-200/80'
                }`}>
                  <div className="flex items-center space-x-2.5">
                    <span className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">
                      {trade.instrument}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      isBuy ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                    }`}>
                      {trade.signalType}
                    </span>
                    {isOption && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        {trade.optionType} OPTION
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-mono text-slate-400">
                      Exec: {trade.executedAtFormatted?.split(',')[1]?.trim() || trade.executedAtFormatted || 'Just now'}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                {/* Mini Chart Canvas */}
                <div className="p-3">
                  <MiniTradeChart trade={trade} height={220} />
                </div>

                {/* Below Chart: Live P&L and Trade Info */}
                <div className={`p-4 border-t space-y-3 ${
                  isDark ? 'bg-[#0f141f] border-slate-800' : 'bg-slate-50/70 border-slate-100'
                }`}>
                  {/* Floating P&L Bar */}
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Live Floating P&amp;L</span>
                      <span className={`font-mono-numbers text-xl font-black ${
                        isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {isProfit ? '+' : ''}{curr}{Math.abs(trade.pnl || 0).toLocaleString()} ({trade.pnlPercentage || 0}%)
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Live Quote</span>
                      <span className="font-mono-numbers text-sm font-bold text-slate-900 dark:text-white">
                        {curr}{trade.currentPrice}
                      </span>
                    </div>
                  </div>

                  {/* Execution Date & Time + Key Levels */}
                  <div className="grid grid-cols-3 gap-2 pt-1 font-mono-numbers text-xs text-center">
                    <div className={`p-2 rounded-xl border ${
                      isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Entry Price</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{curr}{trade.entryPrice}</span>
                    </div>

                    <div className={`p-2 rounded-xl border ${
                      isDark ? 'bg-rose-950/20 border-rose-900/40' : 'bg-white border-rose-200'
                    }`}>
                      <span className="text-[9px] uppercase font-bold text-rose-400 block">Stop Loss</span>
                      <span className="font-bold text-rose-500 dark:text-rose-400">{curr}{trade.stopLoss}</span>
                    </div>

                    <div className={`p-2 rounded-xl border ${
                      isDark ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-white border-emerald-200'
                    }`}>
                      <span className="text-[9px] uppercase font-bold text-emerald-400 block">Target 1</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{curr}{trade.target1}</span>
                    </div>
                  </div>

                  {/* Click to expand pill */}
                  <div className="flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-bold pt-1">
                    <div className="flex items-center space-x-1.5 font-mono text-[11px] text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{trade.executedAtFormatted || 'Just now'}</span>
                    </div>
                    <div className="flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                      <span>Click for Big Chart &amp; Info Only</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

