import React, { useState, useEffect } from 'react';
import { useMarket } from '../context/MarketContext';
import {
  Radio,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export default function MarketScanner({ onSelectAsset }) {
  const { setSelectedInstrument, setSelectedTimeframe, theme } = useMarket();
  const isDark = theme === 'dark';

  const [scannerData, setScannerData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchScanner = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/scanner');
      const data = await res.json();
      if (data.success) {
        setScannerData(data.scanner);
      }
    } catch (err) {
      console.error('Failed to fetch scanner data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScanner();
    const interval = setInterval(fetchScanner, 10000);
    return () => clearInterval(interval);
  }, []);

  const timeframes = ['1m', '5m', '15m', '1h', '1D'];

  const getBadge = (trend) => {
    if (trend === 'STRONG_BULLISH') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
          <ArrowUpRight className="w-3 h-3 mr-0.5" />
          <span>STRONG BULL</span>
        </span>
      );
    }
    if (trend === 'MODERATE_BULLISH') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
          MOD BULL
        </span>
      );
    }
    if (trend === 'STRONG_BEARISH') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center space-x-1">
          <ArrowDownRight className="w-3 h-3 mr-0.5" />
          <span>STRONG BEAR</span>
        </span>
      );
    }
    if (trend === 'MODERATE_BEARISH') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
          MOD BEAR
        </span>
      );
    }
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
        isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
      }`}>
        NEUTRAL
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Radio className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              AI Multi-Timeframe Trend &amp; Confluence Scanner
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Simultaneous multi-interval matrix monitoring trend momentum, RSI momentum, and SuperTrend direction across all 5 assets.
          </p>
        </div>

        <button
          onClick={fetchScanner}
          disabled={isLoading}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Scanner</span>
        </button>
      </div>

      {/* Main Scanner Matrix Table */}
      <div className={`border rounded-2xl overflow-hidden ${
        isDark ? 'bg-[#131722] border-slate-800 shadow-sm' : 'bg-white border-slate-200/90 shadow-xs'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className={`uppercase font-mono border-b ${
              isDark ? 'bg-[#090d14] text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}>
              <tr>
                <th className="py-3 px-4">Asset / Market</th>
                <th className="py-3 px-4">Live Price</th>
                {timeframes.map(tf => (
                  <th key={tf} className="py-3 px-4 text-center">
                    {tf} Timeframe
                  </th>
                ))}
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              isDark ? 'divide-slate-800/60' : 'divide-slate-100'
            }`}>
              {scannerData.map(item => {
                let bullCount = 0;
                let bearCount = 0;
                timeframes.forEach(tf => {
                  const state = item.timeframes[tf]?.trend;
                  if (state?.includes('BULL')) bullCount++;
                  if (state?.includes('BEAR')) bearCount++;
                });

                return (
                  <tr key={item.instrumentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        Confluence: {bullCount > bearCount ? `${bullCount}/5 Bullish` : `${bearCount}/5 Bearish`}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono-numbers font-bold text-slate-900 dark:text-slate-100">
                      {item.currencySymbol}{item.currentPrice}
                    </td>

                    {timeframes.map(tf => {
                      const tfInfo = item.timeframes[tf];
                      return (
                        <td key={tf} className="py-3.5 px-4 text-center">
                          <div className="flex flex-col items-center space-y-1">
                            {getBadge(tfInfo?.trend)}
                            <span className="text-[10px] font-mono-numbers text-slate-400">
                              RSI: {tfInfo?.rsi || '--'}
                            </span>
                          </div>
                        </td>
                      );
                    })}

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedInstrument(item.instrumentId);
                          setSelectedTimeframe('15m');
                          if (onSelectAsset) onSelectAsset();
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                          isDark
                            ? 'bg-indigo-600/15 text-indigo-400 border-indigo-500/30 hover:bg-indigo-600/25'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                        }`}
                      >
                        Trade Chart
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
