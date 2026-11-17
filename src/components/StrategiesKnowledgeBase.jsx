import React from 'react';
import { useMarket } from '../context/MarketContext';
import {
  Layers,
  Award,
  CheckCircle2,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

export default function StrategiesKnowledgeBase({ onOpenBacktest }) {
  const { strategies, theme } = useMarket();
  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center space-x-2">
          <Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Institutional Strategy Knowledge Base &amp; Rules Engine
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Catalog of well-established, mathematically tested trading strategies incorporating price action, market structure, volume profile, and trend momentum.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {strategies.map(strat => (
          <div
            key={strat.id}
            className={`border rounded-2xl p-6 flex flex-col justify-between transition space-y-4 ${
              isDark
                ? 'bg-[#131722] border-slate-800 hover:border-slate-700 shadow-sm'
                : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-xs'
            }`}
          >
            <div>
              {/* Category & Win Rate Header */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded ${
                  isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  {strat.category}
                </span>
                <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold font-mono ${
                  isDark
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}>
                  <Award className="w-3.5 h-3.5" />
                  <span>Win Rate: {strat.historicalWinRate}%</span>
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-2">
                {strat.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                {strat.description}
              </p>

              {/* Stats Bar */}
              <div className={`grid grid-cols-3 gap-2 p-3 rounded-xl border mb-4 font-mono-numbers text-center ${
                isDark ? 'bg-slate-950/70 border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <span className="text-[9px] uppercase text-slate-400 block">Profit Factor</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{strat.profitFactor}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase text-slate-400 block">Avg R:R</span>
                  <span className="text-xs font-bold text-teal-600 dark:text-teal-300">{strat.avgRiskReward}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase text-slate-400 block">Max Drawdown</span>
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{strat.maxDrawdown}%</span>
                </div>
              </div>

              {/* Entry Rules */}
              <div className="space-y-2 mb-3">
                <span className="text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider block">
                  Validated Entry Rules
                </span>
                <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  {strat.entryRules?.map((rule, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Exit Rules */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase text-amber-600 dark:text-amber-400 tracking-wider block">
                  Risk Management &amp; Exits
                </span>
                <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  {strat.exitRules?.map((rule, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Backtest Button */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <button
                onClick={() => onOpenBacktest(strat.id)}
                className={`w-full flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  isDark
                    ? 'bg-indigo-600/15 text-indigo-400 border-indigo-500/30 hover:bg-indigo-600/25'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                <span>Backtest This Strategy on Real Data</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
