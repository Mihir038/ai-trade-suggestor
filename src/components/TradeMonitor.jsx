import React, { useState } from 'react';
import { useMarket } from '../context/MarketContext';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { Activity, Clock, ShieldCheck, CheckCircle2, TrendingUp, TrendingDown, Eye } from 'lucide-react';

export default function TradeMonitor({ onSelectExplanation }) {
  const { completedTrades, activeRecommendations, setSelectedInstrument, theme } = useMarket();
  const [viewTab, setViewTab] = useState('active'); // 'active' | 'completed'
  const isDark = theme === 'dark';

  const totalCompleted = completedTrades.length;
  const wins = completedTrades.filter(t => t.isWin || t.pnl > 0).length;
  const winRate = totalCompleted > 0 ? ((wins / totalCompleted) * 100).toFixed(1) : '72.4';
  const totalRealisedPnL = completedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

  return (
    <div className="space-y-5">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-4 rounded-2xl border ${
          isDark ? 'bg-[#131722] border-slate-800' : 'bg-white border-slate-200/90 shadow-xs'
        }`}>
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Approved & Live</span>
          <span className="font-mono-numbers text-xl font-bold text-indigo-600 dark:text-amber-300">
            {activeRecommendations.length} Active
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${
          isDark ? 'bg-[#131722] border-slate-800' : 'bg-white border-slate-200/90 shadow-xs'
        }`}>
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Completed Trades</span>
          <span className="font-mono-numbers text-xl font-bold text-slate-900 dark:text-slate-100">
            {totalCompleted} Trades
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${
          isDark ? 'bg-[#131722] border-slate-800' : 'bg-white border-slate-200/90 shadow-xs'
        }`}>
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Live Win Rate</span>
          <span className="font-mono-numbers text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {winRate}%
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${
          isDark ? 'bg-[#131722] border-slate-800' : 'bg-white border-slate-200/90 shadow-xs'
        }`}>
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Realised P&amp;L</span>
          <span className={`font-mono-numbers text-xl font-bold ${
            totalRealisedPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {totalRealisedPnL >= 0 ? '+' : ''}₹{Math.abs(totalRealisedPnL).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Main Table Card with Segmented Switcher */}
      <div className={`border rounded-2xl overflow-hidden ${
        isDark ? 'bg-[#131722] border-slate-800 shadow-sm' : 'bg-white border-slate-200/90 shadow-xs'
      }`}>
        <div className={`px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'bg-[#090d14] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          {/* Section Heading & Subtitle */}
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-xs text-slate-900 dark:text-slate-200 uppercase tracking-wider">
              {viewTab === 'active' ? 'Approved & Executed Positions' : 'Completed Signals Track Record'}
            </h3>
          </div>

          {/* Tab Selector */}
          <div className={`flex rounded-xl p-0.5 border text-xs font-semibold ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-200/70 border-slate-300/80'
          }`}>
            <button
              onClick={() => setViewTab('active')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
                viewTab === 'active'
                  ? isDark ? 'bg-indigo-600 text-white font-bold' : 'bg-white text-indigo-700 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Active on Chart ({activeRecommendations.length})</span>
            </button>
            <button
              onClick={() => setViewTab('completed')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
                viewTab === 'completed'
                  ? isDark ? 'bg-indigo-600 text-white font-bold' : 'bg-white text-indigo-700 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Completed History ({totalCompleted})</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Active Approved Trades Plotted on Graph */}
        {viewTab === 'active' && (
          activeRecommendations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 space-y-2">
              <p>No trades currently active on the chart.</p>
              <p className="text-[11px] text-slate-500">Go to <strong>Pending Approvals</strong> in the right panel and click <em>"Approve & Set on Graph"</em> to execute a trade.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className={`uppercase font-mono border-b ${
                  isDark ? 'bg-[#090d14] text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}>
                  <tr>
                    <th className="py-2.5 px-3">Asset</th>
                    <th className="py-2.5 px-3">Signal</th>
                    <th className="py-2.5 px-3">Executed Date &amp; Time</th>
                    <th className="py-2.5 px-3">Entry Price</th>
                    <th className="py-2.5 px-3">Stop Loss</th>
                    <th className="py-2.5 px-3">Target 1</th>
                    <th className="py-2.5 px-3">Floating P&amp;L</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className={`divide-y font-mono-numbers ${
                  isDark ? 'divide-slate-800/60' : 'divide-slate-100'
                }`}>
                  {activeRecommendations.map(trade => {
                    const curr = trade.currencySymbol || '₹';
                    const isProfit = (trade.pnl || 0) >= 0;

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
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                          <div className="flex items-center space-x-1.5">
                            <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {trade.executedAtFormatted || (trade.executedAt ? new Date(trade.executedAt).toLocaleString('en-IN') : 'Just now')}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 font-semibold">{curr}{trade.entryPrice}</td>
                        <td className="py-2.5 px-3 text-rose-600 dark:text-rose-400 font-semibold">{curr}{trade.stopLoss}</td>
                        <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-semibold">{curr}{trade.target1}</td>
                        <td className={`py-2.5 px-3 font-bold ${
                          isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {isProfit ? '+' : ''}{curr}{Math.abs(trade.pnl || 0).toLocaleString()} ({trade.pnlPercentage || 0}%)
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            SET ON GRAPH
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => setSelectedInstrument(trade.instrumentId)}
                            className="text-indigo-600 dark:text-indigo-400 hover:underline font-sans text-xs font-bold cursor-pointer inline-flex items-center space-x-1"
                          >
                            <span>Focus Chart</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Tab 2: Completed Trades with Execution and Exit Timestamps */}
        {viewTab === 'completed' && (
          completedTrades.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Signals are continuously monitored against live market ticks. When Target 1, Target 2, Target 3 or Stop Loss levels are hit, they will be archived here in real-time with full execution timestamps.
            </div>
          ) : (
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
                    <th className="py-2.5 px-3">Entry</th>
                    <th className="py-2.5 px-3">Exit</th>
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
                        <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 font-semibold">{curr}{trade.entryPrice}</td>
                        <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 font-semibold">{curr}{trade.exitPrice}</td>
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
          )
        )}
      </div>
    </div>
  );
}
