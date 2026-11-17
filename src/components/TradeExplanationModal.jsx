import React, { useState, useEffect } from 'react';
import { useMarket } from '../context/MarketContext';
import {
  X,
  Brain,
  Award,
  ShieldAlert,
  Target,
  AlertTriangle,
  Compass,
  CheckCircle2,
  Sparkles,
  Layers
} from 'lucide-react';

export default function TradeExplanationModal({ trade, onClose }) {
  const { theme } = useMarket();
  const isDark = theme === 'dark';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!trade) return;
    setLoading(true);

    fetch(`/api/recommendations/${trade.id}/explanation`)
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setData(res);
        }
      })
      .catch(err => console.error('Failed to load trade explanation:', err))
      .finally(() => setLoading(false));
  }, [trade]);

  if (!trade) return null;

  const isBuy = trade.signalType === 'BUY';
  const curr = trade.currencySymbol || '₹';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className={`border rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col transition-colors ${
        isDark ? 'bg-[#0f141f] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Modal Header */}
        <div className={`sticky top-0 z-20 px-6 py-4 border-b flex items-center justify-between ${
          isDark ? 'bg-[#0a0e16]/95 border-slate-800' : 'bg-slate-50/95 border-slate-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  Institutional Trade Logic &amp; Risk Audit
                </h3>
                <span className={`px-2 py-0.5 rounded text-xs font-black uppercase border ${
                  isBuy
                    ? isDark
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : isDark
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {trade.signalType} {trade.instrument}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Transparent quantitative rationale powering recommendation {trade.id}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-sm">
          {loading || !data?.explanation ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
              <Sparkles className="w-7 h-7 text-indigo-500 animate-spin" />
              <span>Synthesizing Quantitative Market Intelligence...</span>
            </div>
          ) : (
            <>
              {/* Question 1: Why is this trade being suggested? */}
              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200/80'
              }`}>
                <div className="flex items-center space-x-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
                  <Compass className="w-4 h-4" />
                  <span>1. Why is this trade being suggested?</span>
                </div>
                <p className="text-slate-700 dark:text-slate-200 leading-relaxed text-xs">
                  {data.explanation.whySuggested}
                </p>
              </div>

              {/* Question 2: Which strategy triggered the signal? */}
              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200/80'
              }`}>
                <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">
                  <Award className="w-4 h-4" />
                  <span>2. Which strategy triggered the signal?</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {data.explanation.strategyTriggered.strategyName}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      isDark ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {data.explanation.strategyTriggered.strategyCategory}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {data.explanation.strategyTriggered.triggerLogic}
                  </p>
                </div>
              </div>

              {/* Question 3: Technical Indicators & Market Conditions */}
              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200/80'
              }`}>
                <div className="flex items-center space-x-2 text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-3">
                  <Layers className="w-4 h-4" />
                  <span>3. What technical indicators support the trade?</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.explanation.supportingIndicators.map((item, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border ${
                      isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                      <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{item.indicator}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.observation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question 4: Historical Strategy Win Rate */}
              <div className={`p-4 rounded-xl border ${
                isDark
                  ? 'bg-gradient-to-r from-amber-950/20 to-slate-900 border-amber-500/20'
                  : 'bg-gradient-to-r from-amber-50/70 to-slate-50 border-amber-200'
              }`}>
                <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">
                  <Award className="w-4 h-4" />
                  <span>4. Historical Backtested Winning Percentage</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-3">
                  <div className={`p-2.5 rounded-xl border ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Win Rate</span>
                    <span className="font-mono-numbers text-lg font-bold text-amber-600 dark:text-amber-300">
                      {data.explanation.historicalPerformance.winRate}%
                    </span>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Profit Factor</span>
                    <span className="font-mono-numbers text-lg font-bold text-emerald-600 dark:text-emerald-300">
                      {data.explanation.historicalPerformance.profitFactor}
                    </span>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Sample</span>
                    <span className="font-mono-numbers text-lg font-bold text-slate-900 dark:text-slate-100">
                      {data.explanation.historicalPerformance.totalHistoricalTrades}
                    </span>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg R:R</span>
                    <span className="font-mono-numbers text-lg font-bold text-teal-600 dark:text-teal-300">
                      {data.explanation.historicalPerformance.avgRiskReward}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {data.explanation.historicalPerformance.summary}
                </p>
              </div>

              {/* Questions 5 & 6: Potential Risk vs Expected Reward */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 5. Potential Risk */}
                <div className={`p-4 rounded-xl border ${
                  isDark ? 'bg-rose-950/20 border-rose-900/30' : 'bg-rose-50/60 border-rose-200/80'
                }`}>
                  <div className="flex items-center space-x-2 text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-2">
                    <ShieldAlert className="w-4 h-4" />
                    <span>5. Potential Risk Breakdown</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-rose-200 dark:border-rose-900/30 pb-1">
                      <span className="text-slate-500">Stop Loss:</span>
                      <span className="font-mono-numbers font-bold text-rose-600 dark:text-rose-300">{curr}{data.explanation.potentialRisk.stopLossPrice}</span>
                    </div>
                    <div className="flex justify-between border-b border-rose-200 dark:border-rose-900/30 pb-1">
                      <span className="text-slate-500">Points at Risk:</span>
                      <span className="font-mono-numbers font-bold text-rose-600 dark:text-rose-300">{data.explanation.potentialRisk.riskPoints} pts</span>
                    </div>
                    <div className="flex justify-between border-b border-rose-200 dark:border-rose-900/30 pb-1">
                      <span className="text-slate-500">Max Portfolio Risk:</span>
                      <span className="font-mono-numbers font-bold text-rose-600 dark:text-rose-300">{data.explanation.potentialRisk.totalAccountRisk} ({data.explanation.potentialRisk.riskPercentage})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Quantity:</span>
                      <span className="font-mono-numbers font-bold text-slate-900 dark:text-slate-100">{data.explanation.potentialRisk.suggestedLots} Lots ({data.explanation.potentialRisk.quantity} Units)</span>
                    </div>
                  </div>
                </div>

                {/* 6. Expected Reward */}
                <div className={`p-4 rounded-xl border ${
                  isDark ? 'bg-emerald-950/20 border-emerald-900/30' : 'bg-emerald-50/60 border-emerald-200/80'
                }`}>
                  <div className="flex items-center space-x-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">
                    <Target className="w-4 h-4" />
                    <span>6. Expected Reward (R:R {data.explanation.expectedReward.riskRewardRatio})</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className={`p-2 rounded-xl border ${
                      isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                      <div className="flex justify-between font-semibold">
                        <span className="text-emerald-600 dark:text-emerald-400">Target 1: {curr}{data.explanation.expectedReward.target1.price}</span>
                        <span className="font-mono-numbers text-emerald-600 dark:text-emerald-300">+{data.explanation.expectedReward.target1.projectedProfit}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{data.explanation.expectedReward.target1.action}</span>
                    </div>

                    <div className={`p-2 rounded-xl border ${
                      isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                      <div className="flex justify-between font-semibold">
                        <span className="text-emerald-600 dark:text-emerald-300">Target 2: {curr}{data.explanation.expectedReward.target2.price}</span>
                        <span className="font-mono-numbers text-emerald-600 dark:text-emerald-200">+{data.explanation.expectedReward.target2.projectedProfit}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{data.explanation.expectedReward.target2.action}</span>
                    </div>

                    <div className={`p-2 rounded-xl border ${
                      isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                      <div className="flex justify-between font-semibold">
                        <span className="text-teal-600 dark:text-teal-300">Target 3: {curr}{data.explanation.expectedReward.target3.price}</span>
                        <span className="font-mono-numbers text-teal-600 dark:text-teal-200">+{data.explanation.expectedReward.target3.projectedProfit}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{data.explanation.expectedReward.target3.action}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Question 7: Invalidation Conditions */}
              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200/80'
              }`}>
                <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>7. What conditions invalidate this trade?</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  {data.explanation.invalidationConditions.map((cond, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span>{cond}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Question 8: Why better than waiting? */}
              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200/80'
              }`}>
                <div className="flex items-center space-x-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>8. Competitive Edge &amp; Asymmetry</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                  {data.explanation.competitiveEdge}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`px-6 py-3.5 border-t flex items-center justify-between text-xs ${
          isDark ? 'bg-[#0a0e16] border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}>
          <span>AI Market Intelligence Synthesis • Real-Time Rule Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition cursor-pointer"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
}
