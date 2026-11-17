import React from 'react';
import { useMarket } from '../context/MarketContext';
import {
  LayoutGrid,
  TrendingUp,
  Calendar,
  BarChart3,
  Radio,
  Brain,
  SlidersHorizontal,
  History,
  Moon,
  Sun,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { theme, toggleTheme, connectionStatus, latencyMs, isNetworkOnline, pendingApprovals } = useMarket();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'live-chart', label: 'Live Charts & Signals', icon: TrendingUp },
    { id: 'trades', label: 'Trades', icon: ShieldCheck, badge: pendingApprovals?.length || 0 },
    { id: 'backtest', label: 'Backtest Lab', icon: BarChart3 },
    { id: 'scanner', label: 'AI Market Scanner', icon: Radio },
    { id: 'strategies', label: 'Strategies Knowledge', icon: Brain },
    { id: 'calculator', label: 'Position Sizing', icon: SlidersHorizontal },
    { id: 'history', label: 'Completed Trades', icon: History }
  ];

  const isDark = theme === 'dark';

  return (
    <aside className={`w-64 shrink-0 flex flex-col justify-between border-r transition-colors duration-200 select-none ${
      isDark
        ? 'bg-[#0f141f] border-slate-800 text-slate-200'
        : 'bg-white border-slate-200 text-slate-700'
    }`}>
      {/* Top: Logo Branding */}
      <div>
        <div className="p-6 pb-4 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
            <TrendingUp className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight leading-none text-slate-900 dark:text-white">
              Trading Journal
            </h1>
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">
              AI Trade Intelligence
            </span>
          </div>
        </div>

        {/* Live Feed Status Pill */}
        <div className="px-6 py-2">
          <div className={`px-3 py-1.5 rounded-xl text-xs flex items-center justify-between border ${
            isDark
              ? 'bg-slate-900/60 border-slate-800 text-slate-400'
              : 'bg-slate-50 border-slate-200/80 text-slate-600'
          }`}>
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isNetworkOnline ? 'bg-emerald-400 opacity-75' : 'bg-rose-400 opacity-75'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isNetworkOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              </span>
              <span className="font-medium text-[11px]">
                {!isNetworkOnline
                  ? 'Offline (Paused)'
                  : connectionStatus === 'connected'
                  ? 'Genuine Feeds'
                  : 'Connecting...'}
              </span>
            </div>
            <span className={`font-mono text-[10px] font-bold ${isNetworkOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {!isNetworkOnline ? 'Offline' : `${latencyMs}ms`}
            </span>
          </div>
        </div>

        {/* Nav Items List */}
        <nav className="px-3 py-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? isDark
                      ? 'bg-indigo-600/15 text-indigo-400 font-bold'
                      : 'bg-[#ede9fe] text-indigo-700 font-bold'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400 stroke-[2.2]' : 'text-slate-400 stroke-[1.8]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-amber-500/20 text-amber-500 dark:bg-amber-400/20 dark:text-amber-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Profile & Theme Toggle */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 space-y-3">
        {/* User Card */}
        <div className="flex items-center space-x-3 px-2 py-1">
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
            T
          </div>
          <div className="overflow-hidden">
            <div className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-tight">
              TIGER TRADER
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              admin@jaymaharaj.in
            </div>
          </div>
        </div>

        {/* Theme Toggle Button (Light/Dark Mode) */}
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
          }`}
          title="Toggle Light / Dark Theme"
        >
          <div className="flex items-center space-x-2">
            {isDark ? (
              <Moon className="w-4 h-4 text-indigo-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
            <span>Theme: {isDark ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
            isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-700 shadow-xs'
          }`}>
            {isDark ? 'Dark' : 'Light'}
          </span>
        </button>
      </div>
    </aside>
  );
}

