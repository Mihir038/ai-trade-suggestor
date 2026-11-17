import React, { useState, useEffect } from 'react';
import { useMarket } from '../context/MarketContext';
import { formatCurrency, formatPercent } from '../utils/formatters';
import {
  TrendingUp,
  TrendingDown,
  Target,
  ShieldAlert,
  Brain,
  Award,
  ChevronRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  X,
  Eye,
  Sparkles,
  Layers
} from 'lucide-react';

export default function TradeRecommendations({ onSelectExplanation, forceTab }) {
  const {
    activeRecommendations,
    pendingApprovals,
    approveTrade,
    rejectTrade,
    selectedInstrument,
    setSelectedInstrument,
    theme
  } = useMarket();

  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState(() => forceTab || (pendingApprovals && pendingApprovals.length > 0 ? 'pending' : 'approved'));
  const [approvingId, setApprovingId] = useState(null);

  useEffect(() => {
    if (forceTab) {
      setActiveTab(forceTab);
    }
  }, [forceTab]);

  const handleApprove = async (rec) => {
    setApprovingId(rec.id);
    try {
      await approveTrade(rec.id);
      // Auto switch view to approved tab so user sees it in active list
      setActiveTab('approved');
    } finally {
      setApprovingId(null);
    }
  };

  const handleDismiss = async (rec) => {
    await rejectTrade(rec.id);
  };

  const currentList = activeTab === 'pending' ? pendingApprovals : activeRecommendations;

  return (
    <div className="space-y-4">
      {/* Top Header & Section Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-live-glow" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            AI Trade Recommendation Engine
          </h2>
        </div>

        {/* Segmented Mode Selector: Pending Approvals vs Approved & Executed */}
        <div className={`flex rounded-xl p-0.5 border text-xs font-semibold ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Approvals</span>
            {pendingApprovals.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                activeTab === 'pending' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-500'
              }`}>
                {pendingApprovals.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('approved')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'approved'
                ? isDark
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Executed on Chart</span>
            {activeRecommendations.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                activeTab === 'approved'
                  ? isDark ? 'bg-indigo-900 text-indigo-200' : 'bg-indigo-100 text-indigo-700'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}>
                {activeRecommendations.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Empty State */}
      {(!currentList || currentList.length === 0) && (
        <div className={`border rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-3 ${
          isDark ? 'bg-[#131722] border-slate-800' : 'bg-white border-slate-200/90 shadow-xs'
        }`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            isDark ? 'bg-slate-800 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
          }`}>
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {activeTab === 'pending' ? 'No Pending Approvals' : 'No Active Executed Trades'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
              {activeTab === 'pending'
                ? 'The AI engine is monitoring market structure. New high-probability setups will arrive here for your explicit authorization before plotting on chart.'
                : 'Approve setups from the Pending Approvals tab to set their exact Entry, Stop Loss, and Targets directly onto the live graph.'}
            </p>
          </div>
        </div>
      )}

      {/* Cards List */}
      <div className="grid grid-cols-1 gap-4">
        {currentList.map(rec => {
          const isBuy = rec.signalType === 'BUY';
          const isApproved = activeTab === 'approved' || rec.isApproved;
          const isCurrentSelected = selectedInstrument === rec.instrumentId;
          const currPrice = rec.currentPrice || rec.entryPrice;
          const curr = rec.currencySymbol || '₹';

          const pointsDiff = isBuy ? (currPrice - rec.entryPrice) : (rec.entryPrice - currPrice);
          const pnlCash = Number((pointsDiff * rec.suggestedQuantity).toFixed(2));
          const pnlPct = Number(((pointsDiff / rec.entryPrice) * 100).toFixed(2));
          const isProfitable = pnlCash >= 0;

          // Points distance for SL and targets
          const slPoints = Math.abs(rec.entryPrice - rec.stopLoss).toFixed(1);
          const t1Points = Math.abs(rec.target1 - rec.entryPrice).toFixed(1);
          const t2Points = Math.abs(rec.target2 - rec.entryPrice).toFixed(1);
          const t3Points = Math.abs(rec.target3 - rec.entryPrice).toFixed(1);

          return (
            <div
              key={rec.id}
              className={`rounded-2xl border transition duration-200 overflow-hidden relative ${
                isCurrentSelected
                  ? isDark
                    ? 'bg-slate-900/95 border-indigo-500/70 shadow-lg ring-1 ring-indigo-500/30'
                    : 'bg-white border-indigo-500 shadow-md ring-1 ring-indigo-500/20'
                  : isDark
                  ? 'bg-[#131722] border-slate-800 hover:border-slate-700'
                  : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-xs'
              }`}
            >
              {/* Top Bar: Asset, Direction Badge, Status */}
              <div className={`px-4 py-3 border-b flex items-center justify-between gap-2 ${
                isDark ? 'border-slate-800/80 bg-[#0c1018]' : 'border-slate-100 bg-slate-50/80'
              }`}>
                {/* Left: Asset + Timeframe + Buy/Sell */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedInstrument(rec.instrumentId)}
                    className="flex items-center space-x-1.5 text-left transition cursor-pointer group"
                    title={`Click to view ${rec.instrument} chart`}
                  >
                    <span className={`font-extrabold text-sm tracking-tight ${
                      isDark ? 'text-white group-hover:text-indigo-400' : 'text-slate-900 group-hover:text-indigo-600'
                    }`}>
                      {rec.instrument}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                      isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200/80 text-slate-700'
                    }`}>
                      {rec.timeframe}
                    </span>
                  </button>

                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider flex items-center border ${
                    isBuy
                      ? isDark
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : isDark
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {isBuy ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                    {rec.signalType}
                  </span>
                </div>

                {/* Right: Floating PnL badge if active, or Pending Badge */}
                {isApproved ? (
                  <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl font-mono text-xs font-bold border ${
                    isProfitable
                      ? isDark
                        ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-400'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : isDark
                      ? 'bg-rose-950/30 border-rose-800/50 text-rose-400'
                      : 'bg-rose-50 border-rose-200 text-rose-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isProfitable ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                    <span>
                      {isProfitable ? '+' : ''}{formatCurrency(pnlCash, rec.currency, curr)}
                    </span>
                    <span className="text-[10px] opacity-80">
                      ({isProfitable ? '+' : ''}{pnlPct}%)
                    </span>
                  </div>
                ) : (
                  <span className="px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/25 flex items-center space-x-1">
                    <Clock className="w-3 h-3 mr-1 animate-spin" />
                    <span>AWAITING APPROVAL</span>
                  </span>
                )}
              </div>

              {/* Execution / Generation Audit Ribbon */}
              <div className={`px-4 py-2 border-b flex flex-wrap items-center justify-between text-xs gap-2 ${
                isDark ? 'border-slate-800/50 bg-[#0f141e]/50' : 'border-slate-100 bg-white'
              }`}>
                <div className="flex items-center space-x-1.5 truncate pr-2">
                  <Brain className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300 truncate text-[11px]">
                    {rec.strategyName}
                  </span>
                </div>

                {/* Exact Date & Time Tracking */}
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    <Clock className="w-3 h-3 text-indigo-500" />
                    <span>{isApproved ? 'Executed:' : 'Generated:'}</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                      {isApproved
                        ? (rec.executedAtFormatted || rec.executedAt)
                        : (rec.generatedAtFormatted || rec.generatedAt)}
                    </strong>
                  </div>

                  <div className={`shrink-0 flex items-center space-x-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold ${
                    isDark
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}>
                    <Award className="w-3 h-3" />
                    <span>{rec.historicalWinRate} Win</span>
                  </div>
                </div>
              </div>

              {/* Core Execution Levels: Multi-Tier Structure */}
              <div className="p-4 space-y-3">
                {/* Tier 1: Entry & Stop Loss (2 columns) */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Entry Price */}
                  <div className={`p-3 rounded-xl border ${
                    isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50/90 border-slate-200/80'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        Entry Price
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 font-bold">
                        {isApproved ? 'TRIGGERED' : 'PENDING'}
                      </span>
                    </div>
                    <div className={`font-mono-numbers text-sm font-extrabold truncate ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      {formatCurrency(rec.entryPrice, rec.currency, curr)}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Market Limit Order
                    </div>
                  </div>

                  {/* Stop Loss */}
                  <div className={`p-3 rounded-xl border ${
                    isDark ? 'bg-rose-950/20 border-rose-900/40' : 'bg-rose-50/80 border-rose-200/80'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-rose-600 dark:text-rose-400 flex items-center">
                        <ShieldAlert className="w-3 h-3 mr-1" />
                        Stop Loss
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-500 dark:text-rose-400 font-bold">
                        PROTECT
                      </span>
                    </div>
                    <div className="font-mono-numbers text-sm font-extrabold text-rose-600 dark:text-rose-300 truncate">
                      {formatCurrency(rec.stopLoss, rec.currency, curr)}
                    </div>
                    <div className="text-[10px] text-rose-600/90 dark:text-rose-400/90 mt-0.5 truncate">
                      Risk: {rec.riskPercentage} (-{slPoints} pts)
                    </div>
                  </div>
                </div>

                {/* Tier 2: Multi-Stage Take Profit Ladder (3 columns) */}
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center justify-between">
                    <span>Take-Profit Target Levels</span>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      Planned R:R {rec.riskReward}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Target 1 */}
                    <div className={`p-2.5 rounded-xl border text-center ${
                      isDark ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-emerald-50/70 border-emerald-200/70'
                    }`}>
                      <div className="text-[9px] uppercase font-bold text-emerald-700 dark:text-emerald-400 mb-0.5">
                        T1 (50% Out)
                      </div>
                      <div className="font-mono-numbers text-xs font-extrabold text-emerald-700 dark:text-emerald-300 truncate">
                        {formatCurrency(rec.target1, rec.currency, curr)}
                      </div>
                      <div className="text-[9px] font-mono font-semibold text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                        +{t1Points} pts
                      </div>
                    </div>

                    {/* Target 2 */}
                    <div className={`p-2.5 rounded-xl border text-center ${
                      isDark ? 'bg-emerald-950/30 border-emerald-900/50' : 'bg-emerald-50 border-emerald-200'
                    }`}>
                      <div className="text-[9px] uppercase font-bold text-emerald-700 dark:text-emerald-400 mb-0.5">
                        T2 (30% Out)
                      </div>
                      <div className="font-mono-numbers text-xs font-extrabold text-emerald-700 dark:text-emerald-200 truncate">
                        {formatCurrency(rec.target2, rec.currency, curr)}
                      </div>
                      <div className="text-[9px] font-mono font-semibold text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                        +{t2Points} pts
                      </div>
                    </div>

                    {/* Target 3 */}
                    <div className={`p-2.5 rounded-xl border text-center ${
                      isDark ? 'bg-teal-950/30 border-teal-900/50' : 'bg-teal-50 border-teal-200'
                    }`}>
                      <div className="text-[9px] uppercase font-bold text-teal-700 dark:text-teal-400 mb-0.5">
                        T3 (Runner)
                      </div>
                      <div className="font-mono-numbers text-xs font-extrabold text-teal-700 dark:text-teal-200 truncate">
                        {formatCurrency(rec.target3, rec.currency, curr)}
                      </div>
                      <div className="text-[9px] font-mono font-semibold text-teal-600/80 dark:text-teal-400/80 mt-0.5">
                        +{t3Points} pts
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tier 3: Sizing & Capital Allocation Bar */}
                <div className={`p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs ${
                  isDark ? 'bg-slate-950/50 border-slate-800/80' : 'bg-slate-50/80 border-slate-200/70'
                }`}>
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Size:</span>
                    <span className={`font-mono-numbers font-bold truncate ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      {rec.suggestedLots} Lots ({rec.suggestedQuantity} Qty)
                    </span>
                  </div>
                  <div className={`flex items-center space-x-1.5 font-mono text-[11px] shrink-0 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    <span>Allocated:</span>
                    <strong className={isDark ? 'text-white' : 'text-slate-900'}>
                      {formatCurrency(rec.suggestedCapitalAllocation, rec.currency, curr)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Bottom Actions: Approvals, Chart Setting, and AI Analysis */}
              <div className={`px-4 py-3 border-t flex flex-wrap items-center justify-between gap-2.5 ${
                isDark ? 'bg-[#0a0e16] border-slate-800/70' : 'bg-slate-50/90 border-slate-100'
              }`}>
                {/* Left Action / Status Indicator */}
                {!isApproved ? (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleApprove(rec)}
                      disabled={approvingId === rec.id}
                      className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm cursor-pointer disabled:opacity-50"
                      title="Approve setup and set price lines directly onto live graph"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{approvingId === rec.id ? 'Setting on Chart...' : 'Approve & Set on Graph'}</span>
                    </button>

                    <button
                      onClick={() => handleDismiss(rec)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                      title="Dismiss this pending signal"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedInstrument(rec.instrumentId)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/25 transition cursor-pointer"
                      title="Focus the live graph on this active asset"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View on Graph</span>
                    </button>
                    <span className="text-[11px] font-mono text-emerald-500 font-semibold flex items-center">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                      Live on Chart
                    </span>
                  </div>
                )}

                {/* Right: Explain Trade Logic Action */}
                <button
                  onClick={() => onSelectExplanation(rec)}
                  className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    isDark
                      ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Brain className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Explain Logic</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
