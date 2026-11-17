import React, { useState, useEffect } from 'react';
import { useMarket } from '../context/MarketContext';
import { formatCurrency } from '../utils/formatters';
import {
  Layers,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function OptionChainTable({ onSelectTradeCreated }) {
  const {
    optionChainData,
    isOptionChainLoading,
    fetchOptionChain,
    generateOptionTrade,
    theme
  } = useMarket();

  const [selectedAsset, setSelectedAsset] = useState('NIFTY');
  const [generatingKey, setGeneratingKey] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const isDark = theme === 'dark';

  useEffect(() => {
    fetchOptionChain(selectedAsset);
  }, [selectedAsset]);

  const handleCreateOptionTrade = async (strike, optionType) => {
    const key = `${strike}-${optionType}`;
    setGeneratingKey(key);
    try {
      const trade = await generateOptionTrade(selectedAsset, strike, optionType);
      if (trade) {
        setSuccessMsg(`Generated ${trade.instrument} into Pending Approvals!`);
        setTimeout(() => setSuccessMsg(null), 4000);
        if (onSelectTradeCreated) {
          onSelectTradeCreated(trade);
        }
      }
    } finally {
      setGeneratingKey(null);
    }
  };

  const assetList = [
    { id: 'NIFTY', name: 'NIFTY 50 Options', step: 50 },
    { id: 'BANKNIFTY', name: 'BANK NIFTY Options', step: 100 },
    { id: 'SENSEX', name: 'SENSEX Options', step: 100 }
  ];

  return (
    <div className="space-y-4">
      {/* Top Asset & Expiry Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          {assetList.map(a => (
            <button
              key={a.id}
              onClick={() => setSelectedAsset(a.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                selectedAsset === a.id
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              {a.name}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <button
            onClick={() => fetchOptionChain(selectedAsset)}
            disabled={isOptionChainLoading}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-600'
            }`}
            title="Refresh Option Chain"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isOptionChainLoading ? 'animate-spin text-indigo-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Spot & PCR Summary Strip */}
      {optionChainData && (
        <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
          isDark ? 'bg-[#0f141f] border-slate-800' : 'bg-slate-50 border-slate-200/90'
        }`}>
          <div className="flex items-center space-x-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Underlying Spot</span>
              <span className="font-mono-numbers text-sm font-extrabold text-slate-900 dark:text-white">
                ₹{optionChainData.spotPrice?.toLocaleString()}
              </span>
            </div>
            <div className="border-l border-slate-300 dark:border-slate-800 pl-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Nearest Expiry</span>
              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {optionChainData.expiry}
              </span>
            </div>
            <div className="border-l border-slate-300 dark:border-slate-800 pl-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">ATM Strike</span>
              <span className="font-mono text-xs font-bold text-amber-500">
                {optionChainData.atmStrike}
              </span>
            </div>
            <div className="border-l border-slate-300 dark:border-slate-800 pl-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Put Call Ratio (PCR)</span>
              <span className={`font-mono text-xs font-bold ${
                optionChainData.pcr >= 1.0 ? 'text-emerald-500' : 'text-amber-500'
              }`}>
                {optionChainData.pcr} ({optionChainData.pcr >= 1.0 ? 'Bullish Sentiment' : 'Neutral / Mild Bearish'})
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center space-x-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Click <strong>Trade CE</strong> or <strong>Trade PE</strong> on any strike to push an AI option setup to Pending Approvals</span>
          </div>
        </div>
      )}

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Option Chain Data Matrix */}
      <div className={`border rounded-2xl overflow-hidden ${
        isDark ? 'bg-[#131722] border-slate-800 shadow-sm' : 'bg-white border-slate-200/90 shadow-xs'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              {/* Top grouping row */}
              <tr className={`border-b text-center font-bold uppercase text-[10px] tracking-wider ${
                isDark ? 'bg-[#090d14] text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                <th colSpan="5" className="py-2 border-r border-slate-700/50 bg-emerald-950/20 text-emerald-400">
                  CALL OPTIONS (CE) - Bullish Leg
                </th>
                <th className="py-2 bg-slate-900/60 text-white border-r border-slate-700/50">
                  STRIKE
                </th>
                <th colSpan="5" className="py-2 bg-rose-950/20 text-rose-400">
                  PUT OPTIONS (PE) - Bearish Leg
                </th>
              </tr>
              {/* Column labels */}
              <tr className={`border-b uppercase font-mono text-[10px] ${
                isDark ? 'bg-[#0b0e14] text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}>
                <th className="py-2 px-2.5 text-left">Action</th>
                <th className="py-2 px-2.5">OI</th>
                <th className="py-2 px-2.5">Delta</th>
                <th className="py-2 px-2.5">IV</th>
                <th className="py-2 px-2.5 text-right font-bold text-emerald-500 border-r border-slate-700/40">Call LTP</th>

                <th className="py-2 px-3 text-center font-bold text-slate-900 dark:text-white bg-slate-800/30 border-r border-slate-700/40">
                  STRIKE PRICE
                </th>

                <th className="py-2 px-2.5 text-left font-bold text-rose-500">Put LTP</th>
                <th className="py-2 px-2.5">IV</th>
                <th className="py-2 px-2.5">Delta</th>
                <th className="py-2 px-2.5">OI</th>
                <th className="py-2 px-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-mono-numbers text-xs ${
              isDark ? 'divide-slate-800/60' : 'divide-slate-100'
            }`}>
              {optionChainData?.strikes?.map(row => {
                const isAtm = row.isAtm;
                const callKey = `${row.strike}-CE`;
                const putKey = `${row.strike}-PE`;

                return (
                  <tr
                    key={row.strike}
                    className={`transition-colors ${
                      isAtm
                        ? isDark
                          ? 'bg-amber-500/10 hover:bg-amber-500/15 font-bold'
                          : 'bg-amber-50 hover:bg-amber-100/70 font-bold'
                        : isDark
                        ? 'hover:bg-slate-800/30'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Call Action */}
                    <td className="py-2 px-2.5">
                      <button
                        onClick={() => handleCreateOptionTrade(row.strike, 'CE')}
                        disabled={generatingKey === callKey}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer border ${
                          isDark
                            ? 'bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 border-emerald-500/30'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
                        }`}
                      >
                        {generatingKey === callKey ? 'Adding...' : 'Trade CE'}
                      </button>
                    </td>
                    <td className="py-2 px-2.5 text-slate-500 dark:text-slate-400 text-[11px]">{row.call.oi.toLocaleString()}</td>
                    <td className="py-2 px-2.5 text-slate-600 dark:text-slate-300 font-semibold">{row.call.delta}</td>
                    <td className="py-2 px-2.5 text-slate-400 text-[10px]">{row.call.iv}</td>
                    <td className="py-2 px-2.5 text-right font-extrabold text-emerald-600 dark:text-emerald-400 border-r border-slate-700/40">
                      ₹{row.call.ltp}
                    </td>

                    {/* Center Strike Price */}
                    <td className={`py-2 px-3 text-center font-bold border-r border-slate-700/40 font-mono ${
                      isAtm ? 'text-amber-500 dark:text-amber-400 font-extrabold text-sm' : 'text-slate-900 dark:text-slate-100'
                    }`}>
                      <div className="flex items-center justify-center space-x-1">
                        <span>{row.strike}</span>
                        {isAtm && (
                          <span className="px-1 py-0.2 rounded text-[9px] font-black bg-amber-500 text-slate-950 uppercase tracking-tight">
                            ATM
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Put LTP & Details */}
                    <td className="py-2 px-2.5 text-left font-extrabold text-rose-600 dark:text-rose-400">
                      ₹{row.put.ltp}
                    </td>
                    <td className="py-2 px-2.5 text-slate-400 text-[10px]">{row.put.iv}</td>
                    <td className="py-2 px-2.5 text-slate-600 dark:text-slate-300 font-semibold">{row.put.delta}</td>
                    <td className="py-2 px-2.5 text-slate-500 dark:text-slate-400 text-[11px]">{row.put.oi.toLocaleString()}</td>
                    {/* Put Action */}
                    <td className="py-2 px-2.5 text-right">
                      <button
                        onClick={() => handleCreateOptionTrade(row.strike, 'PE')}
                        disabled={generatingKey === putKey}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer border ${
                          isDark
                            ? 'bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 border-rose-500/30'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
                        }`}
                      >
                        {generatingKey === putKey ? 'Adding...' : 'Trade PE'}
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
  );
}

