import React, { useState, useEffect } from 'react';
import { useMarket } from '../context/MarketContext';
import { formatCurrency } from '../utils/formatters';
import {
  SlidersHorizontal,
  ShieldAlert,
  Target,
  Award
} from 'lucide-react';

export default function PositionCalculator() {
  const { instruments, selectedInstrument, setSelectedInstrument, theme } = useMarket();
  const isDark = theme === 'dark';

  const [instrumentId, setInstrumentId] = useState(selectedInstrument || 'NIFTY');
  const activeInst = instruments.find(i => i.id === instrumentId) || instruments[0] || {
    lotSize: 25,
    currency: 'INR',
    currencySymbol: '₹',
    basePrice: 25000
  };

  const [accountCapital, setAccountCapital] = useState(
    activeInst.currency === 'USD' ? 25000 : 500000
  );
  const [riskPercent, setRiskPercent] = useState(1.0);
  const [entryPrice, setEntryPrice] = useState(activeInst.basePrice || 25000);
  const [stopLoss, setStopLoss] = useState(
    Number((activeInst.basePrice * 0.992).toFixed(2))
  );
  const [targetPrice, setTargetPrice] = useState(
    Number((activeInst.basePrice * 1.02).toFixed(2))
  );

  useEffect(() => {
    const inst = instruments.find(i => i.id === instrumentId);
    if (inst) {
      const isUSD = inst.currency === 'USD';
      setAccountCapital(isUSD ? 25000 : 500000);
      setEntryPrice(inst.basePrice);
      setStopLoss(Number((inst.basePrice * 0.992).toFixed(2)));
      setTargetPrice(Number((inst.basePrice * 1.02).toFixed(2)));
    }
  }, [instrumentId, instruments]);

  const curr = activeInst.currencySymbol || '₹';
  const riskPerUnit = Math.abs(entryPrice - stopLoss);
  const rewardPerUnit = Math.abs(targetPrice - entryPrice);
  const maxRiskCash = accountCapital * (riskPercent / 100);

  const rrRatio = riskPerUnit > 0 ? (rewardPerUnit / riskPerUnit).toFixed(2) : '1:2.0';

  let totalLots = 1;
  let totalUnits = activeInst.lotSize;

  if (riskPerUnit > 0) {
    const rawUnits = maxRiskCash / riskPerUnit;
    if (activeInst.lotSize >= 1) {
      totalLots = Math.max(1, Math.floor(rawUnits / activeInst.lotSize));
      totalUnits = totalLots * activeInst.lotSize;
    } else {
      totalUnits = Number(Math.max(0.01, rawUnits).toFixed(3));
      totalLots = Number((totalUnits / 0.01).toFixed(0));
    }
  }

  const totalRiskCash = Number((riskPerUnit * totalUnits).toFixed(2));
  const totalRewardCash = Number((rewardPerUnit * totalUnits).toFixed(2));
  const estimatedMargin = Number((totalUnits * entryPrice * 0.15).toFixed(2));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center space-x-2">
          <SlidersHorizontal className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Institutional Position Sizing &amp; Lot Calculator
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Precision lot sizing tailored to Indian market contract specifications (Nifty: 25, Bank Nifty: 15, Sensex: 10, MCX Crude: 100 bbls, BTC: 0.01).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Parameters Panel */}
        <div className={`lg:col-span-6 border rounded-2xl p-6 space-y-4 ${
          isDark ? 'bg-[#131722] border-slate-800 shadow-sm' : 'bg-white border-slate-200/90 shadow-xs'
        }`}>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
            Trade &amp; Risk Parameters
          </h3>

          {/* Instrument Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Trading Instrument
            </label>
            <select
              value={instrumentId}
              onChange={(e) => {
                setInstrumentId(e.target.value);
                setSelectedInstrument(e.target.value);
              }}
              className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 ${
                isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              {instruments.map(inst => (
                <option key={inst.id} value={inst.id}>
                  {inst.name} (1 Lot = {inst.lotSize} {inst.currency})
                </option>
              ))}
            </select>
          </div>

          {/* Account Capital */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Account Portfolio Capital ({curr})
            </label>
            <input
              type="number"
              value={accountCapital}
              onChange={(e) => setAccountCapital(Number(e.target.value))}
              className={`w-full border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-indigo-500 ${
                isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            />
          </div>

          {/* Risk Percentage */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Risk Per Trade:</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {riskPercent}% ({formatCurrency(maxRiskCash, activeInst.currency, curr)})
              </span>
            </div>
            <input
              type="range"
              min="0.25"
              max="5.0"
              step="0.25"
              value={riskPercent}
              onChange={(e) => setRiskPercent(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          {/* Entry, Stop Loss, Target */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Entry Price</label>
              <input
                type="number"
                value={entryPrice}
                onChange={(e) => setEntryPrice(Number(e.target.value))}
                className={`w-full border rounded-xl px-2.5 py-1.5 text-xs font-mono font-semibold ${
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-rose-600 dark:text-rose-400 mb-1">Stop Loss</label>
              <input
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(Number(e.target.value))}
                className={`w-full border rounded-xl px-2.5 py-1.5 text-xs font-mono font-semibold ${
                  isDark ? 'bg-slate-900 border-rose-900/40 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-1">Target Price</label>
              <input
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(Number(e.target.value))}
                className={`w-full border rounded-xl px-2.5 py-1.5 text-xs font-mono font-semibold ${
                  isDark ? 'bg-slate-900 border-emerald-900/40 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Output Sizing Results Card */}
        <div className={`lg:col-span-6 border rounded-2xl p-6 space-y-4 ${
          isDark
            ? 'bg-[#131722] border-indigo-500/40 shadow-sm'
            : 'bg-white border-indigo-300 shadow-md ring-1 ring-indigo-500/10'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-1.5">
              <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Recommended Position Allocation</span>
            </h3>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-lg font-bold border ${
              isDark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}>
              OPTIMAL ASYMMETRY
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200/80'
            }`}>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Recommended Lots</span>
              <span className="font-mono-numbers text-xl font-black text-indigo-600 dark:text-amber-300">
                {totalLots} Lots
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                Total: {totalUnits} Contracts / Units
              </span>
            </div>

            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200/80'
            }`}>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Risk-Reward Ratio</span>
              <span className="font-mono-numbers text-xl font-black text-teal-600 dark:text-teal-300">
                1:{rrRatio}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                {rewardPerUnit.toFixed(2)} pts / {riskPerUnit.toFixed(2)} pts
              </span>
            </div>

            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-rose-950/20 border-rose-900/30' : 'bg-rose-50 border-rose-200/80'
            }`}>
              <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block mb-0.5">Maximum Cash Loss</span>
              <span className="font-mono-numbers text-lg font-bold text-rose-600 dark:text-rose-300">
                {formatCurrency(totalRiskCash, activeInst.currency, curr)}
              </span>
              <span className="text-[10px] text-rose-500 block mt-0.5">
                Exactly {((totalRiskCash / accountCapital) * 100).toFixed(2)}% of Portfolio
              </span>
            </div>

            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-emerald-950/20 border-emerald-900/30' : 'bg-emerald-50 border-emerald-200/80'
            }`}>
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">Projected Reward</span>
              <span className="font-mono-numbers text-lg font-bold text-emerald-600 dark:text-emerald-300">
                +{formatCurrency(totalRewardCash, activeInst.currency, curr)}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5">
                +{((totalRewardCash / accountCapital) * 100).toFixed(2)}% Portfolio Gain
              </span>
            </div>
          </div>

          <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${
            isDark ? 'bg-slate-950/70 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <div className="flex justify-between">
              <span>Contract Standard Lot Size:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{activeInst.lotSize} Units</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Margin Requirement:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(estimatedMargin, activeInst.currency, curr)}</span>
            </div>
            <div className="flex justify-between">
              <span>Account Capital Remaining:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(accountCapital - totalRiskCash, activeInst.currency, curr)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
